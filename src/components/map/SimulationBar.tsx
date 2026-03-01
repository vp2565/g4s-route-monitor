"use client";

import { Play, Pause, RotateCcw, Zap, Wifi, WifiOff } from "lucide-react";
import type { SimulationStatus } from "@/hooks/useSimulation";

const SPEED_OPTIONS = [1, 5, 10, 20];

function formatSimTime(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

interface SimulationBarProps {
  status: SimulationStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  alertCount: number;
  isDark: boolean;
}

export function SimulationBar({
  status,
  onStart,
  onPause,
  onReset,
  onSetSpeed,
  alertCount,
  isDark,
}: SimulationBarProps) {
  const bg = isDark ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-gray-200";
  const text = isDark ? "text-slate-300" : "text-gray-600";
  const textMuted = isDark ? "text-slate-500" : "text-gray-400";

  return (
    <div
      className={`absolute bottom-4 right-4 z-[1000] flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg border ${bg}`}
    >
      {/* Connection indicator */}
      <div className="flex items-center gap-1">
        {status.connected ? (
          <Wifi size={12} className="text-green-500" />
        ) : (
          <WifiOff size={12} className="text-red-500" />
        )}
      </div>

      {/* Play / Pause */}
      <button
        onClick={status.running ? onPause : onStart}
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
        style={{
          backgroundColor: status.running ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
          color: status.running ? "#EF4444" : "#22C55E",
          border: status.running ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)",
        }}
        title={status.running ? "Pause" : "Start"}
      >
        {status.running ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${textMuted} hover:${text}`}
        style={{
          backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(243, 244, 246, 1)",
          border: isDark ? "1px solid #334155" : "1px solid #E5E7EB",
        }}
        title="Reset"
      >
        <RotateCcw size={13} />
      </button>

      {/* Divider */}
      <div className={`w-px h-6 ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <Zap size={11} className={textMuted} />
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors"
            style={{
              backgroundColor:
                status.speed === s
                  ? isDark
                    ? "rgba(59, 130, 246, 0.25)"
                    : "rgba(59, 130, 246, 0.15)"
                  : "transparent",
              color:
                status.speed === s
                  ? "#3B82F6"
                  : isDark
                    ? "#64748B"
                    : "#9CA3AF",
              border:
                status.speed === s
                  ? "1px solid rgba(59, 130, 246, 0.4)"
                  : "1px solid transparent",
            }}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className={`w-px h-6 ${isDark ? "bg-slate-700" : "bg-gray-200"}`} />

      {/* Simulation clock */}
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] ${textMuted}`}>SIM</span>
        <span className={`text-xs font-mono font-bold ${text}`}>
          {formatSimTime(status.simulatedTime)}
        </span>
      </div>

      {/* Tick counter */}
      <span className={`text-[9px] font-mono ${textMuted}`}>T{status.tick}</span>

      {/* Alert badge */}
      {alertCount > 0 && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: "#991B1B", color: "#FCA5A5" }}
        >
          +{alertCount}
        </span>
      )}

      {/* Running indicator */}
      {status.running && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      )}
    </div>
  );
}
