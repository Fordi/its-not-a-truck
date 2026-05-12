export function allOf(...sdfs) {
  return color => Math.max(...sdfs.map(f => f(color)));
}
