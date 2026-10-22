<!-- generated -->
# MasterDetail

Список и карточка выбранного элемента на основе elemenx-container и elemenx-column. Слоты: list-header, list, detail-header, detail. Без содержимого detail область карточки показывает Empty. Ширина списка меняется перетаскиванием края. В узкой раскладке видна одна сторона: карточка, если в ней что-то есть, иначе список; кнопка «назад» карточки тогда отправляет back (владелец очищает detail).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Empty` | `''` |
| `EmptyIcon` | `'list'` |

## События

`back`

## Слоты

`list-header`, `list`, `detail-header`, `detail`

## Пример

```example
<div class="docs-frame">
	<MasterDetail Empty="Select a person" (back)="Clear">
		<Input slot="list-header" Icon="search" Placeholder="Filter" Size="small" />
		<div slot="list" class="elemenx-master-row" *for="person of People" *key="person.ID" [class.active]="person.ID === Person.ID" [attribute.data-id]="person.ID" (click)="Pick"><Avatar [name]="person.Name" Size="small" /><div><strong>{{person.Name}}</strong><p class="elemenx-text small muted">{{person.Role}}</p></div></div>
		<strong slot="detail-header" *if="Person.ID">{{Person.Name}}</strong>
		<div slot="detail" class="docs-stack" *if="Person.ID">
			<p class="elemenx-text">{{Person.Role}} · {{Person.Commits}} commits</p>
			<Progress [value]="Person.Commits / 3" ShowValue="true" />
		</div>
	</MasterDetail>
</div>
<script>
({
	Person: {},
	People: [
		{ID: 1, Name: 'Ada Lovelace', Role: 'Engineer', Commits: 214},
		{ID: 2, Name: 'Grace Hopper', Role: 'Admiral', Commits: 180},
		{ID: 3, Name: 'Alan Turing', Role: 'Mathematician', Commits: 96}
	],

	Pick: function (event, row) {
		var id = Number(row.getAttribute('data-id'));

		this.Person = this.People.filter(function (person) {
			return person.ID === id;
		})[0];
	},

	Clear: function () {
		this.Person = {};
	}
})
</script>
```
