import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import { Binary } from '../glb.mjs';

var owned = [];

async function mount (model) {
	var ready = null;
	var component = Elemenx.Component(unique('MaterialHost'), {$Template: '<div style="width: 240px; height: 160px"><GameScene Paused="true" Quality="medium" Exposure="1" (ready)="Ready">' +
		'<GameObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" />' +
		'<GameObject ID="sun" Kind="sun" Time="12" Latitude="45" />' +
		'<GameObject ID="hero" Kind="unit" Model="' + model + '" Size="8" X="0" Y="0" />' +
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

/* A material graph: the surface given the glow of the parameter Glow, and rougher by Rough. */
function glowing (blueprints) {
	var graph = blueprints.Create('material', {parameters: [{key: 'Glow', type: 'vec3', value: [0, 0, 0]}, {key: 'Rough', type: 'float', value: 0.9}]});
	var glow = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Glow', Type: 'vec3'}});
	var rough = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Rough'}});
	var map = blueprints.Add(graph, 'Texture', {properties: {Name: 'Color'}});
	var surface = blueprints.Add(graph, 'Surface');
	var position = blueprints.Add(graph, 'Position');
	var noise = blueprints.Add(graph, 'Noise');

	/* The noise of the shaders, a part PBR has already: not declared twice. */
	blueprints.Link(graph, [position.id, 'Position'], [noise.id, 'Position']);
	blueprints.Link(graph, [noise.id, 'Value'], [surface.id, 'Metal']);
	blueprints.Link(graph, [glow.id, 'Value'], [surface.id, 'Emission']);
	blueprints.Link(graph, [rough.id, 'Value'], [surface.id, 'Rough']);
	blueprints.Link(graph, [map.id, 'RGB'], [surface.id, 'Color']);

	return graph;
}

describe('Contract: materials of models as material graphs of Blueprints, drawn by PBR with their surface', function () {
	var blueprints;
	var models;

	beforeAll(async function () {
		await loadElemenx();

		Use(['GameScene', 'GameObject', 'service:Blueprints', 'service:Models']);

		blueprints = Elemenx.Service('Blueprints');
		models = Elemenx.Service('Models');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var made = [];
		var scene;
		var engine;
		var renderer;
		var program;
		var skin;
		var dark;
		var lit;
		var now = 1000;
		var i;

		models.Define('test-glowing', {URL: address, Type: 'unit', Materials: {Skin: {Blueprint: glowing(blueprints), Parameters: {Glow: [0, 0, 0]}}}});

		try {
			scene = await mount('test-glowing');
			engine = scene.Engine();
			renderer = engine.Renderer;
			program = renderer.Program;

			renderer.Program = function (vertex, fragment) {
				made.push(fragment);

				return program.apply(this, arguments);
			};

			/* The view set at once on the hero: no flight to wait for. */
			scene.SetViewpoint({Target: [0, 4, 0], Yaw: 0, Pitch: 0.3, Distance: 22});

			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				return models.Ready('test-glowing') && Elemenx.Service('Terrain').Work().Waiting() === 0 && Object.keys(scene.Scene().Lists || {}).some(function (name) {
					return /test-glowing/.test(name);
				});
			}, 20000);

			/*
			 * Regression: under load the program of the material was still made in the background, and the scene drew quiet frames
			 * of its loading in the meantime: wait until it is asked for and done.
			 */
			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				return renderer.Progress().Needed === 0 && made.some(function (fragment) {
					return fragment.indexOf('uParameter_Glow') !== -1;
				});
			}, 30000);

			/* The surface of the graph in the place of the empty one of PBR, and the map of the material read by the name Color. */
			expect(made.filter(function (fragment) {
				return fragment.indexOf('uParameter_Glow') !== -1;
			}).length).toBe(1);
			expect(made.join('\n')).toContain('#define uTexture_Color uColorMap');
			expect(renderer.GL.getError()).toBe(renderer.GL.NO_ERROR);

			skin = Object.keys(scene.Scene().Lists).map(function (name) {
				return scene.Scene().Lists[name].Material;
			}).filter(function (material) {
				return material && material.Name === 'Skin';
			})[0];

			/* How much redder than blue the hero is: the pixels of a box round where it stands on the screen, the view still. */
			async function red () {
				var gl = renderer.GL;
				var ratio = renderer.Ratio;
				var spot;
				var data = new Uint8Array(24 * 48 * 4);
				var sum = 0;
				var i;

				/* Regression: under load a frame of the loading drew nothing, and the box read black: a frame drawn, every program done. */
				await waitFor(function () {
					var painted = scene.Scene().Painted;

					scene.Scene().Rest = 0;

					engine.Frame(now += 33);

					return renderer.Progress().Needed === 0 && Elemenx.Service('Terrain').Work().Waiting() === 0 && scene.Scene().Painted > painted;
				}, 30000);

				/* Read in the same task as the frame is drawn: after it the page shows the canvas, and its buffer is empty. */
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				spot = engine.ToScreen('hero');

				gl.readPixels(Math.round(spot.X * ratio) - 12, Math.round(renderer.Height - spot.Y * ratio) - 4, 24, 48, gl.RGBA, gl.UNSIGNED_BYTE, data);

				for (i = 0; i < data.length; i += 4)
					sum += data[i] - data[i + 2];

				return sum;
			}

			for (i = 0; i < 90; i++) {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);
			}

			dark = await red();

			/* A glow of red: more red than blue wherever the skin shows; no program made again for it. */
			made.length = 0;
			skin.Parameters = {Glow: [20, 0, 0]};

			lit = await red();

			expect(lit).toBeGreaterThan(dark + 24 * 48 * 10);
			expect(made.filter(function (fragment) {
				return fragment.indexOf('uParameter_Glow') !== -1;
			})).toEqual([]);
		}
		finally {
			delete models.Recipes['test-glowing'];
		}
	});

	it('draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var graph = blueprints.Create('material', {parameters: [{key: 'Tint', type: 'vec3', value: [0, 0, 1]}]});
		var tint = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Tint', Type: 'vec3'}});
		var surface = blueprints.Add(graph, 'Surface');
		var scene;
		var engine;
		var ground;
		var now = 1000;

		blueprints.Link(graph, [tint.id, 'Value'], [surface.id, 'Color']);

		models.Define('test-plain', {URL: address, Type: 'unit'});

		/* The color of the middle of the bottom of the view: the ground. */
		function color () {
			var renderer = engine.Renderer;
			var data = new Uint8Array(4);

			scene.Scene().Rest = 0;

			engine.Frame(now += 33);

			renderer.GL.readPixels(Math.round(renderer.Width / 2), 6, 1, 1, renderer.GL.RGBA, renderer.GL.UNSIGNED_BYTE, data);

			return [data[0], data[1], data[2]];
		}

		try {
			scene = await mount('test-plain');
			engine = scene.Engine();

			await waitFor(function () {
				scene.Scene().Rest = 0;

				engine.Frame(now += 33);

				return engine.Renderer.Progress().Needed === 0 && Elemenx.Service('Terrain').Work().Waiting() === 0 && !!scene.Scene().Ground;
			}, 20000);

			ground = scene.Scene().Ground;

			scene.Change('land', {Blueprint: graph, Parameters: {Tint: [1, 0, 0]}});

			/* Its program made in the background first, as under load it takes a while. */
			await waitFor(function () {
				color();

				return engine.Renderer.Progress().Needed === 0;
			}, 30000);

			expect(color()[0]).toBeGreaterThan(color()[2] + 40);

			scene.Change('land', {Parameters: {Tint: [0, 0, 1]}});

			color();

			expect(color()[2]).toBeGreaterThan(color()[0] + 40);
			expect(scene.Scene().Ground).toBe(ground);
		}
		finally {
			delete models.Recipes['test-plain'];
		}
	});

	it('draws a material as it is when its Blueprint cannot be made, and tells it once', async function () {
		var address = URL.createObjectURL(new Blob([Binary()], {type: 'model/gltf-binary'})) + '#.glb';
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var graph = blueprints.Create('pass');
		var scene;
		var engine;
		var i;

		models.Define('test-broken', {URL: address, Type: 'unit', Materials: {Skin: {Blueprint: graph}}});

		try {
			scene = await mount('test-broken');
			engine = scene.Engine();

			await waitFor(function () {
				engine.Frame(performance.now());

				return models.Ready('test-broken') && Object.keys(scene.Scene().Lists || {}).some(function (name) {
					return /test-broken/.test(name);
				});
			}, 20000);

			for (i = 0; i < 3; i++)
				engine.Frame(performance.now());

			expect(engine.Renderer.GL.getError()).toBe(engine.Renderer.GL.NO_ERROR);
			expect(warn.mock.calls.filter(function (call) {
				return String(call[0]).indexOf('Elemenx GameScene: the Blueprint of material Skin cannot be made') === 0;
			}).length).toBe(1);
		}
		finally {
			warn.mockRestore();

			delete models.Recipes['test-broken'];
		}
	});
});
