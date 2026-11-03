import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('EditingHost'), {$Template: '<div style="width: 320px; height: 200px"><GameScene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<GameObject ID="land" Kind="ground" Size="200" Height="6" Water="0" Seed="test" />' +
		'<GameObject ID="day" Kind="sun" Time="12" Latitude="45" />' +
	'</GameScene></div>', Ready: function (space) {
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

describe('Contract: what a GameScene gives an editor: the view set at once, points of the page and of the ground, Facing and Lift', function () {
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

	it('sets the view at once and tells it, and finds the point of the ground under a point of the page', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var field;
		var view;
		var spot;
		var found;
		var now = 1000;

		engine.Frame(now += 33);

		scene.SetViewpoint({Target: [10, 3, -5], Yaw: 0.5, Pitch: 0.6, Distance: 30});

		engine.Frame(now += 33);

		view = scene.Viewpoint();

		expect(view.Target).toEqual([10, 3, -5]);
		expect([view.Yaw, view.Pitch, view.Distance]).toEqual([0.5, 0.6, 30]);
		expect(Math.hypot(view.Eye[0] - 10, view.Eye[1] - 3, view.Eye[2] + 5)).toBeCloseTo(30, 3);

		/* A point of the ground, on the page and back. */
		field = scene.Scene().Ground.Field;
		spot = scene.Project([12, Math.max(0, field.Height(12, -4)), -4]);

		expect(spot.Visible).toBe(true);

		found = scene.GroundAt(spot.X, spot.Y);

		expect(Math.hypot(found[0] - 12, found[2] + 4)).toBeLessThan(0.2);
		expect(found[1]).toBeCloseTo(Math.max(0, field.Height(found[0], found[2])), 2);

		/* The ray through it starts at the eye. */
		expect(scene.Ray(spot.X, spot.Y).Origin.map(Math.round)).toEqual(view.Eye.map(Math.round));

		/* The sky shows no ground. */
		scene.SetViewpoint({Target: [0, 40, 0], Yaw: 0, Pitch: -1.2, Distance: 5});

		engine.Frame(now += 33);

		expect(scene.GroundAt(scene.Project([0, 400, 0]).X, scene.Project([0, 400, 0]).Y)).toBe(null);
	});

	it('turns what stands by its Facing, lifts it by its Lift, and picks with all what cannot be selected', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var inner = scene.Scene();
		var ground;
		var spot;
		var now = 1000;

		scene.Add('unit', {ID: 'post', X: 4, Y: 2, Facing: 90});
		scene.Add('effect', {ID: 'fire', Type: 'torch', X: -6, Y: 3});

		engine.Frame(now += 33);

		ground = Math.max(0, inner.Ground.Field.Height(4, 2));

		expect(inner.Objects.post.Heading[0]).toBeCloseTo(1, 6);
		expect(inner.Objects.post.Heading[2]).toBeCloseTo(0, 6);
		expect(inner.Objects.post.World[1]).toBeCloseTo(ground, 4);

		scene.Change('post', {Lift: 2.5, Facing: 180});

		engine.Frame(now += 33);

		expect(inner.Objects.post.World[1]).toBeCloseTo(ground + 2.5, 4);
		expect(inner.Objects.post.Heading[2]).toBeCloseTo(-1, 6);

		/* An effect is no unit to select, but an editor picks it. */
		scene.SetViewpoint({Target: [-6, 1, 3], Yaw: 0, Pitch: 0.5, Distance: 12});

		engine.Frame(now += 33);

		spot = scene.Project(inner.Objects.fire.World);

		expect(scene.Pick(spot.X, spot.Y)).toBe('');
		expect(scene.Pick(spot.X, spot.Y, true)).toBe('fire');
	});
});
