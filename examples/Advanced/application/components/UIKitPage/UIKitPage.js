Elemenx.Component('UIKitPage', {
	$TemplateURL: 'UIKitPage.html',
	$StyleURL: 'UIKitPage.css',
	$Title: 'UI Kit - Elemenx',
	Icons: [
		'add', 'remove', 'close', 'check', 'edit', 'delete', 'backspace', 'pip', 'save', 'copy', 'paste', 'search', 'filter', 'sort', 'refresh', 'undo', 'redo', 'settings', 'sliders', 'more', 'more-vertical', 'link', 'external', 'download', 'upload', 'send', 'share', 'eye', 'eye-off', 'lock', 'unlock', 'pin', 'star', 'heart', 'bookmark', 'zoom-in', 'zoom-out', 'maximize', 'minimize', 'window-minimize', 'window-maximize', 'window-restore', 'grip', 'login', 'logout',
		'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'chevrons-left', 'chevrons-right', 'chevrons-up-down', 'page-first', 'page-last', 'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'menu', 'home',
		'file', 'file-text', 'file-code', 'folder', 'folder-open', 'image', 'attachment', 'archive',
		'info', 'success', 'warning', 'error', 'help', 'bell', 'loader',
		'calendar', 'clock', 'history', 'user', 'users', 'mail', 'phone', 'credit-card', 'cart', 'globe', 'map-pin', 'tag', 'color', 'sun', 'moon', 'monitor',
		'terminal', 'code', 'branch', 'commit', 'merge', 'play', 'pause', 'stop', 'debug', 'database', 'server', 'cloud', 'layout', 'panel-left', 'panel-right', 'panel-bottom', 'columns', 'list', 'grid', 'tree', 'structure',
		'sort-ascending', 'sort-descending',
		'justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly', 'align-baseline', 'flex-wrap', 'smartphone', 'tablet',
		'pointer', 'square', 'circle', 'line', 'arrow-line', 'freehand', 'brush', 'eraser', 'type', 'layers', 'group', 'ungroup'
	],
	MediaIcons: [
		'mic', 'mic-off', 'video', 'video-off', 'camera', 'camera-off', 'volume', 'volume-low', 'volume-high', 'volume-off', 'speaker', 'speaker-off', 'headphones', 'headphones-off',
		'screen-share', 'screen-share-off', 'call-end', 'record', 'hand',
		'smile', 'laugh', 'wink', 'neutral', 'sad', 'reaction', 'sticker'
	],
	ThemeOptions: [],
	ThemeName: 'default',
	ThemePolicy: 'system',
	ThemeScheme: 'light',
	ThemeSchemes: [
		{Value: 'system', Label: 'System', Icon: 'monitor'},
		{Value: 'light', Label: 'Light', Icon: 'sun'},
		{Value: 'dark', Label: 'Dark', Icon: 'moon'}
	],
	MineAccent: '#0b6e99',
	MineBackground: '#eef4f7',
	MineRadius: 6,
	MineControl: 36,
	RibbonTab: 'home',
	RibbonCollapsed: false,
	RibbonNote: '',
	TableSelected: false,
	Bold: false,
	Font: 'segoe',
	Fonts: [
		{Value: 'segoe', Label: 'Segoe UI'},
		{Value: 'inter', Label: 'Inter'},
		{Value: 'georgia', Label: 'Georgia'},
		{Value: 'consolas', Label: 'Consolas'}
	],
	FontSize: '11',
	FontSizes: [
		{Value: '9', Label: '9'},
		{Value: '11', Label: '11'},
		{Value: '14', Label: '14'},
		{Value: '18', Label: '18'},
		{Value: '24', Label: '24'}
	],
	PasteItems: [
		{ID: 'paste-keep', Label: 'Keep source formatting', Icon: 'paste'},
		{ID: 'paste-text', Label: 'Keep text only', Icon: 'file-text'},
		{Separator: true},
		{ID: 'paste-special', Label: 'Paste special…', Shortcut: 'Ctrl+Alt+V'}
	],
	HighlightItems: [
		{ID: 'yellow', Label: 'Yellow'},
		{ID: 'green', Label: 'Green'},
		{ID: 'blue', Label: 'Blue'},
		{Separator: true},
		{ID: 'none', Label: 'No color'}
	],
	SelectItems: [
		{ID: 'select-all', Label: 'Select all', Shortcut: 'Ctrl+A'},
		{ID: 'select-objects', Label: 'Select objects'}
	],
	TableItems: [
		{ID: 'table-insert', Label: 'Insert table…', Icon: 'table'},
		{ID: 'table-draw', Label: 'Draw table', Icon: 'edit'},
		{ID: 'table-convert', Label: 'Convert text to table…'}
	],
	DictateItems: [
		{ID: 'dictate-english', Label: 'English'},
		{ID: 'dictate-russian', Label: 'Russian'}
	],
	DeleteTableItems: [
		{ID: 'delete-rows', Label: 'Delete rows'},
		{ID: 'delete-columns', Label: 'Delete columns'},
		{ID: 'delete-whole', Label: 'Delete table', Danger: true}
	],
	TextStyle: 'normal',
	TextStyles: [
		{ID: 'normal', Label: 'Normal', Preview: 'AaBbCc'},
		{ID: 'no-spacing', Label: 'No spacing', Preview: 'AaBbCc'},
		{ID: 'heading-1', Label: 'Heading 1', Preview: 'AaBb', Style: 'font-size: 16px; font-weight: 600; color: var(--elemenx-info)'},
		{ID: 'heading-2', Label: 'Heading 2', Preview: 'AaBbC', Style: 'font-size: 14px; font-weight: 600; color: var(--elemenx-info)'},
		{ID: 'title', Label: 'Title', Preview: 'Aa', Style: 'font-size: 20px'},
		{ID: 'subtitle', Label: 'Subtitle', Preview: 'AaBbC', Style: 'color: var(--elemenx-text-muted)'},
		{ID: 'quote', Label: 'Quote', Preview: 'AaBbC', Style: 'font-style: italic'},
		{ID: 'strong', Label: 'Strong', Preview: 'AaBbC', Style: 'font-weight: 700'}
	],
	TableStyles: [
		{ID: 'plain', Label: 'Plain', Icon: 'table'},
		{ID: 'grid', Label: 'Grid', Icon: 'grid'},
		{ID: 'list', Label: 'List', Icon: 'list'},
		{ID: 'columns', Label: 'Columns', Icon: 'columns'}
	],
	MusicIcons: [],
	ThemedSets: [],
	WeatherIcons: [],
	WeatherColored: true,
	BrandLogos: [],
	BrandsColored: true,
	BrandIcons: '<svg xmlns="http://www.w3.org/2000/svg">' +
		'<symbol id="disk" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm3 2v5h9V5zm5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></symbol>' +
		'<symbol id="spark" viewBox="0 0 24 24"><path fill="#e8a33d" d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/><circle cx="12" cy="12" r="2.5" fill="#fff"/></symbol>' +
		'</svg>',
	BrandSave: false,
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
		'file.vtt', 'file.tsv', 'file.parquet', 'file.db', 'file.sqlite', 'file.ipynb', 'file.xlsm', 'file.xsd', 'file.pem', 'file.crt', 'file.p12', 'file.pub', 'sketch.ino',
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
	OTPState: '',
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
	SplitFiles: ['app.js', 'index.html', 'styles.css', 'README.md'],
	SplitNote: '',
	GroupTabs: ['Notes', 'Plan', 'Budget', 'Ideas'],
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
	SettingsIos: [],
	SettingsMaterial: [],
	SettingsNote: '',
	ChatSelection: [],
	DialNumber: '',
	MusicNote: '',
	KeyboardNote: '',
	KeepShown: true,
	KeepNote: 'Elemenx.Cache · *keep',
	MixerPlaying: false,
	MixerChannels: [
		{ID: 'drums', Label: 'Drums', Color: '#e5484d', Volume: -3, Pan: 0, Level: [-12, -14], Peak: [-6, -8], Knobs: [{Label: 'Hi', Value: 2, Unit: ' dB'}, {Label: 'Lo', Value: -1, Unit: ' dB'}]},
		{ID: 'bass', Label: 'Bass', Color: '#f76b15', Volume: -6, Pan: -20, Level: -18, Peak: -10, Knobs: [{Label: 'Hi', Value: 0, Unit: ' dB'}, {Label: 'Lo', Value: 4, Unit: ' dB'}]},
		{ID: 'keys', Label: 'Keys', Color: '#30a46c', Volume: -9, Pan: 35, Level: [-24, -22], Peak: [-16, -15], Knobs: [{Label: 'Hi', Value: 1, Unit: ' dB'}, {Label: 'Lo', Value: 0, Unit: ' dB'}]},
		{ID: 'vocals', Label: 'Vocals', Color: '#0090ff', Volume: 0, Pan: 0, Level: -9, Peak: -4, Knobs: [{Label: 'Hi', Value: 3, Unit: ' dB'}, {Label: 'Lo', Value: -2, Unit: ' dB'}]}
	],
	MixerMaster: {Label: 'Master', Volume: 0, Level: [-8, -9], Peak: [-3, -4]},
	KeyboardMarks: {KeyW: true, KeyA: true, KeyS: true, KeyD: true, Space: 'ui-kit-key-jump', ShiftLeft: 'ui-kit-key-run'},
	PianoMarks: {C4: true, E4: true, G4: true},
	DialNote: '',
	WorldNote: '',
	WorldProjection: 'isometric',
	WorldProjections: [{Value: 'isometric', Label: 'Isometric'}, {Value: 'orthogonal', Label: 'From above'}],
	WorldFog: false,
	WorldAdded: 0,
	SpaceNote: '',
	SpaceSystem: 'sol',
	SpaceSystems: [{Value: 'sol', Label: 'The Sun'}, {Value: 'seed', Label: 'Of a seed'}],
	SpaceSeed: 'kepler-186',
	SpaceOrbits: true,
	SpaceReal: false,
	SpacePaused: false,
	SpaceDay: 0,
	ModelsNote: '',
	ModelsShadows: true,
	ModelsList: [],
	TerrainNote: '',
	TerrainSaved: null,
	TerrainUnits: [
		{ID: 'scout', Name: 'Scout', X: 0, Y: 10},
		{ID: 'builder', Name: 'Builder', X: 6, Y: 14},
		{ID: 'ranger', Name: 'Ranger', X: -6, Y: 16}
	],
	TerrainTrees: [],
	TerrainHouses: [
		{ID: 'hall', Name: 'Hall', X: 40, Y: 40},
		{ID: 'mill', Name: 'Mill', X: 58, Y: 32},
		{ID: 'forge', Name: 'Forge', X: 48, Y: 60}
	],
	WorldRows: [
		'TTTT,,,.......:~~:..........',
		'TTT,,,,.......:~~:.....,,,..',
		'TT,,..........:~~:....,,,,,.',
		'T,,...........:~~:..........',
		',,.............:~~:.........',
		'...............:~~:.....^^^.',
		'____...........:==:....^^^^.',
		'...____________:==:___^^^^..',
		'...............:~~:....^^^..',
		'..^^............:~~:........',
		'.^^^^...........:~~:........',
		'.^^^^............:~~:.......',
		'..^^.............:~~:....TTT',
		'.................:~~:...TTTT',
		'..##..............:~~:..TTTT',
		'.###..............:~~:.TTTTT',
		'..#...............:~~:TTTTTT',
		'..................:~~:.TTTTT',
		'...................:~~:TTTTT',
		'...................:~~:TTTTT'
	],
	WorldUnits: [
		{ID: 'archer-1', X: 6, Y: 9, Team: 'blue', Type: 'archer', Health: 40, MaxHealth: 40},
		{ID: 'archer-2', X: 7, Y: 9, Team: 'blue', Type: 'archer', Health: 32, MaxHealth: 40},
		{ID: 'archer-3', X: 6, Y: 10, Team: 'blue', Type: 'archer', Health: 40, MaxHealth: 40},
		{ID: 'sword-1', X: 8, Y: 10, Team: 'blue', Type: 'swordsman', Health: 60, MaxHealth: 60},
		{ID: 'sword-2', X: 7, Y: 11, Team: 'blue', Type: 'swordsman', Health: 25, MaxHealth: 60},
		{ID: 'raider-1', X: 24, Y: 5, Team: 'red', Type: 'swordsman', Health: 60, MaxHealth: 60},
		{ID: 'raider-2', X: 25, Y: 6, Team: 'red', Type: 'swordsman', Health: 60, MaxHealth: 60},
		{ID: 'raider-3', X: 23, Y: 6, Team: 'red', Type: 'archer', Health: 40, MaxHealth: 40}
	],
	WorldTrees: [{ID: 'tree-1', X: 10, Y: 15}, {ID: 'tree-2', X: 12, Y: 16}, {ID: 'tree-3', X: 9, Y: 17}, {ID: 'tree-4', X: 11, Y: 18}, {ID: 'tree-5', X: 21, Y: 1}],
	CallLayout: 'grid',
	CallSide: false,
	CallCorner: 'bottom-right',
	CallPinned: '',
	CallState: {Muted: true, Camera: true, Sharing: false, Hand: false},
	CallPeople: [
		{Name: 'Ada Lovelace', Speaking: true, Level: 0.6, Quality: 'good'},
		{Name: 'Alan Turing', Muted: true, Camera: false, Quality: 'fair'},
		{Name: 'Grace Hopper', Hand: true, Quality: 'good'},
		{Name: 'Edsger Dijkstra', Camera: false, Quality: 'poor'},
		{Name: 'Margaret Hamilton', Quality: 'good'},
		{Name: 'Claude Shannon', Muted: true, Quality: 'good'}
	],
	CallDevices: {
		Microphones: [{ID: 'default', Label: 'Default microphone'}, {ID: 'headset', Label: 'Headset'}],
		Speakers: [{ID: 'default', Label: 'Speakers'}, {ID: 'headset', Label: 'Headset'}],
		Cameras: [{ID: 'front', Label: 'Front camera'}],
		Microphone: 'headset',
		Speaker: 'headset',
		Camera: 'front'
	},
	ToneKeys: [
		{Value: '1'}, {Value: '2'}, {Value: '3'}, {Value: 'A', Class: 'ui-kit-tone-key'},
		{Value: '4'}, {Value: '5'}, {Value: '6'}, {Value: 'B', Class: 'ui-kit-tone-key'},
		{Value: '7'}, {Value: '8'}, {Value: '9'}, {Value: 'C', Class: 'ui-kit-tone-key'},
		{Value: '*', Label: '✱'}, {Value: '0'}, {Value: '#'}, {Value: 'D', Class: 'ui-kit-tone-key'}
	],
	SettingsVariant: 'ios',
	SettingsVariants: [
		{Value: 'auto', Label: 'Auto'},
		{Value: 'ios', Label: 'iOS'},
		{Value: 'material', Label: 'Material'}
	],
	Budget: [200, 800],
	DialogOpen: false,
	UILanguage: 'en',
	RequiredOpen: false,
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
		{ID: 2, Author: 'Grace Hopper', Text: 'Can you check the new table?', Time: '10:02', Edited: 'Edited at 10:04'},
		{ID: 3, Author: 'Grace Hopper', Text: 'The sorting looks right to me.', Time: '10:03'},
		{ID: 4, Author: 'Me', Text: 'Looks good, merging it now.', Time: '10:05', Own: true, Status: 'read', Reactions: [{Emoji: '🎉', Count: 2, Mine: false, Users: [{Name: 'Grace Hopper'}, {Name: 'Alan Turing'}]}, {Emoji: '👍', Count: 1, Mine: true, Users: [{Name: 'Me'}]}], Viewers: [{Name: 'Grace Hopper', Time: '10:06'}, {Name: 'Alan Turing', Time: '10:11'}, {Name: 'Ada Lovelace', Time: '10:15'}]},
		{ID: 5, Author: 'Me', Text: 'The release notes are next.', Time: '10:07', Own: true, Status: 'delivered', Views: 0}
	],
	ChatNote: '',
	CardNote: '',
	ProfileStats: [
		{Label: 'Posts', Value: 128},
		{Label: 'Followers', Value: 12400},
		{Label: 'Following', Value: 310}
	],
	ProductColors: [
		{Value: 'coral', Color: '#ff6b6b', Label: 'Coral'},
		{Value: 'ink', Color: '#2b2f3a', Label: 'Ink'},
		{Value: 'sky', Color: '#4f7dff', Label: 'Sky'}
	],
	Subscription: 'pro',
	SubscriptionPeriod: 'month',
	Subscriptions: [
		{ID: 'free', Name: 'Basic', Description: 'For a start', Price: 0, Features: ['3 projects', '1 GB of storage', {Label: 'Custom themes', Included: false}, {Label: 'Priority support', Included: false}], Current: true, Color: '#3f6c9e'},
		{ID: 'pro', Name: 'Standard', Description: 'For a team', Price: 12, YearlyPrice: 115, Features: ['Unlimited projects', '100 GB of storage', 'Custom themes', {Label: 'Priority support', Included: false}], Popular: 'Most popular', Color: '#b4483f'},
		{ID: 'team', Name: 'Premium', Description: 'For a company', Price: 29, YearlyPrice: 278, Features: ['Unlimited projects', '1 TB of storage', 'Custom themes', {Label: 'Priority support', Hint: 'An answer within an hour'}], Color: '#3d7a54'}
	],
	Picked: '',
	PickedEmoji: '',
	PickedSticker: '',
	StickerPack: {
		ID: 'pals',
		Title: 'Elemenx pals',
		Icon: '/data/stickers/hello.svg',
		Items: [
			{ID: 'hello', URL: '/data/stickers/hello.svg', Title: 'Hello', Keywords: 'hi wave cat привет', Emoji: '👋 😺'},
			{ID: 'love', URL: '/data/stickers/love.svg', Title: 'Love', Keywords: 'heart like любовь сердце', Emoji: '❤️ 😍 🥰'},
			{ID: 'thumbs-up', URL: '/data/stickers/thumbs-up.svg', Title: 'Thumbs up', Keywords: 'ok yes like класс', Emoji: '👍 👌'},
			{ID: 'party', URL: '/data/stickers/party.svg', Title: 'Party', Keywords: 'celebrate congrats праздник', Emoji: '🎉 🥳'},
			{ID: 'coffee', URL: '/data/stickers/coffee.svg', Title: 'Coffee', Keywords: 'break morning кофе', Emoji: '☕'},
			{ID: 'rocket', URL: '/data/stickers/rocket.svg', Title: 'Rocket', Keywords: 'launch ship ракета', Emoji: '🚀'},
			{ID: 'thinking', URL: '/data/stickers/thinking.svg', Title: 'Thinking', Keywords: 'hmm question думаю', Emoji: '🤔'},
			{ID: 'sleepy', URL: '/data/stickers/sleepy.svg', Title: 'Sleepy', Keywords: 'night tired сон', Emoji: '😴 💤'}
		]
	},
	PropertiesOpen: true,
	NotesOpen: true,
	WindowNote: 'Window',
	PipVideo: false,
	PipDocument: false,
	GameStatusOpen: true,
	GameBagOpen: true,
	GameRecordOpen: false,
	GameLoginOpen: false,
	GameSystemsOpen: false,
	GameQuestsOpen: false,
	GameRankingOpen: false,
	GameQuest: 'wolves',
	GameQuestList: [
		{ID: 'wolves', Title: 'Wolves at the gate', Group: 'Main story', Level: 7, Tracked: true, Text: 'The wolves of the northern woods grow bold. Thin the pack before they reach the village.', Objectives: [{Label: 'Grey wolves slain', Value: 3, Max: 5}, {Label: 'Report to the elder', Value: 0}], Rewards: [{Icon: 'star', Label: '450 experience'}, {Icon: 'gift', Label: 'Wolfhide cloak', Rarity: 'rare', Type: 'Cloak', Stats: [{Label: 'Defense', Value: '+18'}, {Label: 'Cold resist', Value: '+25%'}], Description: 'Warm, and the wolves know its smell.'}]},
		{ID: 'road', Title: 'The northern road', Group: 'Main story', Level: 8, Text: 'Find a way through the pass before the snow closes it.', Objectives: [{Label: 'Reach the pass', Value: 0}], Rewards: [{Icon: 'star', Label: '600 experience'}]},
		{ID: 'herbs', Title: 'Herbs for the healer', Group: 'Side quests', Level: 5, Tracked: true, Text: 'Mira needs silverleaf for her remedies.', Objectives: [{Label: 'Silverleaf gathered', Value: 6, Max: 8}], Rewards: [{Icon: 'heart', Label: 'Healing potion', Count: 3, Rarity: 'uncommon', Type: 'Potion', Description: 'Restores 30 health.'}]},
		{ID: 'ring', Title: 'A lost ring', Group: 'Side quests', Level: 4, Status: 'done', Text: 'The ring was in the well all along.', Objectives: [{Label: 'Find the ring', Value: 1}], Rewards: [{Icon: 'star', Label: '120 experience'}]},
		{ID: 'bridge', Title: 'Hold the bridge', Group: 'Side quests', Level: 6, Status: 'failed', Text: 'The bridge fell before help came.', Objectives: [{Label: 'Defend the bridge', Value: 0}]}
	],
	GameRanking: [
		{ID: 'kael', Name: 'Kael', Note: 'Level 42 · Paladin', Score: 98420, Change: 1, Icon: 'user'},
		{ID: 'lyra', Name: 'Lyra', Note: 'Level 41 · Ranger', Score: 97105, Change: -1, Icon: 'user'},
		{ID: 'dorn', Name: 'Dorn', Note: 'Level 39 · Warrior', Score: 90330, Icon: 'user'},
		{ID: 'sela', Name: 'Sela', Note: 'Level 37 · Mage', Score: 85012, Change: 2, Icon: 'user'},
		{ID: 'brin', Name: 'Brin', Note: 'Level 36 · Rogue', Score: 80400, Change: -1, Icon: 'user'},
		{ID: 'aria', Name: 'Aria', Note: 'Level 7 · Warden', Score: 12800, Change: 3, Icon: 'user', Me: true}
	],
	GameMarkers: [
		{ID: 'elder', X: 0.3, Y: 0.35, Kind: 'quest', Label: 'The elder'},
		{ID: 'wolf', X: 0.7, Y: 0.6, Kind: 'enemy', Label: 'Grey wolf'},
		{ID: 'mira', X: 0.45, Y: 0.72, Kind: 'ally', Label: 'Mira'},
		{ID: 'pass', X: 0.95, Y: -0.2, Kind: 'quest', Label: 'The pass'}
	],
	GameZoom: 2,
	GameAchievementIndex: 0,
	NativePlatform: 'web',
	WorldCity: '',
	ScopeTheme: 'darcula',
	Devices: [],
	DeviceState: 'Push, Serial, USB and NFC: what this browser has',
	PeopleNote: '',
	WorkspaceCustomize: false,
	WorkspaceLayoutNote: '',
	GamePads: ['xbox', 'playstation', 'nintendo', 'generic'],
	GamePadButtons: ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'ls', 'rs', 'up', 'down', 'left', 'right', 'select', 'start', 'home'],
	ViewerMarkdown: '## Elemenx 0.9\n\nA **viewer** of Markdown: the *same* look as the rich editor, ~~nothing~~ that runs.\n\n- Tables, quotes and lists\n- Code that names its language:\n\n```js\nElemenx.Component(\'Hello\', {$Template: \'<b>{{Name}}</b>\', Name: \'world\'});\n```\n\n| Key | Does |\n| --- | --- |\n| Mod+F | Finds |\n| Mod+H | Replaces |\n',
	MoreNote: 'SplitButton · Accordion · Countdown · Clock · Consent · DiffView · QRCode · SignaturePad · ImageCropper · FileBrowser · MediaPlayer',
	MoreActions: [{ID: 'copy', Label: 'Save a copy'}, {ID: 'pdf', Label: 'Export PDF'}],
	MorePurposes: [{ID: 'necessary', Label: 'Necessary', Required: true}, {ID: 'analytics', Label: 'Analytics'}],
	MoreBefore: 'function Area (radius) {\n\treturn 3.14 * radius * radius;\n}\n',
	MoreAfter: 'function Area (radius) {\n\treturn Math.PI * radius * radius;\n}\n',
	CodesNote: 'CommitGraph · Barcode · QRCode · Diagram · Markdown with plugins',
	CodesCommits: [
		{ID: 'f6a1c20', Parents: ['e5b2d31', 'd4c3e42'], Message: 'Merge branch feature/charts', Author: 'Ada', Date: '2026-10-20', Refs: [{Name: 'main', Kind: 'head'}, {Name: 'v0.10', Kind: 'tag'}]},
		{ID: 'e5b2d31', Parents: ['c3d4f53'], Message: 'Fix the router on a hash', Author: 'Linus', Date: '2026-10-19'},
		{ID: 'd4c3e42', Parents: ['b2e5a64'], Message: 'Charts: a legend', Author: 'Grace', Date: '2026-10-18', Refs: [{Name: 'feature/charts', Kind: 'branch'}]},
		{ID: 'c3d4f53', Parents: ['a1f6b75'], Message: 'Docs of the CLI', Author: 'Ada', Date: '2026-10-17'},
		{ID: 'b2e5a64', Parents: ['a1f6b75'], Message: 'Charts: bars and lines', Author: 'Grace', Date: '2026-10-16'},
		{ID: 'a1f6b75', Parents: [], Message: 'The first commit', Author: 'Ada', Date: '2026-10-15'}
	],
	CodesFlow: 'flowchart LR\n  A([Order]) --> B{Paid?}\n  B -->|yes| C[[Pack]]\n  B -. no .-> D>Remind]\n  C ==> E[(Shipped)]\n  D --> B',
	CodesSequence: 'sequenceDiagram\n  actor U as User\n  U->>+S: Places an order\n  S-->>-U: The number',
	CodesMarkdown: '::: tip title="Plugins"\nA fence of a language a plugin takes draws its Component:\n:::\n\n```mermaid\nstateDiagram-v2\n  [*] --> Draft\n  Draft --> Published : approve\n  Published --> [*]\n```\n',
	SoundNote: 'Spectrum · Waveform · Jog · Sampler · PianoRoll: the Audio Service plays and hears',
	DrawingNote: 'Drawing · DrawingLayers: shapes, brushes, texts, groups and layers',
	DrawingLayer: 'sketch',
	MediaNote: 'MediaHero · MediaShelf · MediaCard · FacetFilter · TrackList · CastList',
	MediaValue: {},
	MediaItems: [
		{ID: 'north', Title: 'North', Subtitle: '2019', Genres: ['Drama', 'Adventure'], Year: 2019, Rating: 7.9, Progress: 0.8},
		{ID: 'harbor', Title: 'Harbor', Subtitle: '2021', Genres: ['Drama', 'Romance'], Year: 2021, Rating: 6.8},
		{ID: 'ember', Title: 'Ember', Subtitle: '2023', Genres: ['Comedy'], Year: 2023, Rating: 7.1, Progress: 0.1},
		{ID: 'quiet', Title: 'Quiet Hours', Subtitle: '2016', Genres: ['Mystery'], Year: 2016, Rating: 7.6},
		{ID: 'atlas', Title: 'Atlas', Subtitle: '2022', Genres: ['Adventure'], Year: 2022, Rating: 8.7}
	],
	MediaLeft: [],
	MediaPoster: '',
	MediaBackdrop: '',
	MediaFacets: [
		{ID: 'genre', Label: 'Genre', Field: 'Genres'},
		{ID: 'score', Label: 'Score', Field: 'Rating', Type: 'rating', Max: 10}
	],
	MediaTime: 8,
	MediaEdit: [
		{ID: 'v1', Kind: 'video', Name: 'Video 1', Clips: [{ID: 'intro', Name: 'Intro', Start: 0, Duration: 12}, {ID: 'talk', Name: 'Interview', Start: 12, Duration: 14}]},
		{ID: 'a1', Kind: 'audio', Name: 'Music', Clips: [{ID: 'theme', Name: 'Theme', Start: 0, Duration: 26, Peaks: [0.3, 0.7, 0.5, 0.9, 0.4, 0.6, 0.8, 0.3]}]}
	],
	MediaTrack: 2,
	MediaPlaying: true,
	MediaTracks: [
		{ID: 1, Title: 'Morning Tide', Artist: 'Elemenx Quartet', Duration: 214},
		{ID: 2, Title: 'Lantern', Artist: 'Elemenx Quartet', Duration: 187},
		{ID: 3, Title: 'Low Water', Artist: 'Elemenx Quartet', Duration: 305}
	],
	MediaCast: [
		{ID: 'ada', Name: 'Ada Lovelace', Role: 'The keeper'},
		{ID: 'alan', Name: 'Alan Turing', Role: 'Captain'},
		{ID: 'grace', Name: 'Grace Hopper', Role: 'Navigator'}
	],
	DrawingModel: {
		Width: 480,
		Height: 300,
		Layers: [
			{ID: 'paper', Name: 'Paper', Visible: true, Locked: true, Items: [{ID: 'paper-back', Type: 'rect', X: 0, Y: 0, W: 480, H: 300, Stroke: 'none', Fill: '#f4f1ea', Width: 0}]},
			{ID: 'shapes', Name: 'Shapes', Visible: true, Locked: false, Items: [
				{ID: 'box', Type: 'rect', X: 40, Y: 60, W: 140, H: 100, Stroke: '#3f6c9e', Fill: '#dbe7f5', Width: 3},
				{ID: 'disc', Type: 'ellipse', X: 230, Y: 50, W: 120, H: 120, Stroke: '#c0392b', Fill: 'none', Width: 4}
			]},
			{ID: 'sketch', Name: 'Sketch', Visible: true, Locked: false, Items: [
				{ID: 'mark', Type: 'path', Brush: 'highlighter', Points: [{X: 50, Y: 220}, {X: 150, Y: 215}, {X: 260, Y: 225}], Stroke: '#d99a1e', Width: 3},
				{ID: 'title', Type: 'text', X: 300, Y: 220, Text: 'Sketch', Size: 28, Stroke: '#2f8f83'}
			]}
		]
	},
	SoundLevels: [0.35, 0.62, 0.88, 0.95, 0.8, 0.7, 0.76, 0.6, 0.52, 0.58, 0.47, 0.4, 0.44, 0.36, 0.3, 0.33, 0.27, 0.22, 0.2, 0.16, 0.14, 0.1, 0.08, 0.05],
	SoundPeaks: Array.apply(null, Array(160)).map(function (nothing, index) {
		return Math.abs(Math.sin(index / 5)) * (0.3 + 0.7 * Math.abs(Math.sin(index / 37)));
	}),
	SoundTime: 12,
	SoundPart: {Start: 20, End: 28},
	/* The pads, their sounds made here: WAV files of a falling tone or of noise. */
	SoundPads: (function () {
		function sound (seconds, shape) {
			var rate = 22050;
			var count = Math.round(seconds * rate);
			var buffer = new ArrayBuffer(44 + count * 2);
			var view = new DataView(buffer);
			var i;

			function text (at, value) {
				for (var k = 0; k < value.length; k++) view.setUint8(at + k, value.charCodeAt(k));
			}

			text(0, 'RIFF');

			view.setUint32(4, 36 + count * 2, true);

			text(8, 'WAVEfmt ');

			view.setUint32(16, 16, true);
			view.setUint16(20, 1, true);
			view.setUint16(22, 1, true);
			view.setUint32(24, rate, true);
			view.setUint32(28, rate * 2, true);
			view.setUint16(32, 2, true);
			view.setUint16(34, 16, true);

			text(36, 'data');

			view.setUint32(40, count * 2, true);

			for (i = 0; i < count; i++) view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, shape(i / rate))) * 30000), true);

			return buffer;
		}

		return [
			{ID: 'kick', Label: 'Kick', Key: 'Q', Color: '#c0392b', Sample: sound(0.3, function (t) {
				return Math.sin(2 * Math.PI * (50 * t + 2 * (1 - Math.exp(-t * 30)))) * Math.exp(-t * 9);
			})},
			{ID: 'snare', Label: 'Snare', Key: 'W', Color: '#d99a1e', Sample: sound(0.2, function (t) {
				return (Math.random() * 2 - 1) * Math.exp(-t * 18) * 0.7;
			})},
			{ID: 'hat', Label: 'Hat', Key: 'E', Color: '#2f8f83', Sample: sound(0.06, function (t) {
				return (Math.random() * 2 - 1) * Math.exp(-t * 60) * 0.5;
			})},
			{ID: 'clap', Label: 'Clap', Key: 'R', Color: '#7a4fb0'}
		];
	})(),
	SoundNotes: [
		{ID: 'a', Note: 60, Start: 0, Length: 1}, {ID: 'b', Note: 64, Start: 1, Length: 1}, {ID: 'c', Note: 67, Start: 2, Length: 1},
		{ID: 'd', Note: 72, Start: 3, Length: 1}, {ID: 'e', Note: 71, Start: 4, Length: 0.5}, {ID: 'f', Note: 67, Start: 4.5, Length: 0.5},
		{ID: 'g', Note: 64, Start: 5, Length: 1}, {ID: 'h', Note: 62, Start: 6, Length: 2}
	],
	MorePicture: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22200%22%3E%3Crect width=%22320%22 height=%22200%22 fill=%22%235f7d95%22/%3E%3Ccircle cx=%22160%22 cy=%2290%22 r=%2250%22 fill=%22%23f2c79a%22/%3E%3C/svg%3E',
	MoreFiles: [{ID: 'docs', Name: 'Documents', Items: [{ID: 'cv', Name: 'cv.pdf', Size: 182000}]}, {ID: 'notes', Name: 'notes.md', Size: 2100}, {ID: 'song', Name: 'song.mp3', Size: 5800000}],
	ViewerCode: 'function Area (radius) {\n\t/* The area of a circle. */\n\tvar square = radius * radius;\n\n\treturn Math.PI * square;\n}\n',
	DeclaredChart: {Type: 'bar', Labels: ['Q1', 'Q2', 'Q3', 'Q4'], Series: [{Name: 'Sales', Values: [12, 18, 15, 24]}], Label: 'Sales'},
	DeclaredTab: '',
	ViewerHtml: '<section class="card">\n\t<h2>Title</h2>\n\t<ul>\n\t\t<li>One</li>\n\t\t<li>Two</li>\n\t</ul>\n\t<img src="a.png">\n\t<br>\n\t<Button Label="Go" />\n</section>\n',
	ViewerJson: '{\n\t"name": "elemenx",\n\t"keywords": [\n\t\t"ui",\n\t\t"es5"\n\t],\n\t"scripts": {\n\t\t"test": "vitest",\n\t\t"lint": "eslint ."\n\t}\n}\n',
	Formulas: ['ax^2 + bx + c = 0', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}', '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', 'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'],
	WorkTiles: [],
	CanRedo: false,
	Wrapped: false,
	FormNote: '',
	Profile: null,
	ProfileState: '',
	ProfileCities: [{Value: 'Berlin', Label: 'Berlin'}, {Value: 'Paris', Label: 'Paris'}, {Value: 'Tokyo', Label: 'Tokyo'}],
	ServerStatus: 'online',
	Unread: 3,
	CrumbItems: [
		{ID: 'projects', Label: 'Projects', Icon: 'folder'},
		{ID: 'elemenx', Label: 'Elemenx'},
		{ID: 'libraries', Label: 'libraries'},
		{ID: 'components', Label: 'components'},
		{ID: 'app', Label: 'app.js', File: 'app.js'}
	],
	GalleryItems: [
		{ID: 'mountains', Image: 'data/cards/mountains.svg', Title: 'Mountains', Description: 'The northern range at dawn.', Tags: ['nature', 'cold']},
		{ID: 'sea', Image: 'data/cards/sea.svg', Title: 'Sea', Description: 'A calm bay in the south.', Tags: ['nature', 'water']},
		{ID: 'city', Image: 'data/cards/city.svg', Title: 'City', Description: 'Lights of the old town.', Tags: ['night']},
		{ID: 'cover', Image: 'data/cards/cover.svg', Title: 'Cover', Alt: 'An abstract cover'}
	],
	GalleryIndex: 0,
	GalleryPicked: '',
	GalleryAutoplay: false,
	GalleryBackwards: false,
	GalleryTitle: true,
	GalleryDescription: true,
	GalleryTags: true,
	GalleryFade: false,
	NativeState: 'Nothing yet',
	GameSystemTab: 'power',
	GameSystemTabs: [
		{ID: 'power', Label: 'Power'},
		{ID: 'files', Label: 'Files'},
		{ID: 'log', Label: 'Log'}
	],
	GameReactor: [
		{ID: 'Core', Value: 120},
		{ID: 'Ring', Value: 90},
		{ID: 'Coil', Value: 63},
		{ID: 'Grid', Value: 100},
		{ID: 'Vent', Value: 124}
	],
	GameFileColumns: [
		{Key: 'ID', Title: '#', Width: '40px'},
		{Key: 'File', Title: 'File'},
		{Key: 'Size', Title: 'Size', Align: 'right'},
		{Key: 'Date', Title: 'Date'},
		{Key: 'Kind', Title: 'Type'}
	],
	GameFiles: [
		{ID: '01', File: 'DR.0345/D', Size: '134.56 mb', Date: '03 / 01 / 2134', Kind: 'SYS Network'},
		{ID: '02', File: 'DR.243346/D', Size: '23.20 mb', Date: '05 / 02 / 2132', Kind: 'SYS Network'},
		{ID: '03', File: 'DR.0345/S', Size: '45.62 mb', Date: '12 / 01 / 2136', Kind: 'SYS Network'},
		{ID: '04', File: 'DR.0345/A', Size: '869.24 mb', Date: '31 / 11 / 2121', Kind: 'DNS Network'},
		{ID: '05', File: 'DR.0345/C', Size: '2.41 mb', Date: '21 / 07 / 2166', Kind: 'SYS Network'},
		{ID: '06', File: 'DR.0345/D2', Size: '492.34 mb', Date: '01 / 04 / 2124', Kind: 'SYS Network'},
		{ID: '07', File: 'DR.0305/G', Size: '4.06 mb', Date: '05 / 02 / 2111', Kind: 'SYS Network'},
		{ID: '08', File: 'DR.97654/Z', Size: '23.43 mb', Date: '09 / 11 / 2178', Kind: 'EFD Network'},
		{ID: '09', File: 'DR.0345/V', Size: '2.34 mb', Date: '12 / 06 / 2156', Kind: 'SYS Network'},
		{ID: '10', File: 'DR.0237/A2', Size: '1.34 mb', Date: '16 / 09 / 2157', Kind: 'EFD Network'},
		{ID: '11', File: 'DR.0345/G', Size: '479.21 mb', Date: '30 / 07 / 2158', Kind: 'SYS Network'},
		{ID: '12', File: 'DR.03644S/B', Size: '974.04 mb', Date: '27 / 03 / 2159', Kind: 'CGT Network'},
		{ID: '13', File: 'DR.0334/R', Size: '24.24 mb', Date: '23 / 12 / 2158', Kind: 'SYS Network'},
		{ID: '14', File: 'DR.7489/S', Size: '324.72 mb', Date: '04 / 01 / 2161', Kind: 'SYS Network'},
		{ID: '15', File: 'DR.A3245/H', Size: '90.21 mb', Date: '03 / 12 / 2140', Kind: 'SYS Network'}
	],
	GameFile: ['06'],
	GameLog: [
		{ID: 1, Label: '21:04:12 · Slow network is detected'},
		{ID: 2, Label: '21:04:19 · Worm is detected in DR.0345/D'},
		{ID: 3, Label: '21:05:02 · Coil temperature nominal'},
		{ID: 4, Label: '21:05:40 · Vent pressure over the limit'},
		{ID: 5, Label: '21:06:11 · Mode 02 engaged'},
		{ID: 6, Label: '21:06:58 · Files synced with the fleet'},
		{ID: 7, Label: '21:07:31 · Reactor core at 86%'},
		{ID: 8, Label: '21:08:05 · Grid rerouted through ring B'},
		{ID: 9, Label: '21:08:47 · Scanner modules online'},
		{ID: 10, Label: '21:09:20 · Layout D3 saved'},
		{ID: 11, Label: '21:10:02 · Detector armed'},
		{ID: 12, Label: '21:10:36 · Crypt key rotated'},
		{ID: 13, Label: '21:11:15 · Slow network is detected'},
		{ID: 14, Label: '21:11:59 · Mode 01 engaged'}
	],
	GameActiveSlot: '3',
	GameHotbar: [
		{Key: '1', Skill: {ID: 'fireball', Kind: 'skill', Name: 'Fireball', Icon: 'fire', Cooldown: 3000, Color: '#b8402a', Type: 'Skill', Stats: [{Label: 'Damage', Value: '24–30'}, {Label: 'Mana', Value: '10'}], Description: 'Hurls a ball of fire.'}},
		{Key: '2', Skill: {ID: 'heal', Kind: 'skill', Name: 'Heal', Icon: 'leaf', Cooldown: 5000, Color: '#3f9a44', Type: 'Skill', Description: 'Restores 25 health.'}},
		{Key: '3', Skill: {ID: 'blink', Kind: 'skill', Name: 'Blink', Icon: 'star', Cooldown: 1500, Color: '#3a68c4', Type: 'Skill', Description: 'Steps a short way at once.'}},
		{Key: '4', Item: {ID: 'potion', Name: 'Health potion', Icon: 'heart', Count: 3, Stack: 20, Rarity: 'common', Color: '#a8282c', Type: 'Potion', Use: 'heal', Description: 'Restores 30 health.'}},
		{Key: '5'},
		{Key: '6'}
	],
	GameRecordTab: 'Service',
	GameRecordTabs: [
		{ID: 'Service', Label: 'Service'},
		{ID: 'Awards', Label: 'Awards'},
		{ID: 'Training', Label: 'Training'},
		{ID: 'Remarks', Label: 'Remarks'}
	],
	GameHealth: 82,
	GameMana: 46,
	GameExperiencePoints: 640,
	GamePaused: false,
	GameNote: 'Fireball 1 · Heal 2 · Blink 3 · Potion 4',
	GameScript: [
		{Speaker: 'Old sage', Text: 'Traveller! The northern road is closed: a storm came down from the peaks at dawn.'},
		{Speaker: 'Old sage', Text: 'Will you take the mountain pass, or wait out the storm at the inn?', Choices: [
			{ID: 'pass', Text: 'Take the mountain pass'},
			{ID: 'inn', Text: 'Wait at the inn'},
			{ID: 'guide', Text: 'Hire a guide (50 gold)', Disabled: true}
		]}
	],
	GameStep: 0,
	GameLine: null,
	GameMenuItems: [
		{ID: 'resume', Label: 'Resume', Hint: 'Esc'},
		{ID: 'save', Label: 'Save game'},
		{ID: 'settings', Label: 'Settings', Disabled: true},
		{ID: 'quit', Label: 'Quit to title'}
	],
	GameItems: [
		{ID: 'sword', Name: 'Moonblade', Icon: 'star', Rarity: 'legendary', Badge: '+5', Type: 'Sword', Description: 'Forged under a blue moon.', Stats: [{Label: 'Damage', Value: '42–58'}, {Label: 'Speed', Value: '1.2'}]},
		{ID: 'potion', Name: 'Health potion', Icon: 'heart', Count: 5, Stack: 20, Rarity: 'common', Color: '#a8282c', Type: 'Potion', Use: 'heal', Description: 'Restores 30 health.'},
		null,
		{ID: 'map', Name: 'Old map', Icon: 'map-pin', Rarity: 'rare', Class: 'quest', Type: 'Quest item', Description: 'The way across the pass.'},
		{ID: 'rune', Name: 'Ember rune', Icon: 'fire', Count: 2, Stack: 10, Rarity: 'epic', Badge: '+3', Color: '#b8402a', Active: true, Type: 'Rune', Stats: [{Label: 'Fire damage', Value: '+12%'}]},
		null,
		{ID: 'herb', Name: 'Silverleaf', Icon: 'leaf', Count: 7, Stack: 99, Rarity: 'uncommon', Type: 'Herb'},
		{ID: 'gift', Name: 'Sealed box', Icon: 'gift', Rarity: 'uncommon', Type: 'Container', Description: 'Something rattles inside.'},
		null,
		{ID: 'herb', Name: 'Silverleaf', Icon: 'leaf', Count: 4, Stack: 99, Rarity: 'uncommon', Type: 'Herb'}
	],
	SuggestMode: 'always',
	SuggestModes: [
		{Value: 'always', Label: 'Always'},
		{Value: 'colon', Label: 'After :'},
		{Value: 'never', Label: 'Never'}
	],
	StepItems: [
		{ID: 'plan', Label: 'Plan', Description: 'Scope and design', Icon: 'edit'},
		{ID: 'build', Label: 'Build', Description: 'Code and tests', Icon: 'code'},
		{ID: 'review', Label: 'Review', Description: 'Two approvals', Icon: 'users'},
		{ID: 'deploy', Label: 'Deploy', Description: 'Started by the pipeline', Icon: 'cloud', Readonly: true}
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
	TimelineNote: '',
	PlanLanes: [{ID: 'design', Label: 'Design'}, {ID: 'build', Label: 'Build'}, {ID: 'launch', Label: 'Launch'}],
	PlanRanges: [
		{ID: 'research', From: '2026-01-12', To: '2026-03-06', Label: 'Research', Lane: 'design'},
		{ID: 'mockups', From: '2026-02-16', To: '2026-04-24', Label: 'Mock-ups', Lane: 'design', Tone: 'info'},
		{ID: 'core', From: '2026-03-02', To: '2026-07-31', Label: 'Core', Lane: 'build'},
		{ID: 'beta', From: '2026-06-01', To: '2026-09-15', Label: 'Beta', Lane: 'launch', Tone: 'warning'},
		{ID: 'release', From: '2026-09-15', To: '2026-12-18', Label: 'Release', Lane: 'launch', Tone: 'success'}
	],
	PlanMarks: [
		{ID: 'kickoff', At: '2026-01-12', Label: 'Kick-off', Icon: 'flag'},
		{ID: 'alpha', At: '2026-05-04', Label: 'Alpha', Tone: 'info'},
		{ID: 'demo', At: '2026-05-08', Label: 'Demo day', Tone: 'info'},
		{ID: 'board', At: '2026-05-08', Label: 'Board meeting', Tone: 'muted'},
		{ID: 'launch', At: '2026-09-15', Label: 'Launch', Tone: 'success', Icon: 'star', Side: 'before'}
	],
	HistoryMarks: [
		{ID: 'flight', At: '1903-12-17', Label: 'First powered flight'},
		{ID: 'radio', At: '1920-11-02', Label: 'First commercial radio'},
		{ID: 'computer', At: '1945-12-10', Label: 'ENIAC runs', Tone: 'info'},
		{ID: 'moon', At: '1969-07-20', Label: 'Moon landing', Tone: 'success', Side: 'before'},
		{ID: 'web', At: '1991-08-06', Label: 'The web goes public', Tone: 'info'},
		{ID: 'phone', At: '2007-01-09', Label: 'A phone with a touch screen'}
	],
	VideoAt: 75,
	Lines: [
		{ID: 1, Kind: 'info', Text: 'Elemenx terminal. Type help.'}
	],
	Busy: false,
	WorkspaceLines: [
		{ID: 2, Kind: 'input', Text: 'npm test'},
		{ID: 3, Kind: 'success', Text: 'Test Files  52 passed (52)'}
	],
	WorkspaceBusy: false,
	EditorLanguage: 'javascript',
	EditorLanguages: [
		{Value: 'javascript', Label: 'JavaScript'},
		{Value: 'typescript', Label: 'TypeScript'},
		{Value: 'json', Label: 'JSON'},
		{Value: 'html', Label: 'HTML'},
		{Value: 'css', Label: 'CSS'},
		{Value: 'markdown', Label: 'Markdown'},
		{Value: 'sql', Label: 'SQL'},
		{Value: 'python', Label: 'Python'},
		{Value: 'shell', Label: 'Shell'}
	],
	EditorSamples: {
		javascript: "/* A component of the catalogue. */\nElemenx.Component('Counter', {\n\tCount: 0,\n\tLimit: 10,\n\n\tAdd: function (step) {\n\t\tvar next = this.Count + (step || 1);\n\t\tvar unused = /^\\d+$/g;\n\n\t\tif (next > this.Limit) return;\n\n\t\tthis.Count = next;\n\t\tthis.$Emit('change', `count: ${next}`);\n\t}\n});\n",
		typescript: "interface User {\n\treadonly id: number;\n\tname: string;\n\troles?: Array<'admin' | 'user'>;\n}\n\nexport function greet (user: User): string {\n\treturn 'Hello, ' + user.name;\n}\n",
		json: '{\n\t"name": "@qybercom/elemenx",\n\t"version": "0.9.2",\n\t"private": false,\n\t"keywords": ["ui", "framework", null],\n\t"size": 1.5e3\n}\n',
		html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<style>\n\t\tbody { margin: 0; }\n\t</style>\n</head>\n<body>\n\t<!-- The root of the Application -->\n\t<div id="app" class="app">{{Title}} &amp; more</div>\n\t<script src="elemenx.js"></script>\n</body>\n</html>\n',
		css: '@media (max-width: 600px) {\n\t.card > .title:hover {\n\t\tcolor: #3f6c9e !important;\n\t\tmargin: 0 auto -1.5em;\n\t\twidth: calc(100% - 24px);\n\t}\n}\n',
		markdown: '# Elemenx\n\nA **small** framework with *no* build step.\n\n- Components\n- Services\n\n```js\nElemenx.Application(\'App\', {$Component: \'Root\'});\n```\n\n> See [the docs](https://example.com).\n',
		sql: "-- The users who signed in this year\nSELECT u.id, u.name, COUNT(s.id) AS sessions\nFROM users u\nLEFT JOIN sessions s ON s.user_id = u.id\nWHERE u.created_at >= '2026-01-01'\nGROUP BY u.id, u.name\nORDER BY sessions DESC\nLIMIT 10;\n",
		python: '@dataclass\nclass Point:\n\tx: float = 0.0\n\ty: float = 0.0\n\n\tdef length(self) -> float:\n\t\t"""The distance from the origin."""\n\t\treturn (self.x ** 2 + self.y ** 2) ** 0.5  # Pythagoras\n\nprint(Point(3, 4).length(), None)\n',
		shell: '#!/bin/bash\n# Builds every example\nfor name in Simple Advanced; do\n\techo "Building $name"\n\tnode elemenx-cli.js build "examples/${name}" --out dist || exit 1\ndone\n'
	},
	EditorCode: '',
	EditorOriginal: '',
	EditorView: 'edit',
	EditorViews: [
		{Value: 'edit', Label: 'Edit'},
		{Value: 'unified', Label: 'Diff'},
		{Value: 'split', Label: 'Side by side'}
	],
	EditorStats: '',
	EditorWrap: false,
	EditorMarkers: [],
	EditorLine: 1,
	EditorColumn: 1,
	EditorQuery: '',
	EditorReplacement: '',
	EditorMatches: null,
	RichValue: '<h2>Release notes</h2><p>Elemenx <strong>0.9</strong> brings a <em>rich text</em> editor with <a href="https://github.com/Qybercom/Elemenx">no toolbar of its own</a>: the page calls <code>Command</code>.</p><ul><li>Markdown in and out</li><li>Paste through a schema</li></ul><blockquote><p>Select some text to see the quick menu.</p></blockquote><table><thead><tr><th>Key</th><th>Does</th></tr></thead><tbody><tr><td>Mod+B</td><td>Bold</td></tr><tr><td>Mod+K</td><td>Link</td></tr></tbody></table>',
	RichBlock: 'paragraph',
	RichBlocks: [
		{Value: 'paragraph', Label: 'Paragraph'},
		{Value: 'heading-1', Label: 'Heading 1'},
		{Value: 'heading-2', Label: 'Heading 2'},
		{Value: 'heading-3', Label: 'Heading 3'},
		{Value: 'quote', Label: 'Quote'},
		{Value: 'codeblock', Label: 'Code'}
	],
	RichFormats: {},
	RichLink: '',
	RichNote: 'Paragraph',
	RichMarkdownShown: false,
	RichMarkdown: '',
	RichFromMarkdown: false,
	LineCount: 3,
	ColumnGroups: [
		{ID: 'productivity', Title: 'Productivity', Stack: 0, Columns: 4, Tiles: [{ID: 'c-mail', Title: 'Mail', Icon: 'mail', Size: 'medium', Color: '#3f6c9e'}, {ID: 'c-calendar', Title: 'Calendar', Icon: 'calendar', Size: 'medium', Color: '#2f8f83'}]},
		{ID: 'play', Title: 'Play', Stack: 0, Columns: 4, Tiles: [{ID: 'c-music', Title: 'Music', Icon: 'play', Size: 'wide', Color: '#c2477f'}]},
		{ID: 'explore', Title: 'Explore', Stack: 1, Columns: 4, Tiles: [{ID: 'c-store', Title: 'Store', Icon: 'cart', Size: 'medium', Color: '#9a6514'}, {ID: 'c-maps', Title: 'Maps', Icon: 'map-pin', Size: 'medium', Color: '#5f5a54'}]}
	],

	TileGroups: [
		{ID: 'work', Title: 'Work', Tiles: [
			{ID: 'mail', Title: 'Mail', Icon: 'mail', Size: 'wide', Text: '3 unread', Badge: 3, Color: '#2b5797'},
			{ID: 'calendar', Title: 'Calendar', Icon: 'calendar', Size: 'medium', Color: '#7a4fb0'},
			{ID: 'tasks', Title: 'Tasks', Icon: 'check', Size: 'medium', Color: '#3d7a54'},
			{ID: 'chat', Title: 'Chat', Icon: 'send', Size: 'small', Color: '#c2477f'},
			{ID: 'phone', Title: 'Phone', Icon: 'phone', Size: 'small', Color: '#0f8fae'}
		]},
		{ID: 'tools', Title: 'Tools', Actions: [{ID: 'rename', Icon: 'edit', Title: 'Rename'}, {ID: 'add', Icon: 'add', Title: 'Add a tile'}], Tiles: [
			{ID: 'terminal', Title: 'Terminal', Icon: 'terminal', Size: 'medium'},
			{ID: 'settings', Title: 'Settings', Icon: 'settings', Size: 'small', Color: '#5f5a54', Locked: true},
			{ID: 'database', Title: 'Database', Icon: 'database', Size: 'small', Color: '#2f8f83'},
			{ID: 'cloud', Title: 'Deployments', Icon: 'cloud', Size: 'large', Text: 'All 12 services are healthy.', Color: '#3f6c9e'}
		]}
	],
	ClockTime: '',
	Stars: 3.5,
	CalendarNote: '',
	CalendarView: 'month',
	CalendarDate: '',
	Agenda: [],
	Months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	Revenue: [
		{Name: 'Revenue', Values: [42, 48, 51, 49, 58, 64, 61, 67, 72, 70, 78, 86]},
		{Name: 'Costs', Values: [30, 31, 35, 34, 38, 40, 42, 41, 45, 47, 49, 52]}
	],
	Quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
	Products: [
		{Name: 'Cloud', Values: [32, 41, 46, 58]},
		{Name: 'Desktop', Values: [24, 22, 25, 21]},
		{Name: 'Support', Values: [8, 11, 12, 15]}
	],
	Browsers: ['Chrome', 'Safari', 'Edge', 'Firefox', 'Other'],
	BrowserShare: [{Name: 'Share', Values: [64, 19, 6, 4, 7]}],
	Weeks: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
	Traffic: [
		{Name: 'Visits', Values: [120, 132, 101, 154, 190, 230, 210, 260]},
		{Name: 'Sign-ups', Values: [12, 18, 9, 21, 30, 41, 33, 48]}
	],
	Spark: [4, 6, 5, 8, 7, 9, 12, 10, 13, 15, 14, 18],
	TreeState: 'Nothing selected',
	TreeValue: null,
	TreeExpanded: ['src'],
	TreeChecked: [],
	TreeLoading: [],
	TreeItems: [
		{ID: 'src', Label: 'src', Icon: 'folder-open', Items: [
			{ID: 'components', Label: 'components', Icon: 'folder', Items: [
				{ID: 'button', Label: 'Button.js', Icon: 'file-code'},
				{ID: 'table', Label: 'Table.js', Icon: 'file-code'},
				{ID: 'tree', Label: 'Tree.js', Icon: 'file-code', Badge: 'new'}
			]},
			{ID: 'services', Label: 'services', Icon: 'folder', Items: [
				{ID: 'theme', Label: 'Theme.js', Icon: 'file-code'},
				{ID: 'toast', Label: 'Toast.js', Icon: 'file-code'}
			]},
			{ID: 'index', Label: 'index.js', Icon: 'file-code'}
		]},
		{ID: 'remote', Label: 'remote (loads on open)', Icon: 'cloud', Lazy: true},
		{ID: 'locked', Label: 'locked.bin', Icon: 'lock', Disabled: true},
		{ID: 'readme', Label: 'README.md', Icon: 'file-text'}
	],
	VirtualState: 'Pick a row',
	LongList: [],
	PeoplePage: 1,
	ResultsPage: 1,
	FilterColumns: [
		{Key: 'Name', Title: 'Name', Sortable: true, Filter: 'text'},
		{Key: 'Role', Title: 'Role', Sortable: true, Filter: 'select'},
		{Key: 'Commits', Title: 'Commits', Sortable: true, Align: 'right', Filter: 'number'}
	],
	ManyPeople: [],
	SizeColumns: [
		{Key: 'Name', Title: 'Name', Sortable: true},
		{Key: 'Kind', Title: 'Kind'},
		{Key: 'Size', Title: 'Size', Align: 'right', Sortable: true, Format: function (value) {
			return value == null ? '' : value + ' KB';
		}}
	],
	FileRows: [
		{ID: 'src', Name: 'src', Kind: 'Folder', Size: 184, Items: [
			{ID: 'src-components', Name: 'components', Kind: 'Folder', Size: 120, Items: [
				{ID: 'src-button', Name: 'Button.js', Kind: 'Script', Size: 12},
				{ID: 'src-table', Name: 'Table.js', Kind: 'Script', Size: 96},
				{ID: 'src-tree', Name: 'Tree.js', Kind: 'Script', Size: 12}
			]},
			{ID: 'src-index', Name: 'index.js', Kind: 'Script', Size: 64}
		]},
		{ID: 'docs', Name: 'docs', Kind: 'Folder', Size: 40, Items: [
			{ID: 'docs-api', Name: 'API.md', Kind: 'Text', Size: 32},
			{ID: 'docs-style', Name: 'STYLE.md', Kind: 'Text', Size: 8}
		]},
		{ID: 'package', Name: 'package.json', Kind: 'Data', Size: 2}
	],
	Topics: ['design', 'tokens'],
	TopicSuggestions: ['accessibility', 'animation', 'api', 'components', 'design', 'docs', 'performance', 'testing', 'theming', 'tokens'],
	InviteState: '',
	Framework: 'elemenx',
	Frameworks: [
		{Value: 'elemenx', Label: 'Elemenx', Hint: 'ES5', Group: 'Ours'},
		{Value: 'react', Label: 'React', Group: 'Others'},
		{Value: 'vue', Label: 'Vue', Group: 'Others'},
		{Value: 'svelte', Label: 'Svelte', Group: 'Others'},
		{Value: 'angular', Label: 'Angular', Group: 'Others', Disabled: true}
	],
	Cities: [],
	CitiesLoading: false,
	Period: [],
	LastCommand: '',
	PaletteOpen: false,
	PaletteKeys: '',
	DrawerOpen: false,
	TourOpen: false,
	TourStep: 0,
	TourSteps: [
		{Target: '#ui-kit-commands', Title: 'Commands', Text: 'Every action of the page is one search away: open the palette with its button or its keys.', Placement: 'bottom'},
		{Target: '#ui-kit-context', Title: 'Context menu', Text: 'Right click a file to act on it; the keyboard opens it too.', Placement: 'right'},
		{Target: '#ui-kit-copy', Title: 'Copy', Text: 'The button copies the token and says so.', Placement: 'left'}
	],
	ContextFiles: ['README.md', 'app.js', 'styles.css', 'logo.svg'],
	ContextFile: '',
	FileMenu: [
		{ID: 'open', Label: 'Open', Icon: 'external', Shortcut: 'Enter'},
		{ID: 'rename', Label: 'Rename', Icon: 'edit', Shortcut: 'F2'},
		{ID: 'copy-path', Label: 'Copy path', Icon: 'copy'},
		{Separator: true, ID: 'separator'},
		{ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true, Shortcut: 'Delete'}
	],
	ApiToken: 'exn_live_7f3a9c21b8d04e65',
	Shortcuts: [],
	Commands: [],
	BiometricState: 'Checking…',
	UseBiometric: false,
	IdleState: 'stopped',
	PermissionList: [
		{Name: 'notifications', State: '…'},
		{Name: 'geolocation', State: '…'},
		{Name: 'camera', State: '…'},
		{Name: 'clipboard-read', State: '…'}
	],
	ClockDate: '',
	Plays: 0,
	ShowNews: false,
	CustomSteps: [
		{ID: 'upload', Label: 'Upload', Icon: 'upload', Class: 'ui-kit-upload-step', Render: function (container) {
			var bar = document.createElement('div');
			var fill = document.createElement('div');

			bar.className = 'ui-kit-toast-bar';
			fill.className = 'ui-kit-toast-fill';

			bar.appendChild(fill);
			container.appendChild(bar);
		}},
		{ID: 'scan', Label: 'Scan', Description: 'Disabled: not clickable', Icon: 'search', Disabled: true},
		{ID: 'publish', Label: 'Publish', Icon: 'send'}
	],
	CustomStep: 'upload',
	OpenedTile: '',
	MosaicLayout: 'bento',
	MosaicLayouts: [{Value: 'bento', Label: 'Bento'}, {Value: 'masonry', Label: 'Masonry'}, {Value: 'justified', Label: 'Justified'}, {Value: 'treemap', Label: 'Treemap'}],
	MosaicChosen: '',
	SignatureSamples: [],
	CalculatorNote: 'Calculator · BusinessCalculator · CalculatorField · CalculatorResult: type on the keys or the keyboard',
	LoanFields: [
		{ID: 'Amount', Label: 'Amount', Type: 'money', Value: 20000, Min: 0, Step: 500},
		{ID: 'Rate', Label: 'Rate a year', Type: 'percent', Value: 6, Min: 0, Step: 0.1},
		{ID: 'Months', Label: 'Months', Type: 'range', Value: 36, Min: 6, Max: 120, Step: 6, Unit: 'months'}
	],
	QuizNote: 'Quiz · QuizQuestion · QuizOption: single, multiple, text, number and order',
	QuizQuestions: [
		{ID: 'largest', Text: 'The largest planet?', Options: [{ID: 'jupiter', Text: 'Jupiter', Correct: true}, {ID: 'saturn', Text: 'Saturn'}, {ID: 'neptune', Text: 'Neptune'}], Explanation: 'Jupiter holds more than twice the mass of the other planets together.'},
		{ID: 'rings', Text: 'Which have rings?', Type: 'multiple', Options: [{ID: 'saturn', Text: 'Saturn', Correct: true}, {ID: 'uranus', Text: 'Uranus', Correct: true}, {ID: 'mars', Text: 'Mars'}]},
		{ID: 'moons', Text: 'How many moons has Mars?', Type: 'number', Answer: 2}
	],
	LandingNote: 'Experiment · Variant · LandingHero · LandingFeatures · LandingStats · LandingTestimonials · LandingFAQ · LandingCTA',
	LandingVisitor: 'direct',
	LandingVisitors: [{Value: 'direct', Label: 'Direct'}, {Value: 'google', Label: 'Google ads'}, {Value: 'newsletter', Label: 'Newsletter'}],
	LandingActions: [{ID: 'start', Label: 'Start free', Goal: 'start'}, {ID: 'demo', Label: 'See a demo', Variant: 'secondary'}],
	LandingFinal: [{ID: 'signup', Label: 'Create an account', Goal: 'signup', Experiment: 'ui-kit-landing'}],
	LandingStatsItems: [{ID: 'components', Value: 200, Suffix: '+', Label: 'Components'}, {ID: 'size', Value: 1, Label: 'File of the core'}, {ID: 'dependencies', Value: 0, Label: 'Dependencies'}, {ID: 'support', Value: 99.9, Suffix: '%', Label: 'Of the browsers in use'}],
	LandingFeaturesItems: [
		{ID: 'one', Icon: 'file-code', Title: 'One file', Text: 'The core is one ES5 file: no build step, no lock file to update.'},
		{ID: 'library', Icon: 'grid', Title: 'A library', Text: 'Forms, tables, charts, editors, games and landings, themed by tokens.'},
		{ID: 'native', Icon: 'monitor', Title: 'Native', Text: 'The same application as a site, a PWA, a desktop or a phone application.'}
	],
	LandingQuotes: [
		{ID: 'ada', Text: 'We moved a back office in a week and kept every page working.', Name: 'Ada Lovelace', Role: 'CTO, Analytical', Rating: 5},
		{ID: 'alan', Text: 'The tables and the forms cover what we used three libraries for.', Name: 'Alan Turing', Role: 'Lead, Bombe', Rating: 4.5},
		{ID: 'grace', Text: 'No build step: a fix is a save and a reload.', Name: 'Grace Hopper', Role: 'Engineer, COBOL', Rating: 5}
	],
	LandingQuestions: [
		{ID: 'free', Question: 'Is it free?', Answer: 'Yes: the core and the library are open source.'},
		{ID: 'browsers', Question: 'Which browsers does it run in?', Answer: 'The ones in use: Chrome, Edge, Firefox and Safari of the last years.'},
		{ID: 'variants', Question: 'How are the variants of this landing chosen?', Answer: 'By the source of the visit, its language and device, or by an A/B split kept for the visitor.\nA link forces one: ?variant=ui-kit-landing:bold.'}
	],
	PipelineNote: 'Pipeline · PipelineStage · PipelineJob: hover a job for its chain, press a group to open it',
	PipelineStages: [
		{ID: 'build', Name: 'Build', Jobs: [
			{ID: 'compile', Name: 'Compile', Status: 'success', Duration: 72},
			{ID: 'image', Name: 'Docker image', Status: 'success', Duration: 141}
		]},
		{ID: 'test', Name: 'Test', Jobs: [
			{ID: 'unit', Name: 'Unit', Status: 'success', Duration: 125, Needs: ['compile']},
			{ID: 'node-18', Name: 'Node 18', Status: 'success', Duration: 98, Group: 'node matrix', Needs: ['compile']},
			{ID: 'node-20', Name: 'Node 20', Status: 'warning', Duration: 103, Group: 'node matrix', Needs: ['compile']},
			{ID: 'node-22', Name: 'Node 22', Status: 'success', Duration: 95, Group: 'node matrix', Needs: ['compile']},
			{ID: 'e2e', Name: 'End to end', Status: 'running', Started: Date.now() - 83000, Needs: ['image']},
			{ID: 'lint', Name: 'Lint', Status: 'failed', Duration: 12, Text: '3 problems'}
		]}
	],
	SampleTimer: 0,
	DashboardNav: [
		{ID: 'overview', Label: 'Overview', Icon: 'home'},
		{ID: 'projects', Label: 'Projects', Icon: 'folder', Badge: 12},
		{ID: 'builds', Label: 'Builds', Icon: 'play'},
		{ID: 'people', Label: 'People', Icon: 'users'},
		{ID: 'settings', Label: 'Settings', Icon: 'settings'}
	],
	DashboardPage: 'overview',
	MenuOpen: false,
	MenuPage: 'overview',
	MenuSide: 'left',
	MenuSides: [
		{Value: 'left', Label: 'Left'},
		{Value: 'right', Label: 'Right'}
	],
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

	/* Asks before a guarded field shows what it hides, as a banking application asks for a fingerprint. */
	ConfirmReveal: function (request) {
		if (this.UseBiometric) return;

		this.$Service('Toast').Show({
			Title: 'Confirm it is you',
			Message: 'Touch the sensor to show the ' + ({card: 'card number', cvv: 'security code'}[request.Kind] || 'value') + '.',
			Icon: 'lock',
			AutoHide: false,
			Closable: false,
			Actions: [{Label: 'Use fingerprint', Variant: 'primary', Run: request.Allow}, {Label: 'Cancel', Run: request.Deny}]
		});
	},

	$OnDestroy: function () {
		var hotkeys = this.$Service('Hotkeys');

		hotkeys.Unbind(this.ThemeKey);
		hotkeys.Unbind(this.TilesKey);
		hotkeys.OffChange(this.ShortcutsListener);

		this.$Service('Idle').Stop();

		window.clearInterval(this.PipClock);
		window.clearInterval(this.MixerTimer);

		this.$Service('Reveal').Guard(null);
		this.$Service('Icons').Override('save', null);
		this.$Service('Theme').OffChange(this.ThemeListener);
		this.$Service('Platform').Off('menu', this.NativeListener);

		if (this.$Service('Theme').Theme() === 'mine')
			this.$Service('Theme').Use('default');

		this.MineStyle.parentNode.removeChild(this.MineStyle);
	},

	/* The theme picker follows the Theme Service; Mine is a theme of the page, written by the editor into a <style>. */
	WatchTheme: function () {
		var self = this;
		var theme = this.$Service('Theme');

		this.MineCSS = function (accent, background, radius, control) {
			var theme = self.$Service('Theme');

			return "[data-theme][data-theme='mine'] {\n" +
				'\t--elemenx-accent: ' + accent + ';\n' +
				'\t--elemenx-accent-rgb: ' + theme.Channels(accent) + ';\n' +
				'\t--elemenx-accent-hover: ' + self.Mix(accent, '#000000', 0.84) + ';\n' +
				'\t--elemenx-background: ' + background + ';\n' +
				'\t--elemenx-background-rgb: ' + theme.Channels(background) + ';\n' +
				'\t--elemenx-surface-raised: ' + self.Mix(background, '#ffffff', 0.5) + ';\n' +
				'\t--elemenx-radius-small: ' + Math.round(radius / 2) + 'px;\n' +
				'\t--elemenx-radius: ' + radius + 'px;\n' +
				'\t--elemenx-radius-large: ' + radius * 2 + 'px;\n' +
				'\t--elemenx-control-small: ' + (control - 8) + 'px;\n' +
				'\t--elemenx-control: ' + control + 'px;\n' +
				'\t--elemenx-control-large: ' + (control + 8) + 'px;\n' +
				'}\n';
		};

		this.MineStyle = document.createElement('style');

		this.MineStyle.setAttribute('data-ui-kit-theme', 'mine');

		document.head.appendChild(this.MineStyle);

		this.WriteMine();

		theme.Register('mine', {Label: 'Mine', Schemes: ['light']});

		this.ThemeOptions = theme.Themes().map(function (item) {
			return {Value: item.Name, Label: item.Label, Hint: item.Schemes.join(', ')};
		});

		this.ThemeListener = theme.OnChange(function (state) {
			self.ShowTheme(state.Name, state.Policy, state.Theme);
		});

		this.ShowTheme(theme.Theme(), theme.Policy(), theme.Resolved());
	},

	/* A mix of two hex colors: weight of the first, the rest of the second. */
	Mix: function (first, second, weight) {
		var a = this.$Service('Theme').Channels(first).split(', ');
		var b = this.$Service('Theme').Channels(second).split(', ');

		return '#' + a.map(function (channel, index) {
			return ('0' + Math.round(Number(channel) * weight + Number(b[index]) * (1 - weight)).toString(16)).slice(-2);
		}).join('');
	},

	ShowTheme: function (name, policy, scheme) {
		this.ThemeName = name;
		this.ThemePolicy = policy;
		this.ThemeScheme = scheme;
	},

	WriteMine: function () {
		this.MineStyle.textContent = this.MineCSS(this.MineAccent, this.MineBackground, this.MineRadius, this.MineControl);
	},

	ThemeChosen: function (value) {
		this.$Service('Theme').Use(value);
	},

	PolicyChosen: function (value) {
		this.$Service('Theme').Policy(value);
	},

	MineAccentEdited: function (value) {
		this.MineAccent = value;

		this.WriteMine();
	},

	MineBackgroundEdited: function (value) {
		this.MineBackground = value;

		this.WriteMine();
	},

	MineRadiusEdited: function (value) {
		this.MineRadius = value;

		this.WriteMine();
	},

	MineControlEdited: function (value) {
		this.MineControl = value;

		this.WriteMine();
	},

	UseMine: function () {
		this.$Service('Theme').Use('mine');
	},

	TableToggled: function (value) {
		this.TableSelected = value;

		if (value)
			this.RibbonTab = 'table-design';
	},

	RibbonTabChanged: function (tab) {
		this.RibbonTab = tab.ID;
	},

	RibbonCommand: function (command) {
		this.RibbonNote = command.ID + (command.Item ? ' → ' + (command.Item.Label || command.Item.ID) : '');
	},

	RibbonCollapseChanged: function (state) {
		this.RibbonCollapsed = state.Collapsed;
	},

	RibbonLaunched: function (group) {
		this.RibbonNote = group.Title + ' options';
	},

	FontChanged: function (value) {
		this.Font = value;
	},

	FontSizeChanged: function (value) {
		this.FontSize = value;
	},

	BoldToggled: function (state) {
		this.Bold = state.Pressed;
	},

	TextStyleChosen: function (choice) {
		this.TextStyle = choice.ID;
	},

	/* The music and weather sets list their names once they load; the brand set comes from markup. */
	LoadIcons: function () {
		var self = this;
		var icons = this.$Service('Icons');
		var themed;
		var loaded;

		icons.Register('brand', this.BrandIcons);

		this.$Service('Stickers').Register(this.StickerPack);
		this.$Service('Emoji').LoadLanguage('ru');

		icons.Load('music', function (error, names) {
			if (!error)
				self.MusicIcons = self.Prefixed('music', names);
		});

		icons.Load('brands', function (error, names) {
			if (!error)
				self.BrandLogos = self.Prefixed('brands', names);
		});

		/*
		 * The six themed sets, in the order of the catalogue, listed together once the last one loads: every change of the
		 * state draws the whole catalogue again, so six sets are one change, not six.
		 */
		themed = ['sport', 'racing', 'science', 'art', 'cinema', 'games'];
		loaded = [];

		themed.forEach(function (set, index) {
			icons.Load(set, function (error, names) {
				loaded[index] = error ? null : {Name: set, Icons: self.Prefixed(set, names)};

				if (loaded.filter(function (entry) {
					return entry !== undefined;
				}).length === themed.length)
					self.ThemedSets = loaded.filter(Boolean);
			});
		});

		icons.Load('weather', function (error, names) {
			if (!error)
				self.WeatherIcons = self.Prefixed('weather', names);
		});
	},

	Prefixed: function (set, names) {
		var list = [];
		var i = 0;

		while (i < names.length) {
			list.push(set + ':' + names[i]);

			i++;
		}

		return list;
	},

	ToggleBrandColors: function () {
		this.BrandsColored = !this.BrandsColored;
	},

	ToggleWeatherColors: function () {
		this.WeatherColored = !this.WeatherColored;
	},

	/* Every save icon of the page draws the brand disk instead, and back. */
	ToggleBrandSave: function () {
		this.BrandSave = !this.BrandSave;

		this.$Service('Icons').Override('save', this.BrandSave ? 'brand:disk' : null);
	},

	GoTo: function (title) {
		var sections = document.querySelectorAll('.ui-kit > .elemenx-section');
		var i = 0;

		while (i < sections.length) {
			if (sections[i].querySelector('.elemenx-section-title').textContent === title)
				sections[i].scrollIntoView({block: 'start'});

			i++;
		}
	},

	OpenPalette: function () {
		this.PaletteOpen = true;
	},

	PaletteClosed: function () {
		this.PaletteOpen = false;
	},

	CommandRun: function (command) {
		this.LastCommand = command.Label;
	},

	HotkeyToast: function () {
		this.LastCommand = 'Show a toast';

		this.$Service('Toast').Show({Message: 'A toast from Alt+N', Variant: 'info'});
	},

	OpenDrawer: function () {
		this.DrawerOpen = true;
	},

	CloseDrawer: function () {
		this.DrawerOpen = false;
	},

	/* The side menu: a Drawer with a NavList; a page closes it, Filters opens another Drawer over it. */
	OpenMenu: function () {
		this.MenuOpen = true;
	},

	CloseMenu: function () {
		this.MenuOpen = false;
	},

	MenuSideChanged: function (value) {
		this.MenuSide = value;
	},

	MenuPicked: function (item) {
		this.MenuPage = item.ID;
		this.MenuOpen = false;
		this.LastCommand = 'Menu: ' + item.Label;
	},

	StartTour: function () {
		this.TourStep = 0;
		this.TourOpen = true;
	},

	TourChanged: function (step) {
		this.TourStep = step;
	},

	TourClosed: function (reason) {
		this.TourOpen = false;
		this.LastCommand = 'Tour: ' + reason;
	},

	ContextOpened: function (event) {
		var row = event.Target && event.Target.closest('[data-file]');

		this.ContextFile = row ? row.getAttribute('data-file') : '';
	},

	ContextPicked: function (event) {
		this.LastCommand = event.Item.Label + (this.ContextFile ? ' ' + this.ContextFile : '');
	},

	CheckBiometric: function () {
		var self = this;

		this.BiometricState = 'Waiting for the check…';

		this.$Service('Biometric').Check(function (error, passed) {
			self.BiometricState = passed ? 'Passed' : 'Not passed' + (error ? ': ' + error.name : '');
		});
	},

	ForgetBiometric: function () {
		this.$Service('Biometric').Forget();

		this.BiometricState = 'This device is not registered';
	},

	BiometricToggled: function (checked) {
		this.UseBiometric = checked;

		this.$Service('Reveal').Guard(checked ? this.$Service('Biometric').Guard() : null);
	},

	StartIdle: function () {
		var self = this;

		this.IdleState = 'active';

		this.$Service('Idle').Start({
			Timeout: 6000,
			Warning: 3000,
			OnWarn: function (remaining) {
				self.IdleState = 'warning: ' + Math.ceil(remaining / 1000) + ' s left';
			},
			OnIdle: function () {
				self.IdleState = 'idle (here the session would end)';
			},
			OnActive: function () {
				self.IdleState = 'active';
			}
		});
	},

	StopIdle: function () {
		this.$Service('Idle').Stop();

		this.IdleState = 'stopped';
	},

	QueryPermission: function (name) {
		var self = this;

		this.$Service('Permissions').Query(name, function (error, state) {
			self.PermissionList = self.PermissionList.map(function (entry) {
				return entry.Name === name ? {Name: name, State: state} : entry;
			});
		});
	},

	AskPermission: function (event, node) {
		var self = this;
		var name = node.getAttribute('data-name');

		this.$Service('Permissions').Request(name, function () {
			self.QueryPermission(name);
		});
	},

	TopicsChanged: function (topics) {
		this.Topics = topics;
	},

	InvitesChanged: function (invites) {
		this.InviteState = invites.length + ' invited';
	},

	InviteRefused: function (event) {
		this.InviteState = '“' + event.Text + '”: ' + {pattern: 'not an e-mail address', duplicate: 'already there', max: 'too many'}[event.Reason];
	},

	FrameworkChanged: function (value) {
		this.Framework = value;
	},

	/* A pretend server: the cities that hold the text, after a short wait; the last request wins. */
	SearchCities: function (text) {
		var self = this;
		var names = ['Amsterdam', 'Athens', 'Berlin', 'Bucharest', 'Chisinau', 'Kyiv', 'Lisbon', 'London', 'Madrid', 'Paris', 'Prague', 'Riga', 'Rome', 'Vienna', 'Warsaw'];

		this.CitiesLoading = true;
		this.CitySearch = text;

		window.setTimeout(function () {
			if (self.CitySearch !== text) return;

			self.CitiesLoading = false;
			self.Cities = names.filter(function (name) {
				return name.toLowerCase().indexOf(String(text).trim().toLowerCase()) !== -1;
			}).map(function (name) {
				return {Value: name.toLowerCase(), Label: name};
			});
		}, 250);
	},

	PeriodChanged: function (range) {
		this.Period = range;
	},

	/* Events around today, so that the calendar always has some to show. */
	Schedule: function (now) {
		function day (offset) {
			var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);

			return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
		}

		return [
			{ID: 'standup', Title: 'Stand-up', Start: day(0) + 'T09:30', End: day(0) + 'T09:45', Color: '#2f8f83'},
			{ID: 'review', Title: 'Design review', Start: day(0) + 'T10:00', End: day(0) + 'T11:30', Color: '#7a4fb0'},
			{ID: 'pairing', Title: 'Pairing', Start: day(0) + 'T10:30', End: day(0) + 'T12:00', Color: '#c2477f'},
			{ID: 'release', Title: 'Release 2.0', Start: day(1), AllDay: true, Color: '#d25f3a'},
			{ID: 'offsite', Title: 'Team offsite', Start: day(3), End: day(5), Color: '#3f6c9e'},
			{ID: 'retro', Title: 'Retrospective', Start: day(2) + 'T15:00', End: day(2) + 'T16:00'},
			{ID: 'one', Title: 'One-to-one', Start: day(0) + 'T14:00', End: day(0) + 'T14:30'},
			{ID: 'lunch', Title: 'Lunch talk', Start: day(0) + 'T12:30', End: day(0) + 'T13:15', Color: '#5f7d2e'},
			{ID: 'deploy', Title: 'Night deploy', Start: day(6) + 'T22:00', End: day(7) + 'T02:00', Color: '#b8860b'},
			{ID: 'party', Title: 'Launch party', Start: day(9) + 'T20:00', End: day(10) + 'T00:00', Color: '#c2477f'},
			{ID: 'conference', Title: 'Conference', Start: day(8) + 'T09:00', End: day(10) + 'T18:00', Color: '#2f8f83'},
			{ID: 'vacation', Title: 'Vacation', Start: day(12), End: day(25), Color: '#5f7d2e'},
			{ID: 'gym', Title: 'Gym', Start: day(1) + 'T07:00', End: day(1) + 'T08:00', Repeat: {Every: 'week', Days: ['TU', 'TH', 'SA'], Count: 24}},
			{ID: 'report', Title: 'Monthly report', Start: day(-20), AllDay: true, Repeat: 'FREQ=MONTHLY;COUNT=12', Color: '#7a4fb0'}
		];
	},

	StarsChanged: function (value) {
		this.Stars = value;
	},

	CalendarChanged: function (state) {
		this.CalendarView = state.View;
		this.CalendarDate = state.Date;
	},

	/* The calendar asks; the page moves the event in its list. */
	AgendaMoved: function (change) {
		/* An occurrence of a weekly event moves alone: its day is left out of the series, it becomes an event of its own (the monthly one, an RRULE, moves whole). */
		if (change.Occurrence && typeof change.Event.Repeat === 'object') {
			this.Agenda = this.Agenda.map(function (event) {
				var copy = {};
				var key;

				if (event.ID !== change.Event.ID) return event;

				for (key in event) {
					if (Object.prototype.hasOwnProperty.call(event, key))
						copy[key] = event[key];
				}

				copy.Repeat = {Every: event.Repeat.Every, Days: event.Repeat.Days, Count: event.Repeat.Count, Except: (event.Repeat.Except || []).concat([change.Occurrence])};

				return copy;
			}).concat([{ID: change.Event.ID + '-' + change.Occurrence, Title: change.Event.Title, Start: change.Start, End: change.End, AllDay: change.Event.AllDay, Color: change.Event.Color}]);
			this.CalendarNote = 'Moved: ' + change.Event.Title + ' (' + change.Occurrence + ') → ' + change.Start.replace('T', ' ');

			return;
		}

		this.Agenda = this.Agenda.map(function (event) {
			var moved = {};
			var key;

			if (event.ID !== change.Event.ID) return event;

			for (key in event) {
				if (Object.prototype.hasOwnProperty.call(event, key))
					moved[key] = event[key];
			}

			moved.Start = change.Start;
			moved.End = change.End;

			return moved;
		});

		this.CalendarNote = 'Moved: ' + change.Event.Title + ' → ' + change.Start.replace('T', ' ') + (change.End ? ' – ' + String(change.End).replace('T', ' ') : '');
	},

	AgendaPicked: function (event) {
		this.CalendarNote = 'Event: ' + event.Title;
	},

	DayPicked: function (date) {
		this.CalendarNote = 'Day: ' + date;
	},

	SlotPicked: function (slot) {
		this.CalendarNote = 'Slot: ' + slot.Date + ' ' + slot.Time;
	},

	/* Items 1 to count, for the long list. */
	Numbers: function (count) {
		var items = [];
		var i = 1;

		while (i <= count) {
			items.push({ID: i, Label: 'Row ' + i, Hint: '#' + (i * 7919 % 100000), Icon: i % 10 === 0 ? 'star' : 'file'});

			i++;
		}

		return items;
	},

	/* count people with names, roles and commits that look real enough. */
	Staff: function (count) {
		var first = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Ken', 'Barbara', 'Donald', 'Edsger', 'Frances'];
		var last = ['Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Hamilton', 'Thompson', 'Liskov', 'Knuth', 'Dijkstra', 'Allen'];
		var roles = ['Maintainer', 'Reviewer', 'Contributor'];
		var people = [];
		var i = 0;

		while (i < count) {
			people.push({ID: i + 1, Name: first[i % 10] + ' ' + last[(i * 3 + 1) % 10], Role: roles[i % 3], Commits: (i * 137) % 1000});

			i++;
		}

		return people;
	},

	TreeSelected: function (item) {
		this.TreeValue = item.ID;
		this.TreeState = 'Selected: ' + item.Label;
	},

	TreeExpandedChanged: function (ids) {
		this.TreeExpanded = ids;
	},

	TreeCheckedChanged: function (ids) {
		this.TreeChecked = ids;
		this.TreeState = 'Checked: ' + ids.length;
	},

	/* A pretend server: the children of a lazy item come after a moment. */
	TreeLoad: function (item) {
		var self = this;

		this.TreeLoading = [item.ID];

		window.setTimeout(function () {
			self.TreeLoading = [];
			self.TreeItems = self.TreeItems.map(function (entry) {
				return entry.ID !== item.ID ? entry : {ID: entry.ID, Label: 'remote', Icon: 'cloud', Items: [
					{ID: 'remote-a', Label: 'backup-1.zip', Icon: 'archive'},
					{ID: 'remote-b', Label: 'backup-2.zip', Icon: 'archive'}
				]};
			});
		}, 300);
	},

	LongPicked: function (item) {
		this.VirtualState = 'Picked: ' + item.Label;
	},

	/* The settings of the SettingsMenu demos: a fresh copy for each, as a menu turns its own switches and choices. */
	SettingsItems: function () {
		return [
			{ID: 'account', Label: 'Alex Furnica', Description: 'Account, cloud and purchases', Icon: 'user', Color: '#8e8e93', Items: [
				{Group: 'Account'},
				{ID: 'name', Label: 'Name', Value: 'Alex'},
				{ID: 'mail', Label: 'Mail', Value: 'alex@example.com'}
			]},
			{Group: 'Connections'},
			{ID: 'airplane', Label: 'Airplane mode', Icon: 'send', Color: '#ff9500', Toggle: true},
			{ID: 'wifi', Label: 'Wi-Fi', Icon: 'globe', Color: '#007aff', Value: 'Home', Choice: true, Items: [
				{Group: 'Networks', Note: 'Known networks join on their own.'},
				{ID: 'home', Label: 'Home', Checked: true},
				{ID: 'office', Label: 'Office'},
				{ID: 'guest', Label: 'Guest'}
			]},
			{ID: 'notifications', Label: 'Notifications', Icon: 'bell', Color: '#ff3b30', Badge: 2, Items: [
				{ID: 'sounds', Label: 'Sounds', Toggle: true, Checked: true},
				{ID: 'previews', Label: 'Show previews', Value: 'Always', Choice: true, Items: [
					{ID: 'always', Label: 'Always', Checked: true},
					{ID: 'unlocked', Label: 'When unlocked'},
					{ID: 'never', Label: 'Never'}
				]}
			]},
			{Group: 'Display', Note: 'Dark mode can follow the time of day.'},
			{ID: 'dark', Label: 'Dark mode', Icon: 'moon', Color: '#5856d6', Toggle: true},
			{ID: 'lock', Label: 'Auto-lock', Description: 'Locks the screen while idle', Icon: 'lock', Color: '#34c759', Value: '30 seconds', Choice: true, Items: [
				{ID: '30', Label: '30 seconds', Checked: true},
				{ID: '60', Label: '1 minute'},
				{ID: 'never', Label: 'Never'}
			]},
			{Group: ''},
			{ID: 'beta', Label: 'Beta features', Disabled: true},
			{ID: 'reset', Label: 'Reset all settings', Danger: true}
		];
	},

	SettingsVariantChosen: function (value) {
		this.SettingsVariant = value;
	},

	KeepToggled: function () {
		this.KeepShown = !this.KeepShown;
	},

	KeepStats: function () {
		var stats = Elemenx.Cache.Stats();

		this.KeepNote = 'Asleep: ' + (stats.Instances.map(function (entry) {
			return entry.Name;
		}).join(', ') || 'nothing');
	},

	MixerChanged: function (detail) {
		this.MusicNote = detail.ID + ' ' + detail.Key + ': ' + detail.Value;
	},

	/*
	 * The meters move while Play is on: random levels and their peaks, ten times a second. Nothing runs while it is
	 * off, so the catalogue costs nothing until then.
	 */
	MixerPlayed: function (value) {
		var self = this;
		var level = function (center) {
			return Math.round(center + Math.random() * 12 - 6);
		};
		var step = function (channel) {
			var levels = Array.isArray(channel.Level) ? [level(-14), level(-15)] : level(-14);
			var peaks = Array.isArray(channel.Level) ? levels.map(function (entry, index) {
				return Math.max(entry, (channel.Peak || [])[index] - 1 || entry);
			}) : Math.max(levels, (channel.Peak || levels) - 1);

			return Object.assign({}, channel, {Level: channel.Mute ? (Array.isArray(levels) ? [-60, -60] : -60) : levels, Peak: peaks});
		};

		this.MixerPlaying = value;

		window.clearInterval(this.MixerTimer);

		if (!value) return;

		this.MixerTimer = window.setInterval(function () {
			self.MixerChannels = self.MixerChannels.map(step);
			self.MixerMaster = step(self.MixerMaster);
		}, 100);
	},

	KeyPressed: function (detail) {
		this.KeyboardNote = 'Key ' + detail.Code;
	},

	NotePlayed: function (detail) {
		this.MusicNote = 'Playing ' + detail.Note + ' (velocity ' + detail.Velocity + ')';
	},

	NoteReleased: function (detail) {
		this.MusicNote = 'Released ' + detail.Note;
	},

	DialTyped: function (value) {
		this.DialNumber = value;
	},

	DialCalled: function (number) {
		this.DialNote = 'Calling ' + number;
	},

	TonePressed: function (state) {
		this.DialNote = 'Tone ' + state.Value;
	},

	/* The bar of the call: its state changed as it asks, what it tells shown in the header of the section. */
	CallToggled: function (name, value) {
		var state = {};
		var key;

		for (key in this.CallState) {
			if (Object.prototype.hasOwnProperty.call(this.CallState, key))
				state[key] = this.CallState[key];
		}

		state[name] = value;

		this.CallState = state;
		this.CallNote = name + ': ' + value;
	},

	CallMuted: function (detail) {
		this.CallToggled('Muted', detail.Muted);
	},

	CallFilmed: function (detail) {
		this.CallToggled('Camera', detail.Camera);
	},

	CallShared: function (detail) {
		this.CallToggled('Sharing', detail.Sharing);

		this.CallLayout = detail.Sharing ? 'screen' : 'grid';
	},

	CallRaised: function (detail) {
		this.CallToggled('Hand', detail.Hand);
	},

	CallReacted: function (detail) {
		this.CallNote = 'Reaction ' + detail.Emoji;
	},

	CallChatted: function (detail) {
		this.CallSide = detail.Open;
	},

	CallListed: function (detail) {
		this.CallSide = detail.Open;
	},

	CallLaidOut: function (detail) {
		this.CallLayout = detail.Layout;
	},

	CallDevice: function (detail) {
		var devices = {};
		var key;

		for (key in this.CallDevices) {
			if (Object.prototype.hasOwnProperty.call(this.CallDevices, key))
				devices[key] = this.CallDevices[key];
		}

		devices[detail.Kind.charAt(0).toUpperCase() + detail.Kind.substring(1)] = detail.ID;

		this.CallDevices = devices;
		this.CallNote = detail.Kind + ': ' + detail.ID;
	},

	CallLeft: function () {
		this.CallNote = 'Left the call';
	},

	/* The ground of the game: its scene kept for the buttons; trees where the ground is dry and gentle. */
	ModelsReady: function (scene) {
		var library = this.$Service('Models');
		var rows = [['unit', -34], ['animal', -22], ['vehicle', -22], ['plant', -2], ['rock', -2], ['building', 26]];
		var list = [];
		var teams = ['red', 'blue', 'green'];
		var x = -80;
		var last = '';

		this.ModelsScene = function () {
			return scene;
		};

		rows.forEach(function (row) {
			if (row[1] !== last)
				x = -80;

			last = row[1];

			library.Names({Type: row[0]}).forEach(function (name, index) {
				var size = library.Info(name).Size;

				x += size * 0.7 + 3;

				list.push({ID: 'model-' + name, Kind: name, X: Math.round(x), Y: row[1], Team: teams[index % teams.length]});

				x += size * 0.7 + 3;
			});
		});

		this.ModelsList = list;

		scene.Scene().Wanted = 90;
		scene.Scene().Pitch = 0.55;
	},

	ModelsPlay: function (clip) {
		var scene = this.ModelsScene ? this.ModelsScene() : null;
		if (!scene) return;

		this.ModelsNote = this.ModelsList.filter(function (model) {
			return scene.Play(model.ID, clip);
		}).length + ' playing ' + clip;
	},

	ModelsShadowed: function (value) {
		this.ModelsShadows = value;
	},

	ModelsMarch: function () {
		var scene = this.ModelsScene ? this.ModelsScene() : null;
		if (!scene) return;

		this.ModelsNote = this.ModelsList.filter(function (model) {
			return scene.Get(model.ID).Traits.Walker && scene.Move(model.ID, [model.X, model.Y - 18]);
		}).length + ' marching';
	},

	TerrainReady: function (scene) {
		var terrain = this.$Service('Terrain').Flat({Size: 900, Height: 55, Water: 0.32, Seed: 'valley'});
		var random = this.$Service('Random').Create('trees');
		var trees = [];
		var x;
		var y;
		var i;

		this.Terrained = function () {
			return scene;
		};

		for (i = 0; i < 400 && trees.length < 90; i++) {
			x = random.Float(-250, 250);
			y = random.Float(-250, 250);

			if (terrain.Height(x, y) > 2 && terrain.Slope(x, y) < 0.25 && Math.abs(x - 50) + Math.abs(y - 45) > 40)
				trees.push({ID: 'tree-' + i, X: Math.round(x), Y: Math.round(y)});
		}

		this.TerrainTrees = trees;

		scene.FocusOn('scout');
	},

	TerrainSelected: function (detail) {
		this.TerrainNote = detail.ID ? 'Selected: ' + detail.Object.Name + (detail.Object.Traits.Walker ? ' (a right click sends it)' : '') : 'Nothing selected';
	},

	TerrainLake: function () {
		var scene = this.Terrained ? this.Terrained() : null;
		var terrain = this.$Service('Terrain').Flat({Size: 900, Height: 55, Water: 0.32, Seed: 'valley'});
		var best = null;
		var x;
		var y;

		if (!scene) return;

		/* The nearest shore: dry ground beside the water, round the scout. */
		for (x = -200; x <= 200; x += 8) {
			for (y = -200; y <= 200; y += 8) {
				if (terrain.Height(x, y) > 0.5 && terrain.Height(x, y) < 2 && terrain.Slope(x, y) < 0.3 && (!best || Math.abs(x) + Math.abs(y) < Math.abs(best[0]) + Math.abs(best[1])))
					best = [x, y];
			}
		}

		this.TerrainNote = best && scene.Move('scout', best) ? 'Scout: to the lake at ' + best.join(', ') : 'No way to the lake';
	},

	TerrainVillage: function () {
		var scene = this.Terrained ? this.Terrained() : null;
		if (!scene) return;

		this.TerrainNote = ['scout', 'builder', 'ranger'].filter(function (id, index) {
			return scene.Move(id, [30 + index * 6, 48 + index * 4]);
		}).length + ' going to the village';
	},

	TerrainSave: function () {
		this.TerrainSaved = this.Terrained().Save();
		this.TerrainNote = 'Saved: ' + this.TerrainSaved.Objects.length + ' objects';
	},

	TerrainLoad: function () {
		this.Terrained().Load(this.TerrainSaved);

		this.TerrainNote = 'Loaded';
	},

	TerrainArrived: function (detail) {
		this.TerrainNote = this.Terrained().Get(detail.ID).Name + ' arrived at ' + detail.At.map(Math.round).join(', ');
	},

	/* The space of the game: its methods kept for the buttons, its day shown in its HUD. */
	SpaceReady: function (space) {
		var self = this;

		this.Spaced = function () {
			return space;
		};

		window.clearInterval(this.SpaceTimer);

		this.SpaceTimer = window.setInterval(function () {
			if (!space.$Element().isConnected) {
				window.clearInterval(self.SpaceTimer);

				return;
			}

			self.SpaceDay = Math.floor(space.Now());
		}, 500);
	},

	SpaceChosen: function (value) {
		this.SpaceSystem = value;
		this.SpaceNote = '';
	},

	SpaceReseeded: function () {
		this.SpaceSeed = 'seed-' + Math.floor(Math.random() * 100000);
	},

	SpaceOrbited: function (value) {
		this.SpaceOrbits = value;
	},

	SpaceScaled: function (value) {
		this.SpaceReal = value;
	},

	SpacePausedToggled: function () {
		this.SpacePaused = !this.SpacePaused;
	},

	SpaceSelected: function (detail) {
		this.SpaceNote = detail.ID ? 'Selected: ' + detail.Object.Name : 'Nothing selected';
	},

	SpaceFocused: function (detail) {
		this.SpaceNote = detail.ID ? 'Flying to ' + this.Spaced().Get(detail.ID).Name : 'The whole system';
	},

	SpaceSent: function () {
		var space = this.Spaced ? this.Spaced() : null;
		var fleet = space ? space.Get('first') : null;
		if (!fleet) return;

		space.Move('first', fleet.Parent === 'mars' ? 'earth' : 'mars');

		this.SpaceNote = 'First fleet: to ' + (fleet.Parent === 'mars' ? 'Earth' : 'Mars');
	},

	SpaceArrived: function (detail) {
		this.SpaceNote = 'Arrived: ' + this.Spaced().Get(detail.ID).Name + ' at ' + this.Spaced().Get(detail.At).Name;
	},

	/* The world of the game: its methods, kept for the buttons of the section. */
	WorldReady: function (world) {
		this.World = function () {
			return world;
		};
	},

	WorldProjected: function (value) {
		this.WorldProjection = value;
	},

	WorldFogged: function (value) {
		this.WorldFog = value;
	},

	WorldSelected: function (detail) {
		this.WorldNote = detail.IDs.length ? detail.IDs.length + ' selected: ' + detail.IDs.join(', ') : 'Nothing selected';
	},

	WorldOrdered: function (detail) {
		this.WorldNote = detail.Kind === 'stop' ? 'Stop: ' + detail.IDs.join(', ') : detail.Kind + ' to ' + detail.X + ', ' + detail.Y + ': ' + detail.IDs.length + ' units';
	},

	WorldArrived: function (detail) {
		this.WorldNote = 'Arrived: ' + detail.ID;
	},

	WorldCell: function (detail) {
		this.WorldNote = 'Cell ' + detail.X + ', ' + detail.Y + (detail.Object ? ' · ' + detail.Object.ID : '');
	},

	WorldCentered: function () {
		if (this.World)
			this.World().CenterOn(6.5, 3.5);
	},

	/* A unit added by the code, by the barracks: the methods of the world, beside what its template declares. */
	WorldRecruited: function () {
		var world = this.World ? this.World() : null;
		var unit;

		if (!world) return;

		this.WorldAdded++;

		unit = world.Add({ID: 'recruit-' + this.WorldAdded, Kind: 'unit', X: 8, Y: 5, Team: 'blue', Type: 'worker', Health: 30, MaxHealth: 30, Speed: 3});

		world.Order([unit.ID], {X: 9 + this.WorldAdded % 4, Y: 7});

		this.WorldNote = 'Recruited ' + unit.ID + ' · ' + world.Objects(function (item) {
			return item.Kind === 'unit' && item.Team === 'blue';
		}).length + ' blue units';
	},

	CallAccepted: function (detail) {
		this.CallNote = detail.Video ? 'Accepted with the camera' : 'Accepted';
	},

	CallDeclined: function () {
		this.CallNote = 'Declined';
	},

	CallPin: function (detail) {
		this.CallPinned = detail.Pinned ? detail.Name : '';
		this.CallLayout = detail.Pinned ? 'speaker' : 'grid';
	},

	CallCornered: function (detail) {
		this.CallCorner = detail.Corner;
		this.CallNote = 'Own video: ' + detail.Corner;
	},

	CallPaged: function (detail) {
		this.CallNote = 'Page ' + (detail.Page + 1);
	},

	/*
	 * A video in a window of its own. It shows a clock drawn on a canvas, from the first press on: nothing is drawn
	 * before, so the catalogue costs nothing until then.
	 */
	VideoPip: function () {
		var self = this;
		var video = this.$Element().querySelector('.ui-kit-pip-video');
		var canvas;
		var context;
		var draw;
		var show = function () {
			self.$Service('PictureInPicture').Video(video, function (error, state) {
				self.WindowNote = error ? 'Picture-in-Picture: ' + error.message : state.Active ? 'The video is in a window' : 'The video is back in the page';
			});
		};

		if (video.srcObject) {
			show();

			return;
		}

		canvas = document.createElement('canvas');
		canvas.width = 320;
		canvas.height = 180;

		context = canvas.getContext('2d');

		draw = function () {
			context.fillStyle = '#20232a';

			context.fillRect(0, 0, 320, 180);

			context.fillStyle = '#ffffff';
			context.font = '48px sans-serif';
			context.textAlign = 'center';

			context.fillText(new Date().toLocaleTimeString(), 160, 105);
		};

		draw();

		this.PipClock = window.setInterval(draw, 500);

		video.srcObject = canvas.captureStream(2);

		video.addEventListener('loadedmetadata', show, {once: true});

		video.play();
	},

	SettingsChosen: function (state) {
		this.SettingsNote = 'Chose: ' + state.Item.Label + (state.Path.length ? ' in ' + state.Path.join(' › ') : '');
	},

	SettingsToggled: function (state) {
		this.SettingsNote = state.Item.Label + ': ' + (state.Checked ? 'on' : 'off');
	},

	ResultsPaged: function (state) {
		this.ResultsPage = state.Page;
	},

	PeoplePaged: function (state) {
		this.PeoplePage = state.Page;
	},

	OTPTyped: function (value) {
		this.OTPState = value ? value.length + ' of 6' : '';
	},

	OTPCompleted: function (value) {
		this.OTPState = 'Complete: ' + value;
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

		if (item.ID === 'wrap')
			this.Wrapped = !this.Wrapped;
	},

	/* The select of a MenuItem of its own. */
	UndoPicked: function () {
		this.CanRedo = true;
	},

	DeclaredTabChanged: function (id) {
		this.DeclaredTab = id;
	},

	TabChanged: function (id) {
		this.Tab = id;
	},

	/* The layout of the tab groups, as the TabSplit tells it: the groups and the tabs in each. */
	SplitChanged: function (layout) {
		var groups = [];

		(function walk (node) {
			if (node.Split) node.Children.forEach(walk);
			else groups.push(node.Tabs.length);
		})(layout);

		this.SplitNote = groups.length + (groups.length === 1 ? ' group: ' : ' groups: ') + groups.join(' + ') + ' tabs';
	},

	SplitClosed: function (id) {
		this.SplitFiles = this.SplitFiles.filter(function (file) {
			return file !== id;
		});
	},

	GroupTabClosed: function (id) {
		this.GroupTabs = this.GroupTabs.filter(function (tab) {
			return tab !== id;
		});
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

	/* The language of the phrases of ElemenxUI (the catalogue itself stays in English). */
	English: function () {
		this.SetLanguage('en');
	},

	Russian: function () {
		this.SetLanguage('ru');
	},

	Arabic: function () {
		this.SetLanguage('ar');
	},

	SetLanguage: function (code) {
		var self = this;

		Elemenx.Locale.Language(code, function () {
			self.UILanguage = Elemenx.Locale.Language();
		});
	},

	OpenRequired: function () {
		this.RequiredOpen = true;
	},

	AcceptRequired: function () {
		this.RequiredOpen = false;
		this.DialogResult = 'terms accepted';
	},

	DeclineRequired: function () {
		this.RequiredOpen = false;
		this.DialogResult = 'terms declined';
	},

	/* Dialogs from the code: the answer comes to the callback (null when the dialog was dismissed). */
	AskConfirm: function () {
		var self = this;

		this.$Service('Dialogs').Confirm({
			Title: 'Delete the project?',
			Message: 'Its files and its history go for good.',
			Icon: 'delete',
			Variant: 'danger',
			Actions: [{ID: 'keep', Label: 'Keep it'}, {ID: 'delete', Label: 'Delete', Variant: 'danger'}],
			Dismissible: false
		}, function (answer) {
			self.DialogResult = 'confirm: ' + answer;
		});
	},

	ShowAlert: function () {
		var self = this;

		this.$Service('Dialogs').Alert({Title: 'Saved', Message: 'The project settings were saved.', Icon: 'success'}, function (answer) {
			self.DialogResult = 'alert: ' + answer;
		});
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

	ToggleProperties: function () {
		this.PropertiesOpen = !this.PropertiesOpen;
	},

	CloseProperties: function () {
		this.PropertiesOpen = false;
		this.WindowNote = 'Properties closed';
	},

	ToggleNotes: function () {
		this.NotesOpen = !this.NotesOpen;
	},

	CloseNotes: function () {
		this.NotesOpen = false;
		this.WindowNote = 'Notes closed';
	},

	WindowMoved: function (place) {
		this.WindowNote = 'Moved to ' + place.X + ', ' + place.Y;
	},

	WindowResized: function (size) {
		this.WindowNote = 'Resized to ' + size.Width + ' × ' + size.Height;
	},

	WindowMinimized: function () {
		this.WindowNote = 'Minimized';
	},

	WindowMaximized: function () {
		this.WindowNote = 'Maximized';
	},

	WindowRestored: function () {
		this.WindowNote = 'Restored';
	},

	GameToggleStatus: function () {
		this.GameStatusOpen = !this.GameStatusOpen;
	},

	GameToggleBag: function () {
		this.GameBagOpen = !this.GameBagOpen;
	},

	GameToggleRecord: function () {
		this.GameRecordOpen = !this.GameRecordOpen;
	},

	GameStatusClosed: function () {
		this.GameStatusOpen = false;
	},

	GameBagClosed: function () {
		this.GameBagOpen = false;
	},

	GameToggleLogin: function () {
		this.GameLoginOpen = !this.GameLoginOpen;
	},

	GameLoginClosed: function () {
		this.GameLoginOpen = false;
	},

	/* The devices of the browser: a press tries one; the browser asks the user first (a picker, a permission). */
	UseDevice: function (event, node) {
		var self = this;
		var name = node.getAttribute('data-name');
		var done = function (error, result) {
			self.DeviceState = name + ': ' + (error ? error.name + ' · ' + error.message : result && result.Info ? 'picked ' + JSON.stringify(result.Info) : 'done');
		};

		if (name === 'Push') this.$Service('Push').Notify('Elemenx', {Text: 'A notification from the page'}, done);
		else if (name === 'Serial') this.$Service('Serial').Request({}, done);
		else if (name === 'USB') this.$Service('USB').Request({}, done);
		else this.$Service('NFC').Scan(done);
	},

	GalleryChanged: function (index) {
		this.GalleryIndex = index;
	},

	GallerySelected: function (item) {
		this.GalleryPicked = item.Title;
	},

	GalleryAutoplayed: function (value) {
		this.GalleryAutoplay = value;
	},

	GalleryReversed: function (value) {
		this.GalleryBackwards = value;
	},

	GalleryTitled: function (value) {
		this.GalleryTitle = value;
	},

	GalleryDescribed: function (value) {
		this.GalleryDescription = value;
	},

	GalleryTagged: function (value) {
		this.GalleryTags = value;
	},

	GalleryFaded: function (value) {
		this.GalleryFade = value;
	},

	/* The part of the Themes section with a theme of its own: Theme.Scope on its element. */
	Scope: function (name) {
		var self = this;
		var root = this.$Element();

		this.$Service('Theme').Scope(root.querySelector('.ui-kit-theme-scope'), name, function (error) {
			if (!error)
				self.ScopeTheme = name;
		});
	},

	ScopeDarcula: function () {
		this.Scope('darcula');
	},

	ScopeLight: function () {
		this.Scope('light');
	},

	ScopeContrast: function () {
		this.Scope('contrast');
	},

	WorldCityChanged: function (city) {
		var cities = this.$Service('Cities');
		var clock = city ? cities.Clock(city) : null;

		this.WorldCity = city ? cities.Label(city) + ' · ' + city.TimeZone + ' (UTC' + clock.Offset + '), ' + clock.Time : '';
	},

	NativeOpen: function () {
		var self = this;

		this.$Service('Platform').Open({Accept: ['.txt', '.md', '.json'], Read: 'text'}, function (error, files) {
			if (error) self.NativeState = error.message;
			else self.NativeState = files.length ? files[0].Name + ' · ' + files[0].Text.length + ' characters' : 'Cancelled';
		});
	},

	NativeSave: function () {
		var self = this;

		this.$Service('Platform').Save({Name: 'notes.txt', Text: 'Saved by Elemenx Native'}, function (error, result) {
			if (error) self.NativeState = error.message;
			else self.NativeState = result ? 'Saved' + (result.Path ? ' to ' + result.Path : ' as a download') : 'Cancelled';
		});
	},

	NativeAsk: function () {
		var self = this;

		this.$Service('Platform').Message({Title: 'Elemenx', Text: 'Keep the changes?', Buttons: ['Keep', 'Discard'], Kind: 'question'}, function (error, index) {
			self.NativeState = error ? error.message : 'Pressed: ' + ['Keep', 'Discard'][index];
		});
	},

	NativeFullscreen: function () {
		var self = this;

		this.$Service('Platform').Window('fullscreen', function (error) {
			if (error)
				self.NativeState = error.message;
		});
	},

	NativeExternal: function () {
		var self = this;

		this.$Service('Platform').External('https://example.com/', function (error) {
			self.NativeState = error ? error.message : 'Opened example.com';
		});
	},

	NativePower: function () {
		var self = this;

		this.$Service('Platform').Power(function (error, power) {
			self.NativeState = error ? error.message : 'Power: ' + (power.OnBattery ? 'on battery' : 'plugged in') + ' · ' + power.State;
		});
	},

	NativeHotkey: function () {
		var self = this;

		this.$Service('Platform').Shortcuts(['CommandOrControl+Shift+E'], function (error, keys) {
			self.NativeState = error ? error.message : 'Hotkeys: ' + keys.join(', ');
		});
	},

	NativeMenu: function () {
		var self = this;

		this.$Service('Platform').Menu([
			{Label: 'File', Items: [{ID: 'open', Label: 'Open', Hotkey: 'CmdOrCtrl+O'}, {Separator: true}, {ID: 'quit', Label: 'Quit', Role: 'quit'}]},
			{Label: 'Help', Items: [{ID: 'about', Label: 'About'}]}
		], function (error) {
			self.NativeState = error ? error.message : 'The menu is set';
		});
	},

	NativeChosen: function (value) {
		this.NativeState = 'Menu: ' + value.ID;
	},

	GameToggleSystems: function () {
		this.GameSystemsOpen = !this.GameSystemsOpen;
	},

	GameSystemsClosed: function () {
		this.GameSystemsOpen = false;
	},

	GameSystemChosen: function (id) {
		this.GameSystemTab = id;
	},

	GameFileChosen: function (ids) {
		this.GameFile = ids;
	},

	GameActivate: function () {
		this.GameNote = 'Detector activated';
	},

	GameToggleQuests: function () {
		this.GameQuestsOpen = !this.GameQuestsOpen;
	},

	GameQuestsClosed: function () {
		this.GameQuestsOpen = false;
	},

	GameQuestChosen: function (id) {
		this.GameQuest = id;
		this.GameQuestsOpen = true;
	},

	GameQuestTracked: function (detail) {
		this.GameQuestList = this.GameQuestList.map(function (quest) {
			return quest.ID === detail.ID ? Object.assign({}, quest, {Tracked: detail.Tracked}) : quest;
		});
		this.GameNote = (detail.Tracked ? 'Tracking: ' : 'Stopped tracking: ') + detail.ID;
	},

	GameToggleRanking: function () {
		this.GameRankingOpen = !this.GameRankingOpen;
	},

	GameRankingClosed: function () {
		this.GameRankingOpen = false;
	},

	GameRankChosen: function (item) {
		this.GameNote = 'Player: ' + item.Name;
	},

	GameZoomed: function (step) {
		this.GameZoom = Math.max(1, Math.min(4, this.GameZoom + step));
		this.GameNote = 'Map zoom ×' + this.GameZoom;
	},

	GameMarkerChosen: function (marker) {
		this.GameNote = 'Marker: ' + marker.Label;
	},

	GameUnlock: function () {
		var list = [
			{Title: 'First blood', Text: 'Defeat your first enemy.', Points: 10},
			{Title: 'Pack hunter', Text: 'Slay five grey wolves.', Rarity: 'rare', Points: 25, Icon: 'flag'},
			{Title: 'Legend of the north', Text: 'Finish the main story.', Rarity: 'legendary', Points: 100, Icon: 'star-filled'}
		];

		this.$Service('Achievements').Show(list[this.GameAchievementIndex % list.length]);

		this.GameAchievementIndex++;
	},

	GameRecordClosed: function () {
		this.GameRecordOpen = false;
	},

	GameRecordChosen: function (id) {
		this.GameRecordTab = id;
	},

	GameBuffs: function () {
		this.GameNote = 'Blessed: +10% to everything';
	},

	GameThemeDefault: function () {
		this.$Service('Theme').Use('default');
	},

	GameThemeFantasy: function () {
		this.$Service('Theme').Use('fantasy');
	},

	GameThemeScifi: function () {
		this.$Service('Theme').Use('scifi');
	},

	GameHit: function () {
		this.GameHealth = Math.max(0, this.GameHealth - 23);
		this.GameNote = this.GameHealth ? 'Hit for 23' : 'Aria has fallen';
	},

	GameExperience: function () {
		this.GameExperiencePoints = (this.GameExperiencePoints + 150) % 1000;
	},

	/* A slot of the hotbar was used: a skill acts, an item is used up one at a time. */
	GameSlotUsed: function (detail) {
		var self = this;
		var index = this.GameSlotIndex(detail.Key);
		var slot = this.GameHotbar[index] || {};
		var hotbar;

		if (slot.Skill) {
			if (slot.Skill.ID === 'fireball') {
				this.GameMana = Math.max(0, this.GameMana - 10);
				this.GameNote = 'Fireball!';
			}
			else if (slot.Skill.ID === 'heal') {
				this.GameHealth = Math.min(100, this.GameHealth + 25);
				this.GameNote = 'Healed for 25';
			}
			else {
				this.GameNote = slot.Skill.Name;
			}

			return;
		}

		if (!slot.Item) return;

		if (slot.Item.Use === 'heal') {
			this.GameHealth = Math.min(100, this.GameHealth + 30);
			this.GameNote = 'A potion: +30 health';
		}
		else {
			this.GameNote = 'Used: ' + slot.Item.Name;
		}

		hotbar = this.GameHotbar.slice();
		hotbar[index] = {Key: slot.Key, Item: self.$Service('GameItems').Take(slot.Item)};

		if (!hotbar[index].Item)
			delete hotbar[index].Item;

		this.GameHotbar = hotbar;
	},

	GameSlotIndex: function (key) {
		var found = -1;

		this.GameHotbar.forEach(function (slot, index) {
			if (slot.Key === key)
				found = index;
		});

		return found;
	},

	/* What a slot holds: {Key, Skill} or {Key, Item}, from what a move left there. */
	GameSlotWith: function (key, held) {
		var slot = {Key: key};

		if (held && held.Kind === 'skill') slot.Skill = held;
		else if (held) slot.Item = held;

		return slot;
	},

	/*
	 * A drop on a slot of the hotbar. The thing moves: from the bag it leaves the bag (piles join, other things swap),
	 * from another slot the two slots swap or join. A skill never goes into the bag.
	 */
	GameSlotDropped: function (detail) {
		var items = this.$Service('GameItems');
		var hotbar = this.GameHotbar.slice();
		var bag;
		var to = this.GameSlotIndex(detail.To.Key);
		var from = detail.From || {};
		var source;
		var result;

		if (to === -1) return;

		if (from.Kind === 'inventory') {
			if (detail.Current && detail.Current.Kind === 'skill') {
				this.GameNote = 'A skill does not go into the bag';

				return;
			}

			bag = this.GameItems.slice();
			result = items.Move(detail.Item, detail.Current);
			bag[from.Index] = result.From || null;
			hotbar[to] = this.GameSlotWith(hotbar[to].Key, result.To);
			this.GameItems = bag;
			this.GameHotbar = hotbar;
			this.GameNote = detail.Item.Name + ' on ' + hotbar[to].Key;

			return;
		}

		if (from.Kind !== 'slot') return;

		source = this.GameSlotIndex(from.Key);

		if (source === -1) return;

		result = detail.Item.Kind === 'skill' || detail.Current && detail.Current.Kind === 'skill' ? {To: detail.Item, From: detail.Current} : items.Move(detail.Item, detail.Current);
		hotbar[to] = this.GameSlotWith(hotbar[to].Key, result.To);
		hotbar[source] = this.GameSlotWith(hotbar[source].Key, result.From);
		this.GameHotbar = hotbar;
		this.GameNote = 'Moved ' + from.Key + ' to ' + hotbar[to].Key;
	},

	/* A drop on a cell of the bag from the hotbar: the item leaves the slot (piles join, other items swap). */
	GameBagReceived: function (detail) {
		var hotbar;
		var bag;
		var result;
		var source;
		var from = detail.From || {};
		if (from.Kind !== 'slot') return;

		if (detail.Item.Kind === 'skill') {
			this.GameNote = 'A skill does not go into the bag';

			return;
		}

		source = this.GameSlotIndex(from.Key);

		if (source === -1) return;

		hotbar = this.GameHotbar.slice();
		bag = this.GameItems.slice();
		result = this.$Service('GameItems').Move(detail.Item, detail.Current);
		bag[detail.To.Index] = result.To || null;
		hotbar[source] = this.GameSlotWith(hotbar[source].Key, result.From);
		this.GameItems = bag;
		this.GameHotbar = hotbar;
		this.GameNote = detail.Item.Name + ' back in the bag';
	},

	GamePause: function () {
		this.GamePaused = true;
	},

	GameResume: function () {
		this.GamePaused = false;
	},

	GameMenuChosen: function (detail) {
		this.GameNote = 'Menu: ' + detail.Item.Label;

		if (detail.ID === 'resume' || detail.ID === 'save')
			this.GamePaused = false;

		if (detail.ID === 'quit') {
			this.GamePaused = false;
			this.GameStep = 0;
			this.GameLine = this.GameScript[0];
		}
	},

	GameNext: function () {
		this.GameStep++;
		this.GameLine = this.GameScript[this.GameStep] || null;
	},

	GameChose: function (detail) {
		this.GameNote = 'Chosen: ' + detail.Choice.Text;
		this.GameLine = {Speaker: 'Old sage', Text: detail.ID === 'pass' ? 'Brave. Keep to the cairns, and do not look down.' : 'Wise. The storm will pass by morning.'};
		this.GameStep = this.GameScript.length;
	},

	GameItemMoved: function (detail) {
		this.GameItems = detail.Items;
	},

	GameItemUsed: function (detail) {
		this.GameNote = 'Used: ' + detail.Item.Name;
	},

	GameItemDiscarded: function (detail) {
		var items = this.GameItems.slice();

		items[detail.Index] = null;

		this.GameItems = items;
		this.GameNote = 'Dropped: ' + detail.Item.Name;
	},

	SuggestModeChosen: function (value) {
		this.SuggestMode = value;
	},

	SendSticker: function (detail) {
		this.Messages = this.Messages.concat([{ID: this.Messages.length + 1, Author: 'Me', Text: detail.Sticker.Title, Sticker: detail.Sticker.URL, Time: 'now', Own: true, Status: 'sent'}]);
	},

	/* A reaction of the reader: added, counted once, or taken back. */
	MessageReacted: function (detail) {
		this.Messages = this.Messages.map(function (message) {
			var reactions;
			var found = false;

			if (message.ID !== detail.ID) return message;

			reactions = (message.Reactions || []).map(function (reaction) {
				if (reaction.Emoji !== detail.Emoji) return reaction;

				found = true;

				return Object.assign({}, reaction, {Count: reaction.Count + (detail.Mine ? 1 : -1), Mine: detail.Mine, Users: (reaction.Users || []).filter(function (user) {
					return user.Name !== 'Me';
				}).concat(detail.Mine ? [{Name: 'Me'}] : [])});
			}).filter(function (reaction) {
				return reaction.Count > 0;
			});

			if (!found && detail.Mine)
				reactions.push({Emoji: detail.Emoji, Count: 1, Mine: true, Users: [{Name: 'Me'}]});

			return Object.assign({}, message, {Reactions: reactions});
		});
	},

	PostLiked: function (detail) {
		this.CardNote = (detail.Liked ? 'liked' : 'unliked') + ' · ' + detail.Likes;
	},

	PostCommented: function (detail) {
		this.CardNote = 'comments of ' + detail.Title;
	},

	PostShared: function (detail) {
		this.CardNote = 'share ' + detail.Title;
	},

	ProfileFollowed: function (detail) {
		this.CardNote = detail.Following ? 'following' : 'unfollowed';
	},

	ProfileMessaged: function (detail) {
		this.CardNote = 'message to ' + detail.Name;
	},

	CommentReplied: function (detail) {
		this.CardNote = 'reply to @' + detail.Handle;
	},

	CommentReposted: function (detail) {
		this.CardNote = (detail.Reposted ? 'reposted' : 'repost taken back') + ' · ' + detail.Reposts;
	},

	CommentLiked: function (detail) {
		this.CardNote = (detail.Liked ? 'liked' : 'unliked') + ' · ' + detail.Likes;
	},

	CommentMention: function (detail) {
		this.CardNote = 'mention @' + detail.Handle;
	},

	CommentTag: function (detail) {
		this.CardNote = 'tag #' + detail.Tag;
	},

	ProductAdded: function (detail) {
		this.CardNote = 'added to the cart' + (detail.Color ? ' · ' + detail.Color : '') + (detail.Size ? ' · ' + detail.Size : '');
	},

	ProductFavorite: function (detail) {
		this.CardNote = detail.Favorite ? 'favorite' : 'not a favorite';
	},

	ProductColor: function (detail) {
		this.CardNote = 'color ' + detail.Color;
	},

	ProductSize: function (detail) {
		this.CardNote = 'size ' + detail.Size;
	},

	SubscriptionChosen: function (detail) {
		this.Subscription = detail.ID;
		this.CardNote = 'plan ' + detail.ID + ' · ' + detail.Period;
	},

	SubscriptionPeriodChosen: function (detail) {
		this.SubscriptionPeriod = detail.Period;
	},

	EmojiPicked: function (detail) {
		this.Picked = detail.Emoji + ' ' + detail.Name;
		this.PickedEmoji = this.PickedEmoji + detail.Emoji;
	},

	StickerPicked: function (detail) {
		this.Picked = 'sticker ' + detail.Sticker.Title;
		this.PickedSticker = detail.Sticker.URL;
	},

	/* The menu of a message: an action, or the summary (the item 'summary' opens it inside the message). */
	/* The choice of several messages: a message asks to be chosen or let go; the bar deletes the chosen ones. */
	MessageSelected: function (detail) {
		var rest = this.ChatSelection.filter(function (id) {
			return id !== detail.ID;
		});

		this.ChatSelection = detail.Selected ? rest.concat([detail.ID]) : rest;
	},

	ChatCleared: function () {
		this.ChatSelection = [];
	},

	DeleteSelected: function () {
		var chosen = this.ChatSelection;

		this.Messages = this.Messages.filter(function (item) {
			return chosen.indexOf(item.ID) === -1;
		});

		this.ChatNote = 'Deleted ' + chosen.length + ' messages';
		this.ChatSelection = [];
	},

	MessageAction: function (detail) {
		var message = this.Messages.filter(function (item) {
			return item.ID === detail.ID;
		})[0];

		if (detail.Action === 'delete') {
			this.Messages = this.Messages.filter(function (item) {
				return item.ID !== detail.ID;
			});
		}
		else if (detail.Action === 'edit') {
			this.Messages = this.Messages.map(function (item) {
				return item.ID === detail.ID ? Object.assign({}, item, {Text: item.Text + ' (updated)', Edited: 'Edited now'}) : item;
			});
		}

		this.ChatNote = detail.Item.Label + ': ' + (message ? message.Text : detail.ID);
	},

	SendMessage: function (text) {
		this.Messages = this.Messages.concat([{ID: this.Messages.length + 1, Author: 'Me', Text: text, Time: 'now', Own: true, Status: 'sent'}]);
	},

	$OnCreate: function () {
		var now = new Date();
		var self = this;
		var hotkeys = this.$Service('Hotkeys');

		/* Titles split by | or by commas; a part between | counts whole too, as a title may have a comma (Payment, phone and money). */
		var only = (new URLSearchParams(window.location.search).get('sections') || '').split('|').reduce(function (all, part) {
			return all.concat([part], part.split(','));
		}, []).filter(Boolean);

		/*
		 * The items of the mosaic for a layout: cells of a bento, heights of a masonry, shapes of the pictures of justified
		 * rows, values of a treemap (a group of three).
		 */
		var pictures = [];

		this.MosaicItems = function (layout) {
			var names = ['North', 'Harbour', 'Dunes', 'Forest', 'Glacier', 'Canyon', 'Meadow', 'Reef'];
			var sizes = [[2, 2], [1, 1], [1, 2], [2, 1], [1, 1], [1, 1], [2, 1], [1, 1]];

			if (layout === 'treemap')
				return [{ID: 'coast', Title: 'Coast', Children: [{ID: 'harbour', Title: 'Harbour', Value: 40}, {ID: 'dunes', Title: 'Dunes', Value: 25}, {ID: 'reef', Title: 'Reef', Value: 15}]}].concat(['North', 'Forest', 'Glacier', 'Canyon'].map(function (name, index) {
					return {ID: name.toLowerCase(), Title: name, Value: [60, 35, 20, 10][index]};
				}));

			return names.map(function (name, index) {
				return {
					ID: name.toLowerCase(),
					Title: name,
					Text: 'Place ' + (index + 1),
					Image: pictures[index] || (pictures[index] = self.$Service('Suprematist').DataURL({Seed: 'mosaic-' + index, Width: 360, Height: Math.round(360 / [1.5, 0.75, 1, 1.78, 1.33, 0.8, 2, 1][index])})),
					Width: sizes[index][0],
					Height: layout === 'masonry' ? 90 + (index * 37) % 120 : sizes[index][1],
					Ratio: [1.5, 0.75, 1, 1.78, 1.33, 0.8, 2, 1][index]
				};
			});
		};

		/* The sections a link names (?sections=Buttons,Forms or Buttons|Forms: a test opens the ones it needs), all of them without one. */
		this.Shows = function (title) {
			return !only.length || only.indexOf(title) !== -1;
		};

		var videos = {};

		var pictures = {};
		var visitors = {};
		var suprematist = this.$Service('Suprematist');

		/* The posters of the films and the backdrop of the featured one: pictures of Suprematism, the same for each film. */
		this.MediaItems = this.MediaItems.map(function (item) {
			return Object.assign({}, item, {Image: suprematist.DataURL({Seed: 'film-' + item.ID, Width: 240, Height: 360})});
		});
		this.MediaPoster = suprematist.DataURL({Seed: 'film-long-light', Width: 240, Height: 360});
		this.MediaBackdrop = suprematist.DataURL({Seed: 'film-long-light-backdrop', Width: 960, Height: 360});

		/* The pictures of the landing, made once for each seed (a template calls it). */
		this.LandingPicture = function (seed) {
			if (!pictures[seed])
				pictures[seed] = self.$Service('Suprematist').DataURL({Seed: seed, Width: 640, Height: 420});

			return pictures[seed];
		};

		/* The visitor the landing is shown to: one object for each, so that the Experiment chooses again only when it changes. */
		this.LandingVisitorOf = function (source) {
			if (!visitors[source])
				visitors[source] = {URL: source === 'direct' ? '/' : '/?utm_source=' + source, Referrer: source === 'google' ? 'https://www.google.com/' : ''};

			return visitors[source];
		};

		/* The videos of the call: pictures of Suprematism in place of the cameras, one element for each (a template calls it). */
		this.CallVideo = function (seed) {
			var image;

			if (!videos[seed]) {
				image = document.createElement('img');
				image.alt = '';
				image.src = self.$Service('Suprematist').DataURL({Seed: seed, Width: 320, Height: 180});
				videos[seed] = image;
			}

			return videos[seed];
		};

		/* The people in the tiles: all of them but the one pinned in front. */
		this.CallOthers = function (people, pinned) {
			return people.filter(function (person) {
				return person.Name !== pinned;
			});
		};

		this.CallFront = function (people, pinned) {
			return people.filter(function (person) {
				return person.Name === pinned;
			})[0] || null;
		};

		this.PaletteKeys = hotkeys.Format('Mod+K');

		this.Profile = this.ProfileModel();

		/* The status and the value of the model, as it tells them: its check by the server ends by itself, later. */
		this.ProfileShown = function () {
			self.ProfileState = self.Profile.Status + ' · ' + JSON.stringify(self.Profile.Value);
		};

		this.ProfileShown();

		this.Profile.OnChange(this.ProfileShown);

		this.SettingsIos = this.SettingsItems();

		this.PipVideo = this.$Service('PictureInPicture').Supported('video');
		this.PipDocument = this.$Service('PictureInPicture').Supported('document');
		this.SettingsMaterial = this.SettingsItems();

		this.EditorLanguageChosen(this.EditorLanguage);

		this.GameLine = this.GameScript[0];

		/* The native features: their place, and the clicks of the menu of a native program. */
		this.NativePlatform = this.$Service('Platform').Platform();
		this.NativeListener = function (value) {
			self.NativeChosen(value);
		};

		this.$Service('Platform').On('menu', this.NativeListener);

		/* The menu of a message: everyone may reply and copy, the author edits and deletes. */
		this.MessageActions = function (message) {
			var actions = [{ID: 'reply', Label: 'Reply', Icon: 'reply'}, {ID: 'copy', Label: 'Copy text', Icon: 'copy'}, {ID: 'select', Label: 'Select', Icon: 'check'}];

			if (message.Own)
				actions = actions.concat([{ID: 'edit', Label: 'Edit', Icon: 'edit'}, {ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true}]);

			return actions.concat([{Separator: true}, {ID: 'summary', Label: 'Reactions and views', Icon: 'eye'}]);
		};

		/* The completions and the hints of the code editor: functions of the state, which the template passes on. */
		this.EditorCompleter = function (context, callback) {
			self.EditorComplete(context, callback);
		};

		this.EditorHinter = function (context, callback) {
			self.EditorHint(context, callback);
		};

		/* A comment written minutes ago. */
		this.CommentTime = function (minutes) {
			return new Date(Date.now() - minutes * 60000);
		};

		this.Devices = [
			{Name: 'Push', Supported: this.$Service('Push').Supported(), Action: 'Notify'},
			{Name: 'Serial', Supported: this.$Service('Serial').Supported(), Action: 'Pick a port'},
			{Name: 'USB', Supported: this.$Service('USB').Supported(), Action: 'Pick a device'},
			{Name: 'NFC', Supported: this.$Service('NFC').Supported(), Action: 'Scan a tag'}
		];

		this.LoadIcons();
		this.WatchTheme();

		this.Agenda = this.Schedule(now);
		this.LongList = this.Numbers(100000);
		this.ManyPeople = this.Staff(57);
		this.Commands = [
			{ID: 'theme', Label: 'Toggle the theme', Icon: 'moon', Group: 'View', Keys: 'Alt+T', Run: function () {
				self.$Service('Theme').Next();
			}},
			{ID: 'drawer', Label: 'Open the filters drawer', Icon: 'panel-right', Group: 'View', Run: function () {
				self.DrawerOpen = true;
			}},
			{ID: 'tour', Label: 'Take the tour', Icon: 'help', Group: 'Help', Keywords: ['guide', 'onboarding'], Run: function () {
				self.StartTour();
			}},
			{ID: 'toast', Label: 'Show a success toast', Icon: 'bell', Group: 'Notifications', Run: function () {
				self.$Service('Toast').Show({Message: 'Done from the palette', Variant: 'success'});
			}},
			{ID: 'copy-token', Label: 'Copy the API token', Icon: 'copy', Group: 'Edit', Run: function () {
				self.$Service('Clipboard').Copy(self.ApiToken, null, {Toast: 'Token copied'});
			}},
			{ID: 'tiles', Label: 'Go to the tiles', Icon: 'grid', Group: 'Navigate', Keys: 'g t', Run: function () {
				self.GoTo('Tiles');
			}},
			{ID: 'disabled', Label: 'Publish (needs a reviewer)', Icon: 'send', Group: 'Edit', Disabled: true}
		];

		this.ThemeKey = hotkeys.Bind('Alt+T', function () {
			self.$Service('Theme').Next();
		}, {Description: 'Toggle the theme', Group: 'View'});
		this.TilesKey = hotkeys.Bind('g t', function () {
			self.GoTo('Tiles');
		}, {Description: 'Go to the tiles', Group: 'Navigate'});

		/* The list follows the bindings: the parts of the page that render later (*lazy) bind their keys then. */
		this.ShortcutsListener = function () {
			self.Shortcuts = hotkeys.List().filter(function (entry) {
				return entry.Description;
			});
		};

		hotkeys.OnChange(this.ShortcutsListener);

		this.ShortcutsListener();

		this.$Service('Biometric').Available(function (error, state) {
			self.BiometricState = !state.Supported ? 'WebAuthn is not supported here' : state.Platform ? 'This device has a fingerprint, face or PIN check' : 'No check built into this device';
		});

		this.PermissionList.forEach(function (entry) {
			self.QueryPermission(entry.Name);
		});

		this.ClockTime = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
		this.ClockDate = now.toLocaleDateString([], {weekday: 'long', day: 'numeric', month: 'long'});

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

	/* A model made in code: a name checked by the server (admin is taken), a city, and a list of phones. */
	ProfileModel: function () {
		var forms = this.$Service('Forms');
		var check = forms.Validators;

		return forms.Group({
			Username: forms.Control('ada', {
				Validators: [check.Required, check.MinLength(3)],
				Async: [function (control, callback) {
					window.setTimeout(function () {
						callback(control.Value === 'admin' ? {taken: true} : null);
					}, 300);
				}]
			}),
			City: forms.Control('Berlin', [check.Required]),
			Phones: forms.Array([forms.Control('+49 30 1234567', [check.Required, check.Pattern('[+0-9 ]+')])])
		});
	},

	AddPhone: function () {
		var forms = this.$Service('Forms');

		this.Profile.Get('Phones').Push(forms.Control('', [forms.Validators.Required, forms.Validators.Pattern('[+0-9 ]+')]));
	},

	RemovePhone: function (event, node) {
		this.Profile.Get('Phones').RemoveAt(Number(node.getAttribute('data-index')));
	},

	ProfileSaved: function (result) {
		this.FormNote = 'Saved: ' + JSON.stringify(result.Value);
	},

	SignedUp: function (result) {
		this.FormNote = 'Signed up: ' + result.Value.name + ' <' + result.Value.email + '>';
	},

	SignUpInvalid: function (result) {
		this.FormNote = 'Fix: ' + Object.keys(result.Errors).join(', ');
	},

	SignUpCleared: function () {
		this.FormNote = 'Cleared';
	},

	WorkspaceCustomized: function (value) {
		this.WorkspaceCustomize = !!value;
	},

	/* The layout the user made: where each tool window is, and which one is open in each area. */
	WorkspaceArranged: function (layout) {
		this.WorkspaceLayoutNote = 'Layout: ' + JSON.stringify({Areas: layout.Areas, Open: layout.Open});
	},

	CrumbPicked: function (choice) {
		this.PeopleNote = 'Crumb: ' + choice.Item.Label + ' (' + choice.Index + ')';
	},

	CrumbHome: function () {
		this.PeopleNote = 'Crumb: home';
	},

	/* The server drops the connection, waits and comes back. */
	Reconnect: function () {
		var self = this;

		this.ServerStatus = 'connecting';

		window.setTimeout(function () {
			self.ServerStatus = 'online';
		}, 1500);
	},

	ReadAll: function () {
		this.Unread = 0;
		this.PeopleNote = 'All read';
	},

	/* The Timeline of the plan: its events change the data, it does not change it itself. */
	PlanSelected: function (event) {
		this.TimelineNote = 'Selected: ' + (event.Item.Label || event.ID);
	},

	PlanMoved: function (event) {
		if (event.Kind === 'mark') {
			this.PlanMarks = this.PlanMarks.map(function (mark) {
				return mark.ID === event.ID ? Object.assign({}, mark, {At: event.At}) : mark;
			});
			this.TimelineNote = 'Moved: ' + event.Item.Label + ' to ' + event.At;

			return;
		}

		this.PlanResized(event);
	},

	PlanResized: function (event) {
		this.PlanRanges = this.PlanRanges.map(function (range) {
			return range.ID === event.ID ? Object.assign({}, range, {From: event.From, To: event.To}) : range;
		});
		this.TimelineNote = event.Item.Label + ': ' + event.From + ' – ' + event.To;
	},

	PlanCreated: function (event) {
		this.PlanRanges = this.PlanRanges.concat([{ID: 'new-' + this.PlanRanges.length, From: event.From, To: event.To, Label: 'New', Lane: event.Lane, Tone: 'muted'}]);
		this.TimelineNote = 'Created: ' + event.From + ' – ' + event.To;
	},

	VideoSeek: function (event) {
		this.VideoAt = event.At;
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

	/* The rich text editor is kept behind a function too. */
	RichReady: function (editor) {
		this.Rich = function () {
			return editor;
		};
	},

	RichTyped: function (value) {
		this.RichValue = value;

		if (this.RichMarkdownShown && !this.RichFromMarkdown)
			this.RichMarkdown = this.Rich().Markdown();
	},

	RichFormatsChanged: function (formats) {
		var names = {paragraph: 'Paragraph', heading: 'Heading ' + formats.Level, quote: 'Quote', codeblock: 'Code', item: 'List item'};
		var block = formats.Quote && formats.Block === 'paragraph' ? 'quote' : formats.Block;

		this.RichFormats = formats;
		this.RichBlock = block === 'heading' ? 'heading-' + formats.Level : block === 'item' ? '' : block || 'paragraph';
		this.RichLink = formats.Link || '';
		this.RichNote = (names[block] || 'Paragraph') + (formats.Link ? ' · Link: ' + formats.Link : '') + (formats.Table ? ' · Table' : '');
	},

	RichBlockChosen: function (value) {
		var parts = String(value).split('-');

		if (parts[0] === 'heading') this.Rich().Command('heading', Number(parts[1]));
		else this.Rich().Command(this.RichFormats.Block === value && value !== 'paragraph' ? 'paragraph' : value);
	},

	RichBold: function () {
		this.Rich().Command('bold');
	},

	RichItalic: function () {
		this.Rich().Command('italic');
	},

	RichUnderline: function () {
		this.Rich().Command('underline');
	},

	RichStrike: function () {
		this.Rich().Command('strike');
	},

	RichCode: function () {
		this.Rich().Command('code');
	},

	RichBullets: function () {
		this.Rich().Command('bullets');
	},

	RichNumbers: function () {
		this.Rich().Command('numbers');
	},

	RichLinkChanged: function (value) {
		this.RichLink = value;
	},

	RichApplyLink: function () {
		this.Rich().Command('link', this.RichLink);
	},

	/* Mod+K in the editor: the page puts the link of the selection into its field. */
	RichLinkAsked: function (link) {
		this.RichLink = link.Href || 'https://';

		this.$Element().querySelector('.ui-kit-editor-tools input[placeholder="https://..."]').focus();
	},

	RichImage: function () {
		this.Rich().Command('image', {Src: 'data/cards/mountains.svg', Alt: 'Mountains'});
	},

	RichTable: function () {
		this.Rich().Command('table', {Rows: 3, Columns: 3});
	},

	RichRow: function () {
		this.Rich().Command('row');
	},

	RichRule: function () {
		this.Rich().Command('rule');
	},

	RichClear: function () {
		this.Rich().Command('clear');
	},

	RichUndo: function () {
		this.Rich().Command('undo');
	},

	RichRedo: function () {
		this.Rich().Command('redo');
	},

	/* Images pasted or dropped: the page reads them and inserts them (a real one would upload them). */
	RichFiles: function (files) {
		var editor = this.Rich();

		files.filter(function (file) {
			return /^image\//.test(file.type);
		}).forEach(function (file) {
			var reader = new FileReader();

			reader.onload = function () {
				editor.Command('image', {Src: reader.result, Alt: file.name});
			};

			reader.readAsDataURL(file);
		});
	},

	RichMarkdownToggled: function (value) {
		this.RichMarkdownShown = value;
		this.RichMarkdown = value ? this.Rich().Markdown() : '';
	},

	/* Markdown typed in the code editor below becomes the document. */
	RichMarkdownTyped: function (value) {
		this.RichMarkdown = value;
		this.RichFromMarkdown = true;

		this.Rich().SetMarkdown(value);

		this.RichFromMarkdown = false;
	},

	RichPrint: function () {
		this.Rich().Print({Title: 'Example document'});
	},

	/* The editor is kept behind a function: its handle is not state of the page. */
	EditorReady: function (editor) {
		this.Editor = function () {
			return editor;
		};
	},

	EditorLanguageChosen: function (value) {
		this.EditorLanguage = value;
		this.EditorCode = this.EditorSamples[value] || '';

		/* The version before, for the diff view: a word changed in the second line, and one line more. */
		this.EditorOriginal = this.EditorCode.split('\n').map(function (line, index) {
			return index === 1 ? line.replace(/\w+/, 'previous') : line;
		}).concat(['']).join('\n');
		this.EditorMarkers = value === 'javascript' ? [
			{Line: 8, Column: 7, Severity: 'warning', Message: 'unused is never used.'},
			{Line: 13, Column: 24, EndColumn: 40, Severity: 'error', Message: 'Template literals are not ES5: use a string.'}
		] : [];
		this.EditorMatches = null;
		this.EditorQuery = '';

		if (this.Editor)
			this.Editor().ClearFind();
	},

	EditorTyped: function (value) {
		this.EditorCode = value;
	},

	EditorCursor: function (cursor) {
		this.EditorLine = cursor.Line;
		this.EditorColumn = cursor.Column;
	},

	EditorFind: function (value) {
		this.EditorQuery = value;
		this.EditorMatches = value ? this.Editor().Find(value) : null;

		if (!value)
			this.Editor().ClearFind();
	},

	EditorNext: function () {
		this.Editor().FindNext();
	},

	EditorPrevious: function () {
		this.Editor().FindPrevious();
	},

	EditorReplacementChanged: function (value) {
		this.EditorReplacement = value;
	},

	EditorReplaceAll: function () {
		this.Editor().ReplaceAll(this.EditorReplacement);

		this.EditorMatches = this.EditorQuery ? this.Editor().Find(this.EditorQuery) : null;
	},

	EditorUndo: function () {
		this.Editor().Undo();
	},

	EditorRedo: function () {
		this.Editor().Redo();
	},

	EditorComment: function () {
		this.Editor().Comment();
	},

	EditorViewChosen: function (value) {
		var stats;

		this.EditorView = value;

		if (value !== 'edit' && this.Editor) {
			stats = this.Editor().DiffStats();

			this.EditorStats = '+' + stats.Added + ' −' + stats.Removed;
		}
	},

	EditorWrapChanged: function (value) {
		this.EditorWrap = value;
	},

	EditorPrint: function () {
		this.Editor().Print({Title: 'Example code'});
	},

	/* Completions for the example: the keywords of the language and the words of the text. */
	EditorComplete: function (context, callback) {
		var words = {};
		var keywords = {
			javascript: ['break', 'case', 'catch', 'continue', 'default', 'else', 'function', 'return', 'switch', 'this', 'throw', 'typeof', 'var', 'while', 'Elemenx', 'console'],
			python: ['class', 'def', 'elif', 'else', 'import', 'lambda', 'print', 'return', 'self', 'while', 'yield'],
			sql: ['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'JOIN', 'LIMIT', 'COUNT']
		};
		var items = (keywords[context.Language] || []).map(function (word) {
			return {Label: word, Kind: 'kw', Detail: 'keyword'};
		});

		(context.Text.match(/[A-Za-z_$][\w$]{2,}/g) || []).forEach(function (word) {
			words[word] = (words[word] || 0) + 1;
		});

		Object.keys(words).sort().forEach(function (word) {
			var known = items.some(function (item) {
				return item.Label === word;
			});
			if (word !== context.Word && !known)
				items.push({Label: word, Kind: 'ab', Detail: words[word] + ' in the text'});
		});

		callback(null, items);
	},

	/* A hint for the word under the pointer: how often the text uses it. */
	EditorHint: function (context, callback) {
		var count;

		if (!/^[A-Za-z_]\w*$/.test(context.Word)) {
			callback(null, '');

			return;
		}

		count = context.Text.split(new RegExp('\\b' + context.Word + '\\b')).length - 1;

		callback(null, context.Word + ': ' + count + (count === 1 ? ' use' : ' uses') + ' in the text');
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

	MosaicLaid: function (value) {
		this.MosaicLayout = value;
	},

	MosaicSelected: function (item) {
		this.MosaicChosen = item.Title || item.ID;
	},

	CustomStepSelected: function (item) {
		this.CustomStep = item.ID;
	},

	Play: function () {
		this.Plays++;
	},

	NewsToggled: function (checked) {
		this.ShowNews = checked;
	},

	TileGroupAction: function (event) {
		this.OpenedTile = event.Action.Title + ' ' + event.Group.Title;
	},

	/* A tile more in the group Work, by the button of its header (declared in its slot actions). */
	AddWorkTile: function () {
		this.WorkTiles = this.WorkTiles.concat(['Draft ' + (this.WorkTiles.length + 1)]);
	},

	TilesChanged: function (groups) {
		this.TileGroups = groups;
	},

	ColumnsChanged: function (groups) {
		this.ColumnGroups = groups;
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
	},

	/* More components: what they report shows in the note of their section. */
	MoreSaved: function () {
		this.MoreNote = 'Saved';
	},

	MorePicked: function (item) {
		this.MoreNote = item.Label;
	},

	MoreDecided: function (decision) {
		this.MoreNote = 'Analytics ' + (decision.Choices.analytics ? 'allowed' : 'refused');
	},

	MoreSigned: function (strokes) {
		this.MoreNote = strokes.length + ' strokes signed';
	},

	/* A signature of the samples, while there are fewer than three: kept when it is done, the pad cleared for the next. */
	SampleSigned: function (strokes) {
		var self = this;

		if (this.SignatureSamples.length >= 3 || !strokes.length) return;

		window.clearTimeout(this.SampleTimer);

		this.SampleTimer = window.setTimeout(function () {
			var pad;

			self.SignatureSamples = self.SignatureSamples.concat([strokes]);

			pad = self.$Ref('signatureSample', true);

			if (pad && pad.Clear)
				pad.Clear();
		}, 900);
	},

	PipelineSelected: function (event) {
		this.PipelineNote = 'Selected ' + event.Job.Name + ' of ' + event.Stage;
	},

	PipelineActed: function (event) {
		this.PipelineNote = event.Action + ' ' + event.Job.Name;
	},

	CalculatorCounted: function (result) {
		this.CalculatorNote = result.Expression + ' = ' + result.Value;
	},

	LoanChanged: function (event) {
		this.CalculatorNote = 'Each month ' + event.Results.Payment.toFixed(2);
	},

	QuizFinished: function (event) {
		this.QuizNote = 'Finished: ' + event.Score + ' of ' + event.Max + (event.Passed ? ', passed' : ', not passed');
	},

	LandingVisited: function (value) {
		this.LandingVisitor = value;
	},

	LandingChosen: function (event) {
		this.LandingNote = 'Variant ' + event.ID + ' (' + event.Reason + ')';
	},

	LandingActed: function (event) {
		this.LandingNote = 'Conversion ' + event.Goal + ' of ' + this.$Service('Audience').Chosen('ui-kit-landing').ID;
	},

	SignatureCompared: function (result) {
		this.MoreNote = 'Signature ' + (result.Match ? 'looks like' : 'does not look like') + ' the samples: ' + result.Percent + '%';
	},

	MoreOpened: function (item) {
		this.MoreNote = 'Opened ' + item.Name;
	},

	/* Media collection: the facets filter the shelf; what is pressed shows in the note of its section. */
	MediaChanged: function (value) {
		this.MediaValue = value;
	},

	MediaFiltered: function (items) {
		this.MediaLeft = items;
		this.MediaNote = items.length + ' of ' + this.MediaItems.length + ' films';
	},

	MediaOpened: function (item) {
		this.MediaNote = 'Opened ' + item.Title;
	},

	MediaPlayed: function () {
		this.MediaNote = 'Playing The Long Light';
	},

	MediaTrackPlayed: function (track) {
		this.MediaTrack = track.ID;
		this.MediaPlaying = true;
		this.MediaNote = 'Playing ' + track.Title;
	},

	MediaEdited: function (tracks) {
		this.MediaEdit = tracks;
		this.MediaNote = tracks.reduce(function (count, track) {
			return count + track.Clips.length;
		}, 0) + ' clips';
	},

	MediaSought: function (value) {
		this.MediaTime = value.Time;
	},

	MediaTrackPaused: function (track) {
		this.MediaPlaying = false;
		this.MediaNote = 'Paused ' + track.Title;
	},

	/* Drawing: its model goes between the drawing and its layers; what it does shows in the note of its section. */
	DrawingChanged: function (model) {
		this.DrawingModel = model;
		this.DrawingNote = model.Layers.reduce(function (count, layer) {
			return count + layer.Items.length;
		}, 0) + ' items on ' + model.Layers.length + ' layers';
	},

	DrawingSelected: function (ids) {
		this.DrawingNote = ids.length ? 'Selected ' + ids.join(', ') : 'Nothing selected';
	},

	DrawingPicked: function (id) {
		this.DrawingLayer = id;
		this.DrawingNote = 'Layer ' + id;
	},

	/* Codes and diagrams, Sound: what they report shows in the note of their section. */
	CommitPicked: function (commit) {
		this.CodesNote = 'Commit ' + commit.ID + ': ' + commit.Message;
	},

	DiagramFailed: function (error) {
		this.CodesNote = error.message;
	},

	SoundSought: function (time) {
		this.SoundTime = time;
		this.SoundNote = 'Playhead at ' + time.toFixed(1) + ' s';
	},

	SoundSelected: function (part) {
		this.SoundPart = part;
		this.SoundNote = part ? 'Selected ' + part.Start.toFixed(1) + ' to ' + part.End.toFixed(1) + ' s' : 'Nothing selected';
	},

	SoundScratched: function (move) {
		this.SoundTime = Math.max(0, Math.min(42, move.Time));
		this.SoundNote = 'Scratched to ' + this.SoundTime.toFixed(2) + ' s';
	},

	SoundNudged: function (nudge) {
		this.SoundNote = 'Pitch bend ' + (nudge.Delta > 0 ? '+' : '') + nudge.Delta.toFixed(2);
	},

	SoundPad: function (hit) {
		this.SoundNote = 'Pad ' + hit.ID + ', velocity ' + hit.Velocity.toFixed(2);
	},

	SoundNotesChanged: function (notes) {
		this.SoundNotes = notes;
		this.SoundNote = notes.length + ' notes';
	},

	SoundKey: function (note) {
		this.SoundNote = 'Key ' + this.$Service('Audio').NoteName(note);
	}
});