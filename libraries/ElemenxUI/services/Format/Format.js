/*
 * The formats the cards share, in the language of the page (Locale): Count(12400) is '12K', Date(value, style) a date
 * ('short', 'medium', 'long', or Intl.DateTimeFormat options), Day(value) {Day, Month} for a date badge, Relative(value)
 * the time from now ('5 minutes ago'), Money(amount, code) an amount of a currency, Bytes(size) the size of a file
 * ('1.5 MB', in units of 1024). A value is a Date, a timestamp or an ISO string; an invalid one gives ''.
 */
Elemenx.Service('Format', {
	$Meta: {
		Description: 'The formats the cards share, in the language of the page (Locale): Count(12400) is \'12K\', Date(value, style) a date (\'short\', \'medium\', \'long\', or Intl.DateTimeFormat options), Day(value) {Day, Month} for a date badge, Relative(value) the time from now (\'5 minutes ago\'), Money(amount, code) an amount of a currency, Bytes(size) the size of a file.',
		Methods: ['Count(value)', 'Date(value, style)', 'Day(value)', 'Relative(value, now)', 'Money(amount, code)', 'Bytes(size)']
	},
	Locale: '',

	Language: function () {
		return this.Locale || Elemenx.Locale.Language();
	},

	Count: function (value) {
		var number = Number(value) || 0;

		try {
			return new Intl.NumberFormat(this.Language(), {notation: 'compact', maximumFractionDigits: 1}).format(number);
		}
		catch (error) {
			return number >= 1000000 ? Math.round(number / 100000) / 10 + 'M' : number >= 1000 ? Math.round(number / 100) / 10 + 'K' : String(number);
		}
	},

	When: function (value) {
		var date = value instanceof Date ? value : new Date(value);

		return value === null || value === undefined || value === '' || isNaN(date.getTime()) ? null : date;
	},

	Date: function (value, style) {
		var date = this.When(value);
		var options = typeof style === 'object' && style ? style : {dateStyle: style || 'medium'};

		if (!date)
			return '';

		try {
			return new Intl.DateTimeFormat(this.Language(), options).format(date);
		}
		catch (error) {
			return date.toDateString();
		}
	},

	/* The parts of a date badge: the day of the month and the short name of the month. */
	Day: function (value) {
		var date = this.When(value);
		if (!date)
			return {Day: '', Month: ''};

		return {Day: String(date.getDate()), Month: this.Date(date, {month: 'short'}).replace(/\.$/, '')};
	},

	/* The time from now in the largest unit that fits: '5 minutes ago', 'in 2 days', 'now'. */
	Relative: function (value, now) {
		var date = this.When(value);
		var units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
		var seconds;
		var i = 0;

		if (!date)
			return '';

		seconds = Math.round((date.getTime() - (now === undefined || now === null ? Date.now() : Number(now))) / 1000);

		while (i < units.length) {
			if (Math.abs(seconds) >= units[i][1])
				return this.Unit(Math.round(seconds / units[i][1]), units[i][0]);

			i++;
		}

		return this.Unit(0, 'second');
	},

	Unit: function (amount, unit) {
		try {
			return new Intl.RelativeTimeFormat(this.Language(), {numeric: 'auto'}).format(amount, unit);
		}
		catch (error) {
			return Math.abs(amount) + ' ' + unit + (Math.abs(amount) === 1 ? '' : 's') + (amount < 0 ? ' ago' : '');
		}
	},

	/* A size in bytes in the unit it reads best in: 512 B, 1.5 KB, 23 MB (units of 1024); '' for no number. */
	Bytes: function (size) {
		var units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];
		var short = ['B', 'KB', 'MB', 'GB', 'TB'];
		var value = Number(size);
		var index = 0;

		if (size === null || size === undefined || size === '' || !isFinite(value)) return '';

		while (Math.abs(value) >= 1024 && index < units.length - 1) {
			value /= 1024;

			index++;
		}

		try {
			return new Intl.NumberFormat(this.Language(), {style: 'unit', unit: units[index], unitDisplay: index ? 'short' : 'long', maximumFractionDigits: index && Math.abs(value) < 10 ? 1 : 0}).format(value);
		}
		catch (error) {
			return (index && Math.abs(value) < 10 ? value.toFixed(1) : Math.round(value)) + ' ' + short[index];
		}
	},

	Money: function (amount, code) {
		try {
			return new Intl.NumberFormat(this.Language(), {style: 'currency', currency: code || 'USD', currencyDisplay: 'narrowSymbol'}).format(Number(amount) || 0);
		}
		catch (error) {
			return amount + ' ' + (code || 'USD');
		}
	}
});
