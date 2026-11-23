import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (inside) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('SystemsHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready" (shield)="Shield" (discover)="Discover">' +
		'<SceneObject ID="land" Kind="ground" Size="600" Height="0" Water="0" Seed="flat" />' +
		(inside || '') +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Shield: function (event) {
		told.push(['shield', event && event.detail ? event.detail : event]);
	}, Discover: function (event) {
		told.push(['discover', event && event.detail ? event.detail : event]);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told};
}

describe('Contract: SceneShipSystems, the reactors, the power, the layers of a shield and the sensors of what a Scene holds', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels', 'service:Vitals']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function frames (scene, count) {
		for (var i = 0; i < count; i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	it('heats its reactors with their load, shares their power between the systems, vents their heat and turns them off', async function () {
		var made = await mount();
		var scene = made.Scene;
		var read;

		scene.Add('unit', {ID: 'craft', Size: 2, X: 0, Y: 0, Traits: {Power: {Reactors: [{ID: 'main', Output: 60, Rise: 0.5}, {ID: 'aux', Output: 20}], Needs: {Engines: 100, Shields: 30, Weapons: 20}}}});

		frames(scene, 3);

		scene.Scene().Objects.craft.Ship = {Throttle: 1};

		frames(scene, 30);

		read = scene.ShipSystems('craft');

		expect(read.Supply).toBe(80);
		expect(read.Reactors.map(function (one) {
			return one.ID;
		})).toEqual(['main', 'aux']);
		expect(read.Reactors[0].Heat).toBeGreaterThan(0.1);
		/* 80 MW for 100 + 3 + 2 MW asked, shared evenly: the engines a third of it, less than they need. */
		expect(read.Power.Engines).toBeCloseTo(80 / 3 / 100, 3);
		expect(read.Power.Shields).toBe(1);

		expect(scene.SetPower('craft', {Engines: 10, Shields: 1, Weapons: 1})).toBe(true);

		frames(scene, 2);

		expect(scene.ShipSystems('craft').Power.Engines).toBeGreaterThan(read.Power.Engines * 2);
		expect(scene.Engine().EnginesPower(scene.Scene().Objects.craft)).toBeCloseTo(scene.ShipSystems('craft').Power.Engines, 6);

		var heat = scene.ShipSystems('craft').Reactors[0].Heat;

		expect(scene.Vent('craft')).toBe(true);
		expect(scene.ShipSystems('craft').Reactors[0].Heat).toBeCloseTo(Math.max(0, heat - 0.5), 6);

		expect(scene.SetReactor('craft', 'main', false)).toBe(true);

		frames(scene, 2);

		expect(scene.ShipSystems('craft').Supply).toBe(20);
		expect(scene.SetReactor('craft', 'nothing', false)).toBe(false);
	});

	it('shuts a reactor down by its heat and starts it again once it is cool', async function () {
		var made = await mount();
		var scene = made.Scene;
		var reactor;

		scene.Add('unit', {ID: 'hot', Size: 2, X: 0, Y: 0, Traits: {Power: {Reactors: [{ID: 'core', Output: 10, Rise: 3, Cool: 1}], Needs: {Engines: 100}}}});

		frames(scene, 3);

		scene.Scene().Objects.hot.Ship = {Throttle: 1};

		frames(scene, 20);

		reactor = scene.ShipSystems('hot').Reactors[0];

		expect(reactor.Tripped).toBe(true);
		expect(scene.ShipSystems('hot').Supply).toBe(0);

		/* The throttle let go: it cools, and starts again under Resume. */
		scene.Scene().Objects.hot.Ship = {Throttle: 0};

		frames(scene, 120);

		expect(scene.ShipSystems('hot').Reactors[0].Tripped).toBe(false);
	});

	it('takes a hit by its layers of shield one after another, tells each, fills them again after a while, and hurts the health only with what is left', async function () {
		var made = await mount();
		var scene = made.Scene;
		var ledger;
		var layers;

		scene.Add('unit', {ID: 'mage', Size: 1.8, X: 0, Y: 0, Health: 100, Traits: {Health: {Max: 100}, Shields: {Layers: [{ID: 'ward', Capacity: 20, Regen: 10, Delay: 1}, {ID: 'aegis', Capacity: 30, Regen: 10, Delay: 1}]}}});

		frames(scene, 3);

		expect(scene.Absorb('mage', 25)).toBe(0);

		layers = scene.ShipSystems('mage').Shields;

		expect(layers.map(function (one) {
			return one.Value;
		})).toEqual([0, 25]);
		expect(made.Told.filter(function (one) {
			return one[0] === 'shield';
		}).map(function (one) {
			return [one[1].Layer, one[1].Taken, one[1].Broken];
		})).toEqual([['ward', 20, true], ['aegis', 5, false]]);

		/* Within its Delay it does not fill; past it, it does. */
		frames(scene, 15);

		expect(scene.ShipSystems('mage').Shields[0].Value).toBe(0);

		frames(scene, 30);

		expect(scene.ShipSystems('mage').Shields[0].Value).toBeGreaterThan(3);

		/* The health of a game (Vitals): a damage through the shield first. */
		ledger = Elemenx.Service('Vitals').Of(scene);

		scene.Absorb('mage', 1000);

		ledger.Damage('mage', {Amount: 40});

		expect(ledger.Get('mage').Value).toBe(60);
		expect(scene.Absorb('nobody', 7)).toBe(7);
	});

	it('knows the places its sensors reach, and sees a blocker of warp before it comes into it', async function () {
		var made = await mount();
		var scene = made.Scene;
		var km = scene.Engine().Metre() ? scene.Engine().Metre() * 1000 : 1000;
		var read;

		scene.Add('unit', {ID: 'scout', Size: 2, X: 0, Y: 0, Vehicle: {Kind: 'car', Sensors: {Range: 100 / km}}});
		scene.Add('thing', {ID: 'outpost', Size: 2, X: 0, Y: 60, Traits: {NavPoint: {Kind: 'station', Name: 'Outpost'}}});
		scene.Add('thing', {ID: 'far', Size: 2, X: 0, Y: 250, Traits: {NavPoint: {Kind: 'landing', Name: 'Far field'}}});
		scene.Add('thing', {ID: 'jammer', Size: 2, X: 80, Y: 0, Traits: {WarpBlocker: {Radius: 5}}});

		frames(scene, 4);

		read = scene.ShipSystems('scout');

		expect(read.Nav.map(function (one) {
			return one.ID;
		})).toEqual(['outpost']);
		expect(read.Nav[0]).toMatchObject({Kind: 'station', Name: 'Outpost', Known: true});
		expect(read.Nav[0].Distance).toBeCloseTo(60 / km, 3);
		expect(made.Told.filter(function (one) {
			return one[0] === 'discover';
		}).map(function (one) {
			return one[1].ID;
		})).toEqual(['outpost']);
		expect(read.Jam).toMatchObject({ID: 'jammer', Inside: false});
		expect(read.Jam.Distance).toBeCloseTo(70 / km, 3);

		expect(scene.Readout('scout').Systems.Jam.ID).toBe('jammer');
	});

	/* Contract: each layer with something left is a shell round the outline of its object (its model once more, grown out). */
	it('draws each layer with something left as a shell round the outline of what it guards', async function () {
		var made = await mount();
		var scene = made.Scene;
		var shells;

		Elemenx.Service('SceneModels').Define('systems-box', {Group: 'props', Type: 'thing', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], [0.6, 0.45, 0.25])])];
		}});

		scene.Add('thing', {ID: 'guarded', Model: 'systems-box', Size: 2, X: 0, Y: 0, Traits: {Shields: {Layers: [{ID: 'outer', Capacity: 10}, {ID: 'inner', Capacity: 10}]}}});

		frames(scene, 4);

		shells = function () {
			return Object.keys(scene.Scene().ShellLists || {}).filter(function (name) {
				return scene.Scene().ShellLists[name].Count;
			});
		};

		expect(shells().some(function (name) {
			return name.indexOf('shell:guarded:outer:') === 0;
		})).toBe(true);
		expect(shells().some(function (name) {
			return name.indexOf('shell:guarded:inner:') === 0;
		})).toBe(true);

		scene.Absorb('guarded', 10);

		frames(scene, 40);

		expect(shells().some(function (name) {
			return name.indexOf('shell:guarded:outer:') === 0;
		})).toBe(false);
		expect(scene.Scene().ShellLists[shells()[0]].Shell.Grow).toBeGreaterThan(0);
	});
});
