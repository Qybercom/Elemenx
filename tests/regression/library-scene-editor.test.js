import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

/* A scene editor with a ground and a sun, its scene ready. */
async function mount (state) {
	var component = Elemenx.Component(unique('EditorHost'), Object.assign({$Template: '<div style="width: 900px; height: 560px"><SceneEditor #Editor [value]="Document" [models]="Models" (change)="Changed" /></div>', Changes: [], Models: [], Changed: function (document) {
		this.Changes.push(document);
	}, Document: {Version: 1, Name: 'test', Scene: null}}, state || {}))();
	var editor;

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	await waitFor(function () {
		editor = component.$Ref('Editor', true);

		return editor && editor.Scene();
	}, 6000);

	editor.Scene().Scene().Loop.Stop();

	/* A new document has its ground and its sun. */
	expect(editor.Scene().Get('ground')).not.toBe(null);
	expect(editor.Scene().Get('sun')).not.toBe(null);

	editor.Scene().SetViewpoint({Target: [0, 1, 0], Yaw: 0, Pitch: 0.6, Distance: 20});

	frame(editor);

	return {Host: component, Editor: editor};
}

function frame (editor) {
	var scene = editor.Scene();

	scene.Scene().Rest = 0;

	scene.Engine().Frame(performance.now());

	editor.Gizmo();
}

function overlay (editor) {
	return editor.$Element().querySelector('.elemenx-scene-editor-overlay');
}

function pointer (target, type, x, y, options) {
	target.dispatchEvent(new PointerEvent(type, Object.assign({bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0}, options || {})));
}

function key (editor, code, options) {
	overlay(editor).dispatchEvent(new KeyboardEvent('keydown', Object.assign({code: code, key: code, bubbles: true, cancelable: true}, options || {})));
}

describe('Contract: SceneEditor, a game scene edited as Unreal edits a level', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['SceneEditor', 'service:Blueprints']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('adds an object where the view looks, shows it in the tree, selects it by a press and emits the document', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var id = editor.Add('unit');
		var spot;

		await tick(20);

		expect(scene.Get(id).Values.X).toBe(0);
		expect(editor.Selected).toBe(id);
		expect(mounted.Host.Changes.length).toBeGreaterThan(0);
		expect(JSON.stringify(mounted.Host.Changes[mounted.Host.Changes.length - 1].Scene)).toContain(id);
		expect(editor.$Element().querySelector('.elemenx-scene-editor-side').textContent).toContain(id);

		/* Nothing under a press: nothing selected; the object under it: it. */
		frame(editor);

		pointer(overlay(editor), 'pointerdown', 5, 5);
		pointer(overlay(editor), 'pointerup', 5, 5);

		expect(editor.Selected).toBe('');

		spot = scene.Project(scene.Get(id).World);

		pointer(overlay(editor), 'pointerdown', spot.X, spot.Y);
		pointer(overlay(editor), 'pointerup', spot.X, spot.Y);

		expect(editor.Selected).toBe(id);

		/* The fields of what is selected. */
		expect(editor.$Element().querySelector('[data-field="X"]').value).toBe('0');
	});

	it('offers the models it is given that Models has, and places each as the kind its Type fits, as large as it is', async function () {
		var models = Elemenx.Service('SceneModels');
		var mounted;
		var editor;
		var scene;
		var hut;
		var crate;

		models.Define('editor-hut', {Type: 'building', Size: 5, Parts: [{ID: 'a', Shape: 'box'}]});
		models.Define('editor-crate', {Size: 0.8, Parts: [{ID: 'a', Shape: 'box'}]});

		mounted = await mount({Models: ['editor-hut', 'editor-crate', 'editor-missing']});
		editor = mounted.Editor;
		scene = editor.Scene();

		await tick(20);

		expect(Array.prototype.map.call(editor.$Element().querySelectorAll('.elemenx-scene-editor-kind.model'), function (button) {
			return button.getAttribute('data-model');
		})).toEqual(['editor-hut', 'editor-crate']);

		editor.$Element().querySelector('[data-model="editor-hut"]').click();

		hut = scene.Get(editor.Selected);
		crate = scene.Get(editor.PlacedModel('editor-crate'));

		expect([hut.Kind, hut.Values.Model, hut.Size]).toEqual(['house', 'editor-hut', 5]);
		expect([crate.Kind, crate.Values.Model, crate.Size]).toEqual(['thing', 'editor-crate', 0.8]);

		delete models.Recipes['editor-hut'];
		delete models.Recipes['editor-crate'];
	});

	it('moves along an axis of the gizmo, turns, scales, and undoes and redoes each drag as one action', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var id = editor.Add('unit');
		var tip;
		var box;
		var start;
		var axis;

		frame(editor);

		/* The tip of the red axis, dragged on along it by its length: X grows by about the length of the axis. */
		tip = editor.$Element().querySelector('circle.axis-x');
		box = tip.getBoundingClientRect();
		start = {X: box.left + box.width / 2, Y: box.top + box.height / 2};
		axis = scene.Project(scene.Get(id).World);

		pointer(tip, 'pointerdown', start.X, start.Y);
		pointer(overlay(editor), 'pointermove', start.X + (start.X - axis.X), start.Y + (start.Y - axis.Y));
		pointer(overlay(editor), 'pointermove', start.X + (start.X - axis.X) * 2, start.Y + (start.Y - axis.Y) * 2);
		pointer(overlay(editor), 'pointerup', start.X + (start.X - axis.X) * 2, start.Y + (start.Y - axis.Y) * 2);

		expect(scene.Get(id).Values.X).toBeGreaterThan(editor.Reach({World: [0, 1, 0]}) * 1.5);
		expect(scene.Get(id).Values.X % 0.5).toBe(0);
		expect(scene.Get(id).Values.Y).toBe(0);

		editor.Undo();

		expect(scene.Get(id).Values.X).toBe(0);

		editor.Redo();

		expect(scene.Get(id).Values.X).toBeGreaterThan(1);

		/* E turns, R scales. */
		key(editor, 'KeyE');

		expect(editor.Tool).toBe('turn');

		frame(editor);

		expect(editor.$Element().querySelector('.elemenx-scene-editor-ring')).not.toBe(null);

		key(editor, 'KeyR');

		frame(editor);

		tip = editor.$Element().querySelector('rect.elemenx-scene-editor-tip.axis-y');
		box = tip.getBoundingClientRect();
		start = {X: box.left + 5, Y: box.top + 5};

		pointer(tip, 'pointerdown', start.X, start.Y);
		pointer(overlay(editor), 'pointermove', start.X, start.Y - 200);
		pointer(overlay(editor), 'pointerup', start.X, start.Y - 200);

		expect(scene.Get(id).Size).toBeGreaterThan(1.5);

		/* Delete, then back. */
		key(editor, 'Delete');

		expect(scene.Get(id)).toBe(null);

		key(editor, 'KeyZ', {ctrlKey: true});

		expect(scene.Get(id)).not.toBe(null);
	});

	it('looks round from the eye with the right button, and flies with W while it is held', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var before = scene.Viewpoint();
		var after;
		var eye;

		pointer(overlay(editor), 'pointerdown', 400, 300, {button: 2});
		pointer(overlay(editor), 'pointermove', 500, 300, {button: 2});

		after = scene.Viewpoint();

		expect(after.Yaw).toBeCloseTo(before.Yaw - 0.5, 6);

		frame(editor);

		eye = scene.Viewpoint().Eye;

		expect(Math.hypot(eye[0] - before.Eye[0], eye[1] - before.Eye[1], eye[2] - before.Eye[2])).toBeLessThan(0.05);

		key(editor, 'KeyW');

		editor.Fly();
		editor.Fly();

		expect(Math.hypot(scene.Viewpoint().Eye[0] - eye[0], scene.Viewpoint().Eye[2] - eye[2])).toBeGreaterThan(0.5);
		expect(editor.Tool).toBe('move');

		pointer(overlay(editor), 'pointerup', 500, 300, {button: 2});
	});

	it('shows the parameters of the Blueprint of an effect, sets them on it, and edits its graph under the view', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var blueprints = Elemenx.Service('Blueprints');
		var graph = scene.EffectGraph('torch');
		var flame = blueprints.Add(graph, 'Parameter', {properties: {Key: 'Flame', Type: 'vec3'}});
		var field;
		var id;

		graph.parameters = [{key: 'Flame', type: 'vec3', value: [1, 0.5, 0]}];

		blueprints.Link(graph, [flame.id, 'Value'], ['layer1', 'Color']);

		id = editor.Add('effect', {Blueprint: JSON.parse(blueprints.Write(graph))});

		await tick(30);

		field = editor.$Element().querySelector('[data-parameter="Flame"]');

		expect(field.value).toBe('1, 0.5, 0');

		field.value = '0, 1, 0';

		field.dispatchEvent(new Event('change', {bubbles: true}));

		expect(scene.Get(id).Traits.Effect.Parameters).toEqual({Flame: [0, 1, 0]});
		expect(scene.Engine().EffectBlueprint(scene.Get(id).Traits.Effect.Blueprint, scene.Get(id).Traits.Effect.Parameters).Layers[0].Color).toEqual([0, 1, 0]);

		/* The graph itself under the view. */
		expect(editor.$Element().querySelector('.elemenx-scene-editor-blueprint .elemenx-blueprint-block[data-id="layer1"]')).not.toBe(null);
	});

	it('sketches over the ground: strokes, lines, areas, circles and stamps into layers, their fields edited, undone as one', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var field = function () {
			return scene.Scene().Ground.Field;
		};
		var plain;
		var items;
		var at;
		var input;

		function spot (x, z) {
			return scene.Project([x, Math.max(0, field().Height(x, z)), z]);
		}

		function press (x, z, kind) {
			var p = spot(x, z);

			pointer(overlay(editor), kind || 'pointerdown', p.X, p.Y);
		}

		function click (x, z) {
			var p = spot(x, z);

			press(x, z);
			press(x, z, 'pointerup');
		}

		function sketched () {
			var step = scene.Get('ground').Traits.Terrain.World.blocks.filter(function (block) {
				return block.type === 'Sketch';
			})[0];

			return step ? step.properties.filter(function (property) {
				return property.key === 'Sketch';
			})[0].value : null;
		}

		/* From above: what is drawn raises no hill in the way of the next press. */
		scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0, Pitch: 1.35, Distance: 60});

		frame(editor);

		key(editor, 'KeyB');

		expect(editor.Tool).toBe('sketch');

		/* A stroke: pressed, dragged, let go. */
		plain = field().Height(2, 0);
		editor.SketchType = 'raise';

		press(-4, 0);
		press(0, 0, 'pointermove');
		press(4, 0, 'pointermove');
		press(4, 0, 'pointerup');

		frame(editor);

		items = sketched().Layers[0].Items;

		expect(items.length).toBe(1);
		expect(items[0].Type).toBe('raise');
		expect(items[0].Points.length).toBeGreaterThan(1);
		expect(field().Height(2, 0)).toBeGreaterThan(plain + 2);

		/* A line: a point a press, Enter ends it. */
		editor.SketchType = 'road';

		click(-10, 6);
		click(0, 8);
		click(10, 6);

		key(editor, 'Enter');

		expect(sketched().Layers[0].Items[1]).toMatchObject({Type: 'road', Width: 6});
		expect(sketched().Layers[0].Items[1].Points.length).toBe(3);

		/* An area in a new layer: a second press at the same place ends it. */
		editor.AddLayer();

		expect(editor.SketchLayer).toBe('layer-2');

		editor.SketchType = 'plateau';

		click(-8, -8);
		click(8, -8);
		click(8, -4);
		click(8, -4);

		expect(sketched().Layers[1].Items[0]).toMatchObject({Type: 'plateau', Height: 20});
		expect(sketched().Layers[1].Items[0].Points.length).toBe(3);

		/* A circle by the drag of its radius; a stamp takes the ground of its first press and sits at its second. */
		editor.SketchType = 'crater';

		press(0, 14);
		press(6, 14, 'pointermove');
		press(6, 14, 'pointerup');

		expect(sketched().Layers[1].Items[1]).toMatchObject({Type: 'crater', At: [0, 14], Radius: 6});

		editor.SketchType = 'stamp';

		click(-14, -14);
		click(14, 14);

		at = sketched().Layers[1].Items[2];

		expect(at.Type).toBe('stamp');
		expect(at.At).toEqual([14, 14]);
		expect(at.Data.Heights.length).toBe(32 * 32);

		/* A mask keeps the heights under it. */
		editor.SketchType = 'mask';

		click(-3, -3);
		click(3, -3);
		click(3, 3);

		key(editor, 'Enter');

		expect(sketched().Layers[1].Items[3].Heights.Data.length).toBe(48 * 48);

		/* A field of an item, edited in the inspector. */
		editor.LayerPicked('base');

		input = editor.$Element().querySelector('[data-item="road-2"] [data-field="Width"]');
		input.value = '10';

		input.dispatchEvent(new Event('change', {bubbles: true}));

		expect(sketched().Layers[0].Items[1].Width).toBe(10);

		/* Hidden, a layer draws nothing; undone, the field as it was. */
		editor.LayerShown('layer-2');

		expect(sketched().Layers[1].Visible).toBe(false);

		editor.Undo();
		editor.Undo();

		expect(sketched().Layers[1].Visible).toBe(true);
		expect(sketched().Layers[0].Items[1].Width).toBe(6);

		/* The sketch is drawn over the view. */
		frame(editor);

		expect(editor.$Element().querySelectorAll('.elemenx-scene-editor-sketch-shape').length).toBe(6);
	});

	it('draws a road point by point, bends a part into an arc, adds and takes away points, rounds a corner, undone as one', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var road;

		function spot (x, z) {
			return scene.Project([x, Math.max(0, scene.Scene().Ground.Field.Height(x, z)), z]);
		}

		function press (x, z, kind, target) {
			var p = spot(x, z);

			pointer(target || overlay(editor), kind || 'pointerdown', p.X, p.Y);
		}

		function click (x, z) {
			press(x, z);
			press(x, z, 'pointerup');
		}

		function handle (name) {
			return editor.$Element().querySelector('[data-handle="' + name + '"]');
		}

		function given () {
			return scene.Get(editor.Selected).Traits.Road;
		}

		/* From above, the snap off: each press where it is. */
		scene.SetViewpoint({Target: [0, 2, 0], Yaw: 0, Pitch: 1.35, Distance: 70});

		editor.Snap = false;

		frame(editor);

		key(editor, 'KeyT');

		expect(editor.Tool).toBe('road');
		expect(editor.RoadTypesOf()).toEqual(expect.arrayContaining(['street', 'rail', 'track']));

		editor.RoadType = 'street';
		editor.RoadPart = 'line';
		editor.RoadRadius = 4;

		/* Three presses, a press again on the last one: a street of straight parts, its corner rounded. */
		click(-15, 0);
		click(0, 0);
		click(0, 15);
		click(0, 15);

		road = given();

		expect(editor.Selected).toBe('road-1');
		expect(scene.Get('road-1').Values.Type || road.Type).toBe('street');
		expect(road.Points.length).toBe(3);
		expect(road.Segments.map(function (part) {
			return part.Kind;
		})).toEqual(['line', 'line']);
		expect(road.Radii).toEqual([0, 4, 0]);

		frame(editor);

		/* A press on the middle of the first part: an arc; a drag of it bends it. */
		var mid = handle('road-mid-0');
		var box = mid.getBoundingClientRect();

		pointer(mid, 'pointerdown', box.left + 5, box.top + 5);
		pointer(mid, 'pointerup', box.left + 5, box.top + 5);

		expect(given().Segments[0].Kind).toBe('arc');

		frame(editor);

		mid = handle('road-mid-0');
		box = mid.getBoundingClientRect();

		pointer(mid, 'pointerdown', box.left + 5, box.top + 5);

		press(-7.5, 5, 'pointermove');
		press(-7.5, 5, 'pointerup');

		expect(given().Segments[0].Bulge).toBeCloseTo(5, 0);

		/* A drag from the middle of the straight part: a point there. */
		frame(editor);

		mid = handle('road-mid-1');
		box = mid.getBoundingClientRect();

		pointer(mid, 'pointerdown', box.left + 5, box.top + 5);

		press(3, 8, 'pointermove');
		press(3, 8, 'pointerup');

		expect(given().Points.length).toBe(4);
		expect(given().Points[2][0]).toBeCloseTo(3, 0);
		expect(given().Radii.length).toBe(4);

		/* Its corner radius among the fields of the point chosen; Delete takes the point away. */
		frame(editor);

		var point = handle('road-point-2');

		box = point.getBoundingClientRect();

		pointer(point, 'pointerdown', box.left + 7, box.top + 7);
		pointer(point, 'pointerup', box.left + 7, box.top + 7);

		var radius = editor.$Element().querySelector('[data-field="PointRadius"]');

		radius.value = '6';

		radius.dispatchEvent(new Event('change'));

		expect(given().Radii[2]).toBe(6);

		key(editor, 'Delete');

		expect(given().Points.length).toBe(3);

		/* The road of the scene made of it; Undo takes the deletion back as one. */
		expect(scene.Roads()[0].ID).toBe('road-1');

		editor.Undo();

		expect(given().Points.length).toBe(4);

		/* Escape lets a road being drawn go. */
		click(20, 20);

		key(editor, 'Escape');

		click(25, 25);
		click(30, 25);
		click(30, 25);

		expect(scene.Get('road-2').Traits.Road.Points.length).toBe(2);
	});

	it('keeps the document in the browser and in a JSON file, and Play runs it then Stop brings it back', async function () {
		var mounted = await mount({Document: {Version: 1, Name: 'kept', Scene: null}});
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var id = editor.Add('unit', {Hero: true});
		var text;

		editor.Storage = 'elemenx-scene-editor-test';

		try {
			expect(editor.Save()).toBe(true);

			editor.Remove(id);

			expect(scene.Get(id)).toBe(null);
			expect(editor.Restore()).toBe(true);
			expect(scene.Get(id)).not.toBe(null);
		}
		finally {
			window.localStorage.removeItem('elemenx-scene-editor-test');
		}

		text = editor.Export();

		expect(JSON.parse(text).Name).toBe('kept');

		editor.Remove(id);
		editor.Import(text);

		expect(scene.Get(id)).not.toBe(null);

		expect(function () {
			editor.Import(JSON.stringify({Version: 2}));
		}).toThrow('Elemenx SceneEditor: a document of version 2 is newer than 1');

		/* Play: the time goes, the hero is the player's; what it does is gone at Stop. */
		editor.Play();

		await tick(20);

		expect(editor.Playing).toBe(true);
		expect(scene.Paused).toBe(false);
		expect(editor.$Element().querySelector('.elemenx-scene-editor-overlay')).toBe(null);
		expect(scene.Scene().Hero).toBe(id);

		scene.Change(id, {X: 30});

		editor.Stop();

		await tick(20);

		expect(editor.Playing).toBe(false);
		expect(scene.Paused).toBe(true);
		expect(scene.Get(id).Values.X).toBe(0);
	});

	it('edits the World of a ground under the view: its steps, the relief of its step Relief from the library, and what its lands by climate leave bare', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var element = editor.$Element();
		var blueprints = Elemenx.Service('Blueprints');
		var before;
		var relief;
		var world;

		function tabs () {
			return Array.from(element.querySelectorAll('.elemenx-scene-editor-graph-kind')).map(function (tab) {
				return tab.getAttribute('data-graph');
			});
		}

		function button (text) {
			return Array.from(element.querySelectorAll('.elemenx-scene-editor-graphs button')).filter(function (one) {
				return one.textContent.indexOf(text) !== -1;
			})[0];
		}

		function step (type) {
			return scene.Get('ground').Traits.Terrain.World.blocks.filter(function (block) {
				return block.type === type;
			})[0];
		}

		editor.Select('ground');

		await tick(30);

		before = scene.Scene().Ground.Field.Height(12, -7);

		/* The World of the ground, its steps under the view. */
		expect(tabs()).toEqual(['World']);
		expect(element.querySelector('.elemenx-scene-editor-blueprint .elemenx-blueprint-block[data-id="' + step('Relief').id + '"]')).not.toBe(null);

		/* Its step Relief picked: its graph in a tab of its own, none yet, started from the library. */
		editor.StepPicked({Block: step('Relief').id});

		await tick(30);

		expect(tabs()).toEqual(['World', 'Step']);

		editor.GraphPicked('Step');

		await tick(30);

		expect(element.querySelector('.elemenx-scene-editor-blueprint .elemenx-blueprint-block')).toBe(null);

		button('From the library').click();

		await waitFor(function () {
			frame(editor);

			return scene.Scene().Ground && scene.Scene().Ground.Field.Options.ReliefSource;
		}, 6000);

		/* The graph of the library is the relief it had: the same heights, its blocks under the view, kept for undo. */
		relief = step('Relief').properties.filter(function (property) {
			return property.key === 'Graph';
		})[0].value;

		expect(relief.type).toBe('generator');
		expect(scene.Scene().Ground.Field.Height(12, -7)).toBe(before);

		await tick(30);

		expect(element.querySelector('.elemenx-scene-editor-blueprint .elemenx-blueprint-block[data-type="NoiseSpec"]') || element.querySelector('.elemenx-scene-editor-blueprint .elemenx-blueprint-block')).not.toBe(null);

		editor.Undo();

		await tick(30);

		expect(step('Relief').properties.filter(function (property) {
			return property.key === 'Graph';
		})[0].value).toBe(null);

		/* Lands of a climate that holds only the warm, a step of the World: the cold heights of no land. */
		world = JSON.parse(JSON.stringify(scene.Get('ground').Traits.Terrain.World));

		var biomes = blueprints.Add(world, 'Biomes', {properties: {List: [{Biome: 'warm', Climate: {Temperature: [0.5, null]}}]}});
		var end = world.blocks.filter(function (block) {
			return block.type === 'Terrain';
		})[0];
		var into = world.links.filter(function (link) {
			return blueprints.PinById(world, link.p2).Block.id === end.id;
		})[0];

		world.links.splice(world.links.indexOf(into), 1);

		blueprints.Link(world, into.p1, [biomes.id, 'Land']);
		blueprints.Link(world, [biomes.id, 'Land'], [end.id, 'Land']);

		editor.Change('ground', {World: world});

		await waitFor(function () {
			frame(editor);

			return scene.Scene().Ground && scene.Scene().Ground.Field.Biomes;
		}, 6000);

		/* The ground is made again in a frame after the change: the inspector reads it at the next render. */
		editor.Version++;

		await tick(30);

		expect(Array.from(element.querySelectorAll('.elemenx-scene-editor-land')).map(function (line) {
			return line.getAttribute('data-type');
		})).toContain('gap');
	});

	it('makes the objects of the World of a ground in the scene, marked in the tree, not saved: they come again of it', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();
		var labels;
		var saved;

		editor.Change('ground', {World: Elemenx.Service('SceneWorld').Library({Size: 400, Height: 12, Water: 0.15, Seed: 'editor', Settlements: [{X: 20, Y: 10, Houses: 4}], Scatters: [{Kind: 'grove', Density: 0.5}]})});

		await tick(30);

		expect(scene.Get('ground-world-0').Kind).toBe('village');
		expect(scene.Get('ground-world-1').Values.Generated).toBe('ground');

		labels = Array.from(editor.$Element().querySelectorAll('.elemenx-scene-editor-side [role="treeitem"], .elemenx-scene-editor-side li')).map(function (item) {
			return item.textContent;
		}).join('|');

		expect(labels).toContain('of the World');

		saved = scene.Save({Baked: true});

		expect(saved.Objects.map(function (object) {
			return object.ID;
		})).not.toContain('ground-world-0');

		/* The houses of its village are made of the village: marked so, not saved either. */
		await waitFor(function () {
			frame(editor);

			return scene.Objects(function (object) {
				return object.ID.indexOf('ground-world-0/house-') === 0;
			}).length > 0;
		}, 8000);

		expect(scene.Objects(function (object) {
			return object.ID.indexOf('ground-world-0/house-') === 0;
		})[0].Values.Generated).toBe('ground-world-0');
		expect(JSON.stringify(scene.Save().Added)).not.toContain('/house-');
	});
	/* Regression: a new document (no Scene) loaded into an editor left the scene of the one before (New of the Game editor did nothing). */
	it('makes a new document anew in the scene: a star system in place of the ground, a ground in place of the system', async function () {
		var mounted = await mount();
		var editor = mounted.Editor;
		var scene = editor.Scene();

		editor.Load({Version: 1, Name: 'space', Setting: 'space', Scene: null});

		expect(scene.Get('ground')).toBe(null);
		expect(scene.Get('planet').Kind).toBe('planet');
		expect(scene.Get('star').Kind).toBe('star');

		editor.Load({Version: 1, Name: 'land', Setting: 'ground', Scene: null});

		expect(scene.Get('planet')).toBe(null);
		expect(scene.Get('ground').Kind).toBe('ground');
	});
});
