Elemenx.Component('MessagingChannelsReceiver', {
	$Template: '<p><code>$Messaging: [\'advanced:foo\', \'advanced:bar\']</code> — received: <b>{{MessageValue}}</b></p>',
	$Messaging: ['advanced:foo', 'advanced:bar'],
	MessageValue: 'nothing received',

	$OnMessage: function (message) {
		if (message.Is('advanced:foo') || message.Is('advanced:bar'))
			this.MessageValue = message.Channel + ': ' + message.Data;
	}
});