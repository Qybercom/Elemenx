import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

function mount (template, state) {
	var component = Elemenx.Component(unique('BlueprintHost'), Object.assign({$Template: template}, state || {}))();
	var place = document.getElementById('mount');

	place.style.width = '900px';
	place.style.height = '600px';

	owned.push(component);

	place.appendChild(component.$Element());

	return component;
}

/* A generator: 3 times the parameter Scale, given as Value. */
function graph () {
	return {
		version: 1,
		type: 'generator',
		parameters: [{key: 'Scale', type: 'float', value: 2}],
		blocks: [
			{id: 'n', type: 'Number', x: 40, y: 40, properties: [{key: 'Value', value: 3}]},
			{id: 's', type: 'Parameter', x: 40, y: 200, properties: [{key: 'Key', value: 'Scale'}, {key: 'Type', value: 'float'}]},
			{id: 'm', type: 'Multiply', x: 300, y: 100, properties: []},
			{id: 'r', type: 'Result', x: 540, y: 100, properties: [{key: 'Key', value: 'Value'}]}
		],
		links: [{id: 'a', p1: 'n-out-Value', p2: 'm-in-A'}, {id: 'b', p1: 's-out-Value', p2: 'm-in-B'}, {id: 'c', p1: 'm-out-Out', p2: 'r-in-Value'}]
	};
}

function editor (host) {
	return host.$Element().querySelector('.elemenx-blueprint');
}

function pin (host, id) {
	return host.$Element().querySelector('[data-pin="' + id + '"]');
}

function middle (element) {
	var box = element.getBoundingClientRect();

	return {X: box.left + box.width / 2, Y: box.top + box.height / 2};
}

function pointer (target, type, point) {
	target.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, clientX: point.X, clientY: point.Y, pointerId: 1, pointerType: 'mouse', button: 0}));
}

/* A drag from an element to a point: pressed on it, moved on the canvas (it holds the pointer), let go there. */
function drag (host, from, to) {
	var canvas = host.$Element().querySelector('.elemenx-blueprint-canvas');

	pointer(from, 'pointerdown', middle(from));
	pointer(canvas, 'pointermove', to);
	pointer(canvas, 'pointerup', to);
}

describe('Contract: Blueprint, the editor of a graph of the Blueprints Service', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Blueprint']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('shows the blocks where they stand with their pins, the links between the pins, and the file it keeps', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: graph()});
		var element;
		var blueprint;
		var paths;
		var out;
		var into;
		var end;

		await tick(30);

		element = editor(host);
		blueprint = host.$Ref('Editor', true);
		paths = element.querySelectorAll('path[data-link]');

		expect(element.querySelectorAll('.elemenx-blueprint-block').length).toBe(4);
		expect(element.querySelector('[data-id="m"]').style.left).toBe('300px');
		expect(paths.length).toBe(3);

		/* A link goes from the middle of its output to the middle of its input, and its ends are kept as Flowprint keeps them. */
		out = middle(pin(host, 'n-out-Value'));
		into = middle(pin(host, 'm-in-A'));
		end = paths[0].getAttribute('d').split(' ');

		expect(Math.abs(Number(end[1]) - (out.X - element.querySelector('.elemenx-blueprint-canvas').getBoundingClientRect().left))).toBeLessThan(1.5);
		expect(Number(end[end.length - 2]) - Number(end[1])).toBeCloseTo(into.X - out.X, 0);
		expect(blueprint.Graph().links[0].x1).toBe(Math.round(Number(end[1])));

		/* The palette of its graph: the types of a generator, not those of a shader alone. */
		expect(element.querySelector('.elemenx-blueprint-type[data-type="Fbm"]')).not.toBe(null);
		expect(element.querySelector('.elemenx-blueprint-type[data-type="Texture"]')).toBe(null);

		expect(blueprint.Compile().Run()).toEqual({Value: 6});
		expect(JSON.parse(blueprint.Write()).blocks.length).toBe(4);
	});

	it('draws a link by a drag from a pin to another, takes the place of the one there, and takes one away let go on nothing', async function () {
		var changes = [];
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" (change)="Changed" /></div>', {Graph: graph(), Changed: function (value) {
			changes.push(JSON.parse(JSON.stringify(value)));
		}});
		var blueprint;
		var links;

		await tick(30);

		blueprint = host.$Ref('Editor', true);

		/* The Parameter into A of Multiply: the link of the Number to A goes. */
		drag(host, pin(host, 's-out-Value'), middle(pin(host, 'm-in-A')));

		links = blueprint.Graph().links.map(function (link) {
			return link.p1 + '>' + link.p2;
		});

		expect(links).toEqual(['s-out-Value>m-in-B', 'm-out-Out>r-in-Value', 's-out-Value>m-in-A']);
		expect(changes.length).toBe(1);
		expect(blueprint.Compile().Run()).toEqual({Value: 4});
		expect(editor(host).querySelectorAll('path[data-link]').length).toBe(3);

		/* From an input to an output: the same link the other way. */
		drag(host, pin(host, 'm-in-B'), middle(pin(host, 'n-out-Value')));

		expect(blueprint.Compile().Run()).toEqual({Value: 6});

		/* An input dragged off on nothing loses its link. */
		drag(host, pin(host, 'r-in-Value'), {X: 5, Y: 5});

		expect(blueprint.Graph().links.some(function (link) {
			return link.p2 === 'r-in-Value';
		})).toBe(false);
		expect(changes.length).toBe(3);

		/* Two outputs do not go together: nothing changes. */
		drag(host, pin(host, 'n-out-Value'), middle(pin(host, 's-out-Value')));

		expect(changes.length).toBe(3);
	});

	it('fits all of its blocks into the view, not the corner of its canvas (regression: it fitted a canvas 1 pixel large)', async function () {
		var far = graph();
		var host;
		var blueprint;
		var view;

		far.blocks[3].x = 1400;
		far.blocks[3].y = 900;
		host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" Palette="false" /></div>', {Graph: far});

		await tick(30);

		blueprint = host.$Ref('Editor', true);

		blueprint.Fit();

		await tick(30);

		view = editor(host).querySelector('.elemenx-board').getBoundingClientRect();

		Array.prototype.forEach.call(editor(host).querySelectorAll('.elemenx-blueprint-block'), function (block) {
			var box = block.getBoundingClientRect();

			expect(box.left).toBeGreaterThanOrEqual(view.left - 1);
			expect(box.top).toBeGreaterThanOrEqual(view.top - 1);
			expect(box.right).toBeLessThanOrEqual(view.right + 1);
			expect(box.bottom).toBeLessThanOrEqual(view.bottom + 1);
		});
	});

	it('moves a block by its head, and the links follow it', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: graph()});
		var blueprint;
		var head;
		var before;
		var start;

		await tick(30);

		blueprint = host.$Ref('Editor', true);
		head = editor(host).querySelector('[data-id="m"] .elemenx-blueprint-title');
		before = editor(host).querySelector('path[data-link="a"]').getAttribute('d');
		start = middle(head);

		drag(host, head, {X: start.X + 40, Y: start.Y + 30});

		expect([blueprint.Graph().blocks[2].x, blueprint.Graph().blocks[2].y]).toEqual([340, 130]);
		expect(editor(host).querySelector('path[data-link="a"]').getAttribute('d')).not.toBe(before);
		expect(blueprint.Selected()).toEqual({Block: 'm', Link: null, Group: null, Blocks: ['m']});
	});

	it('edits the code of a GLSL block in a field of lines, and makes its pins again as its properties name them, its gone links dropped', async function () {
		var pass = {version: 1, type: 'pass', blocks: [{id: 'c', type: 'Color', x: 40, y: 40}, {id: 'g', type: 'GLSL', x: 280, y: 40, properties: [{key: 'Inputs', value: 'Tint: vec3, Gain: float'}, {key: 'Outputs', value: 'Out: vec4'}, {key: 'Code', value: 'Out = vec4(Tint * Gain, 1.0);'}]}, {id: 'o', type: 'Output', x: 520, y: 40}], links: [{id: 'a', p1: 'c-out-RGB', p2: 'g-in-Tint'}, {id: 'b', p1: 'g-out-Out', p2: 'o-in-Color'}]};
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: pass});
		var element;
		var blueprint;
		var field;

		await tick(30);

		element = editor(host);
		blueprint = host.$Ref('Editor', true);
		field = element.querySelector('[data-id="g"] [data-property="Code"]');

		expect(field.tagName).toBe('TEXTAREA');
		expect(field.value).toBe('Out = vec4(Tint * Gain, 1.0);');
		expect(element.querySelector('[data-pin="g-in-Gain"]')).not.toBe(null);

		field = element.querySelector('[data-id="g"] [data-property="Inputs"]');
		field.value = 'Light: vec3';

		field.dispatchEvent(new Event('change', {bubbles: true}));

		element = editor(host);

		expect(element.querySelector('[data-pin="g-in-Gain"]')).toBe(null);
		expect(element.querySelector('[data-pin="g-in-Light"]')).not.toBe(null);
		expect(blueprint.Graph().links.map(function (link) {
			return link.id;
		})).toEqual(['b']);
	});

	it('adds a block of the palette, edits its properties, and Delete removes what is selected with its links', async function () {
		var problems = [];
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" (problems)="Told" /></div>', {Graph: graph(), Told: function (list) {
			problems = list;
		}});
		var element;
		var blueprint;
		var field;
		var added;

		await tick(30);

		element = editor(host);
		blueprint = host.$Ref('Editor', true);

		element.querySelector('.elemenx-blueprint-type[data-type="Fbm"]').click();

		added = blueprint.Graph().blocks[4];

		expect(added.type).toBe('Fbm');
		expect(blueprint.Selected().Block).toBe(added.id);
		expect(element.querySelectorAll('.elemenx-blueprint-block').length).toBe(5);

		/* A property: the number of the Number block. */
		field = element.querySelector('[data-id="n"] [data-property="Value"]');
		field.value = '5';

		field.dispatchEvent(new Event('change', {bubbles: true}));

		expect(blueprint.Compile().Run()).toEqual({Value: 10});

		/* The type of a Parameter is the type of its pin. */
		field = element.querySelector('[data-id="s"] [data-property="Type"]');
		field.value = 'vec3';

		field.dispatchEvent(new Event('change', {bubbles: true}));

		expect(element.querySelector('[data-pin="s-out-Value"]').getAttribute('data-type')).toBe('vec3');

		/* Selected and Delete: the block goes, with its links; the graph is wrong without an end. */
		blueprint.Select('r');

		element.dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', bubbles: true, cancelable: true}));

		expect(blueprint.Graph().blocks.map(function (block) {
			return block.id;
		})).not.toContain('r');
		expect(blueprint.Graph().links.some(function (link) {
			return link.p2 === 'r-in-Value';
		})).toBe(false);
		expect(problems.map(function (problem) {
			return problem.Message;
		})).toEqual(['a generator graph has no Result']);
	});

	it('marks the blocks Check finds wrong, edits the parameters of the graph, and arranges a graph made in code', async function () {
		var made = graph();
		var host;
		var element;
		var blueprint;
		var columns;

		made.blocks.forEach(function (block) {
			block.x = 0;
			block.y = 0;
		});

		made.blocks.push({id: 'odd', type: 'Nothing', x: 0, y: 0, properties: []});

		host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: made});

		await tick(30);

		element = editor(host);
		blueprint = host.$Ref('Editor', true);

		/* In columns: what reads comes after what it reads. */
		columns = blueprint.Graph().blocks.map(function (block) {
			return block.x;
		});

		expect(columns).toEqual([40, 40, 300, 560, 40]);
		expect(element.querySelector('[data-id="odd"]').classList.contains('wrong')).toBe(true);
		expect(element.querySelector('[data-id="odd"]').getAttribute('title')).toBe('unknown type of block Nothing');

		/* The parameters: added, given a value. */
		element.querySelector('.elemenx-blueprint-parameters-head button').click();

		await tick(20);

		expect(blueprint.Graph().parameters.map(function (parameter) {
			return parameter.key;
		})).toEqual(['Scale', 'Parameter2']);

		element.querySelectorAll('.elemenx-blueprint-parameter-value')[0].value = '4';

		element.querySelectorAll('.elemenx-blueprint-parameter-value')[0].dispatchEvent(new Event('change', {bubbles: true}));

		expect(blueprint.Graph().parameters[0].value).toBe(4);
	});

	it('read-only shows the graph alone: no palette, no new links, no edits', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor ReadOnly="true" [Value]="Graph" /></div>', {Graph: graph()});
		var element;
		var blueprint;

		await tick(30);

		element = editor(host);
		blueprint = host.$Ref('Editor', true);

		expect(element.querySelector('.elemenx-blueprint-side')).toBe(null);
		expect(element.querySelector('[data-property="Value"]').disabled).toBe(true);

		/* An input in sight, so a link would take the place of the one there. */
		drag(host, pin(host, 'n-out-Value'), middle(pin(host, 'm-in-B')));

		expect(blueprint.Graph().links.map(function (link) {
			return link.p1 + '>' + link.p2;
		})).toEqual(['n-out-Value>m-in-A', 's-out-Value>m-in-B', 'm-out-Out>r-in-Value']);

		blueprint.Select('m');

		element.dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', bubbles: true, cancelable: true}));

		expect(blueprint.Graph().blocks.length).toBe(4);
	});
	/* Regression: a graph given anew with all its blocks at 0, 0 (a graph of a library) stayed in a heap, or was laid out 40 pixels apart. */
	it('lays out a graph given anew whose blocks all stand at 0, 0, none over another', async function () {
		var host = mount('<Blueprint #Editor [value]="Graph" />', {Graph: graph()});
		var heap = graph();
		var blocks;

		await tick(30);

		heap.blocks.forEach(function (block) {
			block.x = 0;
			block.y = 0;
		});

		host.Graph = heap;

		await tick(60);

		blocks = host.$Ref('Editor', true).Graph().blocks;

		expect(blocks.some(function (block) {
			return block.x || block.y;
		})).toBe(true);

		blocks.forEach(function (one) {
			blocks.forEach(function (other) {
				if (one !== other && one.x === other.x)
					expect(Math.abs(one.y - other.y)).toBeGreaterThanOrEqual(100);
			});
		});
	});

	it('chooses many blocks (Shift and a press, a frame drawn with Shift, Ctrl+A), drags them all by one head, and Delete removes them all', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: graph()});
		var blueprint;
		var canvas;
		var head;
		var start;
		var corner;

		await tick(30);

		blueprint = host.$Ref('Editor', true);
		canvas = editor(host).querySelector('.elemenx-blueprint-canvas');

		pointer(editor(host).querySelector('[data-id="n"] .elemenx-blueprint-title'), 'pointerdown', middle(editor(host).querySelector('[data-id="n"] .elemenx-blueprint-title')));
		pointer(canvas, 'pointerup', middle(editor(host).querySelector('[data-id="n"] .elemenx-blueprint-title')));

		editor(host).querySelector('[data-id="s"] .elemenx-blueprint-title').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true, clientX: middle(editor(host).querySelector('[data-id="s"]')).X, clientY: middle(editor(host).querySelector('[data-id="s"]')).Y, pointerId: 1, button: 0, shiftKey: true}));

		pointer(canvas, 'pointerup', middle(editor(host).querySelector('[data-id="s"]')));

		expect(blueprint.Chosen()).toEqual(['n', 's']);
		expect(editor(host).querySelectorAll('.elemenx-blueprint-block.selected')).toHaveLength(2);

		/* A drag of one head moves both. */
		head = editor(host).querySelector('[data-id="n"] .elemenx-blueprint-title');
		start = middle(head);

		drag(host, head, {X: start.X + 20, Y: start.Y + 10});

		expect([blueprint.Graph().blocks[0].x, blueprint.Graph().blocks[0].y, blueprint.Graph().blocks[1].x, blueprint.Graph().blocks[1].y]).toEqual([60, 50, 60, 210]);

		/* A frame drawn with Shift from an empty place round the two at the right. */
		corner = canvas.getBoundingClientRect();

		canvas.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true, clientX: corner.left + 280, clientY: corner.top + 60, pointerId: 1, button: 0, shiftKey: true}));

		pointer(canvas, 'pointermove', {X: corner.left + 899, Y: corner.top + 590});
		pointer(canvas, 'pointerup', {X: corner.left + 899, Y: corner.top + 590});

		expect(blueprint.Chosen().sort()).toEqual(['m', 'r']);

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'a', ctrlKey: true, bubbles: true}));

		expect(blueprint.Chosen()).toHaveLength(4);

		blueprint.SelectMany(['n', 'm']);

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', bubbles: true}));

		expect(blueprint.Graph().blocks.map(function (block) {
			return block.id;
		})).toEqual(['s', 'r']);
		expect(blueprint.Graph().links).toHaveLength(0);
	});

	it('undoes and redoes each change, and copies the chosen blocks with the links between them to paste them aside', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: graph()});
		var blueprint;
		var pasted;

		await tick(30);

		blueprint = host.$Ref('Editor', true);

		blueprint.Remove('m');

		expect(blueprint.Graph().blocks).toHaveLength(3);

		expect(blueprint.Undo()).toBe(true);
		expect(blueprint.Graph().blocks).toHaveLength(4);
		expect(blueprint.Graph().links).toHaveLength(3);

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'y', ctrlKey: true, bubbles: true}));

		expect(blueprint.Graph().blocks).toHaveLength(3);

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'z', ctrlKey: true, bubbles: true}));

		expect(blueprint.Graph().blocks).toHaveLength(4);
		expect(blueprint.Undo()).toBe(false);

		/* Two blocks and the link between them, pasted 32 aside, chosen. */
		blueprint.SelectMany(['n', 'm']);
		blueprint.Copy();

		pasted = blueprint.Paste();

		expect(pasted).toHaveLength(2);
		expect(blueprint.Graph().blocks).toHaveLength(6);
		expect(blueprint.Graph().links).toHaveLength(4);
		expect(blueprint.Chosen()).toEqual(pasted);
		expect(blueprint.Graph().blocks[4]).toMatchObject({type: 'Number', x: 72, y: 72});
		expect(blueprint.Compile().Run()).toEqual({Value: 6});

		blueprint.Undo();

		expect(blueprint.Graph().blocks).toHaveLength(4);
	});

	it('groups what is chosen in a frame, nests groups, drags a frame with all in it, and takes a frame away alone or with its content', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" /></div>', {Graph: graph()});
		var blueprint;
		var inner;
		var outer;
		var frame;
		var start;

		await tick(30);

		blueprint = host.$Ref('Editor', true);

		blueprint.SelectMany(['n', 's']);

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'g', ctrlKey: true, bubbles: true}));

		inner = blueprint.Graph().groups[0];

		expect(inner).toMatchObject({members: ['n', 's'], title: 'Group 1'});

		outer = blueprint.Group([inner.id, 'm'], 'Inputs and math');

		expect(blueprint.Graph().groups[1].members).toEqual([inner.id, 'm']);

		await tick(30);

		/* The outer frame holds the inner one, the inner holds its blocks. */
		frame = editor(host).querySelector('[data-group="' + inner.id + '"]');

		expect(frame.offsetLeft).toBeLessThan(40);
		expect(frame.offsetWidth).toBeGreaterThan(150);
		expect(editor(host).querySelector('[data-group="' + outer.id + '"]').offsetWidth).toBeGreaterThan(frame.offsetLeft + frame.offsetWidth - 40);

		/* Its title dragged: all in it go along. */
		start = middle(frame.querySelector('.elemenx-blueprint-frame-head'));

		drag(host, frame.querySelector('.elemenx-blueprint-frame-head'), {X: start.X + 10, Y: start.Y + 20});

		expect([blueprint.Graph().blocks[0].x, blueprint.Graph().blocks[1].y, blueprint.Graph().blocks[2].x]).toEqual([50, 220, 300]);
		expect(blueprint.Selected().Group).toBe(inner.id);

		/* Delete takes the frame alone: its members go to the outer group. */
		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', bubbles: true}));

		expect(blueprint.Graph().groups).toHaveLength(1);
		expect(blueprint.Graph().groups[0].members.sort()).toEqual(['m', 'n', 's']);

		/* Shift+Delete takes the group with all of its blocks. */
		blueprint.Select(outer.id);

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', shiftKey: true, bubbles: true}));

		expect(blueprint.Graph().groups).toHaveLength(0);
		expect(blueprint.Graph().blocks.map(function (block) {
			return block.id;
		})).toEqual(['r']);
		expect(JSON.parse(blueprint.Write()).groups).toEqual([]);
	});

	it('shows the comments of blocks, links and groups as Comments says: a muted Markdown line under them, a mark, or nothing', async function () {
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" [Comments]="Mode" /></div>', {Graph: graph(), Mode: 'caption'});
		var blueprint;
		var note;

		await tick(30);

		blueprint = host.$Ref('Editor', true);

		expect(blueprint.Comment('m', 'Times **two**')).toBe(true);

		blueprint.Comment('a', 'the number');
		blueprint.Group(['n', 's'], 'Inputs');
		blueprint.Comment(blueprint.Graph().groups[0].id, 'What goes in');

		await tick(30);

		note = editor(host).querySelector('[data-id="m"] > .elemenx-blueprint-comment');

		expect(note.querySelector('strong').textContent).toBe('two');
		expect(note.getBoundingClientRect().top).toBeGreaterThanOrEqual(editor(host).querySelector('[data-id="m"]').getBoundingClientRect().bottom);
		expect(editor(host).querySelector('.elemenx-blueprint-link-comment').textContent).toContain('the number');
		expect(editor(host).querySelector('.elemenx-blueprint-frame-head > .elemenx-blueprint-comment').textContent).toContain('What goes in');
		expect(JSON.parse(blueprint.Write()).blocks[2].comment).toBe('Times **two**');

		host.Mode = 'icon';

		await tick(30);

		expect(editor(host).querySelector('[data-id="m"] .elemenx-blueprint-comment-mark').getAttribute('title')).toBe('Times **two**');
		expect(editor(host).querySelector('.elemenx-blueprint-comment')).toBe(null);

		host.Mode = 'hidden';

		await tick(30);

		expect(editor(host).querySelector('[data-comment]')).toBe(null);
	});
	it('asks EditCheck before what the reader does, keeps what it refuses as it was, and tells it in denied', async function () {
		var told = [];
		var host = mount('<div style="height: 100%"><Blueprint #Editor [Value]="Graph" [editCheck]="Check" (denied)="Denied" /></div>', {Graph: graph(), Check: function (action, target) {
			if (action === 'move')
				return target.Blocks.indexOf('m') === -1;

			if (action === 'add')
				return target.Type !== 'Fbm';

			return action !== 'remove' && action !== 'link' && action !== 'unlink';
		}, Denied: function (event) {
			told.push(event);
		}});
		var blueprint;
		var head;
		var start;
		var links;

		function pairs () {
			return blueprint.Graph().links.map(function (link) {
				return link.p1 + '>' + link.p2;
			});
		}

		await tick(30);

		blueprint = host.$Ref('Editor', true);
		links = pairs();

		/* A block that may not move. */
		head = editor(host).querySelector('[data-id="m"] .elemenx-blueprint-title');
		start = middle(head);

		drag(host, head, {X: start.X + 40, Y: start.Y + 30});

		expect([blueprint.Graph().blocks[2].x, blueprint.Graph().blocks[2].y]).toEqual([300, 100]);
		expect(told[0]).toEqual({Action: 'move', Blocks: ['m']});

		/* One that may. */
		head = editor(host).querySelector('[data-id="r"] .elemenx-blueprint-title');
		start = middle(head);

		drag(host, head, {X: start.X + 40, Y: start.Y + 30});

		expect(blueprint.Graph().blocks[3].x).toBe(580);

		/* A type that may not be added, then one that may. */
		editor(host).querySelector('.elemenx-blueprint-type[data-type="Fbm"]').click();

		expect(blueprint.Graph().blocks.length).toBe(4);
		expect(told[told.length - 1]).toEqual({Action: 'add', Type: 'Fbm'});

		editor(host).querySelector('.elemenx-blueprint-type[data-type="Number"]').click();

		expect(blueprint.Graph().blocks.length).toBe(5);

		/* No new link, none taken away, nothing removed. */
		drag(host, pin(host, 's-out-Value'), middle(pin(host, 'm-in-A')));
		drag(host, pin(host, 'r-in-Value'), {X: 5, Y: 5});

		expect(pairs()).toEqual(links);
		expect(told.map(function (one) {
			return one.Action;
		})).toEqual(expect.arrayContaining(['link', 'unlink']));

		blueprint.Select('n');

		editor(host).dispatchEvent(new KeyboardEvent('keydown', {key: 'Delete', bubbles: true}));

		expect(blueprint.Graph().blocks.length).toBe(5);
		expect(told[told.length - 1]).toEqual({Action: 'remove', Blocks: ['n']});

		/* What code does is not asked. */
		blueprint.Remove('n');

		expect(blueprint.Graph().blocks.length).toBe(4);
	});
});
