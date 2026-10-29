<!-- generated -->
# CastList

Люди тайтла: актёры и съёмочная группа, Items [{ID, Name, Role, Image, Href}], у каждого фото (без него или пока оно загружается — Avatar по имени), а под ним имя и роль. Layout row прокручивается вбок (полка людей), grid заполняет строки, list ставит их друг под другом. Title называет список. Нажатие открывает человека (событие open); стрелки переходят от одного к следующему.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Title` | `''` |
| `Layout` | `'row'` |
| `Label` | `''` |

## События

- `open`: Нажат человек: его элемент.

## Пример

```example
<div class="docs-stack">
	<RadioGroup Variant="segmented" [value]="Layout" [options]="Layouts" (change)="Laid" />
	<CastList Title="Cast" [items]="People" [layout]="Layout" (open)="Opened" />
	<p class="elemenx-text small muted">{{Note}}</p>
</div>
<script>
({
	Layout: 'row',
	Note: 'A person without a photo gets an avatar of the name.',
	Layouts: [{Value: 'row', Label: 'Row'}, {Value: 'grid', Label: 'Grid'}, {Value: 'list', Label: 'List'}],
	People: [
		{ID: 'ada', Name: 'Ada Lovelace', Role: 'Captain Mara Holt'},
		{ID: 'alan', Name: 'Alan Turing', Role: 'The keeper'},
		{ID: 'grace', Name: 'Grace Hopper', Role: 'Navigator'},
		{ID: 'linus', Name: 'Linus Pauling', Role: 'The stranger'},
		{ID: 'emmy', Name: 'Emmy Noether', Role: 'Director'},
		{ID: 'carl', Name: 'Carl Gauss', Role: 'Music'}
	],

	Laid: function (value) {
		this.Layout = value;
	},

	Opened: function (person) {
		this.Note = person.Name + ', ' + person.Role;
	}
})
</script>
```

## Тесты

- [CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/inline-size-width.test.js#L39) — `tests/regression/inline-size-width.test.js`
- [CastList: photos or avatars of the names, their roles, in a row, a grid or a list; a press opens a person](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-media.test.js#L432) — `tests/regression/library-media.test.js`
