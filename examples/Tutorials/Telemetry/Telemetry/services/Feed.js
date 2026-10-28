/*
 * The feed of the telemetry: a WebSocket to /feed that tells the channels of a scene and then their values, up to 120
 * packets a second. Nothing here is state of a Component: the packets land in plain fields, Latest and Seq, and the
 * board reads them once a frame. That is the whole trick of a fast board: a packet costs an assignment, not a render.
 * Scene(name) asks for another scene (car, cluster, ship), Rate(hz) for another rate; Channels is the list of the
 * scene, Received the count of the packets, OnChannels(callback) hears a new list.
 */
Elemenx.Network.Protocol('Telemetry', {
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

Elemenx.Service('Feed', {
	$OnCreate: function () {
		this.Socket = null;
		this.Channels = [];
		this.SceneName = 'car';
		this.Latest = null;
		this.Seq = 0;
		this.Received = 0;
		this.Listeners = [];
	},

	Connect: function () {
		var self = this;

		if (this.Socket) return;

		this.Socket = this.$Network().WebSocket({URL: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/feed', Protocol: 'Telemetry'});

		this.Socket.On('Protocol.channels', function (event) {
			self.SceneName = event.Data.Scene;
			self.Channels = event.Data.Channels;
			self.Latest = null;

			self.Listeners.slice().forEach(function (callback) {
				callback(self.Channels);
			});
		});

		/* A packet: kept, counted, nothing more. */
		this.Socket.On('Protocol.data', function (event) {
			self.Latest = event.Data;
			self.Seq = event.Data.Seq;
			self.Received++;
		});

		this.Socket.Connect();
	},

	Scene: function (name) {
		this.Socket.Send({Type: 'scene', Scene: name});
	},

	Rate: function (hz) {
		this.Socket.Send({Type: 'rate', Hz: hz});
	},

	OnChannels: function (callback) {
		this.Listeners.push(callback);
	},

	OffChannels: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
