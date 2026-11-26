import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (universe) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('UniverseHost'), {$Template: '<div style="width: 400px; height: 300px"><Scene Paused="true" Quality="low" Labels="false" Setting="universe" [universe]="Universe" (ready)="Ready" (universe)="Told" (entergalaxy)="Told" (leavegalaxy)="Told" (universeready)="Told" (entervoid)="Told" (enter)="Told" (travel)="Told" />' +
	'</div>', Universe: universe, Ready: function (space) {
		ready = space;
	}, Told: function (event) {
		told.push(event);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return {Scene: ready, Told: told};
}

describe('Contract: the universe of a Scene (Setting universe): its galaxies round the view, picked, one entered, the skies of its systems', function () {
	var home = {ID: 'milky-way', Name: 'Milky Way', Seed: 'milky', Kind: 'barred', Coordinates: [123.4, -5, 60]};
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:UniverseData', 'service:GalaxyData', 'service:SystemData', 'service:Astronomy', 'service:Noise', 'service:Random', 'service:Archive', 'service:PlanetData']);
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

	it('shows the galaxies round its home, draws them, picks one under the pointer and flies to it', async function () {
		var made = await mount({Seed: 'cosmos', Galaxies: [home], Home: 'milky-way'});
		var scene = made.Scene;
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var drawn = {Points: 0, Near: 0};
		var list;
		var near;
		var at;

		frames(scene, 2);

		expect(scene.UniverseData().Manifest.Format).toBe('elemenx-universe');
		expect(made.Told.filter(function (event) {
			return event && event.Home;
		})[0].Home.ID).toBe('milky-way');
		expect(scene.UniverseView().Target).toEqual([123.4, -5, 60]);

		list = scene.UniverseGalaxies();

		expect(list.length).toBeGreaterThan(200);
		expect(list.filter(function (one) {
			return one.ID === 'milky-way';
		})[0].Place).toEqual([123.4, -5, 60]);

		/* Its programs made (the look of far galaxies of the backdrop in them), its galaxies drawn: far as points, near on squares. */
		renderer.Draw = function (mesh, program, uniforms, options) {
			if (options && options.Mode === 'points' && uniforms && uniforms.uFocal) drawn.Points++;
			else if (uniforms && uniforms.uLook) drawn.Near++;

			return draw.apply(this, arguments);
		};

		try {
			await waitFor(function () {
				scene.SetUniverseView({Distance: 0.2});

				frames(scene, 1);

				return renderer.Progress().Needed === 0 && drawn.Points > 0 && drawn.Near > 0;
			}, 20000);
		}
		finally {
			renderer.Draw = draw;
		}

		/* A press on the home galaxy (in the middle of the view) picks it. */
		at = scene.Engine().Universe.ScreenOf(scene.Engine().Universe.Matrices().Matrix, home.Coordinates);

		expect(scene.Engine().Universe.Pick(at[0], at[1])).toBe('milky-way');

		near = list.filter(function (one) {
			return one.ID !== 'milky-way';
		})[0];

		expect(scene.UniverseFocus(near.ID)).toBe(true);
		expect(scene.UniversePicked()).toBe(near.ID);

		frames(scene, 80);

		expect(scene.UniverseView().Target[0]).toBeCloseTo(near.Place[0], 6);
		expect(scene.Setting).toBe('universe');
	});

	it('enters a galaxy (the data of its seed at its place), a system of it sees the galaxies round it in its sky, and leaves again', async function () {
		var made = await mount({Seed: 'cosmos', Galaxies: [home], Home: 'milky-way'});
		var scene = made.Scene;
		var key = '';
		var star;
		var far;

		frames(scene, 2);

		scene.EnterGalaxy('milky-way', function (error, given) {
			key = given;
		}, {Now: true});

		expect(key).toBe('universe:universe-cosmos:milky-way');
		expect(scene.Setting).toBe('galaxy');
		expect(scene.UniverseEntered()).toBe('milky-way');

		frames(scene, 2);

		expect(scene.GalaxyData().Manifest.Seed).toBe('milky');
		expect(scene.GalaxyData().Manifest.Coordinates).toEqual([123.4, -5, 60]);
		expect(made.Told.filter(function (event) {
			return event && event.Key === key;
		}).length).toBe(1);

		/* The sky of a system of a star of it: the galaxies round it as they are (UniverseData.Sky), the largest first. */
		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		star = scene.GalaxyStars()[0];

		var renderer = scene.Engine().Renderer;
		var bake = renderer.Bake;
		var baked = null;
		var sky;

		renderer.Bake = function (cube, program, uniforms) {
			/* The sky of the system (its band seen from where the star lies), not the one of the map of the galaxy. */
			if (uniforms && uniforms.uGalaxies && uniforms.uBandEye && Math.abs(uniforms.uBandEye[0] - star.Place[0] / 1000) < 0.01)
				baked = uniforms;

			return bake.apply(this, arguments);
		};

		try {
			scene.EnterSystem(star.ID, null, {Now: true});

			far = scene.Cosmos.Far;

			await waitFor(function () {
				frames(scene, 1);

				return baked;
			}, 20000);
		}
		finally {
			renderer.Bake = bake;
		}

		/* Baked into the sky where they are seen from there (the galaxy of the band turned into the sky), as large as they are. */
		sky = scene.Engine().GalaxySky(far[0].Way);

		expect(baked.uGalaxies[0]).toBeCloseTo(sky[0], 5);
		expect(baked.uGalaxies[1]).toBeCloseTo(sky[1], 5);
		expect(baked.uGalaxies[2]).toBeCloseTo(sky[2], 5);
		expect(baked.uGalaxies[3]).toBeCloseTo(far[0].Size, 8);
		expect(baked.uPlanes[3]).toBeCloseTo(far[0].Shape, 8);

		expect(scene.Setting).toBe('space');
		expect(far.length).toBe(16);
		expect(far[0].Size).toBeGreaterThan(far[15].Size);
		expect(far[0].Size).toBeLessThan(0.02);
		expect(far).toEqual(Elemenx.Service('UniverseData').Sky(scene.UniverseData(), 'milky-way'));
		expect(scene.UniverseSky('nowhere')).toBe(null);

		scene.LeaveGalaxy();

		expect(scene.Setting).toBe('universe');
		expect(scene.UniverseEntered()).toBe('');
		expect(made.Told.filter(function (event) {
			return event && event.ID === 'milky-way' && !event.Key && !event.Galaxy;
		}).length).toBe(1);

		frames(scene, 90);

		expect(scene.UniverseView().Distance).toBeCloseTo(6, 3);
	});

	/* A ship of a system of the home galaxy and the sky of it, out of the well of its star. */
	async function launched (warp) {
		var made = await mount({Seed: 'cosmos', Galaxies: [home], Home: 'milky-way'});
		var scene = made.Scene;
		var star;

		frames(scene, 2);

		scene.EnterGalaxy('milky-way', null, {Now: true});
		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		star = scene.GalaxyStars()[0];

		scene.EnterSystem(star.ID, null, {Now: true});

		await waitFor(function () {
			frames(scene, 1);

			return scene.Get('star');
		}, 4000);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'star', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'star', From: [0, 0, 3], Facing: [0, 0, 1], Warp: Object.assign({Enter: 0.2, Exit: 0.2, Ramp: 0.2}, warp)}});
		scene.Control('me');

		frames(scene, 2);

		scene.Scene().Objects.me.Ship.At = [0, 0, scene.Scene().Objects.star.Size * 60];

		frames(scene, 1);

		return {Scene: scene, Told: made.Told, Me: scene.Scene().Objects.me, Far: scene.Cosmos.Far};
	}

	/*
	 * Between galaxies a ship goes at the steps past those of a galaxy (9 to its Far, of light-years a second), aimed at a
	 * galaxy of the sky (galaxy:<ID>); it comes out at the edge of it, in the system of a star there on the side it came from.
	 */
	it('jumps to a galaxy of its sky at the steps between galaxies, out at its edge in the system of a star there', async function () {
		var made = await launched({Far: 14, FarStep: 14});
		var scene = made.Scene;
		var target = made.Far[0];
		var universes = Elemenx.Service('UniverseData');
		var travel;
		var light;
		var entered;
		var place;
		var galaxy;
		var i;

		expect(scene.Aim('galaxy:' + target.ID)).toBe('galaxy:' + target.ID);
		expect(scene.Engine().Travel(made.Me, 'warp', {To: 'galaxy:' + target.ID})).toBe(true);

		travel = made.Me.Travel;

		expect(travel).toMatchObject({Kind: 'hyper', Universe: target.ID, Step: 14, Least: 9, Most: 14});
		/* From the edge of its galaxy on the side of the other to the edge of that one. */
		expect(travel.From).toEqual(scene.UniverseDeparture(universes.Find(scene.UniverseData(), target.ID).Place));
		expect(universes.Distance(travel.From, [123.4, -5, 60]) * universes.Units.ly).toBeCloseTo(universes.Find(scene.UniverseData(), 'milky-way').Radius, 3);
		expect(travel.Light).toBeCloseTo(universes.Distance(travel.From, travel.Toward) * universes.Units.ly - universes.Find(scene.UniverseData(), target.ID).Radius, -1);

		/* Its step down and up between 9 and its Far; a light-year a second is the step it goes at (Steps, km/s). */
		expect(scene.TravelStep('me', 3)).toBe(true);
		expect(travel.Step).toBe(9);

		scene.TravelStep('me', 14);

		for (i = 0; i < 60 && travel.Phase !== 'inside'; i++)
			frames(scene, 1);

		light = travel.Light;

		frames(scene, 30);

		/* At step 14 (1.5e19 km/s: 1.6 million light-years a second), some 1.6 million light-years a second of frames. */
		expect(light - travel.Light).toBeGreaterThan(1.5e19 / 9.4607e12 * 0.99 * 0.5 * 0.8);

		for (i = 0; i < 400 && scene.UniverseEntered() !== target.ID; i++)
			frames(scene, 1);

		expect(scene.UniverseEntered()).toBe(target.ID);
		expect(scene.Setting).toBe('space');

		entered = scene.GalaxyEntered();
		galaxy = scene.GalaxyData();
		place = Elemenx.Service('GalaxyData').Star(galaxy, entered).Place;

		/* At its edge: the star a little in from its radius, on the side of the galaxy it came from. */
		expect(Math.hypot(place[0], place[2]) / galaxy.Manifest.Radius).toBeGreaterThan(0.3);
		expect(Math.hypot(place[0], place[2]) / galaxy.Manifest.Radius).toBeLessThan(0.95);
		expect(entered).toBe(scene.UniverseEdge(target.ID, [123.4, -5, 60]));
		expect(made.Told.some(function (event) {
			return event && event.Key && event.ID === target.ID;
		})).toBe(true);
	});

	it('cannot go between galaxies with steps of a galaxy alone; out of the way on it, it stands between them with them all round it', async function () {
		var made = await launched({Far: 8});
		var scene = made.Scene;
		var target = made.Far[0];
		var travel;
		var place;
		var i;

		expect(scene.Engine().Travel(made.Me, 'warp', {To: 'galaxy:' + target.ID})).toBe(false);
		expect(made.Me.Refused).toMatchObject({Kind: 'warp', Reason: 'step'});

		made.Me.Values.Vehicle.Warp.Far = 12;

		expect(scene.Engine().Travel(made.Me, 'warp', {To: 'galaxy:' + target.ID})).toBe(true);

		travel = made.Me.Travel;

		expect(travel.Step).toBe(12);

		for (i = 0; i < 60 && travel.Phase !== 'inside'; i++)
			frames(scene, 1);

		frames(scene, 30);

		/* H again: out between the galaxies, as far as it went (some 8 000 light-years a second at 12). */
		scene.TravelStop('me');

		for (i = 0; i < 60 && !scene.UniverseVoid(); i++)
			frames(scene, 1);

		place = scene.UniverseVoid();

		expect(place).not.toBe(null);
		expect(scene.UniversePlace()).toEqual(place);
		/* Out of its own galaxy: it left from its edge. */
		expect(Elemenx.Service('UniverseData').Distance(place, [123.4, -5, 60]) * 3261563.8).toBeGreaterThan(Elemenx.Service('UniverseData').Find(scene.UniverseData(), 'milky-way').Radius + 5000);
		expect(scene.Setting).toBe('space');
		expect(scene.Cosmos.Kind).toBe('void');
		expect(scene.Cosmos.Far).toEqual(Elemenx.Service('UniverseData').SkyFrom(scene.UniverseData(), place));

		/* Its own galaxy behind it, the largest of the sky. */
		expect(scene.Cosmos.Far[0].ID).toBe('milky-way');
		expect(scene.GalaxyEntered()).toBe('');
		expect(made.Told.some(function (event) {
			return event && event.Place;
		})).toBe(true);
	});
});
