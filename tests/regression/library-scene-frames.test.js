import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('FramesHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="high" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
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

describe('Regression: what made the frames of a scene uneven or heavy', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* Both mirrors of a car were drawn on the same frames: every other frame was a heavy one, and the view went by in jerks. */
	it('draws the mirrors of a car each in a frame of its own', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var winding = renderer.Winding;
		var turned = [];
		var now = performance.now() + 100;
		var i;

		renderer.Winding = function (clockwise) {
			if (clockwise)
				turned[turned.length - 1]++;

			return winding.apply(this, arguments);
		};

		try {
			scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'none', Mirrors: [
				{At: [-0.5, 1.6, 0], Normal: [0, 0, -1], Width: 0.6, Height: 0.3},
				{At: [0.5, 1.6, 0], Normal: [0, 0, -1], Width: 0.6, Height: 0.3}
			]}});
			scene.Control('car');

			inner.Yaw = Math.PI;

			for (i = 0; i < 12; i++) {
				turned.push(0);

				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			/* After the first pictures, one mirror a frame. */
			expect(turned.slice(4).every(function (count) {
				return count === 1;
			})).toBe(true);
		}
		finally {
			renderer.Winding = winding;
		}
	});

	/* Regression: a frame given an earlier time than the last eased the view backwards, without end: the eye was no number, the screen grey. */
	it('takes a frame of an earlier time as no time: the view keeps where it was going', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var i;

		for (i = 0; i < 40; i++) {
			inner.Rest = 0;

			engine.Frame(200000 + i * 33);
		}

		scene.SetViewpoint({Target: [5, 1, 5], Yaw: 0.6, Pitch: 0.3, Distance: 12});
		scene.SetViewpoint({Target: [5, 1, 5], Yaw: 0.6, Pitch: 0.3, Distance: 30});

		for (i = 0; i < 40; i++) {
			inner.Rest = 0;

			engine.Frame(100000 + i * 33);
		}

		expect(inner.Eye.every(isFinite)).toBe(true);
		expect(inner.Distance).toBeGreaterThan(11);
		expect(inner.Distance).toBeLessThan(31);
	});

	it('sleeps out of sight: nothing moves, nothing is drawn, and seen again it goes on from where it was', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var drawn = 0;
		var seconds;
		var i;

		renderer.Draw = function () {
			drawn++;

			return draw.apply(this, arguments);
		};

		try {
			/* A picture first: the programs are made. */
			await waitFor(function () {
				inner.Loop.Advance(17);

				return drawn > 0;
			}, 10000);

			drawn = 0;
			inner.Paused = false;
			scene.Paused = false;
			seconds = inner.Seconds;
			inner.Seen = false;

			/* Half a second of the clock out of sight. */
			for (i = 0; i < 10; i++) {
				inner.Loop.Advance(50);

				await new Promise(function (done) {
					setTimeout(done, 50);
				});
			}

			expect(drawn).toBe(0);
			expect(inner.Seconds).toBe(seconds);

			inner.Seen = true;

			/* Seen again: drawn (a slow frame may make it wait one, by Rest), and its time did not take the half second it slept. */
			await waitFor(function () {
				inner.Rest = 0;

				inner.Loop.Advance(17);

				return drawn > 0;
			}, 10000);

			expect(inner.Seconds - seconds).toBeLessThan(0.3);
		}
		finally {
			renderer.Draw = draw;
		}
	});

	/* A car of a file of 1796 meshes, most of them bits of its wheels, was 3618 draws a frame: 11 frames a second. */
	it('draws what moves together of a model of a file as one for each material: all that stands still, each wheel, each opening', async function () {
		var models = Elemenx.Service('SceneModels');
		var shapes = Elemenx.Service('Meshes');
		var name = unique('bits');
		var box = function (x, y, z) {
			var made = shapes.Box({Width: 0.1, Height: 0.1, Depth: 0.1});

			return {Positions: new Float32Array(Array.from(made.Positions).map(function (value, index) {
				return value + [x, y, z][index % 3];
			})), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: Array.from(made.Indices)};
		};
		var material = function (word) {
			return {Name: word, BaseColor: [1, 1, 1, 1], Metallic: 0, Roughness: 0.5, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null};
		};
		var nodes = [];
		var meshes = [];
		var corners = [[0.7, 1], [-0.7, 1], [0.7, -1], [-0.7, -1]];
		var i;

		function add (title, geometry, kind, at) {
			nodes.push({Name: title, Parent: -1, Children: [], Translation: at || [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: meshes.length, Skin: -1});
			meshes.push([{Geometry: geometry, Material: kind}]);
		}

		/* Twenty bits of the body, of one paint; five bits of each wheel; a window. */
		for (i = 0; i < 20; i++)
			add('body-' + i, box(0, 0.5, 0), 0, [i % 5 * 0.1 - 0.2, 0, Math.floor(i / 5) * 0.2 - 0.3]);

		corners.forEach(function (corner, index) {
			for (i = 0; i < 5; i++)
				add('wheel-' + index + '-' + i, box(corner[0], 0.3, corner[1] + i * 0.01), 1);
		});

		add('glass', box(0.6, 0.8, 0), 2);

		models.Define(name, {URL: name, Fit: false, Asset: {Nodes: nodes, Meshes: meshes, Lights: [], Materials: [material('Paint'), material('Wheel'), material('Window')], Images: [], Skins: [], Animations: [], Scene: nodes.map(function (node, index) {
			return index;
		})}});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var made;
		var lists;
		var wheels;

		function frames (count) {
			for (var j = 0; j < count; j++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		scene.Add('unit', {ID: 'car', Name: '', Model: name, Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'wheel', Openings: [{Name: 'windows', Match: 'Window', Low: [0.3, 0.5, -1], High: [1, 1.2, 1], Way: [0, -1, 0], Reach: 0.4}]}});
		scene.Control('car');

		frames(3);

		made = models.Make(name);
		lists = Object.keys(inner.Lists).filter(function (key) {
			return key.indexOf(made.Key + '/') === 0 && inner.Lists[key].Count;
		});

		/* 41 pieces: the body, four wheels and the window. */
		expect(made.Pieces.length).toBe(41);
		expect(lists.length).toBe(6);

		/* The body is all its bits, each where it stood. */
		var body = inner.Lists[lists.filter(function (key) {
			return inner.Lists[key].Geometry.Indices.length === 20 * 36;
		})[0]].Geometry;

		expect(body.Positions.length).toBe(20 * 24 * 3);
		expect(Math.max.apply(null, Array.from(body.Positions).filter(function (value, index) {
			return index % 3 === 2;
		}))).toBeCloseTo(0.35, 5);

		/* A wheel spins as one: its bits turn together, round the middle of its own. */
		wheels = made.Joined[Object.keys(made.Joined)[0]].filter(function (piece) {
			return piece.Wheel;
		});

		expect(wheels.length).toBe(4);
		expect(wheels.map(function (piece) {
			return piece.Wheel.Corner;
		}).sort()).toEqual([0, 1, 2, 3]);

		/* A model that should keep its pieces keeps them. */
		made.Merge = false;

		frames(2);

		expect(Object.keys(inner.Lists).filter(function (key) {
			return key.indexOf(made.Key + '/') === 0 && inner.Lists[key].Count;
		}).length).toBe(41);
	});

	it('lets a list nothing is drawn of go, with its mesh, ten seconds later', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var clock = performance.now;
		var later = 0;
		var now = clock.call(performance) + 100;
		var renderer = engine.Renderer;
		var made = renderer.Mesh;
		var destroyed = 0;
		var list;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		renderer.Mesh = function () {
			var mesh = made.apply(this, arguments);
			var destroy = mesh.Destroy;

			mesh.Destroy = function () {
				destroyed++;

				return destroy.apply(this, arguments);
			};

			return mesh;
		};

		scene.Add('unit', {ID: 'block', Name: '', Size: 1, X: 0, Y: 0});

		frames(3);

		list = Object.keys(inner.Lists).filter(function (key) {
			return inner.Lists[key].Count;
		})[0];

		expect(list).toBeTruthy();

		scene.Remove('block');

		performance.now = function () {
			return clock.call(performance) + later;
		};

		try {
			frames(2);

			expect(inner.Lists[list]).toBeTruthy();

			later = 11000;

			frames(2);

			expect(inner.Lists[list]).toBeUndefined();
			expect(destroyed).toBeGreaterThan(0);
		}
		finally {
			performance.now = clock;
			renderer.Mesh = made;
		}
	});

	/* A frame bound again thousands of times what was bound already. */
	it('binds a texture, a sampler or the unit of a sampler only when it is another one, and forgets what is deleted', function () {
		var proto = WebGL2RenderingContext.prototype;
		var names = ['activeTexture', 'bindTexture', 'bindSampler'];
		var saved = {};
		var calls = {activeTexture: 0, bindTexture: 0, bindSampler: 0};
		var canvas = document.createElement('canvas');
		var renderer;
		var gl;
		var a;
		var b;

		names.forEach(function (name) {
			saved[name] = proto[name];
			proto[name] = function () {
				calls[name]++;

				return saved[name].apply(this, arguments);
			};
		});

		try {
			renderer = Elemenx.Service('Renderer').Create(canvas, {});
			gl = renderer.GL;
			a = gl.createTexture();
			b = gl.createTexture();

			gl.activeTexture(gl.TEXTURE1);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, a);
			gl.bindTexture(gl.TEXTURE_2D, a);
			gl.bindSampler(1, null);
			gl.bindSampler(1, null);

			expect(calls).toEqual({activeTexture: 1, bindTexture: 1, bindSampler: 1});
			expect(gl.getParameter(gl.TEXTURE_BINDING_2D)).toBe(a);

			gl.bindTexture(gl.TEXTURE_2D, b);

			expect(gl.getParameter(gl.TEXTURE_BINDING_2D)).toBe(b);

			/* Deleted, it is bound nowhere: the unit holds none, and another texture is bound there again. */
			gl.deleteTexture(b);

			expect(gl.getParameter(gl.TEXTURE_BINDING_2D)).toBe(null);

			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindTexture(gl.TEXTURE_2D, a);

			expect(gl.getParameter(gl.TEXTURE_BINDING_2D)).toBe(a);
			expect(calls.bindTexture).toBe(3);

			/* A renderer made again on the same canvas keeps what the context keeps. */
			expect(Elemenx.Service('Renderer').Create(canvas, {}).GL.ElemenxUnits).toBe(gl.ElemenxUnits);
		}
		finally {
			names.forEach(function (name) {
				proto[name] = saved[name];
			});
		}
	});
});
