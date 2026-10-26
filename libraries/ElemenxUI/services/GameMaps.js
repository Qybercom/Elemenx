/*
 * The maps of GameWorld: its own JSON, or a map of Tiled (.tmj), made into one form.
 * - Normalize(map) returns the map GameWorld draws: {Width, Height, Projection (orthogonal or isometric), TileWidth,
 *   TileHeight, Terrain: {key: {Name, Color, Cost, Opaque, Image, SourceX, SourceY, SourceWidth, SourceHeight}},
 *   Layers: [{Name, Cells (Width * Height keys of Terrain, null where empty)}], Objects: [{ID, Kind, X, Y, Width,
 *   Height, Team, ...}]}. A layer of the JSON gives Rows (lines of text, a character a key of Terrain: '.' grass,
 *   '~' water...) or Data (the keys, row by row).
 * - FromTiled(data, base) reads a map of Tiled: its tile layers (each tile a key of Terrain, drawn with the picture
 *   of its tileset; the properties cost and opaque of a tile, Color for a picture missing), its object layers (the
 *   class or type of an object its Kind: unit, building or anything else, its properties its fields) and its
 *   orientation. base: the URL the pictures of the tilesets are relative to.
 * - Load(url, callback): fetches a map (JSON of its own or of Tiled) and calls back (error, map).
 * Positions are in cells: X across, Y down (on an isometric map, along its two edges).
 */
Elemenx.Service('GameMaps', {
	$Meta: {
		Description: 'The maps of GameWorld: its own JSON, or a map of Tiled (.tmj), made into one form.',
		Methods: ['Normalize(map)', 'FromTiled(data, base)', 'Load(url, callback)']
	},

	Terrain: {
		'.': {Name: 'grass', Color: '#5c9a3c', Cost: 1},
		',': {Name: 'meadow', Color: '#6faa47', Cost: 1},
		'~': {Name: 'water', Color: '#3a6fb8', Cost: Infinity},
		'=': {Name: 'ford', Color: '#5f8fc4', Cost: 3},
		':': {Name: 'sand', Color: '#d6bf86', Cost: 1.5},
		'^': {Name: 'hills', Color: '#8b8a72', Cost: 2.5},
		'T': {Name: 'forest', Color: '#3f7a35', Cost: 2, Opaque: true},
		'#': {Name: 'rock', Color: '#6c6a66', Cost: Infinity, Opaque: true},
		'_': {Name: 'road', Color: '#b39b72', Cost: 0.8}
	},

	Kinds: {unit: true, building: true},

	Value: function (value, fallback) {
		if (value === 'Infinity' || value === Infinity) return Infinity;

		return value === undefined || value === null || value === '' || isNaN(Number(value)) ? fallback : Number(value);
	},

	Item: function (source, index) {
		var item = {};
		var key;

		for (key in source || {}) {
			if (Object.prototype.hasOwnProperty.call(source, key))
				item[key] = source[key];
		}

		item.ID = item.ID === undefined || item.ID === null || item.ID === '' ? 'object-' + index : String(item.ID);
		item.Kind = item.Kind ? String(item.Kind) : 'object';
		item.X = this.Value(item.X, 0);
		item.Y = this.Value(item.Y, 0);
		item.Width = this.Value(item.Width, item.Kind === 'building' ? 2 : 1);
		item.Height = this.Value(item.Height, item.Kind === 'building' ? 2 : 1);

		return item;
	},

	Normalize: function (map) {
		var self = this;
		var source = map || {};
		var width = Math.max(1, Math.floor(this.Value(source.Width, 0)) || this.Widest(source));
		var height = Math.max(1, Math.floor(this.Value(source.Height, 0)) || this.Tallest(source));
		var projection = source.Projection === 'orthogonal' ? 'orthogonal' : 'isometric';
		var terrain = {};
		var key;

		for (key in this.Terrain) {
			terrain[key] = this.Terrain[key];
		}

		for (key in source.Terrain || {}) {
			if (Object.prototype.hasOwnProperty.call(source.Terrain, key))
				terrain[key] = this.Kind(source.Terrain[key], key);
		}

		return {
			Width: width,
			Height: height,
			Projection: projection,
			TileWidth: this.Value(source.TileWidth, projection === 'isometric' ? 64 : 32),
			TileHeight: this.Value(source.TileHeight, 32),
			Terrain: terrain,
			Layers: (source.Layers || []).map(function (layer, index) {
				return self.Layer(layer, index, width, height);
			}),
			Objects: (source.Objects || []).map(function (item, index) {
				return self.Item(item, index);
			})
		};
	},

	Kind: function (kind, key) {
		var result = {Name: kind && kind.Name ? String(kind.Name) : String(key)};
		var name;

		for (name in kind || {}) {
			if (Object.prototype.hasOwnProperty.call(kind, name))
				result[name] = kind[name];
		}

		result.Cost = this.Value(result.Cost, 1);
		result.Opaque = result.Opaque === true || result.Opaque === 'true';

		return result;
	},

	Widest: function (source) {
		return (source.Layers || []).reduce(function (most, layer) {
			return Math.max(most, (layer.Rows || []).reduce(function (row, line) {
				return Math.max(row, String(line).length);
			}, 0));
		}, 0);
	},

	Tallest: function (source) {
		return (source.Layers || []).reduce(function (most, layer) {
			return Math.max(most, (layer.Rows || []).length);
		}, 0);
	},

	Layer: function (layer, index, width, height) {
		var cells = new Array(width * height);
		var x;
		var y;
		var character;

		cells.fill(null);

		if (layer.Cells && layer.Cells.length === width * height) {
			cells = layer.Cells.slice();
		}
		else if (Array.isArray(layer.Data)) {
			for (x = 0; x < Math.min(layer.Data.length, cells.length); x++) {
				cells[x] = layer.Data[x] === null || layer.Data[x] === undefined || layer.Data[x] === '' || layer.Data[x] === 0 ? null : String(layer.Data[x]);
			}
		}
		else {
			for (y = 0; y < Math.min(height, (layer.Rows || []).length); y++) {
				for (x = 0; x < Math.min(width, String(layer.Rows[y]).length); x++) {
					character = String(layer.Rows[y]).charAt(x);
					cells[y * width + x] = character === ' ' ? null : character;
				}
			}
		}

		return {Name: layer.Name ? String(layer.Name) : 'layer-' + index, Cells: cells, Visible: layer.Visible !== false};
	},

	/* The properties of Tiled, [{name, type, value}], as an object. */
	Properties: function (list) {
		var result = {};

		(list || []).forEach(function (property) {
			result[property.name] = property.value;
		});

		return result;
	},

	FromTiled: function (data, base) {
		var self = this;
		var isometric = data.orientation === 'isometric';
		var terrain = {};
		var layers = [];
		var objects = [];
		var tileHeight = Number(data.tileheight) || 32;
		var tileWidth = Number(data.tilewidth) || 64;

		/* The tiles of the tilesets: a key each, the picture of its place in the image of its tileset. */
		(data.tilesets || []).forEach(function (tileset) {
			var columns = Number(tileset.columns) || 1;
			var count = Number(tileset.tilecount) || 0;
			var own = {};
			var id;
			var properties;

			(tileset.tiles || []).forEach(function (tile) {
				own[tile.id] = tile;
			});

			for (id = 0; id < count; id++) {
				properties = self.Properties(own[id] && own[id].properties);
				terrain[String(Number(tileset.firstgid) + id)] = {
					Name: properties.name || (tileset.name || 'tile') + '-' + id,
					Color: properties.color || properties.Color || '',
					Cost: self.Value(properties.cost, 1),
					Opaque: properties.opaque === true,
					Image: tileset.image ? self.Resolve(tileset.image, base) : (own[id] && own[id].image ? self.Resolve(own[id].image, base) : ''),
					SourceX: tileset.image ? (id % columns) * (Number(tileset.tilewidth) || tileWidth) : 0,
					SourceY: tileset.image ? Math.floor(id / columns) * (Number(tileset.tileheight) || tileHeight) : 0,
					SourceWidth: Number(tileset.tilewidth) || tileWidth,
					SourceHeight: Number(tileset.tileheight) || tileHeight
				};
			}
		});

		(data.layers || []).forEach(function walk (layer) {
			if (layer.type === 'group') {
				(layer.layers || []).forEach(walk);

				return;
			}

			if (layer.type === 'tilelayer' && Array.isArray(layer.data)) {
				layers.push({
					Name: layer.name,
					Visible: layer.visible !== false,
					Data: layer.data.map(function (gid) {
						/* The bits of a flipped tile are not drawn: the tile is. */
						var id = gid & 0x1FFFFFFF;

						return id ? String(id) : null;
					})
				});
			}

			if (layer.type === 'objectgroup') {
				(layer.objects || []).forEach(function (item) {
					var properties = self.Properties(item.properties);
					var kind = item.class || item.type || properties.Kind || 'object';
					/* Tiled places the objects of an isometric map in pixels of the height of a tile on both axes. */
					var across = isometric ? tileHeight : tileWidth;
					var object = {ID: properties.ID || String(item.id), Kind: kind, Name: item.name || '', X: item.x / across, Y: item.y / tileHeight};
					var key;

					if (item.width)
						object.Width = Math.max(1, Math.round(item.width / across));

					if (item.height)
						object.Height = Math.max(1, Math.round(item.height / tileHeight));

					/* A tile object stands on its bottom left corner. */
					if (item.gid && !isometric)
						object.Y -= object.Height || 1;

					for (key in properties) {
						if (key !== 'ID' && key !== 'Kind')
							object[key] = properties[key];
					}

					objects.push(object);
				});
			}
		});

		return this.Normalize({
			Width: data.width,
			Height: data.height,
			Projection: isometric ? 'isometric' : 'orthogonal',
			TileWidth: tileWidth,
			TileHeight: tileHeight,
			Terrain: terrain,
			Layers: layers,
			Objects: objects
		});
	},

	Resolve: function (url, base) {
		try {
			return base ? new URL(url, new URL(base, document.baseURI)).href : url;
		}
		catch (error) {
			return url;
		}
	},

	Load: function (url, callback) {
		var self = this;

		Elemenx.Resource.Load(url, function (error, text) {
			var data;

			if (error) {
				callback(error, null);

				return;
			}

			try {
				data = JSON.parse(text);
			}
			catch (problem) {
				callback(new Error('Elemenx GameMaps: the map is not JSON: ' + url), null);

				return;
			}

			callback(null, data && (data.tiledversion || data.orientation) ? self.FromTiled(data, url) : self.Normalize(data));
		});
	}
});
