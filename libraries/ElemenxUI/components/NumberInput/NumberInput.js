/*
 * A number field. Value is a number or null. Min and Max bound it, Step is the step of the arrows (Shift: ten steps)
 * and of the buttons beside the field (Controls false hides them), Precision the number of decimals it keeps. Only
 * digits, one point (a comma becomes one) and a leading minus can be typed; the value is bounded and rounded when it is
 * committed. Prefix and Suffix stand inside the field ('$', 'kg'). Size, Shape, Placeholder, Name, Disabled, ReadOnly
 * and Invalid as in Input. Events: input (Value, while typing), change (Value, when committed).
 */
Elemenx.Component('NumberInput', {
	$TemplateURL: 'NumberInput.html',
	$StyleURL: 'NumberInput.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'edit',
		Description: 'A number field.',
		Events: ['input', 'change'],
		Props: {
			Value: 'The number, or null.',
			Min: 'The least number.',
			Max: 'The greatest number.',
			Step: 'The step of the arrows and the buttons (Shift: ten steps).',
			Precision: 'How many decimals it keeps.',
			Placeholder: 'The text shown while it is empty.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Prefix: 'A text before the number ($).',
			Suffix: 'A text after the number (kg).',
			Name: 'The name of its value in a form.',
			Controls: 'Shows the buttons beside the field.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			ReadOnly: 'Shows the value without letting it change.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Min: 0, Step: 0.5, Precision: 2, Prefix: '$'}
	},
	Value: null,
	Min: null,
	Max: null,
	Step: 1,
	Precision: null,
	Placeholder: '',
	Size: 'medium',
	Shape: 'default',
	Prefix: '',
	Suffix: '',
	Name: null,
	Controls: true,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,
	Text: null,

	$OnCreate: function () {
		var self = this;

		/* The typed text stays on screen while it still means the current Value ("1." or "-"). */
		this.Display = function (value, text) {
			if (text !== null && self.ParseNumber(text) === (value === '' || value == null ? null : Number(value))) return text;

			return value === '' || value == null ? '' : String(value);
		};
	},

	Typed: function (event, node) {
		var text = this.Sanitize(node.value);
		if (node.value !== text)
			node.value = text;

		this.Text = text;
		this.Value = this.ParseNumber(text);

		this.$Emit('input', this.Value);
	},

	Committed: function () {
		this.Text = null;
		this.Value = this.Normalize(this.Value);

		this.$Emit('change', this.Value);
	},

	Normalize: function (value) {
		var precision = this.Precision === null || this.Precision === '' ? null : Number(this.Precision);

		if (value === null || value === '' || isNaN(value)) return null;

		value = Number(value);

		if (this.Min !== null && this.Min !== '' && value < Number(this.Min))
			value = Number(this.Min);

		if (this.Max !== null && this.Max !== '' && value > Number(this.Max))
			value = Number(this.Max);

		if (precision !== null)
			value = Number(value.toFixed(precision));

		return value;
	},

	Shift: function (direction, multiplier) {
		var step = Number(this.Step) || 1;
		var current = this.Value === null || this.Value === '' ? 0 : Number(this.Value);
		var decimals = (String(step).split('.')[1] || '').length;

		if (this.Disabled || this.ReadOnly) return;

		this.Text = null;
		this.Value = this.Normalize(Number((current + direction * step * multiplier).toFixed(decimals)));

		this.$Emit('input', this.Value);
		this.$Emit('change', this.Value);
	},

	Increment: function () {
		this.Shift(1, 1);
	},

	Decrement: function () {
		this.Shift(-1, 1);
	},

	Key: function (event) {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

		event.preventDefault();

		this.Shift(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey ? 10 : 1);
	},

	Sanitize: function (text) {
		var result = '';
		var dot = false;
		var i = 0;
		var character;

		text = String(text || '').replace(/,/g, '.');

		while (i < text.length) {
			character = text.charAt(i);

			if (/[0-9]/.test(character)) {
				result += character;
			}
			else if (character === '-' && result === '') {
				result = '-';
			}
			else if (character === '.' && !dot) {
				dot = true;
				result += result === '' || result === '-' ? '0.' : '.';
			}

			i++;
		}

		return result;
	},

	ParseNumber: function (text) {
		if (text === '' || text === '-' || text === null) return null;

		return isNaN(parseFloat(text)) ? null : parseFloat(text);
	}
});