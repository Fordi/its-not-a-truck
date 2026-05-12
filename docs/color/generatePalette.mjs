import { Color } from "./Color.mjs";
import { e2k } from "./distance/e2k.mjs";
import { LAB_BOUNDS, sRGB } from "./sdf/sRGB.mjs";

export function lerp(c1, c2) {
  const [a, b] = [c1, c2].map(Color.normalize);
  return t => Color.Lab(
    a.L + t * (b.L - a.L),
    a.a + t * (b.a - a.a),
    a.b + t * (b.b - a.b)
  );
}

// Rough bounding box around the sRGB colorspace

function randomLabPoint() {
  return Color.Lab(
    LAB_BOUNDS[0][0] + Math.random() * (LAB_BOUNDS[0][1] - LAB_BOUNDS[0][0]),
    LAB_BOUNDS[1][0] + Math.random() * (LAB_BOUNDS[1][1] - LAB_BOUNDS[1][0]),
    LAB_BOUNDS[2][0] + Math.random() * (LAB_BOUNDS[2][1] - LAB_BOUNDS[2][0]),
  );
}

/**
 * Generate a palette using Mitchell sampling.
 *
 * @param {number}   count               Colors to generate.
 * @param {number}   candidatesPerPoint  Candidates per point (100–500 recommended).
 * @param {function} sdf                 (L, a, b) => bool — culling predicate. Defaults to sRGB gamut check.
 * @param {function} distance            ([L,a,b], [L,a,b]) => number — spread metric. Defaults to ΔE2000.
 * @param {number}   maxSeeds            How many random candidates to try before giving up on finding a valid seed.
 * @returns {Array<{lab, hex}>}
 */
export function generatePalette(count, {
  sdf = sRGB,
  epsilon = 1e-4,
  distance = e2k,
  maxSeeds = 10_000,
  candidatesPerPoint = 300,
} = {}) {
  const points = [];

  // Seed: first valid point.
  let seed = null;
  for (let i = 0; i < maxSeeds; i++) {
    const c = randomLabPoint();
    if (sdf(c) <= epsilon) { seed = c; break; }
  }
  if (!seed) throw new Error('Could not find a valid seed point — predicate may be too restrictive.');
  points.push(seed);

  while (points.length < count) {
    let best = null, bestDist = -1;

    for (let j = 0; j < candidatesPerPoint; j++) {
      const c = randomLabPoint();
      if (sdf(c) > epsilon) continue;

      // Early-exit: bail as soon as this candidate can't beat the current best.
      let minD = Infinity;
      for (const p of points) {
        const d = distance(c, p);
        if (d < minD) minD = d;
        if (minD <= bestDist) break;
      }

      if (minD > bestDist) { bestDist = minD; best = c; }
    }

    if (best) points.push(best);
  }

  return points;
}

/**
 * Returns a distance function that scales perceived distances when both colors
 * fall within the same zone, causing the Mitchell sampler to spread colors more
 * aggressively there. A scale < 1 makes same-zone colors appear closer than they
 * are — the sampler compensates by searching harder for genuinely distant candidates.
 *
 * Use this as the base for hueZoneDistance and lightnessZoneDistance, or directly
 * with arbitrary zone predicates to combine multiple constraints.
 *
 * @param {Array<{test: (L,a,b)=>bool, scale: number}>} zones
 * @param {function} base  Base metric. Default deltaE2000.
 *
 * @example
 *   // Spread both greens and near-whites in one pass
 *   generatePalette(count, {
 *     distance: zoneDistance([
 *       { test: (L, a, b) => L > 80, scale: 0.3 },
 *       { test: (L, a, b) => Math.abs((((Math.atan2(b,a)*180/Math.PI+360)%360)-130+180)%360-180) < 30, scale: 0.4 },
 *     ])
 *   });
 */
export function zoneDistance(zones, { base = e2k, epsilon = 1e-4 } = {}) {
  const scaleAt = lab => {
    const active = zones.filter(z => z.test(lab));
    return Math.pow(active.reduce((scale, zone) => scale * zone.scale, 1), 1 / active.length);
  };
  const dist = (c1, c2) => {
    const [lab1, lab2] = [c1, c2].map(Color.normalize);
    const d = base(lab1, lab2);
    const z1 = scaleAt(lab1);
    const z2 = scaleAt(lab2);
    if (z1 - z2 < epsilon) {
      return d * z1;
    }
    return z1 * d / 2 + z2 * d / 2;
  };
  return dist;
}
