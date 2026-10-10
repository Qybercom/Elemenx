Elemenx.Component('MessagingShowcase', {
	$TemplateURL: 'MessagingShowcase.html',
	_MessageSender: null,
	WindowMessage: 'waiting for iframe',
	ChildWindowMessage: 'not opened',
	CrossOriginMessage: 'not opened',
	TabMessage: 'open Dev and dist in separate tabs',
	RuntimeID: '',

	$OnCreate: function () {
		var component = this;
		var runtime = Elemenx.RuntimeID();

		this.RuntimeID = runtime;
		this._MessageSender = this.$Messaging();

		this._MessageSender.On('advanced:window-reply', function (message) {
			component.WindowMessage = message.Data;
		});
		this._MessageSender.On('advanced:child-reply', function (message) {
			component.ChildWindowMessage = message.Data;
		});
		this._MessageSender.On('advanced:cross-origin-ready', function (message) {
			component.CrossOriginMessage = message.Data;
		});
		this._MessageSender.On('advanced:cross-origin-reply', function (message) {
			component.CrossOriginMessage = message.Data;
		});
		this._MessageSender.On('advanced:tab-ping', function (message) {
			if (!message.Data || message.Data.Runtime === runtime) return;

			component.TabMessage = 'ping from ' + message.Data.Runtime;

			component._MessageSender.Send('advanced:tab-pong', {Runtime: runtime, Target: message.Data.Runtime});
		});
		this._MessageSender.On('advanced:tab-pong', function (message) {
			if (!message.Data || message.Data.Target !== runtime) return;

			component.TabMessage = 'pong from ' + message.Data.Runtime;
		});
	},

	SendWindowMessage: function () {
		this._MessageSender.Send('advanced:window', 'hello iframe');
	},

	OpenChildWindow: function () {
		window.open('/data/messaging-window.html', 'ElemenxMessagingChild', 'width=520,height=260');

		this.ChildWindowMessage = 'child opened; transport is automatic';
	},

	SendChildWindowMessage: function () {
		this._MessageSender.Send('advanced:child', 'hello child window');
	},

	OpenCrossOriginWindow: function () {
		var host = location.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
		var origin = location.protocol + '//' + host + (location.port ? ':' + location.port : '');

		Elemenx.Messaging.Origins(origin);

		window.open(origin + '/data/messaging-cross-origin.html?origin=' + encodeURIComponent(location.origin), 'ElemenxMessagingCrossOrigin', 'width=520,height=280');

		this.CrossOriginMessage = 'cross-origin child opened; mutual trust configured';
	},

	SendCrossOriginMessage: function () {
		this._MessageSender.Send('advanced:cross-origin', 'hello cross-origin window');
	},

	OpenIndependentTab: function () {
		window.open(location.href, '_blank', 'noopener');
	},

	PingTabs: function () {
		this.TabMessage = 'waiting for another same-origin tab';

		this._MessageSender.Send('advanced:tab-ping', {Runtime: Elemenx.RuntimeID()});
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