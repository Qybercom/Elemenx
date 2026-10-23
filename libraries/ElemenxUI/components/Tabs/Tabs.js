/*
 * A strip of tabs. Tabs: [{ID, Label, Icon, Badge, Closable, Disabled}]; Value is the ID of the active tab. Variant:
 * line (an underline, the default), pill (rounded buttons) or editor (the tabs of the files of an editor). A Closable tab
 * (or every tab, with Closable on the strip) has a cross; the middle button, Delete and Ctrl+W close it too. Keys: the
 * arrows, Home and End move between the tabs. The owner renders the content of the active tab; content in the default
 * slot goes after the tabs (an action, a button that adds a tab). Size; Label names the strip for screen readers.
 * Tabs may be declared in the template too, with their content: <Tab ID="general" Label="General">...</Tab> in the
 * default slot (see Tab). Their tabs follow the ones of Tabs in the strip, and the Tabs shows the content of the current
 * one under the strip (the first tab that is not Disabled while Value names none).
 * Events: change (the ID), close (the ID).
 */
Elemenx.Component('Tabs', {
	$TemplateURL: 'Tabs.html',
	$StyleURL: 'Tabs.css',
	$Meta: {
		Group: 'navigation',
		Icon: 'panel-bottom',
		Description: 'A strip of tabs.',
		Container: true,
		Events: ['change', 'close'],
		Props: {
			Tabs: 'The tabs: [{ID, Label, Icon, Badge, Closable, Disabled}] (Tab children add more).',
			Value: 'The ID of the current tab.',
			Variant: {Options: ['line', 'pill', 'editor'], Description: 'line (an underline), pill (rounded buttons) or editor (the tabs of files).'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Closable: 'Every tab has a cross.',
			Label: 'The name of the strip for screen readers.'
		}
	},
	Tabs: [],
	Value: null,
	Variant: 'line',
	Size: 'medium',
	Closable: false,
	Label: '',
	Declared: [],

	$OnCreate: function () {
		var self = this;

		/* The tabs of the strip: the ones of Tabs, then the declared ones. */
		this.Items = function (tabs, declared) {
			return (tabs || []).concat(declared || []);
		};

		/* The ID of the current tab: Value, or the first tab that is not disabled while Value names none. */
		this.Current = function (value, items) {
			var i = 0;

			while (i < items.length) {
				if (items[i].ID === value) return value;

				i++;
			}

			i = 0;

			while (i < items.length) {
				if (!items[i].Disabled) return items[i].ID;

				i++;
			}

			return value;
		};

		/* The panels of the declared tabs show the current one: an empty marker, rendered when the current tab changes. */
		this.Show = function (value, declared, tabs) {
			return {
				Render: function () {
					var current = String(self.Current(value, self.Items(tabs, declared)));

					self.$Service('Panels').Read(self.$Element(), '.elemenx-tab-panel', '.elemenx-tabs').forEach(function (panel) {
						var active = panel.getAttribute('data-id') === current;

						panel.classList.toggle('active', active);

						if (active)
							panel.dispatchEvent(new CustomEvent('tabopen'));
					});
				}
			};
		};
	},

	$OnReady: function () {
		var self = this;

		this.Read();

		this.StopWatch = this.$Service('Panels').Watch(this.$Element(), '.elemenx-tab-panel', function () {
			self.Read();
		});
	},

	$OnDestroy: function () {
		if (this.StopWatch)
			this.StopWatch();
	},

	/* Reads the declared tabs from their panels. */
	Read: function () {
		var panels = this.$Service('Panels');
		var declared = panels.Read(this.$Element(), '.elemenx-tab-panel', '.elemenx-tabs').map(function (panel) {
			var data = panels.Data(panel);

			return {ID: data.Id || '', Label: data.Label || '', Icon: data.Icon || '', Badge: data.Badge, Closable: data.Closable === 'true', Disabled: data.Disabled === 'true'};
		});
		if (JSON.stringify(declared) !== JSON.stringify(this.Declared))
			this.Declared = declared;
	},

	Select: function (index, node) {
		var tab = this.Items(this.Tabs, this.Declared)[index];
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
		var tab = this.Items(this.Tabs, this.Declared)[Number(node.closest('.elemenx-tab').getAttribute('data-index'))];

		event.stopPropagation();

		if (tab)
			this.$Emit('close', tab.ID);
	},

	Middle: function (event, node) {
		var tab = this.Items(this.Tabs, this.Declared)[Number(node.getAttribute('data-index'))];
		if (event.button === 1 && tab && (tab.Closable || this.Closable))
			this.$Emit('close', tab.ID);
	},

	Key: function (event, node) {
		var current = event.target.closest('.elemenx-tab');
		var index = current ? Number(current.getAttribute('data-index')) : 0;
		var items = this.Items(this.Tabs, this.Declared);
		var count = items.length;
		var next = index;
		var steps = 0;
		var direction = 0;
		var tab = items[index];

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

			if (!items[next].Disabled) break;

			steps++;
		}

		this.Select(next, node);
	}
});