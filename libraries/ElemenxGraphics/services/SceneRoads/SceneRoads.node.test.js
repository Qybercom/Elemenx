import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, 'SceneRoads.js'), 'utf8');

/* The SceneRoads Service, as the Library defines it. */
function create () {
	var definition;

	vm.runInNewContext(source, {
		Elemenx: {
			Service: function (name, value) {
				definition = value;
			}
		}
	});

	return Object.assign({}, definition);
}

describe('Regression: SceneRoads with large lists', function () {
	/* Merged passed all the numbers of a piece to push at once: the pieces of a long road overflowed the stack. */
	it('merges the pieces of a long road without running out of the stack, the indices of each after the ones before', function () {
		var roads = create();
		var big = {Positions: [], Normals: [], UVs: [], Indices: []};
		var made;
		var i;

		for (i = 0; i < 300000; i++) {
			big.Positions.push(i % 5);
			big.Normals.push(0);
			big.UVs.push(0);
			big.Indices.push(i % 3);
		}

		made = roads.Merged([big, big]);

		expect(made.Positions.length).toBe(600000);
		expect(made.Indices[300001]).toBe(1 + 100000);
	});
	/* A road was on another as far as it was across it, however far past its end: two in a line far apart met at a junction. */
	it('makes no junction of two roads in a line apart, nor of a road whose end lies only on the way of another, past its end', function () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		var network = roads.Network([
			{ID: 'a', Type: 'road', Points: [[0, 0], [0, 100]]},
			{ID: 'b', Type: 'road', Points: [[0, 200], [0, 300]]},
			{ID: 'c', Type: 'road', Points: [[-50, 150], [50, 150]]}
		], [{ID: 'cross', X: 0, Z: 250}]);

		expect(network.Junctions.map(function (junction) {
			return [junction.ID, junction.Roads];
		})).toEqual([['cross', ['b']]]);
		expect(roads.Near(network.Roads[0], 0, 160).Far).toBeCloseTo(60, 0);
		expect(Math.abs(roads.Near(network.Roads[0], 0, 160).Offset)).toBeLessThan(1);
	});

	/*
	 * What the tunnels of roads cut out of the ground: one box round the box of its lining, a metre wider on each side, from a
	 * metre under the road to 7 m over it, no crust kept. Regression: round bores side by side (one each 12 m of width) left
	 * the ground between them inside the lining of a motorway, a crust of earth hung in it where the hill was low, and a
	 * floor 0.2 m under the road came up through it.
	 */
	it('cuts one box round the lining of a tunnel, from before it to after it, a metre under the road and 7 m over it', function () {
		var roads = create();
		var points = [];
		var x;
		var road;
		var carves;

		for (x = 0; x <= 200; x += 5)
			points.push({X: x, Y: 10, Z: 0, Along: x, Way: [1, 0]});

		road = {ID: 'tube', Width: 24, Height: 0, Points: points, Strips: [{Left: -12, Right: 0}, {Left: 0, Right: 12}], Spans: [{Kind: 'tunnel', From: 50, To: 150}, {Kind: 'bridge', From: 160, To: 190}]};
		carves = roads.Carves([road]);

		expect(carves.length).toBe(1);
		expect(carves[0]).toMatchObject({Type: 'tunnel', Road: 'tube', Width: 26, Height: 8});
		expect(carves[0].Crust).toBe(undefined);
		/* Over the middle of the road, from half its width before the tunnel to half its width after it. */
		expect(carves[0].Points[0][1]).toBeCloseTo(0, 6);
		expect(carves[0].Points[0][0]).toBeCloseTo(50 - 13, 6);
		expect(carves[0].Points[carves[0].Points.length - 1][0]).toBeCloseTo(150 + 13, 6);
		/* Its axis half its height over its floor, a metre under the road. */
		expect(carves[0].Points[0][2] - carves[0].Height / 2).toBeCloseTo(9, 6);

		/* Off the middle of a road whose strips are not even round it: over the middle of the strips. */
		expect(roads.Carves([Object.assign({}, road, {Strips: [{Left: -12, Right: 4}]})])[0].Points[0][1]).toBeCloseTo(4, 6);
	});
});

describe('Regression: SceneRoads at one level where they meet', function () {
	function made () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		return roads;
	}

	/* The steepest rise of a road from point to point, over the run. */
	function steepest (road) {
		var most = 0;
		var i;

		for (i = 1; i < road.Points.length; i++)
			most = Math.max(most, Math.abs(road.Points[i].Y - road.Points[i - 1].Y) / Math.max(1e-6, road.Points[i].Along - road.Points[i - 1].Along));

		return most;
	}

	/*
	 * A street took the ground at its knots alone and went straight from one to the next, in a cut or on a bank across a
	 * hill. With Follow it keeps to the ground smoothed, no steeper than its grade; a knot of its own height keeps the old way.
	 */
	it('follows the ground between its knots no steeper than its grade, unless a knot tells its own height', function () {
		var roads = made();
		var hill = function (x) {
			return Math.max(0, 12 - Math.abs(x - 500) * 0.04);
		};
		var spike = function (x) {
			return Math.max(0, 12 - Math.abs(x - 500) * 0.4);
		};
		var line = roads.Line([[0, 0], [1000, 0]], {Follow: true, Height: hill, Grade: 0.05});
		var top = line.filter(function (point) {
			return Math.abs(point.X - 500) < 2;
		})[0];
		var told = roads.Line([[0, 0, 0], [1000, 0]], {Follow: true, Height: hill, Grade: 0.05});
		var through = roads.Line([[0, 0], [1000, 0]], {Follow: true, Height: spike, Grade: 0.05});

		expect(steepest({Points: line})).toBeLessThanOrEqual(0.05 + 1e-6);
		/* Over the hill, not through its foot: the old line lay flat at 0 under its top of 12 m. */
		expect(top.Y).toBeGreaterThan(10);
		expect(line[0].Y).toBeCloseTo(0, 1);
		/* A hill steeper than the grade: the line keeps its grade under it (a tunnel is found there), not up its sides. */
		expect(steepest({Points: through})).toBeLessThanOrEqual(0.05 + 1e-6);
		expect(through.filter(function (point) {
			return Math.abs(point.X - 500) < 2;
		})[0].Y).toBeLessThan(6);
		/* With a height of its own: straight from knot to knot (both 0 here), under the hill. */
		expect(told.filter(function (point) {
			return Math.abs(point.X - 150) < 2;
		})[0].Y).toBeCloseTo(0, 6);
	});

	it('climbs as steep as its kind and speed allow, or its own Grade', function () {
		var roads = made();

		expect(['rail', 'runway', 'track', 'motorway', 'road', 'country', 'street', 'path'].map(function (name) {
			return roads.Grade(roads.Type(name));
		})).toEqual([0.025, 0.015, 0.06, 0.05, 0.07, 0.09, 0.1, 0.15]);
		expect(roads.Grade({Group: 'road', Speed: 50, Grade: 0.12})).toBe(0.12);
	});

	/* The table of what two roads do where they cross: a junction, a level crossing, one over the other, an interchange. */
	it('meets as their kinds tell: streets and roads at a junction, a railway and a road at a level crossing, motorways at an interchange, the rest one over the other', function () {
		var roads = made();
		var meet = function (a, b) {
			return roads.Meeting(roads.Type(a), roads.Type(b));
		};

		expect([meet('street', 'road'), meet('country', 'dirt'), meet('rail', 'street'), meet('motorway', 'highway'), meet('motorway', 'street'), meet('rail', 'motorway'), meet('rail', 'rail-double'), meet('runway', 'road')]).toEqual(['junction', 'junction', 'crossing', 'interchange', 'over', 'over', 'over', 'over']);
	});

	it('makes a level crossing of a railway over a street, and no junction of a motorway over one', function () {
		var roads = made();
		var rail = roads.Network([{ID: 'r', Type: 'rail', Points: [[-100, 0], [100, 0]]}, {ID: 's', Type: 'street', Points: [[0, -100], [0, 100]]}], []);
		var over = roads.Network([{ID: 'm', Type: 'motorway', Points: [[-100, 0], [100, 0]]}, {ID: 's', Type: 'street', Points: [[0, -100], [0, 100]]}], []);

		expect(rail.Junctions.map(function (junction) {
			return junction.Kind;
		})).toEqual(['railway']);
		expect(over.Junctions).toEqual([]);
	});

	/*
	 * Two streets 6 m apart where they crossed met in nothing, one on its bank over the other, and each junction pulled a road
	 * over Blend in turn, the later undoing the earlier, a step of metres left. Now each junction is at one level, the roads
	 * in it at that level, from one junction to the next smoothly, past the last one back to their own over their grade.
	 */
	it('brings the roads to the one level of each junction, smoothly between junctions and back to their own past the last', function () {
		var roads = made();
		var network = roads.Network([
			{ID: 'a', Type: 'street', Points: [[0, -200, 0], [0, 200, 0]]},
			{ID: 'b', Type: 'street', Points: [[-200, 0, 6], [200, 0, 6]]},
			{ID: 'c', Type: 'street', Points: [[-200, 80, 0], [200, 80, 0]]}
		], []);
		var at = function (road, x, z) {
			return roads.Near(road, x, z).Y;
		};

		expect(network.Junctions.length).toBe(2);
		expect(network.Junctions.map(function (junction) {
			return +junction.Y.toFixed(3);
		}).sort()).toEqual([0, 3]);

		network.Junctions.forEach(function (junction) {
			junction.Roads.forEach(function (id) {
				var road = network.Roads.filter(function (one) {
					return one.ID === id;
				})[0];

				expect(at(road, junction.X, junction.Z)).toBeCloseTo(junction.Y, 3);
			});
		});

		/* No step on the way: from 3 m to 0 over the 53 m between the junctions, back from 3 m over 30 m (its grade 10%), a smooth curve half again as steep as the mean at most. */
		network.Roads.forEach(function (road) {
			expect(steepest(road)).toBeLessThan(0.16);
		});

		/* Back to its own far from them. */
		expect(at(network.Roads[0], 0, -190)).toBeCloseTo(0, 3);
		expect(at(network.Roads[1], 190, 0)).toBeCloseTo(6, 3);
	});

	it('tells the kind of a junction by its arms: T, Y, X, and a ring when told so or of five arms or more', function () {
		var roads = made();
		var kind = function (specs, given) {
			return roads.Network(specs, given || []).Junctions.map(function (junction) {
				return [junction.Kind, junction.Arms.length];
			});
		};
		var spoke = function (id, angle) {
			return {ID: id, Type: 'street', Points: [[Math.cos(angle) * 120, Math.sin(angle) * 120], [0, 0]]};
		};

		expect(kind([{ID: 'a', Type: 'street', Points: [[-100, 0], [100, 0]]}, {ID: 'b', Type: 'street', Points: [[0, 100], [0, 0]]}])).toEqual([['T', 3]]);
		expect(kind([{ID: 'a', Type: 'street', Points: [[-100, 0], [100, 0]]}, {ID: 'b', Type: 'street', Points: [[0, -100], [0, 100]]}])).toEqual([['X', 4]]);
		expect(kind([0, 1, 2].map(function (k) {
			return spoke('s' + k, Math.PI / 2 + k * Math.PI * 2 / 3);
		}), [{ID: 'y', X: 0, Z: 0}])).toEqual([['Y', 3]]);
		expect(kind([0, 1, 2, 3, 4].map(function (k) {
			return spoke('s' + k, k * Math.PI * 2 / 5);
		}), [{ID: 'five', X: 0, Z: 0}])).toEqual([['ring', 5]]);
		expect(kind([{ID: 'a', Type: 'street', Points: [[-100, 0], [100, 0]]}, {ID: 'b', Type: 'street', Points: [[0, -100], [0, 100]]}], [{ID: 'r', X: 0, Z: 0, Radius: 14, Kind: 'ring'}])).toEqual([['ring', 4]]);
	});

	/*
	 * The square of a junction was a disc as wide as its widest road, over the corners of the sidewalks and the ground
	 * between the roads; the strips went on through it, the sidewalks across it and into a roundabout up to its island.
	 */
	it('lays the square of a junction over the meeting of its roads alone, a ring round its island, and stops the strips at its edge', function () {
		var roads = made();
		var network = roads.Network([{ID: 'a', Type: 'street', Points: [[-100, 0], [100, 0]]}, {ID: 'b', Type: 'street', Points: [[0, -100], [0, 100]]}], []);
		var junction = network.Junctions[0];
		var half = network.Roads[0].Width / 2;
		var piece = roads.JunctionPiece(junction);
		var far = [];
		var i;

		for (i = 3; i < piece.Positions.length; i += 3)
			far.push(Math.hypot(piece.Positions[i] - junction.X, piece.Positions[i + 2] - junction.Z));

		expect(Math.max.apply(null, far)).toBeLessThanOrEqual(Math.hypot(junction.Radius, half) + 1e-6);
		/* Round the corners between the arms it bends in towards the corner of the sides of the roads, well short of the radius of a disc. */
		expect(Math.min.apply(null, far)).toBeLessThan(junction.Radius - 1);

		/* A ring: a band from the island to its radius, the island a kerb over it. */
		var ring = Object.assign({}, junction, {Kind: 'ring', Radius: 14});
		var band = roads.JunctionPiece(ring);
		var island = roads.JunctionIsland(ring);
		var reach = [];

		for (i = 0; i < band.Positions.length; i += 3)
			reach.push(Math.hypot(band.Positions[i] - ring.X, band.Positions[i + 2] - ring.Z));

		expect(Math.min.apply(null, reach)).toBeCloseTo(roads.IslandRadius(ring), 6);
		expect(Math.max.apply(null, reach)).toBeCloseTo(14, 6);
		expect(island.Positions[1]).toBeCloseTo(ring.Y + 0.15, 6);

		/* The sidewalks of the streets, as the Asset draws them: no deeper into the junction than their last step. */
		var asset = roads.Asset(network.Roads, {Junctions: network.Junctions});
		var paving = asset.Meshes[0].filter(function (mesh) {
			return asset.Materials[mesh.Material].Name === 'paving';
		})[0].Geometry;
		var inside = 0;

		for (i = 0; i < paving.Indices.length; i += 3) {
			var x = 0;
			var z = 0;

			[0, 1, 2].forEach(function (k) {
				x += paving.Positions[paving.Indices[i + k] * 3] / 3;
				z += paving.Positions[paving.Indices[i + k] * 3 + 2] / 3;
			});

			if (Math.hypot(x - junction.X, z - junction.Z) < junction.Radius - 3)
				inside++;
		}

		expect(paving.Indices.length).toBeGreaterThan(0);
		expect(inside).toBe(0);
	});

	/* The ground of a junction was levelled by a piece from one side of it to the other: twice its radius out along X. */
	it('levels the ground of a junction as a disc of its radius, not a piece across it', function () {
		var roads = made();
		var network = roads.Network([{ID: 'a', Type: 'street', Points: [[-100, 0], [100, 0]]}, {ID: 'b', Type: 'street', Points: [[0, -100], [0, 100]]}], []);
		var item = roads.Sketch(network.Roads, network.Junctions).filter(function (one) {
			return one.Road === network.Junctions[0].ID;
		})[0];

		expect(item.Width).toBeCloseTo(network.Junctions[0].Radius * 2, 6);
		expect(Math.hypot(item.Points[1][0] - item.Points[0][0], item.Points[1][1] - item.Points[0][1])).toBeLessThan(0.05);
		expect(item.Roads.sort()).toEqual(['a', 'b']);
	});
});
