Elemenx.Component('RouterShowcase', {
	$TemplateURL: 'RouterShowcase.html',

	OpenLab: function () {
		this.$Application().$Router().Go('/router/1?mode=push#start');
	},

	OpenAsyncGuard: function () {
		this.$Application().$Router().Go('/async-guard');
	},

	OpenLeaveGuard: function () {
		this.$Application().$Router().Go('/leave-guard');
	}
});