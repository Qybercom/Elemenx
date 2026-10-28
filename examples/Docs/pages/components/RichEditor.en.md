<!-- generated -->
# RichEditor

An editor of rich text (WYSIWYG). Value is the HTML of the document, kept to the schema of the RichText Service (paragraphs, headings, quotes, code, lists, tables, images, links and the inline styles); paste and drop go through it too. It has no toolbar: the controls of an Application call Command, and a small menu over a selection gives the quick styles (Menu false hides it).

- Value, Placeholder, ReadOnly, Disabled, Label, Rows (the least height in lines) and MaxRows (the most, then it scrolls; 0 grows with the text), Menu.
- Command(name, value): bold, italic, underline, strike, code; paragraph, heading (value 1-4), quote, codeblock; bullets, numbers, indent, outdent; link (value: the URL; empty removes it), unlink; image (value: {Src, Alt} or the URL), table (value: {Rows, Columns}), row, column, row-delete, column-delete, table-delete; rule; clear; undo, redo; plugin (value: the name of a plugin of the RichText Service, or {Name, Text, Attributes}: a diagram, a chart, a callout..., its Insert data by default). It returns false for a name it does not know or while it cannot edit.
- A plugin in the document is one block the caret does not enter, drawn by its Component; a double press edits its text in place (its own editor when it has Edit), Mod+Enter or leaving it keeps the text, Escape leaves it as it was.
- Typing Markdown at the start of a paragraph makes blocks: '# ' to '#### ' headings, '- ' a list, '1. ' a numbered list, '> ' a quote, '``` ' code. Keys: Mod+B, Mod+I, Mod+U, Mod+E (code), Mod+K (the link event), Tab and Shift+Tab in a list nest its items.
- Methods: Focus(), Formats() (what the selection has: {Bold, Italic, Underline, Strike, Code, Block, Level, List, Link, Table}), Insert(html), Markdown(), SetMarkdown(text), Text(), Print(options, callback), Find(query, {Case, Word, RegExp}) (returns the count of matches, marks them by the Find Service and shows the one at the caret or after it), FindNext(), FindPrevious(), ReplaceCurrent(text), ReplaceAll(text), ClearFind().
- Mod+F opens its find bar (a FindBar over its corner), Mod+R (or Mod+H) with the replace row; FindBar: false leaves it out.
- Events: input and change (Value), formats (Formats() as the selection moves), link ({Href, Text}: Mod+K, for a dialog of the Application), files (the files pasted or dropped: the Application uploads them and inserts images by Command), ready (the editor).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Placeholder` | `''` |
| `ReadOnly` | `false` |
| `Disabled` | `false` |
| `Label` | `''` |
| `Rows` | `8` |
| `MaxRows` | `24` |
| `Menu` | `true` |
| `FindBar` | `true` |

## Events

- `ready`: The editor is ready: the component itself, to call Command.
- `input`: The document changed: its HTML.
- `formats`: The styles at the caret changed: {Bold, Italic, Underline, Strike, Code, Block, Level, Quote, List, Link, Table}, to light the buttons of a toolbar.
- `link`: A link was pressed: {Href, Text}.
- `files`: Files were pasted or dropped: a list of File, for the Application to upload.
- `change`: The document was committed when the focus left: Value.

## Methods

- `Find(query, options)`
- `FindNext()`
- `FindPrevious()`
- `ReplaceCurrent(text)`
- `ReplaceAll(text)`
- `ClearFind()`
- `Formats()`
- `Command(name, value)`
- `Focus()`
- `Insert(html)`
- `Markdown()`
- `SetMarkdown(text)`
- `Text()`
- `Print(options, callback)`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Button Icon="bold" Title="Bold" Size="small" [pressed]="Formats.Bold" (click)="Bold" />
	<Button Icon="italic" Title="Italic" Size="small" [pressed]="Formats.Italic" (click)="Italic" />
	<Button Label="H2" Size="small" (click)="Heading" />
	<Button Icon="list" Title="A list" Size="small" (click)="Bullets" />
	<Button Icon="undo" Title="Undo" Size="small" (click)="Undo" />
	<Button Label="As Markdown" Size="small" (click)="Export" />
</div>
<RichEditor Rows="5" [value]="Html" (ready)="Ready" (formats)="Moved" (change)="Changed" />
<pre class="elemenx-code" *if="Output">{{Output}}</pre>
<script>
(function () {
	var editor = null;

	return {
		Html: '<h2>Notes</h2><p>Select some <strong>text</strong> to see the quick menu. Type <code>- </code> at the start of a line for a list.</p>',
		Formats: {},
		Output: '',

		Ready: function (instance) {
			editor = instance;
		},

		Moved: function (formats) {
			this.Formats = formats;
		},

		Changed: function (html) {
			this.Html = html;
		},

		Bold: function () {
			editor.Command('bold');
		},

		Italic: function () {
			editor.Command('italic');
		},

		Heading: function () {
			editor.Command('heading', 2);
		},

		Bullets: function () {
			editor.Command('bullets');
		},

		Undo: function () {
			editor.Command('undo');
		},

		Export: function () {
			this.Output = editor.Markdown();
		}
	};
})()
</script>
```
