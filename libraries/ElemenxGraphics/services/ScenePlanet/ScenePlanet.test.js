import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var planets;

/* Points spread evenly over a sphere, the same every run. */
function spread (count) {
	var list = [];
	var i;

	for (i = 0; i < count; i++) {
		var y = 1 - (i + 0.5) / count * 2;
		var around = Math.sqrt(1 - y * y);

		list.push([Math.cos(i * 2.39996) * around, y, Math.sin(i * 2.39996) * around]);
	}

	return list;
}

describe('Contract: ScenePlanet, a planet as one continuous function of a direction', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:ScenePlanet', 'service:SceneBiomes', 'service:SceneTerrainGenerator', 'service:Noise', 'service:Workers']);

		planets = Elemenx.Service('ScenePlanet');
	});

	it('turns a latitude and a longitude into a direction and back', function () {
		[[0, 0], [33, -120], [-60, 170], [89, 10]].forEach(function (place) {
			var back = planets.LatLon(planets.Direction(place[0], place[1]));

			expect(back[0]).toBeCloseTo(place[0], 9);
			expect(back[1]).toBeCloseTo(place[1], 9);
		});

		expect(planets.Direction(0, 90)[2]).toBeCloseTo(-1, 9);
	});

	it('keeps as much of it under the sea as Ocean says, warm at the equator and cold at the poles, its winds by their belts', function () {
		var planet = planets.Make({Seed: 'blue', Ocean: 0.7});
		var points = spread(1200);
		var land = points.filter(function (point) {
			return planet.Land(point);
		}).length / points.length;

		expect(land).toBeGreaterThan(0.24);
		expect(land).toBeLessThan(0.36);
		expect(planet.Climate(planets.Direction(0, 40)).Celsius).toBeGreaterThan(planet.Climate(planets.Direction(80, 40)).Celsius + 25);

		/* Trades from the east by the equator, westerlies at 45 degrees. */
		expect(planet.Wind(planets.Direction(10, 60))[0]).toBeLessThan(0);
		expect(planet.Wind(planets.Direction(45, 60))[0]).toBeGreaterThan(0);

		/* The same planet of the same seed; another of another. */
		expect(planets.Make({Seed: 'blue', Ocean: 0.7}).Elevation(points[5])).toBe(planet.Elevation(points[5]));
		expect(points.some(function (point) {
			return planets.Make({Seed: 'red', Ocean: 0.7}).Land(point) !== planet.Land(point);
		})).toBe(true);
	});

	it('raises what was painted: a continent where it is drawn, a sea, a range of mountains, a climate and a biome of its own', function () {
		var plain = planets.Make({Seed: 'paint', Ocean: 0.9});
		var planet = planets.Make({Seed: 'paint', Ocean: 0.9, Paint: [
			{Type: 'land', Points: [[0, 0], [0, 40], [30, 40], [30, 0]], Edge: 200},
			{Type: 'mountains', Points: [[10, 10], [20, 30]], Width: 150, Height: 5000},
			{Type: 'biome', Points: [[2, 2], [2, 8], [8, 8], [8, 2]], Biome: 'desert', Edge: 50},
			{Type: 'climate', Points: [[22, 2], [22, 8], [28, 8], [28, 2]], Temperature: -20, Edge: 50}
		]});

		expect(planet.Land(planets.Direction(15, 20))).toBe(true);
		expect(planet.Land(planets.Direction(15, 120)) === plain.Land(planets.Direction(15, 120))).toBe(true);
		expect(planet.Elevation(planets.Direction(15, 20))).toBeGreaterThan(plain.Elevation(planets.Direction(15, 20)) + 1000);
		expect(planet.Biome(planets.Direction(5, 5))).toBe('desert');
		expect(planet.Climate(planets.Direction(25, 5)).Celsius).toBeLessThan(plain.Climate(planets.Direction(25, 5)).Celsius - 15);
	});

	it('tells its coasts at any scale alike: what is finer than Detail never turns the land into the sea', function () {
		var planet = planets.Make({Seed: 'coast', Ocean: 0.6, Radius: 6371, Detail: 2});
		var turned = 0;
		var coasts = 0;

		spread(400).forEach(function (point) {
			var i;

			/* Steps of 200 metres along a line: where the land of the globe turns, the elevation turns with it, never elsewhere. */
			for (i = 0; i < 20; i++) {
				var p = [point[0] + i * 0.2 / 6371, point[1], point[2]];
				var sample = planet.Sample(p);
				if (sample.Land !== planet.Land(p))
					turned++;

				if (i && sample.Land !== planet.Sample([point[0] + (i - 1) * 0.2 / 6371, point[1], point[2]]).Land)
					coasts++;
			}
		});

		expect(turned).toBe(0);
		expect(coasts).toBeGreaterThan(0);
	});

	it('has tectonic plates whose borders close into mountains and part into rifts, each plate its own', function () {
		var planet = planets.Make({Seed: 'plates', Plates: 10});
		var ids = {};
		var pushes = [];

		spread(800).forEach(function (point) {
			var plate = planet.Plate(point);

			ids[plate.ID] = true;

			if (plate.Boundary < 100)
				pushes.push(plate.Push);
		});

		expect(Object.keys(ids).length).toBe(10);
		expect(pushes.some(function (push) {
			return push > 0.2;
		})).toBe(true);
		expect(pushes.some(function (push) {
			return push < -0.2;
		})).toBe(true);
	});
	/* Regression: a worker had no Math for the noises of the planet, and painted nothing. */
	it('paints a piece of a globe in a worker byte for byte as in the page, and turns a pixel into a direction and back', async function () {
		var options = {Seed: 'picture', BiomeList: Elemenx.Service('SceneTerrainGenerator').Biomes({Biomes: ['temperate', 'desert', 'tundra']})};
		var view = {Yaw: 0.4, Pitch: 0.3, Zoom: 1.2, Width: 64, Height: 48};
		var here = planets.Picture(options, view, [0, 0, 64, 48], 4, 'relief');
		var there = await new Promise(function (done, failed) {
			planets.Work().Run('ScenePlanet', 'Picture', [options, view, [0, 0, 64, 48], 4, 'relief'], function (error, made) {
				if (error) failed(error);
				else done(made);
			});
		});
		var direction = planets.Unproject(view, 30, 20);
		var back = planets.Project(view, direction);

		expect(Array.from(there.Data)).toEqual(Array.from(here.Data));
		expect(Array.from(here.Data).some(function (value, index) {
			return index % 4 === 3 && value === 255;
		})).toBe(true);
		expect(back[0]).toBeCloseTo(30, 6);
		expect(back[1]).toBeCloseTo(20, 6);
		expect(back[2]).toBeGreaterThan(0);
		expect(planets.Unproject(view, 0, 0)).toBe(null);
	});
	it('gives its ground to land on as the Sphere of SceneTerrainGenerator does: its heights, squares with its colors, the same in a worker', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var options = {Seed: 'ground', Radius: 3000};
		var field = terrain.Sphere({Planet: options});
		var planet = planets.Make(options);
		var direction = planets.Direction(12, 34);
		var patch = field.Patch(2, 0.1, -0.2, 0.05, 8);
		var piece = await new Promise(function (done, failed) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Sphere', field.Options, null, [2, 0.1, -0.2, 0.05, 8]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(field.Painted).toBe(true);
		expect(field.Radius).toBe(3000);
		expect(field.Land(direction)).toBeCloseTo(planet.Elevation(direction) / 1000, 9);
		expect(field.Elevation(direction)).toBe(Math.max(0, field.Land(direction)));
		expect(patch.Geometry.Colors.length).toBe(patch.Geometry.Positions.length);
		expect(Array.from(piece.Geometry.Colors)).toEqual(Array.from(new Float32Array(patch.Geometry.Colors)));
		expect(Array.from(piece.Geometry.Positions)).toEqual(Array.from(new Float32Array(patch.Geometry.Positions)));
	});
	it('lays its surface out in cells of locations: each found of its points, its neighbours over the edges of the faces too, its place and outline a location takes', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var radius = 6371;
		var size = 4;
		var seen = {};

		spread(300).forEach(function (point) {
			var cell = planets.CellAt(radius, size, point);
			var back = planets.CellAt(radius, size, planets.CellCenter(cell));

			expect(back.ID).toBe(cell.ID);

			seen[cell.Face] = true;

			/* Each neighbour has it for a neighbour. */
			planets.CellNeighbours(radius, size, cell).forEach(function (other) {
				expect(other.ID).not.toBe(cell.ID);
				expect(planets.CellNeighbours(radius, size, other).map(function (one) {
					return one.ID;
				})).toContain(cell.ID);
			});
		});

		expect(Object.keys(seen).length).toBe(6);

		/* A cell at the edge of a face: its neighbour across it on the next face. */
		var edge = {Face: 0, I: planets.Cells(radius, size) - 1, J: 10, N: planets.Cells(radius, size)};

		expect(planets.CellNeighbours(radius, size, edge)[0].Face).not.toBe(0);

		/* Its place: the corners of its outline on the ground of the location are its corners on the planet; it is about Size across. */
		var cell = planets.CellAt(radius, size, planets.Direction(40, 25));
		var place = planets.CellPlace(radius, cell);
		var site = terrain.Site({Options: {Seed: 'cells', Radius: radius}, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});

		planets.CellCorners(cell).forEach(function (corner, index) {
			var there = site.Direction(place.Points[index][0], place.Points[index][1]);

			/* By the chord, not the angle: an arc cosine near 1 loses a tenth of a metre at the radius of the Earth. */
			expect(Math.hypot(there[0] - corner[0], there[1] - corner[1], there[2] - corner[2]) * radius * 1000).toBeLessThan(0.01);
		});

		expect(place.Size).toBeGreaterThan(3000);
		expect(place.Size).toBeLessThan(5500);

		/* Its sides along the axes of the location: the first side runs along X. */
		expect(Math.abs(place.Points[1][1] - place.Points[0][1])).toBeLessThan(Math.abs(place.Points[1][0] - place.Points[0][0]) * 0.05);
	});
});
