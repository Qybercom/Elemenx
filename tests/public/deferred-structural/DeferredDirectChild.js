window.DeferredDirectChildLoads = (window.DeferredDirectChildLoads || 0) + 1;

Elemenx.Component('DeferredDirectChild', {
	Template: '<span class="deferred-direct-child">{{name}}</span>'
});