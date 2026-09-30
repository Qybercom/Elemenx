window.DeferredConcurrentChildLoads = (window.DeferredConcurrentChildLoads || 0) + 1;

Elemenx.Component('DeferredConcurrentChild', {
	$Template: '<span class="deferred-concurrent-child">{{name}}<DeferredConcurrentGrand value="{{name}}"></DeferredConcurrentGrand></span>'
});