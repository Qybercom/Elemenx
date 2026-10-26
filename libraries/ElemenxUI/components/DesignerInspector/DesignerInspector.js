/*
 * The selected element of a designer of pages (the Designer Service), in blocks of their own: on top its layout, what
 * every element has (DesignerStyle: its box, its sizes, its flex), its rules of CSS by their context (DesignerRules;
 * Style false leaves both out), then its props, what its kind has: a field for each prop (a text, a number, a switch, a
 * choice, the modifiers of its class, an expression of JavaScript), with the description its Component declares in
 * $Meta as the hint; its slot in its parent and its text when its kind has one. A list prop whose $Meta gives the
 * Schema of its items is a list of them, each a row of fields, that adds, moves and removes items ({ } edits it as an
 * expression again). A component of declared children (Tabs and Tab) has a button to add each kind of them. The actions
 * on the element: up and down among its siblings, its parent, a copy, removal. Every change goes to the Designer at
 * once. A prop its Component declares Body (the Value of a Markdown) is a field of many lines. With no element
 * selected, a component or an application shows the document being edited (DesignerDocument).
 * Events: select (the element selected after an action, or null).
 */
Elemenx.Component('DesignerInspector', {
	$TemplateURL: 'DesignerInspector.html',
	$StyleURL: 'DesignerInspector.css',
	$Meta: {
		Group: 'tools',
		Icon: 'sliders',
		Description: 'The layout and the props of the selected element of a designer of pages, in two blocks.',
		Events: ['select'],
		Props: {
			Style: 'Shows the blocks of the layout (DesignerStyle) and of the rules of CSS (DesignerRules) above the props.'
		}
	},
	Style: true,
	Version: 0,
	Raw: [],

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		function options (values) {
			return values.map(function (value) {
				return {Value: value, Label: value === '' ? '—' : value};
			});
		}

		/* What the inspector listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		this.Current = function (version) {
			var id = version >= 0 ? designer.Selected() : null;

			return id ? designer.Find(id) : null;
		};

		/* The mode of the designer: with no element selected, a component or an application shows its document. */
		this.Mode = function (version) {
			return version >= 0 ? designer.Project().Mode : 'template';
		};

		this.Title = function (node) {
			return node ? designer.Label(node.Kind) : '';
		};

		this.Description = function (node) {
			var kind = node ? designer.Kind(node.Kind) : null;

			return kind && kind.Description || '';
		};

		this.HasText = function (node) {
			var kind = node ? designer.Kind(node.Kind) : null;

			return !!kind && kind.Text !== undefined;
		};

		/*
		 * The fields of the props of a node, with their values, their hints and, for a choice, its options; a list prop
		 * with a Schema has its Items ([{Index, Values}], null when its expression is not a list of values) and its Keys.
		 */
		this.Fields = function (node, raw) {
			var kind = node ? designer.Kind(node.Kind) : null;

			return kind ? kind.Fields.map(function (field) {
				var value = node.Props[field.Name];
				var items = field.Schema && (raw || []).indexOf(field.Name) === -1 ? designer.Parse(String(value || '[]')) : undefined;

				return {
					Name: field.Name,
					Type: field.Body ? 'body' : field.Type,
					Value: field.Type === 'classes' ? String(value || '').split(/\s+/).filter(Boolean) : value,
					Hint: field.Description || (field.Type === 'json' ? Elemenx.Locale.Text('ui.designer.expression') : field.Type === 'list' ? 'One, Two, Three' : ''),
					Options: options(field.Options || []),
					Schema: !!field.Schema,
					Keys: field.Schema ? Object.keys(field.Schema).map(function (key) {
						return {Name: key, Type: field.Schema[key]};
					}) : [],
					Items: Object.prototype.toString.call(items) === '[object Array]' ? items.map(function (item, index) {
						return {Index: index, Values: item && typeof item === 'object' ? item : {}};
					}) : null
				};
			}) : [];
		};

		/* The kinds a node declares inside it (Tab in Tabs), for a button each. */
		this.Children = function (node) {
			var kind = node ? designer.Kind(node.Kind) : null;

			return kind && kind.Children ? kind.Children.filter(function (child) {
				return !!designer.Kind(child);
			}) : [];
		};

		/* The slots of the parent of a node as options: the default one first. */
		this.Slots = function (node) {
			var slots = node ? designer.Slots(node.ID) : [];

			return slots.length ? [{Value: '', Label: '—'}].concat(slots.map(function (slot) {
				return {Value: slot, Label: slot};
			})) : [];
		};

		this.Index = function (node) {
			var parent = node ? designer.Parent(node.ID) : null;

			return parent ? parent.Children.indexOf(node) : -1;
		};

		this.Count = function (node) {
			var parent = node ? designer.Parent(node.ID) : null;

			return parent ? parent.Children.length : 0;
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);

		designer.Load();
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	Node: function () {
		return this.$Service('Designer').Selected();
	},

	/* A field changed: the control names its prop by its Name. */
	Changed: function (value, control) {
		this.$Service('Designer').Set(this.Node(), control.Name, value);
	},

	Numbered: function (value, control) {
		this.$Service('Designer').Set(this.Node(), control.Name, value === null ? 0 : value);
	},

	Classed: function (value) {
		this.$Service('Designer').Set(this.Node(), 'Modifiers', (value || []).join(' '));
	},

	Typed: function (value) {
		this.$Service('Designer').Set(this.Node(), 'Text', value);
	},

	/* The items of a list prop as they are now, and the same written back as its expression. */
	Items: function (name) {
		var designer = this.$Service('Designer');
		var items = designer.Parse(String(designer.Find(this.Node()).Props[name] || '[]'));

		return Object.prototype.toString.call(items) === '[object Array]' ? items : [];
	},

	Write: function (name, items) {
		this.$Service('Designer').Set(this.Node(), name, this.$Service('Designer').Literal(items));
	},

	/* A field of an item typed: a text (empty takes the key away) or a switch. */
	Itemed: function (event, node) {
		var name = node.getAttribute('data-field');
		var key = node.getAttribute('data-key');
		var items = this.Items(name);
		var item = items[Number(node.getAttribute('data-index'))] || {};

		/* A field of its own, or the place of a Checkbox the change of its box bubbled to. */
		if (event.target.type === 'checkbox') item[key] = event.target.checked;
		else if (node.value === '') delete item[key];
		else item[key] = /^-?\d+(\.\d+)?$/.test(node.value) && typeof item[key] === 'number' ? Number(node.value) : node.value;

		this.Write(name, items);
	},

	/* An item added at the end, with the first key as its ID: item-3. */
	Added: function (event) {
		var node = event.target.closest('[data-field]');
		var name = node.getAttribute('data-field');
		var first = node.getAttribute('data-key');
		var items = this.Items(name);
		var item = {};

		item[first] = 'item-' + (items.length + 1);

		this.Write(name, items.concat([item]));
	},

	/* An item moved up (-1), down (1) or removed (0). */
	Shifted: function (event, node) {
		var name = node.getAttribute('data-field');
		var index = Number(node.getAttribute('data-index'));
		var step = Number(node.getAttribute('data-step'));
		var items = this.Items(name);
		var item = items.splice(index, 1)[0];

		if (step)
			items.splice(Math.max(0, Math.min(items.length, index + step)), 0, item);

		this.Write(name, items);
	},

	/* A list edited as its expression, and back. */
	Rawed: function (event, node) {
		var name = node.getAttribute('data-field');

		this.Raw = this.Raw.indexOf(name) === -1 ? this.Raw.concat([name]) : this.Raw.filter(function (field) {
			return field !== name;
		});
	},

	/* A child of a kind declared inside the element (a Tab in Tabs) added at its end, and selected. */
	Declared: function (event) {
		this.Pick(this.$Service('Designer').Insert(event.target.closest('[data-kind]').getAttribute('data-kind'), this.Node()));
	},

	Up: function () {
		var designer = this.$Service('Designer');
		var parent = designer.Parent(this.Node());

		designer.Move(this.Node(), parent.ID, parent.Children.indexOf(designer.Find(this.Node())) - 1);
	},

	Down: function () {
		var designer = this.$Service('Designer');
		var parent = designer.Parent(this.Node());

		designer.Move(this.Node(), parent.ID, parent.Children.indexOf(designer.Find(this.Node())) + 2);
	},

	Pick: function (id) {
		this.$Service('Designer').Select(id);

		this.$Emit('select', this.$Service('Designer').Selected());
	},

	Parent: function () {
		var parent = this.$Service('Designer').Parent(this.Node());

		this.Pick(parent ? parent.ID : null);
	},

	Duplicate: function () {
		this.Pick(this.$Service('Designer').Duplicate(this.Node()));
	},

	Delete: function () {
		var designer = this.$Service('Designer');
		var parent = designer.Parent(this.Node());

		designer.Remove(this.Node());

		this.Pick(parent ? parent.ID : null);
	}
});
