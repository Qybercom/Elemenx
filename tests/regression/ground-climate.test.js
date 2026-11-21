import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import terrainSource from '../../libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.js?raw';
import reliefGraph from '../../libraries/ElemenxGraphics/blueprints/relief.json';

function hash (value) {
	var text = JSON.stringify(value);
	var h = 5381;
	var i;

	for (i = 0; i < text.length; i++)
		h = (h * 33 + text.charCodeAt(i)) >>> 0;

	return h.toString(16) + ':' + text.length;
}

/* The moisture, the warmth and the height of a ground at 300 points over it. */
function sample (field) {
	var values = [];
	var i;

	for (i = 0; i < 300; i++) {
		var climate = field.Climate((i % 17) * 23 - 190, Math.floor(i / 17) * 21 - 180);

		values.push([climate.Moisture, climate.Temperature, field.Height((i % 17) * 23 - 190, Math.floor(i / 17) * 21 - 180)]);
	}

	return values;
}

/* A generator of the resources (group Blueprints): Formula of its Input X and its parameter K, a NoiseSpec seeded {Seed}. */
function graph (name, expression) {
	return {version: 1, type: 'generator', name: name, parameters: [{key: 'K', type: 'float', value: 2}], blocks: [
		{id: 'x', type: 'Input', x: 0, y: 0, properties: [{key: 'Name', value: 'X'}]},
		{id: 'k', type: 'Parameter', x: 0, y: 100, properties: [{key: 'Key', value: 'K'}, {key: 'Type', value: 'float'}]},
		{id: 'f', type: 'Formula', x: 200, y: 0, properties: [{key: 'Expression', value: expression}]},
		{id: 'r', type: 'Result', x: 400, y: 0, properties: [{key: 'Key', value: 'Value'}]}
	], links: [
		{id: 'a', p1: 'x-out-Value', p2: 'f-in-X', kind: 'value'},
		{id: 'b', p1: 'k-out-Value', p2: 'f-in-K', kind: 'value'},
		{id: 'c', p1: 'f-out-Value', p2: 'r-in-Value', kind: 'value'}
	]};
}

/*
 * Regression: the climate of a ground of no planet was written twice, blocks of the library relief and a function of the
 * code (for a ground of a noise of its own). It is one graph now, blueprints/ground/climate: the library relief calls it
 * (Call), a ground of a noise of its own runs it of its height, and each ground has the very climate it had (the prints of
 * before). A graph of numbers calls another (Blueprints.Inlined), filled as it is (its {Seed} and its parameters).
 */
describe('Regression: the climate of a ground, one graph called by the relief and by a ground of its own noise', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:Blueprints']);
	}, 60000);

	it('gives each ground the very climate it had, of one graph', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');

		expect(hash(sample(terrain.Flat({Size: 400, Height: 40, Water: 0.3, Seed: 'climate', Compute: 'js'})))).toBe('9828b0dc:17627');
		expect(hash(sample(terrain.Flat({Size: 400, Height: 40, Water: 0.3, Seed: 'climate'})))).toBe('9828b0dc:17627');
		expect(hash(sample(terrain.Flat({Size: 400, Height: 60, Water: 0.2, Seed: 'warm', Climate: {Warmth: 0.9, Lapse: 0.4, Spread: 0.5, Stretch: 1.5}})))).toBe('648dc727:17531');
		expect(hash(sample(terrain.Flat({Size: 400, Height: 40, Water: 0.3, Seed: 'noisy', Noise: {Type: 'simplex', Seed: 'own', Fractal: 'fbm', Octaves: 4, Scale: 0.01}})))).toBe('cee7b800:17728');

		expect(reliefGraph.blocks.filter(function (block) {
			return block.type === 'Call';
		}).map(function (block) {
			return block.properties[0].value;
		})).toEqual(['ElemenxGraphics/ground/climate']);
		expect(reliefGraph.blocks.some(function (block) {
			return block.properties.some(function (property) {
				return property.value === '{Seed}-moisture';
			});
		})).toBe(false);
		expect(terrainSource).not.toContain("Seed: seed + '-moisture'");
	});

	it('gives a ground of its own noise in a worker the climate of the page', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var options = {Size: 400, Height: 40, Water: 0.3, Seed: 'noisy-worker', Noise: {Type: 'simplex', Seed: 'own', Fractal: 'fbm', Octaves: 4, Scale: 0.01}};
		var page = terrain.Piece('Flat', JSON.parse(JSON.stringify(options)), null, [20, -30, 120, 16]);
		var worker = await new Promise(function (resolve, reject) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', JSON.parse(JSON.stringify(options)), null, [20, -30, 120, 16]], function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(terrain.Work().Inline()).toBe(false);
		expect(Array.from(worker.Colors)).toEqual(Array.from(page.Colors));
	}, 60000);

	it('calls a graph of numbers of another, filled as the graph that calls it is (Inlined)', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var callee = graph('test-callee', 'X * K + 1');
		var caller = {version: 1, type: 'generator', name: 'test-caller', parameters: [{key: 'K', type: 'float', value: 2}], blocks: [
			{id: 'x', type: 'Input', x: 0, y: 0, properties: [{key: 'Name', value: 'X'}]},
			{id: 'call', type: 'Call', x: 200, y: 0, properties: [{key: 'Graph', value: 'test/callee'}]},
			{id: 'r', type: 'Result', x: 400, y: 0, properties: [{key: 'Key', value: 'Value'}]}
		], links: [
			{id: 'a', p1: 'x-out-Value', p2: 'call-in-X', kind: 'value'},
			{id: 'b', p1: 'call-out-Value', p2: 'r-in-Value', kind: 'value'}
		]};
		var inlined;
		var filled;

		Elemenx.Resources('Blueprints', 'test/callee', callee);

		inlined = blueprints.Inlined(blueprints.Read(JSON.parse(JSON.stringify(caller))));

		expect(inlined.blocks.map(function (block) {
			return block.id;
		}).sort()).toEqual(['call~f', 'call~k', 'r', 'x']);
		expect(blueprints.NumericCode(caller, {}).Run({}, {X: 3}).Value).toBe(7);

		/* Filled with K 5: the called graph too. */
		filled = blueprints.Fill(blueprints.Read(JSON.parse(JSON.stringify(caller))), {K: 5});

		expect(filled.filled).toEqual({K: 5});
		expect(blueprints.NumericCode(filled, {}).Run({}, {X: 3}).Value).toBe(16);
		expect(blueprints.Hash(filled)).not.toBe(blueprints.Hash(blueprints.Read(JSON.parse(JSON.stringify(caller)))));
	});
});
