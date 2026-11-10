import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

var blueprints;

/* A graph of blocks in a few lines: blocks {id: [type, properties]}, links [[from, out, to, in]]. */
function graph (type, name, parameters, blocks, links) {
	var made = blueprints.Create(type, {name: name, parameters: parameters || []});

	Object.keys(blocks).forEach(function (id) {
		blueprints.Add(made, blocks[id][0], {id: id, properties: blocks[id][1] || {}});
	});

	links.forEach(function (link) {
		blueprints.Link(made, [link[0], link[1]], [link[2], link[3]]);
	});

	return made;
}

/* The extent of the positions of a geometry along each axis, each moved by its matrix. */
function extent (pieces) {
	var low = [Infinity, Infinity, Infinity];
	var high = [-Infinity, -Infinity, -Infinity];

	pieces.forEach(function (piece) {
		piece.Parts.forEach(function (part) {
			var m = part.Matrix;
			var p = part.Geometry.Positions;
			var i;
			var k;

			for (i = 0; i < p.length; i += 3) {
				for (k = 0; k < 3; k++) {
					var value = m[k] * p[i] + m[4 + k] * p[i + 1] + m[8 + k] * p[i + 2] + m[12 + k];

					low[k] = Math.min(low[k], value);
					high[k] = Math.max(high[k], value);
				}
			}
		});
	});

	return [high[0] - low[0], high[1] - low[1], high[2] - low[2]];
}

describe('Contract: models of graphs of Blueprints (the kind model), assembled by SceneModels', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints', 'service:ModelBlueprints', 'service:SceneModels', 'service:Meshes', 'service:Math']);

		blueprints = Elemenx.Service('Blueprints');

		Elemenx.Service('ModelBlueprints');

		/* A floor, a function: its box at the height of its index, a window on its side. */
		Elemenx.Resources('Blueprints', 'test-model/floor', graph('generator', 'floor', [], {
			index: ['Input', {Name: 'Index'}], half: ['Number', {Value: 0.5}], up: ['Add'], place: ['Combine'], box: ['Box'],
			size: ['Vector', {X: 4, Y: 1, Z: 4}], out: ['Result', {Key: 'Parts'}]
		}, [
			['index', 'Value', 'up', 'A'], ['half', 'Value', 'up', 'B'], ['up', 'Out', 'place', 'Y'],
			['place', 'XYZ', 'box', 'At'], ['size', 'Value', 'box', 'Size'], ['box', 'Parts', 'out', 'Value']
		]));
	});

	it('gives the parts of its blocks: floors a function makes, a rail as a tube, a mirror, its pieces', function () {
		var tower = graph('model', 'tower', [{key: 'Floors', type: 'float', value: 3}], {
			floors: ['Parameter', {Key: 'Floors'}],
			stack: ['Repeat', {Graph: 'test-model/floor', Take: 'Parts'}],
			a: ['Vector', {X: 2, Y: 0.2, Z: 0}], b: ['Vector', {X: 2, Y: 0.2, Z: 3}], c: ['Vector', {X: 4, Y: 0.2, Z: 3}],
			path: ['List', {Count: 3}], rail: ['Tube'], side: ['Piece', {ID: 'rail-l'}], both: ['Mirrored'],
			all: ['Join', {Count: 2}], hinge: ['Pivot', {ID: 'rail-l', Parent: 'body'}], end: ['Model']
		}, [
			['floors', 'Value', 'stack', 'Count'],
			['a', 'Value', 'path', 'Item1'], ['b', 'Value', 'path', 'Item2'], ['c', 'Value', 'path', 'Item3'],
			['path', 'List', 'rail', 'Points'], ['rail', 'Parts', 'side', 'Parts'], ['side', 'Parts', 'both', 'Parts'],
			['stack', 'List', 'all', 'Parts1'], ['both', 'Parts', 'all', 'Parts2'],
			['all', 'Parts', 'end', 'Parts'], ['hinge', 'Pieces', 'end', 'Pieces']
		]);
		var recipe = Elemenx.Service('ModelBlueprints').Recipe(tower, {Floors: 4});
		var boxes = recipe.Parts.filter(function (part) {
			return part.Shape === 'box';
		});

		expect(blueprints.Check(tower)).toEqual([]);

		/* Regression: its block Mirror took the place of the pass Mirror of the picture, and every scene failed. */
		expect(blueprints.Nodes('model')).not.toContain('Mirror');
		expect(blueprints.Nodes('model')).toContain('Mirrored');
		expect(boxes.map(function (part) {
			return part.At[1];
		})).toEqual([0.5, 1.5, 2.5, 3.5]);

		/* Two cylinders and a ball at the joint, on each side. */
		expect(recipe.Parts.filter(function (part) {
			return part.Piece === 'rail-l';
		}).map(function (part) {
			return part.Shape;
		})).toEqual(['cylinder', 'ball', 'cylinder']);
		expect(recipe.Parts.filter(function (part) {
			return part.Piece === 'rail-r';
		})[0].At).toEqual([-2, 0.2, 1.5]);
		expect(recipe.Pieces).toEqual([{ID: 'rail-l', Parent: 'body', Pivot: [0, 0, 0], Team: false}]);
	});

	it('makes a model of a recipe of a graph, a tube laid along its path and no other way', function () {
		var models = Elemenx.Service('SceneModels');
		var along = graph('model', 'pipe', [], {
			a: ['Vector', {X: 0, Y: 0, Z: 0}], b: ['Vector', {X: 6, Y: 0, Z: 0}], path: ['List', {Count: 2}], pipe: ['Tube'], end: ['Model']
		}, [['a', 'Value', 'path', 'Item1'], ['b', 'Value', 'path', 'Item2'], ['path', 'List', 'pipe', 'Points'], ['pipe', 'Parts', 'end', 'Parts']]);
		var model;
		var size;

		models.Define('test-model-pipe', {Graph: along, Type: 'prop', Size: 1, Group: 'test'});

		model = models.Make('test-model-pipe');
		size = extent(model.Pieces.map(function (piece) {
			return {Parts: piece.Parts || [{Geometry: piece.Geometry, Matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]}]};
		}));

		expect(models.Info('test-model-pipe')).toMatchObject({Type: 'prop', Group: 'test'});
		expect(size[0] / size[1]).toBeGreaterThan(20);
		expect(size[0] / size[2]).toBeGreaterThan(20);
	});

	/* The blocks of models made code: every one of them, the very parts of their run. */
	it('makes a graph of every block of models code, the very parts and pieces of its run', function () {
		var all = graph('model', 'every', [], {
			a: ['Vector', {X: 0, Y: 0, Z: 0}], b: ['Vector', {X: 1, Y: 2, Z: 0}], c: ['Vector', {X: 3, Y: 2, Z: 1}], path: ['List', {Count: 3}],
			tube: ['Tube'], box: ['Box'], ball: ['Ball'], blob: ['Blob'], wedge: ['Wedge'], cylinder: ['Cylinder'], lathe: ['Lathe'],
			moved: ['Move'], spun: ['Spin'], grown: ['Grow'], side: ['Piece', {ID: 'arm-l'}], both: ['Mirrored'], red: ['Paint'],
			copies: ['Instances'], join: ['Join', {Count: 7}], hinge: ['Pivot', {ID: 'arm-l', Parent: 'body', Team: true}], end: ['Model'],
			by: ['Vector', {X: 2, Y: 0, Z: 1}], deg: ['Number', {Value: 30}], k: ['Vector', {X: 2, Y: 1, Z: 1}], color: ['Vector', {X: 1, Y: 0, Z: 0}]
		}, [
			['a', 'Value', 'path', 'Item1'], ['b', 'Value', 'path', 'Item2'], ['c', 'Value', 'path', 'Item3'], ['path', 'List', 'tube', 'Points'],
			['path', 'List', 'lathe', 'Points'], ['box', 'Parts', 'moved', 'Parts'], ['by', 'Value', 'moved', 'By'], ['moved', 'Parts', 'spun', 'Parts'],
			['deg', 'Value', 'spun', 'Degrees'], ['by', 'Value', 'spun', 'Around'], ['ball', 'Parts', 'grown', 'Parts'], ['k', 'Value', 'grown', 'Factor'],
			['wedge', 'Parts', 'side', 'Parts'], ['side', 'Parts', 'both', 'Parts'], ['cylinder', 'Parts', 'red', 'Parts'], ['color', 'Value', 'red', 'Color'],
			['blob', 'Parts', 'copies', 'Parts'], ['path', 'List', 'copies', 'Points'],
			['tube', 'Parts', 'join', 'Parts1'], ['spun', 'Parts', 'join', 'Parts2'], ['grown', 'Parts', 'join', 'Parts3'], ['both', 'Parts', 'join', 'Parts4'],
			['red', 'Parts', 'join', 'Parts5'], ['copies', 'Parts', 'join', 'Parts6'], ['lathe', 'Parts', 'join', 'Parts7'],
			['join', 'Parts', 'end', 'Parts'], ['hinge', 'Pieces', 'end', 'Pieces']
		]);
		var code = Elemenx.Service('ModelBlueprints').Compiled(all);
		var run = blueprints.Calling(function () {
			return blueprints.Compile(all).Make({}, {});
		});

		function clean (value) {
			return JSON.parse(JSON.stringify(value));
		}

		expect(typeof code).toBe('function');
		expect(run.Parts.length).toBe(12);
		expect(clean(code({}, {}))).toEqual(clean(run));
	});
});

