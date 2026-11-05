import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (quality) {
	var ready = null;
	var component = Elemenx.Component(unique('SeaHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="' + quality + '" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="10" Water="0.5" Swell="0.6" Seed="sea" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

describe('Contract: SceneWaves, the waves of a sea, and the sea of a Scene', function () {
	var waves;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneWaves']);

		waves = Elemenx.Service('SceneWaves');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('makes the waves of a sea state: none on a calm sea, higher and longer as it gets wild, the same for the same seed', function () {
		var calm = waves.Make({Swell: 0});
		var mild = waves.Make({Swell: 0.3, Seed: 'a'});
		var wild = waves.Make({Swell: 1.2, Seed: 'a'});

		expect(calm.Count).toBe(0);
		expect(mild.Count).toBe(8);
		expect(waves.Make({Swell: 0.3, Seed: 'a'})).toEqual(mild);
		expect(wild.Waves[0].Height).toBeGreaterThan(mild.Waves[0].Height * 2);
		expect(wild.Waves[0].Length).toBeGreaterThan(mild.Waves[0].Length);
		/* The longest goes the way of the wind; a short one, deep water, slower than a long one. */
		expect(Math.abs(Math.atan2(mild.Waves[0].Way[1], mild.Waves[0].Way[0]) - Math.PI / 6)).toBeLessThan(0.16);
		expect(mild.Waves[7].Speed).toBeGreaterThan(mild.Waves[0].Speed);
	});

	it('tells the surface over a point as the shader moves it: its height, its normal, where it breaks', function () {
		var made = waves.Make({Swell: 0.8, Seed: 'b'});
		var top = made.Waves.reduce(function (sum, wave) {
			return sum + wave.Height;
		}, 0);
		var x;

		for (x = 0; x < 60; x += 3) {
			var at = waves.At(made, x, 7, 12);

			expect(Math.abs(at.Height)).toBeLessThanOrEqual(top + 1e-9);
			expect(Math.hypot(at.Normal[0], at.Normal[1], at.Normal[2])).toBeCloseTo(1, 6);
			expect(at.Normal[1]).toBeGreaterThan(0);
			expect(at.Crest).toBeGreaterThanOrEqual(0);
			expect(at.Crest).toBeLessThanOrEqual(1);
		}

		expect(waves.At(waves.Make({Swell: 0}), 3, 4, 5)).toEqual({Height: 0, Normal: [0, 1, 0], Crest: 0});

		var values = waves.Values(made, 3);

		expect(values.uWaveA.length).toBe(32);
		expect(values.uWaveB.length).toBe(32);
		expect(values.uWaveCount).toBe(8);
		expect(values.uWaveTime).toBe(3);
		expect(waves.GLSL).toContain('vec3 gerstner(vec2 place, float far, float fade, out vec3 normal, out float crest)');
	});

	/* Regression: the sea was a plane, its waves only drawn on it; mirrored by a search along the screen, in lines, and that again by the reflections of the screen. */
	it('draws the sea as a grid of waves round the eye, mirrored by its level at high quality, over what is behind with no gloss left', async function () {
		var scene = await mount('high');
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var winding = renderer.Winding;
		var sea = [];
		var turned = 0;
		var now = performance.now() + 100;
		var i;

		renderer.Draw = function (mesh, program, uniforms, settings) {
			if (uniforms && uniforms.uWaves !== undefined)
				sea.push({Uniforms: uniforms, Settings: settings});

			return draw.apply(this, arguments);
		};
		renderer.Winding = function (clockwise) {
			if (clockwise)
				turned++;

			return winding.apply(this, arguments);
		};

		try {
			scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0.5, Pitch: 0.3, Distance: 20});

			for (i = 0; i < 6; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			var last = sea[sea.length - 1];

			expect(inner.Ground.Waves.Count).toBe(8);
			expect(last.Uniforms.uWaves).toBe(1);
			expect(last.Uniforms.uWaveCount).toBe(8);
			expect(last.Uniforms.uPlanarOn).toBe(1);
			expect(last.Settings.Blend).toBe('veil');
			expect(turned).toBeGreaterThan(0);
		}
		finally {
			renderer.Draw = draw;
			renderer.Winding = winding;
		}
	});

	/* Regression: the eye was kept over the sea whatever it looked at; under it nothing told it was under water. */
	it('goes under the sea when what the eye looks at is under it: the water fogs what it sees, its surface seen from below', async function () {
		var scene = await mount('high');
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var under = [];
		var sea = [];
		var now = performance.now() + 100;
		var i;

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uUnder !== undefined)
				under.push(uniforms.uUnder);

			if (uniforms && uniforms.uWaves !== undefined)
				sea.push(uniforms);

			return draw.apply(this, arguments);
		};

		try {
			var field = inner.Ground.Field;
			var deep = [0, 0];
			var x;
			var z;

			/* The deepest of the sea round the middle. */
			for (x = -90; x <= 90; x += 10) {
				for (z = -90; z <= 90; z += 10) {
					if (field.Height(x, z) < field.Height(deep[0], deep[1]))
						deep = [x, z];
				}
			}

			var bed = field.Height(deep[0], deep[1]);

			scene.SetViewpoint({Target: [deep[0], bed + 1.5, deep[1]], Yaw: 0.5, Pitch: 0.05, Distance: 2});

			for (i = 0; i < 8; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			expect(bed).toBeLessThan(-3);
			expect(inner.Eye[1]).toBeLessThan(0);
			expect(inner.Ground.Under).toBe(true);
			expect(under[under.length - 1]).toBe(1);
			expect(sea[sea.length - 1].uEyeUnder).toBe(1);
			/* No mirror of the sea from under it. */
			expect(sea[sea.length - 1].uPlanarOn).toBe(0);

			scene.SetViewpoint({Target: [deep[0], 2, deep[1]], Yaw: 0.5, Pitch: 0.3, Distance: 20});

			for (i = 0; i < 8; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			expect(inner.Ground.Under).toBe(false);
			expect(under[under.length - 1]).toBe(0);
		}
		finally {
			renderer.Draw = draw;
		}
	});

	it('mirrors the sea by its level at high quality only', async function () {
		var scene = await mount('medium');
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var sea = [];
		var now = performance.now() + 100;
		var i;

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uWaves !== undefined)
				sea.push(uniforms);

			return draw.apply(this, arguments);
		};

		try {
			scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0.5, Pitch: 0.3, Distance: 20});

			for (i = 0; i < 6; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			expect(sea.length).toBeGreaterThan(0);
			expect(sea[sea.length - 1].uPlanarOn).toBe(0);
		}
		finally {
			renderer.Draw = draw;
		}
	});
});
