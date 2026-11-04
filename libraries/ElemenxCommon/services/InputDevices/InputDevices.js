/*
 * InputDevices: what the player and the user press, lean and move, from every device at once, as a game or a page reads it.
 * - Keys: Down(code) whether a key is held now (its code: KeyW, Space, ShiftLeft...), Keys() the codes held. A window
 *   that loses the focus lets every key go.
 * - The pointer: Pointer() {X, Y (in the window), Buttons (a bit for each held: 1 the main one), Locked}; Moved() how
 *   far it went since the last call {X, Y} (with the pointer locked too); Lock(element) takes the pointer to an
 *   element (the browser asks for it within a press), Unlock() gives it back. Touches(): [{ID, X, Y}] of the fingers.
 * - Pads (the Gamepad API, standard mapping): Pads() lists [{Index, ID, Kind}]; Kind() is the kind of the pad used
 *   last (xbox, playstation, nintendo, generic, virtual, or '' when there is none); Label(button, kind) the name of a
 *   button on that kind of pad (A, ✕, B...). Axes() is the sticks and the triggers of all pads at once, {LeftX, LeftY,
 *   RightX, RightY, LeftTrigger, RightTrigger} (-1 to 1, up -1, as the Gamepad API has them; a small lean is 0).
 *   The buttons are a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down, left, right, home (the left stick
 *   leans as up, down, left and right too); on a pad without the standard mapping b0, b1... A pad reported twice
 *   (XInput and HID, Steam) presses once. Virtual(name, options) makes a pad of the page (a VirtualGamepad on the
 *   screen, the tilt of a phone): Press(button), Release(button), Stick('left' or 'right', x, y), Trigger('left' or
 *   'right', value), Destroy(); it is a pad as any other, Kind virtual; options Navigate (false: the Gamepad Service of
 *   ElemenxUI moves no focus by it). Browsers report a pad once a button of it is pressed on the page.
 * - The motion of the device, its accelerometer and gyroscope (devicemotion) and its turn (deviceorientation):
 *   MotionSupported(), RequestMotion(callback(error, state)) (iOS asks, only within a press: granted, denied or
 *   unsupported), StartMotion(), StopMotion(); Motion() the last of it {Orientation {Alpha, Beta, Gamma, Absolute}
 *   (degrees), Acceleration and Gravity [x, y, z] m/s² (null where the device has none), Rotation {Alpha, Beta, Gamma}
 *   degrees a second}. Tilt(): the lean of the device as a controller, the way the screen is turned taken into
 *   account: Steer (-1 to 1: turned as a wheel, right +), Pitch (-1 to 1: its top leaned away +, from where Center()
 *   was), X and Y (-1 to 1: a device held flat, its right and its top down +), Up (the up of the world in the frame of
 *   the screen); Range degrees make 1 (35), TiltDead degrees make 0 (2). Center() makes the lean of now the middle.
 * - Actions: Bind(action, sources, {Context}) names what does an action: a key code (KeyW), a button of a pad (a, rb),
 *   a half of an axis (LeftX+, LeftY-, RightTrigger), a button of the mouse (Mouse0), a half of the tilt (Steer+,
 *   Pitch-); Unbind(action, context). Value(name) is how far an action is pressed, 0 to 1 (a key 1, an axis as far as it
 *   leans), Held(name) whether it is over a half; name may be a source as well (Held('a'), Value('LeftX+')).
 *   Axis(negative, positive) is Value(positive) - Value(negative). Context(name) sets the context of the actions (a
 *   game, a car, a menu: a binding of another context does nothing; one without a context always works); Context()
 *   gives it. Actions() lists [{Action, Sources, Context}].
 * - On(name, callback) / Off(callback): connect and disconnect ({Pad}), change ({Kind}: another kind of pad pressed),
 *   button ({Button, Pad, Quiet}: a button of a pad went down; a held direction repeats after Delay, every Repeat ms),
 *   orientation and motion (as Motion() has them).
 * The same functions run where there is no page (Node, a worker): nothing is held, nothing moves.
 */
Elemenx.Service('InputDevices', {
	$Meta: {
		Description: 'What the player presses, leans and moves: keys, the pointer, touches, gamepads, the motion of the device, and actions bound to them.',
		Methods: ['Down(code)', 'Keys()', 'Pointer()', 'Moved()', 'Lock(element)', 'Unlock()', 'Touches()', 'Pads()', 'Kind()', 'Label(button, kind)', 'Axes()', 'Virtual(name, options)', 'MotionSupported()', 'RequestMotion(callback)', 'StartMotion()', 'StopMotion()', 'Motion()', 'Tilt()', 'Center()', 'Bind(action, sources, options)', 'Unbind(action, context)', 'Value(name)', 'Held(name)', 'Axis(negative, positive)', 'Context(name)', 'Actions()', 'On(name, callback)', 'Off(callback)']
	},

	Threshold: 0.5,
	Dead: 0.12,
	Delay: 400,
	Repeat: 120,
	Range: 35,
	TiltDead: 2,
	Buttons: ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'select', 'start', 'ls', 'rs', 'up', 'down', 'left', 'right', 'home'],
	Labels: {
		xbox: {a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', select: 'View', start: 'Menu', ls: 'LS', rs: 'RS', up: '↑', down: '↓', left: '←', right: '→', home: 'Xbox'},
		playstation: {a: '✕', b: '○', x: '□', y: '△', lb: 'L1', rb: 'R1', lt: 'L2', rt: 'R2', select: 'Create', start: 'Options', ls: 'L3', rs: 'R3', up: '↑', down: '↓', left: '←', right: '→', home: 'PS'},
		nintendo: {a: 'B', b: 'A', x: 'Y', y: 'X', lb: 'L', rb: 'R', lt: 'ZL', rt: 'ZR', select: '−', start: '+', ls: 'LS', rs: 'RS', up: '↑', down: '↓', left: '←', right: '→', home: 'Home'}
	},

	$OnCreate: function () {
		var self = this;

		this.Listeners = {};
		this.Codes = {};
		this.Point = {X: 0, Y: 0, Buttons: 0};
		this.Shift = {X: 0, Y: 0};
		this.Fingers = {};
		this.Pressed = {};
		this.Repeats = {};
		this.Known = {};
		this.Virtuals = {};
		this.Last = '';
		this.Frame = 0;
		this.Bound = [];
		this.Current = '';
		this.Sensed = {Orientation: null, Acceleration: null, Gravity: null, Rotation: null};
		this.Middle = {Steer: 0, Pitch: 0};
		this.Listening = false;
		this.Page = typeof window !== 'undefined' && typeof window.addEventListener === 'function';

		this.Pressing = function (event) {
			if (event.code)
				self.Codes[event.code] = true;
		};

		this.Releasing = function (event) {
			delete self.Codes[event.code];
		};

		this.Left = function () {
			self.Codes = {};
			self.Point.Buttons = 0;
		};

		this.Pointing = function (event) {
			self.Point.X = event.clientX;
			self.Point.Y = event.clientY;
			self.Point.Buttons = event.buttons;

			if (event.type === 'pointermove') {
				self.Shift.X += Number(event.movementX) || 0;
				self.Shift.Y += Number(event.movementY) || 0;
			}
		};

		this.Touching = function (event) {
			var fingers = {};

			Array.prototype.forEach.call(event.touches || [], function (touch) {
				fingers[touch.identifier] = {ID: touch.identifier, X: touch.clientX, Y: touch.clientY};
			});

			self.Fingers = fingers;
		};

		this.Connected = function (event) {
			self.Track(event.gamepad, true);
		};

		this.Disconnected = function (event) {
			self.Track(event.gamepad, false);
		};

		this.Tick = function () {
			self.Frame = 0;

			self.Poll();

			if (Object.keys(self.Known).length && typeof window.requestAnimationFrame === 'function')
				self.Frame = window.requestAnimationFrame(self.Tick);
		};

		this.Oriented = function (event) {
			self.Sensed.Orientation = {Alpha: Number(event.alpha) || 0, Beta: Number(event.beta) || 0, Gamma: Number(event.gamma) || 0, Absolute: !!event.absolute};

			self.Emit('orientation', self.Sensed.Orientation);
		};

		this.Sensing = function (event) {
			function vector (value) {
				return value && value.x !== null && value.x !== undefined ? [Number(value.x) || 0, Number(value.y) || 0, Number(value.z) || 0] : null;
			}

			var rate = event.rotationRate;

			self.Sensed.Acceleration = vector(event.acceleration);
			self.Sensed.Gravity = vector(event.accelerationIncludingGravity);
			self.Sensed.Rotation = rate ? {Alpha: Number(rate.alpha) || 0, Beta: Number(rate.beta) || 0, Gamma: Number(rate.gamma) || 0} : null;

			self.Emit('motion', {Acceleration: self.Sensed.Acceleration, Gravity: self.Sensed.Gravity, Rotation: self.Sensed.Rotation, Interval: Number(event.interval) || 0});
		};

		if (!this.Page) return;

		window.addEventListener('keydown', this.Pressing, true);
		window.addEventListener('keyup', this.Releasing, true);
		window.addEventListener('blur', this.Left);
		window.addEventListener('pointermove', this.Pointing, true);
		window.addEventListener('pointerdown', this.Pointing, true);
		window.addEventListener('pointerup', this.Pointing, true);
		window.addEventListener('touchstart', this.Touching, true);
		window.addEventListener('touchmove', this.Touching, true);
		window.addEventListener('touchend', this.Touching, true);
		window.addEventListener('touchcancel', this.Touching, true);
		window.addEventListener('gamepadconnected', this.Connected);
		window.addEventListener('gamepaddisconnected', this.Disconnected);

		this.Read().forEach(function (pad) {
			self.Track(pad, true);
		});
	},

	$OnDestroy: function () {
		this.StopMotion();

		if (!this.Page) return;

		window.removeEventListener('keydown', this.Pressing, true);
		window.removeEventListener('keyup', this.Releasing, true);
		window.removeEventListener('blur', this.Left);
		window.removeEventListener('pointermove', this.Pointing, true);
		window.removeEventListener('pointerdown', this.Pointing, true);
		window.removeEventListener('pointerup', this.Pointing, true);
		window.removeEventListener('touchstart', this.Touching, true);
		window.removeEventListener('touchmove', this.Touching, true);
		window.removeEventListener('touchend', this.Touching, true);
		window.removeEventListener('touchcancel', this.Touching, true);
		window.removeEventListener('gamepadconnected', this.Connected);
		window.removeEventListener('gamepaddisconnected', this.Disconnected);

		if (this.Frame)
			window.cancelAnimationFrame(this.Frame);
	},

	/* InputDevices: keys, the pointer and the fingers */

	Down: function (code) {
		return !!this.Codes[code];
	},

	Keys: function () {
		return Object.keys(this.Codes);
	},

	Pointer: function () {
		var locked = this.Page && typeof document !== 'undefined' && !!document.pointerLockElement;

		return {X: this.Point.X, Y: this.Point.Y, Buttons: this.Point.Buttons, Locked: locked};
	},

	Moved: function () {
		var moved = {X: this.Shift.X, Y: this.Shift.Y};

		this.Shift = {X: 0, Y: 0};

		return moved;
	},

	Lock: function (element) {
		var asked;

		if (!element || typeof element.requestPointerLock !== 'function') return;

		try {
			asked = element.requestPointerLock();

			/* A browser that answers later may refuse: the pointer stays free, as it was. */
			if (asked && typeof asked.catch === 'function')
				asked.catch(function () {});
		}
		catch (error) {
		}
	},

	Unlock: function () {
		if (this.Page && document.pointerLockElement && typeof document.exitPointerLock === 'function')
			document.exitPointerLock();
	},

	Touches: function () {
		var fingers = this.Fingers;

		return Object.keys(fingers).map(function (key) {
			return fingers[key];
		});
	},

	/* InputDevices: pads */

	/* The pads the browser reports now, and those of the page. */
	Read: function () {
		var list;
		var virtuals = this.Virtuals || {};

		try {
			list = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
		}
		catch (error) {
			list = [];
		}

		return Array.prototype.filter.call(list || [], Boolean).concat(Object.keys(virtuals).map(function (key) {
			return virtuals[key];
		}));
	},

	Virtual: function (name, options) {
		var self = this;
		var settings = options || {};
		var index = 'virtual-' + (name || Object.keys(this.Virtuals).length);
		var pad = {index: index, id: 'Elemenx virtual ' + (name || ''), mapping: 'standard', connected: true, axes: [0, 0, 0, 0], buttons: this.Buttons.map(function () {
			return {pressed: false, value: 0};
		}), Quiet: settings.Navigate === false};

		function set (button, value) {
			var at = self.Buttons.indexOf(button);
			if (at !== -1)
				pad.buttons[at] = {pressed: value > 0.5, value: value};
		}

		this.Virtuals[index] = pad;

		this.Track(pad, true);

		return {
			Press: function (button) {
				set(button, 1);
			},

			Release: function (button) {
				set(button, 0);
			},

			Stick: function (side, x, y) {
				var at = side === 'right' ? 2 : 0;

				pad.axes[at] = Math.max(-1, Math.min(1, Number(x) || 0));
				pad.axes[at + 1] = Math.max(-1, Math.min(1, Number(y) || 0));
			},

			Trigger: function (side, value) {
				set(side === 'left' ? 'lt' : 'rt', Math.max(0, Math.min(1, Number(value) || 0)));
			},

			Destroy: function () {
				if (!self.Virtuals[index]) return;

				delete self.Virtuals[index];

				self.Track(pad, false);
			}
		};
	},

	/* The sticks and the triggers of all pads: on each, the one that leans most; a small lean is none. */
	Axes: function () {
		var self = this;
		var axes = {LeftX: 0, LeftY: 0, RightX: 0, RightY: 0, LeftTrigger: 0, RightTrigger: 0};
		var names = ['LeftX', 'LeftY', 'RightX', 'RightY'];

		this.Read().forEach(function (pad) {
			var standard = pad.mapping === 'standard';

			names.forEach(function (name, index) {
				var value = Number((pad.axes || [])[index]) || 0;
				if (Math.abs(value) > Math.abs(axes[name]))
					axes[name] = value;
			});

			if (standard) {
				axes.LeftTrigger = Math.max(axes.LeftTrigger, Number(pad.buttons[6] && pad.buttons[6].value) || 0);
				axes.RightTrigger = Math.max(axes.RightTrigger, Number(pad.buttons[7] && pad.buttons[7].value) || 0);
			}

			self.Track(pad, true);
		});

		names.forEach(function (name) {
			if (Math.abs(axes[name]) < self.Dead)
				axes[name] = 0;
		});

		return axes;
	},

	/* Whether a button is down on any pad now. */
	Button: function (button) {
		var self = this;

		return this.Read().some(function (pad) {
			return !!self.PadState(pad)[button];
		});
	},

	KindOf: function (id) {
		var text = String(id || '');
		if (/^Elemenx virtual/.test(text)) return 'virtual';
		if (/xbox|xinput|045e/i.test(text)) return 'xbox';
		if (/playstation|dualshock|dualsense|054c|wireless controller/i.test(text)) return 'playstation';
		if (/nintendo|switch|joy-con|pro controller|057e/i.test(text)) return 'nintendo';

		return 'generic';
	},

	Track: function (pad, connected) {
		var entry;

		if (!pad) return;

		entry = {Index: pad.index, ID: pad.id, Kind: this.KindOf(pad.id)};

		if (connected) {
			if (this.Known[pad.index]) return;

			this.Known[pad.index] = entry;

			this.Emit('connect', {Pad: entry});

			if (!this.Frame && this.Page && typeof window.requestAnimationFrame === 'function')
				this.Frame = window.requestAnimationFrame(this.Tick);

			return;
		}

		delete this.Known[pad.index];

		this.Emit('disconnect', {Pad: entry});
	},

	Pads: function () {
		var known = this.Known;

		return Object.keys(known).map(function (key) {
			return known[key];
		});
	},

	Kind: function () {
		var pads = this.Pads();

		return this.Last || (pads[0] ? pads[0].Kind : '');
	},

	Label: function (button, kind) {
		return (this.Labels[kind || this.Kind()] || this.Labels.xbox)[button] || String(button || '').toUpperCase();
	},

	/*
	 * The buttons of a pad pressed now: by name on a pad of the standard mapping (b0, b1... on another one, whose
	 * buttons have no known meaning), with the direction of its left stick (the axis it leans on most).
	 */
	PadState: function (pad) {
		var self = this;
		var state = {};
		var axes = pad.axes || [];
		var x = Number(axes[0]) || 0;
		var y = Number(axes[1]) || 0;
		var standard = pad.mapping === 'standard';

		Array.prototype.forEach.call(pad.buttons || [], function (button, index) {
			var name = standard ? self.Buttons[index] : 'b' + index;
			if (name && button && (button.pressed || button.value > self.Threshold))
				state[name] = pad;
		});

		if (Math.max(Math.abs(x), Math.abs(y)) > this.Threshold) {
			if (Math.abs(x) >= Math.abs(y)) state[x < 0 ? 'left' : 'right'] = pad;
			else state[y < 0 ? 'up' : 'down'] = pad;
		}

		return state;
	},

	/*
	 * The buttons pressed now on all pads at once: a system that reports one pad twice (XInput and HID, Steam) presses
	 * a button once. A press goes down when a button goes down; a held direction repeats.
	 */
	Poll: function () {
		var self = this;
		var now = Date.now();
		var state = {};
		var previous = this.Pressed;

		this.Read().forEach(function (pad) {
			var own;

			if (!self.Known[pad.index])
				self.Track(pad, true);

			own = self.PadState(pad);

			Object.keys(own).forEach(function (name) {
				if (!state[name])
					state[name] = own[name];
			});
		});

		Object.keys(this.Repeats).forEach(function (name) {
			if (!state[name])
				delete self.Repeats[name];
		});

		Object.keys(state).forEach(function (name) {
			var direction = /^(up|down|left|right)$/.test(name);

			if (!previous[name]) {
				self.Repeats[name] = now + self.Delay;

				self.Press(name, state[name]);
			}
			else if (direction && self.Repeats[name] <= now) {
				self.Repeats[name] = now + self.Repeat;

				self.Press(name, state[name]);
			}
		});

		this.Pressed = state;
	},

	/* A button went down: another kind of pad tells first. */
	Press: function (name, pad) {
		var kind = this.KindOf(pad.id);
		var entry = this.Known[pad.index] || {Index: pad.index, ID: pad.id, Kind: kind};

		if (kind !== this.Last) {
			this.Last = kind;

			this.Emit('change', {Kind: kind});
		}

		this.Emit('button', {Button: name, Pad: entry, Quiet: !!pad.Quiet});
	},

	/* InputDevices: the motion of the device */

	MotionSupported: function () {
		return typeof window !== 'undefined' && (typeof window.DeviceOrientationEvent !== 'undefined' || typeof window.DeviceMotionEvent !== 'undefined');
	},

	RequestMotion: function (callback) {
		var done = callback || function () {};
		var asked = typeof window !== 'undefined' && window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function' ? window.DeviceOrientationEvent.requestPermission : null;

		if (!this.MotionSupported()) {
			done(null, 'unsupported');

			return;
		}

		if (!asked) {
			done(null, 'granted');

			return;
		}

		/* iOS asks, within a press: what it answers comes later. */
		try {
			asked.call(window.DeviceOrientationEvent).then(function (state) {
				if (window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function')
					window.DeviceMotionEvent.requestPermission().catch(function () {});

				done(null, state === 'granted' ? 'granted' : 'denied');
			}, function (error) {
				done(error, 'denied');
			});
		}
		catch (error) {
			done(error, 'denied');
		}
	},

	StartMotion: function () {
		if (this.Listening || !this.Page) return;

		this.Listening = true;

		window.addEventListener('deviceorientation', this.Oriented);
		window.addEventListener('devicemotion', this.Sensing);
	},

	StopMotion: function () {
		if (!this.Listening) return;

		this.Listening = false;

		window.removeEventListener('deviceorientation', this.Oriented);
		window.removeEventListener('devicemotion', this.Sensing);
	},

	Motion: function () {
		return {Orientation: this.Sensed.Orientation, Acceleration: this.Sensed.Acceleration, Gravity: this.Sensed.Gravity, Rotation: this.Sensed.Rotation};
	},

	/* How far the screen is turned from the natural way of the device, in degrees (0, 90, 180, 270). */
	Turned: function () {
		var angle = typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : typeof window !== 'undefined' ? window.orientation : 0;

		return ((Number(angle) || 0) % 360 + 360) % 360;
	},

	/* The angles of the lean of now, in degrees: as a wheel, and of its top away. */
	Lean: function () {
		var orientation = this.Sensed.Orientation;
		var degrees = Math.PI / 180;
		var beta;
		var gamma;
		var up;
		var turn;
		var screenUp;

		if (!orientation) return null;

		beta = orientation.Beta * degrees;
		gamma = orientation.Gamma * degrees;

		/* The up of the world in the frame of the device (Z X' Y'' of the spec: alpha turns round it and changes nothing). */
		up = [-Math.cos(beta) * Math.sin(gamma), Math.sin(beta), Math.cos(beta) * Math.cos(gamma)];
		turn = this.Turned() * degrees;
		screenUp = [up[0] * Math.cos(turn) - up[1] * Math.sin(turn), up[0] * Math.sin(turn) + up[1] * Math.cos(turn), up[2]];

		return {Up: screenUp, Steer: Math.atan2(-screenUp[0], screenUp[1]) / degrees, Pitch: Math.asin(Math.max(-1, Math.min(1, screenUp[2]))) / degrees};
	},

	Tilt: function () {
		var lean = this.Lean();
		var range = Number(this.Range) || 35;
		var dead = Number(this.TiltDead) || 0;

		function scaled (degrees) {
			var size = Math.abs(degrees) < dead ? 0 : (Math.abs(degrees) - dead) / Math.max(1, range - dead);

			return Math.max(-1, Math.min(1, Math.sign(degrees) * size));
		}

		if (!lean)
			return {Steer: 0, Pitch: 0, X: 0, Y: 0, Up: [0, 1, 0]};

		return {
			Steer: scaled(lean.Steer - this.Middle.Steer),
			Pitch: scaled(lean.Pitch - this.Middle.Pitch),
			X: scaled(Math.asin(Math.max(-1, Math.min(1, -lean.Up[0]))) * 180 / Math.PI),
			Y: scaled(Math.asin(Math.max(-1, Math.min(1, -lean.Up[1]))) * 180 / Math.PI),
			Up: lean.Up
		};
	},

	Center: function () {
		var lean = this.Lean();

		this.Middle = lean ? {Steer: lean.Steer, Pitch: lean.Pitch} : {Steer: 0, Pitch: 0};
	},

	/* InputDevices: actions */

	Bind: function (action, sources, options) {
		var context = options && options.Context || '';

		if (!action || !sources)
			throw new Error('Elemenx InputDevices: Bind expects (action, sources)');

		this.Unbind(action, context);

		this.Bound.push({Action: action, Sources: [].concat(sources), Context: context});

		return action;
	},

	Unbind: function (action, context) {
		this.Bound = this.Bound.filter(function (binding) {
			return binding.Action !== action || context !== undefined && binding.Context !== (context || '');
		});
	},

	Context: function (name) {
		if (arguments.length)
			this.Current = name || '';

		return this.Current;
	},

	Actions: function () {
		return this.Bound.map(function (binding) {
			return {Action: binding.Action, Sources: binding.Sources.slice(), Context: binding.Context};
		});
	},

	/* How far a source is pressed, 0 to 1: a key, a button of a pad or of the mouse, a half of an axis or of the tilt. */
	Source: function (source) {
		var half = /^(LeftX|LeftY|RightX|RightY|Steer|Pitch)([+-])$/.exec(source);
		var mouse = /^Mouse(\d)$/.exec(source);
		var value;

		if (half) {
			value = /^(Steer|Pitch)$/.test(half[1]) ? this.Tilt()[half[1]] : this.Axes()[half[1]];

			return Math.max(0, half[2] === '+' ? value : -value);
		}

		if (source === 'LeftTrigger' || source === 'RightTrigger') return this.Axes()[source];

		if (mouse)
			return this.Point.Buttons & 1 << Number(mouse[1]) ? 1 : 0;

		if (this.Buttons.indexOf(source) !== -1 || /^b\d+$/.test(source)) return this.Button(source) ? 1 : 0;

		return this.Codes[source] ? 1 : 0;
	},

	Value: function (name) {
		var self = this;
		var current = this.Current;
		var bound = this.Bound.filter(function (binding) {
			return binding.Action === name && (!binding.Context || binding.Context === current);
		});
		if (!bound.length && this.Bound.some(function (binding) {
			return binding.Action === name;
		})) return 0;

		if (!bound.length)
			return this.Source(name);

		return bound.reduce(function (most, binding) {
			return binding.Sources.reduce(function (inner, source) {
				return Math.max(inner, Math.min(1, self.Source(source)));
			}, most);
		}, 0);
	},

	Held: function (name) {
		return this.Value(name) > this.Threshold;
	},

	Axis: function (negative, positive) {
		return this.Value(positive) - this.Value(negative);
	},

	On: function (name, callback) {
		(this.Listeners[name] = this.Listeners[name] || []).push(callback);

		return callback;
	},

	Off: function (callback) {
		var listeners = this.Listeners;

		Object.keys(listeners).forEach(function (name) {
			listeners[name] = listeners[name].filter(function (item) {
				return item !== callback;
			});
		});
	},

	Emit: function (name, detail) {
		(this.Listeners[name] || []).slice().forEach(function (callback) {
			try {
				callback(detail);
			}
			catch (error) {
				setTimeout(function () {
					throw error;
				}, 0);
			}
		});
	}
});
