import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

function hash (value) {
	var text = JSON.stringify(value);
	var h = 5381;
	var i;

	for (i = 0; i < text.length; i++)
		h = (h * 33 + text.charCodeAt(i)) >>> 0;

	return h.toString(16) + ':' + text.length;
}

function ring (x, z, r) {
	var points = [];
	var i;

	for (i = 0; i < 10; i++)
		points.push([x + Math.cos(i / 10 * Math.PI * 2) * r, z + Math.sin(i / 10 * Math.PI * 2) * r]);

	return points;
}

var sides = [[-900, -900, 900, -900], [900, -900, 900, 900], [900, 900, -900, 900], [-900, 900, -900, -900]];

/* Worlds of towns, villages, a passage, a highway and rails, and the hashes of the roads the code of the step Roads made of them. */
var worlds = [
	[{Size: 2000, Height: 120, Water: 0, Seed: 'roads', Sketch: {Layers: [{ID: 'towns', Items: [{Type: 'settlement', Kind: 'town', Points: ring(-500, -400, 120)}, {Type: 'settlement', Kind: 'town', Points: ring(450, 300, 120)}, {Type: 'settlement', Kind: 'village', Points: ring(-400, 500, 60)}]}]}, Border: {Points: [[-900, -900], [900, -900], [900, 900], [-900, 900]], Sides: sides, Passages: [{Side: 1, At: 0.2, Width: 6}]}, Roads: true}, '3af203dc:986'],
	[{Size: 2000, Height: 120, Water: 0, Seed: 'roads', Sketch: {Layers: [{ID: 'towns', Items: [{Type: 'settlement', Kind: 'town', Points: ring(-500, -400, 120)}, {Type: 'settlement', Kind: 'city', Points: ring(450, 300, 120)}]}]}, Roads: {Rail: true}}, '24f81b4:734'],
	[{Size: 3000, Height: 200, Water: 0.1, Seed: 'net', Sketch: {Layers: [{ID: 'towns', Items: [{Type: 'settlement', Kind: 'city', Points: ring(0, 0, 150)}, {Type: 'settlement', Kind: 'town', Points: ring(900, 500, 100)}, {Type: 'settlement', Kind: 'town', Points: ring(-800, 700, 100)}, {Type: 'settlement', Kind: 'village', Points: ring(600, -900, 50)}, {Type: 'settlement', Kind: 'village', Points: ring(-1000, -600, 50)}, {Type: 'road', Trunk: true, Class: 'highway', Points: [[-1400, 1200], [1400, -1300]]}]}]}, Roads: {Rail: true}}, 'd26953d5:3366']
];

/* Tracks of seeds and options, and the hashes of what the code of Track made of them. */
var tracks = [['track', {}, 'c502e578:515'], ['walls', {Length: 1200, Corners: 9, Gap: -9}, '503a76ac:447'], ['drive', {Length: 1200, Corners: 9}, '82b9f843:441'], ['hull', {Length: 200, Corners: 6}, 'b426c72d:387'], ['scenic', {Scenery: true}, 'ee18afd0:2262'], [7, {Wild: 0.3, Length: 3000}, '254b3c6f:529']];

/*
 * Regression: the rivers of a planet, the roads of a world and the line of a race track were made in the code alone, each
 * number and each step of them there. They are graphs of networks of the library now (blueprints/network: rivers, roads,
 * track), each step a block, and each gives the very same as the code gave.
 */
describe('Regression: the networks of rivers, roads and tracks, graphs of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneWorld', 'service:SceneRoadGenerator', 'service:NetworkBlueprints', 'service:ScenePlanet', 'service:SceneTerrainGenerator']);
	}, 60000);

	it('joins the settlements of a world by roads as the code did', function () {
		var world = Elemenx.Service('SceneWorld');

		worlds.forEach(function (told) {
			var made = world.Make(world.Library(told[0]));

			expect(made.Problems).toEqual([]);
			expect(hash(made.Things)).toBe(told[1]);
		});
	});

	it('lays a race track as the code did', function () {
		tracks.forEach(function (told) {
			expect(hash(Elemenx.Service('SceneRoadGenerator').Track(told[0], told[1]))).toBe(told[2]);
		});
	});

	it('gathers the rivers of a planet as the code did: its ways smoothed twice on the ball and rounded', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var size = 32;
		var heights = new Float32Array(6 * size * size);
		var face;

		for (face = 0; face < 6; face++)
			heights.set(planets.Heights({Seed: 'terra', Ocean: 0.62, Radius: 6371}, face, size, 0, size).Data, face * size * size);

		[4, 12, undefined].forEach(function (least) {
			var made = planets.Drainage(heights, size, least);
			var ways = planets.DrainageWays(heights, size, least || 40).Ways;

			expect(made.Size).toBe(size);
			expect(made.Rivers.length).toBe(ways.length);
			expect(made.Rivers).toEqual(ways.map(function (way) {
				return planets.Smoothed(way.Points, way.Values.Flow, way.Values.Level);
			}));
		});
	});

	it('runs the networks of the library as code, a worker\'s too', function () {
		var networks = Elemenx.Service('NetworkBlueprints');

		['rivers', 'roads', 'track'].forEach(function (name) {
			var code = networks.Code('ElemenxGraphics/network/' + name);

			expect(typeof code.Source).toBe('string');
			expect(code.Keys).toEqual(['Network']);
		});

		/*
		 * The code of a planet's own graph of rivers (RiversGraph) for its workers. Regression: named RiversOf, it took the place
		 * of RiversOf(key), the rivers kept under a key, and the planets of rivers by a key had none.
		 */
		var planets = Elemenx.Service('ScenePlanet');

		planets.UseRivers('kept-rivers', [{Points: [[1, 0, 0], [0, 1, 0]], Flow: [50, 60], Level: [10, 0]}]);

		expect(planets.RiversOf('kept-rivers').length).toBe(1);
		expect(planets.RiversSourceOf({})).toBe(undefined);
		expect(typeof planets.RiversSourceOf({RiversGraph: 'ElemenxGraphics/network/rivers'})).toBe('string');

		/* The code of the rivers is carried to the workers of the planets. */
		expect(Elemenx.Service('ScenePlanet').Carried).toContain('RiversCode');
	});
});
