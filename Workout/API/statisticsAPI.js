import { dbManager } from "./local/dbManager";
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfWeek,
  startOfMonth,
  parseISO,
} from "date-fns";

class StatisticsAPI {
  constructor() {
    this.db = dbManager;
  }

  /**
   * Get the date range for a given period
   * @param {string} period - '7d', '1m', '3m', '6m', '1y', 'all'
   * @returns {Date|null} - Start date or null for all time
   */
  getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
      case "7d":
        return subDays(now, 7);
      case "1m":
        return subMonths(now, 1);
      case "3m":
        return subMonths(now, 3);
      case "6m":
        return subMonths(now, 6);
      case "1y":
        return subYears(now, 1);
      case "all":
      default:
        return null;
    }
  }

  /**
   * Get workout counts grouped by period
   * @param {string} period - Time period to filter
   * @param {string} groupBy - 'day', 'week', 'month'
   */
  async getWorkoutCountsByPeriod(period = "all", groupBy = "week") {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause = "WHERE sync_status != 'pending_delete'";
      const params = [];

      if (startDate) {
        whereClause += " AND date_performed >= ?";
        params.push(startDate.toISOString());
      }

      let groupFormat;
      switch (groupBy) {
        case "day":
          groupFormat = "%Y-%m-%d";
          break;
        case "week":
          groupFormat = "%Y-%W";
          break;
        case "month":
          groupFormat = "%Y-%m";
          break;
        default:
          groupFormat = "%Y-%W";
      }

      const query = `
        SELECT 
          strftime('${groupFormat}', date_performed) as period,
          COUNT(*) as count,
          date_performed
        FROM workouts
        ${whereClause}
        GROUP BY period
        ORDER BY period ASC
      `;

      const results = await this.db.query(query, params);
      return results.map((row) => ({
        period: row.period,
        count: row.count,
        date: row.date_performed,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error getting workout counts:", error);
      return [];
    }
  }

  /**
   * Get workout duration by period
   */
  async getDurationByPeriod(period = "all", groupBy = "week") {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause = "WHERE sync_status != 'pending_delete'";
      const params = [];

      if (startDate) {
        whereClause += " AND date_performed >= ?";
        params.push(startDate.toISOString());
      }

      let groupFormat;
      switch (groupBy) {
        case "day":
          groupFormat = "%Y-%m-%d";
          break;
        case "week":
          groupFormat = "%Y-%W";
          break;
        case "month":
          groupFormat = "%Y-%m";
          break;
        default:
          groupFormat = "%Y-%W";
      }

      const query = `
        SELECT 
          strftime('${groupFormat}', date_performed) as period,
          AVG(duration) as avg_duration,
          date_performed
        FROM workouts
        ${whereClause}
        GROUP BY period
        ORDER BY period ASC
      `;

      const results = await this.db.query(query, params);
      return results.map((row) => ({
        period: row.period,
        duration: Math.round((row.avg_duration || 0) / 60), // Convert to minutes
        date: row.date_performed,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error getting duration:", error);
      return [];
    }
  }

  /**
   * Get exercise progression (max weight over time)
   */
  async getExerciseProgression(exerciseId, period = "all") {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause =
        "WHERE we.exercise_id = ? AND w.sync_status != 'pending_delete'";
      const params = [exerciseId];

      if (startDate) {
        whereClause += " AND w.date_performed >= ?";
        params.push(startDate.toISOString());
      }

      const query = `
        SELECT 
          w.date_performed,
          MAX(s.weight) as max_weight,
          s.reps,
          w.workout_id
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        ${whereClause}
        GROUP BY w.workout_id
        ORDER BY w.date_performed ASC
      `;

      const results = await this.db.query(query, params);
      return results.map((row) => ({
        date: row.date_performed,
        weight: row.max_weight || 0,
        reps: row.reps || 0,
        workoutId: row.workout_id,
      }));
    } catch (error) {
      console.error(
        "[StatisticsAPI] Error getting exercise progression:",
        error
      );
      return [];
    }
  }

  /**
   * Get personal records for an exercise
   */
  async getExercisePR(exerciseId) {
    try {
      await this.db.initializationPromise;

      const query = `
        SELECT 
          MAX(s.weight) as max_weight,
          s.reps as reps_at_max,
          w.date_performed as pr_date
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        WHERE we.exercise_id = ? AND w.sync_status != 'pending_delete'
        ORDER BY s.weight DESC
        LIMIT 1
      `;

      const results = await this.db.query(query, [exerciseId]);
      if (results.length > 0) {
        return {
          maxWeight: results[0].max_weight || 0,
          repsAtMax: results[0].reps_at_max || 0,
          date: results[0].pr_date,
        };
      }
      return null;
    } catch (error) {
      console.error("[StatisticsAPI] Error getting exercise PR:", error);
      return null;
    }
  }

  /**
   * Get muscle group distribution
   */
  async getMuscleGroupDistribution(period = "all") {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause = "WHERE w.sync_status != 'pending_delete'";
      const params = [];

      if (startDate) {
        whereClause += " AND w.date_performed >= ?";
        params.push(startDate.toISOString());
      }

      const query = `
        SELECT 
          e.muscle_group,
          COUNT(DISTINCT we.workout_exercises_id) as count
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN exercises e ON we.exercise_id = e.exercise_id
        ${whereClause}
        GROUP BY e.muscle_group
        ORDER BY count DESC
      `;

      const results = await this.db.query(query, params);
      return results
        .filter((row) => row.muscle_group) // Filter out null/undefined muscle groups
        .map((row) => ({
          muscleGroup: row.muscle_group,
          count: row.count,
        }));
    } catch (error) {
      console.error(
        "[StatisticsAPI] Error getting muscle group distribution:",
        error
      );
      return [];
    }
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(period = "all") {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause = "WHERE w.sync_status != 'pending_delete'";
      const params = [];

      if (startDate) {
        whereClause += " AND w.date_performed >= ?";
        params.push(startDate.toISOString());
      }

      // Get total workouts
      const workoutQuery = `
        SELECT COUNT(*) as total_workouts
        FROM workouts w
        ${whereClause}
      `;
      const workoutResults = await this.db.query(workoutQuery, params);

      // Get average duration
      const durationQuery = `
        SELECT AVG(duration) as avg_duration
        FROM workouts w
        ${whereClause}
      `;
      const durationResults = await this.db.query(durationQuery, params);

      // Get total sets
      const setsQuery = `
        SELECT COUNT(*) as total_sets
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        ${whereClause}
      `;
      const setsResults = await this.db.query(setsQuery, params);

      return {
        totalWorkouts: workoutResults[0]?.total_workouts || 0,
        avgDuration: Math.round((durationResults[0]?.avg_duration || 0) / 60), // minutes
        totalSets: setsResults[0]?.total_sets || 0,
      };
    } catch (error) {
      console.error("[StatisticsAPI] Error getting overview stats:", error);
      return {
        totalWorkouts: 0,
        avgDuration: 0,
        totalSets: 0,
      };
    }
  }

  /**
   * Get top exercises by frequency (workout count)
   */
  async getTopExercises(period = "all", limit = 5) {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause = "WHERE w.sync_status != 'pending_delete'";
      const params = [];

      if (startDate) {
        whereClause += " AND w.date_performed >= ?";
        params.push(startDate.toISOString());
      }

      const query = `
        SELECT 
          e.exercise_id,
          e.name,
          e.muscle_group,
          COUNT(DISTINCT w.workout_id) as workout_count,
          COUNT(DISTINCT s.set_id) as total_sets
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        JOIN exercises e ON we.exercise_id = e.exercise_id
        ${whereClause}
        GROUP BY e.exercise_id
        ORDER BY workout_count DESC, total_sets DESC
        LIMIT ?
      `;

      params.push(limit);
      const results = await this.db.query(query, params);
      return results.map((row) => ({
        exerciseId: row.exercise_id,
        name: row.name,
        muscleGroup: row.muscle_group,
        workoutCount: row.workout_count,
        totalSets: row.total_sets,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error getting top exercises:", error);
      return [];
    }
  }

  /**
   * Get workout counts for past 8 weeks (always returns 8 data points)
   */
  async getWorkoutCountsWeekly() {
    try {
      await this.db.initializationPromise;

      // Generate all 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(new Date(), i * 7), {
          weekStartsOn: 0,
        });
        weeks.push(format(weekStart, "yyyy-MM-dd"));
      }

      const startDateStr = weeks[0];

      // Get all workouts in the date range
      const query = `
        SELECT
          date_performed,
          workout_id
        FROM workouts
        WHERE date(date_performed) >= date(?)
        ORDER BY date_performed ASC
      `;

      const results = await this.db.query(query, [startDateStr]);

      // Group workouts by week in JavaScript
      const weekCounts = new Map();
      results.forEach((row) => {
        const workoutDate = parseISO(row.date_performed);
        const weekStart = format(
          startOfWeek(workoutDate, { weekStartsOn: 0 }),
          "yyyy-MM-dd"
        );
        weekCounts.set(weekStart, (weekCounts.get(weekStart) || 0) + 1);
      });

      // Fill in all 8 weeks with zeros for missing data
      return weeks.map((week) => ({
        date: week,
        count: weekCounts.get(week) || 0,
      }));
    } catch (error) {
      console.error(
        "[StatisticsAPI] Error fetching weekly workout counts:",
        error
      );
      return [];
    }
  }

  /**
   * Get workout counts for past 12 months (always returns 12 data points)
   */
  async getWorkoutCountsMonthly() {
    try {
      await this.db.initializationPromise;

      // Generate all 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        months.push(format(monthStart, "yyyy-MM-01"));
      }

      const startDateStr = months[0];

      const query = `
        SELECT
          strftime('%Y-%m-01', date_performed) as month_start,
          COUNT(DISTINCT workout_id) as count
        FROM workouts
        WHERE date_performed >= ?
        GROUP BY month_start
        ORDER BY month_start ASC
      `;

      const results = await this.db.query(query, [startDateStr]);
      const resultMap = new Map(
        results.map((row) => [row.month_start, Number(row.count) || 0])
      );

      // Fill in all 12 months with zeros for missing data
      return months.map((month) => ({
        date: month,
        count: resultMap.get(month) || 0,
      }));
    } catch (error) {
      console.error(
        "[StatisticsAPI] Error fetching monthly workout counts:",
        error
      );
      return [];
    }
  }

  /**
   * Get average duration for past 8 weeks (always returns 8 data points)
   */
  async getDurationWeekly() {
    try {
      await this.db.initializationPromise;

      // Generate all 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(new Date(), i * 7), {
          weekStartsOn: 0,
        });
        weeks.push(format(weekStart, "yyyy-MM-dd"));
      }

      const startDateStr = weeks[0];

      // Get all workouts in the date range
      const query = `
        SELECT
          date_performed,
          duration
        FROM workouts
        WHERE date(date_performed) >= date(?)
        ORDER BY date_performed ASC
      `;

      const results = await this.db.query(query, [startDateStr]);

      // Group workouts by week and calculate average duration
      const weekData = new Map();
      results.forEach((row) => {
        const workoutDate = parseISO(row.date_performed);
        const weekStart = format(
          startOfWeek(workoutDate, { weekStartsOn: 0 }),
          "yyyy-MM-dd"
        );

        if (!weekData.has(weekStart)) {
          weekData.set(weekStart, { totalDuration: 0, count: 0 });
        }
        const data = weekData.get(weekStart);
        data.totalDuration += Number(row.duration) || 0;
        data.count += 1;
      });

      // Calculate averages and fill in all 8 weeks
      return weeks.map((week) => {
        const data = weekData.get(week);
        const avgDuration = data
          ? Math.round(data.totalDuration / data.count / 60)
          : 0;
        return {
          date: week,
          duration: avgDuration,
        };
      });
    } catch (error) {
      console.error("[StatisticsAPI] Error fetching weekly duration:", error);
      return [];
    }
  }

  /**
   * Get average duration for past 12 months (always returns 12 data points)
   */
  async getDurationMonthly() {
    try {
      await this.db.initializationPromise;

      // Generate all 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        months.push(format(monthStart, "yyyy-MM-01"));
      }

      const startDateStr = months[0];

      const query = `
        SELECT
          strftime('%Y-%m-01', date_performed) as month_start,
          COALESCE(ROUND(AVG(duration) / 60.0), 0) as duration
        FROM workouts
        WHERE date_performed >= ?
        GROUP BY month_start
        ORDER BY month_start ASC
      `;

      const results = await this.db.query(query, [startDateStr]);
      const resultMap = new Map(
        results.map((row) => [row.month_start, Number(row.duration) || 0])
      );

      // Fill in all 12 months with zeros for missing data
      return months.map((month) => ({
        date: month,
        duration: resultMap.get(month) || 0,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error fetching monthly duration:", error);
      return [];
    }
  }

  /**
   * Get total sets for past 8 weeks (always returns 8 data points)
   */
  async getSetsWeekly() {
    try {
      await this.db.initializationPromise;

      // Generate all 8 weeks
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subDays(new Date(), i * 7), {
          weekStartsOn: 0,
        });
        weeks.push(format(weekStart, "yyyy-MM-dd"));
      }

      const startDateStr = weeks[0];

      // Get all sets with workout dates in the date range
      const query = `
        SELECT
          w.date_performed,
          COUNT(s.set_id) as set_count
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        WHERE date(w.date_performed) >= date(?)
        GROUP BY w.workout_id
        ORDER BY w.date_performed ASC
      `;

      const results = await this.db.query(query, [startDateStr]);

      // Group sets by week
      const weekSets = new Map();
      results.forEach((row) => {
        const workoutDate = parseISO(row.date_performed);
        const weekStart = format(
          startOfWeek(workoutDate, { weekStartsOn: 0 }),
          "yyyy-MM-dd"
        );
        weekSets.set(
          weekStart,
          (weekSets.get(weekStart) || 0) + Number(row.set_count)
        );
      });

      // Fill in all 8 weeks with zeros for missing data
      return weeks.map((week) => ({
        date: week,
        sets: weekSets.get(week) || 0,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error fetching weekly sets:", error);
      return [];
    }
  }

  /**
   * Get total sets for past 12 months (always returns 12 data points)
   */
  async getSetsMonthly() {
    try {
      await this.db.initializationPromise;

      // Generate all 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        months.push(format(monthStart, "yyyy-MM-01"));
      }

      const startDateStr = months[0];

      const query = `
        SELECT
          strftime('%Y-%m-01', w.date_performed) as month_start,
          COALESCE(COUNT(s.set_id), 0) as total_sets
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        WHERE w.date_performed >= ?
        GROUP BY month_start
        ORDER BY month_start ASC
      `;

      const results = await this.db.query(query, [startDateStr]);
      const resultMap = new Map(
        results.map((row) => [row.month_start, Number(row.total_sets) || 0])
      );

      // Fill in all 12 months with zeros for missing data
      return months.map((month) => ({
        date: month,
        sets: resultMap.get(month) || 0,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error fetching monthly sets:", error);
      return [];
    }
  }

  /**
   * Get sets per muscle group over time
   * Returns data with dates and muscle groups as separate series
   */
  async getSetsPerMuscleGroup(period = "1m", groupBy = "week") {
    try {
      await this.db.initializationPromise;

      let weeks = [];
      let startDateStr;

      if (groupBy === "week") {
        // Generate weeks based on period
        const numWeeks = period === "1y" ? 52 : period === "3m" ? 12 : 4;
        for (let i = numWeeks - 1; i >= 0; i--) {
          const weekStart = startOfWeek(subDays(new Date(), i * 7), {
            weekStartsOn: 0,
          });
          weeks.push(format(weekStart, "yyyy-MM-dd"));
        }
        startDateStr = weeks[0];
      } else if (groupBy === "month") {
        // Generate months based on period
        const numMonths = period === "1y" ? 12 : period === "3m" ? 3 : 12;
        for (let i = numMonths - 1; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          weeks.push(format(monthStart, "yyyy-MM-dd"));
        }
        startDateStr = weeks[0];
      } else {
        // Year grouping - monthly data points
        for (let i = 11; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          weeks.push(format(monthStart, "yyyy-MM-dd"));
        }
        startDateStr = weeks[0];
        groupBy = "month"; // Treat as month for query
      }

      // Get all sets with muscle groups in the date range
      const query = `
        SELECT
          w.date_performed,
          e.muscle_group,
          COUNT(s.set_id) as set_count
        FROM workouts w
        JOIN workout_exercises we ON w.workout_id = we.workout_id
        JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
        JOIN exercises e ON we.exercise_id = e.exercise_id
        WHERE date(w.date_performed) >= date(?)
          AND w.sync_status != 'pending_delete'
          AND e.muscle_group IS NOT NULL
        GROUP BY w.workout_id, e.muscle_group
        ORDER BY w.date_performed ASC
      `;

      const results = await this.db.query(query, [startDateStr]);

      // Group sets by period and muscle group
      const periodSets = new Map();

      results.forEach((row) => {
        const workoutDate = parseISO(row.date_performed);
        let periodKey;

        if (groupBy === "week") {
          periodKey = format(
            startOfWeek(workoutDate, { weekStartsOn: 0 }),
            "yyyy-MM-dd"
          );
        } else {
          periodKey = format(startOfMonth(workoutDate), "yyyy-MM-dd");
        }

        if (!periodSets.has(periodKey)) {
          periodSets.set(periodKey, {});
        }

        const periodData = periodSets.get(periodKey);
        const muscleGroup = row.muscle_group;
        periodData[muscleGroup] =
          (periodData[muscleGroup] || 0) + Number(row.set_count);
      });

      // Fill in all periods with zeros for missing data
      return weeks.map((period) => {
        const data = periodSets.get(period) || {};
        return {
          date: period,
          ...data,
        };
      });
    } catch (error) {
      console.error(
        "[StatisticsAPI] Error fetching sets per muscle group:",
        error
      );
      return [];
    }
  }

  /**
   * Get recent best sets (personal records) across exercises
   * Ordered by most recent PR date, limited to top N
   */
  async getRecentBests(period = "all", limit = 10) {
    try {
      await this.db.initializationPromise;

      const startDate = this.getPeriodStartDate(period);
      let whereClause = "WHERE w.sync_status != 'pending_delete'";
      const params = [];

      if (startDate) {
        whereClause += " AND w.date_performed >= ?";
        params.push(startDate.toISOString());
      }

      // For each exercise, find its best (heaviest) set and keep the most recent
      const query = `
        WITH exercise_prs AS (
          SELECT 
            e.exercise_id,
            e.name,
            e.muscle_group,
            s.weight,
            s.reps,
            w.date_performed,
            ROW_NUMBER() OVER (
              PARTITION BY e.exercise_id 
              ORDER BY s.weight DESC, w.date_performed DESC
            ) AS rn
          FROM workouts w
          JOIN workout_exercises we ON w.workout_id = we.workout_id
          JOIN sets s ON we.workout_exercises_id = s.workout_exercises_id
          JOIN exercises e ON we.exercise_id = e.exercise_id
          ${whereClause}
        )
        SELECT *
        FROM exercise_prs
        WHERE rn = 1
        ORDER BY date_performed DESC
        LIMIT ?
      `;

      params.push(limit);
      const results = await this.db.query(query, params);

      return results.map((row) => ({
        exerciseId: row.exercise_id,
        name: row.name,
        muscleGroup: row.muscle_group,
        weight: row.weight || 0,
        reps: row.reps || 0,
        date: row.date_performed,
      }));
    } catch (error) {
      console.error("[StatisticsAPI] Error getting recent bests:", error);
      return [];
    }
  }
}

export const statisticsAPI = new StatisticsAPI();
export default statisticsAPI;
