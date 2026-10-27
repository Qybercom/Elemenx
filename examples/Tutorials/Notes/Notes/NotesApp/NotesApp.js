/*
 * The notes: a field to write one, the list, and the state of the sync. Everything goes through the Sync Service, which
 * keeps the notes in the browser first: the page works the same with or without a network.
 */
Elemenx.Component('NotesApp', {
	$TemplateURL: 'NotesApp.html',
	$StyleURL: 'NotesApp.css',
	Notes: [],
	Draft: '',
	Editing: '',
	Status: 'synced',
	Pending: 0,

	$OnCreate: function () {
		var self = this;

		this.Listener = function (sync) {
			self.Notes = sync.Notes;
			self.Status = sync.Status;
			self.Pending = sync.Pending;
		};

		this.$Service('Sync').OnChange(this.Listener);
		this.Listener(this.$Service('Sync'));
	},

	$OnDestroy: function () {
		this.$Service('Sync').OffChange(this.Listener);
	},

	/* The text of the state: what a person needs to know, whether the notes are safe. */
	Said: function (status, pending) {
		if (status === 'offline')
			return pending ? 'Offline · ' + pending + ' waiting' : 'Offline';

		if (status === 'syncing') return 'Syncing…';

		if (status === 'error')
			return 'Not synced · retrying';

		if (status === 'pending')
			return pending + ' waiting';

		return 'Synced';
	},

	Typed: function (value) {
		this.Draft = value;
	},

	Saved: function (event) {
		if (event && event.preventDefault)
			event.preventDefault();

		if (!this.Draft.trim()) return;

		this.$Service('Sync').Save({ID: this.Editing || null, Text: this.Draft.trim()});

		this.Draft = '';
		this.Editing = '';
	},

	/* A button of a row: the ID of its note is on the row. */
	Edited: function (event) {
		var id = event.target.closest('[data-id]').getAttribute('data-id');

		this.Editing = id;
		this.Draft = this.Notes.filter(function (note) {
			return note.ID === id;
		})[0].Text;
	},

	Removed: function (event) {
		this.$Service('Sync').Remove(event.target.closest('[data-id]').getAttribute('data-id'));
	},

	Cancelled: function () {
		this.Draft = '';
		this.Editing = '';
	}
});
