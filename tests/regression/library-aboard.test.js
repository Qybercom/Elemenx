import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A point that far over another. */
function vectors (at, up) {
	return [at[0], at[1] + up, at[2]];
}

function vectorsDot (a, b) {
	return (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / Math.max(1e-9, Math.hypot(b[0], b[1], b[2]));
}

/*
 * SceneInteriors (the inside of a ship of its class: its rooms, the consoles of its roles, a ramp) and SceneAboard (the
 * inside of a ship standing walked in: its floors and walls, its consoles as seats, the hull cut away while one is in it).
 */
describe('Contract: the inside of a ship, laid out by its class and walked in where it stands', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'GameConsole', 'GameFlight', 'GameStat', 'Meter', 'Toggle', 'Slider', 'Field', 'Button', 'service:SceneInteriors', 'service:SceneModels']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (inside) {
		var ready = null;
		var component = Elemenx.Component(unique('AboardHost'), {
			$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="400" Height="0" Water="0" Seed="flat" />' + (inside || '') + '</Scene></div>',
			Ready: function (space) {
				ready = space;
			}
		})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		return ready;
	}

	it('lays the rooms of a ship out by its class: a fighter a cockpit, a corvette a bridge to a cargo hold on a ramp, a capital ship a command post', function () {
		var interiors = Elemenx.Service('SceneInteriors');
		var fighter = interiors.Plan({Length: 15});
		var corvette = interiors.Plan({Length: 89, Reactors: 2});
		var capital = interiors.Plan({Length: 1137});
		var own = interiors.Plan({Length: 35, Interior: {Class: 'small', Rooms: [{Kind: 'cockpit', Length: 3, Width: 4, Seats: ['pilot', 'gunner', 'gunner']}, {Kind: 'cargo', Length: 6, Width: 6, Ramp: true}]}});

		expect(interiors.ClassOf(15).Name).toBe('fighter');
		expect(interiors.ClassOf(300).Name).toBe('large');
		expect(fighter.Rooms.map(function (one) {
			return one.Kind;
		})).toEqual(['cockpit']);
		expect(fighter.Entry).toBe('canopy');
		expect(fighter.Ramp).toBe(null);
		expect(corvette.Class).toBe('medium');
		expect(corvette.Rooms[0].Kind).toBe('bridge');
		expect(corvette.Rooms[0].High[2]).toBeGreaterThan(corvette.Rooms[1].High[2]);
		expect(corvette.Seats.map(function (one) {
			return one.Role;
		})).toContain('pilot');
		expect(corvette.Seats.filter(function (one) {
			return one.Controls;
		}).map(function (one) {
			return one.ID;
		})).toEqual(['pilot']);
		expect(corvette.Ramp.Bottom[1]).toBe(0);
		expect(corvette.Ramp.Top[1]).toBe(corvette.Floor);
		expect(corvette.Ramp.Hatch.High[2]).toBeLessThan(corvette.Rooms[corvette.Rooms.length - 1].High[2]);
		expect(corvette.Reactors).toBe(2);

		/* Windows across the nose of its bridge (a cockpit, a bridge; Windows of a room says otherwise), none past a door. */
		var windows = interiors.WindowsOf(corvette);

		expect(windows.length).toBe(1);
		expect(windows[0].High[2]).toBeCloseTo(corvette.Rooms[0].High[2], 0);
		expect(windows[0].Low[1]).toBeGreaterThan(corvette.Floor);
		expect(interiors.WindowsOf(interiors.Plan({Length: 35, Interior: {Class: 'small', Rooms: [{Kind: 'cockpit', Length: 3, Width: 4, Seats: ['pilot'], Windows: false}, {Kind: 'cargo', Length: 6, Width: 6}]}})).length).toBe(0);
		expect(capital.Seats.map(function (one) {
			return one.Role;
		})).toContain('commander');
		expect(own.Seats.map(function (one) {
			return one.ID;
		})).toEqual(['pilot', 'gunner', 'gunner-2']);

		var made = interiors.Define(Elemenx.Service('SceneModels'), {Length: 89});

		expect(Elemenx.Service('SceneModels').Has(made.Inside)).toBe(true);
		expect(Elemenx.Service('SceneModels').Has(made.Ramp)).toBe(true);
		expect(Elemenx.Service('SceneModels').Has(made.Ceiling)).toBe(true);
	});

	/* A hull of a box (metres: wide, tall, long), its belly at lift over the ground: as SceneInteriors.Hull takes it. */
	function boxHull (wide, tall, long, lift) {
		var geometry = Elemenx.Service('Meshes').Box({Width: wide, Height: tall, Depth: long});
		var positions = Array.prototype.slice.call(geometry.Positions);

		for (var i = 1; i < positions.length; i += 3)
			positions[i] += lift + tall / 2;

		return Elemenx.Service('SceneInteriors').Hull([{Positions: positions, Indices: geometry.Indices}]);
	}

	it('fits the rooms of a ship into its hull: none stands out of it, the kinds of Drop left out of a short one, a fighter a cockpit', function () {
		var interiors = Elemenx.Service('SceneInteriors');
		var hull = boxHull(16, 9, 89, 3.2);
		var plan = interiors.Plan({Length: 89}, hull);
		var skin = plan.Deck.Skin;
		var short = interiors.Plan({Length: 89}, boxHull(16, 9, 30, 3.2));
		var fighter = interiors.Plan({Length: 15}, boxHull(2.2, 1.8, 15, 1.2));
		var none = interiors.Plan({Length: 15}, boxHull(0.5, 0.5, 3, 0));
		var middle = plan.Rooms[2];
		var ramp = plan.Ramp;

		expect(hull.Low).toEqual([-8, 3.2, -44.5]);
		expect(hull.High[1]).toBeCloseTo(12.2, 5);
		expect(plan.Fitted).toBe(true);
		expect(plan.Gear).toBe(3.2);

		/* Every room within the hull, over its skin. */
		plan.Rooms.forEach(function (room) {
			expect(room.Low[0]).toBeGreaterThanOrEqual(-8 + skin - 0.6);
			expect(room.High[0]).toBeLessThanOrEqual(8 - skin + 0.6);
			expect(room.Low[1] - plan.Deck.Slab).toBeGreaterThanOrEqual(3.2 + skin - 1e-6);
			expect(room.High[1]).toBeLessThanOrEqual(12.2 - skin + 1e-6);
			expect(room.Low[2]).toBeGreaterThanOrEqual(-44.5 + skin - 1e-6);
			expect(room.High[2]).toBeLessThanOrEqual(44.5 - skin + 1e-6);
		});

		expect(plan.Rooms[0].Kind).toBe('bridge');
		expect(plan.Rooms.length).toBe(6);
		expect(plan.Legs.length).toBe(4);
		expect(plan.Well.length).toBeGreaterThan(2);
		expect(plan.Lamps.length).toBeGreaterThanOrEqual(plan.Rooms.length);

		/* A short hull: fewer rooms (a common room, quarters, an armory left out first), its bridge, its engine and its hold kept. */
		expect(short.Fitted).toBe(true);
		expect(short.Rooms.length).toBeLessThan(6);
		expect(short.Rooms[0].Kind).toBe('bridge');
		expect(short.Rooms.map(function (room) {
			return room.Kind;
		})).toContain('cargo');
		expect(short.Rooms[short.Rooms.length - 1].Low[2]).toBeGreaterThanOrEqual(-15 + skin - 1e-6);

		/* A fighter: its cockpit, as low as one sits, under its canopy; a hull too small for one: no inside. */
		expect(fighter.Rooms.map(function (room) {
			return room.Kind;
		})).toEqual(['cockpit']);
		expect(fighter.Rooms[0].High[1]).toBeLessThanOrEqual(3 - fighter.Skin + 1e-6);
		expect(fighter.Skin).toBeLessThan(skin);
		expect(fighter.Ramp).toBe(null);
		expect(none.Rooms).toEqual([]);

		/* What is solid: the hull and the walls, not the rooms, the doorways, the way down the ramp; nor out of the hull. */
		expect(interiors.Solid(plan, hull, [0, middle.Low[1] + 1.5, (middle.Low[2] + middle.High[2]) / 2], 0.2)).toBe(false);
		expect(interiors.Solid(plan, hull, [7.5, 8, 0], 0.2)).toBe(true);
		expect(interiors.Solid(plan, hull, [0, 12.1, 0], 0.2)).toBe(true);
		expect(interiors.Solid(plan, hull, [12, 8, 0], 0.2)).toBe(false);
		expect(interiors.Solid(plan, hull, [5, 1.5, 0], 0.2)).toBe(false);
		expect(interiors.Solid(plan, hull, [0, middle.Low[1] + 1, plan.Doors[1].At[2]], 0.2)).toBe(false);
		expect(interiors.Solid(plan, hull, [middle.High[0] - 0.3, middle.Low[1] + 1, plan.Doors[1].At[2]], 0.2)).toBe(true);
		expect(interiors.Solid(plan, hull, [0, (ramp.Low[1] + ramp.High[1]) / 2 + 1, (ramp.Low[2] + ramp.High[2]) / 2], 0.2)).toBe(false);
	});

	it('keeps the view of a walker in the rooms of a ship: never in its walls, ceilings or hull, its eyes off a wall it faces, the walker faded when it comes too close', async function () {
		var space = await mount();
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var it;
		var room;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		Elemenx.Service('SceneModels').Define('test-hull-89', {Group: 'ships', Type: 'prop', Size: 1, Build: function (tools) {
			return [tools.Piece('hull', [tools.Box(16, 9, 89, [0, 4.5, 0], [0.6, 0.62, 0.66])])];
		}});

		space.Add('unit', {ID: 'me', Size: 1.8, X: 30, Y: -60, Health: 50});
		space.Add('ship', {ID: 'docked', Model: 'test-hull-89', Size: 1, X: 0, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 89}});

		space.Control('me');

		await waitFor(function () {
			frames(1);

			return space.Interior('docked');
		}, 6000);

		it = space.Interior('docked');

		/* On its legs: its belly over the ground, its inside fitted into it. */
		expect(it.Plan.Fitted).toBe(true);
		expect(inner.Objects.docked.World[1] - it.At[1]).toBeCloseTo(3.2, 1);
		expect(engine.HoleOf(inner.Objects.docked)).toBeTruthy();

		/* In its corridor, the view sent across it (into its side wall) and far: it stays in the corridor, the walker faded. */
		room = it.Plan.Rooms[1];

		expect(room.Kind).toBe('corridor');

		inner.Objects.me.Values.X = 0;
		inner.Objects.me.Values.Y = (room.Low[2] + room.High[2]) / 2;
		inner.Overrides.me = {Values: {X: 0, Y: (room.Low[2] + room.High[2]) / 2}};
		inner.Objects.me.Air = it.At[1] + it.Plan.Floor;

		frames(6);

		inner.Yaw = Math.PI / 2;
		inner.Pitch = 0.2;
		inner.Wanted = inner.Distance = 8;

		frames(12);

		expect(engine.InteriorSolid(inner.Camera.Position, 0.05)).toBe(false);
		expect(engine.InsideOf(inner.Camera.Position)).toBe('docked');
		expect(inner.HeroFade).toBeGreaterThan(0);

		/* Looking down at it from high over it: the ceiling holds the view in. */
		inner.Yaw = 0;
		inner.Pitch = 1.2;

		frames(12);

		expect(engine.InsideOf(inner.Camera.Position)).toBe('docked');
		expect(inner.Camera.Position[1]).toBeLessThan(it.At[1] + it.Plan.Floor + it.Plan.Height);

		/* In its eyes, its face to the side wall: the eyes stay off it. */
		space.Person = 'first';
		inner.Yaw = -Math.PI / 2;
		inner.Pitch = 0;
		inner.Objects.me.Values.X = room.High[0] - it.Plan.Deck.Wall - 0.3;
		inner.Overrides.me = {Values: {X: room.High[0] - it.Plan.Deck.Wall - 0.3, Y: (room.Low[2] + room.High[2]) / 2}};

		frames(20);

		expect(engine.InteriorSolid(inner.Camera.Position, 0.05)).toBe(false);

		/* Out of it, the view behind the walker does not go into the hull either. */
		space.Person = 'third';
		inner.Objects.me.Values.X = 12;
		inner.Objects.me.Values.Y = 0;
		inner.Overrides.me = {Values: {X: 12, Y: 0}};
		inner.Objects.me.Air = it.At[1];
		inner.Yaw = -Math.PI / 2;
		inner.Pitch = 0.3;
		inner.Wanted = inner.Distance = 10;

		frames(20);

		expect(engine.InteriorSolid(inner.Camera.Position, 0.05)).toBe(false);
	});

	it('puts the inside of a ship standing where it stands: its floor walked on, its walls stopping, its consoles seats, its hull drawn round one in it (cut away only with Cutaway)', async function () {
		var space = await mount();
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var it;
		var pilot;
		var seat;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'me', Size: 1.8, X: 0, Y: -60, Health: 50});
		space.Add('ship', {ID: 'docked', Size: 89, X: 0, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 89}});

		frames(4);

		space.Control('me');

		frames(2);

		it = space.Interior('docked');

		expect(it).toBeTruthy();
		expect(it.Plan.Class).toBe('medium');
		expect(inner.Objects['docked:inside']).toBeTruthy();
		expect(inner.Objects['docked:ramp']).toBeTruthy();

		/* Its deck under a point of a room, the ground beside it. */
		var room = it.Plan.Rooms[1];
		var x = (room.Low[0] + room.High[0]) / 2;
		var z = (room.Low[2] + room.High[2]) / 2;

		expect(engine.InteriorFloor(x, z, it.Plan.Deck.Floor)).toBeCloseTo(it.Plan.Deck.Floor, 0);
		expect(engine.InteriorFloor(60, 0, 0)).toBe(-Infinity);
		expect(engine.InteriorBlocks(room.High[0], z, it.Plan.Deck.Floor + 0.5)).toBe(true);
		expect(engine.InteriorBlocks(x, z, it.Plan.Deck.Floor + 0.5)).toBe(false);

		/* By the console of its pilot inside: G sits there; G again stands up beside it, on its deck, the hull not drawn. */
		pilot = it.Plan.Seats.filter(function (one) {
			return one.Role === 'pilot';
		})[0];
		inner.Objects.me.Values.X = pilot.Exit[0];
		inner.Objects.me.Values.Y = pilot.Exit[2] - 0.5;
		inner.Overrides.me = {Values: {X: pilot.Exit[0], Y: pilot.Exit[2] - 0.5}};
		inner.Objects.me.Air = it.Plan.Deck.Floor;

		frames(4);

		seat = engine.NearestSeat('me');

		expect(seat).toEqual({Vehicle: 'docked', Seat: 'pilot'});
		expect(space.BoardKey()).toBe(true);
		expect(space.Context('me')).toMatchObject({Kind: 'seat', Vehicle: 'docked', Seat: 'pilot', Role: 'pilot', Controls: false});
		expect(inner.Hero).toBe('me');

		frames(2);

		/* Its hull stays drawn round who is in it (no Cutaway). */
		expect(inner.Objects.docked.CutAway).toBeFalsy();
		expect(inner.Objects.docked.Hidden).toBeFalsy();
		expect(space.BoardKey()).toBe(true);
		expect(space.Context('me').Kind).toBe('walk');
		expect(inner.Objects.me.Air).toBeCloseTo(it.Plan.Deck.Floor, 1);
		expect(inner.Objects.me.Values.Health).toBe(50);

		frames(4);

		expect(inner.Objects.me.World[1]).toBeGreaterThan(it.Plan.Deck.Floor - 0.2);

		/* Cut away: its hull and its ceilings are not drawn while the hero is in it. */
		space.Cutaway = true;

		frames(2);

		expect(inner.Objects.docked.CutAway).toBe(true);
		expect(inner.Objects['docked:ceiling'].Hidden).toBe(true);

		space.Cutaway = false;

		frames(2);

		expect(inner.Objects.docked.CutAway).toBe(false);
	});

	/*
	 * Contract (4.5): who walks in a ship standing goes up with it on foot (a take-off: its inside in flight), as high over its
	 * floor as it stood, and walks on its ground again when it is down (a landing). Regression: carried over by the scene the
	 * walker stood on a console, 1.25 m up, and fell; a ship lifting with one in it left the walker in the air.
	 */
	it('takes who walks in a ship standing up with it on foot, on its floor, and down again onto the ground of its inside', async function () {
		var space = await mount();
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var it;
		var room;
		var lifted;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'me', Size: 1.8, X: 0, Y: -60});
		space.Add('ship', {ID: 'docked', Size: 89, X: 0, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 89}});

		frames(4);

		space.Control('me');

		frames(2);

		it = space.Interior('docked');
		room = it.Plan.Rooms[1];
		inner.Objects.me.Values.X = (room.Low[0] + room.High[0]) / 2;
		inner.Objects.me.Values.Y = (room.Low[2] + room.High[2]) / 2;
		inner.Overrides.me = {Values: {X: inner.Objects.me.Values.X, Y: inner.Objects.me.Values.Y}};
		inner.Objects.me.Air = it.Plan.Deck.Floor;

		frames(4);

		expect(inner.InsideShip).toBe('docked');

		/* Off its legs: in flight, the walker on foot in it, on its floor. */
		inner.Objects.docked.Values.Vehicle.Parked = false;

		frames(2);

		lifted = space.Interior('docked');

		expect(lifted.Flying).toBe(true);
		expect(inner.Afoot.me).toMatchObject({Vehicle: 'docked'});
		expect(inner.Afoot.me.At[1]).toBeCloseTo(lifted.Plan.Deck.Floor, 1);

		frames(4);

		expect(inner.Afoot.me.At[1]).toBeCloseTo(lifted.Plan.Deck.Floor, 1);

		/*
		 * Down (SceneLanding sets it down: its inside in flight gives way to the one standing): the walker walks on the ground where
		 * it stood in the ship, the view as near behind it as it was (not the distance of the view round the ship).
		 */
		var world = inner.Objects.me.World.slice();

		inner.Wanted = 250;
		delete inner.Interiors.docked;
		inner.Objects.docked.Values.Vehicle.Parked = true;

		expect(engine.AfootView(0.03)).toBe(false);
		expect(inner.Afoot.me).toBeUndefined();
		expect(inner.Objects.me.Values.X).toBeCloseTo(world[0], 3);
		expect(inner.Objects.me.Values.Y).toBeCloseTo(world[2], 3);
		expect(inner.Objects.me.Air).toBeCloseTo(world[1], 3);
		expect(inner.Wanted).toBeLessThan(5);
	});

	/*
	 * Contract (4.2): at a console of a ship standing the view is of who sits there, on its screen; the screens of the consoles
	 * show the elements of the page named for them (GameConsole), and a finger on a screen presses what is under it. Regression:
	 * a finger on a screen of an element went to the gestures of the scene only; nothing on it under the pointer-events
	 * none of the slot of the screens (inherited: here on the element itself) could be pressed.
	 */
	it('sits at a console: the view on its screen, the screens of the page on the consoles, a finger on one pressing it, a drag looking round within reach', async function () {
		var space = await mount('<div slot="screens" data-screen="console" style="width: 560px; height: 306px; pointer-events: none"><GameConsole Every="0" /></div><div slot="screens" data-screen="console:engineer" style="width: 560px; height: 306px"><GameConsole Role="engineer" Every="0" /></div>');
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var canvas = space.$Element().querySelector('.elemenx-scene-canvas');
		var it;
		var pilot;
		var screen;
		var pane;
		var view;
		var hit;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		function press (type, point) {
			space['Pointer' + type]({clientX: point.X, clientY: point.Y, button: 0, buttons: type === 'Up' ? 0 : 1, pointerId: 7, pointerType: 'touch', target: canvas, preventDefault: function () {}});
		}

		space.Add('unit', {ID: 'me', Size: 1.8, X: 0, Y: -60, Health: 50});
		space.Add('ship', {ID: 'docked', Name: 'Docked', Size: 89, X: 0, Y: 0, Yaw: 30, Vehicle: {Kind: 'ship', Parked: true, Length: 89}});

		frames(4);

		space.Control('me');

		frames(2);

		it = space.Interior('docked');

		/* A screen over each console: of its role (console:engineer) or of all (console), turned to its seat. */
		expect(inner.Objects['docked:screen:pilot'].Traits.Screen.Element).toBe('console');
		expect(inner.Objects['docked:screen:engineer'].Traits.Screen.Element).toBe('console:engineer');
		expect(Object.keys(inner.Objects).filter(function (id) {
			return id.indexOf('docked:screen:') === 0;
		}).length).toBe(it.Plan.Seats.length);

		pilot = it.Plan.Seats.filter(function (one) {
			return one.Role === 'pilot';
		})[0];
		screen = inner.Objects['docked:screen:pilot'];
		pane = engine.PaneOf(screen, Object.assign({}, screen.Traits.Screen, screen.Values));

		/* Sat down: the eyes over the seat, on the screen of its console. */
		inner.Objects.me.Values.X = engine.InteriorWorld(inner.Objects.docked, pilot.Exit)[0];
		inner.Objects.me.Values.Y = engine.InteriorWorld(inner.Objects.docked, pilot.Exit)[2];
		inner.Overrides.me = {Values: {X: inner.Objects.me.Values.X, Y: inner.Objects.me.Values.Y}};
		inner.Objects.me.Air = it.Plan.Deck.Floor;

		/*
		 * Come up at once far over what the view follows, it looking down: the view stays. Regression: the way down to the eye was
		 * an arcsine of less than -1, and the view was lost (NaN) for good.
		 */
		inner.Objects.me.Air = it.Plan.Deck.Floor + 8;
		inner.Pitch = -0.3;

		frames(1);

		expect(Number.isFinite(inner.Eye[0]) && Number.isFinite(inner.Pitch)).toBe(true);

		inner.Objects.me.Air = it.Plan.Deck.Floor;

		frames(4);

		expect(space.BoardKey()).toBe(true);

		frames(20);

		view = engine.ConsoleView(inner.Objects.me);

		expect(Math.hypot(inner.Eye[0] - view.Eye[0], inner.Eye[1] - view.Eye[1], inner.Eye[2] - view.Eye[2])).toBeLessThan(0.05);
		expect(vectorsDot(pane.Normal, [view.Eye[0] - pane.Center[0], view.Eye[1] - pane.Center[1], view.Eye[2] - pane.Center[2]])).toBeGreaterThan(0.8);

		hit = engine.ScreenHit(inner.Width / 2, inner.Height / 2);

		expect(hit && hit.Object.ID).toBe('docked:screen:pilot');

		/* Its screen says where it is: the pilot of Docked, a button to stand up. */
		var shown = space.$Element().querySelector('[data-screen="console"]');
		var engineer = space.$Element().querySelector('[data-screen="console:engineer"]');
		var stand;

		await waitFor(function () {
			return /Pilot/.test(shown.textContent) && shown.querySelector('button');
		}, 2000);

		expect(shown.textContent).toContain('Docked');
		expect(engineer.querySelector('button')).toBeFalsy();
		expect(engineer.textContent).toContain('Engineer');

		/* A drag looks round, as far as a head turns. */
		inner.Yaw = inner.DeskYaw + 3;

		frames(1);

		expect(Math.abs(Math.atan2(Math.sin(inner.Yaw - inner.DeskYaw), Math.cos(inner.Yaw - inner.DeskYaw)))).toBeLessThanOrEqual(1.4001);

		inner.Yaw = inner.DeskYaw;

		frames(2);

		/* A finger on its button (where that point of the element is on the screen): up, beside the seat. */
		stand = shown.querySelector('button').getBoundingClientRect();

		var box = shown.getBoundingClientRect();
		var u = (stand.left + stand.width / 2 - box.left) / box.width;
		var v = (stand.top + stand.height / 2 - box.top) / box.height;
		var at = [pane.Center[0] + pane.Right[0] * (u - 0.5) * pane.Width + pane.Up[0] * (0.5 - v) * pane.Height, pane.Center[1] + pane.Right[1] * (u - 0.5) * pane.Width + pane.Up[1] * (0.5 - v) * pane.Height, pane.Center[2] + pane.Right[2] * (u - 0.5) * pane.Width + pane.Up[2] * (0.5 - v) * pane.Height];
		var point = space.Project(at);

		press('Down', point);
		press('Up', point);

		expect(space.Context('me').Kind).toBe('walk');

		frames(20);

		expect(inner.DeskOf).toBe('');
		expect(Math.hypot(inner.Eye[0] - view.Eye[0], inner.Eye[2] - view.Eye[2])).toBeGreaterThan(0.3);
	});
	/*
	 * Contract (4.5): the inside of a ship in flight goes with it, in its frame (a metre tiny in real sizes of space); out of
	 * the seat of its pilot (G) the hero walks in it as the ship flies on by itself, held where it stands in the ship; G by a
	 * console sits again. Regression: G in space did nothing (only on a ground), and who stood up out of a seat by a console
	 * could not step (it stood in the wall of the console).
	 */
	it('walks in a ship in flight: its inside in its frame, the ship flying on by itself, the walker held in it, back in a seat by G', async function () {
		var ready = null;
		var component = Elemenx.Component(unique('FlightHost'), {
			$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" Scale="real" (ready)="Ready"></Scene></div>',
			Ready: function (space) {
				ready = space;
			}
		})();
		var now = performance.now() + 1000;
		var space;
		var inner;
		var engine;
		var it;
		var ship;
		var me;
		var from;
		var at;
		var held;
		var pilot;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		space = ready;
		inner = space.Scene();
		engine = space.Engine();

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'me', Size: 1.8, X: 0, Y: 0, Health: 50});
		space.Add('ship', {ID: 'flyer', Size: 0.01, Vehicle: {Kind: 'ship', Length: 89, Speed: 3000}});

		frames(2);

		space.Control('me');

		expect(space.Board('me', 'flyer')).toBe(true);

		/* Flown ahead a while, then let be. */
		inner.Keys.KeyW = true;

		frames(30);

		delete inner.Keys.KeyW;

		frames(4);

		it = space.Interior('flyer');
		ship = inner.Objects.flyer;

		expect(it).toBeTruthy();
		expect(it.Flying).toBe(true);
		expect(it.Unit).toBeLessThan(1e-6);
		expect(inner.Objects['flyer:inside']).toBeTruthy();
		expect(inner.Objects['flyer:ramp']).toBeFalsy();

		/*
		 * G (the key, in space): up out of the seat of the pilot, on foot in it; who sits where is of the scene (Seated), not of
		 * the actor. Regression: over the surface of a body (no VehiclesIdle to set Aboard again) G left no seat.
		 */
		inner.Objects.me.Aboard = null;

		space.$Element().dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyG', key: 'g', bubbles: true}));

		expect(inner.Hero).toBe('me');
		expect(space.Context('me').Kind).toBe('walk');
		expect(inner.Afoot.me).toMatchObject({Vehicle: 'flyer'});

		/*
		 * Its window: glass in its inside (seen through), the hull cut away forward of it while the eye is in it, turned as the
		 * ship lies; whole from outside. Regression: the names of the planets stood on the walls of its rooms.
		 */
		frames(2);

		expect(Elemenx.Service('SceneModels').Make(it.Inside).Pieces.some(function (piece) {
			return piece.Material && piece.Material.Alpha === 'BLEND';
		})).toBe(true);
		expect(engine.InsideOf(inner.Eye)).toBe('flyer');
		expect(engine.HoleOf(ship)).toMatchObject({Turn: expect.any(Array)});

		var eye = inner.Eye;

		inner.Eye = vectors(ship.World, 500 * it.Unit);

		expect(engine.HoleOf(ship)).toBe(null);

		inner.Eye = eye;

		/* The ship flies on by itself; the walker is held where it stands in it. */
		from = ship.World.slice();
		at = inner.Afoot.me.At.slice();

		frames(10);

		me = inner.Objects.me;

		expect(Math.hypot(ship.World[0] - from[0], ship.World[1] - from[1], ship.World[2] - from[2]) / it.Unit).toBeGreaterThan(5);
		expect(Math.hypot(inner.Afoot.me.At[0] - at[0], inner.Afoot.me.At[2] - at[2])).toBeLessThan(0.05);

		held = engine.InteriorWorld(ship, inner.Afoot.me.At);

		expect(Math.hypot(me.World[0] - held[0], me.World[1] - held[1], me.World[2] - held[2]) / it.Unit).toBeLessThan(0.05);
		expect(me.Size / it.Unit).toBeCloseTo(1.8, 1);
		/* On its deck, not under it. Regression: the walker stood to the waist in the floor (the field lifted to stand on 0). */
		expect(inner.Afoot.me.At[1]).toBeCloseTo(it.Plan.Deck.Floor, 1);
		expect(me.Hidden).toBeFalsy();

		/* It walks in it: out of the wall of the console it stood in. */
		inner.Keys.KeyW = true;

		frames(20);

		delete inner.Keys.KeyW;

		expect(Math.hypot(inner.Afoot.me.At[0] - at[0], inner.Afoot.me.At[2] - at[2])).toBeGreaterThan(0.5);

		/* The view is of its frame: within a few metres of the walker. */
		expect(Math.hypot(inner.Eye[0] - me.World[0], inner.Eye[1] - me.World[1], inner.Eye[2] - me.World[2]) / it.Unit).toBeLessThan(5);

		/*
		 * What it feels (blueprints/aboard/forces): a hit on the ship throws it along the deck and shakes the view; the Forces of
		 * the ship (the parameters of the graph) set how much, none at all of 0.
		 */
		expect(Elemenx.Resources('Blueprints', 'ElemenxGraphics/aboard/forces')).toBeTruthy();

		var before = inner.Afoot.me.At.slice();

		engine.AboardHit(ship, engine.InteriorWorld(ship, [1, 0, 0]).map(function (value, index) {
			return value - ship.World[index];
		}), 30);

		frames(6);

		expect(Math.hypot(inner.Afoot.me.At[0] - before[0], inner.Afoot.me.At[2] - before[2])).toBeGreaterThan(0.2);
		expect(Math.abs(inner.Felt.ShakePitch) + Math.abs(inner.Felt.ShakeYaw)).toBeGreaterThan(0.001);

		frames(40);

		ship.Values.Vehicle.Forces = {HitPush: 0, HitShake: 0};
		before = inner.Afoot.me.At.slice();

		engine.AboardHit(ship, engine.InteriorWorld(ship, [1, 0, 0]).map(function (value, index) {
			return value - ship.World[index];
		}), 30);

		frames(6);

		expect(Math.hypot(inner.Afoot.me.At[0] - before[0], inner.Afoot.me.At[2] - before[2])).toBeLessThan(0.02);
		expect(Math.abs(inner.Felt.ShakePitch) + Math.abs(inner.Felt.ShakeYaw)).toBeLessThan(0.001);

		/*
		 * Over the surface of a body (SceneLanding: the ship drawn of a frame of kilometres): the walker in it walks on, the ship
		 * a pass of its own of a near plane of centimetres (ShipNear), the world of one of 10 m and more. Regression: of one near
		 * plane of centimetres all past 2 km lay on the far plane: no ground, no sky through the window of a ship coming down.
		 */
		var surface = {Ship: 'flyer', ShipAt: [0, 6376, 0], ShipTurn: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], Field: {Radius: 6371, Elevation: function () {
			return 0;
		}}};

		var walked;

		inner.Surface = surface;
		ship.Landing = {};

		try {
			walked = engine.AfootSurface(surface, {Pad: {X: 0, Y: 0, LookX: 0, LookY: 0, Gas: 0, Brake: 0, DX: 0, DY: 0}}, 0.03);
		}
		finally {
			inner.Surface = null;
			delete ship.Landing;
		}

		expect(walked).toBe(true);
		expect(surface.ShipNear).toBeLessThan(0.0001);
		expect(surface.Near).toBeGreaterThanOrEqual(0.01);
		/* Its eye where the walker is in the ship (tens of metres from its middle), in kilometres of the surface. */
		expect(Math.hypot(surface.Eye[0], surface.Eye[1] - 6376, surface.Eye[2])).toBeLessThan(0.1);

		frames(2);

		/*
		 * At another console in flight: its view in the frame of the ship (deskView of a ground has no frame of its own), up
		 * again beside it. Regression: sat down in flight, the view went off into space round the ship.
		 */
		var other = it.Plan.Seats.filter(function (one) {
			return !one.Controls;
		})[0];

		inner.Afoot.me.At = other.Exit.slice();

		frames(2);

		expect(space.BoardKey()).toBe(true);
		expect(space.Context('me')).toMatchObject({Kind: 'seat', Seat: other.ID});

		frames(4);

		expect(inner.DeskOf).toBe('flyer:' + other.ID);

		var desk = engine.InteriorWorld(ship, [other.Console[0], other.Console[1] + 1.2, other.Console[2] - 1.05]);

		expect(Math.hypot(inner.Eye[0] - desk[0], inner.Eye[1] - desk[1], inner.Eye[2] - desk[2]) / it.Unit).toBeLessThan(0.05);
		expect(space.BoardKey()).toBe(true);
		expect(inner.Afoot.me).toMatchObject({Vehicle: 'flyer'});

		/* By the console of the pilot: G sits there again, off its feet. */
		pilot = it.Plan.Seats.filter(function (one) {
			return one.Role === 'pilot';
		})[0];
		inner.Afoot.me.At = pilot.Exit.slice();

		frames(2);

		expect(engine.NearestSeat('me')).toEqual({Vehicle: 'flyer', Seat: 'pilot'});
		expect(space.BoardKey()).toBe(true);
		expect(inner.Afoot.me).toBeUndefined();
		expect(inner.Hero).toBe('flyer');
	});
});
