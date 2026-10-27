/*
 * The prices of Acme, written in the language of the page: Format(amount, currency) ('€1,290.00', '1 290,00 €'),
 * Discount(price, old) the share taken off, a whole percent (0 without an old price).
 */
Elemenx.Service('Prices', {
	$Meta: {
		Description: 'Prices written in the language of the page, and the discount between two of them.',
		Methods: ['Format(amount, currency)', 'Discount(price, old)']
	},

	Format: function (amount, currency) {
		try {
			return new Intl.NumberFormat(Elemenx.Locale.Language(), {style: 'currency', currency: currency || 'EUR'}).format(Number(amount) || 0);
		}
		catch (error) {
			return amount + ' ' + (currency || 'EUR');
		}
	},

	Discount: function (price, old) {
		if (!old || Number(old) <= Number(price)) return 0;

		return Math.round((1 - Number(price) / Number(old)) * 100);
	}
});
