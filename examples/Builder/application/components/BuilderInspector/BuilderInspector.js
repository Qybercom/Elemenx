/*
 * The props of the selected element of the builder (Node, its ID): a field for each prop its kind has (a text, a
 * number, a switch, a choice, a list of options separated by commas or an expression, a list or an object of
 * JavaScript), its text when its kind has one, and the actions
 * on it: up and down among its siblings, its parent, a copy, removal. Every change goes to the Design Service at once.
 * Events: select (the element to select after an action, or null).
 */
Elemenx.Component('BuilderInspector', {
	$TemplateURL: 'BuilderInspector.html',
	$StyleURL: 'BuilderInspector.css',
	Node: null,
	Version: 0,

	$OnCreate: function () {
		var self = this;

		this.Current = function (id, version) {
			return version >= 0 && id ? self.$Service('Design').Find(id) : null;
		};

		this.Title = function (node) {
			return node ? self.$Service('Design').Label(node.Kind) : '';
		};

		this.HasText = function (node) {
			var kind = node ? self.$Service('Design').Kind(node.Kind) : null;

			return !!kind && kind.Text !== undefined;
		};

		/* The fields of the props of a node, with their values and, for a choice, its options. */
		this.Fields = function (node) {
			var kind = node ? self.$Service('Design').Kind(node.Kind) : null;

			return kind ? kind.Fields.map(function (field) {
				return {
					Name: field.Name,
					Type: field.Type,
					Value: node.Props[field.Name],
					Options: (field.Options || []).map(function (option) {
						return {Value: option, Label: option === '' ? '—' : option};
					})
				};
			}) : [];
		};

		/* The slots of the parent of a node as options: the default one first. */
		this.Slots = function (node) {
			var slots = node ? self.$Service('Design').Slots(node.ID) : [];

			return slots.length ? [{Value: '', Label: '—'}].concat(slots.map(function (slot) {
				return {Value: slot, Label: slot};
			})) : [];
		};

		this.Index = function (node) {
			var parent = node ? self.$Service('Design').Parent(node.ID) : null;

			return parent ? parent.Children.indexOf(node) : -1;
		};

		this.Count = function (node) {
			var parent = node ? self.$Service('Design').Parent(node.ID) : null;

			return parent ? parent.Children.length : 0;
		};
	},

	/* A field changed: the control names its prop by its Name. */
	Changed: function (value, control) {
		this.$Service('Design').Set(this.Node, control.Name, value);
	},

	Numbered: function (value, control) {
		this.$Service('Design').Set(this.Node, control.Name, value === null ? 0 : value);
	},

	Typed: function (value) {
		this.$Service('Design').Set(this.Node, 'Text', value);
	},

	Up: function () {
		var design = this.$Service('Design');
		var parent = design.Parent(this.Node);

		design.Move(this.Node, parent.ID, parent.Children.indexOf(design.Find(this.Node)) - 1);
	},

	Down: function () {
		var design = this.$Service('Design');
		var parent = design.Parent(this.Node);

		design.Move(this.Node, parent.ID, parent.Children.indexOf(design.Find(this.Node)) + 2);
	},

	Parent: function () {
		var parent = this.$Service('Design').Parent(this.Node);

		this.$Emit('select', parent && parent.ID !== 'root' ? parent.ID : null);
	},

	Duplicate: function () {
		this.$Emit('select', this.$Service('Design').Duplicate(this.Node));
	},

	Delete: function () {
		var parent = this.$Service('Design').Parent(this.Node);

		this.$Service('Design').Remove(this.Node);

		this.$Emit('select', parent && parent.ID !== 'root' ? parent.ID : null);
	}
});
