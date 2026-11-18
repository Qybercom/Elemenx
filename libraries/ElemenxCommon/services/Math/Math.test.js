import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Math, the numbers of a place and the points of a sphere', function () {
	var math;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Math']);

		math = Elemenx.Service('Math');
	});

	/* What sows things, lays caves and picks the land of a place wrote out before: the sine hash of a place. */
	it('gives a number of 0 to 1 of a place, the same for the same place, and another apart from it', function () {
		var x = 123.5;
		var z = -47.25;

		expect(math.PlaceRandom(x, z)).toBe(Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1);
		expect(math.PlaceRandom(x, z, true)).toBe(Math.abs(Math.sin(x * 39.3468 + z * 11.135) * 24634.6345) % 1);
		expect(math.PlaceRandom(x, z)).not.toBe(math.PlaceRandom(x, z, true));
		expect(math.PlaceRandom(x, z)).toBeGreaterThanOrEqual(0);
		expect(math.PlaceRandom(x, z)).toBeLessThan(1);
	});

	it('spreads points evenly over a sphere along a spiral of the golden angle, turned as it is told', function () {
		var count = 200;
		var points = [];
		var i;

		for (i = 0; i < count; i++)
			points.push(math.Spiral(i, count));

		points.forEach(function (point) {
			expect(Math.hypot(point[0], point[1], point[2])).toBeCloseTo(1, 12);
		});

		expect(points[0][1]).toBeCloseTo(1 - 1 / count, 12);
		expect(points[count - 1][1]).toBeCloseTo(-1 + 1 / count, 12);
		expect(math.Spiral(7, count)[0]).toBe(Math.cos(7 * 2.39996) * Math.sqrt(1 - Math.pow(1 - 7.5 / count * 2, 2)));
		expect(math.Spiral(7, count, 0.5)[2]).toBe(Math.sin(7 * 2.39996 + 0.5) * Math.sqrt(1 - Math.pow(1 - 7.5 / count * 2, 2)));
	});

	/* The one heap of the ways and the rivers: the least first, the same order for the same pushes. */
	it('gives what is pushed back the least first', function () {
		var queue = math.Queue();
		var out = [];

		[5, 1, 4, 1, 9, 2, 6].forEach(function (value, index) {
			queue.Push({F: value, At: index});
		});

		expect(queue.Size()).toBe(7);

		while (queue.Size())
			out.push(queue.Pop().F);

		expect(out).toEqual([1, 1, 2, 4, 5, 6, 9]);
	});
});
