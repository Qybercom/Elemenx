/* Value holds MMYY digits. A month is kept in 01-12 while typing; an expired date is invalid. */
Elemenx.Component('CardExpiryInput', {
	$TemplateURL: 'CardExpiryInput.html',
	Value: '',
	Placeholder: 'MM/YY',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Touched: false,

	$OnCreate: function () {
		this.Valid = function (value) {
			var now = new Date();
			var month;
			var year;

			value = String(value || '');

			if (value.length !== 4) return false;

			month = Number(value.substring(0, 2));
			year = 2000 + Number(value.substring(2));

			return month >= 1 && month <= 12 && (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1));
		};
	},

	Masked: function (event) {
		var value = event.detail.Value;
		if (value.length >= 1 && value.charAt(0) > '1')
			value = '0' + value;

		if (value.length >= 2 && (value.substring(0, 2) === '00' || Number(value.substring(0, 2)) > 12))
			value = value.charAt(0);

		event.detail.Value = value.substring(0, 4);
		this.Value = event.detail.Value;

		this.$Emit('input', this.Value);
		this.$Emit('validate', {Value: this.Value, Complete: this.Value.length === 4, Valid: this.Valid(this.Value)});
	},

	Committed: function () {
		this.Touched = true;

		this.$Emit('change', this.Value);
	}
});