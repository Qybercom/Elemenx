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
