Elemenx.Network.Protocol('AdvancedQuark', {
	Encode: function (value) {
		return JSON.stringify(value);
	},
	Decode: function (value) {
		var packet;
		try { packet = JSON.parse(value); }
		catch (error) { return {Type: 'Invalid', Data: value}; }
		if (packet.response) return {Type: 'Response', Data: packet};
		if (packet.event) return {Type: 'Event', Data: packet};
		if (packet.url) return {Type: 'Request', Data: packet};
		return {Type: 'Packet', Data: packet};
	}
});



Elemenx.Network.Protocol('AdvancedRTC', {
	Encode: function (value) {
		if (value instanceof ArrayBuffer || (ArrayBuffer.isView && ArrayBuffer.isView(value))) return value;
		return JSON.stringify(value);
	},
	Decode: function (value) {
		var packet;
		if (value instanceof ArrayBuffer) return {Type: 'Binary', Data: value};
		if (ArrayBuffer.isView && ArrayBuffer.isView(value)) return {Type: 'Binary', Data: value.buffer};
		try { packet = JSON.parse(value); }
		catch (error) { return {Type: 'Invalid', Data: value}; }
		if (packet.response) return {Type: 'Response', Data: packet};
		if (packet.event) return {Type: 'Event', Data: packet};
		if (packet.url) return {Type: 'Request', Data: packet};
		return {Type: 'Packet', Data: packet};
	}
});

Elemenx.Network.Protocol('AdvancedJSON', {
	Decode: function (value) {
		var data;

		try {
			data = typeof value === 'string' ? JSON.parse(value) : value;
		}
		catch (error) {
			return {Type: 'InvalidJSON', Data: value};
		}

		return {Type: 'JSON', Data: data};
	}
});

Elemenx.Network.Protocol('AdvancedNDJSON', {
	Push: function (value) {
		var text;
		var lines;
		var packets = [];
		var i = 0;

		if (!this.AdvancedNDJSONDecoder) this.AdvancedNDJSONDecoder = new TextDecoder();
		if (this.AdvancedNDJSONBuffer === undefined) this.AdvancedNDJSONBuffer = '';

		text = this.AdvancedNDJSONDecoder.decode(value, {stream: true});
		lines = (this.AdvancedNDJSONBuffer + text).split('\n');
		this.AdvancedNDJSONBuffer = lines.pop();

		while (i < lines.length) {
			if (lines[i]) {
				try { packets.push({Type: 'JSON', Data: JSON.parse(lines[i])}); }
				catch (error) { packets.push({Type: 'InvalidJSON', Data: lines[i]}); }
			}
			i++;
		}

		return packets;
	}
});

Elemenx.Network.Context('AdvancedNetworkBase', {
	Configure: function (resource, type) {
		resource.AdvancedBaseContext = type;
	},
	On: {
		'Transport.BeforeRequest': function () {}
	}
});

Elemenx.Network.Context('AdvancedNetworkAPI', {
	Contexts: ['AdvancedNetworkBase'],
	Protocol: 'AdvancedJSON',
	Configure: function (resource, type) {
		resource.AdvancedAPIContext = type;
	}
});

Elemenx.Component('NetworkShowcase', {
	$TemplateURL: 'NetworkShowcase.html',

	Status: 'Idle',
	Response: 'No request yet.',
	Events: '—',
	Ownership: 'Component-owned via this.$Network()',
	ContextStatus: 'AdvancedNetworkAPI → AdvancedNetworkBase',
	ProtocolStatus: 'AdvancedJSON waiting for response',

	Request: null,
	Socket: null,
	WebSocketStatus: 'Disconnected',
	WebSocketEvents: '—',
	QuarkRequest: '—',
	QuarkResponse: '—',
	QuarkEvent: '—',

	EventStream: null,
	SSEStatus: 'Disconnected',
	SSEEvents: '—',
	SSEData: 'No events yet.',
	SSECount: 0,
	_SSEEvents: null,

	LongPolling: null,
	LongPollingStatus: 'Disconnected',
	LongPollingEvents: '—',
	LongPollingData: 'No responses yet.',
	LongPollingCount: 0,
	_LongPollingEvents: null,

	Stream: null,
	StreamStatus: 'Disconnected',
	StreamEvents: '—',
	StreamData: 'No chunks yet.',
	StreamCount: 0,
	StreamBytes: 0,
	_StreamEvents: null,
	_StreamRunning: false,

	RTCInitiator: null,
	RTCResponder: null,
	RTCStatus: 'Disconnected',
	RTCEvents: '—',
	RTCTransfer: 'No transfer yet.',
	RTCAck: '—',
	RTCBackpressure: '0 events',
	RTCBytes: 0,
	RTCChunks: 0,
	_RTCEvents: null,
	_RTCBackpressureCount: 0,
	_RTCOutgoing: null,
	_RTCOutgoingIndex: 0,
	_RTCIncoming: null,

	Load: function () {
		var component = this;
		var network;
		var events = [];

		if (component.Request) return;

		component.$Batch(function (state) {
			state.Status = 'Loading';
			state.Response = 'Waiting for response...';
			state.Events = 'BeforeRequest';
			state.ProtocolStatus = 'AdvancedJSON waiting for response';
		});

		network = component.$Network('AdvancedNetworkAPI');
		component.Request = network.XHR({
			Method: 'GET',
			URL: '/data/network-showcase.json'
		});

		component.ContextStatus = component.Request.AdvancedAPIContext === 'XHR' && component.Request.AdvancedBaseContext === 'XHR'
			? 'AdvancedNetworkAPI + AdvancedNetworkBase applied to XHR'
			: 'Context composition failed';

		component.Request.On('Transport', function (event) {
			events.push(event.Type);

			component.$Batch(function (state) {
				state.Events = events.join(' → ');
			});
		});

		component.Request.On('Protocol.JSON', function (event) {
			component.$Batch(function (state) {
				state.ProtocolStatus = 'AdvancedJSON decoded Protocol.JSON';
				state.Response = event.Data && event.Data.message ? event.Data.message : 'Decoded JSON response.';
			});
		});

		component.Request.On('Protocol.InvalidJSON', function () {
			component.ProtocolStatus = 'AdvancedJSON reported invalid JSON';
		});

		component.Request.On('Transport.Success', function () {
			component.Status = 'Success';
			component.Request = null;
		});

		component.Request.On('Transport.Error', function () {
			component.$Batch(function (state) {
				state.Status = 'Error';
				state.Response = 'Network request failed.';
			});

			component.Request = null;
		});

		component.Request.Execute();
	},

	ConnectWebSocket: function () {
		var component = this;
		var scheme;
		var events = [];
		if (component.Socket) return;
		scheme = location.protocol === 'https:' ? 'wss://' : 'ws://';
		component.Socket = component.$Network().WebSocket({
			URL: scheme + location.host + '/elemenx-network-showcase',
			Protocol: 'AdvancedQuark'
		});
		component.WebSocketStatus = 'Connecting';
		component.Socket.On('Transport', function (event) {
			events.push(event.Type);
			component.WebSocketEvents = events.join(' → ');
		});
		component.Socket.On('Transport.Open', function () { component.WebSocketStatus = 'Connected'; });
		component.Socket.On('Transport.Close', function () { component.WebSocketStatus = 'Disconnected'; component.Socket = null; });
		component.Socket.On('Transport.Error', function () { component.WebSocketStatus = 'Error'; });
		component.Socket.On('Protocol.Response', function (event) {
			var data = event.Data && event.Data.data ? event.Data.data : {};
			component.QuarkResponse = 'response /api/media · status ' + data.status + ' · ' + data.correlationID;
		});
		component.Socket.On('Protocol.Event', function (event) {
			var data = event.Data && event.Data.data ? event.Data.data : {};
			component.QuarkEvent = 'event /api/media · ' + (data.message || 'no payload') + ' · ' + data.correlationID;
		});
		component.Socket.Connect();
	},

	SendWebSocket: function () {
		var correlationID;
		var packet;
		if (!this.Socket || !this.Socket.Writable()) return;
		correlationID = 'advanced-' + Date.now();
		packet = {url:'/api/media',data:{correlationID:correlationID,message:'Hello through Quark WebSocket'}};
		this.QuarkRequest = 'url /api/media · ' + correlationID;
		this.QuarkResponse = 'Waiting for response...';
		this.QuarkEvent = 'Waiting for event...';
		this.Socket.Send(packet);
	},

	DisconnectWebSocket: function () {
		if (this.Socket) this.Socket.Close(1000, 'showcase');
	},

	ConnectSSE: function () {
		var component = this;
		if (!component.EventStream) {
			component.EventStream = component.$Network().SSE({
				URL: '/elemenx-network-sse',
				Protocol: 'AdvancedJSON'
			});
			component.EventStream.On('Transport', function (event) {
				component._SSEEvents.push(event.Type);
				component.SSEEvents = component._SSEEvents.join(' → ');
			});
			component.EventStream.On('Transport.Open', function () { component.SSEStatus = 'Connected'; });
			component.EventStream.On('Transport.Error', function () { component.SSEStatus = 'Error / reconnecting'; });
			component.EventStream.On('Transport.Close', function () {
				component.SSEStatus = component.SSECount >= 3 ? 'Completed' : 'Disconnected';
			});
			component.EventStream.On('Protocol.JSON', function (event) {
				var data = event.Data || {};
				component.$Batch(function (state) {
					state.SSECount++;
					state.SSEData = (data.message || 'SSE event') + ' · id ' + state.SSECount;
				});
				if (component.SSECount >= 3) component.EventStream.Close();
			});
		}
		if (component.EventStream.Source()) return;
		component._SSEEvents = [];
		component.$Batch(function (state) {
			state.SSEStatus = 'Connecting';
			state.SSEEvents = '—';
			state.SSEData = 'Waiting for server events...';
			state.SSECount = 0;
		});
		component.EventStream.Connect();
	},

	DisconnectSSE: function () {
		if (this.EventStream) this.EventStream.Close();
		if (this.LongPolling) this.LongPolling.Close();
	},


	ConnectLongPolling: function () {
		var component = this;
		if (!component.LongPolling) {
			component.LongPolling = component.$Network().LongPolling({
				URL: '/elemenx-network-longpolling',
				Protocol: 'AdvancedJSON',
				Retry: 500
			});
			component.LongPolling.On('Transport', function (event) {
				component._LongPollingEvents.push(event.Type);
				component.LongPollingEvents = component._LongPollingEvents.join(' → ');
			});
			component.LongPolling.On('Transport.Open', function () { component.LongPollingStatus = 'Polling'; });
			component.LongPolling.On('Transport.Error', function () { component.LongPollingStatus = 'Error / retrying'; });
			component.LongPolling.On('Transport.Timeout', function () { component.LongPollingStatus = 'Timeout / retrying'; });
			component.LongPolling.On('Transport.Close', function () {
				component.LongPollingStatus = component.LongPollingCount >= 3 ? 'Completed' : 'Disconnected';
			});
			component.LongPolling.On('Protocol.JSON', function (event) {
				var data = event.Data || {};
				component.$Batch(function (state) {
					state.LongPollingCount++;
					state.LongPollingData = (data.message || 'LongPolling response') + ' #' + state.LongPollingCount;
				});
				if (component.LongPollingCount >= 3) component.LongPolling.Close();
			});
		}
		component._LongPollingEvents = [];
		component.$Batch(function (state) {
			state.LongPollingStatus = 'Connecting';
			state.LongPollingEvents = '—';
			state.LongPollingData = 'Waiting for held response...';
			state.LongPollingCount = 0;
		});
		component.LongPolling.Connect();
	},

	DisconnectLongPolling: function () {
		if (this.LongPolling) this.LongPolling.Close();
	},

	ConnectStream: function () {
		var component = this;

		if (component._StreamRunning) return;

		if (!component.Stream) {
			component.Stream = component.$Network().Stream({
				URL: '/elemenx-network-stream',
				Protocol: 'AdvancedNDJSON'
			});
			component.Stream.On('Transport', function (event) {
				component._StreamEvents.push(event.Type);
				component.StreamEvents = component._StreamEvents.join(' → ');
			});
			component.Stream.On('Transport.Open', function () { component.StreamStatus = 'Streaming'; });
			component.Stream.On('Transport.Data', function (event) { component.StreamBytes += event.Data.Bytes; });
			component.Stream.On('Transport.End', function () { component._StreamRunning = false; component.StreamStatus = 'Completed'; });
			component.Stream.On('Transport.Close', function () { component._StreamRunning = false; component.StreamStatus = 'Disconnected'; });
			component.Stream.On('Transport.Error', function () { component._StreamRunning = false; component.StreamStatus = 'Error'; });
			component.Stream.On('Protocol.JSON', function (event) {
				var data = event.Data || {};
				component.$Batch(function (state) {
					state.StreamCount++;
					state.StreamData = (data.message || 'Stream packet') + ' · sequence ' + data.sequence;
				});
			});
		}

		component._StreamRunning = true;
		component.Stream.AdvancedNDJSONDecoder = null;
		component.Stream.AdvancedNDJSONBuffer = '';
		component._StreamEvents = [];
		component.$Batch(function (state) {
			state.StreamStatus = 'Connecting';
			state.StreamEvents = '—';
			state.StreamData = 'Waiting for streamed chunks...';
			state.StreamCount = 0;
			state.StreamBytes = 0;
		});
		component.Stream.Connect();
	},

	DisconnectStream: function () {
		if (this.Stream) this.Stream.Close();
	},

	_WaitRTCIce: function (connection) {
		return new Promise(function (resolve) {
			var timer;
			var done = function () {
				if (timer) clearTimeout(timer);
				connection.removeEventListener('icegatheringstatechange', check);
				resolve();
			};
			var check = function () {
				if (connection.iceGatheringState === 'complete') done();
			};
			if (connection.iceGatheringState === 'complete') return resolve();
			connection.addEventListener('icegatheringstatechange', check);
			timer = setTimeout(done, 1500);
		});
	},

	ConnectWebRTC: function () {
		var component = this;
		var initiator;
		var responder;
		var offer;

		if (component.RTCInitiator || component.RTCResponder) return;
		component._RTCEvents = [];
		component._RTCBackpressureCount = 0;
		component.$Batch(function (state) {
			state.RTCStatus = 'Negotiating';
			state.RTCEvents = '—';
			state.RTCTransfer = 'No transfer yet.';
			state.RTCAck = '—';
			state.RTCBackpressure = '0 events';
			state.RTCBytes = 0;
			state.RTCChunks = 0;
		});

		initiator = component.$Network().WebRTC({
			Protocol: 'AdvancedRTC',
			ChannelName: 'elemenx-media',
			Channel: {ordered: true, protocol: 'elemenx-quark-binary'},
			BufferHighWaterMark: 64 * 1024,
			BufferLowWaterMark: 16 * 1024,
			QueueHighWaterMark: 128 * 1024,
			QueueLowWaterMark: 16 * 1024
		});
		responder = component.$Network().WebRTC({
			Protocol: 'AdvancedRTC',
			BufferHighWaterMark: 64 * 1024,
			BufferLowWaterMark: 16 * 1024,
			QueueHighWaterMark: 128 * 1024,
			QueueLowWaterMark: 16 * 1024
		});
		component.RTCInitiator = initiator;
		component.RTCResponder = responder;

		initiator.On('Transport', function (event) {
			if (event.Type === 'BeforeSend' || event.Type === 'AfterSend' || event.Type === 'Queued') return;
			component._RTCEvents.push('A.' + event.Type);
			component.RTCEvents = component._RTCEvents.join(' → ');
		});
		responder.On('Transport', function (event) {
			if (event.Type === 'BeforeSend' || event.Type === 'AfterSend' || event.Type === 'Queued') return;
			component._RTCEvents.push('B.' + event.Type);
			component.RTCEvents = component._RTCEvents.join(' → ');
		});
		initiator.On('Transport.Channel', function () {
			if (initiator.DataChannel()) initiator.DataChannel().binaryType = 'arraybuffer';
		});
		responder.On('Transport.Channel', function () {
			if (responder.DataChannel()) responder.DataChannel().binaryType = 'arraybuffer';
		});
		initiator.On('Transport.Open', function () { component.RTCStatus = 'Connected'; });
		initiator.On('Transport.Backpressure', function () {
			component._RTCBackpressureCount++;
			component.RTCBackpressure = component._RTCBackpressureCount + ' events · waiting for Drain';
		});
		initiator.On('Transport.Drain', function () {
			component.RTCBackpressure = component._RTCBackpressureCount + ' events · drained';
			component._PumpRTCTransfer();
		});
		responder.On('Protocol.Request', function (event) {
			var data = event.Data && event.Data.data ? event.Data.data : {};
			component._RTCIncoming = {CorrelationID: data.correlationID, Size: data.size || 0, Bytes: 0, Chunks: 0};
		});
		responder.On('Protocol.Binary', function (event) {
			var incoming = component._RTCIncoming;
			if (!incoming) return;
			incoming.Bytes += event.Data.byteLength;
			incoming.Chunks++;
			component.$Batch(function (state) {
				state.RTCBytes = incoming.Bytes;
				state.RTCChunks = incoming.Chunks;
			});
			if (incoming.Bytes >= incoming.Size) {
				responder.Send({response:'/api/media',data:{status:200,correlationID:incoming.CorrelationID,bytes:incoming.Bytes,chunks:incoming.Chunks}});
				responder.Send({event:'/api/media',data:{correlationID:incoming.CorrelationID,message:'Binary media received over RTCDataChannel'}});
				component._RTCIncoming = null;
			}
		});
		initiator.On('Protocol.Response', function (event) {
			var data = event.Data && event.Data.data ? event.Data.data : {};
			component.RTCAck = 'ACK ' + data.status + ' · ' + data.bytes + ' bytes · ' + data.chunks + ' chunks';
		});
		initiator.On('Protocol.Event', function (event) {
			var data = event.Data && event.Data.data ? event.Data.data : {};
			component.RTCTransfer = data.message || 'Transfer completed';
		});

		initiator.CreateOffer().then(function (description) {
			offer = description;
			return component._WaitRTCIce(initiator.Connection());
		}).then(function () {
			offer = initiator.Connection().localDescription || offer;
			return responder.AcceptOffer(offer);
		}).then(function () {
			return component._WaitRTCIce(responder.Connection());
		}).then(function () {
			return initiator.AcceptAnswer(responder.Connection().localDescription);
		}).catch(function (error) {
			component.RTCStatus = 'Error: ' + error.message;
		});
	},

	_PumpRTCTransfer: function () {
		var rtc = this.RTCInitiator;
		var chunks = this._RTCOutgoing;
		if (!rtc || !chunks) return;
		while (this._RTCOutgoingIndex < chunks.length) {
			if (!rtc.Send(chunks[this._RTCOutgoingIndex])) return;
			this._RTCOutgoingIndex++;
		}
		this.RTCTransfer = 'All binary chunks accepted by the Elemenx send queue; waiting for peer ACK...';
		this._RTCOutgoing = null;
	},

	SendWebRTCTransfer: function () {
		var rtc = this.RTCInitiator;
		var correlationID;
		var chunks = [];
		var total = 512 * 1024;
		var chunkSize = 16 * 1024;
		var offset = 0;
		var chunk;
		var i;

		if (!rtc || !rtc.Writable() || this._RTCOutgoing) return;
		correlationID = 'rtc-' + Date.now();
		while (offset < total) {
			chunk = new Uint8Array(Math.min(chunkSize, total - offset));
			i = 0;
			while (i < chunk.length) {
				chunk[i] = (offset + i) % 251;
				i++;
			}
			chunks.push(chunk);
			offset += chunk.length;
		}
		this._RTCOutgoing = chunks;
		this._RTCOutgoingIndex = 0;
		this._RTCBackpressureCount = 0;
		this.$Batch(function (state) {
			state.RTCTransfer = 'Sending 512 KiB binary payload · 32 chunks...';
			state.RTCAck = 'Waiting for ACK...';
			state.RTCBackpressure = '0 events';
			state.RTCBytes = 0;
			state.RTCChunks = 0;
		});
		if (!rtc.Send({url:'/api/media',data:{correlationID:correlationID,name:'advanced-media.bin',size:total,chunkSize:chunkSize}})) return;
		this._PumpRTCTransfer();
	},

	DisconnectWebRTC: function () {
		if (this.RTCInitiator) this.RTCInitiator.Close();
		if (this.RTCResponder) this.RTCResponder.Close();
		this.RTCInitiator = null;
		this.RTCResponder = null;
		this._RTCOutgoing = null;
		this._RTCIncoming = null;
		this.RTCStatus = 'Disconnected';
	},

	$OnDestroy: function () {
		if (this.Request && this.Request.Abort)
			this.Request.Abort();
		if (this.Socket) this.Socket.Close(1000, 'destroy');
		if (this.EventStream) this.EventStream.Close();
		if (this.LongPolling) this.LongPolling.Close();
		if (this.Stream) this.Stream.Close();
		if (this.RTCInitiator) this.RTCInitiator.Close();
		if (this.RTCResponder) this.RTCResponder.Close();
	}
});