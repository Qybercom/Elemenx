window.DeferredPendingChildLoads = (window.DeferredPendingChildLoads || 0) + 1;

Elemenx.Component('DeferredPendingChild', {
	Template: '<span class="deferred-pending-child">{{value}}</span>',
	ElemenxOnCreate: function () {
		window.DeferredPendingChildCreates = (window.DeferredPendingChildCreates || 0) + 1;
	}
});