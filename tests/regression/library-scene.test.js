import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import { Binary, Picture } from '../glb.mjs';
import gameSceneSource from '../../libraries/ElemenxUI/components/GameScene/GameScene.js?raw';
import modelsSource from '../../libraries/ElemenxUI/services/Models.js?raw';
import lightingSource from '../../libraries/ElemenxUI/traits/Lighting.js?raw';
import graphicsSource from '../../libraries/ElemenxUI/services/Graphics3D.js?raw';
import cosmosSource from '../../libraries/ElemenxUI/traits/Cosmos.js?raw';
import pageSource from '../../examples/Advanced/application/components/UIKitPage/UIKitPage.js?raw';
import effectsSource from '../../libraries/ElemenxUI/traits/Effects.js?raw';

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

describe('Contract: Astronomy and Graphics3D, the numbers of a star system and of three dimensions', function () {
	var astronomy;
	var graphics;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Astronomy', 'service:Graphics3D']);

		astronomy = Elemenx.Service('Astronomy');
		graphics = Elemenx.Service('Graphics3D');
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
		var m = graphics.Compose([1, 2, 3], graphics.Rotation([0, 1, 0], 0.7), 2);
		var back = graphics.Multiply(graphics.Invert(m), m);
		var camera = graphics.Camera({Position: [0, 0, 10], Target: [0, 0, 0]});
		var sphere = graphics.Sphere({Segments: 8, Rings: 4});
		var merged = graphics.Merge([graphics.Box({}), {Geometry: graphics.Box({}), Matrix: graphics.Translation(2, 0, 0), Color: [1, 0, 0]}]);
		var noise = graphics.Noise('a');
		var value = noise.Fbm(0.3, 0.7, 1.1, 4);

		graphics.Identity().forEach(function (expected, index) {
			expect(back[index]).toBeCloseTo(expected, 9);
		});

		expect(graphics.Apply(m, [0, 0, 0])).toEqual([1, 2, 3]);
		expect(camera.Project([0, 0, 0], 200, 100)).toMatchObject({X: 100, Y: 50, Visible: true});
		expect(camera.Project([0, 0, 20], 200, 100).Visible).toBe(false);
		expect(graphics.Hit(camera.Ray(100, 50, 200, 100), [0, 0, 0], 1)).toBeCloseTo(8.9, 6);
		expect(graphics.Hit(camera.Ray(0, 0, 200, 100), [0, 0, 0], 1)).toBe(-1);

		expect(sphere.Positions.length / 3).toBe(9 * 5);
		expect(graphics.Icosphere({Detail: 1}).Indices.length / 3).toBe(80);
		expect(merged.Positions.length / 3).toBe(48);
		expect(Math.max.apply(Math, merged.Indices)).toBe(47);
		expect(merged.Colors.slice(-3)).toEqual([1, 0, 0]);
		expect(merged.Positions[24 * 3]).toBeCloseTo(2.5, 9);

		expect(value).toBeGreaterThan(0);
		expect(value).toBeLessThan(1);
		expect(graphics.Noise('a').Fbm(0.3, 0.7, 1.1, 4)).toBe(value);
	});

	it('turns a line into a body, makes a roof of two slopes, flat faces and a box of parallel light', function () {
		var graphics = Elemenx.Service('Graphics3D');
		var lathe = graphics.Lathe({Points: [[1, 0], [1, 2]], Segments: 8});
		var wedge = graphics.Wedge({Width: 2, Height: 1, Depth: 2});
		var facets = graphics.Facets(graphics.Box({}));
		var box = graphics.Orthographic(-2, 2, -1, 1, 0, 10);
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

		expect(graphics.Apply(box, [2, 1, -10]).map(function (value) {
			return Math.round(value * 1000) / 1000;
		})).toEqual([1, 1, 1]);
		expect(graphics.Apply(box, [-2, -1, 0])[2]).toBeCloseTo(-1, 6);
	});

	it('has the same noise on the CPU as in the shaders, so a heightmap matches a baked surface', function () {
		var canvas = document.createElement('canvas');
		var renderer = graphics.Create(canvas, {Antialias: false});
		var head = '#version 300 es\nprecision highp float;\n';
		var program = renderer.Program(graphics.Shaders.Quad, head + graphics.Chunks.Noise + '\nin vec2 vQuad;\nout vec4 outColor;\nvoid main() {\n\tvec3 p = vec3(vQuad * 7.3, 2.1);\n\toutColor = vec4(noise3(p), fbm3(p, 5), ridge3(p, 4), 1.0);\n}');
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var gl = renderer.GL;
		var data = new Uint8Array(64 * 64 * 4);
		var noise = graphics.Noise();
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

		Use(['service:Kinds']);

		kinds = Elemenx.Service('Kinds');

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

describe('Contract: GameScene and GameObject, the objects of a game in 3D', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['GameScene', 'GameObject', 'GameLayer', 'GameTerrain', 'service:Terrain']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('reads the GameObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="sun" Kind="star" Name="Sun" Mass="1">' +
				'<GameObject ID="earth" Kind="planet" Name="Earth" Radius="6371" Mass="1" Distance="1" Tilt="23.4">' +
					'<GameObject ID="moon" Kind="moon" Name="Moon" Radius="1737" distance="384400 km" />' +
					'<GameObject ID="gateway" Kind="station" Name="Gateway" Team="blue">' +
						'<GameObject Part="dock" Max="300" />' +
						'<GameObject ID="lab" Kind="module" Shape="sphere" />' +
					'</GameObject>' +
				'</GameObject>' +
			'</GameObject>' +
			'<GameObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="blue" Count="3" />' +
		'</GameScene>');
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
		expect(scene.Get('gateway/dock').Traits.Health.Max).toBe(300);
		expect(scene.Get('gateway/lab').Traits.Model.Shape).toBe('sphere');
		expect(scene.Get('first').Parts.map(function (part) {
			return part.ID;
		})).toEqual(['first/ship-1', 'first/ship-2', 'first/ship-3']);

		scene.SetTime(365.25 / 4);

		later = scene.Position('earth');

		expect(later[1]).toBeCloseTo(1, 5);
		expect(Array.prototype.map.call(scene.$Element().querySelectorAll('.elemenx-game-scene-label'), function (label) {
			return label.textContent;
		}).sort()).toEqual(['Earth', 'First fleet', 'Gateway', 'Moon', 'Sun']);
	});

	it('draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle', async function () {
		var mounted = await mount('<GameScene Paused="true" Background="false" Labels="false" (ready)="Ready">' +
			'<GameObject ID="sun" Kind="star"><GameObject ID="rock" Kind="moon" Radius="6000" Distance="1" Atmosphere="none" Day="24" /></GameObject>' +
		'</GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var graphics = Elemenx.Service('Graphics3D');
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

		toStar = graphics.Vectors.Normalize([-rock.World[0], -rock.World[1], -rock.World[2]]);
		spot = function (sign) {
			return inner.Camera.Project(graphics.Vectors.Add(rock.World, graphics.Vectors.Scale(toStar, sign * rock.Size * 0.6)), inner.Width, inner.Height);
		};

		expect(bright(pixel(scene, spot(1).X, spot(1).Y))).toBeGreaterThan(90);
		expect(bright(pixel(scene, spot(-1).X, spot(-1).Y))).toBeLessThan(40);
	});

	it('selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives', async function () {
		var selected = [];
		var arrived = [];
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready" (select)="Selected" (arrive)="Arrived">' +
			'<GameObject ID="sun" Kind="star" Name="Sun"><GameObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Distance="1" /><GameObject ID="mars" Kind="planet" Name="Mars" Distance="1.5" /></GameObject>' +
			'<GameObject ID="first" Kind="fleet" Name="First fleet" Parent="earth" Team="red" Speed="0.5" />' +
		'</GameScene>', {
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

		element.querySelector('.elemenx-game-scene-label[data-id="earth"]').click();

		await tick(20);

		expect(selected[0].ID).toBe('earth');
		expect(selected[0].Info.Gravity).toBeCloseTo(9.81, 1);

		card = element.querySelector('.elemenx-game-scene-card');

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
		expect(element.querySelector('.elemenx-game-scene-card').textContent).toContain('Fighter');
	});

	it('adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same', async function () {
		var mounted = await mount('<GameScene Seed="kepler" Paused="true" (ready)="Ready" />');
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
		scene.Change('outpost-1/dock', {Max: 999});

		expect(scene.Get('outpost-1').Traits.Orbit.Distance).toBe(3);
		expect(scene.Get('outpost-1/dock').Traits.Health.Max).toBe(999);

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

		saved = JSON.parse(JSON.stringify(scene.Save()));
		before = JSON.stringify(scene.Objects().map(function (object) {
			return [object.ID, object.Parent, object.Values, object.Traits, object.Parts.map(function (part) {
				return [part.ID, part.Traits];
			})];
		}));

		/* The kind and what differs: an object as its kind gives it keeps no more than its ID and kind. */
		expect(saved.Objects.filter(function (object) {
			return object.ID === 'outpost-1';
		})[0].Parts).toContainEqual({ID: 'hub', Removed: true});

		scene.Remove('planet-b');
		scene.SetTime(0);
		scene.Load(saved);

		expect(scene.Now()).toBe(42);
		expect(JSON.stringify(scene.Objects().map(function (object) {
			return [object.ID, object.Parent, object.Values, object.Traits, object.Parts.map(function (part) {
				return [part.ID, part.Traits];
			})];
		}))).toBe(before);
	});

	it('runs the systems of the application for traits of their own', async function () {
		var seen = [];
		var mounted = await mount('<GameScene Paused="true" [systems]="Systems" (ready)="Ready"><GameObject ID="sun" Kind="star" /></GameScene>', {
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
		var mounted = await mount('<GameScene Paused="true" Background="false" (ready)="Ready" (land)="Landed" (takeoff)="Left">' +
			'<GameObject ID="sun" Kind="star"><GameObject ID="rock" Kind="planet" Surface-Type="desert" Radius="3390" Distance="1" />' +
			'<GameObject ID="giant" Kind="planet" Surface-Type="gas" Radius="69911" Distance="5" /></GameObject>' +
		'</GameScene>', {
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

		expect(scene.Land('giant')).toBe(false);
		expect(scene.Land('rock', {Latitude: 10, Longitude: 20, Altitude: 2})).toBe(true);
		expect(scene.Surface()).toMatchObject({ID: 'rock'});
		expect(scene.Surface().Latitude).toBeCloseTo(10, 6);

		/* Down to the ground: the squares of its faces made, finer near the eye, the eye above the ground. */
		for (i = 0; i < 40; i++)
			scene.Engine().Frame(performance.now() + i * 100);

		expect(Object.keys(inner.Surface.Nodes).length).toBeGreaterThan(20);
		expect(inner.Surface.Field.Altitude(inner.Surface.Eye)).toBeGreaterThan(0);
		expect(events).toEqual(['land rock']);

		scene.TakeOff();

		for (i = 0; i < 80 && inner.Surface; i++)
			scene.Engine().Frame(performance.now() + 4000 + i * 100);

		expect(scene.Surface()).toBe(null);
		expect(events).toEqual(['land rock', 'takeoff rock']);
		expect(inner.Focus).toBe('rock');
	});

	it('plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model', async function () {
		var ended = [];
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="20" Water="0.1" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="hero" Kind="knight" X="0" Y="0" Team="red" />' +
			'<GameObject ID="keep" Kind="tower" X="40" Y="40" />' +
		'</GameScene>');
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
		expect(scene.Get('keep').Traits.Health.Max).toBe(800);

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
		var mounted = await mount('<GameScene View="top" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="tower" Kind="tower" X="10" Y="20" />' +
		'</GameScene>');
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

	it('draws a map of cells: its objects with their models, in the places of their cells, by the API of every scene', async function () {
		var mounted = await mount('<GameScene Team="blue" Projection="isometric" (ready)="Ready">' +
			'<GameLayer Name="ground">\n........\n........\n........\n........\n</GameLayer>' +
			'<GameObject ID="hall" Kind="barracks" X="4" Y="0" Width="3" Height="2" Team="blue" />' +
			'<GameObject ID="hero" Kind="knight" X="1" Y="1" Team="blue" />' +
			'<GameObject ID="foe" Kind="unit" X="2" Y="2" Team="red" Type="worker" />' +
			'<GameObject ID="oak" Kind="tree" X="0" Y="3" />' +
		'</GameScene>');
		var world = mounted.Space;
		var inner = world.Scene();
		var engine = world.Engine();
		var selected = [];
		var at;

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return inner.Camera.Ortho > 0;
		}, 3000);

		expect(world.Cells).toBe(true);
		expect(world.Flat).toBe(false);
		expect(inner.Objects.hero.Shape).toBe('knight');
		expect(inner.Objects.foe.Shape).toBe('villager');
		expect(inner.Objects.hall.Shape).toBe('barracks');
		expect(world.Cell(5, 1).Cost).toBe(Infinity);
		expect(world.Cell(0, 3).Cost).toBe(Infinity);
		expect(inner.Ground.Field.Whole).toBe(true);

		/* A unit stands in the middle of its cell, and the scene shows it where the map says it is. */
		engine.Frame(performance.now() + 200);

		at = engine.ToScreen('hero');

		expect(at.X).toBeCloseTo(world.Strategy().ToScreen(1.5, 1.5).X, 0);
		expect(at.Y).toBeCloseTo(world.Strategy().ToScreen(1.5, 1.5).Y, 0);

		/* The same methods as in any scene: Select one or many, Selection, Move, Get, Change, Remove. */
		world.$On && world.$On('select', function (event) {
			selected.push(event);
		});

		world.Select('hero');

		expect(world.Selection()).toEqual(['hero']);

		world.Select(['hero', 'foe']);

		expect(world.Selection()).toEqual(['hero', 'foe']);

		expect(world.Move('hero', [6, 3])).toBe(true);

		await waitFor(function () {
			return world.Get('hero').Moving && inner.Objects.hero.Walking > 0;
		}, 2000);

		expect(world.Change('foe', {Team: 'blue'})).toBeTruthy();
		expect(world.Get('foe').Team).toBe('blue');
		expect(world.Get('hero').Moving).toBe(true);

		world.Remove('foe');

		expect(world.Get('foe')).toBe(null);
		expect(inner.Objects.foe).toBe(undefined);
		expect(world.Selection()).toEqual(['hero']);

		/* A saved game keeps where a unit walked to. */
		await waitFor(function () {
			return !world.Get('hero').Moving;
		}, 6000);

		var saved = world.Save();

		world.Change('hero', {X: 0, Y: 0});

		expect(world.Get('hero').X).toBe(0);

		world.Load(saved);

		expect(world.Get('hero')).toMatchObject({X: 6, Y: 3});

		/* A map of pictures is drawn on the canvas of the marks. */
		world.Add({ID: 'statue', Kind: 'statue', X: 1, Y: 3, Image: 'data:image/gif;base64,R0lGODlhAQABAAAAACw='});

		await waitFor(function () {
			return world.Flat === true;
		}, 2000);

		expect(world.Get('statue').Kind).toBe('thing');
		expect(world.Get('statue').Type).toBe('statue');
	});

	/* Regression: a frame counted 0.1 s at most, so at a few frames a second units walked in slow motion. */
	it('keeps the time of the game to the clock when frames are slow', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var start = performance.now() + 100000;
		var seconds;

		scene.Paused = false;

		engine.Frame(start);

		seconds = inner.Seconds;

		engine.Frame(start + 400);
		engine.Frame(start + 800);

		expect(inner.Seconds - seconds).toBeCloseTo(0.8, 5);

		/* A page that slept does not jump. */
		seconds = inner.Seconds;

		engine.Frame(start + 60000);

		expect(inner.Seconds - seconds).toBeCloseTo(1, 5);
	});

	/* Regression: each object summed the stars of all the objects, so 20 000 of them froze the page until it crashed. */
	it('shakes a view in parallel rays by moving it: a slant would throw it by its whole depth', async function () {
		var mounted = await mount('<GameScene View="top" Quality="high" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</GameScene>');
		var engine = mounted.Space.Engine();
		var parallel = [0.1, 0, 0, 0, 0, 0.1, 0, 0, 0, 0, -0.01, 0, 0, 0, -1, 1];
		var slanted = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, -1, 0, 0, -0.2, 0];
		var moved = engine.PostJitter(parallel);
		var turned = engine.PostJitter(slanted);

		expect(mounted.Space.Graphics().Frames).toBe(true);

		expect(moved[8]).toBe(0);
		expect(moved[9]).toBe(0);
		expect(Math.abs(moved[12]) + Math.abs(moved[13])).toBeGreaterThan(0);
		expect(Math.abs(moved[12])).toBeLessThan(2 / engine.Renderer.Width);

		expect(turned[12]).toBe(0);
		expect(Math.abs(turned[8]) + Math.abs(turned[9])).toBeGreaterThan(0);
	});

	it('brings the resolution back at the 60 frames of a screen, and holds it where a quality was chosen', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="2" Seed="test" /></GameScene>');
		var shaders = mounted.Space.Shaders(Elemenx.Service('Graphics3D'));

		[shaders.Land, shaders.Sea, shaders.Ground].forEach(function (source) {
			expect(source).not.toMatch(/noise3\(vWorld/);
		});
	});

	it('turns bodies at the pace of DaySeconds, however fast their orbits go', async function () {
		var mounted = await mount('<GameScene Paused="true" Speed="4" DaySeconds="30" (ready)="Ready">' +
			'<GameObject ID="sun" Kind="star">' +
				'<GameObject ID="earth" Kind="planet" Radius="6371" Distance="1" Day="24" />' +
				'<GameObject ID="mars" Kind="planet" Radius="3390" Distance="1.5" Day="12" />' +
			'</GameObject>' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="sun" Kind="star">' +
				'<GameObject ID="mars" Kind="planet" Radius="3390" Distance="1.5" />' +
			'</GameObject>' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Quality="medium" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="192" Height="2" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="woods" Kind="forest" Shapes="oak" Density="1" Seed="a" Cover="1" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="4" Water="0" Seed="test" />' +
		'</GameScene>');
		var scene = mounted.Space;

		scene.Add('unit', {ID: 'giant', Size: 7, X: 5, Y: 5, Name: 'Giant'});
		scene.Engine().Frame(performance.now() + 100);

		expect(scene.Scene().Objects.giant.Size).toBe(7);
		expect(scene.Scene().Objects.giant.Traits.Model.Size).toBe(7);
		expect(scene.Scene().Objects.giant.Values.X).toBe(5);
	});

	it('lets the view go anywhere: over a ground it is carried and lets its object go, in space it leaves its body aside', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="hero" Kind="knight" X="0" Y="0" />' +
		'</GameScene>');
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

		var space = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="sun" Kind="star"><GameObject ID="mars" Kind="planet" Radius="3390" Distance="1.5" /></GameObject></GameScene>');
		var far = space.Space.Scene();

		space.Space.Engine().Frame(performance.now() + 100);
		space.Space.Engine().PanView(50, 20);

		expect(Math.hypot(far.Pan[0], far.Pan[1], far.Pan[2])).toBeGreaterThan(0);

		space.Space.Engine().FocusOn('mars', true);

		expect(far.Pan).toEqual([0, 0, 0]);
	});

	it('works out the light of a field: what a hill hides of the sky, and the color that comes from the land round a place', async function () {
		var mounted = await mount('<GameScene Quality="high" Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="300" Height="40" Water="0" Scale="60" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" Elevation="40" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="sun" Kind="star">' +
				'<GameObject ID="earth" Kind="planet" Surface-Type="terran" Radius="6371" Distance="1" />' +
			'</GameObject>' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="sun" Kind="star"><GameObject ID="moon" Kind="planet" Surface-Type="moon" Radius="1737" Distance="1" /></GameObject></GameScene>');
		var inner = mounted.Space.Scene();

		mounted.Space.Engine().Frame(performance.now() + 100);

		mounted.Space.Land('moon', {Instant: true, Altitude: 2});

		expect(inner.Surface.Altitude).toBe(2);
		expect(inner.Surface.Way).toBe(null);
	});

	it('keeps from the shaders what would blur, flicker or show as noise', async function () {
		var mounted = await mount('<GameScene (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="2" Seed="test" /></GameScene>');
		var space = mounted.Space;
		var graphics = Elemenx.Service('Graphics3D');
		var lights = space.LightingShaders(graphics);
		var sown = space.ScatterShaders(graphics);

		/* What moves by itself keeps little history: the frames hardly mix over it. */
		expect(lights.Frames).toMatch(/moving > 0\.5 \? 0\.3/);
		expect(space.Shaders(graphics).Pbr).toMatch(/uMoving/);

		/* A highlight that falls between pixels is spread by what the normal does there, or it flickers on carbon and paint. */
		expect(space.Shaders(graphics).Pbr).toMatch(/roughness = sqrt\(min\(1\.0, roughness \* roughness \+ spread\)\)/);

		/* What moves keeps few frames: its shadow has a pattern that stands, not a grain they would take away. */
		expect(graphics.Chunks.Shadow).toMatch(/uSteady > 0\.5 \? 0\.0 :/);

		/* Air seen from inside its shell has no line where the nearest point of a ray goes behind the eye. */
		expect(space.Shaders(graphics).Air).toMatch(/max\(dot\(uBody\.xyz - uCamera, look\), 0\.0\)/);

		/* Grass: the wind is one wave for a place, a blade stirs only near, and one with no height is not drawn. */
		expect(sown.GrassVertex).toMatch(/wave \* 0\.16 \* near/);
		expect(sown.GrassVertex).not.toMatch(/uWind \* 1\.4 \+ place\.x \* 0\.21 \+ seed/);
		expect(sown.GrassVertex).toMatch(/tall > 0\.01 \?/);

		/* Water is lit by what its waves mirror; clouds are a ray through their layer. */
		expect(lights.Clouds).toMatch(/thick\(p/);
		expect(lights.Shafts).toMatch(/uSpot/);

		/* The sun on water comes of its waves: the same on a map and on a planet. */
		expect(space.Shaders(graphics).Sea).toMatch(/wavesAt/);
		expect(space.Shaders(graphics).Ground).toMatch(/wavesAt/);
	});

	it('lets the eye go down to the ground and look up at the sky', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" /></GameScene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();

		inner.Wanted = inner.Distance = 20;
		inner.Pitch = -1;

		engine.Frame(performance.now() + 100);

		expect(inner.Camera.Target[1]).toBeGreaterThan(inner.Camera.Position[1]);
		expect(inner.Pitch).toBe(-1);
	});

	it('reads an hour of the day: the sun at noon is high and white, at sunset low and gold, at night the moon lights the land', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" />' +
			'<GameObject ID="day" Kind="sun" Time="12:00" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Weather="clear" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" />' +
			'<GameObject ID="day" Kind="sun" Elevation="50" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="2" Seed="test" />' +
		'</GameScene>');
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
		var terrain = Elemenx.Service('Terrain');

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
		var models = Elemenx.Service('Models');
		var first = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
		var second = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');

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
		var mounted = await mount('<GameScene Flare="1.5" Weather="rain" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
		var space = mounted.Space;
		var lights = space.LightingShaders(Elemenx.Service('Graphics3D'));
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" /></GameScene>');
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

	it('runs its frames with no graphics at all, as a page out of WebGL contexts does', async function () {
		var get = HTMLCanvasElement.prototype.getContext;
		var mounted;

		HTMLCanvasElement.prototype.getContext = function (kind) {
			return /webgl/.test(kind) ? null : get.apply(this, arguments);
		};

		try {
			mounted = await mount('<GameScene (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
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

	it('moves the weather: fronts, a wind for all, what stays on the ground and the bolts of a storm', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="medium" Weather="cloudy" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" /></GameScene>');
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

	it('lights the world with the lamps a model carries, unless it is told not to', async function () {
		var library = Elemenx.Service('Models');
		var mounted;

		library.Define('test-beacon', {Build: library.Recipes.crystal.Build});

		mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="23" /></GameScene>');

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
		var mounted = await mount('<GameScene Paused="true" Quality="medium" Weather="clear" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="high" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" /><GameObject ID="hero" Kind="unit" X="0" Y="0" /></GameScene>');
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
		var graphics = Elemenx.Service('Graphics3D');
		var mounted = await mount('<GameScene Paused="true" Quality="medium" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="23" /></GameScene>');
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
		expect(engine.EffectHeat(graphics.Identity(), 1).length).toBe(16);
		expect(effectsSource).toContain('renderer.GL.colorMask(true, true, true, false);');
	});

	it('makes a sky of a seed, a face a frame, the same for the same seed, and gives it to the shade of bodies', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="medium" Weather="clear" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" /></GameScene>');
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
		expect(lightingSource).toContain('var spot = graphics.Apply(view.Plain || view.Matrix, sun);');
		expect(gameSceneSource).toContain('smoothstep(-0.12, 0.02, s) * (1.0 - uCover);');
	});

	it('does what hangs on the depth before the frames add up, so no edge trembles with the shake of the view', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="high" Weather="fog" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="200" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" /></GameScene>');
		var engine = mounted.Space.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;
		var i;

		for (i = 0; i < 4; i++)
			engine.Frame(now += 100);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		var air = lightingSource.indexOf('pass(state.Aired, run.Air, {');
		var frames = lightingSource.indexOf('pass(state.Now, run.Frames, {');

		expect(air).toBeGreaterThan(0);
		expect(air).toBeLessThan(frames);

		/* The picture has no depth of its own to read any more. */
		var picture = lightingSource.slice(lightingSource.indexOf('Picture: head + ['));

		expect(picture.slice(0, picture.indexOf('].join'))).not.toContain('uDepth');

		/* What is not a number once would stay in the eye for good, and the colors of a frame may fall under zero. */
		expect(lightingSource).toContain('if (!(old > -9.0)) old = seen;');
		expect(lightingSource).toContain('(bright > 0.0 ? min(bright, 100.0) : 0.0)');
	});

	it('lets go of neither a hero nor the view on Escape, and takes no leap of the pointer', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var heard = '';
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" Axes="bottom-left" Origin="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});

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

		var corner = scene.$Element().querySelector('.elemenx-game-scene-axes');

		expect(corner.getAttribute('data-corner')).toBe('bottom-left');
		expect(scene.ViewYaw).toBe(0.7);

		var ends = corner.querySelectorAll('.elemenx-axes-end');

		expect(ends.length).toBe(6);

		corner.querySelector('.elemenx-axes-x.near').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(inner.Yaw).toBeCloseTo(Math.PI / 2, 5);
		expect(inner.Pitch).toBe(0);

		corner.querySelector('.elemenx-axes-z.other').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(inner.Yaw).toBeCloseTo(Math.PI, 5);

		corner.querySelector('.elemenx-axes-y.near').dispatchEvent(new MouseEvent('click', {bubbles: true}));

		expect(inner.Pitch).toBe(1.5);
	});

	it('Axes draws each end where the view has it, the nearest over the others', async function () {
		var axes = Elemenx.Component('Axes')({Yaw: 0, Pitch: 0});

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

		axes.$Element().querySelector('.elemenx-axes-x.other').dispatchEvent(new MouseEvent('click', {bubbles: true}));

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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var captured = scene.Captured;
		var locked = Object.getOwnPropertyDescriptor(Document.prototype, 'pointerLockElement');

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});

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
		var mounted = await mount('<GameScene Paused="true" Quality="high" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="0" Latitude="20" DayOfYear="100" /></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();

		scene.Engine().Frame(performance.now() + 100);

		expect(inner.Ground.Night).toBe(1);
		expect(gameSceneSource).toContain('[0.045 * night * glow, 0.058 * night * glow, 0.095 * night * glow]');
		expect(lightingSource).toContain('open = mix(open, 1.0, uNight);');
		expect(gameSceneSource).toContain('scene.Ground.Night > 0.5 ? 0.05 : 0.012');
	});

	it('goes over the other shoulder, and B says so with the pointer taken', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="low" Person="shoulder" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var heard = '';

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="medium" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="20" Latitude="20" DayOfYear="100" /></GameScene>');
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

	it('Tracks makes a closed road of a seed, knows how far a place is from it, and a model of it', function () {
		var tracks = Elemenx.Service('Tracks');
		var track = tracks.Make('t', {Length: 1500, Corners: 10});
		var points = track.Points;
		var i;

		expect(tracks.Make('t', {Length: 1500, Corners: 10}).Points).toEqual(points);
		expect(tracks.Make('u', {Length: 1500, Corners: 10}).Points[9].X).not.toBe(points[9].X);

		var round = 0;

		for (i = 0; i < points.length; i++)
			round += Math.hypot(points[(i + 1) % points.length].X - points[i].X, points[(i + 1) % points.length].Z - points[i].Z);

		expect(Math.abs(round - 1500)).toBeLessThan(150);

		/* It closes on itself and keeps its steps. */
		expect(Math.hypot(points[0].X - points[points.length - 1].X, points[0].Z - points[points.length - 1].Z)).toBeLessThan(20);

		var point = points[40];
		var aside = tracks.Near(track, point.X + point.Way[1] * 5, point.Z - point.Way[0] * 5);

		expect(Math.abs(aside.Offset)).toBeCloseTo(5, 0);
		expect(Math.abs(aside.Along - 40)).toBeLessThan(3);
		expect(tracks.Near(track, point.X - point.Way[1] * 5, point.Z + point.Way[0] * 5).Offset * aside.Offset).toBeLessThan(0);

		/* The land comes to the road, and goes off on its own far from it. */
		expect(tracks.Height(track, point.X, point.Z)).toBeCloseTo(point.Y - 0.25, 3);

		var start = track.Start;

		expect(Math.hypot(start.X - points[track.Line].X, start.Z - points[track.Line].Z)).toBe(0);

		var asset = tracks.Asset(track);

		expect(asset.Meshes[0].length).toBeGreaterThan(5);
		expect(asset.Images.length).toBe(asset.Materials.length);

		asset.Meshes[0].forEach(function (part) {
			expect(Math.max.apply(null, part.Geometry.Indices)).toBeLessThan(part.Geometry.Positions.length / 3);
			expect(part.Geometry.Colors).toBe(null);
		});
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

	it('A mirrored node keeps its mirror, and what a file keeps as one piece stands apart', function () {
		var gltf = Elemenx.Service('Gltf');
		var models = Elemenx.Service('Models');
		var graphics = Elemenx.Service('Graphics3D');

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
		var pieces = [{ID: 'a', Node: 0, Skin: -1, Rest: graphics.Identity(), Geometry: geometry, Material: {Name: 'paint'}}, {ID: 'b', Node: 1, Skin: -1, Rest: graphics.Identity(), Geometry: geometry, Material: {Name: 'paint'}}, {ID: 'c', Node: 1, Skin: -1, Rest: graphics.Identity(), Geometry: geometry, Material: {Name: 'Tyre'}}];
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
		var axle = models.Apart(asset, [{ID: 'a', Node: 0, Skin: -1, Rest: graphics.Identity(), Material: {Name: ''}, Geometry: {Positions: [0, 1, 2, 3, 4, 5, 6, 7].reduce(function (list, row) {
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
		var graphics = Elemenx.Service('Graphics3D');
		var ship = {At: [0, 0, 0], Right: [1, 0, 0], Up: [0, 1, 0], Ahead: [0, 0, 1], Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0.5};
		var i;

		for (i = 0; i < 600; i++)
			physics.Ship(ship, {Throttle: 1, Yaw: 1, Pitch: 0.5, Roll: 1}, {Top: 2}, 1 / 120);

		expect(ship.Throttle).toBe(1);
		expect(graphics.Vectors.Length(ship.Way)).toBeGreaterThan(1);
		expect(graphics.Vectors.Dot(ship.Ahead, ship.Up)).toBeCloseTo(0, 6);
		expect(graphics.Vectors.Length(ship.Right)).toBeCloseTo(1, 6);

		var still = {At: [0, 0, 0], Right: [1, 0, 0], Up: [0, 1, 0], Ahead: [0, 0, 1], Way: [0, 0, 0], Spin: [0, 0, 0], Throttle: 0};

		physics.Ship(still, {Yaw: 1}, {}, 0.2);

		expect(still.Ahead[0]).toBeGreaterThan(0);
	});

	it('Tracks says what a wheel stands on: smooth along the road, the land beside it', function () {
		var tracks = Elemenx.Service('Tracks');
		var track = tracks.Make('under', {Length: 1200, Corners: 9, Hills: 9});
		var a = track.Points[30];
		var b = track.Points[31];
		var last = null;
		var i;

		for (i = 0; i <= 12; i++) {
			var under = tracks.Under(track, a.X + (b.X - a.X) * i / 12, a.Z + (b.Z - a.Z) * i / 12);

			expect(under.Grip).toBe(1);

			if (last !== null)
				expect(Math.abs(under.Height - last)).toBeLessThan(0.05);

			last = under.Height;
		}

		var off = tracks.Under(track, a.X + a.Way[1] * 15, a.Z - a.Way[0] * 15);

		expect(off.Grip).toBeLessThan(1);
		expect(off.Drag).toBeGreaterThan(0);

		/* All the way round, and where its points lie far apart as well, the road has no step: a step is what threw a car up on a flat road. */
		var longest = 0;
		var worst = 0;

		track.Points.forEach(function (point, index) {
			var after = track.Points[(index + 1) % track.Points.length];
			var before = tracks.Under(track, point.X, point.Z).Height;
			var j;

			longest = Math.max(longest, Math.hypot(after.X - point.X, after.Z - point.Z));

			for (j = 1; j <= 24; j++) {
				var height = tracks.Under(track, point.X + (after.X - point.X) * j / 24, point.Z + (after.Z - point.Z) * j / 24).Height;

				worst = Math.max(worst, Math.abs(height - before));
				before = height;
			}
		});

		expect(longest).toBeGreaterThan(7);
		expect(worst).toBeLessThan(0.05);

		/* Nearness is to the line and not to its nearest point, and with a hint it stays with the section it was told. */
		var sharpest = 0;

		track.Points.forEach(function (point, index) {
			if (point.Bend > track.Points[sharpest].Bend)
				sharpest = index;
		});

		var bendFrom = track.Points[sharpest];
		var bendTo = track.Points[(sharpest + 1) % track.Points.length];

		expect(Math.abs(tracks.Near(track, (bendFrom.X + bendTo.X) / 2, (bendFrom.Z + bendTo.Z) / 2).Offset)).toBeLessThan(0.01);

		var count = track.Points.length;
		var far = Math.floor(count / 2);

		expect(tracks.Near(track, a.X, a.Z, far).Along).not.toBe(30);
		expect(tracks.Near(track, a.X, a.Z, 28).Along).toBe(30);
	});

	it('holds a car inside the barrier by its corners, at any speed and at any angle', async function () {
		var models = Elemenx.Service('Models');
		var tracks = Elemenx.Service('Tracks');
		var track = tracks.Make('walls', {Length: 1200, Corners: 9});
		var name = unique('track');

		models.Define(name, {URL: name, Asset: tracks.Asset(track), Fit: false});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var start = track.Start;

		scene.Add('location', {ID: 'place', Model: name, Size: 1});

		for (var f = 0; f < 3; f++) {
			inner.Rest = 0;

			engine.Frame(now += 33);
		}

		scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: start.X, Y: start.Z, Z: start.Y, Vehicle: {Kind: 'car', Track: track, Heading: start.Heading + 0.9, Long: 2.3, Wide: 1, Power: 1400000, Top: 120}});
		scene.Control('car');

		var car = inner.Objects.car;
		var wall = track.Width / 2 + track.Margin;
		var worst = 0;
		var met = 0;

		for (var i = 0; i < 700; i++) {
			inner.Ground.Keys = i % 140 < 70 ? {KeyW: true, KeyA: true} : {KeyW: true, KeyD: true};
			inner.Rest = 0;

			engine.Frame(now += 33);

			var state = car.Car;
			var ahead = [Math.sin(state.Heading), Math.cos(state.Heading)];

			[[2.3, 1], [2.3, -1], [-2.3, 1], [-2.3, -1]].forEach(function (corner) {
				var x = state.X + ahead[0] * corner[0] + ahead[1] * corner[1];
				var z = state.Z + ahead[1] * corner[0] - ahead[0] * corner[1];
				var near = Math.abs(tracks.Near(track, x, z, state.Along).Offset);

				worst = Math.max(worst, near);
				met = near > wall - 0.3 ? met + 1 : met;
			});
		}

		expect(met).toBeGreaterThan(0);
		expect(worst).toBeLessThan(wall);
	});

	it('drives a car on its track: it stands on the road, nothing shakes, and the barrier holds it', async function () {
		var models = Elemenx.Service('Models');
		var tracks = Elemenx.Service('Tracks');
		var track = tracks.Make('drive', {Length: 1200, Corners: 9});
		var name = unique('track');

		models.Define(name, {URL: name, Asset: tracks.Asset(track), Fit: false});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var start = track.Start;

		scene.Add('location', {ID: 'place', Model: name, Size: 1});

		function frames (count, length) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += length || 33);
			}
		}

		frames(3);

		scene.Add('unit', {ID: 'car', Name: '', Size: 1.2, X: start.X, Y: start.Z, Z: start.Y, Vehicle: {Kind: 'car', Track: track, Heading: start.Heading}});
		scene.Control('car');

		frames(40);

		var car = inner.Objects.car;
		var lift = inner.Ground.Field.Lift || 0;

		/* On the road as the model has it. */
		expect(car.World[1]).toBeCloseTo(tracks.Under(track, car.Car.X, car.Car.Z).Height + lift, 1);

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

		/* Past the barrier it does not go. */
		car.Car.X = start.X + Math.cos(start.Heading) * 60;
		car.Car.Z = start.Z - Math.sin(start.Heading) * 60;

		frames(3);

		expect(Math.abs(tracks.Near(track, car.Car.X, car.Car.Z).Offset)).toBeLessThanOrEqual(track.Width / 2 + track.Margin);

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

	it('flies a ship by a body: the keys fly it, the mouse only looks, and the model goes with the view', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="star" Kind="star" Mass="1"><GameObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></GameObject></GameScene>');
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
		mounted.Host.$Element().querySelector('.elemenx-game-scene').focus();

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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="star" Kind="star" Mass="1"><GameObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></GameObject></GameScene>');
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
		var models = Elemenx.Service('Models');
		var graphics = Elemenx.Service('Graphics3D');
		var name = unique('windows');
		var box = function (x, y, z) {
			var made = graphics.Box({Width: 0.2, Height: 0.2, Depth: 0.2});

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

		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
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

	it('looks ahead from the seat of a car while it moves, but while the right button is held', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="low" Person="first" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="400" Height="0" Seed="test" /></GameScene>');
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

		falling.Body = Elemenx.Service('Graphics3D').Rotation([1, 0, 0], 0.2);
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="900" Height="0" Seed="test" /></GameScene>');
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
		var models = Elemenx.Service('Models');
		var tracks = Elemenx.Service('Tracks');
		var name = unique('hull');

		models.Define(name, {URL: name, Asset: tracks.Asset(tracks.Make('hull', {Length: 200, Corners: 6})), Fit: false});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="star" Kind="star" Mass="1"><GameObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></GameObject></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var engine = mounted.Space.Engine();
		var identity = Elemenx.Service('Graphics3D').Identity();
		var box = engine.BoxOf({Pieces: [{Rest: identity, Geometry: {Positions: [-50, 0, -50, 50, 0, -50, 50, 0, 50, -50, 0, 50]}}, {Rest: identity, Geometry: {Positions: [-1, 0, -2, 1, 1, 2]}}]});

		expect(box.Low).toEqual([-1, 0, -2]);
		expect(box.High).toEqual([1, 1, 2]);
	});

	it('hangs a wheel on its spring: it goes down as far as the spring has opened, in the size of the car', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var engine = mounted.Space.Engine();
		var car = {Values: {Vehicle: {}}, Size: 2, Car: {Spin: 0, Steer: 0}, Strokes: [0.1, 0, 0, -0.04]};
		var left = engine.WheelTurn(car, {Middle: [1, 0.3, 1], Front: true, Corner: 0});
		var right = engine.WheelTurn(car, {Middle: [1, 0.3, 1], Front: false, Corner: 3});

		expect(left[13]).toBeCloseTo(-0.05, 6);
		expect(right[13]).toBeCloseTo(0.02, 6);
	});

	it('draws glass last, through it what is behind, and throws no shadow of it', async function () {
		var models = Elemenx.Service('Models');
		var tracks = Elemenx.Service('Tracks');
		var track = tracks.Make('glass', {Length: 400, Corners: 6});
		var asset = tracks.Asset(track);
		var name = unique('glassy');

		asset.Materials.push(Object.assign({}, asset.Materials[1], {Name: 'Window', Alpha: 'BLEND', Transmission: 1, BaseColor: [0, 0, 0, 0.25], DoubleSided: true}));
		asset.Materials.push(Object.assign({}, asset.Materials[1], {Name: 'Leaves', Alpha: 'BLEND', Transmission: 0, DoubleSided: true}));

		asset.Meshes[0][0].Material = asset.Materials.length - 2;
		asset.Meshes[0][1].Material = asset.Materials.length - 1;

		models.Define(name, {URL: name, Asset: asset, Fit: false});

		await new Promise(function (done) {
			models.Load(name, done);
		});

		var mounted = await mount('<GameScene Paused="true" Quality="medium" (ready)="Ready"><GameObject ID="star" Kind="star" Mass="1"><GameObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></GameObject></GameScene>');
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

			engine.Frame(now += 33);
		}

		var last = drawn.slice(-7);
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
		var sunny = await mount('<GameScene Paused="true" Quality="medium" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="high" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var graphics = Elemenx.Service('Graphics3D');
		var shaders = scene.LightingShaders(graphics);
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var identity = graphics.Identity();

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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var graphics = Elemenx.Service('Graphics3D');
		var skinned = scene.Shaders(graphics).Skinned;
		var from = skinned.indexOf('mat4 joint(');
		var to = skinned.indexOf('void main()');
		var size = 0.5;
		var pivot = [2, 0, 0];

		/* A joint at rest at pivot, in a model of half size: first as it was bound, then turned a right angle round itself. */
		function line (turn) {
			var m = graphics.Multiply(graphics.Translation(pivot[0] * size, pivot[1] * size, pivot[2] * size), graphics.Multiply(graphics.Scaling(size, size, size), graphics.Multiply(turn, graphics.Translation(-pivot[0], -pivot[1], -pivot[2]))));

			return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14]];
		}

		var palette = renderer.Texture({Width: 3, Height: 3, Data: new Float32Array(line(graphics.Identity()).concat(line(graphics.Rotation([0, 0, 1], Math.PI / 2)), [pivot[0], pivot[1], pivot[2], 0, 0, 0, 0, 0, 0, 0, 0, 0]))}, {Float: true, Nearest: true});
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
		var mounted = await mount('<GameScene Paused="true" Quality="high" (ready)="Ready"><GameObject ID="star" Kind="star" Mass="1"><GameObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></GameObject></GameScene>');
		var inner = mounted.Space.Scene();
		var engine = mounted.Space.Engine();
		var now = performance.now() + 100;
		var told = null;
		var end = engine.PostEnd;
		var graphics = Elemenx.Service('Graphics3D');

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
		expect(graphics.Vectors.Length(told.Sun)).toBeCloseTo(1, 5);
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
			var length = graphics.Vectors.Length(mouth.uFrom);
			var way = graphics.Vectors.Scale(mouth.uFrom, 1 / length);
			var side = graphics.Vectors.Normalize(graphics.Vectors.Cross(way, [0, 1, 0]));

			engine.SunEye = function () {
				return shut;
			};
			engine.NearestStar = function () {
				return {At: graphics.Vectors.Add(inner.Eye, graphics.Vectors.Add(graphics.Vectors.Scale(way, 100 * Math.cos(turned)), graphics.Vectors.Scale(side, 100 * Math.sin(turned)))), Size: 1, Veil: reach};
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
		var level = graphics.Vectors.Normalize(mouth.uSide);

		hero.Ship.Up = graphics.Vectors.Normalize([hero.Ship.Right[0] + hero.Ship.Up[0], hero.Ship.Right[1] + hero.Ship.Up[1], hero.Ship.Right[2] + hero.Ship.Up[2]]);
		hero.Ship.Right = graphics.Vectors.Normalize(graphics.Vectors.Cross(hero.Ship.Up, hero.Ship.Ahead));

		frame();

		expect(Math.abs(graphics.Vectors.Dot(graphics.Vectors.Normalize(mouth.uSide), level))).toBeLessThan(0.9);

		var side = graphics.Vectors.Normalize(mouth.uSide);

		hero.Values.Vehicle.Mounts[0].Twist = 90;

		frame();

		expect(Math.abs(graphics.Vectors.Dot(graphics.Vectors.Normalize(mouth.uSide), side))).toBeLessThan(0.05);

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

			for (var i = 0; i < 4; i++) {
				frame();

				shut.push(engine.SunEye());

				engine.Renderer.GL.finish();

				/* A fence of WebGL says it passed only after the page gave way. */
				await new Promise(function (done) {
					setTimeout(done, 0);
				});
			}
		}

		engine.PostEnd = post;
		engine.Renderer.GL.getBufferSubData = data;

		expect(read).toBeGreaterThan(0);
		expect(shut.some(function (value) {
			return Math.abs(value - 0.3) < 0.001;
		})).toBe(true);
		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);

		/* A word of its own may know a wheel by its material; the word of all cars looks at the names of the nodes only. */
		var wheel = {ID: 'tyre', Node: 0, Rest: graphics.Identity(), Material: {Name: 'Tyre'}, Geometry: {Positions: [0.8, 0.3, 1.5, 0.8, 0.6, 1.5, 0.8, 0.3, 1.8]}};
		var worn = {Asset: {Nodes: [{Name: 'Object_1', Parent: -1}]}, Pieces: [wheel]};

		expect(engine.WheelsOf(worn, {}).tyre).toBe(undefined);
		expect(engine.WheelsOf(worn, {Wheels: 'Tyre'}).tyre.Corner).toBe(0);

		engine.Renderer.Draw = draw;

		expect(mounted.Space.Shaders(graphics).Star).toMatch(/limb\) \* 2\.4/);
		expect(mounted.Space.LightingShaders(graphics).Shafts).toMatch(/step\(uClear,/);
	});

	it('takes the sun out of a fog: no glare, no rays', async function () {
		var mounted = await mount('<GameScene Paused="true" Quality="low" Weather="clear" Front="0.01" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="star" Kind="star" Mass="1"><GameObject ID="world" Kind="planet" Radius="6371" Mass="1" Distance="1" /></GameObject></GameScene>');
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="20" DayOfYear="100" /></GameScene>');
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="medium" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="23" /></GameScene>');
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 100;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" Quality="low" (ready)="Ready"></GameScene>');
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
		var glow = Elemenx.Service('Graphics3D');

		expect(made.uBeacon).toBeGreaterThan(0);
		expect(cosmosSource).not.toContain('pow(near, 180.0)');
		expect(cosmosSource).not.toContain('pow(near, 900.0) * 3.0');
		expect(glow.Vectors.Length(made.uShine)).toBeCloseTo(1, 5);

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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="22" Latitude="60" DayOfYear="100" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="0" Latitude="45" DayOfYear="1" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" DayOfYear="80" MoonPhase="0.25" /></GameScene>');
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
		expect(gameSceneSource).toContain('tint * disk * (1.0 - smoothstep(0.0, 0.25, moonShape))');

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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" FreeLook="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="50" DayOfYear="172" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="60" DayOfYear="121" /></GameScene>');
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /><GameObject ID="day" Kind="sun" Time="0" Latitude="45" /></GameScene>');
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var loop = inner.Loop;

		loop.Stop();

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

	it('leaves the pointer alone while the mouse is captured: the browser refuses to hold both', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"></GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;
		var i;

		scene.Add('ground', {ID: 'land', Size: 200, Height: 1, Water: 0, Seed: 'test'});
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
		var terrain = Elemenx.Service('Terrain');
		var mounted = await mount('<GameScene Quality="high" Paused="true" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="100" Height="1" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="hero" Kind="unit" X="0" Y="0" />' +
		'</GameScene>');
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
		expect(gameSceneSource).toContain("'	float gloss = base.a < 0.99 ? 0.0 : max(");
		expect(gameSceneSource).toContain('base.a < 0.5 ? base.a : 1.0 - gloss * 0.45');
		expect(gameSceneSource).toContain("'	if (dot(n, v) < -0.3) n = -n;',");
		expect(gameSceneSource).not.toContain('gl_FrontFacing');

		/* The dark of a sun in view fades as it leaves the frame, it does not stop at a line. */
		expect(lightingSource).toContain('(1.0 - smoothstep(0.42, 0.95, max(past.x, past.y)))');
		expect(lightingSource).not.toContain('step(abs(uSpot.x - 0.5), 0.75)');

		/* Nothing mirrors by a body: the smoothed edge of one is no gloss. */
		expect(lightingSource).toContain('gloss < 0.02 || near < 0.5');

		/* A location has floors over floors: no map of the light of a field holds it, and with none it would lose the sky. */
		inner.Ground.Field = terrain.FromModel([{Positions: [-30, 0, -30, 30, 0, -30, 30, 0, 30, -30, 0, 30], Indices: [0, 2, 1, 0, 3, 2]}]);

		expect(inner.Ground.Field.Whole).toBe(true);
		expect(engine.FieldOn()).toBe(false);
	});

	it('starts what is added anew from what it is told, not from where its namesake walked', async function () {
		var mounted = await mount('<GameScene Paused="true" (ready)="Ready"><GameObject ID="land" Kind="ground" Size="100" Height="1" Seed="test" /></GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="300" Height="10" Water="0.1" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="oak" Kind="oak" X="10" Y="10" />' +
			'<GameObject ID="hero" Kind="knight" X="0" Y="0" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene Quality="medium" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="96" Height="2" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="tiles" Kind="rocks" Shapes="rock" Grid="12" MinHeight="-10" MaxSlope="1" />' +
			'<GameObject ID="blades" Kind="grass" Shapes="bush" Reach="20" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="192" Height="20" Water="0.2" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="woods" Kind="forest" Density="3" Seed="a" Cover="1" MaxHeight="7" />' +
			'<GameObject ID="blades" Kind="grass" />' +
		'</GameScene>');
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

	it('draws the model of a file by the same API: fetched, lit, moved and played', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var library = Elemenx.Service('Models');
		var mounted;
		var scene;
		var inner;
		var engine;
		var gl;

		library.Define('test-column', {URL: address, Type: 'unit', Clips: {walk: 'Bend', attack: 'Spin'}});

		mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="300" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="hero" Kind="unit" Model="test-column" X="0" Y="0" />' +
			'<GameObject ID="other" Kind="unit" Model="test-column" X="4" Y="0" />' +
		'</GameScene>');

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
		var library = Elemenx.Service('Models');
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="96" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="posts" Kind="forest" [shapes]="Shapes" Density="2" Cover="1" MinHeight="-100" MaxSlope="1" />' +
		'</GameScene>', {Shapes: [address]});
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
		var mounted = await mount('<GameScene Quality="ultra" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="200" Height="6" Water="0.1" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" Elevation="30" />' +
			'<GameObject ID="keep" Kind="house" X="0" Y="0" />' +
		'</GameScene>');
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

		expect(scene.Graphics()).toMatchObject({Level: 'ultra', Post: true, Cascades: 2, Bounce: true, Occlusion: 1});
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

	it('makes a whole land of one attribute, and a village with its roads that nothing grows on', async function () {
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="288" Height="24" Water="0.15" Seed="test" Biome="desert" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="oasis" Kind="village" X="10" Y="10" Houses="6" Seed="a" />' +
		'</GameScene>');
		var scene = mounted.Space;
		var inner = scene.Scene();
		var engine = scene.Engine();
		var terrain = Elemenx.Service('Terrain');
		var field;

		await waitFor(function () {
			engine.Frame(performance.now() + 100);

			return inner.Ground && inner.Ground.Field.Roads && scene.Sown().Squares > 0 && scene.Sown().Waiting === 0;
		}, 8000);

		field = inner.Ground.Field;

		expect(field.Palette).toEqual(Elemenx.Service('Biomes').Get('desert').Ground);
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
		expect(terrain.Paint(field, field.Roads[0][0][0], field.Roads[0][0][1], 3, 0)).toEqual(Elemenx.Service('Biomes').Get('desert').Ground.Road);

		/* A land of another name is another land. */
		scene.Change('land', {Biome: 'alien'});

		await waitFor(function () {
			engine.Frame(performance.now() + 200);

			return inner.Ground && inner.Ground.Field.Palette === Elemenx.Service('Biomes').Get('alien').Ground;
		}, 3000);

		expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
	});

	it('casts the shadows of what stands on a ground, or none when told', async function () {
		var mounted = await mount('<GameScene (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" Elevation="30" Azimuth="90" />' +
			'<GameObject ID="keep" Kind="castle" X="0" Y="0" />' +
		'</GameScene>');
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

		/* The view comes to rest and the finest squares of the ground are made: until no more come. */
		for (i = 0; i < 200 && steady < 4; i++) {
			scene.Engine().Frame(performance.now() + (at += 1000));

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
		var mounted = await mount('<GameScene Quality="low" (ready)="Ready">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="4" Water="0" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" Elevation="1" Azimuth="90" />' +
		'</GameScene>');
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
		var mounted = await mount('<GameScene (ready)="Ready" (arrive)="Arrived">' +
			'<GameObject ID="land" Kind="ground" Size="400" Height="30" Water="0.3" Seed="test" />' +
			'<GameObject ID="sun" Kind="sun" />' +
			'<GameObject ID="walker" Kind="unit" X="0" Y="0" Speed="10" />' +
			'<GameObject ID="oak" Kind="tree" X="20" Y="0" />' +
		'</GameScene>', {
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

	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		Use(['service:Gltf', 'service:Fbx', 'service:Models', 'service:Graphics3D', 'service:Sigils', 'service:Tracks', 'service:Physics']);

		gltf = Elemenx.Service('Gltf');
		models = Elemenx.Service('Models');
		graphics = Elemenx.Service('Graphics3D');
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
		var turned = graphics.Apply(pose[crate.ID], [0.2, 0, 0]);
		var still = graphics.Apply(models.Pose(model, 'Spin', 0)[crate.ID], [0.2, 0, 0]);

		expect(graphics.Vectors.Distance(turned, still)).toBeGreaterThan(0.1);

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
		var graphics = Elemenx.Service('Graphics3D');
		var binds = [[graphics.Identity(), graphics.Translation(0, -2, 0)]];
		var rest = {5: graphics.Identity(), 6: graphics.Translation(0, 2, 0)};
		var geometry = {Positions: new Float32Array([0, 2.1, 0, 0.1, 2.1, 0, 0, 2.2, 0]), Normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), Indices: new Uint16Array([0, 1, 2])};
		var held = models.Held(geometry, graphics.Identity(), binds, {Skins: [{Joints: [5, 6]}]}, rest);

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
		var graphics = Elemenx.Service('Graphics3D');

		/* A node of a file says which of its lamps stands there. */
		expect(gltf.Node({name: 'Lamp', extensions: {KHR_lights_punctual: {light: 1}}}).Light).toBe(1);
		expect(gltf.Node({name: 'Plain'}).Light).toBe(-1);

		function plate (x, emissive, skin) {
			return {Rest: graphics.Translation(x, 2, 0), Skin: skin === undefined ? -1 : skin, Material: {Emissive: emissive}, Geometry: {Positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 1]), Indices: new Uint16Array([0, 1, 2])}};
		}

		var asset = {Lights: [{Type: 'point', Color: [1, 0, 0], Intensity: 100, Range: 12, Outer: 0.7}, {Type: 'spot', Color: [0, 1, 0], Intensity: 10, Range: 0, Outer: 0.5}, {Type: 'directional', Color: [1, 1, 1], Intensity: 3}], Nodes: [{Light: 0}, {Light: 1}, {Light: 2}, {Light: -1}], Images: []};
		var rest = [graphics.Translation(1, 2, 3), graphics.Translation(4, 5, 6), graphics.Identity(), graphics.Identity()];
		var lamps = models.BuiltLamps(asset, [plate(50, [0, 0, 2]), plate(-50, [0.01, 0, 0]), plate(0, [0, 2, 0], 0)], rest, graphics.Identity(), 240);
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
		expect(models.BuiltLamps({Lights: [], Nodes: [], Images: []}, [plate(1, [2, 2, 2]), plate(1.2, [2, 2, 2]), plate(120, [2, 2, 2])], [], graphics.Identity(), 240).length).toBe(2);
	});

	it('moves the flesh that hangs on twist bones beside a limb, and brings the bone to where the limb bends', function () {
		var graphics = Elemenx.Service('Graphics3D');

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
		var hand = models.NodeWorld(asset, models.Sample(asset, null, 0), graphics.Identity())[8];
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
			var world = models.NodeWorld(asset, models.Sample(asset, time === null ? null : made, time), graphics.Identity())[index];

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
		var graphics = Elemenx.Service('Graphics3D');

		models.Define('test-bone', {URL: 'test.glb', Clips: {walk: 'Bend'}});

		models.Recipes['test-bone'].Asset = parsed();

		var model = models.Make('test-bone');
		var name = model.Asset.Nodes[model.Asset.Skins[0].Joints[1]].Name;

		expect(models.BoneMatrix(model, name, 'walk', 0).length).toBe(16);
		expect(models.BoneMatrix(model, name, 'walk', 0.5)).not.toEqual(models.BoneMatrix(model, name, 'walk', 0));
		expect(models.BoneMatrix(model, 'HandR', 'walk', 0)).toBe(null);
		expect(models.GripTurn(model, 'HandR', name)).toEqual(graphics.Identity());

		/* It lies in the palm: most of the way from the wrist to the middle finger; a hand with no fingers keeps its place. */
		function joint (name, parent, x, children) {
			return {Name: name, Parent: parent, Translation: [x, 0, 0], Rotation: [0, 0, 0, 1], Scale: [1, 1, 1], Children: children};
		}

		var fingers = {Clips: {}, Fit: graphics.Identity(), Bones: {HandQ: 0}, Asset: {Nodes: [joint('hand', -1, 1, [1]), joint('middle.01', 0, 1, [])], Scene: [0], Skins: [], Animations: []}};

		expect(models.Palm(fingers, 'HandQ', '', graphics.Translation(1, 0, 0))[12]).toBeCloseTo(1.8, 5);
		expect(models.Palm({Bones: {}}, 'HandQ', '', graphics.Translation(1, 0, 0))[12]).toBe(1);

		/* A thing in a hand lies as the two bones stand at rest, X from the one to the other, and then turns with the first alone. */
		var first = model.Asset.Nodes[model.Asset.Skins[0].Joints[0]].Name;
		var hand = models.BoneMatrix(model, first, '', 0);
		var other = models.BoneMatrix(model, name, '', 0);
		var turn = models.GripTurn(model, first, name);
		var lying = graphics.Multiply(models.Grip(hand, null), turn);
		var aimed = models.Grip(hand, other);

		expect(lying[0]).toBeCloseTo(aimed[0], 5);
		expect(lying[1]).toBeCloseTo(aimed[1], 5);
		expect(lying[2]).toBeCloseTo(aimed[2], 5);
		expect(models.GripTurn(model, first, name)).toBe(turn);

		/* A bone of a skeleton of a hundredth: the thing does not shrink with it. */
		var small = graphics.Multiply(graphics.Translation(1, 2, 3), graphics.Scaling(0.01, 0.01, 0.01));
		var kept = models.Grip(small, null);

		expect(kept[0]).toBeCloseTo(1, 5);
		expect(kept[12]).toBe(1);

		/* Between two hands: X from the one to the other, Y up, whatever way the hand is turned. */
		var aimed = models.Grip(graphics.Multiply(graphics.Translation(0, 1, 0), graphics.Rotation([1, 0, 0], 1.2)), graphics.Translation(0, 1, 2));

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
		Use(['service:Biomes', 'service:Terrain', 'service:Models', 'service:Graphics3D']);
	});

	it('lays out the same village of the same seed, on what is level and dry, moved there if it must', function () {
		var biomes = Elemenx.Service('Biomes');
		var models = Elemenx.Service('Models');
		var field = Elemenx.Service('Terrain').Flat({Size: 400, Height: 30, Water: 0.3, Seed: 'test'});
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
		var biomes = Elemenx.Service('Biomes');

		biomes.Define('test-land', {Ground: {Low: [1, 0, 0]}, Scatter: [], Grass: null});

		expect(biomes.Has('test-land')).toBe(true);
		expect(biomes.Get('test-land').Ground.Low).toEqual([1, 0, 0]);
		expect(biomes.Get('nothing')).toBe(null);
	});
});

describe('Contract: Models, the models of a game made of code', function () {
	var models;
	var graphics;

	beforeAll(async function () {
		await loadElemenx();
	});

	beforeEach(function () {
		Use(['service:Models', 'service:Graphics3D']);

		models = Elemenx.Service('Models');
		graphics = Elemenx.Service('Graphics3D');
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
		var forward = graphics.Apply(models.Pose(knight, 'walk', 0)['leg-l'], foot);
		var backward = graphics.Apply(models.Pose(knight, 'walk', 0.4)['leg-l'], foot);
		var pose = models.Pose(knight, 'walk', 0);
		var fading = models.Pose(knight, 'idle', 0, {From: 'walk', FromTime: 0, Fade: 0});
		var fallen = models.Pose(knight, 'die', 1);

		/* The legs swing round the hips, one way and the other. */
		expect(forward[2]).toBeGreaterThan(0.1);
		expect(backward[2]).toBeLessThan(-0.1);

		/* The hip itself stays with the body. */
		expect(graphics.Vectors.Distance(graphics.Apply(pose['leg-l'], hip), graphics.Apply(pose.body, hip))).toBeLessThan(0.001);

		/* At the start of a fade it is the last clip. */
		expect(Array.from(fading['leg-l'])).toEqual(Array.from(pose['leg-l']));

		/* The head of a fallen one is near the ground, and stays there. */
		expect(graphics.Apply(fallen.head, [0, 0.9, 0])[1]).toBeLessThan(0.25);
		expect(models.Pose(knight, 'die', 5).head).toEqual(fallen.head);
		expect(models.Length(knight, 'die')).toBe(1);
	});

	it('spins what turns with no end, and leaves a model of one piece still', function () {
		var mill = models.Make('windmill');

		expect(models.Pose(mill, 'idle', 1).sails).not.toEqual(models.Pose(mill, 'idle', 2).sails);
		expect(models.Pose(models.Make('pine'), 'idle', 1).body).toEqual(graphics.Identity());
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
		expect(models.Names({Type: 'prop'})).toEqual(['test-crate']);
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

		Use(['service:Terrain', 'service:Graphics3D']);

		terrain = Elemenx.Service('Terrain');
	});

	it('has continuous heights, chunks with a skirt, and ways that keep out of the sea', function () {
		var field = terrain.Flat({Size: 600, Height: 40, Water: 0.35, Seed: 'contract'});
		var chunk = field.Chunk(0, 0, 100, 8);
		var wet = null;
		var x;
		var y;
		var way;

		expect(Math.abs(field.Height(10, 10) - field.Height(10.01, 10))).toBeLessThan(0.05);
		expect(chunk.Positions.length / 3).toBe(81 + 32);
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
		var graphics = Elemenx.Service('Graphics3D');
		var noise = graphics.Noise();
		var direction = graphics.Vectors.Normalize([0.3, 0.8, -0.5]);
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
			n = graphics.Vectors.Cross(graphics.Vectors.Subtract(b, a), graphics.Vectors.Subtract(c, a));

			expect(graphics.Vectors.Dot(n, graphics.Vectors.Add(a, patch.Center)), 'face ' + face).toBeGreaterThan(0);
		}
	});
});
