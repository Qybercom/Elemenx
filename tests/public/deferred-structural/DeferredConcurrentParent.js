Elemenx.Component('DeferredConcurrentParent', {
	Template: '<div><DeferredConcurrentChild data-for="item of items" data-key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredConcurrentChild></div>',
	ElemenxOnCreate: function (data) {
		this.State.items = data.items || [];
	}
});