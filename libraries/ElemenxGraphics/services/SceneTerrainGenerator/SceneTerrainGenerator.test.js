import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

function square (x0, z0, x1, z1) {
	return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

function inside (polygon, x, z) {
	var within = false;
	var a;
	var b;

	for (a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
		if (polygon[a][1] > z !== polygon[b][1] > z && x < (polygon[b][0] - polygon[a][0]) * (z - polygon[a][1]) / (polygon[b][1] - polygon[a][1]) + polygon[a][0])
			within = !within;
	}

	return within;
}

function distance (line, x, z) {
	var best = Infinity;
	var a;

	for (a = 0; a + 1 < line.length; a++) {
		var dx = line[a + 1][0] - line[a][0];
		var dz = line[a + 1][1] - line[a][1];
		var t = Math.max(0, Math.min(1, ((x - line[a][0]) * dx + (z - line[a][1]) * dz) / (dx * dx + dz * dz || 1)));

		best = Math.min(best, Math.hypot(line[a][0] + dx * t - x, line[a][1] + dz * t - z));
	}

	return best;
}

/* The four corners of a lot, turned as it stands: its front, the side of +z of its model, to its street. */
function corners (lot) {
	var c = Math.cos(lot.Turn);
	var s = Math.sin(lot.Turn);

	return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (corner) {
		var x = corner[0] * lot.Width / 2;
		var z = corner[1] * lot.Depth / 2;

		return [lot.X + c * x + s * z, lot.Z + c * z - s * x];
	});
}

describe('Contract: the plan of a settlement of a sketch: its streets, its lots along them, its walls, gates and towers', function () {
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:Noise', 'service:Workers']);

		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	function plan (item, others) {
		return terrain.SettlementPlan(Object.assign({ID: 'place'}, item), others || [], function (name) {
			return terrain.SettlementSizes[name] || null;
		});
	}

	it('lays a city on a grid along its longest side, none of its streets on its edge, its lots wholly inside, off the streets and each other, facing their street', function () {
		var outline = square(0, -120, 160, 30);
		var city = plan({Kind: 'city', Points: outline});
		var lines = city.Streets.map(function (street) {
			return street.Points;
		});

		expect(city.Streets.length).toBeGreaterThan(4);
		expect(city.Streets.every(function (street) {
			var a = street.Points[0];
			var b = street.Points[street.Points.length - 1];
			var middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

			return (Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6) && inside(outline, middle[0], middle[1]) && distance(outline.concat([outline[0]]), middle[0], middle[1]) > street.Width;
		})).toBe(true);

		expect(city.Lots.length).toBeGreaterThan(15);

		city.Lots.forEach(function (lot) {
			expect(corners(lot).every(function (corner) {
				return inside(outline, corner[0], corner[1]);
			})).toBe(true);
			expect(city.Streets.every(function (street) {
				return distance(street.Points, lot.X, lot.Z) > street.Width / 2 + Math.min(lot.Width, lot.Depth) / 2;
			})).toBe(true);
			expect(city.Lots.every(function (other) {
				return other === lot || Math.hypot(other.X - lot.X, other.Z - lot.Z) > (Math.max(other.Width, other.Depth) + Math.max(lot.Width, lot.Depth)) * 0.42;
			})).toBe(true);

			/* Its front looks at the street nearest it. */
			var front = [lot.X + Math.sin(lot.Turn) * lot.Depth, lot.Z + Math.cos(lot.Turn) * lot.Depth];

			expect(Math.min.apply(null, lines.map(function (line) {
				return distance(line, front[0], front[1]);
			}))).toBeLessThan(Math.min.apply(null, lines.map(function (line) {
				return distance(line, lot.X, lot.Z);
			})));
		});

		/* Towers and business centres in its core only (the third of its reach, where their lot begins), the buildings of a city round it. */
		var reach = Math.hypot(80, 75);
		var core = city.Lots.filter(function (lot) {
			return terrain.SettlementKinds.city.Core[lot.Class];
		});

		expect(core.length).toBeGreaterThan(0);
		expect(core.every(function (lot) {
			return Math.hypot(lot.X - 80, lot.Z + 45) < reach * 0.35 + Math.hypot(lot.Width, lot.Depth) + 6;
		})).toBe(true);
		expect(city.Lots.filter(function (lot) {
			return Math.hypot(lot.X - 80, lot.Z + 45) > reach * 0.7;
		}).every(function (lot) {
			return terrain.SettlementKinds.city.Classes[lot.Class];
		})).toBe(true);
		/* A step of 39 metres would lay streets 2 metres off its edges: none of those. */
		expect(plan({Kind: 'city', Points: outline, Block: 39}).Streets.every(function (street) {
			return street.Points.every(function (point) {
				return point[0] > 10 && point[0] < 150 || Math.abs(street.Points[0][0] - street.Points[1][0]) > 1e-6;
			});
		})).toBe(true);
		expect(city.Walls).toEqual([]);
		expect(city.Gates).toEqual([]);
	});

	it('gives a village a main street with lanes off it, takes the streets drawn in it instead, builds none on a square and those of a district in it', function () {
		var outline = square(-120, -100, -30, -20);
		var village = plan({Kind: 'village', Points: outline});
		var main = village.Streets[0];

		expect(main.Points[0][1]).toBeCloseTo(main.Points[1][1], 6);
		expect(village.Streets.length).toBeGreaterThan(2);
		expect(village.Streets.slice(1).every(function (lane) {
			return Math.abs(lane.Points[0][0] - lane.Points[1][0]) < 1e-6 && lane.Width < main.Width;
		})).toBe(true);
		expect(village.Lots.length).toBeGreaterThan(8);
		expect(village.Lots.every(function (lot) {
			return Object.keys(terrain.SettlementKinds.village.Classes).indexOf(lot.Class) >= 0;
		})).toBe(true);

		/* The same seed the same plan; another another. */
		expect(plan({Kind: 'village', Points: outline})).toEqual(village);
		expect(plan({Kind: 'village', Points: outline, Seed: 'other'}).Lots).not.toEqual(village.Lots);

		/* Its own streets, a square and a district of villas. */
		var drawn = [
			{ID: 's1', Type: 'street', Points: [[-110, -85], [-40, -85]], Width: 8},
			{ID: 's2', Type: 'street', Points: [[-110, -40], [-40, -40]]},
			{ID: 'q', Type: 'square', Points: square(-70, -55, -40, -25)},
			{ID: 'd', Type: 'district', Kind: 'noble', Points: square(-120, -100, -30, -62)}
		];
		var made = plan({Kind: 'village', Points: outline}, drawn);

		expect(made.Streets).toEqual([{Points: drawn[0].Points, Width: 8}, {Points: drawn[1].Points, Width: terrain.SettlementKinds.village.Street}]);
		expect(made.Lots.some(function (lot) {
			return inside(drawn[2].Points, lot.X, lot.Z);
		})).toBe(false);

		/* The class of a lot is of the place its street passes it: villas along the street in the district, the village along the other. */
		var villas = made.Lots.filter(function (lot) {
			return lot.Z < -62;
		});
		var others = made.Lots.filter(function (lot) {
			return lot.Z > -62;
		});

		expect(villas.length).toBeGreaterThan(1);
		expect(villas.every(function (lot) {
			return lot.District === 'noble' && lot.Class === 'villa';
		})).toBe(true);
		expect(others.length).toBeGreaterThan(2);
		expect(others.every(function (lot) {
			return lot.District === '' && terrain.SettlementKinds.village.Classes[lot.Class];
		})).toBe(true);
		expect(plan({Kind: 'village', Points: outline, Density: 0}).Lots).toEqual([]);
	});

	/* Regression: houses of a settlement stood on a road of the sketch through it (and on a river): lots keep off all its ways. */
	it('builds no lot of a settlement on a road, a street not its own or a river of the sketch through it', function () {
		var outline = square(-150, -150, 150, 150);
		var road = {Type: 'road', Points: [[-200, -40], [0, 10], [200, 60]], Width: 8};
		var river = {Type: 'river', Points: [[-60, -200], [-40, 0], [-70, 200]], Width: 14};
		var town = plan({Kind: 'town', Points: outline}, [road, river]);
		var free = plan({Kind: 'town', Points: outline});

		expect(town.Lots.length).toBeGreaterThan(20);
		expect(town.Lots.length).toBeLessThan(free.Lots.length);

		town.Lots.forEach(function (lot) {
			corners(lot).concat([[lot.X, lot.Z]]).forEach(function (point) {
				expect(distance(road.Points, point[0], point[1])).toBeGreaterThan(road.Width / 2 + 1);
				expect(distance(river.Points, point[0], point[1])).toBeGreaterThan(river.Width / 2 + 1);
			});
		});

		/* Without them, some stood there. */
		expect(free.Lots.some(function (lot) {
			return distance(road.Points, lot.X, lot.Z) < road.Width / 2 + 1;
		}) || free.Lots.some(function (lot) {
			return distance(river.Points, lot.X, lot.Z) < river.Width / 2 + 1;
		})).toBe(true);
	});

	it('walls a fort round, a tower at each corner, a gate on the wall where each street goes out, the way through it along the street', function () {
		var outline = square(-100, 60, -20, 140);
		var fort = plan({Kind: 'fort', Points: outline});
		var ring = outline.concat([outline[0]]);

		expect(fort.Walls).toEqual([ring]);
		expect(fort.Towers).toEqual(outline.map(function (point) {
			return {X: point[0], Z: point[1]};
		}));
		expect(fort.Gates.length).toBe(fort.Streets.length * 2);

		fort.Gates.forEach(function (gate) {
			var street = fort.Streets.filter(function (one) {
				return distance(one.Points, gate.X, gate.Z) < 6;
			})[0];
			var a = street.Points[0];
			var b = street.Points[street.Points.length - 1];

			expect(distance(ring, gate.X, gate.Z)).toBeLessThan(1e-6);
			expect(Math.abs(Math.sin(gate.Turn - Math.atan2(b[0] - a[0], b[1] - a[1])))).toBeLessThan(1e-6);
		});

		expect(plan({Kind: 'village', Points: outline, Walls: true}).Walls).toEqual([ring]);
		expect(plan({Kind: 'city', Points: [[0, 0], [10, 0]]}).Streets).toEqual([]);
	});
});

describe('Contract: the zones of a ground and where things may grow on it', function () {
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:SceneBiomes']);

		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	/* Regression: a land of low hills (Height 22) was rock above 10 units, and no grass grew there: its zones were parts of its Height only. */
	it('begins rock and snow where Rock and Snow say, none of them with false, and paints a land of low hills all of grass', function () {
		var hills = terrain.Flat({Size: 400, Height: 22, Water: 0, Rock: false, Snow: false, Seed: 'hills'});
		var usual = terrain.Flat({Size: 400, Height: 22, Water: 0, Seed: 'hills'});
		var told = terrain.Flat({Size: 400, Height: 100, Rock: 0.6, Snow: 0.9, Seed: 'hills'});
		var grass = terrain.Paint(hills, 0, 0, 20, 0);

		expect(hills.Rock).toBe(Infinity);
		expect(hills.Snow).toBe(Infinity);
		expect(usual.Rock).toBeCloseTo(9.9, 5);
		expect(usual.Snow).toBeCloseTo(16.5, 5);
		expect(told.Rock).toBe(60);
		expect(told.Snow).toBe(90);
		expect(grass[1]).toBeGreaterThan(grass[0]);
		expect(terrain.Paint(usual, 0, 0, 12, 0)).toEqual([0.45, 0.42, 0.36]);
		expect(terrain.Paint(usual, 0, 0, 20, 0)).toEqual([0.93, 0.94, 0.96]);
		expect(terrain.Paint(told, 0, 0, 50, 0)).not.toEqual([0.45, 0.42, 0.36]);
		expect(terrain.Paint(told, 0, 0, 70, 0)).toEqual([0.45, 0.42, 0.36]);
		/* A steep slope is rock wherever it is. */
		expect(terrain.Paint(hills, 0, 0, 5, 0.5)).toEqual([0.42, 0.39, 0.35]);
	});

	/*
	 * What a ground is made of (SceneMaterials): the materials of its palettes and its sketch in slots, the weights of them at
	 * a point as its colors go (Paint into), and those of each corner of its squares (Materials: 12 a vertex).
	 */
	it('makes its ground of materials: slots of its palettes and sketch, their weights at a point and at each corner', function () {
		var field = terrain.Flat({Size: 400, Height: 100, Rock: 0.6, Snow: 0.9, Water: 0, Seed: 'stuff', Palette: {Materials: {Low: 'clay'}}, Sketch: {Layers: [{ID: 'a', Items: [{Type: 'beach', Points: [[-50, -50], [50, -50], [50, 50], [-50, 50]]}, {Type: 'road', Points: [[100, -150], [100, 150]], Width: 8, Material: 'cobbles'}]}]}});
		var stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var geometry;
		var count;

		expect(field.Materials.slice(0, 7)).toEqual(['clay', 'soil', 'rock', 'sand', 'dirt', 'cobbles', 'snow']);

		/* Low and high, as their colors are: clay, soil; rock on a slope; cobbles on the road of the sketch; snow high. */
		terrain.Paint(field, -150, -150, 20, 0, stuff);

		expect(stuff[0] + stuff[1]).toBeCloseTo(1, 5);
		expect(stuff[0]).toBeGreaterThan(stuff[1]);

		stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		terrain.Paint(field, -150, -150, 30, 0.5, stuff);

		expect(stuff[2]).toBe(1);

		stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		terrain.Paint(field, -150, -150, 99, 0, stuff);

		expect(stuff[6]).toBe(1);

		stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

		terrain.Paint(field, 100, 0, 30, 0, stuff);

		expect(stuff[5]).toBeGreaterThan(0.9);

		/* Its squares: 12 weights of each corner, the skirt too. */
		geometry = field.Chunk(0, 0, 100, 8);
		count = geometry.Positions.length / 3;

		expect(geometry.Materials.length).toBe(count * 12);
		expect(geometry.Materials.slice(0, 12).reduce(function (sum, value) {
			return sum + value;
		}, 0)).toBeCloseTo(1, 5);
	});

	/*
	 * Regression: a hillside had teeth of white and brown, a triangle each, down it: a corner was snow or rock or grass by
	 * a line of its height or its slope, so the next corner, a little higher or steeper, was all of another; and a ground
	 * of many materials had no slot left for its snow, which was so its color alone.
	 */
	it('goes from grass to rock to snow over a band of height and of slope, and has a slot for the snow of a ground of many materials', function () {
		var field = terrain.Flat({Size: 400, Height: 100, Rock: 0.6, Snow: 0.9, Water: 0, Seed: 'band'});
		var many = terrain.Flat({Size: 400, Height: 100, Water: 0, Seed: 'many', Sketch: {Layers: [{ID: 'a', Items: ['beach', 'road', 'street', 'river', 'swamp', 'floodplain', 'canyon'].map(function (type, index) {
			return {Type: type, Points: [[-150 + index * 40, -150], [-150 + index * 40, 150]], Width: 6, Material: ['sand', 'dirt', 'paving', 'gravel', 'clay', 'grassy', 'cobbles'][index]};
		})}]}});

		function weights (x, y, slope) {
			var stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

			terrain.Paint(field, x, 0, y, slope, stuff);

			return stuff;
		}

		/* A metre higher, a little steeper: the weights move a little, not from one material to the next. */
		[0, 37, 120].forEach(function (x) {
			var y;

			for (y = 80; y < 100; y++)
				expect(Math.abs(weights(x, y + 1, 0)[field.MaterialSlot.snow] - weights(x, y, 0)[field.MaterialSlot.snow])).toBeLessThan(0.3);

			for (y = 50; y < 70; y++)
				expect(Math.abs(weights(x, y + 1, 0)[field.MaterialSlot.rock] - weights(x, y, 0)[field.MaterialSlot.rock])).toBeLessThan(0.3);
		});

		expect(Math.abs(weights(0, 20, 0.34)[field.MaterialSlot.rock] - weights(0, 20, 0.3)[field.MaterialSlot.rock])).toBeLessThan(0.3);
		expect(weights(0, 20, 0.1)[field.MaterialSlot.rock]).toBe(0);
		expect(weights(0, 20, 0.5)[field.MaterialSlot.rock]).toBe(1);

		/* Snow still has a slot after the seven of a sketch. */
		expect(many.Materials.length).toBeGreaterThan(8);
		expect(many.Materials).toContain('snow');
		expect(many.Materials).toContain('cobbles');
	});

	/* Regression: grass grew on the roads, which the ground under them made level: nothing kept them bare. */
	it('keeps bare what is within the reach of a line and inside an area, softly at their edge, free farther', function () {
		var side = 101;
		var free = terrain.Free(100, side, [{Points: [[-50, 0], [50, 0]], Reach: 4}], [[[20, 20], [40, 20], [40, 40], [20, 40]]], 2);

		function at (x, z) {
			return free[Math.round(z + 50) * side + Math.round(x + 50)];
		}

		expect(free.length).toBe(side * side);
		expect(at(0, 0)).toBe(0);
		expect(at(-30, 3)).toBe(0);
		expect(at(10, 5)).toBe(128);
		expect(at(10, 10)).toBe(255);
		expect(at(30, 30)).toBe(0);
		expect(at(10, 30)).toBe(255);
		expect(terrain.Free(10, 11, [], []).every(function (value) {
			return value === 255;
		})).toBe(true);
	});
	/* A ground of a noise of its own: any of the Noise Service, the same in a worker, and the hills of Scale and Ridges without one. */
	it('raises its hills of the noise its options give, the same in a worker, and the same as ever without one', async function () {
		var spec = {Type: 'worley', Seed: 'dunes', Scale: 120, Cell: {Return: 'f1'}, Fractal: 'fbm', Octaves: 3};
		var plain = terrain.Flat({Size: 600, Height: 40, Water: 0, Seed: 'g'});
		var noisy = terrain.Flat({Size: 600, Height: 40, Water: 0, Seed: 'g', Noise: spec});
		var sampler = Elemenx.Service('Noise').Make(spec);
		var pool = terrain.Work();
		var piece;
		var here;

		expect(noisy.Height(30, -40)).not.toBe(plain.Height(30, -40));
		expect(Math.sign(noisy.Height(30, -40) - noisy.Height(-120, 90))).toBe(Math.sign(sampler.At(30, 0, -40) - sampler.At(-120, 0, 90)));

		piece = await new Promise(function (done, failed) {
			pool.Run('SceneTerrainGenerator', 'Piece', ['Flat', {Size: 600, Height: 40, Water: 0, Seed: 'g', Noise: spec}, null, [10, -20, 50, 8]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		here = noisy.Chunk(10, -20, 50, 8);

		expect(Array.from(piece.Positions)).toEqual(Array.from(new Float32Array(here.Positions)));
	});

	it('raises the very same hills of the library graph of its relief, in a worker too, and tells the climate of a point', async function () {
		var options = {Size: 800, Height: 50, Water: 0.3, Scale: 150, Ridges: 0.6, Seed: 'relief'};
		var plain = terrain.Flat(options);
		var graph = terrain.LibraryRelief(options);
		var drawn = terrain.Flat(Object.assign({Relief: graph}, options));
		var steep = terrain.Flat({Size: 800, Height: 50, Water: 0.3, Scale: 150, Seed: 'relief', Relief: terrain.LibraryRelief(Object.assign({}, options, {Ridges: 1}))});
		var pool = terrain.Work();
		var i;
		var x;
		var z;
		var climate;
		var piece;

		expect(typeof drawn.Options.ReliefSource).toBe('string');

		for (i = 0; i < 300; i++) {
			x = Math.sin(i * 12.9898) * 400;
			z = Math.cos(i * 78.233) * 400;
			climate = drawn.Climate(x, z);

			expect(drawn.Height(x, z)).toBe(plain.Height(x, z));
			expect(climate).toEqual(plain.Climate(x, z));
			expect(climate.Moisture).toBeGreaterThanOrEqual(0);
			expect(climate.Temperature).toBeLessThanOrEqual(1);
		}

		/* Its parameters are the graph's where the options tell none: more folds of mountains, other heights. */
		expect([0, 1, 2, 3, 4, 5, 6, 7].some(function (k) {
			return steep.Height(k * 90 - 360, k * 40) !== plain.Height(k * 90 - 360, k * 40);
		})).toBe(true);

		/* The higher, the colder. */
		var spots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(function (k) {
			return [Math.sin(k * 3.7) * 380, Math.cos(k * 5.1) * 380];
		}).sort(function (a, b) {
			return plain.Height(a[0], a[1]) - plain.Height(b[0], b[1]);
		});

		expect(plain.Climate(spots[19][0], spots[19][1]).Temperature).toBeLessThan(plain.Climate(spots[0][0], spots[0][1]).Temperature);

		piece = await new Promise(function (done, failed) {
			pool.Run('SceneTerrainGenerator', 'Piece', ['Flat', drawn.Options, null, [40, -60, 80, 8]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(Array.from(piece.Positions)).toEqual(Array.from(new Float32Array(plain.Chunk(40, -60, 80, 8).Positions)));
	});

	it('lays its lands by their climate and height, softly where they meet, the same in a worker', async function () {
		var options = {Size: 1600, Height: 80, Water: 0.3, Seed: 'lands', Biomes: ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']};
		var field = terrain.Flat(options);
		var names = {};
		var mixed = false;
		var red = [1, 0, 0];
		var piece;
		var here;
		var i;

		for (i = 0; i < 400; i++) {
			var x = Math.sin(i * 12.9898) * 780;
			var z = Math.cos(i * 78.233) * 780;
			var lands = field.Biome(x, z);
			var weather = field.Climate(x, z);
			var part = field.Height(x, z) / field.Top;
			var sum = lands.List.reduce(function (total, land) {
				return total + land.Weight;
			}, 0);

			expect(lands.Gap).toBe(false);
			expect(sum).toBeCloseTo(1, 9);

			names[lands.List[0].Name] = true;
			mixed = mixed || lands.List.length > 1;

			/* What holds a point most is of its climate. */
			if (lands.List[0].Weight === 1) {
				if (lands.List[0].Name === 'tundra')
					expect(weather.Temperature).toBeLessThanOrEqual(0.24);

				if (lands.List[0].Name === 'desert')
					expect(weather.Moisture).toBeLessThanOrEqual(0.35);

				if (lands.List[0].Name === 'swamp')
					expect(part).toBeLessThanOrEqual(0.14);
			}
		}

		expect(Object.keys(names).length).toBeGreaterThan(1);
		expect(mixed).toBe(true);

		/* Its colors are those of its lands (the 5 by 5 points of its top; the skirt under its edges is darker). */
		expect(terrain.Flat(Object.assign({}, options, {BiomeList: null, Biomes: [{Biome: 'red', Ground: {Low: red, High: red, Sand: red, Deep: red, Rock: red, Snow: red, Road: red}, Climate: {}}]})).Chunk(0, 0, 40, 4).Colors.every(function (value, index) {
			return index % 3 !== 0 || index >= 25 * 3 || value > 0.99;
		})).toBe(true);

		piece = await new Promise(function (done, failed) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', field.Options, null, [100, 200, 120, 8]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		here = field.Chunk(100, 200, 120, 8);

		expect(Array.from(piece.Colors)).toEqual(Array.from(new Float32Array(here.Colors)));
	});

	/*
	 * Rainforest, semidesert and steppe take the place of others where they hold (Over): the wet tropics a dark forest, a
	 * dry temperate land a steppe, a warm half-dry one a semidesert; the usual six alone as they were, none of the nine bare.
	 */
	it('lays a rainforest, a semidesert and a steppe in place of others where they hold, the usual six as they were', function () {
		var nine = terrain.Biomes({Biomes: ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'rainforest', 'semidesert', 'steppe']});
		var six = terrain.Biomes({Biomes: ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']});
		var field = terrain.Flat({Size: 1600, Height: 80, Water: 0.3, Seed: 'lands', Biomes: ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'rainforest', 'semidesert', 'steppe']});

		expect(terrain.BiomeOf(nine, 0.2, 0.85, 0.85).List[0].Name).toBe('rainforest');
		expect(terrain.BiomeOf(nine, 0.2, 0.12, 0.52).List[0].Name).toBe('steppe');
		expect(terrain.BiomeOf(nine, 0.2, 0.25, 0.8).List[0].Name).toBe('semidesert');

		expect(terrain.BiomeOf(six, 0.2, 0.85, 0.85).List[0].Name).not.toBe('rainforest');
		expect(terrain.BiomeOf(six, 0.2, 0.12, 0.52).List[0].Name).toBe('temperate');
		expect(terrain.BiomeOf(six, 0.2, 0.25, 0.8).List[0].Name).toBe('desert');

		expect(Elemenx.Service('SceneBiomes').Check(['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'rainforest', 'semidesert', 'steppe'], field).Gap).toBe(0);
	});

	it('tells where lands by their climate leave heights and climates of a ground bare, and lands it never has', function () {
		var biomes = Elemenx.Service('SceneBiomes');
		var field = terrain.Flat({Size: 1600, Height: 80, Water: 0.3, Seed: 'lands'});
		var whole = biomes.Check(['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp'], field);
		var holed = biomes.Check([{Biome: 'warm', Climate: {Temperature: [0.5, null]}}, {Biome: 'peaks', Climate: {Height: [3, null]}}, {Biome: 'none', Climate: {Moisture: [0.6, 0.4]}}], field);
		var types = holed.Problems.map(function (problem) {
			return problem.Type;
		});
		var gap = holed.Problems.find(function (problem) {
			return problem.Type === 'gap';
		});

		expect(whole.Problems).toEqual([]);
		expect(whole.Gap).toBe(0);
		expect(Object.keys(whole.Share).reduce(function (sum, name) {
			return sum + whole.Share[name];
		}, 0)).toBeCloseTo(1, 6);
		expect(whole.Heights.swamp[0]).toBeLessThan(0.15);

		expect(types).toContain('range');
		expect(types).toContain('gap');
		expect(types).toContain('unreachable');
		expect(types).toContain('uncovered');
		expect(gap.Temperature[0]).toBeLessThan(0.5);
		expect(holed.Gap).toBeGreaterThan(0);

		/* With no ground: the climates alone, each band of heights of a ground. */
		expect(biomes.Check(['tundra', 'desert']).Problems.some(function (problem) {
			return problem.Type === 'gap';
		})).toBe(true);
	});
});

describe('Contract: the volume of a ground: tunnels, caves and overhangs cut out of it and grown on it', function () {
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:Noise']);

		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	/* The edges of a geometry no triangle goes back along, away from its rim: holes in it. */
	function holes (geometry, half) {
		var edges = {};
		var count = 0;
		var i;

		for (i = 0; i < geometry.Indices.length; i += 3) {
			[[0, 1], [1, 2], [2, 0]].forEach(function (pair) {
				edges[geometry.Indices[i + pair[0]] + ':' + geometry.Indices[i + pair[1]]] = true;
			});
		}

		Object.keys(edges).forEach(function (key) {
			var ends = key.split(':');
			var x = geometry.Positions[ends[0] * 3];
			var z = geometry.Positions[ends[0] * 3 + 2];
			if (!edges[ends[1] + ':' + ends[0]] && Math.abs(x) < half - 1 && Math.abs(z) < half - 1)
				count++;
		});

		return count;
	}

	it('cuts a tunnel through a hill, its floor level, the rest of the ground its heights as ever', function () {
		var options = {Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90};
		var plain = terrain.Flat(options);
		var field = terrain.Flat(Object.assign({}, options, {Carves: [{Type: 'tunnel', Points: [[-60, 0, 6], [60, 0, 6]], Radius: 4, Flat: 0.5}]}));
		var piece = field.Chunk(0, 0, 32, 16);

		expect(plain.Height(0, 0)).toBeGreaterThan(11);
		expect(field.Density(0, 6, 0)).toBeLessThan(0);
		expect(field.Density(0, plain.Height(0, 0) - 1, 0)).toBeGreaterThan(0);
		/* Its floor: 0.7 of its radius under its axis, level. */
		expect(field.Density(0, 2.5, 0)).toBeGreaterThan(0);
		expect(field.Density(0, 3.6, 0)).toBeLessThan(0);
		expect(field.Density(30, 3.6, 0)).toBeLessThan(0);
		expect(field.Height(150, 150)).toBe(plain.Height(150, 150));
		expect(field.Chunk(150, 150, 32, 16).Volume).toBeUndefined();

		/* The square over it is made of its volume: more than a surface, and no hole in it. */
		expect(piece.Volume).toBe(true);
		expect(piece.Positions.length).toBeGreaterThan(plain.Chunk(0, 0, 32, 16).Positions.length);
		expect(holes(piece, 16)).toBe(0);
		expect(piece.Positions.some(function (value, index) {
			return index % 3 === 1 && value < 4 && value > 2.5;
		})).toBe(true);
	});

	/*
	 * Regression: the tunnel of a wide road was round bores side by side, and the ground between them stood inside the box of
	 * its lining. A tunnel of a Width is a box round its axis: as wide and as high as told, its floor and vault level, its
	 * corners round, nothing left across it.
	 */
	it('cuts a tunnel of a Width as a box round its axis, level floor and vault, round corners, nothing left across it', function () {
		var options = {Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90};
		var field = terrain.Flat(Object.assign({}, options, {Carves: [{Type: 'tunnel', Points: [[-60, 0, 6], [60, 0, 6]], Width: 30, Height: 8, Corner: 1.5}]}));

		/* Across all of its width at the height of its axis, where round bores left ground between them. */
		[-14, -7, 0, 7, 14].forEach(function (z) {
			expect(field.Density(0, 6, z)).toBeLessThan(0);
		});

		/* Its floor and its vault: 4 m under and over its axis, level. */
		expect(field.Density(0, 2.2, 0)).toBeLessThan(0);
		expect(field.Density(0, 1.8, 0)).toBeGreaterThan(0);
		expect(field.Density(0, 9.8, 0)).toBeLessThan(0);
		expect(field.Density(0, 10.2, 10)).toBeGreaterThan(0);
		expect(field.Density(0, 6, 15.4)).toBeGreaterThan(0);

		/* Its corner round: by the wall, low, still cut; in the very corner, ground. */
		expect(field.Density(0, 3, 14)).toBeLessThan(0);
		expect(field.Density(0, 2.05, 14.95)).toBeGreaterThan(0);

		/* The squares by it of the volume, far from it of heights. */
		expect(field.Volume.Touches(-10, 12, 10, 20)).toBe(true);
		expect(field.Volume.Touches(-10, 60, 10, 80)).toBe(false);
	});

	/*
	 * Forks under the ground had no form: a tunnel was one line, caves a noise. Passages are a graph: ways from node to node,
	 * a hall where they part, the kind of each node by its ways, the points of a way on a straight grade between its nodes.
	 */
	it('makes a graph of passages: its nodes by their ways, a hall at a fork, its ways from node to node on their grade', function () {
		var graph = terrain.Passages({Radius: 2, Flat: 0.5, Depth: 10, Nodes: [{ID: 'mouth', At: [-80, 0], Depth: 1}, {ID: 'fork', At: [0, 0]}, {ID: 'hall', At: [60, 40], Radius: 9}, {ID: 'well', At: [60, -40, -30]}], Ways: [{From: 'mouth', To: 'fork', Points: [[-40, 0]]}, {From: 'fork', To: 'hall'}, {From: 'fork', To: 'well', Radius: 3}, {From: 'fork', To: 'nowhere'}]}, function () {
			return 20;
		});
		var kinds = {};

		graph.Nodes.forEach(function (node) {
			kinds[node.ID] = [node.Kind, +node.Hall.toFixed(2), +node.At[1].toFixed(2)];
		});

		expect(graph.Ways.length).toBe(3);
		/* The fork: a hall half again its widest way (3); the hall told; the ends none. */
		expect(kinds).toEqual({mouth: ['end', 0, 19], fork: ['fork', 4.5, 10], hall: ['end', 9, 10], well: ['end', 0, -30]});
		/* A point of no height halfway: halfway down from the mouth to the fork. */
		expect(graph.Ways[0].Points.map(function (point) {
			return +point[1].toFixed(3);
		})).toEqual([19, 14.5, 10]);
		/* Its floor at the floor of its ways: the widest, 0.7 of a radius of 3 under its middle. */
		expect(graph.Nodes[1].Floor).toBeCloseTo(10 - 3 * 0.7, 6);
	});

	it('finds the shortest way through a graph of passages, and none to a node no way reaches', function () {
		var graph = terrain.Passages({Nodes: [{ID: 'a', At: [0, 0, 0]}, {ID: 'b', At: [100, 0, 0]}, {ID: 'c', At: [50, 10, 0]}, {ID: 'd', At: [50, 300, 0]}, {ID: 'lone', At: [0, 500, 0]}], Ways: [{ID: 'long', From: 'a', To: 'd'}, {From: 'd', To: 'b'}, {ID: 'one', From: 'a', To: 'c'}, {ID: 'two', From: 'b', To: 'c'}]});
		var route = terrain.PassageRoute(graph, 'a', 'b');

		expect(route.Nodes).toEqual(['a', 'c', 'b']);
		expect(route.Ways).toEqual(['one', 'two']);
		expect(route.Length).toBeCloseTo(2 * Math.hypot(50, 10), 6);
		expect(route.Points).toEqual([[0, 0, 0], [50, 0, 10], [100, 0, 0]]);
		expect(terrain.PassageRoute(graph, 'a', 'lone')).toBe(null);
		expect(terrain.PassageRoute(graph, 'a', 'missing')).toBe(null);
	});

	/*
	 * The volume of a fork: each way a bore with its floor level, a hall where they part joined to them with no edge, its
	 * floor the floor of the ways; rough walls of a natural cave, none by the floor, so it stays walkable.
	 */
	it('cuts the ways and the hall of a fork of passages, joined, their floors level and walkable, rough walls or smooth', function () {
		var options = {Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90};
		var carve = {Type: 'passages', Radius: 2.5, Nodes: [{ID: 'w', At: [-60, 0, -4]}, {ID: 'f', At: [0, 0, -4]}, {ID: 'n', At: [40, 40, -4]}, {ID: 's', At: [40, -40, -4]}], Ways: [{From: 'w', To: 'f'}, {From: 'f', To: 'n'}, {From: 'f', To: 's'}]};
		var field = terrain.Flat(Object.assign({}, options, {Carves: [carve]}));
		var rough = terrain.Flat(Object.assign({}, options, {Carves: [Object.assign({}, carve, {Rough: 0.8, Seed: 'cave'})]}));
		var floor = -4 - 2.5 * 0.7;
		var hall = field.Volume.Carves[0].Halls[0];
		var walk = terrain.Underground(field, {});

		expect(hall.Radius).toBeCloseTo(2.5 * 1.5, 6);
		/* In the ways, in the hall, and in between where they meet. */
		[[-30, 0], [20, 20], [20, -20], [0, 0], [-3, 0], [2, 2]].forEach(function (point) {
			expect(field.Density(point[0], -4, point[1])).toBeLessThan(0);
			expect(field.Density(point[0], floor + 0.3, point[1])).toBeLessThan(0);
			expect(field.Density(point[0], floor - 0.3, point[1])).toBeGreaterThan(0);
		});

		/* Out of them, rock. */
		expect(field.Density(0, -4, 12)).toBeGreaterThan(0);
		expect(field.Density(-30, -4, 6)).toBeGreaterThan(0);
		/* Walked: the floor under a walker in the hall, the same as in a way. */
		expect(walk.Height(0, 0, -4)).toBeCloseTo(floor, 0);
		expect(walk.Height(-30, 0, -4)).toBeCloseTo(floor, 0);

		/* Rough: the walls move, the floor does not. */
		var moved = 0;

		[-50, -40, -30, -20, -10].forEach(function (x) {
			[1.6, 2.2, 2.8].forEach(function (z) {
				if (Math.abs(rough.Density(x, -3.5, z) - field.Density(x, -3.5, z)) > 0.05)
					moved++;
			});

			expect(rough.Density(x, floor + 0.2, 0)).toBeCloseTo(field.Density(x, floor + 0.2, 0), 6);
		});

		expect(moved).toBeGreaterThan(5);
		expect(field.Volume.Touches(-10, -10, 10, 10)).toBe(true);
		expect(field.Volume.Touches(-150, 100, -120, 140)).toBe(false);
	});

	/*
	 * Regression: a tunnel made each square in the box of all of it of the volume, though far from most, and the points
	 * of such a square where nothing is cut were off the heights: beside a square of heights, a step.
	 */
	it('makes of the volume only the squares near a tunnel, and puts the points of one where nothing is cut on the heights', function () {
		var options = {Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90};
		var field = terrain.Flat(Object.assign({}, options, {Carves: [{Type: 'tunnel', Points: [[-60, 0, 6], [60, 0, 6], [60, 120, 6]], Radius: 4}]}));
		var piece = field.Chunk(0, 20, 32, 16);
		var worst = 0;
		var i;

		/* In the box of the tunnel, far from its axis: of heights; across its axis or by it: of the volume. */
		expect(field.Volume.Touches(-40, 80, -20, 100)).toBe(false);
		expect(field.Chunk(-30, 90, 20, 16).Volume).toBeUndefined();
		expect(field.Volume.Touches(-10, -10, 10, 10)).toBe(true);
		expect(field.Volume.Touches(50, 50, 70, 70)).toBe(true);
		expect(field.Volume.Touches(-10, 4.2, 10, 20)).toBe(true);
		expect(piece.Volume).toBe(true);

		/* Its skirt, two cells under its edges, left out. */
		for (i = 0; i < piece.Positions.length; i += 3) {
			var off = Math.abs(piece.Positions[i + 1] - field.Height(piece.Positions[i], piece.Positions[i + 2] + 20));
			if (piece.Positions[i + 2] + 20 > 12 && piece.Normals[i + 1] > 0.5 && off < 1)
				worst = Math.max(worst, off);
		}

		expect(worst).toBeLessThan(1e-4);
	});

	it('makes natural caves of ways and halls under the ground in their band, and rock jutting out of steep slopes', function () {
		var options = {Size: 400, Height: 40, Water: 0, Seed: 'deep', Scale: 90};
		var plain = terrain.Flat(options);
		var field = terrain.Flat(Object.assign({}, options, {Carves: [{Type: 'caves', Center: [0, 0], Radius: 80, Top: 4, Bottom: 30, Scale: 20}, {Type: 'overhangs', Amount: 8, Slope: 0.2}]}));
		var hollow = 0;
		var under = 0;
		var x;
		var z;
		var y;

		for (x = -60; x <= 60; x += 6) {
			for (z = -60; z <= 60; z += 6) {
				for (y = -20; y <= 40; y += 3) {
					var depth = plain.Height(x, z) - y;

					if (depth > 6 && depth < 28) {
						under++;

						if (field.Density(x, y, z) < 0)
							hollow++;
					}

					/* Nothing cut out of the band above the caves. */
					if (depth > 0.5 && depth < 3 && field.Slope(x, z) < 0.05)
						expect(field.Density(x, y, z)).toBeGreaterThan(0);
				}
			}
		}

		expect(hollow / under).toBeGreaterThan(0.02);
		expect(hollow / under).toBeLessThan(0.6);
		expect(holes(field.Chunk(0, 0, 32, 16), 16)).toBe(0);
		expect(terrain.Flat(Object.assign({}, options, {Carves: [{Type: 'caves', Center: [0, 0], Radius: 80}]})).Volume.Touches(150, 150, 170, 170)).toBe(false);
	});

	it('tells each point of a square of a volume how much of the sky it sees: a tunnel under rock little, the ground over it all', function () {
		var options = {Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90};
		var field = terrain.Flat(Object.assign({}, options, {Carves: [{Type: 'tunnel', Points: [[-60, 0, 2], [60, 0, 2]], Radius: 3}]}));
		var piece = field.Chunk(0, 0, 32, 16);
		var inside = [];
		var over = [];
		var i;

		for (i = 0; i < piece.Positions.length / 3; i++) {
			var x = piece.Positions[i * 3];
			var y = piece.Positions[i * 3 + 1];
			var z = piece.Positions[i * 3 + 2];

			if (Math.abs(z) < 2.5 && Math.abs(x) < 12 && y < 4) inside.push(piece.UVs[i * 2 + 1]);
			else if (Math.abs(y - field.Height(x, z)) < 0.5 && Math.abs(z) > 8) over.push(piece.UVs[i * 2 + 1]);
		}

		expect(inside.length).toBeGreaterThan(10);
		expect(Math.max.apply(Math, inside)).toBeLessThan(0.25);
		expect(Math.min.apply(Math, over)).toBeGreaterThan(0.75);
		expect(terrain.Flat(options).Chunk(150, 150, 32, 16).UVs.filter(function (value, index) {
			return index % 2 === 1 && value !== 1;
		})).toEqual([]);
	});

	it('makes a square of a volume in a worker as in the page', async function () {
		var options = {Size: 300, Height: 30, Water: 0, Seed: 'work', Carves: [{Type: 'sphere', At: [5, 10, 5], Radius: 6}]};
		var here = terrain.Flat(options).Chunk(0, 0, 32, 16);
		var piece = await new Promise(function (done, failed) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', options, null, [0, 0, 32, 16]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(Array.from(piece.Positions)).toEqual(Array.from(new Float32Array(here.Positions)));
		expect(Array.from(piece.Indices)).toEqual(here.Indices);
	});
});

describe('Regression: the numbers of a flat map told once', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:SceneWorld', 'service:Blueprints', 'service:Noise', 'service:Math', 'service:Random', 'service:Workers']);
	});

	/* Size 1000, Height 60, Water 0.35, Scale 180, Ridges 0.4 and the radius of a tunnel were told again in each place. */
	it('starts Flat, LibraryRelief and the blocks of SceneWorld from FlatOf and TunnelRadius', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var flat = terrain.FlatOf({});
		var blueprints = Elemenx.Service('Blueprints');
		var relief = terrain.LibraryRelief({});
		var field = terrain.Flat({});

		function defaults (type) {
			var made = {};

			blueprints.NodeOf(type).Properties.forEach(function (property) {
				made[property.Key] = property.Value;
			});

			return made;
		}

		Elemenx.Service('SceneWorld').Steps();

		expect(flat).toEqual({Seed: 'ground', Size: 1000, Height: 60, Water: 0.35, Scale: 180, Ridges: 0.4});
		expect(terrain.FlatOf({Height: 0, Water: 0, Ridges: 0}).Height).toBe(0);
		expect(field.Size).toBe(flat.Size);
		expect(field.Top).toBe(flat.Height);
		expect(relief.parameters.map(function (parameter) {
			return parameter.value;
		})).toEqual([flat.Scale, flat.Ridges, flat.Water, flat.Height].concat(relief.parameters.slice(4).map(function (parameter) {
			return parameter.value;
		})));
		expect(defaults('Ground')).toMatchObject({Size: flat.Size, Height: flat.Height, Water: flat.Water, Seed: flat.Seed});
		expect(defaults('Relief')).toMatchObject({Scale: flat.Scale, Ridges: flat.Ridges});
		expect(defaults('Tunnel').Radius).toBe(terrain.TunnelRadius);
		expect(terrain.TunnelRadius).toBe(2.5);
	});
});
