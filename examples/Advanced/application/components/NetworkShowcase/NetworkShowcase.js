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
	},

	$OnDestroy: function () {
		if (this.Request && this.Request.Abort)
			this.Request.Abort();
		if (this.Socket) this.Socket.Close(1000, 'destroy');
		if (this.EventStream) this.EventStream.Close();
	}
});