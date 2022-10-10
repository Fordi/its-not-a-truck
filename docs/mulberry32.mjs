const mulberry32 = (seed) => {
  let state = seed;
  return () => {
    const a = state += 0x6D2B79F5;
    const b = Math.imul(a ^ a >>> 15, a | 1);
    const c = b ^ (b + Math.imul(b ^ b >>> 7, b | 61));
    return ((c ^ c >>> 14) >>> 0) / 4294967296;
  };
};

export default mulberry32(0xdeadbeef);
