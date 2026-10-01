Elemenx.Component('EventsShowcase', {
	$TemplateURL: 'EventsShowcase.html',
	$Events: ['advanced:events', 'advanced:telemetry'],
	EventValue: 'nothing received',
	EventCount: 0,

	$OnEvent: function (event) {
		var self = this;
		event.Is('advanced:events', function (matched) {
			self.EventCount++;
			self.EventValue = matched.Channel + ': ' + matched.Data;
		});
		event.Is('advanced:telemetry', function (matched) {
			self.EventCount++;
			self.EventValue = matched.Channel + ': ' + matched.Data;
		});
	},

	EmitEvent: function () { this.$Events().Emit('advanced:events', 'local event').Destroy(); },
	EmitTelemetry: function () { this.$Events().Emit('advanced:telemetry', 'telemetry event').Destroy(); }
});