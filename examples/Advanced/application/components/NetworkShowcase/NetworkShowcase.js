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

	$OnDestroy: function () {
		if (this.Request && this.Request.Abort)
			this.Request.Abort();
	}
});