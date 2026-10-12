/*
 * The clipboard. Copy(text, callback, options) writes text (with the old way of a hidden field where the Clipboard
 * API is missing or refused); options.Toast shows a toast through the Toast Service (true: 'Copied', or the
 * message). Read(callback) reads the text (the browser may ask the user). callback(error, text).
 */
Elemenx.Service('Clipboard', {
	Message: 'Copied',

	Copy: function (text, callback, options) {
		var self = this;
		var value = String(text == null ? '' : text);

		callback = callback || function () {};
		options = options || {};

		function done (error) {
			if (!error && options.Toast) {
				try {
					self.$Service('Toast').Show({Message: options.Toast === true ? self.Message : options.Toast, Variant: 'success', Icon: 'copy', Duration: 2000});
				}
				catch (failure) {
					/* No Toast Service in this Application. */
				}
			}

			callback(error || null, value);
		}

		if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
			navigator.clipboard.writeText(value).then(function () {
				done(null);
			}, function () {
				done(self.Fallback(value));
			});

			return;
		}

		done(this.Fallback(value));
	},

	/* The copy command on a hidden field: null when it worked, else an error. */
	Fallback: function (value) {
		var field = document.createElement('textarea');
		var active = document.activeElement;
		var copied = false;

		field.value = value;

		field.setAttribute('readonly', '');

		field.style.position = 'fixed';
		field.style.top = '-1000px';
		field.style.opacity = '0';

		document.body.appendChild(field);

		field.select();

		try {
			copied = document.execCommand('copy');
		}
		catch (error) {
			copied = false;
		}

		document.body.removeChild(field);

		if (active && active.focus)
			active.focus();

		if (copied)
			return null;

		copied = new Error('The clipboard refused the text');
		copied.name = 'NotAllowedError';

		return copied;
	},

	Read: function (callback) {
		if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
			callback(new Error('Reading the clipboard is not supported here'), '');

			return;
		}

		navigator.clipboard.readText().then(function (text) {
			callback(null, text);
		}, function (error) {
			callback(error, '');
		});
	}
});
