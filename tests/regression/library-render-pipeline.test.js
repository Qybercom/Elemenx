import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A ground under the sun at noon, its exposure given, so a frame is the same as the one before it. */
var GROUND = '<GameObject ID="land" Kind="ground" Size="200" Height="10" Seed="test" /><GameObject ID="day" Kind="sun" Time="12" Latitude="45" />';

async function mount (attributes, state) {
	var ready = null;
	var component = Elemenx.Component(unique('PipelineHost'), Object.assign({$Template: '<div style="width: 240px; height: 160px"><GameScene Paused="true" Exposure="1" ' + attributes + ' (ready)="Ready">' + GROUND + '</GameScene></div>', Ready: function (space) {
		ready = space;
	}}, state || {}))();
	var scene;
	var inner;
	var engine;
	var now = 1000;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		return ready;
	}, 4000);

	scene = ready;
	inner = scene.Scene();
	engine = scene.Engine();

	inner.Loop.Stop();

	await waitFor(function () {
		inner.Rest = 0;

		engine.Frame(now += 33);

		return engine.Renderer.Progress().Needed === 0 && Elemenx.Service('Terrain').Work().Waiting() === 0;
	}, 30000);

	/* A frame drawn, and what the canvas shows read at once: [r, g, b] of its middle. */
	scene.Shot = function () {
		var renderer = engine.Renderer;
		var gl = renderer.GL;
		var data = new Uint8Array(4);

		engine.Frame(now += 33);

		gl.readPixels(Math.round(renderer.Width / 2), Math.round(renderer.Height / 3), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

		return [data[0], data[1], data[2]];
	};

	return scene;
}

/* What draws a frame of the passes asks for: the thresholds of the steps down of the glow. */
function thresholds (scene) {
	var renderer = scene.Engine().Renderer;
	var draw = renderer.Draw;
	var seen = [];

	renderer.Draw = function (mesh, program, uniforms) {
		if (uniforms && uniforms.uThreshold > 0)
			seen.push(uniforms.uThreshold);

		return draw.apply(this, arguments);
	};

	try {
		scene.Shot();
	}
	finally {
		renderer.Draw = draw;
	}

	return seen;
}

/* A pass graph: one minus the color of the picture given to it. */
function inverted (blueprints) {
	var graph = blueprints.Create('pass');
	var texture = blueprints.Add(graph, 'Texture', {properties: {Name: 'Color'}});
	var minus = blueprints.Add(graph, 'OneMinus');
	var output = blueprints.Add(graph, 'Output');

	blueprints.Link(graph, [texture.id, 'RGBA'], [minus.id, 'X']);
	blueprints.Link(graph, [minus.id, 'Out'], [output.id, 'Color']);

	return graph;
}

describe('Contract: the Pipeline of a GameScene, the passes of its picture as a render graph of Blueprints', function () {
	var blueprints;

	beforeAll(async function () {
		await loadElemenx();

		Use(['GameScene', 'GameObject', 'service:Blueprints']);

		blueprints = Elemenx.Service('Blueprints');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('gives the passes of the library as a render graph, in the order they run, and draws the same picture of it given', async function () {
		var scene = await mount('Quality="medium"');
		var graph = scene.PipelineGraph();
		var made = blueprints.Compile(JSON.parse(blueprints.Write(graph)));
		var before;
		var after;

		expect(graph.type).toBe('render');
		expect(blueprints.Check(graph)).toEqual([]);
		expect(made.Passes.map(function (pass) {
			return pass.Type;
		})).toEqual(['Scene', 'Clouds', 'Occlusion', 'Air', 'Frames', 'Mirror', 'Rays', 'Exposure', 'Bokeh', 'Bloom', 'Picture', 'Present']);

		before = scene.Shot();

		scene.Pipeline = JSON.parse(blueprints.Write(graph));

		await tick(20);

		after = scene.Shot();

		expect(before.reduce(function (sum, part) {
			return sum + part;
		}, 0)).toBeGreaterThan(30);
		expect(after).toEqual(before);
	});

	it('leaves out a pass switched off, takes the properties of its blocks, and adds a pass of a graph of its own after the picture', async function () {
		var scene = await mount('Quality="medium"');
		var graph = scene.PipelineGraph();
		var plain;
		var shader;
		var shot;

		expect(thresholds(scene)).toEqual([0.85]);

		plain = scene.Shot();

		/* The threshold of the glow is a property of its block. */
		blueprints.Find(graph, 'bloom').properties[0].value = 2;
		scene.Pipeline = JSON.parse(blueprints.Write(graph));

		await tick(20);

		expect(thresholds(scene)).toEqual([2]);

		/* Switched off: no glow at all. */
		blueprints.Find(graph, 'bloom').enabled = false;
		scene.Pipeline = JSON.parse(blueprints.Write(graph));

		await tick(20);

		expect(thresholds(scene)).toEqual([]);

		/* Its glow is none, not the picture itself: nothing grows brighter. */
		shot = scene.Shot();

		[0, 1, 2].forEach(function (index) {
			expect(shot[index]).toBeLessThanOrEqual(plain[index] + 2);
		});

		/* A Shader between Picture and Present: the picture turned over, put on the screen by a copy of it. */
		graph = scene.PipelineGraph();
		shader = blueprints.Add(graph, 'Shader', {properties: {Graph: inverted(blueprints)}});

		blueprints.Remove(graph, graph.links.filter(function (link) {
			return link.p2 === 'present-in-Color';
		})[0].id);
		blueprints.Link(graph, ['picture', 'Color'], [shader.id, 'Color']);
		blueprints.Link(graph, [shader.id, 'Color'], ['present', 'Color']);

		scene.Pipeline = graph;

		await tick(20);

		/* The program of the Shader made in the background first: under load it takes a while. */
		await waitFor(function () {
			scene.Shot();

			return scene.Engine().Renderer.Progress().Needed === 0;
		}, 30000);

		shot = scene.Shot();

		[0, 1, 2].forEach(function (index) {
			expect(Math.abs(shot[index] - (255 - plain[index]))).toBeLessThan(6);
		});
	});

	it('draws the picture of the library when the Pipeline cannot be made, and tells it once', async function () {
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var scene = await mount('Quality="medium"');
		var plain = scene.Shot();
		var graph = scene.PipelineGraph();

		try {
			blueprints.Remove(graph, 'present');

			scene.Pipeline = graph;

			await tick(20);

			expect(scene.Shot()).toEqual(plain);
			expect(scene.Shot()).toEqual(plain);
			expect(warn.mock.calls.filter(function (call) {
				return String(call[0]).indexOf('Elemenx GameScene: the Pipeline cannot be made') === 0;
			}).length).toBe(1);
		}
		finally {
			warn.mockRestore();
		}
	});
});
