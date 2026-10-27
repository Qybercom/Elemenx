/*
 * A calendar of events. Events: [{ID, Title, Start, End, AllDay, Color, Repeat}], Start and End as 'YYYY-MM-DD' (a
 * whole day; End is its last day) or 'YYYY-MM-DDTHH:mm' (an End at 00:00 ends with the day before). View: day, week,
 * month, months (Span months, 3 by default), quarter, year or years (Span years, 3 by default); Date is a day of the
 * period shown (today by default). The header moves by a period, back to today, and switches the view between Views.
 * Month: every day lists its events, MaxEvents of them, then a "+N more" that opens the week of that day; an event of
 * several days is a bar across them, in the same row of every day it covers, cut at the end of a week with an arrow.
 * Week and day: the hours from StartHour to EndHour (HourHeight pixels each), the events at their time (overlapping
 * ones side by side; one that goes on past midnight is cut there and goes on in the next day), the whole-day events and
 * the ones of a day or more above as bars, a line at the present time. Months, quarter, year and years: a planner, a
 * Timeline of the events (it zooms and moves as a Timeline does).
 * Repeat makes an event recurring: {Every: day, week, month or year, Interval, Days (the days of a week: 0 Sunday to 6
 * Saturday, or MO, TU...), Until (the last day), Count, Except (the days left out)} or an RRULE of RFC 5545
 * (FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=10, UNTIL); its occurrences are made for the period shown, with the ID
 * <ID>@<day>, the Occurrence (the day) and the Source (the event).
 * FirstDay: 0 Sunday, 1 Monday (the default), or 'locale' for the first day of the week of Locale.
 * Editable lets the user move events: dragged to another day (in the month and in the whole-day row) they keep their
 * times; dragged in the week they take the day and the time under them, in steps of Snap minutes; the lower edge of a
 * timed event changes its end, and the end of a bar its last day; in the planner they move and stretch by days. A
 * shadow shows where the event goes; Escape cancels. With the focus on an event, Alt with the arrows moves it: a day
 * left or right, Snap minutes up or down. The calendar does not change Events itself: the move event ({Event, Start,
 * End}, and the Occurrence of a recurring event: the owner moves the series or that day alone) asks the owner to.
 * Events: select (the event), day (the date pressed), slot ({Date, Time}: an empty hour pressed in the week),
 * change ({Date, View}), move ({Event, Start, End, Occurrence}).
 */
Elemenx.Component('Calendar', {
	$TemplateURL: 'Calendar.html',
	$StyleURL: 'Calendar.css',
	$Meta: {
		Group: 'data',
		Icon: 'calendar',
		Description: 'A calendar of events.',
		Events: {
			change: 'The period shown changed: {Date, View}.',
			select: 'An event was pressed: the event.',
			move: 'An event was dragged or resized: {Event, Start, End}, and Occurrence for one of a repeated event.',
			day: 'A day was pressed: its date (\'YYYY-MM-DD\').',
			slot: 'A time of a day was pressed in the week or the day view: {Date, Time (\'HH:MM\')}.'
		},
		Props: {
			Events: 'The events: [{ID, Title, Start, End, AllDay, Color, Repeat}], Start and End as YYYY-MM-DD or YYYY-MM-DDTHH:mm; Repeat {Every, Interval, Days, Until, Count, Except} or an RRULE.',
			View: {Options: ['day', 'week', 'month', 'months', 'quarter', 'year', 'years'], Description: 'day, week, month, months, quarter, year or years.'},
			Views: 'The views the header switches between (day, week, month, quarter and year by default).',
			Span: 'The months of the months view, the years of the years view (3 by default).',
			Date: 'A day of the period shown (today by default).',
			Locale: 'The language of its texts and formats (the language of the page by default).',
			FirstDay: 'The first day of the week: 0 Sunday, 1 Monday, or locale.',
			MaxEvents: 'How many events a day of the month lists before "+N more".',
			StartHour: 'The first hour of the week view.',
			EndHour: 'The last hour of the week view.',
			HourHeight: 'The height of an hour of the week view, in pixels.',
			TodayLabel: 'The text of the Today button (the phrase of the language by default).',
			MonthLabel: 'The text of the Month button.',
			WeekLabel: 'The text of the Week button.',
			MoreLabel: 'The text of "+N more" ({count} is the number).',
			Editable: 'Lets the user drag the events to another day or time (the move event).',
			Snap: 'The step of a move in the week, in minutes.'
		},
		Sample: {Editable: true}
	},
	Events: [],
	View: 'month',
	Views: ['day', 'week', 'month', 'quarter', 'year'],
	Span: 0,
	Date: '',
	Locale: '',
	FirstDay: null,
	MaxEvents: 3,
	StartHour: 7,
	EndHour: 21,
	HourHeight: 48,
	TodayLabel: '',
	MonthLabel: '',
	WeekLabel: '',
	MoreLabel: '',
	Editable: false,
	Snap: 15,
	Now: 0,
	Dragging: null,
	Target: null,
	Swallow: false,

	$OnCreate: function () {
		var self = this;

		this.Now = Date.now();

		/* The channels of the color of an event, for its tints. */
		this.Channels = function (color) {
			return self.$Service('Theme').Channels(color);
		};

		this.Cursor = function (date) {
			return date || self.ISO(new Date(self.Now));
		};

		this.Title = function (view, date, locale, span) {
			var language = locale || Elemenx.Locale.Language() || undefined;
			var days;
			var format;
			var range;
			var last;

			if (view === 'week') {
				days = self.Week(self.Cursor(date));
				format = new Intl.DateTimeFormat(language, {day: 'numeric', month: 'short'});

				return format.format(self.Parse(days[0])) + ' – ' + format.format(self.Parse(days[6])) + ', ' + self.Parse(days[6]).getFullYear();
			}

			if (view === 'day')
				return new Intl.DateTimeFormat(language, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(self.Parse(self.Cursor(date)));

			if (!self.Planner(view))
				return new Intl.DateTimeFormat(language, {month: 'long', year: 'numeric'}).format(self.Parse(self.Cursor(date)));

			range = self.Range(view, date, span);
			last = self.Parse(self.Shifted(range.To, -1));

			if (view === 'year')
				return String(self.Parse(range.From).getFullYear());

			if (view === 'years')
				return self.Parse(range.From).getFullYear() + ' – ' + last.getFullYear();

			if (view === 'quarter')
				return Elemenx.Locale.Text('ui.calendar.quarterTitle', {quarter: Math.floor(self.Parse(range.From).getMonth() / 3) + 1, year: last.getFullYear()});

			format = new Intl.DateTimeFormat(language, {month: 'short', year: 'numeric'});

			return format.format(self.Parse(range.From)) + ' – ' + format.format(last);
		};

		/* The buttons of the views in the header: [{View, Label, Current}]. */
		this.Switch = function (views, view, labels) {
			var phrases = [{View: 'day', Key: 'ui.calendar.day'}, {View: 'week', Key: 'ui.calendar.week'}, {View: 'month', Key: 'ui.calendar.month'}, {View: 'months', Key: 'ui.calendar.months'}, {View: 'quarter', Key: 'ui.calendar.quarter'}, {View: 'year', Key: 'ui.calendar.year'}, {View: 'years', Key: 'ui.calendar.years'}];

			return (views && views.length ? views : ['month', 'week']).map(function (name) {
				return {View: name, Label: labels[name] || Elemenx.Locale.Text((phrases.filter(function (phrase) {
					return phrase.View === name;
				})[0] || phrases[2]).Key), Current: name === view || (name === 'month' && !view)};
			});
		};

		this.Weekdays = function (locale) {
			var first = self.First();
			var format = new Intl.DateTimeFormat(locale || Elemenx.Locale.Language() || undefined, {weekday: 'short'});
			var names = [];
			var i = 0;

			while (i < 7) {
				names.push(format.format(new Date(2023, 0, 1 + (first + i) % 7)));

				i++;
			}

			return names;
		};

		/*
		 * The 42 days of the month view: [{ISO, Day, Outside, Today, Events, More}]. The events of several days are bars in
		 * the same row of each of their days in a week (a spacer keeps a row where a day has no bar in it).
		 */
		this.Month = function (date, events, max) {
			var cursor = self.Parse(self.Cursor(date));
			var start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
			var offset = (start.getDay() - self.First() + 7) % 7;
			var today = self.ISO(new Date(self.Now));
			var first = self.ISO(new Date(start.getFullYear(), start.getMonth(), 1 - offset));
			var all = self.Expand(events, first, self.Shifted(first, 41));
			var days = [];
			var week;
			var w = 0;

			while (w < 6) {
				week = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
					return self.Shifted(first, w * 7 + i);
				});

				self.Stack(week, all, function (event) {
					return self.LastDay(event) > String(event.Start).substring(0, 10);
				}).forEach(function (items, i) {
					var day = self.Parse(week[i]);
					var shown = items.slice(0, Number(max));
					var hidden = items.slice(Number(max)).filter(function (item) {
						return !item.Spacer;
					}).length;

					/* A spacer that only a hidden row would need is no use. */
					while (shown.length && shown[shown.length - 1].Spacer) {
						shown.pop();
					}

					days.push({ISO: week[i], Day: day.getDate(), Outside: day.getMonth() !== cursor.getMonth(), Today: week[i] === today, Events: shown, More: hidden});
				});

				w++;
			}

			return days;
		};

		/* The days of the week or of the day view: [{ISO, Name, Day, Today, AllDay, Timed}]. */
		this.Days = function (date, events, locale, view) {
			var format = new Intl.DateTimeFormat(locale || Elemenx.Locale.Language() || undefined, {weekday: 'short'});
			var today = self.ISO(new Date(self.Now));
			var isos = view === 'day' ? [self.Cursor(date)] : self.Week(self.Cursor(date));
			var all = self.Expand(events, isos[0], isos[isos.length - 1]);
			var bar = function (event) {
				return self.Whole(event) || !!event.End && self.Parse(event.End) - self.Parse(event.Start) >= 86400000;
			};
			var rows = self.Stack(isos, all, bar, true);

			return isos.map(function (iso, i) {
				return {
					ISO: iso,
					Name: format.format(self.Parse(iso)),
					Day: self.Parse(iso).getDate(),
					Today: iso === today,
					AllDay: rows[i],
					Timed: self.Lanes(iso, self.On(iso, all).filter(function (event) {
						return !bar(event);
					}))
				};
			});
		};

		/*
		 * The items of a row of days: for each day [{Key, Event, Bar, Spacer, Begins, Ends, Earlier, Later, Head}]. The
		 * events bar() takes are bars in rows of their own, the same row in every day they cover (the first free one); the
		 * others follow them in each of their days. Only bars: the others are left out.
		 */
		this.Stack = function (isos, events, bar, only) {
			var rows = [];
			var bars = [];
			var first = isos[0];
			var last = isos[isos.length - 1];

			(events || []).filter(function (event) {
				return bar(event) && String(event.Start).substring(0, 10) <= last && self.LastDay(event) >= first;
			}).sort(function (a, b) {
				return String(a.Start).localeCompare(String(b.Start)) || self.LastDay(b).localeCompare(self.LastDay(a));
			}).forEach(function (event) {
				var from = String(event.Start).substring(0, 10) < first ? first : String(event.Start).substring(0, 10);
				var to = self.LastDay(event) > last ? last : self.LastDay(event);
				var row = 0;

				while (rows[row] && rows[row].some(function (taken) {
					return taken.From <= to && from <= taken.To;
				})) {
					row++;
				}

				rows[row] = (rows[row] || []).concat([{From: from, To: to}]);

				bars.push({Event: event, Row: row, From: from, To: to});
			});

			return isos.map(function (iso, index) {
				var items = [];
				var row = 0;
				var here = bars.filter(function (entry) {
					return entry.From <= iso && iso <= entry.To;
				});
				var count = here.reduce(function (most, entry) {
					return Math.max(most, entry.Row + 1);
				}, 0);
				var entry;

				while (row < count) {
					entry = here.filter(function (candidate) {
						return candidate.Row === row;
					})[0];

					if (entry) {
						items.push({
							Key: entry.Event.ID,
							Event: entry.Event,
							Bar: true,
							Begins: iso === String(entry.Event.Start).substring(0, 10),
							Ends: iso === self.LastDay(entry.Event),
							Earlier: index === 0 && iso !== String(entry.Event.Start).substring(0, 10),
							Later: index === isos.length - 1 && iso !== self.LastDay(entry.Event),
							Head: iso === entry.From
						});
					}
					else {
						items.push({Key: 'spacer-' + row, Spacer: true});
					}

					row++;
				}

				if (!only) {
					self.On(iso, events).filter(function (event) {
						return !bar(event);
					}).forEach(function (event) {
						items.push({Key: event.ID, Event: event, Begins: true, Ends: true, Head: true});
					});
				}

				return items;
			});
		};

		/* The planner: the events of the period as the ranges of a Timeline. */
		this.Plan = function (view, date, span, events) {
			var range = self.Range(view, date, span);

			return self.Expand(events, range.From, self.Shifted(range.To, -1)).map(function (event) {
				var first = String(event.Start).substring(0, 10);
				var end = self.Shifted(self.LastDay(event), 1);

				/* By whole days: an event of an hour is a day of the planner, as it is a line in a day of the month. */
				return {ID: String(event.ID), From: first, To: end, Label: event.Title, Color: event.Color || '', Event: event};
			});
		};

		/* The days of a planner view: {From, To}, To the day after its last. */
		this.Range = function (view, date, span) {
			var cursor = self.Parse(self.Cursor(date));
			var months = {quarter: 3, year: 12}[view] || (view === 'years' ? 12 * (Number(span) || 3) : Number(span) || 3);
			var first = view === 'quarter' ? new Date(cursor.getFullYear(), Math.floor(cursor.getMonth() / 3) * 3, 1) : view === 'year' || view === 'years' ? new Date(cursor.getFullYear(), 0, 1) : new Date(cursor.getFullYear(), cursor.getMonth(), 1);

			return {From: self.ISO(first), To: self.ISO(new Date(first.getFullYear(), first.getMonth() + months, 1)), Months: months};
		};

		this.Hours = function (start, end) {
			var hours = [];
			var hour = Number(start);

			while (hour < Number(end)) {
				hours.push({Hour: hour, Label: (hour < 10 ? '0' : '') + hour + ':00'});

				hour++;
			}

			return hours;
		};

		this.Time = function (event) {
			return self.Whole(event) ? '' : String(event.Start).substring(11, 16);
		};

		this.Whole = function (event) {
			return !!event.AllDay || String(event.Start).length <= 10;
		};

		this.Planner = function (view) {
			return ['months', 'quarter', 'year', 'years'].indexOf(view) !== -1;
		};

		this.Grid = function (view) {
			return view === 'week' || view === 'day';
		};

		/* The shadow of a timed event being moved or stretched, in the column of date: {Top, Height, Label} or null. */
		this.Shadow = function (target, date) {
			var start;
			var end;

			if (!target || target.Date !== date || target.Minutes == null) return null;

			start = target.Minutes;
			end = target.End;

			return {
				Top: (start - Number(self.StartHour) * 60) / 60 * Number(self.HourHeight),
				Height: Math.max(20, (end - start) / 60 * Number(self.HourHeight) - 2),
				Label: self.Clock(start) + ' – ' + self.Clock(end)
			};
		};

		this.IsDragged = function (dragging, id) {
			return !!dragging && dragging.Active && String(dragging.ID) === String(id);
		};

		/* Where the present time stands in the week grid, or -1 outside the hours shown. */
		this.NowTop = function (now) {
			var date = new Date(now);
			var minutes = date.getHours() * 60 + date.getMinutes() - Number(self.StartHour) * 60;
			if (minutes < 0 || minutes > (Number(self.EndHour) - Number(self.StartHour)) * 60) return -1;

			return minutes / 60 * Number(self.HourHeight);
		};
	},

	$OnReady: function () {
		this.Tick();
	},

	$OnDestroy: function () {
		window.clearInterval(this.Ticker);
	},

	/* Asleep (Elemenx.Cache keeps it out of the page) its clock stops; awake it shows the time of now. */
	$OnSleep: function () {
		window.clearInterval(this.Ticker);
	},

	$OnWake: function () {
		this.Now = Date.now();

		this.Tick();
	},

	/* The line of the present time moves once a minute. */
	Tick: function () {
		var self = this;

		window.clearInterval(this.Ticker);

		this.Ticker = window.setInterval(function () {
			self.Now = Date.now();
		}, 60000);
	},

	Parse: function (iso) {
		var text = String(iso);
		var parts = text.substring(0, 10).split('-');
		var time = text.length > 10 ? text.substring(11, 16).split(':') : ['0', '0'];

		return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), Number(time[0]) || 0, Number(time[1]) || 0);
	},

	ISO: function (date) {
		function pad (number) {
			return (number < 10 ? '0' : '') + number;
		}

		return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
	},

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

	/* The seven days of the week of iso. */
	Week: function (iso) {
		var date = this.Parse(iso);
		var offset = (date.getDay() - this.First() + 7) % 7;
		var days = [];
		var i = 0;

		while (i < 7) {
			days.push(this.ISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset + i)));

			i++;
		}

		return days;
	},

	/* The last day of an event: an End at 00:00 ends with the day before (regression: the next day had a block of 30 minutes). */
	LastDay: function (event) {
		var end = String(event.End || event.Start);
		var day = end.substring(0, 10);
		if (end.length > 10 && end.substring(11, 16) === '00:00' && day > String(event.Start).substring(0, 10)) return this.Shifted(day, -1);

		return day;
	},

	/* The events on the day iso, whole-day ones first, then by their start. */
	On: function (iso, events) {
		var self = this;

		return (events || []).filter(function (event) {
			return iso >= String(event.Start).substring(0, 10) && iso <= self.LastDay(event);
		}).sort(function (a, b) {
			return (self.Whole(b) ? 1 : 0) - (self.Whole(a) ? 1 : 0) || String(a.Start).localeCompare(String(b.Start));
		});
	},

	/*
	 * The timed events of a day placed in the hour grid: [{Event, Top, Height, Lane, Lanes, Before, After, Time}];
	 * overlapping events share the width in lanes. An event that began the day before starts at midnight (Before), one
	 * that goes on the next day ends at midnight (After).
	 */
	Lanes: function (iso, events) {
		var self = this;
		var hour = Number(this.HourHeight);
		var start = Number(this.StartHour) * 60;
		var end = Number(this.EndHour) * 60;
		var placed = [];
		var groups = [];

		events.forEach(function (event) {
			var before = String(event.Start).substring(0, 10) < iso;
			var after = !!event.End && String(event.End).substring(0, 10) > iso;
			var from = before ? 0 : self.Minutes(event.Start);
			var to = after ? 1440 : event.End ? self.Minutes(event.End) : from;
			var a = Math.max(start, from);
			var b = Math.min(end, Math.max(a + 30, to));
			var lane = 0;
			var group;

			/* Out of the hours shown (regression: a piece that ended before StartHour showed as half an hour at its top). */
			if (a >= end || Math.max(from + 30, to) <= start) return;

			while (placed.some(function (entry) {
				return entry.Lane === lane && entry.A < b && a < entry.B;
			})) {
				lane++;
			}

			group = groups.filter(function (entry) {
				return entry.A < b && a < entry.B;
			})[0];

			if (!group) {
				group = {A: a, B: b, Lanes: 0};

				groups.push(group);
			}

			group.A = Math.min(group.A, a);
			group.B = Math.max(group.B, b);
			group.Lanes = Math.max(group.Lanes, lane + 1);

			placed.push({Event: event, A: a, B: b, Lane: lane, Group: group, Before: before, After: after});
		});

		return placed.map(function (entry) {
			return {
				Event: entry.Event,
				Top: (entry.A - start) / 60 * hour,
				Height: Math.max(20, (entry.B - entry.A) / 60 * hour - 2),
				Lane: entry.Lane,
				Lanes: entry.Group.Lanes,
				Before: entry.Before,
				After: entry.After,
				Time: entry.Before ? '… ' + String(entry.Event.End).substring(11, 16) : self.Time(entry.Event) + (entry.After ? ' …' : '')
			};
		});
	},

	/*
	 * The events of the days from to to (YYYY-MM-DD) with the occurrences of the recurring ones in place of them: a copy
	 * of the event at each of its days, with the ID <ID>@<day>, the Occurrence (the day) and the Source (the event).
	 */
	Expand: function (events, from, to) {
		var self = this;
		var result = [];

		(events || []).forEach(function (event) {
			var rule = self.Rule(event.Repeat);

			if (!rule) {
				result.push(event);

				return;
			}

			self.Dates(event, rule, from, to).forEach(function (day) {
				result.push(self.Occurrence(event, day));
			});
		});

		return result;
	},

	/* A Repeat as {Every, Interval, Days, Until, Count, Except}: from itself or from an RRULE; null for none. */
	Rule: function (repeat) {
		var names = {SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6};
		var frequencies = {DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year'};
		var parts = {};
		var rule;

		if (!repeat)
			return null;

		if (typeof repeat === 'string') {
			repeat.replace(/^RRULE:/i, '').split(';').forEach(function (part) {
				var pair = part.split('=');
				if (pair[1] !== undefined)
					parts[pair[0].toUpperCase()] = pair[1];
			});

			repeat = {
				Every: frequencies[String(parts.FREQ).toUpperCase()],
				Interval: parts.INTERVAL,
				Days: parts.BYDAY ? parts.BYDAY.split(',') : null,
				Count: parts.COUNT,
				Until: parts.UNTIL ? parts.UNTIL.substring(0, 4) + '-' + parts.UNTIL.substring(4, 6) + '-' + parts.UNTIL.substring(6, 8) : ''
			};
		}

		rule = {
			Every: ['day', 'week', 'month', 'year'].indexOf(repeat.Every) !== -1 ? repeat.Every : 'week',
			Interval: Math.max(1, Math.floor(Number(repeat.Interval) || 1)),
			Days: repeat.Days && repeat.Days.length ? repeat.Days.map(function (day) {
				return typeof day === 'number' ? day % 7 : names[String(day).replace(/^[+-]?\d+/, '').toUpperCase()];
			}).filter(function (day) {
				return day !== undefined;
			}) : null,
			Until: repeat.Until ? String(repeat.Until).substring(0, 10) : '',
			Count: Math.max(0, Math.floor(Number(repeat.Count) || 0)),
			Except: (repeat.Except || []).map(function (day) {
				return String(day).substring(0, 10);
			})
		};

		return rule;
	},

	/* The days a recurring event takes place on that touch the days from to to. */
	Dates: function (event, rule, from, to) {
		var first = String(event.Start).substring(0, 10);
		var length = this.Between(first, this.LastDay(event));
		var start = this.Parse(first);
		var monday = this.Shifted(first, -((start.getDay() + 6) % 7));
		var days = [];
		var count = 0;
		var step = 0;
		var day;
		var date;

		while (step < 100000) {
			if (rule.Every === 'day') {
				day = this.Shifted(first, step * rule.Interval);
			}
			else if (rule.Every === 'week' && rule.Days) {
				day = this.Shifted(first, step);

				/* The days of the weeks it repeats in: every Interval weeks from the week of its start (weeks from Monday, as RFC 5545). */
				if (Math.floor(this.Between(monday, day) / 7) % rule.Interval || rule.Days.indexOf(this.Parse(day).getDay()) === -1) {
					step++;

					if (day > to || rule.Until && day > rule.Until) break;

					continue;
				}
			}
			else if (rule.Every === 'week') {
				day = this.Shifted(first, step * 7 * rule.Interval);
			}
			else {
				date = rule.Every === 'month' ? new Date(start.getFullYear(), start.getMonth() + step * rule.Interval, start.getDate()) : new Date(start.getFullYear() + step * rule.Interval, start.getMonth(), start.getDate());
				day = this.ISO(date);

				/* The 31st of a month without one, the 29th of February out of a leap year: none that time. */
				if (date.getDate() !== start.getDate()) {
					step++;

					continue;
				}
			}

			step++;

			if (day > to || rule.Until && day > rule.Until || rule.Count && count >= rule.Count) break;

			count++;

			if (this.Shifted(day, length) >= from && rule.Except.indexOf(day) === -1)
				days.push(day);
		}

		return days;
	},

	/* The occurrence of a recurring event on a day. */
	Occurrence: function (event, day) {
		var days = this.Between(String(event.Start).substring(0, 10), day);
		var copy = {};
		var key;

		for (key in event) {
			if (Object.prototype.hasOwnProperty.call(event, key))
				copy[key] = event[key];
		}

		copy.ID = event.ID + '@' + day;
		copy.Start = this.Shifted(event.Start, days);
		copy.End = event.End ? this.Shifted(event.End, days) : event.End;
		copy.Occurrence = day;
		copy.Source = event;

		return copy;
	},

	Go: function (date, view) {
		this.Date = date;
		this.View = view || this.View;

		this.$Emit('change', {Date: date, View: this.View});
	},

	Shift: function (step) {
		var date = this.Parse(this.Cursor(this.Date));

		if (this.View === 'week') this.Go(this.ISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() + step * 7)));
		else if (this.View === 'day') this.Go(this.ISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() + step)));
		else if (this.Planner(this.View)) this.Go(this.ISO(new Date(date.getFullYear(), date.getMonth() + step * this.Range(this.View, this.Date, this.Span).Months, 1)));
		else this.Go(this.ISO(new Date(date.getFullYear(), date.getMonth() + step, 1)));
	},

	Previous: function () {
		this.Shift(-1);
	},

	Following: function () {
		this.Shift(1);
	},

	Today: function () {
		this.Go(this.ISO(new Date()));
	},

	ShowMonth: function () {
		this.Go(this.Cursor(this.Date), 'month');
	},

	ShowWeek: function () {
		this.Go(this.Cursor(this.Date), 'week');
	},

	/* A button of the views in the header. */
	ShowView: function (event, node) {
		this.Go(this.Cursor(this.Date), node.getAttribute('data-view'));
	},

	/* An event by its ID, or the occurrence of a recurring one by <ID>@<day>. */
	Find: function (id) {
		var text = String(id);
		var at = text.lastIndexOf('@');
		var found = (this.Events || []).filter(function (event) {
			return String(event.ID) === text;
		})[0];
		if (found || at === -1) return found;

		found = this.Find(text.substring(0, at));

		return found && found.Repeat ? this.Occurrence(found, text.substring(at + 1)) : undefined;
	},

	/* The planner: a press on a range selects its event, a drag moves it by days, an edge stretches it. */
	PlanSelect: function (change) {
		this.$Emit('select', change.Item.Event);
	},

	PlanMove: function (change) {
		var item = change.Item.Event;
		var days = this.Between(String(item.Start).substring(0, 10), String(change.From).substring(0, 10));
		if (days)
			this.Move(item, {Start: this.Shifted(item.Start, days), End: item.End ? this.Shifted(item.End, days) : item.End});
	},

	PlanResize: function (change) {
		var item = change.Item.Event;
		var start = this.Shifted(item.Start, this.Between(String(item.Start).substring(0, 10), String(change.From).substring(0, 10)));
		var last = this.Shifted(String(change.To).substring(0, 10), -1);
		var end;

		if (last < String(start).substring(0, 10))
			last = String(start).substring(0, 10);

		if (this.Whole(item)) end = last;
		else if (item.End && String(item.End).substring(11, 16) === '00:00') end = this.Shifted(last, 1) + 'T00:00';
		else end = last + 'T' + (item.End ? String(item.End).substring(11, 16) : '23:59');

		if (start !== item.Start || end !== item.End)
			this.Move(item, {Start: start, End: end});
	},

	Pick: function (event, node) {
		var item = this.Find(node.getAttribute('data-id'));

		event.stopPropagation();

		/* The click that ends a drag is not a choice of the event. */
		if (this.Swallow) {
			this.Swallow = false;

			return;
		}

		if (item)
			this.$Emit('select', item);
	},

	/* 'HH:mm' of minutes after midnight. */
	Clock: function (minutes) {
		var hours = Math.floor(minutes / 60);
		var rest = minutes % 60;

		return (hours < 10 ? '0' : '') + hours + ':' + (rest < 10 ? '0' : '') + rest;
	},

	Minutes: function (iso) {
		var date = this.Parse(iso);

		return date.getHours() * 60 + date.getMinutes();
	},

	/* The date iso moved by days. */
	Shifted: function (iso, days) {
		var date = this.Parse(iso);
		var day = this.ISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));

		return String(iso).length > 10 ? day + String(iso).substring(10) : day;
	},

	Between: function (from, to) {
		return Math.round((this.Parse(to) - this.Parse(from)) / 86400000);
	},

	/* The new Start and End of the event dragged to the target, or null when it would not move. */
	Result: function (item, dragging, target) {
		var days;
		var date;

		if (!target)
			return null;

		if (dragging.Mode === 'day') {
			days = this.Between(dragging.From || String(item.Start).substring(0, 10), target.Date);

			return days ? {Start: this.Shifted(item.Start, days), End: item.End ? this.Shifted(item.End, days) : item.End} : null;
		}

		/* The end of a bar: its last day goes to the day under the pointer, no earlier than its first. */
		if (dragging.Mode === 'span') {
			date = target.Date < String(item.Start).substring(0, 10) ? String(item.Start).substring(0, 10) : target.Date;

			if (date === this.LastDay(item)) return null;

			if (this.Whole(item))
				return {Start: item.Start, End: date};

			return {Start: item.Start, End: item.End && String(item.End).substring(11, 16) === '00:00' ? this.Shifted(date, 1) + 'T00:00' : date + 'T' + (item.End ? String(item.End).substring(11, 16) : '23:59')};
		}

		date = target.Date;

		if (dragging.Mode === 'resize')
			return target.End !== dragging.End ? {Start: item.Start, End: date + 'T' + this.Clock(target.End)} : null;

		if (date === String(item.Start).substring(0, 10) && target.Minutes === dragging.Begin) return null;

		return {Start: date + 'T' + this.Clock(target.Minutes), End: date + 'T' + this.Clock(target.Minutes + dragging.Duration)};
	},

	/* A move asked of the owner; of an occurrence: its event and the day of the occurrence. */
	Move: function (item, result) {
		if (!result) return;

		if (item.Source) this.$Emit('move', {Event: item.Source, Start: result.Start, End: result.End, Occurrence: item.Occurrence});
		else this.$Emit('move', {Event: item, Start: result.Start, End: result.End});
	},

	/* A press on an event starts a drag (after a few pixels): the whole event, or its end from the lower edge. */
	Grab: function (event, node) {
		var item = this.Find(node.getAttribute('data-id'));
		var timed = node.classList.contains('elemenx-cal-block');
		var start;
		var end;

		if (!this.Editable || !item || event.button !== 0) return;

		start = this.Minutes(item.Start);
		end = item.End ? this.Minutes(item.End) : start + 60;

		node.setPointerCapture(event.pointerId);

		this.Dragging = {
			ID: item.ID,
			Mode: !timed ? (event.target.closest('.elemenx-cal-resize') ? 'span' : 'day') : event.target.closest('.elemenx-cal-resize') ? 'resize' : 'time',
			From: node.closest('[data-date]') ? node.closest('[data-date]').getAttribute('data-date') : '',
			X: event.clientX,
			Y: event.clientY,
			Active: false,
			Begin: start,
			End: end,
			Duration: Math.max(Number(this.Snap), end - start),
			Grab: timed ? (event.clientY - node.getBoundingClientRect().top) / Number(this.HourHeight) * 60 : 0
		};

		this.Target = null;

		var self = this;

		this.Escape = function (key) {
			if (key.key === 'Escape') {
				key.preventDefault();

				if (self.Dragging && self.Dragging.Active)
					self.Hush(true);

				self.Abandon();
			}
		};

		this.Listened = (this.$Element().ownerDocument || document);

		this.Listened.addEventListener('keydown', this.Escape, true);
	},

	/* The target under the pointer: a day, or a day and a time in the week. */
	Haul: function (event, node) {
		var dragging = this.Dragging;
		var root = node.closest('.elemenx-cal');
		var snap = Number(this.Snap) || 15;
		var hit;
		var columns;
		var column = null;
		var rect;
		var minutes;
		var i = 0;

		if (!dragging) return;

		if (!dragging.Active) {
			if (Math.abs(event.clientX - dragging.X) + Math.abs(event.clientY - dragging.Y) < 4) return;

			dragging.Active = true;
			this.Dragging = dragging;
		}

		if (dragging.Mode === 'day' || dragging.Mode === 'span') {
			hit = (this.$Element().ownerDocument || document).elementFromPoint(event.clientX, event.clientY);
			hit = hit && hit.closest('[data-date]');

			if (hit && root.contains(hit))
				this.Target = {Date: hit.getAttribute('data-date')};

			return;
		}

		columns = root.querySelectorAll('.elemenx-cal-column');

		while (i < columns.length) {
			rect = columns[i].getBoundingClientRect();

			if (dragging.Mode === 'resize' ? columns[i].getAttribute('data-date') === String(this.Find(dragging.ID).Start).substring(0, 10) : event.clientX >= rect.left && event.clientX < rect.right)
				column = columns[i];

			i++;
		}

		if (!column) return;

		rect = column.getBoundingClientRect();
		minutes = Number(this.StartHour) * 60 + (event.clientY - rect.top) / Number(this.HourHeight) * 60;

		if (dragging.Mode === 'resize') {
			minutes = Math.max(dragging.Begin + snap, Math.min(Number(this.EndHour) * 60, Math.round(minutes / snap) * snap));

			this.Target = {Date: column.getAttribute('data-date'), Minutes: dragging.Begin, End: minutes};

			return;
		}

		minutes = Math.round((minutes - dragging.Grab) / snap) * snap;
		minutes = Math.max(Number(this.StartHour) * 60, Math.min(Number(this.EndHour) * 60 - dragging.Duration, minutes));

		this.Target = {Date: column.getAttribute('data-date'), Minutes: minutes, End: minutes + dragging.Duration};
	},

	Drop: function (event, node) {
		var dragging = this.Dragging;
		if (!dragging) return;

		if (node.hasPointerCapture(event.pointerId))
			node.releasePointerCapture(event.pointerId);

		if (dragging.Active) {
			this.Hush(false);

			if (event.type === 'pointerup')
				this.Move(this.Find(dragging.ID), this.Result(this.Find(dragging.ID), dragging, this.Target));
		}

		this.Abandon();
	},

	/*
	 * The click that follows the release of a drag (or of a drag cancelled by Escape) is not a choice of the event;
	 * the next press counts again. later: the release is still to come.
	 */
	Hush: function (later) {
		var self = this;
		var owner = (this.$Element().ownerDocument || document);

		function reset () {
			owner.removeEventListener('pointerup', release, true);

			window.setTimeout(function () {
				self.Swallow = false;
			}, 0);
		}

		function release () {
			reset();
		}

		this.Swallow = true;

		if (later) owner.addEventListener('pointerup', release, true);
		else reset();
	},

	Abandon: function () {
		(this.Listened || document).removeEventListener('keydown', this.Escape, true);

		this.Dragging = null;
		this.Target = null;
	},

	/* Alt and the arrows move the focused event: a day left or right, Snap minutes up or down. */
	Nudge: function (event, node) {
		var item = this.Find(node.getAttribute('data-id'));
		var days = {ArrowLeft: -1, ArrowRight: 1}[Elemenx.Locale.Key(event)];
		var steps = {ArrowUp: -1, ArrowDown: 1}[Elemenx.Locale.Key(event)];
		var minutes;

		if (!this.Editable || !item || !event.altKey || (!days && !steps)) return;

		event.preventDefault();

		if (days) {
			this.Move(item, {Start: this.Shifted(item.Start, days), End: item.End ? this.Shifted(item.End, days) : item.End});

			return;
		}

		if (this.Whole(item)) return;

		minutes = steps * (Number(this.Snap) || 15);

		this.Move(item, {
			Start: String(item.Start).substring(0, 11) + this.Clock(Math.max(0, Math.min(1439, this.Minutes(item.Start) + minutes))),
			End: item.End ? String(item.End).substring(0, 11) + this.Clock(Math.max(0, Math.min(1439, this.Minutes(item.End) + minutes))) : item.End
		});
	},

	PickDay: function (event, node) {
		this.$Emit('day', node.getAttribute('data-date'));
	},

	More: function (event, node) {
		event.stopPropagation();

		this.Go(node.getAttribute('data-date'), 'week');
	},

	/* A press on an empty hour of a day: the hour and the quarter under the pointer. */
	Slot: function (event, node) {
		var rect = node.getBoundingClientRect();
		var minutes = Number(this.StartHour) * 60 + Math.floor((event.clientY - rect.top) / Number(this.HourHeight) * 4) * 15;
		var hours = Math.floor(minutes / 60);
		var rest = minutes % 60;

		this.$Emit('slot', {Date: node.getAttribute('data-date'), Time: (hours < 10 ? '0' : '') + hours + ':' + (rest < 10 ? '0' : '') + rest});
	}
});
