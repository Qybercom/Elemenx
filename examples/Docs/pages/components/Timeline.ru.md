<!-- generated -->
# Timeline

Линия времени: шкала (деления с подписями, подобранные под видимый отрезок: от секунд до веков, или числа), отметки (момент с подписью над осью или под ней; подписи близких отметок встают в ряды друг под другом, а не перекрываются, с тонкой выноской к своей точке), отрезки (от момента до момента, по дорожкам с подписями в начале, как в диаграмме Ганта; пересекающиеся — в рядах своей дорожки), прогресс (заливка до момента и более светлая Buffer), позиция воспроизведения и линия текущего момента.

Start и End — вся линия; From и To — видимая часть (по умолчанию вся). Scale: time (даты: YYYY-MM-DD, YYYY-MM-DDTHH:mm, Date, миллисекунды) или number (секунды видео, шаги: Unit называет их, Format(value, step) пишет подписи); по умолчанию — тип Start. Orientation: horizontal или vertical. Marks [{ID, At, Label, Text, Icon, Tone, Side, Element, Render}], Ranges [{ID, From, To, Label, Tone, Color, Lane, Element, Render}], Lanes [{ID, Label}], Progress (момент или {To, Buffer}), Playhead (момент; Seekable показывает её и даёт перемещать), Now. То же можно объявить внутри: TimelineMark, TimelineRange (любое содержимое внутри них — их подпись), TimelineLane, TimelineProgress.

Управление: Ctrl (⌘) с колесом, щипок или кнопки (Controls) масштабируют у указателя, от MinSpan до всей линии; Shift с колесом, горизонтальное колесо, перетаскивание пустого места или средняя кнопка сдвигают; стрелки сдвигают, + и − масштабируют, 0 показывает всё; нажатие на ось перематывает (Seekable: позиция идёт за указателем). Отметки и отрезки — кнопки: нажатие или Enter выбирает, стрелки переходят к следующей, подсказка показывает их целиком. Overview показывает рядом полосу всей линии: её отметки и отрезки мелко и рамку на видимой части; перетаскивание рамки сдвигает вид, перетаскивание её края масштабирует, нажатие в другом месте полосы ставит туда середину вида. Editable: отметку и отрезок перетаскивают во времени, отрезок — и за края, новый отрезок рисуют на пустой дорожке; Alt со стрелками сдвигает тот, что в фокусе, на Snap (minute, hour, day, week, month, year или число; по умолчанию шаг делений). Escape отменяет перетаскивание. Timeline не меняет данные сам: события просят об этом владельца.

События: select ({Kind, ID, Item}), seek ({At}), view ({From, To}), move ({Kind, ID, Item, At} отметки, {Kind, ID, Item, From, To} отрезка), resize ({ID, Item, From, To}), create ({Lane, From, To}). Моменты в них того же вида, что Start: дата (YYYY-MM-DD, когда шаг привязки — день и больше) или число.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Start` | `''` |
| `End` | `''` |
| `From` | `''` |
| `To` | `''` |
| `Scale` | `''` |
| `Orientation` | `'horizontal'` |
| `Marks` | `[]` |
| `Ranges` | `[]` |
| `Lanes` | `[]` |
| `Progress` | `null` |
| `Playhead` | `null` |
| `Seekable` | `false` |
| `Now` | `false` |
| `Editable` | `false` |
| `Snap` | `''` |
| `MinSpan` | `0` |
| `Unit` | `''` |
| `Format` | `null` |
| `Controls` | `true` |
| `Overview` | `false` |
| `Label` | `''` |

## События

- `view`: Изменилась видимая часть: {From, To}.
- `select`: Нажата метка или отрезок: {Kind (mark или range), ID, Item}.
- `seek`: Нажата или перетащена линия или указатель воспроизведения: {At}.
- `create`: На дорожке нарисован отрезок: {Lane, From, To}.
- `move`: Перетащена метка или отрезок: {Kind, ID, Item, At} для метки, {Kind, ID, Item, From, To} для отрезка.
- `resize`: Перетащен край отрезка: {ID, Item, From, To}.

## Слоты

по умолчанию

## Пример

```example
<Timeline Start="2026-01-01" End="2026-12-31" [marks]="Marks" [ranges]="Ranges" [lanes]="Lanes" Overview="true" Editable="true" Snap="day" (move)="Moved" (resize)="Moved" (select)="Selected" />
<p>{{Note}}</p>
<Timeline Start="0" End="300" Unit="s" [playhead]="At" Seekable="true" (seek)="Seek">
	<TimelineProgress [to]="At" Buffer="120" />
	<TimelineMark ID="intro" At="0" Label="Intro" />
	<TimelineMark ID="goal" At="95" Tone="success"><strong>Goal!</strong></TimelineMark>
	<TimelineMark ID="replay" At="100" Label="Replay" Side="before" />
	<TimelineRange ID="ad" From="150" To="180" Label="Ad" Tone="danger" />
</Timeline>
<script>
({
	Note: 'Drag a range, its edges or a mark',
	At: 40,
	Lanes: [{ID: 'design', Label: 'Design'}, {ID: 'build', Label: 'Build'}],
	Ranges: [
		{ID: 'research', From: '2026-01-12', To: '2026-03-20', Label: 'Research', Lane: 'design'},
		{ID: 'core', From: '2026-03-02', To: '2026-08-28', Label: 'Core', Lane: 'build', Tone: 'info'}
	],
	Marks: [
		{ID: 'alpha', At: '2026-05-04', Label: 'Alpha'},
		{ID: 'demo', At: '2026-05-08', Label: 'Demo day', Tone: 'success'}
	],

	Moved: function (event) {
		var list = event.Kind === 'mark' ? 'Marks' : 'Ranges';

		this[list] = this[list].map(function (item) {
			return item.ID === event.ID ? Object.assign({}, item, event.Kind === 'mark' ? {At: event.At} : {From: event.From, To: event.To}) : item;
		});
		this.Note = event.ID + ': ' + (event.At || event.From + ' – ' + event.To);
	},

	Selected: function (event) {
		this.Note = 'Selected: ' + event.ID;
	},

	Seek: function (event) {
		this.At = event.At;
	}
})
</script>
```

## Тесты

- [timeline draws its scale, stacks close labels, edits ranges, zooms and seeks](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5623) — `tests/examples/ui-kit.spec.js`
