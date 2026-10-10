Elemenx.Messaging.Context('AdvancedMessagingBase', {
	ID: 'advanced:shared',
	Channels: ['advanced:events']
});

Elemenx.Messaging.Context('AdvancedMessagingShowcase', {
	Contexts: 'AdvancedMessagingBase',
	Channels: ['advanced:storage']
});

Elemenx.Component('MessagingContextReceiver', {
	$Template: '<p><code>$Messaging: {Context, Channels}</code> — received: <b>{{MessageValue}}</b></p>',
	$Messaging: {
		Context: 'AdvancedMessagingShowcase',
		Channels: ['advanced:local']
	},
	MessageValue: 'nothing received',

	$OnMessage: function (message) {
		if (message.Is('advanced:shared')) this.MessageValue = 'shared ID: ' + message.Data;
		else if (message.Is('advanced:events')) this.MessageValue = 'context: ' + message.Data;
		else if (message.Is('advanced:storage')) this.MessageValue = 'context storage: ' + message.Data;
		else if (message.Is('advanced:local')) this.MessageValue = 'local: ' + message.Data;
	}
});