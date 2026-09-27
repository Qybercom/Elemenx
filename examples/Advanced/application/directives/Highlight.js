Elemenx.Directive('highlight', {
	ElemenxOnCreate: function (context) {
		context.Data.ClassName = 'directive-highlighted';
	},

	ElemenxOnUpdate: function (context) {
		context.Element.classList.toggle(context.Data.ClassName, !!context.Value);
	},

	ElemenxOnDestroy: function (context) {
		context.Element.classList.remove(context.Data.ClassName);
	}
});