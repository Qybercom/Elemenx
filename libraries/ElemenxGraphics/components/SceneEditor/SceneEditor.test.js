import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

/* A scene editor of a star system: a new document is a star and a planet. */
async function mount () {
	var component = Elemenx.Component(unique('SpaceEditorHost'), {$Template: '<div style="width: 900px; height: 560px"><SceneEditor #Editor Setting="space" (change)="Changed" /></div>', Changes: [], Changed: function (document) {
		this.Changes.push(document);
	}})();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && editor.Scene() && editor.Scene().Get('planet');
	}, 6000);

	editor.Scene().Scene().Loop.Stop();

	frame(editor);

	return {Host: component, Editor: editor};
}

function frame (editor) {
	var scene = editor.Scene();

	scene.Scene().Rest = 0;

	scene.Engine().Frame(performance.now());

	editor.Gizmo();
}

function pointer (target, type, x, y) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0}));
}

function overlay (editor) {
	return editor.$Element().querySelector('.elemenx-scene-editor-overlay');
}

/* Where a handle of the gizmo is on the page, in its middle. */
function middle (editor, selector) {
	var box = editor.$Element().querySelector(selector).getBoundingClientRect();

	return [box.left + box.width / 2, box.top + box.height / 2];
}

/* The angle of a place round its parent in the plane, as an orbit goes (degrees, from X toward -Z of the view). */
function angle (object, parent) {
	return (Math.atan2(-(object.World[2] - parent.World[2]), object.World[0] - parent.World[0]) * 180 / Math.PI + 360) % 360;
}

describe('Contract: SceneEditor of a star system: bodies added round the one that fits, moved on their orbits', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['SceneEditor']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('starts as a star and a planet, offers the kinds of space and no sketch, and keeps its setting in the document', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var planet = scene.Get('planet');

		expect(editor.Space()).toBe(true);
		expect(planet.Parent).toBe('star');
		expect(angle(planet, scene.Get('star'))).toBeCloseTo(30, 6);
		expect(Array.prototype.map.call(editor.$Element().querySelectorAll('.elemenx-scene-editor-kind'), function (button) {
			return button.getAttribute('data-kind');
		})).toEqual(editor.SpaceKinds);
		expect(editor.$Element().querySelector('[data-tool="sketch"]')).toBe(null);
		expect(editor.Document().Setting).toBe('space');

		/* Its fields are those of its traits: no place on a ground; a field by the name of its trait. */
		editor.Select('planet');

		await tick(20);

		var fields = Array.prototype.map.call(editor.$Element().querySelectorAll('.elemenx-scene-editor-fields [data-field]'), function (input) {
			return input.getAttribute('data-field');
		});

		expect(fields).toContain('Distance');
		expect(fields).not.toContain('Lift');

		var radius = editor.$Element().querySelectorAll('.elemenx-scene-editor-fields [data-field="Radius"]')[0];

		radius.value = '3000';

		radius.dispatchEvent(new Event('change'));

		expect(scene.Get('planet').Traits.Body.Radius).toBe(3000);
	});

	it('adds a planet round the star, a moon round the selected planet, each farther out than the last of its kind', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var second;
		var moon;
		var other;

		editor.Select('star');

		second = scene.Get(editor.Add('planet'));

		expect(second.Parent).toBe('star');
		expect(second.Traits.Orbit.Distance).toBe(0.68);
		expect(second.Traits.Orbit.Anomaly).toBe(137);

		editor.Select('planet');

		moon = scene.Get(editor.Add('moon'));

		editor.Select('planet');

		other = scene.Get(editor.Add('moon'));

		expect(moon.Parent).toBe('planet');
		expect(other.Parent).toBe('planet');
		expect(other.Traits.Orbit.Distance).toBeGreaterThan(moon.Traits.Orbit.Distance);

		/* A copy goes round the same body, farther on its orbit. */
		editor.Select(moon.ID);

		overlay(editor).dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyD', key: 'd', ctrlKey: true, bubbles: true, cancelable: true}));

		var copy = scene.Get(editor.Selected);

		expect(copy.ID).not.toBe(moon.ID);
		expect(copy.Parent).toBe('planet');
		expect(copy.Traits.Orbit.Anomaly).toBe((moon.Traits.Orbit.Anomaly + 40) % 360);
	});

	it('carries a body on its orbit by the square of the gizmo to the point under the pointer, tilts its orbit, and undoes it', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var star = scene.Get('star');
		var at;
		var goal;
		var tip;

		editor.Select('planet');
		editor.Pick('move');

		frame(editor);

		/* To a point of the plane of the star, at 180 degrees and 20 units out: 2.78 AU, as the scene spreads them. */
		at = middle(editor, '[data-handle="move-orbit"]');
		goal = scene.Project([-20, 0, 0]);

		pointer(editor.$Element().querySelector('[data-handle="move-orbit"]'), 'pointerdown', at[0], at[1]);
		pointer(overlay(editor), 'pointermove', goal.X, goal.Y);
		pointer(overlay(editor), 'pointerup', goal.X, goal.Y);

		frame(editor);

		expect(scene.Get('planet').Traits.Orbit.Distance).toBe(2.78);
		expect(scene.Get('planet').Traits.Orbit.Anomaly).toBe(180);
		expect(scene.Get('planet').World[0]).toBeCloseTo(-20, 1);
		expect(Math.abs(scene.Get('planet').World[2])).toBeLessThan(0.05);
		expect(angle(scene.Get('planet'), star)).toBeCloseTo(180, 1);
		expect(scene.OrbitAt('planet', goal.X, goal.Y).Distance).toBeCloseTo(Math.pow(20 / 12, 2), 6);

		/* Up the green axis: the orbit tilts, the body rises over the plane. */
		tip = middle(editor, 'circle[data-handle="move-tilt"]');

		pointer(editor.$Element().querySelector('circle[data-handle="move-tilt"]'), 'pointerdown', tip[0], tip[1]);
		pointer(overlay(editor), 'pointermove', tip[0], tip[1] - 40);
		pointer(overlay(editor), 'pointerup', tip[0], tip[1] - 40);

		frame(editor);

		expect(scene.Get('planet').Traits.Orbit.Inclination).toBeGreaterThan(5);

		editor.Undo();
		editor.Undo();

		frame(editor);

		expect(scene.Get('planet').Traits.Orbit.Distance).toBe(1);
		expect(scene.Get('planet').Traits.Orbit.Inclination).toBe(0);
		expect(angle(scene.Get('planet'), star)).toBeCloseTo(30, 6);
	});

	it('draws the system at the day it is told, kept for undo, and a body scaled changes its radius', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var input = editor.$Element().querySelector('.elemenx-scene-editor-time input');
		var before = angle(scene.Get('planet'), scene.Get('star'));
		var radius = scene.Get('planet').Traits.Body.Radius;
		var at;

		input.value = '100';

		input.dispatchEvent(new Event('change'));

		frame(editor);

		expect(scene.Now()).toBe(100);
		expect(angle(scene.Get('planet'), scene.Get('star'))).not.toBeCloseTo(before, 1);

		editor.Undo();

		frame(editor);

		expect(scene.Now()).toBe(0);

		editor.Select('planet');
		editor.Pick('scale');

		frame(editor);

		at = middle(editor, '.elemenx-scene-editor-tip.axis-x');

		pointer(editor.$Element().querySelector('.elemenx-scene-editor-tip.axis-x'), 'pointerdown', at[0], at[1]);
		pointer(overlay(editor), 'pointermove', at[0] + 60, at[1]);
		pointer(overlay(editor), 'pointerup', at[0] + 60, at[1]);

		expect(scene.Get('planet').Traits.Body.Radius).not.toBe(radius);
		expect(scene.Get('planet').Size).toBeGreaterThan(0);
	});

	/* Regression: Load leaves the cutscenes a scene has, so an undo of the first cutscene kept it. */
	it('edits the cutscenes of the scene under the view, each change one step to undo, cameras and screens to add', async function () {
		var made = await mount();
		var editor = made.Editor;

		expect(editor.Kinds).toContain('camera');
		expect(editor.Kinds).toContain('screen');

		editor.CutscenesToggled();

		await tick();

		expect(editor.$Element().querySelector('.elemenx-cutscene-editor')).not.toBe(null);

		editor.CutscenesChanged({intro: {Tracks: [{Type: 'fade', Keys: [{At: 0, Value: 1}]}]}});

		expect(Object.keys(editor.Scene().Cutscenes)).toEqual(['intro']);
		expect(made.Host.Changes[made.Host.Changes.length - 1].Scene.Cutscenes.intro.Tracks.length).toBe(1);

		editor.Undo();

		expect(editor.Scene().Cutscenes).toBe(null);

		editor.Redo();

		expect(Object.keys(editor.Scene().Cutscenes)).toEqual(['intro']);
	});
});
