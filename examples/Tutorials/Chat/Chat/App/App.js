/*
 * The chat: the rooms in the sidebar, the messages of the room open, and the composer. It asks for a name first.
 * The Rooms Service gives the messages and tells the new ones, of this tab or another.
 */
Elemenx.Component('App', {
	$TemplateURL: 'App.html',
	$StyleURL: 'App.css',
	Name: '',
	Room: 'general',
	Rooms: [],
	Messages: [],

	$OnCreate: function () {
		var self = this;
		var rooms = this.$Service('Rooms');
		var store = this.$Storage.Local.Namespace('talk-me');

		this.Rooms = rooms.List;
		this.Name = store.Get('name') || '';
		this.Messages = rooms.Messages(this.Room);

		/* A new message: into the list when it is of the room open. */
		this.Heard = function (message) {
			if (message.Room === self.Room)
				self.Messages = self.Messages.concat([message]);
		};

		/* The position of a message in a run of one author: the name on the first, the avatar on the last. */
		this.Position = function (messages, index) {
			var same = function (other) {
				return other && other.Author === messages[index].Author;
			};
			var before = same(messages[index - 1]);
			var after = same(messages[index + 1]);

			return before && after ? 'middle' : before ? 'last' : after ? 'first' : 'single';
		};

		this.Clock = function (time) {
			var date = new Date(time);

			return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
		};

		rooms.OnMessage(this.Heard);
	},

	$OnDestroy: function () {
		this.$Service('Rooms').OffMessage(this.Heard);
	},

	/* The name given: kept for the next visit. */
	Joined: function (name) {
		this.Name = name;

		this.$Storage.Local.Namespace('talk-me').Set('name', name);
	},

	Opened: function (item) {
		this.Room = item.ID;
		this.Messages = this.$Service('Rooms').Messages(item.ID);
	},

	Sent: function (text) {
		this.$Service('Rooms').Send(this.Room, this.Name, text);
	}
});
