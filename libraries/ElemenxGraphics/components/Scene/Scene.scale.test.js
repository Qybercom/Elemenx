import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('ScaleHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="sun" Kind="star" Mass="1" />' +
		'<SceneObject ID="earth" Kind="planet" Distance="1" Radius="6371" />' +
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

describe('Contract: the scale of a Scene of space, from readable to real by a number', function () {
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

	function at (scene, scale) {
		var inner = scene.Scene();
		var earth;

		scene.Scale = scale;

		scene.Engine().Props();

		inner.Rest = 0;

		scene.Engine().Frame(now += 33);

		earth = inner.Objects.earth;

		return {Size: earth.Size, Far: Math.hypot(earth.World[0] - inner.Objects.sun.World[0], earth.World[1] - inner.Objects.sun.World[1], earth.World[2] - inner.Objects.sun.World[2])};
	}

	it('lays sizes and distances out between the compressed and the real ones as a number of 0 to 1 says, and reads a place back the same way', async function () {
		var scene = await mount();
		var low = at(scene, 'compressed');
		var high = at(scene, 'real');
		var half = at(scene, 0.5);
		var zero = at(scene, 0);
		var orbit;

		expect(zero.Size).toBeCloseTo(low.Size, 9);
		expect(at(scene, 1).Size).toBeCloseTo(high.Size, 12);
		/* Halfway as their ratio goes. */
		expect(half.Size).toBeCloseTo(Math.sqrt(low.Size * high.Size), 9);
		expect(half.Far).toBeGreaterThan(Math.min(low.Far, high.Far) * 0.999);
		expect(half.Far).toBeLessThan(Math.max(low.Far, high.Far) * 1.001);

		/* Where the body is on the screen read back as the distance it is on its orbit (the gizmo of an editor carries a body so). */
		[0, 0.5, 1].forEach(function (scale) {
			var spot;
			var box;

			at(scene, scale);

			spot = scene.ToScreen('earth');
			box = scene.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();
			orbit = scene.OrbitAt('earth', box.left + spot.X, box.top + spot.Y);

			expect(orbit.Distance).toBeCloseTo(1, 1);
		});
	});
});
