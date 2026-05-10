/**
 * Exercise search: token-wise AND matching so queries like "bicep curl"
 * match "Biceps Curl". Short tokens use substring matching on the haystack;
 * otherwise tokens can fuzzy-match individual words (e.g. "crl" → "curl").
 */

export function tokenizeSearch(query) {
  if (!query || typeof query !== "string") return [];
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function exerciseSearchHaystack(exercise) {
  const parts = [
    exercise?.name,
    exercise?.muscle_group,
    exercise?.equipment,
    exercise?.instruction,
    ...(Array.isArray(exercise?.secondary_muscle_groups)
      ? exercise.secondary_muscle_groups
      : []),
  ];
  return parts
    .filter((p) => p != null && String(p).length > 0)
    .join(" ")
    .toLowerCase();
}

/** Max Levenshtein edits allowed between a query token and a word (by token length). */
function maxEditsForToken(tokenLength) {
  if (tokenLength <= 2) return 0;
  if (tokenLength <= 5) return 1;
  return 2;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

function collectExerciseWords(exercise) {
  const parts = [
    exercise?.name,
    exercise?.muscle_group,
    exercise?.equipment,
    exercise?.instruction,
    ...(Array.isArray(exercise?.secondary_muscle_groups)
      ? exercise.secondary_muscle_groups
      : []),
  ];
  const words = new Set();
  for (const p of parts) {
    if (p == null || String(p).length === 0) continue;
    const found = String(p).toLowerCase().match(/\w+/g);
    if (found) {
      for (const w of found) words.add(w);
    }
  }
  return [...words];
}

export function tokenMatchesExercise(token, exercise) {
  const haystack = exerciseSearchHaystack(exercise);
  if (haystack.includes(token)) return true;

  const maxD = maxEditsForToken(token.length);
  if (maxD === 0) return false;

  const t = token.toLowerCase();
  return collectExerciseWords(exercise).some(
    (w) => levenshtein(w, t) <= maxD,
  );
}

export function exerciseMatchesSearch(exercise, searchText) {
  const tokens = tokenizeSearch(searchText);
  if (tokens.length === 0) return true;
  return tokens.every((token) => tokenMatchesExercise(token, exercise));
}

/** Left-to-right non-overlapping occurrences of token in text (case-insensitive). */
export function findTokenHighlightRanges(text, token) {
  if (!text || !token) return [];
  const lower = text.toLowerCase();
  const t = token.toLowerCase();
  if (!t.length) return [];
  const ranges = [];
  let pos = 0;
  while (pos < lower.length) {
    const idx = lower.indexOf(t, pos);
    if (idx === -1) break;
    ranges.push([idx, idx + t.length]);
    pos = idx + t.length;
  }
  return ranges;
}

/**
 * If there is no substring hit for `token`, highlight the single word in `text`
 * with the smallest Levenshtein distance to `token` within the edit budget.
 */
export function findFuzzyWordHighlightRange(text, token) {
  const maxD = maxEditsForToken(token.length);
  if (!token?.length || maxD === 0) return null;

  const t = token.toLowerCase();
  const re = /\w+/g;
  let m = re.exec(text);
  let best = null;

  while (m !== null) {
    const rawWord = m[0];
    const w = rawWord.toLowerCase();
    const d = levenshtein(w, t);
    if (d <= maxD && (!best || d < best.dist)) {
      best = {
        dist: d,
        start: m.index,
        end: m.index + rawWord.length,
      };
    }
    m = re.exec(text);
  }

  return best ? [best.start, best.end] : null;
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    const last = merged[merged.length - 1];
    if (s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

/** Merged [start, end) ranges in `text` for all query tokens (for name highlighting). */
export function highlightRangesForQuery(text, query) {
  const tokens = tokenizeSearch(query);
  if (!tokens.length) return [];
  const all = [];
  for (const t of tokens) {
    const exact = findTokenHighlightRanges(text, t);
    if (exact.length > 0) {
      all.push(...exact);
    } else {
      const fuzzy = findFuzzyWordHighlightRange(text, t);
      if (fuzzy) all.push(fuzzy);
    }
  }
  return mergeIntervals(all);
}
