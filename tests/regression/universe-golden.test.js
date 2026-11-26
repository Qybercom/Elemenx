import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../setup.js';
import { Use } from '../library.js';
import goldenSource from './universe-golden.js?raw';
import golden from '../../docs/universe-golden.json';

/*
 * The golden numbers of the universe (docs/UNIVERSE-FORMAT.md): what a browser makes of the seeds is what Node made of
 * them (scripts/universe-golden.js wrote docs/universe-golden.json), to the last bit. Regression: the stars of a galaxy were
 * made by the Math of the browser (pow of their masses, log and cos of the places of its nebulae, of the orbits of their
 * planets), whose last digit differs from one engine to another and from PHP and C++: a seed made other stars elsewhere.
 */
describe('Regression: the universe is made of its seeds the same everywhere (the golden numbers)', function () {
	var made;

	beforeAll(async function () {
		var module = {exports: null};

		await loadElemenx();

		Use(['service:UniverseData', 'service:GalaxyData', 'service:SystemData', 'service:PlanetData', 'service:Archive', 'service:Astronomy', 'service:Noise', 'service:Random']);

		new Function('module', goldenSource)(module);

		made = module.exports(Elemenx);
	}, 60000);

	it('gives the own Math, the sequences and the hashes of seeds as the golden numbers', function () {
		expect(made.Math).toEqual(golden.Math);
		expect(made.Sequences).toEqual(golden.Sequences);
		expect(made.Hashes).toEqual(golden.Hashes);
	});

	it('makes the galaxies (passports, stars of sectors, nebulae, systems) and the star systems as the golden numbers', function () {
		made.Galaxies.forEach(function (galaxy, index) {
			expect(galaxy.Manifest).toEqual(golden.Galaxies[index].Manifest);
			expect(galaxy.Sectors).toEqual(golden.Galaxies[index].Sectors);
			expect(galaxy.Objects).toEqual(golden.Galaxies[index].Objects);
			expect(galaxy.System).toEqual(golden.Galaxies[index].System);
			expect(galaxy.Hole).toBe(golden.Galaxies[index].Hole);
		});

		expect(made.Galaxies.length).toBe(golden.Galaxies.length);
		expect(made.Systems).toEqual(golden.Systems);
	});

	it('makes the galaxies of the cubes of a universe, those near a place and its home as the golden numbers', function () {
		expect(made.Universes).toEqual(golden.Universes);
		expect(golden.Universes[0].Home).toBe('home');
	});
});
