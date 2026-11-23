import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

var planets;
var PINNED = ['5bfcea2f', '954bd5c6', '1e637d72', '1fdaa772', 'fd7b9e4d', 'c988b164', 'b9ae1cdf', '7d341125', '69ab899f', '4c5230c1', 'bf63629b', '2a0cd681', '5696206', 'de6bee99', 'e837b8b7', '2470a625', '7a2b4806', '8dc70fdf', 'e80283f8', 'd3da809f'];

/* The FNV-1a of the bytes of a picture of a square (its Color, Normal, Use, Snow, Biomes one after another). */
function hash (picture) {
	var value = 2166136261;

	['Color', 'Normal', 'Use', 'Snow', 'Biomes'].forEach(function (key) {
		var i;

		for (i = 0; i < picture[key].length; i++)
			value = Math.imul(value ^ picture[key][i], 16777619);
	});

	return (value >>> 0).toString(16);
}

/*
 * The picture of the far ground of a planet of the graph blueprints/shader/ground-far (PictureRun of ScenePlanet): the
 * rules of a texel (alpine meadow, rock on the steep, deserts and basins, snow, ice, the water by the coast, a river and
 * a highway as much of a texel as they cover) moved from the code to the graph. Regression: the very bytes the code made
 * before, of squares large and small, of a planet with rivers, settlements and highways.
 */
describe('Regression: the far ground of a planet of its graph (shader/ground-far)', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:ScenePlanet', 'service:SceneBiomes', 'service:SceneTerrainGenerator', 'service:Noise', 'service:Workers', 'service:SceneLocations', 'service:SceneWorld']);

		planets = Elemenx.Service('ScenePlanet');
	});

	it('is a graph of numbers: three functions of its results by fours, of the inputs a texel has', function () {
		var run = planets.PictureRun();

		expect(run.map(function (one) {
			return one.Keys;
		})).toEqual([['R', 'G', 'B', 'Water'], ['Trees', 'Farm', 'Built', 'Dune'], ['Snow']]);
		expect(run[0].Inputs).not.toContain('Woods');
		expect(run[1].Inputs).toContain('Woods');
		expect(planets.PictureCode.length).toBe(3);
		expect(typeof planets.PictureCode[0].Source).toBe('string');
	});

	it('paints the very bytes the code painted before', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var heights = new Float32Array(6 * 64 * 64);
		var face;
		var seed = 11;
		var hashes = [];

		for (face = 0; face < 6; face++)
			heights.set(planets.Heights(options, face, 64, 0, 64).Data, face * 64 * 64);

		planets.UseRivers('far-rivers', planets.Drainage(heights, 64, 4).Rivers);
		planets.UseSettlements('far-towns', planets.Settlements(options, 6000).Settlements);
		planets.UseHighways('far-highways', planets.Highways(Object.assign({}, options, {Settlements: 'far-towns'}), 20).Highways);

		function next () {
			seed = (seed * 16807) % 2147483647;

			return seed / 2147483647;
		}

		[terrain.Sphere({Planet: {Seed: 'terra', Ocean: 0.55, Radius: 6371}}), terrain.Sphere({Planet: Object.assign({}, options, {Rivers: 'far-rivers', Highways: 'far-highways', Settlements: 'far-towns'})})].forEach(function (field) {
			var s;

			for (s = 0; s < 10; s++) {
				var f = Math.floor(next() * 6);
				var extent = [0.6, 0.1, 0.02, 0.004, 0.001][s % 5];
				var cu = (next() * 2 - 1) * (1 - extent);
				var cv = (next() * 2 - 1) * (1 - extent);

				hashes.push(hash(planets.PatchPicture(field, f, cu, cv, extent, [9, 17, 24][s % 3])));
			}
		});

		expect(hashes).toEqual(PINNED);
	}, 300000);

	/* A planet of a graph of its own (GroundFarGraph): its picture of it, its code for its workers among its ReliefSources. */
	it('paints a planet of a graph of its own, its code carried to its workers', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var graph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/ground-far')));
		var options = {Seed: 'terra', Ocean: 0.55, Radius: 6371};
		var red;
		var plain;

		graph.blocks.forEach(function (block) {
			if (block.id === 'ground-far-formula-r')
				block.properties[0].value = '1';
		});

		plain = planets.PatchPicture(terrain.Sphere({Planet: options}), 4, 0, 0, 0.1, 9);
		red = planets.PatchPicture(terrain.Sphere({Planet: Object.assign({}, options, {GroundFarGraph: graph})}), 4, 0, 0, 0.1, 9);

		expect(red.Color[0]).toBe(255);
		expect(red.Color[1]).toBe(plain.Color[1]);
		expect(red.Normal).toEqual(plain.Normal);
		expect(planets.GraphSources({GroundFarGraph: graph}).GroundFar.length).toBe(3);
		expect(planets.Ruled(Object.assign({}, options, {GroundFarGraph: graph})).ReliefSources.GroundFar[0].Keys).toEqual(['R', 'G', 'B', 'Water']);
	});
});
