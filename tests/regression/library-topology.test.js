import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadElemenx, resetDOM, unique, waitFor } from '../setup.js';
import { Use } from '../library.js';

var owned = [];

function network () {
	return {
		Nodes: [
			{ID: 'router', Label: 'Router', Icon: 'server', Status: 'ok', Details: {Address: '10.0.0.1'}},
			{ID: 'a', Label: 'Laptop', Status: 'warning'},
			{ID: 'b', Label: 'Phone'},
			{ID: 'c', Label: 'Camera', Status: 'error', Kind: 'device'},
			{ID: 'd', Label: 'Printer', Status: 'off'}
		],
		Links: [{From: 'router', To: 'nowhere'}, {From: 'router', To: 'a', Label: 'wifi'}, {From: 'router', To: 'b'}, {From: 'router', To: 'c', Status: 'error'}, {From: 'router', To: 'd'}]
	};
}

async function mount (state) {
	var told = [];
	var host = Elemenx.Component(unique('TopologyHost'), Object.assign({
		$Template: '<div style="width: 800px; height: 500px"><Topology #Graph [nodes]="Nodes" [links]="Links" [layout]="Layout" [directed]="Directed" (select)="Chosen" (open)="Opened" /></div>',
		Layout: 'auto',
		Directed: false,
		Chosen: function (event) {
			told.push(['select', event]);
		},
		Opened: function (event) {
			told.push(['open', event]);
		}
	}, network(), state || {}))();
	var graph;

	owned.push(host);

	document.getElementById('mount').appendChild(host.$Element());

	await waitFor(function () {
		graph = host.$Ref('Graph', true);

		return graph && host.$Element().querySelectorAll('.elemenx-topology-node').length === host.Nodes.length;
	}, 4000);

	await waitFor(function () {
		return graph.Own().Fitted && host.$Element().querySelector('.elemenx-board').getBoundingClientRect().width > 0;
	}, 2000);

	return {Host: host, Graph: graph, Told: told, Element: host.$Element()};
}

function node (mounted, id) {
	return mounted.Element.querySelector('[data-node="' + id + '"]');
}

function center (element) {
	var box = element.getBoundingClientRect();

	return [box.left + box.width / 2, box.top + box.height / 2];
}

function press (target, point) {
	target.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true, clientX: point[0], clientY: point[1], pointerId: 1, button: 0}));
	target.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, cancelable: true, clientX: point[0], clientY: point[1], pointerId: 1, button: 0}));
}

describe('Contract: Topology, a graph shown as blocks, laid out by itself', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['Topology']);
	});

	beforeEach(function () {
		resetDOM();
	});

	afterEach(function () {
		while (owned.length) owned.pop().$Destroy();
	});

	it('draws each node as a block of its name, status, kind and details where its layout puts it, its links between their edges, and fits it all in the view', async function () {
		var mounted = await mount();
		var places = mounted.Graph.Places();
		var view = mounted.Element.querySelector('.elemenx-board').getBoundingClientRect();
		var router = node(mounted, 'router');
		var paths = mounted.Element.querySelectorAll('.elemenx-topology-link');

		expect(router.textContent).toContain('Router');
		expect(router.textContent).toContain('10.0.0.1');
		expect(router.querySelector('use').getAttribute('href')).toContain('server');
		expect(node(mounted, 'c').className).toContain('status-error');
		expect(node(mounted, 'c').className).toContain('kind-device');

		/* A star round the router: the others at one distance from it. */
		expect(mounted.Graph.Own().Used).toBe('star');
		['a', 'b', 'c', 'd'].forEach(function (id) {
			expect(Math.hypot(places[id].X + places[id].Width / 2 - places.router.X - places.router.Width / 2, places[id].Y + places[id].Height / 2 - places.router.Y - places.router.Height / 2)).toBeCloseTo(Math.hypot(places.a.X + places.a.Width / 2 - places.router.X - places.router.Width / 2, places.a.Y + places.a.Height / 2 - places.router.Y - places.router.Height / 2), 0);
			expect(places[id].Width).toBe(node(mounted, id).offsetWidth);
		});

		/* The link to no node is left out; one of a status has it; the cables of a network have no arrows. */
		expect(paths.length).toBe(4);
		expect(paths[2].getAttribute('class')).toContain('status-error');
		expect(Array.prototype.map.call(paths, function (path) {
			return path.getAttribute('data-link');
		})).toEqual(['0', '1', '2', '3']);
		expect(paths[0].getAttribute('marker-end')).toBe(null);
		expect(mounted.Element.querySelector('.elemenx-topology-label').textContent).toBe('wifi');

		var whole = {Left: Infinity, Top: Infinity, Right: -Infinity, Bottom: -Infinity};

		Array.prototype.forEach.call(mounted.Element.querySelectorAll('.elemenx-topology-node'), function (block) {
			var box = block.getBoundingClientRect();

			expect(box.left).toBeGreaterThanOrEqual(view.left - 1);
			expect(box.right).toBeLessThanOrEqual(view.right + 1);
			expect(box.top).toBeGreaterThanOrEqual(view.top - 1);
			expect(box.bottom).toBeLessThanOrEqual(view.bottom + 1);

			whole = {Left: Math.min(whole.Left, box.left), Top: Math.min(whole.Top, box.top), Right: Math.max(whole.Right, box.right), Bottom: Math.max(whole.Bottom, box.bottom)};
		});

		/* In the middle of the view, the graph and not the corner of its canvas. */
		expect(Math.abs((whole.Left + whole.Right) / 2 - (view.left + view.right) / 2)).toBeLessThan(12);
		expect(Math.abs((whole.Top + whole.Bottom) / 2 - (view.top + view.bottom) / 2)).toBeLessThan(12);
	});

	it('selects a node by a press and lights it with its neighbours, a link with its ends, lets go on nothing; opens a node by a double press and Enter', async function () {
		var mounted = await mount({Links: [{From: 'router', To: 'a'}, {From: 'a', To: 'b'}, {From: 'c', To: 'd'}]});
		var far;

		press(node(mounted, 'a'), center(node(mounted, 'a')));

		expect(mounted.Told[mounted.Told.length - 1]).toEqual(['select', {Node: 'a', Link: null}]);
		expect(node(mounted, 'a').className).toContain('selected');

		far = Array.prototype.filter.call(mounted.Element.querySelectorAll('.elemenx-topology-node'), function (block) {
			return block.classList.contains('far');
		}).map(function (block) {
			return block.getAttribute('data-node');
		});

		expect(far.sort()).toEqual(['c', 'd']);
		expect(mounted.Element.querySelectorAll('.elemenx-topology-link.far').length).toBe(1);

		/* A link: it and its two ends. */
		press(mounted.Element.querySelector('[data-link="2"]'), center(node(mounted, 'c')));

		expect(mounted.Graph.Selected()).toEqual({Node: null, Link: 2});
		expect(node(mounted, 'router').classList.contains('far')).toBe(true);
		expect(node(mounted, 'c').classList.contains('far')).toBe(false);

		press(mounted.Element.querySelector('.elemenx-topology-canvas'), [0, 0]);

		expect(mounted.Graph.Selected()).toEqual({Node: null, Link: null});
		expect(mounted.Element.querySelectorAll('.far').length).toBe(0);

		node(mounted, 'b').dispatchEvent(new MouseEvent('dblclick', {bubbles: true}));

		mounted.Graph.Select('d');

		node(mounted, 'd').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

		expect(mounted.Told.filter(function (one) {
			return one[0] === 'open';
		})).toEqual([['open', {Node: 'b'}], ['open', {Node: 'd'}]]);
	});

	it('goes from node to node by the arrows, keeps a node where it is dragged by its head, and lays out again when the graph or its layout changes', async function () {
		var mounted = await mount({Layout: 'grid', Nodes: network().Nodes.slice(0, 4), Links: []});
		var places = mounted.Graph.Places();
		var head = node(mounted, 'router').querySelector('.elemenx-topology-head');
		var from = center(head);
		var zoom = mounted.Element.querySelector('.elemenx-board-world') ? mounted.Graph.$Ref('Board', true).Zoom : 1;

		/* A grid of two by two: router a / b c. */
		mounted.Graph.Select('router');

		node(mounted, 'router').dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft', bubbles: true}));

		/* Nothing that way: it stays. */
		expect(mounted.Graph.Selected().Node).toBe('router');

		node(mounted, 'router').dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));

		expect(mounted.Graph.Selected().Node).toBe('a');

		node(mounted, 'a').dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));

		expect(mounted.Graph.Selected().Node).toBe('c');

		node(mounted, 'c').dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

		expect(mounted.Graph.Selected().Node).toBe(null);

		/* Dragged by its head: as far in the world as the pointer went over the zoom. */
		head.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, clientX: from[0], clientY: from[1], pointerId: 2, button: 0}));
		node(mounted, 'router').dispatchEvent(new PointerEvent('pointermove', {bubbles: true, clientX: from[0] + 50, clientY: from[1] + 20, pointerId: 2}));
		node(mounted, 'router').dispatchEvent(new PointerEvent('pointerup', {bubbles: true, clientX: from[0] + 50, clientY: from[1] + 20, pointerId: 2}));

		expect(mounted.Graph.Places().router.X).toBeCloseTo(places.router.X + 50 / zoom, 0);
		expect(mounted.Graph.Places().router.Y).toBeCloseTo(places.router.Y + 20 / zoom, 0);
		expect(node(mounted, 'router').style.left).toBe(mounted.Graph.Places().router.X + 'px');

		/* Arranged again by its own layout: where it was dragged it stays; by another layout: the drag let go. */
		mounted.Graph.Arrange();

		expect(mounted.Graph.Places().router.X).toBeCloseTo(places.router.X + 50 / zoom, 0);

		expect(mounted.Graph.Arrange('circle')).toBe('circle');
		expect(mounted.Graph.Places().router.X).not.toBeCloseTo(places.router.X + 50 / zoom, 0);

		mounted.Host.Links = [{From: 'router', To: 'a'}, {From: 'a', To: 'b'}];
		mounted.Host.Layout = 'auto';
		mounted.Host.Directed = true;

		await waitFor(function () {
			return mounted.Graph.Own().Used === 'layers';
		}, 2000);

		expect(mounted.Element.querySelectorAll('.elemenx-topology-link').length).toBe(2);
		expect(mounted.Element.querySelector('.elemenx-topology-link').getAttribute('marker-end')).toContain('url(#elemenx-topology-arrow-');
		expect(mounted.Element.querySelector('.elemenx-topology-link').getAttribute('d')).toContain(' C');
		expect(mounted.Graph.Places().a.X).toBeGreaterThan(mounted.Graph.Places().router.X + mounted.Graph.Places().router.Width);
	});
});
