import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (combat, inside) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('CombatHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="sun" Kind="sun" Latitude="45" Time="12" />' +
		(inside || '') +
		'<GameCombat ' + (combat || '') + ' (damage)="Told(\'damage\', $event)" (death)="Told(\'death\', $event)" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Told: function (name, event) {
		told.push([name, event]);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready && ready.$Element().querySelector('.elemenx-game-combat');
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told, Combat: Elemenx.Instance(ready.$Element().querySelector('.elemenx-game-combat'))};
}

describe('Contract: GameCombat, the health of what a game of a Scene can hurt: hits of its weapons made damage, deaths, a host', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'GameCombat', 'GameStrategy', 'service:Renderer', 'service:Meshes', 'service:SceneModels']);

		Elemenx.Service('SceneModels').Define('test-box', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
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

	it('makes damage of each hit of a shot, by the material of what it hits, and removes what has no health left', async function () {
		var made = await mount('', '<SceneObject ID="gun" Kind="thing" Model="test-box" Size="0.5" X="0" Y="0" Weapon="sniper" />');
		var scene = made.Scene;
		var deaths;

		scene.Add('thing', {ID: 'crate', Model: 'test-box', Size: 2, X: 0, Y: 10, Traits: {Health: {Max: 150}}});

		frames(scene, 3);

		scene.Fire('gun', {At: [0, 1, 10], Spread: 0});

		expect(made.Combat.HealthOf('crate')).toMatchObject({Value: 60, Max: 150, Alive: true});
		expect(scene.Scene().Objects.crate.Values.Health).toBe(60);
		expect(made.Told[0]).toEqual(['damage', expect.objectContaining({ID: 'crate', Amount: 90, Source: 'gun'})]);

		frames(scene, 60);

		scene.Fire('gun', {At: [0, 1, 10], Spread: 0});

		deaths = made.Told.filter(function (one) {
			return one[0] === 'death';
		});

		expect(deaths).toEqual([['death', expect.objectContaining({ID: 'crate', By: 'gun'})]]);
		expect(scene.Get('crate')).toBeFalsy();
	}, 30000);

	it('breaks what dies with Death break: its pieces fly from where the shot hit', async function () {
		var made = await mount('', '<SceneObject ID="gun" Kind="thing" Model="test-box" Size="0.5" X="0" Y="0" Weapon="sniper" />');
		var scene = made.Scene;

		scene.Add('thing', {ID: 'barrel', Model: 'test-box', Size: 1, X: 0, Y: 10, Traits: {Health: {Max: 10, Death: 'break'}}});

		frames(scene, 3);

		scene.Fire('gun', {At: [0, 0.5, 10], Spread: 0});

		expect(scene.Get('barrel')).toBeFalsy();
		expect(scene.Debris()).toBeGreaterThan(1);
	}, 30000);

	it('sends each change out as a host, takes a request of a client by Receive, and holds a handler of the rules', async function () {
		var sent = [];
		var made = await mount('Authority="host" Bars="always"');
		var scene = made.Scene;
		var combat = made.Combat;
		var stop;

		combat.Send = function (message) {
			sent.push(message);
		};

		scene.Add('thing', {ID: 'wall', Model: 'test-box', Size: 2, X: 0, Y: 10, Team: 'red', Traits: {Health: {Max: 100, Armor: 5}}});

		frames(scene, 3);

		combat.Receive({Type: 'damage', ID: 'wall', Hit: {ID: 'c-1', Source: 'p2'}, Amount: 25});

		expect(combat.HealthOf('wall').Value).toBe(75);
		expect(sent[0]).toMatchObject({Type: 'state', ID: 'wall', Value: 75, Kind: 'damage', Source: 'p2'});

		stop = combat.Before(function (change) {
			return change.Hit.Source !== 'friend';
		});

		expect(combat.Damage('wall', {Amount: 10, Source: 'friend'})).toBe(null);
		expect(combat.Damage('wall', {Amount: 10, Source: 'foe'}).Value).toBe(70);

		stop();

		expect(combat.Damage('wall', {Amount: 10, Source: 'friend'}).Value).toBe(65);
	}, 30000);

	it('has the armed units of a strategy shoot their foe from afar until it is gone', async function () {
		var made = await mount('', '<GameStrategy Team="blue" />');
		var scene = made.Scene;

		scene.Add('unit', {ID: 'a', X: 0, Y: 0, Team: 'blue', Weapon: 'rifle', Range: 30, Sight: 40});
		scene.Add('unit', {ID: 'foe', X: 0, Y: 20, Team: 'red', Health: 60, Damage: 0, Sight: 1});

		frames(scene, 3);

		await waitFor(function () {
			frames(scene, 5);

			return !scene.Get('foe');
		}, 20000);

		expect(scene.Get('foe')).toBeFalsy();
		/* From where it stood: shot, not walked up to. */
		expect(Math.hypot(scene.Scene().Objects.a.World[0], scene.Scene().Objects.a.World[2])).toBeLessThan(2);
		expect(made.Told.some(function (one) {
			return one[0] === 'death' && one[1].ID === 'foe' && one[1].By === 'a';
		})).toBe(true);
	}, 40000);
});
