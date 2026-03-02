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
import type { Alert, RouteTemplate, FieldResponse } from "@/lib/types";

interface AlertDetailMapProps {
  alert: Alert;
  route: RouteTemplate | null;
  fieldResponse: FieldResponse | null;
  isDark: boolean;
}

function FitBounds({ coords, alertPos }: { coords: [number, number][]; alertPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = [...coords, alertPos];
    if (allPoints.length >= 2) {
      const lats = allPoints.map((c) => c[0]);
      const lngs = allPoints.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ],
        { padding: [40, 40] }
      );
    }
  }, [coords, alertPos, map]);
  return null;
}

export function AlertDetailMap({ alert, route, fieldResponse, isDark }: AlertDetailMapProps) {
  const routeCoords: [number, number][] = useMemo(
    () => (route ? route.coordinates.map(([lng, lat]) => [lat, lng]) : []),
    [route]
  );

  const alertPos: [number, number] = [alert.location.lat, alert.location.lng];
  const origin = routeCoords[0];
  const destination = routeCoords[routeCoords.length - 1];

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <MapContainer center={alertPos} zoom={7} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={tileUrl} />
      <FitBounds coords={routeCoords} alertPos={alertPos} />

      {/* Planned route */}
      {routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: "#3B82F6", weight: 3, dashArray: "8,6", opacity: 0.65 }}
        />
      )}

      {/* Origin marker */}
      {origin && (
        <CircleMarker
          center={origin}
          radius={7}
          pathOptions={{ color: "#16A34A", fillColor: "#16A34A", fillOpacity: 0.9, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span style={{ fontSize: 11 }}>A — {route?.waypoints[0]?.name ?? "Origin"}</span>
          </Tooltip>
        </CircleMarker>
      )}

      {/* Destination marker */}
      {destination && (
        <CircleMarker
          center={destination}
          radius={7}
          pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.9, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span style={{ fontSize: 11 }}>
              B — {route?.waypoints[route.waypoints.length - 1]?.name ?? "Destination"}
            </span>
          </Tooltip>
        </CircleMarker>
      )}

      {/* Alert location — pulsing red marker */}
      <CircleMarker
        center={alertPos}
        radius={10}
        pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.7, weight: 3 }}
      >
        <Tooltip permanent direction="top" offset={[0, -12]}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>
            ⚠ {alert.locationName}
          </span>
        </Tooltip>
      </CircleMarker>
      {/* Outer pulse ring */}
      <CircleMarker
        center={alertPos}
        radius={18}
        pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.15, weight: 1 }}
      />

      {/* Field response unit */}
      {fieldResponse?.currentPosition && (
        <>
          <CircleMarker
            center={[fieldResponse.currentPosition.lat, fieldResponse.currentPosition.lng]}
            radius={7}
            pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.9, weight: 2 }}
          >
            <Tooltip permanent direction="right" offset={[10, 0]}>
              <span style={{ fontSize: 10, fontWeight: 600 }}>
                {fieldResponse.unitCallsign} — ETA {fieldResponse.etaMinutes}min
              </span>
            </Tooltip>
          </CircleMarker>
          {/* Dashed line from unit to alert */}
          <Polyline
            positions={[
              [fieldResponse.currentPosition.lat, fieldResponse.currentPosition.lng],
              alertPos,
            ]}
            pathOptions={{ color: "#3B82F6", weight: 2, dashArray: "6,6", opacity: 0.5 }}
          />
        </>
      )}
    </MapContainer>
  );
}
