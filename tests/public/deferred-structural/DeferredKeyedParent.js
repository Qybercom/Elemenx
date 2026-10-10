Elemenx.Component('DeferredKeyedParent', {
	$Template: '<section><div *if="show"><DeferredKeyedChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredKeyedChild></div></section>', $OnCreate: function (data) {
		this.show = true;
		this.items = data.items || [];
	}
});