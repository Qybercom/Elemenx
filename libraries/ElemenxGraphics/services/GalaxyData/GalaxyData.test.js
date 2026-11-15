import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var galaxies;

function open (source) {
	return new Promise(function (resolve, reject) {
		galaxies.Open(source, function (error, made) {
			if (error) reject(error);
			else resolve(made);
		});
	});
}

describe('Contract: GalaxyData, a galaxy as data: its black hole, its stars sector by sector, its systems, its edits', function () {
	beforeAll(async function () {
		await loadElemenx();

		Use(['service:GalaxyData', 'service:SystemData', 'service:PlanetData', 'service:Archive', 'service:Astronomy', 'service:Noise', 'service:Random']);

		galaxies = Elemenx.Service('GalaxyData');
	}, 60000);

	it('makes a galaxy of a seed and of a kind, with its supermassive black hole at its centre', function () {
		var spiral = galaxies.Make({Seed: 'milky'});
		var again = galaxies.Make({Seed: 'milky'});

		expect(spiral).toEqual(again);
		expect(spiral.Manifest.Format).toBe('elemenx-galaxy');
		expect(spiral.Manifest.Kind).toBe('spiral');
		expect(spiral.Manifest.Arms).toBeGreaterThanOrEqual(2);
		expect(spiral.Manifest.Centre.Mass).toBeGreaterThan(1e6);
		expect(galaxies.Kinds()).toEqual(['spiral', 'barred', 'lenticular', 'elliptical', 'irregular', 'dwarf', 'ring']);
		expect(galaxies.Make({Seed: 'x', Kind: 'dwarf'}).Manifest.Radius).toBeLessThan(6000);
	});

	it('is as dense as a real galaxy: about 0.004 stars a cubic light-year where the Sun is, more in its core, few above it', function () {
		var data = galaxies.Make({Seed: 'milky', Radius: 50000, Kind: 'lenticular'});
		var sun = galaxies.Density(data, [27000, 0, 0]);

		expect(sun).toBeGreaterThan(0.002);
		expect(sun).toBeLessThan(0.008);
		expect(galaxies.Density(data, [100, 0, 0])).toBeGreaterThan(sun * 50);
		expect(galaxies.Density(data, [27000, 5000, 0])).toBeLessThan(sun * 0.01);

		galaxies.Kinds().forEach(function (kind) {
			var made = galaxies.Make({Seed: 'k', Kind: kind});

			expect(galaxies.Density(made, [made.Manifest.Radius * 0.1, 0, 0])).toBeGreaterThan(0);
		});
	});

	it('makes the stars of a sector the same each time, as many as its density, the first ones the same however many are asked for', function () {
		var data = galaxies.Make({Seed: 'milky', Radius: 50000});
		var sector = galaxies.Sector(data, 270, 0, 0);
		var few = galaxies.Sector(data, 270, 0, 0, 10);
		var star = sector.Stars[3];
		var dwarfs = sector.Stars.filter(function (one) {
			return one.Mass < 0.5;
		});

		expect(sector.Count).toBeGreaterThan(300);
		expect(sector.Stars.length).toBe(sector.Count);
		expect(few.Count).toBe(sector.Count);
		expect(few.Stars).toEqual(sector.Stars.slice(0, 10));
		/* Most stars are small red dwarfs. */
		expect(dwarfs.length / sector.Count).toBeGreaterThan(0.5);
		expect(star.Place[0]).toBeGreaterThanOrEqual(27000);
		expect(star.Place[0]).toBeLessThan(27100);
		expect(galaxies.Star(data, star.ID)).toEqual(star);

		/* Regression: a star of a sector below 0 ('3.-1.-2-0') was not found of its ID, and its system was not of its star. */
		star = galaxies.Sector(data, 270, -1, -2, 1).Stars[0];

		expect(star.ID).toBe('270.-1.-2-0');
		expect(galaxies.Star(data, star.ID)).toEqual(star);
		expect(galaxies.Star(data, 'nothing')).toBe(null);
	});

	it('turns its stars round its centre on a flat curve: a star far out turns more slowly', function () {
		var data = galaxies.Make({Seed: 'milky'});
		var near = galaxies.Position(data, [5000, 0, 0], 10);
		var far = galaxies.Position(data, [25000, 0, 0], 10);

		expect(Math.hypot(near[0], near[2])).toBeCloseTo(5000, 3);
		expect(Math.abs(Math.atan2(near[2], near[0]))).toBeGreaterThan(Math.abs(Math.atan2(far[2], far[0])) * 4);
		expect(galaxies.Position(data, [100, 5, 0], 0)).toEqual([100, 5, 0]);
	});

	it('glows of points of its kind, and gives the system of a star of its seed with the mass of the star', function () {
		var data = galaxies.Make({Seed: 'milky'});
		var glow = galaxies.Glow(data, 2000);
		var star = galaxies.Sector(data, 270, 0, 0, 5).Stars[0];
		var system = galaxies.System(data, star.ID);
		var objects = Elemenx.Service('SystemData').Objects(system, 'g');
		var cosmos = galaxies.Cosmos(data, star.ID);

		expect(glow.Positions.length).toBe(6000);
		expect(glow.Colors.length).toBe(8000);
		/* As the pictures of real galaxies: knots of young stars along its arms, its disc and its middle told for the light drawn along rays. */
		expect(glow.Knots.Positions.length).toBeGreaterThan(0);
		expect(glow.Bulge.Radius).toBeGreaterThan(1000);
		expect(glow.Bulge.Bright).toBe(1);
		expect(glow.Disc.Arms).toBe(data.Manifest.Arms);
		expect(galaxies.Glow(galaxies.Make({Seed: 'e', Kind: 'elliptical'}), 500).Disc.Bright).toBe(0);
		expect(objects[0].Traits.Star.Mass).toBeCloseTo(star.Mass, 2);
		expect(galaxies.System(data, star.ID)).toBe(system);
		expect(cosmos.Kind).toBe('galaxy');
		expect(Math.hypot.apply(Math, cosmos.Pole)).toBeCloseTo(1, 5);
	});

	it('Astronomy.Generate takes the mass of its star (a star of a galaxy), the rest of the system still of its seed', function () {
		var astronomy = Elemenx.Service('Astronomy');
		var made = astronomy.Generate('told', {Mass: 0.3});
		var free = astronomy.Generate('told');

		expect(made.Bodies[0].Mass).toBe(0.3);
		expect(made.Bodies[0].Temperature).toBe(Math.round(astronomy.Star({Mass: 0.3}).Temperature));
		expect(made.Bodies[0].Name).toBe(free.Bodies[0].Name);
		expect(free.Bodies[0].Mass).not.toBe(0.3);
	});

	it('keeps its edits, a written system and a free body, saved as a file and opened again', async function () {
		var data = galaxies.Make({Seed: 'milky'});
		var stars = galaxies.Sector(data, 270, 0, 0, 3).Stars;
		var written = Elemenx.Service('SystemData').Make({Objects: [{ID: 'sun', Kind: 'star', Values: {Name: 'Home'}, Traits: {Star: {Mass: 1}}}]}, {ID: stars[2].ID});
		var opened;

		galaxies.Rename(data, stars[0].ID, 'Polaris');
		galaxies.Remove(data, stars[1].ID);
		galaxies.AddBody(data, {ID: 'rogue', Kind: 'planet', Name: 'Rogue', Place: [1000, 0, 2000], Velocity: [0.1, 0, 0]});
		galaxies.SetSystem(data, stars[2].ID, written);

		expect(galaxies.Sector(data, 270, 0, 0, 3).Stars.map(function (one) {
			return one.Name;
		})).toEqual(['Polaris', stars[2].Name]);

		opened = await open(galaxies.Save(data));

		expect(opened.Manifest).toEqual(data.Manifest);
		expect(opened.Edits).toEqual(data.Edits);
		expect(Elemenx.Service('SystemData').Objects(galaxies.System(opened, stars[2].ID), 'x')[0].Values.Name).toBe('Home');
	});

	it('takes a star put in by hand among the stars of its sector, with a system of its mass, and moves a body of no system along its velocity', function () {
		var data = galaxies.Make({Seed: 'milky'});
		var star;
		var bodies;

		galaxies.AddBody(data, {ID: 'vega', Kind: 'star', Name: 'Vega', Mass: 2.1, Place: [27050, 20, 30]});
		galaxies.AddBody(data, {ID: 'rogue', Kind: 'planet', Name: 'Rogue', Place: [1000, 0, 2000], Velocity: [10, 0, -5]});

		star = galaxies.Star(data, 'vega');

		expect(star).toMatchObject({ID: 'vega', Name: 'Vega', Mass: 2.1, Added: true});
		expect(galaxies.Sector(data, 270, 0, 0, 0).Stars.map(function (one) {
			return one.ID;
		})).toEqual(['vega']);
		expect(Elemenx.Service('SystemData').Objects(galaxies.System(data, 'vega'), 'v')[0].Traits.Star.Mass).toBeCloseTo(2.1, 3);

		bodies = galaxies.Added(data, 10);

		expect(bodies.filter(function (one) {
			return one.ID === 'rogue';
		})[0].Place).toEqual([1100, 0, 1950]);
		expect(bodies.filter(function (one) {
			return one.ID === 'vega';
		})[0].Place).toEqual(galaxies.Position(data, [27050, 20, 30], 10));

		galaxies.Remove(data, 'vega');

		expect(galaxies.Star(data, 'vega')).toBe(null);
		expect(galaxies.Added(data, 0).length).toBe(1);
	});

	it('gives its black hole as a body with a system of its own: the hole and its disc, the young stars close round it on long thin orbits', function () {
		var data = galaxies.Make({Seed: 'milky', Radius: 50000});
		var hole = galaxies.Star(data, 'centre');
		var system = galaxies.System(data, 'centre');
		var objects = Elemenx.Service('SystemData').Objects(system, 'hole-test');
		var stars = objects.filter(function (one) {
			return one.Kind === 'star';
		});

		expect(hole).toMatchObject({ID: 'centre', Kind: 'blackhole', Place: [0, 0, 0], Luminosity: 0});
		expect(hole.Mass).toBe(data.Manifest.Centre.Mass);
		expect(objects[0]).toMatchObject({ID: 'hole', Kind: 'blackhole'});
		expect(objects[0].Traits.BlackHole.Mass).toBe(hole.Mass);
		expect(stars.length).toBeGreaterThan(10);

		stars.forEach(function (star) {
			expect(star.Parent).toBe('hole');
			expect(star.Traits.Orbit.Distance).toBeGreaterThan(100);
			expect(star.Traits.Orbit.Distance).toBeLessThan(7000);
		});

		/* The same of the same seed. */
		expect(galaxies.System(galaxies.Make({Seed: 'milky', Radius: 50000}), 'centre').Objects.length).toBe(system.Objects.length);
	});
});
