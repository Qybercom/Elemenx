import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];
var images;
var blueprints;

describe('ImageBlueprints: pictures of graphs', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['BlueprintPreview', 'service:ImageBlueprints', 'service:Blueprints', 'service:SceneFlora']);

		images = Elemenx.Service('ImageBlueprints');
		blueprints = Elemenx.Service('Blueprints');
	}, 60000);

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	/* A picture of its own: a ramp of red across, its relief rising across (its normal map leaning back). */
	function ramp (wrap) {
		var graph = blueprints.Create('image', {name: 'ramp'});

		blueprints.Add(graph, 'Input', {id: 'u', properties: {Name: 'U'}});
		blueprints.Add(graph, 'Combine', {id: 'color'});
		blueprints.Add(graph, 'Image', {id: 'image', properties: {Width: 8, Height: 4, Strength: 4, Wrap: wrap}});
		blueprints.Link(graph, ['u', 'Value'], ['color', 'X']);
		blueprints.Link(graph, ['color', 'XYZW'], ['image', 'Color']);
		blueprints.Link(graph, ['u', 'Value'], ['image', 'Bump']);

		return graph;
	}

	it('declares the kind image and its blocks, and makes a picture of each pixel of a graph', function () {
		var made;

		expect(blueprints.Graphs()).toContain('image');
		expect(blueprints.Nodes('image')).toEqual(expect.arrayContaining(['Image', 'Bark', 'Leaves', 'Combine']));
		expect(blueprints.Nodes('generator')).not.toContain('Bark');

		made = images.Make(ramp(false));

		expect(made.Picture.Width).toBe(8);
		expect(made.Picture.Height).toBe(4);
		/* Red across: 0 at the left, 7/8 at the right; alpha 1. */
		expect(Array.from(made.Picture.Data.slice(0, 4))).toEqual([0, 0, 0, 255]);
		expect(made.Picture.Data[7 * 4]).toBe(Math.round(7 / 8 * 255));
		expect(made.Picture.Mean[0]).toBeGreaterThan(0.2);
		/* Its relief rising across: its normals lean to -x. */
		expect(made.Normal.Data[3 * 4]).toBeLessThan(128);
		/* Not seamless: the right edge of it as steep as the inside, half as much (one step, not two). */
		expect(made.Normal.Data[7 * 4]).toBeGreaterThan(made.Normal.Data[3 * 4]);
		/* Seamless: the right edge reaches round to the left, a fall there. */
		expect(images.Make(ramp(true)).Normal.Data[7 * 4]).toBeGreaterThan(128);
	});

	it('takes a picture made whole, and runs it once', function () {
		var compiled = images.Compiled('ElemenxGraphics/image/leaves');
		var flora = Elemenx.Service('SceneFlora');
		var made = images.Run(compiled, {}, {Preset: flora.Preset('reed')});

		expect(compiled.Told).toEqual(['Picture']);
		expect(made.Normal).toBe(null);
		expect(made.Picture.Width).toBe(512);
		expect(made.Picture.Height).toBe(1024);
		expect(images.Sample('ElemenxGraphics/image/leaves').Preset.Name).toBe(flora.Species()[0]);
	});

	it('refuses a graph of another kind and one of no Image', function () {
		expect(function () {
			images.Compiled('ElemenxGraphics/cloud/sky');
		}).toThrow(/not a graph of an image/);

		expect(function () {
			images.Compiled(blueprints.Create('image', {name: 'empty'}));
		}).toThrow(/has no Image/);
	});

	it('shows a picture in BlueprintPreview', async function () {
		var drawn = null;
		var component = Elemenx.Component(unique('ImageHost'), {$Template: '<div style="width: 300px"><BlueprintPreview Graph="ElemenxGraphics/image/bark" Height="200" (drawn)="Drawn" /></div>', Drawn: function (event) {
			drawn = event;
		}})();

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			return drawn;
		}, 15000);

		expect(drawn).toEqual({Kind: 'image', Count: 256 * 1024});
		expect(component.$Element().textContent).toContain('256 by 1024');
	});
});
