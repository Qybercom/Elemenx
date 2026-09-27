Elemenx.Component('DeferredPreloadParent', {
	Template: '<div><DeferredPreloadChild data-for="item of items" data-key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredPreloadChild></div>',
	ElemenxOnCreate: function () {
		this.State.items = [
			{id: 1, name: 'A'},
			{id: 2, name: 'B'}
		];
	}
});