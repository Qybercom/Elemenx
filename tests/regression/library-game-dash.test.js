import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import racingSource from '../../examples/Advanced/application/components/RacingDemo/RacingDemo.js?raw';

var owned = [];

/*
 * Readout of a Scene (SceneVehicles: what the instruments of a vehicle or of a character on foot read, of the graph
 * blueprints/vehicles/readout) and GameDash, which shows it over the scene, for the hero as it changes.
 */
describe('Contract: Readout of a Scene and GameDash, the instruments of what is driven and of a character on foot', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'GameHud', 'GameDash', 'GameFlight', 'GameStats', 'GameStat', 'Meter', 'Toggle', 'Slider', 'Field', 'Button']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (inside) {
		var ready = null;
		var component = Elemenx.Component(unique('DashHost'), {
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

	/*
	 * Regression: the revolutions gauge of the Racing demo read 7500 for every car; the demo read its car itself. Readout reads
	 * them of the car's own Redline (Physics.CarDefaults for one of none), and the demo reads Readout.
	 */
	it('reads the speed, the revolutions of the redline of the car itself, the gear and the lamps', async function () {
		var space = await mount();
		var inner = space.Scene();
		var now = performance.now() + 1000;
		var read;

		space.Add('unit', {ID: 'car', Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Top: 80, Redline: 9000}});
		space.Add('unit', {ID: 'plain', Size: 1, X: 5, Y: 0, Vehicle: {Kind: 'car'}});

		inner.Rest = 0;

		space.Engine().Frame(now += 30);

		inner.Objects.car.Car = {Forward: 20, Rpm: 4500, Gear: 3};
		inner.Objects.car.Signals = {Indicate: -1, Lights: true};
		inner.Objects.car.Blink = 0.1;
		inner.Objects.plain.Car = {Forward: 0, Rpm: 3750, Gear: 0};

		read = space.Readout('car');

		expect(read).toMatchObject({ID: 'car', Kind: 'car', Speed: 72, TopSpeed: 288, SpeedPart: 0.25, RpmPart: 0.5, Gear: 3, Left: 1, Right: 0, Lights: 1});
		expect(space.Readout('plain').RpmPart).toBeCloseTo(3750 / Elemenx.Service('Physics').CarDefaults.Redline, 9);
		expect(space.Readout('nothing')).toBe(null);
		expect(racingSource).not.toContain('/ 7500');
		expect(racingSource).toContain("scene.Readout('car')");
	});

	it('shows the instruments of the hero as it changes: of the car it drives, of the character once it left it', async function () {
		var space = await mount('<GameHud slot="hud" Label="Race"><GameDash slot="bottom" Size="small" Every="0" /></GameHud>');
		var inner = space.Scene();
		var now = performance.now() + 1000;
		var element;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				space.Engine().Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'me', Size: 1.2, X: 0, Y: 0, Health: 60, MaxHealth: 80});
		space.Add('unit', {ID: 'car', Size: 1.2, X: 2, Y: 0, Vehicle: {Kind: 'car'}});

		frames(3);

		space.Control('me');
		space.Board('me', 'car');

		await waitFor(function () {
			frames(1);

			element = space.$Element().querySelector('.elemenx-game-dash');

			return element && element.textContent.indexOf('N') !== -1;
		}, 4000);

		expect(element.textContent).toContain('N');

		/* Regression: the bar of the revolutions had no width of its own in the panel and ran out of it, the stats after it cut off. */
		var group = element.querySelector('.elemenx-game-stat-group').getBoundingClientRect();

		Array.prototype.forEach.call(element.querySelectorAll('.elemenx-meter, .elemenx-game-stat'), function (one) {
			expect(one.getBoundingClientRect().right).toBeLessThanOrEqual(group.right + 1);
		});

		space.Leave('me');

		frames(2);

		await waitFor(function () {
			frames(1);

			return element.textContent.indexOf('%') !== -1;
		}, 4000);

		expect(element.textContent).toContain('%');
	});

	/*
	 * Contract: GameFlight shows what Readout reads of a ship: its systems (reactors, power, the layers of its shield), the
	 * places it knows; with Engineer its hands share the power, turn a reactor off and vent their heat.
	 */
	it('shows the systems of a ship and gives an engineer the hands of its power', async function () {
		var space = await mount('<GameHud slot="hud" Label="Flight"><GameFlight slot="bottom" For="craft" Engineer="true" Every="0" /></GameHud>');
		var inner = space.Scene();
		var now = performance.now() + 1000;
		var element;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				space.Engine().Frame(now += 30);
			}
		}

		space.Add('unit', {ID: 'craft', Size: 2, X: 0, Y: 0, Vehicle: {Kind: 'ship', Sensors: {Range: 0.5}}, Traits: {Power: {Reactors: [{ID: 'core', Output: 50}, {ID: 'spare', Output: 10}]}, Shields: {Layers: [{ID: 'hull', Capacity: 100}]}}});
		space.Add('thing', {ID: 'dock', Size: 2, X: 0, Y: 40, Traits: {NavPoint: {Kind: 'station', Name: 'Dock'}}});

		frames(3);

		await waitFor(function () {
			frames(1);

			element = space.$Element().querySelector('.elemenx-game-flight');

			return element && !element.hidden && element.textContent.indexOf('core') !== -1 && element.textContent.indexOf('Dock') !== -1;
		}, 4000);

		expect(element.textContent).toContain('spare');
		expect(element.textContent).toContain('hull');

		/* The instance of GameFlight: of its root element, or of its host. */
		var instance = null;

		[element, element.parentNode].forEach(function (one) {
			var found = one ? Elemenx.Instance(one) : null;
			if (!instance && found && typeof found.Shared === 'function')
				instance = found;
		});

		expect(instance).toBeTruthy();

		instance.Shared('Engines', 3);
		instance.Turned('spare', false);

		frames(2);

		expect(space.ShipSystems('craft').Shares.Engines).toBe(3);
		expect(space.ShipSystems('craft').Supply).toBe(50);
		expect(instance.Vented).toBeTypeOf('function');
	});
});
