export const SVGNS = "http://www.w3.org/2000/svg";

export const svg = (...args) => [SVGNS, String.raw(...args)];

export default ({ size, viewSize, d, children, ...rest }) => [
  svg`svg`,
  {
    xmlns: SVGNS,
    viewBox: `0 0 ${viewSize.join(' ')}`,
    ...(typeof size === 'string' ? { width: size, height: size } : { style: { width: `${size}vw`, maxHeight: `${size}vh` } }),
    ...rest,
  },
  [
    ...(d ? [[
      svg`path`,
      {
        fill: "currentColor",
        d,
      },
    ]] : []),
    ...children,
  ],
];
