/*
 * A window of notes, opened by the main window of the program (Native.OpenWindow): a kind chosen in a list, a text,
 * and the notes of the one list the main window shows too.
 */
Elemenx.Component('NoteWindow', {
	$TemplateURL: 'NoteWindow.html',
	Kind: 'idea',
	Text: '',
	Items: [],

	$OnCreate: function () {
		var self = this;
		var notes = this.$Service('Notes');

		/* The kinds of a note in the language of the page (a template calls it). */
		this.KindsOf = function (idea, task) {
			return [{Value: 'idea', Label: idea}, {Value: 'task', Label: task}];
		};

		this.Changed = function () {
			self.Items = notes.Items.slice();
		};

		this.Changed();

		notes.OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('Notes').OffChange(this.Changed);
	},

	Kinded: function (value) {
		this.Kind = value;
	},

	Typed: function (value) {
		this.Text = value;
	},

	Added: function () {
		if (!this.Text.trim()) return;

		this.$Service('Notes').Add(this.Kind, this.Text.trim());

		this.Text = '';
	}
});
