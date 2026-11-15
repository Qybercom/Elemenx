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

	/* The stars round a black hole had nothing of their own: what its pull leaves each at its nearest, and the old stars round them. */
	it('gives the stars round its black hole the planets and stations their room leaves them, and the swarm of its nuclear cluster', function () {
		var data = galaxies.Make({Seed: 'milky', Radius: 50000});
		var objects = Elemenx.Service('SystemData').Objects(galaxies.System(data, 'centre'), 'hole-moons');
		var byID = {};
		var planets;

		objects.forEach(function (one) {
			byID[one.ID] = one;
		});

		planets = objects.filter(function (one) {
			return one.Kind === 'planet';
		});

		expect(objects[0].Traits.Cluster).toMatchObject({Type: 'nuclear', Count: 6000});
		expect(planets.length).toBeGreaterThan(0);

		/* Each well inside the half of the sphere of Hill of its star at the nearest point of the star. */
		planets.forEach(function (planet) {
			var star = byID[planet.Parent];
			var room = galaxies.Room(star, data.Manifest.Centre.Mass);

			expect(star.Kind).toBe('star');
			expect(planet.Traits.Orbit.Distance * (1 + planet.Traits.Orbit.Eccentricity)).toBeLessThan(room * 1.2);
		});
	});

	it('makes star clusters of three kinds of a seed: open ones loose and young, globular ones old and packed, nuclear ones round a black hole', function () {
		var systems = Elemenx.Service('SystemData');
		var ly = Elemenx.Service('Astronomy').Units.ly;
		var kinds = {};

		['open', 'globular', 'nuclear'].forEach(function (type) {
			var objects = systems.Objects(galaxies.Cluster({Seed: 'pleiades', Type: type}), 'cluster-' + type);
			var middle = objects[0];
			var stars = objects.filter(function (one) {
				return one.Kind === 'star';
			});
			var far = stars.map(function (star) {
				return star.Traits.Orbit.Distance / ly;
			}).sort(function (a, b) {
				return a - b;
			});

			kinds[type] = {Middle: middle, Stars: stars, Half: far[Math.floor(far.length / 2)], Planets: objects.filter(function (one) {
				return one.Kind === 'planet';
			}).length, Masses: stars.map(function (star) {
				return star.Traits.Star.Mass;
			})};

			expect(middle.ID).toBe('cluster');
			expect(middle.Traits.Cluster.Type).toBe(type);

			stars.forEach(function (star) {
				expect(star.Parent).toBe('cluster');
			});
		});

		expect(kinds.open.Middle.Kind).toBe('cluster');
		expect(kinds.globular.Middle.Kind).toBe('cluster');
		expect(kinds.nuclear.Middle.Kind).toBe('blackhole');
		expect(kinds.nuclear.Middle.Traits.BlackHole.Mass).toBeGreaterThan(1e6);

		/* A few light-years across an open one, tens a globular one; the swarm of the old ones only. */
		expect(kinds.open.Half).toBeLessThan(8);
		expect(kinds.globular.Half).toBeGreaterThan(kinds.open.Half * 4);
		expect(kinds.open.Middle.Traits.Cluster.Count).toBe(0);
		expect(kinds.globular.Middle.Traits.Cluster.Count).toBeGreaterThan(1000);

		/* Hot heavy young stars in an open one, none in a globular one, red giants there instead. */
		expect(Math.max.apply(null, kinds.open.Masses)).toBeGreaterThan(2);
		expect(Math.max.apply(null, kinds.globular.Masses)).toBeLessThan(0.9);
		expect(kinds.globular.Stars.some(function (star) {
			return star.Traits.Star.Radius > 5;
		})).toBe(true);

		/* Systems of their own round its stars. */
		expect(kinds.open.Planets).toBeGreaterThan(10);

		/* The same of the same seed, another of another. */
		expect(JSON.stringify(galaxies.Cluster({Seed: 'pleiades', Type: 'open'}).Objects)).toBe(JSON.stringify(galaxies.Cluster({Seed: 'pleiades', Type: 'open'}).Objects));
		expect(JSON.stringify(galaxies.Cluster({Seed: 'hyades', Type: 'open'}).Objects)).not.toBe(JSON.stringify(galaxies.Cluster({Seed: 'pleiades', Type: 'open'}).Objects));
	});

	it('gives its stars their kinds: a few white and brown dwarfs, rare giants and what heavy stars left, each of the kind of a Scene, with a system of that star', function () {
		var data = galaxies.Make({Seed: 'milky', Radius: 50000});
		var tally = {};
		var stars = [];
		var dwarf;
		var system;

		[[270, 0, 0], [271, 0, 0], [270, 0, 1], [269, 0, 0], [272, 0, 1], [268, 0, 2]].forEach(function (at) {
			stars = stars.concat(galaxies.Sector(data, at[0], at[1], at[2]).Stars);
		});

		stars.forEach(function (star) {
			tally[star.Type] = (tally[star.Type] || 0) + 1;
		});

		expect(tally.main / stars.length).toBeGreaterThan(0.8);
		expect(tally['white-dwarf']).toBeGreaterThan(0);
		expect(tally['brown-dwarf']).toBeGreaterThan(0);

		dwarf = stars.filter(function (star) {
			return star.Type === 'white-dwarf';
		})[0];

		expect(dwarf).toMatchObject({Kind: 'white-dwarf', Class: 'DA'});

		/* Its system of that star. */
		system = Elemenx.Service('SystemData').Objects(galaxies.System(data, dwarf.ID), 'dwarf-system');

		expect(system[0]).toMatchObject({Kind: 'white-dwarf'});
		expect(system[0].Traits.Star.Type).toBe('white-dwarf');
	});

	it('has its nebulae and clusters of its seed, each where it belongs, each entered as a star is: its scene a nebula with what made it, or a cluster', function () {
		var data = galaxies.Make({Seed: 'milky', Radius: 50000, Kind: 'spiral'});
		var objects = galaxies.Objects(data);
		var of = function (type) {
			return objects.filter(function (one) {
				return one.Type === type;
			});
		};
		var systems = Elemenx.Service('SystemData');
		var arm = function (one) {
			return galaxies.Arm(data.Manifest, one.Place[0], one.Place[2]);
		};
		var mean = function (list, f) {
			return list.reduce(function (sum, one) {
				return sum + f(one);
			}, 0) / list.length;
		};
		var remnant;
		var made;
		var globular;

		expect(of('hii').length).toBeGreaterThan(50);
		expect(of('dark').length).toBeGreaterThan(20);
		expect(of('planetary').length).toBeGreaterThan(10);
		expect(of('remnant').length).toBeGreaterThan(10);
		expect(of('open').length).toBeGreaterThan(50);
		expect(of('globular').length).toBeGreaterThan(50);

		/* Clouds where stars are born on the arms, globular clusters in a ball out of the disc. */
		expect(mean(of('hii'), arm)).toBeGreaterThan(mean(of('planetary'), arm));
		expect(mean(of('globular'), function (one) {
			return Math.abs(one.Place[1]);
		})).toBeGreaterThan(mean(of('open'), function (one) {
			return Math.abs(one.Place[1]);
		}) * 5);

		/* The same of the same seed; renamed and taken away by its edits. */
		expect(JSON.stringify(galaxies.Objects(galaxies.Make({Seed: 'milky', Radius: 50000, Kind: 'spiral'})))).toBe(JSON.stringify(objects));

		galaxies.Rename(data, objects[0].ID, 'Orion');
		galaxies.Remove(data, objects[1].ID);

		expect(galaxies.ObjectOf(data, objects[0].ID).Name).toBe('Orion');
		expect(galaxies.ObjectOf(data, objects[1].ID)).toBe(null);

		/* Entered: a remnant of a heavy star with its pulsar or neutron star, a planetary nebula with its white dwarf, a cluster. */
		remnant = of('remnant').filter(function (one) {
			return one.Subtype === 'II';
		})[0];
		made = systems.Objects(galaxies.System(data, remnant.ID), 'remnant');

		expect(galaxies.Star(data, remnant.ID).ID).toBe(remnant.ID);
		expect(made[0]).toMatchObject({Kind: 'nebula'});
		expect(made[0].Traits.Nebula).toMatchObject({Type: 'remnant', Subtype: 'II'});
		expect(made[1].Kind).toBe('pulsar');
		expect(systems.Objects(galaxies.System(data, of('planetary')[0].ID), 'planetary')[1].Kind).toBe('white-dwarf');

		globular = systems.Objects(galaxies.System(data, of('globular')[0].ID), 'globular');

		expect(globular[0].Traits.Cluster.Type).toBe('globular');
	});

	it('finds what lies round a place and is as asked, the nearest first: a type, a class, a mass, a text, what was edited', function () {
		var data = galaxies.Make({Seed: 'search', Kind: 'spiral'});
		var centre = [20000, 0, 3000];
		var near = galaxies.Search(data, {Centre: centre, Radius: 40, Limit: 100000});
		var all = [];
		var x;
		var y;
		var z;
		var dwarfs;
		var some;
		var nebula;

		/* The same as its sectors hold: each star in the sphere, none outside, the nearest first. */
		for (x = 199; x <= 200; x++)
			for (y = -1; y <= 0; y++)
				for (z = 29; z <= 30; z++)
					galaxies.Sector(data, x, y, z).Stars.forEach(function (star) {
						var d = Math.hypot(star.Place[0] - centre[0], star.Place[1] - centre[1], star.Place[2] - centre[2]);
						if (d <= 40)
							all.push(star.ID);
					});

		expect(near.Partial).toBe(false);
		expect(near.Items.filter(function (item) {
			return item.Kind === 'star';
		}).map(function (item) {
			return item.ID;
		}).sort()).toEqual(all.sort());
		expect(near.Items.every(function (item, index) {
			return index === 0 || item.Distance >= near.Items[index - 1].Distance;
		})).toBe(true);
		expect(near.Items[0]).toMatchObject({Kind: 'star', Class: expect.any(String), Mass: expect.any(Number), Temperature: expect.any(Number)});

		/* At most Limit, the nearest. */
		some = galaxies.Search(data, {Centre: centre, Radius: 40, Limit: 10});

		expect(some.Items.length).toBe(10);
		expect(some.More).toBe(true);
		expect(some.Items.map(function (item) {
			return item.ID;
		})).toEqual(near.Items.slice(0, 10).map(function (item) {
			return item.ID;
		}));

		/* A type, a class, a mass. */
		dwarfs = galaxies.Search(data, {Centre: centre, Radius: 40, Type: 'white-dwarf'});

		expect(dwarfs.Items.length).toBeGreaterThan(0);
		expect(dwarfs.Items.every(function (item) {
			return item.Type === 'white-dwarf' && item.Class.indexOf('D') === 0;
		})).toBe(true);
		expect(galaxies.Search(data, {Centre: centre, Radius: 40, Class: 'M'}).Items.every(function (item) {
			return item.Class.charAt(0) === 'M';
		})).toBe(true);
		expect(galaxies.Search(data, {Centre: centre, Radius: 40, Mass: [2, 100]}).Items.every(function (item) {
			return item.Mass >= 2;
		})).toBe(true);

		/* A text: its name or its ID. */
		galaxies.Rename(data, near.Items[3].ID, 'Polaris');

		expect(galaxies.Search(data, {Centre: centre, Radius: 40, Text: 'polar'}).Items.map(function (item) {
			return item.ID;
		})).toEqual([near.Items[3].ID]);

		/* What was edited: given a name, its system written. */
		galaxies.SetSystem(data, near.Items[5].ID, {Version: 1, Objects: []});

		expect(galaxies.Search(data, {Centre: centre, Radius: 40, Edited: 'renamed'}).Items.map(function (item) {
			return item.ID;
		})).toEqual([near.Items[3].ID]);
		expect(galaxies.Search(data, {Centre: centre, Radius: 40, Edited: 'written'}).Items.map(function (item) {
			return item.ID;
		})).toEqual([near.Items[5].ID]);
		expect(galaxies.Search(data, {Centre: centre, Radius: 40, Edited: 'any'}).Items.length).toBe(2);

		/* Its nebulae and clusters, of their type, round where they are. */
		nebula = galaxies.Objects(data).filter(function (one) {
			return one.Type === 'planetary';
		})[0];

		expect(galaxies.Search(data, {Centre: nebula.Place, Radius: 10, Type: 'nebula'}).Items[0]).toMatchObject({ID: nebula.ID, Kind: 'nebula', Type: 'planetary', Distance: 0});
		expect(galaxies.Search(data, {Centre: nebula.Place, Radius: 10, Type: 'nebula', Mass: [0, 1]}).Items.length).toBe(0);

		/* A region too large for its budget: what it went through, told as partial. */
		expect(galaxies.Search(data, {Centre: centre, Radius: 5000, Budget: 20000}).Partial).toBe(true);
	});
});
