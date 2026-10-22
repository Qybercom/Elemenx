<!-- generated -->
# IndexedDB

`Elemenx.Storage.IndexedDB(name, definition)` — база объектов в браузере: хранилища записей по ключу, индексы для поиска по полю и транзакции, которые меняют несколько записей сразу — или ни одной. Схема объявляется, Elemenx создаёт её при первом открытии базы или росте её версии, а каждая операция сообщает о себе событиями: без Promise и без ручного `onsuccess`.

```js
var db = Elemenx.Storage.IndexedDB('Notes', {
	Version: 1,
	Stores: {
		Notes: {KeyPath: 'ID', AutoIncrement: true, Indexes: {Tag: {KeyPath: 'Tags', MultiEntry: true}}}
	}
});

db.Store('Notes').Put(undefined, {Text: 'Buy milk', Tags: ['home']})
	.On('Success', function (event) {
		console.log('Saved with the key', event.Data);
	})
	.On('Error', function (event) {
		console.log('Not saved', event.Data);
	})
	.Execute();
```

## Определение

| Ключ | Значение |
| --- | --- |
| `Version` | по умолчанию 1; большее число обновляет базу: создаются хранилища и индексы, которых ещё нет |
| `Stores` | `{Name: {KeyPath, AutoIncrement, Indexes}}`: `KeyPath` — поле записи, являющееся её ключом (без него ключ передаётся с каждой записью), `AutoIncrement` нумерует записи |
| `Indexes` | `{Name: {KeyPath, Unique, MultiEntry}}`: `KeyPath` — поле (по умолчанию имя индекса), `Unique` запрещает две записи с одинаковым значением, `MultiEntry` индексирует каждый элемент списка |
| `Upgrade(context)` | вызывается при обновлении, после создания хранилищ: `{Database, Transaction, OldVersion, NewVersion}` — чтобы перенести или преобразовать данные старой версии |

## Операции

Каждая операция — объект, который слушают и затем запускают: `.On('Success', callback)`, `.On('Error', callback)`, `.Execute()`. Обработчик получает `{Type, Data}`: результат или ошибку. До `Execute()` ничего не происходит.

| Хранилище | Результат |
| --- | --- |
| `Get(key)` | запись или `undefined` |
| `GetAll()` | все записи |
| `Count()` | сколько их |
| `Put(key, value)` | ключ записанной записи (для хранилища с `KeyPath` передайте ключ `undefined`) |
| `Remove(key)`, `Clear()` | |
| `Index(name).Get(value)`, `.GetAll(value)`, `.Count(value)` | записи индекса; `GetAll()` без значения даёт все в порядке индекса |

База открывается первой операцией и остаётся открытой: `Close()` закрывает её, `Delete()` закрывает и удаляет (это тоже операция). Когда другая вкладка обновляет базу, это соединение закрывается, и следующая операция открывает новую версию.

## Транзакции

```js
db.Transaction(['Accounts'], 'readwrite', function (transaction) {
	var accounts = transaction.Store('Accounts');

	accounts.Put('alice', {Balance: 90});
	accounts.Put('bob', {Balance: 110});
}).On('Success', function () {
	/* Both are written. */
}).On('Error', function (event) {
	/* Neither is. */
}).Execute();
```

`Transaction(stores, mode, callback)` (`mode` по умолчанию `'readonly'` или `'readwrite'`) передаёт в обратный вызов транзакцию: `Store(name)` даёт запросы этого хранилища (`Get`, `Put`, `Remove`, `Clear`, `Index(name).Get/GetAll`), у каждого свой `On('Success')`, а `Abort()` отменяет всё. Операция успешна, когда транзакция завершилась; ошибка любого запроса, исключение в обратном вызове или `Abort()` делают её неуспешной, и ничего из неё не сохраняется.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Text" placeholder="A note" /></span>
	<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Tag" placeholder="A tag" /></span>
	<Button Label="Add" Variant="primary" [disabled]="!Text" (click)="Add" />
	<Button Label="Clear all" Variant="ghost" (click)="Clear" />
</div>
<p class="elemenx-text small muted">{{Notes.length}} notes · tags: {{Tags.join(', ') || '—'}}</p>
<ul class="elemenx-ul">
	<li *for="note of Notes" *key="note.ID">{{note.Text}} <span class="elemenx-caption">#{{note.Tag}}</span> <button type="button" class="elemenx-link" [attribute.data-id]="note.ID" (click)="Remove">remove</button></li>
</ul>
<script>
({
	Text: 'Water the plants',
	Tag: 'home',
	Notes: [],
	Tags: [],

	$OnCreate: function () {
		var database = Elemenx.Storage.IndexedDB('DocsNotes', {
			Version: 1,
			Stores: {Notes: {KeyPath: 'ID', AutoIncrement: true, Indexes: {Tag: {}}}}
		});

		/* One handle of the database for the example: it opens with the first operation. */
		this.Database = function () {
			return database;
		};
	},

	$OnReady: function () {
		this.Load();
	},

	Load: function () {
		var self = this;
		var notes = this.Database().Store('Notes');

		notes.GetAll().On('Success', function (event) {
			var tags = [];

			event.Data.forEach(function (note) {
				if (tags.indexOf(note.Tag) === -1)
					tags.push(note.Tag);
			});

			self.Notes = event.Data;
			self.Tags = tags;
		}).Execute();
	},

	Add: function () {
		var self = this;

		this.Database().Store('Notes').Put(undefined, {Text: this.Text, Tag: this.Tag || 'none'}).On('Success', function () {
			self.Text = '';

			self.Load();
		}).Execute();
	},

	Remove: function (event, button) {
		var self = this;

		this.Database().Store('Notes').Remove(Number(button.getAttribute('data-id'))).On('Success', function () {
			self.Load();
		}).Execute();
	},

	Clear: function () {
		var self = this;

		this.Database().Store('Notes').Clear().On('Success', function () {
			self.Load();
		}).Execute();
	}
})
</script>
```

Одна и та же база открыта во всех вкладках сайта: заметка, добавленная здесь, появится в другой вкладке после её перезагрузки.
