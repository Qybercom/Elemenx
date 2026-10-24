/*
 * The builder: a Workspace around the Designer components of ElemenxUI, under a Ribbon. The File button opens the
 * backstage: the template of the page to copy (Export), a template to read in its place (Import), the page as an
 * Application to download (one HTML file that runs alone, or a project in a zip; the Packager Service), and Clear. The tabs:
 * Home (undo and redo; a copy, the removal, the moves and the parent of the selected element), Insert (every component
 * of ElemenxUI and the classes of its layouts, a gallery for each group of the palette, with a search: a sample pressed
 * goes into the selected element, or after it; a sample dragged goes where the canvas or the structure takes it) and
 * View (the width of the canvas, its outlines and its gaps). The header runs the page and stops it (Run, Stop), inspects
 * it while it runs, and switches the language and the theme. The structure of the page is on the left,
 * always in view, the layout and the props of the selected element on the right, its template at the bottom. The
 * document is the one of the Designer Service. Keys: Mod+Z, Mod+Shift+Z (or Mod+Y), Mod+D (a copy), Delete, Escape (no
 * selection), and the key tips of the Ribbon (Alt).
 */
Elemenx.Component('BuilderLayout', {
	$TemplateURL: 'BuilderLayout.html',
	$StyleURL: 'BuilderLayout.css',
	Languages: [{Value: 'en', Label: 'English'}, {Value: 'ru', Label: 'Русский'}],
	Language: 'en',
	Version: 0,
	Tab: 'insert',
	Page: 'export',
	Width: 'desktop',
	Preview: false,
	Outlines: true,
	Gaps: true,
	Inspect: false,
	Lines: false,
	Query: '',
	ImportText: '',
	AppName: 'Page',
	PackageFailed: '',
	ImportFailed: false,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');
		var keys = [];
		var saved = null;
		var icons = {layout: 'layout', text: 'text-color', inputs: 'edit', buttons: 'launcher', navigation: 'menu', display: 'star', data: 'chart', overlays: 'panel-right', social: 'users', commerce: 'cart', music: 'headphones', game: 'trophy', tools: 'settings'};

		function changed () {
			self.Version++;
		}

		/*
		 * A key of the builder works outside the fields: a field keeps its own undo, the backstage its keys, so the key
		 * keeps its default action there.
		 */
		function bind (combination, run) {
			keys.push(self.$Service('Hotkeys').Bind(combination, function (event) {
				var target = event && event.target;
				if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"], .elemenx-ribbon-backstage.open')) return;

				if (event)
					event.preventDefault();

				run();
			}, {Group: 'Builder', Prevent: false}));
		}

		function kind (entry) {
			return {ID: entry.ID, Label: designer.Label(entry.ID), Icon: entry.Icon, Hint: designer.Hint(entry.ID)};
		}

		designer.OnChange(changed);

		bind('Mod+Z', function () {
			designer.Undo();
		});

		bind('Mod+Shift+Z', function () {
			designer.Redo();
		});

		bind('Mod+Y', function () {
			designer.Redo();
		});

		bind('Mod+D', function () {
			self.Run('duplicate');
		});

		bind('Delete', function () {
			self.Run('delete');
		});

		bind('Escape', function () {
			designer.Select(null);
		});

		/* What the builder keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return {Keys: keys, Changed: changed};
		};

		/* The groups of the palette for the Insert tab, the first ones last to shrink. */
		this.Groups = function (version, language) {
			var groups = version >= 0 && language ? designer.Kinds() : [];

			return groups.map(function (group, index) {
				return {ID: group.ID, Label: designer.GroupLabel(group.ID), Icon: icons[group.ID] || 'grid', Priority: groups.length - index, Kinds: group.Kinds.map(kind)};
			});
		};

		/* The kinds whose name holds the text of the search. */
		this.Found = function (version, query, language) {
			var text = String(query || '').trim().toLowerCase();
			var found = [];

			if (!text || version < 0 || !language) return found;

			designer.Kinds().forEach(function (group) {
				group.Kinds.forEach(function (entry) {
					var item = kind(entry);
					if (item.Label.toLowerCase().indexOf(text) !== -1 || item.ID.toLowerCase().indexOf(text) !== -1)
						found.push(item);
				});
			});

			return found;
		};

		this.Selected = function (version) {
			return version >= 0 ? designer.Selected() : null;
		};

		this.Code = function (version) {
			return version >= 0 && designer.Ready() ? designer.Template(false) : '';
		};

		this.Count = function (version) {
			return version >= 0 ? designer.Count() : 0;
		};

		this.CanUndo = function (version) {
			return version >= 0 && designer.CanUndo();
		};

		this.CanRedo = function (version) {
			return version >= 0 && designer.CanRedo();
		};

		try {
			saved = window.localStorage.getItem('elemenx-builder:language');
		}
		catch (error) {
			saved = null;
		}

		this.Use(saved || (/^ru\b/i.test(navigator.language || '') ? 'ru' : 'en'));
	},

	$OnDestroy: function () {
		var hotkeys = this.$Service('Hotkeys');

		this.$Service('Designer').OffChange(this.Own().Changed);

		this.Own().Keys.forEach(function (id) {
			hotkeys.Unbind(id);
		});
	},

	Use: function (language) {
		var self = this;

		Elemenx.Locale.Language(language, function () {
			self.Language = language;
		});

		try {
			window.localStorage.setItem('elemenx-builder:language', language);
		}
		catch (error) {
			return;
		}
	},

	/* Run and Stop: the page works as it will, or is built again; Inspect and its outlines go with the run. */
	Ran: function () {
		this.Preview = !this.Preview;
		this.Inspect = false;
		this.Lines = false;
	},

	Inspected: function () {
		this.Inspect = !this.Inspect;
	},

	Lined: function () {
		this.Lines = !this.Lines;
	},

	Chosen: function (value) {
		this.Use(value);
	},

	TabChanged: function (event) {
		this.Tab = event.ID;
	},

	Paged: function (event) {
		this.Page = event.ID;

		if (event.ID === 'import') {
			this.ImportText = this.$Service('Designer').Template(false);
			this.ImportFailed = false;
		}
	},

	Searched: function (value) {
		this.Query = value;
	},

	/* A command of the Ribbon: a button by its ID, a sample of a gallery of the Insert tab by its Item. */
	Command: function (event) {
		if (event.Item && (event.ID === 'found' || String(event.ID).indexOf('insert-') === 0)) {
			this.Add(event.Item.ID);

			return;
		}

		this.Run(event.ID);
	},

	Run: function (command) {
		var designer = this.$Service('Designer');
		var selected = designer.Selected();
		var parent = selected ? designer.Parent(selected) : null;
		var index = parent ? parent.Children.indexOf(designer.Find(selected)) : -1;

		if (command === 'undo') designer.Undo();
		else if (command === 'redo') designer.Redo();
		else if (command === 'clear') this.Cleared();
		else if (command === 'outlines') this.Outlines = !this.Outlines;
		else if (command === 'gaps') this.Gaps = !this.Gaps;
		else if (['desktop', 'tablet', 'phone'].indexOf(command) !== -1) this.Width = command;
		else if (!selected) return;
		else if (command === 'duplicate') designer.Select(designer.Duplicate(selected));
		else if (command === 'up') designer.Move(selected, parent.ID, index - 1);
		else if (command === 'down') designer.Move(selected, parent.ID, index + 2);
		else if (command === 'parent') designer.Select(parent.ID);
		else if (command === 'delete') this.Remove();
	},

	/* A kind of the palette pressed: into the selected element when that is a container, after it otherwise, and at the end of the page without a selection. */
	Add: function (kind) {
		var designer = this.$Service('Designer');
		var selected = designer.Selected();
		var parent;
		var id;

		if (selected && designer.Container(selected)) {
			id = designer.Insert(kind, selected);
		}
		else if (selected) {
			parent = designer.Parent(selected);
			id = designer.Insert(kind, parent.ID, parent.Children.indexOf(designer.Find(selected)) + 1);
		}
		else {
			id = designer.Insert(kind, 'root');
		}

		designer.Select(id);
	},

	Remove: function () {
		var designer = this.$Service('Designer');
		var selected = designer.Selected();
		var parent;

		if (!selected) return;

		parent = designer.Parent(selected);

		designer.Remove(selected);
		designer.Select(parent ? parent.ID : null);
	},

	Cleared: function () {
		var self = this;
		var designer = this.$Service('Designer');
		if (!designer.Root().Children.length) return;

		designer.Clear();

		this.$Service('Toast').Show({
			Message: Elemenx.Locale.Text('builder.cleared'),
			Actions: [{Label: Elemenx.Locale.Text('builder.undo'), Run: function () {
				self.$Service('Designer').Undo();
			}}]
		});
	},

	Named: function (value) {
		this.AppName = value;
	},

	/* The page as an Application in one HTML file (the bundles of npm run dist inside it). */
	DownloadedHtml: function () {
		var self = this;
		var packager = this.$Service('Packager');
		var name = this.AppName || 'Page';

		this.PackageFailed = '';

		packager.Html(this.$Service('Designer').Template(false), {Title: name, Language: this.Language}, function (error, text) {
			if (error) {
				self.PackageFailed = error.message;

				return;
			}

			packager.Save(self.File(name) + '.html', text, 'text/html');
		});
	},

	/* The page as a project of Elemenx in a zip, for elemenx dev and elemenx build. */
	DownloadedProject: function () {
		var packager = this.$Service('Packager');
		var name = this.AppName || 'Page';

		packager.Save(this.File(name) + '.zip', packager.Project(this.$Service('Designer').Template(false), {Title: name, Language: this.Language}), 'application/zip');
	},

	/* The name of a file of a title: its letters and digits, words joined by -. */
	File: function (title) {
		return String(title).trim().toLowerCase().replace(/[^\wЀ-ӿ]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
	},

	ImportTyped: function (value) {
		this.ImportText = value;
		this.ImportFailed = false;
	},

	/* A template read in place of the page; the backstage closes on the page it made. */
	Imported: function () {
		var backstage = this.$Element().querySelector('.elemenx-ribbon-backstage');

		if (!this.$Service('Designer').Import(this.ImportText)) {
			this.ImportFailed = true;

			return;
		}

		if (backstage)
			backstage.dispatchEvent(new CustomEvent('elemenx-ribbon-close', {bubbles: true, detail: {Focus: false}}));
	}
});
