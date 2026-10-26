/*
 * The document a designer of pages edits (the Designer Service), what the inspector shows with no element selected: a
 * page has its Name and its Title, and in an application lists its routes (set in the settings of the Application); a
 * component its Name, its Description, its public props (a row each: name, type, default value, the options of a
 * choice, description; added, removed) and its slots, those its Slot elements make. Those props and slots are what the
 * inspector offers where the component is used. A name or a route that cannot be (taken, or not the name of a
 * Component) is said under its field. Remove takes the document away, unless it is the last one or another one holds it
 * (then it names them).
 */
Elemenx.Component('DesignerDocument', {
	$TemplateURL: 'DesignerDocument.html',
	$StyleURL: 'DesignerDocument.css',
	$Meta: {
		Group: 'tools',
		Icon: 'file-text',
		Description: 'The document a designer of pages edits: the name and route of a page, the props and slots of a component.'
	},
	Version: 0,
	Wrong: '',

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		/* What the panel listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		/* The document being edited, with the documents that hold it (Used) and whether it can go (Removable). */
		this.Current = function (version) {
			var project = version >= 0 ? designer.Project() : {Documents: []};
			var item = project.Documents.filter(function (entry) {
				return entry.ID === project.Current;
			})[0] || null;
			if (!item)
				return null;

			item.Used = designer.Used(item.ID);
			item.Mode = project.Mode;
			item.Routes = project.Routes.filter(function (route) {
				return route.Page === item.ID;
			}).map(function (route) {
				return route.Path;
			});
			item.Removable = project.Documents.length > 1 && !item.Used.length;

			return item;
		};

		this.Types = function () {
			return [
				{Value: 'text', Label: Elemenx.Locale.Text('ui.designer.project.types.text')},
				{Value: 'number', Label: Elemenx.Locale.Text('ui.designer.project.types.number')},
				{Value: 'bool', Label: Elemenx.Locale.Text('ui.designer.project.types.bool')},
				{Value: 'select', Label: Elemenx.Locale.Text('ui.designer.project.types.select')},
				{Value: 'json', Label: Elemenx.Locale.Text('ui.designer.project.types.json')}
			];
		};

		/* The props as rows, each with its index and its default as the text of a field. */
		this.Rows = function (item) {
			return (item ? item.Props : []).map(function (prop, index) {
				return {Index: index, Name: prop.Name, Type: prop.Type, Default: prop.Type === 'bool' ? prop.Default : String(prop.Default), Options: (prop.Options || []).join(', '), Description: prop.Description};
			});
		};

		this.SlotLabel = function (name) {
			return name || Elemenx.Locale.Text('ui.designer.slotDefault');
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	/* A field of the document (Name, Title, Description), by the Name of its control. */
	Changed: function (value, control) {
		var designer = this.$Service('Designer');

		this.Wrong = designer.SetDocument(designer.Opened(), control.Name, value) ? '' : control.Name;
	},

	/* A field of a prop: its row by data-index, its key by data-key. */
	Propped: function (event, node) {
		var designer = this.$Service('Designer');
		var item = this.Current(this.Version);
		var props = item.Props;
		var prop = props[Number(node.getAttribute('data-index'))];
		var key = node.getAttribute('data-key');

		if (!prop) return;

		/* A field of its own, or the place of a Checkbox the change of its box bubbled to. */
		prop[key] = event.target.type === 'checkbox' ? event.target.checked : node.value;

		this.Wrong = designer.SetDocument(item.ID, 'Props', props) ? '' : 'Props';
	},

	/* A new prop, Prop2 after Prop1, a text. */
	Added: function () {
		var item = this.Current(this.Version);
		var names = item.Props.map(function (prop) {
			return prop.Name;
		});
		var count = names.length + 1;

		while (names.indexOf('Prop' + count) !== -1) {
			count++;
		}

		this.$Service('Designer').SetDocument(item.ID, 'Props', item.Props.concat([{Name: 'Prop' + count, Type: 'text', Default: '', Description: ''}]));
	},

	Dropped: function (event, node) {
		var item = this.Current(this.Version);
		var index = Number(node.getAttribute('data-index'));

		this.$Service('Designer').SetDocument(item.ID, 'Props', item.Props.filter(function (prop, at) {
			return at !== index;
		}));

		this.Wrong = '';
	},

	Removed: function () {
		var designer = this.$Service('Designer');

		designer.RemoveDocument(designer.Opened());
	}
});
