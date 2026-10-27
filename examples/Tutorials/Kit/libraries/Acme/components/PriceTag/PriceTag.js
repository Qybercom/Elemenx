/* A price: Amount in Currency, the Old price struck through and the discount beside it when there is one. */
Elemenx.Component('PriceTag', {
	$TemplateURL: 'PriceTag.html',
	$StyleURL: 'PriceTag.css',
	$Meta: {
		Group: 'data',
		Icon: 'tag',
		Description: 'A price, with the old one struck through and the discount.',
		Props: {
			Amount: {Type: 'number', Description: 'The price.'},
			Currency: {Options: ['EUR', 'USD', 'GBP', 'RUB'], Description: 'Its currency.'},
			Old: {Type: 'number', Description: 'The price before, struck through.'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size.'}
		},
		Sample: {Amount: 79, Old: 99, Currency: 'EUR'}
	},
	Amount: 0,
	Currency: 'EUR',
	Old: null,
	Size: 'medium',

	Price: function (amount, currency) {
		return this.$Service('Prices').Format(amount, currency);
	},

	Discount: function (amount, old) {
		return this.$Service('Prices').Discount(amount, old);
	}
});
