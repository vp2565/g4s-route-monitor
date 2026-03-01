"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";

// Hardcoded risk corridor heat points from operational intelligence
// Each entry is [lat, lng, intensity 0-1]
const CORRIDOR_HEAT_POINTS: [number, number, number][] = [
  // Serbian A1 motorway corridor — highest theft risk
  [44.80, 20.47, 0.90], // Belgrade south
  [44.20, 20.90, 0.88],
  [43.70, 21.30, 0.85],
  [43.32, 21.90, 0.87],
  [42.98, 21.94, 0.86], // Nis area

  // N. Macedonia border zone
  [41.90, 21.60, 0.72],
  [41.50, 21.80, 0.70],
  [41.10, 22.50, 0.68],

  // Greek-Bulgarian border
  [41.40, 23.50, 0.65],
  [41.50, 24.30, 0.63],
  [41.70, 25.50, 0.60],

  // German-Polish border
  [52.30, 14.55, 0.45],
  [51.80, 14.70, 0.42],
  [51.20, 15.00, 0.40],

  // Piraeus port area
  [37.95, 23.64, 0.55],
  [37.90, 23.60, 0.52],

  // Strait of Gibraltar approaches
  [36.10, -5.30, 0.48],
  [36.50, -4.00, 0.45],

  // Rotterdam port
  [51.96, 4.12, 0.40],
  [51.90, 4.40, 0.38],

  // Italian A1 corridor
  [41.90, 12.50, 0.50],
  [42.50, 12.30, 0.48],
  [43.30, 11.30, 0.45],

  // French rest stop theft zone (A6/A7)
  [45.70, 4.80, 0.52],
  [44.80, 4.90, 0.50],
  [44.00, 4.70, 0.48],
];

interface RiskHeatmapProps {
  visible: boolean;
}

export function RiskHeatmap({ visible }: RiskHeatmapProps) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Dynamically import leaflet.heat (only when toggled on)
    // leaflet.heat patches L globally, so we import it for side effects
    // then access via the already-imported leaflet reference
    import("leaflet.heat").then(() => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }

      // After import, heatLayer is patched onto the leaflet object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = leaflet as any;
      layerRef.current = L.heatLayer(CORRIDOR_HEAT_POINTS, {
        radius: 35,
        blur: 25,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.2: "#22C55E",
          0.4: "#84CC16",
          0.6: "#EAB308",
          0.8: "#F97316",
          1.0: "#EF4444",
        },
      }).addTo(map);
    });

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [visible, map]);

  return null;
}
