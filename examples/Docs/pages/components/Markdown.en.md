<!-- generated -->
# Markdown

A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike and the fenced code of GitHub) and kept to its schema, so nothing in it runs. The code of a fence that names its language (```js) is highlighted by the Syntax Service (Highlight, on by default). It looks as the text of a RichEditor (the classes of elemenx-document).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Highlight` | `true` |
| `Label` | `''` |

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div style="flex: 1 1 260px;"><TextArea [value]="Text" Rows="12" (input)="Typed" /></div>
	<div style="flex: 1 1 260px;"><Markdown [value]="Text" /></div>
</div>
<script>
({
	Text: '## Release notes\n\nSome **bold**, some *italic*, ~~a strike~~ and a [link](https://example.com).\n\n- Faster lists\n- New icons\n\n| Size | Time |\n| --- | --- |\n| 1 000 | 4 ms |\n| 10 000 | 31 ms |\n\n```js\nvar app = Elemenx.Application({});\n```\n\n> Raw HTML is kept to the schema: nothing in it runs.\n',

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```
