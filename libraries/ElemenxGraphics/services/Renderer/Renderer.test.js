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
});
