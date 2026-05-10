import React from "react";
import { Text } from "react-native";
import { highlightRangesForQuery } from "../utils/exerciseSearch";

/**
 * Highlights each whitespace-separated token from `highlight` in `text`:
 * exact case-insensitive substring hits, otherwise the closest matching word
 * within a small edit distance (e.g. "crl" highlights "curl").
 */
export default function ExerciseSearchHighlightText({
  text,
  highlight,
  style,
  highlightStyle,
}) {
  const safe = text ?? "";
  if (!highlight?.trim()) {
    return <Text style={style}>{safe}</Text>;
  }

  const ranges = highlightRangesForQuery(safe, highlight);
  if (ranges.length === 0) {
    return <Text style={style}>{safe}</Text>;
  }

  const children = [];
  let last = 0;
  ranges.forEach(([start, end], i) => {
    if (start > last) {
      children.push(
        <Text key={`n-${i}-${last}`} style={style}>
          {safe.slice(last, start)}
        </Text>,
      );
    }
    children.push(
      <Text key={`h-${i}-${start}`} style={[style, highlightStyle]}>
        {safe.slice(start, end)}
      </Text>,
    );
    last = end;
  });
  if (last < safe.length) {
    children.push(
      <Text key={`t-${last}`} style={style}>
        {safe.slice(last)}
      </Text>,
    );
  }

  return <Text style={style}>{children}</Text>;
}
