window.DeferredHeldChildLoads = (window.DeferredHeldChildLoads || 0) + 1;

Elemenx.Component('DeferredHeldChild', {
	Template: '<span class="deferred-held-child">{{value}}</span>',
	ElemenxOnCreate: function () {
		window.DeferredHeldChildCreates = (window.DeferredHeldChildCreates || 0) + 1;
	}
});