"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useSimulation } from "@/hooks/useSimulation";
import {
  getAllShipments,
  getAllAlerts,
  getShipmentById,
  getRouteTemplateById,
  getPlaybookByAlertType,
  getFieldResponseByAlertId,
} from "@/lib/store";
import type { Shipment, RouteTemplate } from "@/lib/types";
import { haversine } from "@/components/map/mapUtils";
import { SimulationBar } from "@/components/map/SimulationBar";
import { AlertQueue } from "./AlertQueue";
import { PlaybookPanel } from "./PlaybookPanel";
import { ShiftHandoverModal } from "./ShiftHandoverModal";

// --- Route segment types (reuse from MapConsole) ---

interface RouteSegment {
  positions: [number, number][];
  mode: "road" | "sea" | "air";
}

// --- Sea lane data (reuse) ---

const SEA_LANE_WAYPOINTS: Record<string, [number, number][]> = {
  "piraeus-rotterdam": [
    [37.95, 23.64], [37.50, 22.00], [36.80, 19.00], [37.00, 15.50],
    [37.50, 11.00], [37.80, 7.00], [38.00, 3.00], [36.50, -1.00],
    [36.10, -5.30], [37.00, -8.50], [39.50, -9.50], [43.00, -9.50],
    [46.00, -6.00], [48.50, -5.00], [49.50, -2.00], [50.50, 0.50],
    [51.50, 2.50], [51.96, 4.12],
  ],
  "lubeck-trelleborg": [
    [53.87, 10.69], [54.10, 11.20], [54.40, 11.80],
    [54.70, 12.50], [55.00, 12.90], [55.38, 13.16],
  ],
};

function getSeaLaneKey(
  startLat: number, startLng: number,
  endLat: number, endLng: number
): string | null {
  const close = (a: number, b: number, tol = 0.5) => Math.abs(a - b) < tol;
  if (close(startLat, 37.95) && close(startLng, 23.64) && close(endLat, 51.96) && close(endLng, 4.12))
    return "piraeus-rotterdam";
  if (close(startLat, 53.87) && close(startLng, 10.69) && close(endLat, 55.38) && close(endLng, 13.16))
    return "lubeck-trelleborg";
  return null;
}

function greatCircleArc(start: [number, number], end: [number, number], numPoints: number): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(start[0]), lng1 = toRad(start[1]);
  const lat2 = toRad(end[0]), lng2 = toRad(end[1]);
  const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    points.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return points;
}

function generateSeaRoute(start: [number, number], end: [number, number]): [number, number][] {
  const key = getSeaLaneKey(start[0], start[1], end[0], end[1]);
  if (key && SEA_LANE_WAYPOINTS[key]) return SEA_LANE_WAYPOINTS[key];
  return greatCircleArc(start, end, 30);
}

function findClosestIndex(path: [number, number][], target: [number, number]): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = haversine(path[i], target);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}

function buildFallbackSegments(route: RouteTemplate): RouteSegment[] {
  const allCoords: [number, number][] = route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
  const wps = route.waypoints;
  const isMultimodal = route.transportModes.length > 1;

  if (!isMultimodal) return [{ positions: allCoords, mode: "road" }];

  const portIndices: number[] = [];
  for (let i = 0; i < wps.length; i++) {
    if (wps[i].type === "port") portIndices.push(i);
  }
  if (portIndices.length < 2) return [{ positions: allCoords, mode: "road" }];

  const portCoordIdx = portIndices.map((pi) => findClosestIndex(allCoords, [wps[pi].location.lat, wps[pi].location.lng]));
  const segments: RouteSegment[] = [];

  if (portCoordIdx[0] > 0) segments.push({ positions: allCoords.slice(0, portCoordIdx[0] + 1), mode: "road" });
  for (let p = 0; p < portIndices.length - 1; p++) {
    segments.push({
      positions: generateSeaRoute(
        [wps[portIndices[p]].location.lat, wps[portIndices[p]].location.lng],
        [wps[portIndices[p + 1]].location.lat, wps[portIndices[p + 1]].location.lng]
      ),
      mode: "sea",
    });
  }
  const lastIdx = portCoordIdx[portCoordIdx.length - 1];
  if (lastIdx < allCoords.length - 1) segments.push({ positions: allCoords.slice(lastIdx), mode: "road" });

  return segments;
}

function getPositionAlongPath(path: [number, number][], percent: number): [number, number] | null {
  if (path.length === 0) return null;
  if (path.length === 1 || percent <= 0) return path[0];
  if (percent >= 100) return path[path.length - 1];
  const cumul: number[] = [0];
  for (let i = 1; i < path.length; i++) cumul.push(cumul[i - 1] + haversine(path[i - 1], path[i]));
  const total = cumul[cumul.length - 1];
  if (total === 0) return path[0];
  const target = total * percent / 100;
  for (let i = 1; i < path.length; i++) {
    if (cumul[i] >= target) {
      const segLen = cumul[i] - cumul[i - 1];
      const t = segLen > 0 ? (target - cumul[i - 1]) / segLen : 0;
      return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
    }
  }
  return path[path.length - 1];
}

function getMarkerColor(shipment: Shipment): string {
  if (shipment.status === "completed") return "#9CA3AF";
  if (shipment.alertCount > 0) return "#EF4444";
  if (shipment.status === "delayed" || shipment.riskLevel === "high" || shipment.riskLevel === "critical") return "#EAB308";
  return "#22C55E";
}

// --- Tile ---
const DARK_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// --- Map helpers ---

function MapZoom({ center, zoom }: { center: [number, number] | null; zoom: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function MapResizer({ trigger }: { trigger: number }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

// Pulsing marker CSS via a div icon
function createPulsingIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:24px;height:24px">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.3);animation:soc-pulse 1.5s ease-out infinite"></div>
        <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#EF4444;border:2px solid #fff;box-shadow:0 0 8px rgba(239,68,68,0.6)"></div>
      </div>
      <style>@keyframes soc-pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2.5);opacity:0}}</style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Vehicle current position (green) icon
function createVehicleIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#22C55E;border:2px solid #fff;box-shadow:0 0 8px rgba(34,197,94,0.5);display:flex;align-items:center;justify-content:center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 01-2-2V7a2 2 0 012-2h10l4 4v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Field unit (blue) icon
function createFieldUnitIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:2px solid #93C5FD;box-shadow:0 0 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// --- Main SOC Console ---

export default function SOCConsole() {
  const simulation = useSimulation();

  // Merge seed alerts with simulation-generated alerts
  const allAlerts = useMemo(() => {
    const seed = getAllAlerts();
    const simAlerts = simulation.simulationAlerts;
    // Deduplicate by id
    const seen = new Set(seed.map((a) => a.id));
    return [...seed, ...simAlerts.filter((a) => !seen.has(a.id))];
  }, [simulation.simulationAlerts]);

  const activeAlerts = useMemo(() => {
    return allAlerts.filter(
      (a) =>
        a.status === "new" ||
        a.status === "acknowledged" ||
        a.status === "investigating" ||
        a.status === "dispatched"
    );
  }, [allAlerts]);

  const allShipments = useMemo(() => getAllShipments(), []);

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoomLevel] = useState<number | null>(null);
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // OSRM cache (same concept as MapConsole)
  const osrmCacheRef = useRef<Map<string, RouteSegment[]>>(new Map());
  const [osrmCacheVersion, setOsrmCacheVersion] = useState(0);

  // Selected alert data
  const selectedAlert = useMemo(
    () => (selectedAlertId ? allAlerts.find((a) => a.id === selectedAlertId) ?? null : null),
    [selectedAlertId, allAlerts]
  );

  const selectedShipment = useMemo(
    () => (selectedAlert ? getShipmentById(selectedAlert.shipmentId) ?? null : null),
    [selectedAlert]
  );

  const selectedRoute = useMemo(
    () => (selectedShipment?.routeTemplateId ? getRouteTemplateById(selectedShipment.routeTemplateId) ?? null : null),
    [selectedShipment]
  );

  const selectedPlaybook = useMemo(
    () => (selectedAlert ? getPlaybookByAlertType(selectedAlert.type) ?? null : null),
    [selectedAlert]
  );

  const selectedFieldResponse = useMemo(
    () => (selectedAlertId ? getFieldResponseByAlertId(selectedAlertId) ?? null : null),
    [selectedAlertId]
  );

  // Route segments for selected alert's shipment
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);

  useEffect(() => {
    if (!selectedRoute) { setRouteSegments([]); return; }

    const cacheKey = selectedRoute.id;
    const cached = osrmCacheRef.current.get(cacheKey);
    if (cached) { setRouteSegments(cached); return; }

    let cancelled = false;
    const fallback = buildFallbackSegments(selectedRoute);
    setRouteSegments(fallback);

    // OSRM upgrade for road-only routes
    if (selectedRoute.transportModes.length === 1 && selectedRoute.transportModes[0] === "road") {
      const wps = selectedRoute.waypoints;
      const coords = wps.map((wp) => `${wp.location.lng},${wp.location.lat}`).join(";");
      fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
            const positions: [number, number][] = data.routes[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            );
            const result = [{ positions, mode: "road" as const }];
            osrmCacheRef.current.set(cacheKey, result);
            setRouteSegments(result);
            setOsrmCacheVersion((v) => v + 1);
          }
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [selectedRoute]);

  // Compute all shipment positions for map blobs
  const shipmentPositions = useMemo(() => {
    const posMap = new Map<string, [number, number]>();
    for (const s of allShipments) {
      // Check simulation positions first
      const simPos = simulation.positions.get(s.id);
      if (simPos && simPos.lat !== 0) {
        posMap.set(s.id, [simPos.lat, simPos.lng]);
        continue;
      }

      if (!s.currentPosition) continue;
      if (s.progressPercent > 0 && s.routeTemplateId) {
        const route = getRouteTemplateById(s.routeTemplateId);
        if (route) {
          const cached = osrmCacheRef.current.get(route.id);
          const fullPath = cached
            ? cached.flatMap((seg) => seg.positions)
            : route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
          const pos = getPositionAlongPath(fullPath, s.progressPercent);
          if (pos) { posMap.set(s.id, pos); continue; }
        }
      }
      posMap.set(s.id, [s.currentPosition.lat, s.currentPosition.lng]);
    }
    return posMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allShipments, osrmCacheVersion, simulation.positions]);

  const mappableShipments = useMemo(
    () => allShipments.filter((s) => shipmentPositions.has(s.id)),
    [allShipments, shipmentPositions]
  );

  // Multi-customer badge counts
  const customerAlertCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activeAlerts) {
      const name = a.customerName.split(" ")[0]; // short name
      counts[name] = (counts[name] || 0) + 1;
    }
    // Add customers with 0 alerts
    const allCustomerNames = Array.from(new Set(allShipments.map((s) => s.customerName.split(" ")[0])));
    for (let i = 0; i < allCustomerNames.length; i++) {
      const name = allCustomerNames[i];
      if (!(name in counts)) counts[name] = 0;
    }
    return counts;
  }, [activeAlerts, allShipments]);

  // Handle alert selection — zoom map to alert location
  const handleSelectAlert = useCallback(
    (alertId: string) => {
      setSelectedAlertId(alertId);
      const alert = allAlerts.find((a) => a.id === alertId);
      if (alert) {
        setMapCenter([alert.location.lat, alert.location.lng]);
        setMapZoomLevel(10);
        setResizeTrigger((prev) => prev + 1);
      }
    },
    [allAlerts]
  );

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-200">SOC Command Center</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Customer badge bar */}
          <div className="flex items-center gap-2">
            {Object.entries(customerAlertCounts).map(([name, count]) => (
              <span
                key={name}
                className="text-[10px] px-2 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: count > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(30, 41, 59, 0.5)",
                  color: count > 0 ? "#FCA5A5" : "#64748B",
                  border: count > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #1E293B",
                }}
              >
                {name}: {count} {count === 1 ? "alert" : "alerts"}
              </span>
            ))}
          </div>

          <ShiftHandoverModal alerts={allAlerts} />
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Alert Queue */}
        <AlertQueue
          alerts={allAlerts}
          selectedAlertId={selectedAlertId}
          onSelectAlert={handleSelectAlert}
        />

        {/* CENTER: Map */}
        <div className="relative flex-1 min-w-0">
          <MapContainer
            center={[47, 15]}
            zoom={5}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer url={DARK_TILE} attribution={DARK_ATTR} />
            <MapZoom center={mapCenter} zoom={mapZoom} />
            <MapResizer trigger={resizeTrigger} />

            {/* Route polylines for selected alert's shipment */}
            {routeSegments.map((seg, idx) => (
              <Polyline
                key={`route-seg-${idx}`}
                positions={seg.positions}
                pathOptions={
                  seg.mode === "sea"
                    ? { color: "#60A5FA", weight: 3, opacity: 0.7, dashArray: "4 8 4 8" }
                    : { color: "#60A5FA", weight: 3, opacity: 0.65, dashArray: "8 6" }
                }
              />
            ))}

            {/* All shipment markers (dimmed) */}
            {mappableShipments.map((shipment) => {
              const color = getMarkerColor(shipment);
              const pos = shipmentPositions.get(shipment.id)!;
              const isAlertShipment = shipment.id === selectedShipment?.id;

              return (
                <CircleMarker
                  key={shipment.id}
                  center={pos}
                  radius={isAlertShipment ? 0 : 5}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: selectedAlertId ? (isAlertShipment ? 0 : 0.2) : 0.6,
                    weight: 1.5,
                    opacity: selectedAlertId ? 0.3 : 0.8,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    <div style={{ fontFamily: "system-ui", fontSize: 11, fontWeight: 500 }}>
                      {shipment.id}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {/* Pulsing red marker at alert location */}
            {selectedAlert && (
              <Marker
                position={[selectedAlert.location.lat, selectedAlert.location.lng]}
                icon={createPulsingIcon()}
              >
                <Tooltip direction="top" offset={[0, -16]} permanent>
                  <div style={{ fontFamily: "system-ui", fontSize: 11 }}>
                    <div style={{ fontWeight: 700, color: "#EF4444" }}>{selectedAlert.title.split("—")[0].trim()}</div>
                    <div style={{ fontSize: 10, color: "#6B7280" }}>{selectedAlert.locationName}</div>
                  </div>
                </Tooltip>
              </Marker>
            )}

            {/* Shipment current position (green vehicle marker) — shown when different from alert location */}
            {selectedAlert && selectedShipment && (() => {
              const shipPos = shipmentPositions.get(selectedShipment.id);
              if (!shipPos) return null;
              const alertPos: [number, number] = [selectedAlert.location.lat, selectedAlert.location.lng];
              const dist = haversine(shipPos, alertPos);
              if (dist < 2) return null; // less than 2km apart, skip (same location)
              return (
                <Marker
                  position={shipPos}
                  icon={createVehicleIcon()}
                >
                  <Tooltip direction="top" offset={[0, -14]} permanent>
                    <div style={{ fontFamily: "system-ui", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: "#22C55E" }}>Current Position</div>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>{selectedShipment.id} · {selectedShipment.progressPercent}%</div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })()}

            {/* Field response unit (blue dot) */}
            {selectedFieldResponse?.currentPosition && (
              <>
                <Marker
                  position={[
                    selectedFieldResponse.currentPosition.lat,
                    selectedFieldResponse.currentPosition.lng,
                  ]}
                  icon={createFieldUnitIcon()}
                >
                  <Tooltip direction="top" offset={[0, -14]} permanent>
                    <div style={{ fontFamily: "system-ui", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: "#3B82F6" }}>
                        {selectedFieldResponse.unitCallsign}
                      </div>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>
                        ETA: {selectedFieldResponse.etaMinutes}min
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
                {/* ETA line from field unit to alert */}
                {selectedAlert && (
                  <Polyline
                    positions={[
                      [selectedFieldResponse.currentPosition.lat, selectedFieldResponse.currentPosition.lng],
                      [selectedAlert.location.lat, selectedAlert.location.lng],
                    ]}
                    pathOptions={{
                      color: "#3B82F6",
                      weight: 2,
                      opacity: 0.6,
                      dashArray: "6 4",
                    }}
                  />
                )}
              </>
            )}

            {/* Origin & Destination markers for selected route */}
            {selectedRoute && (() => {
              const origin = selectedRoute.waypoints.find(wp => wp.type === "origin");
              const dest = selectedRoute.waypoints.find(wp => wp.type === "destination");
              return (
                <>
                  {origin && (
                    <Marker
                      position={[origin.location.lat, origin.location.lng]}
                      icon={L.divIcon({
                        className: "",
                        html: `<div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:system-ui;border:2px solid #1E3A5F">A</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                      })}
                    >
                      <Tooltip direction="top" offset={[0, -12]}>
                        <div style={{ fontFamily: "system-ui", fontSize: 11 }}>
                          <div style={{ fontWeight: 600 }}>{origin.name}</div>
                          <div style={{ color: "#6B7280", fontSize: 10 }}>Origin</div>
                        </div>
                      </Tooltip>
                    </Marker>
                  )}
                  {dest && (
                    <Marker
                      position={[dest.location.lat, dest.location.lng]}
                      icon={L.divIcon({
                        className: "",
                        html: `<div style="width:20px;height:20px;border-radius:50%;background:#EF4444;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:system-ui;border:2px solid #7F1D1D">B</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                      })}
                    >
                      <Tooltip direction="top" offset={[0, -12]}>
                        <div style={{ fontFamily: "system-ui", fontSize: 11 }}>
                          <div style={{ fontWeight: 600 }}>{dest.name}</div>
                          <div style={{ color: "#6B7280", fontSize: 10 }}>Destination</div>
                        </div>
                      </Tooltip>
                    </Marker>
                  )}
                </>
              );
            })()}
          </MapContainer>

          {/* Legend (minimal for SOC) */}
          <div
            className="absolute bottom-4 left-4 z-[1000] rounded shadow-md px-3 py-2 text-[10px] space-y-1"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid #1E293B", color: "#94A3B8" }}
          >
            <div className="font-semibold text-[11px] mb-1 text-slate-300">SOC Legend</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#22C55E" }} />
              On Schedule
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#EAB308" }} />
              At Risk / Delayed
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#EF4444" }} />
              Active Alerts
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444", boxShadow: "0 0 6px rgba(239,68,68,0.6)" }} />
              Incident Location
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#22C55E", border: "1px solid #fff" }} />
              Vehicle Position
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
              Field Unit
            </div>
          </div>

          <SimulationBar
            status={simulation.status}
            onStart={simulation.start}
            onPause={simulation.pause}
            onReset={simulation.reset}
            onSetSpeed={simulation.setSpeed}
            alertCount={simulation.simulationAlerts.length}
            isDark={true}
          />
        </div>

        {/* RIGHT: Playbook & Dispatch */}
        <PlaybookPanel
          alert={selectedAlert}
          playbook={selectedPlaybook}
          fieldResponse={selectedFieldResponse}
        />
      </div>
    </div>
  );
}
