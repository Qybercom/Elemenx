/*
 * A widget of a Dashboard grid. Span (1 to 4 columns) and Rows (1 to 3) set its size; on a narrow dashboard
 * every widget takes a full row. Slots: default (the body), actions (at the right of the title), footer.
 */
Elemenx.Component('DashboardWidget', {
	$TemplateURL: 'DashboardWidget.html',
	$StyleURL: 'DashboardWidget.css',
	$Meta: {
		Group: 'layout',
		Icon: 'layout',
		Description: 'A widget of a Dashboard grid.',
		Container: true,
		Slots: ['actions', 'footer'],
		Props: {
			Title: 'The title of the widget.',
			Icon: 'An icon before the title.',
			Note: 'A caption under the title.',
			Span: 'How many columns it takes: 1 to 4.',
			Rows: 'How many rows it takes: 1 to 3.'
		},
		Sample: {Title: 'Sales', Icon: 'chart', Note: 'Last 12 weeks', Span: 2}
	},
	Title: '',
	Icon: '',
	Note: '',
	Span: 1,
	Rows: 1
});