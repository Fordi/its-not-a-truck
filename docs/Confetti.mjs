
const ConfettiFlake = ({ color, top, left }) => 
  ['div', {
    className: 'confetti-wrap',
    style: {
      top, left,
      transform: `rotate(${(Math.random() - 0.5) * 180}deg)`
    }
  }, [
    ['div', {
      className: 'confetti-flake',
      style: {
        color,
      },
      onAnimationEnd: ({ target: { parentNode: self } }) => {
        self.parentNode.removeChild(self);
      }
    }, '']
  ]];

export default ConfettiFlake;
