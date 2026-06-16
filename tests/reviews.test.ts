import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  normalizeReviewIntervals,
  parseReviewIntervals,
  reviewIntervalLabel,
  reviewIntervalsSummary,
} from "../src/lib/reviews";

test("normalizes review intervals", () => {
  assert.deepEqual(parseReviewIntervals("30, 1, 7, 7"), [1, 7, 30]);
  assert.equal(normalizeReviewIntervals("30, 1, 7, 7"), "1,7,30");
});

test("falls back to default review intervals when empty", () => {
  assert.deepEqual(parseReviewIntervals(""), [1, 7, 30]);
  assert.equal(reviewIntervalsSummary("1,7,30"), "1 dia, 7 dias e 30 dias");
});

test("rejects invalid review intervals", () => {
  assert.throws(() => parseReviewIntervals("0,7"));
  assert.throws(() => parseReviewIntervals("1,366"));
  assert.throws(() => parseReviewIntervals("amanha"));
});

test("adds days preserving local-noon date anchors", () => {
  const date = new Date("2026-06-16T15:00:00.000Z");
  assert.equal(addDays(date, 7).toISOString(), "2026-06-23T15:00:00.000Z");
});

test("formats singular and plural labels", () => {
  assert.equal(reviewIntervalLabel(1), "1 dia");
  assert.equal(reviewIntervalLabel(2), "2 dias");
});
