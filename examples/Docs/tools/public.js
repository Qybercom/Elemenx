/*
 * Which members of a definition of ElemenxUI are its public props: the ones the comment at the head of its source names,
 * the props every field and control shares (Placeholder, Size, Disabled...), the texts it shows that an Application may
 * replace (the names ending with Label), and the props of the list below, that a comment speaks of by their use. The
 * other members are the state of the component. Used by the reference (tools/pages.js).
 */
var Common = ['Placeholder', 'Size', 'Shape', 'Name', 'Disabled', 'ReadOnly', 'Invalid', 'Label', 'Title', 'Description', 'Icon', 'Note', 'Hint', 'Empty', 'Clearable', 'Locale', 'Variant', 'Placement', 'Closable', 'Padded', 'Level', 'Caption', 'Unit', 'ShowValue', 'Columns', 'Multiple', 'Horizontal', 'AutoFocus', 'Autofocus'];

var Own = {
	Input: ['Type', 'IconRight', 'Prefix', 'Suffix', 'Mask', 'Autocomplete', 'InputMode', 'MaxLength', 'Step', 'Revealed'],
	Table: ['Height', 'Compact', 'Striped', 'Bordered', 'Sticky'],
	Terminal: ['Prompt'],
	TagInput: ['Separators'],
	Chart: ['Legend', 'Width', 'Palette'],
	Ribbon: ['Collapsible', 'KeyTips', 'FileKeyTip'],
	OTPInput: ['MaskChar'],
	Tour: ['Padding'],
	MasterDetail: ['EmptyIcon'],
	MixerChannel: ['ShowPan'],
	ThemeSwitch: ['Policy'],
	EmojiPicker: ['Tones', 'Recent', 'Nothing'],
	StickerPicker: ['Nothing', 'NoRecent', 'NoFavorites', 'NoPacks'],
	CommandPalette: ['Limit'],
	MoneyInput: ['Codes', 'Min', 'Max'],
	Popover: ['Width'],
	Window: ['Minimized', 'Maximized'],
	CardNumberInput: ['Brands'],
	Combobox: ['CreateLabel'],
	Dialog: ['Open'],
	Drawer: ['Open'],
	ContextMenu: ['Open'],
	Menu: ['Open'],
	MenuList: ['Open']
};

module.exports = function (component, name, comment) {
	if (new RegExp('(^|[^A-Za-z0-9_$])' + name.replace(/\$/g, '\\$') + '([^A-Za-z0-9_]|$)').test(comment)) return true;

	if (Common.indexOf(name) !== -1 || /.Label$/.test(name)) return true;

	return (Own[component] || []).indexOf(name) !== -1;
};
