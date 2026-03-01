// ============================================================
// G4S Telematix — Data Model Type Definitions
// All 13 entities for the Route Monitoring Platform prototype
// ============================================================

// --- Enums & Literal Types ---

export type CustomerTier = "opco" | "enterprise" | "standard" | "subsidiary";

export type ShipmentStatus =
  | "planned"
  | "ddi_pending"
  | "active"
  | "in_transit"
  | "at_checkpoint"
  | "delayed"
  | "completed"
  | "cancelled";

export type TransportMode = "road" | "sea" | "rail" | "air";

export type SegmentStatus =
  | "pending"
  | "active"
  | "completed"
  | "delayed"
  | "cancelled";

export type DeviceType =
  | "gps_tracker"
  | "temp_sensor"
  | "smart_lock"
  | "multi_sensor";

export type DeviceStatus =
  | "available"
  | "assigned"
  | "active"
  | "maintenance"
  | "decommissioned";

export type AlertType =
  | "route_deviation"
  | "geofence_breach"
  | "unauthorized_stop"
  | "temperature_breach"
  | "humidity_breach"
  | "shock_detected"
  | "light_exposure"
  | "door_open"
  | "signal_loss"
  | "battery_low"
  | "late_departure"
  | "eta_exceeded"
  | "tampering";

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type AlertStatus =
  | "new"
  | "acknowledged"
  | "investigating"
  | "dispatched"
  | "resolved"
  | "closed"
  | "false_alarm";

export type EscalationTier = 1 | 2 | 3 | 4;

export type FieldResponseStatus =
  | "dispatched"
  | "en_route"
  | "on_scene"
  | "evidence_collected"
  | "resolved"
  | "cancelled";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type AuditAction =
  | "shipment_created"
  | "shipment_updated"
  | "shipment_completed"
  | "alert_created"
  | "alert_acknowledged"
  | "alert_escalated"
  | "alert_resolved"
  | "alert_closed"
  | "device_assigned"
  | "device_unassigned"
  | "ddi_completed"
  | "field_dispatched"
  | "field_arrived"
  | "field_resolved"
  | "playbook_triggered"
  | "user_login"
  | "user_logout"
  | "notification_sent"
  | "risk_assessment_created"
  | "route_created";

export type NotificationChannel = "email" | "sms" | "push" | "webhook";

// --- Interfaces ---

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Customer {
  id: string;
  name: string;
  shortCode: string;
  tier: CustomerTier;
  parentId: string | null;
  industry: string;
  country: string;
  contractStart: string; // ISO date
  contractEnd: string; // ISO date
  primaryContact: string;
  primaryEmail: string;
  logo: string; // placeholder path
  activeShipments: number;
  totalDevices: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: import("@/types").UserRole;
  roleLabel: string;
  customerId: string;
  customerName: string;
  avatarInitials: string;
  phone: string;
  lastLogin: string; // ISO datetime
  isActive: boolean;
  permissions: string[];
}

export interface RouteWaypoint {
  name: string;
  location: GeoPoint;
  type: "origin" | "waypoint" | "checkpoint" | "port" | "destination";
  expectedArrival?: string; // ISO datetime
}

export interface NoGoZone {
  id: string;
  name: string;
  reason: string;
  polygon: GeoPoint[]; // simplified bounding box corners
}

export interface SafeParking {
  id: string;
  name: string;
  location: GeoPoint;
  capacity: number;
  security: "guarded" | "fenced" | "open";
  facilities: string[];
}

export interface RouteTemplate {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationHours: number;
  transportModes: TransportMode[];
  coordinates: [number, number][]; // [lng, lat] GeoJSON LineString format
  waypoints: RouteWaypoint[];
  noGoZones: NoGoZone[];
  safeParking: SafeParking[];
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  countryTransits: string[];
  lastUpdated: string; // ISO date
}

export interface DDIChecklist {
  driverVerified: boolean;
  vehicleInspected: boolean;
  sealsApplied: boolean;
  sealNumbers: string[];
  documentsChecked: boolean;
  routeBriefingDone: boolean;
  devicesTested: boolean;
  emergencyContactsConfirmed: boolean;
  completedBy: string; // userId
  completedAt: string; // ISO datetime
  notes: string;
}

export interface Shipment {
  id: string;
  customerId: string;
  customerName: string;
  routeTemplateId: string;
  routeName: string;
  status: ShipmentStatus;
  priority: "standard" | "high" | "critical";
  origin: string;
  destination: string;
  cargoDescription: string;
  cargoValue: number; // EUR
  cargoWeight: number; // kg
  transportModes: TransportMode[];
  segmentIds: string[];
  deviceIds: string[];
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  scheduledDeparture: string; // ISO datetime
  actualDeparture: string | null;
  scheduledArrival: string; // ISO datetime
  estimatedArrival: string | null;
  actualArrival: string | null;
  currentPosition: GeoPoint | null;
  currentSpeed: number | null; // km/h
  progressPercent: number; // 0-100
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  alertCount: number;
  ddi: DDIChecklist | null;
  smpVersion: string; // Security Management Plan version
  temperatureRange: { min: number; max: number } | null; // required range in Celsius
  trackingToken: string | null; // for OEM partner sharing
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  id: string;
  shipmentId: string;
  segmentNumber: number;
  mode: TransportMode;
  status: SegmentStatus;
  origin: string;
  destination: string;
  originPoint: GeoPoint;
  destinationPoint: GeoPoint;
  carrier: string;
  carrierRef: string;
  deviceIds: string[];
  scheduledDeparture: string;
  actualDeparture: string | null;
  scheduledArrival: string;
  actualArrival: string | null;
  reportingRateMinutes: number; // mode-specific: road=5, sea=30, rail=15, air=10
  distanceKm: number;
  currentPosition: GeoPoint | null;
  notes: string;
}

export interface DeviceSensorBundle {
  temperature: boolean;
  humidity: boolean;
  shock: boolean;
  light: boolean;
  door: boolean;
  gps: boolean;
}

export interface Device {
  id: string;
  type: DeviceType;
  vendor: string;
  model: string;
  serialNumber: string;
  status: DeviceStatus;
  batteryLevel: number; // 0-100
  lastHealthCheck: string; // ISO datetime
  firmwareVersion: string;
  sensors: DeviceSensorBundle;
  assignedShipmentId: string | null;
  assignedSegmentId: string | null;
  customerId: string | null;
  lastPosition: GeoPoint | null;
  lastReportedAt: string | null;
  signalStrength: number; // 0-100
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  shipmentId: string;
  shipmentRef: string;
  segmentId: string | null;
  deviceId: string | null;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  location: GeoPoint;
  locationName: string;
  triggeredAt: string; // ISO datetime
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  acknowledgedBy: string | null; // userId
  resolvedBy: string | null;
  slaDeadline: string; // ISO datetime
  slaBreached: boolean;
  playbookId: string | null;
  currentPlaybookStep: number | null;
  recommendedAction: string;
  fieldResponseId: string | null;
  notes: string;
}

export interface PlaybookStep {
  stepNumber: number;
  title: string;
  description: string;
  expectedDuration: string; // e.g. "5 minutes", "15 minutes"
  escalationTier: EscalationTier;
  requiredAction: string;
  autoEscalateAfter: number | null; // minutes
}

export interface SOCPlaybook {
  id: string;
  name: string;
  alertType: AlertType[];
  severity: AlertSeverity[];
  description: string;
  steps: PlaybookStep[];
  totalExpectedDuration: string;
  lastReviewed: string;
  version: string;
}

export interface EvidenceItem {
  type: "photo" | "document" | "signature" | "note";
  url: string;
  description: string;
  capturedAt: string;
}

export interface FieldResponse {
  id: string;
  alertId: string;
  shipmentId: string;
  status: FieldResponseStatus;
  dispatchedUnit: string;
  unitCallsign: string;
  dispatchedAt: string;
  enRouteAt: string | null;
  arrivedAt: string | null;
  resolvedAt: string | null;
  currentPosition: GeoPoint | null;
  etaMinutes: number | null;
  findings: string;
  evidence: EvidenceItem[];
  outcome: string;
  lawEnforcementInvolved: boolean;
  lawEnforcementRef: string | null;
  notes: string;
}

export interface RiskFactor {
  category: string;
  factor: string;
  score: number; // 0-100
  weight: number; // 0-1
  details: string;
}

export interface RiskAssessment {
  id: string;
  routeTemplateId: string;
  routeName: string;
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  recommendations: string[];
  assessedAt: string;
  assessedBy: string;
  validUntil: string;
  version: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO datetime
  action: AuditAction;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityRef: string;
  details: string;
  ipAddress: string;
  metadata: Record<string, string | number | boolean>;
}

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  relatedEntityType: string;
  relatedEntityId: string;
  sentAt: string;
  readAt: string | null;
  isRead: boolean;
}

export interface NotificationRule {
  id: string;
  customerId: string;
  userId: string | null; // null means customer-wide
  alertTypes: AlertType[];
  severities: AlertSeverity[];
  channels: NotificationChannel[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionReading {
  timestamp: string;
  temperature: number | null; // Celsius
  humidity: number | null; // percent
  shock: number | null; // g-force
  light: number | null; // lux
  batteryLevel: number | null;
}

export interface ConditionData {
  shipmentId: string;
  deviceId: string;
  readings: ConditionReading[];
  breachEvents: ConditionBreach[];
}

export interface ConditionBreach {
  type: "temperature" | "humidity" | "shock" | "light";
  startedAt: string;
  endedAt: string | null;
  thresholdValue: number;
  peakValue: number;
  description: string;
}
