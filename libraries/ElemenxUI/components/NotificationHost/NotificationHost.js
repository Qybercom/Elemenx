/*
 * The notifications of the Application drawn by ElemenxUI (Native.Notify with Look elemenx): cards of Items
 * ([{ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}]}]), the newest at the bottom, in the window by the
 * corner of the screen of a program or in the corner of the page on the web (Page). Choose(item, action) is called
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
			Items: 'The notifications: [{ID, Title, Text, Icon, Image, Variant, Actions: [{ID, Label}]}].',
			Page: 'Floats in the corner of the page (on the web), not in a window of its own.',
			Choose: 'Called with the notification and the action pressed (null for the card).',
			Close: 'Called with the notification closed.',
			Fit: 'Called with {Width, Height} after each drawing: the size of the cards.'
		},
		Sample: {Items: [{ID: 'mail', Title: 'New mail', Text: 'Ada sent the report.', Icon: 'mail', Actions: [{ID: 'open', Label: 'Open'}]}]}
	},
	Items: [],
	Page: false,
	Choose: null,
	Close: null,
	Fit: null,

	$OnCreate: function () {
		var self = this;

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
	},

	$OnDestroy: function () {
		if (this.Watcher)
			this.Watcher.disconnect();
	},

	Item: function (node) {
		var id = node.closest('[data-id]').getAttribute('data-id');

		return this.Items.filter(function (item) {
			return String(item.ID) === id;
		})[0] || null;
	},

	Pressed: function (event, node) {
		var item = this.Item(node);
		if (item && typeof this.Choose === 'function')
			this.Choose(item, null);
	},

	Acted: function (event, node) {
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
	}
});
