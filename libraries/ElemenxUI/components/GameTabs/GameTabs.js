/*
 * The tabs of a game window: Items [{ID, Label, Disabled}] in a column (Orientation 'vertical', the default) or a
 * row, numbered 01, 02... (Numbered). Value is the ID of the open tab; a press or the arrows (Home, End) open another
 * and emit change with its ID. Label names the list for screen readers.
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

	$OnCreate: function () {
		/* The number of a tab: 01, 02... */
		this.Number = function (index) {
			return (index < 9 ? '0' : '') + (index + 1);
		};
	},

	Open: function (index, focus) {
		var item = (this.Items || [])[index];
		var root = this.$Element();
		var button;

		if (!item || item.Disabled) return;

		if (item.ID !== this.Value) {
			this.Value = item.ID;

			this.$Emit('change', item.ID);
		}

		button = focus && root ? root.querySelector('.elemenx-game-tab[data-index="' + index + '"]') : null;

		if (button)
			button.focus();
	},

	Pressed: function (event, node) {
		this.Open(Number(node.getAttribute('data-index')), false);
	},

	Key: function (event) {
		var items = this.Items || [];
		var vertical = this.Orientation !== 'horizontal';
		var index = -1;
		var step = 0;
		var tries = 0;

		items.forEach(function (item, position) {
			if (item.ID === this.Value)
				index = position;
		}, this);

		if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) step = 1;
		else if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) step = -1;

		if (event.key === 'Home') {
			index = -1;
			step = 1;
		}

		if (event.key === 'End') {
			index = items.length;
			step = -1;
		}

		if (!step || !items.length) return;

		event.preventDefault();

		do {
			index = (index + step + items.length) % items.length;

			tries++;
		} while (items[index].Disabled && tries < items.length);

		this.Open(index, true);
	}
});
