/*
 * ScenePlanet: a planet as one continuous function of a direction from its centre, the same at any distance: the globe
 * of the space of a Scene, the map an editor paints and each location of its surface read the very same numbers, so a
 * coast seen from orbit is the coast walked on. Nothing is baked: a point is reckoned when it is asked for, as fine as
 * it is asked.
 * - Make(options): a planet of options {Radius (km, 6371), Seed, Ocean (the part of it under the sea, 0.65), Relief
 *   (metres of its highest mountains, 8000), Depth (metres of its deepest sea, 6000), Plates (how many tectonic plates,
 *   14), Detail (km: the finest the coasts are told by the globe; finer, the land and the sea are never turned one into
 *   the other, 2), Paint (what a developer drew, below), Biomes (names of SceneBiomes, the usual six), Baked (the
 *   grounds of locations baked into it, SceneLocations.Bake: {ID: {Latitude, Longitude, Turn, Size, Side, Heights, Edge}};
 *   there its heights are theirs, edits and all, its own again over Edge metres at their edge)}. It gives
 *   {Options, Radius, Sample(direction, finest), Elevation(direction, finest) (finest: km, the finest asked; all by default), Land(direction), Plate(direction), Wind(direction),
 *   Climate(direction), Biome(direction), Point(direction), Direction(latitude, longitude), LatLon(direction)}.
 *   Sample gives all of a point at once: {Elevation (metres over the sea), Land (true over it), Plate {ID, Oceanic,
 *   Boundary (km to the next plate), Push (how the two meet: over 0 they close, mountains and trenches; under 0 they part,
 *   rifts and ridges)}, Wind [east, north] (m/s), Celsius, Temperature and Moisture (0 to 1), Biome (a name; '' under the
 *   sea)}.
 * - Paint: strokes over the globe, each of points [latitude, longitude] in degrees: land and sea (areas: Points, Edge km:
 *   continents and oceans where they are drawn), mountains (a line: Width km, Height metres), rift (a line: Width, Depth),
 *   river (a line: Width km), climate (an area: Temperature in °C more or less, Moisture more or less, Edge) and biome (an
 *   area: Biome, Edge).
 * - Project(view, direction) and Unproject(view, x, y): a globe in a view {Yaw, Pitch, Zoom, Width, Height}; Picture(options,
 *   view, rect, step, overlay) a piece of its picture (RGBA), each pixel reckoned of the planet, so it is sharp however near:
 *   overlay relief, plates, wind, temperature, moisture or biomes (Color); Work() the workers that paint it.
 * - Sphere(options): its ground as SceneTerrainGenerator.Sphere gives one (Land, Elevation, Point, Altitude, Patch with the
 *   colors of the globe): what a Scene lands on and draws near, square by square, as fine as the eye needs.
 * - Cells, CellAt, CellOf, CellCenter, CellCorners, CellNeighbours, CellPlace: the locations of a planet as cells, squares of
 *   the faces of a cube or hexagons of an icosahedron (12 of them pentagons), each a place for the step Planet of a World
 *   (its latitude, longitude, turn, size, outline and sides).
 * The same functions run in workers and in Node: they read no page.
 */
Elemenx.Service('ScenePlanet', {
	$Meta: {
		Description: 'A planet as one continuous function of a direction: painted continents, tectonic plates, winds, climate and biomes, as fine as it is asked.',
		Methods: ['Make(options)', 'Direction(latitude, longitude)', 'LatLon(direction)', 'Kinds()', 'Project(view, direction)', 'Unproject(view, x, y)', 'Planet(options)', 'Color(planet, sample, overlay, light)', 'Picture(options, view, rect, step, overlay)', 'Face(options, face, size, row, rows)', 'Heights(options, face, size, row, rows)', 'Drainage(heights, size, least)', 'UseRivers(key, rivers)', 'Settlements(options, count)', 'UseSettlements(key, towns)', 'Lights(options, face, size, row, rows)', 'Sphere(options)', 'Cells(radius, size, kind)', 'CellAt(radius, size, direction, kind)', 'CellOf(id)', 'CellPoint(cell, a, b)', 'CellCenter(cell)', 'CellCorners(cell)', 'CellNeighbours(radius, size, cell)', 'CellPlace(radius, cell)', 'Work()', 'Source(names)']
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
		var given = options || {};
		var noise = this.$Service('Noise');
		var radius = Number(given.Radius) || 6371;
		var seed = given.Seed === undefined ? 'planet' : String(given.Seed);
		var ocean = given.Ocean === undefined ? 0.65 : Number(given.Ocean);
		var relief = Number(given.Relief) || 8000;
		var depth = Number(given.Depth) || 6000;
		var detail = Number(given.Detail) || 2;
		var count = Math.max(2, Math.round(Number(given.Plates) || 14));
		/* Octaves of the coasts: from a feature of a quarter of the planet down to Detail. */
		var octaves = Math.max(3, Math.min(16, Math.ceil(Math.log(radius * 1.5 / detail) / Math.LN2)));
		var shape = noise.Make({Type: 'simplex', Seed: seed + '-shape', Fractal: 'fbm', Octaves: octaves, Gain: 0.52});
		var coarse = noise.Make({Type: 'simplex', Seed: seed + '-shape', Fractal: 'fbm', Octaves: 5, Gain: 0.52});
		var warp = noise.Make({Type: 'simplex', Seed: seed + '-warp', Fractal: 'fbm', Octaves: 3});
		var folds = noise.Make({Type: 'simplex', Seed: seed + '-folds', Fractal: 'ridged', Octaves: Math.min(12, octaves), Gain: 0.5});
		var crags = noise.Make({Type: 'simplex', Seed: seed + '-crags', Fractal: 'ridged', Octaves: 6, Gain: 0.5});
		/*
		 * The relief over the land, as it is made on the Earth: an uplift of whole regions (highlands, plateaus, shields), chains
		 * of ranges of a ridged multifractal on bent ways where it rises, and hills and detail down to tens of metres, rougher
		 * the higher and steeper the land (a heterogeneous terrain: valleys smooth, peaks rugged).
		 */
		var uplift = noise.Make({Type: 'simplex', Seed: seed + '-uplift', Fractal: 'fbm', Octaves: 3, Gain: 0.5});
		var ranges = noise.Make({Type: 'simplex', Seed: seed + '-ranges', Fractal: 'ridged', Octaves: 7, Gain: 0.5, Warp: {Amount: 0.5, Scale: 0.4, Octaves: 2}});
		var hills = noise.Make({Type: 'simplex', Seed: seed + '-hills', Fractal: 'fbm', Octaves: 6, Gain: 0.5});
		var grain = noise.Make({Type: 'simplex', Seed: seed + '-grain', Fractal: 'fbm', Octaves: 6, Gain: 0.48});
		var weather = noise.Make({Type: 'simplex', Seed: seed + '-weather', Fractal: 'fbm', Octaves: 3});
		/* Its lands: BiomeList when given (a worker has no registry of them), else of their names. */
		var biomes = this.$Service('SceneTerrainGenerator').Biomes(given.BiomeList ? {BiomeList: given.BiomeList} : {Biomes: given.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']});
		var strokes = (given.Paint || []).map(function (stroke) {
			return Object.assign({}, stroke, {Directions: (stroke.Points || []).map(function (point) {
				return self.Direction(Number(point[0]), Number(point[1]));
			})});
		});
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

		(Array.isArray(given.Rivers) ? given.Rivers : given.Rivers ? self.RiversOf(given.Rivers) : []).forEach(function (river, index) {
			var points = river.Points || [];
			var k;

			for (k = 0; k + 1 < points.length; k++) {
				var segment = {A: points[k], B: points[k + 1], FlowA: river.Flow[k], FlowB: river.Flow[k + 1], LevelA: river.Level[k], LevelB: river.Level[k + 1], River: index};
				var keys = {};

				streams.push(segment);

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
		var plates = [];
		var level = 0;
		var state = 2166136261;
		var i;
		var planet;

		/* The numbers of the seed, always the same. */
		function random () {
			var text = seed + ':' + state;
			var value = 2166136261;
			var k;

			for (k = 0; k < text.length; k++)
				value = Math.imul(value ^ text.charCodeAt(k), 16777619);

			state = value >>> 0;

			return (state % 100000) / 100000;
		}

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

		function smoothstep (from, to, value) {
			var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

			return t * t * (3 - 2 * t);
		}

		function angle (a, b) {
			return Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
		}

		/* The east and the north of a point, unit vectors in its tangent plane. */
		function frame (p) {
			var east = Math.abs(p[1]) > 0.9999 ? [0, 0, -1] : normalize(cross([0, 1, 0], p));

			return {East: east, North: normalize(cross(p, east))};
		}

		/* The angle from a point to a line of directions (great circles between them), radians. */
		function toLine (p, line) {
			var best = Infinity;
			var k;

			for (k = 0; k + 1 < line.length; k++) {
				var a = line[k];
				var b = line[k + 1];
				var n = normalize(cross(a, b));
				var off = dot(p, n);
				var q = normalize([p[0] - n[0] * off, p[1] - n[1] * off, p[2] - n[2] * off]);
				var span = angle(a, b);

				best = Math.min(best, Math.abs(angle(a, q) + angle(q, b) - span) < 1e-6 ? Math.asin(Math.min(1, Math.abs(off))) : Math.min(angle(p, a), angle(p, b)));
			}

			if (line.length === 1)
				best = angle(p, line[0]);

			return best;
		}

		/* Whether a point is inside an area of directions: how many times its outline goes round the point. */
		function inside (p, area) {
			var axes = frame(p);
			var turned = 0;
			var last = null;
			var k;

			for (k = 0; k <= area.length; k++) {
				var v = area[k % area.length];
				var at = Math.atan2(dot(v, axes.East), dot(v, axes.North));

				if (last !== null) {
					var step = at - last;

					while (step > Math.PI) step -= Math.PI * 2;

					while (step < -Math.PI) step += Math.PI * 2;

					turned += step;
				}

				last = at;
			}

			return Math.abs(turned) > Math.PI;
		}

		/* How much of an area a point is, 0 to 1: softly over Edge km round its outline. */
		function within (p, stroke) {
			var edge = Math.max(1, Number(stroke.Edge) || 200) / radius;
			var far = toLine(p, stroke.Directions.concat([stroke.Directions[0]]));
			var t;

			if (inside(p, stroke.Directions))
				return far >= edge ? 1 : 0.5 + far / edge * 0.5;

			t = Math.max(0, 1 - far / edge);

			return t * 0.5;
		}

		/* The tectonic plates: their middles over the globe as a spiral spreads them, moved by the seed; each its way. */
		for (i = 0; i < count; i++) {
			var y = 1 - (i + 0.5) / count * 2;
			var around = Math.sqrt(Math.max(0, 1 - y * y));
			var turn = i * 2.39996 + random() * 1.2;
			var middle = normalize([Math.cos(turn) * around + (random() - 0.5) * 0.4, y + (random() - 0.5) * 0.4, Math.sin(turn) * around + (random() - 0.5) * 0.4]);
			var axes = frame(middle);
			var way = random() * Math.PI * 2;
			var speed = 0.3 + random() * 0.7;

			plates.push({ID: i, Middle: middle, Motion: [(axes.East[0] * Math.cos(way) + axes.North[0] * Math.sin(way)) * speed, (axes.East[1] * Math.cos(way) + axes.North[1] * Math.sin(way)) * speed, (axes.East[2] * Math.cos(way) + axes.North[2] * Math.sin(way)) * speed], Oceanic: random() < ocean * 0.85});
		}

		/* The plate of a point (its borders bent by a noise), the next one, and how they meet there. */
		function plate (p) {
			var q = normalize([p[0] + (warp.At(p[0] * 3, p[1] * 3, p[2] * 3) - 0.5) * 0.35, p[1] + (warp.At(p[0] * 3 + 7, p[1] * 3, p[2] * 3) - 0.5) * 0.35, p[2] + (warp.At(p[0] * 3, p[1] * 3 + 7, p[2] * 3) - 0.5) * 0.35]);
			var first = null;
			var second = null;
			var normal;
			var relative;

			plates.forEach(function (one) {
				var near = dot(q, one.Middle);

				if (!first || near > first.Near) {
					second = first;
					first = {Plate: one, Near: near};
				}
				else if (!second || near > second.Near) {
					second = {Plate: one, Near: near};
				}
			});

			normal = normalize([second.Plate.Middle[0] - first.Plate.Middle[0], second.Plate.Middle[1] - first.Plate.Middle[1], second.Plate.Middle[2] - first.Plate.Middle[2]]);
			relative = [first.Plate.Motion[0] - second.Plate.Motion[0], first.Plate.Motion[1] - second.Plate.Motion[1], first.Plate.Motion[2] - second.Plate.Motion[2]];

			/* The angle to the border: where the two middles are as near, half the difference of their angles. */
			return {ID: first.Plate.ID, Oceanic: first.Plate.Oceanic, Other: second.Plate, Boundary: (angle(q, second.Plate.Middle) - angle(q, first.Plate.Middle)) / 2 * radius, Push: dot(relative, normal)};
		}

		/* What the strokes of a kind make of a point: the sum of their parts (areas) or of their nearness (lines). */
		function painted (p, kind, measure) {
			var sum = 0;

			strokes.forEach(function (stroke) {
				if (stroke.Type !== kind || !stroke.Directions.length) return;

				sum += measure(stroke);
			});

			return sum;
		}

		/*
		 * The land of a point, a number over 0 above the sea: a noise to the fineness of Detail, the plates (continents ride
		 * on their own), what was drawn (land and sea), all told before any detail, so its 0 is the coast at any scale.
		 */
		function continent (p, tectonic) {
			var value = (shape.At(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6) - 0.5) * 2.2 + (tectonic.Oceanic ? -0.25 : 0.25) - level;

			value += painted(p, 'land', function (stroke) {
				return within(p, stroke) * Math.max(0, 1.2 - value);
			});
			value -= painted(p, 'sea', function (stroke) {
				return within(p, stroke) * Math.max(0, value + 1.2);
			});

			return value;
		}

		/* The level of its sea: what leaves Ocean of a spread of its points under it, before anything is drawn. */
		(function () {
			var values = [];
			var k;

			for (k = 0; k < 600; k++) {
				var y = 1 - (k + 0.5) / 600 * 2;
				var around = Math.sqrt(Math.max(0, 1 - y * y));
				var p = [Math.cos(k * 2.39996) * around, y, Math.sin(k * 2.39996) * around];

				values.push((shape.At(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6) - 0.5) * 2.2 + (plate(p).Oceanic ? -0.25 : 0.25));
			}

			values.sort(function (a, b) {
				return a - b;
			});

			level = values[Math.max(0, Math.min(599, Math.round(ocean * 600)))];
		})();

		/* The height of a point over the sea, metres, and what it is made of: its plate, its land. */
		function raise (p, finest) {
			var tectonic = plate(p);
			var land = continent(p, tectonic);
			var meet = Math.exp(-Math.abs(tectonic.Boundary) / 180);
			var ridged = folds.At(p[0] * 9, p[1] * 9, p[2] * 9);
			var height;

			/* Over the sea: the land rises with its number, mountains where plates close, rifts where they part. */
			if (land > 0) {
				var coast = smoothstep(0, 0.12, land);
				var lift = uplift.At(p[0] * 2.2, p[1] * 2.2, p[2] * 2.2);
				var chains = smoothstep(0.5, 0.8, lift) + meet * Math.max(0, tectonic.Push) * 1.2;
				var risen;
				var rough;
				var small = finest === undefined ? 0 : finest;

				chains = Math.min(1, chains) * coast;

				/* The plain rising inland, the highlands and the plateaus where the land is lifted. */
				height = 15 + Math.pow(Math.min(1.5, land), 1.1) * 780 + smoothstep(0.42, 0.8, lift) * 900 * coast;

				/* The ranges: sharp crests and their spurs, where the land is lifted and where plates close. */
				risen = ranges.At(p[0] * 14, p[1] * 14, p[2] * 14);
				height += Math.pow(risen, 2.6) * relief * 0.55 * chains;
				height += Math.max(0, tectonic.Push) * meet * relief * 0.35 * (0.4 + ridged * 0.6);
				height -= Math.max(0, -tectonic.Push) * meet * 900;
				height += painted(p, 'mountains', function (stroke) {
					var width = Math.max(1, Number(stroke.Width) || 150) / radius;
					var near = toLine(p, stroke.Directions);

					return near < width ? Math.pow(1 - near / width, 1.5) * (Number(stroke.Height) || 4000) * (0.55 + ridged * 0.45) : 0;
				});
				height -= painted(p, 'rift', function (stroke) {
					var width = Math.max(1, Number(stroke.Width) || 60) / radius;
					var near = toLine(p, stroke.Directions);

					return near < width ? (1 - near / width) * (Number(stroke.Depth) || 1200) : 0;
				});

				/* A river: its valley down to near the sea where it goes. */
				height *= 1 - painted(p, 'river', function (stroke) {
					var width = Math.max(0.1, Number(stroke.Width) || 6) / radius;
					var near = toLine(p, stroke.Directions);

					return near < width * 4 ? (1 - Math.min(1, near / (width * 4))) * 0.85 : 0;
				});

				/*
				 * Finer than the ranges: hills of tens of kilometres down to one, and the grain of the ground down to tens of
				 * metres, as rough as the land is high and in its chains; none finer than is asked (finest, km: a globe needs none).
				 */
				/* Some lowlands hilly (old worn ranges), some plains flat, by a field of their own of hundreds of kilometres. */
				var hilly = smoothstep(0.38, 0.72, uplift.At(p[0] * 7 + 31, p[1] * 7, p[2] * 7));

				rough = Math.max(0.06 + hilly * 0.5, Math.min(1, height / 3200 + chains * 0.5));

				if (small < 20) {
					var wide = radius / 40;

					height += (hills.At(p[0] * wide, p[1] * wide, p[2] * wide) - 0.5) * 2 * (40 + 700 * rough) * coast;
				}

				if (small < 1) {
					var close = radius / 1.2;
					var rugged = Math.max(0, Math.min(1, (height - 600) / 2400));

					height += (grain.At(p[0] * close, p[1] * close, p[2] * close) - 0.5) * 2 * (6 + 220 * rough) * coast;
					height += (crags.At(p[0] * close * 0.6, p[1] * close * 0.6, p[2] * close * 0.6) - 0.45) * rugged * (180 + height * 0.12);
				}

				height = Math.max(1, carved(p, height));
			}
			else {
				height = -(120 + Math.pow(Math.min(1.5, -land), 0.7) * depth * 0.8);
				height += Math.max(0, -tectonic.Push) * meet * 2200 * (tectonic.Oceanic ? 1 : 0.4);
				height -= Math.max(0, tectonic.Push) * meet * depth * 0.4 * (tectonic.Oceanic ? 1 : 0.3);
				height = Math.min(-1, height);
			}

			return {Height: baked(p, height), Tectonic: tectonic, Land: land};
		}

		/*
		 * The valley of a river near a point: the ground comes down toward its bed as it nears it (wider the more it drains: a
		 * valley of 0.6 km times its flow to 0.4), the bed going down to the sea along it.
		 */
		/* The nearest river to a point: {Far (km), Flow, Level}; null with none near. */
		function nearestRiver (p) {
			var found = buckets[self.CellAt(1, Math.PI / 2 / 48, p).ID];
			var best = null;

			if (!found)
				return null;

			found.forEach(function (segment) {
				var a = segment.A;
				var b = segment.B;
				var ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
				var t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / Math.max(1e-18, dot(ab, ab))));
				var q = [a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2]];
				var far = Math.sqrt(dot(q, q)) * radius;
				if (!best || far < best.Far)
					best = {Far: far, Flow: segment.FlowA + (segment.FlowB - segment.FlowA) * t, Level: segment.LevelA + (segment.LevelB - segment.LevelA) * t};
			});

			return best;
		}

		function carved (p, height) {
			var best = nearestRiver(p);
			var made = height;

			if (!best)
				return height;

			var valley = 0.6 * Math.pow(best.Flow, 0.4);
			var bed = Math.max(2, Math.min(best.Level, height));

			if (best.Far >= valley) return height;

			/* The valley: the ground down toward the bed, gently at its sides, some of its hills kept on its floor (the river itself is of the sketch of a location). */
			made = bed + (height - bed) * Math.max(0.12, smoothstep(0, valley, best.Far));

			return made;
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

		/* The land of a point roughly, for what the winds bring: fewer octaves, its plate of its middle alone. */
		function roughly (p) {
			var best = plates[0];

			plates.forEach(function (one) {
				if (dot(p, one.Middle) > dot(p, best.Middle))
					best = one;
			});

			return (coarse.At(p[0] * 1.6, p[1] * 1.6, p[2] * 1.6) - 0.5) * 2.2 + (best.Oceanic ? -0.25 : 0.25) - level + painted(p, 'land', function (stroke) {
				return within(p, stroke);
			}) - painted(p, 'sea', function (stroke) {
				return within(p, stroke);
			});
		}

		function sample (direction, finest) {
			var p = normalize(direction);
			var raised = raise(p, finest);
			var tectonic = raised.Tectonic;
			var land = raised.Land;
			var height = raised.Height;
			var latitude = Math.asin(Math.max(-1, Math.min(1, p[1])));
			var celsius;
			var moisture;
			var wind;
			var axes = frame(p);
			var band = Math.abs(latitude) * 180 / Math.PI;
			var east;
			var north;
			var upwind;
			var biome = '';
			var k;

			/* The winds: easterly trades to 30 degrees, westerlies to 60, polar easterlies; toward the low of the equator and 60. */
			east = band < 30 ? -1 : band < 60 ? 1 : -0.6;
			north = (band < 30 ? -0.35 : band < 60 ? 0.3 : -0.2) * (latitude >= 0 ? 1 : -1);
			east += (weather.At(p[0] * 4, p[1] * 4, p[2] * 4) - 0.5) * 0.8;
			north += (weather.At(p[0] * 4 + 9, p[1] * 4, p[2] * 4) - 0.5) * 0.8;
			wind = [east * 8, north * 8];

			/* Warm at the equator, cold at the poles and up high; the sea keeps it milder. */
			celsius = 29 - 52 * Math.pow(Math.abs(Math.sin(latitude)), 1.25) - Math.max(0, height) * 0.0065 + (weather.At(p[0] * 2 + 3, p[1] * 2, p[2] * 2) - 0.5) * 6;
			celsius += painted(p, 'climate', function (stroke) {
				return within(p, stroke) * (Number(stroke.Temperature) || 0);
			});

			/* Wet at the equator and at 50-60 degrees, dry at 25 and at the poles; more where the wind comes from a sea, less behind mountains. */
			moisture = 0.52 + 0.3 * Math.cos(band / 28 * Math.PI) * (band < 70 ? 1 : 0.5) - (band > 70 ? 0.2 : 0);
			upwind = 0;

			for (k = 1; k <= 6; k++) {
				var reach = k * 220 / radius;
				var back = normalize([p[0] - (axes.East[0] * wind[0] + axes.North[0] * wind[1]) / 8 * reach, p[1] - (axes.East[1] * wind[0] + axes.North[1] * wind[1]) / 8 * reach, p[2] - (axes.East[2] * wind[0] + axes.North[2] * wind[1]) / 8 * reach]);
				var there = roughly(back);

				upwind += there > 0 ? -0.05 : 0.06;

				/* A range between: the rain falls on its far side. */
				if (there > 0.5 && land > 0)
					upwind -= 0.06;
			}

			moisture += upwind + (weather.At(p[0] * 6 - 5, p[1] * 6, p[2] * 6) - 0.5) * 0.25;
			moisture += painted(p, 'climate', function (stroke) {
				return within(p, stroke) * (Number(stroke.Moisture) || 0);
			});
			moisture = Math.max(0, Math.min(1, moisture));

			/* Its land of its climate, unless one was drawn. */
			if (height > 0) {
				strokes.forEach(function (stroke) {
					if (stroke.Type === 'biome' && stroke.Biome && within(p, stroke) > 0.5)
						biome = stroke.Biome;
				});

				if (!biome && biomes)
					biome = self.$Service('SceneTerrainGenerator').BiomeOf(biomes, height / relief, moisture, Math.max(0, Math.min(1, (celsius + 25) / 60))).List[0].Name;
			}

			return {Elevation: height, Land: height > 0, Plate: {ID: tectonic.ID, Oceanic: tectonic.Oceanic, Boundary: tectonic.Boundary, Push: tectonic.Push}, Wind: wind, Celsius: celsius, Temperature: Math.max(0, Math.min(1, (celsius + 25) / 60)), Moisture: moisture, Biome: biome};
		}

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

			Land: function (direction) {
				if (bakes.length)
					return raise(normalize(direction)).Height > 0;

				return continent(normalize(direction), plate(normalize(direction))) > 0;
			},

			Plate: function (direction) {
				return plate(normalize(direction));
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
			}
		};

		return planet;
	},

	/*
	 * A view of a globe: {Yaw, Pitch (radians it is turned), Zoom (1: the whole globe in the smaller side), Width, Height
	 * (pixels)}. Project gives where a direction is seen: [x, y (pixels), facing (over 0 on the side seen)]; Unproject the
	 * direction under a pixel, null off the globe.
	 */
	Project: function (view, direction) {
		var cy = Math.cos(view.Yaw || 0);
		var sy = Math.sin(view.Yaw || 0);
		var cp = Math.cos(view.Pitch || 0);
		var sp = Math.sin(view.Pitch || 0);
		var x = direction[0] * cy - direction[2] * sy;
		var z = direction[0] * sy + direction[2] * cy;
		var y = direction[1] * cp - z * sp;
		var scale = Math.min(view.Width, view.Height) / 2 * (view.Zoom || 1);

		z = direction[1] * sp + z * cp;

		return [view.Width / 2 + x * scale, view.Height / 2 - y * scale, z];
	},

	Unproject: function (view, px, py) {
		var scale = Math.min(view.Width, view.Height) / 2 * (view.Zoom || 1);
		var x = (px - view.Width / 2) / scale;
		var y = (view.Height / 2 - py) / scale;
		var z = 1 - x * x - y * y;
		var cy = Math.cos(view.Yaw || 0);
		var sy = Math.sin(view.Yaw || 0);
		var cp = Math.cos(view.Pitch || 0);
		var sp = Math.sin(view.Pitch || 0);
		var wy;
		var wz;

		if (z < 0)
			return null;

		z = Math.sqrt(z);
		wy = y * cp + z * sp;
		wz = -y * sp + z * cp;

		return [x * cy + wz * sy, wy, -x * sy + wz * cy];
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
	Color: function (planet, sample, overlay, light) {
		var lands = planet.Lands || [];
		var shade = 0.6 + 0.4 * (light === undefined ? 1 : light);
		var t;
		var color;
		var hue;

		function biome () {
			var found = lands.filter(function (land) {
				return land.Name === sample.Biome;
			})[0];
			var ground = found && found.Ground || {};

			return ground.Low || [0.3, 0.5, 0.22];
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
				t = Math.min(1, sample.Elevation / 4500);
				color = [color[0] + (0.5 - color[0]) * t * 0.7, color[1] + (0.45 - color[1]) * t * 0.7, color[2] + (0.4 - color[2]) * t * 0.7];

				if (sample.Celsius < -6)
					color = [0.92, 0.94, 0.97];
			}
			else {
				color = ramp([[-7000, 0.03, 0.08, 0.25], [-2000, 0.06, 0.2, 0.45], [-200, 0.15, 0.42, 0.62], [0, 0.3, 0.6, 0.7]], sample.Elevation);

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
	 * The rivers of a planet of the heights of its cells (heights: 6 faces of size by size, as Heights makes them): the
	 * land filled up from its sea (a priority flood: what is lower than all round it is filled to where it overflows, each
	 * cell draining to the one it was reached from), the water of each cell gathered downstream, and the ways of what
	 * drains Least cells (24) or more traced to the sea, smoothed: {Size, Rivers: [{Points (directions), Flow (cells), Level
	 * (metres of the bed: never up downstream)}]}, the Rivers of Make.
	 */
	Drainage: function (heights, size, least) {
		var self = this;
		var n = size;
		var total = 6 * n * n;
		var fill = new Float32Array(total);
		var into = new Int32Array(total);
		var gathered = new Float32Array(total);
		var order = new Int32Array(total);
		var done = new Uint8Array(total);
		var heap = [];
		var count = 0;
		var limit = least || 24;
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

		function push (at, value) {
			var place = heap.length;

			heap.push([value, at]);

			while (place > 0) {
				var up = (place - 1) >> 1;
				if (heap[up][0] <= heap[place][0]) break;

				var kept = heap[up];

				heap[up] = heap[place];
				heap[place] = kept;
				place = up;
			}
		}

		function pop () {
			var top = heap[0];
			var last = heap.pop();
			var place = 0;

			if (heap.length) {
				heap[0] = last;

				for (;;) {
					var left = place * 2 + 1;
					var right = left + 1;
					var least2 = place;
					if (left < heap.length && heap[left][0] < heap[least2][0])
						least2 = left;

					if (right < heap.length && heap[right][0] < heap[least2][0])
						least2 = right;

					if (least2 === place) break;

					var kept = heap[least2];

					heap[least2] = heap[place];
					heap[place] = kept;
					place = least2;
				}
			}

			return top;
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

		while (heap.length) {
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
				rivers.push(self.Smoothed(points, flows, levels));
		}

		return {Size: n, Rivers: rivers};
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
		var planet = this.Planet(options);
		var tries = count || 20000;
		var radius = planet.Radius;
		var places = [];
		var kept = [];
		var seed = 0;
		var text = String(options.Seed === undefined ? 'planet' : options.Seed) + ':towns';
		var i;

		for (i = 0; i < text.length; i++)
			seed = (seed * 31 + text.charCodeAt(i)) >>> 0;

		function random () {
			seed = (seed * 1664525 + 1013904223) >>> 0;

			return seed / 4294967296;
		}

		for (i = 0; i < tries; i++) {
			var y = 1 - (i + 0.5) / tries * 2;
			var around = Math.sqrt(Math.max(0, 1 - y * y));
			/* Off the even spiral by up to its step, at random: towns never stand in rows. */
			var step = Math.sqrt(4 * Math.PI / tries);
			var p = this.Unit([Math.cos(i * 2.39996) * around + (random() - 0.5) * step * 1.4, y + (random() - 0.5) * step * 1.4, Math.sin(i * 2.39996) * around + (random() - 0.5) * step * 1.4]);
			var sample = planet.Sample(p, 20);
			var score;
			var river;

			if (!sample.Land || sample.Elevation > 2200) continue;

			score = Math.max(0, 1 - Math.abs(sample.Celsius - 16) / 16) * Math.max(0, 1 - Math.abs(sample.Moisture - 0.55) / 0.45) * Math.max(0.15, 1 - sample.Elevation / 2200);
			river = planet.River(p);

			if (river && river.Far < 15)
				score *= 1 + Math.min(2, river.Flow / 150);

			if (sample.Elevation < 60)
				score *= 1.5;

			if (score > 0.05)
				places.push({Point: p, Score: score * (0.5 + random())});
		}

		places.sort(function (a, b) {
			return b.Score - a.Score;
		});

		/* The best first, each apart from those kept: a city by 400 km, a town by 120, a village by 40. */
		places.forEach(function (place, index) {
			var share = index / Math.max(1, places.length);
			var kind = share < 0.015 ? 'city' : share < 0.12 ? 'town' : 'village';
			var apart = (kind === 'city' ? 400 : kind === 'town' ? 120 : 40) / radius;
			var near = kept.some(function (other) {
				var d = place.Point[0] * other.Point[0] + place.Point[1] * other.Point[1] + place.Point[2] * other.Point[2];

				return Math.acos(Math.max(-1, Math.min(1, d))) < Math.max(apart, other.Apart);
			});
			if (near) return;

			kept.push({Point: place.Point.map(function (value) {
				return Math.round(value * 1e7) / 1e7;
			}), Size: Math.round(Math.min(1, place.Score) * 100) / 100, Kind: kind, Apart: apart});
		});

		return {Settlements: kept.map(function (town) {
			return {Point: town.Point, Size: town.Size, Kind: town.Kind};
		})};
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
	 * The lights of its settlements at night on a face of its globe (texels as Face lays them): how much light each texel
	 * gives, 0 to 255, each settlement a soft spot as wide as it is large (a city 40 km, a village 6). {Data, Face, Row, Rows}.
	 */
	Lights: function (options, face, size, row, rows) {
		var self = this;
		var towns = Array.isArray(options.Settlements) ? options.Settlements : options.Settlements ? this.TownsOf(options.Settlements) : [];
		var radius = Number(options.Radius) || 6371;
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
					var reach = Math.max((town.Kind === 'city' ? 40 : town.Kind === 'town' ? 14 : 6) * (0.6 + town.Size * 0.6) / radius, Math.PI / 2 / size * 1.3);
					var d = Math.acos(Math.max(-1, Math.min(1, way[0] * town.Point[0] + way[1] * town.Point[1] + way[2] * town.Point[2])));
					if (d < reach)
						light += Math.pow(1 - d / reach, 1.5) * (town.Kind === 'city' ? 1 : town.Kind === 'town' ? 0.7 : 0.45);
				});

				data[y * size + x] = Math.min(255, Math.round(light * 255));
			}
		}

		return {Data: data, Face: face, Row: first, Rows: count};
	},

	/* The rivers kept, one store for every use of the service (an object of its own, never made again). */
	RiverSets: {},

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
		var x;
		var y;

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
					color = [0.16, 0.36, 0.62];

				data[at] = color[0] * 255;
				data[at + 1] = color[1] * 255;
				data[at + 2] = color[2] * 255;
				data[at + 3] = sample.Land || sample.Celsius < -12 ? 10 : 204;
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
			given.BiomeList = terrain.Biomes({Biomes: given.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']});

		planet = this.Planet(given);

		function unit (direction) {
			var length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]) || 1;

			return [direction[0] / length, direction[1] / length, direction[2] / length];
		}

		field = {
			Options: {Planet: given},
			Radius: planet.Radius,
			Height: (Number(given.Relief) || 8000) / 1000,
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
				var channel;
				var plain;

				if (!river)
					return color;

				channel = Math.max(0.04 * Math.sqrt(river.Flow), (step || 0) * 0.55);
				plain = 0.6 * Math.pow(river.Flow, 0.4);

				if (river.Far < channel && river.Flow > Math.min(60, (step || 0) * 1.5)) return [0.16, 0.34, 0.58];

				if (river.Far < plain)
					return [color[0] * 0.85 + 0.03, color[1] * 0.9 + 0.08, color[2] * 0.85];

				return color;
			},

			Patch: function (face, u, v, extent, resolution) {
				return terrain.SpherePatch(field, face, u, v, extent, resolution || 32);
			}
		};

		return field;
	},

	/* The workers that paint globes. */
	Work: function () {
		return this.$Service('Workers').Pool('ScenePlanet', {Math: ['Noise', 'SeedOffset', 'Vectors'], Noise: ['Types', 'Fractals', 'Whole', 'Post', 'Finish', 'Hash', 'Make', 'Sampler', 'Read', 'Octaves', 'Base', 'Lattice', 'Fade', 'Value', 'Gradient', 'Perlin', 'Simplex', 'Worley'], SceneTerrainGenerator: ['Smoothstep', 'Biomes', 'BiomeOf', 'Face'], ScenePlanet: ['Kinds', 'Direction', 'LatLon', 'Tangent', 'Make', 'Project', 'Unproject', 'Planet', 'Color', 'Picture', 'Face', 'Sphere', 'Heights', 'Drainage', 'Smoothed', 'RiversOf', 'Settlements', 'TownsOf', 'Lights', 'Unit', 'Dot', 'Cells', 'CellAt', 'CellPoint', 'CellNeighbours', 'HexAt', 'HexPoint', 'HexCell', 'Icosahedron', 'Wound', 'Slerp', 'Along', 'Cross']});
	},

	/* What a worker of the planet carries: see Workers. */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	}
});
