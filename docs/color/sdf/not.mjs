export function not(fn) {
  return (color) => -fn(color);
}