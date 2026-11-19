import { beforeAll, describe, expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/*
 * The bench of the computations (npm run test:compute): each scenario run a few times, its median kept, printed beside the
 * baseline (tests/perf/compute-baseline.json, kept by ELEMENX_SAVE=1). Each says how many it computes, so its time is
 * also a time of one of them. What a ground computes most: noise, heights, the heights of a square, a way over it.
 */
var baseline = import.meta.glob('./compute-baseline.json', {import: 'default', eager: true})['./compute-baseline.json'] || {};

/* The ground of the strategy demo: hills, a river across it. */
var WORLD = {Size: 320, Height: 18, Water: 0.12, Scale: 260, Ridges: 0.15, Seed: 'world', Sketch: {Layers: [{ID: 'bases', Name: 'bases', Visible: true, Strength: 1, Items: [
	{ID: 'river', Type: 'river', Strength: 1, Points: [[-20, -160, 1], [6, -90, 0.9], [-6, -20, 0.8], [10, 50, 0.7], [-4, 160, 0.6]], Width: 12, Depth: 1.8, Bank: 10}
]}]}};

function median (values) {
	var sorted = values.slice().sort(function (a, b) {
		return a - b;
	});

	return sorted[Math.floor(sorted.length / 2)];
}

/* The median of five runs of work (a warm run first, not counted). */
function measure (work) {
	var times = [];
	var i;

	work();

	for (i = 0; i < 5; i++) {
		var start = performance.now();

		work();

		times.push(performance.now() - start);
	}

	return Math.round(median(times) * 10) / 10;
}

describe('Bench: the computations of a ground', function () {
	var noise;
	var terrain;
	var results = {};
	var lines = [];

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Noise', 'service:SceneTerrainGenerator', 'service:Blueprints', 'service:Workers', 'service:Geometry', 'service:SceneShowcase', 'service:SceneWorld', 'service:SceneRoads', 'service:SceneModels', 'service:SceneBuildingGenerator', 'service:ScenePlanet', 'service:Math', 'service:SceneFlora']);

		noise = Elemenx.Service('Noise');
		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	function report (name, ms, count) {
		var before = baseline[name];

		results[name] = ms;

		lines.push(name.padEnd(28) + String(ms).padStart(9) + ' ms' + ('  ' + Math.round(ms * 1e6 / count) + ' ns each').padEnd(18) + (before ? ' (' + (ms / before * 100 - 100 >= 0 ? '+' : '') + Math.round(ms / before * 100 - 100) + '% of ' + before + ' ms)' : ''));
	}

	/* A million points of each noise, a fractal of four octaves (value: six, as a ground has it). */
	it('noise', function () {
		[['noise:value-fbm6', {Type: 'value', Fractal: 'fbm', Octaves: 6, Seed: 'b'}],
			['noise:perlin-fbm4', {Type: 'perlin', Fractal: 'fbm', Octaves: 4, Seed: 'b'}],
			['noise:simplex-fbm4', {Type: 'simplex', Fractal: 'fbm', Octaves: 4, Seed: 'b'}],
			['noise:worley-f1', {Type: 'worley', Seed: 'b'}],
			['noise:value-warp', {Type: 'value', Fractal: 'ridged', Octaves: 4, Seed: 'b', Warp: {Amount: 0.4, Octaves: 2}}]].forEach(function (pair) {
			var sampler = noise.Make(pair[1]);
			var sum = 0;

			report(pair[0], measure(function () {
				var i;

				for (i = 0; i < 1000000; i++)
					sum += sampler.At(i * 0.0137, 0.5, i * 0.0071);
			}), 1000000);

			expect(sum).toBeGreaterThan(0);
		});
	});

	/* The same noises in wasm, a million points in one call of a batch (the spec given once): the very same numbers. */
	it('noise in wasm', function () {
		var made = Elemenx.Compilers.Instance(noise.Wasm());
		var input = new Float64Array(3000000);
		var i;

		for (i = 0; i < 1000000; i++) {
			input[i * 3] = i * 0.0137;
			input[i * 3 + 1] = 0.5;
			input[i * 3 + 2] = i * 0.0071;
		}

		[['noise:value-fbm6:wasm', {Type: 'value', Fractal: 'fbm', Octaves: 6, Seed: 'b'}],
			['noise:perlin-fbm4:wasm', {Type: 'perlin', Fractal: 'fbm', Octaves: 4, Seed: 'b'}],
			['noise:simplex-fbm4:wasm', {Type: 'simplex', Fractal: 'fbm', Octaves: 4, Seed: 'b'}],
			['noise:worley-f1:wasm', {Type: 'worley', Seed: 'b'}],
			['noise:value-warp:wasm', {Type: 'value', Fractal: 'ridged', Octaves: 4, Seed: 'b', Warp: {Amount: 0.4, Octaves: 2}}]].forEach(function (pair) {
			var fixed = noise.Numbers(noise.Whole(pair[1])).map(Number);
			var sampler = noise.Make(pair[1]);
			var output;

			report(pair[0], measure(function () {
				output = made.Batch('n_read', input, 1000000, fixed);
			}), 1000000);

			expect(output[12345]).toBe(sampler.At(input[12345 * 3], 0.5, input[12345 * 3 + 2]));
		});
	});

	/* The heights of a ground: of its noise, of its graph of relief (the very same hills), of a sketch with a river. */
	it('heights', function () {
		var plain = terrain.Flat({Size: 2000, Height: 60, Seed: 'bench'});
		var graph = terrain.Flat({Size: 2000, Height: 60, Seed: 'bench', Relief: terrain.LibraryRelief({Size: 2000, Height: 60, Seed: 'bench'})});
		var world = terrain.Flat(WORLD);

		[['height:noise', plain], ['height:relief-graph', graph], ['height:sketch-river', world]].forEach(function (pair) {
			var sum = 0;

			report(pair[0], measure(function () {
				var i;

				for (i = 0; i < 200000; i++)
					sum += pair[1].Height((i % 400) * 0.8 - 160, Math.floor(i / 400) * 0.6 - 150);
			}), 200000);

			expect(sum).not.toBe(0);
		});
	});

	/* The heights of the world of the Showcase: a sketch of every type of it over three kilometres. */
	it('heights of every type of a sketch', function () {
		var world = Elemenx.Service('SceneShowcase').World();
		var ground = terrain.Flat(Object.assign({}, Elemenx.Service('SceneWorld').Make(world.Objects[0].World).Ground, {Compute: 'js'}));
		var sum = 0;

		report('height:sketch-showcase', measure(function () {
			var i;

			for (i = 0; i < 100000; i++)
				sum += ground.Height((i % 300) * 10 - 1500, Math.floor(i / 300) * 9 - 1500);
		}), 100000);

		expect(sum).not.toBe(0);
	});

	/* The density of the volume of the Showcase round its cave: passages, halls, overhangs, the ground over them. */
	it('density of the caves of a ground', function () {
		var world = Elemenx.Service('SceneShowcase').World();
		var ground = terrain.Flat(Object.assign({}, Elemenx.Service('SceneWorld').Make(world.Objects[0].World).Ground, {Compute: 'js'}));
		var sum = 0;

		expect(ground.Volume).toBeTruthy();

		report('density:caves', measure(function () {
			var i;

			for (i = 0; i < 100000; i++)
				sum += ground.Density(-600 + (i % 50) * 2.8, 25 + (Math.floor(i / 50) % 40) * 0.9, -1120 + Math.floor(i / 2000) * 4.8);
		}), 100000);

		expect(sum).not.toBe(0);
	});

	/* The relief of a planet: as a globe sees it (finest 30 km) and as near as it is made (all its detail). */
	it('relief of a planet', function () {
		var planet = Elemenx.Service('ScenePlanet').Make({Seed: 'bench', Mountains: 0.7});
		var sum = 0;

		[['height:planet-globe', 30], ['height:planet-near', undefined]].forEach(function (pair) {
			report(pair[0], measure(function () {
				var i;

				for (i = 0; i < 50000; i++)
					sum += planet.Elevation([Math.cos(i * 0.0031) * Math.cos(i * 0.00017), Math.sin(i * 0.00017), Math.sin(i * 0.0031) * Math.cos(i * 0.00017)], pair[1]);
			}), 50000);
		});

		expect(sum).not.toBe(0);
	});

	/* A square of a ground as its geometry: 64 by 64 cells, its heights, normals and colors. */
	it('chunk', function () {
		var plain = terrain.Flat({Size: 2000, Height: 60, Seed: 'bench'});
		var count = 0;

		report('chunk:64', measure(function () {
			count += plain.Chunk(100, 100, 200, 64).Positions.length;
		}), 65 * 65);

		expect(count).toBeGreaterThan(0);
	});

	/* A way over the river of the strategy demo: over its bridge, and none where none is. */
	it('way', function () {
		var world = terrain.Flat(WORLD);
		var deck = function (x, z) {
			return Math.abs(z + 14) < 2.5 && Math.abs(x + 5) < 25 ? Math.max(2, world.Height(x, z)) : null;
		};

		report('way:bridge', measure(function () {
			world.Path({X: -60, Z: -26}, {X: 70, Z: 40}, {Step: 2, Over: deck});
		}), 1);
		report('way:none', measure(function () {
			world.Path({X: -60, Z: -26}, {X: 70, Z: 40}, {Step: 2});
		}), 1);
	});

	it('prints', async function () {
		console.log('\n' + lines.join('\n'));

		if (__COMPUTE_SAVE__) {
			await commands.writeFile('tests/perf/compute-baseline.json', JSON.stringify(Object.assign({}, baseline, results), null, '\t') + '\n');

			console.log('saved to tests/perf/compute-baseline.json');
		}
	});
});
