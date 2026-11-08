import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

var source = fs.readFileSync(path.join(import.meta.dirname, 'ScenePipes.js'), 'utf8');

/* The ScenePipes Service, as the Library defines it. */
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

function flat () {
	return 5;
}

describe('Contract: ScenePipes, pipes of any size as geometry and as what is in them', function () {
	it('lays a pipe out as it is laid, its corners rounded and its frames never twisted', function () {
		var pipes = create();
		var above = pipes.Lay({ID: 'a', Points: [[0, 0], [10, 0], [10, 10]], Radius: 0.5, Lift: 2}, flat);
		var ground = pipes.Lay({ID: 'b', Points: [[0, 0], [10, 0]], Radius: 0.5, Laid: 'ground'}, flat);
		var buried = pipes.Lay({ID: 'c', Points: [[0, 0], [10, 0, 1]], Radius: 0.5, Laid: 'buried', Depth: 1}, flat);
		var last = above.Points[above.Points.length - 1];

		/* Its axis: over the ground by its lift and radius, on it by its radius, under it by its depth and radius; a height given kept. */
		expect(above.Points[0].Y).toBeCloseTo(7.5, 6);
		expect(ground.Points[0].Y).toBeCloseTo(5.5, 6);
		expect(buried.Points[0].Y).toBeCloseTo(3.5, 6);
		expect(buried.Points[buried.Points.length - 1].Y).toBe(1);

		/* The corner rounded: more points than three, and shorter than its two straights. */
		expect(above.Points.length).toBeGreaterThan(3);
		expect(last.Along).toBeLessThan(20);
		expect(last.Along).toBeGreaterThan(18);

		above.Points.forEach(function (point) {
			expect(Math.abs(point.Normal[0] * point.Tangent[0] + point.Normal[1] * point.Tangent[1] + point.Normal[2] * point.Tangent[2])).toBeLessThan(1e-6);
		});

		expect(above).toMatchObject({Laid: 'above', Ends: ['open', 'open'], Wall: 0.05, Flanges: 6});
		expect(pipes.Lay({Points: [[0, 0], [1, 0]], Radius: 0.01}, flat).Flanges).toBe(0);
	});

	it('holds a fluid of a known type, as full and as fast as told, water by default and none when none is told', function () {
		var pipes = create();

		expect(Object.keys(pipes.Fluids())).toEqual(expect.arrayContaining(['water', 'sewage', 'mud', 'oil', 'fuel', 'gas', 'steam', 'air']));
		expect(pipes.Fluids().gas.Kind).toBe('gas');
		expect(pipes.Fluids().oil).toMatchObject({Kind: 'liquid', Burns: true});
		expect(pipes.Fluid({Type: 'oil', Fill: 0.3, Flow: -2, Pressure: 3})).toEqual({Type: 'oil', Fill: 0.3, Flow: -2, Pressure: 3});
		expect(pipes.Fluid({Type: 'lava'}).Type).toBe('water');
		expect(pipes.Fluid(null).Fill).toBe(0);
	});

	it('makes its model: outside and inside, the rims of its ends, flanges, supports and the face of the liquid in it', function () {
		var pipes = create();
		var half = pipes.Lay({ID: 'a', Points: [[0, 0], [20, 0]], Radius: 0.5, Lift: 2, Fluid: {Type: 'water', Fill: 0.5}}, flat);
		var names = pipes.Asset([half], {Height: flat}).Materials.map(function (material) {
			return material.Name.split('-')[0];
		});
		var full = pipes.Asset([pipes.Lay({ID: 'b', Points: [[0, 0], [20, 0]], Radius: 0.5, Laid: 'ground', Fluid: {Type: 'water', Fill: 1}}, flat)], {Height: flat});
		var gas = pipes.Asset([pipes.Lay({ID: 'c', Points: [[0, 0], [20, 0]], Radius: 0.5, Laid: 'ground', Fluid: {Type: 'gas', Fill: 0.5}}, flat)], {Height: flat});

		expect(names).toEqual(['pipe', 'inside', 'support', 'fluid']);
		/* Full, or of gas: no face of a liquid; on the ground, no supports. */
		expect(full.Materials.map(function (material) {
			return material.Name.split('-')[0];
		})).toEqual(['pipe', 'inside']);
		expect(gas.Materials.length).toBe(2);
	});

	it('cuts the ground for all of a buried pipe a man may go in, and only at the open ends of a smaller one', function () {
		var pipes = create();
		var sewer = pipes.Lay({ID: 's', Points: [[0, 0], [30, 0]], Radius: 1.1, Laid: 'buried'}, flat);
		var drain = pipes.Lay({ID: 'd', Points: [[0, 0], [30, 0]], Radius: 0.1, Laid: 'buried', Ends: ['open', 'closed']}, flat);
		var above = pipes.Lay({ID: 'a', Points: [[0, 0], [30, 0]], Radius: 1.1}, flat);
		var carves = pipes.Carves([sewer, drain, above]);

		expect(carves.length).toBe(2);
		expect(carves[0]).toMatchObject({Type: 'tunnel', Pipe: 's', Flat: 0});
		expect(carves[0].Radius).toBeCloseTo(1.13, 6);
		expect(carves[0].Points.length).toBe(sewer.Points.length);
		expect(carves[1].Pipe).toBe('d');
		expect(carves[1].Points.length).toBe(2);
	});

	it('finds the nearest point of its axis, and its point at metres along it', function () {
		var pipes = create();
		var pipe = pipes.Lay({ID: 'a', Points: [[0, 0], [10, 0]], Radius: 0.5, Laid: 'ground'}, flat);
		var near = pipes.Near(pipe, [4, 6.5, 1]);

		expect(near.Along).toBeCloseTo(4, 6);
		expect(near.Distance).toBeCloseTo(Math.sqrt(2), 6);
		expect(pipes.At(pipe, 7).X).toBeCloseTo(7, 6);
	});

	it('stands what is in a pipe on its bottom and what is on it on its top, and keeps a body out of its wall but at its open ends', function () {
		var pipes = create();
		var pipe = pipes.Lay({ID: 'a', Points: [[-10, 0], [10, 0]], Radius: 1.2, Wall: 0.1, Lift: 1}, flat);
		var axis = pipe.Points[0].Y;

		/* In it: its bottom, 1.1 under its axis; on it: its top; under it, off it: none. */
		expect(pipes.Floor([pipe], 0, 0, axis - 1.1)).toBeCloseTo(axis - 1.1, 6);
		expect(pipes.Floor([pipe], 0, 0, axis + 1.2)).toBeCloseTo(axis + 1.2, 6);
		expect(pipes.Floor([pipe], 0, 0, 5)).toBe(-Infinity);
		expect(pipes.Floor([pipe], 0, 5, 5)).toBe(-Infinity);
		/* Past its end: nothing. */
		expect(pipes.Floor([pipe], 12, 0, axis - 1.1)).toBe(-Infinity);

		/* Walking at its side into it: blocked; in it, and past its end: free. */
		expect(pipes.Blocks([pipe], 0, 1.2, axis - 1.1, 0.3)).toBe(true);
		expect(pipes.Blocks([pipe], 0, 0, axis - 1.1, 0.3)).toBe(false);
		expect(pipes.Blocks([pipe], 11, 0, 5, 0.3)).toBe(false);
		expect(pipes.Near(pipe, [12, axis, 0]).End).toBe(true);
	});

	it('tells where what flows comes out of an open end and how much, where a hole of its wall is wet, and how fast a hole spurts', function () {
		var pipes = create();
		var pipe = pipes.Lay({ID: 'a', Points: [[0, 0], [10, 0]], Radius: 0.5, Wall: 0.05, Lift: 2, Fluid: {Type: 'water', Fill: 0.5, Flow: 2, Pressure: 1}, Leaks: [{Along: 4, Angle: 150, Size: 0.02}]}, flat);
		var mouth = pipes.Mouth(pipe);
		var back = pipes.Mouth(pipes.Lay({ID: 'b', Points: [[0, 0], [10, 0]], Radius: 0.5, Lift: 2, Ends: ['closed', 'open'], Fluid: {Type: 'water', Fill: 0.5, Flow: -2}}, flat));

		/* Out of its end along its Flow, in the half its water fills, as much as its speed, its bore and its fill. */
		expect(mouth.At[0]).toBeCloseTo(10, 6);
		expect(mouth.At[1]).toBeLessThan(pipe.Points[0].Y);
		expect(mouth.Way).toEqual([1, 0, 0]);
		expect(mouth.Rate).toBeCloseTo(2 * Math.PI * 0.45 * 0.45 * 0.5, 6);
		/* Flowing back, toward a closed end: nothing comes out. */
		expect(back).toBe(null);
		expect(pipes.Mouth(pipes.Lay({ID: 'c', Points: [[0, 0], [10, 0]], Radius: 0.5, Fluid: {Type: 'water', Fill: 0.5}}, flat))).toBe(null);

		/* A hole under its level is wet, one over it is not; of a gas, any is. */
		expect(pipe.Leaks).toEqual([{Along: 4, Angle: 150, Size: 0.02}]);
		expect(pipes.Hole(pipe, 4, 150).Wet).toBe(true);
		expect(pipes.Hole(pipe, 4, 0).Wet).toBe(false);
		expect(pipes.Hole(pipe, 4, 0).Normal[1]).toBeCloseTo(1, 6);
		expect(pipes.Hole(pipes.Lay({ID: 'g', Points: [[0, 0], [10, 0]], Radius: 0.1, Fluid: {Type: 'gas', Pressure: 3}}, flat), 4, 0).Wet).toBe(true);

		/* A spurt as fast as its pressure drives water (1 bar: about 14 m/s), never past 20; a gas barely. */
		expect(pipes.Spurt(pipe, 0.02).Speed).toBeCloseTo(Math.sqrt(2e5 / 1000), 3);
		expect(pipes.Spurt(pipes.Lay({ID: 'h', Points: [[0, 0], [1, 0]], Fluid: {Type: 'water', Pressure: 50}}, flat), 0.02).Speed).toBe(20);
	});
});
