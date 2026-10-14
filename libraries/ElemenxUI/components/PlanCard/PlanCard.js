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
	Action: 'Choose plan',
	SelectedLabel: 'Selected',
	CurrentLabel: 'Current plan',
	FreeLabel: 'Free',
	MonthLabel: 'month',
	YearLabel: 'year',
	IncludedLabel: 'Included',
	ExcludedLabel: 'Not included',

	$OnCreate: function () {
		var self = this;
		var format = this.$Service('Format');

		/* The price of the period: a month, or a year (YearlyPrice, otherwise twelve months). */
		this.Amount = function (price, yearly, period, currency) {
			var amount = period === 'year' ? (yearly === null || yearly === undefined || yearly === '' ? Number(price) * 12 : Number(yearly)) : Number(price);

			return amount > 0 ? format.Money(amount, currency) : self.FreeLabel;
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
