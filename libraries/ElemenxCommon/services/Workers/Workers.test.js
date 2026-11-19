import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, unique } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';
import source from './Workers.js?raw';

var workers;

/* A Service of two methods, one of which calls the other and reads what the pool shares. */
function service () {
	var name = unique('Shared');

	Elemenx.Service(name, {
		Plus: function (a, b) {
			return a + b;
		},
		Twice: function (a) {
			return this.Plus(a, a);
		},
		Read: function (key) {
			var data = this.$Shared(key);

			return data ? data.Value : null;
		},
		Source: function (names) {
			return this.$Service('Workers').Source(this, names);
		}
	});

	return name;
}

function run (pool, name, method, args) {
	return new Promise(function (done, failed) {
		pool.Run(name, method, args, function (error, value) {
			if (error) failed(error);
			else done(value);
		});
	});
}

describe('Contract: Workers, the work of the Services off the main thread', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Workers']);

		workers = Elemenx.Service('Workers');
	});

	it('shares data with every worker once: the runs that follow read it, and the next share takes its place', async function () {
		var name = service();
		var pool = workers.Pool(name, {[name]: ['Plus', 'Twice', 'Read']}, 2);
		var read = [];
		var i;

		expect(pool.Inline()).toBe(false);

		pool.Share('ground', {Value: 7});

		for (i = 0; i < 4; i++)
			read.push(await run(pool, name, 'Read', ['ground']));

		pool.Share('ground', {Value: 8});

		read.push(await run(pool, name, 'Read', ['ground']));
		read.push(await run(pool, name, 'Read', ['other']));

		expect(read).toEqual([7, 7, 7, 7, 8, null]);

		pool.Destroy();
	});

	/* Most: a pool of a size of 3 has as many workers as Most lets it, for the pools made after it is set. */
	it('makes a pool of no more workers than Most, whatever its size', async function () {
		var name = unique('Who');
		var was = workers.Most;

		Elemenx.Service(name, {
			Who: function () {
				this.Mark = this.Mark || String(Math.random());

				return this.Mark;
			},
			Source: function (names) {
				return this.$Service('Workers').Source(this, names);
			}
		});

		async function count (pool) {
			var marks = await Promise.all([0, 1, 2, 3, 4, 5].map(function () {
				return run(pool, name, 'Who', []);
			}));

			pool.Destroy();

			return marks.filter(function (one, index) {
				return marks.indexOf(one) === index;
			}).length;
		}

		/* 4 unless told (the tests of the library tell fewer: tests/library.js). */
		expect(source).toMatch(/\n\tMost: 4,\n/);

		try {
			workers.Most = 4;

			expect(await count(workers.Pool(unique('Many'), {[name]: ['Who']}, 3))).toBe(3);

			workers.Most = 1;

			expect(await count(workers.Pool(unique('One'), {[name]: ['Who']}, 3))).toBe(1);
		}
		finally {
			workers.Most = was;
		}
	});

	/* With no worker a run goes in the page, a method of the Service as it is, calling the others of it. */
	it('runs a method in the page with its Service as this when there is no worker', async function () {
		var name = service();
		var real = window.Worker;
		var pool;
		var value = null;

		window.Worker = undefined;

		try {
			pool = workers.Pool(unique('Here'), {[name]: ['Plus', 'Twice']});

			pool.Run(name, 'Twice', [21], function (error, result) {
				value = error ? error.message : result;
			});
		}
		finally {
			window.Worker = real;
		}

		expect(pool.Inline()).toBe(true);
		expect(value).toBe(42);

		pool.Destroy();
	});

	/* Regression: the lists of members were written by hand in each pool and drifted apart (a method missing in one). */
	it('carries a Service told whole: every method of it and the data of its list Carried, not the caches it fills', async function () {
		var name = unique('Whole');
		var pool;

		Elemenx.Service(name, {
			Table: {a: 2},
			Cache: {},
			Carried: ['Table', 'Missing'],
			Scaled: function (key) {
				return this.Table[key] * this.Doubled(1) + (this.Cache === undefined ? 0 : 100);
			},
			Doubled: function (a) {
				return a * 2;
			},
			Source: function (names) {
				return this.$Service('Workers').Source(this, names);
			}
		});

		expect(workers.Members({Table: 1, Carried: ['Table'], Run: function () {}, $Hidden: function () {}})).toEqual(['Run', 'Table']);

		pool = workers.Pool(name, {[name]: true}, 1);

		expect(pool.Inline()).toBe(false);
		expect(await run(pool, name, 'Scaled', ['a'])).toBe(4);

		pool.Destroy();
	});
});
