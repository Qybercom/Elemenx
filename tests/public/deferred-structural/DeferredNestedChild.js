window.DeferredNestedChildLoads = (window.DeferredNestedChildLoads || 0) + 1;

Elemenx.Component('DeferredNestedChild', {
	Template: '<div class="deferred-nested-child"><DeferredNestedGrand value="{{value}}"></DeferredNestedGrand></div>'
});