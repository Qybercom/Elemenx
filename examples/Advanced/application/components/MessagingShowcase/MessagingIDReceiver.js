Elemenx.Component('MessagingIDReceiver', {
	$Template: '<p><code>$Messaging: \'advanced:id\'</code> — received: <b>{{MessageValue}}</b></p>',
	$Messaging: 'advanced:id',
	MessageValue: 'nothing received',

	$OnMessage: function (message) {
		if (message.Is('advanced:id'))
			this.MessageValue = message.Data;
	}
});