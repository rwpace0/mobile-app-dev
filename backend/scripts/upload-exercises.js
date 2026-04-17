/**
 * upload-exercises.js
 *
 * Uploads GIFs from assets_uuid/ to R2 (default-exercises/images/<uuid>.gif),
 * then upserts all exercises from exercises_updated.csv into Supabase with
 * the correct image_url.
 *
 * Run from the backend/ directory:
 *   node scripts/upload-exercises.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../');

// ── Config ────────────────────────────────────────────────────────────────────

const R2_BUCKET = 'default-exercises';
const R2_PREFIX = 'images';
const ASSETS_DIR = path.join(REPO_ROOT, 'assets_uuid');
const CSV_PATH = path.join(REPO_ROOT, 'exercises_updated.csv');

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_PUBLIC_URL,
} = process.env;

for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL })) {
  if (!v) { console.error(`Missing env var: ${k}`); process.exit(1); }
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── CSV parser ────────────────────────────────────────────────────────────────

/**
 * Minimal RFC-4180-compliant CSV parser.
 * Returns an array of objects keyed by the header row.
 */
function parseCSV(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let i = 0;

  function parseField() {
    if (lines[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let val = '';
      while (i < lines.length) {
        if (lines[i] === '"' && lines[i + 1] === '"') {
          val += '"';
          i += 2;
        } else if (lines[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          val += lines[i++];
        }
      }
      return val;
    } else {
      // Unquoted field
      let val = '';
      while (i < lines.length && lines[i] !== ',' && lines[i] !== '\n') {
        val += lines[i++];
      }
      return val;
    }
  }

  function parseRow() {
    const fields = [];
    while (i < lines.length && lines[i] !== '\n') {
      fields.push(parseField());
      if (i < lines.length && lines[i] === ',') i++; // skip comma
    }
    if (lines[i] === '\n') i++; // skip newline
    return fields;
  }

  const headers = parseRow();
  while (i < lines.length) {
    const fields = parseRow();
    if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = fields[idx] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

/**
 * Parse a CSV cell that contains a JSON array like ["foo","bar"] or [].
 * Returns a JS array, or [] on failure.
 */
function parseArrayField(val) {
  if (!val || val.trim() === '' || val.trim() === '[]') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── R2 helpers ────────────────────────────────────────────────────────────────

async function objectExists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadGif(exerciseId, gifPath) {
  const key = `${R2_PREFIX}/${exerciseId}.gif`;
  const exists = await objectExists(key);
  if (exists) {
    return { key, skipped: true };
  }
  const body = fs.readFileSync(gifPath);
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'image/gif',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return { key, skipped: false };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading CSV…');
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const exercises = parseCSV(raw);
  console.log(`Parsed ${exercises.length} exercises.\n`);

  let uploaded = 0;
  let skipped = 0;
  let noGif = 0;
  let errors = 0;

  for (let idx = 0; idx < exercises.length; idx++) {
    const row = exercises[idx];
    const { name, instruction, muscle_group, equipment, secondary_muscle_group, exercise_id, alias } = row;
    const prefix = `[${idx + 1}/${exercises.length}] ${name}`;

    // Determine image_url
    const gifPath = path.join(ASSETS_DIR, `${exercise_id}.gif`);
    let image_url = null;

    if (fs.existsSync(gifPath)) {
      try {
        const { key, skipped: wasSkipped } = await uploadGif(exercise_id, gifPath);
        image_url = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
        if (wasSkipped) {
          console.log(`${prefix} — GIF already in R2, skipped upload`);
          skipped++;
        } else {
          console.log(`${prefix} — GIF uploaded`);
          uploaded++;
        }
      } catch (err) {
        console.error(`${prefix} — R2 upload FAILED: ${err.message}`);
        errors++;
      }
    } else {
      console.log(`${prefix} — no GIF found, image_url will be null`);
      noGif++;
    }

    // Build upsert payload
    const payload = {
      exercise_id,
      name,
      instruction: instruction || null,
      muscle_group: muscle_group || null,
      equipment: equipment || null,
      secondary_muscle_groups: parseArrayField(secondary_muscle_group),
      alias: parseArrayField(alias),
      image_url,
      is_public: true,
    };

    const { error } = await supabase
      .from('exercises')
      .upsert(payload, { onConflict: 'exercise_id' });

    if (error) {
      console.error(`  Supabase upsert FAILED: ${error.message}`);
      errors++;
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`Done!`);
  console.log(`  GIFs uploaded:      ${uploaded}`);
  console.log(`  GIFs already in R2: ${skipped}`);
  console.log(`  No GIF found:       ${noGif}`);
  console.log(`  Errors:             ${errors}`);
  console.log('─────────────────────────────────');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
