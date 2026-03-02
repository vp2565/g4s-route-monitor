"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getAllRouteTemplates } from "@/lib/store";
import { displayRiskScore, riskScoreBgColor, MODE_ICONS } from "@/lib/shipment-utils";
import { AlertTriangle } from "lucide-react";
import type { RouteTemplate } from "@/lib/types";

interface Step1Props {
  selectedRouteId: string | null;
  onSelect: (route: RouteTemplate) => void;
  isDark: boolean;
}

export function Step1RouteSelection({
  selectedRouteId,
  onSelect,
  isDark,
}: Step1Props) {
  const routes = useMemo(() => getAllRouteTemplates(), []);

  return (
    <div className="space-y-4">
      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
        Select a route template for the new shipment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {routes.map((route) => {
          const risk = displayRiskScore(route.riskScore);
          const isSelected = selectedRouteId === route.id;
          return (
            <button
              key={route.id}
              type="button"
              onClick={() => onSelect(route)}
              className={cn(
                "text-left p-4 rounded-lg border-2 transition-colors",
                isSelected
                  ? "border-[#C8102E]"
                  : isDark
                  ? "border-gray-700 hover:border-gray-600"
                  : "border-gray-200 hover:border-gray-300",
                isDark ? "bg-gray-900/50" : "bg-white"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}
                >
                  {route.name}
                </h4>
                <span
                  className={cn(
                    "text-xs font-bold px-1.5 py-0.5 rounded",
                    riskScoreBgColor(risk, isDark)
                  )}
                >
                  {risk}/10
                </span>
              </div>
              <div
                className={cn(
                  "text-xs space-y-1",
                  isDark ? "text-gray-400" : "text-gray-500"
                )}
              >
                <p>
                  {route.origin} → {route.destination}
                </p>
                <p>
                  {route.distanceKm} km · ~{route.estimatedDurationHours}h
                </p>
                <p>
                  {route.transportModes.map((m) => `${MODE_ICONS[m]} ${m}`).join(" + ")}
                </p>
                <p className="text-[10px]">
                  {route.countryTransits.join(" → ")}
                </p>
              </div>
              {risk >= 8 && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-orange-500 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  High-risk route. Consider requesting SOC escort.
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
