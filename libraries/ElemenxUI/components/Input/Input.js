/*
 * A text field. A password field has an eye button: Guarded asks before it shows the password, HideAfter hides it
 * again (see the Reveal Service).
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

	Typed: function (event, node) {
		this.Value = node.value;

		this.$Emit('input', this.Value);
	},

	Masked: function (event) {
		this.Value = event.detail.Value;
		this.Complete = event.detail.Complete;

		this.$Emit('input', this.Value);
	},

	Committed: function () {
		this.$Emit('change', this.Value);
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