import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* A Scene of a globular cluster of GalaxyData: a few stars told one by one, the swarm of the others. */
async function mount () {
	var ready = null;
	var data = Elemenx.Service('GalaxyData').Cluster({Seed: 'm13', Type: 'globular', Count: 40});
	var component;

	Elemenx.Service('SystemData').Use('cluster-m13', data);

	component = Elemenx.Component(unique('ClusterHost'), {$Template: '<div style="width: 400px; height: 300px"><Scene Paused="true" Quality="low" Labels="false" [System]="Held" (ready)="Ready" /></div>', Held: {Data: 'cluster-m13'}, Ready: function (space) {
		ready = space;
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready && ready.Get('cluster');
	}, 6000);

	ready.Scene().Loop.Stop();

	return ready;
}

describe('Contract: a star cluster in a Scene: its stars round its middle, the swarm of those not told, their orbits and their light', function () {
	var now = 0;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:GalaxyData', 'service:SystemData', 'service:ScenePlanet', 'service:PlanetData']);
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

	it('draws the swarm of a cluster round its middle, hidden by bodies, and the orbits of its many stars only of the one chosen', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var swarms = [];
		var stars = scene.Objects().filter(function (object) {
			return object.Kind === 'star';
		});

		expect(scene.Get('cluster').Kind).toBe('cluster');
		expect(stars.length).toBe(40);

		renderer.Draw = function (mesh, program, uniforms, state) {
			if (mesh && mesh === inner.Swarms.cluster)
				swarms.push(state || {});

			return draw.apply(this, arguments);
		};

		try {
			await waitFor(function () {
				frames(scene, 1);

				return swarms.length > 0;
			}, 30000);
		}
		finally {
			renderer.Draw = draw;
		}

		/* Additive, tested against the depth of the bodies, writing none. */
		expect(swarms[0]).toMatchObject({Blend: 'add', DepthWrite: false});
		expect(swarms[0].Depth).not.toBe(false);

		/* Forty stars round it: no orbit drawn of any of them till one is chosen. */
		expect(Object.keys(inner.Lines).filter(function (id) {
			return /^c\d+$/.test(id);
		})).toEqual([]);

		scene.Select(stars[3].ID);

		frames(scene, 2);

		expect(inner.Lines[stars[3].ID]).toBeTruthy();
	}, 60000);

	/* Regression: the first four stars of the scene lit every planet, each as bright as its own star. */
	it('lights what the eye looks at by the four stars nearest it, each fainter as it is farther', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var renderer = scene.Engine().Renderer;
		var draw = renderer.Draw;
		var planet = scene.Objects().filter(function (object) {
			return object.Kind === 'planet';
		})[0];
		var lit = null;
		var star;
		var first;
		var second;

		expect(planet).toBeTruthy();

		scene.FocusOn(planet.ID);

		frames(scene, 400);

		star = inner.Objects[planet.Parent];

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uLightPositions && uniforms.uLightCount === 4)
				lit = {Positions: uniforms.uLightPositions.slice(), Colors: uniforms.uLightColors.slice()};

			return draw.apply(this, arguments);
		};

		try {
			frames(scene, 2);
		}
		finally {
			renderer.Draw = draw;
		}

		expect(lit).toBeTruthy();

		/* Its own star first: where it is from the eye. */
		expect(lit.Positions[0]).toBeCloseTo(star.World[0] - inner.Eye[0], 3);
		expect(lit.Positions[2]).toBeCloseTo(star.World[2] - inner.Eye[2], 3);

		first = lit.Colors[0] + lit.Colors[1] + lit.Colors[2];
		second = lit.Colors[3] + lit.Colors[4] + lit.Colors[5];

		expect(second).toBeLessThan(first * 0.2);
	}, 60000);
});
