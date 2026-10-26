/*
 * The notifications of the Application drawn by ElemenxUI (Native.Notify with Look elemenx): cards of Items
 * ([{ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}], Progress, Duration, Stamp, Component, Props, Bare}]),
 * the newest next to the corner, in the window by the corner of the screen of a program or in the corner of the page
 * on the web (Page, Corner). A card with a Duration shows the time it has left, held while the pointer is over it
 * (Hold(item), Release(item)); Progress (0 to 1) draws a bar of a task. A card of a Component of the Application holds
 * it with its Props and Notification ({ID, Choose(action), Close()}): an invitation to a call, say (CallInvite); Bare
 * leaves it without the frame of a card. More is the number of the cards past the limit. Choose(item, action) is called
 * with a press on a card (action null) or on one of its buttons, Close(item) with its close button. The theme draws
 * them: the elemenx-notification classes and the tokens of the surface.
 */
Elemenx.Component('NotificationHost', {
	$TemplateURL: 'NotificationHost.html',
	$StyleURL: 'NotificationHost.css',
	$Meta: {
		Group: 'overlays',
		Icon: 'bell',
		Description: 'The notifications of the Application drawn by ElemenxUI, in a window by the corner of the screen or in the page.',
		Props: {
			Items: 'The notifications: [{ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}], Progress, Duration, Component, Props, Bare}].',
			More: 'The number of the notifications past the limit.',
			Page: 'Floats in the corner of the page (on the web), not in a window of its own.',
			Corner: {Options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'], Description: 'The corner of the page it floats in (Page).'},
			Choose: 'Called with the notification and the action pressed (null for the card).',
			Close: 'Called with the notification closed.',
			Hold: 'Called with the notification under the pointer: its time stops.',
			Release: 'Called with the notification the pointer left: its time goes on.',
			Fit: 'Called with {Width, Height} after each drawing: the size of the cards.'
		},
		Sample: {Items: [{ID: 'mail', Title: 'New mail', Text: 'Ada sent the report.', Icon: 'mail', Actions: [{ID: 'open', Label: 'Open'}]}]}
	},
	Items: [],
	More: 0,
	Page: false,
	Corner: 'bottom-right',
	Choose: null,
	Close: null,
	Hold: null,
	Release: null,
	Fit: null,

	$OnCreate: function () {
		var self = this;
		var custom = {};

		/* The size of the cards: told after each drawing of them, and as it changes (its styles come to its window a moment later). */
		this.Measure = function () {
			var host = self.$Element().querySelector('.elemenx-notification-host');
			var box = host ? host.getBoundingClientRect() : null;
			var size = box ? Math.ceil(box.width) + 'x' + Math.ceil(box.height) : '';
			var view = host && host.ownerDocument.defaultView;

			if (!box || typeof self.Fit !== 'function') return;

			if (!self.Watcher && view && typeof view.ResizeObserver === 'function') {
				self.Watcher = new view.ResizeObserver(self.Measure);

				self.Watcher.observe(host);
			}

			if (size === self.Told) return;

			self.Told = size;

			self.Fit({Width: Math.ceil(box.width), Height: Math.ceil(box.height)});
		};

		this.Sized = function (items) {
			return {
				Render: function () {
					if (!items) return;

					/* The Components of the cards gone go too. */
					Object.keys(custom).forEach(function (id) {
						if (!items.some(function (item) {
							return String(item.ID) === id;
						})) {
							custom[id].Instance.$Destroy();

							delete custom[id];
						}
					});

					/* A new list: told again, the window shows it even when its size is the same. */
					self.Told = '';

					/*
					 * By the timers of the page: a window not shown yet runs no frames, but its layout is there to read. Once
					 * more a moment later, when its stylesheets have come.
					 */
					window.setTimeout(self.Measure, 0);
					window.setTimeout(self.Measure, 300);
				}
			};
		};

		/*
		 * The Component of a card, made once for its ID (its props given again as they change), with the controller of
		 * the notification: Choose(action) is a press on that action, Close() closes it (a template calls it).
		 */
		this.Custom = function (item) {
			var id = String(item.ID);
			var props = {};
			var key;

			for (key in item.Props || {}) {
				if (Object.prototype.hasOwnProperty.call(item.Props, key))
					props[key] = item.Props[key];
			}

			props.Notification = {
				ID: item.ID,
				Choose: function (action) {
					if (typeof self.Choose === 'function')
						self.Choose(item, action ? {ID: String(action)} : null);
				},
				Close: function () {
					if (typeof self.Close === 'function')
						self.Close(item);
				}
			};

			if (!custom[id] || custom[id].Name !== item.Component) {
				if (custom[id])
					custom[id].Instance.$Destroy();

				custom[id] = {Name: item.Component, Props: item.Props, Instance: Elemenx.Component(String(item.Component))(props, null, {Application: self.$Application()})};
				custom[id].Source = {Element: custom[id].Instance.$Element()};
			}
			else if (custom[id].Props !== item.Props) {
				custom[id].Props = item.Props;

				custom[id].Instance.$Update(props);
			}

			return custom[id].Source;
		};

		this.Percent = function (value) {
			return Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100) + '%';
		};

		this.Custom.All = custom;
	},

	$OnDestroy: function () {
		var custom = this.Custom.All;

		if (this.Watcher)
			this.Watcher.disconnect();

		Object.keys(custom).forEach(function (id) {
			custom[id].Instance.$Destroy();
		});
	},

	Item: function (node) {
		var id = node.closest('[data-id]').getAttribute('data-id');

		return this.Items.filter(function (item) {
			return String(item.ID) === id;
		})[0] || null;
	},

	Pressed: function (event, node) {
		var item = this.Item(node);

		/* A press inside the Component of a card is the Component's. */
		if (event.target.closest('.elemenx-notification-custom')) return;

		if (item && typeof this.Choose === 'function')
			this.Choose(item, null);
	},

	/* A Button of an action: its index on the element round it. */
	Acted: function (event) {
		var node = event.target.closest('[data-index]');
		var item = this.Item(node);

		event.stopPropagation();

		if (item && typeof this.Choose === 'function')
			this.Choose(item, item.Actions[Number(node.getAttribute('data-index'))] || null);
	},

	Closed: function (event, node) {
		var item = this.Item(node);

		event.stopPropagation();

		if (item && typeof this.Close === 'function')
			this.Close(item);
	},

	Entered: function (event, node) {
		var item = this.Item(node);

		node.classList.add('held');

		if (item && typeof this.Hold === 'function')
			this.Hold(item);
	},

	Left: function (event, node) {
		var item = this.Item(node);

		node.classList.remove('held');

		if (item && typeof this.Release === 'function')
			this.Release(item);
	}
});
