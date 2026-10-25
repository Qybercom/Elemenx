/*
 * The builder: a Workspace around the Designer components of ElemenxUI, under a Ribbon. The File button opens the
 * backstage: the template of the page to copy (Export), a template to read in its place (Import), the page or the
 * application as an Application to download (one HTML file that runs alone, or a project in a zip; the Packager
 * Service), and Clear; before them Create (a new project: a template, a component or an application, a mode that stays
 * its own) and Open (the projects kept, a project read from a file or saved into one). The tabs: Home (undo and redo; a
 * copy, the removal, the moves and the parent of the selected element), Project (in an application: a new page or
 * component, the settings of the Application in the main area; each document open has a tab over the canvas, closed by
 * its cross, and the explorer of the project lists them all), Insert (every component of ElemenxUI and the classes of
 * its layouts, a gallery for each group of the palette, with a search: a sample pressed goes into the selected element,
 * or after it; a sample dragged goes where the canvas or the structure takes it) and View (the width of the canvas, its
 * outlines, gaps and rulers). The header runs the page and stops it (Run, Stop), inspects it while it runs, and
 * switches the language and the theme. The structure of the page is on the left, always in view, the layout and the
 * props of the selected element on the right (with none, the document: a page, a component), its template at the
 * bottom. The documents are the ones of the Designer Service. Keys: Mod+Z, Mod+Shift+Z (or Mod+Y), Mod+D (a copy),
 * Delete, Escape (no selection), and the key tips of the Ribbon (Alt).
 */
Elemenx.Component('BuilderLayout', {
	$TemplateURL: 'BuilderLayout.html',
	$StyleURL: 'BuilderLayout.css',
	Languages: [{Value: 'en', Label: 'English'}, {Value: 'ru', Label: 'Русский'}],
	Language: 'en',
	Version: 0,
	Tab: 'insert',
	Before: 'insert',
	Page: 'export',
	Width: 'desktop',
	Preview: false,
	Outlines: true,
	Gaps: true,
	Inspect: false,
	Lines: false,
	Rulers: true,
	Query: '',
	ImportText: '',
	NewName: '',
	FileFailed: false,
	Settings: false,
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

		/* The mode of the Designer: template, component or application. */
		this.Mode = function (version) {
			return version >= 0 ? designer.Project().Mode : 'template';
		};

		/* The documents open, a tab each, in the order they were opened. */
		this.Tabs = function (version) {
			var project = version >= 0 ? designer.Project() : {Documents: [], Tabs: []};

			return project.Tabs.map(function (id) {
				var item = project.Documents.filter(function (entry) {
					return entry.ID === id;
				})[0];

				return {ID: id, Name: item.Name, Icon: item.Type === 'page' ? 'file' : 'layout', Active: id === project.Current};
			});
		};

		this.Name = function (version) {
			return version >= 0 ? designer.Project().Name : '';
		};

		/* The kinds of a new project, for its cards. */
		this.Kinds = function (language) {
			return language ? [
				{ID: 'template', Icon: 'file-code', Title: Elemenx.Locale.Text('builder.kinds.template'), Text: Elemenx.Locale.Text('builder.kinds.templateText')},
				{ID: 'component', Icon: 'layout', Title: Elemenx.Locale.Text('builder.kinds.component'), Text: Elemenx.Locale.Text('builder.kinds.componentText')},
				{ID: 'application', Icon: 'launcher', Title: Elemenx.Locale.Text('builder.kinds.application'), Text: Elemenx.Locale.Text('builder.kinds.applicationText')}
			] : [];
		};

		/* The projects kept, the last changed first: their name, their kind, when they changed. */
		this.Projects = function (version, language) {
			var format = self.$Service('Format');
			var icons = {template: 'file-code', component: 'layout', application: 'launcher'};

			return version >= 0 && language ? designer.Projects().map(function (entry) {
				return {ID: entry.ID, Name: entry.Name, Icon: icons[entry.Mode], Kind: Elemenx.Locale.Text('builder.kinds.' + entry.Mode), When: entry.Changed ? format.Relative(new Date(entry.Changed)) : '', Current: entry.Current};
			}) : [];
		};

		/* The name of the document being edited, for the status bar. */
		this.Where = function (version) {
			var project = version >= 0 ? designer.Project() : {Documents: []};
			var item = project.Documents.filter(function (entry) {
				return entry.ID === project.Current;
			})[0];

			return item ? item.Name : '';
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

		/* The options of the canvas as they were left. */
		try {
			saved = JSON.parse(window.localStorage.getItem('elemenx-builder:canvas') || '{}') || {};
		}
		catch (error) {
			saved = {};
		}

		['Outlines', 'Gaps', 'Inspect', 'Lines', 'Rulers'].forEach(function (key) {
			if (typeof saved[key] === 'boolean')
				self[key] = saved[key];
		});
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

	/*
	 * Run and Stop: the page works as it will, or is built again. The run brings a tab of its own to the Ribbon (Inspect,
	 * Outlines, Stop) and shows it; the stop takes it away and goes back to the tab before.
	 */
	Ran: function () {
		this.Preview = !this.Preview;

		if (this.Preview) {
			this.Before = this.Tab;
			this.Tab = 'run';
		}
		else {
			this.Tab = this.Before || 'insert';
		}
	},

	/* An option of the canvas, kept for the next visit and the next run (Outlines, Gaps, Inspect, Lines). */
	Remember: function (name, value) {
		var options = {};

		this[name] = value;

		['Outlines', 'Gaps', 'Inspect', 'Lines', 'Rulers'].forEach(function (key) {
			options[key] = this[key];
		}, this);

		try {
			window.localStorage.setItem('elemenx-builder:canvas', JSON.stringify(options));
		}
		catch (error) {
			return;
		}
	},


	/* A new page or component of the application, edited at once. */
	Created: function (type) {
		var designer = this.$Service('Designer');
		var id = designer.AddDocument(type);
		if (id)
			designer.Open(id);

		this.Settings = false;
	},

	Configured: function () {
		this.Settings = true;
	},

	/* A document opened by the explorer or the settings: the canvas shows it. */
	Opened: function () {
		this.Settings = false;
	},

	/* The tab of a document pressed. */
	Switched: function (event, node) {
		this.$Service('Designer').Open(node.getAttribute('data-document'));

		this.Settings = false;
	},

	/* The cross of a tab: the document stays in the project, its tab goes. */
	Closed: function (event, node) {
		this.$Service('Designer').Close(node.getAttribute('data-document'));
	},

	NewNamed: function (value) {
		this.NewName = value;
	},

	/* A new project of the kind of the card pressed, edited at once. */
	Made: function (event, node) {
		this.$Service('Designer').Create(node.getAttribute('data-mode'), this.NewName);

		this.NewName = '';
		this.Settings = false;

		this.Shut();
	},

	/* A project kept, edited again. */
	Picked: function (event, node) {
		this.$Service('Designer').Switch(node.getAttribute('data-project'));

		this.Settings = false;

		this.Shut();
	},

	/* A project taken away for good, once the dialog agreed. */
	Unmade: function (event, node) {
		var designer = this.$Service('Designer');
		var id = node.getAttribute('data-project');
		var entry = designer.Projects().filter(function (item) {
			return item.ID === id;
		})[0];
		if (!entry) return;

		this.$Service('Dialogs').Confirm({Title: Elemenx.Locale.Text('builder.removeProject'), Message: Elemenx.Locale.Text('builder.removeProjectText', {name: entry.Name}), Actions: [{ID: 'cancel', Label: Elemenx.Locale.Text('builder.cancel')}, {ID: 'remove', Label: Elemenx.Locale.Text('builder.removeProject'), Variant: 'danger'}]}, function (action) {
			if (action === 'remove')
				designer.RemoveProject(id);
		});
	},

	/* A project read from a file chosen, edited at once; a file that is not one says so. */
	Filed: function (event, node) {
		var self = this;
		var file = node.files && node.files[0];
		var reader;

		if (!file) return;

		reader = new FileReader();

		reader.onload = function () {
			var id = self.$Service('Designer').ImportProject(reader.result);

			node.value = '';
			self.FileFailed = !id;

			if (!id) return;

			self.Settings = false;

			self.Shut();
		};

		reader.readAsText(file);
	},

	/* The project being edited saved into a file, to open again here or in another browser. */
	Saved: function () {
		this.$Service('Packager').Save(this.File(this.$Service('Designer').Project().Name) + '.elemenx.json', this.$Service('Designer').ExportProject(), 'application/json');
	},

	/* The backstage closed, the canvas in view. */
	Shut: function () {
		var backstage = this.$Element().querySelector('.elemenx-ribbon-backstage');
		if (backstage)
			backstage.dispatchEvent(new CustomEvent('elemenx-ribbon-close', {bubbles: true, detail: {Focus: false}}));
	},

	Chosen: function (value) {
		this.Use(value);
	},

	TabChanged: function (event) {
		this.Tab = event.ID;
	},

	/* The backstage opened again on the page of the import: the template of now, not the one of the last time. */
	Backstaged: function (event) {
		if (event.Open && this.Page === 'import')
			this.Paged({ID: 'import'});
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
		else if (command === 'outlines') this.Remember('Outlines', !this.Outlines);
		else if (command === 'gaps') this.Remember('Gaps', !this.Gaps);
		else if (command === 'inspect') this.Remember('Inspect', !this.Inspect);
		else if (command === 'lines') this.Remember('Lines', !this.Lines);
		else if (command === 'rulers') this.Remember('Rulers', !this.Rulers);
		else if (command === 'stop') this.Ran();
		else if (command === 'new-page' || command === 'new-component') this.Created(command.substring(4));
		else if (command === 'settings') this.Settings = !this.Settings;
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
		this.$Service('Designer').SetSetting('Name', value);
	},

	/*
	 * What downloads: the template of the page (in a template), or the application of the project ({Name, Title,
	 * Language, Theme, Router, Description, Icon, Component, NotFound, Routes, Guards, Pages, Components}; in a
	 * component, that component alone), with the name of its file and the options of the Packager (the splash of an
	 * application among them).
	 */
	Pack: function () {
		var designer = this.$Service('Designer');
		var project = designer.Project();
		var name = project.Name || 'Page';
		var documents;

		if (project.Mode === 'template')
			return {Source: designer.Template(false), Name: name, Options: {Title: name, Language: this.Language}};

		documents = project.Documents.filter(function (item) {
			return project.Mode === 'application' || item.ID === project.Current;
		}).map(function (item) {
			item.Template = designer.Source(item.ID);

			return item;
		});

		return {
			Source: {
				Name: project.Name,
				Title: project.Settings.Title,
				Language: project.Settings.Language,
				Theme: project.Settings.Theme,
				Router: project.Settings.Router,
				Description: project.Settings.Description,
				Icon: project.Settings.Icon,
				Component: project.Settings.Component,
				NotFound: project.Settings.NotFound,
				Routes: project.Mode === 'application' ? project.Routes : [],
				Guards: project.Mode === 'application' ? project.Guards : [],
				Pages: documents.filter(function (item) {
					return item.Type === 'page';
				}),
				Components: documents.filter(function (item) {
					return item.Type === 'component';
				})
			},
			Name: project.Mode === 'application' ? project.Name : documents[0].Name,
			Options: {Title: project.Settings.Title || project.Name, Language: project.Settings.Language, Theme: project.Settings.Theme, Description: project.Settings.Description, Icon: project.Settings.Icon, Splash: project.Mode === 'application' && project.Settings.Splash === 'true' ? {
				Image: project.Settings.SplashImage,
				Background: project.Settings.SplashBackground,
				Color: project.Settings.SplashColor,
				Text: project.Settings.SplashText,
				Spinner: project.Settings.SplashSpinner === 'true',
				MinTime: Number(project.Settings.SplashMinTime) || 0,
				HTML: project.Settings.SplashHTML
			} : null, PWA: project.Mode === 'application' && project.Settings.PWA === 'true' ? {
				ShortName: project.Settings.PWAShortName,
				Icon: project.Settings.PWAIcon,
				Theme: project.Settings.PWATheme,
				Display: project.Settings.PWADisplay,
				Offline: project.Settings.PWAOffline === 'true',
				Update: project.Settings.PWAUpdate || 'auto'
			} : null}
		};
	},

	/* The page, or the application, in one HTML file (the bundles of npm run dist inside it). */
	DownloadedHtml: function () {
		var self = this;
		var packager = this.$Service('Packager');
		var pack = this.Pack();

		this.PackageFailed = '';

		packager.Html(pack.Source, pack.Options, function (error, text) {
			if (error) {
				self.PackageFailed = error.message;

				return;
			}

			packager.Save(self.File(pack.Name) + '.html', text, 'text/html');
		});
	},

	/* The page, or the application, as a project of Elemenx in a zip, for elemenx dev and elemenx build. */
	DownloadedProject: function () {
		var packager = this.$Service('Packager');
		var pack = this.Pack();

		packager.Save(this.File(pack.Name) + '.zip', packager.Project(pack.Source, pack.Options), 'application/zip');
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
