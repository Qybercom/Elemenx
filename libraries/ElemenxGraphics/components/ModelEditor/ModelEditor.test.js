import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* An object editor in its tab Roles, its scene ready and its model shown. */
async function mount () {
	var component = Elemenx.Component(unique('RolesEditorHost'), {$Template: '<div style="width: 900px; height: 560px"><ModelEditor #Editor (change)="Changed" /></div>', Changes: [], Changed: function (document) {
		this.Changes.push(document);
	}})();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && editor.Scene() && editor.Scene().Get('model');
	}, 6000);

	editor.Scene().Scene().Loop.Stop();
	editor.Scene().SetViewpoint({Target: [0, 0.5, 0], Yaw: 0.3, Pitch: 0.25, Distance: 4});
	editor.Moded('roles');

	await tick(20);

	frame(editor);

	return {Host: component, Editor: editor};
}

function frame (editor) {
	var scene = editor.Scene();

	editor.Show();

	scene.Scene().Rest = 0;

	scene.Engine().Frame(performance.now());

	editor.Marks();
}

function overlay (editor) {
	return editor.$Element().querySelector('.elemenx-model-editor-overlay');
}

function pointer (target, type, x, y, shift) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, shiftKey: !!shift}));
}

/* A press on a point of the model, in its own units, where the view shows it. */
function press (editor, at, shift) {
	var spot = editor.Scene().Project(editor.World(at));

	pointer(overlay(editor), 'pointerdown', spot.X, spot.Y, shift);
	pointer(overlay(editor), 'pointerup', spot.X, spot.Y, shift);
}

describe('Contract: ModelEditor, its tab Roles: what the parts of a model are', function () {
	beforeAll(async function () {
		localStorage.removeItem('elemenx-model-roles');

		await loadElemenx();

		Use(['ModelEditor', 'service:ModelRoles']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('adds a role of a kind, takes a piece whole by Pick, sets the point it turns round by Pivot, and keeps it in the recipe', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var role;

		expect(editor.$Element().querySelector('.elemenx-model-editor-role-model')).toBeTruthy();
		expect(editor.$Element().querySelector('.elemenx-model-editor-fields').textContent).toContain('Pick a role');

		editor.RoleAdded();

		await tick(20);

		expect(editor.Roles().length).toBe(1);
		expect(editor.RoleSelected).toBe(editor.Roles()[0].ID);
		expect(editor.$Element().querySelectorAll('.elemenx-model-editor-role').length).toBe(1);
		expect(editor.$Element().querySelector('.elemenx-model-editor-fields [data-field="Motion.Angle"] input').value).toBe('70');

		frame(editor);

		press(editor, [0.1, 0.3, 0.1]);

		role = editor.Roles()[0];

		expect(role.Parts).toEqual([{Piece: 'body'}]);

		editor.PickRoleTool('pivot');

		press(editor, [0, 0.25, 0]);

		role = editor.Roles()[0];

		/* A point of the face of the block the ray met: on the block, in its own units. */
		expect(Math.abs(role.Motion.Pivot[1] - 0.25)).toBeLessThan(0.2);
		expect(mounted.Host.Changes[mounted.Host.Changes.length - 1].Recipe.Roles[0].Motion.Pivot).toEqual(role.Motion.Pivot);

		/* A press with Pick again lets the piece go. */
		editor.PickRoleTool('pick');

		press(editor, [0.1, 0.3, 0.1]);

		expect(editor.Roles()[0].Parts).toEqual([]);
	});

	it('paints the triangles of a piece with the brush, wipes them with Shift, and undoes a stroke as one change', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var painted;

		editor.RoleKindPicked({target: {value: 'lamp-head'}});
		editor.RoleAdded();
		editor.PickRoleTool('brush');
		editor.BrushSized({target: {value: '0.15'}});

		await tick(20);

		frame(editor);

		press(editor, [0, 0.25, -0.4]);

		painted = editor.Roles()[0].Parts;

		expect(painted.length).toBe(1);
		expect(painted[0].Piece).toBe('body');
		expect(painted[0].Vertices.length).toBeGreaterThan(0);

		frame(editor);

		/* The parts of the role show over the model. */
		expect(editor.$Element().querySelector('.elemenx-model-editor-role-part').getAttribute('d').length).toBeGreaterThan(10);

		press(editor, [0, 0.25, -0.4], true);

		expect(editor.Roles()[0].Parts).toEqual([]);

		editor.Undo();

		expect(editor.Roles()[0].Parts).toEqual(painted);
	});

	it('tries a role: the model in the view moves as a scene moves it', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var id;

		editor.RoleAdded();

		id = editor.RoleSelected;

		await tick(20);

		frame(editor);

		press(editor, [0.1, 0.3, 0.1]);

		frame(editor);

		editor.RoleTried(1);

		expect(editor.Scene().Part('model', id).Get()).toBe(0);

		editor.Scene().Engine().RigsStep(5);

		expect(editor.Scene().Part('model', id).Get()).toBe(1);
	});

	it('edits the roles of another model, kept by ModelRoles, and undoes them', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var name = unique('kept-model');

		Elemenx.Service('SceneModels').Define(name, {Type: 'prop', Size: 1, Parts: [{ID: 'a', Shape: 'box', Piece: 'lid', At: [0, 0.5, 0], Size: [0.6, 0.2, 0.6]}]});

		editor.RoleModelPicked({target: {value: name}});

		await tick(20);

		frame(editor);

		expect(editor.Scene().Get('model').Values.Model).toBe(name);

		editor.RoleKindPicked({target: {value: 'hatch'}});
		editor.RoleAdded();

		expect(Elemenx.Service('ModelRoles').Get(name).map(function (role) {
			return role.Kind;
		})).toEqual(['hatch']);
		expect(editor.Recipe().Roles || []).toEqual([]);

		editor.Undo();

		expect(Elemenx.Service('ModelRoles').Get(name)).toEqual([]);

		Elemenx.Service('ModelRoles').Remove(name);
	});

	/*
	 * Its tab Parts: the pieces of the model listed, picked in the view or in the list; split, hidden, taken out into a model
	 * of its own; each change in the recipe of the document, Undo takes it back.
	 */
	it('edits the pieces of the model in its tab Parts: picked in the view, split, hidden, taken out, undone', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var models = editor.$Service('SceneModels');
		var list;

		editor.Moded('parts');

		await tick(20);

		frame(editor);

		list = editor.PartsList();

		expect(list.length).toBeGreaterThan(0);

		/* Picked in the view: the piece under the pointer. */
		press(editor, [0, 0.3, 0]);

		expect(editor.PartsSelected.length).toBe(1);

		var picked = editor.PartsSelected[0];

		/* Hidden: listed as hidden; then shown again by Undo. */
		editor.PartsHide();

		expect(editor.Recipe().Edits).toEqual([{Op: 'hide', Pieces: [picked], Hidden: true}]);
		expect(editor.PartsList().filter(function (piece) {
			return piece.ID === picked;
		})[0].Hidden).toBe(true);

		editor.Undo();

		frame(editor);

		expect(editor.Recipe().Edits || []).toEqual([]);

		/* Taken out: a model of its own of that piece. */
		editor.PartsSelected = [picked];

		editor.PartsNamed({target: {value: 'test-parts-out'}});
		editor.PartsExtract();

		expect(models.Make('test-parts-out').Pieces.map(function (piece) {
			return piece.ID;
		})).toEqual([picked]);

		await tick(30);

		/* Its modes are the tabs of a Tabs of ElemenxUI: Parts is the one chosen. */
		expect(mounted.Host.$Element().querySelector('.elemenx-model-editor-modes .elemenx-tab.active').textContent).toContain(Elemenx.Locale.Text('graphics.modelEditor.partsMode'));
		/* Gone from the model it was of: the list shows what is left. */
		expect(editor.PartsList().some(function (piece) {
			return piece.ID === picked;
		})).toBe(false);
		expect(mounted.Host.$Element().querySelectorAll('.elemenx-model-editor-roles .elemenx-model-editor-role').length).toBe(editor.PartsList().length);

		models.SetEdits(editor.RoleTarget(), []);
		delete models.Recipes['test-parts-out'];
	});

	/* On a touch screen: the actions of the part selected in a bar over the view, two fingers for the camera. */
	it('copies, frames and removes the part selected by its bar of actions, and two fingers turn the view without editing', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var bar;
		var parts;
		var id;
		var target = overlay(editor);
		var box = target.getBoundingClientRect();
		var yaw;
		var button = function (title) {
			return Array.prototype.find.call(bar.querySelectorAll('button'), function (node) {
				return node.getAttribute('title') === title || node.getAttribute('aria-label') === title;
			});
		};
		var finger = function (type, id, x, y) {
			target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: box.left + x, clientY: box.top + y, pointerId: id, pointerType: 'touch'}));
		};

		editor.Moded('shape');

		await tick(20);

		bar = editor.$Element().querySelector('.elemenx-view-actions');

		expect(button('Duplicate').disabled).toBe(true);

		id = editor.Add('box');

		editor.Select(id);

		await tick(20);

		parts = editor.Document().Recipe.Parts.length;

		button('Duplicate').click();

		await tick(20);

		expect(editor.Document().Recipe.Parts.length).toBe(parts + 1);

		editor.Select(id);

		await tick(20);

		button('Frame').click();

		expect(editor.Scene().Viewpoint().Target).toEqual(editor.World(editor.Part(id).At));

		button('Delete').click();

		await tick(20);

		expect(editor.Part(id)).toBe(null);

		/* Two fingers turning: the view goes round, nothing is selected. */
		editor.Select('');

		yaw = editor.Scene().Viewpoint().Yaw;

		finger('pointerdown', 11, 300, 280);
		finger('pointerdown', 12, 500, 280);
		finger('pointermove', 11, 300, 180);
		finger('pointermove', 12, 500, 380);
		finger('pointerup', 11, 300, 180);
		finger('pointerup', 12, 500, 380);

		await tick(200);

		expect(editor.Scene().Viewpoint().Yaw).not.toBeCloseTo(yaw, 3);
		expect(editor.Selected).toBe('');
	});
});

describe('Contract: ModelEditor, its tab Graph: the graph a model of the library is made of, beside the model', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['ModelEditor', 'Blueprint', 'service:ModelBlueprints']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('opens the graph of a model of the library, shows each change of it on the model, gives it to the library and takes it back', async function () {
		var component = Elemenx.Component(unique('GraphEditorHost'), {$Template: '<div style="width: 1100px; height: 560px"><ModelEditor #Editor Mode="graph" GraphModel="tank" /></div>'})();
		var models = Elemenx.Service('SceneModels');
		var editor;
		var graph;
		var shown;
		var before = models.Make('tank').Pieces[0].Geometry.Colors.slice(0, 3);

		owned.push(component);

		document.getElementById('mount').appendChild(component.$Element());

		await waitFor(function () {
			editor = component.$Ref('Editor', true);

			return editor && editor.Scene() && editor.Scene().Get('model') && editor.$Element().querySelector('.elemenx-model-editor-blueprint .elemenx-blueprint-block');
		}, 8000);

		editor.Scene().Scene().Loop.Stop();

		expect(editor.Mode).toBe('graph');
		expect(editor.GraphModel).toBe('tank');
		expect(editor.GraphOptions().map(function (option) {
			return option.Value;
		})).toEqual(expect.arrayContaining(['knight', 'tank', 'pine', 'temple']));
		expect(editor.GraphValue()).toEqual(Elemenx.Resources('Blueprints', 'ElemenxGraphics/models/tank'));
		expect(editor.$Element().querySelectorAll('.elemenx-model-editor-blueprint .elemenx-blueprint-block').length).toBe(editor.GraphValue().blocks.length);

		/* Its body painted red in the copy: the model shown is red at once, the library's not yet. */
		graph = JSON.parse(JSON.stringify(editor.GraphValue()));

		graph.blocks.filter(function (block) {
			return block.type === 'Formula' && block.properties[0].value === '[0.42, 0.46, 0.36]';
		}).forEach(function (block) {
			block.properties[0].value = '[1, 0, 0]';
		});

		editor.GraphChanged(graph);
		editor.Show();

		shown = models.Make(editor.Scene().Get('model').Values.Model);

		expect(shown.Pieces[0].Geometry.Colors.slice(0, 3)).toEqual([1, 0, 0]);
		expect(models.Make('tank').Pieces[0].Geometry.Colors.slice(0, 3)).toEqual(before);

		/* Given to the library, and taken back. */
		editor.ApplyGraph();

		expect(models.Make('tank').Pieces[0].Geometry.Colors.slice(0, 3)).toEqual([1, 0, 0]);

		editor.ResetGraph();

		expect(models.Make('tank').Pieces[0].Geometry.Colors.slice(0, 3)).toEqual(before);
		expect(editor.GraphValue()).toEqual(Elemenx.Resources('Blueprints', 'ElemenxGraphics/models/tank'));

		editor.Moded('shape');

		expect(editor.$Element().querySelector('.elemenx-model-editor-blueprint')).toBe(null);
	}, 30000);
});
