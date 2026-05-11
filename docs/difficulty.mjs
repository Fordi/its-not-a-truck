const params = [];

export const difficulty = ({ cap, col }) =>
  Math.pow(col, 0.6) * Math.pow(cap, 0.4);

for (let col = 3; col <= 36; col++) {
  for (let cap = 3; cap <= 10; cap++) {
    const props = { cap, col };
    props.diff = difficulty(props);
    params.push(props);
  }
}

params.sort((a, b) => {
  return a.diff - b.diff;
});
for (let i = 0; i < params.length; i++) {
  params[i].level = i + 1;
  params[i].extra = 1
  + ((Math.log(params[i].diff) / Math.log(4))|0)
  + ((Math.log(params[i].diff) / Math.log(9.5))|0)
  + ((Math.log(params[i].diff) / Math.log(12))|0)
  + ((Math.log(params[i].diff) / Math.log(13))|0)
}

export default params;
