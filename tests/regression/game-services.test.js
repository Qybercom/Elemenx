import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';

describe('Contract: the Services of games (Random, Spatial, Pathfinding, Visibility, GameLoop)', function () {
	var random;
	var spatial;
	var paths;
	var sight;
	var loops;

	beforeAll(async function () {
		await loadElemenx();
		await import('../../libraries/ElemenxUI/services/Random.js');
		await import('../../libraries/ElemenxUI/services/Suprematist.js');
		await import('../../libraries/ElemenxUI/services/Spatial.js');
		await import('../../libraries/ElemenxUI/services/Pathfinding.js');
		await import('../../libraries/ElemenxUI/services/Visibility.js');
		await import('../../libraries/ElemenxUI/services/GameLoop.js');

		random = Elemenx.Service('Random');
		spatial = Elemenx.Service('Spatial');
		paths = Elemenx.Service('Pathfinding');
		sight = Elemenx.Service('Visibility');
		loops = Elemenx.Service('GameLoop');
	});

	it('Random: the same numbers for the same seed, its helpers in their bounds, a fork of its own, a smooth noise', function () {
		var one = random.Create('map-7');
		var two = random.Create('map-7');
		var first = [one.Next(), one.Next(), one.Next()];
		var ints = [];
		var i;
		var noise = random.Noise('ground', 8);

		expect([two.Next(), two.Next(), two.Next()]).toEqual(first);
		expect(random.Create('map-8').Next()).not.toBe(first[0]);
		expect(first.every(function (value) {
			return value >= 0 && value < 1;
		})).toBe(true);

		/* The generator of Suprematist is this one: its pictures stay the same. */
		expect(Elemenx.Service('Suprematist').Random('map-7')()).toBe(first[0]);

		for (i = 0; i < 400; i++) {
			ints.push(one.Int(1, 6));
		}

		expect(Math.min.apply(null, ints)).toBe(1);
		expect(Math.max.apply(null, ints)).toBe(6);
		expect(one.Shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
		expect(random.Create('s').Shuffle(['a', 'b', 'c', 'd'])).toEqual(random.Create('s').Shuffle(['a', 'b', 'c', 'd']));
		expect(one.Pick([])).toBe(undefined);
		expect(one.Weighted([{ID: 'never', Weight: 0}, {ID: 'always', Weight: 3}]).ID).toBe('always');
		expect(one.Weighted([], 'Weight')).toBe(undefined);
		expect(random.Create('w').Fork('trees').Next()).toBe(random.Create('w').Fork('trees').Next());
		expect(random.Create('w').Fork('trees').Next()).not.toBe(random.Create('w').Fork('rocks').Next());
		expect(random.Hash('abc')).toBe(random.Hash('abc'));

		/* Noise: 0 to 1, near values near each other. */
		for (i = 0; i < 50; i++) {
			expect(noise(i * 1.3, i * 0.7)).toBeGreaterThanOrEqual(0);
			expect(noise(i * 1.3, i * 0.7)).toBeLessThanOrEqual(1);
			expect(Math.abs(noise(i, 3) - noise(i + 0.1, 3))).toBeLessThan(0.08);
		}
	});

	it('Spatial: the things in a rectangle, within a radius the nearest first, the nearest one, as they move and go', function () {
		var index = spatial.Create({Cell: 32});

		index.Set('worker', 10, 10);
		index.Set('soldier', 50, 12);
		index.Set('tower', 200, 200, 64, 64);
		index.Set('tree', 400, 20);

		expect(index.Count()).toBe(4);
		expect(index.Rect(0, 0, 60, 60).sort()).toEqual(['soldier', 'worker']);
		expect(index.Rect(60, 60, -60, -60).sort()).toEqual(['soldier', 'worker']);
		expect(index.Rect(250, 250, 10, 10)).toEqual(['tower']);
		expect(index.Radius(0, 0, 60)).toEqual(['worker', 'soldier']);
		expect(index.Radius(190, 190, 20)).toEqual(['tower']);
		expect(index.Nearest(390, 30).ID).toBe('tree');
		expect(index.Nearest(0, 0, 5)).toBe(null);
		expect(index.Nearest(0, 0, null, function (id) {
			return id !== 'worker';
		}).ID).toBe('soldier');
		expect(spatial.Distance(230, 230, index.Get('tower'))).toBe(0);

		/* Moved far, and gone. */
		index.Set('worker', 380, 30);

		expect(index.Rect(0, 0, 60, 60)).toEqual(['soldier']);
		expect(index.Nearest(390, 30).ID).toBe('worker');
		expect(index.Get('worker')).toEqual({ID: 'worker', X: 380, Y: 30, Width: 0, Height: 0});
		expect(index.Remove('worker')).toBe(true);
		expect(index.Remove('worker')).toBe(false);
		expect(index.Has('worker')).toBe(false);
		expect(index.Nearest(390, 30).ID).toBe('tree');

		index.Clear();

		expect([index.Count(), index.Nearest(0, 0)]).toEqual([0, null]);
	});

	it('Pathfinding: a way round the walls, no corner cut, around costly cells, to the nearest reachable cell, on a graph of its own', function () {
		var grid = paths.Grid([
			'.....',
			'.###.',
			'...#.',
			'.#...'
		]);
		var way = paths.Path(grid, {X: 0, Y: 0}, {X: 2, Y: 2});
		var marsh = paths.Grid(['.9.', '...'], {});
		var corner = paths.Grid(['.#', '#.']);
		var walled = paths.Grid(['..#.', '..#.']);
		var graph;

		expect([grid.Width, grid.Height, grid.Passable(1, 1), grid.Get(-1, 0), grid.Get(0, 0)]).toEqual([5, 4, false, Infinity, 1]);
		expect(way[0]).toEqual({X: 0, Y: 0});
		expect(way[way.length - 1]).toEqual({X: 2, Y: 2});
		expect(way.every(function (cell) {
			return grid.Passable(cell.X, cell.Y);
		})).toBe(true);
		expect(way.length).toBe(5);

		/* Eight ways across an open field, four ways: steps one cell long only. */
		expect(paths.Path(paths.Grid(5, 5), {X: 0, Y: 0}, {X: 4, Y: 4}).length).toBe(5);
		expect(paths.Path(paths.Grid(5, 5), {X: 0, Y: 0}, {X: 4, Y: 4}, {Diagonal: false}).length).toBe(9);

		/* A diagonal between two walls is no way; with Corners only past one of them. */
		expect(paths.Path(corner, {X: 0, Y: 0}, {X: 1, Y: 1})).toBe(null);
		expect(paths.Path(paths.Grid(['..', '#.']), {X: 0, Y: 0}, {X: 1, Y: 1}).length).toBe(3);
		expect(paths.Path(paths.Grid(['..', '#.']), {X: 0, Y: 0}, {X: 1, Y: 1}, {Corners: true}).length).toBe(2);

		/* A costly cell is gone round. */
		expect(paths.Path(marsh, {X: 0, Y: 0}, {X: 2, Y: 0}, {Diagonal: false}).map(function (cell) {
			return cell.Y;
		})).toEqual([0, 1, 1, 1, 0]);

		/* Behind a wall: none, or as near as it gets. */
		expect(paths.Path(walled, {X: 0, Y: 0}, {X: 3, Y: 0})).toBe(null);
		expect(paths.Path(walled, {X: 0, Y: 0}, {X: 3, Y: 0}, {Nearest: true}).pop()).toEqual({X: 1, Y: 0});
		expect(paths.Path(walled, {X: 2, Y: 0}, {X: 0, Y: 0})).toBe(null);

		/* The costs to the nearest target, and a flow field that leads there. */
		var distances = paths.Distances(grid, [{X: 4, Y: 3}], {Diagonal: false});
		var flow = paths.Flow(grid, [{X: 4, Y: 3}]);
		var at = {X: 0, Y: 0};
		var steps = 0;

		expect(distances[3 * 5 + 4]).toBe(0);
		expect(distances[2 * 5 + 4]).toBe(1);
		expect(distances[1 * 5 + 1]).toBe(Infinity);

		while (at && steps < 20) {
			at = flow.Next(at.X, at.Y) || null;

			if (at && at.X === 4 && at.Y === 3) break;

			steps++;
		}

		expect(at).toEqual({X: 4, Y: 3});
		expect(flow.Next(4, 3)).toBe(null);
		expect(flow.Direction(3, 3)).toEqual({X: 1, Y: 0});

		/* A graph of its own: the cheapest way, not the shortest. */
		graph = {A: [{Node: 'B', Cost: 1}, {Node: 'C', Cost: 5}], B: [{Node: 'C', Cost: 1}], C: []};

		expect(paths.Search({Start: 'A', Goal: 'C', Neighbors: function (node) {
			return graph[node];
		}})).toEqual({Path: ['A', 'B', 'C'], Cost: 2});
		expect(paths.Search({Start: 'C', Goal: 'A', Neighbors: function (node) {
			return graph[node];
		}})).toBe(null);

		/* A smooth path: its corners only. */
		expect(paths.Smooth(paths.Grid(['.....']), [{X: 0, Y: 0}, {X: 1, Y: 0}, {X: 2, Y: 0}, {X: 3, Y: 0}])).toEqual([{X: 0, Y: 0}, {X: 3, Y: 0}]);
		expect(paths.Smooth(grid, way).length).toBeLessThanOrEqual(way.length);
	});

	it('Visibility: a line, the sight past a wall, the field of view and its shadows, the fog of war', function () {
		var grid = paths.Grid([
			'.......',
			'.......',
			'...#...',
			'.......',
			'.......'
		]);
		var field = sight.Field(grid, 1, 2, 10);
		var fog = sight.Fog(7, 5);

		expect(sight.Line(0, 0, 3, 1)).toEqual([{X: 0, Y: 0}, {X: 1, Y: 0}, {X: 2, Y: 1}, {X: 3, Y: 1}]);
		expect(sight.Line(2, 2, 2, 2)).toEqual([{X: 2, Y: 2}]);
		expect(sight.Sight(grid, 1, 2, 5, 2)).toBe(false);
		expect(sight.Sight(grid, 1, 0, 5, 0)).toBe(true);
		expect(sight.Sight(function () {
			return true;
		}, 0, 0, 1, 0)).toBe(true);

		/* The wall is seen, the cells right behind it are not; the open ones are. */
		expect(field.Has(1, 2)).toBe(true);
		expect(field.Has(3, 2)).toBe(true);
		expect(field.Has(4, 2)).toBe(false);
		expect(field.Has(5, 2)).toBe(false);
		expect(field.Has(5, 0)).toBe(true);
		expect(field.Has(1, 4)).toBe(true);
		expect(field.Count).toBe(field.Cells.length);

		/* A radius: no farther. */
		expect(sight.Field(grid, 0, 0, 2).Has(3, 0)).toBe(false);
		expect(sight.Field(grid, 0, 0, 2).Has(2, 0)).toBe(true);

		/* The fog: seen now, explored after, unknown elsewhere. */
		fog.Reveal(grid, 0, 0, 1);

		expect([fog.Get(0, 0), fog.Seen(1, 0), fog.Explored(5, 4), fog.Get(-1, 0)]).toEqual([2, true, false, 0]);

		fog.Hide();
		fog.Reveal(grid, 6, 4, 1);

		expect([fog.Get(0, 0), fog.Explored(0, 0), fog.Seen(0, 0), fog.Get(6, 4)]).toEqual([1, true, false, 2]);

		fog.Reset();

		expect(fog.Get(6, 4)).toBe(0);
	});

	it('GameLoop: steps of the same time whatever the frames, a part of a step to draw between, its speed, pause and catch-up limit', function () {
		var updates = 0;
		var alphas = [];
		var queued = [];
		var loop = loops.Create({
			Step: 10,
			Update: function (step) {
				expect(step).toBe(10);

				updates++;
			},
			Render: function (alpha) {
				alphas.push(alpha);
			},
			Window: {
				requestAnimationFrame: function (callback) {
					queued.push(callback);

					return queued.length;
				},
				cancelAnimationFrame: function () {
					queued = [];
				}
			}
		});

		expect(loop.Advance(25)).toBe(2);
		expect([updates, loop.Time, loop.Ticks, alphas.pop()]).toEqual([2, 20, 2, 0.5]);
		expect(loop.Advance(5)).toBe(1);
		expect(alphas.pop()).toBe(0);

		/* Twice as fast: twice the steps. */
		loop.Speed = 2;

		expect(loop.Advance(20)).toBe(4);

		/* A long pause of the tab: no more than MaxSteps, the rest dropped. */
		loop.Speed = 1;

		expect(loop.Advance(10000)).toBe(5);
		expect(loop.Advance(0)).toBe(0);

		/* Paused: no steps, still drawn. */
		loop.Pause();

		expect([loop.Advance(100), loop.Paused, alphas.length]).toEqual([0, true, 4]);

		loop.Resume();

		/* Its frames: the first one starts the clock, the next ones run the steps. */
		loop.Start();

		expect(loop.Running).toBe(true);

		queued.shift()(1000);
		queued.shift()(1030);

		expect(loop.Ticks).toBe(15);

		loop.Stop();

		expect([loop.Running, queued.length]).toEqual([false, 0]);
	});
});
