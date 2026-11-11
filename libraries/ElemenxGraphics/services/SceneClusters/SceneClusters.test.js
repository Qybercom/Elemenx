import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var clusters;
var meshes;
var IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

/* The edges of triangles that only one of them has: holes, cracks between levels. */
function open (built, indices) {
	var edges = {};
	var p = built.Positions;
	var i;

	function key (at) {
		return Math.round(p[at * 3] * 1e4) + ':' + Math.round(p[at * 3 + 1] * 1e4) + ':' + Math.round(p[at * 3 + 2] * 1e4);
	}

	for (i = 0; i < indices.length; i += 3) {
		[[0, 1], [1, 2], [2, 0]].forEach(function (pair) {
			var a = key(indices[i + pair[0]]);
			var b = key(indices[i + pair[1]]);
			var edge = a < b ? a + '|' + b : b + '|' + a;

			edges[edge] = (edges[edge] || 0) + 1;
		});
	}

	return {Open: Object.keys(edges).filter(function (edge) {
		return edges[edge] === 1;
	}).length, All: Object.keys(edges).length};
}

describe('Contract: SceneClusters, a level of detail of clusters as Nanite makes one', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneClusters', 'service:Meshes', 'service:Workers']);

		clusters = Elemenx.Service('SceneClusters');
		meshes = Elemenx.Service('Meshes');
	});

	/*
	 * A ball of 16 000 faces: near all of them, far (a few pixels) a quarter, farther a few hundred, between the finest near
	 * and the coarser farther, and
	 * where they meet no crack (the border of each group kept as it was).
	 */
	it('draws a model as fine as the screen needs, part by part, with no crack where its levels meet', function () {
		var ball = meshes.Facets(meshes.Sphere({Radius: 10, Segments: 128, Rings: 64}));
		var built = clusters.Build(ball);
		var finest = built.Triangles;
		var near = clusters.Select(built, IDENTITY, [0, 0, 12], 700, 1);
		var far = clusters.Select(built, IDENTITY, [0, 0, 3000], 700, 1);
		var farther = clusters.Select(built, IDENTITY, [0, 0, 30000], 700, 1);
		/* The eye by its surface, 30 pixels allowed: its near side at its finest, its far side coarser, a seam between them. */
		var mid = clusters.Select(built, IDENTITY, [0, 0, 14], 700, 30);
		var seam = open(built, mid.Indices);

		expect(built.Levels).toBeGreaterThan(3);
		expect(built.Indices).toBeInstanceOf(Uint32Array);
		expect(built.Clusters.length % 14).toBe(0);
		expect(near.Indices.length / 3).toBe(finest);
		expect(far.Indices.length / 3).toBeLessThan(finest / 4);
		expect(far.Level).toBeGreaterThan(1);
		expect(farther.Indices.length / 3).toBeLessThan(finest / 20);
		expect(mid.Indices.length / 3).toBeLessThan(near.Indices.length / 3);
		expect(mid.Indices.length / 3).toBeGreaterThan(far.Indices.length / 3);
		expect(mid.Level).toBeGreaterThan(0);
		expect(seam.Open).toBeLessThan(seam.All * 0.01);
	});

	/* A model turned and scaled: its spheres where it stands, its error by its scale. */
	it('chooses by where a model stands and how large it is', function () {
		var built = clusters.Build(meshes.Facets(meshes.Sphere({Radius: 1, Segments: 64, Rings: 32})));
		var small = clusters.Select(built, [1, 0, 0, 0, 1, 0, 0, 0, 1, 500, 0, 0], [500, 0, 400], 700, 1);
		var large = clusters.Select(built, [20, 0, 0, 0, 20, 0, 0, 0, 20, 500, 0, 0], [500, 0, 400], 700, 1);

		expect(large.Indices.length).toBeGreaterThan(small.Indices.length);
	});

	it('builds in a worker as in the page', async function () {
		var geometry = meshes.Facets(meshes.Sphere({Radius: 5, Segments: 48, Rings: 24}));
		var here = clusters.Build(geometry);
		var there = await new Promise(function (done, fail) {
			clusters.Work().Run('SceneClusters', 'Build', [geometry], function (error, result) {
				if (error) fail(error);
				else done(result);
			});
		});

		expect(there.Indices.length).toBe(here.Indices.length);
		expect(there.Levels).toBe(here.Levels);
	});
});
