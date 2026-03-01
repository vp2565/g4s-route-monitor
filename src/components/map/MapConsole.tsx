"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useAuth } from "@/contexts/auth-context";
import {
  getAllShipments,
  getRouteTemplateById,
  getAlertsByShipmentId,
  getDevicesByShipmentId,
  getAuditEntriesByEntityId,
} from "@/lib/store";
import type { Shipment } from "@/lib/types";
import { MapFilterBar, type MapFilters, type GeofenceFilters } from "./MapFilterBar";
import { MapControls } from "./MapControls";
import { ShipmentSidePanel } from "./ShipmentSidePanel";
import { GeofenceOverlays } from "./GeofenceOverlays";
import { RiskHeatmap } from "./RiskHeatmap";
import { generateBreadcrumbs } from "./breadcrumbUtils";
import { findDeviations } from "./deviationUtils";

// --- Route segment types ---

interface RouteSegment {
  positions: [number, number][];
  mode: "road" | "sea" | "air";
}

// Generate intermediate points along a great circle arc
function greatCircleArc(
  start: [number, number],
  end: [number, number],
  numPoints: number
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(start[0]);
  const lng1 = toRad(start[1]);
  const lat2 = toRad(end[0]);
  const lng2 = toRad(end[1]);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.pow(Math.sin((lng1 - lng2) / 2), 2)
      )
    );

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

// Predefined shipping lane waypoints
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

function generateSeaRoute(start: [number, number], end: [number, number]): [number, number][] {
  const key = getSeaLaneKey(start[0], start[1], end[0], end[1]);
  if (key && SEA_LANE_WAYPOINTS[key]) return SEA_LANE_WAYPOINTS[key];
  return greatCircleArc(start, end, 30);
}

// --- Marker color logic ---

function getMarkerColor(shipment: Shipment): string {
  if (shipment.status === "completed") return "#9CA3AF";
  if (shipment.alertCount > 0) return "#EF4444";
  if (
    shipment.status === "delayed" ||
    shipment.riskLevel === "high" ||
    shipment.riskLevel === "critical"
  )
    return "#EAB308";
  return "#22C55E";
}

// --- Tile URLs ---

const TILES = {
  standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const TILE_ATTR = {
  standard:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
};

// --- Customer ID mapping from DEMO_USERS ---

const USER_CUSTOMER_MAP: Record<string, string> = {
  "usr-002": "cust-001",
  "usr-003": "cust-003",
  "usr-005": "cust-002",
};

// --- ZoomToFit helper component ---

function ZoomToFitControl({
  trigger,
  positions,
}: {
  trigger: number;
  positions: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (trigger > 0 && positions.length > 0) {
      const bounds = L.latLngBounds(
        positions.map(([lat, lng]) => L.latLng(lat, lng))
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [trigger, positions, map]);

  return null;
}

// --- MapClickHandler: close panel on map click ---

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
}

// --- MapResizer: invalidate size when panel opens/closes ---

function MapResizer({ trigger }: { trigger: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 50);
    return () => clearTimeout(timer);
  }, [trigger, map]);

  return null;
}

// --- Main MapConsole ---

export default function MapConsole() {
  const { user, isDarkTheme } = useAuth();

  const customerScope = user ? USER_CUSTOMER_MAP[user.id] ?? null : null;
  const isCustomerScoped =
    user?.role === "customer_admin" || user?.role === "customer_user";

  const [filters, setFilters] = useState<MapFilters>({
    customer: isCustomerScoped && customerScope ? customerScope : "all",
    status: "all",
    mode: "all",
    search: "",
  });

  const [geofenceFilters, setGeofenceFilters] = useState<GeofenceFilters>({
    showNoGoZones: false,
    showSafeParking: false,
    showCustomerSites: false,
    showHeatmap: false,
  });

  const [tileLayer, setTileLayer] = useState<"standard" | "dark">(
    isDarkTheme ? "dark" : "standard"
  );
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(0);

  // Load all shipments
  const allShipments = useMemo(() => getAllShipments(), []);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return allShipments.filter((s) => {
      if (isCustomerScoped && customerScope && s.customerId !== customerScope)
        return false;
      if (filters.customer !== "all" && s.customerId !== filters.customer)
        return false;
      if (filters.status !== "all") {
        if (filters.status === "active") {
          if (s.status !== "active" && s.status !== "in_transit" && s.status !== "at_checkpoint")
            return false;
        } else if (s.status !== filters.status) {
          return false;
        }
      }
      if (filters.mode !== "all") {
        if (!s.transportModes.includes(filters.mode as Shipment["transportModes"][number])) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !s.id.toLowerCase().includes(q) &&
          !s.vehiclePlate.toLowerCase().includes(q) &&
          !s.origin.toLowerCase().includes(q) &&
          !s.destination.toLowerCase().includes(q) &&
          !s.driverName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [allShipments, filters, isCustomerScoped, customerScope]);

  const mappableShipments = useMemo(
    () => filteredShipments.filter((s) => s.currentPosition),
    [filteredShipments]
  );

  const allPositions: [number, number][] = useMemo(
    () => mappableShipments.map((s) => [s.currentPosition!.lat, s.currentPosition!.lng]),
    [mappableShipments]
  );

  // Selected shipment data
  const selectedShipment = useMemo(
    () => (selectedShipmentId ? allShipments.find((s) => s.id === selectedShipmentId) ?? null : null),
    [selectedShipmentId, allShipments]
  );

  const selectedRoute = useMemo(
    () => (selectedShipment?.routeTemplateId ? getRouteTemplateById(selectedShipment.routeTemplateId) ?? null : null),
    [selectedShipment]
  );

  const selectedAlerts = useMemo(
    () => (selectedShipmentId ? getAlertsByShipmentId(selectedShipmentId) : []),
    [selectedShipmentId]
  );

  const selectedDevices = useMemo(
    () => (selectedShipmentId ? getDevicesByShipmentId(selectedShipmentId) : []),
    [selectedShipmentId]
  );

  const selectedAuditEntries = useMemo(
    () => (selectedShipmentId ? getAuditEntriesByEntityId(selectedShipmentId) : []),
    [selectedShipmentId]
  );

  // Route segments for selected shipment
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);

  useEffect(() => {
    if (!selectedShipmentId) {
      setRouteSegments([]);
      return;
    }
    const shipment = allShipments.find((s) => s.id === selectedShipmentId);
    if (!shipment?.routeTemplateId) {
      setRouteSegments([]);
      return;
    }
    const route = getRouteTemplateById(shipment.routeTemplateId);
    if (!route || route.waypoints.length < 2) {
      setRouteSegments([]);
      return;
    }

    let cancelled = false;

    const wps = route.waypoints;
    const isMultimodal = route.transportModes.length > 1;

    if (!isMultimodal) {
      const coords = wps.map((wp) => `${wp.location.lng},${wp.location.lat}`).join(";");
      fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
      )
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
            const positions: [number, number][] =
              data.routes[0].geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
              );
            setRouteSegments([{ positions, mode: "road" }]);
          }
        })
        .catch(() => {
          if (cancelled) return;
          const positions: [number, number][] = route.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );
          setRouteSegments([{ positions, mode: "road" }]);
        });
    } else {
      const landGroups: { start: number; end: number }[] = [];
      const seaSegments: { from: [number, number]; to: [number, number] }[] = [];
      let i = 0;
      let landStart = 0;

      while (i < wps.length) {
        if (wps[i].type === "port") {
          if (landStart < i) {
            landGroups.push({ start: landStart, end: i });
          }
          if (i + 1 < wps.length && wps[i + 1].type === "port") {
            seaSegments.push({
              from: [wps[i].location.lat, wps[i].location.lng],
              to: [wps[i + 1].location.lat, wps[i + 1].location.lng],
            });
            i += 2;
            landStart = i - 1;
          } else {
            i++;
            landStart = i;
          }
        } else {
          i++;
        }
      }
      if (landStart < wps.length - 1) {
        landGroups.push({ start: landStart, end: wps.length - 1 });
      }

      const segments: RouteSegment[] = [];

      for (const seg of seaSegments) {
        segments.push({
          positions: generateSeaRoute(seg.from, seg.to),
          mode: "sea",
        });
      }

      const landPromises = landGroups.map(async (group) => {
        const groupWps = wps.slice(group.start, group.end + 1);
        if (groupWps.length < 2) return null;
        const coords = groupWps.map((wp) => `${wp.location.lng},${wp.location.lat}`).join(";");
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
            return {
              positions: data.routes[0].geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
              ),
              mode: "road" as const,
            };
          }
        } catch {
          // ignore
        }
        return {
          positions: groupWps.map(
            (wp) => [wp.location.lat, wp.location.lng] as [number, number]
          ),
          mode: "road" as const,
        };
      });

      Promise.all(landPromises).then((landResults) => {
        if (cancelled) return;
        for (const r of landResults) {
          if (r) segments.push(r);
        }
        setRouteSegments(segments);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [selectedShipmentId, allShipments]);

  // Breadcrumbs: generate from ALL segments in order (road + sea + air)
  // so that progress % maps correctly across the full multimodal journey
  const breadcrumbResult = useMemo(() => {
    if (!selectedShipment || selectedShipment.progressPercent <= 0) return null;
    if (routeSegments.length === 0) return null;

    // Concatenate all segment positions into one continuous path
    const fullPath: [number, number][] = [];
    for (const seg of routeSegments) {
      for (const pos of seg.positions) {
        fullPath.push(pos);
      }
    }

    if (fullPath.length < 2) return null;

    // Hash shipment ID for seed
    let seed = 0;
    for (let i = 0; i < selectedShipment.id.length; i++) {
      seed = ((seed << 5) - seed + selectedShipment.id.charCodeAt(i)) | 0;
    }

    return generateBreadcrumbs(fullPath, selectedShipment.progressPercent, Math.abs(seed));
  }, [selectedShipment, routeSegments]);

  // Deviations from breadcrumbs
  const deviations = useMemo(() => {
    if (!breadcrumbResult || breadcrumbResult.actualPath.length === 0) return [];
    return findDeviations(breadcrumbResult.actualPath, breadcrumbResult.plannedPath);
  }, [breadcrumbResult]);

  const handleToggleLayer = useCallback(() => {
    setTileLayer((prev) => (prev === "standard" ? "dark" : "standard"));
  }, []);

  const handleZoomToFit = useCallback(() => {
    setZoomTrigger((prev) => prev + 1);
  }, []);

  const handleMarkerClick = useCallback((shipmentId: string, e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    setSelectedShipmentId(shipmentId);
    setPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedShipmentId(null);
  }, []);

  const handleMapClick = useCallback(() => {
    if (panelOpen) {
      setPanelOpen(false);
      setSelectedShipmentId(null);
    }
  }, [panelOpen]);

  // Summary counts
  const activeCount = mappableShipments.filter(
    (s) => s.status === "active" || s.status === "in_transit" || s.status === "at_checkpoint"
  ).length;
  const alertCount = mappableShipments.reduce((sum, s) => sum + s.alertCount, 0);
  const delayedCount = mappableShipments.filter((s) => s.status === "delayed").length;

  // Determine which overlays are active for legend
  const hasActiveBreadcrumbs = breadcrumbResult && breadcrumbResult.actualPath.length > 0;
  const hasActiveDeviations = deviations.length > 0;

  return (
    <div className="flex flex-col h-full">
      <MapFilterBar
        filters={filters}
        onFilterChange={setFilters}
        geofenceFilters={geofenceFilters}
        onGeofenceFilterChange={setGeofenceFilters}
        isDark={isDarkTheme}
      />

      {/* Summary strip */}
      <div
        className={`flex items-center gap-4 px-4 py-1.5 text-xs shrink-0 border-b ${
          isDarkTheme
            ? "bg-gray-900/80 border-gray-800 text-gray-400"
            : "bg-white border-gray-200 text-gray-500"
        }`}
      >
        <span>
          <strong className={isDarkTheme ? "text-gray-200" : "text-gray-700"}>
            {mappableShipments.length}
          </strong>{" "}
          shipments on map
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
          {activeCount} active
        </span>
        {delayedCount > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />
            {delayedCount} delayed
          </span>
        )}
        {alertCount > 0 && (
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
            {alertCount} alerts
          </span>
        )}
      </div>

      {/* Map + Side Panel */}
      <div className="flex flex-1 min-h-0">
        {/* Map container */}
        <div className="relative flex-1 min-w-0">
          <MapContainer
            center={[45, 15]}
            zoom={5}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              key={tileLayer}
              url={TILES[tileLayer]}
              attribution={TILE_ATTR[tileLayer]}
            />

            <ZoomToFitControl trigger={zoomTrigger} positions={allPositions} />
            <MapClickHandler onMapClick={handleMapClick} />
            <MapResizer trigger={panelOpen} />

            {/* Route polylines for selected shipment (planned route, dashed) */}
            {routeSegments.map((seg, idx) => (
              <Polyline
                key={`route-seg-${idx}`}
                positions={seg.positions}
                pathOptions={
                  seg.mode === "sea"
                    ? { color: "#3B82F6", weight: 3, opacity: 0.5, dashArray: "4 8 4 8" }
                    : seg.mode === "air"
                      ? { color: "#8B5CF6", weight: 2, opacity: 0.5, dashArray: "12 6" }
                      : { color: "#3B82F6", weight: 3, opacity: 0.4, dashArray: "8 6" }
                }
              />
            ))}

            {/* Origin & Destination markers for selected shipment */}
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
                        html: `<div style="width:24px;height:24px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:system-ui;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)">A</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                      })}
                    >
                      <Tooltip direction="top" offset={[0, -14]}>
                        <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{origin.name}</div>
                          <div style={{ color: "#6B7280", fontSize: 11 }}>Origin</div>
                        </div>
                      </Tooltip>
                    </Marker>
                  )}
                  {dest && (
                    <Marker
                      position={[dest.location.lat, dest.location.lng]}
                      icon={L.divIcon({
                        className: "",
                        html: `<div style="width:24px;height:24px;border-radius:50%;background:#EF4444;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:system-ui;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)">B</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                      })}
                    >
                      <Tooltip direction="top" offset={[0, -14]}>
                        <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{dest.name}</div>
                          <div style={{ color: "#6B7280", fontSize: 11 }}>Destination</div>
                        </div>
                      </Tooltip>
                    </Marker>
                  )}
                </>
              );
            })()}

            {/* Breadcrumb: actual path (solid green) */}
            {breadcrumbResult && breadcrumbResult.actualPath.length > 1 && (
              <Polyline
                positions={breadcrumbResult.actualPath}
                pathOptions={{
                  color: "#22C55E",
                  weight: 4,
                  opacity: 0.85,
                }}
              />
            )}

            {/* Current position marker — at the tip of the actual path */}
            {breadcrumbResult && breadcrumbResult.actualPath.length > 0 && (
              <CircleMarker
                center={breadcrumbResult.actualPath[breadcrumbResult.actualPath.length - 1]}
                radius={8}
                pathOptions={{
                  color: "#fff",
                  fillColor: "#22C55E",
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div style={{ fontFamily: "system-ui", fontSize: 12, fontWeight: 600 }}>
                    Current Position
                  </div>
                </Tooltip>
              </CircleMarker>
            )}

            {/* Deviation markers */}
            {deviations.map((dev, idx) => (
              <CircleMarker
                key={`dev-${idx}`}
                center={dev.position}
                radius={7}
                pathOptions={{
                  color: "#EF4444",
                  fillColor: "#EF4444",
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Tooltip>
                  <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: "#EF4444" }}>Route Deviation</div>
                    <div style={{ color: "#6B7280" }}>{dev.maxDistance}m from planned route</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Geofence overlays */}
            <GeofenceOverlays
              route={selectedRoute}
              showNoGoZones={geofenceFilters.showNoGoZones}
              showSafeParking={geofenceFilters.showSafeParking}
              showCustomerSites={geofenceFilters.showCustomerSites}
            />

            {/* Risk heatmap */}
            <RiskHeatmap visible={geofenceFilters.showHeatmap} />

            {/* Shipment markers */}
            {mappableShipments.map((shipment) => {
              const color = getMarkerColor(shipment);
              const isSelected = shipment.id === selectedShipmentId;

              return (
                <CircleMarker
                  key={shipment.id}
                  center={[shipment.currentPosition!.lat, shipment.currentPosition!.lng]}
                  radius={isSelected ? 9 : 6}
                  pathOptions={{
                    color: isSelected ? "#fff" : color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: (e) => handleMarkerClick(shipment.id, e),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    <div style={{ fontFamily: "system-ui", fontSize: 12, fontWeight: 500 }}>
                      {shipment.id}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div
            className={`absolute bottom-4 left-4 z-[1000] rounded shadow-md border px-3 py-2 text-[11px] space-y-1 ${
              isDarkTheme
                ? "bg-gray-900/90 border-gray-700 text-gray-300"
                : "bg-white/90 border-gray-200 text-gray-600"
            }`}
          >
            <div className="font-semibold text-xs mb-1.5">Markers</div>
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
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#9CA3AF" }} />
              Completed
            </div>
            <div className="font-semibold text-xs mt-2 mb-1">Routes</div>
            <div className="flex items-center gap-2">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 2" /></svg>
              Planned Route
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#3B82F6" strokeWidth="2" strokeDasharray="2 4 2 4" /></svg>
              Sea
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5 3" /></svg>
              Air
            </div>
            {/* Contextual legend entries */}
            {hasActiveBreadcrumbs && (
              <div className="flex items-center gap-2">
                <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#22C55E" strokeWidth="3" /></svg>
                Actual Path
              </div>
            )}
            {hasActiveDeviations && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                Deviation
              </div>
            )}
            {geofenceFilters.showNoGoZones && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 border border-dashed border-red-500 bg-red-500/20" />
                No-Go Zone
              </div>
            )}
            {geofenceFilters.showSafeParking && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full border border-green-500 bg-green-500/20" />
                Safe Parking
              </div>
            )}
          </div>

          <MapControls
            isDark={isDarkTheme}
            tileLayer={tileLayer}
            onToggleLayer={handleToggleLayer}
            onZoomToFit={handleZoomToFit}
          />
        </div>

        {/* Side Panel */}
        {panelOpen && selectedShipment && (
          <ShipmentSidePanel
            shipment={selectedShipment}
            route={selectedRoute}
            alerts={selectedAlerts}
            devices={selectedDevices}
            auditEntries={selectedAuditEntries}
            deviationCount={deviations.length}
            isDark={isDarkTheme}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </div>
  );
}
