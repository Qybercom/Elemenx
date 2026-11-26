/*
 * The golden numbers of the universe (docs/UNIVERSE-FORMAT.md), of an Elemenx with GalaxyData, SystemData and Astronomy:
 * the own Math, the sequences of seeds, galaxies of a few kinds (their passports, stars of sectors, nebulae and clusters,
 * the system of a star and of a black hole). One source for Node (scripts/universe-golden.js writes
 * docs/universe-golden.json) and for the browser (universe-golden.test.js reads this file as text), in ES5.
 */
module.exports = function golden (Elemenx) {
	var own = Elemenx.Compilers.Math();
	var random = Elemenx.Service('Random');
	var galaxies = Elemenx.Service('GalaxyData');
	var astronomy = Elemenx.Service('Astronomy');
	var made = {Version: 1, Math: {}, Sequences: {}, Hashes: {}, Galaxies: [], Systems: []};
	var inputs = {
		sin: [0, 1e-9, 0.5, 1, 3.141592653589793, 10, 1000, -7.25],
		cos: [0, 1e-9, 0.5, 1, 3.141592653589793, 10, 1000, -7.25],
		tan: [0.1, 1, 1.5, -2],
		asin: [0, 0.3, -0.9, 1],
		acos: [0, 0.3, -0.9, 1],
		atan: [0, 0.3, -5, 1e6],
		exp: [0, 1, -1, 0.001, 20, -30, 700],
		log: [1, 2, 0.5, 1e-9, 10, 1e300],
		pow: [[2, 0.5], [10, -3], [0.9, 2.3], [1.5, 3.5], [7, 1 / 3], [1e-3, -1 / 1.35], [3, 64]],
		atan2: [[1, 1], [-1, 2], [0.5, -3], [-2, -0.1]]
	};

	Object.keys(inputs).forEach(function (name) {
		made.Math[name] = inputs[name].map(function (value) {
			var args = Array.isArray(value) ? value : [value];

			return {In: args, Out: own[name].apply(null, args)};
		});
	});

	['', 'galaxy', 'milky:3.4.-1-17'].forEach(function (seed) {
		var next = random.Sequence(seed);
		var values = [];
		var i;

		for (i = 0; i < 6; i++)
			values.push(next());

		made.Sequences[seed] = values;
		made.Hashes[seed] = random.Hash(seed);
	});

	[{Seed: 'milky', Kind: 'spiral'}, {Seed: 'giant', Kind: 'elliptical'}, {Seed: 'clumps', Kind: 'irregular'}].forEach(function (options) {
		var data = galaxies.Make(options);
		var m = data.Manifest;
		var cells = [[0, 0, 0], [80, 0, 0], [-120, 1, 40], [300, -2, -10]];
		var sectors = cells.map(function (at) {
			var sector = galaxies.Sector(data, at[0], at[1], at[2], 4);

			return {At: at, Key: sector.Key, Count: sector.Count, Stars: sector.Stars.map(function (star) {
				return {ID: star.ID, Place: star.Place, Mass: star.Mass, Type: star.Type, Class: star.Class, Temperature: star.Temperature, Luminosity: star.Luminosity, Color: star.Color};
			})};
		});
		var objects = galaxies.Objects(data);
		var first = sectors.filter(function (sector) {
			return sector.Stars.length;
		})[0];
		var system = first ? galaxies.System(data, first.Stars[0].ID) : null;

		made.Galaxies.push({
			Options: options,
			Manifest: {Kind: m.Kind, Radius: m.Radius, Arms: m.Arms, Pitch: m.Pitch, Phase: m.Phase, Sector: m.Sector, Centre: m.Centre},
			Sectors: sectors,
			Objects: {Count: objects.length, First: objects.slice(0, 5).map(function (one) {
				return {ID: one.ID, Kind: one.Kind, Type: one.Type, Subtype: one.Subtype, Place: one.Place, Radius: one.Radius};
			})},
			System: system ? {Star: first.Stars[0].ID, Objects: Elemenx.Service('SystemData').Objects(system).map(function (one) {
				return one.ID + ':' + one.Kind;
			})} : null,
			Hole: Elemenx.Service('SystemData').Objects(galaxies.HoleSystem(data)).length
		});
	});

	/* Universes: the galaxies of a few cubes (one far out), those round a galaxy of the author, the home one. */
	made.Universes = ['cosmos', 'deep'].map(function (seed) {
		var universes = Elemenx.Service('UniverseData');
		var data = universes.Make({Seed: seed, Galaxies: [{ID: 'home', Name: 'Home', Seed: 'milky', Kind: 'barred', Coordinates: [123.4, -5, 60]}], Home: seed === 'cosmos' ? 'home' : ''});
		var cubes = [[0, 0, 0], [-3, 7, 12], [12, -1, 6], [400000, -250000, 99999]].map(function (at) {
			var cube = universes.Cube(data, at[0], at[1], at[2]);

			return {At: at, Key: cube.Key, Count: cube.Count, First: cube.Galaxies.slice(0, 5)};
		});
		var home = universes.Home(data);

		return {Seed: seed, Cubes: cubes, Near: universes.Near(data, [123.4, -5, 60], 4).map(function (one) {
			return [one.ID, one.Kind, one.Distance];
		}), Home: home ? home.ID : null};
	});

	['sol', 'alpha', 'x-17'].forEach(function (seed) {
		var system = astronomy.Generate(seed);

		made.Systems.push({Seed: seed, Name: system.Name, Bodies: system.Bodies.map(function (body) {
			return [body.ID, body.Kind, body.Mass === undefined ? null : body.Mass, body.Radius === undefined ? null : body.Radius, body.Orbit ? body.Orbit.Distance : null];
		})});
	});

	return made;
};
