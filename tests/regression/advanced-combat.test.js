import { describe, expect, it } from 'vitest';
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
	/*
	 * RT of the pad on the screen fired as the Fire button does (the view turned to the target of the list); then the demo held
	 * it by a timer of its own. The Scene fires by the trigger itself now (SceneWeapons, its contract), the view kept; the Fire
	 * button burns a beam for a moment and a half by Hold of the shot, no laser named.
	 */
	it('fires by the Fire button with a Hold for a beam, and leaves the trigger of the pad to the Scene', function () {
		var demo = Object.assign({}, definition());
		var shots = [];

		demo.CombatScene = function () {
			return {Fire: function (id, options) {
				shots.push([id, options]);

				return true;
			}};
		};
		demo.CombatPoint = function () {
			return [1, 2, 3];
		};
		demo.CombatAimed = function () {};

		demo.CombatFire();

		expect(shots).toEqual([['hero', {At: [1, 2, 3], Hold: 1.5}]]);
		expect(demo.CombatPad).toBeUndefined();
		expect(combatSource).not.toContain("CombatWeapon === 'laser'");
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
