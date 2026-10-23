/*
 * The expiry date of a payment card: Value holds the digits MMYY ('0927'), shown as MM/YY. Only digits are taken; the
 * month is kept in 01-12 while typing, and a date already past is invalid. Placeholder (MM/YY), Size, Shape, Name,
 * Disabled and Invalid as in Input. Events: input (Value), validate ({Value, Complete, Valid}), change (Value, when it is
 * committed).
 */
Elemenx.Component('CardExpiryInput', {
	$TemplateURL: 'CardExpiryInput.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'credit-card',
		Description: 'The expiry date of a payment card: Value holds the digits MMYY (\'0927\'), shown as MM/YY.',
		Events: ['input', 'validate', 'change'],
		Props: {
			Value: 'The digits MMYY (0927), shown as MM/YY.',
			Placeholder: 'The text shown while it is empty.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		}
	},
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