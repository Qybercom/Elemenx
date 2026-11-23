import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/*
 * SceneTactics: the modes of a seat by its role (its seat, helm, turret, radar, schematic), the roles no seat has falling to
 * the seat of command, the turrets of a vehicle, what it knows round it and its target, one for all its seats; GameTactics,
 * GameRadar and GameTargets of ElemenxGaming showing them.
 */
describe('Contract: the modes of a seat by its role, the turrets, contacts and target of a vehicle', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['GameTargets', 'GameTactics', 'GameRadar', 'GameMinimap', 'GameStrategy', 'Button', 'Scene', 'SceneObject', 'service:SceneInteriors', 'service:Vitals']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (inside, labels) {
		var ready = null;
		var component = Elemenx.Component(unique('TacticsHost'), {
			$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="' + (labels ? 'true' : 'false') + '" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="400" Height="0" Water="0" Seed="flat" />' + (inside || '') + '</Scene></div>',
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

	it('gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target', async function () {
		var space = await mount('<GameTargets slot="hud" /><div slot="hud"><GameTactics Every="0" /><GameRadar Every="0" Range="200" /></div>');
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var told = [];
		var fired = [];
		var turrets;
		var turret;
		var contacts;
		var foe;
		var nose;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		space.$On('tactic', function (event) {
			told.push(event.Kind);
		});
		space.$On('fire', function (event) {
			fired.push(event);
		});

		space.Add('unit', {ID: 'me', Size: 1.8, X: 0, Y: -60, Health: 50, Team: 'blue'});
		space.Add('unit', {ID: 'foe', Name: 'Raider', Size: 1.8, X: 15, Y: 0, Team: 'red'});
		space.Add('unit', {ID: 'friend', Size: 1.8, X: -30, Y: -50, Team: 'blue'});
		space.Add('ship', {ID: 'docked', Name: 'Docked', Size: 89, X: 0, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 89}});

		frames(4);

		space.Control('me');

		frames(2);

		/* On foot it has no modes; a medium ship has the turrets of its class, over and under its hull. */
		expect(space.Tactics('me')).toEqual([]);

		turrets = space.Turrets('docked');

		expect(turrets.length).toBe(2);
		expect(turrets[0].From).toBe('class');
		expect(turrets[0].Up[1]).toBeGreaterThan(0.9);
		expect(turrets[1].Up[1]).toBeLessThan(-0.9);
		expect(turrets[0].At[1]).toBeGreaterThan(turrets[1].At[1] + 2);

		/* The gunner has its turret; the pilot (the seat of command: no captain) the helm, the turret, radar and command no seat has. */
		expect(space.Board('me', 'docked', 'gunner')).toBe(true);
		expect(space.Tactics('me')).toEqual(['', 'turret']);
		expect(space.Tactic('radar')).toBe('');

		space.Leave('me');

		expect(space.Board('me', 'docked', 'pilot')).toBe(true);
		expect(space.Tactics('me')).toEqual(['', 'helm', 'turret', 'radar', 'strategic']);

		space.Leave('me');

		expect(space.Board('me', 'docked', 'engineer')).toBe(true);
		expect(space.Tactics('me')).toEqual(['', 'schematic']);

		/* The schematic: the hull cut away round its rooms while the hero looks at it, back as it leaves the mode. */
		expect(space.Tactic('schematic')).toBe('schematic');

		frames(3);

		expect(inner.Objects.docked.CutAway).toBe(true);
		expect(inner.DeskOf).toBe('');

		space.Tactic('');

		frames(3);

		expect(inner.Objects.docked.CutAway).toBe(false);

		space.Leave('me');

		/* At the turret: its view over the hull, turned within its arc, the ship's own parts aimed so, its weapon fired from it. */
		space.Board('me', 'docked', 'gunner');

		frames(2);

		expect(space.Tactic('turret')).toBe('turret');

		frames(2);

		turret = space.Turrets('docked')[0];

		expect(Math.hypot(inner.Eye[0] - turret.At[0], inner.Eye[1] - turret.At[1] - 0.9, inner.Eye[2] - turret.At[2])).toBeLessThan(0.05);

		nose = inner.Yaw;
		inner.Yaw = nose + 0.5;
		inner.Pitch = -0.3;

		frames(1);

		expect(inner.Objects.docked.Values.Aim.Pitch).toBeCloseTo(0.3 * 180 / Math.PI, 3);
		expect(Math.abs(inner.Objects.docked.Values.Aim.Yaw)).toBeCloseTo(0.5 * 180 / Math.PI, 3);

		/* It does not look down through its own hull: no lower than its Low. */
		inner.Pitch = 1.2;

		frames(1);

		expect(inner.Pitch).toBeCloseTo(10 * Math.PI / 180, 5);

		inner.Pitch = 0;

		frames(1);

		engine.WeaponsHold(true);
		engine.WeaponsHold(false);

		expect(fired.length).toBeGreaterThan(0);
		expect(fired[0].ID).toBe('docked');
		expect(fired[0].Weapon).toBe('plasma');
		expect(Math.hypot(fired[0].From[0] - inner.Eye[0], fired[0].From[1] - inner.Eye[1], fired[0].From[2] - inner.Eye[2])).toBeCloseTo(2.5, 1);
		expect(inner.Objects.docked.Values.Fired).toBe(inner.Seconds);

		/* What it knows round it: the foe of another team on its left (+x of a nose along +z), the friend of the team of its crew; not its own crew. */
		contacts = space.Contacts('docked');
		foe = contacts.filter(function (one) {
			return one.ID === 'foe';
		})[0];

		expect(foe.Hostile).toBe(true);
		expect(foe.Kind).toBe('walker');
		expect(foe.Distance).toBeGreaterThan(14);
		expect(foe.Bearing).toBeLessThan(-60);
		expect(contacts.filter(function (one) {
			return one.ID === 'friend';
		})[0].Hostile).toBe(false);
		expect(contacts.some(function (one) {
			return one.ID === 'me' || one.ID.indexOf('docked:') === 0;
		})).toBe(false);

		/* Its target, one for all its seats. */
		expect(space.SetTarget('docked', 'foe')).toBe('foe');
		expect(space.TargetOf('docked')).toBe('foe');
		expect(space.Contacts('docked').filter(function (one) {
			return one.Target;
		})[0].ID).toBe('foe');

		/* Back at the turret: the one that turns to the target (the foe on the ground: under the hull), on it; 1 the first again. */
		space.Tactic('');
		space.Tactic('turret');

		frames(2);

		expect(inner.TurretIndex).toBe(1);
		expect(Math.hypot(inner.Eye[0] - turrets[1].At[0], inner.Eye[1] - turrets[1].At[1] + 0.9, inner.Eye[2] - turrets[1].At[2])).toBeLessThan(0.05);
		expect(Math.abs(inner.Objects.docked.Values.Aim.Yaw)).toBeGreaterThan(30);

		space.Key({code: 'Digit1', preventDefault: function () {}});

		frames(1);

		expect(inner.TurretIndex).toBe(0);

		/* The modes over the view: a button for each, the one it is in marked; the radar's marks, the frame on its target. */
		frames(2);

		await waitFor(function () {
			return space.$Element().querySelectorAll('.elemenx-game-tactics button').length === 2;
		}, 2000);

		expect(Array.prototype.map.call(space.$Element().querySelectorAll('.elemenx-game-tactics button'), function (button) {
			return button.getAttribute('aria-pressed') + ':' + button.classList.contains('primary');
		})).toEqual(['false:false', 'true:true']);

		await waitFor(function () {
			return space.$Element().querySelectorAll('.elemenx-game-radar .elemenx-game-marker').length >= 2;
		}, 2000);

		expect(space.$Element().querySelector('.elemenx-game-radar .elemenx-game-marker.enemy')).toBeTruthy();

		/* The marks over the view let the presses through to it. Regression: a hud of the scene gave them the pointer, and a press never reached the view (no turret took the mouse). */
		var later = document.createElement('style');

		/* Whichever comes last in the page: the rule of the hud of a scene as a page that loads it after the games has it. */
		later.textContent = '.elemenx-scene-hud > * > * {pointer-events: auto;}';

		document.head.appendChild(later);

		expect(getComputedStyle(space.$Element().querySelector('.elemenx-game-targets')).pointerEvents).toBe('none');

		later.remove();

		/* Escape goes back to its seat; standing up leaves any mode. */
		space.Key({code: 'Escape', preventDefault: function () {}});

		expect(space.Tactic()).toBe('');
		expect(told).toEqual(['schematic', '', 'turret', '', 'turret', '']);

		space.Tactic('turret');
		space.Leave('me');

		frames(2);

		expect(space.Tactic()).toBe('');
	});

	it('takes the turrets a vehicle declares (Mounts of Kind turret) over those of its class, where its model says, in its size', async function () {
		var space = await mount('');
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var turrets;
		var ship;

		space.Add('ship', {ID: 'armed', Size: 10, X: 5, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 40, Mounts: [{Kind: 'engine', At: [0, 0, -0.5]}, {Kind: 'turret', At: [0, 0.1, 0.2], Place: 'top', Weapon: 'laser', Arc: 90}, {Kind: 'turret', At: [0, -0.1, 0], Place: 'belly'}]}});

		for (var i = 0; i < 4; i++) {
			inner.Rest = 0;

			engine.Frame(now += 30);
		}

		ship = inner.Objects.armed;
		turrets = space.Turrets('armed');

		expect(turrets.map(function (one) {
			return one.From + ':' + one.Weapon + ':' + one.Arc;
		})).toEqual(['mount:laser:90', 'mount:plasma:180']);
		expect(Math.hypot(turrets[0].At[0] - ship.World[0], turrets[0].At[1] - ship.World[1] - 1, turrets[0].At[2] - ship.World[2] - 2)).toBeLessThan(0.01);
		expect(turrets[1].Up[1]).toBeLessThan(-0.9);
		expect(turrets[1].Low).toBe(-80);
	});

	it('names no one who sits hidden in a seat: the name of the hero is not over the hull of the ship it sits in', async function () {
		var space = await mount('', true);
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var label;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'me', Name: 'You', Size: 1.8, X: 0, Y: -30});
		space.Add('ship', {ID: 'docked', Size: 89, X: 0, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 89}});

		frames(4);

		space.Control('me');

		frames(10);

		label = space.$Element().querySelector('.elemenx-scene-label[data-id="me"]');

		expect(label && !label.hidden).toBe(true);

		/* Seen from outside the ship (its helm), where its seat is in the view. */
		space.Board('me', 'docked', 'pilot');
		space.Tactic('helm');

		frames(3);

		expect(inner.Objects.me.Hidden).toBe(true);
		expect(label.hidden).toBe(true);
	});

	it('commands from the seat of command: its crew, or every crew of its fleet from the flagship; the view of a strategy carried by the keys; GameStrategy orders only them, only there', async function () {
		var space = await mount('<GameStrategy Command="seat" />');
		var inner = space.Scene();
		var engine = space.Engine();
		var now = performance.now() + 1000;
		var strategy;
		var command;
		var at;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'me', Size: 1.8, X: 0, Y: -60, Team: 'blue'});
		space.Add('ship', {ID: 'flag', Size: 89, X: 0, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 89, Fleet: 'alpha', Flagship: true}});
		space.Add('ship', {ID: 'wing', Size: 30, X: 120, Y: 0, Yaw: 0, Vehicle: {Kind: 'ship', Parked: true, Length: 30, Fleet: 'alpha'}});
		space.Add('unit', {ID: 'flag-a', Size: 1.8, X: -4, Y: -70, Team: 'blue', Crew: 'flag', Health: 100});
		space.Add('unit', {ID: 'flag-b', Size: 1.8, X: -2, Y: -70, Team: 'blue', Crew: 'flag', Health: 100});
		space.Add('unit', {ID: 'wing-a', Size: 1.8, X: 110, Y: -30, Team: 'blue', Crew: 'wing', Health: 100});
		space.Add('unit', {ID: 'other', Size: 1.8, X: 10, Y: -70, Team: 'blue', Health: 100});

		frames(4);

		space.Control('me');

		frames(2);

		strategy = Elemenx.Instance(space.$Element().querySelector('.elemenx-game-strategy'));

		/* Out of the view of a strategy it plays not: none of the team is its. */
		expect(strategy.Playing()).toBe(false);
		expect(strategy.Select(['flag-a']).Selection()).toEqual([]);

		/* The pilot of a flagship with no captain nor commander aboard: the seat of command, every crew of the fleet. */
		space.Board('me', 'flag', 'pilot');

		expect(space.Tactics('me')).toContain('strategic');

		command = space.Command('me');

		expect(command.Kind).toBe('fleet');
		expect(command.Vehicles.sort()).toEqual(['flag', 'wing']);
		expect(command.Units.map(function (unit) {
			return unit.ID;
		}).sort()).toEqual(['flag-a', 'flag-b', 'wing-a']);

		/* Not the flagship: its own crew alone. */
		inner.Objects.flag.Values.Vehicle.Flagship = false;

		expect(space.Command('me').Kind).toBe('crew');
		expect(space.Command('me').Units.length).toBe(2);

		inner.Objects.flag.Values.Vehicle.Flagship = true;

		/* The view of a strategy: over the vehicle, the keys carrying its point over the ground, R raising it. */
		expect(space.Tactic('strategic')).toBe('strategic');

		/* At once, the scene at rest (no step yet): its crews are its units. Regression: they were only of the last step, none. */
		expect(strategy.Select(['flag-b']).Selection()).toEqual(['flag-b']);

		frames(3);

		at = space.StrategyPoint();

		expect(Math.hypot(at[0] - inner.Objects.flag.World[0], at[2] - inner.Objects.flag.World[2])).toBeLessThan(0.01);
		expect(inner.Eye[1]).toBeGreaterThan(at[1] + 40);

		inner.Keys.KeyW = true;

		frames(10);

		delete inner.Keys.KeyW;
		inner.Keys.KeyR = true;

		frames(5);

		delete inner.Keys.KeyR;

		expect(Math.hypot(space.StrategyPoint()[0] - at[0], space.StrategyPoint()[2] - at[2])).toBeGreaterThan(10);
		expect(space.StrategyPoint()[1]).toBeGreaterThan(at[1] + 5);

		/* There it plays: the crews are its units (not the one of the team of no crew), told where to go. */
		frames(1);

		expect(strategy.Playing()).toBe(true);
		expect(strategy.Select(['flag-a', 'wing-a', 'other']).Selection().sort()).toEqual(['flag-a', 'wing-a']);
		expect(strategy.Order(['flag-a', 'wing-a'], [20, -40])).toBe(true);
		expect(inner.Ways['flag-a']).toBeTruthy();

		/* Back at the console: nothing selected; what was told goes on. */
		space.Tactic('');

		frames(2);

		expect(strategy.Selection()).toEqual([]);
		expect(inner.Ways['flag-a']).toBeTruthy();
	});
});
