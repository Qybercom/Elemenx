Elemenx.Component('DeferredConcurrentParent', {
	Template: '<div><DeferredConcurrentChild data-each="items" data-key="id"></DeferredConcurrentChild></div>',
	ElemenxOnCreate: function (data) {
		this.State.items = data.items || [];
	}
});