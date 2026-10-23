/*
 * A formula written as in LaTeX (the part the Formulas Service reads: fractions, roots, powers and indices, sums and
 * integrals with their limits, Greek letters, matrices...), drawn by the browser as MathML. Value is the formula;
 * Display puts it on a line of its own, centered and larger, instead of in the line of the text; Label is what a
 * screen reader says of it (by default the formula as it is written).
 */
Elemenx.Component('Formula', {
	$TemplateURL: 'Formula.html',
	$StyleURL: 'Formula.css',
	$Meta: {
		Group: 'text',
		Icon: 'shapes',
		Description: 'A formula written as in LaTeX (the part the Formulas Service reads: fractions, roots, powers and indices, sums and integrals with their limits, Greek letters, matrices...), drawn by the browser as MathML.',
		Props: {
			Value: 'The formula, written as in LaTeX.',
			Display: 'On a line of its own, centered and larger.',
			Label: 'What a screen reader says of it (the formula as written by default).'
		},
		Sample: {Value: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', Display: true}
	},
	Value: '',
	Display: false,
	Label: '',

	$OnCreate: function () {
		var self = this;

		/* The MathML of the formula, put into the element (a new object for a new formula or display). */
		this.Drawn = function (value, display) {
			var markup = self.$Service('Formulas').MathML(value, display === true || display === 'true');

			return {
				Render: function (container) {
					container.innerHTML = markup;
				}
			};
		};
	}
});
