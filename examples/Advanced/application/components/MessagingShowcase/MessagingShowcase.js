Elemenx.Component('MessagingShowcase', {
	$TemplateURL: 'MessagingShowcase.html',
	_MessageSender: null,
	_WindowBridge: null,
	WindowMessage: 'waiting for iframe',

	$OnCreate: function () {
		var component = this;
		this._MessageSender = this.$Messaging();
		this._MessageSender.On('advanced:window-reply', function (message) {
			component.WindowMessage = message.Data;
		});
	},

	$OnComponentReady: function () {
		this._WindowBridge = this.$Messaging.Window('MessagingFrame');
	},

	SendWindowMessage: function () {
		this._MessageSender.Send('advanced:window', 'hello iframe');
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


	RunMessageDebouncer: function () {
		this._MessageSender.Send('advanced:message-debouncer', 'A').Send('advanced:message-debouncer', 'A').Send('advanced:message-debouncer', 'A');
	},

	RunMessageFilter: function () {
		this._MessageSender.Send('advanced:message-filter', 'A').Send('advanced:message-filter', 'B').Send('advanced:message-filter', 'A').Send('advanced:message-filter', 'A').Send('advanced:message-filter', 'B');
	},

	RunMessageGate: function () {
		this._MessageSender.Send('advanced:message-gate', true);
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