export function anyOf(...sdfs) {
  return color => Math.min(...sdfs.map(f => f(color)));
}
