# IndexedDB

`Elemenx.Storage.IndexedDB(name, definition)` is a database of objects in the browser: stores of records by key, indexes to find them by a field, and transactions that change several records at once or not at all. The schema is declared, Elemenx creates it when the database is first opened or its version grows, and every operation reports by events: no Promise, no `onsuccess` by hand.

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

## The definition

| Key | Meaning |
| --- | --- |
| `Version` | 1 by default; a higher number upgrades the database: the stores and indexes not there yet are created |
| `Stores` | `{Name: {KeyPath, AutoIncrement, Indexes}}`: `KeyPath` is the field of a record that is its key (without it, a key is given with each record), `AutoIncrement` numbers the records |
| `Indexes` | `{Name: {KeyPath, Unique, MultiEntry}}`: `KeyPath` is the field (the name of the index by default), `Unique` refuses two records with the same value, `MultiEntry` indexes each item of a list |
| `Upgrade(context)` | called during an upgrade, after the stores are created: `{Database, Transaction, OldVersion, NewVersion}`, to move or convert the data of an older version |

## Operations

Every operation is an object to listen to and then run: `.On('Success', callback)`, `.On('Error', callback)`, `.Execute()`. The callback gets `{Type, Data}`: the result, or the error. Nothing happens before `Execute()`.

| Store | Result |
| --- | --- |
| `Get(key)` | the record, or `undefined` |
| `GetAll()` | every record |
| `Count()` | how many |
| `Put(key, value)` | the key of the record written (give `undefined` as the key for a store with a `KeyPath`) |
| `Remove(key)`, `Clear()` | |
| `Index(name).Get(value)`, `.GetAll(value)`, `.Count(value)` | the records of an index; `GetAll()` without a value gives all of them in the order of the index |

The database opens with its first operation and stays open: `Close()` closes it, `Delete()` closes and deletes it (an operation too). When another tab upgrades the database, this connection is closed and the next operation opens the new version.

## Transactions

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

`Transaction(stores, mode, callback)` (`mode` `'readonly'` by default, or `'readwrite'`) calls back with the transaction: `Store(name)` gives the requests of that store (`Get`, `Put`, `Remove`, `Clear`, `Index(name).Get/GetAll`), each with its own `On('Success')`, and `Abort()` cancels everything. The operation succeeds when the transaction completes; an error of any request, an exception of the callback or `Abort()` makes it fail, and nothing of it is kept.

## Example

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

The same database is open in every tab of the site: a note added here is there after a reload of another tab.
