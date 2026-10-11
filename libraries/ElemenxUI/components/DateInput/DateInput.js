/*
 * A date field with its own calendar. Value is an ISO date ('2024-11-22'), or a month ('2024-11') in Mode 'month'; '' when empty.
 * Format uses DD, MM and YYYY ('DD.MM.YYYY'); by default it follows Locale (the browser language).
 * The text accepts only the digits of Format; Min and Max (ISO) limit both the text and the calendar.
 */
Elemenx.Component('DateInput', {
	$TemplateURL: 'DateInput.html',
	$StyleURL: 'DateInput.css',
	Value: '',
	Mode: 'date',
	Format: '',
	Locale: '',
	FirstDay: null,
	Min: '',
	Max: '',
	Placeholder: '',
	TodayLabel: '',
	ClearLabel: 'Clear',
	Size: 'medium',
	Name: null,
	Disabled: false,
	ReadOnly: false,
	Invalid: false,
	Open: false,
	View: 'days',
	Cursor: '',
	Text: null,
	Bad: false,

	$OnCreate: function () {
		var self = this;
		var locale = this.Locale || (navigator.languages && navigator.languages[0]) || navigator.language || 'en';

		this.LocaleName = locale;
		this.TodayText = this.TodayLabel || this.Relative(locale, 'day', 'Today');
		this.Pattern = this.Format || this.LocalePattern(locale);
		this.WeekStart = this.FirstDay === null || this.FirstDay === '' ? this.LocaleFirstDay(locale) : Number(this.FirstDay) % 7;

		this.FormatFor = function (mode) {
			if (mode !== 'month') return self.Pattern;

			return self.Pattern.replace(/[^MY]*DD$/, '').replace(/DD[^MY]*/, '');
		};

		this.MaskFor = function (mode) {
			return self.FormatFor(mode).replace(/YYYY/, '####').replace(/MM/, '##').replace(/DD/, '##');
		};

		this.DigitsOf = function (value, mode) {
			var parts = self.Parts(value);
			if (!parts) return '';

			return self.FormatFor(mode).replace(/YYYY/, self.Pad(parts.Year, 4)).replace(/MM/, self.Pad(parts.Month, 2)).replace(/DD/, self.Pad(parts.Day || 1, 2)).replace(/[^0-9]/g, '');
		};

		this.PlaceholderFor = function (mode) {
			return self.Placeholder || self.FormatFor(mode);
		};

		this.Weekdays = function () {
			var names = [];
			var formatter = new Intl.DateTimeFormat(self.LocaleName, {weekday: 'short'});
			var i = 0;

			while (i < 7) {
				names.push(self.Capital(formatter.format(new Date(2024, 0, 7 + (self.WeekStart + i) % 7))));

				i++;
			}

			return names;
		};

		this.Days = function (cursor, value, min, max) {
			var focus = self.Parts(cursor) || self.Parts(self.Today());
			var first = new Date(focus.Year, focus.Month - 1, 1);
			var offset = (first.getDay() - self.WeekStart + 7) % 7;
			var today = self.Today();
			var days = [];
			var date;
			var iso;
			var i = 0;

			while (i < 42) {
				date = new Date(focus.Year, focus.Month - 1, 1 - offset + i);
				iso = self.ISO(date.getFullYear(), date.getMonth() + 1, date.getDate());

				days.push({
					ISO: iso,
					Day: date.getDate(),
					Outside: date.getMonth() !== focus.Month - 1,
					Today: iso === today,
					Selected: iso === value,
					Disabled: (min && iso < min) || (max && iso > max)
				});

				i++;
			}

			return days;
		};

		this.Months = function (cursor, value, min, max) {
			var focus = self.Parts(cursor) || self.Parts(self.Today());
			var formatter = new Intl.DateTimeFormat(self.LocaleName, {month: 'short'});
			var months = [];
			var key;
			var i = 1;

			while (i <= 12) {
				key = self.ISO(focus.Year, i);

				months.push({
					Key: key,
					Label: self.Capital(formatter.format(new Date(focus.Year, i - 1, 1)).replace('.', '')),
					Selected: String(value || '').substring(0, 7) === key,
					Current: self.Today().substring(0, 7) === key,
					Disabled: (min && key < String(min).substring(0, 7)) || (max && key > String(max).substring(0, 7))
				});

				i++;
			}

			return months;
		};

		this.Years = function (cursor, value) {
			var focus = self.Parts(cursor) || self.Parts(self.Today());
			var start = focus.Year - focus.Year % 12;
			var years = [];
			var i = 0;

			while (i < 12) {
				years.push({
					Year: start + i,
					Selected: String(value || '').substring(0, 4) === String(start + i),
					Current: Number(self.Today().substring(0, 4)) === start + i
				});

				i++;
			}

			return years;
		};

		this.Title = function (cursor, view) {
			var focus = self.Parts(cursor) || self.Parts(self.Today());
			var start = focus.Year - focus.Year % 12;

			if (view === 'years')
				return start + ' – ' + (start + 11);

			if (view === 'months')
				return String(focus.Year);

			return self.Capital(new Intl.DateTimeFormat(self.LocaleName, {month: 'long'}).format(new Date(focus.Year, focus.Month - 1, 1))) + ' ' + focus.Year;
		};
	},

	LocalePattern: function (locale) {
		var pattern = '';
		var parts;
		var i = 0;

		try {
			parts = new Intl.DateTimeFormat(locale, {year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(new Date(2000, 10, 22));
		}
		catch (error) {
			return 'YYYY-MM-DD';
		}

		while (i < parts.length) {
			if (parts[i].type === 'day') pattern += 'DD';
			else if (parts[i].type === 'month') pattern += 'MM';
			else if (parts[i].type === 'year') pattern += 'YYYY';
			else if (parts[i].type === 'literal') pattern += parts[i].value.replace(/\s+/g, '').substring(0, 1) || '.';

			i++;
		}

		return /DD/.test(pattern) && /MM/.test(pattern) && /YYYY/.test(pattern) ? pattern : 'YYYY-MM-DD';
	},

	/* Sunday starts the week in the Americas and a few other regions; Monday elsewhere. */
	LocaleFirstDay: function (locale) {
		var region = (String(locale).split(/[-_]/)[1] || '').toUpperCase();
		var info;

		try {
			info = new Intl.Locale(locale);
			info = info.getWeekInfo ? info.getWeekInfo() : info.weekInfo;

			if (info && info.firstDay) return info.firstDay % 7;
		}
		catch (error) {
			info = null;
		}

		return ['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'IL', 'IN', 'PH', 'ZA', 'AU'].indexOf(region) !== -1 ? 0 : 1;
	},

	/* The word for "today" or "now" in the locale ('Сегодня', 'Heute'), or the fallback. */
	Relative: function (locale, unit, fallback) {
		var text;

		try {
			text = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'}).format(0, unit);
		}
		catch (error) {
			return fallback;
		}

		return text.charAt(0).toUpperCase() + text.substring(1);
	},

	Pad: function (value, length) {
		var text = String(value);

		while (text.length < length) {
			text = '0' + text;
		}

		return text;
	},

	Capital: function (text) {
		return text.charAt(0).toUpperCase() + text.substring(1);
	},

	ISO: function (year, month, day) {
		return this.Pad(year, 4) + '-' + this.Pad(month, 2) + (day ? '-' + this.Pad(day, 2) : '');
	},

	Today: function () {
		var now = new Date();

		return this.ISO(now.getFullYear(), now.getMonth() + 1, now.getDate());
	},

	Parts: function (value) {
		var match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(value || ''));
		if (!match)
			return null;

		return {Year: Number(match[1]), Month: Number(match[2]), Day: match[3] ? Number(match[3]) : 0};
	},

	/* The ISO value of complete digits, or null when they do not make a real date inside Min and Max. */
	Parse: function (digits) {
		var format = this.FormatFor(this.Mode).replace(/[^DMY]/g, '');
		var year = Number(digits.substr(format.indexOf('YYYY'), 4));
		var month = Number(digits.substr(format.indexOf('MM'), 2));
		var day = format.indexOf('DD') === -1 ? 0 : Number(digits.substr(format.indexOf('DD'), 2));
		var date;
		var iso;

		if (digits.length !== format.length || month < 1 || month > 12 || year < 1) return null;

		if (this.Mode === 'month') {
			iso = this.ISO(year, month);

			return (this.Min && iso < String(this.Min).substring(0, 7)) || (this.Max && iso > String(this.Max).substring(0, 7)) ? null : iso;
		}

		date = new Date(year, month - 1, day);

		if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

		iso = this.ISO(year, month, day);

		return (this.Min && iso < this.Min) || (this.Max && iso > this.Max) ? null : iso;
	},

	Set: function (value) {
		if (value === this.Value) return;

		this.Value = value;

		this.$Emit('input', value);
		this.$Emit('change', value);
	},

	Masked: function (event) {
		var digits = event.detail.Value;
		var parsed = event.detail.Complete ? this.Parse(digits) : null;

		this.Text = digits;
		this.Bad = event.detail.Complete && !parsed;

		if (parsed) {
			this.Text = null;
			this.Cursor = parsed;

			this.Set(parsed);
		}
		else if (!digits) {
			this.Text = null;

			this.Set('');
		}
	},

	Committed: function () {
		if (this.Text !== null && !this.Bad)
			this.Text = null;
	},

	Toggle: function (event, node) {
		if (this.Disabled || this.ReadOnly) return;

		if (this.Open) {
			this.Open = false;

			return;
		}

		this.Cursor = this.Value ? (this.Mode === 'month' ? this.Value + '-01' : this.Value) : this.Today();
		this.View = this.Mode === 'month' ? 'months' : 'days';
		this.Open = true;

		this.FocusCursor(node.closest('.elemenx-date'));
	},

	FocusCursor: function (root) {
		window.setTimeout(function () {
			var target = root.querySelector('.elemenx-calendar [data-cursor="true"]') || root.querySelector('.elemenx-calendar button:not(:disabled)');
			if (target)
				target.focus();
		}, 0);
	},

	Shift: function (months, node) {
		var focus = this.Parts(this.Cursor) || this.Parts(this.Today());
		var date = new Date(focus.Year, focus.Month - 1 + months, 1);
		var last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

		this.Cursor = this.ISO(date.getFullYear(), date.getMonth() + 1, Math.min(focus.Day || 1, last));

		if (node)
			this.FocusCursor(node.closest('.elemenx-date'));
	},

	Previous: function (event, node) {
		this.Shift(this.View === 'days' ? -1 : this.View === 'months' ? -12 : -144, node);
	},

	Following: function (event, node) {
		this.Shift(this.View === 'days' ? 1 : this.View === 'months' ? 12 : 144, node);
	},

	Zoom: function (event, node) {
		this.View = this.View === 'days' ? 'months' : 'years';

		this.FocusCursor(node.closest('.elemenx-date'));
	},

	PickDay: function (event, node) {
		var iso = node.getAttribute('data-date');
		var root = node.closest('.elemenx-date');

		this.Text = null;
		this.Bad = false;
		this.Open = false;

		this.Set(iso);

		root.querySelector('.elemenx-input-control').focus();
	},

	PickMonth: function (event, node) {
		var key = node.getAttribute('data-month');
		var root = node.closest('.elemenx-date');

		if (this.Mode === 'month') {
			this.Text = null;
			this.Bad = false;
			this.Open = false;

			this.Set(key);

			root.querySelector('.elemenx-input-control').focus();

			return;
		}

		this.Cursor = key + '-01';
		this.View = 'days';

		this.FocusCursor(root);
	},

	PickYear: function (event, node) {
		var focus = this.Parts(this.Cursor) || this.Parts(this.Today());

		this.Cursor = this.ISO(Number(node.getAttribute('data-year')), focus.Month, 1);
		this.View = 'months';

		this.FocusCursor(node.closest('.elemenx-date'));
	},

	Now: function () {
		var today = this.Today();

		if (this.Mode === 'month')
			today = today.substring(0, 7);

		if ((this.Min && today < this.Min) || (this.Max && today > this.Max)) return;

		this.Text = null;
		this.Bad = false;
		this.Open = false;

		this.Set(today);

		this.$Element().querySelector('.elemenx-input-control').focus();
	},

	Clear: function () {
		this.Text = null;
		this.Bad = false;
		this.Open = false;

		this.Set('');

		this.$Element().querySelector('.elemenx-input-control').focus();
	},

	InputKey: function (event, node) {
		if (event.key === 'ArrowDown' && event.altKey) {
			event.preventDefault();

			this.Toggle(event, node);
		}
	},

	CalendarKey: function (event, node) {
		var focus = this.Parts(this.Cursor);
		var step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7}[event.key];
		var date;

		if (this.View !== 'days' || !focus || event.target.getAttribute('data-date') === null) return;

		if (event.key === 'PageUp' || event.key === 'PageDown') {
			event.preventDefault();

			this.Shift((event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1), node);

			return;
		}

		if (event.key === 'Home' || event.key === 'End') {
			date = new Date(focus.Year, focus.Month - 1, focus.Day);
			step = event.key === 'Home' ? -((date.getDay() - this.WeekStart + 7) % 7) : 6 - (date.getDay() - this.WeekStart + 7) % 7;
		}

		if (!step) return;

		event.preventDefault();

		date = new Date(focus.Year, focus.Month - 1, focus.Day + step);

		this.Cursor = this.ISO(date.getFullYear(), date.getMonth() + 1, date.getDate());

		this.FocusCursor(node.closest('.elemenx-date'));
	},

	Dismissed: function (event) {
		var root = event.target.closest('.elemenx-date');

		this.Open = false;

		if (event.detail.Reason === 'escape')
			root.querySelector('.elemenx-input-control').focus();
	}
});