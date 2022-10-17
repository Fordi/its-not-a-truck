import COLORS from "./COLORS.mjs";

const params = [];

export const difficulty = ({ cap, col }) => 
  Math.pow(col, 0.6) * Math.pow(cap, 0.4);

for (let col = 0; col <= (COLORS.length - 3); col++) {
  for (let cap = 0; cap <= 7; cap++) {
    const props = { cap: cap + 3, col: col + 3 };
    props.diff = difficulty(props);
    params.push(props);
  }
}

params.sort((a, b) => {
  return a.diff - b.diff;
});

export default params;
