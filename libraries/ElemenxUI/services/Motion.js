/*
 * The motion of the device: its accelerometer and gyroscope (devicemotion) and its turn in space (deviceorientation).
 * - Supported(): whether the page can read them. Request(callback(error, state)): asks for them where the browser asks
 *   (iOS: only within a press of the user), else tells at once: granted, denied or unsupported.
 * - Start(), Stop(): listen to the device; On(name, callback), Off(callback): orientation ({Alpha, Beta, Gamma,
 *   Absolute}, degrees), motion ({Acceleration and Gravity [x, y, z] m/s² (without the gravity and with it, null where
 *   the device has none), Rotation {Alpha, Beta, Gamma} degrees a second, Interval ms}). State(): the last of them,
 *   {Orientation, Acceleration, Gravity, Rotation}.
 * - Tilt(): the lean of the device as a controller, the way the screen is turned taken into account (portrait or
 *   landscape): Steer (-1 to 1: turned as a wheel, right +), Pitch (-1 to 1: its top leaned away +, from where Center()
 *   was), X and Y (-1 to 1: a device held flat, its right and its top down +), Up (the up of the world in the frame of
 *   the screen); Range degrees make 1 (35), Dead degrees make 0 (2). Center() makes the lean of now the middle.
 * The same functions run where there is no device: they tell nothing moves.
 */
Elemenx.Service('Motion', {
	$Meta: {
		Description: 'The motion of the device: its accelerometer, gyroscope and turn in space, and its lean as a controller.',
		Methods: ['Supported()', 'Request(callback)', 'Start()', 'Stop()', 'On(name, callback)', 'Off(callback)', 'State()', 'Tilt()', 'Center()']
	},
	Range: 35,
	Dead: 2,

	$OnCreate: function () {
		var self = this;

		this.Listeners = {};
		this.Last = {Orientation: null, Acceleration: null, Gravity: null, Rotation: null};
		this.Middle = {Steer: 0, Pitch: 0};
		this.Listening = false;

		this.Oriented = function (event) {
			self.Last.Orientation = {Alpha: Number(event.alpha) || 0, Beta: Number(event.beta) || 0, Gamma: Number(event.gamma) || 0, Absolute: !!event.absolute};

			self.Emit('orientation', self.Last.Orientation);
		};

		this.Moved = function (event) {
			function vector (value) {
				return value && value.x !== null && value.x !== undefined ? [Number(value.x) || 0, Number(value.y) || 0, Number(value.z) || 0] : null;
			}

			var rate = event.rotationRate;

			self.Last.Acceleration = vector(event.acceleration);
			self.Last.Gravity = vector(event.accelerationIncludingGravity);
			self.Last.Rotation = rate ? {Alpha: Number(rate.alpha) || 0, Beta: Number(rate.beta) || 0, Gamma: Number(rate.gamma) || 0} : null;

			self.Emit('motion', {Acceleration: self.Last.Acceleration, Gravity: self.Last.Gravity, Rotation: self.Last.Rotation, Interval: Number(event.interval) || 0});
		};
	},

	$OnDestroy: function () {
		this.Stop();
	},

	Supported: function () {
		return typeof window !== 'undefined' && (typeof window.DeviceOrientationEvent !== 'undefined' || typeof window.DeviceMotionEvent !== 'undefined');
	},

	Request: function (callback) {
		var done = callback || function () {};
		var asked = typeof window !== 'undefined' && window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function' ? window.DeviceOrientationEvent.requestPermission : null;

		if (!this.Supported()) {
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

	Start: function () {
		if (this.Listening || typeof window === 'undefined') return;

		this.Listening = true;

		window.addEventListener('deviceorientation', this.Oriented);
		window.addEventListener('devicemotion', this.Moved);
	},

	Stop: function () {
		if (!this.Listening) return;

		this.Listening = false;

		window.removeEventListener('deviceorientation', this.Oriented);
		window.removeEventListener('devicemotion', this.Moved);
	},

	State: function () {
		return {Orientation: this.Last.Orientation, Acceleration: this.Last.Acceleration, Gravity: this.Last.Gravity, Rotation: this.Last.Rotation};
	},

	/* How far the screen is turned from the natural way of the device, in degrees (0, 90, 180, 270). */
	Turned: function () {
		var angle = typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : typeof window !== 'undefined' ? window.orientation : 0;

		return ((Number(angle) || 0) % 360 + 360) % 360;
	},

	/* The angles of the lean of now, in degrees: as a wheel, and of its top away. */
	Lean: function () {
		var orientation = this.Last.Orientation;
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
		var dead = Number(this.Dead) || 0;

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
			callback(detail);
		});
	}
});
