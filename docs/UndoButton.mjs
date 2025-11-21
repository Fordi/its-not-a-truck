import Svg from "./Svg.mjs";

export default ({ onMouseDown, ...props }) => Svg({
  ...props,
  className: "undo-button",
  viewSize: [512, 512],
  onMouseDown,
  onTouchStart: onMouseDown,
  d: "M448 368c0-17 3-83-49-135-35-36-80-54-143-57V96L64 224l192 128v-80c40 1 62 9 87 20 31 14 55 44 75 77l20 31h10v-32z",
});
