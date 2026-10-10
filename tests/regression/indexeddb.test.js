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