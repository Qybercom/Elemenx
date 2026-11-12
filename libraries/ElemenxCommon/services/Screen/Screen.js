/*
 * Screen: how the screen of the page is held and how large it is, as a page lays itself out by it.
 * - Orientation(): portrait or landscape (taller than wide: portrait); Angle(): the turn of the screen, 0, 90, 180 or
 *   270 degrees; Narrow(): as narrow as a phone (its shorter side under Narrow px, 600); Coarse(): the pointer is a
 *   finger (pointer: coarse); Phone(): narrow and touched. State(): all of them at once {Orientation, Angle, Width,
 *   Height, Narrow, Coarse, Phone}.
 * - The page knows it of its classes too: on <html> elemenx-portrait or elemenx-landscape, elemenx-narrow and
 *   elemenx-coarse while they are so, so a layout changes of CSS alone.
 * - On('change', callback(state)) / Off(callback): the screen turned or another size (a window resized), once for each
 *   change; the template event (orientation) on any element gives the same state in event.detail.
 * - Fullscreen(element, options, callback(error)): the element over the whole screen (the browser asks for it within a
 *   press); options Landscape (true: the screen kept in landscape while it is, where the device lets a page lock it:
 *   phones in fullscreen; elsewhere it turns as it will, no error), Navigation ('hide'). Exit(callback(error)) leaves
 *   it; Full() whether something is over the whole screen now.
 * Where there is no page (Node, a worker): a landscape screen of 1280 by 800, none of it narrow or touched.
 */
Elemenx.Service('Screen', {
	$Meta: {
		Description: 'How the screen of the page is held and how large it is: orientation, narrow, touched, fullscreen locked to landscape; the classes of <html> and the event (orientation).',
		Methods: ['Orientation()', 'Angle()', 'Narrow()', 'Coarse()', 'Phone()', 'State()', 'On(name, callback)', 'Off(callback)', 'Fullscreen(element, options, callback)', 'Exit(callback)', 'Full()']
	},

	Narrowest: 600,

	$OnCreate: function () {
		var self = this;

		this.Listeners = [];
		this.Last = '';
		this.Page = typeof window !== 'undefined' && typeof document !== 'undefined';

		this.Changed = function () {
			var state = self.State();
			var key = JSON.stringify(state);
			if (key === self.Last) return;

			self.Last = key;

			self.Mark(state);

			self.Listeners.slice().forEach(function (callback) {
				callback(state);
			});
		};

		if (!this.Page) return;

		window.addEventListener('resize', this.Changed);
		window.addEventListener('orientationchange', this.Changed);

		if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener)
			window.screen.orientation.addEventListener('change', this.Changed);

		this.Changed();
	},

	$OnDestroy: function () {
		if (!this.Page) return;

		window.removeEventListener('resize', this.Changed);
		window.removeEventListener('orientationchange', this.Changed);

		if (window.screen && window.screen.orientation && window.screen.orientation.removeEventListener)
			window.screen.orientation.removeEventListener('change', this.Changed);
	},

	State: function () {
		var width = this.Page ? window.innerWidth : 1280;
		var height = this.Page ? window.innerHeight : 800;
		var narrow = Math.min(width, height) < this.Narrowest;
		var coarse = this.Page && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

		return {Orientation: height > width ? 'portrait' : 'landscape', Angle: this.Angle(), Width: width, Height: height, Narrow: narrow, Coarse: !!coarse, Phone: narrow && !!coarse};
	},

	Orientation: function () {
		return this.State().Orientation;
	},

	Angle: function () {
		var angle;

		if (!this.Page) return 0;

		angle = window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number' ? window.screen.orientation.angle : Number(window.orientation) || 0;

		return (angle % 360 + 360) % 360;
	},

	Narrow: function () {
		return this.State().Narrow;
	},

	Coarse: function () {
		return this.State().Coarse;
	},

	Phone: function () {
		return this.State().Phone;
	},

	/* The classes of <html> by the state. */
	Mark: function (state) {
		var classes;

		if (!this.Page || !document.documentElement) return;

		classes = document.documentElement.classList;

		classes.toggle('elemenx-portrait', state.Orientation === 'portrait');
		classes.toggle('elemenx-landscape', state.Orientation === 'landscape');
		classes.toggle('elemenx-narrow', state.Narrow);
		classes.toggle('elemenx-coarse', state.Coarse);
	},

	On: function (name, callback) {
		if (name === 'change' && typeof callback === 'function' && this.Listeners.indexOf(callback) === -1)
			this.Listeners.push(callback);
	},

	Off: function (callback) {
		var at = this.Listeners.indexOf(callback);
		if (at !== -1)
			this.Listeners.splice(at, 1);
	},

	Full: function () {
		return !!(this.Page && (document.fullscreenElement || document.webkitFullscreenElement));
	},

	Fullscreen: function (element, options, callback) {
		var given = options || {};
		var done = typeof callback === 'function' ? callback : function () {};
		var ask;
		var asked;

		if (!this.Page || !element) {
			done(new Error('Screen.Fullscreen needs an element of a page.'));

			return;
		}

		ask = element.requestFullscreen || element.webkitRequestFullscreen;

		if (!ask) {
			done(new Error('Screen.Fullscreen: this browser shows no element over the whole screen.'));

			return;
		}

		function lock () {
			var orientation = window.screen && window.screen.orientation;
			var locked;

			if (!given.Landscape || !orientation || typeof orientation.lock !== 'function') {
				done(null);

				return;
			}

			/* A device that turns no page (a desktop) refuses the lock: in fullscreen all the same, no error of it. */
			try {
				locked = orientation.lock('landscape');
			}
			catch (ignore) {
				locked = null;
			}

			if (locked && typeof locked.then === 'function') {
				locked.then(function () {
					done(null);
				}, function () {
					done(null);
				});

				return;
			}

			done(null);
		}

		try {
			asked = ask.call(element, given.Navigation ? {navigationUI: given.Navigation} : undefined);
		}
		catch (error) {
			done(error);

			return;
		}

		if (asked && typeof asked.then === 'function') {
			asked.then(lock, function (error) {
				done(error || new Error('Screen.Fullscreen was refused.'));
			});

			return;
		}

		lock();
	},

	Exit: function (callback) {
		var done = typeof callback === 'function' ? callback : function () {};
		var leave;
		var left;

		if (!this.Full()) {
			done(null);

			return;
		}

		if (window.screen && window.screen.orientation && typeof window.screen.orientation.unlock === 'function') {
			try {
				window.screen.orientation.unlock();
			}
			catch (ignore) {
				/* Nothing was locked. */
			}
		}

		leave = document.exitFullscreen || document.webkitExitFullscreen;
		left = leave ? leave.call(document) : null;

		if (left && typeof left.then === 'function') {
			left.then(function () {
				done(null);
			}, function (error) {
				done(error || new Error('Screen.Exit was refused.'));
			});

			return;
		}

		done(null);
	}
});

/* The template event (orientation): the state of the screen each time it turns or changes its size. */
Elemenx.EventSource(['orientation'], {
	Attach: function (element) {
		var screen = Elemenx.Service('Screen');
		var changed = function (state) {
			element.dispatchEvent(new CustomEvent('orientation', {detail: state}));
		};

		screen.On('change', changed);

		return function () {
			screen.Off(changed);
		};
	}
});
