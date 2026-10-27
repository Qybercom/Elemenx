# A video call

A call for a few people: a room joined by its name, everyone's video on a `CallStage`, the microphone and the camera on its controls. The browsers find each other through a WebSocket of the server, and then send their video directly to each other. The finished project is `examples/Tutorials/Call`.

What you learn: the parts of a WebRTC call (signaling, offer and answer, ICE candidates, tracks), `Network.WebSocket` and `Network.WebRTC` with one Protocol, a mesh of connections, a data channel beside the media, the camera and the microphone, and the components of a call.

## 1. How two browsers meet

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

The server only passes the messages of the **signaling**: it never sees the video. Each browser describes what it sends (an **offer**, an **answer**: codecs, tracks) and the addresses where it may be reached (**ICE candidates**); then the two talk directly. A STUN server tells a browser its public address; where a firewall closes every direct path, a TURN server relays the media, and a real service needs one.

## 2. The signaling

`Server.WebSocket` of `elemenx.config.js` gives `elemenx dev` and `elemenx serve` a socket at `/signal`. It keeps the rooms: a `join` gets the list of the others (`welcome`), the others hear of the newcomer (`peer`), and a `signal` is passed to the one it names. Its whole code is in the project, forty lines.

On the page, one Protocol encodes and decodes the JSON of the socket and of the data channels, so each `Type` is an event:

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

Who offers is decided once: the one who came later offers to everyone there. Both offering at the same time is the classic bug of a first call.

## 3. One connection for each person

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

- `Connect(offering)` makes the `RTCPeerConnection` (and, for the one who offers, the data channel); `Connection()` is that native connection, where the tracks are added and heard.
- The tracks are added before the offer, so it describes them.
- The other side answers with `AcceptOffer(offer, callback)`, the first one takes it with `AcceptAnswer(answer, callback)`.

Each person has a connection to each other one: a **mesh**. It is simple and needs no media server, and it holds about four to six people; beyond that each browser sends its video too many times, and a call goes through a media server (an SFU) that forwards one stream to everyone.

## 4. Candidates that come early

A candidate can arrive before the offer it belongs to has been accepted, and adding it then fails. Keep them until the description is set:

```js
else if (data.Candidate) {
	if (person.Ready) person.Peer.AddICECandidate(data.Candidate);
	else person.Waiting.push(data.Candidate);
}
```

`Ready(person)`, called once `AcceptOffer` or `AcceptAnswer` is done, adds those that waited.

## 5. The camera and the microphone

```js
navigator.mediaDevices.getUserMedia({audio: true, video: {width: 640, height: 360}}).then(function (stream) {
	callback(stream);
}, function () {
	callback(null);
});
```

The browser asks the person first, and only on `https://` or `localhost`. A refusal is not the end: the call goes on without them, to see and hear the others. To mute, turn the track off (`track.enabled = false`): the connection stays, and turning it on again needs no new negotiation. To leave, `track.stop()` every track: only then does the light of the camera go off.

## 6. A data channel beside the media

The connection carries a data channel too. The state of the microphone and the camera goes there, from browser to browser, without the server:

```js
peer.On('Protocol.state', function (event) {
	person.Muted = !!event.Data.Muted;
	person.Camera = !!event.Data.Camera;
});
```

The same channel can carry a chat, reactions or a raised hand.

## 7. The stage

```html
<CallStage *if="State === 'joined'" Layout="grid">
	<CallTile slot="participants" *for="person of People" *key="person.ID" [name]="person.Name" [stream]="person.Stream" [muted]="person.Muted" [camera]="person.Camera" />
	<CallTile slot="self" [name]="Self.Name" [stream]="Self.Stream" [muted]="Self.Muted" [camera]="Self.Camera" Self="true" />
	<CallControls slot="controls" [muted]="Self.Muted" [camera]="Self.Camera" [hide]="['share', 'hand', 'react', 'chat', 'people', 'layout']" (mute)="Muted" (camera)="Filmed" (leave)="Left" />
</CallStage>
```

`CallTile` plays a `MediaStream` (`[stream]`), shows an avatar while the camera is off, and mirrors the own video as a mirror would. `CallStage` places the tiles in a grid and the own video in a corner; `CallControls` emits `mute`, `camera` and `leave`, and the component calls the Room Service.

## 8. Try it

```bash
cd examples/Tutorials/Call
npm install
npm run dev
```

Open the page in two windows, join the same room with two names: each window shows the other. On two computers of a network, open the address of the computer that serves it, over HTTPS: the camera is refused on a plain `http://` address other than `localhost`.

The tests of the project join two pages to a room and check that each one sees the other and hears its microphone go off; another one starts Chrome with its fake camera and checks that the video of each plays in the tile of the other.
