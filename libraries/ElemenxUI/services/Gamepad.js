/*
 * Gamepads (the Gamepad API, standard mapping): they work the page the way the keyboard does. Every component that
 * follows the keys follows a gamepad too.
 * - The d-pad and the left stick send the arrow keys to the focused element; when no component takes an arrow (none
 *   prevents its default), the focus moves to the nearest control on that side (Move). A held direction repeats.
 * - A sends Enter and X Space, and either presses the focused control when no component took the key (a button, a
 *   check box, an option...; A follows a link too); B sends Escape, and cancels the dialog on top when no component
 *   took it (an open popup closes first); Y sends Delete; the other buttons are events only.
 * - Every press is the button event ({Button, Pad}): a, b, x, y, lb, rb, lt, rt, select, start, ls, rs, up, down,
 *   left, right, home; on a pad without the standard mapping, whose buttons mean nothing known, b0, b1... (the stick
 *   still moves). connect and disconnect report pads ({Pad}); change reports a new Kind.
 * - A pad reported twice (XInput and HID, Steam) presses once; the stick goes the way it leans most; the pad drives
 *   the page only while the page is shown and has the focus, and one Elemenx drives it when several Applications or
 *   widgets use pads (the first to start: window.ElemenxGamepad); the events reach all of them.
 * On(name, callback) / Off(callback). Pads() lists [{Index, ID, Kind}]; Kind() is the kind of the pad used last
 * (xbox, playstation, nintendo, generic, or '' when there is none); Label(button, kind) the name of a button on that
 * kind of pad (A, ✕, B...). Navigate (true) turns the keys and the focus off when false (the events stay).
 * Move(direction, scope) moves the focus to the nearest control left, right, up or down (inside the open dialog,
 * or scope); the keyboard may call it too. Browsers report a pad once a button of it is pressed on the page.
 */
Elemenx.Service('Gamepad', {
	Navigate: true,
	Threshold: 0.5,
	Delay: 400,
	Repeat: 120,
	Buttons: ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'select', 'start', 'ls', 'rs', 'up', 'down', 'left', 'right', 'home'],
	Labels: {
		xbox: {a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', select: 'View', start: 'Menu', ls: 'LS', rs: 'RS', up: '↑', down: '↓', left: '←', right: '→', home: 'Xbox'},
		playstation: {a: '✕', b: '○', x: '□', y: '△', lb: 'L1', rb: 'R1', lt: 'L2', rt: 'R2', select: 'Create', start: 'Options', ls: 'L3', rs: 'R3', up: '↑', down: '↓', left: '←', right: '→', home: 'PS'},
		nintendo: {a: 'B', b: 'A', x: 'Y', y: 'X', lb: 'L', rb: 'R', lt: 'ZL', rt: 'ZR', select: '−', start: '+', ls: 'LS', rs: 'RS', up: '↑', down: '↓', left: '←', right: '→', home: 'Home'}
	},

	$OnCreate: function () {
		var self = this;

		this.Listeners = {};
		this.Pressed = {};
		this.Held = {};
		this.Known = {};
		this.Last = '';
		this.Frame = 0;

		this.Connected = function (event) {
			self.Track(event.gamepad, true);
		};

		this.Disconnected = function (event) {
			self.Track(event.gamepad, false);
		};

		this.Tick = function () {
			self.Frame = 0;

			self.Poll();

			if (Object.keys(self.Known).length)
				self.Frame = window.requestAnimationFrame(self.Tick);
		};

		window.addEventListener('gamepadconnected', this.Connected);
		window.addEventListener('gamepaddisconnected', this.Disconnected);

		this.Read().forEach(function (pad) {
			self.Track(pad, true);
		});
	},

	$OnDestroy: function () {
		this.Destroyed = true;

		if (window.ElemenxGamepad === this)
			window.ElemenxGamepad = null;

		window.removeEventListener('gamepadconnected', this.Connected);
		window.removeEventListener('gamepaddisconnected', this.Disconnected);
		window.cancelAnimationFrame(this.Frame);
	},

	/* The pads the browser reports now. */
	Read: function () {
		var list;

		try {
			list = navigator.getGamepads ? navigator.getGamepads() : [];
		}
		catch (error) {
			list = [];
		}

		return Array.prototype.filter.call(list || [], Boolean);
	},

	KindOf: function (id) {
		var text = String(id || '');
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

			if (!this.Frame)
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
	State: function (pad) {
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

			own = self.State(pad);

			Object.keys(own).forEach(function (name) {
				if (!state[name])
					state[name] = own[name];
			});
		});

		Object.keys(this.Held).forEach(function (name) {
			if (!state[name])
				delete self.Held[name];
		});

		Object.keys(state).forEach(function (name) {
			var direction = /^(up|down|left|right)$/.test(name);

			if (!previous[name]) {
				self.Held[name] = now + self.Delay;

				self.Press(name, state[name]);
			}
			else if (direction && self.Held[name] <= now) {
				self.Held[name] = now + self.Repeat;

				self.Press(name, state[name]);
			}
		});

		this.Pressed = state;
	},

	/*
	 * Whether the pad drives this page now: the page is shown and has the focus, and no other Elemenx (another
	 * Application, a widget with an Elemenx of its own) drives it already; the first one that started does.
	 */
	Leads: function () {
		var owner = window.ElemenxGamepad;

		if (document.visibilityState === 'hidden' || typeof document.hasFocus === 'function' && !document.hasFocus()) return false;

		if (!owner || owner.Destroyed) {
			window.ElemenxGamepad = this;

			return true;
		}

		return owner === this;
	},

	/* A button went down: its event, then its key. */
	Press: function (name, pad) {
		var kind = this.KindOf(pad.id);
		var entry = this.Known[pad.index] || {Index: pad.index, ID: pad.id, Kind: kind};

		if (kind !== this.Last) {
			this.Last = kind;

			this.Emit('change', {Kind: kind});
		}

		this.Emit('button', {Button: name, Pad: entry});

		if (this.Navigate && this.Leads())
			this.Act(name);
	},

	/* The element the keys of a pad go to: the focused one, or the open dialog, or the page. */
	Target: function () {
		var active = document.activeElement;

		while (active && active.shadowRoot && active.shadowRoot.activeElement) {
			active = active.shadowRoot.activeElement;
		}

		return active && active !== document.body ? active : this.Dialog() || document.body;
	},

	/* The open modal dialog on top, or null. */
	Dialog: function () {
		var list = Array.prototype.filter.call(document.querySelectorAll('dialog[open]'), function (dialog) {
			return dialog.matches(':modal') || dialog.getAttribute('aria-modal') === 'true';
		});

		return list[list.length - 1] || null;
	},

	/* Sends a key to an element; returns whether a component took it (prevented its default). */
	Key: function (target, key, options) {
		var init = {key: key, code: key === ' ' ? 'Space' : key, bubbles: true, cancelable: true, composed: true, shiftKey: !!(options && options.Shift)};
		var down = new KeyboardEvent('keydown', init);
		var taken = !target.dispatchEvent(down);

		target.dispatchEvent(new KeyboardEvent('keyup', init));

		return taken;
	},

	Act: function (name) {
		var target = this.Target();
		var directions = {up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight'};
		var dialog;
		var cancel;

		if (directions[name]) {
			if (!this.Key(target, directions[name]))
				this.Move(name);

			return;
		}

		/* A is Enter and X is Space: what a component leaves of them presses the control, as the keyboard would. */
		if (name === 'a' || name === 'x') {
			if (!this.Key(target, name === 'a' ? 'Enter' : ' ') && this.Pressable(target, name === 'x'))
				target.click();

			return;
		}

		/* B is Escape: the focused component takes it first (a popup closes), then the dialog on top is cancelled. */
		if (name === 'b') {
			if (this.Key(target, 'Escape')) return;

			dialog = this.Dialog();

			if (dialog) {
				cancel = new Event('cancel', {cancelable: true});

				if (dialog.dispatchEvent(cancel))
					dialog.close();
			}

			return;
		}

		if (name === 'y')
			this.Key(target, 'Delete');
	},

	/* Whether A (or X, space) left to the page presses a control: a button, a link (not by X), a check box... */
	Pressable: function (target, space) {
		var role = target.getAttribute && target.getAttribute('role') || '';
		var type = String(target.type || '').toLowerCase();

		if (!target || target === document.body || typeof target.click !== 'function' || target.disabled) return false;

		if (target.tagName === 'BUTTON' || target.tagName === 'SUMMARY' || target.tagName === 'LABEL') return true;

		if (target.tagName === 'A')
			return !space && target.hasAttribute('href');

		if (target.tagName === 'INPUT')
			return /^(button|submit|reset|checkbox|radio|file|color|image)$/.test(type);

		return /^(button|link|menuitem|menuitemcheckbox|menuitemradio|option|tab|checkbox|radio|switch|treeitem)$/.test(role);
	},

	/* The controls the focus may go to inside a scope, as they are shown. */
	Focusable: function (scope) {
		var selector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

		return Array.prototype.filter.call(scope.querySelectorAll(selector), function (element) {
			var rect = element.getBoundingClientRect();
			if (!rect.width || !rect.height || element.closest('[inert]')) return false;
			if (element.checkVisibility && !element.checkVisibility({visibilityProperty: true})) return false;

			return true;
		});
	},

	Move: function (direction, scope) {
		var root = scope || this.Dialog() || document;
		var active = this.Target();
		var list = this.Focusable(root);
		var from;
		var best = null;
		var score = Infinity;

		if (!list.length) return false;

		/* Nothing focused yet: the first control in view, not the first of the page (that would scroll away). */
		if (!active || active === document.body || active === root || list.indexOf(active) === -1 && !root.contains(active)) {
			best = list.filter(function (element) {
				var rect = element.getBoundingClientRect();

				return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
			})[0] || list[0];

			best.focus();

			return true;
		}

		from = active.getBoundingClientRect();

		list.forEach(function (element) {
			var rect;
			var primary;
			var secondary;
			var value;

			if (element === active || element.contains(active)) return;

			rect = element.getBoundingClientRect();

			if (direction === 'right') {
				primary = rect.left - from.right;
				secondary = Math.max(0, Math.max(rect.top, from.top) - Math.min(rect.bottom, from.bottom));
			}
			else if (direction === 'left') {
				primary = from.left - rect.right;
				secondary = Math.max(0, Math.max(rect.top, from.top) - Math.min(rect.bottom, from.bottom));
			}
			else if (direction === 'down') {
				primary = rect.top - from.bottom;
				secondary = Math.max(0, Math.max(rect.left, from.left) - Math.min(rect.right, from.right));
			}
			else {
				primary = from.top - rect.bottom;
				secondary = Math.max(0, Math.max(rect.left, from.left) - Math.min(rect.right, from.right));
			}

			if (primary < -1) return;

			value = Math.max(0, primary) + secondary * 2 + Math.abs((rect.top + rect.bottom) / 2 - (from.top + from.bottom) / 2) * (direction === 'left' || direction === 'right' ? 0.1 : 0) + Math.abs((rect.left + rect.right) / 2 - (from.left + from.right) / 2) * (direction === 'up' || direction === 'down' ? 0.1 : 0);

			if (value < score) {
				score = value;
				best = element;
			}
		});

		if (!best)
			return false;

		best.focus();

		if (best.scrollIntoView)
			best.scrollIntoView({block: 'nearest', inline: 'nearest'});

		return true;
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
				window.setTimeout(function () {
					throw error;
				}, 0);
			}
		});
	}
});

/* Gamepads work every page of ElemenxUI from its start, not only once a component asks for the Service. */
Elemenx.Service('Gamepad').Pads();
