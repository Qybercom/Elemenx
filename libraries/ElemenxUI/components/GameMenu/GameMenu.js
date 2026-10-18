/*
 * A menu of a game: the main menu, a pause menu, a list of saves. Title and Subtitle above the Items ([{ID, Label,
 * Hint, Icon, Disabled}]). Arrow Up and Down (and a gamepad) move between the items and go round; Enter or a press
 * emits select ({ID, Item}); Escape emits back. AutoFocus (true) puts the focus on the first item when it shows.
 */
Elemenx.Component('GameMenu', {
	$TemplateURL: 'GameMenu.html',
	$StyleURL: 'GameMenu.css',
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

	Chosen: function (event, node) {
		var item = (this.Items || [])[Number(node.getAttribute('data-index'))];
		if (item && !item.Disabled)
			this.$Emit('select', {ID: item.ID, Item: item});
	},

	Key: function (event) {
		var buttons = this.Buttons();
		var index = buttons.indexOf(event.target);

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!buttons.length) return;

			event.preventDefault();

			index = index === -1 ? 0 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;

			buttons[index].focus();

			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();

			this.$Emit('back');
		}
	}
});
