window.DeferredKeyedChildLoads = (window.DeferredKeyedChildLoads || 0) + 1;

Elemenx.Component('DeferredKeyedChild', {
	Template: '<button class="deferred-keyed-child">{{name}}</button>'
});