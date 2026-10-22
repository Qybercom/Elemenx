/*
 * A strip of tabs. Tabs: [{ID, Label, Icon, Badge, Closable, Disabled}]; Value is the ID of the active tab. Variant:
 * line (an underline, the default), pill (rounded buttons) or editor (the tabs of the files of an editor). A Closable tab
 * (or every tab, with Closable on the strip) has a cross; the middle button, Delete and Ctrl+W close it too. Keys: the
 * arrows, Home and End move between the tabs. The owner renders the content of the active tab; content in the default
 * slot goes after the tabs (an action, a button that adds a tab). Size; Label names the strip for screen readers.
 * Events: change (the ID), close (the ID).
 */
Elemenx.Component('Tabs', {
	$TemplateURL: 'Tabs.html',
	$StyleURL: 'Tabs.css',
	Tabs: [],
	Value: null,
	Variant: 'line',
	Size: 'medium',
	Closable: false,
	Label: '',

	Select: function (index, node) {
		var tab = this.Tabs[index];
		var element;

		if (!tab || tab.Disabled) return;

		if (this.Value !== tab.ID) {
			this.Value = tab.ID;

			this.$Emit('change', tab.ID);
		}

		element = node.closest('.elemenx-tabs').querySelector('.elemenx-tab[data-index="' + index + '"]');

		if (element) {
			element.focus();
			element.scrollIntoView({block: 'nearest', inline: 'nearest'});
		}
	},

	Pick: function (event, node) {
		this.Select(Number(node.getAttribute('data-index')), node);
	},

	Close: function (event, node) {
		var tab = this.Tabs[Number(node.closest('.elemenx-tab').getAttribute('data-index'))];

		event.stopPropagation();

		if (tab)
			this.$Emit('close', tab.ID);
	},

	Middle: function (event, node) {
		var tab = this.Tabs[Number(node.getAttribute('data-index'))];
		if (event.button === 1 && tab && (tab.Closable || this.Closable))
			this.$Emit('close', tab.ID);
	},

	Key: function (event, node) {
		var current = event.target.closest('.elemenx-tab');
		var index = current ? Number(current.getAttribute('data-index')) : 0;
		var count = this.Tabs.length;
		var next = index;
		var steps = 0;
		var direction = 0;
		var tab = this.Tabs[index];

		if (!current || !count) return;

		if (Elemenx.Locale.Key(event) === 'ArrowRight') direction = 1;
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft') direction = -1;
		else if (Elemenx.Locale.Key(event) === 'Home') next = -1;
		else if (Elemenx.Locale.Key(event) === 'End') next = count;

		if ((Elemenx.Locale.Key(event) === 'Delete' || (Elemenx.Locale.Key(event) === 'w' && event.ctrlKey)) && tab && (tab.Closable || this.Closable)) {
			event.preventDefault();

			this.$Emit('close', tab.ID);

			return;
		}

		if (Elemenx.Locale.Key(event) === 'Home')
			direction = 1;

		if (Elemenx.Locale.Key(event) === 'End')
			direction = -1;

		if (!direction) return;

		event.preventDefault();

		while (steps < count) {
			next = (next + direction + count) % count;

			if (!this.Tabs[next].Disabled) break;

			steps++;
		}

		this.Select(next, node);
	}
});