/*
 * SceneSower: what the Scatter of a Scene sows in a square of a ground, worked out off the main thread (Work(): the
 * workers of Workers.Pool) or in the page, the same things for the same seed either way.
 * - Sow(job) sows squares of a ground by its rules: job {Squares ([{X, Z}]), Context (what they share: itself, or the
 *   name a worker keeps it under by Share of Workers)}; a job without a Context is its context too. A context is {Key (of
 *   the ground and the rules: a worker makes the field once for it), Options (of the field of the ground,
 *   SceneTerrainGenerator.Flat), Roads (painted on it), Kept (the cells of 4 by 4 where a house of a village stands:
 *   ['x:z']), Rules (of Scatter, of a biome, of a sketch: Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover,
 *   Patch, Clumps, Seed, Passability, Blocks, Reach, Grid, Area, Line, Rows, Spacing, Gap, Way, Fit, Gates, Fixed), Free
 *   ({Areas, Lines}: where the sketch keeps the ground free), Models ({name: {Size, Keys (the Key of SceneModels.Make of
 *   each of 16 variants)}}), Size (of a square, 48), and in the page Field (the field itself, not made again)}. It gives
 *   {Squares: [{X, Z, Lists ({key: {Places, Extra (Float32Array, four numbers a thing), Count, Reach}}), Center}], Blocked
 *   (the cells of 2 by 2 what was sown stops the way through), Things}.
 * - Work(): the pool of its workers, made once.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneSower', {
	$Meta: {
		Description: 'What the Scatter of a Scene sows in squares of a ground, worked out in workers: the same things for the same seed.',
		Methods: ['Sow(job)', 'Work()']
	},

	/* The workers of the sowing: the field of the ground made as the page makes it, the noise and the chances of Models. */
	Work: function () {
		return this.$Service('Workers').Pool('SceneSower', {Math: ['Noise', 'SeedOffset', 'Vectors'], SceneTerrainGenerator: ['Smoothstep', 'Flat', 'Sphere', 'Paint', 'OnRoad', 'Mesh', 'Face', 'SpherePatch', 'Field', 'Piece', 'Grid', 'Free', 'Floor', 'Sketched', 'SketchTypes', 'SketchPlaced', 'SketchChanged', 'SettlementKinds', 'SettlementDistricts', 'SettlementSizes', 'SettlementPlan'], SceneSower: ['Sow', 'Random', 'Ground', 'Within', 'Near', 'Box', 'Touches', 'Keeping', 'Free', 'Footing', 'Footprint', 'Places', 'Chance']});
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
					return Math.hypot(gate.X - px, gate.Z - pz) < 5;
				});
				if (!gated && px >= square.X && px < square.X + size && pz >= square.Z && pz < square.Z + size)
					places.push([px, pz, way]);
			}

			walked += length;
		}

		return places;
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
					var info = context.Models[name];
					var key;
					var list;
					var tone;

					if (height === null || !info) continue;

					key = info.Keys[variant % info.Keys.length];
					list = lists[key] = lists[key] || {Places: [], Extra: []};
					tone = random(0.86, 1.1);

					/* A piece that joins the next (a fence, a hedge, a wall) is as long as the step; the others as their Size says. */
					list.Places.push(place[0], height - 0.05, place[1], fixed && rule.Fit ? Number(rule.Spacing) : rule.Fixed ? place[4].Size || info.Size : fixed && rule.Line ? info.Size : info.Size * random(Number(scale[0]), Number(scale[1])));
					list.Extra.push(fixed ? place[2] : grid ? Math.floor(random(0, 4)) * Math.PI / 2 : random(0, Math.PI * 2), tone, tone * random(0.94, 1.04), tone * random(0.92, 1));

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
