"use client";

import { Polygon, Circle, CircleMarker, Tooltip } from "react-leaflet";
import type { RouteTemplate } from "@/lib/types";

interface GeofenceOverlaysProps {
  route: RouteTemplate | null;
  showNoGoZones: boolean;
  showSafeParking: boolean;
  showCustomerSites: boolean;
}

export function GeofenceOverlays({
  route,
  showNoGoZones,
  showSafeParking,
  showCustomerSites,
}: GeofenceOverlaysProps) {
  if (!route) return null;

  return (
    <>
      {/* No-Go Zones — red semi-transparent polygons */}
      {showNoGoZones &&
        route.noGoZones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.polygon.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: "#EF4444",
              fillColor: "#EF4444",
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "6 4",
            }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{zone.name}</div>
                <div style={{ color: "#6B7280" }}>{zone.reason}</div>
              </div>
            </Tooltip>
          </Polygon>
        ))}

      {/* Safe Parking — green circles */}
      {showSafeParking &&
        route.safeParking.map((sp) => (
          <Circle
            key={sp.id}
            center={[sp.location.lat, sp.location.lng]}
            radius={800}
            pathOptions={{
              color: "#22C55E",
              fillColor: "#22C55E",
              fillOpacity: 0.12,
              weight: 2,
            }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{sp.name}</div>
                <div style={{ color: "#6B7280" }}>
                  Security: {sp.security} | Capacity: {sp.capacity}
                </div>
                {sp.facilities.length > 0 && (
                  <div style={{ color: "#9CA3AF", fontSize: 11 }}>
                    {sp.facilities.join(", ")}
                  </div>
                )}
              </div>
            </Tooltip>
          </Circle>
        ))}

      {/* Customer Sites — blue markers for origin/destination waypoints */}
      {showCustomerSites &&
        route.waypoints
          .filter((wp) => wp.type === "origin" || wp.type === "destination")
          .map((wp, idx) => (
            <CircleMarker
              key={`site-${idx}`}
              center={[wp.location.lat, wp.location.lng]}
              radius={8}
              pathOptions={{
                color: "#3B82F6",
                fillColor: "#3B82F6",
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Tooltip>
                <div style={{ fontFamily: "system-ui", fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{wp.name}</div>
                  <div style={{ color: "#6B7280", fontSize: 11 }}>
                    {wp.type === "origin" ? "Origin" : "Destination"}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
    </>
  );
}
