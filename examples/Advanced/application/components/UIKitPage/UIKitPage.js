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
		'pack.zip', 'pack.rar', 'pack.ar', 'pack.tar', 'pack.tar.gz', 'app.jar', 'model.3mf', 'song.mp3', 'clip.mp4', 'clip.webm', 'clip.avi', 'voice.aac', 'film.ac3', 'unknown.xyz'
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
		{ID: 2, Author: 'Grace Hopper', Text: 'Can you check the new table?', Time: '10:02', Grouped: true},
		{ID: 3, Author: 'Me', Text: 'Looks good, merging it now.', Time: '10:05', Own: true, Status: 'read'}
	],

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
		this.Move(event.detail.Data, 'Done', 'Todo');
	},

	DropDone: function (event) {
		this.Move(event.detail.Data, 'Todo', 'Done');
	},

	Move: function (item, from, to) {
		if (!item || this[to].some(function (entry) {
			return entry.ID === item.ID;
		})) return;

		this[from] = this[from].filter(function (entry) {
			return entry.ID !== item.ID;
		});
		this[to] = this[to].concat([{ID: item.ID, Title: item.Title}]);
		this.Dropped = item.Title + ' → ' + to;
	},

	DropFiles: function (event) {
		this.Dropped = event.detail.Kind === 'files' ? event.detail.Files.length + ' file(s) from outside' : 'text: ' + event.detail.Text.slice(0, 32);
	},

	SendMessage: function (text) {
		this.Messages = this.Messages.concat([{ID: this.Messages.length + 1, Author: 'Me', Text: text, Time: 'now', Own: true, Status: 'sent'}]);
	}
});