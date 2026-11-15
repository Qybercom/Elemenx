import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (temperature) {
	var ready = null;
	var component = Elemenx.Component(unique('StarHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" Background="false" Focus="sun" (ready)="Ready">' +
		'<SceneObject ID="sun" Kind="star" Mass="0.14" Temperature="' + temperature + '" />' +
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

describe('Regression: the colour of a star as the eye sees it', function () {
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

	/* The middle of the picture, as the card drew it: [r, g, b]. */
	function middle (scene) {
		var renderer = scene.Engine().Renderer;
		var gl = renderer.GL;
		var data = new Uint8Array(4);

		gl.readPixels(Math.floor(renderer.Width / 2), Math.floor(renderer.Height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

		return [data[0], data[1], data[2]];
	}

	/* Regression: a red dwarf (2800 K) was drawn white: its colour times 2.4 and white over it burned out in the picture. */
	it('draws a red dwarf orange, as hot as it is, not white', async function () {
		var scene = await mount(2800);
		var color;

		scene.Scene().Wanted = scene.Scene().Distance = scene.Scene().Objects.sun.Size * 2.2;

		await waitFor(function () {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);

			return scene.Engine().Renderer.Progress().Needed === 0;
		}, 30000);

		scene.Engine().Frame(now += 33);
		scene.Engine().Frame(now += 33);

		color = middle(scene);

		expect(color[0]).toBeGreaterThan(150);
		expect(color[2] / color[0]).toBeLessThan(0.7);
	});
});
