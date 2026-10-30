import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

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

		Use(['GameScene', 'GameObject', 'GameLayer', 'GameTerrain']);
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
		expect(bright(pixel(scene, 4, 4))).toBeLessThan(40);
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
		var i;

		inner.Wanted = 70;
		inner.Distance = 70;
		inner.Pitch = 0.9;

		await waitFor(function () {
			return Object.keys(inner.Ground.Nodes).length > 6;
		}, 3000);

		/* The view comes to rest and the finest squares of the ground are made. */
		for (i = 0; i < 120; i++)
			light();

		shaded = light();

		scene.Shadows = false;

		lit = light();

		expect(gl.getError()).toBe(gl.NO_ERROR);
		expect(lit - shaded).toBeGreaterThan(1);
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
