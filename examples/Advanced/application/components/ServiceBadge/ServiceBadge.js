Elemenx.Component('ServiceBadge', {
	TemplateURL: 'ServiceBadge.html',

	Toggle: function () {
		this.State.online = !this.State.online;
	}
});