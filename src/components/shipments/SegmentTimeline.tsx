"use client";

import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/types";
import { MODE_ICONS, formatETA } from "@/lib/shipment-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SegmentTimelineProps {
  segments: Segment[];
  isDark: boolean;
}

const STATUS_BAR: Record<string, { bg: string; border: string }> = {
  completed: { bg: "bg-green-500", border: "border-green-500" },
  active: { bg: "bg-blue-500", border: "border-blue-500" },
  pending: { bg: "bg-gray-400", border: "border-gray-400" },
  delayed: { bg: "bg-yellow-500", border: "border-yellow-500" },
  cancelled: { bg: "bg-red-400", border: "border-red-400" },
};

export function SegmentTimeline({ segments, isDark }: SegmentTimelineProps) {
  const sorted = [...segments].sort(
    (a, b) => a.segmentNumber - b.segmentNumber
  );

  return (
    <div className="space-y-4">
      {/* Visual bar */}
      <div className="flex items-center gap-1">
        {sorted.map((seg, i) => {
          const sb = STATUS_BAR[seg.status] ?? STATUS_BAR.pending;
          return (
            <div key={seg.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <span className="text-base mb-1">{MODE_ICONS[seg.mode]}</span>
                <div
                  className={cn("h-2 rounded-full w-full", sb.bg)}
                  title={`${seg.origin} → ${seg.destination}`}
                />
                <span
                  className={cn(
                    "text-[9px] mt-1",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {seg.origin.split(",")[0]}
                </span>
              </div>
              {i < sorted.length - 1 && (
                <div
                  className={cn(
                    "w-2 h-0.5 -mx-0.5",
                    isDark ? "bg-gray-700" : "bg-gray-300"
                  )}
                />
              )}
            </div>
          );
        })}
        {/* Final destination label */}
        {sorted.length > 0 && (
          <span
            className={cn(
              "text-[9px] ml-1 whitespace-nowrap",
              isDark ? "text-gray-500" : "text-gray-400"
            )}
          >
            {sorted[sorted.length - 1].destination.split(",")[0]}
          </span>
        )}
      </div>

      {/* Accordion details */}
      <Accordion type="multiple" className="space-y-1">
        {sorted.map((seg) => {
          const sb = STATUS_BAR[seg.status] ?? STATUS_BAR.pending;
          return (
            <AccordionItem
              key={seg.id}
              value={seg.id}
              className={cn(
                "border rounded-lg px-3",
                isDark ? "border-gray-700" : "border-gray-200"
              )}
            >
              <AccordionTrigger
                className={cn(
                  "text-sm py-2 hover:no-underline",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      sb.bg
                    )}
                  />
                  <span className="text-base">{MODE_ICONS[seg.mode]}</span>
                  <span className="font-medium">
                    Segment {seg.segmentNumber}: {seg.origin} → {seg.destination}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded capitalize",
                      isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {seg.status}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className={cn(
                    "grid grid-cols-2 gap-x-6 gap-y-2 text-xs pb-2",
                    isDark ? "text-gray-300" : "text-gray-600"
                  )}
                >
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Carrier
                    </span>
                    <p className="font-medium">{seg.carrier}</p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Ref
                    </span>
                    <p className="font-medium">{seg.carrierRef || "—"}</p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Sched. Departure
                    </span>
                    <p className="font-medium">
                      {formatETA(seg.scheduledDeparture)}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Actual Departure
                    </span>
                    <p className="font-medium">
                      {formatETA(seg.actualDeparture)}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Sched. Arrival
                    </span>
                    <p className="font-medium">
                      {formatETA(seg.scheduledArrival)}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Actual Arrival
                    </span>
                    <p className="font-medium">
                      {formatETA(seg.actualArrival)}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Distance
                    </span>
                    <p className="font-medium">{seg.distanceKm} km</p>
                  </div>
                  <div>
                    <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                      Reporting Rate
                    </span>
                    <p className="font-medium">
                      Every {seg.reportingRateMinutes} min
                    </p>
                  </div>
                  {seg.deviceIds.length > 0 && (
                    <div className="col-span-2">
                      <span
                        className={
                          isDark ? "text-gray-500" : "text-gray-400"
                        }
                      >
                        Devices
                      </span>
                      <p className="font-medium">
                        {seg.deviceIds.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
