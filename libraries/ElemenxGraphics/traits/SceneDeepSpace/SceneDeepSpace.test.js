import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (mark, check) {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('DeepHost'), {$Template: '<div style="width: 400px; height: 300px"><Scene Paused="true" Quality="low" Labels="false" [hoverMark]="Mark" [hoverCheck]="Check" (ready)="Ready" (hover)="Hovered">' +
		'<SceneObject ID="vega" Kind="star" Temperature="9600" />' +
		'<SceneObject ID="hole" Kind="blackhole" Name="Gargantua" Distance="14" Mass="40" />' +
		'<SceneObject ID="gate" Kind="wormhole" Distance="7" Leads="Kepler-442" Cosmos="galaxy" />' +
		'<SceneObject ID="halley" Kind="comet" Distance="5" Eccentricity="0.8" />' +
		'<SceneObject ID="beacon" Kind="quasar" Azimuth="70" Elevation="18" />' +
		'<SceneObject ID="pebble" Kind="planetoid" Distance="2.6" Radius="140" />' +
		'<SceneObject ID="hidden" Kind="comet" Distance="9" Interactive="false" />' +
	'</Scene></div>', Mark: mark === undefined ? {Look: 'ring', Cursor: 'pointer'} : mark, Check: check || null, Ready: function (space) {
		ready = space;
	}, Hovered: function (event) {
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

describe('Contract: the deep space of a Scene: black holes, wormholes, comets, quasars and planetoids, pointed at and picked', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
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

	it('makes each of its kind, sized and told: the horizon of a black hole of its mass, where a wormhole leads, a planetoid as a small moon', async function () {
		var made = await mount();
		var scene = made.Scene;
		var hole;

		frames(scene, 3);

		hole = scene.Describe('hole');

		expect(hole.Kind).toBe('blackhole');
		/* 2GM/c²: 2.95 km a Sun. */
		expect(hole.Horizon).toBeCloseTo(118.1, 0);
		expect(hole.Innermost).toBeCloseTo(hole.Horizon * 3, 5);
		expect(scene.Scene().Objects.hole.Size).toBeGreaterThan(0);

		/* Regression: one of millions of Suns (the middle of a galaxy) was a hundred units wide compressed, over the orbits round it. */
		scene.Add('blackhole', {ID: 'giant', Traits: {BlackHole: {Mass: 4.8e6}, Orbit: {Distance: 40, Unit: 'AU'}}});

		frames(scene, 2);

		expect(scene.Scene().Objects.giant.Size).toBeLessThan(20);
		expect(scene.Scene().Objects.giant.Size).toBeGreaterThan(scene.Scene().Objects.hole.Size);

		expect(scene.Describe('gate')).toMatchObject({Kind: 'wormhole', Leads: 'Kepler-442'});
		expect(scene.Describe('halley').Kind).toBe('comet');
		expect(scene.Describe('pebble').Radius).toBeCloseTo(140, 0);

		/* A quasar stands on the sky in its direction, beyond everything. */
		expect(scene.Scene().Objects.beacon.Way[1]).toBeCloseTo(Math.sin(18 * Math.PI / 180), 3);
	}, 30000);

	it('draws the light bent round a black hole and through a wormhole, each a ray followed through the pull', async function () {
		var made = await mount();
		var scene = made.Scene;
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var lenses = [];

		frames(scene, 3);

		scene.FocusOn('hole');

		frames(scene, 60);

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uHorizon !== undefined)
				lenses.push(uniforms);

			return draw.apply(this, arguments);
		};

		/* The lens is compiled behind the scene: nothing bends light until it is ready. */
		try {
			await waitFor(function () {
				frames(scene, 1);

				return lenses.length > 0;
			}, 60000);
		}
		finally {
			renderer.Draw = draw;
		}

		expect(lenses.some(function (one) {
			return one.uKind === 0 && one.uDisk[1] === 14 && one.uReach > one.uHorizon * 20;
		})).toBe(true);
	}, 90000);

	/* The ring of the pointer was drawn in every scene, over the walker and the car too: a scene marks nothing unless asked. */
	it('marks nothing under the pointer and leaves the cursor as it is unless HoverMark asks; HoverCheck says what may be marked and how', async function () {
		var checked = [];
		var made = await mount('', function (object) {
			checked.push(object.ID);

			return object.ID === 'hole' ? {Look: 'outline', Color: '#ff0000', Cursor: 'crosshair'} : false;
		});
		var scene = made.Scene;
		var canvas = scene.$Element().querySelector('.elemenx-scene-canvas');
		var box;
		var spot;

		frames(scene, 3);

		scene.FocusOn('hole');

		frames(scene, 60);

		expect(scene.Engine().Mark('hover').Look).toBe('none');
		expect(scene.Engine().Mark('select').Look).toBe('outline');

		box = canvas.getBoundingClientRect();
		spot = scene.ToScreen('hole');

		scene.Scene().HoverAt = 0;

		scene.PointerMove({clientX: box.left + spot.X, clientY: box.top + spot.Y, pointerId: 1, target: canvas, preventDefault: function () {}});

		expect(checked).toContain('hole');
		expect(made.Told[made.Told.length - 1]).toMatchObject({ID: 'hole'});
		expect(scene.Engine().Mark('hover')).toMatchObject({Look: 'outline', Color: [1, 0, 0, 1], Cursor: 'crosshair'});
		expect(canvas.style.cursor).toBe('crosshair');

		/* What HoverCheck refuses is not marked at all: the pointer leaves. */
		scene.HoverCheck = function () {
			return false;
		};

		scene.Scene().HoverAt = 0;

		scene.PointerMove({clientX: box.left + spot.X + 1, clientY: box.top + spot.Y, pointerId: 1, target: canvas, preventDefault: function () {}});

		expect(scene.Scene().Hovering).toBe('');
		expect(canvas.style.cursor).toBe('');
	}, 30000);

	it('tells what the pointer comes over and leaves (hover), never what is not Interactive; the card of a black hole', async function () {
		var made = await mount();
		var scene = made.Scene;
		var canvas = scene.$Element().querySelector('.elemenx-scene-canvas');
		var box;
		var spot;

		frames(scene, 3);

		scene.FocusOn('hole');

		frames(scene, 60);

		box = canvas.getBoundingClientRect();
		spot = scene.ToScreen('hole');

		scene.Scene().HoverAt = 0;

		scene.PointerMove({clientX: box.left + spot.X, clientY: box.top + spot.Y, pointerId: 1, target: canvas, preventDefault: function () {}});

		expect(made.Told[made.Told.length - 1]).toMatchObject({ID: 'hole'});
		expect(canvas.style.cursor).toBe('pointer');

		scene.Scene().HoverAt = 0;

		scene.PointerMove({clientX: box.left + 2, clientY: box.top + 2, pointerId: 1, target: canvas, preventDefault: function () {}});

		expect(made.Told[made.Told.length - 1].ID).toBe('');

		scene.Select('hole');

		expect(scene.Card.Rows.map(function (row) {
			return row.Key;
		})).toEqual(expect.arrayContaining(['mass', 'horizon', 'innermost']));

		expect(scene.Engine().Pick(spot.X, spot.Y)).toBe('hole');

		frames(scene, 3);

		spot = scene.ToScreen('hidden');

		if (spot && spot.Visible)
			expect(scene.Engine().Pick(spot.X, spot.Y)).not.toBe('hidden');
	}, 30000);

	it('takes what flies into a mouth through it, out of the other mouth of its pair on the same way, once till it is out', async function () {
		var made = await mount();
		var scene = made.Scene;
		var engine = scene.Engine();
		var passed = [];
		var ship;
		var gate;
		var far;
		var exit;

		scene.Add('wormhole', {ID: 'far-gate', Distance: 20, Leads: 'back', To: 'gate'});
		scene.Change('gate', {To: 'far-gate'});
		scene.Add('fighter', {ID: 'ship', Parent: 'vega'});
		scene.$On('through', function (event) {
			passed.push(event.detail || event);
		});

		frames(scene, 3);

		ship = scene.Scene().Objects.ship;
		gate = scene.Scene().Objects.gate;
		far = scene.Scene().Objects['far-gate'];

		/* Coming into the gate from its +X side. */
		exit = engine.DeepPass(ship, [gate.World[0] + gate.Size * 0.5, gate.World[1], gate.World[2]]);

		expect(passed[0]).toMatchObject({ID: 'ship', Wormhole: 'gate', To: 'far-gate'});
		expect(exit[0]).toBeCloseTo(far.World[0] - far.Size * 1.2, 5);

		/* Out of the other mouth it is not taken back at once. */
		expect(engine.DeepPass(ship, exit)).toBe(null);
		expect(passed).toHaveLength(1);
	}, 30000);

	it('has the stars that are not of the main sequence: giants, dwarfs and what is left of a star, the beams of a pulsar sweeping round, the field of a magnetar', async function () {
		var made = await mount();
		var scene = made.Scene;
		var engine = scene.Engine();
		var inner = scene.Scene();
		var astronomy = Elemenx.Service('Astronomy');
		var drawn = [];
		var ready = engine.DrawReady;
		var later = [];
		var a;
		var b;

		/* Their classes, sizes and light. */
		expect(astronomy.Star({}).Class).toBe('G');
		expect(astronomy.Star({Type: 'giant', Mass: 1.2}).Class).toMatch(/^[KG]III$/);
		expect(astronomy.Star({Type: 'supergiant', Mass: 15, Temperature: 3600}).Class).toBe('MI');
		expect(astronomy.Star({Type: 'white-dwarf', Mass: 0.6})).toMatchObject({Class: 'DA'});
		expect(astronomy.Star({Type: 'white-dwarf', Mass: 0.6}).Radius).toBeCloseTo(0.015, 3);
		expect(astronomy.Star({Type: 'pulsar', Mass: 1.4}).Class).toBe('PSR');
		expect(astronomy.Star({Type: 'pulsar', Mass: 1.4}).Radius * 696000).toBeCloseTo(9.7, 0);
		expect(astronomy.Star({Type: 'brown-dwarf', Mass: 0.05, Temperature: 900}).Class).toBe('T');
		expect(astronomy.Star({Type: 'brown-dwarf', Mass: 0.05}).Luminosity).toBeLessThan(1e-4);

		['giant', 'supergiant', 'white-dwarf', 'brown-dwarf', 'neutron-star', 'pulsar', 'magnetar'].forEach(function (kind) {
			scene.Add(kind, {ID: kind, Traits: {Orbit: {Distance: 3, Unit: 'AU'}}, Parent: 'vega'});
		});

		frames(scene, 2);

		expect(scene.Describe('pulsar').Class).toBe('PSR');
		expect(scene.Describe('magnetar').Class).toBe('MAG');
		expect(inner.Objects.supergiant.Size).toBeGreaterThan(inner.Objects.giant.Size);
		expect(inner.Objects.giant.Size).toBeGreaterThan(inner.Objects.vega.Size);
		expect(inner.Objects.pulsar.Size).toBeLessThan(inner.Objects['white-dwarf'].Size);

		/* Regression: an orange giant burned out white as the Sun does; a brown dwarf is banded, dim and maroon. */
		/* Of the star graph of the library in the Star shader (its SunBurn). */
		expect(scene.Globed(scene.Shaders(Elemenx.Service('Renderer'))).Star).toMatch(/mix\(2\.4, 1\.1, clamp\(\w+warm \* 1\.5, 0\.0, 1\.0\)\)/);
		expect(scene.Shaders(Elemenx.Service('Renderer')).Star).toContain('uniform float uBands;');

		/* The magnetic axis of a pulsar turns round with it. */
		inner.Seconds = 0;
		a = engine.MagneticAxis('pulsar');
		inner.Seconds = 0.2;
		b = engine.MagneticAxis('pulsar');

		expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeGreaterThan(0.2);

		/* Seen from far, its disc a point: its two beams and the field of the magnetar drawn all the same. */
		inner.Camera.Position = [inner.Objects.pulsar.World[0], inner.Objects.pulsar.World[1], inner.Objects.pulsar.World[2] + 500];

		inner.Active.forEach(function (object) {
			if (object.ID !== 'pulsar' && object.ID !== 'magnetar')
				object.Hidden = true;
		});

		engine.DeepDraw([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], later, [1, 0, 0], [0, 1, 0], [1e-9, 1e30]);

		engine.DrawReady = function (mesh, program, uniforms) {
			drawn.push(uniforms);

			return true;
		};

		try {
			later.forEach(function (run) {
				run();
			});
		}
		finally {
			engine.DrawReady = ready;
		}

		expect(drawn.filter(function (one) {
			return one.uAxis && one.uLength > 0;
		}).length).toBe(4);
		expect(drawn.filter(function (one) {
			return one.uAxis2;
		}).length).toBe(1);
	});

	it('burns a star as its Blueprint says at each time: the prominences of the library rise and fall by a Curve of the Time, as much as its Activity', async function () {
		var made = await mount();
		var scene = made.Scene;
		var engine = scene.Engine();
		var inner = scene.Scene();
		var graph = scene.LibraryStar();
		var look = Elemenx.Service('Blueprints').Compile(graph);
		var told = [];
		var drawn = [];
		var ready = engine.DrawReady;
		var vega;
		var at;
		var later = [];

		expect(graph.type).toBe('star');

		/* Low at the start of its round, high a fifth of the way in; its Activity in its prominences and flares. */
		expect(look.Look({Activity: 2, Cycle: 40}, 0)).toMatchObject({Height: 0.75, Prominences: 2, Flares: 2, Count: 6});
		expect(look.Look({Activity: 2, Cycle: 40}, 8.8).Height).toBeCloseTo(1.55, 6);
		expect(look.Look({Activity: 2, Cycle: 40}, 48.8).Height).toBeCloseTo(1.55, 6);

		frames(scene, 2);

		/* Without one, as its trait says. */
		expect(engine.StarLook('vega')).toMatchObject({Parts: [1, 1, 1, 0], Shape: [5, 1, 3, 1], Tint: [1, 1, 1]});

		scene.Change('vega', {Traits: {Star: {Blueprint: graph, Parameters: {Activity: 2, Cycle: 40}, Flares: 0.5}}});

		frames(scene, 2);

		inner.Seconds = 8.8;
		at = engine.StarLook('vega');

		expect(at.Shape[1]).toBeCloseTo(1.55, 6);
		expect(at.Parts).toEqual([1, 2, 1, 0]);

		/* Its corona drawn so. */
		vega = inner.Objects.vega;
		inner.Camera.Position = [vega.World[0], vega.World[1], vega.World[2] + vega.Size * 20];

		inner.Active.forEach(function (object) {
			if (object !== vega)
				object.Hidden = true;
		});

		engine.DeepDraw([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], later, [1, 0, 0], [0, 1, 0], [1e-9, 1e30]);

		engine.DrawReady = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uShape)
				drawn.push(uniforms);

			return true;
		};

		try {
			later.forEach(function (run) {
				run();
			});
		}
		finally {
			engine.DrawReady = ready;
		}

		expect(drawn.length).toBe(1);
		expect(drawn[0].uShape[0]).toBe(6);
		expect(drawn[0].uShape[1]).toBeCloseTo(1.55, 6);
		expect(drawn[0].uParts[1]).toBeCloseTo(2 * drawn[0].uParts[0], 6);

		/* A graph that cannot be made is told once; the star burns as its trait says. */
		scene.$On('shader', function (event) {
			told.push(event.detail || event);
		});

		scene.Change('vega', {Traits: {Star: {Blueprint: {version: 1, type: 'star', name: 'broken', parameters: [], blocks: [], links: []}}}});

		frames(scene, 1);

		expect(engine.StarLook('vega').Shape).toEqual([5, 1, 3, 1]);
		expect(engine.StarLook('vega').Shape).toEqual([5, 1, 3, 1]);
		expect(told.filter(function (one) {
			return one.Kind === 'star';
		}).length).toBe(1);
	});

	/*
	 * Regression: its prominences went by the time times their speed; a speed of a Blueprint that changes threw them whole
	 * rounds at once, the longer the scene ran the more, and they flickered. Now their speed is added up a step at a time; the
	 * last of them comes and goes softly. Speed is a parameter of the star of the library (faster than before).
	 */
	it('moves its prominences on by their speed a step at a time, however the speed changes, faster as the Speed of its Blueprint says', async function () {
		var made = await mount();
		var scene = made.Scene;
		var engine = scene.Engine();
		var inner = scene.Scene();
		var graph = scene.LibraryStar();
		var look = Elemenx.Service('Blueprints').Compile(graph);
		var ready = engine.DrawReady;
		var phases = [];
		var vega;

		expect(graph.parameters.filter(function (one) {
			return one.key === 'Speed';
		})[0].value).toBeGreaterThan(1);
		expect(look.Look({Activity: 1, Cycle: 40, Speed: 6}, 0).Speed).toBeCloseTo(2 * look.Look({Activity: 1, Cycle: 40, Speed: 3}, 0).Speed, 6);

		scene.Change('vega', {Traits: {Star: {Blueprint: graph}}});

		frames(scene, 2);

		vega = inner.Objects.vega;
		inner.Camera.Position = [vega.World[0], vega.World[1], vega.World[2] + vega.Size * 20];

		inner.Active.forEach(function (object) {
			if (object !== vega)
				object.Hidden = true;
		});

		function drawAt (seconds, speed) {
			var later = [];

			vega.Traits.Star.Parameters = {Activity: 1, Cycle: 40, Speed: speed};
			inner.Seconds = seconds;

			engine.DeepDraw([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], later, [1, 0, 0], [0, 1, 0], [1e-9, 1e30]);

			engine.DrawReady = function (mesh, program, uniforms) {
				if (uniforms && uniforms.uShape)
					phases.push(uniforms.uPhase);

				return true;
			};

			try {
				later.forEach(function (run) {
					run();
				});
			}
			finally {
				engine.DrawReady = ready;
			}
		}

		drawAt(5000, 3);
		drawAt(5000.1, 3);
		drawAt(5000.2, 9);

		/* A tenth of a second at its speed, then a tenth at three times it: a little on each time, never a jump. */
		expect(phases.length).toBe(3);
		expect(phases[1] - phases[0]).toBeGreaterThan(0);
		expect(phases[1] - phases[0]).toBeLessThan(1);
		expect(phases[2] - phases[1]).toBeCloseTo((phases[1] - phases[0]) * 3, 1);
	});

	/* Regression: near where the two parts of the depth meet, the corona of a star was drawn in both, twice as bright, and its prominences flickered. */
	it('draws the corona of a star in one part of the depth only, wherever the parts meet', async function () {
		var made = await mount();
		var scene = made.Scene;
		var engine = scene.Engine();
		var inner;
		var vega;
		var far;
		var all;
		var split;
		var count = function (planes) {
			var later = [];

			engine.DeepDraw([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], later, [1, 0, 0], [0, 1, 0], planes);

			return later.length;
		};

		frames(scene, 2);

		inner = scene.Scene();
		vega = inner.Objects.vega;
		far = vega.Size * 20;
		inner.Camera.Position = [vega.World[0], vega.World[1], vega.World[2] + far];

		/* The star alone counted. */
		inner.Active.forEach(function (object) {
			if (object !== vega)
				object.Hidden = true;
		});

		all = count([1e-9, 1e30]);

		expect(all).toBeGreaterThan(0);

		/* The parts meet a little in front of the star and behind it, as close as the scene lets them (they share a ten-thousandth). */
		[0.99, 1.01, 0.9999, 1.0002].forEach(function (at) {
			split = far * at;

			expect(count([split, 1e30]) + count([1e-9, split * 1.0001])).toBe(all);
		});
	});
});
