const SVGNS = 'http://www.w3.org/2000/svg';

const ResetButton = ({ onClick, size, title }) => (
  [[SVGNS, "svg"], {
    xmlns: SVGNS,
    viewBox: "0 0 1000 1000",
    width: size,
    height: size,
    onClick,
    title,
  }, [
    [[SVGNS, "path"], {
      fill: 'currentColor',
      d: "M144 500H10l178 178 178-178H233a268 268 0 0 1 392-236l65-65a356 356 0 0 0-546 301zm623 0a268 268 0 0 1-392 236l-65 65a356 356 0 0 0 546-301h134L812 322 634 500h133z"
    }]
  ]]
);

export default ResetButton;