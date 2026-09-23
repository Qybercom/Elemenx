window.DeferredFinalHeldChildLoads = (window.DeferredFinalHeldChildLoads || 0) + 1;

Elemenx.Component('DeferredFinalHeldChild', {
	Template: '<span class="deferred-final-held-child">{{value}}</span>',
	ElemenxOnCreate: function () {
		window.DeferredFinalHeldChildCreates = (window.DeferredFinalHeldChildCreates || 0) + 1;
	}
});