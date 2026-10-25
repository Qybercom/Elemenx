/*
 * The project of a designer of pages (the Designer Service), as the explorer of an editor of code: the settings of
 * the Application on top, then its pages (with their routes) and its components, each pressed to edit it, and a button
 * to add a page or a component. Settings marks the settings as the open item, in place of the document being edited.
 * Events: open ({ID}, a document opened), settings (the settings pressed).
 */
Elemenx.Component('DesignerProject', {
	$TemplateURL: 'DesignerProject.html',
	$StyleURL: 'DesignerProject.css',
	$Meta: {
		Group: 'tools',
		Icon: 'folder',
		Description: 'The project of a designer of pages: the settings of the Application, its pages and its components.',
		Events: ['open', 'settings'],
		Props: {
			Settings: 'Marks the settings of the Application as the open item.'
		}
	},
	Settings: false,
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		/* What the explorer listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		/* The documents of a type (page or component), the one being edited marked unless the settings are open. */
		this.Documents = function (version, type, settings) {
			var project = version >= 0 ? designer.Project() : {Documents: [], Routes: []};

			return project.Documents.filter(function (item) {
				return item.Type === type;
			}).map(function (item) {
				var route = project.Routes.filter(function (entry) {
					return entry.Page === item.ID;
				})[0];

				return {ID: item.ID, Name: item.Name, Route: route ? route.Path : '', Active: !settings && item.ID === project.Current};
			});
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	Chosen: function (event, node) {
		var id = node.getAttribute('data-document');

		this.$Service('Designer').Open(id);

		this.$Emit('open', {ID: id});
	},

	Configured: function () {
		this.$Emit('settings');
	},

	/* A new page or component, opened at once. */
	Added: function (event, node) {
		var designer = this.$Service('Designer');
		var id = designer.AddDocument(node.getAttribute('data-type'));
		if (!id) return;

		designer.Open(id);

		this.$Emit('open', {ID: id});
	}
});
