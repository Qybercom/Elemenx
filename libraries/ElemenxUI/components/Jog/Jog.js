/*
 * The jog wheel of a DJ: a platter with a record on it that turns as the track plays (Playing, at Rpm turns a minute:
 * 33.3 by default), its marker where Time is (a turn is 60 / Rpm seconds). A hand on the record holds it and scratches:
 * touch (true, then false when it lets go) and scratch ({Delta, Time}: the seconds the record was turned, forward
 * positive) while it turns it. The ring around it bends the pitch: a drag on it, or the wheel, emits nudge ({Delta}, from
 * -1 to 1 for a quarter turn). Keys: the arrows nudge, with Shift they scratch by a twentieth of a turn. Title and
 * Subtitle are written on the label of the record; Size is its width in pixels. The track is the application's: Time
 * follows it, and the platter turns between its updates by itself while Playing.
 */
Elemenx.Component('Jog', {
	$TemplateURL: 'Jog.html',
	$StyleURL: 'Jog.css',
	$Meta: {
		Group: 'music',
		Icon: 'play',
		Description: 'The jog wheel of a DJ: a platter that turns as the track plays, scratched by a hand on the record, its ring bending the pitch.',
		Events: {
			touch: 'A hand on the record (true) or off it (false).',
			scratch: 'The record was turned by hand: {Delta (seconds, forward positive), Time}.',
			nudge: 'The ring was turned: {Delta}, from -1 to 1 for a quarter turn.'
		},
		Props: {
			Time: 'The place of the track in seconds: where the marker is.',
			Playing: 'The track plays: the platter turns.',
			Rpm: 'The turns a minute of the record (33.3).',
			Title: 'The first line of the label of the record.',
			Subtitle: 'The second line of the label.',
			Size: 'Its width in pixels (220).',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Label: 'Its name for screen readers.'
		},
		Sample: {Title: 'Deck A', Subtitle: '128 BPM', Time: 12}
	},
	Time: 0,
	Playing: false,
	Rpm: 33.3,
	Title: '',
	Subtitle: '',
	Size: 220,
	Disabled: false,
	Label: '',
	Touched: false,
	Grooves: [80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36],

	$OnCreate: function () {
		/* What renders nothing: the hand, the frame, the angle drawn and when Time last came. */
		var own = {Drag: null, Frame: 0, Angle: 0, Base: 0, At: 0};

		this.Own = function () {
			return own;
		};
	},

	$OnReady: function () {
		this.Sync();
	},

	$OnProps: function () {
		this.Sync();
	},

	$OnDestroy: function () {
		var own = this.Own();
		if (own.Frame)
			window.cancelAnimationFrame(own.Frame);

		own.Frame = 0;
	},

	Round: function (value) {
		return Math.round((Number(value) || 0) * 10) / 10;
	},

	/* The seconds of a turn of the record. */
	Turn: function () {
		return 60 / Math.max(1, Number(this.Rpm) || 33.3);
	},

	/* The angle of the platter, in degrees: where Time is, and on since it came while Playing. */
	Angle: function () {
		var own = this.Own();
		var time = own.Base;

		if (this.IsPlaying() && !own.Drag)
			time += (Date.now() - own.At) / 1000;

		return time / this.Turn() * 360;
	},

	IsPlaying: function () {
		return this.Playing === true || this.Playing === 'true';
	},

	/* Time came: the platter goes there, and turns by itself while it plays. */
	Sync: function () {
		var self = this;
		var own = this.Own();

		own.Base = Number(this.Time) || 0;
		own.At = Date.now();

		this.Paint();

		if (this.IsPlaying() && !own.Frame) {
			var frame = function () {
				own.Frame = 0;

				if (!self.IsPlaying()) return;

				self.Paint();

				own.Frame = window.requestAnimationFrame(frame);
			};

			own.Frame = window.requestAnimationFrame(frame);
		}
	},

	/* The platter turned to its angle: a style of its element, not a render. */
	Paint: function () {
		var element = this.$Element();
		var platter = element && element.querySelector ? element.querySelector('.elemenx-jog-platter') : null;
		var angle = this.Angle() % 360;

		this.Own().Angle = angle;

		if (platter)
			platter.style.transform = 'rotate(' + this.Round(angle) + 'deg)';
	},

	/* The angle of a point of the screen around the center, in degrees, and its distance to it from 0 to 1 (the edge). */
	Polar: function (event) {
		var rect = this.$Element().getBoundingClientRect();
		var x = event.clientX - rect.left - rect.width / 2;
		var y = event.clientY - rect.top - rect.height / 2;

		return {Angle: Math.atan2(y, x) * 180 / Math.PI, Distance: Math.sqrt(x * x + y * y) / (rect.width / 2)};
	},

	Down: function (event) {
		var at;

		if (this.Disabled || (event.button !== undefined && event.button !== 0)) return;

		at = this.Polar(event);

		if (at.Distance > 1) return;

		/* The record stops under the hand where it is; the ring is past 0.88 of the radius, the record inside it. */
		if (at.Distance <= 0.88) {
			this.Own().Base = this.Angle() / 360 * this.Turn();
			this.Own().At = Date.now();
		}

		this.Own().Drag = {Angle: at.Angle, Ring: at.Distance > 0.88};

		try {
			this.$Element().setPointerCapture(event.pointerId);
		}
		catch (error) {
			/* A pointer the browser does not know (made by a script): the drag works without the capture. */
		}

		if (!this.Own().Drag.Ring) {
			this.Touched = true;

			this.$Emit('touch', true);
		}
	},

	Move: function (event) {
		var own = this.Own();
		var drag = own.Drag;
		var at;
		var delta;

		if (!drag) return;

		at = this.Polar(event);
		delta = at.Angle - drag.Angle;

		/* The shortest way round: a turn past the left side is not a whole turn back. */
		if (delta > 180)
			delta -= 360;

		if (delta < -180)
			delta += 360;

		drag.Angle = at.Angle;

		if (!delta) return;

		if (drag.Ring) {
			this.$Emit('nudge', {Delta: Math.max(-1, Math.min(1, delta / 90))});

			return;
		}

		own.Base += delta / 360 * this.Turn();
		own.At = Date.now();

		this.Paint();

		this.$Emit('scratch', {Delta: delta / 360 * this.Turn(), Time: own.Base});
	},

	Up: function () {
		var own = this.Own();
		var drag = own.Drag;
		if (!drag) return;

		own.Drag = null;
		own.At = Date.now();

		if (!drag.Ring) {
			this.Touched = false;

			this.$Emit('touch', false);
		}
	},

	Wheel: function (event) {
		var delta = event.deltaY || event.deltaX;
		if (this.Disabled || !delta) return;

		event.preventDefault();

		this.$Emit('nudge', {Delta: Math.max(-1, Math.min(1, -delta / 400))});
	},

	Key: function (event) {
		var step = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
		var own = this.Own();

		if (this.Disabled || !step) return;

		event.preventDefault();

		if (event.shiftKey) {
			own.Base = this.Angle() / 360 * this.Turn() + step * this.Turn() / 20;
			own.At = Date.now();

			this.Paint();

			this.$Emit('scratch', {Delta: step * this.Turn() / 20, Time: own.Base});

			return;
		}

		this.$Emit('nudge', {Delta: step * 0.1});
	}
});
