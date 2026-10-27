/*
 * A call in a room. Join(name, room) asks for the camera and the microphone, connects to the signaling of the server
 * (/signal, a WebSocket), and makes a WebRTC connection to every other one in the room: the one who comes later offers,
 * the ones there answer. The video and the sound go directly between the browsers; the data channel of each connection
 * carries the state of the microphone and the camera. Leave(), Mute(muted), Camera(on).
 * State: idle, joining or joined; Self {Name, Stream, Muted, Camera}; People [{ID, Name, Stream, Muted, Camera}].
 * OnChange(callback) hears every change, OffChange(callback).
 */

/* The messages of the signaling and of the data channels: JSON with its Type, a Protocol.<Type> event each. */
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

Elemenx.Service('Room', {
	$OnCreate: function () {
		this.State = 'idle';
		this.Self = null;
		this.People = [];
		this.Peers = {};
		this.Socket = null;
		this.Local = null;
		this.Listeners = [];
	},

	Join: function (name, room) {
		var self = this;

		this.State = 'joining';
		this.Self = {Name: name, Stream: null, Muted: false, Camera: true};

		this.Tell();

		this.Media(function (stream) {
			self.Local = stream;
			self.Self.Stream = stream;
			self.Self.Camera = !!stream && stream.getVideoTracks().length > 0;

			self.Connect(name, room);
		});
	},

	/* The camera and the microphone; without them (refused, or none) the call goes on, to see and hear the others. */
	Media: function (callback) {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			callback(null);

			return;
		}

		navigator.mediaDevices.getUserMedia({audio: true, video: {width: 640, height: 360}}).then(function (stream) {
			callback(stream);
		}, function () {
			callback(null);
		});
	},

	Connect: function (name, room) {
		var self = this;

		this.Socket = this.$Network().WebSocket({URL: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/signal', Protocol: 'Signal'});

		this.Socket.On('Transport.Open', function () {
			self.Socket.Send({Type: 'join', Name: name, Room: room});
		});

		/* The ones already there: this browser offers to each of them. */
		this.Socket.On('Protocol.welcome', function (event) {
			self.State = 'joined';

			event.Data.Peers.forEach(function (peer) {
				self.Peer(peer.ID, peer.Name, true);
			});

			self.Tell();
		});

		/* One who came later: they will offer. */
		this.Socket.On('Protocol.peer', function (event) {
			self.Peer(event.Data.ID, event.Data.Name, false);
			self.Tell();
		});

		this.Socket.On('Protocol.signal', function (event) {
			self.Signaled(event.Data.From, event.Data.Data);
		});

		this.Socket.On('Protocol.left', function (event) {
			self.Drop(event.Data.ID);
		});

		this.Socket.Connect();
	},

	/* A connection to one person of the room. */
	Peer: function (id, name, offering) {
		var self = this;
		var peer = this.$Network().WebRTC({Configuration: {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]}, Protocol: 'Signal'});
		var person = {ID: id, Name: name, Stream: null, Muted: false, Camera: false, Peer: peer, Ready: false, Waiting: []};

		this.Peers[id] = person;

		peer.On('Transport.ICECandidate', function (event) {
			if (event.Data.Candidate)
				self.Send(id, {Candidate: event.Data.Candidate});
		});

		peer.On('Transport.Open', function () {
			self.Share(person);
		});

		peer.On('Protocol.state', function (event) {
			person.Muted = !!event.Data.Muted;
			person.Camera = !!event.Data.Camera;

			self.Tell();
		});

		peer.Connect(offering);

		/* Their video and sound, as they come. */
		peer.Connection().addEventListener('track', function (event) {
			person.Stream = event.streams[0];

			self.Tell();
		});

		if (this.Local) {
			this.Local.getTracks().forEach(function (track) {
				peer.Connection().addTrack(track, self.Local);
			});
		}

		if (offering) {
			peer.CreateOffer(function (error, offer) {
				if (!error)
					self.Send(id, {Offer: offer});
			});
		}

		return person;
	},

	/* A message of the signaling from another one of the room. */
	Signaled: function (from, data) {
		var self = this;
		var person = this.Peers[from];
		if (!person) return;

		if (data.Offer) {
			person.Peer.AcceptOffer(data.Offer, function (error, answer) {
				if (error) return;

				self.Send(from, {Answer: answer});
				self.Ready(person);
			});
		}
		else if (data.Answer) {
			person.Peer.AcceptAnswer(data.Answer, function (error) {
				if (!error)
					self.Ready(person);
			});
		}
		else if (data.Candidate) {
			/* A candidate may come before the description it belongs to: it waits for it. */
			if (person.Ready) person.Peer.AddICECandidate(data.Candidate);
			else person.Waiting.push(data.Candidate);
		}
	},

	Ready: function (person) {
		person.Ready = true;

		person.Waiting.splice(0).forEach(function (candidate) {
			person.Peer.AddICECandidate(candidate);
		});
	},

	Send: function (to, data) {
		this.Socket.Send({Type: 'signal', To: to, Data: data});
	},

	/* The state of the microphone and the camera, to one person or to all. */
	Share: function (person) {
		var message = {Type: 'state', Muted: this.Self.Muted, Camera: this.Self.Camera};
		var peers = this.Peers;

		(person ? [person] : Object.keys(peers).map(function (id) {
			return peers[id];
		})).forEach(function (each) {
			each.Peer.Send(message);
		});
	},

	Mute: function (muted) {
		this.Self.Muted = muted;

		if (this.Local) {
			this.Local.getAudioTracks().forEach(function (track) {
				track.enabled = !muted;
			});
		}

		this.Share(null);
		this.Tell();
	},

	/* The camera off sends black frames, not nothing: turned on again, it needs no new negotiation. */
	Camera: function (on) {
		this.Self.Camera = on && !!this.Local && this.Local.getVideoTracks().length > 0;

		if (this.Local) {
			this.Local.getVideoTracks().forEach(function (track) {
				track.enabled = on;
			});
		}

		this.Share(null);
		this.Tell();
	},

	Drop: function (id) {
		if (!this.Peers[id]) return;

		this.Peers[id].Peer.Close();

		delete this.Peers[id];

		this.Tell();
	},

	Leave: function () {
		var self = this;

		Object.keys(this.Peers).forEach(function (id) {
			self.Peers[id].Peer.Close();
		});

		if (this.Socket)
			this.Socket.Close();

		/* The camera light goes off only when its tracks are stopped. */
		if (this.Local) {
			this.Local.getTracks().forEach(function (track) {
				track.stop();
			});
		}

		this.Peers = {};
		this.Socket = null;
		this.Local = null;
		this.Self = null;
		this.State = 'idle';

		this.Tell();
	},

	Tell: function () {
		var self = this;
		var peers = this.Peers;

		this.People = Object.keys(peers).map(function (id) {
			var person = peers[id];

			return {ID: person.ID, Name: person.Name, Stream: person.Stream, Muted: person.Muted, Camera: person.Camera && !!person.Stream};
		});

		this.Listeners.slice().forEach(function (callback) {
			callback(self);
		});
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
