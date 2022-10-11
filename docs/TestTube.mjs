import createElement from 'https://unpkg.com/@fordi-org/create-element/dist/esm/index.js';
import ConfettiFlake from "./Confetti.mjs";

class TestTube extends HTMLElement {
  static get observedAttributes() {
    return ['contents'];
  }

  get #game() {
    return this.closest('sort-puzzle');
  }

  #contents = null;

  #updateColors() {
    const game = this.closest('sort-puzzle');
    if (!game) {
      console.warn('attempt to set attribute before connected');
    }
    const { levels } = game;

    for (let i = 0; i < levels; i++) {
      if (!this.#childNodes[i]) {
        this.#childNodes[i] = Object.assign(this.ownerDocument.createElement('div'), {
          className: 'level',
          style: {
            height: `${1 / levels}em`
          }
        });
        this.appendChild(this.#childNodes[i]);
      }
      this.#childNodes.slice(levels).forEach((child) => {
        this.removeChild(child);
      });
      this.#childNodes.length = levels;
    }    
    const contents = this.contents;
    this.#childNodes.forEach((level, index) => {
      if (contents[index]) {
        level.style.background = contents[index];
        level.style.height = `${4 / levels}em`;
      } else {
        level.style.height = 0;
      }
    });
  }

  #childNodes = [];

  connectedCallback() {
    this.addEventListener('click', (event) => this.onClick(event));
    this.#updateColors();
  }

  get contents() {
    return (this.getAttribute('contents') ?? '').split(';').map(a => a.trim()).filter(a => !!a);
  }

  set contents(v) {
    this.setAttribute('contents', v.join('; '));
  }

  push(v) {
    const { contents } = this;
    this.contents = [...contents, ...v];
    const { top, left, width } = this.getBoundingClientRect();
    if (!this.full) return;
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        document.body.appendChild(createElement(...ConfettiFlake({
          color: contents[0],
          top: `${top}px`,
          left: `${left + Math.random() * width}px`,
        })))
      }, Math.random() * 500);
    }
  }

  get full() {
    const { contents } = this;
    const [first, ...rest] = contents;
    return !rest.some(a => a !== first) && contents.length === this.#game.levels;
  }

  pop(target, length = -1) {
    const tmp = this.contents;
    const ret = [tmp.pop()];
    if (length === -1) {
      const tgtLen = target.contents.length;
      while ((tmp[tmp.length - 1] === ret[0]) && (ret.length + tgtLen) < this.closest('sort-puzzle').levels) {
        ret.push(tmp.pop());
      }
    } else {
      while (ret.length < length) {
        ret.push(tmp.pop());
      }
    }
    this.contents = tmp;
    this.setAttribute('pouring', true);
    const rect = this.getBoundingClientRect();
    const other = target.getBoundingClientRect();
    
    this.style.transform = `translate(${other.left - rect.left}px, ${other.top - rect.top}px) translate(-2em, -2em) rotate(60deg)`;
    this.style.pointerEvents = 'none';
    setTimeout(() => {
      this.removeAttribute('pouring');
      this.style.transform = '';
      this.style.pointerEvents = '';
    }, 600);
    return ret;
  }

  get top() {
    const c = this.contents;
    return c[c.length - 1];
  }

  onClick() {
    const selection = this.#game.selection;
    if (selection && selection !== this) {
      const { contents, top } = this;
      if (
        contents.length < this.#game.levels
        && (
          !top
          || top === selection.top
        )
      ) {
        this.#game.pour(selection, this);
        return;
      }
    }
    if (!this.contents.length) return;
    if (this.hasAttribute('selected')) {
      this.removeAttribute('selected');
    } else {
      [...this.parentNode.children].forEach((tube) => {
        if (tube !== this) {
          tube.removeAttribute('selected');
        }
      });
      this.setAttribute('selected', true);
    }
  }
  attributeChangedCallback(property) {
    if (property === 'contents') {
      this.#updateColors();
    }
  }
}

customElements.define('test-tube', TestTube);
