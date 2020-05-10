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
          },
          {
            present: 'both',
            name: 'eee',
            tag: 'eee',
            allowedAttrs: [ 'hello', /^a/, /^233/ ],
            parseInner: false
          },
          {
            present: 'both',
            name: 'fff',
            tag: 'fff',
            allowedAttrs: [ 'my-id', 'my-id2', /^a/, /^233/ ],
            destLinkName: 'my-id',
            destStringName: 'my-id2',
            parseInner: false
          }
        ]
      });
    
    // should parse recursively
    // should unescape \]
    assert(
      md.render(':aaa[aaa:aaa[]{.2333}\\]\n](/aaa /bbb){src="aaaa"}')
      ===
      '<p><aaa src="aaaa" inline="">aaa<aaa class="2333" inline=""></aaa>]\n</aaa></p>\n'
    );
    
    // should use inlineContent instead of contentTitle
    // should merge css
    assert(
      md.render(`::bbb[aaa:aaa[]{.2333 .666}\\]](/aaa /bbb){src="aaaa"} aaa:::`)
      ===
      '<bbb src="aaaa">aaa<aaa class="2333 666" inline=""></aaa>]</bbb>\n'
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
      '<p>:<aaa inline=""></aaa></p>\n'
    );
    
    // should filter the attrs
    assert(
      md.render(':eee[2333]{aa=123 .class onclick="alert(\'surprise!\')"}')
      ===
      '<p><eee aa="123">2333</eee></p>\n'
    );
    
    // should rename the dest link and string name 
    assert(
      md.render(':fff[](233 "666"){aa=123 .class onclick="alert(\'surprise!\')"}')
      ===
      '<p><fff aa="123" my-id="233" my-id2="666"></fff></p>\n'
    );
  } ],
];

test();
