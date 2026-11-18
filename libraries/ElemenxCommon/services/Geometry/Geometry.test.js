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
		expect(geometry.Nearest([0, 0, 1, 0, 1, 0, 1, 0, 0], 0.9, 0.1, 0)).toEqual({Index: 2, Near: Math.sqrt((1 - 0.9) * (1 - 0.9) + 0.1 * 0.1), Next: Math.sqrt(0.9 * 0.9 + 0.9 * 0.9)});
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
