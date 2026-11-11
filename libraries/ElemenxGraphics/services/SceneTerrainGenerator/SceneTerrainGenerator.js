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
 *   z): true where a thing stands in the way), Chunk(x,
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
 *   area zone (Tags, Team), objects of the scene of a Scene (the trait Triggers). Sketched(sketch, base,
 *   seed) makes one ({Height(x, z, h), Look(x, z), Waters(), Items}: Waters the rivers, a strip at their levels, and the
 *   lakes); SketchChanged(before, after) gives the bounds [x0, z0, x1, z1] where two differ, for a ground made again only there.
 * - Sphere(options) returns the ground of a planet, the very one its baked surface shows (the noise of Math, as
 *   the shader of a Scene bakes it): options Radius (units), Height (its relief), Seed (the number of its pattern),
 *   Ocean (0 to 1), Type (rocky, desert, terran, ocean, ice, lava, dwarf, moon). Its methods: Land(direction) (the
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
 *   Blocked, CanStep, Stands), as a location is.
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
 * - Source(names): the source of its members, for a worker.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneTerrainGenerator', {
	$Meta: {
		Description: 'The ground of a game, continuous: heights of noise anywhere, meshes in chunks, ways over it; the ground of a planet as its surface shows.',
		Methods: ['FlatOf(options)', 'Flat(options)', 'Border(options)', 'Passages(carve, height)', 'PassageRoute(graph, from, to)', 'Relief(settings)', 'Climate(settings)', 'ClimateOf(settings)', 'LibraryRelief(options)', 'Sphere(options)', 'OnRoad(field, x, z, width)', 'Work()', 'Piece(shape, options, roads, args)', 'Field(shape, options)', 'Grid(options, side, top, steep)', 'Free(size, side, lines, areas, edge)', 'Floor(options, side)', 'Heights(field, side)', 'FromGrid(options, heights, side)', 'Sketched(sketch, base, seed)', 'RoadWay(field, from, to, options)', 'SketchChanged(before, after)', 'Source(names)']
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
		Object.assign(this.LookMaterials, Elemenx.Resources('Data', 'ElemenxGraphics/terrain/look-materials') || {});
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

		if (!source && settings.Relief && blueprints && blueprints.Code) {
			made = blueprints.Code(typeof settings.Relief === 'string' ? JSON.parse(settings.Relief) : settings.Relief);

			if (made)
				source = settings.ReliefSource = made.Source;
		}

		if (!source)
			return null;

		/* What the options tell of its parameters; the graph's own values for the rest. */
		['Scale', 'Ridges', 'Water', 'Height'].forEach(function (key) {
			if (settings[key] !== undefined && settings[key] !== null && settings[key] !== '')
				parameters[key] = Number(settings[key]);
		});

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

	/*
	 * The climate of a ground with no graph to tell it: the warmth, Warmth by the sea, falls with the height over it (Water
	 * to the top: by Lapse), a noise round it (by Spread); the moisture a noise of its own, five times wider than its hills. raw is its
	 * height, 0 to 1. LibraryRelief makes the very same of blocks.
	 */
	/* The radius of a tunnel or a passage carved with none told, in metres. */
	TunnelRadius: 2.5,

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
		var noise = this.$Service('Noise');
		var flat = this.FlatOf(settings);
		var seed = String(flat.Seed);
		var scale = flat.Scale;
		var water = flat.Water;
		var numbers = this.ClimateOf(settings);
		var wet = null;
		var warm = null;

		/* Its noises made when a climate is first asked: most grounds never ask it. */
		return function (x, z, raw) {
			var t = Math.max(0, Math.min(1, (raw - water) / ((1 - water) || 1)));
			var cold = t * t * (3 - 2 * t);

			wet = wet || noise.Make({Type: 'value', Seed: seed + '-moisture', Fractal: 'fbm', Octaves: 4});
			warm = warm || noise.Make({Type: 'value', Seed: seed + '-warmth', Fractal: 'fbm', Octaves: 3});

			return {
				Moisture: Math.max(0, Math.min(1, 0.5 + (wet.At(x / (scale * 5), 5.5, z / (scale * 5)) - 0.5) * numbers.Stretch)),
				Temperature: Math.max(0, Math.min(1, numbers.Warmth - cold * numbers.Lapse + (warm.At(x / (scale * 4), 7.5, z / (scale * 4)) - 0.5) * numbers.Spread))
			};
		};
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
		var list;

		if (settings.BiomeList)
			return settings.BiomeList;

		if (!Array.isArray(settings.Biomes) || !settings.Biomes.length) return null;

		list = settings.Biomes.map(function (entry) {
			var name = typeof entry === 'string' ? entry : entry.Biome || entry.Name;
			var known = registry && name ? registry.Get(name) : null;
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
			options.BiomeList = this.Biomes({Biomes: options.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp', 'rainforest', 'semidesert', 'steppe']});

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
		var noise = math.Noise(flat.Seed);
		var size = flat.Size;
		var height = flat.Height;
		var water = flat.Water;
		var scale = flat.Scale;
		var ridges = flat.Ridges;
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

		/* A height of a zone: a part of the highest hills, Infinity for none (false), the part by default. */
		function zone (value, fallback, top) {
			if (value === false || value === 'false') return Infinity;

			return top * (value === undefined || value === '' || value === null ? fallback : Number(value));
		}

		function raw (x, z) {
			if (relief)
				return Number(relief(x, z).Height) || 0;

			/* The elevation of the planet there, metres, as a part of Height: its sea level is 0, its sea under it (Water, any share). */
			if (site)
				return site.Elevation(x, z) / (height || 1) * (1 - water) + water;

			if (own)
				return own.At(x, 0, z);

			var soft = noise.Fbm(x / scale, 0.37, z / scale, 6);
			var folded = noise.Ridge(x / scale * 0.7 + 11, 1.3, z / scale * 0.7 - 5, 5);
			var mountains = self.Smoothstep(0.45, 0.75, noise.Fbm(x / scale * 0.25 + 3, 2.1, z / scale * 0.25, 3)) * ridges;

			return soft * (1 - mountains) + folded * mountains;
		}

		field = {
			Options: settings,
			Size: size,
			Top: height,
			/* Where the rock and the snow begin, in its units (Rock and Snow of the options, parts of its Height; false: none). */
			Rock: zone(settings.Rock, 0.45, height),
			Snow: zone(settings.Snow, 0.75, height),
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
				var made = relief ? relief(x, z) : site ? site.Sample(x, z) : null;
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

				if (Math.abs(x) > size / 2 || Math.abs(z) > size / 2) return false;
				if (!given.Swim && field.Height(x, z) < 0) return false;
				if (given.Blocked && given.Blocked(x, z)) return false;

				return field.Slope(x, z) <= (given.MaxSlope === undefined ? 0.45 : given.MaxSlope);
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
			var sketched = this.Sketched(settings.Sketch, plain, settings.Seed);

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

		/* What is cut out of it and juts out of it (Carves): its volume over its heights. */
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

			Path: function (from, to) {
				return [{X: from[0], Z: from[1]}, {X: to[0], Z: to[1]}];
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
		var rock = field.Rock === undefined ? top * 0.45 : field.Rock;
		var snow = field.Snow === undefined ? top * 0.75 : field.Snow;
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
	 * - tunnel: Points [[x, z, y]...] (y: the height of its axis; none: Depth under the ground there), Radius (2.5), Flat
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
		var noise = this.$Service('Noise');
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
			var one = {Type: carve.Type, Carve: carve};
			var points;

			if (carve.Type === 'tunnel') {
				points = (carve.Points || []).map(function (point) {
					return [Number(point[0]), point[2] === undefined || point[2] === null ? ground(point[0], point[1]) - number(carve.Depth, 0) : Number(point[2]), Number(point[1])];
				});
				one.Points = points;
				one.Radius = number(carve.Radius, self.TunnelRadius);
				one.Flat = Math.max(0, Math.min(1, number(carve.Flat, 0.5)));
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
				one.Rough = Math.max(0, number(carve.Rough, 0));
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
				one.Noise = noise.Make({Type: 'simplex', Seed: seed + '-rough', Fractal: 'fbm', Octaves: 2});
				one.Scale = number(carve.Scale, 6);

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
				one.Radius = number(carve.Radius, 100);
				one.Top = number(carve.Top, 3);
				one.Bottom = number(carve.Bottom, 40);
				one.Scale = number(carve.Scale, 24);
				one.Width = number(carve.Width, 0.35);
				one.Halls = number(carve.Halls, 0.5);
				one.Ways = [noise.Make({Type: 'simplex', Seed: seed + '-a'}), noise.Make({Type: 'simplex', Seed: seed + '-b'})];
				one.Hall = noise.Make({Type: 'simplex', Seed: seed + '-h', Fractal: 'fbm', Octaves: 3});
				one.Bounds = [one.Center[0] - one.Radius, -Infinity, one.Center[1] - one.Radius, one.Center[0] + one.Radius, Infinity, one.Center[1] + one.Radius];
			}
			else if (carve.Type === 'overhangs') {
				one.Center = carve.Center ? carve.Center.map(Number) : null;
				one.Radius = number(carve.Radius, Infinity);
				one.Amount = number(carve.Amount, 6);
				one.Scale = number(carve.Scale, 24);
				one.Slope = number(carve.Slope, 0.45);
				one.Warp = [noise.Make({Type: 'simplex', Seed: seed + '-x', Fractal: 'fbm', Octaves: 2}), noise.Make({Type: 'simplex', Seed: seed + '-z', Fractal: 'fbm', Octaves: 2})];
				one.Bounds = one.Center && isFinite(one.Radius) ? [one.Center[0] - one.Radius - one.Amount, -Infinity, one.Center[1] - one.Radius - one.Amount, one.Center[0] + one.Radius + one.Amount, Infinity, one.Center[1] + one.Radius + one.Amount] : [-Infinity, -Infinity, -Infinity, Infinity, Infinity, Infinity];
			}
			else {
				return null;
			}

			return one;
		}).filter(Boolean);

		/*
		 * The distance of a point to a tunnel of a Width: across its axis (level, square to it) and up from it, to a box of its
		 * Width and Height with round corners. Regression: a wide road was cut as round bores side by side, and the ground left
		 * between them came into the box of its lining.
		 */
		function boxed (one, x, y, z) {
			var best = Infinity;
			var i;

			for (i = 0; i + 1 < one.Points.length; i++) {
				var a = one.Points[i];
				var b = one.Points[i + 1];
				var dx = b[0] - a[0];
				var dy = b[1] - a[1];
				var dz = b[2] - a[2];
				var level = Math.sqrt(dx * dx + dz * dz) || 1;
				var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / (level * level)));
				var across = Math.abs(((x - a[0] - dx * t) * -dz + (z - a[2] - dz * t) * dx) / level) - (one.Width / 2 - one.Corner);
				var up = Math.abs(y - (a[1] + dy * t)) - (one.Height / 2 - one.Corner);
				var d = Math.sqrt(Math.max(across, 0) * Math.max(across, 0) + Math.max(up, 0) * Math.max(up, 0)) + Math.min(Math.max(across, up), 0) - one.Corner;
				if (d < best)
					best = d;
			}

			return best;
		}

		/* The distance of a point to a tunnel, and the height of its axis at the nearest point of it. */
		function tunnel (one, x, y, z) {
			var best = Infinity;
			var axis = y;
			var i;

			for (i = 0; i + 1 < one.Points.length; i++) {
				var a = one.Points[i];
				var b = one.Points[i + 1];
				var dx = b[0] - a[0];
				var dy = b[1] - a[1];
				var dz = b[2] - a[2];
				var t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / (dx * dx + dy * dy + dz * dz || 1)));
				var px = a[0] + dx * t - x;
				var py = a[1] + dy * t - y;
				var pz = a[2] + dz * t - z;
				var d = Math.sqrt(px * px + py * py + pz * pz);

				if (d < best) {
					best = d;
					axis = a[1] + dy * t;
				}
			}

			if (one.Points.length === 1) {
				best = Math.sqrt((x - one.Points[0][0]) * (x - one.Points[0][0]) + (y - one.Points[0][1]) * (y - one.Points[0][1]) + (z - one.Points[0][2]) * (z - one.Points[0][2]));
				axis = one.Points[0][1];
			}

			/* The height of its axis by the point, for what joins it (Passages: the floor of the nearest way). */
			one.Axis = axis;

			/* Of a Width: a box of its Width and Height round its axis, its corners round by Corner (the bore of a wide road). */
			if (one.Width > 0) best = boxed(one, x, y, z);

			/* Its floor cut level: nothing of it under the axis by more than (1 - Flat) of its radius. */
			else best = Math.max(best - one.Radius, axis - one.Radius * (1 - one.Flat * 0.6) - y);

			/* Crust: nothing cut within so many metres of the ground over it (a shallow tunnel keeps a roof of earth). */
			return one.Crust >= 0 && best < 0 ? Math.max(best, y - (ground(x, z) - one.Crust)) : best;
		}

		/* Natural caves: ways where two noises are both near their middle, halls where a third is high; only in their band. */
		function caves (one, x, y, z, top) {
			var depth = top - y;
			var across = Math.sqrt((x - one.Center[0]) * (x - one.Center[0]) + (z - one.Center[1]) * (z - one.Center[1]));
			var s = one.Scale;
			var a = one.Ways[0].At(x / s, y / (s * 0.6), z / s) - 0.5;
			var b = one.Ways[1].At(x / s + 17.3, y / (s * 0.6), z / s - 9.1) - 0.5;
			var way = (Math.max(Math.abs(a), Math.abs(b)) - one.Width * 0.18) * s;
			var hall = (0.72 - one.Halls * 0.16 - one.Hall.At(x / (s * 1.8), y / (s * 0.9), z / (s * 1.8))) * s * 1.5;

			return Math.max(Math.min(way, hall), one.Top - depth, depth - one.Bottom, across - one.Radius);
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
		 * The distance of a point to the ways and halls of a graph of passages: each way a tunnel, each hall a ball with its
		 * floor cut level, all joined smoothly (Blend), so a fork opens into a hall with no edge where they meet. Rough walls:
		 * a noise as deep as Rough of the widest half, none by the floor (a way stays walkable). Crust as of a tunnel.
		 */
		function passage (one, x, y, z) {
			var best = Infinity;
			var nearest = Infinity;
			var floor = y - 100;
			var lowest = Infinity;
			var k = one.Blend;

			function join (a, b) {
				var h = Math.max(k - Math.abs(a - b), 0) / k;

				return Math.min(a, b) - h * h * k / 4;
			}

			one.Tunnels.forEach(function (way) {
				var d = tunnel(way, x, y, z);

				if (d < nearest) {
					nearest = d;
					floor = way.Axis - way.Low;
				}

				if (d < k)
					lowest = Math.min(lowest, way.Axis - way.Low);

				best = k > 0 ? join(best, d) : Math.min(best, d);
			});

			one.Halls.forEach(function (hall) {
				var d = Math.max(Math.sqrt((x - hall.At[0]) * (x - hall.At[0]) + (y - hall.At[1]) * (y - hall.At[1]) + (z - hall.At[2]) * (z - hall.At[2])) - hall.Radius, hall.Floor - y);

				if (d < nearest) {
					nearest = d;
					floor = hall.Floor;
				}

				if (d < k)
					lowest = Math.min(lowest, hall.Floor);

				best = k > 0 ? join(best, d) : Math.min(best, d);
			});

			/* The join digs nothing under the floors of what it joins (Regression: a hollow under the floor where ways met). */
			if (lowest < Infinity)
				best = Math.max(best, lowest - y);

			if (one.Amount > 0 && best < one.Amount * 2) {
				/* None by the floor: it stays level to walk on, the walls and the vault rough. */
				best += (one.Noise.At(x / one.Scale, y / one.Scale, z / one.Scale) - 0.5) * 2 * one.Amount * self.Smoothstep(0.3, 1.5, y - floor);
			}

			return one.Crust >= 0 && best < 0 ? Math.max(best, y - (ground(x, z) - one.Crust)) : best;
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

				if (one.Type === 'overhangs' && inside(one, x, y, z)) {
					var slope = column ? column[1] : steep(x, z);
					var share = self.Smoothstep(one.Slope - 0.1, one.Slope + 0.2, slope);
					var far = one.Center ? Math.sqrt((x - one.Center[0]) * (x - one.Center[0]) + (z - one.Center[1]) * (z - one.Center[1])) : 0;

					share *= one.Center ? 1 - self.Smoothstep(one.Radius * 0.8, one.Radius, far) : 1;

					if (share > 0) {
						var wx = (one.Warp[0].At(x / one.Scale, y / one.Scale, z / one.Scale) - 0.5) * 2 * one.Amount * share;
						var wz = (one.Warp[1].At(x / one.Scale, y / one.Scale, z / one.Scale) - 0.5) * 2 * one.Amount * share;

						value = ground(x + wx, z + wz) - y;
					}
				}
			}

			for (i = 0; i < made.length; i++) {
				var carve = made[i];
				if (carve.Type === 'overhangs' || !inside(carve, x, y, z)) continue;

				if (carve.Type === 'tunnel') value = Math.min(value, tunnel(carve, x, y, z));
				else if (carve.Type === 'sphere') value = Math.min(value, Math.sqrt((x - carve.At[0]) * (x - carve.At[0]) + (y - carve.At[1]) * (y - carve.At[1]) + (z - carve.At[2]) * (z - carve.At[2])) - carve.Radius);
				else if (carve.Type === 'caves') value = Math.min(value, caves(carve, x, y, z, top));
				else if (carve.Type === 'passages') value = Math.min(value, passage(carve, x, y, z));
			}

			return value;
		}

		return {
			Carves: made,
			Density: density,
			Steep: steep,

			Touches: function (x0, z0, x1, z1) {
				return made.some(function (one) {
					var b = one.Bounds;
					if (b[3] < x0 || b[0] > x1 || b[5] < z0 || b[2] > z1) return false;

					/* Overhangs only where it is steep somewhere in the square. */
					if (one.Type === 'overhangs') {
						return [0, 0.25, 0.5, 0.75, 1].some(function (u) {
							return [0, 0.25, 0.5, 0.75, 1].some(function (v) {
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
				});
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
		var cost = {};
		var came = {};
		var done = {};
		var open = [];
		var route = {Nodes: [], Ways: [], Points: [], Length: 0};
		var current;

		(graph.Nodes || []).forEach(function (node) {
			nodes[node.ID] = node;
		});

		from = String(from);
		to = String(to);

		if (!nodes[from] || !nodes[to]) return null;

		cost[from] = 0;

		open.push(from);

		while (open.length) {
			open.sort(function (a, b) {
				return cost[a] - cost[b];
			});

			current = open.shift();

			if (done[current]) continue;
			if (current === String(to)) break;

			done[current] = true;

			(graph.Ways || []).forEach(function (way) {
				var next = way.From === current ? way.To : way.To === current ? way.From : null;
				if (next === null || done[next]) return;

				if (cost[next] === undefined || cost[current] + way.Length < cost[next]) {
					cost[next] = cost[current] + way.Length;
					came[next] = {Node: current, Way: way};

					open.push(next);
				}
			});
		}

		if (cost[to] === undefined) return null;

		current = String(to);
		route.Length = cost[to];

		while (current !== String(from)) {
			var step = came[current];
			var points = step.Way.From === step.Node ? step.Way.Points.slice() : step.Way.Points.slice().reverse();

			route.Nodes.unshift(current);
			route.Ways.unshift(step.Way.ID);

			route.Points = points.slice(0, -1).concat(route.Points);
			current = step.Node;
		}

		route.Nodes.unshift(String(from));
		route.Points.push(nodes[to].At.slice());

		return route;
	},

	/*
	 * A field with a volume walked as a place of floors, as the ground of a location is: Height(x, z) the ground under the sky, what was cut out of it too, and Height(x, z, y) the floor a walker
	 * at y stands on, steps up to (Climb, 0.6 m) or falls to, where the carves are (else its heights as ever: y says nothing
	 * there); Blocked(x, z, y) rock where its body is; CanStep(x, z, y) a floor for it with no rock in its way; Stands(x, z,
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
		function floor (x, z, y) {
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

			for (i = 0; i < 240; i++) {
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
			var found = floor(x, z, y);

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
		field.CanStep = function (x, z, y) {
			var found = floor(x, z, y);

			return found !== null && found <= y + climb && !field.Blocked(x, z, found) && (found <= y + 0.05 || up(x, found, z) >= steep);
		};

		return field;
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
				var h = field.Height(x0 + i * step, z0 + k * step);

				columns.push([h, field.Slope(x0 + i * step, z0 + k * step)]);

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

		for (j = 0; j <= layers; j++) {
			for (k = -1; k <= n + 1; k++) {
				for (i = -1; i <= n + 1; i++)
					values[at(i, j, k)] = volume.Density(x0 + i * step, y0 + j * step, z0 + k * step, columns[(k + 1) * side + (i + 1)]);
			}
		}

		cells = new Int32Array(side * side * layers).fill(-1);

		/*
		 * How much of the sky a cell sees, 0 to 1: of five rays up through the density, one straight up and four leaning a
		 * cell aside each cell up, those that meet no rock (out of the square: seen); a little always (0.03), so a cave is dark
		 * and its lamps light it.
		 */
		function open (ii, jj, kk) {
			var seen = 0;

			[[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (lean) {
				var up;

				for (up = 2; jj + up <= layers; up++) {
					var ci = ii + lean[0] * up;
					var ck = kk + lean[1] * up;
					if (ci < -1 || ci > n + 1 || ck < -1 || ck > n + 1) break;

					if (values[at(ci, jj + up, ck)] > 0) return;
				}

				seen++;
			});

			return Math.max(0.03, seen / 5);
		}

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
						py = field.Height(px, pz);

					/* The way the density grows, of the corners of the cell: no more of it reckoned. */
					var gx = corners[1] - corners[0] + corners[3] - corners[2] + corners[5] - corners[4] + corners[7] - corners[6];
					var gy = corners[4] - corners[0] + corners[5] - corners[1] + corners[6] - corners[2] + corners[7] - corners[3];
					var gz = corners[2] - corners[0] + corners[3] - corners[1] + corners[6] - corners[4] + corners[7] - corners[5];
					var length = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
					var normal = [-gx / length, -gy / length, -gz / length];
					var top = field.Height(px, pz);
					var stuff = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
					var color;

					/* The ground under the sky has its colors; what is under it or juts out, rock, darker the deeper. */
					if (normal[1] > 0.3 && Math.abs(py - top) < step * 1.5) {
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
					geometry.UVs.push(py, open(i, j, k));
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
		var heap = [];
		var cost = {};
		var came = {};
		var closed = {};
		var heights = {};
		var visited = 0;
		var neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		var current = null;
		var path = [];
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

		function push (node) {
			var at = heap.push(node) - 1;

			while (at > 0) {
				var up = (at - 1) >> 1;
				if (heap[up].F <= heap[at].F) break;

				var swap = heap[up];

				heap[up] = heap[at];
				heap[at] = swap;
				at = up;
			}
		}

		function pop () {
			var top = heap[0];
			var last = heap.pop();
			var at = 0;

			if (heap.length) {
				heap[0] = last;

				for (;;) {
					var left = at * 2 + 1;
					var right = left + 1;
					var least = at;
					if (left < heap.length && heap[left].F < heap[least].F)
						least = left;

					if (right < heap.length && heap[right].F < heap[least].F)
						least = right;

					if (least === at) break;

					var swap = heap[least];

					heap[least] = heap[at];
					heap[at] = swap;
					at = least;
				}
			}

			return top;
		}

		function guess (x, z) {
			return Math.hypot(x - goal[0], z - goal[1]) * step;
		}

		start = [Math.max(-reach, Math.min(reach, start[0])), Math.max(-reach, Math.min(reach, start[1]))];
		goal = [Math.max(-reach, Math.min(reach, goal[0])), Math.max(-reach, Math.min(reach, goal[1]))];
		cost[key(start[0], start[1])] = 0;

		push({X: start[0], Z: start[1], F: guess(start[0], start[1])});

		while (heap.length && visited < 60000) {
			current = pop();

			if (closed[key(current.X, current.Z)]) continue;

			closed[key(current.X, current.Z)] = true;
			visited++;

			if (current.X === goal[0] && current.Z === goal[1]) break;

			neighbours.forEach(function (offset) {
				var x = current.X + offset[0];
				var z = current.Z + offset[1];
				var id = key(x, z);
				var length = (offset[0] && offset[1] ? Math.SQRT2 : 1) * step;
				var a;
				var b;
				var grade;
				var price;

				if (closed[id] || Math.abs(x) > reach || Math.abs(z) > reach) return;

				a = height(current.X, current.Z);
				b = height(x, z);
				grade = Math.abs(b - a) / length;
				price = length * (1 + 25 * grade * grade + (grade > steep ? Math.pow(grade / steep, 4) * 4 : 0)) * (b < 0 || a < 0 ? bridge : 1);
				price += cost[key(current.X, current.Z)];

				if (cost[id] !== undefined && cost[id] <= price) return;

				cost[id] = price;
				came[id] = current;

				push({X: x, Z: z, F: price + guess(x, z)});
			});
		}

		if (!current || current.X !== goal[0] || current.Z !== goal[1]) return null;

		while (current) {
			path.unshift([current.X * step, current.Z * step]);

			current = came[key(current.X, current.Z)];
		}

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
		var open = [];
		var came = {};
		var cost = {};
		var closed = {};
		var key = function (point) {
			return point.X + ':' + point.Z;
		};
		var walk = function (x, z) {
			return field.Walkable(x, z, rules);
		};
		var current;
		var path = [];
		var visited = 0;
		var found = false;
		var neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		var straight;
		var far;
		var i;

		if (!walk(to.X, to.Z) || !walk(from.X, from.Z)) return null;

		function guess (point) {
			return Math.sqrt((point.X - goal.X) * (point.X - goal.X) + (point.Z - goal.Z) * (point.Z - goal.Z));
		}

		cost[key(start)] = 0;

		open.push({X: start.X, Z: start.Z, F: guess(start)});

		while (open.length && visited < limit) {
			open.sort(function (a, b) {
				return a.F - b.F;
			});

			current = open.shift();

			if (closed[key(current)]) continue;

			closed[key(current)] = true;
			visited++;

			if (current.X === goal.X && current.Z === goal.Z) {
				found = true;

				break;
			}

			neighbours.forEach(function (offset) {
				var next = {X: current.X + offset[0], Z: current.Z + offset[1]};
				var id = key(next);
				var length = offset[0] && offset[1] ? Math.SQRT2 : 1;
				var price;

				if (closed[id] || !walk(next.X * step, next.Z * step)) return;

				/* A diagonal does not cut the corner of what cannot be walked. */
				if (offset[0] && offset[1] && (!walk((current.X + offset[0]) * step, current.Z * step) || !walk(current.X * step, (current.Z + offset[1]) * step))) return;

				price = cost[key(current)] + length * (1 + field.Slope(next.X * step, next.Z * step) * 4);

				if (cost[id] !== undefined && cost[id] <= price) return;

				cost[id] = price;
				came[id] = current;

				open.push({X: next.X, Z: next.Z, F: price + guess(next)});
			});
		}

		if (!found)
			return null;

		while (current) {
			path.unshift({X: current.X * step, Z: current.Z * step});

			current = came[key(current)];
		}

		path[0] = {X: from.X, Z: from.Z};
		path[path.length - 1] = {X: to.X, Z: to.Z};

		/* Straight wherever it can be: from each point, to the farthest one the line to which can be walked. */
		function clear (a, b) {
			var length = Math.sqrt((b.X - a.X) * (b.X - a.X) + (b.Z - a.Z) * (b.Z - a.Z));
			var count = Math.max(1, Math.ceil(length / (step / 2)));
			var at;

			for (at = 1; at < count; at++) {
				if (!walk(a.X + (b.X - a.X) * at / count, a.Z + (b.Z - a.Z) * at / count)) return false;
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
			return {X: point.X, Y: Math.max(0, field.Height(point.X, point.Z)), Z: point.Z};
		});
	},

	/*
	 * A way over a field with a volume, over and under its ground: A* over points Step apart, each on a floor (Height(x, z,
	 * y) from the floor before it), a step taken only as a walker takes it (CanStep: up Climb at most and not too steep,
	 * down any drop, no rock where its body goes), no steeper than MaxSlope of the rules, not into the sea without Swim, nor
	 * where Blocked of the rules says; then made straight wherever a walker can go straight. from and to {X, Z, Y}: Y the
	 * height it is at, or none for the top of the ground. Gives [{X, Y, Z}] or null.
	 */
	WayUnder: function (field, from, to, rules) {
		var step = Number(rules.Step) || field.Size / 96;
		var limit = Number(rules.Limit) || 40000;
		var steepest = rules.MaxSlope === undefined || rules.MaxSlope === null ? null : Number(rules.MaxSlope);
		var half = field.Size / 2;
		var open = [];
		var came = {};
		var cost = {};
		var closed = {};
		var neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		var visited = 0;
		var found = null;
		var path = [];
		var straight;
		var start;
		var goal;
		var current;
		var far;
		var i;

		/* The floor a walker at y comes to at x, z, or null where it cannot. */
		function can (x, z, y) {
			var floor;
			var top;

			if (Math.abs(x) > half || Math.abs(z) > half || !field.CanStep(x, z, y)) return null;

			floor = field.Height(x, z, y);
			top = field.Height(x, z);

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

		cost[key(start)] = 0;

		open.push({X: start.X, Z: start.Z, Y: start.Y, F: guess(start)});

		while (open.length && visited < limit) {
			open.sort(function (a, b) {
				return a.F - b.F;
			});

			current = open.shift();

			if (closed[key(current)]) continue;

			closed[key(current)] = true;
			visited++;

			if (current.X === goal.X && current.Z === goal.Z && Math.abs(current.Y - goal.Y) < 2.5) {
				found = current;

				break;
			}

			neighbours.forEach(function (offset) {
				var y = can((current.X + offset[0]) * step, (current.Z + offset[1]) * step, current.Y);
				var next;
				var id;
				var price;

				if (y === null) return;

				next = {X: current.X + offset[0], Z: current.Z + offset[1], Y: y};
				id = key(next);

				if (closed[id]) return;

				/* A diagonal does not cut the corner of what cannot be walked. */
				if (offset[0] && offset[1] && (can((current.X + offset[0]) * step, current.Z * step, current.Y) === null || can(current.X * step, (current.Z + offset[1]) * step, current.Y) === null)) return;

				price = cost[key(current)] + Math.sqrt(offset[0] * offset[0] + offset[1] * offset[1] + (y - current.Y) * (y - current.Y) / (step * step)) * (1 + Math.max(0, y - current.Y) / step);

				if (cost[id] !== undefined && cost[id] <= price) return;

				cost[id] = price;
				came[id] = current;

				open.push({X: next.X, Z: next.Z, Y: y, F: price + guess(next)});
			});
		}

		if (!found)
			return null;

		current = found;

		while (current) {
			path.unshift({X: current.X * step, Y: current.Y, Z: current.Z * step});

			current = came[key(current)];
		}

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
		var noise = math.Noise();
		var radius = Number(settings.Radius) || 6371;
		var height = settings.Height === undefined ? radius * 0.0015 : Number(settings.Height);
		var seed = Number(settings.Seed) || 0;
		var ocean = Number(settings.Ocean) || 0;
		var type = settings.Type || 'rocky';
		var cratered = type === 'rocky' || type === 'desert' || type === 'dwarf' || type === 'moon';
		var field;

		/* The land of a direction: the very formula of the shader that bakes the surface (Bake of Scene). */
		function land (direction) {
			var p = math.Vectors.Normalize(direction);
			var q = [p[0] * 2.2 + seed, p[1] * 2.2 + seed * 0.7, p[2] * 2.2 + seed * 1.3];
			var h = noise.Fbm(q[0], q[1], q[2], 6);
			var value = ocean > 0 ? (h - ocean * 0.55 - 0.2) / Math.max(0.05, 0.8 - ocean * 0.55) : h;

			if (cratered && !(ocean > 0))
				value += (self.Smoothstep(0.86, 0.96, noise.Ridge(q[0] * 2.6 + 9, q[1] * 2.6 + 9, q[2] * 2.6 + 9, 3)) - 0.4) * 0.18;

			return value;
		}

		/*
		 * The height of the ground over the radius: the land of the noise, then what the surface baked from far does not
		 * show, mountains on the high land, hills and small bumps everywhere above the sea (the coasts stay where they are).
		 */
		function elevation (direction, value) {
			var p = math.Vectors.Normalize(direction);
			var q = [p[0] * 2.2 + seed, p[1] * 2.2 + seed * 0.7, p[2] * 2.2 + seed * 1.3];
			var base = ocean > 0 ? Math.max(0, value) * height : (value - 0.5) * height;
			var above = ocean > 0 ? self.Smoothstep(0, 0.05, value) : 1;
			var folds;

			if (!above)
				return base;

			folds = noise.Ridge(q[0] * 18 + 3, q[1] * 18, q[2] * 18, 4);

			return base + (folds * folds * self.Smoothstep(0.15, 0.6, value) * height * 0.9 + (noise.Fbm(p[0] * 260, p[1] * 260, p[2] * 260, 4) - 0.5) * height * 0.08 + (noise.Fbm(p[0] * 2600, p[1] * 2600, p[2] * 2600, 3) - 0.5) * height * 0.012) * above;
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

	Work: function () {
		return this.$Service('Workers').Pool('SceneTerrainGenerator', {Math: true, Noise: true, Random: true, Blueprints: true, ScenePlanet: true, SceneTerrainGenerator: true});
	},

	/*
	 * A sketch over a ground: what it changes of its heights and of its colors, made once. sketch {Layers: [{ID, Visible, Strength,
	 * Items}]}; each item {ID, Type, Strength} changes the height a point has after the items before it. base(x, z): the height of
	 * the ground under it. Gives {Height(x, z, h), Look(x, z) ({Palette, Weight, Color, Tint}: the colors of what it paints),
	 * Items: [{Item, Bounds: [x0, z0, x1, z1]}]}.
	 */
	Sketched: function (sketch, base, seed) {
		var self = this;
		var noise = this.$Service('Math').Noise('sketch-' + (seed || ''));
		var items = [];
		var looks = {road: [0.5, 0.42, 0.32], street: [0.46, 0.44, 0.42], square: [0.58, 0.55, 0.5], river: [0.36, 0.32, 0.26], beach: [0.8, 0.74, 0.56], swamp: [0.24, 0.27, 0.18], floodplain: [0.42, 0.45, 0.28], canyon: [0.6, 0.43, 0.3], cliff: [0.45, 0.42, 0.36], crater: [0.4, 0.37, 0.33], dunes: [0.82, 0.72, 0.5]};

		function number (value, fallback) {
			return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
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

		function levelAt (made, seen) {
			var i = seen.Segment;
			var span = made.Lengths[i + 1] - made.Lengths[i] || 1;
			var t = Math.max(0, Math.min(1, (seen.T * made.Lengths[made.Lengths.length - 1] - made.Lengths[i]) / span));

			return made.Levels[i] + (made.Levels[i + 1] - made.Levels[i]) * t;
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
			var i;

			if (item.Visible === false || !self.SketchTypes[item.Type]) return null;

			made.Kind = self.SketchTypes[item.Type];

			for (i = 1; i < made.Points.length; i++)
				lengths.push(lengths[i - 1] + Math.hypot(made.Points[i][0] - made.Points[i - 1][0], made.Points[i][1] - made.Points[i - 1][1]));

			made.Lengths = lengths;

			/* A circle is a point and its radius. */
			if (made.Kind === 'circle')
				made.Points = [[Number(item.At && item.At[0]) || 0, Number(item.At && item.At[1]) || 0]];

			made.Radius = number(item.Radius, item.Type === 'mountain' ? 60 : item.Type === 'crater' ? 25 : item.Type === 'stamp' ? number(item.Size, 50) / 2 : 8);
			made.Width = number(item.Width, {ridge: 20, valley: 20, canyon: 30, river: 6, road: 6, cliff: 3}[item.Type] || 10);
			made.Edge = number(item.Edge, 10);

			if (made.Kind === 'line' && made.Points.length < 2) return null;
			if (made.Kind === 'area' && made.Points.length < 3) return null;

			if (made.Kind === 'stroke') reach = made.Radius;
			else if (made.Kind === 'line') reach = made.Width / 2 + number(item.Bank, number(item.Shoulder, number(item.Reach, item.Type === 'cliff' ? 30 : 6)));
			else if (made.Kind === 'area') reach = made.Edge;
			else reach = made.Radius * (item.Type === 'crater' ? 1.4 : 1);

			if (item.Type === 'river' || item.Type === 'road' || item.Type === 'street')
				made.Levels = levels(made.Points, lengths, item.Type === 'river');

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
			});
			at = items.indexOf(made);

			made.Plan.Streets.forEach(function (street, index) {
				var road = build({ID: made.Item.ID + '/street-' + index, Type: 'street', Points: street.Points, Width: street.Width, Shoulder: 3}, made.Layer);
				if (road)
					items.splice(at + 1 + index, 0, road);
			});
		});

		/* What one item makes of the height h a point has: the height again; guard (0 to 1) holds it back under a mask. */
		function apply (made, x, z, h, guard) {
			var item = made.Item;
			var s = made.Strength * (1 - guard);
			var seen;
			var w;
			var target;

			if (made.Kind === 'stroke') {
				seen = along(made.Points.length > 1 ? made.Points : [made.Points[0], made.Points[0]], made.Points.length > 1 ? made.Lengths : [0, 0], x, z);
				w = fall(seen.Distance, made.Radius) * s;

				if (item.Type === 'raise')
					return h + number(item.Amount, 3) * w;

				if (item.Type === 'lower')
					return h - number(item.Amount, 3) * w;

				if (item.Type === 'flatten')
					return h + (number(item.Height, base(made.Points[0][0], made.Points[0][1])) - h) * w;

				target = (base(x + made.Radius * 0.5, z) + base(x - made.Radius * 0.5, z) + base(x, z + made.Radius * 0.5) + base(x, z - made.Radius * 0.5) + base(x, z)) / 5;

				return h + (target - h) * w;
			}

			if (made.Kind === 'line') {
				seen = along(made.Points, made.Lengths, x, z);

				if (item.Type === 'ridge') {
					w = fall(seen.Distance, made.Width / 2);
					w = Math.pow(w, 1 - number(item.Sharp, 0.3) * 0.7);

					return h + number(item.Height, 15) * w * s * (0.85 + 0.3 * noise.Fbm(x * 0.02, 0.5, z * 0.02, 3));
				}

				if (item.Type === 'valley')
					return h - number(item.Depth, 8) * fall(seen.Distance, made.Width / 2) * s;

				if (item.Type === 'canyon')
					return h - number(item.Depth, 25) * Math.pow(fall(seen.Distance, made.Width / 2), 0.25) * s;

				if (item.Type === 'cliff') {
					w = self.Smoothstep(-made.Width / 2, made.Width / 2, seen.Side * seen.Distance);

					return h + number(item.Height, 8) * w * fall(Math.max(0, seen.Distance - made.Width / 2) * (seen.Side > 0 ? 1 : 0), number(item.Reach, 30)) * s;
				}

				/* A river: its bed under the level of its way, flat across its width, its banks coming down to it. A road: level across. */
				target = levelAt(made, seen) - (item.Type === 'river' ? number(item.Depth, 2) : 0);
				w = seen.Distance <= made.Width / 2 ? 1 : fall(seen.Distance - made.Width / 2, number(item.Bank, number(item.Shoulder, 6)));

				return item.Type === 'river' ? h + (Math.min(h, target) - h) * w * s : h + (target - h) * w * s;
			}

			if (made.Kind === 'area') {
				w = areaWeight(made, x, z) * s;

				if (!w)
					return h;

				if (item.Type === 'plateau')
					return h + (number(item.Height, 20) - h) * w;

				/* A settlement on gentler ground, a square level. */
				if (item.Type === 'settlement' || item.Type === 'square') {
					target = (base(x + 20, z) + base(x - 20, z) + base(x, z + 20) + base(x, z - 20) + base(x, z)) / 5;

					return h + (target - h) * w * (item.Type === 'square' ? 1 : 0.7);
				}

				if (item.Type === 'basin')
					return h - number(item.Depth, 6) * w;

				if (item.Type === 'lake')
					return h + (Math.min(h, number(item.Level, -1.5) - number(item.Depth, 3) * w) - h) * w;

				if (item.Type === 'swamp')
					return h + (number(item.Level, 0.15) + noise.Fbm(x * 0.08, 1.7, z * 0.08, 3) * 0.8 - 0.4 - h) * w;

				if (item.Type === 'beach')
					return h + (Math.max(-2, Math.min(1.4, h)) * 0.5 - h) * w;

				if (item.Type === 'floodplain')
					return h + (number(item.Level, Math.min(h, 1.5)) + noise.Fbm(x * 0.03, 2.3, z * 0.03, 2) * 0.5 - 0.25 - h) * w;

				if (item.Type === 'erosion')
					return h - number(item.Amount, 4) * w * (1 - noise.Ridge(x * 0.04, 3.1, z * 0.04, 4));

				if (item.Type === 'dunes') {
					var way = number(item.Way, 70) * Math.PI / 180;
					var u = (x * Math.sin(way) + z * Math.cos(way)) / number(item.Length, 25);

					return h + number(item.Height, 3) * w * (0.5 + 0.5 * Math.sin(u * Math.PI * 2 + noise.Fbm(x * 0.01, 4.2, z * 0.01, 3) * 6)) * (0.6 + 0.4 * noise.Fbm(x * 0.03, 0.9, z * 0.03, 2));
				}

				if (item.Type === 'terraces') {
					var step = Math.max(0.2, number(item.Step, 3));
					var level = Math.floor(h / step);
					var part = h / step - level;

					return h + ((level + self.Smoothstep(0.75, 1, part)) * step - h) * w;
				}

				return h;
			}

			/* A circle: a mountain, a crater or a stamp. */
			seen = Math.hypot(x - made.Points[0][0], z - made.Points[0][1]);

			if (item.Type === 'mountain') {
				w = fall(seen, made.Radius);

				return h + number(item.Height, 60) * Math.pow(w, 1.2) * s * (1 - number(item.Ridged, 0.5) * 0.5 + number(item.Ridged, 0.5) * 0.5 * noise.Ridge(x * 0.012, 5.3, z * 0.012, 5));
			}

			if (item.Type === 'crater') {
				var r = seen / made.Radius;
				if (r > 1.4) return h;

				return h + s * (r < 1 ? -number(item.Depth, 8) * (1 - r * r) + number(item.Rim, 3) * self.Smoothstep(0.7, 1, r) : number(item.Rim, 3) * fall(r - 1, 0.4));
			}

			if (item.Type === 'stamp' && item.Data) {
				var turn = -number(item.Turn, 0) * Math.PI / 180;
				var lx = (x - made.Points[0][0]) * Math.cos(turn) - (z - made.Points[0][1]) * Math.sin(turn);
				var lz = (x - made.Points[0][0]) * Math.sin(turn) + (z - made.Points[0][1]) * Math.cos(turn);
				var got = sample({Bounds: [-made.Radius, -made.Radius, made.Radius, made.Radius], Side: item.Data.Side, Data: item.Data.Heights}, lx, lz);
				if (got === null) return h;

				w = fall(Math.max(Math.abs(lx), Math.abs(lz)) - made.Radius * 0.8, made.Radius * 0.2) * s;

				return h + (got * number(item.Height, 20) - h) * w;
			}

			return h;
		}

		return {
			Items: items,

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
				var i;

				for (i = 0; i < items.length; i++) {
					var made = items[i];
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
				var i;

				for (i = 0; i < items.length; i++) {
					var made = items[i];
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

	/* The kind of each type of item of a sketch. */
	SketchTypes: {
		raise: 'stroke', lower: 'stroke', flatten: 'stroke', smooth: 'stroke',
		ridge: 'line', valley: 'line', canyon: 'line', river: 'line', road: 'line', cliff: 'line',
		plateau: 'area', basin: 'area', lake: 'area', swamp: 'area', beach: 'area', floodplain: 'area', erosion: 'area', dunes: 'area', terraces: 'area', biome: 'area', mask: 'area',
		mountain: 'circle', crater: 'circle', stamp: 'circle',
		forest: 'area', meadow: 'area', clearing: 'area', bushes: 'area', thicket: 'area', jungle: 'area', sequoia: 'area', fields: 'area', orchard: 'area',
		row: 'line', fence: 'line', hedge: 'line', wall: 'line', powerline: 'line',
		marker: 'circle',
		settlement: 'area', street: 'line', square: 'area', district: 'area', citywall: 'line', landmark: 'circle',
		trigger: 'area', triggerpoint: 'circle', triggerline: 'line', zone: 'area', collider: 'area'
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
	 * Gives {Streets: [{Points, Width}], Lots: [{X, Z, Turn, Width, Depth, Class, District}], Walls: [[[x, z]...]], Gates: [{X, Z,
	 * Turn}], Towers: [{X, Z}]}.
	 */
	SettlementPlan: function (item, others, sizes) {
		var self = this;
		var kind = this.SettlementKinds[item.Kind] || this.SettlementKinds.village;
		var points = item.Points;
		var density = item.Density === undefined ? 0.85 : Number(item.Density);
		var random = this.$Service('Random').Sequence(String(item.Seed === undefined ? item.ID : item.Seed));
		var plan = {ID: item.ID, Kind: item.Kind || 'village', Streets: [], Lots: [], Walls: [], Gates: [], Towers: []};
		var center = [0, 0];
		var longest = 0;
		var angle = 0;

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

		/* The point of a line nearest to x, z: [x, z, distance]. */
		function nearest (line, x, z) {
			var best = [x, z, Infinity];
			var a;

			for (a = 0; a + 1 < line.length; a++) {
				var dx = line[a + 1][0] - line[a][0];
				var dz = line[a + 1][1] - line[a][1];
				var t = Math.max(0, Math.min(1, ((x - line[a][0]) * dx + (z - line[a][1]) * dz) / (dx * dx + dz * dz || 1)));
				var p = [line[a][0] + dx * t, line[a][1] + dz * t];
				var d = Math.hypot(p[0] - x, p[1] - z);
				if (d < best[2])
					best = [p[0], p[1], d];
			}

			return best;
		}

		function distance (line, x, z) {
			return nearest(line, x, z)[2];
		}

		/* How far a point is from the edge of the settlement. */
		function edge (x, z) {
			return distance(points.concat([points[0]]), x, z);
		}

		/* A line clipped to the settlement: the runs of it inside, by steps of four metres. */
		function clip (from, to) {
			var length = Math.hypot(to[0] - from[0], to[1] - from[1]);
			var steps = Math.max(1, Math.ceil(length / 4));
			var runs = [];
			var run = null;
			var s;

			for (s = 0; s <= steps; s++) {
				var p = [from[0] + (to[0] - from[0]) * s / steps, from[1] + (to[1] - from[1]) * s / steps];

				if (inside(points, p[0], p[1])) {
					run = run || [p, p];
					run[1] = p;
				}
				else if (run) {
					runs.push(run);
					run = null;
				}
			}

			if (run)
				runs.push(run);

			/* None along its very edge: the lots of it would be out of it. */
			return runs.filter(function (one) {
				var middle = [(one[0][0] + one[1][0]) / 2, (one[0][1] + one[1][1]) / 2];

				return Math.hypot(one[1][0] - one[0][0], one[1][1] - one[0][1]) > 8 && edge(middle[0], middle[1]) > width;
			});
		}

		if (!points || points.length < 3) return plan;

		points.forEach(function (point, index) {
			var next = points[(index + 1) % points.length];
			var length = Math.hypot(next[0] - point[0], next[1] - point[1]);

			center = [center[0] + point[0] / points.length, center[1] + point[1] / points.length];

			if (length > longest) {
				longest = length;
				angle = Math.atan2(next[1] - point[1], next[0] - point[0]);
			}
		});

		var block;
		var width = Math.max(3, Number(item.Street) || kind.Street);
		var along = [Math.cos(angle), Math.sin(angle)];
		var across = [-along[1], along[0]];
		var reach = 0;

		points.forEach(function (point) {
			reach = Math.max(reach, Math.hypot(point[0] - center[0], point[1] - center[1]));
		});

		/* The step of its streets: of its kind, but a small one has a few blocks all the same. */
		block = Math.max(15, Number(item.Block) || Math.min(kind.Block, reach * 0.45));

		/* The streets drawn in it, else its own. */
		var drawn = others.filter(function (other) {
			return other.Type === 'street' && other.Points && other.Points.some(function (point) {
				return inside(points, point[0], point[1]);
			});
		});

		if (drawn.length) {
			plan.Streets = drawn.map(function (other) {
				return {Points: other.Points, Width: Number(other.Width) || width};
			});
		}
		else if (kind.Grid) {
			var k;

			for (k = -Math.ceil(reach / block); k <= Math.ceil(reach / block); k++) {
				[[along, across], [across, along]].forEach(function (axes) {
					var o = [center[0] + axes[1][0] * k * block, center[1] + axes[1][1] * k * block];

					clip([o[0] - axes[0][0] * reach, o[1] - axes[0][1] * reach], [o[0] + axes[0][0] * reach, o[1] + axes[0][1] * reach]).forEach(function (run) {
						plan.Streets.push({Points: run, Width: k === 0 ? width * 1.3 : width});
					});
				});
			}
		}
		else {
			clip([center[0] - along[0] * reach, center[1] - along[1] * reach], [center[0] + along[0] * reach, center[1] + along[1] * reach]).forEach(function (run) {
				plan.Streets.push({Points: run, Width: width});
			});

			/* Lanes off the main street, to one side and the other by turns. */
			var lane;

			for (lane = -Math.floor(reach / block * 2); lane <= Math.floor(reach / block * 2); lane++) {
				var side = lane % 2 ? 1 : -1;
				var root = [center[0] + along[0] * lane * block * 0.5, center[1] + along[1] * lane * block * 0.5];

				if (!lane) continue;

				clip(root, [root[0] + across[0] * side * block * 0.9, root[1] + across[1] * side * block * 0.9]).forEach(function (run) {
					plan.Streets.push({Points: run, Width: width * 0.75});
				});
			}
		}

		var squares = others.filter(function (other) {
			return other.Type === 'square' && other.Points && other.Points.length > 2;
		});

		/*
		 * The other ways of the sketch through it (roads, streets not its own, rivers, railways): no lot stands on them. Its own
		 * streets made roads of the scene (SceneScatter: road street-<its ID>-<n>) and where only they meet are its streets.
		 */
		function own (other) {
			var mine = 'street-' + item.ID + '-';
			if (String(other.Road || '').indexOf(mine) === 0) return true;

			return !!(other.Roads && other.Roads.length) && other.Roads.every(function (road) {
				return String(road).indexOf(mine) === 0;
			});
		}

		var ways = others.filter(function (other) {
			return other !== item && (other.Type === 'road' || other.Type === 'street' || other.Type === 'river' || other.Type === 'railway' || other.Type === 'canyon') && other.Points && other.Points.length > 1 && !own(other);
		});
		var districts = others.filter(function (other) {
			return other.Type === 'district' && other.Points && other.Points.length > 2;
		});

		function classes (x, z) {
			var district = districts.filter(function (other) {
				return inside(other.Points, x, z);
			})[0];
			var near = Math.hypot(x - center[0], z - center[1]) / Math.max(1, reach);

			if (district)
				return {District: district.Kind || 'residential', Weights: self.SettlementDistricts[district.Kind] || self.SettlementDistricts.residential};

			return {District: '', Weights: kind.Core && near < 0.35 ? kind.Core : kind.Classes};
		}

		function pick (weights) {
			var names = Object.keys(weights);
			var total = names.reduce(function (sum, name) {
				return sum + weights[name];
			}, 0);
			var roll = random() * total;
			var n;

			for (n = 0; n < names.length; n++) {
				roll -= weights[names[n]];

				if (roll <= 0)
					return names[n];
			}

			return names[names.length - 1];
		}

		/* Lots along both sides of each street: a building of its place, its front to the street, a little set back. */
		plan.Streets.forEach(function (street) {
			var line = street.Points;
			var a;

			for (a = 0; a + 1 < line.length; a++) {
				var dx = line[a + 1][0] - line[a][0];
				var dz = line[a + 1][1] - line[a][1];
				var length = Math.hypot(dx, dz);
				var unit = [dx / length, dz / length];

				[1, -1].forEach(function (side) {
					var walked = 4;

					while (walked < length - 4) {
						var at = [line[a][0] + unit[0] * walked, line[a][1] + unit[1] * walked];
						var probe = classes(at[0], at[1]);
						var name = pick(probe.Weights);
						var size = name ? sizes(name) : null;
						var normal = [-unit[1] * side, unit[0] * side];
						var x;
						var z;
						var free;

						if (!size) {
							walked += 12;

							continue;
						}

						/* A lot left empty, as the density tells. */
						if (random() >= density) {
							walked += size[0] + 3;

							continue;
						}

						x = at[0] + unit[0] * size[0] / 2 + normal[0] * (street.Width / 2 + 2 + size[1] / 2);
						z = at[1] + unit[1] * size[0] / 2 + normal[1] * (street.Width / 2 + 2 + size[1] / 2);

						/* All of it inside the settlement, off its squares, its streets and the other lots. */
						free = [[-1, -1], [1, -1], [1, 1], [-1, 1]].every(function (corner) {
							return inside(points, x + unit[0] * corner[0] * size[0] / 2 + normal[0] * corner[1] * size[1] / 2, z + unit[1] * corner[0] * size[0] / 2 + normal[1] * corner[1] * size[1] / 2);
						}) && !squares.some(function (other) {
							return inside(other.Points, x, z);
						}) && plan.Streets.every(function (other) {
							return distance(other.Points, x, z) > other.Width / 2 + Math.min(size[0], size[1]) / 2;
						}) && plan.Lots.every(function (lot) {
							return Math.hypot(lot.X - x, lot.Z - z) > (Math.max(lot.Width, lot.Depth) + Math.max(size[0], size[1])) * 0.42;
						}) && ways.every(function (other) {
							var room = (Number(other.Width) || 6) / 2 + (Number(other.Shoulder) || 1.5);

							/* Its middle, its corners and the middles of its sides all off the way. */
							return [[0, 0], [-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].every(function (corner) {
								return distance(other.Points, x + unit[0] * corner[0] * size[0] / 2 + normal[0] * corner[1] * size[1] / 2, z + unit[1] * corner[0] * size[0] / 2 + normal[1] * corner[1] * size[1] / 2) > room;
							});
						});

						/* No room for it: a few metres on, maybe a smaller one fits there. */
						if (!free) {
							walked += 4;

							continue;
						}

						plan.Lots.push({X: x, Z: z, Turn: Math.atan2(-normal[0], -normal[1]), Width: size[0], Depth: size[1], Class: name, District: probe.District});

						walked += size[0] + 3;
					}
				});
			}
		});

		/*
		 * A fort: walls round it, its gates on them where its streets go out, the way through them along the street, a tower at each
		 * corner.
		 */
		if (kind.Walls || item.Walls) {
			var ring = points.concat([points[0]]);

			plan.Walls.push(ring);

			points.forEach(function (point) {
				plan.Towers.push({X: point[0], Z: point[1]});
			});

			plan.Streets.forEach(function (street) {
				var line = street.Points;
				var last = line.length - 1;

				[[line[0], line[1]], [line[last], line[last - 1]]].forEach(function (end) {
					var on = nearest(ring, end[0][0], end[0][1]);
					if (on[2] < 6)
						plan.Gates.push({X: on[0], Z: on[1], Turn: Math.atan2(end[0][0] - end[1][0], end[0][1] - end[1][1])});
				});
			});
		}

		return plan;
	},

	/*
	 * The items of a sketch that place things (the Scatter of a Scene sows them) and change no height: a trigger and a zone
	 * of the game are objects of the scene.
	 */
	SketchPlaced: {forest: true, meadow: true, clearing: true, bushes: true, thicket: true, jungle: true, sequoia: true, fields: true, orchard: true, row: true, fence: true, hedge: true, wall: true, powerline: true, marker: true, district: true, citywall: true, landmark: true, trigger: true, triggerpoint: true, triggerline: true, zone: true, collider: true},

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

		field = this.Field(shape === 'SpherePicture' || shape === 'SphereThings' ? 'Sphere' : shape, options, named);

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

		/* The picture of a square of a globe alone (a face made at once, its picture after). */
		if (shape === 'SpherePicture')
			return {Picture: field.Picture ? field.Picture(args[0], args[1], args[2], args[3], args[4]) : null};

		field.Roads = roads || null;

		return typed(field.Chunk(args[0], args[1], args[2], args[3]));
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
	Carried: ['TunnelRadius', 'GroundMaterials', 'LookMaterials', 'SketchTypes', 'SketchPlaced', 'SettlementSizes', 'SettlementKinds', 'SettlementDistricts'],

	Source: function (names) {
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
	 * (a ground that paints itself), and in Materials (8 a point) where each is on the square, 0 to 1, for its picture
	 * (PatchPicture). A skirt under its edges hides what a finer square beside leaves between them.
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
				geometry.Materials.push(column / resolution, row / resolution, 0, 0, 0, 0, 0, 0);

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
			geometry.Materials.push.apply(geometry.Materials, geometry.Materials.slice(index * 8, index * 8 + 8));

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
