"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useAuth } from "@/contexts/auth-context";
import {
  getAllShipments,
  getRouteTemplateById,
} from "@/lib/store";
import type { Shipment } from "@/lib/types";
import { MapFilterBar, type MapFilters } from "./MapFilterBar";
import { ShipmentPopup } from "./ShipmentPopup";
import { MapControls } from "./MapControls";

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
  "usr-002": "cust-001", // Sarah Mitchell → BAT
  "usr-003": "cust-003", // Klaus Weber → TechElectronics
  "usr-005": "cust-002", // Jean-Pierre → PharmaCo
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

// --- Main MapConsole ---

export default function MapConsole() {
  const { user, isDarkTheme } = useAuth();

  // Determine if this user is customer-scoped
  const customerScope = user
    ? USER_CUSTOMER_MAP[user.id] ?? null
    : null;
  const isCustomerScoped =
    user?.role === "customer_admin" || user?.role === "customer_user";

  const [filters, setFilters] = useState<MapFilters>({
    customer: isCustomerScoped && customerScope ? customerScope : "all",
    status: "all",
    mode: "all",
    search: "",
  });

  const [tileLayer, setTileLayer] = useState<"standard" | "dark">(
    isDarkTheme ? "dark" : "standard"
  );
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(
    null
  );
  const [zoomTrigger, setZoomTrigger] = useState(0);

  // Load all shipments
  const allShipments = useMemo(() => getAllShipments(), []);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return allShipments.filter((s) => {
      // Customer scope for customer roles
      if (isCustomerScoped && customerScope && s.customerId !== customerScope)
        return false;

      // Filter dropdowns
      if (filters.customer !== "all" && s.customerId !== filters.customer)
        return false;

      if (filters.status !== "all") {
        if (filters.status === "active") {
          if (
            s.status !== "active" &&
            s.status !== "in_transit" &&
            s.status !== "at_checkpoint"
          )
            return false;
        } else if (s.status !== filters.status) {
          return false;
        }
      }

      if (filters.mode !== "all") {
        if (!s.transportModes.includes(filters.mode as Shipment["transportModes"][number])) return false;
      }

      // Search
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

  // Only shipments with positions can appear on the map
  const mappableShipments = useMemo(
    () => filteredShipments.filter((s) => s.currentPosition),
    [filteredShipments]
  );

  // Positions for zoom-to-fit
  const allPositions: [number, number][] = useMemo(
    () =>
      mappableShipments.map((s) => [
        s.currentPosition!.lat,
        s.currentPosition!.lng,
      ]),
    [mappableShipments]
  );

  // Route polyline for selected shipment — fetched from OSRM for road-snapped paths
  const [selectedRoute, setSelectedRoute] = useState<{
    positions: [number, number][];
    color: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedShipmentId) {
      setSelectedRoute(null);
      return;
    }
    const shipment = allShipments.find((s) => s.id === selectedShipmentId);
    if (!shipment?.routeTemplateId) {
      setSelectedRoute(null);
      return;
    }
    const route = getRouteTemplateById(shipment.routeTemplateId);
    if (!route || route.waypoints.length < 2) {
      setSelectedRoute(null);
      return;
    }

    const color = getMarkerColor(shipment);
    let cancelled = false;

    // Build OSRM coordinate string from waypoints
    const coords = route.waypoints
      .map((wp) => `${wp.location.lng},${wp.location.lat}`)
      .join(";");
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
          const positions: [number, number][] =
            data.routes[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
            );
          setSelectedRoute({ positions, color });
        } else {
          // Fallback to seed data straight lines
          const positions: [number, number][] = route.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );
          setSelectedRoute({ positions, color });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to seed data
        const positions: [number, number][] = route.coordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );
        setSelectedRoute({ positions, color });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedShipmentId, allShipments]);

  const handleToggleLayer = useCallback(() => {
    setTileLayer((prev) => (prev === "standard" ? "dark" : "standard"));
  }, []);

  const handleZoomToFit = useCallback(() => {
    setZoomTrigger((prev) => prev + 1);
  }, []);

  // Summary counts
  const activeCount = mappableShipments.filter(
    (s) =>
      s.status === "active" ||
      s.status === "in_transit" ||
      s.status === "at_checkpoint"
  ).length;
  const alertCount = mappableShipments.reduce(
    (sum, s) => sum + s.alertCount,
    0
  );
  const delayedCount = mappableShipments.filter(
    (s) => s.status === "delayed"
  ).length;

  return (
    <div className="flex flex-col h-full">
      <MapFilterBar
        filters={filters}
        onFilterChange={setFilters}
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

      {/* Map */}
      <div className="relative flex-1">
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

          <ZoomToFitControl
            trigger={zoomTrigger}
            positions={allPositions}
          />

          {/* Route polyline for selected shipment */}
          {selectedRoute && (
            <Polyline
              positions={selectedRoute.positions}
              pathOptions={{
                color: selectedRoute.color,
                weight: 3,
                opacity: 0.5,
                dashArray: "8 6",
              }}
            />
          )}

          {/* Shipment markers */}
          {mappableShipments.map((shipment) => {
            const color = getMarkerColor(shipment);
            const isSelected = shipment.id === selectedShipmentId;

            return (
              <CircleMarker
                key={shipment.id}
                center={[
                  shipment.currentPosition!.lat,
                  shipment.currentPosition!.lng,
                ]}
                radius={isSelected ? 9 : 6}
                pathOptions={{
                  color: isSelected ? "#fff" : color,
                  fillColor: color,
                  fillOpacity: 0.85,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedShipmentId(shipment.id),
                }}
              >
                <Popup
                  eventHandlers={{
                    remove: () => setSelectedShipmentId(null),
                  }}
                >
                  <ShipmentPopup shipment={shipment} />
                </Popup>
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
          <div className="font-semibold text-xs mb-1.5">Shipment Status</div>
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
        </div>

        <MapControls
          isDark={isDarkTheme}
          tileLayer={tileLayer}
          onToggleLayer={handleToggleLayer}
          onZoomToFit={handleZoomToFit}
        />
      </div>
    </div>
  );
}
