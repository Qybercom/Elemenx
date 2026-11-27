import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

/* The color of a temperature as the Scene read it: the text of Astronomy.Color, its bytes over 255. */
function colorOf (astronomy, temperature) {
	var text = astronomy.Color(temperature);

	return [1, 3, 5].map(function (at) {
		return parseInt(text.substr(at, 2), 16) / 255;
	});
}

/*
 * Regression: the stars of a sky and of a night, the swarm of a cluster and the rocks of a belt were made in the code of
 * the Scene alone, each number of it there. They are clouds of points of graphs of the library now (blueprints/cloud), and
 * each gives what the code gave: its numbers drawn of the same seed in the same order (Blueprints.Draw), the places the
 * very same, the brightness within the last bit of the graph's own pow.
 */
describe('Regression: the clouds of points of a Scene, graphs of the library', function () {
	var clouds;
	var astronomy;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:CloudBlueprints', 'service:Astronomy', 'service:Blueprints']);

		clouds = Elemenx.Service('CloudBlueprints');
		astronomy = Elemenx.Service('Astronomy');
	}, 60000);

	it('draws the numbers of a seed one after another, any of them at once', function () {
		var blueprints = Elemenx.Service('Blueprints');
		var generator = astronomy.Random('belt:7');
		var i;

		for (i = 0; i < 50; i++)
			expect(blueprints.Draw('belt:7', i)).toBe(generator.Next());
	});

	function starsOf (seed, count, power, scale, low) {
		var generator = astronomy.Random(seed);
		var positions = [];
		var colors = [];
		var i;

		for (i = 0; i < count; i++) {
			var z = generator.Float(-1, 1);
			var angle = generator.Float(0, Math.PI * 2);
			var radius = Math.sqrt(1 - z * z);
			var color = colorOf(astronomy, generator.Pick([3200, 4500, 5600, 6500, 8000, 12000]));

			positions.push(Math.cos(angle) * radius * 50, z * 50, Math.sin(angle) * radius * 50);
			colors.push(color[0], color[1], color[2], Math.pow(generator.Next(), power) * scale + low);
		}

		return {Positions: new Float32Array(positions), Colors: new Float32Array(colors)};
	}

	function close (made, wanted, digits) {
		expect(made.length).toBe(wanted.length);

		Array.prototype.forEach.call(wanted, function (value, index) {
			expect(made[index]).toBeCloseTo(value, digits);
		});
	}

	it('runs the clouds of the library as code, with no walk of their blocks for each point', function () {
		['sky', 'night', 'cluster', 'belt'].forEach(function (name) {
			var graph = Elemenx.Resources('Blueprints', 'ElemenxGraphics/cloud/' + name);

			expect(Elemenx.Service('Blueprints').Code(clouds.Generator(Elemenx.Service('Blueprints').Read(graph)).Graph)).not.toBe(null);
		});
	});

	it('makes the stars of space and of a night as the Scene made them', function () {
		[['ElemenxGraphics/cloud/sky', 'sky', 2600, 3, 0.9, 0.1], ['ElemenxGraphics/cloud/night', 'night', 9000, 6, 1, 0]].forEach(function (told) {
			var made = clouds.Points(told[0]);
			var wanted = starsOf(told[1], told[2], told[3], told[4], told[5]);

			expect(made.Count).toBe(told[2]);
			expect(Array.from(made.Positions)).toEqual(Array.from(wanted.Positions));

			close(made.Colors, wanted.Colors, 6);
		});
	});

	it('makes the swarm of a cluster as the Scene made it', function () {
		var scale = 6 * 0.35 * 63241.077;
		var generator = astronomy.Random('M13');
		var temperatures = [3300, 3800, 4300, 4900, 5400, 6000];
		var made = clouds.Points('ElemenxGraphics/cloud/cluster', {Seed: 'M13', Count: 500, Scale: scale, Temperatures: temperatures.join(', ')});
		var positions = [];
		var colors = [];
		var i;

		for (i = 0; i < 500; i++) {
			var u = generator.Float(0.02, 0.97);
			var r = scale / Math.sqrt(Math.pow(u, -2 / 3) - 1);
			var z = generator.Float(-1, 1);
			var angle = generator.Float(0, Math.PI * 2);
			var color = colorOf(astronomy, generator.Pick(temperatures));

			positions.push(Math.cos(angle) * Math.sqrt(1 - z * z) * r, z * r, Math.sin(angle) * Math.sqrt(1 - z * z) * r);
			colors.push(color[0], color[1], color[2], Math.pow(generator.Next(), 3) * 0.75 + 0.08);
		}

		expect(made.Count).toBe(500);
		expect(Array.from(made.Positions)).toEqual(Array.from(new Float32Array(positions)));

		close(made.Colors, new Float32Array(colors), 6);
	});

	it('makes the rocks of a belt as the Scene made them', function () {
		var colors = [[0.5, 0.4, 0.3], [0.2, 0.3, 0.4], [0.9, 0.8, 0.7]];
		var generator = astronomy.Random('belt-1:4');
		var made = clouds.Points('ElemenxGraphics/cloud/belt', {Seed: 'belt-1:4', Count: 300, Inner: 1.5, Outer: 2.5, Tilt: 3, Radius: 6371, Unit: 0.001, Factor: 0.4, Body: 2, Rocks: 1.5, Colors: colors});
		var i;

		expect(made.Count).toBe(300);

		for (i = 0; i < 300; i++) {
			var wanted = {
				Distance: generator.Float(1.5, 2.5) * 6371 * 0.001,
				Eccentricity: generator.Float(0, 0.12),
				Inclination: 3 + generator.Float(-6, 6),
				Node: generator.Float(0, 360),
				Periapsis: generator.Float(0, 360),
				Anomaly: generator.Float(0, 360),
				Size: generator.Float(0.03, 0.11) * 0.4 * 2 * 1.5,
				AxisX: generator.Float(-1, 1),
				AxisY: generator.Float(-1, 1),
				AxisZ: generator.Float(-1, 1),
				Spin: generator.Float(0.5, 3),
				Color: generator.Pick(colors)
			};

			['Distance', 'Eccentricity', 'Inclination', 'Node', 'Periapsis', 'Anomaly', 'AxisX', 'AxisY', 'AxisZ', 'Spin'].forEach(function (key) {
				expect(made.Fields[key][i]).toBe(wanted[key]);
			});

			expect(made.Sizes[i]).toBe(Math.fround(wanted.Size));
			expect(Array.from(made.Colors.slice(i * 4, i * 4 + 4))).toEqual(Array.from(new Float32Array(wanted.Color.concat([1]))));
		}
	});
});
