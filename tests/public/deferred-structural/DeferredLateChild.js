Elemenx.Component('DeferredLateChild', {
	$Template: '<div class="deferred-late-child"><span class="deferred-late-label">{{Label}}</span><span class="deferred-late-node">{{Node ? Node.tagName : "none"}}</span></div>',
	Label: '',
	Node: null,

	$OnReady: function () {
		window.DeferredLateReady = {Label: this.Label, Node: this.Node ? this.Node.tagName : null};
	},

	$OnProps: function (changed) {
		window.DeferredLateHeard.push(Object.keys(changed));
	}
});
