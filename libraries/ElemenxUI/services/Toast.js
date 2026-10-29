/*
 * Notifications shown by a ToastHost (place one in the layout of the Application).
 * Show(options) returns the ID of the toast. Options:
 * - Title, Message, Variant (info, success, warning, danger), Icon (a name, or false for none), Class (extra classes);
 * - AutoHide and Duration (milliseconds): the toast closes by itself unless AutoHide is false or Duration is 0;
 * - Actions: [{Label, Run, Variant}] (Action: one of them); Closable: false hides the close button;
 * - Element (a DOM node, for example the element of a Component) or Render(container, toast) for custom content.
 * Configure({Duration, AutoHide, Limit}) changes the defaults. Dismiss(id), Clear(); Pause(id) and Resume(id) hold
 * the timer while the toast is hovered or focused. OnChange(callback)/OffChange(callback) report the list.
 */
Elemenx.Service('Toast', {
	$Meta: {
		Description: 'Notifications shown by a ToastHost (place one in the layout of the Application).',
		Methods: ['Configure(options)', 'Show(options)', 'Dismiss(id)', 'Clear()', 'Pause(id)', 'Resume(id)', 'OnChange(callback)', 'OffChange(callback)']
	},
	Duration: 5000,
	AutoHide: true,
	Limit: 5,

	$OnCreate: function () {
		this.Items = [];
		this.Timers = {};
		this.Listeners = this.$Service('ElemenxHelpers').Listeners();
		this.Sequence = 0;
	},

	$OnDestroy: function () {
		var id;

		for (id in this.Timers) {
			if (Object.prototype.hasOwnProperty.call(this.Timers, id))
				window.clearTimeout(this.Timers[id]);
		}

		this.Timers = {};

		this.Listeners.Clear();
	},

	Configure: function (options) {
		options = options || {};

		if (options.Duration != null)
			this.Duration = Number(options.Duration);

		if (options.AutoHide != null)
			this.AutoHide = !!options.AutoHide;

		if (options.Limit != null)
			this.Limit = Number(options.Limit);
	},

	Show: function (options) {
		var toast;
		var actions;

		options = typeof options === 'string' ? {Message: options} : options || {};
		actions = options.Actions || (options.Action ? [options.Action] : []);

		this.Sequence++;

		toast = {
			ID: 'toast-' + this.Sequence,
			Title: options.Title || '',
			Message: options.Message || '',
			Variant: options.Variant || 'info',
			Icon: options.Icon === false ? '' : options.Icon || {info: 'info', success: 'success', warning: 'warning', danger: 'error'}[options.Variant || 'info'] || 'info',
			Class: options.Class || '',
			AutoHide: options.AutoHide == null ? this.AutoHide : !!options.AutoHide,
			Duration: options.Duration == null ? this.Duration : Number(options.Duration),
			Actions: actions,
			Closable: options.Closable !== false,
			Element: options.Element || null,
			Render: typeof options.Render === 'function' ? options.Render : null,
			Remaining: 0
		};

		toast.Timed = toast.AutoHide && toast.Duration > 0;
		toast.Remaining = toast.Duration;

		this.Items = this.Items.concat([toast]).slice(-this.Limit);

		this.Resume(toast.ID);
		this.Changed();

		return toast.ID;
	},

	Dismiss: function (id) {
		window.clearTimeout(this.Timers[id]);

		delete this.Timers[id];

		this.Items = this.Items.filter(function (toast) {
			return toast.ID !== id;
		});

		this.Changed();
	},

	Clear: function () {
		var id;

		for (id in this.Timers) {
			if (Object.prototype.hasOwnProperty.call(this.Timers, id))
				window.clearTimeout(this.Timers[id]);
		}

		this.Timers = {};
		this.Items = [];

		this.Changed();
	},

	Find: function (id) {
		var i = 0;

		while (i < this.Items.length) {
			if (this.Items[i].ID === id) return this.Items[i];

			i++;
		}

		return null;
	},

	/* The timer keeps its remaining time, so a toast that was hovered closes after what was left, not a full Duration. */
	Pause: function (id) {
		var toast = this.Find(id);
		if (!toast || !this.Timers[id]) return;

		window.clearTimeout(this.Timers[id]);

		delete this.Timers[id];

		toast.Remaining = Math.max(0, toast.Deadline - Date.now());
	},

	Resume: function (id) {
		var self = this;
		var toast = this.Find(id);
		if (!toast || !toast.Timed || this.Timers[id]) return;

		toast.Deadline = Date.now() + toast.Remaining;

		this.Timers[id] = window.setTimeout(function () {
			self.Dismiss(id);
		}, toast.Remaining);
	},

	Run: function (id, index) {
		var toast = this.Find(id);
		var action = toast && toast.Actions[index || 0];
		if (action && typeof action.Run === 'function')
			action.Run(toast);

		if (!action || action.Keep !== true)
			this.Dismiss(id);
	},

	OnChange: function (callback) {
		return this.Listeners.On(callback);
	},

	OffChange: function (callback) {
		this.Listeners.Off(callback);
	},

	Changed: function () {
		this.Listeners.Tell(this.Items.slice());
	}
});