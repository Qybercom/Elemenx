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
		/* The kinds are Buttons of ElemenxUI, each by its name. */
		expect(Array.prototype.map.call(editor.$Element().querySelectorAll('.elemenx-scene-editor-kind'), function (button) {
			return button.textContent.trim();
		})).toEqual(editor.SpaceKinds);
		expect(editor.ToolsOf().map(function (tool) {
			return tool.ID;
		})).not.toContain('sketch');
		expect(editor.Document().Setting).toBe('space');

		/* Its fields are those of its traits: no place on a ground; a field by the name of its trait. */
		editor.Select('planet');

		await tick(20);

		var fields = Array.prototype.map.call(editor.$Element().querySelectorAll('.elemenx-scene-editor-fields [data-field]'), function (input) {
			return input.getAttribute('data-field');
		});

		expect(fields).toContain('Distance');
		expect(fields).not.toContain('Lift');

		/* A field is an Input of ElemenxUI: its own field of the page told. */
		var radius = editor.$Element().querySelectorAll('.elemenx-scene-editor-fields [data-field="Radius"] input')[0];

		radius.value = '3000';

		radius.dispatchEvent(new Event('input', {bubbles: true}));
		radius.dispatchEvent(new Event('change', {bubbles: true}));

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

	/* The shape of an orbit was not editable: an inclination only, its eccentricity among the fields of a planet alone. */
	it('edits the shape of an orbit by its nearest (q) and farthest (Q) distances in AU, in the fields and by two handles on its line', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var engine = scene.Engine();
		var field = function (id) {
			return editor.FieldList.filter(function (each) {
				return each.ID === id;
			})[0];
		};
		var ids;
		var apses;
		var at;
		var goal;
		var centre;
		var star;
		var before;
		var spot;

		editor.Select('planet');
		editor.Pick('move');

		frame(editor);

		ids = editor.FieldList.map(function (each) {
			return each.ID;
		});

		/* Right after the Distance, a circle of 1 AU. */
		expect(ids.slice(ids.indexOf('Orbit:Distance'), ids.indexOf('Orbit:Distance') + 3)).toEqual(['Orbit:Distance', 'Orbit:Nearest', 'Orbit:Farthest']);
		expect(field('Orbit:Nearest').Value).toBeCloseTo(1, 9);
		expect(field('Orbit:Farthest').Value).toBeCloseTo(1, 9);

		/* Kept as the half of the long axis and the eccentricity. */
		editor.FieldChanged(field('Orbit:Farthest'), '3');

		expect(scene.Get('planet').Traits.Orbit.Distance).toBe(2);
		expect(scene.Get('planet').Traits.Orbit.Eccentricity).toBe(0.5);
		expect(field('Orbit:Nearest').Shown).toBe('1');
		expect(field('Orbit:Farthest').Shown).toBe('3');

		/* The nearest never beyond the farthest: a circle at the most. */
		editor.FieldChanged(field('Orbit:Nearest'), '5');

		expect(scene.Get('planet').Traits.Orbit.Distance).toBe(3);
		expect(scene.Get('planet').Traits.Orbit.Eccentricity).toBe(0);

		editor.FieldChanged(field('Orbit:Nearest'), '1');

		frame(editor);

		/* The handles where the orbit is nearest and farthest, each marked. */
		apses = engine.Apses('planet');

		expect(apses.Periapsis.Distance).toBeCloseTo(1, 6);
		expect(apses.Apoapsis.Distance).toBeCloseTo(3, 6);
		expect(editor.$Element().querySelectorAll('.elemenx-scene-editor-apse-label').length).toBe(2);

		/* Regression: what of the gizmo is off the view (a far point of an orbit) was drawn over the panels beside it. */
		expect(getComputedStyle(editor.$Element().querySelector('.elemenx-scene-editor-gizmo')).overflow).toBe('hidden');

		spot = scene.Project(apses.Apoapsis.World);
		at = middle(editor, '[data-handle="move-far"]');

		expect(at[0]).toBeCloseTo(spot.X, 0);
		expect(at[1]).toBeCloseTo(spot.Y, 0);

		/* The farthest drawn out, the nearest stays. */
		goal = scene.Project([apses.Middle[0] + (apses.Apoapsis.World[0] - apses.Middle[0]) * 1.4, apses.Middle[1], apses.Middle[2] + (apses.Apoapsis.World[2] - apses.Middle[2]) * 1.4]);

		pointer(editor.$Element().querySelector('[data-handle="move-far"]'), 'pointerdown', at[0], at[1]);
		pointer(overlay(editor), 'pointermove', goal.X, goal.Y);
		pointer(overlay(editor), 'pointerup', goal.X, goal.Y);

		frame(editor);

		apses = engine.Apses('planet');

		expect(apses.Periapsis.Distance).toBeCloseTo(1, 4);
		expect(apses.Apoapsis.Distance).toBeGreaterThan(4);
		/* To three figures, as the snap of the editor holds it. */
		expect(Number(apses.Apoapsis.Distance.toPrecision(3))).toBeCloseTo(apses.Apoapsis.Distance, 4);

		editor.Undo();

		frame(editor);

		expect(engine.Apses('planet').Apoapsis.Distance).toBeCloseTo(3, 6);

		/* Regression: carried by its square, a body on a long orbit took the distance under the pointer for the half of its long axis: it goes there on its ellipse. */
		before = scene.Get('planet').Traits.Orbit.Eccentricity;
		at = middle(editor, '[data-handle="move-orbit"]');
		goal = scene.Project([apses.Middle[0] - 18, apses.Middle[1], apses.Middle[2] + 6]);

		pointer(editor.$Element().querySelector('[data-handle="move-orbit"]'), 'pointerdown', at[0], at[1]);
		pointer(overlay(editor), 'pointermove', goal.X, goal.Y);
		pointer(overlay(editor), 'pointerup', goal.X, goal.Y);

		frame(editor);

		expect(scene.Get('planet').Traits.Orbit.Eccentricity).toBe(before);
		expect(scene.Get('planet').World[0] - apses.Middle[0]).toBeCloseTo(-18, 0);
		expect(scene.Get('planet').World[2] - apses.Middle[2]).toBeCloseTo(6, 0);

		/* A star round a barycentre has an orbit of a Distance only: its shape among its fields all the same. */
		centre = editor.Add('barycentre');

		editor.Select(centre);

		star = editor.Add('star');

		editor.Select(star);

		frame(editor);

		expect(field('Orbit:Eccentricity').Value).toBe(0);

		editor.FieldChanged(field('Orbit:Eccentricity'), '0.25');

		expect(scene.Get(star).Traits.Orbit.Eccentricity).toBe(0.25);
		expect(field('Orbit:Farthest').Value).toBeCloseTo(scene.Get(star).Traits.Orbit.Distance * 1.25, 6);
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

		input.dispatchEvent(new Event('input', {bubbles: true}));
		input.dispatchEvent(new Event('change', {bubbles: true}));

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

	/* The editor on a touch screen: a bar of actions for a mouse and fingers alike, its context menu, two fingers for the camera. */
	it('has its actions in a bar over the view and in a context menu, and two fingers move the camera without editing', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var bar = editor.$Element().querySelector('.elemenx-view-actions');
		var before = Object.keys(scene.Objects()).length;
		var titles;
		var distance;
		var target = overlay(editor);
		var box = target.getBoundingClientRect();
		var finger = function (type, id, x, y) {
			target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: box.left + x, clientY: box.top + y, pointerId: id, pointerType: 'touch', isPrimary: id === 11}));
		};
		var button = function (title) {
			return Array.prototype.find.call(bar.querySelectorAll('button'), function (node) {
				return node.getAttribute('title') === title || node.getAttribute('aria-label') === title;
			});
		};

		expect(bar).not.toBe(null);
		expect(bar.querySelector('.elemenx-view-actions-hand')).not.toBe(null);

		titles = editor.Actions().map(function (action) {
			return action.ID + (action.Disabled ? '-' : '+');
		});

		expect(titles).toEqual(['frame-', 'duplicate-', 'delete-']);

		editor.Select('planet');

		await tick(20);

		button('Duplicate').click();

		await tick(20);

		expect(Object.keys(scene.Objects()).length).toBe(before + 1);

		button('Delete').click();

		await tick(20);

		expect(Object.keys(scene.Objects()).length).toBe(before);

		/* Two fingers apart: nearer, and nothing selected or moved. */
		editor.Select('');

		distance = scene.Viewpoint().Distance;

		finger('pointerdown', 11, 300, 280);
		finger('pointerdown', 12, 400, 280);
		finger('pointermove', 11, 250, 280);
		finger('pointermove', 12, 450, 280);
		finger('pointerup', 11, 250, 280);
		finger('pointerup', 12, 450, 280);

		await tick(200);

		expect(scene.Viewpoint().Distance).toBeLessThan(distance * 0.75);
		expect(editor.Selected).toBe('');

		/* The toggle gives one finger to the camera: it turns the view and selects nothing. */
		bar.querySelector('.elemenx-view-actions-hand').click();

		await tick(20);

		expect(editor.Hand).toBe(true);

		var yaw = scene.Viewpoint().Yaw;

		finger('pointerdown', 11, 300, 280);
		finger('pointermove', 11, 330, 280);
		finger('pointermove', 11, 380, 280);
		finger('pointerup', 11, 380, 280);

		expect(scene.Viewpoint().Yaw).not.toBeCloseTo(yaw, 3);

		/* The right button that did not look round opens the context menu, with the actions. */
		target.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true, clientX: box.left + 20, clientY: box.top + 20, pointerId: 1, pointerType: 'mouse', button: 2}));
		target.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, cancelable: true, clientX: box.left + 20, clientY: box.top + 20, pointerId: 1, pointerType: 'mouse', button: 2}));

		await tick(40);

		expect(editor.$Ref('Context', true).Open).toBe(true);
		/* The menu of the view (its list of objects has a context menu of its own too). */
		expect(Array.prototype.map.call(document.querySelectorAll('.elemenx-context-point .elemenx-menu'), function (menu) {
			return menu.textContent;
		}).join(' ')).toContain('Duplicate');
	});

	/* Its system as data (SystemData): saved as a file of the system format and opened again, its planets with it. */
	it('saves its star system as a system of the system format and opens one, its bodies with their planets', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var systems = Elemenx.Service('SystemData');
		var data;
		var bytes;
		var opened;
		var moon;
		var ids;

		moon = editor.Add('moon');

		editor.Change('planet', {Name: 'Home'});

		data = editor.System();

		expect(data.Manifest.Format).toBe('elemenx-system');
		expect(data.Manifest.Origin.Kind).toBe('authored');

		ids = systems.Objects(data, 'x').map(function (spec) {
			return spec.ID;
		});

		expect(ids).toEqual(expect.arrayContaining(['star', 'planet', moon]));

		/* A system with the planet of a body of its file (its URL), as a file, opened in the editor. */
		data.Manifest.Bodies = {planet: {URL: '/data/planets/home.planet'}};
		bytes = systems.Save(data);

		opened = await new Promise(function (resolve, reject) {
			editor.OpenSystem(bytes, function (error, made) {
				if (error) reject(error);
				else resolve(made);
			});
		});

		expect(editor.Document().Setting).toBe('space');
		expect(editor.Scene().Get(moon).Parent).toBe('planet');
		expect(editor.Scene().Get('planet').Traits.Surface.Planet.Data).toBe('/data/planets/home.planet');
		/* Saved again: the planets of its bodies as they came. */
		expect(editor.System().Manifest.Bodies).toEqual({planet: {URL: '/data/planets/home.planet'}});
		expect(editor.System().Manifest.ID).toBe(opened.Manifest.ID);

		/* Back to what it was: one step to undo. */
		editor.Undo();

		expect(editor.Scene().Get(moon)).toBeTruthy();
		expect((editor.Scene().Get('planet').Traits.Surface.Planet || {}).Data).toBeUndefined();
	});

	/* The tree of orbits made in the editor: a barycentre of two stars, a black hole as a planet, a station round it. */
	it('adds a barycentre and stars round it opposite one another, a black hole round a star, a station round the black hole', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var centre = editor.Add('barycentre');
		var first;
		var second;
		var hole;
		var dock;

		expect(scene.Get(centre).Parent || '').toBe('');

		editor.Select(centre);

		first = editor.Add('star');

		editor.Select(centre);

		second = editor.Add('star');

		expect(scene.Get(first).Parent).toBe(centre);
		expect(scene.Get(second).Parent).toBe(centre);
		expect(Math.abs(scene.Get(second).Traits.Orbit.Anomaly - scene.Get(first).Traits.Orbit.Anomaly)).toBe(180);

		editor.Select(first);

		hole = editor.Add('blackhole');

		editor.Select(hole);

		dock = editor.Add('station');

		expect(scene.Get(hole).Parent).toBe(first);
		expect(scene.Get(dock).Parent).toBe(hole);

		/* Its list of objects a tree of the same. */
		await tick(20);

		expect(editor.Items().filter(function (item) {
			return item.ID === centre;
		})[0].Items.map(function (item) {
			return item.ID;
		})).toEqual([first, second]);
		expect(editor.Opened()).toEqual(expect.arrayContaining([centre, first, hole]));
	});

	it('gives a star the look of the library to edit as a graph: its prominences by a Curve of the Time, its parameters tuned', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();

		editor.Select('star');

		expect(editor.GraphKinds().map(function (kind) {
			return kind.ID;
		})).toEqual(['Star']);
		expect(editor.Graph()).toBe(null);

		editor.GraphMade();

		expect(scene.Get('star').Traits.Star.Blueprint.type).toBe('star');
		expect(editor.GraphKindOf()).toBe('Blueprint');
		expect(editor.Graph().blocks.some(function (block) {
			return block.type === 'Curve';
		})).toBe(true);

		/* Its parameters among what a level sets of it. */
		expect(editor.Exposed().map(function (parameter) {
			return parameter.key;
		})).toEqual(['Activity', 'Cycle']);

		editor.Tuned('Activity', '2.5');

		expect(scene.Get('star').Traits.Star.Parameters.Activity).toBe(2.5);
		expect(scene.Engine().StarLook('star').Parts[1]).toBeCloseTo(2.5, 6);
	});

	it('adds a star cluster with the swarm of its old stars, and stars round its middle light-years out', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var cluster;
		var star;

		expect(editor.SpaceKinds).toContain('cluster');

		cluster = editor.Add('cluster');

		expect(scene.Get(cluster).Kind).toBe('cluster');
		expect(scene.Get(cluster).Traits.Cluster.Count).toBeGreaterThan(1000);

		editor.Select(cluster);

		star = editor.Add('star');

		expect(scene.Get(star).Parent).toBe(cluster);
		expect(scene.Get(star).Traits.Orbit.Distance).toBeGreaterThan(Elemenx.Service('Astronomy').Units.ly);

		/* Its fields as any other: its kind, its size, how many in its swarm. */
		editor.Select(cluster);

		expect(editor.FieldList.map(function (field) {
			return field.ID;
		})).toEqual(expect.arrayContaining(['Cluster:Type', 'Cluster:Radius', 'Cluster:Count']));
	});

	/*
	 * Regression: every object of its list had a square that looked as a check box and did nothing, the list had no context
	 * menu, chose one object only and could not move one under another; what it chose (a fleet far off) showed no mark.
	 */
	it('lists its objects with the icons of their kinds, chooses many of them, moves one under another by a drag, and has a context menu', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var moon = editor.Add('moon');
		var station;
		var tree;
		var items;
		var row;

		editor.Select('star');

		station = editor.Add('station');

		await tick(20);

		items = {};
		(function walk (list) {
			list.forEach(function (item) {
				items[item.ID] = item;

				walk(item.Items || []);
			});
		})(editor.Items());

		expect(items.star.Icon).toBe('sun');
		expect(items.planet.Icon).toBe('planet');
		expect(items[moon].Icon).toBe('moon');
		expect(items[station].Icon).toBe('station');

		/* Many chosen in its list: all marked in the scene, the first one the selected. */
		editor.ManyChosen([moon, station]);

		expect(editor.Selected).toBe(moon);
		expect(scene.Selection()).toEqual([moon, station]);

		/* Delete of its menu takes all of them away. */
		editor.TreePicked({Item: {ID: 'delete'}});

		expect(scene.Get(moon)).toBe(null);
		expect(scene.Get(station)).toBe(null);

		/* A drag of the planet into the star... and of an object beside another: the same parent. */
		moon = editor.Add('moon');

		editor.TreeMoved({ID: moon, Target: 'star', Position: 'inside'});

		expect(scene.Get(moon).Parent).toBe('star');

		editor.TreeMoved({ID: moon, Target: 'planet', Position: 'after'});

		expect(scene.Get(moon).Parent).toBe(scene.Get('planet').Parent || '');

		/* Its context menu on a row: of that object, chosen first; on the list: kinds to add. */
		await tick(20);

		tree = editor.$Element().querySelector('.elemenx-scene-editor-tree');
		row = tree.querySelector('.elemenx-tree-row[data-id="planet"]');

		/* A real right click opens it (Regression: it had no items before it opened, and never opened). */
		row.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: 40, clientY: 40}));

		await tick(30);

		expect(Elemenx.Instance(tree).Open).toBe(true);

		editor.TreeOpened({Target: row});

		expect(editor.Selected).toBe('planet');
		expect(editor.TreeItems.map(function (item) {
			return item.ID;
		})).toEqual(expect.arrayContaining(['focus', 'rename', 'duplicate', 'child', 'delete']));

		editor.TreeOpened({Target: tree});

		expect(editor.TreeItems[0].Items.map(function (item) {
			return item.ID;
		})).toContain('add:planet');

		editor.TreePicked({Item: {ID: 'add:planetoid'}});

		expect(scene.Objects(function (object) {
			return object.Kind === 'planetoid';
		}).length).toBe(1);
	});
});
