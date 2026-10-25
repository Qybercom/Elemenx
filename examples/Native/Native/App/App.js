/*
 * The one page of the program: where it runs (Platform, the features it has) and a button for each feature it tries,
 * a message, files opened and saved, a link in the browser of the system, the window, the badge, the progress and the
 * attention on the taskbar, and an icon in the tray with its window and its menu (the window hides there when it
 * closes); what each answered, and the events of the tray and of the jump list, go into the log under them.
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

	/* The events of the tray and of the jump list in the log; the task that started the program, if one did. */
	$OnReady: function () {
		var self = this;
		var native = this.$Service('Native');

		this.Heard = function (name) {
			return function (value) {
				self.Said(name + ': ' + JSON.stringify(value));
			};
		};

		this.Listeners = {tray: this.Heard('tray'), task: this.Heard('task'), closed: this.Heard('closed'), notes: function () {
			self.Notes = self.$Service('Notes').Items.length;
		}};

		native.On('tray', this.Listeners.tray);
		native.On('task', this.Listeners.task);
		native.On('closed', this.Listeners.closed);

		this.$Service('Notes').OnChange(this.Listeners.notes);

		if (native.Has('taskbar'))
			native.Tasks(this.Answer('Tasks'));
	},

	$OnDestroy: function () {
		var native = this.$Service('Native');

		if (!this.Listeners) return;

		native.Off('tray', this.Listeners.tray);
		native.Off('task', this.Listeners.task);
		native.Off('closed', this.Listeners.closed);

		this.$Service('Notes').OffChange(this.Listeners.notes);
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
		this.$Service('Native').Tray({Icon: 'icons/tray.png', Tooltip: 'Elemenx native', Items: [{ID: 'show', Label: 'Show'}, {Separator: true}, {Label: 'Quit', Role: 'quit'}], Window: {Component: 'TrayPanel', Width: 280, Height: 240}}, this.Answer('Tray'));
	},

	/* One more window of the same Application: the notes, the list of which this window counts. */
	Windowed: function () {
		var self = this;

		this.$Service('Native').OpenWindow({ID: 'notes', Component: 'NoteWindow', Title: 'Notes', Width: 460, Height: 380}, function (error, result) {
			self.Said('OpenWindow: ' + (error ? 'error, ' + error.message : result.ID));
		});
	},

	Badged: function () {
		this.Count++;

		this.$Service('Native').Badge(this.Count, this.Answer('Badge'));
	}
});
