/*
 * Confirmations and alerts from the code, shown by a DialogHost (place one in the layout of the Application): a modal
 * Dialog without one of its own in a template.
 * Confirm(options, callback) shows a dialog and calls back (id): the ID of the action pressed, or null when it was
 * dismissed (Escape, the backdrop, the close button). It returns the ID of the dialog. Options:
 * - Title, Message, Icon;
 * - Actions: [{ID, Label, Variant}], Cancel and OK by default; Variant: danger paints OK as a dangerous action;
 * - Dismissible: false asks for one of the actions: Escape and the backdrop only shake the dialog, which has no close
 *   button.
 * Alert(options, callback) has one action, OK. A string is the Message of the options. Close(id, action) closes a
 * dialog from the code and calls back with action. OnChange(callback)/OffChange(callback) report the list.
 */
Elemenx.Service('Dialogs', {
	$OnCreate: function () {
		this.Items = [];
		this.Listeners = [];
		this.Sequence = 0;
	},

	$OnDestroy: function () {
		this.Items = [];
		this.Listeners = [];
	},

	Confirm: function (options, callback) {
		var dialog;

		options = typeof options === 'string' ? {Message: options} : options || {};

		this.Sequence++;

		dialog = {
			ID: 'dialog-' + this.Sequence,
			Title: options.Title || '',
			Message: options.Message || '',
			Icon: options.Icon || '',
			Dismissible: options.Dismissible !== false,
			Actions: (options.Actions || [{ID: 'cancel', Label: Elemenx.Locale.Text('ui.dialogs.cancel')}, {ID: 'ok', Label: Elemenx.Locale.Text('ui.dialogs.ok'), Variant: options.Variant === 'danger' ? 'danger' : 'primary'}]).map(function (action) {
				return {ID: String(action.ID), Label: action.Label || String(action.ID), Variant: action.Variant || 'secondary'};
			}),
			Callback: typeof callback === 'function' ? callback : null
		};

		this.Items = this.Items.concat([dialog]);

		this.Changed();

		return dialog.ID;
	},

	Alert: function (options, callback) {
		var copy = {};
		var key;

		options = typeof options === 'string' ? {Message: options} : options || {};

		for (key in options) {
			if (Object.prototype.hasOwnProperty.call(options, key))
				copy[key] = options[key];
		}

		copy.Actions = [{ID: 'ok', Label: Elemenx.Locale.Text('ui.dialogs.ok'), Variant: 'primary'}];

		return this.Confirm(copy, callback);
	},

	Close: function (id, action) {
		var dialog = this.Find(id);
		if (!dialog) return;

		this.Items = this.Items.filter(function (item) {
			return item.ID !== id;
		});

		this.Changed();

		if (dialog.Callback)
			dialog.Callback(action === undefined || action === null ? null : String(action));
	},

	Find: function (id) {
		var i = 0;

		while (i < this.Items.length) {
			if (this.Items[i].ID === id) return this.Items[i];

			i++;
		}

		return null;
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
