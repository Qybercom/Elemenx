/*
 * A calendar of events. Events: [{ID, Title, Start, End, AllDay, Color}], Start and End as 'YYYY-MM-DD' (a whole day)
 * or 'YYYY-MM-DDTHH:mm'. View: month or week; Date is a day of the period shown (today by default). The header moves
 * by a period, back to today, and switches the view.
 * Month: every day lists its events (an event of several days in each of its days), MaxEvents of them, then a
 * "+N more" that opens the week of that day. Week: the hours from StartHour to EndHour (HourHeight pixels each), the
 * events at their time (overlapping ones side by side), the whole-day events above, a line at the present time.
 * FirstDay: 0 Sunday, 1 Monday (by default from Locale).
 * Editable lets the user move events: dragged to another day (in the month and in the whole-day row) they keep their
 * times; dragged in the week they take the day and the time under them, in steps of Snap minutes; the lower edge of a
 * timed event changes its end. A shadow shows where the event goes; Escape cancels. With the focus on an event,
 * Alt with the arrows moves it: a day left or right, Snap minutes up or down. The calendar does not change Events
 * itself: the move event ({Event, Start, End}) asks the owner to.
 * Events: select (the event), day (the date pressed), slot ({Date, Time}: an empty hour pressed in the week),
 * change ({Date, View}), move ({Event, Start, End}).
 */
Elemenx.Component('Calendar', {
	$TemplateURL: 'Calendar.html',
	$StyleURL: 'Calendar.css',
	Events: [],
	View: 'month',
	Date: '',
	Locale: '',
	FirstDay: null,
	MaxEvents: 3,
	StartHour: 7,
	EndHour: 21,
	HourHeight: 48,
	TodayLabel: 'Today',
	MonthLabel: 'Month',
	WeekLabel: 'Week',
	MoreLabel: 'more',
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

		this.Title = function (view, date, locale) {
			var days;
			var format;

			if (view === 'week') {
				days = self.Week(self.Cursor(date));
				format = new Intl.DateTimeFormat(locale || undefined, {day: 'numeric', month: 'short'});

				return format.format(self.Parse(days[0])) + ' – ' + format.format(self.Parse(days[6])) + ', ' + self.Parse(days[6]).getFullYear();
			}

			return new Intl.DateTimeFormat(locale || undefined, {month: 'long', year: 'numeric'}).format(self.Parse(self.Cursor(date)));
		};

		this.Weekdays = function (locale) {
			var first = self.First();
			var format = new Intl.DateTimeFormat(locale || undefined, {weekday: 'short'});
			var names = [];
			var i = 0;

			while (i < 7) {
				names.push(format.format(new Date(2023, 0, 1 + (first + i) % 7)));

				i++;
			}

			return names;
		};

		/* The 42 days of the month view: [{ISO, Day, Outside, Today, Events, More}]. */
		this.Month = function (date, events, max) {
			var cursor = self.Parse(self.Cursor(date));
			var start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
			var offset = (start.getDay() - self.First() + 7) % 7;
			var today = self.ISO(new Date(self.Now));
			var days = [];
			var i = 0;
			var day;
			var iso;
			var list;

			while (i < 42) {
				day = new Date(start.getFullYear(), start.getMonth(), 1 - offset + i);
				iso = self.ISO(day);
				list = self.On(iso, events);

				days.push({ISO: iso, Day: day.getDate(), Outside: day.getMonth() !== cursor.getMonth(), Today: iso === today, Events: list.slice(0, Number(max)), More: Math.max(0, list.length - Number(max))});

				i++;
			}

			return days;
		};

		/* The days of the week view: [{ISO, Name, Day, Today, AllDay, Timed}]. */
		this.Days = function (date, events, locale) {
			var format = new Intl.DateTimeFormat(locale || undefined, {weekday: 'short'});
			var today = self.ISO(new Date(self.Now));

			return self.Week(self.Cursor(date)).map(function (iso) {
				var list = self.On(iso, events);

				return {
					ISO: iso,
					Name: format.format(self.Parse(iso)),
					Day: self.Parse(iso).getDate(),
					Today: iso === today,
					AllDay: list.filter(function (event) {
						return self.Whole(event);
					}),
					Timed: self.Lanes(iso, list.filter(function (event) {
						return !self.Whole(event);
					}))
				};
			});
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
		var self = this;

		/* The line of the present time moves once a minute. */
		this.Ticker = window.setInterval(function () {
			self.Now = Date.now();
		}, 60000);
	},

	$OnDestroy: function () {
		window.clearInterval(this.Ticker);
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

		if (this.FirstDay !== null && this.FirstDay !== '') return Number(this.FirstDay) % 7;

		try {
			locale = new Intl.Locale(this.Locale || navigator.language);

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

	Whole: function (event) {
		return !!event.AllDay || String(event.Start).length <= 10;
	},

	/* The events on the day iso, whole-day ones first, then by their start. */
	On: function (iso, events) {
		var self = this;

		return (events || []).filter(function (event) {
			var start = String(event.Start).substring(0, 10);
			var end = String(event.End || event.Start).substring(0, 10);

			return iso >= start && iso <= end;
		}).sort(function (a, b) {
			return (self.Whole(b) ? 1 : 0) - (self.Whole(a) ? 1 : 0) || String(a.Start).localeCompare(String(b.Start));
		});
	},

	/*
	 * The timed events of a day placed in the hour grid: [{Event, Top, Height, Lane, Lanes}]; overlapping events share
	 * the width in lanes.
	 */
	Lanes: function (iso, events) {
		var self = this;
		var hour = Number(this.HourHeight);
		var start = Number(this.StartHour) * 60;
		var end = Number(this.EndHour) * 60;
		var placed = [];
		var groups = [];

		events.forEach(function (event) {
			var from = self.Parse(String(event.Start).substring(0, 10) === iso ? event.Start : iso + 'T00:00');
			var to = self.Parse(event.End && String(event.End).substring(0, 10) === iso ? event.End : event.End ? iso + 'T23:59' : event.Start);
			var a = Math.max(start, from.getHours() * 60 + from.getMinutes());
			var b = Math.min(end, Math.max(a + 30, to.getHours() * 60 + to.getMinutes()));
			var lane = 0;
			var group;

			if (a >= end || b <= start) return;

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

			placed.push({Event: event, A: a, B: b, Lane: lane, Group: group});
		});

		return placed.map(function (entry) {
			return {Event: entry.Event, Top: (entry.A - start) / 60 * hour, Height: Math.max(20, (entry.B - entry.A) / 60 * hour - 2), Lane: entry.Lane, Lanes: entry.Group.Lanes};
		});
	},

	Go: function (date, view) {
		this.Date = date;
		this.View = view || this.View;

		this.$Emit('change', {Date: date, View: this.View});
	},

	Shift: function (step) {
		var date = this.Parse(this.Cursor(this.Date));

		if (this.View === 'week') this.Go(this.ISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() + step * 7)));
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

	Find: function (id) {
		return (this.Events || []).filter(function (event) {
			return String(event.ID) === String(id);
		})[0];
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
			days = this.Between(String(item.Start).substring(0, 10), target.Date);

			return days ? {Start: this.Shifted(item.Start, days), End: item.End ? this.Shifted(item.End, days) : item.End} : null;
		}

		date = target.Date;

		if (dragging.Mode === 'resize')
			return target.End !== dragging.End ? {Start: item.Start, End: date + 'T' + this.Clock(target.End)} : null;

		if (date === String(item.Start).substring(0, 10) && target.Minutes === dragging.Begin) return null;

		return {Start: date + 'T' + this.Clock(target.Minutes), End: date + 'T' + this.Clock(target.Minutes + dragging.Duration)};
	},

	Move: function (item, result) {
		if (result)
			this.$Emit('move', {Event: item, Start: result.Start, End: result.End});
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
			Mode: !timed ? 'day' : event.target.closest('.elemenx-cal-resize') ? 'resize' : 'time',
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

		document.addEventListener('keydown', this.Escape, true);
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

		if (dragging.Mode === 'day') {
			hit = document.elementFromPoint(event.clientX, event.clientY);
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

		function reset () {
			document.removeEventListener('pointerup', release, true);

			window.setTimeout(function () {
				self.Swallow = false;
			}, 0);
		}

		function release () {
			reset();
		}

		this.Swallow = true;

		if (later) document.addEventListener('pointerup', release, true);
		else reset();
	},

	Abandon: function () {
		document.removeEventListener('keydown', this.Escape, true);

		this.Dragging = null;
		this.Target = null;
	},

	/* Alt and the arrows move the focused event: a day left or right, Snap minutes up or down. */
	Nudge: function (event, node) {
		var item = this.Find(node.getAttribute('data-id'));
		var days = {ArrowLeft: -1, ArrowRight: 1}[event.key];
		var steps = {ArrowUp: -1, ArrowDown: 1}[event.key];
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
