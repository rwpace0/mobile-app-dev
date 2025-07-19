class PriorityQueue {
  constructor() {
    this.high = [];
    this.medium = [];
    this.low = [];
    this.processing = false;
  }

  enqueue(task, priority = 'medium') {
    const queue = this[priority];
    if (!queue) throw new Error(`Invalid priority: ${priority}`);
    queue.push(task);
    this.processNext();
  }

  async processNext() {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.high.length || this.medium.length || this.low.length) {
        const task = this.high.shift() || this.medium.shift() || this.low.shift();
        if (task) {
          try {
            await task();
          } catch (error) {
            console.error('Task execution failed:', error);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  clear() {
    this.high = [];
    this.medium = [];
    this.low = [];
  }
}

class BackgroundProcessor {
  constructor() {
    this.taskQueue = new PriorityQueue();
    this.prefetchBuffer = new Set();
    this.prefetchSize = 15; // Number of workouts to prefetch
    this.isProcessing = false;
    this.currentScrollDirection = 'down';
    this.processingInterval = setInterval(() => this.processQueue(), 1000);
  }

  // Task Queue Management
  addTask(task, priority = 'normal') {
    if (priority === 'high') {
      this.taskQueue.high.unshift(task);
    } else {
      this.taskQueue.enqueue(task, priority);
    }
    this.processQueue();
  }

  clearTasks() {
    this.taskQueue.clear();
  }

  // Smart Prefetching
  updateScrollDirection(direction) {
    this.currentScrollDirection = direction;
  }

  shouldPrefetch(workoutId) {
    return !this.prefetchBuffer.has(workoutId);
  }

  markPrefetched(workoutId) {
    this.prefetchBuffer.add(workoutId);
    // Limit buffer size
    if (this.prefetchBuffer.size > this.prefetchSize * 2) {
      const [firstItem] = this.prefetchBuffer;
      this.prefetchBuffer.delete(firstItem);
    }
  }

  // Background Summary Calculation
  async calculateMissingSummaries(workouts, dbManager) {
    const workoutsWithoutSummary = workouts.filter(w => !w.summary_data);
    
    workoutsWithoutSummary.forEach(workout => {
      this.addTask(async () => {
        try {
          const [existingSummary] = await dbManager.query(`
            SELECT * FROM workout_summaries WHERE workout_id = ?
          `, [workout.workout_id]);

          if (!existingSummary) {
            const workoutExercises = await dbManager.query(`
              SELECT we.*, e.name, e.muscle_group
              FROM workout_exercises we
              LEFT JOIN exercises e ON we.exercise_id = e.exercise_id
              WHERE we.workout_id = ?
              ORDER BY we.exercise_order
            `, [workout.workout_id]);

            const sets = await dbManager.query(`
              SELECT * FROM sets WHERE workout_id = ?
            `, [workout.workout_id]);

            let totalVolume = 0;
            const exerciseDetails = workoutExercises.map(exercise => {
              const exerciseSets = sets.filter(s => 
                s.workout_exercises_id === exercise.workout_exercises_id
              );

              const exerciseVolume = exerciseSets.reduce((total, set) => 
                total + ((set.weight || 0) * (set.reps || 0)), 0
              );

              totalVolume += exerciseVolume;

              return {
                id: exercise.exercise_id,
                name: exercise.name,
                sets: exerciseSets.length,
                volume: exerciseVolume
              };
            });

            const summaryData = {
              exercises: exerciseDetails,
              totalVolume,
              exerciseCount: workoutExercises.length
            };

            await dbManager.execute(`
              INSERT INTO workout_summaries 
              (workout_id, summary_data, total_volume, exercise_count, last_calculated_at)
              VALUES (?, ?, ?, ?, ?)
            `, [
              workout.workout_id,
              JSON.stringify(summaryData),
              totalVolume,
              workoutExercises.length,
              new Date().toISOString()
            ]);
          }
        } catch (error) {
          console.error('Failed to calculate summary:', error);
        }
      }, 'low');
    });
  }

  // Prefetch workout details
  prefetchWorkoutDetails(workoutIds, workoutAPI) {
    const idsToFetch = workoutIds.filter(id => this.shouldPrefetch(id));
    
    for (const id of idsToFetch) {
      this.addTask(async () => {
        try {
          await workoutAPI.ensureWorkoutDetails(id);
          this.markPrefetched(id);
        } catch (error) {
          console.error('Failed to prefetch workout:', error);
        }
      }, 'low');
    }
  }

  // Smart prefetch based on scroll direction
  smartPrefetch(visibleWorkouts, allWorkouts, workoutAPI) {
    if (!visibleWorkouts?.length || !allWorkouts?.length) return;

    const visibleIds = new Set(visibleWorkouts.map(w => w.workout_id));
    const allIds = allWorkouts.map(w => w.workout_id);
    
    // Find the range of visible workouts
    const firstVisibleIndex = allIds.findIndex(id => visibleIds.has(id));
    const lastVisibleIndex = allIds.findLastIndex(id => visibleIds.has(id));

    if (firstVisibleIndex === -1 || lastVisibleIndex === -1) return;

    // Determine which workouts to prefetch based on scroll direction
    let prefetchIds = [];
    const prefetchCount = 10; // Increased from 3 to 10 for more aggressive prefetching

    if (this.currentScrollDirection === 'down') {
      const endIndex = Math.min(lastVisibleIndex + prefetchCount + 1, allIds.length);
      prefetchIds = allIds.slice(lastVisibleIndex + 1, endIndex);
    } else {
      const startIndex = Math.max(0, firstVisibleIndex - prefetchCount);
      prefetchIds = allIds.slice(startIndex, firstVisibleIndex);
    }

    // Queue prefetch tasks with medium priority instead of low
    prefetchIds.forEach(id => {
      if (this.shouldPrefetch(id)) {
        this.addTask(async () => {
          try {
            await workoutAPI.ensureWorkoutDetails(id);
            this.markPrefetched(id);
          } catch (error) {
            console.error('Failed to prefetch workout:', error);
          }
        }, 'medium'); // Changed from 'low' to 'medium' priority
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.taskQueue.high.length === 0) return;

    this.isProcessing = true;
    try {
      const task = this.taskQueue.high.shift();
      await task();
    } catch (error) {
      console.error('Background task failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  scheduleSync(resource, data) {
    // Import syncManager lazily to avoid circular dependencies
    import('./syncManager').then(({ syncManager }) => {
      // Add to sync queue with a delay
      setTimeout(() => {
        syncManager.syncIfNeeded(resource, true);
      }, 5 * 60 * 1000); // 5 minute delay for local-first approach
    }).catch(error => {
      console.error('[BackgroundProcessor] Failed to schedule sync:', error);
    });
  }

  destroy() {
    // Clear the processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Clear all task queues
    this.taskQueue.clear();

    // Clear prefetch buffer
    this.prefetchBuffer.clear();

    // Reset processing state
    this.isProcessing = false;

    console.log('[BackgroundProcessor] Destroyed and cleaned up');
  }
}

export const backgroundProcessor = new BackgroundProcessor();