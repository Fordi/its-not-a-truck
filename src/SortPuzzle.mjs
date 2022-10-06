import COLORS from './COLORS.mjs';

const { floor, random } = Math;

class SortPuzzle extends HTMLElement {
  #history = [];
  #level = 0;
  #initialColors = [];
  get tubeCount() {
    return parseInt(this.getAttribute('tubes') ?? 6)
  }

  get colorCount() {
    return parseInt(this.getAttribute('colors') ?? 4);
  }

  pour(from, to) {
    const stuff = from.pop(to);
    to.push(stuff);
    from.removeAttribute('selected');
    this.checkWon();
    this.#history.push([stuff, to, from]);
  }

  undo() {
    if (!this.#history.length) return;
    const [stuff, from, to] = this.#history.pop();
    from.pop(to, stuff.length);
    to.push(stuff);
  }

  reset() {
    const testTubes = [...this.querySelectorAll('test-tube')];
    this.#initialColors.forEach((colors, index) => {
      testTubes[index].setAttribute('contents', colors.join(', '));
    });
    this.#history = [];
  }

  constructor() {
    super();
    window.addEventListener('keydown', (e) => this.onKeyPressed(e));
  }

  onKeyPressed({ key }) {
    const k = key.toLowerCase();
    // console.log(key, /^[0-9]$/.test(k));
    if (/^[0-9]$/.test(key)) {
      const index = (parseInt(key) + 9) % 10;
      const tubes = this.querySelectorAll('test-tube');
      tubes[index].onClick();
    }
    if (k === 'backspace') {
      this.undo();
    }
    if (key === 'r') {
      this.reset();
    }
  }

  newGame(level = 0) {
    this.#level = level;
    const colors = Math.min(COLORS.length, 3 + Math.floor(level / 5));
    const tubes = colors + 2;
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    const testTubes = [];
    // Create all the tubes
    for (let i = 0; i < tubes; i++) {
      testTubes.push(this.ownerDocument.createElement('test-tube'));
    }
    // Create a bin of colors, four of the same color for each tube
    const bin = [];
    for (let i = 0; i < colors; i += 0.25) {
      bin.push(COLORS[floor(i)]);
    }
    this.#initialColors = [];
    // Pick them into the first `tubes` tubes at random
    for (let i = 0; i < colors; i++) {
      const colors = [];
      for (let j = 0; j < 4; j++) {
        colors.push([bin.splice(floor(random() * bin.length), 1)]);
      }
      testTubes[i].setAttribute('contents', colors.join(', '));
      this.#initialColors.push(colors);
    }
    for (let i = colors; i < tubes; i++) {
      this.#initialColors.push([]);
    }
    const tubeContainer = this.ownerDocument.createElement('tube-container');
    this.appendChild(tubeContainer);
    // Append the tubes to the document.
    testTubes.forEach((tube) => tubeContainer.appendChild(tube));
    const hud = this.ownerDocument.createElement('sort-hud');
    hud.appendChild(this.undoButton());
    hud.appendChild(this.resetButton());
    hud.appendChild(this.levelIndicator(level));
    this.appendChild(hud);
    this.#history = [];
    localStorage.setItem('level', level);
  }

  levelIndicator(level) {
    const b = this.ownerDocument.createElement('sort-level');
    b.textContent = level;
    return b;
  }

  undoButton() {
    const b = this.ownerDocument.createElement('button');
    b.addEventListener('click', () => this.undo());
    b.textContent = 'undo';
    return b;
  }

  resetButton() {
    const b = this.ownerDocument.createElement('button');
    b.addEventListener('click', () => this.reset());
    b.textContent = 'reset';
    return b;
  }

  get selection() {
      return this.querySelector('test-tube[selected]');
  }

  checkWon() {
    const done = ![...this.querySelectorAll('test-tube')]
        .some((tube) => {
            const c = tube.contents;
            if (!c.length) return false;
            if (c.length !== 4) return true;
            return c.slice(1).some((d) => d !== c[0]);
        });
    if (done) {
      this.style.opacity = 0.5;
      setTimeout(() => {
        this.newGame(this.#level + 1);
        this.style.opacity = 1;
      }, 2000);
    }
  }

  connectedCallback() {
    this.newGame(parseInt(localStorage.getItem('level') ?? '0'));
  }
}

customElements.define('sort-puzzle', SortPuzzle);
