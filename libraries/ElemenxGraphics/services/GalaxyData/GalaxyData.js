/*
 * GalaxyData: a galaxy as data (docs/SPACE-FORMAT.md): its passport, its supermassive black hole at its centre (always
 * there), its stars made of its seed sector by sector as many as a galaxy has (none of them stored), what was changed of
 * it, and the systems of its stars (SystemData) made of their seeds or written.
 * Units: light-years; time in millions of years (Myr). Its plane is X and Z, its north +Y.
 * - Kinds: spiral, barred (a bar across its middle), lenticular (a disc with no arms), elliptical, irregular (clumps of
 *   young stars), dwarf (a small faint sphere), ring (a ring of young stars round an old core).
 * - Make(options): the data of a galaxy of options {Seed, Kind, Name, Radius (ly), Arms, Pitch (degrees), Mass (of its
 *   black hole, Suns), Coordinates ([x, y, z] in megaparsecs: where it is in its universe)}; what is not told, of its
 *   seed and its kind. data is {Manifest, Edits {Overrides: {id: {Name...}}, Removed: [id], Added: [free bodies: {ID,
 *   Kind, Name, Place [x, y, z] ly, Velocity [x, y, z] ly/Myr, Values, Traits}]}, Systems: {id: system data}}.
 * - Density(data, place): stars a cubic light-year at a place (about 0.004 where the Sun is in a galaxy like ours).
 * - Sector(data, x, y, z, limit): the stars of a sector (a cube of Manifest.Sector ly, 100; x, y, z its place in the grid)
 *   made of the seed, the same each time: {Count (how many there are), Stars: [{ID, Name, Place [x, y, z] ly, Mass,
 *   Temperature, Color, Luminosity, Class}] (limit of them at most, an even draw of all)}; its edits over them.
 * - Star(data, id): one star of its ID ('x.y.z-index'), or its black hole ('centre': {ID, Name, Place [0, 0, 0], Mass,
 *   Kind 'blackhole', Luminosity 0}); Position(data, place, time): where a place is after time Myr of
 *   the turning of the galaxy (a flat curve: 220 km/s, 734 ly a Myr at any radius; solid inside 500 ly).
 * - Added(data, time): what was put in it by hand (AddBody) where it is after time Myr: a star (Kind star) goes round the
 *   centre as the others do and is among the stars of its sector, with a system of its own; a body of no system goes along
 *   its Velocity (ly a Myr).
 * - Glow(data, count): points of all of it seen from far, made of its seed: {Positions (ly), Colors (r, g, b, brightness),
 *   Knots, Disc, Bulge}: its light and its dust are drawn of Density along rays by a Scene (SceneGalaxy).
 * - System(data, id): the system of a star (SystemData): written (Systems), else made of its seed with the mass of the star;
 *   of its black hole ('centre'): the hole with its disc and the young stars that go round it close and fast (as S2 round
 *   ours: hundreds to thousands of AU, long thin orbits), made of the seed of the galaxy. Hole(data): its black hole as a
 *   body; HoleSystem(data): the system of it as made of its seed.
 * - Cosmos(data, id): the backdrop of the sky of a system of a star (Cosmos of a Scene): the band of its galaxy across it,
 *   its pole the north of the galaxy as the system lies, as bright as the stars round it are many.
 * - Rename(data, id, name), Remove(data, id), AddBody(data, body), SetSystem(data, id, system): what is changed of it.
 * - Use(key, data), DataOf(key); Open(source, callback), Write(data, store, callback, whole), Save(data), Pack(data,
 *   callback): as SystemData (parts {Kind: 'galaxy'}, {Kind: 'edits'}, those of a system written with System: id).
 */
Elemenx.Service('GalaxyData', {
	$Meta: {
		Description: 'A galaxy as data: its supermassive black hole, its stars made sector by sector of its seed as many as a galaxy holds, its systems, what was changed of it.',
		Methods: ['Kinds()', 'Make(options)', 'Density(data, place)', 'Sector(data, x, y, z, limit)', 'Star(data, id)', 'Hole(data)', 'HoleSystem(data)', 'Position(data, place, time)', 'Added(data, time)', 'Glow(data, count)', 'System(data, id)', 'Cosmos(data, id)', 'Rename(data, id, name)', 'Remove(data, id)', 'AddBody(data, body)', 'SetSystem(data, id, system)', 'Use(key, data)', 'DataOf(key)', 'Open(source, callback)', 'Write(data, store, callback, whole)', 'Save(data)', 'Pack(data, callback)']
	},

	Sets: {},

	/* Stars a cubic light-year in the disc where the Sun is, and its radius in a galaxy like ours. */
	Local: 0.004,

	/* The speed of the turning of a galaxy: 220 km/s, in ly a Myr. */
	Speed: 734,

	Kinds: function () {
		return ['spiral', 'barred', 'lenticular', 'elliptical', 'irregular', 'dwarf', 'ring'];
	},

	Random: function (text) {
		return this.$Service('Random').Sequence(text);
	},

	Make: function (options) {
		var given = options || {};
		var seed = String(given.Seed === undefined ? 'galaxy' : given.Seed);
		var random = this.Random(seed + ':shape');
		var kind = this.Kinds().indexOf(given.Kind) !== -1 ? given.Kind : 'spiral';
		var radius = Number(given.Radius) || {spiral: 50000, barred: 55000, lenticular: 40000, elliptical: 60000, irregular: 15000, dwarf: 4000, ring: 35000}[kind] * (0.8 + random() * 0.4);
		var arms = Number(given.Arms) || (kind === 'spiral' ? 2 + Math.floor(random() * 3) : kind === 'barred' ? 2 : 0);

		return {
			Manifest: {
				Format: 'elemenx-galaxy',
				Version: 1,
				ID: String(given.ID || 'galaxy-' + seed),
				Name: String(given.Name || seed),
				Seed: seed,
				Kind: kind,
				Radius: Math.round(radius),
				Arms: arms,
				Pitch: Number(given.Pitch) || 15 + Math.round(random() * 12),
				Phase: Math.round(random() * 360),
				/* An elliptical one: how flat it is along each axis. */
				Shape: kind === 'elliptical' ? [1, Math.round((0.6 + random() * 0.4) * 100) / 100, Math.round((0.4 + random() * 0.5) * 100) / 100] : [1, 1, 1],
				Centre: {ID: 'centre', Name: 'Centre', Mass: Number(given.Mass) || Math.round(Math.pow(radius / 50000, 2) * 4.1e6)},
				Coordinates: given.Coordinates || [0, 0, 0],
				Sector: 100,
				Systems: {}
			},
			Edits: {Overrides: {}, Removed: [], Added: []},
			Systems: {}
		};
	},

	/* The numbers of its shape: scale lengths and heights of its parts, ly. */
	Shape: function (manifest) {
		var r = manifest.Radius;

		return {Disc: r / 4.5, Height: 1000 * Math.max(0.3, r / 50000), Bulge: r * 0.045, Bar: manifest.Kind === 'barred' ? r * 0.22 : 0, Ring: r * 0.62, Width: r * 0.06};
	},

	/*
	 * How much of its disc is in its arms at a place (1 for no arms): the arms of a logarithmic spiral, softly, bent here
	 * and there and branching as the arms of real galaxies do (a noise of its seed a sixth of it wide).
	 */
	Arm: function (manifest, x, z, shift) {
		var radius = Math.sqrt(x * x + z * z);
		var noise = this.BendNoise || (this.BendNoise = {});
		var size = manifest.Radius / 6;
		var angle;
		var wave;

		if (!manifest.Arms || radius < 1) return 1;

		noise[manifest.Seed] = noise[manifest.Seed] || this.$Service('Noise').Make({Type: 'simplex', Seed: manifest.Seed + ':bends', Fractal: 'fbm', Octaves: 3});

		angle = Math.atan2(z, x) - Math.log(radius / 1000) / Math.tan(manifest.Pitch * Math.PI / 180) - manifest.Phase * Math.PI / 180 - (shift || 0) + (noise[manifest.Seed].At(x / size, 1.5, z / size) - 0.5) * 1.6;
		wave = 0.5 + 0.5 * Math.cos(manifest.Arms * angle);

		return 0.3 + 1.7 * Math.pow(wave, 2.2);
	},

	Density: function (data, place) {
		var m = data.Manifest;
		var s = this.Shape(m);
		var x = place[0];
		var y = place[1];
		var z = place[2];
		var radius = Math.sqrt(x * x + z * z);
		var r = Math.sqrt(x * x + y * y + z * z);
		/* The disc of an Earth-like neighbourhood: 0.004 at 54% of the radius of the galaxy. */
		var disc = this.Local / Math.exp(-0.54 * m.Radius / s.Disc) * Math.exp(-radius / s.Disc) * Math.exp(-Math.abs(y) / s.Height);
		var bulge = 3 * Math.exp(-Math.sqrt(x * x + z * z + y * y * 2.5) / s.Bulge);
		var e;
		var q;
		var bar;

		if (m.Kind === 'elliptical') {
			q = Math.sqrt(x * x / (m.Shape[0] * m.Shape[0]) + y * y / (m.Shape[2] * m.Shape[2]) + z * z / (m.Shape[1] * m.Shape[1]));
			e = m.Radius * 0.22;

			return 0.01 * Math.exp(-7.67 * (Math.pow(Math.max(1e-6, q / e), 0.25) - 1));
		}

		if (m.Kind === 'dwarf')
			return 0.02 * Math.pow(1 + r * r / Math.pow(m.Radius * 0.25, 2), -2.5);

		if (m.Kind === 'ring')
			return bulge * 0.5 + this.Local * 2 * Math.exp(-Math.pow((radius - s.Ring) / s.Width, 2)) * Math.exp(-Math.abs(y) / s.Height);

		if (m.Kind === 'irregular')
			return disc * (0.3 + 1.7 * this.Clumps(data, x, y, z)) + bulge * 0.05;

		if (m.Kind === 'barred') {
			bar = Math.exp(-Math.pow(this.Along(m, x, z) / s.Bar, 2) - Math.pow(this.Across(m, x, z) / (s.Bar * 0.18), 2) - Math.pow(y / (s.Bar * 0.15), 2));

			return disc * (radius > s.Bar ? this.Arm(m, x, z) : 1) + bulge + bar * 1.5;
		}

		if (m.Kind === 'lenticular')
			return disc * 1.2 + bulge * 1.4;

		return disc * this.Arm(m, x, z) + bulge;
	},

	/* Along and across the bar of a barred galaxy, ly. */
	Along: function (m, x, z) {
		var a = m.Phase * Math.PI / 180;

		return x * Math.cos(a) + z * Math.sin(a);
	},

	Across: function (m, x, z) {
		var a = m.Phase * Math.PI / 180;

		return -x * Math.sin(a) + z * Math.cos(a);
	},

	/* The clumps of an irregular galaxy: 0 to 1, of a noise of its seed. */
	Clumps: function (data, x, y, z) {
		var noise = this.Noise || (this.Noise = {});
		var key = data.Manifest.Seed;

		noise[key] = noise[key] || this.$Service('Noise').Make({Type: 'simplex', Seed: key + ':clumps', Fractal: 'fbm', Octaves: 3});

		return Math.pow(noise[key].At(x / 4000, y / 4000, z / 4000), 2) * 2;
	},

	/* A mass of a star of the stars as they are born (most of them small red dwarfs): Suns. */
	MassOf: function (u) {
		return Math.min(60, 0.08 * Math.pow(1 - u * 0.999, -1 / 1.35));
	},

	SectorKey: function (x, y, z) {
		return x + '.' + y + '.' + z;
	},

	Sector: function (data, x, y, z, limit) {
		var self = this;
		var m = data.Manifest;
		var size = m.Sector;
		var middle = [(x + 0.5) * size, (y + 0.5) * size, (z + 0.5) * size];
		var key = this.SectorKey(x, y, z);
		var random = this.Random(m.Seed + ':sector:' + key);
		var mean = this.Density(data, middle) * size * size * size;
		var count = Math.max(0, Math.round(mean + Math.sqrt(mean) * (random() + random() + random() - 1.5) * 1.4));
		var take = Math.min(count, limit === undefined ? count : Math.max(0, Math.floor(limit)));
		var astronomy = this.$Service('Astronomy');
		var removed = {};
		var stars = [];
		var i;

		(data.Edits.Removed || []).forEach(function (id) {
			removed[id] = true;
		});

		/* An even draw of all: each star of its own sequence, so the first ones of a sector are the same however many are asked for. */
		for (i = 0; i < take; i++) {
			var id = key + '-' + i;
			var own = self.Random(m.Seed + ':star:' + id);
			var mass = Math.round(self.MassOf(own()) * 1000) / 1000;
			var star = astronomy.Star({Mass: mass});
			var place = [(x + own()) * size, (y + own()) * size, (z + own()) * size];
			var over = data.Edits.Overrides[id] || {};

			if (removed[id]) continue;

			stars.push({ID: id, Name: over.Name || self.Catalogue(m, id), Place: place, Mass: mass, Temperature: Math.round(star.Temperature), Color: star.Color, Luminosity: star.Luminosity, Class: star.Class});
		}

		/* The stars put in it by hand (AddBody with Kind star) whose place is in this sector. */
		(data.Edits.Added || []).forEach(function (body) {
			var place = body.Place || [0, 0, 0];
			if (body.Kind !== 'star' || removed[body.ID] || Math.floor(place[0] / size) !== x || Math.floor(place[1] / size) !== y || Math.floor(place[2] / size) !== z) return;

			stars.push(self.AddedStar(body));
		});

		return {Key: key, Count: count, Stars: stars};
	},

	/* The name of a star in the catalogue of its galaxy: its initials, its sector and its number. */
	Catalogue: function (m, id) {
		return String(m.Name).slice(0, 3).toUpperCase() + ' ' + id;
	},

	Star: function (data, id) {
		/* Its black hole, at its centre: one of its bodies too, with a system of its own. */
		if (id === 'centre')
			return this.Hole(data);

		/* Its sector may be at a place below 0 ('3.-1.-2-14'): its number is after the last dash. */
		var text = String(id);
		var added = (data.Edits.Added || []).filter(function (body) {
			return body.ID === id && body.Kind === 'star';
		})[0];
		var dash = text.lastIndexOf('-');
		var at = text.slice(0, dash).split('.').map(Number);
		var index = Number(text.slice(dash + 1));
		var made;

		if (added)
			return data.Edits.Removed.indexOf(id) === -1 ? this.AddedStar(added) : null;

		if (dash < 1 || at.length !== 3 || at.some(isNaN) || isNaN(index)) return null;

		made = this.Sector(data, at[0], at[1], at[2], index + 1);

		return made.Stars.filter(function (star) {
			return star.ID === id;
		})[0] || null;
	},

	/* Its supermassive black hole as a body of it: at its centre, dark, its disc a warm glow. */
	Hole: function (data) {
		var centre = data.Manifest.Centre;
		var over = data.Edits.Overrides.centre || {};

		return {ID: 'centre', Name: over.Name || centre.Name || 'Centre', Place: [0, 0, 0], Mass: centre.Mass, Temperature: 0, Color: '#ffb070', Luminosity: 0, Class: 'SMBH', Kind: 'blackhole'};
	},

	/* The system of its black hole: the hole, its disc, the young stars close round it on long thin orbits (AU). */
	HoleSystem: function (data) {
		var hole = this.Hole(data);
		var random = this.Random(data.Manifest.Seed + ':centre-system');
		var stars = [];
		var count = 12 + Math.floor(random() * 6);
		var i;
		var mass;

		for (i = 0; i < count; i++) {
			mass = Math.round((3 + random() * 14) * 10) / 10;

			stars.push({ID: 's' + (i + 1), Kind: 'star', Values: {Name: 'S' + (i + 1)}, Traits: {Star: {Mass: mass}, Orbit: {Distance: Math.round(150 * Math.pow(40, random())), Eccentricity: Math.round((0.15 + random() * 0.8) * 100) / 100, Inclination: Math.round(random() * 180), Node: Math.round(random() * 360), Periapsis: Math.round(random() * 360), Anomaly: Math.round(random() * 360), Unit: 'AU'}}});
		}

		return this.$Service('SystemData').Make({Objects: [{ID: 'hole', Kind: 'blackhole', Values: {Name: hole.Name}, Traits: {BlackHole: {Mass: hole.Mass, Disk: true, Inner: 3, Outer: 18}}, Children: stars}]}, {ID: 'centre', Name: hole.Name});
	},

	/* A star put in by hand, as the stars of its sectors are: of its mass (1 Sun when not told). */
	AddedStar: function (body) {
		var mass = Number(body.Mass) > 0 ? Number(body.Mass) : 1;
		var star = this.$Service('Astronomy').Star({Mass: mass});

		return {ID: body.ID, Name: body.Name || body.ID, Place: (body.Place || [0, 0, 0]).slice(), Mass: mass, Temperature: Math.round(star.Temperature), Color: star.Color, Luminosity: star.Luminosity, Class: star.Class, Added: true};
	},

	/*
	 * What was put in it by hand where it is after time Myr: each {ID, Kind, Name, Place, Velocity, Star} (a star goes
	 * round the centre as the others do, a body of no system along its own Velocity, light-years a Myr).
	 */
	Added: function (data, time) {
		var self = this;
		var t = Number(time) || 0;

		return (data.Edits.Added || []).filter(function (body) {
			return data.Edits.Removed.indexOf(body.ID) === -1;
		}).map(function (body) {
			var place = body.Place || [0, 0, 0];
			var velocity = body.Velocity || [0, 0, 0];

			return Object.assign({}, body, {Place: body.Kind === 'star' ? self.Position(data, place, t) : [place[0] + velocity[0] * t, place[1] + velocity[1] * t, place[2] + velocity[2] * t], Star: body.Kind === 'star'});
		});
	},

	Position: function (data, place, time) {
		var radius = Math.sqrt(place[0] * place[0] + place[2] * place[2]);
		var angle = -(Number(time) || 0) * this.Speed / Math.max(500, radius);

		return [place[0] * Math.cos(angle) - place[2] * Math.sin(angle), place[1], place[0] * Math.sin(angle) + place[2] * Math.cos(angle)];
	},

	/*
	 * Its light seen from far, made of its seed as the pictures of real galaxies show them: points of the light of its
	 * stars (Positions, Colors: r, g, b and brightness), old ones creamy, those of its arms bluish white and torn in flocks;
	 * Knots, the bright knots of young stars and the pink clouds where they are born along its arms; Disc, its disc
	 * ({Scale, Radius (ly), Arms, Pitch, Phase, Ring, Width, Bright}); Bulge, its smooth middle ({Radius (ly, of its scale),
	 * Flat (its height to its width), Color, Bright}) that hides its black hole. Its light and its dust themselves are
	 * drawn along rays by SceneGalaxy, the same shape.
	 */
	Glow: function (data, count) {
		var self = this;
		var m = data.Manifest;
		var s = this.Shape(m);
		var random = this.Random(m.Seed + ':glow');
		var positions = [];
		var colors = [];
		var knots = {Positions: [], Colors: []};
		var total = Math.max(1, Math.round(count || 60000));
		var made = 0;
		var tries = 0;
		var parts = m.Kind === 'elliptical' || m.Kind === 'dwarf' ? {Sphere: 1} : m.Kind === 'ring' ? {Bulge: 0.15, Ring: 0.6, Disc: 0.25} : m.Kind === 'lenticular' ? {Bulge: 0.25, Disc: 0.75} : m.Kind === 'irregular' ? {Clump: 0.9, Bulge: 0.1} : m.Kind === 'barred' ? {Bulge: 0.08, Bar: 0.14, Disc: 0.78} : {Bulge: 0.1, Disc: 0.9};
		var bulges = {spiral: [1.5, 0.62], barred: [1.25, 0.75], lenticular: [1.7, 0.55], elliptical: [0, 1], dwarf: [0, 1], irregular: [0.4, 0.8], ring: [1.3, 0.7]};
		var middle = bulges[m.Kind] || bulges.spiral;

		function gamma (k) {
			var product = 1;
			var i;

			for (i = 0; i < k; i++)
				product *= Math.max(1e-9, random());

			return -Math.log(product);
		}

		function laplace (scale) {
			return (random() < 0.5 ? -1 : 1) * -Math.log(Math.max(1e-9, random())) * scale;
		}

		function direction () {
			var u = random() * 2 - 1;
			var a = random() * Math.PI * 2;
			var w = Math.sqrt(1 - u * u);

			return [w * Math.cos(a), u, w * Math.sin(a)];
		}

		function put (p, color, bright) {
			positions.push(p[0], p[1], p[2]);
			colors.push(color[0], color[1], color[2], bright);

			made++;
		}

		function knot (p, color, bright) {
			knots.Positions.push(p[0], p[1], p[2]);
			knots.Colors.push(color[0], color[1], color[2], bright);
		}

		/* A place of its disc: as far out as its light goes, then the arms (and their flocks) take or leave it. */
		function disc () {
			var radius = gamma(2) * s.Disc;
			var a = random() * Math.PI * 2;
			var x = radius * Math.cos(a);
			var z = radius * Math.sin(a);
			var arm = self.Arm(m, x, z);
			var flock = self.Flocks(data, x, z);
			var young;

			if (radius > m.Radius * 1.15 || random() * 2.4 > arm * (0.25 + flock * 1.5)) return;

			young = arm > 1.1 && random() < 0.6;

			put([x, laplace(s.Height) * (young ? 0.4 : 1), z], young ? [0.66, 0.78, 1] : [1, 0.9, 0.78], young ? 0.85 : 0.3);

			/* The young stars of an arm gather in knots: bright blue white, a few pink where they are still born. */
			if (young && flock > 0.62 && random() < 0.3)
				knot([x + laplace(60), laplace(s.Height * 0.2), z + laplace(60)], random() < 0.15 ? [1, 0.5, 0.66] : [0.7, 0.84, 1], 0.6 + random() * 0.8);
		}

		function bulge () {
			var p = direction();
			var r = gamma(3) * s.Bulge * 0.6 * Math.max(0.6, middle[0]);

			put([p[0] * r, p[1] * r * middle[1], p[2] * r], [1, 0.84, 0.62], 0.7);
		}

		function sphere () {
			var p = direction();
			var r = m.Kind === 'dwarf' ? m.Radius * 0.25 / Math.sqrt(Math.max(1e-6, Math.pow(Math.max(1e-6, random()), -2 / 3) - 1)) : gamma(3) * m.Radius * 0.08;
			if (r > m.Radius * 1.3) return;

			put([p[0] * r * m.Shape[0], p[1] * r * m.Shape[2], p[2] * r * m.Shape[1]], [1, 0.84, 0.64], 0.55);
		}

		function ring () {
			var radius = s.Ring + (random() + random() + random() - 1.5) * s.Width * 1.4;
			var a = random() * Math.PI * 2;
			var x = radius * Math.cos(a);
			var z = radius * Math.sin(a);
			if (random() > 0.35 + self.Flocks(data, x, z) * 0.9) return;

			put([x, laplace(s.Height * 0.5), z], [0.66, 0.78, 1], 0.9);

			if (random() < 0.08)
				knot([x, laplace(s.Height * 0.2), z], random() < 0.2 ? [1, 0.5, 0.66] : [0.7, 0.84, 1], 0.6 + random() * 0.8);
		}

		function clump () {
			var radius = gamma(2) * s.Disc;
			var a = random() * Math.PI * 2;
			var x = radius * Math.cos(a);
			var z = radius * Math.sin(a);
			var y = laplace(s.Height * 2);
			var c = self.Clumps(data, x, y, z) / 2;
			if (random() > Math.pow(c, 1.5) * 0.95 + 0.03) return;

			put([x, y, z], random() < 0.7 ? [0.66, 0.78, 1] : [1, 0.86, 0.72], 0.85);

			if (c > 0.55 && random() < 0.12)
				knot([x, y, z], random() < 0.3 ? [1, 0.5, 0.66] : [0.7, 0.84, 1], 0.6 + random() * 0.8);
		}

		/* The bar of a barred galaxy: old stars along a line across its middle, its arms from its ends. */
		function bar () {
			var along = (random() + random() + random() - 1.5) * s.Bar * 1.4;
			var across = (random() + random() - 1) * s.Bar * 0.2;
			var turn = m.Phase * Math.PI / 180;

			put([along * Math.cos(turn) - across * Math.sin(turn), laplace(s.Bar * 0.08), along * Math.sin(turn) + across * Math.cos(turn)], [1, 0.84, 0.62], 0.75);
		}

		var makers = {Disc: disc, Bulge: bulge, Sphere: sphere, Ring: ring, Clump: clump, Bar: bar};
		var names = Object.keys(parts);

		while (made < total && tries < total * 40) {
			var pick = random();
			var sum = 0;
			var k;

			tries++;

			for (k = 0; k < names.length; k++) {
				sum += parts[names[k]];

				if (pick <= sum || k === names.length - 1) {
					makers[names[k]]();

					break;
				}
			}
		}

		return {
			Positions: positions,
			Colors: colors,
			Knots: knots,
			/* Its disc as one smooth light under the points: {Scale, Radius (ly), Arms, Pitch, Phase, Ring (ly: the radius of a ring, 0 none), Bright}. */
			Disc: {Scale: s.Disc, Radius: m.Radius, Arms: m.Arms, Pitch: m.Pitch, Phase: m.Phase, Ring: m.Kind === 'ring' ? s.Ring : 0, Width: s.Width, Bright: {spiral: 1, barred: 1, lenticular: 1.1, ring: 0.7, irregular: 0.35}[m.Kind] || 0},
			Bulge: m.Kind === 'elliptical' ? {Radius: m.Radius * 0.07, Flat: m.Shape[2], Color: [1, 0.84, 0.64], Bright: 1} : m.Kind === 'dwarf' ? {Radius: m.Radius * 0.2, Flat: 1, Color: [1, 0.86, 0.7], Bright: 0.35} : {Radius: s.Bulge * middle[0], Flat: middle[1], Color: [1, 0.86, 0.64], Bright: middle[0] ? 1 : 0}
		};
	},

	/* The flocks of the arms: 0 to 1, a noise of its seed about a twentieth of it wide, its ridges the threads of the arms. */
	Flocks: function (data, x, z) {
		var noise = this.FlockNoise || (this.FlockNoise = {});
		var key = data.Manifest.Seed;
		var size = data.Manifest.Radius / 14;

		noise[key] = noise[key] || this.$Service('Noise').Make({Type: 'simplex', Seed: key + ':flocks', Fractal: 'fbm', Octaves: 4});

		return Math.max(0, Math.min(1, (noise[key].At(x / size, 0.5, z / size) - 0.3) * 2.2));
	},

	System: function (data, id) {
		var systems = this.$Service('SystemData');
		var star = this.Star(data, id);
		var made;

		if (data.Systems[id])
			return data.Systems[id];

		if (id === 'centre') {
			data.Systems[id] = this.HoleSystem(data);

			return data.Systems[id];
		}

		made = systems.Make({Seed: data.Manifest.Seed + ':' + id, Options: star ? {Mass: star.Mass, Name: star.Name} : {}}, {ID: id, Name: star ? star.Name : id});

		data.Systems[id] = made;

		return made;
	},

	/* The direction of the north of its galaxy as a system of a star lies (its plane tilted as its seed says). */
	Pole: function (data, id) {
		var random = this.Random(data.Manifest.Seed + ':pole:' + id);
		var tilt = random() * Math.PI;
		var turn = random() * Math.PI * 2;

		return [Math.sin(tilt) * Math.cos(turn), Math.cos(tilt), Math.sin(tilt) * Math.sin(turn)];
	},

	Cosmos: function (data, id) {
		var star = this.Star(data, id);
		var density = star ? this.Density(data, star.Place) : this.Local;

		return {Kind: 'galaxy', Seed: data.Manifest.Seed + ':' + id, Pole: this.Pole(data, id), Band: Math.max(0.2, Math.min(1, 0.35 + Math.log(Math.max(1e-6, density / this.Local)) * 0.15)), Stars: Math.max(0.3, Math.min(1, 0.5 + Math.log(Math.max(1e-6, density / this.Local)) * 0.1))};
	},

	Rename: function (data, id, name) {
		data.Edits.Overrides[id] = Object.assign({}, data.Edits.Overrides[id] || {}, {Name: String(name)});

		this.$Service('PlanetData').Mark(data, {Kind: 'edits'});
	},

	Remove: function (data, id) {
		if (data.Edits.Removed.indexOf(id) === -1)
			data.Edits.Removed.push(id);

		this.$Service('PlanetData').Mark(data, {Kind: 'edits'});
	},

	/* A body of no system (a rogue planet, an interstellar station, a wandering black hole): its place and its velocity. */
	AddBody: function (data, body) {
		data.Edits.Added = data.Edits.Added.filter(function (one) {
			return one.ID !== body.ID;
		}).concat([JSON.parse(JSON.stringify(body))]);

		this.$Service('PlanetData').Mark(data, {Kind: 'edits'});
	},

	SetSystem: function (data, id, system) {
		data.Systems[id] = system;
		data.Manifest.Systems[id] = {Part: true};

		this.$Service('PlanetData').Mark(data, {Kind: 'galaxy'});

		data.SystemsChanged = data.SystemsChanged || {};
		data.SystemsChanged[id] = true;
	},

	/* The store of the parts of a system written in it: each part with System: id. */
	SystemStore: function (store, id) {
		function of (part) {
			return Object.assign({}, part, {System: id});
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
		var systems = this.$Service('SystemData');
		var done = typeof callback === 'function' ? callback : function () {};
		var own = whole || !data.Dirty ? [{Kind: 'galaxy'}, {Kind: 'edits'}] : Object.keys(data.Dirty).map(function (key) {
			return data.Dirty[key].Part;
		});
		var written = Object.keys(data.Systems || {}).filter(function (id) {
			return data.Manifest.Systems[id] && (whole || (data.SystemsChanged || {})[id] || data.Systems[id].Dirty && Object.keys(data.Systems[id].Dirty).length);
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
			data.SystemsChanged = {};

			done(null);
		}

		planets.WriteParts(store, own, own.map(function (part) {
			return new TextEncoder().encode(JSON.stringify(part.Kind === 'galaxy' ? data.Manifest : data.Edits, null, part.Kind === 'galaxy' ? '\t' : undefined));
		}), finish);

		written.forEach(function (id) {
			systems.Write(data.Systems[id], self.SystemStore(store, id), finish, whole || (data.SystemsChanged || {})[id]);
		});
	},

	Path: function (part) {
		var systems = this.$Service('SystemData');
		var own = Object.assign({}, part);

		if (part.System !== undefined && part.System !== null) {
			delete own.System;

			return 'systems/' + encodeURIComponent(part.System) + '/' + systems.Path(own);
		}

		return part.Kind === 'galaxy' ? 'galaxy.json' : 'edits.json';
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

		if (source && source.Manifest && source.Manifest.Format === 'elemenx-galaxy') {
			done(null, source);

			return;
		}

		if (source && typeof source.Read === 'function') {
			this.FromStore(source, done);

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
				done(reader.error || new Error('GalaxyData: the file was not read'));
			};

			reader.readAsArrayBuffer(source);

			return;
		}

		done(new Error('GalaxyData: not a galaxy'));
	},

	/* A galaxy of a store of parts: its passport and its edits; its systems written in it as they are asked for (System). */
	FromStore: function (store, callback) {
		var self = this;

		this.$Service('PlanetData').ReadParts(store, [{Kind: 'galaxy'}, {Kind: 'edits'}], function (error, list) {
			var data;

			function json (bytes) {
				return bytes ? JSON.parse(typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes)) : null;
			}

			if (error) {
				callback(error);

				return;
			}

			try {
				data = {Manifest: json(list[0]), Edits: json(list[1]) || {Overrides: {}, Removed: [], Added: []}, Systems: {}, Source: store};

				if (!data.Manifest || data.Manifest.Format !== 'elemenx-galaxy')
					throw new Error('GalaxyData: not a galaxy');
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			data.Manifest.Systems = data.Manifest.Systems || {};

			/* Its systems written in it: read now (they are few), each a system of its parts in the store. */
			self.ReadSystems(data, store, callback);
		});
	},

	ReadSystems: function (data, store, callback) {
		var self = this;
		var ids = Object.keys(data.Manifest.Systems);
		var left = ids.length;
		var failed = null;

		if (!left) {
			callback(null, data);

			return;
		}

		ids.forEach(function (id) {
			self.$Service('SystemData').Open(self.SystemStore(store, id), function (error, system) {
				if (error) failed = failed || error;
				else data.Systems[id] = system;

				if (!--left)
					callback(failed, failed ? null : data);
			});
		});
	}
});
