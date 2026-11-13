import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from './../setup.js';
import { Use } from './../library.js';

/* One scene for all the tests of the file, its quality changed for each: a scene each compiled all its shaders again, and many at once slowed the others. */
var shared = null;

/* A scene of a ground at a quality, its eye low over its middle, and the uniforms of the last square of ground it drew. */
async function create (quality) {
	var ready = null;
	var component = Elemenx.Component(unique('CascadeHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Paused="true" Quality="' + quality + '" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (space) {
		ready = space;
	}})();
	var now = performance.now() + 100;

	shared = component;

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 1200, Height: 30, Water: 0, Scale: 300, Ridges: 0.2, Seed: 'cascades'})});
	ready.Add({ID: 'sun', Kind: 'sun', Time: 16});
	ready.SetViewpoint({Target: [0, 0, 0], Yaw: 0.4, Pitch: 0.3, Distance: 20});

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

	/*
	 * Regression (load): the programs of another quality are made by the card behind the page, and till they are the land is
	 * not drawn; four frames were not always enough. It draws on till the card has them all.
	 */
	await waitFor(function () {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(scene.Now += 33);

		return !scene.Engine().Renderer.Progress().Needed;
	}, 60000);

	return scene;
}

/* The uniforms the next frame draws the ground with. */
function frame (scene) {
	var renderer = scene.Engine().Renderer;
	var draw = renderer.Draw;
	var seen = null;

	renderer.Draw = function (mesh, program, uniforms) {
		if (uniforms && uniforms.uShadowOn !== undefined && uniforms.uCascadeOn !== undefined)
			seen = Object.assign({}, uniforms);

		return draw.apply(this, arguments);
	};

	try {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(scene.Now += 33);
	}
	finally {
		renderer.Draw = draw;
	}

	return seen;
}

/* Where a point relative to the eye falls in a cascade: [x, y] of -1 to 1 inside it. */
function placed (matrices, index, point) {
	var m = Array.prototype.slice.call(matrices, index * 16, index * 16 + 16);
	var w = m[3] * point[0] + m[7] * point[1] + m[11] * point[2] + m[15];

	return [(m[0] * point[0] + m[4] * point[1] + m[8] * point[2] + m[12]) / w, (m[1] * point[0] + m[5] * point[1] + m[9] * point[2] + m[13]) / w];
}

describe('Contract: the shadows of the sun in four cascades on high and ultra', function () {
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

	it('casts the shadows of the view in four slices out to its far shadow, each held in its own view of the sun', async function () {
		var scene = await mount('ultra');
		var shade = frame(scene);
		var ahead;
		var near;
		var far;

		expect(scene.Graphics()).toMatchObject({Cascades: 4, ShadowFar: 500});
		expect(shade.uCascadeOn).toBe(1);
		expect(shade.uShadowOn).toBe(1);
		expect(shade.uCascades.length).toBe(64);

		/* Each slice ends farther than the one before, the last at the far shadow; the nearest a few metres. */
		expect(shade.uCascadeSplits[0]).toBeGreaterThan(2);
		expect(shade.uCascadeSplits[0]).toBeLessThan(20);

		[1, 2, 3].forEach(function (i) {
			expect(shade.uCascadeSplits[i]).toBeGreaterThan(shade.uCascadeSplits[i - 1]);
			/* A wider slice, a wider texel: a softer edge reckoned for it, a larger bias. */
			expect(shade.uCascadeBias[i]).toBeGreaterThan(shade.uCascadeBias[i - 1]);
		});

		expect(shade.uCascadeSplits[3]).toBeCloseTo(500, 6);

		/* What is ahead of the eye at the end of each slice is inside that slice's view of the sun. */
		ahead = scene.Scene().Camera;
		near = [ahead.Target[0] - ahead.Position[0], ahead.Target[1] - ahead.Position[1], ahead.Target[2] - ahead.Position[2]];
		far = Math.hypot(near[0], near[1], near[2]);

		[0, 1, 2, 3].forEach(function (i) {
			var point = near.map(function (value) {
				return value / far * shade.uCascadeSplits[i] * 0.98;
			});
			var at = placed(shade.uCascades, i, point);

			expect(Math.max(Math.abs(at[0]), Math.abs(at[1]))).toBeLessThan(1);
		});
	}, 120000);

	it('keeps one map of the shadows on medium, none of the cascades', async function () {
		var scene = await mount('medium');
		var shade = frame(scene);

		expect(scene.Graphics().Cascades).toBe(1);
		expect(shade.uCascadeOn).toBe(0);
		expect(shade.uShadowOn).toBe(1);
	}, 120000);

	it('draws its far slices less often, and keeps where they were in the world while the eye moves', async function () {
		var scene = await mount('high');
		var shade = frame(scene);
		var point = [40, 0, 70];
		var eye;
		var before;
		var after;

		expect(scene.Graphics()).toMatchObject({Cascades: 4, ShadowFar: 300});
		expect(shade.uCascadeSplits[3]).toBeCloseTo(300, 6);

		/* The frame the last slice is drawn in: each fourth. */
		while (scene.Scene().Cascaded.Frame % 4 !== 1)
			shade = frame(scene);

		eye = scene.Scene().Eye.slice();
		before = placed(shade.uCascades, 3, [point[0] - eye[0], point[1] - eye[1], point[2] - eye[2]]);

		/* A step aside, and a frame it is not drawn in: a point of the world falls in it where it fell. */
		scene.SetViewpoint({Target: [3, 0, 2], Yaw: 0.45, Pitch: 0.3, Distance: 20});

		shade = frame(scene);

		expect(scene.Scene().Cascaded.Frame % 4).toBe(2);
		expect(Math.hypot(scene.Scene().Eye[0] - eye[0], scene.Scene().Eye[2] - eye[2])).toBeGreaterThan(0.01);

		after = placed(shade.uCascades, 3, [point[0] - scene.Scene().Eye[0], point[1] - scene.Scene().Eye[1], point[2] - scene.Scene().Eye[2]]);

		expect(after[0]).toBeCloseTo(before[0], 4);
		expect(after[1]).toBeCloseTo(before[1], 4);
	}, 120000);

	/*
	 * Regression: the far slices were kept at the size of their ball, the second each second frame: the edge of what they
	 * held lagged behind a turn of the eye, and the shadows came on the things there a few frames late; the shadow of a car
	 * that drove past the nearest slice was where the car had been.
	 */
	it('draws a far slice again at once when the eye turned out of it, and the two nearest each frame', async function () {
		var scene = await mount('high');
		var shade = frame(scene);
		var slices;

		while (scene.Scene().Cascaded.Frame % 4 !== 1)
			shade = frame(scene);

		slices = scene.Scene().Cascaded.Slices.slice();

		/* A frame not the last slice's own: the two nearest drawn again round the eye, the last kept. */
		scene.SetViewpoint({Target: [3, 0, 2], Yaw: 0.45, Pitch: 0.3, Distance: 20});

		shade = frame(scene);

		expect(scene.Scene().Cascaded.Slices[0]).not.toBe(slices[0]);
		expect(scene.Scene().Cascaded.Slices[1]).not.toBe(slices[1]);
		expect(scene.Scene().Cascaded.Slices[3]).toBe(slices[3]);

		/* Turned round, in a frame not its own: the last slice holds what is ahead now. */
		scene.SetViewpoint({Target: [3, 0, 2], Yaw: 0.45 + Math.PI, Pitch: 0.3, Distance: 20});

		shade = frame(scene);

		expect(scene.Scene().Cascaded.Frame % 4).toBe(3);
		expect(scene.Scene().Cascaded.Slices[3]).not.toBe(slices[3]);

		var camera = scene.Scene().Camera;
		var ahead = [camera.Target[0] - camera.Position[0], camera.Target[1] - camera.Position[1], camera.Target[2] - camera.Position[2]];
		var length = Math.hypot(ahead[0], ahead[1], ahead[2]);

		[2, 3].forEach(function (i) {
			var at = placed(shade.uCascades, i, ahead.map(function (value) {
				return value / length * shade.uCascadeSplits[i] * 0.98;
			}));

			expect(Math.max(Math.abs(at[0]), Math.abs(at[1]))).toBeLessThan(1);
		});
	}, 120000);

	/* The second draw of a car into the map of its shadow was as many triangles as the car (some 440 thousand). */
	it('casts the shadow of a large model that moves by a simpler shape of it', async function () {
		var scene = await mount('high');
		var models = Elemenx.Service('SceneModels');
		var meshes = Elemenx.Service('Meshes');
		var made = meshes.Sphere({Radius: 1, Segments: 128, Rings: 64});
		var ball = {Positions: new Float32Array(made.Positions), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: Array.from(made.Indices)};
		var name = unique('dense');
		var renderer = scene.Engine().Renderer;
		var mesh = renderer.Mesh;
		var draw = renderer.Draw;
		var drawn = [];
		var i;

		models.Define(name, {URL: name, Fit: false, Asset: {Nodes: [{Name: 'ball', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}], Meshes: [[{Geometry: ball, Material: 0}]], Lights: [], Materials: [{Name: 'paint', BaseColor: [0.8, 0.3, 0.1, 1], Metallic: 0, Roughness: 0.5, Emissive: [0, 0, 0], Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false}], Images: [], Skins: [], Animations: [], Scene: [0]}});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		renderer.Mesh = function (geometry) {
			var one = mesh.apply(this, arguments);

			one.Triangles = geometry && geometry.Indices ? geometry.Indices.length / 3 : 0;

			return one;
		};
		renderer.Draw = function (shape) {
			if (shape && shape.Triangles)
				drawn.push(shape.Triangles);

			return draw.apply(this, arguments);
		};

		try {
			scene.Add({ID: 'dense', Kind: 'unit', Model: name, Size: 2, X: 1, Y: 1});

			for (i = 0; i < 6; i++)
				frame(scene);
		}
		finally {
			renderer.Mesh = mesh;
			renderer.Draw = draw;

			scene.Remove('dense');
		}

		/* The whole ball in the view, a shape of under half of it in the maps of the shadows. */
		expect(drawn).toContain(ball.Indices.length / 3);
		expect(drawn.some(function (count) {
			return count > 100 && count < ball.Indices.length / 3 * 0.6;
		})).toBe(true);
	}, 120000);

	it('gives the hero a map of its own, a square of a few metres round it, over the cascades', async function () {
		var scene = await mount('ultra');
		var shade;
		var hero;
		var eye;
		var at;
		var m;
		var w;

		scene.Add({ID: 'walker', Kind: 'unit', X: 2, Y: 3});
		scene.Control('walker');

		shade = frame(scene);
		shade = frame(scene);
		hero = scene.Scene().Objects.walker.World;
		eye = scene.Scene().Eye;
		m = shade.uShadowNearMatrix;

		expect(shade.uCascadeOn).toBe(1);
		expect(shade.uShadowOn).toBe(2);

		/* The hero in the middle of it; a point 10 m away out of it. */
		at = [hero[0] - eye[0], hero[1] + 0.9 - eye[1], hero[2] - eye[2]];
		w = m[3] * at[0] + m[7] * at[1] + m[11] * at[2] + m[15];

		expect(Math.abs((m[0] * at[0] + m[4] * at[1] + m[8] * at[2] + m[12]) / w)).toBeLessThan(0.5);
		expect(Math.abs((m[1] * at[0] + m[5] * at[1] + m[9] * at[2] + m[13]) / w)).toBeLessThan(0.5);
		expect(Math.max(Math.abs(m[0] * (at[0] + 10) + m[4] * at[1] + m[8] * at[2] + m[12]), Math.abs(m[1] * (at[0] + 10) + m[5] * at[1] + m[9] * at[2] + m[13]), Math.abs(m[0] * at[0] + m[4] * at[1] + m[8] * (at[2] + 10) + m[12]), Math.abs(m[1] * at[0] + m[5] * at[1] + m[9] * (at[2] + 10) + m[13]))).toBeGreaterThan(1);

		/* Its texel: a few millimetres, a tenth of the nearest cascade's. */
		expect(shade.uShadowNearBias).toBeLessThan(shade.uCascadeBias[0] * 0.5);

		scene.Scene().Tuned = {Hero: false};

		try {
			expect(frame(scene).uShadowOn).toBe(1);
		}
		finally {
			scene.Scene().Tuned = null;
		}
	}, 120000);
});
