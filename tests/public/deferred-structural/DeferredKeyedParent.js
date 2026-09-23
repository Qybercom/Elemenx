Elemenx.Component('DeferredKeyedParent', {
	Template: '<section><div data-if="show"><DeferredKeyedChild data-each="items" data-key="id"></DeferredKeyedChild></div></section>',ElemenxOnCreate:function (data) {this.State.show = true;
		this.State.items = data.items || [];
	}
});