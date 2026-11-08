import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import { Binary, Picture } from '../glb.mjs';
import gameSceneSource from '../../libraries/ElemenxGraphics/components/Scene/Scene.js?raw';
import modelsSource from '../../libraries/ElemenxGraphics/services/SceneModels/SceneModels.js?raw';
import lightingSource from '../../libraries/ElemenxGraphics/traits/SceneLighting/SceneLighting.js?raw';
import graphicsSource from '../../libraries/ElemenxGraphics/services/Renderer/Renderer.js?raw';
import cosmosSource from '../../libraries/ElemenxGraphics/traits/SceneCosmos/SceneCosmos.js?raw';
import pageSource from '../../examples/Advanced/application/components/UIKitPage/UIKitPage.js?raw';
import effectsSource from '../../libraries/ElemenxGraphics/traits/SceneEffects/SceneEffects.js?raw';

var owned = [];

/* Where the eye of a scene is on x. */
function vectorX (inner) {
	return inner.Camera.Position[0];
}

/* A space in a box of its size, its ready event caught: the space itself. */
async function mount (template, state) {
	var ready = null;
	var component = Elemenx.Component(unique('SceneHost'), Object.assign({$Template: '<div style="width: 640px; height: 400px">' + template + '</div>', Ready: function (space) {
		ready = space;
	}}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	return {Host: component, Space: ready};
}

/* The color of a pixel of the canvas (CSS pixels from its top left), read right after a frame is drawn. */
function pixel (space, x, y) {
	var renderer = space.Engine().Renderer;
	var gl = renderer.GL;
	var data = new Uint8Array(4);

	space.Engine().Frame(performance.now());

	gl.readPixels(Math.round(x * renderer.Ratio), Math.round(renderer.Height - y * renderer.Ratio), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

	return Array.from(data);
}

function bright (color) {
	return color[0] + color[1] + color[2];
}

describe('Contract: Astronomy and Renderer, the numbers of a star system and of three dimensions', function () {
	var astronomy;
	var graphics;
	var meshes;
	var math;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Astronomy', 'service:Renderer', 'service:Meshes', 'service:Math']);

		astronomy = Elemenx.Service('Astronomy');
		graphics = Elemenx.Service('Renderer');
		meshes = Elemenx.Service('Meshes');
		math = Elemenx.Service('Math');
	});

	it('puts a body on its orbit of Kepler at a time, and describes stars and planets', function () {
		var earth = {Distance: 1, Eccentricity: 0};
		var long = {Distance: 2, Eccentricity: 0.5};
		var sun = astronomy.Star({Mass: 1});
		var described;
		var quarter;

		expect(astronomy.Period(1, 1)).toBeCloseTo(365.25, 6);
		expect(astronomy.Period(4, 1)).toBeCloseTo(365.25 * 8, 6);
		expect(astronomy.Length('384400 km')).toBeCloseTo(0.00257, 5);
		expect(astronomy.Length('1 ly')).toBeCloseTo(63241, 0);
		expect(astronomy.Length(5.2)).toBe(5.2);

		/* A circle: on the axis X at 0, a quarter of the way round a quarter of a year later. */
		expect(astronomy.Position(earth, 0, 1)[0]).toBeCloseTo(1, 9);

		quarter = astronomy.Position(earth, 365.25 / 4, 1);

		expect(quarter[0]).toBeCloseTo(0, 6);
		expect(quarter[1]).toBeCloseTo(1, 6);

		/* An ellipse: the periapsis at a(1 - e), the apoapsis half an orbit later at a(1 + e); tilted, it leaves the plane. */
		expect(Math.hypot.apply(Math, astronomy.Position(long, 0, 1))).toBeCloseTo(1, 6);
		expect(Math.hypot.apply(Math, astronomy.Position(long, astronomy.Period(2, 1) / 2, 1))).toBeCloseTo(3, 6);
		expect(Math.abs(astronomy.Position({Distance: 1, Inclination: 30}, 365.25 / 4, 1)[2])).toBeCloseTo(0.5, 6);
		expect(astronomy.Path(long, 64)).toHaveLength(64);

		/* The Sun of its mass, and the Earth of its kind and distance. */
		expect(sun.Class).toBe('G');
		expect(sun.Temperature).toBeCloseTo(5772, 0);
		expect(sun.Habitable.Inner).toBeLessThan(1);
		expect(sun.Habitable.Outer).toBeGreaterThan(1);
		expect(astronomy.Star({Mass: 0.4}).Class).toBe('M');

		described = astronomy.Describe({Kind: 'terran', Radius: 6371, Mass: 1, Orbit: {Distance: 1}}, {Star: sun, Distance: 1, Mass: 1});

		expect(described.Gravity).toBeCloseTo(9.81, 1);
		expect(described.Escape).toBeCloseTo(11.19, 1);
		expect(described.Temperature).toBeGreaterThan(250);
		expect(described.Temperature).toBeLessThan(260);
		expect(described.Period).toBeCloseTo(365.25, 3);
		expect(described.Habitable).toBe(true);
		expect(astronomy.Color(3000)).toMatch(/^#ff/);
		expect(astronomy.Color(12000)).toMatch(/ff$/);
	});

	it('makes the same system of the same seed: a star, planets by their distance, moons, rings and belts', function () {
		var first = astronomy.Generate('kepler');
		var again = astronomy.Generate('kepler');
		var other = astronomy.Generate('another seed');
		var star = first.Bodies[0];
		var light = astronomy.Star(star);
		var planets = first.Bodies.filter(function (body) {
			return body.Type === 'planet' && body.Parent === 'star';
		});

		expect(JSON.stringify(again)).toBe(JSON.stringify(first));
		expect(JSON.stringify(other)).not.toBe(JSON.stringify(first));
		expect(star.Type).toBe('star');
		expect(planets.length).toBeGreaterThanOrEqual(3);

		planets.forEach(function (planet, index) {
			if (index)
				expect(planet.Orbit.Distance).toBeGreaterThan(planets[index - 1].Orbit.Distance);

			if (planet.Kind === 'gas')
				expect(planet.Orbit.Distance).toBeGreaterThan(light.Frost);
		});

		first.Bodies.forEach(function (body) {
			if (body.Parent)
				expect(first.Bodies.some(function (each) {
					return each.ID === body.Parent;
				})).toBe(true);
		});

		expect(astronomy.Generate('kepler', {Moons: false, Belts: false}).Bodies.every(function (body) {
			return body.Type === 'star' || body.Parent === 'star' && body.Type === 'planet';
		})).toBe(true);
	});

	it('multiplies, inverts and projects matrices, and makes shapes of triangles', function () {
		var m = math.Compose([1, 2, 3], math.Rotation([0, 1, 0], 0.7), 2);
		var back = math.Multiply(math.Invert(m), m);
		var camera = graphics.Camera({Position: [0, 0, 10], Target: [0, 0, 0]});
		var sphere = meshes.Sphere({Segments: 8, Rings: 4});
		var merged = meshes.Merge([meshes.Box({}), {Geometry: meshes.Box({}), Matrix: math.Translation(2, 0, 0), Color: [1, 0, 0]}]);
		var noise = math.Noise('a');
		var value = noise.Fbm(0.3, 0.7, 1.1, 4);

		math.Identity().forEach(function (expected, index) {
			expect(back[index]).toBeCloseTo(expected, 9);
		});

		expect(math.Apply(m, [0, 0, 0])).toEqual([1, 2, 3]);
		expect(camera.Project([0, 0, 0], 200, 100)).toMatchObject({X: 100, Y: 50, Visible: true});
		expect(camera.Project([0, 0, 20], 200, 100).Visible).toBe(false);
		expect(math.Hit(camera.Ray(100, 50, 200, 100), [0, 0, 0], 1)).toBeCloseTo(8.9, 6);
		expect(math.Hit(camera.Ray(0, 0, 200, 100), [0, 0, 0], 1)).toBe(-1);

		expect(sphere.Positions.length / 3).toBe(9 * 5);
		expect(meshes.Icosphere({Detail: 1}).Indices.length / 3).toBe(80);
		expect(merged.Positions.length / 3).toBe(48);
		expect(Math.max.apply(Math, merged.Indices)).toBe(47);
		expect(merged.Colors.slice(-3)).toEqual([1, 0, 0]);
		expect(merged.Positions[24 * 3]).toBeCloseTo(2.5, 9);

		expect(value).toBeGreaterThan(0);
		expect(value).toBeLessThan(1);
		expect(math.Noise('a').Fbm(0.3, 0.7, 1.1, 4)).toBe(value);
	});

	it('turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light', function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var lathe = meshes.Lathe({Points: [[1, 0], [1, 2]], Segments: 8});
		var wedge = meshes.Wedge({Width: 2, Height: 1, Depth: 2});
		var facets = meshes.Facets(meshes.Box({}));
		var box = math.Orthographic(-2, 2, -1, 1, 0, 10);
		var i;

		expect(lathe.Indices.length).toBe(8 * 6);
		expect(lathe.Positions.length).toBe(2 * 9 * 3);

		/* The normals of a wall point outwards. */
		for (i = 0; i < lathe.Positions.length; i += 3) {
			expect(lathe.Normals[i]).toBeCloseTo(lathe.Positions[i], 5);
			expect(lathe.Normals[i + 1]).toBeCloseTo(0, 5);
			expect(lathe.Normals[i + 2]).toBeCloseTo(lathe.Positions[i + 2], 5);
		}

		/* Its slopes look up, its floor down; its base is at the bottom. */
		expect(wedge.Indices.length).toBe(8 * 3);
		expect(Math.max.apply(null, wedge.Normals.filter(function (value, index) {
			return index % 3 === 1;
		}))).toBeCloseTo(Math.SQRT1_2, 3);
		expect(Math.min.apply(null, wedge.Normals.filter(function (value, index) {
			return index % 3 === 1;
		}))).toBe(-1);
		expect(Math.min.apply(null, wedge.Positions.filter(function (value, index) {
			return index % 3 === 1;
		}))).toBe(-0.5);

		expect(facets.Positions.length).toBe(36 * 3);
		expect(facets.Normals.slice(0, 3)).toEqual(facets.Normals.slice(3, 6));

		expect(math.Apply(box, [2, 1, -10]).map(function (value) {
			return Math.round(value * 1000) / 1000;
		})).toEqual([1, 1, 1]);
		expect(math.Apply(box, [-2, -1, 0])[2]).toBeCloseTo(-1, 6);
	});

	it('has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface', function () {
		var canvas = document.createElement('canvas');
		var renderer = graphics.Create(canvas, {Antialias: false});
		var head = '#version 300 es\nprecision highp float;\n';
		var program = renderer.Program(graphics.Shaders.Quad, head + graphics.Chunks.Noise + '\nin vec2 vQuad;\nout vec4 outColor;\nvoid main() {\n\tvec3 p = vec3(vQuad * 7.3, 2.1);\n\toutColor = vec4(noise3(p), fbm3(p, 5), ridge3(p, 4), 1.0);\n}');
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var gl = renderer.GL;
		var data = new Uint8Array(64 * 64 * 4);
		var noise = math.Noise();
		var worst = 0;
		var x;
		var y;
		var at;
		var p;

		renderer.Resize(64, 64, 1);
		renderer.Draw(quad, program, {}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, data);

		for (y = 0; y < 64; y += 7) {
			for (x = 0; x < 64; x += 7) {
				at = (y * 64 + x) * 4;
				p = [((x + 0.5) / 64 * 2 - 1) * 7.3, ((y + 0.5) / 64 * 2 - 1) * 7.3, 2.1];
				worst = Math.max(worst, Math.abs(data[at] / 255 - noise.Value(p[0], p[1], p[2])), Math.abs(data[at + 1] / 255 - noise.Fbm(p[0], p[1], p[2], 5)), Math.abs(data[at + 2] / 255 - noise.Ridge(p[0], p[1], p[2], 4)));
			}
		}

		expect(worst).toBeLessThan(3 / 255);

		renderer.Destroy();
	});
});


describe('Contract: Kinds, the kinds of the objects of a game', function () {
	var kinds;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneKinds']);

		kinds = Elemenx.Service('SceneKinds');

		kinds.Define('test-body', {Traits: {Orbit: {Distance: 1, Eccentricity: 0}, Selectable: {}}, Values: {Radius: 1000}});
		kinds.Define('test-planet', {Extends: 'test-body', Traits: {Surface: {Kind: 'rocky'}}, Values: {Radius: 6371}});
		kinds.Define('test-module', {Traits: {Model: {Shape: 'box'}, Health: {Max: 100}}});
		kinds.Define('test-station', {Traits: {Orbit: {Distance: 1.8}, Team: {}}, Parts: [{ID: 'ring', Kind: 'test-module', Traits: {Model: {Shape: 'torus'}}}, {ID: 'dock', Kind: 'test-module'}]});
	});

	it('makes a kind whole of its base, its Traits by their fields and its Parts by their ID, and tells its fields in any case', function () {
		var planet = kinds.Resolve('test-planet');

		expect(planet.Chain).toEqual(['test-body']);
		expect(planet.Traits).toEqual({Orbit: {Distance: 1, Eccentricity: 0}, Selectable: {}, Surface: {Kind: 'rocky'}});
		expect(planet.Values).toEqual({Radius: 6371});
		expect(kinds.Field(planet, 'eccentricity')).toEqual({Trait: 'Orbit', Name: 'Eccentricity'});
		expect(kinds.Field(planet, 'RADIUS')).toEqual({Trait: '', Name: 'Radius'});

		expect(function () {
			kinds.Resolve('test-nothing');
		}).toThrow('Elemenx Kinds: unknown kind test-nothing');

		kinds.Define('test-a', {Extends: 'test-b'});
		kinds.Define('test-b', {Extends: 'test-a'});

		expect(function () {
			kinds.Resolve('test-a');
		}).toThrow('Elemenx Kinds: test-a extends itself: test-a, test-b, test-a');
	});

	it('makes an object of a kind with parts of its own, and keeps of it only what differs: restored the same', function () {
		var station = kinds.Make('test-station', {ID: 'gw', Name: 'Gateway', Traits: {Team: {Side: 'blue'}}, Parts: [{ID: 'dock', Traits: {Health: {Max: 300}}}, {ID: 'extra', Kind: 'test-module'}]});
		var saved;

		expect(station.Parts.map(function (part) {
			return part.ID + ':' + part.Traits.Model.Shape + ':' + part.Traits.Health.Max;
		})).toEqual(['gw/ring:torus:100', 'gw/dock:box:300', 'gw/extra:box:100']);

		saved = kinds.Diff(station);

		expect(saved).toEqual({ID: 'gw', Kind: 'test-station', Values: {Name: 'Gateway'}, Traits: {Team: {Side: 'blue'}}, Parts: [{ID: 'dock', Traits: {Health: {Max: 300}}}, {ID: 'extra', Kind: 'test-module'}]});
		expect(JSON.stringify(kinds.Restore(saved))).toBe(JSON.stringify(station));

		/* A part taken away is kept as taken away. */
		station.Parts.splice(0, 1);

		expect(kinds.Diff(station).Parts).toContainEqual({ID: 'ring', Removed: true});
		expect(JSON.stringify(kinds.Restore(kinds.Diff(station)))).toBe(JSON.stringify(station));
	});
});

describe('Contract: Scene and SceneObject, the objects of a game in 3D', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:SceneTerrainGenerator', 'service:SceneRoadGenerator']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('reads the SceneObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star" Name="Sun" Mass="1">' +
				'<SceneObject ID="earth" Kind="planet" Name="Earth" Radius="6371" Mass="1" Distance="1" Tilt="23.4">' +
					'<SceneObject ID="moon" Kind="moon" Name="Moon" Radius="1737" distance="384400 km" />' +
					'<SceneObject ID="gateway" Kind="station" Name="Gateway" Team="blue">' +
						'<SceneObject Part="dock" Color="#ff8800" />' +
						'<SceneObject ID="lab" Kind="module" Shape="sphere" />' +
					'</SceneObject>' +
				'</SceneObject>' +
			'</SceneObject>' +
			'<SceneObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="blue" Count="3" />' +
		'</Scene>');
		var scene = mounted.Space;
		var parents = {};
		var later;

		scene.Objects().forEach(function (object) {
			parents[object.ID] = object.Parent;
		});

		expect(parents).toEqual({sun: '', earth: 'sun', moon: 'earth', gateway: 'earth', first: 'earth'});
		expect(scene.Get('earth').Traits.Body.Tilt).toBe(23.4);
		expect(scene.Get('moon').Traits.Orbit.Distance).toBe('384400 km');
		expect(scene.Describe('moon').Period).toBeCloseTo(27.3, 0);
		expect(scene.Describe('earth').Gravity).toBeCloseTo(9.81, 1);

		/* The parts: the ones of the kind of the station, one changed by Part, one more declared inside; the ships of the fleet. */
		expect(scene.Get('gateway').Parts.map(function (part) {
			return part.Part;
		})).toEqual(['ring', 'hub', 'panel-a', 'panel-b', 'dock', 'lab']);
		expect(scene.Get('gateway/dock').Traits.Model.Color).toBe('#ff8800');
		expect(scene.Get('gateway/lab').Traits.Model.Shape).toBe('sphere');
		expect(scene.Get('first').Parts.map(function (part) {
			return part.ID;
		})).toEqual(['first/ship-1', 'first/ship-2', 'first/ship-3']);

		scene.SetTime(365.25 / 4);

		later = scene.Position('earth');

		expect(later[1]).toBeCloseTo(1, 5);
		expect(Array.prototype.map.call(scene.$Element().querySelectorAll('.elemenx-scene-label'), function (label) {
			return label.textContent;
		}).sort()).toEqual(['Earth', 'First fleet', 'Gateway', 'Moon', 'Sun']);
	});

	it('draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle', async function () {
		var mounted = await mount('<Scene Paused="true" Background="false" Labels="false" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star"><SceneObject ID="rock" Kind="moon" Radius="6000" Distance="1" Atmosphere="none" Day="24" /></SceneObject>' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var center;
		var rock;
		var toStar;
		var spot;

		scene.SetTime(0);
		scene.Engine().Frame(performance.now());
		scene.Engine().Frame(performance.now());

		center = scene.ToScreen('sun');

		expect(bright(pixel(scene, center.X, center.Y))).toBeGreaterThan(500);
		expect(bright(pixel(scene, 4, 4))).toBeLessThan(70);
		expect(inner.Baked.rock.Ground.Cube).toBe(true);

		scene.FocusOn('rock');

		rock = scene.Get('rock');
		inner.Yaw = Math.atan2(-rock.World[2], rock.World[0]);
		inner.Pitch = 0.1;
		inner.Moving = 1;
		inner.Distance = inner.Wanted = rock.Size * 4;

		scene.Engine().Frame(performance.now());

		toStar = math.Vectors.Normalize([-rock.World[0], -rock.World[1], -rock.World[2]]);
		spot = function (sign) {
			return inner.Camera.Project(math.Vectors.Add(rock.World, math.Vectors.Scale(toStar, sign * rock.Size * 0.6)), inner.Width, inner.Height);
		};

		expect(bright(pixel(scene, spot(1).X, spot(1).Y))).toBeGreaterThan(90);
		expect(bright(pixel(scene, spot(-1).X, spot(-1).Y))).toBeLessThan(40);
	});

	/* The clouds of a planet went round it with its days: a day of two minutes drove them at hundreds of metres a second past a ship landing. */
	it('drives the clouds of a body by a wind of the clock, never by its days made fast', async function () {
		var mounted = await mount('<Scene Speed="50" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star" Name="Sun"><SceneObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Radius="6371" Distance="1" /></SceneObject>' +
		'</Scene>', {});
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var earth = inner.Objects.earth;
		var now = performance.now() + 100;
		var start = inner.Seconds;
		var i;

		for (i = 0; i < 30; i++) {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}

		/* A second of the clock: 25 metres a second round 6371 kilometres, however many days went. */
		expect(inner.Seconds - start).toBeGreaterThan(0.5);
		expect(engine.CloudDrift(earth)).toBeCloseTo(inner.Seconds * 25 / 6371000, 9);
		expect(engine.CloudDrift(earth) * 6371000 / Math.max(0.001, inner.Seconds)).toBeLessThan(26);
	});

	it('selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives', async function () {
		var selected = [];
		var arrived = [];
		var mounted = await mount('<Scene Paused="true" (ready)="Ready" (select)="Selected" (arrive)="Arrived">' +
			'<SceneObject ID="sun" Kind="star" Name="Sun"><SceneObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Distance="1" /><SceneObject ID="mars" Kind="planet" Name="Mars" Distance="1.5" /></SceneObject>' +
			'<SceneObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="red" Speed="0.5" />' +
		'</Scene>', {
			Selected: function (event) {
				selected.push(event);
			},
			Arrived: function (event) {
				arrived.push(event);
			}
		});
		var scene = mounted.Space;
		var element = scene.$Element();
		var card;

		element.querySelector('.elemenx-scene-label[data-id="earth"]').click();

		await tick(20);

		expect(selected[0].ID).toBe('earth');
		expect(selected[0].Info.Gravity).toBeCloseTo(9.81, 1);

		card = element.querySelector('.elemenx-scene-card');

		expect(card.textContent).toContain('Earth');
		expect(card.textContent).toContain('Habitable zone');

		Array.prototype.filter.call(card.querySelectorAll('.elemenx-button'), function (button) {
			return button.textContent.indexOf('Fly to it') !== -1;
		})[0].click();

		await tick(20);

		expect(scene.Scene().Focus).toBe('earth');
		expect(card.textContent).toContain('Land');

		element.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

		expect(scene.Scene().Focus).toBe('');

		expect(scene.Move('first', 'mars')).toBe(true);

		scene.SetTime(scene.Now() + 0.5);

		expect(arrived).toHaveLength(0);

		scene.SetTime(scene.Now() + 0.6);

		await tick(20);

		expect(arrived).toEqual([{ID: 'first', At: 'mars'}]);
		expect(scene.Get('first').Parent).toBe('mars');

		scene.Select('first/ship-2');

		expect(selected[selected.length - 1].ID).toBe('first/ship-2');
		expect(element.querySelector('.elemenx-scene-card').textContent).toContain('Fighter');
	});

	it('adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same', async function () {
		var mounted = await mount('<Scene Seed="kepler" Paused="true" (ready)="Ready" />');
		var scene = mounted.Space;
		var count = scene.Objects().length;
		var saved;
		var detached;
		var before;

		expect(count).toBe(Elemenx.Service('Astronomy').Generate('kepler').Bodies.length);

		scene.Add('station', {ID: 'outpost-1', Parent: 'planet-b', Name: 'Outpost', Team: 'red'});

		expect(scene.Get('outpost-1').Parent).toBe('planet-b');
		expect(scene.Get('outpost-1').Parts).toHaveLength(5);

		/* A field of a trait by its name, a part of its own. */
		scene.Change('outpost-1', {distance: 3});
		scene.Change('outpost-1/dock', {Color: '#00ff88'});

		expect(scene.Get('outpost-1').Traits.Orbit.Distance).toBe(3);
		expect(scene.Get('outpost-1/dock').Traits.Model.Color).toBe('#00ff88');

		expect(scene.Attach('outpost-1', {ID: 'antenna', Kind: 'module', Traits: {Model: {Shape: 'cone'}}}, [0, 1, 0])).toBe('outpost-1/antenna');
		expect(scene.Get('outpost-1/antenna').Values.Position).toEqual([0, 1, 0]);

		detached = scene.Detach('outpost-1/panel-a');

		expect(scene.Get('outpost-1/panel-a')).toBe(null);
		expect(scene.Get(detached).Kind).toBe('module');

		scene.Remove('outpost-1/hub');

		expect(scene.Get('outpost-1').Parts.map(function (part) {
			return part.Part;
		})).toEqual(['ring', 'panel-b', 'dock', 'antenna']);

		scene.SetTime(42);

		function state () {
			return JSON.stringify(scene.Objects().map(function (object) {
				return [object.ID, object.Parent, object.Values, object.Traits, object.Parts.map(function (part) {
					return [part.ID, part.Traits];
				})];
			}));
		}

		saved = JSON.parse(JSON.stringify(scene.Save({Baked: true})));
		before = state();

		/* Baked: the kind and what differs; an object as its kind gives it keeps no more than its ID and kind. */
		expect(saved.Objects.filter(function (object) {
			return object.ID === 'outpost-1';
		})[0].Parts).toContainEqual({ID: 'hub', Removed: true});

		var recipe = JSON.parse(JSON.stringify(scene.Save()));

		/* The recipe: the seed and the changes, not the objects the seed makes again. */
		expect(recipe.Version).toBe(1);
		expect(recipe.Seed).toBe('kepler');
		expect(recipe.Objects).toBeUndefined();
		expect(recipe.Removed).toEqual([]);
		expect(JSON.stringify(recipe.Overrides)).toContain('"hub"');
		expect(recipe.Added.map(function (spec) {
			return spec.ID;
		})).toContain('outpost-1');
		expect(JSON.stringify(recipe).length).toBeLessThan(JSON.stringify(saved).length / 2);

		scene.Remove('planet-b');
		scene.SetTime(0);
		scene.Load(saved);

		expect(scene.Now()).toBe(42);
		expect(state()).toBe(before);

		/* A scene loaded baked stays baked. */
		expect(scene.Save().Objects).toHaveLength(saved.Objects.length);

		scene.Remove('planet-b');
		scene.Add('station', {ID: 'late', Parent: 'planet-c'});

		scene.Seed = 'other';

		scene.SetTime(0);
		scene.Load(recipe);

		expect(scene.Seed).toBe('kepler');
		expect(scene.Now()).toBe(42);
		expect(state()).toBe(before);
		expect(scene.Save().Objects).toBeUndefined();

		/* What was removed of what the seed makes stays removed. */
		scene.Remove('planet-b');

		var without = JSON.parse(JSON.stringify(scene.Save()));

		expect(without.Removed).toContain('planet-b');

		scene.Load(recipe);

		expect(scene.Get('planet-b')).not.toBe(null);

		scene.Load(without);

		expect(scene.Get('planet-b')).toBe(null);
	});

	it('runs the systems of the application for traits of their own', async function () {
		var seen = [];
		var mounted = await mount('<Scene Paused="true" [systems]="Systems" (ready)="Ready"><SceneObject ID="sun" Kind="star" /></Scene>', {
			Systems: {
				Star: {
					Update: function (object, context) {
						seen.push(object.ID + '@' + context.Time());
					}
				}
			}
		});

		mounted.Space.SetTime(3);

		expect(seen).toContain('sun@3');
	});

	it('lands on the surface of a body and takes off again; a giant of gas has none', async function () {
		var events = [];
		var mounted = await mount('<Scene Paused="true" Background="false" (ready)="Ready" (land)="Landed" (takeoff)="Left">' +
			'<SceneObject ID="sun" Kind="star"><SceneObject ID="rock" Kind="planet" Surface-Type="desert" Radius="3390" Distance="1" />' +
			'<SceneObject ID="giant" Kind="planet" Surface-Type="gas" Radius="69911" Distance="5" /></SceneObject>' +
		'</Scene>', {
			Landed: function (event) {
				events.push('land ' + event.ID);
			},
			Left: function (event) {
				events.push('takeoff ' + event.ID);
			}
		});
		var scene = mounted.Space;
		var inner = scene.Scene();
		var i;

		/* The frames are given here: the loop of the page would come back in time between them. */
		inner.Loop.Stop();

		/* Regression: the field Landed was the method of the shaders of the land too: the button showed in every scene, and a landing broke the method. */
		expect(scene.$Element().querySelector('.elemenx-scene-takeoff')).toBe(null);
		expect(scene.Land('giant')).toBe(false);
		expect(scene.Land('rock', {Latitude: 10, Longitude: 20, Altitude: 2})).toBe(true);

		await tick(20);

		expect(scene.$Element().querySelector('.elemenx-scene-takeoff')).not.toBe(null);
		expect(typeof scene.Landed).toBe('function');
		expect(scene.Surface()).toMatchObject({ID: 'rock'});
		expect(scene.Surface().Latitude).toBeCloseTo(10, 6);

		/* Down to the ground: the squares of its faces made, finer near the eye, the eye above the ground. */
		for (i = 0; i < 40; i++)
			scene.Engine().Frame(performance.now() + i * 100);

		/* The faces come at once, their parts from the workers of the ground. */
		expect(Object.keys(inner.Surface.Nodes).length).toBeGreaterThanOrEqual(6);

		await waitFor(function () {
			scene.Engine().Frame(performance.now() + 4000);

			return Object.keys(inner.Surface.Nodes).length > 20;
		}, 20000);

		expect(inner.Surface.Field.Altitude(inner.Surface.Eye)).toBeGreaterThan(0);
		expect(events).toEqual(['land rock']);

		scene.TakeOff();

		for (i = 0; i < 80 && inner.Surface; i++)
			scene.Engine().Frame(performance.now() + 4000 + i * 100);

		expect(scene.Surface()).toBe(null);
		expect(events).toEqual(['land rock', 'takeoff rock']);
		expect(inner.Focus).toBe('rock');
	});

	/* In real sizes a craft is as long as it is (Length, metres) and a ship goes at its Speed (m/s) near a body. */
	it('makes crafts as long as they are and ships as fast as they go in real sizes', async function () {
		var mounted = await mount('<Scene Scale="real" Paused="true" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star" Mass="1">' +
				'<SceneObject ID="earth" Kind="planet" Radius="6371" Mass="1" Distance="1">' +
					'<SceneObject ID="dock" Kind="craft" Length="450" Distance="1.75" Period="90" />' +
				'</SceneObject>' +
			'</SceneObject>' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var metre = engine.Metre();
		var now = performance.now() + 1000;
		var from;
		var i;

		expect(metre).toBeGreaterThan(0);
		expect(inner.Objects.earth.Size / metre / 1000).toBeCloseTo(6371, 3);
		expect(inner.Objects.dock.Size / metre).toBeCloseTo(450, 6);

		scene.Add('ship', {ID: 'me', Name: '', Parent: 'earth', Vehicle: {Kind: 'ship', Speed: 2000, Length: 22, Around: 'earth', From: [0, 0, 2], Facing: [0, 0, 1]}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		expect(inner.Objects.me.Size / metre).toBeCloseTo(22, 6);

		inner.Objects.me.Ship.Throttle = 1;

		for (i = 0; i < 60; i++)
			engine.Frame(now += 100, true);

		from = inner.Objects.me.Ship.At.slice();

		engine.Frame(now += 100, true);

		/* 2 km/s near the body, up to a thousand times that far from it, as the root of its height (12 700 km here: 0.46 of the way). */
		var went = Math.hypot(inner.Objects.me.Ship.At[0] - from[0], inner.Objects.me.Ship.At[1] - from[1], inner.Objects.me.Ship.At[2] - from[2]) / metre / 0.1;

		expect(went).toBeGreaterThan(2000 * 1000 * 0.4);
		expect(went).toBeLessThan(2000 * 1000 * 0.5);
	});

	/*
	 * Regression: in real sizes the view reached from a ship a metre from the eye to the stars: the depth could not tell a
	 * body from its air (shards over the globe), the Sun stood at depth 1 and was not drawn, and the far sky turned through a
	 * view whose inverse lost its way (half of it cut, flickering). Space is drawn in two parts of depth; the sky by a view
	 * of its own; a star blinds by the light it sends.
	 */
	it('draws the Sun from a ship near a planet in real sizes, bright', async function () {
		var mounted = await mount('<Scene Scale="real" Paused="true" Background="false" Quality="low" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star" Mass="1">' +
				'<SceneObject ID="earth" Kind="planet" Radius="6371" Mass="1" Distance="1" />' +
			'</SceneObject>' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var vectors = Elemenx.Service('Math').Vectors;
		var now = performance.now() + 1000;
		var data = new Uint8Array(4);
		var spot;
		var hero;

		scene.Add('ship', {ID: 'me', Name: '', Parent: 'earth', Vehicle: {Kind: 'ship', Length: 22, Around: 'earth', From: [0, 0, 3], Facing: [0, 0, 1]}});
		scene.Control('me');

		engine.Frame(now += 100, true);

		hero = inner.Objects.me;

		/* The view behind the ship, the Sun ahead of the eye. */
		var way = vectors.Normalize(vectors.Subtract(inner.Objects.sun.World, hero.World));
		var axes = inner.ShipAxes || hero.Seen;
		var round = [-vectors.Dot(way, axes.Right), -vectors.Dot(way, axes.Up), -vectors.Dot(way, axes.Ahead)];

		inner.Pitch = Math.asin(round[1]) + 0.08;
		inner.Yaw = Math.atan2(-round[0], -round[2]);

		function frame () {
			inner.Looping = true;

			engine.Frame(now += 100);

			inner.Looping = false;
		}

		frame();
		frame();

		spot = engine.Project(inner.Objects.sun.World);

		expect(spot.Visible).toBe(true);
		expect(inner.Camera.Near / engine.Metre()).toBeLessThan(10);

		frame();

		gl.readPixels(Math.round(spot.X * renderer.Ratio), Math.round(renderer.Height - spot.Y * renderer.Ratio), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

		expect(data[0] + data[1] + data[2]).toBeGreaterThan(600);
	});

	/* The game does not go on before all the view needs is there: the squares of its ground near the eye and what grows round it. */
	it('starts a ground behind a veil, its time still, until its squares and what grows round the eye are made', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="20" Water="0.1" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var seconds;

		await waitFor(function () {
			return scene.Veiled === 1 || !inner.Preparing;
		}, 4000);

		seconds = inner.Seconds;

		if (inner.Preparing)
			expect(engine.Waiting()).toBeGreaterThan(0);

		await waitFor(function () {
			return !inner.Preparing;
		}, 30000);

		expect(inner.Seconds - seconds).toBeLessThan(0.2);
		expect(inner.Ground.Missing).toBe(0);
		expect(engine.ScatterPending(240)).toBe(0);

		await waitFor(function () {
			return scene.Veiled === 0 && inner.Seconds > seconds + 0.2;
		}, 4000);

		/* A location that comes (SceneLanding): behind the veil again until it is made. */
		engine.Prepare();

		await waitFor(function () {
			return scene.Veiled === 1;
		}, 4000);
		await waitFor(function () {
			return scene.Veiled === 0;
		}, 30000);
	}, 60000);

	it('plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model', async function () {
		var ended = [];
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="20" Water="0.1" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="hero" Kind="knight" X="0" Y="0" Team="red" />' +
			'<SceneObject ID="keep" Kind="tower" X="40" Y="40" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var hero = scene.Get('hero');
		var frame = function (seconds) {
			inner.Seconds += seconds;
			inner.Last = 0;

			scene.Engine().Frame(performance.now() + inner.Seconds * 1000);
		};

		expect(hero.Traits.Walker.Speed).toBe(8);
		expect(scene.Get('keep').Values.Blocks).toBe(true);
		/* A house of a scene can be selected; its health is of a game (Vitals of ElemenxGaming), none of the scene. */
		expect(scene.Get('keep').Traits.Selectable).toEqual({});
		expect(scene.Get('keep').Traits.Health).toBe(undefined);

		frame(0.1);

		expect(hero.Clip.Name).toBe('idle');

		expect(scene.Play('hero', 'dance')).toBe(false);
		expect(scene.Play('nobody', 'attack')).toBe(false);
		expect(scene.Play('keep', 'attack')).toBe(false);

		expect(scene.Play('hero', 'attack', function (error, result) {
			ended.push(result);
		})).toBe(true);

		frame(0.1);

		expect(hero.Clip.Name).toBe('attack');

		frame(1);

		await tick(20);

		frame(0.05);

		expect(ended).toEqual([{ID: 'hero', Clip: 'attack'}]);
		expect(hero.Clip.Name).toBe('idle');

		expect(scene.Move('hero', [30, 5])).toBe(true);

		frame(0.1);

		expect(hero.Clip.Name).toBe('walk');

		/* A clip that holds stays, and a loop gets it up again. */
		scene.Play('hero', 'die');

		frame(3);
		frame(3);

		expect(hero.Clip.Name).toBe('die');

		delete inner.Ways.hero;

		expect(scene.Play('hero', 'work')).toBe(true);

		frame(0.1);

		expect(hero.Clip.Name).toBe('work');
	});

	it('sees a ground in parallel rays: from above a point is where the plan says, at an angle where the rhombus says', async function () {
		var mounted = await mount('<Scene View="top" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="tower" Kind="tower" X="10" Y="20" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var at;

		inner.Wanted = 40;
		inner.Distance = 40;

		scene.Engine().Frame(performance.now() + 900);

		inner.Ground.Target = [10, 0, 20];

		scene.Engine().Frame(performance.now() + 1000);

		expect(inner.Camera.Ortho).toBeCloseTo(40, 3);

		at = inner.Camera.Project([10, 0, 30], 640, 400);

		expect(at.X).toBeCloseTo(320, 1);
		expect(at.Y).toBeCloseTo(300, 1);

		scene.View = 'isometric';

		scene.Engine().Frame(performance.now() + 1100);

		at = inner.Camera.Project([20, inner.Ground.Target[1], 30], 640, 400);

		/* A step along X and along Z goes straight down the screen, half as far as a step across would go. */
		expect(at.X).toBeCloseTo(320, 1);
		expect(at.Y - 200).toBeCloseTo(Math.SQRT2 * 10 * 0.5 * 10, 0);

		scene.View = '';

		scene.Engine().Frame(performance.now() + 1200);

		expect(inner.Camera.Ortho).toBe(0);
	});

	it('brings the resolution back at the 60 frames of a screen, and holds it where a quality was chosen', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		function frames (count, step) {
			for (i = 0; i < count; i++) {
				now += step;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		inner.Most = 1;
		inner.Ratio = 0.7;

		/* The first seconds of a scene say nothing of the machine: it is still being filled. */
		frames(30, 16.7);

		expect(inner.Ratio).toBe(0.7);

		inner.Seconds = 10;

		frames(200, 16.7);

		expect(inner.Ratio).toBeGreaterThan(0.9);

		/* However late the frames, it stops where the picture still is one. */
		inner.Ratio = 1;

		frames(200, 40);

		expect(inner.Ratio).toBeGreaterThanOrEqual(0.7);

		/* Chosen by hand, it does not move at all. */
		scene.Quality = 'medium';

		frames(60, 40);

		expect(inner.Ratio).toBe(1);
	});

	it('steps down from frames that are late, but not to where the grass goes', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</Scene>');
		var scene = mounted.Space;
		var first = scene.Graphics().Level;
		var i;

		for (i = 0; i < 500; i++)
			scene.Engine().PostTime(0.05);

		/* A machine with no graphics card starts at low, and stays: nothing lifts it. */
		expect(scene.Graphics().Level).toBe(first === 'low' ? 'low' : 'medium');

		scene.Quality = 'ultra';

		for (i = 0; i < 500; i++)
			scene.Engine().PostTime(0.05);

		expect(scene.Graphics().Level).toBe('ultra');
	});

	it('never leaves a hole in the ground: a square gives way only when its parts are made', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
		'</Scene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();
		var nodes = inner.Ground.Nodes;

		inner.Wanted = inner.Distance = 6;

		function covered () {
			var keys = Object.keys(nodes);
			var used = keys.filter(function (key) {
				return nodes[key].Used === inner.Ground.Frame;
			});

			/* The square of all the land is there from the first frame on, whatever is near the eye. */
			expect(nodes['0.000:0.000:0']).toBeTruthy();

			return used.length;
		}

		engine.Frame(performance.now() + 100);

		var first = covered();

		await waitFor(function () {
			engine.Frame(performance.now() + 200);

			return covered() > first;
		}, 4000);
	});

	it('keeps the noise of a ground and of water where they are, not where the eye is', async function () {
		var mounted = await mount('<Scene (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="2" Seed="test" /></Scene>');
		/* The water as it is drawn: the shader with the water graph of the library in it. */
		var shaders = mounted.Space.Watered(mounted.Space.Shaders(Elemenx.Service('Renderer')));

		expect(shaders.Sea).toContain('= vWorld + uEye;');
		expect(shaders.Sea).toContain('void blueprintWater(inout vec3 color, inout float alpha) {\n');

		[shaders.Land, shaders.Sea, shaders.Ground].forEach(function (source) {
			expect(source).not.toMatch(/noise3\(vWorld/);
			expect(source).not.toMatch(/wavesAt\(vWorld\./);
		});
	});

	it('turns bodies at the pace of DaySeconds, however fast their orbits go', async function () {
		var mounted = await mount('<Scene Paused="true" Speed="4" DaySeconds="30" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star">' +
				'<SceneObject ID="earth" Kind="planet" Radius="6371" Distance="1" Day="24" />' +
				'<SceneObject ID="mars" Kind="planet" Radius="3390" Distance="1.5" Day="12" />' +
			'</SceneObject>' +
		'</Scene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();

		inner.Seconds = 7.5;
		inner.Rest = 0;

		engine.Frame(performance.now() + 1000);

		/* A quarter of a day: Y to the side; twice as fast is a half. */
		expect(inner.Objects.earth.Turn[0]).toBeCloseTo(0, 3);
		expect(inner.Objects.mars.Turn[0]).toBeCloseTo(-1, 3);
	});

	it('flies to what it focuses on: the eye goes through space, with no turn of the system', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star">' +
				'<SceneObject ID="mars" Kind="planet" Radius="3390" Distance="1.5" />' +
			'</SceneObject>' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var path = [];

		function frame () {
			now += 16;
			inner.Rest = 0;

			engine.Frame(now);

			path.push(inner.Eye.slice());
		}

		frame();

		scene.FocusOn('mars');

		expect(inner.Flight.Length).toBeGreaterThan(1);

		while (inner.Flight && path.length < 600)
			frame();

		expect(inner.Flight).toBe(null);

		/* It left from where it stood, and took no step much longer than those round it. */
		var steps = path.slice(1).map(function (eye, index) {
			return Math.hypot(eye[0] - path[index][0], eye[1] - path[index][1], eye[2] - path[index][2]);
		});
		var longest = Math.max.apply(null, steps);
		var total = steps.reduce(function (sum, step) {
			return sum + step;
		}, 0);

		expect(steps[1]).toBeLessThan(longest / 10);
		expect(longest).toBeLessThan(total / 20);

		var mars = inner.Objects.mars.World;

		expect(Math.hypot(inner.Target[0] - mars[0], inner.Target[1] - mars[1], inner.Target[2] - mars[2])).toBeCloseTo(0, 3);
		expect(inner.Distance).toBeCloseTo(inner.Wanted, 3);
	});

	it('puts what a square holds in every level one of its things can be seen at', async function () {
		var mounted = await mount('<Scene Quality="medium" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="192" Height="2" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="woods" Kind="forest" Shapes="oak" Density="1" Seed="a" Cover="1" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 8000);

		/* From 160 all of it is in view, its middles inside the third level: what is 44 nearer is also in the second. */
		inner.Wanted = inner.Distance = 160;
		inner.Pitch = 1.5;
		inner.Ground.Target = [0, 0, 0];

		engine.Frame(performance.now() + 200);
		engine.Frame(performance.now() + 400);

		expect(Math.hypot(inner.Eye[0], inner.Eye[1], inner.Eye[2])).toBeGreaterThan(150);
		expect(scene.Sown().Copies).toBeGreaterThan(scene.Sown().Things * 1.2);
	});

	it('gives what Add is told to its traits, as a declaration does: the Size of a unit is the size of its model', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</Scene>');
		var scene = mounted.Space;

		scene.Add('unit', {ID: 'giant', Size: 7, X: 5, Y: 5, Name: 'Giant'});
		scene.Engine().Frame(performance.now() + 100);

		expect(scene.Scene().Objects.giant.Size).toBe(7);
		expect(scene.Scene().Objects.giant.Traits.Model.Size).toBe(7);
		expect(scene.Scene().Objects.giant.Values.X).toBe(5);
	});

	it('lets the view go anywhere: over a ground it is carried and lets its object go, in space it leaves its body aside', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="hero" Kind="knight" X="0" Y="0" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();

		engine.Frame(performance.now() + 100);

		scene.FocusOn('hero');

		var before = inner.Ground.Target.slice();

		engine.PanView(100, 0);

		expect(inner.Focus).toBe('');
		expect(Math.hypot(inner.Ground.Target[0] - before[0], inner.Ground.Target[2] - before[2])).toBeGreaterThan(1);

		var yaw = inner.Yaw;
		var pitch = inner.Pitch;

		inner.Ground.Keys = {KeyE: true, KeyF: true};
		inner.Rest = 0;

		engine.Frame(performance.now() + 300);

		inner.Rest = 0;

		engine.Frame(performance.now() + 500);

		inner.Ground.Keys = {};

		expect(inner.Yaw).toBeLessThan(yaw);
		expect(inner.Pitch).toBeLessThan(pitch);

		var space = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="sun" Kind="star"><SceneObject ID="mars" Kind="planet" Radius="3390" Distance="1.5" /></SceneObject></Scene>');
		var far = space.Space.Scene();

		space.Space.Engine().Frame(performance.now() + 100);
		space.Space.Engine().PanView(50, 20);

		expect(Math.hypot(far.Pan[0], far.Pan[1], far.Pan[2])).toBeGreaterThan(0);

		space.Space.Engine().FocusOn('mars', true);

		expect(far.Pan).toEqual([0, 0, 0]);
	});

	it('works out the light of a field: what a hill hides of the sky, and the color that comes from the land round a place', async function () {
		var mounted = await mount('<Scene Quality="high" Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="300" Height="40" Water="0" Scale="60" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" Elevation="40" />' +
		'</Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var field = scene.Scene().Ground.Field;
		var low = [0, 0];
		var high = [0, 0];
		var x;
		var z;

		expect(scene.Graphics().Field).toBe(true);
		expect(engine.FieldOn()).toBe(true);

		for (x = -120; x <= 120; x += 12) {
			for (z = -120; z <= 120; z += 12) {
				if (field.Height(x, z) < field.Height(low[0], low[1]))
					low = [x, z];

				if (field.Height(x, z) > field.Height(high[0], high[1]))
					high = [x, z];
			}
		}

		await waitFor(function () {
			scene.Scene().Rest = 0;

			engine.Frame(performance.now() + 100);

			var read = engine.FieldRead(low[0], low[1]);

			return read && read[3] > 0 && read[0] + read[1] + read[2] > 0;
		}, 8000);

		for (x = 0; x < 40; x++) {
			scene.Scene().Rest = 0;

			engine.Frame(performance.now() + 200);
		}

		var valley = engine.FieldRead(low[0], low[1]);
		var hill = engine.FieldRead(high[0], high[1]);

		expect(valley[3]).toBeLessThan(hill[3]);
		expect(valley[1]).toBeGreaterThan(hill[1]);
		expect(valley.every(Number.isFinite)).toBe(true);
	});

	it('comes down to a body from where the eye stands and goes back up to the same view, in one piece', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="sun" Kind="star">' +
				'<SceneObject ID="earth" Kind="planet" Surface-Type="terran" Radius="6371" Distance="1" />' +
			'</SceneObject>' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var last;

		function frames (count) {
			var i;

			for (i = 0; i < count; i++) {
				now += 100;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		frames(1);

		scene.FocusOn('earth');

		frames(50);

		var distance = Math.hypot(inner.Eye[0] - inner.Objects.earth.World[0], inner.Eye[1] - inner.Objects.earth.World[1], inner.Eye[2] - inner.Objects.earth.World[2]);

		expect(scene.Land('earth')).toBe(true);

		/* As large as it looked from space. */
		expect(inner.Surface.Altitude).toBeCloseTo(6371 * (distance / inner.Objects.earth.Size - 1), -2);
		expect(inner.Surface.Pitch).toBeLessThan(-1.4);

		last = inner.Surface.Altitude;

		frames(40);

		expect(inner.Surface.Altitude).toBeLessThan(last);

		frames(60);

		expect(inner.Surface.Way).toBe(null);
		expect(inner.Surface.Altitude).toBeLessThan(1);
		expect(inner.Surface.Pitch).toBeGreaterThan(-0.3);

		scene.TakeOff();

		frames(90);

		expect(inner.Surface).toBe(null);

		/* The planet is where the way up left it: on the side the eye rose, as large. */
		expect(inner.Distance).toBeGreaterThan(inner.Objects.earth.Size);
		expect(inner.Wanted).toBeCloseTo(inner.Distance, 3);
	});

	it('goes down at once when it is told so', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="sun" Kind="star"><SceneObject ID="moon" Kind="planet" Surface-Type="moon" Radius="1737" Distance="1" /></SceneObject></Scene>');
		var inner = mounted.Space.Scene();

		mounted.Space.Engine().Frame(performance.now() + 100);

		mounted.Space.Land('moon', {Instant: true, Altitude: 2});

		expect(inner.Surface.Altitude).toBe(2);
		expect(inner.Surface.Way).toBe(null);
	});

	it('keeps from the shaders what would blur, flicker or show as noise', async function () {
		var mounted = await mount('<Scene (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="2" Seed="test" /></Scene>');
		var space = mounted.Space;
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var lights = space.LightingShaders(graphics);
		var sown = space.ScatterShaders(graphics);

		/* What moves by itself keeps little history: the frames hardly mix over it. */
		expect(lights.Frames).toMatch(/moving > 0\.5 \? 0\.3/);
		expect(space.Shaders(graphics).Pbr).toMatch(/uMoving/);

		/* A highlight that falls between pixels is spread by what the normal does there, or it flickers on carbon and paint. */
		expect(space.Shaders(graphics).Pbr).toMatch(/roughness = sqrt\(min\(1\.0, roughness \* roughness \+ spread\)\)/);

		/*
		 * Regression: a rough steel rail mirrored the grass sharp, at half the size, in steps of two pixels at its edges. What is
		 * rough mirrors blurred (its rays spread by its roughness, the frames add them up), what is very rough none of the screen.
		 */
		expect(space.Shaders(graphics).Pbr).toContain('float code = base.a < 0.99 ? 0.0 :');
		expect(lights.Mirror).toContain('if (rough > 0.65) break;');
		expect(lights.Mirror).toContain('vec3 bent = reflect(v, h);');

		/*
		 * Regression: the sea of a globe took its waves of a place that was always nought (a noise of rounding: streaks that
		 * flickered), and a grain of kilometres where a pixel covers more. Its waves are of the very place, past two pixels none.
		 */
		expect(space.Shaders(graphics).Ground).not.toContain('dot(place, side)');
		expect(space.Shaders(graphics).Ground).toContain('float foot = length(fwidth(place));');
		expect(space.Shaders(graphics).Ground).toContain('uCloudsOn');

		/* What moves keeps few frames: its shadow has a pattern that stands, not a grain they would take away. */
		expect(graphics.Chunks.Shadow).toMatch(/uSteady > 0\.5 \? 0\.0 :/);

		/* Air seen from inside its shell has no line where the nearest point of a ray goes behind the eye. */
		expect(space.Shaders(graphics).Air).toMatch(/max\(dot\(uBody\.xyz - uCamera, look\), 0\.0\)/);

		/* Grass: the wind (a graph of the library now, LibraryGrass) is one wave for a place, a blade stirs only near, and one with no height is not drawn. */
		var grassWind = Elemenx.Service('Blueprints').Compile(space.LibraryGrass()).Function;

		expect(grassWind).toContain('0.16');
		expect(grassWind).toMatch(/\buv\b/);
		expect(grassWind).not.toMatch(/1\.4\b/);
		expect(sown.GrassVertex).toContain('blueprintGrass(');
		expect(sown.GrassVertex).toMatch(/tall > 0\.01 \?/);

		/* Clumps thin the blades between the tufts and make them lower there; the height of a blade is not its chance to grow. */
		expect(sown.GrassVertex).toMatch(/step\(seed, uBlade\.y \* thick\)/);
		expect(sown.GrassVertex).toMatch(/\(own - 0\.5\) \* 2\.0 \* uClump\.z/);
		expect(sown.GrassVertex).toMatch(/float own = fract\(seed \* 7\.31/);

		/* Water is lit by what its waves mirror; clouds are a ray through their layer. */
		expect(lights.Clouds).toMatch(/thick\(p/);
		expect(lights.Shafts).toMatch(/uSpot/);

		/* The sun on water comes of its waves: the same on a map and on a planet. */
		expect(space.Shaders(graphics).Sea).toMatch(/wavesAt/);
		expect(space.Shaders(graphics).Ground).toMatch(/wavesAt/);
	});

	it('lets the eye go down to the ground and look up at the sky', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" /></Scene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();

		inner.Wanted = inner.Distance = 20;
		inner.Pitch = -1;

		engine.Frame(performance.now() + 100);

		expect(inner.Camera.Target[1]).toBeGreaterThan(inner.Camera.Position[1]);
		expect(inner.Pitch).toBe(-1);
	});

	it('reads an hour of the day: the sun at noon is high and white, at sunset low and gold, at night the moon lights the land', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" />' +
			'<SceneObject ID="day" Kind="sun" Time="12:00" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		function at (time) {
			scene.Change('day', {Time: time});
			scene.Engine().Compose();

			inner.Rest = 0;

			scene.Engine().Frame(performance.now() + 100);

			return {Sun: inner.Ground.Sun.slice(), Color: inner.Ground.SunColor.slice(), Sky: inner.Ground.Sky.slice()};
		}

		var noon = at('12:00');
		var evening = at('17:30');
		var night = at('23:00');

		expect(noon.Sun[1]).toBeGreaterThan(evening.Sun[1]);
		expect(evening.Sun[1]).toBeGreaterThan(0);
		expect(evening.Color[2] / evening.Color[0]).toBeLessThan(noon.Color[2] / noon.Color[0]);

		expect(night.Sky[1]).toBeLessThan(0);
		expect(night.Sun[1]).toBeGreaterThan(0);
		expect(night.Color[2]).toBeGreaterThan(night.Color[0]);
	});

	it('changes its weather slowly: clouds take the sun, rain falls, and what is not a weather is clear', async function () {
		var mounted = await mount('<Scene Paused="true" Weather="clear" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" />' +
			'<SceneObject ID="day" Kind="sun" Elevation="50" />' +
		'</Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var clear = engine.WeatherStep(0).Clouds;

		scene.Weather = 'rain';

		var soon = engine.WeatherStep(0.5);

		expect(soon.Clouds).toBeGreaterThan(clear);
		expect(soon.Clouds).toBeLessThan(0.9);

		var i;

		for (i = 0; i < 80; i++)
			engine.WeatherStep(0.5);

		expect(engine.WeatherNow().Rain).toBeCloseTo(0.8, 2);

		scene.Weather = 'nonsense';

		for (i = 0; i < 80; i++)
			engine.WeatherStep(0.5);

		expect(engine.WeatherNow().Rain).toBeCloseTo(0, 2);
	});

	it('shines many lights: the nearest two dozen at once, lit where they stand, each with its color', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" />' +
		'</Scene>');
		var scene = mounted.Space;
		var i;

		for (i = 0; i < 30; i++)
			scene.Add('light', {ID: 'lamp-' + i, X: i, Y: 0, Color: '#ff0000', Radius: 5});

		scene.Add('light', {ID: 'follower', Follow: 'lamp-0', Height: 3});

		scene.Scene().Rest = 0;

		scene.Engine().Frame(performance.now() + 100);

		expect(scene.Scene().Lamps.length).toBe(24);
		expect(scene.Scene().Lamps[0].Color[0]).toBeGreaterThan(0);

		var follower = scene.Scene().Lamps.concat([]).filter(function (lamp) {
			return lamp.Object.ID === 'follower';
		})[0];
		if (follower)
			expect(follower.At[1]).toBeGreaterThan(scene.Scene().Objects['lamp-0'] ? 0 : -1);
	});

	it('takes a ground from a model: floors one over the other, walls that stop a walker, and a plane at its foot', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');

		function box (x0, x1, y, z0, z1) {
			return {Positions: [x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], Indices: [0, 2, 1, 0, 3, 2]};
		}

		var field = terrain.FromModel([box(-10, 10, -1, -10, 10), box(-4, 4, 3, -4, 4), {Positions: [6, -1, -10, 6, 4, -10, 6, 4, 10, 6, -1, 10], Indices: [0, 1, 2, 0, 2, 3]}], {});

		expect(field.Lift).toBe(1);

		/* At the same place: the walker on the floor below stays on it, the one above stays above. */
		expect(field.Height(0, 0, 0)).toBeCloseTo(0, 3);
		expect(field.Height(0, 0, 4)).toBeCloseTo(4, 3);
		expect(field.Height(0, 0)).toBeCloseTo(4, 3);

		expect(field.Blocked(6, 0, 0)).toBe(true);
		expect(field.Blocked(2, 0, 0)).toBe(false);
		expect(field.Walkable(9, 9)).toBe(true);
		expect(field.Walkable(30, 30)).toBe(false);

		/* The other side of a floor is no floor, however its triangles are wound: its normals tell. */
		var under = terrain.FromModel([{Positions: [-5, 0, -5, 5, 0, -5, 5, 0, 5, -5, 0, 5], Normals: [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [-5, 4, -5, 5, 4, -5, 5, 4, 5, -5, 4, 5], Normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], Indices: [0, 1, 2, 0, 2, 3]}], {});

		expect(under.Height(0, 0)).toBeCloseTo(4, 3);
		expect(under.Spots().length).toBe(1);
		expect(under.Spots()[0].Y).toBeCloseTo(4, 3);

		/* A triangle far larger than a cell leaves no hole in the floor. */
		var wide = terrain.FromModel([{Positions: [-300, 0, -300, 300, 0, -300, 300, 0, 300, -300, 0, 300], Indices: [0, 2, 1, 0, 3, 2]}], {});

		expect(wide.Spots().length).toBe(1);
		expect(wide.CanStep(123.4, -77.7, 0)).toBe(true);
		expect(wide.CanStep(400, 0, 0)).toBe(false);

		/* A passage is as wide as it is drawn: a body goes down it by its sides, stands off its walls, and a kerb under its knees stops nothing. */
		function wall (x, height) {
			return {Positions: [x, 0, -8, x, height, -8, x, height, 8, x, 0, 8], Indices: [0, 1, 2, 0, 2, 3]};
		}

		var passage = terrain.FromModel([box(-10, 10, 0, -10, 10), wall(-0.5, 4), wall(0.5, 4), wall(3, 0.3)]);
		var lift2 = 0;

		expect(passage.Push(0, 0, lift2, 0.3, 0.5, 2)).toEqual([0, 0]);

		var pressed = passage.Push(0.4, 0, lift2, 0.3, 0.5, 2);

		expect(pressed[0]).toBeCloseTo(0.2, 5);
		expect(passage.Stands(pressed[0], pressed[1], lift2)).toBe(true);

		/* Over a wall that a body has no room to pass, it stays on its side. */
		var side = [0.1, 1];
		var i;

		for (i = 0; i < 40; i++)
			side = passage.Push(side[0] + 0.05, side[1], lift2, 0.3, 0.5, 2);

		expect(side[0]).toBeLessThan(0.21);

		expect(passage.Push(3.1, 0, lift2, 0.3, 0.5, 2)).toEqual([3.1, 0]);
		expect(passage.Stands(30, 30, lift2)).toBe(false);

		var plain = terrain.FromModel([box(-2, 2, 1, -2, 2)], {Plane: true});

		expect(plain.Walkable(1.5, 1.5)).toBe(true);
		expect(plain.Height(1.5, 1.5, 0)).toBe(0);
		expect(plain.Walkable(1.5, 1.5)).toBe(true);
	});

	it('gives each scene of a page its own textures of a model they share', async function () {
		var models = Elemenx.Service('SceneModels');
		var first = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var second = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');

		models.Define('test-shared', {URL: 'shared.glb'});

		var parse = await new Promise(function (resolve, reject) {
			Elemenx.Service('Gltf').Parse(Binary().buffer, function (error, asset) {
				if (error) reject(error);
				else resolve(asset);
			});
		});

		models.Recipes['test-shared'].Asset = parse;

		[first, second].forEach(function (one) {
			one.Space.Add('unit', {ID: 'same', Model: 'test-shared', X: 1, Y: 1});
			one.Space.Engine().Compose();
		});

		[first, second, first, second].forEach(function (one) {
			one.Space.Scene().Rest = 0;

			one.Space.Engine().Frame(performance.now() + 100);
		});

		var gl = second.Space.Engine().Renderer.GL;

		gl.getError();

		second.Space.Scene().Rest = 0;

		second.Space.Engine().Frame(performance.now() + 200);

		expect(gl.getError()).toBe(gl.NO_ERROR);
	});

	it('puts rain and snow in the world, clouds in frames that add up, and takes a lens by how strong it is', async function () {
		var mounted = await mount('<Scene Flare="1.5" Weather="rain" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var space = mounted.Space;
		var lights = space.LightingShaders(Elemenx.Service('Renderer'));
		var engine = space.Engine();

		/* A box of air that wraps round the eye: not the coordinates of the screen. */
		expect(lights.FallVertex).toMatch(/mod\(p - uEye, uBox\)/);
		expect(lights.FallVertex).toMatch(/0\.45 \+ seed\.z \* seed\.z \* 1\.5/);
		expect(lights.Picture).not.toMatch(/uRain/);
		expect(lights.CloudFrames).toMatch(/uMix \* inside/);

		/* A front comes in seconds. */
		space.Weather = 'fog';

		var i;

		for (i = 0; i < 6; i++)
			engine.WeatherStep(0.5);

		expect(engine.WeatherNow().Fog).toBeGreaterThan(0.85);
	});

	it('has a view however early the keys are given: a walker of a size not known yet does not put the eye on its target', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;

		scene.Add('unit', {ID: 'hero', Size: 0, X: 1, Y: 1});
		scene.Engine().Frame(performance.now() + 100);
		scene.Control('hero');

		expect(scene.Scene().Wanted).toBeGreaterThan(1);

		var inner = scene.Scene();

		inner.Camera.Position = inner.Camera.Target.slice();

		expect(function () {
			inner.Camera.Ray(10, 10, 100, 100);
		}).not.toThrow();
	});

	it('walks with the keys where the view looks, and goes on its way while the right button turns the view', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;

		function frame () {
			now += 30;
			inner.Rest = 0;

			engine.Frame(now);
		}

		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		frame();

		scene.Control('hero');

		frame();

		inner.Ground.Keys = {KeyW: true};

		frame();

		var way = inner.Objects.hero.Heading.slice();

		inner.Drag = {Button: 2, Yaw: inner.Yaw};
		inner.Yaw += 1;

		frame();

		expect(inner.Objects.hero.Heading[0]).toBeCloseTo(way[0], 5);
		expect(inner.Objects.hero.Heading[2]).toBeCloseTo(way[2], 5);

		inner.Drag = null;

		frame();

		expect(Math.abs(inner.Objects.hero.Heading[0] - way[0])).toBeGreaterThan(0.2);
	});

	it('walks, drives and looks by a pad as far as it leans: half a trigger is half the gas, the stick steers, A jumps', async function () {
		var gamepad = Elemenx.Service('InputDevices');
		var pad = gamepad.Virtual(unique('drive'), {Navigate: false});
		var now = performance.now() + 1000;

		async function scene (vehicle) {
			var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="600" Height="0" Water="0" Seed="flat" /></Scene>');
			var space = mounted.Space;

			space.Add('unit', Object.assign({ID: 'hero', Size: 1.2, X: 0, Y: 0}, vehicle ? {Vehicle: {Kind: 'car'}} : {}));
			space.Engine().Frame(now += 30);
			space.Control('hero');

			return space;
		}

		function frames (space, count) {
			for (var i = 0; i < count; i++) {
				space.Scene().Rest = 0;

				space.Engine().Frame(now += 30);
			}
		}

		try {
			var full = await scene(true);

			pad.Trigger('right', 1);

			frames(full, 30);

			var fast = full.Scene().Objects.hero.Car.Forward;

			var half = await scene(true);

			pad.Trigger('right', 0.5);

			frames(half, 30);

			var slow = half.Scene().Objects.hero.Car.Forward;

			expect(fast).toBeGreaterThan(2);
			expect(slow).toBeGreaterThan(fast * 0.3);
			expect(slow).toBeLessThan(fast * 0.7);

			/* The stick to the right steers right, as far as it leans. */
			pad.Stick('left', 0.5, 0);

			frames(half, 30);

			expect(half.Scene().Objects.hero.Car.Steer).toBeLessThan(-0.3);
			expect(half.Scene().Objects.hero.Car.Steer).toBeGreaterThan(-0.7);

			pad.Trigger('right', 0);
			pad.Stick('left', 0, 0);

			/* On foot: the stick ahead walks where the view looks, the right stick turns the view, A jumps. */
			var walker = await scene(false);
			var inner = walker.Scene();
			var at = [inner.Objects.hero.Values.X, inner.Objects.hero.Values.Y];
			var yaw = inner.Yaw;

			pad.Stick('left', 0, -1);

			frames(walker, 20);

			expect(Math.hypot(inner.Objects.hero.Values.X - at[0], inner.Objects.hero.Values.Y - at[1])).toBeGreaterThan(0.5);

			pad.Stick('left', 0, 0);
			pad.Stick('right', 1, 0);

			frames(walker, 10);

			expect(inner.Yaw).toBeLessThan(yaw - 0.3);

			pad.Stick('right', 0, 0);
			pad.Press('a');

			frames(walker, 3);

			expect(inner.Objects.hero.Rise || 0).not.toBe(0);
		}
		finally {
			pad.Destroy();
		}
	});

	it('runs its frames with no graphics at all, as a page out of WebGL contexts does', async function () {
		var get = HTMLCanvasElement.prototype.getContext;
		var mounted;

		HTMLCanvasElement.prototype.getContext = function (kind) {
			return /webgl/.test(kind) ? null : get.apply(this, arguments);
		};

		try {
			mounted = await mount('<Scene (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		}
		finally {
			HTMLCanvasElement.prototype.getContext = get;
		}

		expect(mounted.Space.Unsupported).toBe(true);

		expect(function () {
			mounted.Space.Scene().Rest = 0;

			mounted.Space.Engine().Frame(performance.now() + 100);
		}).not.toThrow();
	});

	it('walks a hero with the feet of a body: walls stop it at any speed, it slides along them, jumps and falls, and faces the view', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				now += 30;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		frames(1);

		/* A floor of 20 by 20 with a wall at x = 3. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-10, 0, -10, 10, 0, -10, 10, 0, 10, -10, 0, 10], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [3, 0, -10, 3, 5, -10, 3, 5, 10, 3, 0, 10], Indices: [0, 1, 2, 0, 2, 3]}], {});

		var hero = inner.Objects.hero;

		hero.Air = 0;
		inner.Hero = 'hero';
		inner.Yaw = -Math.PI / 2;
		inner.Ground.Keys = {KeyW: true, ShiftLeft: true, AltLeft: true};

		frames(120);

		expect(Number(hero.Values.X)).toBeLessThan(3.1);
		expect(Number(hero.Values.X)).toBeGreaterThan(2);

		/* Along a wall, it goes on: it does not stick. */
		inner.Yaw = -Math.PI / 4 * 1;
		inner.Ground.Keys = {KeyW: true};

		var before = Number(hero.Values.Y);

		frames(30);

		expect(Math.abs(Number(hero.Values.Y) - before)).toBeGreaterThan(0.2);

		/* Up and down again. */
		inner.Ground.Keys = {Space: true};

		frames(1);

		inner.Ground.Keys = {};

		frames(6);

		expect(hero.Air).toBeGreaterThan(0.5);
		expect(hero.Pace).toBe('jump');

		frames(60);

		expect(hero.Air).toBeCloseTo(0, 2);
		expect(hero.Grounded).toBe(true);

		/* It faces the view and steps aside: the body does not turn to the way. */
		inner.Yaw = 0;
		inner.Ground.Keys = {};

		frames(60);

		inner.Ground.Keys = {KeyA: true};

		frames(10);

		/* Stepping aside, it looks where the view does, not where it goes. */
		expect(hero.Pace).toBe('strafe-left');
		expect(Math.cos(hero.Facing - (inner.Yaw + Math.PI))).toBeGreaterThan(0.98);

		/* Standing, a view that went far to the side brings the body round on the spot. */
		inner.Ground.Keys = {};
		inner.Yaw += 1.6;

		frames(120);

		expect(Math.cos(hero.Facing - (inner.Yaw + Math.PI))).toBeGreaterThan(0.98);
	});

	it('keeps a block of noise for a sampler3D', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var renderer = mounted.Space.Engine().Renderer;
		var gl = renderer.GL;
		var head = '#version 300 es\nprecision highp float;\nprecision highp sampler3D;\n';
		var made = renderer.Volume(2, new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255]));
		var program = renderer.Program(head + 'in vec3 aPosition;\nvoid main() {\n\tgl_Position = vec4(aPosition, 1.0);\n}', head + 'uniform sampler3D uBlock;\nout vec4 outColor;\nvoid main() {\n\toutColor = texture(uBlock, vec3(0.3));\n}');
		var mesh = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixel = new Uint8Array(4);

		renderer.Draw(mesh, program, {uBlock: made}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(gl.getError()).toBe(gl.NO_ERROR);
		expect(pixel[0]).toBeGreaterThan(200);

		made.Destroy();
		mesh.Destroy();
	});

	it('puts another picture into a texture, and draws an element of the page as it is styled', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var engine = mounted.Space.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var head = '#version 300 es\nprecision highp float;\n';
		var program = renderer.Program(head + 'in vec3 aPosition;\nvoid main() {\n\tgl_Position = vec4(aPosition, 1.0);\n}', head + 'uniform sampler2D uPicture;\nout vec4 outColor;\nvoid main() {\n\toutColor = texture(uPicture, vec2(0.5));\n}');
		var mesh = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixel = new Uint8Array(4);

		function filled (color) {
			var canvas = document.createElement('canvas');
			var context;

			canvas.width = 4;
			canvas.height = 4;
			context = canvas.getContext('2d');
			context.fillStyle = color;

			context.fillRect(0, 0, 4, 4);

			return canvas;
		}

		var texture = renderer.Texture(filled('#ff0000'));

		expect(texture.Update(filled('#00ff00'))).toBe(texture);

		renderer.Draw(mesh, program, {uPicture: texture}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(gl.getError()).toBe(gl.NO_ERROR);
		expect(Array.from(pixel).slice(0, 3)).toEqual([0, 255, 0]);

		/* An element, with the styles of its page on it: what it shows, in a canvas a texture takes. */
		var element = document.createElement('div');
		var sheet = document.createElement('style');

		/* The style is the page's, not the element's: the picture has none but what is written on its copy. */
		sheet.textContent = '.test-screen b { display: block; width: 32px; height: 16px; background: rgb(0, 0, 255); }';

		document.head.appendChild(sheet);

		element.className = 'test-screen';
		element.innerHTML = '<b></b>';

		document.body.appendChild(element);

		var canvas = await new Promise(function (done, fail) {
			engine.Rasterize(element, 64, 32, function (error, made) {
				if (error) fail(error);
				else done(made);
			});
		});

		element.remove();
		sheet.remove();

		expect(Array.from(canvas.getContext('2d').getImageData(4, 4, 1, 1).data)).toEqual([0, 0, 255, 255]);
		expect(canvas.getContext('2d').getImageData(48, 24, 1, 1).data[3]).toBe(0);

		texture.Update(canvas);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		texture.Destroy();
		mesh.Destroy();
	});

	it('moves the weather: fronts, a wind for all, what stays on the ground and the bolts of a storm', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var inner = scene.Scene();
		var now;
		var i;

		function step (seconds) {
			for (i = 0; i < seconds * 4; i++)
				now = engine.WeatherStep(0.25);

			return now;
		}

		scene.Weather = 'snow';

		/* The sky changes in seconds, the ground takes its time. */
		step(6);

		expect(now.Snow).toBeGreaterThan(0.9);
		expect(now.Cover).toBeLessThan(0.3);

		step(120);

		expect(now.Cover).toBeGreaterThan(0.9);

		scene.Weather = 'clear';

		step(6);

		expect(now.Snow).toBeLessThan(0.1);
		expect(now.Cover).toBeGreaterThan(0.6);

		/* Snow is gone in a minute: a clear sky does not stay white. */
		step(60);

		expect(now.Cover).toBeLessThan(0.05);

		scene.Weather = 'rain';

		step(4);

		expect(now.Wet).toBeLessThan(0.4);

		step(60);

		expect(now.Wet).toBeGreaterThan(0.9);

		/* The way of the wind goes for all, and it adds up: a stronger one goes on from where it was. */
		scene.Wind = 0;

		var still = [step(1).DriftX, now.PathX, inner.Gust];

		step(4);

		expect(now.DriftX).toBe(still[0]);
		expect(now.PathX).toBe(still[1]);
		expect(inner.Gust - still[2]).toBeCloseTo(2, 3);

		scene.Wind = 3;
		scene.WindWay = 90;

		var from = now.PathX;

		step(1);

		expect(now.Way[0]).toBeCloseTo(1, 5);
		expect(now.PathX - from).toBeCloseTo(7.2, 3);

		/* Past the rain, a bow. */
		scene.Wind = null;
		scene.Weather = 'clear';

		step(30);

		expect(now.Rainbow).toBeGreaterThan(0.8);

		/* A storm strikes. */
		var random = vi.spyOn(Math, 'random').mockReturnValue(0);

		scene.Weather = 'storm';

		step(6);

		expect(now.Flash).toBeGreaterThan(1);
		expect(now.Strike.Way).toBe(0);

		random.mockRestore();

		/* Changing, it goes on by itself. */
		scene.Weather = 'changing';
		scene.Front = 1;

		var kinds = {};

		for (var turn = 0; turn < 30; turn++) {
			step(30);

			kinds[Math.round(now.Rain * 10) + ':' + Math.round(now.Clouds * 10)] = true;
		}

		expect(Object.keys(kinds).length).toBeGreaterThan(2);
		expect(gameSceneSource).toContain("'fog', 'changing']");
	});

	it('casts the shadows of the clouds that are there, from a map of what they hold', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="medium" Weather="cloudy" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" /></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var air = {Layer: [100, 220, 0.011], From: [0, 10, 0]};
		var i;

		for (i = 0; i < 4; i++)
			engine.Frame(now += 100);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		var shade = engine.CloudShade(air, [0, 1, 0]);

		/* It draws them if this graphics card has the picture for it; along the way to the sun they move on the land. */
		if (shade.uCloudMap) {
			expect(shade.uCloudShade[3]).toBeGreaterThan(0.5);
			expect(engine.CloudShade(air, [0.6, 0.8, 0]).uCloudShade[0]).toBeGreaterThan(100);
		}

		expect(graphicsSource).not.toContain('sin((p.x + uCloudShade.z');
	});

	it('makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come', async function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var pictures = graphics.Work();
		var lands = Elemenx.Service('SceneTerrainGenerator').Work();
		var runs = {Pictures: pictures.Run, Lands: lands.Run};
		var held = [];
		var asked = 0;
		var mounted;

		pictures.Run = function (service, method, args, callback) {
			asked++;

			held.push([pictures, runs.Pictures, arguments]);
		};
		lands.Run = function (service, method, args, callback) {
			if (method === 'Piece' && args[3][3] === 128) {
				held.push([lands, runs.Lands, arguments]);

				return;
			}

			return runs.Lands.apply(this, arguments);
		};

		try {
			mounted = await mount('<Scene Paused="true" Quality="high" Weather="cloudy" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="10" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" /></Scene>');

			var scene = mounted.Space;
			var engine = scene.Engine();
			var inner = scene.Scene();
			var air = {Layer: [100, 220, 0.011], From: [0, 10, 0]};
			var now = performance.now() + 100;
			var empty;
			var i;

			inner.Loop.Stop();

			for (i = 0; i < 4; i++)
				engine.Frame(now += 100);

			empty = engine.NoiseBlock();

			expect(asked).toBe(1);
			expect(engine.NoiseBlock()).toBe(empty);
			expect(engine.CloudShade(air, [0, 1, 0]).uCloudMap).toBeUndefined();
			expect(engine.FieldOn()).toBe(true);
			expect(engine.GroundTopReady()).toBe(false);
			expect(inner.Ground.TopMesh).toBeUndefined();

			pictures.Run = runs.Pictures;
			lands.Run = runs.Lands;

			held.forEach(function (one) {
				one[1].apply(one[0], one[2]);
			});

			await waitFor(function () {
				engine.Frame(now += 100);

				return engine.NoiseBlock() !== empty && engine.GroundTopReady();
			}, 10000);

			engine.Frame(now += 100);

			expect(inner.Ground.TopMesh).toBeTruthy();
			expect(asked).toBe(1);

			/* It draws them if this graphics card has the picture for it. */
			if (engine.CloudShade(air, [0, 1, 0]).uCloudMap)
				expect(engine.CloudShade(air, [0, 1, 0]).uCloudShade[3]).toBeGreaterThan(0.5);

			/* The block of a worker is the very one of the page. */
			var block = null;

			pictures.Run('Renderer', 'CloudBlock', [6], function (error, data) {
				block = data;
			});

			await waitFor(function () {
				return block;
			}, 10000);

			expect(Array.from(block)).toEqual(Array.from(graphics.CloudBlock(6)));
		}
		finally {
			pictures.Run = runs.Pictures;
			lands.Run = runs.Lands;
		}
	});

	it('makes a body or what it holds glow by an effect that follows it, declared; mana rises in bubbles that the wind barely moves', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="g" />' +
			'<SceneObject ID="fx" Kind="effect" Type="glow" Follow="hero" Color="#7fd0ff" Appear="0" Offset="[0, 0.5, 0]" />' +
			'<SceneObject ID="bubbles" Kind="effect" Type="mana" Follow="hero" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var glows = [];
		var blown = [];
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		inner.Loop.Stop();

		scene.Add('unit', {ID: 'hero', Size: 1, X: 3, Y: 4});

		frames(3);

		/* Follow and Offset, as an attribute is written in a template: regression, they were read as follow and offset, and nothing followed. */
		expect(inner.Objects.fx.Values.Follow).toBe('hero');
		expect(inner.Objects.fx.Values.Offset).toEqual([0, 0.5, 0]);

		/* The body glows by its color, as bright as the effect is; what it holds does not, unless Where says so. */
		expect(inner.Objects.hero.Glow.Body).toBe(true);
		expect(inner.Objects.hero.Glow.Held).toBe(false);
		expect(inner.Objects.hero.Glow.Color.map(function (value) {
			return Math.round(value * 100) / 100;
		})).toEqual([0.5, 0.82, 1]);

		renderer.Draw = function (mesh, program, uniforms, settings) {
			if (uniforms && uniforms.uTime !== undefined && settings && settings.Depth === 'lequal')
				glows.push(settings.Blend);

			if (uniforms && uniforms.uBlow && (uniforms.uKind === 4 || uniforms.uKind === 3))
				blown.push([uniforms.uKind].concat(uniforms.uBlow));

			return draw.apply(this, arguments);
		};

		scene.Wind = 3;

		frames(40);

		renderer.Draw = draw;

		expect(Object.keys(inner.GlowLists).filter(function (name) {
			return inner.GlowLists[name].Count;
		}).length).toBeGreaterThan(0);
		expect(glows.length).toBeGreaterThan(0);
		expect(glows.every(function (blend) {
			return blend === 'add';
		})).toBe(true);

		/* Bubbles drift with the wind half as much as the motes of the same effect. */
		var bubble = blown.filter(function (each) {
			return each[0] === 4;
		}).pop();
		var mote = blown.filter(function (each) {
			return each[0] === 3;
		}).pop();

		expect(Math.hypot(mote[1], mote[2])).toBeGreaterThan(0.01);
		expect(Math.hypot(bubble[1], bubble[2]) / Math.hypot(mote[1], mote[2])).toBeCloseTo(0.5, 2);

		scene.Change('fx', {Where: 'held'});

		frames(2);

		expect(inner.Objects.hero.Glow).toMatchObject({Body: false, Held: true});
		expect(Object.keys(inner.GlowLists).filter(function (name) {
			return inner.GlowLists[name].Count;
		})).toEqual([]);

		scene.Remove('fx');

		frames(2);

		expect(inner.Objects.hero.Glow).toBe(null);
		expect(inner.EffectTypes.mana.Layers.filter(function (layer) {
			return layer.Kind === 'bubble';
		})[0].Wind).toBeLessThan(0.3);
	});

	it('draws a mirror as the world reflected by its plane, cut at it, and glass blended over what is behind it', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="1" Water="0" Seed="m" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var winding = renderer.Winding;
		var target = renderer.Target;
		var now = performance.now() + 100;
		var calls = [];
		var made = [];
		var turned = false;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		function clip (m, p) {
			return [0, 1, 2, 3].map(function (row) {
				return m[row] * p[0] + m[4 + row] * p[1] + m[8 + row] * p[2] + m[12 + row];
			});
		}

		inner.Loop.Stop();

		frames(3);

		/* A mirror ahead of the eye, turned to it; glass beside it that reflects nothing. */
		var x = inner.Target[0];
		var z = inner.Target[2];
		var yaw = Math.atan2(inner.Eye[0] - x, inner.Eye[2] - z) * 180 / Math.PI;

		scene.Add('mirror', {ID: 'm', X: x, Y: z, Width: 4, Height: 3, Lift: 1.5, Yaw: yaw});
		scene.Add('glass', {ID: 'g', X: x + 3, Y: z, Lift: 1.5, Yaw: yaw, Reflect: 0});

		renderer.Winding = function (clockwise) {
			turned = clockwise;

			calls.push({Winding: clockwise, Uniforms: {}, Settings: {}});

			return winding.apply(this, arguments);
		};
		renderer.Target = function () {
			var one = target.apply(this, arguments);
			var destroy = one.Destroy;

			one.Destroy = function () {
				one.Destroyed = true;

				return destroy.apply(this, arguments);
			};

			made.push(one);

			return one;
		};
		renderer.Draw = function (mesh, program, uniforms, settings) {
			calls.push({Turned: turned, Uniforms: uniforms || {}, Settings: settings || {}});

			return draw.apply(this, arguments);
		};

		try {
			frames(1);

			var mirror = inner.Objects.m;

			/* What the kinds have of their own, beside what was given. */
			expect(mirror.Traits.Mirror).toEqual({Width: 4, Height: 3, Yaw: yaw, Pitch: 0, Lift: 1.5, Tint: '#ffffff', Blur: 0, Strength: 0.92, Every: 1});
			expect(inner.Objects.g.Traits.Glass).toEqual({Width: 2, Height: 2, Yaw: yaw, Pitch: 0, Lift: 1.5, Tint: '#cfe6f0', Clarity: 0.88, Frost: 0, Reflect: 0});

			var pane = calls.filter(function (call) {
				return call.Uniforms.uStrength !== undefined;
			})[0];
			var glass = calls.filter(function (call) {
				return call.Uniforms.uClarity !== undefined;
			})[0];
			var reflected = calls.filter(function (call) {
				return call.Turned && call.Uniforms.uViewProjection;
			});
			var main = calls.filter(function (call) {
				return !call.Turned && call.Uniforms.uViewProjection && call.Uniforms.uStrength === undefined;
			}).pop().Uniforms.uViewProjection;

			/*
			 * The world was drawn once more, its triangles turned, into a picture of the part of the screen the mirror covers
			 * alone (Rect), half as fine as the screen, in steps of 32: the mirror shows it.
			 */
			var rect = made[0].Rect;

			function uncrop (p) {
				return [rect[0] + (p[0] / p[3] + 1) / 2 * (rect[2] - rect[0]), rect[1] + (p[1] / p[3] + 1) / 2 * (rect[3] - rect[1])];
			}

			expect(calls.filter(function (call) {
				return call.Winding !== undefined;
			}).map(function (call) {
				return call.Winding;
			})).toEqual([true, false]);
			expect(reflected.length).toBeGreaterThan(0);
			expect(made.length).toBe(1);
			expect(rect[2] - rect[0]).toBeLessThan(2);
			expect(made[0].Width).toBe(Math.min(2048, Math.max(32, Math.ceil((rect[2] - rect[0]) / 2 * renderer.Width * 0.5 / 32) * 32)));
			expect(made[0].Width % 32).toBe(0);
			expect(pane.Uniforms.uOn).toBe(1);
			expect(pane.Uniforms.uMirror).toBe(made[0].Textures[0]);
			expect(pane.Uniforms.uRect).toBe(rect);
			expect(pane.Uniforms.uSize).toEqual([4, 3]);

			/* What is on its plane is where the eye sees it; what stands before it shows where its reflection would be; what is behind it is cut away. */
			var vp = reflected[0].Uniforms.uViewProjection;
			var center = [x - inner.Eye[0], inner.Ground.Field.Height(x, z) + 1.5 - inner.Eye[1], z - inner.Eye[2]];
			var normal = [Math.sin(yaw * Math.PI / 180), 0, Math.cos(yaw * Math.PI / 180)];
			var on = [center[0] + normal[2] * 0.5, center[1] + 0.3, center[2] - normal[0] * 0.5];
			var before = [on[0] + normal[0], on[1], on[2] + normal[2]];
			var behind = [on[0] - normal[0], on[1], on[2] - normal[2]];
			var a = clip(vp, on);
			var b = clip(main, on);
			var c = clip(vp, before);
			var d = clip(main, behind);
			var e = clip(vp, behind);

			/* (The view of the eye shakes by less than a pixel from frame to frame; the picture of a mirror keeps still.) */
			expect(mirror.World).toBeTruthy();
			expect(uncrop(a)[0]).toBeCloseTo(b[0] / b[3], 2);
			expect(uncrop(a)[1]).toBeCloseTo(b[1] / b[3], 2);
			expect(uncrop(c)[0]).toBeCloseTo(d[0] / d[3], 2);
			expect(uncrop(c)[1]).toBeCloseTo(d[1] / d[3], 2);
			expect(Math.abs(c[2] / c[3])).toBeLessThan(1);
			expect(e[2] / e[3]).toBeLessThan(-1);

			/* Glass after the mirror, over what is behind it: its alpha, how glossy what is behind is, kept; nothing of the world for it. */
			expect(calls.indexOf(glass)).toBeGreaterThan(calls.indexOf(pane));
			expect(glass.Settings).toMatchObject({Blend: 'over', DepthWrite: false});
			expect(glass.Uniforms.uOn).toBe(0);

			/* Every: the picture made again only every so many frames. */
			scene.Change('m', {Every: 3});

			calls = [];

			frames(6);

			expect(calls.filter(function (call) {
				return call.Winding === true;
			}).length).toBe(2);

			/* Glass that reflects has a picture of its own; from behind a mirror there is none, and it is dark. */
			scene.Change('m', {Every: 1, Yaw: yaw + 180});
			scene.Change('g', {Reflect: 0.5});

			calls = [];

			frames(1);

			expect(made.length).toBe(2);
			expect(calls.filter(function (call) {
				return call.Uniforms.uStrength !== undefined;
			})[0].Uniforms.uOn).toBe(0);
			expect(calls.filter(function (call) {
				return call.Uniforms.uClarity !== undefined;
			})[0].Uniforms.uOn).toBe(1);

			/* What is no longer there lets its picture go. */
			scene.Remove('m');
			scene.Remove('g');

			frames(1);

			expect(made.every(function (one) {
				return one.Destroyed;
			})).toBe(true);
		}
		finally {
			renderer.Draw = draw;
			renderer.Winding = winding;
			renderer.Target = target;
		}
	});

	it('lights the world with the lamps a model carries, unless it is told not to', async function () {
		var library = Elemenx.Service('SceneModels');
		var mounted;

		library.Define('test-beacon', {Build: library.Recipes.crystal.Build});

		mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="23" /></Scene>');

		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var made = library.Make('test-beacon');

		made.Lamps = [{Place: [0, 0.5, 0], Color: [0, 0, 1], Power: 0.5, Radius: 4, Spot: 0, Aim: [0, -1, 0]}];

		scene.Add('thing', {ID: 'beacon', Model: 'test-beacon', Size: 2, X: 5, Y: 3});

		engine.Frame(performance.now() + 100);
		engine.Frame(performance.now() + 200);

		var lamp = inner.Lamps.filter(function (each) {
			return each.Built;
		})[0];

		expect(lamp.At[0]).toBeCloseTo(5, 3);
		expect(lamp.At[2]).toBeCloseTo(3, 3);
		expect(lamp.Settings.Radius).toBe(8);
		expect(lamp.Color).toEqual([0, 0, 1]);

		scene.Change('beacon', {Lights: false});

		engine.Frame(performance.now() + 300);

		expect(inner.Lamps.filter(function (each) {
			return each.Built;
		}).length).toBe(0);

		delete library.Recipes['test-beacon'];

		/* A lamp of a large map reaches as far as its radius; those of a few metres stay as they were. */
		expect(graphicsSource).toContain('far * far * 0.25 * min(1.0, 400.0 / (place.w * place.w))');
	});

	it('takes the color out of a wet day and melts what is far into its sky', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="medium" Weather="clear" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" /></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var inner = scene.Scene();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var i;

		function step (seconds) {
			for (i = 0; i < seconds * 4; i++)
				engine.WeatherStep(0.25);

			engine.Frame(now += 100);
			engine.Frame(now += 100);

			return inner.Ground;
		}

		var clear = step(6);
		var light = clear.SkyLight[2];
		var air = clear.AirLight;
		var blue = clear.AirTint[2] - clear.AirTint[0];

		scene.Weather = 'rain';

		var wet = step(30);

		/* Clouds take the sky off the land and the blue out of the air. */
		expect(wet.SkyLight[2]).toBeLessThan(light * 0.8);
		expect(wet.AirLight).toBeLessThan(air * 0.7);
		expect(wet.AirTint[2] - wet.AirTint[0]).toBeLessThan(blue * 0.3);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		/* The bellies of the clouds and what stands far off go to one tone. */
		expect(gameSceneSource).toContain('Haze: hazeOf(ground)');
		expect(lightingSource).toContain('tone = mix(tone, uHaze.rgb');
		expect(lightingSource).toContain('min(0.96, uVeil * 2.4) * exp(-max(ray.y, 0.0) * 5.0)');

		/* Rain makes rings on what stands, where water stands. */
		expect(gameSceneSource).toContain('float rings(vec2 p, float t)');
	});

	it('softens a shadow with the distance of what casts it, and opens the view as an eye does', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" /><SceneObject ID="hero" Kind="unit" X="0" Y="0" /></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var map = renderer.Shadow(64);
		var now = performance.now() + 100;
		var i;

		/* A shadow map is read two ways: compared, and as its depths. */
		expect(map.Raw.Handle).toBe(map.Handle);
		expect(gl.getSamplerParameter(map.Raw.Sampler, gl.TEXTURE_COMPARE_MODE)).toBe(gl.NONE);

		for (i = 0; i < 4; i++)
			engine.Frame(now += 100);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		scene.Exposure = 1.4;

		engine.Frame(now += 100);

		expect(gl.getError()).toBe(gl.NO_ERROR);
		expect(graphicsSource).toContain('float softIn(highp sampler2DShadow map, sampler2D raw');
		expect(lightingSource).toContain('clamp(0.3 / exp(texture(uEye, vec2(0.5)).r), 0.8, 1.35)');
		expect(lightingSource).toContain('float gap = length(at) - length(place(suv));');
	});

	it('burns where it is told: effects with their lamps, those of a body, bursts that end, types of its own', async function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var mounted = await mount('<Scene Paused="true" Quality="medium" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="23" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;

		function frame () {
			engine.Frame(now += 100);

			expect(gl.getError()).toBe(gl.NO_ERROR);
		}

		function lamps () {
			return inner.Lamps.filter(function (lamp) {
				return lamp.Effect;
			});
		}

		frame();

		['campfire', 'torch', 'spark', 'smoke', 'steam', 'dust', 'exhaust'].forEach(function (type, index) {
			scene.Add('effect', {ID: 'fx-' + type, Type: type, X: index * 3, Y: 0});
		});

		frame();

		expect(engine.EffectsCount()).toBe(7);

		/* What burns lights what is round it; sparks, smoke and steam do not. */
		expect(lamps().length).toBe(3);

		var lamp = lamps().filter(function (each) {
			return each.At[0] === 0;
		})[0];

		expect(lamp.Settings.Radius).toBe(10);
		expect(lamp.Color[0]).toBeGreaterThan(lamp.Color[2]);

		/* Without its light, or out, or with no such type, it is not there. */
		scene.Change('fx-campfire', {Light: false});

		frame();

		expect(lamps().length).toBe(2);

		scene.Change('fx-torch', {On: false});
		scene.Add('effect', {ID: 'fx-none', Type: 'nothing'});

		frame();

		expect(engine.EffectsCount()).toBe(6);

		/* A burst lights the place for a moment, and is over. */
		expect(scene.Burst('nothing', [0, 0, 0])).toBe(false);
		expect(scene.Burst('explosion', [20, 1, 0], {Size: 2})).toBe(true);

		frame();

		expect(engine.EffectsCount()).toBe(7);

		var flash = lamps().filter(function (each) {
			return each.At[0] === 20;
		})[0];

		expect(flash.Settings.Radius).toBe(52);

		inner.Seconds += 10;

		frame();

		expect(engine.EffectsCount()).toBe(6);

		/* A type of its own goes by the same way. */
		scene.Effects({glow: {Lamp: null, Layers: [{Kind: 'spark', Count: 4, Life: 1, Speed: [1, 2], Spread: 0.5, Size: [0.1, 0.1], Color: [1, 1, 1], Blend: 'add'}]}});
		scene.Add('effect', {ID: 'fx-glow', Type: 'glow'});

		frame();

		expect(engine.EffectsCount()).toBe(7);

		/* What goes with a body goes where it is. */
		scene.Add('unit', {ID: 'hero', X: 30, Y: 0});
		scene.Add('effect', {ID: 'fx-jet', Type: 'exhaust', Follow: 'hero', Offset: [0, 1, 0]});

		frame();

		var jet = lamps().filter(function (each) {
			return each.At[0] === 30;
		})[0];

		expect(jet.At[1]).toBeCloseTo(inner.Objects.hero.World[1] + 1 + 0.5, 3);

		/* The air over what burns trembles, and particles leave the gloss of what is behind them alone. */
		expect(engine.EffectHeat(math.Identity(), 1).length).toBe(16);
		expect(effectsSource).toContain('renderer.GL.colorMask(true, true, true, false);');
	});

	it('makes a sky of a seed, a face a frame, the same for the same seed, and gives it to the shade of bodies', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var i;

		function frames (count) {
			for (i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 100);
			}
		}

		frames(1);

		expect(engine.CosmosReady()).toBe(false);
		expect(inner.CosmosShade || null).toBe(null);

		scene.Cosmos = 'nebula';

		/* Six faces, one each frame: no frame waits for all of them. */
		frames(3);

		expect(engine.CosmosReady()).toBe(false);

		frames(4);

		expect(engine.CosmosReady()).toBe(true);
		expect(inner.CosmosShade[0]).toBeGreaterThan(0);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		/* A sky already made is not made again; another one is. */
		scene.Cosmos = 'nebula';

		frames(1);

		expect(engine.CosmosReady()).toBe(true);

		scene.Cosmos = {Kind: 'galaxy', Seed: 'other', Colors: ['#000000', '#101010', '#808080', '#ffffff']};

		frames(1);

		expect(engine.CosmosReady()).toBe(false);

		frames(7);

		expect(engine.CosmosReady()).toBe(true);
		expect(inner.CosmosShade[0]).toBeCloseTo(16 / 255 * 0.03, 5);

		scene.Cosmos = '';

		frames(1);

		expect(inner.CosmosShade).toBe(null);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		/* Baking one face leaves the others, and the mips wait for the last. */
		expect(graphicsSource).toContain('if (only === undefined || only === 5 && (!strip || strip[0] === strip[1] - 1))');
	});

	it('hides the sun behind the clouds of a wet day, its glare and its rays too', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="medium" Weather="clear" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" /></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var inner = scene.Scene();
		var now = performance.now() + 100;
		var i;

		function weather (name) {
			scene.Weather = name;

			for (i = 0; i < 40; i++)
				engine.WeatherStep(0.25);

			engine.Frame(now += 100);
			engine.Frame(now += 100);

			return inner.Ground;
		}

		var clear = weather('clear');
		var sun = clear.SunColor[0];

		expect(clear.Shut).toBe(0);
		expect(clear.Glare).toBe(1);

		var cloudy = weather('cloudy');

		expect(cloudy.Shut).toBeGreaterThan(0);
		expect(cloudy.Shut).toBeLessThan(0.6);
		expect(cloudy.SunColor[0]).toBeGreaterThan(sun * 0.4);

		['overcast', 'rain', 'storm'].forEach(function (name) {
			var wet = weather(name);

			expect(wet.Shut).toBeGreaterThan(0.85);
			expect(wet.Glare).toBeLessThan(0.15);
			expect(wet.SunColor[0]).toBeLessThan(sun * 0.15);
		});

		/* How much of the sun is seen is read with the clouds before it, over frames: a leaf does not flash it. */
		expect(lightingSource).toContain('float now = seen / 8.0 * (1.0 - shut / 8.0) *');
		expect(lightingSource).toContain('uMix: state.SunlitOn ? 0.14 : 1');
		expect(lightingSource).toContain('var spot = math.Apply(view.Plain || view.Matrix, sun);');
		/* The light round the sun goes with the clouds: in the sky of the library, a graph now (LibrarySky, its SkyHalo). */
		expect(Elemenx.Service('Blueprints').Compile(scene.LibrarySky()).Function).toMatch(/smoothstep\(-0\.12, 0\.02, [^)]+\) \* \(1\.0 - uCover\)\)/);
	});

	it('does what hangs on the depth before the frames add up, so no edge trembles with the shake of the view', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" Weather="fog" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" /></Scene>');
		var engine = mounted.Space.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var i;

		for (i = 0; i < 4; i++)
			engine.Frame(now += 100);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		var air = lightingSource.indexOf('pass(state.Aired, frame.Run.Air, {');
		var frames = lightingSource.indexOf('pass(state.Now, frame.Run.Frames, {');
		var order = Elemenx.Service('Blueprints').Compile(mounted.Space.PipelineGraph()).Passes.map(function (pass) {
			return pass.Type;
		});

		expect(air).toBeGreaterThan(0);
		expect(air).toBeLessThan(frames);

		/* The passes run in the order of the pipeline: the air before the frames add up. */
		expect(order.indexOf('Air')).toBeLessThan(order.indexOf('Frames'));

		/* The picture has no depth of its own to read any more. */
		var picture = lightingSource.slice(lightingSource.indexOf('Picture: head + ['));

		expect(picture.slice(0, picture.indexOf('].join'))).not.toContain('uDepth');

		/* What is not a number once would stay in the eye for good, and the colors of a frame may fall under zero. */
		expect(lightingSource).toContain('if (!(old > -9.0)) old = seen;');
		expect(lightingSource).toContain('(bright > 0.0 ? min(bright, 100.0) : 0.0)');
	});

	it('lets go of neither a hero nor the view on Escape, and takes no leap of the pointer', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(2);

		scene.Control('hero');

		frames(4);

		var wanted = inner.Wanted;
		var yaw = inner.Yaw;

		scene.Key({key: 'Escape', code: 'Escape', preventDefault: function () {}, target: scene.$Element()});

		frames(2);

		expect(inner.Focus).toBe('hero');
		expect(inner.Wanted).toBe(wanted);
		expect(inner.Yaw).toBe(yaw);
		expect(inner.Ground.Keys.Escape).toBe(undefined);

		/* Without a hero it lets the object go, as it did. */
		inner.Hero = '';

		scene.Key({key: 'Escape', code: 'Escape', preventDefault: function () {}, target: scene.$Element()});

		expect(inner.Focus).toBe('');

		inner.Hero = 'hero';

		var captured = scene.Captured;
		var event = {movementX: 900, movementY: 0, pointerId: 1, clientX: 0, clientY: 0};

		scene.Captured = function () {
			return true;
		};

		scene.PointerMove(event);

		expect(inner.Yaw).toBe(yaw);

		event.movementX = 100;

		scene.PointerMove(event);

		expect(inner.Yaw).toBeCloseTo(yaw - 0.35, 5);

		scene.Captured = captured;
	});

	it('never lets a hero out of the view, and ends a press when the pointer is taken or given back', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});
		scene.Add('unit', {ID: 'other', X: 8, Y: 8});

		function frames (count) {
			for (i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(2);

		scene.Control('hero');

		frames(4);

		/* Shift and a drag, or the middle button, carry a view, but not away from a hero. */
		engine.PanView(100, 0);

		expect(inner.Focus).toBe('hero');

		var at = {X: 10, Y: 10};
		var local = engine.Local;

		engine.Local = function () {
			return at;
		};

		var pressed = {pointerId: 3, button: 0, shiftKey: true, target: {}, preventDefault: function () {}};

		inner.Hero = '';

		scene.PointerDown(pressed);

		expect(inner.Drag.Pan).toBe(true);

		scene.PointerCancel(pressed);

		inner.Hero = 'hero';

		scene.PointerDown(pressed);

		expect(inner.Drag.Pan).toBe(false);

		/* Taken or given back, the press is over: the next move has no place of a press to turn the view back to. */
		inner.Drag.Moved = true;
		inner.Yaw += 1;

		var yaw = inner.Yaw;

		document.dispatchEvent(new Event('pointerlockchange'));

		expect(inner.Drag).toBe(null);

		at = {X: 300, Y: 10};

		scene.PointerMove({pointerId: 3, movementX: 0, movementY: 0});

		expect(inner.Yaw).toBe(yaw);

		scene.PointerCancel(pressed);

		engine.Local = local;

		/* A double click on another object leaves the view with the hero. */
		var pick = engine.Pick;

		engine.Pick = function () {
			return 'other';
		};

		scene.Double({clientX: 0, clientY: 0});
		scene.LabelDouble({target: {closest: function () {
			return {getAttribute: function () {
				return 'other';
			}};
		}}});

		engine.Pick = pick;

		expect(inner.Focus).toBe('hero');

		/* If focus goes for another reason, the view still goes after the hero. */
		inner.Focus = '';
		inner.Objects.hero.Values.X = 30;
		inner.Overrides.hero = {Values: {X: 30, Y: 0}};

		frames(4);

		expect(inner.Ground.Target[0]).toBeGreaterThan(5);

		/* The same hero under the same name, as another body: the view stays. */
		inner.Pitch = 0.7;
		inner.Wanted = 9;

		scene.Control('hero');

		expect(inner.Pitch).toBe(0.7);
		expect(inner.Wanted).toBe(9);
	});

	it('stands the view of a walker behind it, in its eyes or over its shoulder, and V goes through them with the pointer taken', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var heard = '';
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(2);

		scene.Control('hero');

		inner.Yaw = 0;
		inner.Pitch = 0.2;

		frames(20);

		var hero = inner.Objects.hero;
		var behind = inner.Camera.Position.slice();

		expect(scene.Person).toBe('third');
		expect(behind[2]).toBeGreaterThan(hero.World[2] + 1);

		/* In its eyes: over its body, a little ahead, and it looks where the view looks, the body turned with it. */
		scene.Person = 'first';
		inner.Yaw = 1;

		frames(1);

		expect(inner.Inside).toBeLessThan(0.5);

		frames(30);

		expect(inner.Inside).toBeGreaterThan(0.99);
		expect(Math.abs(inner.Camera.Position[0] - hero.World[0])).toBeLessThan(hero.Size * 0.2);
		expect(inner.Camera.Position[1]).toBeGreaterThan(hero.World[1] + hero.Size * 0.8);
		expect(Math.cos(hero.Facing - (inner.Yaw + Math.PI))).toBeGreaterThan(0.98);

		var ahead = [inner.Camera.Target[0] - inner.Camera.Position[0], inner.Camera.Target[1] - inner.Camera.Position[1], inner.Camera.Target[2] - inner.Camera.Position[2]];

		expect(ahead[0]).toBeLessThan(0);
		expect(ahead[1]).toBeLessThan(0);

		/* A small turn of the view, that a body standing behind it would not follow, it follows. */
		inner.Yaw += 0.5;

		frames(20);

		expect(Math.cos(hero.Facing - (inner.Yaw + Math.PI))).toBeGreaterThan(0.999);

		/* It looks up as far as it likes: the ground does not hold the view there. */
		inner.Pitch = -1;

		frames(3);

		expect(inner.Pitch).toBe(-1);
		expect(inner.Camera.Target[1]).toBeGreaterThan(inner.Camera.Position[1]);

		/* Its head is not drawn, near the eye: the shadow pass has no such cut. */
		expect(gameSceneSource).toContain("'	if (uCut.w > 0.0 && distance(vWorld, uCut.xyz) < uCut.w) discard;',");

		/* Over the shoulder: nearer and to the right of it. */
		inner.Pitch = 0.2;
		inner.Yaw = 0;
		scene.Person = 'shoulder';

		frames(30);

		expect(inner.Inside).toBeLessThan(0.01);
		expect(inner.Aside).toBeGreaterThan(0.99);
		expect(inner.Camera.Target[0]).toBeGreaterThan(hero.World[0] + hero.Size * 0.3);
		expect(inner.Camera.Position[2] - hero.World[2]).toBeLessThan((behind[2] - hero.World[2]) * 0.7);

		/* V goes on only while the pointer is taken. */
		var captured = scene.Captured;

		scene.$On('person', function (person) {
			heard = person;
		});

		var press = {code: 'KeyV', key: 'v', target: scene.$Element(), preventDefault: function () {}};

		scene.Key(press);

		expect(scene.Person).toBe('shoulder');

		scene.Captured = function () {
			return true;
		};

		scene.Key(press);

		expect(scene.Person).toBe('third');
		expect(heard).toBe('third');

		scene.Key(press);

		expect(scene.Person).toBe('first');

		scene.Key(Object.assign({}, press, {repeat: true}));

		expect(scene.Person).toBe('first');

		scene.Captured = captured;
	});

	it('shows the axes of a view in a corner, and a press on one looks along it', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" Axes="bottom-left" Origin="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		var lines = 0;
		var draw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uBody && uniforms.uColor && uniforms.uColor[3] === 1)
				lines++;

			return draw.apply(this, arguments);
		};

		frames(2);

		engine.Renderer.Draw = draw;

		expect(lines).toBe(6);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		inner.Yaw = 0.7;
		inner.Pitch = 0.3;

		frames(1);

		await tick();

		var corner = scene.$Element().querySelector('.elemenx-scene-axes-place');

		expect(corner.getAttribute('data-corner')).toBe('bottom-left');
		expect(scene.ViewYaw).toBe(0.7);

		var ends = corner.querySelectorAll('.elemenx-scene-axes-end');

		expect(ends.length).toBe(6);

		corner.querySelector('.elemenx-scene-axes-x.near').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(inner.Yaw).toBeCloseTo(Math.PI / 2, 5);
		expect(inner.Pitch).toBe(0);

		corner.querySelector('.elemenx-scene-axes-z.other').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(inner.Yaw).toBeCloseTo(Math.PI, 5);

		corner.querySelector('.elemenx-scene-axes-y.near').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(inner.Pitch).toBe(1.5);
	});

	it('Axes draws each end where the view has it, the nearest over the others', async function () {
		var axes = Elemenx.Component('SceneAxes')({Yaw: 0, Pitch: 0});

		document.getElementById('mount').appendChild(axes.$Element());

		await tick();

		var ends = axes.Ends(0, 0);
		var last = ends[ends.length - 1];

		/* From Z at no height: Z comes at the eye, X goes to the right, Y up. */
		expect(last.Axis).toBe('Z');
		expect(last.Sign).toBe(1);
		expect(ends.filter(function (end) {
			return end.Axis === 'X' && end.Sign === 1;
		})[0].X).toBeCloseTo(36, 5);
		expect(ends.filter(function (end) {
			return end.Axis === 'Y' && end.Sign === 1;
		})[0].Y).toBeCloseTo(-36, 5);

		/* From above Y comes at the eye. */
		ends = axes.Ends(0, Math.PI / 2);

		expect(ends[ends.length - 1].Axis).toBe('Y');

		var heard = [];

		axes.$On('axis', function (event) {
			heard.push(event);
		});

		axes.$Element().querySelector('.elemenx-scene-axes-x.other').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(heard[0]).toEqual({Axis: 'X', Sign: -1});
		expect(axes.$Element().querySelectorAll('text').length).toBe(3);

		axes.$Destroy();
	});

	it('gives a triangle whose normals look away from it corners of its own, and leaves the rest', function () {
		var gltf = Elemenx.Service('Gltf');

		/* Three faces wound against their normals, as the file says, and one whose corner has a normal off its face. */
		var plain = {Positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 0, 0, 3, 0, 0, 2, 0, 1, 4, 0, 0, 5, 0, 0, 4, 0, 1, 6, 0, 0, 7, 0, 0, 6, 0, 1]), Normals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), UVs: new Float32Array(24), Colors: null, Indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]};

		plain.Positions[1] = 0;

		var same = gltf.Mended(plain);

		expect(same).toBe(plain);

		var bad = Object.assign({}, plain, {Normals: plain.Normals.slice(), Indices: plain.Indices.slice()});

		bad.Normals[27] = 1;
		bad.Normals[28] = 0;

		var made = gltf.Mended(bad);

		expect(made.Positions.length).toBe(plain.Positions.length + 9);
		expect(made.Indices.slice(0, 9)).toEqual(plain.Indices.slice(0, 9));
		expect(made.Indices.slice(9)).toEqual([12, 13, 14]);
		expect(made.Normals[12 * 3 + 1]).toBeCloseTo(made.Normals[1], 5);
		expect(made.Positions[12 * 3]).toBe(6);
		expect(bad.Normals[28]).toBe(0);
	});

	it('keeps a normal smoothed over an edge on its side, and turns one that truly looks away', function () {
		expect(gameSceneSource).toContain("'	if (dot(n, v) < -0.3) n = -n;',");
	});

	it('puts a new character where the last one stands, not where it started', function () {
		expect(pageSource).toContain('Z: hero.Air === undefined ? hero.Values.Z : hero.Air');
	});

	it('ends every press when the pointer goes, and takes back the leap that came just before', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var captured = scene.Captured;
		var locked = Object.getOwnPropertyDescriptor(Document.prototype, 'pointerLockElement');

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});

		/* A button let go outside stays among the pointers, and the next press would count as a second finger. */
		inner.Pointers = {7: {X: 1, Y: 1}};
		inner.Pinch = {};

		document.dispatchEvent(new Event('pointerlockchange'));

		expect(Object.keys(inner.Pointers).length).toBe(0);
		expect(inner.Pinch).toBe(null);

		inner.Yaw = 0.5;
		inner.Pitch = 0.2;
		inner.LockAt = 0;
		inner.Looks = [];
		inner.Flow = 20;

		scene.Captured = function () {
			return true;
		};

		var event = {movementX: 300, movementY: 0, pointerId: 1, clientX: 0, clientY: 0};

		/* Far more than the hand was moving: a leap, though under the limit. */
		scene.PointerMove(event);

		expect(inner.Yaw).toBe(0.5);

		event.movementX = 20;

		scene.PointerMove(event);

		expect(inner.Yaw).toBeCloseTo(0.43, 5);

		/* Right after the pointer is taken nothing counts. */
		inner.LockAt = performance.now();
		inner.Yaw = 1;

		scene.PointerMove(event);

		expect(inner.Yaw).toBe(1);

		/* What was moved in the last moments before it went is undone. */
		var now = performance.now();

		inner.Looks = [{At: now - 400, Yaw: 2, Pitch: 0.1}, {At: now - 20, Yaw: 5, Pitch: 0.9}];
		inner.Yaw = 5;

		document.dispatchEvent(new Event('pointerlockchange'));

		expect(inner.Yaw).toBe(2);
		expect(inner.Pitch).toBe(0.1);

		scene.Captured = captured;

		expect(locked.get.call(document)).toBe(null);
	});

	it('chooses the lamps with shadows by what the view follows, so coming close changes nothing', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});
		scene.Add('light', {ID: 'near-hero', X: 3, Y: 0, Height: 2, Radius: 8, Power: 0.3});
		scene.Add('light', {ID: 'near-eye', X: 0, Y: 18, Height: 2, Radius: 8, Power: 0.3});
		scene.Add('light', {ID: 'off', X: 1, Y: 0, Height: 2, Radius: 8, Power: 0});

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(2);

		scene.Control('hero');

		inner.Yaw = 0;
		inner.Wanted = inner.Distance = 19;

		frames(3);

		expect(inner.Lamps[0].Object.ID).toBe('near-hero');
		expect(inner.Lamps.filter(function (lamp) {
			return lamp.Object.ID === 'off';
		}).length).toBe(0);
	});

	it('quiets the moon: it lights less than it did, and a night holds its colors back', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="0" Latitude="20" DayOfYear="100" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		scene.Engine().Frame(performance.now() + 100);

		expect(inner.Ground.Night).toBe(1);
		expect(gameSceneSource).toContain('[0.045 * night * glow, 0.058 * night * glow, 0.095 * night * glow]');
		expect(lightingSource).toContain('open = mix(open, 1.0, uNight);');
		expect(gameSceneSource).toContain('scene.Ground.Night > 0.5 ? 0.05 : 0.012');
	});

	it('goes over the other shoulder, and B says so with the pointer taken', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" Person="shoulder" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var heard = '';

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});
		scene.$On('shoulder', function (side) {
			heard = side;
		});

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(2);

		scene.Control('hero');

		inner.Yaw = 0;

		frames(30);

		var hero = inner.Objects.hero;

		expect(inner.Camera.Target[0]).toBeGreaterThan(hero.World[0] + hero.Size * 0.3);

		var captured = scene.Captured;

		scene.Captured = function () {
			return true;
		};

		scene.Key({code: 'KeyB', key: 'b', target: scene.$Element(), preventDefault: function () {}});

		scene.Captured = captured;

		expect(scene.Shoulder).toBe('left');
		expect(heard).toBe('left');

		frames(30);

		expect(inner.Camera.Target[0]).toBeLessThan(hero.World[0] - hero.Size * 0.3);
	});

	it('draws every effect of magic, and what is told of a circle turns it', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="medium" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="20" Latitude="20" DayOfYear="100" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var rings = [];
		var draw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uRingCount)
				rings.push(uniforms.uRingsMore[0]);

			return draw.apply(this, arguments);
		};

		function frame () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			expect(gl.getError()).toBe(gl.NO_ERROR);
		}

		frame();

		['aura', 'circle', 'portal', 'shield', 'lightning', 'healing', 'frost', 'poison', 'beam', 'pillar'].forEach(function (type, index) {
			scene.Add('effect', {ID: 'fx' + index, Type: type, X: index * 3 - 12, Y: -4, Size: 1.5, Width: 2, Length: 2});
		});

		expect(scene.Burst('teleport', [0, 1, -8], {Size: 1})).toBe(true);
		expect(scene.Burst('fireball', [0, 2, -8], {Size: 1, Aim: [1, 0, 0]})).toBe(true);

		frame();
		frame();

		expect(rings.length).toBeGreaterThan(5);

		/* What flies ends in what it says. */
		var count = engine.EffectsCount();

		now += 2800;
		inner.Seconds += 2.7;

		frame();

		expect(engine.EffectsCount()).toBe(count - 1);
		expect(inner.EffectTypes.fireball.Then).toBe('explosion');

		/* A ring of a circle told its own speed, and none. */
		rings.length = 0;

		scene.Add('effect', {ID: 'told', Type: 'circle', X: 30, Y: 30, Size: 1, Rings: [{Kind: 'double', Radius: 0.9, Speed: 0, Phase: 0.25}], Spin: 3});

		frame();

		expect(rings[rings.length - 1] === undefined || rings.some(function (turn) {
			return Math.abs(turn - Math.PI / 2) < 1e-6;
		})).toBe(true);

		engine.Renderer.Draw = draw;
	});

	it('Sigils makes circles of a seed, the same each time, whose rings turn apart', function () {
		var sigils = Elemenx.Service('Sigils');
		var one = sigils.Make('a');
		var other = sigils.Make('b');

		expect(sigils.Make('a')).toEqual(one);
		expect(JSON.stringify(other)).not.toBe(JSON.stringify(one));
		expect(one.Rings.length).toBeGreaterThanOrEqual(6);
		expect(one.Rings.length).toBeLessThanOrEqual(sigils.Most);
		expect(one.Rings[0].Speed * one.Rings[1].Speed).toBeLessThan(0);

		var told = sigils.Make('c', {Layout: [{Kind: 'star', Count: 5, Step: 2, Speed: 0.25, Phase: 0, Radius: 0.5}, {Kind: 'runes'}]});

		expect(told.Rings.length).toBe(2);
		expect(told.Rings[0].Kind).toBe('star');
		expect(told.Rings[1].Kind).toBe('runes');
		expect(told.Rings[1].Speed).not.toBe(0);

		var moved = sigils.Uniforms(told, 1, 1);

		expect(moved.uRingCount).toBe(2);
		expect(moved.uRings.length).toBe(48);
		expect(moved.uRings.slice(0, 4)).toEqual([0.5, told.Rings[0].Width, 6, 5]);
		expect(moved.uRingsMore[0]).toBeCloseTo(Math.PI / 2, 6);
		expect(sigils.Uniforms(told, 1, 2).uRingsMore[0]).toBeCloseTo(Math.PI, 6);
		expect(sigils.Make('d', {Rings: 4}).Rings.length).toBe(4);
	});

	it('Physics runs steps of one length, whatever the frames are, and blends what shows', function () {
		var physics = Elemenx.Service('Physics');
		var clock = {};
		var steps = 0;
		var part;

		part = physics.Steps(clock, 0.025, 0.01, function (length) {
			expect(length).toBe(0.01);

			steps++;
		});

		expect(steps).toBe(2);
		expect(part).toBeCloseTo(0.5, 6);

		/* A long stop of the page does not run away. */
		steps = 0;

		physics.Steps(clock, 100, 0.01, function () {
			steps++;
		});

		expect(steps).toBe(40);
		expect(clock.Left).toBe(0);

		expect(physics.Blend(1, 3, 0.5)).toBe(2);
		expect(physics.Blend([0, 2], [2, 4], 0.25)).toEqual([0.5, 2.5]);

		/* A spring comes to rest at its target. */
		var spring = [0, 0];
		var i;

		for (i = 0; i < 2000; i++)
			spring = physics.Spring(spring[0], spring[1], 1, 100, 14, 0.005);

		expect(spring[0]).toBeCloseTo(1, 4);
		expect(spring[1]).toBeCloseTo(0, 4);
	});

	it('Physics shifts the gears of a car: up near the red line, without drive while it changes, into reverse when stopped and asked back, by hand with a manual', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};
		var settings = {Gears: [0.3, 0.5, 0.7, 1], Redline: 7000, Idle: 800, ShiftTime: 0.25};
		var state = {X: 0, Z: 0, Heading: 0, Forward: 0, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
		var seen = [];
		var cut = 0;
		var free = null;
		var i;

		function step (input, own) {
			var before = state.Forward;

			physics.Car(state, input, flat, own || settings, 1 / 120);

			return state.Forward - before;
		}

		/* Up it goes one gear at a time, each near the red line, with no drive while it changes. */
		for (i = 0; i < 120 * 14; i++) {
			var gained = step({Gas: true});

			if (seen[seen.length - 1] !== state.Gear)
				seen.push(state.Gear);

			if (state.Shifting > 0 && state.Shifted === 1 && gained > 0)
				cut++;

			expect(state.Rpm).toBeLessThanOrEqual(7000 * 1.01);
		}

		expect(seen).toEqual([1, 2, 3, 4]);
		expect(cut).toBe(0);
		expect(state.Rpm).toBeGreaterThan(3000);

		/* Without Gears there is no gearbox: the engine gives its power at any speed, as it did. */
		var plain = {X: 0, Z: 0, Heading: 0, Forward: 0, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};

		for (i = 0; i < 120; i++)
			physics.Car(plain, {Gas: true}, flat, {}, 1 / 120);

		expect(plain.Gear).toBeUndefined();

		/* Brought to rest and asked back, an automatic goes into reverse; with the gas again, into first. */
		for (i = 0; i < 120 * 20 && (state.Forward > 0.1 || state.Gear !== -1); i++)
			step({Brake: true});

		expect(state.Gear).toBe(-1);

		for (i = 0; i < 120; i++)
			step({Brake: true});

		expect(state.Forward).toBeLessThan(-0.5);

		for (i = 0; i < 120 * 4 && state.Gear !== 1; i++)
			step({Gas: true});

		expect(state.Gear).toBe(1);

		/* A manual stays where it is put: up a press at a time, down past first to neutral, where the gas only revs it. */
		var manual = Object.assign({}, settings, {Shift: 'manual'});

		state.Forward = 0;
		state.Gear = 1;
		state.Shifting = 0;

		step({ShiftUp: true}, manual);

		expect(state.Gear).toBe(2);
		expect(state.Shifted).toBe(1);

		step({ShiftDown: true}, manual);
		step({ShiftDown: true}, manual);

		expect(state.Gear).toBe(0);

		for (i = 0; i < 120; i++)
			free = step({Gas: true}, manual);

		expect(free).toBeLessThanOrEqual(0);
		expect(state.Rpm).toBeGreaterThan(6000);
	});

	it('Physics drives a car: slowed by grass, on its springs, leaning as it goes', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};
		var grass = function () {
			return {Height: 0, Grip: 0.55, Drag: 0.55};
		};

		function fresh () {
			return {X: 0, Z: 0, Heading: 0, Forward: 0, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
		}

		function run (state, input, surface, seconds) {
			var i;

			for (i = 0; i < seconds * 120; i++)
				physics.Car(state, input, surface, {}, 1 / 120);

			return state;
		}

		/* It speeds up, less and less, towards what it can do. */
		var car = run(fresh(), {Gas: true}, flat, 2);
		var early = car.Forward;

		expect(early).toBeGreaterThan(15);
		expect(car.Pitch).toBeGreaterThan(0);

		run(car, {Gas: true}, flat, 2);

		expect(car.Forward - early).toBeLessThan(early);

		run(car, {Gas: true}, flat, 60);

		expect(car.Forward).toBeLessThan(93);
		expect(car.Forward).toBeGreaterThan(80);

		/* Brakes stop it within a sane way, and it noses down. */
		var from = car.Z;

		run(car, {Brake: true}, flat, 0.5);

		expect(car.Pitch).toBeLessThan(0);

		run(car, {Brake: true}, flat, 8);

		expect(car.Forward).toBeLessThanOrEqual(0.5);
		expect(car.Z - from).toBeLessThan(500);

		/* On grass it goes no faster than the grass allows. */
		var rough = run(fresh(), {Gas: true}, grass, 8);

		expect(rough.Forward).toBeLessThan(run(fresh(), {Gas: true}, flat, 8).Forward / 2);

		/* Left is left, and it leans the other way. */
		var turning = run(fresh(), {Gas: true}, flat, 3);

		run(turning, {Gas: true, Steer: 1, Hand: true}, flat, 1);

		expect(turning.Heading).toBeGreaterThan(0.1);
		expect(turning.Roll).toBeGreaterThan(0);
		expect(turning.Aside).toBeLessThan(0);

		/* Over a step of the ground the body comes up on its springs and never sinks into it. */
		var step = function (x, z) {
			return {Height: z > 3 ? 0.3 : 0, Grip: 1, Drag: 0};
		};
		var over = fresh();
		var least = 1;
		var i;

		for (i = 0; i < 240; i++) {
			over.Forward = 6;

			physics.Car(over, {}, step, {}, 1 / 120);

			if (over.Z > 4.4)
				least = Math.min(least, over.Y - 0.3);
		}

		expect(least).toBeGreaterThanOrEqual(-0.16);
		expect(over.Y).toBeCloseTo(0.3, 1);
	});

	it('Physics keeps the wheels on the road: each on a spring of its own, the body riding over them', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};

		function fresh () {
			return {X: 0, Z: 0, Heading: 0, Forward: 0, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
		}

		function run (state, input, surface, seconds) {
			for (var i = 0; i < seconds * 120; i++)
				physics.Car(state, input, surface, {}, 1 / 120);

			return state;
		}

		/* At rest it rests. */
		var still = run(fresh(), {}, flat, 3);

		expect(Math.abs(still.Y)).toBeLessThan(0.002);
		expect(still.Touching).toBe(4);

		/* Speeding up, the nose rises and the wheels stay down: the front springs open, the rear ones close. */
		var going = run(fresh(), {Gas: true}, flat, 0.6);

		expect(going.Pitch).toBeGreaterThan(0.004);
		expect(going.Touching).toBe(4);

		going.Wheels.forEach(function (wheel) {
			expect(wheel.Y).toBe(0);
		});

		expect(going.Strokes[0]).toBeGreaterThan(0.005);
		expect(going.Strokes[2]).toBeLessThan(-0.005);

		/* A stone under the front left wheel lifts that wheel at once, the body hardly, and the wheel across not at all. */
		var stone = function (x, z) {
			return {Height: x > 0 && z > 1.2 && z < 1.7 ? 0.06 : 0, Grip: 1, Drag: 0};
		};
		var over = run(fresh(), {}, flat, 1);
		var most = 0;
		var body = 0;
		var across = 0;
		var i;

		for (i = 0; i < 40; i++) {
			over.Forward = 1;

			physics.Car(over, {}, stone, {}, 1 / 120);

			most = Math.max(most, over.Wheels[0].Y);
			body = Math.max(body, Math.abs(over.Y));
			across = Math.max(across, Math.abs(over.Wheels[1].Y));
		}

		expect(most).toBeGreaterThanOrEqual(0.06);
		expect(most).toBeLessThan(0.068);
		expect(body).toBeLessThan(0.025);
		expect(across).toBe(0);

		/* Over a crest the wheels go down after the road and do not leave it. */
		var bump = function (x, z) {
			return {Height: Math.sin(z * 0.2) * 0.25, Grip: 1, Drag: 0};
		};
		var waves = fresh();
		var off = 0;

		run(waves, {}, bump, 1);

		for (i = 0; i < 480; i++) {
			waves.Forward = 12;

			physics.Car(waves, {}, bump, {}, 1 / 120);

			off = Math.max(off, 4 - waves.Touching);
		}

		expect(off).toBe(0);

		/* Space stops it where it is: it does not go back as S does. */
		var braking = run(fresh(), {Gas: true}, flat, 3);

		run(braking, {Stop: true}, flat, 6);

		expect(braking.Forward).toBe(0);

		var z = braking.Z;

		run(braking, {Stop: true}, flat, 1);

		expect(braking.Z).toBe(z);
	});

	it('Physics stops and turns a car as it is told: brakes, grip, downforce, steering', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};

		function fresh (speed) {
			return {X: 0, Z: 0, Heading: 0, Forward: speed || 0, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
		}

		function stopping (settings) {
			var state = fresh(55);
			var i;

			for (i = 0; i < 1200 && state.Forward > 0; i++)
				physics.Car(state, {Stop: true}, flat, settings, 1 / 120);

			return state.Z;
		}

		var soft = stopping({});
		var hard = stopping({Brake: 22, Grip: 1.8});
		var pressed = stopping({Brake: 40, Grip: 1.8, Downforce: 1.2});

		/* Grip is what a brake can use. */
		expect(stopping({Brake: 40})).toBeCloseTo(soft, -1);
		expect(hard).toBeLessThan(soft * 0.7);
		expect(pressed).toBeLessThan(hard * 0.9);
		expect(hard).toBeLessThan(90);

		function turned (settings) {
			var state = fresh(30);
			var i;

			for (i = 0; i < 12; i++) {
				state.Forward = 30;

				physics.Car(state, {Steer: 1}, flat, settings, 1 / 120);
			}

			return state.Heading;
		}

		expect(turned({Answer: 20, Grip: 1.8, Assist: 1})).toBeGreaterThan(turned({Answer: 5, Grip: 1.8, Assist: 1}) * 1.05);
		expect(turned({Keep: 90, Grip: 1.8})).toBeGreaterThan(turned({Keep: 30, Grip: 1.8}));
	});

	it('Physics turns a car by a table of its own, whatever the speed, and a touch of the key is a little turn', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};
		var wet = function () {
			return {Height: 0, Grip: 0.5, Drag: 0};
		};
		var tune = {Mass: 1400, Base: 2.85, Width: 1.75, Grip: 1.75, Downforce: 0.9, Assist: 0.9, Agility: 2.5, Answer: 24, Lock: 0.6, Keep: 115, Ride: 0.7, AntiRoll: 120000, Balance: 0.32, Turn: [[14, 40], [28, 60], [56, 70], [83, 80]], Build: [0.45, 0.25]};

		function fresh (speed) {
			return {X: 0, Z: 0, Heading: 0, Forward: speed, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
		}

		function held (speed, settings, ground, input, seconds) {
			var state = fresh(speed);
			var i;

			for (i = 0; i < seconds * 120; i++) {
				state.Forward = speed;

				physics.Car(state, input, ground, settings, 1 / 120);
			}

			return state;
		}

		function degrees (speed, settings, ground) {
			return Math.abs(held(speed, settings, ground || flat, {Steer: 1}, 3).Rate) * 180 / Math.PI;
		}

		expect(physics.Table([[10, 1], [20, 3]], 15)).toBeCloseTo(2, 6);
		expect(physics.Table([[10, 1], [20, 3]], 5)).toBe(1);
		expect(physics.Table([[10, 1], [20, 3], [40, 7]], 90)).toBe(7);

		/* It follows the table at any speed, past what the grip alone would allow. */
		expect(degrees(14, tune)).toBeGreaterThan(35);
		expect(degrees(14, tune)).toBeLessThan(42);
		expect(degrees(28, tune)).toBeGreaterThan(54);
		expect(degrees(28, tune)).toBeLessThan(62);
		expect(degrees(83, tune)).toBeGreaterThan(72);
		expect(degrees(83, tune)).toBeLessThan(82);

		var slow = Object.assign({}, tune, {Turn: [[14, 20], [83, 30]]});

		expect(degrees(83, slow)).toBeLessThan(32);

		/* The ground has its say; and without a table it goes as it did. */
		expect(degrees(83, tune, wet)).toBeLessThan(degrees(83, tune) * 0.65);
		expect(degrees(1.5, tune)).toBeLessThan(22);

		var plain = Object.assign({}, tune);

		delete plain.Turn;

		expect(degrees(83, plain)).not.toBeCloseTo(degrees(83, tune), 0);

		/* A drift goes by the tyres, not by the table. */
		expect(Math.abs(held(40, tune, flat, {Steer: 1, Drift: true}, 1).Aside)).toBeGreaterThan(Math.abs(held(40, tune, flat, {Steer: 1}, 1).Aside) * 1.5);
		expect(Math.abs(held(40, tune, flat, {Steer: 1, Drift: true}, 0.4).Rate) * 180 / Math.PI).toBeGreaterThan(90);

		/* The steering comes in the time it is told, longer at a walk, and goes back twice as fast. */
		function coming (speed, seconds) {
			return held(speed, tune, flat, {Steer: 1}, seconds).Steer;
		}

		expect(coming(0.5, 0.225)).toBeGreaterThan(0.45);
		expect(coming(0.5, 0.225)).toBeLessThan(0.55);
		expect(coming(92, 0.125)).toBeGreaterThan(0.45);
		expect(coming(92, 0.125)).toBeLessThan(0.55);
		expect(coming(30, 2)).toBeCloseTo(1, 5);

		var back = fresh(30);

		back.Steer = 1;

		for (var i = 0; i < 12; i++) {
			back.Forward = 30;

			physics.Car(back, {}, flat, tune, 1 / 120);
		}

		var away = 1 - back.Steer;
		var toward = coming(30, 0.1);

		expect(away).toBeCloseTo(toward * 2, 1);

		var quick = Object.assign({}, tune);

		delete quick.Build;

		expect(coming(30, 0.1)).toBeLessThan(held(30, quick, flat, {Steer: 1}, 0.1).Steer * 0.6);
	});

	it('Renderer makes programs behind the page for who is patient, and sets in a program only what changed', async function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var quad = graphics.Shaders.Quad;
		var fragment = '#version 300 es\nprecision highp float;\nuniform float uA;\nuniform vec2 uB;\nout vec4 outColor;\nvoid main() { outColor = vec4(uA, uB, 1.0); }';
		var patient = graphics.Create(document.createElement('canvas'), {Patient: true, Antialias: false});
		var plain = graphics.Create(document.createElement('canvas'), {Antialias: false});
		var gl = patient.GL;
		var asked = 0;
		var real = gl.getProgramParameter;

		gl.getProgramParameter = function (program, name) {
			if (name === gl.LINK_STATUS)
				asked++;

			return real.apply(this, arguments);
		};

		var program = patient.Program(quad, fragment + '\n// a');
		var behind = patient.Program(quad, fragment + '\n// b', true);

		/* To ask how a link went is to wait for it: nothing asks yet. */
		expect(asked).toBe(0);
		expect(program.Settled).toBe(false);
		expect(patient.Progress().Total).toBe(2);

		var mesh = patient.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0], Indices: [0, 1, 2]});

		/* While the card works it is not asked, and what nothing waits for is not waited for. */
		var working = gl.getExtension('KHR_parallel_shader_compile').COMPLETION_STATUS_KHR;
		var told = gl.getProgramParameter;

		gl.getProgramParameter = function (handle, name) {
			return name === working ? false : told.apply(this, arguments);
		};

		expect(patient.Ready(program)).toBe(false);
		expect(patient.Progress()).toEqual({Done: 0, Total: 2, Needed: 1});
		expect(asked).toBe(0);

		gl.getProgramParameter = told;

		await waitFor(function () {
			return patient.Progress().Needed === 0;
		}, 20000);

		await waitFor(function () {
			return patient.Ready(behind);
		}, 20000);

		expect(patient.Progress()).toEqual({Done: 2, Total: 2, Needed: 0});
		expect(program.Uniforms.uA).toBeTruthy();
		expect(asked).toBe(2);

		var sent = [];
		var one = gl.uniform1f;
		var two = gl.uniform2fv;

		gl.uniform1f = function (place, value) {
			sent.push(value);

			return one.apply(this, arguments);
		};
		gl.uniform2fv = function (place, value) {
			sent.push(Array.from(value));

			return two.apply(this, arguments);
		};

		patient.Draw(mesh, program, {uA: 0.5, uB: [1, 2]}, {Depth: false});
		patient.Draw(mesh, program, {uA: 0.5, uB: [1, 2]}, {Depth: false});

		expect(sent).toEqual([0.5, [1, 2]]);

		/* A list changed in its place is still a change. */
		var list = [4, 5];

		patient.Draw(mesh, program, {uA: 0.25, uB: list}, {Depth: false});

		list[1] = 6;

		patient.Draw(mesh, program, {uA: 0.25, uB: list}, {Depth: false});

		expect(sent.slice(2)).toEqual([0.25, [4, 5], [4, 6]]);

		/* Who is not patient hears of a mistake at once; who is, when the program is done. */
		var wrong = fragment.replace('void main() {', 'void main() { nothing;');

		expect(function () {
			plain.Program(quad, wrong);
		}).toThrow(/does not compile/);

		var late = patient.Program(quad, wrong);

		await waitFor(function () {
			return late.Settled || gl.getProgramParameter(late.Handle, gl.getExtension('KHR_parallel_shader_compile').COMPLETION_STATUS_KHR);
		}, 20000);

		expect(function () {
			patient.Ready(late);
		}).toThrow(/does not compile/);

		/* A program not done yet waits when it is drawn with. */
		var wanted = patient.Program(quad, fragment + '\n// c');

		patient.Draw(mesh, wanted, {uA: 1}, {Depth: false});

		expect(wanted.Settled).toBe(true);
	});

	it('Renderer sets the state of the context only where it changes, and only the uniforms a program has', async function () {
		var renderer = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = renderer.GL;
		var fragment = '#version 300 es\nprecision highp float;\nuniform float uA;\nout vec4 outColor;\nvoid main() { outColor = vec4(uA); }';
		var program = renderer.Program(Elemenx.Service('Renderer').Shaders.Quad, fragment);
		var mesh = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0], Indices: [0, 1, 2]});
		var calls = [];
		var watched = ['useProgram', 'enable', 'disable', 'depthMask', 'blendFunc', 'blendFuncSeparate', 'cullFace'];
		var real = {};
		var given = {uA: 0.5, uMissing: 2};

		watched.forEach(function (name) {
			real[name] = gl[name];
			gl[name] = function () {
				calls.push(name);

				return real[name].apply(this, arguments);
			};
		});

		renderer.Draw(mesh, program, given, {Blend: 'add', Cull: 'front'});

		var first = calls.length;

		expect(calls).toEqual(['useProgram', 'enable', 'depthMask', 'enable', 'blendFuncSeparate', 'enable', 'cullFace']);
		expect(program.List.map(function (info) {
			return info.Name;
		})).toEqual(['uA']);

		/* The same again: nothing to set. */
		renderer.Draw(mesh, program, given, {Blend: 'add', Cull: 'front'});

		expect(calls.length).toBe(first);

		/* Another blending, no culling, no depth written; a clear writes depth again. */
		renderer.Draw(mesh, program, given, {Blend: 'alpha', Cull: 'none', DepthWrite: false});

		expect(calls.slice(first)).toEqual(['depthMask', 'enable', 'blendFunc', 'disable']);

		calls = [];

		renderer.Clear([0, 0, 0, 1]);
		renderer.Draw(mesh, program, given, {Blend: 'alpha', Cull: 'none', DepthWrite: false});

		expect(calls).toEqual(['depthMask', 'depthMask']);
		expect(gl.getParameter(gl.DEPTH_WRITEMASK)).toBe(false);
		expect(gl.getParameter(gl.BLEND)).toBe(true);
		expect(gl.getParameter(gl.CULL_FACE)).toBe(false);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		watched.forEach(function (name) {
			gl[name] = real[name];
		});

		renderer.Destroy();
	});

	it('Workers runs the methods of Services in workers made of their source, and in the page when it cannot', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var workers = Elemenx.Service('Workers');
		var options = {Size: 200, Height: 30, Seed: 'work'};
		var roads = [[[-50, 0], [50, 0]]];
		var field = terrain.Flat(options);
		var pool = terrain.Work();
		var piece = null;
		var grid = null;
		var failed = null;
		var real = window.Worker;
		var text = workers.Source({A: function (x) {
			return x * 2;
		}, B: {C: 1}, D: [1, 2]}, ['A', 'B', 'D']);
		var made = (0, eval)('(' + text + ')');

		expect(made.A(3)).toBe(6);
		expect(made.B).toEqual({C: 1});
		expect(made.D).toEqual([1, 2]);

		expect(terrain.Work()).toBe(pool);
		expect(pool.Inline()).toBe(false);
		expect(field.Options).toBe(options);

		/* The pool is the one of all the scenes: what they still wait for is counted too. */
		var waiting = pool.Waiting();

		pool.Run('SceneTerrainGenerator', 'Piece', ['Flat', options, roads, [10, -20, 50, 8]], function (error, result) {
			piece = result;
		});
		pool.Run('SceneTerrainGenerator', 'Grid', [options, 5, 20, 0.3], function (error, result) {
			grid = result;
		});
		pool.Run('SceneTerrainGenerator', 'Missing', [], function (error) {
			failed = error;
		});

		expect(pool.Waiting()).toBe(waiting + 3);

		await waitFor(function () {
			return piece && grid && failed;
		}, 10000);

		expect(pool.Waiting()).toBe(0);
		expect(failed).toBeInstanceOf(Error);

		/* The very numbers of the page: the same noise, the same colors of the roads. */
		field.Roads = roads;

		var here = field.Chunk(10, -20, 50, 8);

		expect(piece.Positions).toBeInstanceOf(Float32Array);
		expect(piece.Indices).toBeInstanceOf(Uint32Array);
		expect(Array.from(piece.Positions)).toEqual(Array.from(new Float32Array(here.Positions)));
		expect(Array.from(piece.Colors)).toEqual(Array.from(new Float32Array(here.Colors)));
		expect(Array.from(piece.Indices)).toEqual(here.Indices);
		expect(grid[(2 * 5 + 3) * 4]).toBeCloseTo(field.Height(3 * 50 - 100, 2 * 50 - 100), 4);

		/* A worker that cannot start leaves its runs to the page. */
		var broken = unique('Broken');
		var answer = null;

		Elemenx.Service(broken, {
			Bound: Math.max,
			Plain: function (a) {
				return a + 1;
			},
			Source: function (names) {
				return this.$Service('Workers').Source(this, names);
			}
		});

		var failing = workers.Pool(broken, {[broken]: ['Bound', 'Plain']});

		failing.Run(broken, 'Plain', [1], function (error, value) {
			answer = value;
		});

		await waitFor(function () {
			return answer !== null;
		}, 10000);

		expect(answer).toBe(2);
		expect(failing.Inline()).toBe(true);

		/* With no workers at all: at once. */
		window.Worker = undefined;

		var plain = workers.Pool(unique('Plain'), {Terrain: ['Smoothstep']});
		var now = null;

		plain.Run('SceneTerrainGenerator', 'Smoothstep', [0, 1, 0.5], function (error, value) {
			now = value;
		});

		window.Worker = real;

		expect(plain.Inline()).toBe(true);
		expect(now).toBe(0.5);

		failing.Destroy();
		plain.Destroy();
	});

	it('makes the squares of a ground of noise in workers, lets go of what came for roads that changed, and grows grass with no noise in a frame', async function () {
		var pool = Elemenx.Service('SceneTerrainGenerator').Work();
		var run = pool.Run;
		var held = [];
		var grids = [];
		var mounted;

		pool.Run = function (service, method, args, callback) {
			if (method === 'Piece')
				held.push({Args: args, Callback: callback});

			if (method === 'Grid')
				grids.push({Args: args, Callback: callback});
		};

		try {
			mounted = await mount('<Scene (ready)="Ready">' +
				'<SceneObject ID="land" Kind="ground" Size="192" Height="20" Water="0.2" Seed="test" />' +
				'<SceneObject ID="sun" Kind="sun" />' +
				'<SceneObject ID="blades" Kind="grass" />' +
			'</Scene>');

			var scene = mounted.Space;
			var inner = scene.Scene();
			var engine = scene.Engine();
			var ground;
			var field;
			var height;
			var calls = 0;

			inner.Loop.Stop();

			inner.Wanted = inner.Distance = 30;

			await waitFor(function () {
				engine.Frame(performance.now() + 100);

				return inner.Ground && held.length > 0;
			}, 8000);

			ground = inner.Ground;
			field = ground.Field;

			/* The first square is made at once, the others are asked for. */
			expect(Object.keys(ground.Nodes).length).toBe(1);
			expect(held[0].Args[0]).toBe('Flat');
			expect(held[0].Args[1]).toBe(field.Options);

			var one = held[0];
			var count = held.length;

			/* Roads came while it was made: what came is let go, and asked for again. */
			field.Roads = [[[-90, 0], [90, 0]]];

			one.Callback(null, Elemenx.Service('SceneTerrainGenerator').Piece.apply(null, one.Args));

			expect(Object.keys(ground.Nodes).length).toBe(1);

			engine.Frame(performance.now() + 200);

			var again = held.slice(count).filter(function (each) {
				return JSON.stringify(each.Args[3]) === JSON.stringify(one.Args[3]);
			})[0];

			expect(again.Args[2]).toBe(field.Roads);

			again.Callback(null, Elemenx.Service('SceneTerrainGenerator').Piece.apply(null, again.Args));

			expect(Object.keys(ground.Nodes).length).toBe(2);

			/* The grass knows the height of the ground from its grid, made by a worker: none grows before it comes. */
			height = field.Height;
			field.Height = function () {
				calls++;

				return height.apply(this, arguments);
			};

			engine.Frame(performance.now() + 250);
			engine.Frame(performance.now() + 260);

			field.Height = height;

			expect(grids.length).toBe(1);
			expect(grids[0].Args[0]).toBe(field.Options);
			expect(scene.Sown().Blades).toBe(0);
			expect(calls).toBeLessThan(100);

			calls = 0;
			pool.Run = run;

			run.call(pool, 'Terrain', 'Grid', grids[0].Args, grids[0].Callback);

			/* And no noise in a frame then. */
			await waitFor(function () {
				engine.Frame(performance.now() + 300);

				return scene.Sown().Blades > 1000;
			}, 10000);

			height = field.Height;
			field.Height = function () {
				calls++;

				return height.apply(this, arguments);
			};

			engine.Frame(performance.now() + 400);

			field.Height = height;

			expect(calls).toBeLessThan(20);
		}
		finally {
			pool.Run = run;
		}
	});

	it('A mirrored node keeps its mirror, and what a file keeps as one piece stands apart', function () {
		var gltf = Elemenx.Service('Gltf');
		var models = Elemenx.Service('SceneModels');
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');

		/* As the wheels of the other side come: x and z change places. */
		var matrix = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 3, 4, 1];
		var node = gltf.Node({matrix: matrix});
		var made = models.NodeMatrix(node.Translation, node.Rotation, node.Scale);

		made.forEach(function (value, index) {
			expect(value).toBeCloseTo(matrix[index], 5);
		});

		var plain = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 3, 4, 1];
		var turned = gltf.Node({matrix: plain});

		expect(turned.Scale).toEqual([1, 1, 1]);

		models.NodeMatrix(turned.Translation, turned.Rotation, turned.Scale).forEach(function (value, index) {
			expect(value).toBeCloseTo(plain[index], 5);
		});

		/* Four wheels in one mesh: each has only its own corners. */
		var corners = [[-1, 2], [1, 2], [-1, -2], [1, -2]];
		var positions = [];
		var normals = [];
		var indices = [];

		corners.forEach(function (corner, wheel) {
			[[0, 0], [0.2, 0], [0, 0.2]].forEach(function (at) {
				positions.push(corner[0] + at[0], 0, corner[1] + at[1]);
				normals.push(wheel, 0, 1);
			});

			indices.push(wheel * 3, wheel * 3 + 1, wheel * 3 + 2);
		});

		var asset = {Nodes: [{Name: 'Tyres'}, {Name: 'Body'}]};
		var geometry = {Positions: positions, Normals: normals, Indices: indices};
		var pieces = [{ID: 'a', Node: 0, Skin: -1, Rest: math.Identity(), Geometry: geometry, Material: {Name: 'paint'}}, {ID: 'b', Node: 1, Skin: -1, Rest: math.Identity(), Geometry: geometry, Material: {Name: 'paint'}}, {ID: 'c', Node: 1, Skin: -1, Rest: math.Identity(), Geometry: geometry, Material: {Name: 'Tyre'}}];
		var apart = models.Apart(asset, pieces, /Tyre/);

		expect(apart.length).toBe(9);
		expect(apart.filter(function (piece) {
			return piece.ID === 'b';
		})[0]).toBe(pieces[1]);

		var part = apart.filter(function (piece) {
			return piece.ID === 'a-rf';
		})[0];

		expect(part.Geometry.Positions).toEqual([1, 0, 2, 1.2, 0, 2, 1, 0, 2.2]);
		expect(part.Geometry.Normals).toEqual([1, 0, 1, 1, 0, 1, 1, 0, 1]);
		expect(part.Geometry.Indices).toEqual([0, 1, 2]);

		/* One axle does not fall in two along its length. */
		var axle = models.Apart(asset, [{ID: 'a', Node: 0, Skin: -1, Rest: math.Identity(), Material: {Name: ''}, Geometry: {Positions: [0, 1, 2, 3, 4, 5, 6, 7].reduce(function (list, row) {
			return list.concat([-1, 0, 2 + row * 0.1, -0.8, 0, 2 + row * 0.1, -1, 0, 2 + row * 0.1, 1, 0, 2 + row * 0.1, 1.2, 0, 2 + row * 0.1, 1, 0, 2 + row * 0.1]);
		}, []), Indices: Array.from({length: 48}, function (each, index) {
			return index;
		})}}], /Tyre/);

		expect(axle.map(function (piece) {
			return piece.ID;
		}).sort()).toEqual(['a-lb', 'a-rb']);
	});

	it('Physics holds a car level in a turn by its bars, and keeps all its wheels down', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};

		function slalom (settings) {
			var state = {X: 0, Z: 0, Heading: 0, Forward: 45, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
			var most = 0;
			var lifted = 0;
			var i;

			for (i = 0; i < 960; i++) {
				state.Forward = 45;

				physics.Car(state, {Steer: Math.floor(i / 120) % 2 ? 1 : -1}, flat, settings, 1 / 120);

				if (i > 60) {
					most = Math.max(most, Math.abs(state.Roll));
					lifted = Math.max(lifted, 4 - state.Touching);
				}
			}

			return {Roll: most * 180 / Math.PI, Lifted: lifted};
		}

		var tune = {Mass: 1400, Base: 2.85, Width: 1.75, Grip: 1.75, Ride: 0.7, Balance: 0.32};
		var loose = slalom(Object.assign({AntiRoll: 0}, tune));
		var held = slalom(Object.assign({AntiRoll: 120000}, tune));

		expect(held.Roll).toBeLessThan(loose.Roll * 0.75);
		expect(held.Roll).toBeLessThan(3);
		expect(held.Lifted).toBe(0);
	});

	it('Physics turns a car as sharply as it is told, with no more lean for that', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};

		function turning (settings) {
			var state = {X: 0, Z: 0, Heading: 0, Forward: 40, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
			var i;

			for (i = 0; i < 360; i++) {
				state.Forward = 40;

				physics.Car(state, {Steer: 1}, flat, settings, 1 / 120);
			}

			return state;
		}

		var tune = {Mass: 1400, Base: 2.85, Width: 1.75, Grip: 1.75, Ride: 0.7, Balance: 0.32, AntiRoll: 120000, Keep: 110, Answer: 22, Assist: 1};
		var plain = turning(tune);
		var sharp = turning(Object.assign({Agility: 1.7}, tune));

		expect(sharp.Rate).toBeGreaterThan(plain.Rate * 1.3);
		expect(sharp.Rate * 57.3).toBeGreaterThan(35);

		/* What leans a body is what its tyres can give. */
		expect(Math.abs(sharp.Roll)).toBeLessThan(Math.abs(plain.Roll) * 1.1);
	});

	it('Physics is a simulator or an arcade by its numbers, and lets the tail go when it is asked', function () {
		var physics = Elemenx.Service('Physics');
		var flat = function () {
			return {Height: 0, Grip: 1, Drag: 0};
		};

		function fresh (speed) {
			return {X: 0, Z: 0, Heading: 0, Forward: speed, Aside: 0, Rate: 0, Steer: 0, Y: 0, Rise: 0, Pitch: 0, PitchSpeed: 0, Roll: 0, RollSpeed: 0, Spin: 0};
		}

		var tune = {Mass: 1400, Base: 2.85, Width: 1.75, Grip: 1.75, Answer: 26, Keep: 130, Rear: 1.15, Slide: 0.42, Ride: 0.7, Balance: 0.32, AntiRoll: 120000};

		/* A tyre gives more as it slips, tops, and falls a little past it. */
		expect(physics.Tyre(0)).toBe(0);
		expect(physics.Tyre(0.3)).toBeLessThan(physics.Tyre(0.7));
		expect(physics.Tyre(3)).toBeLessThan(physics.Tyre(0.7));
		expect(physics.Tyre(-0.7)).toBeCloseTo(-physics.Tyre(0.7), 6);

		function line (settings, input, ticks) {
			var state = fresh(40);
			var most = 0;
			var i;

			for (i = 0; i < ticks; i++) {
				physics.Car(state, input(i), flat, settings, 1 / 120);

				expect(Number.isFinite(state.Rate)).toBe(true);

				most = Math.max(most, Math.abs(state.Slip));
			}

			return {State: state, Slip: most};
		}

		function steering () {
			return {Steer: 1};
		}

		/* With help it goes where the wheels point; left to its tyres it slips more, and does not spin for ever. */
		var arcade = line(Object.assign({Assist: 0.9, Agility: 1}, tune), steering, 240);
		var simulator = line(Object.assign({Assist: 0, Agility: 1}, tune), steering, 240);
		var sharp = line(Object.assign({Assist: 0.9, Agility: 3}, tune), steering, 240);

		expect(arcade.Slip).toBeLessThan(simulator.Slip);
		expect(sharp.State.Rate).toBeGreaterThan(arcade.State.Rate * 1.5);
		expect(Math.abs(simulator.State.Rate)).toBeLessThan(1.8);

		/* Drift: a short pull of the wheel, and it opens; it does not go round; let go, it comes straight. */
		var settings = Object.assign({Assist: 0.85, Agility: 3}, tune);
		var plain = line(settings, function (i) {
			return {Gas: true, Steer: i < 60 ? 1 : 0.2};
		}, 240);
		var drift = line(settings, function (i) {
			return {Gas: true, Steer: i < 60 ? 1 : 0.2, Drift: true};
		}, 240);

		expect(drift.Slip).toBeGreaterThan(plain.Slip * 3);
		expect(drift.Slip).toBeGreaterThan(0.5);
		expect(drift.Slip).toBeLessThan(0.95);

		var state = drift.State;
		var i;

		for (i = 0; i < 90; i++)
			physics.Car(state, {Gas: true}, flat, settings, 1 / 120);

		expect(Math.abs(state.Slip)).toBeLessThan(0.05);

		/* Told to open as far as it likes, it still does not spin past what its tyres could. */
		var wild = line(Object.assign({Assist: 0, Agility: 1, Angle: 9}, tune), function () {
			return {Gas: true, Steer: 1, Drift: true};
		}, 360);

		expect(Math.abs(wild.State.Rate)).toBeLessThan(3);

		/* Off the gas it comes to rest soon: a touch of gas with the wheel over is a short arc and no merry-go-round. */
		var touch = fresh(12);
		var turned = 0;
		var last = 0;

		for (i = 0; i < 2400; i++) {
			physics.Car(touch, {Steer: 1}, flat, Object.assign({Coast: 3, Assist: 0.8, Agility: 2.5}, tune), 1 / 120);

			turned += Math.abs(touch.Heading - last);
			last = touch.Heading;
		}

		expect(touch.Forward).toBe(0);
		expect(turned / (Math.PI * 2)).toBeLessThan(2.5);

		/* Brakes past the grip stop it shorter. */
		function stopped (bite) {
			var state2 = fresh(55);

			while (state2.Forward > 0)
				physics.Car(state2, {Stop: true}, flat, Object.assign({Brake: 36, Bite: bite}, tune), 1 / 120);

			return state2.Z;
		}

		expect(stopped(2)).toBeLessThan(stopped(1) * 0.8);
		expect(stopped(2)).toBeLessThan(60);

		/* At a walk nothing slips. */
		var slow = fresh(3);

		for (i = 0; i < 120; i++) {
			slow.Forward = 3;

			physics.Car(slow, {Steer: 1}, flat, Object.assign({Assist: 0}, tune), 1 / 120);
		}

		expect(Math.abs(slow.Aside)).toBeLessThan(0.01);
		expect(slow.Rate).toBeGreaterThan(0.2);
	});

	it('Physics takes a car off a wall: out of it, its way into it gone, turned round the corner that struck', function () {
		var physics = Elemenx.Service('Physics');
		var state = {X: 0, Z: 0, Heading: 0, Forward: 30, Aside: 0, Rate: 0};

		/* It goes along z and meets a wall that looks back along it, with its left front corner. */
		physics.Hit(state, [0, -1], 0.2, [0.9, 2.3], {Bounce: 0.25});

		expect(state.Z).toBeCloseTo(-0.2, 6);
		expect(state.Forward).toBeCloseTo(-7.5, 3);
		expect(state.Rate).not.toBe(0);

		/* What is going away from a wall is not stopped by it. */
		var leaving = {X: 0, Z: 0, Heading: 0, Forward: -5, Aside: 0, Rate: 0};

		physics.Hit(leaving, [0, -1], 0.1, [0, 2], {});

		expect(leaving.Forward).toBe(-5);
		expect(leaving.Rate).toBe(0);

		/* Along a wall it scrapes and keeps most of its speed. */
		var along = {X: 0, Z: 0, Heading: 0, Forward: 30, Aside: 3, Rate: 0};

		physics.Hit(along, [-1, 0], 0, [1, 2], {Bounce: 0});

		expect(along.Forward).toBeGreaterThan(25);
		expect(Math.abs(along.Aside)).toBeLessThan(0.001);

		expect(physics.Bounce([0, 0, -2], [0, 0, 1], 0, 0.5)).toEqual([0, 0, 1]);
		expect(physics.Bounce([0, 0, 2], [0, 0, 1], 0, 0.5)).toEqual([0, 0, 2]);
	});

	it('Physics brings a ship to rest, all of it, and then it stays', function () {
		var physics = Elemenx.Service('Physics');
		var state = {At: [0, 0, 0], Right: [1, 0, 0], Up: [0, 1, 0], Ahead: [0, 0, 1], Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 1};
		var i;

		for (i = 0; i < 240; i++)
			physics.Ship(state, {}, {}, 1 / 120);

		expect(state.Way[2]).toBeGreaterThan(0.5);

		for (i = 0; i < 480; i++)
			physics.Ship(state, {Stop: true}, {}, 1 / 120);

		expect(state.Throttle).toBe(0);
		expect(state.Way).toEqual([0, 0, 0]);

		var at = state.At.slice();

		for (i = 0; i < 30; i++)
			physics.Ship(state, {}, {}, 1 / 120);

		expect(state.At).toEqual(at);
	});

	it('Physics flies a ship: its speed comes after its throttle, its axes stay square', function () {
		var physics = Elemenx.Service('Physics');
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var ship = {At: [0, 0, 0], Right: [1, 0, 0], Up: [0, 1, 0], Ahead: [0, 0, 1], Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0.5};
		var i;

		for (i = 0; i < 600; i++)
			physics.Ship(ship, {Throttle: 1, Yaw: 1, Pitch: 0.5, Roll: 1}, {Top: 2}, 1 / 120);

		expect(ship.Throttle).toBe(1);
		expect(math.Vectors.Length(ship.Way)).toBeGreaterThan(1);
		expect(math.Vectors.Dot(ship.Ahead, ship.Up)).toBeCloseTo(0, 6);
		expect(math.Vectors.Length(ship.Right)).toBeCloseTo(1, 6);

		var still = {At: [0, 0, 0], Right: [1, 0, 0], Up: [0, 1, 0], Ahead: [0, 0, 1], Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0};

		physics.Ship(still, {Yaw: 1}, {}, 0.2);

		expect(still.Ahead[0]).toBeGreaterThan(0);
	});

	it('drives a car on its track: it stands on the road, nothing shakes, and the barrier holds it', async function () {
		var models = Elemenx.Service('SceneModels');
		var roads = Elemenx.Service('SceneRoads');
		var track = Elemenx.Service('SceneRoadGenerator').Track('drive', {Length: 1200, Corners: 9});

		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var start = track.Start;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 1400, Height: 8, Water: 0, Scale: 300, Ridges: 0, Seed: 'drive'})});
		scene.Add('road', track.Spec);

		function frames (count, length) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += length || 33);
			}
		}

		frames(3);

		scene.Add('unit', {ID: 'car', Name: '', Size: 1.2, X: start.X, Y: start.Z, Vehicle: {Kind: 'car', Heading: start.Heading}});
		scene.Control('car');

		frames(40);

		var car = inner.Objects.car;

		/* On the road as the model has it. */
		expect(scene.SurfaceAt(car.Car.X, car.Car.Z).Road).toBe('track');
		expect(car.World[1]).toBeCloseTo(scene.SurfaceAt(car.Car.X, car.Car.Z).Height, 1);

		inner.Ground.Keys = {KeyW: true};

		frames(60);

		expect(car.Car.Forward).toBeGreaterThan(10);
		expect(car.Thrust).toBeGreaterThan(0);

		/* What is shown keeps pace with the view at uneven frames: the eye and the car never part. */
		var gaps = [];
		var i;

		for (i = 0; i < 24; i++) {
			frames(1, i % 2 ? 9 : 31);

			gaps.push(Math.hypot(inner.Ground.Target[0] - car.World[0], inner.Ground.Target[2] - car.World[2]));

			/* What is drawn is where it has come to this very frame, not where it was at the last one. */
			expect(car.World).toBe(car.Flight.At);
		}

		expect(Math.max.apply(null, gaps)).toBeLessThan(0.001);

		/* Past the barrier it does not go: driven straight at it, from near it. */
		var road = scene.Roads()[0];
		var across = [Math.cos(start.Heading), -Math.sin(start.Heading)];

		car.Car.X = start.X + across[0] * (road.Barriers[1].Offset - 6);
		car.Car.Z = start.Z + across[1] * (road.Barriers[1].Offset - 6);
		car.Car.Heading = Math.atan2(across[0], across[1]);
		car.Car.Forward = 25;
		inner.Ground.Keys = {KeyW: true};

		var reached = 0;

		for (i = 0; i < 40; i++) {
			frames(1);

			reached = Math.max(reached, Math.abs(roads.Near(road, car.Car.X, car.Car.Z).Offset));
		}

		/* It came to the barrier, and no farther than its nose allows. */
		expect(reached).toBeGreaterThan(road.Barriers[1].Offset - 4);
		expect(reached).toBeLessThanOrEqual(road.Barriers[1].Offset - 1);

		inner.Ground.Keys = {};

		/* A kind of its own. */
		var stepped = 0;

		scene.Vehicles({hover: function () {
			stepped++;
		}});

		car.Values.Vehicle = {Kind: 'hover'};

		frames(2);

		expect(stepped).toBe(2);
		expect(gameSceneSource).toContain('field.Blocked && !(focus && focus.Values.Vehicle)');
	});

	it('sends a ship far at once: a warp to a body and a jump ahead, each going in, inside and out, and never into a body', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1"><SceneObject ID="moon" Kind="moon" Radius="1737" Distance="384400 km" /></SceneObject></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var emit = scene.$Emit;
		var drawn = engine.CosmosWarp;
		var told = [];
		var warps = [];
		var ended = null;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		function apart (a, b) {
			return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
		}

		/* A key pressed on the scene as a player presses it, for a frame. */
		function press (code) {
			scene.$Element().dispatchEvent(new KeyboardEvent('keydown', {code: code, key: code.slice(3).toLowerCase(), bubbles: true}));

			frames(1);

			scene.$Element().dispatchEvent(new KeyboardEvent('keyup', {code: code, key: code.slice(3).toLowerCase(), bubbles: true}));
		}

		/* Turns the ship to look along a way. */
		function face (state, way) {
			var length = Math.hypot(way[0], way[1], way[2]);
			var ahead = way.map(function (value) {
				return value / length;
			});
			var side = Math.hypot(ahead[2], ahead[0]);
			var right = [ahead[2] / side, 0, -ahead[0] / side];

			state.Ahead = ahead;
			state.Right = right;
			state.Up = [ahead[1] * right[2] - ahead[2] * right[1], ahead[2] * right[0] - ahead[0] * right[2], ahead[0] * right[1] - ahead[1] * right[0]];
		}

		scene.$Emit = function (name, data) {
			if (name === 'travel')
				told.push(data.Kind + ':' + data.Phase);

			return emit.apply(this, arguments);
		};
		engine.CosmosWarp = function (matrix, warp) {
			warps.push(Object.assign({}, warp));

			return drawn.apply(this, arguments);
		};

		try {
			frames(2);

			scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'world', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'world', From: [0, 0, 3], Facing: [0, 0, 1], Warp: {To: 'moon', Enter: 0.5, Inside: 0.5, Exit: 0.5}}});
			scene.Control('me');

			frames(2);

			var ship = inner.Objects.me;
			var moon = inner.Objects.moon;
			var fov = inner.Camera.Fov;

			/*
			 * H: a warp to what its Vehicle says, turned to it on the way in, a tunnel inside, out before it. Regression: the scene
			 * kept no key H or J of a hero in space, and neither key did anything.
			 */
			press('KeyH');

			expect(ship.Travel.Kind).toBe('warp');

			frames(15);

			expect(ship.Travel.Phase).toBe('inside');
			expect(ship.Ship.Ahead[0] * ship.Travel.Axis[0] + ship.Ship.Ahead[1] * ship.Travel.Axis[1] + ship.Ship.Ahead[2] * ship.Travel.Axis[2]).toBeGreaterThan(0.9);

			frames(8);

			var inside = warps[warps.length - 1];

			expect(inside).toMatchObject({Kind: 'warp', Phase: 'inside', Stretch: 1, Tunnel: 1});
			expect(inside.Depth).toBeLessThan(0.99999);
			expect(inner.Camera.Fov).toBeGreaterThan(fov * 1.2);

			frames(30);

			expect(told).toEqual(['warp:enter', 'warp:inside', 'warp:exit', 'warp:done']);
			expect(ship.Travel).toBe(null);
			expect(inner.Warp).toBe(null);
			expect(inner.Camera.Fov).toBe(fov);
			expect(apart(ship.World, moon.World)).toBeGreaterThan(moon.Size * 5);
			expect(apart(ship.World, moon.World)).toBeLessThan(moon.Size * 9);

			/* A jump straight ahead goes as far as told, in seconds of its top speed, and leaves it at its speed. */
			face(ship.Ship, [ship.World[0] - moon.World[0], ship.World[1] - moon.World[1], ship.World[2] - moon.World[2]]);

			var from = ship.World.slice();
			var ahead = ship.Ship.Ahead.slice();

			warps = [];

			scene.Travel('me', 'jump', {Length: 2, Enter: 0.3, Inside: 0.3, Exit: 0.3}, function (error, result) {
				ended = [error, result];
			});

			/* Not two at once. */
			scene.Travel('me', 'warp', {}, function (error) {
				expect(error.message).toBe('Elemenx Scene: me cannot warp now');
			});

			frames(9);

			var dash = ship.World.slice();

			frames(10);

			expect(warps.some(function (warp) {
				return warp.Kind === 'jump' && warp.Phase === 'inside' && warp.Stretch > 0.3 && warp.Tunnel === 0;
			})).toBe(true);

			frames(20);

			expect(ended[0]).toBe(null);
			expect(ended[1]).toMatchObject({ID: 'me', Kind: 'jump'});
			expect(apart(dash, from)).toBeLessThan(0.3 * 2 * 0.2);
			expect(apart(ship.World, from)).toBeGreaterThan(0.3 * 2);
			expect(Math.hypot.apply(null, ship.Ship.Way)).toBeCloseTo(0.3 * Math.max(ship.Ship.Throttle, 0.4), 5);
			expect(ship.Ship.Ahead).toEqual(ahead);

			/* Into a body it does not go: it stops before it. */
			var world = inner.Objects.world;

			ship.Ship.At = ship.Ship.At.map(function (value) {
				return value * 6;
			});

			frames(1);

			var before = apart(ship.World, world.World);

			face(ship.Ship, [world.World[0] - ship.World[0], world.World[1] - ship.World[1], world.World[2] - ship.World[2]]);

			scene.Travel('me', 'jump', {Length: 1000, Enter: 0.1, Inside: 0.2, Exit: 0.1});

			frames(20);

			expect(before).toBeGreaterThan(world.Size * 8);
			expect(apart(ship.World, world.World)).toBeGreaterThan(world.Size * 5.5);
			expect(apart(ship.World, world.World)).toBeLessThan(world.Size * 6.5);

			/* What is no ship does not go. */
			scene.Travel('star', 'jump', {}, function (error) {
				ended = error;
			});

			expect(ended.message).toBe('Elemenx Scene: star cannot jump now');

			/* J jumps. */
			press('KeyJ');

			expect(ship.Travel.Kind).toBe('jump');
		}
		finally {
			scene.$Emit = emit;
			engine.CosmosWarp = drawn;
		}
	});

	it('opens the hatch of a ship by degrees, as a car opens a door: regression, only a car moved what opens', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.02, Parent: 'world', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'world', From: [0, 0, 3], Openings: [{Name: 'hatch', Match: 'Hatch', Hinge: [0, 0.2, -1], Axis: [1, 0, 0], Angle: 80}]}});
		scene.Control('me');

		frames(2);

		scene.OpenPart('me', 'hatch', 1);

		frames(10);

		var half = inner.Objects.me.Opens.hatch;

		frames(60);

		expect(half).toBeGreaterThan(0.1);
		expect(half).toBeLessThan(0.9);
		expect(inner.Objects.me.Opens.hatch).toBe(1);

		scene.OpenPart('me', 'hatch', 0);

		frames(70);

		expect(inner.Objects.me.Opens.hatch).toBe(0);
	});

	it('flies a ship by a body: the keys fly it, the mouse only looks, and the model goes with the view', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames (count, length) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += length || 33);
			}
		}

		frames(2);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.02, Parent: 'world', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'world', From: [0, 0, 3], Facing: [0, 0, -1], Yaw: 180}});
		scene.Control('me');

		frames(2);

		var ship = inner.Objects.me;
		var world = inner.Objects.world;
		var state = ship.Ship;

		inner.Keys = {KeyW: true};

		frames(60);

		expect(state.Throttle).toBeGreaterThan(0.8);
		expect(state.At[2]).toBeLessThan(world.Size * 3);

		/* The nose of a model told to turn goes where it flies. */
		expect(ship.Turn[10]).toBeCloseTo(state.Ahead[2] * -1, 2);

		/* The mouse turns the view round it and not the ship. */
		var ahead = state.Ahead.slice();

		inner.Keys = {};
		inner.Yaw += 1;
		inner.Pitch = 0.4;

		frames(10);

		expect(state.Ahead).toEqual(ahead);
		expect(inner.Pitch).toBe(0.4);

		/* The view stays on the ship at uneven frames: this is what kept it shaking. */
		var far = [];
		var i;

		inner.Keys = {KeyW: true, KeyA: true};

		for (i = 0; i < 24; i++) {
			frames(1, i % 2 ? 9 : 31);

			far.push(Math.hypot(inner.Camera.Target[0] - ship.World[0], inner.Camera.Target[1] - ship.World[1], inner.Camera.Target[2] - ship.World[2]));

			/* What is drawn is where it has come to this very frame: the view has that place, and a model a frame behind it shakes. */
			expect(ship.World).toBe(ship.Flight.At);
		}

		expect(Math.max.apply(null, far)).toBeLessThan(1e-9);

		/* The mouse goes as it goes on the ground: to the right of a ship going along z the view stands on the side of x below 0. */
		inner.Keys = {};
		state.Right = [1, 0, 0];
		state.Up = [0, 1, 0];
		state.Ahead = [0, 0, 1];
		state.Way = [0, 0, 0];
		state.Throttle = 0;
		inner.ShipAxes = null;
		inner.Yaw = 0.6;
		inner.Pitch = 0;

		frames(1);

		expect(inner.Camera.Position[0] - ship.World[0]).toBeLessThan(0);

		inner.Yaw = 0;
		inner.ShipAxes = null;

		/* R pitches its nose up, F down, without the arrows. */
		inner.Keys = {KeyR: true};

		frames(20);

		expect(state.Ahead[1]).toBeGreaterThan(0.05);

		inner.Keys = {KeyF: true};

		frames(50);

		expect(state.Ahead[1]).toBeLessThan(0);

		/* Space brings it to rest, and the key does not stop the time of the scene. */
		mounted.Host.$Element().querySelector('.elemenx-scene').focus();

		var element = scene.$Element();

		element.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', code: 'Space', bubbles: true}));

		expect(inner.Keys.Space).toBe(true);
		expect(scene.Paused).toBe(true);

		element.dispatchEvent(new KeyboardEvent('keyup', {key: ' ', code: 'Space', bubbles: true}));

		inner.Keys = {KeyW: true};

		frames(30);

		inner.Keys = {Space: true};

		frames(120);

		expect(state.Way).toEqual([0, 0, 0]);
		expect(ship.Thrust).toBe(0);

		/* The keys turn it, the arrows pitch it, Q rolls it. */
		state.Throttle = 0;
		inner.Keys = {KeyW: true, KeyA: true};

		frames(24);

		expect(Math.abs(state.Ahead[0] - ahead[0])).toBeGreaterThan(0.02);

		var up = state.Up.slice();

		inner.Keys = {ArrowUp: true, KeyQ: true};

		frames(12);

		expect(Math.abs(state.Up[0] - up[0]) + Math.abs(state.Up[1] - up[1]) + Math.abs(state.Up[2] - up[2])).toBeGreaterThan(0.05);

		/* It stops at the body. */
		state.At = [0, 0, world.Size * 1.02];
		state.Ahead = [0, 0, -1];
		state.Throttle = 1;
		inner.Keys = {KeyW: true, ShiftLeft: true};

		frames(30);

		expect(Math.hypot(state.At[0], state.At[1], state.At[2])).toBeGreaterThanOrEqual(world.Size * 1.0099);

		/* Let go, it stays as it lay. */
		var turn = ship.Turn;

		scene.Control('');

		inner.Rest = 0;

		engine.Frame(now += 33);

		expect(inner.Objects.me.Turn).toBe(turn);
	});

	it('builds a vehicle of its mounts: engines burn with the thrust where they stand, a game asks where they are', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var seen = [];
		var draw = engine.Renderer.Draw;

		var mouths = [];
		var lit = [];

		engine.Renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uFrom)
				seen.push(uniforms.uFrom.slice());

			if (uniforms && uniforms.uShape === 4 && uniforms.uOther)
				mouths.push({Side: Math.hypot.apply(null, uniforms.uSide), Other: Math.hypot.apply(null, uniforms.uOther), Square: uniforms.uSquare});

			if (uniforms && uniforms.uSpan) {
				mouths.Span = uniforms.uSpan;
				mouths.Straight = uniforms.uStraight;
			}

			if (uniforms && uniforms.uShape === 5 && uniforms.uOther)
				mouths.Flare = uniforms.uIntensity;

			if (uniforms && uniforms.uShape === 4 && uniforms.uOther)
				mouths.Options = options;

			if (uniforms && uniforms.uSpan)
				mouths.Blend = options.Blend;

			if (uniforms && uniforms.uLocal)
				lit.push({Count: uniforms.uLocalCount, Power: uniforms.uLocal[4]});

			return draw.apply(this, arguments);
		};

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.02, Parent: 'world', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'world', From: [0, 0, 3], Facing: [0, 0, 1], Mounts: [
			{Kind: 'engine', At: [1, 0, -2], Aim: [0, 0, -1], Size: 0.2, Mouth: [0.4, 0.8]},
			{Kind: 'engine', At: [-1, 0, -2], Aim: [0, 0, -1], Size: 0.2, On: false},
			{Kind: 'gun', At: [0, 1, 2], Aim: [0, 0, 1]}
		]}});
		scene.Control('me');

		frames(3);

		var ship = inner.Objects.me;
		var engines = scene.MountsOf('me', 'engine');

		expect(scene.MountsOf('me').length).toBe(3);
		expect(scene.MountsOf('nothing')).toEqual([]);
		expect(engines.length).toBe(2);
		expect(scene.MountsOf('me', 'gun')[0].Aim[2]).toBeCloseTo(1, 3);

		/* In the size of the ship and turned with it. */
		expect(engines[0].At[2]).toBeCloseTo(ship.World[2] - 0.04 * ship.Size / 0.02, 3);
		expect(Math.abs(engines[0].At[0] - ship.World[0])).toBeCloseTo(0.02 * ship.Size / 0.02, 3);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);

		/* What burns does it where the mount stands; the one that is off and the gun with no type burn nothing. */
		seen.length = 0;

		frames(1);

		var at = scene.MountsOf('me', 'engine')[0].At;
		var offs = seen.map(function (from) {
			return Math.hypot(from[0] + inner.Eye[0] - at[0], from[1] + inner.Eye[1] - at[1], from[2] + inner.Eye[2] - at[2]);
		});

		expect(seen.length).toBeGreaterThan(0);
		expect(Math.min.apply(null, offs)).toBeLessThan(ship.Size * 2);

		var off = scene.MountsOf('me', 'engine')[1].At;

		expect(seen.every(function (from) {
			return Math.hypot(from[0] + inner.Eye[0] - off[0], from[1] + inner.Eye[1] - off[1], from[2] + inner.Eye[2] - off[2]) > ship.Size * 0.9;
		})).toBe(true);

		/* The opening is filled, as wide and as high as it is, and the jet comes out of all of it. */
		expect(mouths.length).toBeGreaterThan(0);
		expect(mouths[mouths.length - 1].Side).toBeCloseTo(0.2 * ship.Size, 6);
		expect(mouths[mouths.length - 1].Other).toBeCloseTo(0.4 * ship.Size, 6);
		expect(mouths[mouths.length - 1].Square).toBe(1);
		expect(mouths.Span[0]).toBeCloseTo(0.2 * ship.Size, 6);
		expect(mouths.Span[1]).toBeCloseTo(0.4 * ship.Size, 6);
		expect(mouths.Straight).toBe(1);

		/* Light: over what shines it adds nothing to see. And metal before a mouth hides it. */
		expect(mouths.Blend).toBe('add');
		expect(mouths.Options.Depth).toBe(true);

		var lamp = inner.Lamps.filter(function (one) {
			return one.Effect;
		})[0];

		expect(lamp.Settings.Spot).toBe(170);
		expect(lamp.Settings.Aim[2]).toBeCloseTo(engines[0].Aim[2], 3);

		/* A soft glare, the more the straighter the eye looks in, far less than a sun; none where it does not burn. */
		var straight = mouths.Flare;

		expect(straight).toBeGreaterThan(0);

		inner.Yaw = 0;
		inner.Pitch = 0;
		inner.ShipAxes = null;

		frames(1);

		var behind = mouths.Flare;

		inner.Yaw = Math.PI / 2;
		inner.ShipAxes = null;

		frames(1);

		expect(mouths.Flare).toBeLessThan(behind * 0.5);
		expect(mouths.Flare).toBeGreaterThan(0);

		/* It lights what is round it, in space as well, the more the harder it burns, and not at rest. */
		var strong = lit[lit.length - 1];

		expect(strong.Count).toBeGreaterThan(0);
		expect(strong.Power).toBeGreaterThan(0);

		ship.Ship.Throttle = 0;
		inner.Keys = {Space: true};

		frames(4);

		expect(lit[lit.length - 1].Power).toBeLessThan(strong.Power * 0.05 + 1e-9);

		inner.Keys = {};

		/* Removed, it takes all of them with it. */
		scene.Remove('me');

		seen.length = 0;

		frames(1);

		expect(seen.length).toBe(0);
	});

	it('makes a part of a vehicle of what lies in a box of its model, moves it by degrees, and keeps what stops a wheel with the wheel', async function () {
		var models = Elemenx.Service('SceneModels');
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var name = unique('windows');
		var box = function (x, y, z) {
			var made = meshes.Box({Width: 0.2, Height: 0.2, Depth: 0.2});

			return {Positions: new Float32Array(Array.from(made.Positions).map(function (value, index) {
				return value + [x, y, z][index % 3];
			})), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: Array.from(made.Indices)};
		};
		var both = function (one, two) {
			var count = one.Positions.length / 3;

			return {Positions: new Float32Array(Array.from(one.Positions).concat(Array.from(two.Positions))), Normals: new Float32Array(Array.from(one.Normals).concat(Array.from(two.Normals))), UVs: new Float32Array(Array.from(one.UVs).concat(Array.from(two.UVs))), Colors: null, Joints: null, Weights: null, Indices: one.Indices.concat(two.Indices.map(function (index) {
				return index + count;
			}))};
		};
		var material = function (word, extra) {
			return Object.assign({Name: word, BaseColor: [1, 1, 1, 1], Metallic: 0, Roughness: 0.5, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null}, extra);
		};

		models.Define(name, {URL: name, Fit: false, Materials: {Dotted: {BaseColor: [0, 0, 0, 1]}}, Asset: {
			Nodes: [{Name: 'body', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}, {Name: 'wheel', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 1, Skin: -1}, {Name: 'pad', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 2, Skin: -1}],
			Meshes: [[{Geometry: both(box(0.6, 0.8, 0), box(0, 0.8, 0)), Material: 0}, {Geometry: box(0, 0.3, 0), Material: 2}], [{Geometry: box(0.7, 0.3, 1), Material: 1}], [{Geometry: box(0.65, 0.3, 1), Material: 3}]],
			Lights: [], Materials: [material('Window'), material('Wheel'), material('Dotted'), material('calipe_color')], Images: [], Skins: [], Animations: [], Scene: [0, 1, 2]
		}});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('unit', {ID: 'car', Name: '', Model: name, Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'wheel', Openings: [{Name: 'windows', Match: 'Window', Both: true, Low: [0.3, 0.5, -1], High: [1, 1.2, 1], Way: [0, -1, 0], Reach: 0.4}]}});
		scene.Control('car');

		frames(3);

		var made = models.Make(name);
		var car = inner.Objects.car;
		var glass = made.Pieces.filter(function (piece) {
			return piece.Opening === 'windows';
		});

		/* Of the two boxes of one mesh only the one at the side came off. */
		expect(glass.length).toBe(1);
		expect(glass[0].Geometry.Indices.length).toBe(36);
		expect(made.Pieces[0].Geometry.Indices.length).toBe(36);

		/* What a recipe says of a material comes over the file. */
		expect(made.Pieces.filter(function (piece) {
			return piece.Material.Name === 'Dotted';
		})[0].Material.BaseColor).toEqual([0, 0, 0, 1]);

		expect(engine.OpeningMove(car, glass[0])[13]).toBe(-0);

		scene.OpenPart('car', 'windows', 1);

		frames(4);

		var part = engine.OpeningMove(car, glass[0])[13];

		expect(part).toBeLessThan(0);
		expect(part).toBeGreaterThan(-0.4);

		frames(60);

		expect(engine.OpeningMove(car, glass[0])[13]).toBeCloseTo(-0.4, 5);

		/* What stops a wheel hangs on it: it steers and rides with it, and does not spin. */
		var pad = car.Wheels[made.Pieces.filter(function (piece) {
			return piece.Material.Name === 'calipe_color';
		})[0].ID];
		var wheel = car.Wheels[made.Pieces.filter(function (piece) {
			return piece.Material.Name === 'Wheel';
		})[0].ID];

		expect(pad.Held).toBe(true);
		expect(wheel.Held).toBeFalsy();
		expect(pad.Middle).toEqual(wheel.Middle);

		var turning = {Values: car.Values, Size: 1, Car: {Spin: 1.2, Steer: 0}};

		expect(engine.WheelTurn(turning, pad)[5]).toBeCloseTo(1, 6);
		expect(engine.WheelTurn(turning, wheel)[5]).not.toBeCloseTo(1, 2);

		turning.Car = {Spin: 0, Steer: 1};

		expect(engine.WheelTurn(turning, pad)[0]).toBeLessThan(0.95);
	});

	it('turns what the driver moves round its hinge: the steering wheel with the steering, pedals, paddles on the wheel, a pair of doors each its own way', async function () {
		var models = Elemenx.Service('SceneModels');
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var vectors = math.Vectors;
		var name = unique('cockpit');
		var box = function (x, y, z, size) {
			var made = meshes.Box({Width: size || 0.1, Height: size || 0.1, Depth: 0.02});

			return {Positions: new Float32Array(Array.from(made.Positions).map(function (value, index) {
				return value + [x, y, z][index % 3];
			})), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: Array.from(made.Indices)};
		};
		var both = function (one, two) {
			var count = one.Positions.length / 3;

			return {Positions: new Float32Array(Array.from(one.Positions).concat(Array.from(two.Positions))), Normals: new Float32Array(Array.from(one.Normals).concat(Array.from(two.Normals))), UVs: new Float32Array(Array.from(one.UVs).concat(Array.from(two.UVs))), Colors: null, Joints: null, Weights: null, Indices: one.Indices.concat(two.Indices.map(function (index) {
				return index + count;
			}))};
		};
		var material = function (word) {
			return {Name: word, BaseColor: [1, 1, 1, 1], Metallic: 0, Roughness: 0.5, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null};
		};
		var node = function (title, mesh) {
			return {Name: title, Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: mesh, Skin: -1};
		};

		/* One interior: a wheel in a disc before the dash, the dash behind it; a pedal of its own node; two doors of one material. */
		models.Define(name, {URL: name, Fit: false, Asset: {
			Nodes: [node('cabin', 0), node('PedalGas_Alu', 1), node('doors', 2), node('PaddleRight', 3), node('GearLever', 4), node('WiperArm', 5), node('panes', 6)],
			Meshes: [[{Geometry: both(box(0.3, 0.6, 0.3, 0.2), box(0.3, 0.6, 0.6, 0.2)), Material: 0}], [{Geometry: box(0.3, 0.3, 0.8), Material: 0}], [{Geometry: both(box(0.8, 0.5, 0), box(-0.8, 0.5, 0)), Material: 1}], [{Geometry: box(0.2, 0.6, 0.37, 0.04), Material: 0}], [{Geometry: box(0.5, 0.45, 0.5, 0.04), Material: 0}], [{Geometry: box(0, 0.9, 1.2, 0.04), Material: 0}], [{Geometry: both(box(0.8, 0.7, 0), box(-0.8, 0.7, 0)), Material: 2}]],
			Lights: [], Materials: [material('Interior'), material('Door'), material('DoorGlass')], Images: [], Skins: [], Animations: [], Scene: [0, 1, 2, 3, 4, 5, 6]
		}});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('unit', {ID: 'car', Name: '', Model: name, Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'none', Openings: [
			{Name: 'steering', Match: 'Interior', Disc: {At: [0.3, 0.6, 0.3], Axis: [0, 0, 1], Radius: 0.15, Depth: 0.06}, Hinge: [0.3, 0.6, 0.3], Axis: [0, 0, -1], Angle: 90, Drive: 'steer'},
			{Name: 'paddle', Match: 'Paddle', Nodes: true, Way: [0, 0, -1], Reach: 0.02, Drive: 'paddle', Sign: 1, Follow: 'steering'},
			{Name: 'gas', Match: 'PedalGas', Nodes: true, Hinge: [0.3, 0.35, 0.8], Axis: [-1, 0, 0], Angle: 20, Drive: 'gas'},
			{Name: 'lever', Match: 'GearLever', Nodes: true, Hinge: [0.5, 0.4, 0.5], Axis: [1, 0, 0], Aside: [0, 0, 1], Angle: 15, Drive: 'gear'},
			{Name: 'wiper', Match: 'WiperArm', Nodes: true, Hinge: [0, 0.9, 1.2], Axis: [0, 1, 0], Angle: 90, Drive: 'wipers', Period: 1},
			{Name: 'glass', Match: 'DoorGlass', Both: true, Way: [0, -1, 0], Reach: 0.1, Open: 0, Follow: 'doors'},
			{Name: 'doors', Match: 'Door', Both: true, Low: [0.6, 0, -1], High: [1, 1, 1], Hinge: [0.85, 0.5, 0.05], Axis: [0, 1, 0], Angle: 60, Open: 1}
		], Gears: [0.4, 1], Wipers: true}});
		scene.Control('car');

		frames(3);

		var made = models.Make(name);
		var car = inner.Objects.car;

		function pieces (opening) {
			return made.Pieces.filter(function (piece) {
				return piece.Opening === opening;
			});
		}

		function moved (piece, point) {
			return math.Apply(engine.OpeningMove(car, piece), point);
		}

		/* Of the one mesh of the cabin the disc takes the wheel and leaves the dash behind it; the pedal and the paddle come by the names of their nodes. */
		expect(pieces('steering').length).toBe(1);
		expect(pieces('steering')[0].Geometry.Indices.length).toBe(36);
		expect(made.Pieces.filter(function (piece) {
			return piece.Node === 0 && !piece.Opening;
		})[0].Geometry.Indices.length).toBe(36);
		expect(pieces('gas').length).toBe(1);
		expect(pieces('paddle').length).toBe(1);

		/* Regression: a piece all of which moved stayed behind empty. */
		expect(made.Pieces.every(function (piece) {
			return piece.Geometry.Indices.length > 0;
		})).toBe(true);

		/* Hinged on both sides, the doors are two, each turning out its own way. */
		var doors = pieces('doors');

		expect(doors.map(function (piece) {
			return piece.Side;
		}).sort()).toEqual([-1, 1]);

		frames(60);

		var right = doors.filter(function (piece) {
			return piece.Side === 1;
		})[0];
		var left = doors.filter(function (piece) {
			return piece.Side === -1;
		})[0];
		var a = moved(right, [0.85, 0.5, 0.3]);
		var b = moved(left, [-0.85, 0.5, 0.3]);

		expect(a[0]).toBeCloseTo(0.85 + 0.25 * Math.sin(Math.PI / 3), 4);
		expect(b[0]).toBeCloseTo(-a[0], 4);
		expect(b[2]).toBeCloseTo(a[2], 4);

		/* The glass of each door is its own, and goes with its door. */
		var panes = pieces('glass');
		var near = panes.filter(function (piece) {
			return piece.Side === 1;
		})[0];
		var far = panes.filter(function (piece) {
			return piece.Side === -1;
		})[0];

		expect(panes.length).toBe(2);
		expect(moved(near, [0.85, 0.7, 0.3])).toEqual([a[0], 0.7, a[2]].map(function (value) {
			return expect.closeTo(value, 4);
		}));
		expect(moved(far, [-0.85, 0.7, 0.3])).toEqual([b[0], 0.7, b[2]].map(function (value) {
			return expect.closeTo(value, 4);
		}));

		/* The wheel goes round its hub with the steering, a quarter turn at full lock, to the left as the car goes left. */
		var wheel = pieces('steering')[0];

		expect(moved(wheel, [0.3, 0.7, 0.3])).toEqual([0.3, 0.7, 0.3].map(function (value) {
			return expect.closeTo(value, 6);
		}));

		/* In neutral the lever stands in the middle; the wipers sweep, as they were told to. */
		expect(car.Opens.lever).toBe(0);

		var swept = [];

		for (var k = 0; k < 30; k++) {
			frames(1);

			swept.push(car.Opens.wiper);
		}

		expect(Math.max.apply(null, swept)).toBeGreaterThan(0.9);
		expect(Math.min.apply(null, swept)).toBeLessThan(0.1);

		inner.Ground.Keys = {KeyA: true, KeyW: true};

		frames(40);

		var top = moved(wheel, [0.3, 0.7, 0.3]);
		var hub = moved(wheel, [0.3, 0.6, 0.3]);

		expect(car.Car.Steer).toBeGreaterThan(0.99);

		/* Driving, an automatic's lever stands in D, ahead. */
		expect(car.Car.Gear).toBeGreaterThan(0);
		expect(car.Opens.lever).toBeCloseTo(1, 3);
		expect(car.Opens['lever:aside']).toBe(0);
		expect(top[0]).toBeCloseTo(0.4, 4);
		expect(top[1]).toBeCloseTo(0.6, 4);
		expect(vectors.Distance(hub, [0.3, 0.6, 0.3])).toBeLessThan(1e-6);

		/* The gas pedal goes down as far as it is pressed. */
		var pedal = moved(pieces('gas')[0], [0.3, 0.25, 0.8]);

		expect(car.Opens.gas).toBeCloseTo(1, 3);
		expect(pedal[2]).toBeGreaterThan(0.8 + 0.1 * Math.sin(20 * Math.PI / 180) * 0.9);

		/* The paddle goes round with the wheel, and is pulled only while the gearbox changes up. */
		var paddle = pieces('paddle')[0];
		var shifted = false;
		var i;

		for (i = 0; i < 200 && !shifted; i++) {
			frames(1);

			shifted = car.Car.Shifting > 0 && car.Car.Shifted === 1;
		}

		expect(shifted).toBe(true);

		frames(2);

		var pulled = moved(paddle, [0.2, 0.6, 0.37]);

		expect(car.Opens.paddle).toBeGreaterThan(0.3);
		expect(vectors.Distance(pulled, moved(wheel, [0.2, 0.6, 0.37]))).toBeCloseTo(0.02 * car.Opens.paddle, 4);

		inner.Ground.Keys = {};

		frames(30);

		expect(car.Opens.paddle).toBe(0);
		expect(car.Opens.gas).toBe(0);

		/* Changing down it stays: that is the other paddle's way. */
		var down = false;

		inner.Ground.Keys = {KeyS: true};

		for (i = 0; i < 300 && !down; i++) {
			frames(1);

			down = car.Car.Shifting > 0 && car.Car.Shifted === -1;
		}

		frames(2);

		expect(down).toBe(true);
		expect(car.Opens.paddle).toBe(0);

		/* Stopped and asked back, it goes into reverse: the lever goes back. */
		for (i = 0; i < 600 && car.Car.Gear !== -1; i++)
			frames(1);

		frames(10);

		expect(car.Car.Gear).toBe(-1);
		expect(car.Opens.lever).toBeCloseTo(-1, 3);
	});

	it('shows the mirrors and the screens of the car that is driven: the world reflected small, what an element of the page shows', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
			'<div slot="screens" data-screen="dash" style="width: 64px; height: 32px; background: rgb(255, 0, 0)"></div>' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var target = renderer.Target;
		var winding = renderer.Winding;
		var sizes = [];
		var turned = 0;
		var shown = [];
		var mirrors = [];
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		/* What is made for a mirror: deep, of floats, with mipmaps; no other picture of the scene has all three. */
		renderer.Target = function (width, height, options) {
			if (options && options.Depth && options.Float && options.Mipmaps)
				sizes.push([width, height, Math.max(1, renderer.Width >> 2), Math.max(1, renderer.Height >> 2)]);

			return target.apply(this, arguments);
		};
		renderer.Winding = function (clockwise) {
			if (clockwise)
				turned++;

			return winding.apply(this, arguments);
		};
		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uPicture !== undefined && uniforms.uBright !== undefined)
				shown.push(uniforms.uPicture);

			if (uniforms && uniforms.uStrength !== undefined)
				mirrors.push(uniforms.uOn);

			return draw.apply(this, arguments);
		};

		try {
			frames(2);

			scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'none',
				Mirrors: [{At: [0, 1.6, 0], Normal: [0, 0, -1], Width: 0.6, Height: 0.3}],
				Screens: [{Source: 'dash', At: [0, 1.2, 0], Normal: [0, 0, -1], Width: 0.6, Height: 0.3, Pixels: [64, 32], Every: 0}]
			}});
			scene.Control('car');

			/* The view behind the car looks at the back of it: the mirror faces it. */
			inner.Yaw = Math.PI;

			frames(4);

			/*
			 * The mirror: the world drawn again, its triangles turned, into a picture as fine as the screen of the part of it the
			 * mirror covers (regression: a quarter of the whole screen, of which a small mirror showed a blur), in steps of 32.
			 */
			expect(turned).toBeGreaterThan(0);
			expect(sizes.length).toBeGreaterThan(0);
			expect(sizes.every(function (size) {
				return size[0] % 32 === 0 && size[1] % 32 === 0 && size[0] <= renderer.Width + 32 && size[1] <= renderer.Height + 32;
			})).toBe(true);
			expect(mirrors).toContain(1);

			/* The screen: once its picture is made, the element it names, red. */
			await waitFor(function () {
				frames(1);

				return shown.length > 0;
			}, 10000);

			var pixel = new Uint8Array(4);
			var gl = renderer.GL;
			var frame = gl.createFramebuffer();

			gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shown[shown.length - 1].Handle, 0);
			gl.readPixels(8, 8, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.deleteFramebuffer(frame);

			expect(Array.from(pixel).slice(0, 3)).toEqual([255, 0, 0]);

			/* Another car, not driven: its panes are not drawn. */
			mirrors = [];
			shown = [];

			scene.Control('');

			frames(3);

			expect(mirrors).toEqual([]);
			expect(shown).toEqual([]);
		}
		finally {
			renderer.Draw = draw;
			renderer.Target = target;
			renderer.Winding = winding;
		}
	});

	it('lights a car: its lamps on at night or by L, the rear brighter as it brakes, reverse, indicators that blink and go off, hazards; a wet road holds less', async function () {
		var models = Elemenx.Service('SceneModels');
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var name = unique('lamps');
		var box = function (x, y, z) {
			var made = meshes.Box({Width: 0.2, Height: 0.1, Depth: 0.05});

			return {Positions: new Float32Array(Array.from(made.Positions).map(function (value, index) {
				return value + [x, y, z][index % 3];
			})), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: Array.from(made.Indices)};
		};
		var pair = function (y, z) {
			var one = box(0.5, y, z);
			var two = box(-0.5, y, z);
			var count = one.Positions.length / 3;

			return {Positions: new Float32Array(Array.from(one.Positions).concat(Array.from(two.Positions))), Normals: new Float32Array(Array.from(one.Normals).concat(Array.from(two.Normals))), UVs: new Float32Array(Array.from(one.UVs).concat(Array.from(two.UVs))), Colors: null, Joints: null, Weights: null, Indices: one.Indices.concat(two.Indices.map(function (index) {
				return index + count;
			}))};
		};
		var material = function (word) {
			return {Name: word, BaseColor: [1, 1, 1, 1], Metallic: 0, Roughness: 0.5, Emissive: [0, 0, 0], Clearcoat: 0, CoatRoughness: 0, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null};
		};

		models.Define(name, {URL: name, Fit: false, Asset: {
			Nodes: [{Name: 'body', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}],
			Meshes: [[{Geometry: pair(0.5, 1.8), Material: 0}, {Geometry: pair(0.5, -1.8), Material: 1}, {Geometry: pair(0.7, 1.8), Material: 2}]],
			Lights: [], Materials: [material('HeadGlass'), material('TailGlass'), material('Amber')], Images: [], Skins: [], Animations: [], Scene: [0]
		}});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="0.2" Water="0" Seed="flat" /><SceneObject ID="sun" Kind="sun" Time="12" Latitude="45" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var physics = scene.$Service('Physics');
		var car = physics.Car;
		var grips = [];
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		function lamps () {
			return engine.VehicleLamps().map(function (lamp) {
				return lamp.Settings;
			});
		}

		function glows () {
			return Object.keys(inner.GlowLists).filter(function (key) {
				return key.indexOf('lit:') === 0 && inner.GlowLists[key].Count;
			}).length;
		}

		physics.Car = function (state, input, surface) {
			grips.push(surface(state.X, state.Z).Grip);

			return car.apply(this, arguments);
		};

		try {
			frames(2);

			scene.Add('unit', {ID: 'car', Name: '', Model: name, Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'none', Gears: [0.4, 1], WetGrip: 0.6, Lamps: [
				{Kind: 'indicator', Match: 'Amber', Both: true},
				{Kind: 'head', Match: 'HeadGlass', Both: true},
				{Kind: 'rear', Match: 'TailGlass', Both: true}
			]}});
			scene.Control('car');

			frames(3);

			/* A change of the scene makes its objects anew: the car is asked for each time. */
			var me = function () {
				return inner.Objects.car;
			};
			var places = me().Values.Vehicle.LampPlaces;

			/* Each glass on its own side, the light from its middle. */
			expect(places['lamp-1'][1]).toEqual([0.5, 0.5, 1.8].map(function (value) {
				return expect.closeTo(value, 4);
			}));
			expect(places['lamp-1'][-1][0]).toBeCloseTo(-0.5, 4);

			/* By day, dry, and standing still nothing is lit, and the road holds as it is. */
			expect(me().Signals.Lights).toBe(false);
			expect(lamps()).toEqual([]);
			expect(grips[grips.length - 1]).toBe(1);

			/* At night the lights come on by themselves: the head lamps throw a spot ahead, the rear glows dim, their glass glows evenly. */
			scene.Change('sun', {Time: 23});

			frames(2);

			var lit = lamps();

			expect(me().Signals.Lights).toBe(true);
			expect(lit.filter(function (lamp) {
				return lamp.Spot === 60 && lamp.Aim[2] > 0.9;
			}).length).toBe(2);
			expect(lit.filter(function (lamp) {
				return lamp.Color === '#ff1a10';
			}).map(function (lamp) {
				return lamp.Power;
			})).toEqual([0.8 * 0.3, 0.8 * 0.3].map(function (value) {
				return expect.closeTo(value, 6);
			}));
			expect(glows()).toBe(4);

			/* L puts them out, whatever the hour. */
			inner.Ground.Keys = {KeyL: true};

			frames(1);

			inner.Ground.Keys = {};

			frames(1);

			expect(me().Signals.Lights).toBe(false);
			expect(lamps()).toEqual([]);

			/* Going and braking, the rear lamps are bright. */
			inner.Ground.Keys = {KeyW: true};

			frames(40);

			/* Regression: a change of the scene (the hour) made the car anew, and it stopped where it went. */
			var going = me().Car.Forward;

			expect(going).toBeGreaterThan(5);

			scene.Change('sun', {Time: 22});

			frames(1);

			expect(me().Car.Forward).toBeGreaterThan(going * 0.9);
			expect(me().Signals.Lights).toBe(false);

			inner.Ground.Keys = {KeyS: true};

			frames(2);

			expect(lamps().map(function (lamp) {
				return lamp.Power;
			})).toEqual([0.8, 0.8]);

			/* Stopped and going back, the reverse lamps light: none is told, so none throws light, but the gear says it. */
			for (var i = 0; i < 300 && me().Car.Gear !== -1; i++)
				frames(1);

			frames(3);

			expect(me().Car.Gear).toBe(-1);
			expect(lamps()).toEqual([]);

			inner.Ground.Keys = {};

			frames(5);

			/* Z shows the left, blinking on the left alone, and it goes off once the wheel has turned left and come back. */
			var left = [];
			var right = [];

			inner.Ground.Keys = {KeyZ: true};

			frames(1);

			inner.Ground.Keys = {};

			for (i = 0; i < 40; i++) {
				frames(1);

				left.push(engine.VehicleLamps().filter(function (lamp) {
					return lamp.Settings.Color === '#ffa020' && lamp.At[0] > me().World[0];
				}).length);
				right.push(engine.VehicleLamps().filter(function (lamp) {
					return lamp.Settings.Color === '#ffa020' && lamp.At[0] < me().World[0];
				}).length);
			}

			expect(me().Signals.Indicate).toBe(-1);
			expect(Math.max.apply(null, left)).toBe(1);
			expect(Math.min.apply(null, left)).toBe(0);
			expect(Math.max.apply(null, right)).toBe(0);

			inner.Ground.Keys = {KeyA: true};

			frames(20);

			inner.Ground.Keys = {};

			frames(20);

			expect(me().Signals.Indicate).toBe(0);

			/* Z and X together are the hazard lights: both sides. */
			inner.Ground.Keys = {KeyZ: true, KeyX: true};

			frames(1);

			inner.Ground.Keys = {};

			frames(1);

			expect(me().Signals.Hazard).toBe(true);
			expect(lamps().filter(function (lamp) {
				return lamp.Color === '#ffa020';
			}).length).toBe(2);

			/* A wet road holds as much as WetGrip says. */
			inner.Ground.Air.Wet = 1;

			frames(1);

			expect(grips[grips.length - 1]).toBeCloseTo(0.6, 2);
		}
		finally {
			physics.Car = car;
		}
	});

	it('looks ahead from the seat of a car while it moves, but while the right button is held', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" Person="first" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="400" Height="0" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Heading: 0}});
		scene.Control('car');

		var keep = scene.Captured;

		scene.Captured = function () {
			return true;
		};

		inner.Ground.Keys = {KeyW: true};

		frames(30);

		/* Without the button the mouse moves nothing. */
		var yaw = inner.Yaw;

		inner.Rest = 0;
		inner.LockAt = 0;
		inner.Flow = 100;

		scene.PointerMove({pointerId: 1, movementX: 60, movementY: 40, buttons: 0, clientX: 0, clientY: 0});

		expect(inner.Yaw).toBe(yaw);

		/* With it the head turns, and stays turned while it is held. */
		scene.PointerMove({pointerId: 1, movementX: 60, movementY: 40, buttons: 2, clientX: 0, clientY: 0});

		var held = inner.Yaw;

		expect(held).not.toBe(yaw);

		frames(10);

		expect(inner.Yaw).toBe(held);

		/* Let go, it comes back to the road. */
		inner.LookHeld = false;

		frames(60);

		var behind = inner.Objects.car.Facing + Math.PI;

		expect(Math.abs(Math.atan2(Math.sin(behind - inner.Yaw), Math.cos(behind - inner.Yaw)))).toBeLessThan(0.05);
		expect(inner.Pitch).toBeCloseTo(0.02, 1);

		/* On a road that falls the eyes go down with the car: they do not stay level and look over its nose at the sky. */
		var falling = inner.Objects.car;

		falling.Body = Elemenx.Service('Math').Rotation([1, 0, 0], 0.2);
		falling.Car.Heading = 0;
		falling.Head = [0, 1, 0];

		inner.SeatLook = null;
		inner.Yaw = Math.PI;
		inner.Pitch = 0.02;

		var seated = engine.SeatView(falling, 0.033);

		expect(seated.Ahead[1]).toBeCloseTo(-Math.sin(0.2), 3);
		expect(seated.At[1]).toBeCloseTo(falling.World[1] + 1, 6);

		scene.Captured = keep;
	});

	it('bursts at the pipes of a car when it lets go of the gas at speed', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="900" Height="0" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var seen = [];
		var burst = engine.EffectBurst;

		engine.EffectBurst = function (type, at) {
			seen.push({Type: type, At: at});

			return burst.apply(this, arguments);
		};

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Heading: 0, Mounts: [{Kind: 'engine', Type: 'smoke', At: [0, 0.4, -2], Aim: [0, 0, -1], Pop: true}, {Kind: 'engine', At: [0.5, 0.4, -2], Aim: [0, 0, -1]}]}});
		scene.Control('car');

		inner.Ground.Keys = {KeyW: true};

		frames(60);

		expect(seen.length).toBe(0);

		inner.Ground.Keys = {};

		frames(3);

		expect(seen.length).toBe(1);
		expect(seen[0].Type).toBe('backfire');
		expect(seen[0].At[2]).toBeLessThan(inner.Objects.car.World[2]);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
	});

	it('stops a ship at what flies there: a craft by the box of its model, as a body by its round', async function () {
		var models = Elemenx.Service('SceneModels');
		var roads = Elemenx.Service('SceneRoads');
		var name = unique('hull');

		models.Define(name, {URL: name, Asset: roads.Asset([roads.Road(Elemenx.Service('SceneRoadGenerator').Track('hull', {Length: 200, Corners: 6}).Spec)]), Fit: false});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		frames(2);

		scene.Add('ship', {ID: 'me', Name: '', Size: 0.002, Parent: 'world', Vehicle: {Kind: 'ship', Top: 0.4, Around: 'world', From: [0, 0, 3], Facing: [0, 0, -1]}});
		scene.Control('me');

		frames(2);

		var world = inner.Objects.world;
		var ship = inner.Objects.me;

		/* A hull of a size beside the ship, straight on its way. */
		scene.Add('craft', {ID: 'hull', Name: '', Model: name, Size: 0.001, Parent: 'world', Distance: 2, Period: 1000000, Anomaly: 0});

		frames(2);

		var hull = inner.Objects.hull;

		ship.Ship.At = [hull.World[0] - world.World[0], hull.World[1] - world.World[1], hull.World[2] - world.World[2]];
		ship.Ship.Way = [0, 0, -0.1];
		ship.Ship.Throttle = 1;

		inner.Keys = {KeyW: true};

		frames(2);

		expect(ship.Ship.Throttle).toBeLessThan(1);
	});

	it('does not take a sheet a file lies on for what stands on it', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var engine = mounted.Space.Engine();
		var identity = Elemenx.Service('Math').Identity();
		var box = engine.BoxOf({Pieces: [{Rest: identity, Geometry: {Positions: [-50, 0, -50, 50, 0, -50, 50, 0, 50, -50, 0, 50]}}, {Rest: identity, Geometry: {Positions: [-1, 0, -2, 1, 1, 2]}}]});

		expect(box.Low).toEqual([-1, 0, -2]);
		expect(box.High).toEqual([1, 1, 2]);
	});

	it('hangs a wheel on its spring: it goes down as far as the spring has opened, in the size of the car', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var engine = mounted.Space.Engine();
		var car = {Values: {Vehicle: {}}, Size: 2, Car: {Spin: 0, Steer: 0}, Strokes: [0.1, 0, 0, -0.04]};
		var left = engine.WheelTurn(car, {Middle: [1, 0.3, 1], Front: true, Corner: 0});
		var right = engine.WheelTurn(car, {Middle: [1, 0.3, 1], Front: false, Corner: 3});

		expect(left[13]).toBeCloseTo(-0.05, 6);
		expect(right[13]).toBeCloseTo(0.02, 6);
	});

	it('draws glass last, through it what is behind, and throws no shadow of it', async function () {
		var models = Elemenx.Service('SceneModels');
		var roads = Elemenx.Service('SceneRoads');
		var asset = roads.Asset([roads.Road(Elemenx.Service('SceneRoadGenerator').Track('glass', {Length: 400, Corners: 6}).Spec)]);
		var name = unique('glassy');

		asset.Materials.push(Object.assign({}, asset.Materials[1], {Name: 'Window', Alpha: 'BLEND', Transmission: 1, BaseColor: [0, 0, 0, 0.25], DoubleSided: true}));
		asset.Materials.push(Object.assign({}, asset.Materials[1], {Name: 'Leaves', Alpha: 'BLEND', Transmission: 0, DoubleSided: true}));

		asset.Meshes[0][0].Material = asset.Materials.length - 2;
		asset.Meshes[0][1].Material = asset.Materials.length - 1;

		models.Define(name, {URL: name, Asset: asset, Fit: false});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<Scene Paused="true" Quality="medium" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var drawn = [];
		var depth = [];
		var draw = engine.Renderer.Draw;

		scene.Add('ship', {ID: 'body', Name: '', Model: name, Size: 0.02, Parent: 'world', Vehicle: {Kind: 'ship', Around: 'world', From: [0, 0, 3]}});
		scene.Control('body');

		engine.Renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uBaseColor) drawn.push({Glass: uniforms.uGlass, Options: options || {}, Moving: uniforms.uMoving, Cut: uniforms.uCutoff, Mesh: mesh});
			else if (uniforms && uniforms.uViewProjection && !uniforms.uLightCount) depth.push(mesh);

			return draw.apply(this, arguments);
		};

		for (var i = 0; i < 6; i++) {
			inner.Rest = 0;
			drawn = [];

			engine.Frame(now += 33);
		}

		/* The draws of the last frame (what stands still of the body is one with its kind, each of a material). */
		var last = drawn;
		var glass = last.filter(function (one) {
			return one.Glass > 0;
		});
		var leaves = last.filter(function (one) {
			return one.Cut > 0;
		});

		expect(glass.length).toBe(1);
		expect(glass[0].Options.Blend).toBe('over');
		expect(glass[0].Options.DepthWrite).toBe(false);

		/* It comes after all that may be seen through it. */
		expect(last[last.length - 1].Glass).toBeGreaterThan(0);

		/* Cut out of a body that moves, it is marked as moving like the rest of the body. */
		expect(leaves.length).toBe(1);
		expect(leaves[0].Moving).toBe(1);
		expect(leaves[0].Options.DepthWrite).not.toBe(false);

		/* Light goes through it: on a ground the map of the shadows has the rest and not the glass. */
		var sunny = await mount('<Scene Paused="true" Quality="medium" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></Scene>');
		var lit = sunny.Space.Scene();
		var litEngine = sunny.Space.Engine();
		var litDraw = litEngine.Renderer.Draw;
		var solid = [];
		var windows = [];
		var cast = [];

		sunny.Space.Add('unit', {ID: 'body', Name: '', Model: name, Size: 0.01, X: 0, Y: 0});

		litEngine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uBaseColor) (uniforms.uGlass > 0 ? windows : solid).push(mesh);
			else if (uniforms && uniforms.uViewProjection && !uniforms.uLightCount) cast.push(mesh);

			return litDraw.apply(this, arguments);
		};

		for (var j = 0; j < 6; j++) {
			lit.Rest = 0;

			litEngine.Frame(now += 33);
		}

		expect(windows.length).toBeGreaterThan(0);
		expect(cast.indexOf(solid[0])).toBeGreaterThan(-1);
		expect(cast.indexOf(windows[0])).toBe(-1);
	});

	it('leaves no trail: the frames do not bring back where a body was, nor the clouds and rays its shape', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var shaders = scene.LightingShaders(graphics);
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var identity = math.Identity();

		function picture (each) {
			var data = new Float32Array(9 * 9 * 4);
			var x;
			var y;

			for (y = 0; y < 9; y++) {
				for (x = 0; x < 9; x++)
					data.set(each(x, y), (y * 9 + x) * 4);
			}

			return renderer.Texture({Width: 9, Height: 9, Data: data}, {Float: true, Nearest: true});
		}

		function middle (fragment, uniforms) {
			var target = renderer.Target(9, 9, {Float: true});
			var pixel = new Float32Array(4);

			target.Begin();

			renderer.Draw(quad, renderer.Program(graphics.Shaders.Quad, fragment), uniforms, {Depth: false, DepthWrite: false, Cull: 'none'});

			gl.readPixels(4, 4, 1, 1, gl.RGBA, gl.FLOAT, pixel);

			target.End();
			target.Destroy();

			return Array.from(pixel);
		}

		var edge = picture(function (x) {
			return x < 5 ? [0, 0, 0, 1] : [1, 1, 1, 1];
		});
		var body = picture(function (x) {
			return x < 5 ? [0, 0, 0, 0] : [1, 1, 1, 1];
		});
		var depth = picture(function () {
			return [0.5, 0, 0, 1];
		});
		var flame = picture(function () {
			return [1, 1, 1, 1];
		});
		var free = picture(function () {
			return [1, 1, 1, 0];
		});
		var uniforms = {uDepth: depth, uInverse: identity, uMatrix: identity, uMoved: [0, 0, 0], uMix: 0.92, uPixel: [1 / 9, 1 / 9]};

		/* How much of a sun is seen is read on the sun: a sun whose middle just left the frame is seen still, and only far off it is not. */
		var open = picture(function () {
			return [1, 0, 0, 1];
		});
		var hidden = picture(function () {
			return [0.5, 0, 0, 1];
		});
		var holed = picture(function (x, y) {
			return [Math.abs(x - 4) < 2 && Math.abs(y - 4) < 2 ? 0.5 : 1, 0, 0, 1];
		});
		var half = picture(function () {
			return [0.5, 0.5, 0, 1];
		});
		var sunlit = {uDepth: open, uCloud: free, uOld: half, uSpot: [0.5, 0.5], uRing: [0.02, 0.02], uClear: 0.9, uMix: 1, uEyeMix: [1, 1]};

		expect(middle(shaders.Sunlit, sunlit)[0]).toBeCloseTo(1, 4);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uDepth: hidden}))[0]).toBeCloseTo(0, 4);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uSpot: [1.1, 0.5]}))[0]).toBeGreaterThan(0.75);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uSpot: [1.4, 0.5]}))[0]).toBeGreaterThan(0.1);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uSpot: [1.4, 0.5]}))[0]).toBeLessThan(0.75);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uSpot: [1.7, 0.5]}))[0]).toBeCloseTo(0, 4);

		/* A large disc is read all over: what stands in the middle of it does not hide it. */
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uDepth: holed}))[0]).toBeCloseTo(0, 4);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, {uDepth: holed, uRing: [0.4, 0.4]}))[0]).toBeCloseTo(1, 4);

		/* The eye shuts at once and opens slowly, and the lens does not care. */
		var eye = {uMix: 0.14, uEyeMix: [0.5, 0.1]};

		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, eye))[0]).toBeCloseTo(0.57, 2);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, eye))[1]).toBeCloseTo(0.75, 2);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, eye, {uDepth: hidden}))[0]).toBeCloseTo(0.43, 2);
		expect(middle(shaders.Sunlit, Object.assign({}, sunlit, eye, {uDepth: hidden}))[1]).toBeCloseTo(0.45, 2);

		/* The middle is dark and still, and white lies by it: a history of white passes the colors round it. */
		var kept = middle(shaders.Frames, Object.assign({uColor: edge, uPast: free}, uniforms));

		expect(kept[0]).toBeGreaterThan(0.5);
		expect(kept[3]).toBe(0);

		/* But where a body stood a frame ago there is no history at all. */
		var left = middle(shaders.Frames, Object.assign({uColor: edge, uPast: flame}, uniforms));

		expect(left[0]).toBeLessThan(0.01);

		/* What moves keeps little of it, and is marked for the next frame. */
		var moving = middle(shaders.Frames, Object.assign({uColor: body, uPast: free}, uniforms));

		expect(moving[0]).toBeLessThan(0.4);
		expect(moving[3]).toBe(1);

		/* The shape a body cut out of clouds goes at once with no new frame showing it. */
		var clouds = middle(shaders.CloudFrames, {uNew: picture(function () {
			return [0.5, 0.5, 0.5, 0.5];
		}), uOld: picture(function () {
			return [0, 0, 0, 0];
		}), uInverse: identity, uMatrix: identity, uMix: 0.9, uPixel: [1 / 9, 1 / 9]});

		expect(clouds[0]).toBeCloseTo(0.5, 3);
	});

	it('keeps the size of a limb through a fade: the two poses are turned between, not mixed', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var skinned = scene.Shaders(graphics).Skinned;
		var from = skinned.indexOf('mat4 joint(');
		var to = skinned.indexOf('void main()');
		var size = 0.5;
		var pivot = [2, 0, 0];

		/* A joint at rest at pivot, in a model of half size: first as it was bound, then turned a right angle round itself. */
		function line (turn) {
			var m = math.Multiply(math.Translation(pivot[0] * size, pivot[1] * size, pivot[2] * size), math.Multiply(math.Scaling(size, size, size), math.Multiply(turn, math.Translation(-pivot[0], -pivot[1], -pivot[2]))));

			return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14]];
		}

		var palette = renderer.Texture({Width: 3, Height: 3, Data: new Float32Array(line(math.Identity()).concat(line(math.Rotation([0, 0, 1], Math.PI / 2)), [pivot[0], pivot[1], pivot[2], 0, 0, 0, 0, 0, 0, 0, 0, 0]))}, {Float: true, Nearest: true});
		var fragment = '#version 300 es\nprecision highp float;\nuniform sampler2D uPalette;\nuniform float uJointOffset;\nuniform vec4 aFrames;\nout vec4 outColor;\n' + skinned.slice(from, to) + 'void main() {\n	mat4 m = posed(0.0);\n	outColor = vec4(length(m[0].xyz), length(m[1].xyz), distance((m * vec4(2.0, 0.0, 0.0, 1.0)).xyz, vec3(1.0, 0.0, 0.0)), 1.0);\n}';
		var target = renderer.Target(1, 1, {Float: true});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var pixel = new Float32Array(4);

		target.Begin();

		renderer.Draw(quad, renderer.Program(graphics.Shaders.Quad, fragment), {uPalette: palette, uJointOffset: 0, aFrames: [0, 1, 0.5, 0]}, {Depth: false, DepthWrite: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);

		target.End();

		/* Mixed as matrices, half of a right angle would leave 0.71 of it. */
		expect(pixel[0]).toBeCloseTo(0.5, 2);
		expect(pixel[1]).toBeCloseTo(0.5, 2);

		/* And the joint stays where it is. */
		expect(pixel[2]).toBeLessThan(0.002);
	});

	it('blinds with a sun in space as with a sun over a ground, the more the nearer, and what hides it takes it away', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="high" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();
		var now = performance.now() + 100;
		var told = null;
		var end = engine.PostEnd;
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');

		engine.PostEnd = function (view) {
			told = view;

			return end.apply(this, arguments);
		};

		function frame () {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}

		frame();

		expect(told.Star).toBe(true);
		expect(math.Vectors.Length(told.Sun)).toBeCloseTo(1, 5);
		expect(told.Clear).toBeLessThan(1);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);

		var far = told.Glare;

		inner.Wanted = inner.Distance = inner.Distance / 40;

		frame();

		expect(told.Glare).toBeGreaterThanOrEqual(far);

		/* What hides it is what stands before the star: the star itself writes a depth, and hides nothing of itself. */
		var clear = null;
		var draw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uClear !== undefined)
				clear = uniforms.uClear;

			return draw.apply(this, arguments);
		};

		frame();

		expect(clear).toBe(told.Clear);
		expect(clear).toBeLessThan(0.9999);

		/* Where there is a depth to read, a mouth is hidden strictly by what stands before it, and what comes out of it is light. */
		mounted.Space.Add('ship', {ID: 'me', Name: '', Size: 0.02, Parent: 'world', Vehicle: {Kind: 'ship', Top: 0.3, Around: 'world', From: [0, 0, 3], Facing: [0, 0, 1], Mounts: [{Kind: 'engine', At: [1, 0, -2], Aim: [0, 0, -1], Size: 0.2, Mouth: [0.4, 0.8]}]}});
		mounted.Space.Control('me');

		var plateOptions = null;
		var plateUniforms = null;
		var volumeOptions = null;

		engine.Renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uShape === 4 && uniforms.uOther) {
				plateOptions = options;
				plateUniforms = uniforms;
			}

			if (uniforms && uniforms.uSpan)
				volumeOptions = options;

			return draw.apply(this, arguments);
		};

		inner.Objects.me;

		frame();
		frame();

		inner.Objects.me.Ship.Throttle = 1;

		frame();

		expect(plateOptions.Depth).toBe(true);
		expect(plateUniforms.uSoft).toBe(0);
		expect(volumeOptions.Blend).toBe('add');
		expect(volumeOptions.Cull).toBe('front');

		/* Beside a star what burns goes in its light, little by little; a Veil of 0 leaves it, and so does a star that something hides. */
		var eyes = engine.SunEye;
		var nearest = engine.NearestStar;
		var mouth = null;
		var jet = null;
		var flare = null;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uSquare !== undefined && uniforms.uShape === 4)
				mouth = uniforms;

			if (uniforms && uniforms.uSquare !== undefined && uniforms.uShape === 5)
				flare = uniforms;

			if (uniforms && uniforms.uSpan && uniforms.uStraight)
				jet = uniforms;

			return draw.apply(this, arguments);
		};

		expect(nearest().At).toEqual(inner.Objects.star.World);
		expect(nearest().Veil).toBe(3);

		function burning (reach, shut, turned) {
			var length = math.Vectors.Length(mouth.uFrom);
			var way = math.Vectors.Scale(mouth.uFrom, 1 / length);
			var side = math.Vectors.Normalize(math.Vectors.Cross(way, [0, 1, 0]));

			engine.SunEye = function () {
				return shut;
			};
			engine.NearestStar = function () {
				return {At: math.Vectors.Add(inner.Eye, math.Vectors.Add(math.Vectors.Scale(way, 100 * Math.cos(turned)), math.Vectors.Scale(side, 100 * Math.sin(turned)))), Size: 1, Veil: reach};
			};

			frame();

			return jet.uIntensity;
		}

		frame();

		var full = burning(0, 1, 0);

		expect(full).toBeGreaterThan(0);

		var inside = mouth.uIntensity;

		flare = null;

		expect(burning(3, 1, 0)).toBe(0);
		expect(burning(3, 1, 0.005)).toBe(0);

		/* What comes out goes in the light of the star; the metal round a mouth keeps it out of what burns inside. */
		expect(flare).toBe(null);
		expect(mouth.uIntensity).toBeCloseTo(inside * 0.75, 5);

		var nearer = burning(3, 1, 0.015);
		var near = burning(3, 1, 0.02);

		expect(nearer).toBeGreaterThan(0);
		expect(nearer).toBeLessThan(near);
		expect(near).toBeLessThan(full);
		expect(burning(3, 1, 0.04)).toBeCloseTo(full, 5);
		expect(burning(5, 1, 0.04)).toBeLessThan(full);
		expect(burning(3, 0, 0)).toBeCloseTo(full, 5);
		expect(burning(3, 0.5, 0)).toBeCloseTo(full / 2, 5);

		engine.SunEye = eyes;
		engine.NearestStar = nearest;

		/* Far off a depth is not exact: the flare of a mouth has that much to spare, and hides by degrees. */
		var wide = inner.Objects.me.Values.Vehicle.Mounts[0].Mouth;

		inner.Objects.me.Values.Vehicle.Mounts[0].Mouth = 0.0001;

		frame();

		var spare = flare.uTapFar[1] - flare.uTapFar[0];

		expect(spare).toBeGreaterThanOrEqual((flare.uTapFar[1] + spare) * 0.012 - 1e-9);
		expect(effectsSource).toContain('smoothstep(uTapFar.x, uTapFar.y,');

		inner.Objects.me.Values.Vehicle.Mounts[0].Mouth = wide;

		/* A mouth goes with the hull when it banks, and leans by its Twist. */
		var hero = inner.Objects.me;
		var level = math.Vectors.Normalize(mouth.uSide);

		hero.Ship.Up = math.Vectors.Normalize([hero.Ship.Right[0] + hero.Ship.Up[0], hero.Ship.Right[1] + hero.Ship.Up[1], hero.Ship.Right[2] + hero.Ship.Up[2]]);
		hero.Ship.Right = math.Vectors.Normalize(math.Vectors.Cross(hero.Ship.Up, hero.Ship.Ahead));

		frame();

		expect(Math.abs(math.Vectors.Dot(math.Vectors.Normalize(mouth.uSide), level))).toBeLessThan(0.9);

		var side = math.Vectors.Normalize(mouth.uSide);

		hero.Values.Vehicle.Mounts[0].Twist = 90;

		frame();

		expect(Math.abs(math.Vectors.Dot(math.Vectors.Normalize(mouth.uSide), side))).toBeLessThan(0.05);

		hero.Values.Vehicle.Mounts[0].Twist = 0;

		/* The eye comes back from the card without a frame waiting for it. */
		var read = 0;
		var data = engine.Renderer.GL.getBufferSubData;

		var shut = [];

		engine.Renderer.GL.getBufferSubData = function (target, offset, into) {
			read++;

			data.apply(this, arguments);

			into.set([0.9, 0.3, 0, 1]);
		};

		/* The star is put on each side in turn, so that it comes before the eye. */
		var post = engine.PostEnd;

		for (const side of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
			engine.PostEnd = function (view) {
				view.Sun = side;

				return post.apply(this, arguments);
			};

			for (var i = 0; i < 40; i++) {
				frame();

				shut.push(engine.SunEye());

				engine.Renderer.GL.finish();

				/* A fence of WebGL says it passed only after the page gave way. */
				await new Promise(function (done) {
					setTimeout(done, 0);
				});
			}
		}

		/* Nothing is read while nobody asks for it. */
		var pixels = engine.Renderer.GL.readPixels;
		var reads = 0;
		var keep = engine.NearestStar;

		engine.NearestStar = function () {
			return null;
		};

		engine.Renderer.GL.readPixels = function () {
			reads++;

			return pixels.apply(this, arguments);
		};

		for (const side of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
			engine.PostEnd = function (view) {
				view.Sun = side;

				return post.apply(this, arguments);
			};

			for (var quiet = 0; quiet < 20; quiet++) {
				frame();

				await new Promise(function (done) {
					setTimeout(done, 0);
				});
			}
		}

		var calm = reads;

		engine.Renderer.GL.readPixels = pixels;
		engine.NearestStar = keep;

		expect(calm).toBeLessThanOrEqual(1);

		engine.PostEnd = post;
		engine.Renderer.GL.getBufferSubData = data;

		expect(read).toBeGreaterThan(0);
		expect(shut.some(function (value) {
			return Math.abs(value - 0.3) < 0.001;
		})).toBe(true);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);

		/* A word of its own may know a wheel by its material; the word of all cars looks at the names of the nodes only. */
		var wheel = {ID: 'tyre', Node: 0, Rest: math.Identity(), Material: {Name: 'Tyre'}, Geometry: {Positions: [0.8, 0.3, 1.5, 0.8, 0.6, 1.5, 0.8, 0.3, 1.8]}};
		var worn = {Asset: {Nodes: [{Name: 'Object_1', Parent: -1}]}, Pieces: [wheel]};

		expect(engine.WheelsOf(worn, {}).tyre).toBe(undefined);
		expect(engine.WheelsOf(worn, {Wheels: 'Tyre'}).tyre.Corner).toBe(0);

		engine.Renderer.Draw = draw;

		expect(mounted.Space.Shaders(graphics).Star).toMatch(/limb\) \* 2\.4/);
		expect(mounted.Space.LightingShaders(graphics).Shafts).toMatch(/step\(uClear,/);
	});

	it('takes the sun out of a fog: no glare, no rays', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" Weather="clear" Front="0.01" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		function frames () {
			for (var i = 0; i < 8; i++) {
				inner.Rest = 0;

				engine.Frame(now += 50);
			}
		}

		frames();

		expect(inner.Ground.Glare).toBeGreaterThan(0.5);

		scene.Weather = 'fog';

		frames();

		expect(inner.Ground.Glare).toBeLessThan(0.01);
	});

	it('changes what an effect is told as time goes: its Pulse', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var seen = [];
		var draw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uShape === 0 && uniforms.uSide)
				seen.push({Intensity: uniforms.uIntensity, Color: uniforms.uColor.slice()});

			return draw.apply(this, arguments);
		};

		/* The time of a paused scene stands: it is moved by hand. */
		function frame (seconds) {
			inner.Seconds += seconds;
			inner.Rest = 0;

			engine.Frame(now += 33);

			return seen[seen.length - 1];
		}

		frame(0.1);

		scene.Add('effect', {ID: 'told', Type: 'circle', Appear: 0, Tune: {pool: false}, Pulse: {Intensity: {From: 0.2, To: 2, Time: 2, Shape: 'ping'}, Color: {From: '#ff0000', To: '#0000ff', Time: 2, Shape: 'ping'}}});

		var first = frame(0.05);
		var half = frame(0.95);
		var round = frame(1);

		expect(half.Intensity).toBeGreaterThan(first.Intensity * 4);
		expect(round.Intensity).toBeLessThan(0.4);
		expect(first.Color[0]).toBeGreaterThan(first.Color[2]);
		expect(half.Color[2]).toBeGreaterThan(half.Color[0]);

		/* Once: there it goes, and there it stays. */
		scene.Change('told', {Pulse: {Intensity: {From: 0.5, To: 1.5, Time: 0.5, Shape: 'once'}}});

		var kept = frame(1);

		expect(frame(1).Intensity).toBe(kept.Intensity);

		/* A step is one or the other. */
		scene.Change('told', {Pulse: {Intensity: {From: 0, To: 1, Time: 1, Shape: 'step'}}});

		var values = [frame(0.3).Intensity, frame(0.3).Intensity, frame(0.3).Intensity, frame(0.3).Intensity];

		expect(Math.min.apply(null, values)).toBe(0);
		expect(Math.max.apply(null, values)).toBeGreaterThan(0);
	});

	it('draws a craft of a model at its place of an orbit', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1"><SceneObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></SceneObject></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		engine.Frame(now);

		scene.Add('craft', {ID: 'hub', Parent: 'world', Model: 'box', Size: 0.3, Distance: 2, Anomaly: 90, Inclination: 0, Period: 1e6});

		engine.Frame(now + 30);

		var hub = inner.Objects.hub;
		var world = inner.Objects.world;

		expect(hub.World[2] - world.World[2]).toBeCloseTo(-world.Size * 2, 1);
		expect(gameSceneSource).toContain('if (settings && (settings.Shape || object.Values.Model))');
	});

	it('looks from what it follows to where it looks by degrees, so a raised eye makes no leap under the view', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 16);
			}
		}

		frames(2);

		/* Behind the hero the ground stands higher than the eye would. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-30, 2, -30, 30, 2, -30, 30, 2, 2, -30, 2, 2], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [-30, 3.6, 2, 30, 3.6, 2, 30, 3.6, 30, -30, 3.6, 30], Indices: [0, 2, 1, 0, 3, 2]}], {});

		inner.Objects.hero.Air = 2;

		scene.Control('hero');

		inner.Yaw = 0;
		inner.Wanted = inner.Distance = 5;

		function looking () {
			var a = inner.Camera.Position;
			var b = inner.Camera.Target;
			var far = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

			return [(b[0] - a[0]) / far, (b[1] - a[1]) / far, (b[2] - a[2]) / far];
		}

		var last = null;
		var most = 0;
		var pitch;

		for (pitch = 0.1; pitch > -0.3; pitch -= 0.01) {
			inner.Pitch = pitch;

			frames(8);

			var seen = looking();

			if (last)
				most = Math.max(most, Math.hypot(seen[0] - last[0], seen[1] - last[1], seen[2] - last[2]));

			last = seen;
		}

		expect(most).toBeLessThan(0.05);
	});

	it('tells one effect what it wants of its type, part by part, and brings it in by degrees', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var seen = [];
		var draw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uShape !== undefined && uniforms.uSide)
				seen.push({Shape: uniforms.uShape, Color: uniforms.uColor, Intensity: uniforms.uIntensity});

			if (uniforms && uniforms.uGrow)
				seen.push({Mote: true, Color: uniforms.uColor, Size: uniforms.uGrow[0]});

			return draw.apply(this, arguments);
		};

		function frame (length) {
			inner.Rest = 0;

			engine.Frame(now += length || 100);

			expect(gl.getError()).toBe(gl.NO_ERROR);
		}

		frame();

		scene.Add('effect', {ID: 'told', Type: 'circle', Color: '#0000ff', Appear: 1, Tune: {pool: false, mote: {Color: '#ff0000', Size: [0.5, 0.5]}, spark: [{Count: 4, Life: 1, Speed: [1, 2], Spread: 0.5, Size: [0.1, 0.1], Color: [0, 1, 0]}]}});

		seen.length = 0;

		frame();

		var first = seen.filter(function (one) {
			return one.Shape === 0;
		})[0].Intensity;

		/* Without a pool, with its motes as told, and with sparks of its own. */
		expect(seen.some(function (one) {
			return one.Shape === 2;
		})).toBe(false);

		var motes = seen.filter(function (one) {
			return one.Mote;
		});

		expect(motes[0].Color).toEqual([1, 0, 0]);
		expect(motes.length).toBe(2);

		seen.length = 0;

		inner.Seconds += 2;

		frame();

		expect(seen.filter(function (one) {
			return one.Shape === 0;
		})[0].Intensity).toBeGreaterThan(first * 1.5);

		/* A wave runs out of what happens once. */
		seen.length = 0;

		scene.Burst('teleport', [0, 1, 0]);

		frame(30);

		expect(seen.some(function (one) {
			return one.Shape === 3;
		})).toBe(true);

		engine.Renderer.Draw = draw;
	});

	it('leaves a hero where it stands when the scene changes round it', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(1);

		/* Two floors, one over the other: the hero walks on the upper one. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-30, 0, -30, 30, 0, -30, 30, 0, 30, -30, 0, 30], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [-30, 6, -30, 30, 6, -30, 30, 6, 30, -30, 6, 30], Indices: [0, 2, 1, 0, 3, 2]}], {});
		inner.Objects.hero.Air = 6;
		inner.Hero = 'hero';
		inner.Ground.Keys = {KeyW: true};

		frames(20);

		inner.Ground.Keys = {};

		frames(2);

		var hero = inner.Objects.hero;
		var facing = hero.Facing;

		expect(hero.Air).toBeCloseTo(6, 3);

		hero.Air = 9;
		hero.Grounded = false;

		scene.Add('effect', {ID: 'fire', Type: 'torch', X: 3, Y: 0, Z: 7});

		frames(3);

		expect(inner.Objects.hero).not.toBe(hero);
		expect(inner.Objects.hero.Air).toBeGreaterThan(8);
		expect(inner.Objects.hero.Facing).toBe(facing);
		expect(inner.Objects.hero.Clip).toBe(hero.Clip);
	});

	it('takes a short drop for no jump, though the body leaves the ground', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(1);

		inner.Ground.Field = terrain.FromModel([{Positions: [-40, 3, -9, 2, 3, -9, 2, 3, 9, -40, 3, 9], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [2, 2.8, -9, 20, 2.8, -9, 20, 2.8, 9, 2, 2.8, 9], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [20, 0, -9, 60, 0, -9, 60, 0, 9, 20, 0, 9], Indices: [0, 2, 1, 0, 3, 2]}], {});

		var hero = inner.Objects.hero;
		var left = false;
		var paces = {};

		hero.Size = 0.5;
		hero.Air = 3;
		inner.Hero = 'hero';
		inner.Yaw = -Math.PI / 2;
		inner.Ground.Keys = {KeyW: true};

		while (Number(hero.Values.X) < 6) {
			frames(1);

			paces[hero.Pace] = true;
			left = left || hero.Grounded === false;
		}

		expect(left).toBe(true);
		expect(paces.jump).toBe(undefined);
	});

	it('tells an effect what it looks like: colors, volume, intensity, length and smoke', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="medium" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="23" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;

		function frame () {
			engine.Frame(now += 100);

			expect(gl.getError()).toBe(gl.NO_ERROR);
		}

		frame();

		scene.Add('effect', {ID: 'fire', Type: 'campfire', Color: '#3080ff', Hot: '#ffffff', Volume: 2, Intensity: 2, Length: 2, Smoke: 0});

		frame();

		var settings = inner.Objects.fire.Traits.Effect;
		var lamp = inner.Lamps.filter(function (each) {
			return each.Effect;
		})[0];

		expect(settings.Volume).toBe(2);
		expect(settings.Intensity).toBe(2);
		expect(settings.Smoke).toBe(0);

		/* Its light takes its color and its strength. */
		expect(lamp.Color[2]).toBeGreaterThan(lamp.Color[0]);
		expect(lamp.Settings.Power).toBeCloseTo(0.24, 5);

		scene.Change('fire', {Intensity: 0.5});

		frame();

		expect(inner.Lamps.filter(function (each) {
			return each.Effect;
		})[0].Settings.Power).toBeCloseTo(0.06, 5);

		/* A stream and a fire have a body: a box the eye goes through, round from every side. */
		var boxes = [];
		var plainDraw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms, options) {
			if (uniforms && uniforms.uSpan)
				boxes.push({Span: uniforms.uSpan, Shape: uniforms.uShape, Cull: options.Cull, Color: uniforms.uColor, Depth: options.Depth});

			return plainDraw.apply(this, arguments);
		};

		scene.Add('effect', {ID: 'jet', Type: 'exhaust', Aim: [1, 0, 0], Length: 3, Volume: 0.5, Color: '#ff4040'});

		frame();

		engine.Renderer.Draw = plainDraw;

		var stream = boxes.filter(function (box) {
			return box.Shape === 1;
		})[0];

		expect(stream.Span[0]).toBeCloseTo(0.42 * Math.sqrt(0.5), 5);
		expect(stream.Span[2]).toBeCloseTo(16.5, 5);
		expect(stream.Color[0]).toBeCloseTo(1, 5);
		expect(boxes.some(function (box) {
			return box.Shape === 0;
		})).toBe(true);
		expect(inner.EffectTypes.campfire.Layers[0].Kind).toBe('fire');
		expect(inner.EffectTypes.explosion.Layers[0].Kind).toBe('ball');
		expect(inner.EffectTypes.exhaust.Layers[0].Kind).toBe('stream');
	});

	it('takes no seam of a map for a jump, and still falls and jumps', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 30);
			}
		}

		frames(1);

		/* A floor with a step down of a tenth of a body, and a cliff far on. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-40, 3, -9, 2, 3, -9, 2, 3, 9, -40, 3, 9], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [2, 2.85, -9, 20, 2.85, -9, 20, 2.85, 9, 2, 2.85, 9], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [20, 0, -9, 60, 0, -9, 60, 0, 9, 20, 0, 9], Indices: [0, 2, 1, 0, 3, 2]}], {});

		var hero = inner.Objects.hero;
		var size = hero.Size;

		hero.Air = 3;
		inner.Hero = 'hero';
		inner.Yaw = -Math.PI / 2;
		inner.Ground.Keys = {KeyW: true};

		var paces = {};

		var left = false;

		while (Number(hero.Values.X) < 15) {
			frames(1);

			paces[hero.Pace] = true;
			left = left || hero.Grounded === false;
		}

		expect(left).toBe(false);
		expect(paces.jump).toBe(undefined);
		expect(hero.Air).toBeCloseTo(2.85, 1);
		expect(size).toBeGreaterThan(0.45);

		/* Off the cliff it falls, and that is the clip of a jump. */
		while (Number(hero.Values.X) < 26) {
			frames(1);

			paces[hero.Pace] = true;
		}

		expect(paces.jump).toBe(true);
	});

	it('lights the air of a planet from the side of its star, and draws pillars and galaxies of a seed', async function () {
		var mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;

		expect(gameSceneSource).toContain('day += smoothstep(-0.06, 0.45, dot(limb, normalize(uLightPositions[i] - vWorld)));');

		var baked = {};
		var draw = engine.Renderer.Draw;

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uColumns)
				baked = uniforms;

			return draw.apply(this, arguments);
		};

		function sky (kind, seed) {
			scene.Cosmos = {Kind: kind, Seed: seed};

			for (var i = 0; i < 110; i++) {
				inner.Rest = 0;

				engine.Frame(now += 100);
			}

			expect(engine.CosmosReady()).toBe(true);
			expect(gl.getError()).toBe(gl.NO_ERROR);

			return baked;
		}

		['nebula', 'pillars', 'galaxy', 'galaxies', 'cluster', 'void'].forEach(function (kind) {
			sky(kind, 'test');
		});

		/* What lights a nebula is stars, not one more sun: the texels round its light are no disc of white. */
		var made = sky('nebula', 'sun');
		var glow = Elemenx.Service('Renderer');

		expect(made.uBeacon).toBeGreaterThan(0);
		expect(cosmosSource).not.toContain('pow(near, 180.0)');
		expect(cosmosSource).not.toContain('pow(near, 900.0) * 3.0');
		expect(Elemenx.Service('Math').Vectors.Length(made.uShine)).toBeCloseTo(1, 5);

		/* Pillars are of their seed: how many, how thick, how high, how bent, and where the light stands. */
		var widths = {};
		var lamps = {};

		['a', 'b', 'c', 'd', 'e', 'f'].forEach(function (seed) {
			var one = sky('pillars', seed);
			var i;

			lamps[one.uLamps.join()] = true;

			for (i = 0; i < 12; i++) {
				expect(one.uColumns[i * 4 + 2]).toBeGreaterThan(0);
			}

			widths[one.uShapes.map(function (value, at) {
				return at % 4 === 2 && value === -1.75 ? 1 : 0;
			}).reduce(function (all, each) {
				return all + each;
			}, 0)] = true;
		});

		expect(Object.keys(widths).length).toBeGreaterThan(1);
		expect(Object.keys(lamps).length).toBe(6);

		/* One generator: a kind is only amounts, and what is told comes on top of it. */
		var kinds = scene.CosmosKinds();

		expect(Object.keys(kinds).sort()).toEqual(['cluster', 'galaxies', 'galaxy', 'nebula', 'pillars', 'void']);
		expect(kinds.pillars.Pillars).toBe(1);
		expect(kinds.galaxy.Band).toBe(1);

		function mixed (told) {
			scene.Cosmos = Object.assign({Kind: 'nebula', Seed: 'mix'}, told);

			for (var i = 0; i < 110; i++) {
				inner.Rest = 0;

				engine.Frame(now += 100);
			}

			expect(engine.CosmosReady()).toBe(true);
			expect(gl.getError()).toBe(gl.NO_ERROR);

			return baked;
		}

		var all = mixed({Pillars: 0.7, Band: 0.5, Galaxies: 9, Clusters: 3, Beacon: 0.4});

		expect(all.uPillars).toBe(0.7);
		expect(all.uDisc).toBe(0.5);
		expect(all.uBeacon).toBe(0.4);
		expect(all.uGlobular).toBe(1);

		function counted (list, test) {
			return list.filter(function (value, at) {
				return at % 4 === 3 && test(value);
			}).length;
		}

		expect(counted(all.uGalaxies, function (value) {
			return value > 0;
		})).toBe(9);

		/* The knots of its gas stay, and the clusters come by them. */
		expect(counted(all.uKnots, function (value) {
			return value < 0;
		})).toBe(3);

		expect(counted(all.uKnots, function (value) {
			return value > 0;
		})).toBe(3);

		/* Any change makes it again. */
		var none = mixed({Pillars: 0.7, Band: 0.5, Galaxies: 0, Clusters: 3, Beacon: 0.4});

		expect(counted(none.uGalaxies, function (value) {
			return value > 0;
		})).toBe(0);

		/* Pillars stand round the ring of the sky: it meets itself, and the stars of a group go into those of the next with no line. */
		expect(cosmosSource).toContain('atan(dot(d, cross(at, tall)), dot(d, at))');
		expect(cosmosSource).toContain('mod(uLamps[i].x - q.x + 4.18879, 8.37758) - 4.18879');

		/* Rays go out of as many places as are told, and more of them leaves those that were. */
		expect(counted(all.uBursts, function (value) {
			return value > 0;
		})).toBe(1);

		var rays = mixed({Pillars: 0.7, Band: 0.5, Galaxies: 9, Clusters: 3, Beacon: 0.4, Bursts: 5}).uBursts;

		expect(counted(rays, function (value) {
			return value > 0;
		})).toBe(5);

		expect(rays.slice(0, 4)).toEqual(mixed({Pillars: 0.7, Band: 0.5, Galaxies: 9, Clusters: 3, Beacon: 0.4, Bursts: 2}).uBursts.slice(0, 4));
		expect(cosmosSource).toContain('if (uBursts[i].w > 0.0) color += burst(');
		expect(kinds.nebula.Bursts).toBe(1);
		expect(kinds.pillars.Bursts).toBe(0);

		/* The dust of a tip is held down however strong the light is: what shines is the gas round it. */
		expect(cosmosSource).toContain('min(light, 0.62)');
		expect(cosmosSource).toContain('(1.0 - uDrawn) * wisp * reach');

		/* Pillars are clouds of dust, and can be asked to stay drawn shapes: another sky. */
		expect(all.uDrawn).toBe(0);
		expect(mixed({Pillars: 0.7, Style: 'drawn'}).uDrawn).toBe(1);

		/* A sky already made is not made again. */
		mixed({});

		baked = null;
		inner.Rest = 0;

		engine.Frame(now += 100);

		expect(baked).toBe(null);

		/* A cube too large for a frame is made by strips: one strip leaves the rest of its face as it was. */
		var renderer = engine.Renderer;
		var solid = renderer.Program(glow.Shaders.Quad, '#version 300 es\nprecision highp float;\nin vec2 vQuad;\nout vec4 outColor;\nvoid main() { outColor = vec4(1.0); }');
		var strips = renderer.Cube(8);
		var reader = gl.createFramebuffer();
		var pixel = new Uint8Array(4);

		renderer.Bake(strips, solid, {}, 0, [1, 2]);

		expect(gl.isEnabled(gl.SCISSOR_TEST)).toBe(false);

		gl.bindFramebuffer(gl.FRAMEBUFFER, reader);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, strips.Handle, 0);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(pixel[0]).toBe(0);

		gl.readPixels(0, 7, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(pixel[0]).toBe(255);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(reader);

		strips.Destroy();

		/* A sky goes on showing until the new one is whole: its picture is there all the while. */
		var cubes = [];

		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uCube)
				cubes.push(uniforms.uCube);

			return draw.apply(this, arguments);
		};

		scene.Cosmos = {Kind: 'void', Seed: 'next'};
		inner.Rest = 0;

		engine.Frame(now += 100);

		expect(engine.CosmosReady()).toBe(false);
		expect(cubes.length).toBeGreaterThan(0);

		engine.Renderer.Draw = draw;

		/* A sky goes on being made while the frames go into their picture. */
		expect(gameSceneSource).toContain('engine.CosmosBake();');
	});

	it('turns the stars with the planet round a pole as high as its latitude', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="22" Latitude="60" DayOfYear="100" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();

		function turnAt (hour) {
			scene.Change('day', {Time: hour});

			engine.Frame(performance.now() + 100);

			return inner.Ground.StarTurn;
		}

		function star (turn, way) {
			return [0, 1, 2].map(function (row) {
				return turn[row] * way[0] + turn[row + 3] * way[1] + turn[row + 6] * way[2];
			});
		}

		var first = turnAt(22);
		var pole = star(first, [0, 1, 0]);

		/* The pole stands still, as high as the latitude, over the north. */
		expect(Math.asin(pole[1]) * 180 / Math.PI).toBeCloseTo(60, 3);
		expect(pole[2]).toBeLessThan(0);
		expect(star(turnAt(3), [0, 1, 0])[1]).toBeCloseTo(pole[1], 5);

		/* A turn of its own: lengths stay. */
		var far = star(first, [0.6, 0, 0.8]);

		expect(Math.hypot(far[0], far[1], far[2])).toBeCloseTo(1, 5);

		/* A star of the equator in the east goes up, as the sun does there. */
		var ways = [0, 1, 2, 3, 4, 5, 6, 7].map(function (step) {
			return [Math.cos(step * Math.PI / 4), 0, Math.sin(step * Math.PI / 4)];
		});
		var early = turnAt(22);
		var late = turnAt(22.5);
		var east = ways.map(function (way) {
			return {Now: star(early, way), Then: star(late, way)};
		}).filter(function (each) {
			return each.Now[0] > 0.5;
		});

		expect(east.length).toBeGreaterThan(0);

		east.forEach(function (each) {
			expect(each.Then[1]).toBeGreaterThan(each.Now[1]);
		});
	});

	it('lights the air of a night by what is there: a high moon is no sun, and towns hide the faint stars', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="0" Latitude="45" DayOfYear="1" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();

		function sky (changes) {
			scene.Change('day', changes);

			engine.Frame(performance.now() + 100);

			return inner.Ground;
		}

		var full = sky({MoonPhase: 0.5});

		/* In winter the full moon stands high: its air is still that of a night. */
		expect(full.Moon.Way[1]).toBeGreaterThan(0.6);
		expect(full.AirLight).toBeLessThan(0.1);
		expect(full.MoonLit).toBeGreaterThan(0.9);

		var limit = full.StarLimit;
		var dark = sky({MoonPhase: 0});

		expect(dark.MoonLit).toBeLessThan(0.05);
		expect(dark.AirLight).toBeLessThan(0.01);
		expect(dark.StarLimit).toBeLessThan(limit);
		expect(dark.Glow).toEqual([0, 0, 0]);

		var faint = dark.StarLimit;

		var towns = sky({SkyGlow: 0.5}).StarLimit;

		expect(towns).toBeGreaterThan(faint + 0.2);
		expect(inner.Ground.Glow[0]).toBeGreaterThan(inner.Ground.Glow[2]);
		expect(inner.Ground.GlowWay).toEqual([0, 0, 0]);
		expect(sky({SkyGlowAzimuth: 90}).GlowWay[2]).toBe(1);

		/* By day none are seen, and the air is lit by the sun. */
		expect(sky({Time: 12, SkyGlow: 0}).StarLimit).toBeGreaterThan(1);
		expect(inner.Ground.AirLight).toBeGreaterThan(0.9);

		/* Clouds and the air of the picture take these numbers, not the height of whatever lights the land. */
		expect(gameSceneSource).toContain('var tone = (0.5 + 0.7 * day) * Math.min(1, day * 1.6 + ground.MoonLit * 0.6);');
		expect(lightingSource).toContain('* uAirLight + pow(uAirGlow, vec3(2.2)) * 0.3;');
		expect(lightingSource).not.toContain('clamp(uSun.y * 2.5');
	});

	it('darkens a day when the moon comes before the sun, and reddens a moon in the shadow of its planet', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="45" DayOfYear="80" MoonPhase="0.25" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();

		function sky (changes) {
			scene.Change('day', changes);

			engine.Frame(performance.now() + 100);

			return inner.Ground;
		}

		var plain = sky({});
		var light = plain.SunColor[0];
		var limit = plain.StarLimit;

		expect(plain.Eclipse).toBe(0);

		var dark = sky({MoonPhase: 0});

		expect(dark.Eclipse).toBe(1);
		expect(dark.SunColor[0]).toBeLessThan(light * 0.02);
		expect(dark.StarLimit).toBeLessThan(limit);
		expect(dark.Glare).toBe(0);

		/* Even under thin clouds no bit of the disc shows through the moon. */
		expect(Elemenx.Service('Blueprints').Compile(scene.LibrarySky()).Function).toMatch(/\* s\d+_disk \* \(1\.0 - smoothstep\(0\.0, 0\.25, [^)]+\)\)/);

		/* On other days a new moon passes over or under the sun: its way is tilted. */
		expect(sky({DayOfYear: 140}).Eclipse).toBe(0);
		expect(inner.Ground.SunColor[0]).toBeGreaterThan(light * 0.5);

		/* The moon against the sun, at midnight: a full moon on a node is in the shadow, on another day it is not. */
		var red = sky({DayOfYear: 80, MoonPhase: 0.5, Time: 0});

		expect(red.Moon.Shade).toBe(1);
		expect(red.Moon.Glow).toBeLessThan(0.1);
		expect(sky({DayOfYear: 140}).Moon.Shade).toBe(0);
		expect(inner.Ground.Moon.Glow).toBeGreaterThan(0.9);

		/* No moon, no eclipse. */
		expect(sky({DayOfYear: 80, Time: 12, MoonPhase: 0, Moon: false}).Eclipse).toBe(0);

		/* A full moon goes high in winter, low in summer: across the sky from the sun. */
		var winter = sky({Moon: true, MoonPhase: 0.5, Time: 0, DayOfYear: 355, MoonTilt: 0}).Moon.Way[1];

		expect(sky({DayOfYear: 172}).Moon.Way[1]).toBeLessThan(winter - 0.3);
	});

	it('lets a hero stand while the view goes round it with a free look, and brings it round when it sets off', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" FreeLook="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				now += 30;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		frames(1);

		inner.Ground.Field = terrain.FromModel([{Positions: [-10, 0, -10, 10, 0, -10, 10, 0, 10, -10, 0, 10], Indices: [0, 2, 1, 0, 3, 2]}], {});

		var hero = inner.Objects.hero;

		hero.Air = 0;
		inner.Hero = 'hero';
		inner.Yaw = 0;

		frames(10);

		var facing = hero.Facing;

		inner.Yaw = 2.6;

		frames(120);

		expect(hero.Facing).toBe(facing);
		expect(hero.Pose).toBe('');
		expect(hero.Spin).toBe(0);

		inner.Ground.Keys = {KeyW: true};

		frames(30);

		expect(Math.cos(hero.Facing - (inner.Yaw + Math.PI))).toBeGreaterThan(0.98);

		/* Off, it turns on the spot as it did. */
		inner.Ground.Keys = {};
		scene.FreeLook = false;
		inner.Yaw += 1.6;

		frames(120);

		expect(Math.cos(hero.Facing - (inner.Yaw + Math.PI))).toBeGreaterThan(0.98);
	});

	it('keeps the time of a clip when its rate changes, and fades from where the last one was', async function () {
		var mounted = await mount('<Scene (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				now += 30;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		frames(1);

		var hero = inner.Objects.hero;

		hero.Seed = 0.3;
		hero.Walking = 2;

		frames(40);

		expect(hero.Clip.Name).toBe('walk');

		var before = hero.Clip.At;
		var rate = hero.Clip.Rate;

		/* Twice as fast: the clip goes on from where it was, it does not jump. */
		hero.Walking = 4;

		frames(1);

		expect(hero.Clip.Rate).toBeCloseTo(rate * 2, 5);
		expect(hero.Clip.At - before).toBeLessThan(rate * 2 * 0.2);
		expect(hero.Clip.At).toBeGreaterThan(before);

		/* The fade starts at the second the last clip was at, with its place of a copy. */
		var moment = hero.Clip.At + hero.Clip.Phase;
		var last = hero.Clip.Rate;

		expect(hero.Clip.Phase).toBeGreaterThan(0);

		hero.Walking = 0;

		frames(1);

		expect(hero.Clip.Name).toBe('idle');
		expect(hero.Clip.FromTime).toBeCloseTo(moment, 5);
		expect(hero.Clip.FromRate).toBe(last);
	});

	it('walks the sun by the azimuth of its noon, and tints the light of the sky', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		function frame () {
			inner.Rest = 0;

			scene.Engine().Frame(performance.now() + 100);
		}

		frame();

		expect(inner.Ground.Sky[0]).toBeCloseTo(0, 3);
		expect(inner.Ground.Sky[2]).toBeGreaterThan(0);

		var white = inner.Ground.SkyLight.slice();

		scene.Change('day', {Noon: 270, Shade: '#ff8040'});

		frame();

		expect(inner.Ground.Sky[0]).toBeLessThan(-0.3);
		expect(inner.Ground.Sky[2]).toBeCloseTo(0, 3);
		expect(inner.Ground.SkyLight[0] / inner.Ground.SkyLight[2]).toBeGreaterThan(white[0] / white[2] * 2);
	});

	it('turns a sun with its planet: the light of a day follows latitude, tilt, season and the length of the day', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="50" DayOfYear="172" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		function rise (changes) {
			scene.Change('day', changes);

			inner.Rest = 0;

			scene.Engine().Frame(performance.now() + 100);

			return inner.Ground.Sky[1];
		}

		/* Noon of a summer at 50 degrees: 90 - 50 + 23.44 over the horizon, in the south. */
		expect(Math.asin(rise({Time: 12})) * 180 / Math.PI).toBeCloseTo(63.44, 1);
		expect(inner.Ground.Sky[2]).toBeGreaterThan(0.4);

		/* Past 18 the summer sun is still up, and the winter one has long gone. */
		expect(rise({Time: 19})).toBeGreaterThan(0.1);
		expect(rise({Time: 19, DayOfYear: 355})).toBeLessThan(-0.1);

		/* The polar day: the sun does not set at midnight; with no tilt it does. */
		expect(rise({Time: 0, Latitude: 80, DayOfYear: 172})).toBeGreaterThan(0.1);
		expect(rise({Time: 0, Latitude: 80, Tilt: 0})).toBeLessThan(0);

		/* A day of 10 hours has its noon at 5. */
		expect(rise({Time: 5, Latitude: 0, Tilt: 0, DayHours: 10})).toBeCloseTo(1, 3);
		expect(rise({Time: 0})).toBeCloseTo(-1, 3);
	});

	it('darkens what a low sun does not reach, and keeps the twilight after it sets', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="12" Latitude="60" DayOfYear="121" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		function air (time) {
			scene.Change('day', {Time: time});

			inner.Rest = 0;

			scene.Engine().Frame(performance.now() + 100);

			return inner.Ground.SkyLight[0];
		}

		var noon = air(12);
		var low = air(19);
		var twilight = air(20.5);
		var night = air(0);

		expect(low).toBeLessThan(noon * 0.65);
		expect(twilight).toBeGreaterThan(night * 1.5);
	});

	it('lights a night by its moon, faintly: its phase, its place, or none at all', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><SceneObject ID="day" Kind="sun" Time="0" Latitude="45" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		function night (changes) {
			scene.Change('day', changes);

			inner.Rest = 0;

			scene.Engine().Frame(performance.now() + 100);

			return Math.max.apply(null, inner.Ground.SunColor);
		}

		var full = night({});

		expect(inner.Ground.Moon.Way[1]).toBeGreaterThan(0.1);
		expect(full).toBeGreaterThan(0);

		/* Far under a sun: it was bright enough to read as day. */
		expect(full).toBeLessThan(0.2);
		expect(inner.Ground.Glare).toBe(0);

		expect(night({MoonLight: 2})).toBeCloseTo(full * 2, 3);

		/* A new moon has its dark side to us: it gives nothing and is by the sun. */
		expect(night({MoonLight: 1, MoonPhase: 0})).toBe(0);
		expect(inner.Ground.Moon.Glow).toBe(0);

		var half = night({MoonPhase: 0.25, MoonElevation: 40, MoonAzimuth: 90});

		expect(half).toBeGreaterThan(0);
		expect(half).toBeLessThan(full);
		expect(inner.Ground.Moon.Way[0]).toBeGreaterThan(0.7);

		var air = inner.Ground.SkyLight[2];

		night({NightLight: 3});

		expect(inner.Ground.SkyLight[2]).toBeGreaterThan(air * 2);

		/* A planet with no moon: a sky to itself. */
		expect(night({Moon: false})).toBe(0);
		expect(inner.Ground.Moon).toBeNull();
	});

	it('brings the eye of a hero down to the ground at its distance, the hero in the frame', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 0, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				now += 30;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		frames(1);

		/* A low step of the ground stands between the hero and the eye. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-30, 0, -30, 30, 0, -30, 30, 0, 30, -30, 0, 30], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [-30, 0, 2, 30, 0, 2, 30, 0.4, 2, -30, 0.4, 2], Indices: [0, 1, 2, 0, 2, 3]}]);
		inner.Objects.hero.Air = 0;
		inner.Yaw = 0;
		inner.Hero = 'hero';
		inner.Focus = 'hero';
		inner.Objects.hero.Size = 2.9;
		inner.Wanted = inner.Distance = 4;
		inner.Pitch = 0;

		frames(30);

		inner.Pitch = -1.2;

		frames(10);

		var eye = inner.Camera.Position;
		var hero = inner.Objects.hero.World;
		var look = [inner.Camera.Target[0] - eye[0], inner.Camera.Target[1] - eye[1], inner.Camera.Target[2] - eye[2]];
		var tilt = Math.atan2(look[1], Math.sqrt(look[0] * look[0] + look[2] * look[2]));
		var away = Math.sqrt(Math.pow(eye[0] - hero[0], 2) + Math.pow(eye[2] - hero[2], 2));

		/* At the ground, and not pulled in to the hero: the ground under a low eye is no wall. */
		expect(eye[1] - hero[1]).toBeLessThan(0.3);
		expect(inner.Clear).toBeCloseTo(4, 1);
		expect(away).toBeGreaterThan(2);

		/* The knees stay over the lower edge of the frame. */
		expect(Math.atan2(hero[1] + 0.725 - eye[1], away)).toBeGreaterThan(tilt - inner.Camera.Fov * Math.PI / 360);
		expect(tilt).toBeGreaterThan(0.2);

		/* The pull of the mouse past that is not kept: it takes effect at once on the way back. */
		expect(inner.Pitch).toBeGreaterThan(-1.2);
	});

	it('moves by the time of the frame on the screen, and draws each frame of a hero: uneven turns shake the view', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var loop = inner.Loop;

		var engine = scene.Engine();
		var now = performance.now() + 100;
		var settled = 0;

		loop.Stop();

		/*
		 * Nothing is drawn before the programs are done behind the page, and a frame may ask for one more (what the ground brings):
		 * frames go on until a few in a row need none. Regression: under load a program asked for later sent a frame of the loop
		 * the way of one that waits, and the rest was not set anew.
		 */
		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			settled = engine.Renderer.Progress().Needed === 0 && Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 ? settled + 1 : 0;

			return settled >= 5;
		}, 30000);

		inner.Seen = true;
		loop.Now = 123456;

		loop.Advance(16);

		expect(inner.Last).toBe(123456);

		/* A slow frame rests the next one, unless a person steers: only a frame that was drawn sets the rest anew. */
		var far = performance.now() + 100000;

		inner.Rest = far;

		loop.Advance(16);

		expect(inner.Rest).toBe(far);

		inner.Hero = 'nobody';

		loop.Advance(16);

		expect(inner.Rest).not.toBe(far);
	});

	it('compiles no pillars for a sky without them, and bakes only what is done', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="star" Kind="star" Mass="1" /></Scene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();
		var made = [];
		var program = engine.Renderer.Program;
		var bake = engine.Renderer.Bake;
		var baked = 0;
		var ready = engine.Renderer.Ready;
		var now = performance.now() + 100;

		inner.Loop.Stop();

		engine.Renderer.Program = function (vertex, fragment, behind) {
			if (behind)
				made.push(fragment.indexOf('vec4 standing(vec3 d, vec3 s) {\n\treturn vec4(0.0);') === -1 ? 'pillars' : 'plain');

			return program.apply(this, arguments);
		};
		engine.Renderer.Bake = function () {
			baked++;

			return bake.apply(this, arguments);
		};
		engine.Renderer.Ready = function () {
			return false;
		};

		function frame () {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}

		mounted.Space.Cosmos = 'galaxy';

		await tick(30);

		inner.Looping = true;

		frame();
		frame();

		expect(baked).toBe(0);
		expect(made).toEqual(['plain']);

		inner.Looping = false;

		frame();

		expect(baked).toBeGreaterThan(0);

		mounted.Space.Cosmos = 'pillars';

		await tick(30);

		frame();

		expect(made).toEqual(['plain', 'pillars']);

		engine.Renderer.Program = program;
		engine.Renderer.Bake = bake;
		engine.Renderer.Ready = ready;
	});

	it('tells how far a scene has come, and draws nothing until its programs are done', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="0" /><div slot="loading" class="mine">wait</div></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var loop = inner.Loop;
		var told = [];
		var drawn = 0;
		var draw = engine.Renderer.Draw;

		expect(engine.Renderer.Progress).toBeTypeOf('function');

		loop.Stop();

		var emit = scene.$Emit;

		scene.$Emit = function (name, detail) {
			if (name === 'loading')
				told.push(detail.Part);

			return emit.apply(this, arguments);
		};

		engine.Renderer.Draw = function () {
			drawn++;

			return draw.apply(this, arguments);
		};

		var progress = engine.Renderer.Progress;

		inner.Seen = true;
		inner.Warmed = true;
		/* Its programs alone: what the view is made ready of beside them is told by its own stages (library-scene-landing). */
		inner.Preparing = false;
		inner.LoadingLeast = 0;
		engine.Renderer.Progress = function () {
			return {Done: 3, Total: 4, Needed: 1};
		};
		scene.Loading = null;
		inner.Rest = 0;

		loop.Advance(16);

		expect(drawn).toBe(0);
		expect(scene.Loading).toBe(75);

		await tick(20);

		var holder = scene.$Element().querySelector('.elemenx-scene-loading');

		/* The slot was filled: that takes the place of the bar. */
		expect(holder.hidden).toBe(false);
		expect(holder.querySelector('.mine').textContent).toBe('wait');
		expect(holder.getBoundingClientRect().height).toBeGreaterThan(0);
		expect(holder.querySelector('progress, [role="progressbar"]')).toBe(null);

		/* What is behind the page holds no picture: the bar stays and the frames go. */
		engine.Renderer.Progress = function () {
			return {Done: 3, Total: 4, Needed: 0};
		};

		inner.Rest = 0;

		loop.Advance(16);

		expect(drawn).toBeGreaterThan(0);
		expect(scene.Loading).toBe(75);

		engine.Renderer.Progress = progress;

		await waitFor(function () {
			return progress().Needed === 0;
		}, 30000);

		engine.Renderer.Progress = function () {
			return {Done: 4, Total: 4, Needed: 0};
		};

		loop.Advance(16);

		expect(scene.Loading).toBe(null);
		expect(told).toEqual([75, 100]);

		await tick(20);

		expect(holder.hidden).toBe(true);

		engine.Renderer.Progress = progress;
		engine.Renderer.Draw = draw;
	});

	it('shows a bar of its own while it loads, that moves when only what is behind the page is left', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="0" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var progress = engine.Renderer.Progress;

		inner.Loop.Stop();

		inner.Warmed = true;
		inner.Seen = true;
		inner.Preparing = false;
		inner.LoadingLeast = 0;
		engine.Renderer.Progress = function () {
			return {Done: 1, Total: 2, Needed: 1};
		};

		inner.Loop.Advance(16);

		await tick(20);

		var holder = scene.$Element().querySelector('.elemenx-scene-loading');
		var bar = holder.querySelector('[role="progressbar"]');

		expect(holder.hidden).toBe(false);
		expect(bar).toBeTruthy();
		expect(bar.getBoundingClientRect().height).toBeGreaterThan(0);
		expect(bar.getAttribute('aria-valuenow')).toBe('50');

		engine.Renderer.Progress = function () {
			return {Done: 1, Total: 2, Needed: 0};
		};

		inner.Loop.Advance(16);

		await tick(20);

		expect(scene.LoadingEndless).toBe(true);
		expect(holder.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe(null);

		engine.Renderer.Progress = progress;
	});

	it('leaves the pointer alone while the mouse is captured: the browser refuses to hold both', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var canvas = scene.$Element().querySelector('canvas');
		var calls = 0;

		canvas.setPointerCapture = function () {
			calls++;
		};

		Object.defineProperty(document, 'pointerLockElement', {configurable: true, get: function () {
			return canvas;
		}});

		try {
			scene.PointerDown({target: canvas, pointerId: 1, clientX: 10, clientY: 10, button: 0, preventDefault: function () {}});
		}
		finally {
			delete document.pointerLockElement;
		}

		expect(calls).toBe(0);
	});

	it('keeps the eye of a hero on its side of a wall: in at once, out slowly', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 1, Water: 0, Seed: 'test'})});
		scene.Add('unit', {ID: 'hero', X: 2, Y: 0});

		function frames (count) {
			for (i = 0; i < count; i++) {
				now += 30;
				inner.Rest = 0;

				engine.Frame(now);
			}
		}

		frames(1);

		inner.Ground.Field = terrain.FromModel([{Positions: [-30, 0, -30, 30, 0, -30, 30, 0, 30, -30, 0, 30], Indices: [0, 2, 1, 0, 3, 2]}, {Positions: [4, 0, -30, 4, 9, -30, 4, 9, 30, 4, 0, 30], Indices: [0, 1, 2, 0, 2, 3]}]);
		inner.Objects.hero.Air = 0;
		inner.Hero = 'hero';
		inner.Wanted = inner.Distance = 12;
		inner.Pitch = 0.05;

		/* The eye behind the hero, on the far side of the wall at x = 4. */
		inner.Yaw = Math.PI / 2;

		frames(2);

		var near = inner.Clear;

		expect(near).toBeLessThan(6);
		expect(vectorX(inner)).toBeLessThan(4);

		/* Turned away from it, the eye does not leap back. */
		inner.Yaw = -Math.PI / 2;

		frames(1);

		expect(inner.Clear).toBeLessThan(near + 1.5);

		frames(120);

		expect(inner.Clear).toBeGreaterThan(9);

		/* Under a hero the eye goes down to the very ground, to look up. */
		inner.Wanted = inner.Distance = 3;
		inner.Pitch = -1;
		inner.Yaw = -Math.PI / 2;
		inner.Floor = 0;

		frames(60);

		expect(inner.Camera.Position[1]).toBeLessThan(0.4);
		expect(inner.Camera.Position[1]).toBeGreaterThan(0.1);
	});

	it('mirrors what is glossy at high quality, not cut-outs, and wets what stands in the rain', async function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var mounted = await mount('<Scene Quality="high" Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="1" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="hero" Kind="unit" X="0" Y="0" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var calls = [];

		renderer.Draw = function (mesh, program, uniforms) {
			calls.push(uniforms || {});

			return draw.apply(renderer, arguments);
		};

		function frame () {
			inner.Rest = 0;

			engine.Frame(performance.now() + calls.length + 100);
		}

		scene.Weather = 'rain';
		inner.Ground.Air.Wet = 1;

		frame();

		renderer.Draw = draw;

		var mirror = calls.filter(function (uniforms) {
			return uniforms.uMask;
		});
		var picture = calls.filter(function (uniforms) {
			return uniforms.uMirrorOn !== undefined;
		});
		var wet = calls.filter(function (uniforms) {
			return uniforms.uWet !== undefined && uniforms.uLightPositions !== undefined;
		});

		expect(mirror.length).toBe(1);
		expect(picture[0].uMirrorOn).toBe(1);
		expect(wet.length).toBeGreaterThan(0);
		expect(wet[0].uWet).toBeGreaterThan(0);

		/* The alpha of a cut-out edge is no gloss, and which side faces the eye comes from the view: walls wound backwards are lit. */
		expect(gameSceneSource).toContain("'	float code = base.a < 0.99 ? 0.0 :");
		expect(gameSceneSource).toContain('base.a < 0.5 ? base.a : 1.0 - code * 0.45');
		expect(gameSceneSource).toContain("'	if (dot(n, v) < -0.3) n = -n;',");
		expect(gameSceneSource).not.toContain('gl_FrontFacing');

		/* The dark of a sun in view fades as it leaves the frame, it does not stop at a line. */
		expect(lightingSource).toContain('(1.0 - smoothstep(0.42, 0.95, max(past.x, past.y)))');
		expect(lightingSource).not.toContain('step(abs(uSpot.x - 0.5), 0.75)');

		/* Nothing mirrors by a body: the smoothed edge of one is no gloss. */
		expect(lightingSource).toContain('code < 0.004 || near < 0.5');

		/* A location has floors over floors: no map of the light of a field holds it, and with none it would lose the sky. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-30, 0, -30, 30, 0, -30, 30, 0, 30, -30, 0, 30], Indices: [0, 2, 1, 0, 3, 2]}]);

		expect(inner.Ground.Field.Whole).toBe(true);
		expect(engine.FieldOn()).toBe(false);
	});

	it('starts what is added anew from what it is told, not from where its namesake walked', async function () {
		var mounted = await mount('<Scene Paused="true" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		scene.Add('unit', {ID: 'same', X: 1, Y: 1});
		scene.Engine().Frame(performance.now() + 100);

		inner.Overrides.same = {Values: {X: 30, Y: 30}};

		scene.Remove('same');
		scene.Add('unit', {ID: 'same', X: 5, Y: 6});
		scene.Engine().Frame(performance.now() + 200);

		expect(inner.Objects.same.World[0]).toBeCloseTo(5, 3);
		expect(inner.Objects.same.World[2]).toBeCloseTo(6, 3);
	});

	it('takes thousands of objects at once in a time that grows with their number', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
		'</Scene>');
		var scene = mounted.Space;
		var list = [];
		var started;
		var i;

		for (i = 0; i < 12000; i++)
			list.push({ID: 'tree-' + i, Kind: 'pine', X: i % 150, Y: Math.floor(i / 150)});

		started = performance.now();

		scene.Add(list);

		expect(performance.now() - started).toBeLessThan(8000);
		expect(scene.Scene().Roots.length).toBe(12002);

		scene.Engine().Frame(performance.now() + 100);

		expect(scene.Scene().Still.length).toBe(12000);
	});

	it('keeps what did not change when the scene is made again, and stands what stays still once', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="300" Height="10" Water="0.1" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="oak" Kind="oak" X="10" Y="10" />' +
			'<SceneObject ID="hero" Kind="knight" X="0" Y="0" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var oak;
		var field;
		var asked = 0;

		engine.Frame(performance.now() + 100);

		oak = inner.Objects.oak;
		field = inner.Ground.Field;

		expect(inner.Still).toContain(oak);
		expect(inner.Active).toContain(inner.Objects.hero);

		/* A new object does not make the old ones again. */
		scene.Add('rock', {ID: 'stone', X: 5, Y: 5});

		expect(inner.Objects.oak).toBe(oak);

		scene.Change('oak', {Team: 'red'});

		expect(inner.Objects.oak).not.toBe(oak);

		/* A height of the ground is noise: nothing asks for it while nothing moves. */
		engine.Frame(performance.now() + 200);

		var height = field.Height;

		field.Height = function (x, z) {
			if (x === 10.5 || x === 10)
				asked++;

			return height(x, z);
		};

		engine.Frame(performance.now() + 300);
		engine.Frame(performance.now() + 400);

		field.Height = height;

		expect(asked).toBe(0);
	});

	it('builds a land of ready models: tiles a cell each, and grass of a model only round the eye', async function () {
		var mounted = await mount('<Scene Quality="medium" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="96" Height="2" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="tiles" Kind="rocks" Shapes="rock" Grid="12" MinHeight="-10" MaxSlope="1" />' +
			'<SceneObject ID="blades" Kind="grass" Shapes="bush" Reach="20" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 8000);

		/* Tiles a cell each, as far as the ground takes them. */
		expect(scene.Sown().Things).toBeGreaterThan(30);

		inner.Wanted = inner.Distance = 60;
		inner.Ground.Target = [0, 0, 0];

		engine.Frame(performance.now() + 200);
		engine.Frame(performance.now() + 400);

		var far = scene.Sown().Copies;

		inner.Wanted = inner.Distance = 200;

		engine.Frame(performance.now() + 600);
		engine.Frame(performance.now() + 800);

		expect(scene.Sown().Copies).toBeLessThan(far);
	});

	it('sows a ground in masses by its rules, the same for the same seed, with no object for each thing, and grows grass', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="192" Height="20" Water="0.2" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="woods" Kind="forest" Density="3" Seed="a" Cover="1" MaxHeight="7" />' +
			'<SceneObject ID="blades" Kind="grass" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var field;
		var first;

		inner.Wanted = 60;
		inner.Distance = 60;

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 8000);

		first = scene.Sown();
		field = inner.Ground.Field;

		expect(first.Things).toBeGreaterThan(200);
		expect(scene.Objects().length).toBe(4);

		/* What it may not grow on stays empty: the sea and what is too high. */
		expect(first.Things).toBeLessThan(3 * 192 * 192 / 100 * 0.95);

		await waitFor(function () {
			engine.Frame(performance.now() + 200);

			return scene.Sown().Draws > 0 && scene.Sown().Blades > 1000;
		}, 6000);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		/* A tree is on the way of a walker only where one is: some cell of the map says so. */
		var cells = 0;
		var x;
		var z;

		for (z = -96; z < 96; z += 2) {
			for (x = -96; x < 96; x += 2) {
				if (engine.ScatterBlocked(x, z))
					cells++;
			}
		}

		expect(cells).toBeGreaterThan(50);
		expect(field.Size).toBe(192);

		/* The same rules, the same things. */
		scene.Change('woods', {Density: 3.0001});

		await waitFor(function () {
			engine.Frame(performance.now() + 300);

			return scene.Sown().Waiting === 0 && scene.Sown().Squares > 0;
		}, 8000);

		expect(Math.abs(scene.Sown().Things - first.Things)).toBeLessThan(first.Things * 0.02);
	});

	it('beads water on what is smooth and wet, its own Wet over the weather, as many drops as it says; none on what is rough', async function () {
		var models = Elemenx.Service('SceneModels');
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var made = meshes.Box({Width: 3, Height: 0.05, Depth: 3});
		var plate = {Positions: new Float32Array(made.Positions), Normals: new Float32Array(made.Normals), UVs: new Float32Array(made.UVs), Colors: null, Joints: null, Weights: null, Indices: Array.from(made.Indices)};
		var names = {smooth: unique('lacquer'), rough: unique('felt')};

		function material (roughness, coat) {
			return {Name: 'skin', BaseColor: [0.05, 0.05, 0.06, 1], Metallic: 0, Roughness: roughness, Emissive: [0, 0, 0], Clearcoat: coat, CoatRoughness: 0.05, Transmission: 0, ColorMap: null, MetalMap: null, NormalMap: null, OcclusionMap: null, EmissiveMap: null, Alpha: 'OPAQUE', Cutoff: 0.5, DoubleSided: false, Unlit: false, Specular: 1, SpecularColor: [1, 1, 1], SpecularMap: null};
		}

		[['smooth', 0.25, 1], ['rough', 0.9, 0]].forEach(function (one) {
			models.Define(names[one[0]], {URL: names[one[0]], Fit: false, Asset: {Nodes: [{Name: 'plate', Parent: -1, Children: [], Translation: [0, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: 0, Skin: -1}], Meshes: [[{Geometry: plate, Material: 0}]], Lights: [], Materials: [material(one[1], one[2])], Images: [], Skins: [], Animations: [], Scene: [0]}});
		});

		await new Promise(function (done) {
			models.Load(names.smooth, function () {
				models.Load(names.rough, done);
			});
		});

		var create = graphics.Create;
		var instanced = [];

		/*
		 * The copies drawn of each shape, caught as the renderer of the scene is made: a bug of the test, it wrapped the meshes made
		 * after it mounted, and under load the plate was drawn before that.
		 */
		graphics.Create = function () {
			var made = create.apply(this, arguments);
			var mesh = made.Mesh;

			made.Mesh = function () {
				var one = mesh.apply(this, arguments);
				var instance = one.Instance;

				one.Instance = function (data) {
					if (data.aInstance2)
						instanced.push([data.aInstance2.Data[3], data.aInstance3.Data[3]]);

					return instance.apply(this, arguments);
				};

				return one;
			};

			return made;
		};

		var mounted;

		try {
			mounted = await mount('<Scene Paused="true" Quality="low" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="0.5" Water="0" Seed="flat" />' +
			'<SceneObject ID="sun" Kind="sun" Elevation="35" />' +
			'<SceneObject ID="plate" Kind="thing" Model="' + names.smooth + '" Size="1" X="0" Y="0" Z="1.2" Wet="1" Drops="0" />' +
		'</Scene>');
		}
		finally {
			graphics.Create = create;
		}

		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var now = performance.now() + 100;

		inner.Loop.Stop();

		/* How busy the middle of the picture is: the sum of what each pixel differs from the next. */
		function busy () {
			var size = 160;
			var data = new Uint8Array(size * size * 4);
			var sum = 0;
			var x;
			var y;

			for (x = 0; x < 2; x++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			gl.readPixels((renderer.Width - size) >> 1, (renderer.Height - size) >> 1, size, size, gl.RGBA, gl.UNSIGNED_BYTE, data);

			for (y = 0; y < size; y++) {
				for (x = 0; x + 1 < size; x++)
					sum += Math.abs(data[(y * size + x) * 4 + 1] - data[(y * size + x + 1) * 4 + 1]);
			}

			return sum;
		}

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return renderer.Progress().Needed === 0;
		}, 30000);

		scene.FocusOn('plate');

		inner.Pitch = 1.2;
		inner.Wanted = inner.Distance = 2.2;

		/* The view eases to the plate and the ground comes from workers: the measures are of a picture that no longer moves. */
		await waitFor(function () {
			var target = inner.Target.slice();

			inner.Rest = 0;

			engine.Frame(now += 33);

			return Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && Math.hypot(inner.Target[0] - target[0], inner.Target[1] - target[1], inner.Target[2] - target[2]) < 1e-6 && Math.abs(inner.Distance - inner.Wanted) < 1e-4;
		}, 30000);

		/* Declared, as a template writes them: regression, read as wet and drops they were left out. */
		expect(inner.Objects.plate.Values.Wet).toBe(1);
		expect(inner.Objects.plate.Values.Drops).toBe(0);

		var none = busy();

		scene.Change('plate', {Drops: 1});

		var beaded = busy();

		/* Its own wet and drops go with each copy: 1 + them, 0 for the weather's. */
		expect(instanced.some(function (pair) {
			return pair[0] === 2 && pair[1] === 2;
		})).toBe(true);

		expect(beaded).toBeGreaterThan(none * 1.6);

		/* No wet of its own and a dry day: nothing beads. */
		scene.Change('plate', {Wet: ''});

		var dry = busy();

		expect(dry).toBeLessThan(beaded / 1.6);
		expect(instanced.some(function (pair) {
			return pair[0] === 0 && pair[1] === 2;
		})).toBe(true);

		/* What is rough takes the water in. */
		scene.Change('plate', {Model: names.rough, Wet: 1, Drops: 1});

		var felt = busy();

		scene.Change('plate', {Drops: 0});

		expect(felt).toBeLessThan(busy() * 1.3);
	});

	it('blurs what is out of focus by its Bokeh: the hero in focus, or the distance given; nothing of it with none', async function () {
		var mounted = await mount('<Scene Quality="high" Paused="true" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="300" Height="30" Water="0" Scale="20" Seed="sharp" />' +
			'<SceneObject ID="sun" Kind="sun" Elevation="40" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var draw = renderer.Draw;
		var used = [];
		var focus = [];
		var now = performance.now() + 100;

		inner.Loop.Stop();

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uFixed !== undefined)
				focus.push(uniforms.uFixed);

			if (uniforms && (uniforms.uNear || uniforms.uDisc))
				used.push(uniforms.uNear ? 'disc' : 'focused');

			return draw.apply(this, arguments);
		};

		/* The relief of the ground: how much a little block of the view differs from the next. */
		function contrast () {
			var data = new Uint8Array(renderer.Width * renderer.Height * 4);
			var sum = 0;
			var x;
			var y;

			inner.Rest = 0;

			engine.Frame(now += 33);

			gl.readPixels(0, 0, renderer.Width, renderer.Height, gl.RGBA, gl.UNSIGNED_BYTE, data);

			/* Blocks of 6 by 6: the grain the picture is given at its end is evened out, the relief is not. */
			function block (bx, by) {
				var total = 0;
				var i;
				var j;

				for (j = 0; j < 6; j++) {
					for (i = 0; i < 6; i++)
						total += data[((by + j) * renderer.Width + bx + i) * 4 + 1];
				}

				return total / 36;
			}

			for (y = 0; y + 6 < renderer.Height; y += 6) {
				for (x = 0; x + 12 < renderer.Width; x += 6)
					sum += Math.abs(block(x, y) - block(x + 6, y));
			}

			return sum;
		}

		/* Its programs made, and its ground in all its squares (they come from workers): the picture no longer changes. */
		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return renderer.Progress().Needed === 0 && Elemenx.Service('SceneTerrainGenerator').Work().Waiting() === 0 && Object.keys(inner.Ground.Nodes).length > 4;
		}, 30000);

		await tick(50);

		contrast();

		var sharp = contrast();

		expect(used).toEqual([]);

		/* Open, in focus a step before the eye: what is far loses its fine lines. */
		scene.Bokeh = 1;
		scene.BokehFocus = 2;

		await tick(20);

		var blurred;
		var i;

		for (i = 0; i < 4; i++)
			blurred = contrast();

		expect(used).toContain('disc');
		expect(used).toContain('focused');
		expect(focus[focus.length - 1]).toBe(2);
		expect(blurred).toBeLessThan(sharp * 0.75);

		/* A hero: in focus at its body, wherever it walks. */
		scene.BokehFocus = '';

		scene.Add('unit', {ID: 'hero', Size: 1, X: 0, Y: 0});

		contrast();

		scene.Control('hero');

		contrast();
		contrast();

		var hero = inner.Objects.hero;
		var wanted = Math.hypot(hero.World[0] - inner.Eye[0], hero.World[1] + 0.6 - inner.Eye[1], hero.World[2] - inner.Eye[2]);

		expect(focus[focus.length - 1]).toBeCloseTo(wanted, 1);

		renderer.Draw = draw;
	});

	it('sows in clumps: thick groves and thin ground between them; grass in tufts and glades, its blades unlike by its spread', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="192" Height="2" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="woods" Kind="forest" Density="4" Seed="a" Cover="1" Patch="40" />' +
			'<SceneObject ID="blades" Kind="grass" Clumps="0.7" Patch="30" Spread="0.05" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var draws = [];
		var draw = engine.Renderer.Draw;

		inner.Wanted = inner.Distance = 60;

		async function sown () {
			await waitFor(function () {
				engine.Frame(performance.now() + 100);

				return scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
			}, 8000);

			return scene.Sown().Things;
		}

		var even = await sown();

		scene.Change('woods', {Clumps: 1});

		var clumped = await sown();

		/* Thin between the groves: fewer in all, and none of them in places where there were many. */
		expect(clumped).toBeLessThan(even * 0.8);
		expect(clumped).toBeGreaterThan(even * 0.2);

		/* The grass takes its clumps, its patch and its spread to its blades. */
		engine.Renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uClump)
				draws.push(uniforms.uClump);

			return draw.apply(this, arguments);
		};

		await waitFor(function () {
			engine.Frame(performance.now() + 200);

			return draws.length > 0;
		}, 6000);

		engine.Renderer.Draw = draw;

		expect(draws[0]).toEqual([0.7, 30, 0.05]);
		expect(Elemenx.Service('SceneKinds').Make('grass', {}).Traits.Grass).toMatchObject({Clumps: 0, Patch: 24, Spread: 0.45});
	});

	it('draws the model of a file by the same API: fetched, lit, moved and played', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var library = Elemenx.Service('SceneModels');
		var mounted;
		var scene;
		var inner;
		var engine;
		var gl;

		library.Define('test-column', {URL: address, Type: 'unit', Clips: {walk: 'Bend', attack: 'Spin'}});

		mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="300" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="hero" Kind="unit" Model="test-column" X="0" Y="0" />' +
			'<SceneObject ID="other" Kind="unit" Model="test-column" X="4" Y="0" />' +
		'</Scene>');

		scene = mounted.Space;
		inner = scene.Scene();
		engine = scene.Engine();
		gl = engine.Renderer.GL;

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return library.Ready('test-column') && inner.Lists && Object.keys(inner.Lists).length > 0;
		}, 4000);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		/* The same model is one draw of two copies, at frames of their own. */
		var lists = Object.keys(inner.Lists).filter(function (name) {
			return /test-column/.test(name) && inner.Lists[name].Skinned;
		});

		expect(lists.length).toBe(1);
		expect(inner.Lists[lists[0]].Count).toBe(2);

		expect(scene.Play('hero', 'attack')).toBe(true);
		expect(scene.Play('hero', 'nothing')).toBe(false);

		expect(scene.Move('hero', [20, 5])).toBe(true);

		inner.Seconds += 0.1;

		engine.Frame(performance.now() + 200);

		expect(inner.Objects.hero.Clip.Name).toBe('attack');

		scene.Play('hero', 'walk');

		inner.Seconds += 2;

		engine.Frame(performance.now() + 300);

		inner.Seconds += 0.2;

		engine.Frame(performance.now() + 400);

		expect(inner.Objects.hero.Clip.Name).toBe('walk');
		expect(inner.Objects.hero.Frames[0]).toBeGreaterThan(0);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		delete library.Recipes['test-column'];
	});

	it('sows the model of a file as it sows the ones of code', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var library = Elemenx.Service('SceneModels');
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="96" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="posts" Kind="forest" [shapes]="Shapes" Density="2" Cover="1" MinHeight="-100" MaxSlope="1" />' +
		'</Scene>', {Shapes: [address]});
		var scene = mounted.Space;
		var engine = scene.Engine();

		scene.Scene().Wanted = 40;
		scene.Scene().Distance = 40;

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return library.Has(address) && library.Ready(address) && scene.Sown().Waiting === 0 && scene.Sown().Draws > 0;
		}, 6000);

		expect(scene.Sown().Things).toBeGreaterThan(50);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);

		delete library.Recipes[address];
	});

	it('makes a picture of its light by the quality asked for, and steps down while frames are late when none is', async function () {
		var mounted = await mount('<Scene Quality="ultra" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="200" Height="6" Water="0.1" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" Elevation="30" />' +
			'<SceneObject ID="keep" Kind="house" X="0" Y="0" />' +
		'</Scene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var at = 0;
		var frame = function () {
			at += 100;

			engine.Frame(performance.now() + at);
		};
		var i;

		frame();

		expect(scene.Graphics()).toMatchObject({Level: 'ultra', Post: true, Cascades: 4, ShadowFar: 500, Bounce: true, Occlusion: 1});
		expect(gl.getError()).toBe(gl.NO_ERROR);

		['high', 'medium', 'low'].forEach(function (level) {
			scene.Quality = level;

			frame();
			frame();

			expect(scene.Graphics().Level).toBe(level);
			expect(gl.getError()).toBe(gl.NO_ERROR);
		});

		expect(scene.Graphics()).toMatchObject({Post: false, Cascades: 1, Bounce: false});

		/* Asked for by nobody: the frames decide. */
		scene.Quality = '';

		var first = scene.Graphics().Level;

		for (i = 0; i < 100; i++)
			engine.PostTime(0.05);

		expect(scene.Graphics().Level).not.toBe(first === 'low' ? 'none' : first);

		frame();

		expect(gl.getError()).toBe(gl.NO_ERROR);
	});

	it('makes a whole land of one biome of its World, and a village with its roads that nothing grows on', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="288" Height="24" Water="0.15" Seed="test" Biome="desert" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="oasis" Kind="village" X="10" Y="10" Houses="6" Seed="a" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var field;

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return inner.Ground && inner.Ground.Field.Roads && scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 8000);

		field = inner.Ground.Field;

		expect(field.Biome(30, -40).List[0].Ground).toEqual(Elemenx.Service('SceneBiomes').Get('desert').Ground);
		expect(scene.Sown().Things).toBeGreaterThan(20);

		await waitFor(function () {
			return scene.Objects(function (object) {
				return /house-/.test(object.ID);
			}).length > 2;
		}, 3000);

		/* The ground has its colors, its roads are painted, and nothing stands on them. */
		expect(terrain.Paint(field, 200, 200, 3, 0)).not.toEqual([0.3, 0.5, 0.22]);
		expect(field.Roads.length).toBeGreaterThan(2);
		expect(terrain.OnRoad(field, field.Roads[0][0][0], field.Roads[0][0][1], 1)).toBe(true);
		expect(terrain.Paint(field, field.Roads[0][0][0], field.Roads[0][0][1], 3, 0)).toEqual(Elemenx.Service('SceneBiomes').Get('desert').Ground.Road);

		/* A land of another name is another land. */
		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library({Size: 288, Height: 24, Water: 0.15, Seed: 'test', Biomes: ['alien']})});

		await waitFor(function () {
			engine.Frame(performance.now() + 200);

			return inner.Ground && inner.Ground.Field.Biomes && inner.Ground.Field.Biome(30, -40).List[0].Ground === Elemenx.Service('SceneBiomes').Get('alien').Ground;
		}, 3000);

		expect(inner.Ground.Field.Biome(30, -40).List[0].Name).toBe('alien');

		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
	});

	it('casts the shadows of what stands on a ground, or none when told', async function () {
		var mounted = await mount('<Scene (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" Elevation="30" Azimuth="90" />' +
			'<SceneObject ID="keep" Kind="castle" X="0" Y="0" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var renderer = scene.Engine().Renderer;
		var gl = renderer.GL;
		var at = 0;
		var light = function () {
			var data = new Uint8Array(renderer.Width * renderer.Height * 4);
			var sum = 0;
			var index;

			at += 1000;

			scene.Engine().Frame(performance.now() + at);

			gl.readPixels(0, 0, renderer.Width, renderer.Height, gl.RGBA, gl.UNSIGNED_BYTE, data);

			for (index = 0; index < data.length; index += 4)
				sum += data[index] + data[index + 1] + data[index + 2];

			return sum / (data.length / 4);
		};
		var lit;
		var shaded;
		var squares = 0;
		var steady = 0;
		var i;

		inner.Wanted = 70;
		inner.Distance = 70;
		inner.Pitch = 0.9;

		await waitFor(function () {
			return Object.keys(inner.Ground.Nodes).length > 6;
		}, 3000);

		/*
		 * The view comes to rest and the finest squares of the ground are made: until no more come. Regression: the frames
		 * were given with no turn between them, so the squares the workers made came only later, under load between the
		 * two pictures compared, and the ground of one was not the ground of the other.
		 */
		for (i = 0; i < 200 && steady < 4; i++) {
			scene.Engine().Frame(performance.now() + (at += 1000));

			await new Promise(function (done) {
				setTimeout(done, 30);
			});

			steady = Object.keys(inner.Ground.Nodes).length === squares ? steady + 1 : 0;
			squares = Object.keys(inner.Ground.Nodes).length;
		}

		shaded = light();

		scene.Shadows = false;

		lit = light();

		expect(gl.getError()).toBe(gl.NO_ERROR);
		expect(lit - shaded).toBeGreaterThan(1);
	});

	/* Regression: the ground had no light of the sky, so its shadows were black. */
	it('keeps the light of the sky in the shadows on a ground', async function () {
		var mounted = await mount('<Scene Quality="low" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" Elevation="1" Azimuth="90" />' +
		'</Scene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var data = new Uint8Array(4);
		var i;

		inner.Wanted = 60;
		inner.Distance = 60;
		inner.Pitch = 1.2;

		/* With the sun at the horizon nearly all the light of the ground is the one of the sky. */
		for (i = 0; i < 60; i++)
			engine.Frame(performance.now() + i * 100);

		gl.readPixels(Math.round(renderer.Width / 2), Math.round(renderer.Height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

		expect(data[0] + data[1] + data[2]).toBeGreaterThan(90);
	});

	it('walks a unit over a ground round the water and what blocks it, sends it by a right press, and saves its place', async function () {
		var arrived = [];
		var mounted = await mount('<Scene (ready)="Ready" (arrive)="Arrived">' +
			'<SceneObject ID="land" Kind="ground" Size="400" Height="30" Water="0.3" Seed="test" />' +
			'<SceneObject ID="sun" Kind="sun" />' +
			'<SceneObject ID="walker" Kind="unit" X="0" Y="0" Speed="10" />' +
			'<SceneObject ID="oak" Kind="tree" X="20" Y="0" />' +
		'</Scene>', {
			Arrived: function (event) {
				arrived.push(event);
			}
		});
		var scene = mounted.Space;
		var inner = scene.Scene();
		var field = inner.Ground.Field;
		var way;
		var goal = null;
		var x;

		/* The ground is under the unit, at its height. */
		scene.SetTime(0);

		expect(scene.Get('walker').World[1]).toBeCloseTo(Math.max(0, field.Height(0, 0)), 6);

		/* A dry point beyond the tree. */
		for (x = 30; x < 150 && !goal; x += 5) {
			if (field.Walkable(x, 0, {}))
				goal = [x, 0];
		}

		expect(goal).not.toBe(null);
		expect(scene.Move('walker', goal)).toBe(true);

		way = inner.Ways.walker;

		/* Its way goes round the tree: no point of it within the tree. */
		way.Points.forEach(function (point) {
			expect(Math.abs(point.X - 20) < 2 && Math.abs(point.Z) < 2).toBe(false);
		});

		inner.Seconds += way.Lengths[way.Lengths.length - 1] / 10 + 1;

		scene.SetTime(1);

		await tick(20);

		expect(arrived).toHaveLength(1);
		expect(arrived[0].ID).toBe('walker');
		expect(arrived[0].At[0]).toBeCloseTo(goal[0], 6);
		expect(scene.Get('walker').Values.X).toBeCloseTo(goal[0], 6);

		/* Saved where it stands now, loaded there again. */
		var saved = scene.Save();

		scene.Load(saved);

		expect(scene.Get('walker').Values.X).toBeCloseTo(goal[0], 6);
		expect(field.Path({X: 0, Z: 0}, {X: 0, Z: 0.1}, {})).not.toBe(null);
	});
});

describe('Contract: Gltf, the models other programs make', function () {
	var gltf;
	var models;
	var graphics;
	var meshes;
	var math;

	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		Use(['service:Gltf', 'service:Fbx', 'service:SceneModels', 'service:Renderer', 'service:Meshes', 'service:Math', 'service:Sigils', 'service:SceneRoads', 'service:SceneRoadGenerator', 'service:Physics']);

		gltf = Elemenx.Service('Gltf');
		models = Elemenx.Service('SceneModels');
		graphics = Elemenx.Service('Renderer');
		meshes = Elemenx.Service('Meshes');
		math = Elemenx.Service('Math');
	});

	afterEach(function () {
		delete models.Recipes['test-file'];
		delete models.Recipes['test-loop'];
	});

	function parsed (options) {
		var result = null;

		gltf.Parse(Binary(options), function (error, asset) {
			if (error)
				throw error;

			result = asset;
		});

		return result;
	}

	it('reads a GLB: its nodes, meshes, materials, skins, animations and pictures', function () {
		var asset = parsed();
		var column = asset.Meshes[0][0].Geometry;

		expect(asset.Nodes.map(function (node) {
			return node.Name;
		})).toEqual(['Root', 'Column', 'Upper', 'Crate']);

		expect(asset.Nodes[2].Parent).toBe(0);
		expect(asset.Scene).toEqual([0, 1, 3]);
		expect(column.Positions.length).toBe(7 * 8 * 3);
		expect(column.Indices.length).toBe(6 * 8 * 6);
		expect(column.Joints.length).toBe(7 * 8 * 4);
		expect(column.Weights[column.Weights.length - 3]).toBeCloseTo(1, 5);

		/* A primitive with no normals gets them of its faces. */
		expect(asset.Meshes[1][0].Geometry.Normals.every(Number.isFinite)).toBe(true);
		expect(Math.abs(asset.Meshes[1][0].Geometry.Normals[1])).toBeGreaterThan(0.1);

		expect(asset.Materials[0]).toMatchObject({Name: 'Skin', Metallic: 0, Alpha: 'OPAQUE'});
		expect(asset.Materials[0].Roughness).toBeCloseTo(0.6, 5);
		expect(asset.Materials[0].ColorMap.Image).toBe(0);
		expect(asset.Materials[0].Specular).toBe(1);
		expect(Array.from(asset.Images[0].Data)).toEqual(Array.from(Picture));
		expect(asset.Skins[0].Joints).toEqual([0, 2]);
		expect(asset.Skins[0].Inverse[29]).toBe(-1);
		expect(asset.Animations.map(function (animation) {
			return [animation.Name, animation.Length];
		})).toEqual([['Bend', 1], ['Spin', 1]]);
	});

	it('refuses what it cannot read, and says why', function () {
		var failure = null;

		gltf.Parse(Binary({Required: ['KHR_draco_mesh_compression']}), function (error) {
			failure = error;
		});

		expect(failure.message).toBe('Elemenx Gltf: extension KHR_draco_mesh_compression is not supported');

		gltf.Parse(new Uint8Array([1, 2, 3]), function (error) {
			failure = error;
		});

		expect(failure).toBeInstanceOf(Error);
	});

	it('decodes meshopt: the example of the specification, each mode and each filter', function () {
		var codes = new Uint8Array(16);
		var indices;
		var triangles;
		var view;

		/* The bytes the specification gives for a group of 4 bits, and the deltas it says they are. */
		gltf.MeshoptLane(new Uint8Array([0x02, 0, 0, 0, 0, 0x17, 0x5f, 0xf0, 0xbc, 0x77, 0xa9, 0x21, 0x00, 0x34, 0xb5]).subarray(0), 0, codes, 1);

		expect(Array.from(codes).map(function (code) {
			return code & 1 ? ~(code >> 1) : code >> 1;
		}).slice(0, 2)).toEqual([0, 0]);

		gltf.MeshoptLane(new Uint8Array([0x02, 0x17, 0x5f, 0xf0, 0xbc, 0x77, 0xa9, 0x21, 0x00, 0x34, 0xb5]), 0, codes, 1);

		expect(Array.from(codes).map(function (code) {
			return code & 1 ? ~(code >> 1) : code >> 1;
		})).toEqual([-1, -4, -3, 26, -91, 0, -6, 6, -4, -4, 5, -5, 1, -1, 0, 0]);

		/* Attributes: a block of raw codes over a baseline of 32 bytes, each element one up. */
		var source = [0xa0];
		var i;
		var lane;

		for (lane = 0; lane < 4; lane++) {
			source.push(0x03);

			for (i = 0; i < 16; i++)
				source.push(lane === 0 ? 2 : 0);
		}

		var attributes = gltf.Meshopt('ATTRIBUTES', new Uint8Array(source.concat(new Array(28).fill(0), [10, 20, 30, 40])), 3, 4, 'NONE');

		expect(Array.from(attributes)).toEqual([11, 20, 30, 40, 12, 20, 30, 40, 13, 20, 30, 40]);

		/* Indices: two baselines, a delta of 5 on the first, of 7 on the second, of -1 on the first. */
		indices = gltf.Meshopt('INDICES', new Uint8Array([0xd1, 5 << 2, (7 << 2) | 1, 0 << 2 | 2, 0, 0, 0, 0]), 3, 2, 'NONE');
		view = new Uint16Array(indices.buffer);

		expect(Array.from(view)).toEqual([5, 7, 4]);

		/* Triangles: a first one of three new vertices, then one on the newest edge with a new vertex. */
		var table = new Array(16).fill(0);

		triangles = gltf.Meshopt('TRIANGLES', new Uint8Array([0xe1, 0xf0, 0x00].concat(table)), 6, 2, 'NONE');

		expect(Array.from(new Uint16Array(triangles.buffer))).toEqual([0, 1, 2, 0, 2, 3]);

		/* Filters. */
		var octa = new Int8Array([0, 0, 127, 9]);

		gltf.FilterOctahedral(new Uint8Array(octa.buffer), 1, 4);

		expect(Array.from(octa)).toEqual([0, 0, 127, 9]);

		var quaternion = new Int16Array([0, 0, 0, 32764]);

		gltf.FilterQuaternion(new Uint8Array(quaternion.buffer), 1);

		expect(Array.from(quaternion)).toEqual([32767, 0, 0, 0]);

		var number = new Int32Array([(3 << 24) | 5]);
		var bytes = new Uint8Array(number.buffer);

		gltf.FilterExponential(bytes, 1, 4);

		expect(new Float32Array(bytes.buffer)[0]).toBe(40);

		expect(function () {
			gltf.Meshopt('ATTRIBUTES', new Uint8Array(40), 1, 4, 'NONE');
		}).toThrow('Elemenx Gltf: unknown meshopt attributes header 0x0');
	});

	it('makes a model of a file: 1 tall on the ground, its clips found by their names, its skeleton in frames of a texture', function () {
		var asset = parsed();
		var model;
		var baked;

		models.Define('test-file', {URL: 'test.glb', Type: 'unit', Clips: {walk: 'Bend'}});

		expect(models.Ready('test-file')).toBe(false);
		expect(models.Make('test-file')).toBe(null);

		models.Recipes['test-file'].Asset = asset;

		expect(models.Ready('test-file')).toBe(true);

		model = models.Make('test-file');

		expect(Object.keys(model.Clips).sort()).toEqual(['Bend', 'Spin', 'walk']);
		expect(model.Pieces.length).toBe(2);
		expect(model.Joints).toBe(2);

		var whole = models.Whole(model);
		var low = Infinity;
		var high = -Infinity;
		var i;

		for (i = 1; i < whole.Positions.length; i += 3) {
			low = Math.min(low, whole.Positions[i]);
			high = Math.max(high, whole.Positions[i]);
		}

		expect(low).toBeCloseTo(0, 4);
		expect(high).toBeCloseTo(1, 4);

		baked = models.Bake(model);

		expect(baked.Width).toBe(6);
		expect(baked.Height).toBeGreaterThan(30);
		expect(baked.Data.length).toBe(baked.Height * 2 * 12);

		/* In the rest pose a joint moves nothing but by what fits the model on the ground: the same in all of its corners. */
		var frame = Array.from(baked.Data.subarray(0, 12));

		expect(frame[0]).toBeCloseTo(0.5, 4);

		/* Half way the upper bone has turned a quarter: another line of the texture. */
		var middle = models.Frame(model, 'walk', 0.5);
		var row = Array.from(baked.Data.subarray(middle * 24 + 12, middle * 24 + 24));

		expect(middle).toBeGreaterThan(0);
		expect(row[5]).not.toBeCloseTo(frame[5], 2);

		/* A node that is no bone turns as a piece. */
		var pose = models.Pose(model, 'Spin', 0.5);
		var crate = model.Pieces[1];
		var turned = math.Apply(pose[crate.ID], [0.2, 0, 0]);
		var still = math.Apply(models.Pose(model, 'Spin', 0)[crate.ID], [0.2, 0, 0]);

		expect(math.Vectors.Distance(turned, still)).toBeGreaterThan(0.1);

		/* Copies at the same frame share one pose: a crowd is no slower for it. */
		expect(models.Pose(model, 'Spin', 0.5)).toBe(pose);
		expect(models.Pose(model, 'Spin', 0.8)).not.toBe(pose);
	});

	it('measures a skinned model by where its skeleton holds it, not by the numbers of its vertices', function () {
		var asset = parsed();
		var half = Math.SQRT1_2;

		/* As Sketchfab exports: the numbers are Z up, a root over the skeleton turns and scales them. */
		asset.Nodes[0].Rotation = [half, 0, 0, half];
		asset.Nodes[0].Scale = [3, 3, 3];

		models.Define('test-root', {URL: 'test.glb'});

		models.Recipes['test-root'].Asset = asset;

		var model = models.Make('test-root');
		var whole = models.Whole(model);
		var baked = models.Bake(model);
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];
		var i;

		for (i = 0; i < whole.Positions.length; i++) {
			low[i % 3] = Math.min(low[i % 3], whole.Positions[i]);
			high[i % 3] = Math.max(high[i % 3], whole.Positions[i]);
		}

		/* It lies along Z, 6 long and 1.5 thick: 1 tall means 4 long. */
		expect(low[1]).toBeCloseTo(0, 4);
		expect(high[1]).toBeCloseTo(1, 4);
		expect(high[2] - low[2]).toBeGreaterThan(3.9);

		/* What the shader does to the top of the column at rest lands in that same box. */
		var row = Array.from(baked.Data.subarray(12, 24));
		var z = row[8] * 0 + row[9] * 2 + row[10] * 0 + row[11];

		expect(z).toBeCloseTo(high[2], 1);

		var normal = model.Pieces[0].Placed.Normals;

		expect(Math.hypot(normal[0], normal[1], normal[2])).toBeCloseTo(1, 4);
	});

	it('plays the only clip of a file by itself, and bakes one animation once', function () {
		var asset = parsed();

		asset.Animations = [asset.Animations[0]];
		asset.Animations[0].Name = 'Motion';

		models.Define('test-single', {URL: 'test.glb'});

		models.Recipes['test-single'].Asset = asset;

		var model = models.Make('test-single');
		var baked = models.Bake(model);

		expect(Object.keys(model.Clips).sort()).toEqual(['Motion', 'idle']);
		expect(model.Clips.idle.Loop).toBe(true);
		expect(baked.Clips.idle).toBe(baked.Clips.Motion);
		/* Past the frames, a line of where the joints stand at rest. */
		expect(baked.Height).toBe(baked.Clips.Motion.Count + 3);

		/* A clip that says what it is stays that: nothing is made to stand for idle. */
		var attack = parsed();

		attack.Animations = [attack.Animations[0]];
		attack.Animations[0].Name = 'Attack';

		models.Define('test-attack', {URL: 'test.glb'});

		models.Recipes['test-attack'].Asset = attack;

		expect(Object.keys(models.Make('test-attack').Clips).sort()).toEqual(['Attack', 'attack']);
	});

	it('makes clips from a skeleton by the names of its bones: legs that swing in turn, arms let down', function () {
		function node (name, parent, at) {
			return {Name: name, Parent: parent, Translation: at, Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Children: []};
		}

		var nodes = [node('Pelvis', -1, [0, 1, 0]), node('Bip001 L Thigh', 0, [0.1, 0, 0]), node('Bip001 L Calf', 1, [0, -0.5, 0]), node('Bip001 R Thigh', 0, [-0.1, 0, 0]), node('Bip001 R Calf', 3, [0, -0.5, 0]), node('Bip001 L UpperArm', 0, [0.2, 0.5, 0]), node('Bip001 L Forearm', 5, [0.3, 0, 0])];

		nodes[0].Children = [1, 3, 5];
		nodes[1].Children = [2];
		nodes[3].Children = [4];
		nodes[5].Children = [6];

		var asset = {Nodes: nodes, Scene: [0], Skins: [{Joints: [0, 1, 2, 3, 4, 5, 6]}], Animations: []};
		var gait = models.Gait(asset);
		var legs = gait.Walk.Channels.filter(function (channel) {
			return channel.Node === 1 || channel.Node === 3;
		});

		expect(gait.Walk.Length).toBe(1);
		expect(legs.length).toBe(2);

		/* A quarter of the way one leg is ahead and the other behind: the same turn, opposite. */
		var key = 6 * 4;

		expect(legs[0].Values[key]).toBeCloseTo(-legs[1].Values[key], 3);
		expect(Math.abs(legs[0].Values[key])).toBeGreaterThan(0.1);

		/* The forearm goes on along it, or the elbow keeps the pose of arms held out. */
		expect(gait.Idle.Channels.filter(function (channel) {
			return channel.Node === 6;
		}).length).toBe(1);

		/* An arm held out comes down. */
		var arm = gait.Idle.Channels.filter(function (channel) {
			return channel.Node === 5;
		})[0];

		expect(Math.abs(arm.Values[2])).toBeGreaterThan(0.3);

		expect(models.Gait({Nodes: [node('Column', -1, [0, 0, 0])], Scene: [0], Skins: [{Joints: [0]}], Animations: []})).toBe(null);
	});

	it('bakes a long clip in steps, and joins the pieces of a location by material', function () {
		var asset = parsed();

		models.Define('test-steps', {URL: 'test.glb'});

		models.Recipes['test-steps'].Asset = asset;

		var model = models.Make('test-steps');

		expect(models.BakeStep(model, -1)).toBe(false);
		expect(model.Baked).toBeFalsy();
		expect(model.Baking.Frames.length).toBe(1);

		while (!models.BakeStep(model, 5)) {
			/* A few frames at a time. */
		}

		expect(model.Baked.Height).toBeGreaterThan(30);

		models.Define('test-merged', {URL: 'test.glb', Merge: true, Fit: false, Without: 'Crate'});

		models.Recipes['test-merged'].Asset = parsed();

		expect(models.Make('test-merged').Pieces.length).toBe(1);
	});

	it('reads the clip of an FBX as text and lays it on another skeleton, by what its bones are', function () {
		var fbx = Elemenx.Service('Fbx');
		var text = [
			'Objects:  {',
			'	Model: 1, "Model::mixamorig:Hips", "LimbNode" {',
			'		P: "PreRotation", "Vector3D", "Vector", "",0,0,0',
			'		P: "Lcl Translation", "Lcl Translation", "", "A+",0,100,0',
			'	}',
			'	Model: 2, "Model::mixamorig:LeftUpLeg", "LimbNode" {',
			'		P: "Lcl Translation", "Lcl Translation", "", "A+",10,-5,0',
			'	}',
			'	Model: 3, "Model::mixamorig:LeftLeg", "LimbNode" {',
			'		P: "Lcl Translation", "Lcl Translation", "", "A+",0,-45,0',
			'	}',
			'	Model: 4, "Model::mixamorig:LeftFoot", "LimbNode" {',
			'		P: "Lcl Translation", "Lcl Translation", "", "A+",0,-45,0',
			'	}',
			'	Model: 5, "Model::mixamorig:RightUpLeg", "LimbNode" {',
			'		P: "Lcl Translation", "Lcl Translation", "", "A+",-10,-5,0',
			'	}',
			'	AnimationCurve: 11, "AnimCurve::", "" {',
			'		KeyTime: *2 {',
			'			a: 0,46186158000',
			'		}',
			'		KeyValueFloat: *2 {',
			'			a: 0,40',
			'		}',
			'	}',
			'	AnimationCurveNode: 21, "AnimCurveNode::R", "" {',
			'	}',
			'}',
			'Connections:  {',
			'	C: "OO",2,1',
			'	C: "OO",3,2',
			'	C: "OO",4,3',
			'	C: "OO",5,1',
			'	C: "OP",11,21, "d|X"',
			'	C: "OP",21,2, "Lcl Rotation"',
			'}'
		].join('\n');
		var source = fbx.Parse(text);

		expect(source.Bones.map(function (bone) {
			return bone.Name;
		})).toEqual(['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg']);
		expect(source.Bones[2].Parent).toBe(1);
		expect(source.Bones[0].Translation).toEqual([0, 100, 0]);
		expect(source.Length).toBeCloseTo(1, 5);
		expect(fbx.Sample(source.Curves[1].R[0], 0.5, 0)).toBeCloseTo(20, 4);

		expect(function () {
			fbx.Parse('Kaydara FBX Binary  ');
		}).toThrow(/binary/);

		function node (name, parent, at) {
			return {Name: name, Parent: parent, Translation: at, Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Children: []};
		}

		var nodes = [node('Pelvis', -1, [0, 1, 0]), node('Bip001 L Thigh', 0, [0.1, 0, 0]), node('Bip001 L Calf', 1, [0, -0.5, 0]), node('Bip001 L Foot', 2, [0, -0.5, 0]), node('Bip001 R Thigh', 0, [-0.1, 0, 0])];

		nodes[0].Children = [1, 4];
		nodes[1].Children = [2];
		nodes[2].Children = [3];

		var made = models.Retarget({Nodes: nodes, Scene: [0], Skins: [{Joints: [0, 1, 2, 3, 4]}], Animations: []}, source, 'walk');
		var thigh = made.Channels.filter(function (channel) {
			return channel.Node === 1 && channel.Path === 'rotation';
		})[0];

		expect(made.Length).toBeCloseTo(1, 5);

		/* At the start the bone stands as it did, at the end it has turned by the forty degrees of its fellow. */
		expect(thigh.Values[3]).toBeCloseTo(1, 3);
		expect(Math.abs(thigh.Values[thigh.Values.length - 1])).toBeCloseTo(Math.cos(20 * Math.PI / 180), 3);

		expect(models.Retarget({Nodes: [node('Column', -1, [0, 0, 0])], Scene: [0], Skins: [{Joints: [0]}], Animations: []}, source, 'walk')).toBe(null);
	});

	it('reads a material of specular and glossiness as one of metal and roughness', function () {
		var made = gltf.Material({extensions: {KHR_materials_pbrSpecularGlossiness: {diffuseFactor: [0.5, 0.6, 0.7, 1], glossinessFactor: 0.5}}}, {});

		expect(made.BaseColor).toEqual([0.5, 0.6, 0.7, 1]);
		expect(made.Metallic).toBe(0);
		expect(made.Roughness).toBeCloseTo(0.7, 5);
	});

	it('closes the dish of the radar: seen from above it has a side that faces up', function () {
		var model = models.Make('radar');
		var dish = model.Pieces.filter(function (piece) {
			return piece.ID === 'dish';
		})[0];
		var up = 0;
		var i;

		for (i = 0; i < dish.Geometry.Normals.length; i += 3) {
			if (dish.Geometry.Normals[i + 1] > 0.7 && Math.hypot(dish.Geometry.Positions[i], dish.Geometry.Positions[i + 2]) > 0.15)
				up++;
		}

		expect(up).toBeGreaterThan(10);
	});

	it('lets a piece no skin holds go with the nearest bone, and takes the turn of the whole body out of a clip', function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var binds = [[math.Identity(), math.Translation(0, -2, 0)]];
		var rest = {5: math.Identity(), 6: math.Translation(0, 2, 0)};
		var geometry = {Positions: new Float32Array([0, 2.1, 0, 0.1, 2.1, 0, 0, 2.2, 0]), Normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), Indices: new Uint16Array([0, 1, 2])};
		var held = models.Held(geometry, math.Identity(), binds, {Skins: [{Joints: [5, 6]}]}, rest);

		expect(held.Skin).toBe(0);
		expect(held.Geometry.Joints[0]).toBe(1);
		expect(held.Geometry.Weights[0]).toBe(1);

		/* Bound to that bone, it stands where it stood. */
		var placed = models.Placed(held.Geometry, binds[0]);

		expect(placed.Positions[1]).toBeCloseTo(2.1, 5);

		/* A body turns round its hips, not round the middle of all that trails behind it. */
		expect(models.HipsOf({Nodes: [{Name: 'Root'}, {Name: 'Bip001 Pelvis_114'}], Skins: [{Joints: [0, 1]}]})).toBe(1);
		expect(models.HipsOf({Nodes: [{Name: 'Root'}], Skins: []})).toBe(-1);
		expect(modelsSource).toContain('hips === -1 ? -(box.Low[0] + box.High[0]) / 2 : -rest[hips][12]');

		/* Arms held down at rest are counted from a source with its arms down: that is what keeps them off the body. */
		expect(modelsSource).toContain('var down = !held && droop(\'L\') + droop(\'R\') < -0.6;');
		expect(modelsSource).toContain('pair.Lay = lowered;');
		expect(modelsSource).toContain('pairs[\'Hand\' + side].Still = true;');
		expect(modelsSource).toContain('fore.Ease = round(unit(turned(back(fore.Rest), hinge)), -0.24);');

		/* A lamp a body carries is inside its shape: no shadow of it. */
		expect(gameSceneSource).toContain('if (lamp && (lamp.Built || lamp.Object.Values.Follow || lamp.Settings.Follow))');

		/* The bones of other tools are known by their words and their side. */
		expect(models.BoneWord('ThighL').test('L_Hip_89')).toBe(true);
		expect(models.BoneWord('ThighR').test('L_Hip_89')).toBe(false);
		expect(models.BoneWord('ArmL').test('bip_upperArm_L_08')).toBe(true);
		expect(models.BoneWord('ForeR').test('arm2r_0105')).toBe(true);
		expect(models.BoneWord('HandL').test('handle_harpoon_080')).toBe(false);
		expect(models.BoneWord('Hips')).toBe(null);
		expect(models.HipsOf({Nodes: [{Name: 'sfx_gore_blood_hips_02'}], Skins: [{Joints: [0]}]})).toBe(-1);

		/* What a clip or a bone moves stays as it is. */
		var nodes = [{Parent: -1}, {Parent: 0}, {Parent: 1}, {Parent: -1}];

		expect(models.Loose({Nodes: nodes, Skins: [{Joints: [3]}], Animations: []}, 2)).toBe(true);
		expect(models.Loose({Nodes: nodes, Skins: [{Joints: [0]}], Animations: []}, 2)).toBe(false);
		expect(models.Loose({Nodes: nodes, Skins: [{Joints: [3]}], Animations: [{Channels: [{Node: 1}]}]}, 2)).toBe(false);

		expect(modelsSource).toContain('var spun = Math.abs(yaws[count] - yaws[0]) > 0.5');
		expect(modelsSource).toContain('worlds[index] = times(unspin,');
	});

	it('reads the lamps of a file and finds what glows in a model, as lamps of its own', function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');

		/* A node of a file says which of its lamps stands there. */
		expect(gltf.Node({name: 'Lamp', extensions: {KHR_lights_punctual: {light: 1}}}).Light).toBe(1);
		expect(gltf.Node({name: 'Plain'}).Light).toBe(-1);

		function plate (x, emissive, skin) {
			return {Rest: math.Translation(x, 2, 0), Skin: skin === undefined ? -1 : skin, Material: {Emissive: emissive}, Geometry: {Positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 1]), Indices: new Uint16Array([0, 1, 2])}};
		}

		var asset = {Lights: [{Type: 'point', Color: [1, 0, 0], Intensity: 100, Range: 12, Outer: 0.7}, {Type: 'spot', Color: [0, 1, 0], Intensity: 10, Range: 0, Outer: 0.5}, {Type: 'directional', Color: [1, 1, 1], Intensity: 3}], Nodes: [{Light: 0}, {Light: 1}, {Light: 2}, {Light: -1}], Images: []};
		var rest = [math.Translation(1, 2, 3), math.Translation(4, 5, 6), math.Identity(), math.Identity()];
		var lamps = models.BuiltLamps(asset, [plate(50, [0, 0, 2]), plate(-50, [0.01, 0, 0]), plate(0, [0, 2, 0], 0)], rest, math.Identity(), 240);
		var found = function (test) {
			return lamps.filter(test);
		};

		/* The sun of a file is left out: the sky has one. What barely glows, or moves on a bone, gives no lamp. */
		expect(lamps.length).toBe(3);
		expect(found(function (lamp) {
			return lamp.Color[0] === 1 && lamp.Radius === 12;
		})[0].Place).toEqual([1, 2, 3]);
		expect(found(function (lamp) {
			return lamp.Spot > 0;
		})[0].Spot).toBeCloseTo(0.5 * 180 / Math.PI, 4);

		var glow = found(function (lamp) {
			return lamp.Color[2] === 1;
		})[0];

		expect(glow.Place[0]).toBeCloseTo(50 + 1 / 3, 4);
		expect(glow.Place[1]).toBe(2);
		expect(glow.Radius).toBeGreaterThan(0);

		/* Many surfaces of one place are one lamp. */
		expect(models.BuiltLamps({Lights: [], Nodes: [], Images: []}, [plate(1, [2, 2, 2]), plate(1.2, [2, 2, 2]), plate(120, [2, 2, 2])], [], math.Identity(), 240).length).toBe(2);
	});

	it('moves the flesh that hangs on twist bones beside a limb, and brings the bone to where the limb bends', function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');

		function node (name, parent, at) {
			return {Name: name, Parent: parent, Translation: at, Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Children: []};
		}

		function bone (name, parent, at) {
			return {Name: name, Parent: parent, Pre: [0, 0, 0], Rotation: [0, 0, 0], Translation: at};
		}

		var nodes = [node('Pelvis', -1, [0, 1, 0]), node('Bip001 L Thigh', 0, [0.1, 0, 0]), node('Bip001 L Calf', 1, [0, -0.5, 0]), node('Bip001 L Foot', 2, [0, -0.5, 0]), node('Bip001 R Thigh', 0, [-0.1, 0, 0]), node('Bip001 L Clavicle', 0, [0.05, 0.5, 0]), node('Bip001 L UpperArm', 5, [0.1, 0, 0]), node('Bip001 L Forearm', 6, [0.3, 0.1, 0.1]), node('Bip001 L Hand', 7, [0.3, -0.1, -0.1]), node('Bip001 LUpArmTwist', 5, [0.1, 0, 0]), node('Bip001 L ForeTwist', 6, [0.3, 0, 0]), node('Sleeve', 9, [0.3, 0, 0])];

		nodes[0].Children = [1, 4, 5];
		nodes[1].Children = [2];
		nodes[2].Children = [3];
		nodes[5].Children = [6, 9];
		nodes[6].Children = [7, 10];
		nodes[7].Children = [8];
		nodes[9].Children = [11];

		var source = {Length: 1, Bones: [bone('Hips', -1, [0, 100, 0]), bone('LeftUpLeg', 0, [10, 0, 0]), bone('LeftLeg', 1, [0, -50, 0]), bone('LeftFoot', 2, [0, -50, 0]), bone('RightUpLeg', 0, [-10, 0, 0]), bone('LeftArm', 0, [15, 50, 0]), bone('LeftForeArm', 5, [30, 0, 0]), bone('LeftHand', 6, [30, 0, 0])], Curves: [null, null, null, null, null, {R: [null, null, {Times: [0, 1], Values: [0, -90]}]}, null, null]};
		var asset = {Nodes: nodes, Scene: [0], Skins: [{Joints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}], Animations: []};
		var hand = models.NodeWorld(asset, models.Sample(asset, null, 0), math.Identity())[8];
		var made = models.Retarget(asset, source, 'wave');

		/* A clip can be told to ask less of a bone: the turn it keeps is less, and the rest of it as it was. */
		function turnOf (clip, index) {
			var list = clip.Channels.filter(function (channel) {
				return channel.Node === index && channel.Path === 'rotation';
			})[0].Values;
			var count = list.length - 4;
			var dot = Math.abs(list[count] * nodes[index].Rotation[0] + list[count + 1] * nodes[index].Rotation[1] + list[count + 2] * nodes[index].Rotation[2] + list[count + 3] * nodes[index].Rotation[3]);

			return Math.acos(Math.min(1, dot)) * 2;
		}

		var calmed = models.Retarget(asset, source, 'wave', {Calm: {ArmL: 0.5}});
		var arm = Object.keys(nodes).filter(function (index) {
			return /UpperArm/.test(nodes[index].Name);
		}).map(Number)[0];

		expect(turnOf(calmed, arm)).toBeLessThan(turnOf(made, arm) * 0.65);

		function placeOf (time, index) {
			var world = models.NodeWorld(asset, models.Sample(asset, time === null ? null : made, time), math.Identity())[index];

			return [world[12], world[13], world[14]];
		}

		/* The bone stands at its twist bone, and what hangs on it did not move. */
		expect(placeOf(null, 7)[0]).toBeCloseTo(placeOf(null, 10)[0], 5);
		expect(placeOf(null, 7)[1]).toBeCloseTo(placeOf(null, 10)[1], 5);
		expect(placeOf(null, 7)[2]).toBeCloseTo(placeOf(null, 10)[2], 5);
		expect(placeOf(null, 8)[0]).toBeCloseTo(hand[12], 5);
		expect(placeOf(null, 8)[1]).toBeCloseTo(hand[13], 5);
		expect(placeOf(null, 8)[2]).toBeCloseTo(hand[14], 5);

		/* The arm turns down, and the sleeve on the twist bone goes with it to the elbow: it does not stay in the air. */
		var sleeve = placeOf(1, 11);
		var elbow = placeOf(1, 7);

		expect(Math.hypot(sleeve[0] - placeOf(0, 11)[0], sleeve[1] - placeOf(0, 11)[1], sleeve[2] - placeOf(0, 11)[2])).toBeGreaterThan(0.2);
		expect(Math.hypot(sleeve[0] - elbow[0], sleeve[1] - elbow[1], sleeve[2] - elbow[2])).toBeLessThan(0.01);

		/* A twist bone under its own limb goes with it by itself: nothing to do. */
		expect(made.Channels.some(function (channel) {
			return channel.Node === 9 && channel.Path === 'rotation';
		})).toBe(true);
		expect(made.Channels.some(function (channel) {
			return channel.Node === 11;
		})).toBe(false);
	});

	it('moves the body by what holds legs and spine together when they hang side by side', function () {
		function node (name, parent, at) {
			return {Name: name, Parent: parent, Translation: at, Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Children: []};
		}

		function bone (name, parent, at, up) {
			return {Name: name, Parent: parent, Translation: at, Rotation: [0, 0, 0, 1], Pre: [0, 0, 0, 1], T: up};
		}

		var nodes = [node('Root', -1, [0, 1, 0]), node('Pelvis', 0, [0, 0, 0]), node('L_Hip', 1, [0.1, 0, 0]), node('L_Knee', 2, [0, -0.5, 0]), node('L_Foot', 3, [0, -0.5, 0]), node('R_Hip', 1, [-0.1, 0, 0]), node('Spine1', 0, [0, 0.1, 0]), node('Spine2', 6, [0, 0.2, 0]), node('Neck', 7, [0, 0.2, 0])];

		nodes[0].Children = [1, 6];
		nodes[1].Children = [2, 5];
		nodes[2].Children = [3];
		nodes[3].Children = [4];
		nodes[6].Children = [7];
		nodes[7].Children = [8];

		var source = {Length: 1, Bones: [bone('Hips', -1, [0, 100, 0]), bone('LeftUpLeg', 0, [10, 0, 0]), bone('LeftLeg', 1, [0, -50, 0]), bone('LeftFoot', 2, [0, -50, 0]), bone('RightUpLeg', 0, [-10, 0, 0]), bone('Spine', 0, [0, 10, 0]), bone('Spine1', 5, [0, 20, 0])], Curves: [{T: [null, {Times: [0, 1], Values: [100, 130]}, null]}]};
		var asset = {Nodes: nodes, Scene: [0], Skins: [{Joints: [0, 1, 2, 3, 4, 5, 6, 7, 8]}], Animations: []};
		var made = models.Retarget(asset, source, 'jump');
		var moved = made.Channels.filter(function (channel) {
			return channel.Path === 'translation';
		})[0];

		expect(moved.Node).toBe(0);
	});

	it('takes the fingers of a clip only when its hands hold something', function () {
		function node (name, parent, at) {
			return {Name: name, Parent: parent, Translation: at, Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Mesh: -1, Skin: -1, Children: []};
		}

		function bone (name, parent, at) {
			return {Name: name, Parent: parent, Pre: [0, 0, 0], Rotation: [0, 0, 0], Translation: at};
		}

		function asset () {
			var nodes = [node('Pelvis', -1, [0, 1, 0]), node('Bip001 L Thigh', 0, [0.1, 0, 0]), node('Bip001 L Calf', 1, [0, -0.5, 0]), node('Bip001 L Foot', 2, [0, -0.5, 0]), node('Bip001 R Thigh', 0, [-0.1, 0, 0]), node('Bip001 L UpperArm', 0, [0.15, 0.5, 0]), node('Bip001 L Forearm', 5, [0.3, 0, 0]), node('Bip001 L Hand', 6, [0.3, 0, 0]), node('Bip001 L Finger1', 7, [0.05, 0, 0]), node('Bip001 L Finger11', 8, [0.02, 0, 0]), node('Bip001 L Finger12', 9, [0.02, 0, 0])];

			nodes[0].Children = [1, 4, 5];
			nodes[1].Children = [2];
			nodes[2].Children = [3];
			nodes[5].Children = [6];
			nodes[6].Children = [7];
			nodes[7].Children = [8];
			nodes[8].Children = [9];
			nodes[9].Children = [10];

			return {Nodes: nodes, Scene: [0], Skins: [{Joints: nodes.map(function (each, index) {
				return index;
			})}], Animations: []};
		}

		var source = {Length: 1, Bones: [bone('Hips', -1, [0, 100, 0]), bone('LeftUpLeg', 0, [10, 0, 0]), bone('LeftLeg', 1, [0, -50, 0]), bone('LeftFoot', 2, [0, -50, 0]), bone('RightUpLeg', 0, [-10, 0, 0]), bone('LeftArm', 0, [15, 50, 0]), bone('LeftForeArm', 5, [30, 0, 0]), bone('LeftHand', 6, [30, 0, 0]), bone('mixamorig:LeftHandIndex1', 7, [5, 0, 0]), bone('mixamorig:LeftHandIndex2', 8, [2, 0, 0]), bone('mixamorig:LeftHandIndex3', 9, [2, 0, 0])], Curves: []};

		function fingers (made) {
			return made.Channels.filter(function (channel) {
				return channel.Node >= 8;
			}).length;
		}

		expect(fingers(models.Retarget(asset(), source, 'idle'))).toBe(0);
		expect(fingers(models.Retarget(asset(), source, 'idle', {Held: true}))).toBe(3);
	});

	it('knows a bone of a model at a second of a clip, and where a thing in its hand stands', function () {
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');

		models.Define('test-bone', {URL: 'test.glb', Clips: {walk: 'Bend'}});

		models.Recipes['test-bone'].Asset = parsed();

		var model = models.Make('test-bone');
		var name = model.Asset.Nodes[model.Asset.Skins[0].Joints[1]].Name;

		expect(models.BoneMatrix(model, name, 'walk', 0).length).toBe(16);
		expect(models.BoneMatrix(model, name, 'walk', 0.5)).not.toEqual(models.BoneMatrix(model, name, 'walk', 0));
		expect(models.BoneMatrix(model, 'HandR', 'walk', 0)).toBe(null);
		expect(models.GripTurn(model, 'HandR', name)).toEqual(math.Identity());

		/* It lies in the palm: most of the way from the wrist to the middle finger; a hand with no fingers keeps its place. */
		function joint (name, parent, x, children) {
			return {Name: name, Parent: parent, Translation: [x, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Children: children};
		}

		var fingers = {Clips: {}, Fit: math.Identity(), Bones: {HandQ: 0}, Asset: {Nodes: [joint('hand', -1, 1, [1]), joint('middle.01', 0, 1, [])], Scene: [0], Skins: [], Animations: []}};

		expect(models.Palm(fingers, 'HandQ', '', math.Translation(1, 0, 0))[12]).toBeCloseTo(1.8, 5);
		expect(models.Palm({Bones: {}}, 'HandQ', '', math.Translation(1, 0, 0))[12]).toBe(1);

		/* A thing in a hand lies as the two bones stand at rest, X from the one to the other, and then turns with the first alone. */
		var first = model.Asset.Nodes[model.Asset.Skins[0].Joints[0]].Name;
		var hand = models.BoneMatrix(model, first, '', 0);
		var other = models.BoneMatrix(model, name, '', 0);
		var turn = models.GripTurn(model, first, name);
		var lying = math.Multiply(models.Grip(hand, null), turn);
		var aimed = models.Grip(hand, other);

		expect(lying[0]).toBeCloseTo(aimed[0], 5);
		expect(lying[1]).toBeCloseTo(aimed[1], 5);
		expect(lying[2]).toBeCloseTo(aimed[2], 5);
		expect(models.GripTurn(model, first, name)).toBe(turn);

		/* A bone of a skeleton of a hundredth: the thing does not shrink with it. */
		var small = math.Multiply(math.Translation(1, 2, 3), math.Scaling(0.01, 0.01, 0.01));
		var kept = models.Grip(small, null);

		expect(kept[0]).toBeCloseTo(1, 5);
		expect(kept[12]).toBe(1);

		/* Between two hands: X from the one to the other, Y up, whatever way the hand is turned. */
		var aimed = models.Grip(math.Multiply(math.Translation(0, 1, 0), math.Rotation([1, 0, 0], 1.2)), math.Translation(0, 1, 2));

		expect(aimed.slice(0, 3).map(Math.abs)).toEqual([0, 0, 1]);
		expect(aimed[5]).toBeCloseTo(1, 5);
		expect(aimed[13]).toBe(1);
	});

	it('goes between the frames of a clip: a screen shows more of them than are baked', function () {
		models.Define('test-between', {URL: 'test.glb', Clips: {walk: 'Bend'}});

		models.Recipes['test-between'].Asset = parsed();

		var model = models.Make('test-between');

		expect(models.Between(model, 'Spin', 0.1)).toBe(0);

		models.Bake(model);

		var time = (6 + 0.25) / 30;

		expect(models.Between(model, 'Spin', time)).toBeCloseTo(0.25, 4);
		expect(models.Between(model, 'Spin', time + 1)).toBeCloseTo(0.25, 4);
		expect(models.Between(model, 'nothing', time)).toBe(0);

		/* Skinned, it mixes the line with the next. */
		expect(gameSceneSource).toContain('m = m * (1.0 - aFrames.w) + joint(index, aFrames.x + 1.0) * aFrames.w;');
	});

	it('takes a loop of a clip round, and holds one that does not', function () {
		models.Define('test-loop', {URL: 'test.glb', Clips: {die: 'Bend'}});

		models.Recipes['test-loop'].Asset = parsed();

		var model = models.Make('test-loop');

		expect(models.Frame(model, 'Spin', 1.5)).toBe(models.Frame(model, 'Spin', 0.5));
		expect(models.Frame(model, 'die', 5)).toBe(models.Frame(model, 'die', 1));

		/* Played backwards, a loop is still within its length. */
		expect(models.Pose(model, 'Spin', -0.25)).toEqual(models.Pose(model, 'Spin', 0.75));
	});
});

describe('Contract: Biomes, the lands of a game', function () {
	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		Use(['service:SceneBiomes', 'service:SceneTerrainGenerator', 'service:SceneModels', 'service:Renderer', 'service:Meshes', 'service:Math']);
	});

	it('lays out the same village of the same seed, on what is level and dry, moved there if it must', function () {
		var biomes = Elemenx.Service('SceneBiomes');
		var models = Elemenx.Service('SceneModels');
		var field = Elemenx.Service('SceneTerrainGenerator').Flat({Size: 400, Height: 30, Water: 0.3, Seed: 'test'});
		var first = biomes.Village(field, {X: 30, Y: -20, Houses: 7, Seed: 'a'});
		var again = biomes.Village(field, {X: 30, Y: -20, Houses: 7, Seed: 'a'});

		expect(first.Objects.length).toBeGreaterThan(2);
		expect(first).toEqual(again);
		expect(first.Roads.length).toBeGreaterThanOrEqual(first.Objects.length);

		first.Objects.forEach(function (house) {
			expect(field.Height(house.X, house.Y)).toBeGreaterThan(1);
			expect(field.Slope(house.X, house.Y)).toBeLessThan(0.2);
			expect(models.Has(house.Kind)).toBe(true);
		});

		first.Objects.forEach(function (a, i) {
			first.Objects.forEach(function (b, j) {
				if (i !== j)
					expect(Math.abs(a.X - b.X) > 4 || Math.abs(a.Y - b.Y) > 4).toBe(true);
			});
		});

		biomes.Names().forEach(function (name) {
			biomes.Get(name).Scatter.forEach(function (rule) {
				rule.Shapes.forEach(function (shape) {
					expect(models.Has(shape)).toBe(true);
				});
			});
		});
	});

	it('takes the lands of an application', function () {
		var biomes = Elemenx.Service('SceneBiomes');

		biomes.Define('test-land', {Ground: {Low: [1, 0, 0]}, Scatter: [], Grass: null});

		expect(biomes.Has('test-land')).toBe(true);
		expect(biomes.Get('test-land').Ground.Low).toEqual([1, 0, 0]);
		expect(biomes.Get('nothing')).toBe(null);
	});
});

describe('Contract: Models, the models of a game made of code', function () {
	var models;
	var graphics;
	var meshes;
	var math;

	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		Use(['service:SceneModels', 'service:Renderer', 'service:Meshes', 'service:Math']);

		models = Elemenx.Service('SceneModels');
		graphics = Elemenx.Service('Renderer');
		meshes = Elemenx.Service('Meshes');
		math = Elemenx.Service('Math');
	});

	it('has units, animals, vehicles, plants, rocks, buildings and ships, each of whole triangles, its parents before their pieces', function () {
		['unit', 'animal', 'vehicle', 'plant', 'rock', 'building', 'ship'].forEach(function (type) {
			expect(models.Names({Type: type}).length).toBeGreaterThan(1);
		});

		expect(models.Names({Group: 'fantasy'})).toEqual(expect.arrayContaining(['knight', 'mage', 'castle', 'windmill']));
		expect(models.Names({Group: 'scifi'})).toEqual(expect.arrayContaining(['soldier', 'mech', 'tank', 'reactor']));

		models.Names().forEach(function (name) {
			var variants = models.Info(name).Variants;
			var variant;

			for (variant = 0; variant < variants; variant++) {
				var model = models.Make(name, {Variant: variant});
				var seen = {};

				model.Pieces.forEach(function (piece) {
					var geometry = piece.Geometry;

					expect(piece.Parent === '' || seen[piece.Parent]).toBeTruthy();
					expect(geometry.Indices.length).toBeGreaterThan(0);
					expect(geometry.Indices.length % 3).toBe(0);
					expect(geometry.Normals.length).toBe(geometry.Positions.length);
					expect(geometry.Colors.length).toBe(geometry.Positions.length);
					expect(geometry.Positions.every(Number.isFinite)).toBe(true);
					expect(geometry.Normals.every(Number.isFinite)).toBe(true);

					seen[piece.ID] = true;
				});
			}
		});
	});

	it('makes the same shape of the same variant, another of another, and throws on an unknown model', function () {
		var first = models.Make('oak', {Variant: 1});

		expect(models.Make('oak', {Variant: 1})).toBe(first);
		expect(models.Make('oak', {Variant: 1 + models.Info('oak').Variants})).toBe(first);
		expect(models.Make('oak', {Variant: 2}).Pieces[0].Geometry.Positions).not.toEqual(first.Pieces[0].Geometry.Positions);

		expect(function () {
			models.Make('dragon');
		}).toThrow('Elemenx Models: unknown model dragon');
	});

	it('poses the pieces of a clip on their pivots, children with their parents, and fades from a clip to another', function () {
		var knight = models.Make('knight');
		var foot = [-0.075, 0.03, 0.03];
		var hip = [-0.075, 0.47, 0];
		var forward = math.Apply(models.Pose(knight, 'walk', 0)['leg-l'], foot);
		var backward = math.Apply(models.Pose(knight, 'walk', 0.4)['leg-l'], foot);
		var pose = models.Pose(knight, 'walk', 0);
		var fading = models.Pose(knight, 'idle', 0, {From: 'walk', FromTime: 0, Fade: 0});
		var fallen = models.Pose(knight, 'die', 1);

		/* The legs swing round the hips, one way and the other. */
		expect(forward[2]).toBeGreaterThan(0.1);
		expect(backward[2]).toBeLessThan(-0.1);

		/* The hip itself stays with the body. */
		expect(math.Vectors.Distance(math.Apply(pose['leg-l'], hip), math.Apply(pose.body, hip))).toBeLessThan(0.001);

		/* At the start of a fade it is the last clip. */
		expect(Array.from(fading['leg-l'])).toEqual(Array.from(pose['leg-l']));

		/* The head of a fallen one is near the ground, and stays there. */
		expect(math.Apply(fallen.head, [0, 0.9, 0])[1]).toBeLessThan(0.25);
		expect(models.Pose(knight, 'die', 5).head).toEqual(fallen.head);
		expect(models.Length(knight, 'die')).toBe(1);
	});

	it('spins what turns with no end, and leaves a model of one piece still', function () {
		var mill = models.Make('windmill');

		expect(models.Pose(mill, 'idle', 1).sails).not.toEqual(models.Pose(mill, 'idle', 2).sails);
		expect(models.Pose(models.Make('pine'), 'idle', 1).body).toEqual(math.Identity());
	});

	it('makes simpler levels of a model, with fewer faces and the same size', function () {
		var levels = models.Levels('oak', {Variant: 0});
		var bounds = levels.map(function (geometry) {
			return models.Bounds(geometry);
		});

		expect(levels.length).toBe(3);
		expect(levels[1].Indices.length).toBeLessThan(levels[0].Indices.length);
		expect(levels[2].Indices.length).toBeLessThan(levels[1].Indices.length);
		expect(levels[2].Indices.length).toBeGreaterThan(30);

		expect(Math.abs(bounds[2].Radius - bounds[0].Radius)).toBeLessThan(bounds[0].Radius * 0.35);
		expect(Math.abs(bounds[2].Middle - bounds[0].Middle)).toBeLessThan(bounds[0].Radius * 0.35);

		levels.forEach(function (geometry) {
			expect(geometry.Colors.length).toBe(geometry.Positions.length);
			expect(geometry.Normals.every(Number.isFinite)).toBe(true);
		});
	});

	it('takes the models of an application', function () {
		models.Define('test-crate', {Group: 'fantasy', Type: 'prop', Size: 2, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], [1, 1, 1])])];
		}});

		expect(models.Has('test-crate')).toBe(true);
		/* Props of the library stand by it now (a fence, a well): the filters together. */
		expect(models.Names({Group: 'fantasy', Type: 'prop'})).toEqual(['test-crate']);
		expect(models.Names({Type: 'prop'})).toEqual(expect.arrayContaining(['test-crate', 'fence', 'well']));
		expect(models.Info('test-crate').Size).toBe(2);
		expect(models.Make('test-crate').Pieces[0].Geometry.Positions.length).toBe(36 * 3);

		expect(function () {
			models.Define('test-none', {});
		}).toThrow('Elemenx Models: Define expects (name, {Build})');
	});
});

describe('Contract: Terrain, the ground of a game', function () {
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneTerrainGenerator', 'service:Renderer', 'service:Meshes', 'service:Math']);

		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	it('has continuous heights, chunks with a skirt, and ways that keep out of the sea', function () {
		var field = terrain.Flat({Size: 600, Height: 40, Water: 0.35, Seed: 'contract'});
		var chunk = field.Chunk(0, 0, 100, 8);
		var wet = null;
		var x;
		var y;
		var way;

		expect(Math.abs(field.Height(10, 10) - field.Height(10.01, 10))).toBeLessThan(0.05);
		/* The skirt: each vertex of the edge again and lower, its normals half as long (its ground painted as the one over it, never as a wall). */
		expect(chunk.Positions.length / 3).toBe(81 + 32 * 2);
		expect(Math.hypot(chunk.Normals[81 * 3], chunk.Normals[81 * 3 + 1], chunk.Normals[81 * 3 + 2])).toBeCloseTo(0.5, 6);
		expect(chunk.Positions[82 * 3 + 1]).toBeLessThan(chunk.Positions[81 * 3 + 1]);
		expect(chunk.Colors.length).toBe(chunk.Positions.length);

		for (x = -280; x <= 280 && !wet; x += 10) {
			for (y = -280; y <= 280 && !wet; y += 10) {
				if (field.Height(x, y) < -2)
					wet = [x, y];
			}
		}

		expect(wet).not.toBe(null);
		expect(field.Walkable(wet[0], wet[1], {})).toBe(false);
		expect(field.Walkable(wet[0], wet[1], {Swim: true, MaxSlope: 1})).toBe(true);
		expect(field.Path({X: 0, Z: 0}, {X: wet[0], Z: wet[1]}, {})).toBe(null);

		way = field.Path({X: -100, Z: -100}, {X: 100, Z: 80}, {});

		if (way) {
			way.forEach(function (point, index) {
				if (index)
					expect(field.Walkable((point.X + way[index - 1].X) / 2, (point.Z + way[index - 1].Z) / 2, {})).toBe(true);
			});
		}
	});

	it('has the ground of a planet whose coasts are the ones its baked surface shows, its squares turned outwards', function () {
		var field = terrain.Sphere({Radius: 6371, Height: 8, Seed: 5.3, Ocean: 0.55, Type: 'terran'});
		var graphics = Elemenx.Service('Renderer');
		var meshes = Elemenx.Service('Meshes');
		var math = Elemenx.Service('Math');
		var noise = math.Noise();
		var direction = math.Vectors.Normalize([0.3, 0.8, -0.5]);
		var q = [direction[0] * 2.2 + 5.3, direction[1] * 2.2 + 5.3 * 0.7, direction[2] * 2.2 + 5.3 * 1.3];
		var face;
		var patch;
		var positions;
		var indices;
		var a;
		var b;
		var c;
		var n;

		/* The formula of the shader that bakes the surface: the land of the noise of q. */
		expect(field.Land(direction)).toBeCloseTo((noise.Fbm(q[0], q[1], q[2], 6) - 0.55 * 0.55 - 0.2) / (0.8 - 0.55 * 0.55), 9);
		expect(field.Elevation(direction)).toBeGreaterThanOrEqual(0);

		for (face = 0; face < 6; face++) {
			patch = field.Patch(face, 0.2, -0.4, 0.4, 4);
			positions = patch.Geometry.Positions;
			indices = patch.Geometry.Indices;
			a = [positions[indices[0] * 3], positions[indices[0] * 3 + 1], positions[indices[0] * 3 + 2]];
			b = [positions[indices[1] * 3], positions[indices[1] * 3 + 1], positions[indices[1] * 3 + 2]];
			c = [positions[indices[2] * 3], positions[indices[2] * 3 + 1], positions[indices[2] * 3 + 2]];
			n = math.Vectors.Cross(math.Vectors.Subtract(b, a), math.Vectors.Subtract(c, a));

			expect(math.Vectors.Dot(n, math.Vectors.Add(a, patch.Center)), 'face ' + face).toBeGreaterThan(0);
		}
	});
});
