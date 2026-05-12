import { Color } from "../Color.mjs";

export const LAB_BOUNDS = [[0, 100], [-87, 99], [-108, 95]];

export function sRGB(color) {
  const q = Color.normalize(color).rgb.map(c => Math.abs(c - 0.5) - 0.5);
  return Math.hypot(...q.map(c => Math.max(c, 0))) + Math.min(Math.max(...q), 0);
}
