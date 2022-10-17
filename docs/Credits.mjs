export default function Credits({ game }) {
  return ['div', { className: 'credits' }, [
    ['div', { className: 'credits--restart' }, [
      ['a', {
        href: '#',
        onClick: () => {
          game.newGame(1);
          return false;
        },
      }, ["Start over"]],
      ['a', {
        href: '#',
        onClick: () => {
          game.newGame(201);
          return false;
        },
      }, ["Keep going"]]
    ]],
    ['div', { className: 'credits--crawl' }, [
      ['p', {}, ["That's it.  You've done it.  That's all the levels.  Congratulations!"]],
      ['br', {}],['br', {}],['br', {}],['br', {}],
      ['h1', {}, ["It's Not a Truck"]],
      ['h3', {}, ["A time-sink by"]],
      ['h2', {}, ["Bryan Elliott"]],
      ['p', {}, ["Thank you for playing."]],
    ]]
  ]];
}
