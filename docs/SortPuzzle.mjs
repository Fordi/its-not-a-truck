import createElement from 'https://unpkg.com/@fordi-org/create-element/dist/esm/index.js';
import UndoButton from './UndoButton.mjs';
import ResetButton from './ResetButton.mjs';
import mulberry32 from './mulberry32.mjs';
import difficulty from './difficulty.mjs';

const { floor } = Math;

const tubeRatio = 3;

class SortPuzzle extends HTMLElement {
  #history = [];
  #level;
  #random;
  set level(v) { 
    this.#level = Math.max(1, v);
  }
  get level() { return this.#level; }
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
    [...this.querySelectorAll('test-tube')].forEach((tube) => tube.removeAttribute('selected'));
  }

  reset() {
    const testTubes = [...this.querySelectorAll('test-tube')];
    this.#initialColors.forEach((colors, index) => {
      testTubes[index].setAttribute('contents', colors.join('; '));
    });
    this.#history = [];
  }

  constructor() {
    super();
    window.addEventListener('resize', () => this.#calculateSize());
  }

  get levels() { return difficulty[this.level - 1].cap; }
  get colors() { return difficulty[this.level - 1].col; }
  get tubes() { return this.colors + 1; }

  #calculateSize() {
    const { tubes } = this;

    const { width, height } = visualViewport;
    this.style.height = `${height}px`;
    document.body.style.height = `${height}px`;
    const rar = width / (height / tubeRatio);
    const rows = Math.round(Math.sqrt(tubes / rar));
    const cols = Math.ceil(tubes / rows);
    const maxTubeWidth = width * (2/3) / cols;
    const maxTubeHeight = height * (2/3) / rows / tubeRatio;
    const fontSize = Math.min(
      maxTubeWidth,
      maxTubeHeight
    );
    this.style.fontSize = `${fontSize}px`;
  }

  genColor(n) {
    let hue, lit = 0.5, sat = 1;
    const l = Math.floor(n / 6);
    hue = (n % 6) * 360 / 6;
    lit = 0.5 + (l ? (0.3333 * (l & 1 ? -1 : 1) / (1 + (l >> 1))) : 0);
    return `hsl(${hue} ${sat * 100}% ${lit * 100}%)`;
  }

  newGame(level = 0) {
    this.#random = mulberry32(0x2b00b1e5);
    this.level = Math.max(1, level);
    level = this.level;
    const { colors, tubes, levels } = this;
    this.#calculateSize();
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
    for (let i = 0; i < colors * levels; i += 1) {
      bin.push(this.genColor(Math.floor(i / levels), colors));
    }
    this.#initialColors = [];
    const tubeContainer = this.ownerDocument.createElement('tube-container');
    this.appendChild(tubeContainer);
    // Pick them into the first `tubes` tubes at random,
    // and append the tubes to the document.
    for (let i = 0; i < colors; i++) {
      const tube = [];
      for (let j = 0; j < this.levels; j++) {
        const next = bin.splice(floor(this.#random() * bin.length), 1);
        tube.push(next);
      }
      tubeContainer.appendChild(testTubes[i]);
      testTubes[i].setAttribute('contents', tube.join(';'));
      this.#initialColors.push(tube);
    }
    for (let i = colors; i < tubes; i++) {
      this.#initialColors.push([]);
      tubeContainer.appendChild(testTubes[i]);
    }
    const hud = this.ownerDocument.createElement('sort-hud');
    hud.appendChild(this.levelIndicator());
    hud.appendChild(this.undoButton());
    hud.appendChild(this.resetButton());
    this.appendChild(hud);
    this.#history = [];
    localStorage.setItem('level', this.level);
  }

  levelIndicator() {
    const b = this.ownerDocument.createElement('input');
    b.type = 'number';
    b.name = 'sort-level';
    b.value = this.level;
    const onChange = ({ target: { value } }) => {
      this.newGame(parseInt(value));
    };
    const onFocus = ({ target }) => {
      target.select();
    }
    b.addEventListener('change', onChange);
    b.addEventListener('focus', onFocus);
    return b;
  }

  undoButton() {
    return createElement(UndoButton, { size: '1em', onClick: () => this.undo(), title: 'Undo' });
  }

  resetButton() {
    return createElement(ResetButton, { size: '1em', onClick: () => this.reset(), title: 'Reset' });
  }

  get selection() {
      return this.querySelector('test-tube[selected]');
  }

  checkWon() {
    const done = ![...this.querySelectorAll('test-tube')]
        .some((tube) => {
            const c = tube.contents;
            if (!c.length) return false;
            if (c.length !== this.levels) return true;
            return c.slice(1).some((d) => d !== c[0]);
        });
    if (done) {
      this.style.opacity = 0.5;
      setTimeout(() => {
        this.newGame(this.level + 1);
        this.style.opacity = 1;
      }, 2000);
    }
  }

  connectedCallback() {
    this.newGame(parseInt(localStorage.getItem('level') ?? '1'));
  }
}

customElements.define('sort-puzzle', SortPuzzle);
