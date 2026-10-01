Elemenx.Component('MessagingShowcase', {
	$TemplateURL: 'MessagingShowcase.html',
	MessageValue: 'nothing received',
	MessageChannels: 'not connected',
	MessageCount: 0,
	StorageHandler: 'attached',
	StorageHandlerAction: 'Detach',
	_MessageSender: null,
	_MessageReceiver: null,
	_MessageHandler: null,


	$OnCreate: function () {
		var app = this.$Application();
		app.$Messaging('AdvancedMessagingBase', {Channels: ['advanced:events']});
		app.$Messaging('AdvancedMessagingShowcase', {Contexts: 'AdvancedMessagingBase', Channels: ['advanced:storage']});
		this.ConnectMessaging();
	},

	ConnectMessaging: function () {
		var self = this;

		this._MessageSender = this.$Messaging();
		this._MessageReceiver = this.$Messaging('AdvancedMessagingShowcase').ID('advanced:receiver');
		this._MessageHandler = function (event) {
			self.MessageCount++;
			self.MessageValue = event.Channel + ': ' + event.Data;
		};

		this._MessageReceiver.On('advanced:events', this._MessageHandler);
		this._MessageReceiver.On('advanced:storage', this._MessageHandler);
		this._MessageReceiver.On(this._MessageHandler);
		this.MessageChannels = this._MessageReceiver.Channels().join(', ');
	},

	SendContextMessage: function () {
		this._MessageSender.Send('advanced:events', 'context message');
	},

	SendStorageMessage: function () {
		this._MessageSender.Send('advanced:storage', 'storage message');
	},

	SendDirectMessage: function () {
		this._MessageSender.Send('advanced:receiver', 'direct message');
	},

	ToggleStorageHandler: function () {
		if (this.StorageHandler === 'attached') {
			this._MessageReceiver.Off('advanced:storage', this._MessageHandler);
			this.StorageHandler = 'detached';
			this.StorageHandlerAction = 'Attach';
		}
		else {
			this._MessageReceiver.On('advanced:storage', this._MessageHandler);
			this.StorageHandler = 'attached';
			this.StorageHandlerAction = 'Detach';
		}

		this.MessageChannels = this._MessageReceiver.Channels().join(', ');
	}
});