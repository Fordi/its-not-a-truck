// Advanced palette tools — not used by the game directly.
// Imports the core primitives from generatePalette.mjs.

import { deltaE2000, deltaE76, lerpLab, rgbToLab } from './generatePalette.mjs';

// ── Geodesic interpolation ────────────────────────────────────────────────────

// Numerical central-difference gradient of ΔE(prev,p)+ΔE(p,next) w.r.t. p
function arcLenGrad(prev, p, next, h = 1e-5) {
  return [0, 1, 2].map(d => {
    const p1 = [...p]; p1[d] += h;
    const p0 = [...p]; p0[d] -= h;
    return (deltaE2000(prev, p1) + deltaE2000(p1, next)
      - deltaE2000(prev, p0) - deltaE2000(p0, next)) / (2 * h);
  });
}

// Redistribute path points to uniform ΔE2000 arc-length spacing.
// Prevents point clustering during descent, which stalls the optimizer.
function reparamPath(path) {
  const n = path.length - 1;
  const cum = [0];
  for (let i = 1; i <= n; i++)
    cum.push(cum[i - 1] + deltaE2000(path[i - 1], path[i]));
  const total = cum[n];
  const result = [path[0]];
  for (let i = 1; i < n; i++) {
    const target = (i / n) * total;
    let lo = 0, hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= target) lo = mid; else hi = mid;
    }
    result.push(lerpLab(path[lo], path[hi], (target - cum[lo]) / (cum[hi] - cum[lo])));
  }
  result.push(path[n]);
  return result;
}

/**
 * Solve the geodesic BVP under ΔE2000: find the path from c1 to c2 that
 * minimizes total perceptual arc length.
 *
 * The variational (Euler–Lagrange) condition at each interior point is that
 * ∇ₚ[ΔE(pᵢ₋₁,pᵢ) + ΔE(pᵢ,pᵢ₊₁)] = 0 — tension from both sides balances.
 * We reach it via gradient descent with normalized steps (fixed Lab displacement
 * per iteration regardless of gradient magnitude, which avoids instability where
 * the ΔE2000 metric is highly anisotropic).
 *
 * @param {number[]} c1         Start color [L, a, b]
 * @param {number[]} c2         End color [L, a, b]
 * @param {number}   n          Path segments; higher = more accurate. Default 64.
 * @param {number}   iterations Gradient descent steps. Default 400.
 * @param {number}   lr         Step size in Lab units per iteration. Default 0.05.
 * @returns {number[][]}        n+1 Lab points along the geodesic.
 */
export function geodesicPath(c1, c2, { n = 64, iterations = 400, lr = 0.05 } = {}) {
  let path = Array.from({ length: n + 1 }, (_, i) => lerpLab(c1, c2, i / n));

  for (let iter = 0; iter < iterations; iter++) {
    // Simultaneous (Jacobi-style) update — all gradients computed before any point moves
    path = path.map((p, i) => {
      if (i === 0 || i === n) return p;
      const g = arcLenGrad(path[i - 1], p, path[i + 1]);
      const norm = Math.hypot(...g);
      return norm < 1e-12 ? p : p.map((v, d) => v - lr * g[d] / norm);
    });

    // Prevent clustering: redistribute to equal arc-length spacing every 20 steps
    if (iter % 20 === 19) path = reparamPath(path);
  }

  return path;
}

/**
 * Returns a lerp(t) function that moves along the ΔE2000 geodesic from c1 to c2,
 * where t ∈ [0,1] maps linearly to perceptual distance.
 *
 * Geodesic is computed once at construction; each query is O(log n).
 *
 * @example
 *   const lerp = makeGeodesicLerp([50, 20, -30], [70, -10, 40]);
 *   const mid = lerp(0.5);  // perceptually equidistant from both ends
 */
export function makeGeodesicLerp(c1, c2, opts = {}) {
  const path = geodesicPath(c1, c2, opts);
  const n = path.length - 1;
  const cum = [0];
  for (let i = 1; i <= n; i++)
    cum.push(cum[i - 1] + deltaE2000(path[i - 1], path[i]));
  const total = cum[n];

  return t => {
    const target = t * total;
    let lo = 0, hi = n;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= target) lo = mid; else hi = mid; }
    return lerpLab(path[lo], path[hi], (target - cum[lo]) / (cum[hi] - cum[lo]));
  };
}

// ── Additional predicates ─────────────────────────────────────────────────────

/**
 * Reject colors with chroma (colorfulness) below `min` or above `max`.
 * Chroma = sqrt(a²+b²). Pure grays have chroma ≈ 0; vivid saturated hues > 80.
 */
export function chromaRange(min = 0, max = 180) {
  return (L, a, b) => {
    const C = Math.sqrt(a * a + b * b);
    return C >= min && C <= max;
  };
}

/**
 * Accept colors within `maxDist` of the quadratic curve that best fits the
 * given color sequence in Lab space.
 *
 * Fits y = At² + Bt + C to each Lab channel by least squares, with t ∈ [0,1]
 * distributed uniformly across the color sequence. Degrades to linear for 2
 * colors. The fitted curve is precomputed at `steps` sample points; a candidate
 * passes if any sample is within `maxDist` of it.
 *
 * Uses deltaE76 (fast Euclidean Lab) for proximity checks by default, since
 * this predicate is called for every Mitchell candidate. Pass deltaE2000 if
 * you need strict perceptual accuracy at the cost of ~10× slower sampling.
 *
 * @param {Array<string|number[]>} colors   Hex strings or [r,g,b] 0–255 arrays, in path order.
 * @param {number}                 maxDist  Distance threshold in metric units.
 * @param {object}                 opts
 * @param {number}                 opts.steps   Curve sample count. Default 128.
 * @param {function}               opts.metric  Distance fn. Default deltaE76.
 *
 * @example
 *   // Tube around the red → orange → yellow arc in Lab
 *   nearQuadraticPath(['#c0392b', '#e67e22', '#f1c40f'], 15)
 */
export function nearQuadraticPath(colors, maxDist, { steps = 128, metric = deltaE76 } = {}) {
  const toLab = c => {
    if (typeof c === 'string') {
      const hex = c.replace('#', '');
      return rgbToLab(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    }
    return rgbToLab(...c);
  };

  const labs = colors.map(toLab);
  const n = labs.length;

  if (n === 0) return () => false;
  if (n === 1) return (L, a, b) => metric([L, a, b], labs[0]) <= maxDist;
  if (n === 2) {
    // Linear: sample the segment directly, no quadratic fit needed
    const curve = Array.from({ length: steps + 1 }, (_, i) => lerpLab(labs[0], labs[1], i / steps));
    return (L, a, b) => { const pt = [L, a, b]; return curve.some(s => metric(pt, s) <= maxDist); };
  }

  // Uniform parameter values t ∈ [0,1] for each input color
  const ts = labs.map((_, i) => i / (n - 1));

  // Fit y = A*t² + B*t + C by least squares via partial-pivot Gaussian elimination.
  // Normal equations: [[Σt⁴, Σt³, Σt²], [Σt³, Σt², Σt], [Σt², Σt, n]] · [A,B,C]' = [Σt²y, Σty, Σy]'
  const fitChannel = ys => {
    let s4 = 0, s3 = 0, s2 = 0, s1 = 0, r2 = 0, r1 = 0, r0 = 0;
    for (let i = 0; i < n; i++) {
      const t = ts[i], t2 = t * t;
      s4 += t2 * t2; s3 += t2 * t; s2 += t2; s1 += t;
      r2 += t2 * ys[i]; r1 += t * ys[i]; r0 += ys[i];
    }
    const M = [[s4, s3, s2, r2], [s3, s2, s1, r1], [s2, s1, n, r0]];
    for (let col = 0; col < 3; col++) {
      let pivot = col;
      for (let row = col + 1; row < 3; row++)
        if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
      [M[col], M[pivot]] = [M[pivot], M[col]];
      for (let row = col + 1; row < 3; row++) {
        const f = M[row][col] / M[col][col];
        for (let j = col; j <= 3; j++) M[row][j] -= f * M[col][j];
      }
    }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
      x[i] = M[i][3];
      for (let j = i + 1; j < 3; j++) x[i] -= M[i][j] * x[j];
      x[i] /= M[i][i];
    }
    return x; // [A, B, C]
  };

  const [AL, BL, CL] = fitChannel(labs.map(l => l[0]));
  const [Aa, Ba, Ca] = fitChannel(labs.map(l => l[1]));
  const [Ab, Bb, Cb] = fitChannel(labs.map(l => l[2]));

  // Precompute curve samples; some() exits on first hit so in-tube candidates are cheap
  const curve = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, t2 = t * t;
    return [AL * t2 + BL * t + CL, Aa * t2 + Ba * t + Ca, Ab * t2 + Bb * t + Cb];
  });

  return (L, a, b) => {
    const pt = [L, a, b];
    return curve.some(s => metric(pt, s) <= maxDist);
  };
}
