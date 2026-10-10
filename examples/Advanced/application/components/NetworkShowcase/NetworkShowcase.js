var AdvancedQuarkCorrelation = 0;
var AdvancedQuarkCorrelations = {};

function AdvancedQuarkNextCorrelation () {
	AdvancedQuarkCorrelation++;

	return 'q-' + Date.now().toString(36) + '-' + AdvancedQuarkCorrelation;
}

Elemenx.Network.Protocol('AdvancedQuark', {
	Encode: function (value) {
		var correlationID;
		var data;
		var name;

		if (value && value.Type === 'Transfer') {
			correlationID = AdvancedQuarkNextCorrelation();
			data = {
				type: 'Transfer',
				action: value.Action,
				id: value.ID,
				correlationID: correlationID
			};

			name = 'Name';

			if (value[name] !== undefined)
				data.name = value[name];

			name = 'Mime';

			if (value[name] !== undefined)
				data.mime = value[name];

			name = 'Size';

			if (value[name] !== undefined)
				data.size = value[name];

			name = 'ChunkSize';

			if (value[name] !== undefined)
				data.chunkSize = value[name];

			name = 'Chunks';

			if (value[name] !== undefined)
				data.chunks = value[name];

			name = 'Index';

			if (value[name] !== undefined)
				data.index = value[name];

			name = 'Offset';

			if (value[name] !== undefined)
				data.offset = value[name];

			name = 'Bytes';

			if (value[name] !== undefined)
				data.bytes = value[name];

			if (value.Data instanceof ArrayBuffer || (ArrayBuffer.isView && ArrayBuffer.isView(value.Data))) {
				data.data = AdvancedTransferBase64Encode(value.Data);
				data.encoding = 'Base64';
			}

			AdvancedQuarkCorrelations[correlationID] = value;

			return JSON.stringify({url: '/api/media', data: data});
		}

		return JSON.stringify(value);
	},
	Decode: function (value) {
		var wire;
		var data;
		var original;
		var packet;

		try {
			wire = JSON.parse(value);
		}
		catch (error) {
			return {Type: 'Invalid', Data: value};
		}

		data = wire && wire.data ? wire.data : {};

		if (wire && wire.response !== undefined) {
			original = AdvancedQuarkCorrelations[data.correlationID];
			delete AdvancedQuarkCorrelations[data.correlationID];

			if (original && original.Type === 'Transfer') {
				if (data.status !== 200)
					return {Type: 'TransferError', Data: data};

				if (original.Action === 'Chunk')
					return {Type: 'Transfer', Data: {Type: 'Transfer', Action: 'Ack', ID: original.ID, Index: original.Index}};

				if (original.Action === 'End')
					return {Type: 'Transfer', Data: {Type: 'Transfer', Action: 'Complete', ID: original.ID}};

				return null;
			}

			return {Type: 'Response', Data: wire};
		}

		if (wire && wire.event !== undefined && data.type === 'Transfer') {
			packet = {Type: 'Transfer', Action: data.action, ID: data.id};

			if (data.name !== undefined)
				packet.Name = data.name;

			if (data.mime !== undefined)
				packet.Mime = data.mime;

			if (data.size !== undefined)
				packet.Size = data.size;

			if (data.chunkSize !== undefined)
				packet.ChunkSize = data.chunkSize;

			if (data.chunks !== undefined)
				packet.Chunks = data.chunks;

			if (data.index !== undefined)
				packet.Index = data.index;

			if (data.offset !== undefined)
				packet.Offset = data.offset;

			if (data.bytes !== undefined)
				packet.Bytes = data.bytes;

			if (data.encoding === 'Base64' && typeof data.data === 'string')
				packet.Data = AdvancedTransferBase64Decode(data.data);

			return {Type: 'Transfer', Data: packet};
		}

		if (wire && wire.event !== undefined) return {Type: 'Event', Data: wire};

		if (wire && wire.url !== undefined)
			return {Type: 'Request', Data: wire};

		return {Type: 'Packet', Data: wire};
	}
});


Elemenx.Network.Protocol('AdvancedRTC', {
	Encode: function (value) {
		var metadata;
		var header;
		var payload;
		var frame;
		var view;

		if (value instanceof ArrayBuffer || (ArrayBuffer.isView && ArrayBuffer.isView(value))) return value;

		if (value && value.Type === 'Transfer' && value.Action === 'Chunk' && value.Data) {
			payload = value.Data instanceof ArrayBuffer ? new Uint8Array(value.Data) : new Uint8Array(value.Data.buffer, value.Data.byteOffset, value.Data.byteLength);
			metadata = {};

			Object.keys(value).forEach(function (name) {
				if (name !== 'Data')
					metadata[name] = value[name];
			});

			header = new TextEncoder().encode(JSON.stringify(metadata));
			frame = new Uint8Array(8 + header.byteLength + payload.byteLength);
			view = new DataView(frame.buffer);

			view.setUint32(0, 0x45585452);
			view.setUint32(4, header.byteLength);

			frame.set(header, 8);
			frame.set(payload, 8 + header.byteLength);

			return frame.buffer;
		}

		return JSON.stringify(value);
	},
	Decode: function (value) {
		var packet;
		var buffer;
		var view;
		var headerLength;
		var bytes;

		if (value instanceof ArrayBuffer || (ArrayBuffer.isView && ArrayBuffer.isView(value))) {
			buffer = value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);

			if (buffer.byteLength >= 8) {
				view = new DataView(buffer);

				if (view.getUint32(0) === 0x45585452) {
					headerLength = view.getUint32(4);

					if (8 + headerLength <= buffer.byteLength) {
						try {
							packet = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 8, headerLength)));
						}
						catch (error) {
							return {Type: 'Invalid', Data: buffer};
						}

						bytes = new Uint8Array(buffer, 8 + headerLength);
						packet.Data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

						return {Type: 'Transfer', Data: packet};
					}
				}
			}

			return {Type: 'Binary', Data: buffer};
		}

		try {
			packet = JSON.parse(value);
		}
		catch (error) {
			return {Type: 'Invalid', Data: value};
		}

		if (packet.Type === 'Transfer')
			return {Type: 'Transfer', Data: packet};

		if (packet.response)
			return {Type: 'Response', Data: packet};

		if (packet.event)
			return {Type: 'Event', Data: packet};

		if (packet.url)
			return {Type: 'Request', Data: packet};

		return {Type: 'Packet', Data: packet};
	}
});

function AdvancedTransferBase64Encode (buffer) {
	var bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	var result = '';
	var i = 0;
	var block = 0x8000;

	while (i < bytes.length) {
		result += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + block, bytes.length)));

		i += block;
	}

	return btoa(result);
}

function AdvancedTransferBase64Decode (value) {
	var binary = atob(value);
	var bytes = new Uint8Array(binary.length);
	var i = 0;
	while (i < binary.length) {
		bytes[i] = binary.charCodeAt(i);

		i++;
	}

	return bytes.buffer;
}

function AdvancedTransferDecodePacket (value) {
	var packet;

	try {
		packet = typeof value === 'string' ? JSON.parse(value) : value;
	}
	catch (error) {
		return {Type: 'Invalid', Data: value};
	}

	if (packet && packet.Type === 'Transfer') {
		if (packet.Action === 'Chunk' && typeof packet.Data === 'string')
			packet.Data = AdvancedTransferBase64Decode(packet.Data);

		return {Type: 'Transfer', Data: packet};
	}

	return {Type: 'Packet', Data: packet};
}

Elemenx.Network.Protocol('AdvancedTransferJSON', {
	Encode: function (value) {
		var packet;

		if (value && value.Type === 'Transfer' && value.Action === 'Chunk' && value.Data) {
			packet = {};

			Object.keys(value).forEach(function (name) { packet[name] = name === 'Data' ? AdvancedTransferBase64Encode(value[name]) : value[name]; });

			return JSON.stringify(packet);
		}

		return JSON.stringify(value);
	},
	Decode: function (value) {
		return AdvancedTransferDecodePacket(value);
	},
	Push: function (value) {
		var text;
		var lines;
		var packets = [];
		var i = 0;

		if (!this.AdvancedTransferDecoder)
			this.AdvancedTransferDecoder = new TextDecoder();

		if (this.AdvancedTransferBuffer === undefined)
			this.AdvancedTransferBuffer = '';

		text = this.AdvancedTransferDecoder.decode(value, {stream: true});
		lines = (this.AdvancedTransferBuffer + text).split('\n');
		this.AdvancedTransferBuffer = lines.pop();

		while (i < lines.length) {
			if (lines[i])
				packets.push(AdvancedTransferDecodePacket(lines[i]));

			i++;
		}

		return packets;
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

		if (!this.AdvancedNDJSONDecoder)
			this.AdvancedNDJSONDecoder = new TextDecoder();

		if (this.AdvancedNDJSONBuffer === undefined)
			this.AdvancedNDJSONBuffer = '';

		text = this.AdvancedNDJSONDecoder.decode(value, {stream: true});
		lines = (this.AdvancedNDJSONBuffer + text).split('\n');
		this.AdvancedNDJSONBuffer = lines.pop();

		while (i < lines.length) {
			if (lines[i]) {
				try {
					packets.push({Type: 'JSON', Data: JSON.parse(lines[i])});
				}
				catch (error) {
					packets.push({Type: 'InvalidJSON', Data: lines[i]});
				}
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
	$Style: '.network-universal-transfer-showcase .universal-metrics{display:block;min-height:9.6em;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);white-space:pre-line;overflow-wrap:normal;font-size:11px;line-height:1.45;font-variant-numeric:tabular-nums}.network-universal-transfer-showcase .universal-result{display:block;min-height:4.3em}.network-universal-transfer-showcase .meta-item{min-width:0}',

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

	UniversalXHR: 'Idle',
	UniversalXHRMetrics: 'TX 0 bytes · RX 0 bytes · ↑ 0 B/s · ↓ 0 B/s',
	UniversalWebSocket: 'Idle',
	UniversalWebSocketMetrics: 'TX 0 bytes · RX 0 bytes · ↑ 0 B/s · ↓ 0 B/s',
	UniversalSSE: 'Idle',
	UniversalSSEMetrics: 'TX 0 bytes · RX 0 bytes · ↑ 0 B/s · ↓ 0 B/s',
	UniversalLongPolling: 'Idle',
	UniversalLongPollingMetrics: 'TX 0 bytes · RX 0 bytes · ↑ 0 B/s · ↓ 0 B/s',
	UniversalStream: 'Idle',
	UniversalStreamMetrics: 'TX 0 bytes · RX 0 bytes · ↑ 0 B/s · ↓ 0 B/s',
	UniversalWebRTC: 'Idle',
	UniversalWebRTCMetrics: 'TX 0 bytes · RX 0 bytes · ↑ 0 B/s · ↓ 0 B/s',
	UniversalResources: null,
	UniversalMetricInstances: null,

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

	Transfer: null,
	TransferReceiver: null,
	TransferStatus: 'Idle',
	TransferProgress: '0 / 0 bytes',
	TransferReceiverStatus: 'Idle',
	TransferResult: 'No transfer yet.',
	TransferEvents: '—',
	_TransferEvents: null,

	Metrics: null,
	MetricsStatus: 'Idle',
	MetricsTX: '0 bytes',
	MetricsRX: '0 bytes',
	MetricsTXSpeed: '0 B/s',
	MetricsRXSpeed: '0 B/s',
	MetricsElapsed: '0 ms',

	StructuredTransfer: null,
	StructuredReceiver: null,
	StructuredStatus: 'Disconnected',
	StructuredControl: '—',
	StructuredProgress: '0 / 0 bytes',
	StructuredResult: 'No object received yet.',

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
		component.Socket.On('Transport.Close', function () {
			component.WebSocketStatus = 'Disconnected';
			component.Socket = null;
		});
		component.Socket.On('Transport.Error', function () { component.WebSocketStatus = 'Error'; });
		component.Socket.On('Protocol.Response', function (event) {
			var data = event.Data && event.Data.data ? event.Data.data : {};

			component.QuarkResponse = 'response /api/media · status ' + data.status + ' · ' + data.correlationID;

			if (data.correlationID && data.correlationID.indexOf('structured-') === 0)
				component.StructuredControl = 'Quark ACK ' + data.status + ' · ' + data.correlationID;
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
		packet = {url: '/api/media', data: {correlationID: correlationID, message: 'Hello through Quark WebSocket'}};
		this.QuarkRequest = 'url /api/media · ' + correlationID;
		this.QuarkResponse = 'Waiting for response...';
		this.QuarkEvent = 'Waiting for event...';

		this.Socket.Send(packet);
	},

	DisconnectWebSocket: function () {
		if (this.Socket)
			this.Socket.Close(1000, 'showcase');
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

				if (component.SSECount >= 3)
					component.EventStream.Close();
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
		if (this.EventStream)
			this.EventStream.Close();

		if (this.LongPolling)
			this.LongPolling.Close();
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

				if (component.LongPollingCount >= 3)
					component.LongPolling.Close();
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
		if (this.LongPolling)
			this.LongPolling.Close();
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
			component.Stream.On('Transport.End', function () {
				component._StreamRunning = false;
				component.StreamStatus = 'Completed';
			});
			component.Stream.On('Transport.Close', function () {
				component._StreamRunning = false;
				component.StreamStatus = 'Disconnected';
			});
			component.Stream.On('Transport.Error', function () {
				component._StreamRunning = false;
				component.StreamStatus = 'Error';
			});
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
		if (this.Stream)
			this.Stream.Close();
	},

	_WaitRTCIce: function (connection) {
		return new Promise(function (resolve) {
			var timer;
			var done = function () {
				if (timer)
					clearTimeout(timer);

				connection.removeEventListener('icegatheringstatechange', check);

				resolve();
			};
			var check = function () {
				if (connection.iceGatheringState === 'complete')
					done();
			};

			if (connection.iceGatheringState === 'complete') return resolve();

			connection.addEventListener('icegatheringstatechange', check);

			timer = setTimeout(done, 1500);
		});
	},

	_FormatMetricBytes: function (value) {
		if (value >= 1024 * 1024)
			return (value / (1024 * 1024)).toFixed(2) + ' MiB';

		if (value >= 1024)
			return (value / 1024).toFixed(2) + ' KiB';

		return Math.round(value) + ' bytes';
	},

	_FormatMetricSpeed: function (value) {
		if (value >= 1024 * 1024)
			return (value / (1024 * 1024)).toFixed(2) + ' MiB/s';

		if (value >= 1024)
			return (value / 1024).toFixed(2) + ' KiB/s';

		return Math.round(value) + ' B/s';
	},

	_UpdateMetrics: function (snapshot) {
		var component = this;

		if (!snapshot) return;

		component.$Batch(function (state) {
			state.MetricsTX = component._FormatMetricBytes(snapshot.TX.Bytes);
			state.MetricsRX = component._FormatMetricBytes(snapshot.RX.Bytes);
			state.MetricsTXSpeed = component._FormatMetricSpeed(snapshot.TX.Speed);
			state.MetricsRXSpeed = component._FormatMetricSpeed(snapshot.RX.Speed);
			state.MetricsElapsed = Math.round(snapshot.Elapsed) + ' ms';
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

		component.Metrics = component.$Network().Metrics({Transport: initiator});
		component.MetricsStatus = 'Live';

		component._UpdateMetrics(component.Metrics.Snapshot());
		component.Metrics.On('Metrics.Update', function (event) { component._UpdateMetrics(event.Data); });

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
			if (initiator.DataChannel())
				initiator.DataChannel().binaryType = 'arraybuffer';
		});
		responder.On('Transport.Channel', function () {
			if (responder.DataChannel())
				responder.DataChannel().binaryType = 'arraybuffer';
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
				responder.Send({response: '/api/media', data: {status: 200, correlationID: incoming.CorrelationID, bytes: incoming.Bytes, chunks: incoming.Chunks}});
				responder.Send({event: '/api/media', data: {correlationID: incoming.CorrelationID, message: 'Binary media received over RTCDataChannel'}});

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

		if (!rtc.Send({url: '/api/media', data: {correlationID: correlationID, name: 'advanced-media.bin', size: total, chunkSize: chunkSize}})) return;

		this._PumpRTCTransfer();
	},


	RunTransfer: function () {
		var component = this;
		var rtc = component.RTCInitiator;
		var peer = component.RTCResponder;
		var payload = new Uint8Array(1024 * 1024);

		if (!rtc || !peer || !rtc.Writable() || !peer.Writable()) {
			component.TransferStatus = 'Connect WebRTC peers first';

			return;
		}

		if (component.Transfer && component.Transfer.Active()) return;

		if (component.Transfer)
			component.Transfer.Destroy();

		if (component.TransferReceiver)
			component.TransferReceiver.Destroy();

		component.$Batch(function (state) {
			state.TransferStatus = 'Preparing';
			state.TransferProgress = '0 / 1048576 bytes';
			state.TransferReceiverStatus = 'Waiting';
			state.TransferResult = 'Sending 1 MiB through the high-level Transfer API...';
			state.TransferEvents = '—';
		});

		component.TransferReceiver = component.$Network().TransferReceiver({Transport: peer});

		component.TransferReceiver.On('Transfer.Receive', function (event) {
			component.$Batch(function (state) {
				state.TransferReceiverStatus = 'Received';
				state.TransferResult = event.Data.Blob.size + ' bytes received as Blob';
				state.TransferEvents = 'Receive';
			});
		});

		component.Transfer = component.$Network().Transfer({
			Transport: rtc,
			Data: payload.buffer
		});

		component.Transfer.On('Transfer.Progress', function (event) {
			component.TransferProgress = event.Data.Loaded + ' / ' + event.Data.Total + ' bytes';
		});
		component.Transfer.On('Transfer.Complete', function (event) {
			component.$Batch(function (state) {
				state.TransferStatus = 'Complete';
				state.TransferProgress = event.Data.Loaded + ' / ' + event.Data.Total + ' bytes';
			});
		});
		component.Transfer.On('Transfer.Error', function (event) {
			component.TransferStatus = 'Error: ' + (event.Data.Error ? event.Data.Error.message : 'transfer failed');
		});
		component.Transfer.Send();
	},


	_UniversalFiles: function () {
		var fileA = this.$Ref('UniversalFileA');
		var fileB = this.$Ref('UniversalFileB');

		fileA = fileA && fileA.files ? fileA.files[0] : null;
		fileB = fileB && fileB.files ? fileB.files[0] : null;

		if (!fileA || !fileB) return null;

		return {FileA: fileA, FileB: fileB};
	},

	_BuildUniversalPayload: function () {
		var files = this._UniversalFiles();
		if (!files)
			return null;

		return {
			ID: 42,
			Title: 'Elemenx structured media object',
			Description: 'Two user-selected files inside one arbitrary structured object',
			Published: true,
			Tags: ['advanced', 'network', 'media'],
			Author: {ID: 7, Name: 'Elemenx Advanced'},
			Files: {
				A: files.FileA,
				B: files.FileB
			}
		};
	},

	_UniversalRequirePayload: function (name) {
		var payload = this._BuildUniversalPayload();
		if (payload)
			return payload;

		this[name] = 'Choose both files first';

		return null;
	},

	_UniversalResult: function (name, data) {
		var a = data.Files && data.Files.A ? data.Files.A : null;
		var b = data.Files && data.Files.B ? data.Files.B : null;
		var size = (a && a.size ? a.size : 0) + (b && b.size ? b.size : 0);
		var metrics = this.UniversalMetricInstances && this.UniversalMetricInstances[name] ? this.UniversalMetricInstances[name] : null;
		if (metrics && metrics.Active())
			metrics.End();

		this[name] = 'Complete · ' + data.Title + ' · ' + (a && a.name ? a.name : 'File A') + ' + ' + (b && b.name ? b.name : 'File B') + ' · ' + size + ' bytes';
	},

	_UniversalMetricText: function (snapshot) {
		return 'TX       ' + this._FormatMetricBytes(snapshot.TX.Bytes) + '\n' +
			'RX       ' + this._FormatMetricBytes(snapshot.RX.Bytes) + '\n' +
			'Current  ↑ ' + this._FormatMetricSpeed(snapshot.TX.Speed) + ' / ↓ ' + this._FormatMetricSpeed(snapshot.RX.Speed) + '\n' +
			'Average  ↑ ' + this._FormatMetricSpeed(snapshot.TX.SpeedAvg) + ' / ↓ ' + this._FormatMetricSpeed(snapshot.RX.SpeedAvg) + '\n' +
			'Minimum  ↑ ' + this._FormatMetricSpeed(snapshot.TX.SpeedMin) + ' / ↓ ' + this._FormatMetricSpeed(snapshot.RX.SpeedMin) + '\n' +
			'Maximum  ↑ ' + this._FormatMetricSpeed(snapshot.TX.SpeedMax) + ' / ↓ ' + this._FormatMetricSpeed(snapshot.RX.SpeedMax);
	},

	_UniversalMetrics: function (name, transport) {
		var component = this;
		var metrics = component.$Network().Metrics({Transport: transport, Interval: 50, Window: 1000});

		if (!component.UniversalMetricInstances)
			component.UniversalMetricInstances = {};

		if (component.UniversalMetricInstances[name])
			component.UniversalMetricInstances[name].Destroy();

		component.UniversalMetricInstances[name] = metrics;

		metrics.Begin();

		component[name + 'Metrics'] = component._UniversalMetricText(metrics.Snapshot());

		metrics.On('Metrics.Update', function (event) {
			component[name + 'Metrics'] = component._UniversalMetricText(event.Data);
		});

		if (!component.UniversalResources)
			component.UniversalResources = [];

		component.UniversalResources.push(metrics);

		return metrics;
	},

	_UniversalReceive: function (name, transport, close) {
		var component = this;
		var receiver = component.$Network().TransferReceiver({Transport: transport});

		if (!component.UniversalResources)
			component.UniversalResources = [];

		component.UniversalResources.push(receiver);

		receiver.On('Transfer.Receive', function (event) {
			component._UniversalResult(name, event.Data.Data);

			if (close !== false && transport && typeof transport.Close === 'function')
				transport.Close();
		});
		receiver.On('Transfer.Error', function (event) { component[name] = 'Error · ' + (event.Data.Error ? event.Data.Error.message : 'receive failed'); });
	},

	_StageUniversalPayload: function (name, callback) {
		var component = this;
		var payload = component._UniversalRequirePayload(name);
		var transport;
		var transfer;

		if (!payload) return;

		transport = component.$Network().XHR({Method: 'POST', URL: '/elemenx-network-transfer-stage', ResponseType: 'json'});
		transfer = component.$Network().Transfer({Transport: transport, Data: payload});

		if (!component.UniversalResources)
			component.UniversalResources = [];

		component.UniversalResources.push(transfer);

		transfer.On('Transfer.Complete', function () {
			transfer.Destroy();

			callback();
		});
		transfer.On('Transfer.Error', function (event) {
			component[name] = 'Error · ' + (event.Data.Error ? event.Data.Error.message : 'staging failed');
		});
		transfer.Send();
	},

	RunUniversalXHR: function () {
		var component = this;
		var payload = component._UniversalRequirePayload('UniversalXHR');
		var transport;
		var transfer;

		if (!payload) return;

		transport = component.$Network().XHR({Method: 'POST', URL: '/elemenx-network-transfer-xhr', ResponseType: 'json'});

		component._UniversalMetrics('UniversalXHR', transport);

		transfer = component.$Network().Transfer({Transport: transport, Data: payload});
		component.UniversalXHR = 'Sending...';

		transfer.On('Transfer.Complete', function (event) {
			var response = event.Data.Response && event.Data.Response.Response;

			if (response && response.ok && response.data) component._UniversalResult('UniversalXHR', response.data);
			else component.UniversalXHR = 'Error · invalid server reconstruction';

			transfer.Destroy();
		});
		transfer.On('Transfer.Error', function (event) { component.UniversalXHR = 'Error · ' + (event.Data.Error ? event.Data.Error.message : 'transfer failed'); });
		transfer.Send();
	},

	RunUniversalWebSocket: function () {
		var component = this;
		var scheme = location.protocol === 'https:' ? 'wss://' : 'ws://';
		var sender = component.$Network().WebSocket({URL: scheme + location.host + '/elemenx-network-showcase', Protocol: 'AdvancedQuark'});
		var receiver = component.$Network().WebSocket({URL: scheme + location.host + '/elemenx-network-showcase', Protocol: 'AdvancedQuark'});
		var senderOpen = false;
		var receiverOpen = false;
		var receiverReady = false;
		var registerSent = false;
		var started = false;
		var payload = component._UniversalRequirePayload('UniversalWebSocket');
		if (!payload) return;

		function start () {
			var transfer;

			if (started || !senderOpen || !receiverReady) return;

			started = true;

			component._UniversalReceive('UniversalWebSocket', {
				On: function (name, callback) {
					receiver.On(name, callback);

					return this;
				},
				Off: function (name, callback) {
					receiver.Off(name, callback);

					return this;
				},
				Send: function () { return true; }
			});

			transfer = component.$Network().Transfer({
				Transport: sender,
				Data: payload,
				ChunkSize: 128 * 1024,
				WindowSize: 8,
				Retry: 1500,
				MaxRetries: 8
			});

			component.UniversalResources.push(transfer);

			component.UniversalWebSocket = 'Sending...';

			transfer.Send();
		}

		component.UniversalWebSocket = 'Connecting...';

		if (!component.UniversalResources)
			component.UniversalResources = [];

		component.UniversalResources.push(sender);
		component.UniversalResources.push(receiver);
		component._UniversalMetrics('UniversalWebSocket', sender);

		sender.On('Transport.Open', function () {
			senderOpen = true;

			start();
		});
		receiver.On('Transport.Open', function () {
			receiverOpen = true;

			if (registerSent) return;

			registerSent = true;

			receiver.Send({url: '/api/media', data: {type: 'TransferReceiver', action: 'Register', correlationID: AdvancedQuarkNextCorrelation()}});
		});
		receiver.On('Protocol.Response', function (event) {
			var wire = event.Data;
			if (!receiverOpen || receiverReady || !wire || !wire.data || wire.data.status !== 200) return;

			receiverReady = true;

			start();
		});
		sender.On('Transport.Error', function () { component.UniversalWebSocket = 'Error · sender WebSocket'; });
		receiver.On('Transport.Error', function () { component.UniversalWebSocket = 'Error · receiver WebSocket'; });
		receiver.Connect();
		sender.Connect();
	},

	RunUniversalSSE: function () {
		var component = this;

		component.UniversalSSE = 'Preparing selected files...';

		component._StageUniversalPayload('UniversalSSE', function () {
			var transport = component.$Network().SSE({URL: '/elemenx-network-transfer-sse', Protocol: 'AdvancedTransferJSON'});

			component.UniversalSSE = 'Receiving...';

			component._UniversalMetrics('UniversalSSE', transport);
			component._UniversalReceive('UniversalSSE', transport, false);
			component.UniversalResources.push(transport);

			transport.Connect();
		});
	},

	RunUniversalLongPolling: function () {
		var component = this;

		component.UniversalLongPolling = 'Preparing selected files...';

		component._StageUniversalPayload('UniversalLongPolling', function () {
			var transport = component.$Network().LongPolling({URL: '/elemenx-network-transfer-longpolling', Protocol: 'AdvancedTransferJSON', Retry: 1});

			component.UniversalLongPolling = 'Receiving...';

			component._UniversalMetrics('UniversalLongPolling', transport);
			component._UniversalReceive('UniversalLongPolling', transport, false);

			transport.On('Protocol.Transfer', function (event) {
				if (event.Data && event.Data.Action === 'End')
					transport.Close();
			});

			component.UniversalResources.push(transport);

			transport.Connect();
		});
	},

	RunUniversalStream: function () {
		var component = this;

		component.UniversalStream = 'Preparing selected files...';

		component._StageUniversalPayload('UniversalStream', function () {
			var transport = component.$Network().Stream({URL: '/elemenx-network-transfer-stream', Protocol: 'AdvancedTransferJSON'});

			component.UniversalStream = 'Receiving...';

			component._UniversalMetrics('UniversalStream', transport);
			component._UniversalReceive('UniversalStream', transport, false);
			component.UniversalResources.push(transport);

			transport.Connect();
		});
	},

	RunUniversalWebRTC: function () {
		var component = this;
		var payload = component._UniversalRequirePayload('UniversalWebRTC');
		var initiator;
		var responder;
		var offer;

		if (!payload) return;

		initiator = component.$Network().WebRTC({
			Protocol: 'AdvancedRTC',
			ChannelName: 'elemenx-universal-transfer',
			Channel: {ordered: true, protocol: 'elemenx-transfer-binary'},
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

		if (!component.UniversalResources)
			component.UniversalResources = [];

		component.UniversalResources.push(initiator);
		component.UniversalResources.push(responder);
		component._UniversalMetrics('UniversalWebRTC', initiator);
		component._UniversalReceive('UniversalWebRTC', responder);

		initiator.On('Transport.Channel', function () {
			if (initiator.DataChannel())
				initiator.DataChannel().binaryType = 'arraybuffer';
		});
		responder.On('Transport.Channel', function () {
			if (responder.DataChannel())
				responder.DataChannel().binaryType = 'arraybuffer';
		});

		component.UniversalWebRTC = 'Connecting...';

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
		}).then(function () {
			function send () {
				var transfer;

				if (!initiator.Writable() || !responder.Writable()) {
					setTimeout(send, 25);

					return;
				}

				transfer = component.$Network().Transfer({Transport: initiator, Data: payload});

				component.UniversalResources.push(transfer);

				component.UniversalWebRTC = 'Sending...';

				transfer.Send();
			}
			send();
		}).catch(function (error) {
			component.UniversalWebRTC = 'Error · ' + error.message;
		});
	},

	RunUniversalAll: function () {
		this.RunUniversalXHR();
		this.RunUniversalWebSocket();
		this.RunUniversalSSE();
		this.RunUniversalLongPolling();
		this.RunUniversalStream();
		this.RunUniversalWebRTC();
	},

	ConnectStructuredTransfer: function () {
		this.ConnectWebSocket();
		this.ConnectWebRTC();

		this.StructuredStatus = 'Connecting WebSocket control + WebRTC data planes...';
	},

	SendStructuredTransfer: function () {
		var component = this;
		var rtc = component.RTCInitiator;
		var peer = component.RTCResponder;
		var socket = component.Socket;
		var media;
		var bytes;
		var payload;
		var correlationID;
		var i;

		if (!socket || !socket.Writable() || !rtc || !peer || !rtc.Writable() || !peer.Writable()) {
			component.StructuredStatus = 'Connect WebSocket + WebRTC first';

			return;
		}

		if (component.StructuredTransfer && component.StructuredTransfer.Active()) return;

		if (component.StructuredTransfer)
			component.StructuredTransfer.Destroy();

		if (component.StructuredReceiver)
			component.StructuredReceiver.Destroy();

		bytes = new Uint8Array(2 * 1024 * 1024);
		i = 0;
		while (i < bytes.length) {
			bytes[i] = i % 251;

			i++;
		}

		media = new Blob([bytes], {type: 'video/mp4'});
		payload = {
			ID: 42,
			Title: 'Elemenx structured media object',
			Description: 'Business object transferred without manual chunk handling',
			Published: true,
			Tags: ['advanced', 'network', 'media'],
			Author: {ID: 7, Name: 'Elemenx Advanced'},
			Media: media
		};
		correlationID = 'structured-' + Date.now();

		component.$Batch(function (state) {
			state.StructuredStatus = 'Sending';
			state.StructuredControl = 'Quark /api/media request · ' + correlationID;
			state.StructuredProgress = '0 / preparing envelope';
			state.StructuredResult = 'Waiting for reconstructed object...';
		});

		socket.Send({url: '/api/media', data: {correlationID: correlationID, entityID: payload.ID, title: payload.Title, mediaSize: media.size, transport: 'webrtc'}});

		component.StructuredReceiver = component.$Network().TransferReceiver({Transport: peer});

		component.StructuredReceiver.On('Transfer.Receive', function (event) {
			var data = event.Data.Data;

			component.$Batch(function (state) {
				state.StructuredStatus = 'Complete';
				state.StructuredResult = data.Title + ' · author ' + data.Author.Name + ' · ' + data.Tags.length + ' tags · media ' + data.Media.size + ' bytes (' + data.Media.type + ')';
			});
		});

		component.StructuredTransfer = component.$Network().Transfer({Transport: rtc, Data: payload});

		component.StructuredTransfer.On('Transfer.Progress', function (event) {
			component.StructuredProgress = event.Data.Loaded + ' / ' + event.Data.Total + ' bytes';
		});
		component.StructuredTransfer.On('Transfer.Error', function (event) {
			component.StructuredStatus = 'Error: ' + (event.Data.Error ? event.Data.Error.message : 'transfer failed');
		});
		component.StructuredTransfer.Send();
	},

	DisconnectWebRTC: function () {
		if (this.StructuredTransfer)
			this.StructuredTransfer.Destroy();

		if (this.StructuredReceiver)
			this.StructuredReceiver.Destroy();

		this.StructuredTransfer = null;
		this.StructuredReceiver = null;

		if (this.Metrics)
			this.Metrics.Destroy();

		this.Metrics = null;

		if (this.Transfer)
			this.Transfer.Destroy();

		if (this.TransferReceiver)
			this.TransferReceiver.Destroy();

		this.Transfer = null;
		this.TransferReceiver = null;

		if (this.RTCInitiator)
			this.RTCInitiator.Close();

		if (this.RTCResponder)
			this.RTCResponder.Close();

		this.RTCInitiator = null;
		this.RTCResponder = null;
		this._RTCOutgoing = null;
		this._RTCIncoming = null;
		this.RTCStatus = 'Disconnected';
	},

	$OnDestroy: function () {
		if (this.Metrics)
			this.Metrics.Destroy();

		if (this.Request && this.Request.Abort)
			this.Request.Abort();

		if (this.Socket)
			this.Socket.Close(1000, 'destroy');

		if (this.EventStream)
			this.EventStream.Close();

		if (this.LongPolling)
			this.LongPolling.Close();

		if (this.Stream)
			this.Stream.Close();

		if (this.Transfer)
			this.Transfer.Destroy();

		if (this.TransferReceiver)
			this.TransferReceiver.Destroy();

		if (this.RTCInitiator)
			this.RTCInitiator.Close();

		if (this.RTCResponder)
			this.RTCResponder.Close();
	}
});