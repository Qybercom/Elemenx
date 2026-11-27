/*
 * ScenePlanet: a planet as one continuous function of a direction from its centre, the same at any distance: the globe
 * of the space of a Scene, the map an editor paints and each location of its surface read the very same numbers, so a
 * coast seen from orbit is the coast walked on. Nothing is baked: a point is reckoned when it is asked for, as fine as
 * it is asked.
 * - Make(options): a planet of options {Radius (km, 6371), Seed, Ocean (the part of it under the sea, 0.65), Relief
 *   (metres of its highest mountains, 8000), Mountains (how mountainous, 0 to 1: a flat world, the Earth at 0.5, ranges
 *   everywhere at 1), Depth (metres of its deepest sea, 6000), Plates (how many tectonic plates,
 *   14), Detail (km: the finest the coasts are told by the globe; finer, the land and the sea are never turned one into
 *   the other, 2), Paint (what a developer drew, below), Biomes (names of SceneBiomes, the usual nine: temperate, taiga, tundra, desert, savanna, swamp, rainforest, semidesert, steppe), Baked (the
 *   grounds of locations baked into it, SceneLocations.Bake: {ID: {Latitude, Longitude, Turn, Size, Side, Heights, Edge}};
 *   there its heights are theirs, edits and all, its own again over Edge metres at their edge)}. It gives
 *   {Options, Radius, Sample(direction, finest), Elevation(direction, finest) (finest: km, the finest asked; all by default), Land(direction), Plate(direction), Wind(direction),
 *   Climate(direction), Biome(direction), Point(direction), Direction(latitude, longitude), LatLon(direction), Slope(direction,
 *   reach) (how steep its ground is, rise over run of reach km, 0.3; 0 over the sea)}.
 *   Sample gives all of a point at once: {Direction (its unit direction), Elevation (metres over the sea), Land (true over it), Plate {ID, Oceanic,
 *   Boundary (km to the next plate), Push (how the two meet: over 0 they close, mountains and trenches; under 0 they part,
 *   rifts and ridges)}, Wind [east, north] (m/s), Celsius, Temperature and Moisture (0 to 1), Biome (a name; '' under the
 *   sea)}.
 * - Paint: strokes over the globe, each of points [latitude, longitude] in degrees: land and sea (areas: Points, Edge km:
 *   continents and oceans where they are drawn), mountains (a line: Width km, Height metres), rift (a line: Width, Depth),
 *   river (a line: Width km), climate (an area: Temperature in °C more or less, Moisture more or less, Edge) and biome (an
 *   area: Biome, Edge).
 * - Rules (of detail): {Biomes: {biome: rule, '*': any land}, Graphs: {name: a generator graph of its own}, Parameters:
 *   {rule: values}, Scale (km, 20)} and Regions [{Rule, Points, Edge}] (areas painted, over the rule of their land): what
 *   is finer than Scale is the detail of the rule of the place (a generator of Blueprints: inputs X, Y, Z, East, North
 *   (km), Height (its coarse height), Scale, Finest, Latitude, Celsius, Temperature, Moisture, WindEast, WindNorth, River;
 *   result Height, metres) in the place of its own; generated (no rule) is its own. The rules of the library are
 *   resources <Library>/rules/<name> (ScenePlanet.Rules: hills, mountains, dunes, mesas, badlands, plains, volcanoes,
 *   craters, glacial, karst); Ruled(options) makes their code in the page for the workers.
 * - Its land and its relief are graphs of Blueprints, blueprints/planet/land (inputs PX, PY, PZ, Oceanic, Level, WLand,
 *   WSea, Octaves, SShape; result Land) and blueprints/planet/relief (inputs the point, its east and north EX.. NX.., Land,
 *   Boundary, Push, Oceanic, Small (km, the finest asked: what is finer is skipped by When), Relief, Mountains, Depth,
 *   Radius, Octaves, PaintRaise, PaintRift, PaintRiver and the shifts of its noises SFolds.. SGrain; result Height,
 *   metres, before its rivers, edits and locations). Its climate (of options; its data keeps its own) is of three more:
 *   blueprints/planet/wind (inputs the point, Band, degrees of latitude, Latitude, radians, SWeather; results East and
 *   North, m/s), blueprints/planet/rough (its land roughly where the wind comes from, of fewer octaves: the point,
 *   Oceanic, Level, WLand, WSea, SShape; result Rough) and blueprints/planet/climate (the point, Latitude, Band, Height,
 *   Upwind, of the lands and seas six samples up the wind, PaintTemperature, PaintMoisture, SWeather; results Celsius and
 *   Moisture). LandGraph, ReliefGraph, RoughGraph, WindGraph and ClimateGraph: graphs of its own; ReliefRun(name) the
 *   library's as a function {Main, Inputs, Keys}, ReliefMake(graph) the code of one {Source, Inputs, Keys},
 *   ReliefOf(name, graph, code) its function; GraphSources(options) the code of its own (ReliefSources) for the workers, as
 *   Ruled(options) and SceneTerrainGenerator.Site give it them. The picture of a square of its far ground (PatchPicture)
 *   is of blueprints/shader/ground-far (GroundFarGraph: one of its own; PictureRun(graph, code), PictureMake(graph)).
 *   Its plates are of blueprints/planet/plate (inputs Index, Count, Seed, Ocean; results MX, MY, MZ, its middle, VX, VY, VZ, its motion, Oceanic: of seven numbers of its seed,
 *   Blueprints.Chain), PlateGraph one of its own: PlateOf(graph, source) its function (Code: of a text, not of numbers).
 *   Its rivers are of blueprints/network/rivers (a network graph of NetworkBlueprints: the ways of DrainageWays smoothed and
 *   rounded), RiversGraph one of its own: RiversSourceOf(options) its code for the workers that drain it.
 * - Edits: what was changed of its relief after it was made, brushes along a path, in their order: [{Type (raise, lower,
 *   flatten, smooth), Points [[latitude, longitude]...], Radius (km), Amount (metres; of smooth 0 to 1), Height (metres,
 *   of flatten)}]; the nearer the path the more, none past Radius. Paint makes the planet, Edits change what it made.
 * - Project(view, direction) and Unproject(view, x, y): a globe in a view {Yaw, Pitch, Zoom, Width, Height}; Picture(options,
 *   view, rect, step, overlay) a piece of its picture (RGBA), each pixel reckoned of the planet, so it is sharp however near:
 *   overlay relief, plates, wind, temperature, moisture or biomes (Color); Work() the workers that paint it.
 * - Sphere(options): its ground as SceneTerrainGenerator.Sphere gives one (Land, Elevation, Point, Altitude, Patch with the
 *   colors of the globe): what a Scene lands on and draws near, square by square, as fine as the eye needs.
 * - Cells, CellAt, CellOf, CellCenter, CellCorners, CellNeighbours, CellPlace: the locations of a planet as cells, squares of
 *   the faces of a cube or hexagons of an icosahedron (12 of them pentagons), each a place for the step Planet of a World
 *   (its latitude, longitude, turn, size, outline and sides).
 * - Data (a key of UseData): a planet of data (PlanetData): as coarse as its tiles, its heights and biomes of them; finer,
 *   the relief and the lands of the options it was made of, its Edit over the relief; its climate and plates of its tiles
 *   (Climate, Plate) as coarse as they are; its rivers, settlements and highways of its vectors unless they are given
 *   (DataVectors(key): their keys; Vectored(options): options with them; TownsFor(options): its settlements). UseData(key,
 *   data), DataOf(key), TileName, TileDirection, TilePlace (the tiles on the faces of the cube, by equal angles) and
 *   TileValues (the samples of a tile, what PlanetData.Bake makes).
 * - Defaults and Rivers: the settings of a planet made of none and the numbers of its rivers (resources/planet).
 *   Kind(kind): the numbers of a kind of settlement on a planet (Share, Apart, Core, Fields, Lights, Glow, Use);
 *   SurfaceType(type): the type of a surface of bodies (resources/planet/surface-types: {Shader, Giant}); Giant(type): one of
 *   gas, no ground to land on.
 *   KindByShare(share): the kind of a place by its share of all of them, the best first; Warmth(celsius): the warmth
 *   of a temperature, 0 at -25 degrees to 1 at 35, what its lands are chosen by.
 * The same functions run in workers and in Node: they read no page.
 */
Elemenx.Service('ScenePlanet', {
	$Meta: {
		Description: 'A planet as one continuous function of a direction: painted continents, tectonic plates, winds, climate and biomes, as fine as it is asked.',
		Methods: ['Make(options)', 'Direction(latitude, longitude)', 'LatLon(direction)', 'Kinds()', 'Project(view, direction)', 'Unproject(view, x, y)', 'ViewTurn(yaw, pitch, roll)', 'Map(options, rows, width, height, overlay)', 'Planet(options)', 'Color(planet, sample, overlay, light)', 'Picture(options, view, rect, step, overlay)', 'Face(options, face, size, row, rows)', 'Heights(options, face, size, row, rows)', 'Drainage(heights, size, least, source)', 'DrainageWays(heights, size, least)', 'RiversSourceOf(options)', 'UseRivers(key, rivers)', 'UseData(key, data)', 'AddTiles(key, names)', 'DataOf(key)', 'Ruled(options)', 'DataVectors(key)', 'Vectored(options)', 'TownsFor(options)', 'TileName(layer, face, level, x, y)', 'TileDirection(face, s, t)', 'TilePlace(direction)', 'TileValues(options, layer, face, level, x, y, size, table)', 'Settlements(options, count)', 'PlacedTowns(options, towns)', 'PlacedRivers(options, rivers)', 'UseSettlements(key, towns)', 'Highways(options, step, part, parts)', 'MergeHighways(pieces)', 'UseHighways(key, roads)', 'Lights(options, face, size, row, rows)', 'Sphere(options)', 'Cells(radius, size, kind)', 'CellAt(radius, size, direction, kind)', 'CellOf(id)', 'CellPoint(cell, a, b)', 'CellCenter(cell)', 'CellCorners(cell)', 'CellNeighbours(radius, size, cell)', 'CellPlace(radius, cell)', 'Work()', 'Source(names)', 'ReliefRun(name)', 'PictureRun(graph, code)', 'PictureMake(graph)', 'ReliefMake(graph)', 'ReliefOf(name, graph, code)', 'GraphSources(options)', 'Kind(kind)', 'KindByShare(share)', 'Warmth(celsius)', 'SurfaceType(type)', 'Giant(type)']
	},

	/* The kinds of strokes of a paint. */
	Kinds: function () {
		return ['land', 'sea', 'mountains', 'rift', 'river', 'climate', 'biome'];
	},

	/* A direction of a latitude and a longitude in degrees: Y to the north pole, longitude 0 on +X, 90 on -Z. */
	Direction: function (latitude, longitude) {
		var phi = latitude * Math.PI / 180;
		var lambda = longitude * Math.PI / 180;

		return [Math.cos(phi) * Math.cos(lambda), Math.sin(phi), -Math.cos(phi) * Math.sin(lambda)];
	},

	LatLon: function (direction) {
		var length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]) || 1;

		return [Math.asin(Math.max(-1, Math.min(1, direction[1] / length))) * 180 / Math.PI, Math.atan2(-direction[2], direction[0]) * 180 / Math.PI];
	},

	Make: function (options) {
		var self = this;
		/* A planet of data (Data: a key of UseData): its options as it was made, its radius and its seed, under what is given. */
		var data = options && options.Data !== undefined && options.Data !== null && options.Data !== '' ? this.DataOf(options.Data) : null;
		var origin = data && data.Manifest.Origin && data.Manifest.Origin.Kind === 'generated' ? data.Manifest.Origin.Options || {} : null;
		/* Its rivers, settlements and highways are those of its data (vectors), unless they are given. */
		var given = data ? Object.assign({}, origin, {Radius: data.Manifest.Radius, Seed: data.Manifest.Seed}, this.DataVectors(options.Data), data.Edits ? {Edits: data.Edits.Edits || [], Baked: data.Edits.Baked || {}, Regions: data.Edits.Regions || []} : {}, options) : options || {};
		var defaults = this.Defaults;
		var radius = Number(given.Radius) || defaults.Radius;
		var seed = given.Seed === undefined ? defaults.Seed : String(given.Seed);
		var ocean = given.Ocean === undefined ? defaults.Ocean : Number(given.Ocean);
		var relief = Number(given.Relief) || defaults.Relief;
		/* How mountainous (0 flat, 0.5 as the Earth, 1 ranges everywhere): how much of the land its chains take, how high and sharp. */
		var mountains = given.Mountains === undefined || given.Mountains === null || given.Mountains === '' ? defaults.Mountains : Math.max(0, Math.min(1, Number(given.Mountains) || 0));
		var depth = Number(given.Depth) || defaults.Depth;
		var detail = Number(given.Detail) || defaults.Detail;
		var count = Math.max(2, Math.round(Number(given.Plates) || defaults.Plates));
		/* Octaves of the coasts: from a feature of a quarter of the planet down to Detail. */
		var octaves = Math.max(3, Math.min(16, Math.ceil(Math.log(radius * 1.5 / detail) / Math.LN2)));
		/*
		 * Its land and its relief, the graphs blueprints/planet/land and relief, and its climate, rough, wind and climate
		 * (LandGraph.. ClimateGraph: its own; ReliefSources: their code made in the page, Ruled): an uplift of whole regions,
		 * chains of ranges where it rises, hills and detail down to tens of metres, rougher the higher and steeper the land.
		 * Each called with the very same list, only what changes set.
		 */
		var reliefs = {};
		var slots = {};
		var outs = {};
		var args = {};

		this.ReliefNames.forEach(function (name) {
			reliefs[name] = name === 'Upwind' ? self.UpwindOf(given) : self.ReliefOf(name.toLowerCase(), given[name + 'Graph'], given.ReliefSources && given.ReliefSources[name]);
		});

		/* Its lands: BiomeList when given (a worker has no registry of them), else of their names. */
		var biomes = this.$Service('SceneTerrainGenerator').Biomes(given.BiomeList ? {BiomeList: given.BiomeList} : {Biomes: given.Biomes || this.$Service('SceneTerrainGenerator').DefaultBiomes});
		var strokes = (given.Paint || []).map(function (stroke) {
			return Object.assign({}, stroke, {Directions: (stroke.Points || []).map(function (point) {
				return self.Direction(Number(point[0]), Number(point[1]));
			})});
		});
		/*
		 * What was drawn packed once for the kernel of Geometry (its numbers of resources/planet/paint): its land and its sea
		 * (Painted), its ranges, rifts and rivers (Strokes); its climates and lands each its own (Painted of one area).
		 */
		var drawn = {Land: self.PaintedOf(strokes, 'land', radius), Sea: self.PaintedOf(strokes, 'sea', radius), Mountains: self.StrokesOf(strokes, 'mountains', radius), Rift: self.StrokesOf(strokes, 'rift', radius), River: self.StrokesOf(strokes, 'river', radius)};
		var areas = strokes.filter(function (stroke) {
			return stroke.Type === 'climate' || stroke.Type === 'biome';
		}).map(function (stroke) {
			return {Stroke: stroke, Packed: self.PaintedOf([stroke], stroke.Type, radius)};
		});
		/*
		 * Its edits (Edits): what was changed of its relief after it was made, by brushes along a path: [{Type (raise, lower,
		 * flatten, smooth), Points [[latitude, longitude]...], Radius (km), Amount (metres; of smooth, how much, 0 to 1),
		 * Height (metres, of flatten)}], in their order. Each with the cap of the globe it reaches, to skip it at once.
		 */
		var edits = (given.Edits || []).map(function (edit) {
			var points = (edit.Points || []).map(function (point) {
				return self.Direction(Number(point[0]), Number(point[1]));
			});
			var middle = normalize(points.reduce(function (sum, point) {
				return [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]];
			}, [0, 0, 0]));
			var reach = Math.max(1, Number(edit.Radius) || 100) / radius;
			var cap = 0;

			points.forEach(function (point) {
				cap = Math.max(cap, Math.acos(Math.max(-1, Math.min(1, dot(point, middle)))));
			});

			return {Type: edit.Type, Points: points, Reach: reach, Amount: Number(edit.Amount) || 0, Height: Number(edit.Height) || 0, Middle: middle, Cap: Math.cos(Math.min(Math.PI, cap + reach))};
		}).filter(function (edit) {
			return edit.Points.length > 0;
		});
		var smoothing = false;
		/* Its brushes packed for the graph of its edits (blueprints/planet/edit, Geometry.Edits), each where it is in them (At). */
		var brushes = [edits.length];

		edits.forEach(function (edit) {
			edit.At = brushes.length;

			brushes.push(['raise', 'lower', 'flatten', 'smooth'].indexOf(edit.Type), edit.Points.length, edit.Reach, edit.Amount, edit.Height, edit.Middle[0], edit.Middle[1], edit.Middle[2], edit.Cap);

			edit.Points.forEach(function (point) {
				brushes.push(point[0], point[1], point[2]);
			});
		});

		/*
		 * Its rules of detail (Rules {Biomes: {biome: rule; '*' for any land}, Graphs: {name: a generator graph of its own},
		 * Parameters: {rule: values}, Scale: km, 20}, and its Regions [{Rule, Points, Edge km}] painted over it): what is finer
		 * than Scale is made by the rule of the place, in the place of the relief it was made with; the rule generated is that
		 * relief. A region painted wins over the land it is on, the later over the earlier, softly over its Edge.
		 */
		var rules = given.Rules || {};
		var mapping = rules.Biomes || {};
		var scale = Math.max(0.05, Number(rules.Scale) || 20);
		var regions = (given.Regions || []).map(function (region) {
			var points = (region.Points || []).map(function (point) {
				return self.Direction(Number(point[0]), Number(point[1]));
			});
			var middle = normalize(points.reduce(function (sum, point) {
				return [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]];
			}, [0, 0, 0]));
			var cap = 0;

			points.forEach(function (point) {
				cap = Math.max(cap, Math.acos(Math.max(-1, Math.min(1, dot(point, middle)))));
			});

			return {Rule: String(region.Rule || 'generated'), Edge: region.Edge, Directions: points, Middle: middle, Cap: Math.cos(Math.min(Math.PI, cap + Math.max(1, Number(region.Edge) || self.Paint.Area.Edge) / radius)), Packed: self.PaintedOf([{Type: 'region', Edge: region.Edge, Directions: points}], 'region', radius)};
		}).filter(function (region) {
			return region.Directions.length > 2;
		});
		var ruled = Object.keys(mapping).length > 0 || regions.length > 0;
		var ruling = false;
		var bare = false;
		var runs = {};
		/*
		 * The locations baked into it (Baked {ID: {Latitude, Longitude, Turn, Size, Side, Heights}}): the heights of their
		 * grounds as they were made and edited, a square of Size metres on the plane touching the planet at their middle,
		 * Side by Side, row by row along Z: there the planet is that ground, coming back to its own over the edge of it.
		 */
		var bakes = Object.keys(given.Baked || {}).map(function (id) {
			var bake = given.Baked[id];
			var middle = self.Direction(Number(bake.Latitude) || 0, Number(bake.Longitude) || 0);
			var axes = self.Tangent(middle);
			var turn = (Number(bake.Turn) || 0) * Math.PI / 180;
			var half = (Number(bake.Size) || 0) / 2;

			return {Middle: middle, East: axes.East, North: axes.North, Cos: Math.cos(turn), Sin: Math.sin(turn), Half: half, Edge: Math.min(half * 0.5, Number(bake.Edge) || 240), Side: Math.max(2, Number(bake.Side) || 2), Heights: bake.Heights || [], Reach: Math.cos(half * 1.5 / (radius * 1000))};
		}).filter(function (bake) {
			return bake.Half > 0 && bake.Heights.length >= bake.Side * bake.Side;
		});
		/*
		 * Its rivers (Rivers of Drainage: [{Points (directions), Flow (cells of 39 km drained there), Level (metres of its
		 * bed)}]): each segment kept in the squares of a coarse grid of the cube round its ends, for a point to find the near
		 * ones at once.
		 */
		var streams = [];
		var buckets = {};
		/* The segments of each cell packed as numbers (Geometry.River), made once when the rivers are. */
		var packs = {};
		/*
		 * The courses of its rivers: their points (a tributary's last on the river it joins), and along each point the
		 * kilometres from its source (Along) and the phase of its bends (Phase, of their length there, as wide as it is);
		 * Joins, the kilometres of it where tributaries come in, Into, that it ends in another (see bendOf).
		 */
		var courses = [];
		var riversMade = false;
		var riversMaking = false;

		/*
		 * Its rivers made the first time one is asked for, once all of the planet is (the arms of its deltas end where its
		 * sea is: of its relief, which its rivers do not change into sea); while they are made, it has none.
		 */
		function rivers () {
			if (riversMade || riversMaking) return;

			riversMaking = true;

			/* What a developer changed of them laid over them (Places): a river drawn has the levels of the ground under it. */
			courses = self.PlacedRivers(given, Array.isArray(given.Rivers) ? given.Rivers : given.Rivers ? self.RiversOf(given.Rivers) : []).map(function (river, index) {
				return {Points: (river.Points || []).slice(), Flow: river.Flow || [], Level: river.Level && river.Level.length ? river.Level : (river.Points || []).map(function (point) {
					return Math.max(0, raise(point).Height);
				}), Along: [], Phase: [], Joins: [], Into: false, From: null, Seed: index, Segments: []};
			});

			courses = courses.concat(deltasOf(courses));

			/*
		 * The deltas of its great rivers (at least 300 cells drained, to the sea, its bed under 100 m some way up): three to
		 * five arms out of its way some 20 to 60 km before its mouth, fanned out to the sea on either side of it, each a
		 * river of its own (From: the river and the point of it they leave), the same for the same river.
		 */
			function deltasOf (rivers) {
				var made = [];

				rivers.forEach(function (river, index) {
					var points = river.Points;
					var last = points.length - 1;
					var flow = river.Flow[last] || 0;
					var lengths = [0];
					var total;
					var back;
					var k;

					if (last < 2 || river.Level[last] > 0 || flow < 300) return;

					for (k = 1; k <= last; k++)
						lengths.push(lengths[k - 1] + Math.sqrt(dot([points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1], points[k][2] - points[k - 1][2]], [points[k][0] - points[k - 1][0], points[k][1] - points[k - 1][1], points[k][2] - points[k - 1][2]])) * radius);

					total = lengths[last];
					back = Math.min(60, Math.max(20, total * 0.15));

					/* Where its arms leave it: back km up from its mouth, in the segment that holds it. */
					k = last;

					while (k > 1 && total - lengths[k - 1] < back)
						k--;

					var share = (total - back - lengths[k - 1]) / Math.max(1e-9, lengths[k] - lengths[k - 1]);
					var from = normalize([points[k - 1][0] + (points[k][0] - points[k - 1][0]) * share, points[k - 1][1] + (points[k][1] - points[k - 1][1]) * share, points[k - 1][2] + (points[k][2] - points[k - 1][2]) * share]);
					var level = river.Level[k - 1] + (river.Level[k] - river.Level[k - 1]) * share;
					var mouth = points[last];
					var way = normalize([mouth[0] - from[0], mouth[1] - from[1], mouth[2] - from[2]]);
					var across = normalize(cross(mouth, way));
					var arms = flow > 1000 ? 5 : flow > 600 ? 4 : 3;
					var random = self.$Service('Random').Sequence('delta:' + index);
					var a;

					if (level > 100) return;

					for (a = 0; a < arms; a++) {
					/* Fanned out: from one side of the mouth to the other, back km wide, a little toward the sea past it. */
						var aside = (a / (arms - 1) - 0.5) * back * 1.1 * (0.8 + random() * 0.4) / radius;
						var ahead = back * (0.15 + random() * 0.2) / radius;
						var to = normalize([mouth[0] + across[0] * aside + way[0] * ahead, mouth[1] + across[1] * aside + way[1] * ahead, mouth[2] + across[2] * aside + way[2] * ahead]);
						var bend = (random() - 0.5) * back * 0.25 / radius;
						var middle = normalize([(from[0] + to[0]) / 2 + across[0] * bend, (from[1] + to[1]) / 2 + across[1] * bend, (from[2] + to[2]) / 2 + across[2] * bend]);
						var arm = self.Smoothed([from, middle, to], [flow * 0.35, flow * 0.35, flow * 0.35], [level, level * 0.4, 0]);
						var end = arm.Points.length;
						var j;

						/* Ended where it comes to the sea; one that never does (the coast turned away) none. */
						for (j = 1; j < arm.Points.length; j++) {
							if (raise(arm.Points[j]).Height <= 0) {
								end = j + 1;

								break;
							}
						}

						if (end === arm.Points.length && raise(arm.Points[end - 1]).Height > 0) continue;

						arm = {Points: arm.Points.slice(0, end), Flow: arm.Flow.slice(0, end), Level: arm.Points.slice(0, end).map(function (point, index) {
							return Math.round(level * (1 - index / Math.max(1, end - 1)));
						})};

						made.push({Points: arm.Points, Flow: arm.Flow, Level: arm.Level, Along: [], Phase: [], Joins: [], Into: false, From: {River: index, Along: total - back}, Seed: rivers.length + made.length, Segments: []});
					}
				});

				return made;
			}

			courses.forEach(function (course, index) {
				var points = course.Points;
				var k;

				for (k = 0; k + 1 < points.length; k++) {
					var segment = {A: points[k], B: points[k + 1], FlowA: course.Flow[k], FlowB: course.Flow[k + 1], LevelA: course.Level[k], LevelB: course.Level[k + 1], River: index, K: k};
					var keys = {};

					streams.push(segment);
					course.Segments.push(segment);

					[points[k], points[k + 1]].forEach(function (end) {
						var cell = self.CellAt(1, Math.PI / 2 / 48, end);

						[cell].concat(self.CellNeighbours(1, Math.PI / 2 / 48, cell)).forEach(function (near) {
							keys[near.ID] = true;
						});
					});

					Object.keys(keys).forEach(function (key) {
						(buckets[key] = buckets[key] || []).push(segment);
					});
				}
			});

			/*
		 * A tributary ends where its river took its way (the middle of a cell of the grid it was traced on), off the way of
		 * that river smoothed: its end moved onto the nearest point of the other within 60 km (a cell of the grid of its tracing and its corners cut), joined there.
		 */
			var joined = courses.map(function (course, index) {
				var end = course.Points[course.Points.length - 1];
				var best = null;

				if (course.Points.length < 2 || course.Level[course.Level.length - 1] <= 0) return null;

				(buckets[self.CellAt(1, Math.PI / 2 / 48, end).ID] || []).forEach(function (segment) {
					if (segment.River === index) return;

					var a = segment.A;
					var ab = [segment.B[0] - a[0], segment.B[1] - a[1], segment.B[2] - a[2]];
					var t = Math.max(0, Math.min(1, ((end[0] - a[0]) * ab[0] + (end[1] - a[1]) * ab[1] + (end[2] - a[2]) * ab[2]) / Math.max(1e-18, dot(ab, ab))));
					var at = [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t];
					var far = Math.sqrt((at[0] - end[0]) * (at[0] - end[0]) + (at[1] - end[1]) * (at[1] - end[1]) + (at[2] - end[2]) * (at[2] - end[2])) * radius;
					if (far < 60 && (!best || far < best.Far))
						best = {Far: far, Segment: segment, T: t, At: normalize(at)};
				});

				if (!best)
					return null;

				course.Points[course.Points.length - 1] = best.At;
				course.Segments[course.Segments.length - 1].B = best.At;
				course.Into = true;

				return best;
			});

			/* Kilometres along each and the phase of its bends: a bend of some eleven times its width (15 m by the root of its flow). */
			courses.forEach(function (course) {
				var along = 0;
				var phase = 0;
				var k;

				for (k = 0; k < course.Points.length; k++) {
					if (k > 0) {
						var a = course.Points[k - 1];
						var b = course.Points[k];
						var step = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]) + (b[2] - a[2]) * (b[2] - a[2])) * radius;

						along += step;
						phase += step * Math.PI * 2 / bendLength((course.Flow[k - 1] + course.Flow[k]) / 2);
					}

					course.Along.push(along);
					course.Phase.push(phase);
				}

				course.Segments.forEach(function (segment) {
					segment.AlongA = course.Along[segment.K];
					segment.AlongB = course.Along[segment.K + 1];
					segment.PhaseA = course.Phase[segment.K];
					segment.PhaseB = course.Phase[segment.K + 1];
				});
			});

			joined.forEach(function (join) {
				if (join)
					courses[join.Segment.River].Joins.push(join.Segment.AlongA + (join.Segment.AlongB - join.Segment.AlongA) * join.T);
			});

			/* Where the arms of a delta leave their river: its bends none there either. */
			courses.forEach(function (course) {
				if (course.From)
					courses[course.From.River].Joins.push(course.From.Along);
			});

			riversMaking = false;
			riversMade = true;
		}

		/* The length of a bend of a river of a flow (km): eleven times its width, a quarter of a kilometre at least. */
		function bendLength (flow) {
			return Math.max(0.25, self.Rivers.Bend * self.RiverWidth(flow));
		}

		/*
		 * How far aside of its way a river is at a point of a segment (km, to the side of cross(A, B)): bends of some eleven
		 * times its width, twice its width aside, a third of that in the mountains (over 1200 m); none where tributaries
		 * come in, nor at the end of one in another (they meet on its way). Every view of it (its globe, its ground, the
		 * locations) bends it so: of its kilometres from its source, not of where it is seen from.
		 */
		function bendOf (segment, t) {
			return self.$Service('Geometry').Bend(recordOf(segment), t, self.Rivers.Width, self.Rivers.Bend);
		}

		/* A segment packed as numbers, as Geometry.Bend reads it, once: its ends, flows, levels, km, phases, its river's seed, end, joins. */
		function recordOf (segment) {
			var course = courses[segment.River];

			if (!segment.Record)
				segment.Record = segment.A.concat(segment.B, [segment.FlowA, segment.FlowB, segment.LevelA, segment.LevelB, segment.AlongA, segment.AlongB, segment.PhaseA, segment.PhaseB, course.Seed, course.Into ? course.Along[course.Along.length - 1] : -1, course.From ? 1 : 0, course.Joins.length], course.Joins);

			return segment.Record;
		}

		/* The segments of the cell of a point packed (Geometry.River: [count, each as recordOf]); null with none. */
		function packOf (p) {
			var key = self.CellAt(1, Math.PI / 2 / 48, p).ID;
			var found = buckets[key];
			if (!found)
				return null;

			if (!packs[key])
				packs[key] = found.reduce(function (all, segment) {
					return all.concat(recordOf(segment));
				}, [found.length]);

			return packs[key];
		}

		/* The side of a segment (unit, along the ground, to the side of cross(A, B)). */
		function sideOf (segment) {
			if (!segment.Side)
				segment.Side = normalize(cross(segment.A, segment.B));

			return segment.Side;
		}
		/*
		 * Its settlements (Settlements: [{Point, Size, Kind}]): kept in squares of the same grid round their points, each point
		 * made of length 1 again. Regression: kept to 7 places (Settlements), a point fell short of 1 by some 1e-7, and the
		 * distance of its acos to it was never less than some 1.5 km: no village had its houses in the picture of its globe.
		 */
		var dwellings = {};

		(Array.isArray(given.Settlements) ? given.Settlements : given.Settlements ? self.TownsOf(given.Settlements) : []).forEach(function (one) {
			var town = Object.assign({}, one, {Point: normalize(one.Point)});
			var cell = self.CellAt(1, Math.PI / 2 / 48, town.Point);

			[cell].concat(self.CellNeighbours(1, Math.PI / 2 / 48, cell)).forEach(function (near) {
				(dwellings[near.ID] = dwellings[near.ID] || []).push(town);
			});
		});
		/* Its highways (Highways: [{Points (directions), Class}]): kept in squares of the same grid, as its rivers. */
		var trunks = {};

		(Array.isArray(given.Highways) ? given.Highways : given.Highways ? self.HighwaysOf(given.Highways) : []).forEach(function (road) {
			var points = road.Points || [];
			var k;

			for (k = 0; k + 1 < points.length; k++) {
				var segment = {A: points[k], B: points[k + 1], Class: road.Class || 'road'};
				var keys = {};

				[points[k], points[k + 1]].forEach(function (end) {
					var cell = self.CellAt(1, Math.PI / 2 / 48, end);

					[cell].concat(self.CellNeighbours(1, Math.PI / 2 / 48, cell)).forEach(function (near) {
						keys[near.ID] = true;
					});
				});

				Object.keys(keys).forEach(function (key) {
					(trunks[key] = trunks[key] || []).push(segment);
				});
			}
		});
		var plates = [];
		var level = 0;
		var i;
		var planet;

		function dot (a, b) {
			return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		}

		function cross (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		}

		function normalize (a) {
			var length = Math.sqrt(dot(a, a)) || 1;

			return [a[0] / length, a[1] / length, a[2] / length];
		}

		/* The east and the north of a point, unit vectors in its tangent plane. */
		function frame (p) {
			var east = Math.abs(p[1]) > 0.9999 ? [0, 0, -1] : normalize(cross([0, 1, 0], p));

			return {East: east, North: normalize(cross(p, east))};
		}

		/* Of each graph: where each input of it is in its list (one past it: an input it has not), its numbers of the planet set once. */
		Object.keys(reliefs).forEach(function (name) {
			var inputs = reliefs[name].Inputs;
			/* Of its air too (Cells, Warm, Contrast, Lapse of its envelope; 0: as the Earth). */
			var fixed = {Octaves: octaves, Relief: relief, Mountains: mountains, Depth: depth, Radius: radius, Level: 0, RiverWidth: self.Rivers.Width, RiverBend: self.Rivers.Bend, Valley: self.Rivers.Valley, ValleyPower: self.Rivers.ValleyPower, Cells: Number(given.Cells) || 0, Warm: Number(given.Warm) || 0, Contrast: Number(given.Contrast) || 0, Lapse: Number(given.Lapse) || 0};
			var at = {};

			['Shape', 'Folds', 'Uplift', 'Ranges', 'Peaks', 'Sierra', 'Horns', 'Hills', 'Crags', 'Grain', 'Weather', 'Warp'].forEach(function (one) {
				fixed['S' + one] = self.$Service('Math').SeedOffset(seed + '-' + one.toLowerCase());
			});

			['PX', 'PY', 'PZ', 'EX', 'EY', 'EZ', 'NX', 'NY', 'NZ', 'Land', 'Boundary', 'Push', 'Oceanic', 'Small', 'Level', 'WLand', 'WSea', 'PaintRaise', 'PaintRift', 'PaintRiver', 'Latitude', 'Band', 'Height', 'Upwind', 'PaintTemperature', 'PaintMoisture', 'Middles', 'Motions', 'WindEast', 'WindNorth', 'Oceans', 'Lands', 'Seas', 'Rivers', 'Edits', 'Softs'].concat(Object.keys(fixed)).forEach(function (key) {
				var index = inputs.indexOf(key);

				at[key] = index === -1 ? inputs.length : index;
			});

			args[name] = inputs.map(function () {
				return 0;
			}).concat([0]);

			Object.keys(fixed).forEach(function (key) {
				args[name][at[key]] = fixed[key];
			});

			slots[name] = at;
			outs[name] = {};
			(reliefs[name].Keys || []).forEach(function (key, index) {
				outs[name][key] = index;
			});
		});

		/* A result of a graph by its name: one alone is a number, more a vector of them. */
		function result (name, made, key) {
			return typeof made === 'number' ? made : made[outs[name][key]];
		}

		/*
		 * The tectonic plates (blueprints/planet/plate, or PlateGraph: its own): their middles over the globe as a spiral
		 * spreads them, moved by the numbers of the seed (Blueprints.Chain); each its way, and under an ocean or not.
		 * Regression: in the code alone.
		 */
		var plateRun = self.PlateOf(given.PlateGraph, given.ReliefSources && given.ReliefSources.Plate);

		for (i = 0; i < count; i++) {
			var made = plateRun({}, {Index: i, Count: count, Seed: seed, Ocean: ocean});

			plates.push({ID: i, Middle: [made.MX, made.MY, made.MZ], Motion: [made.VX, made.VY, made.VZ], Oceanic: made.Oceanic > 0.5});
		}

		/* Their middles and motions by threes, what the graph of the plate of a point (blueprints/planet/tectonic) reads. */
		args.Tectonic[slots.Tectonic.Middles] = [];
		args.Tectonic[slots.Tectonic.Motions] = [];

		plates.forEach(function (one) {
			Array.prototype.push.apply(args.Tectonic[slots.Tectonic.Middles], one.Middle);
			Array.prototype.push.apply(args.Tectonic[slots.Tectonic.Motions], one.Motion);
		});

		/* What the walk up the wind reads (blueprints/planet/upwind): the plates, under an ocean or not, and the land and the sea drawn, packed. */
		args.Upwind[slots.Upwind.Middles] = args.Tectonic[slots.Tectonic.Middles];
		args.Upwind[slots.Upwind.Oceans] = plates.map(function (one) {
			return one.Oceanic ? 1 : 0;
		});
		args.Upwind[slots.Upwind.Lands] = drawn.Land;
		args.Edit[slots.Edit.Edits] = brushes;
		args.Upwind[slots.Upwind.Seas] = drawn.Sea;

		/*
		 * The plate of a point (blueprints/planet/tectonic, or TectonicGraph: its borders bent by a noise), the next one, and
		 * how they meet there: {ID, Oceanic, Other (the plate), Boundary (km to it), Push}. Regression: in the code alone.
		 */
		function plate (p) {
			var list = args.Tectonic;
			var at = slots.Tectonic;
			var made;
			var one;

			list[at.PX] = p[0];
			list[at.PY] = p[1];
			list[at.PZ] = p[2];
			made = reliefs.Tectonic.Main.apply(null, list);
			one = plates[result('Tectonic', made, 'ID')];

			return {ID: one.ID, Oceanic: one.Oceanic, Other: plates[result('Tectonic', made, 'Other')], Boundary: result('Tectonic', made, 'Boundary'), Push: result('Tectonic', made, 'Push')};
		}

		/*
		 * The land of a point, a number over 0 above the sea: a noise to the fineness of Detail, the plates (continents ride
		 * on their own), what was drawn (land and sea), all told before any detail, so its 0 is the coast at any scale.
		 */
		function continent (p, tectonic) {
			var geometry = self.$Service('Geometry');

			return landOf(p, tectonic.Oceanic, level, geometry.Painted(drawn.Land, p[0], p[1], p[2]), geometry.Painted(drawn.Sea, p[0], p[1], p[2]));
		}

		/* The graph of the land (blueprints/planet/land) at a point. */
		function landOf (p, oceanic, sea, painted, drowned) {
			var list = args.Land;
			var at = slots.Land;

			list[at.PX] = p[0];
			list[at.PY] = p[1];
			list[at.PZ] = p[2];
			list[at.Oceanic] = oceanic ? 1 : 0;
			list[at.Level] = sea;
			list[at.WLand] = painted;
			list[at.WSea] = drowned;

			return reliefs.Land.Main.apply(null, list);
		}

		/* The level of its sea: what leaves Ocean of a spread of its points under it, before anything is drawn. */
		(function () {
			var values = [];
			var k;

			for (k = 0; k < 600; k++) {
				var p = self.$Service('Math').Spiral(k, 600);

				values.push(landOf(p, plate(p).Oceanic, 0, 0, 0));
			}

			values.sort(function (a, b) {
				return a - b;
			});

			level = values[Math.max(0, Math.min(599, Math.round(ocean * 600)))];
		})();

		/*
		 * The height of a point over the sea, metres, and what it is made of: its plate, its land. near: what was raised of a
		 * point a few hundred metres away (Slope): its plate and its land taken as they are (the same there to a hair; its
		 * land anew near a coast), the rest made again. Not its erosion: of ridges of a kilometre, it is other 300 m away.
		 */
		/*
		 * A point of a planet of data. As coarse as its finest tile there or coarser: its height of the tile, read between
		 * its samples (cheaper than the relief). Finer, of a planet made of options (Origin generated): the relief of those
		 * options, and what was changed of it, Edit (metres more or less, of its tiles where there are any), over it: the
		 * relief is not smooth within a texel (ranges, peaks), and samples read between them lost kilometres of it. Of a
		 * planet of data alone: its tile, its rivers and its baked locations over it.
		 */
		function raise (p, finest, near) {
			var kept = data ? stored('Height', p) : null;
			var mix;
			var tectonic;
			var height;
			var made;
			var edit;

			if (!kept)
				return detailed(p, finest, near);

			if (origin && !(finest >= kept.Texel)) {
				made = detailed(p, finest, near);
				edit = stored('Edit', p);

				if (edit)
					made = {Height: made.Height + edit.Value, Tectonic: made.Tectonic, Land: made.Land};

				return made;
			}

			tectonic = near ? near.Tectonic : !origin ? tectonicOf(p) : plate(p);
			height = kept.Value;

			/* Of data alone: its tile as coarse as it is, finer the detail of the rules of the place (generated: none). */
			mix = !origin && ruled && !ruling ? rulesAt(p) : null;

			if (mix)
				height += details(p, finest, height, mix, function () {
					return 0;
				});

			if (!origin && height > 0)
				height = Math.max(1, carved(p, height));

			if (!origin)
				height = baked(p, height);

			return {Height: height, Tectonic: tectonic, Land: height > 0 ? 1 : -1};
		}

		/*
		 * What a layer of the data of the planet keeps at a point, of its finest tile there: {Value (read between its four
		 * samples, or of the nearest of them: nearest), Level, Texel (km)}; null with no tile.
		 */
		function stored (layer, p, nearest) {
			var info = data.Manifest.Layers[layer];
			var size = data.Manifest.Size;
			var place = self.TilePlace(p);
			var level;
			var count;
			var u;
			var v;
			var x;
			var y;
			var i;
			var j;
			var fx;
			var fy;
			var values;

			if (!info)
				return null;

			for (level = info.Depth; level >= 0; level--) {
				count = 1 << level;
				u = place[1] * count;
				v = place[2] * count;
				x = Math.min(count - 1, Math.floor(u));
				y = Math.min(count - 1, Math.floor(v));
				values = data.Tile(self.TileName(layer, place[0], level, x, y));

				if (!values) continue;

				u = (u - x) * (size - 1);
				v = (v - y) * (size - 1);

				if (nearest)
					return {Value: values[Math.round(v) * size + Math.round(u)], Level: level, Texel: Math.PI / 2 * radius / (count * (size - 1))};

				i = Math.min(size - 2, Math.floor(u));
				j = Math.min(size - 2, Math.floor(v));
				fx = u - i;
				fy = v - j;

				return {Value: (values[j * size + i] * (1 - fx) + values[j * size + i + 1] * fx) * (1 - fy) + (values[(j + 1) * size + i] * (1 - fx) + values[(j + 1) * size + i + 1] * fx) * fy, Level: level, Texel: Math.PI / 2 * radius / (count * (size - 1))};
			}

			return null;
		}

		/*
		 * What a layer of four channels (Climate, Plate: rgba8) keeps at a point, of its finest tile there: {Values (each read
		 * between its four samples, or of the nearest: nearest), Texel (km)}; null with no tile.
		 */
		function stored4 (layer, p, nearest) {
			var info = data.Manifest.Layers[layer];
			var size = data.Manifest.Size;
			var place = self.TilePlace(p);
			var level;
			var count;
			var u;
			var v;
			var x;
			var y;
			var i;
			var j;
			var fx;
			var fy;
			var c;
			var out;
			var values;

			if (!info)
				return null;

			for (level = info.Depth; level >= 0; level--) {
				count = 1 << level;
				u = place[1] * count;
				v = place[2] * count;
				x = Math.min(count - 1, Math.floor(u));
				y = Math.min(count - 1, Math.floor(v));
				values = data.Tile(self.TileName(layer, place[0], level, x, y));

				if (!values) continue;

				u = (u - x) * (size - 1);
				v = (v - y) * (size - 1);
				out = [0, 0, 0, 0];

				if (nearest) {
					i = (Math.round(v) * size + Math.round(u)) * 4;

					for (c = 0; c < 4; c++)
						out[c] = values[i + c];
				}
				else {
					i = Math.min(size - 2, Math.floor(u));
					j = Math.min(size - 2, Math.floor(v));
					fx = u - i;
					fy = v - j;

					for (c = 0; c < 4; c++)
						out[c] = (values[(j * size + i) * 4 + c] * (1 - fx) + values[(j * size + i + 1) * 4 + c] * fx) * (1 - fy) + (values[((j + 1) * size + i) * 4 + c] * (1 - fx) + values[((j + 1) * size + i + 1) * 4 + c] * fx) * fy;
				}

				return {Values: out, Texel: Math.PI / 2 * radius / (count * (size - 1))};
			}

			return null;
		}

		/* The plate of a point of a planet of data alone: of its tiles of Plate (the nearest sample), else of its plates. */
		function tectonicOf (p) {
			var kept = data && !origin && data.Manifest.Layers.Plate ? stored4('Plate', p, true) : null;
			if (!kept)
				return plate(p);

			return {ID: kept.Values[0], Oceanic: kept.Values[1] > 127, Boundary: kept.Values[2] * 10, Push: (kept.Values[3] / 255 - 0.5) * 4};
		}

		/*
		 * Of the graph of the relief (blueprints/planet/relief): its land and its plate, how fine it is asked (none finer than
		 * finest, km: a globe needs none), its east and north (the slope of its ranges), the sums of what was painted there.
		 */
		function raised (p, finest, near) {
			var tectonic = near ? near.Tectonic : plate(p);
			/* Near a coast its land anew: the sea a few hundred metres off is not land there. */
			var land = near && near.Land > 0.2 ? near.Land : continent(p, tectonic);
			var list = args.Relief;
			var at = slots.Relief;
			var height;

			list[at.PX] = p[0];
			list[at.PY] = p[1];
			list[at.PZ] = p[2];
			list[at.Land] = land;
			list[at.Boundary] = tectonic.Boundary;
			list[at.Push] = tectonic.Push;
			list[at.Oceanic] = tectonic.Oceanic ? 1 : 0;
			list[at.Small] = finest === undefined ? 0 : finest;

			/* Over the sea: the mountains, rifts and rivers painted, and the east and the north of the point. */
			if (land > 0) {
				var east = normalize(Math.abs(p[1]) > 0.999 ? [1, 0, 0] : [p[2], 0, -p[0]]);
				var north = cross(p, east);

				list[at.EX] = east[0];
				list[at.EY] = east[1];
				list[at.EZ] = east[2];
				list[at.NX] = north[0];
				list[at.NY] = north[1];
				list[at.NZ] = north[2];
				/*
				 * A range: its height along its line (the graph lifts its crests and spurs by the folds of the ground); a rift: its
				 * depth; a river: its valley down to near the sea where it goes (Geometry.Strokes, of resources/planet/paint).
				 */
				list[at.PaintRaise] = self.$Service('Geometry').Strokes(drawn.Mountains, p[0], p[1], p[2]);
				list[at.PaintRift] = self.$Service('Geometry').Strokes(drawn.Rift, p[0], p[1], p[2]);
				list[at.PaintRiver] = self.$Service('Geometry').Strokes(drawn.River, p[0], p[1], p[2]);
			}

			height = reliefs.Relief.Main.apply(null, list);

			if (land > 0)
				height = Math.max(1, carved(p, height));

			return {Height: bare ? edited(p, height, finest) : baked(p, edited(p, height, finest)), Tectonic: tectonic, Land: land};
		}

		/*
		 * The relief of a point by its rules: as coarse as Scale its own (its edits on it), finer the detail of the rules of
		 * the place (generated: its own detail); the grounds of its locations over all of it, as they were made.
		 */
		function detailed (p, finest, near) {
			var mix = ruled && !ruling ? rulesAt(p) : null;
			var coarse;
			var height;

			if (!mix)
				return raised(p, finest, near);

			bare = true;

			try {
				coarse = raised(p, Math.max(finest || 0, scale), near);
				height = coarse.Height + details(p, finest, coarse.Height, mix, function () {
					return raised(p, finest, near).Height - coarse.Height;
				});
			}
			finally {
				bare = false;
			}

			return {Height: baked(p, height), Tectonic: coarse.Tectonic, Land: coarse.Land};
		}

		/* The rules of a point and how much of each: its land's (Biomes), then each region over it; null: its own relief alone. */
		function rulesAt (p) {
			var list = [{Rule: landRule(p), Weight: 1}];

			regions.forEach(function (region) {
				var weight;

				if (dot(p, region.Middle) < region.Cap) return;

				weight = self.$Service('Geometry').Painted(region.Packed, p[0], p[1], p[2]);

				if (weight <= 0) return;

				list.forEach(function (one) {
					one.Weight *= 1 - weight;
				});
				list.push({Rule: region.Rule, Weight: weight});
			});

			return list.length === 1 && list[0].Rule === 'generated' ? null : list;
		}

		/* The rule of the land of a point: of its biome (of its data, or of its climate as coarse as Scale); the sea has none. */
		function landRule (p) {
			var kept;
			var biome;

			if (!Object.keys(mapping).length) return 'generated';

			kept = data && data.Manifest.Layers.Biome ? stored('Biome', p, true) : null;

			if (kept) {
				biome = data.Manifest.Layers.Biome.Table[kept.Value] || '';
			}
			else {
				ruling = true;

				try {
					biome = sample(p, scale).Biome;
				}
				finally {
					ruling = false;
				}
			}

			if (!biome)
				return 'generated';

			return mapping[biome] || mapping['*'] || 'generated';
		}

		/* The code of a rule (a graph of its own, or of the library: ScenePlanet.Rules) of its seed and values, made once; null with none. */
		function ruleRun (name) {
			var graph;
			var blueprints;
			var made;

			if (Object.prototype.hasOwnProperty.call(runs, name)) return runs[name];

			/* Made in the page (Ruled): its code as it is, in a worker too, where no graph is made into code. */
			if (rules.Sources && rules.Sources[name]) {
				runs[name] = {Run: new Function('B', 'M', 'N', rules.Sources[name])(self.$Service('Blueprints'), self.$Service('Math'), self.$Service('Noise')), Reads: rules.Reads && rules.Reads[name] || []};

				return runs[name];
			}

			graph = rules.Graphs && rules.Graphs[name] || self.Rules[name] || null;
			blueprints = graph ? self.$Service('Blueprints') : null;
			/* A worker has no kinds of graphs: a rule not made in the page (Ruled) has no detail there. */
			made = blueprints && blueprints.Makers ? self.RuleCode(graph, name, seed, rules.Parameters && rules.Parameters[name]) : null;
			runs[name] = made ? {Run: made.Run, Reads: made.Reads} : null;

			return runs[name];
		}

		/*
		 * The detail of the rules of a point over its coarse height, each by its weight; a rule's fades out as the point asked
		 * for grows as coarse as Scale (a globe seen from far has none of it, and no noise of it).
		 */
		function details (p, finest, height, mix, generated) {
			var fade = finest === undefined ? 1 : Math.max(0, Math.min(1, scale / Math.max(1e-6, finest) - 1));
			var own = null;
			var climate = null;
			var river;
			var total = 0;

			mix.forEach(function (one) {
				var run;
				var made;

				if (one.Weight <= 0) return;

				run = one.Rule === 'generated' ? null : ruleRun(one.Rule);

				if (!run) {
					own = own === null ? generated() : own;
					total += one.Weight * own;

					return;
				}

				if (!fade) return;

				if (!climate && run.Reads.some(function (name) {
					return ['Celsius', 'Temperature', 'Moisture', 'WindEast', 'WindNorth'].indexOf(name) !== -1;
				})) {
					ruling = true;

					try {
						climate = sample(p, scale);
					}
					finally {
						ruling = false;
					}
				}

				if (river === undefined && run.Reads.indexOf('River') !== -1)
					river = nearestRiver(p);

				made = run.Run(Object.assign({Seed: seed + ':' + one.Rule}, rules.Parameters && rules.Parameters[one.Rule] || {}), {X: p[0] * radius, Y: p[1] * radius, Z: p[2] * radius, East: Math.atan2(-p[2], p[0]) * Math.sqrt(Math.max(0, 1 - p[1] * p[1])) * radius, North: Math.asin(Math.max(-1, Math.min(1, p[1]))) * radius, Height: height, Scale: scale, Finest: finest || 0, Latitude: Math.asin(Math.max(-1, Math.min(1, p[1]))) * 180 / Math.PI, Celsius: climate ? climate.Celsius : 0, Temperature: climate ? climate.Temperature : 0, Moisture: climate ? climate.Moisture : 0, WindEast: climate ? climate.Wind[0] : 0, WindNorth: climate ? climate.Wind[1] : 0, River: river ? river.Far : 1e6});

				total += one.Weight * (Number(made && made.Height) || 0) * fade;
			});

			return total;
		}

		/*
		 * A height as its edits leave it (blueprints/planet/edit, or EditGraph: its own): each brush the nearer its path the
		 * more (none past its Radius): raise and lower by Amount, flatten toward Height, smooth toward its relief no finer
		 * than half its radius (that relief made here, for a brush that reaches the point). Regression: in the code alone.
		 */
		function edited (p, height, finest) {
			var list = args.Edit;
			var at = slots.Edit;

			if (!edits.length || smoothing) return height;

			list[at.PX] = p[0];
			list[at.PY] = p[1];
			list[at.PZ] = p[2];
			list[at.Height] = height;
			list[at.Softs] = edits.map(function (edit) {
				if (edit.Type !== 'smooth' || !(self.$Service('Geometry').EditWeight(brushes, edit.At, p[0], p[1], p[2]) > 0)) return 0;

				smoothing = true;

				try {
					return raised(p, Math.max(finest || 0, edit.Reach * radius / 2)).Height;
				}
				finally {
					smoothing = false;
				}
			});

			return result('Edit', reliefs.Edit.Main.apply(null, list), 'Height');
		}

		/*
		 * The valley of a river near a point: the ground comes down toward its bed as it nears it (wider the more it drains: a
		 * valley of 0.6 km times its flow to 0.4), the bed going down to the sea along it.
		 */
		/* The nearest river to a point (Geometry.River, its way as it bends): {Far (km), Flow, Level}; null with none near. */
		function nearestRiver (p) {
			var packed;
			var made;

			rivers();

			if (riversMaking) return null;

			packed = packOf(p);

			if (!packed)
				return null;

			made = self.$Service('Geometry').River(packed, p[0], p[1], p[2], radius, self.Rivers.Width, self.Rivers.Bend);

			return made.Far === Infinity ? null : made;
		}

		/* The nearest of its highways to a point: {Far (km), Class}; null with none near. */
		function nearestHighway (p) {
			var found = trunks[self.CellAt(1, Math.PI / 2 / 48, p).ID];
			var best = null;

			(found || []).forEach(function (segment) {
				var a = segment.A;
				var b = segment.B;
				var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
				var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / Math.max(1e-18, dot(ab, ab))));
				var q = [a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2]];
				var far = Math.sqrt(dot(q, q)) * radius;
				if (!best || far < best.Far)
					best = {Far: far, Class: segment.Class};
			});

			return best;
		}

		/*
		 * The valley of the nearest river (blueprints/planet/valley, or ValleyGraph: its own): the ground down toward its bed,
		 * wider the more it drains. Regression: in the code alone.
		 */
		function carved (p, height) {
			var list = args.Valley;
			var at = slots.Valley;
			var packed;

			rivers();

			packed = riversMaking ? null : packOf(p);

			if (!packed)
				return height;

			list[at.PX] = p[0];
			list[at.PY] = p[1];
			list[at.PZ] = p[2];
			list[at.Height] = height;
			list[at.Rivers] = packed;

			return result('Valley', reliefs.Valley.Main.apply(null, list), 'Height');
		}

		/* The height of a point of a baked location there, its own past the edge of it. */
		function baked (p, height) {
			var made = height;

			bakes.forEach(function (bake) {
				var near = dot(p, bake.Middle);
				var scale;
				var u;
				var v;
				var x;
				var z;
				var out;
				var fx;
				var fz;
				var c;
				var r;
				var a;
				var b;
				var h;
				var side = bake.Side;

				if (near < bake.Reach) return;

				scale = radius * 1000 / near;
				u = dot(p, bake.East) * scale;
				v = dot(p, bake.North) * scale;
				x = u * bake.Cos + v * bake.Sin;
				z = u * bake.Sin - v * bake.Cos;
				out = Math.max(Math.abs(x), Math.abs(z));

				if (out >= bake.Half) return;

				fx = (x + bake.Half) / (bake.Half * 2) * (side - 1);
				fz = (z + bake.Half) / (bake.Half * 2) * (side - 1);
				c = Math.min(side - 2, Math.floor(fx));
				r = Math.min(side - 2, Math.floor(fz));
				fx -= c;
				fz -= r;
				a = bake.Heights[r * side + c] * (1 - fx) + bake.Heights[r * side + c + 1] * fx;
				b = bake.Heights[(r + 1) * side + c] * (1 - fx) + bake.Heights[(r + 1) * side + c + 1] * fx;
				h = a * (1 - fz) + b * fz;

				made += (h - made) * Math.max(0, Math.min(1, (bake.Half - out) / bake.Edge));
			});

			return made;
		}

		/* What its climates drawn give a point of a number of theirs (Temperature, Moisture): each by how much the point is of it. */
		function drawnClimate (p, key) {
			var sum = 0;

			areas.forEach(function (area) {
				if (area.Stroke.Type === 'climate')
					sum += self.$Service('Geometry').Painted(area.Packed, p[0], p[1], p[2]) * (Number(area.Stroke[key]) || 0);
			});

			return sum;
		}

		function sample (direction, finest) {
			var p = normalize(direction);
			var raised = raise(p, finest);

			if (finest === undefined)
				last = {P: p, Raised: raised};

			var tectonic = raised.Tectonic;
			var land = raised.Land;
			var height = raised.Height;
			var latitude = Math.asin(Math.max(-1, Math.min(1, p[1])));
			var celsius;
			var moisture;
			var wind;
			var axes = frame(p);
			var band = Math.abs(latitude) * 180 / Math.PI;
			var upwind;
			var list;
			var at;
			var made;
			var biome = '';
			var mixed = null;

			/*
			 * Its climate of its data (Climate, read between its samples): as coarse as its tile or coarser; finer, a planet
			 * made of options has the climate of those options, as it has its own relief.
			 */
			var climate = data && data.Manifest.Layers.Climate ? stored4('Climate', p) : null;
			if (climate && origin && !(finest >= climate.Texel))
				climate = null;

			if (climate) {
				celsius = climate.Values[0] / 255 * (self.ClimateCode.High - self.ClimateCode.Low) + self.ClimateCode.Low;
				moisture = climate.Values[1] / 255;
				wind = [(climate.Values[2] / 255 - 0.5) * self.ClimateCode.Wind * 2, (climate.Values[3] / 255 - 0.5) * self.ClimateCode.Wind * 2];
			}
			/* Of its options: its winds, its warmth and how wet it is. */
			else {
				/* The winds (blueprints/planet/wind): easterly trades to 30 degrees, westerlies to 60, polar easterlies. */
				list = args.Wind;
				at = slots.Wind;
				list[at.PX] = p[0];
				list[at.PY] = p[1];
				list[at.PZ] = p[2];
				list[at.Latitude] = latitude;
				list[at.Band] = band;
				made = reliefs.Wind.Main.apply(null, list);
				wind = [result('Wind', made, 'East'), result('Wind', made, 'North')];

				/*
				 * Where the wind comes from (blueprints/planet/upwind, its steps upwind-step: the land roughly at six points up
				 * it): more rain from a sea, less behind mountains (a range between: it falls on its far side). Regression: a
				 * loop of the code.
				 */
				list = args.Upwind;
				at = slots.Upwind;
				list[at.PX] = p[0];
				list[at.PY] = p[1];
				list[at.PZ] = p[2];
				list[at.EX] = axes.East[0];
				list[at.EY] = axes.East[1];
				list[at.EZ] = axes.East[2];
				list[at.NX] = axes.North[0];
				list[at.NY] = axes.North[1];
				list[at.NZ] = axes.North[2];
				list[at.WindEast] = wind[0];
				list[at.WindNorth] = wind[1];
				list[at.Land] = land;
				list[at.Level] = level;
				upwind = result('Upwind', reliefs.Upwind.Main.apply(null, list), 'Upwind');

				/* Its climate (blueprints/planet/climate): warm at the equator, cold at the poles and up high; wet at the equator and at 50-60 degrees. */
				list = args.Climate;
				at = slots.Climate;
				list[at.PX] = p[0];
				list[at.PY] = p[1];
				list[at.PZ] = p[2];
				list[at.Latitude] = latitude;
				list[at.Band] = band;
				list[at.Height] = height;
				list[at.Upwind] = upwind;
				list[at.PaintTemperature] = drawnClimate(p, 'Temperature');
				list[at.PaintMoisture] = drawnClimate(p, 'Moisture');
				made = reliefs.Climate.Main.apply(null, list);
				celsius = result('Climate', made, 'Celsius');
				moisture = result('Climate', made, 'Moisture');
			}

			/*
			 * Its land of its climate, unless one was drawn, or its data has one (Biome, of the nearest sample): as coarse as
			 * its tile or coarser; finer, a planet made of options has the land of its climate, as it has its own relief (a
			 * sample of tens of kilometres made the borders of its lands squares on its ground).
			 */
			if (height > 0) {
				var kept = data ? stored('Biome', p, true) : null;
				if (kept && (!origin || finest >= kept.Texel))
					biome = data.Manifest.Layers.Biome.Table[kept.Value] || '';

				areas.forEach(function (area) {
					if (area.Stroke.Type === 'biome' && area.Stroke.Biome && self.$Service('Geometry').Painted(area.Packed, p[0], p[1], p[2]) > 0.5)
						biome = area.Stroke.Biome;
				});

				/* Of its climate: the lands that hold there, each by how well (Mixed: the picture of a square blends their colors). */
				if (!biome && biomes) {
					mixed = self.$Service('SceneTerrainGenerator').BiomeOf(biomes, height / relief, moisture, self.Warmth(celsius)).List;
					biome = mixed[0].Name;
				}
			}

			return {Direction: p, Elevation: height, Land: height > 0, Plate: {ID: tectonic.ID, Oceanic: tectonic.Oceanic, Boundary: tectonic.Boundary, Push: tectonic.Push}, Wind: wind, Celsius: celsius, Temperature: self.Warmth(celsius), Moisture: moisture, Biome: biome, Mixed: mixed};
		}

		/* The last point sampled whole, for its slope after (Slope). */
		var last = null;

		planet = {
			Options: given,
			Radius: radius,
			Plates: plates,
			Lands: biomes || [],
			Sample: sample,

			/* finest: km, the finest that is asked (all by default): a globe of a few hundred texels a side asks for no hills. */
			Elevation: function (direction, finest) {
				return raise(normalize(direction), finest).Height;
			},

			/*
			 * How steep the ground of a point is, rise over run, of its heights reach km (0.3) east and north of it; 0 over the
			 * sea. Of the point sampled last when it is that one (Sample); the two heights beside of its plate and land, the same
			 * as two whole heights to a hair (Regression: two whole heights a texel were half the time of a picture of a square).
			 */
			Slope: function (direction, reach) {
				var p = normalize(direction);
				var centre = last && last.P[0] === p[0] && last.P[1] === p[1] && last.P[2] === p[2] ? last.Raised : raise(p);
				var axes = frame(p);
				var far = (reach || 0.3) / radius;
				var east;
				var north;

				if (centre.Height <= 0) return 0;

				east = raise(normalize([p[0] + axes.East[0] * far, p[1] + axes.East[1] * far, p[2] + axes.East[2] * far]), undefined, centre).Height;
				north = raise(normalize([p[0] + axes.North[0] * far, p[1] + axes.North[1] * far, p[2] + axes.North[2] * far]), undefined, centre).Height;

				return Math.sqrt(Math.pow(east - centre.Height, 2) + Math.pow(north - centre.Height, 2)) / ((reach || 0.3) * 1000);
			},

			Land: function (direction) {
				if (bakes.length || edits.length)
					return raise(normalize(direction)).Height > 0;

				return continent(normalize(direction), plate(normalize(direction))) > 0;
			},

			Plate: function (direction) {
				return tectonicOf(normalize(direction));
			},

			Wind: function (direction) {
				return sample(direction).Wind;
			},

			Climate: function (direction) {
				var made = sample(direction);

				return {Celsius: made.Celsius, Temperature: made.Temperature, Moisture: made.Moisture};
			},

			Biome: function (direction) {
				return sample(direction).Biome;
			},

			Point: function (direction) {
				var p = normalize(direction);
				var r = radius + Math.max(0, raise(p).Height) / 1000;

				return [p[0] * r, p[1] * r, p[2] * r];
			},

			Direction: function (latitude, longitude) {
				return self.Direction(latitude, longitude);
			},

			LatLon: function (direction) {
				return self.LatLon(direction);
			},

			/* The nearest of its rivers to a direction: {Far (km), Flow, Level}, null with none near. */
			River: function (direction) {
				return nearestRiver(normalize(direction));
			},

			/* The ways of its rivers (Rivers): [{Points (directions, a tributary's last on the river it joins), Along (km from its source)}]. */
			Courses: function () {
				rivers();

				return courses.map(function (course) {
					return {Points: course.Points, Along: course.Along, Flow: course.Flow, Level: course.Level};
				});
			},

			/*
			 * A point of the way of a river as it bends (index of Courses, k its segment, t along it, 0 to 1): {Direction,
			 * Flow, Level, Along (km)}; every view of the river bends it so (its globe, its ground, the locations it crosses).
			 */
			RiverAt: function (index, k, t) {
				var segment;
				var a;
				var b;
				var on;

				rivers();

				segment = courses[index] && courses[index].Segments[k];

				if (!segment) return null;

				a = segment.A;
				b = segment.B;
				on = normalize([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);

				return {Direction: normalize([on[0] + sideOf(segment)[0] * bendOf(segment, t) / radius, on[1] + sideOf(segment)[1] * bendOf(segment, t) / radius, on[2] + sideOf(segment)[2] * bendOf(segment, t) / radius]), Flow: segment.FlowA + (segment.FlowB - segment.FlowA) * t, Level: segment.LevelA + (segment.LevelB - segment.LevelA) * t, Along: segment.AlongA + (segment.AlongB - segment.AlongA) * t};
			},

			/* The nearest of its highways to a direction: {Far (km), Class}, null with none near. */
			Highway: function (direction) {
				return nearestHighway(normalize(direction));
			},

			/* Its settlements near a direction (within some 200 km): [{Far (km), Kind, Size, Point}]. */
			Towns: function (direction) {
				var p = normalize(direction);

				return (dwellings[self.CellAt(1, Math.PI / 2 / 48, p).ID] || []).map(function (town) {
					return {Far: Math.acos(Math.max(-1, Math.min(1, dot(p, town.Point)))) * radius, Kind: town.Kind, Size: town.Size, Point: town.Point};
				});
			}
		};

		return planet;
	},

	/*
	 * A view of a globe: {Yaw, Pitch (radians it is turned), Zoom (1: the whole globe in the smaller side), Width, Height
	 * (pixels)}. Project gives where a direction is seen: [x, y (pixels), facing (over 0 on the side seen)]; Unproject the
	 * direction under a pixel, null off the globe.
	 */
	/*
	 * The turn of a view of a globe: the three axes of the screen (right, up, toward the eye) in the frame of the planet,
	 * one after the other (nine numbers), of its Yaw, Pitch and Roll (radians). Turn of a view, when it has one, is used in
	 * place of them: a view turned any way, over the poles too.
	 */
	ViewTurn: function (yaw, pitch, roll) {
		var cy = Math.cos(yaw || 0);
		var sy = Math.sin(yaw || 0);
		var cp = Math.cos(pitch || 0);
		var sp = Math.sin(pitch || 0);
		var cr = Math.cos(roll || 0);
		var sr = Math.sin(roll || 0);
		var right = [cy, 0, -sy];
		var up = [-sp * sy, cp, -sp * cy];

		return [cr * right[0] + sr * up[0], cr * right[1] + sr * up[1], cr * right[2] + sr * up[2], -sr * right[0] + cr * up[0], -sr * right[1] + cr * up[1], -sr * right[2] + cr * up[2], cp * sy, sp, cp * cy];
	},

	Project: function (view, direction) {
		var turn = view.Turn || this.ViewTurn(view.Yaw, view.Pitch, view.Roll);
		var scale = Math.min(view.Width, view.Height) / 2 * (view.Zoom || 1);

		return [view.Width / 2 + (turn[0] * direction[0] + turn[1] * direction[1] + turn[2] * direction[2]) * scale, view.Height / 2 - (turn[3] * direction[0] + turn[4] * direction[1] + turn[5] * direction[2]) * scale, turn[6] * direction[0] + turn[7] * direction[1] + turn[8] * direction[2]];
	},

	Unproject: function (view, px, py) {
		var turn = view.Turn || this.ViewTurn(view.Yaw, view.Pitch, view.Roll);
		var scale = Math.min(view.Width, view.Height) / 2 * (view.Zoom || 1);
		var x = (px - view.Width / 2) / scale;
		var y = (view.Height / 2 - py) / scale;
		var z = 1 - x * x - y * y;
		if (z < 0)
			return null;

		z = Math.sqrt(z);

		return [x * turn[0] + y * turn[3] + z * turn[6], x * turn[1] + y * turn[4] + z * turn[7], x * turn[2] + y * turn[5] + z * turn[8]];
	},

	/*
	 * Rows of a map of all of a planet (equirectangular: longitude -180 to 180 across, latitude 90 to -90 down), Width by
	 * Height, rows [from, to): RGBA bytes of what Picture shows of each point, its relief lit as a globe of the view far.
	 * The globe of PlanetEditor turns at once on it, its picture of the view coming over it.
	 */
	Map: function (options, rows, width, height, overlay) {
		var planet = this.Planet(options);
		var from = Math.max(0, rows[0]);
		var to = Math.min(height, rows[1]);
		var data = new Uint8ClampedArray(width * (to - from) * 4);
		var light = [-0.5, 0.7, 0.5];
		var apart = Math.PI / height * planet.Radius * 1000;
		var shift = Math.PI / height;
		var x;
		var y;

		for (y = from; y < to; y++) {
			for (x = 0; x < width; x++) {
				var direction = this.Direction(90 - (y + 0.5) / height * 180, (x + 0.5) / width * 360 - 180);
				var at = ((y - from) * width + x) * 4;
				var sample = planet.Sample(direction);
				var near = planet.Elevation([direction[0] + light[0] * shift, direction[1] + light[1] * shift, direction[2] + light[2] * shift]);
				var bright = sample.Land ? Math.max(0, Math.min(1, 0.55 + (near - sample.Elevation) / apart * 1.6 * Math.max(1, Math.sqrt(apart / 500)))) : 1;
				var color = this.Color(planet, sample, overlay, bright);

				data[at] = color[0] * 255;
				data[at + 1] = color[1] * 255;
				data[at + 2] = color[2] * 255;
				data[at + 3] = 255;
			}
		}

		return {Data: data, Width: width, Height: to - from, From: from};
	},

	/* The planet of options, made once for them (a worker keeps it between its pieces). */
	Planet: function (options) {
		var key = JSON.stringify(options);

		this.Planets = this.Planets || {};

		if (!this.Planets[key]) {
			if (Object.keys(this.Planets).length > 6)
				this.Planets = {};

			this.Planets[key] = this.Make(options);
		}

		return this.Planets[key];
	},

	/*
	 * The color of a point of a planet by what is shown (overlay): relief (the sea by its depth, the land by its biome
	 * and its height, snow where it is cold), plates (a color each, red where they close, blue where they part), wind (the
	 * relief, dimmer), temperature, moisture and biomes (their colors alone). light: how the slope faces the light, 0 to 1.
	 */
	/*
	 * How much of a point (a sample of a planet, its Direction in it) is a desert: Dry (dry and warm, 0 to 1; none where it
	 * is cold), Erg (of it, a sand sea: dunes) and Stone (a dark stony plateau between them), by a noise of the place of
	 * tens of kilometres; the same for its globe (Color) and for the picture of a square of it (PatchPicture).
	 */
	Arid: function (sample, radius) {
		var p = sample.Direction;
		var dry;
		var erg;
		var k = (radius || this.Defaults.Radius);

		function smooth (a, b, x) {
			var t = Math.max(0, Math.min(1, (x - a) / (b - a)));

			return t * t * (3 - 2 * t);
		}

		dry = sample.Land && p ? smooth(0.3, 0.1, sample.Moisture) * smooth(4, 14, sample.Celsius) : 0;

		if (!dry)
			return {Dry: 0, Erg: 0, Stone: 0};

		this.Ergs = this.Ergs || this.$Service('Noise').Make({Type: 'simplex', Seed: 'ergs', Fractal: 'fbm', Octaves: 3});
		erg = smooth(0.45, 0.62, this.Ergs.At(p[0] * k / 90, p[1] * k / 90, p[2] * k / 90));

		return {Dry: dry, Erg: erg, Stone: (1 - erg) * smooth(0.5, 0.35, this.Ergs.At(p[0] * k / 30 + 7, p[1] * k / 30, p[2] * k / 30))};
	},

	/*
	 * The look of the land of a desert and of a basin (Arid): orange sand seas, dark stony plateaus, a salt flat white in a
	 * dry basin (its floor at the least height of land, 1 m: basin 1), damp 0 to 1; the water of a wet one is its caller's.
	 */
	Desert: function (color, arid, basin, damp) {
		function mix (a, b, t) {
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
		}

		color = mix(color, [0.84, 0.66, 0.42], arid.Dry * arid.Erg * 0.8);
		color = mix(color, [0.44, 0.35, 0.27], arid.Dry * arid.Stone * 0.55);
		/* A wet basin a marsh: dark, its water between the reeds (of its caller). */
		color = mix(color, [0.2, 0.24, 0.15], basin * damp * 0.6);

		return mix(color, [0.9, 0.87, 0.8], basin * (1 - damp) * 0.85);
	},

	Color: function (planet, sample, overlay, light) {
		var lands = planet.Lands || [];
		var shade = 0.6 + 0.4 * (light === undefined ? 1 : light);
		var t;
		var color;
		var hue;

		function low (name) {
			var found = lands.filter(function (land) {
				return land.Name === name;
			})[0];
			var ground = found && found.Ground || {};

			return ground.Low || [0.3, 0.5, 0.22];
		}

		/*
		 * Of the picture of a square (Pictured): the colors of the lands that hold there, each by how well (Mixed of its
		 * sample). Regression: of its first land only, a land whose land changes with its height (hills about a bound of
		 * two) was a chessboard of the colors of both, a texel each.
		 */
		function biome () {
			var sum = [0, 0, 0];

			if (!sample.Pictured || !sample.Mixed || sample.Mixed.length < 2 || sample.Mixed[0].Name !== sample.Biome) return low(sample.Biome);

			sample.Mixed.forEach(function (one) {
				var color = low(one.Name);

				sum[0] += color[0] * one.Weight;
				sum[1] += color[1] * one.Weight;
				sum[2] += color[2] * one.Weight;
			});

			return sum;
		}

		function ramp (stops, value) {
			var k;

			for (k = 1; k < stops.length; k++) {
				if (value <= stops[k][0] || k === stops.length - 1) {
					var a = stops[k - 1];
					var b = stops[k];
					var u = Math.max(0, Math.min(1, (value - a[0]) / ((b[0] - a[0]) || 1)));

					return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
				}
			}

			return [stops[0][1], stops[0][2], stops[0][3]];
		}

		if (overlay === 'temperature') {
			color = ramp([[0, 0.2, 0.3, 0.8], [0.35, 0.4, 0.75, 0.95], [0.55, 0.95, 0.9, 0.5], [0.75, 0.95, 0.55, 0.2], [1, 0.75, 0.12, 0.1]], sample.Temperature);
		}
		else if (overlay === 'moisture') {
			color = ramp([[0, 0.85, 0.7, 0.45], [0.4, 0.75, 0.8, 0.5], [0.7, 0.3, 0.65, 0.5], [1, 0.12, 0.35, 0.65]], sample.Moisture);
		}
		else if (overlay === 'biomes') {
			color = sample.Land ? biome() : [0.16, 0.3, 0.5];
		}
		else if (overlay === 'plates') {
			hue = (sample.Plate.ID * 0.618034) % 1;
			color = [0.55 + 0.35 * Math.cos(hue * 6.283), 0.55 + 0.35 * Math.cos(hue * 6.283 - 2.1), 0.55 + 0.35 * Math.cos(hue * 6.283 + 2.1)];
			t = Math.max(0, 1 - sample.Plate.Boundary / 60);

			if (t > 0)
				color = sample.Plate.Push > 0 ? [color[0] + (0.85 - color[0]) * t, color[1] * (1 - t * 0.7), color[2] * (1 - t * 0.7)] : [color[0] * (1 - t * 0.7), color[1] * (1 - t * 0.4), color[2] + (0.9 - color[2]) * t];

			if (!sample.Land)
				color = color.map(function (part) {
					return part * 0.7;
				});
		}
		else {
			if (sample.Land) {
				color = biome();

				/* Its deserts and basins (of the picture of a square its own: Pictured); a wet basin a lake. */
				if (!sample.Pictured) {
					var basin = Math.max(0, Math.min(1, (6 - sample.Elevation) / 5));
					var damp = Math.max(0, Math.min(1, (sample.Moisture - 0.3) / 0.25));

					color = this.Desert(color, this.Arid(sample, planet.Radius), basin * basin * (3 - 2 * basin), damp);
				}

				t = Math.min(1, sample.Elevation / 4500);
				color = [color[0] + (0.5 - color[0]) * t * 0.7, color[1] + (0.45 - color[1]) * t * 0.7, color[2] + (0.4 - color[2]) * t * 0.7];

				/*
				 * High, bare rock grey and brown; snow coming in as it gets colder, never all of it (the rock of the slopes shows).
				 * Regression: all colder than -6 degrees one white, the ranges a flat field of snow from orbit.
				 */
				t = Math.max(0, Math.min(1, (sample.Elevation - 1800) / 2400));
				t = t * t * (3 - 2 * t) * 0.75;
				color = [color[0] + (0.38 - color[0]) * t, color[1] + (0.34 - color[1]) * t, color[2] + (0.3 - color[2]) * t];
				t = Math.max(0, Math.min(1, (-5 - sample.Celsius) / 8));
				t = t * t * (3 - 2 * t) * 0.85;
				color = [color[0] + (0.92 - color[0]) * t, color[1] + (0.94 - color[1]) * t, color[2] + (0.97 - color[2]) * t];
			}
			else {
				/* Regression: the deep sea was of many blues, patches of camouflage from orbit; as the Earth, one dark blue, lighter only on its shelves. */
				color = ramp([[-7000, 0.03, 0.09, 0.27], [-2000, 0.04, 0.12, 0.32], [-200, 0.1, 0.3, 0.52], [0, 0.3, 0.6, 0.7]], sample.Elevation);

				if (sample.Celsius < -12)
					color = [0.85, 0.9, 0.95];
			}

			if (overlay === 'wind')
				color = color.map(function (part) {
					return part * 0.55 + 0.2;
				});
		}

		return [color[0] * shade, color[1] * shade, color[2] * shade];
	},

	/*
	 * A piece of the picture of a globe in a view: the pixels of rect [x0, y0, x1, y1] every step pixels (each a block of
	 * step by step), RGBA bytes row by row; off the globe clear. What a worker paints of an editor of a planet.
	 */
	Picture: function (options, view, rect, step, overlay) {
		var planet = this.Planet(options);
		var width = Math.ceil((rect[2] - rect[0]) / step);
		var height = Math.ceil((rect[3] - rect[1]) / step);
		var data = new Uint8ClampedArray(width * height * 4);
		var light = [-0.5, 0.7, 0.5];
		var x;
		var y;

		for (y = 0; y < height; y++) {
			for (x = 0; x < width; x++) {
				var direction = this.Unproject(view, rect[0] + (x + 0.5) * step, rect[1] + (y + 0.5) * step);
				var at = (y * width + x) * 4;
				var sample;
				var near;
				var color;
				var bright;
				var apart;

				if (!direction) continue;

				sample = planet.Sample(direction);

				/* The slope toward the light, of a point a little off: relief as it is seen at this scale. */
				near = planet.Elevation([direction[0] + light[0] * step * 0.004 / (view.Zoom || 1), direction[1] + light[1] * step * 0.004 / (view.Zoom || 1), direction[2] + light[2] * step * 0.004 / (view.Zoom || 1)]);
				/* The slope as metres over metres, raised the farther it is seen (as a relief map raises it), so ranges show from orbit. */
				apart = 0.004 * step / (view.Zoom || 1) * planet.Radius * 1000;
				bright = sample.Land ? Math.max(0, Math.min(1, 0.55 + (near - sample.Elevation) / apart * 1.6 * Math.max(1, Math.sqrt(apart / 500)))) : 1;
				color = this.Color(planet, sample, overlay, bright);

				data[at] = color[0] * 255;
				data[at + 1] = color[1] * 255;
				data[at + 2] = color[2] * 255;
				data[at + 3] = 255;
			}
		}

		return {Data: data, Width: width, Height: height};
	},

	/*
	 * A face of the globe as a cube of texels (Renderer: a Cube, cube.Write): face 0 to 5 as cubeDirection has them, size texels
	 * a side, rows from row on (rows of them, all by default), their first row the one of p.y = -1. RGBA bytes: the color of
	 * the relief map (Color) and, in alpha, how it shines (the sea, 0.8). What the globe of a planet in space is drawn of,
	 * the very lands its surface has.
	 */
	/*
	 * The heights of the cells of a face (cube cells, N size to a side: CellPoint at their middles) for its drainage, rows
	 * of them: {Data (Float32Array, metres, row by row of J), Face, Row, Rows}, of the planet with no river yet, no finer than
	 * a cell.
	 */
	Heights: function (options, face, size, row, rows) {
		var bare = Object.assign({}, options);
		var planet;
		var first = row || 0;
		var count = Math.min(size - first, rows || size);
		var data = new Float32Array(size * count);
		var cell = {Face: face, I: 0, J: 0, N: size};
		var i;
		var j;

		delete bare.Rivers;

		planet = this.Planet(bare);

		for (j = 0; j < count; j++) {
			for (i = 0; i < size; i++) {
				cell.I = i;
				cell.J = first + j;
				data[j * size + i] = planet.Elevation(this.CellPoint(cell, 0.5, 0.5), Math.PI / 2 * planet.Radius / size);
			}
		}

		return {Data: data, Face: face, Row: first, Rows: count};
	},

	/*
	 * The rivers of a planet of the heights of its cells (heights: 6 faces of size by size, as Heights makes them), a graph
	 * of a network (blueprints/network/rivers of NetworkBlueprints: the ways of DrainageWays, smoothed and rounded; source:
	 * the code of one of its own, NetworkBlueprints.Code(graph).Source): {Size, Rivers: [{Points (directions), Flow
	 * (cells), Level (metres of the bed: never up downstream)}]}, the Rivers of Make. least: what a river drains at the
	 * least (cells, the Least of the graph, 40).
	 */
	Drainage: function (heights, size, least, source) {
		var code = source || this.RiversCode || this.RiversSource();
		var made;

		this.RiversMade = this.RiversMade || {};

		if (!this.RiversMade[code])
			this.RiversMade[code] = new Function('B', 'M', 'N', code)(this.$Service('Blueprints'), this.$Service('Math'), this.$Service('Noise'));

		made = this.RiversMade[code](least ? {Least: least} : {}, {Heights: heights, Size: size}).Network || {Ways: []};

		return {Size: size, Rivers: made.Ways.map(function (way) {
			return {Points: way.Points, Flow: way.Values.Flow, Level: way.Values.Level};
		})};
	},

	/* The code of the graph of the rivers of the library (blueprints/network/rivers), made in the page, carried to its workers. */
	RiversCode: null,

	/* The code of the graph of the rivers of a planet of its own (its option RiversGraph), made in the page for its workers; undefined with none. */
	RiversSourceOf: function (options) {
		return options && options.RiversGraph ? this.$Service('NetworkBlueprints').Code(options.RiversGraph).Source : undefined;
	},

	RiversSource: function () {
		if (!this.RiversCode)
			this.RiversCode = this.$Service('NetworkBlueprints').Code('ElemenxGraphics/network/rivers').Source;

		return this.RiversCode;
	},

	/*
	 * The ways of the rivers of a planet of the heights of its cells, as a network (NetworkBlueprints): the land filled up
	 * from its sea (a priority flood: what is lower than all round it is filled to where it overflows, each cell draining
	 * to the one it was reached from), the water of each cell gathered downstream, and the ways of what drains least cells
	 * or more traced to the sea along the cells, each {Points (directions), Class river, Values: {Flow, Level}}.
	 */
	DrainageWays: function (heights, size, least) {
		var self = this;
		var n = size;
		var total = 6 * n * n;
		var fill = new Float32Array(total);
		var into = new Int32Array(total);
		var gathered = new Float32Array(total);
		var order = new Int32Array(total);
		var done = new Uint8Array(total);
		var heap = self.$Service('Math').Queue();
		var count = 0;
		var limit = least || 40;
		var rivers = [];
		var i;
		var k;

		function index (cell) {
			return cell.Face * n * n + cell.J * n + cell.I;
		}

		function cellOf (at) {
			var face = Math.floor(at / (n * n));
			var rest = at - face * n * n;

			return {Face: face, I: rest % n, J: Math.floor(rest / n), N: n};
		}

		/* The eight round a cell: the four of its sides (over the edges of the faces too) and the four of its corners. */
		function around (at) {
			var cell = cellOf(at);
			var list = [];

			[[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (step) {
				var i2 = cell.I + step[0];
				var j2 = cell.J + step[1];

				if (i2 >= 0 && j2 >= 0 && i2 < n && j2 < n) list.push(cell.Face * n * n + j2 * n + i2);
				else list.push(index(self.CellAt(1, Math.PI / 2 / n, self.CellPoint(cell, 0.5 + step[0], 0.5 + step[1]))));
			});

			return list;
		}

		/* The least first ([value, cell]): the Queue of Math. */
		function push (at, value) {
			heap.Push({F: value, At: at});
		}

		function pop () {
			var top = heap.Pop();

			return [top.F, top.At];
		}

		/* The sea first: each cell of it a mouth. */
		for (i = 0; i < total; i++) {
			into[i] = -1;

			if (heights[i] <= 0) {
				fill[i] = heights[i];
				done[i] = 1;

				push(i, heights[i]);
			}
		}

		while (heap.Size()) {
			var top = pop();
			var at = top[1];

			order[count++] = at;

			around(at).forEach(function (next) {
				if (done[next]) return;

				done[next] = 1;
				fill[next] = Math.max(heights[next], fill[at] + 0.01);
				into[next] = heights[at] <= 0 && fill[at] <= 0 ? -2 - at : at;

				push(next, fill[next]);
			});
		}

		/* The water: each cell its own, then all of it downstream, the highest first. */
		for (k = count - 1; k >= 0; k--) {
			var cell = order[k];
			if (heights[cell] <= 0) continue;

			gathered[cell] += 1;

			if (into[cell] >= 0)
				gathered[into[cell]] += gathered[cell];
		}

		/* The ways: from where each river begins (no river comes into it) down to the sea or to a river it joins. */
		var fed = new Uint8Array(total);
		var taken = new Uint8Array(total);

		for (i = 0; i < total; i++) {
			if (heights[i] > 0 && gathered[i] >= limit && into[i] >= 0)
				fed[into[i]] = 1;
		}

		for (i = 0; i < total; i++) {
			if (heights[i] <= 0 || gathered[i] < limit || fed[i]) continue;

			var points = [];
			var flows = [];
			var levels = [];
			var walk = i;

			while (walk >= 0 && heights[walk] > 0) {
				var point = self.CellPoint(cellOf(walk), 0.5, 0.5);

				points.push(point);
				flows.push(gathered[walk]);
				levels.push(levels.length ? Math.min(levels[levels.length - 1], fill[walk]) : fill[walk]);

				if (taken[walk]) break;

				taken[walk] = 1;
				walk = into[walk];
			}

			/* To the sea: its mouth on the coast, at level 0. */
			if (walk < -1) {
				points.push(self.CellPoint(cellOf(-2 - walk), 0.5, 0.5));
				flows.push(flows[flows.length - 1]);
				levels.push(0);
			}

			if (points.length > 1)
				rivers.push({ID: 'river-' + rivers.length, From: -1, To: -1, Points: points, Class: 'river', Closed: false, Values: {Flow: flows, Level: levels}});
		}

		return {Nodes: [], Ways: rivers};
	},

	/* A way of a river smoothed off its grid (Chaikin, twice): its corners cut, its flow and level along it. */
	Smoothed: function (points, flows, levels) {
		var self = this;
		var round;

		for (round = 0; round < 2; round++) {
			var p = [points[0]];
			var f = [flows[0]];
			var l = [levels[0]];
			var k;

			for (k = 0; k + 1 < points.length; k++) {
				[0.25, 0.75].forEach(function (t) {
					p.push(self.Unit([points[k][0] + (points[k + 1][0] - points[k][0]) * t, points[k][1] + (points[k + 1][1] - points[k][1]) * t, points[k][2] + (points[k + 1][2] - points[k][2]) * t]));
					f.push(flows[k] + (flows[k + 1] - flows[k]) * t);
					l.push(levels[k] + (levels[k + 1] - levels[k]) * t);
				});
			}

			p.push(points[points.length - 1]);
			f.push(flows[flows.length - 1]);
			l.push(levels[levels.length - 1]);

			points = p;
			flows = f;
			levels = l;
		}

		return {Points: points.map(function (point) {
			return point.map(function (value) {
				return Math.round(value * 1e7) / 1e7;
			});
		}), Flow: flows.map(Math.round), Level: levels.map(Math.round)};
	},

	/*
	 * Rivers kept under a key (UseRivers), for a planet to name in place of carrying them (Rivers: the key): in the page and
	 * in the workers that make grounds of planets (shared to them once).
	 */
	/*
	 * The settlements of a planet, where people would live: points of its land scored by their climate (warm enough, not
	 * too dry nor too wet), their height (low), their rivers (the more they drain, the more) and their coasts; the best
	 * taken first, each kept apart from the others by its size: a few cities, more towns, many villages. count: the points
	 * tried (20000). Gives {Settlements: [{Point (direction), Size (0 to 1), Kind (city, town, village)}]}: the Settlements
	 * of a planet (a key of UseSettlements, or the list).
	 */
	Settlements: function (options, count) {
		var self = this;
		var planet = this.Planet(options);
		var tries = count || 20000;
		var radius = planet.Radius;
		var places = [];
		var kept = [];
		var random = this.$Service('Random').Sequence(String(options.Seed === undefined ? 'planet' : options.Seed) + ':towns');
		/*
		 * How good a place is to live (blueprints/planet/settle, or SettleGraph of the options): of its warmth, how wet it is,
		 * how high, a river near and how much it carries. Regression: a formula of the code; a world told none of its own.
		 */
		var settle = this.ReliefOf('settle', options.SettleGraph, options.ReliefSources && options.ReliefSources.Settle);
		var list = settle.Inputs.map(function () {
			return 0;
		});
		var slot = {};
		var i;

		settle.Inputs.forEach(function (name, index) {
			slot[name] = index;
		});

		function scoreOf (sample, river) {
			var made;

			list[slot.Celsius] = sample.Celsius;
			list[slot.Moisture] = sample.Moisture;
			list[slot.Elevation] = sample.Elevation;
			list[slot.RiverFar] = river ? river.Far : Infinity;
			list[slot.RiverFlow] = river ? river.Flow : 0;
			made = settle.Main.apply(null, list);

			return typeof made === 'number' ? made : made[(settle.Keys || []).indexOf('Score')];
		}

		for (i = 0; i < tries; i++) {
			var spiral = this.$Service('Math').Spiral(i, tries);
			/* Off the even spiral by up to its step, at random: towns never stand in rows. */
			var step = Math.sqrt(4 * Math.PI / tries);
			var p = this.Unit([spiral[0] + (random() - 0.5) * step * 1.4, spiral[1] + (random() - 0.5) * step * 1.4, spiral[2] + (random() - 0.5) * step * 1.4]);
			var sample = planet.Sample(p, 20);
			var score;
			var river;

			if (!sample.Land || sample.Elevation > 2200) continue;

			river = planet.River(p);
			score = scoreOf(sample, river);

			if (score > 0.05)
				places.push({Point: p, Score: score * (0.5 + random())});
		}

		places.sort(function (a, b) {
			return b.Score - a.Score;
		});

		/* The best first, each apart from those kept: a city by 400 km, a town by 120, a village by 40. */
		places.forEach(function (place, index) {
			var share = index / Math.max(1, places.length);
			var kind = self.KindByShare(share);
			var apart = self.Kind(kind).Apart / radius;
			var near = kept.some(function (other) {
				var d = place.Point[0] * other.Point[0] + place.Point[1] * other.Point[1] + place.Point[2] * other.Point[2];

				return Math.acos(Math.max(-1, Math.min(1, d))) < Math.max(apart, other.Apart);
			});
			if (near) return;

			kept.push({Point: place.Point.map(function (value) {
				return Math.round(value * 1e7) / 1e7;
			}), Size: Math.round(Math.min(1, place.Score) * 100) / 100, Kind: kind, Apart: apart});
		});

		/* What a developer changed of them laid over them (Places). */
		return {Settlements: this.PlacedTowns(options, kept.map(function (town) {
			return {Point: town.Point, Size: town.Size, Kind: town.Kind};
		}))};
	},

	/* The settlements kept under a key, as UseRivers keeps rivers. */
	UseSettlements: function (key, towns) {
		var self = this;

		this.TownSets[key] = towns;

		['ScenePlanet', 'SceneTerrainGenerator', 'SceneSower', 'SceneRoads'].forEach(function (name) {
			var service = name === 'ScenePlanet' ? self : self.$Service(name);
			if (service && service.Work)
				service.Work().Share('towns:' + key, towns);
		});
	},

	TownsOf: function (key) {
		var kept = this.TownSets ? this.TownSets[key] : null;

		return kept || (this.$Shared ? this.$Shared('towns:' + key) : null) || [];
	},

	TownSets: {},

	/*
	 * The rules of detail of planets by their names: the generator graphs of the resources named <Library>/rules/<name> (an
	 * Application's in the place of one of a Library of the same name), carried to the workers.
	 */
	Rules: {},

	/*
	 * Its rivers (resources/planet/rivers): Width (km a root of the flow), Bend (a bend is that many widths long), Valley and
	 * ValleyPower (km, of the flow), Channel (km a root of the flow), Color, Highway (the colour of a highway by them).
	 */
	Rivers: {Width: 0.015, Bend: 11, Valley: 0.6, ValleyPower: 0.4, Channel: 0.04, Color: [0.16, 0.34, 0.58], Highway: [0.42, 0.4, 0.38]},

	/*
	 * The numbers of a kind of settlement on a planet (Planet of resources/terrain/settlement-kinds, of SceneTerrainGenerator):
	 * Share (of the places, the best first), Apart (km from another), Core and Fields (km), Lights (km its light reaches),
	 * Glow (how bright), Use (its number in the picture of what the ground is used for), Roofs (the mean colour of its houses
	 * seen from far); a kind of none, those of a village.
	 */
	Kind: function (kind) {
		var kinds = this.$Service('SceneTerrainGenerator').SettlementKinds;

		return kinds[kind] && kinds[kind].Planet || kinds.village.Planet;
	},

	/*
	 * The kind of a place by its share of all of them, the best first: the kinds of a Planet of their own, the least Share
	 * first (city, town, then village), their Shares one after another.
	 */
	KindByShare: function (share) {
		var kinds = this.$Service('SceneTerrainGenerator').SettlementKinds;
		var sum = 0;
		var found = 'village';

		Object.keys(kinds).filter(function (kind) {
			return !!kinds[kind].Planet;
		}).sort(function (a, b) {
			return kinds[a].Planet.Share - kinds[b].Planet.Share;
		}).some(function (kind) {
			sum += kinds[kind].Planet.Share;
			found = kind;

			return share < sum;
		});

		return found;
	},

	/* How a tile of its climate keeps it in bytes: degrees Celsius from Low to High, winds of -Wind to Wind m/s. */
	ClimateCode: {Low: -40, High: 50, Wind: 16},

	/* The warmth of a temperature, 0 at -25 degrees Celsius to 1 at 35: what the lands of a planet are chosen by (BiomeOf). */
	Warmth: function (celsius) {
		return Math.max(0, Math.min(1, (celsius + 25) / 60));
	},

	/* The width of a river of a flow, km; its valley; the channel of its water as a globe paints it. */
	RiverWidth: function (flow) {
		return this.Rivers.Width * Math.sqrt(Math.max(1, flow));
	},

	RiverValley: function (flow) {
		return this.Rivers.Valley * Math.pow(flow, this.Rivers.ValleyPower);
	},

	RiverChannel: function (flow) {
		return this.Rivers.Channel * Math.sqrt(flow);
	},

	/* The numbers of a planet that tells none (resources/planet/defaults): Seed, Radius, Ocean, Relief, Mountains, Depth, Plates, Detail. */
	Defaults: {},

	/*
	 * The types of the surfaces of bodies (resources/planet/surface-types): {Shader (the look the shader of a body draws: 0
	 * rock, 1 land and sea, 2 ice, 3 lava, 4 bands of gas), Giant (of gas: no ground to land on, decks of cloud to go down
	 * into)}. Regression: a giant told by its two names in six places, the looks in a table of the Scene.
	 */
	SurfaceTypes: {},

	/* The type of a surface: of SurfaceTypes, a rocky one of a type of none. */
	SurfaceType: function (type) {
		return Object.prototype.hasOwnProperty.call(this.SurfaceTypes, type) ? this.SurfaceTypes[type] : {Shader: 0, Giant: false};
	},

	/* A body of a surface of this type is a giant of gas. */
	Giant: function (type) {
		return !!this.SurfaceType(type).Giant;
	},

	Carried: ['Rules', 'Defaults', 'SurfaceTypes', 'Rivers', 'ClimateCode', 'ReliefCode', 'ReliefNames', 'PlateCode', 'PictureCode', 'RiversCode', 'Paint'],

	/*
	 * The graphs of the land and of the relief of a planet made code (blueprints/planet/land and relief): {land, relief:
	 * {Source, Inputs (in their order)}}, made in the page as a planet first has them (ReliefRun), carried to its workers
	 * (Source: a worker makes no code).
	 */
	ReliefCode: {},

	/* Its graphs, each of blueprints/planet/<name> and of an option <Name>Graph. */
	ReliefNames: ['Land', 'Relief', 'Rough', 'Wind', 'Climate', 'Settle', 'Tectonic', 'Upwind', 'Valley', 'Edit'],

	/* The inputs of its graphs that are lists of numbers (floats): the middles and the motions of its plates, by threes. */
	ReliefLists: {Middles: 'floats', Motions: 'floats', Oceans: 'floats', Lands: 'floats', Seas: 'floats', Rivers: 'floats', Edits: 'floats', Softs: 'floats'},

	/* The graph of the library of the land or of the relief of a planet (land, relief) as a function: {Main, Inputs}. */
	ReliefRun: function (name) {
		var kept = (this.ReliefCode || {})[name];
		var graph;

		if (!kept && typeof Elemenx !== 'undefined' && Elemenx.Compilers && typeof Elemenx.Resources === 'function') {
			graph = Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/' + name);

			if (graph) {
				this.ReliefCode = this.ReliefCode || {};
				this.ReliefCode[name] = this.ReliefMake(graph, name === 'upwind' ? {Rough: 'ElemenxGraphics/planet/rough'} : null);
				kept = this.ReliefCode[name];
			}
		}

		if (!kept)
			throw new Error('Elemenx ScenePlanet: there is no graph of the ' + name + ' of a planet');

		return this.ReliefOf(name, null, kept);
	},

	/*
	 * The code of a graph of the land or of the relief of a planet ({Source, Inputs}), made of it in the page: a planet of a
	 * graph of its own (LandGraph, ReliefGraph: a graph or the name of one in the resources).
	 */
	ReliefMake: function (graph, values) {
		var blueprints = this.$Service('Blueprints');
		var read = typeof graph === 'string' ? Elemenx.Resources('Blueprints', graph) : graph;
		var made = blueprints.NumericCode(values ? blueprints.Fill(JSON.parse(JSON.stringify(blueprints.Read(read))), values) : read, {}, this.ReliefLists);
		if (!made)
			throw new Error('Elemenx ScenePlanet: a graph of the relief of a planet is not of numbers');

		return {Source: made.Source, Keys: made.Keys, Inputs: made.Numeric.Inputs.map(function (one) {
			return one.Name;
		})};
	},

	/*
	 * The code of the graphs of its own of the options of a planet (LandGraph.. ClimateGraph), made in the page:
	 * {Land.. Climate: {Source, Inputs, Keys}} of those it has; undefined with none (what ReliefSources is to a worker).
	 */
	GraphSources: function (options) {
		var self = this;
		var made;

		this.ReliefNames.forEach(function (name) {
			if (!options || !options[name + 'Graph'] || name === 'Upwind') return;

			made = made || {};
			made[name] = self.ReliefMake(options[name + 'Graph']);
		});

		/* Its walk up the wind of a graph of its own, or of its own graph of the land roughly (UpwindGraph, RoughGraph). */
		if (options && (options.UpwindGraph || options.RoughGraph)) {
			made = made || {};
			made.Upwind = this.UpwindMake(options);
		}

		/* Its far ground of a graph of its own (GroundFarGraph: how a texel of the picture of a square looks). */
		if (options && options.GroundFarGraph) {
			made = made || {};
			made.GroundFar = this.PictureMake(options.GroundFarGraph);
		}

		/* Its plates of a graph of its own (PlateGraph): of its Code, not of numbers (the numbers of its seed are of a text). */
		if (options && options.PlateGraph) {
			made = made || {};
			made.Plate = {Source: this.$Service('Blueprints').Code(typeof options.PlateGraph === 'string' ? Elemenx.Resources('Blueprints', options.PlateGraph) : options.PlateGraph).Source};
		}

		return made;
	},

	/*
	 * The walk up the wind of a planet (blueprints/planet/upwind, or UpwindGraph: its own) as a function {Main, Inputs, Keys},
	 * its steps calling its graph of the land roughly (RoughGraph: its own, else that of the library): of its code made in
	 * the page (ReliefSources.Upwind), else made here.
	 */
	UpwindOf: function (options) {
		var code = options.ReliefSources && options.ReliefSources.Upwind;
		if (code)
			return this.ReliefOf('upwind', null, code);

		if (!options.UpwindGraph && !options.RoughGraph) return this.ReliefRun('upwind');

		return this.ReliefOf('upwind', null, this.UpwindMake(options));
	},

	/*
	 * The code of the walk up the wind of options ({Source, Inputs, Keys}): its graph filled with the name of its graph of the
	 * land roughly (one of its own put in the resources under a name of its blocks).
	 */
	UpwindMake: function (options) {
		var blueprints = this.$Service('Blueprints');
		var rough = options.RoughGraph;
		var name = 'ElemenxGraphics/planet/rough';

		if (typeof rough === 'string') {
			name = rough;
		}
		else if (rough) {
			name = 'ScenePlanet/rough-' + blueprints.Hash(blueprints.Read(rough));

			if (!Elemenx.Resources('Blueprints', name))
				Elemenx.Resources('Blueprints', name, rough);
		}

		return this.ReliefMake(options.UpwindGraph || 'ElemenxGraphics/planet/upwind', {Rough: name});
	},

	/* Areas drawn of a kind packed for the block Painted (Geometry.Painted): [count, each its count of points, its edge (radians, of Edge km, 200), its directions]. */
	PaintedOf: function (strokes, kind, radius) {
		var self = this;
		var packed = [0];

		(strokes || []).forEach(function (stroke) {
			if (stroke.Type !== kind || !stroke.Directions.length) return;

			packed[0]++;

			packed.push(stroke.Directions.length, Math.max(1, Number(stroke.Edge) || self.Paint.Area.Edge) / radius);

			stroke.Directions.forEach(function (direction) {
				packed.push(direction[0], direction[1], direction[2]);
			});
		});

		return packed;
	},

	/*
	 * Lines drawn of a kind (mountains, rift, river) packed for the block Strokes (Geometry.Strokes): [count, each its count
	 * of points, its Reach (radians: its Width km, of the stroke or of the table, at least Least, times Reach), Amount (of its
	 * field Of, else of the table), Power, its directions]. Its numbers of resources/planet/paint (Paint).
	 */
	StrokesOf: function (strokes, kind, radius) {
		var table = this.Paint[kind.charAt(0).toUpperCase() + kind.slice(1)];
		var packed = [0];

		(strokes || []).forEach(function (stroke) {
			var width;

			if (stroke.Type !== kind || !stroke.Directions.length) return;

			width = Math.max(table.Least, Number(stroke.Width) || table.Width) / radius;
			packed[0]++;

			packed.push(stroke.Directions.length, width * table.Reach, table.Of ? Number(stroke[table.Of]) || table.Amount : table.Amount, table.Power);

			stroke.Directions.forEach(function (direction) {
				packed.push(direction[0], direction[1], direction[2]);
			});
		});

		return packed;
	},

	/*
	 * What a developer draws on a planet (resources/planet/paint): of ranges (Mountains), rifts and rivers their Width (km),
	 * Least (km at least), Reach (how many widths they reach), Amount (of their field Of, when they tell none), Power (of
	 * their fall to their sides); of areas their Edge (km).
	 */
	Paint: {Mountains: {Width: 150, Least: 1, Reach: 1, Amount: 4000, Of: 'Height', Power: 1.5}, Rift: {Width: 60, Least: 1, Reach: 1, Amount: 1200, Of: 'Depth', Power: 1}, River: {Width: 6, Least: 0.1, Reach: 4, Amount: 0.85, Of: '', Power: 1}, Area: {Edge: 200}},

	/* The code of the graph of the plates of the library (blueprints/planet/plate), made in the page (Code), carried to its workers. */
	PlateCode: '',

	PlateSource: function () {
		if (!this.PlateCode)
			this.PlateCode = this.$Service('Blueprints').Code(Elemenx.Resources('Blueprints', 'ElemenxGraphics/planet/plate')).Source;

		return this.PlateCode;
	},

	/*
	 * The code of the graph of the far ground of the library (blueprints/shader/ground-far: how a texel of the picture of a
	 * square looks, PatchPicture), of numbers: [{Source, Keys, Inputs}] of its results by fours (PictureKeys: a generator of
	 * numbers gives up to four), made in the page, carried to its workers.
	 */
	PictureCode: null,

	PictureKeys: [['R', 'G', 'B', 'Water'], ['Trees', 'Farm', 'Built', 'Dune'], ['Snow']],

	/*
	 * The graph of the far ground as functions, each of the inputs in their order (Inputs) of its results (Keys): of Land,
	 * Coast, Height, Rise, Moisture, Celsius, Slope, Dry, Erg, Stone, LandR/G/B, SeaR/G/B, Farm, Built, RoofR/G/B, River,
	 * Flow, Far, Width, Plain, StreamR/G/B, Road, Along, HighwayR/G/B, Texel, Woods; R, G, B, Water, Trees, Farm, Built,
	 * Dune, Snow. A river or a road in a texel far wider than it is as much of it as it covers (the same mean at every
	 * size): Width the half of its channel, Far (Along of a road) the distance of the middle of the texel from it, km.
	 */
	PictureRun: function (graph, code) {
		var self = this;
		var codes = code || (graph ? this.PictureMake(graph) : null);

		if (!codes) {
			this.PictureCode = this.PictureCode || this.PictureMake('ElemenxGraphics/shader/ground-far');
			codes = this.PictureCode;
		}

		return codes.map(function (one) {
			return self.ReliefOf('ground-far', null, one);
		});
	},

	/*
	 * The code of a graph of the far ground (a graph or the name of one in the resources), made in the page: [{Source, Keys,
	 * Inputs}] of its results by fours (PictureKeys); a planet of one of its own (GroundFarGraph) carries it to its workers
	 * (ReliefSources.GroundFar).
	 */
	PictureMake: function (graph) {
		var self = this;
		var read = typeof graph === 'string' ? Elemenx.Resources('Blueprints', graph) : graph;

		return this.PictureKeys.map(function (keys) {
			var made = self.$Service('Blueprints').NumericCode(read, {}, {}, keys);
			if (!made)
				throw new Error('Elemenx ScenePlanet: a graph of the far ground is not of numbers');

			return {Source: made.Source, Keys: made.Keys, Inputs: made.Numeric.Inputs.map(function (one) {
				return one.Name;
			})};
		});
	},

	/*
	 * The plate of a planet of its graph, a function (parameters, {Index, Count, Seed, Ocean}) of {MX, MY, MZ (its middle),
	 * VX, VY, VZ (its motion), Oceanic}: of its code made in the page (source: ReliefSources.Plate), else of its graph
	 * (PlateGraph), else the library's.
	 */
	PlateOf: function (graph, source) {
		var text = source && source.Source || (graph ? this.$Service('Blueprints').Code(typeof graph === 'string' ? Elemenx.Resources('Blueprints', graph) : graph).Source : this.PlateSource());

		this.PlateMade = this.PlateMade || {};

		if (!this.PlateMade[text])
			this.PlateMade[text] = new Function('B', 'M', 'N', text)(this.$Service('Blueprints'), this.$Service('Math'), this.$Service('Noise'));

		return this.PlateMade[text];
	},

	/* The function of a graph of a planet: of its code (made in the page), else of its graph, else the library's (name). */
	ReliefOf: function (name, graph, code) {
		var made = code || (graph ? this.ReliefMake(graph) : null);
		if (!made)
			return this.ReliefRun(name);

		this.ReliefMade = this.ReliefMade || {};

		if (!this.ReliefMade[made.Source])
			this.ReliefMade[made.Source] = {Main: new Function('B', 'M', 'N', made.Source)().Main, Inputs: made.Inputs, Keys: made.Keys};

		return this.ReliefMade[made.Source];
	},

	/* What a rule reads of the place: the names of its inputs (the climate and the rivers are reckoned only for one that reads them). */
	RuleReads: function (graph) {
		return (graph.blocks || []).filter(function (block) {
			return block.type === 'Input';
		}).map(function (block) {
			return ((block.properties || []).filter(function (property) {
				return property.key === 'Name';
			})[0] || {}).value;
		});
	},

	/* The code of a rule of a planet: of its seed and the values given to it, in a copy of it ({Seed} and its parameters). {Source, Run, Reads}; null with none. */
	RuleCode: function (graph, name, seed, values) {
		var blueprints = this.$Service('Blueprints');
		var filled = blueprints.Fill(JSON.parse(JSON.stringify(blueprints.Read(graph))), Object.assign({Seed: seed + ':' + name}, values || {}));
		/* Of numbers: typed (Blueprints.NumericCode, its values filled in); else its Code. */
		var made = blueprints.NumericCode && blueprints.NumericCode(filled, {}) || blueprints.Code(filled);

		return made ? {Source: made.Source, Run: made.Run, Reads: this.RuleReads(graph)} : null;
	},

	/*
	 * Options of a planet with the code of the rules it uses made here (Rules.Sources, Rules.Reads): a worker runs it as it
	 * is (a worker makes no graph into code). The rules of its Biomes and of its regions, its own and those of its data.
	 */
	Ruled: function (options) {
		var self = this;
		var out = Object.assign({}, options || {});
		var rules = out.Rules || {};
		var data = out.Data !== undefined && out.Data !== null && out.Data !== '' ? this.DataOf(out.Data) : null;
		var regions = (out.Regions || []).concat(data && data.Edits && data.Edits.Regions || []);
		var seed = String(out.Seed !== undefined ? out.Seed : data ? data.Manifest.Seed : 'planet');
		var names = {};
		var key;
		var sources = {};
		var reads = {};

		/* Its own graphs of its land, relief and climate (LandGraph.. ClimateGraph) made code here, as ReliefSources. */
		if (this.GraphSources(out))
			out.ReliefSources = Object.assign({}, out.ReliefSources, this.GraphSources(out));

		Object.keys(rules.Biomes || {}).forEach(function (biome) {
			names[rules.Biomes[biome]] = true;
		});
		regions.forEach(function (region) {
			names[region.Rule] = true;
		});
		delete names.generated;

		if (!Object.keys(names).length) return out;

		key = JSON.stringify([seed, Object.keys(names).sort(), rules.Graphs || null, rules.Parameters || null]);
		this.RuledCache = this.RuledCache || {};

		if (!this.RuledCache[key]) {
			Object.keys(names).forEach(function (name) {
				var graph = rules.Graphs && rules.Graphs[name] || self.Rules[name];
				var made = graph ? self.RuleCode(graph, name, seed, rules.Parameters && rules.Parameters[name]) : null;
				if (!made) return;

				sources[name] = made.Source;
				reads[name] = made.Reads;
			});

			this.RuledCache = {};
			this.RuledCache[key] = {Sources: sources, Reads: reads};
		}

		out.Rules = Object.assign({}, rules, this.RuledCache[key]);

		return out;
	},

	$OnCreate: function () {
		var self = this;
		var found = typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Blueprints') || [] : [];

		this.Defaults = Object.assign({}, typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Data', 'ElemenxGraphics/planet/defaults') || {} : {});
		this.SurfaceTypes = Object.assign({}, typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Data', 'ElemenxGraphics/planet/surface-types') || {} : {});
		this.Rivers = Object.assign({}, this.Rivers, typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Data', 'ElemenxGraphics/planet/rivers') || {} : {});
		this.Paint = Object.assign({}, this.Paint, typeof Elemenx !== 'undefined' && Elemenx.Resources ? Elemenx.Resources('Data', 'ElemenxGraphics/planet/paint') || {} : {});

		found.forEach(function (name) {
			var match = /(^|\/)rules\/([^/]+)$/.exec(name);
			if (match)
				self.Rules[match[2]] = Elemenx.Resources('Blueprints', name);
		});
	},

	/* The settlements of a planet of options: given (a list or a key), else those of its data (DataVectors); [] with none. */
	TownsFor: function (options) {
		var given = this.Vectored(options);

		return Array.isArray(given.Settlements) ? given.Settlements : given.Settlements ? this.TownsOf(given.Settlements) : [];
	},

	/*
	 * The lights of its settlements at night on a face of its globe (texels as Face lays them): how much light each texel
	 * gives, 0 to 255, each settlement a soft spot as wide as it is large (a city 40 km, a village 6). {Data, Face, Row, Rows}.
	 */
	Lights: function (options, face, size, row, rows) {
		var self = this;
		var towns = this.TownsFor(options);
		var radius = Number(options.Radius) || this.Defaults.Radius;
		var first = row || 0;
		var count = Math.min(size - first, rows || size);
		var data = new Uint8Array(size * count);
		var buckets = {};
		var x;
		var y;

		towns.forEach(function (town) {
			var cell = self.CellAt(1, Math.PI / 2 / 32, town.Point);

			[cell].concat(self.CellNeighbours(1, Math.PI / 2 / 32, cell)).forEach(function (near) {
				(buckets[near.ID] = buckets[near.ID] || []).push(town);
			});
		});

		for (y = 0; y < count; y++) {
			for (x = 0; x < size; x++) {
				var a = -1 + (x + 0.5) * 2 / size;
				var b = -1 + (first + y + 0.5) * 2 / size;
				var way = this.Unit(face === 0 ? [1, -b, -a] : face === 1 ? [-1, -b, a] : face === 2 ? [a, 1, b] : face === 3 ? [a, -1, -b] : face === 4 ? [a, -b, 1] : [-a, -b, -1]);
				var found = buckets[this.CellAt(1, Math.PI / 2 / 32, way).ID] || [];
				var light = 0;

				found.forEach(function (town) {
					/* Never less than a texel: from far a village is a speck of light, not nothing. */
					var reach = Math.max(self.Kind(town.Kind).Lights * (0.6 + town.Size * 0.6) / radius, Math.PI / 2 / size * 1.3);
					var d = Math.acos(Math.max(-1, Math.min(1, way[0] * town.Point[0] + way[1] * town.Point[1] + way[2] * town.Point[2])));
					if (d < reach)
						light += Math.pow(1 - d / reach, 1.5) * self.Kind(town.Kind).Glow;
				});

				data[y * size + x] = Math.min(255, Math.round(light * 255));
			}
		}

		return {Data: data, Face: face, Row: first, Rows: count};
	},

	/*
	 * The highways of a planet: its cities and towns (Settlements) joined by the shortest net of them (a town to the nearest
	 * of those joined before it, cities first), each over the ground through cells of step km (20): round what is steep, over
	 * water only where it must (a bridge or a ferry costs 15 times as much), none longer than 1500 km. {Highways: [{Points
	 * (directions), Class (highway between cities, road to a town), From, To (indexes of its settlements)}]}. part of parts:
	 * only the ways whose place in the net is that part (each with Order, its place), for workers to share them: their
	 * ways put in Order (MergeHighways) are what one run of all gives.
	 */
	Highways: function (options, step, part, parts) {
		var self = this;
		var planet = this.Planet(options);
		var radius = planet.Radius;
		var size = Number(step) || 20;
		var towns = this.TownsFor(options).map(function (town, index) {
			return Object.assign({Index: index}, town);
		}).filter(function (town) {
			return town.Kind === 'city' || town.Kind === 'town';
		});
		var joined = [];
		var ways = [];
		var heights = {};

		function arc (a, b) {
			return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * radius;
		}

		function height (cell) {
			if (heights[cell.ID] === undefined)
				heights[cell.ID] = planet.Elevation(self.CellCenter(cell), size);

			return heights[cell.ID];
		}

		/*
		 * A* over the cells (Pathfinding.Search): what climbs costs more the steeper, the sea fifteen times as much. Regression:
		 * a search of its own here, one more beside the four of the Libraries.
		 */
		function route (from, to) {
			var start = self.CellAt(radius, size, from);
			var goal = self.CellAt(radius, size, to);
			var goalPoint = self.CellCenter(goal);
			var found = self.$Service('Pathfinding').Search({Start: start, Goal: goal, Limit: 30000, Key: function (cell) {
				return cell.ID;
			}, Heuristic: function (cell) {
				return arc(self.CellCenter(cell), goalPoint);
			}, Neighbors: function (cell) {
				var here = self.CellCenter(cell);
				var a = height(cell);

				return self.CellNeighbours(radius, size, cell).map(function (next) {
					var there = self.CellCenter(next);
					var b = height(next);
					var length = arc(here, there);
					var grade = Math.abs(b - a) / Math.max(1, length * 1000);

					return {Node: next, Cost: length * (1 + 400 * grade * grade) * (b <= 0 || a <= 0 ? 15 : 1)};
				});
			}});
			var path;

			if (!found)
				return null;

			path = found.Path.map(function (cell) {
				return self.CellCenter(cell);
			});

			path[0] = from;
			path[path.length - 1] = to;

			return path;
		}

		/* Fewer points: each kept where the way bends from the straight line by more than half a cell. */
		function fewer (path) {
			var kept = [path[0]];
			var i = 0;

			function near (a, b) {
				var k;

				for (k = a + 1; k < b; k++) {
					var ab = [path[b][0] - path[a][0], path[b][1] - path[a][1], path[b][2] - path[a][2]];
					var t = Math.max(0, Math.min(1, ((path[k][0] - path[a][0]) * ab[0] + (path[k][1] - path[a][1]) * ab[1] + (path[k][2] - path[a][2]) * ab[2]) / Math.max(1e-18, self.Dot(ab, ab))));
					var q = [path[a][0] + ab[0] * t - path[k][0], path[a][1] + ab[1] * t - path[k][1], path[a][2] + ab[2] * t - path[k][2]];
					if (Math.sqrt(self.Dot(q, q)) * radius > size * 0.5) return false;
				}

				return true;
			}

			while (i < path.length - 1) {
				var far = path.length - 1;

				while (far > i + 1 && !near(i, far))
					far--;

				kept.push(path[far]);

				i = far;
			}

			return kept.map(function (point) {
				return point.map(function (value) {
					return Math.round(value * 1e7) / 1e7;
				});
			});
		}

		/* Cities first, then towns: each to the nearest joined before it within 1500 km. */
		towns.sort(function (a, b) {
			return (a.Kind === 'city' ? 0 : 1) - (b.Kind === 'city' ? 0 : 1) || b.Size - a.Size;
		});

		towns.forEach(function (town) {
			var best = null;

			joined.forEach(function (other) {
				var d = arc(town.Point, other.Point);
				if (d < 1500 && (!best || d < best.D))
					best = {D: d, Other: other};
			});

			joined.push(town);

			if (best)
				ways.push({From: town, To: best.Other, Class: town.Kind === 'city' && best.Other.Kind === 'city' ? 'highway' : 'road'});
		});

		var share = Number(parts) > 1 ? Number(parts) : 0;

		return {Highways: ways.map(function (way, order) {
			var path;
			var made;

			if (share && order % share !== Number(part || 0)) return null;

			path = route(way.From.Point, way.To.Point);
			made = path ? {Points: fewer(path), Class: way.Class, From: way.From.Index, To: way.To.Index} : null;

			if (made && share)
				made.Order = order;

			return made;
		}).filter(Boolean)};
	},

	/* The ways of the parts of a run of Highways ([{Highways}] of each part), in their Order: what one run of all gives. */
	MergeHighways: function (pieces) {
		var all = [];

		(pieces || []).forEach(function (piece) {
			all = all.concat(piece && piece.Highways || []);
		});

		return {Highways: all.sort(function (a, b) {
			return a.Order - b.Order;
		}).map(function (way) {
			return {Points: way.Points, Class: way.Class, From: way.From, To: way.To};
		})};
	},

	/* The highways kept under a key, as UseRivers keeps rivers. */
	UseHighways: function (key, roads) {
		var self = this;

		this.HighwaySets[key] = roads;

		['ScenePlanet', 'SceneTerrainGenerator', 'SceneSower', 'SceneRoads'].forEach(function (name) {
			var service = name === 'ScenePlanet' ? self : self.$Service(name);
			if (service && service.Work)
				service.Work().Share('highways:' + key, roads);
		});
	},

	HighwaysOf: function (key) {
		var kept = this.HighwaySets ? this.HighwaySets[key] : null;

		return kept || (this.$Shared ? this.$Shared('highways:' + key) : null) || [];
	},

	HighwaySets: {},

	/* The rivers kept, one store for every use of the service (an object of its own, never made again). */
	RiverSets: {},

	/*
	 * The data of planets kept under a key (UseData), as UseRivers keeps rivers: the passport of each and its tiles, in the
	 * page and in the workers that make grounds of planets (its manifest and each tile shared to them once).
	 */
	DataSets: {},

	UseData: function (key, data) {
		var self = this;

		this.DataSets[key] = data;
		/* A planet made of the data that was under the key before is made again. */
		this.Planets = {};

		['ScenePlanet', 'SceneTerrainGenerator', 'SceneSower', 'SceneRoads'].forEach(function (name) {
			var service = name === 'ScenePlanet' ? self : self.$Service(name);
			if (!service || !service.Work) return;

			service.Work().Share('planet-data:' + key, data.Manifest);
			service.Work().Share('planet-edits:' + key, data.Edits || null);

			Object.keys(data.Tiles).forEach(function (tile) {
				service.Work().Share('planet-tile:' + key + ':' + tile, data.Tiles[tile]);
			});
		});

		/* Its vectors under keys of their own (DataVectors), as rivers, settlements and highways made in the page are kept. */
		Object.keys(data.Vectors || {}).forEach(function (name) {
			var use = {Rivers: 'UseRivers', Settlements: 'UseSettlements', Highways: 'UseHighways'}[name];
			if (use)
				self[use]('planet:' + key + ':' + name, data.Vectors[name]);
		});
	},

	/*
	 * The keys of the vectors of the planet of data under a key (UseData keeps its rivers, settlements and highways under
	 * them): {Rivers, Settlements, Highways} of those it has.
	 */
	DataVectors: function (key) {
		var data = key === undefined || key === null || key === '' ? null : this.DataOf(key);
		var out = {};

		Object.keys(data && data.Manifest.Vectors || {}).forEach(function (name) {
			out[name] = 'planet:' + key + ':' + name;
		});

		return out;
	},

	/* Options of a planet with the vectors of its data (DataVectors) where they name none. */
	Vectored: function (options) {
		var out = Object.assign({}, options || {});
		var vectors = this.DataVectors(out.Data);

		Object.keys(vectors).forEach(function (name) {
			if (out[name] === undefined)
				out[name] = vectors[name];
		});

		return out;
	},

	/* Tiles that came to the data under a key (PlanetData.Need): given to the workers too; the page reads them at once. */
	AddTiles: function (key, names) {
		var self = this;
		var data = this.DataSets[key];
		if (!data) return;

		['ScenePlanet', 'SceneTerrainGenerator', 'SceneSower', 'SceneRoads'].forEach(function (name) {
			var service = name === 'ScenePlanet' ? self : self.$Service(name);
			if (!service || !service.Work) return;

			(names || []).forEach(function (tile) {
				if (data.Tiles[tile])
					service.Work().Share('planet-tile:' + key + ':' + tile, data.Tiles[tile]);
			});
		});
	},

	/* The data kept under a key: {Manifest, Edits (its brushes and baked grounds, of edits.json), Tile(name)}; null with none. */
	DataOf: function (key) {
		var self = this;
		var kept = this.DataSets ? this.DataSets[key] : null;
		var manifest = kept ? kept.Manifest : this.$Shared ? this.$Shared('planet-data:' + key) : null;
		if (!manifest) return null;

		return {Manifest: manifest, Edits: kept ? kept.Edits || null : this.$Shared('planet-edits:' + key) || null, Tile: function (name) {
			return kept ? kept.Tiles[name] : self.$Shared('planet-tile:' + key + ':' + name);
		}};
	},

	/* The name of a tile of the data of a planet (PlanetData): its layer, face, level and place. */
	TileName: function (layer, face, level, x, y) {
		return layer + '/' + face + '/' + level + '/' + x + '-' + y;
	},

	/* The direction of a point of a face of the cube (0 to 5, as cubeDirection has them), s and t 0 to 1 across it, placed by equal angles. */
	TileDirection: function (face, s, t) {
		var x = Math.tan((s * 2 - 1) * Math.PI / 4);
		var y = Math.tan((t * 2 - 1) * Math.PI / 4);
		var d = face === 0 ? [1, -y, -x] : face === 1 ? [-1, -y, x] : face === 2 ? [x, 1, y] : face === 3 ? [x, -1, -y] : face === 4 ? [x, -y, 1] : [-x, -y, -1];
		var length = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);

		return [d[0] / length, d[1] / length, d[2] / length];
	},

	/* Where a direction is on the cube: [face, s, t], as TileDirection places them. */
	TilePlace: function (direction) {
		var ax = Math.abs(direction[0]);
		var ay = Math.abs(direction[1]);
		var az = Math.abs(direction[2]);
		var face;
		var x;
		var y;

		if (ax >= ay && ax >= az) {
			face = direction[0] > 0 ? 0 : 1;
			x = (face === 0 ? -direction[2] : direction[2]) / ax;
			y = -direction[1] / ax;
		}
		else if (ay >= az) {
			face = direction[1] > 0 ? 2 : 3;
			x = direction[0] / ay;
			y = (face === 2 ? direction[2] : -direction[2]) / ay;
		}
		else {
			face = direction[2] > 0 ? 4 : 5;
			x = (face === 4 ? direction[0] : -direction[0]) / az;
			y = -direction[1] / az;
		}

		return [face, (Math.atan(x) * 4 / Math.PI + 1) / 2, (Math.atan(y) * 4 / Math.PI + 1) / 2];
	},

	/*
	 * The samples of a tile of a layer of the planet of options (PlanetData.Bake, in a worker): size by size, its first and
	 * last on its edges. Height: metres (Int16Array) of its relief no finer than a texel; Biome: the place of its biome in
	 * table (Uint8Array), 0 under the sea; Climate (rgba8: Uint8Array of four a sample): its warmth (-40 to 50 °C), how
	 * wet it is, and its wind east and north (-16 to 16 m/s); Plate (rgba8): its plate, 255 for one under an ocean, km to
	 * the next plate by tens, and how they meet (Push, -2 to 2).
	 */
	TileValues: function (options, layer, face, level, x, y, size, table) {
		var self = this;
		var bare = Object.assign({}, options);
		var planet;
		var count = 1 << level;
		var four = layer === 'Climate' || layer === 'Plate';
		var values = layer === 'Height' ? new Int16Array(size * size) : new Uint8Array(size * size * (four ? 4 : 1));
		var made;
		var k;
		var finest;
		var direction;
		var at;
		var i;
		var j;

		delete bare.Data;

		planet = this.Planet(bare);
		finest = Math.PI / 2 * planet.Radius / (count * (size - 1));

		for (j = 0; j < size; j++) {
			for (i = 0; i < size; i++) {
				direction = this.TileDirection(face, (x + i / (size - 1)) / count, (y + j / (size - 1)) / count);

				if (layer === 'Height') {
					values[j * size + i] = Math.max(-32768, Math.min(32767, Math.round(planet.Elevation(direction, finest))));

					continue;
				}

				if (four) {
					k = (j * size + i) * 4;
					made = layer === 'Climate' ? planet.Sample(direction, finest) : planet.Plate(direction);

					if (layer === 'Climate') {
						values[k] = Math.round(Math.max(0, Math.min(1, (made.Celsius - self.ClimateCode.Low) / (self.ClimateCode.High - self.ClimateCode.Low))) * 255);
						values[k + 1] = Math.round(Math.max(0, Math.min(1, made.Moisture)) * 255);
						values[k + 2] = Math.round(Math.max(0, Math.min(1, made.Wind[0] / (self.ClimateCode.Wind * 2) + 0.5)) * 255);
						values[k + 3] = Math.round(Math.max(0, Math.min(1, made.Wind[1] / (self.ClimateCode.Wind * 2) + 0.5)) * 255);
					}
					else {
						values[k] = Math.min(255, made.ID);
						values[k + 1] = made.Oceanic ? 255 : 0;
						values[k + 2] = Math.round(Math.max(0, Math.min(255, Math.abs(made.Boundary) / 10)));
						values[k + 3] = Math.round(Math.max(0, Math.min(1, made.Push / 4 + 0.5)) * 255);
					}

					continue;
				}

				at = table.indexOf(planet.Sample(direction, finest).Biome);
				values[j * size + i] = Math.max(0, at);
			}
		}

		return values;
	},

	/*
	 * Places: what a developer changed of the settlements and the rivers a planet made (PlanetEditor), in their order, kept
	 * in its options and laid again over what it makes each time (a rebake keeps them): {Towns: [{Op: move (At, To), kind
	 * (At, Kind), remove (At) or add (Point, Kind, Size)}], Rivers: [{Op: remove (At) or add (Points, Flow)}]}. At is a
	 * direction of the settlement (the one nearest it, within 30 km) or of a point of the river (the one passing nearest,
	 * within 25 km) as it was when the change was made; a change of nothing there is left out.
	 */
	PlacedTowns: function (options, towns) {
		var self = this;
		var radius = Number(options && options.Radius) || this.Defaults.Radius;
		var list = (towns || []).map(function (town) {
			return {Point: town.Point.slice(), Size: town.Size, Kind: town.Kind};
		});

		(options && options.Places && options.Places.Towns || []).forEach(function (change) {
			var best = -1;
			var nearest = 30 / radius;

			if (change.Op === 'add') {
				if (change.Point && change.Point.length === 3)
					list.push({Point: self.Unit(change.Point), Size: change.Size === undefined ? 0.5 : Number(change.Size), Kind: change.Kind || 'village'});

				return;
			}

			if (!change.At || change.At.length !== 3) return;

			list.forEach(function (town, index) {
				var far = Math.acos(Math.max(-1, Math.min(1, self.Dot(town.Point, self.Unit(change.At)))));

				if (far < nearest) {
					nearest = far;
					best = index;
				}
			});

			if (best < 0) return;

			if (change.Op === 'remove') list.splice(best, 1);
			else if (change.Op === 'move' && change.To && change.To.length === 3) list[best].Point = self.Unit(change.To);
			else if (change.Op === 'kind' && change.Kind) list[best].Kind = change.Kind;
		});

		return list;
	},

	/* The rivers of a planet with its Places laid over them (PlacedTowns): one drawn (add) as long as its points, its flow growing to its Flow (200) down it. */
	PlacedRivers: function (options, rivers) {
		var self = this;
		var radius = Number(options && options.Radius) || this.Defaults.Radius;
		var list = (rivers || []).slice();

		/* How far a direction is from a river (radians): from the nearest of its segments. */
		function far (river, at) {
			var best = Infinity;
			var k;

			for (k = 0; k < river.Points.length; k++) {
				var a = river.Points[k];
				var b = river.Points[Math.min(k + 1, river.Points.length - 1)];
				var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
				var length = self.Dot(ab, ab);
				var t = length > 0 ? Math.max(0, Math.min(1, self.Dot([at[0] - a[0], at[1] - a[1], at[2] - a[2]], ab) / length)) : 0;
				var p = self.Unit([a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);

				best = Math.min(best, Math.acos(Math.max(-1, Math.min(1, self.Dot(p, at)))));
			}

			return best;
		}

		(options && options.Places && options.Places.Rivers || []).forEach(function (change) {
			var best = -1;
			var nearest = 25 / radius;

			if (change.Op === 'add') {
				var points = (change.Points || []).filter(function (point) {
					return point && point.length === 3;
				}).map(function (point) {
					return self.Unit(point);
				});
				var made = [];
				var flow = Number(change.Flow) > 0 ? Number(change.Flow) : 200;

				if (points.length < 2) return;

				/* A point every 10 km at most along it, as the rivers of its drainage are. */
				points.forEach(function (point, index) {
					var next = points[index + 1];
					var steps;
					var s;

					made.push(point);

					if (!next) return;

					steps = Math.ceil(Math.acos(Math.max(-1, Math.min(1, self.Dot(point, next)))) * radius / 10);

					for (s = 1; s < steps; s++)
						made.push(self.Slerp(point, next, s / steps));
				});

				list.push({Points: made, Flow: made.map(function (point, index) {
					return Math.round(flow * (0.2 + 0.8 * index / Math.max(1, made.length - 1)));
				}), Level: [], Drawn: true});

				return;
			}

			if (change.Op !== 'remove' || !change.At || change.At.length !== 3) return;

			list.forEach(function (river, index) {
				var distance = far(river, self.Unit(change.At));

				if (distance < nearest) {
					nearest = distance;
					best = index;
				}
			});

			if (best >= 0)
				list.splice(best, 1);
		});

		return list;
	},

	UseRivers: function (key, rivers) {
		var self = this;

		this.RiverSets[key] = rivers;

		['ScenePlanet', 'SceneTerrainGenerator', 'SceneSower', 'SceneRoads'].forEach(function (name) {
			var service = name === 'ScenePlanet' ? self : self.$Service(name);
			if (service && service.Work)
				service.Work().Share('rivers:' + key, rivers);
		});
	},

	RiversOf: function (key) {
		var kept = this.RiverSets ? this.RiverSets[key] : null;

		return kept || (this.$Shared ? this.$Shared('rivers:' + key) : null) || [];
	},

	Face: function (options, face, size, row, rows) {
		var planet = this.Planet(options);
		var first = row || 0;
		var count = Math.min(size - first, rows || size);
		var data = new Uint8ClampedArray(size * count * 4);
		/* How its ground leans (Relief): the way and how much, in the frame of the body, 0.5 + 2.5 times, of its heights a texel across. */
		var relief = new Uint8ClampedArray(size * count * 4);
		var finest = Math.PI / 2 * planet.Radius / size;
		/* The heights of its texels and of one more column and row round them, metres (at: of x and y from -1). */
		var heights = new Float32Array((size + 2) * (count + 2));
		var x;
		var y;

		function toward (a, b) {
			var way = face === 0 ? [1, -b, -a] : face === 1 ? [-1, -b, a] : face === 2 ? [a, 1, b] : face === 3 ? [a, -1, -b] : face === 4 ? [a, -b, 1] : [-a, -b, -1];
			var length = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]);

			return [way[0] / length, way[1] / length, way[2] / length];
		}

		function point (direction, height) {
			var r = planet.Radius + Math.max(0, height) / 1000;

			return [direction[0] * r, direction[1] * r, direction[2] * r];
		}

		for (y = 0; y < count; y++) {
			for (x = 0; x < size; x++) {
				var a = -1 + (x + 0.5) * 2 / size;
				var b = -1 + (first + y + 0.5) * 2 / size;
				var way = face === 0 ? [1, -b, -a] : face === 1 ? [-1, -b, a] : face === 2 ? [a, 1, b] : face === 3 ? [a, -1, -b] : face === 4 ? [a, -b, 1] : [-a, -b, -1];
				var length = Math.sqrt(way[0] * way[0] + way[1] * way[1] + way[2] * way[2]);
				var sample = planet.Sample([way[0] / length, way[1] / length, way[2] / length], Math.PI / 2 * planet.Radius / size);
				var color = this.Color(planet, sample, 'relief', 1);
				var at = (y * size + x) * 4;
				/* A big river shows on the globe: a line of its water where it passes the texel. */
				var river = sample.Land ? planet.River([way[0] / length, way[1] / length, way[2] / length]) : null;
				if (river && river.Flow > 60 && river.Far < Math.PI / 2 * planet.Radius / size * 0.55)
					color = this.Rivers.Color;

				/* A highway too: a grey line. */
				var road = sample.Land ? planet.Highway([way[0] / length, way[1] / length, way[2] / length]) : null;
				if (road && road.Far < Math.PI / 2 * planet.Radius / size * 0.35)
					color = this.Rivers.Highway;

				data[at] = color[0] * 255;
				data[at + 1] = color[1] * 255;
				data[at + 2] = color[2] * 255;
				data[at + 3] = sample.Land || sample.Celsius < -12 ? 10 : 204;

				heights[(y + 1) * (size + 2) + x + 1] = sample.Elevation;
			}
		}

		/* The heights of the texels round the strip: the next ones of the face (beyond its edge, the cube goes on). */
		for (y = -1; y <= count; y++) {
			for (x = -1; x <= size; x++) {
				if (y >= 0 && y < count && x >= 0 && x < size) continue;

				heights[(y + 1) * (size + 2) + x + 1] = planet.Elevation(toward(-1 + (x + 0.5) * 2 / size, -1 + (first + y + 0.5) * 2 / size), finest);
			}
		}

		/*
		 * Its slope between the texels on each side: what the globe lights its ranges by from orbit (the sea level). Of the
		 * heights its colors were made of. Regression: two more heights a texel for it, the globes of all scenes half as slow again.
		 */
		for (y = 0; y < count; y++) {
			for (x = 0; x < size; x++) {
				var at = (y * size + x) * 4;
				var a = -1 + (x + 0.5) * 2 / size;
				var b = -1 + (first + y + 0.5) * 2 / size;
				var here = toward(a, b);
				var o = (y + 1) * (size + 2) + x + 1;
				var pa = point(toward(a + 2 / size, b), heights[o + 1]);
				var pm = point(toward(a - 2 / size, b), heights[o - 1]);
				var pb = point(toward(a, b + 2 / size), heights[o + size + 2]);
				var pn = point(toward(a, b - 2 / size), heights[o - size - 2]);
				var ea = [pa[0] - pm[0], pa[1] - pm[1], pa[2] - pm[2]];
				var eb = [pb[0] - pn[0], pb[1] - pn[1], pb[2] - pn[2]];
				var n = [ea[1] * eb[2] - ea[2] * eb[1], ea[2] * eb[0] - ea[0] * eb[2], ea[0] * eb[1] - ea[1] * eb[0]];
				var nl = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
				var up = (n[0] * here[0] + n[1] * here[1] + n[2] * here[2]) / nl;
				var sign = up < 0 ? -1 : 1;

				n = [n[0] / nl * sign, n[1] / nl * sign, n[2] / nl * sign];
				up = Math.abs(up);

				/* The sea is level. */
				if (heights[o] <= 0)
					n = [here[0] * up, here[1] * up, here[2] * up];

				relief[at] = (0.5 + (n[0] - here[0] * up) * 2.5) * 255;
				relief[at + 1] = (0.5 + (n[1] - here[1] * up) * 2.5) * 255;
				relief[at + 2] = (0.5 + (n[2] - here[2] * up) * 2.5) * 255;
				relief[at + 3] = 255;
			}
		}

		return {Data: data, Relief: relief, Face: face, Row: first, Rows: count};
	},

	/*
	 * The climate of a face of the globe, what its weather is made of (the Weather of a scene, its clouds and fogs): RGBA
	 * bytes of a face size texels a side, rows from row on (rows of them), as Face lays them. R how wet (Moisture), G how
	 * warm (Temperature), B its ground (0 the sea, 64 to 255 land from 0 to 6000 m up), A how much its wind climbs where it
	 * blows (over a slope up the wind, 1500 m in 40 km all of it): where clouds rise against a range. {Data, Face, Row, Rows}.
	 */
	ClimateFace: function (options, face, size, row, rows) {
		var planet = this.Planet(options);
		var first = row || 0;
		var count = Math.min(size - first, rows || size);
		var data = new Uint8Array(size * count * 4);
		var finest = Math.PI / 2 * planet.Radius / size;
		var reach = 40 / planet.Radius;
		var x;
		var y;

		for (y = 0; y < count; y++) {
			for (x = 0; x < size; x++) {
				var a = -1 + (x + 0.5) * 2 / size;
				var b = -1 + (first + y + 0.5) * 2 / size;
				var way = this.Unit(face === 0 ? [1, -b, -a] : face === 1 ? [-1, -b, a] : face === 2 ? [a, 1, b] : face === 3 ? [a, -1, -b] : face === 4 ? [a, -b, 1] : [-a, -b, -1]);
				var sample = planet.Sample(way, finest);
				var east = this.Unit(Math.abs(way[1]) > 0.999 ? [1, 0, 0] : [way[2], 0, -way[0]]);
				var north = this.Cross(way, east);
				var blow = [east[0] * sample.Wind[0] + north[0] * sample.Wind[1], east[1] * sample.Wind[0] + north[1] * sample.Wind[1], east[2] * sample.Wind[0] + north[2] * sample.Wind[1]];
				var strength = Math.sqrt(blow[0] * blow[0] + blow[1] * blow[1] + blow[2] * blow[2]) || 1;
				var ahead = [way[0] + blow[0] / strength * reach, way[1] + blow[1] / strength * reach, way[2] + blow[2] / strength * reach];
				var behind = [way[0] - blow[0] / strength * reach, way[1] - blow[1] / strength * reach, way[2] - blow[2] / strength * reach];
				var climb = sample.Land ? (Math.max(0, planet.Elevation(ahead, finest)) - Math.max(0, planet.Elevation(behind, finest))) / 1500 : 0;
				var at = (y * size + x) * 4;

				data[at] = Math.round(Math.max(0, Math.min(1, sample.Moisture)) * 255);
				data[at + 1] = Math.round(Math.max(0, Math.min(1, sample.Temperature)) * 255);
				data[at + 2] = sample.Land ? Math.round(64 + Math.min(1, Math.max(0, sample.Elevation) / 6000) * 191) : 0;
				data[at + 3] = Math.round(Math.max(0, Math.min(1, climb)) * 255);
			}
		}

		return {Data: data, Face: face, Row: first, Rows: count};
	},

	/*
	 * The cells of the locations of a planet, of two grids (kind): cube (the usual), squares of the faces of a cube
	 * (SceneTerrainGenerator.Face), N to a side of a face, laid out by equal angles so they are near alike; hex, the cells
	 * round the points of an icosahedron cut into triangles N to a side, hexagons but for 12 pentagons at its corners. N of
	 * a radius (km) and a size of a cell (km, the step from one middle to the next). A cell {Face, I, J, N, ID, Kind}
	 * (a hex cell: one of the triangles of the icosahedron it is on, I and J its point there). CellAt the cell of a
	 * direction; CellOf the cell of its ID; CellCenter and CellCorners its directions; CellNeighbours those across its
	 * sides: of a cube cell four in the order +I, +J, -I, -J (over the edges of the faces too), of a hex cell six (five)
	 * round it, its side s between its corners s - 1 and s.
	 */
	Cells: function (radius, size, kind) {
		var span = kind === 'hex' ? Math.atan(2) * 1.075 : Math.PI / 2;

		return Math.max(1, Math.round(span * radius / Math.max(0.001, size)));
	},

	CellAt: function (radius, size, direction, kind) {
		var n = this.Cells(radius, size, kind);
		var x = direction[0];
		var y = direction[1];
		var z = direction[2];
		var ax = Math.abs(x);
		var ay = Math.abs(y);
		var az = Math.abs(z);
		var face;
		var u;
		var v;
		var i;
		var j;

		if (kind === 'hex')
			return this.HexAt(n, direction);

		if (ax >= ay && ax >= az) {
			face = x > 0 ? 0 : 1;
			u = x > 0 ? -z / ax : z / ax;
			v = -y / ax;
		}
		else if (ay >= az) {
			face = y > 0 ? 2 : 3;
			u = x / ay;
			v = y > 0 ? z / ay : -z / ay;
		}
		else {
			face = z > 0 ? 4 : 5;
			u = z > 0 ? x / az : -x / az;
			v = -y / az;
		}

		/* By equal angles: a of -1 to 1 along the side of the face. */
		i = Math.max(0, Math.min(n - 1, Math.floor((Math.atan(u) * 4 / Math.PI + 1) / 2 * n)));
		j = Math.max(0, Math.min(n - 1, Math.floor((Math.atan(v) * 4 / Math.PI + 1) / 2 * n)));

		return {Face: face, I: i, J: j, N: n, ID: face + ':' + i + ':' + j + ':' + n, Kind: 'cube'};
	},

	CellOf: function (id) {
		var text = String(id);
		var parts;
		var ico;
		var faces;
		var found;
		var a;
		var b;

		if (text.charAt(0) !== 'h') {
			parts = text.split(':').map(Number);

			return {Face: parts[0], I: parts[1], J: parts[2], N: parts[3], ID: text, Kind: 'cube'};
		}

		/* h<N>:v:<corner>, h<N>:e:<a>:<b>:<along b>, h<N>:f:<face>:<i>:<j>. */
		parts = text.slice(1).split(':');
		ico = this.Icosahedron();
		faces = ico.Faces;

		function on (corner) {
			return faces.filter(function (each) {
				return each.indexOf(corner) !== -1;
			})[0];
		}

		function cell (face, weights) {
			var n = Number(parts[0]);
			var at = {};

			at[face[0]] = 0;
			at[face[1]] = 0;
			at[face[2]] = 0;

			Object.keys(weights).forEach(function (corner) {
				at[corner] = weights[corner];
			});

			return {Face: faces.indexOf(face), I: at[face[1]], J: at[face[2]], N: n, ID: text, Kind: 'hex'};
		}

		if (parts[1] === 'v') {
			found = {};
			found[parts[2]] = Number(parts[0]);

			return cell(on(Number(parts[2])), found);
		}

		if (parts[1] === 'e') {
			a = Number(parts[2]);
			b = Number(parts[3]);
			found = {};
			found[a] = Number(parts[0]) - Number(parts[4]);
			found[b] = Number(parts[4]);

			return cell(faces.filter(function (each) {
				return each.indexOf(a) !== -1 && each.indexOf(b) !== -1;
			})[0], found);
		}

		return {Face: Number(parts[2]), I: Number(parts[3]), J: Number(parts[4]), N: Number(parts[0]), ID: text, Kind: 'hex'};
	},

	/* The direction of a point of a cube cell: a and b of 0 to 1 across it. */
	CellPoint: function (cell, a, b) {
		var face = this.$Service('SceneTerrainGenerator').Face(cell.Face, Math.tan((-1 + (cell.I + a) * 2 / cell.N) * Math.PI / 4), Math.tan((-1 + (cell.J + b) * 2 / cell.N) * Math.PI / 4));
		var length = Math.sqrt(face[0] * face[0] + face[1] * face[1] + face[2] * face[2]);

		return [face[0] / length, face[1] / length, face[2] / length];
	},

	CellCenter: function (cell) {
		if (cell.Kind === 'hex')
			return this.HexPoint(cell.N, cell.Face, cell.I, cell.J);

		return this.CellPoint(cell, 0.5, 0.5);
	},

	CellCorners: function (cell) {
		var self = this;
		var center;
		var round;

		if (cell.Kind !== 'hex')
			return [this.CellPoint(cell, 0, 0), this.CellPoint(cell, 1, 0), this.CellPoint(cell, 1, 1), this.CellPoint(cell, 0, 1)];

		/* Each corner the middle of a triangle of it and two neighbours one after the other round it. */
		center = this.CellCenter(cell);
		round = this.CellNeighbours(0, 0, cell).map(function (other) {
			return self.CellCenter(other);
		});

		return round.map(function (point, index) {
			var next = round[(index + 1) % round.length];

			return self.Unit([center[0] + point[0] + next[0], center[1] + point[1] + next[1], center[2] + point[2] + next[2]]);
		});
	},

	CellNeighbours: function (radius, size, cell) {
		var self = this;
		var center;
		var frame;
		var found = {};
		var list = [];

		if (cell.Kind !== 'hex') {
			return [[1.02, 0.5], [0.5, 1.02], [-0.02, 0.5], [0.5, -0.02]].map(function (at) {
				return self.CellAt(radius, size, self.CellPoint(cell, at[0], at[1]));
			});
		}

		/*
		 * The cells round it a little nearer than the step of the lattice, all the way round (six; five at a corner of the
		 * icosahedron): no cell further than its neighbours comes that near.
		 */
		center = this.CellCenter(cell);
		frame = this.Tangent(center);

		var step = Math.atan(2) / cell.N * 0.85;
		var k;

		for (k = 0; k < 36; k++) {
			var way = k / 36 * Math.PI * 2;
			var probe = [0, 1, 2].map(function (axis) {
				return center[axis] * Math.cos(step) + (frame.East[axis] * Math.cos(way) + frame.North[axis] * Math.sin(way)) * Math.sin(step);
			});
			var other = self.HexAt(cell.N, probe);

			if (other.ID !== cell.ID && !found[other.ID]) {
				found[other.ID] = true;

				list.push(other);
			}
		}

		/* Round it the other way to the clock, seen from over it, from the first by the order of their IDs. */
		list.forEach(function (other) {
			var point = self.CellCenter(other);

			other.Angle = Math.atan2(self.Dot(point, frame.North), self.Dot(point, frame.East));
		});
		list.sort(function (a, b) {
			return a.Angle - b.Angle;
		});

		var first = 0;

		list.forEach(function (other, index) {
			if (other.ID < list[first].ID)
				first = index;
		});

		return list.slice(first).concat(list.slice(0, first)).map(function (other) {
			delete other.Angle;

			return other;
		});
	},

	/*
	 * A cell as a location: its place on the planet {Latitude, Longitude, Turn (its axis X along the side +I of a cube
	 * cell, to the first neighbour of a hex cell), Size (metres, the mean of its sides of a cube cell, from side to side
	 * of a hex cell), Points ([x, z] of its corners on the ground of the location, metres: its outline, a little off a
	 * square or a hexagon), Sides ([x0, z0, x1, z1] of each side in the order of CellNeighbours, all running one way round
	 * it, so a side and the same side of the neighbour run the other way)}, for the step Planet of a World (SceneWorld)
	 * and the Shape of a location.
	 */
	CellPlace: function (radius, cell) {
		var self = this;
		var center = this.CellCenter(cell);
		var corners = this.CellCorners(cell);
		var place = this.LatLon(center);
		var metres = radius * 1000;
		var frame = this.Tangent(center);
		var east = frame.East;
		var north = frame.North;
		var along = cell.Kind === 'hex' ? this.CellCenter(this.CellNeighbours(0, 0, cell)[0]) : this.CellPoint(cell, 0.6, 0.5);
		var hex = cell.Kind === 'hex';
		var sides = 0;
		var turn;
		var ends;

		function dot (a, b) {
			return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		}

		turn = Math.atan2(dot(along, north), dot(along, east));

		/* Each corner on the plane touching the planet at the middle, as the step Planet lays it (SceneTerrainGenerator.Site). */
		var points = corners.map(function (corner) {
			var scale = metres / dot(corner, center);
			var u = dot(corner, east) * scale;
			var v = dot(corner, north) * scale;

			return [u * Math.cos(turn) + v * Math.sin(turn), u * Math.sin(turn) - v * Math.cos(turn)];
		});

		points.forEach(function (point, index) {
			var next = points[(index + 1) % points.length];

			sides += Math.sqrt((next[0] - point[0]) * (next[0] - point[0]) + (next[1] - point[1]) * (next[1] - point[1]));
		});

		/* The corners of each side: of a cube cell +I from corner 1 to 2, +J 2 to 3, -I 3 to 0, -J 0 to 1; of a hex cell s - 1 to s. */
		ends = points.map(function (point, side) {
			return hex ? [(side + points.length - 1) % points.length, side] : [(side + 1) % 4, (side + 2) % 4];
		});

		return {Latitude: place[0], Longitude: place[1], Turn: turn * 180 / Math.PI, Size: hex ? self.Across(points) : sides / 4, Points: points, Sides: ends.map(function (pair) {
			var a = corners[pair[0]];
			var b = corners[pair[1]];
			var cross = self.Cross([a[0] - center[0], a[1] - center[1], a[2] - center[2]], [b[0] - center[0], b[1] - center[1], b[2] - center[2]]);
			/* One way round the middle, seen from over it. */
			var wound = dot(cross, center) < 0;
			if (wound)
				pair = [pair[1], pair[0]];

			return [points[pair[0]][0], points[pair[0]][1], points[pair[1]][0], points[pair[1]][1]];
		})};
	},

	/* The width of an outline from side to side: twice the mean distance of the middles of its sides from its middle. */
	Across: function (points) {
		var sum = 0;

		points.forEach(function (point, index) {
			var next = points[(index + 1) % points.length];

			sum += Math.sqrt((point[0] + next[0]) * (point[0] + next[0]) + (point[1] + next[1]) * (point[1] + next[1])) / 2;
		});

		return sum / points.length * 2;
	},

	Unit: function (p) {
		var length = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) || 1;

		return [p[0] / length, p[1] / length, p[2] / length];
	},

	Dot: function (a, b) {
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	},

	/* East and north at a direction (at a pole east is -Z). */
	Tangent: function (center) {
		var length = Math.sqrt(center[2] * center[2] + center[0] * center[0]);
		var east = Math.abs(center[1]) > 0.9999 ? [0, 0, -1] : [center[2] / length, 0, -center[0] / length];

		return {East: east, North: [center[1] * east[2] - center[2] * east[1], center[2] * east[0] - center[0] * east[2], center[0] * east[1] - center[1] * east[0]]};
	},

	/* The 12 corners and the 20 triangles of an icosahedron (each round the other way to the clock seen from out of it), made once. */
	Icosahedron: function () {
		var self = this;
		var t = (1 + Math.sqrt(5)) / 2;
		var corners;
		var faces = [];
		var a;
		var b;
		var c;

		if (this.Ico)
			return this.Ico;

		corners = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(function (p) {
			return self.Unit(p);
		});

		/* Three corners each two an edge apart: the edge is the least distance, 1.05 in units of the radius. */
		function near (p, q) {
			return Math.abs(Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]) + (p[2] - q[2]) * (p[2] - q[2])) - 1.0515) < 0.01;
		}

		for (a = 0; a < 12; a++) {
			for (b = a + 1; b < 12; b++) {
				for (c = b + 1; c < 12; c++) {
					if (near(corners[a], corners[b]) && near(corners[b], corners[c]) && near(corners[a], corners[c]))
						faces.push(this.Wound(corners, a, b, c));
				}
			}
		}

		this.Ico = {Corners: corners, Faces: faces, Middles: faces.map(function (face) {
			return self.Unit([corners[face[0]][0] + corners[face[1]][0] + corners[face[2]][0], corners[face[0]][1] + corners[face[1]][1] + corners[face[2]][1], corners[face[0]][2] + corners[face[1]][2] + corners[face[2]][2]]);
		})};

		return this.Ico;
	},

	/* A triangle round the other way to the clock seen from out of it. */
	Wound: function (corners, a, b, c) {
		var p = corners[a];
		var q = corners[b];
		var r = corners[c];
		var normal = [(q[1] - p[1]) * (r[2] - p[2]) - (q[2] - p[2]) * (r[1] - p[1]), (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]), (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])];

		return this.Dot(normal, p) > 0 ? [a, b, c] : [a, c, b];
	},

	/*
	 * The direction of a point I, J of the lattice of a triangle of the icosahedron (past its edges too). By equal angles,
	 * so the cells are near alike: along its first edge to a point Q (I of N - J), then from Q to its third corner (J of N).
	 */
	HexPoint: function (n, face, i, j) {
		var ico = this.Icosahedron();
		var corners = ico.Faces[face].map(function (index) {
			return ico.Corners[index];
		});

		if (n - j === 0)
			return corners[2].slice();

		return this.Slerp(this.Slerp(corners[0], corners[1], i / (n - j)), corners[2], j / n);
	},

	/* The way from one direction to another by the angle, t of 0 to 1 (and past them). */
	Slerp: function (a, b, t) {
		var cos = Math.max(-1, Math.min(1, this.Dot(a, b)));
		var angle = Math.acos(cos);
		var w = this.Unit([b[0] - a[0] * cos, b[1] - a[1] * cos, b[2] - a[2] * cos]);
		var c = Math.cos(angle * t);
		var s = Math.sin(angle * t);

		if (angle < 1e-12) return a.slice();

		return [a[0] * c + w[0] * s, a[1] * c + w[1] * s, a[2] * c + w[2] * s];
	},

	/* The angle from a to b, under 0 past a away from c (on the great circle of a and c). */
	Along: function (a, b, c) {
		var normal = this.Unit(this.Cross(a, c));

		return Math.atan2(this.Dot(this.Cross(a, b), normal), this.Dot(a, b));
	},

	Cross: function (a, b) {
		return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	},

	/* The hex cell of a direction: the point of the lattice nearest to it on the triangle it is on; its ID the same of any triangle. */
	HexAt: function (n, direction) {
		var self = this;
		var ico = this.Icosahedron();
		var p = this.Unit(direction);
		var face = 0;
		var best = -2;
		var corners;
		var q;
		var fi;
		var fj;
		var pick = null;

		ico.Middles.forEach(function (middle, index) {
			var near = self.Dot(middle, p);

			if (near > best) {
				best = near;
				face = index;
			}
		});

		corners = ico.Faces[face].map(function (index) {
			return ico.Corners[index];
		});

		/* The way back of HexPoint: Q where the great circle of the third corner and the point meets the first edge. */
		if (this.Dot(p, corners[2]) > 1 - 1e-13) {
			fi = 0;
			fj = n;
		}
		else {
			q = this.Unit(this.Cross(this.Cross(corners[2], p), this.Cross(corners[0], corners[1])));

			if (this.Dot(q, [corners[0][0] + corners[1][0], corners[0][1] + corners[1][1], corners[0][2] + corners[1][2]]) < 0)
				q = [-q[0], -q[1], -q[2]];

			fj = this.Along(q, p, corners[2]) / Math.acos(Math.max(-1, Math.min(1, this.Dot(q, corners[2])))) * n;
			fi = this.Along(corners[0], q, corners[1]) / Math.acos(this.Dot(corners[0], corners[1])) * (n - fj);
		}

		/* The nearest of the points of the lattice round it, by the angle. */
		[-1, 0, 1, 2].forEach(function (di) {
			[-1, 0, 1, 2].forEach(function (dj) {
				var i = Math.floor(fi) + di;
				var j = Math.floor(fj) + dj;
				var near;

				if (i < 0 || j < 0 || i + j > n) return;

				near = self.Dot(self.HexPoint(n, face, i, j), p);

				if (!pick || near > pick.Near)
					pick = {I: i, J: j, Near: near};
			});
		});

		return this.HexCell(n, face, pick.I, pick.J);
	},

	/* A hex cell of a point of the lattice of a triangle, its ID that of the corner or the edge it is on, if it is. */
	HexCell: function (n, face, i, j) {
		var ico = this.Icosahedron();
		var corners = ico.Faces[face];
		var weights = [n - i - j, i, j];
		var on = [];
		var id;

		weights.forEach(function (weight, index) {
			if (weight > 0)
				on.push(index);
		});

		/* On an edge: its two corners the lesser first, and the weight of the other. */
		var a = corners[on[0]];
		var b = corners[on[1]];
		var wb = weights[on[1]];

		if (on.length === 2 && a > b) {
			wb = weights[on[0]];
			b = a;
			a = corners[on[1]];
		}

		if (on.length === 1) id = 'h' + n + ':v:' + corners[on[0]];
		else if (on.length === 2) id = 'h' + n + ':e:' + a + ':' + b + ':' + wb;
		else id = 'h' + n + ':f:' + face + ':' + i + ':' + j;

		return {Face: face, I: i, J: j, N: n, ID: id, Kind: 'hex'};
	},

	/*
	 * The ground of a planet as SceneTerrainGenerator.Sphere gives one, for a Scene to land on it and to draw it in squares
	 * of the faces of a cube, finer the nearer: Land(direction) its elevation in km (under 0 under the sea), Raise and
	 * Elevation the height of its ground in km (the sea level over the sea), Point, Altitude, Color(direction) (its colors
	 * as the globe shows them) and Patch (with Colors). Painted: its squares carry their colors. options: those of Make;
	 * its lands resolved there and then (BiomeList), so a worker makes the same ground of them.
	 */
	Sphere: function (options) {
		var self = this;
		var given = options || {};
		var terrain = this.$Service('SceneTerrainGenerator');
		var planet;
		var field;

		if (!given.BiomeList)
			given.BiomeList = terrain.Biomes({Biomes: given.Biomes || this.$Service('SceneTerrainGenerator').DefaultBiomes});

		planet = this.Planet(given);

		function unit (direction) {
			var length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]) || 1;

			return [direction[0] / length, direction[1] / length, direction[2] / length];
		}

		field = {
			Options: {Planet: given},
			Radius: planet.Radius,
			Height: (Number(given.Relief) || this.Defaults.Relief) / 1000,
			Ocean: 1,
			Type: 'terran',
			Painted: true,
			Planet: planet,

			Land: function (direction) {
				return planet.Elevation(unit(direction)) / 1000;
			},

			Raise: function (direction, value) {
				return Math.max(0, value);
			},

			Elevation: function (direction) {
				return Math.max(0, planet.Elevation(unit(direction))) / 1000;
			},

			Point: function (direction) {
				var p = unit(direction);
				var r = planet.Radius + field.Elevation(p);

				return [p[0] * r, p[1] * r, p[2] * r];
			},

			Altitude: function (point) {
				return Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]) - planet.Radius - field.Elevation(point);
			},

			/*
			 * Its colors at a point, as fine as a square shows (step: km between its points): a river there where it passes
			 * within half a step (or its channel), its flood plain greener round it.
			 */
			Color: function (direction, step) {
				var p = unit(direction);
				var sample = planet.Sample(p);
				var color = self.Color(planet, sample, 'relief', 1);
				var river = sample.Land ? planet.River(p) : null;
				var road = sample.Land ? planet.Highway(p) : null;
				var channel;
				var plain;

				/* A highway: a grey line of its width or of the step, the finer the nearer. */
				if (road && road.Far < Math.max(0.012, (step || 0) * 0.35)) return self.Rivers.Highway;

				if (!river)
					return color;

				channel = Math.max(self.RiverChannel(river.Flow), (step || 0) * 0.55);
				plain = self.RiverValley(river.Flow);

				if (river.Far < channel && river.Flow > Math.min(60, (step || 0) * 1.5)) return self.Rivers.Color;

				if (river.Far < plain)
					return [color[0] * 0.85 + 0.03, color[1] * 0.9 + 0.08, color[2] * 0.85];

				return color;
			},

			Patch: function (face, u, v, extent, resolution) {
				return terrain.SpherePatch(field, face, u, v, extent, resolution || 32);
			},

			/* The picture of a square of a face, size texels a side: see PatchPicture. */
			Picture: function (face, u, v, extent, size) {
				return self.PatchPicture(field, face, u, v, extent, size);
			}
		};

		return field;
	},

	/*
	 * The picture of a square of a face of the globe of a field of Sphere, as fine as its texels, size a side (the first and
	 * the last on its edges, so the squares beside have the same there): Color (RGBA bytes: its color, and in alpha how
	 * much of it is water, soft along the coast within a texel) and Normal (RGB bytes: the normal of its ground in the frame
	 * of the body, of its heights a texel apart). Its snow comes and goes with the cold, its rock with the slope, its rivers
	 * and highways as much of a texel as they cover: from far a thin line is faint, not a row of steps. Snow (a byte a texel):
	 * how much of it snow lies on, for its ground near (the snow of its biome there).
	 */
	PatchPicture: function (field, face, cu, cv, extent, size) {
		var self = this;
		var terrain = this.$Service('SceneTerrainGenerator');
		var planet = field.Planet;
		var n = Math.max(2, Math.round(size));
		var step = extent / (n - 1);
		var side = n + 2;
		var texel = step * Math.PI / 4 * field.Radius;
		var heights = new Float32Array(side * side);
		var points = new Array(side * side);
		var samples = new Array(n * n);
		/* The slope of each texel (Slope of the planet, of 300 metres), right after its sample: of what that raised. */
		var slopes = new Float32Array(n * n);
		var color = new Uint8Array(n * n * 4);
		var normal = new Uint8Array(n * n * 4);
		/* Where people live (Use, RGBA bytes): how much of it is fields, how much houses, and of what settlement (a city 255, a town 170, a village 85). */
		var use = new Uint8Array(n * n * 4);
		/* How much of each texel snow lies on (Snow, a byte each). */
		var snow = new Uint8Array(n * n);
		/* How much of the sky the hills round each texel hide (Closed, a byte each: 0 open, 255 shut). */
		var closed = new Uint8Array(n * n);
		var i;
		var k;

		function unit (direction) {
			var length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]) || 1;

			return [direction[0] / length, direction[1] / length, direction[2] / length];
		}

		function smooth (a, b, x) {
			var t = Math.max(0, Math.min(1, (x - a) / (b - a)));

			return t * t * (3 - 2 * t);
		}

		/* The heights a texel round each, one more round the square for its slopes; the samples of its own texels. */
		for (k = -1; k <= n; k++) {
			for (i = -1; i <= n; i++) {
				var direction = unit(terrain.Face(face, cu - extent / 2 + i * step, cv - extent / 2 + k * step));
				var at = (k + 1) * side + i + 1;

				points[at] = direction;

				if (i >= 0 && k >= 0 && i < n && k < n) {
					samples[k * n + i] = planet.Sample(direction);
					heights[at] = samples[k * n + i].Elevation;
					slopes[k * n + i] = planet.Slope(direction, 0.3);
				}
				else {
					heights[at] = planet.Elevation(direction);
				}
			}
		}

		/*
		 * How much of the land trees cover, 0 to 1, by the rules its biome sows them by (Scatter of SceneBiomes): each rule of
		 * trees as much as its Cover and its Density, none where it is steeper than they grow or higher than they may; snow
		 * takes them. In the alpha of Normal: the Ground shader draws woods of it, the same share as a location sows.
		 */
		var trees = ['pine', 'oak', 'birch', 'palm', 'spruce', 'willow', 'cypress', 'fir', 'aspen', 'sequoia', 'poplar', 'chestnut', 'alder', 'linden', 'acacia', 'apple', 'peach', 'apricot', 'cherry', 'sweet-cherry'];
		var lands = {};

		(planet.Lands || []).forEach(function (land) {
			lands[land.Name] = land;
		});

		function woods (sample, height, slope) {
			var land = lands[sample.Biome];
			var bare = 1;

			if (!land || !sample.Land) return 0;

			(land.Scatter || []).forEach(function (rule) {
				var share = (rule.Shapes || []).filter(function (shape) {
					return trees.indexOf(shape) >= 0;
				}).length / Math.max(1, (rule.Shapes || []).length);
				var part = share * (rule.Cover === undefined ? 0.5 : Number(rule.Cover)) * Math.min(1, (Number(rule.Density) || 0) / 3);

				if (rule.MaxSlope !== undefined)
					part *= 1 - smooth(Number(rule.MaxSlope) * 0.6, Number(rule.MaxSlope), slope);

				if (rule.MaxHeight !== undefined)
					part *= 1 - smooth(Number(rule.MaxHeight), Number(rule.MaxHeight) * 3 + 20, height);

				bare *= 1 - Math.max(0, Math.min(1, part));
			});

			/* The tree line: no woods where the year is colder than 0 degrees on the mean (they thin out from 5). */
			return (1 - bare) * (1 - smooth(5, 0, sample.Celsius));
		}

		function lifted (at) {
			var r = field.Radius + Math.max(0, heights[at]) / 1000;

			return [points[at][0] * r, points[at][1] * r, points[at][2] * r];
		}

		/*
		 * Where people live: its settlements near (of a square small enough, those near its middle once), each its built middle
		 * as large as a location lays it (a city 0.9 km round, a town 0.45, a village 0.18) and thinner houses round it, and
		 * its fields farther (a city 30 km, a town 14, a village 5), ragged; fields only on flat land, not too dry nor cold.
		 */
		var km = Math.PI / 4 * field.Radius;
		var centre = unit(terrain.Face(face, cu, cv));
		var nearTowns = extent * km * 0.71 < 160 && planet.Towns ? planet.Towns(centre).filter(function (town) {
			return town.Far < extent * km * 0.71 + 45;
		}) : null;

		function hash (x, y, salt) {
			var h = Math.imul((x | 0) ^ Math.imul((y | 0) + 0x9e3779b9, 0x85ebca6b) ^ salt, 0xc2b2ae35);

			h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d);

			return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
		}

		/* A smooth noise of the plane of the face (km), 0 to 1. */
		function wave (x, y, salt) {
			var fx = Math.floor(x);
			var fy = Math.floor(y);
			var tx = x - fx;
			var ty = y - fy;
			var sx = tx * tx * (3 - 2 * tx);
			var sy = ty * ty * (3 - 2 * ty);
			var top = hash(fx, fy, salt) + (hash(fx + 1, fy, salt) - hash(fx, fy, salt)) * sx;
			var bottom = hash(fx, fy + 1, salt) + (hash(fx + 1, fy + 1, salt) - hash(fx, fy + 1, salt)) * sx;

			return top + (bottom - top) * sy;
		}

		function dwelt (up, x, y, sample, slope, height) {
			var towns = nearTowns || (planet.Towns ? planet.Towns(up) : []);
			var built = 0;
			var farm = 0;
			var kind = 'village';
			var j;

			if (!sample.Land || height <= 0)
				return {Built: 0, Farm: 0, Kind: kind};

			for (j = 0; j < towns.length; j++) {
				var town = towns[j];
				var far = Math.acos(Math.max(-1, Math.min(1, up[0] * town.Point[0] + up[1] * town.Point[1] + up[2] * town.Point[2]))) * field.Radius;
				var core = self.Kind(town.Kind).Core * (0.8 + town.Size * 0.4);
				var fields = self.Kind(town.Kind).Fields * (0.7 + town.Size * 0.6);
				var rag = (wave(x / 2.3, y / 2.3, 71) - 0.5) * 0.5 + (wave(x / 0.7, y / 0.7, 72) - 0.5) * 0.2;
				var houses;

				if (far > fields * 1.4) continue;

				houses = 1 - smooth(core * 0.85, core * 1.1, far * (1 + rag * 0.4));
				houses = Math.max(houses, (1 - smooth(core, core * 2.6, far * (1 + rag * 0.6))) * 0.45);

				if (houses > built) {
					built = houses;
					kind = town.Kind;
				}

				farm = Math.max(farm, 1 - smooth(0.5, 1, far / fields + rag));
			}

			farm *= (1 - smooth(0.07, 0.16, slope)) * smooth(0.18, 0.32, sample.Moisture) * smooth(0, 7, sample.Celsius) * (1 - built);

			return {Built: built * (1 - smooth(0.2, 0.35, slope)), Farm: farm, Kind: kind};
		}

		/*
		 * How a texel looks, of the graph of the far ground (PictureRun). The houses of a settlement Roofs of its kind (Kind: a
		 * kind of none on a planet, of a village). Regression: of a table of three kinds, a hamlet or a fort put by hand on a
		 * planet broke its picture.
		 */
		var look = this.PictureRun((planet.Options || {}).GroundFarGraph, ((planet.Options || {}).ReliefSources || {}).GroundFar);
		var given;
		var got;

		function read (code) {
			var r = code.Main.apply(null, code.Inputs.map(function (name) {
				return given[name];
			}));

			code.Keys.forEach(function (key, index) {
				got[key] = code.Keys.length === 1 ? r : r[index];
			});
		}
		var stream = this.Rivers.Color;
		var highway = this.Rivers.Highway;
		var beyond = {};

		/* The height of a texel of the grid, past its ring too (kept: the texels by the edge ask the same ones). */
		function heightAt (i, k) {
			var key;

			if (i >= -1 && k >= -1 && i <= n && k <= n) return heights[(k + 1) * side + i + 1];

			key = i + ':' + k;

			if (beyond[key] === undefined)
				beyond[key] = planet.Elevation(unit(terrain.Face(face, cu - extent / 2 + i * step, cv - extent / 2 + k * step)));

			return beyond[key];
		}

		/*
		 * How much of the sky the land round a texel hides: in each of 8 ways the highest rise seen 1, 2, 4 and 8 texels off,
		 * the sine of that horizon, the mean of the 8 (the sea level its floor). A valley, a gorge, the foot of a cliff are
		 * shut; a ridge, a plain open. Past the edge of the square of the same land, so two squares meet with no seam.
		 */
		function closure (i, k) {
			var low = Math.max(0, heightAt(i, k));
			var sum = 0;
			var way;
			var s;

			for (way = 0; way < 8; way++) {
				var wx = [1, 1, 0, -1, -1, -1, 0, 1][way];
				var wy = [0, 1, 1, 1, 0, -1, -1, -1][way];
				var across = Math.sqrt(wx * wx + wy * wy) * texel * 1000;
				var most = 0;

				for (s = 1; s <= 8; s *= 2) {
					most = Math.max(most, (Math.max(0, heightAt(i + wx * s, k + wy * s)) - low) / (across * s));
				}

				sum += most / Math.sqrt(1 + most * most);
			}

			return sum / 8;
		}

		for (k = 0; k < n; k++) {
			for (i = 0; i < n; i++) {
				var at = (k + 1) * side + i + 1;
				var up = points[at];
				var sample = samples[k * n + i];
				var height = heights[at];
				var dx = (heights[at + 1] - heights[at - 1]) / 2;
				var dy = (heights[at + side] - heights[at - side]) / 2;
				/* Metres of height across a texel (for its coast). */
				var rise = Math.sqrt(dx * dx + dy * dy);
				/*
				 * Regression: its slope of its own texels made a square of rock and woods other than the finer one beside (its
				 * texels farther apart see the ground gentler), a straight edge across them: of 300 metres at any size.
				 */
				var slope = slopes[k * n + i];
				/*
				 * The sea by the coast only: the land beside it tilts into it. Regression: a basin of the land (its ground no
				 * lower than 1 m) had water round its rim by the same rule, steep there, and none in it: rings of water.
				 */
				var coast = height <= 0 || heights[at + 1] <= 0 || heights[at - 1] <= 0 || heights[at + side] <= 0 || heights[at - side] <= 0;
				/* How dry and warm: sand seas and stony plateaus where it is a desert (none where it is cold). */
				var arid = self.Arid(sample, field.Radius);
				var a = lifted(at + 1);
				var b = lifted(at - 1);
				var c = lifted(at + side);
				var d = lifted(at - side);
				var made = unit([(c[1] - d[1]) * (a[2] - b[2]) - (c[2] - d[2]) * (a[1] - b[1]), (c[2] - d[2]) * (a[0] - b[0]) - (c[0] - d[0]) * (a[2] - b[2]), (c[0] - d[0]) * (a[1] - b[1]) - (c[1] - d[1]) * (a[0] - b[0])]);
				var land;
				var sea;
				var river;
				var road;
				var fx = (cu - extent / 2 + i * step) * km;
				var fy = (cv - extent / 2 + k * step) * km;
				var used;
				var roof;
				var o = (k * n + i) * 4;

				if (made[0] * up[0] + made[1] * up[1] + made[2] * up[2] < 0)
					made = [-made[0], -made[1], -made[2]];

				/* The sea is level; a coast tilts toward it as the land does. */
				if (height <= 0)
					made = up;

				/*
				 * Its land of its biome and height, its sea by its depth, its fields and houses, its river and highway: how they
				 * make its color, of the graph of the far ground (blueprints/shader/ground-far: alpine meadow, rock on the steep,
				 * deserts and basins, snow, ice, the water by the coast, the valley and the channel of a river, a highway).
				 */
				land = self.Color(planet, Object.assign({}, sample, {Land: true, Elevation: Math.max(0, height), Celsius: 20, Pictured: true}), 'relief', 1);
				sea = self.Color(planet, Object.assign({}, sample, {Land: false, Elevation: Math.min(-1, height), Celsius: 20, Pictured: true}), 'relief', 1);
				used = dwelt(up, fx, fy, sample, slope, height);
				roof = self.Kind(used.Kind).Roofs;
				river = sample.Land ? planet.River(up) : null;
				road = sample.Land ? planet.Highway(up) : null;
				given = {Land: sample.Land ? 1 : 0, Coast: coast ? 1 : 0, Height: height, Rise: rise, Moisture: sample.Moisture, Celsius: sample.Celsius, Slope: slope, Dry: arid.Dry, Erg: arid.Erg, Stone: arid.Stone, LandR: land[0], LandG: land[1], LandB: land[2], SeaR: sea[0], SeaG: sea[1], SeaB: sea[2], Farm: used.Farm, Built: used.Built, RoofR: roof[0], RoofG: roof[1], RoofB: roof[2], River: river ? 1 : 0, Flow: river ? river.Flow : 0, Far: river ? river.Far : 0, Width: river ? self.RiverChannel(river.Flow) : 0, Plain: river ? self.RiverValley(river.Flow) : 1, StreamR: stream[0], StreamG: stream[1], StreamB: stream[2], Road: road ? 1 : 0, Along: road ? road.Far : 0, HighwayR: highway[0], HighwayG: highway[1], HighwayB: highway[2], Texel: texel, Woods: woods(sample, height, slope)};
				got = {};

				look.forEach(read);

				color[o] = Math.round(Math.max(0, Math.min(1, got.R)) * 255);
				color[o + 1] = Math.round(Math.max(0, Math.min(1, got.G)) * 255);
				color[o + 2] = Math.round(Math.max(0, Math.min(1, got.B)) * 255);
				color[o + 3] = Math.round(got.Water * 255);
				normal[o] = Math.round((made[0] * 0.5 + 0.5) * 255);
				normal[o + 1] = Math.round((made[1] * 0.5 + 0.5) * 255);
				normal[o + 2] = Math.round((made[2] * 0.5 + 0.5) * 255);
				/* Fields and houses take the woods: a hedge or a grove left, no more. */
				normal[o + 3] = Math.round(got.Trees * 255);
				use[o] = Math.round(got.Farm * 255);
				use[o + 1] = Math.round(got.Built * 255);
				use[o + 2] = self.Kind(used.Kind).Use;
				/* Its sand of dunes (the Ground shader draws them of it). */
				use[o + 3] = Math.round(got.Dune * 255);
				/* How much of it snow lies on (its ground near is of the snow of its biome there). */
				snow[k * n + i] = Math.round(got.Snow * 255);
				closed[k * n + i] = Math.round(Math.min(1, closure(i, k)) * 255);
			}
		}

		/* The biome of each texel (Biomes: an index into Lands, 255 none): which trees its woods are of (PatchThings). */
		var biomes = new Uint8Array(n * n);
		var named = [];

		for (i = 0; i < n * n; i++) {
			var biome = samples[i].Biome;
			var index = biome ? named.indexOf(biome) : -1;

			if (biome && index === -1 && named.length < 255) {
				named.push(biome);

				index = named.length - 1;
			}

			biomes[i] = index === -1 ? 255 : index;
		}

		return {Size: n, Color: color, Normal: normal, Use: use, Snow: snow, Closed: closed, Biomes: biomes, Lands: named};
	},

	/*
	 * What stands on a square of a face of the globe of a field of Sphere, seen from over it (a proxy, as Voxy draws a far
	 * land): its woods and its houses of its picture (PatchPicture, side a side), a shape of each. Its woods only on a square
	 * of texels of 12 m or finer (farther, the Ground shader draws them, their crowns and gaps): each texel up to three crowns
	 * of trees as large as trees are (2.5 to 9 m round, 8 to 24 m high), as many as the share of woods of the texel holds,
	 * each a tree of a species its biome sows (the trees of the Shapes of its Scatter, as many as each rule sows: woods of
	 * mixed trees), of the far form of that species (SceneFlora.Far: its bare trunk, the profile of its crown round it, a
	 * cone, a column, a palm's star of fronds; a dome where there is no SceneFlora), of the green of the ground there
	 * darkened as the Ground shader darkens woods, turned to the green of its species. Regression:
	 * a texel of 600 m was one clump of crowns 270 m wide, a flat pyramid. Each texel of houses one to three blocks of walls
	 * and a roof, as tall as the settlement (a village low, a city high). They
	 * stand on the ground, up as it is there. Gives {Geometry (its houses), Trees (its woods), each {Positions, Normals,
	 * Colors} relative to Center (km, of the body), each face of its own vertices; Trees.Starts the first vertex of each
	 * tree), Plants (its trees of a species of SceneFlora, as a scene draws them near: {Species (their names), Places (six
	 * numbers each: where it stands, relative to Center, km; how tall, km; its turn; the index of its species in Species
	 * plus its variant, 0 to 0.99)}), Center, Woods, Houses}: a scene draws its
	 * trees near the eye only. Its picture of side texels made already (of PatchPicture) is taken as it is.
	 */
	PatchThings: function (field, face, cu, cv, extent, side, made) {
		var terrain = this.$Service('SceneTerrainGenerator');
		var planet = field.Planet;
		var n = Math.max(2, Math.round(side || 32));
		var picture = made && made.Size === n ? made : this.PatchPicture(field, face, cu, cv, extent, n);
		var step = extent / (n - 1);
		var texel = step * Math.PI / 4 * field.Radius;
		var positions = [];
		var normals = [];
		var colors = [];
		var counts = {Woods: 0, Houses: 0};
		/* The trees of a species of SceneFlora, as a scene draws them near: their names, and six numbers each. */
		var species = [];
		var plants = [];
		var center;
		var i;
		var k;

		function unit (v) {
			var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;

			return [v[0] / length, v[1] / length, v[2] / length];
		}

		function cross (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		}

		function grounded (direction) {
			var r = field.Radius + Math.max(0, planet.Elevation(direction)) / 1000;

			return [direction[0] * r, direction[1] * r, direction[2] * r];
		}

		function hash (x, y, salt) {
			var h = Math.imul((x | 0) ^ Math.imul((y | 0) + 0x9e3779b9, 0x85ebca6b) ^ salt, 0xc2b2ae35);

			h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d);

			return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
		}

		/* rounded: [its middle, its up] (a crown): each corner's normal out from its middle and up, lit as a mass of leaves, not face by face. */
		function triangle (a, b, c, color, rounded) {
			var normal = unit(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]));

			[a, b, c].forEach(function (point) {
				var n = normal;

				if (rounded) {
					n = unit([point[0] - rounded[0][0], point[1] - rounded[0][1], point[2] - rounded[0][2]]);
					n = unit([n[0] * 0.6 + rounded[1][0] * 0.55, n[1] * 0.6 + rounded[1][1] * 0.55, n[2] * 0.6 + rounded[1][2] * 0.55]);
				}

				positions.push(point[0] - center[0], point[1] - center[1], point[2] - center[2]);
				normals.push(n[0], n[1], n[2]);
				colors.push(color[0], color[1], color[2]);
			});
		}

		/* A point of a frame: from a place along its east, its north and its up (km). */
		function at (place, frame, x, y, z) {
			return [place[0] + frame[0][0] * x + frame[1][0] * y + frame[2][0] * z, place[1] + frame[0][1] * x + frame[1][1] * y + frame[2][1] * z, place[2] + frame[0][2] * x + frame[1][2] * y + frame[2][2] * z];
		}

		/*
		 * The crown of a tree: a dome of six sides, its widest ring at a third of its height, a narrower one at two thirds,
		 * a point on top (its underside never seen from over it), turned by its angle; the side away from the sun as lit as
		 * the shader lights it.
		 */
		function crown (place, frame, radius, height, turn, color) {
			var ring = function (z, wide) {
				var points = [];
				var j;

				for (j = 0; j < 6; j++)
					points.push(at(place, frame, Math.cos(turn + j * Math.PI / 3) * wide, Math.sin(turn + j * Math.PI / 3) * wide, z));

				return points;
			};
			var top = at(place, frame, 0, 0, height);
			var up = ring(height * 0.72, radius * 0.78);
			var low = ring(height * 0.34, radius);
			var j;
			var next;

			for (j = 0; j < 6; j++) {
				next = (j + 1) % 6;

				triangle(up[j], up[next], top, color);
				triangle(low[j], low[next], up[next], color);
				triangle(low[j], up[next], up[j], color);
			}
		}

		/*
		 * A tree of the far form of its species (SceneFlora.Far): its bare trunk, a thin prism of three sides, up to the
		 * foot of its crown; its crown rings of six sides as wide as its profile there, closed below and on top; a palm its
		 * trunk to its top and six fronds drooping from there, each folded down its rib. No form: a dome of six sides.
		 */
		function tree (place, frame, form, radius, height, turn, color, bark) {
			var foot = form ? Math.min(0.9, form.Bare) * height : 0;
			var rings = [];
			var j;
			var r;
			var next;

			function ring (z, wide) {
				var points = [];
				var m;

				for (m = 0; m < 6; m++)
					points.push(at(place, frame, Math.cos(turn + m * Math.PI / 3) * wide, Math.sin(turn + m * Math.PI / 3) * wide, z));

				return points;
			}

			if (!form) {
				crown(place, frame, radius, height, turn, color);

				return;
			}

			if (form.Kind === 'palm' || foot > height * 0.12) {
				var thick = Math.max(0.00025, height * 0.018);
				var lowTrunk = [0, 1, 2].map(function (m) {
					return at(place, frame, Math.cos(turn + m * 2.094) * thick, Math.sin(turn + m * 2.094) * thick, 0);
				});
				var top = form.Kind === 'palm' ? height : foot + (height - foot) * 0.15;
				var highTrunk = [0, 1, 2].map(function (m) {
					return at(place, frame, Math.cos(turn + m * 2.094) * thick * 0.7, Math.sin(turn + m * 2.094) * thick * 0.7, top);
				});

				for (j = 0; j < 3; j++) {
					next = (j + 1) % 3;

					triangle(lowTrunk[j], lowTrunk[next], highTrunk[next], bark);
					triangle(lowTrunk[j], highTrunk[next], highTrunk[j], bark);
				}
			}

			if (form.Kind === 'palm') {
				var head = at(place, frame, 0, 0, height);
				var palmy = [at(place, frame, 0, 0, height * 0.85), frame[2]];

				for (j = 0; j < 6; j++) {
					var a = turn + j * Math.PI / 3;
					var tip = at(place, frame, Math.cos(a) * radius, Math.sin(a) * radius, height * 0.86);
					var middle = at(place, frame, Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5, height * 1.02);
					var left = at(place, frame, Math.cos(a) * radius * 0.5 - Math.sin(a) * radius * 0.16, Math.sin(a) * radius * 0.5 + Math.cos(a) * radius * 0.16, height * 0.97);
					var right = at(place, frame, Math.cos(a) * radius * 0.5 + Math.sin(a) * radius * 0.16, Math.sin(a) * radius * 0.5 - Math.cos(a) * radius * 0.16, height * 0.97);

					triangle(head, left, middle, color, palmy);
					triangle(head, middle, right, color, palmy);
					triangle(left, tip, middle, color, palmy);
					triangle(middle, tip, right, color, palmy);
				}

				return;
			}

			/* Its crown: a ring at each point of its profile (the widest of it as wide as radius), a point on top and one under it. */
			var widest = form.Profile.reduce(function (most, point) {
				return Math.max(most, point[1]);
			}, 0.01);

			form.Profile.forEach(function (point) {
				r = radius * point[1] / widest;

				if (r > radius * 0.06)
					rings.push(ring(foot + (height - foot) * point[0], r));
			});

			if (!rings.length) {
				crown(place, frame, radius, height, turn, color);

				return;
			}

			var under = at(place, frame, 0, 0, Math.max(0, foot - (height - foot) * 0.05));
			var cap = at(place, frame, 0, 0, height);
			var round = [at(place, frame, 0, 0, foot + (height - foot) * 0.45), frame[2]];

			for (j = 0; j < 6; j++) {
				next = (j + 1) % 6;

				triangle(rings[0][next], rings[0][j], under, color, round);
				triangle(rings[rings.length - 1][j], rings[rings.length - 1][next], cap, color, round);
			}

			for (r = 1; r < rings.length; r++) {
				for (j = 0; j < 6; j++) {
					next = (j + 1) % 6;

					triangle(rings[r - 1][j], rings[r - 1][next], rings[r][next], color, round);
					triangle(rings[r - 1][j], rings[r][next], rings[r][j], color, round);
				}
			}
		}

		/*
		 * The trees of the biome of a texel: the Shapes of its Scatter that are species of trees, each as much as its rule
		 * sows (its cover and density); of their far forms (null: no SceneFlora, a dome).
		 */
		var flora = this.$Service('SceneFlora');
		var usable = flora && !flora.ElemenxDeferred && flora.Far;
		var lands = {};
		var kinds = {};
		var forms = {};

		(planet.Lands || []).forEach(function (land) {
			lands[land.Name] = land;
		});

		function formOf (name) {
			if (!(name in forms)) {
				forms[name] = usable ? flora.Far(name) : null;

				if (forms[name])
					forms[name].Name = name;
			}

			return forms[name];
		}

		function kindsOf (biome) {
			var list = [];
			var land = lands[biome];

			if (kinds[biome])
				return kinds[biome];

			(land && land.Scatter || []).forEach(function (rule) {
				var weight = (rule.Cover === undefined ? 0.5 : Number(rule.Cover)) * Math.max(0.2, Number(rule.Density) || 1);

				(rule.Shapes || []).forEach(function (shape) {
					if (formOf(shape))
						list.push({Form: forms[shape], Weight: weight});
				});
			});

			kinds[biome] = list;

			return list;
		}

		function pick (list, value) {
			var total = list.reduce(function (sum, one) {
				return sum + one.Weight;
			}, 0);
			var m;

			value *= total;

			for (m = 0; m < list.length; m++) {
				value -= list[m].Weight;

				if (value <= 0)
					return list[m].Form;
			}

			return list.length ? list[list.length - 1].Form : null;
		}

		/* Crowns on a texel of 12 m or finer only, at most three a texel; of their own shape. */
		var treed = texel <= 0.012;
		var houses = {Positions: positions, Normals: normals, Colors: colors};
		var trees = {Positions: [], Normals: [], Colors: []};
		var starts = [];

		/* A block of walls and a roof, wide by deep by high (km), turned by its angle. */
		function block (place, frame, wide, deep, high, turn, wall, roof) {
			var c = Math.cos(turn);
			var s = Math.sin(turn);
			var corner = function (x, y, z) {
				return at(place, frame, x * c - y * s, x * s + y * c, z);
			};
			var floor = [corner(-wide, -deep, 0), corner(wide, -deep, 0), corner(wide, deep, 0), corner(-wide, deep, 0)];
			var top = [corner(-wide, -deep, high), corner(wide, -deep, high), corner(wide, deep, high), corner(-wide, deep, high)];
			var j;
			var next;

			for (j = 0; j < 4; j++) {
				next = (j + 1) % 4;

				triangle(floor[j], floor[next], top[next], wall);
				triangle(floor[j], top[next], top[j], wall);
			}

			triangle(top[0], top[1], top[2], roof);
			triangle(top[0], top[2], top[3], roof);
		}

		center = grounded(unit(terrain.Face(face, cu, cv)));

		for (k = 0; k < n; k++) {
			for (i = 0; i < n; i++) {
				var o = (k * n + i) * 4;
				var woods = picture.Normal[o + 3] / 255;
				var built = picture.Use[o + 1] / 255;
				var kind = picture.Use[o + 2];
				var seed = Math.round((cu + i * step) * 1e6) ^ Math.round((cv + k * step) * 1e6) * 31 ^ face * 7919;
				var jitter = [(hash(i, k, seed) - 0.5) * step, (hash(k, i, seed + 1) - 0.5) * step];
				var direction;
				var place;
				var east;
				var frame;
				var ground;
				var count;
				var j;

				if (picture.Color[o + 3] > 128 || (!treed || woods < 0.12) && built < 0.2) continue;

				direction = unit(terrain.Face(face, cu - extent / 2 + i * step + jitter[0], cv - extent / 2 + k * step + jitter[1]));
				place = grounded(direction);
				east = unit(cross(Math.abs(direction[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0], direction));
				frame = [east, cross(direction, east), direction];
				ground = [picture.Color[o] / 255, picture.Color[o + 1] / 255, picture.Color[o + 2] / 255];

				if (treed && woods >= 0.12) {
					/* As many as its share holds, a tree to each 70 square metres of woods, three at most; as wide as their part of it. */
					count = Math.min(3, Math.floor(woods * texel * texel * 1e6 / 70 + hash(i, k, seed + 2)));

					for (j = 0; j < count; j++) {
						var radius = Math.max(0.0025, Math.min(0.009, Math.sqrt(woods * texel * texel / count / Math.PI) * 0.62 * (0.75 + 0.5 * hash(j, k, seed + 12))));
						var shade = 0.8 + 0.4 * hash(i, j, seed + 4);
						var form = picture.Biomes && picture.Biomes[k * n + i] !== 255 ? pick(kindsOf(picture.Lands[picture.Biomes[k * n + i]]), hash(k, j, seed + 17)) : null;
						var green = [ground[0] * 0.42 * shade, ground[1] * 0.56 * (0.9 + 0.2 * hash(k, j, seed + 16)), ground[2] * 0.4 * shade];
						var tall = Math.max(0.008, Math.min(0.024, radius * (1.8 + 1.2 * hash(k, j, seed + 3))));

						positions = trees.Positions;
						normals = trees.Normals;
						colors = trees.Colors;

						starts.push(positions.length / 3);

						if (form) {
							/*
							 * As tall as its species (6 to 40 m), as wide as its crown is of that, within 0.6 and 1.3 of its share
							 * of the texel (its woods as thick as the Ground shader draws them farther); its green turned to the
							 * green of its leaves, as bright.
							 */
							var mean = (form.Color[0] + form.Color[1] + form.Color[2]) / 3 || 1;

							tall = Math.max(0.006, Math.min(0.04, form.Height * (0.8 + 0.4 * hash(k, j, seed + 3)) / 1000));
							radius = Math.max(radius * 0.6, Math.min(radius * 1.3, tall * form.Width));
							green = [green[0] * (0.5 + 0.5 * form.Color[0] / mean), green[1] * (0.5 + 0.5 * form.Color[1] / mean), green[2] * (0.5 + 0.5 * form.Color[2] / mean)];
						}

						var foot = at(place, frame, (hash(j, i, seed + 13) - 0.5) * texel * 0.8, (hash(i, j, seed + 14) - 0.5) * texel * 0.8, 0);
						var turn = hash(j, j, seed + 15) * Math.PI;

						tree(foot, frame, form, radius, tall, turn, green, form ? [form.Bark[0] * 0.7, form.Bark[1] * 0.7, form.Bark[2] * 0.7] : green);

						/* The same tree as a plant of its species: where it stands, as tall, turned so, a variant of its own. */
						if (form) {
							if (species.indexOf(form.Name) === -1)
								species.push(form.Name);

							plants.push(foot[0] - center[0], foot[1] - center[1], foot[2] - center[2], tall, turn, species.indexOf(form.Name) + hash(k, i, seed + 18) * 0.99);
						}

						counts.Woods++;
					}

					positions = houses.Positions;
					normals = houses.Normals;
					colors = houses.Colors;
				}

				if (built >= 0.2) {
					/* As many as its texel holds of them: a block for each hectare it is built over, at most 24. */
					count = Math.max(1, Math.min(24, Math.round(texel * texel * 100 * built * 0.3 * (0.7 + 0.6 * hash(k, i, seed + 5)))));

					for (j = 0; j < count; j++) {
						var tall = kind === 255 ? 0.015 + 0.07 * built * hash(i, j, seed + 6) : kind === 170 ? 0.008 + 0.012 * hash(i, j, seed + 6) : 0.005 + 0.004 * hash(i, j, seed + 6);
						var wide = Math.min(texel * 0.22, 0.006 + 0.01 * hash(j, i, seed + 7));

						block(at(place, frame, (hash(j, k, seed + 8) - 0.5) * texel * 0.9, (hash(k, j, seed + 9) - 0.5) * texel * 0.9, 0), frame, wide, wide * (0.6 + 0.6 * hash(j, j, seed + 10)), tall, hash(i, j, seed + 11) * Math.PI, kind === 255 ? [0.62, 0.62, 0.64] : [0.74, 0.7, 0.62], kind === 255 ? [0.38, 0.38, 0.4] : [0.52, 0.24, 0.17]);

						counts.Houses++;
					}
				}
			}
		}

		return {Geometry: {Positions: new Float32Array(houses.Positions), Normals: new Float32Array(houses.Normals), Colors: new Float32Array(houses.Colors)}, Trees: {Positions: new Float32Array(trees.Positions), Normals: new Float32Array(trees.Normals), Colors: new Float32Array(trees.Colors), Starts: new Uint32Array(starts)}, Plants: {Species: species, Places: new Float32Array(plants)}, Center: center, Woods: counts.Woods, Houses: counts.Houses};
	},

	/* The workers that paint globes. */
	/*
	 * The workers of planets, given the lands of the page once (Share biomes): a globe they paint has the lands of its
	 * climate as the page and the ground have them. Regression: with none, a worker gave each land the same climate,
	 * and the globe showed other lands than its ground.
	 */
	Work: function () {
		var pool = this.$Service('Workers').Pool('ScenePlanet', {Math: true, Noise: true, Random: true, Pathfinding: true, Blueprints: true, Geometry: true, SceneTerrainGenerator: true, LayoutBlueprints: true, ScenePlanet: true, SceneFlora: true, NetworkBlueprints: true});
		var registry = this.$Service('SceneBiomes');

		if (!pool.Lands && registry && registry.Registry) {
			pool.Lands = true;

			/* As data (a land an application defined may hold a function: no worker takes one). */
			pool.Share('biomes', JSON.parse(JSON.stringify(registry.Names().reduce(function (all, name) {
				all[name] = registry.Get(name);

				return all;
			}, {}))));
		}

		return pool;
	},

	/* What a worker of the planet carries: see Workers; the code of its graphs of relief made first (ReliefCode). */
	Source: function (names) {
		this.ReliefNames.forEach(function (name) {
			this.ReliefRun(name.toLowerCase());
		}, this);

		this.PlateSource();
		this.PictureRun();
		this.RiversSource();

		return this.$Service('Workers').Source(this, names);
	}
});
