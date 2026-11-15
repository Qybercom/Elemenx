import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount (planet, errors) {
	var ready = null;
	var component = Elemenx.Component(unique('PlanetDataHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Background="false" (ready)="Ready" (error)="Failed">' +
		'<SceneObject ID="sun" Kind="star"><SceneObject ID="terra" Kind="planet" Surface-Type="terran" [surface-planet]="Planet" Radius="6371" Distance="1" Day="24"></SceneObject></SceneObject>' +
	'</Scene></div>', Planet: planet, Ready: function (space) {
		ready = space;
	}, Failed: function (error) {
		errors.push(error);
	}})();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	ready.Scene().Loop.Stop();

	return ready;
}

describe('Contract: a Scene draws a planet of data (PlanetData), opened once from its file', function () {
	var bytes;
	var real;
	var asked;
	var held;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:PlanetData', 'service:Archive', 'service:ScenePlanet', 'service:SceneTerrainGenerator', 'service:Noise', 'service:Workers']);

		bytes = await new Promise(function (resolve, reject) {
			Elemenx.Service('PlanetData').Bake({Radius: 6371, Seed: 'data-terra', Ocean: 0.5}, {ID: 'data-terra', Depth: 1, Biomes: 0, Size: 9}, function (error, made) {
				if (error) reject(error);
				else resolve(Elemenx.Service('PlanetData').Save(made));
			});
		});
	}, 60000);

	beforeEach(function () {
		resetDOM();

		asked = [];
		held = null;
		real = window.fetch;
		window.fetch = function (url) {
			asked.push(String(url));

			if (String(url) !== 'https://planets.test/terra.planet')
				return Promise.resolve(new Response('', {status: 404}));

			/* Its file comes when the test lets it (held). */
			return new Promise(function (resolve) {
				held = function () {
					resolve(new Response(bytes));
				};
			});
		};
	});

	afterEach(function () {
		window.fetch = real;

		while (owned.length) owned.pop().$Destroy();
	});

	it('draws nothing in its place till its data comes, then its globe of the tiles of its data', async function () {
		var errors = [];
		var url = 'https://planets.test/terra.planet';
		var scene = await mount({Data: url, Rivers: false, Settlements: false, Highways: false}, errors);
		var inner = scene.Scene();
		var engine = scene.Engine();
		var gl = engine.Renderer.GL;
		var planets = Elemenx.Service('ScenePlanet');
		var now = performance.now() + 1000;
		var reader;
		var face;
		var size;
		var pixel = new Uint8Array(4);

		/* No other planet in its place while it comes. */
		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return held;
		}, 10000);

		engine.Frame(now += 100);

		expect(engine.PlanetOptions(inner.Objects.terra)).toBe(null);
		expect(inner.Baked.terra || null).toBe(null);

		held();

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return inner.Baked.terra && inner.Baked.terra.Painted >= 256;
		}, 110000);

		/* Opened once; its planet named by its data, painted of the very lands ScenePlanet makes of it. */
		expect(asked.filter(function (one) {
			return one === url;
		}).length).toBe(1);
		expect(errors).toEqual([]);
		expect(engine.PlanetOptions(inner.Objects.terra).Data).toBe(url);
		expect(inner.Baked.terra.Planet).toBe(true);

		size = inner.Baked.terra.Ground.Size;
		face = planets.Face(engine.PlanetOptions(inner.Objects.terra), 2, size, Math.round(100 * size / 256), 1);
		reader = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, reader);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, inner.Baked.terra.Ground.Handle, 0);
		gl.readPixels(Math.round(37 * size / 256), Math.round(100 * size / 256), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.deleteFramebuffer(reader);

		expect(Array.from(pixel)).toEqual(Array.from(face.Data.slice(Math.round(37 * size / 256) * 4, Math.round(37 * size / 256) * 4 + 4)));
	}, 120000);

	it('tells when the data of its planet is not there, and draws no other planet', async function () {
		var errors = [];
		var scene = await mount({Data: 'https://planets.test/none.planet', Rivers: false, Settlements: false, Highways: false}, errors);
		var inner = scene.Scene();
		var engine = scene.Engine();
		var now = performance.now() + 1000;

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 100);

			return errors.length;
		}, 10000);

		expect(String(errors[0] && (errors[0].message || errors[0]))).toContain('404');
		expect(inner.Baked.terra || null).toBe(null);
		expect(engine.PlanetOptions(inner.Objects.terra)).toBe(null);
	});
});
