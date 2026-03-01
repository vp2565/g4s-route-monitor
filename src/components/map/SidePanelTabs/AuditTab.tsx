import type { AuditEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AuditTabProps {
  entries: AuditEntry[];
  isDark: boolean;
}

function formatAction(action: string): string {
  return action.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTION_COLORS: Record<string, string> = {
  alert_created: "border-red-500",
  alert_acknowledged: "border-yellow-500",
  alert_escalated: "border-orange-500",
  alert_resolved: "border-green-500",
  alert_closed: "border-gray-400",
  shipment_created: "border-blue-500",
  shipment_updated: "border-blue-400",
  shipment_completed: "border-green-500",
  device_assigned: "border-cyan-500",
  device_unassigned: "border-cyan-400",
  ddi_completed: "border-purple-500",
  field_dispatched: "border-red-400",
  field_arrived: "border-orange-400",
  field_resolved: "border-green-400",
  playbook_triggered: "border-red-500",
};

export function AuditTab({ entries, isDark }: AuditTabProps) {
  if (entries.length === 0) {
    return (
      <div className={cn("text-sm text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>
        No audit entries
      </div>
    );
  }

  // Show last 20, sorted by time desc
  const sorted = [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className={cn(
        "absolute left-[7px] top-3 bottom-3 w-px",
        isDark ? "bg-gray-700" : "bg-gray-200"
      )} />

      <div className="space-y-3">
        {sorted.map((entry) => (
          <div key={entry.id} className="flex gap-3 relative">
            {/* Timeline dot */}
            <div className={cn(
              "w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-0.5 z-10",
              ACTION_COLORS[entry.action] ?? "border-gray-400",
              isDark ? "bg-gray-900" : "bg-white"
            )} />

            <div className="flex-1 min-w-0">
              <div className={cn("text-xs font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                {formatAction(entry.action)}
              </div>
              <div className={cn("text-[11px] mt-0.5 truncate", isDark ? "text-gray-400" : "text-gray-500")}>
                {entry.details}
              </div>
              <div className={cn("text-[10px] mt-0.5 flex gap-2", isDark ? "text-gray-500" : "text-gray-400")}>
                <span>{entry.userName}</span>
                <span>{formatTime(entry.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
