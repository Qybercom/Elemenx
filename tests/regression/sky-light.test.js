import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import sceneSource from '../../libraries/ElemenxGraphics/components/Scene/Scene.js?raw';

/* The definition of the Scene as its source gives it (Elemenx.Component caught). */
function definition () {
	var caught = null;

	new Function('Elemenx', sceneSource)(Object.assign(Object.create(Elemenx), {Component: function (name, made) {
		caught = made;
	}}));

	return caught;
}

/*
 * One light of the sky (blueprints/shader/sky-light) for all that mirrors it and that it lights: the sea, glass, the paint
 * of a car, the objects, the grass, the land and the probes had each a sky of their own. Regression: the sea mirrors the
 * same sky as before (its model, whiter at the horizon, deeper blue up high, the glow of a low sun); the others read it in
 * place of SkyLight of the Renderer (Replaces), as a Scene makes it of the graph (SkyLit).
 */
describe('Regression: one light of the sky of a graph (shader/sky-light)', function () {
	var run;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Blueprints', 'service:BlueprintShaders', 'service:Renderer']);

		run = Elemenx.Service('Blueprints').NumericCode(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/sky-light'), {}).Run;
	});

	it('mirrors on the sea the very sky the sea mirrored before', function () {
		var air = [0.55, 0.72, 1];
		var seed = 3;
		var i;

		function next () {
			seed = (seed * 16807) % 2147483647;

			return seed / 2147483647;
		}

		for (i = 0; i < 200; i++) {
			var up = next();
			var dot = next() * 2 - 1;
			var sunY = next() * 2 - 1;
			var low = 1 - Math.min(1, Math.max(0, Math.abs(sunY) / 0.5)) * Math.min(1, Math.max(0, Math.abs(sunY) / 0.5)) * (3 - 2 * Math.min(1, Math.max(0, Math.abs(sunY) / 0.5)));
			var glow = low * Math.exp(-up * 5.5) * (0.3 + 1.1 * Math.pow(dot * 0.5 + 0.5, 4));
			var got = run({}, {WayY: up, SunDot: dot, SunY: sunY, Spread: 0, SkyR: air[0], SkyG: air[1], SkyB: air[2], FloorR: 0.1, FloorG: 0.1, FloorB: 0.1, Gain: 1});

			[0, 1, 2].forEach(function (c) {
				var horizon = air[c] + (1 - air[c]) * 0.5;
				var zenith = air[c] * [0.38, 0.55, 1][c];

				expect(got['RGB'.charAt(c)]).toBeCloseTo(horizon + (zenith - horizon) * Math.pow(up, 0.5) + glow * [1, 0.54, 0.2][c], 9);
			});
		}
	});

	it('lights what faces all round more evenly, the ground under the horizon', function () {
		var sky = {SkyR: 0.3, SkyG: 0.38, SkyB: 0.5, FloorR: 0.12, FloorG: 0.11, FloorB: 0.1, Gain: 1.25, SunDot: 0, SunY: 1};
		var down = run({}, Object.assign({WayY: -1, Spread: 0}, sky));
		var mean = run({}, Object.assign({WayY: 0, Spread: 1}, sky));

		expect(down.R).toBeCloseTo(0.12, 9);
		expect(down.B).toBeCloseTo(0.1, 9);
		expect(mean.B).toBeGreaterThan(0.1);
		expect(mean.B).toBeLessThan(0.5);
	});

	/* Contract: a renderer puts the texts of its Replaces in place of theirs; SkyLight, the same in Lights, is what a Scene replaces. */
	it('is put by a Scene in place of SkyLight of the Renderer, a function of GLSL of the graph', function () {
		var chunks = Elemenx.Service('Renderer').Chunks;
		var text = definition().SkyLit.call(Object.assign(Object.create(definition()), {
			Graphs: null,
			$Service: function (name) {
				return Elemenx.Service(name);
			}
		}));

		expect(chunks.SkyLight).toContain('vec3 skyLight(vec3 way, float spread, vec3 sky, vec3 ground, vec3 sun, float gain) {');
		expect(chunks.Lights).toContain(chunks.SkyLight);
		expect(text).toContain('vec3 skyLight(vec3 way, float spread, vec3 sky, vec3 ground, vec3 sun, float gain) {');
		expect(text).toMatch(/return vec3\(f_bf\w+\(way\.y, dot\(way, sun\), sun\.y, spread/);
	});

	/* Contract: Replaces of a renderer (set before its programs): its texts in place of theirs in each shader it compiles or checks. */
	it('compiles its shaders with the texts of its Replaces in place of theirs', function () {
		var graphics = Elemenx.Service('Renderer');
		var renderer = graphics.Create(document.createElement('canvas'), {});
		var vertex = '#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 1.0); }';
		var fragment = '#version 300 es\nprecision highp float;\nout vec4 outColor;\n' + graphics.Chunks.SkyLight + '\nvoid main() { outColor = vec4(skyLight(vec3(0.0, 1.0, 0.0), 0.0, vec3(1.0), vec3(0.0), vec3(0.0, 1.0, 0.0), 1.0), 1.0); }';

		expect(renderer.Replaces).toEqual({});
		expect(renderer.Check(vertex, fragment)).toBe(null);

		renderer.Replaces[graphics.Chunks.SkyLight] = 'vec3 skyLight(vec3 way, float spread, vec3 sky, vec3 ground, vec3 sun, float gain) { return broken; }';

		expect(renderer.Check(vertex, fragment)).toContain('broken');

		renderer.Destroy();
	});
});
