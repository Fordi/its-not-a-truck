import { Color } from "./Color.mjs";
import { LAB_BOUNDS } from "./sdf/sRGB.mjs";

/**
 * Sort a Lab palette by Morton code (Z-order curve) for octree-coherent ordering.
 *
 * Each Lab channel is quantized to 10 bits within the sRGB Lab bounding box, then
 * the bits are interleaved (L→bit 0, a→bit 1, b→bit 2) to form a 30-bit Morton
 * code. Sorting by this code visits octree cells in Z-order, so perceptually
 * similar colors tend to end up adjacent in the result.
 *
 * @param {Array<Color | ColorLike>} palette
 * @returns {Array<Color>}  New sorted array; input is not mutated.
 */
const MAX = (1 << 10) - 1;

// Spread a 10-bit integer into every third bit for Morton interleaving.
// Verified to stay within signed 32-bit range throughout (max result = 0x09249249).
// High bits (b8, b9) are preserved through the un-shifted `n` at each OR step
// rather than the shifted copy, which would overflow 32 bits at step 2.
function spread10(n) {
  n = n & 0x3FF;
  n = (n | (n << 16)) & 0x030000FF; // ---- --98 ---- ---- ---- ---- 7654 3210
  n = (n | (n << 8)) & 0x0300F00F; // ---- --98 ---- ---- 7654 ---- ---- 3210
  n = (n | (n << 4)) & 0x030C30C3; // ---- --98 ---- 76-- --54 ---- 32-- --10
  n = (n | (n << 2)) & 0x09249249; // ---- 9--8 --7- -6-- 5--4 --3- -2-- 1--0
  return n;
}

export function mortonCodeOf(color) {
  const { L, a, b } = Color.normalize(color);
  return [L, a, b].reduce((s, c, i) => s | (spread10(
    (Math.round((c - LAB_BOUNDS[i][0]) / (LAB_BOUNDS[i][1] - LAB_BOUNDS[i][0]) * MAX))
  ) << i), 0);
}

export function sortByOctree(palette) {
  return palette
    .map(Color.normalize)
    .map(p => [p, mortonCodeOf(p)])
    .sort(([, a], [, b]) => a - b)
    .map(([p]) => p);
}
