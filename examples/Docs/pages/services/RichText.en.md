<!-- generated -->
# RichText

The document of rich text: the HTML RichEditor keeps and the Markdown it reads and writes.

- Sanitize(html) keeps only the schema of the document: paragraphs, headings h1-h4, quotes, preformatted code, lists, rules, tables, images and links, with strong, em, u, s, code and line breaks inside. Other tags give their text (b becomes strong, i em, strike and del s, h5 and h6 h4); scripts, styles, frames, forms and their content go. Attributes go too, but href and title of a link (http, https, mailto, tel or a relative URL), src and alt of an image (also a data: URL of a picture), colspan and rowspan of a cell and start of a list. Text outside a block goes into a paragraph.
- ToMarkdown(html) and FromMarkdown(text): the document as Markdown (CommonMark with the tables, the strike and the fenced code of GitHub) and back. Underline has no Markdown: it stays <u>.
- Text(html) is the plain text of a document, a line for each block.
- Plugins: what the schema has no element for, drawn by a Component or a function of its own. Extend(plugin) adds one (see Extend below); in Markdown it is a fence of its language (```mermaid), a block of a directive (::: warning title="Careful" ... :::) or an inline (:name[text]{key=value}), in the HTML a node of its data (data-elemenx-plugin, data-elemenx-data) that Sanitize keeps and ToMarkdown writes back as it was. Mount(container, options) draws the plugins of a document (Markdown and RichEditor do), {Destroy()} takes them away. Built in: diagram (```mermaid or ```diagram, the Diagram Component), chart (```chart, a JSON of the props of Chart), qrcode (```qr), barcode (```barcode format=ean13), callout (::: info, note, tip, success, warning, danger; title=...) and files (```files, ```tree or ```filetree: a tree of folders and files by its indents, drawn by FileBrowser as a tree; view=list, height=..., details=true) and topology (```topology or ```network: a graph of nodes and links drawn by Topology, TopologyOf below; layout=..., direction=...). Plugins() lists their names.
- FileTree(text): the Items of FileBrowser of such a text: a line a file, its depth by its indent (spaces, tabs, and the lines of the tree command: │ ├── └──); a folder ends with / or has lines under it; what follows two spaces and # is a comment, left out. The ID of an item is its path.

The HTML is read in an inert template: nothing of it runs or loads while it is read.

## Methods

- `FileTree(text)`
- `Extend(plugin)`
- `Plugins()`
- `Mount(container, options)`
- `Sanitize(html)`
- `Text(html)`
- `ToMarkdown(html)`
- `FromMarkdown(text)`

## Example

```example
<TextArea Rows="4" [value]="Html" (input)="Typed" />
<Properties>
	<Property Label="Sanitized" [value]="Clean(Html)" />
	<Property Label="Markdown" [value]="Markdown(Html)" />
	<Property Label="Text" [value]="Text(Html)" />
</Properties>
<script>
({
	Html: '<h2 onclick="alert(1)">Title</h2><p>Some <b>bold</b> and <a href="javascript:alert(1)">a link</a>.</p><script>alert(1)<\/script>',

	$OnCreate: function () {
		var rich = this.$Service('RichText');

		this.Clean = function (html) {
			return rich.Sanitize(html);
		};

		this.Markdown = function (html) {
			return rich.ToMarkdown(html);
		};

		this.Text = function (html) {
			return rich.Text(html);
		};
	},

	Typed: function (value) {
		this.Html = value;
	}
})
</script>
```

## Tests

- [reads fences, directives and inlines of plugins into their nodes, keeps them through Sanitize and writes them back as they were](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L33) — `tests/regression/rich-plugins.test.js`
- [Markdown draws its plugins by their Components and functions, highlights the other fences, and takes them away again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L75) — `tests/regression/rich-plugins.test.js`
- [Markdown in an Application draws a plugin whose Component its Library has not loaded yet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L102) — `tests/regression/rich-plugins.test.js`
- [RichEditor draws its plugins as blocks the caret does not enter, puts one in by Command, edits its text in place, and writes it in Markdown](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L132) — `tests/regression/rich-plugins.test.js`
- [reads a tree of files by its indents, of spaces or of the lines of tree, and Markdown draws it by FileBrowser as a tree](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L203) — `tests/regression/rich-plugins.test.js`
- [reads a topology of nodes and links, their icons, statuses and details, and Markdown draws it by Topology](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-plugins.test.js#L238) — `tests/regression/rich-plugins.test.js`
- [takes away a link and an image whose URL hides javascript: behind %s](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-text.test.js#L28) — `tests/regression/rich-text.test.js`
- [keeps the URLs it allows, without the characters a browser drops](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/rich-text.test.js#L34) — `tests/regression/rich-text.test.js`
