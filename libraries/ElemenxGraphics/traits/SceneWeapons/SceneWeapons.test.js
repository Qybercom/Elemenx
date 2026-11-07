import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (inside) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('WeaponsHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready" (hit)="Hit" (lock)="Lock">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" Latitude="45" Time="12" />' +
		(inside || '') +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Hit: function (event) {
		told.push(['hit', event]);
	}, Lock: function (event) {
		told.push(['lock', event]);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told};
}

describe('Contract: the weapons of a Scene: shots, what they hit, of what material, the marks they leave, the locks', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels']);

		Elemenx.Service('SceneModels').Define('test-crate', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
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

	it('hits what a ray meets first: a thing (its triangles, the side facing the shot), its material, a mark that stays; the rate holds the next', async function () {
		var made = await mount('<SceneObject ID="gun" Kind="thing" Model="test-crate" Size="0.5" X="0" Y="0" Weapon="rifle" />' +
			'<SceneObject ID="crate" Kind="thing" Model="test-crate" Size="2" X="0" Y="10" />');
		var scene = made.Scene;
		var hits;

		frames(scene, 3);

		expect(scene.Fire('gun', {At: [0, 1, 10], Spread: 0})).toBe(true);
		expect(scene.Fire('gun', {At: [0, 1, 10], Spread: 0})).toBe(false);

		hits = made.Told.filter(function (one) {
			return one[0] === 'hit';
		}).map(function (one) {
			return one[1];
		});

		expect(hits.length).toBe(1);
		expect(hits[0]).toMatchObject({Weapon: 'rifle', Type: 'kinetic', Source: 'gun', Target: 'crate', Material: 'wood', Amount: 12});
		/* The near side of the crate (2 m wide round Z 10), facing back toward the gun. */
		expect(hits[0].Point[2]).toBeCloseTo(9, 1);
		expect(hits[0].Normal[2]).toBeLessThan(-0.9);

		expect(scene.Marks()).toHaveLength(1);
		expect(scene.Marks()[0]).toMatchObject({Kind: 'chip', Object: 'crate'});

		/* The ground, past the rate: soil, a pit. */
		frames(scene, 4);

		expect(scene.Fire('gun', {Way: [0, -1, 1], Spread: 0})).toBe(true);

		expect(made.Told[made.Told.length - 1][1]).toMatchObject({Target: null, Material: 'soil'});
		expect(scene.Marks()[1].Kind).toBe('pit');
	}, 30000);

	it('takes the rule of the material and the type: metal sparks and halves; rules of its own; an energy weapon scorches', async function () {
		var made = await mount('<SceneObject ID="gun" Kind="thing" Model="test-crate" Size="0.5" X="0" Y="0" />' +
			'<SceneObject ID="plate" Kind="thing" Model="test-crate" Size="2" X="0" Y="10" Material="metal" />');
		var scene = made.Scene;

		frames(scene, 3);

		scene.Fire('gun', {Weapon: 'sniper', At: [0, 1, 10], Spread: 0});

		expect(made.Told[0][1]).toMatchObject({Material: 'metal', Amount: 54});
		expect(scene.Marks()[0].Kind).toBe('dent');

		scene.HitRules({'kinetic/metal': {Factor: 0.1, Decal: 'hole'}});

		frames(scene, 60);

		scene.Fire('gun', {Weapon: 'sniper', At: [0, 1, 10], Spread: 0});

		expect(made.Told[1][1].Amount).toBeCloseTo(9, 5);
		expect(scene.Marks()[1].Kind).toBe('hole');

		scene.Weapons({zapper: {Kind: 'bullet', Damage: 5, Type: 'energy', Rate: 100}});
		scene.Fire('gun', {Weapon: 'zapper', At: [0, 1, 10], Spread: 0});

		expect(scene.Marks()[2].Kind).toBe('scorch');
	}, 30000);

	/*
	 * The scene knows no health: with no game that says what may be hurt (SceneTarget), its blast hits all that stands near it,
	 * a crate with no health too; a game that says no keeps the blast off it.
	 */
	it('flies a body that falls and blasts where it lands: each thing near it takes less the farther it is, as far as the game lets', async function () {
		var made = await mount('<SceneObject ID="gun" Kind="thing" Model="test-crate" Size="0.5" X="0" Y="0" />');
		var scene = made.Scene;
		var hits;

		scene.Add('thing', {ID: 'near', Model: 'test-crate', Size: 1, X: 40, Y: 1});
		scene.Add('thing', {ID: 'far', Model: 'test-crate', Size: 1, X: 40, Y: 4.5});
		scene.Add('thing', {ID: 'kept', Model: 'test-crate', Size: 1, X: 41, Y: 0});

		var detach = scene.AddBehaviour({Target: function (object) {
			return object.ID === 'kept' ? false : undefined;
		}});

		frames(scene, 3);

		/* A shell of a mortar, high in its arc to the point between them. */
		expect(scene.Fire('gun', {Weapon: 'mortar', At: [40, 0, 0]})).toBe(true);

		await waitFor(function () {
			frames(scene, 5);

			return made.Told.some(function (one) {
				return one[1].Target === 'near';
			});
		}, 15000);

		hits = {};

		made.Told.forEach(function (one) {
			if (one[1].Target)
				hits[one[1].Target] = one[1];
		});

		expect(hits.near.Type).toBe('explosive');
		expect(hits.far.Amount).toBeLessThan(hits.near.Amount);
		expect(hits.kept).toBe(undefined);

		detach();

		expect(scene.Marks().some(function (one) {
			return one.Kind === 'scorch';
		})).toBe(true);
	}, 40000);

	it('locks what stays under the aim of the hero, tells lock, and sends a homing shot to it', async function () {
		var made = await mount('<SceneObject ID="hero" Kind="unit" X="0" Y="0" Weapon="rocket" Team="blue" />');
		var scene = made.Scene;
		var engine = scene.Engine();
		var ray;
		var spot;

		scene.Control('hero');

		frames(scene, 10);

		ray = engine.Ray(scene.Scene().Width / 2, scene.Scene().Height / 2);
		/* Where the middle of the view looks, a little way off: the crate stands in its cone. */
		spot = [ray.Origin[0] + ray.Direction[0] * 12, 0, ray.Origin[2] + ray.Direction[2] * 12];

		scene.Add('thing', {ID: 'tank', Model: 'test-crate', Size: 2, X: spot[0], Y: spot[2], Team: 'red', Traits: {Health: {Max: 100}}});

		await waitFor(function () {
			frames(scene, 3);

			return scene.Locked().length > 0;
		}, 8000);

		expect(scene.Locked()).toEqual(['tank']);
		expect(made.Told.some(function (one) {
			return one[0] === 'lock' && one[1].ID === 'tank';
		})).toBe(true);
		expect(scene.$Element().querySelector('.elemenx-scene-lock.locked')).toBeTruthy();
		expect(scene.$Element().querySelector('.elemenx-scene-crosshair.is-chevron')).toBeTruthy();

		expect(scene.Fire('hero')).toBe(true);
		expect(scene.Scene().Weapons.Shots[0].Target).toBe('tank');
	}, 30000);
});
