import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

/*
 * Regression: a browser gave no WebGL (a page past the contexts it keeps), the scene said error and ready all the same,
 * and then its methods of what a renderer starts were not there (CosmosKinds), what walks looked for what is sown
 * (ScatterBlocked) and every frame ran the vehicles (VehicleStep) and threw.
 */
describe('Regression: a Scene with no WebGL', function () {
	var owned = [];
	var getContext = HTMLCanvasElement.prototype.getContext;
	var errors = [];

	function caught (event) {
		errors.push(event.error || event.message);
	}

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();

		errors = [];

		HTMLCanvasElement.prototype.getContext = function (kind) {
			return kind === 'webgl2' || kind === 'webgl' ? null : getContext.apply(this, arguments);
		};

		window.addEventListener('error', caught);
	});

	afterEach(function () {
		HTMLCanvasElement.prototype.getContext = getContext;

		window.removeEventListener('error', caught);

		while (owned.length) owned.pop().$Destroy();
	});

	it('says error and ready, shows it cannot draw, answers its methods and runs no frame', async function () {
		var told = {Error: null, Ready: null};
		var component = Elemenx.Component(unique('NoGlHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Setting="terrain" Labels="false" Cosmos="nebula" (error)="Failed" (ready)="Ready">' +
		'</Scene></div>', Failed: function (event) {
			told.Error = event;
		}, Ready: function (space) {
			told.Ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return told.Ready;
		}, 4000);

		var scene = told.Ready;

		expect(told.Error).toEqual({Reason: 'webgl2'});
		expect(scene.Unsupported).toBe(true);
		expect(scene.Scene().Loop.Running).toBe(false);
		expect(component.$Element().querySelector('.elemenx-scene-fallback')).not.toBeNull();

		expect(Object.keys(scene.CosmosKinds())).toEqual(['nebula', 'pillars', 'galaxy', 'galaxies', 'cluster', 'void']);
		expect(scene.CosmosKinds().galaxy.Band).toBe(1);
		expect(scene.Graphics().Level).toBe('low');
		expect(scene.Sown().Things).toBe(0);
		expect(scene.SownNear(0, 0, 10)).toEqual([]);

		scene.Add('unit', {ID: 'walker', X: -8, Y: 0, Speed: 1.4});

		/* A walk on the ground, past what is sown: the ground may take a moment to lead (Move false meanwhile). */
		await waitFor(function () {
			return scene.Move('walker', [6, 0]);
		}, 4000);

		/* The walker under the keys: the frames step a hero, what threw at each. */
		scene.Control('walker');

		await new Promise(function (resolve) {
			window.setTimeout(resolve, 1000);
		});

		expect(errors).toEqual([]);
	});
});
