/*
 * A dial pad: the number in a field over a grid of keys, a key that erases and a key that calls. Value is the number.
 * Keys is the layout, row by row in Columns columns: [{Value, Label, Sub, Hold, Icon, Class}]: Value goes into the
 * number, Label shows on the key (Value when empty) with Sub under it (the letters of a phone), Hold goes in place of
 * Value after a long press (+ on 0), Icon draws the key, Class gives it a look of its own. Without Keys it is the pad
 * of a phone: 1 to 9, *, 0 and #. ShowInput shows the field (the keys of the keyboard and a paste go in too, of the
 * characters of the keys), ShowCall the key that calls, CallLabel its name; Disabled locks it.
 * The key that erases takes the last character back, and the whole number when held.
 * Events: input (the number), press ({Value}): a key pressed, call (the number): the key that calls, or Enter.
 */
Elemenx.Component('DialPad', {
	$TemplateURL: 'DialPad.html',
	$StyleURL: 'DialPad.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'phone',
		Description: 'A dial pad: the number in a field over a grid of keys, a key that erases and a key that calls.',
		Events: {
			input: 'The number changed: the number.',
			press: 'A key was pressed: {Value}.',
			call: 'The key that calls (or Enter): the number.'
		},
		Props: {
			Value: 'The number.',
			Keys: 'The keys row by row: [{Value, Label, Sub, Hold, Icon, Class}]; a phone pad without them.',
			Columns: 'How many keys in a row.',
			ShowInput: 'Shows the field of the number (the keyboard and a paste go in too).',
			ShowCall: 'Shows the key that calls.',
			CallLabel: 'The name of the key that calls.',
			Label: 'The name of the pad for screen readers.',
			Hold: 'How long a press gives the Hold of a key (+ on 0), in milliseconds.',
			Disabled: 'Turns it off: it takes no input and looks so.'
		}
	},
	Value: '',
	Keys: null,
	Columns: 3,
	ShowInput: true,
	ShowCall: true,
	CallLabel: '',
	Label: '',
	Hold: 500,
	Disabled: false,

	$OnCreate: function () {
		var self = this;

		this.Phone = [
			{Value: '1'},
			{Value: '2', Sub: 'ABC'},
			{Value: '3', Sub: 'DEF'},
			{Value: '4', Sub: 'GHI'},
			{Value: '5', Sub: 'JKL'},
			{Value: '6', Sub: 'MNO'},
			{Value: '7', Sub: 'PQRS'},
			{Value: '8', Sub: 'TUV'},
			{Value: '9', Sub: 'WXYZ'},
			{Value: '*', Label: '✱'},
			{Value: '0', Sub: '+', Hold: '+'},
			{Value: '#'}
		];

		/* The keys of the pad: Keys, or those of a phone. */
		this.Layout = function (keys) {
			return Array.isArray(keys) && keys.length ? keys : self.Phone;
		};

		/* The characters the field takes: those of the keys and of their long presses. */
		this.Allowed = function (text) {
			var allowed = '';

			self.Layout(self.Keys).forEach(function (key) {
				allowed += String(key.Value || '') + String(key.Hold || '');
			});

			return String(text || '').split('').filter(function (character) {
				return allowed.indexOf(character) !== -1;
			}).join('');
		};

		/* Whether a key of the layout has a Sub: then every key keeps its line, so the digits stand in one row. */
		this.Subbed = function (keys) {
			return self.Layout(keys).some(function (key) {
				return !!key.Sub;
			});
		};

		this.Grid = function (columns) {
			return 'grid-template-columns: repeat(' + (Math.max(1, Math.floor(Number(columns) || 3))) + ', minmax(0, 1fr));';
		};
	},

	Set: function (value) {
		if (value === this.Value) return;

		this.Value = value;

		this.$Emit('input', value);
	},

	/* A press of a key: its Value goes in, or its Hold when the press was long. */
	Down: function (event, node) {
		var self = this;
		var key = this.Layout(this.Keys)[Number(node.getAttribute('data-index'))];
		if (this.Disabled || !key || event.button > 0) return;

		this.Held = false;

		window.clearTimeout(this.Timer);

		if (!key.Hold) return;

		this.Timer = window.setTimeout(function () {
			self.Held = true;

			self.Type(String(key.Hold));
		}, Number(this.Hold) || 500);
	},

	Up: function () {
		window.clearTimeout(this.Timer);
	},

	Pressed: function (event, node) {
		var key = this.Layout(this.Keys)[Number(node.getAttribute('data-index'))];

		window.clearTimeout(this.Timer);

		if (this.Held) {
			this.Held = false;

			return;
		}

		if (this.Disabled || !key) return;

		this.Type(String(key.Value));
	},

	Type: function (value) {
		this.Set(String(this.Value || '') + value);

		this.$Emit('press', {Value: value});
	},

	/* The key that erases: the last character, or the whole number when held. */
	EraseDown: function () {
		var self = this;

		this.Held = false;

		window.clearTimeout(this.Timer);

		this.Timer = window.setTimeout(function () {
			self.Held = true;

			self.Set('');
		}, Number(this.Hold) || 500);
	},

	Erase: function () {
		window.clearTimeout(this.Timer);

		if (this.Held) {
			this.Held = false;

			return;
		}

		this.Set(String(this.Value || '').slice(0, -1));
	},

	Call: function () {
		if (this.Disabled || !String(this.Value || '')) return;

		this.$Emit('call', String(this.Value));
	},

	/* The field: what is typed or pasted, of the characters of the keys; Enter calls. */
	Typed: function (event, node) {
		var value = this.Allowed(node.value);
		var caret;

		/* The characters taken out leave the caret after what was typed, not at the end. */
		if (node.value !== value) {
			caret = this.Allowed(node.value.slice(0, node.selectionStart || 0)).length;

			node.value = value;

			node.setSelectionRange(caret, caret);
		}

		this.Set(value);
	},

	Key: function (event) {
		if (event.key !== 'Enter') return;

		event.preventDefault();

		this.Call();
	},

	$OnDestroy: function () {
		window.clearTimeout(this.Timer);
	}
});
