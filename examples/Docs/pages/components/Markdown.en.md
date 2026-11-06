<!-- generated -->
# Markdown

A document written in Markdown, shown: Value is read by the RichText Service (CommonMark with the tables, the strike and the fenced code of GitHub) and kept to its schema, so nothing in it runs. The code of a fence that names its language (```js) is highlighted by the Syntax Service (Highlight, on by default). Look: 'document' (the default) looks as the text of a RichEditor (the classes of elemenx-document); 'interface' takes the classes of the interface of the Library instead, as a page of an Application: a table is an elemenx-table, a list an elemenx-ul or an elemenx-ol, a quote an elemenx-callout, a link an elemenx-link, code (a block or in a line) an elemenx-code, a rule an elemenx-divider. Without Value the text is the body of the element (<Markdown>## A title</Markdown>), without the indentation its lines share: the body follows its changes. The plugins of the RichText Service draw what Markdown has no element for: ```mermaid a Diagram, ```chart a Chart, ::: warning a callout... (RichText.Extend adds more).

The items of a list that start with [ ] or [x] (- [ ] buy milk) are tasks, a box of each: Tasks 'readonly' (the default) shows them, 'editable' lets them be ticked. TaskCheck (a function of the item {Index, Checked, Text}, true or false) says whether this one may be (only the owner of a list, only an admin...): false keeps it as it was and tells taskdenied. A tick writes [x] or [ ] into the text, and tells task ({Index, Checked, Text, Value}) and change ({Value}).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Highlight` | `true` |
| `Look` | `'document'` |
| `Tasks` | `'readonly'` |
| `TaskCheck` | `null` |
| `Label` | `''` |

## Events

- `taskdenied`: A tick that TaskCheck refused: {Index, Checked, Text}.
- `task`: A task was ticked or unticked: {Index, Checked, Text, Value (the text with it)}.
- `change`: The text changed by a tick: {Value}.

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
- [draws a box for each task, ticked as written, only shown by default](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/markdown-tasks.test.js#L32) — `tests/regression/markdown-tasks.test.js`
- [ticks a task when editable: writes it into the text and tells task and change; TaskCheck refuses whom it will](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/markdown-tasks.test.js#L48) — `tests/regression/markdown-tasks.test.js`
- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L203) — `tests/regression/rich-plugins.test.js`
- [reads a topology of nodes and links, their icons, statuses and details, and Markdown draws it by Topology](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L238) — `tests/regression/rich-plugins.test.js`
- [writes the text of a Markdown and the code of a CodeView as their body, edited in a field of many lines](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/designer.spec.js#L1475) — `tests/examples/designer.spec.js`
- [Mod+F finds and Mod+H replaces in the editors, Mod+F finds in a terminal; viewers show Markdown and code, formulas are drawn as MathML](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1795) — `tests/examples/ui-kit.spec.js`

+5 more in the same files
