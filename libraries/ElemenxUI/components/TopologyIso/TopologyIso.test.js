import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, tick, unique, waitFor } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var owned = [];

function mount (template, state, size) {
	var component = Elemenx.Component(unique('IsoHost'), Object.assign({$Template: template}, state || {}))();
	var place = document.getElementById('mount');

	place.style.width = size ? size[0] + 'px' : '800px';
	place.style.height = size ? size[1] + 'px' : '500px';

	owned.push(component);

	place.appendChild(component.$Element());

	return component;
}

function isoOf (host) {
	return Elemenx.Instance(host.$Element().querySelector('.elemenx-topology-iso'));
}

function pointer (canvas, type, at, extra) {
	canvas.dispatchEvent(new PointerEvent(type, Object.assign({clientX: at.X, clientY: at.Y, button: 0, buttons: 1, pointerId: 1, bubbles: true}, extra || {})));
}

/* How many pixels of the canvas are not of the floor (its corner). */
function painted (iso) {
	var canvas = iso.Own().Canvas;
	var data;
	var floor;
	var count = 0;
	var i;

	iso.Draw(performance.now());

	data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
	floor = [data[0], data[1], data[2]];

	for (i = 0; i < data.length; i += 4) {
		if (Math.abs(data[i] - floor[0]) + Math.abs(data[i + 1] - floor[1]) + Math.abs(data[i + 2] - floor[2]) > 24)
			count++;
	}

	return count;
}

var nodes = [
	{ID: 'a', Label: 'A', Kind: 'server', Active: true, Load: 0.4},
	{ID: 'b', Label: 'B', Kind: 'database', Load: 0.5},
	{ID: 'c', Label: 'C', Kind: 'service'},
	{ID: 'd', Label: 'D', Kind: 'switch'}
];
var links = [{From: 'a', To: 'b', Load: 0.3}, {From: 'a', To: 'c'}, {From: 'b', To: 'c'}, {From: 'd', To: 'a'}];

describe('Contract: TopologyIso, a Topology in 3D on a canvas', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Topology', 'TopologyIso']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('draws its nodes on the canvas and lists them for a screen reader, a button each', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" /></div>', {Nodes: nodes, Links: links});

		await tick(80);

		var iso = isoOf(host);

		expect(painted(iso)).toBeGreaterThan(2000);
		expect(host.$Element().querySelectorAll('.elemenx-topology-iso-list button').length).toBe(4);
		expect(iso.Picture().indexOf('data:image/png')).toBe(0);
	});

	it('is the view of a Topology with View isometric', async function () {
		var host = mount('<div style="height: 100%"><Topology View="isometric" [nodes]="Nodes" [links]="Links" /></div>', {Nodes: nodes, Links: links});

		await tick(80);

		expect(host.$Element().querySelector('.elemenx-topology-iso canvas')).not.toBe(null);
		expect(host.$Element().querySelector('.elemenx-topology-board')).toBe(null);
	});

	it('selects a node pressed, telling it in select', async function () {
		var told = [];
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" (select)="Chosen" /></div>', {Nodes: nodes, Links: links, Chosen: function (event) {
			told.push(event);
		}});

		await tick(80);

		var iso = isoOf(host);
		var at;

		iso.Draw(performance.now());

		at = iso.ToScreen('b');

		pointer(iso.Own().Canvas, 'pointerdown', at);
		pointer(iso.Own().Canvas, 'pointerup', at);

		expect(iso.Selected().Node).toBe('b');
		expect(told[told.length - 1]).toEqual({Node: 'b', Link: null, Group: null});
	});

	it('turns: Rotate moves the nodes on the screen, a quarter at a time, and back', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" /></div>', {Nodes: nodes, Links: links});
		var i;

		await tick(80);

		var iso = isoOf(host);
		var before = iso.ToScreen('d');

		iso.Rotate(90);

		for (i = 0; i < 80; i++) iso.Draw(performance.now());

		var turned = iso.ToScreen('d');

		expect(Math.abs(turned.X - before.X) + Math.abs(turned.Y - before.Y)).toBeGreaterThan(10);

		iso.Rotate(-90);

		for (i = 0; i < 80; i++) iso.Draw(performance.now());

		expect(Math.abs(iso.ToScreen('d').X - before.X)).toBeLessThan(1);
		expect(Math.abs(iso.ToScreen('d').Y - before.Y)).toBeLessThan(1);
	});

	it('moves a node dragged by whole cells and tells it in move', async function () {
		var told = [];
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" (move)="Moved" /></div>', {Nodes: nodes, Links: links, Moved: function (event) {
			told.push(event);
		}});

		await tick(80);

		var iso = isoOf(host);
		var canvas = iso.Own().Canvas;
		var start = iso.Places().c;
		var at;

		iso.Draw(performance.now());

		at = iso.ToScreen('c');

		pointer(canvas, 'pointerdown', at);
		pointer(canvas, 'pointermove', {X: at.X + 150, Y: at.Y + 60});
		pointer(canvas, 'pointerup', {X: at.X + 150, Y: at.Y + 60});

		expect(told.length).toBe(1);
		expect(told[0].Node).toBe('c');
		expect(Number.isInteger(told[0].X) && Number.isInteger(told[0].Y)).toBe(true);
		expect(told[0].X !== start.X || told[0].Y !== start.Y).toBe(true);
		expect(iso.Places().c).toEqual({X: told[0].X, Y: told[0].Y});
	});

	it('folds a group into one node of its members, its links its own, and unfolds it; nested groups fold with the outer one', async function () {
		var told = [];
		var groups = [{ID: 'inner', Title: 'Inner', Members: ['b', 'c']}, {ID: 'outer', Title: 'Outer', Members: ['inner', 'a']}];
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [groups]="Groups" (toggle)="Toggled" /></div>', {Nodes: nodes, Links: links, Groups: groups, Toggled: function (event) {
			told.push(event);
		}});

		await tick(80);

		var iso = isoOf(host);

		expect(iso.MembersOf('outer').sort()).toEqual(['a', 'b', 'c']);
		expect(iso.Toggle('inner')).toBe(true);
		expect(told).toEqual([{Group: 'inner', Collapsed: true}]);
		expect(iso.Shown().Nodes.map(function (node) {
			return node.ID;
		}).sort()).toEqual(['a', 'd', 'group:inner']);
		expect(iso.Shown().Links.map(function (link) {
			return link.From + '>' + link.To;
		}).sort()).toEqual(['a>group:inner', 'd>a']);
		expect(iso.ToScreen('b')).toBe(null);
		expect(iso.ToScreen('group:inner')).not.toBe(null);

		iso.Toggle('outer');

		expect(iso.Shown().Nodes.map(function (node) {
			return node.ID;
		}).sort()).toEqual(['d', 'group:outer']);
		expect(iso.Shown().Nodes.filter(function (node) {
			return node.ID === 'group:outer';
		})[0].Count).toBe(3);

		iso.Toggle('outer');
		iso.Toggle('inner');

		expect(iso.Shown().Nodes.length).toBe(4);
	});

	it('changes what a node carries with Update, laid out as it was', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" /></div>', {Nodes: nodes, Links: links});

		await tick(80);

		var iso = isoOf(host);
		var places = iso.Places();

		iso.Update('b', {Load: 0.9, Status: 'error'});
		iso.Update('link:0', {Load: 1});

		var shown = iso.Shown();

		expect(shown.Nodes.filter(function (node) {
			return node.ID === 'b';
		})[0]).toMatchObject({Load: 0.9, Status: 'error'});
		expect(shown.Links.filter(function (link) {
			return link.Index === 0;
		})[0].Load).toBe(1);
		expect(iso.Places()).toEqual(places);
	});

	it('glows round the foot of an active node; an inactive one has no glow', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [grid]="false" /></div>', {Nodes: [{ID: 'x', Kind: 'server', Active: true}]});
		var iso;

		/* On a busy machine the view has its size later than a tick: wait for its picture. */
		expect(await waitFor(function () {
			iso = isoOf(host);

			return iso && painted(iso) > 0;
		}, 8000)).toBe(true);

		var lit = painted(iso);

		iso.Update('x', {Active: false});

		expect(lit).toBeGreaterThan(painted(iso) * 1.08);
	});

	it('fits what it shows once it has a size, when it was hidden at first', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" /></div>', {Nodes: nodes, Links: links}, [0, 0]);

		await tick(80);

		var place = document.getElementById('mount');

		place.style.width = '800px';
		place.style.height = '500px';

		await tick(120);

		var iso = isoOf(host);

		expect(iso.Own().Camera.Zoom).toBeGreaterThan(20);
	});

	it('draws a thousand nodes in a hundred groups in a frame of the screen or so', async function () {
		var many = [];
		var lines = [];
		var groups = [];
		var r;
		var i;

		for (r = 0; r < 100; r++) {
			var members = [];

			for (i = 0; i < 10; i++) {
				many.push({ID: r + '-' + i, Kind: i ? 'server' : 'switch', Active: true, Load: i / 10, X: (r % 10) * 6 + i % 4, Y: Math.floor(r / 10) * 6 + Math.floor(i / 4)});
				members.push(r + '-' + i);

				if (i)
					lines.push({From: r + '-0', To: r + '-' + i, Load: 0.3});
			}

			groups.push({ID: 'g' + r, Title: 'Rack ' + r, Members: members});
		}

		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [groups]="Groups" /></div>', {Nodes: many, Links: lines, Groups: groups});

		await tick(150);

		var iso = isoOf(host);
		var started;

		iso.Draw(performance.now());

		started = performance.now();

		for (i = 0; i < 5; i++) iso.Draw(performance.now());

		/* Measured: 1 s a frame before the groups were known once and what is drawn was kept; now some 15 ms. */
		expect((performance.now() - started) / 5).toBeLessThan(250);
	});
});

describe('Contract: TopologyIso, finding, ways, legend, minimap, rights and views kept', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Topology', 'TopologyIso']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('lays out a group in one piece: the zones of two groups linked across hold none of the other', async function () {
		var many = [];
		var lines = [];
		var i;

		for (i = 0; i < 6; i++) {
			many.push({ID: 'l' + i, Kind: 'server'});
			many.push({ID: 'r' + i, Kind: 'database'});
			lines.push({From: 'l' + i, To: 'r' + i});

			/* A chain going from one group to the other and back: laid out alone, its layers take turns. */
			if (i < 5)
				lines.push({From: 'r' + i, To: 'l' + (i + 1)});
		}

		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [groups]="Groups" Layout="layers" /></div>', {Nodes: many, Links: lines, Groups: [{ID: 'left', Members: ['l0', 'l1', 'l2', 'l3', 'l4', 'l5']}, {ID: 'right', Members: ['r0', 'r1', 'r2', 'r3', 'r4', 'r5']}]});

		await tick(80);

		var places = isoOf(host).Places();

		function box (prefix) {
			var found = [Infinity, Infinity, -Infinity, -Infinity];

			Object.keys(places).forEach(function (id) {
				if (id.charAt(0) === prefix)
					found = [Math.min(found[0], places[id].X), Math.min(found[1], places[id].Y), Math.max(found[2], places[id].X), Math.max(found[3], places[id].Y)];
			});

			return found;
		}

		var left = box('l');
		var right = box('r');

		expect(left[2] < right[0] || right[2] < left[0] || left[3] < right[1] || right[3] < left[1]).toBe(true);

		/* Without the groups the same chain is laid out mixed: it is the groups that keep them apart. */
		host.Groups = [];

		await tick(30);

		places = isoOf(host).Places();
		left = box('l');
		right = box('r');

		expect(left[2] < right[0] || right[2] < left[0] || left[3] < right[1] || right[3] < left[1]).toBe(false);
	});

	it('finds nodes by a text in their name, ID, kind or comment; Search lights them and dims the others; Show brings one in view', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [search]="Search" /></div>', {Nodes: nodes.concat([{ID: 'e', Label: 'Edge', Kind: 'router', Comment: 'The **uplink**'}]), Links: links, Search: ''});

		await tick(80);

		var iso = isoOf(host);

		expect(iso.Find('database')).toEqual(['b']);
		expect(iso.Find('UPLINK')).toEqual(['e']);
		expect(iso.Find('')).toEqual([]);
		expect(iso.Lit(iso.Shown())).toBe(null);

		host.Search = 'database';

		await tick(30);

		expect(Object.keys(iso.Lit(iso.Shown()).Nodes)).toEqual(['b']);

		iso.Own().Camera.X = 4000;

		expect(iso.Show('b')).toBe(true);

		var at = iso.ToScreen('b');
		var box = iso.Own().Canvas.getBoundingClientRect();

		expect(Math.abs(at.X - (box.left + box.width / 2))).toBeLessThan(40);
		expect(iso.Show('nothing')).toBe(false);
	});

	it('lights the shortest way between two nodes: Path, Shift with a press, told in path; Escape lets it go', async function () {
		var told = [];
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" (path)="Pathed" /></div>', {Nodes: nodes, Links: links, Pathed: function (event) {
			told.push(event);
		}});

		await tick(80);

		var iso = isoOf(host);
		var canvas = iso.Own().Canvas;
		var lit;

		expect(iso.Path('d', 'c')).toEqual({From: 'd', To: 'c', Nodes: ['d', 'a', 'c'], Links: [3, 1]});
		expect(told[0].Nodes).toEqual(['d', 'a', 'c']);

		lit = iso.Lit(iso.Shown());

		expect(Object.keys(lit.Nodes).sort()).toEqual(['a', 'c', 'd']);
		expect(Object.keys(lit.Links).sort()).toEqual(['1', '3']);

		/* Against the links: no way where they go, so either way. */
		expect(iso.Path('c', 'd').Nodes).toEqual(['c', 'a', 'd']);

		iso.Path();

		expect(iso.Lit(iso.Shown())).toBe(null);

		iso.Draw(performance.now());

		pointer(canvas, 'pointerdown', iso.ToScreen('b'));
		pointer(canvas, 'pointerup', iso.ToScreen('b'));
		pointer(canvas, 'pointerdown', iso.ToScreen('d'), {shiftKey: true});
		pointer(canvas, 'pointerup', iso.ToScreen('d'));

		expect(told[told.length - 1]).toMatchObject({From: 'b', To: 'd', Nodes: ['b', 'a', 'd']});
		expect(iso.Selected().Node).toBe('b');

		canvas.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

		expect(iso.Own().Path).toBe(null);
		expect(iso.Path('a', 'nowhere')).toBe(null);
		expect(told[told.length - 1]).toEqual({From: 'a', To: 'nowhere', Nodes: [], Links: []});
	});

	it('shows the kinds of its nodes in a legend; a press on one lights its nodes, again lets them be', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [legend]="true" /></div>', {Nodes: nodes.concat([{ID: 'e', Kind: 'server'}]), Links: links});

		await tick(80);

		var iso = isoOf(host);
		var items = host.$Element().querySelectorAll('.elemenx-topology-iso-legend-item');
		var server = Array.prototype.filter.call(items, function (item) {
			return item.textContent.indexOf('server') !== -1;
		})[0];

		expect(items.length).toBe(4);
		expect(server.querySelector('.elemenx-topology-iso-count').textContent).toBe('2');
		expect(server.querySelector('.elemenx-topology-iso-swatch').style.background).toMatch(/^rgb/);

		server.click();

		await tick(20);

		expect(Object.keys(iso.Lit(iso.Shown()).Nodes).sort()).toEqual(['a', 'e']);
		expect(server.classList.contains('active')).toBe(true);

		server.click();

		await tick(20);

		expect(iso.Lit(iso.Shown())).toBe(null);
	});

	it('draws a minimap with Minimap; a press on it moves the view there', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [minimap]="true" /></div>', {Nodes: nodes, Links: links});

		await tick(120);

		var iso = isoOf(host);
		var mini = host.$Element().querySelector('.elemenx-topology-iso-minimap');
		var box;
		var before;

		iso.Draw(performance.now());

		expect(mini).not.toBe(null);
		expect(mini.width).toBeGreaterThan(0);

		box = mini.getBoundingClientRect();
		before = [iso.Own().Camera.X, iso.Own().Camera.Y];

		pointer(mini, 'pointerdown', {X: box.left + 6, Y: box.top + 6});
		pointer(mini, 'pointerup', {X: box.left + 6, Y: box.top + 6});

		expect(Math.abs(iso.Own().Camera.X - before[0]) + Math.abs(iso.Own().Camera.Y - before[1])).toBeGreaterThan(5);
	});

	it('keeps all where it is when ReadOnly; EditCheck refuses what it says no to, told in denied', async function () {
		var told = [];
		var groups = [{ID: 'g', Title: 'G', Members: ['b', 'c']}];
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [groups]="Groups" [readOnly]="Locked" [editCheck]="Check" (denied)="Denied" /></div>', {Nodes: nodes, Links: links, Groups: groups, Locked: true, Check: function (action, target) {
			return !(action === 'move' && target.Node === 'a') && action !== 'toggle';
		}, Denied: function (event) {
			told.push(event);
		}});

		await tick(80);

		var iso = isoOf(host);
		var canvas = iso.Own().Canvas;

		function drag (id) {
			var at;

			iso.Draw(performance.now());

			at = iso.ToScreen(id);

			pointer(canvas, 'pointerdown', at);
			pointer(canvas, 'pointermove', {X: at.X + 120, Y: at.Y + 50});
			pointer(canvas, 'pointerup', {X: at.X + 120, Y: at.Y + 50});
		}

		var places = iso.Places();

		drag('d');

		expect(iso.Places()).toEqual(places);
		expect(told[0]).toEqual({Action: 'move', Node: 'd'});

		host.Locked = false;

		await tick(30);

		drag('a');

		expect(iso.Places().a).toEqual(places.a);
		expect(told[1]).toEqual({Action: 'move', Node: 'a'});

		drag('d');

		expect(iso.Places().d).not.toEqual(places.d);

		iso.Draw(performance.now());

		var title = iso.Own().Hits.filter(function (hit) {
			return hit.Type === 'group';
		})[0].Title;
		var at = {X: canvas.getBoundingClientRect().left + title[0] + 8, Y: canvas.getBoundingClientRect().top + title[1] - 8};

		canvas.dispatchEvent(new MouseEvent('dblclick', {clientX: at.X, clientY: at.Y, bubbles: true}));

		expect(told[told.length - 1]).toEqual({Action: 'toggle', Group: 'g'});
		expect(iso.Shown().Nodes.length).toBe(4);
	});

	it('keeps the view, the nodes dragged and the groups folded in a Snapshot, and brings them back with Restore', async function () {
		var host = mount('<div style="height: 100%"><TopologyIso [nodes]="Nodes" [links]="Links" [groups]="Groups" /></div>', {Nodes: nodes, Links: links, Groups: [{ID: 'g', Members: ['b', 'c']}]});

		await tick(80);

		var iso = isoOf(host);
		var kept;

		iso.Toggle('g');

		iso.Own().Moved.d = {X: 9, Y: 9};
		iso.Own().Camera.Zoom = 33;

		kept = iso.Snapshot();

		expect(kept).toMatchObject({Zoom: 33, Places: {d: {X: 9, Y: 9}}, Folded: {g: true}});

		iso.Toggle('g');
		iso.Arrange('grid');

		iso.Own().Camera.Zoom = 10;

		iso.Restore(kept);

		expect(iso.Own().Camera.Zoom).toBe(33);
		expect(iso.Places().d).toEqual({X: 9, Y: 9});
		expect(iso.Shown().Nodes.map(function (node) {
			return node.ID;
		})).toContain('group:g');
	});

	it('is all there through Topology in 3D: its props, its events path and denied, its methods', async function () {
		var told = [];
		var host = mount('<div style="height: 100%"><Topology #Topology View="isometric" [nodes]="Nodes" [links]="Links" Search="database" [legend]="true" (path)="Pathed" /></div>', {Nodes: nodes, Links: links, Pathed: function (event) {
			told.push(event);
		}});

		await tick(100);

		var topology = Elemenx.Instance(host.$Element().querySelector('.elemenx-topology-view'));
		var iso = isoOf(host);

		expect(Object.keys(iso.Lit(iso.Shown()).Nodes)).toEqual(['b']);
		expect(host.$Element().querySelector('.elemenx-topology-iso-legend')).not.toBe(null);
		expect(topology.Find('switch')).toEqual(['d']);
		expect(topology.Path('d', 'b').Nodes).toEqual(['d', 'a', 'b']);
		expect(told[0].Nodes).toEqual(['d', 'a', 'b']);
		expect(topology.Snapshot()).toHaveProperty('Zoom');
		expect(topology.Show('a')).toBe(true);
	});
});

describe('Contract: TopologyKinds, the kinds of the nodes in 3D and their shapes', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['TopologyKinds', 'TopologyIso']);
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('knows the kinds and shapes built in; an unknown kind is drawn as a server', function () {
		var kinds = Elemenx.Service('TopologyKinds');

		expect(kinds.Shapes()).toEqual(expect.arrayContaining(['cube', 'cylinder', 'hex', 'stack', 'pyramid', 'sphere', 'cloud']));
		expect(kinds.Kinds()).toEqual(expect.arrayContaining(['server', 'database', 'switch', 'router', 'firewall', 'storage', 'cloud', 'user']));
		expect(kinds.Kind('database')).toMatchObject({Shape: 'cylinder', Load: 'fill', Active: 'glow'});
		expect(kinds.Kind('no-such-kind')).toMatchObject({Name: 'no-such-kind', Shape: 'cube'});
		expect(function () {
			kinds.Define('', {});
		}).toThrow('TopologyKinds.Define expects (kind, settings)');
		expect(function () {
			kinds.Shape('bad', {});
		}).toThrow('TopologyKinds.Shape expects (name, {Draw})');
	});

	it('draws a kind defined with a shape of its own, and its load by a function', async function () {
		var kinds = Elemenx.Service('TopologyKinds');
		var drawn = [];
		var loads = [];
		var shape = unique('tower');
		var kind = unique('antenna');

		kinds.Shape(shape, {Draw: function (context) {
			drawn.push(context.Size);

			context.Prism([[context.Center[0] - 0.2, context.Center[1] - 0.2], [context.Center[0] + 0.2, context.Center[1] - 0.2], [context.Center[0] + 0.2, context.Center[1] + 0.2], [context.Center[0] - 0.2, context.Center[1] + 0.2]], 0, context.Height * 2, context.Color, context.Alpha);
		}});
		kinds.Define(kind, {Shape: shape, Size: 1.5, Color: '#ff0000', Load: 'none'});
		kinds.Define(kind + '-load', {Shape: shape, Load: function (context, node) {
			loads.push(node.Load);
		}});

		var host = Elemenx.Component(unique('IsoKinds'), {$Template: '<div style="height: 100%"><TopologyIso [nodes]="Nodes" /></div>', Nodes: [{ID: 'k', Kind: kind}, {ID: 'l', Kind: kind + '-load', Load: 0.7}]})();

		document.getElementById('mount').style.height = '400px';

		document.getElementById('mount').appendChild(host.$Element());

		owned.push(host);

		await tick(80);

		Elemenx.Instance(host.$Element().querySelector('.elemenx-topology-iso')).Draw(performance.now());

		expect(drawn).toContain(1.5);
		expect(loads).toContain(0.7);
		expect(kinds.Shapes()).toContain(shape);
	});
});
