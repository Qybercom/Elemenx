import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (sun) {
	var ready = null;
	var component = Elemenx.Component(unique('SkyHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="medium" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" ' + sun + ' />' +
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

describe('Contract: the lights of the sky of a Scene: the northern lights and the rainbow', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* The uniforms the sky was last drawn with. */
	function sky (scene) {
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var seen = null;

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uAurora)
				seen = uniforms;

			return draw.apply(this, arguments);
		};

		try {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
		finally {
			renderer.Draw = draw;
		}

		return seen;
	}

	it('lights the northern lights by themselves far north on a clear night, none by day or at 45 degrees; Aurora sets them anywhere', async function () {
		var north = await mount('Latitude="68" DayOfYear="355" Time="23"');

		await waitFor(function () {
			return sky(north) && sky(north).uAurora[0] > 0.9;
		}, 6000);

		var seen = sky(north);

		/* Regression: the colors went as four numbers to a vec3, and the lights were black. */
		expect(seen.uAuroraLow.length).toBe(3);
		expect(seen.uAuroraHigh.length).toBe(3);

		north.Change('sun', {Time: 12, DayOfYear: 172});

		await waitFor(function () {
			return sky(north).uAurora[0] < 0.01;
		}, 6000);

		var south = await mount('Latitude="45" Time="23"');

		expect(sky(south).uAurora[0]).toBe(0);

		south.Aurora = 1;
		south.AuroraColors = ['#ff0000', '#0000ff'];

		await waitFor(function () {
			return sky(south).uAurora[0] > 0.9;
		}, 6000);

		expect(sky(south).uAuroraLow).toEqual([1, 0, 0]);
	}, 40000);

	it('draws a rainbow of the weather, or as Rainbow sets it', async function () {
		var scene = await mount('Latitude="45" Time="18"');

		expect(sky(scene).uRainbow).toBe(0);

		scene.Rainbow = 0.8;

		expect(sky(scene).uRainbow).toBeCloseTo(0.8, 6);

		scene.Rainbow = null;

		expect(sky(scene).uRainbow).toBe(0);
	});

	it('flashes inside the clouds with no bolt (sheet), or strikes the land with one; each lights the clouds from a place in them', async function () {
		var scene = await mount('Latitude="45" Time="22"');
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var flashes = [];
		var bolts = 0;

		scene.Weather = 'storm';
		scene.Quality = 'high';

		renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uFlashAt)
				flashes.push(uniforms.uFlashAt.slice());

			if (options && options.Mode === 'lines' && uniforms && uniforms.uColor && options.Blend === 'add')
				bolts++;

			return draw.apply(this, arguments);
		};

		try {
			/*
			 * Regression: the programs of the high quality were still being made (quiet frames, under load for long), the weather
			 * went on meanwhile and the flash asked for had faded before a frame drew it. It is asked for once the scene draws.
			 */
			await waitFor(function () {
				var made = renderer.Progress();

				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 33);

				return flashes.length > 0 && made.Done === made.Total;
			}, 30000);

			expect(scene.Lightning('sheet')).toBe(true);

			flashes = [];
			bolts = 0;

			/* A frame may be skipped by the frame rate: the next one drawn shows the flash. */
			await waitFor(function () {
				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 33);

				return flashes.length > 0;
			}, 5000);

			expect(flashes[flashes.length - 1][3]).toBeGreaterThan(0.4);
			expect(bolts).toBe(0);

			expect(scene.Lightning('strike')).toBe(true);

			await waitFor(function () {
				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 33);

				return bolts > 0;
			}, 5000);

			expect(bolts).toBeGreaterThan(0);
		}
		finally {
			renderer.Draw = draw;
		}
	}, 30000);

	it('tells how far one sees: far on a clear day, near in fog, little light at night; a range of sight shortened by both; a place seen within it', async function () {
		var scene = await mount('Latitude="45" Time="12"');
		var clear;
		var foggy;

		function run (seconds) {
			var i;

			for (i = 0; i < seconds * 10; i++) {
				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 100);
			}
		}

		run(2);

		clear = scene.Visibility();

		expect(clear.Distance).toBeGreaterThan(10000);
		expect(clear.Light).toBeGreaterThan(0.8);
		expect(scene.SightOf(60)).toBeGreaterThan(50);
		expect(scene.Visible([0, 0], [40, 0])).toBe(true);
		expect(scene.Visible([0, 0], [40, 0], 30)).toBe(false);

		scene.Weather = 'fog';

		await waitFor(function () {
			run(1);

			return scene.Visibility().Distance < 1500;
		}, 15000);

		foggy = scene.Visibility();

		expect(foggy.Distance).toBeLessThan(clear.Distance / 5);
		expect(scene.SightOf(5000)).toBeLessThan(foggy.Distance + 1);

		scene.Weather = 'clear';

		scene.Change('sun', {Time: 0});

		await waitFor(function () {
			run(1);

			return scene.Visibility().Light < 0.4;
		}, 15000);

		expect(scene.SightOf(60)).toBeLessThan(40);
	}, 60000);

	it('splashes the rain on the ground round the eye: crowns drawn in one go on a map of heights, none at low', async function () {
		var scene = await mount('Latitude="45" Time="12"');
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var crowns = [];

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uHeights && uniforms.uReach)
				crowns.push(uniforms);

			return draw.apply(this, arguments);
		};

		try {
			scene.Weather = 'rain';

			await waitFor(function () {
				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 100);

				return crowns.length > 0;
			}, 15000);

			var last = crowns[crowns.length - 1];

			expect(last.uAmount).toBeGreaterThan(0);
			expect(last.uSpan).toBeGreaterThan(last.uReach);

			scene.Quality = 'low';
			crowns = [];

			var i;

			for (i = 0; i < 5; i++) {
				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 100);
			}

			expect(crowns.length).toBe(0);
		}
		finally {
			renderer.Draw = draw;
		}
	}, 30000);
});
