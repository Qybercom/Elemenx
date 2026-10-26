/*
 * The settings of the Application a designer of pages makes (the Designer Service), as the properties of a project in
 * an editor of code. General: its Name (of its files), its Title (of the window), its Language, its Theme (as the
 * system, light or dark), how its Router keeps the route (the address, after # or in the history only), its Icon and
 * its Description. Structure: the component of the Application (a component of the project around the pages, with
 * the place of the page; said when it has none) and the page of a path no route has. Routes: a row each, its path
 * (/product/:id), its page, its guards (asked in their order), the page shown when one refuses; added and
 * removed. Guards: their names, descriptions and code (the body of the function of each), added and removed. Every
 * change goes to the Designer at once; a name or a path that cannot be is said under its field.
 */
Elemenx.Component('DesignerSettings', {
	$TemplateURL: 'DesignerSettings.html',
	$StyleURL: 'DesignerSettings.css',
	$Meta: {
		Group: 'tools',
		Icon: 'settings',
		Description: 'The settings of the Application a designer of pages makes: its name, title, language, theme, router, component, routes and guards.'
	},
	Version: 0,
	Wrong: '',

	$OnCreate: function () {
		var self = this;
		var designer = this.$Service('Designer');

		function changed () {
			self.Version++;
		}

		/* What the form listens to: not state, so it renders nothing. */
		this.Own = function () {
			return changed;
		};

		this.Project = function (version) {
			return version >= 0 ? designer.Project() : null;
		};

		/* The pages as options. */
		this.Pages = function (project) {
			return project ? project.Documents.filter(function (item) {
				return item.Type === 'page';
			}).map(function (item) {
				return {Value: item.ID, Label: item.Name};
			}) : [];
		};

		/* The documents of a type as options, none first (the component of the Application, the page not found, a refusal). */
		this.Choices = function (project, type) {
			return [{Value: '', Label: Elemenx.Locale.Text('ui.designer.project.none')}].concat(project ? project.Documents.filter(function (item) {
				return item.Type === type;
			}).map(function (item) {
				return {Value: item.ID, Label: item.Name};
			}) : []);
		};

		this.Guards = function (project) {
			return project ? project.Guards.map(function (guard) {
				return {Value: guard.Name, Label: guard.Name};
			}) : [];
		};

		/* Whether the component of the Application has no place for the pages. */
		this.Unplaced = function (project) {
			var item = project && project.Settings.Component ? project.Documents.filter(function (entry) {
				return entry.ID === project.Settings.Component;
			})[0] : null;

			return !!item && !item.Outlet;
		};

		this.Languages = function () {
			return ['en', 'ru', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'uk', 'tr', 'zh', 'ja', 'ko', 'ar'].map(function (code) {
				return {Value: code, Label: code};
			});
		};

		this.Themes = function () {
			return [
				{Value: '', Label: Elemenx.Locale.Text('ui.designer.project.themes.auto')},
				{Value: 'light', Label: Elemenx.Locale.Text('ui.designer.project.themes.light')},
				{Value: 'dark', Label: Elemenx.Locale.Text('ui.designer.project.themes.dark')}
			];
		};

		this.Routers = function () {
			return [
				{Value: 'history', Label: Elemenx.Locale.Text('ui.designer.project.routers.history')},
				{Value: 'hash', Label: Elemenx.Locale.Text('ui.designer.project.routers.hash')},
				{Value: 'memory', Label: Elemenx.Locale.Text('ui.designer.project.routers.memory')}
			];
		};

		/* The ways the window of an installed application shows. */
		this.Displays = function () {
			return [
				{Value: 'standalone', Label: Elemenx.Locale.Text('ui.designer.project.pwaDisplays.standalone')},
				{Value: 'fullscreen', Label: Elemenx.Locale.Text('ui.designer.project.pwaDisplays.fullscreen')},
				{Value: 'minimal-ui', Label: Elemenx.Locale.Text('ui.designer.project.pwaDisplays.minimal')},
				{Value: 'browser', Label: Elemenx.Locale.Text('ui.designer.project.pwaDisplays.browser')}
			];
		};

		/* How a new build of the installed application takes the place of the one before. */
		this.Updates = function () {
			return [
				{Value: 'auto', Label: Elemenx.Locale.Text('ui.designer.project.pwaUpdates.auto')},
				{Value: 'prompt', Label: Elemenx.Locale.Text('ui.designer.project.pwaUpdates.prompt')},
				{Value: 'manual', Label: Elemenx.Locale.Text('ui.designer.project.pwaUpdates.manual')}
			];
		};

		designer.OnChange(changed);

		Elemenx.Locale.OnChange(changed);
	},

	$OnDestroy: function () {
		this.$Service('Designer').OffChange(this.Own());

		Elemenx.Locale.OffChange(this.Own());
	},

	/* A setting, by the Name of its control. */
	Changed: function (value, control) {
		this.$Service('Designer').SetSetting(control.Name, value);
	},

	/* The least time of the splash: a number of milliseconds, or the field says it is wrong. */
	Splashed: function (value, control) {
		this.Wrong = this.$Service('Designer').SetSetting(control.Name, value) ? '' : control.Name;
	},

	/* A field of a route: its control is named <route>|<field>. */
	Routed: function (value, control) {
		var parts = String(control.Name).split('|');

		this.Wrong = this.$Service('Designer').SetRoute(parts[0], parts[1], value) ? '' : parts[0];
	},

	RouteAdded: function () {
		var designer = this.$Service('Designer');
		var project = designer.Project();
		var count = project.Routes.length + 1;

		while (!designer.AddRoute('/route-' + count) && count < 1000) {
			count++;
		}
	},

	RouteRemoved: function (event, node) {
		this.$Service('Designer').RemoveRoute(node.getAttribute('data-route'));
	},

	/* A field of a guard: its control is named <guard>|<field>. */
	Guarded: function (value, control) {
		var parts = String(control.Name).split('|');

		this.Wrong = this.$Service('Designer').SetGuard(parts[0], parts[1], value) ? '' : parts[0];
	},

	GuardAdded: function () {
		this.$Service('Designer').AddGuard();
	},

	GuardRemoved: function (event) {
		this.$Service('Designer').RemoveGuard(event.target.closest('[data-guard]').getAttribute('data-guard'));
	}
});
