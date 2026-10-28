/*
 * The theme of the page: a policy of the color scheme and a named theme.
 * The policy is 'system' (follows the operating system), 'light' or 'dark'. The theme is 'default' (index.css) or a
 * named one: the Library brings 'contrast', 'darcula', 'soft', 'fantasy' and 'scifi' (themes/), and Register adds the themes of the
 * Application. A theme is plain CSS whose rules start with its attribute: [data-theme][data-theme='ocean'] { ... } for
 * both schemes, [data-theme][data-theme='ocean'][data-scheme='dark'] { ... } for the dark one; such a rule is more
 * specific than the rule of a Component it overrides, so the order of the stylesheets does not matter.
 * body[data-theme] holds the policy under the default theme (so index.css applies it before any script runs) and the
 * name of a named theme; body[data-scheme] always holds the scheme shown, 'light' or 'dark'.
 * Scope(element, name, callback) themes one part of the page: the element and everything in it take a named theme or a
 * policy ('light', 'dark', 'system') of their own, whatever the page shows; null gives the element back to the page.
 * The policy and the theme are remembered in localStorage (StorageKey, Persist) and changes are reported, including
 * system changes under 'system'. The first policy comes from localStorage, then from the data-theme of the page,
 * then from Default. In a native program the parts of the system (dialogs, menus, the buttons of the window) take the
 * scheme too (Platform.Scheme).
 */
Elemenx.Service('Theme', {
	$Meta: {
		Description: 'The theme of the page: a policy of the color scheme and a named theme.',
		Methods: ['Scope(element, name, callback)']
	},
	Default: 'system',
	Persist: true,
	StorageKey: 'elemenx-theme',
	Policies: ['system', 'light', 'dark'],
	Library: 'ElemenxUI',
	Builtin: {
		contrast: {Label: 'High contrast', Key: 'ui.theme.contrast', Schemes: ['light', 'dark']},
		darcula: {Label: 'Darcula', Key: 'ui.theme.darcula', Schemes: ['dark']},
		soft: {Label: 'Soft', Key: 'ui.theme.soft', Schemes: ['light', 'dark']},
		fantasy: {Label: 'Fantasy', Key: 'ui.theme.fantasy', Schemes: ['dark']},
		scifi: {Label: 'Sci-fi', Key: 'ui.theme.scifi', Schemes: ['dark']}
	},

	$OnCreate: function () {
		var self = this;
		var attribute = document.body.getAttribute('data-theme');
		var stored = null;
		var name = null;
		var key;

		this.Listeners = [];
		this.Registry = {default: {Name: 'default', Label: 'Default', Key: 'ui.theme.default', Schemes: ['light', 'dark'], URL: '', Link: null, State: 'ready', Callbacks: []}};
		this.Name = 'default';
		this.Media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

		for (key in this.Builtin) {
			if (this.Builtin.hasOwnProperty(key))
				this.Register(key, this.Builtin[key]);
		}

		this.SystemChanged = function () {
			if (self.Current !== 'system') return;

			self.Apply();
			self.Changed();
		};

		if (this.Media && this.Media.addEventListener)
			this.Media.addEventListener('change', this.SystemChanged);

		try {
			stored = this.Persist ? window.localStorage.getItem(this.StorageKey) : null;
			name = this.Persist ? window.localStorage.getItem(this.StorageKey + '-name') : null;
		}
		catch (error) {
			stored = null;
		}

		this.Current = this.Valid(stored) ? stored : this.Valid(attribute) ? attribute : this.Default;

		/* A page may name its theme in its markup: <body data-theme="darcula">. */
		if (!name && attribute && !this.Valid(attribute) && this.Registry[attribute])
			name = attribute;

		this.Apply();

		/* A remembered theme of the Application shows as soon as the Application registers it. */
		this.Wanted = name && name !== 'default' ? name : '';

		if (this.Wanted && this.Registry[this.Wanted])
			this.Use(this.Wanted);
	},

	$OnDestroy: function () {
		if (this.Media && this.Media.removeEventListener)
			this.Media.removeEventListener('change', this.SystemChanged);

		if (this.Observer)
			this.Observer.disconnect();

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

		this.Store(this.StorageKey, value);
		this.Apply();
		this.Changed();

		return value;
	},

	/* The scheme actually shown: 'light' or 'dark'. A theme made for one scheme only always shows it. */
	Resolved: function () {
		var schemes = this.Registry[this.Name].Schemes;
		var scheme = this.Current !== 'system' ? this.Current : this.Media && this.Media.matches ? 'dark' : 'light';

		return schemes.indexOf(scheme) !== -1 ? scheme : schemes[0];
	},

	/* Moves to the next policy: system, light, dark, system... */
	Next: function () {
		return this.Policy(this.Policies[(this.Policies.indexOf(this.Current) + 1) % this.Policies.length]);
	},

	/*
	 * Adds a named theme: {URL, Label, Schemes}. With a URL, the stylesheet is loaded when the theme is first used;
	 * without one, the stylesheet is already on the page (an index.js of the Application, a <link> of its page).
	 * Schemes lists the schemes the theme is made for, ['light', 'dark'] by default.
	 */
	Register: function (name, options) {
		var old = this.Registry[name];

		options = options || {};

		if (!/^[a-z][a-z0-9-]*$/.test(String(name)) || name === 'default' || this.Valid(name))
			throw new Error('Elemenx Theme name must be a lowercase word other than default, system, light and dark: ' + name);

		if (old && old.Link && old.Link.parentNode)
			old.Link.parentNode.removeChild(old.Link);

		this.Registry[name] = {
			Name: name,
			Label: options.Label || name,
			Schemes: options.Schemes && options.Schemes.length ? options.Schemes.slice() : ['light', 'dark'],
			URL: options.URL || '',
			Link: null,
			State: options.URL ? 'idle' : 'ready',
			Callbacks: []
		};

		if (this.Wanted === name && this.Name === 'default')
			this.Use(name);

		return name;
	},

	/* The themes: [{Name, Label, Schemes}], the default one first. */
	Themes: function () {
		var list = [];
		var name;

		for (name in this.Registry) {
			if (this.Registry.hasOwnProperty(name))
				list.push({Name: name, Label: this.Registry[name].Key ? Elemenx.Locale.Text(this.Registry[name].Key) : this.Registry[name].Label, Schemes: this.Registry[name].Schemes.slice()});
		}

		return list;
	},

	/* The name of the theme shown: 'default' or a named theme. */
	Theme: function () {
		return this.Name;
	},

	/*
	 * Shows the theme name ('default' goes back to index.css). Its stylesheet loads first if it has to; then the theme
	 * applies and callback gets (error). A stylesheet that fails to load leaves the theme as it was.
	 */
	Scope: function (element, name, callback) {
		var self = this;
		var theme = name && this.Registry[name];
		var done = function (error) {
			if (callback)
				self.Notify(callback, error || null);
		};

		if (!element || element.nodeType !== 1)
			throw new Error('Elemenx Theme.Scope expects an element');

		if (!name || name === 'default') {
			element.removeAttribute('data-theme');
			element.removeAttribute('data-scheme');

			done(null);

			return;
		}

		if (this.Policies.indexOf(name) !== -1) {
			element.setAttribute('data-theme', name);

			if (name === 'system') element.removeAttribute('data-scheme');
			else element.setAttribute('data-scheme', name);

			done(null);

			return;
		}

		if (!theme)
			throw new Error('Elemenx Theme is not registered: ' + name);

		this.Load(theme, function (error) {
			if (!error) {
				element.setAttribute('data-theme', name);
				element.setAttribute('data-scheme', theme.Schemes && theme.Schemes.length === 1 ? theme.Schemes[0] : self.Resolved());
			}

			done(error);
		});
	},

	Use: function (name, callback) {
		var self = this;
		var theme = this.Registry[name];
		if (!theme)
			throw new Error('Elemenx Theme is not registered: ' + name);

		this.Load(theme, function (error) {
			if (!error && self.Registry[name] === theme) {
				self.Name = name;
				self.Wanted = '';

				self.Store(self.StorageKey + '-name', name);
				self.Apply();
				self.Changed();
			}

			if (callback)
				self.Notify(callback, error || null);
		});
	},

	Load: function (theme, callback) {
		var self = this;
		var link;

		if (theme.State === 'ready') {
			callback(null);

			return;
		}

		theme.Callbacks.push(callback);

		if (theme.State === 'loading') return;

		theme.State = 'loading';

		link = document.createElement('link');

		link.rel = 'stylesheet';
		link.href = theme.URL;

		link.setAttribute('data-elemenx-theme', theme.Name);

		link.onload = function () {
			self.Shadow(theme);
			self.Settle(theme, 'ready', null);
		};

		link.onerror = function () {
			if (link.parentNode)
				link.parentNode.removeChild(link);

			theme.Link = null;

			self.Settle(theme, 'idle', new Error('Elemenx Theme ' + theme.Name + ' failed to load: ' + theme.URL));
		};

		theme.Link = link;

		(document.head || document.documentElement).appendChild(link);

		this.Last();
	},

	Settle: function (theme, state, error) {
		var callbacks = theme.Callbacks;
		var i = 0;

		theme.State = state;
		theme.Callbacks = [];

		while (i < callbacks.length) {
			callbacks[i](error);

			i++;
		}
	},

	/*
	 * Keeps the stylesheets of the themes after every other one of the head, also after the styles that Components add
	 * when they first show: a rule of a theme then wins over a rule of a Component as specific as itself.
	 */
	Last: function () {
		var self = this;
		var head = document.head;
		if (this.Observer || !head || typeof MutationObserver === 'undefined') return;

		this.Observer = new MutationObserver(function () {
			var links = head.querySelectorAll('link[data-elemenx-theme]');
			var i = 0;

			if (!links.length || head.lastElementChild === links[links.length - 1]) return;

			while (i < links.length) {
				head.appendChild(links[i]);

				i++;
			}

			self.Observer.takeRecords();
		});

		this.Observer.observe(head, {childList: true});
	},

	Store: function (key, value) {
		try {
			if (this.Persist)
				window.localStorage.setItem(key, value);
		}
		catch (error) {
			/* Storage may be unavailable (private mode); the theme still applies to this page. */
		}
	},

	/* The mount of the Application when it renders in a shadow root, or null. */
	Host: function () {
		var application = this.$Application && this.$Application();
		var host = application && application.$Mount ? application.$Mount() : null;

		return host && host !== document.body && host.shadowRoot ? host : null;
	},

	/* A shadow root cannot use the <link> of the head: the rules of the theme go there through Elemenx.Style. */
	Shadow: function (theme) {
		if (!this.Host()) return;

		Elemenx.Resource.Load(theme.URL, function (error, text) {
			if (!error)
				Elemenx.Style('theme:' + theme.Name, text);
		});
	},

	Apply: function () {
		var targets = [document.body].concat(this.Host() || []);
		var i = 0;

		while (i < targets.length) {
			targets[i].setAttribute('data-theme', this.Name === 'default' ? this.Current : this.Name);
			targets[i].setAttribute('data-scheme', this.Resolved());

			i++;
		}

		/* In a program the parts of the system follow (its dialogs, menus and buttons of the window): the policy, or the one scheme of a theme. */
		if (window.ElemenxNative)
			this.$Service('Platform').Scheme(this.Current === 'system' && this.Registry[this.Name].Schemes.length > 1 ? 'system' : this.Resolved());
	},

	/*
	 * The channels of a CSS color, 'r, g, b', for the rgba() of the -rgb tokens of a theme
	 * (rgba(var(--elemenx-accent-rgb), 0.12)); null for no color or an unknown one. Hex colors and rgb() are read
	 * directly, any other color through a canvas.
	 */
	Channels: function (color) {
		var value = String(color || '').trim();
		var context;
		var hex;
		var match;

		if (!value)
			return null;

		if (!/^#|^rgba?\(/i.test(value)) {
			context = this.Painter || (this.Painter = document.createElement('canvas').getContext('2d'));

			if (!context) return null;

			context.fillStyle = '#010203';
			context.fillStyle = value;

			if (context.fillStyle === '#010203' && value.toLowerCase() !== '#010203') return null;

			value = context.fillStyle;
		}

		match = /^#([0-9a-f]{3,8})$/i.exec(value);

		if (match) {
			hex = match[1].length < 6 ? match[1].replace(/./g, '$&$&') : match[1];

			return parseInt(hex.substring(0, 2), 16) + ', ' + parseInt(hex.substring(2, 4), 16) + ', ' + parseInt(hex.substring(4, 6), 16);
		}

		match = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(value);

		return match ? match[1] + ', ' + match[2] + ', ' + match[3] : null;
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
		var state = {Policy: this.Current, Theme: this.Resolved(), Name: this.Name};
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
