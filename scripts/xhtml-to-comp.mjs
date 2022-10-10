#!/usr/bin/env node
import { DOMParser } from 'xmldom';
import { readFile, writeFile } from 'node:fs/promises';
import * as ce from '../src/createElement.mjs';
import { basename, dirname, join, relative } from 'node:path';

const indent = (str) => `  ${str.split('\n').join('\n  ')}`;

const isUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
};

const nsMap = {
  ...Object.keys(ce).filter((name) => (
    name === name.toUpperCase() && isUrl(ce[name])
  )).reduce((o, name) => ({...o, [ce[name]]: name }), {}),
};

let usedNS = new Set();

const toArray = (element) => {
  if (!element.nodeType && 'length' in element) {
    const ret = [];
    for (let i = 0; i < element.length; i++) {
      ret.push(element[i]);
    }
    return ret;
  }
  if (element.nodeType === 3) {
    if (element.nodeValue.trim() === '') return null;
    return `"${element.nodeValue}"`;
  }
  const { namespaceURI, tagName, attributes, childNodes } = element;
  let tag = `"${tagName}"`;
  if (namespaceURI) {
    if (nsMap[namespaceURI]) {
      tag = `[${nsMap[namespaceURI]}, ${tag}]`;
      usedNS.add(nsMap[namespaceURI]);
    } else {
      tag = `["${namespaceURI}", ${tag}]`;
    }
  }
  const attrPairs = toArray(attributes).map(({ name, value }) => `${name}: "${value}"`);
  const kids = toArray(childNodes).map((node) => toArray(node)).filter(a => !!a);
  let attrs = '';
  if (kids.length) {
    attrs = ', {}';
  }
  if (attrPairs.length) {
    attrs = `, { ${attrPairs.join(', ')} }`;
  }
  if (attrs && (tagName.length + attrs.length + 3 > 100)) {
    attrs = `, {\n${indent(attrPairs.join(',\n  '))}\n}`;
  }
  let children = '';
  if (kids.length) {
    children = `, [\n${kids.map((kid) => indent(kid)).join(',\n')}\n]`;
  }
  return `[${tag}${attrs}${children}]`;
};

const toComponentSource = async (xmlFile) => {
  const dir = dirname(xmlFile);
  const name = basename(xmlFile).replace(/\..*$/, '');
  const parser = new DOMParser();
  const dom = parser.parseFromString(await readFile(xmlFile, 'utf-8'), 'text/xml');
  let content = [
    `const ${name} = () => (\n${indent(toArray(dom.documentElement))}\n);`,
    `export default ${name};`
  ];
  if (usedNS.size) {
    let imp = relative(dir, new URL('../src/createElement.mjs', import.meta.url).pathname);
    if (!imp.startsWith('.')) {
      imp = `./${imp}`;
    }
    content.unshift(`import { ${[...usedNS].join(', ')} } from '${imp}';`);
  }
  const tfn = join(dir, `${name}.mjs`);
  return writeFile(tfn, content.join('\n\n'), 'utf-8');
};

await toComponentSource(process.argv[2]);