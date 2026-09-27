Elemenx.Directive('tooltip', {
	ElemenxOnCreate: function (context) {
		context.Data.PreviousTitle = context.Element.title;
	},

	ElemenxOnUpdate: function (context) {
		context.Element.title = context.Value || '';
	},

	ElemenxOnDestroy: function (context) {
		context.Element.title = context.Data.PreviousTitle;
	}
});