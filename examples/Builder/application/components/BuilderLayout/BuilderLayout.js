/*
 * The builder: a Workspace around the Designer components of ElemenxUI. On the left the palette (every component of
 * ElemenxUI and the classes of its layouts, with a search) over the structure of the page, always in view; the props
 * and the layout of the selected element on the right, the template of the page at the bottom and the canvas in the
 * middle. The toolbar above them undoes and redoes, sets the width of the canvas, previews the page, exports and
 * imports its template, clears it, and switches the language and the theme. The document is the one of the Designer
 * Service. Keys: Mod+Z, Mod+Shift+Z (or Mod+Y), Mod+D (a copy), Delete, Escape (no selection).
 */
Elemenx.Component('BuilderLayout', {
	$TemplateURL: 'BuilderLayout.html',
	$StyleURL: 'BuilderLayout.css',
	Languages: [{Value: 'en', Label: 'EN'}, {Value: 'ru', Label: 'RU'}],
	Language: 'en',
	Version: 0,
	Width: 'desktop',
	Preview: false,
	Exporting: false,
	Importing: false,
	ImportText: '',
	ImportFailed: false,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');
		var keys = [];
		var saved = null;

		function changed () {
			self.Version++;
		}

		/*
		 * A key of the builder works outside the fields and the dialogs: a field keeps its own undo, a dialog its Escape,
		 * so the key keeps its default action there.
		 */
		function bind (combination, run) {
			keys.push(self.$Service('Hotkeys').Bind(combination, function (event) {
				var target = event && event.target;

				if (self.Exporting || self.Importing) return;

				if (target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) return;

				if (event)
					event.preventDefault();

				run();
			}, {Group: 'Builder', Prevent: false}));
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
			if (designer.Selected())
				designer.Select(designer.Duplicate(designer.Selected()));
		});

		bind('Delete', function () {
			self.Remove();
		});

		bind('Escape', function () {
			designer.Select(null);
		});

		/* What the builder keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return {Keys: keys, Changed: changed};
		};

		this.Widths = function (language) {
			return ['desktop', 'tablet', 'phone'].map(function (width) {
				return {Value: width, Label: language ? Elemenx.Locale.Text('builder.' + width) : width};
			});
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

	Chosen: function (value) {
		this.Use(value);
	},

	Sized: function (value) {
		this.Width = value;
	},

	Previewed: function (value) {
		this.Preview = value;
	},

	Undo: function () {
		this.$Service('Designer').Undo();
	},

	Redo: function () {
		this.$Service('Designer').Redo();
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
				self.Undo();
			}}]
		});
	},

	ExportOpened: function () {
		this.Exporting = true;
	},

	ExportClosed: function () {
		this.Exporting = false;
	},

	ImportOpened: function () {
		this.ImportText = this.$Service('Designer').Template(false);
		this.ImportFailed = false;
		this.Importing = true;
	},

	ImportClosed: function () {
		this.Importing = false;
	},

	ImportTyped: function (value) {
		this.ImportText = value;
		this.ImportFailed = false;
	},

	Imported: function () {
		if (!this.$Service('Designer').Import(this.ImportText)) {
			this.ImportFailed = true;

			return;
		}

		this.Importing = false;
	}
});
