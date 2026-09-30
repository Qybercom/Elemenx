Elemenx.Component('DeferredPreloadParent', {
	$Template: '<div><DeferredPreloadChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredPreloadChild></div>',
	$OnCreate: function () {
		this.items = [
			{id: 1, name: 'A'},
			{id: 2, name: 'B'}
		];
	}
});