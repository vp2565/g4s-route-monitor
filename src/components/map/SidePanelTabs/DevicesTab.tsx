import type { Device } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DevicesTabProps {
  devices: Device[];
  isDark: boolean;
}

function formatType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function BatteryBar({ level, isDark }: { level: number; isDark: boolean }) {
  const color = level > 50 ? "bg-green-500" : level > 20 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-12 h-2 rounded-full overflow-hidden", isDark ? "bg-gray-700" : "bg-gray-200")}>
        <div className={cn("h-full rounded-full", color)} style={{ width: `${level}%` }} />
      </div>
      <span className={cn("text-[10px] w-7 text-right", isDark ? "text-gray-400" : "text-gray-500")}>
        {level}%
      </span>
    </div>
  );
}

function SignalBar({ strength, isDark }: { strength: number; isDark: boolean }) {
  const bars = Math.ceil(strength / 25); // 0-4 bars
  return (
    <div className="flex items-end gap-px h-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-sm",
            i <= bars
              ? strength > 50 ? "bg-green-500" : strength > 25 ? "bg-yellow-500" : "bg-red-500"
              : isDark ? "bg-gray-700" : "bg-gray-200"
          )}
          style={{ height: `${i * 25}%` }}
        />
      ))}
    </div>
  );
}

function SensorDots({ sensors, isDark }: { sensors: Device["sensors"]; isDark: boolean }) {
  const entries: [string, boolean][] = [
    ["GPS", sensors.gps],
    ["Temp", sensors.temperature],
    ["Hum", sensors.humidity],
    ["Shock", sensors.shock],
    ["Light", sensors.light],
    ["Door", sensors.door],
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([label, active]) => (
        <span
          key={label}
          className={cn(
            "text-[9px] px-1 py-0.5 rounded",
            active
              ? isDark ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"
              : isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400"
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function DevicesTab({ devices, isDark }: DevicesTabProps) {
  if (devices.length === 0) {
    return (
      <div className={cn("text-sm text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>
        No devices assigned
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <div
          key={device.id}
          className={cn(
            "p-2.5 rounded-lg border",
            isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <div className={cn("text-xs font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                {formatType(device.type)}
              </div>
              <div className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>
                {device.vendor} {device.model}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SignalBar strength={device.signalStrength} isDark={isDark} />
            </div>
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <BatteryBar level={device.batteryLevel} isDark={isDark} />
            <span className={cn(
              "text-[10px] font-mono",
              isDark ? "text-gray-500" : "text-gray-400"
            )}>
              {device.serialNumber.slice(-8)}
            </span>
          </div>

          <SensorDots sensors={device.sensors} isDark={isDark} />
        </div>
      ))}
    </div>
  );
}
