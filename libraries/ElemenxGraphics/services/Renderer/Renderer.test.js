import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

describe('Contract: the Renderer, its textures and what it drew', function () {
	var renderer;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Renderer']);

		renderer = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
	});

	/*
	 * Regression: each mesh and texture let go was spliced out of its list, the rest moved each time (a renderer letting go
	 * of all of them moved them all again and again); and one let go twice spliced out the last of its list, another, which
	 * then was never let go with its renderer: its buffers kept on the graphics card.
	 */
	it('lets go of all its meshes with it, one let go twice taking no other off its list', function () {
		var own = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = own.GL;
		var geometry = {Positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], Indices: [0, 1, 2]};
		var gone = own.Mesh(geometry);
		var others = [];
		var i;

		for (i = 0; i < 50; i++)
			others.push(own.Mesh(geometry));

		gone.Destroy();
		gone.Destroy();

		/* Its context kept, to see its buffers: no extension to give it back. */
		gl.getExtension = function () {
			return null;
		};

		own.Destroy();

		expect(others.filter(function (mesh) {
			return Object.keys(mesh.Buffers).some(function (name) {
				return gl.isBuffer(mesh.Buffers[name]);
			});
		}).length).toBe(0);
	});

	/*
	 * Regression: a renderer let go gave its context back at once, which waits for the card to finish all it was given: a
	 * page held up for most of a minute as its scenes left the view. Kept with the others let go, given back the oldest
	 * first only past MostContexts of the page (a browser keeps some 16).
	 */
	it('gives the contexts of renderers let go back only past MostContexts of the page, the oldest first', function () {
		var service = Elemenx.Service('Renderer');
		var given = [];
		var made = [];
		var before = service.Contexts.Released.length;
		var i;

		/* The contexts let go before by other tests given back now: this one counts its own. */
		while (service.Contexts.Released.length)
			service.Contexts.Released.shift().loseContext();

		for (i = 0; i < 4; i++) {
			var own = service.Create(document.createElement('canvas'), {Antialias: false});

			(function (index) {
				own.GL.getExtension = function () {
					return {loseContext: function () {
						given.push(index);
					}};
				};
			})(i);

			made.push(own);
		}

		made.forEach(function (own) {
			own.Destroy();
		});

		expect(before).toBeGreaterThanOrEqual(0);
		expect(given).toEqual([]);
		expect(service.Contexts.Released.length).toBe(4);

		/* Past the most a page has: the oldest let go go back first. */
		for (i = 0; i < service.MostContexts - 2; i++)
			made.push(service.Create(document.createElement('canvas'), {Antialias: false}));

		expect(given).toEqual([0, 1, 2]);
		expect(service.Contexts.Live + service.Contexts.Released.length).toBeLessThanOrEqual(service.MostContexts);

		made.slice(4).forEach(function (own) {
			own.Destroy();
		});
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
	/*
	 * Regression: a surface whose point half a voxel out along its normal was in a wall (what hangs from a roof of rock, set
	 * in it) got no light of the probes (weight 0), and took the sky in its place: the stones under the roof of a tunnel shone
	 * white. Now it takes what the probes give a voxel further out.
	 */
	it('gives a surface whose point by it is in a wall the light of the probes a voxel further out', function () {
		var gl = renderer.GL;
		var chunks = Elemenx.Service('Renderer').Chunks;
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			chunks.Lights,
			chunks.Shadow,
			'out vec4 outColor;',
			'void main() {',
			'	float weight;',
			'	vec3 light = probeLight(vec3(0.5, 0.0, 0.5), vec3(0.0, 1.0, 0.0), weight);',
			'	outColor = vec4(light, weight);',
			'}'
		].join('\n'));
		/* 4 by 8 by 4 voxels: four blocks over each other (red, green, blue, free), each a row of the 8 layers of y, 4 by 4. */
		var data = new Float32Array(32 * 16 * 4);
		var target = renderer.Target(1, 1, {});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixel = new Uint8Array(4);
		var probes;
		var x;
		var y;

		/* Every voxel free but the one the surface reads first (layer 2, x 2, z 2); the red of the one over it 1. */
		for (y = 12; y < 16; y++) {
			for (x = 0; x < 32; x++)
				data[(y * 32 + x) * 4] = 1;
		}

		data[((12 + 2) * 32 + 2 * 4 + 2) * 4] = 0;
		data[(2 * 32 + 3 * 4 + 2) * 4] = 1;

		probes = renderer.Texture({Width: 32, Height: 16, Data: data}, {Float: true, Nearest: true});

		target.Begin();

		renderer.Draw(quad, program, {uProbeOn: 1, uProbe: probes, uProbeBox: [-2, -2, -2, 1], uProbeCount: [4, 8, 4]}, {Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		target.End();

		expect(gl.getError()).toBe(gl.NO_ERROR);
		/* Of the voxel over it: the mean of the light over its side (0.886 / pi), as much as the edge of the voxels lets (0.375). */
		expect(pixel[0]).toBeGreaterThan(65);
		expect(pixel[0]).toBeLessThan(80);
		expect(pixel[3]).toBeGreaterThan(90);
		expect(pixel[3]).toBeLessThan(100);
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

	/*
	 * A program is kept by the text it is made of, what Replaces put in it too. Regression: the light of the sky given anew (a
	 * graph of a Scene, put in by Replaces) gave back the program made of the old one, for the text before it was the same.
	 */
	it('makes a program again when what Replaces puts in its text is another, and keeps it while it is the same', function () {
		var canvas = document.createElement('canvas');
		var own = Elemenx.Service('Renderer').Create(canvas, {Antialias: false});
		var vertex = ['#version 300 es', 'in vec3 aPosition;', 'void main() { gl_Position = vec4(aPosition, 1.0); }'].join('\n');
		var fragment = ['#version 300 es', 'precision highp float;', 'out vec4 outColor;', '/* tint */', 'void main() { outColor = vec4(tint(), 1.0); }'].join('\n');
		var first;

		own.Replaces['/* tint */'] = 'vec3 tint() { return vec3(1.0, 0.0, 0.0); }';
		first = own.Program(vertex, fragment);

		expect(own.Program(vertex, fragment)).toBe(first);

		own.Replaces['/* tint */'] = 'vec3 tint() { return vec3(0.0, 1.0, 0.0); }';

		expect(own.Program(vertex, fragment)).not.toBe(first);

		own.Destroy();
	});

	/*
	 * A pass of its own nearer than all drawn (DepthRange: the inside of a ship over the surface of a body, near and far each of
	 * a frame of its own): what it draws lays its depth within its part of the buffer, before what is deeper.
	 */
	it('lays the depth of what it draws within a part of the buffer (DepthRange), all of it again with none', function () {
		var canvas = document.createElement('canvas');
		var own = Elemenx.Service('Renderer').Create(canvas, {Antialias: false});
		var program = own.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'uniform float uZ;',
			'void main() { gl_Position = vec4(aPosition.xy, uZ, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			'uniform vec4 uColor;',
			'out vec4 outColor;',
			'void main() { outColor = uColor; }'
		].join('\n'));
		var quad = own.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var gl = own.GL;
		var pixel = new Uint8Array(4);

		own.Resize(4, 4, 1);
		own.Clear([0, 0, 0, 1]);

		/* Far: at 0.4 of the buffer (z 0.4 * 2 - 1 = -0.2). */
		own.Draw(quad, program, {uZ: -0.2, uColor: [1, 0, 0, 1]}, {Cull: 'none'});

		/* Of its z the middle (0.5), within 0.6 to 1: deeper (0.8), behind. */
		own.DepthRange(0.6, 1);
		own.Draw(quad, program, {uZ: 0, uColor: [0, 1, 0, 1]}, {Cull: 'none'});

		gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(Array.from(pixel)).toEqual([255, 0, 0, 255]);

		/* Within 0 to 0.1 (0.05): before it. */
		own.DepthRange(0, 0.1);
		own.Draw(quad, program, {uZ: 0, uColor: [0, 0, 1, 1]}, {Cull: 'none'});

		gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(Array.from(pixel)).toEqual([0, 0, 255, 255]);

		/* All of it again: 0.5, behind the blue (0.05). */
		own.DepthRange();
		own.Draw(quad, program, {uZ: 0, uColor: [1, 1, 1, 1]}, {Cull: 'none'});

		gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		expect(Array.from(pixel)).toEqual([0, 0, 255, 255]);

		own.Destroy();
	});

	/* Its triangles again, its points kept: what a level of detail of clusters draws now (SceneClusters). */
	it('gives a mesh other triangles of the same points (Triangles)', function () {
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
		var before;

		expect(quad.Triangles([0, 1, 2])).toBe(quad);
		expect(quad.Count).toBe(3);

		before = renderer.Counts();

		renderer.Draw(quad, program, {}, {Depth: false, Cull: 'none'});

		expect(renderer.Counts().Triangles - before.Triangles).toBe(1);

		quad.Triangles(new Uint32Array([0, 1, 2, 0, 2, 3]));

		before = renderer.Counts();

		renderer.Draw(quad, program, {}, {Depth: false, Cull: 'none'});

		expect(renderer.Counts().Triangles - before.Triangles).toBe(2);

		quad.Destroy();
	});

	/* A mesh of a mode of its own (lines): its pairs of points drawn as lines, no triangle of them; the weights of materials of a ground taken. */
	/* The light and the shade of gas (a nebula): what glows added, what is behind dimmed by its alpha, the alpha behind kept. */
	it('blends premultiplied: its color added over what is behind, that dimmed as far as its alpha says', function () {
		var gl = renderer.GL;
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			'uniform vec4 uColor;',
			'out vec4 outColor;',
			'void main() { outColor = uColor; }'
		].join('\n'));
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var target = renderer.Target(2, 2, {});
		var pixel = new Uint8Array(4);

		target.Begin();

		renderer.Draw(quad, program, {uColor: [0, 0.8, 0, 0.6]}, {Depth: false, Cull: 'none'});
		renderer.Draw(quad, program, {uColor: [0.2, 0, 0, 0.5]}, {Blend: 'premultiplied', Depth: false, Cull: 'none'});

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		target.End();

		/* 0.2 + 0 · 0.5 red, 0 + 0.8 · 0.5 green, the alpha behind as it was. */
		expect(Math.round(pixel[0] / 255 * 100) / 100).toBeCloseTo(0.2, 1);
		expect(Math.round(pixel[1] / 255 * 100) / 100).toBeCloseTo(0.4, 1);
		expect(Math.round(pixel[3] / 255 * 100) / 100).toBeCloseTo(0.6, 1);
	});

	/*
	 * Regression: a scene let go while it loaded (all its programs asked for at once) deleted the programs the card was still
	 * making, and the browser told GL_INVALID_VALUE for each when it ended. Now each is let go once it is made.
	 */
	it('lets a program the card is still making go once it is made, not while it is made', async function () {
		var own = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = own.GL;
		var parallel = gl.getExtension('KHR_parallel_shader_compile');
		var deleted = [];
		var made = false;
		var real = gl.getProgramParameter;
		var remove = gl.deleteProgram;
		var program;

		if (!parallel) {
			own.Destroy();

			return;
		}

		program = own.Program('#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 1.0); }', '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(0.25); }');

		gl.getProgramParameter = function (handle, name) {
			return name === parallel.COMPLETION_STATUS_KHR ? made : real.apply(this, arguments);
		};

		gl.deleteProgram = function (handle) {
			deleted.push(handle);

			return remove.apply(this, arguments);
		};

		try {
			program.Settled = false;

			own.Destroy();

			expect(deleted).not.toContain(program.Handle);

			made = true;

			await waitFor(function () {
				return deleted.indexOf(program.Handle) !== -1;
			}, 3000);
		}
		finally {
			gl.getProgramParameter = real;
			gl.deleteProgram = remove;
		}
	});

	/*
	 * Regression: past their patience the programs the card was still making were waited for in the frame (Progress asked
	 * each), all at once, and on a card that makes them by itself too: the page froze 30 to 80 s, the ground's alone 21 s.
	 */
	it('waits for no program a card that makes them by itself still makes on a shown canvas; else for one at a time', function () {
		var shown = document.createElement('canvas');
		var source = ['#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 1.0); }', '#version 300 es\nprecision highp float;\nout vec4 outColor;\nvoid main() { outColor = vec4(0.5); }'];
		var made = [];

		/* by: the card makes the first program by itself (true) or none (false). */
		function renderer (canvas, by) {
			var own = Elemenx.Service('Renderer').Create(canvas, {Antialias: false, Patient: true, Patience: 0});
			var gl = own.GL;
			var real = gl.getProgramParameter;
			var parallel = gl.getExtension('KHR_parallel_shader_compile');
			var one = {Renderer: own, Asked: 0, Parallel: parallel};

			one.Programs = [own.Program(source[0], source[1]), own.Program(source[0], source[1].replace('0.5', '0.25')), own.Program(source[0], source[1].replace('0.5', '0.75'))];

			/* LINK_STATUS asked is a wait for the card. */
			gl.getProgramParameter = function (handle, name) {
				if (parallel && name === parallel.COMPLETION_STATUS_KHR) return by && handle === one.Programs[0].Handle;

				if (name === gl.LINK_STATUS)
					one.Asked++;

				return real.apply(this, arguments);
			};

			one.Programs.forEach(function (program) {
				program.Settled = false;
			});

			made.push(one);

			return one;
		}

		shown.style.cssText = 'width: 40px; height: 40px';

		document.body.appendChild(shown);

		try {
			var by = renderer(shown, true);
			var none = renderer(document.createElement('canvas'), false);

			if (!by.Parallel) return;

			/* Making them by itself, on a shown canvas: the one made settled, the others not waited for. */
			expect(by.Renderer.Progress()).toEqual({Done: 1, Total: 3, Needed: 2});
			expect(by.Renderer.Progress()).toEqual({Done: 1, Total: 3, Needed: 2});
			expect(by.Asked).toBe(1);

			/* Making none by itself: the first waited for, the others not in the same half second. */
			expect(none.Renderer.Progress()).toEqual({Done: 1, Total: 3, Needed: 2});
			expect(none.Asked).toBe(1);
		}
		finally {
			made.forEach(function (one) {
				one.Renderer.Destroy();
			});

			shown.remove();
		}
	});

	/* Regression: the most slant of a texture was asked of the card for each texture made, a wait for it each time. */
	it('asks the card the most slant of a texture once', function () {
		var own = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = own.GL;
		var slant = gl.getExtension('EXT_texture_filter_anisotropic');
		var real = gl.getParameter;
		var asked = 0;
		var i;

		if (!slant) {
			own.Destroy();

			return;
		}

		gl.getParameter = function (name) {
			if (name === slant.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
				asked++;

			return real.apply(this, arguments);
		};

		try {
			for (i = 0; i < 3; i++)
				own.Texture({Width: 4, Height: 4, Data: new Uint8Array(64)}, {Mipmaps: true});

			expect(asked).toBe(1);
		}
		finally {
			gl.getParameter = real;

			own.Destroy();
		}
	});

	/*
	 * Regression: the copies of a list were sent to the card again for each mesh that draws them (its shape, its shapes of the
	 * shadows, its lines), and where each attribute reads was told again at each upload: thousands of calls a frame.
	 */
	it('reads the copies of another mesh with Instance(data, count, from), and tells where an attribute reads once', function () {
		var own = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = own.GL;
		var geometry = {Positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], Indices: [0, 1, 2]};
		var data = {aInstance: {Size: 4, Data: new Float32Array([0, 0, 0, 1, 2, 0, 0, 1])}};
		var shape = own.Mesh(geometry);
		var shadow = own.Mesh(geometry);
		var location = Elemenx.Service('Renderer').Locations.aInstance;
		var calls = {bufferData: 0, bufferSubData: 0, vertexAttribPointer: 0};
		var real = {};

		Object.keys(calls).forEach(function (name) {
			real[name] = gl[name];

			gl[name] = function () {
				calls[name]++;

				return real[name].apply(this, arguments);
			};
		});

		try {
			shape.Instance(data, 2);
			shadow.Instance(data, 2, shape);

			/* Sent once, for the shape; the shadow reads its buffer. */
			expect(calls.bufferData + calls.bufferSubData).toBe(1);

			gl.bindVertexArray(shadow.VAO);

			expect(gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING)).toBe(shape.Buffers.aInstance);
			expect(gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_DIVISOR)).toBe(1);

			gl.bindVertexArray(null);

			calls.vertexAttribPointer = 0;

			/* Again: the numbers sent, where it reads not told again. */
			shape.Instance(data, 2);
			shadow.Instance(data, 2, shape);

			expect(calls.bufferSubData).toBe(1);
			expect(calls.vertexAttribPointer).toBe(0);
			expect(shadow.Instances).toBe(2);
		}
		finally {
			Object.keys(real).forEach(function (name) {
				gl[name] = real[name];
			});

			own.Destroy();
		}
	});

	/*
	 * Regression: all the uniforms of a program were walked by name and compared for each draw, a hundred of them, the same for
	 * all the draws of a pass. Over a set Shared marked, the set is put on a program once, then only what a draw gives itself.
	 */
	it('sets a Shared set on a program once, a draw its own over it, the set again where a draw gives none, and the set marked again', function () {
		var own = Elemenx.Service('Renderer').Create(document.createElement('canvas'), {Antialias: false});
		var gl = own.GL;
		var quad = own.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});
		var program = own.Program('#version 300 es\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 1.0); }', '#version 300 es\nprecision highp float;\nuniform vec4 uColor;\nuniform vec4 uTint;\nout vec4 outColor;\nvoid main() { outColor = uColor * uTint; }');
		var shared = own.Shared({uColor: [1, 0, 0, 1], uTint: [1, 1, 1, 1]});
		var set = gl.uniform4fv;
		var calls = 0;
		var pixel = new Uint8Array(4);

		function draw (values) {
			own.Resize(1, 1, 1);
			own.Draw(quad, program, values, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

			return Array.from(pixel);
		}

		gl.uniform4fv = function () {
			calls++;

			return set.apply(this, arguments);
		};

		try {
			expect(draw(Object.create(shared))).toEqual([255, 0, 0, 255]);

			calls = 0;

			/* The set is on the program: a draw of nothing of its own sets nothing. */
			expect(draw(Object.create(shared))).toEqual([255, 0, 0, 255]);
			expect(calls).toBe(0);

			/* Its own over the set, then a draw of none: the set's value back. */
			expect(draw(Object.assign(Object.create(shared), {uColor: [0, 1, 0, 1]}))).toEqual([0, 255, 0, 255]);
			expect(draw(Object.create(shared))).toEqual([255, 0, 0, 255]);

			/* The set changed and marked again: what it holds now. */
			shared.uTint = [0, 0, 1, 1];
			shared.uColor = [1, 1, 1, 1];

			own.Shared(shared);

			expect(draw(Object.create(shared))).toEqual([0, 0, 255, 255]);

			/* Values of no set: all of them, as before. */
			expect(draw({uColor: [0, 1, 0, 1], uTint: [1, 1, 1, 1]})).toEqual([0, 255, 0, 255]);
			expect(draw(Object.create(shared))).toEqual([0, 0, 255, 255]);
		}
		finally {
			gl.uniform4fv = set;

			own.Destroy();
		}
	});

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

	/* CopyDepth: the depth drawn so far into the target drawn into now, in a texture of its own to read while it is drawn again; none on the canvas. */
	it('copies the depth of the target drawn into now with CopyDepth, of a depth texture or of a buffer of depth, none on the canvas', function () {
		var gl = renderer.GL;
		var vertex = ['#version 300 es', 'in vec3 aPosition;', 'void main() { gl_Position = vec4(aPosition, 1.0); }'].join('\n');
		var flat = renderer.Program(vertex, ['#version 300 es', 'precision highp float;', 'out vec4 outColor;', 'void main() { outColor = vec4(1.0); }'].join('\n'));
		var reader = renderer.Program(['#version 300 es', 'in vec3 aPosition;', 'out vec2 vQuad;', 'void main() { vQuad = aPosition.xy; gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'].join('\n'), ['#version 300 es', 'precision highp float;', 'in vec2 vQuad;', 'uniform sampler2D uDepth;', 'out vec4 outColor;', 'void main() { outColor = vec4(texture(uDepth, vQuad * 0.5 + 0.5).r, 0.0, 0.0, 1.0); }'].join('\n'));
		var left = renderer.Mesh({Positions: [-1, -1, 0.5, 0, -1, 0.5, 0, 1, 0.5, -1, 1, 0.5], Indices: [0, 1, 2, 0, 2, 3]});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

		expect(renderer.CopyDepth()).toBe(null);

		[{DepthTexture: true}, {Depth: true}].forEach(function (options) {
			var target = renderer.Target(4, 4, options);
			var shown = renderer.Target(4, 4, {});
			var pixels = new Uint8Array(4 * 4 * 4);
			var copy;

			target.Begin();

			renderer.Clear([0, 0, 0, 1]);
			renderer.Draw(left, flat, {}, {Cull: 'none'});

			copy = renderer.CopyDepth();

			/* Drawn again over what it holds: the target is still the one drawn into. */
			gl.clear(gl.DEPTH_BUFFER_BIT);

			renderer.Draw(left, flat, {}, {Cull: 'none'});

			target.End();

			expect(copy).not.toBe(null);
			expect(target.Copy).toBe(copy);

			shown.Begin();

			renderer.Draw(quad, reader, {uDepth: copy}, {Depth: false, Cull: 'none'});

			gl.readPixels(0, 0, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

			shown.End();

			/* The left half of the depth of the square (0.75 of 0.5 in its view), the right half the depth it was cleared to. */
			expect(Math.abs(pixels[0] - 191)).toBeLessThan(2);
			expect(pixels[3 * 4]).toBe(255);
			expect(gl.getError()).toBe(gl.NO_ERROR);

			shown.Destroy();
			target.Destroy();
		});
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

	/*
	 * Regression: a sampler given no texture kept the unit it had; a texture of another type there (the arrays of the land
	 * of a planet near beside its colour map, before the first array came) made the browser drop the draw.
	 */
	it('gives a sampler that is given no texture a blank one of its type, so no draw has two types on one unit', function () {
		var gl = renderer.GL;
		var program = renderer.Program([
			'#version 300 es',
			'in vec3 aPosition;',
			'void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }'
		].join('\n'), [
			'#version 300 es',
			'precision highp float;',
			'precision highp sampler2DArray;',
			'uniform sampler2D uColorMap;',
			'uniform sampler2DArray uLandColor;',
			'uniform samplerCube uSky;',
			'out vec4 outColor;',
			'void main() { outColor = texture(uColorMap, vec2(0.5)) + texture(uLandColor, vec3(0.5, 0.5, 0.0)) + texture(uSky, vec3(0.0, 1.0, 0.0)); }'
		].join('\n'));
		var color = renderer.Texture({Width: 1, Height: 1, Data: new Uint8Array([255, 0, 0, 255])}, {Nearest: true});
		var target = renderer.Target(1, 1, {});
		var quad = renderer.Mesh({Positions: [-1, -1, 0, 3, -1, 0, -1, 3, 0], Indices: [0, 1, 2]});
		var pixel = new Uint8Array(4);

		while (gl.getError() !== gl.NO_ERROR);

		target.Begin();

		renderer.Draw(quad, program, {uColorMap: color, uLandColor: null}, {Depth: false, Cull: 'none'});

		expect(gl.getError()).toBe(gl.NO_ERROR);

		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		target.End();

		/* Drawn: the red of the colour map, the blanks adding nothing. */
		expect(Array.from(pixel)).toEqual([255, 0, 0, 255]);

		target.Destroy();
	});

	/*
	 * Regression: a page that made and dropped many scenes went past the contexts a browser keeps, which then gave no more.
	 * A context let go is given back (not when the canvas is collected): at once where the page has room for none more.
	 */
	it('gives its context back on Destroy when the page has no room for it, not when the canvas is collected', function () {
		var service = Elemenx.Service('Renderer');
		var most = service.MostContexts;
		var own = service.Create(document.createElement('canvas'), {Antialias: false});
		var gl = own.GL;

		expect(gl.isContextLost()).toBe(false);

		service.MostContexts = 0;

		try {
			own.Destroy();
		}
		finally {
			service.MostContexts = most;
		}

		expect(gl.isContextLost()).toBe(true);
		expect(renderer.GL.isContextLost()).toBe(false);
	});
});
