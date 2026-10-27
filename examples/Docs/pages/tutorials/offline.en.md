# Working offline: sync

Notes that work the same with a network and without: written to the browser first, sent to the server when it can be reached, taken from the server on another device. The finished project is `examples/Tutorials/Notes`.

What you learn: local-first data with IndexedDB, an outbox of changes written in the same transaction as the data, a sync that sends and then takes, deletions as marks, the newest change winning a conflict, and a state a person can trust.

The [PWA tutorial](/tutorials/pwa) makes the page itself open without a network; this one keeps the data working. A real offline application needs both.

## 1. The idea: the browser first

An application that asks the server for every change stops when the train enters a tunnel. Turn it around: every change is written to the database of the browser at once, and the page shows what is there. The server is a copy that catches up when it can.

```text
 change ──► IndexedDB: Notes + Outbox (one transaction) ──► the page shows it
                         │
        online? ──► POST the outbox ──► remove what was sent ──► GET what changed since the last version
```

## 2. The database

```js
this.Database = Elemenx.Storage.IndexedDB('Notes', {
	Version: 1,
	Stores: {
		Notes: {KeyPath: 'ID'},
		Outbox: {KeyPath: 'Seq', AutoIncrement: true},
		State: {}
	}
});
```

- `Notes`: the notes, by an ID the browser makes, so a note made offline has its key before the server knows it.
- `Outbox`: the changes not yet sent, numbered in their order.
- `State`: the version of the server at the last sync.

## 3. A change: both or neither

```js
Save: function (note) {
	var self = this;
	var change = {ID: note.ID || Date.now().toString(36) + Math.random().toString(36).substring(2, 8), Text: note.Text || '', Updated: Date.now(), Deleted: !!note.Deleted};

	this.Database.Transaction(['Notes', 'Outbox'], 'readwrite', function (transaction) {
		transaction.Store('Notes').Put(undefined, change);
		transaction.Store('Outbox').Put(undefined, change);
	}).On('Success', function () {
		self.Load(function () {
			self.Sync();
		});
	}).Execute();

	return change.ID;
}
```

The transaction writes the note and its place in the outbox together: a tab closed in the middle cannot leave a note that will never be sent. A deletion is a change too (`Deleted: true`): a note simply removed here would never be removed on the server or on the other devices.

## 4. The sync

```js
Sync: function () {
	if (this.Busy) {
		this.Again = true;

		return;
	}

	if (!navigator.onLine) {
		this.Tell();

		return;
	}

	this.Busy = true;
	/* Send the outbox, remove from it what was sent, then Pull() what changed on the server. */
}
```

- One sync at a time: a change made while one runs asks for another (`Again`) instead of starting a second.
- Only what was sent leaves the outbox, by its `Seq`: a change made during the request waits for the next sync instead of being lost.
- `Pull()` asks for the notes changed after the version of the last sync (`?since=`), writes them and the new version in one transaction, and keeps a note changed here since: its newer text is in the outbox and goes up next.

The sync starts when the Service starts, after each change, when the browser comes back online (the `online` event), and every ten seconds while changes wait (a server that failed is asked again).

## 5. Conflicts

Two devices change the same note offline; whose text stays? The project keeps the newest one: each change has its `Updated` time, and the server refuses an older change than the one it has. It is the simplest rule and fits notes; a shared document needs more (merging the texts, or keeping both and asking). Choose the rule for your data, write it on the server, and test it.

## 6. A state to trust

The person must know whether the notes are safe. The Service gives one state:

```js
if (!navigator.onLine) this.Status = 'offline';
else if (this.Busy) this.Status = 'syncing';
else if (this.Failed) this.Status = 'error';
else if (this.Pending) this.Status = 'pending';
else this.Status = 'synced';
```

and the page says it in words, with the count of the changes waiting: `Offline · 2 waiting`, then `Synced`. `role="status"` reads it to a screen reader as it changes.

## 7. The test

The end-to-end test of the project goes offline with `context.setOffline(true)`, adds a note and edits another, checks `Offline · 2 waiting`, goes back online and waits for `Synced`, asks the server what it has, deletes a note, and opens the page in a new browser with an empty database, where the notes come from the server.

## 8. Try it

```bash
cd examples/Tutorials/Notes
npm install
npm run dev
```

In the developer tools, Network, choose Offline: write, edit and delete notes, then go back online and watch them go up.
