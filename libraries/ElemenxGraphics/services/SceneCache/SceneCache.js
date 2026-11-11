/*
 * SceneCache: what a scene made once and may need again, kept in the browser (IndexedDB, elemenx-cache) so that the next
 * visit of the same world shows it at once: the proxies of far tiles (SceneProxies), the squares of a planet. Each entry
 * is of a group (store: proxies, planet...) and a key of its own; what was used longest ago goes first when all of them
 * are more than Limit megabytes.
 * - Get(store, key, callback(error, value)): what was kept (null: nothing), now the latest used.
 * - Put(store, key, value, callback(error)): kept (an object of lists of numbers, Float32Array and the like, and plain
 *   data); then the oldest go while all are over Limit.
 * - Usage(callback(error, {Bytes, Entries, Limit})): how much is kept, Limit in megabytes.
 * - SetLimit(megabytes, callback(error)): another limit (200 by default), the oldest gone at once while over it.
 * - Clear(store, callback(error)): all of a group gone; store null: all.
 * - Peek(store, key): at once, what this page kept or read lately (up to Hot megabytes of them, the oldest let go), or
 *   undefined: a scene takes it in the same frame, with no wait for the database.
 * - Knows(store, key): at once, whether the database has it (its keys are read when it opens; false till then): a scene
 *   asks it with Get only then, else makes what it needs at once.
 * All the scenes of a page share one database, its keys and what is hot (Page).
 * Where there is no IndexedDB (Node, a worker of some browsers, a private window that has none) nothing is kept: Get
 * gives null, the rest do nothing; never an error for that.
 */
Elemenx.Service('SceneCache', {
	$Meta: {
		Description: 'What a scene made once kept in the browser (IndexedDB): the proxies of far tiles, the squares of a planet, the oldest gone over a limit.',
		Methods: ['Get(store, key, callback)', 'Put(store, key, value, callback)', 'Peek(store, key)', 'Knows(store, key)', 'Usage(callback)', 'SetLimit(megabytes, callback)', 'Clear(store, callback)']
	},

	/* Megabytes of all that is kept, at most. */
	Limit: 200,

	/* Megabytes of what the page holds at hand (Peek). */
	Hot: 64,

	/* One for the page: each application has an instance of the service of its own, and all of them share this. */
	Page: {},

	/* The state of the page: the database, its keys, what is at hand. */
	State: function () {
		if (!this.Page.Cache)
			this.Page.Cache = {Opened: undefined, Waiting: null, Keys: {}, Bytes: 0, Hot: new Map(), HotBytes: 0};

		return this.Page.Cache;
	},

	/* What the page holds at hand, the latest last; the oldest let go over Hot megabytes. */
	Remember: function (entry, value) {
		var state = this.State();
		var bytes = this.Bytes(value);
		var oldest;

		if (state.Hot.has(entry)) {
			state.HotBytes -= state.Hot.get(entry).Bytes;

			state.Hot.delete(entry);
		}

		state.Hot.set(entry, {Value: value, Bytes: bytes});

		state.HotBytes += bytes;

		while (state.HotBytes > this.Hot * 1048576 && state.Hot.size > 1) {
			oldest = state.Hot.keys().next().value;
			state.HotBytes -= state.Hot.get(oldest).Bytes;

			state.Hot.delete(oldest);
		}
	},

	Peek: function (store, key) {
		var state = this.State();
		var entry = this.Entry(store, key);
		var hot = state.Hot.get(entry);
		if (!hot)
			return undefined;

		/* The latest used now: it goes last. */
		state.Hot.delete(entry);
		state.Hot.set(entry, hot);

		return hot.Value;
	},

	Knows: function (store, key) {
		this.Open(function () {});

		return !!this.State().Keys[this.Entry(store, key)];
	},

	Name: 'elemenx-cache',

	/* The database, opened once: done(database or null). */
	Open: function (done) {
		var state = this.State();
		var request;

		if (state.Opened !== undefined) {
			done(state.Opened);

			return;
		}

		if (state.Waiting) {
			state.Waiting.push(done);

			return;
		}

		state.Waiting = [done];

		function finish (database) {
			var waiting = state.Waiting;

			state.Opened = database;
			state.Waiting = null;

			waiting.forEach(function (each) {
				each(database);
			});
		}

		/* Its keys first (Knows), then it is open. */
		/* Its keys and their bytes first (Knows, and how much it holds with no scan of it at each Put), then it is open. */
		function keys (database) {
			var listed;
			var sizes;
			var store;

			try {
				store = database.transaction('meta', 'readonly').objectStore('meta');
				listed = store.getAllKeys();
				sizes = store.getAll();
			}
			catch (error) {
				finish(database);

				return;
			}

			sizes.onsuccess = function () {
				listed.result.forEach(function (one, at) {
					var bytes = sizes.result[at] ? sizes.result[at].Bytes || 0 : 0;

					state.Keys[one] = bytes || 1;
					state.Bytes += bytes;
				});

				finish(database);
			};

			sizes.onerror = function () {
				finish(database);
			};

			listed.onerror = function () {
				finish(database);
			};
		}

		try {
			request = typeof indexedDB === 'undefined' ? null : indexedDB.open(this.Name, 1);
		}
		catch (error) {
			request = null;
		}

		if (!request) {
			finish(null);

			return;
		}

		request.onupgradeneeded = function () {
			var database = request.result;

			database.createObjectStore('values');
			database.createObjectStore('meta').createIndex('Used', 'Used');
		};

		request.onsuccess = function () {
			keys(request.result);
		};

		request.onerror = function () {
			finish(null);
		};
	},

	/* The key of an entry in the database: its group and its key. */
	Entry: function (store, key) {
		return String(store) + '\n' + String(key);
	},

	/* About how many bytes a value holds: its lists of numbers by their bytes, the rest by its text. */
	Bytes: function (value) {
		var self = this;

		if (!value || typeof value !== 'object') return String(value).length * 2;

		if (value.byteLength !== undefined) return value.byteLength;

		return Object.keys(value).reduce(function (sum, key) {
			return sum + key.length * 2 + self.Bytes(value[key]);
		}, 0);
	},

	Get: function (store, key, callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};

		this.Open(function (database) {
			var transaction;
			var got;
			var entry = self.Entry(store, key);

			if (!database) {
				done(null, null);

				return;
			}

			try {
				transaction = database.transaction(['values', 'meta'], 'readwrite');
				got = transaction.objectStore('values').get(entry);
			}
			catch (error) {
				done(null, null);

				return;
			}

			got.onsuccess = function () {
				var meta;

				if (got.result === undefined) {
					done(null, null);

					return;
				}

				/* The latest used now: it goes last. */
				meta = transaction.objectStore('meta').get(entry);

				meta.onsuccess = function () {
					if (meta.result)
						transaction.objectStore('meta').put({Bytes: meta.result.Bytes, Used: Date.now()}, entry);
				};

				self.Remember(entry, got.result);

				done(null, got.result);
			};

			got.onerror = function () {
				done(null, null);
			};
		});
	},

	Put: function (store, key, value, callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};

		this.Open(function (database) {
			var transaction;
			var entry = self.Entry(store, key);

			self.Remember(entry, value);

			if (!database) {
				done(null);

				return;
			}

			try {
				transaction = database.transaction(['values', 'meta'], 'readwrite');

				transaction.objectStore('values').put(value, entry);

				var bytes = self.Bytes(value) + entry.length * 2;
				var state = self.State();

				/* What it holds, counted as it goes: no scan of all of it at each Put (it was, during the arrival of a scene, a frame's worth). */
				state.Bytes += bytes - (state.Keys[entry] || 0);
				state.Keys[entry] = bytes;

				transaction.objectStore('meta').put({Bytes: bytes, Used: Date.now()}, entry);
			}
			catch (error) {
				done(error);

				return;
			}

			transaction.oncomplete = function () {
				self.Trim(done);
			};

			transaction.onerror = function () {
				done(transaction.error || new Error('Elemenx SceneCache could not keep ' + entry));
			};
		});
	},

	/* The oldest gone while all that is kept is over Limit: done(error). */
	Trim: function (done) {
		var self = this;
		var state = this.State();
		var over = state.Bytes - this.Limit * 1048576;

		(function () {
			if (over <= 0) {
				done(null);

				return;
			}

			self.Open(function (database) {
				var transaction = database.transaction(['values', 'meta'], 'readwrite');
				var cursor = transaction.objectStore('meta').index('Used').openCursor();

				cursor.onsuccess = function () {
					var at = cursor.result;
					if (!at || over <= 0) return;

					over -= at.value.Bytes;

					self.Forget(at.primaryKey);

					transaction.objectStore('values').delete(at.primaryKey);
					at.delete();
					at.continue();
				};

				transaction.oncomplete = function () {
					done(null);
				};

				transaction.onerror = function () {
					done(transaction.error);
				};
			});
		})();
	},

	Usage: function (callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};

		this.Open(function (database) {
			var usage = {Bytes: 0, Entries: 0, Limit: self.Limit};
			var cursor;

			if (!database) {
				done(null, usage);

				return;
			}

			cursor = database.transaction('meta', 'readonly').objectStore('meta').openCursor();

			cursor.onsuccess = function () {
				var at = cursor.result;

				if (!at) {
					done(null, usage);

					return;
				}

				usage.Bytes += at.value.Bytes;
				usage.Entries++;

				at.continue();
			};

			cursor.onerror = function () {
				done(cursor.error, usage);
			};
		});
	},

	SetLimit: function (megabytes, callback) {
		var done = typeof callback === 'function' ? callback : function () {};

		if (!(Number(megabytes) > 0)) {
			done(new Error('Elemenx SceneCache needs a limit of more than 0 megabytes'));

			return;
		}

		this.Limit = Number(megabytes);

		this.Trim(done);
	},

	/* An entry gone from the database: its key and what is at hand of it. */
	Forget: function (entry) {
		var state = this.State();

		state.Bytes -= state.Keys[entry] || 0;

		delete state.Keys[entry];

		if (state.Hot.has(entry)) {
			state.HotBytes -= state.Hot.get(entry).Bytes;

			state.Hot.delete(entry);
		}
	},

	Clear: function (store, callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};

		this.Open(function (database) {
			var transaction;
			var cursor;
			var prefix = store === null || store === undefined ? null : String(store) + '\n';

			if (!database) {
				done(null);

				return;
			}

			transaction = database.transaction(['values', 'meta'], 'readwrite');

			if (prefix === null) {
				self.State().Keys = {};
				self.State().Bytes = 0;
				self.State().Hot = new Map();
				self.State().HotBytes = 0;

				transaction.objectStore('values').clear();
				transaction.objectStore('meta').clear();
			}
			else {
				cursor = transaction.objectStore('meta').openCursor();

				cursor.onsuccess = function () {
					var at = cursor.result;
					if (!at) return;

					if (String(at.primaryKey).indexOf(prefix) === 0) {
						self.Forget(at.primaryKey);

						transaction.objectStore('values').delete(at.primaryKey);
						at.delete();
					}

					at.continue();
				};
			}

			transaction.oncomplete = function () {
				done(null);
			};

			transaction.onerror = function () {
				done(transaction.error);
			};
		});
	}
});
