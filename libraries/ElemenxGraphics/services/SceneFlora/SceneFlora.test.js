import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var flora;

describe('Contract: SceneFlora, realistic plants of code, each of a species another', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:SceneFlora', 'service:SceneModels', 'service:SceneCache', 'service:Meshes', 'service:Noise', 'service:Math', 'service:Random', 'service:Workers']);

		flora = Elemenx.Service('SceneFlora');
	});

	it('grows each species as tall as it is, its bark and its leaves within a budget of triangles, the same of the same seed', function () {
		flora.Species().forEach(function (name) {
			var preset = flora.Preset(name);
			var started = performance.now();
			var tree = flora.Tree(name, 0);
			var again = flora.Tree(name, 0);
			var other = flora.Tree(name, 1);
			var top = 0;
			var i;

			for (i = 1; i < tree.Bark.Positions.length; i += 3)
				top = Math.max(top, tree.Bark.Positions[i]);

			console.log('FLORA ' + name + ' height ' + tree.Height.toFixed(1) + ' top ' + top.toFixed(1) + ' nodes ' + tree.Nodes + ' bark ' + tree.Bark.Indices.length / 3 + ' leaves ' + tree.Leaves.Indices.length / 3 + ' lods ' + tree.Lods.map(function (lod) { return (lod.Bark.Indices.length + lod.Leaves.Indices.length) / 3; }).join('/') + ' ms ' + Math.round(performance.now() - started));

			expect(tree.Height).toBeGreaterThanOrEqual(preset.Height[0]);
			expect(tree.Height).toBeLessThanOrEqual(preset.Height[1]);
			expect(top).toBeGreaterThan(tree.Height * 0.6);
			expect(tree.Bark.Indices.length).toBeGreaterThan(0);
			expect(tree.Leaves.Indices.length).toBeGreaterThan(0);
			expect(tree.Triangles).toBeLessThan(60000);
			expect(tree.Bark.UVs.length / 2).toBe(tree.Bark.Positions.length / 3);
			expect(Array.from(again.Bark.Positions)).toEqual(Array.from(tree.Bark.Positions));
			expect(Array.from(other.Bark.Positions)).not.toEqual(Array.from(tree.Bark.Positions));
		});
	}, 120000);

	/* A reference made of its picture: its bare trunk, the profile of its crown, the colors of its leaves and of its bark. */
	it('makes a species of a picture of a plant: the largest of a row, its bare trunk, its crown, its colors; no plant, null', function () {
		var width = 300;
		var height = 200;

		function picture (plants, mark) {
			var data = new Uint8Array(width * height * 4).fill(255);

			function paint (x, y, color) {
				var o = (y * width + x) * 4;

				data[o] = color[0];
				data[o + 1] = color[1];
				data[o + 2] = color[2];
			}

			plants.forEach(function (plant) {
				var x;
				var y;

				/* Its trunk, brown, from the ground to the foot of its crown and into it. */
				for (y = plant.Foot; y < 190; y++) {
					for (x = plant.X - 3; x <= plant.X + 3; x++)
						paint(x, y, [110, 80, 50]);
				}

				/* Its crown: an oval, green, lighter on its top. */
				for (y = plant.Top; y < plant.Foot + 10; y++) {
					for (x = plant.X - plant.R; x <= plant.X + plant.R; x++) {
						var u = (x - plant.X) / plant.R;
						var v = (y - (plant.Top + plant.Foot + 10) / 2) / ((plant.Foot + 10 - plant.Top) / 2);
						if (u * u + v * v <= 1)
							paint(x, y, y < (plant.Top + plant.Foot) / 2 ? [90, 150, 60] : [40, 90, 30]);
					}
				}
			});

			/* A mark of the picture at its foot (text): no crown. */
			if (mark) {
				for (var y = 180; y < 190; y++) {
					for (var x = 230; x < 290; x++)
						paint(x, y, [90, 90, 90]);
				}
			}

			return {Width: width, Height: height, Data: data};
		}

		var one = flora.FromPicture(picture([{X: 150, Top: 30, Foot: 110, R: 50}]), 'oak');
		var row = flora.FromPicture(picture([{X: 60, Top: 70, Foot: 130, R: 30}, {X: 170, Top: 20, Foot: 100, R: 60}], true), 'oak');

		/* Its trunk bare from 190 up to the foot of its crown (some 120: a third of its height of 160). */
		expect(one.Preset.Trunk.Bare).toBeGreaterThan(0.3);
		expect(one.Preset.Trunk.Bare).toBeLessThan(0.55);
		expect(one.Preset.Crown.Width).toBeCloseTo(50 / 160, 1);
		expect(one.Found.Trunk).toBeCloseTo(150, -1);
		/* Its crown widest in its middle, narrow at its top. */
		expect(one.Preset.Crown.Profile[4][1]).toBeGreaterThan(0.9);
		expect(one.Preset.Crown.Profile[8][1]).toBeLessThan(0.5);
		/* Its leaves from dark to light green, its bark brown. */
		expect(one.Preset.Leaves.Shade[1]).toBeLessThan(one.Preset.Leaves.Light[1]);
		expect(one.Preset.Leaves.Color[1]).toBeGreaterThan(one.Preset.Leaves.Color[0]);
		expect(one.Preset.Bark.Low[0]).toBeGreaterThan(one.Preset.Bark.Low[2]);
		expect(one.Preset.Leaves.Kind).toBe('broad');

		/* Of a row of two and a mark: the larger one; the mark at its foot no crown. */
		expect(row.Found.Trunk).toBeCloseTo(170, -1);
		expect(row.Preset.Trunk.Bare).toBeGreaterThan(0.4);

		expect(flora.FromPicture({Width: 10, Height: 10, Data: new Uint8Array(400).fill(255)}, 'oak')).toBe(null);
	});

	it('draws its bark (a normal map with it) and its leaves, cut where there is no leaf, or takes pictures of its own', function () {
		var made = flora.Textures('oak');
		var own = {Width: 2, Height: 2, Data: new Uint8Array(16).fill(200)};
		var given = flora.Textures(Object.assign(flora.Preset('oak'), {Leaves: Object.assign(flora.Preset('oak').Leaves, {Image: own})}));
		var clear = 0;
		var solid = 0;
		var i;

		expect(made.Bark.Width * made.Bark.Height * 4).toBe(made.Bark.Data.length);
		expect(made.BarkNormal.Data.length).toBe(made.Bark.Data.length);

		for (i = 3; i < made.Leaves.Data.length; i += 4) {
			if (made.Leaves.Data[i] === 0) clear++;
			else if (made.Leaves.Data[i] === 255) solid++;
		}

		expect(clear).toBeGreaterThan(made.Leaves.Data.length / 4 * 0.2);
		expect(solid).toBeGreaterThan(made.Leaves.Data.length / 4 * 0.05);
		expect(given.Leaves).toBe(own);
	}, 60000);

	it('defines a species as a model of SceneModels, each of its variants another plant, made in workers', async function () {
		var models = Elemenx.Service('SceneModels');
		var name = flora.Define('flora-test-birch', 'birch', {Variants: 3});
		var first = await new Promise(function (done, failed) {
			models.Load(name, function (error, model) {
				if (error) failed(error);
				else done(model);
			});
		});
		var second = models.Make(name, {Variant: 1});
		var surfaces = models.Surfaces(first);

		expect(models.Info(name)).toMatchObject({Type: 'plant', Variants: 3});
		expect(first.Asset.Materials.map(function (material) {
			return material.Alpha;
		})).toEqual(['OPAQUE', 'MASK']);
		expect(first.Asset.Materials[1].DoubleSided).toBe(true);
		expect(first.Asset.Images[0].Picture.Width).toBe(256);
		expect(second.Asset).not.toBe(first.Asset);
		expect(second.Asset.Images[2]).toBe(first.Asset.Images[2]);
		expect(surfaces.length).toBe(2);

		/* Kept in the browser: the same species again is taken as it was grown, at once, not grown again. */
		var kept = Elemenx.Service('SceneCache').Peek('flora', flora.Key(flora.Preset('birch'), 3));
		var started = performance.now();
		var again = flora.Define('flora-test-birch-again', 'birch', {Variants: 3});
		var model = await new Promise(function (done, failed) {
			models.Load(again, function (error, made) {
				if (error) failed(error);
				else done(made);
			});
		});

		expect(kept.Trees.length).toBe(3);
		expect(performance.now() - started).toBeLessThan(300);
		expect(Array.from(model.Asset.Meshes[0][0].Geometry.Positions)).toEqual(Array.from(first.Asset.Meshes[0][0].Geometry.Positions));
	}, 120000);
});
