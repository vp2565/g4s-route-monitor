"use client";

import { cn } from "@/lib/utils";
import type { RouteTemplate } from "@/lib/types";
import type { ShipmentDetailsData } from "./Step2ShipmentDetails";
import type { SegmentConfigData } from "./Step3SegmentConfig";
import { displayRiskScore, riskScoreBgColor, MODE_ICONS, formatCurrency } from "@/lib/shipment-utils";
import { Rocket, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step5Props {
  route: RouteTemplate;
  details: ShipmentDetailsData;
  segments: SegmentConfigData[];
  selectedDeviceIds: string[];
  isDark: boolean;
  onDispatch: () => void;
  isDispatching: boolean;
}

export function Step5ReviewDispatch({
  route,
  details,
  segments,
  selectedDeviceIds,
  isDark,
  onDispatch,
  isDispatching,
}: Step5Props) {
  const risk = displayRiskScore(route.riskScore);

  const sectionCls = cn(
    "rounded-lg border p-4",
    isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"
  );

  const headCls = cn(
    "text-xs font-semibold uppercase tracking-wider mb-2",
    isDark ? "text-gray-500" : "text-gray-400"
  );

  const rowCls = cn(
    "flex justify-between text-xs py-0.5",
    isDark ? "text-gray-300" : "text-gray-600"
  );

  const labelCls = isDark ? "text-gray-500" : "text-gray-400";

  return (
    <div className="space-y-4">
      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
        Review all details before dispatching.
      </p>

      {/* Route */}
      <div className={sectionCls}>
        <h4 className={headCls}>Route</h4>
        <div className={rowCls}>
          <span className={labelCls}>Template</span>
          <span className="font-medium">{route.name}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Route</span>
          <span>{route.origin} → {route.destination}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Distance</span>
          <span>{route.distanceKm} km</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Risk</span>
          <span className={cn("font-bold px-1.5 rounded", riskScoreBgColor(risk, isDark))}>
            {risk}/10
          </span>
        </div>
      </div>

      {/* Shipment Details */}
      <div className={sectionCls}>
        <h4 className={headCls}>Shipment Details</h4>
        <div className={rowCls}>
          <span className={labelCls}>Priority</span>
          <span className="capitalize">{details.priority}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Cargo</span>
          <span>{details.cargoDescription || "—"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Value</span>
          <span>{details.cargoValue ? formatCurrency(Number(details.cargoValue)) : "—"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Weight</span>
          <span>{details.cargoWeight ? `${details.cargoWeight} kg` : "—"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Driver</span>
          <span>{details.driverName || "—"}</span>
        </div>
        <div className={rowCls}>
          <span className={labelCls}>Vehicle</span>
          <span>{details.vehiclePlate || "—"}</span>
        </div>
        {details.tempMin && details.tempMax && (
          <div className={rowCls}>
            <span className={labelCls}>Temp Range</span>
            <span>{details.tempMin}° — {details.tempMax}°C</span>
          </div>
        )}
      </div>

      {/* DDI Summary */}
      <div className={sectionCls}>
        <h4 className={headCls}>DDI Checklist</h4>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(details.ddi).map(([key, val]) => (
            <span key={key} className={cn("flex items-center gap-1 text-xs", isDark ? "text-gray-400" : "text-gray-600")}>
              {val ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-400" />
              )}
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
            </span>
          ))}
        </div>
      </div>

      {/* Segments */}
      <div className={sectionCls}>
        <h4 className={headCls}>Segments ({segments.length})</h4>
        {segments.map((seg, i) => (
          <div key={i} className={cn("text-xs py-1", i > 0 && (isDark ? "border-t border-gray-800" : "border-t border-gray-100"))}>
            <span className="font-medium">
              {MODE_ICONS[seg.mode]} {seg.origin} → {seg.destination}
            </span>
            {seg.carrier && (
              <span className={cn("ml-2", labelCls)}>({seg.carrier})</span>
            )}
          </div>
        ))}
      </div>

      {/* Devices */}
      <div className={sectionCls}>
        <h4 className={headCls}>Devices ({selectedDeviceIds.length})</h4>
        {selectedDeviceIds.length === 0 ? (
          <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
            No devices assigned
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedDeviceIds.map((id) => (
              <span
                key={id}
                className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                )}
              >
                {id}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dispatch button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={onDispatch}
          disabled={isDispatching}
          className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-base font-semibold"
        >
          <Rocket className="h-5 w-5 mr-2" />
          {isDispatching ? "Dispatching..." : "DISPATCH SHIPMENT"}
        </Button>
      </div>
    </div>
  );
}
