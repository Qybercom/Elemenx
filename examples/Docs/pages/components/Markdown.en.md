<!-- generated -->
# Markdown

A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike and the fenced code of GitHub) and kept to its schema, so nothing in it runs. The code of a fence that names its language (```js) is highlighted by the Syntax Service (Highlight, on by default). Look: 'document' (the default) looks as the text of a RichEditor (the classes of elemenx-document); 'interface' takes the classes of the interface of the Library instead, as a page of an Application: a table is an elemenx-table, a list an elemenx-ul or an elemenx-ol, a quote an elemenx-callout, a link an elemenx-link, code (a block or in a line) an elemenx-code, a rule an elemenx-divider. Without Value the text is the body of the element (<Markdown>## A title</Markdown>), without the indentation its lines share: the body follows its changes. The plugins of the RichText Service draw what Markdown has no element for: ```mermaid a Diagram, ```chart a Chart, ::: warning a callout... (RichText.Extend adds more).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Highlight` | `true` |
| `Look` | `'document'` |
| `Label` | `''` |

## Slots

default

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="flex: 1 1 260px;"><TextArea [value]="Text" Rows="12" (input)="Typed" /></div>
	<div style="flex: 1 1 260px;">
		<RadioGroup Variant="segmented" Size="small" Label="Look" [options]="Looks" [value]="Look" (change)="Looked" />
		<Markdown [value]="Text" [look]="Look" />
	</div>
</div>
<script>
({
	Text: '## Release notes\n\nSome **bold**, some *italic*, ~~a strike~~ and a [link](https://example.com).\n\n- Faster lists\n- New icons\n\n| Size | Time |\n| --- | --- |\n| 1 000 | 4 ms |\n| 10 000 | 31 ms |\n\n```js\nvar app = Elemenx.Application({});\n```\n\n> Raw HTML is kept to the schema: nothing in it runs.\n',

	Look: 'document',
	Looks: [{Value: 'document', Label: 'document'}, {Value: 'interface', Label: 'interface'}],

	Looked: function (value) {
		this.Look = value;
	},

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```

## Tests

- [describes the extensions once, in editors/extension.json, with a description in Markdown and a logo](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/editors-branding.test.js#L18) — `tests/regression/editors-branding.test.js`
- [is the plugin of a ```mermaid fence in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-diagrams.test.js#L255) — `tests/regression/library-diagrams.test.js`
- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [reads the code of a fenced block of Markdown in the language it names](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/syntax.test.js#L129) — `tests/regression/syntax.test.js`
- [writes the text of a Markdown and the code of a CodeView as their body, edited in a field of many lines](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L1289) — `tests/examples/builder.spec.js`
- [Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1794) — `tests/examples/ui-kit.spec.js`
- [a Markdown document takes the classes of the interface with Look interface, and the look of a RichEditor by default](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1923) — `tests/examples/ui-kit.spec.js`
- [rich editor formats from the toolbar of the page and from its menu, makes blocks of Markdown and pastes through its schema](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6000) — `tests/examples/ui-kit.spec.js`
- [rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6117) — `tests/examples/ui-kit.spec.js`

+1 more in the same files
