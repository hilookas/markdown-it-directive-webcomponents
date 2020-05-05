'use strict';

const MarkdownIt = require('markdown-it');
const directivePlugin = require('markdown-it-directive');
const webcomponenetsPlugin = require('.');

function assert(condition) {
  if (!condition) {
    throw new Error();
  }
}

function test() {
  for (const case_ of cases) {
    case_[1]()
  }
  console.info('OK.');
}

const cases = [
  [ 'case1', () => {
    const md = (new MarkdownIt())
      .use(directivePlugin)
      .use(webcomponenetsPlugin, {
        components: [
          {
            present: 'inline',
            name: 'aaa',
            tag: 'aaa',
            parseInner: true
          },
          {
            present: 'block',
            name: 'bbb',
            tag: 'bbb',
            parseInner: true
          },
          {
            present: 'both',
            name: 'ccc',
            tag: 'ccc',
            parseInner: true
          },
          {
            present: 'both',
            name: 'ddd',
            tag: 'ddd',
            parseInner: false
          }
        ]
      });
    
    // should parse recursively
    // should unescape \]
    assert(
      md.render(':aaa[aaa:aaa[]{.2333}\\]\n](/aaa /bbb){src="aaaa"}')
      ===
      '<p><aaa src="aaaa">aaa<aaa class="2333"></aaa>]\n</aaa></p>\n'
    );
    
    // should use inlineContent instead of contentTitle
    // should merge css
    assert(
      md.render(`::bbb[aaa:aaa[]{.2333 .666}\\]](/aaa /bbb){src="aaaa"} aaa:::`)
      ===
      '<bbb src="aaaa">aaa<aaa class="2333 666"></aaa>]</bbb>\n'
    );
    
    // should unescape :::
    assert(
      md.render(`:::bbb
\\:::
:::`)
      ===
      '<bbb>\n<p>:::</p>\n</bbb>\n'
    );

    // should unescape :::
    // should not parse content
    assert(
      md.render(`:::ddd
\\:::
:[
:::`)
      ===
      '<ddd>\n:::\n:[\n</ddd>\n'
    );
    
    // should keep first attr
    assert(
      md.render(`::bbb[233]{data-a="aaaa" data-a="000" data-b="666"} aaa:::`)
      ===
      '<bbb data-a="aaaa" data-b="666">233</bbb>\n'
    );
    
    // should not parse as a block
    assert(
      md.render('::aaa')
      ===
      '<p>:<aaa></aaa></p>\n'
    );
  } ],
];

test();
