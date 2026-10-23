/*
 * A chat layout built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: sidebar (conversations), header, default (the messages), composer.
 * SidebarOpen shows the sidebar (a chat 600 pixels wide or less, as on a phone, hides it); SidebarWidth is
 * resizable. The message list follows new messages while the reader is at its end, and stays in place while the reader
 * scrolls back through the history.
 * Selection is the IDs of the messages chosen (the select events of the ChatMessage): while it has some, a bar takes
 * the place of the header with their count, a button that lets them go (the clear event; Escape too) and the slot
 * selection for the actions on them. Each ChatMessage takes [selecting] and [selected] from it.
 */
Elemenx.Component('Chat', {
	$TemplateURL: 'Chat.html',
	$StyleURL: 'Chat.css',
	$Meta: {
		Group: 'social',
		Icon: 'comment',
		Description: 'A chat layout built on elemenx-screen, elemenx-container and elemenx-column.',
		Container: true,
		Slots: ['sidebar', 'header', 'selection', 'composer'],
		Events: ['clear', 'resize'],
		Props: {
			SidebarOpen: 'Shows the sidebar of the conversations.',
			SidebarWidth: 'The width of the sidebar, in pixels (it can be dragged).',
			Selection: 'The IDs of the messages chosen; a bar of actions shows while it has some.'
		}
	},
	SidebarOpen: true,
	SidebarWidth: 280,
	AtEnd: true,
	Selection: [],

	/*
	 * The list keeps to its end while the reader is there: when messages come, and when what is in them grows later (a
	 * picture or a sticker that loads, the styles of a component, a list that was hidden and shows).
	 */
	$OnReady: function () {
		var self = this;
		var list = this.$Element().querySelector('.elemenx-chat-messages');

		this.Stick = function () {
			if (self.AtEnd)
				list.scrollTop = list.scrollHeight;
		};

		this.Sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(this.Stick) : null;

		this.Watch = function () {
			if (!self.Sizes) return;

			self.Sizes.disconnect();
			self.Sizes.observe(list);

			Array.prototype.forEach.call(list.children, function (child) {
				self.Sizes.observe(child);
			});
		};

		this.Observer = new MutationObserver(function () {
			self.Watch();
			self.Stick();
		});

		this.Observer.observe(list, {childList: true, subtree: true, characterData: true});

		list.addEventListener('load', this.Stick, true);

		this.Watch();

		list.scrollTop = list.scrollHeight;

		window.requestAnimationFrame(this.Stick);
	},

	$OnDestroy: function () {
		var list = this.$Element() && this.$Element().querySelector('.elemenx-chat-messages');

		if (this.Observer)
			this.Observer.disconnect();

		if (this.Sizes)
			this.Sizes.disconnect();

		if (list)
			list.removeEventListener('load', this.Stick, true);
	},

	Scrolled: function (event, node) {
		this.AtEnd = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
	},

	ToEnd: function () {
		var list = this.$Element().querySelector('.elemenx-chat-messages');

		list.scrollTo({top: list.scrollHeight, behavior: 'smooth'});

		this.AtEnd = true;
	},

	Clear: function () {
		this.$Emit('clear');
	},

	Key: function (event) {
		if (event.key !== 'Escape' || !(this.Selection || []).length || event.defaultPrevented) return;

		event.preventDefault();

		this.$Emit('clear');
	},

	Resized: function (event) {
		this.SidebarWidth = event.detail.Width;

		this.$Emit('resize', this.SidebarWidth);
	}
});