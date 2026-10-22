<!-- generated -->
# Calendar

A calendar of events. Events: [{ID, Title, Start, End, AllDay, Color}], Start and End as 'YYYY-MM-DD' (a whole day) or 'YYYY-MM-DDTHH:mm'. View: month or week; Date is a day of the period shown (today by default). The header moves by a period, back to today, and switches the view. Month: every day lists its events (an event of several days in each of its days), MaxEvents of them, then a "+N more" that opens the week of that day. Week: the hours from StartHour to EndHour (HourHeight pixels each), the events at their time (overlapping ones side by side), the whole-day events above, a line at the present time. FirstDay: 0 Sunday, 1 Monday (the default), or 'locale' for the first day of the week of Locale. Editable lets the user move events: dragged to another day (in the month and in the whole-day row) they keep their times; dragged in the week they take the day and the time under them, in steps of Snap minutes; the lower edge of a timed event changes its end. A shadow shows where the event goes; Escape cancels. With the focus on an event, Alt with the arrows moves it: a day left or right, Snap minutes up or down. The calendar does not change Events itself: the move event ({Event, Start, End}) asks the owner to. Events: select (the event), day (the date pressed), slot ({Date, Time}: an empty hour pressed in the week), change ({Date, View}), move ({Event, Start, End}).

## Properties

| Property | Default |
| --- | --- |
| `Events` | `[]` |
| `View` | `'month'` |
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

`change`, `select`, `move`, `day`, `slot`

## Example

```example
<div class="docs-frame tall">
	<Calendar [events]="Events" [view]="View" Editable="true" (move)="Moved" (select)="Selected" (change)="Changed" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	View: 'month',
	Note: 'Drag an event to another day; switch to the week to drag it in time.',
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
			{ID: 4, Title: 'Release', Start: day(7, '09:00'), End: day(7, '10:00')}
		];
	},

	Moved: function (event) {
		var id = event.Event.ID;

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
