# markdown-it-directive-webcomponents

[中文指南](README.zh.md)

This plugin can convert a markdown directive ([Generic directives/plugins syntax spec](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444)) to a web component ([WebComponents](https://developer.mozilla.org/en-US/docs/Web/Web_Components)). It needs [markdown-it-directive](https://github.com/hilookas/markdown-it-directive) and [markdown-it](https://github.com/markdown-it/markdown-it) as dependencies.

## Install

`npm i markdown-it-directive-webcomponents`

## API

```javascript
const md = require('markdown-it')()
  .use(require('markdown-it-directive-webcomponents'), {
    components: [
      {
        present: 'both',
        name: 'directive-name',
        tag: 'tag-name',
        parseInner: true
      },
    ]
  });
```

- `components`: Write conversion rules in this array
  - `present`: Which type of directive to parse. Values: `inline`, `block`, `both`.
  - `name`: The name of the directive
  - `tag`: The tag name of the converted component
  - `allowedAttrs`: Allowed attribute names. If set as an array, elements in the array can be a String or a RegEx. If not set, allow any name. (has security issues, not recommended)
  - `parseInner`: Whether to continue to parse the content as Markdown or not. Bool type. if it is `false`, the content will be unescaped and written in the output.


[DOMPurify](https://github.com/cure53/DOMPurify) is recommended as a security backup.

Here are three directive formats that can be recognized:

```text
text before :directive-name[content](/link "destination" /another "one"){.class #id name=value name="string!"} text after

:: directive-name [inline content] (/link "destination" /another "one") {.class #id name=value name="string!"} content title ::

::: directive-name [inline content] (/link "destination" /another "one") {.class #id name=value name="string!"} content title ::
content
:::
```

Will be converted to:

```html
<p>text before <tag-name class="class" id="id" name="value" src="/link" title="destination" inline="">content</tag-name> text after</p>

<tag-name class="class" id="id" name="value" src="/link" title="destination">inline content</tag-name>

<tag-name class="class" id="id" name="value" src="/link" title="destination">
<p>content</p>
</tag-name>
```

In the conversion process, link-type value which in `()` will add to `src` attribute, and string-type value will add to `title` attribute. `class`'s values will be merged together and other attributes will pick the first value.

Block-level directive, if it is the third case, it will ignore the inline content and content title, and parse the content as block; if the second case, if there is, then use inline content otherwise use content title as content and parse the content as inline.

## Example

```javascript
const md = require('markdown-it')()
  .use(require('markdown-it-directive-webcomponents'), {
    components: [
      {
        present: 'both',
        name: 'directive-name',
        tag: 'tag-name',
        allowedAttrs: [ 'inline', 'src', 'title', /^prefix/ ],
        parseInner: true
      },
      {
        present: 'both',
        name: 'another-directive',
        tag: 'another-tag',
        allowedAttrs: [ 'inline', 'src', 'title', /^prefix/ ],
        parseInner: false
      },
    ]
  });

console.dir(md.render(`
text before :directive-name[content](/link "destination" /another "one"){.class #id name=value name="string!"} text after

:: directive-name [inline content] (/link "destination" /another "one") {.class #id name=value name="string!"} content title ::

::: directive-name [inline content] (/link "destination" /another "one") {.class #id name=value name="string!"} content title ::
content
:::

::: another-directive
content
\\:::
:::`));

/* output

<p>text before <tag-name class="class" id="id" name="value" src="/link" title="destination" inline="">content</tag-name> text after</p>
<tag-name class="class" id="id" name="value" src="/link" title="destination">inline content</tag-name>
<tag-name class="class" id="id" name="value" src="/link" title="destination">
<p>content</p>
</tag-name>
<another-tag>
content
:::
</another-tag>

*/
```

More examples can be found in `test.js`.

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020, lookas