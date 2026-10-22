<!-- generated -->
# RichText

The document of rich text: the HTML RichEditor keeps and the Markdown it reads and writes.

- Sanitize(html) keeps only the schema of the document: paragraphs, headings h1-h4, quotes, preformatted code, lists, rules, tables, images and links, with strong, em, u, s, code and line breaks inside. Other tags give their text (b becomes strong, i em, strike and del s, h5 and h6 h4); scripts, styles, frames, forms and their content go. Attributes go too, but href and title of a link (http, https, mailto, tel or a relative URL), src and alt of an image (also a data: URL of a picture), colspan and rowspan of a cell and start of a list. Text outside a block goes into a paragraph.
- ToMarkdown(html) and FromMarkdown(text): the document as Markdown (CommonMark with the tables, the strike and the fenced code of GitHub) and back. Underline has no Markdown: it stays <u>.
- Text(html) is the plain text of a document, a line for each block.

The HTML is read in an inert template: nothing of it runs or loads while it is read.

## Methods

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
