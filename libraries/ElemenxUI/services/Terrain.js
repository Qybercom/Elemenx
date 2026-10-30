/*
 * The ground of a game, continuous: heights of noise anywhere (no cells), its meshes in chunks, and ways over it.
 * - Flat(options) returns a field of a flat map: options Size (of the map, 1000), Height (of its highest hills, 60),
 *   Water (the level of the sea, 0 to 1, 0.35), Scale (the size of its hills, 180), Ridges (0 to 1: how much of it is
 *   folded into mountains, 0.4), Seed; it has Size, Top (its Height) and Water. Its methods: Height(x, z) (the height of the ground; below 0 under the sea),
 *   Normal(x, z), Slope(x, z) (0 flat, 1 a wall), Walkable(x, z, options) (MaxSlope 0.45; Swim: the sea too; Blocked(x,
 *   z): true where a thing stands in the way), Chunk(x,
 *   z, size, resolution) (a geometry of a square of it, its positions relative to its middle, with Colors of its
 *   heights and slopes and a skirt under its edges so chunks of other sizes leave no gap) and Path(from, to, options)
 *   (a way of points {X, Y, Z} round what cannot be walked, made straight where it can be; null when there is none;
 *   options Step, the finest it looks, MaxSlope, Swim).
 * - Sphere(options) returns the ground of a planet, the very one its baked surface shows (the noise of Graphics3D, as
 *   the shader of a GameScene bakes it): options Radius (units), Height (its relief), Seed (the number of its pattern),
 *   Ocean (0 to 1), Type (rocky, desert, terran, ocean, ice, lava, dwarf, moon). Its methods: Land(direction) (the
 *   ground of the noise: below 0 the sea), Elevation(direction) (above the radius), Point(direction) (on the ground),
 *   Altitude(point) (above the ground under it), Patch(face, u, v, size, resolution) (a geometry of a square of a face
 *   of its cube, from u and v of -1 to 1, its positions relative to its Center, the land in UV.x, the sea in UV.y).
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Terrain', {
	$Meta: {
		Description: 'The ground of a game, continuous: heights of noise anywhere, meshes in chunks, ways over it; the ground of a planet as its surface shows.',
		Methods: ['Flat(options)', 'Sphere(options)']
	},

	Smoothstep: function (from, to, value) {
		var t = Math.max(0, Math.min(1, (value - from) / (to - from)));

		return t * t * (3 - 2 * t);
	},

	Flat: function (options) {
		var self = this;
		var settings = options || {};
		var graphics = this.$Service('Graphics3D');
		var noise = graphics.Noise(settings.Seed === undefined ? 'ground' : settings.Seed);
		var size = Number(settings.Size) || 1000;
		var height = settings.Height === undefined ? 60 : Number(settings.Height);
		var water = settings.Water === undefined ? 0.35 : Number(settings.Water);
		var scale = Number(settings.Scale) || 180;
		var ridges = settings.Ridges === undefined ? 0.4 : Number(settings.Ridges);
		var field;

		function raw (x, z) {
			var soft = noise.Fbm(x / scale, 0.37, z / scale, 6);
			var folded = noise.Ridge(x / scale * 0.7 + 11, 1.3, z / scale * 0.7 - 5, 5);
			var mountains = self.Smoothstep(0.45, 0.75, noise.Fbm(x / scale * 0.25 + 3, 2.1, z / scale * 0.25, 3)) * ridges;

			return soft * (1 - mountains) + folded * mountains;
		}

		field = {
			Size: size,
			Top: height,
			Water: water,

			Height: function (x, z) {
				return (raw(x, z) - water) * height / (1 - water);
			},

			Normal: function (x, z) {
				var d = Math.max(0.5, scale / 200);
				var dx = field.Height(x + d, z) - field.Height(x - d, z);
				var dz = field.Height(x, z + d) - field.Height(x, z - d);

				return graphics.Vectors.Normalize([-dx, 2 * d, -dz]);
			},

			Slope: function (x, z) {
				return 1 - field.Normal(x, z)[1];
			},

			Walkable: function (x, z, rules) {
				var given = rules || {};

				if (Math.abs(x) > size / 2 || Math.abs(z) > size / 2) return false;
				if (!given.Swim && field.Height(x, z) < 0) return false;
				if (given.Blocked && given.Blocked(x, z)) return false;

				return field.Slope(x, z) <= (given.MaxSlope === undefined ? 0.45 : given.MaxSlope);
			},

			Chunk: function (x, z, extent, resolution) {
				return self.Mesh(field, x, z, extent, resolution || 32);
			},

			Path: function (from, to, rules) {
				return self.Way(field, from, to, rules || {});
			}
		};

		return field;
	},

	/* The colors of the ground of a flat map: sand by the sea, grass, rock on the slopes, snow on the heights. */
	Paint: function (field, x, z, y, slope) {
		var high = y / Math.max(1, field.Top);
		var color;

		if (y < -0.5) color = [0.2, 0.26, 0.3];
		else if (y < 1.2) color = [0.76, 0.7, 0.52];
		else if (high < 0.45) color = [0.3 + high * 0.2, 0.5 - high * 0.15, 0.22];
		else if (high < 0.75) color = [0.45, 0.42, 0.36];
		else color = [0.93, 0.94, 0.96];

		if (slope > 0.32 && y > 1.2)
			color = [0.42, 0.39, 0.35];

		return color;
	},

	/* A square of a flat map as a geometry: its positions relative to its middle, a skirt down its four edges. */
	Mesh: function (field, cx, cz, extent, resolution) {
		var geometry = {Positions: [], Normals: [], UVs: [], Colors: [], Indices: []};
		var side = resolution + 1;
		var step = extent / resolution;
		var row;
		var column;
		var x;
		var z;
		var y;
		var normal;
		var color;
		var a;
		var base;
		var edges;

		for (row = 0; row <= resolution; row++) {
			for (column = 0; column <= resolution; column++) {
				x = cx - extent / 2 + column * step;
				z = cz - extent / 2 + row * step;
				y = field.Height(x, z);
				normal = field.Normal(x, z);
				color = this.Paint(field, x, z, y, 1 - normal[1]);

				geometry.Positions.push(x - cx, y, z - cz);
				geometry.Normals.push(normal[0], normal[1], normal[2]);
				geometry.UVs.push(y, y < 0 ? 1 : 0);
				geometry.Colors.push(color[0], color[1], color[2]);
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

		edges.forEach(function (index) {
			geometry.Positions.push(geometry.Positions[index * 3], geometry.Positions[index * 3 + 1] - step * 2, geometry.Positions[index * 3 + 2]);
			geometry.Normals.push(geometry.Normals[index * 3], geometry.Normals[index * 3 + 1], geometry.Normals[index * 3 + 2]);
			geometry.UVs.push(geometry.UVs[index * 2], geometry.UVs[index * 2 + 1]);
			geometry.Colors.push(geometry.Colors[index * 3] * 0.8, geometry.Colors[index * 3 + 1] * 0.8, geometry.Colors[index * 3 + 2] * 0.8);
		});

		edges.forEach(function (index, at) {
			var next = edges[(at + 1) % edges.length];
			var low = base + at;
			var lowNext = base + (at + 1) % edges.length;

			geometry.Indices.push(index, next, low, next, lowNext, low);
		});

		return geometry;
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

	Sphere: function (options) {
		var self = this;
		var settings = options || {};
		var graphics = this.$Service('Graphics3D');
		var noise = graphics.Noise();
		var radius = Number(settings.Radius) || 6371;
		var height = settings.Height === undefined ? radius * 0.0015 : Number(settings.Height);
		var seed = Number(settings.Seed) || 0;
		var ocean = Number(settings.Ocean) || 0;
		var type = settings.Type || 'rocky';
		var cratered = type === 'rocky' || type === 'desert' || type === 'dwarf' || type === 'moon';
		var field;

		/* The land of a direction: the very formula of the shader that bakes the surface (Bake of GameScene). */
		function land (direction) {
			var p = graphics.Vectors.Normalize(direction);
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
			var p = graphics.Vectors.Normalize(direction);
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
				var p = graphics.Vectors.Normalize(direction);

				return graphics.Vectors.Scale(p, radius + field.Elevation(p));
			},

			Altitude: function (point) {
				return graphics.Vectors.Length(point) - radius - field.Elevation(point);
			},

			Patch: function (face, u, v, extent, resolution) {
				return self.SpherePatch(field, face, u, v, extent, resolution || 32);
			}
		};

		return field;
	},

	/* A direction of a face of a cube, as the shaders take them (Chunks.Cube of Graphics3D). */
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

	SpherePatch: function (field, face, cu, cv, extent, resolution) {
		var graphics = this.$Service('Graphics3D');
		var geometry = {Positions: [], Normals: [], UVs: [], Indices: []};
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
				direction = graphics.Vectors.Normalize(this.Face(face, cu - extent / 2 + column * step, cv - extent / 2 + row * step));
				value = field.Land(direction);
				point = graphics.Vectors.Scale(direction, field.Radius + field.Raise(direction, value));

				points.push(point);
				geometry.Positions.push(point[0] - center[0], point[1] - center[1], point[2] - center[2]);
				geometry.UVs.push(value, field.Ocean > 0 && value < 0 ? 1 : 0);
			}
		}

		/* The normals of the ground: of the neighbours in the patch (its edges of their nearest ones). */
		for (row = 0; row <= resolution; row++) {
			for (column = 0; column <= resolution; column++) {
				a = points[row * side + Math.max(0, column - 1)];
				b = points[row * side + Math.min(resolution, column + 1)];
				c = points[Math.max(0, row - 1) * side + column];
				point = points[Math.min(resolution, row + 1) * side + column];
				normal = graphics.Vectors.Normalize(graphics.Vectors.Cross(graphics.Vectors.Subtract(point, c), graphics.Vectors.Subtract(b, a)));

				if (graphics.Vectors.Dot(normal, points[row * side + column]) < 0)
					normal = graphics.Vectors.Scale(normal, -1);

				geometry.Normals.push(normal[0], normal[1], normal[2]);
			}
		}

		/* The faces of the cube are mirrored one to another: the triangles turned outwards on each, by the first one. */
		normal = graphics.Vectors.Cross(graphics.Vectors.Subtract(points[1], points[0]), graphics.Vectors.Subtract(points[side], points[0]));
		b = graphics.Vectors.Dot(normal, points[0]) > 0;

		for (row = 0; row < resolution; row++) {
			for (column = 0; column < resolution; column++) {
				a = row * side + column;

				if (b) geometry.Indices.push(a, a + 1, a + side, a + 1, a + side + 1, a + side);
				else geometry.Indices.push(a, a + side, a + 1, a + 1, a + side, a + side + 1);
			}
		}

		return {Geometry: geometry, Center: center};
	}
});
