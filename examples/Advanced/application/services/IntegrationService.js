var IntegrationServiceSequence = 0;

Elemenx.Service('IntegrationService', {
	$Messaging: ['advanced:service-integration'],
	Instance: 0,
	LastMessage: 'waiting',
	WebWorker: null,
	ServiceWorker: null,

	$OnCreate: function () {
		IntegrationServiceSequence++;
		this.Instance = IntegrationServiceSequence;
	},

	$OnMessage: function (message) {
		if (!message.Is('advanced:service-integration')) return;
		this.LastMessage = message.Data;
	},

	Exercise: function (onWorkerState) {
		var network = this.$Network();
		var storage = this.$Storage();
		var messaging = this.$Messaging();
		var xhr = network.XHR({Method: 'GET', URL: '/elemenx-network-showcase'});
		var key = 'service-integration';
		var worker;

		storage.Local.Set(key, 'storage roundtrip');
		messaging.Send('advanced:service-integration', 'message roundtrip');

		if (!this.WebWorker) {
			this.WebWorker = this.$WebWorker('AdvancedIntegrationServiceWorker', {Script: '/data/worker-showcase.js', StartMode: 'auto', Channel: 'advanced:service-integration-worker'});
			worker = this.WebWorker;
			if (typeof onWorkerState === 'function') {
				worker.On('Running', function () { onWorkerState(worker); });
				worker.On('Error', function () { onWorkerState(worker); });
			}
		}
		if (!this.ServiceWorker)
			this.ServiceWorker = this.$ServiceWorker('AdvancedIntegrationServiceWorker', {Script: '/data/worker-showcase.js', Scope: '/elemenx-service-integration/', Channel: 'advanced:service-integration-serviceworker'});

		return {
			Instance: this.Instance,
			Network: xhr ? 'XHR handle created' : 'unavailable',
			Storage: storage.Local.Get(key),
			Messaging: this.LastMessage,
			WebWorker: this.WebWorker ? this.WebWorker.Name() + ' · ' + this.WebWorker.State() : 'unavailable',
			WebWorkerHandle: this.WebWorker,
			ServiceWorker: this.ServiceWorker ? this.ServiceWorker.Name() : 'unavailable'
		};
	}
});