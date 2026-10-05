var DirectiveStructuralProbeSequence = 0;

Elemenx.Component('DirectiveStructuralProbe', {
	$Template: '<article class="component-probe directive-structural-probe"><strong>Structural child</strong><span>Instance {{Instance}} · {{Phase}}</span></article>',

	Instance: 0,
	Phase: 'definition',

	$OnCreate: function () {
		this.Instance = ++DirectiveStructuralProbeSequence;
		this.Phase = 'created';
	},

	$OnReady: function () {
		this.Phase = 'ready';
	}
});