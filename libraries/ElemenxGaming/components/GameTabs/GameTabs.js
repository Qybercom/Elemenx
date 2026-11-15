/*
 * The tabs of a game window, Tabs of ElemenxUI in the look of the game: Items [{ID, Label, Disabled}] in a column
 * (Orientation 'vertical', the default) or a row, numbered 01, 02... (Numbered). Value is the ID of the open tab; a
 * press or the arrows (Home, End) open another and emit change with its ID. Label names the list for screen readers.
 */
Elemenx.Component('GameTabs', {
	$TemplateURL: 'GameTabs.html',
	$StyleURL: 'GameTabs.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The tabs of a game window: Items [{ID, Label, Disabled}] in a column (Orientation \'vertical\', the default) or a row, numbered 01, 02...',
		Events: {
			change: 'Another tab was opened: its ID.'
		},
		Props: {
			Items: {Schema: {ID: 'text', Label: 'text', Icon: 'icon'}, Description: 'The tabs: [{ID, Label, Disabled}].'},
			Value: 'The ID of the open tab.',
			Numbered: 'Numbers the tabs: 01, 02...',
			Orientation: {Options: ['vertical', 'horizontal'], Description: 'vertical (a column) or horizontal (a row).'},
			Label: 'The name of the list for screen readers.'
		},
		Sample: {Items: [{ID: 'items', Label: 'Items'}, {ID: 'skills', Label: 'Skills'}, {ID: 'map', Label: 'Map'}], Value: 'items', Label: 'Record'}
	},
	Items: [],
	Value: null,
	Numbered: true,
	Orientation: 'vertical',
	Label: '',

	/* Its items as tabs: each named by its label when it is cut short (Title). */
	Tabbed: function (items) {
		return (items || []).map(function (item) {
			return {ID: item.ID, Label: item.Label, Disabled: !!item.Disabled, Title: item.Label};
		});
	},

	/* A tab opened of the Tabs it is made of: its ID kept and told. */
	Changed: function (id) {
		if (id === this.Value) return;

		this.Value = id;

		this.$Emit('change', id);
	},

	/* The tab of a place opened, as a press opens it; focus: the focus goes to it. */
	Open: function (index, focus) {
		var item = (this.Items || [])[index];
		var root = this.$Element();
		var tab;

		if (!item || item.Disabled) return;

		this.Changed(item.ID);

		tab = focus && root ? root.querySelector('.elemenx-tab[data-index="' + index + '"]') : null;

		if (tab)
			tab.focus();
	}
});
