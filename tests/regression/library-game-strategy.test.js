import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* GameStrategy: a strategy game on the ground of a Scene, declared inside it. */
describe('Contract: GameStrategy, selection, orders, attacks and the fog of war on the ground of a Scene', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'GameStrategy']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (props) {
		var ready = null;
		var told = [];
		var component = Elemenx.Component(unique('StrategyHost'), {
			$Template: '<div style="width: 400px; height: 300px"><Scene Quality="low" Labels="false" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="400" Height="1" Water="0" Ridges="0" Seed="strategy" /><GameStrategy Team="blue" ' + (props || '') + ' /></Scene></div>',
			Ready: function (space) {
				ready = space;
			}
		})();
		var now = performance.now() + 1000;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 6000);

		ready.Scene().Loop.Stop();

		var game = await waitFor(function () {
			var element = ready.$Element().querySelector('.elemenx-game-strategy');

			return element && Elemenx.Instance(element);
		}, 4000);

		['select', 'order', 'death'].forEach(function (name) {
			game.$On(name, function (event) {
				told.push([name, event]);
			});
		});

		ready.SetViewpoint({Target: [0, 0, 0], Yaw: 0, Pitch: 1.1, Distance: 90});

		return {
			Scene: ready,
			Game: game,
			Told: told,
			Frames: function (count, step) {
				var i;

				for (i = 0; i < (count || 1); i++) {
					ready.Scene().Rest = 0;

					ready.Engine().Frame(now += step || 100);
				}
			}
		};
	}

	it('selects the units of its team only, by code, by Ctrl+A and by a frame drawn over them, and none by Escape', async function () {
		var made = await mount();
		var scene = made.Scene;
		var game = made.Game;

		scene.Add('unit', {ID: 'a', X: -5, Y: 0, Team: 'blue'});
		scene.Add('unit', {ID: 'b', X: 5, Y: 0, Team: 'blue'});
		scene.Add('unit', {ID: 'foe', X: 0, Y: 30, Team: 'red'});

		made.Frames(3);

		game.Select(['a', 'foe']);

		expect(game.Selection()).toEqual(['a']);
		expect(made.Told[0]).toEqual(['select', {IDs: ['a']}]);

		scene.Key({code: 'KeyA', key: 'a', ctrlKey: true, target: scene.$Element(), preventDefault: function () {}});

		expect(game.Selection().sort()).toEqual(['a', 'b']);

		scene.Key({code: 'Escape', key: 'Escape', target: scene.$Element(), preventDefault: function () {}});

		expect(game.Selection()).toEqual([]);

		/* A frame over the whole canvas takes both, not the foe. */
		var box = scene.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();

		scene.PointerDown({button: 0, clientX: box.left + 1, clientY: box.top + 1, pointerId: 1, target: scene.$Element(), preventDefault: function () {}});
		scene.PointerMove({button: 0, clientX: box.right - 1, clientY: box.bottom - 1, pointerId: 1, target: scene.$Element(), preventDefault: function () {}});
		scene.PointerUp({button: 0, clientX: box.right - 1, clientY: box.bottom - 1, pointerId: 1, target: scene.$Element(), preventDefault: function () {}});

		expect(game.Selection().sort()).toEqual(['a', 'b']);
	});

	it('sends units to a place, each to its own spot, stops them, and has them attack a foe until it is gone', async function () {
		var made = await mount();
		var scene = made.Scene;
		var game = made.Game;
		var space = scene.Scene();

		scene.Add('unit', {ID: 'a', X: -2, Y: 0, Team: 'blue', Damage: 60, Range: 3, Sight: 4});
		scene.Add('unit', {ID: 'b', X: 2, Y: 0, Team: 'blue', Damage: 60, Range: 3, Sight: 4});
		scene.Add('unit', {ID: 'foe', X: 0, Y: 40, Team: 'red', Health: 100, Sight: 4, Damage: 0});

		made.Frames(3);

		expect(game.Order(['a', 'b'], [0, -20], 'move')).toBe(true);
		expect(space.Ways.a).toBeDefined();
		expect(space.Ways.b).toBeDefined();
		/* Spread round the place: not both on one spot. */
		expect(space.Ways.a.Points[space.Ways.a.Points.length - 1].X).not.toBeCloseTo(space.Ways.b.Points[space.Ways.b.Points.length - 1].X, 1);
		expect(made.Told.filter(function (one) {
			return one[0] === 'order';
		})[0][1]).toMatchObject({Kind: 'move', IDs: ['a', 'b'], X: 0, Z: -20});

		game.Stop(['a', 'b']);

		expect(space.Ways.a).toBeUndefined();

		game.Order(['a', 'b'], 'foe', 'attack');

		await waitFor(function () {
			made.Frames(5, 100);

			return made.Told.some(function (one) {
				return one[0] === 'death';
			});
		}, 15000);

		expect(made.Told.filter(function (one) {
			return one[0] === 'death';
		})[0][1]).toMatchObject({ID: 'foe'});
		expect(scene.Get('foe')).toBeFalsy();
	});

	it('hides in its fog the units of other teams that its units do not see, and tells what was seen and explored', async function () {
		var made = await mount('Fog="true"');
		var scene = made.Scene;
		var game = made.Game;
		var space = scene.Scene();

		scene.Add('unit', {ID: 'scout', X: 0, Y: 0, Team: 'blue', Sight: 30});
		scene.Add('unit', {ID: 'near', X: 10, Y: 0, Team: 'red', Damage: 0});
		scene.Add('unit', {ID: 'far', X: 150, Y: 150, Team: 'red', Damage: 0});

		made.Frames(6, 100);

		expect(game.Seen(0, 0)).toBe(true);
		expect(game.Seen(150, 150)).toBe(false);
		expect(game.Explored(150, 150)).toBe(false);
		expect(space.Objects.near.Hidden).toBe(false);
		expect(space.Objects.far.Hidden).toBe(true);

		/* Gone on, it keeps what it explored, seen no more. */
		scene.Change('scout', {X: 100, Y: -100});

		made.Frames(6, 100);

		expect(game.Seen(0, 0)).toBe(false);
		expect(game.Explored(0, 0)).toBe(true);
	});
	/* Regression (of the map of cells, kept for the scene with its game): a timer of no function is refused by a page that forbids eval. */
	/* The weather and the dark shorten what its units see (Scene.SightOf): a fog hides a foe a clear day showed. */
	it('sees no farther than the weather and the light let it: a fog takes the range of sight of its units', async function () {
		var made = await mount();
		var scene = made.Scene;
		var game = made.Game;

		made.Frames(10);

		expect(game.Seeing(60)).toBeGreaterThan(50);

		scene.Weather = 'fog';

		await waitFor(function () {
			made.Frames(5);

			return scene.Visibility().Distance < 1500;
		}, 15000);

		expect(game.Seeing(5000)).toBeLessThan(1500);
		expect(game.Seeing(5000)).toBe(scene.SightOf(5000));
	}, 30000);

	it('sets no timer of no function while the scene and its game are made', async function () {
		var original = window.setTimeout;
		var bad = [];

		window.setTimeout = function (callback) {
			if (typeof callback !== 'function')
				bad.push(String(callback));

			return original.apply(window, arguments);
		};

		try {
			var made = await mount();

			made.Scene.Add('unit', {ID: 'scout', X: 1, Y: 1, Team: 'blue'});
			made.Frames(2);
		}
		finally {
			window.setTimeout = original;
		}

		expect(bad).toEqual([]);
	});
});
