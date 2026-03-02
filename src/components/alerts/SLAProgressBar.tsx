"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SLAProgressBarProps {
  triggeredAt: string;
  deadline: string;
  breached: boolean;
  isDark: boolean;
}

export function SLAProgressBar({ triggeredAt, deadline, breached, isDark }: SLAProgressBarProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const start = new Date(triggeredAt).getTime();
  const end = new Date(deadline).getTime();
  const total = end - start;
  const elapsed = now - start;
  const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const remaining = end - now;
  const isExpired = remaining <= 0;
  const isUrgent = percent >= 75;

  // Format remaining time
  let remainingText: string;
  if (isExpired) {
    const overMins = Math.floor(Math.abs(remaining) / 60000);
    const overHrs = Math.floor(overMins / 60);
    remainingText = overHrs > 0 ? `Breached by ${overHrs}h ${overMins % 60}m` : `Breached by ${overMins}m`;
  } else {
    const mins = Math.floor(remaining / 60000);
    const hrs = Math.floor(mins / 60);
    remainingText = hrs > 0 ? `${hrs}h ${mins % 60}m remaining` : `${mins}m remaining`;
  }

  // Format total duration
  const totalMins = Math.floor(total / 60000);
  const totalHrs = Math.floor(totalMins / 60);
  const totalText = totalHrs > 0 ? `${totalHrs}h ${totalMins % 60}m` : `${totalMins}m`;

  const barColor = isExpired || breached ? "#EF4444" : isUrgent ? "#F97316" : "#3B82F6";

  return (
    <div className={cn("rounded-lg p-3 border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-gray-700")}>SLA Timer</span>
        <span
          className={cn(
            "text-xs font-bold",
            isExpired || breached ? "text-red-500" : isUrgent ? "text-orange-500" : isDark ? "text-blue-400" : "text-blue-600"
          )}
        >
          {remainingText}
        </span>
      </div>

      {/* Progress bar */}
      <div className={cn("h-2.5 rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-gray-100")}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className={cn("text-[10px]", isDark ? "text-slate-500" : "text-gray-400")}>
          {Math.round(percent)}% elapsed
        </span>
        <span className={cn("text-[10px]", isDark ? "text-slate-500" : "text-gray-400")}>
          Total SLA: {totalText}
        </span>
      </div>
    </div>
  );
}
