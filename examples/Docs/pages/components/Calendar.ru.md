<!-- generated -->
# Calendar

Календарь событий. Events: [{ID, Title, Start, End, AllDay, Color}], Start и End в виде 'YYYY-MM-DD' (целый день) или 'YYYY-MM-DDTHH:mm'. View: month или week; Date — день показываемого периода (по умолчанию сегодня). Шапка листает периоды, возвращает к сегодняшнему дню и переключает вид. Месяц: в каждом дне его события (многодневное событие — в каждом своём дне), до MaxEvents, затем «+N ещё», открывающее неделю этого дня. Неделя: часы от StartHour до EndHour (по HourHeight пикселей), события в своё время (пересекающиеся — рядом), события на весь день сверху, линия текущего времени. FirstDay: 0 — воскресенье, 1 — понедельник (по умолчанию) или 'locale' — первый день недели по Locale. Editable позволяет переносить события: перенесённые на другой день (в месяце и в строке целых дней) сохраняют время; в неделе получают день и время под указателем с шагом Snap минут; нижний край события со временем меняет его конец. Тень показывает, куда встанет событие; Escape отменяет. Alt со стрелками двигает событие в фокусе: на день влево или вправо, на Snap минут вверх или вниз. Календарь сам не меняет Events: событие move ({Event, Start, End}) просит об этом владельца. События: select (событие), day (нажатая дата), slot ({Date, Time}: нажатый пустой час недели), change ({Date, View}), move ({Event, Start, End}).

## Свойства

| Свойство | По умолчанию |
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

## События

`change`, `select`, `move`, `day`, `slot`

## Пример

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
