import { Color } from "../Color.mjs";

export function e2k(c1, c2) {
  const [[L1, a1, b1], [L2, a2, b2]] = [c1, c2].map(Color.normalize).map(c => c.Lab);

  // Step 1: Compute chroma C* in original Lab
  const C1 = Math.sqrt(a1 * a1 + b1 * b1), C2 = Math.sqrt(a2 * a2 + b2 * b2);

  // Step 2: Compute G, a chroma-dependent a' axis scaling factor that corrects for blue-region hue shifts
  // 6103515625 = 25^7; the scaling is anchored so G≈0 for low chroma and G→0.5 for high chroma
  const Cb7 = Math.pow((C1 + C2) / 2, 7), G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + 6103515625)));

  // Step 3: Compute adjusted a' and C' using the scaled a axis
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1), C2p = Math.sqrt(a2p * a2p + b2 * b2);

  // Step 4: Compute hue angles h' in [0, 360); treat achromatic points as 0°
  const h1p = (a1p === 0 && b1 === 0) ? 0 : (Math.atan2(b1, a1p) * 180 / Math.PI + 360) % 360;
  const h2p = (a2p === 0 && b2 === 0) ? 0 : (Math.atan2(b2, a2p) * 180 / Math.PI + 360) % 360;

  // Step 5: Compute deltas ΔL', ΔC', Δh' (hue difference wrapped to [-180, 180])
  const dLp = L2 - L1, dCp = C2p - C1p;
  const dhp = C1p * C2p === 0 ? 0 : Math.abs(h2p - h1p) <= 180 ? h2p - h1p : h2p - h1p > 180 ? h2p - h1p - 360 : h2p - h1p + 360;

  // Step 6: Convert Δh' to ΔH' (Cartesian hue difference, accounting for chroma magnitude)
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  // Step 7: Compute arithmetic means L̄', C̄', and h̄' (hue mean handles wrap-around and achromatic cases)
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  const hbp = C1p * C2p === 0 ? h1p + h2p : Math.abs(h1p - h2p) <= 180 ? (h1p + h2p) / 2 : h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;

  // Step 8: Compute T, an empirical hue-weighting term derived from perceptual data
  const T = 1 - 0.17 * Math.cos((hbp - 30) * Math.PI / 180) + 0.24 * Math.cos(2 * hbp * Math.PI / 180) + 0.32 * Math.cos((3 * hbp + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hbp - 63) * Math.PI / 180);

  // Step 9: Compute perceptual weighting functions SL, SC, SH
  const SL = 1 + 0.015 * Math.pow(Lbp - 50, 2) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  const SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T;

  // Step 10: Compute the rotation term RT, which accounts for the blue-to-purple hue-chroma interaction
  const Cbp7 = Math.pow(Cbp, 7), RC = 2 * Math.sqrt(Cbp7 / (Cbp7 + 6103515625));
  const dth = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  const RT = -Math.sin(2 * dth * Math.PI / 180) * RC;

  // Step 11: Final weighted Euclidean distance with cross-term for chroma/hue interaction
  return Math.sqrt(Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) + Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH));
}
