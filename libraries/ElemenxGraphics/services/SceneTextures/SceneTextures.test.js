import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* The pixels of a column of a texture baked (its target read back), as one row of RGBA bytes. */
function column (renderer, made, x) {
	var gl = renderer.GL;
	var data = new Uint8Array(made.Size * 4);

	made.Target.Begin();

	gl.readBuffer(gl.COLOR_ATTACHMENT0);
	gl.readPixels(x, 0, 1, made.Size, gl.RGBA, gl.UNSIGNED_BYTE, data);

	made.Target.End();

	return data;
}

function apart (a, b) {
	var sum = 0;
	var i;

	for (i = 0; i < a.length; i += 4)
		sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);

	return sum / (a.length / 4);
}

describe('Contract: SceneTextures, textures of materials baked once into tiles with no seam', function () {
	var textures;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Renderer', 'service:SceneTextures', 'service:SceneMaterials', 'TextureLab', 'Scene', 'SceneObject']);

		textures = Elemenx.Service('SceneTextures');
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('bakes a recipe into a tile that repeats with no seam, with mipmaps, once for the same params', function () {
		var canvas = document.createElement('canvas');
		var renderer = Elemenx.Service('Renderer').Create(canvas, {Antialias: false});
		var gl = renderer.GL;
		var made;
		var again;
		var edge;
		var inside;

		expect(textures.Names('ground')).toEqual(expect.arrayContaining(['lawn', 'grassy-soil']));
		expect(textures.Names('road')).toEqual(expect.arrayContaining(['asphalt', 'paving', 'dirt']));
		expect(textures.Get('paving').Rows).toBe(true);
		expect(function () {
			textures.Define('broken', {});
		}).toThrow('Elemenx SceneTextures: a texture needs a name and its Code');

		['lawn', 'grassy-soil', 'asphalt', 'paving', 'dirt', 'cliff'].forEach(function (name) {
			made = textures.Bake(renderer, name, {Size: 256});

			expect(gl.getError()).toBe(gl.NO_ERROR);
			expect(made.Size).toBe(256);
			expect(made.Metres).toBe(textures.Get(name).Metres);

			gl.bindTexture(gl.TEXTURE_2D, made.Color.Handle);

			expect(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S)).toBe(gl.REPEAT);
			expect(gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER)).toBe(gl.LINEAR_MIPMAP_LINEAR);

			/* No seam: the last column goes on into the first as one column into the next inside it. */
			edge = apart(column(renderer, made, made.Size - 1), column(renderer, made, 0));
			inside = (apart(column(renderer, made, 80), column(renderer, made, 81)) + apart(column(renderer, made, 170), column(renderer, made, 171))) / 2;

			expect(edge).toBeLessThan(inside * 1.6 + 2);
		});

		made = textures.Bake(renderer, 'lawn', {Dry: 0.2, Size: 128});
		again = textures.Bake(renderer, 'lawn', {Dry: 0.2, Size: 128});

		expect(again).toBe(made);
		expect(textures.Bake(renderer, 'lawn', {Dry: 0.3, Size: 128})).not.toBe(made);
		expect(textures.Bake(renderer, 'nothing')).toBe(null);
		expect(textures.Source('lawn')).toContain('uniform float p_Dry;');
		expect(textures.Chunk()).toContain('void tex_sample(');

		renderer.Destroy();
	}, 60000);

	/*
	 * Regression: only the last array of tiles was kept and the one before was dropped with its textures still on the card;
	 * two grounds asking in turn (a planet near and a location under a hovering ship) made two arrays a frame, till the
	 * card ran out of memory and lost the context.
	 */
	it('keeps the arrays of grounds asked in turn, and gives back the textures of one it lets go', function () {
		var canvas = document.createElement('canvas');
		var renderer = Elemenx.Service('Renderer').Create(canvas, {Antialias: false});
		var gl = renderer.GL;
		var deleted = [];
		var remove = gl.deleteTexture;
		var first;
		var second;
		var sets = [['lawn'], ['asphalt'], ['dirt'], ['paving'], ['cliff'], ['grassy-soil'], ['lawn', 'dirt']];

		gl.deleteTexture = function (handle) {
			deleted.push(handle);

			return remove.apply(this, arguments);
		};

		try {
			first = textures.Array(renderer, ['lawn'], {lawn: {Size: 64}});
			second = textures.Array(renderer, ['asphalt'], {asphalt: {Size: 64}});

			/* Asked again in turn: the very same arrays, nothing made again. */
			expect(textures.Array(renderer, ['lawn'], {lawn: {Size: 64}})).toBe(first);
			expect(textures.Array(renderer, ['asphalt'], {asphalt: {Size: 64}})).toBe(second);
			expect(deleted).toEqual([]);

			/* More sets than are kept: the oldest goes, its two textures given back. */
			sets.slice(2).forEach(function (names) {
				var params = {};

				names.forEach(function (name) {
					params[name] = {Size: 64};
				});

				textures.Array(renderer, names, params);
			});

			expect(deleted).toEqual([first.Color.Handle, first.Surface.Handle]);
			expect(gl.getError()).toBe(gl.NO_ERROR);
		}
		finally {
			gl.deleteTexture = remove;

			renderer.Destroy();
		}
	}, 60000);

	it('shows a texture in TextureLab as a tile or a ground, a slider for each param, and tells change', async function () {
		var told = [];
		var component = Elemenx.Component(unique('LabHost'), {$Template: '<div style="width: 640px; height: 360px"><TextureLab #Lab Texture="grassy-soil" View="tile" (change)="Changed" /></div>', Changed: function (event) {
			told.push(event);
		}})();
		var lab;
		var slider;

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			lab = component.$Ref('Lab', true);

			return lab && lab.Own().Renderer;
		}, 8000);

		expect(lab.Sliders().map(function (one) {
			return one.Key;
		})).toEqual(['Cover', 'Weeds', 'Pebbles']);
		expect(lab.Picture()).toMatch(/^data:image\/png;base64,/);

		slider = lab.$Element().querySelector('input[data-key="Cover"]');
		slider.value = '0.2';

		slider.dispatchEvent(new Event('input', {bubbles: true}));

		expect(told[told.length - 1]).toEqual({Texture: 'grassy-soil', Params: {Cover: 0.2, Weeds: 0.5, Pebbles: 0.4}});

		lab.View = 'ground';

		expect(lab.Picture()).toMatch(/^data:image\/png;base64,/);
		expect(lab.Own().Renderer.GL.getError()).toBe(0);
	});

	/*
	 * A ground draws its materials of a texture with their tiles baked: the layers of two textures, each material its own
	 * layer, seen from over it on what is level and from its side on a slope.
	 */
	it('draws the materials of a ground that name a texture with their tiles, a layer each, bound to its land', async function () {
		var materials = Elemenx.Service('SceneMaterials');
		var ready = null;
		var component = Elemenx.Component(unique('LandHost'), {$Template: '<div style="width: 320px; height: 200px"><Scene Paused="true" Quality="low" Labels="false" (ready)="Ready">' +
			'<SceneObject ID="land" Kind="ground" Size="100" Height="2" Water="0" Seed="lawn" />' +
		'</Scene></div>', Ready: function (space) {
			ready = space;
		}})();
		var bound = [];
		var draw;
		var renderer;
		var i;

		expect(materials.Get('lawn').Texture).toBe('lawn');
		expect(materials.Get('asphalt').Texture).toBe('asphalt');
		/* Earth and the face of a cliff are the last layers of any ground: what is fairly steep and what is steep have them. */
		expect(materials.Textured(['soil', 'lawn', 'asphalt', 'lawn'])).toEqual(['lawn', 'asphalt', 'dirt', 'cliff']);
		expect(materials.Land(['soil', 'lawn'])).toContain('landCliff(2.0, 3.0000, 1.0, 2.0000, place, color, height);');
		expect(materials.Land(['soil', 'lawn'])).toContain('landTexture(0.0, 0.8000, 1.0, place, c, h, lit);');
		/* Paving, laid in rows, is sampled as it is. */
		expect(materials.Land(['paving'])).toContain('landTexture(0.0, 1.0000, -1.0, place, c, h, lit);');
		/* The steepness of the triangle too, where it is steeper than its corners say (a wall of a cliff). */
		expect(materials.Land(['lawn'])).toContain('landSlope = landSteeper(place);');
		expect(materials.Land(['soil', 'rock'])).not.toContain('landTexture(0');
		expect(materials.LandTexture).toContain('place.zy');
		/* The wear of years, larger than a tile (cracks, patches), on the asphalt of a road only: by its place on the road. */
		expect(materials.Surface('asphalt', true)).toContain('roadWear(q, length(fwidth(q)), color, r, h);');
		expect(materials.Surface('asphalt')).not.toContain('roadWear(q');
		expect(materials.Surface('paving', true)).not.toContain('roadWear(q');

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return ready;
		}, 4000);

		ready.Scene().Loop.Stop();

		renderer = ready.Engine().Renderer;
		draw = renderer.Draw;
		renderer.Draw = function (mesh, program, values) {
			if (values && values.uLandColor)
				bound.push(values.uLandColor);

			return draw.apply(this, arguments);
		};

		try {
			await waitFor(function () {
				ready.Scene().Rest = 0;

				ready.Engine().Frame(performance.now() + 100 + bound.length);

				return bound.length > 0;
			}, 20000);

			for (i = 0; i < 2; i++)
				ready.Engine().Frame(performance.now() + 200 + i);
		}
		finally {
			renderer.Draw = draw;
		}

		expect(ready.Scene().Ground.Field.Materials).toContain('lawn');
		expect(bound[0].Handle).toBeTruthy();
		expect(renderer.GL.getError()).toBe(renderer.GL.NO_ERROR);
	}, 40000);
});
