# A chat

A chat of rooms: a name to write under, the rooms in a sidebar, the messages, a composer with emoji, and a bot in one of the rooms. The messages reach the other tabs of the browser at once, without a server. The finished project is `examples/Tutorials/Chat`.

What you learn: the `Chat` layout and its parts, `Elemenx.Messaging` between tabs, a Service that tells its listeners, and how the same code talks to a server through a WebSocket.

## 1. The layout

`Chat` is the frame: a sidebar, a header, the messages and the composer in its slots. The list of messages follows the new ones while the reader is at its end, and stays in place while the reader scrolls back.

```html
<div class="talk">
	<div class="talk-join" *if="!Name"><Join (join)="Joined" /></div>
	<Chat *if="Name">
		<div slot="sidebar" class="elemenx-column" style="gap: 8px; padding: 8px;">
			<strong style="padding: 4px 8px;">Rooms</strong>
			<NavList [items]="Rooms" [value]="Room" Label="Rooms" (select)="Opened" />
		</div>
		<div slot="header" class="elemenx-container" style="gap: 8px; align-items: center;">
			<strong class="talk-room">#{{Room}}</strong>
			<span class="elemenx-spacer"></span>
			<Avatar [name]="Name" Size="small" Status="online" />
		</div>
		<ChatMessage *for="message of Messages" *key="message.ID" [id]="message.ID" [author]="message.Author" [text]="message.Text" [time]="Clock(message.Time)" [own]="message.Author === Name" [position]="Position(Messages, $index)" />
		<ChatComposer slot="composer" Placeholder="A message" (send)="Sent" />
	</Chat>
</div>
```

`Position` tells a message where it stands in a run of one author (`first`, `middle`, `last`, `single`): the name shows on the first message of a run and the avatar on the last, as in a messenger. `$index` is the place of the item in its `*for`.

## 2. The rooms and their messages

A Service holds them: it keeps them in the storage of the browser, sends each new one to the other tabs, and tells its listeners.

```js
Elemenx.Service('Rooms', {
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

		if (room === 'help')
			this.Bot(text);
	},

	/* Each message once: the socket of this tab may hear its own messages too. */
	Told: function (message) {
		if (this.Seen[message.ID]) return;

		this.Seen[message.ID] = true;

		this.Listeners.slice().forEach(function (callback) {
			callback(message);
		});
	}
});
```

`this.$Messaging()` is a socket of the Service: `Send` reaches every socket that listens to the channel, in this tab and in the others (a `BroadcastChannel` joins the tabs of a site), in its frames and in its workers. `OnMessage`, `OffMessage` and the bot complete it (see the project).

## 3. The component listens

```js
$OnCreate: function () {
	var self = this;
	var rooms = this.$Service('Rooms');

	this.Rooms = rooms.List;
	this.Messages = rooms.Messages(this.Room);

	this.Heard = function (message) {
		if (message.Room === self.Room)
			self.Messages = self.Messages.concat([message]);
	};

	rooms.OnMessage(this.Heard);
},

$OnDestroy: function () {
	this.$Service('Rooms').OffMessage(this.Heard);
},

Sent: function (text) {
	this.$Service('Rooms').Send(this.Room, this.Name, text);
}
```

The composer sends with Enter (Shift+Enter is a new line), grows with its text, and offers emoji for the word at the caret.

## 4. A server

Between tabs is a demo; between people the messages go through a server. The Service changes, and nothing else: a WebSocket in place of the socket of `Messaging`.

```js
$OnCreate: function () {
	var self = this;

	this.Listeners = [];
	this.Seen = {};
	this.Socket = this.$Network().WebSocket({URL: 'wss://chat.example.com/'});

	this.Socket.On('Transport.Data', function (event) {
		self.Told(JSON.parse(event.Data.Data));
	});

	/* A WebSocket does not reconnect by itself: again, a moment after it closed. */
	this.Socket.On('Transport.Close', function () {
		window.setTimeout(function () {
			self.Socket.Connect();
		}, 2000);
	});

	this.Socket.Connect();
}
```

`Send` then writes `this.Socket.Send(JSON.stringify(message))`, which returns `false` while the socket is closed or full (see [WebSocket](/network/websocket); a [Protocol](/network/protocols) can encode and decode the messages for you).

## Next

- A call with video: `CallStage`, `CallTile` and `CallControls` of ElemenxUI, and [WebRTC](/network/webrtc).
- [Messaging](/data/messaging): frames, windows and workers.
