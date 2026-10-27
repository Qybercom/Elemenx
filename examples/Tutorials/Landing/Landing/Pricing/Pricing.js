/* The prices: the plans, monthly or yearly, and the choice that goes on to the form. */
Elemenx.Component('Pricing', {
	$TemplateURL: 'Pricing.html',
	Plan: 'pro',
	Period: 'month',
	Plans: [
		{ID: 'free', Name: 'Free', Description: 'For a start', Price: 0, Features: ['100 notes', 'Search', {Label: 'Sync', Included: false}]},
		{ID: 'pro', Name: 'Pro', Description: 'For every day', Price: 6, YearlyPrice: 60, Popular: 'Most popular', Features: ['Unlimited notes', 'Search', 'Sync on 5 devices']},
		{ID: 'team', Name: 'Team', Description: 'For a team', Price: 12, YearlyPrice: 120, Features: ['Everything in Pro', 'Shared spaces', 'Admin']}
	],

	Chosen: function (detail) {
		this.Plan = detail.ID;

		this.$Service('Toast').Show({Message: 'A good choice: the ' + detail.ID + ' plan.', Variant: 'success'});
	},

	Switched: function (detail) {
		this.Period = detail.Period;
	}
});
