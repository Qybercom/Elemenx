Elemenx.Component('UIKitPage', {
	$TemplateURL: 'UIKitPage.html',
	$StyleURL: 'UIKitPage.css',
	$Title: 'UI Kit - Elemenx',
	Icons: [
		'add', 'remove', 'close', 'check', 'edit', 'delete', 'save', 'copy', 'paste', 'search', 'filter', 'sort', 'refresh', 'undo', 'redo', 'settings', 'sliders', 'more', 'more-vertical', 'link', 'external', 'download', 'upload', 'send', 'share', 'eye', 'eye-off', 'lock', 'unlock', 'pin', 'star', 'heart', 'bookmark', 'zoom-in', 'zoom-out', 'maximize', 'minimize', 'grip', 'login', 'logout',
		'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'chevrons-up-down', 'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'menu', 'home',
		'file', 'file-text', 'file-code', 'folder', 'folder-open', 'image', 'attachment', 'archive',
		'info', 'success', 'warning', 'error', 'help', 'bell', 'loader',
		'calendar', 'clock', 'history', 'user', 'users', 'mail', 'phone', 'credit-card', 'cart', 'globe', 'map-pin', 'tag', 'color', 'sun', 'moon', 'monitor',
		'terminal', 'code', 'branch', 'commit', 'merge', 'play', 'pause', 'stop', 'debug', 'database', 'server', 'cloud', 'layout', 'panel-left', 'panel-right', 'panel-bottom', 'columns', 'list', 'grid', 'tree', 'structure',
		'sort-ascending', 'sort-descending'
	],
	LayoutIcons: [
		'align-left', 'align-center-horizontal', 'align-right', 'align-stretch-horizontal', 'align-top', 'align-center-vertical', 'align-bottom', 'align-stretch-vertical',
		'position-top-left', 'position-top', 'position-top-right', 'position-left', 'position-center', 'position-right', 'position-bottom-left', 'position-bottom', 'position-bottom-right',
		'fit-stretch-horizontal', 'fit-stretch-vertical', 'fit-stretch', 'fit-contain', 'fit-cover'
	],
	Files: [
		'index.php', 'app.js', 'View.jsx', 'main.cpp', 'main.hpp', 'main.c', 'main.h', 'style.css', 'script.py', 'App.java', 'App.kt', 'ledger.cbl', 'lib.rs', 'app.ts', 'View.tsx', 'main.go',
		'setup.exe', 'core.lib', 'libz.a', 'main.o', 'core.dll', 'photo.jpg', 'logo.png', 'icon.svg', 'cover.webp', 'favicon.ico', 'report.pdf', 'poster.psd', 'logo.ai', 'scan.tiff', 'loop.gif',
		'data.json', 'events.jsonl', 'table.csv', 'feed.xml', 'index.html', 'config.yaml', 'php.ini', 'app.properties', '.htaccess', 'nginx.conf', 'Shortcut.lnk',
		'letter.doc', 'letter.docx', 'sheet.xls', 'sheet.xlsx', 'slides.ppt', 'slides.pptx', 'notes.txt', 'README.md', 'Dockerfile',
		'pack.zip', 'pack.rar', 'pack.ar', 'pack.tar', 'pack.tar.gz', 'app.jar', 'model.3mf', 'song.mp3', 'clip.mp4', 'clip.webm', 'clip.avi', 'voice.aac', 'film.ac3',
		'file.rb', 'file.swift', 'file.scala', 'file.dart', 'file.lua', 'file.pl', 'file.r', 'file.sql', 'file.sh', 'file.bat', 'file.ps1', 'file.cs', 'file.vb', 'file.fs', 'file.m', 'file.vue',
		'file.svelte', 'file.scss', 'file.sass', 'file.less', 'file.erl', 'file.ex', 'file.hs', 'file.clj', 'file.zig', 'file.asm', 'file.wasm', 'file.toml', '.env', 'yarn.lock', 'file.log', 'file.gradle',
		'Makefile', 'CMakeLists.txt', 'file.proto', 'file.graphql', '.editorconfig', '.gitignore', 'file.7z', 'file.bz2', 'file.xz', 'file.gz', 'file.apk', 'file.ipa', 'file.dmg', 'file.iso', 'file.deb', 'file.rpm',
		'file.msi', 'file.bin', 'file.img', 'file.so', 'file.dylib', 'file.class', 'file.odt', 'file.ods', 'file.odp', 'file.rtf', 'file.epub', 'file.pages', 'file.numbers', 'file.key', 'file.tex', 'file.ics',
		'file.vcf', 'file.eml', 'file.jpeg', 'file.heic', 'file.avif', 'file.bmp', 'file.raw', 'file.eps', 'file.fig', 'file.sketch', 'file.xd', 'file.blend', 'file.fbx', 'file.obj', 'file.stl', 'file.glb',
		'file.gltf', 'file.ttf', 'file.otf', 'file.woff', 'file.woff2', 'file.flac', 'file.wav', 'file.ogg', 'file.m4a', 'file.opus', 'file.mid', 'file.mkv', 'file.mov', 'file.wmv', 'file.flv', 'file.srt',
		'file.vtt', 'file.tsv', 'file.parquet', 'file.db', 'file.sqlite', 'file.ipynb', 'file.xlsm', 'file.xsd', 'file.pem', 'file.crt', 'file.p12', 'file.pub',
		'unknown.xyz'
	],
	Text: 'Elemenx',
	Clicks: 0,
	Amount: 42,
	Color: '#4b443d',
	Date: '2024-11-22',
	Time: '09:30',
	Card: '',
	CardState: '',
	Phone: '+79991234567',
	PhoneState: '',
	Agree: true,
	Notifications: true,
	Plan: 'team',
	Plans: [
		{Value: 'free', Label: 'Free', Description: 'For personal projects.'},
		{Value: 'team', Label: 'Team', Description: 'Shared workspaces and roles.'},
		{Value: 'enterprise', Label: 'Enterprise', Description: 'SSO and audit log.', Disabled: true}
	],
	View: 'list',
	Views: [
		{Value: 'list', Label: 'List'},
		{Value: 'grid', Label: 'Grid'},
		{Value: 'tree', Label: 'Tree'}
	],
	Language: 'js',
	Languages: [
		{Value: 'js', Label: 'JavaScript', Icon: 'file-code', Hint: '.js', Group: 'Web'},
		{Value: 'css', Label: 'CSS', Icon: 'file-code', Hint: '.css', Group: 'Web'},
		{Value: 'html', Label: 'HTML', Icon: 'file-code', Hint: '.html', Group: 'Web'},
		{Value: 'java', Label: 'Java', Icon: 'file-code', Hint: '.java', Group: 'JVM'},
		{Value: 'kotlin', Label: 'Kotlin', Icon: 'file-code', Hint: '.kt', Group: 'JVM'},
		{Value: 'cobol', Label: 'COBOL', Icon: 'file-code', Hint: '.cbl', Group: 'Legacy', Disabled: true}
	],
	Tags: ['bug', 'ui'],
	TagOptions: [
		{Value: 'bug', Label: 'Bug'},
		{Value: 'feature', Label: 'Feature'},
		{Value: 'ui', Label: 'UI'},
		{Value: 'docs', Label: 'Documentation'},
		{Value: 'perf', Label: 'Performance'},
		{Value: 'security', Label: 'Security'}
	],
	MenuItems: [
		{ID: 'new', Label: 'New', Icon: 'add', Items: [
			{ID: 'new-file', Label: 'File', Icon: 'file', Shortcut: 'Ctrl+N'},
			{ID: 'new-folder', Label: 'Folder', Icon: 'folder'},
			{Separator: true},
			{ID: 'new-from', Label: 'From template', Items: [
				{ID: 'tpl-component', Label: 'Component'},
				{ID: 'tpl-service', Label: 'Service'}
			]}
		]},
		{ID: 'open', Label: 'Open…', Icon: 'folder-open', Shortcut: 'Ctrl+O'},
		{ID: 'save', Label: 'Save', Icon: 'save', Shortcut: 'Ctrl+S'},
		{Separator: true},
		{Group: 'View'},
		{ID: 'wrap', Label: 'Soft wrap', Checked: true},
		{ID: 'minimap', Label: 'Minimap', Disabled: true},
		{Separator: true},
		{ID: 'delete', Label: 'Delete project', Icon: 'delete', Danger: true}
	],
	MenuChoice: '',
	Tab: 'app',
	EditorTabs: [
		{ID: 'app', Label: 'app.js', Icon: 'file-code', Closable: true},
		{ID: 'index', Label: 'index.html', Icon: 'file-code', Closable: true},
		{ID: 'readme', Label: 'README.md', Icon: 'file-text', Closable: true}
	],
	WorkspaceTab: 'app',
	WorkspaceTabs: [
		{ID: 'app', Label: 'app.js', Icon: 'file-code', Closable: true},
		{ID: 'index', Label: 'index.html', Icon: 'file-code', Closable: true},
		{ID: 'readme', Label: 'README.md', Icon: 'file-text', Closable: true}
	],
	Section: 'general',
	SectionTabs: [
		{ID: 'general', Label: 'General'},
		{ID: 'members', Label: 'Members', Badge: 4},
		{ID: 'billing', Label: 'Billing'},
		{ID: 'archived', Label: 'Archived', Disabled: true}
	],
	FileCount: 0,
	LeftOpen: true,
	BottomOpen: true,
	RightOpen: false,
	Collapsed: false,
	Price: 1250.5,
	Money: 'USD 1250.5',
	Volume: 40,
	Budget: [200, 800],
	DialogOpen: false,
	DialogResult: '',
	Columns: [
		{Key: 'Name', Title: 'Name', Sortable: true, Width: '32%'},
		{Key: 'Role', Title: 'Role', Sortable: true},
		{Key: 'Commits', Title: 'Commits', Sortable: true, Align: 'right'},
		{Key: 'Joined', Title: 'Joined', Sortable: true}
	],
	People: [
		{ID: 1, Name: 'Ada Lovelace', Role: 'Maintainer', Commits: 1280, Joined: '2019-03-14'},
		{ID: 2, Name: 'Alan Turing', Role: 'Reviewer', Commits: 642, Joined: '2020-06-23'},
		{ID: 3, Name: 'Grace Hopper', Role: 'Maintainer', Commits: 2048, Joined: '2018-12-09'},
		{ID: 4, Name: 'Linus Torvalds', Role: 'Contributor', Commits: 96, Joined: '2023-01-05'},
		{ID: 5, Name: 'Margaret Hamilton', Role: 'Reviewer', Commits: 517, Joined: '2021-08-17'}
	],
	Selected: [3],
	Activated: '',
	Todo: [
		{ID: 'a', Title: 'Design tokens'},
		{ID: 'b', Title: 'Table component'},
		{ID: 'c', Title: 'Chat layout'}
	],
	Done: [
		{ID: 'd', Title: 'Icons'}
	],
	Dropped: '',
	Messages: [
		{ID: 1, Author: 'Grace Hopper', Text: 'The build is green again.', Time: '10:02'},
		{ID: 2, Author: 'Grace Hopper', Text: 'Can you check the new table?', Time: '10:02'},
		{ID: 3, Author: 'Grace Hopper', Text: 'The sorting looks right to me.', Time: '10:03'},
		{ID: 4, Author: 'Me', Text: 'Looks good, merging it now.', Time: '10:05', Own: true, Status: 'read'}
	],
	StepItems: [
		{ID: 'plan', Label: 'Plan', Description: 'Scope and design', Icon: 'edit'},
		{ID: 'build', Label: 'Build', Description: 'Code and tests', Icon: 'code'},
		{ID: 'review', Label: 'Review', Description: 'Two approvals', Icon: 'users'},
		{ID: 'deploy', Label: 'Deploy', Description: 'Staging, then production', Icon: 'cloud'}
	],
	ActiveSteps: ['build', 'review'],
	DoneSteps: ['plan'],
	Activity: [
		{ID: 1, Icon: 'branch', Author: 'Ada Lovelace', Action: 'opened the merge request', Time: '2 days ago'},
		{ID: 2, Icon: 'commit', Author: 'Ada Lovelace', Action: 'added 3 commits', Time: '1 day ago', Variant: 'info'},
		{ID: 6, Size: 'small', Author: 'Ada Lovelace', Action: 'added the label ui-kit', Time: '1 day ago'},
		{ID: 7, Size: 'small', Icon: 'user', Author: 'Ada Lovelace', Action: 'requested a review from Grace Hopper', Time: '1 day ago'},
		{ID: 3, Icon: 'edit', Author: 'Grace Hopper', Action: 'commented', Time: '20 hours ago', Text: 'The table should keep its header while scrolling.'},
		{ID: 8, Size: 'small', Variant: 'success', Author: 'CI', Action: 'pipeline passed', Time: '4 hours ago'},
		{ID: 4, Icon: 'check', Author: 'Alan Turing', Action: 'approved this merge request', Time: '3 hours ago', Variant: 'success'},
		{ID: 5, Icon: 'merge', Author: 'Ada Lovelace', Action: 'merged into main', Time: 'just now', Variant: 'accent'}
	],
	Lines: [
		{ID: 1, Kind: 'info', Text: 'Elemenx terminal. Type help.'}
	],
	Busy: false,
	WorkspaceLines: [
		{ID: 2, Kind: 'input', Text: 'npm test'},
		{ID: 3, Kind: 'success', Text: 'Test Files  52 passed (52)'}
	],
	WorkspaceBusy: false,
	LineCount: 3,
	TileGroups: [
		{ID: 'work', Title: 'Work', Tiles: [
			{ID: 'mail', Title: 'Mail', Icon: 'mail', Size: 'wide', Text: '3 unread', Badge: 3, Color: '#2b5797'},
			{ID: 'calendar', Title: 'Calendar', Icon: 'calendar', Size: 'medium', Color: '#7a4fb0'},
			{ID: 'tasks', Title: 'Tasks', Icon: 'check', Size: 'medium', Color: '#3d7a54'},
			{ID: 'chat', Title: 'Chat', Icon: 'send', Size: 'small', Color: '#c2477f'},
			{ID: 'phone', Title: 'Phone', Icon: 'phone', Size: 'small', Color: '#0f8fae'}
		]},
		{ID: 'tools', Title: 'Tools', Tiles: [
			{ID: 'terminal', Title: 'Terminal', Icon: 'terminal', Size: 'medium'},
			{ID: 'settings', Title: 'Settings', Icon: 'settings', Size: 'small', Color: '#5f5a54'},
			{ID: 'database', Title: 'Database', Icon: 'database', Size: 'small', Color: '#2f8f83'},
			{ID: 'cloud', Title: 'Deployments', Icon: 'cloud', Size: 'large', Text: 'All 12 services are healthy.', Color: '#3f6c9e'}
		]}
	],
	OpenedTile: '',
	DashboardNav: [
		{ID: 'overview', Label: 'Overview', Icon: 'home'},
		{ID: 'projects', Label: 'Projects', Icon: 'folder', Badge: 12},
		{ID: 'builds', Label: 'Builds', Icon: 'play'},
		{ID: 'people', Label: 'People', Icon: 'users'},
		{ID: 'settings', Label: 'Settings', Icon: 'settings'}
	],
	DashboardPage: 'overview',
	NavCollapsed: false,
	SettingsNav: [
		{ID: 'appearance', Label: 'Appearance', Icon: 'monitor'},
		{ID: 'editor', Label: 'Editor', Icon: 'code', Items: [
			{ID: 'general', Label: 'General'},
			{ID: 'font', Label: 'Font'},
			{ID: 'scheme', Label: 'Color Scheme'}
		]},
		{ID: 'plugins', Label: 'Plugins', Icon: 'grid'},
		{ID: 'vcs', Label: 'Version Control', Icon: 'branch', Items: [
			{ID: 'git', Label: 'Git'},
			{ID: 'commit', Label: 'Commit'}
		]}
	],
	SettingsPage: 'general',
	SettingsPath: ['Editor', 'General'],
	PersonID: null,
	PersonName: '',
	PersonCommits: 0,

	Clicked: function () {
		this.Clicks++;
	},

	TextChanged: function (value) {
		this.Text = value;
	},

	AmountChanged: function (value) {
		this.Amount = value;
	},

	ColorChanged: function (value) {
		this.Color = value;
	},

	DateChanged: function (value) {
		this.Date = value;
	},

	TimeChanged: function (value) {
		this.Time = value;
	},

	CardValidated: function (state) {
		this.Card = state.Value;
		this.CardState = state.Brand + (state.Complete ? (state.Valid ? ' · valid' : ' · invalid') : '');
	},

	PhoneChanged: function (value) {
		this.Phone = value;
	},

	PhoneValidated: function (state) {
		this.PhoneState = state.Country + (state.Complete ? ' · complete' : '');
	},

	AgreeChanged: function (value) {
		this.Agree = value;
	},

	PlanChanged: function (value) {
		this.Plan = value;
	},

	ViewChanged: function (value) {
		this.View = value;
	},

	LanguageChanged: function (value) {
		this.Language = value;
	},

	TagsChanged: function (value) {
		this.Tags = value;
	},

	MenuSelected: function (item) {
		this.MenuChoice = item.ID;
	},

	TabChanged: function (id) {
		this.Tab = id;
	},

	TabClosed: function (id) {
		var tabs = this.EditorTabs.filter(function (tab) {
			return tab.ID !== id;
		});

		this.EditorTabs = tabs;

		if (this.Tab === id)
			this.Tab = tabs.length ? tabs[0].ID : null;
	},

	WorkspaceTabChanged: function (id) {
		this.WorkspaceTab = id;
	},

	WorkspaceTabClosed: function (id) {
		var tabs = this.WorkspaceTabs.filter(function (tab) {
			return tab.ID !== id;
		});

		this.WorkspaceTabs = tabs;

		if (this.WorkspaceTab === id)
			this.WorkspaceTab = tabs.length ? tabs[0].ID : null;
	},

	SectionChanged: function (id) {
		this.Section = id;
	},

	FilesChanged: function (files) {
		this.FileCount = files.length;
	},

	ToggleLeft: function () {
		this.LeftOpen = !this.LeftOpen;
	},

	ToggleBottom: function () {
		this.BottomOpen = !this.BottomOpen;
	},

	ToggleRight: function () {
		this.RightOpen = !this.RightOpen;
	},

	SectionToggled: function (collapsed) {
		this.Collapsed = collapsed;
	},

	MoneyChanged: function (value) {
		this.Money = value.Currency + ' ' + value.Amount;
	},

	VolumeChanged: function (value) {
		this.Volume = value;
	},

	BudgetChanged: function (value) {
		this.Budget = value;
	},

	OpenDialog: function () {
		this.DialogOpen = true;
	},

	CloseDialog: function (reason) {
		this.DialogOpen = false;
		this.DialogResult = typeof reason === 'string' ? reason : 'close';
	},

	ConfirmDialog: function () {
		this.DialogOpen = false;
		this.DialogResult = 'confirmed';

		this.$Service('Toast').Show({Title: 'Saved', Message: 'The project settings were saved.', Variant: 'success'});
	},

	ShowSticky: function () {
		this.$Service('Toast').Show({Title: 'Stays until closed', Message: 'AutoHide: false keeps this toast.', AutoHide: false, Variant: 'warning'});
	},

	ShowCustom: function () {
		this.$Service('Toast').Show({
			Title: 'Uploading 3 files',
			Icon: 'upload',
			Class: 'ui-kit-upload-toast',
			Duration: 8000,
			Actions: [{Label: 'Open folder', Variant: 'primary'}, {Label: 'Cancel'}],
			Render: function (container) {
				var bar = document.createElement('div');
				var fill = document.createElement('div');

				bar.className = 'ui-kit-toast-bar';
				fill.className = 'ui-kit-toast-fill';

				bar.appendChild(fill);
				container.appendChild(bar);
			}
		});
	},

	ShowToast: function () {
		var toast = this.$Service('Toast');

		toast.Show({Title: 'Build failed', Message: '2 tests failed in ui-kit.spec.js.', Variant: 'danger', Duration: 0, Action: {Label: 'Retry', Run: function () {
			toast.Show({Message: 'Retrying…', Variant: 'info'});
		}}});
	},

	PeopleSelected: function (keys) {
		this.Selected = keys;
	},

	PersonActivated: function (row) {
		this.Activated = row.Name;
	},

	DropTodo: function (event) {
		this.Move(event.detail.Data, 'Todo', event.detail.Index);
	},

	DropDone: function (event) {
		this.Move(event.detail.Data, 'Done', event.detail.Index);
	},

	/* Moves item to the place index of the list named to, from whichever list holds it (also within one list). */
	Move: function (item, to, index) {
		var others = function (entry) {
			return entry.ID !== item.ID;
		};
		var target;
		var at;

		if (!item) return;

		this.Todo = this.Todo.filter(others);
		this.Done = this.Done.filter(others);

		target = this[to].slice();
		at = index < 0 ? target.length : Math.min(index, target.length);

		target.splice(at, 0, {ID: item.ID, Title: item.Title});

		this[to] = target;
		this.Dropped = item.Title + ' → ' + to + ' #' + (at + 1);
	},

	DropFiles: function (event) {
		this.Dropped = event.detail.Kind === 'files' ? event.detail.Files.length + ' file(s) from outside' : 'text: ' + event.detail.Text.slice(0, 32);
	},

	SendMessage: function (text) {
		this.Messages = this.Messages.concat([{ID: this.Messages.length + 1, Author: 'Me', Text: text, Time: 'now', Own: true, Status: 'sent'}]);
	},

	$OnCreate: function () {
		/* The position of every message in its run of messages from one author. */
		this.Thread = function (messages) {
			return messages.map(function (message, index) {
				var before = messages[index - 1];
				var after = messages[index + 1];
				var joinsBefore = !!before && before.Author === message.Author;
				var joinsAfter = !!after && after.Author === message.Author;
				var copy = {};
				var key;

				for (key in message) {
					if (Object.prototype.hasOwnProperty.call(message, key))
						copy[key] = message[key];
				}

				copy.Position = joinsBefore ? (joinsAfter ? 'middle' : 'last') : (joinsAfter ? 'first' : 'single');

				return copy;
			});
		};
	},

	StepSelected: function (item) {
		var order = this.StepItems.map(function (step) {
			return step.ID;
		});
		var index = order.indexOf(item.ID);

		this.DoneSteps = order.slice(0, index);
		this.ActiveSteps = [item.ID];
	},

	/* Adds a line to the terminal whose lines are in the value named target. */
	Say: function (target, kind, text) {
		this.LineCount++;
		this[target] = this[target].concat([{ID: this.LineCount, Kind: kind, Text: text}]);
	},

	/* Each terminal keeps its own lines and busy state: target and busy name them. */
	Execute: function (target, busy, command) {
		var self = this;
		var text = command.trim();

		this.Say(target, 'input', command);

		if (text === 'help') {
			this.Say(target, 'output', 'help   show this help\ndate   print the date\nclear  clear the screen');
		}
		else if (text === 'date') {
			this.Say(target, 'success', new Date().toString());
		}
		else if (text === 'clear') {
			this[target] = [];
		}
		else if (text) {
			this[busy] = true;

			window.setTimeout(function () {
				self[busy] = false;

				self.Say(target, 'error', text.split(' ')[0] + ': command not found');
			}, 400);
		}
	},

	RunCommand: function (command) {
		this.Execute('Lines', 'Busy', command);
	},

	ClearTerminal: function () {
		this.Lines = [];
	},

	RunWorkspaceCommand: function (command) {
		this.Execute('WorkspaceLines', 'WorkspaceBusy', command);
	},

	ClearWorkspaceTerminal: function () {
		this.WorkspaceLines = [];
	},

	TileOpened: function (tile) {
		this.OpenedTile = tile.Title;
	},

	TilesChanged: function (groups) {
		this.TileGroups = groups;
	},

	DashboardSelected: function (item) {
		this.DashboardPage = item.ID;
	},

	ToggleNav: function () {
		this.NavCollapsed = !this.NavCollapsed;
	},

	SettingsSelected: function (item) {
		var parent = this.SettingsNav.filter(function (entry) {
			return (entry.Items || []).some(function (child) {
				return child.ID === item.ID;
			});
		})[0];

		this.SettingsPage = item.ID;
		this.SettingsPath = parent ? [parent.Label, item.Label] : [item.Label];
	},

	PickPerson: function (event, node) {
		var id = Number(node.getAttribute('data-id'));
		var person = this.People.filter(function (entry) {
			return entry.ID === id;
		})[0];

		this.PersonID = id;
		this.PersonName = person.Name;
		this.PersonCommits = person.Commits;
	},

	ClearPerson: function () {
		this.PersonID = null;
	}
});