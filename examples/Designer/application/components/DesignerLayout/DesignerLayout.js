/*
 * The Designer: a Workspace around the Designer components of ElemenxUI, under a Ribbon. The File button opens the
 * backstage: the template of the page to copy (Export), a template to read in its place (Import), the page or the
 * application as an Application to download (one HTML file that runs alone, or a project in a zip; the Packager
 * Service), and Clear; before them Create (a new project: a template, a component or an application, a mode that stays
 * its own) and Open (the projects kept, a project read from a file or saved into one). The tabs: Home (undo and redo; a
 * copy, the removal, the moves and the parent of the selected element), Project (in an application: a new page or
 * component, the settings of the Application in the main area; each document open has a tab over the canvas, closed by
 * its cross, and the explorer of the project lists them all; the menu of a tab splits it into panes: one document in
 * as many as it is wanted, each with its own selection, the structure and the properties following the pane of the
 * focus, the layout kept for the project in the storage of the browser), Insert (every component of ElemenxUI and
 * the classes of its layouts, a gallery for each group of the palette, with a search: a sample pressed goes into the
 * selected element, or after it; a sample dragged goes where the canvas or the structure takes it) and View (the
 * width of the canvas, its outlines, gaps and rulers). The header runs the page and stops it (Run, Stop), inspects it
 * while it runs, and switches the language and the theme. The structure of the page is on the left, always in view, the layout and the
 * props of the selected element on the right (with none, the document: a page, a component), its template at the
 * bottom. The documents are the ones of the Designer Service. Keys: Mod+Z, Mod+Shift+Z (or Mod+Y), Mod+D (a copy),
 * Delete, Escape (no selection), and the key tips of the Ribbon (Alt).
 */
Elemenx.Component('DesignerLayout', {
	$TemplateURL: 'DesignerLayout.html',
	$StyleURL: 'DesignerLayout.css',
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
	Mapped: false,
	PackageFailed: '',
	ImportFailed: false,
	DiskFailed: '',
	Panes: null,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');
		var disk = this.$Service('Disk');
		var keys = [];
		var saved = null;
		var panes = {Pane: '', Selections: {}, Project: ''};
		var icons = {layout: 'layout', text: 'text-color', inputs: 'edit', buttons: 'launcher', navigation: 'menu', display: 'star', data: 'chart', overlays: 'panel-right', social: 'users', commerce: 'cart', music: 'headphones', game: 'trophy', tools: 'settings'};

		/* A change of the Designer; another project brings the panes it was left with. */
		function changed () {
			if (designer.Project().ID !== panes.Project)
				self.Unfold(designer.Project().ID);

			self.Version++;
		}

		/*
		 * A key of the Designer works outside the fields: a field keeps its own undo, the backstage its keys, so the key
		 * keeps its default action there.
		 */
		function bind (combination, run) {
			keys.push(self.$Service('Hotkeys').Bind(combination, function (event) {
				var target = event && event.target;
				if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"], .elemenx-ribbon-backstage.open')) return;

				if (event)
					event.preventDefault();

				run();
			}, {Group: 'Designer', Prevent: false}));
		}

		function kind (entry) {
			return {ID: entry.ID, Label: designer.Label(entry.ID), Icon: entry.Icon, Hint: designer.Hint(entry.ID)};
		}

		/* Opened by elemenx designer on a project: its projects of the Designer apart, its Components in the palette. */
		if (disk.Project()) {
			designer.Scope(disk.Project().Name);

			disk.Load(function (error, components) {
				designer.Extend(components);

				self.DiskFailed = error ? error.message : '';

				changed();
			});
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

		/* What the Designer keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return {Keys: keys, Changed: changed, Panes: panes};
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

		/* The project of elemenx designer, its files as a tree (none out of it). */
		this.OnDisk = function () {
			return !!disk.Project();
		};

		this.DiskTree = function (version, language) {
			return version >= 0 && language ? disk.Tree() : [];
		};

		/* The kinds of a new project, for its cards. */
		this.Kinds = function (language) {
			return language ? [
				{ID: 'template', Icon: 'file-code', Title: Elemenx.Locale.Text('designer.kinds.template'), Text: Elemenx.Locale.Text('designer.kinds.templateText')},
				{ID: 'component', Icon: 'layout', Title: Elemenx.Locale.Text('designer.kinds.component'), Text: Elemenx.Locale.Text('designer.kinds.componentText')},
				{ID: 'application', Icon: 'launcher', Title: Elemenx.Locale.Text('designer.kinds.application'), Text: Elemenx.Locale.Text('designer.kinds.applicationText')}
			] : [];
		};

		/* The projects kept, the last changed first: their name, their kind, when they changed. */
		this.Projects = function (version, language) {
			var format = self.$Service('Format');
			var icons = {template: 'file-code', component: 'layout', application: 'launcher'};

			return version >= 0 && language ? designer.Projects().map(function (entry) {
				return {ID: entry.ID, Name: entry.Name, Icon: icons[entry.Mode], Kind: Elemenx.Locale.Text('designer.kinds.' + entry.Mode), When: entry.Changed ? format.Relative(new Date(entry.Changed)) : '', Current: entry.Current};
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

		this.Unfold(designer.Project().ID);

		try {
			saved = window.localStorage.getItem('elemenx-designer:language');
		}
		catch (error) {
			saved = null;
		}

		this.Use(saved || (/^ru\b/i.test(navigator.language || '') ? 'ru' : 'en'));

		/* The options of the canvas as they were left. */
		try {
			saved = JSON.parse(window.localStorage.getItem('elemenx-designer:canvas') || '{}') || {};
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
			window.localStorage.setItem('elemenx-designer:language', language);
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
			window.localStorage.setItem('elemenx-designer:canvas', JSON.stringify(options));
		}
		catch (error) {
			return;
		}
	},

	/* A new page or component of the application, edited at once in the pane of the focus. */
	Created: function (type) {
		var designer = this.$Service('Designer');
		var id = designer.AddDocument(type);
		if (!id) return;

		designer.Open(id);

		this.Reveal(id);
	},

	/* The settings of the Application: their tab, pinned first in the strip. */
	Configured: function () {
		this.Reveal('@settings');
	},

	/* A document opened by the explorer: its pane. */
	Opened: function () {
		this.Reveal(this.$Service('Designer').Opened());
	},

	/* A page pressed on the map: its pane. */
	MapOpened: function (id) {
		this.$Service('Designer').Open(id);

		this.Reveal(id);
	},

	/*
	 * A Component of the files of the project picked in its tree: a copy of it in the project, edited at once (the files
	 * stay as they are). One the framework has already, or a project that is not an application, says so.
	 */
	DiskPicked: function (item) {
		var designer = this.$Service('Designer');
		var name = item && /^component:/.test(item.ID) ? item.ID.substring('component:'.length) : '';
		var id;

		if (!name) return;

		id = designer.Copy(name);

		if (!id) {
			this.$Service('Toast').Show({Message: Elemenx.Locale.Text(designer.Project().Mode === 'application' ? 'designer.disk.notCopied' : 'designer.disk.notApplication', {name: name})});

			return;
		}

		designer.Open(id);

		this.Reveal(id);
	},

	/*
	 * The panes of an application: a TabSplit of the documents open, the settings and the map, a document in as many
	 * panes as the menu of its tab makes (copies: <ID>:2...). The pane of the focus is the document the Designer edits,
	 * the one the structure and the properties show, and each pane keeps its own selection. The layout of the panes is
	 * kept for each project in the storage of the browser.
	 */

	/* The document of a pane: the ID of its tab less the number of a copy (d2:2); none for the settings and the map. */
	DocumentOf: function (pane) {
		return pane && pane.charAt(0) !== '@' ? String(pane).split(':')[0] : '';
	},

	/* The TabSplit of the panes (an application has one). */
	Split: function () {
		var element = this.$Element().querySelector('.designer-main > .elemenx-tab-split');

		return element ? Elemenx.Instance(element) : null;
	},

	/* The key of the storage of the panes of a project; a project of elemenx designer apart. */
	PanesKey: function (id) {
		var disk = this.$Service('Disk').Project();

		return 'elemenx-designer:panes:' + (disk ? disk.Name + ':' : '') + id;
	},

	/*
	 * Another project: the panes it was left with (one group of all its tabs the first time), the focus on the pane of the
	 * document it edits once the panes are there.
	 */
	Unfold: function (id) {
		var panes = this.Own().Panes;
		var saved = null;

		panes.Project = id;
		panes.Pane = '';
		panes.Selections = {};

		try {
			saved = JSON.parse(window.localStorage.getItem(this.PanesKey(id)) || 'null');
		}
		catch (error) {
			saved = null;
		}

		this.Panes = saved && typeof saved === 'object' ? saved : {Group: 'main', Tabs: [], Active: null};

		this.Reveal(this.$Service('Designer').Opened());
	},

	/* The groups of a layout, its tabs in each: [{Group, Tabs, Active}]. */
	Leaves: function (tree) {
		var list = [];

		function walk (node) {
			if (!node) return;

			if (node.Split) node.Children.forEach(walk);
			else list.push(node);
		}

		walk(tree);

		return list;
	},

	/*
	 * The pane that shows a document (or the tab of the settings, of the map): the pane of the focus when it does, else a
	 * pane where it is the current tab, else any tab of it; '' when none does.
	 */
	PaneOf: function (tree, id) {
		var self = this;
		var groups = this.Leaves(tree);
		var pane = this.Own().Panes.Pane;
		var any = [];
		var active;
		var focused;

		function matches (tab) {
			return !!tab && (tab === id || self.DocumentOf(tab) === id);
		}

		active = groups.filter(function (group) {
			return matches(group.Active);
		})[0];

		focused = matches(pane) && groups.some(function (group) {
			return group.Active === pane;
		});

		if (focused)
			return pane;

		if (active)
			return active.Active;

		groups.forEach(function (group) {
			any = any.concat(group.Tabs.filter(matches));
		});

		return any[0] || '';
	},

	/* Shows the pane of a document, or of the settings, of the map, and gives it the focus; its tab, once it is there. */
	Reveal: function (id, tries) {
		var self = this;
		var split = this.Split();
		var pane = split ? this.PaneOf(split.Model(), id) : '';

		if (!pane) {
			if ((tries || 0) < 60 && this.Mode(0) === 'application')
				window.requestAnimationFrame(function () {
					self.Reveal(id, (tries || 0) + 1);
				});

			return;
		}

		split.Open(pane);

		this.Focus(pane);
	},

	/*
	 * The pane of the focus: its document is the one the Designer edits, with the selection that pane had (the first pane
	 * of the focus keeps the selection there is). The settings and the map edit nothing: the document stays.
	 */
	Focus: function (pane) {
		var designer = this.$Service('Designer');
		var panes = this.Own().Panes;
		var id = this.DocumentOf(pane);
		var before = panes.Pane;
		var split = this.Split();

		if (!pane || pane === before) return;

		if (this.DocumentOf(before) && this.DocumentOf(before) === designer.Opened())
			panes.Selections[before] = designer.Selected();

		panes.Pane = pane;

		/* The TabSplit marks it, and opens a new tab in it. */
		if (split)
			split.Open(pane);

		if (this.Settings !== (pane === '@settings'))
			this.Settings = pane === '@settings';

		if (this.Mapped !== (pane === '@map'))
			this.Mapped = pane === '@map';

		if (!id || (!before && id === designer.Opened())) return;

		if (designer.Opened() !== id)
			designer.Open(id);

		designer.Select(panes.Selections[pane] || null);
	},

	/* A press or the focus in a pane: the current tab of its group has the focus. */
	Touched: function (event) {
		var group = event.target && event.target.closest ? event.target.closest('.elemenx-tab-split-group') : null;
		var split = this.Split();
		var panel;

		if (!group || !split || group.closest('.elemenx-tab-split') !== split.$Element()) return;

		panel = group.querySelector('.elemenx-tab-group-body > .elemenx-tab-panel.active');

		if (panel)
			this.Focus(panel.getAttribute('data-id'));
	},

	/* A tab opened in its strip. */
	Chose: function (id) {
		this.Focus(id);
	},

	/* A canvas of another document pressed, or a drag over it: its pane has the focus. */
	Woken: function (id, canvas) {
		var panel = canvas && canvas.$Element ? canvas.$Element().closest('.elemenx-tab-panel') : null;
		var split = this.Split();

		this.Focus(panel ? panel.getAttribute('data-id') : this.PaneOf(split ? split.Model() : null, id));
	},

	/* A pane made by the menu of a tab, a copy of it: the focus, with the selection of the pane it came of. */
	Copied: function (detail) {
		var designer = this.$Service('Designer');
		var panes = this.Own().Panes;

		panes.Selections[detail.ID] = this.DocumentOf(detail.Of) === designer.Opened() ? designer.Selected() : panes.Selections[detail.Of] || null;

		this.Focus(detail.ID);
	},

	/*
	 * The layout changed: kept for the project. When the pane of the focus went (its tab closed, a copy) or there was none
	 * yet, the focus goes to the pane of the document edited, else to the current tab of the first group.
	 */
	Laid: function (model) {
		var designer = this.$Service('Designer');
		var panes = this.Own().Panes;
		var groups = this.Leaves(model);
		var next;

		try {
			window.localStorage.setItem(this.PanesKey(panes.Project), JSON.stringify(model));
		}
		catch (error) {
			next = '';
		}

		if (groups.some(function (group) {
			return group.Tabs.indexOf(panes.Pane) !== -1;
		})) return;

		next = this.PaneOf(model, designer.Opened()) || (groups[0] && groups[0].Active) || '';

		/* The pane that went edited the document the next one shows: the selection stays. */
		if (this.DocumentOf(next) === designer.Opened())
			panes.Pane = '';

		this.Focus(next);
	},

	/*
	 * The cross of the tab of a document: the document stays in the project, its tab goes (a copy goes by itself); a
	 * document still in another pane stays open. The Designer edits then the tab beside the one that went: the pane of
	 * the focus tells which document it edits.
	 */
	Closed: function (id) {
		var self = this;
		var designer = this.$Service('Designer');
		var panes = this.Own().Panes;
		var split = this.Split();
		var shut = this.DocumentOf(id);
		var edited;
		var shown = this.Leaves(split ? split.Model() : null).some(function (group) {
			return group.Tabs.some(function (tab) {
				return self.DocumentOf(tab) === shut;
			});
		});
		if (shown || !designer.Close(shut)) return;

		edited = this.DocumentOf(panes.Pane);

		if (edited && edited !== designer.Opened()) {
			designer.Open(edited);
			designer.Select(panes.Selections[panes.Pane] || null);
		}
	},

	NewNamed: function (value) {
		this.NewName = value;
	},

	/* A new project of the kind of the card pressed, edited at once. */
	Made: function (event, node) {
		this.$Service('Designer').Create(node.getAttribute('data-mode'), this.NewName);

		this.NewName = '';
		this.Settings = false;
		this.Mapped = false;

		this.Shut();
	},

	/* A project kept, edited again. */
	Picked: function (event, node) {
		this.$Service('Designer').Switch(node.getAttribute('data-project'));

		this.Settings = false;
		this.Mapped = false;

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

		this.$Service('Dialogs').Confirm({Title: Elemenx.Locale.Text('designer.removeProject'), Message: Elemenx.Locale.Text('designer.removeProjectText', {name: entry.Name}), Actions: [{ID: 'cancel', Label: Elemenx.Locale.Text('designer.cancel')}, {ID: 'remove', Label: Elemenx.Locale.Text('designer.removeProject'), Variant: 'danger'}]}, function (action) {
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
			self.Mapped = false;

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
		else if (command === 'settings') this.Reveal(this.Settings ? designer.Opened() : '@settings');
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
			Message: Elemenx.Locale.Text('designer.cleared'),
			Actions: [{Label: Elemenx.Locale.Text('designer.undo'), Run: function () {
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
