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
});
