import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import planetSource from '../../libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.js?raw';
import terrainSource from '../../libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.js?raw';

/* A short print of a value: its JSON hashed, and its length. */
function hash (value) {
	var text = JSON.stringify(value);
	var h = 5381;
	var i;

	for (i = 0; i < text.length; i++)
		h = (h * 33 + text.charCodeAt(i)) >>> 0;

	return h.toString(16) + ':' + text.length;
}

/*
 * Regression: five searches of their own (the highways of a planet, the way of a road over a ground, the way of a walker
 * over it and under it, the route through passages), each its own heap, costs and path, beside the Search of the
 * Pathfinding Service. Each is that Search now, and each finds the very ways it found before (the prints of before):
 * the roads of a world do not move. A pool of workers of them carries Pathfinding (its Source).
 */
describe('Regression: the searches of ways of a planet and of a ground, one Search of Pathfinding', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:ScenePlanet', 'service:SceneTerrainGenerator', 'service:SceneWorld', 'service:Pathfinding']);
	}, 60000);

	it('finds the very ways it found before, by the Search of Pathfinding alone', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var towns = planets.Settlements(options, 6000).Settlements;
		var flat = terrain.Flat({Size: 600, Height: 40, Water: 0.35, Seed: 'contract'});
		var cave = terrain.Flat({Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90, Carves: [{Type: 'passages', Radius: 2.5, Nodes: [{ID: 'w', At: [-60, 0, -4]}, {ID: 'f', At: [0, 0, -4]}, {ID: 'n', At: [40, 40, -4]}, {ID: 's', At: [40, -40, -4]}], Ways: [{From: 'w', To: 'f'}, {From: 'f', To: 'n'}, {From: 'f', To: 's'}]}]});
		var walk = terrain.Underground(cave, {});

		planets.UseSettlements('ways-towns', towns);

		expect(hash(planets.Highways(Object.assign({}, options, {Settlements: 'ways-towns'}), 20))).toBe('94485ee0:8910');
		expect(hash([[[-250, -200], [240, 230]], [[-200, 220], [210, -230]], [[0, -280], [10, 280]]].map(function (pair) {
			return terrain.RoadWay(flat, pair[0], pair[1]);
		}))).toBe('cf89e5e0:715');
		expect(hash([[[-250, -200], [240, 230]], [[-200, 220], [210, -230]], [[-50, -40], [60, 50]]].map(function (pair) {
			return flat.Path({X: pair[0][0], Z: pair[0][1]}, {X: pair[1][0], Z: pair[1][1]});
		}))).toBe('138e4935:251');
		expect(hash([walk.Path({X: -60, Z: 0, Y: -5.5}, {X: 40, Z: 40, Y: -5.5}, {Step: 2}), walk.Path({X: -60, Z: 0, Y: -5.5}, {X: 40, Z: -40, Y: -5.5}, {Step: 2}), walk.Path({X: -100, Z: 50}, {X: 100, Z: -60}, {Step: 4})])).toBe('ec028180:214');

		[planetSource, terrainSource].forEach(function (source) {
			expect(source).not.toMatch(/closed\[[^\]]+\] = true/);
		});
		expect(terrainSource).not.toContain('open.sort(');
	}, 120000);

	it('finds the highways of a planet in its workers as in the page', async function () {
		var planets = Elemenx.Service('ScenePlanet');
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371, Rivers: false};
		var towns = planets.Settlements(options, 6000).Settlements;
		var given = Object.assign({}, options, {Settlements: towns});
		var page = planets.Highways(given, 20);
		var worker = await new Promise(function (resolve, reject) {
			planets.Work().Run('ScenePlanet', 'Highways', [given, 20], function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(planets.Work().Inline()).toBe(false);
		expect(page.Highways.length).toBeGreaterThan(0);
		expect(hash(worker)).toBe(hash(page));

		/*
		 * In parts, each in a worker, put together in their order: the very highways of one run. Regression: one worker laid
		 * them all, and the globe of a scene waited for it (minutes under the load of the tests).
		 */
		var pieces = await Promise.all([0, 1, 2, 3].map(function (part) {
			return new Promise(function (resolve, reject) {
				planets.Work().Run('ScenePlanet', 'Highways', [given, 20, part, 4], function (error, made) {
					if (error) reject(error);
					else resolve(made);
				});
			});
		}));

		expect(pieces.every(function (piece) {
			return piece.Highways.length > 0;
		})).toBe(true);
		expect(hash(planets.MergeHighways(pieces))).toBe(hash(page));
	}, 120000);
});
