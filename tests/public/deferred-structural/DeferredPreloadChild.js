window.DeferredPreloadChildLoads = (window.DeferredPreloadChildLoads || 0) + 1;

Elemenx.Component('DeferredPreloadChild', {
	$Template: '<span class="deferred-preload-child">{{name}}</span>'
});