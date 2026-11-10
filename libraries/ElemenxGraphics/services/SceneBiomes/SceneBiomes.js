/*
 * The lands of a game: what a ground looks like and what grows on it, and the places people made on it.
 * - Names(), Has(name), Get(name), Define(name, biome): a biome is {Ground: {Sand, Low, High, Rock, Snow, Deep, Road}
 *   ([r, g, b], 0 to 1, each by what it is the color of; the others stay the ones of the ground; Materials: {the same
 *   parts: the material of SceneMaterials each is made of}), Scatter: [rules of the
 *   trait Scatter], Grass: {rule of the trait Grass, or null}, Climate: where it is on a ground of lands by their climate
 *   (Biomes of SceneTerrainGenerator.Flat): {Height, Moisture, Temperature}, or a list of them, each a range [from, to]
 *   (null: no end; Height in parts of the top of the ground, the others 0 to 1)}. temperate, taiga, tundra, desert,
 *   savanna, swamp (their climates hold every one, none twice), alien (none: it is a land of its own); data of the
 *   resources (resources/biomes, ElemenxGraphics/biomes/<name>): an Application gives one of that name in its place.
 * - Check(list, field): whether lands by their climate cover a ground and its heights as they should: the gaps of their
 *   climates in each band of heights, lands the ground never reaches, lands it never has, the part of it of no land.
 * - Village(field, {X, Y, Houses, Radius, Seed, Shapes}) lays out a village on a ground (SceneTerrainGenerator.Flat): {Objects (specs
 *   for Scene.Add), Roads ([[x, z]...], one way to each house and one out of it), Center}. It keeps to what is level
 *   and dry, and moves to the nearest such place when its own is not.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('SceneBiomes', {
	$Meta: {
		Description: 'The lands of a game: the colors of a ground, what grows on it, and villages laid out on it.',
		Methods: ['Names()', 'Has(name)', 'Get(name)', 'Define(name, biome)', 'Check(list, field)', 'Village(field, options)']
	},

	$Provides: {Seeded: {Kinds: ['village']}},

	$OnCreate: function () {
		var self = this;

		/* A village is a kind of the Seeded Service, made again of the options of its ground and its own. */
		this.$Service('Seeded').Define('village', {
			Version: 1,
			Make: function (params) {
				return self.Village(self.$Service('SceneTerrainGenerator').Flat(params.Terrain || {}), params);
			}
		});

		/*
		 * Its lands: data of its resources (resources/biomes, named ElemenxGraphics/biomes/<name>), in their Order; one an
		 * Application gives of that name takes its place.
		 */
		this.Registry = {};

		Elemenx.Resources('Data').filter(function (name) {
			return name.indexOf('ElemenxGraphics/biomes/') === 0;
		}).map(function (name) {
			return {Name: name.substring('ElemenxGraphics/biomes/'.length), Data: Elemenx.Resources('Data', name)};
		}).sort(function (a, b) {
			return (a.Data.Order || 0) - (b.Data.Order || 0);
		}).forEach(function (item) {
			delete item.Data.Order;

			self.Registry[item.Name] = item.Data;
		});
	},

	Names: function () {
		this.$Provide('Biomes');

		return Object.keys(this.Registry);
	},

	Has: function (name) {
		return !!this.Get(name);
	},

	/* A land declared by a Service ($Provides: {Biomes: {Biomes: [...]}}) makes it first. */
	Get: function (name) {
		if (!this.Registry[name])
			this.$Provide('Biomes', name);

		return this.Registry[name] || null;
	},

	Define: function (name, biome) {
		this.Registry[name] = biome;

		return this;
	},

	/*
	 * Whether lands by their climate cover a ground as they should (list: the Biomes of a ground; field: a ground of
	 * SceneTerrainGenerator.Flat, or null to look at the climate alone). {Problems: [{Type, Message, Biome, Heights}],
	 * Share ({name: the part of the ground it holds}), Gap (the part none holds), Heights ({name: [lowest, highest]} where
	 * it is, parts of the Top)}. Types: range (a range that is empty: Of, its key), gap (heights where a climate has no land: Heights
	 * [from, to], Moisture and Temperature the ranges of it), unreachable (a land whose heights the ground never has),
	 * unused (a land nowhere on the ground) and uncovered (a part of the ground of no land: Part, in hundredths).
	 */
	Check: function (list, field) {
		var terrain = this.$Service('SceneTerrainGenerator');
		var biomes = terrain.Biomes({Biomes: list || []}) || [];
		var problems = [];
		var share = {};
		var heights = {};
		var low = -0.2;
		var high = 1;
		var count = 0;
		var gaps = 0;
		var bands = {};
		var side = 48;
		var i;
		var j;
		var h;
		var m;
		var t;

		function range (value) {
			return value && value[0] !== null && value[0] !== undefined && value[1] !== null && value[1] !== undefined && Number(value[0]) >= Number(value[1]);
		}

		biomes.forEach(function (biome) {
			share[biome.Name] = 0;

			biome.Climate.forEach(function (envelope) {
				['Height', 'Moisture', 'Temperature'].forEach(function (key) {
					if (range(envelope[key]))
						problems.push({Type: 'range', Biome: biome.Name, Of: key, Message: biome.Name + ': its ' + key + ' ' + envelope[key][0] + ' to ' + envelope[key][1] + ' holds nothing'});
				});
			});
		});

		/* The ground as it is: the lands at its points, the heights it has. */
		if (field) {
			low = Infinity;
			high = -Infinity;

			for (i = 0; i < side; i++) {
				for (j = 0; j < side; j++) {
					var x = ((i + 0.5) / side - 0.5) * field.Size;
					var z = ((j + 0.5) / side - 0.5) * field.Size;
					var weather = field.Climate(x, z);
					var part = field.Height(x, z) / Math.max(1, field.Top);
					var lands = terrain.BiomeOf(biomes, part, weather.Moisture, weather.Temperature);

					low = Math.min(low, part);
					high = Math.max(high, part);
					count++;

					if (lands.Gap) {
						gaps++;

						continue;
					}

					lands.List.forEach(function (land) {
						share[land.Name] += land.Weight;
						heights[land.Name] = heights[land.Name] || [Infinity, -Infinity];
						heights[land.Name][0] = Math.min(heights[land.Name][0], part);
						heights[land.Name][1] = Math.max(heights[land.Name][1], part);
					});
				}
			}

			Object.keys(share).forEach(function (name) {
				share[name] /= count;
			});
		}

		/* Each band of heights the ground has, through all its climates: where no land is. */
		for (h = Math.floor(low * 20) / 20; h < high; h += 0.05) {
			for (m = 0.025; m < 1; m += 0.05) {
				for (t = 0.025; t < 1; t += 0.05) {
					if (terrain.BiomeOf(biomes, h + 0.025, m, t).Gap) {
						var key = h.toFixed(2);

						bands[key] = bands[key] || {Heights: [h, h + 0.05], Moisture: [m, m], Temperature: [t, t]};
						bands[key].Moisture = [Math.min(bands[key].Moisture[0], m - 0.025), Math.max(bands[key].Moisture[1], m + 0.025)];
						bands[key].Temperature = [Math.min(bands[key].Temperature[0], t - 0.025), Math.max(bands[key].Temperature[1], t + 0.025)];
					}
				}
			}
		}

		/* Bands one over the other with the same gap are one gap. */
		Object.keys(bands).sort(function (a, b) {
			return Number(a) - Number(b);
		}).reduce(function (merged, key) {
			var band = bands[key];
			var last = merged[merged.length - 1];

			if (last && Math.abs(last.Heights[1] - band.Heights[0]) < 1e-6 && last.Moisture.join() === band.Moisture.join() && last.Temperature.join() === band.Temperature.join()) last.Heights = [last.Heights[0], band.Heights[1]];
			else merged.push({Heights: band.Heights.slice(), Moisture: band.Moisture, Temperature: band.Temperature});

			return merged;
		}, []).forEach(function (band) {
			problems.push({Type: 'gap', Heights: band.Heights, Moisture: band.Moisture, Temperature: band.Temperature, Message: 'Heights ' + band.Heights[0].toFixed(2) + ' to ' + band.Heights[1].toFixed(2) + ' of the top have no land where Moisture is ' + band.Moisture[0].toFixed(2) + ' to ' + band.Moisture[1].toFixed(2) + ' and Temperature ' + band.Temperature[0].toFixed(2) + ' to ' + band.Temperature[1].toFixed(2)});
		});

		if (field) {
			biomes.forEach(function (biome) {
				var reached = biome.Climate.some(function (envelope) {
					var given = envelope.Height;
					var from = given && given[0] !== null && given[0] !== undefined ? Number(given[0]) : -Infinity;
					var to = given && given[1] !== null && given[1] !== undefined ? Number(given[1]) : Infinity;

					return to >= low && from <= high;
				});

				if (!reached) problems.push({Type: 'unreachable', Biome: biome.Name, Message: biome.Name + ': the ground has none of its heights (it goes from ' + low.toFixed(2) + ' to ' + high.toFixed(2) + ' of its top)'});
				else if (!share[biome.Name]) problems.push({Type: 'unused', Biome: biome.Name, Message: biome.Name + ': nowhere on the ground, its climate is not there'});
			});

			if (gaps)
				problems.push({Type: 'uncovered', Part: Math.round(gaps / count * 100), Message: Math.round(gaps / count * 100) + '% of the ground is of no land'});
		}

		return {Problems: problems, Share: share, Gap: count ? gaps / count : 0, Heights: heights};
	},

	/* The numbers of a seed, always the same. */
	Random: function (seed) {
		var value = 2166136261;
		var text = String(seed);
		var i;

		for (i = 0; i < text.length; i++)
			value = Math.imul(value ^ text.charCodeAt(i), 16777619);

		return function () {
			value = Math.imul(value ^ value >>> 15, 2246822519) + 1 | 0;

			return (value >>> 0) / 4294967296;
		};
	},

	/* Whether a point can take a building: dry and level, round it too. */
	Level: function (field, x, z, reach) {
		return [[0, 0], [reach, 0], [-reach, 0], [0, reach], [0, -reach]].every(function (step) {
			return field.Height(x + step[0], z + step[1]) > 1 && field.Slope(x + step[0], z + step[1]) < 0.16;
		});
	},

	Village: function (field, options) {
		var self = this;
		var settings = options || {};
		var random = this.Random(settings.Seed === undefined ? 'village' : settings.Seed);
		var count = Number(settings.Houses) || 8;
		var radius = Number(settings.Radius) || 30;
		var shapes = settings.Shapes || ['house', 'house', 'house', 'barracks', 'windmill', 'tower'];
		var center = {X: Number(settings.X) || 0, Z: Number(settings.Y) || 0};
		var half = field.Size / 2 - radius - 8;
		var found = this.Level(field, center.X, center.Z, 8);
		var objects = [];
		var roads = [];
		var turn;
		var ring;
		var i;

		/* The nearest level place, ring by ring. */
		for (ring = 1; ring < 24 && !found; ring++) {
			for (turn = 0; turn < 16 && !found; turn++) {
				var x = center.X + Math.cos(turn / 16 * Math.PI * 2) * ring * 16;
				var z = center.Z + Math.sin(turn / 16 * Math.PI * 2) * ring * 16;

				if (Math.abs(x) < half && Math.abs(z) < half && this.Level(field, x, z, 8)) {
					center = {X: x, Z: z};
					found = true;
				}
			}
		}

		if (!found)
			return {Objects: [], Roads: [], Center: center};

		for (i = 0; i < count * 6 && objects.length < count; i++) {
			var angle = i * 2.39996 + random() * 0.5;
			var far = radius * (0.35 + 0.65 * Math.sqrt((objects.length + random()) / count));
			var hx = center.X + Math.cos(angle) * far;
			var hz = center.Z + Math.sin(angle) * far;
			var name = shapes[objects.length ? Math.floor(random() * shapes.length) : 0];
			var size = name === 'barracks' ? 12 : name === 'windmill' ? 11 : name === 'tower' ? 9 : 8;
			if (!self.Level(field, hx, hz, size * 0.55) || objects.some(function (other) {
				return Math.abs(other.X - hx) < (other.Size + size) * 0.6 && Math.abs(other.Y - hz) < (other.Size + size) * 0.6;
			})) continue;

			objects.push({Kind: name, X: Math.round(hx), Y: Math.round(hz), Size: size, Blocks: true});
			roads.push([[center.X, center.Z], [hx, hz]]);
		}

		/* The road out of it. */
		var away = Math.atan2(-center.Z, -center.X) + (random() - 0.5);
		var out = field.Path({X: center.X, Z: center.Z}, {X: center.X + Math.cos(away) * radius * 2.4, Z: center.Z + Math.sin(away) * radius * 2.4}, {MaxSlope: 0.4});

		if (out) {
			roads.push(out.map(function (point) {
				return [point.X, point.Z];
			}));
		}

		return {Objects: objects, Roads: roads, Center: center};
	}
});
