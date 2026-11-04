import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* An object editor, its scene ready and its model shown; a generator of one recipe when told. */
async function mount (state) {
	var component = Elemenx.Component(unique('ModelEditorHost'), Object.assign({$Template: '<div style="width: 900px; height: 560px"><ModelEditor #Editor [generator]="Generator" (change)="Changed" /></div>', Changes: [], Generator: null, Changed: function (document) {
		this.Changes.push(document);
	}}, state || {}))();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && editor.Scene() && editor.Scene().Get('model');
	}, 6000);

	editor.Scene().Scene().Loop.Stop();
	editor.Scene().SetViewpoint({Target: [0, 1, 0], Yaw: 0.3, Pitch: 0.25, Distance: 5});

	frame(editor);

	return {Host: component, Editor: editor};
}

function frame (editor) {
	var scene = editor.Scene();

	editor.Show();

	scene.Scene().Rest = 0;

	scene.Engine().Frame(performance.now());

	editor.Gizmo();
}

function overlay (editor) {
	return editor.$Element().querySelector('.elemenx-model-editor-overlay');
}

function pointer (target, type, x, y) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0}));
}

/* How tall a model of Models is, in its own units. */
function height (name) {
	var top = -Infinity;
	var bottom = Infinity;

	Elemenx.Service('SceneModels').Make(name).Pieces.forEach(function (piece) {
		var p = piece.Geometry.Positions;
		var i;

		for (i = 1; i < p.length; i += 3) {
			top = Math.max(top, p[i]);
			bottom = Math.min(bottom, p[i]);
		}
	});

	return top - bottom;
}

function field (editor, name) {
	return editor.$Element().querySelector('.elemenx-model-editor-fields [data-field="' + name + '"]');
}

describe('Contract: ModelEditor, a model of shapes edited part by part, its recipe of Models and its files', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['ModelEditor', 'service:ModelFormats']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('starts as a block, adds a part over the selected one in its piece, selects a part by a press on it, and emits the document', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var spot;
		var id;

		expect(editor.Recipe().Parts.map(function (part) {
			return part.ID;
		})).toEqual(['block']);

		/* A point of the model in the world: on the model, as large as the scene draws it (its Size). */
		expect(editor.Scene().Get('model').Size).toBe(editor.Shown);
		expect(editor.World([0.5, 0.5, -0.25]).map(function (value, i) {
			return Math.round((value - editor.Scene().Get('model').World[i]) * 1e6) / 1e6;
		})).toEqual([0.5 * editor.Shown, 0.5 * editor.Shown, -0.25 * editor.Shown]);

		editor.Select('block');

		id = editor.Add('ball');

		await tick(20);

		frame(editor);

		expect(editor.Selected).toBe(id);
		expect(editor.Recipe().Parts[1]).toMatchObject({ID: id, Shape: 'ball', Piece: 'body'});
		expect(editor.Recipe().Parts[1].At[1]).toBeGreaterThan(0.5);
		expect(mounted.Host.Changes[mounted.Host.Changes.length - 1].Recipe.Parts.length).toBe(2);
		expect(editor.$Element().querySelector('.elemenx-model-editor-side').textContent).toContain(id);

		/* A press on the block selects it; on the sky, nothing. */
		spot = editor.Scene().Project(editor.World([0, 0.25, 0]));

		pointer(overlay(editor), 'pointerdown', spot.X, spot.Y);
		pointer(overlay(editor), 'pointerup', spot.X, spot.Y);

		expect(editor.Selected).toBe('block');

		spot = editor.Scene().Project(editor.World([0, 3, 0]));

		pointer(overlay(editor), 'pointerdown', spot.X, spot.Y);
		pointer(overlay(editor), 'pointerup', spot.X, spot.Y);

		expect(editor.Selected).toBe('');
	});

	it('moves and scales a part by the gizmo along its axes, changes it by its fields, and undoes it all', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var tip;
		var box;
		var mirror;

		editor.Select('block');
		editor.Pick('move');

		frame(editor);

		/* Along X: the block goes the way the axis shows. */
		tip = editor.$Element().querySelector('circle[data-handle="move-x"]');
		box = tip.getBoundingClientRect();

		pointer(tip, 'pointerdown', box.left + 6, box.top + 6);
		pointer(overlay(editor), 'pointermove', box.left + 6 + 40, box.top + 6);
		pointer(overlay(editor), 'pointerup', box.left + 6 + 40, box.top + 6);

		expect(editor.Recipe().Parts[0].At[0]).toBeGreaterThan(0.05);
		expect(editor.Recipe().Parts[0].At[1]).toBe(0.25);

		/* Up the scale of Y: taller. */
		editor.Pick('scale');

		frame(editor);

		tip = editor.$Element().querySelector('rect[data-handle="scale-y"]');
		box = tip.getBoundingClientRect();

		pointer(tip, 'pointerdown', box.left + 5, box.top + 5);
		pointer(overlay(editor), 'pointermove', box.left + 5, box.top + 5 - 40);
		pointer(overlay(editor), 'pointerup', box.left + 5, box.top + 5 - 40);

		expect(editor.Recipe().Parts[0].Size[1]).toBeGreaterThan(0.5);

		/* Its fields: a color, a mirror, a piece of a rig, its vary. */
		field(editor, 'Color').value = '#ff0000';

		field(editor, 'Color').dispatchEvent(new Event('change'));

		mirror = field(editor, 'Mirror');
		mirror.checked = true;

		mirror.dispatchEvent(new Event('change'));

		field(editor, 'Piece').value = 'arm-l';

		field(editor, 'Piece').dispatchEvent(new Event('change'));

		field(editor, 'Vary.Size').value = '0.1, 0, 0.1';

		field(editor, 'Vary.Size').dispatchEvent(new Event('change'));

		field(editor, 'Piece.Pivot').value = '0, 0.5, 0';

		field(editor, 'Piece.Pivot').dispatchEvent(new Event('change'));

		expect(editor.Recipe().Parts[0]).toMatchObject({Color: '#ff0000', Mirror: true, Piece: 'arm-l', Vary: {Size: [0.1, 0, 0.1]}});
		expect(editor.Recipe().Pieces).toEqual([{ID: 'arm-l', Pivot: [0, 0.5, 0]}]);

		/* The model shown has both arms. */
		frame(editor);

		expect(Elemenx.Service('SceneModels').Make(editor.Scene().Get('model').Values.Model).Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['arm-l', 'arm-r']);

		[1, 2, 3, 4, 5, 6, 7].forEach(function () {
			editor.Undo();
		});

		expect(editor.Recipe().Parts[0]).toEqual({ID: 'block', Shape: 'box', Piece: 'body', At: [0, 0.25, 0], Size: [0.8, 0.5, 0.8], Color: '#9aa4b2'});
		expect(editor.Recipe().Pieces).toEqual([]);

		editor.Redo();

		expect(editor.Recipe().Parts[0].At[0]).toBeGreaterThan(0.05);
	});

	it('gives its model to Models under a name, and as files of every format that read back with its pieces', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var formats = Elemenx.Service('ModelFormats');
		var models = Elemenx.Service('SceneModels');

		editor.Select('block');
		editor.Add('cylinder', {Piece: 'leg-l', Mirror: true, At: [0.3, 0.2, 0]});

		expect(editor.Define('editor-test-model')).toBe('editor-test-model');
		expect(models.Make('editor-test-model').Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual(['body', 'leg-l', 'leg-r']);

		['glb', 'gltf', 'fbx', 'obj'].forEach(function (format) {
			var data = editor.Model(format);
			var asset = formats.Read(data, {Format: format});

			expect(asset.Meshes.length).toBe(3);
		});

		expect(models.Has(editor.Own().Key + '-export')).toBe(false);

		delete models.Recipes['editor-test-model'];
	});

	it('keeps its document when it is given the same again without a Seed: nothing loaded anew, the selection kept', async function () {
		var given = {Version: 1, Name: 'Crate', Recipe: {Parts: [{ID: 'box', Shape: 'box', At: [0, 0.5, 0], Size: [1, 1, 1]}]}};
		var mounted = await mount({Document: given, $Template: '<div style="width: 900px; height: 560px"><ModelEditor #Editor [value]="Document" (change)="Changed" /></div>'});
		var editor = mounted.Editor;
		var seed = editor.Recipe().Seed;

		expect(seed).toMatch(/^[a-z0-9]+$/);

		editor.Select('box');

		mounted.Host.Document = JSON.parse(JSON.stringify(given));

		await tick(20);

		expect(editor.Selected).toBe('box');
		expect(editor.Recipe().Seed).toBe(seed);
	});

	it('takes a recipe of the generator plugged in for a description, which Undo takes back; and shows the variant it is told', async function () {
		var asked = [];
		var mounted = await mount({Generator: function (description, callback) {
			asked.push(description);

			callback(null, {Variants: 6, Seed: 'pole', Parts: [{ID: 'pole', Shape: 'cylinder', At: [0, 0.5, 0], Size: [0.1, 1, 0.1], Vary: {Size: [0, 0.5, 0]}}]});
		}});
		var editor = mounted.Editor;
		var done = null;
		var shown;

		expect(editor.$Element().querySelector('.elemenx-model-editor-generator')).not.toBe(null);

		editor.Generate('a pole', function (error, recipe) {
			done = error || recipe;
		});

		expect(asked).toEqual(['a pole']);
		expect(done.Parts[0].ID).toBe('pole');
		expect(editor.Recipe().Variants).toBe(6);

		frame(editor);

		shown = editor.Scene().Get('model').Values.Model;

		expect(height(shown)).toBeCloseTo(1, 4);

		/* Another variant: another model shown, of another height; the one before let go. */
		editor.Variant = 3;
		editor.Own().Dirty = true;

		frame(editor);

		expect(editor.Scene().Get('model').Values.Model).not.toBe(shown);
		expect(Math.abs(height(editor.Scene().Get('model').Values.Model) - 1)).toBeGreaterThan(0.01);
		expect(Elemenx.Service('SceneModels').Has(shown)).toBe(false);

		/* The variant it shows is the one a game gets of it, under any name (regression: it showed one of its own seed). */
		editor.Define('editor-pole-game');

		expect(height('editor-pole-game')).toBeCloseTo(1, 6);
		expect(Elemenx.Service('SceneModels').Make('editor-pole-game', {Variant: 3}).Pieces[0].Geometry.Positions).toEqual(Elemenx.Service('SceneModels').Make(editor.Scene().Get('model').Values.Model).Pieces[0].Geometry.Positions);

		delete Elemenx.Service('SceneModels').Recipes['editor-pole-game'];

		editor.Undo();

		expect(editor.Recipe().Parts[0].ID).toBe('block');

		/* No generator: it says so. */
		editor.Generator = null;

		editor.Generate('x', function (error) {
			done = error;
		});

		expect(done.message).toBe('Elemenx ModelEditor: no Generator');
	});
});
