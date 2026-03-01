import type { Shipment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, formatStatus } from "../mapUtils";

const RISK_COLORS: Record<string, string> = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  critical: "text-red-500",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function formatWeight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;
}

interface OverviewTabProps {
  shipment: Shipment;
  isDark: boolean;
}

export function OverviewTab({ shipment, isDark }: OverviewTabProps) {
  const statusStyle = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.planned;

  return (
    <div className="space-y-4">
      {/* Status + Priority */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded",
          isDark ? statusStyle.darkBg + " " + statusStyle.darkText : statusStyle.bg + " " + statusStyle.text
        )}>
          {formatStatus(shipment.status)}
        </span>
        {shipment.priority !== "standard" && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded",
            shipment.priority === "critical"
              ? isDark ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-800"
              : isDark ? "bg-orange-900/40 text-orange-300" : "bg-orange-100 text-orange-800"
          )}>
            {shipment.priority.toUpperCase()}
          </span>
        )}
      </div>

      {/* Route */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          Route
        </div>
        <div className={cn("text-sm", isDark ? "text-gray-200" : "text-gray-800")}>
          {shipment.origin} <span className={isDark ? "text-gray-500" : "text-gray-400"}>&rarr;</span> {shipment.destination}
        </div>
        <div className={cn("text-xs mt-0.5", isDark ? "text-gray-500" : "text-gray-500")}>
          {shipment.customerName}
        </div>
      </div>

      {/* Cargo */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          Cargo
        </div>
        <div className={cn("text-sm", isDark ? "text-gray-200" : "text-gray-800")}>
          {shipment.cargoDescription}
        </div>
        <div className={cn("text-xs mt-0.5 flex gap-3", isDark ? "text-gray-400" : "text-gray-500")}>
          <span>{formatCurrency(shipment.cargoValue)}</span>
          <span>{formatWeight(shipment.cargoWeight)}</span>
        </div>
      </div>

      {/* Driver & Vehicle */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          Driver & Vehicle
        </div>
        <div className={cn("text-sm", isDark ? "text-gray-200" : "text-gray-800")}>
          {shipment.driverName}
        </div>
        <div className={cn("text-xs mt-0.5 flex gap-3", isDark ? "text-gray-400" : "text-gray-500")}>
          <span>{shipment.driverPhone}</span>
          <span className="font-mono">{shipment.vehiclePlate}</span>
        </div>
      </div>

      {/* ETA & Progress */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          ETA
        </div>
        <div className={cn("text-sm", isDark ? "text-gray-200" : "text-gray-800")}>
          {shipment.estimatedArrival
            ? new Date(shipment.estimatedArrival).toLocaleString("en-GB", {
                weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : "N/A"}
        </div>
        {shipment.progressPercent > 0 && shipment.status !== "completed" && (
          <div className="mt-2">
            <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-gray-700" : "bg-gray-200")}>
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${shipment.progressPercent}%` }}
              />
            </div>
            <div className={cn("text-[10px] text-right mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>
              {shipment.progressPercent}%
            </div>
          </div>
        )}
      </div>

      {/* Risk Score */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          Risk Score
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-semibold", RISK_COLORS[shipment.riskLevel])}>
            {shipment.riskScore}
          </span>
          <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>/100</span>
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded capitalize",
            shipment.riskLevel === "critical"
              ? isDark ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-700"
              : shipment.riskLevel === "high"
                ? isDark ? "bg-orange-900/40 text-orange-300" : "bg-orange-100 text-orange-700"
                : shipment.riskLevel === "medium"
                  ? isDark ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                  : isDark ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-700"
          )}>
            {shipment.riskLevel}
          </span>
        </div>
      </div>

      {/* DDI Summary */}
      {shipment.ddi && (
        <div>
          <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
            DDI Status
          </div>
          <div className={cn("text-xs space-y-0.5", isDark ? "text-gray-300" : "text-gray-600")}>
            <div>Driver Verified: {shipment.ddi.driverVerified ? "Yes" : "No"}</div>
            <div>Seals: {shipment.ddi.sealNumbers.join(", ")}</div>
            <div>Completed: {new Date(shipment.ddi.completedAt).toLocaleString("en-GB", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            })}</div>
          </div>
        </div>
      )}

      {/* Transport modes */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          Transport Modes
        </div>
        <div className="flex gap-1.5">
          {shipment.transportModes.map((mode) => (
            <span key={mode} className={cn(
              "text-xs px-2 py-0.5 rounded capitalize",
              isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
            )}>
              {mode}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
