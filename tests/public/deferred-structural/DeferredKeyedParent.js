Elemenx.Component('DeferredKeyedParent', {
	Template: '<section><div data-if="show"><DeferredKeyedChild data-for="item of items" data-key="item.id" id="{{item.id}}" name="{{item.name}}"></DeferredKeyedChild></div></section>',ElemenxOnCreate:function (data) {this.State.show = true;
		this.State.items = data.items || [];
	}
});