import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('DrawingHost'), Object.assign({$Template: template}, state || {}))();

	owned.push(component);

	document.getElementById('mount').appendChild(component.$Element());

	return component;
}

/* A drawing of 400 by 200 units on one layer, shown 400 pixels wide: a unit is a pixel. */
function model (items) {
	return {Width: 400, Height: 200, Layers: [{ID: 'base', Name: 'Base', Visible: true, Locked: false, Items: items || []}]};
}

/* A pointer event on the stage of a drawing at x, y pixels of its SVG. */
function pointer (root, type, x, y, options) {
	var svg = root.querySelector('.elemenx-drawing-svg');
	var rect = svg.getBoundingClientRect();
	var target = options && options.Target ? options.Target : svg;

	target.dispatchEvent(new PointerEvent(type, Object.assign({bubbles: true, clientX: rect.left + x, clientY: rect.top + y, pointerId: 1, pointerType: 'mouse', button: 0}, options || {})));
}

function drag (root, points, options) {
	pointer(root, 'pointerdown', points[0][0], points[0][1], options);

	points.slice(1).forEach(function (point) {
		pointer(root, 'pointermove', point[0], point[1], options);
	});

	pointer(root, 'pointerup', points[points.length - 1][0], points[points.length - 1][1], options);
}

function key (root, name, options) {
	root.querySelector('.elemenx-drawing-stage').dispatchEvent(new KeyboardEvent('keydown', Object.assign({key: name, bubbles: true, cancelable: true}, options || {})));
}

/* Drawing, a vector drawing, and DrawingLayers, its layers. */
describe('Contract: Drawing and DrawingLayers of ElemenxUI', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Drawing', 'DrawingLayers']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('draws a rectangle, an ellipse, a line, an arrow and a freehand stroke with the tools, each an item of the model it emits', async function () {
		var changes = [];
		var host = mount('<div style="width: 400px"><Drawing [value]="Model" [tool]="Tool" Stroke="#c0392b" Fill="#00ff00" StrokeWidth="2" (change)="Changed" /></div>', {
			Model: model(),
			Tool: 'rect',
			Changed: function (value) {
				changes.push(value);

				this.Model = value;
			}
		});
		var root;
		var items;

		await waitFor(function () {
			return host.$Element().querySelector('.elemenx-drawing-svg');
		});

		root = host.$Element();

		drag(root, [[20, 20], [60, 40], [120, 80]]);

		host.Tool = 'ellipse';

		await tick();

		drag(root, [[150, 20], [250, 100]]);

		host.Tool = 'line';

		await tick();

		drag(root, [[20, 150], [100, 150]]);

		host.Tool = 'arrow';

		await tick();

		drag(root, [[120, 150], [200, 180]]);

		host.Tool = 'path';

		await tick();

		drag(root, [[260, 120], [280, 140], [300, 130], [320, 160]]);

		/* A press without a drag makes no rectangle. */
		host.Tool = 'rect';

		await tick();

		drag(root, [[350, 20], [350, 20]]);

		await tick();

		expect(changes.length).toBe(5);

		items = changes[4].Layers[0].Items;

		expect(items.map(function (item) {
			return item.Type;
		})).toEqual(['rect', 'ellipse', 'line', 'arrow', 'path']);
		expect(items[0]).toMatchObject({X: 20, Y: 20, W: 100, H: 60, Stroke: '#c0392b', Fill: '#00ff00', Width: 2});
		expect(items[2].Points).toEqual([{X: 20, Y: 150}, {X: 100, Y: 150}]);
		expect(items[4].Points.length).toBe(4);
		expect(items[4].Brush).toBe('pen');

		/* The SVG of the drawing: its size, an element for each item, the head of the arrow. */
		var drawing = Elemenx.Instance(root.querySelector('.elemenx-drawing'));
		var svg = drawing.SVG();

		expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="400" height="200" viewBox="0 0 400 200">/);
		expect(svg).toContain('<rect data-id="' + items[0].ID + '" x="20" y="20" width="100" height="60" fill="#00ff00" stroke="#c0392b"');
		expect(svg).toContain('<ellipse data-id="' + items[1].ID + '" cx="200" cy="60" rx="50" ry="40"');
		expect((svg.match(/<path/g) || []).length).toBe(4);

		/* The PNG of it. */
		var picture = await new Promise(function (resolve, reject) {
			drawing.PNG(function (error, url) {
				if (error) reject(error);
				else resolve(url);
			}, 0.5);
		});

		expect(picture).toMatch(/^data:image\/png;base64,/);
	});

	it('selects by a press, by Shift and by a frame, moves and resizes the selection, and undoes and redoes it', async function () {
		var selections = [];
		var host = mount('<div style="width: 400px"><Drawing [value]="Model" (change)="Changed" (select)="Selected" /></div>', {
			Model: model([
				{ID: 'a', Type: 'rect', X: 20, Y: 20, W: 60, H: 40, Stroke: '#000000', Fill: '#ffffff', Width: 2},
				{ID: 'b', Type: 'ellipse', X: 120, Y: 20, W: 60, H: 60, Stroke: '#000000', Fill: 'none', Width: 2},
				{ID: 'c', Type: 'line', Points: [{X: 220, Y: 100}, {X: 300, Y: 100}], Stroke: '#000000', Width: 2}
			]),
			Changed: function (value) {
				this.Model = value;
			},
			Selected: function (ids) {
				selections.push(ids.join(','));
			}
		});
		var root;
		var drawing;

		await waitFor(function () {
			return host.$Element().querySelector('.elemenx-drawing-svg');
		});

		root = host.$Element();
		drawing = Elemenx.Instance(root.querySelector('.elemenx-drawing'));

		/* Inside a filled rectangle; on the line of an empty ellipse (not in it); near a line. */
		drag(root, [[50, 40], [50, 40]]);

		pointer(root, 'pointerdown', 150, 50, {shiftKey: true});
		pointer(root, 'pointerup', 150, 50, {shiftKey: true});

		drag(root, [[150, 20], [150, 20]], {shiftKey: true});
		drag(root, [[260, 102], [260, 102]], {shiftKey: true});

		expect(selections).toEqual(['a', 'a,b', 'a,b,c']);

		/* A frame on the empty drawing selects the items it covers whole. */
		drag(root, [[10, 10], [200, 90]]);

		expect(drawing.Selected()).toEqual(['a', 'b']);

		/* A drag moves them; the arrows too, Shift by 10. */
		drag(root, [[50, 40], [70, 50]]);

		expect(host.Model.Layers[0].Items[0]).toMatchObject({X: 40, Y: 30});
		expect(host.Model.Layers[0].Items[1]).toMatchObject({X: 140, Y: 30});

		key(root, 'ArrowRight', {shiftKey: true});

		expect(host.Model.Layers[0].Items[0].X).toBe(50);

		/* One selected: its handles; the one at the corner resizes it. */
		drawing.Select(['a']);

		await tick();

		var handle = root.querySelector('.elemenx-drawing-handle[data-handle="se"]');

		expect(root.querySelectorAll('.elemenx-drawing-handle').length).toBe(8);

		/* The press on the handle; the rest goes to the drawing, which holds the pointer (the handle is drawn again as it moves). */
		pointer(root, 'pointerdown', 110, 70, {Target: handle});
		pointer(root, 'pointermove', 130, 90);
		pointer(root, 'pointerup', 130, 90);

		expect(host.Model.Layers[0].Items[0]).toMatchObject({X: 50, Y: 30, W: 80, H: 60});

		/* The history goes back, then forward again. */
		key(root, 'z', {ctrlKey: true});

		expect(host.Model.Layers[0].Items[0]).toMatchObject({W: 60, H: 40});

		key(root, 'z', {ctrlKey: true, shiftKey: true});

		expect(host.Model.Layers[0].Items[0]).toMatchObject({W: 80, H: 60});

		/* Delete takes the selection away. */
		key(root, 'Delete');

		expect(host.Model.Layers[0].Items.map(function (item) {
			return item.ID;
		})).toEqual(['b', 'c']);
	});

	it('groups and ungroups, moves the selection up and down its layer, erases, and writes a text', async function () {
		var host = mount('<div style="width: 400px"><Drawing [value]="Model" [tool]="Tool" (change)="Changed" /></div>', {
			Model: model([
				{ID: 'a', Type: 'rect', X: 20, Y: 20, W: 60, H: 40, Stroke: '#000000', Fill: '#ffffff', Width: 2},
				{ID: 'b', Type: 'rect', X: 120, Y: 20, W: 60, H: 40, Stroke: '#000000', Fill: '#ffffff', Width: 2},
				{ID: 'c', Type: 'rect', X: 220, Y: 20, W: 60, H: 40, Stroke: '#000000', Fill: '#ffffff', Width: 2}
			]),
			Tool: 'select',
			Changed: function (value) {
				this.Model = value;
			}
		});
		var root;
		var drawing;
		var items;
		var editor;

		await waitFor(function () {
			return host.$Element().querySelector('.elemenx-drawing-svg');
		});

		root = host.$Element();
		drawing = Elemenx.Instance(root.querySelector('.elemenx-drawing'));

		drawing.Select(['a', 'c']);

		key(root, 'g', {ctrlKey: true});

		items = host.Model.Layers[0].Items;

		/* The group takes the place of the topmost of them, its items in their order. */
		expect(items.map(function (item) {
			return item.Type === 'group' ? 'group(' + item.Items.map(function (child) {
				return child.ID;
			}).join(',') + ')' : item.ID;
		})).toEqual(['b', 'group(a,c)']);
		expect(drawing.Selected()).toEqual([items[1].ID]);
		expect(drawing.SVG()).toContain('<g data-id="' + items[1].ID + '"><rect data-id="a"');

		/* A press on one of its items selects the group, a drag moves it whole. */
		drag(root, [[50, 40], [60, 40]]);

		expect(host.Model.Layers[0].Items[1].Items.map(function (child) {
			return child.X;
		})).toEqual([30, 230]);

		drawing.Backward();

		expect(host.Model.Layers[0].Items[0].Type).toBe('group');

		key(root, 'g', {ctrlKey: true, shiftKey: true});

		expect(host.Model.Layers[0].Items.map(function (item) {
			return item.ID;
		})).toEqual(['a', 'c', 'b']);
		expect(drawing.Selected()).toEqual(['a', 'c']);

		/* The eraser takes away what it passes over. */
		host.Tool = 'eraser';

		await tick();

		drag(root, [[140, 40], [150, 40]]);

		expect(host.Model.Layers[0].Items.map(function (item) {
			return item.ID;
		})).toEqual(['a', 'c']);

		/* The text tool: a field at the press; Enter keeps the text there. */
		host.Tool = 'text';

		await tick();

		pointer(root, 'pointerdown', 40, 120);
		pointer(root, 'pointerup', 40, 120);

		editor = root.querySelector('.elemenx-drawing-editor');

		expect(editor).not.toBe(null);

		editor.value = 'Hello';

		editor.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));

		expect(root.querySelector('.elemenx-drawing-editor')).toBe(null);
		expect(host.Model.Layers[0].Items[2]).toMatchObject({Type: 'text', X: 40, Y: 120, Text: 'Hello'});
		expect(drawing.SVG()).toContain('<tspan x="40">Hello</tspan>');
	});

	it('DrawingLayers shows the layers, the top one first, hides, locks, adds, orders, renames and removes them, and the Drawing follows', async function () {
		var chosen = [];
		var host = mount('<div style="width: 400px"><DrawingLayers [value]="Model" [layer]="Layer" (change)="Changed" (select)="Chose" /><Drawing [value]="Model" [layer]="Layer" Tool="rect" (change)="Changed" /></div>', {
			Model: {Width: 400, Height: 200, Layers: [{ID: 'back', Name: 'Back', Visible: true, Locked: false, Items: [{ID: 'a', Type: 'rect', X: 10, Y: 10, W: 20, H: 20, Stroke: '#000000', Width: 1}]}, {ID: 'front', Name: 'Front', Visible: true, Locked: false, Items: []}]},
			Layer: 'front',
			Changed: function (value) {
				this.Model = value;
			},
			Chose: function (id) {
				chosen.push(id);

				this.Layer = id;
			}
		});
		var root;
		var rows;
		var names = function () {
			return Array.prototype.map.call(root.querySelectorAll('.elemenx-drawing-layer-name'), function (node) {
				return node.textContent;
			});
		};
		var button = function (title) {
			return root.querySelector('.elemenx-drawing-layers-actions button[title="' + title + '"]');
		};

		await waitFor(function () {
			return host.$Element().querySelector('.elemenx-drawing-svg') && host.$Element().querySelector('.elemenx-drawing-layer');
		});

		root = host.$Element();
		rows = root.querySelectorAll('.elemenx-drawing-layer');

		expect(names()).toEqual(['Front', 'Back']);
		expect(rows[0].classList.contains('current')).toBe(true);
		expect(root.querySelectorAll('.elemenx-drawing-layer-count')[1].textContent).toBe('1');

		/* A new rectangle goes into the current layer. */
		drag(root, [[100, 50], [150, 90]]);

		expect(host.Model.Layers[1].Items.length).toBe(1);

		/* Hidden: the Drawing leaves it out. */
		rows[1].querySelector('.elemenx-drawing-layer-toggle').click();

		await tick();

		expect(host.Model.Layers[0].Visible).toBe(false);
		expect(root.querySelector('.elemenx-drawing-svg [data-layer="back"]')).toBe(null);

		/* Locked: no new item goes into it. */
		root.querySelectorAll('.elemenx-drawing-layer')[0].querySelectorAll('.elemenx-drawing-layer-toggle')[1].click();

		await tick();

		expect(host.Model.Layers[1].Locked).toBe(true);

		drag(root, [[200, 50], [250, 90]]);

		expect(host.Model.Layers[1].Items.length).toBe(1);

		/* Added over the current one, and chosen. */
		button('Add a layer').click();

		await tick();

		expect(names()).toEqual(['Layer 3', 'Front', 'Back']);
		expect(chosen.length).toBe(1);
		expect(host.Layer).toBe(chosen[0]);

		button('Move the layer down').click();

		await tick();

		expect(names()).toEqual(['Front', 'Layer 3', 'Back']);

		/* Renamed by a double press. */
		root.querySelectorAll('.elemenx-drawing-layer')[1].dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		await tick();

		var field = root.querySelector('.elemenx-drawing-layer-field');

		field.value = 'Notes';

		field.dispatchEvent(new FocusEvent('blur'));

		await tick();

		expect(names()).toEqual(['Front', 'Notes', 'Back']);

		button('Remove the layer').click();

		await tick();

		expect(names()).toEqual(['Front', 'Back']);
		expect(host.Layer).toBe('back');
	});
});
