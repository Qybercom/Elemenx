import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (touched) {
	var ready = null;
	var component = Elemenx.Component(unique('RigidHost'), {$Template: '<div style="width: 320px; height: 200px"><GameScene Quality="low" Labels="false" (ready)="Ready" (touch)="Touch">' +
		'<GameObject ID="land" Kind="ground" Size="200" Height="6" Water="0" Seed="test" />' +
		'<GameObject ID="day" Kind="sun" Time="12" Latitude="45" />' +
	'</GameScene></div>', Ready: function (space) {
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

describe('Contract: GameScene trait Rigid, solid things of a ground that fall and are knocked over', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['GameScene', 'GameObject']);
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
});
