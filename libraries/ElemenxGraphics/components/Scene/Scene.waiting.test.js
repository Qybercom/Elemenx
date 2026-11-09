import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

/*
 * Regressions of a ship touching down on a location: the page froze for seconds (the program of the land of the location
 * made at its first draw, the page waiting for the card), then stayed behind the veil for good (it waited for the near
 * globe of the planet and the paint of its moon, which are not drawn on the ground of a location, so never made).
 */
describe('Regression: what the view of a ground waits for, and the land drawn only once its program is made', function () {
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

	async function mount () {
		var ready = null;
		var component = Elemenx.Component(unique('WaitHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Setting="terrain" Paused="true" Quality="low" Labels="false" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="0.3" Water="0" Seed="flat" /></Scene></div>', Ready: function (space) {
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

	it('waits on a ground for its squares, what grows on it and the programs it needs, not for globes it does not draw', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var progress = renderer.Progress;
		var now = performance.now() + 1000;

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return inner.Ground && inner.Ground.Missing === 0 && renderer.Progress().Needed === 0;
		}, 30000);

		/* A globe near that misses squares, and a body not painted: neither is drawn on the ground, neither waited for. */
		inner.Globes.far = {Missing: 266};

		try {
			expect(engine.Waiting()).toBe(engine.ScatterPending ? engine.ScatterPending(240) : 0);

			/* A program the land needs and the card has not made yet: waited for. */
			renderer.Progress = function () {
				return Object.assign(progress.call(renderer), {Needed: 2});
			};

			expect(engine.Waiting()).toBe((engine.ScatterPending ? engine.ScatterPending(240) : 0) + 2);
		}
		finally {
			renderer.Progress = progress;

			delete inner.Globes.far;
		}
	}, 60000);

	it('draws no land while its program is not made, and asks the card nothing that waits for it', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var ready = renderer.Ready;
		var draw = renderer.Draw;
		var now = performance.now() + 1000;
		var land = 0;

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return inner.Ground && inner.Ground.Missing === 0 && renderer.Progress().Needed === 0;
		}, 30000);

		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uLandColor !== undefined && uniforms.uCenter)
				land++;

			return draw.apply(this, arguments);
		};

		try {
			/* Made: the land is drawn. */
			inner.Rest = 0;

			engine.Frame(now += 100);

			expect(land).toBeGreaterThan(0);

			/* Not made yet: not drawn, and the frame goes on. */
			land = 0;
			renderer.Ready = function () {
				return false;
			};

			inner.Rest = 0;

			engine.Frame(now += 100);

			expect(land).toBe(0);
		}
		finally {
			renderer.Ready = ready;
			renderer.Draw = draw;
		}
	}, 60000);
});
