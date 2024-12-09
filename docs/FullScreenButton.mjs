const SVG = "http://www.w3.org/2000/svg";

const uid = `fs_${Math.random().toString(36).substring(2)}`;

const FullScreenButton = ({ size, onClick, active, title }) => [
  [SVG, "svg"],
  {
    viewBox: "0 0 512 512",
    xmlns: "http://www.w3.org/2000/svg",
    version: "2",
    ...(typeof size === 'string' ? { width: size, height: size } : { style: { width: `${size}vw`, maxHeight: `${size}vh` }}),
    onClick,
    class: active ? `active` : `inactive`,
    title,
  },
  [
    [
      [SVG, "defs"],
      {},
      [
        [
          [SVG, "style"],
          {},
          [
            `
        use[href="#${uid}"] {
          transition: transform 0.4s;
          transform-origin: 128px 128px;
        }
        .active use[href="#${uid}"] {
          transform: rotate(180deg);
        }
      `,
          ],
        ],
        [
          [SVG, "path"],
          {
            id: uid,
            fill: "currentColor",
            d: "M 195,225 90,120 v 75 h -35 V 55 h 140 L 195,90 h -75 l 105,105 z",
          },
        ],
      ],
    ],
    [
      [SVG, "g"],
      { transform: "rotate(  0, 256, 256)" },
      [[[SVG, "use"], { href: `#${uid}` }]],
    ],
    [
      [SVG, "g"],
      { transform: "rotate( 90, 256, 256)" },
      [[[SVG, "use"], { href: `#${uid}` }]],
    ],
    [
      [SVG, "g"],
      { transform: "rotate(180, 256, 256)" },
      [[[SVG, "use"], { href: `#${uid}` }]],
    ],
    [
      [SVG, "g"],
      { transform: "rotate(270, 256, 256)" },
      [[[SVG, "use"], { href: `#${uid}` }]],
    ],
  ],
];

export default FullScreenButton;
