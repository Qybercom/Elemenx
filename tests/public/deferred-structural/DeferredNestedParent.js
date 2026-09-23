window.DeferredNestedParentLoads = (window.DeferredNestedParentLoads || 0) + 1;

Elemenx.Component('DeferredNestedParent', {
	Template: '<section class="deferred-nested-parent"><DeferredNestedChild value="{{value}}"></DeferredNestedChild></section>'
});