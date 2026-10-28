<!-- generated -->
# Calendar

A calendar of events. Events: [{ID, Title, Start, End, AllDay, Color, Repeat}], Start and End as 'YYYY-MM-DD' (a whole day; End is its last day) or 'YYYY-MM-DDTHH:mm' (an End at 00:00 ends with the day before). View: day, week, month, months (Span months, 3 by default), quarter, year or years (Span years, 3 by default); Date is a day of the period shown (today by default). The header moves by a period, back to today, and switches the view between Views. Month: every day lists its events, MaxEvents of them, then a "+N more" that opens the week of that day; an event of several days is a bar across them, in the same row of every day it covers, cut at the end of a week with an arrow. Week and day: the hours from StartHour to EndHour (HourHeight pixels each), the events at their time (overlapping ones side by side; one that goes on past midnight is cut there and goes on in the next day), the whole-day events and the ones of a day or more above as bars, a line at the present time. Months, quarter, year and years: a planner, a Timeline of the events (it zooms and moves as a Timeline does). Repeat makes an event recurring: {Every: day, week, month or year, Interval, Days (the days of a week: 0 Sunday to 6 Saturday, or MO, TU...), Until (the last day), Count, Except (the days left out)} or an RRULE of RFC 5545 (FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=10, UNTIL); its occurrences are made for the period shown, with the ID <ID>@<day>, the Occurrence (the day) and the Source (the event). FirstDay: 0 Sunday, 1 Monday (the default), or 'locale' for the first day of the week of Locale. Editable lets the user move events: dragged to another day (in the month and in the whole-day row) they keep their times; dragged in the week they take the day and the time under them, in steps of Snap minutes; the lower edge of a timed event changes its end, and the end of a bar its last day; in the planner they move and stretch by days. A shadow shows where the event goes; Escape cancels. With the focus on an event, Alt with the arrows moves it: a day left or right, Snap minutes up or down. The calendar does not change Events itself: the move event ({Event, Start, End}, and the Occurrence of a recurring event: the owner moves the series or that day alone) asks the owner to. Events: select (the event), day (the date pressed), slot ({Date, Time}: an empty hour pressed in the week), change ({Date, View}), move ({Event, Start, End, Occurrence}).

## Properties

| Property | Default |
| --- | --- |
| `Events` | `[]` |
| `View` | `'month'` |
| `Views` | `['day', 'week', 'month', 'quarter', 'year']` |
| `Span` | `0` |
| `Date` | `''` |
| `Locale` | `''` |
| `FirstDay` | `null` |
| `MaxEvents` | `3` |
| `StartHour` | `7` |
| `EndHour` | `21` |
| `HourHeight` | `48` |
| `TodayLabel` | `''` |
| `MonthLabel` | `''` |
| `WeekLabel` | `''` |
| `MoreLabel` | `''` |
| `Editable` | `false` |
| `Snap` | `15` |

## Events

- `change`: The period shown changed: {Date, View}.
- `select`: An event was pressed: the event.
- `move`: An event was dragged or resized: {Event, Start, End}, and Occurrence for one of a repeated event.
- `day`: A day was pressed: its date ('YYYY-MM-DD').
- `slot`: A time of a day was pressed in the week or the day view: {Date, Time ('HH:MM')}.

## Example

```example
<div class="docs-frame tall">
	<Calendar [events]="Events" [view]="View" Editable="true" (move)="Moved" (select)="Selected" (change)="Changed" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	View: 'month',
	Note: 'Drag an event to another day; switch to the week to drag it in time, to the quarter to plan.',
	Events: [],

	$OnCreate: function () {
		function day (offset, time) {
			var date = new Date();

			date.setDate(date.getDate() + offset);

			return date.toISOString().slice(0, 10) + (time ? 'T' + time : '');
		}

		this.Events = [
			{ID: 1, Title: 'Planning', Start: day(0, '10:00'), End: day(0, '11:30'), Color: '#3f6c9e'},
			{ID: 2, Title: 'Review', Start: day(1, '14:00'), End: day(1, '15:00'), Color: '#b4483f'},
			{ID: 3, Title: 'Conference', Start: day(3), End: day(5), AllDay: true, Color: '#3d7a54'},
			{ID: 4, Title: 'Release', Start: day(7, '09:00'), End: day(7, '10:00')},
			{ID: 5, Title: 'Night deploy', Start: day(2, '20:00'), End: day(3, '09:00'), Color: '#b8860b'},
			{ID: 6, Title: 'Gym', Start: day(1, '07:00'), End: day(1, '08:00'), Repeat: 'FREQ=WEEKLY;BYDAY=TU,TH;COUNT=10'}
		];
	},

	Moved: function (event) {
		var id = event.Event.ID;

		/* An occurrence of a recurring event: here it is only told (an owner moves the series, or that day alone). */
		if (event.Occurrence) {
			this.Note = event.Event.Title + ' of ' + event.Occurrence + ' moved to ' + event.Start;

			return;
		}

		this.Events = this.Events.map(function (item) {
			return item.ID === id ? {ID: item.ID, Title: item.Title, Start: event.Start, End: event.End, AllDay: item.AllDay, Color: item.Color} : item;
		});

		this.Note = event.Event.Title + ' moved to ' + event.Start;
	},

	Selected: function (item) {
		this.Note = 'Selected: ' + item.Title;
	},

	Changed: function (state) {
		this.View = state.View;
	}
})
</script>
```

## Tests

- [NavList opens a group, selects an item with the keys, and its search opens the branches that match](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L304) — `tests/regression/library-controls.test.js`
