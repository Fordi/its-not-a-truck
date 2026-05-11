// Mitchell Best-Candidate Color Sampler — configurable culling edition
// The sampler accepts any predicate (L, a, b) => bool as its validity test.
// Predicate factories at the bottom let you compose constraints cleanly.

// ── Colorspace conversions ────────────────────────────────────────────────────

const D65 = { X: 0.95047, Y: 1.00000, Z: 1.08883 };

function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function labToXyz(L, a, b) {
  const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200;
  const inv = t => t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787;
  return [D65.X * inv(fx), D65.Y * inv(fy), D65.Z * inv(fz)];
}

function xyzToLinearRgb(X, Y, Z) {
  return [
    X *  3.2404542 + Y * -1.5371385 + Z * -0.4985314,
    X * -0.9692660 + Y *  1.8760108 + Z *  0.0415560,
    X *  0.0556434 + Y * -0.2040259 + Z *  1.0572252,
  ];
}

function xyzToLab(X, Y, Z) {
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [
    116 * f(Y / D65.Y) - 16,
    500 * (f(X / D65.X) - f(Y / D65.Y)),
    200 * (f(Y / D65.Y) - f(Z / D65.Z)),
  ];
}

function rgbToLab(r, g, b) {
  const lr = srgbToLinear(r / 255), lg = srgbToLinear(g / 255), lb = srgbToLinear(b / 255);
  const X = lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375;
  const Y = lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750;
  const Z = lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041;
  return xyzToLab(X, Y, Z);
}

export function labToRgb255(L, a, b) {
  const [X, Y, Z] = labToXyz(L, a, b);
  const [lr, lg, lb] = xyzToLinearRgb(X, Y, Z);
  return [
    Math.round(Math.min(255, Math.max(0, linearToSrgb(lr) * 255))),
    Math.round(Math.min(255, Math.max(0, linearToSrgb(lg) * 255))),
    Math.round(Math.min(255, Math.max(0, linearToSrgb(lb) * 255))),
  ];
}

export function labToHex(L, a, b) {
  const [r, g, bv] = labToRgb255(L, a, b);
  return '#' + [r, g, bv].map(c => c.toString(16).padStart(2, '0')).join('');
}

// ── Distance metrics ──────────────────────────────────────────────────────────

export function deltaE76(lab1, lab2) {
  const dL = lab1[0] - lab2[0], da = lab1[1] - lab2[1], db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
  const C1 = Math.sqrt(a1*a1+b1*b1), C2 = Math.sqrt(a2*a2+b2*b2);
  const Cb7 = Math.pow((C1+C2)/2, 7), G = 0.5*(1-Math.sqrt(Cb7/(Cb7+6103515625)));
  const a1p=a1*(1+G), a2p=a2*(1+G);
  const C1p=Math.sqrt(a1p*a1p+b1*b1), C2p=Math.sqrt(a2p*a2p+b2*b2);
  const h1p=(a1p===0&&b1===0)?0:(Math.atan2(b1,a1p)*180/Math.PI+360)%360;
  const h2p=(a2p===0&&b2===0)?0:(Math.atan2(b2,a2p)*180/Math.PI+360)%360;
  const dLp=L2-L1, dCp=C2p-C1p;
  const dhp=C1p*C2p===0?0:Math.abs(h2p-h1p)<=180?h2p-h1p:h2p-h1p>180?h2p-h1p-360:h2p-h1p+360;
  const dHp=2*Math.sqrt(C1p*C2p)*Math.sin(dhp*Math.PI/360);
  const Lbp=(L1+L2)/2, Cbp=(C1p+C2p)/2;
  const hbp=C1p*C2p===0?h1p+h2p:Math.abs(h1p-h2p)<=180?(h1p+h2p)/2:h1p+h2p<360?(h1p+h2p+360)/2:(h1p+h2p-360)/2;
  const T=1-0.17*Math.cos((hbp-30)*Math.PI/180)+0.24*Math.cos(2*hbp*Math.PI/180)+0.32*Math.cos((3*hbp+6)*Math.PI/180)-0.20*Math.cos((4*hbp-63)*Math.PI/180);
  const SL=1+0.015*Math.pow(Lbp-50,2)/Math.sqrt(20+Math.pow(Lbp-50,2));
  const SC=1+0.045*Cbp, SH=1+0.015*Cbp*T;
  const Cbp7=Math.pow(Cbp,7), RC=2*Math.sqrt(Cbp7/(Cbp7+6103515625));
  const dth=30*Math.exp(-Math.pow((hbp-275)/25,2));
  const RT=-Math.sin(2*dth*Math.PI/180)*RC;
  return Math.sqrt(Math.pow(dLp/SL,2)+Math.pow(dCp/SC,2)+Math.pow(dHp/SH,2)+RT*(dCp/SC)*(dHp/SH));
}

// ── Core sampler ──────────────────────────────────────────────────────────────

const LAB_BOUNDS = { L: [0, 100], a: [-87, 99], b: [-108, 95] };

function randomLabPoint() {
  return [
    LAB_BOUNDS.L[0] + Math.random() * (LAB_BOUNDS.L[1] - LAB_BOUNDS.L[0]),
    LAB_BOUNDS.a[0] + Math.random() * (LAB_BOUNDS.a[1] - LAB_BOUNDS.a[0]),
    LAB_BOUNDS.b[0] + Math.random() * (LAB_BOUNDS.b[1] - LAB_BOUNDS.b[0]),
  ];
}

/**
 * Mitchell best-candidate sampler.
 *
 * @param {number}   N          Colors to generate.
 * @param {number}   k          Candidates per point (100–500 recommended).
 * @param {object}   opts
 * @param {function} opts.valid      (L, a, b) => bool  — culling predicate.
 *                                   Defaults to sRGB gamut check.
 * @param {function} opts.distance   ([L,a,b], [L,a,b]) => number  — spread metric.
 *                                   Defaults to ΔE76 (fast Euclidean Lab).
 * @param {number}   opts.maxSeeds   How many random candidates to try before
 *                                   giving up on finding a valid seed. Default 10000.
 * @returns {Array<{lab, hex, rgb}>}
 */
export function mitchellSample(N, k = 200, {
  valid    = inSrgbGamut,
  distance = deltaE76,
  maxSeeds = 10_000,
} = {}) {
  const points = [];

  // Seed: first valid point.
  let seed = null;
  for (let i = 0; i < maxSeeds; i++) {
    const c = randomLabPoint();
    if (valid(...c)) { seed = c; break; }
  }
  if (!seed) throw new Error('Could not find a valid seed point — predicate may be too restrictive.');
  points.push(seed);

  while (points.length < N) {
    let best = null, bestDist = -1;

    for (let j = 0; j < k; j++) {
      const c = randomLabPoint();
      if (!valid(...c)) continue;

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

  return points.map(([L, a, b]) => ({
    lab: [L, a, b],
    hex: labToHex(L, a, b),
    rgb: labToRgb255(L, a, b),
  }));
}

// ── Built-in predicates ───────────────────────────────────────────────────────

/** Accept any color that maps cleanly to sRGB. */
export function inSrgbGamut(L, a, b, epsilon = 1e-4) {
  const [X, Y, Z] = labToXyz(L, a, b);
  const [r, g, bv] = xyzToLinearRgb(X, Y, Z);
  return r >= -epsilon && r <= 1 + epsilon
      && g >= -epsilon && g <= 1 + epsilon
      && bv >= -epsilon && bv <= 1 + epsilon;
}

// ── Predicate factories ───────────────────────────────────────────────────────

/**
 * Combine multiple predicates with AND — all must pass.
 *
 * @example
 *   allOf(inSrgbGamut, minLightness(30), maxLightness(80))
 */
export function allOf(...predicates) {
  return (L, a, b) => predicates.every(p => p(L, a, b));
}

/**
 * Combine multiple predicates with OR — at least one must pass.
 *
 * @example
 *   anyOf(nearTheme(redLab, 20), nearTheme(blueLab, 20))
 */
export function anyOf(...predicates) {
  return (L, a, b) => predicates.some(p => p(L, a, b));
}

/**
 * Reject colors darker than `min` or lighter than `max`.
 * L* runs 0 (black) → 100 (white).
 */
export function lightnessRange(min = 0, max = 100) {
  return (L) => L >= min && L <= max;
}

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
 * Accept only colors within `maxDist` of at least one theme color.
 * Theme colors can be supplied as hex strings or [r,g,b] arrays.
 *
 * @param {Array<string|number[]>} themeColors  e.g. ['#c0392b', '#2980b9']
 * @param {number}                 maxDist      ΔE76 units. ~20 = same family, ~40 = broad range.
 * @param {function}               [metric]     distance fn, defaults to deltaE76
 *
 * @example
 *   nearThemeColors(['#e74c3c', '#e67e22', '#f1c40f'], 30)  // warm palette
 */
export function nearThemeColors(themeColors, maxDist, metric = deltaE76) {
  const themeLabs = themeColors.map(c => {
    if (typeof c === 'string') {
      const hex = c.replace('#', '');
      const r = parseInt(hex.slice(0,2), 16);
      const g = parseInt(hex.slice(2,4), 16);
      const b = parseInt(hex.slice(4,6), 16);
      return rgbToLab(r, g, b);
    }
    return rgbToLab(...c);  // assume [r, g, b] 0–255
  });

  return (L, a, b) => {
    const pt = [L, a, b];
    return themeLabs.some(theme => metric(pt, theme) <= maxDist);
  };
}

/**
 * Accept only colors whose hue angle falls within a range.
 * Hue is computed from a* and b*; angle in degrees [0, 360).
 * Reds ≈ 0/360, Yellows ≈ 60, Greens ≈ 130, Cyans ≈ 200, Blues ≈ 265, Magentas ≈ 320.
 *
 * @param {number} minDeg
 * @param {number} maxDeg  Can wrap around (e.g. 330→30 for reds).
 *
 * @example
 *   hueRange(30, 90)   // yellows and yellow-greens
 *   hueRange(330, 30)  // reds, wraps through 0°
 */
export function hueRange(minDeg, maxDeg) {
  return (L, a, b) => {
    const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
    if (minDeg <= maxDeg) return h >= minDeg && h <= maxDeg;
    return h >= minDeg || h <= maxDeg;  // wraps through 0°
  };
}

/**
 * Exclude colors within `minDist` of any exclusion zone color.
 * Useful for avoiding skin tones, neons, brand colors, etc.
 *
 * @param {Array<string|number[]>} excludeColors
 * @param {number}                 minDist   ΔE76 units below which to reject.
 * @param {function}               [metric]
 */
export function notNearColors(excludeColors, minDist, metric = deltaE76) {
  const excludeLabs = excludeColors.map(c => {
    if (typeof c === 'string') {
      const hex = c.replace('#', '');
      return rgbToLab(parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16));
    }
    return rgbToLab(...c);
  });

  return (L, a, b) => {
    const pt = [L, a, b];
    return excludeLabs.every(ex => metric(pt, ex) > minDist);
  };
}

// // ── Usage examples ────────────────────────────────────────────────────────────

// // 1. Default: spread evenly across the whole sRGB gamut.
// const palette1 = mitchellSample(16, 200);

// // 2. Muted mid-tones only (no near-black, near-white, or overly vivid).
// const palette2 = mitchellSample(16, 200, {
//   valid: allOf(inSrgbGamut, lightnessRange(30, 75), chromaRange(10, 55)),
// });

// // 3. Colors thematically near a brand palette, but still spread out within that range.
// const brandColors = ['#003f5c', '#bc5090', '#ffa600'];
// const palette3 = mitchellSample(16, 200, {
//   valid: allOf(inSrgbGamut, nearThemeColors(brandColors, 35)),
// });

// // 4. Warm hues (reds through yellows) at medium-high lightness.
// const palette4 = mitchellSample(16, 200, {
//   valid: allOf(inSrgbGamut, hueRange(330, 90), lightnessRange(40, 85)),
// });

// // 5. Full gamut but avoid anything too close to a sickly olive-green.
// const palette5 = mitchellSample(16, 200, {
//   valid: allOf(inSrgbGamut, notNearColors(['#808000'], 25)),
// });

// // 6. Use ΔE2000 as the spread metric for subtler perceptual uniformity.
// const palette6 = mitchellSample(16, 200, {
//   valid: allOf(inSrgbGamut, lightnessRange(20, 80)),
//   distance: deltaE2000,
// });

// // 7. Compose freely — warm, vivid, mid-lightness, not near orange.
// const palette7 = mitchellSample(16, 300, {
//   valid: allOf(
//     inSrgbGamut,
//     hueRange(330, 60),
//     chromaRange(40, 120),
//     lightnessRange(35, 75),
//     notNearColors(['#ff6600'], 15),
//   ),
// });
