/*
 * PlanetData: a planet as data (docs/PLANET-FORMAT.md): its passport and its layers as tiles over the faces of a cube,
 * each face a quadtree, what ScenePlanet reads in place of its noise (Make({Data: key}), ScenePlanet.UseData).
 * - Bake(options, settings, callback(error, data)): the planet of ScenePlanet options written as data, in the workers of
 *   the planet: settings {ID, Name, Depth (the deepest level of Height, 3), Size (samples a side of a tile, 129), Biomes
 *   (the deepest level of Biome, 2), Climate and Plates (the deepest levels of Climate and of Plate, as Biomes), Vectors
 *   (true: its rivers, settlements and highways made and kept too, as a Scene makes them: of heights of VectorSize, 256, a
 *   side of a face, and Towns places tried, 20000), Tolerance (adaptive depth: {layer: how much a sample may differ from
 *   its coarser tile read there for the tile to be left out}: {Height: 2 (m), Climate: 1, Plate: 0, Biome: 0} by default,
 *   false keeps them all; Prune(data, tolerance)), Progress(done, total)}.
 * - Open(source, callback(error, data), settings): the data of a planet from what Bake gave, the bytes of its file (Save
 *   or Pack; a Blob, a File, an ArrayBuffer or a Uint8Array) or the URL of its file or of a folder of its files
 *   (planet.json and what it lists), all its tiles read before the callback; with settings.Levels a planet of the
 *   network has its tiles to that level read then, its finer ones as they are needed: Need(data, direction, reach,
 *   finest, callback(error, names)) reads those round a direction (its file by ranges of bytes, a folder by its files).
 * - Save(data): the bytes of its file: a zip of planet.json, its vectors and its tiles (Archive.Zip), the coarse tiles
 *   first; Pack(data, callback(error, bytes)): the same zip, deflated (Archive.Compress).
 * - Store(data, callback(error)), Stored(id, callback(error, data)), List(callback(error, [manifest])), Remove(id,
 *   callback(error)): planets kept in the browser (IndexedDB, elemenx-planets), to open again without their file.
 * - Tile(bytes), Bytes(layer, face, level, x, y, values, type): a tile from the bytes of its file and back (its samples
 *   kept as their differences, what deflate packs best).
 * data is {Manifest, Tiles: {name: Int16Array or Uint8Array}, Vectors: {Rivers, Settlements, Highways}, Edits: {Edits,
 * Baked}}; a tile is named layer/face/level/x-y and kept in its file as tiles/<name>.bin (its samples of four bytes for a
 * layer of rgba8: Climate, Plate), a vector as vectors/<name>.json (the paths its Manifest.Vectors names), its edits as
 * edits.json (Manifest.Edits): what was changed of it after it was made, the brushes of its relief (ScenePlanet Edits) and
 * the grounds of its locations baked into it (Baked), not of the options it was made of (its Origin).
 * - Retile(data, edits, callback(error, names)): its edits changed (brushes of PlanetEditor): the tiles they touch made
 *   again, in the workers, of the options it was made of (a planet of data alone keeps its tiles).
 * - Parts and stores (docs/SPACE-FORMAT.md): what is read and written is a part told by a descriptor, never a path:
 *   {Kind: 'manifest'}, {Kind: 'tile', Layer, Face, Level, X, Y}, {Kind: 'vector', Name}, {Kind: 'edits'}, {Kind:
 *   'objects', ID}. A store is {Read(part, callback(error, bytes or null)), Write(part, bytes, callback(error)), and
 *   maybe ReadMany(parts, callback(error, list)), WriteMany(parts, list, callback(error)), Remove(part, callback(error)),
 *   Watch(callback(part)) (a part changed elsewhere: returns its stop)}; Open(store, callback, settings) reads a planet of
 *   one (its tiles to settings.Levels; the finer ones by Need, its objects as they are asked for), Write(data, store,
 *   callback, whole) writes what changed of it since it was read or written (all of it with whole). Browser(name): a store
 *   of the browser (IndexedDB), a key for each part. Remote(settings): a store of the network, its parts carried by
 *   Elemenx.Network.Transfer over the Transport the application gives. Key(part) and Path(part): the key of a part, and
 *   its path in a file.
 * - Objects(data, id, callback(error, document)): the document of a location (what SceneEditor edits there), read as it
 *   is asked for; SetObjects(data, id, document): it changed (null: none there now).
 */
Elemenx.Service('PlanetData', {
	$Meta: {
		Description: 'A planet as data: its passport, its layers (heights, biomes, climate, plates) as tiles over a cube and its vectors (rivers, settlements, highways), baked, saved to a file, opened from one or from the network, kept in the browser.',
		Methods: ['Objects(data, id, callback)', 'SetObjects(data, id, document)', 'Write(data, store, callback, whole)', 'Browser(name)', 'Remote(settings)', 'Key(part)', 'Path(part)', 'Retile(data, edits, callback)', 'Bake(options, settings, callback)', 'Open(source, callback, settings)', 'Need(data, direction, reach, finest, callback)', 'Save(data)', 'Pack(data, callback)', 'Prune(data, tolerance)', 'Store(data, callback)', 'Stored(id, callback)', 'List(callback)', 'Remove(id, callback)', 'Tile(bytes)', 'Bytes(layer, face, level, x, y, values, type)']
	},

	/* The kinds of the samples of a layer, by their code in the head of a tile. */
	Types: {int16: 1, uint8: 2, rgba8: 3},

	Bake: function (options, settings, callback) {
		var self = this;
		var given = settings || {};
		var planets = this.$Service('ScenePlanet');
		var code = planets.ClimateCode;
		var bare = Object.assign({}, options || {});
		var size = Math.max(3, Math.round(Number(given.Size) || 129));
		var depth = Math.max(0, Math.min(10, Math.round(given.Depth === undefined ? 3 : Number(given.Depth))));
		var lands = Math.max(0, Math.min(depth, Math.round(given.Biomes === undefined ? 2 : Number(given.Biomes))));
		var climates = Math.max(0, Math.min(depth, Math.round(given.Climate === undefined ? lands : Number(given.Climate))));
		var plated = Math.max(0, Math.min(depth, Math.round(given.Plates === undefined ? lands : Number(given.Plates))));
		var vectored = given.Vectors === true;
		var kinds = bare.Biomes || this.$Service('SceneTerrainGenerator').DefaultBiomes;
		/* The names of its lands, by their place in its tiles of Biome: 0, the sea. */
		var table = [''].concat(kinds.map(function (entry) {
			return typeof entry === 'string' ? entry : entry.Biome || entry.Name || '';
		}));
		var jobs = [];
		var data = {Manifest: null, Tiles: {}, Vectors: {}, Edits: null};
		var done = 0;
		var total;
		var left;
		var failed = null;
		var pool = planets.Work();
		var level;
		var face;
		var x;
		var y;

		delete bare.Data;

		/* Its lands resolved here, where their registry is (a worker has none): for the work, not kept in its passport. */
		var working = planets.Ruled(Object.assign({}, bare, {Regions: bare.Regions || [], BiomeList: bare.BiomeList || this.$Service('SceneTerrainGenerator').Biomes({Biomes: kinds})}));

		delete bare.BiomeList;

		/* What was changed of it after it was made: kept apart from the options it was made of, sampled into its tiles all the same. */
		data.Edits = {Edits: bare.Edits || [], Baked: bare.Baked || {}, Regions: bare.Regions || []};

		delete bare.Edits;
		delete bare.Baked;
		delete bare.Regions;

		data.Manifest = {
			Format: 'elemenx-planet',
			Version: 1,
			ID: String(given.ID || 'planet-' + (bare.Seed === undefined ? 'planet' : bare.Seed)),
			Name: String(given.Name || given.ID || bare.Seed || 'Planet'),
			Radius: Number(bare.Radius) || planets.Defaults.Radius,
			Sea: 0,
			Seed: bare.Seed === undefined ? 'planet' : String(bare.Seed),
			Origin: {Kind: 'generated', Options: bare},
			Size: size,
			Layers: {
				Height: {Type: 'int16', Unit: 'm', Depth: depth},
				/* What was changed of its relief, metres more or less, where it was: no tile of it as it is baked. */
				Edit: {Type: 'int16', Unit: 'm', Depth: depth},
				Biome: {Type: 'uint8', Depth: lands, Table: table},
				/* Its warmth, how wet it is and its winds; its plates and how they meet (TileValues). */
				Climate: {Type: 'rgba8', Depth: climates, Channels: ['Celsius ' + code.Low + '..' + code.High, 'Moisture 0..1', 'Wind east -' + code.Wind + '..' + code.Wind + ' m/s', 'Wind north -' + code.Wind + '..' + code.Wind + ' m/s']},
				Plate: {Type: 'rgba8', Depth: plated, Channels: ['ID', 'Oceanic 255', 'Boundary km / 10', 'Push -2..2']}
			},
			Vectors: {},
			Edits: 'edits.json',
			Tiles: []
		};

		for (level = 0; level <= depth; level++) {
			for (face = 0; face < 6; face++) {
				for (y = 0; y < 1 << level; y++) {
					for (x = 0; x < 1 << level; x++) {
						jobs.push(['Height', face, level, x, y]);

						if (level <= lands)
							jobs.push(['Biome', face, level, x, y]);

						if (level <= climates)
							jobs.push(['Climate', face, level, x, y]);

						if (level <= plated)
							jobs.push(['Plate', face, level, x, y]);
					}
				}
			}
		}

		/* Its vectors: 24 strips of heights, then their rivers, the settlements by them, the highways between those. */
		var strips = vectored ? 24 : 0;

		total = jobs.length + (vectored ? strips + 3 : 0);
		left = vectored ? 2 : 1;

		function fail (error) {
			if (failed) return;

			failed = error;

			callback(error);
		}

		function step () {
			done++;

			if (typeof given.Progress === 'function')
				given.Progress(done, total);
		}

		function finish () {
			if (failed || --left) return;

			if (given.Tolerance !== false)
				self.Prune(data, Object.assign({Height: 2, Climate: 1, Plate: 0, Biome: 0}, given.Tolerance || {}));

			data.Manifest.Tiles = Object.keys(data.Tiles).sort();

			callback(null, data);
		}

		/* One of the works of the pool: its error stops the bake. */
		function run (method, args, next) {
			pool.Run('ScenePlanet', method, args, function (error, made) {
				if (failed) return;

				if (error) {
					fail(error);

					return;
				}

				step();

				next(made);
			});
		}

		/* Its rivers of its ground as it was made: what a developer changed of them (Places) is laid over them where they are read. */
		function vectors () {
			var drained = Object.assign({}, working);
			var side = Math.max(16, Math.round((Number(given.VectorSize) || 256) / 4) * 4);
			var heights = new Float32Array(6 * side * side);
			var waiting = strips;
			var row;

			delete drained.Places;

			function came (face, first) {
				return function (piece) {
					heights.set(piece.Data, face * side * side + first * side);

					if (--waiting) return;

					run('Drainage', [heights, side], function (drained) {
						var rivers = drained.Rivers;

						run('Settlements', [Object.assign({}, working, {Rivers: rivers}), Number(given.Towns) || 20000], function (placed) {
							var towns = placed.Settlements;

							run('Highways', [Object.assign({}, working, {Rivers: rivers, Settlements: towns}), 20], function (joined) {
								data.Vectors = {Rivers: rivers, Settlements: towns, Highways: joined.Highways};
								data.Manifest.Vectors = {Rivers: 'vectors/rivers.json', Settlements: 'vectors/settlements.json', Highways: 'vectors/highways.json'};

								finish();
							});
						});
					});
				};
			}

			for (face = 0; face < 6; face++) {
				for (row = 0; row < side; row += side / 4)
					run('Heights', [drained, face, side, row, side / 4], came(face, row));
			}
		}

		jobs.forEach(function (job) {
			run('TileValues', [working, job[0], job[1], job[2], job[3], job[4], size, table], function (values) {
				data.Tiles[planets.TileName(job[0], job[1], job[2], job[3], job[4])] = values;

				if (Object.keys(data.Tiles).length === jobs.length)
					finish();
			});
		});

		if (vectored)
			vectors();

		return self;
	},

	Retile: function (data, edits, callback) {
		var self = this;
		var planets = this.$Service('ScenePlanet');
		var manifest = data.Manifest;
		var origin = manifest.Origin && manifest.Origin.Kind === 'generated' ? manifest.Origin.Options || {} : null;
		var before = data.Edits && data.Edits.Edits || [];
		var done = typeof callback === 'function' ? callback : function () {};
		var changed = this.Changed(before, edits || []);
		var names = [];
		var left;
		var failed = false;
		var working;

		data.Edits = Object.assign({Baked: {}}, data.Edits || {}, {Edits: (edits || []).slice()});

		this.Mark(data, {Kind: 'edits'});

		if (!origin || !changed.length) {
			done(null, []);

			return;
		}

		working = planets.Ruled(Object.assign({}, origin, {Edits: data.Edits.Edits, Baked: data.Edits.Baked, Regions: data.Edits.Regions || [], BiomeList: this.$Service('SceneTerrainGenerator').Biomes({Biomes: origin.Biomes || this.$Service('SceneTerrainGenerator').DefaultBiomes})}));

		/* The tiles of its layers that heights change (Height, Biome, Climate) over the caps the edits that changed reach. */
		Object.keys(data.Tiles).forEach(function (name) {
			var parts = name.split('/');
			var at = parts[3].split('-');
			if (['Height', 'Biome', 'Climate'].indexOf(parts[0]) !== -1 && self.Touched(planets, Number(parts[1]), Number(parts[2]), Number(at[0]), Number(at[1]), manifest.Radius, changed))
				names.push(name);
		});

		left = names.length;

		if (!left) {
			done(null, []);

			return;
		}

		names.forEach(function (name) {
			var parts = name.split('/');
			var at = parts[3].split('-');

			planets.Work().Run('ScenePlanet', 'TileValues', [working, parts[0], Number(parts[1]), Number(parts[2]), Number(at[0]), Number(at[1]), manifest.Size, manifest.Layers.Biome ? manifest.Layers.Biome.Table : ['']], function (error, values) {
				if (failed) return;

				if (error) {
					failed = true;

					done(error, []);

					return;
				}

				data.Tiles[name] = values;

				self.Mark(data, self.TilePart(name));

				if (!--left)
					done(null, names);
			});
		});
	},

	/* The edits in one list and not in the other (as JSON): those whose reach is to be made again. */
	Changed: function (before, after) {
		var kept = {};
		var made = {};

		before.forEach(function (edit) {
			kept[JSON.stringify(edit)] = edit;
		});
		after.forEach(function (edit) {
			made[JSON.stringify(edit)] = edit;
		});

		return before.filter(function (edit) {
			return !made[JSON.stringify(edit)];
		}).concat(after.filter(function (edit) {
			return !kept[JSON.stringify(edit)];
		}));
	},

	/* Whether a tile lies within the reach of any of the edits (each of its points within its Radius, km). */
	Touched: function (planets, face, level, x, y, radius, edits) {
		var count = 1 << level;
		var middle = planets.TileDirection(face, (x + 0.5) / count, (y + 0.5) / count);
		var wide = 0;

		[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (corner) {
			var p = planets.TileDirection(face, (x + corner[0]) / count, (y + corner[1]) / count);

			wide = Math.max(wide, Math.acos(Math.max(-1, Math.min(1, p[0] * middle[0] + p[1] * middle[1] + p[2] * middle[2]))));
		});

		return edits.some(function (edit) {
			var reach = Math.max(1, Number(edit.Radius) || 100) / radius;

			return (edit.Points || []).some(function (point) {
				var p = planets.Direction(Number(point[0]), Number(point[1]));

				return Math.acos(Math.max(-1, Math.min(1, p[0] * middle[0] + p[1] * middle[1] + p[2] * middle[2]))) < wide + reach;
			});
		});
	},

	/*
	 * The bytes of the file of a tile: a head of 32 bytes (EPT1, the type of its samples, face, level, x, y, size, filter)
	 * and its samples, row by row, each kept as its difference from the one before it (the first of a row from the first of
	 * the row above; filter 1): what deflate packs best of a relief. type: of the layer (rgba8: four bytes a sample); by
	 * its array without it (int16 or uint8).
	 */
	Bytes: function (layer, face, level, x, y, values, type) {
		var code = type && this.Types[type] ? this.Types[type] : values instanceof Int16Array ? this.Types.int16 : this.Types.uint8;
		var channels = code === this.Types.rgba8 ? 4 : 1;
		var size = Math.round(Math.sqrt(values.length / channels));
		var kept = this.Filter(values, size, channels, true);
		var bytes = new Uint8Array(32 + values.byteLength);
		var view = new DataView(bytes.buffer);

		bytes.set([69, 80, 84, 49], 0);

		view.setUint8(4, code);
		view.setUint8(5, face);
		view.setUint8(6, level);
		view.setUint8(7, 1);
		view.setUint32(8, x, true);
		view.setUint32(12, y, true);
		view.setUint16(16, size, true);

		bytes.set(new Uint8Array(kept.buffer, kept.byteOffset, kept.byteLength), 32);

		return bytes;
	},

	/*
	 * The samples as differences (forward) or back: each channel from the sample before it in its row, the first of a row
	 * from the first of the row above. The arrays wrap as the bytes do (a difference of int16 kept in int16).
	 */
	Filter: function (values, size, channels, forward) {
		var out = new values.constructor(values.length);
		var row = size * channels;
		var before;
		var i;

		for (i = 0; i < values.length; i++) {
			before = i < channels ? 0 : i % row < channels ? (forward ? values : out)[i - row] : (forward ? values : out)[i - channels];
			out[i] = forward ? values[i] - before : values[i] + before;
		}

		return out;
	},

	/* A tile of the bytes of its file: {Face, Level, X, Y, Size, Values}; an error for what is not one. */
	Tile: function (bytes) {
		var data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
		var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		var type;
		var body;
		var size;
		var values;

		if (data.length < 32 || data[0] !== 69 || data[1] !== 80 || data[2] !== 84 || data[3] !== 49)
			throw new Error('PlanetData: not a tile');

		type = view.getUint8(4);
		size = view.getUint16(16, true);
		body = data.slice(32).buffer;
		values = type === this.Types.int16 ? new Int16Array(body) : new Uint8Array(body);

		if (view.getUint8(7) === 1)
			values = this.Filter(values, size, type === this.Types.rgba8 ? 4 : 1, false);

		return {Face: view.getUint8(5), Level: view.getUint8(6), X: view.getUint32(8, true), Y: view.getUint32(12, true), Size: size, Values: values};
	},

	/* The level of a tile by its name (layer/face/level/x-y). */
	LevelOf: function (name) {
		return Number(name.split('/')[2]);
	},

	/*
	 * The files of a planet by their paths: planet.json, its vectors, then its tiles level by level (the coarse ones
	 * together at the start of its file: a reader of the network takes them in one range).
	 */
	Files: function (data) {
		var self = this;
		var files = {};

		this.Parts(data).forEach(function (part) {
			files[self.Path(part, data.Manifest)] = self.Encode(data, part);
		});

		return files;
	},

	/* The tile of a name (layer/face/level/x-y) as a part, and back. */
	TilePart: function (name) {
		var parts = name.split('/');
		var at = parts[3].split('-');

		return {Kind: 'tile', Layer: parts[0], Face: Number(parts[1]), Level: Number(parts[2]), X: Number(at[0]), Y: Number(at[1])};
	},

	TileOf: function (part) {
		return part.Layer + '/' + part.Face + '/' + part.Level + '/' + part.X + '-' + part.Y;
	},

	/* The key of a part: the same part, the same key, whatever its order of fields (a part of any kind with an ID: Kind:ID). */
	Key: function (part) {
		/* A part of the planet of a body of a system (SystemData): its body first. */
		if (part.Body !== undefined && part.Body !== null)
			return 'body:' + part.Body + '/' + this.Key(Object.assign({}, part, {Body: null}));

		if (part.Kind === 'tile')
			return 'tile:' + this.TileOf(part);

		if (part.Kind === 'vector')
			return 'vector:' + part.Name;

		if (part.ID !== undefined && part.ID !== null) return part.Kind + ':' + part.ID;

		return part.Kind;
	},

	/* The path of a part in the one file of a planet (a store of a file, or a folder): its names are those of a file alone. */
	Path: function (part, manifest) {
		var vectors = manifest && manifest.Vectors || {};

		if (part.Kind === 'manifest') return 'planet.json';

		if (part.Kind === 'tile')
			return 'tiles/' + this.TileOf(part) + '.bin';

		if (part.Kind === 'vector')
			return vectors[part.Name] || 'vectors/' + String(part.Name).toLowerCase() + '.json';

		if (part.Kind === 'edits')
			return manifest && manifest.Edits || 'edits.json';

		if (part.Kind === 'objects')
			return 'objects/' + encodeURIComponent(part.ID) + '.json';

		throw new Error('PlanetData: no part of kind ' + part.Kind);
	},

	/* All the parts of a planet, as its file has them: its passport, its vectors, its edits, its objects, its tiles level by level. */
	Parts: function (data) {
		var self = this;
		var manifest = data.Manifest;

		return [{Kind: 'manifest'}].concat(Object.keys(manifest.Vectors || {}).filter(function (name) {
			return data.Vectors && data.Vectors[name];
		}).map(function (name) {
			return {Kind: 'vector', Name: name};
		}), manifest.Edits && data.Edits ? [{Kind: 'edits'}] : [], (manifest.Objects || []).filter(function (id) {
			return data.Objects && data.Objects[id];
		}).map(function (id) {
			return {Kind: 'objects', ID: id};
		}), Object.keys(data.Tiles).sort(function (a, b) {
			return self.LevelOf(a) - self.LevelOf(b) || (a < b ? -1 : a > b ? 1 : 0);
		}).map(function (name) {
			return self.TilePart(name);
		}));
	},

	/* The bytes of a part of a planet. */
	Encode: function (data, part) {
		var layer;

		if (part.Kind === 'manifest')
			return new TextEncoder().encode(JSON.stringify(data.Manifest, null, '\t'));

		if (part.Kind === 'vector')
			return new TextEncoder().encode(JSON.stringify(data.Vectors[part.Name]));

		if (part.Kind === 'edits')
			return new TextEncoder().encode(JSON.stringify(data.Edits));

		if (part.Kind === 'objects')
			return new TextEncoder().encode(JSON.stringify(data.Objects[part.ID]));

		layer = data.Manifest.Layers[part.Layer];

		return this.Bytes(part.Layer, part.Face, part.Level, part.X, part.Y, data.Tiles[this.TileOf(part)], layer && layer.Type);
	},

	/* A part of its bytes into the data of a planet. */
	Decode: function (data, part, bytes) {
		var text;

		if (part.Kind === 'tile') {
			data.Tiles[this.TileOf(part)] = this.Tile(bytes).Values;

			return;
		}

		text = typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes);

		if (part.Kind === 'vector') data.Vectors[part.Name] = JSON.parse(text);
		else if (part.Kind === 'edits') data.Edits = JSON.parse(text);
		else if (part.Kind === 'objects') data.Objects[part.ID] = JSON.parse(text);
	},

	/* Parts of a store: next(error, [bytes or null]) in their order (ReadMany when it has it). */
	ReadParts: function (store, parts, next) {
		var list = [];
		var left = parts.length;
		var failed = false;

		if (!left) {
			next(null, list);

			return;
		}

		if (typeof store.ReadMany === 'function') {
			store.ReadMany(parts, next);

			return;
		}

		parts.forEach(function (part, index) {
			store.Read(part, function (error, bytes) {
				if (failed) return;

				if (error) {
					failed = true;

					next(error);

					return;
				}

				list[index] = bytes || null;

				if (!--left)
					next(null, list);
			});
		});
	},

	/*
	 * A planet of a store: its passport, its vectors and its edits, its tiles to levels (all by default); its finer tiles
	 * by Need, its objects as they are asked for (Objects).
	 */
	FromStore: function (store, settings, callback) {
		var self = this;
		var levels = settings && settings.Levels !== undefined && settings.Levels !== null ? Number(settings.Levels) : Infinity;

		store.Read({Kind: 'manifest'}, function (error, bytes) {
			var data = {Manifest: null, Tiles: {}, Vectors: {}, Edits: null, Objects: {}};
			var parts;

			if (error || !bytes) {
				callback(error || new Error('PlanetData: not a planet'));

				return;
			}

			try {
				data.Manifest = JSON.parse(typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes));

				if (!data.Manifest || data.Manifest.Format !== 'elemenx-planet')
					throw new Error('PlanetData: not a planet');
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			parts = Object.keys(data.Manifest.Vectors || {}).map(function (name) {
				return {Kind: 'vector', Name: name};
			}).concat(data.Manifest.Edits ? [{Kind: 'edits'}] : [], (data.Manifest.Tiles || []).filter(function (name) {
				return self.LevelOf(name) <= levels;
			}).map(function (name) {
				return self.TilePart(name);
			}));

			self.ReadParts(store, parts, function (failed, list) {
				if (failed) {
					callback(failed);

					return;
				}

				try {
					parts.forEach(function (part, index) {
						if (list[index])
							self.Decode(data, part, list[index]);
					});
				}
				catch (wrong) {
					callback(wrong);

					return;
				}

				data.Source = {Kind: 'store', Store: store};

				callback(null, data);
			});
		});
	},

	Objects: function (data, id, callback) {
		var self = this;
		var source = data.Source;

		data.Objects = data.Objects || {};

		if (data.Objects[id] !== undefined || (data.Manifest.Objects || []).indexOf(id) === -1 || !source || source.Kind !== 'store') {
			callback(null, data.Objects[id] || null);

			return;
		}

		source.Store.Read({Kind: 'objects', ID: id}, function (error, bytes) {
			if (error) {
				callback(error);

				return;
			}

			try {
				if (bytes)
					self.Decode(data, {Kind: 'objects', ID: id}, bytes);
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			callback(null, data.Objects[id] || null);
		});
	},

	SetObjects: function (data, id, document) {
		var listed = data.Manifest.Objects = (data.Manifest.Objects || []).filter(function (one) {
			return one !== id;
		});

		data.Objects = data.Objects || {};

		if (document) {
			data.Objects[id] = document;

			listed.push(id);
			listed.sort();
		}
		else {
			delete data.Objects[id];
		}

		this.Mark(data, {Kind: 'objects', ID: id}, !document);
		this.Mark(data, {Kind: 'manifest'});
	},

	/* A part changed (or gone): written by the next Write. */
	Mark: function (data, part, gone) {
		data.Dirty = data.Dirty || {};
		data.Dirty[this.Key(part)] = {Part: part, Gone: !!gone};
	},

	Write: function (data, store, callback, whole) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};
		var marked = data.Dirty || {};
		var entries = whole || !data.Dirty ? this.Parts(data).map(function (part) {
			return {Part: part, Gone: false};
		}) : Object.keys(marked).map(function (key) {
			return marked[key];
		});
		var kept = entries.filter(function (entry) {
			return !entry.Gone;
		});
		var gone = entries.filter(function (entry) {
			return entry.Gone;
		});
		var left = 2;
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

			done(null, entries.length);
		}

		this.WriteParts(store, kept.map(function (entry) {
			return entry.Part;
		}), kept.map(function (entry) {
			return self.Encode(data, entry.Part);
		}), finish);

		this.RemoveParts(store, gone.map(function (entry) {
			return entry.Part;
		}), finish);
	},

	WriteParts: function (store, parts, list, next) {
		var left = parts.length;
		var failed = false;

		if (!left) {
			next(null);

			return;
		}

		if (typeof store.WriteMany === 'function') {
			store.WriteMany(parts, list, next);

			return;
		}

		parts.forEach(function (part, index) {
			store.Write(part, list[index], function (error) {
				if (failed) return;

				if (error) {
					failed = true;

					next(error);

					return;
				}

				if (!--left)
					next(null);
			});
		});
	},

	RemoveParts: function (store, parts, next) {
		var left = parts.length;
		var failed = false;

		if (!left || typeof store.Remove !== 'function') {
			next(null);

			return;
		}

		parts.forEach(function (part) {
			store.Remove(part, function (error) {
				if (failed) return;

				if (error) {
					failed = true;

					next(error);

					return;
				}

				if (!--left)
					next(null);
			});
		});
	},

	/*
	 * A store of the network: the parts of a planet read and written by Elemenx.Network.Transfer over the Transport of
	 * settings.Transport: a transport, or function (part, action) giving one (Read or Write), so the URL, the method and
	 * the headers of each part are the application's. Which part is asked for is the application's too:
	 * - a transport of one request (XHR: no Send) is one part: Read sends nothing and takes the bytes of its answer (404:
	 *   none there), Write sends the bytes of the part;
	 * - a transport of messages (a WebSocket, a channel of WebRTC, a window) carries messages of the application,
	 *   {Planet: {Action (Read, Write; of the other side Result, Error, Changed), ID, Part, Error}, Bytes}, packed by
	 *   Transfer as structured data; the answers come by a TransferReceiver on that transport (settings.Receiver, or one
	 *   made), each to the request of its ID; Changed tells the watchers (Watch: a part changed on the other side).
	 */
	Remote: function (settings) {
		var given = settings || {};
		var network = this.$Network ? this.$Network() : Elemenx.Network;
		var pending = {};
		var watchers = [];
		var heard = [];
		var count = 0;

		function transportOf (part, action) {
			return typeof given.Transport === 'function' ? given.Transport(part, action) : given.Transport;
		}

		/* What came as the bytes of a part: a Blob, an ArrayBuffer, a view or a text. */
		function bytesOf (value, next) {
			if (value === undefined || value === null) {
				next(null, null);

				return;
			}

			if (typeof Blob !== 'undefined' && value instanceof Blob) {
				value.arrayBuffer().then(function (buffer) {
					next(null, new Uint8Array(buffer));
				}, function (error) {
					next(error);
				});

				return;
			}

			if (value instanceof ArrayBuffer) next(null, new Uint8Array(value));
			else if (ArrayBuffer.isView(value)) next(null, new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
			else if (typeof value === 'string') next(null, new TextEncoder().encode(value));
			else next(new Error('PlanetData: no bytes of a part'));
		}

		/* The answers and the news of the other side of a transport of messages, heard once for it. */
		function listen (transport) {
			var receiver;

			if (heard.indexOf(transport) !== -1) return;

			heard.push(transport);

			receiver = given.Receiver || network.TransferReceiver({Transport: transport});

			if (given.Receiver && heard.length > 1) return;

			receiver.On('Transfer.Receive', function (event) {
				var message = event.Data && event.Data.Data;
				var head = message && message.Planet;
				var waiting;

				if (!head) return;

				if (head.Action === 'Changed') {
					watchers.slice().forEach(function (watcher) {
						watcher(head.Part);
					});

					return;
				}

				waiting = pending[head.ID];

				if (!waiting) return;

				delete pending[head.ID];

				if (head.Action === 'Error') waiting(new Error(head.Error || 'PlanetData: the part was refused'));
				else bytesOf(message.Bytes, waiting);
			});
		}

		function ask (action, part, bytes, callback) {
			var transport = transportOf(part, action);
			var transfer;
			var id;

			function failed (event) {
				var error = event && event.Data && event.Data.Error || new Error('PlanetData: the transfer of a part failed');

				if (id && !pending[id]) return;

				if (id)
					delete pending[id];

				callback(error);
			}

			if (!transport) {
				callback(new Error('PlanetData: no transport for a part'));

				return;
			}

			if (typeof transport.Send !== 'function') {
				transfer = network.Transfer({Transport: transport, Data: action === 'Write' ? bytes : new Uint8Array(0)});

				transfer.On('Transfer.Complete', function (event) {
					var answer = event.Data && event.Data.Response || {};
					var status = Number(answer.Status) || 200;

					if (status === 404 && action === 'Read') callback(null, null);
					else if (status >= 400) callback(new Error('PlanetData: ' + action + ' of a part: ' + status));
					else if (action === 'Write') callback(null);
					else bytesOf(answer.Response !== undefined && answer.Response !== null ? answer.Response : answer.ResponseText, callback);
				});
				transfer.On('Transfer.Error', failed);
				transfer.On('Transfer.Abort', failed);
				transfer.Send();

				return;
			}

			listen(transport);

			count++;
			id = 'part-' + count + '-' + Date.now().toString(36);
			pending[id] = callback;
			transfer = network.Transfer({Transport: transport, Data: action === 'Write' ? {Planet: {Action: action, ID: id, Part: part}, Bytes: bytes} : {Planet: {Action: action, ID: id, Part: part}}});

			transfer.On('Transfer.Error', failed);
			transfer.On('Transfer.Abort', failed);
			transfer.Send();
		}

		return {
			Read: function (part, callback) {
				ask('Read', part, null, callback);
			},
			Write: function (part, bytes, callback) {
				ask('Write', part, bytes, function (error) {
					callback(error || null);
				});
			},
			Watch: function (callback) {
				watchers.push(callback);

				return function () {
					var at = watchers.indexOf(callback);
					if (at !== -1)
						watchers.splice(at, 1);
				};
			}
		};
	},

	/*
	 * A store of the browser: the parts of a planet named name in IndexedDB (elemenx-planets, parts), a key for each.
	 * Read of a part it has not gives null.
	 */
	Browser: function (name) {
		var self = this;
		var prefix = String(name) + '|';

		function ask (mode, request, next) {
			self.Ask(mode, request, next, 'parts');
		}

		return {
			Read: function (part, callback) {
				ask('readonly', function (store) {
					return store.get(prefix + self.Key(part));
				}, function (error, found) {
					callback(error || null, error ? null : found || null);
				});
			},
			Write: function (part, bytes, callback) {
				ask('readwrite', function (store) {
					return store.put(bytes, prefix + self.Key(part));
				}, function (error) {
					callback(error || null);
				});
			},
			Remove: function (part, callback) {
				ask('readwrite', function (store) {
					return store.delete(prefix + self.Key(part));
				}, function (error) {
					callback(error || null);
				});
			}
		};
	},

	Save: function (data) {
		return this.$Service('Archive').Zip(this.Files(data));
	},

	Pack: function (data, callback) {
		this.$Service('Archive').Compress(this.Files(data), callback);
	},

	/* The data of the files of a planet by their paths: its manifest and its tiles; an error for what is not a planet. */
	Read: function (files, callback) {
		var self = this;
		var data = {Manifest: null, Tiles: {}, Vectors: {}, Edits: null, Objects: {}};
		var text = files['planet.json'];

		try {
			data.Manifest = JSON.parse(typeof text === 'string' ? text : new TextDecoder().decode(text));

			if (!data.Manifest || data.Manifest.Format !== 'elemenx-planet')
				throw new Error('PlanetData: not a planet');

			(data.Manifest.Tiles || []).forEach(function (name) {
				var bytes = files['tiles/' + name + '.bin'];
				if (bytes)
					data.Tiles[name] = self.Tile(bytes).Values;
			});

			Object.keys(data.Manifest.Vectors || {}).forEach(function (name) {
				var kept = files[data.Manifest.Vectors[name]];
				if (kept)
					data.Vectors[name] = JSON.parse(typeof kept === 'string' ? kept : new TextDecoder().decode(kept));
			});

			if (data.Manifest.Edits && files[data.Manifest.Edits])
				data.Edits = JSON.parse(typeof files[data.Manifest.Edits] === 'string' ? files[data.Manifest.Edits] : new TextDecoder().decode(files[data.Manifest.Edits]));

			(data.Manifest.Objects || []).forEach(function (id) {
				var kept = files[self.Path({Kind: 'objects', ID: id})];
				if (kept)
					self.Decode(data, {Kind: 'objects', ID: id}, kept);
			});
		}
		catch (error) {
			callback(error);

			return;
		}

		callback(null, data);
	},

	Open: function (source, callback, settings) {
		var self = this;
		var done = typeof callback === 'function' ? callback : function () {};
		var reader;

		function unzipped (bytes) {
			self.$Service('Archive').Expand(bytes, function (error, files) {
				if (error) done(error);
				else self.Read(files, done);
			});
		}

		if (source && source.Manifest && source.Tiles) {
			done(null, source);

			return;
		}

		if (typeof source === 'string') {
			this.Fetch(source, done, settings);

			return;
		}

		if (source && typeof source.Read === 'function') {
			this.FromStore(source, settings, done);

			return;
		}

		if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
			unzipped(source);

			return;
		}

		if (typeof Blob !== 'undefined' && source instanceof Blob) {
			reader = new FileReader();
			reader.onload = function () {
				unzipped(reader.result);
			};
			reader.onerror = function () {
				done(reader.error || new Error('PlanetData: the file was not read'));
			};

			reader.readAsArrayBuffer(source);

			return;
		}

		done(new Error('PlanetData: not a planet'));
	},

	/*
	 * Bytes of the network: the whole of a URL, or a range of it (range: 'bytes=a-b'): next(error, bytes, total), total
	 * the size of the whole when a range came (0 when the server sent all of it).
	 */
	Get: function (url, range, next) {
		fetch(url, range ? {headers: {Range: range}} : undefined).then(function (response) {
			if (!response.ok)
				throw new Error('PlanetData: ' + url + ' ' + response.status);

			return response.arrayBuffer().then(function (buffer) {
				return {Bytes: new Uint8Array(buffer), Total: response.status === 206 ? Number(String(response.headers.get('Content-Range') || '').split('/')[1]) || 0 : 0};
			});
		}).then(function (made) {
			next(null, made.Bytes, made.Total);
		}, function (error) {
			next(error);
		});
	},

	/*
	 * A planet of the network: a zip at its URL (.zip, .planet), else a folder of its files (planet.json and what it
	 * lists). settings.Levels: only its tiles to that level read now, the finer ones as they are needed (Need); its file
	 * read by ranges then (a server that sends no range sends it whole).
	 */
	Fetch: function (url, callback, settings) {
		var self = this;
		var levels = settings && settings.Levels !== undefined && settings.Levels !== null ? Number(settings.Levels) : Infinity;
		var base = url.replace(/\/(planet\.json)?$/, '');

		if (/\.(zip|planet)(\?|$)/i.test(url) || /^blob:/.test(url)) {
			if (levels === Infinity || /^blob:/.test(url)) {
				this.Get(url, null, function (error, bytes) {
					if (error) callback(error);
					else self.Open(bytes, callback);
				});
			}
			else {
				this.Ranged(url, levels, callback);
			}

			return;
		}

		this.Get(base + '/planet.json', null, function (error, bytes) {
			var text;
			var manifest;

			if (error) {
				callback(error);

				return;
			}

			text = new TextDecoder().decode(bytes);

			try {
				manifest = JSON.parse(text);
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			/* Read whole once, kept in the browser (Store): the same planet again (the very same manifest) is taken from there. */
			self.Stored(manifest.ID, function (none, found) {
				var files = {'planet.json': text};
				var paths;

				if (found && JSON.stringify(found.Manifest) === JSON.stringify(manifest)) {
					callback(null, found);

					return;
				}

				paths = (manifest.Tiles || []).filter(function (name) {
					return self.LevelOf(name) <= levels;
				}).map(function (name) {
					return 'tiles/' + name + '.bin';
				}).concat(Object.keys(manifest.Vectors || {}).map(function (name) {
					return manifest.Vectors[name];
				}), manifest.Edits ? [manifest.Edits] : []);

				self.Many(paths.map(function (path) {
					return base + '/' + path;
				}), function (wrong, list) {
					if (wrong) {
						callback(wrong);

						return;
					}

					paths.forEach(function (path, index) {
						files[path] = list[index];
					});

					self.Read(files, function (failed, data) {
						if (failed) {
							callback(failed);

							return;
						}

						if (levels === Infinity) self.Store(data);
						else data.Source = {Kind: 'folder', Base: base};

						callback(null, data);
					});
				});
			});
		});
	},

	/* Many URLs at once: next(error, [bytes]) in their order, the first error alone. */
	Many: function (urls, next) {
		var list = [];
		var left = urls.length;
		var failed = false;
		var self = this;

		if (!left) {
			next(null, list);

			return;
		}

		urls.forEach(function (url, index) {
			self.Get(url, null, function (error, bytes) {
				if (failed) return;

				if (error) {
					failed = true;

					next(error);

					return;
				}

				list[index] = bytes;

				if (!--left)
					next(null, list);
			});
		});
	},

	/*
	 * A planet of one file of the network read by ranges: the directory at its end, its passport, its vectors and its
	 * tiles to levels (the coarse ones lie together, one range); the rest by Need. A server that sends no range: all of it.
	 */
	Ranged: function (url, levels, callback) {
		var self = this;
		var archive = this.$Service('Archive');

		this.Get(url, 'bytes=-65558', function (error, tail, total) {
			var entries;
			var where;

			if (error) {
				callback(error);

				return;
			}

			if (!total) {
				self.Open(tail, callback);

				return;
			}

			where = self.Directory(tail, total);

			function listed (list) {
				var named = {};
				var wanted;

				list.forEach(function (entry) {
					named[entry.Name] = entry;
				});

				if (!named['planet.json']) {
					callback(new Error('PlanetData: not a planet'));

					return;
				}

				self.Entries(url, [named['planet.json']], function (wrong, first) {
					var manifest;

					if (wrong) {
						callback(wrong);

						return;
					}

					try {
						manifest = JSON.parse(new TextDecoder().decode(first['planet.json']));
					}
					catch (bad) {
						callback(bad);

						return;
					}

					wanted = Object.keys(manifest.Vectors || {}).map(function (name) {
						return named[manifest.Vectors[name]];
					}).concat(manifest.Edits ? [named[manifest.Edits]] : [], (manifest.Tiles || []).filter(function (name) {
						return self.LevelOf(name) <= levels;
					}).map(function (name) {
						return named['tiles/' + name + '.bin'];
					})).filter(Boolean);

					self.Entries(url, wanted, function (failed, files) {
						if (failed) {
							callback(failed);

							return;
						}

						files['planet.json'] = first['planet.json'];

						self.Read(files, function (bad, data) {
							if (!bad)
								data.Source = {Kind: 'zip', URL: url, Entries: named};

							callback(bad, data);
						});
					});
				});
			}

			try {
				entries = where.Start >= total - tail.length ? archive.Entries(tail, total - tail.length) : null;
			}
			catch (wrong) {
				callback(wrong);

				return;
			}

			if (entries) {
				listed(entries);

				return;
			}

			/* A directory longer than the end read: read from its start. */
			self.Get(url, 'bytes=' + where.Start + '-' + (total - 1), function (wrong, rest) {
				if (wrong) {
					callback(wrong);

					return;
				}

				try {
					listed(archive.Entries(rest, where.Start));
				}
				catch (bad) {
					callback(bad);
				}
			});
		});
	},

	/* Where the directory of a zip starts in its file, of its end (tail, the last bytes of a file of total bytes): {Start}. */
	Directory: function (tail, total) {
		var view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
		var archive = this.$Service('Archive');
		var end = tail.length - 22;
		var record;

		while (end >= 0 && view.getUint32(end, true) !== 0x06054b50)
			end--;

		if (end < 0)
			return {Start: total};

		if (end >= 20 && view.getUint32(end - 20, true) === 0x07064b50) {
			record = archive.Get64(view, end - 12) - (total - tail.length);

			if (record >= 0 && record + 56 <= tail.length)
				return {Start: archive.Get64(view, record + 48)};
		}

		return {Start: view.getUint32(end + 16, true)};
	},

	/*
	 * Entries of a zip of the network, each by its range (those side by side in one range), inflated where deflated:
	 * next(error, {name: bytes}).
	 */
	Entries: function (url, entries, next) {
		var self = this;
		var archive = this.$Service('Archive');
		var files = {};
		var spans = [];
		var left;
		var failed = false;

		entries.slice().sort(function (a, b) {
			return a.Offset - b.Offset;
		}).forEach(function (entry) {
			/* A local header: 30 bytes, its name, and an extra field of ZIP64 at most. */
			var end = entry.Offset + 30 + 4 * entry.Name.length + 64 + entry.Compressed;
			var last = spans[spans.length - 1];

			if (last && entry.Offset <= last.End + 256) {
				last.End = Math.max(last.End, end);

				last.List.push(entry);
			}
			else {
				spans.push({Start: entry.Offset, End: end, List: [entry]});
			}
		});

		left = entries.length;

		if (!left) {
			next(null, files);

			return;
		}

		function got (entry, bytes) {
			files[entry.Name] = bytes;

			if (!--left)
				next(null, files);
		}

		spans.forEach(function (span) {
			self.Get(span.URL || url, 'bytes=' + span.Start + '-' + (span.End - 1), function (error, bytes) {
				if (failed) return;

				if (error) {
					failed = true;

					next(error);

					return;
				}

				span.List.forEach(function (entry) {
					var kept;

					try {
						kept = archive.Data(bytes.subarray(entry.Offset - span.Start), entry);
					}
					catch (wrong) {
						failed = true;

						next(wrong);

						return;
					}

					if (entry.Method === 0) {
						got(entry, kept);

						return;
					}

					archive.Inflate(kept, function (wrong, made) {
						if (failed) return;

						if (wrong) {
							failed = true;

							next(wrong);

							return;
						}

						got(entry, made);
					});
				});
			});
		});
	},

	/*
	 * The tiles of a planet read in part (Open with Levels) round a direction: of each layer, those over a circle of reach
	 * km round it, to the level whose texel is finest km; those it has, or asked for already, are not read again.
	 * callback(error, names): the names of the tiles that came, now in data.Tiles (ScenePlanet.AddTiles gives them to its
	 * workers). A planet read whole has them all: none comes.
	 */
	Need: function (data, direction, reach, finest, callback) {
		var self = this;
		var planets = this.$Service('ScenePlanet');
		var manifest = data.Manifest;
		var source = data.Source;
		var done = typeof callback === 'function' ? callback : function () {};
		var listed = data.Listed || (data.Listed = {});
		var asked = data.Asked || (data.Asked = {});
		var level = Math.max(0, Math.ceil(Math.log(Math.PI / 2 * manifest.Radius / ((manifest.Size - 1) * Math.max(1e-6, Number(finest) || 1))) / Math.LN2));
		var points = this.Round(direction, (Number(reach) || 0) / manifest.Radius);
		var wanted = {};
		var names;

		if (!Object.keys(listed).length) {
			(manifest.Tiles || []).forEach(function (name) {
				listed[name] = true;
			});
		}

		Object.keys(manifest.Layers).forEach(function (layer) {
			var top = Math.min(manifest.Layers[layer].Depth, level);
			var depth;

			for (depth = 0; depth <= top; depth++) {
				points.forEach(function (point) {
					var place = planets.TilePlace(point);
					var count = 1 << depth;
					var name = planets.TileName(layer, place[0], depth, Math.min(count - 1, Math.floor(place[1] * count)), Math.min(count - 1, Math.floor(place[2] * count)));
					if (listed[name] && !data.Tiles[name] && !asked[name])
						wanted[name] = true;
				});
			}
		});

		names = Object.keys(wanted);

		if (!names.length || !source) {
			done(null, []);

			return;
		}

		names.forEach(function (name) {
			asked[name] = true;
		});

		function came (error, files) {
			var made = [];

			if (error) {
				names.forEach(function (name) {
					delete asked[name];
				});

				done(error, []);

				return;
			}

			try {
				names.forEach(function (name) {
					var bytes = files['tiles/' + name + '.bin'];
					if (!bytes) return;

					data.Tiles[name] = self.Tile(bytes).Values;

					made.push(name);
				});
			}
			catch (wrong) {
				done(wrong, []);

				return;
			}

			done(null, made);
		}

		if (source.Kind === 'store') {
			this.ReadParts(source.Store, names.map(function (name) {
				return self.TilePart(name);
			}), function (error, list) {
				var files = {};

				if (!error) {
					names.forEach(function (name, index) {
						if (list[index])
							files['tiles/' + name + '.bin'] = list[index];
					});
				}

				came(error, files);
			});

			return;
		}

		if (source.Kind === 'zip') {
			this.Entries(source.URL, names.map(function (name) {
				return source.Entries['tiles/' + name + '.bin'];
			}).filter(Boolean), came);

			return;
		}

		this.Many(names.map(function (name) {
			return source.Base + '/tiles/' + name + '.bin';
		}), function (error, list) {
			var files = {};

			if (!error) {
				names.forEach(function (name, index) {
					files['tiles/' + name + '.bin'] = list[index];
				});
			}

			came(error, files);
		});
	},

	/* A direction and the points round it at an angle (radians): 8 of them, and 8 at half of it. */
	Round: function (direction, angle) {
		var length = Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]) || 1;
		var p = [direction[0] / length, direction[1] / length, direction[2] / length];
		var up = Math.abs(p[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
		var east = this.Unit([up[1] * p[2] - up[2] * p[1], up[2] * p[0] - up[0] * p[2], up[0] * p[1] - up[1] * p[0]]);
		var north = [p[1] * east[2] - p[2] * east[1], p[2] * east[0] - p[0] * east[2], p[0] * east[1] - p[1] * east[0]];
		var points = [p];
		var k;

		[angle, angle / 2].forEach(function (far) {
			if (!(far > 0)) return;

			for (k = 0; k < 8; k++) {
				var turn = k * Math.PI / 4;
				var side = [east[0] * Math.cos(turn) + north[0] * Math.sin(turn), east[1] * Math.cos(turn) + north[1] * Math.sin(turn), east[2] * Math.cos(turn) + north[2] * Math.sin(turn)];

				points.push([p[0] * Math.cos(far) + side[0] * Math.sin(far), p[1] * Math.cos(far) + side[1] * Math.sin(far), p[2] * Math.cos(far) + side[2] * Math.sin(far)]);
			}
		});

		return points;
	},

	Unit: function (v) {
		var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;

		return [v[0] / length, v[1] / length, v[2] / length];
	},

	/*
	 * Adaptive depth: the tiles that say nothing more than the nearest coarser one kept (read between its samples, or of
	 * the nearest for Biome and Plate) to tolerance {layer: most a sample may differ: metres of Height, steps of a byte}
	 * are left out; a reader then reads the coarser one. The tiles of level 0 stay. Gives how many went.
	 */
	Prune: function (data, tolerance) {
		var self = this;
		var planets = this.$Service('ScenePlanet');
		var manifest = data.Manifest;
		var size = manifest.Size;
		var gone = 0;

		Object.keys(data.Tiles).sort(function (a, b) {
			return self.LevelOf(a) - self.LevelOf(b);
		}).forEach(function (name) {
			var parts = name.split('/');
			var layer = parts[0];
			var face = Number(parts[1]);
			var level = Number(parts[2]);
			var at = parts[3].split('-');
			var x = Number(at[0]);
			var y = Number(at[1]);
			var limit = tolerance ? tolerance[layer] : undefined;
			var info = manifest.Layers[layer];
			var above = null;
			var k = 1;
			var up;

			if (!level || limit === undefined || limit === null || limit === false || !info) return;

			for (up = level - 1; up >= 0 && !above; up--) {
				k = 1 << level - up;
				above = data.Tiles[planets.TileName(layer, face, up, Math.floor(x / k), Math.floor(y / k))] || null;
			}

			if (above && self.Covered(data.Tiles[name], above, size, info.Type === 'rgba8' ? 4 : 1, x % k, y % k, k, Number(limit), layer === 'Biome' || layer === 'Plate')) {
				delete data.Tiles[name];

				gone++;
			}
		});

		return gone;
	},

	/* Whether a tile is its coarser one read where it lies (at ox, oy of k by k in it) to limit, as ScenePlanet reads it. */
	Covered: function (tile, above, size, channels, ox, oy, k, limit, nearest) {
		var i;
		var j;
		var c;
		var u;
		var v;
		var a;
		var b;
		var fx;
		var fy;
		var read;

		for (j = 0; j < size; j++) {
			for (i = 0; i < size; i++) {
				u = (ox + i / (size - 1)) / k * (size - 1);
				v = (oy + j / (size - 1)) / k * (size - 1);
				a = Math.min(size - 2, Math.floor(u));
				b = Math.min(size - 2, Math.floor(v));
				fx = u - a;
				fy = v - b;

				for (c = 0; c < channels; c++) {
					read = nearest ? above[(Math.round(v) * size + Math.round(u)) * channels + c] : (above[(b * size + a) * channels + c] * (1 - fx) + above[(b * size + a + 1) * channels + c] * fx) * (1 - fy) + (above[((b + 1) * size + a) * channels + c] * (1 - fx) + above[((b + 1) * size + a + 1) * channels + c] * fx) * fy;

					if (Math.abs(tile[(j * size + i) * channels + c] - read) > limit) return false;
				}
			}
		}

		return true;
	},

	/* The database of the planets kept in the browser (elemenx-planets), opened once: callback(database, or null with none). */
	Database: function (callback) {
		var self = this;
		var request;

		if (this.Opened) {
			callback(this.Opened);

			return;
		}

		try {
			request = typeof indexedDB === 'undefined' ? null : indexedDB.open('elemenx-planets', 2);
		}
		catch (error) {
			request = null;
		}

		if (!request) {
			callback(null);

			return;
		}

		/* Its stores: planets kept whole (Store), and the parts of planets (Browser). */
		request.onupgradeneeded = function () {
			['planets', 'parts'].forEach(function (name) {
				if (!request.result.objectStoreNames.contains(name))
					request.result.createObjectStore(name);
			});
		};

		request.onsuccess = function () {
			self.Opened = request.result;

			callback(self.Opened);
		};

		request.onerror = function () {
			callback(null);
		};
	},

	/* A request of a store of the planets (planets, or parts): callback(error, its result); an error where there is no IndexedDB. */
	Ask: function (mode, ask, callback, name) {
		var done = typeof callback === 'function' ? callback : function () {};

		this.Database(function (database) {
			var request;

			if (!database) {
				done(new Error('PlanetData: no IndexedDB'));

				return;
			}

			try {
				request = ask(database.transaction([name || 'planets'], mode).objectStore(name || 'planets'));
			}
			catch (error) {
				done(error);

				return;
			}

			request.onsuccess = function () {
				done(null, request.result);
			};

			request.onerror = function () {
				done(request.error || new Error('PlanetData: the store failed'));
			};
		});
	},

	Store: function (data, callback) {
		this.Ask('readwrite', function (store) {
			return store.put({Manifest: data.Manifest, Tiles: data.Tiles, Vectors: data.Vectors || {}, Edits: data.Edits || null}, data.Manifest.ID);
		}, function (error) {
			if (typeof callback === 'function')
				callback(error || null);
		});
	},

	/* A planet kept (Store) by its ID: null when there is none, or no IndexedDB. */
	Stored: function (id, callback) {
		this.Ask('readonly', function (store) {
			return store.get(String(id));
		}, function (error, found) {
			callback(null, !error && found ? found : null);
		});
	},

	List: function (callback) {
		this.Ask('readonly', function (store) {
			return store.getAll();
		}, function (error, all) {
			callback(null, error ? [] : (all || []).map(function (data) {
				return data.Manifest;
			}));
		});
	},

	Remove: function (id, callback) {
		this.Ask('readwrite', function (store) {
			return store.delete(String(id));
		}, function (error) {
			if (typeof callback === 'function')
				callback(error || null);
		});
	}
});
