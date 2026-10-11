/*
 * The theme policy of the page: 'system' follows the operating system, 'light' and 'dark' force a theme.
 * The policy lives in body[data-theme], so index.css applies it before any script runs; this Service changes it,
 * remembers it in localStorage (StorageKey, Persist) and reports changes, including system changes under 'system'.
 * The first policy comes from localStorage, then from the data-theme of the page, then from Default.
 * Transition: a change of policy repaints the page through a view transition where the browser has one, so the old
 * picture stays until the new one is drawn whole and then fades into it (without it, Chrome with the developer tools
 * open shows frames in which the icons are blank). The attribute then changes a frame later; Changed reports at once.
 */
Elemenx.Service('Theme', {
	Default: 'system',
	Persist: true,
	StorageKey: 'elemenx-theme',
	Policies: ['system', 'light', 'dark'],
	Transition: true,

	$OnCreate: function () {
		var self = this;
		var stored = null;

		this.Listeners = [];
		this.Media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

		this.SystemChanged = function () {
			if (self.Current === 'system')
				self.Changed();
		};

		if (this.Media && this.Media.addEventListener)
			this.Media.addEventListener('change', this.SystemChanged);

		try {
			stored = this.Persist ? window.localStorage.getItem(this.StorageKey) : null;
		}
		catch (error) {
			stored = null;
		}

		this.Current = this.Valid(stored) ? stored : this.Valid(document.body.getAttribute('data-theme')) ? document.body.getAttribute('data-theme') : this.Default;

		this.Apply();
	},

	$OnDestroy: function () {
		if (this.Media && this.Media.removeEventListener)
			this.Media.removeEventListener('change', this.SystemChanged);

		this.Listeners = [];
	},

	Valid: function (policy) {
		return this.Policies.indexOf(policy) !== -1;
	},

	/* Policy() returns the policy; Policy(value) sets 'system', 'light' or 'dark'. */
	Policy: function (value) {
		if (value === undefined) return this.Current;

		if (!this.Valid(value))
			throw new Error('Elemenx Theme policy must be system, light or dark: ' + value);

		if (value === this.Current) return value;

		this.Current = value;

		try {
			if (this.Persist)
				window.localStorage.setItem(this.StorageKey, value);
		}
		catch (error) {
			/* Storage may be unavailable (private mode); the policy still applies to this page. */
		}

		this.Apply(true);
		this.Changed();

		return value;
	},

	/* The theme actually shown: 'light' or 'dark'. */
	Resolved: function () {
		if (this.Current !== 'system') return this.Current;

		return this.Media && this.Media.matches ? 'dark' : 'light';
	},

	/* Moves to the next policy: system, light, dark, system... */
	Next: function () {
		return this.Policy(this.Policies[(this.Policies.indexOf(this.Current) + 1) % this.Policies.length]);
	},

	Apply: function (animate) {
		var self = this;
		var body = document.body;

		/* The policy at the time the page changes: a quick second change must not be undone by the first one. */
		function apply () {
			body.setAttribute('data-theme', self.Current);
		}

		if (animate && this.Transition && typeof document.startViewTransition === 'function' && body.getAttribute('data-theme') !== this.Current) {
			try {
				document.startViewTransition(apply);

				return;
			}
			catch (error) {
				/* A transition that cannot start (another one is running) leaves the change to the plain way. */
			}
		}

		apply();
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);

		return callback;
	},

	OffChange: function (callback) {
		var index = this.Listeners.indexOf(callback);
		if (index !== -1)
			this.Listeners.splice(index, 1);
	},

	Changed: function () {
		var listeners = this.Listeners.slice();
		var state = {Policy: this.Current, Theme: this.Resolved()};
		var i = 0;

		while (i < listeners.length) {
			this.Notify(listeners[i], state);

			i++;
		}
	},

	/* Like a DOM listener: an exception is reported and the other listeners still run. */
	Notify: function (listener, state) {
		try {
			listener(state);
		}
		catch (error) {
			if (typeof window.reportError === 'function') {
				window.reportError(error);
			}
			else {
				window.setTimeout(function () {
					throw error;
				}, 0);
			}
		}
	}
});