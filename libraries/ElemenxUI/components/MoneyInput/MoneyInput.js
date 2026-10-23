/*
 * An amount of money with its currency. Amount is a number (or null) with the fraction digits of Currency;
 * the text is grouped in Locale when the field is not edited. Fixed hides the currency select.
 * Events: input and change carry {Amount, Currency}.
 */
Elemenx.Component('MoneyInput', {
	$TemplateURL: 'MoneyInput.html',
	$StyleURL: 'MoneyInput.css',
	$Meta: {
		Group: 'inputs',
		Icon: 'credit-card',
		Description: 'An amount of money with its currency.',
		Props: {
			Amount: 'The amount: a number, or null.',
			Currency: 'The code of the currency (USD).',
			Codes: 'Only these currencies in the select.',
			Locale: 'The language of its texts and formats (the language of the page by default).',
			Min: 'The least amount.',
			Max: 'The greatest amount.',
			Placeholder: 'The text shown while it is empty.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Fixed: 'Hides the select of the currency.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		}
	},
	Amount: null,
	Currency: 'USD',
	Codes: null,
	Locale: '',
	Min: null,
	Max: null,
	Placeholder: '0',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Fixed: false,
	Disabled: false,
	Invalid: false,
	Text: null,

	$OnCreate: function () {
		var self = this;
		var currencies = this.$Service('Currencies');

		this.Info = function (code, locale) {
			return currencies.Find(code, locale) || {Code: code, Symbol: code, Digits: 2};
		};

		this.Display = function (amount, text, code, locale) {
			var digits = self.Info(code, locale).Digits;

			if (text !== null) return text;
			if (amount === null || amount === '' || isNaN(amount)) return '';

			return new Intl.NumberFormat(currencies.Locale(locale), {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(amount);
		};
	},

	Emit: function (name) {
		this.$Emit(name, {Amount: this.Amount, Currency: this.Currency});
	},

	/* Digits, one decimal separator (dot or comma) with the fraction digits of the currency, and a minus below zero. */
	Typed: function (event, node) {
		var digits = this.Info(this.Currency, this.Locale).Digits;
		var negative = this.Min !== null && this.Min !== '' && Number(this.Min) < 0 && /^\s*-/.test(node.value);
		var parts = node.value.replace(/[^0-9.,]/g, '').replace(',', '.').split('.');
		var text = parts[0].replace(/^0+(?=\d)/, '');

		if (parts.length > 1 && digits > 0)
			text = (text || '0') + '.' + parts.slice(1).join('').substring(0, digits);

		text = (negative ? '-' : '') + text;

		if (node.value !== text)
			node.value = text;

		this.Text = text;
		this.Amount = text === '' || text === '-' ? null : Number(text);

		this.Emit('input');
	},

	Committed: function () {
		var amount = this.Amount;

		if (amount !== null) {
			if (this.Min !== null && this.Min !== '')
				amount = Math.max(Number(this.Min), amount);

			if (this.Max !== null && this.Max !== '')
				amount = Math.min(Number(this.Max), amount);

			amount = Number(amount.toFixed(this.Info(this.Currency, this.Locale).Digits));
		}

		this.Amount = amount;
		this.Text = null;

		this.Emit('change');
	},

	/* Editing shows the plain number, selected so that typing replaces it; the grouped text comes back on blur. */
	Edit: function (event, node) {
		this.Text = this.Amount === null ? '' : String(this.Amount);

		if (node.value !== this.Text)
			node.value = this.Text;

		node.select();
	},

	CurrencyChanged: function (code) {
		this.Currency = code;

		if (this.Amount !== null)
			this.Amount = Number(this.Amount.toFixed(this.Info(code, this.Locale).Digits));

		this.Emit('input');
		this.Emit('change');
	}
});