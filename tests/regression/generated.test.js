import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

describe('Contract: Generated, what is made of a seed saved as its recipe or baked', function () {
	var generated;
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Generated', 'service:Terrain', 'service:Astronomy', 'service:Biomes', 'service:Models', 'service:Sigils', 'service:Suprematist']);

		generated = Elemenx.Service('Generated');
		terrain = Elemenx.Service('Terrain');
	});

	/* A record goes through JSON as it would through a file. */
	function stored (record) {
		return JSON.parse(JSON.stringify(record));
	}

	it('saves a recipe of the kinds of the library and makes the very same thing of it', function () {
		var system = stored(generated.Save('system', {Seed: 'kepler'}));
		var sigil = stored(generated.Save('sigil', {Seed: 'ward', Rings: 5}));
		var picture = stored(generated.Save('suprematism', {Seed: 'cover', Width: 120, Height: 80}));
		var village = stored(generated.Save('village', {Seed: 'v', Terrain: {Size: 400, Height: 10, Water: 0.1, Seed: 'flat'}, X: 0, Y: 0, Houses: 4}));
		var model = stored(generated.Save('model', {Name: 'oak', Variant: 2}));

		expect(generated.Kinds()).toEqual(expect.arrayContaining(['terrain', 'system', 'village', 'model', 'sigil', 'suprematism']));
		expect(system).toEqual({Kind: 'system', Version: 1, Seed: 'kepler', Params: {}});
		expect(sigil.Params).toEqual({Rings: 5});

		expect(generated.Load(system)).toEqual(Elemenx.Service('Astronomy').Generate('kepler'));
		expect(generated.Load(sigil)).toEqual(Elemenx.Service('Sigils').Make('ward', {Rings: 5}));
		expect(generated.Load(picture)).toBe(Elemenx.Service('Suprematist').Generate({Seed: 'cover', Width: 120, Height: 80}));
		expect(generated.Load(village).Objects.length).toBe(4);
		expect(generated.Load(model).Pieces.length).toBeGreaterThan(0);
	});

	it('bakes what it made, its lists of numbers packed as text, and reads it back without making it again', function () {
		var options = {Size: 300, Height: 40, Water: 0.2, Seed: 'baked'};
		var field = terrain.Flat(options);
		var record = stored(generated.Save('terrain', options, {Baked: true, Side: 33, Made: field}));
		var read = generated.Load(record);
		var x;

		expect(record.Seed).toBe('baked');
		expect(record.Baked.Side).toBe(33);
		expect(record.Baked.Heights.Typed).toBe('Float32Array');
		expect(typeof record.Baked.Heights.Base64).toBe('string');

		/* What was made already is baked as it is: a painted ground keeps its paint. */
		var painted = terrain.FromGrid(options, new Float32Array(33 * 33).fill(7), 33);

		expect(generated.Load(stored(generated.Save('terrain', options, {Baked: true, Side: 33, Made: painted}))).Height(20, -20)).toBe(7);

		/* The grid at its points, the noise between them near enough, and the noise out of it. */
		expect(read.Height(0, 0)).toBeCloseTo(field.Height(0, 0), 3);
		expect(read.Height(150 - 300 / 32, -150)).toBeCloseTo(field.Height(150 - 300 / 32, -150), 3);

		for (x = -140; x < 140; x += 35)
			expect(Math.abs(read.Height(x, x / 2) - field.Height(x, x / 2))).toBeLessThan(6);

		expect(read.Height(400, 0)).toBeCloseTo(field.Height(400, 0), 6);
		expect(read.Grid).toBeInstanceOf(Float32Array);
		expect(read.Options).toBeUndefined();
		expect(read.Chunk(0, 0, 50, 4).Positions.length).toBeGreaterThan(0);

		/* A painted point is the ground there. */
		read.Grid[16 * 33 + 16] = 99;

		expect(read.Height(0, 0)).toBe(99);

		/* Read back as it was: Load makes nothing of the noise for it. */
		record.Baked.Heights = generated.Pack(new Float32Array(33 * 33).fill(5));

		expect(generated.Load(record).Height(10, 10)).toBe(5);

		/* What has no Bake of its own is baked as it is, and a model as its pieces. */
		var picture = stored(generated.Save('suprematism', {Seed: 'x', Width: 50, Height: 50}, {Baked: true}));
		var oak = stored(generated.Save('model', {Name: 'oak'}, {Baked: true}));

		expect(generated.Load(picture)).toContain('<svg');
		expect(generated.Load(oak).Pieces[0].Geometry.Positions.length).toBeGreaterThan(0);
		expect(generated.Load(stored(generated.Save('system', {Seed: 's'}, {Baked: true})))).toEqual(Elemenx.Service('Astronomy').Generate('s'));
	});

	it('packs typed arrays of any kind and leaves functions out; tells what it cannot read', function () {
		var raw = generated.Pack({A: new Uint16Array([1, 65535]), B: [new Int8Array([-3])], C: function () {}, D: 'text'});
		var back = generated.Unpack(stored(raw));

		expect('C' in raw).toBe(false);

		expect(back.A).toBeInstanceOf(Uint16Array);
		expect(Array.from(back.A)).toEqual([1, 65535]);
		expect(Array.from(back.B[0])).toEqual([-3]);
		expect('C' in back).toBe(false);
		expect(back.D).toBe('text');

		expect(function () {
			generated.Load({Kind: 'nothing', Version: 1});
		}).toThrow(/unknown kind nothing/);

		expect(function () {
			generated.Load({Kind: 'system', Version: 9, Seed: 'a', Params: {}});
		}).toThrow(/newer/);

		expect(function () {
			generated.Define('broken', {});
		}).toThrow(/needs Make/);

		/* A kind of the application. */
		generated.Define('dice', {Version: 2, Make: function (params) {
			return [params.Seed.length, params.Sides];
		}});

		expect(generated.Load(stored(generated.Save('dice', {Seed: 'abc', Sides: 6})))).toEqual([3, 6]);
		expect(generated.Save('dice', {Seed: 'abc'}).Version).toBe(2);
	});
});
