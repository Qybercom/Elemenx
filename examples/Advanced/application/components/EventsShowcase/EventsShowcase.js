Elemenx.Component('EventsShowcase', {
	$TemplateURL: 'EventsShowcase.html',
	$Events: ['advanced:events', 'advanced:telemetry', 'advanced:debouncer', 'advanced:filter', 'advanced:gate'],
	EventValue: 'nothing received',
	EventCount: 0,
	DebouncerSample: 'A',
	DebouncerValue: 'waiting',
	FilterValue: 'waiting',
	GateValue: 'waiting',

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
		event.Is('advanced:debouncer', [
			{Debouncer: 3}
		], function (matched) {
			self.DebouncerValue = String(matched.Data);
		});
		event.Is('advanced:filter', [
			{Filter: 5}
		], function (matched) {
			self.FilterValue = String(matched.Data);
		});
		event.Is('advanced:gate', [
			{Gate: 300}
		], function () {
			self.GateValue = 'passed';
		});
	},

	EmitEvent: function () { this.$Events().Emit('advanced:events', 'local event').Destroy(); },
	EmitTelemetry: function () { this.$Events().Emit('advanced:telemetry', 'telemetry event').Destroy(); },
	EmitDebouncerSample: function () {
		var events = this.$Events();

		events.Emit('advanced:debouncer', this.DebouncerSample);
		events.Destroy();
	},
	EmitDebouncedSignal: function () {
		var events = this.$Events();

		events.Emit('advanced:debouncer', 'A');
		events.Emit('advanced:debouncer', 'B');
		events.Emit('advanced:debouncer', 'B');
		events.Emit('advanced:debouncer', 'B');
		events.Destroy();
	},
	RunFilter: function () {
		var events = this.$Events();

		events.Emit('advanced:filter', 'A');
		events.Emit('advanced:filter', 'B');
		events.Emit('advanced:filter', 'A');
		events.Emit('advanced:filter', 'A');
		events.Emit('advanced:filter', 'B');
		events.Destroy();
	},
	RunGatePass: function () {
		this.GateValue = 'waiting 300 ms';

		this.$Events().Emit('advanced:gate', true).Destroy();
	},
	RunGateCancel: function () {
		var self = this;
		var events = this.$Events();

		this.GateValue = 'waiting 300 ms';

		events.Emit('advanced:gate', true);

		setTimeout(function () {
			events.Emit('advanced:gate', false);
			events.Destroy();

			self.GateValue = 'cancelled';
		}, 100);
	}
});