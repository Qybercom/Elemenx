import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var layouts;
var blueprints;
var terrain;

function ring (r) {
	var points = [];
	var i;

	for (i = 0; i < 16; i++)
		points.push([Math.cos(i / 16 * Math.PI * 2) * r, Math.sin(i / 16 * Math.PI * 2) * r]);

	return points;
}

function sizes (name) {
	return terrain.SettlementSizes[name] || null;
}

describe('LayoutBlueprints: layouts of graphs', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['BlueprintPreview', 'service:LayoutBlueprints', 'service:Blueprints', 'service:SceneTerrainGenerator', 'service:SceneRoads', 'service:SceneBiomes']);

		layouts = Elemenx.Service('LayoutBlueprints');
		blueprints = Elemenx.Service('Blueprints');
		terrain = Elemenx.Service('SceneTerrainGenerator');
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('declares the kind layout and its stages to Blueprints, made code', function () {
		expect(blueprints.Graphs()).toContain('layout');

		['Layout', 'Area', 'Drawn', 'Grid', 'Main', 'Road', 'Radial', 'Districts', 'Lots', 'Walls', 'Site', 'Houses', 'Out', 'Diamond', 'Cloverleaf', 'Stack', 'Trumpet'].forEach(function (type) {
			expect(blueprints.Nodes('layout')).toContain(type);
		});

		expect(blueprints.Nodes('generator')).not.toContain('Grid');
		expect(layouts.Code('ElemenxGraphics/layout/grid').Keys).toEqual(['Layout']);

		expect(function () {
			layouts.Code('ElemenxGraphics/network/track');
		}).toThrow(/not a graph of a layout/);
	});

	it('lays out a settlement stage by stage, each of its numbers a property', function () {
		var item = {ID: 'test', Type: 'settlement', Kind: 'town', Seed: 'test', Points: ring(300)};
		var kind = terrain.SettlementKinds.town;
		var area = layouts.Area(item, [item], kind, sizes);
		var wide;
		var narrow;

		expect(area.Center[0]).toBeCloseTo(0, 6);
		expect(area.Reach).toBeCloseTo(300, 6);
		expect(area.Layout).toBe('radial');
		/* Too small for districts or an old centre: a grid. */
		expect(layouts.Area({ID: 'small', Kind: 'city', Points: ring(150)}, [], terrain.SettlementKinds.city, sizes).Layout).toBe('grid');
		expect(layouts.Area({ID: 'line', Kind: 'town', Points: [[0, 0], [10, 0]]}, [], kind, sizes).Empty).toBe(true);

		wide = layouts.Grid(area, {Middle: 3});
		narrow = layouts.Grid(area, {Middle: 1});

		expect(Math.max.apply(Math, wide.Streets.map(function (street) {
			return street.Width;
		}))).toBe(area.Width * 3);
		expect(Math.max.apply(Math, narrow.Streets.map(function (street) {
			return street.Width;
		}))).toBe(area.Width);
		/* Each stage a copy: the layout before it as it was. */
		expect(area.Streets).toEqual([]);

		var lots = layouts.Lots(narrow, {Start: 4, Gap: 3, Setback: 2, Spacing: 0.42, Step: 4, Skip: 12});

		expect(lots.Lots.length).toBeGreaterThan(10);
		expect(lots.Random).not.toBe(narrow.Random);
		expect(layouts.Plan(lots)).toEqual({ID: 'test', Kind: 'town', Streets: lots.Streets, Lots: lots.Lots, Walls: [], Gates: [], Towers: []});
		expect(layouts.Walls(lots, {Gate: 6}).Walls).toEqual([]);
		expect(layouts.Walls(Object.assign({}, lots, {Item: Object.assign({}, item, {Walls: true})}), {Gate: 6}).Towers.length).toBe(16);
	});

	it('lays the settlements of a ground of graphs of its own by them (layout/<name> of its Graphs)', function () {
		var item = {ID: 'own', Type: 'settlement', Kind: 'village', Layout: 'grid', Points: ring(200)};
		var graph = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/layout/grid')));
		var own;
		var library;
		var mine;

		/* Its grid twice as wide in its middle streets. */
		graph.blocks.filter(function (block) {
			return block.type === 'Grid';
		})[0].properties = [{key: 'Middle', value: 3}];

		own = terrain.GraphCodeOf({'layout/grid': graph});
		library = terrain.SettlementPlan(item, [item], sizes);
		mine = terrain.SettlementPlan(item, [item], sizes, own);

		expect(typeof own['layout/grid'].Source).toBe('string');
		expect(Math.max.apply(Math, mine.Streets.map(function (street) {
			return street.Width;
		}))).toBeGreaterThan(Math.max.apply(Math, library.Streets.map(function (street) {
			return street.Width;
		})));
	});

	it('draws what a layout gives, of a settlement, a village and an interchange, and BlueprintPreview shows it', async function () {
		var city = layouts.Drawing('ElemenxGraphics/layout/districts');
		var village = layouts.Drawing('ElemenxGraphics/layout/village');
		var clover = layouts.Drawing('ElemenxGraphics/layout/cloverleaf');
		var drawn = null;

		expect(city.Boxes.length).toBeGreaterThan(50);
		expect(city.Lines.some(function (line) {
			return line.Class === 'avenue';
		})).toBe(true);
		expect(village.Boxes.length).toBeGreaterThan(3);
		expect(clover.Lines.filter(function (line) {
			return line.Class === 'ramp';
		}).length).toBe(8);

		var component = Elemenx.Component(unique('LayoutHost'), {$Template: '<div style="width: 400px"><BlueprintPreview Graph="ElemenxGraphics/layout/radial" Height="200" (drawn)="Drawn" /></div>', Drawn: function (event) {
			drawn = event;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return drawn;
		}, 6000);

		expect(drawn.Kind).toBe('layout');
		expect(drawn.Count).toBeGreaterThan(20);
		expect(component.$Element().textContent).toContain('buildings');
	});
});
