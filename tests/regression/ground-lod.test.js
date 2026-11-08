import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from './../setup.js';
import { Use } from './../library.js';

var owned = [];

/* A scene of a ground of its options, its eye low over its middle. */
async function mount (options) {
	var ready = null;
	var component = Elemenx.Component(unique('LodHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (space) {
		ready = space;
	}})();
	var now = performance.now() + 100;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library(options)});
	ready.SetViewpoint({Target: [0, 0, 0], Yaw: 0.3, Pitch: 0.35, Distance: 60});

	await waitFor(function () {
		var ground = ready.Scene().Ground;

		ready.Scene().Rest = 0;

		ready.Engine().Frame(now += 33);

		return ground && ground.Nodes && Object.keys(ground.Nodes).length > 4 && ground.Missing === 0;
	}, 60000);

	return ready;
}

/* The deepest level of the squares of a ground made so far. */
function deepest (scene) {
	return Object.keys(scene.Scene().Ground.Nodes).reduce(function (most, key) {
		return Math.max(most, Number(key.split(':')[2]) || 0);
	}, 0);
}

describe('Regression: the squares of a ground as fine as the eye sees their grid', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'service:Renderer', 'service:Meshes', 'service:SceneWorld']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * A square was split by its distance alone, at most 6 times: the ridges of mountains as coarse as a plain. Now it is
	 * split while its grid is more than a pixel and a half from the ground on the screen: deeper on rough ground.
	 */
	it('splits the squares of rough ground deeper than those of level ground, each knowing how far its grid is from it', async function () {
		var rough = await mount({Size: 2000, Height: 120, Water: 0, Scale: 60, Ridges: 1, Seed: 'rough'});
		var level;
		var flat;

		level = deepest(rough);

		expect(Object.keys(rough.Scene().Ground.Nodes).some(function (key) {
			return rough.Scene().Ground.Nodes[key].Error > 0.5;
		})).toBe(true);
		expect(level).toBeGreaterThan(6);

		flat = await mount({Size: 2000, Height: 0.2, Water: 0, Scale: 600, Ridges: 0, Seed: 'flat'});

		expect(deepest(flat)).toBeLessThan(level);
	}, 120000);

	/*
	 * Regression: a square was split by the distance of the eye to its middle; a large one the eye stood by the corner of
	 * stayed coarse beside fine ones, and their edge showed as a step. Now by the distance to the nearest point of it.
	 */
	it('splits each square as near to the eye as a third of its size, though its middle is far', async function () {
		var scene = await mount({Size: 2000, Height: 0.2, Water: 0, Scale: 600, Ridges: 0, Seed: 'corner'});
		var ground = scene.Scene().Ground;
		var eye;
		var used;
		var coarse;
		var now = performance.now() + 5000;
		var i;

		/* The eye low over a corner of the squares of every level: [0, 0]. */
		scene.SetViewpoint({Target: [3, 0, 3], Yaw: 0.8, Pitch: 0.3, Distance: 12});

		for (i = 0; i < 400 && (i < 3 || ground.Missing); i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);

			await new Promise(function (done) {
				setTimeout(done, 5);
			});
		}

		eye = scene.Scene().Eye;
		used = Object.keys(ground.Nodes).filter(function (key) {
			return ground.Nodes[key].Used === ground.Frame && ground.Nodes[key].Size;
		}).map(function (key) {
			return {Level: Number(key.split(':')[2]), Node: ground.Nodes[key]};
		});
		coarse = used.filter(function (one) {
			var node = one.Node;
			var half = node.Size / 2;
			var leaf = !used.some(function (other) {
				return other.Level > one.Level && Math.abs(other.Node.Center[0] - node.Center[0]) < half && Math.abs(other.Node.Center[2] - node.Center[2]) < half;
			});
			var near = Math.hypot(eye[0] - Math.max(node.Center[0] - half, Math.min(node.Center[0] + half, eye[0])), eye[1] - node.Top, eye[2] - Math.max(node.Center[2] - half, Math.min(node.Center[2] + half, eye[2])));

			return leaf && one.Level < 6 && near < node.Size * 0.35;
		});

		expect(ground.Missing).toBe(0);
		expect(used.length).toBeGreaterThan(8);
		expect(coarse.map(function (one) {
			return one.Level + ' ' + one.Node.Center.join(',');
		})).toEqual([]);
	}, 120000);

	/* Regression: a square made again at once destroyed the mesh of the one it replaced, still to be drawn that frame (GL INVALID_OPERATION). */
	it('draws no square of a ground whose mesh is gone while the ground is made again', async function () {
		var scene = await mount({Size: 600, Height: 20, Water: 0, Scale: 200, Ridges: 0.3, Seed: 'again'});
		var renderer = scene.Engine().Renderer;
		var gl = renderer.GL;
		var draw = renderer.Draw;
		var bad = 0;
		var now = performance.now() + 5000;
		var i;

		/* From far over it: all of the ground one square, made again at once. */
		scene.SetViewpoint({Target: [0, 0, 0], Yaw: 0, Pitch: 1.2, Distance: 4000});

		for (i = 0; i < 3; i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}

		renderer.Draw = function () {
			var made = draw.apply(this, arguments);

			if (gl.getError() !== gl.NO_ERROR)
				bad++;

			return made;
		};

		try {
			for (i = 0; i < 4; i++) {
				scene.Add({ID: 'way-' + i, Kind: 'road', Traits: {Road: {Type: 'road', Points: [[-200, -100 + i * 40], [200, -100 + i * 40]]}}});

				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 33);

				scene.Scene().Rest = 0;

				scene.Engine().Frame(now += 33);
			}
		}
		finally {
			renderer.Draw = draw;
		}

		expect(bad).toBe(0);
	}, 120000);
});
