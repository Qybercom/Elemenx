import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, 'Meshes.js'), 'utf8');

/* The Meshes Service, as the Library defines it. */
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

describe('Regression: Meshes with large lists', function () {
	/* Merge passed all the positions of a part to push at once: a model of hundreds of thousands of them overflowed the stack. */
	it('merges the geometries of a model as large as a building of glass without running out of the stack', function () {
		var meshes = create();
		var big = meshes.Geometry();
		var made;
		var i;

		for (i = 0; i < 600000; i++) {
			big.Positions.push(i % 7);
			big.Normals.push(0);
		}

		for (i = 0; i < 400000; i++)
			big.UVs.push(0);

		made = meshes.Merge([{Geometry: big}, {Geometry: big}]);

		expect(made.Positions.length).toBe(1200000);
		expect(made.Positions[600006]).toBe(6);
	});
});
