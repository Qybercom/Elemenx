import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function square (x0, z0, x1, z1) {
	return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

/* A ground of a sketch, all of it sown: the scene itself. */
async function mount (items, bare, more) {
	var ready = null;
	var component = Elemenx.Component(unique('ScatterHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (space) {
		ready = space;
	}})();
	var now = 1000;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 4, Water: 0, Scale: 300, Ridges: 0, Seed: 'sow', Sketch: {Layers: [{ID: 'base', Items: items}]}})});

	if (more)
		more(ready);

	ready.SetViewpoint({Target: [0, 2, 0], Yaw: 0, Pitch: 1.2, Distance: 120});

	await waitFor(function () {
		ready.Scene().Rest = 0;

		ready.Engine().Frame(now += 33);

		return (bare || ready.Sown().Squares > 0) && ready.Sown().Waiting === 0;
	}, 45000);

	return ready;
}

/* A busy machine sows slowly: the ground of each test may take its time. */
describe('Contract: what a sketch sows over a ground: growth in its areas, rows, lines of things and markers', {timeout: 90000}, function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* Regression: the scatter read the sketch of the ground alone, so the trees grew on the roads of the scene. */
	it('grows nothing on a road of the scene', async function () {
		var scene = await mount([{ID: 'f', Type: 'forest', Points: square(-90, -90, 90, 90), Density: 6}], false, function (ready) {
			ready.Add('road', {ID: 'way', Type: 'road', Points: [[-90, 0], [90, 0]]});
		});
		var trees = scene.SownNear(0, 0, 90);

		expect(trees.length).toBeGreaterThan(100);
		expect(trees.filter(function (one) {
			return Math.abs(one.Z) < 4;
		})).toEqual([]);
	});

	it('grows a forest in its area only, none in its clearing nor on its road, and sows a field in rows of its spacing', async function () {
		var scene = await mount([
			{ID: 'f', Type: 'forest', Points: square(-90, -90, -10, -10), Density: 6},
			{ID: 'c', Type: 'clearing', Points: square(-60, -60, -40, -40)},
			{ID: 'r', Type: 'road', Points: [[-90, -20], [-10, -20]], Width: 6},
			{ID: 'w', Type: 'fields', Points: square(10, 10, 60, 60), Spacing: 1, Gap: 1.5, Way: 0}
		]);
		var trees = scene.SownNear(-50, -50, 60).filter(function (one) {
			return one.Model !== 'wheat';
		});
		var wheat = scene.SownNear(35, 35, 30).filter(function (one) {
			return one.Model === 'wheat';
		});

		expect(trees.length).toBeGreaterThan(100);
		expect(trees.every(function (one) {
			return one.X >= -90 && one.X <= -10 && one.Z >= -90 && one.Z <= -10;
		})).toBe(true);
		expect(trees.some(function (one) {
			return one.X > -60 && one.X < -40 && one.Z > -60 && one.Z < -40;
		})).toBe(false);
		expect(trees.some(function (one) {
			return Math.abs(one.Z + 20) < 4;
		})).toBe(false);

		/* On the lattice of the ground: x by its spacing, z by its gap, a little of the hand that sowed them. */
		expect(wheat.length).toBeGreaterThan(400);
		expect(wheat.every(function (one) {
			return Math.abs(one.X - Math.round(one.X)) <= 0.081 && Math.abs(one.Z / 1.5 - Math.round(one.Z / 1.5)) <= 0.081;
		})).toBe(true);
	});

	it('stands the pieces of a fence along its line, a step apart and turned its way, and nobody walks through them', async function () {
		var scene = await mount([
			{ID: 'n', Type: 'fence', Points: [[0, 30], [20, 50]]},
			{ID: 'h', Type: 'hedge', Points: [[40, 20], [70, 20]]},
			{ID: 't', Type: 'thicket', Points: square(-80, 20, -40, 60), Passability: 0},
			{ID: 'o', Type: 'meadow', Points: square(40, -80, 80, -40), Density: 2, Passability: 1}
		]);
		var engine = scene.Engine();
		var fence = scene.SownNear(10, 40, 20).filter(function (one) {
			return one.Model === 'fence';
		});
		var thicket = scene.SownNear(-60, 40, 30);
		var meadow = scene.SownNear(60, -60, 30);

		expect(fence.length).toBe(Math.floor(Math.hypot(20, 20) / 2));
		expect(fence.every(function (one) {
			return Math.abs(one.Turn + Math.PI / 4) < 1e-6 && one.Size === 2 && Math.abs(one.X - one.Z + 30) < 1e-4;
		})).toBe(true);
		expect(fence.every(function (one) {
			return engine.ScatterBlocked(one.X, one.Z);
		})).toBe(true);

		/* A hedge of pieces as long as its step (1.8), not as its model (2): they meet, and no gap is left. */
		expect(scene.SownNear(55, 20, 20).filter(function (one) {
			return one.Model === 'hedge';
		}).every(function (one) {
			return Math.abs(one.Size - 1.8) < 1e-6;
		})).toBe(true);

		/* Passability 0: all of a thicket stops the way; 1: nothing of a meadow does. */
		expect(thicket.length).toBeGreaterThan(20);
		expect(thicket.every(function (one) {
			return engine.ScatterBlocked(one.X, one.Z);
		})).toBe(true);
		expect(meadow.length).toBeGreaterThan(5);
		expect(meadow.some(function (one) {
			return engine.ScatterBlocked(one.X, one.Z);
		})).toBe(false);
	});

	/*
	 * Regression: the streets of a settlement were a tint of its ground, grown over by trees and rocks. They are roads of the
	 * scene now, made with the ground (of its kind: a town street), drawn by an object of their own, and nothing grows on them.
	 */
	it('makes the streets of a settlement roads of its kind, with the ground at once, and sows nothing on them', async function () {
		var scene = await mount([
			{ID: 'f', Type: 'forest', Points: square(-90, -90, 90, 90), Density: 6},
			{ID: 'burg', Type: 'settlement', Kind: 'town', Points: square(-60, -60, 60, 60), Roads: true}
		]);
		var plan = scene.Scene().Ground.Field.Sketch.Settlements()[0];
		var made = scene.Engine().Roads().filter(function (road) {
			return /^street-burg-/.test(road.ID);
		});

		expect(plan.Streets.length).toBeGreaterThan(1);
		expect(made.length).toBe(plan.Streets.length);
		expect(made.every(function (road) {
			return road.TypeName === 'street';
		})).toBe(true);

		await waitFor(function () {
			return !!scene.Scene().Objects['street-burg-0'];
		}, 15000);

		/* On its streets: nothing sown but what stands beside a street (its lamps, benches, bins). */
		plan.Streets.forEach(function (street) {
			var a = street.Points[0];
			var b = street.Points[street.Points.length - 1];
			var middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

			expect(scene.SownNear(middle[0], middle[1], 2).filter(function (one) {
				return !/streetlamp|bench|bin|planter|bus|hydrant/.test(one.Model);
			})).toEqual([]);
		});

		expect(scene.Engine().SurfaceAt(plan.Streets[0].Points[0][0], plan.Streets[0].Points[0][1]).Road).toMatch(/^street-burg-|^junction-/);
	});

	/* Regression: a temple of a sketch stood on the motorway that went through its place. A landmark never stands on a way. */
	it('moves a landmark that stands on a way aside, out of its edge, and tells it', async function () {
		var warned = [];
		var warn = window.console.warn;

		window.console.warn = function (text) {
			warned.push(String(text));
		};

		try {
			var scene = await mount([
				{ID: 'way', Type: 'road', Points: [[-80, 0], [80, 0]], Width: 12},
				{ID: 'shrine', Type: 'landmark', At: [10, 1], Model: 'temple', Size: 10, Name: 'Shrine'}
			], true);

			await waitFor(function () {
				return !!scene.Scene().Objects['sketch-shrine'];
			}, 4000);

			var shrine = scene.Scene().Objects['sketch-shrine'];

			/* Out of the edge (6) by half of it (5) and a little more, on the side it stood. */
			expect(Number(shrine.Values.Y)).toBeGreaterThanOrEqual(12.9);
			expect(Number(shrine.Values.X)).toBeCloseTo(10, 3);
			expect(warned.some(function (text) {
				return text.indexOf('Shrine') !== -1;
			})).toBe(true);
		}
		finally {
			window.console.warn = warn;
		}
	});

	it('builds a settlement on its plan: a building of its class and size on each lot, its walls but where its gates are, its towers, and nobody walks through them', async function () {
		var scene = await mount([{ID: 'fort', Type: 'settlement', Kind: 'fort', Points: square(-40, -40, 40, 40), Lit: 0.5}]);
		var engine = scene.Engine();
		var plan = scene.Scene().Ground.Field.Sketch.Settlements()[0];
		var sown = scene.SownNear(0, 0, 70);
		var buildings = sown.filter(function (one) {
			return /^settle-/.test(one.Model);
		});
		var gates = sown.filter(function (one) {
			return one.Model === 'gate';
		});
		var walls = sown.filter(function (one) {
			return one.Model === 'city-wall';
		});

		expect(plan.Lots.length).toBeGreaterThan(4);
		expect(buildings.length).toBe(plan.Lots.length);

		plan.Lots.forEach(function (lot) {
			var one = buildings.filter(function (building) {
				return Math.abs(building.X - lot.X) < 1e-4 && Math.abs(building.Z - lot.Z) < 1e-4;
			})[0];

			expect(one.Model).toMatch(new RegExp('^settle-' + lot.Class + '-' + Math.round(lot.Width) + 'x' + Math.round(lot.Depth) + '-5-'));
			expect(one.Turn).toBeCloseTo(lot.Turn, 6);
			expect(Elemenx.Service('SceneModels').Info(one.Model).Size).toBeCloseTo(one.Size, 4);
			/* All of its ground, its corners too, a metre in. */
			[[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].forEach(function (corner) {
				var x = corner[0] * (lot.Width / 2 - 1);
				var z = corner[1] * (lot.Depth / 2 - 1);

				expect(engine.ScatterBlocked(lot.X + Math.cos(lot.Turn) * x + Math.sin(lot.Turn) * z, lot.Z + Math.cos(lot.Turn) * z - Math.sin(lot.Turn) * x)).toBe(true);
			});
		});

		expect(gates.length).toBe(plan.Gates.length);
		expect(sown.filter(function (one) {
			return one.Model === 'wall-tower';
		}).length).toBe(4);
		expect(walls.length).toBeGreaterThan(20);
		expect(walls.some(function (one) {
			return plan.Gates.some(function (gate) {
				return Math.hypot(one.X - gate.X, one.Z - gate.Z) < 3;
			});
		})).toBe(false);
	});

	it('makes its markers objects of the scene of their role, a camp with its tent and its fire', async function () {
		var scene = await mount([
			{ID: 'm1', Type: 'marker', At: [10, -10], Role: 'camp', Name: 'Hunters'},
			{ID: 'm2', Type: 'marker', At: [-30, 15], Role: 'spawn', Team: 'red'}
		], true);
		var inner = scene.Scene();

		await waitFor(function () {
			inner.Rest = 0;

			scene.Engine().Frame(performance.now());

			return scene.Get('sketch-m1') && scene.Get('sketch-m1/fire');
		}, 4000);

		expect(scene.Get('sketch-m1').Traits.Marker).toMatchObject({Role: 'camp'});
		expect(scene.Get('sketch-m1').Values.Name).toBe('Hunters');
		expect(scene.Get('sketch-m1/tent').Values.Model).toBe('tent');
		expect(scene.Get('sketch-m1/fire').Traits.Effect.Type).toBe('campfire');
		expect(scene.Get('sketch-m2').Traits.Marker).toMatchObject({Role: 'spawn', Team: 'red'});
		expect(scene.Objects('Marker').map(function (object) {
			return object.ID;
		}).sort()).toEqual(['sketch-m1', 'sketch-m2']);
	});
});
