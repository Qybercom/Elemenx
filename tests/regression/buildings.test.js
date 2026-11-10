import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

describe('Contract: Buildings, a building of any size made of its numbers, a model of Models', function () {
	var buildings;
	var models;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneBuildingGenerator', 'service:SceneModels']);

		buildings = Elemenx.Service('SceneBuildingGenerator');
		models = Elemenx.Service('SceneModels');
	});

	/* The bounds of the positions of a model made, in its own units: [x0, y0, z0, x1, y1, z1]; of what lies in a band of height. */
	function bounds (model, from, to) {
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];

		model.Pieces.forEach(function (piece) {
			var p = piece.Geometry.Positions;
			var i;

			for (i = 0; i < p.length; i += 3) {
				if (from !== undefined && (p[i + 1] < from || p[i + 1] > to)) continue;

				low = [Math.min(low[0], p[i]), Math.min(low[1], p[i + 1]), Math.min(low[2], p[i + 2])];
				high = [Math.max(high[0], p[i]), Math.max(high[1], p[i + 1]), Math.max(high[2], p[i + 2])];
			}
		});

		return low.concat(high);
	}

	function colors (model, color) {
		var count = 0;

		model.Pieces.forEach(function (piece) {
			var c = piece.Geometry.Colors || [];
			var i;

			for (i = 0; i < c.length; i += 3) {
				if (Math.abs(c[i] - color[0]) < 1e-3 && Math.abs(c[i + 1] - color[1]) < 1e-3 && Math.abs(c[i + 2] - color[2]) < 1e-3)
					count++;
			}
		});

		return count;
	}

	it('knows its classes, from a shack to a business centre, and the height of each of its floors and its roof', function () {
		var house = buildings.Options({Class: 'house'});
		var tower = buildings.Options({Class: 'tower', Floors: 30});

		expect(buildings.Classes()).toEqual(['shack', 'cabin', 'cottage', 'house', 'villa', 'townhouse', 'shop', 'warehouse', 'factory', 'apartments', 'office', 'tower', 'skyscraper', 'business', 'school', 'church', 'station', 'fuel', 'hangar', 'garage', 'barn', 'watertower', 'parking']);
		expect(house).toMatchObject({Class: 'house', Floors: 2, FloorHeight: 3, Roof: 'hip', Walls: 'brick'});
		expect(house.Height).toBeCloseTo(6 + 8 * 0.35, 6);
		expect(tower.Height).toBeCloseTo(30 * 3.6 + 26 * 0.04 + 12, 6);
		expect(buildings.Options({Class: 'nothing'}).Class).toBe('house');
	});

	it('varies a building of a class by its seed within what the class allows, the same seed the same building', function () {
		var made = [];
		var i;

		for (i = 0; i < 20; i++)
			made.push(buildings.Random({Class: 'apartments'}, 'block-' + i));

		expect(made.every(function (one) {
			return one.Floors >= 5 && one.Floors <= 12;
		})).toBe(true);
		expect(new Set(made.map(function (one) {
			return one.Floors;
		})).size).toBeGreaterThan(3);
		expect(buildings.Random({Class: 'apartments'}, 'block-3')).toEqual(made[3]);
	});

	it('is a model of Models as tall as its Size: a tower steps in at its setbacks, a business centre stands on a wider podium, its windows lit as told', function () {
		var tower = buildings.Define('test-tower', {Class: 'tower', Floors: 30, Setbacks: 2, Crown: 'none', Lit: 0.5});
		var business = buildings.Define('test-business', {Class: 'business', Floors: 30, Podium: 3, Setbacks: 0, Crown: 'none'});
		var shack = buildings.Define('test-shack', {Class: 'shack', Lit: 0});
		var towerModel = models.Make('test-tower');
		var businessModel = models.Make('test-business');
		var all = bounds(towerModel);
		var low = bounds(towerModel, 0.02, 0.2);
		var high = bounds(towerModel, 0.8, 0.95);
		var podium = bounds(businessModel, 0.01, 0.09);
		var above = bounds(businessModel, 0.3, 0.6);

		expect(models.Info('test-tower').Size).toBeCloseTo(tower.Height, 6);
		/* As tall as its Size; what stands on its flat roof (its details) a little over it. */
		expect(all[4]).toBeGreaterThan(0.995);
		expect(all[4]).toBeLessThan(1.02);
		expect(all[1]).toBeGreaterThan(-0.01);
		expect(high[3] - high[0]).toBeLessThan((low[3] - low[0]) * 0.75);
		expect(above[3] - above[0]).toBeLessThan((podium[3] - podium[0]) * 0.7);

		/* Lit about as much as told: none of a shack, half of the tower. */
		var lit = colors(towerModel, [2.2, 1.9, 1.3]);
		var dark = colors(towerModel, [0.16, 0.22, 0.28]);

		expect(lit / (lit + dark)).toBeGreaterThan(0.35);
		expect(lit / (lit + dark)).toBeLessThan(0.65);
		expect(colors(models.Make('test-shack'), [2.2, 1.9, 1.3])).toBe(0);
		expect(shack.Height).toBeLessThan(4);

		['test-tower', 'test-business', 'test-shack'].forEach(function (name) {
			delete models.Recipes[name];
		});
	});

	/*
	 * The buildings of a town beside its houses: a school of wings round a yard open behind (U), a church and its bell
	 * tower, a station, a fuel station, a hangar, a garage, a barn, a water tower, a car park; each a model as tall as its
	 * Size, and of the size its lots are.
	 */
	it('makes the buildings of a town of their own shapes, each as tall as its Size, its wings within its width and depth', function () {
		var terrain;
		var school = buildings.Define('test-school', {Class: 'school', Floors: 2});
		var made = models.Make('test-school');
		var all = bounds(made);
		/* The yard of a U: nothing in the middle of its back half, the wings at its sides and front. */
		var back = bounds({Pieces: made.Pieces.map(function (piece) {
			var p = piece.Geometry.Positions;
			var kept = [];
			var i;

			for (i = 0; i < p.length; i += 3) {
				if (Math.abs(p[i]) < school.Width * 0.15 / school.Height && p[i + 2] < -school.Depth * 0.2 / school.Height && p[i + 1] > 0.05)
					kept.push(p[i], p[i + 1], p[i + 2]);
			}

			return {Geometry: {Positions: kept}};
		})});

		expect(school.Plan).toBe('U');
		expect(all[4]).toBeLessThan(1.001);
		expect((all[3] - all[0]) * school.Height).toBeLessThan(school.Width * 1.1);
		expect(back[0]).toBe(Infinity);

		/* A church: its bell tower over its roof, to the top of the model. */
		var church = buildings.Options({Class: 'church'});

		expect(church.Height).toBeCloseTo(9 * 2.6, 6);

		['school', 'church', 'station', 'fuel', 'hangar', 'garage', 'barn', 'watertower', 'parking'].forEach(function (name) {
			var options = buildings.Define('test-' + name, {Class: name});
			var model = models.Make('test-' + name);
			var box = bounds(model);

			expect(models.Info('test-' + name).Size, name).toBeCloseTo(options.Height, 6);
			expect(box[4], name).toBeGreaterThan(0.95);
			expect(box[4], name).toBeLessThan(1.02);
			expect(box[1], name).toBeGreaterThan(-0.02);

			delete models.Recipes['test-' + name];
		});

		/* Masonry has a cornice, glass none; a house its porch or its wing by chance, as told when told. */
		expect(buildings.Options({Class: 'house'}).Cornice).toBe(true);
		expect(buildings.Options({Class: 'office'}).Cornice).toBe(false);
		expect(buildings.Options({Class: 'tower', Plan: 'U'}).Plan).toBe('rect');

		/* The lots of settlements know the sizes of all of them. */
		Use(['service:SceneTerrainGenerator']);

		terrain = Elemenx.Service('SceneTerrainGenerator');

		[terrain.SettlementKinds, terrain.SettlementDistricts].forEach(function (table) {
			Object.keys(table).forEach(function (kind) {
				Object.keys(Object.assign({}, table[kind].Classes || table[kind], table[kind].Core || {})).forEach(function (name) {
					if (['Block', 'Street', 'Grid', 'Walls'].indexOf(name) >= 0) return;

					expect(terrain.SettlementSizes[name], name).toBeTruthy();
				});
			});
		});

		/* Regression: a church, a station and a car park were laid out larger than Buildings makes them. */
		Object.keys(buildings.Defaults).forEach(function (name) {
			expect(terrain.SettlementSizes[name], name).toEqual([buildings.Defaults[name].Width, buildings.Defaults[name].Depth]);
		});
	});

	/*
	 * The buildings are the graph of a building and the functions it calls, of the resources: every class of it, its
	 * details a piece of their own under its body (what a far level of detail leaves out), each kind of detail where its
	 * class has it: sills and lintels, downpipes and a chimney of a house, air conditioners and the railings of
	 * balconies of apartments, the awning and sign of a shop, what stands on the roof of an office.
	 */
	it('makes every class of the graph of a building, its details a piece of their own, each where its class has it', function () {
		var generator = Elemenx.Service('SceneBuildingGenerator');
		var made = Elemenx.Service('ModelBlueprints');

		function parts (options) {
			return made.Recipe('ElemenxGraphics/building', generator.Parameters(options), {Variant: 0});
		}

		function detail (recipe, test) {
			return recipe.Parts.filter(function (part) {
				return part.Piece === 'detail' && test(part);
			}).length;
		}

		var house = parts({Class: 'house', Seed: 'chimney-1', Roof: 'gable'});
		var apartments = parts({Class: 'apartments', Seed: 'ac-2', Balconies: true});
		var shop = parts({Class: 'shop', Seed: 'shop-3'});
		var office = parts({Class: 'office', Seed: 'roof-4'});
		var plain = parts({Class: 'house', Seed: 'chimney-1', Roof: 'gable', Details: false});

		generator.Classes().forEach(function (name) {
			expect(parts({Class: name, Seed: 'all'}).Parts.length, name).toBeGreaterThan(5);
		});

		expect(house.Pieces).toEqual([{ID: 'detail', Parent: 'body', Pivot: [0, 0, 0], Team: false}]);
		expect(detail(house, function (part) {
			return part.Material === 'stone' && part.Size[1] < 0.2;
		})).toBeGreaterThan(8);
		expect(detail(house, function (part) {
			return part.Shape === 'cylinder' && part.Material === 'metal';
		})).toBe(4);
		expect(detail(house, function (part) {
			return part.Material === 'clinker';
		})).toBeGreaterThan(0);
		expect(detail(apartments, function (part) {
			return part.Material === 'metal' && part.Shape === 'box' && Math.abs(part.Size[1] * generator.Options({Class: 'apartments', Seed: 'ac-2'}).Height - 0.55) < 1e-6;
		})).toBeGreaterThan(3);
		expect(detail(apartments, function (part) {
			return part.Shape === 'cylinder' && part.Size[0] < 0.05;
		})).toBeGreaterThan(10);
		expect(detail(shop, function (part) {
			return part.Material === 'awning';
		})).toBe(1);
		expect(detail(office, function (part) {
			return part.Material === 'metal' && part.At[1] * generator.Options({Class: 'office', Seed: 'roof-4'}).Height > 20;
		})).toBeGreaterThan(0);

		/* With no details told: only what all of them have (sills and lintels), none of its chances. */
		expect(detail(plain, function (part) {
			return part.Material === 'clinker' || part.Shape === 'cylinder';
		})).toBe(0);
	});

	/* The graph of a building made code (blueprint to js): the very parts of its run, many times faster. */
	it('makes the graph of a building code: the very parts of the graph run, for every class and its variants, faster', function () {
		var generator = Elemenx.Service('SceneBuildingGenerator');
		var blueprints = Elemenx.Service('Blueprints');
		var graph = Elemenx.Resources('Blueprints', 'ElemenxGraphics/building');
		var code = Elemenx.Service('ModelBlueprints').Compiled(graph);
		var run = 0;
		var made = 0;
		var started;

		function clean (value) {
			return JSON.parse(JSON.stringify(value));
		}

		expect(typeof code).toBe('function');

		generator.Classes().concat(['house:L', 'school:court', 'hangar:vault', 'barn:gambrel', 'house:dome']).forEach(function (spec) {
			var parts = spec.split(':');
			var options = {Class: parts[0], Lit: 0.4, Seed: 'code'};

			if (parts[1] && /^[LU]$|^court$/.test(parts[1])) options.Plan = parts[1];
			else if (parts[1]) options.Roof = parts[1];

			[0, 3].forEach(function (variant) {
				var parameters = generator.Parameters(options);
				var interpreted;
				var compiled;

				started = performance.now();
				interpreted = blueprints.Calling(function () {
					return blueprints.Compile(graph).Make(parameters, {Variant: variant});
				});
				run += performance.now() - started;

				started = performance.now();
				compiled = code(parameters, {Variant: variant});
				made += performance.now() - started;

				expect(clean(compiled.Parts)).toEqual(clean(interpreted.Parts));
				expect(clean(compiled.Pieces)).toEqual(clean(interpreted.Pieces));
			});
		});

		console.log('building graph: run ' + Math.round(run) + ' ms, code ' + Math.round(made) + ' ms');

		expect(made).toBeLessThan(run / 3);
	});
});

