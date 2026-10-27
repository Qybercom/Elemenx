/*
 * The structure of the page of a designer of pages (the Designer Service): every element in a Tree, with the text it
 * shows when it has some, the selected one marked. An element pressed is selected; an element dragged moves before or
 * after another, or into it when that is a container (the Tree is Movable); a kind of a palette or of a gallery dragged
 * there (*draggable, type elemenx-designer-kind) makes a new element the same way. Events: select (the ID, or null),
 * move ({ID, Target, Position, Type}).
 */
Elemenx.Component('DesignerTree', {
	$TemplateURL: 'DesignerTree.html',
	$StyleURL: 'DesignerTree.css',
	$Meta: {
		Group: 'tools',
		Icon: 'tree',
		Description: 'The structure of the page of a designer of pages: its elements in a tree, to select and to move.',
		Events: {
			select: 'An element was pressed: its ID, or null.',
			move: 'An element or a kind was dragged in the tree: {ID, Target, Position, Type}.'
		},
		Props: {
			Label: 'The name of the tree for screen readers; the phrase of the language of the page without one.'
		}
	},
	Label: '',
	Version: 0,
	Collapsed: [],

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		/* What the tree listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		this.Count = function (version) {
			return version >= 0 ? designer.Count() : 0;
		};

		this.Selected = function (version) {
			return version >= 0 ? designer.Selected() : null;
		};

		/* The elements for the Tree: each one with the text it shows when it has some. */
		this.Items = function (version) {
			function items (node) {
				return node.Children.map(function (child) {
					var kind = designer.Kind(child.Kind);
					var label = designer.Label(child.Kind);
					var detail = child.Text || child.Props.Label || child.Props.Title || (child.Kind === 'element' ? child.Props.Tag : '');

					return {ID: child.ID, Label: detail ? label + ' · ' + detail : label, Icon: kind ? kind.Icon : 'code', Items: child.Children.length ? items(child) : undefined};
				});
			}

			return version >= 0 ? items(designer.Root()) : [];
		};

		/* The open elements: every one with children but those closed. */
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
				walk(designer.Root());

			return open;
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);

		designer.Load();
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	Picked: function (item) {
		var id = item ? item.ID : null;

		this.$Service('Designer').Select(id);

		this.$Emit('select', id);
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

		walk(this.$Service('Designer').Root());

		this.Collapsed = closed;
	},

	/* An element dragged onto another: before or after it among its siblings, or at the end of it, a container. */
	/*
	 * An element dragged onto another: before or after it among its siblings, or at the end of it, a container. A kind of
	 * a palette (elemenx-designer-kind) dropped so makes a new element there.
	 */
	Moved: function (move) {
		var designer = this.$Service('Designer');
		var parent = designer.Parent(move.Target);
		var inside = move.Position === 'inside';
		var at;
		var id;

		if (!parent || (inside && !designer.Container(move.Target))) return;

		at = inside ? undefined : parent.Children.indexOf(designer.Find(move.Target)) + (move.Position === 'after' ? 1 : 0);

		if (move.Type === 'elemenx-designer-kind') id = designer.Insert(move.ID, inside ? move.Target : parent.ID, at);
		else id = designer.Move(move.ID, inside ? move.Target : parent.ID, at) ? move.ID : null;

		if (!id) return;

		designer.Select(id);

		this.$Emit('move', move);
	}
});
