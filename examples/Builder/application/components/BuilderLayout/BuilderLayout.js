/*
 * The frame of the builder: a Workspace with the palette (every component of ElemenxUI and the classes of its layouts,
 * with a search) and the structure of the page on the left, its props on the
 * right, the template of the page at the bottom and the canvas in the middle; the toolbar above them undoes and redoes,
 * sets the width of the canvas, previews the page, exports and imports its template, clears it, and switches the
 * language and the theme. Keys: Mod+Z, Mod+Shift+Z (or Mod+Y), Mod+D (a copy), Delete, Escape (no selection).
 */
Elemenx.Component('BuilderLayout', {
	$TemplateURL: 'BuilderLayout.html',
	$StyleURL: 'BuilderLayout.css',
	Languages: [{Value: 'en', Label: 'EN'}, {Value: 'ru', Label: 'RU'}],
	Language: 'en',
	Version: 0,
	Selected: null,
	Width: 'desktop',
	Preview: false,
	Collapsed: [],
	Exporting: false,
	Importing: false,
	ImportText: '',
	ImportFailed: false,
	Query: '',

	$OnCreate: function () {
		var self = this;
		var design = this.$Service('Design');
		var keys = [];
		var saved = null;

		function changed () {
			if (self.Selected && !design.Find(self.Selected))
				self.Selected = null;

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

		design.OnChange(changed);

		bind('Mod+Z', function () {
			design.Undo();
		});

		bind('Mod+Shift+Z', function () {
			design.Redo();
		});

		bind('Mod+Y', function () {
			design.Redo();
		});

		bind('Mod+D', function () {
			if (self.Selected)
				self.Selected = design.Duplicate(self.Selected);
		});

		bind('Delete', function () {
			self.Remove();
		});

		bind('Escape', function () {
			self.Selected = null;
		});

		/* What the builder keeps for itself: not state, so it renders nothing. */
		this.Own = function () {
			return {Keys: keys, Changed: changed};
		};

		/* The groups of the palette with their kinds, the ones whose name holds the text of the search (query). */
		this.Groups = function (language, query) {
			var text = String(query || '').trim().toLowerCase();

			return design.Kinds().map(function (group) {
				return {
					ID: group.ID,
					Label: language ? Elemenx.Locale.Text('builder.groups.' + group.ID) : group.ID,
					Kinds: group.Kinds.map(function (kind) {
						return {ID: kind.ID, Icon: kind.Icon, Label: design.Label(kind.ID)};
					}).filter(function (kind) {
						return !text || kind.Label.toLowerCase().indexOf(text) !== -1 || kind.ID.toLowerCase().indexOf(text) !== -1;
					})
				};
			}).filter(function (group) {
				return group.Kinds.length > 0;
			});
		};

		this.Widths = function (language) {
			return ['desktop', 'tablet', 'phone'].map(function (width) {
				return {Value: width, Label: language ? Elemenx.Locale.Text('builder.' + width) : width};
			});
		};

		/* The structure of the page for the Tree: every element, with the text it shows when it has some. */
		this.TreeItems = function (version, language) {
			function items (node) {
				return node.Children.map(function (child) {
					var kind = design.Kind(child.Kind);
					var label = design.Label(child.Kind);
					var detail = child.Text || child.Props.Label || child.Props.Title || (child.Kind === 'element' ? child.Props.Tag : '');

					return {ID: child.ID, Label: detail ? label + ' · ' + detail : label, Icon: kind ? kind.Icon : 'code', Items: child.Children.length ? items(child) : undefined};
				});
			}

			return version >= 0 && language ? items(design.Root()) : [];
		};

		this.Expanded = function (version, collapsed) {
			var open = [];

			function walk (node) {
				node.Children.forEach(function (child) {
					if (child.Children.length && collapsed.indexOf(child.ID) === -1)
						open.push(child.ID);

					walk(child);
				});
			}

			if (version >= 0)
				walk(design.Root());

			return open;
		};

		this.Code = function (version) {
			return version >= 0 ? design.Template(false) : '';
		};

		this.Count = function (version) {
			var count = 0;

			function walk (node) {
				count += node.Children.length;

				node.Children.forEach(walk);
			}

			if (version >= 0)
				walk(design.Root());

			return count;
		};

		this.CanUndo = function (version) {
			return version >= 0 && design.CanUndo();
		};

		this.CanRedo = function (version) {
			return version >= 0 && design.CanRedo();
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

		this.$Service('Design').OffChange(this.Own().Changed);

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
		this.$Service('Design').Undo();
	},

	Redo: function () {
		this.$Service('Design').Redo();
	},

	Picked: function (id) {
		this.Selected = id;
	},

	TreePicked: function (item) {
		this.Selected = item ? item.ID : null;
	},

	/* The Tree reports the open elements: the others, among those with children, are closed. */
	Expand: function (open) {
		var closed = [];

		function walk (node) {
			node.Children.forEach(function (child) {
				if (child.Children.length && open.indexOf(child.ID) === -1)
					closed.push(child.ID);

				walk(child);
			});
		}

		walk(this.$Service('Design').Root());

		this.Collapsed = closed;
	},

	/*
	 * A kind of the palette pressed: it goes into the selected element when that is a container, after it otherwise, and
	 * at the end of the page without a selection; the new element is selected.
	 */
	Searched: function (value) {
		this.Query = value;
	},

	Added: function (event, node) {
		var design = this.$Service('Design');
		var kind = node.getAttribute('data-kind');
		var parent;
		var id;

		if (this.Selected && design.Container(this.Selected)) {
			id = design.Insert(kind, this.Selected);
		}
		else if (this.Selected) {
			parent = design.Parent(this.Selected);
			id = design.Insert(kind, parent.ID, parent.Children.indexOf(design.Find(this.Selected)) + 1);
		}
		else {
			id = design.Insert(kind, 'root');
		}

		this.Selected = id;
	},

	/* A drop on the canvas: a kind of the palette makes a new element there, an element moves there. */
	Dropped: function (drop) {
		var design = this.$Service('Design');

		if (drop.Kind) {
			this.Selected = design.Insert(drop.Kind, drop.Parent, drop.Index);

			return;
		}

		if (drop.Node && design.Move(drop.Node, drop.Parent, drop.Index))
			this.Selected = drop.Node;
	},

	Remove: function () {
		var design = this.$Service('Design');
		var parent;

		if (!this.Selected) return;

		parent = design.Parent(this.Selected);

		design.Remove(this.Selected);

		this.Selected = parent && parent.ID !== 'root' ? parent.ID : null;
	},

	Cleared: function () {
		var self = this;
		var design = this.$Service('Design');
		if (!design.Root().Children.length) return;

		design.Clear();

		this.Selected = null;

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
		this.ImportText = this.$Service('Design').Template(false);
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
		if (!this.$Service('Design').Import(this.ImportText)) {
			this.ImportFailed = true;

			return;
		}

		this.Selected = null;
		this.Importing = false;
	}
});
