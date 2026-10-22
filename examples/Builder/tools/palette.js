/*
 * Makes the palette of the builder: every component of ElemenxUI as a kind the builder can place, written into
 * application/services/Palette.js (the Palette Service). A kind takes its props from the source of its component: its
 * public props (examples/Docs/tools/public.js), with their types (a switch, a number, a text, a choice when the comment
 * lists the values, or an expression for a list or an object) and their defaults; its first values come from the
 * example of its page in the reference (examples/Docs/tools/examples/<Name>.html), or from Samples, so a new element
 * shows something. A component with slots holds other elements; Slots names the slots a child of it may go to.
 * node examples/Builder/tools/palette.js
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var isPublic = require('../../Docs/tools/public.js');

var Root = path.resolve(__dirname, '..', '..', '..');
var Library = path.join(Root, 'libraries', 'ElemenxUI', 'components');
var Examples = path.join(Root, 'examples', 'Docs', 'tools', 'examples');
var Output = path.resolve(__dirname, '..', 'application', 'services', 'Palette.js');

/* The groups of the palette, in their order, with the icon of their kinds and the components they hold. */
var Groups = [
	{ID: 'layout', Icon: 'layout', Names: ['Block', 'Centered', 'Splitter', 'MasterDetail', 'Dashboard', 'DashboardWidget', 'TileGrid', 'TileGroup', 'Tile', 'Properties', 'Property', 'Settings', 'SettingsMenu', 'VirtualList', 'Form']},
	{ID: 'text', Icon: 'text-color', Names: ['Markdown', 'CodeView', 'Formula']},
	{ID: 'inputs', Icon: 'edit', Names: ['CVVInput', 'CardExpiryInput', 'CardNumberInput', 'CityInput', 'ColorInput', 'Combobox', 'CurrencySelect', 'DateRangeInput', 'DialPad', 'FileUpload', 'Knob', 'MoneyInput', 'MultiSelect', 'NumberInput', 'OTPInput', 'PhoneInput', 'Radio', 'TagInput', 'TimeInput', 'CodeEditor', 'RichEditor', 'EmojiPicker', 'StickerPicker', 'ExpressionPicker']},
	{ID: 'buttons', Icon: 'launcher', Names: ['ThemeSwitch', 'Menu', 'MenuItem', 'MenuList', 'ContextMenu']},
	{ID: 'navigation', Icon: 'menu', Names: ['Breadcrumbs', 'NavList', 'Pagination', 'Steps', 'Tree', 'CommandPalette', 'FindBar', 'Tour', 'Ribbon', 'RibbonTab', 'RibbonPage', 'RibbonGroup', 'RibbonButton', 'RibbonGallery', 'RibbonBackstage']},
	{ID: 'display', Icon: 'star', Names: ['Presence', 'Skeleton', 'FileIcon', 'Meter', 'Gallery']},
	{ID: 'data', Icon: 'chart', Names: ['Chart', 'Sparkline', 'Table', 'Timeline', 'Calendar', 'Terminal']},
	{ID: 'overlays', Icon: 'panel-right', Names: ['Dialog', 'DialogHost', 'Drawer', 'Popover', 'ToastHost', 'AchievementHost', 'Window', 'Workspace', 'WorkspaceToolWindow', 'WorkspaceToolbar']},
	{ID: 'social', Icon: 'users', Names: ['Chat', 'ChatComposer', 'ChatMessage', 'CommentCard', 'PostCard', 'ProfileCard']},
	{ID: 'commerce', Icon: 'cart', Names: ['PlanCard', 'PlanPicker', 'ProductCard']},
	{ID: 'music', Icon: 'headphones', Names: ['Keyboard', 'Piano', 'Mixer', 'MixerChannel']},
	{ID: 'game', Icon: 'trophy', Names: ['GameBar', 'GameDialogue', 'GameHud', 'GameInventory', 'GameItemCard', 'GameKey', 'GameLeaderboard', 'GameMenu', 'GameMinimap', 'GameQuests', 'GameSlot', 'GameTabs']}
];

/* The icons of some components, where the icon of their group says less. */
var Icons = {Block: 'panel-bottom', Centered: 'align-center-vertical', Splitter: 'columns', MasterDetail: 'panel-left', Dashboard: 'grid', DashboardWidget: 'layout', TileGrid: 'grid', Properties: 'list', Settings: 'settings', SettingsMenu: 'settings', VirtualList: 'list', Form: 'file-text', Markdown: 'file-text', CodeView: 'code', Formula: 'shapes', CodeEditor: 'code', RichEditor: 'bold', ColorInput: 'color', DateRangeInput: 'calendar', TimeInput: 'clock', PhoneInput: 'phone', DialPad: 'phone', FileUpload: 'upload', EmojiPicker: 'smile', StickerPicker: 'sticker', CardNumberInput: 'credit-card', CVVInput: 'credit-card', CardExpiryInput: 'credit-card', MoneyInput: 'credit-card', CurrencySelect: 'credit-card', CityInput: 'map-pin', TagInput: 'tag', ThemeSwitch: 'moon', Breadcrumbs: 'chevron-right', Tree: 'tree', Steps: 'list-ordered', CommandPalette: 'search', FindBar: 'search', Tour: 'help', Presence: 'user', FileIcon: 'file', Gallery: 'image', Meter: 'sliders', Sparkline: 'chart', Table: 'table', Timeline: 'history', Calendar: 'calendar', Terminal: 'terminal', Dialog: 'layout', Drawer: 'panel-left', Popover: 'comment', ToastHost: 'bell', AchievementHost: 'trophy', Window: 'maximize', Workspace: 'monitor', Chat: 'comment', ChatComposer: 'send', ChatMessage: 'comment', CommentCard: 'comment', PostCard: 'quote', ProfileCard: 'user', Keyboard: 'grid', Piano: 'volume'};

/*
 * The first values of the components whose example takes them from its own state: data to show on the canvas. The
 * pictures of the examples of the reference are not here, so props that name them are left out.
 */
var Samples = {
	Markdown: {Value: '## A title\n\nSome **bold** and *italic* text, and a [link](https://example.com).\n\n- One\n- Two'},
	Breadcrumbs: {Items: '[{ID: \'home\', Label: \'Home\', Icon: \'home\'}, {ID: \'docs\', Label: \'Docs\'}, {ID: \'page\', Label: \'Page\'}]'},
	Steps: {Items: '[{ID: \'cart\', Label: \'Cart\'}, {ID: \'pay\', Label: \'Payment\'}, {ID: \'done\', Label: \'Done\'}]', Active: '[\'pay\']', Done: '[\'cart\']'},
	Timeline: {Items: '[{ID: 1, Icon: \'edit\', Author: \'Ada\', Action: \'opened the request\', Time: \'9:00\'}, {ID: 2, Icon: \'check\', Author: \'Alan\', Action: \'approved it\', Time: \'11:30\', Variant: \'success\'}]'},
	Gallery: {Items: '[{ID: 1, Image: \'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22%3E%3Crect width=%2216%22 height=%229%22 fill=%22%233f6c9e%22/%3E%3C/svg%3E\', Title: \'Blue\'}, {ID: 2, Image: \'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22%3E%3Crect width=%2216%22 height=%229%22 fill=%22%23b4483f%22/%3E%3C/svg%3E\', Title: \'Red\'}]'},
	GameTabs: {Items: '[{ID: \'items\', Label: \'Items\'}, {ID: \'skills\', Label: \'Skills\'}, {ID: \'map\', Label: \'Map\'}]', Value: '\'items\''},
	GameItemCard: {Item: '{Name: \'Sword of dawn\', Rarity: \'rare\', Type: \'Weapon\', Stats: [{Label: \'Attack\', Value: 42}], Description: \'Forged at first light.\'}'},
	MenuList: {Items: '[{ID: \'new\', Label: \'New\', Icon: \'add\'}, {ID: \'open\', Label: \'Open\', Icon: \'folder-open\'}, {ID: \'save\', Label: \'Save\', Icon: \'save\'}]'},
	TileGrid: {Groups: '[{ID: \'start\', Title: \'Start\', Tiles: [{ID: \'mail\', Title: \'Mail\', Icon: \'mail\', Size: \'medium\', Color: \'#3f6c9e\'}, {ID: \'photos\', Title: \'Photos\', Icon: \'image\', Size: \'wide\', Color: \'#b4483f\'}]}]'}
};

/* The members of a definition, one tab in: their names and the source of their values. */
function members (source) {
	var result = [];
	var seen = {};

	source.split('\n').forEach(function (line) {
		var entry = /^\t([A-Z]\w*): (.*?),?\s*$/.exec(line);
		if (!entry || seen[entry[1]] || /^function\s*\(/.test(entry[2])) return;

		seen[entry[1]] = true;

		result.push({Name: entry[1], Value: entry[2]});
	});

	return result;
}

/* The values a comment lists for a prop: "Size: small, medium or large", "Variant: line (an underline), pill or editor". */
function choices (comment, name, value) {
	var text = comment.replace(/\s*\n\s*\*?\s*/g, ' ');
	var pattern = new RegExp('\\b' + name + "\\b[^.;:]{0,24}?:\\s*((?:'?[a-z][\\w-]*'?(?:\\s*\\([^)]*\\))?,\\s*)+'?[a-z][\\w-]*'?(?:\\s*\\([^)]*\\))?,?\\s+or\\s+'?[a-z][\\w-]*'?)");
	var match = pattern.exec(text);
	var list;

	if (!match)
		return null;

	list = match[1].replace(/\([^)]*\)/g, '').split(/,|\s+or\s+/).map(function (item) {
		return item.trim().replace(/^'|'$/g, '');
	}).filter(Boolean);

	if (list.length < 2 || (value && list.indexOf(value) === -1) || list.some(function (item) {
		return item.length < 2;
	})) return null;

	if (!value)
		list.unshift('');

	return list;
}

/* The field of a prop from its default value, or null for a prop the builder cannot set. */
function field (comment, member) {
	var value = member.Value;
	var text;
	var options;

	if (value === 'true' || value === 'false')
		return {Name: member.Name, Type: 'bool', Default: value === 'true'};

	if (/^-?\d+(\.\d+)?$/.test(value))
		return {Name: member.Name, Type: 'number', Default: Number(value)};

	if (/^'(?:[^'\\]|\\.)*'$/.test(value)) {
		text = value.slice(1, -1).replace(/\\(.)/g, '$1');
		options = choices(comment, member.Name, text);

		/* A size the comment does not spell out: the three sizes of the Library. */
		if (!options && member.Name === 'Size' && ['small', 'medium', 'large'].indexOf(text) !== -1)
			options = ['small', 'medium', 'large'];

		return options ? {Name: member.Name, Type: 'select', Options: options, Default: text} : {Name: member.Name, Type: 'text', Default: text};
	}

	if (/^(\[|\{|null$)/.test(value))
		return {Name: member.Name, Type: 'json', Default: ''};

	return null;
}

/* The value of an expression of an example when it stands alone (a literal): undefined when it names the state of the example. */
function literal (expression) {
	try {
		return vm.runInNewContext('(' + expression + ')', {}, {timeout: 50});
	}
	catch (error) {
		return undefined;
	}
}

/* The first values of a kind: the attributes of the first element of the component in the example of its page. */
function sample (name, fields) {
	var file = path.join(Examples, name + '.html');
	var props = {};
	var text;
	var tag;
	var pattern = /\s([[\w.-]+\]?)="([^"]*)"/g;
	var match;

	if (!fs.existsSync(file)) return props;

	text = fs.readFileSync(file, 'utf8');
	tag = new RegExp('<' + name + '((?:\\s+[^\\s=>]+(?:="[^"]*")?)*)\\s*/?>').exec(text);

	if (!tag)
		return props;

	match = pattern.exec(tag[1]);

	while (match) {
		apply(props, fields, match[1], match[2].replace(/&#10;/g, '\n').replace(/&#9;/g, '\t').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));

		match = pattern.exec(tag[1]);
	}

	return props;
}

function apply (props, fields, attribute, value) {
	var bound = /^\[(.+)\]$/.exec(attribute);
	var key = (bound ? bound[1] : attribute).toLowerCase().replace(/-([a-z])/g, function (all, letter) {
		return letter;
	});
	var target = fields.filter(function (entry) {
		return entry.Name.toLowerCase() === key;
	})[0];
	var result;

	if (!target || attribute.indexOf('.') !== -1) return;

	if (bound) {
		result = literal(value);

		if (result === undefined || typeof result === 'function') return;

		if (target.Type === 'json') props[target.Name] = value;
		else if (target.Type === 'bool') props[target.Name] = !!result;
		else if (target.Type === 'number' && typeof result === 'number') props[target.Name] = result;
		else if (typeof result === 'string' && (target.Type !== 'select' || target.Options.indexOf(result) !== -1)) props[target.Name] = result;

		return;
	}

	if (target.Type === 'bool') props[target.Name] = value !== 'false';
	else if (target.Type === 'number') props[target.Name] = Number(value) || 0;
	else if (target.Type === 'json') props[target.Name] = /^(-?\d+(\.\d+)?|true|false|null)$/.test(value) ? value : '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\'';
	else if (target.Type !== 'select' || target.Options.indexOf(value) !== -1) props[target.Name] = value;
}

/* The named slots of a template, where the children of a component go by their attribute slot. */
function slots (template) {
	var result = [];
	var pattern = /<slot\s[^>]*\bname="([\w-]+)"/g;
	var match = pattern.exec(template);

	while (match) {
		if (result.indexOf(match[1]) === -1)
			result.push(match[1]);

		match = pattern.exec(template);
	}

	return result;
}

function kind (name, group) {
	var directory = path.join(Library, name);
	var source = fs.readFileSync(path.join(directory, name + '.js'), 'utf8').replace(/\r\n/g, '\n');
	var template = fs.existsSync(path.join(directory, name + '.html')) ? fs.readFileSync(path.join(directory, name + '.html'), 'utf8') : '';
	var comment = (/^\/\*([\s\S]*?)\*\//.exec(source) || ['', ''])[1];
	var fields = members(source).filter(function (member) {
		return member.Name.length > 1 && isPublic(name, member.Name, comment);
	}).map(function (member) {
		return field(comment, member);
	}).filter(Boolean);
	var props = {};
	var first = sample(name, fields);
	var own = Samples[name] || {};

	Object.keys(own).forEach(function (key) {
		first[key] = own[key];
	});

	Object.keys(first).forEach(function (key) {
		if (/\/data\//.test(String(first[key])))
			delete first[key];
	});

	fields.forEach(function (entry) {
		props[entry.Name] = first[entry.Name] !== undefined ? first[entry.Name] : entry.Default;
	});

	return {ID: name, Group: group.ID, Icon: Icons[name] || group.Icon, Tag: name, Container: /<slot\b/.test(template), Component: true, Props: props, Fields: fields, Slots: slots(template)};
}

var listed = {};
var kinds = [];

Groups.forEach(function (group) {
	group.Names.forEach(function (name) {
		listed[name] = true;

		kinds.push(kind(name, group));
	});
});

/* Every component of the Library is in a group: a new one fails here until it gets its place. */
fs.readdirSync(Library).forEach(function (name) {
	if (fs.existsSync(path.join(Library, name, name + '.js')) && !listed[name] && ['Avatar', 'Button', 'ButtonGroup', 'Card', 'Checkbox', 'DateInput', 'EmptyState', 'Field', 'Icon', 'Image', 'Input', 'Progress', 'RadioGroup', 'Rating', 'Section', 'Select', 'Slider', 'Spinner', 'Tabs', 'TextArea', 'Toggle'].indexOf(name) === -1)
		throw new Error('The component ' + name + ' has no group in examples/Builder/tools/palette.js');
});

/* The props and the named slots of the components the builder has kinds of its own for: their kinds take them from here. */
var extra = {};
var named = {};

['Avatar', 'Button', 'ButtonGroup', 'Card', 'Checkbox', 'DateInput', 'EmptyState', 'Field', 'Icon', 'Image', 'Input', 'Progress', 'RadioGroup', 'Rating', 'Section', 'Select', 'Slider', 'Spinner', 'Tabs', 'TextArea', 'Toggle'].forEach(function (name) {
	var made = kind(name, {ID: '', Icon: ''});

	extra[name] = made.Fields;
	named[name] = made.Slots;
});

/* A value as ES5 source in the style of the Library: names without quotes, strings in single quotes, on one line. */
function source (value) {
	if (Array.isArray(value))
		return '[' + value.map(source).join(', ') + ']';

	if (value && typeof value === 'object')
		return '{' + Object.keys(value).map(function (key) {
			return (/^[A-Za-z_$][\w$]*$/.test(key) ? key : '\'' + key + '\'') + ': ' + source(value[key]);
		}).join(', ') + '}';

	if (typeof value === 'string')
		return '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '\'';

	return String(value);
}

/* An object as lines, one entry each. */
function lines (object) {
	return '{\n' + Object.keys(object).map(function (key) {
		return '\t\t' + key + ': ' + source(object[key]);
	}).join(',\n') + '\n\t}';
}

fs.writeFileSync(Output, '/* Made by examples/Builder/tools/palette.js from the sources of ElemenxUI: run it again when a component changes. */\n' +
	'Elemenx.Service(\'Palette\', {\n' +
	'\tGroups: ' + source(Groups.map(function (group) {
	return group.ID;
})) + ',\n' +
	'\tKinds: [\n' + kinds.map(function (entry) {
	return '\t\t' + source(entry);
}).join(',\n') + '\n\t],\n' +
	'\tFields: ' + lines(extra) + ',\n' +
	'\tSlots: ' + lines(named) + '\n' +
	'});\n');

console.log(kinds.length + ' components in ' + Groups.length + ' groups');
