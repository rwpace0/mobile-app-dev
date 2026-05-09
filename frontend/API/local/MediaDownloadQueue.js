import * as FileSystem from 'expo-file-system/legacy';
import { dbManager } from './dbManager';

const MAX_ATTEMPTS = 5;
const WORKER_INTERVAL_MS = 1500;
const BASE_BACKOFF_MS = 2000;

// Matches any direct public HTTPS URL that is NOT a backend /media/ route.
// Public catalog image_url values are served from R2/CDN and need no server resolver.
function isPublicCatalogUrl(url) {
  if (!url || !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    // If the path goes through our own /media/ resolver, it needs auth
    if (parsed.pathname.startsWith('/media/')) return false;
    return true;
  } catch {
    return false;
  }
}

class MediaDownloadQueue {
  constructor() {
    this._timer = null;
    this._running = false;
    this._backoffUntil = 0;
    this.baseDir = `${FileSystem.cacheDirectory}app_media/`;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Persist a download job for exerciseId if no pending/in_progress job already
   * exists for that exercise + mediaType combination.
   */
  async enqueueIfNeeded(exerciseId, url, mediaType = 'image') {
    try {
      if (!exerciseId || !url) return;

      // Skip if the exercise already has a local file for this type
      const column = mediaType === 'video' ? 'local_video_path' : 'local_media_path';
      const [row] = await dbManager.query(
        `SELECT ${column} FROM exercises WHERE exercise_id = ?`,
        [exerciseId]
      );
      if (row?.[column]) return; // already cached

      // Skip if a job already exists (any non-failed status)
      const existing = await dbManager.query(
        `SELECT job_id FROM media_download_jobs
         WHERE exercise_id = ? AND media_type = ? AND status != 'failed'`,
        [exerciseId, mediaType]
      );
      if (existing.length > 0) return;

      // Strip query string / fragment before storing so the URL is stable and clean
      const cleanStoredUrl = url.split('?')[0].split('#')[0];
      const jobId = `${exerciseId}_${mediaType}_${Date.now()}`;
      await dbManager.execute(
        `INSERT OR IGNORE INTO media_download_jobs
           (job_id, exercise_id, url, media_type, status, attempts)
         VALUES (?, ?, ?, ?, 'pending', 0)`,
        [jobId, exerciseId, cleanStoredUrl, mediaType]
      );
    } catch (err) {
      console.warn('[MediaDownloadQueue] enqueueIfNeeded error:', err?.message);
    }
  }

  /** Start the background ticker (idempotent). */
  start() {
    if (this._timer) return;
    console.log('[MediaDownloadQueue] Starting background media queue');
    this._timer = setInterval(() => this._tick(), WORKER_INTERVAL_MS);
    // Kick off immediately so the first job doesn't wait a full interval
    this._tick();
  }

  /** Stop the background ticker. */
  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
    console.log('[MediaDownloadQueue] Stopped');
  }

  // ---------------------------------------------------------------------------
  // Internal worker
  // ---------------------------------------------------------------------------

  async _tick() {
    if (this._running) return;
    if (Date.now() < this._backoffUntil) return;

    this._running = true;
    try {
      await this._processNext();
    } catch (err) {
      console.warn('[MediaDownloadQueue] Unhandled tick error:', err?.message);
    } finally {
      this._running = false;
    }
  }

  async _processNext() {
    // Pick the oldest pending job
    const jobs = await dbManager.query(
      `SELECT * FROM media_download_jobs
       WHERE status = 'pending' AND attempts < ?
       ORDER BY created_at ASC LIMIT 1`,
      [MAX_ATTEMPTS]
    );

    if (!jobs || jobs.length === 0) return;

    const job = jobs[0];

    // Mark in_progress
    await dbManager.execute(
      `UPDATE media_download_jobs
       SET status = 'in_progress', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
       WHERE job_id = ?`,
      [job.job_id]
    );

    try {
      const localPath = await this._download(job);

      if (localPath) {
        // Update exercises table
        const filename = localPath.split('/').pop();
        if (job.media_type === 'video') {
          const cleanUrl = job.url.split('?')[0];
          await dbManager.execute(
            `UPDATE exercises
             SET video_url = ?, local_video_path = ?, updated_at = datetime('now')
             WHERE exercise_id = ?`,
            [cleanUrl, filename, job.exercise_id]
          );
        } else {
          const cleanUrl = job.url.split('?')[0];
          // Clean up any old cached file before updating
          const [existing] = await dbManager.query(
            'SELECT local_media_path FROM exercises WHERE exercise_id = ?',
            [job.exercise_id]
          );
          if (existing?.local_media_path) {
            try {
              await FileSystem.deleteAsync(
                `${this.baseDir}exercises/${existing.local_media_path}`,
                { idempotent: true }
              );
            } catch (_) {}
          }
          await dbManager.execute(
            `UPDATE exercises
             SET image_url = ?, local_media_path = ?, updated_at = datetime('now')
             WHERE exercise_id = ?`,
            [cleanUrl, filename, job.exercise_id]
          );
        }
      }

      // Job complete — remove from queue
      await dbManager.execute(
        `DELETE FROM media_download_jobs WHERE job_id = ?`,
        [job.job_id]
      );
    } catch (err) {
      const newAttempts = (job.attempts || 0) + 1;
      const failed = newAttempts >= MAX_ATTEMPTS;
      const errMsg = err?.message ?? String(err);

      console.warn(
        `[MediaDownloadQueue] Job ${job.job_id} attempt ${newAttempts}/${MAX_ATTEMPTS} failed: ${errMsg}`
      );

      // Apply backoff on 429 or 5xx
      if (errMsg.includes('429') || errMsg.includes('5')) {
        const delay = BASE_BACKOFF_MS * Math.pow(2, newAttempts - 1);
        this._backoffUntil = Date.now() + Math.min(delay, 60000);
        console.log(
          `[MediaDownloadQueue] Backing off for ${Math.round((this._backoffUntil - Date.now()) / 1000)}s`
        );
      }

      await dbManager.execute(
        `UPDATE media_download_jobs
         SET status = ?, attempts = ?, last_error = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE job_id = ?`,
        [failed ? 'failed' : 'pending', newAttempts, errMsg, job.job_id]
      );
    }
  }

  async _download(job) {
    const { url, exercise_id: exerciseId, media_type: mediaType } = job;
    const subDir = mediaType === 'video' ? 'exercise-videos' : 'exercises';

    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(`${this.baseDir}${subDir}/`, {
      intermediates: true,
    });

    const cleanUrl = url.split('?')[0].split('#')[0];
    // Extract extension from the URL path only (ignore domain dots)
    let ext = 'gif';
    try {
      const pathname = new URL(cleanUrl).pathname;
      const lastSegment = pathname.split('/').pop() || '';
      const dotIndex = lastSegment.lastIndexOf('.');
      if (dotIndex !== -1) {
        const candidate = lastSegment.slice(dotIndex + 1).toLowerCase();
        // Only accept known image/video extensions
        if (/^(gif|jpg|jpeg|png|webp|mp4|mov|m4v)$/.test(candidate)) {
          ext = candidate;
        }
      }
    } catch (_) {}
    const localPath = `${this.baseDir}${subDir}/${exerciseId}_${Date.now()}.${ext}`;

    if (isPublicCatalogUrl(url)) {
      // Direct download — no backend round-trip
      const result = await FileSystem.downloadAsync(url, localPath);
      if (result.status >= 400) {
        try { await FileSystem.deleteAsync(localPath, { idempotent: true }); } catch (_) {}
        throw new Error(`HTTP ${result.status} downloading ${url}`);
      }
      await this._validateFile(localPath);
      return localPath;
    } else {
      // Private / user-uploaded media: delegate to MediaCache which uses backend resolver
      const { mediaCache } = await import('./MediaCache');
      const resultPath = await mediaCache.downloadAndCacheFile(
        url,
        subDir,
        exerciseId,
        false,
        true
      );
      if (!resultPath) throw new Error('MediaCache returned null');
      return resultPath;
    }
  }

  async _validateFile(localPath) {
    const info = await FileSystem.getInfoAsync(localPath);
    if (!info.exists || info.size < 100) {
      try { await FileSystem.deleteAsync(localPath, { idempotent: true }); } catch (_) {}
      throw new Error(`Downloaded file invalid or too small: ${localPath}`);
    }
  }
}

export const mediaDownloadQueue = new MediaDownloadQueue();
