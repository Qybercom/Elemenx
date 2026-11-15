import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (galaxy) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('GalaxyHost'), {$Template: '<div style="width: 400px; height: 300px"><Scene Paused="true" Quality="low" Labels="false" Setting="galaxy" [galaxy]="Galaxy" (ready)="Ready" (galaxy)="Told" (enter)="Told" (leave)="Told" />' +
	'</div>', Galaxy: galaxy, Ready: function (space) {
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

describe('Contract: the galaxy of a Scene (Setting galaxy): its glow, its stars near, picked, a system of one entered and left', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:GalaxyData', 'service:SystemData', 'service:Astronomy', 'service:Noise', 'service:Random', 'service:Archive', 'service:PlanetData']);
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

	/* Frames till the picture of its plane is whole (made a few rows at a frame). */
	function baked (scene) {
		var state = scene.Engine().Galaxy;
		var i;

		for (i = 0; i < 80 && !(state.PlaneSize && state.PlaneRow >= state.PlaneSize); i++)
			frames(scene, 1);
	}

	it('shows the galaxy of its options from far, its stars one by one as the view comes near, a star picked and flown to', async function () {
		var made = await mount({Seed: 'contract', Kind: 'spiral', Radius: 50000});
		var scene = made.Scene;
		var data;
		var stars;
		var star;
		var at;

		frames(scene, 2);

		data = scene.GalaxyData();

		expect(data.Manifest.Kind).toBe('spiral');
		expect(scene.GalaxyView().Distance).toBeCloseTo(130000, 0);
		expect(scene.GalaxyStars()).toEqual([]);

		/* Near a place of its disc: the stars of the sectors round it. */
		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200, Pitch: 0.3});

		frames(scene, 2);

		stars = scene.GalaxyStars();

		expect(stars.length).toBeGreaterThan(1000);

		star = stars[0];
		at = scene.Engine().Galaxy.Pick;

		scene.GalaxyFocus(star.ID);

		expect(scene.GalaxyPicked()).toBe(star.ID);

		frames(scene, 60);

		expect(scene.GalaxyView().Target[0]).toBeCloseTo(star.Place[0], 0);
		expect(typeof at).toBe('function');
	});

	it('turns as a galaxy turns: a star far out a smaller angle in the same time, the view kept on the star it flew to', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var galaxies = Elemenx.Service('GalaxyData');
		var star;
		var later;

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		star = scene.GalaxyStars()[0];

		scene.GalaxyFocus(star.ID);

		frames(scene, 60);

		scene.GalaxyTime = 10;

		frames(scene, 2);

		later = scene.GalaxyView().Target;

		expect(later).toEqual(galaxies.Position(scene.GalaxyData(), star.Place, 10));
		expect(Math.hypot(later[0], later[2])).toBeCloseTo(Math.hypot(star.Place[0], star.Place[2]), 3);
		expect(Math.abs(Math.atan2(later[2], later[0]) - Math.atan2(star.Place[2], star.Place[0]))).toBeCloseTo(10 * 734 / Math.hypot(star.Place[0], star.Place[2]), 3);
		expect(galaxies.Position(scene.GalaxyData(), [5000, 0, 0], 10)[2]).toBeLessThan(galaxies.Position(scene.GalaxyData(), [25000, 0, 0], 10)[2] / 25000 * 5000);
	});

	it('enters the system of a star (made of its seed, with its mass, its sky of the galaxy) and leaves it again', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var star;
		var key = '';
		var entered;

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		star = scene.GalaxyStars()[0];

		scene.EnterSystem(star.ID, function (error, given) {
			key = given;
		});

		frames(scene, 70);

		expect(key).toContain(star.ID);
		expect(scene.Setting).toBe('space');
		expect(scene.GalaxyEntered()).toBe(star.ID);
		expect(scene.Cosmos.Kind).toBe('galaxy');

		entered = made.Told.filter(function (event) {
			return event && event.Key;
		})[0];

		expect(entered.ID).toBe(star.ID);

		await waitFor(function () {
			frames(scene, 1);

			return scene.Get('star');
		}, 4000);

		expect(scene.Get('star').Traits.Star.Mass).toBeCloseTo(star.Mass, 2);

		scene.LeaveSystem();

		expect(scene.Setting).toBe('galaxy');
		expect(scene.GalaxyEntered()).toBe('');

		frames(scene, 70);

		expect(scene.GalaxyView().Distance).toBeCloseTo(40, 0);
	});

	/*
	 * Regression: from far no star could be picked; its black hole was a dark ring seen from far (its bulge hides it); the
	 * stars near the view stood as a box of sectors.
	 */
	it('picks a star from far, marks its black hole only when picked, and draws the stars near as a ball', async function () {
		var made = await mount({Seed: 'contract', Radius: 50000});
		var scene = made.Scene;
		var state = scene.Engine().Galaxy;
		var width = scene.Scene().Width;
		var height = scene.Scene().Height;
		var id;

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 120000, Pitch: 1.4, Yaw: 0});

		frames(scene, 2);

		expect(state.Marks).toBe(null);

		id = state.Pick(width * 0.62, height * 0.5);

		expect(id).toMatch(/^-?\d+\.-?\d+\.-?\d+-\d+$/);
		expect(Elemenx.Service('GalaxyData').Star(scene.GalaxyData(), id)).toBeTruthy();
		expect(state.Pick(width * 0.5, height * 0.5)).toBe('centre');
		expect(state.Pick(2, 2)).toBe('');

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 60});

		frames(scene, 2);

		expect(state.NearReach * 1000).toBeCloseTo(250, 5);
		expect(state.NearCentre[1] * 1000).toBeCloseTo(50, 5);
		expect(scene.GalaxyStars().some(function (star) {
			return Math.abs(star.Place[1]) > 150;
		})).toBe(true);
	});

	/* Regression: under load a scene with no WebGL left drew no frame, and its galaxy then had no stars and its flights went nowhere. */
	it('works out its stars round the view and flies to one with no frame drawn', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var star;

		scene.Engine().GalaxyFrame = function () {};

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		expect(scene.GalaxyStars().length).toBeGreaterThan(1000);

		star = scene.GalaxyStars()[0];

		scene.GalaxyFocus(star.ID);

		frames(scene, 60);

		expect(scene.GalaxyView().Target[0]).toBeCloseTo(star.Place[0], 0);
	});

	/*
	 * Regression: its light was of soft spots of points (blurred near, too thin edgewise, twice as dark dust at ultra as at
	 * medium); now along rays through its shape, the same at any quality but for how fine.
	 */
	it('draws its light and its dust along rays through its shape, the same at any quality but for how many steps and how fine', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var draw = engine.DrawReady;
		var told = [];

		engine.DrawReady = function (mesh, program, values) {
			if (program === engine.Galaxy.Programs.Volume)
				told.push(values);

			return draw.apply(this, arguments);
		};

		['low', 'ultra'].forEach(function (level) {
			scene.Quality = level;

			frames(scene, 1);

			baked(scene);

			frames(scene, 2);
		});

		engine.DrawReady = draw;

		expect(told.length).toBeGreaterThan(1);
		expect(told[0].uBright).toBe(told[told.length - 1].uBright);
		expect(told[0].uDust).toBe(told[told.length - 1].uDust);
		expect(told[told.length - 1].uSteps).toBeGreaterThan(told[0].uSteps);
		expect(engine.Galaxy.Volume.Width).toBeGreaterThan(0);
	});

	it('draws and picks from far what was put in by hand', async function () {
		var made = await mount({Seed: 'contract', Radius: 50000});
		var scene = made.Scene;
		var state = scene.Engine().Galaxy;
		var view;
		var at;

		baked(scene);

		frames(scene, 2);

		Elemenx.Service('GalaxyData').AddBody(scene.GalaxyData(), {ID: 'drifter', Kind: 'station', Place: [20000, 0, 0], Velocity: [0, 0, 0]});

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 120000, Pitch: 1.4, Yaw: 0});

		frames(scene, 2);

		view = scene.Scene();
		at = scene.Engine().Galaxy.Pick;

		/* Where it stands on the screen: found by a sweep of the pick (its own mark is picked before the stars round it). */
		var hit = '';
		var x;
		var y;

		for (x = 0; x < view.Width && !hit; x += 4) {
			for (y = 0; y < view.Height && !hit; y += 4) {
				if (at(x, y) === 'drifter')
					hit = 'drifter';
			}
		}

		expect(hit).toBe('drifter');
		expect(state.AddedMesh).toBeTruthy();
	});

	it('draws its nebulae and clusters from far, the dark clouds over its picture, picks one and goes into it as into a system', async function () {
		var made = await mount({Seed: 'contract', Radius: 50000});
		var scene = made.Scene;
		var state = scene.Engine().Galaxy;
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var objects = [];
		var galaxies = Elemenx.Service('GalaxyData');
		var target;
		var view;
		var at;
		var key;

		baked(scene);

		renderer.Draw = function (mesh, program, uniforms, settings) {
			if (uniforms && uniforms.uDark !== undefined)
				objects.push({Dark: uniforms.uDark, Blend: settings.Blend});

			return draw.apply(this, arguments);
		};

		try {
			scene.SetGalaxyView({Target: [0, 0, 0], Distance: 120000, Pitch: 1.4, Yaw: 0});

			await waitFor(function () {
				frames(scene, 1);

				return objects.some(function (one) {
					return one.Dark === 1;
				}) && objects.some(function (one) {
					return one.Dark === 0;
				});
			}, 30000);
		}
		finally {
			renderer.Draw = draw;
		}

		expect(objects.filter(function (one) {
			return one.Dark === 1;
		})[0].Blend).toBe('alpha');
		expect(objects.filter(function (one) {
			return one.Dark === 0;
		})[0].Blend).toBe('add');

		/* The view near a globular cluster: it is under the pointer where it stands. */
		target = galaxies.Objects(scene.GalaxyData()).filter(function (one) {
			return one.Type === 'globular';
		})[0];

		scene.SetGalaxyView({Target: target.Place.slice(), Distance: target.Radius * 8, Pitch: 0.4, Yaw: 0});

		frames(scene, 2);

		view = scene.Scene();
		at = state.Pick(view.Width / 2, view.Height / 2);

		expect(at).toBe(target.ID);

		/* Into it: the scene of its cluster. */
		key = await new Promise(function (resolve, reject) {
			scene.EnterSystem(target.ID, function (error, entered) {
				if (error) reject(error);
				else resolve(entered);
			});

			waitFor(function () {
				frames(scene, 1);

				return scene.GalaxyEntered() === target.ID;
			}, 20000).catch(reject);
		});

		expect(Elemenx.Service('SystemData').Objects(Elemenx.Service('SystemData').DataOf(key), key)[0].Traits.Cluster.Type).toBe('globular');
	}, 90000);

	/*
	 * Regression: seen from inside its disc its rays crossed its thin layers in long steps, a flat cut with a hard bright
	 * line and streaks down it. Inside, it is the band of it across the sky (a sky of SceneCosmos round its pole, its bulge
	 * towards its middle), its rays not drawn; above its disc its rays again.
	 */
	it('shows the band of it across the sky from inside its disc, its bulge towards its middle, and its rays from above it', async function () {
		var made = await mount({Seed: 'contract', Radius: 50000});
		var scene = made.Scene;
		var engine = scene.Engine();
		var state = engine.Galaxy;
		var cubeOf = engine.CosmosCubeOf;
		var asked = [];
		var volumes = 0;
		var bands = 0;
		var draw = engine.Renderer.Draw;

		baked(scene);

		engine.CosmosCubeOf = function (given, key, size) {
			asked.push({Given: given, Key: key, Size: size});

			return cubeOf.apply(this, arguments);
		};

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uSteps !== undefined)
				volumes++;

			if (uniforms && uniforms.uCube !== undefined && uniforms.uStrength !== undefined)
				bands++;

			return draw.apply(this, arguments);
		};

		try {
			/* In its plane, at 20 000 ly from its middle along x. */
			scene.SetGalaxyView({Target: [20000, 0, 0], Distance: 300, Pitch: 0.05, Yaw: 1.5});

			await waitFor(function () {
				frames(scene, 1);

				return state.Inside > 0.99;
			}, 30000);

			expect(asked[0].Given).toMatchObject({Kind: 'galaxy', Pole: [0, 1, 0]});
			expect(asked[0].Given.Middle[0]).toBeLessThan(-0.99);
			expect(asked[0].Size).toBe(512);

			volumes = 0;
			bands = 0;

			scene.SetGalaxyView({Target: [20000, 0, 0], Distance: 300, Pitch: 0.06, Yaw: 1.7});

			frames(scene, 3);

			expect(bands).toBeGreaterThan(0);
			expect(volumes).toBe(0);

			/* High over its plane: its rays, no band. */
			scene.SetGalaxyView({Target: [20000, 0, 0], Distance: 60000, Pitch: 1.2, Yaw: 1.5});

			frames(scene, 3);

			expect(state.Inside).toBe(0);
			expect(volumes).toBeGreaterThan(0);
		}
		finally {
			engine.CosmosCubeOf = cubeOf;
			engine.Renderer.Draw = draw;
		}
	}, 90000);

	/* Regression (load): the galaxy came after the view was set (no frame between) and put the view back over all of it. */
	it('keeps a view set before its galaxy came', async function () {
		var made = await mount({Seed: 'contract-late'});
		var scene = made.Scene;

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		expect(scene.GalaxyView().Distance).toBe(200);
		expect(scene.GalaxyStars().length).toBeGreaterThan(1000);
	});

	/* Regression: a press took the nearest of all the stars round, the faint ones not drawn too: another star than the one pressed. */
	it('picks a star as it is seen: never one too faint to be drawn, the bright one under the pointer', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var state = scene.Engine().Galaxy;
		var view;
		var stars;
		var faint;
		var bright;
		var at;

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 60, Pitch: 0.2});

		frames(scene, 2);

		view = state.Matrices();
		stars = scene.GalaxyStars().map(function (star) {
			return {Star: star, Seen: state.Brightness(star, star.Place, view.Eye), At: state.ScreenOf(view.Matrix, star.Place)};
		}).filter(function (one) {
			return one.At && one.At[0] > 10 && one.At[1] > 10 && one.At[0] < scene.Scene().Width - 10 && one.At[1] < scene.Scene().Height - 10;
		});

		faint = stars.filter(function (one) {
			return one.Seen < 0.05;
		}).slice(0, 20);
		bright = stars.sort(function (a, b) {
			return b.Seen - a.Seen;
		})[0];

		expect(faint.length).toBeGreaterThan(0);

		faint.forEach(function (one) {
			expect(state.Pick(one.At[0], one.At[1])).not.toBe(one.Star.ID);
		});

		at = state.Pick(bright.At[0] + 2, bright.At[1] - 2);

		expect(at).toBe(bright.Star.ID);
	});

	/*
	 * Regression: a star stayed a point however near: its black holes, its wormholes could not be seen nor picked. Near it the
	 * bodies of its system are marked where they are, the star picked is marked with its ID and where it is, and nearer the
	 * scene goes into its system by itself.
	 */
	it('marks the star picked with its ID and where it is, the bodies of its system near it, and goes into its system as the view comes to it', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var state = scene.Engine().Galaxy;
		var star;
		var marks;
		var text;

		scene.SetGalaxyView({Target: [27000, 0, 0], Distance: 200});

		frames(scene, 2);

		star = scene.GalaxyStars()[0];

		scene.GalaxyFocus(star.ID);

		frames(scene, 60);

		marks = scene.$Element().querySelector('.elemenx-scene-galaxy-marks');
		text = marks.textContent;

		expect(text).toContain(star.ID);
		expect(text).toContain(' ly');

		/* Near it (nearer than its system opens on the screen, not yet as near as it goes into it): its bodies marked by their names, each where its orbit puts it. */
		scene.SetGalaxyView({Target: scene.GalaxyView().Target, Distance: 5e-4});

		state.Follow = star.ID;

		frames(scene, 2);

		expect(marks.querySelectorAll('.elemenx-scene-galaxy-mark.body').length).toBeGreaterThan(0);

		/* Nearer than its system is wide: the scene goes into it. */
		scene.SetGalaxyView({Target: scene.GalaxyView().Target, Distance: 0.0001});

		state.Follow = star.ID;

		frames(scene, 4);

		expect(scene.Setting).toBe('space');
		expect(scene.GalaxyEntered()).toBe(star.ID);
		expect(marks.hidden).toBe(true);
	});

	/*
	 * Regression: what of it lies in its plane was computed again at each step of each ray, and a fine round was drawn whole
	 * at a frame: the card busy for a second and more at each stop of the view, the computer stuck meanwhile.
	 */
	it('makes the picture of its plane once a few rows at a frame, its rays read it, and draws a fine round a band of rows at a frame', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var state = engine.Galaxy;
		var draw = engine.DrawReady;
		var planes = 0;
		var most = 0;
		var volumes = [];
		var fine;
		var bands = 0;

		engine.DrawReady = function (mesh, program, values) {
			if (program === state.Programs.Plane)
				planes++;

			if (program === state.Programs.Volume)
				volumes.push(values);

			return draw.apply(this, arguments);
		};

		while (!(state.PlaneSize && state.PlaneRow >= state.PlaneSize) && bands < 80) {
			planes = 0;

			frames(scene, 1);

			most = Math.max(most, planes);

			bands++;
		}

		expect(state.PlaneRow).toBe(state.PlaneSize);
		expect(bands).toBeGreaterThan(1);
		expect(most).toBeLessThan(3);

		/* Done once: no more of it while the shape stays. */
		planes = 0;

		frames(scene, 2);

		expect(planes).toBe(0);
		expect(volumes[volumes.length - 1].uBaked).toBe(1);
		expect(volumes[volumes.length - 1].uPlaneA).toBe(state.PlaneA.Textures[0]);

		/* A small budget a frame: a fine round takes several frames, one band of rows each. */
		state.StepBudget = 2e4;

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 60000, Pitch: 0.5});

		frames(scene, 1);

		fine = state.Fine;
		volumes = [];

		for (bands = 0; bands < 4; bands++)
			frames(scene, 1);

		expect(volumes.length).toBe(4);
		expect(state.Fine).toBe(fine);
		expect(state.Band).toBeGreaterThan(0);

		engine.DrawReady = draw;
	});

	/* Regression: its rows were counted while the card was still making the program of its plane, and its plane stayed empty. */
	it('makes the rows of its plane only once their program is made', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var state = engine.Galaxy;
		var draw = engine.DrawReady;
		var making = true;
		var drawn = 0;
		var before;

		/* As a looping scene does while the card makes the program: no draw, false. */
		engine.DrawReady = function (mesh, program) {
			if (program !== state.Programs.Plane) return draw.apply(this, arguments);

			if (making)
				return false;

			drawn++;

			return draw.apply(this, arguments);
		};

		/* What the loop of the scene drew on its own before (while mounted) stays as it was. */
		before = state.PlaneRow || 0;

		frames(scene, 4);

		expect(state.PlaneRow || 0).toBe(before);
		expect(drawn).toBe(0);

		making = false;

		baked(scene);

		expect(state.PlaneRow).toBe(state.PlaneSize);
		expect(drawn).toBeGreaterThan(1);

		engine.DrawReady = draw;
	});

	/* Regression: its fine rounds were counted while the card still made the program of its rays, and the galaxy stayed black till the view moved. */
	it('counts no round of its rays the card did not draw, and draws them all once it can', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var state = engine.Galaxy;
		var draw = engine.DrawReady;
		var making = true;

		engine.DrawReady = function (mesh, program) {
			if (making && program === state.Programs.Volume) return false;

			return draw.apply(this, arguments);
		};

		baked(scene);

		/* A view of its own: what the loop of the scene drew for the one before (while mounted) counts no more. */
		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 70000, Pitch: 0.6});

		frames(scene, 6);

		expect(state.Fine || 0).toBe(0);
		expect(state.Drawn).toBe('');

		making = false;

		frames(scene, 40);

		expect(state.Fine).toBe(6);

		engine.DrawReady = draw;
	});

	/* Regression: seen from inside its disc, the stars round the eye were dimmed by all the dust of the ray and none of its light near the eye was glow: a black floor. */
	it('lays the stars round the eye over its light and dust, not dimmed by them, and leaves a part of its light near the eye as glow', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var state = engine.Galaxy;
		var draw = engine.DrawReady;
		var front = false;
		var near = 0;
		var volume;
		var picture;
		var begin;
		var end;

		baked(scene);

		scene.SetGalaxyView({Target: [16000, 50, 4000], Distance: 1500, Pitch: 0.1});

		frames(scene, 1);

		begin = state.Front.Begin;
		end = state.Front.End;

		state.Front.Begin = function () {
			front = true;

			return begin.apply(this, arguments);
		};

		state.Front.End = function () {
			front = false;

			return end.apply(this, arguments);
		};

		engine.DrawReady = function (mesh, program, values) {
			if (program === state.Programs.Field && front)
				near++;

			if (program === state.Programs.Volume)
				volume = values;

			if (program === state.Programs.Picture)
				picture = values;

			return draw.apply(this, arguments);
		};

		scene.SetGalaxyView({Target: [16000, 50, 4000], Distance: 1500, Pitch: 0.12});

		frames(scene, 1);

		expect(near).toBeGreaterThan(0);
		expect(volume.uNearKeep).toBeGreaterThan(0);
		expect(volume.uNearKeep).toBeLessThan(1);
		expect(picture.uFront).toBe(state.Front.Textures[0]);
		expect(scene.GalaxyVolumeShader('', '')).toContain('mix(uNearKeep, 1.0');

		/* Regression: seen from near, the edges of the texels of its plane stood across the sky as bands: read smoothly there. */
		expect(scene.GalaxyVolumeShader('', '')).toContain('smoothRead(uPlaneA, uv)');

		engine.DrawReady = draw;
		state.Front.Begin = begin;
		state.Front.End = end;
	});

	/* Regression: the steps of each ray began at a place of the pixel of the screen, and the grain of its stars stayed on the screen while the view went round. */
	it('begins the steps of its rays at a place of the galaxy, the same for all while the view moves and with no grain then', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var draw = engine.DrawReady;
		var volumes = [];
		var source = scene.GalaxyVolumeShader('', '');

		expect(source).not.toContain('dot(gl_FragCoord');
		expect(source).toContain('mix(0.5, jitter, uGrain)');

		engine.DrawReady = function (mesh, program, values) {
			if (program === engine.Galaxy.Programs.Volume)
				volumes.push(values.uGrain);

			return draw.apply(this, arguments);
		};

		baked(scene);

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 60000, Pitch: 0.5});

		frames(scene, 1);

		expect(volumes[volumes.length - 1]).toBe(0);

		frames(scene, 2);

		expect(volumes[volumes.length - 1]).toBe(1);

		engine.DrawReady = draw;
	});

	/* Regression: all of it was drawn again at every frame however still the view stood, and the card was busy all the time. */
	it('draws nothing while the view stands still: coarse while it moves, fine a few rounds when it stops, then the picture stays', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var draw = engine.DrawReady;
		var steps = [];
		var count = 0;
		var i;

		engine.DrawReady = function (mesh, program, values) {
			count++;

			if (program === engine.Galaxy.Programs.Volume)
				steps.push(values.uSteps);

			return draw.apply(this, arguments);
		};

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 70000, Pitch: 0.5});

		frames(scene, 1);

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 60000, Pitch: 0.5});

		frames(scene, 1);
		frames(scene, 40);

		expect(steps[0]).toBeLessThan(steps[steps.length - 1]);
		expect(steps.length).toBeGreaterThan(2);
		expect(steps.length).toBeLessThan(12);

		/* The eye takes to its light as the card's measure comes back (later under load): frames with time between them. */
		for (i = 0; i < 60; i++) {
			frames(scene, 2);

			await new Promise(function (resolve) {
				setTimeout(resolve, 15);
			});
		}

		count = 0;

		frames(scene, 20);

		engine.DrawReady = draw;

		expect(count).toBe(0);
	});

	/*
	 * Regression: near its middle and inside it, it was a mist (one smooth light, white over all of its bulge): the stars round
	 * the eye are drawn one by one there, and the eye takes its light as bright as it is.
	 */
	it('draws the stars round the eye one by one and takes its light as bright as it is: its middle no white mist', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var engine = scene.Engine();
		var state = engine.Galaxy;
		var draw = engine.DrawReady;
		var cells = [];
		var far;

		engine.DrawReady = function (mesh, program, values) {
			if (program === state.Programs.Field)
				cells.push(values.uCell);

			return draw.apply(this, arguments);
		};

		/* What the card measured is read back a frame or so later, when it is done: the frames come with time between them. */
		async function settle () {
			var i;

			for (i = 0; i < 40; i++) {
				frames(scene, 2);

				await new Promise(function (resolve) {
					setTimeout(resolve, 15);
				});
			}
		}

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 130000, Pitch: 0.8});

		await settle();

		far = state.Taken;

		cells.length = 0;

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 200, Pitch: 0.3});

		await settle();

		engine.DrawReady = draw;

		expect(cells.length).toBeGreaterThan(0);
		expect(Math.min.apply(null, cells)).toBeLessThan(1);
		/* Inside its bulge the light is many times brighter: the eye takes it darker. */
		expect(state.Taken).toBeLessThan(far);
	});

	it('flies to its black hole and keeps to it, marks the stars that go round it close, and goes into its system', async function () {
		var made = await mount({Seed: 'contract'});
		var scene = made.Scene;
		var state = scene.Engine().Galaxy;
		var marks;

		scene.SetGalaxyView({Target: [0, 0, 0], Distance: 40});

		frames(scene, 2);

		scene.GalaxyFocus('');

		frames(scene, 60);

		expect(state.Follow).toBe('centre');
		expect(scene.GalaxyPicked()).toBe('');

		state.Distance = 1;

		frames(scene, 2);

		marks = scene.$Element().querySelector('.elemenx-scene-galaxy-marks');

		expect(marks.querySelectorAll('.elemenx-scene-galaxy-mark.body').length).toBeGreaterThan(10);
		expect(marks.textContent).toContain('S1');

		state.Distance = 0.05;

		frames(scene, 4);

		expect(scene.Setting).toBe('space');
		expect(scene.GalaxyEntered()).toBe('centre');
		expect(scene.Get('hole').Kind).toBe('blackhole');
	});
});
