/*
 * The inactivity of the user, as a banking application that signs out after some minutes. Start(options) watches:
 * options {Timeout (milliseconds without a key, a press, a wheel or a move), Warning (milliseconds before Timeout
 * when OnWarn is called), OnWarn(remaining), OnIdle(), OnActive()}. Activity in another tab of the same site counts
 * too (localStorage, StorageKey). Reset() counts from now, Stop() ends the watch, Remaining() is the time left,
 * State() is 'active', 'warning', 'idle' or 'stopped'. OnActive is called when the user comes back after a warning
 * or after going idle.
 */
Elemenx.Service('Idle', {
	StorageKey: 'elemenx-idle',

	$OnCreate: function () {
		var self = this;

		this.Options = null;
		this.Last = 0;
		this.Current = 'stopped';
		this.Timer = 0;
		this.Moved = 0;

		/* Moves come often: one a second is enough. */
		this.Activity = function (event) {
			var now = Date.now();
			if (event && event.type === 'pointermove' && now - self.Moved < 1000) return;

			self.Moved = now;

			self.Touch(now, true);
		};

		this.Shared = function (event) {
			if (event.key === self.StorageKey && event.newValue)
				self.Touch(Number(event.newValue) || Date.now(), false);
		};

		this.Visible = function () {
			if (document.visibilityState === 'visible')
				self.Check();
		};
	},

	$OnDestroy: function () {
		this.Stop();
	},

	Events: ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart', 'scroll'],

	Start: function (options) {
		var self = this;

		this.Stop();

		this.Options = options || {};
		this.Current = 'active';

		this.Events.forEach(function (name) {
			window.addEventListener(name, self.Activity, true);
		});

		window.addEventListener('storage', this.Shared);
		document.addEventListener('visibilitychange', this.Visible);

		this.Touch(Date.now(), true);
	},

	Stop: function () {
		var self = this;

		window.clearTimeout(this.Timer);

		this.Events.forEach(function (name) {
			window.removeEventListener(name, self.Activity, true);
		});

		window.removeEventListener('storage', this.Shared);
		document.removeEventListener('visibilitychange', this.Visible);

		this.Options = null;
		this.Current = 'stopped';
	},

	Reset: function () {
		if (this.Options)
			this.Touch(Date.now(), true);
	},

	State: function () {
		return this.Current;
	},

	Remaining: function () {
		if (!this.Options) return 0;

		return Math.max(0, this.Last + (Number(this.Options.Timeout) || 0) - Date.now());
	},

	/* Activity at time: from this tab (share: tell the other tabs) or from another one. */
	Touch: function (time, share) {
		var before = this.Current;

		if (!this.Options || time < this.Last) return;

		this.Last = time;

		if (share) {
			try {
				window.localStorage.setItem(this.StorageKey, String(time));
			}
			catch (error) {
				/* Other tabs do not hear of it. */
			}
		}

		if (before === 'warning' || before === 'idle') {
			this.Current = 'active';

			if (typeof this.Options.OnActive === 'function')
				this.Options.OnActive();
		}

		this.Check();
	},

	/* Works out the state from the time left and waits for the next change. */
	Check: function () {
		var self = this;
		var options = this.Options;
		var remaining;
		var warning;

		if (!options) return;

		window.clearTimeout(this.Timer);

		remaining = this.Remaining();
		warning = Number(options.Warning) || 0;

		if (remaining <= 0) {
			if (this.Current !== 'idle') {
				this.Current = 'idle';

				if (typeof options.OnIdle === 'function')
					options.OnIdle();
			}

			return;
		}

		if (warning && remaining <= warning) {
			if (this.Current !== 'warning') {
				this.Current = 'warning';

				if (typeof options.OnWarn === 'function')
					options.OnWarn(remaining);
			}

			this.Timer = window.setTimeout(function () {
				self.Check();
			}, remaining);

			return;
		}

		this.Timer = window.setTimeout(function () {
			self.Check();
		}, warning ? remaining - warning : remaining);
	}
});
