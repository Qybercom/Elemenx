import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var sower;

/* A ground of a sketch: a forest, a fence, a clearing and a road; and the rules a Scatter gives of it. */
function world () {
	var options = {Size: 400, Height: 20, Water: 0, Scale: 200, Ridges: 0.1, Rock: false, Snow: false, Seed: 'sower', Sketch: {Layers: [{ID: 'l', Visible: true, Strength: 1, Items: [
		{ID: 'woods', Type: 'forest', Points: [[-150, -150], [0, -150], [0, 0], [-150, 0]], Strength: 1},
		{ID: 'glade', Type: 'clearing', Points: [[-90, -90], [-60, -90], [-60, -60], [-90, -60]], Strength: 1},
		{ID: 'way', Type: 'road', Points: [[-200, 20], [200, 20]], Width: 6, Strength: 1}
	]}]}};
	var rules = [
		{ID: 'groves', Shapes: ['oak', 'birch', 'bush'], Density: 0.8, Cover: 0.45, Patch: 40, MaxSlope: 0.25},
		{ID: 'sketch-woods', Seed: 'woods', Shapes: ['pine', 'oak'], Density: 2.5, Clumps: 0.3, Passability: 0.6, Cover: 1, MinHeight: 0.2, MaxSlope: 0.6, Area: options.Sketch.Layers[0].Items[0].Points},
		{ID: 'sketch-fence', Seed: 'fence', Shapes: ['fence'], Spacing: 2, Passability: 0, Fit: true, Cover: 1, MinHeight: 0.2, MaxSlope: 2, Line: [[0, 60], [150, 60]]}
	];
	var models = {};

	['oak', 'birch', 'bush', 'pine', 'fence'].forEach(function (name) {
		var keys = [];
		var v;

		for (v = 0; v < 16; v++)
			keys.push(name + '~' + (v % 3));

		models[name] = {Size: name === 'fence' ? 2 : 6, Keys: keys};
	});

	return {Options: options, Rules: rules, Models: models, Free: {Areas: [[[-90, -90], [-60, -90], [-60, -60], [-90, -60]]], Lines: [{Points: [[-200, 20], [200, 20]], Reach: 4}]}};
}

function job (given, field) {
	return {Key: 'sower-test', Options: field ? null : given.Options, Field: field || null, Roads: null, Kept: ['-10:-10'], Rules: given.Rules, Free: given.Free, Models: given.Models, Size: 48, Squares: [{X: -144, Z: -144}, {X: -96, Z: -96}, {X: 0, Z: 48}, {X: 144, Z: 144}]};
}

/* What a job sowed, as plain numbers: the same in a worker and in the page. */
function plain (result) {
	return {Things: result.Things, Blocked: result.Blocked.slice().sort(), Squares: result.Squares.map(function (square) {
		var lists = {};

		Object.keys(square.Lists).sort().forEach(function (key) {
			lists[key] = {Count: square.Lists[key].Count, Places: Array.from(square.Lists[key].Places), Extra: Array.from(square.Lists[key].Extra)};
		});

		return {X: square.X, Z: square.Z, Center: square.Center, Lists: lists};
	})};
}

describe('Contract: SceneSower, what a Scatter sows, in workers', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneSower', 'service:SceneTerrainGenerator', 'service:Workers', 'service:Math']);

		sower = Elemenx.Service('SceneSower');
	});

	it('sows by the rules: the things of each model in their squares, none where the sketch keeps the ground free, the way stopped where they stand', function () {
		var given = world();
		var result = sower.Sow(job(given, Elemenx.Service('SceneTerrainGenerator').Field('Flat', given.Options)));
		var woods = result.Squares[0].Lists;
		var glade = result.Squares[1];
		var fence = result.Squares[2].Lists;
		var inside;

		expect(result.Things).toBeGreaterThan(50);
		expect(Object.keys(woods).some(function (key) {
			return key.indexOf('pine') === 0;
		})).toBe(true);

		/* Nothing in the clearing. */
		inside = Object.keys(glade.Lists).some(function (key) {
			var places = glade.Lists[key].Places;
			var i;

			for (i = 0; i < places.length; i += 4) {
				if (places[i] > -90 && places[i] < -60 && places[i + 2] > -90 && places[i + 2] < -60) return true;
			}

			return false;
		});

		expect(inside).toBe(false);

		/* The fence a piece every 2 metres along its line, each as long as the step. */
		expect(fence['fence~0'] || fence['fence~1'] || fence['fence~2']).toBeTruthy();
		expect(Object.keys(fence).filter(function (key) {
			return key.indexOf('fence') === 0;
		}).reduce(function (sum, key) {
			return sum + fence[key].Count;
		}, 0)).toBe(24);
		expect(result.Blocked.length).toBeGreaterThan(0);
	});

	it('sows the same things in a worker as in the page, the field made there of its options, the context shared once', async function () {
		var given = world();
		var here = plain(sower.Sow(job(given, Elemenx.Service('SceneTerrainGenerator').Field('Flat', given.Options))));
		var pool = sower.Work();
		var there;

		expect(pool.Inline()).toBe(false);

		there = await new Promise(function (done, failed) {
			pool.Share('sow:test', job(given, null));

			pool.Run('SceneSower', 'Sow', [{Context: 'sow:test', Squares: job(given, null).Squares}], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(there.Squares[0].Lists[Object.keys(there.Squares[0].Lists)[0]].Places instanceof Float32Array).toBe(true);
		expect(plain(there)).toEqual(here);
	});
});
