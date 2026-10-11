/*
 * Countries and territories with their dialling code, the mask of the national number (# is a digit) and currency.
 * List(locale) returns [{Code, Name, Dial, Mask, Currency}] with names in the locale (Intl.DisplayNames, English
 * otherwise), sorted by that name. Find(code) returns one country; Match(digits, preferred) the country of an
 * international number: the longest dialling code, then the preferred country, then the main country of a shared code.
 */
Elemenx.Service('Countries', {
	Data: [
		'AF|Afghanistan|93|## ### ####|AFN',
		'AX|Aland Islands|358|## ### ## ##|EUR',
		'AL|Albania|355|## ### ####|ALL',
		'DZ|Algeria|213|### ## ## ##|DZD',
		'AS|American Samoa|1684|###-####|USD',
		'AD|Andorra|376|### ###|EUR',
		'AO|Angola|244|### ### ###|AOA',
		'AI|Anguilla|1264|###-####|XCD',
		'AG|Antigua and Barbuda|1268|###-####|XCD',
		'AR|Argentina|54|## ####-####|ARS',
		'AM|Armenia|374|## ######|AMD',
		'AW|Aruba|297|### ####|AWG',
		'AU|Australia|61|### ### ###|AUD',
		'AT|Austria|43|### #######|EUR',
		'AZ|Azerbaijan|994|## ### ## ##|AZN',
		'BS|Bahamas|1242|###-####|BSD',
		'BH|Bahrain|973|#### ####|BHD',
		'BD|Bangladesh|880|####-######|BDT',
		'BB|Barbados|1246|###-####|BBD',
		'BY|Belarus|375|## ###-##-##|BYN',
		'BE|Belgium|32|### ## ## ##|EUR',
		'BZ|Belize|501|###-####|BZD',
		'BJ|Benin|229|## ## ## ## ##|XOF',
		'BM|Bermuda|1441|###-####|BMD',
		'BT|Bhutan|975|## ## ## ##|BTN',
		'BO|Bolivia|591|########|BOB',
		'BQ|Caribbean Netherlands|599|### ####|USD',
		'BA|Bosnia and Herzegovina|387|## ###-###|BAM',
		'BW|Botswana|267|## ### ###|BWP',
		'BR|Brazil|55|(##) #####-####|BRL',
		'IO|British Indian Ocean Territory|246|### ####|USD',
		'VG|British Virgin Islands|1284|###-####|USD',
		'BN|Brunei|673|### ####|BND',
		'BG|Bulgaria|359|## ### ####|BGN',
		'BF|Burkina Faso|226|## ## ## ##|XOF',
		'BI|Burundi|257|## ## ## ##|BIF',
		'KH|Cambodia|855|## ### ###|KHR',
		'CM|Cameroon|237|# ## ## ## ##|XAF',
		'CA|Canada|1|(###) ###-####|CAD',
		'CV|Cape Verde|238|### ## ##|CVE',
		'KY|Cayman Islands|1345|###-####|KYD',
		'CF|Central African Republic|236|## ## ## ##|XAF',
		'TD|Chad|235|## ## ## ##|XAF',
		'CL|Chile|56|# #### ####|CLP',
		'CN|China|86|### #### ####|CNY',
		'CX|Christmas Island|61|# #### ####|AUD',
		'CC|Cocos (Keeling) Islands|61|# #### ####|AUD',
		'CO|Colombia|57|### ### ####|COP',
		'KM|Comoros|269|### ## ##|KMF',
		'CG|Congo - Brazzaville|242|## ### ####|XAF',
		'CD|Congo - Kinshasa|243|### ### ###|CDF',
		'CK|Cook Islands|682|## ###|NZD',
		'CR|Costa Rica|506|#### ####|CRC',
		"CI|Cote d'Ivoire|225|## ## ## ## ##|XOF",
		'HR|Croatia|385|## ### ####|EUR',
		'CU|Cuba|53|# ### ####|CUP',
		'CW|Curacao|599|# ### ####|ANG',
		'CY|Cyprus|357|## ######|EUR',
		'CZ|Czechia|420|### ### ###|CZK',
		'DK|Denmark|45|## ## ## ##|DKK',
		'DJ|Djibouti|253|## ## ## ##|DJF',
		'DM|Dominica|1767|###-####|XCD',
		'DO|Dominican Republic|1809|###-####|DOP',
		'EC|Ecuador|593|## ### ####|USD',
		'EG|Egypt|20|### ### ####|EGP',
		'SV|El Salvador|503|#### ####|USD',
		'GQ|Equatorial Guinea|240|### ### ###|XAF',
		'ER|Eritrea|291|# ### ###|ERN',
		'EE|Estonia|372|#### ####|EUR',
		'SZ|Eswatini|268|#### ####|SZL',
		'ET|Ethiopia|251|## ### ####|ETB',
		'FK|Falkland Islands|500|#####|FKP',
		'FO|Faroe Islands|298|### ###|DKK',
		'FJ|Fiji|679|### ####|FJD',
		'FI|Finland|358|## ### ## ##|EUR',
		'FR|France|33|# ## ## ## ##|EUR',
		'GF|French Guiana|594|### ## ## ##|EUR',
		'PF|French Polynesia|689|## ## ## ##|XPF',
		'GA|Gabon|241|## ## ## ##|XAF',
		'GM|Gambia|220|### ####|GMD',
		'GE|Georgia|995|### ## ## ##|GEL',
		'DE|Germany|49|### ########|EUR',
		'GH|Ghana|233|## ### ####|GHS',
		'GI|Gibraltar|350|#### ####|GIP',
		'GR|Greece|30|### ### ####|EUR',
		'GL|Greenland|299|## ## ##|DKK',
		'GD|Grenada|1473|###-####|XCD',
		'GP|Guadeloupe|590|### ## ## ##|EUR',
		'GU|Guam|1671|###-####|USD',
		'GT|Guatemala|502|#### ####|GTQ',
		'GG|Guernsey|44|#### ######|GBP',
		'GN|Guinea|224|### ## ## ##|GNF',
		'GW|Guinea-Bissau|245|### ### ###|XOF',
		'GY|Guyana|592|### ####|GYD',
		'HT|Haiti|509|## ## ####|HTG',
		'HN|Honduras|504|####-####|HNL',
		'HK|Hong Kong|852|#### ####|HKD',
		'HU|Hungary|36|## ### ####|HUF',
		'IS|Iceland|354|### ####|ISK',
		'IN|India|91|##### #####|INR',
		'ID|Indonesia|62|###-####-####|IDR',
		'IR|Iran|98|### ### ####|IRR',
		'IQ|Iraq|964|### ### ####|IQD',
		'IE|Ireland|353|## ### ####|EUR',
		'IM|Isle of Man|44|#### ######|GBP',
		'IL|Israel|972|##-###-####|ILS',
		'IT|Italy|39|### ### ####|EUR',
		'JM|Jamaica|1876|###-####|JMD',
		'JP|Japan|81|##-####-####|JPY',
		'JE|Jersey|44|#### ######|GBP',
		'JO|Jordan|962|# #### ####|JOD',
		'KZ|Kazakhstan|7|(###) ###-##-##|KZT',
		'KE|Kenya|254|### ######|KES',
		'KI|Kiribati|686|########|AUD',
		'XK|Kosovo|383|## ### ###|EUR',
		'KW|Kuwait|965|#### ####|KWD',
		'KG|Kyrgyzstan|996|### ### ###|KGS',
		'LA|Laos|856|## ## ### ###|LAK',
		'LV|Latvia|371|## ### ###|EUR',
		'LB|Lebanon|961|## ### ###|LBP',
		'LS|Lesotho|266|#### ####|LSL',
		'LR|Liberia|231|## ### ####|LRD',
		'LY|Libya|218|##-#######|LYD',
		'LI|Liechtenstein|423|### ## ##|CHF',
		'LT|Lithuania|370|### #####|EUR',
		'LU|Luxembourg|352|### ### ###|EUR',
		'MO|Macao|853|#### ####|MOP',
		'MG|Madagascar|261|## ## ### ##|MGA',
		'MW|Malawi|265|### ## ## ##|MWK',
		'MY|Malaysia|60|##-### ####|MYR',
		'MV|Maldives|960|###-####|MVR',
		'ML|Mali|223|## ## ## ##|XOF',
		'MT|Malta|356|#### ####|EUR',
		'MH|Marshall Islands|692|###-####|USD',
		'MQ|Martinique|596|### ## ## ##|EUR',
		'MR|Mauritania|222|## ## ## ##|MRU',
		'MU|Mauritius|230|#### ####|MUR',
		'YT|Mayotte|262|### ## ## ##|EUR',
		'MX|Mexico|52|## #### ####|MXN',
		'FM|Micronesia|691|### ####|USD',
		'MD|Moldova|373|### ## ###|MDL',
		'MC|Monaco|377|## ## ## ##|EUR',
		'MN|Mongolia|976|#### ####|MNT',
		'ME|Montenegro|382|## ### ###|EUR',
		'MS|Montserrat|1664|###-####|XCD',
		'MA|Morocco|212|##-####-###|MAD',
		'MZ|Mozambique|258|## ### ####|MZN',
		'MM|Myanmar|95|# ### ####|MMK',
		'NA|Namibia|264|## ### ####|NAD',
		'NR|Nauru|674|### ####|AUD',
		'NP|Nepal|977|###-#######|NPR',
		'NL|Netherlands|31|# ########|EUR',
		'NC|New Caledonia|687|##.##.##|XPF',
		'NZ|New Zealand|64|## ### ####|NZD',
		'NI|Nicaragua|505|#### ####|NIO',
		'NE|Niger|227|## ## ## ##|XOF',
		'NG|Nigeria|234|### ### ####|NGN',
		'NU|Niue|683|####|NZD',
		'NF|Norfolk Island|672|# #####|AUD',
		'KP|North Korea|850|### ### ####|KPW',
		'MK|North Macedonia|389|## ### ###|MKD',
		'MP|Northern Mariana Islands|1670|###-####|USD',
		'NO|Norway|47|### ## ###|NOK',
		'OM|Oman|968|#### ####|OMR',
		'PK|Pakistan|92|### #######|PKR',
		'PW|Palau|680|### ####|USD',
		'PS|Palestine|970|### ### ###|ILS',
		'PA|Panama|507|####-####|PAB',
		'PG|Papua New Guinea|675|### #####|PGK',
		'PY|Paraguay|595|### ######|PYG',
		'PE|Peru|51|### ### ###|PEN',
		'PH|Philippines|63|### ### ####|PHP',
		'PN|Pitcairn Islands|64|## ### ####|NZD',
		'PL|Poland|48|### ### ###|PLN',
		'PT|Portugal|351|### ### ###|EUR',
		'PR|Puerto Rico|1787|###-####|USD',
		'QA|Qatar|974|#### ####|QAR',
		'RE|Reunion|262|### ## ## ##|EUR',
		'RO|Romania|40|### ### ###|RON',
		'RU|Russia|7|(###) ###-##-##|RUB',
		'RW|Rwanda|250|### ### ###|RWF',
		'BL|Saint Barthelemy|590|### ## ## ##|EUR',
		'SH|Saint Helena|290|#####|SHP',
		'KN|Saint Kitts and Nevis|1869|###-####|XCD',
		'LC|Saint Lucia|1758|###-####|XCD',
		'MF|Saint Martin|590|### ## ## ##|EUR',
		'PM|Saint Pierre and Miquelon|508|## ## ##|EUR',
		'VC|Saint Vincent and the Grenadines|1784|###-####|XCD',
		'WS|Samoa|685|## #####|WST',
		'SM|San Marino|378|#### ######|EUR',
		'ST|Sao Tome and Principe|239|### ####|STN',
		'SA|Saudi Arabia|966|## ### ####|SAR',
		'SN|Senegal|221|## ### ## ##|XOF',
		'RS|Serbia|381|## ### ####|RSD',
		'SC|Seychelles|248|# ### ###|SCR',
		'SL|Sierra Leone|232|## ######|SLE',
		'SG|Singapore|65|#### ####|SGD',
		'SX|Sint Maarten|1721|###-####|ANG',
		'SK|Slovakia|421|### ### ###|EUR',
		'SI|Slovenia|386|## ### ###|EUR',
		'SB|Solomon Islands|677|## #####|SBD',
		'SO|Somalia|252|## ### ###|SOS',
		'ZA|South Africa|27|## ### ####|ZAR',
		'KR|South Korea|82|##-####-####|KRW',
		'SS|South Sudan|211|### ### ###|SSP',
		'ES|Spain|34|### ### ###|EUR',
		'LK|Sri Lanka|94|## ### ####|LKR',
		'SD|Sudan|249|## ### ####|SDG',
		'SR|Suriname|597|###-####|SRD',
		'SJ|Svalbard and Jan Mayen|47|### ## ###|NOK',
		'SE|Sweden|46|##-### ## ##|SEK',
		'CH|Switzerland|41|## ### ## ##|CHF',
		'SY|Syria|963|### ### ###|SYP',
		'TW|Taiwan|886|### ### ###|TWD',
		'TJ|Tajikistan|992|## ### ####|TJS',
		'TZ|Tanzania|255|### ### ###|TZS',
		'TH|Thailand|66|## ### ####|THB',
		'TL|Timor-Leste|670|#### ####|USD',
		'TG|Togo|228|## ## ## ##|XOF',
		'TK|Tokelau|690|####|NZD',
		'TO|Tonga|676|### ####|TOP',
		'TT|Trinidad and Tobago|1868|###-####|TTD',
		'TN|Tunisia|216|## ### ###|TND',
		'TR|Turkey|90|(###) ###-##-##|TRY',
		'TM|Turkmenistan|993|## ######|TMT',
		'TC|Turks and Caicos Islands|1649|###-####|USD',
		'TV|Tuvalu|688|######|AUD',
		'UG|Uganda|256|### ######|UGX',
		'UA|Ukraine|380|## ### ## ##|UAH',
		'AE|United Arab Emirates|971|## ### ####|AED',
		'GB|United Kingdom|44|#### ######|GBP',
		'US|United States|1|(###) ###-####|USD',
		'UY|Uruguay|598|#### ####|UYU',
		'VI|U.S. Virgin Islands|1340|###-####|USD',
		'UZ|Uzbekistan|998|## ###-##-##|UZS',
		'VU|Vanuatu|678|### ####|VUV',
		'VA|Vatican City|39|### ### ####|EUR',
		'VE|Venezuela|58|###-#######|VES',
		'VN|Vietnam|84|## ### ## ##|VND',
		'WF|Wallis and Futuna|681|## ## ##|XPF',
		'EH|Western Sahara|212|##-####-###|MAD',
		'YE|Yemen|967|### ### ###|YER',
		'ZM|Zambia|260|## #######|ZMW',
		'ZW|Zimbabwe|263|## ### ####|ZWG'
	],

	/* The main country of a dialling code that several countries share. */
	Primary: {
		'1': 'US', '7': 'RU', '39': 'IT', '44': 'GB', '47': 'NO', '61': 'AU', '64': 'NZ',
		'212': 'MA', '262': 'RE', '358': 'FI', '590': 'GP', '599': 'CW'
	},

	$OnCreate: function () {
		this.Cache = {};
	},

	/* True when a should win over b for the same digits: a longer code, then the preferred country, then the main one. */
	Better: function (a, b, preferred) {
		if (!b)
			return true;

		if (a.Dial.length !== b.Dial.length)
			return a.Dial.length > b.Dial.length;

		if (a.Code === preferred || b.Code === preferred) return a.Code === preferred;

		return this.Primary[a.Dial] === a.Code;
	},

	Locale: function (locale) {
		return locale || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
	},

	List: function (locale) {
		var names = null;
		var list = [];
		var parts;
		var name;
		var i = 0;

		locale = this.Locale(locale);

		if (this.Cache[locale])
			return this.Cache[locale];

		try {
			names = new Intl.DisplayNames([locale], {type: 'region'});
		}
		catch (error) {
			names = null;
		}

		while (i < this.Data.length) {
			parts = this.Data[i].split('|');
			name = parts[1];

			try {
				name = names ? names.of(parts[0]) || name : name;
			}
			catch (error) {
				name = parts[1];
			}

			list.push({Code: parts[0], Name: name, Dial: parts[2], Mask: parts[3], Currency: parts[4]});

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

	/* The country whose dialling code starts the digits; the longest code wins, then the preferred country. */
	Match: function (digits, preferred, locale) {
		var list = this.List(locale);
		var best = null;
		var i = 0;

		digits = String(digits || '').replace(/\D/g, '');

		while (i < list.length) {
			if (digits.indexOf(list[i].Dial) === 0 && this.Better(list[i], best, preferred))
				best = list[i];

			i++;
		}

		return best;
	}
});