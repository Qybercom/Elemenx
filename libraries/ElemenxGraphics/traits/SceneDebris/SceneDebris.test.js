import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('DebrisHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready" (break)="Broke">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" Latitude="45" Time="12" />' +
		'<SceneObject ID="crate" Kind="thing" Model="test-chest" Size="2" X="0" Y="10" DebrisSeconds="3" />' +
		'<SceneObject ID="pane" Kind="thing" Model="test-chest" Size="1" X="5" Y="10" Material="glass" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Broke: function (event) {
		told.push(event);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told};
}

describe('Contract: what breaks in a Scene: pieces that fly from the hit, fall, rest and go; glass into shards', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels']);

		Elemenx.Service('SceneModels').Define('test-chest', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], [0.6, 0.45, 0.25])])];
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

	it('breaks a thing into pieces that fly away from the hit, come to rest on the ground and go after their seconds', async function () {
		var made = await mount();
		var scene = made.Scene;
		var pieces;
		var count;

		frames(scene, 3);

		count = scene.Break('crate', {Point: [0, 1, 9]});

		expect(count).toBeGreaterThan(3);
		expect(scene.Get('crate')).toBeFalsy();
		expect(made.Told[0]).toMatchObject({ID: 'crate', Pieces: count});
		expect(scene.Debris()).toBe(count);

		frames(scene, 2);

		/* Away from the point hit, at the near side: on the whole they go on, toward +Z. */
		pieces = scene.Scene().Debris.Pieces;

		expect(pieces.reduce(function (sum, one) {
			return sum + one.Velocity[2];
		}, 0)).toBeGreaterThan(0);

		frames(scene, 70);

		expect(scene.Scene().Debris.Pieces.every(function (one) {
			return one.At[1] < 1.5 && one.At[1] > -0.5;
		})).toBe(true);

		frames(scene, 90);

		expect(scene.Debris()).toBe(0);
		expect(scene.Break('nothing')).toBe(false);
	}, 30000);

	it('breaks glass into many small shards', async function () {
		var made = await mount();
		var scene = made.Scene;

		frames(scene, 3);

		expect(scene.Break('pane')).toBeGreaterThan(40);
		expect(scene.Scene().Debris.Pieces.every(function (one) {
			return one.Glass && one.Reach < 0.3;
		})).toBe(true);

		frames(scene, 3);
	}, 30000);

	it('beams a thing away, dissolving, and gathers it again at the place; then calls back', async function () {
		var made = await mount();
		var scene = made.Scene;
		var done = null;
		var crate;

		frames(scene, 3);

		expect(scene.Teleport('crate', [20, null, 30], {Seconds: 0.5}, function (error, result) {
			done = result;
		})).toBe(true);

		frames(scene, 8);

		crate = scene.Scene().Objects.crate;

		expect(crate.Dissolve.Amount).toBeGreaterThan(0.3);
		expect(crate.World[0]).toBeCloseTo(0, 3);

		frames(scene, 10);

		expect(crate.World[0]).toBe(20);
		expect(crate.World[2]).toBe(30);
		expect(crate.Dissolve.Amount).toBeLessThan(1);

		frames(scene, 20);

		expect(crate.Dissolve).toBeUndefined();
		expect(done).toMatchObject({ID: 'crate'});
		expect(scene.Teleport('nothing', [0, 0, 0])).toBe(false);
	}, 30000);

	it('lays a circle on what a ray meets, across it (a wall), writes it ring by ring, and unwrites it as it goes', async function () {
		var made = await mount();
		var scene = made.Scene;
		var id;
		var circle;

		frames(scene, 3);

		/* Toward the side of the crate: a circle on its wall, facing back. */
		id = scene.CastOn('circle', {From: [0, 1, 0], Way: [0, 0, 1]}, {Size: 0.8, Draw: 2});

		expect(id).toBeTruthy();

		circle = scene.Scene().Objects[id];

		expect(circle.Values.At[2]).toBeCloseTo(9 - 0.015, 2);
		expect(circle.Traits.Effect.Aim[2]).toBeLessThan(-0.9);
		expect(circle.Traits.Effect.Draw).toBe(2);

		expect(scene.CastOn('circle', {From: [0, 50, 0], Way: [0, 1, 0]})).toBe('');

		expect(scene.Dispel(id, 0.2)).toBe(true);
		expect(scene.Dispel('nothing')).toBe(false);
	}, 30000);
});
