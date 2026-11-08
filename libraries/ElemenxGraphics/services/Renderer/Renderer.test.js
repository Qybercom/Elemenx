import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: the Renderer, its textures and what it drew', function () {
	var renderer;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Renderer']);

		renderer = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
	});

	/* A mask of one byte a texel (the ground kept bare of grass), read as .r: rows of any length, not padded to four bytes. */
	it('makes a texture of one byte a texel with Single, its rows as long as they are', function () {
		var gl = renderer.GL;
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			'uniform sampler2D uMask;',
			'out vec4 outColor;',
			'void main() { outColor = vec4(texelFetch(uMask, ivec2(gl_FragCoord.xy), 0).r, 0.0, 0.0, 1.0); }'
		].join('\n'));
		var mask = renderer.Texture({Width: 3, Height: 2, Data: new Uint8Array([0, 128, 255, 255, 64, 0])}, {Single: true, Nearest: true});
		var target = renderer.Target(3, 2, {});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixels = new Uint8Array(3 * 2 * 4);

		expect(gl.getError()).toBe(gl.NO_ERROR);

		target.Begin();

		renderer.Draw(quad, program, {uMask: mask}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 3, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

		target.End();

		expect([0, 4, 8, 12, 16, 20].map(function (at) {
			return pixels[at];
		})).toEqual([0, 128, 255, 255, 64, 0]);
		expect(gl.getParameter(gl.UNPACK_ALIGNMENT)).toBe(4);
	});
	/* What a frame costs: the draws and the triangles since the renderer was made, the copies of a mesh counted. */
	it('counts its draws and the triangles of them, each copy of an instanced mesh, and no triangle of a line', function () {
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			'out vec4 outColor;',
			'void main() { outColor = vec4(1.0); }'
		].join('\n'));
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var lines = renderer.Lines([[0, 0, 0], [1, 1, 0], [1, 0, 0]], false);
		var before = renderer.Counts();
		var after;

		renderer.Draw(quad, program, {}, {Depth: false, Cull: 'none'});
		renderer.Draw(quad, program, {}, {Depth: false, Cull: 'none', Instances: 3});
		renderer.Draw(lines, program, {}, {Depth: false});

		after = renderer.Counts();

		expect(after.Draws - before.Draws).toBe(3);
		expect(after.Triangles - before.Triangles).toBe(2 + 2 * 3);
	});

	/* A mesh of a mode of its own (lines): its pairs of points drawn as lines, no triangle of them; the weights of materials of a ground taken. */
	it('makes a mesh of lines by its mode, and a mesh of the weights of the materials of a ground', function () {
		var gl = renderer.GL;
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'in vec4 aMaterials;',
			'in vec4 aMaterials2;',
			'in vec4 aMaterials3;',
			'out vec4 vPaint;',
			'void main() { vPaint = vec4(aMaterials.x, aMaterials2.w, aMaterials3.z, 1.0); gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			'in vec4 vPaint;',
			'out vec4 outColor;',
			'void main() { outColor = vPaint; }'
		].join('\n'));
		var lines = renderer.Mesh({Positions: [-1, 0, 0, 1, 0, 0, 0, -1, 0, 0, 1, 0], Indices: []}, 'lines');
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2], Materials: [1, 0, 0, 0, 0, 0, 0, 0.5, 1, 0, 0, 0, 0, 0, 0, 0.5, 1, 0, 0, 0, 0, 0, 0, 0.5]});
		var plain = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var twelve = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2], Materials: [0, 1, 2].reduce(function (all) {
			return all.concat([1, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0.5, 0]);
		}, [])});
		var target = renderer.Target(2, 2, {});
		var pixel = new Uint8Array(4);
		var before = renderer.Counts();

		renderer.Draw(lines, program, {}, {Depth: false});

		expect(renderer.Counts().Triangles).toBe(before.Triangles);

		target.Begin();

		renderer.Draw(quad, program, {}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect([pixel[0], Math.round(pixel[1] / 255 * 10) / 10, pixel[2]]).toEqual([255, 0.5, 0]);

		/* 12 a vertex: the third four too. */
		renderer.Draw(twelve, program, {}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect([pixel[0], Math.round(pixel[1] / 255 * 10) / 10, Math.round(pixel[2] / 255 * 10) / 10]).toEqual([255, 0.5, 0.5]);

		/* None: 0, not the 1 of what is not given. */
		renderer.Draw(plain, program, {}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		target.End();

		expect([pixel[0], pixel[1]]).toEqual([0, 0]);
	});

	/*
	 * A target of two colors drawn with samples (the scene with the normals of its surfaces): each color comes to its own
	 * texture; a program writes as many as it declares (a second left as it was by one that writes one), and Clear gives
	 * the second nought. Regression: the reflections of the screen took the normal from the slopes of the depth (flat over
	 * each triangle, in steps of two pixels: the facets and the steps on the body of a car).
	 */
	it('draws into a target of two colors with samples, each color to its texture, as many as a program writes, the second cleared to nought', function () {
		var gl = renderer.GL;
		var vertex = ['#version 300 es', 'in vec3 aPosition;', 'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'].join('\n');
		var two = renderer.Program(vertex, ['#version 300 es', 'precision highp float;', 'layout(location = 0) out vec4 outColor;', 'layout(location = 1) out vec4 outNormal;', 'void main() { outColor = vec4(1.0, 0.0, 0.0, 1.0); outNormal = vec4(0.0, 0.5, 1.0, 1.0); }'].join('\n'));
		var one = renderer.Program(vertex, ['#version 300 es', 'precision highp float;', 'out vec4 outColor;', 'void main() { outColor = vec4(0.0, 1.0, 0.0, 1.0); }'].join('\n'));
		var floats = gl.getExtension('EXT_color_buffer_float');
		var target = renderer.Target(4, 4, {Float: true, Samples: 4, Colors: 2});
		var left = renderer.Mesh({Positions: [-1, -1, 0, 0, -1, 0, 0, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var right = renderer.Mesh({Positions: [0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var colors = new Float32Array(4 * 4 * 4);
		var normals = new Float32Array(4 * 4 * 4);

		expect(two.Outputs).toBe(2);
		expect(one.Outputs).toBe(1);

		target.Begin();

		renderer.Clear([0.2, 0.2, 0.2, 1]);
		renderer.Draw(left, two, {}, {Depth: false, Cull: 'none'});
		renderer.Draw(right, one, {}, {Depth: false, Cull: 'none'});

		target.End();

		expect(floats).not.toBe(null);

		/* The textures of the target, each read through a framebuffer of its own. */
		[0, 1].forEach(function (index) {
			var frame = gl.createFramebuffer();

			gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.Textures[index].Handle, 0);
			gl.readPixels(0, 0, 4, 4, gl.RGBA, gl.FLOAT, index === 0 ? colors : normals);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.deleteFramebuffer(frame);
		});

		/* The left half: red and its normal; the right half: green, and the normal it never wrote nought. */
		expect(Array.from(colors.slice(0, 4))).toEqual([1, 0, 0, 1]);
		expect(Array.from(normals.slice(0, 4))).toEqual([0, 0.5, 1, 1]);
		expect(Array.from(colors.slice(12, 16))).toEqual([0, 1, 0, 1]);
		expect(Array.from(normals.slice(12, 16))).toEqual([0, 0, 0, 0]);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		target.Destroy();
	});

	/* A target over the depth of another (DepthFrom): a draw behind what it holds is not seen; Clear(color, true) keeps that depth. */
	it('draws over the depth of another target with DepthFrom, and clears its color alone with Clear(color, true)', function () {
		var gl = renderer.GL;
		var vertex = ['#version 300 es', 'in vec3 aPosition;', 'void main() { gl_Position = vec4(aPosition, 1.0); }'].join('\n');
		var flat = renderer.Program(vertex, ['#version 300 es', 'precision highp float;', 'out vec4 outColor;', 'void main() { outColor = vec4(1.0); }'].join('\n'));
		var near = renderer.Mesh({Positions: [-1, -1, 0, 0, -1, 0, 0, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var far = renderer.Mesh({Positions: [-1, -1, 0.5, 1, -1, 0.5, 1, 1, 0.5, -1, 1, 0.5], Indices: [0, 1, 2, 0, 2, 3]});
		var deep = renderer.Target(4, 4, {DepthTexture: true});
		var over = renderer.Target(4, 4, {DepthFrom: deep});
		var pixels = new Uint8Array(4 * 4 * 4);

		deep.Begin();

		renderer.Clear([0, 0, 0, 1]);
		renderer.Draw(near, flat, {}, {Cull: 'none'});

		deep.End();

		over.Begin();

		renderer.Clear([0, 0, 0, 0], true);
		renderer.Draw(far, flat, {}, {Cull: 'none', DepthWrite: false});

		gl.readPixels(0, 0, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

		over.End();

		/* The left half holds the near square: the far one is behind it there, seen only on the right. */
		expect(pixels[0]).toBe(0);
		expect(pixels[3 * 4]).toBe(255);
		expect(gl.getError()).toBe(gl.NO_ERROR);

		over.Destroy();
		deep.Destroy();
	});

	/*
	 * Arrays held (the common ones of a frame) and given again, the very same, are not read again: a list of 72 lamps read
	 * for each of thousands of draws took milliseconds a frame. One not held, changed in its place, is still sent again.
	 */
	it('reads a held array given again no more, till the next Hold; one not held is read each time', function () {
		var gl = renderer.GL;
		var program = renderer.Program(['#version 300 es', 'in vec3 aPosition;', 'void main() { gl_Position = vec4(aPosition, 1.0); }'].join('\n'), ['#version 300 es', 'precision highp float;', 'uniform vec2 uB;', 'out vec4 outColor;', 'void main() { outColor = vec4(uB, 0.0, 1.0); }'].join('\n'));
		var mesh = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 0, 1, 0], Indices: [0, 1, 2]});
		var target = renderer.Target(2, 2, {});
		var sent = 0;
		var two = gl.uniform2fv;
		var held = [0.25, 0.5];

		gl.uniform2fv = function () {
			sent++;

			return two.apply(this, arguments);
		};

		try {
			target.Begin();

			renderer.Hold([held]);
			renderer.Draw(mesh, program, {uB: held}, {Depth: false, Cull: 'none'});
			renderer.Draw(mesh, program, {uB: held}, {Depth: false, Cull: 'none'});

			expect(sent).toBe(1);

			/* A new Hold lets it go: changed in its place, it is sent again. */
			renderer.Hold([]);

			held[1] = 0.75;

			renderer.Draw(mesh, program, {uB: held}, {Depth: false, Cull: 'none'});

			target.End();

			expect(sent).toBe(2);
		}
		finally {
			gl.uniform2fv = two;

			target.Destroy();
		}
	});
});
