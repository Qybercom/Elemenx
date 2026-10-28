<!-- generated -->
# Formulas

Formulas written as in LaTeX, drawn by the browser as MathML. MathML(text, display) returns the markup of a <math> (display: true for a formula on a line of its own); a text it cannot read returns the text in an <merror>. The part of LaTeX it reads: numbers, letters (italic) and words of functions (\sin, \log, \lim...), the operators (+ - = < > ( ) [ ] | ! , and \cdot \times \div \pm \mp \le \ge \ne \approx \equiv \to \infty \partial \nabla \in \notin \subset \cup \cap \forall \exists \ldots \cdots...), the Greek letters (\alpha... \Omega), groups { }, ^ and _ (powers, indices, both), \frac and \dfrac, \sqrt and \sqrt[n], \sum, \prod, \int, \oint and \lim with their limits (under and over in a display), \left and \right, \hat, \bar, \vec, \dot, \tilde, \overline, \underline, \text, \mathrm, \mathbf, \mathbb, spaces (\, \: \; \quad \qquad), and the matrices \begin{matrix}, pmatrix, bmatrix, vmatrix and cases (& between the cells, \\ between the rows).

## Methods

- `MathML(text, display)`

## Example

```example
<TextArea Rows="2" [value]="Text" (input)="Typed" />
<div [property.innerHTML]="MathML(Text)"></div>
<script>
({
	Text: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',

	$OnCreate: function () {
		var formulas = this.$Service('Formulas');

		this.MathML = function (text) {
			return formulas.MathML(text, true);
		};
	},

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```

## Tests

- [Formulas: LaTeX as MathML, a fraction, a root, powers and indices, a display formula, and an error for what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-services.test.js#L76) — `tests/regression/library-services.test.js`
