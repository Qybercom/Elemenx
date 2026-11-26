import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from './../setup.js';
import { Use } from './../library.js';

var owned = [];

/* A level ground 2 m high with a mountain of a sketch 220 m over it, a tunnel through the mountain; the sun at noon. */
async function mount (view) {
	var ready = null;
	var component = Elemenx.Component(unique('ReachHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Paused="true" Quality="ultra" Labels="false" CacheSize="0" (ready)="Ready"></Scene></div>', Ready: function (space) {
		ready = space;
	}})();
	var now = performance.now() + 100;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 2000, Height: 2, Water: 0, Scale: 500, Ridges: 0, Seed: 'sun-reach', Sketch: {Layers: [{ID: 'base', Visible: true, Strength: 1, Items: [{ID: 'm', Type: 'mountain', At: [0, 0], Radius: 160, Height: 220}]}]}, Passages: [{Radius: 2.5, Nodes: [{ID: 'a', At: [-300, 0, 3]}, {ID: 'b', At: [300, 0, 3]}], Ways: [{From: 'a', To: 'b'}]}]})});
	ready.Add({ID: 'sun', Kind: 'sun', Time: 12});
	ready.SetViewpoint(view);

	await waitFor(function () {
		var ground = ready.Scene().Ground;

		ready.Scene().Rest = 0;

		ready.Engine().Frame(now += 33);

		return ground && ground.Nodes && Object.keys(ground.Nodes).length > 4 && ground.Missing === 0;
	}, 120000);

	ready.Now = now;

	return ready;
}

/* Frames of a scene, a few milliseconds between them (the workers answer). */
async function settle (scene, count) {
	var i;

	for (i = 0; i < count; i++) {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(scene.Now += 33);

		await new Promise(function (done) {
			setTimeout(done, 2);
		});
	}
}

/* What the probe nearest to a place holds: the red of its light (its first harmonic), how much of it is in a wall, where it is. */
function probeAt (read, place) {
	var index = [0, 1, 2].map(function (axis) {
		return Math.max(0, Math.min(read.Count[axis] - 1, Math.round((place[axis] - read.Corner[axis] - 1) / read.Spacing)));
	});
	var texel = index[2] * read.Width + index[0] + index[1] * read.Count[0];

	return {Light: read.Data[texel * 4], Walled: read.Info[texel * 4], At: index.map(function (value, axis) {
		return read.Corner[axis] + 1 + value * read.Spacing;
	})};
}

describe('Regression: the light of a tunnel under a mountain and of the shadow of the mountain', function () {
	beforeAll(async function () {
		await loadElemenx();

		resetDOM();

		Use(['Scene', 'service:Renderer', 'service:Meshes', 'service:SceneWorld']);
	});

	afterAll(function () {
		while (owned.length) owned.pop().$Destroy();
	}, 90000);

	/*
	 * Regression: the views of the sun stood as far back along it as twice the height of the ground of its options (Top),
	 * 4 m here: the mountain of a sketch over a tunnel was cut off at their near plane, and the sun shone on what stood in
	 * the tunnel (a stone in a hall of a cave shone white). Now as far back as the highest of the squares round the eye.
	 */
	it('holds the top of a mountain over a tunnel in the nearest view of the sun, the eye in the tunnel', async function () {
		var scene = await mount({Target: [-60, 4, 0], Yaw: Math.PI / 2, Pitch: 0, Distance: 3});
		var engine = scene.Engine();
		var draw = engine.Renderer.Draw;
		var field = scene.Scene().Ground.Field;
		var seen = null;
		var eye;
		var top;
		var m;
		var clip;
		var i;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uCascadeOn === 1 && uniforms.uCascades && uniforms.uViewProjection)
				seen = Array.prototype.slice.call(uniforms.uCascades, 0, 16);

			return draw.apply(this, arguments);
		};

		/* The programs of the views of the sun made by the card first (none waited for on a shown canvas): frames till then. */
		try {
			for (i = 0; i < 6; i++) {
				scene.Scene().Rest = 0;

				engine.Frame(scene.Now += 33);
			}

			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(scene.Now += 33);

				return seen;
			}, 60000);
		}
		finally {
			engine.Renderer.Draw = draw;
		}

		eye = scene.Scene().Eye;
		top = field.Height(eye[0], eye[2]);

		expect(top - eye[1]).toBeGreaterThan(100);
		expect(seen).not.toBe(null);

		/* The top of the mountain over the eye, from the eye, in the nearest view of the sun: inside its depth. */
		m = seen;
		clip = [0, 1, 2, 3].map(function (row) {
			return m[row] * 0 + m[4 + row] * (top - eye[1]) + m[8 + row] * 0 + m[12 + row];
		});

		expect(clip[2] / clip[3]).toBeGreaterThan(-1);
		expect(clip[2] / clip[3]).toBeLessThan(1);
	}, 240000);

	/*
	 * Regression: a ray of a probe that left the grid of voxels was given the sky; along a tunnel under a hill, out of it at
	 * the edge of the grid, it brought the whole sky into the tunnel (0.27 at its probe by that edge). Now it takes the sky as
	 * much as the daylight of the cave lets come there (Daylight of SceneTerrainGenerator over the grid): none, deep in.
	 */
	it('takes no sky into a tunnel by a ray that leaves the grid of voxels along it', async function () {
		var scene = await mount({Target: [-60, 4, 0], Yaw: Math.PI / 2, Pitch: 0, Distance: 3});
		var read;
		var edge;

		await settle(scene, 400);

		read = scene.Engine().ProbesRead();
		edge = probeAt(read, [read.Corner[0] + 1, 3, 1]);

		expect(edge.At[0]).toBeLessThan(-90);
		expect(edge.Walled).toBeLessThan(0.3);
		expect(edge.Light).toBeLessThan(0.05);
	}, 240000);

	/*
	 * Regression: the voxels were lit by the sun as far as the voxels themselves let it, 64 m round the eye: in the shadow of
	 * a mountain out of them the ground bounced the sun, and a probe there gathered more light than one in the sun (1.26
	 * against 0.92 at seven in the morning). Now the map of the sun shades them too.
	 */
	it('gathers less light in the shadow of a mountain out of the grid of voxels than in the sun', async function () {
		var scene = await mount({Target: [-60, 4, 0], Yaw: Math.PI / 2, Pitch: 0, Distance: 3});
		var field = scene.Scene().Ground.Field;
		var light = {};

		scene.Change('sun', {Time: 7});

		for (var place of [[-300, 0], [230, 0]]) {
			var h = field.Height(place[0], place[1]);

			scene.SetViewpoint({Target: [place[0], h + 1.5, place[1]], Yaw: 0, Pitch: 0.1, Distance: 3});

			await settle(scene, 400);

			light[place[0]] = probeAt(scene.Engine().ProbesRead(), [place[0], h + 2, place[1]]).Light;
		}

		expect(scene.Scene().Ground.Sun[0]).toBeGreaterThan(0.8);
		expect(light[-300]).toBeLessThan(light[230] * 0.95);
	}, 240000);
});
