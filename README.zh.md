# markdown-it-directive-webcomponents

这个插件可以将 markdown 指令（[Generic directives/plugins syntax spec](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444)）转换为一个 web component （[WebComponents](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components)）。为了使用该插件，你需要安装依赖项 [markdown-it-directive](https://github.com/hilookas/markdown-it-directive) 和 [markdown-it](https://github.com/markdown-it/markdown-it)。

## 安装

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
        allowedAttrs: [ 'inline', 'src', 'title', /^prefix/ ],
        destLinkName: 'my-link-name',
        destStringName: 'my-string-name',
        parseInner: true
      },
    ]
  });
```

- `components`：将转换规则写在这个数组里
  - `present`：解析哪种类型的指令，可以是 `inline`, `block`, `both`
  - `name`：指令的名称
  - `tag`：转换后组件的标签名
  - `allowedAttrs`：允许使用的属性名，一个数组，数组内元素可以是字符串或者正则表达式，如果不设置则代表无限制（有安全风险，不建议）
  - `destLinkName`：Link Destination （即 `()` 中的内容）中链接类型的数据转换为属性时的属性名，默认为 `src`
  - `destStringName`：Link Destination 中字符串类型的数据转换为属性时的属性名，默认为 `title`
  - `parseInner`：是否将内容作为 Markdown 继续解析，Bool 类型，如果为 `false`，会将内容进行反转义后写到输出（html 的 `< >` 等符号仍然会被转义掉）

推荐使用 [DOMPurify](https://github.com/cure53/DOMPurify) 作为安全兜底措施。

以下是三种可以被识别的指令格式：

```text
text before :directive-name[content](/link "destination" /another "one"){.class #id name=value name="string!"} text after

:: directive-name [inline content] (/link "destination" /another "one") {.class #id name=value name="string!"} content title ::

::: directive-name [inline content] (/link "destination" /another "one") {.class #id name=value name="string!"} content title ::
content
:::
```

该插件会分别转换为：

```html
<p>text before <tag-name class="class" id="id" name="value" src="/link" title="destination" inline="">content</tag-name> text after</p>

<tag-name class="class" id="id" name="value" src="/link" title="destination">inline content</tag-name>

<tag-name class="class" id="id" name="value" src="/link" title="destination">
<p>content</p>
</tag-name>
```

其中在转换的过程中 link destinations （即括号中的那些），链接类型的值会添加到 `src` 属性，字符串类型的值会添加到 `title` 属性。`class` 属性会合并到一起，其他属性只会选取第一次出现的值。

块级别的指令，如果为第三种情况，会忽略 inline content 以及 content title，并且将 content 以块来解析；如果为第二种情况，如果有，则使用 inline content 否则使用 content title 作为 content，以内联级别来解析。

## 样例

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

更多样例可以参见 `test.js` 文件。

## 协议

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020, lookas