import { generatePalette, zoneDistance } from "./generatePalette.mjs";
import { allOf } from "./sdf/allOf.mjs";
import { hueRange } from "./sdf/hueRange.mjs";
import { lightnessRange } from "./sdf/lightnessRange.mjs";
import { not } from "./sdf/not.mjs";
import { sRGB } from "./sdf/sRGB.mjs";
import { theme } from "./sdf/theme.mjs";
import { sortByOctree } from "./sortByOctree.mjs";

export const generateLevelColors = (level, count) => {
  let t = 10;
  let tubes, background;
  while (!tubes && t < 200) {
    try {
      const sdf = allOf(
        sRGB,
        lightnessRange(20, 100),
      );
      const distance = zoneDistance([
        { test: lightnessRange(60, 100), scale: 0.6 },
        { test: lightnessRange(20, 30), scale: 0.6 },
        { test: hueRange(50, 200), scale: 0.4 },
      ]);
      tubes = generatePalette(count, { sdf, distance });
      tubes = sortByOctree(tubes).map(c => c.hex);
      while (!background && t < 200) {
        try {
          background = generatePalette(4, {
            sdf: allOf(
              sRGB,
              lightnessRange(0, 10),
              not(theme(tubes, t >> 1)),
            )
          }).sort((a, b) => {
            return a.Lab[0] - b.Lab[0];
          }).map(c => c.hex);
        } catch (e) {
          t++;
        }
      }
    } catch (e) {
      t++;
    }
  }
  return { tubes, background };
}
