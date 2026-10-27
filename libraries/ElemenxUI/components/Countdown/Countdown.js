/*
 * The time left: to a moment (To: a date, a text of a date or a timestamp) or of a length (Duration, in seconds, that
 * Running counts down and a pause keeps). It shows days, hours, minutes and seconds (Units: auto drops the days and
 * the hours while they are 0; dhms, hms or ms keep them), each with its label under it, or one line with Compact. It
 * emits end once at 0. Methods: Start(), Pause(), Reset(). It counts by the clock of the page, so a tab in the
 * background and a sleep (Cache) show the right time when they come back.
 */
Elemenx.Component('Countdown', {
	$TemplateURL: 'Countdown.html',
	$StyleURL: 'Countdown.css',
	$Meta: {
		Group: 'display',
		Icon: 'clock',
		Description: 'The time left: to a moment (To) or of a length (Duration, in seconds).',
		Events: {
			end: 'The time ran out.'
		},
		Props: {
			To: 'The moment it counts to: a date, a text of a date or a timestamp.',
			Duration: 'A length in seconds to count down, without To.',
			Running: 'Counts while true; false pauses a Duration.',
			Units: {Options: ['auto', 'dhms', 'hms', 'ms'], Description: 'The units it shows: auto drops the leading ones while they are 0.'},
			Compact: 'One line (01:02:03) instead of numbers with labels.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Label: 'The name of the countdown for screen readers.'
		},
		Sample: {Duration: 90}
	},
	To: '',
	Duration: 0,
	Running: true,
	Units: 'auto',
	Compact: false,
	Size: 'medium',
	Label: '',
	Left: 0,

	$OnCreate: function () {
		var self = this;
		var own = {Timer: 0, End: 0, Paused: 0, Ended: false};

		this.Own = function () {
			return own;
		};

		/* The parts shown for a time left in milliseconds: [{Value, Unit}], the first without a leading zero. */
		this.Parts = function (left, units) {
			var seconds = Math.ceil(Math.max(0, left) / 1000);
			var all = {d: Math.floor(seconds / 86400), h: Math.floor(seconds % 86400 / 3600), m: Math.floor(seconds % 3600 / 60), s: seconds % 60};
			var order = String(units === 'auto' || !units ? (all.d ? 'dhms' : all.h ? 'hms' : 'ms') : units).split('');
			/* A unit that is not shown adds to the next one: 2 days are 48 hours with hms. */
			if (order.indexOf('d') === -1)
				all.h += all.d * 24;

			if (order.indexOf('h') === -1)
				all.m += all.h * 60;

			return order.map(function (unit, index) {
				var value = all[unit];

				return {Unit: unit, Value: index === 0 ? String(value) : (value < 10 ? '0' : '') + value};
			});
		};

		this.Line = function (left, units) {
			return self.Parts(left, units).map(function (part) {
				return part.Value;
			}).join(':');
		};

		/* The key of the label of a unit: ui.countdown.days... */
		this.UnitKey = function (unit) {
			return {d: {Key: 'ui.countdown.days'}, h: {Key: 'ui.countdown.hours'}, m: {Key: 'ui.countdown.minutes'}, s: {Key: 'ui.countdown.seconds'}}[unit].Key;
		};
	},

	$OnReady: function () {
		this.Reset();
	},

	/* New To, Duration or Running from the tag. */
	$OnProps: function (changed) {
		if (changed.To !== undefined || changed.Duration !== undefined) {
			this.Reset();
		}
		else if (changed.Running !== undefined && this.Running && this.Running !== 'false') {
			this.Start();
		}
		else if (changed.Running !== undefined) {
			this.Pause();
		}
	},

	/* The moment of the end in the clock of the page, from To or from the Duration left. */
	Target: function () {
		var to = this.To;
		if (to !== '' && to !== null && to !== undefined)
			return to instanceof Date ? to.getTime() : typeof to === 'number' || /^\d+$/.test(String(to)) ? Number(to) : new Date(to).getTime();

		return Date.now() + Number(this.Duration || 0) * 1000;
	},

	Reset: function () {
		var own = this.Own();

		own.Ended = false;
		own.End = this.Target();
		own.Paused = 0;

		if (this.Running && this.Running !== 'false') {
			this.Start();
		}
		else {
			own.Paused = Math.max(0, own.End - Date.now());
			this.Left = own.Paused;

			this.Stop();
		}

		return this;
	},

	Start: function () {
		var self = this;
		var own = this.Own();

		if (own.Paused) {
			own.End = Date.now() + own.Paused;
			own.Paused = 0;
		}

		this.Stop();
		this.Tick();

		if (!own.Ended)
			own.Timer = window.setInterval(function () {
				self.Tick();
			}, 250);

		return this;
	},

	Pause: function () {
		var own = this.Own();
		if (!own.Timer) return this;

		own.Paused = Math.max(0, own.End - Date.now());

		this.Stop();

		return this;
	},

	Stop: function () {
		var own = this.Own();
		if (own.Timer)
			window.clearInterval(own.Timer);

		own.Timer = 0;
	},

	Tick: function () {
		var own = this.Own();
		var left = Math.max(0, own.End - Date.now());

		this.Left = left;

		if (left > 0 || own.Ended) return;

		own.Ended = true;

		this.Stop();
		this.$Emit('end');
	},

	$OnSleep: function () {
		this.Stop();
	},

	$OnWake: function () {
		if (this.Running && this.Running !== 'false' && !this.Own().Ended && !this.Own().Paused)
			this.Start();
	},

	$OnDestroy: function () {
		this.Stop();
	}
});
