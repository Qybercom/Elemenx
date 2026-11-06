import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var world;
var terrain;
var blueprints;

describe('Contract: SceneWorld, the world of a ground as a graph of its steps', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneWorld', 'service:SceneTerrainGenerator', 'service:SceneBiomes', 'service:Blueprints', 'service:ScenePlanet', 'service:Workers']);

		world = Elemenx.Service('SceneWorld');
		terrain = Elemenx.Service('SceneTerrainGenerator');
		blueprints = Elemenx.Service('Blueprints');
	});

	it('makes the land of its steps: the very ground of the same numbers, the things made on it in their order', function () {
		var graph = world.Library({Size: 400, Height: 30, Water: 0.2, Seed: 'w', Scale: 120, Ridges: 0.6, Biomes: ['desert', 'savanna'], Settlements: [{X: 10, Y: -20, Houses: 5}], Scatters: [{Kind: 'grove', Shapes: 'oak, birch', Density: 1.5}]});
		var made = world.Make(graph);
		var plain = terrain.Flat({Size: 400, Height: 30, Water: 0.2, Seed: 'w', Scale: 120, Ridges: 0.6});
		var field = terrain.Flat(made.Ground);

		expect(made.Problems).toEqual([]);
		expect(made.Ground.Biomes).toEqual(['desert', 'savanna']);
		expect(field.Height(33, -71)).toBe(plain.Height(33, -71));
		expect(field.Biome(33, -71).List[0].Name).toMatch(/desert|savanna/);
		expect(made.Things).toEqual([
			{ID: 'world-0', Kind: 'village', Values: {X: 10, Y: -20, Houses: 5, Radius: 30}},
			{ID: 'world-1', Kind: 'grove', Values: {Shapes: ['oak', 'birch'], Density: 1.5}}
		]);

		/* Made once for the same graph. */
		expect(world.Make(JSON.parse(JSON.stringify(graph)))).toBe(made);
	});

	it('lets what comes to a step turned off through, takes numbers from blocks of a generator, and tells what keeps it from running', function () {
		var graph = world.Library({Size: 300, Height: 20, Seed: 'n', Ridges: 0.1});
		var relief = graph.blocks.filter(function (block) {
			return block.type === 'Relief';
		})[0];
		var ground = graph.blocks.filter(function (block) {
			return block.type === 'Ground';
		})[0];
		var number = blueprints.Add(graph, 'Number', {properties: {Value: 77}});
		var made;

		blueprints.Link(graph, [number.id, 'Value'], [ground.id, 'Height']);

		relief.enabled = false;
		made = world.Make(graph);

		expect(made.Ground.Height).toBe(77);
		expect(made.Ground.Ridges).toBeUndefined();
		expect(made.Ground.Size).toBe(300);

		/* No end: nothing made, and why. */
		blueprints.Remove(graph, graph.blocks.filter(function (block) {
			return block.type === 'Terrain';
		})[0].id);

		made = world.Make(graph);

		expect(made.Ground).toBe(null);
		expect(made.Problems[0].Message).toMatch(/Terrain/);
		expect(world.Make(null)).toEqual({Ground: null, Things: [], Problems: []});
	});

	it('takes steps of its own of any Service: a land in, a land out, typed so a land never goes where things are taken', function () {
		var graph = world.Library({Size: 200, Height: 10, Seed: 'own'});
		var end = graph.blocks.filter(function (block) {
			return block.type === 'Terrain';
		})[0];
		var climate = graph.blocks.filter(function (block) {
			return block.type === 'Climate';
		})[0];
		var flood;

		blueprints.Node('Flood', {Graphs: ['world'], Group: 'world', Properties: [{Key: 'Rise', Type: 'number', Value: 0.1}], Inputs: [{Key: 'Land', Type: 'land'}], Outputs: [{Key: 'Land', Type: 'land'}], Compute: function (inputs, properties) {
			return {Land: Object.assign({}, inputs.Land, {Water: inputs.Land.Water + properties.Rise})};
		}});

		flood = blueprints.Add(graph, 'Flood', {properties: {Rise: 0.25}});
		graph.links = graph.links.filter(function (link) {
			return blueprints.PinById(graph, link.p2).Block.id !== end.id;
		});

		blueprints.Link(graph, [climate.id, 'Land'], [flood.id, 'Land']);
		blueprints.Link(graph, [flood.id, 'Land'], [end.id, 'Land']);

		expect(world.Make(graph).Ground.Water).toBeCloseTo(0.6, 9);
		expect(blueprints.Fits('land', 'things')).toBe(false);
		expect(blueprints.Fits('things', 'land')).toBe(false);
	});
	it('cuts its land with steps of its volume: tunnels, caves, overhangs, each one more carve of it', function () {
		var made = world.Make(world.Library({Size: 300, Height: 30, Seed: 'cut', Tunnels: [{Points: [[-50, 0, 5], [50, 0, 5]], Radius: 3}], Caves: [{X: 20, Z: -10, Radius: 60, Halls: 0.8}], Overhangs: {Amount: 5}}));
		var field = terrain.Flat(made.Ground);

		expect(made.Ground.Carves.map(function (carve) {
			return carve.Type;
		})).toEqual(['tunnel', 'caves', 'overhangs']);
		expect(made.Ground.Carves[1]).toMatchObject({Center: [20, -10], Radius: 60, Halls: 0.8});
		expect(field.Density(0, 5, 0)).toBeLessThan(0);
	});
	it('makes the land of a place of a planet exactly as its globe: its heights and coasts, its lands, its neighbour meeting it at their border, the same in a worker', async function () {
		var planets = Elemenx.Service('ScenePlanet');
		var options = {Seed: 'places', Ocean: 0.55, BiomeList: terrain.Biomes({Biomes: ['temperate', 'desert', 'tundra', 'taiga', 'savanna', 'swamp']})};
		var planet = planets.Planet(options);
		var place = {Options: options, Latitude: 21.5, Longitude: -37.25};
		var made = world.Make(world.Library({Size: 4000, Planet: place}));
		var field = terrain.Flat(made.Ground);
		var site = terrain.Site(place);
		var east = site.Direction(4000, 0);
		var beside = terrain.Flat(world.Make(world.Library({Size: 4000, Planet: {Options: options, Latitude: planets.LatLon(east)[0], Longitude: planets.LatLon(east)[1]}})).Ground);
		var x;
		var z;
		var piece;

		for (x = -2000; x <= 2000; x += 250) {
			for (z = -2000; z <= 2000; z += 250) {
				var direction = site.Direction(x, z);
				var sample = planet.Sample(direction);

				expect(field.Height(x, z)).toBeCloseTo(sample.Elevation, 6);
				expect(field.Height(x, z) > 0).toBe(planet.Land(direction));

				if (sample.Land)
					expect(field.Biome(x, z).List[0].Name).toBe(sample.Biome);
			}
		}

		/*
		 * Its border with the place east of it: the same point of the planet the same ground on both sides (Local: where a
		 * direction comes to in a place), the border of one near the border of the other (the planes of the two touch the
		 * planet at their middles: their edges part by less than a metre).
		 */
		var other = terrain.Site({Options: options, Latitude: planets.LatLon(east)[0], Longitude: planets.LatLon(east)[1]});

		for (z = -2000; z <= 2000; z += 500) {
			var across = other.Local(site.Direction(2000, z));

			expect(Math.abs(field.Height(2000, z) - beside.Height(across[0], across[1]))).toBeLessThan(0.01);
			expect(Math.hypot(across[0] + 2000, across[1] - z)).toBeLessThan(1);
		}

		expect(site.Local(site.Direction(1234, -567))[0]).toBeCloseTo(1234, 6);
		expect(site.Local(site.Direction(1234, -567))[1]).toBeCloseTo(-567, 6);

		var turned = terrain.Site(Object.assign({Turn: 30}, place));

		expect(turned.Local(turned.Direction(-800, 1500))[0]).toBeCloseTo(-800, 6);
		expect(turned.Local(turned.Direction(-800, 1500))[1]).toBeCloseTo(1500, 6);

		piece = await new Promise(function (done, failed) {
			terrain.Work().Run('SceneTerrainGenerator', 'Piece', ['Flat', field.Options, null, [0, 0, 256, 8]], function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(Array.from(piece.Positions)).toEqual(Array.from(new Float32Array(field.Chunk(0, 0, 256, 8).Positions)));
	});

	/*
	 * Its roads (Roads): settlements joined along the ground, the bigger by the main type; a passage out of the location
	 * a road to the nearest one, its straight line of the border gone; a road climbs gently where it can.
	 */
	it('joins its settlements and passages by roads along the ground, the class of each by what it joins', function () {
		var ring = function (x, z, r) {
			var points = [];
			var i;

			for (i = 0; i < 10; i++)
				points.push([x + Math.cos(i / 10 * Math.PI * 2) * r, z + Math.sin(i / 10 * Math.PI * 2) * r]);

			return points;
		};
		var sides = [[-900, -900, 900, -900], [900, -900, 900, 900], [900, 900, -900, 900], [-900, 900, -900, -900]];
		var graph = world.Library({Size: 2000, Height: 120, Water: 0, Seed: 'roads', Sketch: {Layers: [{ID: 'towns', Items: [{Type: 'settlement', Kind: 'town', Points: ring(-500, -400, 120)}, {Type: 'settlement', Kind: 'town', Points: ring(450, 300, 120)}, {Type: 'settlement', Kind: 'village', Points: ring(-400, 500, 60)}]}]}, Border: {Points: [[-900, -900], [900, -900], [900, 900], [-900, 900]], Sides: sides, Passages: [{Side: 1, At: 0.2, Width: 6}]}, Roads: true});
		var made = world.Make(graph);
		var roads = made.Things.filter(function (thing) {
			return thing.Kind === 'road';
		});
		var field = terrain.Flat(made.Ground);
		var types = roads.map(function (road) {
			return road.Values.Type;
		});

		/* Two towns by a road; the village and the passage each by a country road to the town nearest them. */
		expect(types.sort()).toEqual(['country', 'country', 'road']);

		roads.forEach(function (road) {
			expect(road.Values.Structures).toBe(true);
			expect(road.Values.Points.length).toBeGreaterThan(1);
		});

		/* The passage starts past its side (x 900 + 120) and ends in the town at 450, 300. */
		var passage = roads.filter(function (road) {
			return road.Values.Points[0][0] > 900;
		})[0];

		expect(passage.Values.Points[passage.Values.Points.length - 1]).toEqual([450, 300]);

		/* Its straight line of the border gone from the sketch. */
		expect(made.Ground.Sketch.Layers.some(function (layer) {
			return layer.Items.some(function (item) {
				return /^border-passage-/.test(item.ID || '');
			});
		})).toBe(false);

		/* Over the ground as gently as it can: the steepest 50 m of a road gentler than those of the straight line. */
		function steepest (points) {
			var most = 0;
			var k;

			for (k = 0; k + 1 < points.length; k++) {
				var a = points[k];
				var b = points[k + 1];
				var n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 50));
				var m;

				for (m = 0; m < n; m++) {
					var x0 = a[0] + (b[0] - a[0]) * m / n;
					var z0 = a[1] + (b[1] - a[1]) * m / n;
					var x1 = a[0] + (b[0] - a[0]) * (m + 1) / n;
					var z1 = a[1] + (b[1] - a[1]) * (m + 1) / n;

					most = Math.max(most, Math.abs(field.Height(x1, z1) - field.Height(x0, z0)) / Math.max(1, Math.hypot(x1 - x0, z1 - z0)));
				}
			}

			return most;
		}

		roads.forEach(function (road) {
			var points = road.Values.Points;

			expect(steepest(points)).toBeLessThan(steepest([points[0], points[points.length - 1]]));
		});

		/* With Rail, a railway beside the main road. */
		expect(world.Make(world.Library({Size: 2000, Height: 120, Water: 0, Seed: 'roads', Sketch: {Layers: [{ID: 'towns', Items: [{Type: 'settlement', Kind: 'town', Points: ring(-500, -400, 120)}, {Type: 'settlement', Kind: 'city', Points: ring(450, 300, 120)}]}]}, Roads: {Rail: true}})).Things.map(function (thing) {
			return thing.Values.Type;
		})).toEqual(['road', 'rail']);
	});
});
