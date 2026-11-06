/*
 * SceneSower: what the Scatter of a Scene sows in a square of a ground, worked out off the main thread (Work(): the
 * workers of Workers.Pool) or in the page, the same things for the same seed either way.
 * - Sow(job) sows squares of a ground by its rules: job {Squares ([{X, Z}]), Context (what they share: itself, or the
 *   name a worker keeps it under by Share of Workers)}; a job without a Context is its context too. A context is {Key (of
 *   the ground and the rules: a worker makes the field once for it), Options (of the field of the ground,
 *   SceneTerrainGenerator.Flat), Roads (painted on it), Kept (the cells of 4 by 4 where a house of a village stands:
 *   ['x:z']), Rules (of Scatter, of a biome, of a sketch: Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover,
 *   Patch, Clumps, Seed, Passability, Blocks, Reach, Grid, Area, Line, Rows, Spacing, Gap, Way, Fit, Gates ([{X, Z, Radius}]: a line is open there), Fixed, Biome (the
 *   land of a ground of lands by their climate it grows in), Source (of a graph, below), Parameters (of its graph)), Free
 *   ({Areas, Lines}: where the sketch keeps the ground free), Models ({name: {Size, Keys (the Key of SceneModels.Make of
 *   each of 16 variants)}}), Size (of a square, 48), and in the page Field (the field itself, not made again)}. It gives
 *   {Squares: [{X, Z, Lists ({key: {Places, Extra (Float32Array, four numbers a thing), Count, Reach}}), Center}], Blocked
 *   (the cells of 2 by 2 what was sown stops the way through), Things}.
 * - A rule of a graph: Graph, a generator of Blueprints that tells where a thing grows and how, in place of MinHeight,
 *   MaxHeight, MaxSlope, Cover and Clumps. Inputs X, Z, Height, Slope, Moisture, Temperature (of the climate of the
 *   ground), Random and Other (numbers of 0 to 1 of the place); results Grow (true, or a number over 0.5), Size (in sizes of
 *   its model), Turn (radians), Shape (the index of one of its Shapes), each left to the rule when it is not there.
 *   Compile(rules), in the page, makes each graph JavaScript (Source) for a worker; LibraryScatter(rule) the graph of a
 *   rule as it is sown with none, the very same things: what an editor starts from.
 * - Work(): the pool of its workers, made once.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneSower', {
	$Meta: {
		Description: 'What the Scatter of a Scene sows in squares of a ground, worked out in workers: the same things for the same seed.',
		Methods: ['Sow(job)', 'Compile(rules)', 'LibraryScatter(rule)', 'Work()']
	},

	/* The workers of the sowing: the field of the ground made as the page makes it, the noise and the chances of Models. */
	Work: function () {
		return this.$Service('Workers').Pool('SceneSower', {Math: ['Noise', 'SeedOffset', 'Vectors'], Noise: ['Types', 'Fractals', 'Whole', 'Post', 'Finish', 'Hash', 'Make', 'Sampler', 'Read', 'Octaves', 'Base', 'Lattice', 'Fade', 'Value', 'Gradient', 'Perlin', 'Simplex', 'Worley'], Blueprints: ['Sizes', 'Numbers', 'Cast', 'Each'], ScenePlanet: ['Kinds', 'Direction', 'LatLon', 'Tangent', 'Make', 'Planet', 'Color', 'Sphere', 'Cells', 'CellAt', 'CellPoint', 'CellNeighbours', 'RiversOf'], SceneTerrainGenerator: ['Smoothstep', 'Border', 'Relief', 'Climate', 'ClimateOf', 'Site', 'Biomes', 'BiomeOf', 'Grassy', 'Flat', 'Volume', 'Underground', 'WayUnder', 'Volumetric', 'Sphere', 'Paint', 'Painted', 'OnRoad', 'Mesh', 'Face', 'SpherePatch', 'Field', 'Piece', 'Grid', 'Free', 'Floor', 'Sketched', 'SketchTypes', 'SketchPlaced', 'SketchChanged', 'SettlementKinds', 'SettlementDistricts', 'SettlementSizes', 'SettlementPlan'], SceneSower: ['Land', 'Grown', 'Sow', 'Random', 'Ground', 'Within', 'Near', 'Box', 'Touches', 'Keeping', 'Free', 'Footing', 'Footprint', 'Places', 'Chance']});
	},

	/* The numbers of a seed, as SceneModels.Random gives them: the same things for the same seed in a worker and in the page. */
	Random: function (text) {
		var value = 2166136261;
		var i;

		for (i = 0; i < text.length; i++)
			value = Math.imul(value ^ text.charCodeAt(i), 16777619);

		return function (low, high) {
			value = Math.imul(value ^ value >>> 15, 2246822519) + 1 | 0;

			return (low || 0) + ((value >>> 0) / 4294967296) * ((high === undefined ? 1 : high) - (low || 0));
		};
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* The field of the ground of a job, made once for its Key (in a worker, kept for the next jobs), with its roads painted. */
	Ground: function (job) {
		var made = this.Made = this.Made || {};
		var field;
		var kept;

		if (made.Key === job.Key) return made;

		/* In the page the field of the ground is given as it is: it is not made again. */
		field = job.Field || this.$Service('SceneTerrainGenerator').Field('Flat', job.Options);
		kept = {};

		(job.Kept || []).forEach(function (cell) {
			kept[cell] = true;
		});

		if (!job.Field && job.Roads && job.Roads.length)
			field = Object.assign(Object.create(field), {Roads: job.Roads});

		this.Made = {Key: job.Key, Field: field, Kept: kept, Boxes: {}};

		return this.Made;
	},

	Within: function (points, x, z) {
		var inside = false;
		var i;
		var j;

		for (i = 0, j = points.length - 1; i < points.length; j = i++) {
			if (points[i][1] > z !== points[j][1] > z && x < (points[j][0] - points[i][0]) * (z - points[i][1]) / (points[j][1] - points[i][1]) + points[i][0])
				inside = !inside;
		}

		return inside;
	},

	Near: function (points, x, z, reach) {
		var i;

		for (i = 0; i + 1 < points.length; i++) {
			var ax = points[i][0];
			var az = points[i][1];
			var dx = points[i + 1][0] - ax;
			var dz = points[i + 1][1] - az;
			var t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
			if (Math.hypot(ax + dx * t - x, az + dz * t - z) < reach) return true;
		}

		return false;
	},

	/* The bounds of a list of points, a reach round them. */
	Box: function (points, reach) {
		var made = {X0: Infinity, Z0: Infinity, X1: -Infinity, Z1: -Infinity};

		points.forEach(function (point) {
			made.X0 = Math.min(made.X0, point[0]);
			made.Z0 = Math.min(made.Z0, point[1]);
			made.X1 = Math.max(made.X1, point[0]);
			made.Z1 = Math.max(made.Z1, point[1]);
		});

		return {X0: made.X0 - reach, Z0: made.Z0 - reach, X1: made.X1 + reach, Z1: made.Z1 + reach};
	},

	/* Whether a square is within the reach of the area or the line of a rule: a rule of a sketch sows only round its own place. */
	Touches: function (rule, square, size) {
		var points = rule.Area || rule.Line;
		var bounds;

		if (!points || !points.length) return true;

		bounds = this.Box(points, 8 + (Number(rule.Spacing) || 0) + (Number(rule.Gap) || 0));

		return square.X + size >= bounds.X0 && square.X <= bounds.X1 && square.Z + size >= bounds.Z0 && square.Z <= bounds.Z1;
	},

	/* What keeps a square free: the areas and the lines of the sketch that reach it. */
	Keeping: function (free, square, size) {
		var self = this;

		function reaches (points, reach) {
			var bounds = self.Box(points, reach);

			return square.X + size >= bounds.X0 && square.X <= bounds.X1 && square.Z + size >= bounds.Z0 && square.Z <= bounds.Z1;
		}

		return {Areas: (free.Areas || []).filter(function (points) {
			return reaches(points, 0);
		}), Lines: (free.Lines || []).filter(function (line) {
			return reaches(line.Points, line.Reach);
		})};
	},

	/* Nothing of any rule grows where the sketch keeps the ground free; the things of a line stand on its way all the same. */
	Free: function (rule, x, z, keep) {
		var self = this;

		if (rule.Line) return true;

		return !keep.Areas.some(function (points) {
			return self.Within(points, x, z);
		}) && !keep.Lines.some(function (line) {
			return self.Near(line.Points, x, z, line.Reach);
		});
	},

	/* Where a building stands: the lowest of its corners, so no corner of it hangs over the ground. */
	Footing: function (field, one) {
		var half = [(one.Width || 0) / 2, (one.Depth || 0) / 2];
		var c = Math.cos(one.Turn || 0);
		var s = Math.sin(one.Turn || 0);
		var low = field.Height(one.X, one.Z);

		[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (corner) {
			var x = corner[0] * half[0];
			var z = corner[1] * half[1];

			low = Math.min(low, field.Height(one.X + c * x + s * z, one.Z + c * z - s * x));
		});

		return low;
	},

	/* The cells of 2 by 2 a building of that width and depth covers, turned as it stands. */
	Footprint: function (x, z, turn, width, depth) {
		var cells = [];
		var c = Math.cos(turn || 0);
		var s = Math.sin(turn || 0);
		var u;
		var v;

		for (u = -width / 2; u <= width / 2; u += 1.5) {
			for (v = -depth / 2; v <= depth / 2; v += 1.5)
				cells.push(Math.floor((x + c * u + s * v) / 2) + ':' + Math.floor((z + c * v - s * u) / 2));
		}

		return cells;
	},

	/* The places of a rule of a sketch in a square: in rows over its area, a piece at each step of its line, or none. */
	Places: function (rule, square, random, size) {
		var places = [];
		var spacing = Math.max(0.3, Number(rule.Spacing) || 2);
		var points = rule.Line;
		var way;
		var i;

		/* Things at their places: the buildings of lots, the towers and the gates of walls. */
		if (rule.Fixed) {
			return rule.Fixed.filter(function (one) {
				return one.X >= square.X && one.X < square.X + size && one.Z >= square.Z && one.Z < square.Z + size;
			}).map(function (one) {
				return [one.X, one.Z, one.Turn || 0, one.Model, one];
			});
		}

		if (rule.Rows) {
			var gap = Math.max(0.3, Number(rule.Gap) || spacing);
			var angle = (Number(rule.Way) || 0) * Math.PI / 180;
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			var reach = size * 0.75;
			var cx = square.X + size / 2;
			var cz = square.Z + size / 2;
			var u;
			var v;

			/* The rows of the whole ground, fixed to its origin: the squares next to each other meet in them. */
			var u0 = Math.floor((cx * c + cz * s - reach) / spacing);
			var v0 = Math.floor((-cx * s + cz * c - reach) / gap);

			for (v = v0; v * gap < -cx * s + cz * c + reach; v++) {
				for (u = u0; u * spacing < cx * c + cz * s + reach; u++) {
					var x = u * spacing * c - v * gap * s;
					var z = u * spacing * s + v * gap * c;
					if (x >= square.X && x < square.X + size && z >= square.Z && z < square.Z + size)
						places.push([x + random(-0.08, 0.08) * spacing, z + random(-0.08, 0.08) * spacing, -angle]);
				}
			}

			return places;
		}

		if (!points)
			return places;

		/* Along the line: the same steps from its start whatever square, each piece turned along its way. */
		var walked = 0;

		for (i = 0; i + 1 < points.length; i++) {
			var dx = points[i + 1][0] - points[i][0];
			var dz = points[i + 1][1] - points[i][1];
			var length = Math.hypot(dx, dz);
			var at = Math.ceil(walked / spacing) * spacing - walked;

			way = Math.atan2(-dz, dx);

			for (; at < length; at += spacing) {
				var px = points[i][0] + dx * (at + spacing / 2) / length;
				var pz = points[i][1] + dz * (at + spacing / 2) / length;

				if (at + spacing / 2 > length) break;

				/* A wall leaves the way of its gates open. */
				var gated = (rule.Gates || []).some(function (gate) {
					return Math.hypot(gate.X - px, gate.Z - pz) < (Number(gate.Radius) || 5);
				});
				if (!gated && px >= square.X && px < square.X + size && pz >= square.Z && pz < square.Z + size)
					places.push([px, pz, way]);
			}

			walked += length;
		}

		return places;
	},

	/*
	 * The land of a place of a ground of lands by their climate (Biomes): where they meet, one of them by their parts, the
	 * same for the same place, so their things mingle at the edge. Kept for the place.
	 */
	Land: function (ground, place) {
		var key = place[0] + ':' + place[1];
		var lands;
		var pick;
		var i;

		ground.Lands = ground.Lands || {};

		if (ground.Lands[key] !== undefined) return ground.Lands[key];

		lands = ground.Field.Biome(place[0], place[1]).List;
		pick = Math.abs(Math.sin(place[0] * 39.3468 + place[1] * 11.135) * 24634.6345) % 1;

		for (i = 0; i < lands.length - 1 && pick >= lands[i].Weight; i++)
			pick -= lands[i].Weight;

		ground.Lands[key] = lands[i] ? lands[i].Name : '';

		return ground.Lands[key];
	},

	/*
	 * Rules with a graph (Graph: a generator of Blueprints) made ready to sow, in the page: each with the source of its graph made
	 * JavaScript (Source), its graph left out, so a worker runs it with no Blueprints of its own. Rules without one as they are.
	 */
	Compile: function (rules) {
		var blueprints = this.$Service('Blueprints');

		return (rules || []).map(function (rule) {
			var made;
			var copy;

			if (!rule.Graph || rule.Source) return rule;

			made = blueprints.Code(typeof rule.Graph === 'string' ? JSON.parse(rule.Graph) : rule.Graph);
			copy = Object.assign({}, rule, {Source: made ? made.Source : null});

			delete copy.Graph;

			return copy;
		});
	},

	/*
	 * What the graph of a rule says of a place: its inputs X, Z, Height, Slope, Moisture and Temperature (of the climate of the
	 * ground), Random and Other (two numbers of 0 to 1 of the place, the same for the same place); its results Grow (whether a
	 * thing grows there: true, or a number over 0.5), Size (in sizes of its model), Turn (radians) and Shape (the index of one
	 * of its Shapes), each left to the rule when it does not tell it. Parameters of the rule are those of the graph.
	 */
	Grown: function (rule, place, height, field) {
		var x = place[0];
		var z = place[1];
		var growers = this.Growers = this.Growers || {};
		var run = growers[rule.Source] = growers[rule.Source] || new Function('B', 'M', 'N', rule.Source)(this.$Service('Blueprints'), this.$Service('Math'), this.$Service('Noise'));
		var inputs = {X: x, Z: z, Height: height, Random: Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1, Other: Math.abs(Math.sin(x * 39.3468 + z * 11.135) * 24634.6345) % 1};
		var weather = null;
		var made;

		/* What costs is read only when the graph reads it. */
		function climate () {
			weather = weather || (field.Climate ? field.Climate(x, z) : {Moisture: 0.5, Temperature: 0.5});

			return weather;
		}

		Object.defineProperty(inputs, 'Slope', {enumerable: true, get: function () {
			return field.Slope(x, z);
		}});
		Object.defineProperty(inputs, 'Moisture', {enumerable: true, get: function () {
			return climate().Moisture;
		}});
		Object.defineProperty(inputs, 'Temperature', {enumerable: true, get: function () {
			return climate().Temperature;
		}});

		made = run(rule.Parameters || {}, inputs) || {};

		return {Grow: made.Grow === undefined ? true : Number(made.Grow) > 0.5, Size: made.Size, Turn: made.Turn, Shape: made.Shape};
	},

	/*
	 * The graph of a rule as the sowing tells it with none (a generator of Blueprints for Graph of a rule): its heights
	 * (MinHeight, MaxHeight), its slope (MaxSlope), its patches (Cover, Patch) and its clumps (Clumps) as blocks, Grow of them
	 * all; the very same things grow of it. What an editor starts from to make a rule of its own.
	 */
	LibraryScatter: function (rule) {
		var given = rule || {};
		var blueprints = this.$Service('Blueprints');
		var graph = blueprints.Create('generator', {name: 'Scatter'});
		var seed = String(given.Seed === undefined ? given.ID : given.Seed);
		var patch = Number(given.Patch) || 60;
		var cover = given.Cover === undefined ? 1 : Number(given.Cover);
		var clumps = Number(given.Clumps) || 0;
		var all = null;
		var x;
		var z;
		var height;
		var slope;
		var random;
		var grow;

		function add (type, properties) {
			return blueprints.Add(graph, type, {x: 0, y: 0, properties: properties || {}});
		}

		function link (from, key, to, input) {
			blueprints.Link(graph, [from.id, key], [to.id, input]);
		}

		function number (value) {
			return add('Number', {Value: value});
		}

		/* A test of a value against a number: a and b, linked; true where it holds. */
		function compare (from, key, operator, value) {
			var test = add('Compare', {Operator: operator});

			link(from, key, test, 'A');
			link(number(value), 'Value', test, 'B');

			return both(test);
		}

		/* All the tests so far, and this one. */
		function both (test) {
			var and;

			if (!all) {
				all = test;

				return test;
			}

			and = add('And');

			link(all, 'Out', and, 'A');
			link(test, 'Out', and, 'B');

			all = and;

			return and;
		}

		/* The noise of its patches at [X / Patch, y, Z / Patch]. */
		function patches (y) {
			var u = add('Divide');
			var w = add('Divide');
			var size = number(patch);
			var at = add('Combine');
			var noise = add('NoiseSpec', {Type: 'value', Seed: seed, Fractal: 'fbm', Octaves: 3, Gain: 0.5});

			link(x, 'Value', u, 'A');
			link(size, 'Value', u, 'B');
			link(z, 'Value', w, 'A');
			link(size, 'Value', w, 'B');
			link(u, 'Out', at, 'X');
			link(number(y), 'Value', at, 'Y');
			link(w, 'Out', at, 'Z');
			link(at, 'XYZ', noise, 'Position');

			return noise;
		}

		x = add('Input', {Name: 'X'});
		z = add('Input', {Name: 'Z'});
		height = add('Input', {Name: 'Height'});
		slope = add('Input', {Name: 'Slope'});
		random = add('Input', {Name: 'Random'});
		grow = add('Result', {Key: 'Grow'});

		compare(height, 'Value', '>=', given.MinHeight === undefined ? 1 : Number(given.MinHeight));

		if (given.MaxHeight !== undefined)
			compare(height, 'Value', '<=', Number(given.MaxHeight));

		compare(slope, 'Value', '<=', given.MaxSlope === undefined ? 0.3 : Number(given.MaxSlope));

		/* Its patches: where the noise of them is over its Cover, none. */
		if (cover < 1) {
			var scaled = add('Multiply');
			var lowered = add('Subtract');

			link(patches(0.5), 'Value', scaled, 'A');
			link(number(1.6), 'Value', scaled, 'B');
			link(scaled, 'Out', lowered, 'A');
			link(number(0.3), 'Value', lowered, 'B');

			compare(lowered, 'Out', '<=', cover);
		}

		/* Its clumps: thick in groves and thin between them, the number of the place against how thick they are there. */
		if (clumps > 0) {
			var steep = add('Smoothstep');
			var open = add('OneMinus');
			var thin = add('Multiply');
			var thick = add('OneMinus');
			var test = add('Compare', {Operator: '<='});

			link(number(0.35), 'Value', steep, 'Low');
			link(number(0.65), 'Value', steep, 'High');
			link(patches(1.7), 'Value', steep, 'X');
			link(steep, 'Out', open, 'X');
			link(number(Math.min(1, clumps)), 'Value', thin, 'A');
			link(open, 'Out', thin, 'B');
			link(thin, 'Out', thick, 'X');
			link(random, 'Value', test, 'A');
			link(thick, 'Out', test, 'B');

			both(test);
		}

		link(all, 'Out', grow, 'Value');

		return graph;
	},

	/* The height a thing of a rule stands at, at a place; null where it does not grow. */
	Chance: function (rule, place, ground, noise, keep) {
		var terrain = this.$Service('SceneTerrainGenerator');
		var field = ground.Field;
		var cover = rule.Cover === undefined ? 1 : Number(rule.Cover);
		var height = field.Height(place[0], place[1]);

		if (ground.Kept[Math.floor(place[0] / 4) + ':' + Math.floor(place[1] / 4)]) return null;
		if (rule.Area && !this.Within(rule.Area, place[0], place[1])) return null;
		if (!this.Free(rule, place[0], place[1], keep)) return null;
		if (field.Roads && terrain.OnRoad(field, place[0], place[1], 3)) return null;
		if (rule.Biome && field.Biomes && this.Land(ground, place) !== rule.Biome) return null;

		/* A rule of a graph tells all the rest itself (Grown). */
		if (rule.Source) return height;

		if (height < (rule.MinHeight === undefined ? 1 : Number(rule.MinHeight))) return null;
		if (rule.MaxHeight !== undefined && height > Number(rule.MaxHeight)) return null;
		if (field.Slope(place[0], place[1]) > (rule.MaxSlope === undefined ? 0.3 : Number(rule.MaxSlope))) return null;

		if (cover < 1 && noise.Fbm(place[0] / (Number(rule.Patch) || 60), 0.5, place[1] / (Number(rule.Patch) || 60), 3) * 1.6 - 0.3 > cover) return null;

		/* Clumps: thick in groves and thin between them, where Cover would leave none; the same place, the same choice. */
		if (Number(rule.Clumps) > 0 && Math.abs(Math.sin(place[0] * 12.9898 + place[1] * 78.233) * 43758.5453) % 1 > 1 - Math.min(1, Number(rule.Clumps)) * (1 - terrain.Smoothstep(0.35, 0.65, noise.Fbm(place[0] / (Number(rule.Patch) || 60), 1.7, place[1] / (Number(rule.Patch) || 60), 3)))) return null;

		return height;
	},

	Sow: function (job) {
		var self = this;
		/* What the squares share: told in the job, or kept by a worker under its name (Workers, Share). */
		var context = typeof job.Context === 'string' ? this.$Shared(job.Context) : job.Context || job;
		var ground = this.Ground(context);
		var field = ground.Field;
		var math = this.$Service('Math');
		var size = Number(context.Size) || 48;
		var blocked = {};
		var things = 0;
		var noises = {};

		var squares = job.Squares.map(function (square) {
			var lists = {};
			var keep = self.Keeping(context.Free || {}, square, size);
			var made = {X: square.X, Z: square.Z, Lists: {}};

			context.Rules.filter(function (rule) {
				return self.Touches(rule, square, size);
			}).forEach(function (rule) {
				var seed = String(rule.Seed === undefined ? rule.ID : rule.Seed);
				var random = self.Random(seed + ':' + square.X + ':' + square.Z);
				var noise = noises[seed] = noises[seed] || math.Noise(seed);
				var shapes = [].concat(rule.Shapes || 'pine');
				var count = Number(rule.Density === undefined ? 4 : rule.Density) * size * size / 100;
				var scale = rule.Size || [0.8, 1.3];
				var grid = Number(rule.Grid) || 0;
				var fixed;
				var i;

				/* Tiles of ready models: a cell each, turned by quarters, all of a square. */
				if (grid)
					count = Math.ceil(size / grid) * Math.ceil(size / grid);

				/* Rows and lines of a sketch: their own places, each with its turn. */
				fixed = rule.Rows || rule.Line || rule.Fixed ? self.Places(rule, square, random, size) : null;

				if (fixed)
					count = fixed.length;

				for (i = 0; i < count; i++) {
					var place = fixed ? fixed[i] : grid ? [Math.ceil(square.X / grid) * grid + (i % Math.ceil(size / grid)) * grid, Math.ceil(square.Z / grid) * grid + Math.floor(i / Math.ceil(size / grid)) * grid] : [square.X + random(0, size), square.Z + random(0, size)];
					var name = rule.Fixed ? place[3] : shapes[Math.floor(random(0, shapes.length))];
					var variant = rule.Fixed ? place[4].Variant || 0 : Math.floor(random(0, 16));
					var height = rule.Fixed ? self.Footing(field, place[4]) : self.Chance(rule, place, ground, noise, keep);
					var grown = height !== null && rule.Source && !rule.Fixed ? self.Grown(rule, place, height, field) : null;
					var info;
					var key;
					var list;
					var tone;
					var large;
					var turn;

					if (grown && !grown.Grow) continue;

					if (grown && grown.Shape !== undefined && isFinite(grown.Shape))
						name = shapes[((Math.floor(Number(grown.Shape)) % shapes.length) + shapes.length) % shapes.length];

					info = context.Models[name];

					if (height === null || !info) continue;

					key = info.Keys[variant % info.Keys.length];
					list = lists[key] = lists[key] || {Places: [], Extra: []};
					tone = random(0.86, 1.1);

					/* A piece that joins the next (a fence, a hedge, a wall) is as long as the step; the others as their Size says. */
					large = fixed && rule.Fit ? Number(rule.Spacing) : rule.Fixed ? place[4].Size || info.Size : fixed && rule.Line ? info.Size : info.Size * random(Number(scale[0]), Number(scale[1]));
					turn = fixed ? place[2] : grid ? Math.floor(random(0, 4)) * Math.PI / 2 : random(0, Math.PI * 2);

					/* What a graph tells of its size and its turn, over the chance. */
					if (grown && grown.Size !== undefined && isFinite(grown.Size))
						large = info.Size * Number(grown.Size);

					if (grown && grown.Turn !== undefined && isFinite(grown.Turn))
						turn = Number(grown.Turn);

					list.Places.push(place[0], height - 0.05, place[1], large);
					list.Extra.push(turn, tone, tone * random(0.94, 1.04), tone * random(0.92, 1));

					list.Reach = rule.Reach ? Number(rule.Reach) : 0;

					/*
					 * A building stops the way over all of its ground; the others as their Passability tells, how many of them leave a
					 * way through (1 all, 0 none); a piece of a line stops all along it.
					 */
					if (rule.Fixed && place[4].Width) {
						self.Footprint(place[0], place[1], place[2], place[4].Width, place[4].Depth).forEach(function (cell) {
							blocked[cell] = true;
						});
					}
					else if (rule.Passability !== undefined ? random(0, 1) >= Number(rule.Passability) : rule.Blocks !== false && rule.Blocks !== 'false' && info.Size > 2) {
						[-0.5, -0.25, 0, 0.25, 0.5].forEach(function (along) {
							var reach = fixed && rule.Line ? info.Size * along : 0;

							blocked[Math.floor((place[0] + Math.cos(place[2] || 0) * reach) / 2) + ':' + Math.floor((place[1] - Math.sin(place[2] || 0) * reach) / 2)] = true;
						});
					}

					things++;
				}
			});

			Object.keys(lists).forEach(function (key) {
				made.Lists[key] = {Places: new Float32Array(lists[key].Places), Extra: new Float32Array(lists[key].Extra), Count: lists[key].Places.length / 4, Reach: lists[key].Reach};
			});

			made.Center = [square.X + size / 2, field.Height(square.X + size / 2, square.Z + size / 2), square.Z + size / 2];

			return made;
		});

		return {Squares: squares, Blocked: Object.keys(blocked), Things: things};
	}
});
