Elemenx.Component('MessagingPipesReceiver', {
	$Template: '<div class="messaging-pipes"><p><code>Message.Is(channel, pipes, handler)</code></p><p>Debouncer: <b>{{DebouncerValue}}</b> · Filter: <b>{{FilterValue}}</b> · Gate: <b>{{GateValue}}</b></p></div>',
	$Messaging: ['advanced:message-debouncer', 'advanced:message-filter', 'advanced:message-gate'],
	DebouncerValue: 'waiting',
	FilterValue: 'waiting',
	GateValue: 'waiting',

	$OnMessage: function (message) {
		var self = this;

		message.Is('advanced:message-debouncer', {Debouncer: 3}, function (output) {
			self.DebouncerValue = output.Data;
		});
		message.Is('advanced:message-filter', {Filter: 5}, function (output) {
			self.FilterValue = output.Data;
		});
		message.Is('advanced:message-gate', {Gate: 300}, function () {
			self.GateValue = 'passed';
		});
	}
});