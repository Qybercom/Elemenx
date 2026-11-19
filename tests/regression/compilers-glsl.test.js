import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

function compile (job) {
	return new Promise(function (done, failed) {
		Elemenx.Compilers.Run(job, function (error, result) {
			if (error) failed(Object.assign(error, {Result: result}));
			else done(result);
		});
	});
}

/* A module of the kernel language: a hash of whole numbers of 32 bits, a value noise of it, vectors, choices, rests, numbers of every type met. */
var KERNEL = [
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
	'float fbm(float x, float y, float z, int count) {',
	'	float total = 0.0, amplitude = 0.5, weight = 0.0;',
	'	for (int o = 0; o < count; o++) { total += value(x, y, z) * amplitude; weight += amplitude; x = x * SCALE + 1.7; y = y * SCALE + 9.2; z = z * SCALE + 3.1; amplitude *= 0.5; }',
	'	return total / weight;',
	'}',
	'float shape(float x, float y) {',
	'	vec3 p = vec3(x, y, 1.0);',
	'	vec3 q = normalize(p * 2.0 - vec3(0.5, 0.25, 0.0));',
	'	int n = int(x * 10.0) % 7;',
	'	bool wide = x > y;',
	'	float rest = x * 13.7 % 3.1;',
	'	return dot(q, vec3(0.3, 0.6, 0.1)) + float(n) * 0.25 + (wide ? 1.0 : 0.0) + rest + smoothstep(0.0, 1.0, y) + atan2(y, x) + pow(abs(x) + 1.0, 1.5) + ldexp(x, 3) + float(ilogb(x * 37.0 + 1.0));',
	'}'
].join('\n');

/* The bits of a float of 32 or of a whole number, as bytes of a pixel: the very numbers of the GPU, read back. */
function shader (library, call) {
	return [
		'#version 300 es',
		'precision highp float;',
		'precision highp int;',
		'uniform vec4 uIn;',
		'out vec4 outColor;',
		library,
		'void main() {',
		'	uint bits = ' + call + ';',
		'	outColor = vec4(float(bits & 255u), float((bits >> 8u) & 255u), float((bits >> 16u) & 255u), float(bits >> 24u)) / 255.0;',
		'}'
	].join('\n');
}

/* A program of a fragment shader over one pixel, run for each input: what it gives, as floats (float) or whole numbers (int). */
function run (source, inputs, kind) {
	var canvas = document.createElement('canvas');
	var gl;
	var program;
	var vertex;
	var fragment;
	var pixel = new Uint8Array(4);
	var view = new DataView(new ArrayBuffer(4));
	var made = [];

	canvas.width = 1;
	canvas.height = 1;
	gl = canvas.getContext('webgl2', {antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true});

	function part (type, text) {
		var one = gl.createShader(type);

		gl.shaderSource(one, text);
		gl.compileShader(one);

		if (!gl.getShaderParameter(one, gl.COMPILE_STATUS))
			throw new Error(gl.getShaderInfoLog(one) + '\n' + text);

		return one;
	}

	vertex = part(gl.VERTEX_SHADER, '#version 300 es\nvoid main() { gl_PointSize = 1.0; gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }');
	fragment = part(gl.FRAGMENT_SHADER, source);
	program = gl.createProgram();

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
		throw new Error(gl.getProgramInfoLog(program));

	gl.useProgram(program);

	inputs.forEach(function (input) {
		gl.uniform4f(gl.getUniformLocation(program, 'uIn'), input[0], input[1], input[2] || 0, input[3] || 0);
		gl.drawArrays(gl.POINTS, 0, 1);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		view.setUint32(0, pixel[0] | pixel[1] << 8 | pixel[2] << 16 | pixel[3] << 24, true);

		made.push(kind === 'int' ? view.getInt32(0, true) : view.getFloat32(0, true));
	});

	gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext();

	return made;
}

describe('Contract: GLSL of the IR (ir-glsl), functions of numbers for a shader', function () {
	var made;
	var js;

	beforeAll(async function () {
		await loadElemenx();

		made = (await compile({From: 'kernel', To: 'glsl', Value: KERNEL})).Value;
		js = Elemenx.Compilers.Load((await compile({From: 'kernel', To: 'js', Value: KERNEL})).Value);
	});

	it('is a language of its own, the way from the kernel to it found, functions of numbers with no main', function () {
		expect(Elemenx.Compilers.Language('glsl').Extension).toBe('glsl');
		expect(Elemenx.Compilers.Path('kernel', 'glsl')).toEqual(['kernel-ir', 'ir-glsl']);
		expect(made).toContain('float f_value(float f_x, float f_y, float f_z)');
		expect(made).toContain('int f_mix32(int f_x, int f_y, int f_z);');
		expect(made).not.toContain('void main');
	});

	/* Whole numbers of 32 bits wrap round in GLSL as in js and wasm: a hash of them is the same to the bit. */
	it('gives the very whole numbers of its js: a hash of 32 bits that wraps round', function () {
		var inputs = [[0, 0, 0], [1, 2, 3], [-7, 40000, 12], [123456, -98765, 31]];
		var gpu = run(shader(made, 'uint(f_mix32(int(uIn.x), int(uIn.y), int(uIn.z)))'), inputs, 'int');

		expect(gpu).toEqual(inputs.map(function (input) {
			return js.mix32(input[0], input[1], input[2]);
		}));
	});

	/* In floats of 32 bits: the numbers of its js as near as a float of the GPU holds them. */
	it('gives the numbers of its js as near as floats of 32 bits hold them: noise, fbm in a loop, vectors, rests, choices, conversions', function () {
		var points = [[0.25, 0.5, 0.75], [3.7, -1.2, 8.9], [-12.5, 4.25, 0.125], [101.3, 7.7, -55.1]];
		var noise = run(shader(made, 'floatBitsToUint(f_fbm(uIn.x, uIn.y, uIn.z, 5))'), points, 'float');
		var shapes = run(shader(made, 'floatBitsToUint(f_shape(uIn.x, uIn.y))'), points, 'float');

		points.forEach(function (point, index) {
			expect(Math.abs(noise[index] - js.fbm(point[0], point[1], point[2], 5))).toBeLessThan(2e-4);
			expect(Math.abs(shapes[index] - js.shape(point[0], point[1])) / Math.max(1, Math.abs(js.shape(point[0], point[1])))).toBeLessThan(2e-4);
		});
	});

	it('makes int and float meet as js takes them: a whole number in arithmetic of floats, a number tested as a bool', async function () {
		var module = {Functions: [{Name: 'mixed', Params: [{Name: 'a', Type: 'int'}, {Name: 'b', Type: 'float'}], Returns: 'float', Body: [
			{Op: 'let', Name: 'c', Type: 'float', Value: {Op: 'bin', Operator: '*', A: {Op: 'var', Name: 'a'}, B: {Op: 'var', Name: 'b'}}},
			{Op: 'let', Name: 'v', Type: 'vec3', Value: {Op: 'bin', Operator: '*', A: {Op: 'const', Value: [1, 2, 3]}, B: {Op: 'var', Name: 'a'}}},
			{Op: 'if', Test: {Op: 'var', Name: 'b'}, Then: [{Op: 'set', Name: 'c', Value: {Op: 'bin', Operator: '+', A: {Op: 'var', Name: 'c'}, B: {Op: 'const', Value: 1, Type: 'int'}}}]},
			{Op: 'return', Value: {Op: 'bin', Operator: '+', A: {Op: 'var', Name: 'c'}, B: {Op: 'call', Name: 'z', Args: [{Op: 'var', Name: 'v'}]}}}
		]}], Entry: 'mixed'};
		var text = (await compile({From: 'ir', To: 'glsl', Value: module})).Value;
		var gpu = run(shader(text, 'floatBitsToUint(f_mixed(int(uIn.x), uIn.y))'), [[3, 0.5], [-2, 0], [7, 1.25]], 'float');

		expect(text).toContain('float(f_a)');
		expect(gpu).toEqual([3 * 0.5 + 1 + 9, -2 * 0 - 6, 7 * 1.25 + 1 + 21].map(Math.fround));
	});

	/* A text, a list or a call of itself: a shader holds none of them, and says so as wasm does. */
	it('says what of a module is not of numbers, and a function that calls itself: its js runs it', async function () {
		var texts = await compile({From: 'ir', To: 'glsl', Value: {Functions: [{Name: 'named', Params: [], Returns: 'text', Body: [{Op: 'return', Value: {Op: 'const', Value: 'a', Type: 'text'}}]}], Entry: 'named'}}).catch(function (error) {
			return error.Result;
		});
		var deep = await compile({From: 'kernel', To: 'glsl', Value: 'float down(float x) { return x < 1.0 ? x : down(x - 1.0); }'}).catch(function (error) {
			return error.Result;
		});

		expect(texts.Diagnostics.map(function (one) {
			return one.Text;
		})).toContain('Elemenx glsl: a result of text in named is not of numbers (its js runs it)');
		expect(deep.Diagnostics.map(function (one) {
			return one.Text;
		})).toContain('Elemenx glsl: down calls itself, and a shader has no stack (its js runs it)');
	});

	/*
	 * Options.Once: each function (and its prototype) once in a shader however many texts of it come (#ifndef ENX_<name>),
	 * the runtime too (RT_RUNTIME): the formulas of a graph of a shader, each a text of its own, put in the same shader.
	 */
	it('writes each function once in a shader with Once, however many texts of it are put in it', async function () {
		var once = (await compile({From: 'kernel', To: 'glsl', Value: KERNEL, Options: {Once: true}})).Value;
		var gpu;

		expect(Elemenx.Compilers.Language('glsl').Directives).toBe(true);
		expect(once).toContain('#ifndef ENX_f_value\n#define ENX_f_value\n');
		expect(once).toContain('#ifndef RT_RUNTIME');
		expect(made).not.toContain('#ifndef ENX_f_value');

		gpu = run(shader(once + '\n' + once, 'floatBitsToUint(f_value(uIn.x, uIn.y, uIn.z))'), [[1.5, 2.25, -3.5]], 'float');

		expect(Math.abs(gpu[0] - js.value(1.5, 2.25, -3.5))).toBeLessThan(1e-5);
	});

	/* A graph of numbers of Blueprints (Numeric): the relief of a ground, its noise of the Kernel, in a shader. */
	it('makes a graph of numbers of Blueprints a function of a shader: the relief of a ground as near as floats hold it', async function () {
		var blueprints;
		var relief;
		var numeric;
		var text;
		var gpu;
		var code;
		var points = [[12.5, -40.25], [-700.1, 333.3], [1500.7, 90.9]];

		Use(['service:Blueprints', 'service:Noise', 'service:SceneTerrainGenerator']);

		blueprints = Elemenx.Service('Blueprints');
		relief = Elemenx.Service('SceneTerrainGenerator').LibraryRelief({Size: 2000, Height: 60, Seed: 'contract'});
		numeric = blueprints.Numeric(relief, {});
		code = blueprints.NumericCode(relief, {});
		text = (await compile({From: 'ir', To: 'glsl', Value: numeric.Module})).Value;
		gpu = run(shader(text, 'floatBitsToUint(f_g_main(uIn.x, uIn.y).x)'), points, 'float');

		expect(numeric.Diagnostics).toEqual([]);

		points.forEach(function (point, index) {
			expect(Math.abs(gpu[index] - code.Run({}, {X: point[0], Z: point[1]}).Height)).toBeLessThan(5e-4);
		});
	});

	/* The points of a line as a list of numbers (rt_floats of RT_CAP, Options.ListSize), and a list of the module kept once. */
	it('takes lists of numbers in a shader: a list given, a list of the module, as many as ListSize holds', async function () {
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
			'}'
		].join('\n');
		var module = (await compile({From: 'kernel', To: 'ir', Value: text})).Value;
		var line = [0, 0, 10, 0, 10, 10, -5, 20];
		var points = [[5, 3], [12, 6], [-2, 18], [30, -4]];
		var js = Elemenx.Compilers.Load((await compile({From: 'ir', To: 'js', Value: module})).Value);
		var given = (await compile({From: 'ir', To: 'glsl', Value: module, Options: {ListSize: 16}})).Value;
		var held;
		var gpu;
		var mine;
		var long;

		module.Functions.push({Name: 'mine', Params: [{Name: 'x', Type: 'float'}, {Name: 'z', Type: 'float'}], Returns: 'float', Body: [
			{Op: 'return', Value: {Op: 'call', Name: 'near', Args: [{Op: 'const', Value: line, Type: 'floats'}, {Op: 'var', Name: 'x'}, {Op: 'var', Name: 'z'}]}}
		]});

		held = (await compile({From: 'ir', To: 'glsl', Value: module, Options: {ListSize: 16}})).Value;
		gpu = run(shader(given, 'floatBitsToUint(f_near(rt_floats(float[RT_CAP](' + line.concat([0, 0, 0, 0, 0, 0, 0, 0]).map(function (one) {
			return one.toFixed(1);
		}).join(', ') + '), 8), uIn.x, uIn.y))'), points, 'float');
		mine = run(shader(held, 'floatBitsToUint(f_mine(uIn.x, uIn.y))'), points, 'float');
		long = await compile({From: 'ir', To: 'glsl', Value: module, Options: {ListSize: 4}}).catch(function (error) {
			return error.Result;
		});

		expect(given).toContain('struct rt_floats { float v[RT_CAP]; int n; };');
		expect(held).toContain('const rt_floats rt_c0 = rt_floats(float[RT_CAP](');

		points.forEach(function (point, index) {
			expect(Math.abs(gpu[index] - js.near(line, point[0], point[1]))).toBeLessThan(1e-4);
			expect(mine[index]).toBe(gpu[index]);
		});

		expect(long.Diagnostics.map(function (one) {
			return one.Text;
		})).toContain('Elemenx glsl: a list of 8 numbers (of 4 at most: Options.ListSize) in mine is not of numbers (its js runs it)');
	});

	/* The noise of the Noise Service, its one source (Kernel): the same in a shader as in the page. */
	it('makes the kernel of the Noise Service a library of a shader: its value noise of the page as near as floats hold it', async function () {
		var noise;
		var text;
		var gpu;
		var points = [[0.3, 0.6, 0.9], [5.5, -2.25, 1.75], [-40.1, 13.3, 2.2]];

		Use(['service:Noise']);

		noise = Elemenx.Service('Noise');
		text = (await compile({From: 'kernel', To: 'glsl', Value: [].concat(noise.Kernel).join('\n')})).Value;
		gpu = run(shader(text, 'floatBitsToUint(f_n_value(uIn.x, uIn.y, uIn.z, false, 0.0, 0.0, 0.0))'), points, 'float');

		points.forEach(function (point, index) {
			expect(Math.abs(gpu[index] - noise.Code().n_value(point[0], point[1], point[2], false, 0, 0, 0))).toBeLessThan(1e-4);
		});
	});
});
