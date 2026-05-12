import { Color } from "../Color.mjs";
import { e2k } from "../distance/e2k.mjs";
import { sortByOctree, mortonCodeOf } from "../sortByOctree.mjs";

export function theme(colors, { limit = 20, distance = e2k, window = 8 } = {}) {
  const sorted = sortByOctree(colors);
  const codes  = sorted.map(mortonCodeOf);

  return (color) => {
    color = Color.normalize(color);
    const code = mortonCodeOf(color);

    // Binary search for insertion point in Morton-sorted theme array
    let lo = 0;
    let hi = codes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (codes[mid] < code) {
        lo = mid + 1; 
      } else {
        hi = mid;
      }
    }

    // Scan window on both sides of insertion point
    let minDist = Infinity;
    const start = Math.max(0, lo - window);
    const end   = Math.min(sorted.length, lo + window);
    for (let i = start; i < end; i++) {
      const d = distance(color, sorted[i]);
      if (d < minDist) minDist = d;
    }

    return minDist - limit;
  };
}
