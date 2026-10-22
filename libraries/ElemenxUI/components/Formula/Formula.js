/*
 * A formula written as in LaTeX (the part the Formulas Service reads: fractions, roots, powers and indices, sums and
 * integrals with their limits, Greek letters, matrices...), drawn by the browser as MathML. Value is the formula;
 * Display puts it on a line of its own, centered and larger, instead of in the line of the text; Label is what a
 * screen reader says of it (by default the formula as it is written).
 */
Elemenx.Component('Formula', {
	$TemplateURL: 'Formula.html',
	$StyleURL: 'Formula.css',
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
