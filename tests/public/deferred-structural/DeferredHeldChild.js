window.DeferredHeldChildLoads = (window.DeferredHeldChildLoads || 0) + 1;

Elemenx.Component('DeferredHeldChild', {
	$Template: '<span class="deferred-held-child">{{value}}</span>',
	$OnCreate: function () {
		window.DeferredHeldChildCreates = (window.DeferredHeldChildCreates || 0) + 1;
	}
});