// ============================================================
// Alert display utilities
// Single source of truth for alert colors, icons, and formatting.
// ============================================================

import {
  AlertTriangle,
  ThermometerSun,
  WifiOff,
  BatteryLow,
  Clock,
  Shield,
  Droplets,
  MapPin,
  Lightbulb,
  DoorOpen,
  Zap,
} from "lucide-react";
import type { AlertType, AlertSeverity, AlertStatus } from "./types";

// --- Severity hex colors ---

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#6B7280",
};

// --- Theme-aware severity background classes ---

export const SEVERITY_BG: Record<
  AlertSeverity,
  { light: string; dark: string }
> = {
  critical: {
    light: "bg-red-100 text-red-800",
    dark: "bg-red-900/40 text-red-300",
  },
  high: {
    light: "bg-orange-100 text-orange-800",
    dark: "bg-orange-900/40 text-orange-300",
  },
  medium: {
    light: "bg-yellow-100 text-yellow-800",
    dark: "bg-yellow-900/40 text-yellow-300",
  },
  low: {
    light: "bg-gray-100 text-gray-700",
    dark: "bg-gray-700 text-gray-300",
  },
};

// --- Tive-style status pill colors ---

export const STATUS_PILL_STYLES: Record<
  AlertStatus,
  { bg: string; text: string; label: string }
> = {
  new: { bg: "#991B1B", text: "#FECACA", label: "NEW" },
  acknowledged: { bg: "#DC2626", text: "#FEE2E2", label: "ACK" },
  investigating: { bg: "#DC2626", text: "#FEE2E2", label: "INVESTIGATING" },
  dispatched: { bg: "#D97706", text: "#FEF3C7", label: "DISPATCHED" },
  resolved: { bg: "#16A34A", text: "#DCFCE7", label: "RESOLVED" },
  closed: { bg: "#6B7280", text: "#E5E7EB", label: "CLOSED" },
  false_alarm: { bg: "#6B7280", text: "#E5E7EB", label: "FALSE ALARM" },
};

// --- Alert type → Lucide icon mapping ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ALERT_TYPE_ICONS: Record<AlertType, any> = {
  route_deviation: MapPin,
  geofence_breach: Shield,
  unauthorized_stop: MapPin,
  temperature_breach: ThermometerSun,
  humidity_breach: Droplets,
  shock_detected: Zap,
  light_exposure: Lightbulb,
  door_open: DoorOpen,
  signal_loss: WifiOff,
  battery_low: BatteryLow,
  late_departure: Clock,
  eta_exceeded: Clock,
  tampering: AlertTriangle,
};

// --- Formatting helpers ---

/** "route_deviation" → "Route Deviation" */
export function formatAlertType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** "12m ago" / "3h 22m ago" / "2d ago" */
export function formatTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Short date format: "27 Feb, 14:32" */
export function formatAlertDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** True for non-terminal alert statuses */
export function isAlertActive(status: AlertStatus): boolean {
  return !["resolved", "closed", "false_alarm"].includes(status);
}
