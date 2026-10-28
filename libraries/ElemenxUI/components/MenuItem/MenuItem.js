/*
 * An item of a menu declared in the template of a Menu (its default slot) or of a ContextMenu (slot items): ID,
 * Label, Icon, Shortcut, Disabled, Danger, Checked, Group; Separator draws a line instead; MenuItem children make a
 * submenu. Role is what the system does for it in a menu of a program (NativeMenu: undo, copy, quit...). It shows nothing by itself: the menu reads it. A press on it emits select with the item, here as well as
 * on the menu.
 */
Elemenx.Component('MenuItem', {
	$TemplateURL: 'MenuItem.html',
	$Meta: {
		Group: 'menus',
		Icon: 'launcher',
		Description: 'An item of a menu declared in the template of a Menu (its default slot) or of a ContextMenu (slot items): ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Group; Separator draws a line instead; MenuItem children make a submenu.',
		Container: true,
		Children: ['MenuItem'],
		Events: {
			select: 'It was chosen in its menu: the item.'
		},
		Props: {
			ID: 'The ID of the item, in the select event.',
			Label: 'The text of the item.',
			Icon: 'An icon before the text.',
			Shortcut: 'The shortcut shown at its end (Ctrl+Z).',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Danger: 'Paints it as a dangerous action.',
			Checked: 'Shows a check before it (true or false makes it a toggle).',
			Separator: 'A line in place of an item.',
			Group: 'A title of a group in place of an item.',
			Role: 'In a menu of a program (NativeMenu), what the system does for it: undo, copy, paste, quit...'
		},
		Sample: {ID: 'undo', Label: 'Undo', Icon: 'undo', Shortcut: 'Ctrl+Z'}
	},
	ID: '',
	Label: '',
	Icon: '',
	Shortcut: '',
	Disabled: false,
	Danger: false,
	Checked: null,
	Separator: false,
	Group: '',
	Role: '',

	/* The menu chose this item (the event elemenx-menu-pick on its declaration). */
	Picked: function (event) {
		event.stopPropagation();

		this.$Emit('select', event.detail);
	}
});
