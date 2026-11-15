/*
 * A menu of a game: the main menu, a pause menu, a list of saves. Title and Subtitle above the Items ([{ID, Label,
 * Hint, Icon, Disabled}]). Arrow Up and Down (and a gamepad) move between the items and go round; Enter or a press
 * emits select ({ID, Item}); Escape emits back. AutoFocus (true) puts the focus on the first item when it shows.
 */
Elemenx.Component('GameMenu', {
	$TemplateURL: 'GameMenu.html',
	$StyleURL: 'GameMenu.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'A menu of a game: the main menu, a pause menu, a list of saves.',
		Container: true,
		Events: {
			select: 'An item was chosen: {ID, Item}.',
			back: 'Escape was pressed: go back.'
		},
		Props: {
			Title: 'The title above the items.',
			Subtitle: 'A line under the title.',
			Items: 'The items: [{ID, Label, Hint, Icon, Disabled}].',
			AutoFocus: 'Puts the focus on the first item when it shows.'
		},
		Sample: {Title: 'Paused', Subtitle: 'Chapter II · The northern road'}
	},
	Title: '',
	Subtitle: '',
	Items: [],
	AutoFocus: true,

	$OnReady: function () {
		var self = this;

		if (!this.AutoFocus) return;

		window.setTimeout(function () {
			var first = self.Buttons()[0];
			if (first)
				first.focus();
		}, 0);
	},

	Buttons: function () {
		var root = this.$Element();

		return root ? Array.prototype.slice.call(root.querySelectorAll('.elemenx-game-menu-item:not([disabled])')) : [];
	},

	/* An item pressed (its Button): told unless it is off. */
	Chosen: function (item) {
		if (item && !item.Disabled)
			this.$Emit('select', {ID: item.ID, Item: item});
	},

	/* Up and down (round), Home and End among its items: ElemenxHelpers.Rove. */
	Key: function (event) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
			this.$Service('ElemenxHelpers').Rove(event, this.Buttons());

			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();

			this.$Emit('back');
		}
	}
});
