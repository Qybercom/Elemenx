/*
 * The menu of a program declared as a menu of the page: <NativeMenu> with MenuItem children, as in a Menu (a MenuItem
 * with MenuItems inside is a submenu). Target window (by default) is the menu of the window, its top-level items the
 * menus of a bar (File, Edit...); Target tray is the menu of the icon in the tray, opened by its right button. Look:
 * elemenx (by default) draws them with ElemenxUI: the menu of the window a MenuBar where the layout places the
 * NativeMenu (Caret, Variant and Size as in MenuBar; a program has no menu of the system without one), the menu of the tray a window of the Application at the pointer (Native.TrayPopup, a
 * NativeMenuPanel); system has the system draw them (Native.Menu, Native.TrayMenu). Both follow the template.
 * A MenuItem with a Role (undo, redo, cut, copy, paste, selectAll, reload, toggleDevTools, resetZoom, zoomIn, zoomOut,
 * togglefullscreen, minimize, close, quit) does what the system does for it (Native.Role), with the usual shortcut of
 * the role when it names none; its Shortcut is a hotkey of the program (Ctrl+N, Mod+N for Ctrl or Cmd). A choice is
 * the select of its MenuItem, as in the page, and the select of the NativeMenu with the item. On the web the menu of a
 * window is the bar without the items of the system, their shortcuts hotkeys of the page; a menu of the tray shows
 * nothing. Events: select (the item chosen), apply ({Error} when the system refused the menu).
 */
Elemenx.Component('NativeMenu', {
	$TemplateURL: 'NativeMenu.html',
	$StyleURL: 'NativeMenu.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'menu',
		Description: 'The menu of a program declared as a menu of the page: <NativeMenu> with MenuItem children.',
		Container: true,
		Children: ['MenuItem'],
		Events: {
			select: 'An item was chosen in the menu of the program: the item.',
			apply: 'The menu was given to the system: {Error}, null when it went well.'
		},
		Props: {
			Target: {Options: ['window', 'tray'], Description: 'The menu of the window of the program, or of its icon in the tray.'},
			Look: {Options: ['elemenx', 'system'], Description: 'Drawn by ElemenxUI (a bar of menus, a menu window by the tray), or by the system.'},
			Caret: 'Shows the arrow of a menu of the bar by its label.',
			Variant: 'The look of the buttons of the bar, as in Button.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'The size of the bar: small, medium or large.'}
		},
		Sample: {}
	},
	Target: 'window',
	Look: 'elemenx',
	Caret: false,
	Variant: 'ghost',
	Size: 'small',
	Items: [],
	Web: false,

	/* The usual shortcuts of the roles, for an item of a role that names none. */
	Shortcuts: {undo: 'Mod+Z', redo: 'Mod+Shift+Z', cut: 'Mod+X', copy: 'Mod+C', paste: 'Mod+V', selectAll: 'Mod+A', reload: 'Mod+R', toggleDevTools: 'Mod+Shift+I', resetZoom: 'Mod+0', zoomIn: 'Mod+=', zoomOut: 'Mod+-', togglefullscreen: 'F11', minimize: 'Mod+M', close: 'Mod+W', quit: 'Mod+Q'},

	/* The roles a page does by itself at their keys: the hotkeys of the menu leave them to it. */
	Editing: ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'],

	$OnCreate: function () {
		var self = this;

		this.Web = !this.$Service('Native').Available();

		/* Whether ElemenxUI draws the menu: always on the web, in a program but with Look system. */
		this.Drawn = function (look) {
			return self.Web || look !== 'system';
		};

		/* The menus of the bar: the top-level items with items of their own (a binding of the template calls it). */
		this.Bar = function (items) {
			return self.Shown(items).filter(function (item) {
				return item.Items && item.Items.length;
			});
		};
	},

	/* The items its MenuItems declare: drawn or given to the system as they change, their choices told to their MenuItems. */
	$OnReady: function () {
		var self = this;
		var native = this.$Service('Native');
		var own = {Picked: {}, Bound: [], Panel: null};

		this.Own = function () {
			return own;
		};

		own.Heard = function (event) {
			var item = own.Picked[event && event.ID];
			if (!item || (self.Target === 'tray') !== (event.Kind === 'menu')) return;

			self.Chosen(item);
		};

		if (!this.Web && !this.Drawn(this.Look))
			native.On(this.Target === 'tray' ? 'tray' : 'menu', own.Heard);

		/* A menu of the window drawn by the page: the system has none, so its keys and its bar are of the page alone. */
		if (!this.Web && this.Drawn(this.Look) && this.Target !== 'tray')
			native.Menu(null);

		this.Unwatch = this.$Service('Menus').Watch(this.$Element().querySelector('.elemenx-native-menu-sources'), function (items) {
			self.Items = items;

			if (!self.Drawn(self.Look)) self.Apply(items);
			else if (self.Target === 'tray') self.Panel(items);
			else self.Bind(items);
		});
	},

	$OnDestroy: function () {
		var native = this.$Service('Native');
		var own = this.Own ? this.Own() : null;

		if (this.Unwatch)
			this.Unwatch();

		if (!own) return;

		this.Bind([]);

		if (this.Web) return;

		if (!this.Drawn(this.Look)) {
			native.Off(this.Target === 'tray' ? 'tray' : 'menu', own.Heard);

			if (this.Target === 'tray') native.TrayMenu(null);
			else native.Menu(null);
		}
		else if (this.Target === 'tray') {
			native.TrayPopup(null);
		}
	},

	/* The items as the system takes them: an ID of its own for each, the hotkey of its Shortcut, its Role. */
	Native: function (items, picked, path) {
		var self = this;

		return items.map(function (item, index) {
			var id = path + index;
			var result;

			if (item.Separator)
				return {Separator: true};

			picked[id] = item;

			result = {ID: id, Label: item.Group || item.Label || undefined, Disabled: !!item.Disabled || !!item.Group, Role: item.Role || undefined};

			if (item.Shortcut)
				result.Hotkey = String(item.Shortcut).replace(/\bMod\b/g, 'CommandOrControl');

			if (item.Checked !== undefined)
				result.Checked = !!item.Checked;

			if (item.Items)
				result.Items = self.Native(item.Items, picked, id + '.');

			return result;
		});
	},

	/* The menu drawn by the system (Look system). */
	Apply: function (items) {
		var self = this;
		var native = this.$Service('Native');
		var picked = {};
		var menu = this.Native(items, picked, 'm');
		var done = function (error) {
			self.$Emit('apply', {Error: error || null});
		};

		this.Own().Picked = picked;

		if (this.Target === 'tray') native.TrayMenu(menu, done);
		else native.Menu(menu, done);
	},

	/*
	 * The items as ElemenxUI draws them: the shortcuts as the system writes them (a role with its usual one), and on the
	 * web without the items of the system, which a page cannot do (a separator left at an end, or twice, goes too).
	 */
	Shown: function (items) {
		var self = this;
		var hotkeys = this.$Service('Hotkeys');
		var visible = function (list) {
			var result = list.filter(function (item) {
				return !(item.Role && self.Web) && (item.Separator || item.Label || item.Group);
			}).map(function (item) {
				var copy = Object.assign({}, item);
				var shortcut = item.Shortcut || (item.Role ? self.Shortcuts[item.Role] : '');

				if (item.Items)
					copy.Items = visible(item.Items);

				if (shortcut)
					copy.Shortcut = hotkeys.Format(shortcut);

				return copy;
			}).filter(function (item) {
				return !item.Items || item.Items.length;
			});

			return result.filter(function (item, index) {
				return !item.Separator || (index > 0 && index < result.length - 1 && !result[index - 1].Separator);
			});
		};

		return visible(items || []);
	},

	/*
	 * The shortcuts of the items drawn by the page, by its Hotkeys: what a program does with the menu of the system. The
	 * roles of editing are left to the page, which does them at their keys by itself.
	 */
	Bind: function (items) {
		var self = this;
		var own = this.Own();
		var hotkeys = this.$Service('Hotkeys');
		var walk = function (list) {
			list.forEach(function (item) {
				var shortcut = item.Shortcut || (item.Role && !self.Web ? self.Shortcuts[item.Role] : '');

				if (item.Items) {
					walk(item.Items);
				}
				else if (shortcut && !item.Disabled && !(item.Role && self.Web) && self.Editing.indexOf(item.Role) === -1) {
					own.Bound.push(hotkeys.Bind(shortcut, function () {
						self.Chosen(item);
					}, {Description: item.Label || ''}));
				}
			});
		};

		own.Bound.forEach(function (id) {
			hotkeys.Unbind(id);
		});

		own.Bound = [];

		walk(items);
	},

	/* The menu of the tray drawn by ElemenxUI: a window of the Application at the pointer, its list a NativeMenuPanel. */
	Panel: function (items) {
		var self = this;
		var own = this.Own();
		var shown = this.Shown(items);

		if (own.Panel) {
			own.Panel.Items = shown;

			return;
		}

		this.$Service('Native').TrayPopup({Component: 'NativeMenuPanel', Props: {Items: shown, Choose: function (item) {
			self.Chosen(item);
		}}}, function (error, result) {
			if (result)
				own.Panel = result.Instance;

			self.$Emit('apply', {Error: error || null});
		});
	},

	/* An item chosen: a role is done by the system; another is the select of its MenuItem and of the NativeMenu. */
	Chosen: function (item) {
		if (item.Role && !this.Web) {
			this.$Service('Native').Role(item.Role);

			return;
		}

		this.$Service('Menus').Pick(item);

		this.$Emit('select', item);
	},

	BarChosen: function (item) {
		this.Chosen(item);
	}
});
