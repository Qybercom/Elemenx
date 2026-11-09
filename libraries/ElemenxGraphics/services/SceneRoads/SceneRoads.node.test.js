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

describe('Regression: SceneRoads one over the other, and level crossings', function () {
	function made () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		return roads;
	}

	function flat () {
		return 0;
	}

	function steepest (road) {
		var most = 0;
		var i;

		for (i = 1; i < road.Points.length; i++)
			most = Math.max(most, Math.abs(road.Points[i].Y - road.Points[i - 1].Y) / Math.max(1e-6, road.Points[i].Along - road.Points[i - 1].Along));

		return most;
	}

	function named (network, id) {
		return network.Roads.filter(function (road) {
			return road.ID === id;
		})[0];
	}

	/*
	 * Roads that meet one over the other crossed on the ground, or metres apart (a motorway under a railway with 1.7 m over
	 * it). The one to go over climbs to the clearance of the other and the deck of its bridge, by its own grade, and a span
	 * lies over the other.
	 */
	it('lifts a road of the ground over a motorway and a motorway over a railway with wires, by their grades, a bridge over the other', function () {
		var roads = made();
		var street = roads.Network([{ID: 'm', Type: 'motorway', Points: [[-400, 0], [400, 0]]}, {ID: 's', Type: 'street', Points: [[0, -400], [0, 400]]}], [], {Height: flat});
		var rail = roads.Network([{ID: 'r', Type: 'rail-double', Points: [[-600, 0], [600, 0]]}, {ID: 'm', Type: 'motorway', Points: [[0, -600], [0, 600]]}], [], {Height: flat});
		var s = named(street, 's');
		var m = named(rail, 'm');

		expect(street.Junctions).toEqual([]);
		expect(roads.Near(named(street, 'm'), 0, 0).Y).toBeCloseTo(0, 6);
		expect(roads.Near(s, 0, 0).Y).toBeCloseTo(5.5 + 1.2, 3);
		expect(steepest(s)).toBeLessThanOrEqual(roads.Grade(s.Type) + 1e-6);
		expect(s.Spans).toEqual([{Kind: 'bridge', From: expect.any(Number), To: expect.any(Number), Over: 'm', Clear: [[400, expect.any(Number)]]}]);
		/* Over all the motorway, with room on each side. */
		expect(s.Spans[0].To - s.Spans[0].From).toBeGreaterThan(named(street, 'm').Width + 8);

		expect(roads.Near(m, 0, 0).Y).toBeCloseTo(7 + 1.2, 3);
		expect(steepest(m)).toBeLessThanOrEqual(0.05 + 1e-6);
		expect(m.Spans[0]).toMatchObject({Kind: 'bridge', Over: 'r'});
		expect(roads.Clearance(roads.Type('rail'))).toBe(5.5);
		expect(roads.Clearance({Group: 'road', Clearance: 4})).toBe(4);
	});

	it('sinks a road into a tunnel under an airfield, and deeper in a tunnel it is in already, a metre of ground over its cut', function () {
		var roads = made();
		var air = roads.Network([{ID: 'w', Type: 'runway', Points: [[-600, 0], [600, 0]]}, {ID: 'r', Type: 'road', Points: [[0, -600], [0, 600]]}], [], {Height: flat});
		var under = roads.Network([{ID: 'm', Type: 'motorway', Points: [[0, -400, 0], [0, 400, 0]], Tunnels: [[300, 500]]}, {ID: 'r', Type: 'rail', Points: [[-400, 0, 1.7], [400, 0, 1.7]]}], [], {Height: flat});

		expect(roads.Near(named(air, 'r'), 0, 0).Y).toBeCloseTo(-9, 3);
		expect(roads.Near(named(air, 'w'), 0, 0).Y).toBeCloseTo(0, 6);
		expect(named(air, 'r').Spans[0]).toMatchObject({Kind: 'tunnel', Under: 'w'});

		/* The railway 1.7 m over the motorway in its tunnel: the motorway down to 9 m under it, the railway kept. */
		expect(roads.Near(named(under, 'r'), 0, 0).Y).toBeCloseTo(1.7, 6);
		expect(roads.Near(named(under, 'm'), 0, 0).Y).toBeCloseTo(1.7 - 9, 3);
		expect(roads.SpanAt(named(under, 'm'), 400).Kind).toBe('tunnel');
	});

	/* A runway and its taxiway meet at one level; a road that ends on a motorway does not go over it (its way on is a ramp). */
	it('makes a junction of a runway and a taxiway, and no overpass of a road that ends on another', function () {
		var roads = made();
		var air = roads.Network([{ID: 'w', Type: 'runway', Points: [[-600, 0], [600, 0]]}, {ID: 't', Type: 'taxiway', Points: [[0, -300], [0, 300]]}], [], {Height: flat});
		var end = roads.Network([{ID: 'm', Type: 'motorway', Points: [[-400, 0], [400, 0]]}, {ID: 'g', Type: 'gravel', Points: [[0, 0], [0, 300]]}], [], {Height: flat});

		expect(roads.Meeting(roads.Type('runway'), roads.Type('taxiway'))).toBe('junction');
		expect(air.Junctions.length).toBe(1);
		expect(named(air, 't').Spans).toEqual([]);
		expect(named(end, 'g').Spans).toEqual([]);
		expect(Math.max.apply(null, named(end, 'g').Points.map(function (point) {
			return point.Y;
		}))).toBeCloseTo(0, 6);
	});

	/* The one pier of a short bridge stood in its middle, on the road it crossed: an overpass has an abutment at each end. */
	it('stands an overpass on an abutment at each end, none on the road under it', function () {
		var roads = made();
		var network = roads.Network([{ID: 'm', Type: 'motorway', Points: [[-400, 0], [400, 0]]}, {ID: 's', Type: 'country', Points: [[0, -400], [0, 400]]}], [], {Height: flat});
		var s = named(network, 's');
		var lower = named(network, 'm');
		var boxes = roads.Structures(s, flat).filter(function (piece) {
			/* A Box: 5 faces of 4 corners. */
			return piece.Positions.length === 60;
		});

		expect(boxes.length).toBe(2);

		boxes.forEach(function (box) {
			var z = 0;
			var i;

			for (i = 2; i < box.Positions.length; i += 3)
				z += box.Positions[i] / 20;

			expect(Math.abs(z)).toBeGreaterThan(lower.Width / 2 + 1);
		});
	});

	/*
	 * A level crossing: the road crossed at the foot of the bed of the railway, its rails half a metre over it. Now the deck
	 * is at their heads, the road up to it, the railway at its own level; its barriers on each road, down when Closed.
	 */
	it('lays a level crossing at the heads of the rails, the road up to it, its barriers down when it is closed', function () {
		var roads = made();
		var network = roads.Network([{ID: 'r', Type: 'rail', Points: [[-300, 0], [300, 0]]}, {ID: 's', Type: 'street', Points: [[0, -300], [0, 300]]}], [{ID: 'lc', X: 0, Z: 0, Closed: true}], {Height: flat});
		var junction = network.Junctions[0];
		var closed = roads.CrossingGear(junction);
		var open = roads.CrossingGear(Object.assign({}, junction, {Closed: false}));
		var tops = function (pieces) {
			return Math.max.apply(null, pieces.map(function (piece) {
				var top = -Infinity;
				var i;

				for (i = 1; i < piece.Positions.length; i += 3)
					top = Math.max(top, piece.Positions[i]);

				return top;
			}));
		};

		expect(junction).toMatchObject({Kind: 'railway', Closed: true});
		expect(junction.Deck).toBeCloseTo(0.3 + 0.17 - 0.045, 6);
		expect(roads.Near(named(network, 's'), 0, 0).Y).toBeCloseTo(junction.Deck, 6);
		expect(roads.Near(named(network, 'r'), 0, 0).Y).toBeCloseTo(0, 6);
		expect(roads.JunctionPiece(junction).Positions[1]).toBeCloseTo(junction.Deck + 0.012, 6);
		/* Two arms of the street, a barrier on each side of each: 4 posts and 4 posts of lights, 2 lights on each. */
		expect(closed.Posts.length).toBe(12);
		expect(closed.Lights.length).toBe(8);
		/* Down: the boom low across the road; up: standing over its post. */
		expect(tops(closed.Red.concat(closed.White))).toBeLessThan(junction.Deck + 3);
		expect(tops(open.Red)).toBeGreaterThan(tops(closed.Red));
		expect(roads.Asset(network.Roads, {Junctions: network.Junctions}).Materials.filter(function (material) {
			return material.Name === 'crossing-lights';
		})[0].Emissive[0]).toBeGreaterThan(1);
	});
});

describe('Regression: SceneRoads forks under the ground', function () {
	function made () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		return roads;
	}

	function hill (x, z) {
		return Math.max(0, 200 - Math.hypot(x, z) * 0.8);
	}

	function network (roads) {
		return roads.Network([{ID: 'main', Type: 'road', Structures: true, Points: [[-600, 0], [600, 0]]}, {ID: 'branch', Type: 'country', Structures: true, Points: [[0, -600], [0, 0]]}], [], {Height: hill});
	}

	function named (net, id) {
		return net.Roads.filter(function (road) {
			return road.ID === id;
		})[0];
	}

	/* One pass forth carried a hill on past its top: the road came down the far side late, on a bank or a bridge. */
	it('follows a hill alike on both sides, under it in a tunnel, down to the ground at both ends', function () {
		var roads = made();
		var line = roads.Line([[-600, 0], [600, 0]], {Follow: true, Height: hill, Grade: 0.07});
		var at = function (x) {
			return line.reduce(function (best, point) {
				return Math.abs(point.X - x) < Math.abs(best.X - x) ? point : best;
			}).Y;
		};

		[100, 250, 400, 590].forEach(function (x) {
			expect(at(x)).toBeCloseTo(at(-x), 1);
		});
		expect(line[line.length - 1].Y).toBeCloseTo(0, 1);
	});

	/*
	 * A junction was never under the ground: roads in their tunnels crossed or ended in one another in nothing, and their
	 * walls went on over the way of the other. Now they meet in a junction under it, at the level of the road through it.
	 */
	it('makes a junction under the ground where a road ends in the tunnel of another, at the level of that one', function () {
		var roads = made();
		var net = network(roads);
		var junction = net.Junctions[0];
		var main = named(net, 'main');
		var branch = named(net, 'branch');

		expect(net.Junctions.length).toBe(1);
		expect(junction).toMatchObject({Under: true, Kind: 'T', Roads: ['main', 'branch']});
		expect(roads.SpanAt(main, roads.Near(main, 0, 0).At).Kind).toBe('tunnel');
		expect(roads.SpanAt(branch, roads.Near(branch, 0, 0).At).Kind).toBe('tunnel');
		/* At the level of the road through it, which keeps its own; the branch comes to it. */
		expect(junction.Y).toBeCloseTo(roads.Line([[-600, 0], [600, 0]], {Follow: true, Height: hill, Grade: roads.Grade(roads.Type('road'))}).reduce(function (best, point) {
			return Math.abs(point.X) < Math.abs(best.X) ? point : best;
		}).Y, 3);
		expect(roads.Near(branch, 0, 0).Y).toBeCloseTo(junction.Y, 3);
		/* Its tunnels found on its new line: from its portal to its end in the junction. */
		expect(branch.Spans.length).toBe(1);
		expect(branch.Spans[0].To).toBeCloseTo(branch.Points[branch.Points.length - 1].Along, 3);

		/* The ground over it not levelled down to it (a pit in the hill); a chamber cut for it, a box round it. */
		expect(roads.Sketch(net.Roads, net.Junctions).filter(function (item) {
			return item.Road === junction.ID;
		})).toEqual([]);
		expect(roads.Carves(net.Roads, net.Junctions).filter(function (carve) {
			return carve.Road === junction.ID;
		})).toEqual([expect.objectContaining({Type: 'tunnel', Height: 8, Width: (junction.Radius + 1) * 2 + 2})]);

		/* A street over a tunnel is no junction under the ground: one on the ground meets the roads on it alone. */
		var over = roads.Network([{ID: 'tube', Type: 'road', Points: [[-300, 0, 0], [300, 0, 0]], Tunnels: [[100, 500]]}, {ID: 'top', Type: 'street', Points: [[0, -100, 30], [0, 100, 30]]}, {ID: 'side', Type: 'street', Points: [[-100, 0, 30], [0, 0, 30]]}], []);

		expect(over.Junctions.map(function (one) {
			return [one.Under, one.Roads.sort()];
		})).toEqual([[false, ['side', 'top']]]);
	});

	it('lines the chamber of a junction under the ground: a vault, and walls along its kerbs, none across the mouths of its arms', function () {
		var roads = made();
		var net = network(roads);
		var junction = net.Junctions[0];
		var vault = roads.JunctionVault(junction);
		var outline = roads.Outline(junction);
		var walls = outline.filter(function (point) {
			return point.Wall;
		}).length;
		var tops = [];
		var i;

		for (i = 1; i < vault.Positions.length; i += 3)
			tops.push(vault.Positions[i]);

		/* The vault: a fan of the outline; then a quad of each wall; then a collar at the mouth of each arm (vault, two walls). */
		expect(vault.Indices.length / 3).toBe(outline.length + walls * 2 + junction.Arms.length * 6);
		expect(outline.length - walls).toBe(3);
		expect(Math.max.apply(null, tops)).toBeCloseTo(junction.Y + 6, 6);
		expect(Math.min.apply(null, tops)).toBeCloseTo(junction.Y, 6);

		/* The tunnels of its roads: no portal in it, their walls not on through it. */
		var main = named(net, 'main');
		var boxes = roads.Structures(named(net, 'branch'), hill).filter(function (piece) {
			return piece.Positions.length === 60;
		});

		/* The portal of the branch at its mouth on the hill: two posts and a lintel; none at its end in the chamber. */
		expect(boxes.length).toBe(3);

		roads.Structures(main, hill).forEach(function (piece) {
			for (i = 0; i < piece.Indices.length; i += 3) {
				var x = 0;
				var z = 0;

				[0, 1, 2].forEach(function (k) {
					x += piece.Positions[piece.Indices[i + k] * 3] / 3;
					z += piece.Positions[piece.Indices[i + k] * 3 + 2] / 3;
				});

				expect(Math.hypot(x - junction.X, z - junction.Z)).toBeGreaterThan(junction.Radius - 0.5);
			}
		});
	});

	/* The tunnels of roads as a graph, the shape a graph of passages has: its portals and its forks, a way found through it. */
	it('makes a graph of the tunnels of roads, its portals and its junctions under the ground, that a route goes through', function () {
		var roads = made();
		var net = network(roads);
		var graph = roads.TunnelGraph(net.Roads, net.Junctions);
		var fork = graph.Nodes.filter(function (node) {
			return !node.Portal;
		});

		expect(graph.Nodes.length).toBe(4);
		expect(fork.map(function (node) {
			return [node.ID, node.Kind, node.Ways.length];
		})).toEqual([[net.Junctions[0].ID, 'fork', 3]]);
		expect(graph.Ways.map(function (way) {
			return way.Road;
		}).sort()).toEqual(['branch', 'main', 'main']);

		graph.Ways.forEach(function (way) {
			expect(way.Points.length).toBeGreaterThan(2);
			expect(way.Length).toBeGreaterThan(100);
		});
	});
});

describe('Regression: SceneRoads on viaducts and over water', function () {
	function made () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		return roads;
	}

	function steepest (road) {
		var most = 0;
		var i;

		for (i = 1; i < road.Points.length; i++)
			most = Math.max(most, Math.abs(road.Points[i].Y - road.Points[i - 1].Y) / Math.max(1e-6, road.Points[i].Along - road.Points[i - 1].Along));

		return most;
	}

	/* Elevated: a road over a town or a marsh went on its ground; now on piers so high over it, up and down by its grade. */
	it('raises a road on a viaduct where it is told, so high over the ground, coming up and down to it by its grade', function () {
		var roads = made();
		var flat = function () {
			return 1;
		};
		var road = roads.Network([{ID: 'e', Type: 'country', Points: [[0, 0], [600, 0]], Elevated: [[200, 400, 8]]}], [], {Height: flat}).Roads[0];
		var span = road.Spans[0];

		expect(roads.Near(road, 300, 0).Y).toBeCloseTo(9, 6);
		expect(roads.Near(road, 200, 0).Y).toBeCloseTo(9, 6);
		expect(roads.Near(road, 20, 0).Y).toBeCloseTo(1, 6);
		expect(steepest(road)).toBeLessThanOrEqual(roads.Grade(road.Type) + 1e-6);
		/* Its viaduct over all of it more than 2 m over the ground, wider than the range told. */
		expect(span).toMatchObject({Kind: 'bridge', Viaduct: true});
		expect(span.From).toBeLessThan(200);
		expect(span.To).toBeGreaterThan(400);
	});

	/* A road over a deep valley was carried on a bank tens of metres high: over a bank of more than 8 m, a viaduct. */
	it('carries a road over a deep valley on a viaduct in place of a bank higher than 8 m, unless told not to', function () {
		var roads = made();
		var valley = function (x) {
			return Math.abs(x - 300) < 100 ? 0.5 : 30;
		};
		var spec = {ID: 'v', Type: 'road', Points: [[0, 0, 30], [600, 0, 30]]};
		var road = roads.Network([spec], [], {Height: valley}).Roads[0];
		var none = roads.Network([Object.assign({}, spec, {Viaducts: false})], [], {Height: valley}).Roads[0];
		var low = roads.Network([Object.assign({}, spec, {Points: [[0, 0, 6], [600, 0, 6]]})], [], {Height: function (x) {
			return Math.abs(x - 300) < 100 ? 0.5 : 6;
		}}).Roads[0];

		expect(road.Spans).toEqual([expect.objectContaining({Kind: 'bridge', Viaduct: true})]);
		expect(road.Spans[0].From).toBeLessThanOrEqual(202);
		expect(road.Spans[0].To).toBeGreaterThanOrEqual(398);
		expect(none.Spans).toEqual([]);
		/* A bank of 5.5 m stays a bank. */
		expect(low.Spans).toEqual([]);
	});

	/* A motorway ran on the sea at its level: over water a road keeps 5.5 m over it, on a bridge, however short the water. */
	it('takes a road over water on a bridge 5.5 m over it, the ground under the level of the sea', function () {
		var roads = made();
		var river = function (x) {
			return Math.abs(x - 300) < 15 ? -2 : 1;
		};
		var road = roads.Network([{ID: 'r', Type: 'road', Points: [[0, 0], [600, 0]]}], [], {Height: river}).Roads[0];
		var wet = road.Spans.filter(function (span) {
			return span.From <= 286 && span.To >= 314;
		});

		expect(roads.Near(road, 300, 0).Y).toBeCloseTo(5.5, 1);
		expect(roads.Near(road, 20, 0).Y).toBeCloseTo(1, 1);
		expect(wet.length).toBe(1);
		expect(steepest(road)).toBeLessThanOrEqual(roads.Grade(road.Type) + 1e-6);
	});

	/* The piers of a viaduct: a cap under the deck on two columns of a wide road, one of a narrow one. */
	it('stands a viaduct on piers of a cap on columns, two of a road wider than 12 m, one of a narrower one', function () {
		var roads = made();
		var flat = function () {
			return 0;
		};
		var boxes = function (type) {
			var road = roads.Network([{ID: 'e', Type: type, Points: [[0, 0], [600, 0]], Elevated: [[200, 400, 10]]}], [], {Height: flat}).Roads[0];

			return roads.Structures(road, flat).filter(function (piece) {
				return piece.Positions.length === 60;
			}).length;
		};
		var span = function (type) {
			var road = roads.Network([{ID: 'e', Type: type, Points: [[0, 0], [600, 0]], Elevated: [[200, 400, 10]]}], [], {Height: flat}).Roads[0];

			return road.Spans[0].To - road.Spans[0].From;
		};
		var count = function (type) {
			return Math.max(1, Math.round(span(type) / 25)) - 1;
		};

		expect(boxes('country')).toBe(count('country') * 2);
		expect(boxes('motorway')).toBe(count('motorway') * 3);
	});
});

describe('Contract: SceneRoads interchanges', function () {
	function made () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		return roads;
	}

	function flat () {
		return 1;
	}

	function steepest (road) {
		var most = 0;
		var i;

		for (i = 1; i < road.Points.length; i++)
			most = Math.max(most, Math.abs(road.Points[i].Y - road.Points[i - 1].Y) / Math.max(1e-6, road.Points[i].Along - road.Points[i - 1].Along));

		return most;
	}

	function cross (roads, a, b, told) {
		return roads.Network([{ID: 'A', Type: a, Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: b, Points: [[0, -1000], [0, 1000]]}], told ? [{ID: 'told', X: 0, Z: 0, Kind: told}] : [], {Height: flat});
	}

	it('finds the form of an interchange by the kinds of the two roads: stack, cloverleaf, diamond, trumpet, or none', function () {
		var roads = made();
		var form = function (a, b, ending) {
			return roads.InterchangeForm(roads.Type(a), roads.Type(b), ending);
		};

		expect([form('motorway', 'motorway'), form('motorway', 'highway'), form('motorway', 'road'), form('highway', 'road'), form('motorway', 'country'), form('motorway', 'street'), form('road', 'motorway', true), form('country', 'motorway', true), form('gravel', 'motorway', true)]).toEqual(['stack', 'cloverleaf', 'diamond', 'diamond', '', '', 'trumpet', 'trumpet', '']);
	});

	/* Each form: its ramps (one-way roads of type ramp) and the junctions they make on the other road, no steeper than a ramp may climb. */
	it('makes the ramps of each form, found or told, from the edge of the motorway to the other road, no steeper than a ramp may climb', function () {
		var roads = made();
		var grade = roads.Grade(roads.Type('ramp'));
		var shapes = {};

		[['diamond', 'motorway', 'road', null], ['cloverleaf', 'motorway', 'highway', null], ['stack', 'motorway', 'motorway', null], ['roundabout', 'motorway', 'road', 'roundabout'], ['cloverleaf', 'motorway', 'road', 'cloverleaf']].forEach(function (one) {
			var net = cross(roads, one[1], one[2], one[3]);
			var ramps = net.Roads.filter(function (road) {
				return road.Ramp;
			});

			shapes[one[0] + (one[3] ? ' told' : '')] = [net.Interchanges.map(function (inter) {
				return inter.Form;
			}).join(), ramps.length, net.Junctions.map(function (junction) {
				return junction.Kind;
			}).sort().join()];

			ramps.forEach(function (ramp) {
				expect(ramp.TypeName).toBe('ramp');
				expect(steepest(ramp)).toBeLessThanOrEqual(grade + 1e-6);
			});
		});

		expect(shapes).toEqual({'diamond': ['diamond', 4, 'X,X'], 'cloverleaf': ['cloverleaf', 8, ''], 'stack': ['stack', 4, ''], 'roundabout told': ['roundabout', 4, 'ring,ring'], 'cloverleaf told': ['cloverleaf', 8, '']});
		/* None told: an overpass alone. */
		expect(cross(roads, 'motorway', 'road', 'none').Interchanges).toEqual([]);
	});

	it('ends a ramp of a diamond on the other road at its level, and starts it at the edge of the motorway at the level of that', function () {
		var roads = made();
		var net = cross(roads, 'motorway', 'road');
		var A = net.Roads[0];
		var B = net.Roads[1];

		net.Roads.filter(function (road) {
			return road.Ramp;
		}).forEach(function (ramp) {
			var first = ramp.Points[0];
			var last = ramp.Points[ramp.Points.length - 1];
			var onA = roads.Near(A, first.X, first.Z);
			var onB = roads.Near(B, last.X, last.Z);

			expect(Math.abs(onA.Offset)).toBeCloseTo(A.Width / 2 - 3, 0);
			expect(first.Y).toBeCloseTo(onA.Y, 1);
			expect(onB.Far).toBeLessThan(1);
			expect(last.Y).toBeCloseTo(onB.Y, 1);
		});
	});

	/* A road of 70 km/h or more that ends on a motorway: cut back from it, a ring at its head, two ramps over the motorway. */
	it('makes a trumpet of a road that ends on a motorway: the road cut back, a ring at its head, two ramps over the motorway', function () {
		var roads = made();
		var net = roads.Network([{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'road', Points: [[0, -800], [0, 0]]}], [], {Height: flat});
		var B = net.Roads[1];
		var over = net.Roads.filter(function (road) {
			return road.Ramp && road.Spans.some(function (span) {
				return span.Over === 'A';
			});
		});

		expect(net.Interchanges.map(function (one) {
			return one.Form;
		})).toEqual(['trumpet']);
		expect(B.Points[B.Points.length - 1].Z).toBeLessThan(-(net.Roads[0].Width / 2 + 100));
		expect(net.Junctions.map(function (junction) {
			return [junction.Kind, junction.Roads.length];
		})).toEqual([['ring', 5]]);
		expect(over.length).toBe(2);

		over.forEach(function (ramp) {
			expect(Math.max.apply(null, ramp.Points.map(function (point) {
				return point.Y;
			}))).toBeGreaterThan(1 + 6.7);
		});
	});

	/*
	 * Regressions: a road over a hill a motorway went under in a tunnel got ramps down to it; a short piece (a sample of a
	 * gallery) got one; a road that ends on a motorway met it at a junction of one level; a crossing at a corner of the lines
	 * made two.
	 */
	it('makes none where the motorway is in a tunnel there, of a short piece of road, or a junction of a road ending on a motorway', function () {
		var roads = made();
		var tunnel = roads.Network([{ID: 'A', Type: 'motorway', Points: [[-1000, 0, 1], [1000, 0, 1]], Tunnels: [[900, 1100]]}, {ID: 'B', Type: 'road', Points: [[0, -1000], [0, 1000]]}], [], {Height: function () {
			return 1;
		}});
		var short = roads.Network([{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'road', Points: [[0, -60], [0, 60]]}], [], {Height: flat});
		var corner = roads.Network([{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [0, 0], [1000, 0]], Straight: true}, {ID: 'B', Type: 'road', Points: [[0, -1000], [0, 0], [0, 1000]], Straight: true}], [], {Height: flat});
		var ending = roads.Network([{ID: 'A', Type: 'motorway', Points: [[-1000, 0], [1000, 0]]}, {ID: 'B', Type: 'gravel', Points: [[0, -800], [0, 0]]}], [], {Height: flat});

		expect(tunnel.Interchanges).toEqual([]);
		expect(short.Interchanges).toEqual([]);
		expect(corner.Interchanges.length).toBe(1);
		expect(ending.Interchanges).toEqual([]);
		expect(ending.Junctions).toEqual([]);
	});

	/* A long span over several overlapped them, joined to the first alone. */
	it('joins a span to all of its kind it overlaps', function () {
		var roads = made();
		var road = roads.Road({ID: 'r', Type: 'road', Points: [[0, 0], [1000, 0]]});

		road.Spans = [];

		roads.Span(road, {Kind: 'bridge', From: 100, To: 200});
		roads.Span(road, {Kind: 'bridge', From: 300, To: 400, Over: 'x'});
		roads.Span(road, {Kind: 'tunnel', From: 500, To: 600});
		roads.Span(road, {Kind: 'bridge', From: 50, To: 450, Viaduct: true});

		expect(road.Spans.map(function (span) {
			return [span.Kind, span.From, span.To, span.Over || '', !!span.Viaduct];
		})).toEqual([['bridge', 50, 450, 'x', true], ['tunnel', 500, 600, '', false]]);
	});

	/* A ramp narrow and bent round a hill was under the coarse squares of the ground: its ground is level wider. */
	it('levels the ground of a ramp wider than the ramp, and grasses over the vault of a tunnel', function () {
		var roads = made();
		var net = cross(roads, 'motorway', 'road');
		var ramp = net.Roads.filter(function (road) {
			return road.Ramp;
		})[0];
		var item = roads.Sketch([ramp], []).filter(function (one) {
			return one.Type === 'road';
		})[0];
		var tube = roads.Road({ID: 't', Type: 'road', Points: [[0, 0, 0], [300, 0, 0]], Tunnels: [[100, 200]]});
		var asset = roads.Asset([tube], {});

		expect(item.Width).toBe(ramp.Width + 6);
		expect(item.Shoulder).toBe(4);
		expect(asset.Materials.map(function (material) {
			return material.Name;
		})).toContain('grass');
	});
});

describe('Regression: SceneRoads over a gorge', function () {
	/* A track went down into a canyon to its floor (under the sea), and into tunnels in its walls: now over it from rim to rim. */
	it('goes over a gorge down under the sea from rim to rim, on a bridge, and not into its walls', function () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		var gorge = function (x) {
			var far = Math.abs(x - 300);

			return far < 20 ? -20 : far < 40 ? 20 - (40 - far) * 2 : 20;
		};
		var road = roads.Network([{ID: 'g', Type: 'track', Structures: true, Points: [[0, 0], [600, 0]]}], [], {Height: gorge}).Roads[0];

		/* Near the rims (20 m; the smoothing of 40 m takes a little of the walls), far over its floor and the 5.5 m of water. */
		expect(roads.Near(road, 300, 0).Y).toBeGreaterThan(14);
		expect(road.Spans.map(function (span) {
			return span.Kind;
		})).toEqual(['bridge']);
	});
});
