import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('CameraHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="high" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" Elevation="50" />' +
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

describe('Contract: the cameras of a Scene, each with the lens of a real one', function () {
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

	function frame (scene, count) {
		var i;

		for (i = 0; i < (count || 1); i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	it('shows the world from the camera chosen: where it stands, where it looks, the angle of its focal length; back to the view after', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var aspect;
		var fov;

		frame(scene, 2);

		var before = inner.Camera.Fov;

		scene.Add('camera', {ID: 'cam', X: 10, Y: 0, Z: 5, Yaw: 90, Pitch: 0, Focal: 50});

		scene.Camera = 'cam';

		frame(scene, 2);

		aspect = inner.Width / inner.Height;
		fov = 2 * Math.atan(Math.tan(Math.atan(36 / 100)) / aspect) * 180 / Math.PI;

		expect(inner.Camera.Position.map(function (value) {
			return Math.round(value * 1000) / 1000;
		})).toEqual([10, 5, 0]);
		expect(inner.Camera.Target[0]).toBeGreaterThan(15);
		expect(Math.abs(inner.Camera.Target[2])).toBeLessThan(1e-6);
		expect(inner.Camera.Fov).toBeCloseTo(fov, 4);
		expect(inner.Eye).toEqual(inner.Camera.Position);
		expect(scene.Cameras()).toEqual([{ID: 'cam', Name: 'cam', Active: true}]);

		/* Turned to an object, and carried with one, At metres from it. */
		scene.Add('unit', {ID: 'walker', X: 20, Y: 20, Size: 2});
		scene.Change('cam', {Target: 'walker'});

		frame(scene, 2);

		var walker = inner.Objects.walker;
		var way = [walker.World[0] - inner.Camera.Position[0], walker.World[1] + 1.2 - inner.Camera.Position[1], walker.World[2] - inner.Camera.Position[2]];
		var look = [inner.Camera.Target[0] - inner.Camera.Position[0], inner.Camera.Target[1] - inner.Camera.Position[1], inner.Camera.Target[2] - inner.Camera.Position[2]];

		expect(look[0] / Math.hypot.apply(null, look)).toBeCloseTo(way[0] / Math.hypot.apply(null, way), 4);
		expect(look[2] / Math.hypot.apply(null, look)).toBeCloseTo(way[2] / Math.hypot.apply(null, way), 4);

		scene.Add('camera', {ID: 'dash', Follow: 'walker', At: [0, 1.5, 2]});
		scene.UseCamera('dash');

		frame(scene, 2);

		expect(inner.Camera.Position[1]).toBeCloseTo(walker.World[1] + 1.5, 4);
		expect(Math.hypot(inner.Camera.Position[0] - walker.World[0], inner.Camera.Position[2] - walker.World[2])).toBeCloseTo(2, 4);

		/* None: the view of the scene, its angle as it was. */
		scene.UseCamera('');

		frame(scene, 2);

		expect(inner.Camera.Fov).toBe(before);
		expect(scene.Cameras().every(function (one) {
			return !one.Active;
		})).toBe(true);
	});

	it('flies to a camera in Fly seconds, from where the view was', async function () {
		var scene = await mount();
		var inner = scene.Scene();

		scene.Add('camera', {ID: 'a', X: 0, Y: 0, Z: 10});
		scene.Add('camera', {ID: 'b', X: 40, Y: 0, Z: 10});
		scene.UseCamera('a');

		frame(scene, 2);

		scene.UseCamera('b', {Fly: 1});

		frame(scene, 15);

		expect(inner.Camera.Position[0]).toBeGreaterThan(5);
		expect(inner.Camera.Position[0]).toBeLessThan(35);

		frame(scene, 20);

		expect(inner.Camera.Position[0]).toBeCloseTo(40, 4);
	});

	it('gives its lens: its own exposure of f-number, ISO and shutter (ND darkens it), else the eye; the blur of a lens, its grain', async function () {
		var scene = await mount();
		var engine = scene.Engine();

		scene.Add('camera', {ID: 'cam', X: 0, Y: 0, Aperture: 16, ISO: 100, Shutter: 0.01});

		scene.Camera = 'cam';

		frame(scene, 1);

		var lens = engine.Lens();

		expect(lens.Exposure).toBeCloseTo(1, 6);
		expect(lens.Coc.Focal).toBeCloseTo(0.035, 6);
		expect(lens.Grain).toBe(0);

		scene.Change('cam', {ND: 2, ISO: 1600, Aperture: 1.4});

		lens = engine.Lens();

		expect(lens.Exposure).toBeCloseTo(0.25 * 16 * 256 / 1.96, 4);
		expect(lens.Grain).toBeCloseTo(4 / 6, 6);
		expect(lens.Coc.Scale).toBeGreaterThan(0);

		/* With no shutter given it is the eye of the scene, the compensation over it. */
		scene.Change('cam', {Shutter: '', Compensation: 1});

		lens = engine.Lens();

		expect(lens.Exposure).toBe(null);
		expect(lens.Compensation).toBe(2);

		scene.Camera = '';

		frame(scene, 1);

		expect(engine.Lens()).toBe(null);
	});

	it('draws the picture of its lens: an exposure of its own with no eye, a blur by the shutter as it moves (none over a cut), the depth of field of its lens', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var pictures = [];
		var circles = [];
		var shutters = [];

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uBalance)
				pictures.push({Exposure: uniforms.uExposure, Eye: uniforms.uEyeOn, Warp: uniforms.uWarp});

			if (uniforms && uniforms.uPolar !== undefined)
				shutters.push({Frame: pictures.length, Blur: uniforms.uBlur, Moved: Math.hypot.apply(null, uniforms.uMoved)});

			if (uniforms && uniforms.uLens)
				circles.push(uniforms.uLens);

			return draw.apply(this, arguments);
		};

		try {
			await waitFor(function () {
				frame(scene, 1);

				return pictures.length > 0;
			}, 20000);

			expect(pictures[pictures.length - 1].Warp[3]).toBe(0);

			scene.Add('camera', {ID: 'cam', X: 0, Y: 0, Z: 6, Aperture: 2, ISO: 400, Shutter: 1 / 30, Focus: 3});

			scene.Camera = 'cam';

			frame(scene, 2);

			var last = pictures[pictures.length - 1];

			expect(last.Eye).toBe(0);
			expect(last.Exposure).toBeCloseTo(25600 / 30 * 4 / 4, 3);
			expect(last.Warp[3]).toBe(1);
			expect(circles[circles.length - 1][0]).toBeGreaterThan(0);

			/* The part of the frame the shutter was open (1/30 s of a frame of 1/30 s), along how far the camera went. */
			expect(shutters[shutters.length - 1].Blur).toBeGreaterThan(0.9);
			expect(shutters[shutters.length - 1].Moved).toBe(0);

			scene.Change('cam', {X: 2});

			frame(scene, 1);

			expect(shutters[shutters.length - 1].Moved).toBeCloseTo(2, 4);

			/* A cut to another camera blurs nothing. */
			scene.Add('camera', {ID: 'other', X: 50, Y: 50, Z: 6, ISO: 400, Shutter: 1 / 30, Aperture: 2});

			scene.Camera = 'other';

			frame(scene, 1);

			/* Nothing of the shutter ran in the frame of the cut. */
			expect(shutters[shutters.length - 1].Frame).toBeLessThan(pictures.length);
		}
		finally {
			renderer.Draw = draw;
		}
	});

	it('takes the color out with Saturation 0: each pixel of the picture grey', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var data;
		var worst = 0;
		var i;

		scene.Add('camera', {ID: 'cam', X: 0, Y: 0, Z: 4, Pitch: -10, Saturation: 0});

		scene.Camera = 'cam';

		await waitFor(function () {
			frame(scene, 1);

			return renderer.Progress().Needed === 0;
		}, 30000);

		frame(scene, 3);

		data = new Uint8Array(renderer.Width * renderer.Height * 4);

		gl.readPixels(0, 0, renderer.Width, renderer.Height, gl.RGBA, gl.UNSIGNED_BYTE, data);

		for (i = 0; i < data.length; i += 4)
			worst = Math.max(worst, Math.abs(data[i] - data[i + 1]), Math.abs(data[i + 1] - data[i + 2]));

		expect(worst).toBeLessThanOrEqual(2);
	});

	/* The roll of the view from the level of the world, degrees. */
	function rollOf (camera) {
		var ahead = [camera.Target[0] - camera.Position[0], camera.Target[1] - camera.Position[1], camera.Target[2] - camera.Position[2]];
		var size = Math.hypot(ahead[0], ahead[1], ahead[2]);
		var right;
		var up;

		ahead = ahead.map(function (value) {
			return value / size;
		});
		right = [-ahead[2], 0, ahead[0]].map(function (value) {
			return value / Math.hypot(ahead[0], ahead[2]);
		});
		up = [right[1] * ahead[2] - right[2] * ahead[1], right[2] * ahead[0] - right[0] * ahead[2], right[0] * ahead[1] - right[1] * ahead[0]];

		return Math.abs(Math.atan2(camera.Up[0] * right[0] + camera.Up[1] * right[1] + camera.Up[2] * right[2], camera.Up[0] * up[0] + camera.Up[1] * up[1] + camera.Up[2] * up[2]) * 180 / Math.PI);
	}

	it('holds the horizon on a gimbal, its pitch within its stops, as a tripod does not', async function () {
		var scene = await mount();
		var inner = scene.Scene();

		scene.Add('camera', {ID: 'fixed', X: 0, Y: 0, Z: 3, Roll: 20, Pitch: 60});
		scene.Add('camera', {ID: 'level', X: 0, Y: 0, Z: 3, Roll: 20, Pitch: 60, Rig: 'gimbal', Shake: 0});

		scene.Camera = 'fixed';

		frame(scene, 30);

		expect(rollOf(inner.Camera)).toBeCloseTo(20, 1);

		scene.Camera = 'level';

		frame(scene, 60);

		var ahead = [inner.Camera.Target[0] - inner.Camera.Position[0], inner.Camera.Target[1] - inner.Camera.Position[1], inner.Camera.Target[2] - inner.Camera.Position[2]];

		expect(rollOf(inner.Camera)).toBeLessThan(0.5);
		expect(Math.asin(ahead[1] / Math.hypot(ahead[0], ahead[1], ahead[2])) * 180 / Math.PI).toBeCloseTo(30, 0);
	});

	it('floats after its place on a steadicam, and a drone leans into how it speeds up, then settles', async function () {
		var scene = await mount();
		var inner = scene.Scene();

		scene.Add('camera', {ID: 'steady', X: 0, Y: 0, Z: 3, Rig: 'steadicam', Shake: 0});

		scene.Camera = 'steady';

		frame(scene, 30);

		scene.Change('steady', {X: 5});

		frame(scene, 1);

		expect(inner.Camera.Position[0]).toBeLessThan(1);

		frame(scene, 120);

		expect(inner.Camera.Position[0]).toBeCloseTo(5, 1);

		scene.Add('camera', {ID: 'drone', X: 0, Y: 0, Z: 6, Rig: 'drone', Shake: 0, Tilt: 1});

		scene.Camera = 'drone';

		frame(scene, 60);

		var before = rollOf(inner.Camera);

		scene.Change('drone', {X: 8});

		frame(scene, 6);

		var leaning = rollOf(inner.Camera);

		frame(scene, 240);

		expect(before).toBeLessThan(0.5);
		expect(leaning).toBeGreaterThan(1);
		expect(rollOf(inner.Camera)).toBeLessThan(0.5);
		expect(inner.Camera.Position[0]).toBeCloseTo(8, 1);
	});

	it('shakes a little in the hands, more while who carries it walks, never far from where it is held', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var heights = [];
		var turns = [];
		var i;

		scene.Add('unit', {ID: 'carrier', X: 0, Y: 0, Size: 1.8});
		scene.Add('camera', {ID: 'hand', Follow: 'carrier', At: [0, 1.5, 0], Rig: 'handheld'});

		scene.Camera = 'hand';

		frame(scene, 5);

		var ground = inner.Objects.carrier.World[1];

		for (i = 0; i < 60; i++) {
			frame(scene, 1);

			heights.push(inner.Camera.Position[1] - ground - 1.5);
			turns.push(inner.Camera.Target[0] - inner.Camera.Position[0]);
		}

		var still = Math.max.apply(null, heights) - Math.min.apply(null, heights);

		expect(still).toBeGreaterThan(0.0005);
		expect(Math.max.apply(null, heights.map(Math.abs))).toBeLessThan(0.03);
		expect(Math.max.apply(null, turns) - Math.min.apply(null, turns)).toBeGreaterThan(0.001);

		heights = [];

		for (i = 0; i < 60; i++) {
			scene.Change('carrier', {X: (i + 1) * 0.05});

			frame(scene, 1);

			heights.push(inner.Camera.Position[1] - inner.Objects.carrier.World[1] - 1.5);
		}

		expect(Math.max.apply(null, heights) - Math.min.apply(null, heights)).toBeGreaterThan(still * 2);
	});
});
