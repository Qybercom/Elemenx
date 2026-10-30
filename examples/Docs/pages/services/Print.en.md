<!-- generated -->
# Print

Printing of a part of the page: the browser prints a frame of its own with a copy of that part and the stylesheets of the page (and of the shadow root the part is in), so the rest of the page stays out. A PDF comes from the print dialog of the browser (Save as PDF). There is no button for it: components and Applications call it.

- Element(target, options, callback) prints target: a DOM node (copied, it stays where it is) or a text of HTML. Options: Title (of the document: the name a PDF gets), Theme ('light' by default; another name of the Theme Service, or false for the theme of the page), Class (classes of the body of the frame), Style (more CSS), Margin (of the page, '16mm' by default) and Language (the lang of the document; the page's by default). callback(error) once the dialog of the browser closes.
- Document(target, options) returns the HTML of the document Element prints.

## Methods

- `Document(target, options)`
- `Element(target, options, callback)`

## Example

```example
<div class="docs-invoice elemenx-card" style="padding: 16px;">
	<h3>Invoice 2026-104</h3>
	<table class="elemenx-table compact">
		<tr><th>Item</th><th>Price</th></tr>
		<tr><td>Hosting, October</td><td>€ 24.00</td></tr>
		<tr><td>Support</td><td>€ 60.00</td></tr>
	</table>
</div>
<Button Label="Print the invoice" Icon="print" Variant="primary" (click)="Print" />
<span class="elemenx-text small muted">Only the invoice prints, in the light theme; the dialog of the browser saves it as PDF.</span>
<script>
({
	Print: function () {
		this.$Service('Print').Element(this.$Element().querySelector('.docs-invoice'), {Title: 'Invoice 2026-104', Margin: '20mm'}, function () {});
	}
})
</script>
```

## Tests

- [code editor finds and replaces, switches languages, wraps and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6324) — `tests/examples/ui-kit.spec.js`
- [rich editor reads and writes Markdown, edits tables, inserts images and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6544) — `tests/examples/ui-kit.spec.js`
