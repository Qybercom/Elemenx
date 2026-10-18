/*
 * A text field. A password field has an eye button: Guarded asks before it shows the password, HideAfter hides it
 * again (see the Reveal Service).
 * Preset: a format of the Formats Service (email, url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal,
 * or one the Application registers): the field gets its keyboard and autofill, keeps only the characters the format
 * holds, and checks the value when it is committed: it normalizes it, looks invalid when it is wrong and emits
 * validate with {Valid, Value, Message} (put Message in the Error of a Field); the change event carries the
 * normalized value. Country is the country of a postal-code, Min and Max bound an integer or a decimal.
 */
Elemenx.Component('Input', {
	$TemplateURL: 'Input.html',
	Type: 'text',
	Value: '',
	Placeholder: '',
	Size: 'medium',
	Shape: 'default',
	Icon: '',
	IconRight: '',
	Prefix: '',
	Suffix: '',
	Mask: '',
	Preset: '',
	Country: '',
	Rejected: false,
	Name: null,
	Autocomplete: null,
	InputMode: null,
	MaxLength: null,
	Min: null,
	Max: null,
	Step: null,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,
	Clearable: false,
	Revealed: false,
	Guarded: false,
	HideAfter: 0,
	Asking: 0,
	RevealTimer: 0,
	Complete: false,

	$OnCreate: function () {
		var formats = this.$Service('Formats');

		/* An attribute of the field: its own value, or the one of the Preset. */
		this.PresetAttribute = function (preset, key, own) {
			var format = preset ? formats.Find(preset) : null;

			if (own !== null && own !== undefined && own !== '') return own;

			return format && format[key] ? format[key] : null;
		};

		this.InputType = function (type, preset, revealed) {
			if (type === 'password')
				return revealed ? 'text' : 'password';

			return type === 'text' ? this.PresetAttribute(preset, 'Type', null) || 'text' : type;
		};
	},

	Typed: function (event, node) {
		var formats = this.$Service('Formats');
		var text = node.value;
		var kept;
		var caret;

		/* The characters the Preset cannot hold go at once; the caret stays after the characters before it. */
		if (this.Preset) {
			kept = formats.Filter(this.Preset, text);

			if (kept !== text) {
				caret = formats.Filter(this.Preset, text.substring(0, node.selectionStart || 0)).length;
				node.value = kept;

				if (node.setSelectionRange && node.getRootNode().activeElement === node)
					node.setSelectionRange(caret, caret);

				text = kept;
			}
		}

		this.Value = text;

		/* A field marked wrong is checked again as the user types, so it clears as soon as it is right. */
		if (this.Rejected)
			this.Validate(false);

		this.$Emit('input', this.Value);
	},

	/* Checks the value against the Preset; normalize (on commit) puts the normalized value in the field. */
	Validate: function (normalize) {
		var formats = this.$Service('Formats');
		var result = formats.Check(this.Preset, this.Value, {Country: this.Country, Min: this.Min, Max: this.Max});
		if (normalize && result.Value !== this.Value)
			this.Value = formats.Display(this.Preset, result.Value);

		if (this.Rejected !== !result.Valid || normalize)
			this.$Emit('validate', {Valid: result.Valid, Value: result.Value, Message: result.Message});

		this.Rejected = !result.Valid;

		return result;
	},

	Masked: function (event) {
		this.Value = event.detail.Value;
		this.Complete = event.detail.Complete;

		this.$Emit('input', this.Value);
	},

	Committed: function () {
		if (!this.Preset) {
			this.$Emit('change', this.Value);

			return;
		}

		this.$Emit('change', this.Validate(true).Value);
	},

	Clear: function (event, node) {
		var control = node.parentNode.querySelector('input');

		this.Value = '';

		this.$Emit('input', this.Value);
		this.$Emit('change', this.Value);

		if (control)
			control.focus();
	},

	Reveal: function () {
		this.$Service('Reveal').Toggle(this, 'password');
	},

	$OnDestroy: function () {
		this.$Service('Reveal').Forget(this);
	}
});