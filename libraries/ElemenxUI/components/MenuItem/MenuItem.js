/*
 * An item of a menu declared in the template of a Menu (its default slot) or of a ContextMenu (slot items): ID,
 * Label, Icon, Shortcut, Disabled, Danger, Checked, Group; Separator draws a line instead; MenuItem children make a
 * submenu. It shows nothing by itself: the menu reads it. A press on it emits select with the item, here as well as
 * on the menu.
 */
Elemenx.Component('MenuItem', {
	$TemplateURL: 'MenuItem.html',
	ID: '',
	Label: '',
	Icon: '',
	Shortcut: '',
	Disabled: false,
	Danger: false,
	Checked: null,
	Separator: false,
	Group: '',

	/* The menu chose this item (the event elemenx-menu-pick on its declaration). */
	Picked: function (event) {
		event.stopPropagation();

		this.$Emit('select', event.detail);
	}
});
