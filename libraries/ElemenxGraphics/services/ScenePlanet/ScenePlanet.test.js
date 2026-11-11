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

		Use(['service:ScenePlanet', 'service:SceneBiomes', 'service:SceneTerrainGenerator', 'service:Noise', 'service:Workers', 'service:SceneLocations', 'service:SceneWorld']);

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
	it('paints a face of the globe as texels of a cube, each of its direction, strips of it alike, the same in a worker', async function () {
		var options = {Seed: 'faces', BiomeList: Elemenx.Service('SceneTerrainGenerator').Biomes({Biomes: ['temperate', 'desert', 'tundra']})};
		var planet = planets.Planet(options);
		var whole = planets.Face(options, 4, 16);
		var strip = planets.Face(options, 4, 16, 8, 4);
		var there = await new Promise(function (done, failed) {
			planets.Work().Run('ScenePlanet', 'Face', [options, 4, 16, 8, 4], function (error, made) {
				if (error) failed(error);
				else done(made);
			});
		});
		/* The texel of column 3 of row 9 of face +Z: its direction as cubeDirection gives it. */
		var a = -1 + 3.5 * 2 / 16;
		var b = -1 + 9.5 * 2 / 16;
		var length = Math.hypot(a, b, 1);
		var sample = planet.Sample([a / length, -b / length, 1 / length]);
		var color = planets.Color(planet, sample, 'relief', 1);
		var at = (9 * 16 + 3) * 4;

		expect(whole.Data.length).toBe(16 * 16 * 4);
		expect(strip).toMatchObject({Face: 4, Row: 8, Rows: 4});
		expect(Array.from(strip.Data)).toEqual(Array.from(whole.Data.slice(8 * 16 * 4, 12 * 16 * 4)));
		expect(Array.from(there.Data)).toEqual(Array.from(strip.Data));
		expect(whole.Data[at]).toBe(Math.round(color[0] * 255));
		expect(whole.Data[at + 3]).toBe(sample.Land || sample.Celsius < -12 ? 10 : 204);
	});

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
	it('lays its surface out in hexagons of an icosahedron too: 12 pentagons, each cell found of its points and of its ID, its neighbours round it, its sides shared with them the other way', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var radius = 6371;
		var size = 4;
		var n = planets.Cells(radius, size, 'hex');
		var five = 0;

		/* About Size from one middle to the next. */
		expect(n).toBeGreaterThan(1800);

		spread(200).concat(planets.Icosahedron().Corners).forEach(function (point) {
			var cell = planets.CellAt(radius, size, point, 'hex');
			var round = planets.CellNeighbours(radius, size, cell);
			var place = planets.CellPlace(radius, cell);
			var center = planets.CellCenter(cell);

			expect(planets.CellAt(radius, size, center, 'hex').ID).toBe(cell.ID);
			expect(planets.CellOf(cell.ID).ID).toBe(cell.ID);
			expect(planets.CellCenter(planets.CellOf(cell.ID))).toEqual(center.map(function (value) {
				return expect.closeTo(value, 9);
			}));
			expect([5, 6]).toContain(round.length);

			if (round.length === 5)
				five++;

			expect(place.Points.length).toBe(round.length);
			expect(place.Size).toBeGreaterThan(2900);
			expect(place.Size).toBeLessThan(4800);

			round.forEach(function (other, side) {
				var back = planets.CellNeighbours(radius, size, other);
				var facing = back.map(function (one) {
					return one.ID;
				}).indexOf(cell.ID);
				var mine = place.Sides[side];
				var theirs = planets.CellPlace(radius, other);
				var site = terrain.Site({Options: {Seed: 'cells', Radius: radius}, Latitude: place.Latitude, Longitude: place.Longitude, Turn: place.Turn});
				var there = terrain.Site({Options: {Seed: 'cells', Radius: radius}, Latitude: theirs.Latitude, Longitude: theirs.Longitude, Turn: theirs.Turn});
				var a;
				var b;

				expect(facing).not.toBe(-1);

				/* The side the neighbour shares runs the other way: its end is the start of mine. */
				a = site.Direction(mine[0], mine[1]);
				b = there.Direction(theirs.Sides[facing][2], theirs.Sides[facing][3]);

				expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * radius * 1000).toBeLessThan(1);
			});
		});

		expect(five).toBe(12);
	});

	/*
	 * Regression: its land was a plain wherever one stood (a bump of 4 km, hills of tens of metres, mountains only where
	 * plates met). It is made as the Earth is: heights spread as its land's (a half under 400-700 m, a tenth over 1.5-3 km),
	 * plains flat and ranges rugged within a location of 4 km.
	 */
	it('makes land of plains, hills and ranges, its heights spread as on the Earth', function () {
		var planet = planets.Make({Seed: 'terra', Ocean: 0.62, Radius: 6371});
		var heights = [];
		var ranges = [];

		function at (list, part) {
			return list[Math.floor(list.length * part)];
		}

		spread(3000).forEach(function (d) {
			var h = planet.Elevation(d);
			var lowest = Infinity;
			var highest = -Infinity;
			var east;
			var north;
			var u;
			var v;

			if (h <= 0) return;

			heights.push(h);

			if (ranges.length >= 150) return;

			east = Math.abs(d[1]) > 0.99 ? [1, 0, 0] : planets.Tangent(d).East;
			north = planets.Tangent(d).North;

			for (u = -2; u <= 2; u++) {
				for (v = -2; v <= 2; v++) {
					var e = planet.Elevation([0, 1, 2].map(function (k) {
						return d[k] + (east[k] * u + north[k] * v) / 6371;
					}));

					lowest = Math.min(lowest, e);
					highest = Math.max(highest, e);
				}
			}

			ranges.push(highest - lowest);
		});

		heights.sort(function (a, b) {
			return a - b;
		});
		ranges.sort(function (a, b) {
			return a - b;
		});

		expect(at(heights, 0.5)).toBeGreaterThan(250);
		expect(at(heights, 0.5)).toBeLessThan(800);
		expect(at(heights, 0.9)).toBeGreaterThan(1500);
		expect(at(heights, 0.9)).toBeLessThan(3200);
		expect(at(ranges, 0.1)).toBeLessThan(80);
		expect(at(ranges, 0.9)).toBeGreaterThan(300);

		/* A globe asks for no hills: its heights the same but for them. */
		expect(Math.abs(planet.Elevation(spread(1)[0], 40) - planet.Elevation(spread(1)[0]))).toBeLessThan(1500);
	});

	/*
	 * Its rivers: the water of its land gathered down to the sea over its cells (Heights, Drainage), each river's bed never
	 * rising as it flows and at the sea at its mouth; a planet with them cut by their valleys; a location they go through has
	 * them as rivers of its sketch.
	 */
	it('gathers the water of its land into rivers down to the sea, cuts their valleys, and gives them to the locations they cross', function () {
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var size = 64;
		var heights = new Float32Array(6 * size * size);
		var face;
		var made;
		var plain;
		var cut;
		var river;
		var middle;

		for (face = 0; face < 6; face++)
			heights.set(planets.Heights(options, face, size, 0, size).Data, face * size * size);

		made = planets.Drainage(heights, size, 4);

		expect(made.Rivers.length).toBeGreaterThan(10);

		made.Rivers.forEach(function (one) {
			for (var k = 1; k < one.Level.length; k++)
				expect(one.Level[k]).toBeLessThanOrEqual(one.Level[k - 1]);
		});

		/* The biggest: to the sea at its mouth. */
		river = made.Rivers.slice().sort(function (a, b) {
			return b.Flow[b.Flow.length - 1] - a.Flow[a.Flow.length - 1];
		})[0];

		expect(river.Level[river.Level.length - 1]).toBe(0);

		planets.UseRivers('test-rivers', made.Rivers);

		plain = planets.Make(options);
		cut = planets.Make(Object.assign({}, options, {Rivers: 'test-rivers'}));
		middle = river.Points[Math.floor(river.Points.length / 2)];

		/* Where the land stands over the bed of a river, its valley takes it down. */
		var high = null;

		made.Rivers.forEach(function (one) {
			one.Points.forEach(function (point, k) {
				if (!high && plain.Elevation(point) > one.Level[k] + 30)
					high = point;
			});
		});

		expect(high).not.toBe(null);
		expect(cut.Elevation(high)).toBeLessThan(plain.Elevation(high) - 10);

		/* A location on it: a river of its sketch, along it. */
		var locations = Elemenx.Service('SceneLocations');
		var place = planets.LatLon(middle);
		var location = locations.Location(Object.assign({}, options, {LocationSize: 4, Rivers: 'test-rivers'}), locations.At(Object.assign({}, options, {LocationSize: 4}), place[0], place[1]));
		var made2 = Elemenx.Service('SceneWorld').Make(location.World).Ground;
		var streams = made2.Sketch.Layers.filter(function (layer) {
			return layer.ID === 'rivers';
		})[0];

		expect(streams.Items.length).toBeGreaterThan(0);
		expect(streams.Items[0].Type).toBe('river');
	}, 60000);

	/*
	 * Its settlements: where people would live on its land, a few cities, more towns, many villages, each apart from the
	 * others by its size; their lights at night a spot round each on the faces of its globe, none far from them.
	 */
	it('settles its land with cities, towns and villages apart from each other, and lights them at night', function () {
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var made = planets.Settlements(options, 6000);
		var kinds = {};
		var city;
		var lights;
		var face;
		var lit = 0;
		var k;

		made.Settlements.forEach(function (town) {
			kinds[town.Kind] = (kinds[town.Kind] || 0) + 1;

			expect(planets.Make(options).Land(town.Point)).toBe(true);
		});

		expect(kinds.city).toBeGreaterThan(0);
		expect(kinds.town).toBeGreaterThan(kinds.city);
		expect(kinds.village).toBeGreaterThan(kinds.town);

		/* Two cities never nearer than 400 km. */
		made.Settlements.filter(function (town) {
			return town.Kind === 'city';
		}).forEach(function (one, index, all) {
			all.slice(index + 1).forEach(function (other) {
				var d = one.Point[0] * other.Point[0] + one.Point[1] * other.Point[1] + one.Point[2] * other.Point[2];

				expect(Math.acos(Math.min(1, d)) * 6371).toBeGreaterThan(399);
			});
		});

		planets.UseSettlements('test-towns', made.Settlements);

		expect(planets.TownsOf('test-towns')).toBe(made.Settlements);

		/* Lit round a city: the face it is on has light, and the face's texel of the city the most of all near it. */
		city = made.Settlements.filter(function (town) {
			return town.Kind === 'city';
		})[0];
		face = [Math.abs(city.Point[0]), Math.abs(city.Point[1]), Math.abs(city.Point[2])];
		face = face[0] >= face[1] && face[0] >= face[2] ? (city.Point[0] > 0 ? 0 : 1) : face[1] >= face[2] ? (city.Point[1] > 0 ? 2 : 3) : city.Point[2] > 0 ? 4 : 5;
		lights = planets.Lights(Object.assign({}, options, {Settlements: 'test-towns'}), face, 128, 0, 128);

		for (k = 0; k < lights.Data.length; k++) {
			if (lights.Data[k] > 0)
				lit++;
		}

		expect(lights.Rows).toBe(128);
		expect(lit).toBeGreaterThan(0);
		expect(lit).toBeLessThan(lights.Data.length / 4);
		expect(planets.Lights(Object.assign({}, options, {Settlements: []}), face, 16, 0, 16).Data.every(function (value) {
			return value === 0;
		})).toBe(true);
	}, 60000);

	/*
	 * Its highways: its cities and towns joined along the ground (a highway between cities, a road to a town), each from one
	 * settlement to another; a planet with them shows them on its globe and tells the one near a point.
	 */
	it('joins its cities and towns by highways along the ground, shown on its globe', function () {
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var towns = planets.Settlements(options, 6000).Settlements;
		var made;
		var road;
		var middle;
		var planet;

		planets.UseSettlements('test-hw-towns', towns);

		made = planets.Highways(Object.assign({}, options, {Settlements: 'test-hw-towns'}), 20);

		expect(made.Highways.length).toBeGreaterThan(10);

		made.Highways.forEach(function (one) {
			expect(['highway', 'road']).toContain(one.Class);
			expect(one.Points[0]).toEqual(towns[one.From].Point.map(function (value) {
				return Math.round(value * 1e7) / 1e7;
			}));
			expect(['city', 'town']).toContain(towns[one.To].Kind);
		});

		/* Mostly over land: a bridge or a ferry only where it must. */
		var points = 0;
		var dry = 0;
		var plain = planets.Planet(options);

		made.Highways.forEach(function (one) {
			one.Points.forEach(function (point) {
				points++;

				if (plain.Elevation(point) > 0)
					dry++;
			});
		});

		expect(dry / points).toBeGreaterThan(0.9);

		/* Kept by a key; a planet with them knows the one near a point, its globe draws it. */
		planets.UseHighways('test-hw', made.Highways);

		expect(planets.HighwaysOf('test-hw')).toBe(made.Highways);

		road = made.Highways.filter(function (one) {
			return one.Points.length > 2;
		})[0];
		middle = road.Points[1];
		planet = planets.Planet(Object.assign({}, options, {Highways: 'test-hw'}));

		expect(planet.Highway(middle).Far).toBeLessThan(0.01);
		expect(plain.Highway(middle)).toBe(null);
	}, 120000);

	/*
	 * Its climate, what the weather of a scene is made of: a face of RGBA bytes, how wet (more at the equator than at 25
	 * degrees), how warm (more at the equator than near a pole), its ground (0 the sea, land 64 and up) and how much its
	 * wind climbs (somewhere on land, none on the sea).
	 */
	it('tells the climate of a face of its globe: wet, warm, its ground and its wind climbing a range', function () {
		var options = {Seed: 'terra', Ocean: 0.55, Radius: 6371};
		var size = 32;
		var faces = [0, 1, 2, 3, 4, 5].map(function (face) {
			return planets.ClimateFace(options, face, size, 0, size);
		});
		var planet = planets.Planet(options);
		var equator = {Wet: 0, Warm: 0, Count: 0};
		var tropic = {Wet: 0, Count: 0};
		var polar = {Warm: 0, Count: 0};
		var climbs = 0;

		expect(faces[0].Data.length).toBe(size * size * 4);
		expect(planets.ClimateFace(options, 2, size, 8, 4).Data.length).toBe(size * 4 * 4);

		faces.forEach(function (made, face) {
			for (var y = 0; y < size; y++) {
				for (var x = 0; x < size; x++) {
					var a = -1 + (x + 0.5) * 2 / size;
					var b = -1 + (y + 0.5) * 2 / size;
					var way = planets.Unit(face === 0 ? [1, -b, -a] : face === 1 ? [-1, -b, a] : face === 2 ? [a, 1, b] : face === 3 ? [a, -1, -b] : face === 4 ? [a, -b, 1] : [-a, -b, -1]);
					var at = (y * size + x) * 4;
					var latitude = Math.abs(Math.asin(way[1]) * 180 / Math.PI);
					var land = planet.Sample(way, Math.PI / 2 * 6371 / size).Land;

					expect(made.Data[at + 2] === 0).toBe(!land);

					if (!land)
						expect(made.Data[at + 3]).toBe(0);

					if (made.Data[at + 3] > 10)
						climbs++;

					if (latitude < 8) {
						equator.Wet += made.Data[at];
						equator.Warm += made.Data[at + 1];
						equator.Count++;
					}

					if (latitude > 22 && latitude < 28) {
						tropic.Wet += made.Data[at];
						tropic.Count++;
					}

					if (latitude > 70) {
						polar.Warm += made.Data[at + 1];
						polar.Count++;
					}
				}
			}
		});

		expect(equator.Wet / equator.Count).toBeGreaterThan(tropic.Wet / tropic.Count);
		expect(equator.Warm / equator.Count).toBeGreaterThan(polar.Warm / polar.Count + 40);
		expect(climbs).toBeGreaterThan(0);
	}, 120000);

	/*
	 * Regression: a highway or a river took half of each texel it crossed, however wide the texel: one of 10 km a band of
	 * grey or of water 10 km wide (from far, the water mirrored the sky, a blue smudge), narrower on each finer square,
	 * bands that came and went at the edges of squares of two sizes. Each takes as much of a texel as it covers: a large
	 * square of the mean of its four by four finer ones.
	 */
	it('paints a highway and a river as much of a texel as they cover: a large square of the mean of the finer ones', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var heights = new Float32Array(6 * 64 * 64);
		var face;

		for (face = 0; face < 6; face++)
			heights.set(planets.Heights(options, face, 64, 0, 64).Data, face * 64 * 64);

		planets.UseRivers('cover-rivers', planets.Drainage(heights, 64, 4).Rivers);
		planets.UseSettlements('cover-towns', planets.Settlements(options, 6000).Settlements);
		planets.UseHighways('cover-highways', planets.Highways(Object.assign({}, options, {Settlements: 'cover-towns'}), 20).Highways);

		var plain = terrain.Sphere({Planet: options});
		var roads = terrain.Sphere({Planet: Object.assign({}, options, {Highways: 'cover-highways'})});
		var rivers = terrain.Sphere({Planet: Object.assign({}, options, {Rivers: 'cover-rivers'})});

		/* Its face, u and v of a direction (as Face of SceneTerrainGenerator lays them). */
		function faceOf (p) {
			var x = p[0];
			var y = p[1];
			var z = p[2];
			var ax = Math.abs(x);
			var ay = Math.abs(y);
			var az = Math.abs(z);
			if (ax >= ay && ax >= az)
				return x > 0 ? [0, -z / x, -y / x] : [1, z / ax, y / x];

			if (ay >= az)
				return y > 0 ? [2, x / y, z / y] : [3, x / ay, z / y];

			return z > 0 ? [4, x / z, -y / z] : [5, x / z, y / z];
		}

		/* What a square differs by from the plain one, its mean over its texels: of the colors, and of the water (alpha). */
		function differs (sphere, at, extent, side) {
			var with1 = sphere.Picture(at[0], at[1], at[2], extent, side);
			var without = plain.Picture(at[0], at[1], at[2], extent, side);
			var color = 0;
			var water = 0;
			var i;

			for (i = 0; i < with1.Color.length; i += 4) {
				color += Math.abs(with1.Color[i] - without.Color[i]) + Math.abs(with1.Color[i + 1] - without.Color[i + 1]) + Math.abs(with1.Color[i + 2] - without.Color[i + 2]);
				water += Math.abs(with1.Color[i + 3] - without.Color[i + 3]);
			}

			return {Color: color / (with1.Color.length / 4), Water: water / (with1.Color.length / 4)};
		}

		/* A square of 200 km over a point (texels of 12.5 km), and the mean of its 16 finer squares (texels of 3 km). */
		function compared (sphere, point) {
			var at = faceOf(point);
			var extent = 200 / (Math.PI / 4 * 6371);
			var large = differs(sphere, at, extent, 17);
			var fine = {Color: 0, Water: 0};
			var a;
			var b;

			for (a = 0; a < 4; a++) {
				for (b = 0; b < 4; b++) {
					var one = differs(sphere, [at[0], at[1] - extent / 2 + (a + 0.5) * extent / 4, at[2] - extent / 2 + (b + 0.5) * extent / 4], extent / 4, 17);

					fine.Color += one.Color / 16;
					fine.Water += one.Water / 16;
				}
			}

			return {Large: large, Fine: fine};
		}

		/* A point of a highway between two towns, inland. */
		var highway = [].concat.apply([], planets.HighwaysOf('cover-highways').map(function (one) {
			return one.Points.slice(1, -1);
		})).filter(function (point) {
			return plain.Planet.Elevation(point) > 50;
		})[0];

		var river = planets.RiversOf('cover-rivers').slice().sort(function (a, b) {
			return b.Flow[b.Flow.length - 1] - a.Flow[a.Flow.length - 1];
		})[3];
		var road = compared(roads, highway);
		var stream = compared(rivers, river.Points[Math.floor(river.Points.length / 3)]);

		expect(road.Fine.Color).toBeGreaterThan(0);
		expect(road.Large.Color).toBeLessThan(road.Fine.Color * 1.8 + 0.2);
		expect(stream.Fine.Water).toBeGreaterThan(0);
		expect(stream.Large.Water).toBeLessThan(stream.Fine.Water * 1.8 + 0.2);
	}, 180000);

	/*
	 * Regression: near, a globe had the colors of the points of its squares alone (steps where biomes meet, blurred between,
	 * cracks between squares of two sizes). Each square now has a picture finer than its points, the same on an edge as the
	 * square beside, a soft coast, normals of its heights, and a skirt under its edges.
	 */
	it('paints a square of its globe finer than its points, seamless with the square beside, with a soft coast and the normals of its relief', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var field = terrain.Sphere({Planet: {Seed: 'picture', Ocean: 0.55}});
		var left = field.Picture(4, -0.1, 0, 0.2, 24);
		var right = field.Picture(4, 0.1, 0, 0.2, 24);
		var patch = field.Patch(4, -0.1, 0, 0.2, 8);
		var side = 9;
		var coast = null;
		var soft = 0;
		var row;
		var i;

		expect(left.Size).toBe(24);
		expect(left.Color.length).toBe(24 * 24 * 4);

		/* The last column of the left one is the first of the right one: the same directions. */
		for (row = 0; row < 24; row++) {
			for (i = 0; i < 4; i++)
				expect(Math.abs(left.Color[(row * 24 + 23) * 4 + i] - right.Color[(row * 24) * 4 + i])).toBeLessThan(2);
		}

		/* Its normals of unit length, and up over the sea. */
		for (i = 0; i < left.Normal.length; i += 4) {
			var n = [left.Normal[i] / 127.5 - 1, left.Normal[i + 1] / 127.5 - 1, left.Normal[i + 2] / 127.5 - 1];

			expect(Math.abs(Math.hypot(n[0], n[1], n[2]) - 1)).toBeLessThan(0.03);
		}

		/* A coast found on some square of a face: between land and sea, texels partly water. */
		[[0, 0], [2, 0.3], [4, 0.5], [1, -0.4], [5, 0.2], [3, -0.6]].some(function (one) {
			var picture = field.Picture(one[0], one[1], 0, 0.3, 32);
			var waters = [];

			for (i = 3; i < picture.Color.length; i += 4)
				waters.push(picture.Color[i]);

			if (waters.indexOf(0) >= 0 && waters.indexOf(255) >= 0) {
				coast = picture;
				soft = waters.filter(function (value) {
					return value > 0 && value < 255;
				}).length;
			}

			return coast;
		});

		expect(coast).not.toBe(null);
		expect(soft).toBeGreaterThan(0);

		/* Where each point is on its square, and a skirt under each edge point, lower. */
		expect(patch.Geometry.Positions.length / 3).toBe(side * side + 4 * 8);
		expect(patch.Geometry.Materials.length).toBe(patch.Geometry.Positions.length / 3 * 8);
		expect(patch.Geometry.Materials.slice(0, 2)).toEqual([0, 0]);
		expect(patch.Geometry.Materials.slice((side * side - 1) * 8, (side * side - 1) * 8 + 2)).toEqual([1, 1]);

		[0, 4, 8].forEach(function (column) {
			var top = [patch.Geometry.Positions[column * 3] + patch.Center[0], patch.Geometry.Positions[column * 3 + 1] + patch.Center[1], patch.Geometry.Positions[column * 3 + 2] + patch.Center[2]];
			var skirt = [patch.Geometry.Positions[(side * side + column) * 3] + patch.Center[0], patch.Geometry.Positions[(side * side + column) * 3 + 1] + patch.Center[1], patch.Geometry.Positions[(side * side + column) * 3 + 2] + patch.Center[2]];

			expect(Math.hypot(skirt[0], skirt[1], skirt[2])).toBeLessThan(Math.hypot(top[0], top[1], top[2]) - 0.04);
		});

		/* Regression: the picture alone, asked of a worker, was of a field of the wrong shape (a flat one): none came. */
		var piece = await new Promise(function (done, failed) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['SpherePicture', field.Options, null, [4, 0.1, 0, 0.2, 24]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(Array.from(piece.Picture.Color)).toEqual(Array.from(right.Color));
	}, 120000);

	/*
	 * Its woods: in the alpha of Normal, the share trees cover by the rules its biome sows them by. Regression: of the slope
	 * of its own texels, a square differed from the finer one beside, a straight edge across woods and rock.
	 */
	it('tells in its picture how much trees cover, by its biome, the same in a square and in a finer one there', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var field = terrain.Sphere({Planet: {Seed: 'woods', Ocean: 0.4, BiomeList: terrain.Biomes({Biomes: ['temperate', 'taiga', 'desert', 'tundra']})}});
		var planet = field.Planet;
		var found = 0;
		var same = 0;
		var wooded = 0;
		var squares = [];
		var face;
		var u;
		var v;

		expect(planet.Lands[0].Scatter.length).toBeGreaterThan(0);

		/* Squares of its mountains, where the slope tells, and of its lowlands. */
		for (face = 0; face < 6; face++) {
			for (u = -0.6; u <= 0.61; u += 0.3) {
				for (v = -0.6; v <= 0.61; v += 0.3) {
					var height = planet.Elevation(terrain.Face(face, u + 0.002, v));
					if (height > 1200 && squares.length < 6 || height > 50 && height < 400 && squares.length < 10)
						squares.push([face, u, v]);
				}
			}
		}

		squares.forEach(function (square) {
			/* A square, and a finer one of half of it (texels half as far apart): texel 2j of the finer is texel j + 8 of the other, in their middle rows. */
			var coarse = field.Picture(square[0], square[1], square[2], 0.004, 17);
			var fine = field.Picture(square[0], square[1] + 0.001, square[2], 0.002, 17);
			var j;

			for (j = 0; j < 9; j++) {
				var a = (8 * 17 + j + 8) * 4;
				var b = (8 * 17 + j * 2) * 4;
				if (coarse.Color[a + 3] !== 0 || fine.Color[b + 3] !== 0) continue;

				found++;

				if ([0, 1, 2, 3].every(function (k) {
					return Math.abs(coarse.Normal[a + 3] - fine.Normal[b + 3]) <= 1 && (k === 3 || Math.abs(coarse.Color[a + k] - fine.Color[b + k]) <= 2);
				}))
					same++;

				if (fine.Normal[b + 3] > 40)
					wooded++;
			}

			/* No woods on the sea. */
			for (j = 3; j < coarse.Color.length; j += 4) {
				if (coarse.Color[j] === 255)
					expect(coarse.Normal[j]).toBe(0);
			}
		});

		expect(found).toBeGreaterThan(20);
		expect(same).toBe(found);
		expect(wooded).toBeGreaterThan(0);
	}, 120000);

	/*
	 * Where people live: a settlement is its houses in its middle (roofs and streets, no woods), its fields round it (parcels
	 * of crops apart, finer than its texels), the land far from it as it was.
	 */
	it('paints the houses of a settlement in its middle and its fields round it, the land far from it as it was', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var options = {Seed: 'fields', Ocean: 0.45, BiomeList: terrain.Biomes({Biomes: ['temperate', 'grassland', 'desert', 'tundra']})};
		var plain = terrain.Sphere({Planet: options});
		var place = null;
		var face;
		var u;
		var v;

		/* A low, flat, mild and wet enough land. */
		for (face = 0; face < 6 && !place; face++) {
			for (u = -0.5; u <= 0.5 && !place; u += 0.05) {
				for (v = -0.5; v <= 0.5 && !place; v += 0.05) {
					var direction = terrain.Face(face, u, v);
					var sample = plain.Planet.Sample(direction);
					var beside = plain.Planet.Elevation(terrain.Face(face, u + 0.0006, v));
					if (sample.Land && sample.Elevation > 30 && sample.Elevation < 400 && Math.abs(beside - sample.Elevation) < 25 && sample.Moisture > 0.4 && sample.Celsius > 8 && sample.Celsius < 24)
						place = [face, u, v, Elemenx.Service('ScenePlanet').Unit(direction)];
				}
			}
		}

		expect(place).not.toBe(null);

		var dwelt = terrain.Sphere({Planet: Object.assign({}, options, {Settlements: [{Point: place[3], Size: 0.5, Kind: 'city'}]})});
		var km = Math.PI / 4 * 6371;
		var middle = (16 * 33 + 16) * 4;
		var town = dwelt.Picture(place[0], place[1], place[2], 1.2 / km, 33);
		var bare = plain.Picture(place[0], place[1], place[2], 1.2 / km, 33);
		var fields = dwelt.Picture(place[0], place[1] + 7 / km, place[2], 3 / km, 33);
		var wild = plain.Picture(place[0], place[1] + 7 / km, place[2], 3 / km, 33);
		var far = dwelt.Picture(place[0], place[1] + 80 / km, place[2], 3 / km, 33);
		var away = plain.Picture(place[0], place[1] + 80 / km, place[2], 3 / km, 33);
		var farmed = 0;
		var i;

		/* Its middle: houses of a city, the mean of their roofs, no trees. */
		expect(town.Use.length).toBe(33 * 33 * 4);
		expect(town.Use[middle + 1]).toBeGreaterThan(240);
		expect(town.Use[middle]).toBe(0);
		expect(town.Use[middle + 2]).toBe(255);
		expect(Math.abs(town.Color[middle] - bare.Color[middle]) + Math.abs(town.Color[middle + 1] - bare.Color[middle + 1])).toBeGreaterThan(10);
		expect(town.Normal[middle + 3]).toBe(0);

		/* Its fields: the most of the square fields, of their mean, fewer trees. */
		for (i = 0; i < fields.Use.length; i += 4) {
			if (fields.Use[i] > 128 && fields.Use[i + 1] === 0) {
				farmed++;

				expect(fields.Normal[i + 3]).toBeLessThanOrEqual(wild.Normal[i + 3]);
			}
		}

		expect(farmed).toBeGreaterThan(33 * 33 * 0.6);
		expect(fields.Color[middle] === wild.Color[middle] && fields.Color[middle + 1] === wild.Color[middle + 1]).toBe(false);

		/* Far from it, the land as it was, nothing of people. */
		expect(Array.from(far.Color)).toEqual(Array.from(away.Color));
		expect(Array.from(far.Normal)).toEqual(Array.from(away.Normal));
		expect(far.Use.every(function (value, index) {
			return index % 4 > 1 || value === 0;
		})).toBe(true);
	}, 120000);
});
