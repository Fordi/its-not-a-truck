import { Color } from "../Color.mjs";

export function hueRange(minDeg, maxDeg) {
  const wraps = minDeg > maxDeg;
  // Wrapping arc: center jumps 180° around the circle to stay inside the arc
  const center = wraps ? ((minDeg + maxDeg) / 2 + 180) % 360 : (minDeg + maxDeg) / 2;
  const half   = wraps ? (360 - minDeg + maxDeg) / 2        : (maxDeg - minDeg) / 2;

  return (color) => {
    const { h } = Color.normalize(color);
    // Shortest signed angular distance from h to center, in (-180, 180]
    const angDist = ((h - center + 540) % 360) - 180;
    return Math.abs(angDist) - half;
  };
}
