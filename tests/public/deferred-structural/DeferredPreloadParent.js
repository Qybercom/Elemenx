Elemenx.Component('DeferredPreloadParent', {
	Template: '<div><DeferredPreloadChild data-each="items" data-key="id"></DeferredPreloadChild></div>',
	ElemenxOnCreate: function () {
		this.State.items = [
			{id: 1, name: 'A'},
			{id: 2, name: 'B'}
		];
	}
});