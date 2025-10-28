class PriorityQueue {
  constructor() {
    this.high = [];
    this.medium = [];
    this.low = [];
    this.processing = false;
  }

  enqueue(task, priority = "medium") {
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
        const task =
          this.high.shift() || this.medium.shift() || this.low.shift();
        if (task) {
          try {
            await task();
          } catch (error) {
            console.error("Task execution failed:", error);
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
    this.isProcessing = false;
    this.processingInterval = setInterval(() => this.processQueue(), 2000);
  }

  // Task Queue Management
  addTask(task, priority = "normal") {
    if (priority === "high") {
      this.taskQueue.high.unshift(task);
    } else {
      this.taskQueue.enqueue(task, priority);
    }
    this.processQueue();
  }

  clearTasks() {
    this.taskQueue.clear();
  }

  async processQueue() {
    if (this.isProcessing || this.taskQueue.high.length === 0) return;

    this.isProcessing = true;
    try {
      const task = this.taskQueue.high.shift();
      await task();
    } catch (error) {
      console.error("Background task failed:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  scheduleSync(resource, data) {
    // Import syncManager lazily to avoid circular dependencies
    import("./syncManager")
      .then(({ syncManager }) => {
        // Add to sync queue with a delay
        setTimeout(() => {
          syncManager.syncIfNeeded(resource, true);
        }, 5 * 60 * 1000); // 5 minute delay for local-first approach
      })
      .catch((error) => {
        console.error("[BackgroundProcessor] Failed to schedule sync:", error);
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

    // Reset processing state
    this.isProcessing = false;

    console.log("[BackgroundProcessor] Destroyed and cleaned up");
  }
}

export const backgroundProcessor = new BackgroundProcessor();
