/*
 * UniverseData: a universe as data (docs/UNIVERSE-FORMAT.md, docs/SPACE-FORMAT.md): its passport, its galaxies made of
 * its seed cube by cube with no end (as many as a real universe has, at random places, with no voids), the galaxies of
 * its author at their places, the galaxy one starts in (Home), what was changed of it, and the galaxies written in it
 * (GalaxyData). Units: megaparsecs (Mpc; Units.ly the light-years of one).
 * - Make(options): the data of a universe of options {Seed, ID, Name, Cube (the edge of a cube, Mpc: 10), Density
 *   ({kind: galaxies a cubic Mpc}: Densities by default, of real counts), Near (Mpc: no galaxy of the seed nearer than this
 *   to one of the author, 0.5), Galaxies (those of the author: {ID, Name, Seed, Kind, Coordinates [x, y, z] Mpc, and what
 *   else GalaxyData.Make takes}), Home (the ID of the galaxy one starts in: of the author or of the seed)}. data is
 *   {Manifest, Edits {Overrides: {id: {Name}}, Removed: [id], Added: [galaxies of the author added]}, Galaxies: {id:
 *   galaxy data written}}.
 * - Cube(data, x, y, z): the galaxies of a cube (x, y, z whole numbers: its place in the grid) made of the seed, the same
 *   each time, and those of the author in it: {Key, Count (of the seed, before what is left out), Galaxies: [{ID, Name,
 *   Seed, Kind, Radius (ly), Place [x, y, z] (Mpc), Cube, Offset (Mpc in its cube), Author (one of the author)}]}.
 * - Densities: galaxies a cubic Mpc of each kind, of the near universe (some 0.02 large ones, four times as many small).
 * - CubeOf(data, place): the cube of a place [x, y, z] (Mpc).
 * - Near(data, place, radius, limit): the galaxies within radius Mpc of a place, the nearest first (Distance, Mpc), at
 *   most limit of them.
 * - Find(data, id): one galaxy of the list (as Cube has them) of its ID: 'x.y.z-n' of the seed, or one of the author.
 * - Galaxy(data, id): the data of a galaxy (GalaxyData): written in the universe (Galaxies), else made of its seed and
 *   kind at its place (Coordinates), kept once made.
 * - Home(data): the galaxy one starts in (Find of Manifest.Home; when none is told, the spiral one nearest the origin).
 * - Distance(a, b): between two places, Mpc.
 * - Pole(galaxy): the north of a galaxy (of the list) in the universe, of its seed; Frame(galaxy): its axes [X, Y (its
 *   north), Z] in the universe, what a way of the universe is in the galaxy (Into(frame, way)).
 * - SkyFrom(data, place, count): the same seen from a place between them (Mpc; out of a warp there), ways of the universe.
 * - Sky(data, id, count): the galaxies seen from one (its ID), those that look the largest first, count (16) of them, as a
 *   backdrop has them (SceneCosmos Far): {ID, Name, Kind, Distance (Mpc), Size (radians: half across, as it is), Way and
 *   Pole (in the frame of the galaxy seen from), Shape (the seed of its look for the shader: its kind, arms, bar)}.
 * - Rename(data, id, name), Remove(data, id), Add(data, galaxy) (one of the author), SetGalaxy(data, id, galaxy): what is
 *   changed of it.
 * - Use(key, data), DataOf(key); Open(source, callback), Write(data, store, callback, whole), Save(data), Pack(data,
 *   callback): as GalaxyData (parts {Kind: 'universe'}, {Kind: 'edits'}, those of a galaxy written with Galaxy: id).
 *   Open of the address of a folder (ending in /) reads the layout of elemenx universe bake and serve (tools/universe.js):
 *   its universe.json and edits.json; Fetch(data, x, y, z, callback(error, cube)) reads a cube of it there (kept, as Cube
 *   gives it then), made here when it is not.
 * Its numbers are only the exact ones (docs/UNIVERSE-FORMAT.md): its sequences, sums, products and square roots.
 */
Elemenx.Service('UniverseData', {
	$Meta: {
		Description: 'A universe as data: its galaxies made of its seed cube by cube with no end, those of its author, the one one starts in, what was changed of it.',
		Methods: ['Make(options)', 'Cube(data, x, y, z)', 'CubeOf(data, place)', 'Near(data, place, radius, limit)', 'Find(data, id)', 'Galaxy(data, id)', 'Home(data)', 'Distance(a, b)', 'Pole(galaxy)', 'Frame(galaxy)', 'Into(frame, way)', 'Sky(data, id, count)', 'SkyFrom(data, place, count)', 'Rename(data, id, name)', 'Remove(data, id)', 'Add(data, galaxy)', 'SetGalaxy(data, id, galaxy)', 'Use(key, data)', 'DataOf(key)', 'Open(source, callback)', 'Write(data, store, callback, whole)', 'Save(data)', 'Pack(data, callback)', 'Fetch(data, x, y, z, callback)']
	},

	Sets: {},

	/* Light-years of a megaparsec. */
	Units: {ly: 3261563.8},

	/*
	 * Galaxies a cubic megaparsec of each kind, of the counts of the near universe: about 0.02 large ones (spiral, barred,
	 * lenticular, elliptical) and four times as many small ones (irregular, dwarf); a ring is rare. A galaxy like ours has
	 * one of its size some 2 Mpc away, a small one within one.
	 */
	Densities: {spiral: 0.006, barred: 0.006, lenticular: 0.003, elliptical: 0.002, irregular: 0.01, dwarf: 0.06, ring: 0.0003},

	Random: function (text) {
		return this.$Service('Random').Sequence(text);
	},

	Make: function (options) {
		var given = options || {};
		var seed = String(given.Seed === undefined ? 'universe' : given.Seed);

		return {
			Manifest: {
				Format: 'elemenx-universe',
				Version: 1,
				ID: String(given.ID || 'universe-' + seed),
				Name: String(given.Name || seed),
				Seed: seed,
				Cube: Number(given.Cube) || 10,
				Density: Object.assign({}, given.Density || this.Densities),
				Near: given.Near === undefined ? 0.5 : Number(given.Near),
				Galaxies: JSON.parse(JSON.stringify(given.Galaxies || [])),
				Home: String(given.Home || ''),
				Written: {}
			},
			Edits: {Overrides: {}, Removed: [], Added: []},
			Galaxies: {}
		};
	},

	CubeKey: function (x, y, z) {
		return x + '.' + y + '.' + z;
	},

	CubeOf: function (data, place) {
		var size = data.Manifest.Cube;

		return [Math.floor(place[0] / size), Math.floor(place[1] / size), Math.floor(place[2] / size)];
	},

	Distance: function (a, b) {
		var x = a[0] - b[0];
		var y = a[1] - b[1];
		var z = a[2] - b[2];

		return Math.sqrt(x * x + y * y + z * z);
	},

	/* The kinds in a fixed order, and the share of each: what a galaxy of the seed is of one number. */
	Kinds: function (data) {
		var density = data.Manifest.Density;
		var kinds = this.$Service('GalaxyData').Kinds().filter(function (kind) {
			return density[kind] > 0;
		});
		var total = 0;

		kinds.forEach(function (kind) {
			total += density[kind];
		});

		return {Kinds: kinds, Total: total};
	},

	/* How many galaxies of the seed a cube has: of the mean of the density, a little more or less (three numbers of its own). */
	CubeCount: function (data, x, y, z) {
		var size = data.Manifest.Cube;
		var random = this.Random(data.Manifest.Seed + ':cube:' + this.CubeKey(x, y, z));
		var mean = this.Kinds(data).Total * size * size * size;

		return Math.max(0, Math.round(mean + Math.sqrt(mean) * (random() + random() + random() - 1.5) * 1.4));
	},

	/* A galaxy of the seed of a cube, of its own sequence: {ID, Seed, Kind, Place, Cube, Offset}. */
	CubeGalaxy: function (data, x, y, z, n) {
		var m = data.Manifest;
		var id = this.CubeKey(x, y, z) + '-' + n;
		var seed = m.Seed + ':galaxy:' + id;
		var random = this.Random(seed);
		var offset = [random() * m.Cube, random() * m.Cube, random() * m.Cube];
		var shares = this.Kinds(data);
		var drawn = random() * shares.Total;
		var kind = shares.Kinds[shares.Kinds.length - 1];
		var sum = 0;
		var i;

		for (i = 0; i < shares.Kinds.length; i++) {
			sum += m.Density[shares.Kinds[i]];

			if (drawn < sum) {
				kind = shares.Kinds[i];

				break;
			}
		}

		return {ID: id, Seed: seed, Kind: kind, Cube: [x, y, z], Offset: offset, Place: [x * m.Cube + offset[0], y * m.Cube + offset[1], z * m.Cube + offset[2]]};
	},

	/* Those of the author, with what was added and less what was removed. */
	Authored: function (data) {
		var removed = data.Edits.Removed;
		var added = data.Edits.Added || [];
		var ids = {};

		added.forEach(function (one) {
			ids[one.ID] = true;
		});

		return data.Manifest.Galaxies.filter(function (one) {
			return !ids[one.ID];
		}).concat(added).filter(function (one) {
			return removed.indexOf(one.ID) === -1;
		});
	},

	/* A galaxy as the list has it: its name (of the edits, of the author, or of its seed), its radius of its seed. */
	Entry: function (data, made, author) {
		var over = data.Edits.Overrides[made.ID] || {};
		var name = over.Name || made.Name || this.$Service('Astronomy').Name(this.$Service('Astronomy').Random(made.Seed + ':name'));
		var manifest = this.$Service('GalaxyData').Make({Seed: made.Seed, Kind: made.Kind, Radius: made.Radius}).Manifest;

		return {ID: made.ID, Name: name, Seed: made.Seed, Kind: manifest.Kind, Radius: manifest.Radius, Place: made.Place.slice(0, 3), Cube: made.Cube, Offset: made.Offset, Author: !!author};
	},

	Cube: function (data, x, y, z) {
		var key = this.CubeKey(x, y, z);
		var kept;

		if (!data.Cubes)
			Object.defineProperty(data, 'Cubes', {value: {}, writable: true, configurable: true, enumerable: false});

		kept = data.Cubes[key] || (data.Cubes[key] = this.MakeCube(data, x, y, z));

		return {Key: kept.Key, Count: kept.Count, Galaxies: kept.Galaxies.map(function (one) {
			return Object.assign({}, one);
		})};
	},

	/* What was changed of it: the cubes made and the galaxies made of them are made again. */
	Changed: function (data) {
		data.Cubes = {};

		if (data.Made)
			data.Made = {};
	},

	MakeCube: function (data, x, y, z) {
		var self = this;
		var m = data.Manifest;
		var count = this.CubeCount(data, x, y, z);
		var authored = this.Authored(data);
		var near = m.Near * m.Near;
		var galaxies = [];
		var made;
		var i;

		function crowded (place) {
			return authored.some(function (one) {
				var at = one.Coordinates || [0, 0, 0];
				var dx = at[0] - place[0];
				var dy = at[1] - place[1];
				var dz = at[2] - place[2];

				return dx * dx + dy * dy + dz * dz < near;
			});
		}

		for (i = 0; i < count; i++) {
			made = this.CubeGalaxy(data, x, y, z, i);

			if (data.Edits.Removed.indexOf(made.ID) !== -1 || crowded(made.Place)) continue;

			galaxies.push(this.Entry(data, made, false));
		}

		authored.forEach(function (one) {
			var at = one.Coordinates || [0, 0, 0];
			var cube = self.CubeOf(data, at);
			if (cube[0] !== x || cube[1] !== y || cube[2] !== z) return;

			galaxies.push(self.Entry(data, {ID: String(one.ID), Name: one.Name, Seed: String(one.Seed === undefined ? one.ID : one.Seed), Kind: one.Kind, Radius: one.Radius, Place: at, Cube: cube, Offset: [at[0] - cube[0] * m.Cube, at[1] - cube[1] * m.Cube, at[2] - cube[2] * m.Cube]}, true));
		});

		return {Key: this.CubeKey(x, y, z), Count: count, Galaxies: galaxies};
	},

	Near: function (data, place, radius, limit) {
		var size = data.Manifest.Cube;
		var low = this.CubeOf(data, [place[0] - radius, place[1] - radius, place[2] - radius]);
		var high = this.CubeOf(data, [place[0] + radius, place[1] + radius, place[2] + radius]);
		var found = [];
		var x;
		var y;
		var z;

		for (x = low[0]; x <= high[0]; x++) {
			for (y = low[1]; y <= high[1]; y++) {
				for (z = low[2]; z <= high[2]; z++) {
					/* A cube wholly beyond the radius is not made. */
					if (this.CubeDistance(place, [x * size, y * size, z * size], size) > radius) continue;

					this.Cube(data, x, y, z).Galaxies.forEach(function (one) {
						one.Distance = this.Distance(place, one.Place);

						if (one.Distance <= radius)
							found.push(one);
					}, this);
				}
			}
		}

		found.sort(function (a, b) {
			return a.Distance - b.Distance || (a.ID < b.ID ? -1 : 1);
		});

		return limit === undefined ? found : found.slice(0, Math.max(0, Math.floor(limit)));
	},

	/* How far a place is from the nearest point of a cube (its corner and its edge). */
	CubeDistance: function (place, corner, size) {
		var sum = 0;
		var i;
		var d;

		for (i = 0; i < 3; i++) {
			d = place[i] < corner[i] ? corner[i] - place[i] : place[i] > corner[i] + size ? place[i] - corner[i] - size : 0;
			sum += d * d;
		}

		return Math.sqrt(sum);
	},

	Find: function (data, id) {
		var text = String(id);
		var authored = this.Authored(data).filter(function (one) {
			return String(one.ID) === text;
		})[0];
		var dash = text.lastIndexOf('-');
		var at = text.slice(0, dash).split('.').map(Number);
		var cube;

		if (authored) {
			cube = this.CubeOf(data, authored.Coordinates || [0, 0, 0]);

			return this.Cube(data, cube[0], cube[1], cube[2]).Galaxies.filter(function (one) {
				return one.ID === text;
			})[0] || null;
		}

		if (dash < 1 || at.length !== 3 || at.some(isNaN)) return null;

		return this.Cube(data, at[0], at[1], at[2]).Galaxies.filter(function (one) {
			return one.ID === text;
		})[0] || null;
	},

	Galaxy: function (data, id) {
		var entry;
		var author;
		var made;

		if (data.Galaxies[id])
			return data.Galaxies[id];

		if (!data.Made)
			Object.defineProperty(data, 'Made', {value: {}, writable: true, configurable: true, enumerable: false});

		if (data.Made[id])
			return data.Made[id];

		entry = this.Find(data, id);

		if (!entry)
			return null;

		author = entry.Author ? this.Authored(data).filter(function (one) {
			return String(one.ID) === entry.ID;
		})[0] : null;
		made = this.$Service('GalaxyData').Make(Object.assign({}, author || {}, {ID: entry.ID, Name: entry.Name, Seed: entry.Seed, Kind: entry.Kind, Coordinates: entry.Place}));
		data.Made[id] = made;

		return made;
	},

	Home: function (data) {
		var home = data.Manifest.Home ? this.Find(data, data.Manifest.Home) : null;
		var radius = data.Manifest.Cube;
		var found;

		if (home)
			return home;

		/* None told: the spiral one nearest the origin of the universe. */
		while (radius < data.Manifest.Cube * 64) {
			found = this.Near(data, [0, 0, 0], radius).filter(function (one) {
				return one.Kind === 'spiral' || one.Kind === 'barred';
			})[0];

			if (found)
				return found;

			radius *= 2;
		}

		return null;
	},

	Pole: function (galaxy) {
		var math = this.$Service('GalaxyData').Math();
		var random = this.Random(galaxy.Seed + ':pole');
		var z = random() * 2 - 1;
		var turn = random() * 2 * Math.PI;
		var round = Math.sqrt(Math.max(0, 1 - z * z));

		return [round * math.cos(turn), z, round * math.sin(turn)];
	},

	Frame: function (galaxy) {
		var y = this.Pole(galaxy);
		var other = Math.abs(y[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
		var x = [y[1] * other[2] - y[2] * other[1], y[2] * other[0] - y[0] * other[2], y[0] * other[1] - y[1] * other[0]];
		var length = Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]);

		x = [x[0] / length, x[1] / length, x[2] / length];

		return [x, y, [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]]];
	},

	Into: function (frame, way) {
		return frame.map(function (axis) {
			return axis[0] * way[0] + axis[1] * way[1] + axis[2] * way[2];
		});
	},

	/*
	 * The seed of the look of a galaxy for the shader of far galaxies (SceneCosmos CosmosGalaxyGLSL: what its w makes of
	 * it): the first one of its seed whose look is of its kind (an ellipse, a lens, clumps, a disc of its arms, a bar).
	 */
	Shape: function (entry) {
		var m = this.$Service('GalaxyData').Make({Seed: entry.Seed, Kind: entry.Kind}).Manifest;
		var start = this.Random(entry.Seed + ':look')() * 3;
		var w;
		var i;

		function fract (x) {
			return x - Math.floor(x);
		}

		function fits (w) {
			var kind = fract(w * 7.3);
			var arms = Math.floor(2 + Math.pow(fract(w * 11.7), 2) * 4.99);
			var bar = fract(w * 2.3) < 0.4;

			if (m.Kind === 'elliptical' || m.Kind === 'dwarf') return kind < 0.16;
			if (m.Kind === 'lenticular' || m.Kind === 'ring') return kind >= 0.16 && kind < 0.27;

			if (m.Kind === 'irregular')
				return kind >= 0.27 && kind < 0.38;

			return kind >= 0.38 && bar === (m.Kind === 'barred') && (m.Kind === 'barred' || arms === Math.min(6, Math.max(2, m.Arms || 2)));
		}

		for (i = 0; i < 4000; i++) {
			w = start + i * 0.00173;

			if (fits(w)) return w;
		}

		return start;
	},

	Sky: function (data, id, count) {
		var from = this.Find(data, id);

		return from ? this.Seen(data, from.Place, this.Frame(from), from.ID, count) : [];
	},

	/* The galaxies seen from a place of the universe between them (Mpc): Sky of no galaxy, its ways those of the universe. */
	SkyFrom: function (data, place, count) {
		return this.Seen(data, place, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], '', count);
	},

	Seen: function (data, place, frame, but, count) {
		var self = this;
		var ly = this.Units.ly;

		/* Seen as large as a thousandth of a radian at most 12 Mpc off (the largest are some 70 000 ly across). */
		return this.Near(data, place, 12).filter(function (one) {
			return one.ID !== but;
		}).map(function (one) {
			/* Half across as seen: of its radius, as wide as it stands round a place in it (a right angle at the most). */
			one.Size = Math.min(Math.PI / 2, Math.atan(one.Radius / (Math.max(one.Distance, 1e-9) * ly)));

			return one;
		}).sort(function (a, b) {
			return b.Size - a.Size || (a.ID < b.ID ? -1 : 1);
		}).slice(0, count === undefined ? 16 : count).map(function (one) {
			var far = Math.max(one.Distance, 1e-9);
			var way = [(one.Place[0] - place[0]) / far, (one.Place[1] - place[1]) / far, (one.Place[2] - place[2]) / far];

			return {ID: one.ID, Name: one.Name, Kind: one.Kind, Distance: one.Distance, Size: one.Size, Way: self.Into(frame, way), Pole: self.Into(frame, self.Pole(one)), Shape: self.Shape(one)};
		});
	},

	Rename: function (data, id, name) {
		data.Edits.Overrides[id] = Object.assign({}, data.Edits.Overrides[id] || {}, {Name: String(name)});

		this.Changed(data);

		this.$Service('PlanetData').Mark(data, {Kind: 'edits'});
	},

	Remove: function (data, id) {
		if (data.Edits.Removed.indexOf(id) === -1)
			data.Edits.Removed.push(id);

		this.Changed(data);

		this.$Service('PlanetData').Mark(data, {Kind: 'edits'});
	},

	/* A galaxy of the author put in it: {ID, Name, Seed, Kind, Coordinates (Mpc), ...}. */
	Add: function (data, galaxy) {
		data.Edits.Added = data.Edits.Added.filter(function (one) {
			return one.ID !== galaxy.ID;
		}).concat([JSON.parse(JSON.stringify(galaxy))]);

		this.Changed(data);

		this.$Service('PlanetData').Mark(data, {Kind: 'edits'});
	},

	SetGalaxy: function (data, id, galaxy) {
		data.Galaxies[id] = galaxy;

		if (data.Made)
			delete data.Made[id];

		data.Manifest.Written[id] = {Part: true};

		this.$Service('PlanetData').Mark(data, {Kind: 'universe'});

		data.GalaxiesChanged = data.GalaxiesChanged || {};
		data.GalaxiesChanged[id] = true;
	},

	/* The store of the parts of a galaxy written in it: each part with Galaxy: id. */
	GalaxyStore: function (store, id) {
		function of (part) {
			return Object.assign({}, part, {Galaxy: id});
		}

		return {
			Read: function (part, callback) {
				store.Read(of(part), callback);
			},
			Write: function (part, bytes, callback) {
				store.Write(of(part), bytes, callback);
			},
			Remove: store.Remove ? function (part, callback) {
				store.Remove(of(part), callback);
			} : undefined
		};
	},

	Use: function (key, data) {
		this.Sets[key] = data;
	},

	DataOf: function (key) {
		return this.Sets[key] || null;
	},

	Write: function (data, store, callback, whole) {
		var self = this;
		var planets = this.$Service('PlanetData');
		var galaxies = this.$Service('GalaxyData');
		var done = typeof callback === 'function' ? callback : function () {};
		var own = whole || !data.Dirty ? [{Kind: 'universe'}, {Kind: 'edits'}] : Object.keys(data.Dirty).map(function (key) {
			return data.Dirty[key].Part;
		});
		var written = Object.keys(data.Galaxies || {}).filter(function (id) {
			return data.Manifest.Written[id] && (whole || (data.GalaxiesChanged || {})[id] || data.Galaxies[id].Dirty && Object.keys(data.Galaxies[id].Dirty).length);
		});
		var left = written.length + 1;
		var failed = false;

		function finish (error) {
			if (failed) return;

			if (error) {
				failed = true;

				done(error);

				return;
			}

			if (--left) return;

			data.Dirty = {};
			data.GalaxiesChanged = {};

			done(null);
		}

		planets.WriteParts(store, own, own.map(function (part) {
			return new TextEncoder().encode(JSON.stringify(part.Kind === 'universe' ? data.Manifest : data.Edits, null, part.Kind === 'universe' ? '\t' : undefined));
		}), finish);

		written.forEach(function (id) {
			galaxies.Write(data.Galaxies[id], self.GalaxyStore(store, id), finish, whole || (data.GalaxiesChanged || {})[id]);
		});
	},

	Path: function (part) {
		var galaxies = this.$Service('GalaxyData');
		var own = Object.assign({}, part);

		if (part.Galaxy !== undefined && part.Galaxy !== null) {
			delete own.Galaxy;

			return 'galaxies/' + encodeURIComponent(part.Galaxy) + '/' + galaxies.Path(own);
		}

		return part.Kind === 'universe' ? 'universe.json' : 'edits.json';
	},

	FilesStore: function (files) {
		var self = this;

		return {
			Read: function (part, callback) {
				callback(null, files[self.Path(part)] || null);
			},
			Write: function (part, bytes, callback) {
				files[self.Path(part)] = bytes;

				callback(null);
			}
		};
	},

	Save: function (data) {
		var files = {};
		var made = null;
		var archive = this.$Service('Archive');

		this.Write(data, this.FilesStore(files), function (error) {
			if (!error)
				made = archive.Zip(files);
		}, true);

		return made;
	},

	Pack: function (data, callback) {
		var files = {};
		var archive = this.$Service('Archive');

		this.Write(data, this.FilesStore(files), function (error) {
			if (error) callback(error);
			else archive.Compress(files, callback);
		}, true);
	},

	Open: function (source, callback) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};
		var reader;

		function expanded (bytes) {
			self.$Service('Archive').Expand(bytes, function (error, files) {
				if (error) done(error);
				else self.FromStore(self.FilesStore(files), done);
			});
		}

		if (source && source.Manifest && source.Manifest.Format === 'elemenx-universe') {
			done(null, source);

			return;
		}

		if (source && typeof source.Read === 'function') {
			this.FromStore(source, done);

			return;
		}

		/* The folder of a baked or served universe: its passport and its edits there. */
		if (typeof source === 'string' && /\/$/.test(source)) {
			this.FromStore(this.BaseStore(source), function (error, data) {
				if (data)
					data.Base = source;

				done(error, data);
			});

			return;
		}

		if (typeof source === 'string') {
			this.$Service('PlanetData').Get(source, null, function (error, bytes) {
				if (error) done(error);
				else expanded(bytes);
			});

			return;
		}

		if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
			expanded(source);

			return;
		}

		if (typeof Blob !== 'undefined' && source instanceof Blob) {
			reader = new FileReader();
			reader.onload = function () {
				expanded(reader.result);
			};
			reader.onerror = function () {
				done(reader.error || new Error('UniverseData: the file was not read'));
			};

			reader.readAsArrayBuffer(source);

			return;
		}

		done(new Error('UniverseData: not a universe'));
	},

	/* The parts of a folder on the network (its universe.json, edits.json, galaxies/...): read only. */
	BaseStore: function (base) {
		var self = this;

		return {
			Read: function (part, callback) {
				self.$Service('PlanetData').Get(base + self.Path(part), null, function (error, bytes) {
					callback(null, error ? null : bytes);
				});
			}
		};
	},

	Fetch: function (data, x, y, z, callback) {
		var self = this;
		var key = this.CubeKey(x, y, z);

		if (!data.Base || data.Cubes && data.Cubes[key]) {
			callback(null, this.Cube(data, x, y, z));

			return;
		}

		this.$Service('PlanetData').Get(data.Base + 'cubes/' + key + '.json', null, function (error, bytes) {
			var made = null;

			try {
				made = error ? null : JSON.parse(new TextDecoder().decode(bytes));
			}
			catch (wrong) {
				made = null;
			}

			/* What it read kept as the cube; what it could not, made here (the same of the seed). */
			if (made && made.Key === key && Array.isArray(made.Galaxies)) {
				if (!data.Cubes)
					Object.defineProperty(data, 'Cubes', {value: {}, writable: true, configurable: true, enumerable: false});

				data.Cubes[key] = made;
			}

			callback(null, self.Cube(data, x, y, z));
		});
	},

	/* A universe of a store of parts: its passport and its edits; the galaxies written in it read with it. */
	FromStore: function (store, callback) {
		var self = this;

		this.$Service('PlanetData').ReadParts(store, [{Kind: 'universe'}, {Kind: 'edits'}], function (error, list) {
			var data;

			function json (bytes) {
				return bytes ? JSON.parse(typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes)) : null;
			}

			if (error) {
				callback(error);

				return;
			}

			try {
				data = {Manifest: json(list[0]), Edits: json(list[1]) || {Overrides: {}, Removed: [], Added: []}, Galaxies: {}, Source: store};

				if (!data.Manifest || data.Manifest.Format !== 'elemenx-universe')
					throw new Error('UniverseData: not a universe');
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			data.Manifest.Written = data.Manifest.Written || {};

			self.ReadGalaxies(data, store, callback);
		});
	},

	ReadGalaxies: function (data, store, callback) {
		var self = this;
		var ids = Object.keys(data.Manifest.Written);
		var left = ids.length;
		var failed = null;

		if (!left) {
			callback(null, data);

			return;
		}

		ids.forEach(function (id) {
			self.$Service('GalaxyData').Open(self.GalaxyStore(store, id), function (error, galaxy) {
				if (error) failed = failed || error;
				else data.Galaxies[id] = galaxy;

				if (!--left)
					callback(failed, failed ? null : data);
			});
		});
	}
});
