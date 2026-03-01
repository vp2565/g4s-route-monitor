// ============================================================
// GPS Breadcrumb Simulation
// Generates a "traveled" path along the planned route up to
// progressPercent. Models realistic GPS tracking:
//   - ~15m GPS noise (modern tracker accuracy)
//   - 0-2 deliberate detour segments where the driver took
//     a different road (1.5-3km offset for 5-15% of the route)
// ============================================================

/** Haversine distance between two [lat,lng] points in metres */
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Seeded LCG pseudo-random (deterministic per seed) */
function seededRandom(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Box-Muller gaussian from uniform pair */
function gaussian(u1: number, u2: number): number {
  return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/** Interpolate between two [lat,lng] points at fraction t */
function lerp(
  a: [number, number],
  b: [number, number],
  t: number
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Compute perpendicular offset direction for a path segment */
function perpendicularOffset(
  from: [number, number],
  to: [number, number],
  offsetMetres: number,
  side: 1 | -1
): [number, number] {
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  // Perpendicular: rotate 90 degrees
  const perpLat = -dLng;
  const perpLng = dLat;
  const len = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
  if (len === 0) return [0, 0];
  const degPerMetre = 1 / 111_320;
  const scale = (offsetMetres * degPerMetre * side) / len;
  return [perpLat * scale, perpLng * scale];
}

export interface BreadcrumbResult {
  /** The original planned path, trimmed to the traveled portion */
  plannedPath: [number, number][];
  /** The "actual" path with realistic GPS noise + detours */
  actualPath: [number, number][];
}

interface DetourZone {
  startFraction: number; // 0-1 along the path
  endFraction: number;   // 0-1 along the path
  offsetMetres: number;  // lateral offset
  side: 1 | -1;         // which side of the road
}

/**
 * Generate simulated GPS breadcrumbs along a planned route.
 *
 * @param plannedPath Array of [lat, lng] positions forming the full route
 * @param progressPercent 0–100 indicating how far along the shipment has traveled
 * @param seed Seed for deterministic noise (shipment hash)
 */
export function generateBreadcrumbs(
  plannedPath: [number, number][],
  progressPercent: number,
  seed: number = 42
): BreadcrumbResult {
  if (plannedPath.length < 2 || progressPercent <= 0) {
    return { plannedPath: [], actualPath: [] };
  }

  const rng = seededRandom(seed);

  // 1. Compute cumulative distances along the path
  const cumulDist: number[] = [0];
  for (let i = 1; i < plannedPath.length; i++) {
    cumulDist.push(cumulDist[i - 1] + haversine(plannedPath[i - 1], plannedPath[i]));
  }
  const totalDist = cumulDist[cumulDist.length - 1];
  if (totalDist === 0) return { plannedPath: [], actualPath: [] };

  // 2. Find the cut distance
  const cutDist = totalDist * Math.min(progressPercent, 100) / 100;

  // 3. Collect planned points up to the cut, + interpolated endpoint
  const trimmedPlanned: [number, number][] = [plannedPath[0]];
  for (let i = 1; i < plannedPath.length; i++) {
    if (cumulDist[i] <= cutDist) {
      trimmedPlanned.push(plannedPath[i]);
    } else {
      const segLen = cumulDist[i] - cumulDist[i - 1];
      const remaining = cutDist - cumulDist[i - 1];
      if (segLen > 0) {
        trimmedPlanned.push(lerp(plannedPath[i - 1], plannedPath[i], remaining / segLen));
      }
      break;
    }
  }

  // 4. Generate 0-2 detour zones (deliberate route deviations)
  //    These simulate a driver taking a parallel road due to
  //    construction, traffic, or unforeseen circumstances.
  const numDetours = Math.floor(rng() * 3); // 0, 1, or 2
  const detours: DetourZone[] = [];
  for (let d = 0; d < numDetours; d++) {
    const start = 0.1 + rng() * 0.6; // detour starts between 10%-70% of route
    const length = 0.05 + rng() * 0.10; // lasts 5-15% of route
    const offset = 1500 + rng() * 1500; // 1.5-3km lateral offset
    const side = rng() > 0.5 ? 1 : -1;
    detours.push({
      startFraction: start,
      endFraction: Math.min(start + length, 0.95),
      offsetMetres: offset,
      side: side as 1 | -1,
    });
  }

  // 5. Recompute cumulative distances for trimmed path
  const trimCumul: number[] = [0];
  for (let i = 1; i < trimmedPlanned.length; i++) {
    trimCumul.push(trimCumul[i - 1] + haversine(trimmedPlanned[i - 1], trimmedPlanned[i]));
  }
  const trimTotalDist = trimCumul[trimCumul.length - 1];

  // 6. Build the "actual" path: tiny GPS noise + detour offsets
  const GPS_NOISE_METRES = 15; // realistic modern GPS accuracy
  const degPerMetre = 1 / 111_320;

  const actualPath: [number, number][] = trimmedPlanned.map((pt, idx) => {
    if (idx === 0) return pt; // Start is exact (DDI verified departure)

    const fraction = trimTotalDist > 0 ? trimCumul[idx] / trimTotalDist : 0;

    // Small GPS noise (~15m)
    const noiseLat = gaussian(rng(), rng()) * GPS_NOISE_METRES * degPerMetre;
    const noiseLng =
      gaussian(rng(), rng()) * GPS_NOISE_METRES * degPerMetre /
      Math.cos((pt[0] * Math.PI) / 180);

    // Check if this point falls within a detour zone
    let detourLat = 0;
    let detourLng = 0;
    for (const detour of detours) {
      if (fraction >= detour.startFraction && fraction <= detour.endFraction) {
        // Smooth ramp in/out over 20% of the detour length
        const detourLen = detour.endFraction - detour.startFraction;
        const rampLen = detourLen * 0.2;
        let intensity = 1;
        if (fraction < detour.startFraction + rampLen) {
          intensity = (fraction - detour.startFraction) / rampLen;
        } else if (fraction > detour.endFraction - rampLen) {
          intensity = (detour.endFraction - fraction) / rampLen;
        }

        // Compute perpendicular offset using neighboring points
        const prev = idx > 0 ? trimmedPlanned[idx - 1] : pt;
        const next = idx < trimmedPlanned.length - 1 ? trimmedPlanned[idx + 1] : pt;
        const offset = perpendicularOffset(prev, next, detour.offsetMetres * intensity, detour.side);
        detourLat += offset[0];
        detourLng += offset[1];
      }
    }

    return [
      pt[0] + noiseLat + detourLat,
      pt[1] + noiseLng + detourLng,
    ] as [number, number];
  });

  return { plannedPath: trimmedPlanned, actualPath };
}
