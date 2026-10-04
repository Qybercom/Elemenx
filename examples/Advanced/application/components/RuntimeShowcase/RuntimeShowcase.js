Elemenx.Component('RuntimeShowcase', {
	$Template: '<section class="showcase-section runtime-showcase"><div class="showcase-heading"><div><p class="eyebrow">Application / runtime</p><h2>Runtime inspection, isolated lifecycle and development Reload</h2></div><p>The card uses only public Application and Component APIs: inspect the current runtime, destroy/recreate an isolated child and reload its discovered Component definition.</p></div><div class="runtime-grid"><div class="runtime-panel"><h3>Runtime</h3><dl class="runtime-values"><dt>Runtime ID</dt><dd>{{RuntimeID}}</dd><dt>Runtime started</dt><dd>{{RuntimeStarted}}</dd><dt>Runtime uptime</dt><dd>{{RuntimeUptime}}</dd><dt>Application</dt><dd>{{ApplicationName}}</dd><dt>App started</dt><dd>{{ApplicationStarted}}</dd><dt>App uptime</dt><dd>{{ApplicationUptime}}</dd><dt>Root</dt><dd>{{RootName}}</dd><dt>Router</dt><dd>{{RouterStatus}}</dd><dt>Mount</dt><dd>{{MountStatus}}</dd></dl><p class="runtime-status">{{InspectionStatus}}</p><button class="button" (click)="RefreshRuntime">Refresh inspection</button></div><div class="runtime-panel"><h3>Application startup lifecycle</h3><dl class="runtime-values startup-lifecycle"><dt>Bootstrap</dt><dd>{{BootstrapStatus}}</dd><dt>Pending</dt><dd>{{PendingStatus}}</dd><dt>Ready</dt><dd>{{ReadyStatus}}</dd><dt>Error</dt><dd>{{ErrorStatus}}</dd></dl><p class="runtime-status">$Bootstrap initializes this marker before root construction; the three Application lifecycle hooks update the counters as startup progresses.</p></div><div class="runtime-panel"><h3>Isolated child lifecycle</h3><div #RuntimeProbe></div><p class="runtime-status">{{LifecycleStatus}}</p><div class="runtime-actions"><button class="button" (click)="DestroyProbe">Destroy child</button><button class="button" (click)="RecreateProbe">Recreate child</button></div></div><div class="runtime-panel"><h3>Service lifecycle</h3><p><b>RuntimeService</b> stays lazy until the first property access. Destroy removes the current Application-owned instance; the next access creates a fresh instance.</p><dl class="runtime-values"><dt>State</dt><dd class="runtime-service-state">{{ServiceStatus}}</dd><dt>Generation</dt><dd class="runtime-service-generation">{{ServiceGeneration}}</dd><dt>Started</dt><dd>{{ServiceStarted}}</dd></dl><div class="runtime-actions"><button class="button" (click)="CreateService">Create / inspect service</button><button class="button" (click)="DestroyService">Destroy service</button></div></div><div class="runtime-panel runtime-reload"><h3>Development Reload</h3><p>Reloads discovered definitions through Application.$Reload(). Component reload refreshes the existing <b>RuntimeProbe</b>; Service reload destroys its current instance and the next access creates the new generation.</p><div class="runtime-reload-actions"><div><p class="runtime-status">{{ReloadStatus}}</p><button class="button primary" (click)="ReloadProbe">Reload RuntimeProbe</button></div><div><p class="runtime-status runtime-service-reload-status">{{ServiceReloadStatus}}</p><button class="button primary" (click)="ReloadService">Reload RuntimeService</button></div></div></div></div></section>',
	$Style: '.runtime-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.runtime-panel{padding:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface-soft)}.runtime-panel h3{margin-top:0}.runtime-reload{grid-column:1/-1}.runtime-values{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:7px 14px;margin:0 0 14px}.runtime-values dt{color:var(--text-soft)}.runtime-values dd{margin:0;font:600 12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.runtime-actions{display:flex;flex-wrap:wrap;gap:8px}.runtime-reload-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.runtime-status{min-height:20px;font:600 12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace}@media(max-width:760px){.runtime-grid,.runtime-reload-actions{grid-template-columns:1fr}.runtime-reload{grid-column:auto}}',

	RuntimeID: '-',
	RuntimeStarted: '-',
	RuntimeUptime: '-',
	ApplicationName: '-',
	ApplicationStarted: '-',
	ApplicationUptime: '-',
	RootName: '-',
	RouterStatus: '-',
	MountStatus: '-',
	BootstrapStatus: 'not called',
	PendingStatus: '0 calls',
	ReadyStatus: '0 calls',
	ErrorStatus: '0 calls · hook armed',
	LifecycleStatus: 'Child not created',
	InspectionStatus: 'Not inspected yet',
	ReloadStatus: 'Not reloaded yet',
	ServiceStatus: 'Lazy · not instantiated',
	ServiceGeneration: '-',
	ServiceStarted: '-',
	ServiceReloadStatus: 'Not reloaded yet',

	$OnCreate: function () {
		this.RuntimeProbe = null;
		this.RuntimeProbeSequence = 0;
		this.InspectionSequence = 0;
		this.AttachStartupLifecycle();
		this.RefreshRuntime();
		this.CreateProbe();
	},


	AttachStartupLifecycle: function () {
		var application = this.$Application();
		var startup = application ? application.$ShowcaseStartup : null;
		var component = this;

		if (!startup) return;
		startup.Listener = function () {
			component.RefreshStartupLifecycle();
		};
		this.RefreshStartupLifecycle();
	},

	RefreshStartupLifecycle: function () {
		var application = this.$Application();
		var startup = application ? application.$ShowcaseStartup : null;

		if (!startup) return;
		this.BootstrapStatus = 'called · ' + this.FormatStartedAt(startup.BootstrapAt);
		this.PendingStatus = startup.Pending + (startup.Pending === 1 ? ' call' : ' calls');
		this.ReadyStatus = startup.Ready + (startup.Ready === 1 ? ' call' : ' calls');
		this.ErrorStatus = startup.Error + (startup.Error === 1 ? ' call' : ' calls') + (startup.LastError ? ' · ' + (startup.LastError.message || startup.LastError) : ' · hook armed');
	},

	FormatStartedAt: function (value) {
		function pad (number, length) {
			var result=String(number);
			while (result.length<length) result='0'+result;
			return result;
		}
		return value.getFullYear()+'-'+pad(value.getMonth()+1,2)+'-'+pad(value.getDate(),2)+' '+pad(value.getHours(),2)+':'+pad(value.getMinutes(),2)+':'+pad(value.getSeconds(),2)+'.'+pad(value.getMilliseconds(),3);
	},

	FormatUptime: function (milliseconds) {
		var hours=Math.floor(milliseconds/3600000);
		var minutes=Math.floor((milliseconds%3600000)/60000);
		var seconds=Math.floor((milliseconds%60000)/1000);
		var ms=Math.floor(milliseconds%1000);
		function pad (number, length) {
			var result=String(number);
			while (result.length<length) result='0'+result;
			return result;
		}
		return pad(hours,2)+':'+pad(minutes,2)+':'+pad(seconds,2)+'.'+pad(ms,3);
	},

	RefreshRuntime: function () {
		var application = this.$Application();
		var root = application && application.$Component ? application.$Component() : null;
		var router = application && application.$Router ? application.$Router() : null;
		var mount = application && application.$Mount ? application.$Mount() : null;
		var now = Date.now();
		var runtimeStarted = Elemenx.StartedAt();
		var applicationStarted = application && application.$StartedAt ? application.$StartedAt() : null;

		this.RuntimeID = Elemenx.RuntimeID();
		this.RuntimeStarted = this.FormatStartedAt(runtimeStarted);
		this.RuntimeUptime = this.FormatUptime(now-runtimeStarted.getTime());
		this.ApplicationName = application && application.$Name ? application.$Name() : 'none';
		this.ApplicationStarted = applicationStarted ? this.FormatStartedAt(applicationStarted) : 'none';
		this.ApplicationUptime = applicationStarted ? this.FormatUptime(now-applicationStarted.getTime()) : 'none';
		this.RootName = root && root.$Name ? root.$Name() : (root ? 'mounted' : 'none');
		this.RouterStatus = router ? 'active' : 'none';
		this.MountStatus = mount ? (mount.id ? '#' + mount.id : mount.tagName.toLowerCase()) : 'none';
		this.InspectionStatus = 'Inspection #' + (++this.InspectionSequence) + ' · refreshed';
	},

	CreateProbe: function () {
		var factory;
		var probe;
		var component = this;

		if (this.RuntimeProbe) return;
		factory = Elemenx.Component('RuntimeProbe');
		this.RuntimeProbeSequence++;
		probe = factory({
			Label: 'Runtime child',
			Instance: this.RuntimeProbeSequence
		}, null, {Application: this.$Application()});
		probe.$Parent(this);
		probe.$On('lifecycle', function (name) {
			component.LifecycleStatus = 'Child ' + name + ' · generation ' + probe.$Generation();
		});
		this.$Ref('RuntimeProbe').appendChild(probe.$Element());
		this.RuntimeProbe = probe;
		this.LifecycleStatus = 'Child mounted · generation ' + probe.$Generation();
	},

	DestroyProbe: function () {
		if (!this.RuntimeProbe) {
			this.LifecycleStatus = 'Child already destroyed';
			return;
		}

		this.RuntimeProbe.$Destroy();
		this.RuntimeProbe = null;
		this.LifecycleStatus = 'Child destroyed';
	},

	RecreateProbe: function () {
		this.DestroyProbe();
		this.CreateProbe();
	},

	CreateService: function () {
		var service = this.$Application().$Service('RuntimeService');
		var snapshot = service.Snapshot();

		this.ServiceStatus = snapshot.Phase + ' · Application-owned';
		this.ServiceGeneration = String(snapshot.Generation);
		this.ServiceStarted = this.FormatStartedAt(snapshot.StartedAt);
	},

	DestroyService: function () {
		var service = this.$Application().$Service('RuntimeService');

		service.$Destroy();
		this.ServiceStatus = 'Destroyed · next access is lazy create';
		this.ServiceGeneration = '-';
		this.ServiceStarted = '-';
	},

	ReloadService: function () {
		var component = this;
		var application = this.$Application();

		this.ServiceReloadStatus = 'Reloading RuntimeService...';
		application.$Reload('Service', 'RuntimeService', function (error) {
			var service;
			var snapshot;

			if (error) {
				component.ServiceReloadStatus = 'Reload failed · ' + (error.message || error);
				return;
			}

			service = application.$Service('RuntimeService');
			snapshot = service.Snapshot();
			component.ServiceStatus = snapshot.Phase + ' · re-created after reload';
			component.ServiceGeneration = String(snapshot.Generation);
			component.ServiceStarted = component.FormatStartedAt(snapshot.StartedAt);
			component.ServiceReloadStatus = 'Reload complete · generation ' + snapshot.Generation;
		});
	},

	ReloadProbe: function () {
		var component = this;
		var application = this.$Application();

		this.ReloadStatus = 'Reloading RuntimeProbe...';
		application.$Reload('Component', 'RuntimeProbe', function (error) {
			if (error) {
				component.ReloadStatus = 'Reload failed · ' + (error.message || error);
				return;
			}

			component.ReloadStatus = 'Reload complete';
			component.RefreshRuntime();
		});
	},

	$OnDestroy: function () {
		var application = this.$Application();
		if (application && application.$ShowcaseStartup && application.$ShowcaseStartup.Listener)
			application.$ShowcaseStartup.Listener = null;
		if (this.RuntimeProbe) this.RuntimeProbe.$Destroy();
		this.RuntimeProbe = null;
	}
});