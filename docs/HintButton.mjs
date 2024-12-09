const SVG = "http://www.w3.org/2000/svg";

const HintButton = ({ size, onClick, remain, title }) => [
  [SVG, "svg"],
  {
    viewBox: "0 0 2000 2000",
    ...(typeof size === 'string' ? { width: size, height: size } : { style: { width: `${size}vw`, maxHeight: `${size}vh` }}),
    xmlns: SVG,
    onClick,
    title,
  },
  [
    [
      [SVG, "path"],
      {
        fill: "currentColor",
        d: "M641 1624c-83 0-162-33-221-92-59-69-91-148-91-231 0-84 32-162 91-211l418-418a249 249 0 0 0 0-353 250 250 0 0 0-426 176H162c0-133 52-259 146-353a511 511 0 0 1 707 0 496 496 0 0 1 0 707l-418 408a62 62 0 1 0 107 44h250c0 83-33 162-92 231-59 59-137 92-221 92zm121 251a125 125 0 1 1-251 0 125 125 0 0 1 251 0z",
      },
    ],
    [[SVG, "circle"], { fill: "#900", cx: "1500", cy: "1500", r: "500" }],
    [
      [SVG, "text"],
      {},
      [
        [
          [SVG, "tspan"],
          {
            fill: "currentColor",
            "font-size": "750",
            "font-family": "sans-serif",
            x: "1525",
            y: "1765",
            "text-align": "center",
            "text-anchor": "middle",
          },
          [remain],
        ],
      ],
    ],
  ],
];

export default HintButton;
