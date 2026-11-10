import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

async function mount () {
	var ready = null;
	var component = Elemenx.Component(unique('EffectHost'), {$Template: '<div style="width: 240px; height: 160px"><Scene Paused="true" Quality="medium" (ready)="Ready"><SceneObject ID="land" Kind="ground" Size="200" Height="1" Water="0" Seed="test" /></Scene></div>', Ready: function (space) {
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

/* A graph goes through a file as it would. */
function stored (blueprints, graph) {
	return JSON.parse(blueprints.Write(graph));
}

/* The colors the layers of the effects of a frame are drawn with. */
function colors (scene) {
	var engine = scene.Engine();
	var renderer = engine.Renderer;
	var draw = renderer.Draw;
	var seen = [];

	renderer.Draw = function (mesh, program, uniforms) {
		if (uniforms && uniforms.uColor && uniforms.uHot)
			seen.push(Array.from(uniforms.uColor));

		return draw.apply(this, arguments);
	};

	try {
		scene.Scene().Rest = 0;

		engine.Frame(performance.now());
	}
	finally {
		renderer.Draw = draw;
	}

	return seen;
}

describe('Contract: effects as effect graphs of Blueprints, their numbers and colors set by parameters', function () {
	var blueprints;

	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:Blueprints']);

		blueprints = Elemenx.Service('Blueprints');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* SceneBlueprints declares its kind and blocks in $Provides: a graph of them is read with no Scene made, nothing called first. */
	it('reads a graph of an effect and the blocks of the passes with no Scene: Blueprints makes what declares them', function () {
		var blueprints = Elemenx.Application(unique('EffectsAlone'), {}).$Service('Blueprints');
		var graph = {version: 1, type: 'effect', blocks: [{id: 'l', type: 'Layer', properties: [{key: 'Kind', value: 'spark'}, {key: 'Count', value: 12}]}, {id: 'e', type: 'Effect', properties: [{key: 'Heat', value: 2}]}], links: []};
		var made;

		graph.links.push({id: 'k', p1: 'l-out-Layers', p2: 'e-in-Layers'});

		made = blueprints.Compile(graph).Make();

		expect(made.Heat).toBe(2);
		expect(made.Layers).toEqual([{Kind: 'spark', Blend: 'add', Count: 12}]);
		expect(blueprints.Nodes('render')).toEqual(expect.arrayContaining(['Scene', 'Bloom', 'Picture', 'Shader', 'Present']));
		expect(blueprints.NodeOf('Layer').Effects).toBeUndefined();
	});

	/* The types were data written in the code: now effect graphs of the resources, which an Application may give in their place. */
	it('makes its types of the effect graphs of its resources, one of an Application in the place of one of them', async function () {
		var name = 'ElemenxGraphics/effects/spark';
		var kept = Elemenx.Resources('Blueprints', name);
		var mine = JSON.parse(JSON.stringify(kept));
		var scene;

		expect(Elemenx.Resources('Blueprints').filter(function (one) {
			return one.indexOf('ElemenxGraphics/effects/') === 0;
		}).length).toBeGreaterThan(40);

		mine.blocks.filter(function (block) {
			return block.type === 'Layer';
		})[0].properties.filter(function (property) {
			return property.key === 'Count';
		})[0].value = 7;

		Elemenx.Resources('Blueprints', name, mine);

		try {
			scene = await mount();

			expect(scene.Scene().EffectTypes.spark.Layers[0].Count).toBe(7);
			expect(scene.EffectGraph('spark').blocks.map(function (block) {
				return block.id;
			})).toEqual(mine.blocks.map(function (block) {
				return block.id;
			}));
		}
		finally {
			Elemenx.Resources('Blueprints', name, kept);
		}
	});

	it('gives every type of the library as an effect graph that makes the very same type again', async function () {
		var scene = await mount();
		var types = scene.Scene().EffectTypes;
		var names = Object.keys(types);

		expect(names.length).toBeGreaterThan(20);

		names.forEach(function (name) {
			var graph = stored(blueprints, scene.EffectGraph(name));

			expect(graph.type).toBe('effect');
			expect(blueprints.Check(graph)).toEqual([]);
			/* The type keeps the graph it is made of (Blueprint): the rest is the very type again. */
			expect(Object.assign(blueprints.Compile(graph).Make({}), {Blueprint: types[name].Blueprint})).toEqual(types[name]);
		});

		expect(function () {
			scene.EffectGraph('nothing');
		}).toThrow('Elemenx Scene: no type of effect nothing');
	});

	it('burns an effect of a Blueprint, its parameters the values of its layers, one graph for many effects', async function () {
		var scene = await mount();
		var engine = scene.Engine();
		var graph = scene.EffectGraph('torch');
		var flame = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Flame', Type: 'vec3'}});
		var twice = blueprints.Add(graph, 'Multiply');
		var count = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Sparks'}});
		var made;

		graph.parameters = [{key: 'Flame', type: 'vec3', value: [0, 0, 1]}, {key: 'Sparks', type: 'float', value: 7}];

		blueprints.Link(graph, [flame.id, 'Value'], ['layer1', 'Color']);
		blueprints.Link(graph, [count.id, 'Value'], [twice.id, 'A']);
		blueprints.Link(graph, [blueprints.Add(graph, 'Number', {properties: {Value: 2}}).id, 'Value'], [twice.id, 'B']);
		blueprints.Link(graph, [twice.id, 'Out'], ['layer3', 'Count']);

		graph = stored(blueprints, graph);

		/* The math of a generator stands in an effect graph too. */
		made = engine.EffectBlueprint(graph, {Sparks: 10});

		expect(made.Layers[0].Color).toEqual([0, 0, 1]);
		expect(made.Layers[2].Count).toBe(20);
		expect(made.Layers[1]).toEqual(scene.Scene().EffectTypes.torch.Layers[1]);
		expect(engine.EffectBlueprint(graph, {Sparks: 10})).toBe(made);

		scene.Add('effect', {ID: 'green', Blueprint: graph, Parameters: {Flame: [0, 1, 0]}, X: 0, Y: 0});
		scene.Add('effect', {ID: 'red', Blueprint: graph, Parameters: {Flame: [1, 0, 0]}, X: 4, Y: 0});

		expect(engine.EffectsCount()).toBe(2);
		expect(colors(scene)).toEqual(expect.arrayContaining([[0, 1, 0], [1, 0, 0]]));

		/* A type made of the graph, and Parameters of its own for an effect of that type. */
		scene.Effects({lantern: graph});
		scene.Add('effect', {ID: 'plain', Type: 'lantern', X: 8, Y: 0});
		scene.Add('effect', {ID: 'violet', Type: 'lantern', Parameters: {Flame: [0.5, 0, 1]}, X: 12, Y: 0});

		expect(scene.Scene().EffectTypes.lantern.Layers[0].Color).toEqual([0, 0, 1]);
		expect(colors(scene)).toEqual(expect.arrayContaining([[0, 0, 1], [0.5, 0, 1]]));
		expect(scene.Burst(graph, [0, 1, 0], {Parameters: {Flame: [1, 1, 0]}})).toBe(true);
		expect(engine.EffectsCount()).toBe(5);
	});

	it('burns nothing of a Blueprint that cannot be made, and tells it once', async function () {
		var warn = vi.spyOn(console, 'warn').mockImplementation(function () {});
		var scene = await mount();
		var engine = scene.Engine();
		var graph = scene.EffectGraph('spark');

		try {
			blueprints.Remove(graph, 'effect');

			scene.Add('effect', {ID: 'broken', Blueprint: graph, X: 0, Y: 0});

			colors(scene);
			colors(scene);

			expect(engine.EffectsCount()).toBe(0);
			expect(warn.mock.calls.filter(function (call) {
				return String(call[0]).indexOf('Elemenx Scene: the Blueprint of an effect cannot be made') === 0;
			}).length).toBe(1);
		}
		finally {
			warn.mockRestore();
		}
	});
});
