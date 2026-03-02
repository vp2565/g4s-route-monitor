// ============================================================
// G4S Telematix — Data Store
// Typed data loading module with accessor functions
// ============================================================

import type {
  Customer,
  User,
  RouteTemplate,
  Shipment,
  Segment,
  Device,
  Alert,
  SOCPlaybook,
  FieldResponse,
  RiskAssessment,
  AuditEntry,
  ConditionData,
  AlertType,
} from "./types";

// --- Import seed data ---
import customersData from "./data/customers.json";
import usersData from "./data/users.json";
import routesData from "./data/routes.json";
import shipmentsData from "./data/shipments.json";
import segmentsData from "./data/segments.json";
import devicesData from "./data/devices.json";
import alertsData from "./data/alerts.json";
import playbooksData from "./data/playbooks.json";
import fieldResponsesData from "./data/field-responses.json";
import riskAssessmentsData from "./data/risk-assessments.json";
import auditEntriesData from "./data/audit-entries.json";
import conditionDataJson from "./data/condition-data.json";

// --- Cast imported JSON to typed arrays ---
// JSON imports use `as unknown as T` where direct cast fails due to
// optional metadata properties or union type narrowing.
const customers = customersData as unknown as Customer[];
const users = usersData as unknown as User[];
const routes = routesData as unknown as RouteTemplate[];
const shipments = shipmentsData as unknown as Shipment[];
const segments = segmentsData as unknown as Segment[];
const devices = devicesData as unknown as Device[];
const alerts = alertsData as unknown as Alert[];
const playbooks = playbooksData as unknown as SOCPlaybook[];
const fieldResponses = fieldResponsesData as unknown as FieldResponse[];
const riskAssessments = riskAssessmentsData as unknown as RiskAssessment[];
const auditEntries = auditEntriesData as unknown as AuditEntry[];
const conditionData = conditionDataJson as unknown as ConditionData[];

// --- Customer accessors ---

export function getAllCustomers(): Customer[] {
  return customers;
}

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

// --- User accessors ---

export function getAllUsers(): User[] {
  return users;
}

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getUsersByCustomerId(customerId: string): User[] {
  return users.filter((u) => u.customerId === customerId);
}

// --- Route Template accessors ---

export function getAllRouteTemplates(): RouteTemplate[] {
  return routes;
}

export function getRouteTemplateById(id: string): RouteTemplate | undefined {
  return routes.find((r) => r.id === id);
}

// --- Shipment accessors ---

export function getAllShipments(): Shipment[] {
  return shipments;
}

export function getShipmentById(id: string): Shipment | undefined {
  return shipments.find((s) => s.id === id);
}

export function getShipmentsByCustomerId(customerId: string): Shipment[] {
  return shipments.filter((s) => s.customerId === customerId);
}

export function getShipmentsByStatus(status: Shipment["status"]): Shipment[] {
  return shipments.filter((s) => s.status === status);
}

export function getActiveShipments(): Shipment[] {
  return shipments.filter(
    (s) =>
      s.status === "active" ||
      s.status === "in_transit" ||
      s.status === "at_checkpoint" ||
      s.status === "delayed"
  );
}

// --- Segment accessors ---

export function getAllSegments(): Segment[] {
  return segments;
}

export function getSegmentById(id: string): Segment | undefined {
  return segments.find((s) => s.id === id);
}

export function getSegmentsByShipmentId(shipmentId: string): Segment[] {
  return segments.filter((s) => s.shipmentId === shipmentId);
}

// --- Device accessors ---

export function getAllDevices(): Device[] {
  return devices;
}

export function getDeviceById(id: string): Device | undefined {
  return devices.find((d) => d.id === id);
}

export function getDevicesByShipmentId(shipmentId: string): Device[] {
  return devices.filter((d) => d.assignedShipmentId === shipmentId);
}

export function getAvailableDevices(): Device[] {
  return devices.filter((d) => d.status === "available");
}

// --- Alert accessors ---

export function getAllAlerts(): Alert[] {
  return alerts;
}

export function getAlertById(id: string): Alert | undefined {
  return alerts.find((a) => a.id === id);
}

export function getAlertsByShipmentId(shipmentId: string): Alert[] {
  return alerts.filter((a) => a.shipmentId === shipmentId);
}

export function getActiveAlerts(): Alert[] {
  return alerts.filter(
    (a) =>
      a.status === "new" ||
      a.status === "acknowledged" ||
      a.status === "investigating" ||
      a.status === "dispatched"
  );
}

export function getAlertsByCustomerId(customerId: string): Alert[] {
  return alerts.filter((a) => a.customerId === customerId);
}

// --- SOC Playbook accessors ---

export function getAllPlaybooks(): SOCPlaybook[] {
  return playbooks;
}

export function getPlaybookById(id: string): SOCPlaybook | undefined {
  return playbooks.find((p) => p.id === id);
}

export function getPlaybookByAlertType(
  alertType: AlertType
): SOCPlaybook | undefined {
  return playbooks.find((p) => p.alertType.includes(alertType));
}

// --- Field Response accessors ---

export function getAllFieldResponses(): FieldResponse[] {
  return fieldResponses;
}

export function getFieldResponseById(id: string): FieldResponse | undefined {
  return fieldResponses.find((f) => f.id === id);
}

export function getFieldResponseByAlertId(
  alertId: string
): FieldResponse | undefined {
  return fieldResponses.find((f) => f.alertId === alertId);
}

// --- Risk Assessment accessors ---

export function getAllRiskAssessments(): RiskAssessment[] {
  return riskAssessments;
}

export function getRiskAssessmentById(
  id: string
): RiskAssessment | undefined {
  return riskAssessments.find((r) => r.id === id);
}

export function getRiskAssessmentByRouteId(
  routeTemplateId: string
): RiskAssessment | undefined {
  return riskAssessments.find((r) => r.routeTemplateId === routeTemplateId);
}

// --- Audit Entry accessors ---

export function getAllAuditEntries(): AuditEntry[] {
  return auditEntries;
}

export function getAuditEntriesByEntityId(entityId: string): AuditEntry[] {
  return auditEntries.filter((a) => a.entityId === entityId);
}

export function getAuditEntriesByUserId(userId: string): AuditEntry[] {
  return auditEntries.filter((a) => a.userId === userId);
}

// --- Condition Data accessors ---

export function getAllConditionData(): ConditionData[] {
  return conditionData;
}

export function getConditionDataByShipmentId(
  shipmentId: string
): ConditionData | undefined {
  return conditionData.find((c) => c.shipmentId === shipmentId);
}

// --- Mutation helpers (in-memory only, resets on reload) ---

export function addShipment(shipment: Shipment): void {
  shipments.push(shipment);
}

export function getNextShipmentId(): string {
  let maxNum = 0;
  for (const s of shipments) {
    const match = s.id.match(/G4S-SHP-2026-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `G4S-SHP-2026-${String(maxNum + 1).padStart(4, "0")}`;
}
