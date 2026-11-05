import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('VehiclesHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="high" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
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

/* A piece of a model of a file: its triangles (corners [x, y, z]), where it rests as it is. */
function piece (id, corners, material) {
	var positions = [];

	corners.forEach(function (corner) {
		positions.push(corner[0], corner[1], corner[2]);
	});

	return {ID: id, Skin: -1, Rest: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], Material: {Name: material}, Geometry: {Positions: positions, Indices: corners.map(function (corner, index) {
		return index;
	})}};
}

/* A square of two triangles at z, from low to high, facing -z (its corners turning as the normal tells). */
function square (z, low, high) {
	return [[low[0], low[1], z], [low[0], high[1], z], [high[0], low[1], z], [high[0], low[1], z], [low[0], high[1], z], [high[0], high[1], z]];
}

describe('Contract: a boat on the sea of a Scene', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneWaves', 'service:SceneModels']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('floats on the waves of the sea, goes under its motor and its rudder, and leaves foam behind it', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var bursts = [];
		var burst = scene.Burst;
		var now = performance.now() + 100;
		var i;

		scene.Burst = function (type) {
			bursts.push(type);

			return burst.apply(this, arguments);
		};

		try {
			/* A sea: the ground of the mount is low, its water over it. */
			scene.Change('land', {Height: 1, Water: 0.9});

			for (i = 0; i < 4; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			scene.Add('unit', {ID: 'boat', Name: '', Size: 5, X: 0, Y: 0, Vehicle: {Kind: 'boat'}});
			scene.Control('boat');

			inner.Ground.Keys = {KeyW: true};

			for (i = 0; i < 90; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			var boat = inner.Objects.boat;
			var sea = Elemenx.Service('SceneWaves').At(inner.Ground.Waves, boat.World[0], boat.World[2], inner.Seconds).Height;

			expect(boat.Boat.Forward).toBeGreaterThan(5);
			expect(boat.World[2]).toBeGreaterThan(5);
			expect(Math.abs(boat.World[1] - (sea - 0.35))).toBeLessThan(0.6);
			expect(bursts).toContain('wake');

			inner.Ground.Keys = {KeyW: true, KeyA: true};

			for (i = 0; i < 40; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			expect(boat.Boat.Heading).toBeGreaterThan(0.3);
		}
		finally {
			scene.Burst = burst;
		}
	});
});

describe('Contract: the mirrors of a car of a file, in the shape of their glass', function () {
	var engine;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(async function () {
		resetDOM();

		engine = (await mount()).Engine();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * Regression: a mirror of a car was a pane of its own, a rectangle over the mirror of the model, of a quarter of the
	 * screen; the car of a file with no rear window showed its engine in its inner mirror, black.
	 */
	it('cuts the glass of each mirror out of the model, and sees as a camera where the body stands in the way of what it shows', function () {
		var mirror = {At: [0, 1, 0.5], Normal: [0, 0, -1], Width: 0.2, Height: 0.1, Seat: [0, 1, 0]};
		var glass = piece('glass', square(0.5, [-0.08, 0.96], [0.08, 1.04]), 'Body');
		var far = piece('far', square(0.5, [0.5, 0.96], [0.6, 1.04]), 'Body');
		var wall = piece('wall', square(-1, [-2, 0], [2, 2]), 'Body');
		var window = piece('window', square(-1, [-2, 0], [2, 2]), 'RearWindow');
		var walled = {Asset: {}, Pieces: [glass, far, wall]};
		var open = {Asset: {}, Pieces: [piece('glass', square(0.5, [-0.08, 0.96], [0.08, 1.04]), 'Body'), window]};
		var told = {Asset: {}, Pieces: [piece('glass', square(0.5, [-0.08, 0.96], [0.08, 1.04]), 'Body'), piece('wall', square(-1, [-2, 0], [2, 2]), 'Body')]};
		var shapes = {Asset: null, Pieces: []};
		var vehicle = {Mirrors: [mirror]};

		engine.MirrorsOf(walled, vehicle);

		/* The glass: a piece of its own with the index of its mirror; what lies off its pane stays in the body. */
		expect(walled.Pieces.map(function (each) {
			return each.ID + (each.Mirror !== undefined ? ':' + each.Mirror : '');
		})).toEqual(['far', 'wall', 'glass-mirror-0:0']);
		expect(walled.Pieces[2].Geometry.Indices.length).toBe(6);
		expect(vehicle.MirrorShapes[0]).toMatchObject({Glass: true, Camera: true});
		expect(vehicle.MirrorShapes[0].Rear).toBeCloseTo(1.5, 5);

		/* Through the glass of a rear window the mirror sees: no camera. Told: a mirror whatever stands in the way. */
		engine.MirrorsOf(open, {Mirrors: [mirror]});
		engine.MirrorsOf(told, {Mirrors: [Object.assign({}, mirror, {View: 'mirror'})]});

		expect(open.MirrorShapes[0]).toMatchObject({Glass: true, Camera: false});
		expect(told.MirrorShapes[0]).toMatchObject({Glass: true, Camera: false});

		/* A model of shapes has no glass to cut: its mirror stays a pane. */
		engine.MirrorsOf(shapes, {Mirrors: [mirror]});

		expect(shapes.MirrorShapes).toBeUndefined();
	});
});
