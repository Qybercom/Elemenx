import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

var planets;
var terrain;
var PLANET = {Seed: 'terra', Ocean: 0.5, Radius: 6371};

/* The face of the cube a direction is on, and where on it ([face, u, v]): the inverse of SceneTerrainGenerator.Face. */
function faceOf (d) {
	var ax = Math.abs(d[0]);
	var ay = Math.abs(d[1]);
	var az = Math.abs(d[2]);
	if (ax >= ay && ax >= az)
		return d[0] > 0 ? [0, -d[2] / ax, -d[1] / ax] : [1, d[2] / ax, -d[1] / ax];

	if (ay >= az)
		return d[1] > 0 ? [2, d[0] / ay, d[2] / ay] : [3, d[0] / ay, -d[2] / ay];

	return d[2] > 0 ? [4, d[0] / az, -d[1] / az] : [5, -d[0] / az, -d[1] / az];
}

/* What stands on a square of km round a direction (2 by default), side texels a side (32), by a worker's own function (SceneTerrainGenerator.Piece). */
function thingsAt (field, direction, km, side) {
	var at = faceOf(direction);
	var extent = (km || 2) / (Math.PI / 4 * field.Radius);

	return terrain.Piece('SphereThings', field.Options, null, [at[0], at[1], at[2], extent, side || 32]);
}

describe('Contract: what stands on the surface of a planet, seen from over it (ScenePlanet.PatchThings)', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:ScenePlanet', 'service:SceneTerrainGenerator']);

		planets = Elemenx.Service('ScenePlanet');
		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	/*
	 * A proxy of its square, as Voxy draws a far land: its houses where its settlements are, its woods where its biomes sow
	 * trees, nothing on the sea; one shape relative to the middle of the square, up as the ground is.
	 */
	it('stands houses where a settlement is, woods where trees grow, and nothing on the sea', function () {
		/* Its settlements as a scene gives them to it (ScenePlanet.Settlements); a city of them. */
		var towns = planets.Settlements(PLANET, 80).Settlements;
		var field = planets.Sphere(Object.assign({}, PLANET, {Settlements: towns}));
		var planet = field.Planet;
		var city = towns.filter(function (one) {
			return one.Kind === 'city';
		})[0];
		var town = city ? city.Point : null;
		var sea = null;
		var wood = null;
		var lat;
		var lon;

		for (lat = -60; lat <= 60 && (!town || !sea || !wood); lat += 6) {
			for (lon = -180; lon < 180 && (!town || !sea || !wood); lon += 9) {
				var direction = planets.Direction(lat, lon);
				var sample = planet.Sample(direction);
				if (!sea && !sample.Land && sample.Elevation < -500)
					sea = direction;

				if (!wood && sample.Land && sample.Moisture > 0.55 && sample.Celsius > 5 && sample.Celsius < 22 && planet.Towns(direction).every(function (one) {
					return one.Far > 60;
				}))
					wood = direction;
			}
		}

		expect(town).not.toBe(null);
		expect(sea).not.toBe(null);
		expect(wood).not.toBe(null);

		var built = thingsAt(field, town);
		var ocean = thingsAt(field, sea);
		var forest = thingsAt(field, wood, 0.6, 64);
		var coarse = thingsAt(field, wood);

		expect(built.Houses).toBeGreaterThan(20);
		expect(built.Geometry.Positions).toBeInstanceOf(Float32Array);
		expect(built.Geometry.Positions.length).toBe(built.Geometry.Normals.length);
		expect(built.Geometry.Positions.length).toBe(built.Geometry.Colors.length);
		expect(ocean.Houses + ocean.Woods).toBe(0);
		expect(ocean.Geometry.Positions.length).toBe(0);
		expect(forest.Woods).toBeGreaterThan(50);

		/*
		 * Regression: each texel of woods was one clump as wide as the texel (270 m on a square of 80 km), a flat pyramid. Its
		 * trees now as large as trees, a shape of their own (a scene draws it near the eye only): on a square of texels of
		 * 9.5 m, up to three a texel, each its own shape (Trees.Starts: its first vertex) none wider nor higher than 45 m; on
		 * one of texels of 64 m none (the Ground shader draws them from there).
		 */
		var crowns = forest.Trees.Positions;
		var starts = Array.from(forest.Trees.Starts).concat([crowns.length / 3]);
		var widest = 0;
		var sizes = {};
		var k;

		expect(forest.Woods).toBeLessThanOrEqual(64 * 64 * 3);
		expect(forest.Trees.Starts.length).toBe(forest.Woods);
		expect(forest.Geometry.Positions.length / 9).toBe(forest.Houses * 10);

		for (k = 0; k < forest.Woods; k++) {
			var first = starts[k] * 3;
			var j;

			sizes[(starts[k + 1] - starts[k]) / 3] = true;

			for (j = first; j < starts[k + 1] * 3; j += 3)
				widest = Math.max(widest, Math.hypot(crowns[j] - crowns[first], crowns[j + 1] - crowns[first + 1], crowns[j + 2] - crowns[first + 2]));
		}

		expect(widest).toBeGreaterThan(0.004);
		expect(widest).toBeLessThan(0.045);
		/*
		 * Woods of the trees its biome sows, each of the far form of its species (SceneFlora.Far): a bare trunk and a crown of
		 * its profile, a palm's fronds: mixed woods, trees of more than one shape (count of triangles).
		 */
		expect(Object.keys(sizes).length).toBeGreaterThan(1);
		expect(coarse.Woods).toBe(0);
		expect(coarse.Trees.Positions.length).toBe(0);

		/*
		 * Regression: a scene asked for what stands on a square in a job of its own, which made its picture again (a square
		 * came in twice the time). The square's own job gives it now, of its picture, the very same.
		 */
		var at = faceOf(town);
		var extent = 2 / (Math.PI / 4 * field.Radius);
		var square = terrain.Piece('Sphere', field.Options, null, [at[0], at[1], at[2], extent, 8, 32, 32]);
		var alone = terrain.Piece('SphereThings', field.Options, null, [at[0], at[1], at[2], extent, 32]);

		expect(square.Picture.Size).toBe(32);
		expect(square.Things.Houses).toBe(alone.Houses);
		expect(Array.from(square.Things.Geometry.Positions)).toEqual(Array.from(alone.Geometry.Positions));
		expect(terrain.Piece('Sphere', field.Options, null, [at[0], at[1], at[2], extent, 8, 32, 0]).Things).toBe(null);

		/* Relative to the middle of its square (2 km): no point farther than the square and the tallest house over it. */
		var most = 0;
		var i;

		for (i = 0; i < built.Geometry.Positions.length; i += 3)
			most = Math.max(most, Math.hypot(built.Geometry.Positions[i], built.Geometry.Positions[i + 1], built.Geometry.Positions[i + 2]));

		expect(most).toBeLessThan(2);
		expect(Math.hypot(built.Center[0], built.Center[1], built.Center[2])).toBeGreaterThan(6370);
	});
});
