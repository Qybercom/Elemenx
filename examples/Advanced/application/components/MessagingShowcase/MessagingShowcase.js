Elemenx.Component('MessagingShowcase', {
	$TemplateURL: 'MessagingShowcase.html',
	_MessageSender: null,

	$OnCreate: function () {
		this._MessageSender = this.$Messaging();
	},

	SendIDMessage: function () {
		this._MessageSender.Send('advanced:id', 'direct message');
	},

	SendFooMessage: function () {
		this._MessageSender.Send('advanced:foo', 'foo message');
	},

	SendBarMessage: function () {
		this._MessageSender.Send('advanced:bar', 'bar message');
	},

	SendContextMessage: function () {
		this._MessageSender.Send('advanced:events', 'context message');
	},

	SendStorageMessage: function () {
		this._MessageSender.Send('advanced:storage', 'storage message');
	},

	SendLocalMessage: function () {
		this._MessageSender.Send('advanced:local', 'local message');
	},

	SendSharedIDMessage: function () {
		this._MessageSender.Send('advanced:shared', 'shared ID message');
	}
});