/*
 * A range of dates. Value: [start, end] as 'YYYY-MM-DD' (or [] for none). The field shows the range in Locale; its
 * button opens two months side by side: the first press picks the start, the second the end (the range shows while
 * the pointer moves), in either order. Presets on the left pick a whole range at once: [{Label, Value: [start, end]}
 * or {Label, Last: days (today included)} or {Label, Period: 'week', 'month', 'previous-month', 'year'}].
 * Min and Max bound the days; FirstDay is the first day of the week (0 Sunday, 1 Monday, the default; 'locale' for the
 * one of Locale).
 * Keys in the months: arrows move a day or a week, Page Up and Down a month, Enter or Space pick, Escape closes.
 * Events: change ([start, end]).
 */
Elemenx.Component('DateRangeInput', {
	$TemplateURL: 'DateRangeInput.html',
	$StyleURL: 'DateRangeInput.css',
	Value: [],
	Min: '',
	Max: '',
	Locale: '',
	FirstDay: null,
	Placeholder: '',
	Presets: [
		{Label: 'Today', Last: 1},
		{Key: 'ui.dateRangeInput.last7', Label: 'Last 7 days', Last: 7},
		{Key: 'ui.dateRangeInput.last30', Label: 'Last 30 days', Last: 30},
		{Key: 'ui.dateRangeInput.thisMonth', Label: 'This month', Period: 'month'},
		{Key: 'ui.dateRangeInput.lastMonth', Label: 'Last month', Period: 'previous-month'},
		{Key: 'ui.dateRangeInput.thisYear', Label: 'This year', Period: 'year'}
	],
	ClearLabel: '',
	Size: 'medium',
	Shape: 'default',
	Name: null,
	Disabled: false,
	Invalid: false,
	Open: false,
	Cursor: '',
	Pending: '',
	Hover: '',

	$OnCreate: function () {
		var self = this;

		this.Text = function (value, locale) {
			var format;

			if (!value || value.length !== 2 || !value[0]) return '';

			format = new Intl.DateTimeFormat(locale || undefined, {day: 'numeric', month: 'short', year: 'numeric'});

			return format.format(self.Parse(value[0])) + ' – ' + format.format(self.Parse(value[1]));
		};

		this.Months = function (cursor) {
			var date = self.Parse(cursor || self.Today());

			return [self.ISO(new Date(date.getFullYear(), date.getMonth(), 1)), self.ISO(new Date(date.getFullYear(), date.getMonth() + 1, 1))];
		};

		this.Title = function (month, locale) {
			return new Intl.DateTimeFormat(locale || undefined, {month: 'long', year: 'numeric'}).format(self.Parse(month));
		};

		this.Weekdays = function (locale) {
			var first = self.First();
			var names = [];
			var format = new Intl.DateTimeFormat(locale || undefined, {weekday: 'short'});
			var i = 0;

			/* 2023-01-01 was a Sunday. */
			while (i < 7) {
				names.push(format.format(new Date(2023, 0, 1 + (first + i) % 7)));

				i++;
			}

			return names;
		};

		/* The 42 days shown for a month, with the range (or the range being picked) marked. */
		this.Days = function (month, value, pending, hover, min, max) {
			var start = self.Parse(month);
			var offset = (start.getDay() - self.First() + 7) % 7;
			var today = self.Today();
			var range = pending ? [pending, hover || pending].sort() : value && value.length === 2 ? value : [];
			var days = [];
			var i = 0;
			var date;
			var iso;

			while (i < 42) {
				date = new Date(start.getFullYear(), start.getMonth(), 1 - offset + i);
				iso = self.ISO(date);

				days.push({
					ISO: iso,
					Day: date.getDate(),
					Outside: date.getMonth() !== start.getMonth(),
					Today: iso === today,
					Start: !!range[0] && iso === range[0],
					End: !!range[1] && iso === range[1],
					Within: !!range[0] && iso > range[0] && iso < range[1],
					Disabled: !!min && iso < min || !!max && iso > max
				});

				i++;
			}

			return days;
		};
	},

	Parse: function (iso) {
		var parts = String(iso).split('-');

		return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	},

	ISO: function (date) {
		function pad (number) {
			return (number < 10 ? '0' : '') + number;
		}

		return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
	},

	Today: function () {
		return this.ISO(new Date());
	},

	/* The first day of the week: FirstDay, Monday by default; 'locale': the one of Locale where the browser knows it, or Monday. */
	First: function () {
		var locale;

		if (this.FirstDay === null || this.FirstDay === '') return 1;

		if (this.FirstDay !== 'locale')
			return Number(this.FirstDay) % 7;

		try {
			locale = new Intl.Locale(this.Locale || Elemenx.Locale.Language());

			if (locale.weekInfo)
				return locale.weekInfo.firstDay % 7;

			if (typeof locale.getWeekInfo === 'function') return locale.getWeekInfo().firstDay % 7;
		}
		catch (error) {
			/* No week data: Monday. */
		}

		return 1;
	},

	/* The range of a preset, as [start, end]. */
	Resolve: function (preset) {
		var today = new Date();
		var y = today.getFullYear();
		var m = today.getMonth();
		var d = today.getDate();
		var day;

		if (preset.Value)
			return preset.Value.slice();

		if (preset.Last)
			return [this.ISO(new Date(y, m, d - Number(preset.Last) + 1)), this.ISO(today)];

		if (preset.Period === 'month')
			return [this.ISO(new Date(y, m, 1)), this.ISO(new Date(y, m + 1, 0))];

		if (preset.Period === 'previous-month')
			return [this.ISO(new Date(y, m - 1, 1)), this.ISO(new Date(y, m, 0))];

		if (preset.Period === 'year')
			return [this.ISO(new Date(y, 0, 1)), this.ISO(new Date(y, 11, 31))];

		day = (today.getDay() - this.First() + 7) % 7;

		return [this.ISO(new Date(y, m, d - day)), this.ISO(new Date(y, m, d - day + 6))];
	},

	Clamp: function (iso) {
		if (this.Min && iso < this.Min) return this.Min;
		if (this.Max && iso > this.Max) return this.Max;

		return iso;
	},

	Set: function (range) {
		this.Value = [this.Clamp(range[0]), this.Clamp(range[1])].sort();
		this.Pending = '';
		this.Hover = '';
		this.Open = false;

		this.$Emit('change', this.Value.slice());
	},

	Toggle: function (event, node) {
		var root = node.closest('.elemenx-range');

		if (this.Disabled) return;

		this.Open = !this.Open;
		this.Pending = '';
		this.Hover = '';

		if (!this.Open) return;

		this.Cursor = this.Value && this.Value.length === 2 ? this.Value[0] : this.Clamp(this.Today());

		window.setTimeout(function () {
			var cursor = root.querySelector('.elemenx-calendar-day[data-cursor="true"]');
			if (cursor)
				cursor.focus();
		}, 0);
	},

	PickDay: function (event, node) {
		this.Choose(node.getAttribute('data-date'));
	},

	Choose: function (iso) {
		if (!this.Pending) {
			this.Pending = iso;
			this.Hover = iso;
			this.Cursor = iso;

			return;
		}

		this.Set([this.Pending, iso]);
	},

	Over: function (event, node) {
		if (this.Pending)
			this.Hover = node.getAttribute('data-date');
	},

	Preset: function (event, node) {
		this.Set(this.Resolve(this.Presets[Number(node.getAttribute('data-index'))]));
	},

	/* A month back or forward: the first month shown moves; the cursor keeps its day where it can. */
	Shift: function (months) {
		var date = this.Parse(this.Cursor || this.Today());

		this.Cursor = this.ISO(new Date(date.getFullYear(), date.getMonth() + months, Math.min(date.getDate(), 28)));
	},

	Previous: function () {
		this.Shift(-1);
	},

	Following: function () {
		this.Shift(1);
	},

	Key: function (event, node) {
		var steps = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7};
		var root = node.closest('.elemenx-range');
		var date;

		if (Elemenx.Locale.Key(event) === 'Escape') {
			event.preventDefault();
			event.stopPropagation();

			this.Open = false;

			root.querySelector('.elemenx-range-toggle').focus();

			return;
		}

		if (!event.target.classList.contains('elemenx-calendar-day')) return;

		if (steps[Elemenx.Locale.Key(event)]) {
			date = this.Parse(this.Cursor);

			this.Cursor = this.Clamp(this.ISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() + steps[Elemenx.Locale.Key(event)])));
		}
		else if (Elemenx.Locale.Key(event) === 'PageUp' || Elemenx.Locale.Key(event) === 'PageDown') {
			this.Shift(Elemenx.Locale.Key(event) === 'PageUp' ? -1 : 1);
		}
		else if (Elemenx.Locale.Key(event) === 'Enter' || Elemenx.Locale.Key(event) === ' ') {
			event.preventDefault();

			this.Choose(this.Cursor);

			return;
		}
		else {
			return;
		}

		event.preventDefault();

		if (this.Pending)
			this.Hover = this.Cursor;

		window.setTimeout(function () {
			var cursor = root.querySelector('.elemenx-calendar-day[data-cursor="true"]');
			if (cursor)
				cursor.focus();
		}, 0);
	},

	Clear: function () {
		this.Value = [];
		this.Pending = '';
		this.Open = false;

		this.$Emit('change', []);
	},

	Dismissed: function () {
		this.Open = false;
		this.Pending = '';
	}
});
