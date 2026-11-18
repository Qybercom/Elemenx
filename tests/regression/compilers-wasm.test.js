import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

function compile (job) {
	return new Promise(function (done, failed) {
		Elemenx.Compilers.Run(job, function (error, result) {
			if (error) failed(Object.assign(error, {Result: result}));
			else done(result);
		});
	});
}

/* The same numbers to the bit: NaN as NaN, a vector part by part, -0 as -0. */
function same (a, b) {
	if (Array.isArray(a))
		return Array.isArray(b) && a.length === b.length && a.every(function (one, index) {
			return same(one, b[index]);
		});

	return Object.is(a, b);
}

/* A module of the kernel language: the hash and the value noise of the Noise Service, vectors, choices, a rest, a function that calls itself. */
var NOISE = [
	'float SCALE = 2.03;',
	'int mix32(int x, int y, int z) {',
	'	int a = (x + 65536) * 1664525 + 1013904223; int b = (y + 65536) * 1664525 + 1013904223; int c = (z + 65536) * 1664525 + 1013904223;',
	'	a += b * c; b += c * a; c += a * b;',
	'	a = a ^ a >>> 16; b = b ^ b >>> 16; c = c ^ c >>> 16;',
	'	return a + b * c;',
	'}',
	'float hash(int x, int y, int z) { return float(mix32(x, y, z) & 16777215) / 16777215.0; }',
	'float fade(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }',
	'float value(float x, float y, float z) {',
	'	float ix = floor(x); float iy = floor(y); float iz = floor(z);',
	'	int i = int(ix), j = int(iy), k = int(iz);',
	'	float fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);',
	'	return mix(mix(mix(hash(i, j, k), hash(i + 1, j, k), fx), mix(hash(i, j + 1, k), hash(i + 1, j + 1, k), fx), fy),',
	'		mix(mix(hash(i, j, k + 1), hash(i + 1, j, k + 1), fx), mix(hash(i, j + 1, k + 1), hash(i + 1, j + 1, k + 1), fx), fy), fz);',
	'}',
	'/* Six octaves, each finer and fainter. */',
	'float fbm(float x, float y, float z) {',
	'	float total = 0.0, amplitude = 0.5, weight = 0.0;',
	'	for (int octave = 0; octave < 6; octave++) {',
	'		total += value(x, y, z) * amplitude; weight += amplitude;',
	'		x = x * SCALE + 1.7; y = y * SCALE + 9.2; z = z * SCALE + 3.1; amplitude *= 0.5;',
	'	}',
	'	return total / weight;',
	'}',
	'vec3 bend(vec3 a, float k) { vec3 b = normalize(a) * k + vec3(1.0, 2.0, 3.0); return cross(b, a) - abs(a) * 0.5 + vec3(sin(k), pow(abs(k), 1.5), atan2(a.y, a.x)); }',
	'float pick(float x) { return x > 0.0 && x < 1.0 ? smoothstep(0.0, 1.0, x) : x % 0.7 + exp(-abs(x)) + log(1.0 + abs(x)); }',
	'bool inside(float x, float y) { return x * x + y * y <= 1.0 || !(x < 5.0); }',
	'int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }',
	'int endless(int n) { return endless(n + 1); }',
	'float scaled(float k, vec2 shift, float x) { return fbm(x * k + shift.x, 0.5, x + shift.y); }'
].join('\n');

describe('Contract: Elemenx.Compilers, the kernel language, the own Math of js and wasm, wasm of the IR', function () {
	var js;
	var made;
	var wasm;

	beforeAll(async function () {
		await loadElemenx();

		js = Elemenx.Compilers.Load((await compile({From: 'kernel', To: 'js', Value: NOISE})).Value);
		made = await compile({From: 'kernel', To: 'wasm', Value: NOISE, Options: {Batch: ['fbm', 'bend', {Name: 'scaled', Fixed: 2}], MaxDepth: 64}});
		wasm = Elemenx.Compilers.Instance(made.Value);
	});

	it('reads the kernel language into the IR: constants, declarations, for, ?:, the operators of bits; what is wrong by its line and column', async function () {
		var ir = (await compile({From: 'kernel', To: 'ir', Value: NOISE})).Value;
		var failed = null;

		expect(Elemenx.Compilers.Path('kernel', 'wasm')).toEqual(['kernel-ir', 'ir-wasm']);
		expect(ir.Functions.map(function (fn) {
			return fn.Name;
		})).toEqual(['mix32', 'hash', 'fade', 'value', 'fbm', 'bend', 'pick', 'inside', 'factorial', 'endless', 'scaled']);
		expect(ir.Functions[4].Body[3]).toMatchObject({Op: 'loop', Var: 'octave'});
		expect(Elemenx.Compilers.Check(ir)).toEqual([]);

		try {
			await compile({From: 'kernel', To: 'ir', Value: 'float f(float x) {\n\treturn x +;\n}'});
		}
		catch (error) {
			failed = error;
		}

		expect(failed.message).toBe('Elemenx kernel: unexpected ;');
		expect(failed.Result.Diagnostics[0]).toMatchObject({Line: 2, Column: 12, Severity: 'error'});
	});

	/* Whole numbers of 32 bits wrap round in js as in wasm and C: the hash of the Noise Service, written once. */
	it('wraps whole numbers round as the hash of the Noise Service does', function () {
		var noise;
		var i;

		function hash (x, y, z) {
			var a = Math.imul(x + 65536, 1664525) + 1013904223 >>> 0;
			var b = Math.imul(y + 65536, 1664525) + 1013904223 >>> 0;
			var c = Math.imul(z + 65536, 1664525) + 1013904223 >>> 0;

			a = a + Math.imul(b, c) >>> 0;
			b = b + Math.imul(c, a) >>> 0;
			c = c + Math.imul(a, b) >>> 0;
			a = (a ^ a >>> 16) >>> 0;
			b = (b ^ b >>> 16) >>> 0;
			c = (c ^ c >>> 16) >>> 0;
			a = a + Math.imul(b, c) >>> 0;

			return (a & 16777215) / 16777215;
		}

		for (i = 0; i < 2000; i++) {
			noise = [(i * 7919 % 2000001) - 1000000, (i * 104729 % 2000001) - 1000000, -i * 31];

			expect(js.hash(noise[0], noise[1], noise[2])).toBe(hash(noise[0], noise[1], noise[2]));
			expect(wasm.Functions.hash(noise[0], noise[1], noise[2])).toBe(hash(noise[0], noise[1], noise[2]));
		}
	});

	/* sin, cos, exp, log, atan, pow... its own, after fdlibm: within a unit of the last place of Math, the same in any browser. */
	it('has its own Math, as near as a unit of the last place to the browser\'s, its edges as js has them', async function () {
		var math = Elemenx.Compilers.Load((await compile({From: 'kernel', To: 'js', Value: 'float s(float x) { return sin(x); } float c(float x) { return cos(x); } float e(float x) { return exp(x); } float l(float x) { return log(x); } float a(float x) { return atan(x); } float t(float y, float x) { return atan2(y, x); } float p(float x, float y) { return pow(x, y); } float r(float x) { return round(x); }'})).Value);
		var worst = 0;
		var i;

		function ulps (a, b) {
			return a === b ? 0 : Math.abs(a - b) / Math.max(Math.abs(b) * 2.220446049250313e-16, 5e-324);
		}

		for (i = 1; i < 4000; i++) {
			var x = Math.sin(i * 12.9898) * Math.pow(10, i % 7 - 2);

			worst = Math.max(worst, ulps(math.s(x), Math.sin(x)), ulps(math.c(x), Math.cos(x)), ulps(math.e(x / 50), Math.exp(x / 50)), ulps(math.l(Math.abs(x)), Math.log(Math.abs(x))), ulps(math.a(x), Math.atan(x)), ulps(math.t(x, i % 3 - 1), Math.atan2(x, i % 3 - 1)));
		}

		expect(worst).toBeLessThanOrEqual(1.5);
		expect(math.p(2, 10)).toBe(1024);
		expect(math.p(9, 0.5)).toBe(3);
		expect(math.p(-2, 3)).toBe(-8);
		expect(math.p(-8, 1 / 3)).toBeNaN();
		expect(Math.abs(math.p(10, 2.5) / Math.pow(10, 2.5) - 1)).toBeLessThan(1e-14);
		expect(math.l(0)).toBe(-Infinity);
		expect(math.l(-1)).toBeNaN();
		expect(math.e(1000)).toBe(Infinity);
		expect(math.t(0, -1)).toBe(Math.PI);
		expect(math.t(-0, -1)).toBe(-Math.PI);
		expect(math.r(2.5)).toBe(3);
		expect(math.r(-2.5)).toBe(-2);

		/* The same, made once, for code written by hand. */
		expect(Elemenx.Compilers.Math().sin(1.2)).toBe(math.s(1.2));
		expect(Elemenx.Compilers.Math().fmod(-7.5, 2)).toBe(-7.5 % 2);
		expect(Elemenx.Compilers.Math()).toBe(Elemenx.Compilers.Math());
	});

	/* The point of it all: the numbers of wasm are those of js, to the bit, whatever the browser. */
	it('makes wasm of the IR that gives the very numbers of its js', function () {
		var i;

		expect(made.Value.Bytes[0]).toBe(0);
		expect(made.Value.Bytes[1]).toBe(0x61);
		expect(WebAssembly.validate(made.Value.Bytes)).toBe(true);
		expect(made.Files[0].Name).toBe('module.wasm');

		for (i = 0; i < 3000; i++) {
			var x = Math.sin(i * 78.233) * Math.pow(10, i % 5 - 1);
			var y = Math.cos(i * 12.9898) * 4;

			expect(same(wasm.Functions.value(x, y, x * 0.3), js.value(x, y, x * 0.3))).toBe(true);
			expect(same(wasm.Functions.fbm(x, 0.5, y), js.fbm(x, 0.5, y))).toBe(true);
			expect(same(wasm.Functions.bend([x, y, 1], y), js.bend([x, y, 1], y))).toBe(true);
			expect(same(wasm.Functions.pick(y), js.pick(y))).toBe(true);
			expect(wasm.Functions.inside(x, y)).toBe(js.inside(x, y));
		}

		expect(wasm.Functions.factorial(10)).toBe(3628800);
	});

	it('runs a function over many points in one call (Batch): the numbers of each run one after another', function () {
		var count = 1000;
		var input = new Float64Array(count * 3);
		var output;
		var bent;
		var i;

		for (i = 0; i < count; i++) {
			input[i * 3] = i * 0.37;
			input[i * 3 + 1] = 0.5;
			input[i * 3 + 2] = -i * 0.11;
		}

		output = wasm.Batch('fbm', input, count);

		expect(output.length).toBe(count);

		for (i = 0; i < count; i += 97)
			expect(output[i]).toBe(js.fbm(i * 0.37, 0.5, -i * 0.11));

		/* A vector and a number in, a vector out: 4 numbers a run in, 3 out. */
		bent = wasm.Batch('bend', [1, 2, 3, 0.5, -1, 0, 2, 3], 2);

		expect(Array.prototype.slice.call(bent, 0, 3)).toEqual(js.bend([1, 2, 3], 0.5));
		expect(Array.prototype.slice.call(bent, 3, 6)).toEqual(js.bend([-1, 0, 2], 3));

		/* Its first parameters given once (Fixed: 2, a number and a vector), the rest of each run. */
		bent = wasm.Batch('scaled', [1, 2, 3], 3, [0.5, [7, -1]].flat());

		expect(Array.from(bent)).toEqual([1, 2, 3].map(function (x) {
			return js.scaled(0.5, [7, -1], x);
		}));

		/* More than its memory holds at first: it grows. */
		expect(wasm.Batch('fbm', new Float64Array(30000 * 3), 30000).length).toBe(30000);
		expect(function () {
			wasm.Batch('value', [], 0);
		}).toThrow('Elemenx Compilers: no batch of value');
	});

	it('keeps a function that calls itself from going deeper than MaxDepth, as its js does', function () {
		expect(function () {
			wasm.Functions.endless(0);
		}).toThrow('Elemenx IR: endless goes deeper than 64');

		/* It runs again from the top after it. */
		expect(wasm.Functions.factorial(5)).toBe(120);
	});

	it('says what of a module is not of numbers: its js runs it', async function () {
		var failed = null;

		try {
			await compile({From: 'ir', To: 'wasm', Value: {Functions: [{Name: 'tag', Params: [{Name: 'n', Type: 'float'}], Returns: 'text', Body: [{Op: 'return', Value: {Op: 'call', Name: 'text', Args: [{Op: 'var', Name: 'n'}]}}]}]}});
		}
		catch (error) {
			failed = error;
		}

		expect(failed.message).toBe('Elemenx wasm: a result of text in tag is not of numbers (its js runs it)');
		expect(failed.Result.Diagnostics.map(function (one) {
			return one.Text;
		})).toContain('Elemenx wasm: text() in tag is not of numbers (its js runs it)');
	});

	it('makes its module off the thread when given a callback', async function () {
		var compiled = await new Promise(function (done, failed) {
			Elemenx.Compilers.Instance(made.Value, function (error, result) {
				if (error) failed(error);
				else done(result);
			});
		});

		expect(compiled.Functions.fade(0.5)).toBe(0.5);
		expect(compiled.Memory.buffer.byteLength).toBeGreaterThan(0);
	});

	/*
	 * Regression: each module made had a memory of its own; the browser keeps a great space for each, and a page with a
	 * few hundred grounds had no more (Out of memory: Cannot allocate Wasm memory). All share the memory of the page.
	 */
	it('makes as many modules as it is asked, all of one memory', function () {
		var first = Elemenx.Compilers.Instance(made.Value);
		var i;

		for (i = 0; i < 400; i++)
			expect(Elemenx.Compilers.Instance(made.Value).Memory).toBe(first.Memory);

		expect(first.Functions.fade(0.25)).toBe(js.fade(0.25));
	});

	/* What the geometry of a ground needs: the points of a line as a list, how many of them, a part of a vector by its index. */
	it('takes lists of numbers (float[]): in js arrays, in wasm the memory, the same numbers; a vector by an index', async function () {
		var text = [
			'float near(float[] points, float x, float z) {',
			'	float best = inf;',
			'	int count = points.length / 2 - 1;',
			'	for (int s = 0; s < count; s++) {',
			'		int i = s * 2;',
			'		float ax = points[i], az = points[i + 1], dx = points[i + 2] - ax, dz = points[i + 3] - az;',
			'		float t = clamp(((x - ax) * dx + (z - az) * dz) / max(dx * dx + dz * dz, 1e-12), 0.0, 1.0);',
			'		best = min(best, sqrt((ax + dx * t - x) * (ax + dx * t - x) + (az + dz * t - z) * (az + dz * t - z)));',
			'	}',
			'	return best;',
			'}',
			'float two(float[] a, float[] b, int k) { return a[k] * b.length + b[k % b.length]; }',
			'float part(vec3 v, int i) { return v[i] * 2.0; }'
		].join('\n');
		var code = Elemenx.Compilers.Load((await compile({From: 'kernel', To: 'js', Value: text})).Value);
		var bytes = await compile({From: 'kernel', To: 'wasm', Value: text, Options: {Batch: [{Name: 'near', Fixed: 1}]}});
		var made = Elemenx.Compilers.Instance(bytes.Value);
		var line = [0, 0, 10, 0, 10, 10, -5, 20];
		var input = [];
		var output;
		var i;

		expect(code.near(line, 5, 3)).toBe(3);
		expect(made.Functions.near(line, 5, 3)).toBe(3);

		for (i = 0; i < 100; i++) {
			var x = Math.sin(i * 1.7) * 30;
			var z = Math.cos(i * 0.9) * 30;

			input.push(x, z);

			expect(made.Functions.near(line, x, z)).toBe(code.near(line, x, z));
			expect(made.Functions.two(line, [1, 2, 3], i % 8)).toBe(code.two(line, [1, 2, 3], i % 8));
		}

		output = made.Batch('near', input, 100, [line]);

		for (i = 0; i < 100; i++)
			expect(output[i]).toBe(code.near(line, input[i * 2], input[i * 2 + 1]));

		expect([0, 1, 2].map(function (k) {
			return made.Functions.part([3, 4, 5], k);
		})).toEqual([6, 8, 10]);
		expect(code.part([3, 4, 5], 2)).toBe(10);
	});

	/* A list written in the code of a module: js and glsl keep it, wasm has none (the numbers of a sketch go in its code). */
	it('says a list of numbers of a module is not for wasm, and keeps it once in js', async function () {
		var module = {Functions: [{Name: 'third', Params: [], Returns: 'float', Body: [{Op: 'return', Value: {Op: 'index', List: {Op: 'const', Value: [4, 5, 6], Type: 'floats'}, At: {Op: 'const', Value: 2, Type: 'int'}}}]}], Entry: 'third'};
		var told = await compile({From: 'ir', To: 'wasm', Value: module}).catch(function (error) {
			return error.Result;
		});
		var text = (await compile({From: 'ir', To: 'js', Value: module})).Value;

		expect(told.Diagnostics.map(function (one) {
			return one.Text;
		})).toContain('Elemenx wasm: a constant list of numbers in third is not of numbers (its js runs it)');
		expect(Elemenx.Compilers.Load(text).third()).toBe(6);
		expect(text).toContain('var rt_c0 = [4, 5, 6];');
	});
});
