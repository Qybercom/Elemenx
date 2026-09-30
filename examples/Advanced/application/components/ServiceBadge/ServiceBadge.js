Elemenx.Component('ServiceBadge', {
	$TemplateURL: 'ServiceBadge.html',

	BadgeClasses: ['binding-demo'],
	BadgeStyle: {
		'--binding-kind': 'service',
		'border-radius': '6px'
	},

	Toggle: function () {
		this.online = !this.online;
	}
});