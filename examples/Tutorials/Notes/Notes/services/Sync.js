/*
 * The notes, kept in the browser first (IndexedDB) and synced with the server when the network is there. A change is
 * written to the notes and to the outbox in one transaction, so it shows at once and is never lost; Sync() sends the
 * outbox, then takes what changed on the server since the last sync. Without a network the changes wait in the outbox;
 * the sync starts again when the browser is back online, and every ten seconds while changes wait.
 * Notes is the list shown (the newest first, the deleted left out), Pending the count of the changes waiting, Status
 * offline, syncing, pending, error or synced. Save(note), Remove(id), Sync(), OnChange(callback), OffChange(callback).
 */
Elemenx.Service('Sync', {
	$OnCreate: function () {
		var self = this;

		this.Database = Elemenx.Storage.IndexedDB('Notes', {
			Version: 1,
			Stores: {
				Notes: {KeyPath: 'ID'},
				Outbox: {KeyPath: 'Seq', AutoIncrement: true},
				State: {}
			}
		});

		this.All = [];
		this.Notes = [];
		this.Pending = 0;
		this.Status = 'synced';
		this.Busy = false;
		this.Again = false;
		this.Failed = false;
		this.Listeners = [];

		window.addEventListener('online', function () {
			self.Sync();
		});

		window.addEventListener('offline', function () {
			self.Tell();
		});

		window.setInterval(function () {
			if (self.Pending)
				self.Sync();
		}, 10000);

		this.Load(function () {
			self.Sync();
		});
	},

	/* The notes and the count of the outbox, from the database. */
	Load: function (callback) {
		var self = this;

		this.Database.Store('Notes').GetAll().On('Success', function (event) {
			self.All = event.Data;
			self.Notes = event.Data.filter(function (note) {
				return !note.Deleted;
			}).sort(function (a, b) {
				return b.Updated - a.Updated;
			});

			self.Database.Store('Outbox').Count().On('Success', function (count) {
				self.Pending = count.Data;

				self.Tell();

				if (callback)
					callback();
			}).Execute();
		}).Execute();
	},

	/* A change: the note and its place in the outbox, both or neither. */
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
	},

	/* A deleted note stays as a mark, so the deletion reaches the server and the other devices. */
	Remove: function (id) {
		this.Save({ID: id, Deleted: true});
	},

	Sync: function () {
		var self = this;

		if (this.Busy) {
			this.Again = true;

			return;
		}

		if (!navigator.onLine) {
			this.Tell();

			return;
		}

		this.Busy = true;
		this.Failed = false;

		this.Tell();

		this.Database.Store('Outbox').GetAll().On('Success', function (event) {
			var sent = event.Data;

			if (!sent.length) {
				self.Pull();

				return;
			}

			self.Ask('POST', '/api/changes', {Changes: sent}, function (error) {
				if (error) {
					self.Done(error);

					return;
				}

				/* Only what was sent leaves the outbox: a change made meanwhile waits for the next sync. */
				self.Database.Transaction(['Outbox'], 'readwrite', function (transaction) {
					sent.forEach(function (change) {
						transaction.Store('Outbox').Remove(change.Seq);
					});
				}).On('Success', function () {
					self.Pull();
				}).Execute();
			});
		}).Execute();
	},

	/* What changed on the server since the version of the last sync. A note changed here since keeps its newer text. */
	Pull: function () {
		var self = this;

		this.Database.Store('State').Get('Version').On('Success', function (event) {
			self.Ask('GET', '/api/notes?since=' + (event.Data || 0), null, function (error, value) {
				var local = {};

				if (error) {
					self.Done(error);

					return;
				}

				self.All.forEach(function (note) {
					local[note.ID] = note;
				});

				self.Database.Transaction(['Notes', 'State'], 'readwrite', function (transaction) {
					value.Notes.forEach(function (note) {
						if (!local[note.ID] || local[note.ID].Updated <= note.Updated)
							transaction.Store('Notes').Put(undefined, {ID: note.ID, Text: note.Text, Updated: note.Updated, Deleted: note.Deleted});
					});

					transaction.Store('State').Put('Version', value.Version);
				}).On('Success', function () {
					self.Load(function () {
						self.Done(null);
					});
				}).Execute();
			});
		}).Execute();
	},

	Done: function (error) {
		this.Busy = false;
		this.Failed = !!error;

		this.Tell();

		if (this.Again) {
			this.Again = false;

			this.Sync();
		}
	},

	/* A request with a JSON answer: callback(error, value). */
	Ask: function (method, url, data, callback) {
		var request = this.$Network().XHR({Method: method, URL: url, Data: data === null ? null : JSON.stringify(data), Headers: {'Content-Type': 'application/json'}, ResponseType: 'text'});

		request.On('Transport.Success', function (event) {
			if (event.Data.Status !== 200) callback(new Error('The server answered ' + event.Data.Status));
			else callback(null, JSON.parse(event.Data.Response));
		});

		request.On('Transport.Error', function () {
			callback(new Error('The network failed'));
		});

		request.Execute();
	},

	Tell: function () {
		var self = this;

		if (!navigator.onLine) this.Status = 'offline';
		else if (this.Busy) this.Status = 'syncing';
		else if (this.Failed) this.Status = 'error';
		else if (this.Pending) this.Status = 'pending';
		else this.Status = 'synced';

		this.Listeners.slice().forEach(function (callback) {
			callback(self);
		});
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
