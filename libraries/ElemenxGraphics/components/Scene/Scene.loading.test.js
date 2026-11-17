import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

/*
 * Regressions of the loading of a scene: each program was made the first time it was drawn, after the scene was told ready
 * (the ground, the sky, the models, the light of probes, the weather came seconds later and the bar came back); the count of
 * the bar grew as it went and stood still; when only what is behind the page was left, the bar turned endless; a model asked
 * for after the scene was shown came with no bar at all; the near squares of a globe and the sky being baked were no stage, the
 * bar stood at 99 for seconds.
 */
describe('Regression: a scene asks for all it may draw when it starts, and tells how far it is stage by stage', function () {
	var owned = [];

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	async function mount (inside) {
		var ready = null;
		var told = [];
		var component = Elemenx.Component(unique('LoadHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready" (loading)="Told">' + inside + '</Scene></div>', Ready: function (space) {
			ready = space;
		}, Told: function (event) {
			told.push(event && event.detail && event.detail.Part !== undefined ? event.detail : event);
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		ready.Scene().Loop.Stop();

		ready.Scene().Seen = true;

		return {Scene: ready, Told: told};
	}

	function step (scene) {
		scene.Scene().Rest = 0;

		scene.Scene().Loop.Advance(16);
	}

	it('makes the programs of its ground, its sky, its sea and the passes of its models at its first frame, and none after it is ready', async function () {
		var made = await mount('<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Seed="flat" /><SceneObject ID="sun" Kind="sun" Time="12" />');
		var scene = made.Scene;
		var renderer = scene.Engine().Renderer;
		var total;
		var i;

		step(scene);

		/* All of them asked for at once: the ground, its depth, the sky, the sea, what is sown, the weather. */
		total = renderer.Progress().Total;

		expect(total).toBeGreaterThan(40);

		await waitFor(function () {
			step(scene);

			return !scene.Scene().Preparing;
		}, 60000);

		/* Ready: what it draws next asks for nothing new. */
		total = renderer.Progress().Total;

		for (i = 0; i < 20; i++)
			step(scene);

		expect(renderer.Progress().Total).toBe(total);
	}, 90000);

	it('tells its stages with their names and counts, and its part as a number however its programs are made', async function () {
		var made = await mount('<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Seed="flat" />');
		var scene = made.Scene;
		var engine = scene.Engine();
		var progress = engine.Renderer.Progress;
		var last;

		step(scene);

		engine.Renderer.Progress = function () {
			return {Done: 1, Total: 4, Needed: 0};
		};

		try {
			step(scene);
		}
		finally {
			engine.Renderer.Progress = progress;
		}

		last = made.Told[made.Told.length - 1];

		expect(last.Part).toBeTypeOf('number');
		expect(last.Stages.filter(function (one) {
			return one.Name === 'programs';
		})[0]).toMatchObject({Done: 1, Total: 4, Label: expect.any(String)});
		expect(scene.LoadingEndless).toBe(undefined);
	});

	it('takes what a trait bakes as a stage it waits for (engine.Bakes)', async function () {
		var made = await mount('<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Seed="flat" />');
		var scene = made.Scene;
		var engine = scene.Engine();
		var baked = {Name: 'sky', Done: 2, Total: 6};
		var last;

		engine.Bakes.push(function () {
			return baked;
		});

		step(scene);

		last = made.Told[made.Told.length - 1];

		expect(last.Stages.filter(function (one) {
			return one.Name === 'sky';
		})[0]).toMatchObject({Done: 2, Total: 6});
		expect(engine.Waiting()).toBeGreaterThanOrEqual(4);

		baked = null;
	});

	it('is made ready again for a model asked for after it was shown, and is not held by one that cannot be read', async function () {
		var made = await mount('<SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Seed="flat" />');
		var scene = made.Scene;
		var inner = scene.Scene();

		await waitFor(function () {
			step(scene);

			return !inner.Preparing;
		}, 60000);

		scene.Add('unit', {ID: 'late', Model: '/data/models/no-such-model-here.glb', X: 0, Y: 0});

		await tick(20);

		await waitFor(function () {
			step(scene);

			return inner.Preparing;
		}, 5000);

		/* It could not be read: counted as come, the scene goes on. */
		await waitFor(function () {
			step(scene);

			return !inner.Preparing;
		}, 30000);

		expect(Object.keys(inner.Broken)).toContain('/data/models/no-such-model-here.glb');
	}, 90000);
});
