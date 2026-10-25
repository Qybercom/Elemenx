/*
 * Notes that work without the network, in an application the user installs from the browser: the version of the build
 * it runs, the prompt of the browser to install it, a check for a new build, and an update at once (Elemenx.Install).
 */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',
	Notes: [],
	Text: '',
	Online: true,
	Install: {Available: false, Installed: false, Manual: false, Waiting: false, Version: null},
	Said: '',
	Busy: false,

	$OnCreate: function () {
		var self = this;

		this.Store = this.$Storage.Local.Namespace('ElemenxNotes');
		this.Notes = this.Store.Get('Notes') || [];
		this.Online = navigator.onLine !== false;
		this.Install = Elemenx.Install.State();

		/* The state of the installation and of the updates, as it changes. */
		this.Heard = function (state) {
			self.Install = state;
		};

		this.Network = function () {
			self.Online = navigator.onLine !== false;
		};

		Elemenx.Install.OnChange(this.Heard);

		window.addEventListener('online', this.Network);
		window.addEventListener('offline', this.Network);
	},

	$OnDestroy: function () {
		Elemenx.Install.OffChange(this.Heard);

		window.removeEventListener('online', this.Network);
		window.removeEventListener('offline', this.Network);
	},

	Typed: function (value) {
		this.Text = value;
	},

	Submitted: function (event) {
		event.preventDefault();

		this.Added();
	},

	Added: function () {
		var text = String(this.Text || '').trim();
		if (!text) return;

		this.Notes = [{ID: String(Date.now()), Text: text}].concat(this.Notes);
		this.Text = '';

		this.Store.Set('Notes', this.Notes);
	},

	Removed: function (event, node) {
		var id = node.getAttribute('data-id');

		this.Notes = this.Notes.filter(function (note) {
			return note.ID !== id;
		});

		this.Store.Set('Notes', this.Notes);
	},

	Installed: function () {
		var self = this;

		Elemenx.Install.Prompt(function (error, result) {
			self.Said = error ? error.message : result.Outcome === 'accepted' ? 'Installed.' : 'Not now.';
		});
	},

	/* Asks the server for a new build: it waits then, until Update now. */
	Checked: function () {
		var self = this;

		this.Busy = true;
		this.Said = 'Checking...';

		Elemenx.Install.Update(function (error, result) {
			self.Busy = false;

			if (error) self.Said = error.message;
			else self.Said = result.Available ? 'A new build is ready: ' + result.Version + '.' : 'This is the newest build.';
		});
	},

	/* Updates at once, whatever is there: the new build, or the files of this one again from the network. */
	Updated: function () {
		var self = this;

		this.Said = 'Updating...';

		Elemenx.Install.Apply(function (error) {
			self.Said = error.message;
		});
	}
});
