/*
 * Groups of tabs side by side and one over another, as the editors of a code editor: a TabGroup in each part, the
 * dividers between them dragged to share the room. The tabs are declared in it with their content (Tab); their layout
 * is declared too, or comes from Layout:
 *   <TabSplit>
 *     <TabRow Sizes="25,75">
 *       <TabGroup Group="side"><Tab ID="files" Label="Files" Pinned="true">...</Tab></TabGroup>
 *       <TabColumn><TabGroup><Tab ID="main.js" Label="main.js">...</Tab></TabGroup><TabGroup>...</TabGroup></TabColumn>
 *     </TabRow>
 *   </TabSplit>
 * Tabs declared out of a TabGroup go to the first group. Layout is the same as a model, and change tells it each time
 * it changes, so an Application keeps it and gives it back: {Split: 'row' or 'column', Sizes: [percents], Children}
 * of {Group, Tabs: [IDs], Active, Pinned: [IDs]}. A tab declared later opens in the group of the focus, current.
 * A tab is dragged to another group, or to an edge of one to split it there; the menu of a tab splits its group to a
 * side with a copy of it (Split: its Tab made again with $Copy, the same content and a state of its own, an ID of
 * CopyID(id, n), <ID>:2 by default), or with the tab itself (Split and move: a group of one tab stays as it is). A copy
 * closes at once (the owner has no Tab of it); the layout keeps the copies of each group in its Copies ({ID, Of}) and a
 * Layout given makes them again. A group left with no tab goes, and its room goes to the others.
 * Its parts keep their content as they move: their panels go from group to group, never made again.
 * Events: change (the layout), select (the ID of the tab opened), close (the ID of a tab that asks to close: the
 * owner takes its Tab away; until it does the tab stays out of the groups), copy ({ID, Of, Group}: a copy of a tab made
 * in a new group). Methods: Open(id), Close(id), Split(id, side, move), Model().
 */
Elemenx.Component('TabSplit', {
	$TemplateURL: 'TabSplit.html',
	$StyleURL: 'TabSplit.css',
	$Meta: {
		Group: 'layout',
		Icon: 'layout',
		Description: 'Groups of tabs side by side and one over another, as the editors of a code editor, with dividers between them.',
		Container: true,
		Children: ['TabRow', 'TabColumn', 'TabGroup', 'Tab'],
		Events: {
			change: 'The layout changed: {Split, Sizes, Children} of {Group, Tabs, Active, Pinned}.',
			select: 'A tab was opened: its ID.',
			close: 'A tab asks to close: its ID (the owner takes its Tab away).',
			copy: 'A copy of a tab was made in a new group: {ID, Of, Group}.'
		},
		Props: {
			Layout: 'The layout, as change tells it: {Split: row or column, Sizes, Children} of {Group, Tabs, Active, Pinned}.',
			Closable: 'Every tab that is not pinned has a cross.',
			Label: 'The name of the strips for screen readers.',
			CopyID: 'A function (id, n) giving the ID of the n-th copy of a tab (<ID>:n by default).'
		},
		Methods: ['Open(id)', 'Close(id)', 'Split(id, side, move)', 'Model()']
	},
	Layout: null,
	Closable: false,
	Label: '',
	CopyID: null,
	Tree: null,
	Metas: {},

	$OnCreate: function () {
		var self = this;
		var own = {Closed: new WeakSet(), Focused: null, Sequence: 0, Drag: null, Pinned: {}, Copies: {}};

		/* What renders nothing: the panels closed, the group of the focus, the drag of a divider, the tabs pinned once. */
		this.Own = function () {
			return own;
		};

		var scope = 'elemenx-tab-split-' + Math.random().toString(36).slice(2, 10);

		/* The scope of the drags of its tabs: its groups take one another's tabs, and no group of another. */
		this.Scope = function () {
			return scope;
		};

		/* The groups of the layout, flat, each at its place (percents of the split): {ID, Left, Top, Width, Height, Items, Active}. */
		this.Groups = function (tree, metas) {
			var list = [];

			self.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node, box) {
				if (node.Split) return;

				list.push({ID: node.Group, Left: box.Left, Top: box.Top, Width: box.Width, Height: box.Height, Active: node.Active, Items: node.Tabs.filter(function (id) {
					return !!metas[id];
				}).map(function (id) {
					return Object.assign({}, metas[id], {Pinned: (node.Pinned || []).indexOf(id) !== -1});
				})});
			});

			return list;
		};

		/* The dividers between the parts of each split: {Key, Path, Index, Direction, Left, Top, Width, Height}. */
		this.Dividers = function (tree) {
			var list = [];

			self.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node, box, path) {
				var start = 0;
				var i;

				if (!node.Split) return;

				for (i = 0; i < node.Children.length - 1; i++) {
					start += node.Sizes[i];

					list.push({Key: path.join('.') + ':' + i, Path: path.join('.'), Index: i, Direction: node.Split, Left: node.Split === 'row' ? box.Left + box.Width * start / 100 : box.Left, Top: node.Split === 'row' ? box.Top : box.Top + box.Height * start / 100, Width: node.Split === 'row' ? 0 : box.Width, Height: node.Split === 'row' ? box.Height : 0});
				}
			});

			return list;
		};

		/* The place of a group or a divider, as a style. */
		this.Place = function (item) {
			return 'left: ' + item.Left + '%; top: ' + item.Top + '%; width: ' + item.Width + '%; height: ' + item.Height + '%;';
		};

		/* The panels go to the bodies of their groups, each shown while its tab is current: an empty marker, rendered when the layout changes. */
		this.Sync = function (tree, metas) {
			return {
				Render: function () {
					self.Arrange(tree, metas);
				}
			};
		};
	},

	/*
	 * The layout declared in the template renders after the TabSplit is ready (its TabRow and TabGroup, a Component
	 * loaded later): it is read once it holds the same two frames in a row (half a second at most), before a panel moves.
	 */
	$OnReady: function () {
		var self = this;
		var last = null;
		var frames = 0;

		function settle () {
			var now = self.Layout ? '' : JSON.stringify(self.Declared()) + self.Panels().length;

			frames++;

			if (now !== last && frames < 30) {
				last = now;
				self.Own().Settling = window.requestAnimationFrame(settle);

				return;
			}

			self.Own().Settled = true;

			self.Read();

			self.StopWatch = self.$Service('Panels').Watch(self.$Element(), '.elemenx-tab-panel', function () {
				self.Read();
			});
		}

		settle();
	},

	$OnProps: function (changed) {
		if (!Object.prototype.hasOwnProperty.call(changed, 'Layout') || !changed.Layout || JSON.stringify(changed.Layout) === JSON.stringify(this.Tree)) return;

		/* The copies it names first: the groups take them. */
		this.Restore(changed.Layout);
		this.Use(this.Normal(JSON.parse(JSON.stringify(changed.Layout)), true), false);
	},

	$OnDestroy: function () {
		window.cancelAnimationFrame(this.Own().Settling);

		if (this.StopWatch)
			this.StopWatch();
	},

	/* Calls visit(node, box, path) for every node of a layout, its box in percents of the whole. */
	Walk: function (node, box, visit, path) {
		var self = this;
		var start = 0;

		path = path || [];

		if (!node) return;

		visit(node, box, path);

		if (!node.Split) return;

		node.Children.forEach(function (child, index) {
			var size = node.Sizes[index];

			self.Walk(child, node.Split === 'row' ? {Left: box.Left + box.Width * start / 100, Top: box.Top, Width: box.Width * size / 100, Height: box.Height} : {Left: box.Left, Top: box.Top + box.Height * start / 100, Width: box.Width, Height: box.Height * size / 100}, visit, path.concat([index]));

			start += size;
		});
	},

	/* The panels of its tabs: in its source, in its groups; not the ones of a Tabs, a TabGroup or a TabSplit inside a tab. */
	Panels: function () {
		return this.$Service('Panels').Read(this.$Element(), '.elemenx-tab-panel', '.elemenx-tab-split, .elemenx-tabs, .elemenx-tab-group:not(.elemenx-tab-split-group > .elemenx-tab-group):not(.declared):not(.elemenx-tab-split-source .elemenx-tab-group)');
	},

	/* Reads the tabs, and the layout the first time: the one of Layout, or the one declared in the template. */
	Read: function () {
		var self = this;
		var panels = this.$Service('Panels');
		var metas = {};
		var tree;
		var known = {};
		var missing;
		var copies = this.Own().Copies;

		/* The copies a layout given names are made first; a copy whose tab went is gone with it. */
		if (this.Layout && !this.Tree)
			this.Restore(this.Layout);

		Object.keys(copies).forEach(function (id) {
			if (!Elemenx.Instance(copies[id].Instance.$Element()))
				delete copies[id];
		});

		this.Panels().forEach(function (panel) {
			var data = panels.Data(panel);
			if (!data.Id || self.Own().Closed.has(panel)) return;

			metas[data.Id] = {ID: data.Id, Label: data.Label || '', Icon: data.Icon || '', Badge: data.Badge, Closable: data.Closable === 'true', Disabled: data.Disabled === 'true', Pinned: data.Pinned === 'true'};
		});

		/*
		 * The layout of Layout; else the declared one, read again while no one changed it (its TabRow and TabGroup render
		 * after the TabSplit is ready); then the one it has.
		 */
		if (this.Layout && !this.Tree) tree = this.Normal(JSON.parse(JSON.stringify(this.Layout)), true);
		else if (!this.Layout && !this.Own().Touched) tree = this.Normal(this.Declared(), true);
		else tree = JSON.parse(JSON.stringify(this.Tree));

		/* The tabs it has no more go out of the layout; the new ones open in the group of the focus. */
		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (node.Split) return;

			node.Tabs = node.Tabs.filter(function (id) {
				known[id] = true;

				return !!metas[id];
			});

			if (node.Tabs.indexOf(node.Active) === -1)
				node.Active = node.Tabs[0] || null;
		});

		missing = Object.keys(metas).filter(function (id) {
			return !known[id];
		});

		if (missing.length) {
			(function (group) {
				group.Tabs = group.Tabs.concat(missing);
				group.Active = missing[missing.length - 1];
			})(this.Find(tree, this.Own().Focused) || this.First(tree));
		}

		/* A tab declared Pinned is pinned in the layout once, when it first comes: then the layout says it (its menu unpins it). */
		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (node.Split) return;

			node.Tabs.forEach(function (id) {
				if (!metas[id].Pinned || self.Own().Pinned[id]) return;

				self.Own().Pinned[id] = true;
				node.Pinned = (node.Pinned || []).concat([id]);
				node.Tabs = node.Pinned.concat(node.Tabs.filter(function (each) {
					return node.Pinned.indexOf(each) === -1;
				}));
			});
		});

		if (JSON.stringify(metas) !== JSON.stringify(this.Metas))
			this.Metas = metas;

		this.Use(this.Normal(tree, true), !!missing.length && !!this.Tree);
	},

	/* The layout declared in the template: its TabRow, TabColumn and TabGroup in the source, or one group of every tab. */
	Declared: function () {
		var source = this.$Element().querySelector('.elemenx-tab-split-source');
		var count = 0;
		var members = this.Own().Members = this.Own().Members || {};
		var order = this.Own().Order = this.Own().Order || [];

		function node (element) {
			var children;
			var sizes;

			if (element.classList.contains('elemenx-tab-row') || element.classList.contains('elemenx-tab-column')) {
				children = parts(element);
				sizes = String(element.getAttribute('data-sizes') || '').split(/[\s,]+/).filter(Boolean).map(Number);

				return {Split: element.classList.contains('elemenx-tab-row') ? 'row' : 'column', Sizes: sizes.length === children.length ? sizes : [], Children: children};
			}

			count++;

			var name = element.getAttribute('data-group') && !/^elemenx-tab-group-/.test(element.getAttribute('data-group')) ? element.getAttribute('data-group') : 'g' + count;

			return {Group: name, Tabs: ids(element, name), Active: null};
		}

		/* The parts of a split: its rows, columns and groups (a split with nothing more in it is left out). */
		function parts (element) {
			var list = [];

			Array.prototype.forEach.call(element.querySelectorAll('.elemenx-tab-row, .elemenx-tab-column, .elemenx-tab-group'), function (child) {
				if (child.parentElement.closest('.elemenx-tab-row, .elemenx-tab-column, .elemenx-tab-group') === element)
					list.push(node(child));
			});

			return list;
		}

		/*
		 * The tabs of a declared group: the panels in it, and the ones seen in it before (the panels went to the groups the
		 * TabSplit shows, out of the declaration, while it rendered).
		 */
		function ids (element, name) {
			Array.prototype.forEach.call(element.querySelectorAll('.elemenx-tab-panel'), function (panel) {
				var id = panel.getAttribute('data-id');
				if (id && !Object.prototype.hasOwnProperty.call(members, id))
					order.push(id);

				if (id)
					members[id] = name;
			});

			return order.filter(function (id) {
				return members[id] === name;
			});
		}

		var top = source ? Array.prototype.filter.call(source.querySelectorAll('.elemenx-tab-row, .elemenx-tab-column, .elemenx-tab-group'), function (element) {
			return !element.parentElement.closest('.elemenx-tab-row, .elemenx-tab-column, .elemenx-tab-group');
		}) : [];
		if (!top.length)
			return {Group: 'g1', Tabs: [], Active: null};

		return top.length === 1 ? node(top[0]) : {Split: 'row', Sizes: [], Children: top.map(node)};
	},

	/*
	 * A layout as it should be: a split of one part is that part, a split in a split of its direction joins it, a group
	 * with no tab goes (but the last one), the sizes of a split are percents that make 100, every group has a name.
	 */
	Normal: function (node, root) {
		var self = this;
		var copies;
		var children;
		var sizes;
		var total;

		if (!node)
			return root ? {Group: this.Name(null), Tabs: [], Active: null} : null;

		if (!node.Split) {
			node.Group = node.Group || this.Name(null);
			node.Tabs = (node.Tabs || []).slice();
			node.Pinned = (node.Pinned || []).filter(function (id) {
				return node.Tabs.indexOf(id) !== -1;
			});

			/* The copies among its tabs, as a layout keeps them to make them again: {ID, Of}. */
			copies = node.Tabs.filter(function (id) {
				return !!self.Own().Copies[id];
			}).map(function (id) {
				return {ID: id, Of: self.Own().Copies[id].Of};
			});

			if (copies.length) node.Copies = copies;
			else delete node.Copies;

			if (!node.Tabs.length && !root) return null;

			return node;
		}

		children = [];
		sizes = [];

		(node.Children || []).forEach(function (child, index) {
			var size = Number((node.Sizes || [])[index]) || 0;
			var made = self.Normal(child, false);
			if (!made) return;

			/* A split of the same direction inside: its parts join this one, in its share. */
			if (made.Split === node.Split) {
				made.Children.forEach(function (part, at) {
					children.push(part);
					sizes.push((size || 100 / node.Children.length) * made.Sizes[at] / 100);
				});

				return;
			}

			children.push(made);
			sizes.push(size || 100 / node.Children.length);
		});

		if (!children.length)
			return root ? {Group: this.Name(null), Tabs: [], Active: null} : null;

		if (children.length === 1) return children[0];

		total = sizes.reduce(function (sum, size) {
			return sum + size;
		}, 0) || 1;

		return {Split: node.Split === 'column' ? 'column' : 'row', Sizes: sizes.map(function (size) {
			return Math.round(size * 100 / total * 1000) / 1000;
		}), Children: children};
	},

	/* A name of a group no other has. */
	Name: function (tree) {
		var own = this.Own();
		var used = {};

		this.Walk(tree || this.Tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (!node.Split)
				used[node.Group] = true;
		});

		do {
			own.Sequence++;
		} while (used['g' + own.Sequence]);

		return 'g' + own.Sequence;
	},

	Find: function (tree, group) {
		var found = null;

		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (!node.Split && node.Group === group)
				found = node;
		});

		return found;
	},

	First: function (tree) {
		var found = null;

		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (!node.Split && !found)
				found = node;
		});

		return found;
	},

	/* The group of a tab. */
	Holder: function (tree, id) {
		var found = null;

		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (!node.Split && node.Tabs.indexOf(id) !== -1)
				found = node;
		});

		return found;
	},

	/* A layout to show; told (change) when tell is set. */
	Use: function (tree, tell) {
		var root = this.$Element();
		var source = root.querySelector('.elemenx-tab-split-source');
		var names = {};

		if (JSON.stringify(tree) === JSON.stringify(this.Tree)) return;

		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (!node.Split)
				names[node.Group] = true;
		});

		/* The panels of a group that goes wait in the source: the group takes its element away, they move on. */
		Array.prototype.forEach.call(root.querySelectorAll('.elemenx-tab-split-group'), function (group) {
			if (names[group.getAttribute('data-group')]) return;

			Array.prototype.forEach.call(group.querySelectorAll('.elemenx-tab-group-body > .elemenx-tab-panel'), function (panel) {
				panel.classList.remove('active');

				source.appendChild(panel);
			});
		});

		this.Tree = tree;

		if (tell)
			this.$Emit('change', this.Model());
	},

	/* A change of the layout: made on a copy, made right, shown and told. */
	Change: function (edit) {
		var tree = JSON.parse(JSON.stringify(this.Tree));

		/* The layout is the one of the user now: the declaration is not read again. */
		this.Own().Touched = true;

		edit.call(this, tree);

		this.Use(this.Normal(tree, true), true);
	},

	/* The layout as change tells it: a copy. */
	Model: function () {
		return JSON.parse(JSON.stringify(this.Tree));
	},

	/* Every panel in the body of its group, the one of the current tab shown; a panel of no group back in the source. */
	Arrange: function (tree, metas) {
		var root = this.$Element();
		var source = root.querySelector('.elemenx-tab-split-source');
		var panels = {};
		var placed = {};

		/* Before its layout is read a panel stays in its declaration, which tells the group it is of. */
		if (!tree || !this.Own().Settled) return;

		this.Panels().forEach(function (panel) {
			panels[panel.getAttribute('data-id')] = panel;
		});

		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			var body;

			if (node.Split) return;

			body = root.querySelector('.elemenx-tab-split-group[data-group="' + node.Group + '"] .elemenx-tab-group-body');

			if (!body) return;

			node.Tabs.forEach(function (id) {
				var panel = panels[id];
				var on = id === node.Active;

				if (!panel || !metas[id]) return;

				placed[id] = true;

				if (panel.parentElement !== body)
					body.insertBefore(panel, body.querySelector('.elemenx-tab-group-zone'));

				if (panel.classList.contains('active') !== on)
					panel.classList.toggle('active', on);

				if (on)
					panel.dispatchEvent(new CustomEvent('tabopen'));
			});
		});

		Object.keys(panels).forEach(function (id) {
			if (!placed[id] && panels[id].parentElement !== source) {
				panels[id].classList.remove('active');

				source.appendChild(panels[id]);
			}
		});
	},

	/* Opens a tab (its group goes to the focus). */
	Open: function (id) {
		var group = this.Holder(this.Tree, id);
		if (!group) return;

		this.Own().Focused = group.Group;

		if (group.Active !== id) {
			this.Change(function (tree) {
				this.Holder(tree, id).Active = id;
			});

			this.$Emit('select', id);
		}
	},

	/* A tab out of the groups: asked of the owner, who takes its Tab away. */
	Close: function (id) {
		var copy;
		var panel = this.Panels().filter(function (each) {
			return each.getAttribute('data-id') === id;
		})[0];

		if (!this.Holder(this.Tree, id)) return;

		if (panel)
			this.Own().Closed.add(panel);

		this.Change(function (tree) {
			var group = this.Holder(tree, id);
			var index = group.Tabs.indexOf(id);

			group.Tabs.splice(index, 1);

			if (group.Active === id)
				group.Active = group.Tabs[Math.min(index, group.Tabs.length - 1)] || null;
		});

		/* A copy is its own: it goes at once; a tab of the owner is asked of it. */
		if (this.Own().Copies[id]) {
			copy = this.Own().Copies[id].Instance;

			delete this.Own().Copies[id];

			copy.$Destroy();

			return;
		}

		this.$Emit('close', id);
	},

	/* A copy of a tab in a new group beside its own, on a side (left, right, top or bottom); with move, the tab itself. */
	Split: function (id, side, move) {
		this.Part(id, side, null, !!move && move !== 'false');
	},

	/*
	 * A new group beside a group (the one of the tab without it), on a side: with a copy of the tab, or with the tab
	 * itself (move: out of its group, which keeps one tab at least when it is the one beside).
	 */
	Part: function (id, side, beside, move) {
		var from = this.Holder(this.Tree, id);
		var copied = null;
		var name;

		if (!from) return;
		if (move && (!beside || beside === from.Group) && from.Tabs.length < 2) return;

		if (!move) {
			copied = this.Copy(id);

			if (!copied) return;
		}

		name = this.Name(null);

		this.Change(function (tree) {
			var source = this.Holder(tree, id);
			var target = this.Find(tree, beside || source.Group);
			var tab = copied || id;
			var group = {Group: name, Tabs: [tab], Active: tab, Pinned: !copied && (source.Pinned || []).indexOf(id) !== -1 ? [id] : []};

			if (!copied)
				this.Take(source, id);

			this.Beside(tree, target, group, side);
		});

		this.Own().Focused = name;

		if (copied) {
			this.Read();

			this.$Emit('copy', {ID: copied, Of: this.Own().Copies[copied].Of, Group: name});
		}
	},

	/*
	 * A copy of a tab ($Copy of its Tab: the same content, a state of its own), waiting in the source until a group takes
	 * it: its ID that of CopyID(id, n), else <ID>:2, :3... (n the first one no tab has); a copy of a copy is one of the
	 * tab it copies. Its ID, or null when the tab cannot be copied.
	 */
	Copy: function (id, wanted) {
		var copies = this.Own().Copies;
		var origin = copies[id] ? copies[id].Of : id;
		var panels = this.Panels();
		var panel = panels.filter(function (each) {
			return each.getAttribute('data-id') === id;
		})[0];
		var tab = panel ? Elemenx.Instance(panel) : null;
		var n = 2;
		var made;
		var copy;
		var taken = function (candidate) {
			return !!copies[candidate] || panels.some(function (each) {
				return each.getAttribute('data-id') === candidate;
			});
		};

		if (!tab || typeof tab.$Copy !== 'function') return null;

		made = wanted;

		while (!made || taken(made)) {
			made = typeof this.CopyID === 'function' ? String(this.CopyID(origin, n)) : origin + ':' + n;
			n++;

			if (n > 1000) return null;
		}

		try {
			copy = tab.$Copy({ID: made});
		}
		catch (error) {
			return null;
		}

		this.$Element().querySelector('.elemenx-tab-split-source').appendChild(copy.$Element());

		copies[made] = {Of: origin, Instance: copy};

		return made;
	},

	/* The copies a layout names ({ID, Of} in the Copies of its groups) that are not made yet: made, of their tabs. */
	Restore: function (layout) {
		var self = this;

		this.Walk(layout, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (node.Split) return;

			(node.Copies || []).forEach(function (copy) {
				if (copy && copy.ID && !self.Own().Copies[copy.ID])
					self.Copy(copy.Of, String(copy.ID));
			});
		});
	},

	/* A tab out of a group: the next one current. */
	Take: function (group, id) {
		var index = group.Tabs.indexOf(id);

		group.Tabs.splice(index, 1);

		group.Pinned = (group.Pinned || []).filter(function (each) {
			return each !== id;
		});

		if (group.Active === id)
			group.Active = group.Tabs[Math.min(index, group.Tabs.length - 1)] || null;
	},

	/* A group put beside another: in the split around it when it splits that way, else in a new split of the two. */
	Beside: function (tree, target, group, side) {
		var direction = side === 'left' || side === 'right' ? 'row' : 'column';
		var before = side === 'left' || side === 'top';
		var parent = null;
		var index = -1;

		this.Walk(tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node) {
			if (node.Split && node.Children.indexOf(target) !== -1) {
				parent = node;
				index = node.Children.indexOf(target);
			}
		});

		if (parent && parent.Split === direction) {
			var half = parent.Sizes[index] / 2;

			parent.Sizes[index] = half;

			parent.Children.splice(before ? index : index + 1, 0, group);
			parent.Sizes.splice(before ? index : index + 1, 0, half);

			return;
		}

		var split = {Split: direction, Sizes: [50, 50], Children: before ? [group, JSON.parse(JSON.stringify(target))] : [JSON.parse(JSON.stringify(target)), group]};

		/* The split takes the place of the group: in its parent, or as the whole layout. */
		if (parent) {
			parent.Children[index] = split;
		}
		else {
			Object.keys(target).forEach(function (key) {
				delete target[key];
			});

			Object.assign(target, split);
		}
	},

	/* A tab into a group, at a place of its strip (the end without one). */
	Move: function (id, group, index) {
		var from = this.Holder(this.Tree, id);
		if (!from || !this.Find(this.Tree, group)) return;

		this.Change(function (tree) {
			var source = this.Holder(tree, id);
			var target = this.Find(tree, group);
			var pinned = (source.Pinned || []).indexOf(id) !== -1;

			this.Take(source, id);

			target.Tabs.splice(index < 0 || index === undefined ? target.Tabs.length : Math.min(index, target.Tabs.length), 0, id);

			target.Active = id;

			if (pinned)
				target.Pinned = (target.Pinned || []).concat([id]);
		});

		this.Own().Focused = group;

		this.$Emit('select', id);
	},

	/* The events of the groups. */
	Selected: function (id) {
		this.Open(id);
	},

	Asked: function (id) {
		this.Close(id);
	},

	Pinned: function (detail) {
		this.Change(function (tree) {
			var group = this.Holder(tree, detail.ID);
			var rest;

			if (!group) return;

			group.Pinned = (group.Pinned || []).filter(function (id) {
				return id !== detail.ID;
			});

			if (detail.Pinned)
				group.Pinned.push(detail.ID);

			/* The pinned tabs first in the strip, as it shows them. */
			rest = group.Tabs.filter(function (id) {
				return group.Pinned.indexOf(id) === -1;
			});
			group.Tabs = group.Pinned.concat(rest);
		});
	},

	Ordered: function (detail) {
		this.Move(detail.ID, detail.Group, detail.Index);
	},

	Moved: function (detail) {
		this.Move(detail.ID, detail.Group, detail.Index);
	},

	/* A tab dropped on an edge of a group moves there; the menu copies it there, or moves it (Split and move). */
	Dropped: function (detail) {
		if (detail.Side === 'center') this.Move(detail.ID, detail.Group, -1);
		else this.Part(detail.ID, detail.Side, detail.Group, true);
	},

	Splitted: function (detail) {
		this.Part(detail.ID, detail.Side, detail.Group, !!detail.Move);
	},

	/* The group of the focus: the one a new tab opens in. */
	Focused: function (event) {
		var group = event.target.closest && event.target.closest('.elemenx-tab-split-group');
		if (group)
			this.Own().Focused = group.getAttribute('data-group');
	},

	/* A divider dragged: the two parts beside it share their room, none smaller than a tenth of the split. */
	DividerDown: function (event, node) {
		var root = this.$Element().getBoundingClientRect();
		var key = node.getAttribute('data-key');
		var divider = this.Dividers(this.Tree).filter(function (each) {
			return each.Key === key;
		})[0];
		var split = divider ? this.Node(this.Tree, divider.Path) : null;
		if (!divider || !split || event.button !== 0) return;

		event.preventDefault();

		node.setPointerCapture(event.pointerId);

		this.Own().Drag = {Divider: divider, Start: divider.Direction === 'row' ? event.clientX : event.clientY, Sizes: split.Sizes.slice(), Room: (divider.Direction === 'row' ? root.width * this.Box(divider.Path).Width : root.height * this.Box(divider.Path).Height) / 100};
	},

	DividerMove: function (event) {
		var drag = this.Own().Drag;
		var delta;
		var least;
		var a;
		var b;

		if (!drag) return;

		delta = ((drag.Divider.Direction === 'row' ? event.clientX : event.clientY) - drag.Start) / Math.max(1, drag.Room) * 100;
		least = Math.min(10, (drag.Sizes[drag.Divider.Index] + drag.Sizes[drag.Divider.Index + 1]) / 2);
		a = drag.Sizes[drag.Divider.Index] + delta;
		b = drag.Sizes[drag.Divider.Index + 1] - delta;

		if (a < least) {
			b -= least - a;
			a = least;
		}

		if (b < least) {
			a -= least - b;
			b = least;
		}

		this.Resize(drag.Divider.Path, drag.Divider.Index, a, b, false);
	},

	DividerUp: function () {
		var drag = this.Own().Drag;
		if (!drag) return;

		this.Own().Drag = null;

		this.$Emit('change', this.Model());
	},

	/* The keys of a divider: the arrows move it by a twentieth. */
	DividerKey: function (event, node) {
		var key = Elemenx.Locale.Key(event);
		var divider = this.Dividers(this.Tree).filter(function (each) {
			return each.Key === node.getAttribute('data-key');
		})[0];
		var split = divider ? this.Node(this.Tree, divider.Path) : null;
		var step = 0;

		if (!split) return;

		if (key === (divider.Direction === 'row' ? 'ArrowRight' : 'ArrowDown')) step = 5;
		else if (key === (divider.Direction === 'row' ? 'ArrowLeft' : 'ArrowUp')) step = -5;
		else return;

		event.preventDefault();

		step = Math.max(-(split.Sizes[divider.Index] - 10), Math.min(split.Sizes[divider.Index + 1] - 10, step));

		this.Resize(divider.Path, divider.Index, split.Sizes[divider.Index] + step, split.Sizes[divider.Index + 1] - step, true);
	},

	Resize: function (path, index, a, b, tell) {
		var tree = JSON.parse(JSON.stringify(this.Tree));
		var split = this.Node(tree, path);

		split.Sizes[index] = Math.round(a * 1000) / 1000;
		split.Sizes[index + 1] = Math.round(b * 1000) / 1000;

		this.Use(tree, tell);
	},

	/* The node at a path of indexes ('0.1'). */
	Node: function (tree, path) {
		var node = tree;

		String(path).split('.').filter(function (part) {
			return part !== '';
		}).forEach(function (index) {
			node = node.Children[Number(index)];
		});

		return node;
	},

	/* The box of the node at a path, in percents of the whole. */
	Box: function (path) {
		var found = {Left: 0, Top: 0, Width: 100, Height: 100};

		this.Walk(this.Tree, {Left: 0, Top: 0, Width: 100, Height: 100}, function (node, box, at) {
			if (at.join('.') === path)
				found = box;
		});

		return found;
	}
});
