import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('CullHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Quality="high" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="1400" Height="2" Water="0" Seed="cull" />' +
		'<SceneObject ID="day" Kind="sun" Time="12" Latitude="45" />' +
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

describe('Regression: a pass of a Scene draws no list of models it does not see', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject']);
	});

	beforeEach(function () {
		resetDOM();
	});

	/*
	 * Regression: under the load of the whole suite (the scenes of other files baking their planets in the same browser)
	 * letting the scenes go waited longer than the 30 s a hook has: 90 s now.
	 */
	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	}, 90000);

	/*
	 * Each list of models (one a model and a piece of it) was drawn in every pass whether the pass saw it or not: the
	 * picture, the mirror, the normals, each slice of the shadow, the voxels. A world of some 500 models (the Showcase)
	 * drew 1700 to 4000 times a frame, and 8000 at its river. Now each list has a box round its copies, and a pass draws
	 * only what its planes see.
	 */
	it('draws the models in view in every pass, and none of those far behind the view', async function () {
		var scene = await mount();
		var renderer = scene.Engine().Renderer;
		var inner = scene.Scene();
		var now = {At: performance.now() + 100};
		var made = new Map();
		var mesh = renderer.Mesh;
		var draw = renderer.Draw;
		var names = ['house', 'bus-stop', 'kiosk', 'well', 'bench', 'streetlamp'];

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				scene.Engine().Frame(now.At += 1000 / 30);
			}
		}

		/* What the meshes of the things were drawn in one frame: how many draws of them. */
		function drawnOfThings () {
			var meshes = new Set();
			var lists = Object.assign({}, inner.Lists || {}, inner.StillLists || {});
			var count = 0;

			Object.keys(lists).forEach(function (name) {
				if (lists[name].Geometry && made.has(lists[name].Geometry) && /^(still:)?[^/]*(house|bus-stop|kiosk|well|bench|streetlamp)/.test(name))
					meshes.add(made.get(lists[name].Geometry));
			});

			renderer.Draw = function (target) {
				if (meshes.has(target))
					count++;

				return draw.apply(this, arguments);
			};

			frames(1);

			renderer.Draw = draw;

			return {Meshes: meshes.size, Draws: count};
		}

		/* The meshes made of each geometry: those of the lists of the things. */
		renderer.Mesh = function (geometry) {
			var result = mesh.apply(this, arguments);

			if (geometry && typeof geometry === 'object')
				made.set(geometry, result);

			return result;
		};

		frames(3);

		names.forEach(function (name, index) {
			scene.Add('thing', {ID: 'thing-' + index, Model: name, X: 400 + index * 6, Y: 400, Size: 3});
		});

		/* At them: each drawn. */
		scene.SetViewpoint({Target: [415, 2, 400], Yaw: 0.6, Pitch: 0.4, Distance: 40});

		await waitFor(function () {
			frames(2);

			return Object.keys(inner.Lists || {}).concat(Object.keys(inner.StillLists || {})).length > 0 && drawnOfThings().Meshes >= names.length;
		}, 60000);

		var at = drawnOfThings();

		expect(at.Meshes).toBeGreaterThanOrEqual(names.length);
		expect(at.Draws).toBeGreaterThanOrEqual(at.Meshes);

		/* Down on a point 800 metres from them: none of their meshes in any pass. */
		scene.SetViewpoint({Target: [-400, 2, -400], Yaw: 0.6, Pitch: 1.4, Distance: 20});

		frames(6);

		var away = drawnOfThings();

		renderer.Mesh = mesh;

		expect(away.Meshes).toBe(at.Meshes);
		expect(away.Draws).toBe(0);
	}, 120000);

	/*
	 * Regression: the box of a list was a ball round the origin of its shape; a shape made where it stands (a road, its
	 * points in the world) reached round the origin to its far end, a box of the whole world, never culled.
	 */
	it('culls a road made where it stands, its box that of its shape, not a ball round the origin', async function () {
		var scene = await mount();
		var renderer = scene.Engine().Renderer;
		var inner = scene.Scene();
		var now = performance.now() + 100;
		var made = new Map();
		var mesh = renderer.Mesh;
		var draw = renderer.Draw;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				scene.Engine().Frame(now += 33);
			}
		}

		/* The lists of the road and how many times their meshes were drawn in a frame. */
		function roadDraws () {
			var meshes = new Set();
			var lists = Object.assign({}, inner.Lists || {}, inner.StillLists || {});
			var count = 0;

			Object.keys(lists).forEach(function (name) {
				if (/road/.test(name) && lists[name].Geometry && made.has(lists[name].Geometry))
					meshes.add(made.get(lists[name].Geometry));
			});

			renderer.Draw = function (target) {
				if (meshes.has(target))
					count++;

				return draw.apply(this, arguments);
			};

			frames(1);

			renderer.Draw = draw;

			return {Meshes: meshes.size, Draws: count};
		}

		renderer.Mesh = function (geometry) {
			var result = mesh.apply(this, arguments);

			if (geometry && typeof geometry === 'object')
				made.set(geometry, result);

			return result;
		};

		frames(3);

		scene.Add('road', {ID: 'far-road', Type: 'street', Points: [[450, 400], [550, 400]]});
		scene.SetViewpoint({Target: [500, 2, 400], Yaw: 0.6, Pitch: 0.5, Distance: 60});

		await waitFor(function () {
			frames(2);

			return roadDraws().Draws > 0;
		}, 60000);

		scene.SetViewpoint({Target: [-450, 2, -400], Yaw: 0.6, Pitch: 1.4, Distance: 20});

		frames(6);

		var away = roadDraws();

		renderer.Mesh = mesh;

		expect(away.Meshes).toBeGreaterThan(0);
		expect(away.Draws).toBe(0);
	}, 120000);

	/*
	 * Regression: every square of the ground was drawn in the picture and in each slice of the shadow, seen or not: 500
	 * draws a frame of a world of three kilometres. Looking down at a corner, most of them are not drawn now.
	 */
	it('draws only the squares of the ground a pass sees', async function () {
		var scene = await mount();
		var renderer = scene.Engine().Renderer;
		var inner = scene.Scene();
		var now = performance.now() + 100;
		var draw = renderer.Draw;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				scene.Engine().Frame(now += 33);
			}
		}

		scene.SetViewpoint({Target: [-600, 2, -600], Yaw: 0.6, Pitch: 1.45, Distance: 30});

		await waitFor(function () {
			frames(2);

			return inner.Ground && Object.keys(inner.Ground.Nodes).length > 8 && inner.Ground.Missing === 0;
		}, 60000);

		var meshes = new Set(Object.keys(inner.Ground.Nodes).map(function (key) {
			return inner.Ground.Nodes[key].Mesh;
		}));
		var drawn = new Set();

		renderer.Draw = function (target) {
			if (meshes.has(target))
				drawn.add(target);

			return draw.apply(this, arguments);
		};

		frames(1);

		renderer.Draw = draw;

		expect(drawn.size).toBeGreaterThan(0);
		expect(drawn.size).toBeLessThan(meshes.size / 2);
	}, 120000);

	/* A thing in view but less than a pixel and a half of the picture (and of each slice of the shadow) is not drawn at all. */
	it('draws no list smaller than Tiny pixels, the same thing near it drawn', async function () {
		var scene = await mount();
		var renderer = scene.Engine().Renderer;
		var inner = scene.Scene();
		var now = performance.now() + 100;
		var made = new Map();
		var mesh = renderer.Mesh;
		var draw = renderer.Draw;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				scene.Engine().Frame(now += 33);
			}
		}

		/* The draws of the meshes of the bench in a frame. */
		function benchDraws () {
			var meshes = new Set();
			var lists = Object.assign({}, inner.Lists || {}, inner.StillLists || {});
			var count = 0;

			Object.keys(lists).forEach(function (name) {
				if (/bench/.test(name) && lists[name].Geometry && made.has(lists[name].Geometry))
					meshes.add(made.get(lists[name].Geometry));
			});

			renderer.Draw = function (target) {
				if (meshes.has(target))
					count++;

				return draw.apply(this, arguments);
			};

			frames(1);

			renderer.Draw = draw;

			return {Meshes: meshes.size, Draws: count};
		}

		renderer.Mesh = function (geometry) {
			var result = mesh.apply(this, arguments);

			if (geometry && typeof geometry === 'object')
				made.set(geometry, result);

			return result;
		};

		frames(3);

		scene.Add('thing', {ID: 'far-bench', Model: 'bench', X: 0, Y: 0, Size: 1});
		scene.SetViewpoint({Target: [0, 1, 0], Yaw: 0.6, Pitch: 0.2, Distance: 12});

		await waitFor(function () {
			frames(2);

			return benchDraws().Draws > 0;
		}, 60000);

		var near = benchDraws();

		scene.SetViewpoint({Target: [0, 1, 0], Yaw: 0.6, Pitch: 0.2, Distance: 1300});

		frames(8);

		var far = benchDraws();


		renderer.Mesh = mesh;

		expect(near.Draws).toBeGreaterThan(0);
		expect(far.Meshes).toBe(near.Meshes);
		expect(far.Draws).toBe(0);
	}, 120000);

	/*
	 * A benchmark timed the frames of the browser: a scene rests through some after a slow one, and a world that drew 8
	 * frames a second measured 100. Drawn counts the frames the scene drew, with what they cost.
	 */
	it('counts the frames it drew and what they cost, not those it rested through', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var renderer = scene.Engine().Renderer;
		var now = performance.now() + 100;
		var first = scene.Drawn();
		var counts = renderer.Counts();
		var i;

		for (i = 0; i < 5; i++) {
			inner.Rest = 0;

			scene.Engine().Frame(now += 33);
		}

		var drawn = scene.Drawn();

		expect(drawn.Frames - first.Frames).toBeGreaterThanOrEqual(5);
		expect(drawn.Draws - first.Draws).toBe(renderer.Counts().Draws - counts.Draws);
		expect(drawn.Triangles - first.Triangles).toBeGreaterThan(0);
		expect(drawn.Cpu).toBeGreaterThan(first.Cpu);
		expect(drawn.At).toBeGreaterThan(0);

		/* A quiet frame (the one the loop gives while it rests after a slow one): nothing drawn, none counted. */
		scene.Engine().Frame(now += 33, true);

		expect(scene.Drawn().Frames).toBe(drawn.Frames);
	}, 120000);
});
