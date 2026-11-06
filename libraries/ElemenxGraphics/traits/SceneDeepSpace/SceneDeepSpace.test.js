import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var told = [];
	var component = Elemenx.Component(unique('DeepHost'), {$Template: '<div style="width: 400px; height: 300px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready" (hover)="Hovered">' +
		'<SceneObject ID="vega" Kind="star" Temperature="9600" />' +
		'<SceneObject ID="hole" Kind="blackhole" Name="Gargantua" Distance="14" Mass="40" />' +
		'<SceneObject ID="gate" Kind="wormhole" Distance="7" Leads="Kepler-442" Cosmos="galaxy" />' +
		'<SceneObject ID="halley" Kind="comet" Distance="5" Eccentricity="0.8" />' +
		'<SceneObject ID="beacon" Kind="quasar" Azimuth="70" Elevation="18" />' +
		'<SceneObject ID="pebble" Kind="planetoid" Distance="2.6" Radius="140" />' +
		'<SceneObject ID="hidden" Kind="comet" Distance="9" Interactive="false" />' +
	'</Scene></div>', Ready: function (space) {
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
});
