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
		'terminal', 'code', 'branch', 'commit', 'merge', 'play', 'pause', 'stop', 'debug', 'database', 'server', 'cloud', 'layout', 'panel-left', 'panel-right', 'panel-bottom', 'columns', 'list', 'grid', 'tree', 'structure'
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
	}
});