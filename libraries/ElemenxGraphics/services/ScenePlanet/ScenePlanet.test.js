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

	/* What its settlements and its lands are of: the numbers of resources/terrain/settlement-kinds, the warmth of a temperature. */
	it('gives the numbers of a kind of settlement, the kind of a place by its share, and the warmth of a temperature', function () {
		var kinds = Elemenx.Service('SceneTerrainGenerator').SettlementKinds;
		var city = kinds.city.Planet.Share;

		expect(planets.Kind('town')).toEqual(kinds.town.Planet);
		expect(planets.Kind('none')).toEqual(kinds.village.Planet);
		expect(planets.KindByShare(city / 2)).toBe('city');
		expect(planets.KindByShare(city + kinds.town.Planet.Share / 2)).toBe('town');
		expect(planets.KindByShare(0.999)).toBe('village');
		expect(planets.Warmth(-25)).toBe(0);
		expect(planets.Warmth(5)).toBeCloseTo(0.5, 12);
		expect(planets.Warmth(60)).toBe(1);
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

	/*
	 * Regression: from orbit its ranges were flat, lit by the sphere alone. A face gives how its ground leans as well
	 * (Relief): none over the sea, down the slope on its land, more in its ranges; the same in a worker.
	 */
	it('gives how the ground of a face leans: level over the sea, down its slopes on land, the same in a worker', async function () {
		var options = {Seed: 'terra', Ocean: 0.55, Radius: 6371};
		var planet = planets.Planet(options);
		/* As a scene paints its globe: 256 texels a side. */
		var size = 256;
		var most = 0;
		var downhill = 0;
		var checked = 0;
		var face;

		for (face = 0; face < 6; face++) {
			var made = planets.Face(options, face, size, 120, 16);
			var k;

			expect(made.Relief.length).toBe(size * 16 * 4);

			for (k = 0; k < size * 16; k += 7) {
				var x = k % size;
				var y = 120 + Math.floor(k / size);
				var a = -1 + (x + 0.5) * 2 / size;
				var b = -1 + (y + 0.5) * 2 / size;
				var way = face === 0 ? [1, -b, -a] : face === 1 ? [-1, -b, a] : face === 2 ? [a, 1, b] : face === 3 ? [a, -1, -b] : face === 4 ? [a, -b, 1] : [-a, -b, -1];
				var length = Math.hypot(way[0], way[1], way[2]);
				var p = [way[0] / length, way[1] / length, way[2] / length];
				var lean = [0, 1, 2].map(function (i) {
					return (made.Relief[k * 4 + i] / 255 - 0.5) / 2.5;
				});
				var tilt = Math.hypot(lean[0], lean[1], lean[2]);
				var sample = planet.Sample(p, Math.PI / 2 * 6371 / size);

				if (!sample.Land) {
					expect(tilt).toBeLessThan(0.01);

					continue;
				}

				most = Math.max(most, tilt);

				/* Down the slope: a step along the lean lower than a step against it. */
				if (tilt > 0.02) {
					var step = 20 / 6371;
					var ahead = planet.Elevation([p[0] + lean[0] / tilt * step, p[1] + lean[1] / tilt * step, p[2] + lean[2] / tilt * step], 40);
					var back = planet.Elevation([p[0] - lean[0] / tilt * step, p[1] - lean[1] / tilt * step, p[2] - lean[2] / tilt * step], 40);

					checked++;

					if (ahead < back)
						downhill++;
				}
			}
		}

		var there = await new Promise(function (done, failed) {
			planets.Work().Run('ScenePlanet', 'Face', [options, 2, size, 120, 4], function (error, made) {
				if (error) failed(error);
				else done(made);
			});
		});

		expect(Array.from(there.Relief)).toEqual(Array.from(planets.Face(options, 2, size, 120, 4).Relief));
		expect(most).toBeGreaterThan(0.05);
		expect(checked).toBeGreaterThan(5);
		expect(downhill / checked).toBeGreaterThan(0.75);
	}, 120000);

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
	 * Regression: its rivers ran in straight lines between their points on the planet (a valley cut straight, a long wall
	 * across the land), bent only in a location by where its run began (two locations beside each other bent it otherwise),
	 * a tributary ending beside its river. Now each bends by the kilometres from its source, the same in every view of it;
	 * a tributary ends on the way of the river it joins, their bends none there.
	 */
	it('bends its rivers by the kilometres from their sources, the same everywhere, a tributary ending on its river', function () {
		var options = {Seed: 'terra', Ocean: 0.62, Radius: 6371};
		var size = 64;
		var heights = new Float32Array(6 * size * size);
		var face;
		var planet;
		var courses;
		var most = 0;
		var on = 0;
		var tributaries = 0;
		var index;

		for (face = 0; face < 6; face++)
			heights.set(planets.Heights(options, face, size, 0, size).Data, face * size * size);

		planets.UseRivers('bent-rivers', planets.Drainage(heights, size, 4).Rivers);

		planet = planets.Make(Object.assign({}, options, {Rivers: 'bent-rivers'}));
		courses = planet.Courses();

		courses.forEach(function (course, number) {
			var k;
			var t;

			for (k = 0; k + 1 < course.Points.length; k += 3) {
				for (t = 0.1; t < 1; t += 0.2) {
					var a = course.Points[k];
					var b = course.Points[k + 1];
					var chord = planets.Unit([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
					var bent = planet.RiverAt(number, k, t);

					/* Aside of its chord, as far as twice its width at most. */
					most = Math.max(most, Math.acos(Math.min(1, planets.Dot(chord, bent.Direction))) * 6371);

					expect(Math.acos(Math.min(1, planets.Dot(chord, bent.Direction))) * 6371).toBeLessThan(2 * 0.015 * Math.sqrt(bent.Flow) + 1e-6);

					/* Its nearest river there is itself, on its way. */
					if (planet.River(bent.Direction).Far < 0.005)
						on++;
				}
			}
		});

		expect(most).toBeGreaterThan(0.05);
		expect(on).toBeGreaterThan(50);

		/* A tributary: its last point on the way of another river (its bends none there). */
		for (index = 0; index < courses.length; index++) {
			var last = courses[index].Points[courses[index].Points.length - 1];

			if (courses[index].Level[courses[index].Level.length - 1] > 0) {
				tributaries++;

				expect(planet.River(last).Far).toBeLessThan(0.01);
			}
		}

		expect(tributaries).toBeGreaterThan(3);

		/* Two locations beside each other on its biggest river: their rivers on its very way, as its globe has it. */
		var locations = Elemenx.Service('SceneLocations');
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var biggest = courses.map(function (course, number) {
			return number;
		}).sort(function (a, b) {
			return courses[b].Flow[courses[b].Flow.length - 1] - courses[a].Flow[courses[a].Flow.length - 1];
		})[0];
		var middle = Math.floor(courses[biggest].Points.length / 2);
		var checked = 0;

		[0.3, 0.7].forEach(function (t) {
			var place = planets.LatLon(planet.RiverAt(biggest, middle, t).Direction);
			var given = Object.assign({}, options, {Rivers: 'bent-rivers'});
			var grid = locations.Grid(Object.assign({}, options, {LocationSize: 3}));
			var at = planets.CellPlace(grid.Radius, locations.Cell(locations.At(Object.assign({}, options, {LocationSize: 3}), place[0], place[1])));
			var sketch = locations.Streams(given, at);
			var site = terrain.Site({Options: given, Latitude: at.Latitude, Longitude: at.Longitude, Turn: at.Turn});

			sketch.Layers[0].Items.forEach(function (item) {
				item.Points.forEach(function (point) {
					checked++;

					expect(planet.River(site.Direction(point[0], point[1])).Far).toBeLessThan(0.02);
				});
			});
		});

		expect(checked).toBeGreaterThan(20);
	}, 60000);

	/*
	 * A great river to the sea over low land ends in a delta: its arms out of its way some tens of kilometres before its
	 * mouth, fanned out to the sea on either side of it, each a river of its own; a small one none.
	 */
	it('ends a great river over low land in a delta of arms fanned out to the sea, a small one in none', function () {
		var line = [];
		var bare = planets.Make({Seed: 'delta', Radius: 6371});
		var coast = null;
		var k;

		/* A coast on its equator: land, then the sea a degree on. */
		for (k = 0; k < 3600 && coast === null; k++) {
			if (bare.Elevation(planets.Direction(0, k * 0.1)) > 20 && bare.Elevation(planets.Direction(0, k * 0.1 + 1)) < -50)
				coast = k * 0.1;
		}

		expect(coast).not.toBe(null);

		for (k = 0; k <= 20; k++)
			line.push(planets.Direction(0, coast + k * 0.05));

		planets.UseRivers('delta-rivers', [{Points: line, Flow: line.map(function () { return 800; }), Level: line.map(function (point, index) { return Math.round(50 * (1 - index / 20)); })}]);
		planets.UseRivers('small-rivers', [{Points: line, Flow: line.map(function () { return 100; }), Level: line.map(function (point, index) { return Math.round(50 * (1 - index / 20)); })}]);

		var planet = planets.Make({Seed: 'delta', Radius: 6371, Rivers: 'delta-rivers'});
		var courses = planet.Courses();
		var arms = courses.slice(1);
		var ends = arms.map(function (arm) {
			return arm.Points[arm.Points.length - 1];
		});

		expect(arms.length).toBe(4);
		expect(planets.Make({Seed: 'delta', Radius: 6371, Rivers: 'small-rivers'}).Courses().length).toBe(1);

		arms.forEach(function (arm) {
			/* Out of the way of its river, tens of kilometres before its mouth; to the sea. */
			var start = arm.Points[0];
			var mouth = line[line.length - 1];

			expect(planet.River(start).Far).toBeLessThan(0.05);
			expect(Math.acos(Math.min(1, planets.Dot(start, mouth))) * 6371).toBeGreaterThan(15);
			expect(arm.Level[arm.Level.length - 1]).toBe(0);
		});

		/* Fanned out: its outer arms apart by over ten kilometres where they come to the sea. */
		expect(Math.acos(Math.min(1, planets.Dot(ends[0], ends[ends.length - 1]))) * 6371).toBeGreaterThan(10);
	});

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
	 * How mountainous it is (Mountains, 0 to 1): the more, the more of its land high in ranges; as the Earth (0.5) its peaks
	 * reach over 6.5 km. Regression: crests under 5 km, broad swells, no peak.
	 */
	/*
	 * Regression: its land and its relief were written out in code; they are the graphs blueprints/planet/land and relief
	 * now, and a planet may have graphs of its own (LandGraph, ReliefGraph), made code in the page for its workers (Ruled).
	 */
	it('makes its land and its relief by the graphs of the library, or by a LandGraph and a ReliefGraph of its own, the same in a worker', async function () {
		var land = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/land')));
		var relief = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/relief')));
		var points = spread(300);
		var library = planets.Make({Seed: 'graphs'});
		var drowned;
		var raised;
		var options;
		var page;
		var there;

		expect(planets.ReliefRun('land').Inputs).toContain('Level');
		expect(planets.ReliefRun('relief').Inputs).toContain('Small');

		/* A land of its own: all of it over the sea. */
		land.blocks.filter(function (one) {
			return one.type === 'Formula' && one.properties[0].value.indexOf('WSea') !== -1;
		})[0].properties[0].value = '1 + WSea * 0';
		raised = planets.Make({Seed: 'graphs', LandGraph: land});

		/* A sea floor of its own: 5 km down everywhere. */
		relief.blocks.filter(function (one) {
			return one.type === 'Formula' && one.properties[0].value.indexOf('min(-1, -(120') === 0;
		})[0].properties[0].value = 'min(-1, -5000 + Push * 0 + Depth * 0 + Land * 0 + Oceanic * 0 + Boundary * 0)';
		drowned = planets.Make({Seed: 'graphs', ReliefGraph: relief});

		expect(points.filter(function (p) {
			return library.Elevation(p) < 0;
		}).length).toBeGreaterThan(100);
		expect(points.every(function (p) {
			return raised.Elevation(p) > 0;
		})).toBe(true);
		expect(points.every(function (p) {
			return library.Elevation(p) > 0 ? drowned.Elevation(p) === library.Elevation(p) : drowned.Elevation(p) === -5000;
		})).toBe(true);

		/* In a worker, of the code made here. */
		options = planets.Ruled({Seed: 'graphs', ReliefGraph: relief});

		expect(options.ReliefSources.Relief.Source).toBeTruthy();

		page = planets.Heights(options, 2, 32, 0, 8);
		there = await new Promise(function (done, failed) {
			planets.Work().Run('ScenePlanet', 'Heights', [options, 2, 32, 0, 8], function (error, made) {
				if (error) failed(error);
				else done(made);
			});
		});

		expect(Array.from(there.Data)).toEqual(Array.from(page.Data));
		expect(Array.from(page.Data)).toContain(-5000);
	}, 60000);

	it('gives a ground of a place of it its graphs of its own (Site): their code made in the page, the same squares in a worker', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var relief = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/relief')));
		var options;
		var here;
		var there;

		relief.blocks.filter(function (one) {
			return one.type === 'Formula' && one.properties[0].value.indexOf('min(-1, -(120') === 0;
		})[0].properties[0].value = 'min(-1, -5000 + Push * 0 + Depth * 0 + Land * 0 + Oceanic * 0 + Boundary * 0)';
		options = {Size: 2000, Height: 60, Water: 0, Seed: 'site', Compute: 'js', Planet: {Options: {Seed: 'graphs', Ocean: 0.97, ReliefGraph: relief}, Latitude: 0, Longitude: 0}};

		expect(planets.GraphSources({Seed: 'x'})).toBe(undefined);
		expect(Object.keys(planets.GraphSources({ReliefGraph: relief, WindGraph: Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/wind')}))).toEqual(['Relief', 'Wind']);

		here = terrain.Flat(options).Chunk(0, 0, 400, 8);

		expect(options.Planet.Options.ReliefSources.Relief.Source).toBeTruthy();

		there = await new Promise(function (done, failed) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', options, null, [0, 0, 400, 8]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(Array.from(there.Positions)).toEqual(Array.from(new Float32Array(here.Positions)));
	}, 60000);

	/*
	 * Its climate and winds of its air (Envelope of its body: Scene puts its numbers in its options): Cells of its winds,
	 * Warm, Contrast, Lapse; none, or the Earth's, as before. A planet warmer by 30 degrees is 30 degrees warmer; one of a
	 * thick air differs less from place to place; one that turns fast has its winds in more belts.
	 */
	it('makes its climate and its winds of the numbers of its air, the Earth\'s as before', function () {
		var plain = planets.Make({Seed: 'air'});
		var earth = planets.Make({Seed: 'air', Cells: 3, Warm: 0, Contrast: 1, Lapse: 6.5});
		var warm = planets.Make({Seed: 'air', Warm: 30});
		var thick = planets.Make({Seed: 'air', Contrast: 0.1});
		var fast = planets.Make({Seed: 'air', Cells: 9});
		var spreadOf = function (planet) {
			var low = Infinity;
			var high = -Infinity;

			[0, 20, 40, 60, 80].forEach(function (latitude) {
				var sample = planet.Sample(planets.Direction(latitude, 37));
				var celsius = sample.Celsius + Math.max(0, sample.Elevation) * 0.0065;

				low = Math.min(low, celsius);
				high = Math.max(high, celsius);
			});

			return high - low;
		};
		var winds = 0;

		[[10, 20], [35, -40], [52, 100], [-68, 7], [5, 160]].forEach(function (place) {
			var p = planets.Direction(place[0], place[1]);
			var a = plain.Sample(p);
			var b = earth.Sample(p);

			expect(b.Celsius).toBeCloseTo(a.Celsius, 9);
			expect(b.Moisture).toBeCloseTo(a.Moisture, 9);
			expect(b.Wind[0]).toBeCloseTo(a.Wind[0], 9);
			expect(warm.Sample(p).Celsius - a.Celsius).toBeCloseTo(30, 6);

			if (Math.abs(fast.Sample(p).Wind[0] - a.Wind[0]) > 1)
				winds++;
		});

		expect(spreadOf(thick)).toBeLessThan(spreadOf(plain) * 0.3);
		expect(winds).toBeGreaterThan(0);
	});

	it('makes its winds and its climate by the graphs of the library, or by a WindGraph, a RoughGraph and a ClimateGraph of its own, the same in a worker', async function () {
		var wind = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/wind')));
		var rough = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/rough')));
		var climate = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/climate')));
		var points = spread(300);
		var library = planets.Make({Seed: 'graphs'});
		var blown;
		var dry;
		var hot;
		var options;
		var page;
		var there;

		function formula (graph, start, expression) {
			graph.blocks.filter(function (one) {
				return one.type === 'Formula' && one.properties[0].value.indexOf(start) !== -1;
			})[0].properties[0].value = expression;
		}

		expect(planets.ReliefRun('wind').Keys).toEqual(['East', 'North']);
		expect(planets.ReliefRun('climate').Keys).toEqual(['Celsius', 'Moisture']);
		expect(planets.ReliefRun('climate').Inputs).toContain('Upwind');
		expect(planets.ReliefRun('rough').Keys).toEqual(['Rough']);

		/* A wind of its own: 5 m/s to the east everywhere. */
		formula(wind, '? -0.6 :', '5 + Band * 0 + N * 0');

		blown = planets.Make({Seed: 'graphs', WindGraph: wind});

		/* Land wherever the wind comes from: drier than of the library somewhere. */
		formula(rough, '(N - 0.5) * 2.2', '1 + N * 0 + Oceanic * 0 + Level * 0 + WLand * 0 + WSea * 0');

		dry = planets.Make({Seed: 'graphs', RoughGraph: rough});

		/* A climate of its own: 40 degrees everywhere. */
		formula(climate, 'Warm + 15', '40 + Latitude * 0 + Height * 0 + N * 0 + PaintTemperature * 0');

		hot = planets.Make({Seed: 'graphs', ClimateGraph: climate});

		expect(points.some(function (p) {
			return Math.abs(library.Sample(p).Wind[0] - 5) > 1;
		})).toBe(true);
		expect(points.every(function (p) {
			return blown.Sample(p).Wind[0] === 5;
		})).toBe(true);
		expect(points.every(function (p) {
			return dry.Sample(p).Moisture <= library.Sample(p).Moisture;
		})).toBe(true);
		expect(points.some(function (p) {
			return dry.Sample(p).Moisture < library.Sample(p).Moisture - 0.1;
		})).toBe(true);
		expect(points.every(function (p) {
			return hot.Sample(p).Celsius === 40 && hot.Sample(p).Moisture === library.Sample(p).Moisture;
		})).toBe(true);

		/* In a worker, of the code made here. */
		options = planets.Ruled({Seed: 'graphs', ClimateGraph: climate});

		expect(options.ReliefSources.Climate.Source).toBeTruthy();
		expect(options.ReliefSources.Wind).toBe(undefined);

		page = planets.ClimateFace(options, 2, 16, 0, 4);
		there = await new Promise(function (done, failed) {
			planets.Work().Run('ScenePlanet', 'ClimateFace', [options, 2, 16, 0, 4], function (error, made) {
				if (error) failed(error);
				else done(made);
			});
		});

		expect(Array.from(there.Data)).toEqual(Array.from(page.Data));
		expect(page.Data[1]).toBe(Math.round(Math.max(0, Math.min(1, planets.Warmth(40))) * 255));
	}, 60000);

	it('raises more ranges the more mountainous it is, and peaks of many kilometres', function () {
		var points = spread(6000);

		function high (mountains) {
			var planet = planets.Planet({Seed: 'terra', Ocean: 0.55, Radius: 6371, Mountains: mountains});
			var count = 0;
			var most = 0;

			points.forEach(function (p) {
				var height = planet.Elevation(p, 20);

				most = Math.max(most, height);

				if (height > 2500)
					count++;
			});

			return {Count: count, Most: most};
		}

		var flat = high(0);
		var earth = high(0.5);
		var rugged = high(1);

		expect(flat.Count).toBeLessThan(earth.Count);
		expect(earth.Count).toBeLessThan(rugged.Count);
		expect(earth.Most).toBeGreaterThan(6500);
	}, 120000);

	/*
	 * How steep its ground is (Slope, rise over run of 300 m): what the picture of a square paints rock by, of its plate,
	 * land and erosion of the point itself, the same as two whole heights east and north tell. Regression: those two whole
	 * heights a texel were half the time of a picture (some 650 ms), half of a view from 300 km coarse for most of a minute.
	 */
	it('tells how steep its ground is as its heights 300 m apart do, none over the sea, the point sampled before kept', function () {
		var planet = planets.Planet({Seed: 'terra', Ocean: 0.55, Radius: 6371});
		var steep = [];
		var seas = 0;

		spread(4000).forEach(function (p) {
			var sample = planet.Sample(p);
			var slope = planet.Slope(p, 0.3);
			var length = Math.hypot(p[0], p[1], p[2]);
			var q = [p[0] / length, p[1] / length, p[2] / length];
			var east = Math.abs(q[1]) > 0.9999 ? [0, 0, -1] : [q[2], 0, -q[0]];
			var e = Math.hypot(east[0], east[1], east[2]);
			var north;
			var far = 0.3 / 6371;
			var honest;

			east = [east[0] / e, east[1] / e, east[2] / e];
			north = [q[1] * east[2] - q[2] * east[1], q[2] * east[0] - q[0] * east[2], q[0] * east[1] - q[1] * east[0]];

			if (!sample.Land) {
				expect(slope).toBe(0);

				seas++;

				return;
			}

			honest = Math.hypot(planet.Elevation([q[0] + east[0] * far, q[1] + east[1] * far, q[2] + east[2] * far]) - sample.Elevation, planet.Elevation([q[0] + north[0] * far, q[1] + north[1] * far, q[2] + north[2] * far]) - sample.Elevation) / 300;

			/*
			 * The same steepness to a little: what was kept of the point (its plate, its land) is the same 300 m away but for
			 * the rise of a range along the border of its plate (some 15 m a km), far under where rock shows (0.15).
			 */
			expect(Math.abs(slope - honest)).toBeLessThan(0.03 + honest * 0.05);

			/* Of the point asked anew, not the one sampled before: the same. */
			expect(planet.Slope(p, 0.3)).toBeCloseTo(slope, 9);

			steep.push(slope);
		});

		expect(seas).toBeGreaterThan(100);
		expect(Math.max.apply(Math, steep)).toBeGreaterThan(0.3);
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
	 * Regression: a basin of its land (its ground no lower than 1 m) had water round its rim, where it is steep, by the rule
	 * of a coast, and none in it: rings of water over the wet tropics and the deserts. The sea by the coast only now; a basin
	 * (its floor 1 m, its rim to 6) a marsh where it is wet, a salt flat where it is dry; deserts of sand seas (their sand
	 * for the dunes of the shader).
	 */
	it('has no water on its land away from the sea but in its wet basins, and sand seas in its hot deserts only', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var field = terrain.Sphere({Planet: {Seed: 'terra', Ocean: 0.55, Radius: 6371}});
		var planet = field.Planet;
		var n = 16;
		var stray = 0;
		var basins = 0;
		var lakes = 0;
		var sand = 0;
		var cold = 0;
		var woody = 0;
		var bare = 0;
		var face;
		var a;
		var b;

		function point (face, u, v) {
			var d = terrain.Face(face, u, v);
			var length = Math.hypot(d[0], d[1], d[2]);

			return [d[0] / length, d[1] / length, d[2] / length];
		}

		for (face = 0; face < 6; face++) {
			for (a = 0; a < 3; a++) {
				for (b = 0; b < 3; b++) {
					var cu = -2 / 3 + a * 2 / 3;
					var cv = -2 / 3 + b * 2 / 3;
					var extent = 2 / 3;
					var step = extent / (n - 1);
					var picture = field.Picture(face, cu, cv, extent, n);
					var i;
					var k;

					for (k = 1; k < n - 1; k++) {
						for (i = 1; i < n - 1; i++) {
							var o = (k * n + i) * 4;
							var u = cu - extent / 2 + i * step;
							var v = cv - extent / 2 + k * step;
							var sample = planet.Sample(point(face, u, v));
							var near = [[step, 0], [-step, 0], [0, step], [0, -step]].map(function (by) {
								return planet.Elevation(point(face, u + by[0], v + by[1]));
							});
							var inland = sample.Land && near.every(function (height) {
								return height > 0;
							});
							if (inland && sample.Elevation > 6 && picture.Color[o + 3] > 8)
								stray++;

							if (inland && sample.Elevation <= 1.001) {
								basins++;

								if (picture.Color[o + 3] > 128)
									lakes++;
							}

							/*
							 * Regression: the slopes of the wet tropics grey with rock from 0.15 as everywhere (hills of forest
							 * bare): there woods hold to a slope of 0.6 and more, bare rock only on cliffs.
							 */
							if (inland && sample.Moisture > 0.75 && sample.Celsius > 17 && sample.Celsius < 30) {
								var slope = planet.Slope(point(face, u, v), 0.3);

								if (slope > 0.3 && slope < 0.6) {
									woody++;

									/* Green: more green than red or blue by a twentieth; rock grey has as much of each. */
									if (picture.Color[o + 1] - Math.max(picture.Color[o], picture.Color[o + 2]) < 13)
										bare++;
								}
							}

							if (picture.Use[o + 3] > 0) {
								sand++;

								if (sample.Celsius < 4)
									cold++;
							}
						}
					}
				}
			}
		}

		expect(stray).toBe(0);
		expect(basins).toBeGreaterThan(0);
		expect(woody).toBeGreaterThan(2);
		expect(bare / woody).toBeLessThan(0.1);
		expect(lakes).toBeLessThan(basins);
		expect(sand).toBeGreaterThan(0);
		expect(cold).toBe(0);
	}, 120000);

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

		/* Where each point is on its square (12 a point: then where a point of its edge goes beside coarser squares), and a skirt under each edge point, lower. */
		expect(patch.Geometry.Positions.length / 3).toBe(side * side + 4 * 8);
		expect(patch.Geometry.Materials.length).toBe(patch.Geometry.Positions.length / 3 * 12);
		expect(patch.Geometry.Materials.slice(0, 2)).toEqual([0, 0]);
		expect(patch.Geometry.Materials.slice((side * side - 1) * 12, (side * side - 1) * 12 + 2)).toEqual([1, 1]);

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
	 * Its snow for its ground near: how much of each texel snow lies on (Snow), where it is cold and not steep; none where it
	 * is warm nor on the sea. The ground near draws the snow of its biome there, not its grass under a white picture.
	 */
	it('tells in its picture how much of each texel snow lies on: where it is cold, none where it is warm', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var field = terrain.Sphere({Planet: {Seed: 'snowy', Ocean: 0.4, BiomeList: terrain.Biomes({Biomes: ['temperate', 'taiga', 'tundra', 'desert']})}});
		var planet = field.Planet;
		var cold = null;
		var warm = null;
		var face;
		var u;
		var v;

		for (face = 0; face < 6; face++) {
			for (u = -0.8; u <= 0.81; u += 0.1) {
				for (v = -0.8; v <= 0.81; v += 0.1) {
					var sample = planet.Sample(terrain.Face(face, u, v));
					if (!sample.Land || sample.Elevation < 50) continue;

					if (!cold && sample.Celsius < -12 && planet.Slope(sample.Direction, 0.3) < 0.2)
						cold = [face, u, v];

					if (!warm && sample.Celsius > 15)
						warm = [face, u, v];
				}
			}
		}

		expect(cold).not.toBe(null);
		expect(warm).not.toBe(null);

		var white = field.Picture(cold[0], cold[1], cold[2], 0.002, 9);
		var green = field.Picture(warm[0], warm[1], warm[2], 0.002, 9);

		expect(white.Snow.length).toBe(81);
		expect(Math.max.apply(null, Array.prototype.slice.call(white.Snow))).toBeGreaterThan(200);
		expect(Math.max.apply(null, Array.prototype.slice.call(green.Snow))).toBe(0);
	}, 60000);

	/*
	 * Regression: a texel of a square took the color of the first land of its climate only; hills about a bound of two lands
	 * (the land changes with the height) were a chessboard of both colors, a texel each, on the ground of a planet near.
	 */
	it('paints a texel of a square in the colors of the lands that hold there, each by how well; a sample tells them', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var planet = {Lands: [{Name: 'meadow', Ground: {Low: [0.8, 0.6, 0.2]}}, {Name: 'wood', Ground: {Low: [0.1, 0.3, 0.1]}}]};
		var base = {Land: true, Elevation: 300, Celsius: 20, Moisture: 0.5, Temperature: 0.7};
		var both = [{Name: 'meadow', Weight: 0.6}, {Name: 'wood', Weight: 0.4}];
		var meadow = planets.Color(planet, Object.assign({Biome: 'meadow', Pictured: true}, base), 'relief', 1);
		var wood = planets.Color(planet, Object.assign({Biome: 'wood', Pictured: true}, base), 'relief', 1);
		var mixed = planets.Color(planet, Object.assign({Biome: 'meadow', Mixed: both, Pictured: true}, base), 'relief', 1);
		var field = terrain.Sphere({Planet: {Seed: 'mixed', Ocean: 0.3, BiomeList: terrain.Biomes({Biomes: ['temperate', 'taiga', 'desert', 'tundra']})}});
		var sample = null;
		var k;

		for (k = 0; k < 3; k++)
			expect(mixed[k]).toBeCloseTo(meadow[k] * 0.6 + wood[k] * 0.4, 5);

		/* Not of a square (its globe): its first land, as it was. */
		expect(planets.Color(planet, Object.assign({Biome: 'meadow', Mixed: both}, base), 'relief', 1)).toEqual(planets.Color(planet, Object.assign({Biome: 'meadow'}, base), 'relief', 1));

		for (k = 0; k < 200 && !sample; k++) {
			var one = field.Planet.Sample(planets.Direction(k * 0.7 - 70, k * 13.1));
			if (one.Land && one.Mixed)
				sample = one;
		}

		expect(sample).not.toBe(null);
		expect(sample.Mixed[0].Name).toBe(sample.Biome);
		expect(sample.Mixed.length).toBeGreaterThan(0);
		expect(sample.Mixed.reduce(function (sum, one) {
			return sum + one.Weight;
		}, 0)).toBeCloseTo(1, 5);
	});

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

	/*
	 * Regression: a worker has no registry of lands, and gave each the same climate: the globe a Scene paints in the workers
	 * showed other lands than the page and the ground have. The workers of planets are given the lands of the page.
	 */
	it('paints a face of its globe in a worker of the very lands of the page', async function () {
		var options = {Seed: 'lands', Ocean: 0.5, Radius: 6371, Rivers: false};
		var page = planets.Face(options, 2, 128, 40, 2).Data;
		var worker = await new Promise(function (resolve, reject) {
			planets.Work().Run('ScenePlanet', 'Face', [options, 2, 128, 40, 2], function (error, made) {
				if (error) reject(error);
				else resolve(made.Data);
			});
		});

		expect(planets.Work().Inline()).toBe(false);
		expect(Array.from(worker)).toEqual(Array.from(page));
	}, 60000);

	/* Edits: brushes over what the planet made (PlanetEditor), the nearer their path the more, none past their radius. */
	it('changes its relief by the brushes of its Edits: raised, lowered, flattened and smoothed along their paths', function () {
		var base = {Seed: 'edits', Ocean: 0.5};
		var own = planets.Make(base);
		var at = planets.Direction(10, 20);
		var side = planets.Direction(10, 21);
		var far = planets.Direction(10, 40);
		var raised = planets.Make(Object.assign({Edits: [{Type: 'raise', Points: [[10, 20]], Radius: 300, Amount: 1000}]}, base));
		var lowered = planets.Make(Object.assign({Edits: [{Type: 'lower', Points: [[10, 18], [10, 22]], Radius: 300, Amount: 500}]}, base));
		var flat = planets.Make(Object.assign({Edits: [{Type: 'flatten', Points: [[10, 20]], Radius: 300, Height: 1234}]}, base));
		var smooth = planets.Make(Object.assign({Edits: [{Type: 'smooth', Points: [[10, 20]], Radius: 400, Amount: 1}]}, base));
		var soft = planets.Make(base).Elevation(at, 200);

		/* At its middle all of it, beside it less, past its radius nothing. */
		expect(raised.Elevation(at)).toBeCloseTo(own.Elevation(at) + 1000, 6);
		expect(raised.Elevation(side) - own.Elevation(side)).toBeGreaterThan(0);
		expect(raised.Elevation(side) - own.Elevation(side)).toBeLessThan(1000);
		expect(raised.Elevation(far)).toBe(own.Elevation(far));
		/* Along its path, as much at each point of it. */
		expect(lowered.Elevation(at)).toBeCloseTo(own.Elevation(at) - 500, 1);
		expect(lowered.Elevation(planets.Direction(10, 18))).toBeCloseTo(own.Elevation(planets.Direction(10, 18)) - 500, 1);
		expect(flat.Elevation(at)).toBeCloseTo(1234, 6);
		/* Smoothed: its relief no finer than half its radius. */
		expect(smooth.Elevation(at)).toBeCloseTo(soft, 6);
		/* Raised out of the sea: land there. */
		expect(planets.Make(Object.assign({Edits: [{Type: 'raise', Points: [[10, 20]], Radius: 300, Amount: 20000}]}, base)).Land(at)).toBe(true);
	});

	/* Rules of detail: what is finer than Scale made by the rule of the place, in the place of its own relief. */
	it('makes what is finer than the scale of its rules by the rule of the place: of its land, a painted region over it', function () {
		var blueprints = Elemenx.Service('Blueprints');
		/* A rule of its own: its detail a wave of the height of its input, no detail at all for flat. */
		var wave = blueprints.Create('generator');
		var flat = blueprints.Create('generator');
		var x = blueprints.Add(wave, 'Input', {properties: {Name: 'X'}});
		var formula = blueprints.Add(wave, 'Formula', {properties: {Expression: 'sin(X / 3) * 40'}});
		var end = blueprints.Add(wave, 'Result', {properties: {Key: 'Height'}});
		var zero = blueprints.Add(flat, 'Number', {properties: {Value: 0}});
		var stop = blueprints.Add(flat, 'Result', {properties: {Key: 'Height'}});
		var graphs;
		var base = {Seed: 'rules', Ocean: 0.3};
		var own = planets.Make(base);
		var inside = planets.Direction(10, 20);
		var outside = planets.Direction(-40, 120);
		var square = [[6, 16], [6, 24], [14, 24], [14, 16]];
		var painted;
		var landed;
		var waved;
		var made;

		blueprints.Link(wave, [x.id, 'Value'], [formula.id, 'X']);
		blueprints.Link(wave, [formula.id, 'Value'], [end.id, 'Value']);
		blueprints.Link(flat, [zero.id, 'Value'], [stop.id, 'Value']);

		graphs = {wave: JSON.parse(blueprints.Write(wave)), flat: JSON.parse(blueprints.Write(flat))};

		/* None: its own relief, the very same. */
		expect(planets.Make(Object.assign({Rules: {Graphs: graphs}}, base)).Elevation(inside)).toBe(own.Elevation(inside));

		/* A region of flat: its relief no finer than Scale there, its own elsewhere. */
		painted = planets.Make(Object.assign({Rules: {Graphs: graphs, Scale: 20}, Regions: [{Rule: 'flat', Points: square, Edge: 30}]}, base));

		expect(painted.Elevation(inside)).toBeCloseTo(own.Elevation(inside, 20), 6);
		expect(painted.Elevation(outside)).toBe(own.Elevation(outside));

		/* Each land by the rule of its biome ('*': any): wave over its coarse relief; the sea its own. */
		landed = planets.Make(Object.assign({Rules: {Graphs: graphs, Biomes: {'*': 'wave'}, Scale: 20}}, base));

		[[10, 20], [30, -60], [-20, 140], [50, 10]].forEach(function (at) {
			var p = planets.Direction(at[0], at[1]);
			var coarse = own.Elevation(p, 20);
			var sample = own.Sample(p, 20);

			made = landed.Elevation(p);

			if (sample.Biome) expect(made).toBeCloseTo(coarse + Math.sin(p[0] * 6371 / 3) * 40, 6);
			else expect(made).toBe(own.Elevation(p));
		});

		/* The region painted wins over the rule of its land. */
		waved = planets.Make(Object.assign({Rules: {Graphs: graphs, Biomes: {'*': 'wave'}, Scale: 20}, Regions: [{Rule: 'flat', Points: square, Edge: 30}]}, base));

		expect(waved.Elevation(inside)).toBeCloseTo(own.Elevation(inside, 20), 6);

		/* From far (a texel as coarse as Scale) a rule gives no detail: no noise of it on a globe. */
		expect(landed.Elevation(inside, 25)).toBeCloseTo(own.Elevation(inside, 25), 6);
	});

	/* The rules of the library: each a graph of its resources made JavaScript, its detail a few kilometres at most. */
	it('has the rules of the library, each made JavaScript, its detail of the place and of its seed', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var names = ['hills', 'mountains', 'dunes', 'mesas', 'badlands', 'plains', 'volcanoes', 'craters', 'glacial', 'karst'];
		var base = {Seed: 'library', Ocean: 0.2};
		var own = planets.Make(base);

		names.forEach(function (name) {
			var made = planets.Make(Object.assign({Rules: {Biomes: {'*': name}, Scale: 20}}, base));
			var other = planets.Make(Object.assign({}, base, {Seed: 'library-2', Rules: {Biomes: {'*': name}, Scale: 20}}));
			var differs = 0;
			var i;

			expect(planets.Rules[name]).toBeTruthy();
			expect(blueprints.Code(planets.Rules[name])).not.toBe(null);

			for (i = 0; i < 40; i++) {
				var p = planets.Direction(-50 + i * 2.5, i * 9);
				var height = made.Elevation(p);
				var detail = height - own.Elevation(p, 20);

				expect(Number.isFinite(height)).toBe(true);
				expect(Math.abs(detail)).toBeLessThan(4000);

				if (Math.abs(other.Elevation(p) - height) > 1e-6)
					differs++;
			}

			expect(differs).toBeGreaterThan(0);
		});
	});

	/* Places: what a developer changed of the settlements and the rivers a planet makes, laid over them each time in their order. */
	it('lays what a developer changed of its settlements and rivers over those it makes, in their order, a change of nothing there left out', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var base = {Seed: 'places', Ocean: 0.4};
		var made = planets.Settlements(base, 3000).Settlements;
		var a = made[0];
		var b = made[1];
		var to = planets.Direction(10, 20);
		var added = planets.Direction(-5, 5);
		var places = {Towns: [{Op: 'move', At: planets.Unit([a.Point[0] + 0.001, a.Point[1], a.Point[2]]), To: to}, {Op: 'kind', At: to, Kind: 'city'}, {Op: 'remove', At: b.Point}, {Op: 'add', Point: added, Kind: 'town', Size: 0.7}, {Op: 'kind', At: planets.Direction(-89, 0), Kind: 'city'}]};
		var laid = planets.PlacedTowns(Object.assign({Places: places}, base), made);

		expect(made.length).toBeGreaterThan(3);
		expect(laid.length).toBe(made.length);
		expect(laid[0].Kind).toBe('city');

		laid[0].Point.forEach(function (value, axis) {
			expect(value).toBeCloseTo(to[axis], 9);
		});

		expect(laid.some(function (town) {
			return town.Point.join() === b.Point.join();
		})).toBe(false);
		expect(laid[laid.length - 1]).toEqual({Point: planets.Unit(added), Kind: 'town', Size: 0.7});
		expect(made[0].Point).toEqual(a.Point);

		/* Its settlements made with them: the same. */
		expect(planets.Settlements(Object.assign({Places: places}, base), 3000).Settlements).toEqual(laid);

		/* Its rivers: one removed by a point near it, one drawn, a point of no river left out. */
		var rivers = [{Points: [planets.Direction(0, 0), planets.Direction(0, 1), planets.Direction(0, 2)], Flow: [50, 80, 120], Level: [200, 100, 10]}, {Points: [planets.Direction(10, 0), planets.Direction(10, 1)], Flow: [40, 60], Level: [50, 0]}];
		var drawn = {Rivers: [{Op: 'remove', At: planets.Direction(0.05, 1)}, {Op: 'add', Points: [planets.Direction(20, 0), planets.Direction(20, 1)], Flow: 250}, {Op: 'remove', At: planets.Direction(-40, -40)}]};
		var courses = planets.PlacedRivers({Places: drawn}, rivers);

		expect(courses.length).toBe(2);
		expect(courses[0]).toBe(rivers[1]);
		expect(courses[1].Drawn).toBe(true);
		expect(courses[1].Points.length).toBeGreaterThan(10);
		expect(courses[1].Flow[0]).toBe(50);
		expect(courses[1].Flow[courses[1].Flow.length - 1]).toBe(250);
		expect(rivers.length).toBe(2);

		/* A planet of them: the drawn one a river of it, the levels of its ground under it, the one removed none. */
		var planet = planets.Make(Object.assign({Rivers: rivers, Places: drawn}, base));
		var made2 = planet.Courses();

		expect(made2.length).toBe(2);
		expect(made2[1].Points.length).toBe(courses[1].Points.length);

		made2[1].Level.forEach(function (level) {
			expect(level).toBeGreaterThanOrEqual(0);
			expect(Number.isFinite(level)).toBe(true);
		});

		expect(planet.River(planets.Direction(0, 1))).toBeNull();
		expect(planet.River(planets.Direction(20, 0.5)).Far).toBeLessThan(1);
	});
});
