/**
 * process-exercise-media.js
 *
 * For each row in exercises_updated.csv, if assets_uuid/<exercise_id>.gif exists:
 *   - Extract first frame → WebP poster (images/<exercise_id>.webp on R2)
 *   - Encode GIF → H.264 MP4 (videos/<exercise_id>.mp4 on R2, yuv420p +faststart)
 *   - Set CSV image_url / video_url to full public URLs (R2_PUBLIC_URL + key)
 * Rows without a source GIF get empty image_url and video_url.
 *
 * Prerequisites:
 *   - Platform ffmpeg/ffprobe from npm (backend deps): @ffmpeg-installer/ffmpeg,
 *     @ffprobe-installer/ffprobe, no system PATH required. Run npm install in backend/.
 *   - Same R2 env vars as upload-exercises.js (no Supabase required here)
 *
 * Run from backend/:
 *   node scripts/process-exercise-media.js
 *
 * Then sync DB:
 *   node scripts/upload-exercises.js
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

const execFileAsync = promisify(execFile);

/** Bundled binaries (see package.json); avoids relying on PATH on Windows. */
const FFMPEG = ffmpegInstaller.path;
const FFPROBE = ffprobeInstaller.path;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../");

const R2_BUCKET = "default-exercises";
const ASSETS_DIR = path.join(REPO_ROOT, "assets_uuid");
const CSV_PATH = path.join(REPO_ROOT, "exercises_updated.csv");

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL } =
  process.env;

for (const [k, v] of Object.entries({
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_URL,
})) {
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const BASE_PUBLIC = R2_PUBLIC_URL.replace(/\/$/, "");

// ── CSV (same parser as upload-exercises.js) ─────────────────────────────────

function parseCSV(raw) {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let i = 0;

  function parseField() {
    if (lines[i] === '"') {
      i++;
      let val = "";
      while (i < lines.length) {
        if (lines[i] === '"' && lines[i + 1] === '"') {
          val += '"';
          i += 2;
        } else if (lines[i] === '"') {
          i++;
          break;
        } else {
          val += lines[i++];
        }
      }
      return val;
    }
    let val = "";
    while (i < lines.length && lines[i] !== "," && lines[i] !== "\n") {
      val += lines[i++];
    }
    return val;
  }

  function parseRow() {
    const fields = [];
    while (i < lines.length && lines[i] !== "\n") {
      fields.push(parseField());
      if (i < lines.length && lines[i] === ",") i++;
    }
    if (lines[i] === "\n") i++;
    return fields;
  }

  const headers = parseRow().map((h) => h.trim());
  while (i < lines.length) {
    const fields = parseRow();
    if (fields.length === 0 || (fields.length === 1 && fields[0] === ""))
      continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = fields[idx] ?? "";
    });
    rows.push(obj);
  }
  return { headers, rows };
}

function escapeCsvField(s) {
  const str = s == null ? "" : String(s);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildOutputHeaders(headers) {
  const h = [...headers];
  const imgIdx = h.indexOf("image_url");
  if (!h.includes("video_url")) {
    if (imgIdx >= 0) {
      h.splice(imgIdx + 1, 0, "video_url");
    } else {
      h.push("video_url");
    }
  }
  return h;
}

function serializeCSV(headers, rows) {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => escapeCsvField(row[key] ?? "")).join(","));
  }
  return lines.join("\n") + "\n";
}

// ── ffmpeg ───────────────────────────────────────────────────────────────────

async function assertFfmpeg() {
  if (!FFMPEG || !fs.existsSync(FFMPEG)) {
    throw new Error("ffmpeg binary missing. From backend/, run: npm install");
  }
  if (!FFPROBE || !fs.existsSync(FFPROBE)) {
    throw new Error("ffprobe binary missing. From backend/, run: npm install");
  }
  try {
    await execFileAsync(FFMPEG, ["-version"], { windowsHide: true });
  } catch (e) {
    throw new Error(
      `ffmpeg at ${FFMPEG} failed to run: ${e?.message || e}. Re-run npm install in backend/.`,
    );
  }
}

/**
 * If the GIF uses transparency, first-frame WebP can look wrong without alpha.
 * ffprobe: check for alpha in palette / rgba-ish pix_fmt.
 */
async function gifMayHaveAlpha(gifPath) {
  try {
    const { stdout } = await execFileAsync(
      FFPROBE,
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=pix_fmt",
        "-of",
        "csv=p=0",
        gifPath,
      ],
      { windowsHide: true },
    );
    const fmt = stdout.trim().toLowerCase();
    // Opaque GIFs often use pal8; only switch to PNG when alpha-capable pix_fmt.
    return (
      fmt.includes("rgba") ||
      fmt.includes("bgra") ||
      fmt.includes("yuva") ||
      fmt.includes("ya8") ||
      fmt.includes("argb")
    );
  } catch {
    return false;
  }
}

async function extractPoster(gifPath, outPath, usePng) {
  if (usePng) {
    await execFileAsync(
      FFMPEG,
      ["-y", "-i", gifPath, "-frames:v", "1", "-c:v", "png", outPath],
      { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
    );
    return "image/png";
  }
  await execFileAsync(
    FFMPEG,
    [
      "-y",
      "-i",
      gifPath,
      "-frames:v",
      "1",
      "-c:v",
      "libwebp",
      "-quality",
      "80",
      outPath,
    ],
    { windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
  );
  return "image/webp";
}

async function encodeMp4(gifPath, outPath) {
  await execFileAsync(
    FFMPEG,
    [
      "-y",
      "-i",
      gifPath,
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-an",
      outPath,
    ],
    { windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
  );
}

async function uploadToR2(key, body, contentType) {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

async function main() {
  await assertFfmpeg();

  console.log("Reading CSV…");
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const { headers, rows } = parseCSV(raw);
  const outHeaders = buildOutputHeaders(headers);
  console.log(
    `Parsed ${rows.length} rows. Output columns: ${outHeaders.join(", ")}\n`,
  );

  let converted = 0;
  let cleared = 0;
  let errors = 0;

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ex-media-"));

  try {
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const exerciseId = row.exercise_id?.trim();
      const name = row.name || exerciseId;
      const prefix = `[${idx + 1}/${rows.length}] ${name}`;

      if (!exerciseId) {
        console.warn(`${prefix} — missing exercise_id, skipping`);
        errors++;
        continue;
      }

      for (const h of outHeaders) {
        if (row[h] === undefined) row[h] = "";
      }

      const gifPath = path.join(ASSETS_DIR, `${exerciseId}.gif`);

      if (!fs.existsSync(gifPath)) {
        row.image_url = "";
        row.video_url = "";
        cleared++;
        console.log(`${prefix} — no GIF, cleared image_url / video_url`);
        continue;
      }

      const usePngPoster = await gifMayHaveAlpha(gifPath);
      const extPoster = usePngPoster ? "png" : "webp";
      const posterLocal = path.join(
        tmpRoot,
        `${exerciseId}_poster.${extPoster}`,
      );
      const mp4Local = path.join(tmpRoot, `${exerciseId}.mp4`);

      try {
        const posterContentType = await extractPoster(
          gifPath,
          posterLocal,
          usePngPoster,
        );
        await encodeMp4(gifPath, mp4Local);

        const posterKey = `images/${exerciseId}.${extPoster}`;
        const videoKey = `videos/${exerciseId}.mp4`;

        await uploadToR2(
          posterKey,
          fs.readFileSync(posterLocal),
          posterContentType,
        );
        await uploadToR2(videoKey, fs.readFileSync(mp4Local), "video/mp4");

        row.image_url = `${BASE_PUBLIC}/${posterKey}`;
        row.video_url = `${BASE_PUBLIC}/${videoKey}`;
        converted++;
        console.log(`${prefix} — uploaded ${posterKey}, ${videoKey}`);
      } catch (err) {
        console.error(`${prefix} — FAILED: ${err.message}`);
        row.image_url = "";
        row.video_url = "";
        errors++;
      } finally {
        for (const f of [posterLocal, mp4Local]) {
          try {
            if (fs.existsSync(f)) fs.unlinkSync(f);
          } catch {
            /* ignore */
          }
        }
      }
    }
  } finally {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const outCsv = serializeCSV(outHeaders, rows);
  fs.writeFileSync(CSV_PATH, outCsv, "utf-8");

  console.log("\n─────────────────────────────────");
  console.log(`Wrote ${CSV_PATH}`);
  console.log(`  Converted + uploaded: ${converted}`);
  console.log(`  No GIF (cleared URLs): ${cleared}`);
  console.log(`  Errors:               ${errors}`);
  console.log("Next: node scripts/upload-exercises.js");
  console.log("─────────────────────────────────");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
