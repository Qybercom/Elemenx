Elemenx.Component('ServiceBadge', {
	TemplateURL: 'ServiceBadge.html',

	State: {
		BadgeClasses: ['binding-demo'],
		BadgeStyle: {
			'--binding-kind': 'service',
			'border-radius': '6px'
		}
	},

	Toggle: function () {
		this.State.online = !this.State.online;
	}
});