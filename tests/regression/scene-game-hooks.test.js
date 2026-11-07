import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (props) {
	var ready = null;
	var component = Elemenx.Component(unique('HooksHost'), Object.assign({$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" [selectCheck]="Check" [orders]="Orders" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
		'<SceneObject ID="scout" Kind="unit" X="0" Y="0" Team="blue" />' +
		'<SceneObject ID="hut" Kind="house" X="10" Y="10" />' +
	'</Scene></div>', Check: null, Orders: false, Ready: function (space) {
		ready = space;
	}}, props || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Engine().Frame(performance.now() + 100);

	return {Host: component, Scene: ready};
}

/*
 * What a game decides, not the scene: what a press may select (SelectCheck), whether a right press sends the walker selected
 * (Orders), and what the card of an object tells besides its own numbers (the hook Card of its behaviours).
 */
describe('Contract: Scene leaves to the game what may be selected, ordered and told', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('selects by a press only what SelectCheck lets; Select from code is not asked', async function () {
		var asked = [];
		var made = await mount({Check: function (object, info) {
			asked.push([object.ID, !!info]);

			return object.ID !== 'hut';
		}});
		var scene = made.Scene;

		expect(scene.Allowed('scout')).toBe('scout');
		expect(scene.Allowed('hut')).toBe('');
		expect(asked).toEqual([['scout', true], ['hut', true]]);

		scene.Engine().Select('hut');

		expect(scene.Selected).toBe('hut');
		expect(scene.Allowed('')).toBe('');
	});

	it('sends the walker selected by a right press only with Orders', async function () {
		var made = await mount();
		var scene = made.Scene;
		var moved = [];
		var move = scene.Move;

		scene.Move = function (id, at) {
			moved.push(id);

			return move.apply(this, arguments);
		};

		scene.Engine().Select('scout');
		scene.OrderAt({X: 200, Y: 150});

		expect(moved).toEqual([]);

		scene.Orders = true;

		scene.OrderAt({X: 200, Y: 150});

		expect(moved).toEqual(['scout']);
	});

	it('lets the behaviours of the scene add rows to the card of an object, and shows no health of its own', async function () {
		var made = await mount();
		var scene = made.Scene;
		var detach = scene.AddBehaviour({Card: function (object, rows) {
			rows.push({Key: 'loot', Label: 'Loot', Value: object.ID === 'hut' ? '3 gold' : '—'});
		}});

		scene.Engine().Select('hut');

		expect(scene.Card.Rows).toContainEqual({Key: 'loot', Label: 'Loot', Value: '3 gold'});
		expect(scene.Card.Rows.some(function (row) {
			return row.Key === 'health';
		})).toBe(false);

		detach();
	});
});
