import Link from "next/link";
import type { Alert } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface AlertsTabProps {
  alerts: Alert[];
  isDark: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; darkBg: string; text: string; darkText: string }> = {
  critical: { bg: "bg-red-800", darkBg: "bg-red-900", text: "text-white", darkText: "text-red-100" },
  high: { bg: "bg-red-500", darkBg: "bg-red-800", text: "text-white", darkText: "text-red-100" },
  medium: { bg: "bg-yellow-400", darkBg: "bg-yellow-800", text: "text-yellow-900", darkText: "text-yellow-100" },
  low: { bg: "bg-gray-300", darkBg: "bg-gray-700", text: "text-gray-700", darkText: "text-gray-300" },
};

const STATUS_DOTS: Record<string, string> = {
  new: "bg-red-500",
  acknowledged: "bg-yellow-500",
  investigating: "bg-blue-500",
  dispatched: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-gray-400",
  false_alarm: "bg-gray-400",
};

function formatType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AlertsTab({ alerts, isDark }: AlertsTabProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn("text-sm text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>
        No alerts for this shipment
      </div>
    );
  }

  // Sort: active first, then by severity, then by time
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...alerts].sort((a, b) => {
    const aActive = ["new", "acknowledged", "investigating", "dispatched"].includes(a.status) ? 0 : 1;
    const bActive = ["new", "acknowledged", "investigating", "dispatched"].includes(b.status) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    const sevDiff = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map((alert) => {
        const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low;
        return (
          <div
            key={alert.id}
            className={cn(
              "p-2.5 rounded-lg border",
              isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {/* Severity pill */}
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase",
                isDark ? sev.darkBg + " " + sev.darkText : sev.bg + " " + sev.text
              )}>
                {alert.severity}
              </span>
              {/* Status dot */}
              <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOTS[alert.status] ?? "bg-gray-400")} />
              <span className={cn("text-[10px] capitalize", isDark ? "text-gray-400" : "text-gray-500")}>
                {alert.status.replace("_", " ")}
              </span>
              <span className={cn("text-[10px] ml-auto", isDark ? "text-gray-500" : "text-gray-400")}>
                {timeAgo(alert.triggeredAt)}
              </span>
            </div>
            <div className={cn("text-xs font-medium mb-0.5", isDark ? "text-gray-200" : "text-gray-800")}>
              {alert.title}
            </div>
            <div className={cn("text-[11px]", isDark ? "text-gray-400" : "text-gray-500")}>
              {formatType(alert.type)} — {alert.locationName}
            </div>
            <div className="flex items-center justify-between mt-1">
              {alert.slaBreached && (
                <span className="text-[10px] text-red-400 font-medium">SLA BREACHED</span>
              )}
              <Link
                href={`/alerts/${alert.id}`}
                className={cn(
                  "text-[10px] flex items-center gap-0.5 ml-auto",
                  isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                )}
              >
                Details <ExternalLink size={9} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
