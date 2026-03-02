"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import {
  getShipmentById,
  getRouteTemplateById,
  getSegmentsByShipmentId,
  getAlertsByShipmentId,
  getDevicesByShipmentId,
  getAuditEntriesByEntityId,
  getConditionDataByShipmentId,
} from "@/lib/store";
import {
  displayRiskScore,
  riskScoreBgColor,
  STATUS_COLORS,
  formatStatus,
  MODE_ICONS,
  formatCurrency,
  formatETA,
} from "@/lib/shipment-utils";
import { SegmentTimeline } from "@/components/shipments/SegmentTimeline";
import { ConditionCharts } from "@/components/shipments/ConditionCharts";
import { ShareTrackingDialog } from "@/components/shipments/ShareTrackingDialog";
import { AlertsTab } from "@/components/map/SidePanelTabs/AlertsTab";
import { AuditTab } from "@/components/map/SidePanelTabs/AuditTab";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  GitCompare,
  Truck,
  Phone,
  CheckCircle2,
  XCircle,
  Thermometer,
} from "lucide-react";

const ShipmentDetailMap = dynamic(
  () =>
    import("@/components/shipments/ShipmentDetailMap").then(
      (m) => m.ShipmentDetailMap
    ),
  { ssr: false }
);

export default function ShipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { isDarkTheme } = useAuth();
  const router = useRouter();
  const [showComparison, setShowComparison] = useState(false);

  const shipment = useMemo(() => getShipmentById(params.id), [params.id]);
  const route = useMemo(
    () => (shipment ? getRouteTemplateById(shipment.routeTemplateId) : undefined),
    [shipment]
  );
  const segments = useMemo(
    () => (shipment ? getSegmentsByShipmentId(shipment.id) : []),
    [shipment]
  );
  const alerts = useMemo(
    () => (shipment ? getAlertsByShipmentId(shipment.id) : []),
    [shipment]
  );
  const devices = useMemo(
    () => (shipment ? getDevicesByShipmentId(shipment.id) : []),
    [shipment]
  );
  const auditEntries = useMemo(
    () => (shipment ? getAuditEntriesByEntityId(shipment.id) : []),
    [shipment]
  );
  const conditionData = useMemo(
    () => (shipment ? getConditionDataByShipmentId(shipment.id) : undefined),
    [shipment]
  );

  if (!shipment) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Shipment Not Found" />
        <div className="flex-1 flex items-center justify-center">
          <p className={isDarkTheme ? "text-gray-400" : "text-gray-500"}>
            Shipment {params.id} does not exist.
          </p>
        </div>
      </div>
    );
  }

  const risk = displayRiskScore(shipment.riskScore);
  const sc = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.planned;
  const isDark = isDarkTheme;

  const ddiItems = shipment.ddi
    ? [
        ["Driver Verified", shipment.ddi.driverVerified],
        ["Vehicle Inspected", shipment.ddi.vehicleInspected],
        ["Seals Applied", shipment.ddi.sealsApplied],
        ["Documents Checked", shipment.ddi.documentsChecked],
        ["Route Briefing", shipment.ddi.routeBriefingDone],
        ["Devices Tested", shipment.ddi.devicesTested],
        ["Emergency Contacts", shipment.ddi.emergencyContactsConfirmed],
      ]
    : null;

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header bar */}
      <div
        className={cn(
          "border-b px-6 py-4",
          isDark ? "border-gray-800" : "border-gray-200"
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/shipments")}
            className={cn(
              "h-8 px-2",
              isDark && "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1
            className={cn(
              "text-xl font-semibold",
              isDark ? "text-gray-100" : "text-gray-900"
            )}
          >
            {shipment.id}
          </h1>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              isDark ? `${sc.darkBg} ${sc.darkText}` : `${sc.bg} ${sc.text}`
            )}
          >
            {formatStatus(shipment.status)}
          </span>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded",
              riskScoreBgColor(risk, isDark)
            )}
          >
            Risk: {risk}/10
          </span>
          {shipment.priority !== "standard" && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded font-medium uppercase",
                shipment.priority === "critical"
                  ? isDark
                    ? "bg-red-900/40 text-red-300"
                    : "bg-red-100 text-red-700"
                  : isDark
                  ? "bg-orange-900/40 text-orange-300"
                  : "bg-orange-100 text-orange-700"
              )}
            >
              {shipment.priority}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {shipment.trackingToken && (
              <ShareTrackingDialog
                token={shipment.trackingToken}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        {/* Sub-header info strip */}
        <div
          className={cn(
            "flex flex-wrap gap-x-6 gap-y-1 text-xs",
            isDark ? "text-gray-400" : "text-gray-500"
          )}
        >
          <span>{shipment.customerName}</span>
          <span>
            {shipment.origin} → {shipment.destination}
          </span>
          <span>
            ETA: {formatETA(shipment.estimatedArrival ?? shipment.scheduledArrival)}
          </span>
          <span>
            Modes: {shipment.transportModes.map((m) => MODE_ICONS[m]).join(" ")}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className={isDark ? "text-gray-500" : "text-gray-400"}>
              Progress
            </span>
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>
              {shipment.progressPercent}%
            </span>
          </div>
          <div
            className={cn(
              "h-1.5 rounded-full overflow-hidden",
              isDark ? "bg-gray-800" : "bg-gray-200"
            )}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${shipment.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* 2-column grid: map + info cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3
                className={cn(
                  "text-sm font-semibold",
                  isDark ? "text-gray-200" : "text-gray-800"
                )}
              >
                Route Map
              </h3>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  isDark && "border-gray-700 text-gray-300 hover:bg-gray-800",
                  showComparison &&
                    (isDark
                      ? "bg-blue-900/30 border-blue-700 text-blue-300"
                      : "bg-blue-50 border-blue-300 text-blue-700")
                )}
                onClick={() => setShowComparison(!showComparison)}
              >
                <GitCompare className="h-3.5 w-3.5 mr-1" />
                {showComparison ? "Hide Comparison" : "Compare Routes"}
              </Button>
            </div>
            <div
              className={cn(
                "h-[400px] rounded-lg overflow-hidden border",
                isDark ? "border-gray-700" : "border-gray-200"
              )}
            >
              {route ? (
                <ShipmentDetailMap
                  shipment={shipment}
                  route={route}
                  isDark={isDark}
                  showComparison={showComparison}
                />
              ) : (
                <div
                  className={cn(
                    "h-full flex items-center justify-center text-sm",
                    isDark ? "text-gray-500 bg-gray-900" : "text-gray-400 bg-gray-50"
                  )}
                >
                  No route template found
                </div>
              )}
            </div>
            {showComparison && (
              <div
                className={cn(
                  "flex items-center gap-4 mt-2 text-[10px]",
                  isDark ? "text-gray-500" : "text-gray-400"
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-blue-500 inline-block" style={{ borderTop: "2px dashed #3B82F6" }} />
                  Planned
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-green-500 inline-block" />
                  Actual
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Deviation
                </span>
              </div>
            )}
          </div>

          {/* Info cards */}
          <div className="space-y-4">
            {/* Cargo */}
            <Card title="Cargo" isDark={isDark}>
              <Row label="Description" value={shipment.cargoDescription} isDark={isDark} />
              <Row label="Value" value={formatCurrency(shipment.cargoValue)} isDark={isDark} />
              <Row label="Weight" value={`${shipment.cargoWeight.toLocaleString()} kg`} isDark={isDark} />
              {shipment.temperatureRange && (
                <Row
                  label="Temp Range"
                  value={
                    <span className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      {shipment.temperatureRange.min}° — {shipment.temperatureRange.max}°C
                    </span>
                  }
                  isDark={isDark}
                />
              )}
            </Card>

            {/* Driver/Vehicle */}
            <Card title="Driver & Vehicle" isDark={isDark}>
              <Row
                label="Driver"
                value={
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {shipment.driverName}
                  </span>
                }
                isDark={isDark}
              />
              <Row
                label="Phone"
                value={
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {shipment.driverPhone}
                  </span>
                }
                isDark={isDark}
              />
              <Row label="Plate" value={shipment.vehiclePlate} isDark={isDark} />
            </Card>

            {/* DDI & Security */}
            <Card title="DDI & Security" isDark={isDark}>
              <Row label="SMP Version" value={shipment.smpVersion} isDark={isDark} />
              {ddiItems ? (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {ddiItems.map(([label, checked]) => (
                    <span
                      key={label as string}
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        isDark ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      {checked ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                      {label as string}
                    </span>
                  ))}
                </div>
              ) : (
                <span
                  className={cn(
                    "text-xs",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  DDI not completed
                </span>
              )}
            </Card>

            {/* Devices */}
            {devices.length > 0 && (
              <Card title={`Devices (${devices.length})`} isDark={isDark}>
                <div className="space-y-1.5">
                  {devices.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                        {d.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <BatteryBar level={d.batteryLevel} />
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded capitalize",
                            isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                          )}
                        >
                          {d.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Segment Timeline */}
        {segments.length > 0 && (
          <Section title="Segments" isDark={isDark}>
            <SegmentTimeline segments={segments} isDark={isDark} />
          </Section>
        )}

        {/* Condition Charts */}
        {conditionData && (
          <Section title="Condition Data" isDark={isDark}>
            <ConditionCharts
              conditionData={conditionData}
              temperatureRange={shipment.temperatureRange}
              isDark={isDark}
            />
          </Section>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <Section title={`Alerts (${alerts.length})`} isDark={isDark}>
            <AlertsTab alerts={alerts} isDark={isDark} />
          </Section>
        )}

        {/* Audit Log */}
        {auditEntries.length > 0 && (
          <Section title="Audit Log" isDark={isDark}>
            <AuditTab entries={auditEntries} isDark={isDark} />
          </Section>
        )}
      </div>
    </div>
  );
}

// --- Helper components ---

function Card({
  title,
  isDark,
  children,
}: {
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isDark ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-white"
      )}
    >
      <h4
        className={cn(
          "text-xs font-semibold uppercase tracking-wider mb-2",
          isDark ? "text-gray-500" : "text-gray-400"
        )}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  isDark,
}: {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-xs py-0.5">
      <span className={isDark ? "text-gray-500" : "text-gray-400"}>
        {label}
      </span>
      <span className={cn("font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  isDark,
  children,
}: {
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className={cn(
          "text-sm font-semibold mb-3",
          isDark ? "text-gray-200" : "text-gray-800"
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function BatteryBar({ level }: { level: number }) {
  const color = level > 50 ? "bg-green-500" : level > 20 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1">
      <div className="w-8 h-2.5 rounded-sm border border-gray-500 overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${level}%` }} />
      </div>
      <span className="text-[9px] text-gray-500">{level}%</span>
    </div>
  );
}
