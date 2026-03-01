"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowRightLeft, AlertTriangle, Clock } from "lucide-react";
import type { Alert, AlertSeverity } from "@/lib/types";

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; text: string }> = {
  critical: { bg: "#7F1D1D", text: "#FCA5A5" },
  high: { bg: "#7C2D12", text: "#FDBA74" },
  medium: { bg: "#713F12", text: "#FDE68A" },
  low: { bg: "#1E293B", text: "#94A3B8" },
};

interface ShiftHandoverModalProps {
  alerts: Alert[];
}

export function ShiftHandoverModal({ alerts }: ShiftHandoverModalProps) {
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const activeAlerts = alerts.filter(
    (a) => !["resolved", "closed", "false_alarm"].includes(a.status)
  );

  // Count by severity
  const bySeverity = activeAlerts.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Oldest unresolved
  const oldestAlert = activeAlerts.length > 0
    ? activeAlerts.reduce((oldest, a) =>
        new Date(a.triggeredAt) < new Date(oldest.triggeredAt) ? a : oldest
      )
    : null;

  // SLA-breached alerts
  const breachedAlerts = activeAlerts.filter((a) => a.slaBreached);

  const handleCopyHandover = () => {
    const lines = [
      "=== G4S SOC Shift Handover ===",
      `Date: ${new Date().toLocaleString()}`,
      "",
      `Open Incidents: ${activeAlerts.length}`,
      ...Object.entries(bySeverity).map(([sev, count]) => `  ${sev.toUpperCase()}: ${count}`),
      "",
      breachedAlerts.length > 0
        ? `SLA Breached: ${breachedAlerts.length}`
        : "SLA Breached: None",
      "",
      oldestAlert
        ? `Oldest Open: ${oldestAlert.title} (${oldestAlert.triggeredAt})`
        : "",
      "",
      "Active Alerts:",
      ...activeAlerts.map(
        (a) => `  - [${a.severity.toUpperCase()}] ${a.title} (${a.status})`
      ),
      "",
      notes ? `Handover Notes:\n${notes}` : "",
    ];
    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.15)",
            color: "#A78BFA",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <ArrowRightLeft size={14} />
          Shift Handover
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[520px]"
        style={{
          backgroundColor: "#0F172A",
          borderColor: "#1E293B",
          color: "#E2E8F0",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-slate-200 flex items-center gap-2">
            <ArrowRightLeft size={18} />
            Shift Handover Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Severity Counts */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">
              Open Incidents by Severity
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(["critical", "high", "medium", "low"] as AlertSeverity[]).map((sev) => {
                const count = bySeverity[sev] || 0;
                const colors = SEVERITY_COLORS[sev];
                return (
                  <div
                    key={sev}
                    className="rounded p-2 text-center"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <div className="text-lg font-bold" style={{ color: colors.text }}>
                      {count}
                    </div>
                    <div className="text-[9px] uppercase font-medium" style={{ color: colors.text, opacity: 0.7 }}>
                      {sev}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Oldest Unresolved */}
          {oldestAlert && (
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                <Clock size={10} />
                Oldest Unresolved
              </div>
              <div
                className="rounded p-2.5"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
              >
                <div className="text-xs font-medium text-slate-300">{oldestAlert.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Triggered: {new Date(oldestAlert.triggeredAt).toLocaleString()} ·{" "}
                  {oldestAlert.customerName}
                </div>
              </div>
            </div>
          )}

          {/* SLA Breached */}
          {breachedAlerts.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-red-400 uppercase mb-1.5 flex items-center gap-1">
                <AlertTriangle size={10} />
                SLA Breached ({breachedAlerts.length})
              </div>
              <div className="space-y-1">
                {breachedAlerts.map((a) => (
                  <div key={a.id} className="text-[10px] text-red-300 font-mono">
                    {a.shipmentRef} — {a.title.split("—")[0].trim()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Alert List */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
              All Open Alerts ({activeAlerts.length})
            </div>
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {activeAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 text-[10px] px-2 py-1 rounded"
                  style={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        a.severity === "critical"
                          ? "#EF4444"
                          : a.severity === "high"
                            ? "#F97316"
                            : a.severity === "medium"
                              ? "#EAB308"
                              : "#6B7280",
                    }}
                  />
                  <span className="text-slate-400 truncate flex-1">{a.title}</span>
                  <span className="text-slate-600 shrink-0">{a.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Handover Notes */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
              Handover Notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for the incoming operator..."
              rows={3}
              className="w-full rounded px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{
                backgroundColor: "#1E293B",
                color: "#CBD5E1",
                border: "1px solid #334155",
              }}
            />
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopyHandover}
            className="w-full py-2 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: copied ? "#16A34A" : "#3B82F6",
              color: "#fff",
            }}
          >
            {copied ? "Copied to Clipboard!" : "Copy Handover Summary"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
