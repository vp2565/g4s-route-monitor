"use client";

import { X, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Shipment, RouteTemplate, Alert, Device, AuditEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, formatStatus } from "./mapUtils";
import { OverviewTab } from "./SidePanelTabs/OverviewTab";
import { RouteTab } from "./SidePanelTabs/RouteTab";
import { AlertsTab } from "./SidePanelTabs/AlertsTab";
import { DevicesTab } from "./SidePanelTabs/DevicesTab";
import { AuditTab } from "./SidePanelTabs/AuditTab";

interface ShipmentSidePanelProps {
  shipment: Shipment;
  route: RouteTemplate | null;
  alerts: Alert[];
  devices: Device[];
  auditEntries: AuditEntry[];
  deviationCount: number;
  isDark: boolean;
  onClose: () => void;
}

export function ShipmentSidePanel({
  shipment,
  route,
  alerts,
  devices,
  auditEntries,
  deviationCount,
  isDark,
  onClose,
}: ShipmentSidePanelProps) {
  const statusStyle = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.planned;

  return (
    <div
      className={cn(
        "w-[400px] flex flex-col border-l shrink-0 overflow-hidden",
        isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-b shrink-0",
        isDark ? "border-gray-800" : "border-gray-200"
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-sm font-mono font-semibold truncate", isDark ? "text-gray-100" : "text-gray-900")}>
            {shipment.id}
          </span>
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
            isDark ? statusStyle.darkBg + " " + statusStyle.darkText : statusStyle.bg + " " + statusStyle.text
          )}>
            {formatStatus(shipment.status)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`/shipments/${shipment.id}`}
            className={cn(
              "p-1 rounded hover:bg-gray-100",
              isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"
            )}
            title="Open shipment details"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded hover:bg-gray-100",
              isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"
            )}
            title="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
        <TabsList className={cn(
          "w-full justify-start rounded-none border-b shrink-0 h-auto px-2 py-0",
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        )}>
          <TabsTrigger
            value="overview"
            className={cn(
              "text-xs py-2 px-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#C8102E] data-[state=active]:shadow-none",
              isDark
                ? "text-gray-400 data-[state=active]:text-gray-100 data-[state=active]:bg-transparent"
                : "text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent"
            )}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="route"
            className={cn(
              "text-xs py-2 px-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#C8102E] data-[state=active]:shadow-none",
              isDark
                ? "text-gray-400 data-[state=active]:text-gray-100 data-[state=active]:bg-transparent"
                : "text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent"
            )}
          >
            Route
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className={cn(
              "text-xs py-2 px-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#C8102E] data-[state=active]:shadow-none",
              isDark
                ? "text-gray-400 data-[state=active]:text-gray-100 data-[state=active]:bg-transparent"
                : "text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent"
            )}
          >
            Alerts{alerts.length > 0 && (
              <span className={cn(
                "ml-1 text-[10px] px-1 rounded-full",
                isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-700"
              )}>
                {alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="devices"
            className={cn(
              "text-xs py-2 px-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#C8102E] data-[state=active]:shadow-none",
              isDark
                ? "text-gray-400 data-[state=active]:text-gray-100 data-[state=active]:bg-transparent"
                : "text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent"
            )}
          >
            Devices{devices.length > 0 && (
              <span className={cn(
                "ml-1 text-[10px] px-1 rounded-full",
                isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
              )}>
                {devices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className={cn(
              "text-xs py-2 px-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[#C8102E] data-[state=active]:shadow-none",
              isDark
                ? "text-gray-400 data-[state=active]:text-gray-100 data-[state=active]:bg-transparent"
                : "text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:bg-transparent"
            )}
          >
            Audit
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto min-h-0">
          <TabsContent value="overview" className="p-4 mt-0">
            <OverviewTab shipment={shipment} isDark={isDark} />
          </TabsContent>
          <TabsContent value="route" className="p-4 mt-0">
            <RouteTab route={route} deviationCount={deviationCount} isDark={isDark} />
          </TabsContent>
          <TabsContent value="alerts" className="p-4 mt-0">
            <AlertsTab alerts={alerts} isDark={isDark} />
          </TabsContent>
          <TabsContent value="devices" className="p-4 mt-0">
            <DevicesTab devices={devices} isDark={isDark} />
          </TabsContent>
          <TabsContent value="audit" className="p-4 mt-0">
            <AuditTab entries={auditEntries} isDark={isDark} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
