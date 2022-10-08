import { createElement } from './createElement.mjs';
import UndoButton from './UndoButton.mjs';
import ResetButton from './ResetButton.mjs';

const { floor, random } = Math;

const tubeRatio = 3;

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
    if (this.#history.length === 0) {
      this.newGame(this.#level - 1);
    } else {
      const testTubes = [...this.querySelectorAll('test-tube')];
      this.#initialColors.forEach((colors, index) => {
        testTubes[index].setAttribute('contents', colors.join('; '));
      });
      this.#history = [];
    }
  }

  constructor() {
    super();
    window.addEventListener('keydown', (e) => this.onKeyPressed(e));
    window.addEventListener('resize', () => this.#calculateSize());
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

  #calculateSize() {
    const { tubes } = this.#colorsAndTubes(this.#level);
    const { width, height } = this.parentNode.getBoundingClientRect();
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

  #colorsAndTubes(level) {
    const colors = Math.min(24, 3 + Math.floor(level / 2));
    return {
      colors,
      tubes: colors + 2,
    };
  }

  genColor(n) {
    let hue, lit = 0.5, sat = 1;
    const l = Math.floor(n / 6);
    hue = (n % 6) * 360 / 6;
    lit = 0.5 + (l ? (0.3333 * (l & 1 ? -1 : 1) / (1 + (l >> 1))) : 0);
    return `hsl(${hue} ${sat * 100}% ${lit * 100}%)`;
  }

  newGame(level = 0) {
    this.#level = level;
    const { colors, tubes } = this.#colorsAndTubes(level);
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
    for (let i = 0; i < colors; i += 0.25) {
      bin.push(this.genColor(Math.floor(i), colors));
    }
    this.#initialColors = [];
    // Pick them into the first `tubes` tubes at random
    for (let i = 0; i < colors; i++) {
      const tube = [];
      for (let j = 0; j < 4; j++) {
        const next = bin.splice(floor(random() * bin.length), 1);
        tube.push(next);
      }
      testTubes[i].setAttribute('contents', tube.join(';'));
      this.#initialColors.push(tube);
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
    this.newGame(parseInt(localStorage.getItem('level') ?? '17'));
  }
}

customElements.define('sort-puzzle', SortPuzzle);
