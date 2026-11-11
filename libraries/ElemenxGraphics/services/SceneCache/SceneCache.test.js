import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var cache;

/* A method of callbacks as a promise, for the test only. */
function call (method) {
	var args = Array.prototype.slice.call(arguments, 1);

	return new Promise(function (done, fail) {
		cache[method].apply(cache, args.concat([function (error, result) {
			if (error) fail(error);
			else done(result);
		}]));
	});
}

describe('Contract: SceneCache, what a scene made kept in the browser, the oldest gone over a limit', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneCache']);

		cache = Elemenx.Service('SceneCache');
	});

	beforeEach(async function () {
		await call('SetLimit', 200);
		await call('Clear', null);
	});

	it('keeps a value of lists of numbers by its group and key, and gives it back as it was', async function () {
		var positions = new Float32Array([1, 2, 3, 4.5, 5, 6]);

		await call('Put', 'proxies', 'tile:1', {Positions: positions, Triangles: 2});

		var got = await call('Get', 'proxies', 'tile:1');

		expect(got.Positions).toBeInstanceOf(Float32Array);
		expect(Array.from(got.Positions)).toEqual([1, 2, 3, 4.5, 5, 6]);
		expect(got.Triangles).toBe(2);
		expect(await call('Get', 'proxies', 'tile:2')).toBe(null);
		expect(await call('Get', 'planet', 'tile:1')).toBe(null);
	});

	it('tells how much it keeps, and clears a group or all', async function () {
		await call('Put', 'proxies', 'a', {Data: new Float32Array(1000)});
		await call('Put', 'planet', 'b', {Data: new Float32Array(500)});

		var usage = await call('Usage');

		expect(usage.Entries).toBe(2);
		expect(usage.Bytes).toBeGreaterThan(6000);
		expect(usage.Limit).toBe(200);

		await call('Clear', 'proxies');

		expect(await call('Get', 'proxies', 'a')).toBe(null);
		expect(await call('Get', 'planet', 'b')).not.toBe(null);

		await call('Clear', null);

		expect((await call('Usage')).Entries).toBe(0);
	});

	/* Over its limit, what was used longest ago goes first: one read lately stays. */
	it('lets the oldest go first when all it keeps is over its limit', async function () {
		var megabyte = 262144;

		await call('Put', 'proxies', 'old', {Data: new Float32Array(megabyte)});

		await new Promise(function (done) {
			setTimeout(done, 20);
		});

		await call('Put', 'proxies', 'read', {Data: new Float32Array(megabyte)});

		await new Promise(function (done) {
			setTimeout(done, 20);
		});

		await call('Put', 'proxies', 'new', {Data: new Float32Array(megabyte)});

		await new Promise(function (done) {
			setTimeout(done, 20);
		});

		/* Read: the latest used now. */
		expect(await call('Get', 'proxies', 'read')).not.toBe(null);

		await new Promise(function (done) {
			setTimeout(done, 20);
		});

		await call('SetLimit', 2.5);

		expect(await call('Get', 'proxies', 'old')).toBe(null);
		expect(await call('Get', 'proxies', 'read')).not.toBe(null);
		expect(await call('Get', 'proxies', 'new')).not.toBe(null);
		expect((await call('Usage')).Bytes).toBeLessThanOrEqual(2.5 * 1048576);
	});

	/* At once, with no wait for the database: what the page kept lately, and whether the database has a key. */
	it('gives what the page kept lately at once, and tells at once whether it keeps a key', async function () {
		expect(cache.Peek('ground', 'square:1')).toBe(undefined);
		expect(cache.Knows('ground', 'square:1')).toBe(false);

		await call('Put', 'ground', 'square:1', {Positions: new Float32Array([1, 2, 3])});

		expect(Array.from(cache.Peek('ground', 'square:1').Positions)).toEqual([1, 2, 3]);
		expect(cache.Knows('ground', 'square:1')).toBe(true);
		expect(cache.Knows('proxies', 'square:1')).toBe(false);

		await call('Clear', 'ground');

		expect(cache.Peek('ground', 'square:1')).toBe(undefined);
		expect(cache.Knows('ground', 'square:1')).toBe(false);
	});

	/*
	 * Regression: each Put counted all that is kept by a scan of the database (a cursor over every entry), a frame's worth
	 * of the time of a page while a scene came; it counts as it goes now, and scans only to let the oldest go.
	 */
	it('keeps a value under its limit with no scan of all it keeps', async function () {
		var store = IDBObjectStore.prototype.openCursor;
		var index = IDBIndex.prototype.openCursor;
		var scans = 0;

		await call('Put', 'proxies', 'warm', {Data: new Float32Array(4)});

		IDBObjectStore.prototype.openCursor = function () {
			scans++;

			return store.apply(this, arguments);
		};
		IDBIndex.prototype.openCursor = function () {
			scans++;

			return index.apply(this, arguments);
		};

		try {
			await call('Put', 'proxies', 'one', {Data: new Float32Array(1000)});
			await call('Put', 'proxies', 'two', {Data: new Float32Array(1000)});
		}
		finally {
			IDBObjectStore.prototype.openCursor = store;
			IDBIndex.prototype.openCursor = index;
		}

		expect(scans).toBe(0);
		expect((await call('Usage')).Entries).toBe(3);
	});

	it('refuses a limit of no megabytes', async function () {
		await expect(call('SetLimit', 0)).rejects.toThrow('Elemenx SceneCache needs a limit of more than 0 megabytes');
	});
});
