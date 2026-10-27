<!-- generated -->
# Чат

Чат с комнатами: имя, под которым пишешь, комнаты в боковой панели, сообщения, поле ввода с эмодзи и бот в одной из комнат. Сообщения сразу доходят до других вкладок браузера, без сервера. Готовый проект — `examples/Tutorials/Chat`.

Чему вы научитесь: раскладка `Chat` и её части, `Elemenx.Messaging` между вкладками, сервис, который оповещает слушателей, и как тот же код говорит с сервером через WebSocket.

## 1. Раскладка

`Chat` — каркас: боковая панель, шапка, сообщения и поле ввода в его слотах. Список сообщений следует за новыми, пока читатель в конце, и стоит на месте, пока читатель листает историю.

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

`Position` сообщает, где сообщение стоит в серии сообщений одного автора (`first`, `middle`, `last`, `single`): имя показывается на первом сообщении серии, а аватар — на последнем, как в мессенджере. `$index` — позиция элемента в его `*for`.

## 2. Комнаты и их сообщения

Их хранит сервис: держит в хранилище браузера, отправляет каждое новое в другие вкладки и оповещает слушателей.

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

`this.$Messaging()` — сокет сервиса: `Send` доходит до каждого сокета, который слушает канал, в этой вкладке и в остальных (вкладки сайта связывает `BroadcastChannel`), в её фреймах и воркерах. `OnMessage`, `OffMessage` и бот дополняют его (см. проект).

## 3. Компонент слушает

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

Поле ввода отправляет по Enter (Shift+Enter — новая строка), растёт вместе с текстом и предлагает эмодзи для слова у курсора.

## 4. Сервер

Между вкладками — это демонстрация; между людьми сообщения идут через сервер. Меняется только сервис: WebSocket вместо сокета `Messaging`.

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

`Send` тогда пишет `this.Socket.Send(JSON.stringify(message))`, который возвращает `false`, пока сокет закрыт или переполнен (см. [WebSocket](/network/websocket); [протокол](/network/protocols) может кодировать и декодировать сообщения за вас).

## Дальше

- Видеозвонок: `CallStage`, `CallTile` и `CallControls` из ElemenxUI и [WebRTC](/network/webrtc).
- [Обмен сообщениями](/data/messaging): фреймы, окна и воркеры.
