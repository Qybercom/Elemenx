/*
 * A calculator of a business made of its fields and its results: a price of a renovation, a loan, a return on an
 * investment, a delivery. Its formulas are read by the Calculations Service (no eval), each result as the fields
 * change.
 *
 * Fields: [{ID, Label, Type, Value, Min, Max, Step, Unit, Options, Hint}], ID the name the formulas read; Type number,
 * money (in Currency), percent (typed as 15, read as 15), range (a Slider from Min to Max), select (Options [{Value,
 * Label}], the values numbers) or toggle (1 when on, else 0). Results: [{ID, Label, Formula, Format, Precision, Unit,
 * Primary, Hidden, Hint}], Formula of the fields and of the other results by their IDs, in any order (a result that
 * needs itself, through others, is an error); Format number, money, percent (0.15 shows 15%) or integer; Primary is
 * the main one, shown large first; Hidden is computed for the others alone. The same declared inside it:
 * CalculatorField and CalculatorResult. Breakdown names results to show as the parts of a bar (the parts of a total).
 * Currency (USD) and Locale (the language of the page) write the money. Values holds the values of the fields (given
 * by the owner, or as they are typed).
 * Events: change ({Values, Results}: the numbers of the results by their IDs) as the fields change. Methods: Numbers()
 * the same numbers, Reset() the first values back.
 */
Elemenx.Component('BusinessCalculator', {
	$TemplateURL: 'BusinessCalculator.html',
	$StyleURL: 'BusinessCalculator.css',
	$Traits: ['Declared'],
	$Meta: {
		Group: 'inputs',
		Icon: 'chart',
		Description: 'A calculator of a business made of its fields and of formulas of its results.',
		Container: true,
		Children: ['CalculatorField', 'CalculatorResult'],
		Events: {
			change: 'A field changed: {Values, Results} (the numbers of the results by their IDs).'
		},
		Methods: ['Numbers()', 'Reset()'],
		Props: {
			Title: 'Its title.',
			Fields: {Schema: {ID: 'text', Label: 'text', Type: 'text', Value: 'number'}, Description: 'The fields: [{ID, Label, Type, Value, Min, Max, Step, Unit, Options, Hint}].'},
			Results: {Schema: {ID: 'text', Label: 'text', Formula: 'text', Format: 'text'}, Description: 'The results: [{ID, Label, Formula, Format, Precision, Unit, Primary, Hidden, Hint}].'},
			Values: 'The values of the fields by their IDs.',
			Breakdown: 'The IDs of the results shown as the parts of a bar.',
			Currency: 'The code of the currency of money.',
			Locale: 'The language of the numbers (the language of the page by default).',
			Layout: {Options: ['side', 'stack'], Description: 'side (the results beside the fields, on a wide screen) or stack (under them).'}
		},
		Sample: {Title: 'Renovation', Fields: [{ID: 'Area', Label: 'Area', Value: 50, Unit: 'm²'}, {ID: 'Price', Label: 'Price for 1 m²', Type: 'money', Value: 40}], Results: [{ID: 'Total', Label: 'Total', Formula: 'Area * Price', Format: 'money', Primary: true}]}
	},
	Title: '',
	Fields: [],
	Results: [],
	Values: null,
	Breakdown: [],
	Currency: 'USD',
	Locale: '',
	Layout: 'side',
	Typed: {},
	Version: 0,
	Palette: ['#3f6c9e', '#c2477f', '#2f8f83', '#d99a1e', '#7a4fb0', '#d25f3a'],

	$OnCreate: function () {
		var self = this;
		var own = {Fields: [], Results: [], Compiled: {}, Last: null, Arguments: null};

		this.Own = function () {
			return own;
		};

		/* The model of the view: the fields with their values, the results computed (a template calls it). */
		this.Model = function () {
			var args = Array.prototype.slice.call(arguments);
			if (own.Arguments && own.Arguments.length === args.length && own.Arguments.every(function (value, index) {
				return value === args[index];
			})) return own.Last;

			own.Arguments = args;
			own.Last = self.Compute();

			return own.Last;
		};
	},

	/* The CalculatorField and CalculatorResult declared inside it (the Trait Declared reads them). */
	DeclaredSources: '.elemenx-business-calculator-sources',

	Declarations: function (sources) {
		return {
			Fields: Array.prototype.map.call(sources.querySelectorAll('.elemenx-calculator-field-source'), function (node) {
				return JSON.parse(node.getAttribute('data-item') || '{}');
			}),
			Results: Array.prototype.map.call(sources.querySelectorAll('.elemenx-calculator-result-source'), function (node) {
				return JSON.parse(node.getAttribute('data-item') || '{}');
			})
		};
	},

	Declared: function (declared) {
		this.Own().Fields = declared.Fields;
		this.Own().Results = declared.Results;
		this.Version++;
	},

	/* The fields and the results given and declared. */
	Data: function () {
		var own = this.Own();

		return {Fields: (this.Fields || []).concat(own.Fields), Results: (this.Results || []).concat(own.Results)};
	},

	/* The value of a field: typed, given by Values, or its first one. */
	FieldValue: function (field) {
		var typed = this.Typed || {};
		var values = this.Values || {};
		var value = Object.prototype.hasOwnProperty.call(typed, field.ID) ? typed[field.ID] : Object.prototype.hasOwnProperty.call(values, field.ID) ? values[field.ID] : field.Value;

		if (field.Type === 'toggle')
			return value === true || value === 1 || value === '1' || value === 'true';

		if (value === null || value === undefined || value === '')
			return field.Type === 'select' && field.Options && field.Options.length ? Number(field.Options[0].Value) : field.Min !== undefined && field.Type === 'range' ? Number(field.Min) : 0;

		return Number(value);
	},

	/*
	 * The values of the fields and the numbers of the results, each result after those it reads (an order found once by
	 * its names); one that cannot be computed is null, with its error.
	 */
	Compute: function () {
		var self = this;
		var calculations = this.$Service('Calculations');
		var data = this.Data();
		var values = {};
		var numbers = {};
		var errors = {};
		var compiled = {};
		var state = {};

		data.Fields.forEach(function (field) {
			var value = self.FieldValue(field);

			values[field.ID] = value;
			numbers[field.ID] = field.Type === 'toggle' ? (value ? 1 : 0) : value;
		});

		data.Results.forEach(function (result) {
			try {
				compiled[result.ID] = calculations.Compile(result.Formula || '0');
			}
			catch (error) {
				errors[result.ID] = error.message;
			}
		});

		/* A result after the results it reads; one met again on its own way is a cycle. */
		function compute (id) {
			var formula = compiled[id];

			if (state[id] === 'done' || errors[id]) return;

			if (state[id] === 'busy') {
				errors[id] = 'Elemenx BusinessCalculator: ' + id + ' needs itself';

				return;
			}

			state[id] = 'busy';

			formula.Names.forEach(function (name) {
				if (compiled[name] && !Object.prototype.hasOwnProperty.call(values, name))
					compute(name);
			});

			if (!errors[id]) {
				try {
					numbers[id] = formula(numbers);
				}
				catch (error) {
					errors[id] = error.message;
				}
			}

			state[id] = 'done';
		}

		data.Results.forEach(function (result) {
			if (compiled[result.ID])
				compute(result.ID);
		});

		var results = data.Results.map(function (result) {
			var number = errors[result.ID] || typeof numbers[result.ID] !== 'number' || !isFinite(numbers[result.ID]) ? null : numbers[result.ID];

			return {
				ID: result.ID,
				Label: result.Label || result.ID,
				Hint: result.Hint || '',
				Primary: !!result.Primary,
				Hidden: !!result.Hidden,
				Number: number,
				Error: errors[result.ID] || '',
				Text: number === null ? '—' : self.Write(number, result.Format, result.Precision) + (result.Unit ? ' ' + result.Unit : '')
			};
		});

		var bar = this.Bar(results);
		var output = {};

		/* The color of a result in the bar, beside its name in the list. */
		results.forEach(function (result) {
			var part = bar.filter(function (each) {
				return each.ID === result.ID;
			})[0];

			result.Swatch = part ? part.Color : '';
		});

		results.forEach(function (result) {
			output[result.ID] = result.Number;
		});

		return {
			Fields: data.Fields.map(function (field) {
				return {
					ID: field.ID,
					Label: field.Label || field.ID,
					Type: ['number', 'money', 'percent', 'range', 'select', 'toggle'].indexOf(field.Type) === -1 ? 'number' : field.Type,
					Value: values[field.ID],
					Min: field.Min !== undefined ? Number(field.Min) : null,
					Max: field.Max !== undefined ? Number(field.Max) : null,
					Step: field.Step !== undefined ? Number(field.Step) : field.Type === 'range' ? 1 : null,
					Unit: field.Type === 'money' ? field.Unit || self.Currency : field.Type === 'percent' ? field.Unit || '%' : field.Unit || '',
					Options: (field.Options || []).map(function (option) {
						return {Value: Number(option.Value), Label: option.Label || String(option.Value)};
					}),
					Hint: field.Hint || '',
					Shown: field.Type === 'range' ? self.Write(values[field.ID], 'number') + (field.Unit ? ' ' + field.Unit : '') : ''
				};
			}),
			Primary: results.filter(function (result) {
				return result.Primary && !result.Hidden;
			}),
			Others: results.filter(function (result) {
				return !result.Primary && !result.Hidden;
			}),
			Bar: bar,
			BarLabel: bar.map(function (part) {
				return part.Label + ' ' + part.Share + '%';
			}).join(', '),
			Values: values,
			Numbers: output
		};
	},

	/* The parts of the bar of Breakdown: each result named a share of their sum. */
	Bar: function (results) {
		var self = this;
		var named = (this.Breakdown || []).map(function (id) {
			return results.filter(function (result) {
				return result.ID === id && result.Number !== null && result.Number > 0;
			})[0];
		}).filter(Boolean);
		var total = named.reduce(function (sum, result) {
			return sum + result.Number;
		}, 0);

		return total ? named.map(function (result, index) {
			return {ID: result.ID, Label: result.Label, Text: result.Text, Share: Math.round(result.Number / total * 1000) / 10, Style: 'flex-grow:' + result.Number + ';background:' + self.Palette[index % self.Palette.length] + ';', Color: 'background:' + self.Palette[index % self.Palette.length] + ';'};
		}) : [];
	},

	/* A number written as its Format says, in the language of the page (or Locale). */
	Write: function (number, format, precision) {
		var locale = this.Locale || (Elemenx.Locale && Elemenx.Locale.Language ? Elemenx.Locale.Language() : '') || undefined;
		var digits = precision !== undefined && precision !== null ? Number(precision) : null;
		var options;

		if (format === 'money') options = {style: 'currency', currency: this.Currency || 'USD'};
		else if (format === 'percent') options = {style: 'percent', maximumFractionDigits: digits === null ? 1 : digits};
		else if (format === 'integer') options = {maximumFractionDigits: 0};
		else options = {maximumFractionDigits: digits === null ? 2 : digits};

		if (digits !== null && format !== 'percent') {
			options.minimumFractionDigits = digits;
			options.maximumFractionDigits = digits;
		}

		try {
			return new Intl.NumberFormat(locale, options).format(number);
		}
		catch (error) {
			return String(number);
		}
	},

	/* A field typed: its value kept, the results told. */
	Entered: function (id, value) {
		var typed = Object.assign({}, this.Typed);
		var model;

		typed[id] = value && typeof value === 'object' && 'Amount' in value ? value.Amount : value;
		this.Typed = typed;

		model = this.Model(this.Fields, this.Results, this.Values, this.Typed, this.Version, this.Currency, this.Locale, this.Breakdown);

		this.$Emit('change', {Values: model.Values, Results: model.Numbers});
	},

	Numbers: function () {
		return this.Model(this.Fields, this.Results, this.Values, this.Typed, this.Version, this.Currency, this.Locale, this.Breakdown).Numbers;
	},

	Reset: function () {
		this.Typed = {};
	}
});
