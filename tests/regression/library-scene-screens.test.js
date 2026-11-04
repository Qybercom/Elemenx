import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('ScreensHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="100" Height="0.3" Water="0" Seed="flat" />' +
		'<div slot="screens" data-screen="dash" style="width: 64px; height: 32px; background: rgb(255, 0, 0)"><span class="speed">0</span></div>' +
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

describe('Regression: the screens of a car hold no frame up', function () {
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

	/* Reading every style of every node of a screen took tens of milliseconds, 7 times a second: the scene went by in jerks. */
	it('draws a screen again only when it changed, and reads its styles again only when a class or an attribute changed', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var rasterize = engine.Rasterize;
		var computed = window.getComputedStyle;
		var drawn = 0;
		var read = 0;
		var now = performance.now() + 100;
		var speed = scene.$Element().querySelector('[data-screen="dash"] .speed');

		function frames (count) {
			for (var i = 0; i < count; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}
		}

		async function settle () {
			for (var i = 0; i < 5; i++) {
				frames(1);

				await new Promise(function (done) {
					setTimeout(done, 30);
				});
			}
		}

		engine.Rasterize = function () {
			drawn++;

			return rasterize.apply(this, arguments);
		};
		window.getComputedStyle = function (element) {
			if (element && element.closest && element.closest('[data-screen]'))
				read++;

			return computed.apply(this, arguments);
		};

		try {
			frames(2);

			scene.Add('unit', {ID: 'car', Name: '', Size: 1, X: 0, Y: 0, Vehicle: {Kind: 'car', Wheels: 'none',
				Screens: [{Source: 'dash', At: [0, 1.2, 0], Normal: [0, 0, -1], Width: 0.6, Height: 0.3, Pixels: [64, 32], Every: 0}]
			}});
			scene.Control('car');

			await waitFor(function () {
				frames(1);

				return drawn > 0;
			}, 10000);

			await settle();

			/* Unchanged: drawn once, whatever the frames. */
			expect(drawn).toBe(1);

			read = 0;
			speed.textContent = '120';

			await settle();

			/* Its text changed: drawn again with the styles it had. */
			expect(drawn).toBe(2);
			expect(read).toBe(0);

			speed.className = 'speed fast';

			await settle();

			/* A class changed: its styles are read again. */
			expect(drawn).toBe(3);
			expect(read).toBeGreaterThan(0);

			/* A binding that writes again the value it had changes nothing: not drawn, nothing read. */
			read = 0;
			speed.className = 'speed fast';
			speed.firstChild.data = speed.firstChild.data;

			await settle();

			expect(drawn).toBe(3);
			expect(read).toBe(0);
		}
		finally {
			engine.Rasterize = rasterize;
			window.getComputedStyle = computed;
		}
	});
});
