/*
 * A chat layout built on elemenx-screen, elemenx-container and elemenx-column.
 * Slots: sidebar (conversations), header, default (the messages), composer.
 * SidebarOpen shows the sidebar; SidebarWidth is resizable. The message list follows new messages while the reader
 * is at its end, and stays in place while the reader scrolls back through the history.
 */
Elemenx.Component('Chat', {
	$TemplateURL: 'Chat.html',
	$StyleURL: 'Chat.css',
	SidebarOpen: true,
	SidebarWidth: 280,
	AtEnd: true,

	$OnReady: function () {
		var self = this;
		var list = this.$Element().querySelector('.elemenx-chat-messages');

		this.Observer = new MutationObserver(function () {
			if (self.AtEnd)
				list.scrollTop = list.scrollHeight;
		});

		this.Observer.observe(list, {childList: true, subtree: true, characterData: true});

		list.scrollTop = list.scrollHeight;
	},

	$OnDestroy: function () {
		if (this.Observer)
			this.Observer.disconnect();
	},

	Scrolled: function (event, node) {
		this.AtEnd = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
	},

	ToEnd: function () {
		var list = this.$Element().querySelector('.elemenx-chat-messages');

		list.scrollTo({top: list.scrollHeight, behavior: 'smooth'});

		this.AtEnd = true;
	},

	Resized: function (event) {
		this.SidebarWidth = event.detail.Width;

		this.$Emit('resize', this.SidebarWidth);
	}
});