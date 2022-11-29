const SVGNS = 'http://www.w3.org/2000/svg';

const UndoButton = ({ onClick, onMouseDown, size, title }) => (
  [[SVGNS, "svg"], {
    viewBox: "0 0 512 512",
    xmlns: SVGNS,
    width: size,
    height: size,
    className: 'undo-button',
    onClick,
    onMouseDown,
    onTouchStart: onMouseDown,
    title,
  }, [
    [[SVGNS, "path"], {
      fill: "currentColor",
        d: "M448 368c0-17 3-83-49-135-35-36-80-54-143-57V96L64 224l192 128v-80c40 1 62 9 87 20 31 14 55 44 75 77l20 31h10v-32z"
    }]
  ]]
);

export default UndoButton;