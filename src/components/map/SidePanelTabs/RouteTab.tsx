import type { RouteTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RouteTabProps {
  route: RouteTemplate | null;
  deviationCount: number;
  isDark: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  origin: "A",
  waypoint: "-",
  checkpoint: "C",
  port: "P",
  destination: "B",
};

export function RouteTab({ route, deviationCount, isDark }: RouteTabProps) {
  if (!route) {
    return (
      <div className={cn("text-sm text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>
        No route template assigned
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route stats */}
      <div className={cn(
        "grid grid-cols-3 gap-2 p-3 rounded-lg",
        isDark ? "bg-gray-800/50" : "bg-gray-50"
      )}>
        <div>
          <div className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>
            Distance
          </div>
          <div className={cn("text-sm font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
            {route.distanceKm.toLocaleString()} km
          </div>
        </div>
        <div>
          <div className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>
            Duration
          </div>
          <div className={cn("text-sm font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
            {route.estimatedDurationHours}h
          </div>
        </div>
        <div>
          <div className={cn("text-[10px] uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>
            Countries
          </div>
          <div className={cn("text-sm font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
            {route.countryTransits.length}
          </div>
        </div>
      </div>

      {/* Countries list */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
          Country Transits
        </div>
        <div className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-600")}>
          {route.countryTransits.join(" \u2192 ")}
        </div>
      </div>

      {/* Deviation count */}
      {deviationCount > 0 && (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded text-xs font-medium",
          isDark ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
        )}>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          {deviationCount} deviation{deviationCount > 1 ? "s" : ""} detected
        </div>
      )}

      {/* Waypoint table */}
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-2", isDark ? "text-gray-500" : "text-gray-400")}>
          Waypoints ({route.waypoints.length})
        </div>
        <div className="space-y-1">
          {route.waypoints.map((wp, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-xs",
                isDark ? "bg-gray-800/50" : "bg-gray-50"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                wp.type === "origin" || wp.type === "destination"
                  ? isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"
                  : wp.type === "port"
                    ? isDark ? "bg-cyan-900/50 text-cyan-300" : "bg-cyan-100 text-cyan-700"
                    : wp.type === "checkpoint"
                      ? isDark ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                      : isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"
              )}>
                {TYPE_ICONS[wp.type] || "-"}
              </span>
              <div className="flex-1 min-w-0">
                <div className={cn("truncate", isDark ? "text-gray-200" : "text-gray-700")}>
                  {wp.name}
                </div>
              </div>
              <span className={cn("text-[10px] capitalize shrink-0", isDark ? "text-gray-500" : "text-gray-400")}>
                {wp.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk */}
      <div className={cn(
        "flex items-center justify-between p-2 rounded",
        isDark ? "bg-gray-800/50" : "bg-gray-50"
      )}>
        <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Route Risk Score</span>
        <span className={cn("text-sm font-semibold", {
          "text-green-500": route.riskLevel === "low",
          "text-yellow-500": route.riskLevel === "medium",
          "text-orange-500": route.riskLevel === "high",
          "text-red-500": route.riskLevel === "critical",
        })}>
          {route.riskScore}/100
        </span>
      </div>
    </div>
  );
}
