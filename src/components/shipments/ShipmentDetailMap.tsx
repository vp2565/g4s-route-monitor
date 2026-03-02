"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Shipment, RouteTemplate } from "@/lib/types";
import { generateBreadcrumbs } from "@/components/map/breadcrumbUtils";
import { findDeviations } from "@/components/map/deviationUtils";

interface ShipmentDetailMapProps {
  shipment: Shipment;
  route: RouteTemplate;
  isDark: boolean;
  showComparison: boolean;
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length >= 2) {
      const lats = coords.map((c) => c[0]);
      const lngs = coords.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ],
        { padding: [30, 30] }
      );
    }
  }, [coords, map]);
  return null;
}

export function ShipmentDetailMap({
  shipment,
  route,
  isDark,
  showComparison,
}: ShipmentDetailMapProps) {
  // Convert route coords from [lng,lat] to [lat,lng]
  const routeCoords: [number, number][] = useMemo(
    () => route.coordinates.map(([lng, lat]) => [lat, lng]),
    [route]
  );

  // Hash shipment ID to numeric seed
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < shipment.id.length; i++) {
      h = (h * 31 + shipment.id.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }, [shipment.id]);

  // Generate breadcrumbs (actual path)
  const breadcrumbResult = useMemo(() => {
    if (shipment.progressPercent <= 0) return null;
    return generateBreadcrumbs(routeCoords, shipment.progressPercent, seed);
  }, [routeCoords, shipment.progressPercent, seed]);

  const actualPath = useMemo(
    () => breadcrumbResult?.actualPath ?? [],
    [breadcrumbResult]
  );

  // Deviations
  const deviations = useMemo(() => {
    if (!showComparison || actualPath.length === 0) return [];
    return findDeviations(actualPath, routeCoords);
  }, [showComparison, actualPath, routeCoords]);

  const origin = routeCoords[0];
  const destination = routeCoords[routeCoords.length - 1];

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer
      center={[48, 15]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={tileUrl} />
      <FitBounds coords={routeCoords} />

      {/* Planned route */}
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: "#3B82F6",
          weight: 3,
          dashArray: "8,6",
          opacity: 0.7,
        }}
      />

      {/* Actual path (breadcrumbs) */}
      {actualPath.length > 0 && (
        <Polyline
          positions={actualPath}
          pathOptions={{
            color: "#22C55E",
            weight: 3,
            opacity: 0.8,
          }}
        />
      )}

      {/* Deviation markers */}
      {showComparison &&
        deviations.map((d, i) => (
          <CircleMarker
            key={`dev-${i}`}
            center={d.position}
            radius={8}
            pathOptions={{
              color: "#EF4444",
              fillColor: "#EF4444",
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span style={{ fontSize: 10, fontWeight: 600 }}>
                {(d.maxDistance / 1000).toFixed(1)}km off
              </span>
            </Tooltip>
          </CircleMarker>
        ))}

      {/* Origin marker */}
      {origin && (
        <CircleMarker
          center={origin}
          radius={7}
          pathOptions={{
            color: "#16A34A",
            fillColor: "#16A34A",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span style={{ fontSize: 11 }}>A — {shipment.origin}</span>
          </Tooltip>
        </CircleMarker>
      )}

      {/* Destination marker */}
      {destination && (
        <CircleMarker
          center={destination}
          radius={7}
          pathOptions={{
            color: "#EF4444",
            fillColor: "#EF4444",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span style={{ fontSize: 11 }}>B — {shipment.destination}</span>
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
