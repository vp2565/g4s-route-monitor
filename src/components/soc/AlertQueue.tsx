"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Alert } from "@/lib/types";
import {
  SEVERITY_COLORS,
  STATUS_PILL_STYLES,
  ALERT_TYPE_ICONS,
  formatTimeSince,
} from "@/lib/alert-utils";

function SLACountdown({ deadline: deadlineStr, breached }: { deadline: string; breached: boolean }) {
  const [remaining, setRemaining] = useState("");
  const [isExpired, setIsExpired] = useState(breached);

  useEffect(() => {
    function update() {
      const deadline = new Date(deadlineStr).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsExpired(true);
        const overMs = Math.abs(diff);
        const overMins = Math.floor(overMs / 60000);
        const overHrs = Math.floor(overMins / 60);
        setRemaining(overHrs > 0 ? `-${overHrs}h ${overMins % 60}m` : `-${overMins}m`);
      } else {
        setIsExpired(false);
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        setRemaining(hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`);
      }
    }
    update();
    const interval = setInterval(update, 10000); // update every 10s
    return () => clearInterval(interval);
  }, [deadlineStr]);

  return (
    <span
      className="font-mono text-[10px] px-1.5 py-0.5 rounded"
      style={{
        backgroundColor: isExpired ? "#7F1D1D" : "#1E3A5F",
        color: isExpired ? "#FCA5A5" : "#93C5FD",
      }}
    >
      SLA {isExpired ? "BREACHED " : ""}{remaining}
    </span>
  );
}

interface AlertQueueProps {
  alerts: Alert[];
  selectedAlertId: string | null;
  onSelectAlert: (alertId: string) => void;
}

export function AlertQueue({ alerts, selectedAlertId, onSelectAlert }: AlertQueueProps) {
  // Sort by SLA urgency: closest to breach first (active alerts)
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Active (non-resolved) alerts first
    const aActive = !["resolved", "closed", "false_alarm"].includes(a.status);
    const bActive = !["resolved", "closed", "false_alarm"].includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;

    // Among active: sort by SLA deadline (closest first)
    return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
  });

  const unreadCount = alerts.filter((a) => a.status === "new").length;

  return (
    <div className="w-[300px] flex flex-col border-r border-slate-800 bg-slate-950 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-slate-200">Alert Queue</span>
        </div>
        {unreadCount > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#991B1B", color: "#FCA5A5" }}
          >
            {unreadCount} NEW
          </span>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {sortedAlerts.map((alert) => {
          const Icon = ALERT_TYPE_ICONS[alert.type] || AlertTriangle;
          const sevColor = SEVERITY_COLORS[alert.severity];
          const statusPill = STATUS_PILL_STYLES[alert.status] || STATUS_PILL_STYLES.new;
          const isSelected = alert.id === selectedAlertId;
          const isActive = !["resolved", "closed", "false_alarm"].includes(alert.status);

          return (
            <button
              key={alert.id}
              onClick={() => onSelectAlert(alert.id)}
              className="w-full text-left px-3 py-2.5 border-b border-slate-800/60 transition-colors"
              style={{
                backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "transparent",
                borderLeftWidth: 3,
                borderLeftColor: isSelected ? "#3B82F6" : sevColor,
                opacity: isActive ? 1 : 0.5,
              }}
            >
              {/* Top row: severity icon + type + status pill */}
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={14} style={{ color: sevColor }} />
                <span className="text-xs font-medium text-slate-300 flex-1 truncate">
                  {alert.title.split("—")[0].trim()}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
                  style={{ backgroundColor: statusPill.bg, color: statusPill.text }}
                >
                  {statusPill.label}
                </span>
              </div>

              {/* Customer + Shipment */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium"
                  style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}
                >
                  {alert.customerName.split(" ")[0]}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{alert.shipmentRef}</span>
              </div>

              {/* Bottom row: time since + SLA */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {formatTimeSince(alert.triggeredAt)}
                </span>
                {isActive && (
                  <SLACountdown deadline={alert.slaDeadline} breached={alert.slaBreached} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
