/*
 * Value holds the 3 or 4 security code digits (Length). The code is hidden unless Revealed; Guarded asks before the
 * eye shows it and HideAfter hides it again (see the Reveal Service).
 */
Elemenx.Component('CVVInput', {
	$TemplateURL: 'CVVInput.html',
	Value: '',
	Length: 3,
	Placeholder: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Touched: false,
	Revealed: false,
	Guarded: false,
	HideAfter: 0,
	Asking: 0,
	RevealTimer: 0,

	Masked: function (event) {
		this.Value = event.detail.Value;

		this.$Emit('input', this.Value);
		this.$Emit('validate', {Value: this.Value, Complete: event.detail.Complete, Valid: event.detail.Complete});
	},

	Reveal: function () {
		this.$Service('Reveal').Toggle(this, 'cvv');
	},

	$OnDestroy: function () {
		this.$Service('Reveal').Forget(this);
	},

	Committed: function () {
		this.Touched = true;

		this.$Emit('change', this.Value);
	}
});