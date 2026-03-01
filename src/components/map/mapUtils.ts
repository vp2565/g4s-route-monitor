// ============================================================
// Shared map utilities
// Common functions used across map components to avoid duplication.
// ============================================================

/** Haversine distance between two [lat, lng] points in metres */
export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Status badge colors (light + dark theme) */
export const STATUS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  in_transit: { bg: "bg-green-100", text: "text-green-800", darkBg: "bg-green-900/40", darkText: "text-green-300" },
  active: { bg: "bg-green-100", text: "text-green-800", darkBg: "bg-green-900/40", darkText: "text-green-300" },
  at_checkpoint: { bg: "bg-blue-100", text: "text-blue-800", darkBg: "bg-blue-900/40", darkText: "text-blue-300" },
  delayed: { bg: "bg-yellow-100", text: "text-yellow-800", darkBg: "bg-yellow-900/40", darkText: "text-yellow-300" },
  planned: { bg: "bg-gray-100", text: "text-gray-700", darkBg: "bg-gray-800", darkText: "text-gray-300" },
  ddi_pending: { bg: "bg-gray-100", text: "text-gray-700", darkBg: "bg-gray-800", darkText: "text-gray-300" },
  completed: { bg: "bg-gray-100", text: "text-gray-500", darkBg: "bg-gray-800", darkText: "text-gray-400" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", darkBg: "bg-red-900/40", darkText: "text-red-300" },
};

/** Format "in_transit" → "In Transit" */
export function formatStatus(status: string): string {
  return status.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
