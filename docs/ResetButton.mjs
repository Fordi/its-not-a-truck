import Svg from "./Svg.mjs";

export default (props) => Svg({
  ...props,
  viewSize: [1000, 1000],
  d: "M144 500H10l178 178 178-178H233a268 268 0 0 1 392-236l65-65a356 356 0 0 0-546 301zm623 0a268 268 0 0 1-392 236l-65 65a356 356 0 0 0 546-301h134L812 322 634 500h133z",
});
