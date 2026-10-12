/*
 * Value holds digits only. Brand, mask and validity follow from it; Valid is the Luhn check of a complete number.
 * Conceal hides the middle of the number: in its template x is a shown digit and ? a hidden one ('xxxx ???? ???? xxxx'
 * shows the first four and the last four digits); the groups follow the brand. The number stays hidden while it is
 * edited; an eye button, as in a password field, shows it (Revealed). ConcealChar is the character of a hidden digit.
 * Value is never changed by concealing. Guarded asks before the eye shows the number, HideAfter hides it again (see
 * the Reveal Service).
 */
Elemenx.Component('CardNumberInput', {
	$TemplateURL: 'CardNumberInput.html',
	$StyleURL: 'CardNumberInput.css',
	Value: '',
	Placeholder: '0000 0000 0000 0000',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Touched: false,
	Conceal: '',
	ConcealChar: '•',
	Revealed: false,
	Guarded: false,
	HideAfter: 0,
	Asking: 0,
	RevealTimer: 0,
	Brands: [
		{ID: 'mir', Label: 'Mir', Pattern: '^220[0-4]', Mask: '#### #### #### #### ###', Lengths: [16, 17, 18, 19]},
		{ID: 'visa', Label: 'Visa', Pattern: '^4', Mask: '#### #### #### #### ###', Lengths: [13, 16, 19]},
		{ID: 'mastercard', Label: 'Mastercard', Pattern: '^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)', Mask: '#### #### #### ####', Lengths: [16]},
		{ID: 'amex', Label: 'American Express', Pattern: '^3[47]', Mask: '#### ###### #####', Lengths: [15]},
		{ID: 'unionpay', Label: 'UnionPay', Pattern: '^62', Mask: '#### #### #### #### ###', Lengths: [16, 17, 18, 19]},
		{ID: 'jcb', Label: 'JCB', Pattern: '^35(2[89]|[3-8])', Mask: '#### #### #### #### ###', Lengths: [16, 17, 18, 19]},
		{ID: 'discover', Label: 'Discover', Pattern: '^(6011|65|64[4-9])', Mask: '#### #### #### #### ###', Lengths: [16, 19]},
		{ID: 'diners', Label: 'Diners Club', Pattern: '^3(0[0-5]|[689])', Mask: '#### ###### #########', Lengths: [14, 15, 16, 17, 18, 19]},
		{ID: 'maestro', Label: 'Maestro', Pattern: '^(5018|5020|5038|5893|6304|6759|676[1-3])', Mask: '#### #### #### #### ###', Lengths: [12, 13, 14, 15, 16, 17, 18, 19]}
	],

	$OnCreate: function () {
		var self = this;

		this.Brand = function (value) {
			var digits = String(value || '');
			var i = 0;

			while (i < self.Brands.length) {
				if (new RegExp(self.Brands[i].Pattern).test(digits)) return self.Brands[i];

				i++;
			}

			return null;
		};

		this.MaskFor = function (value) {
			var brand = self.Brand(value);

			return brand ? brand.Mask : '#### #### #### #### ###';
		};

		this.Complete = function (value) {
			var brand = self.Brand(value);
			var length = String(value || '').length;

			return brand ? brand.Lengths.indexOf(length) !== -1 : length >= 16;
		};

		this.Concealed = function (value, conceal) {
			var template = String(conceal || '');
			var digits = String(value || '');
			var lead = (/^[^?]*/.exec(template)[0].match(/x/gi) || []).length;
			var tail = (/[^?]*$/.exec(template)[0].match(/x/gi) || []).length;
			var mask = self.MaskFor(value);
			var text = '';
			var d = 0;
			var m = 0;

			if (template.indexOf('?') === -1)
				tail = 0;

			while (m < mask.length && d < digits.length) {
				if (mask.charAt(m) === '#') {
					text += d < lead || d >= digits.length - tail ? digits.charAt(d) : self.ConcealChar;
					d++;
				}
				else {
					text += mask.charAt(m);
				}

				m++;
			}

			return text;
		};

		this.Valid = function (value) {
			return self.Complete(value) && self.Luhn(value);
		};
	},

	Luhn: function (value) {
		var digits = String(value || '');
		var sum = 0;
		var doubled = false;
		var i = digits.length - 1;
		var digit;

		while (i >= 0) {
			digit = Number(digits.charAt(i));

			if (doubled) {
				digit *= 2;

				if (digit > 9)
					digit -= 9;
			}

			sum += digit;
			doubled = !doubled;

			i--;
		}

		return digits.length > 0 && sum % 10 === 0;
	},

	Masked: function (event) {
		var brand;

		this.Value = event.detail.Value;
		brand = this.Brand(this.Value);

		this.$Emit('input', this.Value);
		this.$Emit('validate', {Value: this.Value, Brand: brand ? brand.ID : '', Complete: this.Complete(this.Value), Valid: this.Valid(this.Value)});
	},

	Reveal: function () {
		this.$Service('Reveal').Toggle(this, 'card');
	},

	$OnDestroy: function () {
		this.$Service('Reveal').Forget(this);
	},

	Committed: function () {
		this.Touched = true;

		this.$Emit('change', this.Value);
	}
});