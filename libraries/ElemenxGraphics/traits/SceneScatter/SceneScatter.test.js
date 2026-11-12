import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount () {
	var ready = null;
	/*
	 * Of the simple plants (PlantStyle): the realistic ones come from workers after a while and all is sown again with them,
	 * nothing sown for some frames (a test that drew its frames then saw none). A test of SceneFlora names its own model.
	 */
	var component = Elemenx.Component(unique('ScatterHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="ultra" Labels="false" PlantStyle="simple" (ready)="Ready">' +
		'<SceneObject ID="land" Kind="ground" Size="300" Height="4" Water="0" Seed="woods" />' +
		'<SceneObject ID="woods" Kind="forest" Density="3" Cover="1" />' +
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

describe('Regression: what is sown casts its shadow', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Renderer', 'service:Meshes', 'service:SceneModels', 'service:SceneFlora']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/*
	 * The near things were drawn into the shadow by the shape of the next level, which held the copies of that level: where
	 * the levels do not overlap (at ultra, farther apart), the trees near the eye cast no shadow.
	 */
	it('draws each level into the shadow by the shape that holds its copies, as it draws it into the view', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var shadow = engine.ScatterShadow;
		var sown = engine.ScatterDraw;
		var where = '';
		var cast = [];
		var drawn = [];
		var now = performance.now() + 100;
		var i;

		scene.SetViewpoint({Target: [0, 1, 0], Yaw: 0.4, Pitch: 0.6, Distance: 20});

		/*
		 * Regression: the sowing of its squares and their simpler levels in workers took about the 20 s it was given (the
		 * test some 22 s long), and one run in three found nothing near sown yet: 60 s. Under the load of all the tests it
		 * took longer still: 120 s, and it is told if nothing came.
		 */
		expect(await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return scene.Sown().Things > 20 && !scene.Sown().Waiting;
		}, 120000)).toBe(true);

		engine.ScatterShadow = function () {
			where = 'shadow';

			shadow.apply(this, arguments);

			where = '';
		};
		engine.ScatterDraw = function () {
			where = where || 'view';

			sown.apply(this, arguments);

			where = where === 'view' ? '' : where;
		};
		renderer.Draw = function (mesh, program, uniforms) {
			/* The near level: its fade starts before the eye. */
			if (where && uniforms && uniforms.uFade && uniforms.uFade[0] < 0)
				(where === 'shadow' ? cast : drawn).push(mesh);

			return draw.apply(this, arguments);
		};

		try {
			for (i = 0; i < 3; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			expect(cast.length).toBeGreaterThan(0);
			expect(cast.every(function (mesh) {
				return drawn.indexOf(mesh) !== -1;
			})).toBe(true);
		}
		finally {
			renderer.Draw = draw;
			engine.ScatterShadow = shadow;
			engine.ScatterDraw = sown;
		}
	}, 180000);


	/*
	 * Regression: a plant of cards (SceneFlora) past its nearest level was its simpler shape of corners, colored: its leaves
	 * plates of the mean of their picture, and its shadow plates or none. A model that tells its own simpler levels (Lods) is
	 * drawn of its pictures at them too, and casts its shadow cut by the alpha of its leaves.
	 */
	it('draws a plant of SceneFlora of its pictures at its simpler levels too, its leaves cut by their alpha in its shadow', async function () {
		var scene = await mount();
		var inner = scene.Scene();
		var engine = scene.Engine();
		var renderer = engine.Renderer;
		var draw = renderer.Draw;
		var shadow = engine.ScatterShadow;
		var sown = engine.ScatterDraw;
		var models = scene.$Service('SceneModels');
		var name = scene.$Service('SceneFlora').Define('scatter-test-birch', 'birch', {Variants: 1});
		var where = '';
		var cut = 0;
		var pictured = 0;
		var now = performance.now() + 100;
		var i;

		await new Promise(function (done) {
			models.Load(name, done);
		});

		scene.Add({Kind: 'forest', ID: 'birches', Traits: {Scatter: {Shapes: [name], Density: 1.5, Cover: 1, Patch: 60, MaxSlope: 1}}});
		scene.SetViewpoint({Target: [0, 1, 0], Yaw: 0.4, Pitch: 0.3, Distance: 45});

		await waitFor(function () {
			inner.Rest = 0;

			engine.Frame(now += 33);

			return scene.Sown().Things > 20 && !scene.Sown().Waiting;
		}, 60000);

		engine.ScatterShadow = function () {
			where = 'shadow';

			shadow.apply(this, arguments);

			where = '';
		};
		engine.ScatterDraw = function () {
			where = where || 'view';

			sown.apply(this, arguments);

			where = where === 'view' ? '' : where;
		};
		renderer.Draw = function (mesh, program, uniforms) {
			if (where === 'shadow' && uniforms && uniforms.uCutoff > 0)
				cut++;

			/* A level past the nearest (its fade starts past the eye) drawn of a picture of its own. */
			if (where === 'view' && uniforms && uniforms.uFade && uniforms.uFade[0] > 0 && uniforms.uFade[2] < 1e7 && uniforms.uCutoff > 0)
				pictured++;

			return draw.apply(this, arguments);
		};

		try {
			for (i = 0; i < 3; i++) {
				inner.Rest = 0;

				engine.Frame(now += 33);
			}

			expect(cut).toBeGreaterThan(0);
			expect(pictured).toBeGreaterThan(0);
		}
		finally {
			renderer.Draw = draw;
			engine.ScatterShadow = shadow;
			engine.ScatterDraw = sown;
		}
	}, 120000);

	/*
	 * Regression: buildings far away were pictures of 96 texels turned to the eye, pixelized and with no facades, and every
	 * level came at the same metres for a bush and a tower. Now a level comes by the size on the screen, and a building past
	 * its nearest is its simpler shape with its facades baked.
	 */
	it('draws a far building by its shape with its facades baked, not by a picture', async function () {
		var ready = null;
		var component = Elemenx.Component(unique('FacadeHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="high" Labels="false" (ready)="Ready"></Scene></div>', Ready: function (space) {
			ready = space;
		}})();
		var engine;
		var renderer;
		var draw;
		var faced = [];
		var now = performance.now() + 100;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		ready.Scene().Loop.Stop();
		ready.Add('ground', {ID: 'land', World: Elemenx.Service('SceneWorld').Library({Size: 1600, Height: 2, Water: 0, Scale: 300, Ridges: 0, Seed: 'far', Sketch: {Layers: [{ID: 'base', Items: [{ID: 'burg', Type: 'settlement', Kind: 'town', Points: [[400, 400], [520, 400], [520, 520], [400, 520]]}]}]}})});
		ready.SetViewpoint({Target: [-300, 2, -300], Yaw: -2.36, Pitch: 0.1, Distance: 20});

		engine = ready.Engine();
		renderer = engine.Renderer;
		draw = renderer.Draw;
		renderer.Draw = function (mesh, program, uniforms) {
			if (uniforms && uniforms.uFacade)
				faced.push(uniforms.uFacade);

			return draw.apply(this, arguments);
		};

		try {
			await waitFor(function () {
				ready.Scene().Rest = 0;

				engine.Frame(now += 33);

				return ready.Sown().Squares > 0 && ready.Sown().Waiting === 0 && faced.length > 0;
			}, 60000);

			expect(faced.length).toBeGreaterThan(0);
		}
		finally {
			renderer.Draw = draw;
		}
	}, 90000);
});
