/*
 * A gamepad on the screen for the fingers: a stick, buttons and the triggers of a game over what is under it (a
 * Scene, in its slot hud). It is a pad of the InputDevices Service (Virtual): a Scene and every listener of pads take
 * it as a real one (its stick walks and steers as far as it leans, A jumps...). Buttons: the ones it shows (a, b, x, y,
 * lb, rb, lt, rt, start, select, and up, down, left, right of its cross, dpad for all four: a list or a text with commas); Right: a second stick, to look round; Show: auto (where
 * the screen is touched, a phone), always or never; Tilt: the left stick across follows the lean of the device as a
 * wheel (InputDevices.Tilt), asked for at the first touch; Navigate: its buttons also move the focus of the page and press its
 * controls, as a real pad does (false: a game only). Size of its stick in pixels. DeadZone: the part of a lean round the
 * middle that gives nothing (0.12), the rest from 0 to 1; LookCurve: the power of the lean of the right stick (2: fine
 * near the middle to aim, fast at the rim). Floating: a stick comes where a finger touches its half of the screen (its
 * lower part), and goes back as the finger lifts. A finger the page takes away (the capture lost) lets its stick go.
 * Event button ({Button, Down}).
 */
Elemenx.Component('VirtualGamepad', {
	$TemplateURL: 'VirtualGamepad.html',
	$StyleURL: 'VirtualGamepad.css',
	$Meta: {
		Group: 'game',
		Icon: 'gamepad',
		Description: 'A gamepad on the screen for the fingers: a stick, buttons and triggers; a pad of the Gamepad Service as a real one.',
		Events: {
			button: 'A button went down or up: {Button, Down}.'
		},
		Props: {
			Buttons: 'The buttons it shows: a, b, x, y, lb, rb, lt, rt, start, select; up, down, left, right of its cross (dpad: all four), above the left stick (a list, or a text with commas).',
			Right: 'A second stick, at the right, to look round.',
			Show: {Options: ['auto', 'always', 'never'], Description: 'auto: where the screen is touched; always; never.'},
			Tilt: 'The left stick across follows the lean of the device as a wheel.',
			Navigate: 'Its buttons also move the focus and press the controls of the page, as a real pad does.',
			Size: 'The size of a stick, in pixels.',
			DeadZone: 'The part of a lean round the middle that gives nothing (0 to 1).',
			LookCurve: 'The power of the lean of the right stick: 1 even, 2 fine near the middle.',
			Floating: 'A stick comes where a finger touches its half of the screen.',
			Label: 'The name of the pad for screen readers.'
		},
		Sample: {Show: 'always', Buttons: 'a,b,x,y'}
	},
	Buttons: ['a', 'b', 'x', 'y'],
	Right: false,
	Show: 'auto',
	Tilt: false,
	Navigate: false,
	Size: 120,
	DeadZone: 0.12,
	LookCurve: 2,
	Floating: false,
	Label: '',
	Knobs: {left: [0, 0], right: [0, 0]},
	/* Where a floating stick stands, moved from its place (px). */
	Moved: {left: [0, 0], right: [0, 0]},
	Down: {},

	$OnCreate: function () {
		var self = this;

		this.Touches = {};

		/*
		 * The buttons shown, by their group: the face ones, the shoulders of the left and of the right (and both), the middle
		 * ones. Regression: the first two shoulders went left whatever they were, a lone rb on the left over what was there.
		 */
		this.Listed = function (buttons, group) {
			var list = typeof buttons === 'string' ? buttons.split(',') : buttons || [];
			var groups = {face: ['y', 'x', 'b', 'a'], shoulder: ['lb', 'lt', 'rb', 'rt'], left: ['lb', 'lt'], right: ['rb', 'rt'], middle: ['select', 'start'], dpad: ['up', 'left', 'right', 'down']};
			var names = [];

			/* dpad: the four of the cross. */
			list.forEach(function (each) {
				var name = String(each).trim().toLowerCase();

				names = names.concat(name === 'dpad' ? groups.dpad : [name]);
			});

			return groups[group].filter(function (name) {
				return names.indexOf(name) !== -1;
			});
		};

		this.Shown = function (show) {
			if (show === 'never') return false;
			if (show === 'always') return true;

			return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
		};

		this.LabelOf = function (button) {
			return self.$Service('InputDevices').Label(button, 'xbox');
		};

		/* The lean of the device steers while the stick is not held. */
		this.Leaning = function () {
			var tilt;

			self.Frame = window.requestAnimationFrame(self.Leaning);

			if (!self.Tilt || self.Tilt === 'false' || self.Touches.left) return;

			tilt = self.$Service('InputDevices').Tilt();

			self.Pad.Stick('left', tilt.Steer, 0);

			self.Knobs = {left: [tilt.Steer, 0], right: self.Knobs.right};
		};
	},

	$OnReady: function () {
		this.Pad = this.$Service('InputDevices').Virtual('screen-' + Math.random().toString(36).slice(2, 8), {Navigate: this.Navigate === true || this.Navigate === 'true'});
		this.Frame = window.requestAnimationFrame(this.Leaning);
	},

	$OnDestroy: function () {
		window.cancelAnimationFrame(this.Frame);

		if (this.Pad)
			this.Pad.Destroy();

		if (this.Asked)
			this.$Service('InputDevices').StopMotion();
	},

	/* The lean of the device is asked for at the first touch: iOS asks only within a press. */
	Ask: function () {
		var input = this.$Service('InputDevices');

		if (!this.Tilt || this.Tilt === 'false' || this.Asked) return;

		this.Asked = true;

		input.RequestMotion(function (error, state) {
			if (state !== 'granted') return;

			input.StartMotion();

			window.setTimeout(function () {
				input.Center();
			}, 300);
		});
	},

	/* The lean a stick gives: nothing within the dead zone, the rest from 0 to 1; the right stick by its curve. */
	Lean: function (side, x, y) {
		var length = Math.sqrt(x * x + y * y);
		var dead = Math.max(0, Math.min(0.9, Number(this.DeadZone) || 0));
		var power = side === 'right' ? Math.max(1, Number(this.LookCurve) || 1) : 1;
		var part;

		if (length <= dead) return [0, 0];

		part = Math.pow((Math.min(1, length) - dead) / (1 - dead), power);

		return [x / length * part, y / length * part];
	},

	/* A finger on the half of a floating stick: the stick comes under it. */
	ZoneDown: function (event, node) {
		var side = node.getAttribute('data-stick');
		var stick = this.$Element().querySelector('.elemenx-virtual-pad-stick.' + side);
		var box;
		var moved = {left: this.Moved.left, right: this.Moved.right};

		if (!stick || this.Touches[side] !== undefined) return;

		box = stick.getBoundingClientRect();
		moved[side] = [moved[side][0] + event.clientX - (box.left + box.width / 2), moved[side][1] + event.clientY - (box.top + box.height / 2)];
		this.Moved = moved;
		this.Middles = this.Middles || {};
		this.Middles[side] = [event.clientX, event.clientY, box.width / 2];

		this.StickDown(event, node);
	},

	/* A stick follows its finger within its ring: x and y -1 to 1, down +, as the Gamepad API has them. */
	StickDown: function (event, node) {
		var side = node.getAttribute('data-stick');

		event.preventDefault();

		this.Ask();

		this.Touches[side] = event.pointerId;

		try {
			node.setPointerCapture(event.pointerId);
		}
		catch (error) {
		}

		this.StickMove(event, node);
	},

	StickMove: function (event, node) {
		var side = node.getAttribute('data-stick');
		var box = node.getBoundingClientRect();
		var middle = this.Middles && this.Middles[side] ? this.Middles[side] : [box.left + box.width / 2, box.top + box.height / 2, box.width / 2];
		var radius = middle[2];
		var x;
		var y;
		var length;
		var knobs;
		var lean;

		if (this.Touches[side] !== event.pointerId) return;

		x = (event.clientX - middle[0]) / radius;
		y = (event.clientY - middle[1]) / radius;
		length = Math.sqrt(x * x + y * y);

		if (length > 1) {
			x /= length;
			y /= length;
		}

		lean = this.Lean(side, x, y);

		this.Pad.Stick(side, lean[0], lean[1]);

		knobs = {left: this.Knobs.left, right: this.Knobs.right};
		knobs[side] = [x, y];
		this.Knobs = knobs;
	},

	StickUp: function (event, node) {
		var side = node.getAttribute('data-stick');
		var knobs = {left: this.Knobs.left, right: this.Knobs.right};

		var moved = {left: this.Moved.left, right: this.Moved.right};

		if (this.Touches[side] !== event.pointerId) return;

		delete this.Touches[side];

		if (this.Middles)
			delete this.Middles[side];

		this.Pad.Stick(side, 0, 0);

		knobs[side] = [0, 0];
		this.Knobs = knobs;

		/* A floating stick goes back to its place. */
		moved[side] = [0, 0];
		this.Moved = moved;
	},

	ButtonDown: function (event, node) {
		var button = node.getAttribute('data-button');
		var down = Object.assign({}, this.Down);

		event.preventDefault();

		this.Ask();

		try {
			node.setPointerCapture(event.pointerId);
		}
		catch (error) {
		}

		this.Pad.Press(button);

		down[button] = true;
		this.Down = down;

		this.$Emit('button', {Button: button, Down: true});
	},

	ButtonUp: function (event, node) {
		var button = node.getAttribute('data-button');
		var down = Object.assign({}, this.Down);

		if (!this.Down[button]) return;

		this.Pad.Release(button);

		delete down[button];
		this.Down = down;

		this.$Emit('button', {Button: button, Down: false});
	}
});
