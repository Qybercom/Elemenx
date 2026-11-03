/*
 * A gamepad on the screen for the fingers: a stick, buttons and the triggers of a game over what is under it (a
 * GameScene, in its slot hud). It is a pad of the Gamepad Service (Virtual): a GameScene and every listener of pads take
 * it as a real one (its stick walks and steers as far as it leans, A jumps...). Buttons: the ones it shows (a, b, x, y,
 * lb, rb, lt, rt, start, select: a list or a text with commas); Right: a second stick, to look round; Show: auto (where
 * the screen is touched, a phone), always or never; Tilt: the left stick across follows the lean of the device as a
 * wheel (Motion), asked for at the first touch; Navigate: its buttons also move the focus of the page and press its
 * controls, as a real pad does (false: a game only). Size of its stick in pixels. Event button ({Button, Down}).
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
			Buttons: 'The buttons it shows: a, b, x, y, lb, rb, lt, rt, start, select (a list, or a text with commas).',
			Right: 'A second stick, at the right, to look round.',
			Show: {Options: ['auto', 'always', 'never'], Description: 'auto: where the screen is touched; always; never.'},
			Tilt: 'The left stick across follows the lean of the device as a wheel.',
			Navigate: 'Its buttons also move the focus and press the controls of the page, as a real pad does.',
			Size: 'The size of a stick, in pixels.',
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
	Label: '',
	Knobs: {left: [0, 0], right: [0, 0]},
	Down: {},

	$OnCreate: function () {
		var self = this;

		this.Touches = {};

		/* The buttons shown, by their group: the face ones, the shoulders, the middle ones. */
		this.Listed = function (buttons, group) {
			var list = typeof buttons === 'string' ? buttons.split(',') : buttons || [];
			var groups = {face: ['y', 'x', 'b', 'a'], shoulder: ['lb', 'lt', 'rb', 'rt'], middle: ['select', 'start']};

			return groups[group].filter(function (name) {
				return list.map(function (each) {
					return String(each).trim().toLowerCase();
				}).indexOf(name) !== -1;
			});
		};

		this.Shown = function (show) {
			if (show === 'never') return false;
			if (show === 'always') return true;

			return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
		};

		this.LabelOf = function (button) {
			return self.$Service('Gamepad').Label(button, 'xbox');
		};

		/* The lean of the device steers while the stick is not held. */
		this.Leaning = function () {
			var tilt;

			self.Frame = window.requestAnimationFrame(self.Leaning);

			if (!self.Tilt || self.Tilt === 'false' || self.Touches.left) return;

			tilt = self.$Service('Motion').Tilt();

			self.Pad.Stick('left', tilt.Steer, 0);

			self.Knobs = {left: [tilt.Steer, 0], right: self.Knobs.right};
		};
	},

	$OnReady: function () {
		this.Pad = this.$Service('Gamepad').Virtual('screen-' + Math.random().toString(36).slice(2, 8), {Navigate: this.Navigate === true || this.Navigate === 'true'});
		this.Frame = window.requestAnimationFrame(this.Leaning);
	},

	$OnDestroy: function () {
		window.cancelAnimationFrame(this.Frame);

		if (this.Pad)
			this.Pad.Destroy();

		if (this.Asked)
			this.$Service('Motion').Stop();
	},

	/* The lean of the device is asked for at the first touch: iOS asks only within a press. */
	Ask: function () {
		var motion = this.$Service('Motion');

		if (!this.Tilt || this.Tilt === 'false' || this.Asked) return;

		this.Asked = true;

		motion.Request(function (error, state) {
			if (state !== 'granted') return;

			motion.Start();

			window.setTimeout(function () {
				motion.Center();
			}, 300);
		});
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
		var radius = box.width / 2;
		var x;
		var y;
		var length;
		var knobs;

		if (this.Touches[side] !== event.pointerId) return;

		x = (event.clientX - box.left - radius) / radius;
		y = (event.clientY - box.top - radius) / radius;
		length = Math.sqrt(x * x + y * y);

		if (length > 1) {
			x /= length;
			y /= length;
		}

		this.Pad.Stick(side, x, y);

		knobs = {left: this.Knobs.left, right: this.Knobs.right};
		knobs[side] = [x, y];
		this.Knobs = knobs;
	},

	StickUp: function (event, node) {
		var side = node.getAttribute('data-stick');
		var knobs = {left: this.Knobs.left, right: this.Knobs.right};

		if (this.Touches[side] !== event.pointerId) return;

		delete this.Touches[side];

		this.Pad.Stick(side, 0, 0);

		knobs[side] = [0, 0];
		this.Knobs = knobs;
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
