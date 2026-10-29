/*
 * The declaration of a field in the template of a BusinessCalculator: <CalculatorField ID="Area" Label="Area"
 * Type="number" Value="50" Unit="m²" />. It takes the props of a field of BusinessCalculator (ID: the name its
 * formulas read, Label, Type, Value, Min, Max, Step, Unit, Options, Hint). It shows nothing by itself.
 */
Elemenx.Component('CalculatorField', {
	$TemplateURL: 'CalculatorField.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'The declaration of a field in the template of a BusinessCalculator: <CalculatorField ID="Area" Label="Area" Value="50" />.',
		Props: {
			ID: 'The name its formulas read (letters, digits, _).',
			Label: 'Its label.',
			Type: {Options: ['number', 'money', 'percent', 'range', 'select', 'toggle'], Description: 'number, money, percent, range, select or toggle.'},
			Value: 'Its first value.',
			Min: 'The least value.',
			Max: 'The greatest value.',
			Step: 'The step.',
			Unit: 'A unit after its value.',
			Options: 'The options of a select: [{Value, Label}], the values numbers.',
			Hint: 'A hint under it.'
		},
		Sample: {ID: 'Area', Label: 'Area', Value: 50, Unit: 'm²'}
	},
	ID: '',
	Label: '',
	Type: 'number',
	Value: null,
	Min: null,
	Max: null,
	Step: null,
	Unit: '',
	Options: null,
	Hint: '',

	$OnCreate: function () {
		this.Declared = function (id, label, type, value, min, max, step, unit, options, hint) {
			var item = {ID: id, Label: label, Type: type};

			[['Value', value], ['Min', min], ['Max', max], ['Step', step]].forEach(function (pair) {
				if (pair[1] !== null && pair[1] !== undefined && pair[1] !== '')
					item[pair[0]] = pair[0] === 'Value' && (pair[1] === true || pair[1] === 'true' || pair[1] === false || pair[1] === 'false') ? pair[1] === true || pair[1] === 'true' : Number(pair[1]);
			});

			if (unit)
				item.Unit = unit;

			if (options)
				item.Options = options;

			if (hint)
				item.Hint = hint;

			return JSON.stringify(item);
		};
	}
});
