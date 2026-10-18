/*
 * A context menu over its content: a right click, the Menu key or Shift+F10 inside the default slot opens a
 * multi-level MenuList at the pointer (or under the focused element). Items: as in MenuList. Before it opens, the
 * open event carries {Target (the element pressed), X, Y}: the owner may change Items for that target then. The
 * select event carries {Item, Target}. Disabled leaves the browser menu alone. Sheet: true, or 'auto' (on a narrow or
 * a touch screen), shows the menu as a sheet from the bottom of the screen with its Title, as on a phone (a long
 * press opens it there).
 */
Elemenx.Component('ContextMenu', {
	$TemplateURL: 'ContextMenu.html',
	$StyleURL: 'ContextMenu.css',
	Items: [],
	Disabled: false,
	Sheet: false,
	Title: '',
	Open: false,
	X: 0,
	Y: 0,
	Target: null,

	Show: function (target, x, y) {
		var root = this.$Element();

		this.Target = target;
		this.X = Math.round(x);
		this.Y = Math.round(y);

		this.$Emit('open', {Target: target, X: this.X, Y: this.Y});

		this.Open = true;

		window.setTimeout(function () {
			var first = root.querySelector('.elemenx-context-point .elemenx-menu:not([hidden]) > .elemenx-menu-entry > .elemenx-option:not(.disabled)');
			if (first)
				first.focus();
		}, 0);
	},

	Pressed: function (event) {
		if (this.Disabled || !this.Items.length) return;

		event.preventDefault();

		this.Show(event.target, event.clientX, event.clientY);
	},

	Key: function (event) {
		var rect;

		if (this.Disabled || this.Open || !this.Items.length) return;
		if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;

		event.preventDefault();

		rect = event.target.getBoundingClientRect();

		this.Show(event.target, rect.left + 8, rect.bottom);
	},

	Picked: function (item) {
		var target = this.Target;

		this.Open = false;

		this.$Emit('select', {Item: item, Target: target});

		if (target && target.focus && document.contains(target))
			target.focus();
	},

	Close: function (reason) {
		this.Open = false;

		if ((reason === 'escape' || reason === 'back') && this.Target && this.Target.focus)
			this.Target.focus();
	}
});
