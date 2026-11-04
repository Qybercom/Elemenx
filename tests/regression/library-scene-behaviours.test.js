import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/*
 * What a component inside a Scene adds to it (a game: GameStrategy, GameRace) is a behaviour: the scene starts it, steps
 * it every frame, lets it take a press first, and stops it, and knows nothing of what it is.
 */
describe('Contract: behaviours of a Scene, attached by a component inside it or by code', function () {
	var told;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'trait:SceneBehaviour']);

		Elemenx.Component('TestBehaviour', {
			$Template: '<span></span>',
			$Traits: ['SceneBehaviour'],
			Name: '',

			SceneStart: function (scene) {
				told.push(this.Name + ':start:' + (scene.$Element() === this.ParentScene().$Element()));
			},

			SceneStep: function (elapsed) {
				if (told.indexOf(this.Name + ':step') === -1 && elapsed >= 0)
					told.push(this.Name + ':step');
			},

			SceneKey: function (event) {
				told.push(this.Name + ':key:' + event.code);

				return event.code === 'KeyZ';
			},

			SceneStop: function () {
				told.push(this.Name + ':stop');
			}
		});
	});

	beforeEach(function () {
		resetDOM();

		told = [];
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (inner) {
		var ready = null;
		var component = Elemenx.Component(unique('BehaviourHost'), {$Template: '<div style="width: 200px; height: 120px"><Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" />' + inner + '</Scene></div>', Ready: function (space) {
			ready = space;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 6000);

		return {Host: component, Scene: ready};
	}

	it('starts the behaviour of a component inside it, steps it every frame, lets it take a key, and stops it as the scene goes', async function () {
		var mounted = await mount('<TestBehaviour Name="game" />');
		var scene = mounted.Scene;

		expect(told[0]).toBe('game:start:true');

		scene.Engine().Frame(performance.now() + 50);

		expect(told).toContain('game:step');

		/* A key it takes the scene never sees; one it lets go the scene takes as ever. */
		scene.Key(new KeyboardEvent('keydown', {code: 'KeyZ', key: 'z'}));

		expect(told).toContain('game:key:KeyZ');

		scene.Key({code: 'KeyW', key: 'w', target: scene.$Element(), preventDefault: function () {}});

		expect(told).toContain('game:key:KeyW');
		/* Over a ground the keys walk the view. */
		expect(scene.Scene().Ground.Keys.KeyW).toBe(true);
		expect(scene.Scene().Ground.Keys.KeyZ).toBeUndefined();

		owned.pop().$Destroy();

		expect(told[told.length - 1]).toBe('game:stop');
	});

	it('attaches a behaviour of code at once to a scene that runs, and detaches it, stopped', async function () {
		var mounted = await mount('');
		var scene = mounted.Scene;
		var steps = 0;
		var detach = scene.AddBehaviour({
			Start: function () {
				told.push('code:start');
			},
			Step: function () {
				steps++;
			},
			Pointer: function (kind) {
				told.push('code:' + kind);

				return true;
			},
			Stop: function () {
				told.push('code:stop');
			}
		});

		expect(told).toEqual(['code:start']);

		scene.Engine().Frame(performance.now() + 50);

		expect(steps).toBe(1);

		scene.Wheel(new WheelEvent('wheel', {deltaY: 100}));

		expect(told).toContain('code:wheel');

		detach();
		detach();

		expect(told.filter(function (one) {
			return one === 'code:stop';
		}).length).toBe(1);

		scene.Engine().Frame(performance.now() + 100);

		expect(steps).toBe(1);
	});
});
