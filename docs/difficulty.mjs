const params = [];

const difficulty = ({ cap, col }) => 
  Math.pow(col, 0.6) * Math.pow(cap, 0.4);


for (let col = 0; col < 1000; col++) {
  for (let cap = 0; cap < 5; cap++) {
    params.push({ col: col + 3, cap: cap + 3 });
  }
}

params.sort((a, b) => {
  return difficulty(a) - difficulty(b);
});

export default params;
