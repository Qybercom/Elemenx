/*
 * A searchable select of currencies: every ISO 4217 currency of the Currencies Service, or only the Codes given
 * (['EUR', 'USD']), each with its code, its symbol and its name in the language of the page (Locale changes it). Value
 * is the code ('USD' by default). Placeholder, Size, Shape, Name, Disabled and Invalid as in Select. Events: change (the
 * code).
 */
Elemenx.Component('CurrencySelect', {
	$TemplateURL: 'CurrencySelect.html',
	$Meta: {
		Group: 'inputs',
		Icon: 'credit-card',
		Description: 'A searchable select of currencies: every ISO 4217 currency of the Currencies Service, or only the Codes given ([\'EUR\', \'USD\']), each with its code, its symbol and its name in the language of the page (Locale changes it).',
		Events: {
			change: 'Another currency was chosen: its code.'
		},
		Props: {
			Value: 'The code of the currency (USD).',
			Codes: 'Only these codes ([\'EUR\', \'USD\']); every ISO 4217 currency without them.',
			Locale: 'The language of its texts and formats (the language of the page by default).',
			Placeholder: 'The text shown while it is empty.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Name: 'The name of its value in a form.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Invalid: 'Marks its value as wrong.'
		},
		Sample: {Value: 'EUR'}
	},
	Value: 'USD',
	Codes: null,
	Locale: '',
	Placeholder: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,

	$OnCreate: function () {
		var currencies = this.$Service('Currencies');

		this.Options = function (codes, locale) {
			return currencies.List(locale).filter(function (currency) {
				return !codes || codes.indexOf(currency.Code) !== -1;
			}).map(function (currency) {
				return {Value: currency.Code, Label: currency.Code + ' · ' + currency.Name, Hint: currency.Symbol};
			});
		};
	},

	Changed: function (value) {
		this.Value = value;

		this.$Emit('change', value);
	}
});