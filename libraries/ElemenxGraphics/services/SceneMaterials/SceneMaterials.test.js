import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var materials;

/* A square of a material drawn flat, 4 mm a pixel (or px metres), its color c over grey: the pixels as bytes. */
function draw (name, px) {
	var canvas = document.createElement('canvas');
	var gl;
	var list = [name];
	var program;
	var shader;
	var pixels = new Uint8Array(64 * 64 * 4);

	canvas.width = 64;
	canvas.height = 64;
	gl = canvas.getContext('webgl2');

	function compile (type, text) {
		shader = gl.createShader(type);

		gl.shaderSource(shader, text);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
			throw new Error(gl.getShaderInfoLog(shader));

		return shader;
	}

	program = gl.createProgram();

	gl.attachShader(program, compile(gl.VERTEX_SHADER, '#version 300 es\nvoid main() { vec2 p = vec2(float(gl_VertexID % 2), float(gl_VertexID / 2)) * 4.0 - 1.0; gl_Position = vec4(p, 0.0, 1.0); }'));
	gl.attachShader(program, compile(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;\nout vec4 outColor;\n' + materials.Chunk(list) + '\nvoid main() { vec2 q = gl_FragCoord.xy * ' + px.toFixed(4) + ' + vec2(1000.0, 2000.0); vec3 c = vec3(0.5); float r = 1.0; float m = 0.0; float h = 0.0; enx_material(0.0, q, ' + px.toFixed(4) + ', c, r, m, h); outColor = vec4(c, 1.0); }'));
	gl.linkProgram(program);
	gl.useProgram(program);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
	gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

	return pixels;
}

/* How much the brightness of pixels varies (their spread, 0 to 255). */
function spread (pixels) {
	var sum = 0;
	var square = 0;
	var count = pixels.length / 4;
	var i;

	for (i = 0; i < pixels.length; i += 4) {
		var value = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

		sum += value;
		square += value * value;
	}

	return Math.sqrt(Math.max(0, square / count - sum / count * sum / count));
}

describe('Contract: SceneMaterials, the library of materials: patterns of GLSL in metres of the world', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneMaterials']);

		materials = Elemenx.Service('SceneMaterials');
	});

	it('has the materials of the references and the common ones, by group, and the ground may be made of those of land', function () {
		['lawn', 'soil', 'gravel', 'clay', 'sand', 'rock', 'snow'].forEach(function (name) {
			expect(materials.Get(name).Group).toBe('ground');
		});

		['asphalt', 'terrazzo', 'concrete', 'paving', 'cobbles', 'ballast', 'dirt'].forEach(function (name) {
			expect(materials.Get(name).Group).toBe('road');
		});

		['brick', 'stone', 'plaster', 'wood', 'metal', 'glass'].forEach(function (name) {
			expect(materials.Has(name)).toBe(true);
			expect(materials.LandNames()).not.toContain(name);
		});

		expect(materials.LandNames()).toContain('lawn');
		expect(materials.LandNames()).toContain('asphalt');
		expect(materials.Names('build')).toContain('brick');
		expect(materials.Get('nothing')).toBe(null);
	});

	it('draws each of its materials as a pattern: it compiles, it varies near, and fades to its color where it is too small to see', function () {
		materials.Names().forEach(function (name) {
			var near = spread(draw(name, 0.004));

			/* Glass and metal are smooth: their color hardly changes. */
			if (name !== 'glass' && name !== 'metal' && name !== 'snow')
				expect(near, name).toBeGreaterThan(2);
		});

		/* Far, the grains of asphalt are gone: much less of it varies. */
		expect(spread(draw('asphalt', 0.5))).toBeLessThan(spread(draw('asphalt', 0.002)));
	});

	it('defines a material of its own, in the chunk of materials and as the surface of a model', function () {
		materials.Define('test-stripes', {Group: 'other', Code: '\tc *= 0.5 + 0.5 * step(0.5, fract(q.x));'});

		expect(materials.Chunk(['test-stripes', 'lawn'])).toContain('enx_mat1');
		expect(materials.Surface('test-stripes')).toContain('void blueprintSurface(');
		expect(materials.Surface('nothing')).toBe(null);
		expect(spread(draw('test-stripes', 0.05))).toBeGreaterThan(20);
		expect(function () {
			materials.Define('bad', {});
		}).toThrow('Elemenx SceneMaterials: a material needs a name and its Code');
	});
});
