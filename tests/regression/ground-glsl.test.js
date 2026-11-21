import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import materialsSource from '../../libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.js?raw';

function hash (text) {
	var h = 5381;
	var i;

	for (i = 0; i < text.length; i++)
		h = (h * 33 + text.charCodeAt(i)) >>> 0;

	return h.toString(16) + ':' + text.length;
}

/*
 * Regression: the GLSL of the ground (its helpers, the slope, the torn edges of its materials, its tiles from three sides,
 * its cliffs of beds) and the wear of a road were texts of the code. Each is the block GLSL of a graph of the library now
 * (blueprints/glsl/<name>), an Application's of that name in its place, and the shaders are the very texts they were.
 */
describe('Regression: the GLSL of the ground and of roads, graphs of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneMaterials']);
	});

	it('reads its GLSL of its graphs, the very texts of the code', function () {
		var materials = Elemenx.Service('SceneMaterials');
		var out = {};

		Object.keys(materials.GlslNames).forEach(function (field) {
			out[field] = hash(materials[field]);
		});

		expect(out).toEqual({Helpers: '74987a06:2203', LandSlope: '103d252c:392', LandRag: 'b5373918:277', LandTexture: '1a407cb8:1501', LandCliff: '4ce793bc:5336', RoadWear: '63caa20f:1717'});
		expect(materialsSource).not.toContain("'void landCliff(");
	});

	/* An Application changes one: read again, its text of its graph. */
	it('takes a graph of its GLSL an Application gives in its place', function () {
		var materials = Elemenx.Service('SceneMaterials');
		var name = 'ElemenxGraphics/glsl/land-rag';
		var kept = Elemenx.Resources('Blueprints', name);

		try {
			Elemenx.Resources('Blueprints', name, Object.assign({}, kept, {blocks: [{id: 'chunk', type: 'GLSL', x: 0, y: 0, properties: [{key: 'Code', value: 'float landRag(vec2 place, float n) { return 0.0; }'}]}]}));

			materials.Glsl();

			expect(materials.LandRag).toBe('float landRag(vec2 place, float n) { return 0.0; }');
		}
		finally {
			Elemenx.Resources('Blueprints', name, kept);

			materials.Glsl();
		}

		expect(hash(materials.LandRag)).toBe('b5373918:277');
	});
});
