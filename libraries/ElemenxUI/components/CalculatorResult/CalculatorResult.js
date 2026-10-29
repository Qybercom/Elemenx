/*
 * The declaration of a result in the template of a BusinessCalculator: <CalculatorResult ID="Total" Label="Total"
 * Formula="Area * Price" Format="money" Primary="true" />. It takes the props of a result of BusinessCalculator (ID:
 * the name other formulas read, Label, Formula, Format, Precision, Unit, Primary, Hidden, Hint). It shows nothing by
 * itself.
 */
Elemenx.Component('CalculatorResult', {
	$TemplateURL: 'CalculatorResult.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'chart',
		Description: 'The declaration of a result in the template of a BusinessCalculator: <CalculatorResult ID="Total" Formula="Area * Price" />.',
		Props: {
			ID: 'The name other formulas read.',
			Label: 'Its label.',
			Formula: 'Its formula: the fields and the other results by their IDs (the Calculations Service).',
			Format: {Options: ['number', 'money', 'percent', 'integer'], Description: 'number, money, percent (0.15 is 15%) or integer.'},
			Precision: 'The decimals shown.',
			Unit: 'A unit after its value.',
			Primary: 'The main result: larger, on top.',
			Hidden: 'Computed for the others, not shown.',
			Hint: 'A hint under it.'
		},
		Sample: {ID: 'Total', Label: 'Total', Formula: 'Area * Price', Format: 'money'}
	},
	ID: '',
	Label: '',
	Formula: '',
	Format: 'number',
	Precision: null,
	Unit: '',
	Primary: false,
	Hidden: false,
	Hint: '',

	$OnCreate: function () {
		this.Declared = function (id, label, formula, format, precision, unit, primary, hidden, hint) {
			var item = {ID: id, Label: label, Formula: formula, Format: format};

			if (precision !== null && precision !== undefined && precision !== '')
				item.Precision = Number(precision);

			if (unit)
				item.Unit = unit;

			if (primary === true || primary === 'true')
				item.Primary = true;

			if (hidden === true || hidden === 'true')
				item.Hidden = true;

			if (hint)
				item.Hint = hint;

			return JSON.stringify(item);
		};
	}
});
