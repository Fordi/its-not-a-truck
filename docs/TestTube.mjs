class TestTube extends HTMLElement {
  static get observedAttributes() {
    return ['contents'];
  }

  get #game() {
    return this.closest('sort-puzzle');
  }

  #contents = null;

  #updateColors() {
    const levels = [...this.querySelectorAll('.level')];
    const contents = this.contents;
    levels.forEach((level, index) => {
      if (contents[index]) {
        level.style.background = contents[index];
        level.style.height = '';
      } else {
        level.style.height = 0;
      }
    });
  }

  connectedCallback() {
    for (let i = 0; i < 4; i++) {
      this.appendChild(Object.assign(this.ownerDocument.createElement('div'), { className: 'level' }));
    }
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
    this.contents = [...this.contents, ...v];
  }

  pop(target, length = -1) {
    const tmp = this.contents;
    const ret = [tmp.pop()];
    if (length === -1) {
      const tgtLen = target.contents.length;
      while ((tmp[tmp.length - 1] === ret[0]) && (ret.length + tgtLen) < 4) {
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
        contents.length < 4
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
