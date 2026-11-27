import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var networks;
var blueprints;

describe('NetworkBlueprints: networks of graphs', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['BlueprintPreview', 'service:NetworkBlueprints', 'service:Blueprints', 'service:ScenePlanet', 'service:SceneTerrainGenerator', 'service:SceneRoads']);

		networks = Elemenx.Service('NetworkBlueprints');
		blueprints = Elemenx.Service('Blueprints');
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('declares the kind network and its steps to Blueprints, made code', function () {
		expect(blueprints.Graphs()).toContain('network');

		['Network', 'Ways', 'Merge', 'Ring', 'Fit', 'Connect', 'Route', 'Classify', 'Beside', 'Smooth', 'Round', 'Drainage'].forEach(function (type) {
			expect(blueprints.Nodes('network')).toContain(type);
		});

		expect(blueprints.Nodes('generator')).not.toContain('Ways');
		expect(blueprints.Nodes('network')).toContain('Formula');

		/* A graph of its own: lines in, smoothed once, rounded. */
		var graph = blueprints.Create('network', {name: 'mine'});

		blueprints.Add(graph, 'Input', {id: 'lines', properties: {Name: 'Lines'}});
		blueprints.Add(graph, 'Ways', {id: 'ways', properties: {Class: 'path'}});
		blueprints.Add(graph, 'Smooth', {id: 'smooth', properties: {Rounds: 1}});
		blueprints.Add(graph, 'Round', {id: 'round', properties: {Places: 1}});
		blueprints.Add(graph, 'Network', {id: 'end'});
		blueprints.Link(graph, ['lines', 'Value'], ['ways', 'List']);
		blueprints.Link(graph, ['ways', 'Network'], ['smooth', 'Network']);
		blueprints.Link(graph, ['smooth', 'Network'], ['round', 'Network']);
		blueprints.Link(graph, ['round', 'Network'], ['end', 'Network']);

		var made = networks.Make(graph, {}, {Lines: [[[0, 0], [4, 0], [4, 4]]]});

		expect(made.Ways.length).toBe(1);
		expect(made.Ways[0].Class).toBe('path');
		expect(made.Ways[0].Points).toEqual([[0, 0], [1, 0], [3, 0], [4, 1], [4, 3], [4, 4]]);
		expect(networks.Code(graph).Keys).toEqual(['Network']);
	});

	it('joins towns by the shortest net, each way of its class, a rail beside the main ones', function () {
		var made = networks.Connect([{X: 0, Z: 0, Rank: 3}, {X: 1000, Z: 0, Rank: 2}, {X: 0, Z: 500, Rank: 1}], [[-900, -900]], null, 2, 30);

		/* The passage first, then the town to the city, then the village to the city nearest it. */
		expect(made.Ways.map(function (way) {
			return way.ID;
		})).toEqual(['road--90_-90-0_0', 'road-100_0-0_0', 'road-0_50-0_0']);

		made = networks.Classify(made, 'road', 'country', 'gravel');

		expect(made.Ways.map(function (way) {
			return way.Class;
		})).toEqual(['country', 'road', 'country']);

		made = networks.Beside(made, true, 10, 2, 'rail', 1);

		expect(made.Ways.map(function (way) {
			return way.Class;
		})).toEqual(['country', 'road', 'rail', 'country']);
		expect(made.Ways[2].ID).toBe('rail-100_0-0_0');
		expect(made.Ways[2].Points).toEqual([[1000, -10], [0, -10]]);
		expect(networks.Beside(made, false, 10, 2, 'rail', 1).Ways.length).toBe(4);
	});

	it('lays a closed way round a middle as long as asked, and routes ways along a ground', function () {
		var ring = networks.Ring('loop', 12, 0.4, 1000, undefined, 'random');
		var fitted = networks.Fit(ring, 1500, 6, 2);
		var line = Elemenx.Service('SceneRoads').Line(fitted.Ways[0].Points, {Closed: true, Step: 6});
		var field = Elemenx.Service('SceneTerrainGenerator').Flat({Size: 1000, Height: 80, Water: 0, Seed: 'route'});
		var routed;

		expect(ring.Ways[0].Points.length).toBe(12);
		expect(ring.Ways[0].Values.Draws).toBe(24);
		expect(networks.Ring('loop', 0, 0.4, 1000).Ways[0].Values.Draws).toBe(networks.Ring('loop', 0, 0.4, 1000).Ways[0].Points.length * 2 + 1);
		expect(line[line.length - 1].Along).toBeGreaterThan(1450);
		expect(line[line.length - 1].Along).toBeLessThan(1510);

		routed = networks.Route(networks.Ways([[[-300, -300], [300, 300]]]), field, false);

		expect(routed.Ways[0].Points.length).toBeGreaterThan(1);
		expect(routed.Ways[0].Values.Routed).toBe(1);
		/* Once routed, not again. */
		expect(networks.Route(routed, field, false).Ways[0].Points).toEqual(routed.Ways[0].Points);
	});

	it('gives a sample of the inputs of a graph to be seen, and draws it in BlueprintPreview', async function () {
		var sample = networks.Sample('ElemenxGraphics/network/roads');
		var drawn = null;

		expect(Object.keys(sample).sort()).toEqual(['Field', 'Hubs', 'Passages', 'Trunks']);
		expect(networks.Sample('ElemenxGraphics/network/rivers').Size).toBe(64);

		var component = Elemenx.Component(unique('NetworkHost'), {$Template: '<div style="width: 400px"><BlueprintPreview Graph="ElemenxGraphics/network/track" Height="200" (drawn)="Drawn" /></div>', Drawn: function (event) {
			drawn = event;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return drawn;
		}, 4000);

		expect(drawn).toEqual({Kind: 'network', Count: 1});
		expect(component.$Element().textContent).toContain('1 ways');
	});

	it('refuses a graph of another kind and one of no Network', function () {
		expect(function () {
			networks.Code('ElemenxGraphics/cloud/sky');
		}).toThrow(/not a graph of a network/);

		expect(function () {
			networks.Code(blueprints.Create('network', {name: 'empty'}));
		}).toThrow(/has no Network/);
	});
});
