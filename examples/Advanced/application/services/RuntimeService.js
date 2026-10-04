Elemenx.Service('RuntimeService', {
	Phase: 'definition',

	$OnCreate: function () {
		this.Phase = 'created';
	},

	Snapshot: function () {
		return {
			Generation: this.$Generation(),
			StartedAt: this.$StartedAt(),
			Phase: this.Phase
		};
	},

	$OnDestroy: function () {
		this.Phase = 'destroyed';
	}
});