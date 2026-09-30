Elemenx.Component('DeferredConcurrentParent', {
	$Template: '<div><DeferredConcurrentChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredConcurrentChild></div>',
	$OnCreate: function (data) {
		this.items = data.items || [];
	}
});