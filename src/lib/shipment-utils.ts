// ============================================================
// Shipment display utilities
// Shared formatting and color functions for shipment pages.
// ============================================================

export { STATUS_COLORS, formatStatus } from "@/components/map/mapUtils";

/** Convert raw 0-100 risk score to display 1-10 scale */
export function displayRiskScore(raw: number): number {
  return Math.max(1, Math.min(10, Math.round(raw / 10)));
}

/** Text color class for 1-10 risk score */
export function riskScoreColor(score1to10: number): string {
  if (score1to10 <= 3) return "text-green-600";
  if (score1to10 <= 6) return "text-yellow-600";
  return "text-red-600";
}

/** Background color class for 1-10 risk score (theme-aware) */
export function riskScoreBgColor(score1to10: number, isDark: boolean): string {
  if (score1to10 <= 3)
    return isDark ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800";
  if (score1to10 <= 6)
    return isDark ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-800";
  return isDark ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-800";
}

/** Mode emoji mapping */
export const MODE_ICONS: Record<string, string> = {
  road: "🚛",
  sea: "🚢",
  rail: "🚂",
  air: "✈️",
};

/** Format EUR currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format ISO date to short ETA string */
export function formatETA(isoDate: string | null): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  return d.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
