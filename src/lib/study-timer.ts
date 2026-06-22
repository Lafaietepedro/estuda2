type TimerSnapshot = {
  status: string;
  accumulatedSeconds: number;
  pauseSeconds: number;
  lastResumedAt: Date | string | null;
  pausedAt: Date | string | null;
};

function toDate(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function secondsBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export function timerNetSeconds(timer: TimerSnapshot, now = new Date()) {
  if (timer.status !== "RUNNING") return timer.accumulatedSeconds;

  const lastResumedAt = toDate(timer.lastResumedAt);
  if (!lastResumedAt) return timer.accumulatedSeconds;

  return timer.accumulatedSeconds + secondsBetween(lastResumedAt, now);
}

export function timerPauseSeconds(timer: TimerSnapshot, now = new Date()) {
  if (timer.status !== "PAUSED") return timer.pauseSeconds;

  const pausedAt = toDate(timer.pausedAt);
  if (!pausedAt) return timer.pauseSeconds;

  return timer.pauseSeconds + secondsBetween(pausedAt, now);
}

export function secondsToClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function secondsToHuman(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  }

  if (minutes > 0) {
    return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

export function secondsToRoundedMinutes(totalSeconds: number) {
  return Math.round(totalSeconds / 60);
}
