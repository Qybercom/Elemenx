/*
 * The studio: the tree of the files on the left, the open files in tabs over a code editor, a terminal at the bottom,
 * a palette of the commands (Mod+K). A changed file is marked in its tab until it is saved (Mod+S).
 */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',
	Tree: [],
	Open: [],
	Current: '',
	Drafts: {},
	Terminal: true,
	Lines: [{ID: 0, Kind: 'info', Text: 'Type help.'}],
	Commands: [],

	$OnCreate: function () {
		var files = this.$Service('Files');

		this.Tree = files.Tree();

		/* The tabs of the open files, a changed one marked. */
		this.Tabs = function (open, drafts) {
			return open.map(function (name) {
				return {ID: name, Label: name.split('/').pop() + (Object.prototype.hasOwnProperty.call(drafts, name) ? ' •' : ''), Closable: true};
			});
		};

		/* What the editor shows: the draft of the file, or the file. */
		this.Text = function (name, drafts) {
			return Object.prototype.hasOwnProperty.call(drafts, name) ? drafts[name] : files.Read(name);
		};

		this.Language = function (name) {
			return files.Language(name);
		};

		this.Commands = files.Names().map(function (name) {
			return {ID: 'open:' + name, Label: 'Open ' + name, Group: 'Files', Icon: 'file-code'};
		}).concat([
			{ID: 'save', Label: 'Save the file', Group: 'File', Icon: 'save', Keys: 'Mod+S'},
			{ID: 'terminal', Label: 'Show or hide the terminal', Group: 'View', Icon: 'terminal'}
		]);

		this.Show(files.Names()[0]);
	},

	/* A file into a tab (once) and in front. */
	Show: function (name) {
		if (this.Open.indexOf(name) === -1)
			this.Open = this.Open.concat([name]);

		this.Current = name;
	},

	Picked: function (item) {
		if (!item.Items)
			this.Show(item.ID);
	},

	Switched: function (name) {
		this.Current = name;
	},

	Closed: function (name) {
		var index = this.Open.indexOf(name);

		this.Open = this.Open.filter(function (each) {
			return each !== name;
		});

		if (this.Current === name)
			this.Current = this.Open[Math.max(0, index - 1)] || '';
	},

	Edited: function (text) {
		var drafts = Object.assign({}, this.Drafts);

		drafts[this.Current] = text;
		this.Drafts = drafts;
	},

	Save: function () {
		var drafts = Object.assign({}, this.Drafts);
		if (!Object.prototype.hasOwnProperty.call(drafts, this.Current)) return;

		this.$Service('Files').Write(this.Current, drafts[this.Current]);

		delete drafts[this.Current];
		this.Drafts = drafts;

		this.Say('success', 'Saved ' + this.Current);
	},

	Say: function (kind, text) {
		this.Lines = this.Lines.concat([{ID: Date.now() + Math.random(), Kind: kind, Text: text}]);
	},

	/* The commands of the terminal: help, ls, cat <file>, clear. */
	Ran: function (text) {
		var files = this.$Service('Files');
		var parts = text.trim().split(/\s+/);

		this.Say('input', text);

		if (parts[0] === 'help') this.Say('output', 'help · ls · cat <file> · clear');
		else if (parts[0] === 'ls') this.Say('output', files.Names().join('\n'));
		else if (parts[0] === 'cat' && files.Names().indexOf(parts[1]) !== -1) this.Say('output', files.Read(parts[1]));
		else if (parts[0] === 'clear') this.Lines = [];
		else this.Say('error', 'Unknown: ' + text);
	},

	Cleared: function () {
		this.Lines = [];
	},

	/* A command of the palette. */
	Command: function (command) {
		if (command.ID.indexOf('open:') === 0) this.Show(command.ID.substring(5));
		else if (command.ID === 'save') this.Save();
		else if (command.ID === 'terminal') this.Toggle();
	},

	Toggle: function () {
		this.Terminal = !this.Terminal;
	}
});
