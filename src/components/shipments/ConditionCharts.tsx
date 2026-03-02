"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { ConditionData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConditionChartsProps {
  conditionData: ConditionData;
  temperatureRange: { min: number; max: number } | null;
  isDark: boolean;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConditionCharts({
  conditionData,
  temperatureRange,
  isDark,
}: ConditionChartsProps) {
  const readings = conditionData.readings.map((r) => ({
    ...r,
    time: formatTime(r.timestamp),
  }));

  const tempBreaches = conditionData.breachEvents.filter(
    (b) => b.type === "temperature"
  );
  const humidityBreaches = conditionData.breachEvents.filter(
    (b) => b.type === "humidity"
  );

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const textColor = isDark ? "#9CA3AF" : "#6B7280";

  // Map breach time ranges to reading indices
  function getBreachIndices(
    breachStart: string,
    breachEnd: string | null
  ): { startIdx: string; endIdx: string } {
    const readings_ = conditionData.readings;
    const startTime = new Date(breachStart).getTime();
    const endTime = breachEnd
      ? new Date(breachEnd).getTime()
      : new Date(readings_[readings_.length - 1].timestamp).getTime();

    let startIdx = 0;
    let endIdx = readings_.length - 1;
    for (let i = 0; i < readings_.length; i++) {
      const t = new Date(readings_[i].timestamp).getTime();
      if (t >= startTime && startIdx === 0) startIdx = i;
      if (t <= endTime) endIdx = i;
    }
    return {
      startIdx: formatTime(readings_[startIdx].timestamp),
      endIdx: formatTime(readings_[endIdx].timestamp),
    };
  }

  return (
    <div className="space-y-6">
      {/* Temperature chart */}
      <div>
        <h4
          className={cn(
            "text-sm font-medium mb-2",
            isDark ? "text-gray-300" : "text-gray-700"
          )}
        >
          Temperature (°C)
        </h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#3B82F6"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3B82F6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: textColor }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: textColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1F2937" : "#fff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: 6,
                  fontSize: 11,
                  color: isDark ? "#E5E7EB" : "#111827",
                }}
              />
              {/* Threshold lines */}
              {temperatureRange && (
                <>
                  <ReferenceLine
                    y={temperatureRange.max}
                    stroke="#EF4444"
                    strokeDasharray="6 4"
                    label={{
                      value: `Max ${temperatureRange.max}°`,
                      position: "right",
                      fontSize: 10,
                      fill: "#EF4444",
                    }}
                  />
                  <ReferenceLine
                    y={temperatureRange.min}
                    stroke="#EF4444"
                    strokeDasharray="6 4"
                    label={{
                      value: `Min ${temperatureRange.min}°`,
                      position: "right",
                      fontSize: 10,
                      fill: "#EF4444",
                    }}
                  />
                </>
              )}
              {/* Breach areas */}
              {tempBreaches.map((b, i) => {
                const { startIdx, endIdx } = getBreachIndices(
                  b.startedAt,
                  b.endedAt
                );
                return (
                  <ReferenceArea
                    key={`tb-${i}`}
                    x1={startIdx}
                    x2={endIdx}
                    fill="#EF4444"
                    fillOpacity={0.15}
                  />
                );
              })}
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#3B82F6"
                fill="url(#tempGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity chart */}
      <div>
        <h4
          className={cn(
            "text-sm font-medium mb-2",
            isDark ? "text-gray-300" : "text-gray-700"
          )}
        >
          Humidity (%)
        </h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={readings}>
              <defs>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#8B5CF6"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#8B5CF6"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: textColor }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: textColor }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1F2937" : "#fff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: 6,
                  fontSize: 11,
                  color: isDark ? "#E5E7EB" : "#111827",
                }}
              />
              {humidityBreaches.map((b, i) => {
                const { startIdx, endIdx } = getBreachIndices(
                  b.startedAt,
                  b.endedAt
                );
                return (
                  <ReferenceArea
                    key={`hb-${i}`}
                    x1={startIdx}
                    x2={endIdx}
                    fill="#EF4444"
                    fillOpacity={0.15}
                  />
                );
              })}
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="#8B5CF6"
                fill="url(#humGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
