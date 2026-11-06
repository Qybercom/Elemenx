import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (touched) {
	var ready = null;
	var component = Elemenx.Component(unique('RigidHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Quality="low" Labels="false" (ready)="Ready" (touch)="Touch">' +
		'<SceneObject ID="land" Kind="ground" Size="200" Height="6" Water="0" Seed="test" />' +
		'<SceneObject ID="day" Kind="sun" Time="12" Latitude="45" />' +
	'</Scene></div>', Ready: function (space) {
		ready = space;
	}, Touch: function (event) {
		touched.push(event);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

/* Frames of 1/30 s for some seconds. */
function frames (scene, seconds, now) {
	var count = Math.round(seconds * 30);
	var i = 0;

	while (i < count) {
		scene.Engine().Frame(now.At += 1000 / 30);

		i++;
	}
}

describe('Contract: Scene trait Rigid, solid things of a ground that fall and are knocked over', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('lets a crate fall onto the ground, tells the touch, and knocks it over by a push', async function () {
		var touched = [];
		var scene = await mount(touched);
		var now = {At: 1000};
		var field;
		var crate;
		var ground;

		frames(scene, 0.1, now);

		field = scene.Scene().Ground.Field;
		ground = field.Height(5, 5);

		scene.Add({ID: 'crate', Kind: 'rock', Values: {X: 5, Y: 5, Lift: 4}, Traits: {Rigid: {Shape: 'box', Size: [1, 1, 1], Bounce: 0}}});

		frames(scene, 0.3, now);

		crate = scene.Scene().Objects.crate;

		expect(crate.World[1]).toBeGreaterThan(ground + 1);
		expect(crate.World[1]).toBeLessThan(ground + 4);

		frames(scene, 3, now);

		crate = scene.Scene().Objects.crate;

		/* It lies on the ground, its base on it. */
		expect(Math.abs(crate.World[1] - field.Height(crate.Values.X, crate.Values.Y))).toBeLessThan(0.35);
		expect(touched.some(function (event) {
			return event.ID === 'crate' && event.With === null && event.Impulse > 0;
		})).toBe(true);

		expect(scene.Push('crate', [0, 0, 8], [crate.Values.X, crate.World[1] + 0.9, crate.Values.Y])).toBe(true);
		expect(scene.Push('nothing', [0, 1, 0])).toBe(false);

		frames(scene, 0.5, now);

		crate = scene.Scene().Objects.crate;

		expect(crate.Values.Y).toBeGreaterThan(5.5);
		expect(scene.Save().Overrides.crate.Values.Y).toBeCloseTo(crate.Values.Y, 5);

		/* A ray from above meets it, and the ground beside it. */
		expect(scene.CastRay([crate.Values.X, 50, crate.Values.Y], [0, -1, 0]).ID).toBe('crate');
		expect(scene.CastRay([crate.Values.X + 20, 50, crate.Values.Y], [0, -1, 0]).ID).toBe(null);
		expect(typeof scene.RigidWorld().Joint).toBe('function');

		/* Gone from the scene, gone from the world. */
		scene.Remove('crate');

		frames(scene, 0.1, now);

		expect(scene.RigidWorld().Bodies().some(function (body) {
			return body.ID === 'crate';
		})).toBe(false);
	});

	/* Shown where the world had it at the last step, a screen faster than the steps saw it go by in jerks. */
	it('shows a falling crate between its last two steps, by how far the time came into the next one', async function () {
		var scene = await mount([]);
		var now = {At: 1000};
		var inner;
		var body;
		var shown;

		frames(scene, 0.1, now);

		scene.Add({ID: 'crate', Kind: 'rock', Values: {X: 5, Y: 5, Lift: 6}, Traits: {Rigid: {Shape: 'box', Size: [1, 1, 1]}}});

		frames(scene, 0.2, now);

		inner = scene.Scene();
		body = scene.RigidWorld().Bodies().filter(function (one) {
			return one.ID === 'crate';
		})[0];

		/* A frame of 1/240 s: half a step of 1/120, the crate half way between where it was and where it is. */
		inner.Last = now.At;

		scene.Engine().Frame(now.At += 1000 / 240);

		shown = inner.Objects.crate.Flight.At[1] + 0.5;

		expect(body.Was[1]).toBeGreaterThan(body.At[1]);
		expect(shown).toBeLessThan(body.Was[1]);
		expect(shown).toBeGreaterThan(body.At[1]);
	});

	it('lets a walker push a ball it walks into', async function () {
		var scene = await mount([]);
		var now = {At: 1000};
		var ball;
		var start;

		frames(scene, 0.1, now);

		/* No kind that blocks: the walker goes straight into it. */
		scene.Add([{ID: 'ball', Values: {X: 0, Y: 0}, Traits: {Model: {Shape: 'rock', Size: 1}, Rigid: {Shape: 'sphere', Radius: 0.5, Mass: 0.5}}}, {ID: 'walker', Kind: 'unit', Values: {X: -4, Y: 0}, Traits: {Walker: {Speed: 4}}}]);

		frames(scene, 1, now);

		start = scene.Scene().Objects.ball.Values.X;

		expect(scene.Move('walker', [6, 0])).not.toBe(false);

		frames(scene, 3, now);

		ball = scene.Scene().Objects.ball;

		expect(ball.Values.X).toBeGreaterThan(start + 0.5);
	});

	/*
	 * A collider: a wall of a shape of its own (its outline and height; of a model; an area of the sketch) that never moves.
	 * A crate falls onto it and rests on its top, a ray meets it, a point in it is told how to get out of it, a walker and a
	 * car are held off it; it is gone with its object.
	 */
	it('stops what comes to a collider of its own outline, of a model or of the sketch, and never moves it', async function () {
		var scene = await mount([]);
		var now = {At: 1000};
		var field;
		var list;
		var wall;
		var hut;
		var crate;
		var hit;

		frames(scene, 0.1, now);

		field = scene.Scene().Ground.Field;

		scene.Add('collider', {ID: 'wall', X: 10, Y: 0, Points: [[-2, -1], [2, -1], [2, 1], [-2, 1]], Height: 3, Facing: 90});
		scene.Add('collider', {ID: 'hut', X: -20, Y: 0, Model: 'house', Size: 8});
		scene.Add({ID: 'crate', Kind: 'rock', Values: {X: 10, Y: 0, Lift: 6}, Traits: {Rigid: {Shape: 'box', Size: [1, 1, 1], Bounce: 0}}});

		frames(scene, 3, now);

		list = scene.Colliders();
		wall = list.filter(function (one) {
			return one.ID === 'wall';
		})[0];
		hut = list.filter(function (one) {
			return one.ID === 'hut';
		})[0];

		/* Turned by its Facing: 2 m along z, 1 m along x. */
		expect(wall.Points.length).toBe(4);
		expect(wall.Top - wall.Bottom).toBeCloseTo(3, 5);
		expect(Math.max.apply(null, wall.Points.map(function (point) {
			return Math.abs(point[1]);
		}))).toBeCloseTo(2, 3);

		/* Of the model: its outline round it, as tall as its Size. */
		expect(hut.Points.length).toBeGreaterThan(3);
		expect(hut.Top - hut.Bottom).toBeCloseTo(8, 1);

		/* The crate lies on its top. */
		crate = scene.Scene().Objects.crate;

		expect(crate.World[1]).toBeCloseTo(wall.Top, 0);

		/* A ray from above meets it; a point in it is told the way out. */
		hit = scene.CastRay([10, 30, 1.5], [0, -1, 0]);

		expect(hit.ID).toBe('wall');
		expect(hit.At[1]).toBeCloseTo(wall.Top, 1);

		hit = scene.Engine().ColliderHit(10.6, 0, null, 0);

		expect(hit.ID).toBe('wall');
		expect(hit.Normal[0]).toBeCloseTo(1, 3);
		expect(hit.Depth).toBeCloseTo(0.4, 3);
		expect(scene.Engine().ColliderHit(12, 0, null, 0)).toBe(null);
		expect(scene.Engine().ColliderHit(11.3, 0, null, 0.4)).not.toBe(null);
		expect(scene.Engine().ColliderHit(10, 0, wall.Top + 2, 0)).toBe(null);

		/* An area of the sketch of the ground. */
		scene.Change('land', {World: Elemenx.Service('SceneWorld').Library({Size: 200, Height: 6, Water: 0, Seed: 'test', Sketch: {Layers: [{ID: 'walls', Items: [{ID: 'pen', Type: 'collider', Points: [[30, 30], [34, 30], [34, 34], [30, 34]], Height: 2}]}]}})});

		frames(scene, 0.2, now);

		expect(scene.Colliders().map(function (one) {
			return one.ID;
		})).toContain('sketch-pen');
		expect(field.Height(32, 32)).toBeCloseTo(scene.Scene().Ground.Field.Height(32, 32), 3);

		/* Gone with its object. */
		scene.Remove('wall');

		frames(scene, 0.1, now);

		expect(scene.Colliders().map(function (one) {
			return one.ID;
		})).not.toContain('wall');
		expect(scene.RigidWorld().Bodies().some(function (body) {
			return body.ID === 'wall';
		})).toBe(false);
	});

	/*
	 * What a scene shows to debug, each in its own colour: the wire of all (Wireframe), the edges of its models (Edges), the
	 * outline of the selected object and of the one under the pointer (Hovered): each draws more, and none when off.
	 */
	it('draws the wire of all, the edges of the models and the outlines of the chosen and hovered ones, each its colour', async function () {
		var scene = await mount([]);
		var now = {At: 1000};
		var renderer;
		var inner;

		function drawn () {
			var before = renderer.Counts().Draws;

			scene.Scene().Rest = 0;

			scene.Engine().Frame(now.At += 33);

			return renderer.Counts().Draws - before;
		}

		frames(scene, 0.1, now);

		scene.Add('thing', {ID: 'hut', Model: 'house', X: 5, Y: 5, Size: 8});
		scene.Add('thing', {ID: 'stop', Model: 'bus-stop', X: 15, Y: 2, Size: 2.6});
		scene.SetViewpoint({Target: [8, 4, 4], Yaw: 0.6, Pitch: 0.4, Distance: 30});

		frames(scene, 0.3, now);

		renderer = scene.Engine().Renderer;
		inner = scene.Scene();

		var plain = drawn();

		/* The outlines: a list of each, in the colour of each. */
		scene.Select('hut');

		scene.Hovered = 'stop';

		drawn();

		var outlined = drawn();
		var lists = inner.OutlineLists;
		var names = Object.keys(lists).filter(function (name) {
			return lists[name].Count;
		});

		expect(outlined).toBeGreaterThan(plain);
		expect(names.some(function (name) {
			return /house/.test(name) && lists[name].Tints[0] === inner.Colors.Outline[0];
		})).toBe(true);
		expect(names.some(function (name) {
			return /bus-stop/.test(name) && lists[name].Tints[2] === inner.Colors.Hover[2];
		})).toBe(true);

		/* The wire of all, then the edges: more again; off, as before. */
		scene.Wireframe = true;

		drawn();

		var wired = drawn();

		expect(wired).toBeGreaterThan(outlined);

		scene.Wireframe = false;
		scene.Edges = true;

		drawn();

		expect(drawn()).toBeGreaterThan(outlined);

		scene.Edges = false;
		scene.Hovered = '';

		scene.Select(null);

		drawn();

		expect(drawn()).toBe(plain);
		expect(inner.Colors.Wire).not.toEqual(inner.Colors.Edges);
		expect(inner.Colors.Outline).not.toEqual(inner.Colors.Hover);
	});
});
