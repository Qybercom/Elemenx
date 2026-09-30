Elemenx.Component('ComponentProbe', {
	$TemplateID: 'AdvancedComponentProbeTemplate',

	Label: 'Probe',
	Count: 0,
	Phase: 'definition',

	$OnCreate: function () {
		this.Phase = 'created';
	},

	$OnReady: function () {
		this.Phase = 'ready';
	},

	Increment: function () {
		this.Count++;
		this.$Emit('change', this.Count);
	},

	DescribeOwner: function () {
		var parent = this.$Parent();
		var application = this.$Application();

		return {
			Parent: parent ? 'ComponentShowcase' : 'none',
			Application: application ? application.$Name() : 'none',
			Generation: this.$Generation()
		};
	},

	$OnDestroy: function () {
		this.$Emit('lifecycle', 'Destroy');
	}
});