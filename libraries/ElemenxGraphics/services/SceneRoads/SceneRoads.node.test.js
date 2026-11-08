import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, 'SceneRoads.js'), 'utf8');

/* The SceneRoads Service, as the Library defines it. */
function create () {
	var definition;

	vm.runInNewContext(source, {
		Elemenx: {
			Service: function (name, value) {
				definition = value;
			}
		}
	});

	return Object.assign({}, definition);
}

describe('Regression: SceneRoads with large lists', function () {
	/* Merged passed all the numbers of a piece to push at once: the pieces of a long road overflowed the stack. */
	it('merges the pieces of a long road without running out of the stack, the indices of each after the ones before', function () {
		var roads = create();
		var big = {Positions: [], Normals: [], UVs: [], Indices: []};
		var made;
		var i;

		for (i = 0; i < 300000; i++) {
			big.Positions.push(i % 5);
			big.Normals.push(0);
			big.UVs.push(0);
			big.Indices.push(i % 3);
		}

		made = roads.Merged([big, big]);

		expect(made.Positions.length).toBe(600000);
		expect(made.Indices[300001]).toBe(1 + 100000);
	});
	/* A road was on another as far as it was across it, however far past its end: two in a line far apart met at a junction. */
	it('makes no junction of two roads in a line apart, nor of a road whose end lies only on the way of another, past its end', function () {
		var roads = create();

		roads.$OnCreate();
		roads.Library();

		var network = roads.Network([
			{ID: 'a', Type: 'road', Points: [[0, 0], [0, 100]]},
			{ID: 'b', Type: 'road', Points: [[0, 200], [0, 300]]},
			{ID: 'c', Type: 'road', Points: [[-50, 150], [50, 150]]}
		], [{ID: 'cross', X: 0, Z: 250}]);

		expect(network.Junctions.map(function (junction) {
			return [junction.ID, junction.Roads];
		})).toEqual([['cross', ['b']]]);
		expect(roads.Near(network.Roads[0], 0, 160).Far).toBeCloseTo(60, 0);
		expect(Math.abs(roads.Near(network.Roads[0], 0, 160).Offset)).toBeLessThan(1);
	});

	/* What the tunnels of roads cut out of the ground: a bore for each 12 metres of width, its floor just under the road, a crust of earth kept. */
	it('cuts a bore of the ground for each 12 metres of the width of a tunnel, from before it to after it, its floor under the road', function () {
		var roads = create();
		var points = [];
		var x;
		var road;
		var carves;

		for (x = 0; x <= 200; x += 5)
			points.push({X: x, Y: 10, Z: 0, Along: x, Way: [1, 0]});

		road = {ID: 'tube', Width: 24, Height: 0, Points: points, Spans: [{Kind: 'tunnel', From: 50, To: 150}, {Kind: 'bridge', From: 160, To: 190}]};
		carves = roads.Carves([road]);

		expect(carves.length).toBe(2);
		expect(carves[0]).toMatchObject({Type: 'tunnel', Road: 'tube', Flat: 0.8, Crust: 1});
		expect(carves[0].Radius).toBeCloseTo(7.2, 6);
		/* On both sides of the middle, a quarter of the width out. */
		expect(carves[0].Points[0][1]).toBeCloseTo(6, 6);
		expect(carves[1].Points[0][1]).toBeCloseTo(-6, 6);
		/* From a radius before its start to a radius after its end. */
		expect(carves[0].Points[0][0]).toBeCloseTo(50 - 7.2, 6);
		expect(carves[0].Points[carves[0].Points.length - 1][0]).toBeCloseTo(150 + 7.2, 6);
		/* Its floor (0.52 of the radius under the axis) 0.2 under the road. */
		expect(carves[0].Points[0][2] - 0.52 * carves[0].Radius).toBeCloseTo(9.8, 6);
		/* A road of a lane: one bore, at least 5 metres round. */
		expect(roads.Carves([Object.assign({}, road, {Width: 6})]).length).toBe(1);
		expect(roads.Carves([Object.assign({}, road, {Width: 6})])[0].Radius).toBe(5);
	});
});
