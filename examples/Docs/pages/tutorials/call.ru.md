<!-- generated -->
# Видеозвонок

Звонок на несколько человек: комната, в которую входят по имени, видео всех на `CallStage`, микрофон и камера на его панели. Браузеры находят друг друга через WebSocket сервера, а затем отправляют видео напрямую друг другу. Готовый проект — `examples/Tutorials/Call`.

Чему вы научитесь: из чего состоит WebRTC-звонок (сигналинг, предложение и ответ, ICE-кандидаты, дорожки), `Network.WebSocket` и `Network.WebRTC` с одним протоколом, сетка соединений, канал данных рядом с медиа, камера и микрофон и компоненты звонка.

## 1. Как встречаются два браузера

```text
 Ada                         server (/signal)                        Grace
  │ join {Room}  ───────────────►│                                     │
  │◄─────────── welcome {Peers: []}                                    │
  │                              │◄──────────────── join {Room} ───────│
  │◄─────────── peer {Grace}     │   welcome {Peers: [Ada]} ──────────►│
  │                              │◄──────── signal {To: Ada, Offer} ───│  Grace offers
  │◄─ signal {From: Grace, Offer}│                                     │
  │── signal {To: Grace, Answer}►│── signal {From: Ada, Answer} ──────►│
  │◄════════ candidates both ways, then video, sound and data directly ═══════►│
```

Сервер только передаёт сообщения **сигналинга**: видео он никогда не видит. Каждый браузер описывает, что он отправляет (**предложение** и **ответ**: кодеки, дорожки), и адреса, по которым до него можно достучаться (**ICE-кандидаты**); затем двое говорят напрямую. STUN-сервер сообщает браузеру его публичный адрес; там, где брандмауэр закрывает все прямые пути, медиа пересылает TURN-сервер, и настоящему сервису он нужен.

## 2. Сигналинг

`Server.WebSocket` в `elemenx.config.js` даёт `elemenx dev` и `elemenx serve` сокет по адресу `/signal`. Он хранит комнаты: `join` получает список остальных (`welcome`), остальные узнают о новичке (`peer`), а `signal` передаётся тому, кого он называет. Весь его код — в проекте, сорок строк.

На странице один протокол кодирует и разбирает JSON сокета и каналов данных, поэтому каждый `Type` — это событие:

```js
Elemenx.Network.Protocol('Signal', {
	Encode: function (value) {
		return JSON.stringify(value);
	},

	Decode: function (text) {
		var data;

		try {
			data = JSON.parse(text);
		}
		catch (error) {
			return {Type: 'Invalid', Data: text};
		}

		return {Type: data.Type || 'Invalid', Data: data};
	}
});
```

```js
this.Socket.On('Protocol.welcome', function (event) {
	event.Data.Peers.forEach(function (peer) {
		self.Peer(peer.ID, peer.Name, true);
	});
});

this.Socket.On('Protocol.peer', function (event) {
	self.Peer(event.Data.ID, event.Data.Name, false);
});
```

Кто предлагает, решается один раз: пришедший позже предлагает всем, кто уже там. Одновременное предложение с обеих сторон — классическая ошибка первого звонка.

## 3. По соединению на каждого

```js
var peer = this.$Network().WebRTC({Configuration: {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]}, Protocol: 'Signal'});

peer.On('Transport.ICECandidate', function (event) {
	if (event.Data.Candidate)
		self.Send(id, {Candidate: event.Data.Candidate});
});

peer.Connect(offering);

peer.Connection().addEventListener('track', function (event) {
	person.Stream = event.streams[0];
});

this.Local.getTracks().forEach(function (track) {
	peer.Connection().addTrack(track, self.Local);
});

if (offering) {
	peer.CreateOffer(function (error, offer) {
		if (!error)
			self.Send(id, {Offer: offer});
	});
}
```

- `Connect(offering)` создаёт `RTCPeerConnection` (а у предлагающего — и канал данных); `Connection()` — это нативное соединение, куда добавляются дорожки и где их слышно.
- Дорожки добавляются до предложения, чтобы оно их описывало.
- Другая сторона отвечает через `AcceptOffer(offer, callback)`, первая принимает ответ через `AcceptAnswer(answer, callback)`.

У каждого есть соединение с каждым другим: **сетка** (mesh). Она проста и не требует медиасервера и выдерживает примерно четыре–шесть человек; дальше каждый браузер отправляет своё видео слишком много раз, и звонок идёт через медиасервер (SFU), который пересылает один поток всем.

## 4. Кандидаты, пришедшие раньше

Кандидат может прийти раньше, чем принято предложение, к которому он относится, и тогда его добавление падает. Храните их, пока описание не установлено:

```js
else if (data.Candidate) {
	if (person.Ready) person.Peer.AddICECandidate(data.Candidate);
	else person.Waiting.push(data.Candidate);
}
```

`Ready(person)`, вызываемый, когда `AcceptOffer` или `AcceptAnswer` завершились, добавляет ожидавших.

## 5. Камера и микрофон

```js
navigator.mediaDevices.getUserMedia({audio: true, video: {width: 640, height: 360}}).then(function (stream) {
	callback(stream);
}, function () {
	callback(null);
});
```

Браузер сначала спрашивает человека, и только на `https://` или `localhost`. Отказ — не конец: звонок продолжается без них, чтобы видеть и слышать остальных. Чтобы выключить звук, выключите дорожку (`track.enabled = false`): соединение остаётся, и включение не требует новых переговоров. Уходя, вызовите `track.stop()` у каждой дорожки: только тогда гаснет индикатор камеры.

## 6. Канал данных рядом с медиа

Соединение несёт ещё и канал данных. Состояние микрофона и камеры идёт по нему от браузера к браузеру, без сервера:

```js
peer.On('Protocol.state', function (event) {
	person.Muted = !!event.Data.Muted;
	person.Camera = !!event.Data.Camera;
});
```

Тот же канал может нести чат, реакции или поднятую руку.

## 7. Сцена

```html
<CallStage *if="State === 'joined'" Layout="grid">
	<CallTile slot="participants" *for="person of People" *key="person.ID" [name]="person.Name" [stream]="person.Stream" [muted]="person.Muted" [camera]="person.Camera" />
	<CallTile slot="self" [name]="Self.Name" [stream]="Self.Stream" [muted]="Self.Muted" [camera]="Self.Camera" Self="true" />
	<CallControls slot="controls" [muted]="Self.Muted" [camera]="Self.Camera" [hide]="['share', 'hand', 'react', 'chat', 'people', 'layout']" (mute)="Muted" (camera)="Filmed" (leave)="Left" />
</CallStage>
```

`CallTile` воспроизводит `MediaStream` (`[stream]`), показывает аватар, пока камера выключена, и зеркалит своё видео, как зеркало. `CallStage` раскладывает плитки сеткой, а своё видео — в угол; `CallControls` испускает `mute`, `camera` и `leave`, а компонент вызывает сервис Room.

## 8. Попробуйте

```bash
cd examples/Tutorials/Call
npm install
npm run dev
```

Откройте страницу в двух окнах, войдите в одну комнату под двумя именами: каждое окно покажет другое. На двух компьютерах одной сети откройте адрес компьютера, который её отдаёт, по HTTPS: на обычном адресе `http://`, кроме `localhost`, камеру не дадут.

Тесты проекта вводят две страницы в комнату и проверяют, что каждая видит другую и слышит, как у неё выключается микрофон; ещё один запускает Chrome с поддельной камерой и проверяет, что видео каждого играет в плитке другого.
