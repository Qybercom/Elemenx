import { beforeAll, describe, expect, it } from 'vitest';
import { loadElemenx } from '../../../../tests/setup.js';
import { Use } from '../../../../tests/library.js';

var universes;

function open (source) {
	return new Promise(function (resolve, reject) {
		universes.Open(source, function (error, made) {
			if (error) reject(error);
			else resolve(made);
		});
	});
}

describe('Contract: UniverseData, a universe as data: galaxies of its seed cube by cube, those of its author, its home', function () {
	var author = {ID: 'milky-way', Name: 'Milky Way', Seed: 'milky', Kind: 'barred', Coordinates: [123.4, -5, 60]};

	beforeAll(async function () {
		await loadElemenx();

		Use(['service:UniverseData', 'service:GalaxyData', 'service:SystemData', 'service:PlanetData', 'service:Archive', 'service:Astronomy', 'service:Noise', 'service:Random']);

		universes = Elemenx.Service('UniverseData');
	}, 60000);

	it('makes the galaxies of a cube of its seed, the same each time, as many as a real universe has, anywhere however far', function () {
		var data = universes.Make({Seed: 'cosmos'});
		var cube = universes.Cube(data, 0, 0, 0);
		var again = universes.Cube(universes.Make({Seed: 'cosmos'}), 0, 0, 0);
		var far = universes.Cube(data, 400000, -250000, 99999);
		var other = universes.Cube(universes.Make({Seed: 'other'}), 0, 0, 0);
		var kinds = {};
		var count = 0;
		var x;
		var y;

		expect(data.Manifest.Format).toBe('elemenx-universe');
		expect(data.Manifest.Cube).toBe(10);
		expect(cube).toEqual(again);
		expect(cube.Galaxies.length).toBe(cube.Count);
		expect(other.Galaxies[0].Place).not.toEqual(cube.Galaxies[0].Place);

		/* Of the real density: about 0.09 galaxies a cubic megaparsec, most of them dwarfs; no voids (every cube has some). */
		for (x = 0; x < 4; x++) {
			for (y = 0; y < 4; y++) {
				universes.Cube(data, x, y, 1 - x).Galaxies.forEach(function (one) {
					kinds[one.Kind] = (kinds[one.Kind] || 0) + 1;
					count++;

					expect(universes.CubeOf(data, one.Place)).toEqual([x, y, 1 - x]);
				});
			}
		}

		expect(count / 16 / 1000).toBeGreaterThan(0.07);
		expect(count / 16 / 1000).toBeLessThan(0.11);
		expect(kinds.dwarf).toBeGreaterThan(kinds.spiral + kinds.elliptical);
		expect(kinds.spiral).toBeGreaterThan(0);

		/* Far out: its place is its cube and an offset in it, the numbers small. */
		expect(far.Galaxies.length).toBeGreaterThan(40);
		expect(far.Galaxies[0].Cube).toEqual([400000, -250000, 99999]);
		expect(far.Galaxies[0].Offset[0]).toBeGreaterThanOrEqual(0);
		expect(far.Galaxies[0].Offset[0]).toBeLessThan(10);
		expect(far.Galaxies[0].Name.length).toBeGreaterThan(2);
		expect(far.Galaxies[0].Radius).toBeGreaterThan(1000);
	});

	it('puts the galaxies of the author at their places with none of the seed close to them, its home one of them or else a spiral near the origin', function () {
		var data = universes.Make({Seed: 'cosmos', Galaxies: [author], Home: 'milky-way'});
		var bare = universes.Make({Seed: 'cosmos'});
		var near = universes.Near(data, author.Coordinates, 5);
		var home = universes.Home(data);
		var plain = universes.Home(bare);
		var i;

		expect(near[0].ID).toBe('milky-way');
		expect(near[0].Author).toBe(true);
		expect(near[0].Distance).toBe(0);
		expect(near[1].Distance).toBeGreaterThanOrEqual(0.5);

		for (i = 1; i < near.length; i++)
			expect(near[i].Distance).toBeGreaterThanOrEqual(near[i - 1].Distance);

		/* One of the author put where a galaxy of the seed stood: that one is gone, and those within Near of it. */
		var stood = universes.Cube(bare, 0, 0, 0).Galaxies[0];
		var over = universes.Make({Seed: 'cosmos', Galaxies: [Object.assign({}, author, {ID: 'over', Coordinates: stood.Place})]});

		expect(universes.Find(bare, stood.ID)).not.toBe(null);
		expect(universes.Find(over, stood.ID)).toBe(null);
		expect(universes.Near(over, stood.Place, 0.5).map(function (one) {
			return one.ID;
		})).toEqual(['over']);

		expect(home.ID).toBe('milky-way');
		expect(home.Place).toEqual([123.4, -5, 60]);
		expect(universes.Find(data, 'milky-way').Kind).toBe('barred');

		expect(['spiral', 'barred']).toContain(plain.Kind);
		expect(universes.Distance(plain.Place, [0, 0, 0])).toBeLessThan(20);

		/* A galaxy of it as data: of its seed and kind at its place, the same object once made. */
		var galaxy = universes.Galaxy(data, near[1].ID);

		expect(galaxy.Manifest.Format).toBe('elemenx-galaxy');
		expect(galaxy.Manifest.Kind).toBe(near[1].Kind);
		expect(galaxy.Manifest.Coordinates).toEqual(near[1].Place);
		expect(universes.Galaxy(data, near[1].ID)).toBe(galaxy);
		expect(universes.Galaxy(data, 'milky-way').Manifest.Seed).toBe('milky');
		expect(universes.Galaxy(data, '1.2.3-99999')).toBe(null);
	});

	it('keeps what was changed of it (renamed, removed, added, a galaxy written) through its file', async function () {
		var data = universes.Make({Seed: 'cosmos'});
		var cube = universes.Cube(data, 0, 0, 0);
		var first = cube.Galaxies[0];
		var second = cube.Galaxies[1];
		var written = Elemenx.Service('GalaxyData').Make({Seed: 'written', Kind: 'ring'});
		var read;

		universes.Rename(data, first.ID, 'Lantern');
		universes.Remove(data, second.ID);
		universes.Add(data, {ID: 'beacon', Name: 'Beacon', Kind: 'ring', Coordinates: [4, 4, 4]});
		universes.SetGalaxy(data, first.ID, written);

		cube = universes.Cube(data, 0, 0, 0);

		expect(cube.Galaxies[0].Name).toBe('Lantern');
		expect(cube.Galaxies.some(function (one) {
			return one.ID === second.ID;
		})).toBe(false);
		expect(universes.Find(data, 'beacon').Kind).toBe('ring');

		read = await open(universes.Save(data));

		expect(read.Manifest.Seed).toBe('cosmos');
		expect(universes.Cube(read, 0, 0, 0).Galaxies).toEqual(cube.Galaxies);
		expect(universes.Galaxy(read, first.ID).Manifest.Seed).toBe('written');
		expect(universes.Galaxy(read, first.ID).Manifest.Kind).toBe('ring');
	});
});
