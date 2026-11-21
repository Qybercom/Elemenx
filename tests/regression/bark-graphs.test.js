import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import floraSource from '../../libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.js?raw';

function hash (value) {
	var h = 5381;
	var i;

	for (i = 0; i < value.length; i++)
		h = (h * 33 + value[i]) >>> 0;

	return h.toString(16) + ':' + value.length;
}

/*
 * Regression: the barks of the plants drawn of a branch of the code for each pattern (plates, birch, ridges, fibrous, bands,
 * diamonds, rings), none of it in the graphs an author changes nor in the IR other languages run. Each pattern is a graph
 * of the library now (blueprints/flora/bark/<pattern>, its base called), and its pictures are the very bytes they were.
 */
describe('Regression: the barks of plants, graphs of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneFlora', 'service:Blueprints', 'service:Noise', 'service:Math', 'service:Random']);
	});

	it('draws the bark of each pattern of its graph, the very pictures and reliefs of the code', function () {
		var flora = Elemenx.Service('SceneFlora');
		var out = {};

		['pine', 'birch', 'aspen', 'cherry', 'palm', 'sequoia', 'oak', 'fern'].forEach(function (name) {
			var made = flora.BarkPicture(flora.Preset(name));

			out[name] = hash(made.Picture.Data) + '/' + hash(made.Normal.Data);
		});

		expect(out).toEqual({
			pine: '3646be5c:1048576/f73f6bd2:1048576',
			birch: 'f2488c82:1048576/d5320a2f:1048576',
			aspen: 'b7fad3d6:1048576/8413a09b:1048576',
			cherry: 'cd8f1073:1048576/53e0c37c:1048576',
			palm: 'b5d9e9ae:1048576/47728721:1048576',
			sequoia: '9e452e11:1048576/817fa0d3:1048576',
			oak: '32f34a16:1048576/24420a30:1048576',
			fern: '6ed85bf1:1048576/d4a7da71:1048576'
		});
		expect(floraSource).not.toContain("else if (pattern === 'birch') {");
	}, 120000);

	/* A bark of a graph of its own: its pattern of the library left, its picture of its graph (here one color everywhere). */
	it('draws a bark of a graph of its own', function () {
		var flora = Elemenx.Service('SceneFlora');
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('generator', {name: 'flat-bark'});
		var made;

		['R', 'G', 'B', 'Bump'].forEach(function (key, index) {
			blueprints.Add(graph, 'Number', {id: 'n' + key, properties: {Value: [0.2, 0.4, 0.6, 0.5][index]}});
			blueprints.Add(graph, 'Result', {id: 'r' + key, properties: {Key: key}});
			blueprints.Link(graph, ['n' + key, 'Value'], ['r' + key, 'Value']);
		});

		made = flora.BarkPicture(Object.assign({}, flora.Preset('pine'), {Bark: Object.assign({}, flora.Preset('pine').Bark, {Graph: graph})}));

		expect(Array.from(made.Picture.Data.slice(0, 4))).toEqual([51, 102, 153, 255]);
		expect(Array.from(made.Normal.Data.slice(0, 4))).toEqual([128, 128, 255, 255]);
		expect(flora.BarkPatterns).toEqual(['plain', 'plates', 'birch', 'ridges', 'fibrous', 'bands', 'diamonds', 'rings']);
	});
});

describe('Contract: smoothstep of a formula and the jitter of a noise of cells, the same everywhere', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints', 'service:Noise']);
	});

	it('smooths a number between two in a formula of its run, its Code and its numbers; jitters cells as Noise does', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('generator', {name: 'smoothed'});
		var cells = blueprints.Create('generator', {name: 'jittered'});
		var noise = Elemenx.Service('Noise');

		function smooth (a, b, x) {
			var s = Math.max(0, Math.min(1, (x - a) / (b - a)));

			return s * s * (3 - 2 * s);
		}

		blueprints.Add(graph, 'Input', {id: 'x', properties: {Name: 'X'}});
		blueprints.Add(graph, 'Formula', {id: 'f', properties: {Expression: 'smoothstep(0.2, 0.7, X)'}});
		blueprints.Add(graph, 'Result', {id: 'out', properties: {Key: 'Value'}});
		blueprints.Link(graph, ['x', 'Value'], ['f', 'X']);
		blueprints.Link(graph, ['f', 'Value'], ['out', 'Value']);

		[-1, 0.2, 0.33, 0.5, 0.7, 2].forEach(function (x) {
			expect(blueprints.Compile(graph).Run({}, {X: x}).Value).toBe(smooth(0.2, 0.7, x));
			expect(blueprints.Code(graph).Run({}, {X: x}).Value).toBe(smooth(0.2, 0.7, x));
			expect(blueprints.NumericCode(graph, {}).Run({}, {X: x}).Value).toBe(smooth(0.2, 0.7, x));
		});

		blueprints.Add(cells, 'Vector', {id: 'at', properties: {X: 1.3, Y: 2.1, Z: 0.4}});
		blueprints.Add(cells, 'NoiseSpec', {id: 'n', properties: {Type: 'worley', Fractal: 'none', Cell: 'edge', Jitter: 0.9, Seed: 'bark'}});
		blueprints.Add(cells, 'Result', {id: 'out', properties: {Key: 'Value'}});
		blueprints.Link(cells, ['at', 'Value'], ['n', 'Position']);
		blueprints.Link(cells, ['n', 'Value'], ['out', 'Value']);

		expect(blueprints.NumericCode(cells, {}).Run({}, {}).Value).toBe(noise.Make({Type: 'worley', Seed: 'bark', Cell: {Return: 'edge', Jitter: 0.9}}).At(1.3, 2.1, 0.4));
		expect(blueprints.NumericCode(cells, {}).Run({}, {}).Value).not.toBe(noise.Make({Type: 'worley', Seed: 'bark', Cell: {Return: 'edge', Jitter: 1}}).At(1.3, 2.1, 0.4));
	});
});
