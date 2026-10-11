window.DeferredInputChildLoads = (window.DeferredInputChildLoads || 0) + 1;

Elemenx.Component('DeferredInputChild', {
	$Template: '<div class="deferred-input-child"><span class="deferred-input-label">{{Label}}</span><button class="deferred-input-ping" (click)="Ping">ping</button></div>',
	Label: '',

	Ping: function () {
		this.$Emit('ping', this.Label);
	}
});