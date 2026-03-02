"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getAvailableDevices } from "@/lib/store";
import type { Device } from "@/lib/types";
import { Check, AlertTriangle } from "lucide-react";

interface Step4Props {
  selectedDeviceIds: string[];
  onToggle: (deviceId: string) => void;
  isDark: boolean;
}

const SENSOR_LABELS: { key: keyof Device["sensors"]; label: string }[] = [
  { key: "gps", label: "GPS" },
  { key: "temperature", label: "Temp" },
  { key: "humidity", label: "Hum" },
  { key: "shock", label: "Shock" },
  { key: "light", label: "Light" },
  { key: "door", label: "Door" },
];

export function Step4DeviceAssignment({
  selectedDeviceIds,
  onToggle,
  isDark,
}: Step4Props) {
  const devices = useMemo(() => getAvailableDevices(), []);

  return (
    <div className="space-y-4">
      <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
        Select tracking devices to assign. Devices with low battery (&lt;20%)
        cannot be selected.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {devices.map((d) => {
          const isLowBattery = d.batteryLevel < 20;
          const isSelected = selectedDeviceIds.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              disabled={isLowBattery}
              onClick={() => !isLowBattery && onToggle(d.id)}
              className={cn(
                "text-left p-3 rounded-lg border-2 transition-colors relative",
                isLowBattery
                  ? isDark
                    ? "border-gray-800 bg-gray-900/30 opacity-50 cursor-not-allowed"
                    : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                  : isSelected
                  ? "border-blue-500"
                  : isDark
                  ? "border-gray-700 hover:border-gray-600 bg-gray-900/50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isDark ? "text-gray-200" : "text-gray-800"
                  )}
                >
                  {d.id}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    isDark
                      ? "bg-gray-800 text-gray-400"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {d.vendor} {d.model}
                </span>
              </div>

              {/* Battery bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-700/30">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.batteryLevel > 50
                        ? "bg-green-500"
                        : d.batteryLevel > 20
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    )}
                    style={{ width: `${d.batteryLevel}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] w-8 text-right",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}
                >
                  {d.batteryLevel}%
                </span>
              </div>

              {/* Signal bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-end gap-0.5 h-3">
                  {[20, 40, 60, 80, 100].map((thresh) => (
                    <div
                      key={thresh}
                      className={cn(
                        "w-1 rounded-sm",
                        d.signalStrength >= thresh
                          ? "bg-green-500"
                          : isDark
                          ? "bg-gray-700"
                          : "bg-gray-300"
                      )}
                      style={{ height: `${thresh / 100 * 12}px` }}
                    />
                  ))}
                </div>
                <span
                  className={cn(
                    "text-[10px]",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  Signal {d.signalStrength}%
                </span>
              </div>

              {/* Sensor dots */}
              <div className="flex gap-1.5 flex-wrap">
                {SENSOR_LABELS.map(({ key, label }) => (
                  <span
                    key={key}
                    className={cn(
                      "text-[9px] px-1 py-0.5 rounded",
                      d.sensors[key]
                        ? isDark
                          ? "bg-green-900/40 text-green-400"
                          : "bg-green-100 text-green-700"
                        : isDark
                        ? "bg-gray-800 text-gray-600"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {isLowBattery && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-red-400 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Battery too low
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDeviceIds.length > 0 && (
        <p
          className={cn(
            "text-xs",
            isDark ? "text-gray-400" : "text-gray-500"
          )}
        >
          {selectedDeviceIds.length} device{selectedDeviceIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
