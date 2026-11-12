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

	/* Each test mounts a scene of its own: the first frame compiles all its shaders (seconds, more on a busy machine). */
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
	}, 60000);

	/*
	 * Regression: a right press that ordered left the drag of the scene it began, and every move of the mouse after it
	 * turned the view. The right button orders and never turns it; with Ctrl it turns it and never orders. Fingers select
	 * by a tap, order by a press, carry the map by one finger, draw a frame with Framing.
	 */
	it('orders by the right button and turns the view only with Ctrl; by fingers selects, orders, carries the map and frames', async function () {
		var made = await mount();
		var scene = made.Scene;
		var game = made.Game;
		var space = scene.Scene();
		var box = scene.$Element().querySelector('.elemenx-scene-canvas').getBoundingClientRect();
		var middle = {X: box.left + box.width / 2, Y: box.top + box.height / 2};
		var noop = function () {};
		var yaw;
		var target;

		function pointer (kind, x, y, button, extra) {
			scene['Pointer' + kind](Object.assign({button: button, buttons: kind === 'Up' ? 0 : 1 << (button === 2 ? 1 : 0), clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', target: scene.$Element(), preventDefault: noop}, extra || {}));
		}

		function orders () {
			return made.Told.filter(function (one) {
				return one[0] === 'order';
			}).length;
		}

		scene.Add('unit', {ID: 'a', X: -5, Y: 0, Team: 'blue'});
		scene.Add('unit', {ID: 'b', X: 5, Y: 0, Team: 'blue'});

		made.Frames(3);

		game.Select(['a']);

		yaw = space.Yaw;

		pointer('Down', middle.X, middle.Y, 2);
		pointer('Move', middle.X + 2, middle.Y + 1, 2);
		pointer('Up', middle.X + 2, middle.Y + 1, 2);

		expect(orders()).toBe(1);

		/* No button down: the mouse moves, the view stays. */
		pointer('Move', middle.X + 150, middle.Y + 60, 0, {buttons: 0});

		expect(space.Drag).toBe(null);
		expect(space.Yaw).toBe(yaw);

		/* A right drag without Ctrl: neither a turn nor an order. */
		pointer('Down', middle.X, middle.Y, 2);
		pointer('Move', middle.X + 120, middle.Y, 2);
		pointer('Up', middle.X + 120, middle.Y, 2);

		expect(space.Yaw).toBe(yaw);
		expect(orders()).toBe(1);

		/* With Ctrl: the view turns, no order. */
		pointer('Down', middle.X, middle.Y, 2, {ctrlKey: true});
		pointer('Move', middle.X + 120, middle.Y, 2, {ctrlKey: true});
		pointer('Up', middle.X + 120, middle.Y, 2, {ctrlKey: true});

		expect(space.Yaw).not.toBe(yaw);
		expect(orders()).toBe(1);
		expect(space.Drag).toBe(null);

		/* Fingers: a tap on nothing of the team selects none; a press orders the selected; one finger carries the map. */
		scene.Gesture({Type: 'tap', X: box.left + 3, Y: box.top + 3, Pointers: 1});

		expect(game.Selection()).toEqual([]);

		game.Select(['a', 'b']);

		scene.Gesture({Type: 'press', X: middle.X, Y: middle.Y, Pointers: 1});

		expect(orders()).toBe(2);

		target = space.Ground.Target.slice();

		scene.Gesture({Type: 'pan', Phase: 'start', X: middle.X + 20, Y: middle.Y, DX: 20, DY: 0, MoveX: 20, MoveY: 0, Pointers: 1});
		scene.Gesture({Type: 'pan', Phase: 'move', X: middle.X + 60, Y: middle.Y, DX: 60, DY: 0, MoveX: 40, MoveY: 0, Pointers: 1});

		expect(space.Ground.Target).not.toEqual(target);
		expect(space.Yaw).not.toBe(yaw - 1);

		/* With Framing one finger draws a frame: over the whole canvas, both. */
		game.Select([]);

		expect(game.Framing(true).Framing()).toBe(true);

		scene.Gesture({Type: 'pan', Phase: 'start', X: box.left + 12, Y: box.top + 12, DX: 11, DY: 11, MoveX: 11, MoveY: 11, Pointers: 1});
		scene.Gesture({Type: 'pan', Phase: 'move', X: box.right - 1, Y: box.bottom - 1, DX: box.width - 2, DY: box.height - 2, MoveX: 1, MoveY: 1, Pointers: 1});
		scene.Gesture({Type: 'pan', Phase: 'end', X: box.right - 1, Y: box.bottom - 1, DX: box.width - 2, DY: box.height - 2, MoveX: 0, MoveY: 0, Pointers: 1});

		expect(game.Selection().sort()).toEqual(['a', 'b']);
	}, 60000);

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

		/* Regression (load): waited for by the clock, a busy machine drew too few frames for the fight to end; now by the frames, a minute of the scene at most. */
		for (var i = 0; i < 120 && !made.Told.some(function (one) {
			return one[0] === 'death';
		}); i++) {
			made.Frames(5, 100);

			await new Promise(function (done) {
				setTimeout(done, 5);
			});
		}

		expect(made.Told.filter(function (one) {
			return one[0] === 'death';
		})[0][1]).toMatchObject({ID: 'foe'});
		expect(scene.Get('foe')).toBeFalsy();
	}, 60000);

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
	}, 60000);
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
