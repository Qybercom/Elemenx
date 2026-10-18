/* A searchable select of currencies: every ISO 4217 currency of the Currencies Service, or the Codes given. */
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