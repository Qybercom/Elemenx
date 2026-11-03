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
 *   options Step, the finest it looks, MaxSlope, Swim). Palette gives it the colors of a biome; Roads ([[x, z]...]) set
 *   on a field are painted on it, and OnRoad(field, x, z, width) tells whether a point is on one.
 * - Sphere(options) returns the ground of a planet, the very one its baked surface shows (the noise of Graphics3D, as
 *   the shader of a GameScene bakes it): options Radius (units), Height (its relief), Seed (the number of its pattern),
 *   Ocean (0 to 1), Type (rocky, desert, terran, ocean, ice, lava, dwarf, moon). Its methods: Land(direction) (the
 *   ground of the noise: below 0 the sea), Elevation(direction) (above the radius), Point(direction) (on the ground),
 *   Altitude(point) (above the ground under it), Patch(face, u, v, size, resolution) (a geometry of a square of a face
 *   of its cube, from u and v of -1 to 1, its positions relative to its Center, the land in UV.x, the sea in UV.y).
 * - Cells(options) returns the flat ground of a map of cells, a mesh of one piece: options Width, Height (in cells),
 *   Depth (the length of a cell along Z, 1), Color(x, y) ([r, g, b], 0 to 1, of a cell); it has the methods of Flat, and
 *   Whole and Center (the middle of the map: X from 0 to Width, Z from 0 to Height * Depth).
 * - Work(): the workers of the ground (Workers.Pool), that run Piece and Grid off the main thread.
 * - Piece(shape, options, roads, args): a square of a ground of a shape (Flat or Sphere) of its options, as a worker
 *   makes it: of Flat, args [x, z, size, resolution] and the geometry of Chunk; of Sphere, args [face, u, v, size,
 *   resolution] and {Geometry, Center} of Patch; its lists of numbers Float32Array and Uint32Array. A field of Flat or
 *   Sphere keeps its options (Options) for it; Field(shape, options) makes it once for the same options.
 * - Grid(options, side, top, steep): the heights of a flat ground of its options over all its size, side by side
 *   points, four numbers each (a Float32Array): the height, and 1 where it is over 1 and under top and its slope under
 *   steep (where grass grows), 0 elsewhere.
 * - Heights(field, side): the heights of a flat field in a grid of side by side points over all its size (a
 *   Float32Array, row by row along Z); FromGrid(options, heights, side) a field of Flat whose heights are such a grid (a
 *   field baked or painted; out of the grid, of its noise): it has Grid and Side, and no Options.
 * - Source(names): the source of its members, for a worker.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Terrain', {
	$Meta: {
		Description: 'The ground of a game, continuous: heights of noise anywhere, meshes in chunks, ways over it; the ground of a planet as its surface shows.',
		Methods: ['Flat(options)', 'Sphere(options)', 'Cells(options)', 'OnRoad(field, x, z, width)', 'Work()', 'Piece(shape, options, roads, args)', 'Field(shape, options)', 'Grid(options, side, top, steep)', 'Heights(field, side)', 'FromGrid(options, heights, side)', 'Source(names)']
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
			Options: settings,
			Size: size,
			Top: height,
			Water: water,
			Palette: settings.Palette || null,
			Roads: null,

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

	Cells: function (options) {
		var graphics = this.$Service('Graphics3D');
		var settings = options || {};
		var width = Math.max(1, Math.floor(Number(settings.Width) || 1));
		var height = Math.max(1, Math.floor(Number(settings.Height) || 1));
		var depth = Number(settings.Depth) || 1;
		var center = [width / 2, 0, height * depth / 2];

		return {
			Size: Math.max(width, height * depth),
			Top: 1,
			Water: 0,
			Whole: true,
			Center: center,

			Height: function () {
				return 0;
			},

			Normal: function () {
				return [0, 1, 0];
			},

			Slope: function () {
				return 0;
			},

			Walkable: function () {
				return true;
			},

			Chunk: function () {
				var geometry = graphics.Geometry();
				var x;
				var y;

				for (y = 0; y < height; y++) {
					for (x = 0; x < width; x++) {
						var color = settings.Color ? settings.Color(x, y) : [0.36, 0.6, 0.24];
						var base = geometry.Positions.length / 3;
						var left = x - center[0];
						var top = y * depth - center[2];

						geometry.Positions.push(left, 0, top, left, 0, top + depth, left + 1, 0, top + depth, left + 1, 0, top);
						geometry.Normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
						geometry.UVs.push(0, 0, 0, 1, 1, 1, 1, 0);
						geometry.Colors.push(color[0], color[1], color[2], color[0], color[1], color[2], color[0], color[1], color[2], color[0], color[1], color[2]);
						geometry.Indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
					}
				}

				return geometry;
			}
		};
	},

	/* The colors of the ground of a flat map: sand by the sea, grass, rock on the slopes, snow on the heights. */
	Paint: function (field, x, z, y, slope) {
		var palette = field.Palette || {};
		var high = y / Math.max(1, field.Top);
		var low = palette.Low || [0.3, 0.5, 0.22];
		var upper = palette.High || [0.39, 0.43, 0.25];
		var color;

		if (y < -0.5) color = palette.Deep || [0.2, 0.26, 0.3];
		else if (y < 1.2) color = palette.Sand || [0.76, 0.7, 0.52];
		else if (high < 0.45) color = [low[0] + (upper[0] - low[0]) * high / 0.45, low[1] + (upper[1] - low[1]) * high / 0.45, low[2] + (upper[2] - low[2]) * high / 0.45];
		else if (high < 0.75) color = palette.Rock || [0.45, 0.42, 0.36];
		else color = palette.Snow || [0.93, 0.94, 0.96];

		if (slope > 0.32 && y > 1.2)
			color = palette.Rock || [0.42, 0.39, 0.35];

		if (field.Roads && this.OnRoad(field, x, z, 1.8))
			color = palette.Road || [0.5, 0.42, 0.32];

		return color;
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

	Work: function () {
		return this.$Service('Workers').Pool('Terrain', {Graphics3D: ['Noise', 'SeedOffset', 'Vectors'], Terrain: ['Smoothstep', 'Flat', 'Sphere', 'Paint', 'OnRoad', 'Mesh', 'Face', 'SpherePatch', 'Field', 'Piece', 'Grid']});
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

	Field: function (shape, options) {
		var fields = this.Fields = this.Fields || {};
		var key = shape + JSON.stringify(options);

		fields[key] = fields[key] || this[shape](options);

		return fields[key];
	},

	Piece: function (shape, options, roads, args) {
		var field = this.Field(shape, options);
		var made;

		function typed (geometry) {
			return {Positions: new Float32Array(geometry.Positions), Normals: new Float32Array(geometry.Normals), UVs: new Float32Array(geometry.UVs), Colors: new Float32Array(geometry.Colors || []), Indices: new Uint32Array(geometry.Indices)};
		}

		if (shape === 'Sphere') {
			made = field.Patch(args[0], args[1], args[2], args[3], args[4]);

			return {Geometry: typed(made.Geometry), Center: made.Center};
		}

		field.Roads = roads || null;

		return typed(field.Chunk(args[0], args[1], args[2], args[3]));
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
				data[at + 1] = height > 1 && height < top && field.Slope(x, z) < steep ? 1 : 0;
			}
		}

		return data;
	},

	/* What a worker of the ground carries: see Workers. */
	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
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
