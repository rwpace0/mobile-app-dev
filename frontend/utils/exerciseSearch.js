/**
 * Exercise search: token-wise AND matching so queries like "bicep curl"
 * match "Biceps Curl" (each token must appear somewhere in searchable text).
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

export function exerciseMatchesSearch(exercise, searchText) {
  const tokens = tokenizeSearch(searchText);
  if (tokens.length === 0) return true;
  const haystack = exerciseSearchHaystack(exercise);
  return tokens.every((token) => haystack.includes(token));
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
  const all = tokens.flatMap((t) => findTokenHighlightRanges(text, t));
  return mergeIntervals(all);
}
