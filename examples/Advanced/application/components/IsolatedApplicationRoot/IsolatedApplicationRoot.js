Elemenx.Component('IsolatedApplicationRoot', {
	$Template: '<div class="component-probe"><strong>Isolated Application root</strong><span>Instance {{Instance}} · generation {{Generation}} · {{Phase}}</span></div>',

	Instance: 0,
	Generation: 0,
	Phase: 'definition',

	$OnCreate: function () {
		this.Generation = this.$Generation();
		this.Phase = 'created';
	},

	$OnReady: function () {
		this.Phase = 'ready';
	}
});