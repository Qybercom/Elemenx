import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

async function mount (species) {
	var component = Elemenx.Component(unique('FloraHost'), {$Template: '<div style="width: 900px; height: 480px"><FloraEditor #Editor [species]="Species" Name="flora-editor-test" (change)="Changed" (define)="Defined" /></div>', Species: species, Changes: [], Defines: [], Changed: function (value) {
		this.Changes.push(value);
	}, Defined: function (value) {
		this.Defines.push(value);
	}})();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && editor.Current;
	}, 20000);

	return {Host: component, Editor: editor};
}

/* A picture of a plant: a brown trunk to the foot of an oval green crown, on white. */
function picture () {
	var width = 200;
	var height = 200;
	var data = new Uint8Array(width * height * 4).fill(255);
	var x;
	var y;

	for (y = 20; y < 190; y++) {
		for (x = 0; x < width; x++) {
			var o = (y * width + x) * 4;
			var u = (x - 100) / 60;
			var v = (y - 80) / 60;
			var color = u * u + v * v <= 1 ? [50, 110, 40] : y > 120 && Math.abs(x - 100) <= 4 ? [110, 80, 50] : null;
			if (!color) continue;

			data[o] = color[0];
			data[o + 1] = color[1];
			data[o + 2] = color[2];
		}
	}

	return {Width: width, Height: height, Data: data};
}

describe('Contract: FloraEditor, a species of plant of a picture of it, grown in 3D', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['FloraEditor', 'Scene', 'SceneObject', 'service:SceneFlora', 'service:SceneModels', 'service:SceneWorld', 'service:Workers']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('starts of its species, reads a picture into its preset, its numbers on sliders, and grows the plant in its view', async function () {
		var mounted = await mount('birch');
		var editor = mounted.Editor;
		var element = editor.$Element();
		var made;

		expect(editor.Current().Bark.Pattern).toBe('birch');
		expect(element.querySelectorAll('.elemenx-flora-editor-panel input[type=range]').length).toBeGreaterThan(10);
		expect(element.querySelectorAll('.elemenx-flora-editor-panel input[type=color]').length).toBe(5);

		made = editor.Analyse(picture());

		/* Of the picture: its trunk bare from 190 to 140, a quarter of its height; its crown as wide as 60 of 170. */
		expect(made.Trunk.Bare).toBeGreaterThan(0.2);
		expect(made.Trunk.Bare).toBeLessThan(0.4);
		expect(made.Crown.Width).toBeCloseTo(60 / 170, 1);
		expect(made.Leaves.Color[1]).toBeGreaterThan(made.Leaves.Color[0]);
		/* What the picture does not tell, of its species. */
		expect(made.Bark.Pattern).toBe('birch');
		expect(mounted.Host.Changes.length).toBeGreaterThan(0);
		expect(element.querySelector('.elemenx-flora-editor-picture').classList.contains('shown')).toBe(true);

		/* No plant in the picture: null, the preset as it was. */
		expect(editor.Analyse({Width: 8, Height: 8, Data: new Uint8Array(256).fill(255)})).toBe(null);

		/* The plant of it grown in its view. */
		expect(await waitFor(function () {
			return editor.Shown && editor.$Service('SceneModels').Ready(editor.Shown);
		}, 60000)).not.toBe(false);
	}, 90000);

	it('turns a number of its preset on a slider, emits change, and defines the model under Name', async function () {
		var mounted = await mount('oak');
		var editor = mounted.Editor;
		var slider = editor.$Element().querySelector('input[data-key="Crown.Width"]');
		var models = editor.$Service('SceneModels');

		slider.value = '0.6';

		slider.dispatchEvent(new Event('change', {bubbles: true}));

		expect(editor.Current().Crown.Width).toBe(0.6);
		expect(mounted.Host.Changes[mounted.Host.Changes.length - 1].Preset.Crown.Width).toBe(0.6);

		expect(editor.Define()).toBe('flora-editor-test');
		expect(mounted.Host.Defines).toEqual([{Name: 'flora-editor-test'}]);
		expect(models.Info('flora-editor-test')).toMatchObject({Type: 'plant', Variants: 8});
	}, 60000);
});
