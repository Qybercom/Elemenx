Elemenx.Component('ComponentShowcase', {
	$Template: '<section class="showcase-section component-api-showcase"><div class="showcase-heading"><div><p class="eyebrow">Component API</p><h2>Component lifecycle and public methods</h2></div><p>Inline Template/Style host a TemplateID child and exercise Update, Batch, Ref, On/Emit, Parent, Application, Element and Generation.</p></div><div class="component-api-grid"><div class="component-api-panel"><h3>Reactive host</h3><p #HostStatus>{{HostStatus}}</p><div class="component-api-actions"><button class="button" (click)="UpdateHost">Update()</button><button class="button" (click)="BatchHost">Batch()</button></div><small>Ref: {{RefStatus}} · Element: {{ElementStatus}}</small></div><div class="component-api-panel"><h3>TemplateID child</h3><div #ProbeMount></div><div class="component-api-actions"><button class="button" (click)="IncrementProbe">Emit change</button><button class="button" (click)="RecreateProbe">Destroy / recreate</button></div><small>{{OwnerStatus}}</small><div class="component-lifecycle"><span *for="item of Lifecycle">{{item}}</span></div></div></div></section>',
	$Style: '.component-api-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.component-api-panel{padding:16px;border:1px solid var(--border);border-radius:10px;background:var(--surface-soft)}.component-api-panel h3{margin-top:0}.component-probe{display:flex;justify-content:space-between;gap:12px;padding:10px;border:1px dashed var(--border);border-radius:8px}.component-api-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.component-lifecycle{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.component-lifecycle span{padding:4px 7px;border:1px solid var(--border);border-radius:999px;font:600 11px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace}@media(max-width:760px){.component-api-grid{grid-template-columns:1fr}}',

	HostStatus: 'Initial host state',
	RefStatus: 'pending',
	ElementStatus: 'pending',
	OwnerStatus: 'Probe not created',
	Lifecycle: [],

	$OnCreate: function () {
		this.Probe = null;
		this.ProbeSequence = 0;
		this.Lifecycle = ['Host Create'];
		this.RefStatus = this.$Ref('HostStatus') ? '#HostStatus resolved' : '#HostStatus missing';
		this.ElementStatus = this.$Element() ? 'Element() available' : 'Element() missing';
		this.CreateProbe();
	},

	$OnReady: function () {
		this.Lifecycle = this.Lifecycle.concat(['Host Ready']);
	},

	CreateProbe: function () {
		var component = this;
		var factory = Elemenx.Component('ComponentProbe');
		var probe = factory({Label: 'Probe #' + (++this.ProbeSequence)}, null, {Application: this.$Application()});

		probe.$Parent(this);
		probe.$On('lifecycle', function (name) {
			component.Lifecycle = component.Lifecycle.concat(['Child ' + name]);
		});
		probe.$On('change', function (count) {
			component.Lifecycle = component.Lifecycle.concat(['Emit change=' + count]);
		});
		this.$Ref('ProbeMount').appendChild(probe.$Element());
		this.Probe = probe;

		var parent = probe.$Parent();
		var application = probe.$Application();
		this.OwnerStatus = 'Parent: ' + (parent ? 'ComponentShowcase' : 'none') + ' · Application: ' + (application ? application.$Name() : 'none') + ' · Generation: ' + probe.$Generation();
	},

	UpdateHost: function () {
		this.$Update({HostStatus: 'Updated through Component.$Update()'});
	},

	BatchHost: function () {
		this.$Batch(function (state) {
			state.HostStatus = 'Updated in one Batch()';
			state.RefStatus = 'Ref() still points to the same DOM node';
		});
	},

	IncrementProbe: function () {
		var probe = this.Probe && this.Probe._Component ? this.Probe._Component() : this.Probe;
		if (probe && typeof probe.Increment === 'function') probe.Increment();
	},

	RecreateProbe: function () {
		if (this.Probe) this.Probe.$Destroy();
		this.Probe = null;
		this.CreateProbe();
	},

	$OnDestroy: function () {
		if (this.Probe) this.Probe.$Destroy();
		this.Probe = null;
	}
});