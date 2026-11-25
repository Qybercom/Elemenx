import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (template, state) {
	var component = Elemenx.Component(unique('GameArmsHost'), Object.assign({$Template: '<div>' + template + '</div>'}, state))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await tick(20);

	return component;
}

/*
 * Contract: GameArms (the missiles, locks, flares and point defence of a ship, the warning of a missile at it) and the
 * missiles and flares on GameRadar, as ArmsOf and Contacts of a Scene give them (SceneMissiles).
 */
describe('Contract: the arms of a ship against ships on its instruments (GameArms, GameRadar)', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['GameArms', 'GameRadar', 'GameMinimap', 'Button', 'Toggle', 'Icon']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('GameArms shows what a ship has, its locks and the warning of a missile at it, and is hidden for a ship with none', async function () {
		var host = await mount('<GameArms #arms />', {});
		var arms = host.$Ref('arms', true);
		var root = host.$Element().querySelector('.elemenx-game-arms');
		var buttons;

		arms.Show(null);

		await tick(20);

		expect(root.hidden).toBe(true);

		arms.Show({Missiles: 'ship-missile', Left: 6, Magazine: 8, Reloading: false, Locks: [{ID: 'b', Progress: 1, Locked: true}, {ID: 'c', Progress: 0.4, Locked: false}], Locked: ['b'], Flares: {Left: 20, Count: 24}, Defence: {Weapon: 'ship-pd', On: true}, Incoming: 2, Soonest: 3.25, LockedBy: ['e'], Flying: 1});

		await tick(20);

		expect(root.hidden).toBe(false);
		expect(root.querySelector('.elemenx-game-arms-warning').textContent.trim()).toBe('Missile ×2 · 3.3 s');
		expect(root.querySelector('.elemenx-game-arms-warning').getAttribute('role')).toBe('alert');
		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('Missiles 6/8 · 1 in flight');
		expect(root.querySelector('.elemenx-game-arms-lock').textContent.trim()).toBe('Lock 1 · 1 locking');
		expect(root.querySelector('.elemenx-game-arms-lock').classList.contains('locked')).toBe(true);
		expect(root.textContent).toContain('Flares 20/24');

		buttons = root.querySelectorAll('.elemenx-button');

		expect(buttons.length).toBe(2);
		expect(buttons[0].disabled).toBe(false);
		expect(root.querySelector('.elemenx-toggle')).not.toBe(null);

		/* Locked by another, none coming: the warning of a lock; nothing locked, none left: no salvo. */
		arms.Show({Missiles: 'ship-missile', Left: 0, Magazine: 8, Reloading: true, Locks: [], Locked: [], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: ['e'], Flying: 0});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-warning').textContent.trim()).toBe('Locked on');
		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('Missiles reloading');
		expect(root.querySelector('.elemenx-game-arms-lock').textContent.trim()).toBe('No lock');
		expect(root.querySelector('.elemenx-button').disabled).toBe(true);
		expect(root.querySelector('.elemenx-toggle')).toBe(null);

		/* Torpedoes and a mass driver: their rounds and their buttons. */
		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: ['b'], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0, Torpedoes: {Name: 'ship-torpedo', Left: 3, Magazine: 4, Reloading: false, Ready: true, Flying: 1}, Driver: {Name: 'ship-massdriver', Left: 0, Magazine: 10, Reloading: true, Ready: false, Flying: 0}});

		await tick(20);

		expect(Array.prototype.map.call(root.querySelectorAll('.elemenx-game-arms-stat'), function (node) {
			return node.textContent.trim();
		})).toEqual(['Torpedoes 3/4 · 1 in flight', 'Mass driver reloading']);
		expect(root.querySelectorAll('.elemenx-button')[0].disabled).toBe(false);
		expect(root.querySelectorAll('.elemenx-button')[1].disabled).toBe(true);

		/* The lance: charging, then cooling. */
		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: [], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0, Torpedoes: null, Driver: null, Lance: {Name: 'ship-lance', Charge: 0.5, Burning: false, Ready: false, Cooldown: 0}});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('Lance charging 50%');
		expect(root.querySelector('.elemenx-game-arms-stat').classList.contains('charging')).toBe(true);
		expect(root.querySelector('.elemenx-button').disabled).toBe(true);

		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: [], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0, Torpedoes: null, Driver: null, Lance: {Name: 'ship-lance', Charge: -1, Burning: false, Ready: false, Cooldown: 12.2}});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('Lance cooling 13 s');

		/* The railgun faster than light: its rounds, its mode switch, charging. */
		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: [], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0, Torpedoes: null, Driver: null, Lance: null, Railgun: {Name: 'ship-ftl', Left: 5, Magazine: 6, Reloading: false, Ready: true, Flying: 0, Charge: -1, Mode: 'predict'}});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('FTL railgun 5/6');
		expect(root.querySelector('.elemenx-toggle')).not.toBe(null);
		expect(root.querySelector('.elemenx-button').disabled).toBe(false);

		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: [], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0, Torpedoes: null, Driver: null, Lance: null, Railgun: {Name: 'ship-ftl', Left: 5, Magazine: 6, Reloading: false, Ready: true, Flying: 0, Charge: 0.25, Mode: 'predict'}});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('FTL railgun charging 25%');
		expect(root.querySelector('.elemenx-button').disabled).toBe(true);

		/* Heavy missiles: their rounds and their button. */
		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: ['b'], Flares: null, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0, Hunters: {Name: 'ship-hunter', Left: 4, Magazine: 6, Reloading: false, Ready: true, Flying: 2}});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-stat').textContent.trim()).toBe('Heavy missiles 4/6 · 2 in flight');
		expect(root.querySelector('.elemenx-button').disabled).toBe(false);

		/* Nothing at it: no warning. */
		arms.Show({Missiles: '', Left: 0, Magazine: 0, Reloading: false, Locks: [], Locked: [], Flares: {Left: 3, Count: 4}, Defence: null, Incoming: 0, Soonest: Infinity, LockedBy: [], Flying: 0});

		await tick(20);

		expect(root.querySelector('.elemenx-game-arms-warning')).toBe(null);
		expect(root.textContent).toContain('Flares 3/4');
	});

	it('GameRadar marks missiles small, the one at the vehicle as incoming, flares as sparks', async function () {
		var host = await mount('<GameRadar #radar Range="5000" />', {});
		var radar = host.$Ref('radar', true);

		radar.Show([
			{ID: 'm1', Name: 'ship-missile', Kind: 'missile', Team: 'red', Hostile: true, Incoming: true, Distance: 2000, Bearing: 10, Elevation: 0, Target: false},
			{ID: 'm2', Name: 'ship-missile', Kind: 'missile', Team: 'blue', Hostile: false, Incoming: false, Distance: 1000, Bearing: -40, Elevation: 0, Target: false},
			{ID: 'f1', Name: 'Flare', Kind: 'flare', Team: 'red', Hostile: true, Distance: 1500, Bearing: 90, Elevation: 0, Target: false},
			{ID: 'b', Name: 'Raider', Kind: 'ship', Team: 'red', Hostile: true, Distance: 3000, Bearing: 0, Elevation: 0, Target: true}
		]);

		await tick(20);

		expect(radar.Markers.map(function (one) {
			return one.ID + ':' + one.Kind;
		})).toEqual(['m1:incoming', 'm2:missile', 'f1:flare', 'b:enemy']);
		expect(host.$Element().querySelectorAll('.elemenx-game-marker.incoming').length).toBe(1);
		expect(host.$Element().querySelectorAll('.elemenx-game-marker.flare').length).toBe(1);
		expect(parseFloat(getComputedStyle(host.$Element().querySelector('.elemenx-game-marker.missile')).width)).toBeLessThan(parseFloat(getComputedStyle(host.$Element().querySelector('.elemenx-game-marker.enemy')).width));
	});
});
