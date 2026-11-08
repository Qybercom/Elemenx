import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var told = {crack: [], break: []};
	var component = Elemenx.Component(unique('FractureHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready" (crack)="Cracked" (break)="Broke">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" Latitude="45" Time="12" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Cracked: function (event) {
		told.crack.push(event);
	}, Broke: function (event) {
		told.break.push(event);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told};
}

describe('Contract: SceneFracture, things that crack and break as their material does', function () {
	var now = 0;
	var shards;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels', 'service:SceneShards']);

		shards = Elemenx.Service('SceneShards');

		Elemenx.Service('SceneModels').Define('test-block', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], [0.6, 0.6, 0.6])]), tools.Piece('lid', [tools.Box(1, 0.2, 1, [0, 1.1, 0], [0.5, 0.3, 0.2])])];
		}});
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function frames (scene, count) {
		var i;

		for (i = 0; i < count; i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	function volume (triangles) {
		return triangles.reduce(function (sum, t) {
			var a = t[0];
			var b = t[1];
			var c = t[2];

			return sum + (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
		}, 0);
	}

	it('cuts a thing by Voronoi cells denser near the hit, keeps all of its faces, and closes each piece by its hull', function () {
		var square = [{Points: [[0, 0, 0], [1, 0, 0], [1, 1, 0]], Color: [1, 0, 0]}, {Points: [[0, 0, 0], [1, 1, 0], [0, 1, 0]], Color: [1, 0, 0]}];
		var seeds = shards.Seeds([0, 0, 0], [1, 1, 1], 10, [0.1, 0.1, 0.5], {Seed: 'test'});
		var pieces = shards.Pieces(square, seeds);
		var area = 0;
		var cube = [];
		var x;
		var y;
		var z;

		/* The same seed, the same points; more of them near the hit than a tenth of the box holds. */
		expect(shards.Seeds([0, 0, 0], [1, 1, 1], 10, [0.1, 0.1, 0.5], {Seed: 'test'})).toEqual(seeds);
		expect(seeds.filter(function (p) {
			return Math.hypot(p[0] - 0.1, p[1] - 0.1, p[2] - 0.5) < 0.36;
		}).length).toBeGreaterThanOrEqual(6);

		pieces.forEach(function (piece) {
			piece.Surface.forEach(function (face) {
				var u = [face.Points[1][0] - face.Points[0][0], face.Points[1][1] - face.Points[0][1]];
				var v = [face.Points[2][0] - face.Points[0][0], face.Points[2][1] - face.Points[0][1]];

				area += Math.abs(u[0] * v[1] - u[1] * v[0]) / 2;
			});
		});

		expect(pieces.length).toBeGreaterThan(2);
		expect(area).toBeCloseTo(1, 6);

		for (x = 0; x < 2; x++)
			for (y = 0; y < 2; y++)
				for (z = 0; z < 2; z++)
					cube.push([x, y, z]);

		cube.push([0.5, 0.5, 0.5]);

		expect(shards.Hull(cube).length).toBe(12);
		expect(volume(shards.Hull(cube))).toBeCloseTo(1, 6);
		expect(shards.Hull([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]])).toEqual([]);
		expect(shards.Clip([[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0]], [1, 0, 0], 1)).toEqual([[0, 0, 0], [1, 0, 0], [1, 2, 0], [0, 2, 0]]);
	});

	it('takes from what is whole of a thing as strong as its material and size, cracks it at each blow, and breaks it at nothing', async function () {
		var made = await mount();
		var scene = made.Scene;
		var left;
		var glass;

		scene.Add({ID: 'wall', Kind: 'thing', Values: {Model: 'test-block', Size: 2, X: 0, Y: 0}, Traits: {Fracture: {Material: 'stone', Pieces: 6}}});
		scene.Add({ID: 'pane', Kind: 'thing', Values: {Model: 'test-block', Size: 1, X: 6, Y: 0}, Traits: {Fracture: {Material: 'glass'}}});
		scene.Add({ID: 'post', Kind: 'thing', Values: {Model: 'test-block', Size: 1, X: -6, Y: 0}});

		frames(scene, 3);

		expect(scene.Fractures().wood).toMatchObject({Pattern: 'splinter'});
		expect(scene.Fractures({rubber: {Toughness: 5}}).rubber).toMatchObject({Toughness: 5, Pattern: 'web'});
		expect(scene.Integrity('wall')).toBe(1);
		expect(scene.Integrity('post')).toBe(null);
		expect(scene.Damage('post', 50)).toBe(null);

		/* Stone holds a few shots; each one cracks it where it hit. */
		left = scene.Damage('wall', 60, {Point: [0, 1, 1], Normal: [0, 0, 1]});

		expect(left).toBeGreaterThan(0.5);
		expect(left).toBeLessThan(1);
		expect(made.Told.crack[0]).toMatchObject({ID: 'wall', Integrity: left, Amount: 60});
		expect(scene.Scene().Fracture.Things.wall.Cracks.length).toBe(1);

		frames(scene, 2);

		expect(scene.Scene().Fracture.Mesh).toBeTruthy();

		/* Glass, of the same blow, breaks at once: into shards. */
		glass = scene.Damage('pane', 60, {Point: [6, 0.5, 0.5], Normal: [0, 0, 1]});

		expect(glass).toBe(0);
		expect(scene.Get('pane')).toBeFalsy();
		expect(made.Told.break.some(function (event) {
			return event.ID === 'pane';
		})).toBe(true);

		/* Hit again and again, the stone breaks into its Voronoi pieces. */
		while (scene.Integrity('wall') > 0)
			scene.Damage('wall', 80, {Point: [0, 1, 1], Normal: [0, 0, 1]});

		expect(scene.Get('wall')).toBeFalsy();
		expect(made.Told.break.filter(function (event) {
			return event.ID === 'wall';
		})[0].Pieces).toBeGreaterThan(2);
		expect(scene.Damage('wall', 10)).toBe(null);
	});

	/* Regression: a thing hit in the frame it was added (no place in the world yet) threw; its crack is placed when it is. */
	it('cracks a thing hit before its first frame, its crack placed with it; one added again is whole again', async function () {
		var made = await mount();
		var scene = made.Scene;

		scene.Add({ID: 'fresh', Kind: 'thing', Values: {Model: 'test-block', Size: 2, X: 3, Y: 3}, Traits: {Fracture: {Material: 'stone'}}});

		expect(scene.Damage('fresh', 50, {Point: [3, 1, 4], Normal: [0, 0, 1]})).toBeGreaterThan(0);

		frames(scene, 2);

		expect(scene.Scene().Fracture.Things.fresh.Cracks[0].Point[2]).toBeCloseTo(4, 2);
		expect(scene.Scene().Fracture.Mesh).toBeTruthy();

		/* Removed and added again under the same ID, before a frame: whole again, no crack of the old one. */
		scene.Remove('fresh');
		scene.Add({ID: 'fresh', Kind: 'thing', Values: {Model: 'test-block', Size: 2, X: 3, Y: 3}, Traits: {Fracture: {Material: 'stone'}}});

		expect(scene.Integrity('fresh')).toBe(1);

		scene.Damage('fresh', 50, {Point: [3, 1, 4], Normal: [0, 0, 1]});

		frames(scene, 2);

		expect(scene.Scene().Fracture.Things.fresh.Cracks.length).toBe(1);
		expect(scene.Scene().Fracture.Things.fresh.Cracks[0].Point).toBeTruthy();
	});

	it('breaks a thing by the pieces of its model (Pattern parts), and a shot of SceneWeapons hurts it by itself', async function () {
		var made = await mount();
		var scene = made.Scene;

		scene.Add({ID: 'box', Kind: 'thing', Values: {Model: 'test-block', Size: 1, X: 0, Y: 0}, Traits: {Fracture: {Material: 'wood', Pattern: 'parts'}}});
		scene.Add({ID: 'crate', Kind: 'thing', Values: {Model: 'test-block', Size: 1, X: 4, Y: 0}, Traits: {Fracture: {Material: 'wood'}}});

		frames(scene, 3);

		expect(scene.Break('box', {Point: [0, 0.5, 0.5], Pattern: 'parts'})).toBe(2);

		/* A hit told by the weapons is a blow to what it hit. */
		scene.$Emit('hit', {ID: 'h1', Target: 'crate', Point: [4, 0.5, 0.5], Normal: [0, 0, 1], Amount: 10, Type: 'kinetic'});

		expect(scene.Integrity('crate')).toBeLessThan(1);
		expect(made.Told.crack.some(function (event) {
			return event.ID === 'crate';
		})).toBe(true);
	});
});
