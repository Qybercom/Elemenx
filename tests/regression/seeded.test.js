import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

describe('Contract: Seeded, what is made of a seed saved as its recipe or baked', function () {
	var seeded;
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Seeded', 'service:SceneTerrainGenerator', 'service:Astronomy', 'service:SceneBiomes', 'service:SceneModels', 'service:Sigils', 'service:Suprematist']);

		seeded = Elemenx.Service('Seeded');
		terrain = Elemenx.Service('SceneTerrainGenerator');
	});

	/* A record goes through JSON as it would through a file. */
	function stored (record) {
		return JSON.parse(JSON.stringify(record));
	}

	it('saves a recipe of the kinds of the library and makes the very same thing of it', function () {
		var system = stored(seeded.Save('system', {Seed: 'kepler'}));
		var sigil = stored(seeded.Save('sigil', {Seed: 'ward', Rings: 5}));
		var picture = stored(seeded.Save('suprematism', {Seed: 'cover', Width: 120, Height: 80}));
		var village = stored(seeded.Save('village', {Seed: 'v', Terrain: {Size: 400, Height: 10, Water: 0.1, Seed: 'flat'}, X: 0, Y: 0, Houses: 4}));
		var model = stored(seeded.Save('model', {Name: 'oak', Variant: 2}));

		expect(seeded.Kinds()).toEqual(expect.arrayContaining(['terrain', 'system', 'village', 'model', 'sigil', 'suprematism']));
		expect(system).toEqual({Kind: 'system', Version: 1, Seed: 'kepler', Params: {}});
		expect(sigil.Params).toEqual({Rings: 5});

		expect(seeded.Load(system)).toEqual(Elemenx.Service('Astronomy').Generate('kepler'));
		expect(seeded.Load(sigil)).toEqual(Elemenx.Service('Sigils').Make('ward', {Rings: 5}));
		expect(seeded.Load(picture)).toBe(Elemenx.Service('Suprematist').Generate({Seed: 'cover', Width: 120, Height: 80}));
		expect(seeded.Load(village).Objects.length).toBe(4);
		expect(seeded.Load(model).Pieces.length).toBeGreaterThan(0);
	});

	/*
	 * Seeded is of ElemenxCommon and knows none of the kinds of the Libraries over it: the Service of a kind declares it
	 * in $Provides and is made as a record of it is loaded, in the Application that loads it.
	 */
	it('makes the Service that declares a kind as a record of it is loaded, and every one of them for the list', function () {
		var record = stored(seeded.Save('sigil', {Seed: 'ward', Rings: 3}));
		var fresh = Elemenx.Application('SeededFresh', {}).$Service('Seeded');
		var other = Elemenx.Application('SeededOther', {}).$Service('Seeded');

		expect(fresh.Load(record)).toEqual(Elemenx.Service('Sigils').Make('ward', {Rings: 3}));
		expect(fresh.Defined.terrain).toBeUndefined();
		expect(other.Kinds().sort()).toEqual(['model', 'sigil', 'suprematism', 'system', 'terrain', 'village']);

		expect(function () {
			fresh.Load({Kind: 'nothing', Version: 1, Params: {}});
		}).toThrow(/unknown kind nothing/);
	});

	it('bakes what it made, its lists of numbers packed as text, and reads it back without making it again', function () {
		var options = {Size: 300, Height: 40, Water: 0.2, Seed: 'baked'};
		var field = terrain.Flat(options);
		var record = stored(seeded.Save('terrain', options, {Baked: true, Side: 33, Made: field}));
		var read = seeded.Load(record);
		var x;

		expect(record.Seed).toBe('baked');
		expect(record.Baked.Side).toBe(33);
		expect(record.Baked.Heights.Typed).toBe('Float32Array');
		expect(typeof record.Baked.Heights.Base64).toBe('string');

		/* What was made already is baked as it is: a painted ground keeps its paint. */
		var painted = terrain.FromGrid(options, new Float32Array(33 * 33).fill(7), 33);

		expect(seeded.Load(stored(seeded.Save('terrain', options, {Baked: true, Side: 33, Made: painted}))).Height(20, -20)).toBe(7);

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
		record.Baked.Heights = seeded.Pack(new Float32Array(33 * 33).fill(5));

		expect(seeded.Load(record).Height(10, 10)).toBe(5);

		/* What has no Bake of its own is baked as it is, and a model as its pieces. */
		var picture = stored(seeded.Save('suprematism', {Seed: 'x', Width: 50, Height: 50}, {Baked: true}));
		var oak = stored(seeded.Save('model', {Name: 'oak'}, {Baked: true}));

		expect(seeded.Load(picture)).toContain('<svg');
		expect(seeded.Load(oak).Pieces[0].Geometry.Positions.length).toBeGreaterThan(0);
		expect(seeded.Load(stored(seeded.Save('system', {Seed: 's'}, {Baked: true})))).toEqual(Elemenx.Service('Astronomy').Generate('s'));
	});

	it('packs typed arrays of any kind and leaves functions out; tells what it cannot read', function () {
		var raw = seeded.Pack({A: new Uint16Array([1, 65535]), B: [new Int8Array([-3])], C: function () {}, D: 'text'});
		var back = seeded.Unpack(stored(raw));

		expect('C' in raw).toBe(false);

		expect(back.A).toBeInstanceOf(Uint16Array);
		expect(Array.from(back.A)).toEqual([1, 65535]);
		expect(Array.from(back.B[0])).toEqual([-3]);
		expect('C' in back).toBe(false);
		expect(back.D).toBe('text');

		expect(function () {
			seeded.Load({Kind: 'nothing', Version: 1});
		}).toThrow(/unknown kind nothing/);

		expect(function () {
			seeded.Load({Kind: 'system', Version: 9, Seed: 'a', Params: {}});
		}).toThrow(/newer/);

		expect(function () {
			seeded.Define('broken', {});
		}).toThrow(/needs Make/);

		/* A kind of the application. */
		seeded.Define('dice', {Version: 2, Make: function (params) {
			return [params.Seed.length, params.Sides];
		}});

		expect(seeded.Load(stored(seeded.Save('dice', {Seed: 'abc', Sides: 6})))).toEqual([3, 6]);
		expect(seeded.Save('dice', {Seed: 'abc'}).Version).toBe(2);
	});
});
