const profileGrid = (grid) => {
  const freqs = {};
  const [tubeHeight, numBalls] = grid.reduce(
    ([h, b], tube) => {
      tube.forEach((ball) => {
        freqs[ball] = (freqs[ball] || 0) + 1;
      });
      return [Math.max(h, tube.length), b + tube.length];
    },
    [0, 0]
  );
  return { tubeHeight, numBalls, freqs };
};

const isTubeSolved = (tube, tubeHeight) => {
  if (tube.length === 0) return undefined;
  if (
    tube.length < tubeHeight ||
    tube.filter((ball) => ball === tube[0]).length !== tubeHeight
  ) {
    return false;
  }
  return true;
};

const isSolved = (grid, tubeHeight) => {
  if (tubeHeight == undefined) {
    tubeHeight = profileGrid(grid).tubeHeight;
  }
  for (const tube of grid) {
    const solved = isTubeSolved(tube, tubeHeight);
    if (solved === false) return false;
  }
  return true;
};

const isMoveValid = (tubeHeight, fromTube, candidateTube) => {
  if (fromTube.length == 0 || candidateTube.length == tubeHeight) return false;
  const numFirstColor = fromTube.filter((b) => fromTube[0] === b).length;
  // tube is full of same colour, don't touch it
  if (numFirstColor === tubeHeight) return false;

  if (candidateTube.length === 0) {
    // source tube all the same colour, so pointless moving to empty tube
    if (numFirstColor == fromTube.length) return false;
    return true;
  }
  const fromCopy = fromTube.slice().reverse();
  const firstColor = fromCopy[0];
  let firstCount = fromCopy.findIndex((a) => a !== firstColor);
  if (firstCount === -1) firstCount = fromCopy.length;
  if (candidateTube[candidateTube.length - 1] !== firstColor) return false;
  if (firstCount + candidateTube.length > tubeHeight) return false;
  return true;
};

const copyGrid = (g) => g.map((t) => t.slice());
const gridToCanonicalString = (grid) =>
  grid
    .map((tube) => tube.join(";"))
    .sort()
    .join("|");
const solveGrid = (
  grid,
  answer = [],
  visitedPositions = new Set(),
  tubeHeight = undefined
) => {
  if (tubeHeight == undefined) {
    tubeHeight = profileGrid(grid).tubeHeight;
  }
  // visitedPositions keeps track of all the states of the grid we have considered
  // to make sure we don't go round in circles
  // canonical (ordered) string representation of the grid means
  // that two grids that differ only by the order of the tubes are
  // considered as the same position
  visitedPositions.add(gridToCanonicalString(grid));
  for (let i = 0; i < grid.length; i++) {
    const tube = grid[i];
    for (let j = 0; j < grid.length; j++) {
      if (i == j) continue;
      const candidateTube = grid[j];
      if (isMoveValid(tubeHeight, tube, candidateTube)) {
        const grid2 = copyGrid(grid);
        const fromCopy = grid2[i].slice().reverse();
        const firstColor = fromCopy[0];
        let firstCount = fromCopy.findIndex((a) => a !== firstColor);
        if (firstCount === -1) firstCount = fromCopy.length;
        grid2[j].push(
          ...grid2[i].splice(grid2[i].length - firstCount, firstCount)
        );
        if (isSolved(grid2, tubeHeight)) {
          answer.push(grid2);
          return true;
        }
        if (!visitedPositions.has(gridToCanonicalString(grid2))) {
          const solved = solveGrid(grid2, answer, visitedPositions, tubeHeight);
          if (solved) {
            answer.push(grid2);
            return true;
          }
        }
      }
    }
  }
  return false;
};

export const nextBestMove = async (grid) => {
  if (isSolved(grid)) {
    throw new Error("Grid is already solved");
  }
  const answer = [];
  const solved = solveGrid(grid, answer);
  if (!solved) {
    throw new Error("No solution could be found!");
  }
  const next = answer[answer.length - 1];
  const ret = [];
  grid.forEach((t, i) => {
    const nt = next[i];
    if (nt.length < t.length) {
      ret[0] = i;
    } else if (nt.length > t.length) {
      ret[1] = i;
    }
  });
  return ret;
};
