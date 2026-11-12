import { describe, expect, it, vi } from 'vitest';
import combatSource from '../../examples/Advanced/application/components/CombatDemo/CombatDemo.js?raw';

/* The definition of the demo as its source gives it (Elemenx.Component caught). */
function definition () {
	var caught = null;
	var stub = {Component: function (name, made) {
		caught = made;
	}};

	new Function('Elemenx', combatSource)(stub);

	return caught;
}

describe('Regression: the Combat demo of Gaming', function () {
	/* RT of the pad on the screen fired as the Fire button does: the view turned to the target of the list at each shot. */
	it('fires where the crosshair is on RT, the view kept, and burns a laser while RT is held', function () {
		var demo = Object.assign({}, definition());
		var shots = [];
		var scene = {Fire: function (id, options) {
			shots.push([id, options]);

			return true;
		}, $Element: function () {
			return {isConnected: true};
		}};

		vi.useFakeTimers();

		try {
			demo.CombatScene = function () {
				return scene;
			};
			demo.CombatAimed = function () {
				throw new Error('The view turned');
			};
			demo.CombatWeapon = 'rifle';

			demo.CombatPad({Button: 'rt', Down: true});
			demo.CombatPad({Button: 'rt', Down: false});

			expect(shots).toEqual([['hero', undefined]]);

			demo.CombatWeapon = 'laser';
			shots = [];

			demo.CombatPad({Button: 'rt', Down: true});

			vi.advanceTimersByTime(500);

			demo.CombatPad({Button: 'rt', Down: false});

			vi.advanceTimersByTime(500);

			expect(shots.length).toBeGreaterThan(5);
			expect(shots.length).toBeLessThan(15);
			expect(shots.every(function (shot) {
				return shot[0] === 'hero' && shot[1] === undefined;
			})).toBe(true);
		}
		finally {
			vi.useRealTimers();
		}
	});

	it('lets a weapon and a spell be chosen by the slots over the scene', function () {
		var demo = definition();

		expect(demo.CombatWeapons.length).toBe(10);
		expect(demo.CombatWeapons.every(function (weapon) {
			return weapon.Icon && weapon.Key;
		})).toBe(true);
		expect(demo.CombatSpells.every(function (spell) {
			return typeof demo[spell.Value] === 'function';
		})).toBe(true);
	});
});
