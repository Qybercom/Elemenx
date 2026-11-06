import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];
var PLANET = {Seed: 'terra', Ocean: 0.5, LocationSize: 1, Markers: [{ID: 'base', Name: 'Base Alpha', Latitude: 18, Longitude: 32}]};

async function mount (planet, moons) {
	var ready = null;
	var component = Elemenx.Component(unique('LandingHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Background="false" (ready)="Ready">' +
		'<SceneObject ID="sun" Kind="star"><SceneObject ID="terra" Kind="planet" Surface-Type="terran" [surface-planet]="Planet" Radius="6371" Distance="1" Day="24">' + (moons || '') + '</SceneObject></SceneObject>' +
	'</Scene></div>', Planet: planet || PLANET, Ready: function (space) {
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

describe('Contract: SceneLanding, a ship that comes down to a planet and goes up to its orbit by itself', function () {
	/*
	 * Regression: from space a planet of ScenePlanet showed the lands of the noise of its look, not its own: the continents
	 * changed under a ship coming down. Its ground is a cube of the lands of its globe (ScenePlanet.Face), coarse, then finer.
	 */
	it('draws a planet of ScenePlanet from space of the lands of its globe', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 1000;
		var options = Object.assign({Radius: 6371}, PLANET);
		var face;
		var reader;
		var pixel = new Uint8Array(4);

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return inner.Baked.terra && inner.Baked.terra.Painted === 256;
		}, 30000);

		face = Elemenx.Service('ScenePlanet').Face(options, 2, 256, 100, 1);
		reader = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, reader);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, inner.Baked.terra.Ground.Handle, 0);
		gl.readPixels(37, 100, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(reader);

		expect(inner.Baked.terra.Ground.Size).toBe(256);
		expect(Array.from(pixel)).toEqual(Array.from(face.Data.slice(37 * 4, 37 * 4 + 4)));
	}, 60000);

	/*
	 * Regression: a globe of ScenePlanet showed the noise of its look first, then a coarse picture of its lands, then the
	 * fine one: it jumped twice. The scene starts behind a veil, and the globe is drawn only when all of it
	 * is painted.
	 */
	it('starts behind a veil until the globe of its planet is all painted, then shows it at once', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();

		expect(inner.Preparing).toBe(true);
		expect(engine.Waiting()).toBeGreaterThan(0);

		inner.Loop.Start();

		await waitFor(function () {
			return scene.Veiled === 1;
		}, 4000);

		await waitFor(function () {
			return !inner.Preparing;
		}, 30000);

		/* Then all of the globe was there. */
		expect(inner.Baked.terra.Painted).toBe(256);
		expect(engine.Waiting()).toBe(0);

		await waitFor(function () {
			return scene.Veiled === 0;
		}, 4000);

		inner.Loop.Stop();
	}, 60000);

	/* The loading tells how far it came, stage by stage, never back; the veil goes when all is made (prepared). */
	it('tells its loading stage by stage, never back, and that it is prepared; nothing shows over its veil', async function () {
		var parts = [];
		var stages = [];
		var prepared = [];
		var scene = await mount();
		var inner = scene.Scene();

		scene.$On('loading', function (event) {
			parts.push(event.Part);
			stages.push(event.Stage);
		});
		scene.$On('prepared', function (event) {
			prepared.push(event.First);
		});

		/* Regression: the bar not made yet when the scene was made was taken for something of the slot loading, and never showed. */
		expect(scene.LoadingOwn).toBe(false);

		/* Over the veil only the bar: what else is in the scene is under it. */
		var veil = getComputedStyle(scene.$Element().querySelector('.elemenx-scene-loading')).zIndex;

		expect(Number(veil)).toBeGreaterThan(4);

		inner.Loop.Start();

		/* Prepared, and the frame after it telling the loading is over. */
		await waitFor(function () {
			return prepared.length > 0 && stages[stages.length - 1] === '';
		}, 30000);

		inner.Loop.Stop();

		expect(prepared).toEqual([true]);

		stages.forEach(function (stage) {
			expect(['programs', 'models', 'rivers', 'globes', 'view', '']).toContain(stage);
		});

		expect(stages[stages.length - 1]).toBe('');
		expect(parts[parts.length - 1]).toBe(100);

		for (var i = 1; i < parts.length - 1; i++)
			expect(parts[i]).toBeGreaterThanOrEqual(parts[i - 1]);
	}, 60000);

	/* A globe painted once is kept in the browser: Preload paints it before, and a scene of that planet has it at once. */
	it('preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once', async function () {
		var planet = {Seed: 'kept-' + Math.random().toString(36).slice(2, 7), Ocean: 0.4};
		var scene = await mount();
		var result = await new Promise(function (done) {
			scene.Preload([{Planet: planet, Radius: 6371}], function (error, made) {
				done({Error: error, Made: made});
			});
		});
		var wrong = await new Promise(function (done) {
			scene.Preload([{Nothing: true}], function (error) {
				done(error);
			});
		});
		var other;
		var inner;

		expect(result.Error).toBe(null);
		expect(result.Made.Done).toBe(1);
		expect(wrong).toBeInstanceOf(Error);

		other = await mount(planet);
		inner = other.Scene();

		/* No strip of it painted by a worker: the whole of it came from the store. */
		await waitFor(function () {
			inner.Rest = 0;
			inner.Looping = true;

			other.Engine().Frame(performance.now());

			inner.Looping = false;

			return inner.Baked.terra && inner.Baked.terra.Painted === 256;
		}, 10000);

		expect(inner.Baked.terra.Strips).toBe(24);
	}, 60000);

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneWorld', 'service:SceneLocations', 'service:ScenePlanet']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('flies down from space to a marker through the air, sets down in the location of the point, and goes up to a low orbit', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var phases = [];
		var located = [];
		var hero;
		var terra;
		var to;
		var high;
		var i;

		/* Steps of a tenth of a second, not drawn (a frame drawn is told apart). */
		function frames (count, until) {
			for (var step = 0; step < count && !(until && until()); step++) {
				inner.Rest = 0;

				engine.Frame(now += 100, true);
			}
		}

		function phased (name) {
			return function () {
				return phases.indexOf(name) >= 0;
			};
		}

		scene.$On('landing', function (event) {
			phases.push(event.Phase);
		});
		scene.$On('location', function (event) {
			located.push(event.ID);
		});

		frames(2);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Pace: 120, Hover: 15, Climb: 60, Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 3], Facing: [0, 0, 1], Length: 30}});
		scene.Control('me');

		frames(3);

		hero = inner.Objects.me;
		terra = inner.Objects.terra;

		/* Near a body it can come down on, the command of the scene offers it, with the markers of the body. */
		expect(hero.Traits.Entry).toBeTruthy();
		expect(hero.Traits.Flight).toBeTruthy();
		expect(scene.ShipCan).toBe('land');

		await tick(20);

		scene.LandingOpened();

		await tick(20);

		/* Each marker says whether it is day there now. */
		var item = scene.$Element().querySelector('.elemenx-scene-landing-item[data-marker="base"]');

		expect(item.firstChild.textContent).toBe('Base Alpha');
		expect(item.querySelector('.elemenx-scene-landing-time').textContent).toMatch(/^(day|night|день|ночь)$/);
		expect(scene.Land('me', {Marker: 'nowhere'})).toBe(false);
		expect(scene.Land('me', {Marker: 'base'})).toBe(true);
		expect(scene.LandingOpen).toBe(false);

		/* Over the surface: the landing is the ship's, the scene has no visit of its own. */
		frames(200, function () {
			return !!inner.Surface;
		});

		expect(inner.Surface.Ship).toBe('me');
		expect(scene.LandedOn).toBe('');

		/* Drawn over the surface: the ship where it flies, in kilometres, its own size. */
		engine.Frame(now += 100);

		expect(inner.Surface.ShipSize).toBeCloseTo(0.03, 9);
		expect(inner.SurfaceLists && Object.keys(inner.SurfaceLists).length).toBeGreaterThan(0);

		/*
		 * Regression: the view over the surface went by the vertical of the ground while the ship went nose up through the air:
		 * it looked at its belly from under it; then it was a view of its own, eased, that the mouse barely moved, and it
		 * jumped where the ship came into the air. It is the view round a ship in space: behind and over it in its axes, the
		 * Yaw and the Pitch of the scene (a drag) turn it at once.
		 */
		function over () {
			var axes = inner.Surface.ShipAxes;
			var off = [0, 1, 2].map(function (i) {
				return inner.Surface.Eye[i] - inner.Surface.ShipAt[i];
			});

			return {Up: off[0] * axes.Up[0] + off[1] * axes.Up[1] + off[2] * axes.Up[2], Ahead: off[0] * axes.Ahead[0] + off[1] * axes.Ahead[1] + off[2] * axes.Ahead[2]};
		}

		frames(3);

		var seen = over();

		expect(seen.Up).toBeGreaterThan(0);
		expect(seen.Ahead).toBeLessThan(0);
		expect(inner.Surface.ViewUp[0] * inner.Surface.ShipAxes.Up[0] + inner.Surface.ViewUp[1] * inner.Surface.ShipAxes.Up[1] + inner.Surface.ViewUp[2] * inner.Surface.ShipAxes.Up[2]).toBeGreaterThan(0.9);

		var pitch = inner.Pitch;

		inner.Pitch = 0.9;

		frames(2);

		expect(over().Up / Math.hypot(over().Up, over().Ahead)).toBeGreaterThan(seen.Up / Math.hypot(seen.Up, seen.Ahead) + 0.2);

		inner.Pitch = pitch;

		frames(3000, phased('landed'));

		expect(phases.slice(0, 3)).toEqual(['transfer', 'entry', 'approach']);
		expect(phases).toContain('hover');
		expect(phases).toContain('touchdown');
		expect(phases[phases.length - 1]).toBe('landed');

		/* The location of the point is the ground now: the very cell of the planet, what is of space away. */
		expect(located).toEqual([Elemenx.Service('SceneLocations').At(Object.assign({Radius: 6371}, PLANET), 18, 32)]);
		expect(inner.Location.ID).toBe(located[0]);
		expect(inner.Ground).toBeTruthy();
		expect(inner.Surface).toBe(null);
		expect(terra.Hidden).toBe(true);
		expect(inner.Objects.sun.Hidden).toBe(true);
		expect(hero.Hidden).toBeFalsy();
		expect(hero.Size).toBe(30);

		to = inner.Location.Frame.Local([Math.cos(18 * Math.PI / 180) * Math.cos(32 * Math.PI / 180), Math.sin(18 * Math.PI / 180), -Math.cos(18 * Math.PI / 180) * Math.sin(32 * Math.PI / 180)]);

		expect(Math.hypot(hero.Flying.At[0] - to[0], hero.Flying.At[2] - to[1])).toBeLessThan(4);
		expect(hero.Flying.At[1]).toBeCloseTo(Math.max(0, inner.Ground.Field.Height(hero.Flying.At[0], hero.Flying.At[2])) + 30 * 0.15, 3);
		expect(hero.World).toEqual(hero.Flying.At);

		/* Regression: the sun of a location stood where the star was at the landing, the night never went: it goes as the body turns. */
		var lit = inner.Objects['me-sun'].Traits.Sun.Elevation;

		scene.Paused = false;

		frames(80);

		scene.Paused = true;

		expect(Math.abs(inner.Objects['me-sun'].Traits.Sun.Elevation - lit)).toBeGreaterThan(5);

		/* Drawn as in a page that runs: its slowest sky (the band of the galaxy at night) is made behind the scene. */
		inner.Looping = true;

		engine.Frame(now += 100);

		inner.Looping = false;

		/* What the location makes is never saved: it is made again of the landing. */
		expect(JSON.stringify(scene.Save().Added)).not.toContain('me-location');

		await tick(20);

		expect(scene.ShipCan).toBe('takeoff');
		expect(scene.$Element().querySelector('.elemenx-scene-landing')).not.toBe(null);

		expect(scene.TakeOff('me')).toBe(true);

		frames(3000, phased('orbit'));

		expect(phases.slice(phases.indexOf('landed'))).toEqual(['landed', 'lift', 'climb', 'ascent', 'orbit']);
		expect(inner.Location).toBe(null);
		expect(inner.Ground).toBe(null);
		expect(inner.Surface).toBe(null);
		expect(terra.Hidden).toBe(false);
		expect(hero.Landing).toBe(null);
		expect(hero.Values.Vehicle.Around).toBe('terra');

		/* At its parking orbit: 400 km over the ground, as large as the body is drawn. */
		high = terra.Size * (terra.Radius + 400) / terra.Radius;

		expect(Math.hypot(hero.Ship.At[0], hero.Ship.At[1], hero.Ship.At[2]) / high).toBeGreaterThan(0.99);
		expect(Math.hypot(hero.Ship.At[0], hero.Ship.At[1], hero.Ship.At[2]) / high).toBeLessThan(1.02);

		/* Out of the air as fast as it went: it goes on in space round the body (a frame between two steps of its own lags a little). */
		expect(Math.hypot(hero.Ship.Way[0], hero.Ship.Way[1], hero.Ship.Way[2])).toBeGreaterThan(0);

		frames(3);

		for (i = 0; i < 3; i++)
			expect(Math.abs(hero.World[i] - terra.World[i] - hero.Ship.At[i])).toBeLessThan(Math.hypot(hero.Ship.Way[0], hero.Ship.Way[1], hero.Ship.Way[2]) * 0.1);

		expect(scene.ShipCan).toBe('land');
	}, 120000);

	/*
	 * Regression: a point of the sea had a location of its bed with no water over it (Water 0 of the step Planet): the ship
	 * set down on the bed a kilometre and more down, the view stayed over the sea level, and the ship was a dot far under it.
	 */
	it('sets down on the sea of a point of the sea, the water of the location at its level 0, the view near the ship', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var planets = Elemenx.Service('ScenePlanet');
		var planet = planets.Planet(Object.assign({Radius: 6371}, PLANET));
		var sea = null;
		var landed = false;
		var hero;
		var field;
		var i;

		for (i = 0; i < 400 && !sea; i++) {
			var latitude = (i % 20) * 7 - 66;
			var longitude = Math.floor(i / 20) * 17 - 170;
			if (planet.Sample(planets.Direction(latitude, longitude)).Elevation < -800)
				sea = [latitude, longitude];
		}

		expect(sea).not.toBe(null);

		scene.$On('landing', function (event) {
			landed = landed || event.Phase === 'landed';
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Pace: 120, Hover: 15, Climb: 60, Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 3], Facing: [0, 0, 1], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		expect(scene.Land('me', {Latitude: sea[0], Longitude: sea[1]})).toBe(true);

		for (i = 0; i < 3000 && !landed; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		hero = inner.Objects.me;
		field = inner.Ground.Field;

		expect(landed).toBe(true);
		expect(field.Water).toBeGreaterThan(0);
		expect(field.Height(hero.Flying.At[0], hero.Flying.At[2])).toBeLessThan(-500);
		expect(hero.Flying.At[1]).toBeCloseTo(30 * 0.15, 3);

		for (i = 0; i < 20; i++)
			engine.Frame(now += 100, true);

		expect(Math.hypot(inner.Camera.Position[0] - hero.World[0], inner.Camera.Position[1] - hero.World[1], inner.Camera.Position[2] - hero.World[2])).toBeLessThan(30 * 6);
		expect(scene.ShipCan).toBe('takeoff');
	}, 120000);

	/*
	 * A ship flown out of its location goes on into the one beside, the very point of the planet it was over; through a
	 * passage of the mode passage, behind a veil. Past the ground of the location the far ground of the planet is drawn.
	 */
	it('flies on into the location beside at the same point of the planet, through a passage behind a veil, the far ground of the planet past it', async function () {
		var locations = Elemenx.Service('SceneLocations');
		var options = Object.assign({Radius: 6371}, PLANET);
		var id = locations.At(options, 18, 32);
		var planet = locations.Passage(locations.Tell(options, id, {Beyond: 'cliff'}), id, {Side: 0, At: 0.5, Kind: 'gate', Width: 12, Mode: 'passage'});
		var scene;
		var inner;
		var engine;
		var now = performance.now() + 1000;
		var landed = false;
		var located = [];
		var veils = [];
		var hero;
		var air;
		var side;
		var last;
		var i;

		delete planet.Radius;

		scene = await mount(planet);
		inner = scene.Scene();
		engine = scene.Engine();

		scene.$On('landing', function (event) {
			landed = landed || event.Phase === 'landed';
		});
		scene.$On('location', function (event) {
			located.push({ID: event.ID, Veiled: inner.Passing || 0});
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Pace: 120, Hover: 15, Climb: 60, Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 3], Facing: [0, 0, 1], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		expect(scene.Land('me', {Marker: 'base'})).toBe(true);

		for (i = 0; i < 3000 && !landed; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		/* On its way down it came in over the outline and kept to the location of its point. */
		expect(landed).toBe(true);
		expect(inner.Location.ID).toBe(id);
		expect(located).toEqual([{ID: id, Veiled: 0}]);

		/* The surface it came over is the far ground round the location, drawn past it. */
		expect(inner.Horizon.ID).toBe('terra');

		inner.Looping = true;
		inner.Rest = 0;

		engine.Frame(now += 100);

		inner.Looping = false;

		expect(Object.keys(inner.Horizon.Nodes).length).toBeGreaterThan(0);

		/* Up and on by hand to the passage on its side 0. */
		hero = inner.Objects.me;
		air = hero.Flying;
		side = inner.Location.Place.Sides[0];
		air.Landed = false;
		air.Plan = null;
		air.At[1] += 120;
		air.Heading = Math.atan2(-((side[0] + side[2]) / 2 - air.At[0]), -((side[1] + side[3]) / 2 - air.At[2]));
		air.Throttle = 1;

		for (i = 0; i < 600 && located.length < 3; i++) {
			last = {Way: inner.Location.Frame.Direction(air.At[0], air.At[2]), ID: inner.Location.ID};
			inner.Rest = 0;

			engine.Frame(now += 100, true);

			air = hero.Flying;

			veils.push(inner.Passing || 0);

			/* Each step: the point of the planet under it goes on from where it was, in whatever location. */
			var way = inner.Location.Frame.Direction(air.At[0], air.At[2]);

			expect(Math.hypot(way[0] - last.Way[0], way[1] - last.Way[1], way[2] - last.Way[2]) * 6371000).toBeLessThan(40);
		}

		/* Through the passage behind the veil, then on without one into the next. */
		expect(located.length).toBeGreaterThanOrEqual(3);
		expect(located[1].ID).toBe(locations.Location(planet, id).Sides[0].To);
		expect(located[1].Veiled).toBe(1);
		expect(located[2].Veiled).toBe(0);
		expect(Math.max.apply(null, veils)).toBe(1);
		expect(veils[veils.length - 1]).toBe(0);
		expect(inner.Ground.Field.Border).toBeTruthy();
	}, 120000);

	/*
	 * Regression: the way down went in steps (to a stop at a parking orbit, then a straight dive, then a sharp turn level),
	 * the ship and the view jumped where it came into the air, and the view could not be turned on the way down. One curve
	 * from space into the air at the speed it goes on with, one glide down, the ship and the view going on as they were.
	 */
	it('comes down in one smooth way: no stop, no step, the ship and the view going on where it comes into the air', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var math = Elemenx.Service('Math');
		var now = performance.now() + 1000;
		var phases = [];
		var trace = [];
		var terra;
		var hero;
		var i;

		scene.$On('landing', function (event) {
			phases.push(event.Phase);
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 3], Facing: [0, 0, 1], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		hero = inner.Objects.me;
		terra = inner.Objects.terra;

		expect(scene.Land('me', {Marker: 'base'})).toBe(true);

		/* Where the ship is (km, in the frame of the body) and where the view looks at it from, each frame. */
		function sample () {
			var turn = math.Invert(terra.Turn);
			var scale = terra.Size / terra.Radius;

			if (inner.Surface && inner.Surface.ShipAt)
				return {Air: true, At: inner.Surface.ShipAt.slice(), Eye: math.Vectors.Normalize(math.Vectors.Subtract(inner.Surface.Eye, inner.Surface.ShipAt)), Height: hero.Landing.Height};

			return {Air: false, At: math.Vectors.Scale(math.Apply(turn, math.Vectors.Subtract(hero.World, terra.World)), 1 / scale), Eye: math.Vectors.Normalize(math.Apply(turn, math.Vectors.Subtract(inner.Camera.Position, hero.World)))};
		}

		for (i = 0; i < 3000 && !inner.Location; i++) {
			inner.Rest = 0;

			engine.Frame(now += 50, true);

			trace.push(sample());
		}

		expect(phases.slice(0, 3)).toEqual(['transfer', 'entry', 'approach']);
		expect(inner.Location).toBeTruthy();

		var into = trace.findIndex(function (one) {
			return one.Air;
		});
		var before = trace[into - 1];
		var after = trace[into];
		var step = math.Vectors.Distance(trace[into - 2].At, before.At);

		/* Into the air: the ship goes on from where it was as fast as it went, the view from where it looked. */
		expect(math.Vectors.Distance(before.At, after.At)).toBeLessThan(step * 1.6);
		expect(math.Vectors.Dot(before.Eye, after.Eye)).toBeGreaterThan(Math.cos(10 * Math.PI / 180));

		/* In the air: always down, never a stretch level or up, never a jump of its pace. */
		var air = trace.slice(into).filter(function (one) {
			return one.Air;
		});

		for (i = 2; i < air.length; i++) {
			var was = math.Vectors.Distance(air[i - 2].At, air[i - 1].At);
			var is = math.Vectors.Distance(air[i - 1].At, air[i].At);

			expect(air[i].Height).toBeLessThan(air[i - 1].Height + 1e-6);
			expect(Math.abs(is - was)).toBeLessThan(Math.max(was, is) * 0.2 + 1e-6);
		}
	}, 120000);

	/* Flown by hand down to the top of the air, the ship comes into it under the player's hand: the command can take it down then. */
	it('comes into the air flown by hand, the player flying on, and its plan can take it down from there', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var phases = [];
		var hero;
		var terra;
		var i;

		scene.$On('landing', function (event) {
			phases.push(event.Phase);
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 1.03], Facing: [0, 0, -1], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		hero = inner.Objects.me;
		terra = inner.Objects.terra;

		/* Down and on: its way toward the body. */
		hero.Ship.Throttle = 1;

		for (i = 0; i < 400 && !inner.Surface; i++) {
			inner.Rest = 0;

			engine.Frame(now += 50, true);
		}

		expect(inner.Surface && inner.Surface.Ship).toBe('me');
		expect(hero.Landing.Manual).toBe(true);
		expect(phases).toEqual(['manual']);

		await tick(20);

		expect(scene.ShipCan).toBe('land');
		expect(scene.Land('me', {Marker: 'base'})).toBe(true);
		expect(hero.Landing.Manual).toBe(false);
		expect(terra.ID).toBe('terra');
	}, 120000);

	/*
	 * Regression: in a location its sea spilled past its ground (blue bands, white foam on its edge), its sky had a moon of
	 * its own (a body with none had one, a body with one had it elsewhere), and flown in it by hand a ship could not be set
	 * down. The sea ends with the ground (the horizon has the sea past it); the moon is the body's, or none; the command
	 * Landing sets the ship down where it flies.
	 */
	it('keeps the sea of a location within its ground, has the moon of its body or none, and sets a flying ship down by the command', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var now = performance.now() + 1000;
		var phases = [];
		var bounds = [];
		var draw = renderer.Draw;
		var hero;
		var i;

		scene.$On('landing', function (event) {
			phases.push(event.Phase);
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Pace: 120, Hover: 15, Climb: 60, Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 3], Facing: [0, 0, 1], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		expect(scene.Land('me', {Marker: 'base'})).toBe(true);

		for (i = 0; i < 3000 && phases.indexOf('landed') < 0; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		hero = inner.Objects.me;

		/* Terra has no moon here: its sky none. */
		expect(inner.Objects['me-sun'].Traits.Sun.Moon).toBe(false);

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uBound)
				bounds.push(uniforms.uBound);

			return draw.apply(this, arguments);
		};

		inner.Looping = true;
		inner.Rest = 0;

		engine.Frame(now += 100);

		inner.Looping = false;
		renderer.Draw = draw;

		if (inner.Ground.Field.Water)
			expect(bounds[0]).toEqual([inner.Ground.Field.Size / 2, 1]);

		/* Up and on by hand, then the command: down where it flies. */
		hero.Flying.Landed = false;
		hero.Flying.Plan = null;
		hero.Flying.At[1] += 80;
		hero.Flying.Throttle = 0.5;

		for (i = 0; i < 20; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		await tick(20);

		expect(scene.ShipCan).toBe('land');

		scene.LandingOpened();

		phases = [];

		for (i = 0; i < 3000 && phases.indexOf('landed') < 0; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		expect(phases).toContain('landed');
		expect(hero.Flying.Landed).toBe(true);
	}, 120000);

	/* The moon of a location is the moon of its body: where it stands over it, lit by the way of the star, as large as it is seen. */
	it('has in the sky of a location the very moon of its body', async function () {
		var scene = await mount(null, '<SceneObject ID="luna" Kind="moon" Radius="1737" Distance="384400 km" />');
		var inner = scene.Scene();
		var engine = scene.Engine();
		var vectors = Elemenx.Service('Math').Vectors;
		var now = performance.now() + 1000;
		var landed = false;
		var sun;
		var luna;
		var terra;
		var way;
		var i;

		scene.$On('landing', function (event) {
			landed = landed || event.Phase === 'landed';
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Pace: 120, Hover: 15, Climb: 60, Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 3], Facing: [0, 0, 1], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		expect(scene.Land('me', {Marker: 'base'})).toBe(true);

		for (i = 0; i < 3000 && !landed; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		sun = inner.Objects['me-sun'].Traits.Sun;
		luna = inner.Objects.luna;
		terra = inner.Objects.terra;
		way = vectors.Normalize(Elemenx.Service('Math').Apply(Elemenx.Service('Math').Invert(terra.Turn), vectors.Subtract(luna.World, terra.World)));

		expect(sun.Moon).toBe(true);
		expect(sun.MoonElevation).toBeCloseTo(Math.asin(vectors.Dot(way, inner.Location.Frame.Middle)) * 180 / Math.PI, 3);
		expect(sun.MoonSize).toBeGreaterThan(0);
		expect(sun.MoonPhase).toBeGreaterThanOrEqual(0);
		expect(sun.MoonPhase).toBeLessThanOrEqual(0.5);
	}, 120000);

	/* ToOrbit: from near a body to its parking orbit, round it by itself; near it the command offers it with a hint; a key lets it go. */
	it('goes to the parking orbit of a body by the command and round it, and a key of flight lets it go', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var phases = [];
		var hero;
		var terra;
		var high;
		var radius;
		var i;

		scene.$On('landing', function (event) {
			phases.push(event.Phase);
		});

		engine.Frame(now += 100, true);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 1.2], Facing: [1, 0, 0], Length: 30}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		await tick(20);

		hero = inner.Objects.me;
		terra = inner.Objects.terra;

		/* Nearer than 2000 km over it: offered, with the hint. */
		expect(scene.ShipOrbit).toBe(true);
		expect(scene.ShipHint).toBe('orbit');
		expect(scene.ToOrbit('nobody')).toBe(false);
		expect(scene.ToOrbit('me')).toBe(true);

		for (i = 0; i < 400 && phases.indexOf('orbit') < 0; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);
		}

		expect(phases).toEqual(['transfer', 'orbit']);

		high = terra.Size * (terra.Radius + 400) / terra.Radius;

		/* Round it: 400 km over it, frame after frame, going on. */
		for (i = 0; i < 30; i++) {
			inner.Rest = 0;

			engine.Frame(now += 100, true);

			radius = Math.hypot(hero.Ship.At[0], hero.Ship.At[1], hero.Ship.At[2]);

			expect(radius / high).toBeCloseTo(1, 6);
		}

		expect(hero.Orbiting).toBeTruthy();
		expect(Math.hypot(hero.Ship.Way[0], hero.Ship.Way[1], hero.Ship.Way[2])).toBeGreaterThan(0);

		/* A key of flight: off it, as fast as it went. */
		inner.Keys.KeyW = true;

		engine.Frame(now += 100, true);

		inner.Keys.KeyW = false;

		expect(hero.Orbiting).toBe(null);
	}, 120000);

	/*
	 * Regression: near, the globe was a picture of 39 km a texel, blurred, its rivers none, its relief of no light. Near it
	 * is its very ground (as a surface is drawn: squares finer the nearer), its rivers on it.
	 */
	it('draws a planet near as its very ground, finer the nearer, its rivers on it', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var planets = Elemenx.Service('ScenePlanet');
		var now = performance.now() + 1000;
		var held;
		var rivers;
		var river;
		var point;
		var i;

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'terra', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'terra', From: [0, 0, 1.3], Facing: [-1, 0, 0], Length: 30}});
		scene.Control('me');

		await waitFor(function () {
			inner.Rest = 0;
			inner.Looping = true;

			engine.Frame(now += 100);

			inner.Looping = false;

			return inner.Globes.terra && Object.keys(inner.Globes.terra.Nodes).length > 6;
		}, 30000);

		/* Its rivers on it: the color of a point of a big one is water. */
		held = inner.Rivers.terra;
		rivers = planets.RiversOf(held.Key);
		river = rivers.filter(function (one) {
			return Math.max.apply(null, one.Flow) > 80;
		})[0];
		point = river.Points[Math.floor(river.Points.length * 0.7)];

		expect(inner.Globes.terra.Field.Color(point, 1)).toEqual([0.16, 0.34, 0.58]);

		for (i = 0; i < 3; i++)
			engine.Frame(now += 100, true);
	}, 60000);

	/*
	 * Regression: at night the globe was all dark, its settlements unseen. Its settlements are made once after its rivers
	 * (ScenePlanet.Settlements, kept as its rivers are), and their lights painted on a cube of their own, shown at night.
	 */
	it('settles a planet after its rivers, joins its towns by highways, and paints the lights of its settlements for its night side', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var planets = Elemenx.Service('ScenePlanet');
		var now = performance.now() + 1000;
		var options;
		var lights;
		var best = 0;
		var at = 0;
		var reader;
		var pixel = new Uint8Array(4);
		var k;

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return inner.Baked.terra && inner.Baked.terra.Lit && inner.Baked.terra.Lights;
		}, 40000);

		expect(inner.Towns.terra.Ready).toBe(true);
		expect(engine.PlanetOptions(inner.Objects.terra).Settlements).toBe(inner.Towns.terra.Key);
		expect(planets.TownsOf(inner.Towns.terra.Key).length).toBeGreaterThan(10);

		/* Its highways between them, made after them; its globe painted with them. */
		expect(inner.Highways.terra.Ready).toBe(true);
		expect(engine.PlanetOptions(inner.Objects.terra).Highways).toBe(inner.Highways.terra.Key);
		expect(planets.HighwaysOf(inner.Highways.terra.Key).length).toBeGreaterThan(3);

		options = engine.PlanetOptions(inner.Objects.terra);
		lights = planets.Lights(options, 4, 256, 0, 256);

		for (k = 0; k < lights.Data.length; k++) {
			if (lights.Data[k] > best) {
				best = lights.Data[k];
				at = k;
			}
		}

		reader = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, reader);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, inner.Baked.terra.Lights.Handle, 0);
		gl.readPixels(at % 256, Math.floor(at / 256), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(reader);

		expect(best).toBeGreaterThan(0);
		expect(pixel[0]).toBe(best);

		engine.Frame(now += 100, true);
	}, 60000);
});
