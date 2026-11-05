import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];
var PLANET = {Seed: 'terra', Ocean: 0.5, LocationSize: 1, Markers: [{ID: 'base', Name: 'Base Alpha', Latitude: 18, Longitude: 32}]};

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('LandingHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Background="false" (ready)="Ready">' +
		'<SceneObject ID="sun" Kind="star"><SceneObject ID="terra" Kind="planet" Surface-Type="terran" [surface-planet]="Planet" Radius="6371" Distance="1" Day="24" /></SceneObject>' +
	'</Scene></div>', Planet: PLANET, Ready: function (space) {
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
		 * it looked at its belly from under it, and a drag up and down went the other way than round a ship in space. It is
		 * behind and over the ship in its own axes, and a drag down raises it.
		 */
		function over () {
			var axes = inner.Surface.ShipAxes;
			var off = [0, 1, 2].map(function (i) {
				return inner.Surface.Eye[i] - inner.Surface.ShipAt[i];
			});

			return {Up: off[0] * axes.Up[0] + off[1] * axes.Up[1] + off[2] * axes.Up[2], Ahead: off[0] * axes.Ahead[0] + off[1] * axes.Ahead[1] + off[2] * axes.Ahead[2]};
		}

		frames(40);

		var seen = over();

		expect(seen.Up).toBeGreaterThan(0);
		expect(seen.Ahead).toBeLessThan(0);
		expect(inner.Surface.ViewUp[0] * inner.Surface.ShipAxes.Up[0] + inner.Surface.ViewUp[1] * inner.Surface.ShipAxes.Up[1] + inner.Surface.ViewUp[2] * inner.Surface.ShipAxes.Up[2]).toBeGreaterThan(0.95);

		inner.Surface.Pitch = -0.3;

		frames(40);

		expect(over().Up / Math.hypot(over().Up, over().Ahead)).toBeGreaterThan(seen.Up / Math.hypot(seen.Up, seen.Ahead) + 0.2);

		inner.Surface.Pitch = 0.22;

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
		expect(hero.Hidden).toBe(false);
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

		frames(3);

		for (i = 0; i < 3; i++)
			expect(hero.World[i]).toBeCloseTo(terra.World[i] + hero.Ship.At[i], 6);

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
});
