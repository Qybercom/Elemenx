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
		expect(editor.$Element().querySelector('.elemenx-model-editor-fields [data-field="Motion.Angle"]').value).toBe('70');

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
});
