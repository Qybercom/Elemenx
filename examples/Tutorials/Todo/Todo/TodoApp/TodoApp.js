/*
 * The list of tasks: a field to add one, the tasks with a box to tick and a button to remove, a filter, and the count
 * of the tasks left. The logic is the Todos Service; the component only shows it.
 */
Elemenx.Component('TodoApp', {
	$TemplateURL: 'TodoApp.html',
	$StyleURL: 'TodoApp.css',
	Items: [],
	Filter: 'all',
	Draft: '',
	Left: 0,
	Filters: [{Value: 'all', Label: 'All'}, {Value: 'active', Label: 'Active'}, {Value: 'done', Label: 'Done'}],

	$OnCreate: function () {
		var self = this;

		this.Listener = function () {
			self.Refresh();
		};

		this.$Service('Todos').OnChange(this.Listener);
		this.Refresh();
	},

	$OnDestroy: function () {
		this.$Service('Todos').OffChange(this.Listener);
	},

	Refresh: function () {
		var todos = this.$Service('Todos');

		this.Items = todos.List(this.Filter);
		this.Left = todos.Left();
	},

	Typed: function (value) {
		this.Draft = value;
	},

	Add: function (event) {
		if (event && event.preventDefault)
			event.preventDefault();

		if (!this.Draft.trim()) return;

		this.$Service('Todos').Add(this.Draft);

		this.Draft = '';
	},

	/* A box or a button of a row: the ID of its task is on the row. */
	Ticked: function (event) {
		this.$Service('Todos').Toggle(event.target.closest('[data-id]').getAttribute('data-id'));
	},

	Removed: function (event) {
		this.$Service('Todos').Remove(event.target.closest('[data-id]').getAttribute('data-id'));
	},

	Filtered: function (value) {
		this.Filter = value;

		this.Refresh();
	},

	Cleared: function () {
		this.$Service('Todos').ClearDone();
	}
});
