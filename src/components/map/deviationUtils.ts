// ============================================================
// Deviation Detection
// Compares actual GPS path against planned path and finds
// points where the vehicle deviated beyond a threshold.
// ============================================================

/** Haversine distance in metres */
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

export interface DeviationPoint {
  position: [number, number]; // [lat, lng]
  maxDistance: number; // metres from planned path
}

/**
 * For each actual-path point, find minimum distance to any planned-path point.
 * If > threshold, mark as deviating. Cluster consecutive deviating points
 * and emit the centroid of each cluster.
 *
 * @param actualPath The actual GPS breadcrumb path
 * @param plannedPath The original planned route
 * @param thresholdMetres Distance threshold (default 500m)
 */
export function findDeviations(
  actualPath: [number, number][],
  plannedPath: [number, number][],
  thresholdMetres: number = 500
): DeviationPoint[] {
  if (actualPath.length === 0 || plannedPath.length === 0) return [];

  // For each actual point, find min distance to planned path
  const deviating: { point: [number, number]; dist: number }[] = [];

  for (const actual of actualPath) {
    let minDist = Infinity;
    for (const planned of plannedPath) {
      const d = haversine(actual, planned);
      if (d < minDist) minDist = d;
    }
    if (minDist > thresholdMetres) {
      deviating.push({ point: actual, dist: minDist });
    }
  }

  if (deviating.length === 0) return [];

  // Cluster consecutive deviating points
  const clusters: { points: [number, number][]; maxDist: number }[] = [];
  let currentCluster: { points: [number, number][]; maxDist: number } = {
    points: [deviating[0].point],
    maxDist: deviating[0].dist,
  };

  for (let i = 1; i < deviating.length; i++) {
    const prev = deviating[i - 1].point;
    const curr = deviating[i].point;
    // If points are within 2km, consider them same cluster
    if (haversine(prev, curr) < 2000) {
      currentCluster.points.push(curr);
      currentCluster.maxDist = Math.max(currentCluster.maxDist, deviating[i].dist);
    } else {
      clusters.push(currentCluster);
      currentCluster = {
        points: [curr],
        maxDist: deviating[i].dist,
      };
    }
  }
  clusters.push(currentCluster);

  // Emit centroid of each cluster
  return clusters.map((cluster) => {
    const centroid: [number, number] = [
      cluster.points.reduce((s, p) => s + p[0], 0) / cluster.points.length,
      cluster.points.reduce((s, p) => s + p[1], 0) / cluster.points.length,
    ];
    return {
      position: centroid,
      maxDistance: Math.round(cluster.maxDist),
    };
  });
}
