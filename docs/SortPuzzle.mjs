import createElement from "./createElement.mjs";
import UndoButton from "./UndoButton.mjs";
import ResetButton from "./ResetButton.mjs";
import mulberry32 from "./mulberry32.mjs";
import difficulty from "./difficulty.mjs";
import { generateLevelColors } from "./color/generateLevelColors.mjs";
import { YouBeatLevelX } from "./YouBeatLevelX.mjs";
import ConfettiFlake from "./Confetti.mjs";
import Credits from "./Credits.mjs";
import HintButton from "./HintButton.mjs";
import "./TestTube.mjs";

const { floor } = Math;
const MAX_SHUFFLE_TIME = 3000;

const promisifyWorker = (worker) => {
  const deferreds = new Map();
  worker.addEventListener("message", ({ data: [requestId, result, error] }) => {
    const deferred = deferreds.get(requestId);
    deferreds.delete(requestId);
    if (error) {
      deferred?.reject?.(error);
    } else {
      deferred?.resolve?.(result);
    }
  });
  return async (...args) => {
    const requestId = Math.random().toString(36).substr(2);
    const def = {};
    def.promise = new Promise((resolve, reject) => {
      def.resolve = resolve;
      def.reject = reject;
    });
    worker.postMessage([requestId, ...args]);
    deferreds.set(requestId, def);
    return def.promise;
  };
};

const nextBestMove = promisifyWorker(
  new Worker("./nextBestMoveWorker.mjs", { type: "module" })
);

const tubeRatio = 2.978;

const INITIAL_HINTS = 5;
const BUTTON_SIZE = 10;
const MAX_FLAKES = 125;

const unsolvable = {
  84: 1,
  87: 1,
  101: 1,
  103: 1,
  104: 1,
  105: 1,
  108: 1,
  109: 1,
  112: 1,
  117: 1,
  124: 1,
  125: 1,
  127: 1,
  128: 1,
  130: 1,
  132: 1,
  134: 1,
};

class SortPuzzle extends HTMLElement {
  #history = [];
  #level;
  #random;
  #hintsLeft = INITIAL_HINTS;
  #hintCounter;

  get state() {
    return [...this.querySelectorAll("test-tube")].map((e) =>
      (e.getAttribute("contents") || "")
        .split(";")
        .filter((a) => a)
        .map((a) => a.trim())
    );
  }

  get hintsLeft() {
    return this.#hintsLeft;
  }
  set hintsLeft(v) {
    this.#hintsLeft = v;
    if (this.#hintCounter) {
      this.#hintCounter.textContent = v;
    }
  }
  set level(v) {
    this.#level = Math.max(1, v);
  }
  get level() {
    return this.#level;
  }
  #initialColors = [];
  get tubeCount() {
    return parseInt(this.getAttribute("tubes") ?? 6);
  }

  get colorCount() {
    return parseInt(this.getAttribute("colors") ?? 4);
  }

  pour(from, to) {
    const stuff = from.pop(to);
    to.push(stuff);
    from.removeAttribute("selected");
    this.checkWon();
    this.#history.push([stuff, to, from]);
  }

  shufflePour(from, to, count, animate) {
    const stuff = from.pop(animate ? to : undefined, count === -1 ? this.levels - to.length : count);
    to.push(stuff);
  }

  // Synchronous shuffle — same three-phase logic as animatedShuffle but operates
  // entirely on plain arrays and commits to the DOM in a single pass at the end.
  shuffleNow() {
    const allTubes = [...this.querySelectorAll("test-tube")];
    const cap = this.levels;
    let state = allTubes.map(t => [...t.contents]);

    const emptyIdx = state.map((s, i) => s.length === 0 ? i : -1).filter(i => i >= 0);
    const activeIdx = state.map((s, i) => s.length > 0 ? i : -1).filter(i => i >= 0);
    const steps = ((allTubes.length * cap) ** 1.5) | 0;

    const wouldComplete = (top, toState) =>
      toState.length + 1 === cap && toState.every(c => c === top);

    const move = (from, to, count) => {
      const n = count === -1 ? cap - state[to].length : count;
      state[to].push(...state[from].splice(state[from].length - n, n));
    };

    // Phase 1: loosen — pour into empty tubes to create room in active tubes
    for (let i = 0; i < emptyIdx.length; i++) {
      const src = activeIdx[i % activeIdx.length], tgt = emptyIdx[i];
      const max = Math.min(state[src].length - 1, cap - state[tgt].length);
      if (max >= 1) move(src, tgt, ((this.#random() * max) | 0) + 1);
    }

    // Phase 2: randomize — random pours across all tubes
    for (let i = 0; i < steps; i++) {
      const sources = state.map((s, i) => i).filter(i => state[i].length > 1);
      const from = sources[(this.#random() * sources.length) | 0];
      if (from === undefined) continue;
      const top = state[from][state[from].length - 1];
      const dests = state.map((s, i) => i).filter(i =>
        i !== from && state[i].length < cap && !wouldComplete(top, state[i])
      );
      if (!dests.length) continue;
      const to = dests[(this.#random() * dests.length) | 0];
      const max = Math.min(state[from].length - 1, cap - state[to].length);
      if (max >= 1) move(from, to, ((this.#random() * max) | 0) + 1);
    }

    // Phase 3: drain — return originally-empty tubes to empty
    for (const ei of emptyIdx) {
      while (state[ei].length > 0) {
        const top = state[ei][state[ei].length - 1];
        const dest = activeIdx.find(i => state[i].length < cap && !wouldComplete(top, state[i]));
        if (dest === undefined) break;
        move(ei, dest, -1);
      }
    }

    // Single DOM commit
    allTubes.forEach((tube, i) => { tube.contents = state[i]; });
    this.#initialColors = state.map(s => [...s]);
  }

  async animatedShuffle() {
    const allTubes = [...this.querySelectorAll("test-tube")];
    const cap = this.levels;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    
    const wouldComplete = (from, to) => {
      const toC = to.contents;
      return toC.length + 1 === cap && toC.every((c) => c === from.top);
    };

    this.style.pointerEvents = "none";
    // Snapshot empty vs. active tubes — empty tubes must end empty
    const emptyTubes = allTubes.filter((t) => !t.contents.length);
    const activeTubes = allTubes.filter((t) => t.contents.length > 0);
    const steps = ((allTubes.length * cap)**1.5)|0;
    const animate = steps <= 256;
    const totalSteps = steps + emptyTubes.length * 2;
    // const tooMany = steps
    console.log(totalSteps);
    const stepDur = Math.min(MAX_SHUFFLE_TIME / totalSteps, 120);

    for (let i = 0; i < emptyTubes.length; i++) {
      const source = activeTubes[i % activeTubes.length];
      const target = emptyTubes[i];
      const min = 1;
      const max = Math.min(source.contents.length, cap - target.contents.length);
      const count = (Math.random() * (max - min))|0 + min;
      this.shufflePour(source, target, count, animate);
      await delay(stepDur);
    }

    for (let i = 0; i < steps; i++) {
      const sources = allTubes.filter((t) => t.contents.length > 1);
      const from = sources[(this.#random() * sources.length)|0];
      if (!from) continue;
      const dests = allTubes.filter(
        (t) => t !== from && t.contents.length < cap && !wouldComplete(from, t)
      );
      if (!dests.length) continue;
      const to = dests[(this.#random() * dests.length)|0];
      const min = 1;
      const max = Math.min(from.contents.length, cap - to.contents.length);
      const count = (Math.random() * (max - min))|0 + min;
      this.shufflePour(from, to, count, animate);
      await delay(stepDur);
    }

    for (const tube of emptyTubes) {
      while (tube.contents.length > 0) {
        const dest = activeTubes.find(
          (t) => t.contents.length < cap && !wouldComplete(tube, t)
        );
        if (!dest) break;
        this.shufflePour(tube, dest, -1, animate);
        await delay(stepDur);
      }
    }

    this.style.pointerEvents = "";
    // Shuffled layout becomes the reset state
    this.#initialColors = allTubes.map((t) => [...t.contents]);
  }

  async undoAll() {
    [...this.querySelectorAll("test-tube")].forEach((tube) =>
      tube.removeAttribute("selected")
    );
    while (this.#history.length && (await this.stuck())) {
      const [stuff, from, to] = this.#history.pop();
      from.pop(to, stuff.length);
      to.push(stuff);
      await new Promise((r) => setTimeout(r, 250));
    }
    this.checkStuck();
  }

  undo() {
    if (!this.#history.length) return;
    const [stuff, from, to] = this.#history.pop();
    from.pop(to, stuff.length);
    to.push(stuff);
    [...this.querySelectorAll("test-tube")].forEach((tube) =>
      tube.removeAttribute("selected")
    );
    this.checkStuck();
  }

  reset() {
    const testTubes = [...this.querySelectorAll("test-tube")];
    this.#initialColors.forEach((colors, index) => {
      testTubes[index].setAttribute("contents", colors.join("; "));
    });
    this.#history = [];
    this.checkStuck();
    this.hintsLeft = INITIAL_HINTS;
  }

  constructor() {
    super();
    window.addEventListener("resize", () => this.#calculateSize());
  }

  get levels() {
    return difficulty[this.level - 1]?.cap ?? 9;
  }
  get colors() {
    return difficulty[this.level - 1]?.col ?? 36;
  }
  get tubes() {
    
    return (
      this.colors +
      difficulty[this.level - 1]?.extra
    );
  }
  get difficulty() {
    return difficulty[this.level - 1]?.diff ?? 100;
  }

  #calculateSize() {
    const { tubes } = this;
    const c = this.querySelector('tube-container');
    if (!c) {
      return;
    }
    let { width } = visualViewport;
    let { height } = c.getBoundingClientRect();
    // this.style.maxHeight = `${height}px`;
    // document.body.style.height = `${height}px`;
    height *= 0.84;
    const rar = width * tubeRatio / height;
    const rows = Math.round(Math.sqrt(tubes / rar));
    const cols = Math.ceil(tubes / rows);
    const maxTubeWidth = (width * (2 / 3)) / cols;
    const maxTubeHeight = (height * (2 / 3)) / rows / tubeRatio;
    const fontSize = Math.min(maxTubeWidth, maxTubeHeight);
    this.style.fontSize = `${fontSize}px`;
    
    if (c) {
      c.style.maxWidth = `${fontSize * cols * 1.5}px`;
      // c.style.maxHeight = `${fontSize * rows * 4.5}px`;
    }
  }

  seed() {
    if (location.hash) {
      return [...new TextEncoder().encode(location.hash.slice(1))].reduce((sum, byte) => (sum * 136 + byte * 53) & 0xFFFFFFFF, 0xdeadbeef) | 0;
    }
    return (0xdeadbeef + 0x2b01b1e5 * this.difficulty * this.level) | 0;
  }

  palette;

  newGame(level = 0) {
    this.hintsLeft = INITIAL_HINTS;
    this.style.transition = "";
    this.style.opacity = 1;
    if (this.credits) {
      this.credits.parentNode.removeChild(this.credits);
    }
    this.level = Math.max(1, level);
    this.#random = mulberry32(this.seed());
    level = this.level;
    const { colors, tubes, levels } = this;
    this.#calculateSize();
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    const testTubes = [];
    // Create all the tubes
    for (let i = 0; i < tubes; i++) {
      testTubes.push(this.ownerDocument.createElement("test-tube"));
    }
    // Create a bin of colors, four of the same color for each tube
    const palette = generateLevelColors(this.level, this.colors);
    this.palette = palette.tubes;
    document.body.style.backgroundImage = `
      linear-gradient(45deg, ${palette.background[0]}80 0%, ${palette.background[0]}80 49%, ${palette.background[1]}80 50%, ${palette.background[1]}80 100%),
      linear-gradient(135deg, ${palette.background[2]}80 0%, ${palette.background[2]}80 49%, ${palette.background[3]}80 50%, ${palette.background[3]}80 100%)
    `.trim();
    const bin = [];
    for (const c of palette.tubes) {
      for (let i = 0; i < levels; i++) {
        bin.push(c);
      }
    }
    this.#initialColors = [];
    const hud = this.ownerDocument.createElement("sort-hud");
    this.appendChild(hud);
    
    const tubeContainer = this.ownerDocument.createElement("tube-container");
    this.appendChild(tubeContainer);
    // Pick them into the first `tubes`,
    // and append the tubes to the document.
    for (let i = 0; i < colors; i++) {
      const tube = [];
      for (let j = 0; j < this.levels; j++) {
        // const next = bin.splice(floor(this.#random() * bin.length), 1);
        const next = bin.shift();
        tube.push(next);
      }
      tubeContainer.appendChild(testTubes[i]);
      testTubes[i].setAttribute("contents", tube.join(";"));
      this.#initialColors.push(tube);
    }
    for (let i = colors; i < tubes; i++) {
      this.#initialColors.push([]);
      tubeContainer.appendChild(testTubes[i]);
    }
    hud.appendChild(this.levelIndicator());
    const hudRight = this.ownerDocument.createElement("hud-buttons");
    hud.appendChild(hudRight);
    hudRight.appendChild(this.hintButton());
    hudRight.appendChild(this.undoButton());
    hudRight.appendChild(this.resetButton());
    
    this.#history = [];
    localStorage.setItem("level", this.level);
    this.shuffleNow();
    this.#calculateSize();
  }

  levelIndicator() {
    const b = this.ownerDocument.createElement("input");
    b.type = "number";
    b.name = "sort-level";
    b.value = this.level;
    const onChange = ({ target }) => {
      const level = parseInt(target.value);
      if (Number.isNaN(level)) {
        target.value = this.#level;
      } else {
        this.newGame(level);
      }
    };
    const onFocus = ({ target }) => {
      target.select();
    };
    b.addEventListener("change", onChange);
    b.addEventListener("focus", onFocus);
    return b;
  }

  undoButton() {
    let timeout = null;
    let held = false;
    return createElement(UndoButton, {
      size: BUTTON_SIZE,
      onMouseDown: () => {
        timeout = setTimeout(() => {
          held = true;
          timeout = null;
          this.undoAll();
        }, 250);
      },
      onClick: () => {
        if (held) {
          held = false;
        } else {
          clearTimeout(timeout);
          timeout = null;
          this.undo();
        }
      },
      title: "Undo",
    });
  }

  hintButton() {
    const hintButton = createElement(HintButton, {
      size: BUTTON_SIZE,
      onClick: async () => {
        if (this.hintsLeft > 0) {
          try {
            const state = this.state;
            const next = await nextBestMove(state);
            const [from, to] = next;
            const tubes = this.querySelectorAll("test-tube");
            tubes[from].bump();
            tubes[to].glow();
            this.hintsLeft -= 1;
          } catch (e) {
            hintButton.style.transition = "color 0.4s";
            hintButton.style.color = "red";
            setTimeout(() => {
              hintButton.style.color = "";
            }, 2000);
          }
        }
      },
      title: "Hint",
      remain: this.hintsLeft,
    });
    this.#hintCounter = hintButton.querySelector("tspan");
    return hintButton;
  }

  resetButton() {
    return createElement(ResetButton, {
      size: BUTTON_SIZE,
      onClick: () => this.reset(),
      title: "Reset",
    });
  }

  get selection() {
    return this.querySelector("test-tube[selected]");
  }

  youBeatLevelX() {
    const fanfare = createElement(
      ...YouBeatLevelX({
        game: this,
      })
    );
    document.body.appendChild(fanfare);
    const promises = [];
    for (let i = 0; i < MAX_FLAKES; i++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            const up = Math.random() > 0.5;
            document.body.appendChild(
              createElement(
                ...ConfettiFlake({
                  color: this.palette[Math.floor(Math.random() * this.palette.length)],
                  top: up ? `${visualViewport.height}px` : `0px`,
                  left: `${Math.random() * visualViewport.width}px`,
                  angle: up ? [-90, 90] : [-270, -90],
                  onAnimationEnd: () => resolve(),
                })
              )
            );
          }, Math.random() * 1500);
        })
      );
    }
    Promise.all(promises).then(() => {
      document.body.removeChild(fanfare);
      this.newGame(this.level + 1);
    });
  }

  youBeatItAll() {
    this.style.transition = "opacity, 4s";
    this.style.opacity = 0;
    this.credits = createElement(...Credits({ game: this }));
    document.body.appendChild(this.credits);
  }
  async stuck() {
    try {
      await nextBestMove(this.state);
      return false;
    } catch (e) {
      return true;
    }
  }

  async checkStuck() {
    if (this.stuckTimeout) {
      clearTimeout(this.stuckTimeout);
    }
    if (await this.stuck()) {
      this.stuckTimeout = setTimeout(() => {
        this.querySelector(".undo-button").classList.add("no-moves");
        delete this.stuckTimeout;
      }, 5000);
    } else {
      this.querySelector(".undo-button").classList.remove("no-moves");
    }
  }

  done() {
    return ![...this.querySelectorAll("test-tube")].some((tube) => {
      const c = tube.contents;
      if (!c.length) return false;
      if (c.length !== this.levels) return true;
      return c.slice(1).some((d) => d !== c[0]);
    });
  }
  checkWon() {
    if (this.done()) {
      if (this.level === 200) {
        this.youBeatItAll();
      } else {
        this.youBeatLevelX();
      }
    } else {
      this.checkStuck();
    }
  }
  #hashChange;
  connectedCallback() {
    this.newGame(parseInt(localStorage.getItem("level") ?? "1"));
    if (!this.#hashChange) {
      this.#hashChange = () => this.newGame(this.level);
    }
    window.addEventListener('hashchange', this.#hashChange);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.#hashChange);
  }
}
try {
  customElements.define("sort-puzzle", SortPuzzle);
} catch (e) {}
