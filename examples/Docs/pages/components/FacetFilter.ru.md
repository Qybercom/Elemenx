<!-- generated -->
# FacetFilter

Фильтры коллекции по её фасетам: Facets [{ID, Label, Type, Field, Options: [{Value, Label}], Min, Max, Step, Unit, Collapsed}], у каждого свой Type: options (любое из отмеченных значений, по умолчанию), choice (одно из них или любое), range (от Min до Max: два числа), rating (такая оценка и выше) или toggle (только элементы, у которых это есть). Value хранит выбранное: {ID: [значения] | значение | [от, до] | true}. С Items фасет без Options берёт значения своего поля из элементов (массив жанров считает каждый), а каждый вариант показывает, сколько элементов он оставит при остальных фасетах как есть; filter отдаёт оставшиеся элементы. Field — имя поля элемента (путь: info.year), без него — ID фасета.

Чипы над фасетами показывают выбранное и убирают его; Clear() и кнопка очищают всё. Показывается Limit вариантов (8), остальные — под «Показать все»; у фасета больше чем из 12 вариантов есть поле поиска. Filter(items) отдаёт элементы, которые оставляет Value. События: change (Value), filter (элементы).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Facets` | `[]` |
| `Value` | `{}` |
| `Items` | `null` |
| `Limit` | `8` |
| `Label` | `''` |

## События

- `change`: Выбранное изменилось: Value.
- `filter`: Оставшиеся элементы (с Items).

## Методы

- `Filter(items, skip)`
- `Clear()`

## Пример

```example
<div class="docs-row" style="align-items: flex-start">
	<FacetFilter [facets]="Facets" [items]="Films" [value]="Value" (change)="Changed" (filter)="Filtered" />
	<div class="docs-stack">
		<p class="elemenx-text small muted">{{Left.length}} of {{Films.length}} films</p>
		<ul>
			<li *for="film of Left" *key="film.ID">{{film.Title}} ({{film.Year}}, {{film.Genres.join(', ')}}, {{film.Score}})</li>
		</ul>
	</div>
</div>
<script>
({
	Value: {genre: ['Drama']},
	Left: [],
	Facets: [
		{ID: 'genre', Label: 'Genre', Field: 'Genres'},
		{ID: 'year', Label: 'Year', Field: 'Year', Type: 'range', Min: 1990, Max: 2025},
		{ID: 'score', Label: 'Score', Field: 'Score', Type: 'rating', Max: 10},
		{ID: 'language', Label: 'Language', Field: 'Language', Type: 'choice', Collapsed: true},
		{ID: 'subtitles', Label: 'Subtitles', Field: 'Subtitles', Type: 'toggle', Hint: 'With subtitles'}
	],
	Films: [
		{ID: 1, Title: 'North', Genres: ['Drama', 'Mystery'], Year: 2019, Score: 8.1, Language: 'English', Subtitles: true},
		{ID: 2, Title: 'Harbor', Genres: ['Drama'], Year: 2021, Score: 6.4, Language: 'French', Subtitles: false},
		{ID: 3, Title: 'Ember', Genres: ['Comedy'], Year: 2024, Score: 7.2, Language: 'English', Subtitles: true},
		{ID: 4, Title: 'Tide', Genres: ['Mystery', 'Comedy'], Year: 2015, Score: 4.9, Language: 'Spanish', Subtitles: true},
		{ID: 5, Title: 'Lantern', Genres: ['Drama', 'Romance'], Year: 2009, Score: 7.8, Language: 'French', Subtitles: true},
		{ID: 6, Title: 'Atlas', Genres: ['Adventure'], Year: 2022, Score: 8.6, Language: 'English', Subtitles: false}
	],

	Changed: function (value) {
		this.Value = value;
	},

	Filtered: function (films) {
		this.Left = films;
	}
})
</script>
```

## Тесты

- [FacetFilter counts each option with the other facets as they are, filters by options, a range, a rating and a toggle, and takes them back by chips](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L148) — `tests/regression/library-media.test.js`
- [FacetFilter: a toggle, a choice, Show all and the search of a long facet](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L270) — `tests/regression/library-media.test.js`
