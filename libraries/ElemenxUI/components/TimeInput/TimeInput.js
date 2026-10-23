/*
 * A 24-hour time field with its own picker. Value is 'HH:MM' ('HH:MM:SS' with Seconds), '' when empty.
 * The text keeps hours in 00-23 and minutes and seconds in 00-59 while typing; Min and Max limit the value.
 * MinuteStep sets the step of the minute column of the picker; any minute can still be typed.
 */
Elemenx.Component('TimeInput', {
	$TemplateURL: 'TimeInput.html',
	$StyleURL: 'TimeInput.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'clock',
		Description: 'A 24-hour time field with its own picker.',
		Events: ['input', 'change'],
		Props: {
			Value: 'The time: HH:MM, or HH:MM:SS with Seconds; empty when none.',
			Seconds: 'Takes the seconds too.',
			MinuteStep: 'The step of the minutes of the picker.',
			Min: 'The earliest time.',
			Max: 'The latest time.',
			Placeholder: 'The text shown while it is empty.',
			Locale: 'The language of its texts and formats (the language of the page by default).',
			NowLabel: 'The text of the Now button.',
			DoneLabel: 'The text of the Done button.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			ReadOnly: 'Shows the value without letting it change.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {MinuteStep: 15}
	},
	Value: '',
	Seconds: false,
	MinuteStep: 1,
	Min: '',
	Max: '',
	Placeholder: '',
	Locale: '',
	NowLabel: '',
	DoneLabel: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,
	Open: false,
	Text: null,
	Bad: false,

	$OnCreate: function () {
		var self = this;

		this.Units = function (count, step) {
			var units = [];
			var i = 0;

			while (i < count) {
				units.push(self.Pad(i));

				i += Math.max(1, Number(step) || 1);
			}

			return units;
		};

		this.Part = function (value, index) {
			return String(value || '').split(':')[index] || '';
		};

		/* A unit is blocked when no choice of the following parts, after the selected preceding parts, fits Min and Max. */
		this.Blocked = function (index, unit, value, min, max) {
			var count = self.Seconds ? 3 : 2;
			var parts = String(value || '').split(':');
			var low = [];
			var high = [];
			var i = 0;

			while (i < count) {
				if (i < index) {
					low.push(parts[i] || '00');
					high.push(parts[i] || '00');
				}
				else if (i === index) {
					low.push(unit);
					high.push(unit);
				}
				else {
					low.push('00');
					high.push('59');
				}

				i++;
			}

			return (!!max && low.join(':') > self.Full(max)) || (!!min && high.join(':') < self.Full(min));
		};

		this.NowText = this.NowLabel || this.Relative(this.Locale || Elemenx.Locale.Language(), 'second', 'Now');
	},

	Relative: function (locale, unit, fallback) {
		var text;

		try {
			text = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'}).format(0, unit);
		}
		catch (error) {
			return fallback;
		}

		return text.charAt(0).toUpperCase() + text.substring(1);
	},

	Pad: function (value) {
		return value < 10 ? '0' + value : String(value);
	},

	/* A limit with the length of Value: '08:00' becomes '08:00:00' with Seconds. */
	Full: function (limit) {
		var text = String(limit || '');

		return this.Seconds && text.length === 5 ? text + ':00' : text.substring(0, this.Seconds ? 8 : 5);
	},

	Allowed: function (value) {
		return !((this.Min && value < this.Full(this.Min)) || (this.Max && value > this.Full(this.Max)));
	},

	Set: function (value) {
		if (value === this.Value) return;

		this.Value = value;

		this.$Emit('input', value);
		this.$Emit('change', value);
	},

	/* Keeps every typed pair inside its range: '7' becomes '07', '25' drops the 5. */
	Masked: function (event) {
		var digits = event.detail.Value;
		var length = this.Seconds ? 6 : 4;
		var limits = [2, 5, 5];
		var fixed = '';
		var digit;
		var value;
		var i = 0;

		while (i < digits.length) {
			digit = digits.charAt(i);

			if (fixed.length % 2 === 0 && Number(digit) > limits[fixed.length / 2]) {
				fixed += '0' + digit;
			}
			else if (fixed.length !== 1 || Number(fixed + digit) <= 23) {
				fixed += digit;
			}

			i++;
		}

		fixed = fixed.substring(0, length);
		event.detail.Value = fixed;

		this.Text = fixed;
		this.Bad = false;

		if (fixed.length === length) {
			value = fixed.match(/.{2}/g).join(':');

			this.Bad = !this.Allowed(value);

			if (!this.Bad) {
				this.Text = null;

				this.Set(value);
			}
		}
		else if (!fixed) {
			this.Text = null;

			this.Set('');
		}
	},

	Committed: function () {
		if (this.Text !== null && !this.Bad)
			this.Text = null;
	},

	Toggle: function (event, node) {
		var root = node.closest('.elemenx-time');

		if (this.Disabled || this.ReadOnly) return;

		this.Open = !this.Open;

		if (!this.Open) return;

		window.setTimeout(function () {
			var columns = root.querySelectorAll('.elemenx-time-column');
			var first = null;
			var i = 0;
			var selected;

			while (i < columns.length) {
				selected = columns[i].querySelector('.selected');

				if (selected) {
					columns[i].scrollTop = selected.offsetTop - columns[i].clientHeight / 2 + selected.offsetHeight / 2;
					first = first || selected;
				}

				i++;
			}

			first = first || root.querySelector('.elemenx-time-column button');

			if (first)
				first.focus();
		}, 0);
	},

	Pick: function (event, node) {
		var index = Number(node.getAttribute('data-part'));
		var parts = String(this.Value || '').split(':');
		var count = this.Seconds ? 3 : 2;
		var value;
		var i = 0;

		while (i < count) {
			parts[i] = parts[i] || '00';

			i++;
		}

		parts[index] = node.getAttribute('data-unit');
		value = parts.slice(0, count).join(':');

		if (!this.Allowed(value)) return;

		this.Text = null;
		this.Bad = false;

		this.Set(value);
	},

	Now: function () {
		var now = new Date();
		var value = this.Pad(now.getHours()) + ':' + this.Pad(now.getMinutes()) + (this.Seconds ? ':' + this.Pad(now.getSeconds()) : '');
		if (!this.Allowed(value)) return;

		this.Text = null;
		this.Bad = false;

		this.Set(value);
	},

	Done: function () {
		this.Open = false;

		this.$Element().querySelector('.elemenx-input-control').focus();
	},

	ColumnKey: function (event) {
		var button = event.target.closest('.elemenx-time-column button');
		var column;
		var columns;
		var target = null;
		var index;

		if (!button) return;

		column = button.parentNode;
		columns = Array.prototype.slice.call(column.parentNode.querySelectorAll('.elemenx-time-column'));
		index = columns.indexOf(column);

		if (Elemenx.Locale.Key(event) === 'ArrowDown') target = button.nextElementSibling;
		else if (Elemenx.Locale.Key(event) === 'ArrowUp') target = button.previousElementSibling;
		else if (Elemenx.Locale.Key(event) === 'ArrowRight' && columns[index + 1]) target = columns[index + 1].querySelector('.selected') || columns[index + 1].querySelector('button');
		else if (Elemenx.Locale.Key(event) === 'ArrowLeft' && columns[index - 1]) target = columns[index - 1].querySelector('.selected') || columns[index - 1].querySelector('button');
		else if (Elemenx.Locale.Key(event) === 'Enter') this.Done();

		if (!target || target.tagName !== 'BUTTON') return;

		event.preventDefault();

		target.focus();

		if (Elemenx.Locale.Key(event) === 'ArrowDown' || Elemenx.Locale.Key(event) === 'ArrowUp')
			target.click();
	},

	InputKey: function (event, node) {
		if (Elemenx.Locale.Key(event) === 'ArrowDown' && event.altKey) {
			event.preventDefault();

			this.Toggle(event, node);
		}
	},

	Dismissed: function (event) {
		this.Open = false;

		if (event.detail.Reason === 'escape')
			this.$Element().querySelector('.elemenx-input-control').focus();
	}
});