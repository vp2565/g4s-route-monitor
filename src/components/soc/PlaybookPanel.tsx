"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Phone,
  ArrowUpCircle,
  Radio,
  Shield,
  Handshake,
  MapPin,
  Clock,
  Truck,
} from "lucide-react";
import type { Alert, SOCPlaybook, FieldResponse } from "@/lib/types";

// --- Mock nearby field units ---

interface NearbyUnit {
  id: string;
  callsign: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  location: { lat: number; lng: number };
}

function getNearbyUnits(alertLocation: { lat: number; lng: number }): NearbyUnit[] {
  // Simulated field units near various European locations
  const units: NearbyUnit[] = [
    {
      id: "unit-alpha-7",
      callsign: "ALPHA-7",
      name: "G4S Patrol Alpha-7",
      distanceKm: 8.2,
      etaMinutes: 12,
      location: { lat: alertLocation.lat + 0.04, lng: alertLocation.lng - 0.04 },
    },
    {
      id: "unit-bravo-3",
      callsign: "BRAVO-3",
      name: "G4S Patrol Bravo-3",
      distanceKm: 22.5,
      etaMinutes: 28,
      location: { lat: alertLocation.lat - 0.12, lng: alertLocation.lng + 0.08 },
    },
    {
      id: "unit-delta-9",
      callsign: "DELTA-9",
      name: "G4S Patrol Delta-9",
      distanceKm: 41.0,
      etaMinutes: 45,
      location: { lat: alertLocation.lat + 0.2, lng: alertLocation.lng + 0.15 },
    },
  ];
  return units;
}

// --- Playbook Steps ---

function PlaybookSteps({ playbook, currentStep }: { playbook: SOCPlaybook; currentStep: number | null }) {
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
            className="flex gap-2 px-2 py-1.5 rounded"
            style={{
              backgroundColor: isCurrent ? "rgba(59, 130, 246, 0.12)" : "transparent",
              borderLeft: isCurrent ? "2px solid #3B82F6" : "2px solid transparent",
            }}
          >
            {/* Step icon */}
            <div className="shrink-0 mt-0.5">
              {isCompleted ? (
                <CheckCircle2 size={14} className="text-green-500" />
              ) : isCurrent ? (
                <PlayCircle size={14} className="text-blue-400" />
              ) : (
                <Circle size={14} className="text-slate-600" />
              )}
            </div>

            {/* Step details */}
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-medium"
                style={{
                  color: isCompleted ? "#4ADE80" : isCurrent ? "#93C5FD" : "#475569",
                }}
              >
                {step.stepNumber}. {step.title}
              </div>
              {isCurrent && (
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {step.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[9px]"
                  style={{ color: isFuture ? "#475569" : "#64748B" }}
                >
                  <Clock size={9} className="inline mr-0.5" />
                  {step.expectedDuration}
                </span>
                <span
                  className="text-[9px]"
                  style={{ color: isFuture ? "#475569" : "#64748B" }}
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

// --- Action Buttons ---

function ActionButtons({
  onAction,
}: {
  onAction: (action: string) => void;
}) {
  const actions = [
    { id: "acknowledge", label: "Acknowledge", icon: CheckCircle2, color: "#3B82F6" },
    { id: "escalate", label: "Escalate", icon: ArrowUpCircle, color: "#F97316" },
    { id: "contact_driver", label: "Contact Driver", icon: Phone, color: "#22C55E" },
    { id: "dispatch", label: "Dispatch Field Unit", icon: Radio, color: "#C8102E" },
    { id: "le_liaison", label: "LE Liaison", icon: Shield, color: "#8B5CF6" },
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-medium transition-colors hover:brightness-125"
            style={{
              backgroundColor: `${action.color}22`,
              color: action.color,
              border: `1px solid ${action.color}44`,
            }}
          >
            <Icon size={12} />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Field Dispatch Section ---

function FieldDispatchSection({
  alert,
  existingResponse,
  dispatchedUnit,
  onDispatch,
}: {
  alert: Alert;
  existingResponse: FieldResponse | null;
  dispatchedUnit: NearbyUnit | null;
  onDispatch: (unit: NearbyUnit) => void;
}) {
  const [dispatchEtaCountdown, setDispatchEtaCountdown] = useState<number | null>(null);

  const nearbyUnits = getNearbyUnits(alert.location);

  // ETA countdown for dispatched unit
  useEffect(() => {
    if (dispatchedUnit) {
      setDispatchEtaCountdown(dispatchedUnit.etaMinutes);
      const interval = setInterval(() => {
        setDispatchEtaCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 60000); // count down every minute
      return () => clearInterval(interval);
    } else if (existingResponse?.etaMinutes) {
      setDispatchEtaCountdown(existingResponse.etaMinutes);
    }
  }, [dispatchedUnit, existingResponse]);

  // If there's an active field response or a dispatched unit
  if (existingResponse || dispatchedUnit) {
    const unit = dispatchedUnit;
    const response = existingResponse;
    const callsign = unit?.callsign || response?.unitCallsign || "UNKNOWN";
    const name = unit?.name || response?.dispatchedUnit || "G4S Patrol Unit";
    const eta = dispatchEtaCountdown ?? response?.etaMinutes ?? null;
    const status = response?.status || "dispatched";

    return (
      <div className="px-3 py-2">
        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
          <Truck size={12} />
          Field Response Active
        </div>
        <div
          className="rounded p-2.5"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-400">{callsign}</span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase"
              style={{ backgroundColor: "#1E3A5F", color: "#93C5FD" }}
            >
              {status.replace("_", " ")}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">{name}</p>
          {eta !== null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Clock size={10} className="text-blue-400" />
              <span className="text-xs font-mono text-blue-300">ETA: {eta} min</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
        <MapPin size={12} />
        Nearest Available Units
      </div>
      <div className="space-y-1.5">
        {nearbyUnits.map((unit) => (
          <div
            key={unit.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded"
            style={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-300">{unit.callsign}</div>
              <div className="text-[10px] text-slate-500">
                {unit.distanceKm}km away · ETA {unit.etaMinutes}min
              </div>
            </div>
            <button
              onClick={() => onDispatch(unit)}
              className="px-2.5 py-1 rounded text-[10px] font-bold transition-colors"
              style={{
                backgroundColor: "#16A34A",
                color: "#fff",
              }}
            >
              DISPATCH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Playbook Panel ---

interface PlaybookPanelProps {
  alert: Alert | null;
  playbook: SOCPlaybook | null;
  fieldResponse: FieldResponse | null;
}

export function PlaybookPanel({ alert, playbook, fieldResponse }: PlaybookPanelProps) {
  const [dispatchedUnit, setDispatchedUnit] = useState<NearbyUnit | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Reset dispatched unit when alert changes
  useEffect(() => {
    setDispatchedUnit(null);
    setActionLog([]);
  }, [alert?.id]);

  const handleAction = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const labels: Record<string, string> = {
      acknowledge: "Alert acknowledged",
      escalate: "Escalated to Tier 2",
      contact_driver: "Driver contact initiated",
      dispatch: "Field dispatch initiated",
      le_liaison: "LE liaison initiated",
    };
    setActionLog((prev) => [`${timestamp} — ${labels[action] || action}`, ...prev]);
  };

  const handleDispatch = (unit: NearbyUnit) => {
    setDispatchedUnit(unit);
    const timestamp = new Date().toLocaleTimeString();
    setActionLog((prev) => [
      `${timestamp} — Dispatched ${unit.callsign} (ETA ${unit.etaMinutes}min)`,
      ...prev,
    ]);
  };

  if (!alert) {
    return (
      <div className="w-[350px] flex flex-col border-l border-slate-800 bg-slate-950 shrink-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <Handshake size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Select an alert to view playbook</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Click an alert from the queue to load its response playbook and dispatch options
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[350px] flex flex-col border-l border-slate-800 bg-slate-950 shrink-0 overflow-y-auto">
      {/* Playbook section */}
      <div className="px-3 py-2 border-b border-slate-800">
        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
          <Shield size={12} />
          {playbook ? "SOC Playbook" : "No Playbook Assigned"}
        </div>
        {playbook ? (
          <>
            <div className="text-xs font-medium text-slate-200 mb-0.5">{playbook.name}</div>
            <div className="text-[10px] text-slate-500 mb-2">
              v{playbook.version} · {playbook.totalExpectedDuration}
            </div>
            <PlaybookSteps playbook={playbook} currentStep={alert.currentPlaybookStep} />
          </>
        ) : (
          <p className="text-[10px] text-slate-500">
            No playbook is bound to this alert type. Manual response required.
          </p>
        )}
      </div>

      {/* Recommended Action */}
      <div className="px-3 py-2.5 border-b border-slate-800">
        <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
          Recommended Action
        </div>
        <div
          className="rounded p-2.5 mb-2.5"
          style={{
            backgroundColor: "rgba(234, 179, 8, 0.08)",
            border: "1px solid rgba(234, 179, 8, 0.25)",
          }}
        >
          <p className="text-xs text-yellow-200 leading-relaxed font-medium">
            {alert.recommendedAction}
          </p>
        </div>
        <ActionButtons onAction={handleAction} />
      </div>

      {/* Field Dispatch */}
      <div className="border-b border-slate-800">
        <FieldDispatchSection
          alert={alert}
          existingResponse={fieldResponse}
          dispatchedUnit={dispatchedUnit}
          onDispatch={handleDispatch}
        />
      </div>

      {/* Action Log */}
      {actionLog.length > 0 && (
        <div className="px-3 py-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">
            Action Log
          </div>
          <div className="space-y-0.5">
            {actionLog.map((entry, idx) => (
              <div key={idx} className="text-[10px] text-slate-500 font-mono">
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
