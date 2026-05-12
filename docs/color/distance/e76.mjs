import { Color } from "../Color.mjs";

export function e76(c1, c2) {
  const [lab1, lab2] = [c1, c2].map(Color.normalize).map(c => c.Lab);
  return Math.hypot(...lab1.Lab.map((c, i) => c - lab2.Lab[i]));
}