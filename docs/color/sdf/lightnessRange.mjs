import { Color } from "../Color.mjs";

export function lightnessRange(min = 0, max = 100) {
  const center = (min + max) / 2;
  const half = (max - min) / 2;
  return (color) => {
    const q = Math.abs(Color.normalize(color).L - center) - half;
    return Math.max(q, 0) + Math.min(q, 0);
  };
}
