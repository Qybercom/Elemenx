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

	/*
	 * Regression: the voxels took the colors of the corners of what stood, cut to 0.85: what glows (a color over 1) was a
	 * dull voxel and lit nothing round it, a model of a file (white corners) was white. Now what glows is laid glowing (alpha
	 * under 1), and its faces give its light to the probes.
	 */
	it('lays what glows glowing, so its faces give its light', async function () {
		var scene = await mount();
		var field = scene.Scene().Ground.Field;
		var voxels;
		var glowing = 0;
		var x;
		var y;
		var z;

		/* A block of 3 m that glows (a color over 1), wider than a voxel: what is thinner than one (the flame of a torch) is not laid. */
		Elemenx.Service('SceneModels').Define('probe-glow', {Parts: [{ID: 'glow', Shape: 'box', At: [0, 0.5, 0], Size: [1, 1, 1], Color: [4, 2, 1]}]});

		scene.Add({ID: 'probe-torch', Kind: 'thing', Values: {Model: 'probe-glow', Size: 3, X: 5, Y: 5}});

		try {
			for (x = 0; x < 100; x++) {
				frames(scene, 1);

				await new Promise(function (done) {
					setTimeout(done, 5);
				});
			}

			await settled(scene);

			voxels = scene.Engine().VoxelsRead();

			for (y = 0; y < 32; y++) {
				for (x = 0; x < 64; x++) {
					for (z = 0; z < 64; z++) {
						var place = [voxels.Corner[0] + x + 0.5, voxels.Corner[1] + y + 0.5, voxels.Corner[2] + z + 0.5];
						var texel = (Math.floor(y / 8) * 64 + z) * 512 + (y % 8) * 64 + x;
						var alpha = voxels.Data[texel * 4 + 3];
						if (Math.hypot(place[0] - 5, place[2] - 5) < 2 && place[1] > field.Height(5, 5) + 1 && alpha > 127 && alpha < 245)
							glowing++;
					}
				}
			}

			expect(glowing).toBeGreaterThan(0);
		}
		finally {
			scene.Remove('probe-torch');

			frames(scene, 2);

			await settled(scene);
		}
	}, 120000);

	/*
	 * Regression: a model of a file has its color in the picture of its material: of the colors of its corners and its tint
	 * alone, it was laid white, and lit the ground round it white.
	 */
	it('lays a model of a file in the color of the picture of its material', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var draw = renderer.Draw;
		var shaders = scene.Shaders(Elemenx.Service('Renderer'));
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'out vec3 vColor;',
			'out vec2 vUV;',
			'out vec3 vTint;',
			'void main() { vColor = vec3(1.0); vUV = vec2(0.5); vTint = vec3(1.0); gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), shaders.VoxelSurface);
		var picture = document.createElement('canvas');
		var target = renderer.Target(1, 1, {});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixel = new Uint8Array(4);
		var surfaced = [];
		var red;

		/* What the voxels of a model of a material are drawn with: as it says, its picture among it. */
		renderer.Draw = function (mesh, given, uniforms, options) {
			if (uniforms && uniforms.uSurfaceOn !== undefined && options && options.Depth === false)
				surfaced.push(uniforms.uSurfaceOn === 1 ? !!uniforms.uColorMap && !!uniforms.uBaseColor : uniforms.uColorMap === undefined);

			return draw.apply(this, arguments);
		};

		try {
			/* One square more: the grid is laid again. */
			scene.Scene().Ground.Nodes['test:square'] = scene.Scene().Ground.Nodes[Object.keys(scene.Scene().Ground.Nodes)[0]];

			frames(scene, 1);

			delete scene.Scene().Ground.Nodes['test:square'];

			for (var i = 0; i < 200 && !surfaced.length; i++) {
				frames(scene, 1);

				await new Promise(function (done) {
					setTimeout(done, 2);
				});
			}
		}
		finally {
			renderer.Draw = draw;
		}

		/* The grid laid again of what stands as it was, before the next test. */
		await settled(scene);

		frames(scene, 2);

		await settled(scene);

		expect(surfaced.length).toBeGreaterThan(0);
		expect(surfaced.every(Boolean)).toBe(true);

		/* Its picture red, its color white, the colors of its corners white: laid red. */
		picture.width = 4;
		picture.height = 4;
		picture.getContext('2d').fillStyle = 'rgb(220, 12, 12)';

		picture.getContext('2d').fillRect(0, 0, 4, 4);

		red = renderer.Texture(picture, {Srgb: true, Mipmaps: true, Repeat: true});

		function laid (on) {
			target.Begin();

			renderer.Draw(quad, program, {uSurfaceOn: on, uBaseColor: [1, 1, 1, 1], uColorMap: red, uEmissive: [0, 0, 0], uEmissiveMap: red}, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			target.End();

			return Array.from(pixel);
		}

		expect(laid(1)[0]).toBeGreaterThan(laid(1)[1] * 4);
		expect(laid(1)[3]).toBe(255);
		/* Of the colors of its corners alone (as it was): white. */
		expect(laid(0)[1]).toBeGreaterThan(200);
	}, 120000);

	/*
	 * Regression: each square of the ground near the eye was drawn into each of the 160 slabs of the grid (200 draws more a
	 * frame while it was laid, the frame twice as long). Now a square is drawn only into the slabs it reaches into.
	 */
	it('draws a square of the ground only into the slabs of the grid it reaches into', async function () {
		var scene = await mount();
		var ground = scene.Scene().Ground;
		var engine = scene.Engine();
		var draw = engine.Renderer.Draw;
		var near;
		var drawn = 0;
		var i;

		await settled(scene);

		near = Object.keys(ground.Nodes).filter(function (key) {
			var node = ground.Nodes[key];

			return node.Used === ground.Frame && node.Mesh && Math.hypot(node.Center[0] - scene.Scene().Eye[0], node.Center[1] - scene.Scene().Eye[1], node.Center[2] - scene.Scene().Eye[2]) <= 120;
		}).length;

		engine.Renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uOffset && options && options.Depth === false)
				drawn++;

			return draw.apply(this, arguments);
		};

		try {
			/* One square more: the grid is laid again, all its 160 slabs. */
			ground.Nodes['test:square'] = ground.Nodes[Object.keys(ground.Nodes)[0]];

			frames(scene, 1);

			delete ground.Nodes['test:square'];

			for (i = 0; i < 200 && scene.Engine().ProbesRead().Laying; i++) {
				frames(scene, 1);

				await new Promise(function (done) {
					setTimeout(done, 2);
				});
			}
		}
		finally {
			engine.Renderer.Draw = draw;
		}

		expect(scene.Engine().ProbesRead().Laying).toBe(false);
		expect(near).toBeGreaterThan(2);
		expect(drawn).toBeGreaterThan(0);
		expect(drawn).toBeLessThan(near * 160 * 0.5);
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
	 * Regression: the grid had only the surfaces, and what was under the ground was air to it: the probes under it (in the
	 * rock over a tunnel) saw the sky through the rock, and what hung from the roof of a tunnel shone white. Where the ground
	 * is rock its voxels are solid now (SceneTerrainGenerator.Rock, of the workers), and a probe there is in a wall.
	 */
	it('takes what is under the ground for rock: its voxels solid, a probe there in a wall, with no sky', async function () {
		var scene = await mount();
		var field = scene.Scene().Ground.Field;
		var voxels;
		var read;
		var under;
		var y;

		frames(scene, 20);

		await settled(scene);

		frames(scene, 40);

		voxels = scene.Engine().VoxelsRead();
		read = scene.Engine().ProbesRead();

		function solid (x, yy, z) {
			var texel = (Math.floor(yy / 8) * 64 + z) * 512 + (yy % 8) * 64 + x;

			return voxels.Data[texel * 4 + 3] > 127;
		}

		/* The column at x 10, z 10: every voxel from the floor of the grid to the ground solid. */
		y = Math.floor(field.Height(10, 10) - voxels.Corner[1]);

		expect(y).toBeGreaterThan(4);
		expect(Array.from({length: y}, function (unused, index) {
			return solid(10 - voxels.Corner[0], index, 10 - voxels.Corner[2]);
		}).every(Boolean)).toBe(true);

		under = probeAt(read, [10, field.Height(10, 10) - 4, 10]);

		expect(under.At[1]).toBeLessThan(field.Height(10, 10) - 2);
		expect(under.Walled).toBeGreaterThan(0.3);
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
		/*
		 * Regression: a metal deep in a cave mirrored the whole sky (only the rooms of a ship darkened it). Now it mirrors the
		 * sky as much as the light round it is of the light of the open there.
		 */
		expect(shaders.Pbr).toContain('vec3 mirrored = skyLight(reflected, roughness, uSkyLight, uFloorLight, uSkySun, 1.25) * skySeenHere;');
		expect(shaders.Pbr).toContain('float skySeenHere = clamp(dot(around, vec3(0.3, 0.59, 0.11)) / max(dot(skyAround * skySeen(vWorld) + sunBounce(vWorld)');
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

	/*
	 * Regression: on medium (a phone, most of them) nothing bounced: what stood in the shade was as grey all round. The light
	 * of the field (a map of the whole ground: what it bounces, how much of the sky each place sees) is on medium too.
	 */
	it('gives each surface the light of the field on medium and low too', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var draw = engine.Renderer.Draw;
		var seen = [];
		var i;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uGlowOn !== undefined && uniforms.uViewProjection)
				seen.push(uniforms.uGlowOn);

			return draw.apply(this, arguments);
		};

		try {
			for (var quality of ['medium', 'low']) {
				scene.Quality = quality;
				seen = [];

				for (i = 0; i < 300 && seen.indexOf(1) < 0; i++) {
					seen = [];

					frames(scene, 1);

					await new Promise(function (done) {
						setTimeout(done, 2);
					});
				}

				expect(scene.Graphics(), quality).toMatchObject({Field: true});
				expect(scene.Graphics().Probes, quality).toBeUndefined();
				expect(seen.indexOf(1), quality).toBeGreaterThanOrEqual(0);
			}
		}
		finally {
			engine.Renderer.Draw = draw;
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
