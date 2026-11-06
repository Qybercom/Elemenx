/*
 * The hot spots of the processor, measured in Node: what would gain the most from WebAssembly (or from workers), before
 * any is written. Each case runs a few times; the best run counts (the least disturbed). node tests/perf/hotspots.mjs
 * [--json]. The numbers are of this machine: compare them with each other, and with a WebAssembly version of one of them.
 */
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

var require = createRequire(import.meta.url);
var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
var Elemenx = require(path.join(root, 'libraries', 'ElemenxCommon', 'node.js'));

var math = Elemenx.Service('Math');
var noise = Elemenx.Service('Noise');
var paths = Elemenx.Service('Pathfinding');
var physics = Elemenx.Service('Physics');

/* The best of a few runs, in milliseconds, and how many units of work a millisecond. */
function measure (name, units, run) {
	var best = Infinity;
	var i;

	run();

	for (i = 0; i < 5; i++) {
		var started = process.hrtime.bigint();

		run();

		best = Math.min(best, Number(process.hrtime.bigint() - started) / 1e6);
	}

	return {Name: name, Ms: Math.round(best * 100) / 100, Units: units, PerMs: Math.round(units / best)};
}

var results = [];
var sink = 0;

/* Noise of the shaders on the processor (heights of terrain, clouds baked): a sample of fbm of 5 octaves. */
results.push(measure('Math.Noise Fbm, 5 octaves, 256x256', 65536, function () {
	var made = math.Noise(7);
	var x;
	var z;

	for (z = 0; z < 256; z++) {
		for (x = 0; x < 256; x++)
			sink += made.Fbm(x * 0.02, 0, z * 0.02, 5);
	}
}));

/* The Noise Service of a spec (simplex with warp, as a relief of the world graph). */
results.push(measure('Noise simplex fbm + warp, 256x256', 65536, function () {
	var made = noise.Make({Type: 'simplex', Seed: 3, Scale: 0.01, Fractal: 'fbm', Octaves: 5, Warp: {Amount: 20, Scale: 0.005, Octaves: 2}});
	var x;
	var z;

	for (z = 0; z < 256; z++) {
		for (x = 0; x < 256; x++)
			sink += made.At(x, z);
	}
}));

/* A* across a grid of 256 cells a side with walls (the paths of units). */
results.push(measure('Pathfinding A*, 256x256, corner to corner', 1, function () {
	var grid = paths.Grid(256, 256, 1);
	var x;

	for (x = 8; x < 248; x += 16)
		grid.Set(x, (x * 7) % 200, Infinity);

	sink += paths.Path(grid, {X: 0, Y: 0}, {X: 255, Y: 255}).length;
}));

/* A flow field for many units at once (Dijkstra over every cell). */
results.push(measure('Pathfinding Flow, 256x256', 65536, function () {
	var grid = paths.Grid(256, 256, 1);

	sink += paths.Flow(grid, [{X: 128, Y: 128}]).Distances.length;
}));

/* Solid bodies: 200 boxes falling into a pile, a second of steps of 1/120. */
results.push(measure('Physics World, 200 boxes, 1 s', 120, function () {
	var world = physics.World({Gravity: 9.81, Ground: 0, Step: 1 / 120});
	var i;

	for (i = 0; i < 200; i++)
		world.Add({ID: 'b' + i, Shape: 'box', Size: [0.5, 0.5, 0.5], Mass: 1, At: [(i % 10) * 0.6, 1 + Math.floor(i / 10) * 0.6, 0]});

	for (i = 0; i < 120; i++)
		world.Step(1 / 120);
}));

/* The same bodies apart on the ground, a few touching: the usual scene, not a pile. */
results.push(measure('Physics World, 200 boxes spread, 1 s', 120, function () {
	var world = physics.World({Gravity: 9.81, Ground: 0, Step: 1 / 120});
	var i;

	for (i = 0; i < 200; i++)
		world.Add({ID: 'b' + i, Shape: 'box', Size: [0.5, 0.5, 0.5], Mass: 1, At: [(i % 20) * 3, 0.5 + (i % 3) * 0.6, Math.floor(i / 20) * 3]});

	for (i = 0; i < 120; i++)
		world.Step(1 / 120);
}));

if (process.argv.indexOf('--json') !== -1) {
	console.log(JSON.stringify(results, null, '\t'));
}
else {
	results.forEach(function (one) {
		console.log(one.Name + ': ' + one.Ms + ' ms (' + one.PerMs + ' a ms)');
	});
}

if (sink === 42) console.log('');
