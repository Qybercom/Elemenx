/*
 * A command of a RibbonGroup: <RibbonButton ID="paste" Label="Paste" Icon="paste" Size="large" />. Size: large (a
 * 32px icon over the label, a whole column of the group), small (an icon and the label, one row) or icon (the icon
 * alone; Label is its name). Toggle makes it a button that stays pressed (Pressed). Items opens a menu of them
 * (MenuList items); with Split the button runs its own command and only the arrow opens the menu. KeyTip names its
 * key tip.
 * Events: click ({ID, Pressed}), select (the chosen item). The Ribbon also reports every command: command ({ID, Item}).
 */
Elemenx.Component('RibbonButton', {
	$TemplateURL: 'RibbonButton.html',
	ID: '',
	Label: '',
	Icon: '',
	Size: 'small',
	Title: '',
	KeyTip: '',
	Toggle: false,
	Pressed: false,
	Split: false,
	Items: [],
	Disabled: false,
	Open: false,

	$OnCreate: function () {
		this.HasMenu = function (items, split) {
			return !!(items && items.length) && !(split && split !== 'false');
		};
	},

	Press: function () {
		if (this.HasMenu(this.Items, this.Split)) {
			this.Menu();

			return;
		}

		if (this.Toggle && this.Toggle !== 'false')
			this.Pressed = !this.Pressed;

		this.$Emit('click', {ID: this.ID, Pressed: !!this.Pressed});

		this.Command(null);
	},

	Menu: function () {
		var root = this.$Element();

		this.Open = !this.Open;

		if (!this.Open) return;

		window.setTimeout(function () {
			var first = root.querySelector('.elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();
		}, 0);
	},

	Picked: function (item) {
		this.Open = false;

		this.$Emit('select', item);

		this.Command(item);
	},

	Dismissed: function (reason) {
		var root = this.$Element();

		this.Open = false;

		if (reason === 'escape' || reason === 'back')
			(root.querySelector('.elemenx-ribbon-split') || root.querySelector('.elemenx-ribbon-button')).focus();
	},

	/* Tells the Ribbon (and a shrunk group around the button) that a command ran. */
	Command: function (item) {
		this.$Element().dispatchEvent(new CustomEvent('elemenx-ribbon-command', {bubbles: true, detail: {ID: this.ID, Item: item}}));
	}
});
