/*
 * Gamepads work the page the way the keyboard does: every component that follows the keys follows a pad too. The
 * pads themselves (their buttons, sticks, kinds and labels, the pads of the page) are of the InputDevices Service of
 * ElemenxCommon; this one moves the page by them.
 * - The d-pad and the left stick send the arrow keys to the focused element; when no component takes an arrow (none
 *   prevents its default), the focus moves to the nearest control on that side (Move). A held direction repeats.
 * - A sends Enter and X Space, and either presses the focused control when no component took the key (a button, a
 *   check box, an option...; A follows a link too); B sends Escape, and cancels the dialog on top when no component
 *   took it (an open popup closes first); Y sends Delete; the other buttons are events of InputDevices only.
 * - The pad drives the page only while the page is shown and has the focus, and one Elemenx drives it when several
 *   Applications or widgets use pads (the first to start: window.ElemenxGamepad); a pad of the page made with
 *   Navigate false (InputDevices.Virtual) drives nothing.
 * Navigate (true) turns the keys and the focus off when false. Move(direction, scope) moves the focus to the nearest
 * control left, right, up or down (inside the open dialog, or scope); the keyboard may call it too.
 */
Elemenx.Service('Gamepad', {
	$Meta: {
		Description: 'Gamepads work the page the way the keyboard does: the arrows, Enter, Escape and the focus, by the pads of InputDevices.',
		Methods: ['Move(direction, scope)']
	},

	Navigate: true,

	$OnCreate: function () {
		var self = this;

		this.Devices = this.$Service('InputDevices');

		this.Pressed = function (detail) {
			if (self.Navigate && !detail.Quiet && self.Leads())
				self.Act(detail.Button);
		};

		this.Devices.On('button', this.Pressed);
	},

	$OnDestroy: function () {
		this.Destroyed = true;

		if (window.ElemenxGamepad === this)
			window.ElemenxGamepad = null;

		this.Devices.Off(this.Pressed);
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
	}
});

/* Gamepads work every page of ElemenxUI from its start, not only once a component asks for the Service. */
Elemenx.Service('Gamepad').$Generation();
