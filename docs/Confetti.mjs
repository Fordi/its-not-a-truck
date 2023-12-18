const { min, max, random } = Math;

const ConfettiFlake = ({
  color,
  top,
  left,
  angle = [-90, 90],
  onAnimationEnd,
}) => [
  "div",
  {
    className: "confetti-wrap",
    style: {
      top,
      left,
      transform: `rotate(${
        min(...angle) + random() * (max(...angle) - min(...angle))
      }deg)`,
    },
  },
  [
    [
      "div",
      {
        className: "confetti-flake",
        style: {
          color,
        },
        onAnimationEnd: ({ target: { parentNode: self } }) => {
          self.parentNode.removeChild(self);
          if (onAnimationEnd) {
            onAnimationEnd();
          }
        },
      },
      "",
    ],
  ],
];

export default ConfettiFlake;
