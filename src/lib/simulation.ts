// ============================================================
// G4S Telematix — GPS Simulation Engine
// Server-side singleton that advances shipments along routes
// ============================================================

import {
  getActiveShipments,
  getRouteTemplateById,
  addSimulationAlert,
  clearSimulationAlerts,
  updateShipmentProgress,
  incrementShipmentAlertCount,
} from "./store";
import type { Alert } from "./types";

// --- Types ---

export interface PositionUpdate {
  type: "position";
  shipmentId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  progressPercent: number;
  temperature: number | null;
  humidity: number | null;
}

export interface AlertEvent {
  type: "alert";
  alert: Alert;
}

export interface SimulationState {
  running: boolean;
  speed: number;
  tick: number;
  simulatedTime: number; // ms offset from start
  startedAt: number | null;
}

export type SimulationEvent = PositionUpdate | AlertEvent;

// --- Haversine (server-side copy — no import from client module) ---

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getPositionAlongPath(
  path: [number, number][],
  percent: number
): [number, number] | null {
  if (path.length === 0) return null;
  if (path.length === 1 || percent <= 0) return path[0];
  if (percent >= 100) return path[path.length - 1];
  const cumul: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    cumul.push(cumul[i - 1] + haversine(path[i - 1], path[i]));
  }
  const total = cumul[cumul.length - 1];
  if (total === 0) return path[0];
  const target = (total * percent) / 100;
  for (let i = 1; i < path.length; i++) {
    if (cumul[i] >= target) {
      const segLen = cumul[i] - cumul[i - 1];
      const t = segLen > 0 ? (target - cumul[i - 1]) / segLen : 0;
      return [
        path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t,
        path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t,
      ];
    }
  }
  return path[path.length - 1];
}

function calculateHeading(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(toRad(to[0]));
  const x =
    Math.cos(toRad(from[0])) * Math.sin(toRad(to[0])) -
    Math.sin(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// --- Trigger point definitions ---

interface TriggerPoint {
  id: string;
  shipmentId: string;
  triggerPercent: number;
  alertType: Alert["type"];
  severity: Alert["severity"];
  title: string;
  description: string;
  recommendedAction: string;
  locationName: string;
  playbookId: string | null;
  // Special behavior
  deviationKm?: number; // lateral offset for route deviation
  dwellMinutes?: number; // how long to stall
  signalLossMinutes?: number; // gap duration
  tempValue?: number; // temperature to set
}

const TRIGGER_POINTS: TriggerPoint[] = [
  {
    id: "sim-trig-001",
    shipmentId: "G4S-SHP-2026-0001", // Sofia→Hamburg, route-002
    triggerPercent: 35,
    alertType: "route_deviation",
    severity: "critical",
    title: "Route Deviation — Vehicle off-route near Niš",
    description:
      "Vehicle deviated 2km from approved route near Niš, Serbia. Unexpected turn onto secondary road. Driver has not responded to initial contact.",
    recommendedAction:
      "Dispatch nearest G4S patrol unit. Attempt secondary driver contact via SMS. Prepare LE liaison.",
    locationName: "Near Niš, Serbia — E75 corridor",
    playbookId: "pb-001",
    deviationKm: 2,
  },
  {
    id: "sim-trig-002",
    shipmentId: "G4S-SHP-2026-0003", // Rotterdam→Warsaw, route-005
    triggerPercent: 60,
    alertType: "unauthorized_stop",
    severity: "high",
    title: "Extended Dwell — Unauthorized stop near Hanover",
    description:
      "Vehicle stationary for 45+ minutes at unapproved location near Hanover, Germany. Not a designated rest area or safe parking facility.",
    recommendedAction:
      "Contact driver immediately. If no response in 10 minutes, dispatch field unit and notify customer.",
    locationName: "Industrial area near Hanover, Germany",
    playbookId: "pb-001",
    dwellMinutes: 45,
  },
  {
    id: "sim-trig-003",
    shipmentId: "G4S-SHP-2026-0007", // Athens→Rotterdam, route-001
    triggerPercent: 45,
    alertType: "signal_loss",
    severity: "high",
    title: "Signal Loss — GPS gap near Adriatic coast",
    description:
      "Device signal lost for 10 minutes during road segment along Adriatic coast. No known coverage dead zone in this area. Possible jamming or device failure.",
    recommendedAction:
      "Check coverage maps. If no known dead zone, escalate to potential security event. Attempt driver contact.",
    locationName: "Adriatic coast, near Igoumenitsa, Greece",
    playbookId: "pb-003",
    signalLossMinutes: 10,
  },
  {
    id: "sim-trig-004",
    shipmentId: "G4S-SHP-2026-0002", // Lyon→Milan, route-003 (pharma, temp range 2-8°C)
    triggerPercent: 70,
    alertType: "temperature_breach",
    severity: "critical",
    title: "Temperature Breach — Insulin shipment exceeds 8°C",
    description:
      "Temperature sensor reading 11.2°C, exceeding upper limit of 8°C. Breach duration increasing. Reefer unit may have failed during Alpine crossing.",
    recommendedAction:
      "Contact driver to check reefer unit immediately. If not recoverable, divert to nearest cold storage facility.",
    locationName: "Near Turin, Italy — Alpine approach",
    playbookId: "pb-002",
    tempValue: 11.2,
  },
];

// --- Per-shipment simulation state ---

interface ShipmentSimState {
  shipmentId: string;
  routeId: string;
  path: [number, number][];
  startProgress: number; // progress% when simulation started
  currentProgress: number;
  prevPosition: [number, number] | null;
  isPharma: boolean;
  tempRange: { min: number; max: number } | null;
  baseTemp: number; // normal operating temperature
  baseHumidity: number;
  // Trigger state
  triggeredIds: Set<string>;
  isDeviating: boolean;
  deviationOffset: [number, number];
  isDwelling: boolean;
  dwellTicksRemaining: number;
  isSignalLost: boolean;
  signalLossTicksRemaining: number;
}

// --- Simulation singleton ---

const SIM_TICK_MS = 2500; // tick interval
const PROGRESS_PER_TICK_1X = 0.08; // % progress per tick at 1x speed (~3.2% per minute)

class SimulationEngine {
  state: SimulationState = {
    running: false,
    speed: 1,
    tick: 0,
    simulatedTime: 0,
    startedAt: null,
  };

  private shipmentStates: Map<string, ShipmentSimState> = new Map();
  private listeners: Set<(events: SimulationEvent[]) => void> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private initialProgressMap: Map<string, number> = new Map();

  /** Initialize shipment states from current active shipments */
  private initShipmentStates(): void {
    this.shipmentStates.clear();
    const active = getActiveShipments();

    for (const s of active) {
      if (!s.routeTemplateId) continue;
      const route = getRouteTemplateById(s.routeTemplateId);
      if (!route || route.coordinates.length < 2) continue;

      const path: [number, number][] = route.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );

      // Use saved initial progress or current
      const startProgress = this.initialProgressMap.get(s.id) ?? s.progressPercent;
      if (!this.initialProgressMap.has(s.id)) {
        this.initialProgressMap.set(s.id, s.progressPercent);
      }

      const isPharma = s.temperatureRange !== null;
      const baseTemp = isPharma && s.temperatureRange
        ? (s.temperatureRange.min + s.temperatureRange.max) / 2
        : 20 + Math.random() * 3;

      this.shipmentStates.set(s.id, {
        shipmentId: s.id,
        routeId: route.id,
        path,
        startProgress,
        currentProgress: startProgress,
        prevPosition: null,
        isPharma,
        tempRange: s.temperatureRange,
        baseTemp,
        baseHumidity: 40 + Math.random() * 15,
        triggeredIds: new Set(),
        isDeviating: false,
        deviationOffset: [0, 0],
        isDwelling: false,
        dwellTicksRemaining: 0,
        isSignalLost: false,
        signalLossTicksRemaining: 0,
      });
    }
  }

  /** Subscribe to simulation events */
  subscribe(listener: (events: SimulationEvent[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Emit events to all listeners */
  private emit(events: SimulationEvent[]): void {
    for (const listener of Array.from(this.listeners)) {
      listener(events);
    }
  }

  /** Start the simulation */
  start(): void {
    if (this.state.running) return;

    if (this.shipmentStates.size === 0) {
      this.initShipmentStates();
    }

    this.state.running = true;
    this.state.startedAt = this.state.startedAt ?? Date.now();

    this.intervalId = setInterval(() => this.tick(), SIM_TICK_MS);
  }

  /** Pause the simulation */
  pause(): void {
    this.state.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Reset the simulation */
  reset(): void {
    this.pause();
    this.state.tick = 0;
    this.state.simulatedTime = 0;
    this.state.startedAt = null;

    // Reset shipment progress to initial values
    for (const [shipmentId, initProgress] of Array.from(this.initialProgressMap.entries())) {
      const ss = this.shipmentStates.get(shipmentId);
      if (ss) {
        ss.currentProgress = initProgress;
        ss.triggeredIds.clear();
        ss.isDeviating = false;
        ss.isDwelling = false;
        ss.isSignalLost = false;
      }
      // Also reset the store
      const pos = ss ? getPositionAlongPath(ss.path, initProgress) : null;
      if (pos) {
        updateShipmentProgress(shipmentId, initProgress, { lat: pos[0], lng: pos[1] }, 0);
      }
    }

    clearSimulationAlerts();
    this.shipmentStates.clear();
  }

  /** Set speed multiplier */
  setSpeed(speed: number): void {
    this.state.speed = speed;
  }

  /** Get current state snapshot */
  getState(): SimulationState {
    return { ...this.state };
  }

  /** Main tick — advance all shipments */
  private tick(): void {
    this.state.tick++;
    this.state.simulatedTime += SIM_TICK_MS * this.state.speed;

    const events: SimulationEvent[] = [];
    const now = new Date().toISOString();

    for (const ss of Array.from(this.shipmentStates.values())) {
      // Skip if dwelling
      if (ss.isDwelling) {
        ss.dwellTicksRemaining--;
        if (ss.dwellTicksRemaining <= 0) {
          ss.isDwelling = false;
        }
        // Still emit position (stationary)
        const pos = getPositionAlongPath(ss.path, ss.currentProgress);
        if (pos) {
          events.push(this.buildPositionUpdate(ss, pos, 0, now));
        }
        continue;
      }

      // Skip if signal lost (no position emitted)
      if (ss.isSignalLost) {
        ss.signalLossTicksRemaining--;
        if (ss.signalLossTicksRemaining <= 0) {
          ss.isSignalLost = false;
        }
        // Emit signal_lost marker
        events.push({
          type: "position",
          shipmentId: ss.shipmentId,
          lat: 0,
          lng: 0,
          speed: 0,
          heading: 0,
          timestamp: now,
          progressPercent: ss.currentProgress,
          temperature: null,
          humidity: null,
        });
        continue;
      }

      // Advance progress
      const progressDelta = PROGRESS_PER_TICK_1X * this.state.speed;
      const oldProgress = ss.currentProgress;
      ss.currentProgress = Math.min(100, ss.currentProgress + progressDelta);

      // Check trigger points
      for (const trigger of TRIGGER_POINTS) {
        if (trigger.shipmentId !== ss.shipmentId) continue;
        if (ss.triggeredIds.has(trigger.id)) continue;
        if (oldProgress < trigger.triggerPercent && ss.currentProgress >= trigger.triggerPercent) {
          ss.triggeredIds.add(trigger.id);
          const alertEvent = this.fireTrigger(trigger, ss, now);
          events.push(alertEvent);

          // Apply special behaviors
          if (trigger.deviationKm) {
            ss.isDeviating = true;
            // Perpendicular offset (~deviationKm in degrees)
            const offsetDeg = trigger.deviationKm / 111;
            ss.deviationOffset = [offsetDeg * 0.7, offsetDeg * 0.7];
          }
          if (trigger.dwellMinutes) {
            ss.isDwelling = true;
            // Convert minutes to ticks (at current speed)
            ss.dwellTicksRemaining = Math.ceil(
              (trigger.dwellMinutes * 60 * 1000) / (SIM_TICK_MS * this.state.speed * 10)
            );
            // Cap at 20 ticks for demo purposes
            ss.dwellTicksRemaining = Math.min(ss.dwellTicksRemaining, 20);
          }
          if (trigger.signalLossMinutes) {
            ss.isSignalLost = true;
            ss.signalLossTicksRemaining = Math.ceil(
              (trigger.signalLossMinutes * 60 * 1000) / (SIM_TICK_MS * this.state.speed * 10)
            );
            ss.signalLossTicksRemaining = Math.min(ss.signalLossTicksRemaining, 15);
          }
        }
      }

      // End deviation after 3% more progress
      if (ss.isDeviating && ss.currentProgress > (oldProgress + 3)) {
        ss.isDeviating = false;
        ss.deviationOffset = [0, 0];
      }

      // Compute position
      let pos = getPositionAlongPath(ss.path, ss.currentProgress);
      if (!pos) continue;

      // Apply deviation offset
      if (ss.isDeviating) {
        pos = [pos[0] + ss.deviationOffset[0], pos[1] + ss.deviationOffset[1]];
      }

      // Speed simulation (km/h): ~80 for road, slower near triggers
      const speed = ss.isDwelling ? 0 : 65 + Math.random() * 30;

      ss.prevPosition = pos;

      // Update store
      updateShipmentProgress(ss.shipmentId, ss.currentProgress, { lat: pos[0], lng: pos[1] }, speed);

      events.push(this.buildPositionUpdate(ss, pos, speed, now));
    }

    if (events.length > 0) {
      this.emit(events);
    }
  }

  private buildPositionUpdate(
    ss: ShipmentSimState,
    pos: [number, number],
    speed: number,
    timestamp: string
  ): PositionUpdate {
    // Temperature simulation
    let temperature: number | null = null;
    let humidity: number | null = null;

    if (ss.isPharma && ss.tempRange) {
      // Check if temp breach trigger is active
      const tempTrigger = TRIGGER_POINTS.find(
        (t) => t.shipmentId === ss.shipmentId && t.alertType === "temperature_breach" && ss.triggeredIds.has(t.id)
      );
      if (tempTrigger?.tempValue) {
        temperature = tempTrigger.tempValue + (Math.random() - 0.5) * 0.5;
      } else {
        temperature = ss.baseTemp + (Math.random() - 0.5) * 1.5;
      }
      humidity = ss.baseHumidity + (Math.random() - 0.5) * 3;
    }

    return {
      type: "position",
      shipmentId: ss.shipmentId,
      lat: pos[0],
      lng: pos[1],
      speed: Math.round(speed * 10) / 10,
      heading: Math.round(ss.prevPosition ? calculateHeading(ss.prevPosition, pos) : 0),
      timestamp,
      progressPercent: Math.round(ss.currentProgress * 100) / 100,
      temperature: temperature !== null ? Math.round(temperature * 10) / 10 : null,
      humidity: humidity !== null ? Math.round(humidity * 10) / 10 : null,
    };
  }

  private fireTrigger(trigger: TriggerPoint, ss: ShipmentSimState, now: string): AlertEvent {
    const pos = getPositionAlongPath(ss.path, trigger.triggerPercent);
    const location = pos ? { lat: pos[0], lng: pos[1] } : { lat: 0, lng: 0 };

    const alert: Alert = {
      id: `alrt-sim-${trigger.id}`,
      type: trigger.alertType,
      severity: trigger.severity,
      status: "new",
      shipmentId: trigger.shipmentId,
      shipmentRef: trigger.shipmentId,
      segmentId: null,
      deviceId: null,
      customerId: this.getCustomerIdForShipment(trigger.shipmentId),
      customerName: this.getCustomerNameForShipment(trigger.shipmentId),
      title: trigger.title,
      description: trigger.description,
      location,
      locationName: trigger.locationName,
      triggeredAt: now,
      acknowledgedAt: null,
      resolvedAt: null,
      closedAt: null,
      acknowledgedBy: null,
      resolvedBy: null,
      slaDeadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1hr SLA
      slaBreached: false,
      playbookId: trigger.playbookId,
      currentPlaybookStep: null,
      recommendedAction: trigger.recommendedAction,
      fieldResponseId: null,
      notes: `Simulation-generated alert at ${trigger.triggerPercent}% progress.`,
    };

    addSimulationAlert(alert);
    incrementShipmentAlertCount(trigger.shipmentId);

    return { type: "alert", alert };
  }

  private getCustomerIdForShipment(shipmentId: string): string {
    const active = getActiveShipments();
    const s = active.find((sh) => sh.id === shipmentId);
    return s?.customerId ?? "cust-001";
  }

  private getCustomerNameForShipment(shipmentId: string): string {
    const active = getActiveShipments();
    const s = active.find((sh) => sh.id === shipmentId);
    return s?.customerName ?? "Unknown";
  }
}

// --- Singleton export ---

export const simulationEngine = new SimulationEngine();
