/**
 * @see https://github.com/Fordi/create-element
 */
const { Node } = globalThis;
const { isArray } = Array;
export const SVGNS = 'http://www.w3.org/2000/svg';
const toArray = (n) => (isArray(n) ? n : [n]);
const isTagName = (n) => (typeof n === 'string'
    && /^[a-zA-Z_][a-zA-Z0-9\-_]*$/.test(n)
    && !/^[Xx][Mm][Ll]/.test(n));
const isNsTagName = (t) => isArray(t)
    && t.length === 2
    && typeof t[0] === 'string'
    && isTagName(t[1]);
const isDomRep = (d) => isArray(d)
    && (typeof d[0] === 'function'
        || isTagName(d[0])
        || isNsTagName(d[0]));
const normalizeToDOM = (d) => {
    if (d === null)
        return document.createTextNode('');
    if (d instanceof Node)
        return d;
    if (isDomRep(d))
        return createElement(...d);
    if (typeof d !== 'object')
        return document.createTextNode(String(d));
    throw Object.assign(new Error('Attempted to normalize invalid DOM object:'), { detail: d });
};
const propertyHandlers = [
    ['className', (el, value) => {
            const cls = [...new Set(toArray(value).filter((a) => a).join(' ').split(' '))].join(' ');
            el.classList.value = cls;
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
    }
    else {
        const attName = name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        el.setAttribute(attName, value);
    }
};
const getPropHandler = (name) => {
    const special = propertyHandlers.find(([matcher]) => ((typeof matcher === 'string' && name === matcher)
        || (matcher instanceof RegExp && matcher.test(name))));
    if (special)
        return special[1];
    return defaultPropHandler;
};
const createElement = (type, props = {}, children = []) => {
    if (type instanceof Function) {
        return normalizeToDOM(type(Object.assign(Object.assign({}, props), { children })));
    }
    const hasNS = isNsTagName(type);
    const el = hasNS
        ? document.createElementNS(...type)
        : document.createElement(type);
    Object.keys(props).forEach((name) => {
        getPropHandler(name)(el, props[name], name, hasNS);
    });
    toArray(children).forEach((child) => {
        const norm = normalizeToDOM(child);
        if (norm)
            el.appendChild(norm);
    });
    return el;
};
export default createElement;
