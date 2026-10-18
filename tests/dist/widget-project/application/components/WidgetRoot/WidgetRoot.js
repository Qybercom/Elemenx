/* The root of the widget fixture: ElemenxUI controls in a shadow root, on a page of another site. */
Elemenx.Component('WidgetRoot', {
	$TemplateURL: 'WidgetRoot.html',
	$Style: '.widget-title { margin: 0; }',
	Clicks: 0,
	Plan: 'basic',
	Plans: [{Value: 'basic', Label: 'Basic'}, {Value: 'team', Label: 'Team'}],

	Clicked: function () {
		this.Clicks++;
	},

	Planned: function (value) {
		this.Plan = value;
	}
});
