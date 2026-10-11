/*
 * The active ISO 4217 currencies. List(locale) returns [{Code, Name, Symbol, Digits}] with the name and the symbol
 * of the locale (Intl), sorted by name; Find(code) returns one currency; Format(amount, code) formats an amount.
 * Without Intl support a currency still lists with its code as the name and the symbol.
 */
Elemenx.Service('Currencies', {
	Codes: [
		'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF',
		'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC',
		'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS',
		'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD',
		'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL',
		'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD',
		'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
		'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP',
		'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES',
		'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XCG', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWG'
	],

	$OnCreate: function () {
		this.Cache = {};
	},

	Locale: function (locale) {
		return locale || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
	},

	Describe: function (code, locale, names) {
		var currency = {Code: code, Name: code, Symbol: code, Digits: 2};
		var format;
		var parts;
		var i = 0;

		try {
			currency.Name = names ? names.of(code) || code : code;
			format = new Intl.NumberFormat(locale, {style: 'currency', currency: code, currencyDisplay: 'narrowSymbol'});
			currency.Digits = format.resolvedOptions().maximumFractionDigits;
			parts = format.formatToParts(1);

			while (i < parts.length) {
				if (parts[i].type === 'currency')
					currency.Symbol = parts[i].value;

				i++;
			}
		}
		catch (error) {
			currency.Name = currency.Name || code;
		}

		currency.Name = currency.Name.charAt(0).toUpperCase() + currency.Name.substring(1);

		return currency;
	},

	List: function (locale) {
		var names = null;
		var list = [];
		var i = 0;

		locale = this.Locale(locale);

		if (this.Cache[locale])
			return this.Cache[locale];

		try {
			names = new Intl.DisplayNames([locale], {type: 'currency'});
		}
		catch (error) {
			names = null;
		}

		while (i < this.Codes.length) {
			list.push(this.Describe(this.Codes[i], locale, names));

			i++;
		}

		list.sort(function (a, b) {
			return a.Name.localeCompare(b.Name, locale);
		});

		this.Cache[locale] = list;

		return list;
	},

	Find: function (code, locale) {
		var list = this.List(locale);
		var i = 0;

		while (i < list.length) {
			if (list[i].Code === code) return list[i];

			i++;
		}

		return null;
	},

	Format: function (amount, code, locale) {
		locale = this.Locale(locale);

		try {
			return new Intl.NumberFormat(locale, {style: 'currency', currency: code, currencyDisplay: 'narrowSymbol'}).format(amount);
		}
		catch (error) {
			return amount + ' ' + code;
		}
	}
});