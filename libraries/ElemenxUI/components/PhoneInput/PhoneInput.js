/*
 * Value is the international number: "+" with the dialling code and the local digits ("+79991234567").
 * Countries is configurable: [{Code, Name, Dial, Mask}], where Mask describes the local part (# is a digit).
 * Only digits that fit the mask of the selected country are accepted, by typing, paste, drop or autofill.
 */
Elemenx.Component('PhoneInput', {
	$TemplateURL: 'PhoneInput.html',
	$StyleURL: 'PhoneInput.css',
	Value: '',
	Country: 'RU',
	Placeholder: '',
	Size: 'medium',
	Name: null,
	Disabled: false,
	Invalid: false,
	Open: false,
	Filter: '',
	Active: 0,
	Countries: [
		{Code: 'AM', Name: 'Armenia', Dial: '374', Mask: '(##) ###-###'},
		{Code: 'AE', Name: 'United Arab Emirates', Dial: '971', Mask: '## ### ####'},
		{Code: 'AZ', Name: 'Azerbaijan', Dial: '994', Mask: '(##) ###-##-##'},
		{Code: 'BR', Name: 'Brazil', Dial: '55', Mask: '(##) #####-####'},
		{Code: 'BY', Name: 'Belarus', Dial: '375', Mask: '(##) ###-##-##'},
		{Code: 'CA', Name: 'Canada', Dial: '1', Mask: '(###) ###-####'},
		{Code: 'CN', Name: 'China', Dial: '86', Mask: '### #### ####'},
		{Code: 'DE', Name: 'Germany', Dial: '49', Mask: '#### #######'},
		{Code: 'ES', Name: 'Spain', Dial: '34', Mask: '### ### ###'},
		{Code: 'FR', Name: 'France', Dial: '33', Mask: '# ## ## ## ##'},
		{Code: 'GB', Name: 'United Kingdom', Dial: '44', Mask: '#### ######'},
		{Code: 'GE', Name: 'Georgia', Dial: '995', Mask: '(###) ##-##-##'},
		{Code: 'IL', Name: 'Israel', Dial: '972', Mask: '##-###-####'},
		{Code: 'IN', Name: 'India', Dial: '91', Mask: '##### #####'},
		{Code: 'IT', Name: 'Italy', Dial: '39', Mask: '### ### ####'},
		{Code: 'JP', Name: 'Japan', Dial: '81', Mask: '##-####-####'},
		{Code: 'KG', Name: 'Kyrgyzstan', Dial: '996', Mask: '(###) ###-###'},
		{Code: 'KZ', Name: 'Kazakhstan', Dial: '7', Mask: '(###) ###-##-##'},
		{Code: 'NL', Name: 'Netherlands', Dial: '31', Mask: '# ########'},
		{Code: 'PL', Name: 'Poland', Dial: '48', Mask: '### ### ###'},
		{Code: 'RS', Name: 'Serbia', Dial: '381', Mask: '## ### ####'},
		{Code: 'RU', Name: 'Russia', Dial: '7', Mask: '(###) ###-##-##'},
		{Code: 'TR', Name: 'Turkey', Dial: '90', Mask: '(###) ###-##-##'},
		{Code: 'UA', Name: 'Ukraine', Dial: '380', Mask: '(##) ###-##-##'},
		{Code: 'US', Name: 'United States', Dial: '1', Mask: '(###) ###-####'},
		{Code: 'UZ', Name: 'Uzbekistan', Dial: '998', Mask: '(##) ###-##-##'}
	],

	$OnCreate: function () {
		this.Current = function (countries, code) {
			var i = 0;

			while (i < countries.length) {
				if (countries[i].Code === code) return countries[i];

				i++;
			}

			return countries[0] || {Code: '', Name: '', Dial: '', Mask: ''};
		};

		this.Local = function (value, country) {
			var digits = String(value || '').replace(/\D/g, '');
			if (country.Dial && digits.indexOf(country.Dial) === 0)
				digits = digits.substring(country.Dial.length);

			return digits;
		};

		this.Example = function (country) {
			return '+' + country.Dial + ' ' + country.Mask.replace(/#/g, '0');
		};

		this.Matching = function (countries, filter) {
			var query = String(filter || '').toLowerCase().replace(/^\+/, '');
			if (!query)
				return countries;

			return countries.filter(function (country) {
				return country.Name.toLowerCase().indexOf(query) !== -1 || country.Code.toLowerCase() === query || country.Dial.indexOf(query) === 0;
			});
		};
	},

	Masked: function (event) {
		var country = this.Current(this.Countries, this.Country);
		var local = event.detail.Value;

		this.Value = local ? '+' + country.Dial + local : '';

		this.$Emit('input', this.Value);
		this.$Emit('validate', {Value: this.Value, Country: country.Code, Complete: event.detail.Complete, Valid: event.detail.Complete});
	},

	Committed: function () {
		this.$Emit('change', this.Value);
	},

	/* A pasted international number selects its country: the longest matching code wins, the current country on a tie. */
	Pasted: function (event) {
		var text = event.clipboardData ? event.clipboardData.getData('text') : '';
		var digits = text.replace(/\D/g, '');
		var current = this.Current(this.Countries, this.Country);
		var best = null;
		var i = 0;

		if (!/^\s*\+/.test(text) || !digits) return;

		while (i < this.Countries.length) {
			if (digits.indexOf(this.Countries[i].Dial) === 0 && (!best || this.Countries[i].Dial.length > best.Dial.length || (this.Countries[i].Dial.length === best.Dial.length && this.Countries[i].Code === current.Code)))
				best = this.Countries[i];

			i++;
		}

		if (!best) return;

		event.preventDefault();

		this.Country = best.Code;
		this.Value = '+' + digits;

		this.$Emit('country', best.Code);
	},

	Toggle: function (event, node) {
		var list;
		var i = 0;

		if (this.Disabled) return;

		this.Open = !this.Open;

		if (!this.Open) return;

		this.Filter = '';
		list = this.Matching(this.Countries, '');

		while (i < list.length) {
			if (list[i].Code === this.Country)
				this.Active = i;

			i++;
		}

		this.Reveal(node);
	},

	Reveal: function (node) {
		var root = node.closest('.elemenx-phone');

		window.setTimeout(function () {
			var search = root.querySelector('.elemenx-popup-search input');
			var active = root.querySelector('.elemenx-popup .elemenx-option.active');

			if (search)
				search.focus();

			if (active)
				active.scrollIntoView({block: 'nearest'});
		}, 0);
	},

	Close: function () {
		this.Open = false;
	},

	Search: function (event, node) {
		this.Filter = node.value;
		this.Active = 0;
	},

	Hover: function (event, node) {
		this.Active = Number(node.getAttribute('data-index'));
	},

	Pick: function (event, node) {
		this.Choose(Number(node.getAttribute('data-index')), node);
	},

	Choose: function (index, node) {
		var list = this.Matching(this.Countries, this.Filter);
		var previous = this.Current(this.Countries, this.Country);
		var next = list[index];
		var root = node.closest('.elemenx-phone');
		var local;

		if (!next) return;

		local = this.Local(this.Value, previous);

		this.Country = next.Code;
		this.Open = false;
		this.Value = local ? '+' + next.Dial + local : '';

		this.$Emit('country', next.Code);
		this.$Emit('input', this.Value);

		root.querySelector('input[type="tel"]').focus();
	},

	ListKey: function (event, node) {
		var count = this.Matching(this.Countries, this.Filter).length;
		var active;

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			this.Active = count ? (this.Active + (event.key === 'ArrowDown' ? 1 : count - 1)) % count : 0;

			active = node.querySelector('.elemenx-option[data-index="' + this.Active + '"]');

			if (active)
				active.scrollIntoView({block: 'nearest'});
		}
		else if (event.key === 'Enter') {
			event.preventDefault();

			this.Choose(this.Active, node);
		}
		else if (event.key === 'Tab') {
			this.Open = false;
		}
	},

	Dismissed: function (event) {
		var root = event.target.closest('.elemenx-phone');

		this.Open = false;

		if (event.detail.Reason === 'escape')
			root.querySelector('.elemenx-phone-country').focus();
	}
});