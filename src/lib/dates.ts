const TIME_ZONE = "America/Sao_Paulo";

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatDateInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00-03:00`);
}

export function startOfCurrentWeek() {
  const now = new Date();
  const localDate = formatDateInput(now);
  const localNoon = parseLocalDate(localDate);
  const weekday = localNoon.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;

  localNoon.setUTCDate(localNoon.getUTCDate() - daysSinceMonday);
  localNoon.setUTCHours(3, 0, 0, 0);
  return localNoon;
}

export function minutesToLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) return `${remaining}min`;
  return `${hours}h ${String(remaining).padStart(2, "0")}min`;
}
