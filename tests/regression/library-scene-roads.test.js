import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A scene of a hilly ground, its frames made by hand. */
async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('RoadHost'), {
		$Template: '<div style="width: 320px; height: 200px"><Scene Quality="low" Labels="false" (ready)="Ready"></Scene></div>',
		Ready: function (space) {
			ready = space;
		}
	})();
	var now = performance.now() + 1000;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();
	ready.Add('ground', {ID: 'land', Size: 400, Height: 30, Water: 0, Scale: 90, Ridges: 0.3, Seed: 'roads'});

	return {
		Scene: ready,
		Frames: function (count) {
			var i;

			for (i = 0; i < (count || 1); i++) {
				ready.Scene().Rest = 0;

				ready.Engine().Frame(now += 100);
			}
		}
	};
}

describe('Contract: the roads of a Scene: drawn as their models, the ground made level under them, what is under a point', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneRoadGenerator']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('makes the ground level across a road, tells its strips and the ground off it, and its model', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var field;
		var road;
		var middle;
		var walk;
		var off;

		scene.Add('road', {ID: 'main', Type: 'street', Points: [[-120, -40], [0, 10], [120, 30]]});

		mounted.Frames(2);

		field = scene.Scene().Ground.Field;
		road = scene.Roads()[0];

		expect(scene.Roads().length).toBe(1);
		expect(road.ID).toBe('main');
		expect(road.TypeName).toBe('street');

		/* Level across: the ground under the middle and under the sidewalks is the level of the road, a little under it. */
		road.Points.slice(10, -10).filter(function (point, index) {
			return index % 7 === 0;
		}).forEach(function (point) {
			var across = road.Width / 2 - 1;

			[-across, 0, across].forEach(function (offset) {
				expect(field.Height(point.X + point.Way[1] * offset, point.Z - point.Way[0] * offset)).toBeCloseTo(point.Y - 0.05, 0);
			});
		});

		middle = road.Points[Math.floor(road.Points.length / 2)];
		walk = scene.SurfaceAt(middle.X + middle.Way[1] * (road.Width / 2 - 1), middle.Z - middle.Way[0] * (road.Width / 2 - 1));
		off = scene.SurfaceAt(middle.X + middle.Way[1] * 40, middle.Z - middle.Way[0] * 40);

		expect(scene.SurfaceAt(middle.X, middle.Z)).toMatchObject({Road: 'main', Strip: 'lane', Surface: 'asphalt'});
		expect(walk.Strip).toBe('sidewalk');
		expect(walk.Height).toBeCloseTo(middle.Y + 0.15, 1);
		expect(off).toMatchObject({Road: '', Surface: 'ground'});

		/* Its model is its own, at the place of the world. */
		var object = scene.Scene().Objects.main;

		expect(object.Shape.indexOf('road:main:')).toBe(0);
		expect(object.World).toEqual([0, 0, 0]);
		expect(Elemenx.Service('SceneModels').Ready(object.Shape)).toBe(true);
	});

	it('leaves the ground as it is under a bridge and over a tunnel, and gives the road its piers and portals', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var under;
		var over;

		mounted.Frames(1);

		under = scene.Scene().Ground.Field.Height(-20, 20);
		over = scene.Scene().Ground.Field.Height(80, 20);

		scene.Add('road', {ID: 'high', Type: 'road', Bridges: [[40, 80]], Tunnels: [[140, 180]], Points: [[-80, 20], [120, 20]]});

		mounted.Frames(2);

		expect(scene.Roads()[0].Spans.length).toBe(2);
		expect(scene.Scene().Ground.Field.Height(-20, 20)).toBeCloseTo(under, 3);
		expect(scene.Scene().Ground.Field.Height(80, 20)).toBeCloseTo(over, 3);
		/* Off them the ground is levelled under it. */
		expect(scene.Scene().Ground.Field.Height(10, 20)).toBeCloseTo(scene.SurfaceAt(10, 20).Height - 0.05, 0);
	});

	it('makes the road again as it changes, and the ground of its old line as it was', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var before;

		mounted.Frames(1);

		before = scene.Scene().Ground.Field.Height(0, 60);

		scene.Add('road', {ID: 'side', Type: 'country', Points: [[-100, 60], [100, 60]]});

		mounted.Frames(2);

		var first = scene.Scene().Objects.side.Shape;

		scene.Change('side', {Points: [[-100, -60], [100, -60]]});

		mounted.Frames(2);

		expect(scene.Scene().Objects.side.Shape).not.toBe(first);
		expect(scene.Roads()[0].Points[0].Z).toBeCloseTo(-60);
		expect(scene.Scene().Ground.Field.Height(0, 60)).toBeCloseTo(before, 3);

		scene.Remove('side');

		mounted.Frames(2);

		expect(scene.Roads()).toEqual([]);
	});
	it('meets roads at junctions, found or of kind junction, and tells their ground', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var junction;
		var under;

		scene.Add('road', {ID: 'a', Type: 'road', Points: [[-100, 0], [100, 0]]});
		scene.Add('road', {ID: 'b', Type: 'road', Points: [[0, -100], [0, 100]]});
		scene.Add('junction', {ID: 'square', X: 80, Y: 0, Radius: 14, Surface: 'paving'});

		mounted.Frames(2);

		expect(scene.Junctions().map(function (one) {
			return one.ID;
		}).sort()).toEqual(['junction-1', 'square']);

		junction = scene.Junctions().filter(function (one) {
			return one.ID !== 'square';
		})[0];
		under = scene.SurfaceAt(5.2, 5.2);

		/* Out of both roads, in the corner of the junction. */
		expect(under).toMatchObject({Road: junction.ID, Strip: 'junction', Surface: 'asphalt'});
		expect(under.Height).toBeCloseTo(junction.Y);
		expect(scene.SurfaceAt(80, 12)).toMatchObject({Road: 'square', Surface: 'paving'});
		expect(scene.Scene().Ground.Field.Height(5.2, 5.2)).toBeCloseTo(junction.Y - 0.05, 1);
	});
	/* Regression (of Tracks): a corner of a car went through the barrier at speed and at an angle. */
	it('holds a car inside the barriers of a track by its corners, at any speed and at any angle', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var inner = scene.Scene();
		var roads = Elemenx.Service('SceneRoads');
		var track = Elemenx.Service('SceneRoadGenerator').Track('walls', {Length: 1200, Corners: 9, Gap: -9});
		var start = track.Start;
		var road;
		var wall;
		var worst = 0;
		var met = 0;
		var i;

		scene.Add('road', track.Spec);

		mounted.Frames(2);

		road = scene.Roads()[0];
		wall = road.Barriers[1].Offset;

		scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: start.X, Y: start.Z, Vehicle: {Kind: 'car', Heading: start.Heading + 0.9, Long: 2.3, Wide: 1, Power: 1400000, Top: 120}});
		scene.Control('car');

		var car = inner.Objects.car;

		for (i = 0; i < 700; i++) {
			inner.Ground.Keys = i % 140 < 70 ? {KeyW: true, KeyA: true} : {KeyW: true, KeyD: true};

			mounted.Frames(1);

			var state = car.Car;
			var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];

			[[2.3, 1], [2.3, -1], [-2.3, 1], [-2.3, -1]].forEach(function (corner) {
				var x = state.X + ahead[0] * corner[0] + ahead[1] * corner[1];
				var z = state.Z + ahead[1] * corner[0] - ahead[0] * corner[1];
				var near = Math.abs(roads.Near(road, x, z).Offset);

				worst = Math.max(worst, near);
				met = near > wall - 0.3 ? met + 1 : met;
			});
		}

		expect(met).toBeGreaterThan(0);
		expect(worst).toBeLessThan(wall);
	});
	it('stands barriers of kind barrier along a road its Road names, or on points of their own, and they stop a car', async function () {
		var mounted = await mount();
		var scene = mounted.Scene;
		var free;

		scene.Add('road', {ID: 'main', Type: 'road', Points: [[-100, 0], [100, 0]]});
		scene.Add('barrier', {ID: 'side', Road: 'main', Side: 'left', Type: 'wall', Color: '#aa2211', From: 20, To: 120});
		scene.Add('barrier', {ID: 'pen', Type: 'fence', Points: [[30, 30], [60, 30], [60, 60], [30, 60]], Closed: true});

		mounted.Frames(2);

		expect(scene.Roads()[0].Barriers).toEqual([expect.objectContaining({Kind: 'wall', Color: '#aa2211', From: 20, To: 120})]);
		expect(scene.Scene().Objects.pen.Shape.indexOf('barrier:pen:')).toBe(0);
		expect(scene.Scene().Objects.pen.World).toEqual([0, 0, 0]);
		expect(Elemenx.Service('SceneModels').Ready(scene.Scene().Objects.pen.Shape)).toBe(true);

		/* A corner past the fence of the pen, from inside it; the wall of the road, from the road. */
		free = scene.Engine().BarrierHit(45, 61, 45, 55);

		expect(free).not.toBeNull();
		expect(free.Normal[1]).toBeCloseTo(-1, 1);
		expect(scene.Engine().BarrierHit(-50, 5, -50, 2)).not.toBeNull();
		expect(scene.Engine().BarrierHit(50, 5, 50, 2)).toBeNull();

		/* Not a surface: the ground under the fence. */
		expect(scene.SurfaceAt(45, 30).Road).toBe('');

		scene.Remove('pen');
		scene.Remove('side');

		mounted.Frames(2);

		expect(scene.Roads()[0].Barriers).toEqual([]);
		expect(scene.Engine().BarrierHit(45, 61, 45, 55)).toBeNull();
	});
});
