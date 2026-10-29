/*
 * The document of a designer of pages, shared by its components (DesignerPalette, DesignerCanvas, DesignerTree,
 * DesignerInspector): a tree of nodes under a root (the page), each a kind of the palette with its props, its text, its
 * layout (Style) and its children, and the selected node. It changes through its methods only, each change kept in the
 * history (Undo, Redo) and in the storage of the browser (StorageKey), and listeners hear of every change (OnChange).
 *
 * - The kinds are the classes of the layouts of ElemenxUI (a screen, a row, a heading, a table...), their modifiers
 *   as fields, and every Component of the Library from what it declares in $Meta: data/meta.json of the Library, made
 *   by elemenx meta. Load(callback) reads it once (Ready() tells it is there); Use(meta) gives it instead.
 * - A node is {ID, Kind, Props, Text, Slot, Style, Children}: Slot is the named slot of its parent it goes to, '' for
 *   the default one; Style holds its layout (padding, margin, the size with its least and greatest and, in a flex
 *   container, its direction, its wrap, align-items, justify-content and gap), set inline: on its element, or on a div
 *   around a Component. SetStyle(id, property, value) sets one of Layout.
 * - A Component whose $Meta names its Children (Tab in Tabs) holds them as nodes: a child inserted gets an ID and a
 *   name (tab-2, Tab 2), and on the canvas the component shows the child the selection is in (its Current prop).
 * - A prop its Component declares Body (the Value of a Markdown, of a CodeView) is a text of many lines, written as the
 *   body of the element (indented as the template, a tag in it as &lt;) and read back from it.
 * - Literal(value) writes a value as the source of an expression ({ID: 'a'}); Parse(expression) reads it back.
 * - Kinds() lists the kinds by group; Kind(id) is one: {ID, Group, Icon, Tag, Component, Container, Flex, Text,
 *   Description, Props (the first values), Fields ([{Name, Type, Options, Default, Description}]), Slots}. Label(kind)
 *   and GroupLabel(group) name them in the language of the page; Slots(id) are the named slots of the parent of a node.
 * - Insert(kind, parent, index), Move(id, parent, index), Remove(id), Duplicate(id), Set(id, name, value),
 *   SetStyle(id, property, value), Clear(); Select(id) and Selected() for the selected node.
 * - The rules of CSS of the page, by context: Rules(); Rule(context) the one of {Who: node, kind or within, Node,
 *   Class, Parent, State, Width, Theme}; SetRule(context, property, value) sets a property of it (the rule comes with
 *   its first property and goes with its last); RootClass(id) is the class of the element of a node (elemenx-button),
 *   what a rule of its kind names. A node with rules of its own takes the class page-<its ID> (on a div around a
 *   Component).
 * - Template() is the document as a template of Elemenx, its rules first in a <style> (@media for the widths);
 *   Template(true, empty) the same for a canvas, every node in an element that names it (data-designer-id), a container
 *   marked (data-designer-container, data-designer-gap), an empty one holding the text empty (none when it is ''), and
 *   the rules inside the page of the canvas (@container for the widths).
 * - Import(text) reads a template back: the kinds of the palette where an element is one, any other element as it is,
 *   and the rules of its <style> (those it does not understand kept as they are).
 * - Projects, the one being edited among them, each kept in the storage of the browser (ProjectsKey): Projects() lists
 *   them, Create(mode, name) makes one of a mode that stays its own, template (one page), component (a Component with
 *   its public props and slots) or application (pages and components, routes, guards and the settings of the
 *   Application), Switch(id) edits another, RemoveProject(id) takes one away; ExportProject() is the one being edited
 *   as the text of a file, ImportProject(text) reads one back as a new project.
 * - Project() is the project being edited: {ID, Mode, Name, Settings, Current, Tabs, Documents, Routes, Guards}. A
 *   document is {ID, Type (page or component), Name, Title (a page), Description and Props ([{Name, Type, Default,
 *   Options, Description}], a component), Slots (those its Slot elements make, '' the default one), Outlet (whether it
 *   holds the place of the pages), Origin (the Component of the files it is a copy of, '' for none)}; Opened() is the
 *   ID of the one being edited, Tabs those open. AddDocument(type, name), RemoveDocument(id) (not a component another
 *   document holds: Used(id) names them), Open(id) (in a tab; each document keeps its own history), Close(id) (its
 *   tab), SetDocument(id, name, value); Source(id) is the template of a document. Map() is the map of the pages of an
 *   application: [{ID, Name, Paths (its routes), Template (as the canvas shows it), Links ([{Node, Page}]: an element
 *   whose Href a route of another page matches)}], in the order of the routes.
 * - The routes of an application: [{ID, Path, Page, Guards, Failed}], AddRoute(path, page), SetRoute(id, name,
 *   value), RemoveRoute(id); its guards, [{Name, Description, Code}] (Code the body of the function of the guard),
 *   AddGuard(name), SetGuard(name, field, value), RemoveGuard(name); its settings, SetSetting(name, value): Name,
 *   Title, Description, Icon, Language, Theme, Router, Component (the component that holds the pages), NotFound and
 *   the splash of its page: Splash ('true' or ''), SplashImage, SplashBackground, SplashColor, SplashText,
 *   SplashSpinner, SplashMinTime and SplashHTML (its own content); and its install as an application of the system:
 *   PWA ('true' or ''), PWAShortName, PWAIcon, PWATheme, PWADisplay, PWAOffline ('true' or '') and PWAUpdate (auto,
 *   prompt or manual).
 * - In an application the components of the project are kinds of the palette (group project) the document being
 *   edited may take, but itself and those holding it; on the canvas each runs as a Component made of its document. The
 *   kind slot (a component only) marks where the component puts what it is given, the kind outlet (a component of an
 *   application) where the pages of the routes go.
 * - A project of another place (elemenx design): Scope(name) keeps its projects apart in the storage, Extend(components)
 *   gives its Components (group files of the palette), and Copy(name) makes one of them a component of the project to
 *   edit (Origin its name): the nodes of its template, whose texts keep their expressions, and on the canvas the
 *   definition it came with.
 */
Elemenx.Service('Designer', {
	$Meta: {
		Description: 'The document of a designer of pages: its nodes, their props and layout, the selection, the history and the template.',
		Methods: ['Load(callback)', 'Use(meta)', 'Ready()', 'Literal(value)', 'Parse(expression)', 'Rules()', 'Rule(context)', 'SetRule(context, property, value)', 'RootClass(id)', 'Kinds()', 'Kind(id)', 'Label(kind)', 'Hint(kind)', 'GroupLabel(group)', 'Root()', 'Find(id)', 'Parent(id)', 'Container(id)', 'Within(id, within)', 'Slots(id)', 'Insert(kind, parent, index)', 'Move(id, parent, index)', 'Remove(id)', 'Duplicate(id)', 'Set(id, name, value)', 'SetStyle(id, property, value)', 'Clear()', 'Select(id)', 'Selected()', 'Count()', 'CanUndo()', 'CanRedo()', 'Undo()', 'Redo()', 'Template(canvas, empty)', 'Import(text)', 'Project()', 'Opened()', 'Projects()', 'Create(mode, name)', 'Switch(id)', 'RemoveProject(id)', 'ExportProject()', 'ImportProject(text)', 'AddDocument(type, name)', 'RemoveDocument(id)', 'Used(id)', 'Open(id)', 'Close(id)', 'SetDocument(id, name, value)', 'AddRoute(path, page)', 'SetRoute(id, name, value)', 'RemoveRoute(id)', 'AddGuard(name)', 'SetGuard(name, field, value)', 'RemoveGuard(name)', 'SetSetting(name, value)', 'Source(id)', 'Map()', 'Scope(name)', 'Extend(components)', 'Copy(name)', 'OnChange(listener)', 'OffChange(listener)']
	},
	Library: 'ElemenxUI',
	StorageKey: 'elemenx-designer:document',
	ProjectKey: 'elemenx-designer:project',
	ProjectsKey: 'elemenx-designer:projects',
	Groups: ['layout', 'text', 'inputs', 'buttons', 'menus', 'navigation', 'display', 'feedback', 'data', 'codes', 'media', 'overlays', 'social', 'commerce', 'music', 'game'],

	/* The layout a node may set, in the order of its style; the last five in a flex container only. */
	Layout: ['padding', 'margin', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'gap'],

	$OnCreate: function () {
		var self = this;
		var library = Elemenx.Library(this.Library);
		var base = String(library && library.$Root || '').replace(/\/$/, '');
		var next = 1;
		var listeners = [];
		var past = [];
		var future = [];
		var root = {ID: 'root', Kind: 'root', Props: {}, Text: '', Children: []};
		var typing = {Key: '', Time: 0};
		var selected = null;
		var state = 'idle';
		var waiting = [];
		var keys = {Storage: this.StorageKey, Project: this.ProjectKey, Projects: this.ProjectsKey};

		/*
		 * The project: its documents and the one being edited (its tree is root, kept in its Root on every change), the
		 * history of each other one, and the Components the canvas made of its components, by what they are made of.
		 */
		var store = {Current: '', Projects: {}};
		var project = null;
		var old;
		var histories = {};
		var parts = {};
		var made = 0;
		var building = [];
		var aliasing = false;
		var bound = false;

		/*
		 * The Components of another place (Extend: the files of a project), as kinds of the palette in the group files, and
		 * what a copy of each is made of (Copy): its template and its definition, by its name; the meta of the Library.
		 */
		var extra = [];
		var disks = {};
		var used = null;

		/* The names of the components of an imported template, by the name HTML gives their elements (elemenx-c-<name>). */
		var named = {};
		var prefix = 'elemenx-c-';
		var flex = ['flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'gap'];

		function list (text) {
			return String(text || '').split(',').map(function (item) {
				return item.trim();
			}).filter(Boolean);
		}

		function quote (text) {
			return String(text).replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
		}

		/* A value of JavaScript as the source of an expression: {ID: 'a', Items: [1, 2]}. */
		function literal (value) {
			if (value === null || value === undefined) return 'null';

			if (typeof value === 'string')
				return '\'' + quote(value) + '\'';

			if (typeof value !== 'object') return String(value);

			if (Object.prototype.toString.call(value) === '[object Array]') return '[' + value.map(literal).join(', ') + ']';

			return '{' + Object.keys(value).map(function (key) {
				return (/^[A-Za-z_$][\w$]*$/.test(key) ? key : '\'' + quote(key) + '\'') + ': ' + literal(value[key]);
			}).join(', ') + '}';
		}

		/*
		 * The kinds of classes: an element of the classes of ElemenxUI (Base). Its fields with a Class are its modifiers
		 * (a switch adds the class it names; a choice adds its value, after the Class when that is a prefix ending with -),
		 * the others attributes; Modifiers takes the other modifiers of its class (meta.Classes). Items (a list field) of a
		 * kind with Inner become its children: the items of a list, the cells of a table.
		 */
		var sizes = ['', 'fill', 'fill-fixed', 'non-fill'];
		var builtin = [
			{ID: 'screen', Group: 'layout', Icon: 'monitor', Tag: 'div', Base: 'elemenx-screen', Container: true, Gap: true, Flex: true, Props: {Sizing: ''}, Fields: [{Name: 'Sizing', Type: 'select', Options: sizes, Class: true}]},
			{ID: 'row', Group: 'layout', Icon: 'columns', Tag: 'div', Base: 'elemenx-container', Container: true, Gap: true, Flex: true, Flow: 'row', Props: {Wrap: true, Centered: false, Sizing: '', Block: false}, Fields: [{Name: 'Wrap', Type: 'bool', Class: 'wrappable'}, {Name: 'Centered', Type: 'bool', Class: 'centered'}, {Name: 'Sizing', Type: 'select', Options: sizes, Class: true}, {Name: 'Block', Type: 'bool', Class: 'block'}]},
			{ID: 'column', Group: 'layout', Icon: 'list', Tag: 'div', Base: 'elemenx-column', Container: true, Gap: true, Flex: true, Props: {Sizing: ''}, Fields: [{Name: 'Sizing', Type: 'select', Options: sizes, Class: true}]},
			{ID: 'grid', Group: 'layout', Icon: 'grid', Tag: 'div', Base: 'elemenx-container grid', Container: true, Gap: true, Flex: true, Flow: 'row', Props: {}, Fields: []},
			{ID: 'panel', Group: 'layout', Icon: 'layout', Tag: 'div', Base: 'elemenx-panel', Container: true, Props: {Padding: ''}, Fields: [{Name: 'Padding', Type: 'select', Options: ['', 'compact', 'spacious'], Class: true}]},
			{ID: 'divider', Group: 'layout', Icon: 'remove', Tag: 'div', Base: 'elemenx-divider', Props: {Vertical: false}, Fields: [{Name: 'Vertical', Type: 'bool', Class: 'vertical'}]},
			{ID: 'spacer', Group: 'layout', Icon: 'more', Tag: 'span', Base: 'elemenx-spacer', Props: {}, Fields: []},
			{ID: 'gamepanel', Group: 'layout', Icon: 'trophy', Tag: 'div', Base: 'elemenx-game-panel', Container: true, Props: {Light: false}, Fields: [{Name: 'Light', Type: 'bool', Class: 'light'}]},

			{ID: 'heading', Group: 'text', Icon: 'heading', Tag: 'h2', Text: 'Heading', Props: {Level: '2'}, Fields: [{Name: 'Level', Type: 'select', Options: ['1', '2', '3', '4', '5', '6']}],
				TagOf: function (props) {
					return 'h' + (props.Level || '2');
				}},
			{ID: 'paragraph', Group: 'text', Icon: 'text-align-left', Tag: 'p', Base: '', Optional: 'elemenx-text', Text: 'A paragraph of text.', Props: {Size: '', Tone: '', Strong: false, Mono: false}, Fields: [{Name: 'Size', Type: 'select', Options: ['', 'small', 'large'], Class: true}, {Name: 'Tone', Type: 'select', Options: ['', 'muted', 'success', 'warning', 'danger'], Class: true}, {Name: 'Strong', Type: 'bool', Class: 'strong'}, {Name: 'Mono', Type: 'bool', Class: 'mono'}]},
			{ID: 'textstyle', Group: 'text', Icon: 'text-color', Tag: 'div', Base: '', Text: 'Title', Props: {Style: 'title'}, Fields: [{Name: 'Style', Type: 'select', Options: ['title', 'subtitle', 'eyebrow', 'caption', 'footnote', 'label'], Class: 'elemenx-'}]},
			{ID: 'callout', Group: 'text', Icon: 'info', Tag: 'div', Base: 'elemenx-callout', Text: 'Something worth knowing.', Props: {Tone: ''}, Fields: [{Name: 'Tone', Type: 'select', Options: ['', 'neutral', 'success', 'warning', 'danger'], Class: true}]},
			{ID: 'link', Group: 'text', Icon: 'link', Tag: 'a', Base: 'elemenx-link', Text: 'A link', Props: {Href: '#'}, Fields: [{Name: 'Href', Type: 'text'}]},
			{ID: 'badge', Group: 'text', Icon: 'bell', Tag: 'span', Base: 'elemenx-badge', Text: '3', Props: {Tone: '', Dot: false}, Fields: [{Name: 'Tone', Type: 'select', Options: ['', 'accent', 'info', 'success', 'warning', 'danger'], Class: true}, {Name: 'Dot', Type: 'bool', Class: 'dot'}]},
			{ID: 'kbd', Group: 'text', Icon: 'grid', Tag: 'kbd', Base: 'elemenx-kbd', Text: 'Ctrl', Props: {}, Fields: []},
			{ID: 'code', Group: 'text', Icon: 'code', Tag: 'pre', Base: 'elemenx-code', Text: 'var answer = 42;', Props: {}, Fields: []},
			{ID: 'bullets', Group: 'text', Icon: 'list-bulleted', Tag: 'ul', Base: 'elemenx-ul', Props: {Items: 'One, Two, Three', Check: false}, Fields: [{Name: 'Items', Type: 'list'}, {Name: 'Check', Type: 'bool', Class: 'check'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						return '<li>' + text(item) + '</li>';
					});
				}},
			{ID: 'numbers', Group: 'text', Icon: 'list-ordered', Tag: 'ol', Base: 'elemenx-ol', Props: {Items: 'One, Two, Three', Outline: false}, Fields: [{Name: 'Items', Type: 'list'}, {Name: 'Outline', Type: 'bool', Class: 'outline'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						return '<li>' + text(item) + '</li>';
					});
				}},
			{ID: 'chips', Group: 'text', Icon: 'tag', Tag: 'div', Base: 'elemenx-chips', Props: {Items: 'Design, Code, Docs'}, Fields: [{Name: 'Items', Type: 'list'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						return '<span class="elemenx-chip">' + text(item) + '</span>';
					});
				}},
			{ID: 'table', Group: 'text', Icon: 'table', Tag: 'table', Base: 'elemenx-table', Props: {Columns: 'Name, Role, Since', Rows: 3, Bordered: false, Striped: false, Compact: false, Sticky: false}, Fields: [{Name: 'Columns', Type: 'list'}, {Name: 'Rows', Type: 'number'}, {Name: 'Bordered', Type: 'bool', Class: 'bordered'}, {Name: 'Striped', Type: 'bool', Class: 'striped'}, {Name: 'Compact', Type: 'bool', Class: 'compact'}, {Name: 'Sticky', Type: 'bool', Class: 'sticky'}],
				Inner: function (props) {
					var columns = list(props.Columns);
					var rows = [];
					var i = 0;

					while (i < Math.max(0, Number(props.Rows) || 0)) {
						rows.push('\t<tr>' + columns.map(function () {
							return '<td>—</td>';
						}).join('') + '</tr>');

						i++;
					}

					return ['<thead>', '\t<tr>' + columns.map(function (column) {
						return '<th>' + text(column) + '</th>';
					}).join('') + '</tr>', '</thead>', '<tbody>'].concat(rows, ['</tbody>']);
				}},
			{ID: 'stats', Group: 'text', Icon: 'list', Tag: 'dl', Base: 'elemenx-game-stats', Props: {Items: 'Attack: 1017, Defense: 1162', Double: false}, Fields: [{Name: 'Items', Type: 'list'}, {Name: 'Double', Type: 'bool', Class: 'double'}],
				Inner: function (props) {
					return list(props.Items).map(function (item) {
						var parts = item.split(':');

						return '<dt>' + text(parts[0].trim()) + '</dt><dd>' + text(parts.slice(1).join(':').trim()) + '</dd>';
					});
				}},
			{ID: 'document', Group: 'text', Icon: 'file-text', Tag: 'div', Base: 'elemenx-document', Container: true, Gap: true, Props: {}, Fields: []},

			/* In a component of the project: where it puts what it is given, the slot of its Name ('' the default one). */
			{ID: 'slot', Group: 'layout', Icon: 'login', Tag: 'slot', Props: {Name: ''}, Fields: [{Name: 'Name', Type: 'text'}]},

			/* In the component of an application: where the page of the route goes (*outlet). */
			{ID: 'outlet', Group: 'layout', Icon: 'file', Tag: 'div', Props: {}, Fields: []},

			/* Not in the palette: what an imported template holds besides the kinds of the palette, kept as it is. */
			{ID: 'element', Group: '', Icon: 'code', Tag: 'div', Container: true, Gap: true, Props: {Tag: 'div', Attributes: ''}, Fields: [{Name: 'Tag', Type: 'text'}, {Name: 'Attributes', Type: 'text'}]},
			{ID: 'text', Group: '', Icon: 'text-color', Tag: '', Text: '', Props: {}, Fields: []}
		];
		var kinds = [];
		var byID = {};

		function clone (value) {
			return JSON.parse(JSON.stringify(value));
		}

		function fresh () {
			return {ID: 'root', Kind: 'root', Props: {}, Text: '', Children: []};
		}

		/* The ID of a new project: the time it was made and a few letters of chance. */
		function identity () {
			return 'p' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
		}

		function settings (name) {
			return {Title: name || 'App', Description: '', Icon: '', Language: 'en', Theme: '', Router: 'history', Component: '', NotFound: '', Splash: '', SplashImage: '', SplashBackground: '', SplashColor: '', SplashText: '', SplashSpinner: 'true', SplashMinTime: '0', SplashHTML: '', PWA: '', PWAShortName: '', PWAIcon: '', PWATheme: '', PWADisplay: 'standalone', PWAOffline: 'true', PWAUpdate: 'auto'};
		}

		/* A new project of a mode: one page (a template), one component, or a page Home on the route / (an application). */
		function blank (mode, name) {
			var item = mode === 'component' ? {ID: 'd1', Type: 'component', Name: /^[A-Z][A-Za-z0-9]*$/.test(name) ? name : 'MyComponent', Title: '', Description: '', Props: [], Root: null} : {ID: 'd1', Type: 'page', Name: 'Home', Title: 'Home', Description: '', Props: [], Root: null};

			return {ID: identity(), Mode: mode, Name: name || (mode === 'component' ? item.Name : 'App'), Settings: settings(name), Documents: [item], Current: 'd1', Tabs: ['d1'], Routes: mode === 'application' ? [{ID: 'r1', Path: '/', Page: 'd1', Guards: [], Failed: ''}] : [], Guards: [], Changed: Date.now()};
		}

		function valid (entry) {
			return !!entry && Object.prototype.toString.call(entry.Documents) === '[object Array]' && entry.Documents.length > 0 && !!entry.Settings;
		}

		/* A project kept by an earlier designer: its routes from the Route of its pages, its tabs, guards and settings. */
		function upgrade (entry) {
			var base = settings(entry.Name);
			var count = 0;

			entry.ID = entry.ID || identity();
			entry.Mode = ['template', 'component', 'application'].indexOf(entry.Mode) === -1 ? 'template' : entry.Mode;
			entry.Guards = entry.Guards || [];

			if (!entry.Routes) {
				entry.Routes = [];

				entry.Documents.forEach(function (item) {
					if (item.Type === 'page' && item.Route) {
						count++;

						entry.Routes.push({ID: 'r' + count, Path: item.Route, Page: item.ID, Guards: [], Failed: ''});
					}
				});
			}

			entry.Documents.forEach(function (item) {
				delete item.Route;
			});

			Object.keys(base).forEach(function (key) {
				if (entry.Settings[key] === undefined)
					entry.Settings[key] = base[key];
			});

			entry.Tabs = (entry.Tabs || [entry.Current]).filter(function (id) {
				return entry.Documents.some(function (item) {
					return item.ID === id;
				});
			});

			if (!entry.Tabs.length)
				entry.Tabs = [entry.Documents[0].ID];

			return entry;
		}

		/* The project being edited kept among the others, its tree in its document. */
		function keep () {
			opened().Root = root;
			store.Projects[project.ID] = project;
			store.Current = project.ID;
		}

		/* Another project to edit: its first tab open, nothing selected, no history yet. */
		function use (entry) {
			project = entry;

			if (!opened())
				project.Current = project.Tabs[0] || project.Documents[0].ID;

			root = opened().Root || fresh();
			histories = {};
			past = [];
			future = [];
			selected = null;
			typing.Key = '';

			project.Documents.forEach(function (item) {
				next = Math.max(next, highest(treeOf(item)) + 1);
			});

			keep();
		}

		function guardOf (name) {
			return project.Guards.filter(function (guard) {
				return guard.Name === name;
			})[0] || null;
		}

		/* Whether a tree holds the place of the pages (the kind outlet). */
		function holdsOutlet (tree) {
			return tree.Kind === 'outlet' || tree.Children.some(holdsOutlet);
		}

		/* A path as a route has it: from /, without spaces around. */
		function normal (path) {
			return '/' + String(path || '').trim().replace(/^\/+/, '');
		}

		function taken (path, except) {
			return project.Routes.some(function (route) {
				return route.ID !== except && route.Path === path;
			});
		}

		function routeID () {
			return 'r' + (Math.max.apply(Math, [0].concat(project.Routes.map(function (route) {
				return Number(String(route.ID).substring(1)) || 0;
			}))) + 1);
		}

		function documentOf (id) {
			return project.Documents.filter(function (item) {
				return item.ID === id;
			})[0] || null;
		}

		function opened () {
			return documentOf(project.Current);
		}

		/* The tree of a document: root for the one being edited. */
		function treeOf (item) {
			if (item.ID === project.Current) return root;

			item.Root = item.Root || fresh();

			return item.Root;
		}

		/* The names of the slots the Slot elements of a tree make, '' for the default one, each once. */
		function slotsOf (tree) {
			var names = [];

			function walk (node) {
				if (node.Kind === 'slot' && names.indexOf(node.Props.Name || '') === -1)
					names.push(node.Props.Name || '');

				node.Children.forEach(walk);
			}

			walk(tree);

			return names;
		}

		/* Whether the tree of a document holds the component name: itself, or inside a component of the project it holds. */
		function holds (item, name, seen) {
			var found = false;

			seen = seen || [];

			if (seen.indexOf(item.ID) !== -1) return false;

			seen.push(item.ID);

			function walk (node) {
				var inner = byID[node.Kind] && byID[node.Kind].Project ? documentOf(byID[node.Kind].Project) : null;

				if (found) return;

				if (node.Kind === name || (inner && holds(inner, name, seen))) found = true;
				else node.Children.forEach(walk);
			}

			walk(treeOf(item));

			return found;
		}

		/* Whether the document being edited may take a component of the project: not itself, nor one that holds it. */
		function usable (kind) {
			var item = documentOf(kind.Project);
			var own = opened();

			return !!item && item.ID !== own.ID && (own.Type !== 'component' || !holds(item, own.Name));
		}

		/* A component of the project as a kind: its props as fields, their defaults as the first values. */
		function projectKind (item) {
			var slots = slotsOf(treeOf(item));
			var kind = {ID: item.Name, Group: 'project', Icon: 'layout', Tag: item.Name, Component: true, Project: item.ID, Container: slots.length > 0, Description: item.Description || '', Slots: slots.filter(Boolean), Children: [], Current: '', Props: {}, Fields: []};

			(item.Props || []).forEach(function (prop) {
				var field = {Name: prop.Name, Type: prop.Type, Schema: null, Description: prop.Description || '', Default: prop.Default};

				if (prop.Type === 'select')
					field.Options = (prop.Options || []).indexOf(prop.Default) === -1 ? [prop.Default].concat(prop.Options || []) : prop.Options.slice();

				kind.Fields.push(field);

				kind.Props[prop.Name] = prop.Default;
			});

			return kind;
		}

		/* The kinds of the components of the project, made again on every change: their slots come from their trees. */
		function refresh () {
			kinds = kinds.filter(function (kind) {
				return !kind.Project;
			});

			project.Documents.forEach(function (item) {
				if (item.Type === 'component')
					kinds.push(projectKind(item));
			});

			byID = {};

			kinds.forEach(function (kind) {
				byID[kind.ID] = kind;
			});
		}

		/* Runs with the tree of another document as root: its nodes, its rules. */
		function within (tree, run) {
			var saved = root;

			root = tree;

			try {
				return run();
			}
			finally {
				root = saved;
			}
		}

		/* Runs with the texts of a copy of a Component kept as expressions, or written as text. */
		function expressed (on, run) {
			var saved = bound;

			bound = on;

			try {
				return run();
			}
			finally {
				bound = saved;
			}
		}

		/*
		 * The Component that shows a component of the project on the canvas, made of its document (its template with its
		 * rules, its props with their defaults) under a name of its own, made again when what it is made of changes. A copy
		 * of a Component of the files (Copy) keeps the definition it came with: its state, its methods, its style.
		 */
		function part (definition) {
			var item = documentOf(definition.Project);
			var origin = item && item.Origin && disks[item.Origin] ? disks[item.Origin].Definition : null;
			var values = {};
			var source;
			var key;

			if (!item || building.indexOf(item.ID) !== -1) return 'div';

			building.push(item.ID);

			try {
				source = expressed(!!item.Origin, function () {
					return within(treeOf(item), function () {
						return template(false, '');
					});
				});
			}
			finally {
				building.pop();
			}

			key = JSON.stringify([item.Name, item.Props, source, !!origin]);

			if (!parts[key]) {
				Object.keys(origin || {}).forEach(function (name) {
					/* What it is made of, not where its template comes from: the template is the one of the copy. */
					if (!/^\$(Template(URL|ID)?|DefinitionURL|Meta)$/.test(name))
						values[name] = origin[name];
				});

				(item.Props || []).forEach(function (prop) {
					var value = prop.Type === 'json' ? self.Parse(String(prop.Default || 'null')) : prop.Default;

					values[prop.Name] = value === undefined ? null : value;
				});

				made++;

				values.$Template = '<div class="elemenx-designer-part">' + source + '</div>';
				parts[key] = 'DesignerPart' + made;

				Elemenx.Component(parts[key], values);
			}

			return parts[key];
		}

		/* Whether a name is free for a document of a type: a component a name of a Component no other kind has. */
		function free (type, name, except) {
			var taken = project.Documents.some(function (item) {
				return item.ID !== except && item.Type === type && item.Name === name;
			});
			if (taken || !name) return false;

			if (type === 'page') return true;

			return /^[A-Z][A-Za-z0-9]*$/.test(name) && (!byID[name] || byID[name].Project === except);
		}

		/* The route of a new page: / for the first, its name in small letters for the others, the same never twice. */
		function routeOf (name) {
			var base = '/' + String(name).toLowerCase().replace(/[^a-z0-9Ѐ-ӿ]+/g, '-').replace(/^-+|-+$/g, '');
			var route = base;
			var count = 2;

			if (!taken('/', null)) return '/';

			while (taken(route, null)) {
				route = base + '-' + count;

				count++;
			}

			return route;
		}

		/* The props of a component as it declares them: names of JavaScript, each once, their defaults of their type. */
		function declare (props) {
			var names = [];
			var result = [];
			var valid = Object.prototype.toString.call(props) === '[object Array]';

			(valid ? props : []).forEach(function (prop) {
				var type = ['text', 'number', 'bool', 'select', 'json'].indexOf(prop && prop.Type) === -1 ? 'text' : prop.Type;
				var name = String(prop && prop.Name || '').trim();
				var value = prop.Default;
				var options = typeof prop.Options === 'string' ? list(prop.Options) : (prop.Options || []).map(String);

				if (!/^[A-Za-z_][\w]*$/.test(name) || names.indexOf(name) !== -1) {
					valid = false;

					return;
				}

				names.push(name);

				if (type === 'bool') value = value === true || value === 'true';
				else if (type === 'number') value = Number(value) || 0;
				else value = value === null || value === undefined ? '' : String(value);

				if (type === 'select' && options.indexOf(value) === -1)
					value = options[0] || '';

				result.push({Name: name, Type: type, Default: value, Options: type === 'select' ? options : [], Description: String(prop.Description || '')});
			});

			return valid ? result : null;
		}

		/* A component renamed: the nodes of every document and of every history take the new name. */
		function rename (old, name) {
			var from = '"Kind":' + JSON.stringify(old);
			var to = '"Kind":' + JSON.stringify(name);

			function walk (node) {
				if (node.Kind === old)
					node.Kind = name;

				node.Children.forEach(walk);
			}

			function swap (entries) {
				return entries.map(function (entry) {
					return entry.split(from).join(to);
				});
			}

			project.Documents.forEach(function (item) {
				walk(treeOf(item));
			});

			past = swap(past);
			future = swap(future);

			Object.keys(histories).forEach(function (id) {
				histories[id] = {Past: swap(histories[id].Past), Future: swap(histories[id].Future)};
			});
		}

		/* A Component of the Library as a kind, from its meta: its props as fields, its sample as the first values. */
		function component (meta) {
			var kind = {ID: meta.Name, Group: meta.Group || 'other', Icon: meta.Icon || 'code', Tag: meta.Name, Component: true, Container: !!meta.Container, Description: meta.Description || '', Slots: (meta.Slots || []).slice(), Children: (meta.Children || []).slice(), Current: meta.Current || '', Props: {}, Fields: []};
			var sample = meta.Sample || {};

			(meta.Props || []).forEach(function (prop) {
				var type = ['bool', 'number', 'text', 'select'].indexOf(prop.Type) !== -1 ? prop.Type : 'json';
				var field = {Name: prop.Name, Type: type, Schema: prop.Schema || null, Body: !!prop.Body && type === 'text', Description: prop.Description || ''};
				var value = Object.prototype.hasOwnProperty.call(sample, prop.Name) ? sample[prop.Name] : prop.Default;

				if (type === 'json') {
					field.Default = prop.Default === null || prop.Default === undefined ? '' : literal(prop.Default);
					value = value === null || value === undefined ? '' : literal(value);
				}
				else {
					field.Default = prop.Default;
				}

				if (type === 'select')
					field.Options = prop.Options.indexOf(prop.Default) === -1 ? [prop.Default].concat(prop.Options) : prop.Options.slice();

				kind.Fields.push(field);

				kind.Props[prop.Name] = value;
			});

			return kind;
		}

		/* The kinds of classes and the Components of a meta; a class takes the modifiers no field of its kind names. */
		function prepare (meta) {
			var classes = meta && meta.Classes || {};
			var bases = [];

			kinds = builtin.map(function (kind) {
				var copy = {};

				Object.keys(kind).forEach(function (key) {
					copy[key] = typeof kind[key] === 'function' ? kind[key] : clone(kind[key]);
				});

				return copy;
			});

			kinds.forEach(function (kind) {
				if (kind.Base)
					bases = bases.concat(kind.Base.split(' '));
			});

			kinds.forEach(function (kind) {
				var name = kind.Base ? kind.Base.split(' ')[0] : '';
				var taken = [];
				var rest;

				if (!name || !classes[name]) return;

				kind.Fields.forEach(function (field) {
					if (field.Type === 'bool' && field.Class) taken.push(field.Class);
					else if (field.Type === 'select' && field.Class) taken = taken.concat(field.Options);
				});

				rest = classes[name].filter(function (modifier) {
					return modifier && taken.indexOf(modifier) === -1 && bases.indexOf(modifier) === -1;
				});

				if (!rest.length) return;

				kind.Fields.push({Name: 'Modifiers', Type: 'classes', Options: rest, Class: 'list'});

				kind.Props.Modifiers = '';
			});

			kinds = kinds.concat((meta && meta.Components || []).map(component)).concat(extra.map(function (item) {
				var kind = component(item);

				kind.Group = 'files';
				kind.Disk = true;

				return kind;
			}));

			used = meta;

			refresh();
		}

		function find (node, id) {
			var i = 0;
			var found;

			if (node.ID === id) return node;

			while (i < node.Children.length) {
				found = find(node.Children[i], id);

				if (found)
					return found;

				i++;
			}

			return null;
		}

		function parentOf (node, id) {
			var i = 0;
			var found;

			while (i < node.Children.length) {
				if (node.Children[i].ID === id) return node;

				found = parentOf(node.Children[i], id);

				if (found)
					return found;

				i++;
			}

			return null;
		}

		function renumber (node) {
			node.ID = 'n' + next++;

			delete node.Mark;

			node.Children.forEach(renumber);

			return node;
		}

		function highest (node) {
			var number = Number(String(node.ID).substring(1)) || 0;

			node.Children.forEach(function (child) {
				number = Math.max(number, highest(child));
			});

			return number;
		}

		function create (kind) {
			var definition = byID[kind];

			return {ID: 'n' + next++, Kind: kind, Props: clone(definition.Props), Text: definition.Text || '', Slot: '', Style: {}, Children: []};
		}

		function save () {
			project.Changed = Date.now();

			keep();

			try {
				window.localStorage.setItem(self.StorageKey, JSON.stringify(root));
				window.localStorage.setItem(self.ProjectsKey, JSON.stringify(store));
			}
			catch (error) {
				return;
			}
		}

		function notify () {
			listeners.slice().forEach(function (listener) {
				listener(self);
			});
		}

		function changed () {
			if (selected && !find(root, selected))
				selected = null;

			refresh();

			save();

			notify();
		}

		/* Keeps the document as it was before a change, for Undo. */
		function remember () {
			typing.Key = '';

			past.push(JSON.stringify(root));

			if (past.length > 100)
				past.shift();

			future = [];
		}

		function escape (text) {
			return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		/* A text of the template: a {{ of its own is written as text, but not in a copy of a Component, whose texts keep their expressions (bound). */
		function text (value) {
			var written = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

			return bound ? written : written.replace(/\{\{/g, '{{ \'{{\' }}');
		}

		/* The layout of a node as a style: its properties in the order of Layout, those of a flex container in one only. */
		function style (node, definition) {
			var values = node.Style || {};

			return self.Layout.filter(function (property) {
				return values[property] && (definition.Flex || flex.indexOf(property) === -1);
			}).map(function (property) {
				return property + ': ' + values[property];
			}).join('; ');
		}

		/* The layout a style attribute gives, or null when it holds a property the designer does not set. */
		function unstyle (value, definition) {
			var result = {};
			var lost = false;

			String(value || '').split(';').forEach(function (declaration) {
				var at = declaration.indexOf(':');
				var property = declaration.substring(0, at).trim().toLowerCase();
				var content = declaration.substring(at + 1).trim();

				if (!declaration.trim()) return;

				if (at === -1 || !content || self.Layout.indexOf(property) === -1 || (!definition.Flex && flex.indexOf(property) !== -1)) lost = true;
				else result[property] = content;
			});

			return lost ? null : result;
		}

		/* The classes of a node of a kind of classes: its Base, then its modifiers (and Optional with them). */
		function classes (definition, props) {
			var result = [];
			var modifiers = [];

			if (definition.Base === undefined) return '';

			definition.Fields.forEach(function (field) {
				var value = props[field.Name];
				if (!field.Class || !value) return;

				if (field.Type === 'bool') modifiers.push(field.Class);
				else if (field.Type === 'classes') modifiers = modifiers.concat(String(value).split(/\s+/).filter(Boolean));
				else modifiers.push((field.Class === true ? '' : field.Class) + value);
			});

			if (definition.Base)
				result.push(definition.Base);

			if (modifiers.length && definition.Optional)
				result.push(definition.Optional);

			return result.concat(modifiers).join(' ');
		}

		/*
		 * The props a list of classes gives a kind of classes, and how many of the classes it took; null when a class is
		 * not its own (the element is kept as it is, so nothing of it is lost).
		 */
		function unclass (definition, names) {
			var props = {};
			var taken = 0;
			var known = (definition.Base ? definition.Base.split(' ') : []).concat(definition.Optional ? [definition.Optional] : []);
			var lost = false;

			names.forEach(function (name) {
				var found = false;

				if (!name || known.indexOf(name) !== -1) return;

				definition.Fields.forEach(function (field) {
					var start = field.Class === true ? '' : field.Class;

					if (found || !field.Class) return;

					if (field.Type === 'bool' && field.Class === name) {
						props[field.Name] = true;
						found = true;
					}
					else if (field.Type === 'select' && name.indexOf(start) === 0 && field.Options.indexOf(name.substring(start.length)) !== -1) {
						props[field.Name] = name.substring(start.length);
						found = true;
					}
					else if (field.Type === 'classes' && field.Options.indexOf(name) !== -1) {
						props[field.Name] = props[field.Name] ? props[field.Name] + ' ' + name : name;
						found = true;
					}
				});

				if (found) taken++;
				else lost = true;
			});

			return lost ? null : {Props: props, Taken: taken};
		}

		/*
		 * The attributes of a node: its slot, its classes, its layout, then its props (a number or an expression as a
		 * binding; a prop at its default, or false or empty without one, left out). The modifiers of a kind of classes are
		 * classes, its other fields attributes of HTML; the fields of a kind with Inner are its children. The attributes
		 * of an imported element stay as they are, but on the canvas, where its bindings, events and directives would name
		 * a state that is not there. A Component in a div of its layout (wrapped) leaves its slot and layout to the div.
		 */
		function attributes (node, definition, canvas, wrapped) {
			var result = [];
			var mark = definition.Component || wrapped ? '' : marked(node);
			var names = [classes(definition, node.Props), node.Kind === 'element' ? '' : mark].filter(Boolean).join(' ');
			var layout = definition.Component ? '' : style(node, definition);
			var current = canvas && definition.Current ? shown(node) : null;
			var kept;

			if (node.Slot && !canvas && !wrapped)
				result.push('slot="' + escape(node.Slot) + '"');

			if (names)
				result.push('class="' + names + '"');

			if (node.Kind === 'element' && node.Props.Attributes) {
				kept = canvas ? (node.Props.Attributes.match(/[^\s=]+(="[^"]*")?/g) || []).filter(function (attribute) {
					return !/^[[(*.]/.test(attribute);
				}).join(' ') : node.Props.Attributes;

				if (mark && /(^|\s)class="/.test(kept)) kept = kept.replace(/(^|\s)class="/, '$1class="' + mark + ' ');
				else if (mark) result.push('class="' + mark + '"');

				if (kept)
					result.push(kept);
			}
			else if (node.Kind === 'element' && mark) {
				result.push('class="' + mark + '"');
			}

			if (layout)
				result.push('style="' + escape(layout) + '"');

			/* On the canvas a component of declared children shows the one the selection is in (Tabs its Tab). */
			if (current)
				result.push(definition.Current + '="' + escape(current) + '"');

			ordered(node, definition.Fields).forEach(function (field) {
				var value = node.Props[field.Name];
				var name = definition.Base === undefined ? field.Name : field.Name.toLowerCase();

				if (field.Class || field.Body || definition.TagOf || definition.Inner || node.Kind === 'element' || (current && field.Name === definition.Current)) return;

				if (value === null || value === undefined) return;

				if (field.Default !== undefined ? value === field.Default : value === '' || value === false) return;

				if (field.Type === 'json') {
					if (String(value).trim() && String(value).trim() !== field.Default)
						result.push('[' + field.Name.toLowerCase() + ']="' + escape(String(value).trim()) + '"');

					return;
				}

				if (field.Type === 'number') {
					result.push('[' + field.Name.toLowerCase() + ']="' + (Number(value) || 0) + '"');

					return;
				}

				result.push(name + '="' + escape(value === true ? 'true' : value === false ? 'false' : value) + '"');
			});

			if (bound && node.Bound)
				result.push(node.Bound);

			return result.length ? ' ' + result.join(' ') : '';
		}

		/* The fields of a node in the order of the attributes of the element it was read from (Order), then in their own. */
		function ordered (node, fields) {
			var order = node.Order || [];

			function rank (field) {
				var at = order.indexOf(field.Name.toLowerCase());

				return at === -1 ? order.length + fields.indexOf(field) : at;
			}

			return fields.slice().sort(function (first, second) {
				return rank(first) - rank(second);
			});
		}

		/* The field of a kind written as the body of its element (Body), or null. */
		function bodyOf (definition) {
			return (definition.Fields || []).filter(function (field) {
				return field.Body;
			})[0] || null;
		}

		/* The text of a body: its lines without the indentation they share, without the blank lines around them. */
		function dedent (value) {
			var lines = String(value || '').replace(/\r\n?/g, '\n').split('\n');
			var indent = null;

			while (lines.length && !lines[0].trim()) {
				lines.shift();
			}

			while (lines.length && !lines[lines.length - 1].trim()) {
				lines.pop();
			}

			lines.forEach(function (line) {
				var lead = /^[ \t]*/.exec(line)[0];
				if (line.trim() && (indent === null || lead.length < indent.length))
					indent = lead;
			});

			return lines.map(function (line) {
				return indent && line.indexOf(indent) === 0 ? line.substring(indent.length) : line.replace(/^[ \t]+$/, '');
			}).join('\n');
		}

		function tagOf (node, definition) {
			if (node.Kind === 'element')
				return node.Props.Tag || 'div';

			if (definition.Project && aliasing) return part(definition);

			return definition.TagOf ? definition.TagOf(node.Props) : definition.Tag;
		}

		function definitionOf (node) {
			return byID[node.Kind] || byID.element;
		}

		/* Whether a node is text, or an element of text (<b>, <a>...) holding only such nodes: it stays on the line of its parent. */
		function inline (node) {
			if (node.Kind === 'text') return true;

			return node.Kind === 'element' && /^(a|abbr|b|br|code|em|i|kbd|mark|s|small|span|strong|sub|sup|u)$/.test(node.Props.Tag) && node.Children.every(inline);
		}

		/* A node on one line, without indentation: text, or an element of text with its content. */
		function line (node) {
			var definition = definitionOf(node);
			var tag = tagOf(node, definition);

			if (node.Kind === 'text') return text(node.Text);

			return '<' + tag + attributes(node, definition, false, false) + '>' + node.Children.map(line).join(' ') + '</' + tag + '>';
		}

		/* Whether a kind is declared inside another (a Tab in Tabs): it holds the content of its parent. */
		function declared (id) {
			return kinds.some(function (kind) {
				return (kind.Children || []).indexOf(id) !== -1;
			});
		}

		/* The ID of the declared child of a node the selection is in (or is), for the canvas to show it; null without one. */
		function shown (node) {
			var found = null;

			node.Children.forEach(function (child) {
				if (!found && selected && child.Props.ID && find(child, selected))
					found = String(child.Props.ID);
			});

			return found;
		}

		/*
		 * A child declared in its parent (a Tab in Tabs) gets an ID and a name of its own when it has none: tab-2, Tab 2, the
		 * number after those of its kind already there.
		 */
		function name (node, parent) {
			var definition = byID[parent.Kind];
			var count = parent.Children.filter(function (child) {
				return child.Kind === node.Kind;
			}).length + 1;
			var ids = parent.Children.map(function (child) {
				return String(child.Props.ID || '');
			});
			var base = node.Kind.replace(/^(Ribbon|Tile|Menu)/, '') || node.Kind;
			var fields = byID[node.Kind].Fields.map(function (field) {
				return field.Name;
			});

			if (!definition || (definition.Children || []).indexOf(node.Kind) === -1) return;

			while (fields.indexOf('ID') !== -1 && ids.indexOf(base.toLowerCase() + '-' + count) !== -1) {
				count++;
			}

			if (fields.indexOf('ID') !== -1 && !node.Props.ID)
				node.Props.ID = base.toLowerCase() + '-' + count;

			['Label', 'Title'].some(function (key) {
				if (fields.indexOf(key) === -1 || node.Props[key]) return false;

				node.Props[key] = base + ' ' + count;

				return true;
			});
		}

		/* Whether an empty container shows the place to drop on the canvas: a Component of a few controls does not. */
		function placeholder (definition) {
			return !definition.Component || definition.Group === 'layout' || definition.Group === 'overlays' || definition.Slots.length > 0 || declared(definition.ID);
		}

		/* The markup of a node itself, at a depth. */
		function markup (node, depth, canvas, empty, wrapped) {
			var definition = definitionOf(node);
			var indent = new Array(depth + 1).join('\t');
			var tag = tagOf(node, definition);
			var open;
			var inner;

			if (node.Kind === 'text')
				return indent + text(node.Text);

			/* The place of the pages: on the canvas a place that says it, in the template the outlet of the router. */
			if (node.Kind === 'outlet')
				return indent + (canvas ? '<div class="elemenx-designer-outlet">' + text(Elemenx.Locale.Text('ui.designer.outlet')) + '</div>' : '<div class="elemenx-column fill" *outlet="Content"></div>');

			/* A slot of a component: on the canvas a place that names it. */
			if (node.Kind === 'slot')
				return indent + (canvas ? '<div class="elemenx-designer-slot">' + text(node.Props.Name || Elemenx.Locale.Text('ui.designer.slotDefault')) + '</div>' : '<slot' + (node.Props.Name ? ' name="' + escape(node.Props.Name) + '"' : '') + '></slot>');

			if (!canvas && node.Kind === 'element' && node.Children.length && node.Children.every(inline))
				return indent + '<' + tag + attributes(node, definition, false, false) + '>' + node.Children.map(line).join(' ') + '</' + tag + '>';

			open = '<' + tag + attributes(node, definition, canvas, wrapped);

			if (bodyOf(definition) && String(node.Props[bodyOf(definition).Name] || ''))
				return indent + open + '>\n' + String(node.Props[bodyOf(definition).Name]).split('\n').map(function (line) {
					return line ? indent + '\t' + text(line) : '';
				}).join('\n') + '\n' + indent + '</' + tag + '>';

			inner = definition.Inner ? definition.Inner(node.Props).map(function (child) {
				return indent + '\t' + child;
			}) : node.Children.map(function (child) {
				return render(child, depth + 1, canvas, empty);
			});

			if (canvas && empty && definition.Container && !node.Children.length && placeholder(definition))
				inner.push(indent + '\t<div class="elemenx-designer-empty">' + text(empty) + '</div>');

			if (node.Text)
				return indent + open + '>' + text(node.Text) + '</' + tag + '>';

			if (inner.length)
				return indent + open + '>\n' + inner.join('\n') + '\n' + indent + '</' + tag + '>';

			return indent + open + (/^[A-Z]/.test(tag) ? ' />' : '></' + tag + '>');
		}

		/* A node with its layout: a Component in a div that carries it (the element of a Component is its own). */
		function render (node, depth, canvas, empty) {
			var definition = definitionOf(node);
			var indent = new Array(depth + 1).join('\t');
			var layout = definition.Component ? style(node, definition) : '';
			var mark = definition.Component ? marked(node) : '';
			var result;

			if (layout || mark) result = indent + '<div' + (node.Slot && !canvas ? ' slot="' + escape(node.Slot) + '"' : '') + (mark ? ' class="' + mark + '"' : '') + (layout ? ' style="' + escape(layout) + '"' : '') + '>\n' + markup(node, depth + 1, canvas, empty, true) + '\n' + indent + '</div>';
			else result = markup(node, depth, canvas, empty, false);

			if (!canvas)
				return result;

			/* On the canvas the slot of a node is on its wrapper, the child of the component that places it. */
			return indent + '<div class="elemenx-designer-node" data-designer-id="' + node.ID + '"' + (definition.Container ? ' data-designer-container' : '') + (definition.Gap ? ' data-designer-gap' : '') + (node.Slot ? ' slot="' + escape(node.Slot) + '"' : '') + '>\n' + result + '\n' + indent + '</div>';
		}

		/* A value of an imported binding: a number, true or false, or the expression as it is. */
		function binding (expression, field) {
			expression = expression.trim();

			if (field.Type === 'json') return expression;

			if (/^-?\d+(\.\d+)?$/.test(expression)) return Number(expression);

			if (expression === 'true' || expression === 'false') return expression === 'true';

			return expression.replace(/^'|'$/g, '');
		}

		/* The kind of an imported element: one of the palette, or none (it is kept as an element). */
		function kindOf (element) {
			var tag = element.tagName.toLowerCase();
			var names = (element.getAttribute('class') || '').split(/\s+/).filter(Boolean);
			var found = null;
			var score = -1;

			if (tag === 'slot') return 'slot';

			if (element.hasAttribute('*outlet')) return 'outlet';

			if (tag.indexOf(prefix) === 0) {
				tag = tag.substring(prefix.length);

				kinds.forEach(function (kind) {
					if (!found && kind.Component && kind.Tag.toLowerCase() === tag)
						found = kind.ID;
				});

				return found;
			}

			if (/^h[1-6]$/.test(tag))
				return element.hasAttribute('style') && !unstyle(element.getAttribute('style'), byID.heading) ? null : 'heading';

			/* A kind of classes of this tag whose Base the element has and whose modifiers are all its other classes. */
			kinds.forEach(function (kind) {
				var base = kind.Base ? kind.Base.split(' ') : [];
				var match;

				if (kind.Base === undefined || !kind.Group || kind.Tag !== tag || !base.every(function (name) {
					return names.indexOf(name) !== -1;
				})) return;

				if (element.hasAttribute('style') && !unstyle(element.getAttribute('style'), kind)) return;

				match = unclass(kind, names);

				if (!match || (!base.length && !match.Taken && kind.ID !== 'paragraph')) return;

				if (base.length * 10 + match.Taken > score) {
					found = kind.ID;
					score = base.length * 10 + match.Taken;
				}
			});

			return found;
		}

		/* The name of an element in the template it came from: a component keeps the letters it was written with. */
		function nameOf (element) {
			var tag = element.tagName.toLowerCase();

			return tag.indexOf(prefix) === 0 ? named[tag] || tag.substring(prefix.length) : tag;
		}

		/* The Component a div of layout holds: a div with a style (and a slot) around one Component and nothing else. */
		function wrapped (element) {
			var inner = element.children[0];
			var only = Array.prototype.every.call(element.attributes, function (attribute) {
				return attribute.name === 'style' || attribute.name === 'slot';
			});
			var mark = marks.some(function (item) {
				return item.Element === element;
			});
			if (element.tagName.toLowerCase() !== 'div' || (!element.hasAttribute('style') && !mark) || !only || element.children.length !== 1) return null;

			if (element.textContent.trim() !== inner.textContent.trim() || !byID[kindOf(inner)] || !byID[kindOf(inner)].Component) return null;

			return unstyle(element.getAttribute('style') || '', byID[kindOf(inner)]) ? inner : null;
		}

		/* A node of an imported element; one that had a class page-n12 is the node its rules go to. */
		function read (element) {
			var node = readNode(element);

			marks.forEach(function (item) {
				if (item.Element === element) {
					item.Node = node;
					node.Mark = item.Old;
				}
			});

			return node;
		}

		function readNode (element) {
			var inner = wrapped(element);
			var kind = kindOf(element);
			var node;
			var definition;
			var names;
			var kept = [];
			var values;

			if (inner) {
				node = read(inner);
				node.Slot = element.getAttribute('slot') || '';
				node.Style = unstyle(element.getAttribute('style') || '', byID[node.Kind]);

				return node;
			}

			if (!kind) {
				node = create('element');

				node.Props.Tag = nameOf(element);
				node.Slot = element.getAttribute('slot') || '';

				Array.prototype.forEach.call(element.attributes, function (attribute) {
					var layout = attribute.name === 'style' ? unstyle(attribute.value, {Flex: true}) : null;

					if (layout) node.Style = layout;
					else if (attribute.name !== 'slot') kept.push(attribute.name + '="' + escape(attribute.value) + '"');
				});

				node.Props.Attributes = kept.join(' ');
				node.Children = children(element);

				return node;
			}

			node = create(kind);
			node.Slot = element.getAttribute('slot') || '';
			node.Order = Array.prototype.map.call(element.attributes, function (attribute) {
				return attribute.name.toLowerCase().replace(/^\[|\]$/g, '');
			});
			definition = byID[kind];
			names = (element.getAttribute('class') || '').split(/\s+/);

			if (element.hasAttribute('style') && !definition.Component)
				node.Style = unstyle(element.getAttribute('style'), definition);

			if (kind === 'heading')
				node.Props.Level = element.tagName.substring(1);

			/* A kind of classes: its modifiers from the classes (each one off unless the element has it), its children from Inner. */
			if (definition.Base !== undefined) {
				definition.Fields.forEach(function (field) {
					if (field.Class)
						node.Props[field.Name] = field.Type === 'bool' ? false : '';
				});

				values = unclass(definition, names.filter(Boolean)).Props;

				Object.keys(values).forEach(function (name) {
					node.Props[name] = values[name];
				});
			}

			if (definition.Inner) {
				values = items(definition, element);

				Object.keys(values).forEach(function (name) {
					node.Props[name] = values[name];
				});
			}

			if (!definition.TagOf && !definition.Inner) {
				definition.Fields.forEach(function (field) {
					var name = field.Name.toLowerCase();

					if (field.Class) return;

					/* A prop the element does not set has the default of its component, not the first value of the palette. */
					if (field.Default !== undefined) node.Props[field.Name] = field.Default;
					else node.Props[field.Name] = field.Type === 'bool' ? false : field.Type === 'number' ? null : '';

					Array.prototype.forEach.call(element.attributes, function (attribute) {
						var key = attribute.name.toLowerCase();

						if (key === name) node.Props[field.Name] = field.Type === 'bool' ? attribute.value !== 'false' : field.Type === 'number' ? Number(attribute.value) || 0 : attribute.value;
						else if (key === '[' + name + ']') node.Props[field.Name] = binding(attribute.value, field);
					});
				});
			}

			/* In a copy of a Component its events, directives and bindings to its state stay as they are (Bound), the props they set at their defaults. */
			if (bound)
				node.Bound = Array.prototype.filter.call(element.attributes, function (attribute) {
					return /^[(*]/.test(attribute.name) || (/^\[.+\]$/.test(attribute.name) && self.Parse(attribute.value) === undefined);
				}).map(function (attribute) {
					var field = definition.Fields.filter(function (item) {
						return '[' + item.Name.toLowerCase() + ']' === attribute.name;
					})[0];
					if (field)
						node.Props[field.Name] = field.Default !== undefined ? field.Default : field.Type === 'bool' ? false : field.Type === 'number' ? null : '';

					return attribute.name + '="' + escape(attribute.value) + '"';
				}).join(' ');

			if (bodyOf(definition) && !element.hasAttribute(bodyOf(definition).Name.toLowerCase()) && !element.hasAttribute('[' + bodyOf(definition).Name.toLowerCase() + ']') && element.textContent.trim())
				node.Props[bodyOf(definition).Name] = dedent(element.textContent.split('{{ \'{{\' }}').join('{{'));

			if (definition.Text !== undefined) node.Text = element.textContent.trim();
			else if (definition.Container) node.Children = children(element);

			return node;
		}

		/* The children of a kind with Inner read back into its fields: the items of a list, the columns and rows of a table. */
		function items (definition, element) {
			var texts = function (selector) {
				return Array.prototype.map.call(element.querySelectorAll(selector), function (node) {
					return node.textContent.trim();
				});
			};

			if (definition.ID === 'table')
				return {Columns: texts('th').join(', '), Rows: element.querySelectorAll('tbody tr').length};

			if (definition.ID === 'stats')
				return {Items: texts('dt').map(function (name, index) {
					return name + ': ' + (texts('dd')[index] || '');
				}).join(', ')};

			return {Items: texts(definition.ID === 'chips' ? '.elemenx-chip' : 'li').join(', ')};
		}

		function children (element) {
			var result = [];

			Array.prototype.forEach.call(element.childNodes, function (child) {
				var node;

				if (child.nodeType === 1) {
					result.push(read(child));

					return;
				}

				if (child.nodeType === 3 && child.nodeValue.trim()) {
					node = create('text');
					node.Text = child.nodeValue.trim();

					result.push(node);
				}
			});

			return result;
		}

		/*
		 * The rules of CSS of the page, kept in the document (root.Rules) and written into the template as a <style>:
		 * [{ID, Who, Node, Class, Parent, State, Width, Theme, Props}] or {ID, Raw} for a rule read and not understood. Who
		 * is node (one element: the class page-<its ID>), kind (every element of a class: Class) or within (those inside an
		 * element of another class: Parent Class); State a pseudo-class (hover, focus-visible, active, disabled); Width
		 * tablet or phone (a media query, a container query on the canvas: it is as wide as the page it shows); Theme light
		 * or dark (the scheme of the page, data-scheme).
		 */
		var widths = {tablet: 1024, phone: 600};
		var marks = [];

		function rules () {
			if (!root.Rules)
				root.Rules = [];

			return root.Rules;
		}

		function filled (rule) {
			return !!rule.Raw || Object.keys(rule.Props || {}).length > 0;
		}

		/* The class a node takes for the rules of its own: page-n12, when it has some. */
		function marked (node) {
			return rules().some(function (rule) {
				return rule.Who === 'node' && rule.Node === node.ID && filled(rule);
			}) ? 'page-' + (node.Mark || node.ID) : '';
		}

		/* The selector of a rule; on the canvas inside its page, so the rules reach the page and nothing of the builder. */
		function selector (rule, canvas) {
			var node = rule.Who === 'node' ? find(root, rule.Node) : null;
			var target;

			if (rule.Who === 'node') target = '.page-' + (node && node.Mark || rule.Node) + (node && definitionOf(node).Component ? ' > *' : '');
			else if (rule.Who === 'within') target = '.' + rule.Parent + ' .' + rule.Class;
			else target = '.' + rule.Class;

			if (rule.State)
				target += ':' + rule.State;

			if (canvas)
				target = '.elemenx-designer-page ' + target;

			return rule.Theme ? '[data-scheme=\'' + rule.Theme + '\'] ' + target : target;
		}

		/* The <style> of the rules, its lines indented; '' without one. */
		function sheet (canvas) {
			var lines = [];

			rules().forEach(function (rule) {
				var block;

				if (rule.Raw) {
					lines = lines.concat(rule.Raw.split('\n'));

					return;
				}

				if (!filled(rule) || (rule.Who === 'node' && !find(root, rule.Node))) return;

				block = [selector(rule, canvas) + ' {'].concat(Object.keys(rule.Props).map(function (property) {
					return '\t' + property + ': ' + rule.Props[property] + ';';
				}), ['}']);

				if (rule.Width) {
					block = [(canvas ? '@container elemenx-designer' : '@media') + ' (max-width: ' + widths[rule.Width] + 'px) {'].concat(block.map(function (line) {
						return '\t' + line;
					}), ['}']);
				}

				lines = lines.concat(block);
			});

			return lines.length ? '<style>\n' + lines.map(function (line) {
				return line ? '\t' + line : line;
			}).join('\n') + '\n</style>' : '';
		}

		/* The blocks of a text of CSS: [{Prelude, Body}], the body of an at-rule with its own blocks inside. */
		function blocks (css) {
			var result = [];
			var depth = 0;
			var start = 0;
			var open = -1;
			var i = 0;

			css = css.replace(/\/\*[\s\S]*?\*\//g, '');

			while (i < css.length) {
				if (css.charAt(i) === '{') {
					if (!depth)
						open = i;

					depth++;
				}
				else if (css.charAt(i) === '}') {
					depth--;

					if (!depth) {
						result.push({Prelude: css.substring(start, open).trim(), Body: css.substring(open + 1, i)});

						start = i + 1;
					}
				}

				i++;
			}

			return result;
		}

		/* The rules a <style> of the template holds, the ones of the designer read back, the others kept as they are. */
		function unsheet (css) {
			var result = [];

			function rule (prelude, body, width, raw) {
				var match = /^(?:\[data-scheme='(light|dark)'\]\s+)?(?:\.page-(n\d+)(\s*>\s*\*)?|\.([\w-]+)\s+\.([\w-]+)|\.([\w-]+))(?::(hover|focus-visible|active|disabled))?$/.exec(prelude);
				var props = {};
				var mark;
				var entry;

				if (!match) {
					result.push({ID: 'r' + next++, Raw: raw});

					return;
				}

				body.split(';').forEach(function (declaration) {
					var at = declaration.indexOf(':');
					if (at > 0)
						props[declaration.substring(0, at).trim()] = declaration.substring(at + 1).trim();
				});

				entry = {ID: 'r' + next++, Who: match[2] ? 'node' : match[4] ? 'within' : 'kind', Node: '', Class: match[5] || match[6] || '', Parent: match[4] || '', State: match[7] || '', Width: width, Theme: match[1] || '', Props: props};

				if (match[2]) {
					mark = marks.filter(function (item) {
						return item.Old === match[2] && item.Node;
					})[0];

					if (!mark) {
						result.push({ID: entry.ID, Raw: raw});

						return;
					}

					entry.Node = mark.Node.ID;
				}

				result.push(entry);
			}

			blocks(css).forEach(function (block) {
				var media = /^@media\s*\(max-width:\s*(\d+)px\)$/.exec(block.Prelude);
				var width = '';

				if (media) {
					Object.keys(widths).forEach(function (name) {
						if (widths[name] === Number(media[1]))
							width = name;
					});
				}

				if (block.Prelude.charAt(0) === '@') {
					if (!width) {
						result.push({ID: 'r' + next++, Raw: block.Prelude + ' {' + block.Body.replace(/\s+$/, '') + '\n}'});

						return;
					}

					blocks(block.Body).forEach(function (inner) {
						rule(inner.Prelude, inner.Body, width, block.Prelude + ' {\n\t' + inner.Prelude + ' {' + inner.Body.replace(/\s+$/, '') + '\n\t}\n}');
					});

					return;
				}

				rule(block.Prelude, block.Body, '', block.Prelude + ' {' + block.Body.replace(/\s+$/, '') + '\n}');
			});

			return result;
		}

		/*
		 * Before an import: the classes page-n12 of the elements of a template, taken off them and kept (marks), so the
		 * rules of the elements find the nodes they become.
		 */
		function unmark (content) {
			marks = [];

			Array.prototype.forEach.call(content.querySelectorAll('[class]'), function (element) {
				var names = element.getAttribute('class').split(/\s+/).filter(Boolean);
				var kept = names.filter(function (name) {
					return !/^page-n\d+$/.test(name);
				});
				if (kept.length === names.length) return;

				marks.push({Element: element, Old: names.filter(function (name) {
					return /^page-n\d+$/.test(name);
				})[0].substring(5), Node: null});

				if (kept.length) element.setAttribute('class', kept.join(' '));
				else element.removeAttribute('class');
			});
		}

		/* Reads the meta of the Library once; the callbacks of the calls made meanwhile wait for it. */
		this.Load = function (callback) {
			if (state === 'ready') {
				if (callback)
					callback(null);

				return;
			}

			if (callback)
				waiting.push(callback);

			if (state === 'loading') return;

			state = 'loading';

			Elemenx.Resource.Load(base + '/data/meta.json', function (error, source) {
				var meta = null;
				var calls = waiting;

				waiting = [];

				if (!error) {
					try {
						meta = JSON.parse(source);
					}
					catch (exception) {
						error = exception;
					}
				}

				if (error) {
					state = 'idle';
				}
				else {
					self.Use(meta);
				}

				calls.forEach(function (call) {
					call(error || null);
				});
			});
		};

		/* Takes a meta ({Components, Classes}, as elemenx meta writes it) for the kinds of the palette. */
		this.Use = function (meta) {
			prepare(meta);

			state = 'ready';

			notify();
		};

		/* A value as the source of an expression ({ID: 'a'}), '' for none; Parse reads one back, undefined when it is not a value. */
		this.Literal = function (value) {
			return value === null || value === undefined ? '' : literal(value);
		};

		this.Parse = function (expression) {
			try {
				return new Function('return (' + expression + ');')();
			}
			catch (error) {
				return undefined;
			}
		};

		this.Ready = function () {
			return state === 'ready';
		};

		/* The kinds by group: the slot in a component only, the components of the project in an application only. */
		this.Kinds = function () {
			var groups = self.Groups.slice();
			var shown = kinds.filter(function (kind) {
				if (kind.ID === 'slot')
					return opened().Type === 'component';

				if (kind.ID === 'outlet')
					return opened().Type === 'component' && project.Mode === 'application';

				/* A Component of the files the project has a copy of: the copy is the one shown. */
				if (byID[kind.ID] !== kind) return false;

				return !kind.Project || (project.Mode === 'application' && usable(kind));
			});

			shown.forEach(function (kind) {
				if (kind.Group && groups.indexOf(kind.Group) === -1)
					groups.push(kind.Group);
			});

			return groups.map(function (group) {
				return {ID: group, Kinds: shown.filter(function (kind) {
					return kind.Group === group;
				})};
			}).filter(function (group) {
				return group.Kinds.length > 0;
			});
		};

		this.Kind = function (id) {
			return byID[id] || null;
		};

		/* The name of a kind in the language of the page: a Component by its own name. */
		this.Label = function (id) {
			var kind = byID[id];

			return kind && kind.Component ? kind.ID : Elemenx.Locale.Text('ui.designer.kinds.' + id);
		};

		/* What a kind is, in a sentence: the description of its $Meta, or the phrase of a kind of classes. */
		this.Hint = function (id) {
			var kind = byID[id];
			if (!kind)
				return '';

			return kind.Component ? kind.Description : Elemenx.Locale.Has('ui.designer.hints.' + id) ? Elemenx.Locale.Text('ui.designer.hints.' + id) : '';
		};

		this.GroupLabel = function (group) {
			return Elemenx.Locale.Text('ui.designer.groups.' + group);
		};

		/* The named slots of the parent of a node, where it may go instead of the default slot. */
		this.Slots = function (id) {
			var parent = parentOf(root, id);
			var kind = parent && byID[parent.Kind];

			return kind && kind.Slots ? kind.Slots : [];
		};

		this.Root = function () {
			return root;
		};

		this.Find = function (id) {
			return find(root, id);
		};

		this.Parent = function (id) {
			return parentOf(root, id);
		};

		/* Whether a node may hold children: the root and the containers. */
		this.Container = function (id) {
			var node = find(root, id);

			return !!node && (node.Kind === 'root' || !!(byID[node.Kind] && byID[node.Kind].Container));
		};

		/* Whether id is the node within or one inside it (a node cannot move into itself). */
		this.Within = function (id, within) {
			var node = find(root, within);

			return !!node && !!find(node, id);
		};

		/* The number of the nodes of the document. */
		this.Count = function () {
			var count = 0;

			function walk (node) {
				count += node.Children.length;

				node.Children.forEach(walk);
			}

			walk(root);

			return count;
		};

		this.Select = function (id) {
			id = id && id !== 'root' && find(root, id) ? id : null;

			if (selected === id) return;

			selected = id;

			notify();
		};

		this.Selected = function () {
			return selected;
		};

		this.Insert = function (kind, parent, index) {
			var target = find(root, parent || 'root');
			var node;

			if (!byID[kind] || !target || !this.Container(target.ID) || (byID[kind].Project && !usable(byID[kind]))) return null;

			remember();

			node = create(kind);

			name(node, target);

			target.Children.splice(index === undefined || index < 0 ? target.Children.length : Math.min(index, target.Children.length), 0, node);

			changed();

			return node.ID;
		};

		this.Move = function (id, parent, index) {
			var node = find(root, id);
			var from = parentOf(root, id);
			var target = find(root, parent || 'root');
			var at;

			if (!node || !from || !target || !this.Container(target.ID) || find(node, target.ID)) return false;

			at = from.Children.indexOf(node);

			if (from === target && (index === at || index === at + 1)) return false;

			remember();

			from.Children.splice(at, 1);

			if (from === target && index > at)
				index--;

			target.Children.splice(index === undefined || index < 0 ? target.Children.length : Math.min(index, target.Children.length), 0, node);

			changed();

			return true;
		};

		this.Remove = function (id) {
			var from = parentOf(root, id);
			if (!from)
				return false;

			remember();

			from.Children.splice(from.Children.indexOf(find(root, id)), 1);

			changed();

			return true;
		};

		this.Duplicate = function (id) {
			var node = find(root, id);
			var from = parentOf(root, id);
			var copy;

			if (!node || !from) return null;

			remember();

			copy = renumber(clone(node));

			from.Children.splice(from.Children.indexOf(node) + 1, 0, copy);

			changed();

			return copy.ID;
		};

		/* Keeps a change typed in a row in one step of Undo: the changes of one prop within a moment of each other. */
		function typed (key) {
			var now = Date.now();
			if (typing.Key !== key || now - typing.Time > 1500)
				remember();

			typing.Key = key;
			typing.Time = now;
		}

		/* Sets a prop of a node, its Text with the name Text (for a kind that has text of its own) or its Slot with the name Slot. */
		this.Set = function (id, name, value) {
			var node = find(root, id);
			var own = name === 'Text' && byID[node ? node.Kind : ''] && byID[node.Kind].Text !== undefined;
			if (!node || (own ? node.Text : name === 'Slot' ? node.Slot || '' : node.Props[name]) === value) return;

			typed(id + ' ' + name);

			if (own) node.Text = value;
			else if (name === 'Slot') node.Slot = value;
			else node.Props[name] = value;

			changed();
		};

		/* Sets a property of the layout of a node (one of Layout); an empty value takes it away. */
		this.SetStyle = function (id, property, value) {
			var node = find(root, id);

			value = String(value || '').trim();

			if (!node || node.Kind === 'text' || this.Layout.indexOf(property) === -1 || ((node.Style || {})[property] || '') === value) return;

			typed(id + ' style ' + property);

			node.Style = node.Style || {};

			if (value) node.Style[property] = value;
			else delete node.Style[property];

			changed();
		};

		this.Clear = function () {
			if (!root.Children.length) return;

			remember();

			root.Children = [];

			changed();
		};

		this.CanUndo = function () {
			return past.length > 0;
		};

		this.CanRedo = function () {
			return future.length > 0;
		};

		this.Undo = function () {
			if (!past.length) return;

			typing.Key = '';

			future.push(JSON.stringify(root));

			root = JSON.parse(past.pop());

			changed();
		};

		this.Redo = function () {
			if (!future.length) return;

			typing.Key = '';

			past.push(JSON.stringify(root));

			root = JSON.parse(future.pop());

			changed();
		};

		/*
		 * The document as a template, its rules first in a <style>; for the canvas (canvas true) every node is wrapped and an
		 * empty container says so with the text empty (none without one).
		 */
		function template (canvas, empty) {
			var css = sheet(!!canvas);
			var body = root.Children.map(function (node) {
				return render(node, 0, !!canvas, empty || '');
			}).join('\n');

			return css && body ? css + '\n' + body : css || body;
		}

		/*
		 * On the canvas the components of the project are the Components made of their documents (part); out of it the
		 * texts of a copy of a Component keep their expressions.
		 */
		this.Template = function (canvas, empty) {
			aliasing = !!canvas;

			try {
				return expressed(!canvas && !!opened().Origin, function () {
					return template(canvas, empty);
				});
			}
			finally {
				aliasing = false;
			}
		};

		/* The nodes and the rules of a template, as Import reads it; null when the text holds no element. */
		function parsed (source) {
			var template = document.createElement('template');
			var nodes;
			var elements;
			var styles;
			var read = [];

			/*
			 * HTML reads the name of an element in small letters, and some of them as its own (<Image> as <img>, <Section>
			 * as <section>): a component (a name with a capital) is read under a name of its own, elemenx-c-<name>. A
			 * self-closed element (<Input />) is closed as HTML closes it: <Input></Input>.
			 */
			named = {};

			template.innerHTML = String(source || '').replace(/<(\/?)([A-Z][\w-]*)/g, function (all, slash, tag) {
				named[prefix + tag.toLowerCase()] = tag;

				return '<' + slash + prefix + tag;
			}).replace(/<([A-Za-z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\s*\/>/g, function (all, tag, rest) {
				return /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/.test(tag) ? all : '<' + tag + rest + '></' + tag + '>';
			});
			/* The rules of the page: its <style> at the top; the classes of the rules of the elements, off them. */
			styles = Array.prototype.filter.call(template.content.children, function (element) {
				return element.tagName.toLowerCase() === 'style';
			});

			styles.forEach(function (element) {
				element.parentNode.removeChild(element);
			});

			unmark(template.content);

			nodes = children(template.content);
			elements = nodes.filter(function (node) {
				return node.Kind !== 'text';
			});

			styles.forEach(function (element) {
				read = read.concat(unsheet(element.textContent));
			});

			/* A node made later never takes the class an imported one keeps. */
			marks.forEach(function (item) {
				next = Math.max(next, (Number(item.Old.substring(1)) || 0) + 1);
			});

			marks = [];

			return elements.length ? {Nodes: nodes, Rules: read} : null;
		}

		/* Reads a template into the document, in place of what it held; false when the text holds no element. */
		this.Import = function (source) {
			var result = parsed(source);
			if (!result)
				return false;

			remember();

			root.Children = result.Nodes;
			root.Rules = result.Rules;
			selected = null;

			changed();

			return true;
		};

		/* The rules of CSS of the page (see rules above), and the one of a context: {Who, Node, Class, Parent, State, Width, Theme}. */
		this.Rules = function () {
			return rules();
		};

		this.Rule = function (context) {
			return rules().filter(function (rule) {
				return !rule.Raw && rule.Who === context.Who && (rule.Who === 'node' ? rule.Node === context.Node : rule.Class === context.Class && (rule.Who !== 'within' || rule.Parent === context.Parent)) && (rule.State || '') === (context.State || '') && (rule.Width || '') === (context.Width || '') && (rule.Theme || '') === (context.Theme || '');
			})[0] || null;
		};

		/* Sets a property of the rule of a context (made when it has none); an empty value takes it away, and an empty rule goes. */
		this.SetRule = function (context, property, value) {
			var rule = this.Rule(context);

			property = String(property || '').trim().toLowerCase();
			value = String(value || '').trim().replace(/;+$/, '');

			if (!property || (rule ? (rule.Props[property] || '') === value : !value)) return;

			typed('rule ' + JSON.stringify(context) + ' ' + property);

			if (!rule) {
				rule = {ID: 'r' + next++, Who: context.Who, Node: context.Node || '', Class: context.Class || '', Parent: context.Parent || '', State: context.State || '', Width: context.Width || '', Theme: context.Theme || '', Props: {}};

				rules().push(rule);
			}

			if (value) rule.Props[property] = value;
			else delete rule.Props[property];

			if (!filled(rule))
				root.Rules = rules().filter(function (item) {
					return item !== rule;
				});

			changed();
		};

		/* The class of the element a node makes: its Base, or the first class of Elemenx of its element on a canvas. */
		this.RootClass = function (id) {
			var node = find(root, id);
			var definition = node ? definitionOf(node) : null;
			var element;
			var found = '';

			if (!definition) return '';

			if (definition.Base)
				return definition.Base.split(' ')[0];

			element = document.querySelector('.elemenx-designer-page [data-designer-id="' + id + '"] > *');

			/* A Component in a div of its layout or its rules: the element of the Component is in it. */
			if (element && definition.Component && !/(^|\s)elemenx-/.test(element.className) && element.children.length === 1)
				element = element.children[0];

			Array.prototype.some.call(element ? element.classList : [], function (name) {
				if (/^elemenx-/.test(name) && name.indexOf('elemenx-designer') !== 0)
					found = name;

				return !!found;
			});

			return found;
		};

		/*
		 * The project as it is (a copy): its ID, its mode, its name, its settings, the tabs open, its documents (with the
		 * slots of each), its routes and its guards.
		 */
		this.Project = function () {
			return {
				ID: project.ID,
				Mode: project.Mode,
				Name: project.Name,
				Settings: clone(project.Settings),
				Current: project.Current,
				Tabs: project.Tabs.slice(),
				Documents: project.Documents.map(function (item) {
					return {ID: item.ID, Type: item.Type, Name: item.Name, Title: item.Title || '', Description: item.Description || '', Props: clone(item.Props || []), Slots: slotsOf(treeOf(item)), Outlet: holdsOutlet(treeOf(item)), Origin: item.Origin || ''};
				}),
				Routes: clone(project.Routes),
				Guards: clone(project.Guards)
			};
		};

		this.Opened = function () {
			return project.Current;
		};

		/* The projects kept, the last changed first: [{ID, Name, Mode, Changed, Current}]. */
		this.Projects = function () {
			keep();

			return Object.keys(store.Projects).map(function (id) {
				var entry = store.Projects[id];

				return {ID: id, Name: entry.Name, Mode: entry.Mode, Changed: entry.Changed || 0, Current: id === project.ID};
			}).sort(function (first, second) {
				return second.Changed - first.Changed;
			});
		};

		/*
		 * A new project of a mode, edited at once: a template (one page), a component (one component, its props and slots)
		 * or an application (a page Home on the route /, with its settings). Its ID, or null for a mode that is not one.
		 */
		this.Create = function (mode, name) {
			if (['template', 'component', 'application'].indexOf(mode) === -1) return null;

			keep();

			use(blank(mode, String(name || '').trim()));

			changed();

			return project.ID;
		};

		/* Edits another project kept: the one being edited is kept as it is. False when there is no such project. */
		this.Switch = function (id) {
			if (id === project.ID || !store.Projects[id]) return false;

			keep();

			use(clone(store.Projects[id]));

			changed();

			return true;
		};

		/* Takes a project away for good; the one being edited gives way to the last changed other one, or to a new template. */
		this.RemoveProject = function (id) {
			var others;

			keep();

			if (!store.Projects[id]) return false;

			delete store.Projects[id];

			if (id === project.ID) {
				others = Object.keys(store.Projects).sort(function (first, second) {
					return (store.Projects[second].Changed || 0) - (store.Projects[first].Changed || 0);
				});

				use(others.length ? clone(store.Projects[others[0]]) : blank('template', ''));
			}

			changed();

			return true;
		};

		/* The project being edited as the text of a file (JSON), to keep or to carry to another browser. */
		this.ExportProject = function () {
			keep();

			return JSON.stringify({Elemenx: 'designer-project', Version: 1, Project: store.Projects[project.ID]}, null, '\t');
		};

		/* A project read from the text of a file, kept beside the others under an ID of its own and edited; its ID, or null. */
		this.ImportProject = function (text) {
			var data;

			try {
				data = JSON.parse(String(text || ''));
			}
			catch (error) {
				return null;
			}

			if (!data || data.Elemenx !== 'designer-project' || !valid(data.Project)) return null;

			keep();

			data.Project.ID = identity();

			use(upgrade(data.Project));

			changed();

			return project.ID;
		};

		/*
		 * A new document, page or component (or, in an application, a page gets a route of its own), named name (or by its
		 * number); its ID, or null when the name is taken. It is not opened.
		 */
		this.AddDocument = function (type, name) {
			var number = project.Documents.length + 1;
			var item;

			if (type !== 'page' && type !== 'component') return null;

			if (name === undefined || name === null || name === '') {
				name = type === 'page' ? 'Page ' + number : 'Component' + number;

				while (!free(type, name, null)) {
					number++;

					name = type === 'page' ? 'Page ' + number : 'Component' + number;
				}
			}

			name = String(name).trim();

			if (!free(type, name, null)) return null;

			item = {ID: 'd' + (Math.max.apply(Math, project.Documents.map(function (entry) {
				return Number(String(entry.ID).substring(1)) || 0;
			})) + 1), Type: type, Name: name, Title: type === 'page' ? name : '', Description: '', Props: [], Root: fresh()};

			project.Documents.push(item);

			if (type === 'page' && project.Mode === 'application')
				project.Routes.push({ID: routeID(), Path: routeOf(name), Page: item.ID, Guards: [], Failed: ''});

			changed();

			return item.ID;
		};

		/* The names of the documents that hold a component of the project. */
		this.Used = function (id) {
			var item = documentOf(id);
			if (!item || item.Type !== 'component') return [];

			return project.Documents.filter(function (other) {
				return other.ID !== id && holds(other, item.Name);
			}).map(function (other) {
				return other.Name;
			});
		};

		/*
		 * Removes a document (never the last one, nor a component another one holds), with its tab, its routes and the
		 * settings that name it; the one being edited gives way to another.
		 */
		this.RemoveDocument = function (id) {
			var item = documentOf(id);
			if (!item || project.Documents.length < 2 || this.Used(id).length) return false;

			if (id === project.Current)
				this.Open(project.Tabs.filter(function (tab) {
					return tab !== id;
				})[0] || project.Documents.filter(function (other) {
					return other.ID !== id;
				})[0].ID);

			project.Documents = project.Documents.filter(function (other) {
				return other !== item;
			});
			project.Tabs = project.Tabs.filter(function (tab) {
				return tab !== id;
			});
			project.Routes = project.Routes.filter(function (route) {
				return route.Page !== id;
			});

			project.Routes.forEach(function (route) {
				if (route.Failed === id)
					route.Failed = '';
			});

			['Component', 'NotFound'].forEach(function (key) {
				if (project.Settings[key] === id)
					project.Settings[key] = '';
			});

			delete histories[id];

			changed();

			return true;
		};

		/*
		 * Edits another document, in a tab of its own (one more when it has none): the tree of the one being edited and
		 * its history are kept for when it comes back.
		 */
		this.Open = function (id) {
			var item = documentOf(id);
			if (!item)
				return false;

			if (project.Tabs.indexOf(id) === -1)
				project.Tabs.push(id);

			if (id === project.Current) {
				changed();

				return true;
			}

			histories[project.Current] = {Past: past, Future: future};
			opened().Root = root;
			project.Current = id;
			root = item.Root || fresh();
			past = histories[id] ? histories[id].Past : [];
			future = histories[id] ? histories[id].Future : [];
			typing.Key = '';
			selected = null;

			changed();

			return true;
		};

		/* Closes the tab of a document (never the last one); the one being edited gives way to the tab beside it. */
		this.Close = function (id) {
			var at = project.Tabs.indexOf(id);
			if (at === -1 || project.Tabs.length < 2) return false;

			project.Tabs.splice(at, 1);

			if (id === project.Current) this.Open(project.Tabs[Math.min(at, project.Tabs.length - 1)]);
			else changed();

			return true;
		};

		/*
		 * Sets what a document is: its Name (a component a name of a Component no other kind has: the nodes that hold it
		 * follow), its Title (a page: the title of the window on its routes), its Description and Props (a component).
		 * False when the value is not one.
		 */
		this.SetDocument = function (id, name, value) {
			var item = documentOf(id);
			if (!item || ['Name', 'Title', 'Description', 'Props'].indexOf(name) === -1) return false;

			if (name === 'Name') {
				value = String(value || '').trim();

				if (value === item.Name) return true;

				if (!free(item.Type, value, item.ID)) return false;

				if (item.Type === 'component')
					rename(item.Name, value);
			}
			else if (name === 'Props') {
				value = declare(value);

				if (!value)
					return false;
			}
			else {
				value = String(value || '');
			}

			item[name] = value;

			changed();

			return true;
		};

		/* A new route to a page (its first one by default): its ID, or null without a page or with a path taken. */
		this.AddRoute = function (path, page) {
			var target = documentOf(page) || project.Documents.filter(function (item) {
				return item.Type === 'page';
			})[0];
			var route;

			if (!target || target.Type !== 'page') return null;

			path = path ? normal(path) : routeOf(target.Name);

			if (taken(path, null)) return null;

			route = {ID: routeID(), Path: path, Page: target.ID, Guards: [], Failed: ''};

			project.Routes.push(route);

			changed();

			return route.ID;
		};

		/*
		 * Sets a field of a route: Path (another route's never), Page (a page), Guards (the names of guards of the project,
		 * asked in their order), or Failed (the page shown when a guard refuses, '' for none). False when the value is not one.
		 */
		this.SetRoute = function (id, name, value) {
			var route = project.Routes.filter(function (entry) {
				return entry.ID === id;
			})[0];
			var names = project.Guards.map(function (guard) {
				return guard.Name;
			});

			if (!route)
				return false;

			if (name === 'Path') {
				value = normal(value);

				if (taken(value, id)) return false;
			}
			else if (name === 'Page' || name === 'Failed') {
				if (!(name === 'Failed' && !value) && !(documentOf(value) && documentOf(value).Type === 'page')) return false;
			}
			else if (name === 'Guards') {
				value = (value || []).filter(function (guard, index, list) {
					return names.indexOf(guard) !== -1 && list.indexOf(guard) === index;
				});
			}
			else {
				return false;
			}

			route[name] = value;

			changed();

			return true;
		};

		this.RemoveRoute = function (id) {
			var count = project.Routes.length;

			project.Routes = project.Routes.filter(function (route) {
				return route.ID !== id;
			});

			if (count === project.Routes.length) return false;

			changed();

			return true;
		};

		/*
		 * A new guard of the application, a function that answers whether a route may open: true, false, a path to go to
		 * instead, or this.$Fail(reason). Code is its body; a new one lets every navigation through. Its name, or null
		 * when it is taken.
		 */
		this.AddGuard = function (name) {
			var count = project.Guards.length + 1;

			if (!name) {
				name = 'Guard' + count;

				while (guardOf(name)) {
					count++;

					name = 'Guard' + count;
				}
			}

			if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || guardOf(name)) return null;

			project.Guards.push({Name: name, Description: '', Code: 'return true;'});

			changed();

			return name;
		};

		/* Sets the Name (the routes follow), the Description or the Code of a guard. False when the value is not one. */
		this.SetGuard = function (name, field, value) {
			var guard = guardOf(name);
			if (!guard || ['Name', 'Description', 'Code'].indexOf(field) === -1) return false;

			value = String(value === null || value === undefined ? '' : value);

			if (field === 'Name') {
				value = value.trim();

				if (value === name) return true;

				if (!/^[A-Z][A-Za-z0-9]*$/.test(value) || guardOf(value)) return false;

				project.Routes.forEach(function (route) {
					route.Guards = route.Guards.map(function (entry) {
						return entry === name ? value : entry;
					});
				});
			}

			guard[field] = value;

			changed();

			return true;
		};

		/* Takes a guard away, from the routes too. */
		this.RemoveGuard = function (name) {
			if (!guardOf(name)) return false;

			project.Guards = project.Guards.filter(function (guard) {
				return guard.Name !== name;
			});

			project.Routes.forEach(function (route) {
				route.Guards = route.Guards.filter(function (entry) {
					return entry !== name;
				});
			});

			changed();

			return true;
		};

		/*
		 * Sets a setting of the Application: Name, Title, Description, Icon (the URL of its icon), Language, Theme ('',
		 * light or dark), Router (history, hash or memory), Component (the component of the project that holds the pages:
		 * one with a place for them, '' for none), NotFound (the page of a path no route has, '' for the first page), or the
		 * splash: Splash and SplashSpinner ('true' or ''), SplashMinTime (milliseconds), SplashImage, SplashBackground,
		 * SplashColor, SplashText and SplashHTML, or the PWA: PWA and PWAOffline ('true' or ''), PWADisplay (standalone,
		 * fullscreen, minimal-ui or browser), PWAUpdate (auto, prompt or manual), PWAShortName, PWAIcon and PWATheme.
		 */
		this.SetSetting = function (name, value) {
			var item;

			value = String(value === null || value === undefined ? '' : value).trim();

			if (name === 'Name') {
				if (!value || value === project.Name) return false;

				project.Name = value;
			}
			else if (name === 'Component' || name === 'NotFound') {
				item = value ? documentOf(value) : null;

				if (value && (!item || item.Type !== (name === 'Component' ? 'component' : 'page'))) return false;

				project.Settings[name] = value;
			}
			else if (['Title', 'Description', 'Icon', 'Language', 'Theme', 'Router', 'SplashImage', 'SplashBackground', 'SplashColor', 'SplashText', 'SplashHTML', 'PWAShortName', 'PWAIcon', 'PWATheme'].indexOf(name) !== -1) {
				project.Settings[name] = value;
			}
			else if (name === 'PWADisplay') {
				if (['standalone', 'fullscreen', 'minimal-ui', 'browser'].indexOf(value) === -1) return false;

				project.Settings[name] = value;
			}
			else if (name === 'PWAUpdate') {
				if (['auto', 'prompt', 'manual'].indexOf(value) === -1) return false;

				project.Settings[name] = value;
			}
			else if (name === 'Splash' || name === 'SplashSpinner' || name === 'PWA' || name === 'PWAOffline') {
				project.Settings[name] = value === 'true' ? 'true' : '';
			}
			else if (name === 'SplashMinTime') {
				if (!/^\d+$/.test(value || '0')) return false;

				project.Settings[name] = value || '0';
			}
			else {
				return false;
			}

			changed();

			return true;
		};

		/* The template of a document, as Template() is the one of the document being edited. */
		this.Source = function (id) {
			var item = documentOf(id);
			if (!item)
				return '';

			return expressed(!!item.Origin, function () {
				return within(treeOf(item), function () {
					return template(false, '');
				});
			});
		};

		/*
		 * The map of the pages of an application, in the order of their routes (a page without one last): each with its
		 * paths, its template as the canvas shows it (every node in its wrapper) and the links of its elements to the
		 * other pages, an Href that a route of one of them matches.
		 */
		this.Map = function () {
			var order = project.Routes.map(function (route) {
				return route.Page;
			});

			/* The page of the route a path of a link matches; a part of a route (:id) matches any part, * the rest. */
			function target (href) {
				var path = String(href || '').split(/[?#]/)[0];
				var route;

				if (path.charAt(0) !== '/') return null;

				route = project.Routes.filter(function (each) {
					var pattern = String(each.Path || '').split('/').map(function (part) {
						if (part === '*') return '.*';
						if (part.charAt(0) === ':') return '[^/]+';

						return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					}).join('/');

					return new RegExp('^' + pattern + '/?$').test(path);
				})[0];

				return route ? route.Page : null;
			}

			return project.Documents.filter(function (item) {
				return item.Type === 'page';
			}).sort(function (a, b) {
				var left = order.indexOf(a.ID);
				var right = order.indexOf(b.ID);

				return (left === -1 ? Infinity : left) - (right === -1 ? Infinity : right) || 0;
			}).map(function (item) {
				var tree = treeOf(item);
				var links = [];

				(function walk (node) {
					var page = node.Props ? target(node.Props.Href || node.Props.To) : null;
					if (page && page !== item.ID)
						links.push({Node: node.ID, Page: page});

					(node.Children || []).forEach(walk);
				})(tree);

				return {
					ID: item.ID,
					Name: item.Name,
					Paths: project.Routes.filter(function (route) {
						return route.Page === item.ID;
					}).map(function (route) {
						return route.Path;
					}),
					Template: within(tree, function () {
						aliasing = true;

						try {
							return template(true, '');
						}
						finally {
							aliasing = false;
						}
					}),
					Links: links
				};
			});
		};

		/*
		 * Components of another place, kinds of the palette in the group files beside those of the Library: each as
		 * Elemenx.Meta gives it ({Name, Description, Props, Slots, Container, Events}), with its Template (the text) and
		 * its Definition (the one its file declares), what a copy of it is made of. Extend([]) takes them away.
		 */
		this.Extend = function (components) {
			extra = [].concat(components || []).filter(function (item) {
				return item && /^[A-Z][A-Za-z0-9]*$/.test(item.Name || '');
			});
			disks = {};

			extra.forEach(function (item) {
				disks[item.Name] = {Template: String(item.Template || ''), Definition: item.Definition || null, Meta: item};
			});

			prepare(used);

			notify();
		};

		/*
		 * A Component of the files (Extend) as a component of the project (an application), to edit: its name, its
		 * description and its props, the nodes of its template, and on the canvas the definition it came with. Its ID, the
		 * one of the copy there is when the project has it; null when there is no such Component. It is not opened.
		 */
		this.Copy = function (name) {
			var source = disks[name];
			var item = project.Documents.filter(function (entry) {
				return entry.Type === 'component' && entry.Name === name;
			})[0];
			var read;

			if (item)
				return item.ID;

			if (!source || project.Mode !== 'application') return null;

			read = expressed(true, function () {
				return parsed(source.Template);
			}) || {Nodes: [], Rules: []};

			item = {ID: 'd' + (Math.max.apply(Math, project.Documents.map(function (entry) {
				return Number(String(entry.ID).substring(1)) || 0;
			})) + 1), Type: 'component', Name: name, Title: '', Description: source.Meta.Description || '', Props: (source.Meta.Props || []).map(function (prop) {
				var type = ['bool', 'number', 'text', 'select'].indexOf(prop.Type) !== -1 ? prop.Type : 'json';

				return {Name: prop.Name, Type: type, Default: type === 'json' ? self.Literal(prop.Default) : prop.Default, Options: (prop.Options || []).slice(), Description: prop.Description || ''};
			}), Root: fresh(), Origin: name};

			item.Root.Children = read.Nodes;
			item.Root.Rules = read.Rules;

			project.Documents.push(item);

			changed();

			return item.ID;
		};

		this.OnChange = function (listener) {
			listeners.push(listener);
		};

		this.OffChange = function (listener) {
			var index = listeners.indexOf(listener);
			if (index !== -1)
				listeners.splice(index, 1);
		};

		/*
		 * The projects of another place apart from the others (a project of elemenx design): the keys of the storage end
		 * with :name ('' for the ones of every place), and the projects and the document are read again from there; the
		 * first project of a place with none is an application of that name.
		 */
		this.Scope = function (name) {
			var scope = String(name || '').trim();

			self.StorageKey = keys.Storage + (scope ? ':' + scope : '');
			self.ProjectKey = keys.Project + (scope ? ':' + scope : '');
			self.ProjectsKey = keys.Projects + (scope ? ':' + scope : '');

			restore(scope);

			refresh();

			notify();
		};

		/* The projects and the document as they were left: the document is the one of the project being edited. */
		function restore (scope) {
			try {
				store = JSON.parse(window.localStorage.getItem(self.ProjectsKey) || 'null');

				/* A project kept before there were several: it becomes the first of them. */
				if (!store && window.localStorage.getItem(self.ProjectKey)) {
					old = upgrade(JSON.parse(window.localStorage.getItem(self.ProjectKey)));
					old.ID = old.ID || identity();
					store = {Current: old.ID, Projects: {}};
					store.Projects[old.ID] = old;
				}

				if (!store || !store.Projects || !valid(store.Projects[store.Current]))
					throw new Error('Elemenx designer projects are not there');

				project = upgrade(clone(store.Projects[store.Current]));
				root = window.localStorage.getItem(self.StorageKey) ? JSON.parse(window.localStorage.getItem(self.StorageKey)) : opened() && opened().Root || fresh();
			}
			catch (error) {
				store = {Current: '', Projects: {}};
				project = scope ? blank('application', scope) : blank('template', '');
				root = fresh();
			}

			if (!opened())
				project.Current = project.Documents[0].ID;

			opened().Root = root;
			histories = {};
			past = [];
			future = [];
			selected = null;

			project.Documents.forEach(function (item) {
				next = Math.max(next, highest(treeOf(item)) + 1);
			});
		}

		restore('');

		prepare(null);
	}
});
