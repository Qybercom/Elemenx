import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from './../setup.js';
import { Use } from './../library.js';

/* One scene for all the tests of the file: a scene each compiled all its shaders again. */
var shared = null;

/* A level ground at noon, a culvert lying on it along x (radius 1.6 m), the eye by it. */
async function create () {
	var ready = null;
	var component = Elemenx.Component(unique('ProbeHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Paused="true" Quality="ultra" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (space) {
		ready = space;
	}})();
	var now = performance.now() + 100;

	shared = component;

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 400, Height: 0.2, Water: 0, Scale: 300, Ridges: 0, Seed: 'probes'})});
	ready.Add({ID: 'sun', Kind: 'sun', Time: 12});
	ready.Add({ID: 'culvert', Kind: 'pipe', Traits: {Pipe: {Points: [[-30, 0], [30, 0]], Radius: 1.6, Wall: 0.18, Laid: 'ground'}}});
	ready.SetViewpoint({Target: [0, 1, 0], Yaw: 0.5, Pitch: 0.3, Distance: 12});

	await waitFor(function () {
		var ground = ready.Scene().Ground;

		ready.Scene().Rest = 0;

		ready.Engine().Frame(now += 33);

		return ground && ground.Nodes && Object.keys(ground.Nodes).length > 4 && ground.Missing === 0;
	}, 60000);

	ready.Now = now;

	return ready;
}

async function mount () {
	return shared ? Elemenx.Instance(shared.$Element().querySelector('.elemenx-scene')) : await create();
}

function frames (scene, count) {
	var i;

	for (i = 0; i < count; i++) {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(scene.Now += 33);
	}
}

/*
 * Frames till the ground is made and the grid of voxels laid of it (a few slabs a frame): under load the squares of the
 * ground come late, and the grid is laid again of them. Regression: read after a fixed count of frames, half laid.
 */
async function settled (scene) {
	var i;

	for (i = 0; i < 600; i++) {
		var read = scene.Engine().ProbesRead();
		if (read && !read.Laying && !scene.Scene().Ground.Missing && i > 2) return;

		frames(scene, 1);

		await new Promise(function (done) {
			setTimeout(done, 2);
		});
	}
}

/* The red of the light a probe holds (its first harmonic), of a place: the probe nearest to it. */
function probeAt (read, place) {
	var index = [0, 1, 2].map(function (axis) {
		return Math.max(0, Math.min(read.Count[axis] - 1, Math.round((place[axis] - read.Corner[axis] - 1) / read.Spacing)));
	});
	var texel = index[2] * read.Width + index[0] + index[1] * read.Count[0];

	return {Light: read.Data[texel * 4], Walled: read.Info[texel * 4], Age: read.Info[texel * 4 + 1], At: index.map(function (value, axis) {
		return read.Corner[axis] + 1 + value * read.Spacing;
	})};
}

describe('Contract: the light that bounces, of probes round the eye, on high and ultra', function () {
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

	it('lays what stands round the eye in voxels of a metre: the ground, and the walls of a culvert round its hollow', async function () {
		var scene = await mount();
		var voxels;
		var ground;
		var column;
		var y;

		frames(scene, 20);

		await settled(scene);

		voxels = scene.Engine().VoxelsRead();

		expect(voxels).not.toBe(null);

		/* Solid of a voxel (x, y, z of the grid): the layers of y, 8 a row, each 64 by 64 of x by z. */
		function solid (x, yy, z) {
			var texel = (Math.floor(yy / 8) * 64 + z) * 512 + (yy % 8) * 64 + x;

			return voxels.Data[texel * 4 + 3] > 127;
		}

		/* The column at x 10, z 10 (far from the culvert): solid at the ground, empty over it. */
		column = [];
		ground = Math.floor(scene.Scene().Ground.Field.Height(10, 10) - voxels.Corner[1]);

		for (y = 0; y < 32; y++)
			column.push(solid(10 - voxels.Corner[0], y, 10 - voxels.Corner[2]));

		expect(column[ground]).toBe(true);
		expect(column.slice(ground + 2).some(Boolean)).toBe(false);

		/* Across the culvert at x 0: its top over the ground solid, its hollow free, nothing over it. */
		var x = 0 - voxels.Corner[0];
		var z = 0 - voxels.Corner[2];
		var low = Math.floor(scene.Scene().Ground.Field.Height(0, 0) - voxels.Corner[1]);
		var hollow = false;
		var top = -1;

		for (y = low + 1; y < low + 6; y++) {
			if (!solid(x, y, z) && !solid(x, y, z - 1) && top < 0)
				hollow = true;

			if (solid(x, y, z) || solid(x, y, z - 1))
				top = y;
		}

		expect(hollow).toBe(true);
		expect(top).toBeGreaterThan(low + 1);
		expect(solid(x, top + 2, z)).toBe(false);
	}, 120000);

	/* Regression: laid while the squares of the ground were still coming, the grid had no ground till ten seconds were gone. */
	it('lays the grid of voxels again when the squares of the ground change', async function () {
		var scene = await mount();
		var ground = scene.Scene().Ground;
		var key = Object.keys(ground.Nodes)[0];
		var node = ground.Nodes[key];

		await settled(scene);

		expect(scene.Engine().ProbesRead().Laying).toBe(false);

		/* One square more: the ground changed under the grid. */
		ground.Nodes['test:square'] = node;

		frames(scene, 1);

		expect(scene.Engine().ProbesRead().Laying).toBe(true);

		delete ground.Nodes['test:square'];

		await settled(scene);
	}, 120000);

	it('gathers less light in the hollow of the culvert than in the open beside it, and none of its probes stays in a wall', async function () {
		var scene = await mount();
		var read;
		var height;
		var inside;
		var open;

		frames(scene, 120);

		read = scene.Engine().ProbesRead();
		height = scene.Scene().Ground.Field.Height(0, 0) + 1.6;
		inside = probeAt(read, [0, height, 0]);
		open = probeAt(read, [0, height, 8]);

		expect(inside.Age).toBeGreaterThan(5);
		expect(inside.Walled).toBeLessThan(0.3);
		expect(open.Light).toBeGreaterThan(0.2);
		expect(inside.Light).toBeLessThan(open.Light * 0.35);
	}, 120000);

	/*
	 * What mirrors and is not on the screen mirrors what is round the eye: an octahedral map of rays through the voxels from
	 * the eye, the sky where nothing is (alpha 0). In the open, the ground below and the sky above; in the culvert, its walls.
	 */
	it('maps what is round the eye for the mirrors: the ground below and the sky above in the open, the walls all round in the culvert', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var height = scene.Scene().Ground.Field.Height(0, 0) + 1.6;
		var read;

		/* What the map holds the way given: alpha 1 something there, 0 the sky. */
		function seen (way) {
			var sum = Math.abs(way[0]) + Math.abs(way[1]) + Math.abs(way[2]);
			var o = [way[0] / sum, way[2] / sum];
			var texel;

			if (way[1] < 0)
				o = [(1 - Math.abs(o[1])) * (o[0] >= 0 ? 1 : -1), (1 - Math.abs(o[0])) * (o[1] >= 0 ? 1 : -1)];

			texel = Math.min(127, Math.floor((o[1] * 0.5 + 0.5) * 128)) * 128 + Math.min(127, Math.floor((o[0] * 0.5 + 0.5) * 128));

			return read.Around[texel * 4 + 3];
		}

		scene.SetViewpoint({Target: [0, height, 14], Yaw: 0, Pitch: 0.1, Distance: 3});

		frames(scene, 40);

		await settled(scene);

		frames(scene, 4);

		read = engine.ProbesRead();

		expect(engine.ProbeAround().On).toBe(true);
		expect(seen([0, -1, 0])).toBe(1);
		expect(seen([0.1, 1, 0.1])).toBe(0);

		/* In the hollow of the culvert, looking along it: its walls over, under and beside the eye. */
		scene.SetViewpoint({Target: [6, height, 0], Yaw: Math.PI / 2, Pitch: 0, Distance: 0.5});

		frames(scene, 60);

		await settled(scene);

		frames(scene, 4);

		read = engine.ProbesRead();

		expect(Math.abs(scene.Scene().Eye[2])).toBeLessThan(1);
		expect(seen([0, 1, 0])).toBe(1);
		expect(seen([0, -1, 0])).toBe(1);
		expect(seen([0, 0.2, 1])).toBe(1);
		expect(seen([0, 0.2, -1])).toBe(1);
	}, 120000);

	it('gives the reflections of the screen what is round the eye on high and ultra, none when scene.Tuned.Probes is false', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var draw = engine.Renderer.Draw;
		var seen = [];

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uAround !== undefined)
				seen.push({On: uniforms.uAroundOn, Seed: uniforms.uSeed});

			return draw.apply(this, arguments);
		};

		try {
			frames(scene, 3);

			expect(seen.length).toBeGreaterThan(0);
			expect(seen[seen.length - 1].On).toBe(1);
			expect(typeof seen[seen.length - 1].Seed).toBe('number');

			scene.Scene().Tuned = {Probes: false};
			seen = [];

			frames(scene, 2);

			expect(seen.length).toBeGreaterThan(0);
			expect(seen.every(function (one) {
				return one.On === 0;
			})).toBe(true);
		}
		finally {
			engine.Renderer.Draw = draw;
			scene.Scene().Tuned = null;
		}
	}, 120000);

	/*
	 * Regression: the reflections on the body of a car broke into blocks of two pixels, flat facets and patches of another
	 * shade: they were made at half the size, of a normal from the slopes of the depth, and put in place of the color. Now
	 * the models of files draw the normal they are drawn by into a target of their own (not a second color of the scene:
	 * the graphics card made each program of the scene again for that, and a scene took twice as long to come), the
	 * reflections are as large as the view, and a dielectric gets what it mirrors added over it.
	 */
	it('makes the reflections as large as the view of the normals the surfaces were drawn by, and adds them over a dielectric', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var draw = engine.Renderer.Draw;
		var shaders = scene.Shaders(Elemenx.Service('Renderer'));
		var mirror = [];
		var screened = [];

		['Pbr', 'Solid', 'Land'].forEach(function (name) {
			expect(shaders[name]).not.toContain('outNormal');
		});
		expect(shaders.Normal).toContain('outColor = vec4(normalize(vNormal), 1.0);');
		expect(shaders.Pbr).toContain('fresnel * mirrored * screened');

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uAround !== undefined)
				mirror.push({Normals: uniforms.uNormalsOn, Scale: uniforms.uScale});

			if (uniforms && uniforms.uScreenMirror !== undefined)
				screened.push(uniforms.uScreenMirror);

			return draw.apply(this, arguments);
		};

		try {
			['high', 'ultra'].forEach(function (quality) {
				scene.Quality = quality;
				mirror = [];
				screened = [];

				frames(scene, 3);

				expect(mirror.length).toBeGreaterThan(0);
				expect(mirror[mirror.length - 1]).toEqual({Normals: 1, Scale: 1});
				expect(screened.indexOf(1)).toBeGreaterThanOrEqual(0);
			});

			/* With the reflections off, a model mirrors the sky itself again. */
			scene.Scene().Tuned = {Mirror: false};
			screened = [];

			frames(scene, 2);

			expect(screened.length).toBeGreaterThan(0);
			expect(screened.every(function (value) {
				return value === 0;
			})).toBe(true);
		}
		finally {
			engine.Renderer.Draw = draw;
			scene.Scene().Tuned = null;
			scene.Quality = 'ultra';
		}
	}, 120000);

	it('gives each surface the probes on high and ultra, none on medium nor when scene.Tuned.Probes is false', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var draw = engine.Renderer.Draw;
		var seen = [];

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uProbeOn !== undefined && uniforms.uViewProjection)
				seen.push({On: uniforms.uProbeOn, Box: uniforms.uProbeBox, Count: uniforms.uProbeCount});

			return draw.apply(this, arguments);
		};

		try {
			frames(scene, 2);

			expect(seen.some(function (one) {
				return one.On === 1;
			})).toBe(true);
			expect(seen.filter(function (one) {
				return one.On === 1;
			})[0].Count).toEqual([64, 32, 64]);
			expect(seen.filter(function (one) {
				return one.On === 1;
			})[0].Box[3]).toBe(1);
			expect(scene.Graphics().Probes).toBeGreaterThan(0);

			scene.Scene().Tuned = {Probes: false};
			seen = [];

			frames(scene, 2);

			expect(seen.length).toBeGreaterThan(0);
			expect(seen.every(function (one) {
				return one.On === 0;
			})).toBe(true);

			scene.Scene().Tuned = null;
			scene.Quality = 'medium';
			seen = [];

			frames(scene, 2);

			expect(scene.Graphics().Probes).toBeUndefined();
			expect(seen.every(function (one) {
				return one.On === 0;
			})).toBe(true);
		}
		finally {
			engine.Renderer.Draw = draw;
			scene.Scene().Tuned = null;
			scene.Quality = 'ultra';
		}
	}, 120000);
});
