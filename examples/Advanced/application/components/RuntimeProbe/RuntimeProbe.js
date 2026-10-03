Elemenx.Component('RuntimeProbe', {
	$Template: '<article class="component-probe"><strong>{{Label}}</strong><span>Instance {{Instance}} · generation {{Generation}} · {{Phase}}</span></article>',

	Label: 'Runtime child',
	Instance: 0,
	Generation: 0,
	Phase: 'definition',

	$OnCreate: function () {
		this.Generation = this.$Generation();
		this.Phase = 'created';
	},

	$OnReady: function () {
		this.Generation = this.$Generation();
		this.Phase = 'ready';
	},

	$OnDestroy: function () {
		this.$Emit('lifecycle', 'destroyed');
	}
});