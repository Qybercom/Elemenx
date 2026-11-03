import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';

function square (x0, z0, x1, z1) {
	return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}

function inside (polygon, x, z) {
	var within = false;
	var a;
	var b;

	for (a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
		if (polygon[a][1] > z !== polygon[b][1] > z && x < (polygon[b][0] - polygon[a][0]) * (z - polygon[a][1]) / (polygon[b][1] - polygon[a][1]) + polygon[a][0])
			within = !within;
	}

	return within;
}

function distance (line, x, z) {
	var best = Infinity;
	var a;

	for (a = 0; a + 1 < line.length; a++) {
		var dx = line[a + 1][0] - line[a][0];
		var dz = line[a + 1][1] - line[a][1];
		var t = Math.max(0, Math.min(1, ((x - line[a][0]) * dx + (z - line[a][1]) * dz) / (dx * dx + dz * dz || 1)));

		best = Math.min(best, Math.hypot(line[a][0] + dx * t - x, line[a][1] + dz * t - z));
	}

	return best;
}

/* The four corners of a lot, turned as it stands: its front, the side of +z of its model, to its street. */
function corners (lot) {
	var c = Math.cos(lot.Turn);
	var s = Math.sin(lot.Turn);

	return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (corner) {
		var x = corner[0] * lot.Width / 2;
		var z = corner[1] * lot.Depth / 2;

		return [lot.X + c * x + s * z, lot.Z + c * z - s * x];
	});
}

describe('Contract: the plan of a settlement of a sketch: its streets, its lots along them, its walls, gates and towers', function () {
	var terrain;

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:Terrain']);

		terrain = Elemenx.Service('Terrain');
	});

	function plan (item, others) {
		return terrain.SettlementPlan(Object.assign({ID: 'place'}, item), others || [], function (name) {
			return terrain.SettlementSizes[name] || null;
		});
	}

	it('lays a city on a grid along its longest side, none of its streets on its edge, its lots wholly inside, off the streets and each other, facing their street', function () {
		var outline = square(0, -120, 160, 30);
		var city = plan({Kind: 'city', Points: outline});
		var lines = city.Streets.map(function (street) {
			return street.Points;
		});

		expect(city.Streets.length).toBeGreaterThan(4);
		expect(city.Streets.every(function (street) {
			var a = street.Points[0];
			var b = street.Points[street.Points.length - 1];
			var middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

			return (Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6) && inside(outline, middle[0], middle[1]) && distance(outline.concat([outline[0]]), middle[0], middle[1]) > street.Width;
		})).toBe(true);

		expect(city.Lots.length).toBeGreaterThan(15);

		city.Lots.forEach(function (lot) {
			expect(corners(lot).every(function (corner) {
				return inside(outline, corner[0], corner[1]);
			})).toBe(true);
			expect(city.Streets.every(function (street) {
				return distance(street.Points, lot.X, lot.Z) > street.Width / 2 + Math.min(lot.Width, lot.Depth) / 2;
			})).toBe(true);
			expect(city.Lots.every(function (other) {
				return other === lot || Math.hypot(other.X - lot.X, other.Z - lot.Z) > (Math.max(other.Width, other.Depth) + Math.max(lot.Width, lot.Depth)) * 0.42;
			})).toBe(true);

			/* Its front looks at the street nearest it. */
			var front = [lot.X + Math.sin(lot.Turn) * lot.Depth, lot.Z + Math.cos(lot.Turn) * lot.Depth];

			expect(Math.min.apply(null, lines.map(function (line) {
				return distance(line, front[0], front[1]);
			}))).toBeLessThan(Math.min.apply(null, lines.map(function (line) {
				return distance(line, lot.X, lot.Z);
			})));
		});

		/* Towers and business centres in its core only (the third of its reach, where their lot begins), the buildings of a city round it. */
		var reach = Math.hypot(80, 75);
		var core = city.Lots.filter(function (lot) {
			return terrain.SettlementKinds.city.Core[lot.Class];
		});

		expect(core.length).toBeGreaterThan(0);
		expect(core.every(function (lot) {
			return Math.hypot(lot.X - 80, lot.Z + 45) < reach * 0.35 + Math.hypot(lot.Width, lot.Depth) + 6;
		})).toBe(true);
		expect(city.Lots.filter(function (lot) {
			return Math.hypot(lot.X - 80, lot.Z + 45) > reach * 0.7;
		}).every(function (lot) {
			return terrain.SettlementKinds.city.Classes[lot.Class];
		})).toBe(true);
		/* A step of 39 metres would lay streets 2 metres off its edges: none of those. */
		expect(plan({Kind: 'city', Points: outline, Block: 39}).Streets.every(function (street) {
			return street.Points.every(function (point) {
				return point[0] > 10 && point[0] < 150 || Math.abs(street.Points[0][0] - street.Points[1][0]) > 1e-6;
			});
		})).toBe(true);
		expect(city.Walls).toEqual([]);
		expect(city.Gates).toEqual([]);
	});

	it('gives a village a main street with lanes off it, takes the streets drawn in it instead, builds none on a square and those of a district in it', function () {
		var outline = square(-120, -100, -30, -20);
		var village = plan({Kind: 'village', Points: outline});
		var main = village.Streets[0];

		expect(main.Points[0][1]).toBeCloseTo(main.Points[1][1], 6);
		expect(village.Streets.length).toBeGreaterThan(2);
		expect(village.Streets.slice(1).every(function (lane) {
			return Math.abs(lane.Points[0][0] - lane.Points[1][0]) < 1e-6 && lane.Width < main.Width;
		})).toBe(true);
		expect(village.Lots.length).toBeGreaterThan(8);
		expect(village.Lots.every(function (lot) {
			return Object.keys(terrain.SettlementKinds.village.Classes).indexOf(lot.Class) >= 0;
		})).toBe(true);

		/* The same seed the same plan; another another. */
		expect(plan({Kind: 'village', Points: outline})).toEqual(village);
		expect(plan({Kind: 'village', Points: outline, Seed: 'other'}).Lots).not.toEqual(village.Lots);

		/* Its own streets, a square and a district of villas. */
		var drawn = [
			{ID: 's1', Type: 'street', Points: [[-110, -85], [-40, -85]], Width: 8},
			{ID: 's2', Type: 'street', Points: [[-110, -40], [-40, -40]]},
			{ID: 'q', Type: 'square', Points: square(-70, -55, -40, -25)},
			{ID: 'd', Type: 'district', Kind: 'noble', Points: square(-120, -100, -30, -62)}
		];
		var made = plan({Kind: 'village', Points: outline}, drawn);

		expect(made.Streets).toEqual([{Points: drawn[0].Points, Width: 8}, {Points: drawn[1].Points, Width: terrain.SettlementKinds.village.Street}]);
		expect(made.Lots.some(function (lot) {
			return inside(drawn[2].Points, lot.X, lot.Z);
		})).toBe(false);

		/* The class of a lot is of the place its street passes it: villas along the street in the district, the village along the other. */
		var villas = made.Lots.filter(function (lot) {
			return lot.Z < -62;
		});
		var others = made.Lots.filter(function (lot) {
			return lot.Z > -62;
		});

		expect(villas.length).toBeGreaterThan(1);
		expect(villas.every(function (lot) {
			return lot.District === 'noble' && lot.Class === 'villa';
		})).toBe(true);
		expect(others.length).toBeGreaterThan(2);
		expect(others.every(function (lot) {
			return lot.District === '' && terrain.SettlementKinds.village.Classes[lot.Class];
		})).toBe(true);
		expect(plan({Kind: 'village', Points: outline, Density: 0}).Lots).toEqual([]);
	});

	it('walls a fort round, a tower at each corner, a gate on the wall where each street goes out, the way through it along the street', function () {
		var outline = square(-100, 60, -20, 140);
		var fort = plan({Kind: 'fort', Points: outline});
		var ring = outline.concat([outline[0]]);

		expect(fort.Walls).toEqual([ring]);
		expect(fort.Towers).toEqual(outline.map(function (point) {
			return {X: point[0], Z: point[1]};
		}));
		expect(fort.Gates.length).toBe(fort.Streets.length * 2);

		fort.Gates.forEach(function (gate) {
			var street = fort.Streets.filter(function (one) {
				return distance(one.Points, gate.X, gate.Z) < 6;
			})[0];
			var a = street.Points[0];
			var b = street.Points[street.Points.length - 1];

			expect(distance(ring, gate.X, gate.Z)).toBeLessThan(1e-6);
			expect(Math.abs(Math.sin(gate.Turn - Math.atan2(b[0] - a[0], b[1] - a[1])))).toBeLessThan(1e-6);
		});

		expect(plan({Kind: 'village', Points: outline, Walls: true}).Walls).toEqual([ring]);
		expect(plan({Kind: 'city', Points: [[0, 0], [10, 0]]}).Streets).toEqual([]);
	});
});
