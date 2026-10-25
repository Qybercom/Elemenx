/*
 * The one page of the program: where it runs (Platform, the features it has) and a button for each feature it tries,
 * a message, files opened and saved, a link in the browser of the system, the window, the badge, the progress and the
 * attention on the taskbar, and an icon in the tray with its window and its menu (the window hides there when it
 * closes); what each answered, and the events of the tray and of the jump list, go into the log under them. A program
 * has its menu (File, Edit, View, Window, Help: a NativeMenu of its template, a bar of menus on the web), the buttons
 * under the thumbnail of its window on the taskbar of Windows (a new note, the window of notes, attention) and its icon
 * in the tray with its menu (a NativeMenu too) from the start.
 */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',
	Platform: '',
	Features: [],
	Log: [],
	Count: 0,
	Lines: 0,
	Notes: 0,
	Step: 0,

	$OnCreate: function () {
		var native = this.$Service('Native');

		this.Platform = native.Platform();
		this.Features = ['window', 'dialogs', 'menu', 'tray', 'external', 'taskbar', 'hotkeys', 'autostart', 'links', 'power', 'update', 'files'].filter(function (feature) {
			return native.Has(feature);
		});
	},

	/*
	 * The events of the tray, of the jump list, of the menu and of the thumbnail buttons in the log; the task that started
	 * the program, if one did; the menu, the thumbnail buttons and the icon in the tray of a program.
	 */
	$OnReady: function () {
		var self = this;
		var native = this.$Service('Native');

		this.Heard = function (name) {
			return function (value) {
				self.Said(name + ': ' + JSON.stringify(value));
			};
		};

		this.Listeners = {tray: this.Heard('tray'), task: this.Heard('task'), closed: this.Heard('closed'), notification: this.Heard('notification'), notes: function () {
			self.Notes = self.$Service('Notes').Items.length;
		}, thumbar: function (event) {
			self.Said('thumbar: ' + JSON.stringify(event));
			self.Commanded(event.ID);
		}};

		native.On('tray', this.Listeners.tray);
		native.On('task', this.Listeners.task);
		native.On('closed', this.Listeners.closed);
		native.On('thumbar', this.Listeners.thumbar);
		native.On('notification', this.Listeners.notification);

		this.$Service('Notes').OnChange(this.Listeners.notes);

		/* The jump list and the thumbnail buttons are of a program (the web has a badge only). */
		if (native.Available() && native.Has('taskbar')) {
			native.Tasks(this.Answer('Tasks'));
			native.Thumbar(this.Thumbs, this.Answer('Thumbar'));
		}

		if (native.Has('tray'))
			this.Trayed();
	},

	$OnDestroy: function () {
		var native = this.$Service('Native');

		if (!this.Listeners) return;

		native.Off('tray', this.Listeners.tray);
		native.Off('task', this.Listeners.task);
		native.Off('closed', this.Listeners.closed);
		native.Off('thumbar', this.Listeners.thumbar);
		native.Off('notification', this.Listeners.notification);

		this.$Service('Notes').OffChange(this.Listeners.notes);
	},

	/* The buttons under the thumbnail of the window on the taskbar of Windows: their icons are files of the Application. */
	Thumbs: [
		{ID: 'note', Icon: 'icons/thumb-add.png', Tooltip: 'New note'},
		{ID: 'notes', Icon: 'icons/thumb-window.png', Tooltip: 'Window of notes'},
		{ID: 'attention', Icon: 'icons/thumb-bell.png', Tooltip: 'Ask for attention'}
	],

	/* An item of a NativeMenu (the menu of the window, of the tray), in the log, and its command. */
	MenuChosen: function (item) {
		this.Said('menu: ' + item.ID);

		this.Commanded(item.ID);
	},

	/* The menu of the system took the items (or refused them). */
	MenuApplied: function (event) {
		this.Said('Menu: ' + (event.Error ? 'error, ' + event.Error.message : 'set'));
	},

	/* A command of the menu, of a thumbnail button or of the menu of the tray. */
	Commanded: function (id) {
		var native = this.$Service('Native');

		if (id === 'note') this.$Service('Notes').Add('idea', 'A note #' + (this.$Service('Notes').Items.length + 1));
		else if (id === 'notes') this.Windowed();
		else if (id === 'open') this.Opened();
		else if (id === 'save') this.Saved();
		else if (id === 'attention') this.Attended();
		else if (id === 'show') native.Window('show');
		else if (id === 'about') native.Message({Title: 'Elemenx native', Text: 'An Application of Elemenx as a program of the system.', Buttons: ['OK']}, this.Answer('About'));
	},

	/* An answer of the system, the newest on top, each with a number of its own (two answers may read the same). */
	Said: function (text) {
		this.Lines++;

		this.Log = [{ID: this.Lines, Text: new Date().toLocaleTimeString() + ' ' + text}].concat(this.Log).slice(0, 20);
	},

	/* The callback of a call: its error or its result in the log. */
	Answer: function (name) {
		var self = this;

		return function (error, result) {
			self.Said(name + ': ' + (error ? 'error, ' + error.message : JSON.stringify(result === undefined ? null : result)));
		};
	},

	Messaged: function () {
		this.$Service('Native').Message({Title: 'Elemenx', Text: 'A message of the system.', Buttons: ['OK', 'Cancel']}, this.Answer('Message'));
	},

	Opened: function () {
		var self = this;

		this.$Service('Native').Open({Accept: ['.txt', '.md', '.json'], Read: 'text'}, function (error, files) {
			if (error) {
				self.Said('Open: error, ' + error.message);

				return;
			}

			self.Said('Open: ' + files.map(function (file) {
				return file.Name + ' (' + file.Size + ' bytes)';
			}).join(', ') || 'nothing');
		});
	},

	Saved: function () {
		this.$Service('Native').Save({Name: 'elemenx.txt', Text: 'Saved by Elemenx at ' + new Date().toISOString() + '\n'}, this.Answer('Save'));
	},

	Linked: function () {
		this.$Service('Native').External('https://example.com/', this.Answer('External'));
	},

	Maximized: function () {
		this.$Service('Native').Window('toggle-maximize', this.Answer('Window'));
	},

	/* The progress on the button of the window, a step further at each press: a part, paused, in error, running, none. */
	Progressed: function () {
		var steps = [{Value: 0.25}, {Value: 0.5, State: 'paused'}, {Value: 0.75, State: 'error'}, {State: 'indeterminate'}, null];

		this.$Service('Native').Progress(steps[this.Step % steps.length], this.Answer('Progress'));

		this.Step++;
	},

	Attended: function () {
		this.$Service('Native').Attention(true, this.Answer('Attention'));
	},

	/*
	 * An icon in the tray: a press opens its window (TrayPanel) by it, the right button its menu, where the window comes
	 * back by Show and the program quits by Quit.
	 */
	Trayed: function () {
		this.$Service('Native').Tray({Icon: 'icons/tray.png', Tooltip: 'Elemenx native', Window: {Component: 'TrayPanel', Width: 280, Height: 240}}, this.Answer('Tray'));
	},

	/* One more window of the same Application: the notes, the list of which this window counts. */
	Windowed: function () {
		var self = this;

		this.$Service('Native').OpenWindow({ID: 'notes', Component: 'NoteWindow', Title: 'Notes', Width: 460, Height: 380, Frame: 'none'}, function (error, result) {
			self.Said('OpenWindow: ' + (error ? 'error, ' + error.message : result.ID));
		});
	},

	/* A notification of the system, or a card of ElemenxUI by the corner of the screen (the look of the theme). */
	Notified: function () {
		var self = this;

		this.$Service('Native').Notify({ID: 'system', Title: 'Elemenx native', Text: 'A notification of the system', Icon: '/icons/app.png'}, function (error) {
			self.Said('Notify: ' + (error ? 'error, ' + error.message : 'system'));
		});
	},

	Carded: function () {
		var self = this;

		this.$Service('Native').Notify({ID: 'card', Title: 'Elemenx native', Text: 'A card of ElemenxUI by the corner of the screen', Icon: 'bell', Look: 'elemenx', Actions: [{ID: 'open', Label: 'Open'}, {ID: 'later', Label: 'Later'}]}, function (error) {
			self.Said('Notify: ' + (error ? 'error, ' + error.message : 'elemenx'));
		});
	},

	Badged: function () {
		this.Count++;

		this.$Service('Native').Badge(this.Count, this.Answer('Badge'));
	}
});
