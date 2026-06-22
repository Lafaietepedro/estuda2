import assert from "node:assert/strict";
import test from "node:test";

import {
  secondsBetween,
  secondsToClock,
  secondsToHuman,
  secondsToRoundedMinutes,
  timerNetSeconds,
  timerPauseSeconds,
} from "../src/lib/study-timer";

test("calculates elapsed seconds defensively", () => {
  const start = new Date("2026-06-22T12:00:00.000Z");
  const end = new Date("2026-06-22T12:02:05.000Z");

  assert.equal(secondsBetween(start, end), 125);
  assert.equal(secondsBetween(end, start), 0);
});

test("adds current running interval to accumulated study time", () => {
  const now = new Date("2026-06-22T12:10:00.000Z");

  assert.equal(
    timerNetSeconds(
      {
        status: "RUNNING",
        accumulatedSeconds: 300,
        pauseSeconds: 0,
        lastResumedAt: "2026-06-22T12:05:00.000Z",
        pausedAt: null,
      },
      now,
    ),
    600,
  );
});

test("keeps liquid time frozen while timer is paused", () => {
  const now = new Date("2026-06-22T12:10:00.000Z");

  assert.equal(
    timerNetSeconds(
      {
        status: "PAUSED",
        accumulatedSeconds: 420,
        pauseSeconds: 0,
        lastResumedAt: "2026-06-22T12:02:00.000Z",
        pausedAt: "2026-06-22T12:05:00.000Z",
      },
      now,
    ),
    420,
  );
});

test("adds current pause interval to pause total", () => {
  const now = new Date("2026-06-22T12:10:00.000Z");

  assert.equal(
    timerPauseSeconds(
      {
        status: "PAUSED",
        accumulatedSeconds: 420,
        pauseSeconds: 60,
        lastResumedAt: "2026-06-22T12:02:00.000Z",
        pausedAt: "2026-06-22T12:05:00.000Z",
      },
      now,
    ),
    360,
  );
});

test("formats timer labels and rounded minutes", () => {
  assert.equal(secondsToClock(65), "01:05");
  assert.equal(secondsToClock(3661), "1:01:01");
  assert.equal(secondsToHuman(45), "45s");
  assert.equal(secondsToHuman(125), "2min 05s");
  assert.equal(secondsToHuman(3661), "1h 01min");
  assert.equal(secondsToRoundedMinutes(29), 0);
  assert.equal(secondsToRoundedMinutes(30), 1);
});
