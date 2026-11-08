import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('PipeHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="300" Height="2" Water="0" Seed="flat" />' +
	'</Scene></div>', Ready: function (space) {
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

describe('Contract: the pipes of a Scene (kind pipe), drawn as their model and cutting the ground where buried', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels', 'service:ScenePipes']);
	});

	beforeEach(function () {
		resetDOM();

		now = performance.now() + 100;
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	function frames (scene, count) {
		var i;

		for (i = 0; i < count; i++) {
			scene.Scene().Rest = 0;

			scene.Engine().Frame(now += 33);
		}
	}

	it('lays out a pipe of its points, draws it by a model in the world itself, and gives it to Pipes()', async function () {
		var scene = await mount();
		var body;
		var middle;

		scene.Add({ID: 'main', Kind: 'pipe', Traits: {Pipe: {Points: [[-20, 10], [20, 10]], Radius: 0.4, Lift: 2, Fluid: {Type: 'water', Fill: 0.5, Flow: 1}}}});

		await waitFor(function () {
			frames(scene, 1);

			return scene.Pipes().length === 1 && scene.Engine().BodyOf(scene.Scene().Objects.main);
		}, 10000);

		body = scene.Engine().BodyOf(scene.Scene().Objects.main);

		/* Not stood on the ground at its own place: its model is of the world. */
		expect(scene.Scene().Objects.main.World).toEqual([0, 0, 0]);
		expect(body.Min[0]).toBeLessThan(-19.5);
		expect(body.Max[0]).toBeGreaterThan(19.5);
		expect(body.Max[1]).toBeGreaterThan(scene.Scene().Ground.Field.Height(0, 10) + 2.5);
		expect(scene.Pipes()[0]).toMatchObject({ID: 'main', Radius: 0.4, Laid: 'above', Fluid: {Type: 'water', Fill: 0.5, Flow: 1}});

		middle = Elemenx.Service('ScenePipes').At(scene.Pipes()[0], 20).Y;

		/* What stands in it stands on its bottom (its wall 0.04 thick), what stands on it on its top; a step into its wall is barred. */
		expect(scene.Engine().PipeFloor(0, 10, middle - 0.36)).toBeCloseTo(middle - 0.36, 3);
		expect(scene.Engine().PipeFloor(0, 10, middle + 0.4)).toBeCloseTo(middle + 0.4, 3);
		expect(scene.Engine().PipeBlocks(0, 10.4, middle - 1, 0.1, [0.8])).toBe(true);
		/* The Physics hold what is solid in it or out of it: a tube of its World, met by a ray from over it. */
		expect(scene.Engine().RigidRay([0, middle + 5, 10], [0, -1, 0], 20).ID).toBe('main');
		expect(scene.Engine().RigidRay([0, middle + 5, 10], [0, -1, 0], 20).Distance).toBeCloseTo(4.6, 2);
		expect(scene.RigidWorld().Bodies().some(function (body) {
			return body.ID === 'main' && body.Shape === 'tube';
		})).toBe(true);
	}, 60000);

	it('cuts the ground round a buried pipe a man may go in: under its ground, a floor in the pipe', async function () {
		var scene = await mount();
		var field;
		var axis;

		scene.Add({ID: 'sewer', Kind: 'pipe', Traits: {Pipe: {Points: [[-30, 0], [30, 0]], Radius: 1.2, Laid: 'buried', Depth: 2}}});

		await waitFor(function () {
			frames(scene, 1);

			field = scene.Scene().Ground.Field;

			return scene.Pipes().length === 1 && field.Volume;
		}, 20000);

		axis = scene.Pipes()[0].Points[1].Y;

		/* The ground over it as it was; inside it, its floor, near the bottom of the pipe. */
		expect(field.Height(0, 0)).toBeGreaterThan(axis + 1.2);
		expect(field.Height(0, 0, axis)).toBeLessThan(axis - 0.9);
		expect(field.Height(0, 0, axis)).toBeGreaterThan(axis - 1.4);
	}, 60000);


	/* What flows in a pipe comes out of its open end and of a crack in it as a fluid of particles that fall to the ground; a gas, as a plume. */
	it('pours what flows out of an open end and out of a crack of a pipe, as a fluid on the ground, and lets a gas out as a plume', async function () {
		var scene = await mount();
		var fluids;
		var count;

		scene.Add({ID: 'main', Kind: 'pipe', Traits: {Pipe: {Points: [[-10, 0], [10, 0]], Radius: 0.4, Lift: 2, Fluid: {Type: 'oil', Fill: 0.6, Flow: 2, Pressure: 2}}, Fracture: {Material: 'metal'}}});
		scene.Add({ID: 'gas', Kind: 'pipe', Traits: {Pipe: {Points: [[-10, 20], [10, 20]], Radius: 0.1, Ends: 'closed', Fluid: {Type: 'gas', Pressure: 4}, Leaks: [{Along: 10, Angle: 0, Size: 0.02}]}}});

		frames(scene, 60);

		fluids = scene.Fluids();

		expect(fluids.length).toBe(1);
		expect(fluids[0]).toMatchObject({Pipe: 'main', Type: 'oil'});
		expect(fluids[0].Particles.length).toBeGreaterThan(10);
		/* Out past its end, and down on the ground. */
		expect(fluids[0].Particles.some(function (p) {
			return p.At[0] > 10 && p.At[1] < scene.Scene().Ground.Field.Height(p.At[0], p.At[2]) + 0.5;
		})).toBe(true);
		expect(scene.Get('plume-gas-0')).toBeTruthy();

		/* A crack of it, under the level of what is in it: a hole that spurts there. */
		count = scene.Scene().Piping.Holes.main ? scene.Scene().Piping.Holes.main.length : 0;

		scene.Damage('main', 20, {Point: [0, scene.Pipes()[0].Points[0].Y - 0.3, 0.3], Normal: [0, -0.6, 0.8]});

		expect(scene.Scene().Piping.Holes.main.length).toBe(count + 1);
		expect(Math.abs(scene.Scene().Piping.Holes.main[count].Along - 10)).toBeLessThan(0.5);
	}, 60000);
});
