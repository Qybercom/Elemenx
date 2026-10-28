<!-- generated -->
# Calendar

Календарь событий. Events: [{ID, Title, Start, End, AllDay, Color, Repeat}], Start и End в виде 'YYYY-MM-DD' (целый день; End — его последний день) или 'YYYY-MM-DDTHH:mm' (End в 00:00 заканчивает событие предыдущим днём). View: day, week, month, months (Span месяцев, по умолчанию 3), quarter, year или years (Span лет, по умолчанию 3); Date — день показываемого периода (по умолчанию сегодня). Шапка листает периоды, возвращает к сегодняшнему дню и переключает вид среди Views.

Месяц: в каждом дне его события, до MaxEvents, затем «+N ещё», открывающее неделю этого дня; событие нескольких дней — полоса через них, в одном и том же ряду каждого своего дня, с разрывом и стрелкой на границе недели. Неделя и день: часы от StartHour до EndHour (по HourHeight пикселей), события в своё время (пересекающиеся — рядом; событие, переходящее через полночь, режется на ней и продолжается в следующем дне), события на весь день и длиной от суток — полосами сверху, линия текущего времени. Months, quarter, year и years — планировщик: Timeline событий (масштабируется и листается, как Timeline).

Repeat делает событие повторяющимся: {Every: day, week, month или year, Interval, Days (дни недели: 0 — воскресенье … 6 — суббота, или MO, TU…), Until (последний день), Count, Except (пропущенные дни)} или RRULE из RFC 5545 (FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=10, UNTIL). Повторения строятся для показываемого периода с ID <ID>@<день>, Occurrence (день) и Source (исходное событие).

FirstDay: 0 — воскресенье, 1 — понедельник (по умолчанию) или 'locale' — первый день недели по Locale. Editable позволяет переносить события: перенесённые на другой день (в месяце и в строке целых дней) сохраняют время; в неделе получают день и время под указателем с шагом Snap минут; нижний край события со временем меняет его конец, конец полосы — её последний день; в планировщике события двигаются и растягиваются по дням. Тень показывает, куда встанет событие; Escape отменяет. Alt со стрелками двигает событие в фокусе: на день влево или вправо, на Snap минут вверх или вниз. Календарь сам не меняет Events: событие move ({Event, Start, End}, а у повторяющегося — ещё Occurrence: владелец переносит всю серию или только этот день) просит об этом владельца. События: select (событие), day (нажатая дата), slot ({Date, Time}: нажатый пустой час недели), change ({Date, View}), move ({Event, Start, End, Occurrence}).

## Свойства

| Свойство | По умолчанию |
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

## События

- `change`: Изменился показанный период: {Date, View}.
- `select`: Нажато событие: само событие.
- `move`: Событие перетащено или изменено: {Event, Start, End} и Occurrence для повторяющегося события.
- `day`: Нажат день: его дата ('YYYY-MM-DD').
- `slot`: Нажато время дня в виде недели или дня: {Date, Time ('HH:MM')}.

## Пример

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

## Тесты

- [NavList opens a group, selects an item with the keys, and its search opens the branches that match](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L304) — `tests/regression/library-controls.test.js`
