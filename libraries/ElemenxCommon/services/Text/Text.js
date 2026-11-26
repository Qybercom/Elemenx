/*
 * The texts of markup: what goes into HTML, SVG or XML as it is written, escaped once for every Library.
 * - Escape(value): the text of an attribute or of an element, & < > and " as entities (&amp; &lt; &gt; &quot;).
 * - EscapeText(value): the text of an element alone, & < > as entities (a " is kept).
 * A value is made a text first (null and undefined as 'null' and 'undefined', as String does).
 */
Elemenx.Service('Text', {
	$Meta: {
		Description: 'The texts of markup: what goes into HTML, SVG or XML, escaped.',
		Methods: ['Escape(value)', 'EscapeText(value)']
	},
	Escape: function (value) {
		var text = String(value);

		return /[&<>"]/.test(text) ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : text;
	},

	EscapeText: function (value) {
		var text = String(value);

		return /[&<>]/.test(text) ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : text;
	}
});
