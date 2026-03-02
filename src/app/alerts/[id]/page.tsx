"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import {
  getAlertById,
  getShipmentById,
  getRouteTemplateById,
  getPlaybookByAlertType,
  getFieldResponseByAlertId,
  getAuditEntriesByEntityId,
  updateAlert,
  addAuditEntry,
  getNextAuditId,
} from "@/lib/store";
import {
  SEVERITY_COLORS,
  SEVERITY_BG,
  STATUS_PILL_STYLES,
  ALERT_TYPE_ICONS,
  formatAlertType,
  formatAlertDate,
  isAlertActive,
} from "@/lib/alert-utils";
import { SLAProgressBar } from "@/components/alerts/SLAProgressBar";
import { AuditTab } from "@/components/map/SidePanelTabs/AuditTab";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  ArrowUpCircle,
  PlayCircle,
  Circle,
  Clock,
  Shield,
  Truck,
  Scale,
} from "lucide-react";
import type { Alert, SOCPlaybook } from "@/lib/types";

const AlertDetailMap = dynamic(
  () => import("@/components/alerts/AlertDetailMap").then((m) => m.AlertDetailMap),
  { ssr: false, loading: () => <div className="h-full bg-gray-100 animate-pulse rounded-lg" /> }
);

const ROOT_CAUSE_OPTIONS = [
  "Confirmed threat",
  "False alarm - GPS drift",
  "False alarm - expected event",
  "Equipment malfunction",
  "Driver error",
  "Weather/environmental",
  "Other",
];

// --- Playbook Steps (theme-aware) ---

function PlaybookSteps({
  playbook,
  currentStep,
  isDark,
}: {
  playbook: SOCPlaybook;
  currentStep: number | null;
  isDark: boolean;
}) {
  const activeStep = currentStep ?? 0;

  return (
    <div className="space-y-1">
      {playbook.steps.map((step) => {
        const isCompleted = activeStep > step.stepNumber;
        const isCurrent = activeStep === step.stepNumber;
        const isFuture = activeStep < step.stepNumber;

        return (
          <div
            key={step.stepNumber}
            className="flex gap-2 px-3 py-2 rounded"
            style={{
              backgroundColor: isCurrent
                ? isDark
                  ? "rgba(59, 130, 246, 0.12)"
                  : "rgba(59, 130, 246, 0.06)"
                : "transparent",
              borderLeft: isCurrent ? "2px solid #3B82F6" : "2px solid transparent",
            }}
          >
            <div className="shrink-0 mt-0.5">
              {isCompleted ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : isCurrent ? (
                <PlayCircle size={14} className="text-blue-500" />
              ) : (
                <Circle
                  size={14}
                  className={isDark ? "text-slate-600" : "text-gray-300"}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-xs font-medium",
                  isCompleted
                    ? "text-green-600"
                    : isCurrent
                      ? isDark
                        ? "text-blue-300"
                        : "text-blue-700"
                      : isDark
                        ? "text-slate-500"
                        : "text-gray-400"
                )}
              >
                {step.stepNumber}. {step.title}
              </div>
              {isCurrent && (
                <p
                  className={cn(
                    "text-[11px] mt-0.5 leading-tight",
                    isDark ? "text-slate-400" : "text-gray-500"
                  )}
                >
                  {step.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-0.5">
                <span
                  className={cn(
                    "text-[10px]",
                    isFuture
                      ? isDark
                        ? "text-slate-600"
                        : "text-gray-300"
                      : isDark
                        ? "text-slate-500"
                        : "text-gray-400"
                  )}
                >
                  <Clock size={9} className="inline mr-0.5" />
                  {step.expectedDuration}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    isFuture
                      ? isDark
                        ? "text-slate-600"
                        : "text-gray-300"
                      : isDark
                        ? "text-slate-500"
                        : "text-gray-400"
                  )}
                >
                  Tier {step.escalationTier}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isDarkTheme: isDark } = useAuth();
  const alertId = params.id as string;

  // Load alert from store, use local state for mutations
  const initialAlert = useMemo(() => getAlertById(alertId), [alertId]);
  const [localAlert, setLocalAlert] = useState<Alert | null>(initialAlert ?? null);

  // Resolution form state
  const [rootCause, setRootCause] = useState("");
  const [notes, setNotes] = useState("");

  // Derive related data
  const shipment = useMemo(
    () => (localAlert ? getShipmentById(localAlert.shipmentId) : null),
    [localAlert]
  );
  const route = useMemo(
    () => (shipment ? getRouteTemplateById(shipment.routeTemplateId) : null),
    [shipment]
  );
  const playbook = useMemo(
    () => (localAlert ? getPlaybookByAlertType(localAlert.type) : null),
    [localAlert]
  );
  const fieldResponse = useMemo(
    () => (localAlert ? getFieldResponseByAlertId(localAlert.id) : null),
    [localAlert]
  );
  const auditEntries = useMemo(
    () => (localAlert ? getAuditEntriesByEntityId(localAlert.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localAlert, localAlert?.status]
  );

  if (!localAlert) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Alert Not Found" description="The requested alert does not exist" />
        <div className="flex-1 flex items-center justify-center">
          <Button variant="outline" onClick={() => router.push("/alerts")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Alerts
          </Button>
        </div>
      </div>
    );
  }

  const alert = localAlert;
  const Icon = ALERT_TYPE_ICONS[alert.type];
  const sevColor = SEVERITY_COLORS[alert.severity];
  const sevBg = SEVERITY_BG[alert.severity];
  const pill = STATUS_PILL_STYLES[alert.status] ?? STATUS_PILL_STYLES.new;
  const active = isAlertActive(alert.status);

  function handleAcknowledge() {
    const now = new Date().toISOString();
    const updated = updateAlert(alert.id, {
      status: "acknowledged",
      acknowledgedAt: now,
      acknowledgedBy: user?.id ?? "usr-001",
    });
    if (updated) {
      addAuditEntry({
        id: getNextAuditId(),
        timestamp: now,
        action: "alert_acknowledged",
        userId: user?.id ?? "usr-001",
        userName: user?.name ?? "SOC Operator",
        entityType: "alert",
        entityId: alert.id,
        entityRef: alert.title,
        details: `Alert acknowledged by ${user?.name ?? "SOC Operator"}`,
        ipAddress: "192.168.1.100",
        metadata: {},
      });
      setLocalAlert({ ...updated });
    }
  }

  function handleEscalate() {
    const now = new Date().toISOString();
    const nextStep = (alert.currentPlaybookStep ?? 0) + 1;
    const updated = updateAlert(alert.id, {
      status: "investigating",
      currentPlaybookStep: nextStep,
    });
    if (updated) {
      addAuditEntry({
        id: getNextAuditId(),
        timestamp: now,
        action: "alert_escalated",
        userId: user?.id ?? "usr-001",
        userName: user?.name ?? "SOC Operator",
        entityType: "alert",
        entityId: alert.id,
        entityRef: alert.title,
        details: `Alert escalated to Tier ${Math.min(nextStep + 1, 4)} by ${user?.name ?? "SOC Operator"}`,
        ipAddress: "192.168.1.100",
        metadata: { escalationTier: Math.min(nextStep + 1, 4) },
      });
      setLocalAlert({ ...updated });
    }
  }

  function handleResolve() {
    if (!rootCause) return;
    const now = new Date().toISOString();
    const updated = updateAlert(alert.id, {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: user?.id ?? "usr-001",
      notes: `Root cause: ${rootCause}. ${notes}`.trim(),
    });
    if (updated) {
      addAuditEntry({
        id: getNextAuditId(),
        timestamp: now,
        action: "alert_resolved",
        userId: user?.id ?? "usr-001",
        userName: user?.name ?? "SOC Operator",
        entityType: "alert",
        entityId: alert.id,
        entityRef: alert.title,
        details: `Alert resolved. Root cause: ${rootCause}. ${notes}`.trim(),
        ipAddress: "192.168.1.100",
        metadata: { rootCause },
      });
      setLocalAlert({ ...updated });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title=""
        description=""
      >
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="sm"
            className={cn("shrink-0", isDark && "text-gray-300 hover:bg-gray-800")}
            onClick={() => router.push("/alerts")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Alerts
          </Button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon size={20} style={{ color: sevColor }} />
            <h1 className={cn("text-lg font-bold truncate", isDark ? "text-gray-100" : "text-gray-900")}>
              {alert.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Severity badge */}
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded uppercase", isDark ? sevBg.dark : sevBg.light)}>
              {alert.severity}
            </span>
            {/* Status pill */}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-sm"
              style={{ backgroundColor: pill.bg, color: pill.text }}
            >
              {pill.label}
            </span>
            {/* Shipment link */}
            <Link
              href={`/shipments/${alert.shipmentId}`}
              className={cn("text-xs hover:underline flex items-center gap-1", isDark ? "text-blue-400" : "text-blue-600")}
            >
              {alert.shipmentRef}
              <ExternalLink size={11} />
            </Link>
            {/* Customer + date */}
            <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
              {alert.customerName}
            </span>
            <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              {formatAlertDate(alert.triggeredAt)}
            </span>
          </div>
        </div>
      </PageHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Map */}
          <div className={cn("rounded-lg border overflow-hidden", isDark ? "border-gray-700" : "border-gray-200")} style={{ height: 400 }}>
            <AlertDetailMap
              alert={alert}
              route={route ?? null}
              fieldResponse={fieldResponse ?? null}
              isDark={isDark}
            />
          </div>

          {/* Right: Info cards */}
          <div className="space-y-3">
            {/* Recommended Action */}
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.08)",
                border: "1px solid rgba(234, 179, 8, 0.25)",
              }}
            >
              <div className={cn("text-[10px] font-semibold uppercase mb-1.5", isDark ? "text-yellow-400/70" : "text-yellow-700/70")}>
                Recommended Action
              </div>
              <p className={cn("text-sm font-medium leading-relaxed", isDark ? "text-yellow-200" : "text-yellow-800")}>
                {alert.recommendedAction}
              </p>
            </div>

            {/* SLA Timer */}
            <SLAProgressBar
              triggeredAt={alert.triggeredAt}
              deadline={alert.slaDeadline}
              breached={alert.slaBreached}
              isDark={isDark}
            />

            {/* Alert Details */}
            <div className={cn("rounded-lg p-3 border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
              <div className={cn("text-[10px] font-semibold uppercase mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
                Alert Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Type</span>
                  <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>{formatAlertType(alert.type)}</p>
                </div>
                <div>
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Severity</span>
                  <p className="font-medium" style={{ color: sevColor }}>{alert.severity.toUpperCase()}</p>
                </div>
                <div>
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Location</span>
                  <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>{alert.locationName}</p>
                </div>
                <div>
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Coordinates</span>
                  <p className={cn("font-medium font-mono text-[11px]", isDark ? "text-gray-200" : "text-gray-800")}>
                    {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              {alert.description && (
                <p className={cn("text-xs mt-2 leading-relaxed", isDark ? "text-gray-400" : "text-gray-600")}>
                  {alert.description}
                </p>
              )}
            </div>

            {/* Actions */}
            {active && (
              <div className={cn("rounded-lg p-3 border", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
                <div className={cn("text-[10px] font-semibold uppercase mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
                  Actions
                </div>
                <div className="flex gap-2 mb-3">
                  {alert.status === "new" && (
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleAcknowledge}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn("h-8 text-xs", isDark ? "border-orange-700 text-orange-400 hover:bg-orange-900/30" : "border-orange-300 text-orange-600 hover:bg-orange-50")}
                    onClick={handleEscalate}
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                    Escalate
                  </Button>
                </div>

                {/* Resolution form */}
                <div className={cn("border-t pt-3 mt-1", isDark ? "border-slate-700" : "border-gray-100")}>
                  <div className={cn("text-[10px] font-semibold uppercase mb-2", isDark ? "text-gray-400" : "text-gray-500")}>
                    Resolve Alert
                  </div>
                  <div className="space-y-2">
                    <Select value={rootCause} onValueChange={setRootCause}>
                      <SelectTrigger
                        className={cn("h-8 text-xs", isDark ? "bg-slate-800 border-slate-700 text-gray-200" : "bg-white border-gray-300")}
                      >
                        <SelectValue placeholder="Select root cause..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOT_CAUSE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <textarea
                      placeholder="Resolution notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={cn(
                        "w-full h-16 px-3 py-2 text-xs rounded-md border outline-none resize-none",
                        isDark ? "bg-slate-800 border-slate-700 text-gray-200 placeholder:text-gray-500" : "bg-white border-gray-300 placeholder:text-gray-400"
                      )}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                      disabled={!rootCause}
                      onClick={handleResolve}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full-width sections */}

        {/* SOC Playbook */}
        {playbook && (
          <div className={cn("rounded-lg border p-4", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
              <h3 className={cn("text-sm font-semibold", isDark ? "text-gray-200" : "text-gray-800")}>
                SOC Playbook — {playbook.name}
              </h3>
              <span className={cn("text-[10px] ml-2", isDark ? "text-gray-500" : "text-gray-400")}>
                v{playbook.version} · {playbook.totalExpectedDuration}
              </span>
            </div>
            <PlaybookSteps playbook={playbook} currentStep={alert.currentPlaybookStep} isDark={isDark} />
          </div>
        )}

        {/* Field Dispatch */}
        <div className={cn("rounded-lg border p-4", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
            <h3 className={cn("text-sm font-semibold", isDark ? "text-gray-200" : "text-gray-800")}>
              Field Dispatch
            </h3>
          </div>
          {fieldResponse ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Callsign</span>
                <p className={cn("font-bold", isDark ? "text-blue-400" : "text-blue-600")}>{fieldResponse.unitCallsign}</p>
              </div>
              <div>
                <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Status</span>
                <p className={cn("font-medium capitalize", isDark ? "text-gray-200" : "text-gray-800")}>
                  {fieldResponse.status.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Dispatched</span>
                <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                  {formatAlertDate(fieldResponse.dispatchedAt)}
                </p>
              </div>
              {fieldResponse.arrivedAt && (
                <div>
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Arrived</span>
                  <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                    {formatAlertDate(fieldResponse.arrivedAt)}
                  </p>
                </div>
              )}
              {fieldResponse.findings && (
                <div className="col-span-2 lg:col-span-4">
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Findings</span>
                  <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>{fieldResponse.findings}</p>
                </div>
              )}
              {fieldResponse.outcome && (
                <div className="col-span-2 lg:col-span-4">
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Outcome</span>
                  <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>{fieldResponse.outcome}</p>
                </div>
              )}
              {fieldResponse.evidence.length > 0 && (
                <div className="col-span-2 lg:col-span-4">
                  <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Evidence ({fieldResponse.evidence.length} items)</span>
                  <div className="mt-1 space-y-1">
                    {fieldResponse.evidence.map((ev, i) => (
                      <div key={i} className={cn("text-[11px]", isDark ? "text-gray-400" : "text-gray-600")}>
                        [{ev.type}] {ev.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              No field unit dispatched for this alert.
            </p>
          )}
        </div>

        {/* LE Liaison */}
        <div className={cn("rounded-lg border p-4", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} className={isDark ? "text-purple-400" : "text-purple-600"} />
            <h3 className={cn("text-sm font-semibold", isDark ? "text-gray-200" : "text-gray-800")}>
              Law Enforcement Liaison
            </h3>
          </div>
          {fieldResponse?.lawEnforcementInvolved ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Reference Number</span>
                <p className={cn("font-bold font-mono", isDark ? "text-purple-400" : "text-purple-600")}>
                  {fieldResponse.lawEnforcementRef ?? "Pending"}
                </p>
              </div>
              <div>
                <span className={cn(isDark ? "text-gray-500" : "text-gray-400")}>Status</span>
                <p className={cn("font-medium", isDark ? "text-gray-200" : "text-gray-800")}>
                  {fieldResponse.lawEnforcementRef ? "Reference issued" : "Coordination in progress"}
                </p>
              </div>
            </div>
          ) : (
            <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
              No law enforcement involvement for this alert.
            </p>
          )}
        </div>

        {/* Audit Trail */}
        <div className={cn("rounded-lg border p-4", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200")}>
          <h3 className={cn("text-sm font-semibold mb-3", isDark ? "text-gray-200" : "text-gray-800")}>
            Audit Trail
          </h3>
          <AuditTab entries={auditEntries} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
