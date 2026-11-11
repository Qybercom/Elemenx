import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('ProxyHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Quality="medium" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="1536" Height="4" Water="0" Seed="proxies" />' +
		'<SceneObject ID="sun" Kind="sun" />' +
		'<SceneObject ID="woods" Kind="forest" Shapes="oak" Density="0.6" Seed="a" Cover="1" />' +
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

describe('Contract: Scatter draws far tiles of what is sown as proxies of SceneProxies', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * Seen from far, the tiles of the ground are each one shape of all their things, made in a worker: fewer copies of
	 * models drawn one by one. Proxies false: each thing by its own levels again, no tile.
	 */
	it('draws the far tiles as proxies, each one shape of their things, and none with Proxies false', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();
		var now = performance.now() + 100;

		function frame () {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}

		await waitFor(function () {
			frame();

			return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 60000);

		scene.SetViewpoint({Target: [0, 0, 0], Yaw: 0.6, Pitch: 0.45, Distance: 1500});

		await waitFor(function () {
			frame();

			return scene.Sown().Tiles > 4;
		}, 60000);

		var tiled = scene.Sown();

		expect(tiled.Proxies).toBeGreaterThanOrEqual(tiled.Tiles);

		scene.Proxies = false;

		frame();
		frame();

		var plain = scene.Sown();

		expect(plain.Tiles).toBe(0);
		expect(plain.Copies).toBeGreaterThan(tiled.Copies);
	}, 180000);

	/*
	 * The proxies made are kept in the browser (SceneCache), and the squares of the ground: the same world again (a second
	 * scene, the next visit) takes them from there, not from a worker.
	 */
	it('takes the proxies of the same world from the cache of the browser the next time', async function () {
		var cache = Elemenx.Service('SceneCache');

		await new Promise(function (done) {
			cache.Clear(null, done);
		});

		async function far () {
			var scene = await mount();
			var engine = scene.Engine();
			var inner = scene.Scene();
			var now = performance.now() + 100;

			await waitFor(function () {
				inner.Rest = 0;

				engine.Frame(now += 33);

				return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
			}, 60000);

			scene.SetViewpoint({Target: [0, 0, 0], Yaw: 0.6, Pitch: 0.45, Distance: 1500});

			await waitFor(function () {
				inner.Rest = 0;

				engine.Frame(now += 33);

				return scene.Sown().Tiles > 4;
			}, 60000);

			return Object.assign({Pieces: inner.PiecesCached || 0}, scene.Sown());
		}

		var first = await far();

		/* What the first one made is kept by now. */
		for (var tries = 0, kept = 0; tries < 300 && kept < first.Proxies; tries++) {
			kept = await new Promise(function (done) {
				cache.Usage(function (error, usage) {
					done(usage.Entries);
				});
			});

			await new Promise(function (done) {
				setTimeout(done, 100);
			});
		}

		while (owned.length) owned.pop().$Destroy();

		var second = await far();

		/* The first may take one it made itself, made again when what stands still changed; the second takes most of them. */
		expect(first.Cached).toBeLessThan(first.Proxies / 4);
		expect(second.Cached).toBeGreaterThan(first.Cached + 4);

		/* The squares of its ground too: from the cache, not from a worker. */
		expect(second.Pieces).toBeGreaterThan(first.Pieces);
	}, 240000);

	/*
	 * Regression: each square sown made all the streams again at once, in every frame of the seconds a ground is sown (a
	 * frame of 40 to 130 ms where it is 16). What is sown since is taken in at most each 400 ms.
	 */
	it('makes its streams again at most each 400 ms while a ground is sown, not in every frame', async function () {
		var renderer = null;
		var made = 0;
		var ready = null;
		var component = Elemenx.Component(unique('SowHost'), {$Template: '<div style="width: 480px; height: 320px"><Scene Quality="medium" Labels="false" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="1536" Height="4" Water="0" Seed="sowing" />' +
			'<SceneObject ID="woods" Kind="forest" Shapes="oak" Density="0.6" Seed="b" Cover="1" />' +
		'</Scene></div>', Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		ready.Scene().Loop.Stop();

		renderer = ready.Engine().Renderer;

		/* The copies given to the meshes of the streams: each time the streams are made again. */
		var mesh = renderer.Mesh;

		renderer.Mesh = function () {
			var result = mesh.apply(this, arguments);
			var instance = result.Instance;

			result.Instance = function () {
				made++;

				return instance.apply(this, arguments);
			};

			return result;
		};

		var now = performance.now() + 100;
		var sown = 0;

		await waitFor(function () {
			ready.Scene().Rest = 0;

			ready.Engine().Frame(now += 33);

			return ready.Sown().Squares > 20;
		}, 60000);

		var frames = 0;
		var gathered = 0;
		var started = performance.now();

		var squares = ready.Sown().Squares;

		/* Frames as the page gives them, the sowing coming in between (its workers answer between frames). */
		while (ready.Sown().Waiting > 0 && performance.now() - started < 1500) {
			var before = made;

			ready.Scene().Rest = 0;

			ready.Engine().Frame(now += 33);

			frames++;

			if (made > before)
				gathered++;

			await new Promise(function (done) {
				setTimeout(done, 16);
			});
		}

		sown = ready.Sown().Squares - squares;
		renderer.Mesh = mesh;

		expect(frames).toBeGreaterThan(10);
		expect(sown).toBeGreaterThan(0);
		expect(gathered).toBeLessThanOrEqual(Math.ceil((performance.now() - started) / 400) + 1);
		expect(gathered).toBeLessThan(frames / 2);
	}, 120000);

	/*
	 * Levels colors each thing by its level of detail and tells the draws and triangles of a frame in a corner, in any
	 * scene; Ctrl+Shift+L turns it on and off.
	 */
	it('shows the numbers of a frame in a corner while Levels is on, turned on and off by Ctrl+Shift+L', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();
		var element = scene.$Element();
		var now = performance.now() + 100;

		function frame () {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}

		expect(element.querySelector('.elemenx-scene-levels')).toBe(null);
		expect(engine.LevelColor('proxy', 2)[3]).toBe(0);

		element.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyL', key: 'L', ctrlKey: true, shiftKey: true, bubbles: true}));

		expect(scene.Levels).toBe(true);
		expect(engine.LevelColor('proxy', 2)[3]).toBeGreaterThan(0);
		expect(engine.LevelColor('near', 0)).not.toEqual(engine.LevelColor('near', 3));

		await waitFor(function () {
			frame();

			var corner = element.querySelector('.elemenx-scene-levels');

			return corner && /\d+ draws · \d+k triangles/.test(corner.textContent);
		}, 30000);

		element.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyL', key: 'L', ctrlKey: true, shiftKey: true, bubbles: true}));

		expect(scene.Levels).toBe(false);

		await waitFor(function () {
			return element.querySelector('.elemenx-scene-levels') === null;
		}, 5000);
	}, 120000);

	/*
	 * Regression: each slab of the voxels of the light of probes (a metre deep, 64 metres across) drew all that is sown near
	 * the eye, three million triangles a frame. It draws what is in the box of the grid of voxels now, nothing of a box where
	 * nothing is sown.
	 */
	it('draws into the voxels only what is sown in the box of their grid', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var now = performance.now() + 100;
		var matrix = [0.03, 0, 0, 0, 0, 0.06, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1];

		function copies (box) {
			var count = 0;

			inner.VoxelBox = box;

			renderer.Draw = function (mesh) {
				count += mesh.Instances || 0;

				return draw.apply(this, arguments);
			};

			engine.ScatterVoxels(matrix, scene.Shaders(Elemenx.Service('Renderer')).Voxel);

			renderer.Draw = draw;

			return count;
		}

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 60000);

		var near = copies([-32, -8, -32, 32, 24, 32]);
		var wide = copies([-300, -8, -300, 300, 24, 300]);
		var empty = copies([5000, -8, 5000, 5064, 24, 5064]);

		expect(near).toBeGreaterThan(0);
		expect(wide).toBeGreaterThan(near * 20);
		expect(empty).toBe(0);
	}, 120000);
});
