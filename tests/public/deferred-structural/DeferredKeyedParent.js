Elemenx.Component('DeferredKeyedParent', {
	Template: '<section><div *if="show"><DeferredKeyedChild *for="item of items" *key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredKeyedChild></div></section>',ElemenxOnCreate:function (data) {this.State.show = true;
		this.State.items = data.items || [];
	}
});