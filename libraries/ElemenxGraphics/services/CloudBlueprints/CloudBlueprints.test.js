import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var clouds;
var blueprints;

/* A cloud graph of blocks told by type: [[id, type, properties]], links [[from, key, to, key]], its Cloud of properties. */
function cloudOf (blocks, links, properties) {
	var graph = blueprints.Create('cloud', {name: 'test'});

	blocks.concat([['cloud', 'Cloud', properties || {}]]).forEach(function (told) {
		blueprints.Add(graph, told[1], {id: told[0], properties: told[2] || {}});
	});

	links.forEach(function (link) {
		blueprints.Link(graph, [link[0], link[1]], [link[2], link[3]]);
	});

	return graph;
}

describe('CloudBlueprints: clouds of points of graphs', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['BlueprintPreview', 'service:CloudBlueprints', 'service:Blueprints']);

		clouds = Elemenx.Service('CloudBlueprints');
		blueprints = Elemenx.Service('Blueprints');
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('declares the kind cloud and its blocks to Blueprints', function () {
		expect(blueprints.Graphs()).toContain('cloud');

		['Cloud', 'Sphere', 'Shell', 'Disc', 'Spiral', 'Gauss', 'Plummer', 'Fibonacci', 'Pick', 'Blackbody'].forEach(function (type) {
			expect(blueprints.Nodes('cloud')).toContain(type);
		});

		/* Its blocks of numbers stand in any graph of numbers; Cloud only in a cloud. */
		expect(blueprints.Nodes('generator')).toContain('Sphere');
		expect(blueprints.Nodes('generator')).not.toContain('Cloud');
	});

	it('runs a graph once for each point, its fields, sizes and colors of each', function () {
		var graph = cloudOf([['index', 'Input', {Name: 'Index'}], ['half', 'Formula', {Expression: 'Index / 2'}], ['place', 'Fibonacci', {}]], [
			['index', 'Value', 'half', 'Index'],
			['index', 'Value', 'place', 'Index'],
			['half', 'Value', 'cloud', 'Size'],
			['half', 'Value', 'cloud', 'Half'],
			['place', 'Point', 'cloud', 'Position']
		], {Count: 5, Fields: 'Half, Count, Half'});
		var made;

		/* Fibonacci reads the Count of the cloud: linked to it through an Input. */
		blueprints.Add(graph, 'Input', {id: 'count', properties: {Name: 'Count'}});
		blueprints.Link(graph, ['count', 'Value'], ['place', 'Count']);

		made = clouds.Points(graph);

		expect(made.Count).toBe(5);
		expect(Object.keys(made.Fields)).toEqual(['Half']);
		expect(Array.from(made.Fields.Half)).toEqual([0, 0.5, 1, 1.5, 2]);
		expect(Array.from(made.Sizes)).toEqual([0, 0.5, 1, 1.5, 2]);
		expect(made.Colors).toBe(null);
		expect(made.Positions.length).toBe(15);
		/* The first of a spiral of Fibonacci of five, near the top of the ball. */
		expect(made.Positions[1]).toBeCloseTo(0.8, 5);
	});

	it('drops the points not kept and those nearer than Least to one kept', function () {
		var odd = cloudOf([['index', 'Input', {Name: 'Index'}], ['test', 'Formula', {Expression: 'Index - floor(Index / 2) * 2'}], ['one', 'Number', {Value: 1}], ['keep', 'Compare', {Operator: '=='}], ['line', 'Combine', {}]], [
			['index', 'Value', 'test', 'Index'],
			['test', 'Value', 'keep', 'A'],
			['one', 'Value', 'keep', 'B'],
			['keep', 'Out', 'cloud', 'Keep'],
			['index', 'Value', 'line', 'X'],
			['line', 'XYZ', 'cloud', 'Position']
		], {Count: 10});
		var near;

		/* The odd ones kept: 1, 3, 5, 7, 9. */
		expect(Array.from(clouds.Points(odd).Positions).filter(function (value, index) {
			return index % 3 === 0;
		})).toEqual([1, 3, 5, 7, 9]);

		near = cloudOf([['index', 'Input', {Name: 'Index'}], ['step', 'Formula', {Expression: 'Index * 0.4'}], ['line', 'Combine', {}]], [
			['index', 'Value', 'step', 'Index'],
			['step', 'Value', 'line', 'X'],
			['line', 'XYZ', 'cloud', 'Position']
		], {Count: 10, Least: 1});

		/* Points 0.4 apart, none nearer than 1 to another: 0, 1.2, 2.4, 3.6. */
		expect(Array.from(clouds.Points(near).Positions).filter(function (value, index) {
			return index % 3 === 0;
		}).map(function (value) {
			return Math.round(value * 10) / 10;
		})).toEqual([0, 1.2, 2.4, 3.6]);
	});

	it('gives the same cloud for the same graph, parameters and inputs, another for others', function () {
		var first = clouds.Points('ElemenxGraphics/cloud/sky');

		expect(clouds.Points('ElemenxGraphics/cloud/sky')).toBe(first);
		expect(clouds.Points('ElemenxGraphics/cloud/sky', {Count: 10}).Count).toBe(10);
		expect(clouds.Points('ElemenxGraphics/cloud/sky', {Seed: 'other', Count: 10}).Positions[0]).not.toBe(clouds.Points('ElemenxGraphics/cloud/sky', {Count: 10}).Positions[0]);
	});

	it('puts points on a ball, in a shell, on a ring, on the arms of a spiral', function () {
		var i;

		for (i = 0; i < 20; i++) {
			var u = (i + 0.5) / 20;
			var v = (i * 7 % 20 + 0.5) / 20;
			var shell = clouds.Shell(u, v, u, 2, 3);
			var ring = clouds.Disc(u, v, 1, 4);

			expect(Math.hypot.apply(Math, clouds.Sphere(u, v, 5))).toBeCloseTo(5, 9);
			expect(Math.hypot.apply(Math, shell)).toBeGreaterThanOrEqual(2 - 1e-9);
			expect(Math.hypot.apply(Math, shell)).toBeLessThanOrEqual(3 + 1e-9);
			expect(ring[1]).toBe(0);
			expect(Math.hypot(ring[0], ring[2])).toBeGreaterThanOrEqual(1 - 1e-9);
			expect(Math.hypot(ring[0], ring[2])).toBeLessThanOrEqual(4 + 1e-9);
		}

		/* The middle of an arm at its inner edge lies on the angle of its arm. */
		expect(clouds.Spiral(0, 0.5, 1, 1, 10, 0.2, 2, 14)[0]).toBeCloseTo(-1, 9);
		expect(clouds.Gauss(Math.exp(-0.5), 0, 3, 2)).toBeCloseTo(5, 9);
		expect(clouds.Pick(null, '3, 4, 5', 0.7)).toBe(5);
		expect(clouds.Pick('a, b', '', 0.2)).toBe('a');
		expect(clouds.Blackbody(5772).every(function (part) {
			return part > 0.9;
		})).toBe(true);
	});

	it('refuses a graph of no Cloud', function () {
		expect(function () {
			clouds.Points(blueprints.Create('cloud', {name: 'empty'}));
		}).toThrow(/no Cloud/);
	});

	it('draws what a cloud graph gives in BlueprintPreview, and tells it', async function () {
		var drawn = null;
		var component = Elemenx.Component(unique('PreviewHost'), {$Template: '<div style="width: 400px"><BlueprintPreview Graph="ElemenxGraphics/cloud/sky" Height="200" (drawn)="Drawn" /></div>', Drawn: function (event) {
			drawn = event;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return drawn;
		}, 4000);

		expect(drawn).toEqual({Kind: 'cloud', Count: 2600});

		var canvas = component.$Element().querySelector('canvas');
		var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
		var lit = 0;
		var i;

		for (i = 3; i < data.length; i += 4) {
			if (data[i] > 0)
				lit++;
		}

		expect(canvas.height).toBe(200);
		expect(lit).toBeGreaterThan(500);
		expect(component.$Element().textContent).toContain('2600');
	});
});
