Elemenx.Component('EventsShowcase', {
	$TemplateURL: 'EventsShowcase.html',
	$Events: ['advanced:events', 'advanced:telemetry', 'advanced:signal'],
	EventValue: 'nothing received',
	EventCount: 0,
	DebouncerSample: 'A',

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
		event.Is('advanced:signal', [
			{Debouncer: 3}
		], function (matched) {
			console.log(matched);
			self.EventCount++;
			self.EventValue = 'debounced signal: ' + matched.Data;
		});
	},

	EmitEvent: function () { this.$Events().Emit('advanced:events', 'local event').Destroy(); },
	EmitTelemetry: function () { this.$Events().Emit('advanced:telemetry', 'telemetry event').Destroy(); },
	EmitDebouncerSample: function () {
		var events = this.$Events();
		events.Emit('advanced:signal', this.DebouncerSample);
		events.Destroy();
	},

	EmitDebouncedSignal: function () {
		var events = this.$Events();
		events.Emit('advanced:signal', 'A');
		events.Emit('advanced:signal', 'B');
		events.Emit('advanced:signal', 'B');
		events.Emit('advanced:signal', 'B');
		events.Destroy();
	}
});