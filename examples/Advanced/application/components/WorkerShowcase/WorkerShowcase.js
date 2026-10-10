Elemenx.Component('WorkerShowcase', {
	$TemplateURL: 'WorkerShowcase.html',
	_Sender: null,
	_Manual: null,
	_Lazy: null,
	_Auto: null,
	_Service: null,
	ManualMeta: 'AdvancedManualWorker / advanced:webworker-manual / manual',
	LazyMeta: 'AdvancedLazyWorker / advanced:webworker-lazy / lazy',
	AutoMeta: 'AdvancedAutoWorker / advanced:webworker-auto / auto',
	ManualState: 'not created',
	LazyState: 'not created',
	AutoState: 'not created',
	WebReply: 'waiting',
	WebLifecycle: 'not started',
	ServiceMeta: 'not created',
	ServiceRegistration: 'no',
	ServiceState: 'not registered',
	ServiceRegistered: 'unknown',
	ServiceControlled: 'no',
	ServiceReachable: 'no',
	ServiceReply: 'waiting',
	ServiceLifecycle: 'not started',
	ServiceRefresh: 'not refreshed manually',
	_ServiceRefreshCount: 0,

	$OnCreate: function () {
		var component = this;

		this._Sender = this.$Messaging();

		this._Sender.On(function (message) {
			var data = message.Data || {};
			if (data.Type !== 'pong') return;

			if (data.WorkerName === 'AdvancedServiceWorker') component.ServiceReply = 'pong: ' + data.Value;
			else component.WebReply = data.WorkerName + ': pong ' + data.Value;
		});
		this.CreateWebWorkers();
	},

	TrackWebWorker: function (worker, label) {
		var component = this;

		worker.On('Starting', function () {
			component.WebLifecycle = label + ': Starting';

			component.RefreshWebWorkers();
		});
		worker.On('Running', function () {
			component.WebLifecycle = label + ': Running';

			component.RefreshWebWorkers();
		});
		worker.On('Stop', function () {
			component.WebLifecycle = label + ': Stop';

			component.RefreshWebWorkers();
		});
		worker.On('Error', function () {
			component.WebLifecycle = label + ': Error';

			component.RefreshWebWorkers();
		});
	},

	CreateWebWorkers: function () {
		if (this._Manual)
			this._Manual.Destroy();

		if (this._Lazy)
			this._Lazy.Destroy();

		if (this._Auto)
			this._Auto.Destroy();

		this._Manual = this.$WebWorker('AdvancedManualWorker', {Script: '/data/worker-showcase.js', StartMode: 'manual', Channel: 'advanced:webworker-manual'});
		this._Lazy = this.$WebWorker('AdvancedLazyWorker', {Script: '/data/worker-showcase.js', StartMode: 'lazy', Channel: 'advanced:webworker-lazy'});
		this._Auto = this.$WebWorker('AdvancedAutoWorker', {Script: '/data/worker-showcase.js', StartMode: 'auto', Channel: 'advanced:webworker-auto'});

		this.TrackWebWorker(this._Manual, 'manual');
		this.TrackWebWorker(this._Lazy, 'lazy');
		this.TrackWebWorker(this._Auto, 'auto');

		this.WebLifecycle = 'owner-aware handles created';

		this.RefreshWebWorkers();
	},

	RefreshWebWorkers: function () {
		this.ManualState = this._Manual ? this._Manual.State() + ' / native=' + (this._Manual.Native() ? 'yes' : 'no') : 'destroyed';
		this.LazyState = this._Lazy ? this._Lazy.State() + ' / native=' + (this._Lazy.Native() ? 'yes' : 'no') : 'destroyed';
		this.AutoState = this._Auto ? this._Auto.State() + ' / native=' + (this._Auto.Native() ? 'yes' : 'no') : 'destroyed';
	},

	StartManual: function () {
		this._Manual.Start();
		this.RefreshWebWorkers();
	},

	StopManual: function () {
		this._Manual.Stop();
		this.RefreshWebWorkers();
	},

	RestartManual: function () {
		this._Manual.Stop().Start();
		this.RefreshWebWorkers();
	},

	DestroyManual: function () {
		this._Manual.Destroy();
		this._Manual = null;
		this.WebLifecycle = 'manual: Destroy';

		this.RefreshWebWorkers();
	},

	PingManual: function () {
		this.WebReply = 'waiting';

		this._Sender.Send('advanced:webworker-manual', {Command: 'ping', Value: 'manual'});
	},

	PingLazy: function () {
		this.WebReply = 'waiting; first send starts lazy worker';

		this._Sender.Send('advanced:webworker-lazy', {Command: 'ping', Value: 'lazy'});
		this.RefreshWebWorkers();
	},

	PingAuto: function () {
		this.WebReply = 'waiting';

		this._Sender.Send('advanced:webworker-auto', {Command: 'ping', Value: 'auto'});
	},

	RegisterServiceWorker: function () {
		var component = this;

		if (this._Service) {
			this._Service.Register();

			this.ServiceLifecycle = 'Register requested';

			this.RefreshServiceWorker();

			return;
		}

		this._Service = this.$ServiceWorker('AdvancedServiceWorker', {
			Script: '/data/worker-showcase.js',
			Scope: '/elemenx-worker-showcase/',
			Channel: 'advanced:serviceworker'
		});
		['Installing', 'Waiting', 'Active', 'Unregistering', 'Unregistered', 'Error'].forEach(function (state) {
			component._Service.On(state, function () {
				component.ServiceLifecycle = state;

				component.RefreshServiceWorker();
			});
		});
		this.ServiceMeta = this._Service.Name() + ' / ' + this._Service.Channel() + ' / ' + this._Service.Scope();
		this.ServiceLifecycle = 'Register requested';

		this.RefreshServiceWorker();
	},

	RefreshServiceWorkerStatus: function () {
		var now = new Date();

		this._ServiceRefreshCount++;

		this.RefreshServiceWorker();

		this.ServiceRefresh = 'Refresh #' + this._ServiceRefreshCount + ' · ' +
			String(now.getHours()).padStart(2, '0') + ':' +
			String(now.getMinutes()).padStart(2, '0') + ':' +
			String(now.getSeconds()).padStart(2, '0') + '.' +
			String(now.getMilliseconds()).padStart(3, '0');
	},

	RefreshServiceWorker: function () {
		var component = this;

		if (!this._Service) {
			this.ServiceMeta = 'not created';
			this.ServiceRegistration = 'no';
			this.ServiceState = 'not registered';
			this.ServiceRegistered = 'unknown';
			this.ServiceControlled = 'no';
			this.ServiceReachable = 'no';

			return;
		}

		this.ServiceState = this._Service.State();
		this.ServiceRegistration = this._Service.Registration() ? 'yes' : 'no';
		this.ServiceControlled = this._Service.Controlled() ? 'yes' : 'no';
		this.ServiceReachable = this._Service.Reachable() ? 'yes' : 'no';

		this._Service.Registered(function (value) {
			component.ServiceRegistered = value ? 'yes' : 'no';
		});
	},

	UpdateServiceWorker: function () {
		if (!this._Service) return;

		this._Service.Update();

		this.ServiceLifecycle = 'Update requested';

		this.RefreshServiceWorker();
	},

	UnregisterServiceWorker: function () {
		if (!this._Service) return;

		this._Service.Unregister();
		this.RefreshServiceWorker();
	},

	PingServiceWorker: function () {
		if (!this._Service || !this._Service.Reachable()) {
			this.ServiceReply = 'worker is not reachable yet';

			this.RefreshServiceWorker();

			return;
		}

		this.ServiceReply = 'waiting';

		this._Sender.Send('advanced:serviceworker', {Command: 'ping', Value: 'service'});
	}
});