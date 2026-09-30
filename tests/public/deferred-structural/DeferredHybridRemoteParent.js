window.DeferredHybridRemoteParentLoads = (window.DeferredHybridRemoteParentLoads || 0) + 1;

Elemenx.Component('DeferredHybridRemoteParent', {
	$Template: '<section class="deferred-hybrid-remote-parent"><DeferredHybridBundledChild value="{{value}}"></DeferredHybridBundledChild></section>'
});