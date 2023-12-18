export function YouBeatLevelX({ game }) {
  return [
    "div",
    { className: "beat-level" },
    [`You beat level ${game.level}!`],
  ];
}
