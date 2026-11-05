import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function square (x0, z0, x1, z1) {
	return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

/* A scene of a flat ground, its frames made by hand, and what it told. */
async function mount (items) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('TriggerHost'), {
		$Template: '<div style="width: 320px; height: 200px"><Scene Quality="low" Labels="false" (ready)="Ready" (enter)="Enter" (active)="Active" (leave)="Leave" (action)="Acted"></Scene></div>',
		Ready: function (space) {
			ready = space;
		},
		Enter: function (event) {
			told.push(['enter', event.Trigger.ID, event.ID, event]);
		},
		Active: function (event) {
			told.push(['active', event.Trigger.ID, event.ID, event]);
		},
		Leave: function (event) {
			told.push(['leave', event.Trigger.ID, event.ID, event]);
		},
		Acted: function (event) {
			told.push(['action', event.Trigger.ID, event.Name, event]);
		}
	})();
	var now = performance.now() + 1000;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 0.01, Water: 0, Scale: 300, Ridges: 0, Seed: 'zones', Sketch: items ? {Layers: [{ID: 'base', Items: items}]} : null})});

	return {
		Scene: ready,
		Told: told,
		/* Frames of a tenth of a second each, the events of them only. */
		Frames: function (count) {
			var from = told.length;
			var i;

			for (i = 0; i < (count || 1); i++) {
				ready.Scene().Rest = 0;

				ready.Engine().Frame(now += 100);
			}

			return told.slice(from).map(function (one) {
				return one.slice(0, 3);
			});
		}
	};
}

describe('Contract: the triggers and zones of a Scene: enter and leave, who stays inside, actions sent to a trigger, flows of Blueprints', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Blueprints']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('tells when a walker comes into a round trigger and when it goes out or is removed, nothing while it stays, and who stays inside', async function () {
		var made = await mount();
		var scene = made.Scene;

		scene.Add('trigger', {ID: 'door', X: 10, Y: 10, Radius: 5});
		scene.Add('unit', {ID: 'hero', X: -40, Y: 0});
		scene.Add('tree', {ID: 'oak', X: 10, Y: 11});

		expect(made.Frames(3)).toEqual([]);

		scene.Change('hero', {X: 12, Y: 9});

		expect(made.Frames(1)).toEqual([['enter', 'door', 'hero']]);
		/* Regression of a decision: no event while one stays (active is gone); Inside() tells it. */
		expect(made.Frames(6)).toEqual([]);
		expect(scene.Trigger('door').Inside()).toEqual(['hero']);
		expect(made.Told[0][3].Trigger).toBe(scene.Trigger('door'));
		expect(made.Told[0][3].Object).toEqual(scene.Get('hero'));

		scene.Change('hero', {X: 16, Y: 10});

		expect(made.Frames(2)).toEqual([['leave', 'door', 'hero']]);
		expect(scene.Trigger('door').Inside()).toEqual([]);

		scene.Change('hero', {X: 10, Y: 10});

		made.Frames(1);

		scene.Remove('hero');

		expect(made.Frames(1)).toEqual([['leave', 'door', 'hero']]);
		expect(scene.Trigger('oak')).toBe(null);
	});

	it('holds what its shape and height hold, of its team and its kinds, fires once when told, and nothing while it is not enabled', async function () {
		var made = await mount();
		var scene = made.Scene;

		scene.Add('trigger', {ID: 'yard', X: 0, Y: 0, Points: square(-10, -10, 10, 10), Team: 'red'});
		scene.Add('trigger', {ID: 'road', X: 0, Y: 40, Points: [[-20, 40], [20, 40]], Width: 6, Kinds: ['house']});
		scene.Add('trigger', {ID: 'mine', X: 50, Y: 0, Radius: 4, Once: true});
		scene.Add('trigger', {ID: 'sky', X: -50, Y: 0, Radius: 4, Height: 3});
		scene.Add('unit', {ID: 'red', X: -60, Y: -60, Team: 'red'});
		scene.Add('unit', {ID: 'blue', X: -60, Y: -60, Team: 'blue'});
		scene.Add('house', {ID: 'hut', X: 2, Y: 42});
		scene.Add('house', {ID: 'shed', X: 5, Y: 44.5});

		/* The line takes its kind, a house standing within half its width (not one farther), and no walker. */
		expect(made.Frames(1)).toEqual([['enter', 'road', 'hut']]);

		/* The area takes its team only. */
		scene.Change('red', {X: 9, Y: -9});
		scene.Change('blue', {X: 1, Y: 1});

		expect(made.Frames(1)).toEqual([['enter', 'yard', 'red']]);

		scene.Change('red', {X: 11, Y: 0});
		scene.Change('blue', {X: 0, Y: 44});

		expect(made.Frames(1)).toEqual([['leave', 'yard', 'red']]);
		expect(scene.Trigger('road').Inside()).toEqual(['hut']);

		/* Once: the first that comes in, and nothing after it. */
		scene.Change('red', {X: 50, Y: 1});
		scene.Change('blue', {X: 51, Y: 0});

		expect(made.Frames(10).filter(function (one) {
			return one[1] === 'mine';
		})).toEqual([['enter', 'mine', 'red']]);

		/* Height: over the ground up to 3 metres, not a walker lifted higher. */
		scene.Change('red', {X: -50, Y: 0, Lift: 8});

		expect(made.Frames(2)).toEqual([]);

		scene.Change('red', {Lift: 0});

		expect(made.Frames(2)[0]).toEqual(['enter', 'sky', 'red']);

		/* Not enabled: it lets go of what it held without a word, and tells nothing. */
		scene.Trigger('sky').Enable(false);

		expect(made.Frames(5)).toEqual([]);
		expect(scene.Trigger('sky').Inside()).toEqual([]);

		scene.Trigger('sky').Enable(true);

		expect(made.Frames(1)).toEqual([['enter', 'sky', 'red']]);
	});

	it('takes an action through the trigger a handler is given, and runs its flow: its events, the actions of the scene', async function () {
		var made = await mount();
		var scene = made.Scene;
		var blueprints = Elemenx.Service('Blueprints');
		var graph = blueprints.Create('flow');
		var entered = blueprints.Add(graph, 'Event', {properties: {Name: 'enter'}});
		var who = blueprints.Add(graph, 'Field', {properties: {Path: 'Object'}});
		var count = blueprints.Add(graph, 'Action', {properties: {Name: 'Count'}});
		var opened = blueprints.Add(graph, 'Event', {properties: {Name: 'open'}});
		var what = blueprints.Add(graph, 'Field', {properties: {Path: 'Data'}});
		var open = blueprints.Add(graph, 'Action', {properties: {Name: 'Open'}});
		var counted = [];
		var opens = [];

		blueprints.Link(graph, [entered.id, 'Then'], [count.id, 'In']);
		blueprints.Link(graph, [entered.id, 'Payload'], [who.id, 'Object']);
		blueprints.Link(graph, [who.id, 'Value'], [count.id, 'Value']);
		blueprints.Link(graph, [opened.id, 'Then'], [open.id, 'In']);
		blueprints.Link(graph, [opened.id, 'Payload'], [what.id, 'Object']);
		blueprints.Link(graph, [what.id, 'Value'], [open.id, 'Value']);

		scene.TriggerActions({
			Count: function (value, done) {
				counted.push(value);

				done(null, counted.length);
			},
			Open: function (value, done) {
				opens.push(value);

				done(null, true);
			}
		});

		scene.Add('trigger', {ID: 'gate', X: 0, Y: 0, Radius: 6, Blueprint: blueprints.Write(graph)});
		scene.Add('unit', {ID: 'hero', X: 30, Y: 0});

		made.Frames(1);

		/* A handler of enter opens the gate it is given. */
		made.Told.length = 0;

		scene.Change('hero', {X: 1, Y: 1});

		made.Frames(1);

		expect(counted).toEqual(['hero']);

		made.Told[0][3].Trigger.Action('open', {Speed: 2});

		expect(opens).toEqual([{Speed: 2}]);
		expect(made.Told.map(function (one) {
			return one.slice(0, 3);
		})).toEqual([['enter', 'gate', 'hero'], ['action', 'gate', 'open']]);
		expect(made.Told[1][3].Data).toEqual({Speed: 2});

		/* A trigger removed takes its flow with it: a handle of it sends nothing to it. */
		scene.Remove('gate');

		made.Frames(1);
		made.Told[0][3].Trigger.Action('open', {Speed: 3});

		expect(opens).toEqual([{Speed: 2}]);
	});

	it('knows its zones at a point, and makes the triggers and zones of a sketch objects of the scene', async function () {
		var made = await mount([
			{ID: 't1', Type: 'trigger', Points: square(20, 20, 40, 40), Name: 'Camp'},
			{ID: 't2', Type: 'triggerpoint', At: [-30, 30], Radius: 5},
			{ID: 't3', Type: 'triggerline', Points: [[-40, -30], [40, -30]], Width: 4},
			{ID: 'z1', Type: 'zone', Points: square(-50, -50, 0, 0), Tags: 'safe, no-build', Name: 'Village'}
		]);
		var scene = made.Scene;

		scene.Add('zone', {ID: 'arena', X: 60, Y: 60, Radius: 10, Tags: ['pvp'], Team: 'blue'});
		scene.Add('unit', {ID: 'hero', X: 90, Y: 90});

		await waitFor(function () {
			made.Frames(1);

			return scene.Get('sketch-t1') && scene.Get('sketch-z1');
		}, 4000);

		expect(scene.ZonesAt(-10, -10)).toEqual([{ID: 'sketch-z1', Name: 'Village', Tags: ['safe', 'no-build'], Team: ''}]);
		expect(scene.ZonesAt(62, 58)).toEqual([{ID: 'arena', Name: '', Tags: ['pvp'], Team: 'blue'}]);
		expect(scene.ZonesAt(90, 90)).toEqual([]);

		/* Each trigger of the sketch by its shape: an area, a circle at its point, a line. */
		[[30, 30, 'sketch-t1'], [-31, 32, 'sketch-t2'], [10, -31, 'sketch-t3']].forEach(function (place) {
			scene.Change('hero', {X: place[0], Y: place[1]});

			expect(made.Frames(1)).toEqual([['enter', place[2], 'hero']]);

			scene.Change('hero', {X: 90, Y: 90});

			expect(made.Frames(1)).toEqual([['leave', place[2], 'hero']]);
		});

		/* A trigger changes no ground. */
		expect(Elemenx.Service('SceneTerrainGenerator').SketchChanged({Layers: [{ID: 'base', Items: []}]}, {Layers: [{ID: 'base', Items: [{ID: 't1', Type: 'trigger', Points: square(20, 20, 40, 40)}]}]})).toEqual([]);
	});
	it('unlocks an achievement of the Achievements Service as one comes in, and has the action achievement by itself', async function () {
		var made = await mount();
		var scene = made.Scene;
		var achievements = Elemenx.Service('Achievements');
		var told = null;

		achievements.Define([{ID: 'trigger-gate', Title: 'Through the gate'}, {ID: 'trigger-steps', Goal: 5}]);
		achievements.Reset();

		scene.Add('trigger', {ID: 'gate', X: 10, Y: 10, Radius: 5, Achievement: 'trigger-gate'});
		scene.Add('unit', {ID: 'hero', X: -40, Y: 0});

		made.Frames(2);

		expect(achievements.State('trigger-gate').Unlocked).toBe(false);

		scene.Change('hero', {X: 10, Y: 10});

		made.Frames(1);

		expect(achievements.State('trigger-gate').Unlocked).toBe(true);

		scene.Scene().TriggerActions.achievement({ID: 'trigger-steps', Amount: 2}, function (error, state) {
			told = [error, state.Value];
		});

		expect(told).toEqual([null, 2]);

		scene.Scene().TriggerActions.achievement('nothing', function (error) {
			told = [error.message];
		});

		expect(told).toEqual(['Elemenx Achievements: no achievement nothing']);
	});
});
