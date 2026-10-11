/* Value holds the 3 or 4 security code digits (Length). The code is hidden unless Revealed. */
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

	Masked: function (event) {
		this.Value = event.detail.Value;

		this.$Emit('input', this.Value);
		this.$Emit('validate', {Value: this.Value, Complete: event.detail.Complete, Valid: event.detail.Complete});
	},

	Reveal: function () {
		this.Revealed = !this.Revealed;
	},

	Committed: function () {
		this.Touched = true;

		this.$Emit('change', this.Value);
	}
});