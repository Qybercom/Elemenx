import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: Geometry, the lines, areas and points of a ground of one source, and its blocks of Blueprints', function () {
	var geometry;
	var blueprints;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Geometry', 'service:Blueprints', 'service:Noise']);

		geometry = Elemenx.Service('Geometry');
		blueprints = Elemenx.Service('Blueprints');
	});

	/* A cap of the sphere round the north pole drawn, and one round a point of the equator: how much of them a direction is. */
	it('tells how much of areas of directions drawn on a sphere a point is, the same of its block of numbers', function () {
		var ring = [0, 90, 180, 270].map(function (longitude) {
			var latitude = 60 * Math.PI / 180;
			var around = longitude * Math.PI / 180;

			return [Math.cos(latitude) * Math.cos(around), Math.sin(latitude), Math.cos(latitude) * Math.sin(around)];
		});
		var packed = [2, 4, 0.05].concat(ring[0], ring[1], ring[2], ring[3]).concat([3, 0.02]).concat([[1, 0.1, 0], [1, -0.1, 0.1], [1, -0.1, -0.1]].reduce(function (all, v) {
			var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

			return all.concat([v[0] / length, v[1] / length, v[2] / length]);
		}, []));
		var graph = blueprints.Create('generator', {name: 'Drawn', parameters: [{key: 'Areas', type: 'floats', value: packed}]});
		var made;

		blueprints.Add(graph, 'Parameter', {id: 'areas', properties: {Key: 'Areas', Type: 'floats'}});
		['X', 'Y', 'Z'].forEach(function (name) {
			blueprints.Add(graph, 'Input', {id: name, properties: {Name: name}});
		});
		blueprints.Add(graph, 'Painted', {id: 'drawn'});
		blueprints.Add(graph, 'Result', {id: 'out', properties: {Key: 'Value'}});
		blueprints.Link(graph, ['areas', 'Value'], ['drawn', 'Packed']);
		['X', 'Y', 'Z'].forEach(function (name) {
			blueprints.Link(graph, [name, 'Value'], ['drawn', name]);
		});
		blueprints.Link(graph, ['drawn', 'Value'], ['out', 'Value']);

		made = blueprints.NumericCode(graph, {});

		/* Well inside the cap, far out of both, inside the small one; none drawn: nothing. Its block of numbers the same. */
		expect(geometry.Painted(packed, 0, 1, 0)).toBe(1);
		expect(geometry.Painted(packed, 0, 0, -1)).toBe(0);
		expect(geometry.Painted(packed, 1, 0, 0)).toBe(1);
		expect(geometry.Painted([0], 0, 1, 0)).toBe(0);
		[[0, 1, 0], [0.8, 0.6, 0], [0, 0, -1], [1, 0, 0]].forEach(function (p) {
			expect(made.Run({}, {X: p[0], Y: p[1], Z: p[2]}).Value).toBe(geometry.Painted(packed, p[0], p[1], p[2]));
		});
	});

	/* A segment of a river along the equator, a tenth of a radian long, of no bend at its start (phase 0, seed 0). */
	it('finds the nearest river of segments packed and how far aside it bends, the same of its block of numbers', function () {
		var record = [1, 0, 0, Math.cos(0.1), 0, Math.sin(0.1), 100, 100, 50, 50, 0, 637.1, 0, 30, 0, -1, 0, 0];
		var bend = geometry.Bend(record, 0.5, 0.015, 11);
		var near = geometry.River([1].concat(record), Math.cos(0.05), 0.001, Math.sin(0.05), 6371, 0.015, 11);
		var graph = blueprints.Create('generator', {name: 'Riverside', parameters: [{key: 'Ways', type: 'floats', value: [1].concat(record)}]});

		/* Twice its width aside at most (width 0.015 km by the root of its flow), none at its start. */
		expect(geometry.Bend(record, 0, 0.015, 11)).toBe(0);
		expect(Math.abs(bend)).toBeLessThanOrEqual(2 * 0.015 * 10);
		expect(near.Flow).toBe(100);
		expect(near.Level).toBe(50);
		/* The point to the north, the side of cross(A, B) to the south: its bend away from it. */
		expect(near.Far).toBeCloseTo(6.371 + bend, 2);
		expect(geometry.River([0], 1, 0, 0, 6371, 0.015, 11).Far).toBe(Infinity);

		blueprints.Add(graph, 'Parameter', {id: 'ways', properties: {Key: 'Ways', Type: 'floats'}});
		blueprints.Add(graph, 'River', {id: 'river', properties: {}});
		blueprints.Add(graph, 'Number', {id: 'x', properties: {Value: Math.cos(0.05)}});
		blueprints.Add(graph, 'Number', {id: 'y', properties: {Value: 0.001}});
		blueprints.Add(graph, 'Number', {id: 'z', properties: {Value: Math.sin(0.05)}});
		blueprints.Add(graph, 'Number', {id: 'radius', properties: {Value: 6371}});
		blueprints.Add(graph, 'Result', {id: 'out', properties: {Key: 'Far'}});
		blueprints.Link(graph, ['ways', 'Value'], ['river', 'Packed']);
		['x', 'y', 'z', 'radius'].forEach(function (name) {
			blueprints.Link(graph, [name, 'Value'], ['river', name === 'radius' ? 'Radius' : name.toUpperCase()]);
		});
		blueprints.Link(graph, ['river', 'Far'], ['out', 'Value']);

		expect(blueprints.NumericCode(graph, {}).Run({}, {}).Far).toBe(near.Far);
	});

	/* A range along the equator from 0 to a tenth of a radian, 0.05 rad wide, 1000 high, falling to its sides squared. */
	it('gives what lines drawn on a sphere give a point, each by its fall to its sides, the same of its block of numbers', function () {
		var packed = [1, 2, 0.05, 1000, 2, 1, 0, 0, Math.cos(0.1), 0, Math.sin(0.1)];
		var graph = blueprints.Create('generator', {name: 'Ranged', parameters: [{key: 'Lines', type: 'floats', value: packed}]});

		expect(geometry.Strokes(packed, Math.cos(0.05), 0, Math.sin(0.05))).toBeCloseTo(1000, 6);
		expect(geometry.Strokes(packed, Math.cos(0.05) * Math.cos(0.025), Math.sin(0.025), Math.sin(0.05) * Math.cos(0.025))).toBeCloseTo(250, 6);
		expect(geometry.Strokes(packed, 0, 1, 0)).toBe(0);
		expect(geometry.Strokes([0], 1, 0, 0)).toBe(0);

		blueprints.Add(graph, 'Parameter', {id: 'lines', properties: {Key: 'Lines', Type: 'floats'}});
		blueprints.Add(graph, 'Number', {id: 'x', properties: {Value: Math.cos(0.05)}});
		blueprints.Add(graph, 'Number', {id: 'z', properties: {Value: Math.sin(0.05)}});
		blueprints.Add(graph, 'Strokes', {id: 'strokes'});
		blueprints.Add(graph, 'Result', {id: 'out', properties: {Key: 'Value'}});
		blueprints.Link(graph, ['lines', 'Value'], ['strokes', 'Packed']);
		blueprints.Link(graph, ['x', 'Value'], ['strokes', 'X']);
		blueprints.Link(graph, ['z', 'Value'], ['strokes', 'Z']);
		blueprints.Link(graph, ['strokes', 'Value'], ['out', 'Value']);

		expect(blueprints.NumericCode(graph, {}).Run({}, {}).Value).toBe(geometry.Strokes(packed, Math.cos(0.05), 0, Math.sin(0.05)));
	});

	/* A raise at the north pole, a tenth of a radian round, then a smooth over it toward 40 m. */
	it('changes a height by brushes along paths on a sphere in their order, the same of its block of numbers', function () {
		var packed = [2, 0, 1, 0.1, 100, 0, 0, 1, 0, Math.cos(0.1), 0, 1, 0, 3, 1, 0.1, 0.5, 0, 0, 1, 0, Math.cos(0.1), 0, 1, 0];
		var graph = blueprints.Create('generator', {name: 'Brushed', parameters: [{key: 'Brushes', type: 'floats', value: packed}, {key: 'Softs', type: 'floats', value: [0, 40]}]});
		var made;

		/* Its middle all of it, half way its (1 - t^2)^2, past it none. */
		expect(geometry.EditWeight(packed, 1, 0, 1, 0)).toBe(1);
		expect(geometry.EditWeight(packed, 1, Math.sin(0.05), Math.cos(0.05), 0)).toBeCloseTo(0.5625, 12);
		expect(geometry.EditWeight(packed, 1, Math.sin(0.2), Math.cos(0.2), 0)).toBe(0);
		/* Raised by 100, then half way to 40: 10 + (110 - 40) / 2 at the pole. */
		expect(geometry.Edits(packed, [0, 40], 0, 1, 0, 10)).toBe(75);
		expect(geometry.Edits(packed, [0, 40], 1, 0, 0, 10)).toBe(10);
		expect(geometry.Edits([0], [], 0, 1, 0, 10)).toBe(10);

		blueprints.Add(graph, 'Parameter', {id: 'brushes', properties: {Key: 'Brushes', Type: 'floats'}});
		blueprints.Add(graph, 'Parameter', {id: 'softs', properties: {Key: 'Softs', Type: 'floats'}});
		blueprints.Add(graph, 'Input', {id: 'height', properties: {Name: 'Height'}});
		blueprints.Add(graph, 'Number', {id: 'y', properties: {Value: 1}});
		blueprints.Add(graph, 'Edits', {id: 'edits'});
		blueprints.Add(graph, 'Result', {id: 'out', properties: {Key: 'Height'}});
		blueprints.Link(graph, ['brushes', 'Value'], ['edits', 'Packed']);
		blueprints.Link(graph, ['softs', 'Value'], ['edits', 'Softs']);
		blueprints.Link(graph, ['height', 'Value'], ['edits', 'Height']);
		blueprints.Link(graph, ['y', 'Value'], ['edits', 'Y']);
		blueprints.Link(graph, ['edits', 'Height'], ['out', 'Value']);

		made = blueprints.NumericCode(graph, {});

		expect(made.Run({}, {Height: 10}).Height).toBe(75);
	});

	/* A line of three pieces: the nearest point of it, how far along, on which side. */
	it('finds the nearest point of a line, how far along it, its side and its piece; whether a point is in an area', function () {
		var line = [0, 0, 10, 0, 10, 10];
		var square = [0, 0, 10, 0, 10, 10, 0, 10];

		expect(geometry.Line(line, 5, 3)).toEqual({Distance: 3, T: 0.25, Side: -1, Segment: 0});
		expect(geometry.Line(line, 13, 5)).toEqual({Distance: 3, T: 0.75, Side: 1, Segment: 1});
		expect(geometry.Line(line, 5, -2).Side).toBe(1);
		expect(geometry.Line([4, 4], 7, 8).Distance).toBe(5);
		expect(geometry.Area(square, 5, 5)).toEqual({Inside: true, Distance: 5});
		expect(geometry.Area(square, 13, 5)).toEqual({Inside: false, Distance: 3});
		expect(geometry.Fall(0, 10)).toBe(1);
		expect(geometry.Fall(5, 10)).toBeCloseTo(0.5, 12);
		expect(geometry.Fall(12, 10)).toBe(0);
	});

	it('gives the level of a line between those of its points, and the nearest of points of space and the next', function () {
		var line = [0, 0, 10, 0, 10, 10];

		expect(geometry.Level(line, [4, 2, 0], 5, 3)).toBe(3);
		expect(geometry.Level(line, [4, 2, 0], 12, 5)).toBe(1);
		expect(geometry.Nearest([0, 0, 1, 0, 1, 0, 1, 0, 0], 0.9, 0.1, 0)).toEqual({Index: 2, Near: Math.sqrt((1 - 0.9) * (1 - 0.9) + 0.1 * 0.1), Next: Math.sqrt(0.9 * 0.9 + 0.9 * 0.9), Other: 1});
	});

	/* A ridge of a sketch as a graph: its height by the distance to its line, the same run block by block, as js and as wasm. */
	it('makes a graph of its blocks a function of numbers: the points a list given, the same run, js and wasm', function () {
		var graph = blueprints.Create('generator', {name: 'Ridge'});
		var points = blueprints.Add(graph, 'Input', {properties: {Name: 'Points'}});
		var x = blueprints.Add(graph, 'Input', {properties: {Name: 'X'}});
		var z = blueprints.Add(graph, 'Input', {properties: {Name: 'Z'}});
		var line = blueprints.Add(graph, 'Line', {});
		var width = blueprints.Add(graph, 'Number', {properties: {Value: 6}});
		var fall = blueprints.Add(graph, 'Fall', {});
		var height = blueprints.Add(graph, 'Number', {properties: {Value: 15}});
		var times = blueprints.Add(graph, 'Multiply', {});
		var out = blueprints.Add(graph, 'Result', {properties: {Key: 'Height'}});
		var made;
		var wasm;
		var run;
		var path = [0, 0, 40, 10, 80, -5];
		var i;

		blueprints.Link(graph, [points.id, 'Value'], [line.id, 'Points']);
		blueprints.Link(graph, [x.id, 'Value'], [line.id, 'X']);
		blueprints.Link(graph, [z.id, 'Value'], [line.id, 'Z']);
		blueprints.Link(graph, [line.id, 'Distance'], [fall.id, 'Distance']);
		blueprints.Link(graph, [width.id, 'Value'], [fall.id, 'Radius']);
		blueprints.Link(graph, [fall.id, 'Out'], [times.id, 'A']);
		blueprints.Link(graph, [height.id, 'Value'], [times.id, 'B']);
		blueprints.Link(graph, [times.id, 'Out'], [out.id, 'Value']);

		made = blueprints.NumericCode(graph, {}, {Points: 'floats'});
		wasm = Elemenx.Compilers.Instance(blueprints.Wasm(made.Numeric));
		run = blueprints.Compile(graph).Run;

		expect(made.Numeric.Inputs).toEqual([{Name: 'Points', Type: 'floats'}, {Name: 'X', Type: 'float'}, {Name: 'Z', Type: 'float'}]);

		for (i = 0; i < 60; i++) {
			var px = i * 1.37;
			var pz = Math.sin(i) * 8;
			var told = made.Run({}, {Points: path, X: px, Z: pz}).Height;

			expect(told).toBe(15 * geometry.Fall(geometry.Line(path, px, pz).Distance, 6));
			expect(wasm.Functions.g_main(path, px, pz)).toBe(told);
			expect(run({}, {Points: path, X: px, Z: pz}).Height).toBe(told);
		}
	});

	/* Regression: a noise read once in a branch of ?: was computed at every point, before the formula (a cave slower as a graph). */
	it('computes what a formula reads once in a branch only when that branch is taken', function () {
		var graph = blueprints.Create('generator', {name: 'Rough'});
		var x = blueprints.Add(graph, 'Input', {properties: {Name: 'X'}});
		var noise = blueprints.Add(graph, 'Fbm', {properties: {Octaves: 2}});
		var formula = blueprints.Add(graph, 'Formula', {properties: {Expression: 'X > 0 ? X + N : X'}});
		var out = blueprints.Add(graph, 'Result', {properties: {Key: 'Value'}});
		var body;

		blueprints.Link(graph, [x.id, 'Value'], [formula.id, 'X']);
		blueprints.Link(graph, [noise.id, 'Value'], [formula.id, 'N']);
		blueprints.Link(graph, [formula.id, 'Value'], [out.id, 'Value']);

		body = blueprints.Numeric(graph, {}).Module.Functions[0].Body;

		expect(body.filter(function (statement) {
			return statement.Op === 'let' && JSON.stringify(statement.Value).indexOf('n_read') !== -1 && statement.Value.Op !== 'select';
		})).toEqual([]);
		expect(JSON.stringify(body)).toContain('"Op":"select"');
		expect(blueprints.NumericCode(graph, {}).Run({}, {X: -3}).Value).toBe(-3);
	});

	/* Regression: the blocks Tunnel and Passages took the names of the nodes of a graph of a world (SceneWorld), and one lost its own. */
	it('keeps its blocks of a cave under names of their own, beside the nodes of a world', function () {
		Use(['service:SceneWorld']);

		expect(blueprints.NodeOf('TunnelWall').Group).toBe('geometry');
		expect(blueprints.NodeOf('PassageWalls').Group).toBe('geometry');
		expect(blueprints.NodeOf('Tunnel').Group).not.toBe('geometry');
		expect(blueprints.NodeOf('Passages').Group).not.toBe('geometry');
		expect(geometry.Tunnel([0, 0, 0, 10, 0, 0], 5, 3, 0, 2, 0, 0, 0, 0)).toEqual({Distance: 1, Axis: 0});
	});
});
