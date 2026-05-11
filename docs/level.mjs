import difficulty from "./difficulty.mjs";

const unsolvable = {
  84: 1,
  87: 1,
  101: 1,
  103: 1,
  104: 1,
  105: 1,
  108: 1,
  109: 1,
  112: 1,
  117: 1,
  124: 1,
  125: 1,
  127: 1,
  128: 1,
  130: 1,
  132: 1,
  134: 1,
};

// let csv = '';
// for (let level = 1; level < 200; level++) {
//   const extra = 
//   2 +
//         (unsolvable[level] ?? 0) +
//         (level > 136 ? 1 : 0) +
//         (level > 175 ? 1 : 0);
//   const cap = difficulty[level].cap;
//   const lnEx = Math.floor(1 + Math.log(Math.pow(level, 1.5)) / Math.log(9));
//   csv += (`${level},${extra},${lnEx}\n`);
// }
console.log([...difficulty.slice(1, 20)]);
