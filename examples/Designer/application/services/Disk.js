/*
 * The project elemenx designer opens the Designer on (window.ElemenxDesigner: what tools/designer.js reads of it), its files
 * read only, under /__project/files/:
 * - Project(): its description, or null out of elemenx designer.
 * - Load(callback): runs the scripts of its Components with the framework (their $TemplateURL and $StyleURL from the
 *   files of the project) and calls back (error, components): [{Name, Description, Props, Slots, Container, Events,
 *   Template, Definition}], as the Designer takes them (Extend). A Component whose name the framework has already (one
 *   of ElemenxUI, each of which declares its $Meta) does not run, and is not among them: Taken() names those.
 * - Tree(): the project as the items of a Tree: its Applications (their routes and guards), Components, Services,
 *   Directives, Guards and Libraries; the ID of the item of a Component is component:<its name>.
 */
Elemenx.Service('Disk', {
	Base: '/__project/files/',

	$OnCreate: function () {
		var taken = [];

		this.Own = function () {
			return {Taken: taken};
		};
	},

	Project: function () {
		return window.ElemenxDesigner || null;
	},

	Taken: function () {
		return this.Own().Taken.slice();
	},

	/* The text of a file of the project, or an error. */
	Fetch: function (file, callback) {
		var request = new XMLHttpRequest();

		request.open('GET', this.Base + file, true);

		request.onload = function () {
			if (request.status >= 200 && request.status < 300) callback(null, request.responseText);
			else callback(new Error('The file of the project is not there: ' + file));
		};

		request.onerror = function () {
			callback(new Error('The file of the project did not load: ' + file));
		};

		request.send();
	},

	/*
	 * Runs a script of the project: its Elemenx is the framework, but for the Components it declares, which take their
	 * files from the project and are kept by their names (found); one of a name taken is not declared.
	 */
	Run: function (file, source, found) {
		var self = this;
		var base = this.Base + file.substring(0, file.lastIndexOf('/') + 1);
		var framework = Object.create(Elemenx);

		framework.Component = function (name, definition) {
			if (arguments.length !== 2)
				return Elemenx.Component.apply(Elemenx, arguments);

			if (Elemenx.Meta(name)) {
				self.Own().Taken.push(name);

				return null;
			}

			['$TemplateURL', '$StyleURL'].forEach(function (key) {
				if (typeof definition[key] === 'string' && !/^(?:[a-z]+:)?\/\//i.test(definition[key]) && definition[key].charAt(0) !== '/')
					definition[key] = base + definition[key].replace(/^\.\//, '');
			});

			found[name] = definition;

			return Elemenx.Component(name, definition);
		};

		new Function('Elemenx', source + '\n//# sourceURL=' + this.Base + file)(framework);
	},

	Load: function (callback) {
		var self = this;
		var project = this.Project();
		var components = project ? project.Components : [];
		var files = [];
		var found = {};
		var texts = {};
		var left;
		var failed = null;

		components.forEach(function (item) {
			if (files.indexOf(item.File) === -1)
				files.push(item.File);
		});

		left = files.length + components.length;

		function done () {
			left--;

			if (left > 0) return;

			files.forEach(function (file) {
				if (typeof texts[file] !== 'string') return;

				try {
					self.Run(file, texts[file], found);
				}
				catch (error) {
					failed = failed || error;
				}
			});

			callback(failed, components.filter(function (item) {
				return !!found[item.Name];
			}).map(function (item) {
				return {Name: item.Name, Description: item.Description, Props: item.Props, Slots: item.Slots, Container: item.Slots.length > 0, Events: item.Events, Template: texts['template:' + item.Name] || '', Definition: found[item.Name]};
			}));
		}

		if (!left) {
			callback(null, []);

			return;
		}

		files.forEach(function (file) {
			self.Fetch(file, function (error, text) {
				failed = failed || error;
				texts[file] = error ? null : text;

				done();
			});
		});

		/* The template of each, what a copy of it is made of: its file, or the one its definition holds. */
		components.forEach(function (item) {
			if (!item.Template) {
				texts['template:' + item.Name] = item.Inline || '';

				done();

				return;
			}

			self.Fetch(item.Template, function (error, text) {
				texts['template:' + item.Name] = error ? '' : text;

				done();
			});
		});
	},

	Tree: function () {
		var project = this.Project();
		var taken = this.Own().Taken;

		function items (list, kind, icon, label) {
			return list.map(function (item) {
				return {ID: kind + ':' + item.Name, Label: label ? label(item) : item.Name, Icon: icon, Badge: taken.indexOf(item.Name) !== -1 && kind === 'component' ? Elemenx.Locale.Text('designer.disk.taken') : ''};
			});
		}

		function group (id, icon, list) {
			return {ID: id, Label: Elemenx.Locale.Text('designer.disk.' + id) + ' (' + list.length + ')', Icon: icon, Items: list};
		}

		if (!project) return [];

		return [
			group('applications', 'launcher', project.Applications.map(function (application) {
				return {ID: 'application:' + application.Name, Label: application.Title ? application.Name + ' — ' + application.Title : application.Name, Icon: 'launcher', Items: application.Routes.map(function (route, index) {
					return {ID: 'route:' + application.Name + ':' + index, Label: route.Path + ' → ' + (route.Redirect || route.Component || '—'), Icon: 'link', Badge: route.Guards.join(', ')};
				})};
			})),
			group('components', 'layout', items(project.Components, 'component', 'layout')),
			group('services', 'settings', items(project.Services, 'service', 'settings')),
			group('directives', 'code', items(project.Directives, 'directive', 'code')),
			group('guards', 'lock', items(project.Guards, 'guard', 'lock')),
			group('libraries', 'folder', project.Libraries.map(function (name) {
				return {ID: 'library:' + name, Label: name, Icon: 'folder'};
			}))
		].filter(function (item) {
			return item.Items.length > 0;
		});
	}
});
