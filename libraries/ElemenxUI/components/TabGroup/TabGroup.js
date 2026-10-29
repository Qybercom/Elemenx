/*
 * A group of tabs: their strip and the content of the current one, as the tabs of the files of an editor. The tabs are
 * declared in it with their content (<Tab ID="readme" Label="README.md">...</Tab>), or given by Items ([{ID, Label,
 * Icon, Badge, Closable, Disabled, Pinned}]: the owner puts the content in its body, as a TabSplit does). Active is the
 * ID of the current tab (the first one while it names none).
 * A Pinned tab stays first in the strip, has no cross, and a close of all the tabs, of the others, or of the ones to a
 * side leaves it. The menu of a tab (its right button, a long press, the key of the menu or Shift+F10) closes it, the
 * others, the ones to its right or its left, or all of them, pins it or unpins it; in a TabSplit (Splittable) it also
 * splits the group to a side with a copy of the tab (Split), or with the tab itself (Split and move). A tab is dragged to another place of its strip, and in a TabSplit to another
 * group, or to an edge of a group to split it there: the edge it would take shows while it is over it.
 * Keys in the strip: the arrows, Home and End move between the tabs, Delete closes one, the key of the menu opens its
 * menu; Ctrl+Page Down and Ctrl+Page Up anywhere in the group go to the next tab and the one before.
 * Events: select (the ID), close (the ID, once a tab: the owner takes its Tab away), pin ({ID, Pinned}), and with
 * Items, for its owner: order ({ID, Index}), move ({ID, From, Index}: a tab of another group put in its strip), drop
 * ({ID, From, Side: left, right, top, bottom or center}) and split ({ID, Side, Move}: Move true takes the tab there, false
 * puts a copy of it there). Each detail has Group, its name.
 * In a TabSplit it is also a part of a layout declared in the template: <TabGroup Group="side">...</TabGroup>.
 */
Elemenx.Component('TabGroup', {
	$TemplateURL: 'TabGroup.html',
	$StyleURL: 'TabGroup.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'panel-bottom',
		Description: 'A group of tabs: their strip and the content of the current one, as the tabs of the files of an editor.',
		Container: true,
		Children: ['Tab'],
		Current: 'Active',
		Events: {
			select: 'Another tab was opened: its ID.',
			close: 'A tab asks to close: its ID (the owner takes its Tab away).',
			pin: 'A tab was pinned or unpinned: {ID, Pinned}.',
			order: 'With Items: a tab was put at another place of the strip: {ID, Index}.',
			move: 'With Items: a tab of another group was put in the strip: {ID, From, Index}.',
			drop: 'With Items: a tab was put on the body: {ID, From, Side}.',
			split: 'With Items: its menu splits the group to a side with a copy of the tab, or with the tab (Move): {ID, Side, Move}.'
		},
		Props: {
			Items: {Schema: {ID: 'text', Label: 'text', Icon: 'icon', Badge: 'text', Closable: 'bool', Disabled: 'bool', Pinned: 'bool'}, Description: 'The tabs, when the owner puts their content in the body: [{ID, Label, Icon, Badge, Closable, Disabled, Pinned}].'},
			Active: 'The ID of the current tab.',
			Closable: 'Every tab that is not pinned has a cross.',
			Splittable: 'Its menu splits the group, and a tab dropped on an edge splits it there (a TabSplit sets it).',
			Group: 'Its name, in the details of its events and in a layout declared in a TabSplit.',
			Scope: 'The groups whose tabs it takes by a drag: the ones of the same Scope (a TabSplit sets it; its own without it).',
			Label: 'The name of the strip for screen readers.'
		}
	},
	Items: null,
	Active: null,
	Closable: false,
	Splittable: false,
	Scope: '',
	Group: '',
	Label: '',
	Declared: [],
	Order: [],
	Pins: {},
	MenuFor: null,
	Zone: '',
	Declaration: false,

	$OnCreate: function () {
		var self = this;
		var key = 'elemenx-tab-group-' + Math.random().toString(36).slice(2, 10);

		/* The name of the group in the data of a drag: its Group, or one of its own. */
		this.GroupName = function () {
			return self.Group || key;
		};

		/* The type of the drag of its tabs: of its TabSplit (its groups take one another's tabs), or of its own. */
		this.DragType = function () {
			return 'elemenx-tab:' + (self.Scope || key);
		};

		/* The tabs of the strip: Items, or the declared ones in the order they were put in; the pinned ones first. */
		this.List = function (items, declared, order, pins) {
			var list = (items || declared || []).map(function (tab) {
				return Object.assign({}, tab, {Pinned: Object.prototype.hasOwnProperty.call(pins || {}, tab.ID) ? pins[tab.ID] : !!tab.Pinned});
			});

			if (!items && order && order.length) {
				list.sort(function (a, b) {
					var x = order.indexOf(a.ID);
					var y = order.indexOf(b.ID);

					return (x === -1 ? 1e6 : x) - (y === -1 ? 1e6 : y);
				});
			}

			return list.filter(function (tab) {
				return tab.Pinned;
			}).concat(list.filter(function (tab) {
				return !tab.Pinned;
			}));
		};

		/* The ID of the current tab: Active, or the first one that is not disabled while Active names none. */
		this.Current = function (active, list) {
			var open = list.filter(function (tab) {
				return !tab.Disabled;
			});

			return list.some(function (tab) {
				return tab.ID === active;
			}) ? active : open.length ? open[0].ID : null;
		};

		/* The items of the menu of a tab. */
		this.MenuItems = function (id, list, splittable) {
			var index = list.map(function (tab) {
				return tab.ID;
			}).indexOf(id);
			var tab = list[index];
			var closable = function (each) {
				return !each.Pinned && !each.Disabled;
			};
			var items;

			if (!tab)
				return [];

			items = [
				{ID: 'close', Label: Elemenx.Locale.Text('ui.tabs.close'), Icon: 'close', Shortcut: 'Delete', Disabled: tab.Pinned},
				{ID: 'others', Label: Elemenx.Locale.Text('ui.tabGroup.closeOthers'), Disabled: !list.some(function (each) {
					return each.ID !== id && closable(each);
				})},
				{ID: 'right', Label: Elemenx.Locale.Text('ui.tabGroup.closeRight'), Disabled: !list.slice(index + 1).some(closable)},
				{ID: 'left', Label: Elemenx.Locale.Text('ui.tabGroup.closeLeft'), Disabled: !list.slice(0, index).some(closable)},
				{ID: 'all', Label: Elemenx.Locale.Text('ui.tabGroup.closeAll'), Disabled: !list.some(closable)},
				{Separator: true},
				{ID: 'pin', Label: tab.Pinned ? Elemenx.Locale.Text('ui.tabGroup.unpin') : Elemenx.Locale.Text('ui.tabGroup.pin'), Icon: 'pin'}
			];

			if (splittable && splittable !== 'false') {
				items = items.concat([
					{Separator: true},
					{ID: 'split-right', Label: Elemenx.Locale.Text('ui.tabGroup.splitRight')},
					{ID: 'split-left', Label: Elemenx.Locale.Text('ui.tabGroup.splitLeft')},
					{ID: 'split-bottom', Label: Elemenx.Locale.Text('ui.tabGroup.splitDown')},
					{ID: 'split-top', Label: Elemenx.Locale.Text('ui.tabGroup.splitUp')},
					{Separator: true},
					{ID: 'move-right', Label: Elemenx.Locale.Text('ui.tabGroup.moveRight'), Disabled: list.length < 2},
					{ID: 'move-left', Label: Elemenx.Locale.Text('ui.tabGroup.moveLeft'), Disabled: list.length < 2},
					{ID: 'move-bottom', Label: Elemenx.Locale.Text('ui.tabGroup.moveDown'), Disabled: list.length < 2},
					{ID: 'move-top', Label: Elemenx.Locale.Text('ui.tabGroup.moveUp'), Disabled: list.length < 2}
				]);
			}

			return items;
		};

		/* The declared panels show the current tab (with Items its owner shows them): an empty marker, rendered when it changes. */
		this.Show = function (active, declared, items) {
			return {
				Render: function () {
					var current;

					if (items || self.Declaration) return;

					current = self.Current(active, self.List(null, declared, self.Order, self.Pins));

					self.$Service('Panels').Read(self.$Element(), '.elemenx-tab-panel', '.elemenx-tab-group').forEach(function (panel) {
						var on = panel.getAttribute('data-id') === current;

						panel.classList.toggle('active', on);

						if (on)
							panel.dispatchEvent(new CustomEvent('tabopen'));
					});
				}
			};
		};
	},

	$OnReady: function () {
		var self = this;

		/* In the source of a TabSplit it is a part of the layout the TabSplit reads (it is put there once made): it shows nothing. */
		function declared () {
			if (!self.$Element().closest('.elemenx-tab-split-source')) return false;

			self.Declaration = true;

			if (self.StopWatch)
				self.StopWatch();

			self.StopWatch = null;

			return true;
		}

		if (declared() || this.Items) return;

		this.Read();

		this.StopWatch = this.$Service('Panels').Watch(this.$Element(), '.elemenx-tab-panel', function () {
			self.Read();
		});

		this.Checking = window.requestAnimationFrame(declared);
	},

	$OnDestroy: function () {
		window.cancelAnimationFrame(this.Checking);

		if (this.StopWatch)
			this.StopWatch();
	},

	/* Reads the declared tabs from their panels. */
	Read: function () {
		var panels = this.$Service('Panels');
		var declared = panels.Read(this.$Element(), '.elemenx-tab-panel', '.elemenx-tab-group').map(function (panel) {
			var data = panels.Data(panel);

			return {ID: data.Id || '', Label: data.Label || '', Icon: data.Icon || '', Badge: data.Badge, Closable: data.Closable === 'true', Disabled: data.Disabled === 'true', Pinned: data.Pinned === 'true'};
		});
		if (JSON.stringify(declared) !== JSON.stringify(this.Declared))
			this.Declared = declared;
	},

	Tabs: function () {
		return this.List(this.Items, this.Declared, this.Order, this.Pins);
	},

	Select: function (id, focus) {
		var tab = this.Tabs().filter(function (each) {
			return each.ID === id;
		})[0];
		var node;

		if (!tab || tab.Disabled) return;

		if (this.Active !== id) {
			this.Active = id;

			this.$Emit('select', id);
		}

		node = this.$Element().querySelector('.elemenx-tab-group-tab[data-id="' + String(id).replace(/"/g, '\\"') + '"]');

		if (node && focus !== false) {
			node.focus();
			node.scrollIntoView({block: 'nearest', inline: 'nearest'});
		}
	},

	Pick: function (event, node) {
		this.Select(node.getAttribute('data-id'));
	},

	/* The close of a tab: asked of the owner, who takes its Tab away. */
	Close: function (ids) {
		var self = this;
		var tabs = this.Tabs();

		[].concat(ids).forEach(function (id) {
			var tab = tabs.filter(function (each) {
				return each.ID === id;
			})[0];
			if (tab && !tab.Disabled)
				self.$Emit('close', id);
		});
	},

	Closed: function (event, node) {
		event.stopPropagation();

		this.Close(node.closest('.elemenx-tab-group-tab').getAttribute('data-id'));
	},

	Middle: function (event, node) {
		var tab = this.Tabs().filter(function (each) {
			return each.ID === node.getAttribute('data-id');
		})[0];
		if (event.button === 1 && tab && !tab.Pinned && (tab.Closable || this.Closable))
			this.Close(tab.ID);
	},

	Pin: function (id) {
		var tab = this.Tabs().filter(function (each) {
			return each.ID === id;
		})[0];
		var pins;

		if (!tab) return;

		/* The declared tabs keep their pins here; with Items the owner changes the tab. */
		if (!this.Items) {
			pins = Object.assign({}, this.Pins);
			pins[id] = !tab.Pinned;
			this.Pins = pins;
		}

		this.$Emit('pin', {ID: id, Pinned: !tab.Pinned, Group: this.GroupName()});
	},

	/* The menu of a tab opens for the tab under the pointer. */
	Menu: function (event, node) {
		this.MenuFor = node.getAttribute('data-id');
	},

	MenuPicked: function (detail) {
		var id = this.MenuFor;
		var tabs = this.Tabs();
		var index = tabs.map(function (tab) {
			return tab.ID;
		}).indexOf(id);
		var item = detail && detail.Item ? detail.Item.ID : '';
		var closable = function (tab) {
			return !tab.Pinned;
		};
		var ids = function (list) {
			return list.filter(closable).map(function (tab) {
				return tab.ID;
			});
		};

		if (index === -1) return;

		if (item === 'close') this.Close(id);
		else if (item === 'others') this.Close(ids(tabs.filter(function (tab) {
			return tab.ID !== id;
		})));
		else if (item === 'right') this.Close(ids(tabs.slice(index + 1)));
		else if (item === 'left') this.Close(ids(tabs.slice(0, index)));
		else if (item === 'all') this.Close(ids(tabs));
		else if (item === 'pin') this.Pin(id);
		else if (/^split-/.test(item)) this.$Emit('split', {ID: id, Side: item.substring(6), Group: this.GroupName(), Move: false});
		else if (/^move-/.test(item)) this.$Emit('split', {ID: id, Side: item.substring(5), Group: this.GroupName(), Move: true});
	},

	Key: function (event, node) {
		var current = event.target.closest('.elemenx-tab-group-tab');
		var tabs = this.Tabs();
		var ids = tabs.map(function (tab) {
			return tab.ID;
		});
		var index = current ? ids.indexOf(current.getAttribute('data-id')) : -1;
		var key = Elemenx.Locale.Key(event);
		var next = -1;

		if (!current || index === -1) return;

		if (key === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (key === 'Home') next = 0;
		else if (key === 'End') next = tabs.length - 1;

		if (next !== -1) {
			event.preventDefault();

			this.Select(ids[next]);

			return;
		}

		if ((key === 'Delete' || key === 'w' && (event.ctrlKey || event.metaKey)) && !tabs[index].Pinned && (tabs[index].Closable || this.Closable)) {
			event.preventDefault();

			this.Close(ids[index]);

			return;
		}

		/* The key of the menu, or Shift+F10: the menu of the tab, at the tab. */
		if (key === 'ContextMenu' || key === 'F10' && event.shiftKey) {
			event.preventDefault();

			this.MenuFor = ids[index];

			current.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: current.getBoundingClientRect().left + 8, clientY: current.getBoundingClientRect().bottom}));
		}
	},

	/* Ctrl+Page Down and Ctrl+Page Up anywhere in the group: the next tab and the one before. */
	GroupKey: function (event) {
		var tabs = this.Tabs();
		var ids = tabs.map(function (tab) {
			return tab.ID;
		});
		var index = ids.indexOf(this.Current(this.Active, tabs));
		var key = Elemenx.Locale.Key(event);
		if (!event.ctrlKey || (key !== 'PageDown' && key !== 'PageUp') || !tabs.length) return;

		event.preventDefault();

		this.Select(ids[(index + (key === 'PageDown' ? 1 : -1) + tabs.length) % tabs.length]);
	},

	/* A tab put at a place of the strip: of this group (another order), or of another one (a move). */
	StripDropped: function (event) {
		var detail = event.detail || {};
		var data = detail.Data || {};
		var order;

		if (!data.ID) return;

		if (data.Group !== this.GroupName()) {
			this.$Emit('move', {ID: data.ID, From: data.Group, Index: detail.Index, Group: this.GroupName()});

			return;
		}

		if (this.Items) {
			this.$Emit('order', {ID: data.ID, Index: detail.Index, Group: this.GroupName()});

			return;
		}

		order = this.Tabs().map(function (tab) {
			return tab.ID;
		}).filter(function (id) {
			return id !== data.ID;
		});

		order.splice(Math.max(0, Math.min(order.length, detail.Index < 0 ? order.length : detail.Index)), 0, data.ID);

		this.Order = order;
	},

	/* The side of the body under the pointer: an edge (a quarter of it) splits there, the middle puts the tab in the group. */
	Side: function (detail) {
		var body = this.$Element().querySelector('.elemenx-tab-group-body');
		var box = body.getBoundingClientRect();
		var x = (detail.ClientX - box.left) / Math.max(1, box.width);
		var y = (detail.ClientY - box.top) / Math.max(1, box.height);
		var edge = Math.min(x, 1 - x, y, 1 - y);
		if (!this.Splittable || this.Splittable === 'false' || edge > 0.25) return 'center';
		if (edge === x) return 'left';
		if (edge === 1 - x) return 'right';
		if (edge === y) return 'top';

		return 'bottom';
	},

	BodyMove: function (event) {
		var detail = event.detail || {};
		var side;

		if (!detail.Data || !detail.Data.ID || !this.Items) return;

		side = this.Side(detail);

		/* A tab over the group it is in, in its middle, would stay where it is: nothing shows. */
		if (side === 'center' && detail.Data.Group === this.GroupName())
			side = '';

		if (this.Zone !== side)
			this.Zone = side;
	},

	BodyLeave: function () {
		this.Zone = '';
	},

	BodyDropped: function (event) {
		var detail = event.detail || {};
		var side = this.Zone;

		this.Zone = '';

		if (!detail.Data || !detail.Data.ID || !this.Items || !side) return;

		this.$Emit('drop', {ID: detail.Data.ID, From: detail.Data.Group, Side: side, Group: this.GroupName()});
	}
});
