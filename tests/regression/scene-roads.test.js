import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/*
 * SceneRoads: roads of any kind (motorways, streets, tracks, paths, runways, railways) as a line and a cross-section of
 * strips: what is under a point of them, the lines a ground is made level under and their model.
 */
describe('Contract: SceneRoads, roads of every kind, their lines, surfaces and models', function () {
	var roads;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneRoads', 'service:SceneRoadGenerator']);

		roads = Elemenx.Service('SceneRoads');
	});

	it('knows roads, streets, paths, tracks, runways and railways, each a cross-section of strips', function () {
		var types = roads.Types();

		expect(types).toEqual(expect.arrayContaining(['motorway', 'highway', 'road', 'country', 'street', 'avenue', 'alley', 'dirt', 'gravel', 'path', 'cycle', 'track', 'rally', 'runway', 'rail', 'rail-double', 'rail-narrow', 'tram', 'platform']));

		types.forEach(function (name) {
			var type = roads.Type(name);

			expect(type.Strips.length).toBeGreaterThan(0);

			type.Strips.forEach(function (strip) {
				expect(strip.Width).toBeGreaterThan(0);
				expect(roads.Surface(strip.Surface).Grip).toBeGreaterThan(0);
			});
		});

		expect(roads.Type('rail').Rails[0].Gauge).toBe(1.435);
		expect(roads.Type('rail-double').Rails.length).toBe(2);
		expect(roads.Type('rail-double').Catenary).toBe(true);
		expect(roads.Type('nothing')).toBeNull();
	});

	it('takes a type of its own and a surface of its own, and refuses a type of no strips', function () {
		roads.Surface('ice', {Color: [0.8, 0.9, 1], Grip: 0.1});
		roads.Define('winter', {Strips: [{Kind: 'lane', Width: 6, Surface: 'ice'}]});

		expect(roads.Types()).toContain('winter');
		expect(roads.Surface('ice').Grip).toBe(0.1);
		/* An unknown surface is asphalt. */
		expect(roads.Surface('nothing')).toBe(roads.Surface('asphalt'));

		expect(function () {
			roads.Define('empty', {Strips: []});
		}).toThrow('Elemenx SceneRoads: a type needs its Strips: empty');
	});

	it('makes a line smooth and even through its points, with its ways, metres and heights', function () {
		var line = roads.Line([[0, 0], [100, 0, 5], [100, 100]], {Step: 2, Height: function () {
			return 1;
		}});
		var first = line[0];
		var last = line[line.length - 1];

		expect(first.X).toBeCloseTo(0);
		expect(first.Y).toBeCloseTo(1);
		expect(last.X).toBeCloseTo(100);
		expect(last.Z).toBeCloseTo(100);
		expect(first.Way[0]).toBeGreaterThan(0.9);

		line.slice(1).forEach(function (point, index) {
			var step = point.Along - line[index].Along;

			expect(step).toBeGreaterThan(1.5);
			expect(step).toBeLessThan(3.5);
		});

		/* The bend is the way of the turn: the line turns from +x to +z. */
		expect(line.some(function (point) {
			return point.Bend > 0.01;
		})).toBe(true);

		expect(function () {
			roads.Line([[0, 0]]);
		}).toThrow('Elemenx SceneRoads: a line needs two points');
	});

	it('closes a ring on itself, and finds where a point is on it, near a hint', function () {
		var ring = roads.Road({ID: 'loop', Type: 'track', Closed: true, Points: [[0, 0], [200, 0], [200, 200], [0, 200]]});
		var first = ring.Points[0];
		var last = ring.Points[ring.Points.length - 1];
		var near = roads.Near(ring, 100, -3);
		var hinted = roads.Near(ring, 100, -3, near.Along);

		expect(Math.hypot(first.X - last.X, first.Z - last.Z)).toBeLessThan(3.5);
		expect(ring.Width).toBeCloseTo(34.4);
		expect(Math.abs(near.Offset)).toBeGreaterThan(1.5);
		expect(hinted.Along).toBe(near.Along);
		expect(hinted.Offset).toBeCloseTo(near.Offset);
	});

	it('tells what is under a point: its strip, surface, height and grip, the higher of two roads, none off them', function () {
		var street = roads.Road({ID: 'main', Type: 'street', Points: [[-50, 0], [50, 0]]});
		var bridge = roads.Road({ID: 'over', Type: 'road', Height: 6, Points: [[0, -50], [0, 50]]});
		var middle = roads.Under([street], 0, 0);
		var walk = roads.Under([street], 0, street.Strips[0].Left + 1);
		var both = roads.Under([street, bridge], 0, 0);

		expect(middle).toMatchObject({Road: 'main', Strip: 'lane', Surface: 'asphalt', Grip: 1, Drag: 0});
		expect(middle.Height).toBeCloseTo(0);

		/* x along +x: the left is +z here, and a sidewalk is raised over the road. */
		expect(roads.Under([street], 0, -street.Strips[0].Left - 1).Strip).toBe('sidewalk');
		expect(walk.Strip).toBe('sidewalk');
		expect(walk.Height).toBeCloseTo(0.15);

		expect(both.Road).toBe('over');
		expect(both.Height).toBeCloseTo(6);
		expect(roads.Under([street], 0, 40)).toBeNull();
	});

	it('scales the strips of a type to a width given', function () {
		var narrow = roads.Road({Type: 'road', Width: 6, Points: [[0, 0], [10, 0]]});

		expect(narrow.Width).toBe(6);
		expect(narrow.Strips[0].Left).toBeCloseTo(-3);
		expect(narrow.Strips[narrow.Strips.length - 1].Right).toBeCloseTo(3);
	});

	it('gives the lines a ground is made level under', function () {
		var road = roads.Road({Type: 'country', Points: [[0, 0, 2], [40, 0, 2]]});
		var sketch = roads.Sketch([road]);

		expect(sketch[0].Type).toBe('road');
		expect(sketch[0].Width).toBeCloseTo(road.Width);
		expect(sketch[0].Points[0]).toEqual([road.Points[0].X, road.Points[0].Z, 2]);
	});

	it('takes bridges and tunnels given, or finds them where the road leaves the ground, and levels no ground there', function () {
		/* A valley from 40 to 80 metres and a hill from 120 to 160, the road level over both. */
		var height = function (x) {
			if (x > 40 && x < 80) return 0;
			if (x > 120 && x < 160) return 30;

			return 10;
		};
		var found = roads.Road({ID: 'pass', Type: 'road', Structures: true, Points: [[0, 0, 10], [200, 0, 10]]}, {Height: height});
		var given = roads.Road({ID: 'given', Type: 'road', Bridges: [[60, 20]], Tunnels: [[100, 130]], Points: [[0, 0, 10], [200, 0, 10]]});
		var sketch = roads.Sketch([found]);
		var asset = roads.Asset([found], {Height: height});

		expect(found.Spans.map(function (span) {
			return span.Kind;
		})).toEqual(['bridge', 'tunnel']);
		expect(found.Spans[0].From).toBeGreaterThan(36);
		expect(found.Spans[0].To).toBeLessThan(84);
		expect(found.Spans[1].From).toBeGreaterThan(116);

		expect(given.Spans).toEqual([{Kind: 'bridge', From: 20, To: 60}, {Kind: 'tunnel', From: 100, To: 130}]);
		expect(roads.SpanAt(given, 40).Kind).toBe('bridge');
		expect(roads.SpanAt(given, 80)).toBeNull();

		/* The ground is levelled under the road only where it lies on it: three pieces of it. */
		expect(sketch.length).toBe(3);

		sketch.forEach(function (item) {
			expect(item.Road).toBe('pass');

			item.Points.forEach(function (point) {
				expect(roads.SpanAt(found, point[0])).toBeNull();
			});
		});

		/* What it stands on and goes through is a model of its own. */
		expect(asset.Materials.map(function (material) {
			return material.Name;
		})).toContain('structure');

		/* A road over the ground with no structures has none. */
		expect(roads.Road({Type: 'road', Points: [[0, 0], [50, 0]]}).Spans).toEqual([]);
	});

	it('makes a model of the roads: their surfaces, markings, and the rails and sleepers of a railway', function () {
		var street = roads.Road({Type: 'street', Points: [[0, 0], [60, 0]]});
		var rail = roads.Road({Type: 'rail', Points: [[0, 20], [60, 20]]});
		var asset = roads.Asset([street, rail]);
		var names = asset.Materials.map(function (material) {
			return material.Name;
		});

		expect(names).toEqual(expect.arrayContaining(['asphalt', 'paving', 'concrete', 'marking', 'ballast', 'steel', 'wood']));
		expect(asset.Meshes[0].length).toBe(asset.Materials.length);

		asset.Meshes[0].forEach(function (part) {
			var geometry = part.Geometry;

			expect(geometry.Positions.length % 3).toBe(0);
			expect(geometry.Normals.length).toBe(geometry.Positions.length);
			expect(geometry.UVs.length / 2).toBe(geometry.Positions.length / 3);
			expect(geometry.Indices.length % 3).toBe(0);
			expect(Math.max.apply(null, geometry.Indices)).toBeLessThan(geometry.Positions.length / 3);
		});

		/* About 100 sleepers on 60 metres, every 0.6. */
		var wood = asset.Meshes[0][names.indexOf('wood')].Geometry;

		expect(wood.Indices.length / 30).toBeGreaterThan(90);
		expect(wood.Indices.length / 30).toBeLessThan(110);
		/* A single railway has no wires over it. */
		expect(names).not.toContain('mast');
	});

	it('hangs the wires of a railway or a tram on masts, and lays the rails of a tram in the road, with no sleepers', function () {
		var double = roads.Road({Type: 'rail-double', Points: [[0, 0], [200, 0]]});
		var tram = roads.Road({Type: 'tram', Points: [[0, 0], [100, 0]]});
		var catenary = roads.Catenary(double);
		var track = roads.Track(tram);
		var names = roads.Asset([tram]).Materials.map(function (material) {
			return material.Name;
		});

		/* A mast and an arm every 50 metres; a contact wire and the one that carries it over each track. */
		expect(catenary.Masts.length).toBe(8);
		expect(catenary.Wires.length).toBe(4);
		expect(Math.max.apply(null, catenary.Wires[0].Positions.filter(function (value, index) {
			return index % 3 === 1;
		}))).toBeCloseTo(5.5);

		expect(track.Sleepers).toEqual([]);
		expect(Math.max.apply(null, track.Rails[0].Positions.filter(function (value, index) {
			return index % 3 === 1;
		}))).toBeLessThan(0.05);
		expect(names).toEqual(expect.arrayContaining(['mast', 'wire', 'steel']));
	});
	it('has barriers only where asked, of their kinds, sides and stretches, and they stop what drives into them from either side', function () {
		var road = roads.Road({ID: 'b', Type: 'road', Width: 8, Barriers: [{Side: 'left', Kind: 'jersey'}, {Side: 'right', Kind: 'guardrail', From: 20, To: 60}], Points: [[0, 0], [100, 0]]});
		var bare = roads.Road({Type: 'road', Points: [[0, 0], [100, 0]]});
		var names = roads.Asset([road]).Materials.map(function (material) {
			return material.Name;
		});
		var through;

		expect(bare.Barriers).toEqual([]);
		expect(road.Barriers.map(function (one) {
			return [one.Kind, Math.round(one.Offset * 10) / 10, one.Height, one.From, Math.round(one.To)];
		})).toEqual([['jersey', -4.3, 0.9, 0, 100], ['guardrail', 4.3, 0.8, 20, 60]]);
		expect(names).toEqual(expect.arrayContaining(['barrier-concrete', 'barrier-steel']));

		/* The left of a road along +x is +z: a corner past the jersey barrier is pushed back to the road. */
		through = roads.BarrierHit([road], 50, 4.5, 50, 2);

		expect(through.Depth).toBeCloseTo(0.45);
		expect(through.Normal[0]).toBeCloseTo(0);
		expect(through.Normal[1]).toBeCloseTo(-1);

		/* From the other side it holds as well; nothing at the right out of its stretch; nothing inside the road. */
		expect(roads.BarrierHit([road], 50, 4.1, 50, 6).Normal[1]).toBeCloseTo(1);
		expect(roads.BarrierHit([road], 50, -4.5, 50, -2)).not.toBeNull();
		expect(roads.BarrierHit([road], 80, -4.5, 80, -2)).toBeNull();
		expect(roads.BarrierHit([road], 50, 1, 50, 0)).toBeNull();
		expect(roads.BarrierHit([bare], 50, 9, 50, 0)).toBeNull();
	});
	it('finds the junctions of a network where roads cross or end on one another, brings the roads to one level there and stops their paint', function () {
		var height = function (x, z) {
			return 5 + x * 0.05 + z * 0.02;
		};
		var network = roads.Network([
			{ID: 'east', Type: 'road', Points: [[-100, 0], [100, 0]]},
			{ID: 'north', Type: 'road', Points: [[0, -100], [0, 100]]},
			{ID: 'spur', Type: 'country', Points: [[60, 80], [60, 0]]},
			{ID: 'over', Type: 'road', Bridges: [[0, 300]], Points: [[-100, 40], [100, -40]]}
		], [], {Height: height});
		var cross = network.Junctions.filter(function (one) {
			return Math.hypot(one.X, one.Z) < 1;
		})[0];
		var tee = network.Junctions.filter(function (one) {
			return Math.abs(one.X - 60) < 1 && Math.abs(one.Z) < 1;
		})[0];
		var east = network.Roads[0];
		var north = network.Roads[1];

		/* The crossing and the end of the spur; the road on a bridge meets none. */
		expect(network.Junctions.length).toBe(2);
		expect(cross.Roads).toEqual(['east', 'north']);
		expect(tee.Roads).toEqual(expect.arrayContaining(['east', 'spur']));
		expect(cross.Radius).toBeCloseTo(east.Width * 0.75 + 1);

		/* Both roads at the level of the crossing there; paint stops in it, not far from it. */
		expect(roads.Near(east, 0, 0).Y).toBeCloseTo(cross.Y, 1);
		expect(roads.Near(north, 0, 0).Y).toBeCloseTo(cross.Y, 1);
		expect(east.Points.filter(function (point) {
			return point.Cut;
		}).length).toBeGreaterThan(2);
		expect(roads.Near(east, -60, 0).Y).toBeCloseTo(height(-60, 0), 1);

		expect(roads.JunctionAt(network.Junctions, cross.Radius - 0.5, 0)).toBe(cross);
		expect(roads.JunctionAt(network.Junctions, 30, 30)).toBeNull();
		expect(roads.Asset([east], {Junctions: [cross]}).Meshes[0].length).toBeGreaterThan(0);

		/* None found when asked so; one given is kept, its radius its own. */
		expect(roads.Network([{Type: 'road', Points: [[-50, 0], [50, 0]]}, {Type: 'road', Points: [[0, -50], [0, 50]]}], [], {Junctions: false}).Junctions).toEqual([]);
		expect(roads.Network([{ID: 'a', Type: 'road', Points: [[-50, 0], [50, 0]]}], [{ID: 'square', X: 10, Z: 0, Radius: 12, Surface: 'cobbles'}]).Junctions[0]).toMatchObject({ID: 'square', Radius: 12, Surface: 'cobbles', Roads: ['a']});
	});

	it('levels the ground of a junction and lays lines of things beside a road, off its bridges', function () {
		var network = roads.Network([
			{ID: 'lit', Type: 'street', Bridges: [[80, 120]], Along: [{Type: 'row', Shapes: ['pole'], Spacing: 25, Side: 'both', Gap: 1}, {Type: 'hedge', Side: 'left'}], Points: [[0, 0], [200, 0]]},
			{ID: 'cross', Type: 'road', Points: [[40, -50], [40, 50]]}
		], []);
		var sketch = roads.Sketch(network.Roads, network.Junctions);
		var rows = sketch.filter(function (item) {
			return item.Type === 'row';
		});
		var hedge = sketch.filter(function (item) {
			return item.Type === 'hedge';
		})[0];
		var level = sketch.filter(function (item) {
			return item.Road === network.Junctions[0].ID;
		})[0];
		var lit = network.Roads[0];

		expect(rows.length).toBe(2);
		expect(rows[0]).toMatchObject({Shapes: ['pole'], Spacing: 25, Road: 'lit'});
		expect(rows[0].Side).toBeUndefined();
		/* Beside the edge of the street, a metre out of it, on both sides; the hedge on the left (+z) only. */
		expect(Math.abs(rows[0].Points[0][1])).toBeCloseTo(lit.Width / 2 + 1);
		expect(rows[0].Points[0][1] * rows[1].Points[0][1]).toBeLessThan(0);
		expect(hedge.Points[0][1]).toBeGreaterThan(0);
		expect(rows[0].Points.every(function (point) {
			return point[0] < 80 || point[0] > 120;
		})).toBe(true);

		expect(level).toMatchObject({Type: 'road', Width: network.Junctions[0].Radius * 2});
	});
	it('makes a closed track of a seed, the same each time, as long as asked, starting on its longest straight', function () {
		var generator = Elemenx.Service('SceneRoadGenerator');
		var made = generator.Track('t', {Length: 1500, Corners: 10});
		var road = roads.Road(made.Spec);
		var round = road.Points[road.Points.length - 1].Along + Math.hypot(road.Points[0].X - road.Points[road.Points.length - 1].X, road.Points[0].Z - road.Points[road.Points.length - 1].Z);
		var start = roads.Near(road, made.Start.X, made.Start.Z);

		expect(generator.Track('t', {Length: 1500, Corners: 10})).toEqual(made);
		expect(generator.Track('u', {Length: 1500, Corners: 10}).Spec.Points).not.toEqual(made.Spec.Points);
		expect(made.Spec).toMatchObject({Type: 'track', Closed: true, Barriers: [{Side: 'both', Kind: 'tyres', Gap: 2}], Marks: [{Kind: 'start', At: made.Start.At}]});
		expect(generator.Track('t', {Barrier: 'none'}).Spec.Barriers).toBeUndefined();
		expect(Math.abs(round - 1500)).toBeLessThan(30);

		/* On its line, along it, where it hardly bends. */
		expect(Math.abs(start.Offset)).toBeLessThan(0.01);
		expect(Math.abs(road.Points[start.Along].Bend)).toBeLessThan(0.05);
		expect(made.Start.Heading).toBeCloseTo(Math.atan2(road.Points[start.Along].Way[0], road.Points[start.Along].Way[1]), 1);
		expect(roads.Asset([road]).Materials.map(function (material) {
			return material.Name;
		})).toEqual(expect.arrayContaining(['mark-white', 'mark-black', 'mark-gantry', 'barrier-tyres']));
	});

	/* Scenery: a land of mountains for a long track, on its line what it goes under and over, mountains round it, a world to hold it. */
	it('makes the land of a track with its scenery: on its line a mountain, a canyon, a ridge and a valley, peaks round it, out of its way', function () {
		var generator = Elemenx.Service('SceneRoadGenerator');
		var made = generator.Track('t', {Length: 8000, Scenery: true});
		var road = roads.Road(made.Spec);
		var items = made.Sketch.Layers[0].Items;
		var peaks = items.filter(function (item) {
			return /peak/.test(item.ID);
		});
		var extent = Math.max.apply(null, road.Points.map(function (point) {
			return Math.max(Math.abs(point.X), Math.abs(point.Z));
		}));

		expect(made.Spec.Structures).toBe(true);
		expect(generator.Track('t', {Length: 8000}).Sketch).toBeUndefined();
		expect(items.filter(function (item) {
			return !/peak/.test(item.ID);
		}).map(function (item) {
			return item.Type;
		})).toEqual(['mountain', 'canyon', 'ridge', 'valley']);

		/* On its line: the middle of each. */
		items.slice(0, 4).forEach(function (item) {
			var at = item.At || item.Points[1];

			expect(roads.Near(road, at[0], at[1]).Far).toBeLessThan(1);
		});

		/* The peaks out of its way, and the world holds all. */
		expect(peaks.length).toBe(6);

		peaks.forEach(function (peak) {
			expect(Math.min.apply(null, road.Points.map(function (point) {
				return Math.hypot(point.X - peak.At[0], point.Z - peak.At[1]);
			}))).toBeGreaterThan(peak.Radius * 0.5);
		});

		expect(made.Size / 2).toBeGreaterThan(extent);
	});

	/* Regression (of Tracks): a step of the road threw a car up on a flat road; nearness to a point and not to the line misplaced a kerb. */
	it('says what a wheel stands on: smooth along the road all the way round, the grass beside it, near to its line', function () {
		var hills = function (x, z) {
			return 6 + Math.sin(x / 90) * 5 + Math.cos(z / 70) * 4;
		};
		var road = roads.Road(Elemenx.Service('SceneRoadGenerator').Track('under', {Length: 1200, Corners: 9}).Spec, {Height: hills});
		var points = road.Points;
		var worst = 0;
		var sharpest = 0;

		points.forEach(function (point, index) {
			var after = points[(index + 1) % points.length];
			var before = roads.Under([road], point.X, point.Z).Height;
			var j;

			expect(roads.Under([road], point.X, point.Z).Grip).toBe(1);

			for (j = 1; j <= 12; j++) {
				var height = roads.Under([road], point.X + (after.X - point.X) * j / 12, point.Z + (after.Z - point.Z) * j / 12).Height;

				worst = Math.max(worst, Math.abs(height - before));
				before = height;
			}

			if (Math.abs(point.Bend) > Math.abs(points[sharpest].Bend))
				sharpest = index;
		});

		expect(worst).toBeLessThan(0.05);

		var a = points[30];
		var off = roads.Under([road], a.X + a.Way[1] * 15, a.Z - a.Way[0] * 15);

		expect(off.Strip).toBe('verge');
		expect(off.Grip).toBeLessThan(1);
		expect(off.Drag).toBeGreaterThan(0);

		var from = points[sharpest];
		var to = points[(sharpest + 1) % points.length];

		expect(Math.abs(roads.Near(road, (from.X + to.X) / 2, (from.Z + to.Z) / 2).Offset)).toBeLessThan(0.01);

		/* With a hint it stays with the section it was told, where two lie close. */
		var far = Math.floor(points.length / 2);

		expect(roads.Near(road, a.X, a.Z, far).Along).not.toBe(30);
		expect(roads.Near(road, a.X, a.Z, 28).Along).toBe(30);
	});
	it('makes its parts straight, arcs of a bulge or smooth, and rounds a corner between two straight parts by a radius', function () {
		var straight = roads.Line([[0, 0], [100, 0], [100, 100]], {Segments: ['line', 'line']});
		var arc = roads.Line([[0, 0], [100, 0]], {Segments: [{Kind: 'arc', Bulge: 20}]});
		var round = roads.Line([[0, 0], [100, 0], [100, 100]], {Segments: ['line', 'line'], Radii: [0, 30, 0]});
		var middle = arc.reduce(function (best, point) {
			return Math.abs(point.X - 50) < Math.abs(best.X - 50) ? point : best;
		});
		var radius = (50 * 50 + 20 * 20) / 40;
		var corner = round.filter(function (point) {
			return point.X > 70.5 && point.Z < 29.5;
		});

		/* Straight: along the axis, a sharp corner at 100, 0. */
		straight.forEach(function (point) {
			expect(Math.min(Math.abs(point.Z), Math.abs(point.X - 100))).toBeLessThan(1e-6);
		});

		/* An arc: its middle 20 metres to the left of the line (+z for a line along +x), every point on its circle. */
		expect(middle.Z).toBeCloseTo(20, 0);

		arc.forEach(function (point) {
			expect(Math.hypot(point.X - 50, point.Z - (20 - radius))).toBeCloseTo(radius, 1);
		});

		/* A corner rounded: no point near the sharp corner, every point near it on the circle of 30 round 70, 30. */
		expect(round.some(function (point) {
			return Math.hypot(point.X - 100, point.Z) < 5;
		})).toBe(false);
		expect(corner.length).toBeGreaterThan(5);

		corner.forEach(function (point) {
			expect(Math.hypot(point.X - 70, point.Z - 30)).toBeCloseTo(30, 0);
		});

		/* A road takes them from its spec; parts not given are smooth. */
		expect(roads.Road({Type: 'road', Segments: ['line', 'line'], Radii: [0, 30, 0], Points: [[0, 0], [100, 0], [100, 100]]}).Points.length).toBe(round.length);
		expect(roads.Line([[0, 0], [100, 0], [100, 100]]).some(function (point) {
			return point.X > 100.5;
		})).toBe(true);
	});
});
