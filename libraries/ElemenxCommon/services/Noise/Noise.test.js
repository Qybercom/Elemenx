import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var noise;

/* Points of space, the same every run. */
function points (count, spread) {
	var list = [];
	var i;

	for (i = 0; i < count; i++)
		list.push([Math.sin(i * 12.9898) * spread, Math.cos(i * 4.1414) * spread * 0.5, Math.sin(i * 78.233 + 1) * spread]);

	return list;
}

describe('Contract: Noise, the noise of space by any algorithm, the same in a shader', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Noise', 'service:Math', 'service:Renderer']);

		noise = Elemenx.Service('Noise');
	});

	it('is Math.Noise to the bit as value noise with fbm or ridged octaves, the same seed giving the same numbers', function () {
		var math = Elemenx.Service('Math').Noise('ground');
		var fbm = noise.Make({Type: 'value', Seed: 'ground', Fractal: 'fbm', Octaves: 6});
		var ridged = noise.Make({Type: 'value', Seed: 'ground', Fractal: 'ridged', Octaves: 5});

		points(50, 300).forEach(function (p) {
			expect(fbm.At(p[0], p[1], p[2])).toBe(math.Fbm(p[0], p[1], p[2], 6));
			expect(ridged.At(p[0], p[1], p[2])).toBe(math.Ridge(p[0], p[1], p[2], 5));
		});
	});

	/*
	 * Regression: simplex noise made arrays and a function at each point, half the time of the picture of a square of a
	 * planet (some 650 ms each); made of none now, it must give the very numbers it gave, warped or not.
	 */
	it('gives the very numbers of simplex noise it gave before it made no arrays, warped and ridged as well', function () {
		function simplexBefore (x, y, z) {
			var G3 = 1 / 6;
			var s = (x + y + z) * (1 / 3);
			var i = Math.floor(x + s);
			var j = Math.floor(y + s);
			var k = Math.floor(z + s);
			var t = (i + j + k) * G3;
			var x0 = x - (i - t);
			var y0 = y - (j - t);
			var z0 = z - (k - t);
			var total = 0;
			var order = x0 >= y0 ? y0 >= z0 ? [1, 0, 0, 1, 1, 0] : x0 >= z0 ? [1, 0, 0, 1, 0, 1] : [0, 0, 1, 1, 0, 1] : y0 < z0 ? [0, 0, 1, 0, 1, 1] : x0 < z0 ? [0, 1, 0, 0, 1, 1] : [0, 1, 0, 1, 1, 0];

			[[0, 0, 0, 0], [order[0], order[1], order[2], G3], [order[3], order[4], order[5], 2 * G3], [1, 1, 1, 3 * G3]].forEach(function (corner) {
				var dx = x0 - corner[0] + corner[3];
				var dy = y0 - corner[1] + corner[3];
				var dz = z0 - corner[2] + corner[3];
				var falloff = 0.6 - dx * dx - dy * dy - dz * dz;

				if (falloff > 0) {
					falloff *= falloff;
					total += falloff * falloff * noise.Gradient(noise.Hash(i + corner[0], j + corner[1], k + corner[2]), dx, dy, dz);
				}
			});

			return Math.max(0, Math.min(1, total * 16 + 0.5));
		}

		var ridged = noise.Make({Type: 'simplex', Seed: 'ranges', Fractal: 'ridged', Octaves: 7, Gain: 0.5, Warp: {Amount: 0.5, Scale: 0.4, Octaves: 2}});
		var whole = noise.Whole({Type: 'simplex', Seed: 'ranges', Fractal: 'ridged', Octaves: 7, Gain: 0.5, Warp: {Amount: 0.5, Scale: 0.4, Octaves: 2}});
		var made = [];

		function octaves (x, y, z, count, fractal) {
			var total = 0;
			var amplitude = 0.5;
			var weight = 0;
			var octave;

			for (octave = 0; octave < count; octave++) {
				var n = simplexBefore(x, y, z);

				if (fractal === 'ridged')
					n = 1 - Math.abs(n * 2 - 1);

				total += n * amplitude;
				weight += amplitude;
				x = x * whole.Lacunarity + whole.Shift[0];
				y = y * whole.Lacunarity + whole.Shift[1];
				z = z * whole.Lacunarity + whole.Shift[2];
				amplitude *= whole.Gain;
			}

			return total / weight;
		}

		points(2000, 40).concat(points(200, 0.7)).forEach(function (p) {
			var q = [p[0] + whole.Seed, p[1] + whole.Seed, p[2] + whole.Seed];
			var warp = [0, 1, 2].map(function (axis) {
				return octaves(q[0] * 0.4 + axis * 5.2, q[1] * 0.4 + axis * 1.3, q[2] * 0.4 + axis * 2.8, 2, 'fbm');
			});

			expect(noise.Simplex(p[0], p[1], p[2])).toBe(simplexBefore(p[0], p[1], p[2]));
			expect(ridged.At(p[0], p[1], p[2])).toBe(octaves(q[0] + (warp[0] * 2 - 1) * 0.5, q[1] + (warp[1] * 2 - 1) * 0.5, q[2] + (warp[2] * 2 - 1) * 0.5, 7, 'ridged'));

			made.push(noise.Simplex(p[0], p[1], p[2]));
		});

		/* Not of one number: the noise varies. */
		expect(Math.max.apply(Math, made) - Math.min.apply(Math, made)).toBeGreaterThan(0.5);
	});

	it('gives each type within 0 and 1, of its seed, smooth where it should be', function () {
		noise.Types().forEach(function (type) {
			var one = noise.Make({Type: type, Seed: 'a', Scale: 8});
			var other = noise.Make({Type: type, Seed: 'b', Scale: 8});
			var values = points(300, 200).map(function (p) {
				return one.At(p[0], p[1], p[2]);
			});
			var mean = values.reduce(function (sum, value) {
				return sum + value;
			}, 0) / values.length;

			expect(values.every(function (value) {
				return value >= 0 && value <= 1;
			})).toBe(true);
			expect(Math.abs(mean - (type === 'worley' ? 0.4 : 0.5))).toBeLessThan(type === 'worley' ? 0.25 : 0.1);
			expect(one.At(10, 2, 30)).toBe(noise.Make({Type: type, Seed: 'a', Scale: 8}).At(10, 2, 30));
			expect(points(20, 200).some(function (p) {
				return one.At(p[0], p[1], p[2]) !== other.At(p[0], p[1], p[2]);
			})).toBe(true);

			/* All but white noise go smoothly: a step of a hundredth of a feature changes little. */
			if (type !== 'white' && !(type === 'worley'))
				expect(Math.abs(one.At(10.01, 2, 30) - one.At(10, 2, 30))).toBeLessThan(0.02);
		});
	});

	it('tiles: what repeats after Tile features along each axis, octaves and all', function () {
		['value', 'perlin', 'worley', 'white'].forEach(function (type) {
			var tiled = noise.Make({Type: type, Seed: 's', Scale: 10, Tile: [4, 4, 4], Fractal: 'fbm', Octaves: 3});

			points(30, 100).forEach(function (p) {
				expect(tiled.At(p[0] + 40, p[1], p[2] - 40)).toBeCloseTo(tiled.At(p[0], p[1], p[2]), 9);
			});
		});
	});

	it('reads the cells of worley noise: the nearest point, the next, the edge between them, a number for each cell', function () {
		var spec = {Type: 'worley', Seed: 'c'};
		var first = noise.Make(Object.assign({Cell: {Return: 'f1'}}, spec));
		var second = noise.Make(Object.assign({Cell: {Return: 'f2'}}, spec));
		var edge = noise.Make(Object.assign({Cell: {Return: 'edge'}}, spec));
		var cell = noise.Make(Object.assign({Cell: {Return: 'cell', Jitter: 0}}, spec));

		points(40, 20).forEach(function (p) {
			var f1 = first.At(p[0], p[1], p[2]);
			var f2 = second.At(p[0], p[1], p[2]);

			expect(f2).toBeGreaterThanOrEqual(f1);

			if (f2 < 1)
				expect(edge.At(p[0], p[1], p[2])).toBeCloseTo(f2 - f1, 9);
		});

		/* With no jitter the points are the middles of the cells: all of a cell is one number. */
		expect(cell.At(3.1, 4.2, 5.3)).toBe(cell.At(3.4, 4.3, 5.2));
		expect(cell.At(3.1, 4.2, 5.3)).not.toBe(cell.At(6.4, 4.3, 5.2));
	});

	it('does what follows: terraces, a power, the other way round, a range; blends of noises, a grid, a gradient and a curl', function () {
		var plain = noise.Make({Type: 'perlin', Seed: 'p', Scale: 5});
		var shaped = noise.Make({Type: 'perlin', Seed: 'p', Scale: 5, Terrace: {Steps: 4, Sharp: 1}, Invert: true, Range: [-10, 10]});
		var blend = noise.Make({Combine: 'mask', Of: [{Type: 'value', Seed: 1}, {Type: 'simplex', Seed: 2}], Mask: {Type: 'perlin', Seed: 3}});
		var most = noise.Make({Combine: 'max', Of: [{Type: 'value', Seed: 1}, {Type: 'simplex', Seed: 2}]});
		var grid = plain.Grid({Width: 8, Height: 4, X: 2, Y: 3, Step: 0.5});
		var curl = plain.Curl(1, 2, 3);
		var e = 0.01;
		var divergence = (plain.Curl(1 + e, 2, 3)[0] - plain.Curl(1 - e, 2, 3)[0] + plain.Curl(1, 2 + e, 3)[1] - plain.Curl(1, 2 - e, 3)[1] + plain.Curl(1, 2, 3 + e)[2] - plain.Curl(1, 2, 3 - e)[2]) / (2 * e);

		points(30, 50).forEach(function (p) {
			var value = shaped.At(p[0], p[1], p[2]);
			var stepped = (1 - (value + 10) / 20) * 4;

			expect(value).toBeGreaterThanOrEqual(-10);
			expect(value).toBeLessThanOrEqual(10);
			expect(Math.abs(stepped - Math.round(stepped))).toBeLessThan(0.05);
			expect(most.At(p[0], p[1], p[2])).toBe(Math.max(noise.Make({Type: 'value', Seed: 1}).At(p[0], p[1], p[2]), noise.Make({Type: 'simplex', Seed: 2}).At(p[0], p[1], p[2])));
			expect(blend.At(p[0], p[1], p[2])).toBeGreaterThanOrEqual(0);
		});

		expect(grid.length).toBe(32);
		expect(grid[2 * 8 + 5]).toBeCloseTo(plain.At(2 + 5 * 0.5, 0, 3 + 2 * 0.5), 6);
		expect(curl.length).toBe(3);
		expect(Math.abs(divergence)).toBeLessThan(0.05);
	});

	/*
	 * The same numbers in a shader: GLSL of a spec drawn to a float target, against At. Regression: under the load of the
	 * whole suite (its shader compiled while other files bake planets) longer than the 15 s a test has: 90 s.
	 */
	it('writes a spec as a function of a shader that gives the same numbers as the page', function () {
		var renderer = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = renderer.GL;
		var floats = gl.getExtension('EXT_color_buffer_float');
		var specs = [
			{Type: 'value', Seed: 'ground', Fractal: 'fbm', Octaves: 6, Scale: 30},
			{Type: 'perlin', Seed: 'q', Fractal: 'ridged', Octaves: 4, Scale: 20, Warp: {Amount: 0.8, Scale: 0.5}},
			{Type: 'simplex', Seed: 3, Fractal: 'billow', Octaves: 3, Scale: 12},
			{Type: 'worley', Seed: 'w', Scale: 9, Tile: [6, 6, 6], Cell: {Return: 'edge', Distance: 'manhattan'}},
			{Type: 'white', Seed: 'x', Scale: 3},
			{Combine: 'mask', Of: [{Type: 'value', Seed: 1, Scale: 8}, {Type: 'simplex', Seed: 2, Scale: 8}], Mask: {Type: 'perlin', Seed: 3, Scale: 16}, Terrace: {Steps: 5, Sharp: 0.3}, Range: [0, 2]}
		];
		var list = points(64, 100);

		expect(floats).toBeTruthy();

		specs.forEach(function (spec) {
			var program = renderer.Program([
				'#version 300 es',
				'in vec3 aPosition;',
				'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
			].join('\n'), [
				'#version 300 es',
				'precision highp float;',
				'precision highp int;',
				'uniform vec3 uPoints[64];',
				'out vec4 outColor;',
				noise.GLSLChunk(),
				noise.GLSL(spec, 'readNoise'),
				'void main() { int i = int(gl_FragCoord.x); outColor = vec4(readNoise(uPoints[i]), 0.0, 0.0, 1.0); }'
			].join('\n'));
			var target = renderer.Target(64, 1, {Float: true});
			var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
			var pixels = new Float32Array(64 * 4);
			var sampler = noise.Make(spec);
			var off = 0;

			target.Begin();

			renderer.Draw(quad, program, {uPoints: [].concat.apply([], list)}, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 64, 1, gl.RGBA, gl.FLOAT, pixels);

			target.End();

			list.forEach(function (p, index) {
				if (Math.abs(pixels[index * 4] - sampler.At(p[0], p[1], p[2])) > (spec.Type === 'worley' || spec.Type === 'white' ? 0.01 : 0.002))
					off++;
			});

			/* A float of the card and a number of the page part only at the edge of a cell, now and then. */
			expect(off).toBeLessThanOrEqual(spec.Type === 'worley' || spec.Type === 'white' ? 3 : 0);
		});
	}, 90000);
});
