/*
 * A searchable select of currencies: every ISO 4217 currency of the Currencies Service, or only the Codes given
 * (['EUR', 'USD']), each with its code, its symbol and its name in the language of the page (Locale changes it). Value
 * is the code ('USD' by default). Placeholder, Size, Shape, Name, Disabled and Invalid as in Select. Events: change (the
 * code).
 */
Elemenx.Component('CurrencySelect', {
	$TemplateURL: 'CurrencySelect.html',
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