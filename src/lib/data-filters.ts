import { formatDateInput, parseLocalDate } from "@/lib/dates";

export const periods = ["7", "30", "90", "all"] as const;
export const scopes = ["mine", "team"] as const;

export type DataPeriod = (typeof periods)[number];
export type DataScope = (typeof scopes)[number];

export function parsePeriod(
  value?: string,
  fallback: DataPeriod = "30",
): DataPeriod {
  return periods.includes(value as DataPeriod) ? (value as DataPeriod) : fallback;
}

export function parseScope(value?: string): DataScope {
  return scopes.includes(value as DataScope) ? (value as DataScope) : "team";
}

export function periodStart(period: DataPeriod) {
  if (period === "all") return undefined;

  const start = parseLocalDate(formatDateInput());
  start.setUTCDate(start.getUTCDate() - (Number(period) - 1));
  return start;
}

export function periodLabel(period: DataPeriod) {
  if (period === "all") return "Todo o período";
  return `Últimos ${period} dias`;
}
