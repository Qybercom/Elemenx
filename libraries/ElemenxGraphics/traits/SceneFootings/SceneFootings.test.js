import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var LAND = {Size: 240, Height: 30, Water: 0, Scale: 60, Ridges: 0.3, Seed: 'footings'};

async function mount (world) {
	var ready = null;
	var component = Elemenx.Component(unique('FootingsHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" [world]="World" />' +
		'<SceneObject ID="hall" Kind="house" X="20" Y="-15" Facing="30" />' +
		'<SceneObject ID="stone" Kind="rock" X="-40" Y="30" Size="6" Footing="true" />' +
		'<SceneObject ID="shed" Kind="house" X="-30" Y="-40" Footing="false" />' +
	'</Scene></div>', World: world, Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

function frames (scene, until) {
	var now = performance.now();

	return waitFor(function () {
		scene.Scene().Rest = 0;

		scene.Engine().Frame(now += 33);

		return until();
	}, 6000);
}

describe('Contract: SceneFootings, the ground gives way under what stands on it', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneWorld', 'service:SceneModels', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('levels the ground under each building of a World with Footings, softly round it, and nowhere else', async function () {
		var scene = await mount(Elemenx.Service('SceneWorld').Library(Object.assign({Footings: {Edge: 5, Margin: 1}}, LAND)));
		var plain = Elemenx.Service('SceneTerrainGenerator').Flat(LAND);
		var field;
		var hall;
		var heights;

		await frames(scene, function () {
			return scene.Scene().Ground && scene.FootingsOf().length === 2;
		});

		field = scene.Scene().Ground.Field;
		hall = scene.FootingsOf().filter(function (place) {
			return place.ID === 'hall';
		})[0];

		/* The building of its kind and the stone told Footing; not the shed told none. */
		expect(scene.FootingsOf().map(function (place) {
			return place.ID;
		}).sort()).toEqual(['hall', 'stone']);

		/* Level all over the footprint: its corners and its middle at its height. */
		heights = hall.Points.map(function (point) {
			return field.Height(point[0] * 0.9 + 20 * 0.1, point[1] * 0.9 - 15 * 0.1);
		}).concat([field.Height(20, -15)]);

		heights.forEach(function (height) {
			expect(height).toBeCloseTo(hall.Height, 3);
		});

		/* The hilly ground: not level there of itself. */
		expect(Math.max.apply(Math, hall.Points.map(function (point) {
			return plain.Height(point[0], point[1]);
		})) - Math.min.apply(Math, hall.Points.map(function (point) {
			return plain.Height(point[0], point[1]);
		}))).toBeGreaterThan(0.3);

		/* Far from them the ground as it is; under the shed too. */
		expect(field.Height(90, 90)).toBe(plain.Height(90, 90));
		expect(field.Height(-30, -40)).toBe(plain.Height(-30, -40));

		/* Turned as it faces: the long side of a box at 30 degrees from Z. */
		expect(hall.Points.length).toBe(4);
	});

	it('takes no footing without the step, and follows a building moved', async function () {
		var scene = await mount(Elemenx.Service('SceneWorld').Library(LAND));
		var plain = Elemenx.Service('SceneTerrainGenerator').Flat(LAND);

		await frames(scene, function () {
			return scene.Scene().Ground;
		});

		expect(scene.FootingsOf()).toEqual([]);
		expect(scene.Scene().Ground.Field.Height(20, -15)).toBe(plain.Height(20, -15));

		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library(Object.assign({Footings: true}, LAND))});

		await frames(scene, function () {
			return scene.FootingsOf().length === 2;
		});

		scene.Change('hall', {X: 60, Y: 50});

		await frames(scene, function () {
			return scene.FootingsOf().some(function (place) {
				return place.ID === 'hall' && Math.abs(place.Points[0][0] - 60) < 20;
			}) && Math.abs(scene.Scene().Ground.Field.Height(60, 50) - scene.FootingsOf().filter(function (place) {
				return place.ID === 'hall';
			})[0].Height) < 1e-3;
		});

		/* Where it stood the ground came back. */
		expect(scene.Scene().Ground.Field.Height(20, -15)).toBe(plain.Height(20, -15));
	});
});
