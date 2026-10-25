/*
 * The menu of the tray of a program drawn by ElemenxUI: the list a NativeMenu of the tray puts in its window
 * (Native.TrayPopup), as a MenuList draws it. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items,
 * Separator, Group}]; an item with Items opens them in its place, with a row back; Choose(item) is called with a leaf
 * chosen, and the window hides. The window is see-through and takes the size of the list, so the list has the corners
 * and the shadow of a menu of the page. The pointer and the arrows light an item (Enter or the right arrow takes it,
 * the left arrow goes back a level); Escape hides the window, or goes back a level.
 */
Elemenx.Component('NativeMenuPanel', {
	$TemplateURL: 'NativeMenuPanel.html',
	$StyleURL: 'NativeMenuPanel.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'menu',
		Description: 'The menu of the tray of a program drawn by ElemenxUI: the list a NativeMenu of the tray puts in its window.',
		Props: {
			Items: 'The items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}].',
			Choose: 'Called with the item chosen.'
		},
		Sample: {Items: [{ID: 'show', Label: 'Show'}, {Separator: true}, {ID: 'quit', Label: 'Quit'}]}
	},
	Items: [],
	Choose: null,
	Path: [],
	Active: -1,

	$OnCreate: function () {
		var self = this;

		/* The items of the level shown: the top, or the items of the item of the path. */
		this.Level = function (items, path) {
			var level = items || [];

			(path || []).forEach(function (index) {
				level = level[index] && level[index].Items ? level[index].Items : [];
			});

			return level;
		};

		this.Parent = function (items, path) {
			return path && path.length ? self.Level(items, path.slice(0, -1))[path[path.length - 1]] : null;
		};

		/* The window as large as the list, after each drawing of it. */
		this.Sized = function (items, path) {
			return {
				Render: function () {
					if (items && path)
						self.Fit();
				}
			};
		};
	},

	/* The window as large as the list with its margins, the room of its shadow. */
	Fit: function () {
		var self = this;

		/* By the timers of the page: a window not shown yet runs no frames, but its layout is there to read. */
		window.setTimeout(function () {
			measure();
		}, 0);

		window.setTimeout(function () {
			measure();
		}, 300);

		function measure () {
			var element = self.$Element();
			var own = element.ownerDocument.defaultView;
			var box = element.getBoundingClientRect();
			var style;

			if (!own) return;

			style = own.getComputedStyle(element);

			/* Its styles come to its window a moment later: the size is told again as it changes. */
			if (!self.Watcher && own && typeof own.ResizeObserver === 'function') {
				self.Watcher = new own.ResizeObserver(function () {
					measure();
				});

				self.Watcher.observe(element);
			}

			if (box && box.width && box.height) {
				self.$Service('Native').ShowTrayPopup({
					Width: Math.ceil(box.width + (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0)),
					Height: Math.ceil(box.height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0))
				});
			}
		}
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();
	},

	Hover: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Leave: function () {
		this.Active = -1;
	},

	/* The next item that can be chosen from the lit one, down (1) or up (-1), round the level. */
	Move: function (direction) {
		var level = this.Level(this.Items, this.Path);
		var index = this.Active;
		var steps = 0;

		while (steps < level.length) {
			index = (index + direction + level.length) % level.length;

			if (level[index] && !level[index].Separator && !level[index].Group && !level[index].Disabled) return index;

			steps++;
		}

		return -1;
	},

	Pick: function (event, node) {
		var item = this.Level(this.Items, this.Path)[Number(node.getAttribute('data-index'))];
		if (!item || item.Disabled) return;

		this.Take(item, Number(node.getAttribute('data-index')));
	},

	/* An item chosen: its level opened in place, or the item given to Choose and the window hidden. */
	Take: function (item, index) {
		if (item.Items) {
			this.Path = this.Path.concat([index]);
			this.Active = -1;

			return;
		}

		this.Path = [];
		this.Active = -1;

		this.$Service('Native').ShowTrayPopup(false);

		if (typeof this.Choose === 'function')
			this.Choose(item);
	},

	Back: function () {
		this.Active = this.Path.length ? this.Path[this.Path.length - 1] : -1;
		this.Path = this.Path.slice(0, -1);
	},

	Key: function (event) {
		var key = Elemenx.Locale.Key(event);
		var item = this.Level(this.Items, this.Path)[this.Active];

		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();

			this.Active = this.Move(key === 'ArrowDown' ? 1 : -1);

			return;
		}

		if ((key === 'Enter' || key === ' ' || (key === 'ArrowRight' && item && item.Items)) && item && !item.Disabled) {
			event.preventDefault();

			this.Take(item, this.Active);

			return;
		}

		if (key === 'ArrowLeft' && this.Path.length) {
			event.preventDefault();

			this.Back();

			return;
		}

		if (key !== 'Escape') return;

		if (this.Path.length) {
			this.Back();

			return;
		}

		this.$Service('Native').ShowTrayPopup(false);
	}
});
