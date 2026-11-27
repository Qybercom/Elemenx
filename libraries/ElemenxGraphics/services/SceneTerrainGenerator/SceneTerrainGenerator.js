/*
 * The ground of a game, continuous: heights of noise anywhere (no cells), its meshes in chunks, and ways over it.
 * - FlatOf(options): the numbers of a flat map told or its defaults, {Seed, Size, Height, Water, Scale, Ridges}: what
 *   Flat, its climate, LibraryRelief and the blocks of SceneWorld start from (Regression: each told them again).
 * - Flat(options) returns a field of a flat map: options Size (of the map, 1000), Height (of its highest hills, 60),
 *   Water (the level of the sea, 0 to 1, 0.35), Scale (the size of its hills, 180), Ridges (0 to 1: how much of it is
 *   folded into mountains, 0.4), Rock and Snow (the parts of its Height where rock and snow begin, 0.45 and 0.75; false:
 *   none, a land of low hills all of grass), Seed, Noise (a spec of the Noise Service: its hills of that noise, in
 *   metres, in place of those of Scale and Ridges), Relief (a graph of blocks, a generator of Blueprints: its hills of
 *   it, below); it has Size, Top (its Height), Rock, Snow (those heights) and Water. Its methods: Height(x, z) (the height of the ground; below 0 under the sea),
 *   Normal(x, z), Slope(x, z) (0 flat, 1 a wall), Walkable(x, z, options) (MaxSlope 0.45; Swim: the sea too; Blocked(x,
 *   z): true where a thing stands in the way; Over(x, z): the floor of a bridge there, or null), Prefetch(x, z, step,
 *   side) (the heights of a square of points made at once by wasm, read by Height and Climate; null: none; Compute of the
 *   options js: never, auto or wasm: where it is made, the very same numbers; ReliefWasm makes it, WasmShare gives it to
 *   the workers of a pool with the options of the ground, WasmRun runs it in the
 *   page or in a worker), Chunk(x,
 *   z, size, resolution) (a geometry of a square of it, its positions relative to its middle, with Colors of its
 *   heights and slopes and a skirt under its edges so chunks of other sizes leave no gap) and Path(from, to, options)
 *   (a way of points {X, Y, Z} round what cannot be walked, made straight where it can be; null when there is none;
 *   options Step, the finest it looks, MaxSlope, Swim). Palette gives it the colors of a biome; Roads ([[x, z]...]) set
 *   on a field are painted on it, and OnRoad(field, x, z, width) tells whether a point is on one. Sketch: a sketch over it
 *   (below); the field then has Sketch, its Height after it, and its colors (Paint) after what it lays. Border: the
 *   outline of a location and what is past it (Border(options)); the field then has Border.
 * - A sketch is {Layers: [{ID, Name, Visible, Strength, Items}]}, each item {ID, Type, Strength} changing the height left by the
 *   items before it. Strokes (Points, Radius): raise and lower (Amount), flatten (Height), smooth. Lines (Points, Width): ridge
 *   (Height, Sharp), valley and canyon (Depth), river (Depth, Bank, Flow: how fast it runs; its bed under the levels of its way, never rising as it
 *   flows; a point [x, z, y] gives its level), road (Shoulder: level across), cliff (Height, Reach: up on the left of its way).
 *   Areas (Points, Edge): plateau (Height), basin (Depth), lake (Level, Depth), terraces (Step), swamp (Level), beach,
 *   floodplain (Level), dunes (Height, Length, Way), erosion (Amount), biome (Palette: only its colors) and mask (what comes
 *   after it is held back in it; with Heights {Bounds, Side, Data} it holds those heights). Circles (At, Radius): mountain
 *   (Height, Ridged), crater (Depth, Rim), stamp (Data {Side, Heights from 0 to 1}, Height, Turn). What changes no height and
 *   only places things (SketchPlaced, sown by the Scatter of a Scene): areas of growth forest, meadow, bushes, thicket, jungle,
 *   sequoia (Density, Passability, Shapes), clearing (nothing grows), fields and orchard (in rows: Spacing, Gap, Way); lines of
 *   things a step apart row, fence, hedge, wall, powerline (Shapes, Spacing); the circle marker (Role, Team, Name); the triggers
 *   of a game, trigger an area, triggerpoint a circle, triggerline a line (Height, Team, Kinds, Once, Blueprint), and the
 *   area zone (Tags, Team), objects of the scene of a Scene (the trait Triggers); and what cuts its volume (SketchCarves): the
 *   line cave (Width, Depth, Rough, Mouth), the circles hall (Radius, Depth) and overhang (Radius, Amount). Sketched(sketch, base,
 *   seed) makes one ({Height(x, z, h), Look(x, z), Waters(), Items, Within(x0, z0, x1, z1)}: Waters the rivers, a strip at
 *   their levels, and the lakes; Within the box of the points asked next, whose items alone a point in it looks at, null: all); SketchChanged(before, after) gives the bounds [x0, z0, x1, z1] where two differ, for a ground made again only there.
 * - Sphere(options) returns the ground of a planet, the very one its baked surface shows: its land the land of the
 *   graph the shader of a Scene bakes it of (blueprints/shader/bake, what comes to its block BakeLand) made code in
 *   the page (BakeRun, BakeMake(graph), BakeCodeOf(graph); given to the workers by ShareGround): options Radius (units),
 *   Height (its relief), Seed (the number of its pattern), Ocean (0 to 1), Type (rocky, desert, terran, ocean, ice,
 *   lava, dwarf, moon), BakeSource (the code of a graph of its own, BakeCodeOf). Its methods: Land(direction) (the
 *   ground of the noise: below 0 the sea), Elevation(direction) (above the radius), Point(direction) (on the ground),
 *   Altitude(point) (above the ground under it), Patch(face, u, v, size, resolution) (a geometry of a square of a face
 *   of its cube, from u and v of -1 to 1, its positions relative to its Center, the land in UV.x, the sea in UV.y).
 * - A Relief graph has inputs X and Z and results Height (0 to 1, as the hills of noise are), Moisture and Temperature (0
 *   to 1); its parameters Scale, Ridges, Water and Height are those of the options. LibraryRelief(options) makes the one of
 *   the hills of noise of those options, the very same heights and climate: what an editor starts from. Relief(settings)
 *   gives its function (x, z) of results, made JavaScript once (Blueprints.Code) and its source kept in the options
 *   (ReliefSource), so a worker makes it again with no graph; null with none. A field has Climate(x, z) ({Moisture,
 *   Temperature}): of its graph, else Climate(settings) of its height and a noise of moisture.
 * - Carves of the options cut its volume and grow it (Volume: tunnels, holes dug, natural caves of ways and halls,
 *   overhangs of rock on steep slopes): the field has Density(x, y, z) (solid over 0) and Volume; the squares they touch are
 *   made of the density (Volumetric, surface nets), and it is walked as a place of floors (Underground: Height(x, z, y),
 *   Blocked, CanStep, Stands), as a location is. Daylight(field, x0, z0, x1, z1, low, options): how much of the light of
 *   the sky comes to each point under it round a square (At(x, y, z, normal), 0 to 1), the same in every square.
 *   Rock(field, args): where a box of it is rock, a byte a voxel of a metre (the grid of the light of probes).
 * - Work(): the workers of the ground (Workers.Pool), that run Piece and Grid off the main thread.
 * - Piece(shape, options, roads, args): a square of a ground of a shape (Flat or Sphere) of its options, as a worker
 *   makes it: of Flat, args [x, z, size, resolution] and the geometry of Chunk; of Sphere, args [face, u, v, size,
 *   resolution] and {Geometry, Center} of Patch; its lists of numbers Float32Array and Uint32Array. A field of Flat or
 *   Sphere keeps its options (Options) for it; Field(shape, options) makes it once for the same options.
 * - Grid(options, side, top, steep): the heights of a flat ground of its options over all its size, side by side
 *   points, four numbers each (a Float32Array): the height, and 1 where it is over 1 and under top and its slope under
 *   steep (where grass grows), 0 elsewhere.
 * - Floor(options, side): the heights of a flat ground of its options, as Grid lays them, nothing else (the floor of a sea).
 * - Free(size, side, lines, areas, edge): where things may grow on a field of size, side by side bytes (a Uint8Array, row
 *   by row along Z): 0 within Reach of each line ({Points, Reach}: a road and its shoulders, a river and its banks) and
 *   inside each area (Points: a clearing, a lake), 255 farther than edge (1.5) from them, between them in between.
 * - Heights(field, side): the heights of a flat field in a grid of side by side points over all its size (a
 *   Float32Array, row by row along Z); FromGrid(options, heights, side) a field of Flat whose heights are such a grid (a
 *   field baked or painted; out of the grid, of its noise): it has Grid and Side, and no Options.
 * - SketchTable (resources/terrain/sketch-types.json): the types of a sketch, {type: {Kind, Placed, Defaults, Look {Color,
 *   Material}}}, '*' the values of every type; SketchDefaults(type) the values an item of it takes where it tells none
 *   (an editor starts an item with them). SketchTypes, SketchPlaced and LookMaterials are of it. What each type does to
 *   the ground is its graph (blueprints/sketch/<type>: inputs X, Z, H the height so far, S its strength there, O the
 *   shift of the noise of the sketch, Points, Levels, Data, CX, CZ, Around the ground round the point, Target, the
 *   values of the item, <value>Told; its result Height): SketchRun(type) its function {Main, Inputs, Parameters}, made
 *   once in the page and given to workers by ShareGround; SketchMake(type, graph) makes a type of another graph. The
 *   shape of each carve of a volume is its graph too (blueprints/carve/<type>: tunnel, sphere, caves, passages, overhangs;
 *   inputs X, Y, Z, G the ground over the point, Steep, Points, Packed and the values of the carve; result Density, of
 *   overhangs Share, WX, WZ): CarveRun(type), CarveMake(type, graph). A ground of graphs of its own (Graphs: {'sketch/<type>',
 *   'carve/<type>' or 'layout/<name>': a graph}, as a world gives them) has their code made in the page (GraphCode,
 *   GraphCodeOf(graphs): {name: its code}; ShareGround makes it before a worker has the options); SketchRun(type, own),
 *   CarveRun(type, own) and SettlementPlan(item, others, sizes, own) are of that code when it has one of the type.
 * - SettlementPlan(item, others, sizes, own): the plan of a settlement of a sketch, a graph of a layout (LayoutBlueprints:
 *   blueprints/layout/<name> of its layout, or Graph of its kind; LayoutRun(name) its function, LayoutCode carried).
 * - PlainRelief(settings): the library relief of a ground of no graph, no planet and no noise of its own, by its code made
 *   in the page: {Height, Climate(x, z)}. ShareGround(pool, options, made): what its options take with them to the
 *   workers of a pool (the code and the wasm of its relief), once; made: make its code first if it was not yet.
 *   WasmExports(made): the functions of the wasm of a relief, on the memory it shares.
 * - Source(names): the source of its members, for a worker.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneTerrainGenerator', {
	$Meta: {
		Description: 'The ground of a game, continuous: heights of noise anywhere, meshes in chunks, ways over it; the ground of a planet as its surface shows.',
		Methods: ['FlatOf(options)', 'Flat(options)', 'Border(options)', 'Passages(carve, height)', 'Daylight(field, x0, z0, x1, z1, low, options)', 'Rock(field, args)', 'SketchCarves(sketch, height, seed)', 'PassageRoute(graph, from, to)', 'Relief(settings)', 'Climate(settings)', 'ClimateOf(settings)', 'LibraryRelief(options)', 'Sphere(options)', 'OnRoad(field, x, z, width)', 'Work()', 'Piece(shape, options, roads, args)', 'Field(shape, options)', 'Grid(options, side, top, steep)', 'Free(size, side, lines, areas, edge)', 'Floor(options, side)', 'Heights(field, side)', 'FromGrid(options, heights, side)', 'Sketched(sketch, base, seed)', 'RoadWay(field, from, to, options)', 'SketchChanged(before, after)', 'Source(names)', 'ReliefWasm(settings, plain)', 'WasmRun(made, input, count)', 'WasmExports(made)', 'PlainRelief(settings)', 'ShareGround(pool, options, made)', 'SketchDefaults(type)', 'SketchRun(type, own)', 'SketchMake(type, graph)', 'CarveRun(type, own)', 'CarveMake(type, graph)', 'GraphCodeOf(graphs)', 'SettlementPlan(item, others, sizes, own)', 'LayoutRun(name)', 'SketchCodeOf(type, graph)', 'CarveCodeOf(type, graph)', 'BakeRun(own)', 'BakeMake(graph)', 'BakeCodeOf(graph)', 'OwnRun(code)', 'WasmShare(pool, key)']
	},

	$Provides: {Seeded: {Kinds: ['terrain']}},

	/* Its ground is a kind of the Seeded Service: saved as its recipe, or baked as its heights. */
	$OnCreate: function () {
		var self = this;

		/*
		 * Its tables: data of its resources (resources/terrain), read as it is made, so its workers carry them; the sizes of
		 * the buildings of a settlement those of the classes of buildings (resources/buildings: Width, Depth).
		 */
		Object.assign(this.GroundMaterials, Elemenx.Resources('Data', 'ElemenxGraphics/terrain/ground-materials') || {});

		this.DefaultBiomes = (Elemenx.Resources('Data', 'ElemenxGraphics/terrain/planet-biomes') || []).slice();
		this.Zones = Object.assign({}, this.Zones, Elemenx.Resources('Data', 'ElemenxGraphics/terrain/zones') || {});
		this.Carves = Object.assign({}, this.Carves, Elemenx.Resources('Data', 'ElemenxGraphics/terrain/carves') || {});
		this.TunnelRadius = this.Carves.Tunnel.Radius;

		/* The types of a sketch (resources/terrain/sketch-types): the kind of each, whether it places things, its first values, its look. */
		this.SketchTable = Elemenx.Resources('Data', 'ElemenxGraphics/terrain/sketch-types') || {};

		Object.keys(this.SketchTable).forEach(function (type) {
			var one = self.SketchTable[type];

			if (type === '*') return;

			self.SketchTypes[type] = one.Kind;

			if (one.Placed)
				self.SketchPlaced[type] = true;

			if (one.Look && one.Look.Material)
				self.LookMaterials[type] = one.Look.Material;
		});
		Object.assign(this.SettlementKinds, Elemenx.Resources('Data', 'ElemenxGraphics/terrain/settlement-kinds') || {});
		Object.assign(this.SettlementDistricts, Elemenx.Resources('Data', 'ElemenxGraphics/terrain/settlement-districts') || {});

		Elemenx.Resources('Data').forEach(function (name) {
			var building = name.indexOf('ElemenxGraphics/buildings/') === 0 ? Elemenx.Resources('Data', name) : null;
			if (building)
				self.SettlementSizes[name.substring('ElemenxGraphics/buildings/'.length)] = [building.Width, building.Depth];
		});

		this.$Service('Seeded').Define('terrain', {
			Version: 1,
			Make: function (params) {
				return self.Flat(params);
			},
			Bake: function (made, options) {
				var side = Number(options.Side) || 257;

				return {Side: side, Heights: self.Heights(made, side)};
			},
			Read: function (baked, params) {
				return self.FromGrid(params, baked.Heights, baked.Side);
			}
		});
	},

	Smoothstep: function (from, to, value) {
		var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

		return t * t * (3 - 2 * t);
	},

	/*
	 * The function of the relief of a ground of a graph (Relief: a generator of Blueprints with inputs X and Z and results
	 * Height, 0 to 1 as its hills of noise are, and Moisture and Temperature; its parameters Scale, Ridges, Water and Height
	 * of the options that tell them, its own values else): the graph made JavaScript (Blueprints.Code) once, its source kept in the options
	 * (ReliefSource), so a worker makes the same function of it with no graph. Null without one.
	 */
	Relief: function (settings) {
		var blueprints = this.$Service('Blueprints');
		var source = settings.ReliefSource;
		var parameters = {};
		var made;
		var run;

		/* What the options tell of its parameters; the graph's own values for the rest. */
		['Scale', 'Ridges', 'Water', 'Height'].forEach(function (key) {
			if (settings[key] !== undefined && settings[key] !== null && settings[key] !== '')
				parameters[key] = Number(settings[key]);
		});

		/*
		 * Of numbers, a typed function of its parameters (Blueprints.NumericCode, the noise of the Kernel), else its Code.
		 * Regression: its noise made a text of its spec at each point: 12 to 30 microseconds a height.
		 */
		if (!source && settings.Relief && blueprints && blueprints.Code) {
			made = blueprints.NumericCode && blueprints.NumericCode(typeof settings.Relief === 'string' ? JSON.parse(settings.Relief) : settings.Relief, parameters) || blueprints.Code(typeof settings.Relief === 'string' ? JSON.parse(settings.Relief) : settings.Relief);

			if (made)
				source = settings.ReliefSource = made.Source;
		}

		if (!source)
			return null;

		this.Reliefs = this.Reliefs || {};
		run = this.Reliefs[source] = this.Reliefs[source] || new Function('B', 'M', 'N', source)(blueprints, this.$Service('Math'), this.$Service('Noise'));

		return function (x, z) {
			return run(parameters, {X: x, Z: z}) || {};
		};
	},

	/*
	 * The numbers of the climate of a ground (Climate of its options): Warmth (by the sea, 0.72), Lapse (how much it falls to
	 * the top, 0.7), Spread (of the noise round it, 0.7), Stretch (of the noise of the moisture round 0.5, 2.2).
	 */
	ClimateOf: function (settings) {
		var given = settings && settings.Climate || {};

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		return {Warmth: number(given.Warmth, 0.72), Lapse: number(given.Lapse, 0.7), Spread: number(given.Spread, 0.7), Stretch: number(given.Stretch, 2.2)};
	},

	/* The radius of a tunnel or a passage carved with none told, in metres. */
	TunnelRadius: 2.5,

	/*
	 * What is cut out of a ground and juts out of it unless told (resources/terrain/carves): Tunnel {Radius, Flat}, Caves,
	 * Overhangs, Passages, and those of the items of a sketch (Sketch {cave, hall, overhang}). TunnelRadius is its Tunnel Radius.
	 */
	Carves: {Tunnel: {Radius: 2.5, Flat: 0.5}, Caves: {Radius: 100, Top: 3, Bottom: 40, Scale: 24, Width: 0.35, Halls: 0.5}, Overhangs: {Amount: 6, Scale: 24, Slope: 0.45}, Passages: {Scale: 6, Rough: 0}, Sketch: {cave: {Width: 5, Depth: 8, Rough: 0.5, Mouth: 1}, hall: {Radius: 10, Depth: 10}, overhang: {Radius: 30, Amount: 6, Slope: 0.35}}},

	FlatOf: function (options) {
		var given = options || {};

		return {
			Seed: given.Seed === undefined ? 'ground' : given.Seed,
			Size: Number(given.Size) || 1000,
			Height: given.Height === undefined ? 60 : Number(given.Height),
			Water: given.Water === undefined ? 0.35 : Number(given.Water),
			Scale: Number(given.Scale) || 180,
			Ridges: given.Ridges === undefined ? 0.4 : Number(given.Ridges)
		};
	},

	Climate: function (settings) {
		var self = this;
		var made = null;

		/* Its graph made when a climate is first asked: most grounds never ask it. */
		return function (x, z, raw) {
			made = made || self.GroundClimate(settings);

			return made(x, z, raw);
		};
	},

	/*
	 * The climate of a ground of no graph of its own and a noise of its own (Noise): the graph of the climate of a ground
	 * (blueprints/ground/climate, the one the library relief calls) of its height there (raw, 0 to 1), filled with its
	 * numbers (Seed, Scale, Water, Warmth, Lapse, Spread, Stretch). Its code made in the page, kept by a key in its options
	 * (ClimateKey) and given to the workers with them (ShareGround). Regression: the same climate written out in code
	 * beside the graph.
	 */
	GroundClimate: function (settings) {
		var key = settings.ClimateKey;
		var blueprints;
		var flat;
		var numbers;
		var graph;
		var made;
		var kept;
		var main;
		var slots;

		this.WasmKept = this.WasmKept || {};
		this.ClimateMade = this.ClimateMade || {};

		if (typeof key !== 'string') {
			blueprints = this.$Service('Blueprints');
			flat = this.FlatOf(settings);
			numbers = this.ClimateOf(settings);
			key = 'ground-climate:' + JSON.stringify(flat) + JSON.stringify(numbers);

			if (!this.WasmKept[key]) {
				if (typeof Elemenx === 'undefined' || !Elemenx.Compilers || !blueprints)
					throw new Error('Elemenx SceneTerrainGenerator: the climate of a ground is made in the page, and its options were not');

				graph = blueprints.Fill(blueprints.Read(JSON.parse(JSON.stringify(Elemenx.Resources('Blueprints', 'ElemenxGraphics/ground/climate')))), {Seed: flat.Seed, Scale: flat.Scale, Water: flat.Water, Warmth: numbers.Warmth, Lapse: numbers.Lapse, Spread: numbers.Spread, Stretch: numbers.Stretch});
				made = blueprints.NumericCode(graph, {}, null, ['Moisture', 'Temperature']);

				this.WasmKept[key] = {Source: made.Source, Inputs: made.Numeric.Inputs.map(function (one) {
					return one.Name;
				})};
			}

			settings.ClimateKey = key;
		}

		kept = this.WasmKept[key] || (typeof this.$Shared === 'function' ? this.$Shared(key) : null);

		if (!kept)
			throw new Error('Elemenx SceneTerrainGenerator: no climate ' + key + ' in a worker: its options came with no ShareGround');

		if (!this.ClimateMade[key]) {
			main = new Function('B', 'M', 'N', kept.Source)().Main;
			slots = {X: kept.Inputs.indexOf('X'), Z: kept.Inputs.indexOf('Z'), Raw: kept.Inputs.indexOf('Raw')};
			made = kept.Inputs.map(function () {
				return 0;
			});

			this.ClimateMade[key] = function (x, z, raw) {
				var out;

				made[slots.X] = x;
				made[slots.Z] = z;
				made[slots.Raw] = raw;
				out = main.apply(null, made);

				return {Moisture: out[0], Temperature: out[1]};
			};
		}

		return this.ClimateMade[key];
	},

	/*
	 * The relief of a ground of noise as a graph of blocks (a generator of Blueprints), the very heights and climate of
	 * one with no graph: soft hills, the folds of mountains where a wide noise says, in parts; the moisture and the warmth as
	 * Climate makes them. options: Seed, and the values of its parameters (Scale, Ridges, Water, Height). What an editor
	 * starts from to make a ground of its own.
	 */
	LibraryRelief: function (options) {
		var given = options || {};
		var climate = this.ClimateOf(given);
		var flat = this.FlatOf(given);
		var blueprints = this.$Service('Blueprints');

		return blueprints.Fill(blueprints.Read(Elemenx.Resources('Blueprints', 'ElemenxGraphics/relief')), {Seed: flat.Seed, Scale: flat.Scale, Ridges: flat.Ridges, Water: flat.Water, Height: flat.Height, Lapse: climate.Lapse, Spread: climate.Spread, Warmth: climate.Warmth, Stretch: climate.Stretch});
	},

	/*
	 * The lands of a ground by its climate (Biomes of the options: names of biomes of the Biomes Service, each where its
	 * Climate says, or {Biome, Ground, Climate}): [{Name, Ground (its colors), Grass (whether grass grows in it), Climate: [{Height, Moisture, Temperature}]}],
	 * each a range [from, to] (null: no end), Height in parts of the Top of the ground (under 0 below the sea), the others
	 * 0 to 1. Made once and kept in the options (BiomeList), so a worker has it with no Biomes Service. Null with none.
	 */
	Biomes: function (settings) {
		var registry = this.$Service('SceneBiomes');
		/* In a worker, the lands its pool was given (ScenePlanet.Work: Share biomes): a worker has no registry of them. */
		var shared = !registry && this.$Shared ? this.$Shared('biomes') : null;
		var list;

		if (settings.BiomeList)
			return settings.BiomeList;

		if (!Array.isArray(settings.Biomes) || !settings.Biomes.length) return null;

		list = settings.Biomes.map(function (entry) {
			var name = typeof entry === 'string' ? entry : entry.Biome || entry.Name;
			var known = registry && name ? registry.Get(name) : shared && name ? shared[name] || null : null;
			var climate = typeof entry === 'object' && entry.Climate || known && known.Climate || {};

			return {
				Name: name || '',
				Ground: typeof entry === 'object' && entry.Ground || known && known.Ground || {},
				Grass: typeof entry === 'object' && entry.Grass !== undefined ? !!entry.Grass : known ? !!known.Grass : true,
				/* What it sows (rules of Scatter): a planet draws its woods of them on its globe (ScenePlanet.PatchPicture). */
				Scatter: typeof entry === 'object' && entry.Scatter || known && known.Scatter || [],
				Climate: Array.isArray(climate) ? climate : [climate],
				/* The lands it takes the place of where it holds (see BiomeOf). */
				Over: typeof entry === 'object' && entry.Over || known && known.Over || null
			};
		});

		settings.BiomeList = list;

		return list;
	},

	/*
	 * The biomes of a point of a height (a part of the Top), a moisture and a warmth, of a list of Biomes: {List: [{Name,
	 * Ground, Weight}] (the weights 1 in all, softly where ranges meet), Gap (true: none of them holds it, the nearest
	 * given)}.
	 */
	BiomeOf: function (list, height, moisture, temperature) {
		var soft = {Height: 0.03, Moisture: 0.04, Temperature: 0.04};
		var values = {Height: height, Moisture: moisture, Temperature: temperature};
		var found = [];
		var nearest = null;
		var reach = -Infinity;
		var sum = 0;

		/* How deep a value is in a range: under 0 out of it. */
		function depth (range, key) {
			var low = range && range[0] !== null && range[0] !== undefined ? Number(range[0]) : -Infinity;
			var high = range && range[1] !== null && range[1] !== undefined ? Number(range[1]) : Infinity;

			return Math.min(values[key] - low, high - values[key]) / soft[key];
		}

		list.forEach(function (biome) {
			var weight = 0;
			var near = -Infinity;

			biome.Climate.forEach(function (envelope) {
				var deepest = Infinity;
				var part = 1;

				['Height', 'Moisture', 'Temperature'].forEach(function (key) {
					var d = depth(envelope[key], key);

					deepest = Math.min(deepest, d);
					part *= Math.max(0, Math.min(1, d + 0.5));
				});

				weight = Math.max(weight, part);
				near = Math.max(near, deepest);
			});

			if (weight > 0) {
				found.push({Name: biome.Name, Ground: biome.Ground, Weight: weight});

				sum += weight;
			}

			if (near > reach) {
				reach = near;
				nearest = biome;
			}
		});

		if (!found.length)
			return {List: nearest ? [{Name: nearest.Name, Ground: nearest.Ground, Weight: 1}] : [], Gap: true};

		/*
		 * A land that takes the place of others where it holds (Over: their names: a rainforest where a swamp, a temperate
		 * wood or a savanna would be): theirs less by as much as it holds. Without it in the list, they are as they were.
		 */
		list.forEach(function (biome) {
			var over = biome.Over;
			var holds = found.filter(function (one) {
				return one.Name === biome.Name;
			})[0];
			if (!holds || !Array.isArray(over)) return;

			found.forEach(function (one) {
				if (over.indexOf(one.Name) >= 0)
					one.Weight *= 1 - Math.min(1, holds.Weight);
			});
		});

		found = found.filter(function (one) {
			return one.Weight > 1e-6;
		});
		sum = found.reduce(function (total, one) {
			return total + one.Weight;
		}, 0);

		found.forEach(function (biome) {
			biome.Weight /= sum;
		});

		return {List: found.sort(function (a, b) {
			return b.Weight - a.Weight;
		}), Gap: false};
	},

	/*
	 * A place of a planet of ScenePlanet as a flat ground (Planet of the options of Flat: {Options (of ScenePlanet.Make),
	 * Latitude, Longitude, Turn (degrees the north of the ground is turned from -Z)}): its points are those of the plane
	 * touching the planet at the place, metres east (X) and south (Z) of it; Elevation(x, z) is the elevation of the planet
	 * there (metres, its sea level 0), Sample(x, z) all the planet tells of it, Direction(x, z) the direction and Local(direction)
	 * the point of it a direction comes to ([x, z]: what joins two places, the same point of the planet in both). Its lands
	 * resolved there and then (BiomeList of the options), so a worker makes the same of them.
	 */
	Site: function (given) {
		var planets = this.$Service('ScenePlanet');
		var options = given.Options || {};
		var planet;
		var middle;
		var east;
		var north;
		var radius;
		var turn = (Number(given.Turn) || 0) * Math.PI / 180;

		if (!options.BiomeList)
			options.BiomeList = this.Biomes({Biomes: options.Biomes || this.DefaultBiomes});

		/* Graphs of its own (LandGraph.. ClimateGraph): their code made in the page, so a worker has it. */
		if (!options.ReliefSources)
			options.ReliefSources = planets.GraphSources(options);

		planet = planets.Planet(options);
		radius = planet.Radius * 1000;
		middle = planets.Direction(Number(given.Latitude) || 0, Number(given.Longitude) || 0);
		/* East: the axis Y crossed with the middle (at a pole, -Z); north: the middle crossed with east. */
		east = Math.abs(middle[1]) > 0.9999 ? [0, 0, -1] : (function () {
			var c = [middle[2], 0, -middle[0]];
			var length = Math.sqrt(c[0] * c[0] + c[2] * c[2]);

			return [c[0] / length, 0, c[2] / length];
		})();
		north = [middle[1] * east[2] - middle[2] * east[1], middle[2] * east[0] - middle[0] * east[2], middle[0] * east[1] - middle[1] * east[0]];

		function direction (x, z) {
			var u = x * Math.cos(turn) + z * Math.sin(turn);
			var v = -z * Math.cos(turn) + x * Math.sin(turn);
			var p = [middle[0] * radius + east[0] * u + north[0] * v, middle[1] * radius + east[1] * u + north[1] * v, middle[2] * radius + east[2] * u + north[2] * v];
			var length = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);

			return [p[0] / length, p[1] / length, p[2] / length];
		}

		/* The point of the place a direction of the planet comes to, [x, z] metres: the other way of direction. */
		function local (way) {
			var along = way[0] * middle[0] + way[1] * middle[1] + way[2] * middle[2];
			var k = radius / (along || 1e-9);
			var u = (way[0] * east[0] + way[1] * east[1] + way[2] * east[2]) * k;
			var v = (way[0] * north[0] + way[1] * north[1] + way[2] * north[2]) * k;

			return [u * Math.cos(turn) + v * Math.sin(turn), u * Math.sin(turn) - v * Math.cos(turn)];
		}

		return {
			Planet: planet,
			Direction: direction,
			Local: local,

			Elevation: function (x, z) {
				return planet.Elevation(direction(x, z));
			},

			Sample: function (x, z) {
				return planet.Sample(direction(x, z));
			}
		};
	},

	Flat: function (options) {
		var self = this;
		var settings = options || {};
		var math = this.$Service('Math');
		var flat = this.FlatOf(settings);
		var size = flat.Size;
		var height = flat.Height;
		var water = flat.Water;
		var scale = flat.Scale;
		/* Its hills of a noise of its own (a spec of the Noise Service), in metres; else those of Scale and Ridges. */
		var own = settings.Noise ? this.$Service('Noise').Make(settings.Noise) : null;
		/* Of a graph (Relief): its heights, its moisture and its warmth at each point; else the climate of the hills of noise. */
		var relief = this.Relief(settings);
		/* A place of a planet (Planet): its heights, its climate and its lands, the very ones of its globe. */
		var site = settings.Planet ? this.Site(settings.Planet) : null;
		var climate = this.Climate(settings);
		/* Its lands by its climate (Biomes): each where its height, its moisture and its warmth are those of a biome; of a planet, its own. */
		var biomes = this.Biomes(site && !settings.Biomes && !settings.BiomeList ? Object.assign(settings, {BiomeList: site.Planet.Lands}) : settings);
		var field;

		/* Its graphs of its own (Graphs): their code made here (GraphCode), unless it came with the options (a worker). */
		if (settings.Graphs && !settings.GraphCode)
			settings.GraphCode = this.GraphCodeOf(settings.Graphs);

		/* A height of a zone: a part of the highest hills, Infinity for none (false), the part by default. */
		function zone (value, fallback, top) {
			if (value === false || value === 'false') return Infinity;

			return top * (value === undefined || value === '' || value === null ? fallback : Number(value));
		}

		/*
		 * Its heights for a square of points at once (Prefetch, of Mesh): by wasm, a batch of its relief (of a graph its
		 * moisture and warmth too; of none the library relief, the very same hills), the grid of the square and the four of
		 * its normals (d to each side); a height asked of a point of them is read of it, any other made as before. Compute of
		 * the options js: none of it. Regression: of js alone, a square of 64 cells made its noise five times a vertex.
		 */
		var store = null;
		var shifts = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
		/* Of no graph, no planet and no noise of its own: the library relief, its code made in the page (PlainRelief). */
		var library = relief || site || own ? null : this.PlainRelief(settings);
		var wasm = settings.Compute === 'js' ? null : this.ReliefWasm(settings, library ? flat : null);
		/*
		 * A height (and of a graph its moisture and warmth) by its wasm itself, one point a call: of the plain relief, or of a
		 * graph of inputs X and Z and of results Height, Moisture and Temperature; its js where there is none.
		 */
		var single = wasm && (library || wasm.Names === 'X,Z' && wasm.Keys === 'Height,Moisture,Temperature') ? this.WasmExports(wasm).g_main : null;

		function stored (x, z) {
			var d = Math.max(0.5, scale / 200);
			var i;

			for (i = 0; i < shifts.length; i++) {
				var column = Math.round((x - shifts[i][0] * d - store.X) / store.Step);
				var row = Math.round((z - shifts[i][1] * d - store.Z) / store.Step);
				if (column >= 0 && row >= 0 && column < store.Side && row < store.Side && store.X + column * store.Step + shifts[i][0] * d === x && store.Z + row * store.Step + shifts[i][1] * d === z) return (i * store.Side * store.Side + row * store.Side + column) * store.Outs;
			}

			return -1;
		}

		function graphClimate (made) {
			return {Moisture: made[1], Temperature: made[2]};
		}

		function raw (x, z) {
			var at = store ? stored(x, z) : -1;
			if (at >= 0)
				return store.Values[at];

			if (relief)
				return single ? single(x, z)[0] : Number(relief(x, z).Height) || 0;

			/* The elevation of the planet there, metres, as a part of Height: its sea level is 0, its sea under it (Water, any share). */
			if (site)
				return site.Elevation(x, z) / (height || 1) * (1 - water) + water;

			if (own)
				return own.At(x, 0, z);

			return single ? single(x, z) : library.Height.Main(x, z);
		}

		field = {
			Options: settings,
			Size: size,
			Top: height,
			/* Where the rock and the snow begin, in its units (Rock and Snow of the options, parts of its Height; false: none). */
			Rock: zone(settings.Rock, self.Zones.Rock, height),
			Snow: zone(settings.Snow, self.Zones.Snow, height),
			Water: water,
			Palette: settings.Palette || null,
			Biomes: biomes,
			Roads: null,

			Height: function (x, z) {
				return (raw(x, z) - water) * height / (1 - water);
			},

			Normal: function (x, z) {
				var d = Math.max(0.5, scale / 200);
				var dx = field.Height(x + d, z) - field.Height(x - d, z);
				var dz = field.Height(x, z + d) - field.Height(x, z - d);

				return math.Vectors.Normalize([-dx, 2 * d, -dz]);
			},

			Slope: function (x, z) {
				return 1 - field.Normal(x, z)[1];
			},

			/* How wet and how warm it is at a point, 0 to 1: of its Relief graph, else of the height and a noise of moisture. */
			Climate: function (x, z) {
				var at = store && store.Outs === 3 ? stored(x, z) : -1;
				var made = at >= 0 ? {Moisture: store.Values[at + 1], Temperature: store.Values[at + 2]} : relief ? single ? graphClimate(single(x, z)) : relief(x, z) : site ? site.Sample(x, z) : library ? library.Climate(x, z) : null;
				var given = made && made.Moisture !== undefined && made.Temperature !== undefined;

				return given ? {Moisture: Math.max(0, Math.min(1, Number(made.Moisture) || 0)), Temperature: Math.max(0, Math.min(1, Number(made.Temperature) || 0))} : climate(x, z, raw(x, z));
			},

			/* Its biomes at a point (BiomeOf): of its height, a part of its Top, and of its climate; null with none. */
			Biome: function (x, z) {
				var weather;
				var told;

				if (!biomes)
					return null;

				/* Of a planet: the land its globe has there (none under its sea: the nearest of its climate). */
				told = site && !settings.Biomes ? site.Sample(x, z).Biome : '';

				if (told)
					return {List: biomes.filter(function (one) {
						return one.Name === told;
					}).map(function (one) {
						return {Name: one.Name, Ground: one.Ground, Weight: 1};
					}), Gap: false};

				weather = field.Climate(x, z);

				return self.BiomeOf(biomes, field.Height(x, z) / Math.max(1, height), weather.Moisture, weather.Temperature);
			},

			Walkable: function (x, z, rules) {
				var given = rules || {};

				var ground;

				if (Math.abs(x) > size / 2 || Math.abs(z) > size / 2) return false;

				ground = (given.Swim || field.Height(x, z) >= 0) && field.Slope(x, z) <= (given.MaxSlope === undefined ? 0.45 : given.MaxSlope);

				/*
				 * Over(x, z): the floor of what is built over the ground there (the deck of a bridge), or null: walked over the water
				 * and the banks too. Regression: a walker knew no bridge, a way over a river was looked for over all the map and the
				 * page held.
				 */
				if (!ground && !(given.Over && given.Over(x, z) !== null)) return false;

				return !(given.Blocked && given.Blocked(x, z));
			},

			/*
			 * The heights of a square of side by side points from x, z, step apart, made at once (by wasm); null: none kept. Its
			 * sketch looks at the items over the square alone (Within), its normals' points too.
			 */
			Prefetch: function (x, z, step, side) {
				var d = Math.max(0.5, scale / 200);
				var input;
				var column;
				var row;
				var i;
				var at = 0;

				store = null;

				if (field.Sketch)
					field.Sketch.Within(x === null ? null : x - d, x === null ? null : z - d, x === null ? null : x + (side - 1) * step + d, x === null ? null : z + (side - 1) * step + d);

				if (x === null || !wasm) return field;

				input = new Float64Array(shifts.length * side * side * 2);

				for (i = 0; i < shifts.length; i++) {
					for (row = 0; row < side; row++) {
						for (column = 0; column < side; column++) {
							input[at++] = x + column * step + shifts[i][0] * d;
							input[at++] = z + row * step + shifts[i][1] * d;
						}
					}
				}

				store = {X: x, Z: z, Step: step, Side: side, Outs: wasm.Outs, Values: self.WasmRun(wasm, input, shifts.length * side * side)};

				return field;
			},

			Chunk: function (x, z, extent, resolution) {
				if (field.Volume && field.Volume.Touches(x - extent / 2, z - extent / 2, x + extent / 2, z + extent / 2)) return self.Volumetric(field, x, z, extent, resolution || 32);

				return self.Mesh(field, x, z, extent, resolution || 32);
			},

			Path: function (from, to, rules) {
				return self.Way(field, from, to, rules || {});
			}
		};

		/* The outline of a location (Border): what is past it, its passages open. */
		if (settings.Border) {
			var inner = field.Height;
			var border = this.Border(settings.Border);

			field.Border = border;
			field.Height = function (x, z) {
				return border.Height(x, z, inner(x, z));
			};
		}

		/* A sketch over it (Sketch): its heights after it, and its colors. */
		if (settings.Sketch) {
			var plain = field.Height;
			var sketched = this.Sketched(settings.Sketch, plain, settings.Seed, settings.GraphCode);

			field.Sketch = sketched;
			field.Height = function (x, z) {
				return sketched.Height(x, z, plain(x, z));
			};
		}

		/* What its ground is made of (SceneMaterials): up to 12 materials of its palettes and its sketch, by their slots. */
		field.Materials = this.MaterialsOf(field);
		field.MaterialSlot = {};

		field.Materials.forEach(function (name, index) {
			field.MaterialSlot[name] = index;
		});

		/* What is cut out of it and juts out of it (Carves, and the caves, halls and overhangs of its sketch): its volume over its heights. */
		if (settings.Sketch && this.SketchCarves(settings.Sketch, field.Height, settings.Seed).length)
			settings = Object.assign({}, settings, {Carves: (settings.Carves || []).concat(this.SketchCarves(settings.Sketch, field.Height, settings.Seed))});

		field.Volume = this.Volume(settings, field);

		field.Density = function (x, y, z) {
			return field.Volume ? field.Volume.Density(x, y, z) : field.Height(x, z) - y;
		};

		/* Walked as a place of floors where it is cut. */
		if (field.Volume)
			this.Underground(field, settings);

		return field;
	},

	/*
	 * The outline of a location on its ground and what is past it. options {Points ([x, z] of its corners), Sides ([x0, z0,
	 * x1, z1] of each side, ScenePlanet.CellPlace), Beyond (far: the ground goes on as it is; cliff: it falls Depth, 250 m;
	 * void: it falls away, Depth 3000 m; sea: it goes down under the sea, Depth 40 m; wall: as it is, a wall stands on the
	 * outline, SceneWorld's step Border), Passages ([{Side, At, Width}]: past them the ground goes on as it is), Open (the
	 * sides past which it goes on as it is all along: a location told beside them), Edge
	 * (metres over which it changes, 40)}. Gives {Height(x, z, h) (h past the outline), Distance(x, z) (to the outline,
	 * over 0 out of it), Gap(x, z) (1 in the way of a passage), Beyond, Points}.
	 */
	Border: function (options) {
		var self = this;
		var given = options || {};
		var points = given.Points || [];
		var beyond = given.Beyond || 'far';
		var edge = Number(given.Edge) || 40;
		var depth = given.Depth !== undefined ? Number(given.Depth) : beyond === 'void' ? 3000 : beyond === 'sea' ? 40 : 250;
		var openings = (given.Passages || []).map(function (passage) {
			var side = (given.Sides || [])[passage.Side];
			var at = passage.At === undefined ? 0.5 : Number(passage.At);
			var length;

			if (!side)
				return null;

			length = Math.hypot(side[2] - side[0], side[3] - side[1]) || 1;

			return {X: side[0] + (side[2] - side[0]) * at, Z: side[1] + (side[3] - side[1]) * at, DX: (side[2] - side[0]) / length, DZ: (side[3] - side[1]) / length, Half: (Number(passage.Width) || 4) / 2 + 2};
		}).concat((given.Open || []).map(function (index) {
			var side = (given.Sides || [])[index];

			return side ? {X: (side[0] + side[2]) / 2, Z: (side[1] + side[3]) / 2, DX: (side[2] - side[0]) / (Math.hypot(side[2] - side[0], side[3] - side[1]) || 1), DZ: (side[3] - side[1]) / (Math.hypot(side[2] - side[0], side[3] - side[1]) || 1), Half: Math.hypot(side[2] - side[0], side[3] - side[1]) / 2 + 2} : null;
		})).filter(function (opening) {
			return opening;
		});

		function inside (x, z) {
			var within = false;
			var i;
			var j;

			for (i = 0, j = points.length - 1; i < points.length; j = i++) {
				if ((points[i][1] > z) !== (points[j][1] > z) && x < (points[j][0] - points[i][0]) * (z - points[i][1]) / (points[j][1] - points[i][1]) + points[i][0])
					within = !within;
			}

			return within;
		}

		function distance (x, z) {
			var least = Infinity;
			var i;

			for (i = 0; i < points.length; i++) {
				var a = points[i];
				var b = points[(i + 1) % points.length];
				var dx = b[0] - a[0];
				var dz = b[1] - a[1];
				var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));

				least = Math.min(least, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z));
			}

			return inside(x, z) ? -least : least;
		}

		/* In the way of a passage: across it within its width, and near its side. */
		function gap (x, z) {
			var open = 0;

			openings.forEach(function (opening) {
				var along = Math.abs((x - opening.X) * opening.DX + (z - opening.Z) * opening.DZ);
				var across = Math.abs((x - opening.X) * -opening.DZ + (z - opening.Z) * opening.DX);

				open = Math.max(open, (1 - self.Smoothstep(opening.Half, opening.Half + edge * 0.5, along)) * (1 - self.Smoothstep(edge * 4, edge * 8, across)));
			});

			return open;
		}

		return {
			Beyond: beyond,
			Points: points,
			Distance: distance,
			Gap: gap,

			Height: function (x, z, h) {
				var d;
				var s;

				if (points.length < 3 || beyond === 'far' || beyond === 'wall') return h;

				d = distance(x, z);

				if (d <= 0) return h;

				if (beyond === 'sea') {
					s = self.Smoothstep(0, edge * 4, d) * (1 - gap(x, z));

					return h + (Math.min(h, -depth) - h) * s;
				}

				return h - depth * self.Smoothstep(0, edge, d) * (1 - gap(x, z));
			}
		};
	},

	/*
	 * The ground of a model of a location: what can be stood on and what stops a walker, read from its triangles. parts:
	 * [{Positions, Indices, Soft}] where they stand in the scene; Soft: leaves and glass, that stop nobody. A place has floors
	 * one over the other, as a house on a tree has, and only what faces up is a floor. All is lifted by Lift, so that nothing
	 * is under the sea level of a scene.
	 * - Height(x, z, y): the highest floor a walker at y can step on or fall to (y when there is none).
	 * - CanStep(x, z, y): a floor is there for it and no wall at the height of its body. Blocked(x, z, y): a wall only.
	 * - Push(x, z, y, radius, from, to): where a body stands that comes to x, z: a column of that radius, between from and to over its feet,
	 *   by the very triangles of what stands, so a narrow passage is as wide as it is drawn: [x, z], out of all it touches.
	 * - Stands(x, z, y): a floor is there for it.
	 * - Spots(): the parts of it that hang together, the largest first: [{X, Z, Y, Size}], X and Z a floor near its middle.
	 * - Start(): where to set a walker down: the middle of the largest.
	 * Plane (true) lays level ground at its foot, for a model that has none.
	 */
	FromModel: function (parts, options) {
		var settings = options || {};
		var layers = 6;
		var step = 0.7;
		var low = [Infinity, Infinity, Infinity];
		var high = [-Infinity, -Infinity, -Infinity];
		var walls = {};
		var side;
		var cell;
		var grid;
		var floors;
		var counts;
		var lift;
		var field;

		parts.forEach(function (part) {
			var p = part.Positions;
			var i;

			for (i = 0; i < p.length; i += 3) {
				low[0] = Math.min(low[0], p[i]);
				low[1] = Math.min(low[1], p[i + 1]);
				low[2] = Math.min(low[2], p[i + 2]);
				high[0] = Math.max(high[0], p[i]);
				high[1] = Math.max(high[1], p[i + 1]);
				high[2] = Math.max(high[2], p[i + 2]);
			}
		});

		side = Math.max(high[0] - low[0], high[2] - low[2], 0.01);
		cell = Math.max(0.25, side / 1024);
		grid = Math.ceil(side / cell) + 1;
		floors = new Float32Array(grid * grid * layers);
		counts = new Uint8Array(grid * grid);
		lift = -low[1];

		function indexOf (x, z) {
			var column = Math.floor((x - low[0]) / cell);
			var row = Math.floor((z - low[2]) / cell);

			return column < 0 || row < 0 || column >= grid || row >= grid ? -1 : row * grid + column;
		}

		function floor (index, y) {
			var count = counts[index];
			var i;

			for (i = 0; i < count; i++) {
				if (Math.abs(floors[index * layers + i] - y) < 0.3) return;
			}

			if (count < layers) {
				floors[index * layers + count] = y;
				counts[index] = count + 1;
			}
		}

		function wall (index, from, to) {
			var list;

			if (index < 0) return;

			list = walls[index] = walls[index] || [];

			if (list.length < 12 && !list.some(function (each) {
				return each[0] <= from + 0.2 && each[1] >= to - 0.2;
			}))
				list.push([from, to]);
		}

		/* What faces up covers its cells, each exactly. */
		function flat (a, b, c) {
			var area = (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
			var first = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - low[0]) / cell));
			var last = Math.min(grid - 1, Math.floor((Math.max(a[0], b[0], c[0]) - low[0]) / cell));
			var top = Math.max(0, Math.floor((Math.min(a[2], b[2], c[2]) - low[2]) / cell));
			var bottom = Math.min(grid - 1, Math.floor((Math.max(a[2], b[2], c[2]) - low[2]) / cell));
			var row;
			var column;

			if (!area) return;

			for (row = top; row <= bottom; row++) {
				for (column = first; column <= last; column++) {
					var x = low[0] + (column + 0.5) * cell;
					var z = low[2] + (row + 0.5) * cell;
					var u = ((b[0] - x) * (c[2] - z) - (b[2] - z) * (c[0] - x)) / area;
					var v = ((c[0] - x) * (a[2] - z) - (c[2] - z) * (a[0] - x)) / area;
					var w = 1 - u - v;
					var edge = -cell / Math.sqrt(Math.abs(area));
					if (u >= edge && v >= edge && w >= edge)
						floor(row * grid + column, a[1] * u + b[1] * v + c[1] * w);
				}
			}
		}

		/* What stands upright is a line from above: its edges in steps smaller than a cell. */
		function upright (a, b, c) {
			var bottom = Math.min(a[1], b[1], c[1]);
			var top = Math.max(a[1], b[1], c[1]);

			[[a, b], [b, c], [c, a]].forEach(function (pair) {
				var length = Math.sqrt(Math.pow(pair[1][0] - pair[0][0], 2) + Math.pow(pair[1][2] - pair[0][2], 2));
				var steps = Math.ceil(length / (cell * 0.6)) + 1;
				var i;

				for (i = 0; i <= steps; i++)
					wall(indexOf(pair[0][0] + (pair[1][0] - pair[0][0]) * i / steps, pair[0][2] + (pair[1][2] - pair[0][2]) * i / steps), bottom, top);
			});
		}

		/* What is not flat, by squares, for what stands against it. */
		var hashed = {};
		var square = Math.max(2, side / 256);

		function hashOf (x, z) {
			return Math.floor(x / square) + ':' + Math.floor(z / square);
		}

		function keep (a, b, c) {
			var fromX = Math.floor(Math.min(a[0], b[0], c[0]) / square);
			var toX = Math.floor(Math.max(a[0], b[0], c[0]) / square);
			var fromZ = Math.floor(Math.min(a[2], b[2], c[2]) / square);
			var toZ = Math.floor(Math.max(a[2], b[2], c[2]) / square);
			var made = [a, b, c];
			var x;
			var z;

			for (x = fromX; x <= toX; x++) {
				for (z = fromZ; z <= toZ; z++) {
					var key = x + ':' + z;

					(hashed[key] = hashed[key] || []).push(made);
				}
			}
		}

		/* Of a triangle what lies between two heights, as lines on the ground. */
		function band (three, low2, high2) {
			var points = [];
			var i;

			for (i = 0; i < 3; i++) {
				var p = three[i];
				var q = three[(i + 1) % 3];

				if (p[1] >= low2 && p[1] <= high2)
					points.push(p);

				[low2, high2].forEach(function (level) {
					if ((p[1] - level) * (q[1] - level) < 0) {
						var t = (level - p[1]) / (q[1] - p[1]);

						points.push([p[0] + (q[0] - p[0]) * t, level, p[2] + (q[2] - p[2]) * t]);
					}
				});
			}

			return points;
		}

		function pushOut (place, points, radius) {
			var moved = false;
			var i;
			var j;

			for (i = 0; i < points.length; i++) {
				for (j = i + 1; j < points.length; j++) {
					var a = points[i];
					var b = points[j];
					var sx = b[0] - a[0];
					var sz = b[2] - a[2];
					var part = Math.max(0, Math.min(1, ((place[0] - a[0]) * sx + (place[1] - a[2]) * sz) / (sx * sx + sz * sz || 1)));
					var dx = place[0] - (a[0] + sx * part);
					var dz = place[1] - (a[2] + sz * part);
					var far = Math.sqrt(dx * dx + dz * dz);

					if (far < radius && far > 0.0001) {
						place[0] += dx / far * (radius - far);
						place[1] += dz / far * (radius - far);
						moved = true;
					}
				}
			}

			return moved;
		}

		function triangle (a, b, c, shown) {
			var ux = b[0] - a[0];
			var uy = b[1] - a[1];
			var uz = b[2] - a[2];
			var vx = c[0] - a[0];
			var vy = c[1] - a[1];
			var vz = c[2] - a[2];
			var nx = uy * vz - uz * vy;
			var ny = uz * vx - ux * vz;
			var nz = ux * vy - uy * vx;
			var up = Math.abs(ny) / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);

			/* The side it shows: by its normals, as many exports wind their triangles either way. The underside of a map is no floor. */
			if (up > 0.55 && (shown === null ? ny > 0 : shown > 0)) flat(a, b, c);
			else if (up < 0.35) upright(a, b, c);

			if (up < 0.8)
				keep(a, b, c);
		}

		parts.forEach(function (part) {
			var p = part.Positions;
			var list = part.Indices;
			var i;

			if (part.Soft) return;

			function point (at) {
				return [p[at * 3], p[at * 3 + 1], p[at * 3 + 2]];
			}

			function facing (a, b, c) {
				return part.Normals && part.Normals.length ? part.Normals[a * 3 + 1] + part.Normals[b * 3 + 1] + part.Normals[c * 3 + 1] : null;
			}

			for (i = 0; i < list.length; i += 3)
				triangle(point(list[i]), point(list[i + 1]), point(list[i + 2]), facing(list[i], list[i + 1], list[i + 2]));
		});

		function support (index, y) {
			var best = -Infinity;
			var i;

			if (index >= 0) {
				for (i = 0; i < counts[index]; i++) {
					var level = floors[index * layers + i] + lift;
					if ((y === undefined || level <= y + step) && level > best)
						best = level;
				}
			}

			if (settings.Plane && best < 0 && (y === undefined || y >= -step))
				best = 0;

			return best === -Infinity ? null : best;
		}

		function walled (index, y) {
			return (walls[index] || []).some(function (each) {
				return each[1] + lift > y + 0.5 && each[0] + lift < y + 1.5;
			});
		}

		/* The floors that hang together: walked over from each that nobody came to yet. */
		function spots () {
			var seen = new Uint8Array(grid * grid * layers);
			var found = [];
			var start;

			for (start = 0; start < seen.length; start++) {
				if (!seen[start] && start % layers < counts[Math.floor(start / layers)])
					found.push(spread(start, seen));
			}

			return found.sort(function (a, b) {
				return b.Size - a.Size;
			}).slice(0, 12);
		}

		function spread (start, seen) {
			var stack = [start];
			var size = 0;
			var sumX = 0;
			var sumZ = 0;
			var best = start;
			var nearest = Infinity;
			var cells = [];

			seen[start] = 1;

			while (stack.length) {
				var at = stack.pop();
				var index = Math.floor(at / layers);
				var y = floors[at];
				var row = Math.floor(index / grid);
				var column = index % grid;

				size++;
				sumX += column;
				sumZ += row;

				if (size < 4096)
					cells.push(at);

				[column > 0 ? index - 1 : -1, column < grid - 1 ? index + 1 : -1, row > 0 ? index - grid : -1, row < grid - 1 ? index + grid : -1].forEach(function (next) {
					var i;

					for (i = 0; next >= 0 && i < counts[next]; i++) {
						var other = next * layers + i;

						if (!seen[other] && Math.abs(floors[other] - y) < step && !walled(next, floors[other] + lift)) {
							seen[other] = 1;

							stack.push(other);
						}
					}
				});
			}

			cells.forEach(function (at) {
				var index = Math.floor(at / layers);
				var far = Math.pow(index % grid - sumX / size, 2) + Math.pow(Math.floor(index / grid) - sumZ / size, 2);

				if (far < nearest) {
					nearest = far;
					best = at;
				}
			});

			return {X: low[0] + (Math.floor(best / layers) % grid + 0.5) * cell, Z: low[2] + (Math.floor(Math.floor(best / layers) / grid) + 0.5) * cell, Y: floors[best] + lift, Size: size};
		}

		field = {
			Size: Math.max(Math.abs(low[0]), Math.abs(high[0]), Math.abs(low[2]), Math.abs(high[2])) * 2.1,
			Top: high[1] + lift,
			Water: 0,
			Whole: true,
			Center: [0, 0, 0],
			Lift: lift,

			Height: function (x, z, y) {
				var found = support(indexOf(x, z), y);

				return found === null ? y === undefined ? 0 : y : found;
			},

			CanStep: function (x, z, y) {
				var index = indexOf(x, z);

				return support(index, y) !== null && (!settings.Plane || Math.abs(x) < field.Size / 2 && Math.abs(z) < field.Size / 2) && !walled(index, y);
			},

			Blocked: function (x, z, y) {
				return walled(indexOf(x, z), y);
			},

			Push: function (x, z, y, radius, from, to) {
				var place = [x, z];
				var low2 = y - lift + from;
				var high2 = y - lift + to;
				var seen = [];

				[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (corner) {
					(hashed[hashOf(x + corner[0] * radius, z + corner[1] * radius)] || []).forEach(function (three) {
						if (seen.indexOf(three) === -1)
							seen.push(three);
					});
				});

				/* Twice over: out of one wall may be into the next. */
				[0, 1].forEach(function () {
					seen.forEach(function (three) {
						pushOut(place, band(three, low2, high2), radius);
					});
				});

				return place;
			},

			Stands: function (x, z, y) {
				return support(indexOf(x, z), y) !== null && (!settings.Plane || Math.abs(x) < field.Size / 2 && Math.abs(z) < field.Size / 2);
			},

			Normal: function () {
				return [0, 1, 0];
			},

			Slope: function () {
				return 0;
			},

			Walkable: function (x, z) {
				return support(indexOf(x, z)) !== null;
			},

			Spots: spots,

			Start: function () {
				var best = spots()[0];

				return best ? [best.X, best.Z, best.Y] : [0, 0, lift];
			},

			/* A location is drawn by its model: the ground of a scene has nothing to add. */
			Chunk: function () {
				var half = settings.Plane ? field.Size : 0.01;
				var y = settings.Plane ? 0 : -1000;
				var color = [0.3, 0.42, 0.2];

				return {Positions: [-half, y, -half, half, y, -half, half, y, half, -half, y, half], Normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], UVs: [0, 0, 1, 0, 1, 1, 0, 1], Colors: color.concat(color, color, color), Indices: [0, 2, 1, 0, 3, 2]};
			},

			/*
			 * A way straight there, of points {X, Z} (as a Scene asks for one) or [x, z]. Regression: it read only [x, z], and a
			 * walker sent anywhere over a location of a model (a patrol, an order) went to NaN and was lost.
			 */
			Path: function (from, to) {
				return [{X: Array.isArray(from) ? from[0] : from.X, Z: Array.isArray(from) ? from[1] : from.Z}, {X: Array.isArray(to) ? to[0] : to.X, Z: Array.isArray(to) ? to[1] : to.Z}];
			}
		};

		return field;
	},


	/*
	 * The colors of the ground of a flat map: sand by the sea, grass, rock on the slopes, rock and snow on the heights
	 * where its Rock and Snow begin (none on a field that has none).
	 */
	Paint: function (field, x, z, y, slope, into) {
		var self = this;
		var look = field.Sketch ? field.Sketch.Look(x, z) : null;
		var lands = !(look && look.Palette) && field.Biomes ? field.Biome(x, z) : null;
		var color = [0, 0, 0];

		if (!lands || lands.List.length === 1)
			return this.Painted(field, x, z, y, slope, look, look && look.Palette || (lands ? lands.List[0].Ground : field.Palette) || {}, into, 1);

		/* Where lands meet, their colors in their parts. */
		lands.List.forEach(function (land) {
			var made = self.Painted(field, x, z, y, slope, look, land.Ground || {}, into, land.Weight);

			color[0] += made[0] * land.Weight;
			color[1] += made[1] * land.Weight;
			color[2] += made[2] * land.Weight;
		});

		return color;
	},

	/*
	 * The colors of a point of a flat map of a palette (Paint); into (12 numbers): the weight of each material of the field
	 * there (its slots, field.Materials), weight: how much of the point this palette is.
	 */
	Painted: function (field, x, z, y, slope, look, palette, into, weight) {
		var top = Math.max(1, field.Top);
		var own = palette.Materials || {};
		var made = [];
		var rock = field.Rock === undefined ? top * this.Zones.Rock : field.Rock;
		var snow = field.Snow === undefined ? top * this.Zones.Snow : field.Snow;
		var part = Math.min(1, y / (isFinite(rock) ? rock : top));
		var low = palette.Low || [0.3, 0.5, 0.22];
		var upper = palette.High || [0.39, 0.43, 0.25];
		var color;

		/* Under the sea the sand goes on, darker and darker as it goes down (seen through the water now). */
		if (y < -0.5) {
			color = [0, 1, 2].map(function (k) {
				var sand = (palette.Sand || [0.76, 0.7, 0.52])[k];

				return sand + ((palette.Deep || [0.2, 0.26, 0.3])[k] - sand) * Math.min(1, (-0.5 - y) / 7.5);
			});
		}
		else if (y < 1.2) {
			color = palette.Sand || [0.76, 0.7, 0.52];
		}
		else {
			/*
			 * Grass, rock and snow by the height and the slope, each a little into the next over a band (the snow line
			 * wavy): the corners of a triangle of a hillside on both sides of a line have near weights, so no teeth of one
			 * triangle and the next run down it.
			 */
			var band = Math.max(2, top * 0.03);
			var wave = (Math.sin(x * 0.013 + z * 0.004) + Math.sin(z * 0.017 - x * 0.007)) * band * 0.5;
			var high = isFinite(rock) ? this.Smoothstep(rock - band, rock + band, y + wave * 0.5) : 0;
			var snowy = isFinite(snow) ? this.Smoothstep(snow - band, snow + band, y + wave) : 0;
			var steep = this.Smoothstep(0.2, 0.45, slope);
			var grass = (1 - high) * (1 - snowy) * (1 - steep);
			var stone = high * (1 - snowy) * (1 - steep) + steep;
			var white = snowy * (1 - steep);
			var green = [low[0] + (upper[0] - low[0]) * part, low[1] + (upper[1] - low[1]) * part, low[2] + (upper[2] - low[2]) * part];
			var grey = steep > 0 ? palette.Rock || [0.42, 0.39, 0.35] : palette.Rock || [0.45, 0.42, 0.36];
			var snowColor = palette.Snow || [0.93, 0.94, 0.96];

			color = [0, 1, 2].map(function (k) {
				return green[k] * grass + grey[k] * stone + snowColor[k] * white;
			});

			if (into)
				made = [[own.Low || this.GroundMaterials.Low, (1 - part) * grass], [own.High || this.GroundMaterials.High, part * grass], [own.Rock || this.GroundMaterials.Rock, stone], [own.Snow || this.GroundMaterials.Snow, white]].filter(function (one) {
					return one[1] > 0;
				});
		}

		/* What it is made of, as its color goes. */
		if (into && y < 1.2)
			made = [[y < -0.5 ? own.Deep || this.GroundMaterials.Deep : own.Sand || this.GroundMaterials.Sand, 1]];

		if (field.Roads && this.OnRoad(field, x, z, 1.8)) {
			color = palette.Road || [0.5, 0.42, 0.32];
			made = [[own.Road || this.GroundMaterials.Road, 1]];
		}

		/* What a sketch lays there: a road, a beach, the bed of a river. */
		if (look && look.Color) {
			color = [color[0] + (look.Color[0] - color[0]) * look.Tint, color[1] + (look.Color[1] - color[1]) * look.Tint, color[2] + (look.Color[2] - color[2]) * look.Tint];

			if (look.Material)
				made = made.map(function (one) {
					return [one[0], one[1] * (1 - look.Tint)];
				}).concat([[look.Material, look.Tint]]);
		}

		if (into && field.MaterialSlot) {
			made.forEach(function (one) {
				var slot = field.MaterialSlot[one[0]];
				if (slot !== undefined)
					into[slot] += one[1] * weight;
			});
		}

		return color;
	},

	/* What each part of a palette is made of, unless its Materials say otherwise (SceneMaterials). */
	GroundMaterials: {},

	/* The lands of a ground or a planet that names none (resources/terrain/planet-biomes): the one list of all of them. */
	DefaultBiomes: [],

	/* Where rock and snow begin, parts of the Top of a ground that tells none (resources/terrain/zones). */
	Zones: {Rock: 0.45, Snow: 0.75},

	/* What each item of a sketch lays on the ground, unless its Material says otherwise. */
	LookMaterials: {},

	/*
	 * The materials a field is made of: those of its palettes (its own, of its lands, of the biomes of its sketch) and of
	 * the items of its sketch, the first 12 (the slots of the shader of its ground).
	 */
	MaterialsOf: function (field) {
		var self = this;
		var names = [];
		var palettes = field.Biomes && field.Biomes.length ? field.Biomes.map(function (land) {
			return land.Ground;
		}) : [field.Palette];

		function add (name) {
			if (name && names.indexOf(name) === -1 && names.length < 12)
				names.push(name);
		}

		function parts (list) {
			palettes.forEach(function (one) {
				var own = one && one.Materials || {};

				list.forEach(function (part) {
					add(own[part] || self.GroundMaterials[part]);
				});
			});
		}

		/* What most of it is first, then what its sketch lays, then snow and the bed of the sea. */
		parts(['Low', 'High', 'Rock', 'Sand', 'Road']);

		((field.Options.Sketch || {}).Layers || []).forEach(function (layer) {
			(layer.Items || []).forEach(function (item) {
				if (item.Type === 'biome' && item.Palette) {
					palettes.push(item.Palette);

					return;
				}

				add(item.Material || self.LookMaterials[item.Type]);
			});
		});

		parts(['Low', 'High', 'Rock', 'Sand', 'Road', 'Snow', 'Deep']);

		return names;
	},


	/* Whether a point is within a distance of a road of a field. */
	OnRoad: function (field, x, z, width) {
		return (field.Roads || []).some(function (road) {
			var i;

			for (i = 0; i + 1 < road.length; i++) {
				var ax = road[i][0];
				var az = road[i][1];
				var dx = road[i + 1][0] - ax;
				var dz = road[i + 1][1] - az;
				var t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
				var px = ax + dx * t - x;
				var pz = az + dz * t - z;
				if (px * px + pz * pz < width * width) return true;
			}

			return false;
		});
	},

	/* A square of a flat map as a geometry: its positions relative to its middle, a skirt down its four edges. */
	/* SceneTerrainGenerator: the volume of a ground (caves, tunnels, overhangs) */

	/*
	 * The volume of a flat ground of its options (Carves: a list of what is cut out of it and what juts out of it), over its
	 * heights: solid where Density(x, y, z) is over 0, the heights of the ground under the sky where nothing is told. null
	 * with no Carves. Each carve:
	 * - tunnel: Points [[x, z, y]...] (y: the height of its axis; none: Depth under the ground there, and at an end of no
 *   Depth, 0, its mouth: its floor on the ground, walked in and out of), Radius (2.5), Flat
	 *   (0 to 1: how much of its bottom is cut level to walk on, 0.5), Crust (metres of the ground over it never cut, so a
	 *   shallow one keeps a roof; none: it opens where it reaches the surface); of a Width, a box round its axis in place of a
	 *   round bore: Width, Height (two radii), its floor and vault level, its corners round by Corner (1.5): the bore of a
	 *   wide road;
	 * - sphere: At [x, y, z], Radius: a hole dug;
	 * - caves: natural caves of noise, ways and halls, under the ground round Center [x, z] within Radius: Top and Bottom
	 *   (metres under the ground where they are, 3 and 40; Top 0 lets them open to the sky), Scale (the size of their
	 *   features, 24), Width (of their ways, 0 to 1, 0.35), Halls (0 to 1, how much of them are halls, 0.5), Seed;
	 * - passages: a graph of ways under the ground and halls where they part (Passages: Nodes, Ways), for walkers (round
	 *   bores, their floors level) or roads (ways of a Width); Rough (0 to 1: walls of a natural cave, a noise as deep as so
	 *   much of the widest half; 0: smooth), Scale (of its noise, 6), Crust, Seed; the ways and halls joined smoothly;
	 * - overhangs: rock that juts out of the steep slopes, round Center within Radius (none: all the ground): Amount (how
	 *   far, metres, 6), Scale (24), Slope (where it begins, 0.45), Seed.
	 * Gives {Density(x, y, z), Touches(x0, z0, x1, z1) (whether a square of the ground is more than its heights),
	 * Range(x0, z0, x1, z1) ([lowest, highest] of what it adds there), Carves}.
	 */
	Volume: function (settings, field) {
		var self = this;
		/* Its heights as the noise and the sketch make them, never of what the volume makes of them (Underground). */
		var ground = field.Height;
		var carves = (settings.Carves || []).filter(function (carve) {
			return carve && carve.Type;
		});
		var made;

		if (!carves.length) return null;

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		made = carves.map(function (carve, index) {
			var seed = String(carve.Seed === undefined ? (settings.Seed === undefined ? 'ground' : settings.Seed) + '-carve-' + index : carve.Seed);
			var one = {Type: carve.Type, Carve: carve, Seed: seed};
			var points;

			if (carve.Type === 'tunnel') {
				one.Radius = number(carve.Radius, self.TunnelRadius);
				one.Flat = Math.max(0, Math.min(1, number(carve.Flat, self.Carves.Tunnel.Flat)));

				/*
				 * Its floor under its axis (as Geometry.Tunnel cuts it: (1 - Flat * 0.6) of its radius, half the Height of a box). An
				 * end of no height and no Depth (0) is its mouth: its floor on the ground there, so a walker goes in and out of it.
				 * Regression: its axis was on the ground, its floor 2.8 m under it, and a walker fell into it and never came out.
				 */
				var floor = number(carve.Width, 0) > 0 ? number(carve.Height, one.Radius * 2) / 2 : one.Radius * (1 - one.Flat * 0.6);
				var mouths = !(number(carve.Depth, 0) > 0);

				points = (carve.Points || []).map(function (point, index, all) {
					var open = point[2] === undefined || point[2] === null;
					var end = index === 0 || index === all.length - 1;

					return [Number(point[0]), !open ? Number(point[2]) : end && mouths ? ground(point[0], point[1]) + floor : ground(point[0], point[1]) - number(carve.Depth, 0), Number(point[1])];
				});
				one.Points = points;
				one.Crust = carve.Crust === undefined || carve.Crust === null || carve.Crust === '' ? -1 : number(carve.Crust, -1);
				/* Of a Width: a box round its axis (Height, its corners round by Corner), not a round bore. */
				one.Width = number(carve.Width, 0);
				one.Height = number(carve.Height, one.Radius * 2);
				one.Corner = Math.max(0.01, Math.min(number(carve.Corner, 1.5), one.Width / 2, one.Height / 2));
				one.Bounds = points.reduce(function (box, point) {
					return [Math.min(box[0], point[0]), Math.min(box[1], point[1]), Math.min(box[2], point[2]), Math.max(box[3], point[0]), Math.max(box[4], point[1]), Math.max(box[5], point[2])];
				}, [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity]);

				var reach = Math.max(one.Radius, one.Width > 0 ? Math.max(one.Width, one.Height) / 2 : 0);

				one.Bounds = [one.Bounds[0] - reach, one.Bounds[1] - reach, one.Bounds[2] - reach, one.Bounds[3] + reach, one.Bounds[4] + reach, one.Bounds[5] + reach];
			}
			else if (carve.Type === 'passages') {
				/* A graph of ways and halls: each way a tunnel from its node through its points to its other node, a hall at a fork. */
				var graph = self.Passages(carve, ground);
				var crust = carve.Crust === undefined || carve.Crust === null || carve.Crust === '' ? -1 : number(carve.Crust, -1);
				var widest = 0;

				one.Graph = graph;
				one.Crust = crust;
				one.Rough = Math.max(0, number(carve.Rough, self.Carves.Passages.Rough));
				one.Tunnels = graph.Ways.map(function (way) {
					var made = {Points: way.Points, Radius: way.Radius, Flat: way.Flat, Crust: crust, Width: way.Width, Height: way.Height};

					made.Corner = Math.max(0.01, Math.min(1.5, made.Width / 2, made.Height / 2));
					made.Reach = made.Width > 0 ? Math.hypot(made.Width, made.Height) / 2 : made.Radius;
					made.Low = made.Width > 0 ? made.Height / 2 : made.Radius * (1 - made.Flat * 0.6);
					widest = Math.max(widest, made.Reach);

					return made;
				});
				one.Halls = graph.Nodes.filter(function (node) {
					return node.Hall > 0;
				}).map(function (node) {
					return {At: node.At, Radius: node.Hall, Floor: node.Floor, Crust: crust};
				});
				one.Blend = Math.min(1.5, widest * 0.6);
				one.Amount = one.Rough * widest * 0.5;
				one.Scale = number(carve.Scale, self.Carves.Passages.Scale);

				var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];

				one.Tunnels.forEach(function (tunnel) {
					tunnel.Points.forEach(function (point) {
						box = [Math.min(box[0], point[0] - tunnel.Reach), Math.min(box[1], point[1] - tunnel.Reach), Math.min(box[2], point[2] - tunnel.Reach), Math.max(box[3], point[0] + tunnel.Reach), Math.max(box[4], point[1] + tunnel.Reach), Math.max(box[5], point[2] + tunnel.Reach)];
					});
				});

				one.Halls.forEach(function (hall) {
					box = [Math.min(box[0], hall.At[0] - hall.Radius), Math.min(box[1], hall.At[1] - hall.Radius), Math.min(box[2], hall.At[2] - hall.Radius), Math.max(box[3], hall.At[0] + hall.Radius), Math.max(box[4], hall.At[1] + hall.Radius), Math.max(box[5], hall.At[2] + hall.Radius)];
				});

				if (!isFinite(box[0])) return null;

				var more = one.Amount + one.Blend;

				one.Bounds = [box[0] - more, box[1] - more, box[2] - more, box[3] + more, box[4] + more, box[5] + more];
			}
			else if (carve.Type === 'sphere') {
				one.At = (carve.At || [0, 0, 0]).map(Number);
				one.Radius = number(carve.Radius, 2);
				one.Bounds = [one.At[0] - one.Radius, one.At[1] - one.Radius, one.At[2] - one.Radius, one.At[0] + one.Radius, one.At[1] + one.Radius, one.At[2] + one.Radius];
			}
			else if (carve.Type === 'caves') {
				one.Center = (carve.Center || [0, 0]).map(Number);
				one.Radius = number(carve.Radius, self.Carves.Caves.Radius);
				one.Top = number(carve.Top, self.Carves.Caves.Top);
				one.Bottom = number(carve.Bottom, self.Carves.Caves.Bottom);
				one.Scale = number(carve.Scale, self.Carves.Caves.Scale);
				one.Width = number(carve.Width, self.Carves.Caves.Width);
				one.Halls = number(carve.Halls, self.Carves.Caves.Halls);
				one.Bounds = [one.Center[0] - one.Radius, -Infinity, one.Center[1] - one.Radius, one.Center[0] + one.Radius, Infinity, one.Center[1] + one.Radius];
			}
			else if (carve.Type === 'overhangs') {
				one.Center = carve.Center ? carve.Center.map(Number) : null;
				one.Radius = number(carve.Radius, Infinity);
				one.Amount = number(carve.Amount, self.Carves.Overhangs.Amount);
				one.Scale = number(carve.Scale, self.Carves.Overhangs.Scale);
				one.Slope = number(carve.Slope, self.Carves.Overhangs.Slope);
				one.Bounds = one.Center && isFinite(one.Radius) ? [one.Center[0] - one.Radius - one.Amount, -Infinity, one.Center[1] - one.Radius - one.Amount, one.Center[0] + one.Radius + one.Amount, Infinity, one.Center[1] + one.Radius + one.Amount] : [-Infinity, -Infinity, -Infinity, Infinity, Infinity, Infinity];
			}
			else {
				return null;
			}

			return one;
		}).filter(Boolean);

		made.forEach(function (one) {
			carved(one);
		});

		/*
		 * The graph of the type of a carve made ready for it (blueprints/carve/<type>, CarveRun): its function (Main), its
		 * inputs (Args: of the carve once; X, Y, Z, G the ground over the point and Steep its slope, At their places), its
		 * results (Keys). Regression: the shape of each carve was written out in code here.
		 */
		function carved (one) {
			var run = self.CarveRun(one.Type, settings.GraphCode);
			var center = one.Center || one.At || [0, 0, 0];
			var shifts = {SA: '-a', SB: '-b', SH: '-h', SR: '-rough', SX: '-x', SZ: '-z'};

			if (!run)
				throw new Error('Elemenx SceneTerrainGenerator: no graph of the carve ' + one.Type);

			one.Main = run.Main;
			one.Keys = run.Keys;
			one.Slots = {X: run.Inputs.indexOf('X'), Y: run.Inputs.indexOf('Y'), Z: run.Inputs.indexOf('Z'), G: run.Inputs.indexOf('G'), Steep: run.Inputs.indexOf('Steep')};
			one.Args = run.Inputs.map(function (name) {
				var flat = [];

				if (['X', 'Y', 'Z', 'G', 'Steep'].indexOf(name) !== -1) return 0;

				if (name === 'Points') {
					one.Points.forEach(function (point) {
						flat.push(point[0], point[1], point[2]);
					});

					return flat;
				}

				if (name === 'Packed') return packed(one);

				if (name === 'HasCenter')
					return one.Center ? 1 : 0;

				if (name === 'CX') return center[0];

				if (name === 'CY')
					return one.Type === 'sphere' ? center[1] : 0;

				if (name === 'CZ')
					return one.Type === 'sphere' ? center[2] : center[1];

				if (shifts[name])
					return self.$Service('Math').SeedOffset(one.Seed + shifts[name]);

				return Number(one[name]) === one[name] ? one[name] : 0;
			});
		}

		/* The ways and halls of a graph of passages as numbers, as Geometry.Passages takes them. */
		function packed (one) {
			var list = [one.Tunnels.length, one.Halls.length];

			one.Tunnels.forEach(function (way) {
				list.push(way.Points.length, way.Radius, way.Flat, way.Width || 0, way.Height || 0, way.Corner, way.Low);

				way.Points.forEach(function (point) {
					list.push(point[0], point[1], point[2]);
				});
			});

			one.Halls.forEach(function (hall) {
				list.push(hall.At[0], hall.At[1], hall.At[2], hall.Radius, hall.Floor);
			});

			return list;
		}

		/* What the graph of a carve gives at a point: its density, or of overhangs [Share, WX, WZ] (by its Keys). */
		function ran (one, x, y, z, top, slope) {
			var args = one.Args;
			var at = one.Slots;

			args[at.X] = x;
			args[at.Y] = y;
			args[at.Z] = z;

			if (at.G >= 0)
				args[at.G] = top;

			if (at.Steep >= 0)
				args[at.Steep] = slope;

			return one.Main.apply(null, args);
		}

		/* How steep the ground is at a point, 0 flat to 1 a wall, for overhangs: of its own heights, never of the volume. */
		function steep (x, z) {
			var dx = ground(x + 0.5, z) - ground(x - 0.5, z);
			var dz = ground(x, z + 0.5) - ground(x, z - 0.5);

			return 1 - 1 / Math.sqrt(dx * dx + 1 + dz * dz);
		}

		/* How far a square [x0, z0, x1, z1] is from a piece of an axis from a to b ([x, y, z]), across the ground: 0 where it crosses it. */
		function squareNear (x0, z0, x1, z1, a, b) {
			var corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
			var dx = b[0] - a[0];
			var dz = b[2] - a[2];
			var length = dx * dx + dz * dz || 1;

			function out (x, z) {
				return Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
			}

			/* Crossing one of its sides, or inside it. */
			function crosses (p, q) {
				var d1 = (q[0] - p[0]) * (a[2] - p[1]) - (q[1] - p[1]) * (a[0] - p[0]);
				var d2 = (q[0] - p[0]) * (b[2] - p[1]) - (q[1] - p[1]) * (b[0] - p[0]);
				var d3 = dx * (p[1] - a[2]) - dz * (p[0] - a[0]);
				var d4 = dx * (q[1] - a[2]) - dz * (q[0] - a[0]);

				return d1 * d2 <= 0 && d3 * d4 <= 0;
			}

			if (!out(a[0], a[2]) || !out(b[0], b[2]) || corners.some(function (corner, index) {
				return crosses(corner, corners[(index + 1) % 4]);
			})) return 0;

			return Math.min(out(a[0], a[2]), out(b[0], b[2]), Math.min.apply(Math, corners.map(function (corner) {
				var t = Math.max(0, Math.min(1, ((corner[0] - a[0]) * dx + (corner[1] - a[2]) * dz) / length));

				return Math.hypot(a[0] + dx * t - corner[0], a[2] + dz * t - corner[1]);
			})));
		}

		function inside (one, x, y, z) {
			var b = one.Bounds;

			return x >= b[0] && y >= b[1] && z >= b[2] && x <= b[3] && y <= b[4] && z <= b[5];
		}

		/*
		 * The density of a point: the ground (its height over the point), pushed aside on steep slopes by overhangs, then each
		 * carve cut out of it. column: [height, slope] of the point's x and z, when they are known already.
		 */
		function density (x, y, z, column) {
			var top = column ? column[0] : ground(x, z);
			var value = top - y;
			var i;

			for (i = 0; i < made.length; i++) {
				var one = made[i];

				/* Overhangs: the ground read pushed aside, by its graph (Share, WX, WZ). */
				if (one.Type === 'overhangs' && inside(one, x, y, z)) {
					var pushed = ran(one, x, y, z, top, column ? column[1] : steep(x, z));
					if (pushed[one.Keys.indexOf('Share')] > 0)
						value = ground(x + pushed[one.Keys.indexOf('WX')], z + pushed[one.Keys.indexOf('WZ')]) - y;
				}
			}

			for (i = 0; i < made.length; i++) {
				var carve = made[i];
				if (carve.Type === 'overhangs' || !inside(carve, x, y, z)) continue;

				value = Math.min(value, ran(carve, x, y, z, top, 0));
			}

			return value;
		}

		/* Whether a carve may change the density in a square [x0, z0, x1, z1]: near its ways and halls, an overhang where it is steep. */
		function touches (one, x0, z0, x1, z1) {
			var b = one.Bounds;
			if (b[3] < x0 || b[0] > x1 || b[5] < z0 || b[2] > z1) return false;

			/* Overhangs only where it is steep somewhere in the square (of a few metres its corners). */
			if (one.Type === 'overhangs') {
				var marks = x1 - x0 < 4 && z1 - z0 < 4 ? [0, 1] : [0, 0.25, 0.5, 0.75, 1];

				return marks.some(function (u) {
					return marks.some(function (v) {
						return steep(x0 + (x1 - x0) * u, z0 + (z1 - z0) * v) > one.Slope - 0.1;
					});
				});
			}

			/*
			 * Regression: a tunnel by the box of all of it made each square in that box of the volume, though it was far
			 * from most, and a square of the volume beside one of heights showed a step: by how far it is from its axis.
			 */
			if (one.Type === 'tunnel')
				return one.Points.some(function (point, index) {
					return squareNear(x0, z0, x1, z1, point, one.Points[index + 1] || point) <= (one.Width > 0 ? Math.hypot(one.Width, one.Height) / 2 : one.Radius) + 0.5;
				});

			/* Passages: by how far it is from the axis of each way and the middle of each hall. */
			if (one.Type === 'passages')
				return one.Tunnels.some(function (way) {
					return way.Points.some(function (point, index) {
						return squareNear(x0, z0, x1, z1, point, way.Points[index + 1] || point) <= way.Reach + one.Amount + one.Blend + 0.5;
					});
				}) || one.Halls.some(function (hall) {
					return squareNear(x0, z0, x1, z1, hall.At, hall.At) <= hall.Radius + one.Amount + one.Blend + 0.5;
				});

			return true;
		}

		return {
			Carves: made,
			Density: density,
			Steep: steep,
			/* Its heights before anything is cut out of them. */
			Ground: ground,

			Touches: function (x0, z0, x1, z1) {
				return made.some(function (one) {
					return touches(one, x0, z0, x1, z1);
				});
			},

			/*
			 * The heights the carves may change the density of a column within ([low, high]), null with none: out of them it
			 * is its height (Ground) less y, as Density gives it, and need not be asked. Of the carves whose ways and halls
			 * are within margin of the column (Touches); top: its height; enclosed: only those that hollow it (no overhangs).
			 */
			Span: function (x, z, top, margin, enclosed) {
				var near = margin || 0;
				var span = null;

				made.forEach(function (one) {
					var b = one.Bounds;
					var low;
					var high;

					if (enclosed && one.Type === 'overhangs' || !touches(one, x - near, z - near, x + near, z + near)) return;

					/* An overhang takes the height of the ground up to Amount aside: on a slope of g, as much as Amount g higher or lower. */
					if (one.Type === 'overhangs') {
						var g = Math.sqrt(Math.max(0, 1 / Math.pow(Math.max(1e-3, 1 - steep(x, z)), 2) - 1));

						low = top - one.Amount * (g + 1) - 4;
						high = top + one.Amount * (g + 1) + 4;
					}
					else {
						/* Natural caves: in their band under the ground (Top to Bottom deep). */
						low = isFinite(b[1]) ? b[1] : top - (one.Type === 'caves' ? one.Bottom + 2 : 4);
						high = isFinite(b[4]) ? b[4] : top - (one.Type === 'caves' ? one.Top - 2 : -4);
					}

					span = span ? [Math.min(span[0], low), Math.max(span[1], high)] : [low, high];
				});

				return span;
			},

			Range: function (x0, z0, x1, z1, low, high) {
				made.forEach(function (one) {
					var b = one.Bounds;
					if (b[3] < x0 || b[0] > x1 || b[5] < z0 || b[2] > z1) return;

					if (one.Type === 'caves') low = Math.min(low, low - one.Bottom);
					else if (one.Type === 'overhangs') high = high + one.Amount * 0.5;
					else low = Math.min(low, b[1]);
				});

				return [low, high];
			}
		};
	},

	/*
	 * The graph of a carve of passages (forks of ways under the ground, for walkers or for roads): its Nodes [{ID, At [x, z]
	 * or [x, z, y] (none: Depth under the ground there, 6), Radius (of its hall), Depth}] and its Ways [{ID, From, To (IDs of
	 * nodes), Points (between them, [x, z] or [x, z, y]: none, in a straight grade from one end to the other), Radius (of
	 * its bore, Radius of the carve, 2.5), Flat (0.5), Width and Height (a box, as a tunnel of a road)}]. height(x, z): the
	 * ground. Gives {Nodes: [{ID, At [x, y, z], Ways (their IDs), Kind (end, bend, fork, cross: by their count), Hall (the
	 * radius of its hall: its Radius, else at a fork or a cross half again its widest way and more; 0: none), Floor}], Ways:
	 * [{ID, From, To, Points [[x, y, z]...] from its node to the other, Length, Radius, Flat, Width, Height}]}. A way of a
	 * node not told is left out.
	 */
	Passages: function (carve, height) {
		var given = carve || {};
		var radius = Number(given.Radius) > 0 ? Number(given.Radius) : this.TunnelRadius;
		var flat = given.Flat === undefined || given.Flat === null || given.Flat === '' ? 0.5 : Math.max(0, Math.min(1, Number(given.Flat)));
		var depth = given.Depth === undefined || given.Depth === null || given.Depth === '' ? 6 : Number(given.Depth);
		var ground = typeof height === 'function' ? height : function () {
			return 0;
		};
		var byID = {};
		var nodes = (given.Nodes || []).map(function (node, index) {
			var at = node.At || [0, 0];
			var deep = node.Depth === undefined || node.Depth === null || node.Depth === '' ? depth : Number(node.Depth);
			var made = {ID: node.ID === undefined || node.ID === null ? String(index) : String(node.ID), At: [Number(at[0]) || 0, at.length > 2 && at[2] !== null && at[2] !== undefined ? Number(at[2]) : ground(Number(at[0]) || 0, Number(at[1]) || 0) - deep, Number(at[1]) || 0], Ways: [], Kind: 'end', Hall: Number(node.Radius) > 0 ? Number(node.Radius) : 0, Told: Number(node.Radius) > 0, Floor: 0, Widest: 0, Low: 0};

			byID[made.ID] = made;

			return made;
		});
		var ways = (given.Ways || []).map(function (way, index) {
			var from = byID[String(way.From)];
			var to = byID[String(way.To)];
			if (!from || !to) return null;

			var bore = Number(way.Radius) > 0 ? Number(way.Radius) : radius;
			var width = Number(way.Width) > 0 ? Number(way.Width) : 0;
			var high = Number(way.Height) > 0 ? Number(way.Height) : bore * 2;
			var level = way.Flat === undefined || way.Flat === null || way.Flat === '' ? flat : Math.max(0, Math.min(1, Number(way.Flat)));
			var between = (way.Points || []).map(function (point) {
				return [Number(point[0]) || 0, point.length > 2 && point[2] !== null && point[2] !== undefined ? Number(point[2]) : null, Number(point[1]) || 0];
			});
			var points = [from.At.slice()].concat(between).concat([to.At.slice()]);
			var along = [0];
			var length;
			var i;

			for (i = 1; i < points.length; i++)
				along.push(along[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][2] - points[i - 1][2]));

			length = along[along.length - 1] || 1;

			/* A point of no height: on the straight grade from its node to the other. */
			points.forEach(function (point, at) {
				if (point[1] === null)
					point[1] = from.At[1] + (to.At[1] - from.At[1]) * along[at] / length;
			});

			var made = {ID: way.ID === undefined || way.ID === null ? String(index) : String(way.ID), From: from.ID, To: to.ID, Points: points, Length: 0, Radius: bore, Flat: level, Width: width, Height: high};

			for (i = 1; i < points.length; i++)
				made.Length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1], points[i][2] - points[i - 1][2]);

			[from, to].forEach(function (node) {
				node.Ways.push(made.ID);

				node.Widest = Math.max(node.Widest, width > 0 ? Math.max(width, high) / 2 : bore);
				node.Low = Math.max(node.Low, width > 0 ? high / 2 : bore * (1 - level * 0.6));
			});

			return made;
		}).filter(Boolean);

		nodes.forEach(function (node) {
			var count = node.Ways.length;

			node.Kind = count >= 4 ? 'cross' : count === 3 ? 'fork' : count === 2 ? 'bend' : 'end';

			/* A hall where ways part: half again its widest way, more of more ways; its floor at the floor of its ways. */
			if (!node.Told && count >= 3)
				node.Hall = node.Widest * (1.5 + (count - 3) * 0.25);

			node.Floor = node.At[1] - (node.Low || radius * (1 - flat * 0.6));

			delete node.Told;
			delete node.Widest;
			delete node.Low;
		});

		return {Nodes: nodes, Ways: ways};
	},

	/*
	 * The shortest way through a graph of passages (Passages, or a graph of tunnels of roads, SceneRoads.TunnelGraph) from
	 * one node to another, by the length of its ways: {Nodes (their IDs, in order), Ways, Points [[x, y, z]...], Length};
	 * null when none goes there.
	 */
	PassageRoute: function (graph, from, to) {
		var nodes = {};
		var route = {Nodes: [], Ways: [], Points: [], Length: 0};
		var found;

		(graph.Nodes || []).forEach(function (node) {
			nodes[node.ID] = node;
		});

		from = String(from);
		to = String(to);

		if (!nodes[from] || !nodes[to]) return null;

		/* Dijkstra (Pathfinding.Search of no heuristic) over its nodes, each step the way it came by. */
		found = this.$Service('Pathfinding').Search({Start: {ID: from, Way: null}, Key: function (step) {
			return step.ID;
		}, Goal: function (step) {
			return step.ID === to;
		}, Neighbors: function (step) {
			return (graph.Ways || []).filter(function (way) {
				return way.From === step.ID || way.To === step.ID;
			}).map(function (way) {
				return {Node: {ID: way.From === step.ID ? way.To : way.From, Way: way, From: step.ID}, Cost: way.Length};
			});
		}});

		if (!found)
			return null;

		route.Length = found.Cost;

		found.Path.forEach(function (step) {
			route.Nodes.push(step.ID);

			if (!step.Way) return;

			route.Ways.push(step.Way.ID);

			route.Points = route.Points.concat((step.Way.From === step.From ? step.Way.Points.slice() : step.Way.Points.slice().reverse()).slice(0, -1));
		});

		route.Points.push(nodes[to].At.slice());

		return route;
	},

	/*
	 * A field with a volume walked as a place of floors, as the ground of a location is: Height(x, z) the ground under the sky, what was cut out of it too, and Height(x, z, y) the floor a walker
	 * at y stands on, steps up to (Climb, 0.6 m) or falls to, where the carves are (else its heights as ever: y says nothing
	 * there); Blocked(x, z, y) rock where its body is; CanStep(x, z, y) a floor for it with no rock in its way (Step: that floor, or null); Stands(x, z,
	 * y) a floor for it, Up(x, y, z) how much a floor faces up (1 level), Path(from, to, rules) a way over and under it
	 * (WayUnder), not steeper than Steep (the least it faces up, 0.5) when it goes up. Climb and Steep of the options.
	 */
	Underground: function (field, settings) {
		var self = this;
		var volume = field.Volume;
		var top = field.Height;
		var climb = settings.Climb === undefined ? 0.6 : Number(settings.Climb);
		var steep = settings.Steep === undefined ? 0.5 : Number(settings.Steep);
		var step = 0.25;

		/* Whether a column is more than its heights, and how far over them rock may jut there. */
		function column (x, z) {
			var over = 0;
			var cut = false;

			volume.Carves.forEach(function (one) {
				var b = one.Bounds;
				if (x < b[0] || z < b[2] || x > b[3] || z > b[5]) return;

				if (one.Type === 'overhangs') {
					if (volume.Steep(x, z) > one.Slope - 0.1)
						over = Math.max(over, one.Amount);
				}
				else {
					cut = true;
				}
			});

			return over || cut ? {Over: over} : null;
		}

		/* The floor under y + Climb: going down, the first air over rock; null with none within 60 m. */
		/* deep: no farther down than so many metres (a walker falls no farther than that): none past them. */
		function floor (x, z, y, deep) {
			var made = column(x, z);
			var height = top(x, z);
			var at;
			var air;
			var low;
			var high;
			var i;

			if (!made)
				return height;

			/* With no y: the ground under the sky, what was cut out of it too. */
			at = y === undefined ? height + made.Over + climb : Math.min(y + climb, height + made.Over + climb);
			air = volume.Density(x, at, z) <= 0;

			for (i = 0; i < (deep ? Math.ceil(deep / step) : 240); i++) {
				var below = at - step;
				var solid = volume.Density(x, below, z) > 0;

				if (air && solid) {
					low = below;
					high = at;

					/* Where the rock begins, more nearly. */
					[0, 1, 2, 3, 4].forEach(function () {
						var middle = (low + high) / 2;

						if (volume.Density(x, middle, z) > 0) low = middle;
						else high = middle;
					});

					return (low + high) / 2;
				}

				air = !solid;
				at = below;
			}

			return null;
		}

		field.Height = function (x, z, y) {
			var found = floor(x, z, y);

			return found === null ? y : found;
		};

		field.Blocked = function (x, z, y) {
			return volume.Density(x, y + 0.3, z) > 0 || volume.Density(x, y + 1.2, z) > 0;
		};

		field.Stands = function (x, z, y) {
			var found = floor(x, z, y, climb + 8);

			return found !== null && found <= y + climb;
		};

		/* How much a floor faces up, of the density round it: 1 level, 0 a wall. */
		function up (x, y, z) {
			var e = 0.2;
			var gx = volume.Density(x + e, y, z) - volume.Density(x - e, y, z);
			var gy = volume.Density(x, y + e, z) - volume.Density(x, y - e, z);
			var gz = volume.Density(x, y, z + e) - volume.Density(x, y, z - e);

			return -gy / (Math.sqrt(gx * gx + gy * gy + gz * gz) || 1);
		}

		field.Up = up;

		/* Its ways over and under it, as a walker goes (WayUnder). */
		field.Path = function (from, to, rules) {
			return self.WayUnder(field, from, to, rules || {});
		};

		/* Up only what is not too steep (Steep: the least a floor faces up, 0.5); down anything. */
		/*
		 * The floor a walker at y steps on at x, z (up Climb at most, down 8 m at most), null where it cannot. Regression: the
		 * floor looked for 60 m down through the rock by each wall a way was looked for along, and the page held for seconds.
		 */
		field.Step = function (x, z, y) {
			var found = floor(x, z, y, climb + 8);

			return found !== null && found <= y + climb && !field.Blocked(x, z, found) && (found <= y + 0.05 || up(x, found, z) >= steep) ? found : null;
		};

		field.CanStep = function (x, z, y) {
			return field.Step(x, z, y) !== null;
		};

		return field;
	},

	/*
	 * The daylight under the ground of a volume round a square (x0, z0 to x1, z1, from low up): how much of the light of the
	 * sky comes to a point, 0 to 1. A grid of the world (Cell, 2 m), past the square by Reach (24 m): each free cell under
	 * nothing but air up to the sky has all of it; from there it goes on through the free cells, Fade (0.78) of it a cell,
	 * Reach at most: into the mouth of a cave and a little way in, none deep under the rock. Of the grid of the world and
	 * reckoned so far past the square, the same point has the same light in every square. At(x, y, z, normal): of the free
	 * corners round the point a little out of its surface, by their nearness; Grid, Cell, Origin and Size the grid.
	 */
	Daylight: function (field, x0, z0, x1, z1, low, options) {
		var given = options || {};
		var volume = field.Volume;
		var cell = given.Cell || 2;
		var reach = given.Reach === undefined ? 24 : given.Reach;
		var fade = given.Fade === undefined ? 0.78 : given.Fade;
		var far = Math.ceil(reach / cell);
		var ox = Math.floor((x0 - reach) / cell) * cell;
		var oz = Math.floor((z0 - reach) / cell) * cell;
		var sx = Math.ceil((x1 + reach - ox) / cell) + 1;
		var sz = Math.ceil((z1 + reach - oz) / cell) + 1;
		var tops = new Float32Array(sx * sz);
		var carved = new Uint8Array(sx * sz);
		var spans = new Float32Array(sx * sz * 2);
		var high = -Infinity;
		var oy;
		var sy;
		var free;
		var light;
		var queue;
		var head = 0;
		var i;
		var j;
		var k;

		for (k = 0; k < sz; k++) {
			for (i = 0; i < sx; i++) {
				var x = ox + i * cell;
				var z = oz + k * cell;
				var top = volume.Ground(x, z);
				/*
				 * The heights a carve may change the density of it within: out of them, rock under its height and air over it.
				 * Overhangs left out: they hollow nothing, the shadow of the sun darkens under them (Regression: on a ground
				 * with them every steep column was tens of metres of the density, a second a square).
				 */
				var made = volume.Span(x, z, top, cell, true);


				carved[k * sx + i] = made ? 1 : 0;
				tops[k * sx + i] = top;
				spans[(k * sx + i) * 2] = made ? made[0] - cell : 0;
				spans[(k * sx + i) * 2 + 1] = made ? made[1] + cell : 0;
				high = Math.max(high, made ? Math.max(top, made[1]) + cell : top);
			}
		}

		oy = Math.floor((low - cell * 2) / cell) * cell;
		sy = Math.max(2, Math.min(300, Math.ceil((high + cell * 2 - oy) / cell) + 1));
		free = new Uint8Array(sx * sy * sz);
		light = new Float32Array(sx * sy * sz);
		queue = new Int32Array(sx * sy * sz);

		function index (ii, jj, kk) {
			return (jj * sz + kk) * sx + ii;
		}

		/* Whether a point is rock: of the density where a carve may change it, else of the height of its column. */
		function solid (x, y, z, column) {
			return carved[column] && y >= spans[column * 2] && y <= spans[column * 2 + 1] ? volume.Density(x, y, z) > 0 : y <= tops[column];
		}

		/*
		 * Whether rock lies between two free cells, at a quarter, a half and three quarters of the way: Regression: of the
		 * cells alone, the roof of a tunnel a metre thick fell between them, and the sky was seen through it deep under the hill.
		 */
		function between (a, b) {
			var ai = a % sx;
			var ak = Math.floor(a / sx) % sz;
			var aj = Math.floor(a / (sx * sz));
			var bi = b % sx;
			var bk = Math.floor(b / sx) % sz;
			var bj = Math.floor(b / (sx * sz));
			var t;

			if (!carved[ak * sx + ai] && !carved[bk * sx + bi]) return false;

			for (t = 0.25; t < 1; t += 0.25) {
				var ci = ai + (bi - ai) * t;
				var ck = ak + (bk - ak) * t;
				var column = Math.round(ck) * sx + Math.round(ci);
				if (solid(ox + ci * cell, oy + (aj + (bj - aj) * t) * cell, oz + ck * cell, carved[column] ? column : ak * sx + ai)) return true;
			}

			return false;
		}

		/* Which cells are air, and those that see the sky straight up: lit, and where the light starts from. */
		for (k = 0; k < sz; k++) {
			for (i = 0; i < sx; i++) {
				var column = k * sx + i;
				var sky = true;

				for (j = sy - 1; j >= 0; j--) {
					var y = oy + j * cell;
					var air = !solid(ox + i * cell, y, oz + k * cell, column);
					var at = index(i, j, k);

					if (!air) {
						sky = false;

						continue;
					}

					free[at] = 1;

					/* Up to the cell over it, through rock between: no more under the sky. */
					if (sky && j < sy - 1 && between(at, index(i, j + 1, k)))
						sky = false;

					if (sky) {
						light[at] = 1;
						queue[head++] = at;
					}
				}
			}
		}

		/* On through the air: each cell takes Fade of its brightest neighbour, Reach cells from the sky at most. */
		var done = 0;
		var steps = new Uint8Array(sx * sy * sz);
		var ways = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
		var w;

		while (done < head) {
			var from = queue[done++];
			var fi = from % sx;
			var fk = Math.floor(from / sx) % sz;
			var fj = Math.floor(from / (sx * sz));
			var next = light[from] * fade;

			if (steps[from] >= far) continue;

			for (w = 0; w < 18; w += 3) {
				var ni = fi + ways[w];
				var nj = fj + ways[w + 1];
				var nk = fk + ways[w + 2];
				var to;

				if (ni < 0 || nj < 0 || nk < 0 || ni >= sx || nj >= sy || nk >= sz) continue;

				to = index(ni, nj, nk);

				if (!free[to] || light[to] >= next || between(from, to)) continue;

				light[to] = next;
				steps[to] = steps[from] + 1;
				queue[head++] = to;
			}
		}

		return {
			Grid: light,
			Cell: cell,
			Origin: [ox, oy, oz],
			Size: [sx, sy, sz],

			At: function (x, y, z, normal) {
				var px = (x + (normal ? normal[0] : 0) * cell * 0.6 - ox) / cell;
				var py = (y + (normal ? normal[1] : 0) * cell * 0.6 - oy) / cell;
				var pz = (z + (normal ? normal[2] : 0) * cell * 0.6 - oz) / cell;
				var bi = Math.floor(px);
				var bj = Math.floor(py);
				var bk = Math.floor(pz);
				var sum = 0;
				var weight = 0;
				var c;

				if (bj >= sy - 1) return 1;

				for (c = 0; c < 8; c++) {
					var ci = Math.max(0, Math.min(sx - 1, bi + (c & 1)));
					var cj = Math.max(0, Math.min(sy - 1, bj + (c >> 2 & 1)));
					var ck = Math.max(0, Math.min(sz - 1, bk + (c >> 1 & 1)));
					var at = index(ci, cj, ck);
					var w = (c & 1 ? px - bi : 1 - px + bi) * (c >> 2 & 1 ? py - bj : 1 - py + bj) * (c >> 1 & 1 ? pz - bk : 1 - pz + bk);

					if (!free[at]) continue;

					sum += light[at] * w;
					weight += w;
				}

				return weight > 1e-6 ? sum / weight : 0;
			}
		};
	},

	/*
	 * The geometry of a square of a ground with a volume (Volume), as Chunk gives it: its surface where its density goes
	 * through 0 (surface nets: a point in each cell it crosses, the mean of where it crosses its edges, joined across each
	 * edge it crosses), its positions relative to its middle, its normals of the density, the colors of the ground on top
	 * and of rock below. One more cell round it is reckoned, its points held to the edges, so its surface goes right to them;
	 * a skirt under its edges where the ground there is only its height hides what a square beside of other cells leaves.
	 */
	Volumetric: function (field, cx, cz, extent, resolution) {
		var self = this;
		var volume = field.Volume;
		var n = resolution;
		var step = extent / n;
		var x0 = cx - extent / 2;
		var z0 = cz - extent / 2;
		var low = Infinity;
		var high = -Infinity;
		var side = n + 3;
		var columns = [];
		var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Materials: [], Indices: []};
		var range;
		var y0;
		var layers;
		var values;
		var cells;
		var i;
		var j;
		var k;

		/* The heights and slopes of the columns, one more round the square. */
		for (k = -1; k <= n + 1; k++) {
			for (i = -1; i <= n + 1; i++) {
				/*
				 * Of its heights before anything is cut (Volume.Ground), as the density is. Regression: of the heights of the
				 * place of floors (Underground), a column of a cut open to the sky had the floor of the cut for its top, the
				 * density there sank, and flaps of rock stood out round the mouth of a cave.
				 */
				var h = volume.Ground(x0 + i * step, z0 + k * step);

				columns.push([h, volume.Steep(x0 + i * step, z0 + k * step)]);

				low = Math.min(low, h);
				high = Math.max(high, h);
			}
		}

		range = volume.Range(x0 - step, z0 - step, x0 + extent + step, z0 + extent + step, low, high);
		y0 = Math.floor((range[0] - step * 2) / step) * step;
		layers = Math.min(400, Math.ceil((range[1] + step * 2 - y0) / step));
		values = new Float32Array(side * side * (layers + 1));

		function at (ii, jj, kk) {
			return (jj * side + (kk + 1)) * side + (ii + 1);
		}

		/*
		 * The density at each corner of its cells: asked only within the heights a carve may change of each column
		 * (Volume.Span), its height less y elsewhere, as the density is there. Regression: asked at every corner, a square
		 * under a mountain was hundreds of thousands of them, seconds of a worker.
		 */
		for (k = -1; k <= n + 1; k++) {
			for (i = -1; i <= n + 1; i++) {
				var column = columns[(k + 1) * side + (i + 1)];
				var span = volume.Span(x0 + i * step, z0 + k * step, column[0], step);

				for (j = 0; j <= layers; j++) {
					var y = y0 + j * step;

					values[at(i, j, k)] = span && y >= span[0] - step && y <= span[1] + step ? volume.Density(x0 + i * step, y, z0 + k * step, column) : column[0] - y;
				}
			}
		}

		cells = new Int32Array(side * side * layers).fill(-1);

		/*
		 * How much of the light of the sky comes to each point of it: none deep in a cave, so its lamps alone light it. Of a
		 * coarse square (cells over 3 m: no cave is seen in it) whether its column up is air (Regression: of the grid of the
		 * world, the whole ground of three kilometres was hundreds of millions of cells, and the page hung).
		 */
		var daylight = step <= 3 ? self.Daylight(field, x0, z0, x0 + extent, z0 + extent, y0) : {At: function (x, y, z, normal) {
			var ci = Math.max(-1, Math.min(n + 1, Math.round((x + normal[0] * step - x0) / step)));
			var ck = Math.max(-1, Math.min(n + 1, Math.round((z + normal[2] * step - z0) / step)));
			var up;

			for (up = Math.max(0, Math.ceil((y + normal[1] * step - y0) / step)); up <= layers; up++) {
				if (values[at(ci, up, ck)] > 0) return 0;
			}

			return 1;
		}};

		/* A point in each cell the surface crosses: the mean of where it crosses the edges of the cell. */
		for (j = 0; j < layers; j++) {
			for (k = -1; k <= n; k++) {
				for (i = -1; i <= n; i++) {
					var corners = [];
					var solid = 0;
					var sum = [0, 0, 0];
					var count = 0;
					var c;

					for (c = 0; c < 8; c++) {
						corners.push(values[at(i + (c & 1), j + (c >> 2 & 1), k + (c >> 1 & 1))]);

						if (corners[c] > 0)
							solid++;
					}

					if (!solid || solid === 8) continue;

					/*
					 * A cell out of the square, across its edge: its point of the crossings on the face it shares with the square
					 * alone, the very samples the square beside has there, so both put the same points on their edge.
					 */
					var face = function (corner) {
						return (i === -1 ? (corner & 1) === 1 : i === n ? (corner & 1) === 0 : true) && (k === -1 ? (corner >> 1 & 1) === 1 : k === n ? (corner >> 1 & 1) === 0 : true);
					};

					[[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (edge) {
						var a = corners[edge[0]];
						var b = corners[edge[1]];
						var t;

						if (a > 0 === b > 0 || !face(edge[0]) || !face(edge[1])) return;

						t = a / (a - b);
						sum[0] += (edge[0] & 1) + ((edge[1] & 1) - (edge[0] & 1)) * t;
						sum[1] += (edge[0] >> 2 & 1) + ((edge[1] >> 2 & 1) - (edge[0] >> 2 & 1)) * t;
						sum[2] += (edge[0] >> 1 & 1) + ((edge[1] >> 1 & 1) - (edge[0] >> 1 & 1)) * t;
						count++;
					});

					if (!count) continue;

					/* The cells round it are held to its edges: its surface goes right to them, and so does the one of the square beside. */
					var px = Math.max(x0, Math.min(x0 + extent, x0 + (i + sum[0] / count) * step));
					var py = y0 + (j + sum[1] / count) * step;
					var pz = Math.max(z0, Math.min(z0 + extent, z0 + (k + sum[2] / count) * step));
					/*
					 * Regression: a cell where nothing is cut is only the ground: its point at the mean of its crossings was off its
					 * heights by up to a tenth of a cell, and a square of heights beside it showed a step. There it is on them.
					 */
					var plain = corners.every(function (value, corner) {
						return Math.abs(value - (columns[(k + (corner >> 1 & 1) + 1) * side + (i + (corner & 1) + 1)][0] - y0 - (j + (corner >> 2 & 1)) * step)) < 1e-6;
					});
					if (plain)
						py = volume.Ground(px, pz);

					/* The way the density grows, of the corners of the cell: no more of it reckoned. */
					var gx = corners[1] - corners[0] + corners[3] - corners[2] + corners[5] - corners[4] + corners[7] - corners[6];
					var gy = corners[4] - corners[0] + corners[5] - corners[1] + corners[6] - corners[2] + corners[7] - corners[3];
					var gz = corners[2] - corners[0] + corners[3] - corners[1] + corners[6] - corners[4] + corners[7] - corners[5];
					var length = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
					var normal = [-gx / length, -gy / length, -gz / length];
					var top = volume.Ground(px, pz);
					var stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
					var sky = daylight.At(px, py, pz, normal);
					var color;

					/*
					 * The ground under the sky has its colors; what is under it or juts out, rock, darker the deeper. Regression: the
					 * floor of a way in, as high as the ground there, had its grass a few metres into the rock: under a roof it is rock.
					 */
					if (normal[1] > 0.3 && Math.abs(py - top) < step * 1.5 && sky > 0.5) {
						color = self.Paint(field, px, pz, py, 1 - normal[1], stuff);
					}
					else {
						color = self.Paint(field, px, pz, Math.max(py, 2), 1, stuff);
						color = color.map(function (part) {
							return part * Math.max(0.55, 1 - Math.max(0, top - py) / 60);
						});
					}

					cells[(j * side + (k + 1)) * side + (i + 1)] = geometry.Positions.length / 3;

					geometry.Positions.push(px - cx, py, pz - cz);
					geometry.Normals.push(normal[0], normal[1], normal[2]);
					geometry.UVs.push(py, sky);
					geometry.Colors.push(color[0], color[1], color[2]);
					geometry.Materials.push.apply(geometry.Materials, stuff);
				}
			}
		}

		function cell (ii, jj, kk) {
			return jj < 0 || jj >= layers ? -1 : cells[(jj * side + (kk + 1)) * side + (ii + 1)];
		}

		/*
		 * A quad across each edge the surface crosses, of the four cells round it, its face to the air: the four go round the
		 * edge so that their face is to +X, -Y and +Z (of its axis), turned the other way when the air is at its start.
		 */
		function quad (a, b, c, d, forward) {
			if (a < 0 || b < 0 || c < 0 || d < 0) return;

			if (forward) geometry.Indices.push(a, b, c, a, c, d);
			else geometry.Indices.push(a, c, b, a, d, c);
		}

		for (j = 0; j <= layers; j++) {
			for (k = 0; k <= n; k++) {
				for (i = 0; i <= n; i++) {
					/* Across its edges only within it: one out of it would stand as a sheet in the plane of its edge. */
					var here = values[at(i, j, k)] > 0;
					if (j > 0 && j < layers && i < n && here !== values[at(i + 1, j, k)] > 0)
						quad(cell(i, j - 1, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i, j - 1, k), here);

					if (j < layers && here !== values[at(i, j + 1, k)] > 0)
						quad(cell(i - 1, j, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i - 1, j, k), !here);

					if (j > 0 && j < layers && k < n && here !== values[at(i, j, k + 1)] > 0)
						quad(cell(i - 1, j - 1, k), cell(i, j - 1, k), cell(i, j, k), cell(i - 1, j, k), here);
				}
			}
		}

		/*
		 * A skirt along its edges, where the ground there is only its height: a square beside, of other cells or of no volume,
		 * shows no gap. None where a carve or a rock cuts the edge, so no way in is walled up.
		 */
		var edges = [];

		for (i = 0; i <= n; i++)
			edges.push([i, 0]);

		for (k = 1; k <= n; k++)
			edges.push([n, k]);

		for (i = n - 1; i >= 0; i--)
			edges.push([i, n]);

		for (k = n - 1; k >= 0; k--)
			edges.push([0, k]);

		edges = edges.map(function (point) {
			var x = x0 + point[0] * step;
			var z = z0 + point[1] * step;
			var top = columns[(point[1] + 1) * side + (point[0] + 1)][0];
			var plain = volume.Density(x, top - step * 0.5, z) > 0 && volume.Density(x, top + step * 0.5, z) <= 0;
			var stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
			var color = self.Paint(field, x, z, top, 0, stuff);
			var index = geometry.Positions.length / 3;

			geometry.Positions.push(x - cx, top, z - cz, x - cx, top - step * 2, z - cz);
			/* Half as long: the mark of a skirt, so the ground on it is painted as the ground over it, never as a wall. */
			geometry.Normals.push(0, 0.5, 0, 0, 0.5, 0);
			geometry.UVs.push(top, 1, top, 1);
			geometry.Colors.push(color[0], color[1], color[2], color[0] * 0.8, color[1] * 0.8, color[2] * 0.8);
			geometry.Materials.push.apply(geometry.Materials, stuff.concat(stuff));

			return {Index: index, Plain: plain, Top: top};
		});

		edges.forEach(function (edge, index) {
			var next = edges[(index + 1) % edges.length];
			/* Only where the ground goes gently along the edge: none from the top of a wall down to its foot. */
			if (!edge.Plain || !next.Plain || Math.abs(edge.Top - next.Top) > step * 1.5) return;

			/* Both its faces: it is seen from either side. */
			geometry.Indices.push(edge.Index, next.Index, edge.Index + 1, next.Index, next.Index + 1, edge.Index + 1);
			geometry.Indices.push(edge.Index, edge.Index + 1, next.Index, next.Index, edge.Index + 1, next.Index + 1);
		});

		geometry.Volume = true;

		return geometry;
	},

	Mesh: function (field, cx, cz, extent, resolution) {
		var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Materials: [], Indices: []};
		var side = resolution + 1;
		var step = extent / resolution;
		var row;
		var column;
		var x;
		var z;
		var y;
		var normal;
		var color;
		var stuff;
		var a;
		var base;
		var edges;

		/* Its heights and those of its normals made at once (by wasm, Prefetch of the ground), each as Height would make it. */
		if (field.Prefetch)
			field.Prefetch(cx - extent / 2, cz - extent / 2, step, side);

		for (row = 0; row <= resolution; row++) {
			for (column = 0; column <= resolution; column++) {
				x = cx - extent / 2 + column * step;
				z = cz - extent / 2 + row * step;
				y = field.Height(x, z);
				normal = field.Normal(x, z);
				stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				color = this.Paint(field, x, z, y, 1 - normal[1], stuff);

				geometry.Positions.push(x - cx, y, z - cz);
				geometry.Normals.push(normal[0], normal[1], normal[2]);
				/* Its height, and how much of the sky it sees: all of it, over a ground of heights. */
				geometry.UVs.push(y, 1);
				geometry.Colors.push(color[0], color[1], color[2]);
				geometry.Materials.push.apply(geometry.Materials, stuff);
			}
		}

		if (field.Prefetch)
			field.Prefetch(null);

		for (row = 0; row < resolution; row++) {
			for (column = 0; column < resolution; column++) {
				a = row * side + column;

				geometry.Indices.push(a, a + side, a + 1, a + 1, a + side, a + side + 1);
			}
		}

		/* The skirt: each vertex of an edge again, lower, joined to it. */
		base = geometry.Positions.length / 3;
		edges = [];

		for (column = 0; column <= resolution; column++)
			edges.push(column);

		for (row = 1; row <= resolution; row++)
			edges.push(row * side + resolution);

		for (column = resolution - 1; column >= 0; column--)
			edges.push(resolution * side + column);

		for (row = resolution - 1; row >= 1; row--)
			edges.push(row * side);

		/*
		 * Regression: the skirt shared the vertices of the edge, its face a wall, and where a square beside left a crack of
		 * centimetres it showed as a brown cliff. Its own vertices, its normals half as long (the mark of a skirt: its ground
		 * painted as the ground over it), of the colors of the edge: a crack shows the ground.
		 */
		edges.forEach(function (index) {
			[0, step * 2].forEach(function (down) {
				geometry.Positions.push(geometry.Positions[index * 3], geometry.Positions[index * 3 + 1] - down, geometry.Positions[index * 3 + 2]);
				geometry.Normals.push(geometry.Normals[index * 3] * 0.5, geometry.Normals[index * 3 + 1] * 0.5, geometry.Normals[index * 3 + 2] * 0.5);
				geometry.UVs.push(geometry.UVs[index * 2], geometry.UVs[index * 2 + 1]);
				geometry.Colors.push(geometry.Colors[index * 3], geometry.Colors[index * 3 + 1], geometry.Colors[index * 3 + 2]);
				geometry.Materials.push.apply(geometry.Materials, geometry.Materials.slice(index * 12, index * 12 + 12));
			});
		});

		edges.forEach(function (index, at) {
			var top = base + at * 2;
			var next = base + (at + 1) % edges.length * 2;

			geometry.Indices.push(top, next, top + 1, next, next + 1, top + 1);
		});

		return geometry;
	},

	/*
	 * The way of a road over a field from [x, z] to [x, z]: A* over points Step apart (a 64th of the field), what climbs
	 * costing more the steeper (a grade over MaxGrade, 0.12, far more), over water Bridge times as much (6), within the
	 * field; then fewer points, each kept where the way bends from the straight line by more than half a step. [[x, z]...],
	 * or null where it cannot go.
	 */
	RoadWay: function (field, from, to, options) {
		var settings = options || {};
		var step = Number(settings.Step) || Math.max(8, field.Size / 64);
		var steep = Number(settings.MaxGrade) || 0.12;
		var bridge = Number(settings.Bridge) || 6;
		var half = field.Size / 2;
		var reach = Math.floor(half / step);
		var start = [Math.round(from[0] / step), Math.round(from[1] / step)];
		var goal = [Math.round(to[0] / step), Math.round(to[1] / step)];
		var heights = {};
		var neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		var found;
		var path;
		var kept;
		var i;

		function key (x, z) {
			return x + ':' + z;
		}

		function height (x, z) {
			var id = key(x, z);
			if (heights[id] === undefined)
				heights[id] = field.Height(x * step, z * step);

			return heights[id];
		}

		function guess (x, z) {
			return Math.hypot(x - goal[0], z - goal[1]) * step;
		}

		start = [Math.max(-reach, Math.min(reach, start[0])), Math.max(-reach, Math.min(reach, start[1]))];
		goal = [Math.max(-reach, Math.min(reach, goal[0])), Math.max(-reach, Math.min(reach, goal[1]))];

		/* A* (Pathfinding.Search) over the points of the grid. */
		found = this.$Service('Pathfinding').Search({Start: {X: start[0], Z: start[1]}, Limit: 60000, Key: function (point) {
			return key(point.X, point.Z);
		}, Goal: function (point) {
			return point.X === goal[0] && point.Z === goal[1];
		}, Heuristic: function (point) {
			return guess(point.X, point.Z);
		}, Neighbors: function (point) {
			var a = height(point.X, point.Z);

			return neighbours.filter(function (offset) {
				return Math.abs(point.X + offset[0]) <= reach && Math.abs(point.Z + offset[1]) <= reach;
			}).map(function (offset) {
				var x = point.X + offset[0];
				var z = point.Z + offset[1];
				var length = (offset[0] && offset[1] ? Math.SQRT2 : 1) * step;
				var b = height(x, z);
				var grade = Math.abs(b - a) / length;

				return {Node: {X: x, Z: z}, Cost: length * (1 + 25 * grade * grade + (grade > steep ? Math.pow(grade / steep, 4) * 4 : 0)) * (b < 0 || a < 0 ? bridge : 1)};
			});
		}});

		if (!found)
			return null;

		path = found.Path.map(function (point) {
			return [point.X * step, point.Z * step];
		});

		path[0] = [from[0], from[1]];
		path[path.length - 1] = [to[0], to[1]];

		/* Fewer points: from each, the farthest the way goes to near the straight line to it. */
		function near (a, b) {
			var dx = path[b][0] - path[a][0];
			var dz = path[b][1] - path[a][1];
			var length = Math.hypot(dx, dz) || 1;
			var k;

			for (k = a + 1; k < b; k++) {
				if (Math.abs((path[k][0] - path[a][0]) * dz - (path[k][1] - path[a][1]) * dx) / length > step * 0.5) return false;
			}

			return true;
		}

		kept = [path[0]];
		i = 0;

		while (i < path.length - 1) {
			var far = path.length - 1;

			while (far > i + 1 && !near(i, far))
				far--;

			kept.push(path[far]);

			i = far;
		}

		return kept.map(function (point) {
			return [Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10];
		});
	},

	/*
	 * A way over a field: A* over points Step apart (8 neighbours, slopes cost more), then made straight wherever the
	 * straight line between two of its points can be walked, so it follows the ground, not a grid.
	 */
	Way: function (field, from, to, rules) {
		var step = Number(rules.Step) || field.Size / 96;
		var limit = Number(rules.Limit) || 40000;
		var start = {X: Math.round(from.X / step), Z: Math.round(from.Z / step)};
		var goal = {X: Math.round(to.X / step), Z: Math.round(to.Z / step)};
		var key = function (point) {
			return point.X + ':' + point.Z;
		};
		var walk = function (x, z) {
			return field.Walkable(x, z, rules);
		};
		/*
		 * What each point of the grid is, found once in a search (whether it is walked, how steep, its floor): a point was asked
		 * up to three times (as a neighbour, as the corner of two diagonals) and the noise of the ground made each time.
		 */
		var known = {};
		var floors = {};
		/*
		 * With decks over the ground (Over), how much higher or lower the floor of the next point may be, a metre of the way:
		 * onto a bridge from its end only. Regression: a walker went down the bank and up onto the deck from the water.
		 */
		var rise = Math.max(1, step * 0.75) / step;
		var cell = function (x, z) {
			var id = x + ':' + z;
			if (known[id] === undefined)
				/* No steeper than it can walk: the deck of a bridge over a steep bank costs as a walkable slope. */
				known[id] = walk(x * step, z * step) ? Math.min(field.Slope(x * step, z * step), rules.MaxSlope === undefined ? 0.45 : Number(rules.MaxSlope)) : -1;

			return known[id];
		};
		var path;
		var found;
		var neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		var straight;
		var far;
		var i;

		if (!walk(to.X, to.Z) || !walk(from.X, from.Z)) return null;

		/* The floor at a point: the deck over it (Over of the rules), or the ground. */
		function level (x, z) {
			var over = rules.Over ? rules.Over(x, z) : null;

			return over === null || over === undefined ? Math.max(0, field.Height(x, z)) : over;
		}

		function floorOf (x, z) {
			var id = x + ':' + z;
			if (floors[id] === undefined)
				floors[id] = level(x * step, z * step);

			return floors[id];
		}

		function guess (point) {
			return Math.sqrt((point.X - goal.X) * (point.X - goal.X) + (point.Z - goal.Z) * (point.Z - goal.Z));
		}

		/* A* (Pathfinding.Search) over the points of the grid. */
		found = this.$Service('Pathfinding').Search({Start: start, Goal: goal, Limit: limit, Key: key, Heuristic: guess, Neighbors: function (current) {
			return neighbours.filter(function (offset) {
				if (cell(current.X + offset[0], current.Z + offset[1]) < 0) return false;

				/* A diagonal does not cut the corner of what cannot be walked. */
				if (offset[0] && offset[1] && (cell(current.X + offset[0], current.Z) < 0 || cell(current.X, current.Z + offset[1]) < 0)) return false;

				return !rules.Over || Math.abs(floorOf(current.X + offset[0], current.Z + offset[1]) - floorOf(current.X, current.Z)) <= rise * step * (offset[0] && offset[1] ? Math.SQRT2 : 1);
			}).map(function (offset) {
				var length = offset[0] && offset[1] ? Math.SQRT2 : 1;

				return {Node: {X: current.X + offset[0], Z: current.Z + offset[1]}, Cost: length * (1 + cell(current.X + offset[0], current.Z + offset[1]) * 4)};
			});
		}});

		if (!found)
			return null;

		path = found.Path.map(function (point) {
			return {X: point.X * step, Z: point.Z * step};
		});

		path[0] = {X: from.X, Z: from.Z};
		path[path.length - 1] = {X: to.X, Z: to.Z};

		/* Straight wherever it can be: from each point, to the farthest one the line to which can be walked. */
		function clear (a, b) {
			var length = Math.sqrt((b.X - a.X) * (b.X - a.X) + (b.Z - a.Z) * (b.Z - a.Z));
			var count = Math.max(1, Math.ceil(length / (step / 2)));
			var before = rules.Over ? level(a.X, a.Z) : 0;
			var at;

			for (at = 1; at < count; at++) {
				var x = a.X + (b.X - a.X) * at / count;
				var z = a.Z + (b.Z - a.Z) * at / count;
				var here;

				if (!walk(x, z)) return false;

				if (rules.Over) {
					here = level(x, z);

					if (Math.abs(here - before) > rise * length / count) return false;

					before = here;
				}
			}

			return true;
		}

		straight = [path[0]];
		i = 0;

		while (i < path.length - 1) {
			far = path.length - 1;

			while (far > i + 1 && !clear(path[i], path[far]))
				far--;

			straight.push(path[far]);

			i = far;
		}

		return straight.map(function (point) {
			return {X: point.X, Y: level(point.X, point.Z), Z: point.Z};
		});
	},

	/*
	 * A way over a field with a volume, over and under its ground: A* over points Step apart, each on a floor (Height(x, z,
	 * y) from the floor before it), a step taken only as a walker takes it (CanStep: up Climb at most and not too steep,
	 * down any drop, no rock where its body goes), no steeper than MaxSlope of the rules, not into the sea without Swim, nor
	 * where Blocked of the rules says; then made straight wherever a walker can go straight. from and to {X, Z, Y}: Y the
	 * height it is at, or none for the top of the ground. Gives [{X, Y, Z}] or null.
	 */
	/* The cheapest first of what is pushed ({F}): the Queue of Math. */
	Queue: function () {
		return this.$Service('Math').Queue();
	},

	WayUnder: function (field, from, to, rules) {
		var step = Number(rules.Step) || field.Size / 96;
		var limit = Number(rules.Limit) || 40000;
		var steepest = rules.MaxSlope === undefined || rules.MaxSlope === null ? null : Number(rules.MaxSlope);
		var half = field.Size / 2;
		var neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		var found = null;
		var path;
		var straight;
		var start;
		var goal;
		var far;
		var i;

		/*
		 * The floor a walker at y comes to at x, z, or null where it cannot; kept for the search by the place and y to a
		 * quarter of a metre (Regression: the corners of each diagonal asked again, a way was seconds of the page).
		 */
		var known = {};

		function can (x, z, y) {
			var id = x + ':' + z + ':' + Math.round(y * 4);
			if (!(id in known))
				known[id] = reach(x, z, y);

			return known[id];
		}

		function reach (x, z, y) {
			var floor;
			var top;

			if (Math.abs(x) > half || Math.abs(z) > half) return null;

			floor = field.Step ? field.Step(x, z, y) : field.CanStep(x, z, y) ? field.Height(x, z, y) : null;

			if (floor === null) return null;

			top = field.Volume ? field.Volume.Ground(x, z) : field.Height(x, z);

			if (!rules.Swim && top < 0 && floor > top - 0.5) return null;
			if (rules.Blocked && rules.Blocked(x, z)) return null;
			if (steepest !== null && field.Up(x, floor, z) < 1 - steepest) return null;

			return floor;
		}

		function key (point) {
			return point.X + ':' + point.Z + ':' + Math.round(point.Y / 2);
		}

		function guess (point) {
			return Math.sqrt((point.X - goal.X) * (point.X - goal.X) + (point.Z - goal.Z) * (point.Z - goal.Z) + (point.Y - goal.Y) * (point.Y - goal.Y) / (step * step));
		}

		start = {X: Math.round(from.X / step), Z: Math.round(from.Z / step), Y: field.Height(from.X, from.Z, from.Y)};
		goal = {X: Math.round(to.X / step), Z: Math.round(to.Z / step), Y: field.Height(to.X, to.Z, to.Y)};

		if (start.Y === null || goal.Y === null || can(to.X, to.Z, goal.Y) === null) return null;

		/* A* (Pathfinding.Search) over the floors of the points of the grid. */
		found = this.$Service('Pathfinding').Search({Start: start, Limit: limit, Key: key, Heuristic: guess, Goal: function (current) {
			return current.X === goal.X && current.Z === goal.Z && Math.abs(current.Y - goal.Y) < 2.5;
		}, Neighbors: function (current) {
			var edges = [];

			neighbours.forEach(function (offset) {
				var y = can((current.X + offset[0]) * step, (current.Z + offset[1]) * step, current.Y);
				if (y === null) return;

				/* A diagonal does not cut the corner of what cannot be walked. */
				if (offset[0] && offset[1] && (can((current.X + offset[0]) * step, current.Z * step, current.Y) === null || can(current.X * step, (current.Z + offset[1]) * step, current.Y) === null)) return;

				edges.push({Node: {X: current.X + offset[0], Z: current.Z + offset[1], Y: y}, Cost: Math.sqrt(offset[0] * offset[0] + offset[1] * offset[1] + (y - current.Y) * (y - current.Y) / (step * step)) * (1 + Math.max(0, y - current.Y) / step)});
			});

			return edges;
		}});

		if (!found)
			return null;

		path = found.Path.map(function (point) {
			return {X: point.X * step, Y: point.Y, Z: point.Z * step};
		});

		path[0] = {X: from.X, Y: start.Y, Z: from.Z};
		path[path.length - 1] = {X: to.X, Y: goal.Y, Z: to.Z};

		/* Straight wherever a walker goes straight: from a point to another, its floor followed, it comes to the other's floor. */
		function clear (a, b) {
			var length = Math.sqrt((b.X - a.X) * (b.X - a.X) + (b.Z - a.Z) * (b.Z - a.Z));
			var count = Math.max(1, Math.ceil(length / (step / 2)));
			var y = a.Y;
			var at;

			for (at = 1; at <= count; at++) {
				y = can(a.X + (b.X - a.X) * at / count, a.Z + (b.Z - a.Z) * at / count, y);

				if (y === null) return false;
			}

			return Math.abs(y - b.Y) < 1;
		}

		straight = [path[0]];
		i = 0;

		while (i < path.length - 1) {
			far = path.length - 1;

			while (far > i + 1 && !clear(path[i], path[far]))
				far--;

			straight.push(path[far]);

			i = far;
		}

		return straight;
	},

	Sphere: function (options) {
		var self = this;
		/* A planet of ScenePlanet (Planet: its options): its ground, the very one its globe shows. */
		var settings = options || {};
		if (settings.Planet)
			return this.$Service('ScenePlanet').Sphere(settings.Planet);

		var math = this.$Service('Math');
		var radius = Number(settings.Radius) || this.$Service('ScenePlanet').Defaults.Radius;
		var height = settings.Height === undefined ? radius * 0.0015 : Number(settings.Height);
		var seed = Number(settings.Seed) || 0;
		var ocean = Number(settings.Ocean) || 0;
		var type = settings.Type || 'rocky';
		var cratered = !!this.$Service('ScenePlanet').SurfaceType(type).Cratered;
		var run = this.BakeRun(settings.BakeSource);
		var raised = this.ElevationRun();
		var lifts = raised.Inputs.map(function (name) {
			return name === 'Height' ? height : name === 'Ocean' ? ocean : name === 'Seed' ? seed : 0;
		});
		var lift = {PX: raised.Inputs.indexOf('PX'), PY: raised.Inputs.indexOf('PY'), PZ: raised.Inputs.indexOf('PZ'), Value: raised.Inputs.indexOf('Value')};
		var slots = {};
		var args;
		var field;

		if (!run)
			throw new Error('Elemenx SceneTerrainGenerator: the land of a body has no code of its graph (blueprints/shader/bake)');

		args = run.Inputs.map(function (name, index) {
			slots[name] = index;

			return name === 'Seed' ? seed : name === 'Ocean' ? ocean : name === 'Cratered' ? cratered ? 1 : 0 : 0;
		});

		/* The land of a direction: what its graph that bakes the surface (Bake of Scene) comes to in its block BakeLand. */
		function land (direction) {
			var p = math.Vectors.Normalize(direction);

			if (slots.PX !== undefined)
				args[slots.PX] = p[0];

			if (slots.PY !== undefined)
				args[slots.PY] = p[1];

			if (slots.PZ !== undefined)
				args[slots.PZ] = p[2];

			return run.Main.apply(null, args);
		}

		/*
		 * The height of the ground over the radius (blueprints/body/elevation): the land of the noise, then what the surface
		 * baked from far does not show, mountains on the high land, hills and small bumps everywhere above the sea (the coasts
		 * stay where they are). Regression: in the code alone.
		 */
		function elevation (direction, value) {
			var p = math.Vectors.Normalize(direction);

			lifts[lift.PX] = p[0];
			lifts[lift.PY] = p[1];
			lifts[lift.PZ] = p[2];
			lifts[lift.Value] = value;

			return raised.Main.apply(null, lifts);
		}

		field = {
			Options: settings,
			Radius: radius,
			Height: height,
			Ocean: ocean,
			Type: type,
			Land: land,

			Elevation: function (direction) {
				return elevation(direction, land(direction));
			},

			Raise: elevation,

			Point: function (direction) {
				var p = math.Vectors.Normalize(direction);

				return math.Vectors.Scale(p, radius + field.Elevation(p));
			},

			Altitude: function (point) {
				return math.Vectors.Length(point) - radius - field.Elevation(point);
			},

			Patch: function (face, u, v, extent, resolution) {
				return self.SpherePatch(field, face, u, v, extent, resolution || 32);
			}
		};

		return field;
	},

	/*
	 * The wasm of the relief of a ground ({Bytes, Exports, Ins, Outs}), made once: of its graph (Relief, its three results:
	 * Height, Moisture, Temperature), or, of none (plain: the numbers of its noise, FlatOf), of the library relief, its
	 * height only (the very same hills). Kept by a key in its options (ReliefWasm) and given to the workers of its pool by
	 * it (Share): a worker makes no wasm. Null where none is made (no WebAssembly, a ground of a planet or of a noise of its
	 * own, a graph not of numbers).
	 */
	ReliefWasm: function (settings, plain) {
		var blueprints = this.$Service('Blueprints');
		var key = settings.ReliefWasm;
		var graph;
		var made;
		var bytes;
		var parameters = {};

		this.WasmKept = this.WasmKept || {};

		if (typeof key === 'string')
			return this.WasmKept[key] || (typeof this.$Shared === 'function' ? this.$Shared(key) || null : null);

		if (key === null || typeof WebAssembly === 'undefined' || typeof Elemenx === 'undefined' || !Elemenx.Compilers || !blueprints || !blueprints.NumericCode) return null;

		if (settings.Relief) {
			graph = typeof settings.Relief === 'string' ? JSON.parse(settings.Relief) : settings.Relief;

			['Scale', 'Ridges', 'Water', 'Height'].forEach(function (name) {
				if (settings[name] !== undefined && settings[name] !== null && settings[name] !== '')
					parameters[name] = Number(settings[name]);
			});

			made = blueprints.NumericCode(graph, parameters);
		}
		else if (plain) {
			made = blueprints.NumericCode(this.LibraryRelief(settings), {}, null, ['Height']);
		}

		bytes = made ? blueprints.Wasm(made.Numeric) : null;

		if (!bytes) {
			settings.ReliefWasm = null;

			return null;
		}

		key = 'relief-wasm:' + blueprints.Hash(blueprints.Read(graph || this.LibraryRelief(settings))) + JSON.stringify(settings.Relief ? parameters : plain);
		this.WasmKept[key] = {Bytes: bytes.Bytes, Exports: bytes.Exports, Ins: made.Numeric.Inputs.length, Outs: made.Keys.length, Names: made.Numeric.Inputs.map(function (one) {
			return one.Name;
		}).join(','), Keys: made.Keys.join(',')};
		settings.ReliefWasm = key;

		return this.WasmKept[key];
	},

	/*
	 * A batch of a wasm of numbers ({Bytes, Exports, Ins, Outs}, its function g_main) over count runs of input, one after
	 * another: a Float64Array of their results. By Elemenx.Compilers.Instance in the page; by itself in a worker, which has
	 * no Elemenx (the same memory: the input, then the results).
	 */
	/* The functions of a wasm of numbers ({Bytes}) as they are, made once, of the one memory of this Service (env.memory). */
	WasmExports: function (made) {
		if (!made.Raw) {
			this.WasmMemory = this.WasmMemory || new WebAssembly.Memory({initial: 1});
			made.Raw = new WebAssembly.Instance(new WebAssembly.Module(made.Bytes), {env: {memory: this.WasmMemory}}).exports;
		}

		return made.Raw;
	},

	WasmRun: function (made, input, count) {
		var exports;
		var bytes;
		var have;
		var output;

		if (typeof Elemenx !== 'undefined' && Elemenx.Compilers && Elemenx.Compilers.Instance && made.Exports) {
			made.Live = made.Live || Elemenx.Compilers.Instance(made);

			return made.Live.Batch('g_main', input, count);
		}

		/* One memory for all of them (env.memory: of the worker, as Elemenx.Compilers has one of the page). */
		exports = this.WasmExports(made);
		bytes = (made.Ins + made.Outs) * count * 8;
		have = exports.memory.buffer.byteLength;

		if (bytes > have)
			exports.memory.grow(Math.ceil((bytes - have) / 65536));

		new Float64Array(exports.memory.buffer, 0, made.Ins * count).set(input);

		exports['batch:g_main'](count, 0, made.Ins * count * 8, 0);

		output = new Float64Array(made.Outs * count);

		output.set(new Float64Array(exports.memory.buffer, made.Ins * count * 8, made.Outs * count));

		return output;
	},

	/*
	 * The workers of grounds. What goes to them, by Run or by Share, takes the code and the wasm of the relief of the options
	 * of a ground in it first (ShareGround): a worker makes no code, and whoever sends options need not know it.
	 */
	Work: function () {
		var self = this;
		var pool = this.$Service('Workers').Pool('SceneTerrainGenerator', {Math: true, Noise: true, Random: true, Pathfinding: true, Blueprints: true, Geometry: true, ScenePlanet: true, SceneTerrainGenerator: true, LayoutBlueprints: true, SceneFlora: true});
		var run;
		var share;

		if (pool.GroundsShared) return pool;

		pool.GroundsShared = true;
		run = pool.Run;
		share = pool.Share;

		pool.Run = function (service, method, args) {
			(args || []).forEach(function (arg) {
				self.ShareGround(pool, arg);
			});

			return run.apply(pool, arguments);
		};

		pool.Share = function (key, data) {
			self.ShareGround(pool, data);

			return share.apply(pool, arguments);
		};

		return pool;
	},

	/*
	 * The wasm of a relief (ReliefWasm: its key in the options of a ground) to the workers of a pool, once: what sends
	 * the options of a ground to them sends it too (Scene). Regression: all the wasm made (of every ground of a page) went
	 * to each new pool, and the squares waited behind it.
	 */
	WasmShare: function (pool, key) {
		var kept = (this.WasmKept || {})[key];
		var sent = {};

		pool.WasmShared = pool.WasmShared || {};

		if (!kept || pool.WasmShared[key]) return;

		pool.WasmShared[key] = true;

		Object.keys(kept).forEach(function (name) {
			if (['Live', 'Raw', 'Exports'].indexOf(name) === -1)
				sent[name] = kept[name];
		});

		pool.Share(key, sent);
	},

	/*
	 * What the options of a ground take with them to the workers of a pool, once each: the code of its plain relief (ReliefKey)
	 * and its wasm (ReliefWasm). Whatever sends the options of a ground to a worker calls it first (Scene, its scatter, its
	 * roads): a worker makes no code. Made: these are the options of a ground for sure, its code made now if it was not yet
	 * (a ground of them not made in the page).
	 */
	ShareGround: function (pool, options, made) {
		var self = this;

		if (!options || typeof options !== 'object' || pool.Inline()) return;

		/* Its graphs of its own made code here (a worker makes none). */
		if (options.Graphs && !options.GraphCode)
			options.GraphCode = this.GraphCodeOf(options.Graphs);

		if (made && typeof options.ReliefKey !== 'string' && !options.Noise && !options.Planet && !this.Relief(options))
			this.PlainRelief(options);

		/* A ground of a noise of its own: the code of its climate (GroundClimate). */
		if (made && typeof options.ClimateKey !== 'string' && options.Noise && !options.Planet && !this.Relief(options))
			this.GroundClimate(options);

		/*
		 * The code of the graphs of every type of a sketch (SketchCode), once a pool, with the first ground it is given: a
		 * worker lays sketches of its own too (the towns of a planet).
		 */
		pool.WasmShared = pool.WasmShared || {};

		if (!pool.WasmShared['sketch-code']) {
			pool.WasmShared['sketch-code'] = true;

			Object.keys(this.SketchTable).forEach(function (type) {
				if (type !== '*' && self.SketchRun(type))
					pool.Share('sketch-code:' + type, self.SketchCode[type]);
			});

			['tunnel', 'sphere', 'caves', 'passages', 'overhangs'].forEach(function (type) {
				if (self.CarveRun(type))
					pool.Share('carve-code:' + type, self.CarveCode[type]);
			});

			if (self.BakeRun())
				pool.Share('bake-code', self.BakeCode);

			if (self.ElevationRun())
				pool.Share('elevation-code', self.ElevationCode);
		}

		['ReliefKey', 'ReliefWasm', 'ClimateKey'].forEach(function (name) {
			if (typeof options[name] === 'string')
				self.WasmShare(pool, options[name]);
		});
	},

	/*
	 * The relief of a ground of no graph, no planet and no noise of its own: the library relief (LibraryRelief), the very hills
	 * and climate, by its code made in the page (NumericCode: one of its height, one of its moisture and warmth), kept by a
	 * key in its options (ReliefKey) and given to the workers with them (ShareGround). {Height(parameters, inputs),
	 * Climate(x, z) ({Moisture, Temperature})}; Height.Main(x, z) the height itself. Regression: its hills and its climate were written out again in code
	 * beside the graph, two sources of the same numbers.
	 */
	PlainRelief: function (settings) {
		var key = settings.ReliefKey;
		var blueprints;
		var graph;
		var kept;
		var climate;

		this.WasmKept = this.WasmKept || {};
		this.PlainMade = this.PlainMade || {};

		if (typeof key !== 'string') {
			blueprints = this.$Service('Blueprints');
			key = 'plain-relief:' + JSON.stringify(this.FlatOf(settings)) + JSON.stringify(this.ClimateOf(settings));

			if (!this.WasmKept[key]) {
				if (typeof Elemenx === 'undefined' || !Elemenx.Compilers || !blueprints)
					throw new Error('Elemenx SceneTerrainGenerator: the relief of a ground is made in the page, and its options were not');

				graph = this.LibraryRelief(settings);
				this.WasmKept[key] = {Height: blueprints.NumericCode(graph, {}, null, ['Height']).Source, Climate: blueprints.NumericCode(graph, {}, null, ['Moisture', 'Temperature']).Source};
			}

			settings.ReliefKey = key;
		}

		kept = this.WasmKept[key] || (typeof this.$Shared === 'function' ? this.$Shared(key) : null);

		if (!kept)
			throw new Error('Elemenx SceneTerrainGenerator: no relief ' + key + ' in a worker: its options came with no ShareGround');

		if (!this.PlainMade[key]) {
			climate = new Function('B', 'M', 'N', kept.Climate)().Main;
			this.PlainMade[key] = {Height: new Function('B', 'M', 'N', kept.Height)(), Climate: function (x, z) {
				var made = climate(x, z);

				return {Moisture: made[0], Temperature: made[1]};
			}};
		}

		return this.PlainMade[key];
	},

	/*
	 * A sketch over a ground: what it changes of its heights and of its colors, made once. sketch {Layers: [{ID, Visible, Strength,
	 * Items}]}; each item {ID, Type, Strength} changes the height a point has after the items before it. base(x, z): the height of
	 * the ground under it; own: the code of graphs of its own (GraphCode). Gives {Height(x, z, h), Look(x, z) ({Palette, Weight, Color, Tint}: the colors of what it paints),
	 * Items: [{Item, Bounds: [x0, z0, x1, z1]}]}.
	 */
	Sketched: function (sketch, base, seed, own) {
		var self = this;
		/* The shift of the noise of the sketch of its seed, as Math.Noise takes it: what its graphs add to their points (O). */
		var offset = this.$Service('Math').SeedOffset('sketch-' + (seed || ''));
		var items = [];
		/* The colours of the looks of its types (SketchTable). */
		var looks = {};

		Object.keys(this.SketchTable).forEach(function (type) {
			if (self.SketchTable[type].Look && self.SketchTable[type].Look.Color)
				looks[type] = self.SketchTable[type].Look.Color;
		});

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		/*
		 * The graph of the type of an item made ready for it: its function (Main), its inputs in their order (Args: of the item
		 * once; X, Z, H, S and Around of each point, At their places), how far round the point the ground is read for Around
		 * (its parameters Around, in metres, and AroundOfRadius, of its radius). A stamp of no data has none.
		 */
		function graphed (made, item, d) {
			var run = item.Type === 'stamp' && !item.Data ? null : self.SketchRun(item.Type, own);
			var flat = [];

			if (!run) return;

			(made.Points.length > 1 ? made.Points : [made.Points[0], made.Points[0]]).forEach(function (point) {
				flat.push(point[0], point[1]);
			});

			made.Main = run.Main;
			made.At = {X: run.Inputs.indexOf('X'), Z: run.Inputs.indexOf('Z'), H: run.Inputs.indexOf('H'), S: run.Inputs.indexOf('S'), Around: run.Inputs.indexOf('Around')};
			made.AroundStep = (Number(run.Parameters.Around) || 0) + (Number(run.Parameters.AroundOfRadius) || 0) * made.Radius;
			made.Args = run.Inputs.map(function (name) {
				var told = /Told$/.test(name) ? item[name.slice(0, -4)] : undefined;

				if (['X', 'Z', 'H', 'S', 'Around'].indexOf(name) !== -1) return 0;
				if (name === 'Points') return flat;

				if (name === 'Levels')
					return made.Levels || [];

				if (name === 'Data')
					return item.Data ? item.Data.Heights : [];

				if (name === 'Side')
					return item.Data ? item.Data.Side : 2;

				if (name === 'CX' || name === 'CZ')
					return made.Points[0][name === 'CX' ? 0 : 1];

				if (name === 'Width' || name === 'Radius' || name === 'Edge') return made[name];

				if (name === 'Bank')
					return number(item.Bank, number(item.Shoulder, reachOf(d)));

				if (name === 'Target')
					return number(item.Height, base(made.Points[0][0], made.Points[0][1]));

				if (name === 'O') return offset;

				if (/Told$/.test(name))
					return told === undefined || told === null || told === '' || isNaN(Number(told)) ? 0 : 1;

				return number(item[name], d[name] === undefined ? 0 : d[name]);
			});
		}

		/* How far past its width a line of a type reaches (Bank of a river, Shoulder of a road, Reach of a cliff or of every type). */
		function reachOf (d) {
			return d.Bank !== undefined ? d.Bank : d.Shoulder !== undefined ? d.Shoulder : d.Reach;
		}

		/* 1 at the middle, 0 at the edge and past it, smoothly. */
		function fall (distance, radius) {
			var t = Math.max(0, Math.min(1, distance / Math.max(1e-6, radius)));

			return 0.5 + 0.5 * Math.cos(t * Math.PI);
		}

		/* The nearest point of a line: {Distance, T (along the whole of it, 0 to 1), Side (+1 left of its way, -1 right), Segment}. */
		function along (points, lengths, x, z) {
			var best = {Distance: Infinity, T: 0, Side: 1, Segment: 0};
			var total = lengths[lengths.length - 1] || 1;
			var i;

			for (i = 0; i + 1 < points.length; i++) {
				var ax = points[i][0];
				var az = points[i][1];
				var dx = points[i + 1][0] - ax;
				var dz = points[i + 1][1] - az;
				var span = dx * dx + dz * dz || 1;
				var t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / span));
				var px = ax + dx * t - x;
				var pz = az + dz * t - z;
				var d = Math.sqrt(px * px + pz * pz);

				if (d < best.Distance) {
					best.Distance = d;
					best.T = (lengths[i] + Math.sqrt(span) * t) / total;
					best.Side = dx * (z - az) - dz * (x - ax) > 0 ? -1 : 1;
					best.Segment = i;
				}
			}

			return best;
		}

		/* How far into an area: 1 inside, fading over edge outside it. */
		function inside (points, x, z) {
			var within = false;
			var nearest = Infinity;
			var i;
			var j;

			for (i = 0, j = points.length - 1; i < points.length; j = i++) {
				var xi = points[i][0];
				var zi = points[i][1];
				var xj = points[j][0];
				var zj = points[j][1];
				var dx = xj - xi;
				var dz = zj - zi;
				var t = Math.max(0, Math.min(1, ((x - xi) * dx + (z - zi) * dz) / (dx * dx + dz * dz || 1)));

				if (zi > z !== zj > z && x < (xj - xi) * (z - zi) / (zj - zi) + xi)
					within = !within;

				nearest = Math.min(nearest, Math.hypot(xi + dx * t - x, zi + dz * t - z));
			}

			return {Inside: within, Distance: nearest};
		}

		function areaWeight (shape, x, z) {
			var seen = inside(shape.Points, x, z);
			if (seen.Inside) return 1;

			return seen.Distance < shape.Edge ? fall(seen.Distance, shape.Edge) : 0;
		}

		/* The heights of a line at its points, along the way it flows: never higher than the one before (a river), or evened out (a road). */
		function levels (points, lengths, downhill) {
			var heights = points.map(function (point) {
				return point[2] !== undefined ? Number(point[2]) : base(point[0], point[1]);
			});
			var even;
			var i;

			if (downhill) {
				for (i = 1; i < heights.length; i++)
					heights[i] = Math.min(heights[i], heights[i - 1]);

				return heights;
			}

			even = heights.slice();

			for (i = 1; i + 1 < heights.length; i++)
				even[i] = (heights[i - 1] + heights[i] * 2 + heights[i + 1]) / 4;

			return even;
		}

		/* A grid of heights over bounds (a stamp, a frozen mask): bilinear inside, none outside. */
		function sample (grid, x, z) {
			var bounds = grid.Bounds;
			var side = grid.Side;
			var u = (x - bounds[0]) / (bounds[2] - bounds[0]) * (side - 1);
			var v = (z - bounds[1]) / (bounds[3] - bounds[1]) * (side - 1);
			var c;
			var r;
			var a;
			var b;

			if (!(u >= 0 && v >= 0 && u <= side - 1 && v <= side - 1)) return null;

			c = Math.min(side - 2, Math.floor(u));
			r = Math.min(side - 2, Math.floor(v));
			a = grid.Data[r * side + c] + (grid.Data[r * side + c + 1] - grid.Data[r * side + c]) * (u - c);
			b = grid.Data[(r + 1) * side + c] + (grid.Data[(r + 1) * side + c + 1] - grid.Data[(r + 1) * side + c]) * (u - c);

			return a + (b - a) * (v - r);
		}

		var all = [];

		/* An item made ready: its points, its kind, its sizes, its bounds; null when it has too few points or no type. */
		function build (item, layer) {
			var made = {Item: item, Layer: layer, Strength: number(item.Strength, 1) * number(layer.Strength, 1), Points: (item.Points || []).map(function (point) {
				return [Number(point[0]) || 0, Number(point[1]) || 0, point[2]];
			})};
			var reach = 0;
			var lengths = [0];
			var d = self.SketchDefaults(item.Type);
			var i;

			if (item.Visible === false || !self.SketchTypes[item.Type]) return null;

			made.Defaults = d;

			made.Kind = self.SketchTypes[item.Type];

			for (i = 1; i < made.Points.length; i++)
				lengths.push(lengths[i - 1] + Math.hypot(made.Points[i][0] - made.Points[i - 1][0], made.Points[i][1] - made.Points[i - 1][1]));

			made.Lengths = lengths;

			/* A circle is a point and its radius. */
			if (made.Kind === 'circle')
				made.Points = [[Number(item.At && item.At[0]) || 0, Number(item.At && item.At[1]) || 0]];

			/* Of a stamp its Size, when it tells no radius. */
			made.Radius = number(item.Radius, item.Type === 'stamp' ? number(item.Size, d.Radius * 2) / 2 : d.Radius);
			made.Width = number(item.Width, d.Width);
			made.Edge = number(item.Edge, d.Edge);

			if (made.Kind === 'line' && made.Points.length < 2) return null;
			if (made.Kind === 'area' && made.Points.length < 3) return null;

			if (made.Kind === 'stroke') reach = made.Radius;
			else if (made.Kind === 'line') reach = made.Width / 2 + number(item.Bank, number(item.Shoulder, number(item.Reach, reachOf(d))));
			else if (made.Kind === 'area') reach = made.Edge;
			else reach = made.Radius * (item.Type === 'crater' ? 1.4 : 1);

			if (item.Type === 'river' || item.Type === 'road' || item.Type === 'street')
				made.Levels = levels(made.Points, lengths, item.Type === 'river');

			graphed(made, item, d);

			made.Bounds = [Infinity, Infinity, -Infinity, -Infinity];

			made.Points.forEach(function (point) {
				made.Bounds = [Math.min(made.Bounds[0], point[0] - reach), Math.min(made.Bounds[1], point[1] - reach), Math.max(made.Bounds[2], point[0] + reach), Math.max(made.Bounds[3], point[1] + reach)];
			});

			return made;
		}

		(sketch && sketch.Layers || []).forEach(function (layer) {
			if (layer.Visible === false || layer.Visible === 'false') return;

			(layer.Items || []).forEach(function (item) {
				var made = build(item, layer);
				if (!made) return;

				all.push(item);
				items.push(made);
			});
		});

		/* A settlement: its plan, and its streets roads right after it, level across, as one drawn. */
		items.slice().forEach(function (made) {
			var at;

			if (made.Item.Type !== 'settlement') return;

			made.Plan = self.SettlementPlan(made.Item, all, function (name) {
				return self.SettlementSizes[name] || null;
			}, own);
			at = items.indexOf(made);

			made.Plan.Streets.forEach(function (street, index) {
				var road = build({ID: made.Item.ID + '/street-' + index, Type: 'street', Points: street.Points, Width: street.Width, Shoulder: 3}, made.Layer);
				if (road)
					items.splice(at + 1 + index, 0, road);
			});
		});

		/* What one item makes of the height h a point has: the height again; guard (0 to 1) holds it back under a mask. */
		/*
		 * What an item does to the height h at x, z: the graph of its type (blueprints/sketch/<type>, SketchRun), its inputs
		 * those of the item (Args) and of the point (X, Z, H, S its strength there, Around the ground round the point). Regression:
		 * the height of each type was written out in code here, beside nothing that could change it.
		 */
		function apply (made, x, z, h, guard) {
			var args = made.Args;
			var at = made.At;
			var step = made.AroundStep;

			if (!made.Main) return h;

			args[at.X] = x;
			args[at.Z] = z;
			args[at.H] = h;
			args[at.S] = made.Strength * (1 - guard);

			if (at.Around >= 0)
				args[at.Around] = (base(x + step, z) + base(x - step, z) + base(x, z + step) + base(x, z - step) + base(x, z)) / 5;

			return made.Main.apply(null, args);
		}

		/*
		 * The items whose bounds touch a box (Within: the square of the ground being made), in their order, and the box: a point
		 * in it looks at them alone, any other at all. Regression: each point of a square looked at all the items of the sketch
		 * (119 in the world of the showcase, 2 of them over a square of 47 m), five times a vertex: half the time of the square.
		 */
		var near = null;
		var box = null;

		function listOf (x, z) {
			return near && x >= box[0] && z >= box[1] && x <= box[2] && z <= box[3] ? near : items;
		}

		return {
			Items: items,

			/* Of a box [x0, z0, x1, z1] of the points asked next, the items that may change them; null: all again. */
			Within: function (x0, z0, x1, z1) {
				if (x0 === null || x0 === undefined) {
					near = null;
					box = null;

					return;
				}

				box = [x0, z0, x1, z1];
				near = items.filter(function (made) {
					var b = made.Bounds;

					return !(x1 < b[0] || z1 < b[1] || x0 > b[2] || z0 > b[3]);
				});
			},

			/* The plans of its settlements (SettlementPlan), in the order of the sketch. */
			Settlements: function () {
				return items.filter(function (made) {
					return made.Plan;
				}).map(function (made) {
					return made.Plan;
				});
			},

			/*
			 * The water it lays: of each river a strip a little wider than its bed, a quarter of its depth under the level of its way,
			 * and of each lake its area at its Level. {Kind, Points, Width, Levels} or {Kind, Points, Level}.
			 */
			Waters: function () {
				return items.filter(function (made) {
					return made.Item.Type === 'river' || made.Item.Type === 'lake';
				}).map(function (made) {
					if (made.Item.Type === 'lake')
						return {Kind: 'lake', Points: made.Points, Level: number(made.Item.Level, -1.5)};

					/* Flow: how fast it runs, in metres a second (0: by how steeply its bed falls). */
					return {Kind: 'river', Points: made.Points, Width: made.Width * 1.25, Flow: number(made.Item.Flow, 0), Levels: made.Levels.map(function (level) {
						return level - number(made.Item.Depth, 2) * 0.25;
					})};
				});
			},

			Height: function (x, z, h) {
				var guard = 0;
				var list = listOf(x, z);
				var i;

				for (i = 0; i < list.length; i++) {
					var made = list[i];
					var b = made.Bounds;
					var w;
					var frozen;

					if (x < b[0] || z < b[1] || x > b[2] || z > b[3]) continue;

					/* A mask: what is frozen in it, and what comes after it held back. */
					if (made.Item.Type === 'mask') {
						w = areaWeight(made, x, z) * made.Strength;
						frozen = made.Item.Heights ? sample(made.Item.Heights, x, z) : null;

						if (frozen !== null)
							h += (frozen - h) * w;

						guard = Math.max(guard, w);

						continue;
					}

					if (made.Item.Type === 'biome' || self.SketchPlaced[made.Item.Type]) continue;

					h = apply(made, x, z, h, guard);
				}

				return h;
			},

			/* The colors of a point: the palette of the last biome over it, and the color of what lies there (a road, a beach). */
			Look: function (x, z) {
				var look = null;
				var list = listOf(x, z);
				var i;

				for (i = 0; i < list.length; i++) {
					var made = list[i];
					var b = made.Bounds;
					var item = made.Item;
					var w = 0;
					var seen;

					if (x < b[0] || z < b[1] || x > b[2] || z > b[3]) continue;

					if (item.Type === 'biome' && item.Palette) {
						w = areaWeight(made, x, z);

						if (w > 0.5) {
							look = look || {};
							look.Palette = item.Palette;
						}

						continue;
					}

					if (!looks[item.Type]) continue;

					if (made.Kind === 'line') {
						seen = along(made.Points, made.Lengths, x, z);
						w = item.Type === 'cliff' ? fall(seen.Distance, made.Width) : seen.Distance <= made.Width / 2 ? 1 : fall(seen.Distance - made.Width / 2, 1.5);
					}
					else if (made.Kind === 'area') {
						w = areaWeight(made, x, z);
					}
					else {
						w = fall(Math.hypot(x - made.Points[0][0], z - made.Points[0][1]), made.Radius);
					}

					if (w > 0.05) {
						look = look || {};
						look.Color = item.Color || looks[item.Type];
						look.Tint = Math.min(1, w * (item.Type === 'road' || item.Type === 'river' ? 1 : 0.85));
						look.Material = item.Material || self.LookMaterials[item.Type] || '';
					}
				}

				return look;
			}
		};
	},

	/* The kind of each type of item of a sketch (of SketchTable, as the Service is made). */
	SketchTypes: {},

	/*
	 * The types of a sketch, of resources/terrain/sketch-types.json: {type: {Kind (stroke, line, area, circle), Placed (it places
	 * things, it shapes no ground), Defaults (its values where an item tells none: the first ones of an editor too), Look
	 * {Color, Material}}}; '*' the values of every type.
	 */
	SketchTable: {},

	/*
	 * The graphs of the types of a sketch made code (blueprints/sketch/<type>, the inputs of their points lists: Points,
	 * Levels, Data): {type: {Source, Inputs (in their order), Parameters}}, each made in the page as a sketch first has it
	 * (SketchRun), given to the workers with the options of a ground (ShareGround: a worker makes no code).
	 */
	SketchCode: {},

	/*
	 * The graph of a type of a sketch as a function: {Main (of its inputs in their order), Inputs, Parameters}; null with none;
	 * own: the code of graphs of a ground of its own (GraphCode), of which one of the type is taken first.
	 * Made in the page the first time; in a worker of what ShareGround gave it.
	 */
	SketchRun: function (type, own) {
		var kept = own && own['sketch/' + type] ? this.OwnRun(own['sketch/' + type]) : null;
		if (kept)
			return kept;

		kept = (this.SketchCode || {})[type] || (typeof this.$Shared === 'function' ? this.$Shared('sketch-code:' + type) : null);

		var graph;

		this.SketchMade = this.SketchMade || {};

		if (!kept && typeof Elemenx !== 'undefined' && Elemenx.Compilers && typeof Elemenx.Resources === 'function') {
			graph = Elemenx.Resources('Blueprints', 'ElemenxGraphics/sketch/' + type);
			kept = graph ? this.SketchMake(type, graph) : null;
		}

		if (!kept)
			return null;

		if (!this.SketchMade[type])
			this.SketchMade[type] = {Main: new Function('B', 'M', 'N', kept.Source)().Main, Inputs: kept.Inputs, Parameters: kept.Parameters};

		return this.SketchMade[type];
	},

	/*
	 * The graphs of the carves of a volume made code (blueprints/carve/<type>: tunnel, sphere, caves, passages, overhangs;
	 * their lists Points and Packed): {type: {Source, Inputs, Keys}}, each made in the page as a volume first has it
	 * (CarveRun), given to the workers with the options of a ground (ShareGround).
	 */
	CarveCode: {},

	/* The graph of a carve as a function: {Main (of its inputs in their order), Inputs, Keys (of its results)}; null with none; own as of SketchRun. */
	CarveRun: function (type, own) {
		var kept = own && own['carve/' + type] ? this.OwnRun(own['carve/' + type]) : null;
		if (kept)
			return kept;

		kept = (this.CarveCode || {})[type] || (typeof this.$Shared === 'function' ? this.$Shared('carve-code:' + type) : null);

		var graph;

		this.CarveMade = this.CarveMade || {};

		if (!kept && typeof Elemenx !== 'undefined' && Elemenx.Compilers && typeof Elemenx.Resources === 'function') {
			graph = Elemenx.Resources('Blueprints', 'ElemenxGraphics/carve/' + type);
			kept = graph ? this.CarveMake(type, graph) : null;
		}

		if (!kept)
			return null;

		if (!this.CarveMade[type])
			this.CarveMade[type] = {Main: new Function('B', 'M', 'N', kept.Source)().Main, Inputs: kept.Inputs, Keys: kept.Keys};

		return this.CarveMade[type];
	},

	/* The code of the graph of a carve (CarveCode), made of its graph in the page: a carve of another graph. */
	CarveMake: function (type, graph) {
		this.CarveCode = this.CarveCode || {};
		this.CarveCode[type] = this.CarveCodeOf(type, graph);

		if (this.CarveMade)
			delete this.CarveMade[type];

		return this.CarveCode[type];
	},

	/* The code of the graph of a carve, made of it in the page: {Source, Inputs, Keys}. */
	CarveCodeOf: function (type, graph) {
		var made = this.$Service('Blueprints').NumericCode(graph, {}, {Points: 'floats', Packed: 'floats'});
		if (!made)
			throw new Error('Elemenx SceneTerrainGenerator: the graph of the carve ' + type + ' is not of numbers');

		return {Source: made.Source, Inputs: made.Numeric.Inputs.map(function (one) {
			return one.Name;
		}), Keys: made.Keys};
	},

	/*
	 * The land of the graph of the library that bakes the surface of a body of noise (blueprints/shader/bake, the land of
	 * its block BakeLand) made code: {Source, Inputs, Keys}, made in the page as a body first has it (BakeRun), given to the
	 * workers (ShareGround).
	 */
	BakeCode: null,

	/*
	 * The land of the graph that bakes a body as a function: {Main (of its inputs in their order: PX, PY, PZ, Seed, Ocean,
	 * Cratered), Inputs, Keys}; null with none; own: the code of a graph of its own (BakeSource of the options of a body:
	 * BakeCodeOf), taken first. Made in the page the first time; in a worker of what ShareGround gave it.
	 */
	BakeRun: function (own) {
		var kept = own ? this.OwnRun(own) : null;
		if (kept)
			return kept;

		kept = this.BakeCode || (typeof this.$Shared === 'function' ? this.$Shared('bake-code') : null);

		if (!kept && typeof Elemenx !== 'undefined' && Elemenx.Compilers && typeof Elemenx.Resources === 'function')
			kept = this.BakeMake(Elemenx.Resources('Blueprints', 'ElemenxGraphics/shader/bake'));

		if (!kept)
			return null;

		if (!this.BakeMade)
			this.BakeMade = {Main: new Function('B', 'M', 'N', kept.Source)().Main, Inputs: kept.Inputs, Keys: kept.Keys};

		return this.BakeMade;
	},

	/* The code of the graph of the height of the ground of a body (blueprints/body/elevation), made in the page: {Source, Inputs}. */
	ElevationCode: null,

	/*
	 * The function of the height of the ground of a body ({Main, Inputs}): of its code made in the page the first time; in
	 * a worker of what ShareGround gave it.
	 */
	ElevationRun: function () {
		var kept = this.ElevationCode || (typeof this.$Shared === 'function' ? this.$Shared('elevation-code') : null);
		var made;

		if (!kept && typeof Elemenx !== 'undefined' && Elemenx.Compilers && typeof Elemenx.Resources === 'function') {
			made = this.$Service('Blueprints').NumericCode(Elemenx.Resources('Blueprints', 'ElemenxGraphics/body/elevation'), {});

			if (!made)
				throw new Error('Elemenx SceneTerrainGenerator: the graph of the height of a body is not of numbers');

			kept = this.ElevationCode = {Source: made.Source, Inputs: made.Numeric.Inputs.map(function (one) {
				return one.Name;
			})};
		}

		if (!kept)
			throw new Error('Elemenx SceneTerrainGenerator: no graph of the height of a body in a worker: its pool was given none (ShareGround)');

		if (!this.ElevationMade)
			this.ElevationMade = {Main: new Function('B', 'M', 'N', kept.Source)().Main, Inputs: kept.Inputs};

		return this.ElevationMade;
	},

	/* The code of the land of the graph that bakes a body (BakeCode), made of another graph in the page: the library one changed. */
	BakeMake: function (graph) {
		this.BakeCode = graph ? this.BakeCodeOf(graph) : null;
		this.BakeMade = null;

		return this.BakeCode;
	},

	/*
	 * The code of the land of a graph that bakes a body (what comes to its block BakeLand: SceneBlueprints.BakeLandGraph),
	 * made of it in the page: {Source, Inputs, Keys}; null for a graph of no BakeLand (its GLSL written by hand).
	 */
	BakeCodeOf: function (graph) {
		var land = this.$Service('SceneBlueprints').BakeLandGraph(graph);
		var made = land ? this.$Service('Blueprints').NumericCode(land, {}, {}) : null;

		if (!land)
			return null;

		if (!made)
			throw new Error('Elemenx SceneTerrainGenerator: the land of the graph of a bake is not of numbers');

		return {Source: made.Source, Inputs: made.Numeric.Inputs.map(function (one) {
			return one.Name;
		}), Keys: made.Keys};
	},

	/* The code of the graph of a type of a sketch (SketchCode), made of its graph in the page. */
	SketchMake: function (type, graph) {
		this.SketchCode = this.SketchCode || {};
		this.SketchCode[type] = this.SketchCodeOf(type, graph);

		if (this.SketchMade)
			delete this.SketchMade[type];

		return this.SketchCode[type];
	},

	/* The code of the graph of a type of a sketch, made of it in the page: {Source, Inputs, Parameters}. */
	SketchCodeOf: function (type, graph) {
		var blueprints = this.$Service('Blueprints');
		var read = blueprints.Read(graph);
		var made = blueprints.NumericCode(read, {}, {Points: 'floats', Levels: 'floats', Data: 'floats'}, ['Height']);
		var parameters = {};

		if (!made)
			throw new Error('Elemenx SceneTerrainGenerator: the graph of the sketch type ' + type + ' is not of numbers');

		(read.parameters || []).forEach(function (parameter) {
			parameters[parameter.key] = parameter.value;
		});

		return {Source: made.Source, Inputs: made.Numeric.Inputs.map(function (one) {
			return one.Name;
		}), Parameters: parameters};
	},

	/*
	 * The code of the graphs of a ground of its own (Graphs: {'sketch/<type>' or 'carve/<type>': a graph or the name of one in
	 * the resources}), made in the page: {name: {Source, Inputs, Parameters or Keys}}. Other names (a planet's) are not of a ground.
	 */
	GraphCodeOf: function (graphs) {
		var self = this;
		var made = {};

		Object.keys(graphs || {}).forEach(function (name) {
			var kind = name.split('/')[0];
			var type = name.slice(kind.length + 1);
			var graph = typeof graphs[name] === 'string' ? Elemenx.Resources('Blueprints', graphs[name]) : graphs[name];
			if (!graph || !type) return;

			if (kind === 'sketch') made[name] = self.SketchCodeOf(type, graph);
			else if (kind === 'carve') made[name] = self.CarveCodeOf(type, graph);
			else if (kind === 'layout') made[name] = {Source: self.$Service('LayoutBlueprints').Code(graph).Source};
		});

		return made;
	},

	/* The function of the code of a graph of a ground of its own (GraphCode), made once for the same code. */
	OwnRun: function (code) {
		this.OwnMade = this.OwnMade || {};

		if (!this.OwnMade[code.Source])
			this.OwnMade[code.Source] = {Main: new Function('B', 'M', 'N', code.Source)().Main, Inputs: code.Inputs, Parameters: code.Parameters || {}, Keys: code.Keys};

		return this.OwnMade[code.Source];
	},

	/* The values of a type of a sketch where an item tells none: those of every type, then its own. */
	SketchDefaults: function (type) {
		return Object.assign({}, (this.SketchTable['*'] || {}).Defaults, (this.SketchTable[type] || {}).Defaults);
	},

	/*
	 * The size of a building of each class, its Width and Depth in metres: what a settlement lays out, and Buildings makes
	 * (those of the classes of buildings of the resources, as SceneBuildingGenerator.Defaults: Regression: a church, a
	 * station and a car park were laid out larger). Made as the Service is (its $OnCreate).
	 */
	SettlementSizes: {},

	/* What each kind of settlement is: the step of its streets, their width, a grid of them or a main one, its buildings. */
	SettlementKinds: {},

	/* The buildings of each kind of district. */
	SettlementDistricts: {},

	/*
	 * The plan of a settlement of a sketch: its streets (those drawn in it, else its own: a grid along its longest side, or a main
	 * street and lanes off it), its lots along them (each a building of a class of its district or its kind, turned to its street,
	 * none on a square, a street, another lot or out of it), its walls (a fort: round it) with their gates where streets cross
	 * them and towers at their corners. item {Points, Kind, Density, Seed}; others: the other items of the sketch.
	 * Gives {Streets: [{Points, Width, Road (of a street drawn of a type of road)}], Lots: [{X, Z, Turn, Width, Depth, Class, District}], Walls: [[[x, z]...]], Gates: [{X, Z,
	 * Turn}], Towers: [{X, Z}]}.
	 */
	SettlementPlan: function (item, others, sizes, own) {
		var layouts = this.$Service('LayoutBlueprints');
		var kind = this.SettlementKinds[item.Kind] || this.SettlementKinds.village;
		var layout = kind.Graph || layouts.Area(item, others, kind, sizes).Layout || 'grid';
		/* Of a graph of the ground's own (GraphCode: layout/<name> of a world), else of the library's. */
		var code = own && own['layout/' + layout];

		return layouts.Plan(this.LayoutRun(code ? {Source: code.Source} : layout)({}, {Item: item, Others: others, Kind: kind, Sizes: sizes}).Layout);
	},

	/* The layouts of the library (blueprints/layout/<name>), their code made in the page (LayoutRun), carried to the workers. */
	LayoutNames: ['grid', 'main', 'road', 'radial', 'districts'],

	LayoutCode: {},

	/* The function of the code of a layout graph (a name of the library, or ElemenxGraphics/...): made in the page, carried. */
	LayoutRun: function (name) {
		var key = name && name.Source ? '' : String(name);
		var source = name && name.Source || this.LayoutCode[key];
		if (!source)
			source = this.LayoutCode[key] = this.$Service('LayoutBlueprints').Code(key.indexOf('/') === -1 ? 'ElemenxGraphics/layout/' + key : key).Source;

		this.LayoutMade = this.LayoutMade || {};

		if (!this.LayoutMade[source])
			this.LayoutMade[source] = new Function('B', 'M', 'N', source)(this.$Service('Blueprints'), this.$Service('Math'), this.$Service('Noise'));

		return this.LayoutMade[source];
	},

	/*
	 * The items of a sketch that place things (the Scatter of a Scene sows them) and change no height: a trigger and a zone
	 * of the game are objects of the scene.
	 */
	SketchPlaced: {},

	/*
	 * The carves of the volume a sketch draws (SketchTypes cave, hall and overhang), in the order of its layers and items:
	 * a cave a line of passages under the ground (Width, Depth under it, 8; Rough, 0.5; Mouth 1: its ends come up to the
	 * ground, 0: closed; a point [x, z, y] at that height), a hall a round hollow (At, Radius, Depth of its middle under the ground, 10), an overhang rock
	 * jutting out of what is steep round a point (At, Radius, Amount, 6). height(x, z): the ground.
	 */
	SketchCarves: function (sketch, height, seed) {
		var self = this;
		var sketched = this.Carves.Sketch;
		var carves = [];

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
		}

		(sketch && sketch.Layers || []).forEach(function (layer) {
			if (layer.Visible === false) return;

			(layer.Items || []).forEach(function (item, index) {
				var id = String(item.ID === undefined ? index : item.ID);
				var at = item.At || [0, 0];
				var radius;
				var depth;

				if (item.Visible === false) return;

				if (item.Type === 'cave' && (item.Points || []).length > 1) {
					radius = number(item.Width, sketched.cave.Width) / 2;
					depth = number(item.Depth, sketched.cave.Depth);

					carves.push({Type: 'passages', Seed: String(seed === undefined ? 'ground' : seed) + '-cave-' + id, Radius: radius, Rough: number(item.Rough, sketched.cave.Rough), Flat: self.Carves.Tunnel.Flat, Nodes: item.Points.map(function (point, n) {
						var mouth = number(item.Mouth, sketched.cave.Mouth) && (n === 0 || n === item.Points.length - 1);

						/* A point [x, z, y]: its floor that high, whatever the ground over it. */
						if (point.length > 2 && point[2] !== null && point[2] !== undefined && point[2] !== '')
							return {ID: String(n), At: [Number(point[0]) || 0, Number(point[1]) || 0, Number(point[2])]};

						return {ID: String(n), At: [Number(point[0]) || 0, Number(point[1]) || 0], Depth: mouth ? radius * 0.4 : depth};
					}), Ways: item.Points.slice(1).map(function (point, n) {
						return {From: String(n), To: String(n + 1)};
					})});
				}
				else if (item.Type === 'hall') {
					radius = number(item.Radius, sketched.hall.Radius);

					carves.push({Type: 'sphere', At: [Number(at[0]) || 0, height(Number(at[0]) || 0, Number(at[1]) || 0) - number(item.Depth, sketched.hall.Depth), Number(at[1]) || 0], Radius: radius});
				}
				else if (item.Type === 'overhang') {
					carves.push({Type: 'overhangs', Seed: String(seed === undefined ? 'ground' : seed) + '-overhang-' + id, Center: [Number(at[0]) || 0, Number(at[1]) || 0], Radius: number(item.Radius, sketched.overhang.Radius), Amount: number(item.Amount, sketched.overhang.Amount), Slope: number(item.Slope, sketched.overhang.Slope)});
				}
			});
		});

		return carves;
	},

	/*
	 * Where two sketches differ, for a ground to make again only there: the bounds [x0, z0, x1, z1] of each item one has and
	 * the other has not, or has otherwise (those of both, when it moved), merged where they overlap. A trigger or a zone changes
	 * no ground.
	 */
	SketchChanged: function (before, after) {
		var flat = function (sketch) {
			var made = {};

			(sketch && sketch.Layers || []).forEach(function (layer) {
				(layer.Items || []).forEach(function (item, index) {
					made[(layer.ID || '') + '/' + (item.ID || index)] = JSON.stringify([item, layer.Visible, layer.Strength]);
				});
			});

			return made;
		};
		var old = flat(before);
		var now = flat(after);
		var bounds = [];
		var keys = Object.keys(old).concat(Object.keys(now));
		var none = function () {
			return 0;
		};
		var oldItems = this.Sketched(before, none).Items;
		var newItems = this.Sketched(after, none).Items;
		var game = {trigger: true, triggerpoint: true, triggerline: true, zone: true};

		keys.forEach(function (key, index) {
			if (keys.indexOf(key) !== index || old[key] === now[key]) return;

			[oldItems, newItems].forEach(function (list) {
				list.forEach(function (made) {
					if (key.slice(key.indexOf('/') + 1) === String(made.Item.ID) && !game[made.Item.Type])
						bounds.push(made.Bounds.slice());
				});
			});
		});

		return bounds;
	},

	/*
	 * A flat ground of its options whose heights are a grid (side by side, over all its size, row by row along Z): the
	 * very ground of a field baked, or painted. Between the points it is smooth, out of the grid it is of its noise. It has
	 * the methods of Flat, its Grid and Side, and no Options: its squares are made in the page.
	 */
	FromGrid: function (options, heights, side) {
		var field = this.Flat(options);
		var last = side - 1;
		var noise = field.Height;

		field.Grid = heights;
		field.Side = side;

		delete field.Options;

		field.Height = function (x, z) {
			var u = (x / field.Size + 0.5) * last;
			var v = (z / field.Size + 0.5) * last;
			var column;
			var row;
			var at;
			var below;
			var above;

			if (u < 0 || v < 0 || u > last || v > last) return noise(x, z);

			column = Math.min(last - 1, Math.floor(u));
			row = Math.min(last - 1, Math.floor(v));
			at = row * side + column;
			below = heights[at] + (heights[at + 1] - heights[at]) * (u - column);
			above = heights[at + side] + (heights[at + side + 1] - heights[at + side]) * (u - column);

			return below + (above - below) * (v - row);
		};

		return field;
	},

	/* The heights of a field in a grid of side by side points over all its size, row by row along Z: what FromGrid reads. */
	Heights: function (field, side) {
		var heights = new Float32Array(side * side);
		var step = field.Size / (side - 1);
		var row;
		var column;

		for (row = 0; row < side; row++) {
			for (column = 0; column < side; column++)
				heights[row * side + column] = field.Height(column * step - field.Size / 2, row * step - field.Size / 2);
		}

		return heights;
	},

	Field: function (shape, options, name) {
		var fields = this.Fields = this.Fields || {};
		/* Options a worker keeps by Share: by their name, not their text (a sketch is a megabyte). */
		var key = name ? shape + '#' + name : shape + JSON.stringify(options);

		fields[key] = fields[key] || this[shape](options);

		return fields[key];
	},

	Piece: function (shape, options, roads, args) {
		/*
		 * Options and roads a worker keeps by Share come by their names: sent to it once, not with each square. Regression: the
		 * options of a ground of a sketch (a megabyte) were copied to a worker with every square asked of it, hundreds of
		 * milliseconds a second of the page after it flew somewhere new.
		 */
		var named = typeof options === 'string' ? options : '';
		var field;

		if (named)
			options = this.$Shared(named);

		if (typeof roads === 'string')
			roads = this.$Shared(roads);

		field = this.Field(shape === 'SpherePicture' || shape === 'SphereThings' ? 'Sphere' : shape === 'Daylight' || shape === 'Rock' ? 'Flat' : shape, options, named);

		var made;

		function typed (geometry) {
			return {Positions: new Float32Array(geometry.Positions), Normals: new Float32Array(geometry.Normals), UVs: new Float32Array(geometry.UVs), Colors: new Float32Array(geometry.Colors || []), Materials: new Float32Array(geometry.Materials || []), Indices: new Uint32Array(geometry.Indices)};
		}

		/*
		 * A square of a globe; with a size (args[5]) and a field that paints itself (ScenePlanet), its picture too; with a size
		 * of what stands on it (args[6]), that too, of the same picture (ScenePlanet.PatchThings): one job, not two of it.
		 */
		if (shape === 'Sphere') {
			made = field.Patch(args[0], args[1], args[2], args[3], args[4]);

			var picture = args[5] && field.Picture ? field.Picture(args[0], args[1], args[2], args[3], args[5]) : null;

			return {Geometry: typed(made.Geometry), Center: made.Center, Picture: picture, Things: args[6] && field.Planet ? this.$Service('ScenePlanet').PatchThings(field, args[0], args[1], args[2], args[3], args[6], picture) : null};
		}

		/* What stands on a square of a globe that paints itself (ScenePlanet.PatchThings): its woods and houses, one shape. */
		if (shape === 'SphereThings')
			return field.Planet ? this.$Service('ScenePlanet').PatchThings(field, args[0], args[1], args[2], args[3], args[4]) : null;

		/*
		 * The daylight in a box of a ground with a volume (Daylight), args [x, y, z of its first corner, nx, ny, nz, cell]: a
		 * byte a point (0 to 255), the layers of y side by side along x, z down ({Data, Width, Height}).
		 */
		if (shape === 'Daylight') {
			var light = this.Daylight(field, args[0], args[2], args[0] + (args[3] - 1) * args[6], args[2] + (args[5] - 1) * args[6], args[1]);
			var data = new Uint8Array(args[3] * args[4] * args[5]);
			var i;
			var j;
			var k;

			for (k = 0; k < args[5]; k++) {
				for (j = 0; j < args[4]; j++) {
					for (i = 0; i < args[3]; i++)
						data[k * args[3] * args[4] + j * args[3] + i] = Math.round(255 * light.At(args[0] + i * args[6], args[1] + j * args[6], args[2] + k * args[6]));
				}
			}

			return {Data: data, Width: args[3] * args[4], Height: args[5]};
		}

		/* Where a box of the ground is rock, a voxel of a metre a byte (Rock). */
		if (shape === 'Rock')
			return this.Rock(field, args);

		/* The picture of a square of a globe alone (a face made at once, its picture after). */
		if (shape === 'SpherePicture')
			return {Picture: field.Picture ? field.Picture(args[0], args[1], args[2], args[3], args[4]) : null};

		field.Roads = roads || null;

		return typed(field.Chunk(args[0], args[1], args[2], args[3]));
	},

	/*
	 * Where a box of a field is rock, args [x, y, z of its first corner, nx, ny, nz], voxels of a metre: a byte each (255 rock,
	 * 0 air), by the middle of the voxel; the layers of y 8 a row, each nx by nz, x along a row, z down ({Data, Width,
	 * Height}): the grid of the light of probes (SceneProbes), which draws only the surfaces and took what is under the
	 * ground for air. Under its height rock; where a carve (a cave, a tunnel) may change the density, of the density.
	 */
	Rock: function (field, args) {
		var volume = field.Volume;
		var nx = args[3];
		var ny = args[4];
		var nz = args[5];
		var width = nx * 8;
		var data = new Uint8Array(width * nz * Math.ceil(ny / 8));
		var i;
		var j;
		var k;

		for (k = 0; k < nz; k++) {
			for (i = 0; i < nx; i++) {
				var x = args[0] + i + 0.5;
				var z = args[2] + k + 0.5;
				var top = volume ? volume.Ground(x, z) : field.Height(x, z);
				var span = volume ? volume.Span(x, z, top, 1, true) : null;

				for (j = 0; j < ny; j++) {
					var y = args[1] + j + 0.5;
					var rock = span && y >= span[0] - 1 && y <= span[1] + 1 ? volume.Density(x, y, z) > 0 : y < top;
					if (rock)
						data[(Math.floor(j / 8) * nz + k) * width + (j % 8) * nx + i] = 255;
				}
			}
		}

		return {Data: data, Width: width, Height: nz * Math.ceil(ny / 8)};
	},

	/*
	 * Where things may grow on a square field of size, side by side bytes (its rows from -size/2 to size/2): 255 free, 0
	 * kept bare: within Reach of the way of each line ({Points [[x, z]...], Reach}: a road with its shoulders, a river with
	 * its banks) and inside each area (Points: a clearing, a lake), with Edge (1.5) of soft border.
	 */
	Free: function (size, side, lines, areas, edge) {
		var data = new Uint8Array(side * side);
		var step = size / (side - 1);
		var soft = edge === undefined ? 1.5 : Math.max(0.01, Number(edge));
		var half = size / 2;

		data.fill(255);

		/* A cell kept as bare as its distance d from the border tells (0 inside, soft outside). */
		function keep (column, row, d) {
			var at = row * side + column;
			var value = d <= 0 ? 0 : Math.round(255 * Math.min(1, d / soft));
			if (value < data[at])
				data[at] = value;
		}

		function cells (x0, z0, x1, z1, each) {
			var c0 = Math.max(0, Math.floor((x0 + half) / step));
			var c1 = Math.min(side - 1, Math.ceil((x1 + half) / step));
			var r0 = Math.max(0, Math.floor((z0 + half) / step));
			var r1 = Math.min(side - 1, Math.ceil((z1 + half) / step));
			var row;
			var column;

			for (row = r0; row <= r1; row++) {
				for (column = c0; column <= c1; column++)
					each(column, row, column * step - half, row * step - half);
			}
		}

		(lines || []).forEach(function (line) {
			var points = line.Points || [];
			var reach = Number(line.Reach) || 0;
			var i;

			for (i = 0; i + 1 < points.length; i++) {
				(function (a, b) {
					var dx = b[0] - a[0];
					var dz = b[1] - a[1];
					var length = dx * dx + dz * dz || 1;
					var out = reach + soft;

					cells(Math.min(a[0], b[0]) - out, Math.min(a[1], b[1]) - out, Math.max(a[0], b[0]) + out, Math.max(a[1], b[1]) + out, function (column, row, x, z) {
						var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / length));

						keep(column, row, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z) - reach);
					});
				})(points[i], points[i + 1]);
			}
		});

		(areas || []).forEach(function (points) {
			var xs = points.map(function (point) {
				return point[0];
			});
			var zs = points.map(function (point) {
				return point[1];
			});

			cells(Math.min.apply(null, xs), Math.min.apply(null, zs), Math.max.apply(null, xs), Math.max.apply(null, zs), function (column, row, x, z) {
				var inside = false;
				var i;
				var j;

				for (i = 0, j = points.length - 1; i < points.length; j = i++) {
					if ((points[i][1] > z) !== (points[j][1] > z) && x < (points[j][0] - points[i][0]) * (z - points[i][1]) / (points[j][1] - points[i][1]) + points[i][0])
						inside = !inside;
				}

				if (inside)
					keep(column, row, 0);
			});
		});

		return data;
	},

	/* The heights of a flat ground of its options over all its size, side by side points, four numbers each, its height the first (the floor of a sea). */
	Floor: function (options, side) {
		var field = this.Field('Flat', options);
		var data = new Float32Array(side * side * 4);
		var step = field.Size / (side - 1);
		var row;
		var column;

		for (row = 0; row < side; row++) {
			for (column = 0; column < side; column++)
				data[(row * side + column) * 4] = field.Height(column * step - field.Size / 2, row * step - field.Size / 2);
		}

		return data;
	},

	Grid: function (options, side, top, steep) {
		var field = this.Field('Flat', options);
		var data = new Float32Array(side * side * 4);
		var step = field.Size / (side - 1);
		var row;
		var column;

		for (row = 0; row < side; row++) {
			for (column = 0; column < side; column++) {
				var x = column * step - field.Size / 2;
				var z = row * step - field.Size / 2;
				var height = field.Height(x, z);
				var at = (row * side + column) * 4;

				data[at] = height;
				data[at + 1] = height > 1 && height < top && field.Slope(x, z) < steep && this.Grassy(field, x, z) ? 1 : 0;
			}
		}

		return data;
	},

	/* Whether grass grows at a point of a field: everywhere, but on a ground of lands by their climate where the most of them have it. */
	Grassy: function (field, x, z) {
		var lands;

		if (!field.Biomes) return true;

		lands = field.Biome(x, z).List;

		return lands.reduce(function (sum, land) {
			return sum + (field.Biomes.some(function (biome) {
				return biome.Name === land.Name && biome.Grass;
			}) ? land.Weight : 0);
		}, 0) >= 0.5;
	},

	/* What a worker of the ground carries: see Workers. */
	/* What a worker carries of this Service besides its methods: its tables. */
	Carried: ['TunnelRadius', 'DefaultBiomes', 'Zones', 'Carves', 'GroundMaterials', 'LookMaterials', 'SketchTypes', 'SketchTable', 'SketchPlaced', 'SettlementSizes', 'SettlementKinds', 'SettlementDistricts', 'LayoutNames', 'LayoutCode'],

	/* What a worker of it carries: see Workers; the code of the layouts of the library made first (LayoutRun). */
	Source: function (names) {
		this.LayoutNames.forEach(function (name) {
			this.LayoutRun(name);
		}, this);

		return this.$Service('Workers').Source(this, names);
	},

	/* A direction of a face of a cube, as the shaders take them (Chunks.Cube of Renderer). */
	Face: function (face, u, v) {
		if (face === 0)
			return [1, -v, -u];

		if (face === 1)
			return [-1, -v, u];

		if (face === 2)
			return [u, 1, v];

		if (face === 3)
			return [u, -1, -v];

		if (face === 4)
			return [u, -v, 1];

		return [-u, -v, -1];
	},

	/*
	 * A square of a face of a globe: its points relative to its middle, their normals, UVs [height, 1 on the sea], colors
	 * (a ground that paints itself), and in Materials (12 a point) where each is on the square, 0 to 1, for its picture
	 * (PatchPicture), then, of a point of its edges, where it goes to lie on the edge of a square one, two and three levels
	 * coarser beside. A skirt under its edges hides what a finer square beside leaves between them.
	 */
	SpherePatch: function (field, face, cu, cv, extent, resolution) {
		var math = this.$Service('Math');
		var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Materials: [], Indices: []};
		var side = resolution + 1;
		var step = extent / resolution;
		var center = field.Point(this.Face(face, cu, cv));
		var points = [];
		var row;
		var column;
		var direction;
		var value;
		var point;
		var a;
		var b;
		var c;
		var normal;

		for (row = 0; row <= resolution; row++) {
			for (column = 0; column <= resolution; column++) {
				direction = math.Vectors.Normalize(this.Face(face, cu - extent / 2 + column * step, cv - extent / 2 + row * step));
				value = field.Land(direction);
				point = math.Vectors.Scale(direction, field.Radius + field.Raise(direction, value));

				points.push(point);
				geometry.Positions.push(point[0] - center[0], point[1] - center[1], point[2] - center[2]);
				geometry.UVs.push(value, field.Ocean > 0 && value < 0 ? 1 : 0);
				geometry.Materials.push(column / resolution, row / resolution, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

				/* A ground that tells its colors (ScenePlanet) has them on each point. */
				if (field.Color)
					geometry.Colors.push.apply(geometry.Colors, field.Color(direction, step * Math.PI / 4 * field.Radius));
			}
		}

		/* The normals of the ground: of the neighbours in the patch (its edges of their nearest ones). */
		for (row = 0; row <= resolution; row++) {
			for (column = 0; column <= resolution; column++) {
				a = points[row * side + Math.max(0, column - 1)];
				b = points[row * side + Math.min(resolution, column + 1)];
				c = points[Math.max(0, row - 1) * side + column];
				point = points[Math.min(resolution, row + 1) * side + column];
				normal = math.Vectors.Normalize(math.Vectors.Cross(math.Vectors.Subtract(point, c), math.Vectors.Subtract(b, a)));

				if (math.Vectors.Dot(normal, points[row * side + column]) < 0)
					normal = math.Vectors.Scale(normal, -1);

				geometry.Normals.push(normal[0], normal[1], normal[2]);
			}
		}

		/* The faces of the cube are mirrored one to another: the triangles turned outwards on each, by the first one. */
		normal = math.Vectors.Cross(math.Vectors.Subtract(points[1], points[0]), math.Vectors.Subtract(points[side], points[0]));
		b = math.Vectors.Dot(normal, points[0]) > 0;

		for (row = 0; row < resolution; row++) {
			for (column = 0; column < resolution; column++) {
				a = row * side + column;

				if (b) geometry.Indices.push(a, a + 1, a + side, a + 1, a + side + 1, a + side);
				else geometry.Indices.push(a, a + side, a + 1, a + 1, a + side, a + side + 1);
			}
		}

		/*
		 * Each point of its edges, where it goes to lie on the edge of a coarser square beside (Materials 2-4: of one level
		 * coarser, its cells twice as long, on the line between its points two cells apart; 5-7: of two, four apart; 8-10:
		 * of three, eight apart), as the Ground shader moves it by the levels of the squares beside (uEdges). Regression: a
		 * square beside a coarser one met it in a step of metres (its own heights between the points of the other), a wall
		 * of its skirt across the land.
		 */
		/* Its edges: its first row and its last, its first column and its last ([first point, step to the next]). */
		[[0, 1], [resolution * side, 1], [0, side], [resolution, side]].forEach(function (edge) {
			var start = edge[0];
			var stride = edge[1];
			var t;

			for (t = 1; t < resolution; t++) {
				var at = start + t * stride;
				var p = points[at];

				[2, 4, 8].forEach(function (apart, level) {
					var off = t % apart;
					var a = points[start + (t - off) * stride];
					var b = points[start + Math.min(resolution, t - off + apart) * stride];
					var k;

					for (k = 0; k < 3; k++)
						geometry.Materials[at * 12 + 2 + level * 3 + k] = off ? a[k] + (b[k] - a[k]) * off / apart - p[k] : 0;
				});
			}
		});

		/*
		 * Regression: squares of other sizes side by side left cracks between them, a dark dotted line from high over the
		 * ground. A skirt of each edge point again, a tenth of a cell lower (at least 50 m), seen from both of its sides.
		 */
		var edges = [];
		var drop = Math.max(0.05, step * Math.PI / 4 * field.Radius * 0.1 + field.Height * 0.02);
		var base = points.length;

		for (column = 0; column <= resolution; column++)
			edges.push(column);

		for (row = 1; row <= resolution; row++)
			edges.push(row * side + resolution);

		for (column = resolution - 1; column >= 0; column--)
			edges.push(resolution * side + column);

		for (row = resolution - 1; row >= 1; row--)
			edges.push(row * side);

		edges.forEach(function (index) {
			var length = Math.sqrt(points[index][0] * points[index][0] + points[index][1] * points[index][1] + points[index][2] * points[index][2]) || 1;
			var lower = (length - drop) / length;

			geometry.Positions.push(points[index][0] * lower - center[0], points[index][1] * lower - center[1], points[index][2] * lower - center[2]);
			geometry.Normals.push(geometry.Normals[index * 3], geometry.Normals[index * 3 + 1], geometry.Normals[index * 3 + 2]);
			geometry.UVs.push(geometry.UVs[index * 2], geometry.UVs[index * 2 + 1]);
			geometry.Materials.push.apply(geometry.Materials, geometry.Materials.slice(index * 12, index * 12 + 12));

			if (field.Color)
				geometry.Colors.push(geometry.Colors[index * 3], geometry.Colors[index * 3 + 1], geometry.Colors[index * 3 + 2]);
		});

		edges.forEach(function (index, at) {
			var next = edges[(at + 1) % edges.length];
			var low = base + at;
			var lowNext = base + (at + 1) % edges.length;

			geometry.Indices.push(index, next, low, next, lowNext, low, index, low, next, next, low, lowNext);
		});

		return {Geometry: geometry, Center: center};
	}
});
