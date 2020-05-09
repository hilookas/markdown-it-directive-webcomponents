'use strict';

const { unescapeAll } = require('markdown-it/lib/common/utils');

function pushAttr(attrs, key, value) {
  if (typeof attrs[key] === 'undefined') {
    attrs[key] = value;
  } else if (!Array.isArray(attrs[key])) {
    attrs[key] = [ attrs[key], value ];
  } else {
    attrs[key].push(value);
  }
}

function mergeAttr(attrs, key) {
  if (!Array.isArray(attrs[key])) return attrs[key];

  let rst = '';
  let addSpace = false;
  for (const value of attrs[key]) {
    if (addSpace) rst += ' ';
    addSpace = true;
    rst += value;
  }
  return rst;
}

function isAllowedAttrs(compiledAllowedAttrs, name) {
  if (typeof compiledAllowedAttrs === 'undefined') return true; // default allow all
  const { regexs, names } = compiledAllowedAttrs;
  if (names[name]) return true;
  for (const regex of regexs) {
    if (regex.test(name)) return true;
  }
  return false;
}

function compileAllowedAttrs(allowedAttrs) {
  if (typeof allowedAttrs === 'undefined') return undefined;
  const regexs = [], names = {};
  for (const x of allowedAttrs) {
    if (x instanceof RegExp) {
      regexs.push(x);
    } else {
      names[x] = true;
    }
  }
  return { regexs, names };
}

function getTokenAttrs(attrs, dests, isInline, compiledAllowedAttrs) {
  dests = dests || [];
  attrs = attrs || {};

  // merge dests and attrs
  for (const dest of dests) {
    if (dest[0] === 'link') {
      // link
      pushAttr(attrs, 'src', dest[1]);
    } else {
      // string
      pushAttr(attrs, 'title', dest[1]);
    }
  }

  // merge class
  if (attrs.class) {
    attrs.class = mergeAttr(attrs, 'class');
  }

  if (isInline) {
    attrs.inline = '';
  } else {
    delete attrs.inline;
  }

  const rstAttrs = [];
  for (const key in attrs) {
    if (isAllowedAttrs(compiledAllowedAttrs, key)) {
      rstAttrs.push([
        key,
        Array.isArray(attrs[key]) ? attrs[key][0] : attrs[key]
      ]);
    }
  }
  return rstAttrs;
}

function inlineHandler(
  tag, parseInner, compiledAllowedAttrs,
  state, content, dests, attrs,
  contentStart, contentEnd, directiveStart, directiveEnd
) {
  content = content || '';

  let token = state.push('component_open', tag, 1);
  token.attrs = getTokenAttrs(attrs, dests, true, compiledAllowedAttrs);
  if (parseInner) {
    const oldMax = state.posMax;
    state.pos = contentStart;
    state.posMax = contentEnd;

    state.md.inline.tokenize(state);

    state.posMax = oldMax;
  } else {
    token = state.push('text', '', 0);
    token.content = unescapeAll(content);
  }
  token = state.push('component_close', tag, -1);
}

function blockHandler(
  tag, parseInner, compiledAllowedAttrs,
  state, content, contentTitle, inlineContent, dests, attrs,
  contentStartLine, contentEndLine,
  contentTitleStart, contentTitleEnd,
  inlineContentStart, inlineContentEnd,
  directiveStartLine, directiveEndLine
) {
  let inlineMode = false;
  if (typeof content === 'undefined') {
    inlineMode = true;
    if (typeof inlineContent === 'undefined') {
      content = contentTitle;
    } else {
      content = inlineContent;
    }
  }

  let token = state.push('component_open', tag, 1);
  token.map = [ directiveStartLine, directiveEndLine ];
  token.attrs = getTokenAttrs(attrs, dests, false, compiledAllowedAttrs);
  if (parseInner) {
    if (inlineMode) {
      token = state.push('inline', '', 0);
      token.content = content;
      token.map = [ directiveStartLine, directiveStartLine + 1 ];
      token.children = [];
    } else {
      const oldMax = state.lineMax;
      state.line = contentStartLine;
      state.lineMax = contentEndLine;
  
      state.md.block.tokenize(state, contentStartLine, contentEndLine);
  
      state.lineMax = oldMax;
    }
  } else {
    token = state.push('text', '', 0);
    token.content = unescapeAll(content);
  }
  token = state.push('component_close', tag, -1);
}

const DIRECTIVE_NAME_RE = /^[a-z][a-z0-9\-_]*/i; // copy from markdown-directive
// given frameworks like Vue have less restriction set of chars,
// not fully follow thewebcomponent spec
// https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
const TAG_NAME_RE = /^[a-z][a-z0-9\-_]*/i;

function load(md, options) {
  if (!md.inlineDirectives) throw new Error('markdown-it-directive is required');
  options = Object.assign({ components: [] }, options);

  for (let component of options.components) {
    component = Object.assign({ present: 'both', parseInner: false }, component);
    const { present, name, tag, parseInner, allowedAttrs } = component;

    if (!DIRECTIVE_NAME_RE.test(name)) throw new Error('Invalid directive name');
    if (!TAG_NAME_RE.test(tag)) throw new Error('Invalid tag name');

    const compiledAllowedAttrs = compileAllowedAttrs(allowedAttrs);

    if (present === 'both') {
      md.inlineDirectives[name] = (...args) => inlineHandler(tag, parseInner, compiledAllowedAttrs, ...args);
      md.blockDirectives[name] = (...args) => blockHandler(tag, parseInner, compiledAllowedAttrs, ...args);
    } else if (present === 'inline') {
      md.inlineDirectives[name] = (...args) => inlineHandler(tag, parseInner, compiledAllowedAttrs, ...args);
    } else if (present === 'block') {
      md.blockDirectives[name] = (...args) => blockHandler(tag, parseInner, compiledAllowedAttrs, ...args);
    } else {
      throw new Error('Invalid present param');
    }
  }
}

module.exports = load;
