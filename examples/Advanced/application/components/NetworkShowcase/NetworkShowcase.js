Elemenx.Component('NetworkShowcase', {
	TemplateURL: 'NetworkShowcase.html',

	Status: 'Idle',
	Response: 'No request yet.',
	Events: '—',

	Request: null,

	Load: function () {
		var component = this;
		if (component.Request) return;

		var events = [];

		component.Batch(function (state) {
			state.Status = 'Loading';
			state.Response = 'Waiting for response...';
			state.Events = 'BeforeRequest';
		});

		component.Request = Elemenx.Network.XHR({
			Method: 'GET',
			URL: '/data/network-showcase.json'
		});

		component.Request.On('Transport', function (event) {
			events.push(event.Type);

			component.Batch(function (state) {
				state.Events = events.join(' → ');
			});
		});

		component.Request.On('Transport.Success', function (event) {
			var payload;

			try {
				payload = JSON.parse(event.Data.ResponseText);
			}
			catch (error) {
				payload = null;
			}

			component.Batch(function (state) {
				state.Status = payload && payload.ok ? 'Success' : 'Invalid response';
				state.Response = payload ? payload.message : 'Response was not valid JSON.';
			});

			component.Request = null;
		});

		component.Request.On('Transport.Error', function () {
			component.Batch(function (state) {
				state.Status = 'Error';
				state.Response = 'Network request failed.';
			});

			component.Request = null;
		});

		component.Request.Execute();
	},

	ElemenxOnDestroy: function () {
		if (this.Request && this.Request.Abort)
			this.Request.Abort();
	}
});