import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

function nodes (ids) {
	return ids.map(function (id) {
		return {ID: id};
	});
}

function links (pairs) {
	return pairs.map(function (pair) {
		return {From: pair[0], To: pair[1]};
	});
}

function at (result, id) {
	return result.Items.filter(function (item) {
		return item.ID === id;
	})[0];
}

function middle (item) {
	return [item.X + item.Width / 2, item.Y + item.Height / 2];
}

/* Whether a point is on the edge of a node. */
function onEdge (item, point) {
	var inside = point[0] >= item.X - 0.01 && point[0] <= item.X + item.Width + 0.01 && point[1] >= item.Y - 0.01 && point[1] <= item.Y + item.Height + 0.01;
	var side = Math.min(Math.abs(point[0] - item.X), Math.abs(point[0] - item.X - item.Width), Math.abs(point[1] - item.Y), Math.abs(point[1] - item.Y - item.Height));

	return inside && side < 0.02;
}

/* How many pairs of nodes lie on each other. */
function overlaps (result) {
	var count = 0;

	result.Items.forEach(function (a, index) {
		result.Items.slice(index + 1).forEach(function (b) {
			if (a.X < b.X + b.Width && b.X < a.X + a.Width && a.Y < b.Y + b.Height && b.Y < a.Y + a.Height)
				count++;
		});
	});

	return count;
}

describe('Contract: Layouts.Graph, the places of the nodes of a graph and the lines of its links', function () {
	var layouts;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Layouts']);

		layouts = Elemenx.Service('Layouts');
	});

	it('lays what depends on what in layers, each after all it comes from, going right or down, the links from edge to edge', function () {
		var graph = links([['app', 'ui'], ['app', 'net'], ['ui', 'core'], ['net', 'core'], ['core', 'log'], ['store', 'log'], ['app', 'ghost']]);
		var right = layouts.Graph(nodes(['app', 'ui', 'core', 'net', 'store', 'log']), graph);
		var down = layouts.Graph(nodes(['app', 'ui', 'core', 'net', 'store', 'log']), graph, {Direction: 'down', Gap: 20});
		var line = right.Links.filter(function (link) {
			return link.From === 'app' && link.To === 'ui';
		})[0];

		expect(right.Layout).toBe('layers');
		expect(right.Items.map(function (item) {
			return item.ID + ':' + item.Layer;
		})).toEqual(['app:0', 'ui:1', 'core:2', 'net:1', 'store:0', 'log:3']);
		expect(right.Links.length).toBe(6);
		expect(overlaps(right)).toBe(0);

		/* Each layer to the right of the one before it; down, under it. */
		right.Links.forEach(function (link) {
			expect(at(right, link.To).X).toBeGreaterThan(at(right, link.From).X + at(right, link.From).Width);
			expect(at(down, link.To).Y).toBeGreaterThan(at(down, link.From).Y + at(down, link.From).Height);
		});

		/* A line leaves the edge of one and comes to the edge of the other, on the way between their middles. */
		expect(onEdge(at(right, 'app'), line.Points[0])).toBe(true);
		expect(onEdge(at(right, 'ui'), line.Points[1])).toBe(true);
		expect(Math.abs((line.Points[1][1] - line.Points[0][1]) * (middle(at(right, 'ui'))[0] - middle(at(right, 'app'))[0]) - (line.Points[1][0] - line.Points[0][0]) * (middle(at(right, 'ui'))[1] - middle(at(right, 'app'))[1]))).toBeLessThan(1);
		expect(Math.min.apply(null, right.Items.map(function (item) {
			return item.X;
		}))).toBe(0);
		expect(right.Width).toBe(Math.max.apply(null, right.Items.map(function (item) {
			return item.X + item.Width;
		})));

		/* A cycle is broken where it closes again: still layers, one after the other. */
		expect(layouts.Graph(nodes(['a', 'b', 'c', 'd']), links([['a', 'b'], ['b', 'c'], ['c', 'a'], ['c', 'd']]), {Layout: 'layers'}).Items.map(function (item) {
			return item.Layer;
		})).toEqual([0, 1, 2, 3]);
	});

	it('puts a crossing right: a node in a layer by the middle of its neighbours', function () {
		var result = layouts.Graph(nodes(['a', 'b', 'x', 'y']), links([['a', 'y'], ['b', 'x']]), {Layout: 'layers'});

		/* The links do not cross: each pair on one row. */
		expect(at(result, 'y').Y).toBe(at(result, 'a').Y);
		expect(at(result, 'x').Y).toBe(at(result, 'b').Y);
	});

	it('lays a star round its center in rings by how many links away, each near the one it hangs on, and the unreached outside', function () {
		var result = layouts.Graph(nodes(['hub', 'a', 'b', 'c', 'd', 'a1', 'a2', 'lone']), links([['hub', 'a'], ['hub', 'b'], ['hub', 'c'], ['hub', 'd'], ['a', 'a1'], ['a', 'a2']]), {Directed: false});
		var center = middle(at(result, 'hub'));

		function distance (id) {
			var spot = middle(at(result, id));

			return Math.hypot(spot[0] - center[0], spot[1] - center[1]);
		}

		function angle (id) {
			var spot = middle(at(result, id));

			return Math.atan2(spot[1] - center[1], spot[0] - center[0]);
		}

		expect(result.Layout).toBe('star');
		expect(result.Items.map(function (item) {
			return item.ID + ':' + item.Ring;
		})).toEqual(['hub:0', 'a:1', 'b:1', 'c:1', 'd:1', 'a1:2', 'a2:2', 'lone:3']);
		expect(distance('a')).toBeCloseTo(distance('d'), 1);
		expect(distance('a1')).toBeGreaterThan(distance('a') + 60);
		expect(distance('lone')).toBeGreaterThan(distance('a1') + 60);

		/* The children of a on its side of the star. */
		[angle('a1'), angle('a2')].forEach(function (one) {
			expect(Math.abs(Math.atan2(Math.sin(one - angle('a')), Math.cos(one - angle('a'))))).toBeLessThan(0.6);
		});
		expect(overlaps(result)).toBe(0);

		/* Its Center told; with directed links that have no cycle, auto lays it in layers. */
		expect(middle(at(layouts.Graph(nodes(['hub', 'a', 'b', 'c']), links([['hub', 'a'], ['hub', 'b'], ['hub', 'c']]), {Layout: 'star', Center: 'b'}), 'b'))).toEqual(middle(at(layouts.Graph(nodes(['hub', 'a', 'b', 'c']), links([['hub', 'a'], ['hub', 'b'], ['hub', 'c']]), {Layout: 'star', Center: 'b'}), 'b')));
		expect(layouts.Graph(nodes(['hub', 'a', 'b', 'c']), links([['hub', 'a'], ['hub', 'b'], ['hub', 'c']]), {Layout: 'star', Center: 'b'}).Items[2].Ring).toBe(0);
		expect(layouts.Graph(nodes(['hub', 'a', 'b', 'c']), links([['hub', 'a'], ['hub', 'b'], ['hub', 'c']])).Layout).toBe('layers');
	});

	it('lays a tree from its root, each parent over the middle of its children, a wide parent pushing its subtree on', function () {
		var result = layouts.Graph([{ID: 'root'}, {ID: 'x'}, {ID: 'y', Width: 400}, {ID: 'x1'}, {ID: 'x2'}, {ID: 'y1'}], links([['root', 'x'], ['root', 'y'], ['x', 'x1'], ['x', 'x2'], ['y', 'y1']]), {Layout: 'tree', Direction: 'down', Gap: 20});
		var x = middle(at(result, 'x'));

		expect(result.Items.map(function (item) {
			return item.ID + ':' + item.Layer;
		})).toEqual(['root:0', 'x:1', 'y:1', 'x1:2', 'x2:2', 'y1:2']);
		expect(x[0]).toBeCloseTo((middle(at(result, 'x1'))[0] + middle(at(result, 'x2'))[0]) / 2, 6);
		expect(middle(at(result, 'y'))[0]).toBeCloseTo(middle(at(result, 'y1'))[0], 6);
		expect(middle(at(result, 'root'))[0]).toBeCloseTo((x[0] + middle(at(result, 'y'))[0]) / 2, 6);
		expect(at(result, 'x1').Y).toBeGreaterThan(at(result, 'x').Y + at(result, 'x').Height);
		expect(overlaps(result)).toBe(0);
		expect(layouts.Graph(nodes(['r', 'a', 'b', 'c', 'd']), links([['r', 'a'], ['a', 'b'], ['b', 'c'], ['c', 'd']]), {Directed: false}).Layout).toBe('tree');
	});

	it('lays a circle, a grid and by force with no node on another, force the same for the same Seed', function () {
		var ring = links([['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'g'], ['g', 'h'], ['h', 'a'], ['a', 'e']]);
		var eight = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		var circle = layouts.Graph(nodes(['a', 'b', 'c', 'd', 'e', 'f']), [], {Layout: 'circle'});
		var grid = layouts.Graph(nodes(['a', 'b', 'c', 'd', 'e']), [], {Layout: 'grid', Gap: 10});
		var force = layouts.Graph(nodes(eight), ring, {Layout: 'force', Seed: 's'});
		var center = [circle.Width / 2, circle.Height / 2];
		var radius = Math.hypot(middle(circle.Items[0])[0] - center[0], middle(circle.Items[0])[1] - center[1]);

		circle.Items.forEach(function (item) {
			expect(Math.hypot(middle(item)[0] - center[0], middle(item)[1] - center[1])).toBeCloseTo(radius, 0);
		});

		expect(grid.Items.map(function (item) {
			return item.X + ',' + item.Y;
		})).toEqual(['0,0', '130,0', '260,0', '0,50', '130,50']);
		expect(layouts.Graph(nodes([]), []).Items).toEqual([]);
		expect(layouts.Graph(nodes(['a', 'b', 'c']), []).Layout).toBe('grid');
		expect(layouts.Graph(nodes(eight), ring, {Directed: false}).Layout).toBe('force');

		[circle, grid, force].forEach(function (result) {
			expect(overlaps(result)).toBe(0);
		});

		/* Wide nodes all linked to each other and no gap: the springs pull them on each other, and they are put apart. */
		var wide = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(function (id) {
			return {ID: id, Width: 320, Height: 40};
		});
		var all = [];

		wide.forEach(function (a, index) {
			wide.slice(index + 1).forEach(function (b) {
				all.push({From: a.ID, To: b.ID});
			});
		});

		expect(overlaps(layouts.Graph(wide, all, {Layout: 'force', Gap: 0}))).toBe(0);

		/* Linked nodes nearer than the ones that are not. */
		expect(Math.hypot(middle(at(force, 'a'))[0] - middle(at(force, 'b'))[0], middle(at(force, 'a'))[1] - middle(at(force, 'b'))[1])).toBeLessThan(Math.hypot(middle(at(force, 'b'))[0] - middle(at(force, 'e'))[0], middle(at(force, 'b'))[1] - middle(at(force, 'e'))[1]));
		expect(layouts.Graph(nodes(eight), ring, {Layout: 'force', Seed: 's'})).toEqual(force);
	});
});
