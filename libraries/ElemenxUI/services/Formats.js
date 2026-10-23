/*
 * Formats of text fields: an Input with Preset="email" (url, semver, ipv4, ipv6, uuid, iban, postal-code, integer,
 * decimal) gets the right keyboard and autofill, drops the characters the format cannot hold while the user types, and
 * checks and normalizes the value when it is committed.
 * A format is {Type, InputMode, Autocomplete, Direction, Filter, Normalize(text, options), Validate(value, options)}:
 * Direction ltr keeps Latin text (an address, a code) from left to right on a right-to-left page; Filter is a
 * RegExp of the characters it keeps; Validate returns '' or the message of the error. Options: {Country} for
 * postal-code, {Min, Max} for integer and decimal.
 * Check(name, text, options) returns {Valid, Value, Message}: Value normalized (an IBAN without spaces, a decimal with a
 * point). Display(name, value) is the text a field shows for a value (an IBAN in groups of four). Register(name, format)
 * adds a format of the Application, Find(name) returns one, Names() lists them.
 */
Elemenx.Service('Formats', {
	$Meta: {
		Description: 'Formats of text fields: an Input with Preset="email" (url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal) gets the right keyboard and autofill, drops the characters the format cannot hold while the user types, and checks and normalizes the value when it is committed.',
		Methods: ['Register(name, format)', 'Find(name)', 'Names()', 'Check(name, text, options)', 'Display(name, value)']
	},
	/* The length of the IBAN of every country that has one (the IBAN registry of SWIFT). */
	IbanLengths: 'AD24 AE23 AL28 AT20 AZ28 BA20 BE16 BG22 BH22 BI27 BR29 BY28 CH21 CR22 CY28 CZ24 DE22 DJ27 DK18 DO28 EE20 EG29 ES24 FI18 FK18 FO18 FR27 GB22 GE22 GI23 GL18 GR27 GT28 HR21 HU28 IE22 IL23 IQ23 IS26 IT27 JO30 KW30 KZ20 LB28 LC32 LI21 LT20 LU20 LV21 LY25 MC27 MD24 ME22 MK19 MN20 MR27 MT31 MU30 NI28 NL18 NO15 OM23 PK24 PL28 PS29 PT25 QA29 RO24 RS22 RU33 SA24 SC31 SD18 SE24 SI19 SK24 SM27 SO23 ST25 SV28 TL23 TN24 TR26 UA29 VA22 VG24 XK20 YE30',

	/* The postal codes of the countries; any other country takes 3 to 10 letters, digits, spaces and hyphens. */
	PostalCodes: {
		AM: /^\d{4}$/, AR: /^([A-Z]\d{4}[A-Z]{3}|\d{4})$/, AT: /^\d{4}$/, AU: /^\d{4}$/, AZ: /^(AZ ?)?\d{4}$/, BE: /^\d{4}$/,
		BG: /^\d{4}$/, BR: /^\d{5}-?\d{3}$/, BY: /^\d{6}$/, CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, CH: /^\d{4}$/, CN: /^\d{6}$/,
		CZ: /^\d{3} ?\d{2}$/, DE: /^\d{5}$/, DK: /^\d{4}$/, EE: /^\d{5}$/, ES: /^\d{5}$/, FI: /^\d{5}$/, FR: /^\d{5}$/,
		GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, GE: /^\d{4}$/, GR: /^\d{3} ?\d{2}$/, HU: /^\d{4}$/,
		IE: /^[A-Z]\d[\dW] ?[A-Z\d]{4}$/, IL: /^\d{7}$/, IN: /^\d{3} ?\d{3}$/, IT: /^\d{5}$/, JP: /^\d{3}-?\d{4}$/,
		KR: /^\d{5}$/, KZ: /^\d{6}$/, LT: /^(LT-)?\d{5}$/, LV: /^(LV-)?\d{4}$/, MD: /^(MD-?)?\d{4}$/, MX: /^\d{5}$/,
		NL: /^\d{4} ?[A-Z]{2}$/, NO: /^\d{4}$/, NZ: /^\d{4}$/, PL: /^\d{2}-\d{3}$/, PT: /^\d{4}-\d{3}$/, RO: /^\d{6}$/,
		RS: /^\d{5}$/, RU: /^\d{6}$/, SE: /^\d{3} ?\d{2}$/, SG: /^\d{6}$/, SK: /^\d{3} ?\d{2}$/, TR: /^\d{5}$/,
		UA: /^\d{5}$/, US: /^\d{5}(-\d{4})?$/, ZA: /^\d{4}$/
	},

	$OnCreate: function () {
		var self = this;

		function trim (text) {
			return String(text == null ? '' : text).replace(/^\s+|\s+$/g, '');
		}

		function number (text) {
			return trim(text).replace(/\s/g, '').replace(',', '.');
		}

		function bounds (value, options) {
			var min = options && options.Min != null && options.Min !== '' ? Number(options.Min) : null;
			var max = options && options.Max != null && options.Max !== '' ? Number(options.Max) : null;

			if (min !== null && Number(value) < min)
				return Elemenx.Locale.Text('ui.formats.min', {min: min});

			if (max !== null && Number(value) > max)
				return Elemenx.Locale.Text('ui.formats.max', {max: max});

			return '';
		}

		this.Registry = {
			email: {
				Type: 'email',
				Direction: 'ltr',
				InputMode: 'email',
				Autocomplete: 'email',
				Filter: /[^\s]/,
				Normalize: function (text) {
					var value = trim(text);
					var at = value.lastIndexOf('@');

					return at === -1 ? value : value.substring(0, at) + value.substring(at).toLowerCase();
				},
				Validate: function (value) {
					return /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(value) ? '' : Elemenx.Locale.Text('ui.formats.email');
				}
			},
			url: {
				Type: 'url',
				Direction: 'ltr',
				InputMode: 'url',
				Autocomplete: 'url',
				Filter: /[^\s]/,
				Normalize: function (text) {
					var value = trim(text);

					return value && !/^[a-z][a-z0-9+.-]*:/i.test(value) ? 'https://' + value : value;
				},
				Validate: function (value) {
					var url;

					try {
						url = new URL(value);
					}
					catch (error) {
						url = null;
					}

					return url && /^https?:$/.test(url.protocol) && (url.hostname.indexOf('.') !== -1 || url.hostname === 'localhost') ? '' : Elemenx.Locale.Text('ui.formats.url');
				}
			},
			semver: {
				Direction: 'ltr',
				InputMode: 'text',
				Filter: /[0-9A-Za-z.+-]/,
				Normalize: function (text) {
					return trim(text).replace(/^v(?=\d)/, '');
				},
				Validate: function (value) {
					return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/.test(value) ? '' : Elemenx.Locale.Text('ui.formats.semver');
				}
			},
			ipv4: {
				Direction: 'ltr',
				InputMode: 'decimal',
				Filter: /[0-9.]/,
				Normalize: trim,
				Validate: function (value) {
					return /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(value) ? '' : Elemenx.Locale.Text('ui.formats.ipv4');
				}
			},
			ipv6: {
				Direction: 'ltr',
				InputMode: 'text',
				Filter: /[0-9A-Fa-f:.]/,
				Normalize: function (text) {
					return trim(text).toLowerCase();
				},
				/* The URL parser of the browser knows every form: compressed, with an IPv4 tail. */
				Validate: function (value) {
					var valid = value.indexOf(':') !== -1 && !/[^0-9a-f:.]/.test(value);

					if (valid) {
						try {
							new URL('http://[' + value + ']/');
						}
						catch (error) {
							valid = false;
						}
					}

					return valid ? '' : Elemenx.Locale.Text('ui.formats.ipv6');
				}
			},
			uuid: {
				Direction: 'ltr',
				InputMode: 'text',
				Filter: /[0-9A-Fa-f-]/,
				Normalize: function (text) {
					var value = trim(text).toLowerCase();

					return /^[0-9a-f]{32}$/.test(value) ? value.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5') : value;
				},
				Validate: function (value) {
					return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value) ? '' : Elemenx.Locale.Text('ui.formats.uuid');
				}
			},
			iban: {
				Direction: 'ltr',
				InputMode: 'text',
				Autocomplete: 'off',
				Filter: /[0-9A-Za-z ]/,
				Normalize: function (text) {
					return trim(text).replace(/\s/g, '').toUpperCase();
				},
				Display: function (value) {
					return String(value || '').replace(/\s/g, '').replace(/(.{4})(?=.)/g, '$1 ');
				},
				Validate: function (value) {
					var length = self.IbanLength(value.substring(0, 2));
					if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(value) || !length || value.length !== length) return Elemenx.Locale.Text('ui.formats.iban');
					if (self.Mod97(value.substring(4) + value.substring(0, 4)) !== 1) return Elemenx.Locale.Text('ui.formats.ibanCheck');

					return '';
				}
			},
			'postal-code': {
				InputMode: 'text',
				Autocomplete: 'postal-code',
				Filter: /[0-9A-Za-z -]/,
				Normalize: function (text) {
					return trim(text).replace(/\s+/g, ' ').toUpperCase();
				},
				Validate: function (value, options) {
					var country = String(options && options.Country || '').toUpperCase();
					var pattern = self.PostalCodes[country] || /^[A-Z0-9][A-Z0-9 -]{1,8}[A-Z0-9]$/;

					return pattern.test(value) ? '' : (self.PostalCodes[country] ? Elemenx.Locale.Text('ui.formats.postalCodeOf', {country: country}) : Elemenx.Locale.Text('ui.formats.postalCode'));
				}
			},
			integer: {
				InputMode: 'numeric',
				Filter: /[0-9-]/,
				Normalize: function (text) {
					var value = number(text);

					return /^-?\d+$/.test(value) ? String(Number(value)) : value;
				},
				Validate: function (value, options) {
					if (!/^-?\d+$/.test(value) || !isFinite(Number(value))) return Elemenx.Locale.Text('ui.formats.integer');

					return bounds(value, options);
				}
			},
			decimal: {
				InputMode: 'decimal',
				Filter: /[0-9.,-]/,
				Normalize: function (text) {
					var value = number(text);

					return /^-?\d+(\.\d+)?$/.test(value) ? value.replace(/^(-?)0+(?=\d)/, '$1') : value;
				},
				Validate: function (value, options) {
					if (!/^-?\d+(\.\d+)?$/.test(value))
						return Elemenx.Locale.Text('ui.formats.decimal');

					return bounds(value, options);
				}
			}
		};
	},

	IbanLength: function (country) {
		var match = new RegExp('(^| )' + String(country).toUpperCase() + '(\\d+)').exec(this.IbanLengths);

		return match && /^[A-Z]{2}$/i.test(country) ? Number(match[2]) : 0;
	},

	/* The remainder of the IBAN number by 97, its letters as numbers (A = 10), digit by digit: no big integers. */
	Mod97: function (text) {
		var rest = 0;
		var code;
		var digits;
		var i = 0;
		var j;

		while (i < text.length) {
			code = text.charCodeAt(i);
			digits = code >= 65 ? String(code - 55) : text.charAt(i);
			j = 0;

			while (j < digits.length) {
				rest = (rest * 10 + Number(digits.charAt(j))) % 97;

				j++;
			}

			i++;
		}

		return rest;
	},

	Register: function (name, format) {
		if (!name || !format || typeof format !== 'object')
			throw new Error('Formats.Register expects (name, format)');

		this.Registry[name] = format;
	},

	Find: function (name) {
		return name && Object.prototype.hasOwnProperty.call(this.Registry, name) ? this.Registry[name] : null;
	},

	Names: function () {
		return Object.keys(this.Registry);
	},

	/* The characters of text the format keeps while the user types. */
	Filter: function (name, text) {
		var format = this.Find(name);
		if (!format || !format.Filter)
			return String(text == null ? '' : text);

		return String(text == null ? '' : text).split('').filter(function (character) {
			return format.Filter.test(character);
		}).join('');
	},

	Check: function (name, text, options) {
		var format = this.Find(name);
		var value = format && format.Normalize ? format.Normalize(text, options || {}) : String(text == null ? '' : text);
		var message;

		if (!format || value === '')
			return {Valid: true, Value: value, Message: ''};

		message = format.Validate ? format.Validate(value, options || {}) || '' : '';

		return {Valid: !message, Value: value, Message: message};
	},

	Display: function (name, value) {
		var format = this.Find(name);

		return format && format.Display ? format.Display(value) : String(value == null ? '' : value);
	}
});
