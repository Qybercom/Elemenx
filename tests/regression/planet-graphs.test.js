import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';
import planetSource from '../../libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.js?raw';
import galaxySource from '../../libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.js?raw';
import terrainSource from '../../libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.js?raw';
import sceneSource from '../../libraries/ElemenxGraphics/components/Scene/Scene.js?raw';
import vehiclesSource from '../../libraries/ElemenxGraphics/traits/SceneVehicles/SceneVehicles.js?raw';

var owned = [];

function hash (value) {
	var text = JSON.stringify(value);
	var h = 5381;
	var i;

	for (i = 0; i < text.length; i++)
		h = (h * 33 + text.charCodeAt(i)) >>> 0;

	return h.toString(16) + ':' + text.length;
}

function smooth (from, to, value) {
	var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

	return t * t * (3 - 2 * t);
}

/*
 * Regression: logic of the generation of worlds and of their looks in the code alone, each branch and number of it in
 * JavaScript, none of it in the graphs an author changes nor in the IR other languages run: how good a place is to live
 * (planet/settle), the density of the stars of each kind of galaxy (galaxy/density), the height of the ground of a body
 * (body/elevation), the season of the sun (weather/season), how a warp and a jump look (vehicles/travel-look). Each is a
 * graph of the library now, and the code gives what it gave: the very same where only + - * / and sqrt are (the
 * settlements, the bodies), the last bit apart at most where the graph's own exp, pow, sin and cos are.
 */
describe('Regression: the generation of worlds and their looks, graphs of the library', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Scene', 'SceneObject', 'service:ScenePlanet', 'service:SceneTerrainGenerator', 'service:GalaxyData', 'service:Blueprints']);
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('raises the ground of a body of its graph, the very heights it had', function () {
		var terrain = Elemenx.Service('SceneTerrainGenerator');
		var out = {};

		[['moon', {Radius: 1737, Seed: 3.7, Type: 'moon'}], ['ocean', {Radius: 6371, Seed: 1.3, Type: 'terran', Ocean: 0.6}], ['lava', {Radius: 3000, Seed: 5.1, Type: 'lava', Height: 9}]].forEach(function (pair) {
			var field = terrain.Sphere(pair[1]);
			var values = [];
			var i;

			for (i = 0; i < 500; i++) {
				var y = 1 - (i + 0.5) / 250;
				var r = Math.sqrt(Math.max(0, 1 - y * y));
				var a = i * 2.39996;

				values.push(field.Elevation([Math.cos(a) * r, y, Math.sin(a) * r]));
			}

			out[pair[0]] = hash(values);
		});

		expect(out).toEqual({moon: '10d55050:9799', ocean: '92ce62c4:4643', lava: 'ea6cb998:9291'});
		expect(terrainSource).not.toContain('noise.Ridge(q[0] * 18 + 3');
		expect(terrainSource).not.toContain("type === 'rocky' || type === 'desert' || type === 'dwarf' || type === 'moon'");
		expect(planetSource).not.toContain('Math.abs(sample.Celsius - 16) / 16');
	});

	it('makes the tectonic plates of a planet of its graph, the very plates of its seed', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var blueprints = Elemenx.Service('Blueprints');

		/* The plates as the code made them, the numbers of its seed of the chain it had. */
		function before (seed, count, ocean) {
			var state = 2166136261;
			var plates = [];
			var i;

			function random () {
				var text = seed + ':' + state;
				var value = 2166136261;
				var k;

				for (k = 0; k < text.length; k++)
					value = Math.imul(value ^ text.charCodeAt(k), 16777619);

				state = value >>> 0;

				return (state % 100000) / 100000;
			}

			function normalize (a) {
				var length = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1;

				return [a[0] / length, a[1] / length, a[2] / length];
			}

			for (i = 0; i < count; i++) {
				var turn = random() * 1.2;
				var y = 1 - (i + 0.5) / count * 2;
				var around = Math.sqrt(Math.max(0, 1 - y * y));
				var angle = i * 2.39996 + turn;
				var middle = normalize([Math.cos(angle) * around + (random() - 0.5) * 0.4, y + (random() - 0.5) * 0.4, Math.sin(angle) * around + (random() - 0.5) * 0.4]);
				var east = Math.abs(middle[1]) > 0.9999 ? [0, 0, -1] : normalize([middle[2], 0, -middle[0]]);
				var north = normalize([middle[1] * east[2] - middle[2] * east[1], middle[2] * east[0] - middle[0] * east[2], middle[0] * east[1] - middle[1] * east[0]]);
				var way = random() * Math.PI * 2;
				var speed = 0.3 + random() * 0.7;

				plates.push({ID: i, Middle: middle, Motion: [0, 1, 2].map(function (k) {
					return (east[k] * Math.cos(way) + north[k] * Math.sin(way)) * speed;
				}), Oceanic: random() < ocean * 0.85});
			}

			return plates;
		}

		[['terra', 12, 0.7], ['dry', 7, 0.1], [3.5, 20, 0.5]].forEach(function (one) {
			var made = planets.Planet({Seed: one[0], Plates: one[1], Ocean: one[2]}).Plates;
			var told = before(String(one[0]), one[1], one[2]);

			expect(made.length).toBe(one[1]);

			made.forEach(function (plate, index) {
				expect(plate.ID).toBe(index);
				expect(plate.Oceanic).toBe(told[index].Oceanic);

				[0, 1, 2].forEach(function (k) {
					expect(Math.abs(plate.Middle[k] - told[index].Middle[k])).toBeLessThan(1e-14);
					expect(Math.abs(plate.Motion[k] - told[index].Motion[k])).toBeLessThan(1e-14);
				});
			});
		});

		/* The numbers of a seed one after another, of any of them first. */
		expect([0, 1, 2].map(function (k) {
			return blueprints.Chain('fresh-' + k, 0);
		})).toEqual([0, 1, 2].map(function (k) {
			var text = 'fresh-' + k + ':2166136261';
			var value = 2166136261;
			var i;

			for (i = 0; i < text.length; i++)
				value = Math.imul(value ^ text.charCodeAt(i), 16777619);

			return ((value >>> 0) % 100000) / 100000;
		}));
		expect(planetSource).not.toContain('Spiral(i, count, random() * 1.2)');
	});

	it('tells the plate of a point of a planet of its graph, its border and how the two meet, as the code told them', function () {
		var noise = Elemenx.Service('Noise');

		[['terra', 12], ['many', 30]].forEach(function (one) {
			var planet = Elemenx.Service('ScenePlanet').Planet({Seed: one[0], Plates: one[1]});
			var warp = noise.Make({Type: 'simplex', Seed: one[0] + '-warp', Fractal: 'fbm', Octaves: 3});
			var plates = planet.Plates;
			var apart = 0;
			var i;

			function dot (a, b) {
				return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
			}

			function normalize (a) {
				var length = Math.sqrt(dot(a, a)) || 1;

				return [a[0] / length, a[1] / length, a[2] / length];
			}

			function angle (a, b) {
				return Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
			}

			/* The plate of a point as the code told it. */
			function before (p) {
				var q = normalize([p[0] + (warp.At(p[0] * 3, p[1] * 3, p[2] * 3) - 0.5) * 0.35, p[1] + (warp.At(p[0] * 3 + 7, p[1] * 3, p[2] * 3) - 0.5) * 0.35, p[2] + (warp.At(p[0] * 3, p[1] * 3 + 7, p[2] * 3) - 0.5) * 0.35]);
				var first = null;
				var second = null;

				plates.forEach(function (plate) {
					var near = dot(q, plate.Middle);

					if (!first || near > first.Near) {
						second = first;
						first = {Plate: plate, Near: near};
					}
					else if (!second || near > second.Near) {
						second = {Plate: plate, Near: near};
					}
				});

				var normal = normalize([0, 1, 2].map(function (k) {
					return second.Plate.Middle[k] - first.Plate.Middle[k];
				}));

				return {ID: first.Plate.ID, Other: second.Plate.ID, Boundary: (angle(q, second.Plate.Middle) - angle(q, first.Plate.Middle)) / 2 * planet.Radius, Push: dot([0, 1, 2].map(function (k) {
					return first.Plate.Motion[k] - second.Plate.Motion[k];
				}), normal)};
			}

			for (i = 0; i < 600; i++) {
				var y = 1 - (i + 0.5) / 300;
				var r = Math.sqrt(Math.max(0, 1 - y * y));
				var p = [Math.cos(i * 2.39996) * r, y, Math.sin(i * 2.39996) * r];
				var made = planet.Plate(p);
				var told = before(p);

				/* Two plates as near to a hair: either. */
				if (made.ID !== told.ID || made.Other.ID !== told.Other) {
					apart++;

					expect(Math.abs(told.Boundary)).toBeLessThan(1e-6);

					continue;
				}

				expect(Math.abs(made.Boundary - told.Boundary)).toBeLessThan(1e-7);
				expect(Math.abs(made.Push - told.Push)).toBeLessThan(1e-12);
				expect(made.Oceanic).toBe(plates[told.ID].Oceanic);
			}

			expect(apart).toBe(0);
		});

		expect(planetSource).not.toContain('var near = dot(q, one.Middle);');
	});

	it('brings the rain from up the wind of its graph, the very climate the loop of the code gave', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var rough = JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/rough')));
		var end = rough.blocks.filter(function (block) {
			return block.type === 'Result';
		})[0];
		var paint = [{Type: 'land', Edge: 300, Points: [[10, 10], [10, 40], [40, 40], [40, 10]]}, {Type: 'sea', Points: [[-20, 100], [5, 130], [-30, 150]]}];
		var out = {};

		/* Its own land roughly: land everywhere up the wind, drier than the library's. */
		rough.blocks.push({id: 'always', type: 'Number', x: 0, y: 0, properties: [{key: 'Value', value: 0.7}]});

		rough.links = rough.links.filter(function (link) {
			return link.p2.indexOf(end.id + '-in-') !== 0;
		}).concat([{id: 'always-link', p1: 'always-out-Value', p2: end.id + '-in-Value', kind: 'value'}]);

		[['terra', {Seed: 'terra'}], ['paint', {Seed: 'paint', Paint: paint}], ['own', {Seed: 'terra', RoughGraph: rough}]].forEach(function (pair) {
			var planet = planets.Planet(pair[1]);
			var values = [];
			var i;

			for (i = 0; i < 400; i++) {
				var y = 1 - (i + 0.5) / 200;
				var r = Math.sqrt(1 - y * y);
				var made = planet.Climate([Math.cos(i * 2.39996) * r, y, Math.sin(i * 2.39996) * r]);

				values.push(made.Celsius, made.Moisture);
			}

			out[pair[0]] = hash(values);
		});

		/* The climate the loop of the code gave, to the bit: its own graph of the land roughly too (what was drawn: of the kernel since, the last bit apart). */
		expect(out).toEqual({terra: 'a080c512:13315', paint: '85dfb7fc:13263', own: '49c741cb:12726'});
		expect(planetSource).not.toContain('var there = roughly(back);');
		/* Its own graph of the land roughly goes to its workers in the walk up the wind (ReliefSources.Upwind). */
		expect(planets.GraphSources({RoughGraph: rough}).Upwind.Source).toBeTruthy();
	});

	it('carves the valley of a river and bends it of its graph and the kernel, the very ground and ways the code gave', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var geometry = Elemenx.Service('Geometry');
		var values = [];
		var ways = [];
		var carved = 0;
		var planet;
		var i;

		/* A river and a tributary into it, of points some 20 km apart. */
		function line (from, to, n) {
			var made = [];
			var k;

			for (k = 0; k <= n; k++)
				made.push(planets.Direction(from[0] + (to[0] - from[0]) * k / n, from[1] + (to[1] - from[1]) * k / n));

			return made;
		}

		var main = line([40, 10], [44, 18], 40);
		var side = line([47, 12], [42, 14], 30);

		planet = planets.Planet({Seed: 'valleys', Rivers: [{Points: main, Flow: main.map(function (p, k) {
			return 50 + k * 30;
		})}, {Points: side, Flow: side.map(function (p, k) {
			return 20 + k * 5;
		})}]});

		for (i = 0; i < 2000; i++) {
			var p = planets.Direction(39 + (i % 50) * 0.18, 9 + Math.floor(i / 50) * 0.25);
			var river = planet.River(p);

			values.push(planet.Elevation(p, 0.05), river ? river.Far : -1);

			if (river && river.Far < planets.RiverValley(river.Flow))
				carved++;
		}

		for (i = 0; i < 200; i++)
			ways.push(planet.RiverAt(0, Math.floor(i / 5), (i % 5) / 5).Direction);

		/* As the code made them, to the bit (each point within a valley some 39 of them). */
		expect(carved).toBe(39);
		expect({Ground: hash(values), Ways: hash(ways)}).toEqual({Ground: '97430ec6:67689', Ways: '2a9cac6f:12093'});
		/* No river near: none, of the kernel too. */
		expect(geometry.River([0], 1, 0, 0, 6371, 0.015, 11).Far).toBe(Infinity);
		expect(planetSource).not.toContain('function smoothstep (from, to, value)');
	});

	it('changes the relief by the brushes of its edits of its graph and the kernel, in their order, as the code did', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var edits = [
			{Type: 'raise', Points: [[20, 30], [22, 34], [21, 38]], Radius: 150, Amount: 900},
			{Type: 'lower', Points: [[23, 33]], Radius: 80, Amount: 400},
			{Type: 'flatten', Points: [[19, 32], [24, 36]], Radius: 60, Height: 250},
			{Type: 'smooth', Points: [[21, 31], [21, 37]], Radius: 120, Amount: 0.6},
			{Type: 'smooth', Points: [[25, 30]], Radius: 90},
			{Type: 'other', Points: [[22, 32]], Radius: 200, Amount: 5000}
		];
		var edited = planets.Planet({Seed: 'edits', Edits: edits});
		var plain = planets.Planet({Seed: 'edits'});
		var flat = planets.Planet({Seed: 'edits', Edits: [edits[2]]});
		var values = [];
		var changed = 0;
		var i;

		for (i = 0; i < 2000; i++) {
			var p = planets.Direction(17 + (i % 50) * 0.2, 27 + Math.floor(i / 50) * 0.3);
			var made = edited.Elevation(p, 0.05);

			values.push(made);

			if (made !== plain.Elevation(p, 0.05))
				changed++;
		}

		/* The heights the code gave (a 5e-13 m apart at most: the own acos of the kernel), 567 of the points changed. */
		expect(changed).toBe(567);
		expect(hash(values)).toBe('62d76954:38472');
		/* On the path of a flatten, its Height itself. */
		expect(flat.Elevation(planets.Direction(19, 32), 0.05)).toBeCloseTo(250, 9);
		expect(planetSource).not.toContain("if (edit.Type === 'raise') {");
	});

	it('reads what a developer drew on a planet of the kernel of Geometry and its table, as the code read it', function () {
		var planets = Elemenx.Service('ScenePlanet');
		var paint = [
			{Type: 'land', Edge: 300, Points: [[10, 10], [10, 40], [40, 40], [40, 10]]},
			{Type: 'sea', Points: [[15, 15], [15, 25], [25, 25], [25, 15]]},
			{Type: 'mountains', Width: 120, Height: 5000, Points: [[12, 12], [30, 35]]},
			{Type: 'mountains', Points: [[35, 20]]},
			{Type: 'rift', Points: [[20, 30], [38, 30]]},
			{Type: 'river', Width: 8, Points: [[28, 12], [36, 22]]},
			{Type: 'climate', Temperature: 12, Moisture: -0.3, Points: [[10, 25], [10, 40], [30, 40], [30, 25]]},
			{Type: 'biome', Biome: 'desert', Points: [[32, 12], [32, 20], [38, 20], [38, 12]]}
		];
		var planet = planets.Planet({Seed: 'paint', Paint: paint, Regions: [{Rule: 'hills', Edge: 150, Points: [[11, 11], [11, 20], [20, 20], [20, 11]]}], Rules: {Biomes: {}}});
		var values = [];
		var deserts = 0;
		var i;

		for (i = 0; i < 2000; i++) {
			var made = planet.Sample(planets.Direction(8 + (i % 50) * 0.7, 8 + Math.floor(i / 50) * 0.8), 0.5);

			values.push(made.Elevation, made.Celsius, made.Moisture);

			if (made.Biome === 'desert')
				deserts++;
		}

		/* As the code gave them (4e-11 apart at most: the own pow and acos of the kernel), its desert drawn where it was. */
		expect(deserts).toBe(129);
		expect(hash(values)).toBe('e58c952:95431');
		expect(planets.Paint.Mountains).toEqual({Width: 150, Least: 1, Reach: 1, Amount: 4000, Of: 'Height', Power: 1.5});
		expect(planetSource).not.toContain('function within (p, stroke)');
		expect(planetSource).not.toContain('Math.pow(1 - near / width, 1.5)');
	});

	it('gives the density of the stars of each kind of galaxy of its graph, denser in its middle', function () {
		var galaxies = Elemenx.Service('GalaxyData');

		galaxies.Kinds().forEach(function (kind) {
			var data = galaxies.Make({Seed: 'graphs', Kind: kind});
			var r = data.Manifest.Radius;
			var middle = galaxies.Density(data, [r * 0.02, 0, r * 0.01]);
			var edge = galaxies.Density(data, [r * 0.9, 0, 0]);

			expect(middle, kind).toBeGreaterThan(edge);
			expect(edge, kind).toBeGreaterThan(0);
		});

		expect(galaxySource).not.toContain("if (m.Kind === 'elliptical') {");
	});

	it('tells the season and how a warp looks of their graphs', async function () {
		var blueprints = Elemenx.Service('Blueprints');
		var look = blueprints.Code(Elemenx.Resources('Blueprints', 'ElemenxGraphics/vehicles/travel-look'));
		var ready = null;
		var host = Elemenx.Component(unique('GraphsHost'), {$Template: '<div style="width: 200px; height: 120px"><Scene Paused="true" Quality="low" (ready)="Ready"></Scene></div>', Ready: function (space) {
			ready = space;
		}})();
		var engine;
		var made;

		owned.push(host);

		document.getElementById('mount').appendChild(host.$Element());

		await waitFor(function () {
			return ready;
		}, 8000);

		engine = ready.Engine();
		ready.Season = 'winter';
		made = engine.SeasonNow({Latitude: 50, DayOfYear: 20, YearDays: 365});

		expect(made).toEqual({Warmth: -1, Rising: false, Bare: 1, Turn: 1, Blossom: 0, Dry: 0.4, Snow: 1});

		ready.Season = '';
		made = engine.SeasonNow({Latitude: 45, DayOfYear: 172, YearDays: 365});

		expect(made.Warmth).toBeCloseTo(1, 12);
		expect(made.Dry).toBeCloseTo(smooth(0.7, 1, made.Warmth) * 0.3 + (made.Rising ? 0 : smooth(0.3, -0.4, made.Warmth) * 0.4), 12);

		/* Into a warp, half way: its curves as they were; a jump in it, its sway of its time. */
		expect(look.Run({}, {Phase: 0, Warp: 1, T: 0.5, Time: 0})).toEqual({Stretch: smooth(0.3, 1, 0.5), Tunnel: smooth(0.8, 1, 0.5) * 0.7, Flash: smooth(0.9, 1, 0.5) * 0.9, Shake: 0.5 * 0.35, Wide: smooth(0.3, 1, 0.5) * 0.3, Lag: 0.5 * 0.15, Pace: 0.15 + 2.5 * 0.5 * 0.5});
		expect(look.Run({}, {Phase: 1, Warp: 0, T: 0, Time: 0.3}).Lag).toBeCloseTo(0.08 + Math.sin(0.6) * 0.35, 12);
		expect(look.Run({}, {Phase: 2, Warp: 1, T: 0.25, Time: 0}).Tunnel).toBe(1 - smooth(0, 0.18, 0.25));

		expect(sceneSource).not.toContain('Snow: smooth(-0.55, -0.92, warmth) * cold');
		expect(vehiclesSource).not.toContain('look = warp ? {');
	}, 30000);
});
