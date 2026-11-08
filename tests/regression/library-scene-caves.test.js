import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];
var LAND = {Size: 400, Height: 40, Water: 0, Seed: 'hill', Scale: 90, Tunnels: [{Points: [[-60, 0, 6], [60, 0, 6]], Radius: 4, Flat: 0.5}]};

async function mount (land) {
	var ready = null;
	var component = Elemenx.Component(unique('CavesHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" [world]="World" />' +
	'</Scene></div>', World: Elemenx.Service('SceneWorld').Library(land || LAND), Ready: function (space) {
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

describe('Contract: a Scene under its ground: the floors of its tunnels and caves', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneWorld']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* The first frames compile the shaders of a scene and make its squares of rock: seconds, more on a busy machine. */
	it('stands what is set in a tunnel on its floor, and walks a hero along it under the hill, the rock its walls', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var field;
		var hero;
		var i;

		function frame () {
			now += 30;
			inner.Rest = 0;

			engine.Frame(now);
		}

		await waitFor(function () {
			frame();

			return inner.Ground;
		}, 4000);

		field = inner.Ground.Field;

		expect(field.Height(0, 0)).toBeGreaterThan(11);

		/* Set in it (Z: its height): on its floor, not on the hill over it. */
		scene.Add('thing', {ID: 'lamp', X: 10, Y: 0, Z: 4});
		scene.Add('unit', {ID: 'hero', X: -10, Y: 0, Z: 4});

		frame();

		expect(inner.Objects.lamp.World[1]).toBeCloseTo(3.2, 1);
		expect(inner.Objects.hero.World[1]).toBeLessThan(4);

		/* Along it, to +X: forward is [-sin(yaw), 0, -cos(yaw)]. */
		scene.Control('hero');

		frame();

		inner.Yaw = -Math.PI / 2;
		inner.Ground.Keys = {KeyW: true};

		for (i = 0; i < 40; i++)
			frame();

		hero = inner.Objects.hero;

		expect(Number(hero.Values.X)).toBeGreaterThan(-9);
		expect(hero.World[1]).toBeLessThan(4.5);
		expect(hero.World[1]).toBeGreaterThan(2.5);

		/* Across it, to +Z: the rock stops it at the wall. */
		inner.Yaw = Math.PI;

		for (i = 0; i < 150; i++)
			frame();

		expect(Math.abs(Number(hero.Values.Y))).toBeLessThan(4);
		expect(hero.World[1]).toBeLessThan(4.5);
	}, 60000);
	it('finds a unit a way into a tunnel from the hill outside, as the hero goes, and walks it there on the floor under the hill', async function () {
		var scene = await mount(Object.assign({}, LAND, {Tunnels: [{Points: [[-70, 0], [0, 0, 4], [70, 0]], Radius: 4, Flat: 0.5}]}));
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var arrived = null;
		var field;

		function frame () {
			now += 100;
			inner.Rest = 0;

			engine.Frame(now);
		}

		await waitFor(function () {
			frame();

			return inner.Ground;
		}, 4000);

		field = inner.Ground.Field;

		scene.Add('unit', {ID: 'miner', X: -90, Y: 0});

		frame();

		/* Its time goes: a way is walked in it. */
		scene.Paused = false;

		/* On the hill outside first. */
		expect(inner.Objects.miner.World[1]).toBeCloseTo(field.Height(-90, 0), 1);
		expect(scene.Move('miner', [0, 0, 2], function (error, made) {
			arrived = made;
		})).toBe(true);

		await waitFor(function () {
			frame();

			return arrived;
		}, 8000);

		/* There: on the floor of the tunnel, far under the top of the hill over it. */
		expect(arrived.At[0]).toBeCloseTo(0, 3);
		expect(inner.Objects.miner.World[1]).toBeLessThan(3);
		expect(field.Height(0, 0) - inner.Objects.miner.World[1]).toBeGreaterThan(8);

		/* A floor no walker comes to (in the rock under the tunnel): no way. */
		expect(scene.Move('miner', [30, 30, -10])).toBe(false);
	});
	it('digs a hole while it runs: only the squares round it made again, what stood there down in it, kept in Save', async function () {
		var scene = await mount({Size: 300, Height: 10, Water: 0, Seed: 'dig', Scale: 120});
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var dug = [];
		var top;
		var far;
		var saved;
		var other;

		function frame () {
			now += 30;
			inner.Rest = 0;

			engine.Frame(now);
		}

		await waitFor(function () {
			frame();

			return inner.Ground && Object.keys(inner.Ground.Nodes).length > 4;
		}, 6000);

		/* Its time goes: what stands is set down again in it. */
		scene.Paused = false;

		scene.Add('thing', {ID: 'stone', X: 20, Y: 20});

		frame();

		top = inner.Ground.Field.Height(20, 20);
		far = Object.keys(inner.Ground.Nodes).filter(function (key) {
			var node = inner.Ground.Nodes[key];

			return Math.abs(node.Center[0] - 20) > node.Size / 2 + 6 || Math.abs(node.Center[2] - 20) > node.Size / 2 + 6;
		}).map(function (key) {
			return inner.Ground.Nodes[key];
		});

		scene.$On('dig', function (made) {
			dug.push(made);
		});

		expect(scene.Dig([20, top, 20], 4)).toBe(true);

		/* The ground made again in a frame, what stands set down in the next. */
		frame();
		frame();

		/* A hole there, the stone in it; the squares far from it as they were. */
		expect(inner.Ground.Field.Density(20, top - 2, 20)).toBeLessThan(0);
		expect(inner.Ground.Field.Density(60, top - 2, 60)).toBeGreaterThan(-100);
		expect(inner.Objects.stone.World[1]).toBeLessThan(top - 2);
		expect(far.length).toBeGreaterThan(0);
		expect(far.every(function (node) {
			return !node.Stale;
		})).toBe(true);

		/* Kept: another scene loads it, the hole there too. */
		saved = scene.Save();

		expect(dug).toEqual([{At: [20, top, 20], Radius: 4}]);
		expect(saved.Digs).toEqual([{Type: 'sphere', At: [20, top, 20], Radius: 4}]);

		other = await mount({Size: 300, Height: 10, Water: 0, Seed: 'dig', Scale: 120});

		other.Load(saved);

		await waitFor(function () {
			other.Scene().Rest = 0;

			other.Engine().Frame(now += 30);

			return other.Scene().Ground && other.Scene().Ground.Field.Volume;
		}, 4000);

		expect(other.Scene().Ground.Field.Density(20, top - 2, 20)).toBeLessThan(0);
	});
});
