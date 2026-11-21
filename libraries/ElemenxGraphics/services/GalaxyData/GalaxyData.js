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
 *   Temperature, Color, Luminosity, Class, Type (Astronomy.Types: a few white and brown dwarfs, rare giants and what heavy stars left), Kind
 *   (of a Scene)}] (limit of them at most, an even draw of all)}; its edits over them.
 * - Star(data, id): one star of its ID ('x.y.z-index'), or its black hole ('centre': {ID, Name, Place [0, 0, 0], Mass,
 *   Kind 'blackhole', Luminosity 0}); Position(data, place, time): where a place is after time Myr of
 *   the turning of the galaxy (a flat curve: 220 km/s, 734 ly a Myr at any radius; solid inside 500 ly).
 * - Added(data, time): what was put in it by hand (AddBody) where it is after time Myr: a star (Kind star) goes round the
 *   centre as the others do and is among the stars of its sector, with a system of its own; a body of no system goes along
 *   its Velocity (ly a Myr).
 * - Glow(data, count): points of all of it seen from far, made of its seed: {Positions (ly), Colors (r, g, b, brightness),
 *   Knots, Disc, Bulge}: its light and its dust are drawn of Density along rays by a Scene (SceneGalaxy).
 * - BulgeOf(manifest): its smooth middle {Radius (ly), Flat, Color, Bright}, the Bulge of Glow; StructureGLSL: the light of
 *   its parts but its arms in GLSL (galaxy_old, galaxy_thin, galaxy_thick, galaxy_halo, galaxy_bulge), one for the galaxy
 *   seen from far (SceneGalaxy) and its band seen from within (SceneCosmos).
 * - System(data, id): the system of a star (SystemData): written (Systems), else made of its seed with the mass of the star;
 *   of its black hole ('centre'): the hole with its disc and the young stars that go round it close and fast (as S2 round
 *   ours: hundreds to thousands of AU, long thin orbits), made of the seed of the galaxy. Hole(data): its black hole as a
 *   body; HoleSystem(data): the system of it as made of its seed, its stars with the planets their room round the hole
 *   leaves them, the old stars of its nuclear cluster a swarm round it (Cluster).
 * - Cluster(options): a star cluster as a system {Seed, Type (open, globular, nuclear), Name, Count, Radius (ly), Mass}:
 *   its middle with the trait Cluster {Type, Radius, Count, Seed} (the swarm of its stars not told one by one), its
 *   stars round it on orbits of the profile of Plummer, each with the planets and stations its sphere of Hill leaves it.
 * - Search(data, options): what of it lies round a place and is as asked (a type, a class, a mass, a temperature, a
 *   text, what was edited), the nearest first, at most Limit: {Items, More, Partial}.
 * - Knots(data): the knots where its stars are born, as its picture draws them ({Grids: [{Cell, Count, Half, Data}]}): each
 *   one of its nebulae, a region where stars are born.
 * - Objects(data): its nebulae and star clusters made of its seed ({ID, Kind, Type, Subtype, Name, Place, Radius, Seed}),
 *   ObjectOf(data, id) one of them, ObjectSystem(data, id) its scene as a system (Star and System take their IDs too: they
 *   are entered as a star is).
 * - Cosmos(data, id): the backdrop of the sky of a system of a star (Cosmos of a Scene): the band of this very galaxy
 *   across it, as seen from where the star lies (Galaxy: its manifest, Place), its pole the north of the galaxy as the
 *   system lies, its stars as many as round it.
 * - Code(), IR(): the arms of a galaxy of one source (Kernel, the kernel language: gx_turn, gx_bend, gx_wave, gx_arm on
 *   the noise of gradients of Noise) as js and as the IR of a graph of Blueprints; Spiral(data): the arms of a galaxy of
 *   its graph (data.Graph, a Scene gives it its own; SceneBlueprints.Galaxy), what its stars, its knots and its picture
 *   alike lie on; SeedNumber(manifest): the number of its seed for its noise.
 * - Rename(data, id, name), Remove(data, id), AddBody(data, body), SetSystem(data, id, system): what is changed of it.
 * - Use(key, data), DataOf(key); Open(source, callback), Write(data, store, callback, whole), Save(data), Pack(data,
 *   callback): as SystemData (parts {Kind: 'galaxy'}, {Kind: 'edits'}, those of a system written with System: id).
 */
Elemenx.Service('GalaxyData', {
	$Meta: {
		Description: 'A galaxy as data: its supermassive black hole, its stars made sector by sector of its seed as many as a galaxy holds, its systems, what was changed of it.',
		Methods: ['Kinds()', 'Make(options)', 'Density(data, place)', 'Sector(data, x, y, z, limit)', 'Search(data, options)', 'Star(data, id)', 'Hole(data)', 'HoleSystem(data)', 'Cluster(options)', 'Objects(data)', 'Knots(data)', 'ObjectOf(data, id)', 'ObjectSystem(data, id)', 'Position(data, place, time)', 'Added(data, time)', 'Glow(data, count)', 'System(data, id)', 'Cosmos(data, id)', 'Code()', 'IR()', 'Spiral(data)', 'SeedNumber(manifest)', 'Rename(data, id, name)', 'Remove(data, id)', 'AddBody(data, body)', 'SetSystem(data, id, system)', 'Use(key, data)', 'DataOf(key)', 'Open(source, callback)', 'Write(data, store, callback, whole)', 'Save(data)', 'Pack(data, callback)']
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

	/* The middle of each kind of galaxy: [how large its bulge is, of the bulge of its shape; how flat it is]. */
	Bulges: {spiral: [1.5, 0.62], barred: [1.25, 0.75], lenticular: [1.7, 0.55], elliptical: [0, 1], dwarf: [0, 1], irregular: [0.4, 0.8], ring: [1.3, 0.7]},

	/*
	 * Its smooth middle as its glow and its shaders draw it, from outside (SceneGalaxy) and from within (SceneCosmos):
	 * {Radius (ly), Flat, Color, Bright}.
	 */
	BulgeOf: function (manifest) {
		var m = manifest;
		var middle = this.Bulges[m.Kind] || this.Bulges.spiral;

		if (m.Kind === 'elliptical')
			return {Radius: m.Radius * 0.07, Flat: m.Shape[2], Color: [1, 0.84, 0.64], Bright: 1};

		if (m.Kind === 'dwarf')
			return {Radius: m.Radius * 0.2, Flat: 1, Color: [1, 0.86, 0.7], Bright: 0.35};

		return {Radius: this.Shape(m).Bulge * middle[0], Flat: middle[1], Color: [1, 0.86, 0.64], Bright: middle[0] ? 1 : 0};
	},

	/*
	 * The light of the parts of a galaxy but its arms, in GLSL, at p (kly, of its frame), r across its plane and z up from
	 * it: its old stars warm in its middle and bluer outward (galaxy_old), its thin disc and its thick one (galaxy_thin,
	 * galaxy_thick: of its Disc and its Height), its halo, its bulge (of BulgeOf: a Sersic-like glow, its nucleus a point in
	 * it) with its bar. One for its look from outside (SceneGalaxy) and from within (SceneCosmos): the band of a galaxy
	 * seen from a star of it is of the numbers of the galaxy seen from far. Regression: written twice, the two drifted (a
	 * thick disc of 0.08 against 0.03, a bar of other widths, a bulge of another curve and colour).
	 */
	StructureGLSL: [
		'const vec3 lightOld = vec3(1.0, 0.86, 0.66);',
		'const vec3 lightYoung = vec3(0.5, 0.66, 1.0);',
		'const vec3 lightBulge = vec3(1.0, 0.8, 0.55);',
		'vec3 galaxy_old(float r, float radius) {',
		'	return mix(lightOld, vec3(0.78, 0.84, 1.0), smoothstep(radius * 0.12, radius * 0.6, r));',
		'}',
		'float galaxy_thin(float r, float z, float scale, float height) {',
		'	return exp(-r / scale - z / height);',
		'}',
		'float galaxy_thick(float r, float z, float scale, float height) {',
		'	return exp(-r / (scale * 1.25) - z / (height * 3.0)) * 0.03;',
		'}',
		'float galaxy_halo(vec3 p, float radius) {',
		'	return exp(-length(p) / (radius * 0.25)) * 0.0012;',
		'}',
		'float galaxy_bulge(vec3 p, float bulge, float squash, float bright, float bar, float phase) {',
		'	float rb = length(vec3(p.x, p.y / max(squash, 0.05), p.z)) / max(bulge * 0.7, 1e-4);',
		'	float light = exp(-pow(rb + 0.02, 0.55) * 3.2) * bright * 5.0 + exp(-length(p) / max(bulge * 0.04, 1e-4)) * 6.0;',
		'	if (bar > 0.0) {',
		'		float along = p.x * cos(phase) + p.z * sin(phase);',
		'		float across = -p.x * sin(phase) + p.z * cos(phase);',
		'		light += exp(-pow(along / bar, 2.0) - pow(across / (bar * 0.2), 2.0) - pow(p.y / (bar * 0.12), 2.0)) * 1.4;',
		'	}',
		'	return light;',
		'}'
	].join('\n'),

	/* The numbers of its shape: scale lengths and heights of its parts, ly. */
	Shape: function (manifest) {
		var r = manifest.Radius;

		return {Disc: r / 4.5, Height: 1000 * Math.max(0.3, r / 50000), Bulge: r * 0.045, Bar: manifest.Kind === 'barred' ? r * 0.22 : 0, Ring: r * 0.62, Width: r * 0.06};
	},

	/*
	 * The arms of a galaxy in the kernel language of Elemenx.Compilers (on the noise of gradients of the Kernel of the Noise
	 * Service): one source for the page (its stars, its knots, its nebulae) and for a shader (its picture, the band of it
	 * across the sky of a system, the galaxies far off), so that all of them lie on the very same arms. Kilo-light-years,
	 * radians; a graph of numbers of Blueprints is made of its blocks (blueprints/shader/galaxy, Spiral).
	 */
	Kernel: [
		'/* Where a place of its plane stands round its spiral: its angle less the turns of a log spiral out to it. */',
		'float gx_turn(float x, float z, float scale, float pitch, float phase) {',
		'	float r = sqrt(x * x + z * z);',
		'	return atan2(z, x) - log(max(r, 0.02) / max(scale, 0.001)) / tan(pitch) - phase;',
		'}',
		'/* Its arms bent here and there and branching: a noise of gradients a sixth of it wide (bend: how much, radians). */',
		'float gx_bend(float x, float z, float radius, float seed, float bend) {',
		'	float size = radius / 6.0;',
		'	return (n_slopes(x / size + seed, 1.5 / size + seed, z / size + seed) - 0.5) * bend;',
		'}',
		'/* The wave of its arms, 0 to 1, shifted inward (radians) for its dust. */',
		'float gx_wave(float turn, float bend, float arms, float shift) {',
		'	return 0.5 + 0.5 * cos(arms * (turn + bend - shift));',
		'}',
		'/* How much of its disc is in its arms there: low between them, low + high on their ridges. */',
		'float gx_arm(float wave, float low, float high, float power) {',
		'	return low + high * pow(max(wave, 0.0), power);',
		'}'
	].join('\n'),

	/* The functions of its Kernel as js (with the noise they call), made once. */
	Code: function () {
		var self = this;

		if (!this.Made) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'js', Value: this.$Service('Noise').Kernel + '\n' + this.Kernel, Entry: 'galaxy'}, function (error, result) {
				if (error)
					throw error;

				self.Made = new Function(result.Value)();
			});
		}

		return this.Made;
	},

	/* Its Kernel in the IR of Elemenx.Compilers, with the noise it calls (for Blueprints.Numeric), made once. */
	IR: function () {
		var self = this;

		if (!this.IRMade) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'ir', Value: this.$Service('Noise').Kernel + '\n' + this.Kernel}, function (error, result) {
				if (error)
					throw error;

				self.IRMade = result.Value;
			});
		}

		return this.IRMade;
	},

	/* The number of its seed for its noise (a shift of its coordinates), the same in the page and in its shaders. */
	SeedNumber: function (manifest) {
		var seed = 0;
		var text = String(manifest.Seed);
		var i;

		for (i = 0; i < text.length; i++)
			seed = (seed * 31 + text.charCodeAt(i)) % 997;

		return seed / 10;
	},

	/*
	 * The arms of a galaxy of a graph (data.Graph, the one a Scene gives it of its own; else the library one): what the page
	 * and the shaders read of them (SceneBlueprints.Galaxy), made once a graph.
	 */
	/* Kept by the galaxy for the graph it has (regression: made again of its graph at each place, a minute its glow). */
	Spiral: function (data) {
		var graph = data && data.Graph || null;
		var kept = data ? data.Spiral : this.LibrarySpiral;
		if (kept && kept.Graph === graph) return kept.Made;

		kept = {Graph: graph, Made: this.$Service('SceneBlueprints').Galaxy(graph)};

		if (data) {
			Object.defineProperty(data, 'Spiral', {value: kept, writable: true, configurable: true, enumerable: false});
		}
		else {
			this.LibrarySpiral = kept;
		}

		return kept.Made;
	},

	/*
	 * How much of its disc is in its arms at a place (1 for no arms): the arms of a logarithmic spiral, softly, bent here
	 * and there and branching as the arms of real galaxies do (a noise of its seed a sixth of it wide), shifted inward by
	 * shift (radians). Of the graph of its arms (Spiral): the very arms its picture draws.
	 */
	Arm: function (manifest, x, z, shift, data) {
		if (!manifest.Arms || Math.sqrt(x * x + z * z) < 1) return 1;

		return this.Spiral(data).Arm(manifest, x / 1000, z / 1000, shift || 0, this.SeedNumber(manifest));
	},

	/* The kinds of galaxies as the graph of their density takes them (Kind). */
	DensityKinds: ['spiral', 'barred', 'lenticular', 'elliptical', 'irregular', 'dwarf', 'ring'],

	/*
	 * The density of its stars at a place (ly): the graph blueprints/galaxy/density (DensityGraph of the manifest: one of
	 * its own), of its kind, its shape (Shape), and what its arms (Arm), its clumps (Clumps) and its bar (Along, Across)
	 * are there, those reckoned only for a kind that reads them. Regression: each kind a branch of the code.
	 */
	Density: function (data, place) {
		var m = data.Manifest;
		var s = this.Shape(m);
		var x = place[0];
		var y = place[1];
		var z = place[2];
		var radius = Math.sqrt(x * x + z * z);
		var kind = this.DensityKinds.indexOf(m.Kind);
		var run = this.DensityRun(m.DensityGraph);
		var list = run.List;
		var slot = run.Slot;
		var made;

		list[slot.Kind] = kind === -1 ? 0 : kind;
		list[slot.X] = x;
		list[slot.Y] = y;
		list[slot.Z] = z;
		list[slot.Radius] = m.Radius;
		list[slot.Disc] = s.Disc;
		list[slot.Height] = s.Height;
		list[slot.Bulge] = s.Bulge;
		list[slot.Bar] = s.Bar;
		list[slot.Ring] = s.Ring;
		list[slot.Width] = s.Width;
		list[slot.Local] = this.Local;
		list[slot.SX] = m.Shape[0];
		list[slot.SY] = m.Shape[1];
		list[slot.SZ] = m.Shape[2];
		list[slot.Arm] = m.Kind === 'spiral' || m.Kind === 'barred' && radius > s.Bar ? this.Arm(m, x, z, 0, data) : 1;
		list[slot.Clumps] = m.Kind === 'irregular' ? this.Clumps(data, x, y, z) : 0;
		list[slot.Along] = m.Kind === 'barred' ? this.Along(m, x, z) : 0;
		list[slot.Across] = m.Kind === 'barred' ? this.Across(m, x, z) : 0;
		made = run.Main.apply(null, list);

		return typeof made === 'number' ? made : made[0];
	},

	/* The function of the graph of the density (of the library, or one of its own), made once: {Main, List, Slot}. */
	DensityRun: function (graph) {
		var key = graph ? JSON.stringify(graph) : '';
		var made;
		var inputs;

		this.DensityMade = this.DensityMade || {};

		if (this.DensityMade[key])
			return this.DensityMade[key];

		made = this.$Service('Blueprints').NumericCode(graph || Elemenx.Resources('Blueprints', 'ElemenxGraphics/galaxy/density'), {}, null, ['Density']);

		if (!made)
			throw new Error('Elemenx GalaxyData: the graph of the density of a galaxy is not of numbers');

		inputs = made.Numeric.Inputs.map(function (one) {
			return one.Name;
		});
		this.DensityMade[key] = {Main: made.Run.Main, List: inputs.map(function () {
			return 0;
		}), Slot: {}};

		inputs.forEach(function (name, index) {
			this.DensityMade[key].Slot[name] = index;
		}, this);

		return this.DensityMade[key];
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

	/* How many stars a sector holds, of its seed and how thick its stars are there (Sector, Search). */
	SectorCount: function (data, x, y, z) {
		var size = data.Manifest.Sector;
		var random = this.Random(data.Manifest.Seed + ':sector:' + this.SectorKey(x, y, z));
		var mean = this.Density(data, [(x + 0.5) * size, (y + 0.5) * size, (z + 0.5) * size]) * size * size * size;

		return Math.max(0, Math.round(mean + Math.sqrt(mean) * (random() + random() + random() - 1.5) * 1.4));
	},

	/* What a star of a sector is of its own sequence, before its light is worked out: {ID, Mass, Place, Type}. */
	SectorStar: function (data, x, y, z, i) {
		var m = data.Manifest;
		var size = m.Sector;
		var id = this.SectorKey(x, y, z) + '-' + i;
		var own = this.Random(m.Seed + ':star:' + id);
		var mass = Math.round(this.MassOf(own()) * 1000) / 1000;
		var place = [(x + own()) * size, (y + own()) * size, (z + own()) * size];
		/* Drawn after its place: the stars of a sector stand where they stood before they had kinds. */
		var type = this.TypeOf(own(), mass);

		return {ID: id, Mass: type.Mass, Place: place, Type: type.Type};
	},

	/* A star of a sector in full (SectorStar): its name, its light, its class. */
	SectorStarOf: function (data, drawn) {
		var star = this.$Service('Astronomy').Star({Mass: drawn.Mass, Type: drawn.Type});
		var over = data.Edits.Overrides[drawn.ID] || {};

		return {ID: drawn.ID, Name: over.Name || this.Catalogue(data.Manifest, drawn.ID), Place: drawn.Place, Mass: drawn.Mass, Temperature: Math.round(star.Temperature), Color: star.Color, Luminosity: star.Luminosity, Class: star.Class, Type: drawn.Type, Kind: this.KindOf(drawn.Type)};
	},

	Sector: function (data, x, y, z, limit) {
		var self = this;
		var m = data.Manifest;
		var size = m.Sector;
		var key = this.SectorKey(x, y, z);
		var count = this.SectorCount(data, x, y, z);
		var take = Math.min(count, limit === undefined ? count : Math.max(0, Math.floor(limit)));
		var removed = {};
		var stars = [];
		var i;

		(data.Edits.Removed || []).forEach(function (id) {
			removed[id] = true;
		});

		/* An even draw of all: each star of its own sequence, so the first ones of a sector are the same however many are asked for. */
		for (i = 0; i < take; i++) {
			if (removed[key + '-' + i]) continue;

			stars.push(self.SectorStarOf(data, self.SectorStar(data, x, y, z, i)));
		}

		/* The stars put in it by hand (AddBody with Kind star) whose place is in this sector. */
		(data.Edits.Added || []).forEach(function (body) {
			var place = body.Place || [0, 0, 0];
			if (body.Kind !== 'star' || removed[body.ID] || Math.floor(place[0] / size) !== x || Math.floor(place[1] / size) !== y || Math.floor(place[2] / size) !== z) return;

			stars.push(self.AddedStar(body));
		});

		return {Key: key, Count: count, Stars: stars};
	},

	/*
	 * What of it lies round a place and is as asked, the nearest first: its stars, its nebulae and clusters, its black hole,
	 * what was put in it by hand. options {Centre [x, y, z] (ly, as at time 0), Radius (ly, 100), Type (of a star main,
	 * giant, supergiant, white-dwarf, brown-dwarf, neutron, pulsar, magnetar; of a nebula hii, planetary, remnant, dark; of a
	 * cluster open, globular; blackhole; or star, nebula, cluster for all of a kind), Class (how its class begins: G, K3),
	 * Edited (renamed, written or any: only what was given a name or has its system written, wherever it is in the
	 * region), Mass [low, high] (Suns) and Temperature [low, high] (K) (stars only), Text (in its name or its ID), Limit
	 * (500), Budget (how many stars may be looked at, 200 000)}.
	 * {Items: [{ID, Name, Kind, Type, Subtype, Class, Mass, Temperature, Radius, Place, Distance, Renamed, Written}], More
	 * (there were more than Limit), Partial (the budget ran out before all of the region was looked through)}.
	 * Its stars are drawn of their seed sector by sector out from the place, each only as far as what is asked needs (its
	 * light only when a class or a temperature is asked, or once it is kept).
	 */
	Search: function (data, options) {
		var self = this;
		var o = options || {};
		var m = data.Manifest;
		var size = m.Sector;
		var centre = (o.Centre || [0, 0, 0]).map(Number);
		var radius = Math.max(0, Number(o.Radius) || 100);
		var limit = Math.max(1, Number(o.Limit) || 500);
		var budget = Math.max(1, Number(o.Budget) || 200000);
		var text = String(o.Text || '').toLowerCase().replace(/^\s+|\s+$/g, '');
		var type = String(o.Type || '');
		var starry = !!(o.Class || o.Mass || o.Temperature);
		var stars = this.$Service('Astronomy').Types;
		var removed = {};
		var found = [];
		var more = false;
		var partial = false;
		var seen = 0;
		var home = centre.map(function (value) {
			return Math.floor(value / size);
		});
		var ring;
		var reach = Math.ceil(radius / size) + 1;
		var kept;

		(data.Edits.Removed || []).forEach(function (id) {
			removed[id] = true;
		});

		function far (place) {
			var dx = place[0] - centre[0];
			var dy = place[1] - centre[1];
			var dz = place[2] - centre[2];

			return Math.sqrt(dx * dx + dy * dy + dz * dz);
		}

		function within (value, range) {
			return !range || value >= Number(range[0]) && value <= Number(range[1]);
		}

		function renamed (id) {
			return !!(data.Edits.Overrides[id] && data.Edits.Overrides[id].Name);
		}

		function written (id) {
			return !!(m.Systems && m.Systems[id]);
		}

		/* Of the type asked: a kind (star, nebula, cluster) takes all of its types. */
		function typed (kind, of) {
			return !type || type === of || type === kind;
		}

		/* All that is asked but its place and its type. */
		function fits (item) {
			var name = String(item.Name || '').toLowerCase();

			if (removed[item.ID]) return false;

			if (o.Edited === 'renamed' && !item.Renamed || o.Edited === 'written' && !item.Written || o.Edited === 'any' && !item.Renamed && !item.Written) return false;

			if (text && name.indexOf(text) === -1 && String(item.ID).toLowerCase().indexOf(text) === -1) return false;

			if (starry && item.Kind !== 'star' && stars.indexOf(item.Type) === -1) return false;

			if (o.Class && String(item.Class || '').toUpperCase().indexOf(String(o.Class).toUpperCase()) !== 0) return false;

			return within(item.Mass, o.Mass) && within(item.Temperature, o.Temperature);
		}

		/* Anything known by its ID (Star): as an item of the list. */
		function itemOf (one) {
			var kind = one.Kind === 'nebula' || one.Kind === 'cluster' ? one.Kind : one.Kind === 'blackhole' ? 'blackhole' : 'star';
			var of = kind === 'star' ? one.Type || 'main' : kind === 'blackhole' ? 'blackhole' : one.Type;

			return {ID: one.ID, Name: one.Name, Kind: kind, Type: of, Subtype: one.Subtype || '', Class: one.Class || '', Mass: one.Mass === undefined ? null : one.Mass, Temperature: one.Temperature === undefined ? null : one.Temperature, Radius: one.Radius || 0, Place: one.Place.slice(), Distance: far(one.Place), Renamed: renamed(one.ID), Written: written(one.ID)};
		}

		function offer (one) {
			var item;

			if (!one || far(one.Place) > radius) return;

			item = itemOf(one);

			if (typed(item.Kind, item.Type) && fits(item))
				found.push(item);
		}

		/* What was edited: only the few it knows of, wherever they are in the region. */
		if (o.Edited) {
			kept = {};

			Object.keys(data.Edits.Overrides).concat(Object.keys(m.Systems || {}), (data.Edits.Added || []).map(function (body) {
				return body.ID;
			})).forEach(function (id) {
				if (kept[id]) return;

				kept[id] = true;

				offer(self.Star(data, id));
			});
		}
		else {
			this.Objects(data).forEach(offer);

			offer(this.Hole(data));

			(data.Edits.Added || []).forEach(function (body) {
				if (body.Kind === 'star') offer(self.AddedStar(body));
				else if (!starry && (!type || type === body.Kind) && far(body.Place || [0, 0, 0]) <= radius && fits({ID: body.ID, Name: body.Name || body.ID, Kind: body.Kind})) found.push({ID: body.ID, Name: body.Name || body.ID, Kind: body.Kind, Type: body.Kind, Subtype: '', Class: '', Mass: null, Temperature: null, Radius: 0, Place: (body.Place || [0, 0, 0]).slice(), Distance: far(body.Place || [0, 0, 0]), Renamed: false, Written: false});
			});

			/*
			 * Its stars, ring by ring of sectors out from the place: a ring nearer than the farthest of the first Limit found
			 * may still hold nearer ones; past it, none.
			 */
			if (!type || type === 'star' || stars.indexOf(type) !== -1) {
				for (ring = 0; ring <= reach; ring++) {
					if (found.length >= limit) {
						found.sort(function (a, b) {
							return a.Distance - b.Distance;
						});

						if ((ring - 1) * size > found[limit - 1].Distance) {
							more = true;

							break;
						}
					}

					if (seen > budget) {
						partial = true;

						break;
					}

					this.SearchRing(data, home, ring, function (x, y, z) {
						var near = [Math.max(x * size, Math.min(centre[0], (x + 1) * size)), Math.max(y * size, Math.min(centre[1], (y + 1) * size)), Math.max(z * size, Math.min(centre[2], (z + 1) * size))];
						var count;
						var i;
						var drawn;
						var item;

						if (far(near) > radius || seen > budget) return;

						count = self.SectorCount(data, x, y, z);
						seen++;

						for (i = 0; i < count && seen <= budget; i++) {
							drawn = self.SectorStar(data, x, y, z, i);
							seen++;

							if (removed[drawn.ID] || far(drawn.Place) > radius || type && type !== 'star' && drawn.Type !== type || !within(drawn.Mass, o.Mass)) continue;

							/* Its light only when it is asked about. */
							item = o.Class || o.Temperature || text ? itemOf(self.SectorStarOf(data, drawn)) : {ID: drawn.ID, Drawn: drawn, Kind: 'star', Type: drawn.Type, Mass: drawn.Mass, Place: drawn.Place, Distance: far(drawn.Place), Renamed: renamed(drawn.ID), Written: written(drawn.ID)};

							if (fits(item))
								found.push(item);
						}

						if (i < count)
							partial = true;
					});
				}
			}
		}

		found.sort(function (a, b) {
			return a.Distance - b.Distance;
		});

		if (found.length > limit) {
			more = true;
			found.length = limit;
		}

		return {Items: found.map(function (item) {
			return item.Drawn ? itemOf(self.SectorStarOf(data, item.Drawn)) : item;
		}), More: more, Partial: partial};
	},

	/* Each sector of a ring round a sector (ring 0 the sector itself, ring k the shell k sectors out on any axis). */
	SearchRing: function (data, home, ring, each) {
		var x;
		var y;
		var z;

		/* Its faces only (a ring far out is a shell of many sectors: its inside is not gone over). */
		for (x = -ring; x <= ring; x++)
			for (y = -ring; y <= ring; y++)
				for (z = -ring; z <= ring; z += Math.abs(x) === ring || Math.abs(y) === ring || ring === 0 ? 1 : ring * 2)
					each(home[0] + x, home[1] + y, home[2] + z);
	},

	/*
	 * The kind of a star of a galaxy of a number of 0 to 1 (and its mass of the main sequence): a few in a hundred are
	 * white dwarfs and brown dwarfs, one in a hundred and fifty a giant, a few in ten thousand what a heavy star left (a
	 * neutron star, a pulsar, now and then a magnetar), fewer supergiants; {Type, Mass}.
	 */
	TypeOf: function (u, mass) {
		var at = function (from, to, within) {
			return Math.round((from + (to - from) * within) * 1000) / 1000;
		};

		if (u < 0.06)
			return {Type: 'white-dwarf', Mass: at(0.5, 1.1, u / 0.06)};

		if (u < 0.1)
			return {Type: 'brown-dwarf', Mass: at(0.02, 0.075, (u - 0.06) / 0.04)};

		if (u < 0.1067)
			return {Type: 'giant', Mass: Math.max(0.9, mass)};

		if (u < 0.1069)
			return {Type: 'supergiant', Mass: at(10, 30, (u - 0.1067) / 0.0002)};

		if (u < 0.1073)
			return {Type: 'neutron', Mass: at(1.2, 2, (u - 0.1069) / 0.0004)};

		if (u < 0.1076)
			return {Type: 'pulsar', Mass: at(1.2, 2, (u - 0.1073) / 0.0003)};

		if (u < 0.10765)
			return {Type: 'magnetar', Mass: 1.6};

		return {Type: 'main', Mass: mass};
	},

	/* The kind of a Scene of a type of a star. */
	KindOf: function (type) {
		return {main: 'star', neutron: 'neutron-star'}[type] || type || 'star';
	},

	/*
	 * The nebulae and the star clusters of a galaxy, made of its seed once and the same each time (none stored): its edits
	 * over them (a name, one taken away). Each {ID ('neb-...', 'cl-...'), Kind (nebula or cluster), Type (of a nebula hii,
	 * planetary, remnant, dark; of a cluster open, globular), Subtype (Ia, II, Ib, Ic of a remnant), Name, Place [x, y, z]
	 * ly, Radius ly, Seed, Luminosity 0}: clouds where stars are born on the knots of young stars of its arms, dark clouds
	 * on the dust at their inner edge, the shells of dying stars and what supernovae threw anywhere in its disc (only of
	 * white dwarfs, Ia, in an old elliptical one), open clusters along its arms, globular ones in a ball round it all.
	 */
	Objects: function (data) {
		var m = data.Manifest;
		var key = [m.Seed, m.Kind, m.Radius, m.Arms, m.Pitch, m.Phase].join(':');
		var made = this.ObjectsMade && this.ObjectsMade.Key === key ? this.ObjectsMade.List : null;
		var removed = {};

		if (!made) {
			made = this.MakeObjects(data);
			this.ObjectsMade = {Key: key, List: made};
		}

		(data.Edits.Removed || []).forEach(function (id) {
			removed[id] = true;
		});

		return made.filter(function (one) {
			return !removed[one.ID];
		}).map(function (one) {
			var over = data.Edits.Overrides[one.ID] || {};

			return over.Name ? Object.assign({}, one, {Name: over.Name}) : one;
		});
	},

	/*
	 * The knots where its stars are born (the pink clumps of its picture, SceneGalaxy): two grids of its plane (cells of a
	 * thirtieth and a ninetieth of its radius), in each cell at most one, at a place, as large and lit or not as its seed
	 * and its arms there say. Worked out here once and given to its picture as they are (Grids: {Cell, Count, Half, Data:
	 * x, z, size (kly) and its weight a cell}), so each knot it shows is one of its nebulae (Objects: the regions where stars
	 * are born). None in a galaxy of no arms.
	 */
	Knots: function (data) {
		var self = this;
		var m = data.Manifest;
		var key = [m.Seed, m.Kind, m.Radius, m.Arms, m.Pitch, m.Phase].join(':');
		var s = this.Shape(m);
		var spiral = (m.Kind === 'spiral' || m.Kind === 'barred') && m.Arms > 0;
		var start = s.Bar > 0 ? s.Bar * 1.05 : s.Bulge * 0.6;

		if (this.KnotsMade && this.KnotsMade.Key === key) return this.KnotsMade.Made;

		this.KnotsMade = {Key: key, Made: {Grids: [{Scale: 30, Lit: 0.6, Weight: 1}, {Scale: 90, Lit: 0.45, Weight: 0.5}].map(function (grid, index) {
			var cell = m.Radius / grid.Scale;
			var count = Math.ceil(m.Radius * 2.2 / cell);
			var half = Math.floor(count / 2);
			var cells = new Float32Array(count * count * 4);
			var list = [];
			var cx;
			var cz;
			var random;
			var x;
			var z;
			var r;
			var a;
			var b;
			var e;
			var h;
			var on;
			var ridge;
			var at;

			for (cz = 0; cz < count; cz++) {
				for (cx = 0; cx < count; cx++) {
					random = self.Random(m.Seed + ':knot:' + index + ':' + cx + ':' + cz);
					a = random();
					b = random();
					e = random();
					h = random();
					x = (cx - half + a) * cell;
					z = (cz - half + b) * cell;
					r = Math.sqrt(x * x + z * z);
					at = (cz * count + cx) * 4;

					cells[at] = x / 1000;
					cells[at + 1] = z / 1000;
					cells[at + 2] = cell * (0.08 + 0.2 * e) / 1000;

					if (!spiral || r > m.Radius * 0.95 || h > 0.35) continue;

					/* Lit where its arm is strong, past the edge of its bulge (or the ends of its bar), in its flocks of young stars. */
					on = Math.max(0, Math.min(1, (r - start) / (start * (s.Bar > 0 ? 0.3 : 1.5))));
					ridge = (self.Arm(m, x, z, 0, data) - 0.3) / 1.7 * 1.3 * on * (0.4 + 0.9 * self.Flocks(data, x, z));

					if (e >= ridge * grid.Lit) continue;

					cells[at + 3] = grid.Weight;

					list.push({X: x, Z: z, Size: cell * (0.08 + 0.2 * e), Weight: grid.Weight});
				}
			}

			return {Cell: cell / 1000, Count: count, Half: half, Data: cells, List: list};
		})}};

		return this.KnotsMade.Made;
	},

	MakeObjects: function (data) {
		var self = this;
		var m = data.Manifest;
		var s = this.Shape(m);
		var random = this.Random(m.Seed + ':objects');
		var size = m.Radius / 50000;
		var disc = m.Kind !== 'elliptical' && m.Kind !== 'dwarf';
		var young = {spiral: 1, barred: 1, ring: 0.8, irregular: 0.7, lenticular: 0.08, elliptical: 0, dwarf: 0.05}[m.Kind] || 0;
		var list = [];
		var numbers = {};
		var counts = {dark: Math.round(80 * young * size), open: Math.round(220 * young * size), planetary: Math.round((disc ? 40 : 60) * size), remnant: Math.round(30 * size), globular: Math.round((m.Kind === 'elliptical' ? 400 : 150) * size * size + 4)};
		var initials = String(m.Name).slice(0, 3).toUpperCase();
		var i;
		var u;
		var r;
		var z;
		var a;

		function laplace (scale) {
			var v = random() - 0.5;

			return -scale * (v < 0 ? -1 : 1) * Math.log(1 - 2 * Math.abs(v));
		}

		/* A place of its disc (gamma of its scale, as its light is), weighed by want till it takes one, at most a few hundred tries. */
		function place (want, thick) {
			var tries = 0;
			var radius = 0;
			var angle;
			var x = 0;
			var at = 0;

			while (tries++ < 400) {
				radius = disc ? -Math.log(Math.max(1e-9, random() * random())) * s.Disc : Math.pow(random(), 0.5) * m.Radius * 0.6;
				angle = random() * Math.PI * 2;
				x = radius * Math.cos(angle);
				at = radius * Math.sin(angle);

				if (radius < m.Radius * 1.05 && random() < want(x, at))
					return [x, disc ? laplace(s.Height * (thick || 0.3)) : laplace(m.Radius * 0.2), at];
			}

			return [x, 0, at];
		}

		function put (kind, type, subtype, at, radius) {
			var index = numbers[kind] = (numbers[kind] || 0) + 1;
			var id = (kind === 'nebula' ? 'neb-' : 'cl-') + type + '-' + index;

			list.push({ID: id, Kind: kind, Type: type, Subtype: subtype, Name: initials + ' ' + (kind === 'nebula' ? 'N' : 'C') + index, Place: [Math.round(at[0]), Math.round(at[1]), Math.round(at[2])], Radius: Math.round(radius * 10) / 10, Seed: m.Seed + ':' + id, Luminosity: 0});
		}

		/*
		 * On the knots of young stars of its arms, each one a knot its picture shows (Knots), as large: the large ones first.
		 * Regression: put where its arms were strong by their own draw, not where its picture had its knots.
		 */
		this.Knots(data).Grids.forEach(function (grid) {
			grid.List.forEach(function (knot) {
				put('nebula', 'hii', '', [knot.X, laplace(s.Height * 0.15), knot.Z], knot.Size);
			});
		});

		/* Dark clouds on the dust of the inner edge of the arms: where the arm is a little ahead, not yet here. */
		for (i = 0; i < counts.dark; i++)
			put('nebula', 'dark', '', place(function (x, at) {
				return Math.max(0, self.Arm(m, x, at, 0.35, data) - self.Arm(m, x, at, 0, data)) / 1.7 * self.Flocks(data, x, at);
			}, 0.1), 5 + Math.pow(random(), 2) * 45);

		for (i = 0; i < counts.planetary; i++)
			put('nebula', 'planetary', '', place(function () {
				return 1;
			}, 1), 0.3 + random() * 1.7);

		for (i = 0; i < counts.remnant; i++) {
			u = random();

			put('nebula', 'remnant', !disc || u < 0.3 ? 'Ia' : u < 0.75 ? 'II' : u < 0.88 ? 'Ib' : 'Ic', place(function (x, at) {
				return disc ? self.Arm(m, x, at, 0, data) / 2 : 1;
			}, 0.4), 10 + random() * 50);
		}

		for (i = 0; i < counts.open; i++)
			put('cluster', 'open', '', place(function (x, at) {
				return Math.pow(self.Arm(m, x, at, 0, data) / 2, 2);
			}, 0.2), 5 + random() * 25);

		/* A ball round it all, packed to its middle (Plummer). */
		for (i = 0; i < counts.globular; i++) {
			r = Math.min(m.Radius * 1.4, m.Radius * 0.12 / Math.sqrt(Math.pow(0.02 + random() * 0.97, -2 / 3) - 1));
			z = random() * 2 - 1;
			a = random() * Math.PI * 2;

			put('cluster', 'globular', '', [Math.cos(a) * Math.sqrt(1 - z * z) * r, z * r * (disc ? 0.8 : 1), Math.sin(a) * Math.sqrt(1 - z * z) * r], 40 + random() * 80);
		}

		return list;
	},

	/* One nebula or cluster of it by its ID, or null. */
	ObjectOf: function (data, id) {
		if (!/^(neb|cl)-/.test(String(id))) return null;

		return this.Objects(data).filter(function (one) {
			return one.ID === id;
		})[0] || null;
	},

	/*
	 * The scene of a nebula or a cluster as a system (SystemData): a nebula at its middle with what it holds or what made
	 * it (the hot young stars of a cloud where stars are born, the white dwarf of a planetary nebula, the pulsar or the
	 * neutron star of a supernova of a heavy star; nothing of a supernova Ia); a cluster as Cluster makes it.
	 */
	ObjectSystem: function (data, id) {
		var one = this.ObjectOf(data, id);
		var random;
		var children = [];
		var i;

		if (!one)
			return null;

		if (one.Kind === 'cluster')
			return this.Cluster({ID: id, Seed: one.Seed, Type: one.Type, Name: one.Name, Radius: one.Radius});

		random = this.Random(one.Seed + ':middle');

		random();
		random();

		if (one.Type === 'hii') {
			for (i = 0; i < 3 + Math.floor(random() * 3); i++)
				children.push({ID: 'o' + (i + 1), Kind: 'star', Values: {Name: one.Name + ' O' + (i + 1)}, Traits: {Star: {Mass: Math.round(15 + random() * 30), Temperature: Math.round(28000 + random() * 14000)}, Orbit: {Distance: Math.round(one.Radius * this.$Service('Astronomy').Units.ly * (0.02 + random() * 0.12)), Eccentricity: Math.round(random() * 50) / 100, Inclination: Math.round(random() * 180), Anomaly: Math.round(random() * 360), Unit: 'AU'}}});
		}
		else if (one.Type === 'planetary') {
			children.push({ID: 'core', Kind: 'white-dwarf', Values: {Name: one.Name + ' core'}, Traits: {Star: {Temperature: Math.round(60000 + random() * 80000)}}});
		}
		else if (one.Type === 'remnant' && one.Subtype !== 'Ia') {
			children.push({ID: 'core', Kind: one.Subtype === 'II' ? 'pulsar' : random() < 0.3 ? 'magnetar' : 'neutron-star', Values: {Name: one.Name + ' core'}});
		}

		return this.$Service('SystemData').Make({Objects: [{ID: 'nebula', Kind: 'nebula', Values: {Name: one.Name}, Traits: {Nebula: {Type: one.Type, Subtype: one.Subtype, Radius: one.Radius, Seed: one.Seed}}, Children: children}]}, {ID: id, Name: one.Name});
	},

	/* The name of a star in the catalogue of its galaxy: its initials, its sector and its number. */
	Catalogue: function (m, id) {
		return String(m.Name).slice(0, 3).toUpperCase() + ' ' + id;
	},

	Star: function (data, id) {
		/* Its black hole, at its centre: one of its bodies too, with a system of its own. */
		if (id === 'centre')
			return this.Hole(data);

		/* A nebula or a cluster of it: entered as a star is. */
		if (/^(neb|cl)-/.test(String(id))) return this.ObjectOf(data, id);

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

		/* Each star keeps what the pull of the hole leaves it at its nearest: a few close planets, a station now and then. */
		stars.forEach(function (star) {
			star.Children = this.Satellites(data.Manifest.Seed + ':centre:' + star.ID, star, hole.Mass);
		}, this);

		/* Round them the old stars of its nuclear cluster, too many to tell one by one: a swarm the scene draws of its seed. */
		return this.$Service('SystemData').Make({Objects: [{ID: 'hole', Kind: 'blackhole', Values: {Name: hole.Name}, Traits: {BlackHole: {Mass: hole.Mass, Disk: true, Inner: 3, Outer: 18}, Cluster: {Type: 'nuclear', Radius: 12, Count: 6000, Seed: data.Manifest.Seed + ':nuclear'}}, Children: stars}]}, {ID: 'centre', Name: hole.Name});
	},

	/*
	 * Where a star on an orbit round a mass (Suns) can keep bodies of its own: within a part of its sphere of Hill at its
	 * nearest point (AU), a(1 - e)·∛(m / 3M); beyond about half of it what goes round the star is torn away.
	 */
	Room: function (star, around) {
		var orbit = star.Traits.Orbit;
		var astronomy = this.$Service('Astronomy');
		var near = astronomy.Length(orbit.Distance) * (1 - Math.min(0.99, Number(orbit.Eccentricity) || 0));

		return 0.4 * near * Math.cbrt(Number(star.Traits.Star.Mass || 1) / (3 * Math.max(1e-9, around)));
	},

	/*
	 * The bodies of a star of a cluster, made of a seed: none where its room (Room) is too small, else planets spaced as
	 * a system has them inside it (at most 30 AU out), and a station round one of them now and then.
	 */
	Satellites: function (seed, star, around) {
		var random = this.Random(seed);
		var room = Math.min(30, this.Room(star, around));
		var kinds = ['lava', 'rocky', 'desert', 'terran', 'ocean', 'gas', 'ice-giant', 'ice'];
		var children = [];
		var count;
		var distance;
		var i;
		var kind;

		/* Seeds alike (c1, c2...) begin alike in a sequence: its first steps are left. */
		random();
		random();
		random();

		if (room < 0.012 || random() < 0.3) return children;

		count = 1 + Math.floor(random() * Math.min(6, 1 + Math.log(room / 0.012) / Math.log(1.8) / 2));
		distance = Math.max(0.01, Math.min(room * (0.08 + random() * 0.12), 0.06 + random() * 0.4));

		for (i = 0; i < count && distance < room; i++) {
			kind = kinds[Math.min(kinds.length - 1, Math.floor(Math.log(distance / 0.01) / Math.log(30) * 3 + random() * 2))];

			children.push({ID: star.ID + '-' + 'bcdefgh'.charAt(i), Kind: 'planet', Values: {Name: (star.Values.Name || star.ID) + ' ' + 'bcdefgh'.charAt(i)}, Traits: {Orbit: {Distance: Number(distance.toPrecision(3)), Eccentricity: Math.round(random() * 0.12 * 1000) / 1000, Inclination: Math.round(random() * 6 * 10) / 10, Node: Math.round(random() * 360), Periapsis: Math.round(random() * 360), Anomaly: Math.round(random() * 360), Unit: 'AU'}, Body: {Radius: Math.round(kind === 'gas' ? 50000 + random() * 25000 : kind === 'ice-giant' ? 22000 + random() * 6000 : 2400 + random() * 5000), Day: Math.round((8 + random() * 40) * 10) / 10, Tilt: Math.round(random() * 30)}, Surface: {Type: kind}}});

			distance *= 1.5 + random() * 0.6;
		}

		if (random() < 0.3 && children.length)
			children[Math.floor(random() * children.length)].Children = [{ID: star.ID + '-station', Kind: 'station', Values: {Name: (star.Values.Name || star.ID) + ' Station'}, Traits: {Orbit: {Distance: 2.2, Unit: 'radii', Anomaly: Math.round(random() * 360)}}}];

		return children;
	},

	/*
	 * A star cluster as the data of a system (SystemData), made of a seed; options {Seed, Type, Name, Count, Radius (ly),
	 * Mass (of the black hole of a nuclear one, Suns)}:
	 * - open: tens of young stars a few light-years across, hot blue ones among them, loosely held: each with room for a
	 *   whole system of its own;
	 * - globular: an old ball of a hundred thousand stars some tens of light-years across, packed to its middle (the
	 *   brightest of them, red giants among, told one by one, the rest a swarm): little room round each;
	 * - nuclear: the dense heart of a galaxy round its black hole, as the system of the centre is.
	 * Its middle (ID 'cluster', a black hole for a nuclear one) has the trait Cluster {Type, Radius, Count, Seed}: the stars
	 * of it not told one by one, drawn by a Scene as a swarm; its stars go round it (as round a barycentre, of their mass
	 * or of Mass) on orbits of the profile of Plummer, isotropic, each with the planets and stations its room leaves it.
	 */
	Cluster: function (options) {
		var given = options || {};
		var type = ['open', 'globular', 'nuclear'].indexOf(given.Type) !== -1 ? given.Type : 'open';
		var seed = String(given.Seed === undefined ? 'cluster' : given.Seed);
		var random = this.Random(seed + ':' + type);
		var astronomy = this.$Service('Astronomy');
		var radius = Number(given.Radius) || {open: 6, globular: 60, nuclear: 12}[type] * (0.7 + random() * 0.6);
		var told = Math.max(1, Math.round(Number(given.Count) || {open: 40 + random() * 50, globular: 140 + random() * 60, nuclear: 60 + random() * 40}[type]));
		var hole = type === 'nuclear' ? Number(given.Mass) || Math.round(4e6 * (0.5 + random())) : 0;
		var name = String(given.Name || {open: 'Open cluster', globular: 'Globular cluster', nuclear: 'Nuclear cluster'}[type]);
		/* The masses: young and up to hot giants in an open one, old and small in a globular one with its red giants. */
		var masses = {open: [0.4, 9], globular: [0.25, 0.85], nuclear: [0.3, 1.6]}[type];
		var stars = [];
		var total = hole;
		var middle;
		var i;
		var mass;
		var star;
		var giant;
		var u;

		for (i = 0; i < told; i++) {
			u = random();
			mass = masses[0] * Math.pow(masses[1] / masses[0], Math.pow(random(), type === 'open' ? 2.2 : 1.4));
			giant = type !== 'open' && random() < 0.12;
			star = {ID: 'c' + (i + 1), Kind: 'star', Values: {Name: name + ' ' + (i + 1)}, Traits: {Star: giant ? {Mass: 0.85, Radius: Math.round(8 + random() * 60), Temperature: Math.round(3600 + random() * 900)} : {Mass: Math.round(mass * 100) / 100}, Orbit: {
				/* Plummer: r = a / √(u^(-2/3) - 1), a of its scale; none in the middle few hundredths. */
				Distance: Math.round(radius * 0.35 * astronomy.Units.ly / Math.sqrt(Math.pow(0.02 + u * 0.95, -2 / 3) - 1)),
				Eccentricity: Math.round(random() * 0.7 * 100) / 100,
				Inclination: Math.round(Math.acos(1 - 2 * random()) * 180 / Math.PI),
				Node: Math.round(random() * 360),
				Periapsis: Math.round(random() * 360),
				Anomaly: Math.round(random() * 360),
				Unit: 'AU'
			}}};

			stars.push(star);

			total += star.Traits.Star.Mass;
		}

		/* What the swarm weighs as well: each star keeps the room the whole cluster leaves it. */
		total += {open: 0, globular: 2e5, nuclear: 2e7}[type];

		stars.forEach(function (each) {
			each.Children = this.Satellites(seed + ':' + each.ID, each, total);
		}, this);

		middle = {ID: 'cluster', Kind: type === 'nuclear' ? 'blackhole' : 'cluster', Values: {Name: name}, Traits: {Cluster: {Type: type, Radius: Math.round(radius * 10) / 10, Count: type === 'open' ? 0 : type === 'globular' ? 12000 : 6000, Seed: seed + ':swarm'}, Barycentre: {Mass: Math.round(total)}}, Children: stars};

		if (type === 'nuclear') {
			middle.Traits.BlackHole = {Mass: hole, Disk: true, Inner: 3, Outer: 18};

			delete middle.Traits.Barycentre;
		}

		return this.$Service('SystemData').Make({Objects: [middle]}, {ID: String(given.ID || 'cluster-' + seed), Name: name});
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
		var middle = this.Bulges[m.Kind] || this.Bulges.spiral;

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
			var arm = self.Arm(m, x, z, 0, data);
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
			Bulge: this.BulgeOf(m)
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

		if (/^(neb|cl)-/.test(String(id))) {
			data.Systems[id] = this.ObjectSystem(data, id);

			return data.Systems[id];
		}

		made = systems.Make({Seed: data.Manifest.Seed + ':' + id, Options: star ? {Mass: star.Mass, Name: star.Name, Type: star.Type && star.Type !== 'main' ? star.Type : undefined} : {}}, {ID: id, Name: star ? star.Name : id});

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
		var m = data.Manifest;

		return {Kind: 'galaxy', Seed: m.Seed + ':' + id, Pole: this.Pole(data, id), Galaxy: {Seed: m.Seed, Kind: m.Kind, Radius: m.Radius, Arms: m.Arms, Pitch: m.Pitch, Phase: m.Phase, Shape: m.Shape}, Place: star ? star.Place.slice(0, 3) : [m.Radius * 0.54, 0, 0], Band: 1, Stars: Math.max(0.3, Math.min(1, 0.5 + Math.log(Math.max(1e-6, density / this.Local)) * 0.1))};
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
