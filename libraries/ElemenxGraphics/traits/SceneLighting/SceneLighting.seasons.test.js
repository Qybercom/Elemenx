import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (sun, season) {
	var ready = null;
	var component = Elemenx.Component(unique('SeasonHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="medium" Labels="false" Season="' + (season || '') + '" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" ' + sun + ' />' +
		'<SceneObject ID="oak" Kind="thing" Model="oak" Size="8" X="0" Y="0" Z="6" />' +
		'<SceneObject ID="pine" Kind="thing" Model="pine" Size="8" X="3" Y="0" Z="6" />' +
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

describe('Contract: the seasons of a Scene: of the date and the latitude, or fixed by Season; what they do to plants and the land', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* Frames till the season is known; the uniforms of the draws of the last one. */
	async function frames (scene) {
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var seen = [];

		await waitFor(function () {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);

			return scene.SeasonState();
		}, 10000);

		renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms)
				seen.push(Object.assign({}, uniforms));

			return draw.apply(this, arguments);
		};

		try {
			await waitFor(function () {
				seen = [];
				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 33);

				return seen.some(function (one) {
					return one.uSeasonOn > 0;
				});
			}, 10000);
		}
		finally {
			renderer.Draw = draw;
		}

		return seen;
	}

	it('follows the day of the year and the latitude: summer at 45 north in June, winter at 45 south, none near the equator', async function () {
		var north = await mount('Latitude="45" DayOfYear="172" Time="12"');
		var summer;

		await frames(north);

		summer = north.SeasonState();

		expect(summer.Warmth).toBeGreaterThan(0.9);
		expect(summer.Bare).toBe(0);
		expect(summer.Snow).toBe(0);
		expect(summer.Dry).toBeGreaterThan(0.2);

		north.Change('sun', {Latitude: -45});

		await frames(north);

		expect(north.SeasonState().Warmth).toBeLessThan(-0.9);
		expect(north.SeasonState().Bare).toBe(1);
		expect(north.SeasonState().Snow).toBeGreaterThan(0.5);

		north.Change('sun', {Latitude: 2, DayOfYear: 355});

		await frames(north);

		expect(north.SeasonState().Bare).toBe(0);
		expect(north.SeasonState().Snow).toBe(0);
	}, 40000);

	it('turns the leaves in autumn and lets them fall as it goes on; Season fixes one whatever the date', async function () {
		var autumn = await mount('Latitude="45" DayOfYear="290" Time="12"');
		var fixed;
		var seen;

		seen = await frames(autumn);

		expect(autumn.SeasonState().Rising).toBe(false);
		expect(autumn.SeasonState().Turn).toBeGreaterThan(0.9);
		expect(autumn.SeasonState().Bare).toBeGreaterThan(0.2);
		expect(autumn.SeasonState().Bare).toBeLessThan(0.7);

		/* Leaves come down in the air while the trees lose them. */
		expect(seen.some(function (one) {
			return one.uLeaves === 1 && one.uAmount > 0;
		})).toBe(true);

		fixed = await mount('Latitude="45" DayOfYear="172" Time="12"', 'spring');

		await frames(fixed);

		expect(fixed.SeasonState().Rising).toBe(true);
		expect(fixed.SeasonState().Blossom).toBeGreaterThan(0.5);
		expect(fixed.SeasonState().Turn).toBe(0);
	}, 40000);

	it('draws trees that lose their leaves with their season, green ones only with the snow; snow lies in a cold winter under a clear sky', async function () {
		var winter = await mount('Latitude="60" DayOfYear="355" Time="12"');
		var seen = await frames(winter);
		var plants = seen.filter(function (one) {
			return one.uSeasonOn > 0;
		});

		/* The oak loses its leaves (1), the pine keeps them (2); each with the season of now, standing still or not. */
		expect(plants.some(function (one) {
			return one.uSeasonOn === 1 && one.uSeason[0] === 1;
		})).toBe(true);
		expect(plants.some(function (one) {
			return one.uSeasonOn === 2;
		})).toBe(true);

		expect(winter.SeasonState().Snow).toBeGreaterThan(0.9);
		expect(seen.some(function (one) {
			return one.uSnowed > 0.9;
		})).toBe(true);
	}, 40000);
});
