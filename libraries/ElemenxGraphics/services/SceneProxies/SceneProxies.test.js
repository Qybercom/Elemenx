import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var proxies;
var meshes;

/* A tile of copies of a house (large) and a tree (small) in rows, four numbers a copy as the Scatter keeps them. */
function tile (count) {
	var places = new Float32Array(count * 4);
	var extra = new Float32Array(count * 4);
	var i;

	for (i = 0; i < count; i++) {
		places.set([(i % 8) * 12 - 48, 0, Math.floor(i / 8) * 12 - 48, 1], i * 4);
		extra.set([i * 0.7, 1, 1, 1], i * 4);
	}

	return {Places: places, Extra: extra, Count: count};
}

describe('Contract: SceneProxies, many things far away as one simpler shape', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneProxies', 'service:Meshes', 'service:Workers', 'service:SceneModels']);

		proxies = Elemenx.Service('SceneProxies');
		meshes = Elemenx.Service('Meshes');
	});

	it('makes the data of a shape: its box, how far it reaches, the color of its upper part', function () {
		var geometry = meshes.Merge([{Geometry: meshes.Box({Width: 2, Height: 4, Depth: 2}), Color: [0.2, 0.6, 0.1]}]);
		var shape = proxies.Shape(geometry);

		expect(shape.Positions).toBeInstanceOf(Float32Array);
		expect(shape.Indices).toBeInstanceOf(Uint32Array);
		expect(shape.Box).toEqual([-1, -2, -1, 1, 2, 1]);
		expect(shape.Radius).toBeCloseTo(Math.sqrt(6), 5);
		expect(shape.Color[1]).toBeCloseTo(0.6, 5);
	});

	/*
	 * A tile of 64 copies: the large ones snapped to the grid (fewer faces than all their own), the small ones as small
	 * bodies of sixteen faces of their color, not gone; the positions relative to the origin of the tile.
	 */
	it('merges the copies of a tile into one shape of fewer faces, the small ones as small bodies', function () {
		var house = proxies.Shape(meshes.Merge([{Geometry: meshes.Sphere({Radius: 4, Segments: 48, Rings: 32}), Color: [0.8, 0.5, 0.4]}]));
		var tree = proxies.Shape(meshes.Merge([{Geometry: meshes.Sphere({Radius: 0.5, Segments: 12, Rings: 8}), Color: [0.1, 0.5, 0.1]}]));
		var made = proxies.Merge({Shapes: {house: house, tree: tree}, Lists: [Object.assign({Shape: 'house'}, tile(32)), Object.assign({Shape: 'tree'}, tile(32))], Origin: [100, 0, 100], Cell: 1});
		var full = 32 * house.Indices.length / 3;
		var i;
		var x = Infinity;

		expect(made.Copies).toBe(64);
		expect(made.Bodies).toBe(32);
		expect(made.Positions.length).toBe(made.Triangles * 9);
		expect(made.Triangles - 32 * 16).toBeGreaterThan(32 * 20);
		expect(made.Triangles - 32 * 16).toBeLessThan(full / 2);

		for (i = 0; i < made.Positions.length; i += 3)
			x = Math.min(x, made.Positions[i]);

		/* The first copy stands at -48 in the world: -148 from the origin of the tile, its sphere 4 round it. */
		expect(x).toBeGreaterThan(-153);
		expect(x).toBeLessThan(-150);

		/* Each face lit from outside: its normal away from the middle of its copy. */
		expect(Array.from(made.Normals.slice(0, 3)).some(function (value) {
			return Math.abs(value) > 0.1;
		})).toBe(true);
	});

	/* Packed to be kept, a quarter of its size; unpacked, the same to a centimetre, its colors to a step, its faces lit the same. */
	it('packs a proxy small to be kept and unpacks it as it was', function () {
		var house = proxies.Shape(meshes.Merge([{Geometry: meshes.Box({Width: 6, Height: 5, Depth: 8}), Color: [0.7, 1.6, 0.5]}]));
		var made = proxies.Merge({Shapes: {house: house}, Lists: [Object.assign({Shape: 'house'}, tile(16))], Origin: [0, 0, 0], Cell: 0.5});
		var packed = proxies.Pack(made);
		var back = proxies.Unpack(packed);
		var bytes = packed.Positions.byteLength + packed.Colors.byteLength;
		var worst = 0;
		var i;

		expect(packed.Positions).toBeInstanceOf(Int16Array);
		expect(packed.Colors).toBeInstanceOf(Uint8Array);
		expect(bytes).toBeLessThan((made.Positions.byteLength + made.Normals.byteLength + made.Colors.byteLength) / 3);
		expect(back.Triangles).toBe(made.Triangles);

		for (i = 0; i < made.Positions.length; i++)
			worst = Math.max(worst, Math.abs(back.Positions[i] - made.Positions[i]));

		expect(worst).toBeLessThan(0.01);

		for (i = 0; i < made.Colors.length; i++)
			expect(Math.abs(back.Colors[i] - made.Colors[i])).toBeLessThan(0.01);

		for (i = 0; i < made.Normals.length; i++)
			expect(back.Normals[i]).toBeCloseTo(made.Normals[i], 2);
	});

	it('makes the same proxy in a worker, its shapes sent once by Share', async function () {
		var pool = proxies.Work();
		var house = proxies.Shape(meshes.Merge([{Geometry: meshes.Box({Width: 6, Height: 5, Depth: 8}), Color: [0.7, 0.6, 0.5]}]));
		var job = {Lists: [Object.assign({Shape: 'house'}, tile(16))], Origin: [0, 0, 0], Cell: 1};
		var here = proxies.Merge(Object.assign({Shapes: {house: house}}, job));

		pool.Share('proxy-test:house', house);

		var there = await new Promise(function (done, fail) {
			pool.Run('SceneProxies', 'Merge', [Object.assign({Shapes: {house: 'proxy-test:house'}}, job)], function (error, result) {
				if (error) fail(error);
				else done(result);
			});
		});

		expect(there.Triangles).toBe(here.Triangles);
		expect(there.Positions).toBeInstanceOf(Float32Array);
		expect(Array.from(there.Positions.slice(0, 9))).toEqual(Array.from(here.Positions.slice(0, 9)));
	});
});
