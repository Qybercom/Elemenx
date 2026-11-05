/*
 * ScenePlanet: a planet as one continuous function of a direction from its centre, the same at any distance: the globe
 * of the space of a Scene, the map an editor paints and each location of its surface read the very same numbers, so a
 * coast seen from orbit is the coast walked on. Nothing is baked: a point is reckoned when it is asked for, as fine as
 * it is asked.
 * - Make(options): a planet of options {Radius (km, 6371), Seed, Ocean (the part of it under the sea, 0.65), Relief
 *   (metres of its highest mountains, 8000), Depth (metres of its deepest sea, 6000), Plates (how many tectonic plates,
 *   14), Detail (km: the finest the coasts are told by the globe; finer, the land and the sea are never turned one into
 *   the other, 2), Paint (what a developer drew, below), Biomes (names of SceneBiomes, the usual six)}. It gives
 *   {Options, Radius, Sample(direction), Elevation(direction), Land(direction), Plate(direction), Wind(direction),
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
 * - Cells, CellAt, CellCenter, CellCorners, CellNeighbours, CellPlace: the locations of a planet as cells of the faces of a
 *   cube, each a place for the step Planet of a World (its latitude, longitude, turn, size and outline).
 * The same functions run in workers and in Node: they read no page.
 */
Elemenx.Service('ScenePlanet', {
	$Meta: {
		Description: 'A planet as one continuous function of a direction: painted continents, tectonic plates, winds, climate and biomes, as fine as it is asked.',
		Methods: ['Make(options)', 'Direction(latitude, longitude)', 'LatLon(direction)', 'Kinds()', 'Project(view, direction)', 'Unproject(view, x, y)', 'Planet(options)', 'Color(planet, sample, overlay, light)', 'Picture(options, view, rect, step, overlay)', 'Sphere(options)', 'Cells(radius, size)', 'CellAt(radius, size, direction)', 'CellPoint(cell, a, b)', 'CellCenter(cell)', 'CellCorners(cell)', 'CellNeighbours(radius, size, cell)', 'CellPlace(radius, cell)', 'Work()', 'Source(names)']
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
		var fine = noise.Make({Type: 'simplex', Seed: seed + '-fine', Fractal: 'fbm', Octaves: 6});
		var weather = noise.Make({Type: 'simplex', Seed: seed + '-weather', Fractal: 'fbm', Octaves: 3});
		/* Its lands: BiomeList when given (a worker has no registry of them), else of their names. */
		var biomes = this.$Service('SceneTerrainGenerator').Biomes(given.BiomeList ? {BiomeList: given.BiomeList} : {Biomes: given.Biomes || ['temperate', 'taiga', 'tundra', 'desert', 'savanna', 'swamp']});
		var strokes = (given.Paint || []).map(function (stroke) {
			return Object.assign({}, stroke, {Directions: (stroke.Points || []).map(function (point) {
				return self.Direction(Number(point[0]), Number(point[1]));
			})});
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
		function raise (p) {
			var tectonic = plate(p);
			var land = continent(p, tectonic);
			var meet = Math.exp(-Math.abs(tectonic.Boundary) / 180);
			var ridged = folds.At(p[0] * 9, p[1] * 9, p[2] * 9);
			var height;

			/* Over the sea: the land rises with its number, mountains where plates close, rifts where they part. */
			if (land > 0) {
				height = Math.pow(Math.min(1.5, land), 1.4) * 1400 + ridged * ridged * relief * 0.18 * Math.min(1, land * 3);
				height += Math.max(0, tectonic.Push) * meet * relief * 0.75 * (0.4 + ridged * 0.6);
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

				/* Finer than Detail: hills that never take the land under the sea. */
				height = Math.max(1, height + (fine.At(p[0] * radius / detail * 0.5, p[1] * radius / detail * 0.5, p[2] * radius / detail * 0.5) - 0.5) * Math.min(height, 120));
			}
			else {
				height = -(120 + Math.pow(Math.min(1.5, -land), 0.7) * depth * 0.8);
				height += Math.max(0, -tectonic.Push) * meet * 2200 * (tectonic.Oceanic ? 1 : 0.4);
				height -= Math.max(0, tectonic.Push) * meet * depth * 0.4 * (tectonic.Oceanic ? 1 : 0.3);
				height = Math.min(-1, height);
			}

			return {Height: height, Tectonic: tectonic, Land: land};
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

		function sample (direction) {
			var p = normalize(direction);
			var raised = raise(p);
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

			Elevation: function (direction) {
				return raise(normalize(direction)).Height;
			},

			Land: function (direction) {
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
	 * The cells of the locations of a planet: squares of the faces of a cube (SceneTerrainGenerator.Face), N to a side of
	 * a face, laid out by equal angles so they are near alike; N of a radius (km) and a size of a cell (km). A cell {Face,
	 * I, J, N, ID}. CellAt the cell of a direction; CellCenter and CellCorners its directions; CellNeighbours the four
	 * across its sides, in the order +I, +J, -I, -J (over the edges of the faces too).
	 */
	Cells: function (radius, size) {
		return Math.max(1, Math.round(Math.PI / 2 * radius / Math.max(0.001, size)));
	},

	CellAt: function (radius, size, direction) {
		var n = this.Cells(radius, size);
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

		return {Face: face, I: i, J: j, N: n, ID: face + ':' + i + ':' + j + ':' + n};
	},

	/* The direction of a point of a cell: a and b of 0 to 1 across it. */
	CellPoint: function (cell, a, b) {
		var face = this.$Service('SceneTerrainGenerator').Face(cell.Face, Math.tan((-1 + (cell.I + a) * 2 / cell.N) * Math.PI / 4), Math.tan((-1 + (cell.J + b) * 2 / cell.N) * Math.PI / 4));
		var length = Math.sqrt(face[0] * face[0] + face[1] * face[1] + face[2] * face[2]);

		return [face[0] / length, face[1] / length, face[2] / length];
	},

	CellCenter: function (cell) {
		return this.CellPoint(cell, 0.5, 0.5);
	},

	CellCorners: function (cell) {
		return [this.CellPoint(cell, 0, 0), this.CellPoint(cell, 1, 0), this.CellPoint(cell, 1, 1), this.CellPoint(cell, 0, 1)];
	},

	CellNeighbours: function (radius, size, cell) {
		var self = this;

		return [[1.02, 0.5], [0.5, 1.02], [-0.02, 0.5], [0.5, -0.02]].map(function (at) {
			return self.CellAt(radius, size, self.CellPoint(cell, at[0], at[1]));
		});
	},

	/*
	 * A cell as a location: its place on the planet {Latitude, Longitude, Turn (its axis X along the side +I of the cell),
	 * Size (metres, the mean of its sides), Points ([x, z] of its corners on the ground of the location, metres: its
	 * outline, a little off a square)}, for the step Planet of a World (SceneWorld) and the Shape of a location.
	 */
	CellPlace: function (radius, cell) {
		var center = this.CellCenter(cell);
		var corners = this.CellCorners(cell);
		var place = this.LatLon(center);
		var metres = radius * 1000;
		var east = Math.abs(center[1]) > 0.9999 ? [0, 0, -1] : (function () {
			var length = Math.sqrt(center[2] * center[2] + center[0] * center[0]);

			return [center[2] / length, 0, -center[0] / length];
		})();
		var north = [center[1] * east[2] - center[2] * east[1], center[2] * east[0] - center[0] * east[2], center[0] * east[1] - center[1] * east[0]];
		var along = this.CellPoint(cell, 0.6, 0.5);
		var sides = 0;
		var turn;

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
			var next = points[(index + 1) % 4];

			sides += Math.sqrt((next[0] - point[0]) * (next[0] - point[0]) + (next[1] - point[1]) * (next[1] - point[1]));
		});

		return {Latitude: place[0], Longitude: place[1], Turn: turn * 180 / Math.PI, Size: sides / 4, Points: points};
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

			Color: function (direction) {
				return self.Color(planet, planet.Sample(unit(direction)), 'relief', 1);
			},

			Patch: function (face, u, v, extent, resolution) {
				return terrain.SpherePatch(field, face, u, v, extent, resolution || 32);
			}
		};

		return field;
	},

	/* The workers that paint globes. */
	Work: function () {
		return this.$Service('Workers').Pool('ScenePlanet', {Math: ['Noise', 'SeedOffset', 'Vectors'], Noise: ['Types', 'Fractals', 'Whole', 'Post', 'Finish', 'Hash', 'Make', 'Sampler', 'Read', 'Octaves', 'Base', 'Lattice', 'Fade', 'Value', 'Gradient', 'Perlin', 'Simplex', 'Worley'], SceneTerrainGenerator: ['Smoothstep', 'Biomes', 'BiomeOf'], ScenePlanet: ['Kinds', 'Direction', 'LatLon', 'Make', 'Project', 'Unproject', 'Planet', 'Color', 'Picture', 'Sphere']});
	},

	/* What a worker of the planet carries: see Workers. */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	}
});
