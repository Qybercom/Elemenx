/*
 * The card of a plan of a subscription: Name and Description in a header (in Color, as a tile of the Metro style),
 * Popular (the label of the plan to point out: 'Most popular'), the Price of a month in Currency (0 is Free) or of a
 * year (Period 'year': YearlyPrice, otherwise twelve months), a Note, the Features ([{Label, Included, Hint}] or labels;
 * Included false crosses one out) and the button (Action) that chooses it. Selected and Current (the plan of the user)
 * mark it. Selectable makes it a radio of a group (PlanPicker); Tabbable makes it the one the Tab key reaches.
 * Variant as in Card.
 * Events: select ({ID}).
 */
Elemenx.Component('PlanCard', {
	$TemplateURL: 'PlanCard.html',
	$StyleURL: 'PlanCard.css',
	$Meta: {
		Group: 'commerce',
		Icon: 'cart',
		Description: 'The card of a plan of a subscription: Name and Description in a header (in Color, as a tile of the Metro style), Popular (the label of the plan to point out: \'Most popular\'), the Price of a month in Currency (0 is Free) or of a year (Period \'year\': YearlyPrice, otherwise twelve months), a Note, the Features ([{Label, Included, Hint}] or labels; Included false crosses one out) and the button (Action) that chooses it.',
		Container: true,
		Events: ['select'],
		Props: {
			ID: 'The ID of the plan, in the select event.',
			Name: 'The name of the plan.',
			Description: 'A line under the name.',
			Price: 'The price of a month (0 is Free).',
			YearlyPrice: 'The price of a year (twelve months without it).',
			Period: {Options: ['month', 'year'], Description: 'month or year.'},
			Currency: 'The code of the currency.',
			Note: 'A note under the price.',
			Features: 'The features: [{Label, Included, Hint}] or labels.',
			Popular: 'A label that points the plan out (Most popular).',
			Color: 'The color of the header.',
			Selected: 'Marks it as chosen.',
			Current: 'Marks it as the plan of the user.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Selectable: 'Makes it a radio of a group.',
			Tabbable: 'Makes it the one the Tab key reaches.',
			Variant: 'Its look, as in Card.',
			Action: 'The text of the button.',
			SelectedLabel: 'The text of the button of a chosen plan.',
			CurrentLabel: 'The text of the button of the plan of the user.',
			FreeLabel: 'The word of a price of 0.',
			MonthLabel: 'The word after a monthly price.',
			YearLabel: 'The word after a yearly price.',
			IncludedLabel: 'What screen readers say of an included feature.',
			ExcludedLabel: 'What screen readers say of a feature left out.'
		},
		Sample: {ID: 'free', Name: 'Basic', Description: 'For a start', Features: ['3 projects', '1 GB of storage', {Label: 'Custom themes', Included: false}], Color: '#3f6c9e', Current: true}
	},
	ID: '',
	Name: '',
	Description: '',
	Price: 0,
	YearlyPrice: null,
	Period: 'month',
	Currency: 'USD',
	Note: '',
	Features: [],
	Popular: '',
	Color: '',
	Selected: false,
	Current: false,
	Disabled: false,
	Selectable: false,
	Tabbable: false,
	Variant: 'outlined',
	Action: '',
	SelectedLabel: '',
	CurrentLabel: '',
	FreeLabel: '',
	MonthLabel: '',
	YearLabel: '',
	IncludedLabel: '',
	ExcludedLabel: '',

	$OnCreate: function () {
		var self = this;
		var format = this.$Service('Format');

		/* The price of the period: a month, or a year (YearlyPrice, otherwise twelve months). */
		this.Amount = function (price, yearly, period, currency) {
			var amount = period === 'year' ? (yearly === null || yearly === undefined || yearly === '' ? Number(price) * 12 : Number(yearly)) : Number(price);

			return amount > 0 ? format.Money(amount, currency) : self.FreeLabel || Elemenx.Locale.Text('ui.planCard.free');
		};
	},

	Choose: function () {
		if (this.Disabled || this.Current) return;

		this.$Emit('select', {ID: this.ID});
	},

	/* A selectable card is chosen by a press anywhere on it, and by Space and Enter. */
	Pressed: function (event) {
		if (!this.Selectable || event.target.closest('.elemenx-button')) return;

		this.Choose();
	},

	Key: function (event) {
		if (!this.Selectable || (event.key !== ' ' && event.key !== 'Enter') || event.target !== event.currentTarget) return;

		event.preventDefault();

		this.Choose();
	}
});
