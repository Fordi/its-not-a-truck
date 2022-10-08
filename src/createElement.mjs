const { Node } = globalThis;
const { isArray } = Array;

export const SVGNS = 'http://www.w3.org/2000/svg';

const toArray = (n) => (isArray(n) ? n : [n]);

const isTagName = (n) => (
  typeof n === 'string'
  && /^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(n)
  && !/^[Xx][Mm][Ll]/.test(n)
);

const isNsTagName = (t) => isArray(t) && t.length === 2 && typeof t[0] === 'string' && isTagName(t[1]);

const isDomRep = (d) => isArray(d) && (typeof d[0] === 'function' || isTagName(d[0]) || isNsTagName(d[0]));

const normalizeToDOM = (d) => {
  if (d === null) return document.createTextNode('');
  if (d instanceof Node) return d;
  // eslint-disable-next-line no-use-before-define
  if (isDomRep(d)) return createElement(...d);
  if (typeof d !== 'object') return document.createTextNode(d);
  throw new Error('Attempted to normalize invalid DOM object:', d);
};

const propertyHandlers = [
  ['className', (el, value) => {
    const cls = Array.from(new Set(toArray(value).filter((a) => a).join(' ').split(' '))).join(' ');
    if (el.namespaceURI === SVGNS) {
      // eslint-disable-next-line no-param-reassign
      el.className.baseVal = cls;
    } else {
      // eslint-disable-next-line no-param-reassign
      el.className = cls;
    }
  }],
  ['style', (el, value) => {
    Object.assign(el.style, value);
  }],
  [/^on[A-Z]/, (el, value, name) => {
    el.addEventListener(name.substring(2).toLowerCase(), value);
  }],
];

const defaultPropHandler = (el, value, name, hasNS) => {
  if (hasNS) {
    el.setAttribute(name, value);
  } else {
    const attName = name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    el.setAttribute(attName, value);
  }
};

const getPropHandler = (name) => {
  const special = propertyHandlers.find(([matcher]) => (
    (typeof matcher === 'string' && name === matcher)
    || (matcher instanceof RegExp && matcher.test(name))
  ));
  if (special) return special[1];
  return defaultPropHandler;
};

/**
 * Create an element
 * @param {TagName|NSTagName|Component} type Element type
 * @param {Properties} props Properties object
 * @param {Array<String|Node|DOMRepresentation} children children
 * @returns HTMLElement
 */
export const createElement = (type, props = {}, children = []) => {
  if (type instanceof Function) {
    return normalizeToDOM(type({ ...props, children }));
  }
  const hasNS = isNsTagName(type);
  const el = hasNS ? document.createElementNS(...type) : document.createElement(type);
  Object.keys(props).forEach((name) => {
    getPropHandler(name)(el, props[name], name, hasNS);
  });
  toArray(children).forEach((child) => {
    const norm = normalizeToDOM(child);
    if (norm) el.appendChild(norm);
  });
  return el;
};

/**
 * Must match /^[a-zA-Z_][a-zA-Z0-9\-_]*$/, and not match /^[Xx][Mm][Ll]/
 * Consistent with XML tag naming rules.
 * @typedef {String} TagName
 */

/**
 * @typedef {Array} NSTagName
 * @property {String} 0 - Namespace URI
 * @property {TagName} 1 - Tag name
 */

/**
 * @callback Component
 * @param {Object} props - Properties passed to component
 * @returns {DOMRepresentation|HTMLElement|null} rendered component
 */

/**
 * @typedef {Array} DOMRepresentation
 * @property {TagName|NSTagName|Component} 0 - tag name or component
 * @property {Object} [1={}] - Properties or attributes
 * @property {Array<String|Node|DOMRepresentation} [2=[]] - Children
 */

/**
 * @typedef {Object} Properties
 * @property {Object} style - A hash of styles
 * @property {String|Array<String>} className - a list of class names; falsy items will be ignored
 */
