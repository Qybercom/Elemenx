/*
 * A widget of a Dashboard grid. Span (1 to 4 columns) and Rows (1 to 3) set its size; on a narrow dashboard
 * every widget takes a full row. Slots: default (the body), actions (at the right of the title), footer.
 */
Elemenx.Component('DashboardWidget', {
	$TemplateURL: 'DashboardWidget.html',
	$StyleURL: 'DashboardWidget.css',
	Title: '',
	Icon: '',
	Note: '',
	Span: 1,
	Rows: 1
});