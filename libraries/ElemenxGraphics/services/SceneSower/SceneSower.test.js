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

		Use(['service:SceneSower', 'service:SceneTerrainGenerator', 'service:SceneBiomes', 'service:Blueprints', 'service:Workers', 'service:Math']);

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

	it('sows the rules of a land by its climate only in that land, mingled where lands meet, the same in a worker', async function () {
		var options = {Size: 1200, Height: 60, Water: 0.2, Seed: 'two lands', Biomes: [{Biome: 'hot', Climate: {Temperature: [0.5, null]}}, {Biome: 'cold', Climate: {Temperature: [null, 0.5]}}]};
		var field = Elemenx.Service('SceneTerrainGenerator').Field('Flat', options);
		var squares = [];
		var given;
		var here;
		var there;
		var pool = sower.Work();
		var seen = {palm: 0, pine: 0};
		var x;
		var z;

		for (x = -576; x < 576; x += 96) {
			for (z = -576; z < 576; z += 96)
				squares.push({X: x, Z: z});
		}

		given = {Key: 'sower-lands', Options: options, Field: null, Roads: null, Kept: [], Free: {Areas: [], Lines: []}, Size: 48, Squares: squares, Models: {palm: {Size: 6, Keys: ['palm~0']}, pine: {Size: 6, Keys: ['pine~0']}}, Rules: [
			{ID: 'land-hot-0', Biome: 'hot', Shapes: ['palm'], Density: 0.6, MinHeight: 0, MaxSlope: 2},
			{ID: 'land-cold-0', Biome: 'cold', Shapes: ['pine'], Density: 0.6, MinHeight: 0, MaxSlope: 2}
		]};
		here = sower.Sow(Object.assign({}, given, {Options: null, Field: field}));

		here.Squares.forEach(function (square) {
			Object.keys(square.Lists).forEach(function (key) {
				var places = square.Lists[key].Places;
				var name = key.split('~')[0];
				var i;

				for (i = 0; i < places.length; i += 4) {
					var lands = field.Biome(places[i], places[i + 2]).List.map(function (land) {
						return land.Name;
					});

					seen[name]++;

					expect(lands).toContain(name === 'palm' ? 'hot' : 'cold');
				}
			});
		});

		expect(seen.palm).toBeGreaterThan(20);
		expect(seen.pine).toBeGreaterThan(20);

		there = await new Promise(function (done, failed) {
			pool.Run('SceneSower', 'Sow', [Object.assign({}, given, {Options: field.Options})], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(plain(there)).toEqual(plain(here));
	});

	it('sows a rule of a graph: its library graph the very same things as the rule, a graph of its own its sizes, turns and shapes, in a worker too', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var given = world();
		var field = Elemenx.Service('SceneTerrainGenerator').Field('Flat', given.Options);
		var rules = [
			{ID: 'groves', Shapes: ['oak', 'birch', 'bush'], Density: 0.8, Cover: 0.45, Patch: 40, MaxSlope: 0.25},
			{ID: 'thick', Seed: 'thick', Shapes: ['pine', 'oak'], Density: 2.5, Clumps: 0.6, Patch: 30, MinHeight: 0.2, MaxHeight: 15, MaxSlope: 0.6}
		];
		var drawn = sower.Compile(rules.map(function (rule) {
			return Object.assign({}, rule, {Graph: sower.LibraryScatter(rule)});
		}));
		var plainJob = Object.assign({}, job(given, field), {Rules: rules});
		var graphJob = Object.assign({}, job(given, field), {Rules: drawn});
		var own = blueprints.Create('generator', {name: 'Own'});
		var wet = blueprints.Add(own, 'Input', {properties: {Name: 'Moisture'}});
		var big = blueprints.Add(own, 'Number', {properties: {Value: 2.5}});
		var quarter = blueprints.Add(own, 'Number', {properties: {Value: 0.25}});
		var one = blueprints.Add(own, 'Number', {properties: {Value: 1}});
		var test = blueprints.Add(own, 'Compare', {properties: {Operator: '>='}});
		var results = ['Grow', 'Size', 'Turn', 'Shape'].map(function (key) {
			return blueprints.Add(own, 'Result', {properties: {Key: key}});
		});
		var mine;
		var sown;
		var there;

		expect(drawn[0].Source).toBeTruthy();
		expect(drawn[0].Graph).toBeUndefined();
		expect(plain(sower.Sow(graphJob))).toEqual(plain(sower.Sow(plainJob)));

		/* Grows where it is wet enough, twice and a half as large, turned a quarter of a radian, all of its second shape. */
		blueprints.Link(own, [wet.id, 'Value'], [test.id, 'A']);
		blueprints.Link(own, [quarter.id, 'Value'], [test.id, 'B']);
		blueprints.Link(own, [test.id, 'Out'], [results[0].id, 'Value']);
		blueprints.Link(own, [big.id, 'Value'], [results[1].id, 'Value']);
		blueprints.Link(own, [quarter.id, 'Value'], [results[2].id, 'Value']);
		blueprints.Link(own, [one.id, 'Value'], [results[3].id, 'Value']);

		mine = sower.Compile([{ID: 'mine', Shapes: ['pine', 'oak'], Density: 1.5, Graph: own}]);
		sown = sower.Sow(Object.assign({}, job(given, field), {Rules: mine}));

		expect(sown.Things).toBeGreaterThan(10);

		sown.Squares.forEach(function (square) {
			Object.keys(square.Lists).forEach(function (key) {
				var list = square.Lists[key];
				var i;

				expect(key.indexOf('oak')).toBe(0);

				for (i = 0; i < list.Count; i++) {
					expect(list.Places[i * 4 + 3]).toBeCloseTo(6 * 2.5, 4);
					expect(list.Extra[i * 4]).toBeCloseTo(0.25, 6);
					expect(field.Climate(list.Places[i * 4], list.Places[i * 4 + 2]).Moisture).toBeGreaterThanOrEqual(0.25);
				}
			});
		});

		there = await new Promise(function (done, failed) {
			sower.Work().Run('SceneSower', 'Sow', [Object.assign({}, job(given, null), {Rules: mine})], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(plain(there)).toEqual(plain(sown));
	});
});
