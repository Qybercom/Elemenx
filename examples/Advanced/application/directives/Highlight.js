Elemenx.Directive('highlight', {
	$OnCreate: function (context) {
		context.Data.ClassName = 'directive-highlighted';
	},

	$OnUpdate: function (context) {
		context.Element.classList.toggle(context.Data.ClassName, !!context.Value);
	},

	$OnDestroy: function (context) {
		context.Element.classList.remove(context.Data.ClassName);
	}
});