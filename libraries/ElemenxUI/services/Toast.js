/*
 * Notifications shown by a ToastHost (place one in the layout of the Application).
 * Show({Title, Message, Variant, Duration, Action}) returns the ID of the toast. Variant: info, success, warning,
 * danger. Duration in milliseconds (5000 by default, 0 keeps the toast until it is closed). Action: {Label, Run}.
 * Dismiss(id), Clear(); Pause(id) and Resume(id) hold the timer while the pointer is over the toast.
 * OnChange(callback)/OffChange(callback) report the list of toasts.
 */
Elemenx.Service('Toast', {
	Duration: 5000,
	Limit: 5,

	$OnCreate: function () {
		this.Items = [];
		this.Timers = {};
		this.Listeners = [];
		this.Sequence = 0;
	},

	$OnDestroy: function () {
		var id;

		for (id in this.Timers) {
			if (Object.prototype.hasOwnProperty.call(this.Timers, id))
				window.clearTimeout(this.Timers[id]);
		}

		this.Timers = {};
		this.Listeners = [];
	},

	Show: function (options) {
		var toast;

		options = typeof options === 'string' ? {Message: options} : options || {};

		this.Sequence++;

		toast = {
			ID: 'toast-' + this.Sequence,
			Title: options.Title || '',
			Message: options.Message || '',
			Variant: options.Variant || 'info',
			Duration: options.Duration == null ? this.Duration : Number(options.Duration),
			Action: options.Action || null
		};

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
		var ids = this.Items.map(function (toast) {
			return toast.ID;
		});
		var i = 0;

		while (i < ids.length) {
			window.clearTimeout(this.Timers[ids[i]]);

			i++;
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

	Pause: function (id) {
		window.clearTimeout(this.Timers[id]);

		delete this.Timers[id];
	},

	Resume: function (id) {
		var self = this;
		var toast = this.Find(id);
		if (!toast || !toast.Duration || this.Timers[id]) return;

		this.Timers[id] = window.setTimeout(function () {
			self.Dismiss(id);
		}, toast.Duration);
	},

	Run: function (id) {
		var toast = this.Find(id);
		if (toast && toast.Action && typeof toast.Action.Run === 'function')
			toast.Action.Run(toast);

		this.Dismiss(id);
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
		var items = this.Items.slice();
		var i = 0;

		while (i < listeners.length) {
			try {
				listeners[i](items);
			}
			catch (error) {
				if (typeof window.reportError === 'function') window.reportError(error);
				else window.setTimeout(this.Rethrow(error), 0);
			}

			i++;
		}
	},

	Rethrow: function (error) {
		return function () {
			throw error;
		};
	}
});