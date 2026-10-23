/*
 * A choice of a plan: a PlanCard for each of Plans ([{ID, Name, Description, Price, YearlyPrice, Currency, Note,
 * Features, Popular, Color, Current, Disabled, Action}]) in a grid, one of them chosen (Value), as a group of radios:
 * the arrows move the choice. Periods shows the switch of the monthly and the yearly prices (Period), with Discount
 * beside it ('Save 20%').
 * Events: change ({ID, Period}), period ({Period}).
 */
Elemenx.Component('PlanPicker', {
	$TemplateURL: 'PlanPicker.html',
	$StyleURL: 'PlanPicker.css',
	$Meta: {
		Group: 'commerce',
		Icon: 'cart',
		Description: 'A choice of a plan: a PlanCard for each of Plans ([{ID, Name, Description, Price, YearlyPrice, Currency, Note, Features, Popular, Color, Current, Disabled, Action}]) in a grid, one of them chosen (Value), as a group of radios: the arrows move the choice.',
		Events: ['change', 'period'],
		Props: {
			Plans: 'The plans: [{ID, Name, Description, Price, YearlyPrice, Currency, Note, Features, Popular, Color, Current, Disabled, Action}].',
			Value: 'The ID of the plan chosen.',
			Period: {Options: ['month', 'year'], Description: 'month or year.'},
			Periods: 'Shows the switch of the monthly and the yearly prices.',
			Discount: 'A text beside the switch (Save 20%).',
			Currency: 'The code of the currency.',
			Variant: 'The look of the cards, as in Card.',
			Action: 'The text of the buttons.',
			Label: 'The name of the group for screen readers.',
			MonthlyLabel: 'The text of the monthly side of the switch.',
			YearlyLabel: 'The text of the yearly side of the switch.'
		},
		Sample: {Discount: 'Save 20%'}
	},
	Plans: [],
	Value: null,
	Period: 'month',
	Periods: true,
	Discount: '',
	Currency: 'USD',
	Variant: 'outlined',
	Action: '',
	Label: '',
	MonthlyLabel: '',
	YearlyLabel: '',

	$OnCreate: function () {
		this.PeriodOptions = function (monthly, yearly) {
			return [{Value: 'month', Label: monthly}, {Value: 'year', Label: yearly}];
		};
	},

	Chosen: function (detail) {
		this.Choose(detail.ID);
	},

	Choose: function (id) {
		var root = this.$Element();

		this.Value = id;

		this.$Emit('change', {ID: id, Period: this.Period});

		window.setTimeout(function () {
			var card = root.querySelector('.elemenx-plan[data-id="' + String(id).replace(/"/g, '') + '"]');
			if (card && root.contains(root.getRootNode().activeElement))
				card.focus();
		}, 0);
	},

	PeriodChosen: function (value) {
		this.Period = value;

		this.$Emit('period', {Period: value});
	},

	/* The arrows move the choice to the next plan that can be chosen, as in a group of radios. */
	Key: function (event) {
		var self = this;
		var plans = this.Plans.filter(function (plan) {
			return !plan.Disabled && !plan.Current;
		});
		var index = plans.map(function (plan) {
			return plan.ID;
		}).indexOf(this.Value);
		var step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[Elemenx.Locale.Key(event)];
		if (!step || !plans.length || !event.target.classList.contains('elemenx-plan')) return;

		event.preventDefault();

		index = index === -1 ? 0 : (index + step + plans.length) % plans.length;

		self.Choose(plans[index].ID);
	}
});
