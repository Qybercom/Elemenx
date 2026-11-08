import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from './../setup.js';
import { Use } from './../library.js';

/* One scene for all the tests of the file, its quality changed for each: a scene each compiled all its shaders again, and many at once slowed the others. */
var shared = null;

/* A scene of a level ground lit from low, rocks on it, its eye near them. */
async function create (quality) {
	var ready = null;
	var component = Elemenx.Component(unique('ContactHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Paused="true" Quality="' + quality + '" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (space) {
		ready = space;
	}})();
	var now = performance.now() + 100;

	shared = component;

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 400, Height: 0.2, Water: 0, Scale: 300, Ridges: 0, Seed: 'contact'})});
	ready.Add({ID: 'sun', Kind: 'sun', Time: 16.5});
	[[0, 0], [1.5, 0.8], [-1.2, 1.4], [0.6, -1.5]].forEach(function (at, index) {
		ready.Add({ID: 'rock-' + index, Kind: 'rock', X: at[0], Y: at[1], Size: 0.5});
	});
	ready.SetViewpoint({Target: [0, 0, 0], Yaw: 0.4, Pitch: 0.4, Distance: 5});

	await waitFor(function () {
		var ground = ready.Scene().Ground;

		ready.Scene().Rest = 0;

		ready.Engine().Frame(now += 33);

		return ground && ground.Nodes && Object.keys(ground.Nodes).length > 4 && ground.Missing === 0;
	}, 60000);

	ready.Now = now;

	return ready;
}

/* The scene of the file at a quality, a few frames drawn at it. */
async function mount (quality) {
	var scene = shared ? Elemenx.Instance(shared.$Element().querySelector('.elemenx-scene')) : await create(quality);
	var i;

	scene.Quality = quality;

	for (i = 0; i < 4; i++) {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(scene.Now += 33);
	}

	return scene;
}

/* The pixels of the picture after a few frames (the frames add up). */
function picture (scene, frames) {
	var gl = scene.Engine().Renderer.GL;
	var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
	var i;

	for (i = 0; i < frames; i++) {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(scene.Now += 33);
	}

	gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	return pixels;
}

describe('Contract: contact shadows of the sun on high and ultra', function () {
	beforeAll(async function () {
		await loadElemenx();

		resetDOM();

		Use(['Scene', 'service:Renderer', 'service:Meshes', 'service:SceneWorld']);
	});

	afterAll(function () {
		if (shared)
			shared.$Destroy();

		shared = null;
	});

	it('darkens what the maps of the shadows leave lit next to what hides it from the sun, and only darkens', async function () {
		var scene = await mount('ultra');
		var on;
		var off;
		var darker = 0;
		var lighter = 0;
		var i;

		expect(scene.Graphics()).toMatchObject({Contact: true});
		expect(scene.Graphics().Occlusion).toBeGreaterThan(0);

		on = picture(scene, 12);

		scene.Scene().Tuned = {Contact: false};

		try {
			off = picture(scene, 12);
		}
		finally {
			scene.Scene().Tuned = null;
		}

		for (i = 0; i < on.length; i += 4) {
			var change = on[i] + on[i + 1] + on[i + 2] - off[i] - off[i + 1] - off[i + 2];

			if (change < -12) darker++;
			else if (change > 12) lighter++;
		}

		expect(darker).toBeGreaterThan(30);
		expect(lighter).toBeLessThan(darker * 0.2);
	}, 120000);

	it('darkens the folds by the horizons round each point (GTAO), the open ground hardly', async function () {
		var scene = await mount('ultra');
		var shown;
		var values = [];
		var i;

		scene.Scene().Tuned = {Show: 'dark', Contact: false};

		try {
			shown = picture(scene, 12);
		}
		finally {
			scene.Scene().Tuned = null;
		}

		for (i = 0; i < shown.length; i += 4)
			values.push(shown[i]);

		values.sort(function (a, b) {
			return a - b;
		});

		/* Most of it the open ground, nearly white; at the feet of the rocks, darker. */
		expect(values[Math.floor(values.length / 2)]).toBeGreaterThan(200);
		expect(values[Math.floor(values.length * 0.001)]).toBeLessThan(values[Math.floor(values.length / 2)] * 0.85);
	}, 120000);

	it('has none on medium', async function () {
		var scene = await mount('medium');

		expect(scene.Graphics().Contact).toBeFalsy();
	}, 120000);
});
