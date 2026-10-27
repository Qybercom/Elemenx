/*
 * The rooms of the chat and their messages. Send(room, author, text) keeps a message and sends it to the other tabs;
 * Messages(room) reads them; OnMessage(callback) hears every new one, of this tab or another. The messages stay in
 * the storage of the browser, the 50 newest of a room.
 */
Elemenx.Service('Rooms', {
	List: [
		{ID: 'general', Label: 'General', Icon: 'comment'},
		{ID: 'random', Label: 'Random', Icon: 'star'},
		{ID: 'help', Label: 'Help', Icon: 'info'}
	],

	$OnCreate: function () {
		var self = this;

		this.Store = this.$Storage.Local.Namespace('talk');
		this.Listeners = [];
		this.Seen = {};
		this.Socket = this.$Messaging();

		/* A message of another tab: kept by that tab already, told to the listeners of this one. */
		this.Socket.On('talk:message', function (message) {
			self.Told(message.Data);
		});
	},

	Messages: function (room) {
		return this.Store.Get(room) || [];
	},

	Send: function (room, author, text) {
		var message = {ID: Date.now() + '-' + Math.random().toString(36).slice(2, 6), Room: room, Author: author, Text: text, Time: new Date().toISOString()};

		this.Store.Set(room, this.Messages(room).concat([message]).slice(-50));
		this.Socket.Send('talk:message', message);
		this.Told(message);

		/* The room Help has a bot that answers. */
		if (room === 'help')
			this.Bot(text);
	},

	Bot: function (text) {
		var self = this;

		window.setTimeout(function () {
			var answer = /price|cost/i.test(text) ? 'It is free.' : /hello|hi/i.test(text) ? 'Hello! Ask me anything.' : 'I am a bot: try "hello" or "price".';
			var reply = {ID: Date.now() + '-bot', Room: 'help', Author: 'Bot', Text: answer, Time: new Date().toISOString()};

			self.Store.Set('help', self.Messages('help').concat([reply]).slice(-50));
			self.Socket.Send('talk:message', reply);
			self.Told(reply);
		}, 400);
	},

	/* Each message once: the socket of this tab may hear its own messages too. */
	Told: function (message) {
		if (this.Seen[message.ID]) return;

		this.Seen[message.ID] = true;

		this.Listeners.slice().forEach(function (callback) {
			callback(message);
		});
	},

	OnMessage: function (callback) {
		this.Listeners.push(callback);
	},

	OffMessage: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
