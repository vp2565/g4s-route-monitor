"use client";

import { cn } from "@/lib/utils";
import { MODE_ICONS } from "@/lib/shipment-utils";
import type { RouteTemplate, TransportMode } from "@/lib/types";

export interface SegmentConfigData {
  origin: string;
  destination: string;
  mode: TransportMode;
  carrier: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  reportingRateMinutes: number;
}

interface Step3Props {
  segments: SegmentConfigData[];
  onChange: (segments: SegmentConfigData[]) => void;
  isDark: boolean;
}

const DEFAULT_RATES: Record<string, number> = {
  road: 5,
  sea: 30,
  rail: 15,
  air: 10,
};

export function generateSegmentsFromRoute(
  route: RouteTemplate
): SegmentConfigData[] {
  const wps = route.waypoints;
  if (wps.length < 2) return [];

  const segs: SegmentConfigData[] = [];

  for (let i = 0; i < wps.length - 1; i++) {
    const from = wps[i];
    const to = wps[i + 1];

    // Determine mode: if either is a port, segment is sea; else use route's first land mode
    const isPortTransition =
      from.type === "port" || to.type === "port";
    let mode: TransportMode = route.transportModes[0] ?? "road";
    if (isPortTransition && route.transportModes.includes("sea")) {
      // If leaving a port for next port → sea
      if (from.type === "port" && to.type === "port") mode = "sea";
      // If arriving at port from land → still road
      else if (to.type === "port" && from.type !== "port") mode = "road";
      // If leaving port to non-port → road
      else if (from.type === "port" && to.type !== "port") mode = "road";
    }
    // For multimodal, check if sea segment is between two ports
    if (
      from.type === "port" &&
      to.type === "port" &&
      route.transportModes.includes("sea")
    ) {
      mode = "sea";
    }

    segs.push({
      origin: from.name,
      destination: to.name,
      mode,
      carrier: "",
      scheduledDeparture: "",
      scheduledArrival: "",
      reportingRateMinutes: DEFAULT_RATES[mode] ?? 5,
    });
  }

  return segs;
}

export function Step3SegmentConfig({
  segments,
  onChange,
  isDark,
}: Step3Props) {
  function updateSegment(index: number, patch: Partial<SegmentConfigData>) {
    const updated = segments.map((s, i) =>
      i === index ? { ...s, ...patch } : s
    );
    onChange(updated);
  }

  const inputCls = cn(
    "w-full h-8 px-2 text-xs rounded-md border outline-none",
    isDark
      ? "bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
      : "bg-white border-gray-300 placeholder:text-gray-400"
  );

  const labelCls = cn(
    "text-[10px] font-medium mb-0.5 block",
    isDark ? "text-gray-500" : "text-gray-400"
  );

  return (
    <div className="space-y-4">
      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
        Configure each segment of the journey. Segments are auto-generated from
        route waypoints.
      </p>

      <div className="space-y-3">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg border p-4",
              isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{MODE_ICONS[seg.mode]}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}
              >
                Segment {i + 1}: {seg.origin} → {seg.destination}
              </span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded capitalize",
                  isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                )}
              >
                {seg.mode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Carrier</label>
                <input
                  className={inputCls}
                  placeholder="Carrier name"
                  value={seg.carrier}
                  onChange={(e) =>
                    updateSegment(i, { carrier: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Sched. Departure</label>
                <input
                  className={inputCls}
                  type="datetime-local"
                  value={seg.scheduledDeparture}
                  onChange={(e) =>
                    updateSegment(i, { scheduledDeparture: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Sched. Arrival</label>
                <input
                  className={inputCls}
                  type="datetime-local"
                  value={seg.scheduledArrival}
                  onChange={(e) =>
                    updateSegment(i, { scheduledArrival: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Reporting Rate (min)</label>
                <input
                  className={inputCls}
                  type="number"
                  value={seg.reportingRateMinutes}
                  onChange={(e) =>
                    updateSegment(i, {
                      reportingRateMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
