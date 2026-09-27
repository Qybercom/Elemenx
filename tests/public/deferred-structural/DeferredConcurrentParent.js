Elemenx.Component('DeferredConcurrentParent', {
	Template: '<div><DeferredConcurrentChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredConcurrentChild></div>',
	ElemenxOnCreate: function (data) {
		this.State.items = data.items || [];
	}
});