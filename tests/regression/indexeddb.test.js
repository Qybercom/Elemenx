import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique } from '../setup.js';

function operation (value) {
	return new Promise(function (resolve, reject) {
		value.On('Success', function (event) { resolve(event.Data); });
		value.On('Error', function (event) { reject(event.Data); });
		value.Execute();
	});
}

describe('Regression: IndexedDB storage', function () {
	beforeAll(async function () { await loadElemenx(); });

	beforeEach(function () { resetDOM(); });

	it('Put / Get / GetAll / Count / Remove / Clear work on a configured store', async function () {
		var name = unique('elemenx-idb-');
		var db = Elemenx.Storage.IndexedDB(name, {Stores: {items: {}}});
		var store = db.Store('items');

		await operation(store.Put('a', {value: 1}));
		await operation(store.Put('b', {value: 2}));

		expect(await operation(store.Get('a'))).toEqual({value: 1});
		expect(await operation(store.Count())).toBe(2);
		expect(await operation(store.GetAll())).toEqual([{value: 1}, {value: 2}]);

		await operation(store.Remove('a'));

		expect(await operation(store.Count())).toBe(1);

		await operation(store.Clear());

		expect(await operation(store.Count())).toBe(0);

		await operation(db.Delete());
	});

	it('creates indexes and supports Get / GetAll / Count through an index', async function () {
		var name = unique('elemenx-idb-index-');
		var db = Elemenx.Storage.IndexedDB(name, {Stores: {items: {Indexes: {kind: {KeyPath: 'kind'}}}}});
		var store = db.Store('items');
		var index = store.Index('kind');

		await operation(store.Put('a', {kind: 'x', value: 1}));
		await operation(store.Put('b', {kind: 'x', value: 2}));
		await operation(store.Put('c', {kind: 'y', value: 3}));

		expect((await operation(index.Get('y'))).value).toBe(3);
		expect((await operation(index.GetAll('x'))).length).toBe(2);
		expect(await operation(index.Count('x'))).toBe(2);

		await operation(db.Delete());
	});

	it('Transaction commits multiple requests and reports completion', async function () {
		var name = unique('elemenx-idb-tx-');
		var db = Elemenx.Storage.IndexedDB(name, {Stores: {items: {}}});
		var seen = [];

		await operation(db.Transaction('items', 'readwrite', function (tx) {
			tx.Store('items').Put('a', {value: 1}).On('Success', function () { seen.push('a'); });
			tx.Store('items').Put('b', {value: 2}).On('Success', function () { seen.push('b'); });
		}));

		expect(seen.sort()).toEqual(['a', 'b']);
		expect(await operation(db.Store('items').Count())).toBe(2);

		await operation(db.Delete());
	});

	it('unknown stores report Error instead of hanging', async function () {
		var name = unique('elemenx-idb-error-');
		var db = Elemenx.Storage.IndexedDB(name, {Stores: {items: {}}});
		var error = null;

		try {
			await operation(db.Store('missing').Get('x'));
		}
		catch (caught) {
			error = caught;
		}

		expect(error).toBeTruthy();
		expect(String(error.message || error)).toContain('store not found');

		await operation(db.Delete());
	});
});
function failure (value) {
	return new Promise(function (resolve, reject) {
		value.On('Success', function (event) {
			reject(new Error('expected a failure, got ' + JSON.stringify(event.Data)));
		});
		value.On('Error', function (event) {
			resolve(event.Data);
		});
		value.Execute();
	});
}

describe('Regression: IndexedDB contracts', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		resetDOM();
	});

	it('store and index options shape the schema: KeyPath, AutoIncrement, Unique and MultiEntry', async function () {
		var db = Elemenx.Storage.IndexedDB(unique('elemenx-idb-schema-'), {
			Stores: {
				people: {
					KeyPath: 'id',
					AutoIncrement: true,
					Indexes: {
						email: {KeyPath: 'email', Unique: true},
						tags: {KeyPath: 'tags', MultiEntry: true}
					}
				}
			}
		});
		var people = db.Store('people');

		expect(await operation(people.Put(undefined, {email: 'a@example.test', tags: ['red', 'blue']}))).toBe(1);
		expect(await operation(people.Put(undefined, {email: 'b@example.test', tags: ['red']}))).toBe(2);
		expect((await operation(people.Index('tags').GetAll('red'))).length).toBe(2);
		expect((await operation(people.Index('email').Get('b@example.test'))).id).toBe(2);

		var duplicate = await failure(people.Put(undefined, {email: 'a@example.test', tags: []}));

		expect(duplicate.name).toBe('ConstraintError');

		await operation(db.Delete());
	});

	it('Upgrade receives the versions, and a handle of an older version fails cleanly after an upgrade elsewhere', async function () {
		var name = unique('elemenx-idb-upgrade-');
		var upgrades = [];
		var first = Elemenx.Storage.IndexedDB(name, {
			Version: 1,
			Stores: {items: {}},
			Upgrade: function (context) {
				upgrades.push([context.OldVersion, context.NewVersion, !!context.Database, !!context.Transaction]);
			}
		});

		await operation(first.Store('items').Put('a', 1));

		var second = Elemenx.Storage.IndexedDB(name, {
			Version: 2,
			Stores: {items: {Indexes: {value: {KeyPath: 'value'}}}, extra: {}},
			Upgrade: function (context) {
				upgrades.push([context.OldVersion, context.NewVersion, !!context.Database, !!context.Transaction]);
			}
		});

		await operation(second.Store('extra').Put('b', {value: 2}));

		expect(upgrades).toEqual([[0, 1, true, true], [1, 2, true, true]]);
		expect(await operation(second.Store('items').Get('a'))).toBe(1);

		var stale = await failure(first.Store('items').Get('a'));

		expect(stale.name).toBe('VersionError');

		await operation(second.Delete());
	});

	it('transaction stores run Get, Remove and Clear, and a late On still receives the settled result', async function () {
		var db = Elemenx.Storage.IndexedDB(unique('elemenx-idb-tx-store-'), {Stores: {items: {}}});
		var seen = [];

		await operation(db.Store('items').Put('a', 1));
		await operation(db.Store('items').Put('b', 2));

		await operation(db.Transaction(['items'], 'readwrite', function (tx) {
			var items = tx.Store('items');
			var read = items.Get('a');

			read.On('Success', function (event) {
				seen.push(['get', event.Data]);

				read.On('Success', function (late) {
					seen.push(['late', late.Data]);
				});

				items.Remove('a').On('Success', function () {
					seen.push(['remove']);

					items.Clear().On('Success', function () {
						seen.push(['clear']);
					});
				});
			});
		}));

		expect(seen).toEqual([['get', 1], ['late', 1], ['remove'], ['clear']]);
		expect(await operation(db.Store('items').Count())).toBe(0);

		await operation(db.Delete());
	});

	it('Transaction defaults to readonly, and an exception in its callback aborts it', async function () {
		var db = Elemenx.Storage.IndexedDB(unique('elemenx-idb-readonly-'), {Stores: {items: {}}});
		var error = await failure(db.Transaction('items', function (tx) {
			tx.Store('items').Put('a', 1);
		}));

		expect(error.name).toBe('ReadOnlyError');
		expect(await operation(db.Store('items').Count())).toBe(0);

		await operation(db.Delete());
	});

	it('Abort rolls back the transaction and reports an Error', async function () {
		var db = Elemenx.Storage.IndexedDB(unique('elemenx-idb-abort-'), {Stores: {items: {}}});
		var error = await failure(db.Transaction('items', 'readwrite', function (tx) {
			tx.Store('items').Put('a', 1);
			tx.Abort();
		}));

		expect(String(error.message || error.name)).toMatch(/abort/i);
		expect(await operation(db.Store('items').Count())).toBe(0);

		await operation(db.Delete());
	});

	it('an operation that throws synchronously is reported as an Error event', async function () {
		var db = Elemenx.Storage.IndexedDB(unique('elemenx-idb-throw-'), {Stores: {items: {}}});
		var error = await failure(db.Store('items').Put(undefined, 1));

		expect(error.name).toBe('DataError');

		await operation(db.Delete());
	});

	it('a connection the browser closed under a waiting operation is opened again once, and the operation goes on', async function () {
		var name = unique('elemenx-idb-reopen-');
		var db = Elemenx.Storage.IndexedDB(name, {Stores: {items: {}}});
		var store = db.Store('items');
		var native = IDBDatabase.prototype.transaction;
		var close = IDBDatabase.prototype.close;
		var closes = 0;
		var failed = 0;

		await operation(store.Put('a', {value: 1}));

		/* The next transaction finds its connection closed (a version change elsewhere, the browser), as InvalidStateError tells. */
		IDBDatabase.prototype.transaction = function () {
			IDBDatabase.prototype.transaction = native;
			failed++;

			throw new DOMException('The database connection is closing.', 'InvalidStateError');
		};

		IDBDatabase.prototype.close = function () {
			closes++;

			return close.apply(this, arguments);
		};

		try {
			expect(await operation(store.Get('a'))).toEqual({value: 1});
		}
		finally {
			IDBDatabase.prototype.transaction = native;
			IDBDatabase.prototype.close = close;
		}

		expect(failed).toBe(1);
		expect(closes).toBe(1);

		/* An error of another kind is not retried. */
		IDBDatabase.prototype.transaction = function () {
			throw new DOMException('Not allowed.', 'NotAllowedError');
		};

		try {
			await expect(operation(store.Get('a'))).rejects.toMatchObject({name: 'NotAllowedError'});
		}
		finally {
			IDBDatabase.prototype.transaction = native;
		}

		await operation(db.Delete());
	});
});
