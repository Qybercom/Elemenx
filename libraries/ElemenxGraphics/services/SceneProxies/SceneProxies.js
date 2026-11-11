/*
 * SceneProxies: what stands far away, many things as one simpler shape (a proxy of a tile, the way Voxy for Minecraft
 * draws its far land): the copies of shapes in a square of the world merged into one geometry, each corner snapped to a
 * grid of a cell as large as the square is far (Cell), the corners of a cell made one, the faces that lost a corner
 * gone. A thing too small for its cell would so be gone too (a far forest of nothing): it is a small body of its size
 * and of the color of its upper part (a crown, a roof) instead. The same in a page, a worker and Node (it reads no page).
 * - Shape(geometry) the data of a shape a proxy is made of, made once ({Positions, Colors, Indices} as Float32Array and
 *   Uint32Array; Box [minX, minY, minZ, maxX, maxY, maxZ]; Radius, round its origin; Color, of its upper part).
 * - Merge(job) the proxy of a tile: job {Shapes ({key: a Shape, or the name a worker keeps it under by Share of
 *   Workers}), Lists ([{Shape (its key), Places, Extra (Float32Array, four numbers a copy: x, y, z, size; turn round
 *   the up, then the tint r, g, b, as the Scatter of a Scene keeps them), or Matrices (12 a copy: its x, y and z axes
 *   and its place, turned any way, as a model of the scene stands) and Tints (3 a copy), Count}]), Origin ([x, y, z]: the positions are
 *   relative to it, exact in floats), Cell (the size of the grid)}. It gives {Positions, Normals, Colors (Float32Array,
 *   three numbers a vertex, each face of its own vertices: flat), Triangles, Copies, Bodies (the copies made small
 *   bodies)}.
 * - Pack(made) a proxy made small to be kept (SceneCache): {Positions (Int16Array, of the box of the proxy), Box, Colors
 *   (Uint8Array, a quarter of a step a unit: colors up to 4, a lit window over 1), Triangles}, a quarter of its size; no
 *   normals. Unpack(packed) the proxy again, its normals of its faces (it is flat): what Merge gave, to a centimetre.
 * - Work(): the pool of its workers, made once.
 */
Elemenx.Service('SceneProxies', {
	$Meta: {
		Description: 'What stands far away as one simpler shape: the copies of a tile merged and snapped to a grid, small things as small bodies.',
		Methods: ['Shape(geometry)', 'Merge(job)', 'Pack(made)', 'Unpack(packed)', 'Work()']
	},

	Work: function () {
		return this.$Service('Workers').Pool('SceneProxies', {SceneProxies: true}, 2);
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	Shape: function (geometry) {
		var p = geometry.Positions;
		var c = geometry.Colors || [];
		var count = p.length / 3;
		var positions = new Float32Array(p.length);
		var colors = new Float32Array(p.length);
		var indices = new Uint32Array(geometry.Indices.length);
		var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
		var color = [0, 0, 0];
		var radius = 0;
		var upper = 0;
		var line;
		var i;
		var j;

		for (i = 0; i < count; i++) {
			for (j = 0; j < 3; j++) {
				positions[i * 3 + j] = p[i * 3 + j];
				colors[i * 3 + j] = c[i * 3 + j] === undefined ? 1 : c[i * 3 + j];
				box[j] = Math.min(box[j], p[i * 3 + j]);
				box[j + 3] = Math.max(box[j + 3], p[i * 3 + j]);
			}

			radius = Math.max(radius, p[i * 3] * p[i * 3] + p[i * 3 + 1] * p[i * 3 + 1] + p[i * 3 + 2] * p[i * 3 + 2]);
		}

		for (i = 0; i < geometry.Indices.length; i++)
			indices[i] = geometry.Indices[i];

		/* The color of what is seen of it from far: its upper part (the crown of a tree, the roof and walls of a house, no trunk). */
		line = box[1] + (box[4] - box[1]) * 0.35;

		for (i = 0; i < count; i++) {
			if (positions[i * 3 + 1] < line) continue;

			color[0] += colors[i * 3];
			color[1] += colors[i * 3 + 1];
			color[2] += colors[i * 3 + 2];
			upper++;
		}

		return {Positions: positions, Colors: colors, Indices: indices, Box: count ? box : [0, 0, 0, 0, 0, 0], Radius: Math.sqrt(radius), Color: upper ? [color[0] / upper, color[1] / upper, color[2] / upper] : [1, 1, 1]};
	},

	Merge: function (job) {
		var shapes = typeof job.Shapes === 'string' ? this.$Shared(job.Shapes) : job.Shapes;
		var origin = job.Origin || [0, 0, 0];
		var cell = Math.max(1e-3, Number(job.Cell) || 1);
		var grid = {};
		var corners = [];
		var faces = [];
		var seen = {};
		var bodies = [];
		var copies = 0;
		var lists = job.Lists || [];
		var l;
		var i;

		/* A corner of a copy into its cell: its index there, the sum of what fell into it. */
		function snap (x, y, z, r, g, b) {
			var key = Math.round(x / cell) + ':' + Math.round(y / cell) + ':' + Math.round(z / cell);
			var at = grid[key];

			if (at === undefined) {
				at = grid[key] = corners.length / 7;

				corners.push(0, 0, 0, 0, 0, 0, 0);
			}

			corners[at * 7] += x;
			corners[at * 7 + 1] += y;
			corners[at * 7 + 2] += z;
			corners[at * 7 + 3] += r;
			corners[at * 7 + 4] += g;
			corners[at * 7 + 5] += b;
			corners[at * 7 + 6]++;

			return at;
		}

		for (l = 0; l < lists.length; l++) {
			var list = lists[l];
			/* A shape a worker keeps by Share comes by its name. */
			var shape = typeof shapes[list.Shape] === 'string' ? this.$Shared(shapes[list.Shape]) : shapes[list.Shape];
			var copy;

			if (!shape) continue;

			for (copy = 0; copy < list.Count; copy++) {
				var place = this.Placed(list, copy, origin);
				var m = place.Matrix;
				var tint = place.Tint;
				var map;
				var v;
				var px;
				var py;
				var pz;

				copies++;

				/*
				 * Smaller than four cells: a small body, else it would be gone, or so thin (its corners snapped to the means of
				 * a few cells, all inward) that a far forest is a lawn.
				 */
				if (shape.Radius * place.Scale < cell * 4) {
					bodies.push({Matrix: m, Shape: shape, Tint: tint});

					continue;
				}

				map = new Array(shape.Positions.length / 3);

				for (v = 0; v < map.length; v++) {
					px = shape.Positions[v * 3];
					py = shape.Positions[v * 3 + 1];
					pz = shape.Positions[v * 3 + 2];

					map[v] = snap(m[9] + m[0] * px + m[3] * py + m[6] * pz, m[10] + m[1] * px + m[4] * py + m[7] * pz, m[11] + m[2] * px + m[5] * py + m[8] * pz, shape.Colors[v * 3] * tint[0], shape.Colors[v * 3 + 1] * tint[1], shape.Colors[v * 3 + 2] * tint[2]);
				}

				for (i = 0; i < shape.Indices.length; i += 3) {
					var a = map[shape.Indices[i]];
					var b = map[shape.Indices[i + 1]];
					var d = map[shape.Indices[i + 2]];
					var key;

					if (a === b || b === d || a === d) continue;

					/* The same face twice (two copies that met in the same cells): once. */
					key = a < b ? a < d ? a + ':' + b + ':' + d : d + ':' + a + ':' + b : b < d ? b + ':' + d + ':' + a : d + ':' + a + ':' + b;

					if (seen[key]) continue;

					seen[key] = true;

					faces.push(a, b, d);
				}
			}
		}

		return Object.assign(this.Faces(corners, faces, bodies), {Copies: copies});
	},

	Pack: function (made) {
		var p = made.Positions;
		var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
		var positions = new Int16Array(p.length);
		var colors = new Uint8Array(made.Colors.length);
		var i;
		var axis;

		for (i = 0; i < p.length; i++) {
			axis = i % 3;
			box[axis] = Math.min(box[axis], p[i]);
			box[axis + 3] = Math.max(box[axis + 3], p[i]);
		}

		for (i = 0; i < p.length; i++) {
			axis = i % 3;
			positions[i] = Math.round(((p[i] - box[axis]) / Math.max(1e-6, box[axis + 3] - box[axis])) * 65535) - 32768;
		}

		for (i = 0; i < colors.length; i++)
			colors[i] = Math.max(0, Math.min(255, Math.round(made.Colors[i] * 63.75)));

		return {Positions: positions, Box: p.length ? box : [0, 0, 0, 0, 0, 0], Colors: colors, Triangles: made.Triangles};
	},

	Unpack: function (packed) {
		var q = packed.Positions;
		var box = packed.Box;
		var positions = new Float32Array(q.length);
		var normals = new Float32Array(q.length);
		var colors = new Float32Array(packed.Colors.length);
		var i;
		var axis;
		var ux;
		var uy;
		var uz;
		var vx;
		var vy;
		var vz;
		var nx;
		var ny;
		var nz;
		var length;

		for (i = 0; i < q.length; i++) {
			axis = i % 3;
			positions[i] = box[axis] + (q[i] + 32768) / 65535 * (box[axis + 3] - box[axis]);
		}

		for (i = 0; i < colors.length; i++)
			colors[i] = packed.Colors[i] / 63.75;

		/* Each face flat: its normal of its corners, for all three. */
		for (i = 0; i < positions.length; i += 9) {
			ux = positions[i + 3] - positions[i];
			uy = positions[i + 4] - positions[i + 1];
			uz = positions[i + 5] - positions[i + 2];
			vx = positions[i + 6] - positions[i];
			vy = positions[i + 7] - positions[i + 1];
			vz = positions[i + 8] - positions[i + 2];
			nx = uy * vz - uz * vy;
			ny = uz * vx - ux * vz;
			nz = ux * vy - uy * vx;
			length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

			for (axis = 0; axis < 9; axis += 3) {
				normals[i + axis] = nx / length;
				normals[i + axis + 1] = ny / length;
				normals[i + axis + 2] = nz / length;
			}
		}

		return {Positions: positions, Normals: normals, Colors: colors, Triangles: packed.Triangles};
	},

	/*
	 * Where a copy of a list stands, relative to the origin: Matrix [x axis, y axis, z axis, place] (12 numbers), Scale (its
	 * largest axis), Tint. A list of the Scatter (Places, Extra) is turned round the up as its shader turns it; a list of
	 * Matrices (12 numbers a copy, as Matrix) and Tints (3 a copy, or none: white) stands as it is told, turned any way.
	 */
	Placed: function (list, copy, origin) {
		var m;
		var size;
		var cos;
		var sin;

		if (list.Matrices) {
			m = Array.prototype.slice.call(list.Matrices, copy * 12, copy * 12 + 12);
			m[9] -= origin[0];
			m[10] -= origin[1];
			m[11] -= origin[2];

			return {Matrix: m, Scale: Math.max(Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]), Math.sqrt(m[3] * m[3] + m[4] * m[4] + m[5] * m[5]), Math.sqrt(m[6] * m[6] + m[7] * m[7] + m[8] * m[8])), Tint: list.Tints ? [list.Tints[copy * 3], list.Tints[copy * 3 + 1], list.Tints[copy * 3 + 2]] : [1, 1, 1]};
		}

		size = list.Places[copy * 4 + 3];
		cos = Math.cos(list.Extra[copy * 4]);
		sin = Math.sin(list.Extra[copy * 4]);

		return {Matrix: [cos * size, 0, -sin * size, 0, size, 0, sin * size, 0, cos * size, list.Places[copy * 4] - origin[0], list.Places[copy * 4 + 1] - origin[1], list.Places[copy * 4 + 2] - origin[2]], Scale: size, Tint: [list.Extra[copy * 4 + 1], list.Extra[copy * 4 + 2], list.Extra[copy * 4 + 3]]};
	},

	/* The corners made the means of what fell into them, each face flat of its own vertices; the small bodies after them. */
	Faces: function (corners, faces, bodies) {
		var triangles = faces.length / 3 + bodies.length * 16;
		var positions = new Float32Array(triangles * 9);
		var normals = new Float32Array(triangles * 9);
		var colors = new Float32Array(triangles * 9);
		var at = 0;
		var i;

		function face (a, b, c, color) {
			var ux = b[0] - a[0];
			var uy = b[1] - a[1];
			var uz = b[2] - a[2];
			var vx = c[0] - a[0];
			var vy = c[1] - a[1];
			var vz = c[2] - a[2];
			var nx = uy * vz - uz * vy;
			var ny = uz * vx - ux * vz;
			var nz = ux * vy - uy * vx;
			var length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
			var k;
			var j;

			for (k = 0; k < 3; k++) {
				var point = k === 0 ? a : k === 1 ? b : c;
				var tone = color.length > 3 ? color.slice(k * 3, k * 3 + 3) : color;

				for (j = 0; j < 3; j++) {
					positions[at + j] = point[j];
					normals[at + j] = [nx, ny, nz][j] / length;
					colors[at + j] = tone[j];
				}

				at += 3;
			}
		}

		function corner (index) {
			var count = corners[index * 7 + 6];

			return [corners[index * 7] / count, corners[index * 7 + 1] / count, corners[index * 7 + 2] / count];
		}

		function tone (index) {
			var count = corners[index * 7 + 6];

			return [corners[index * 7 + 3] / count, corners[index * 7 + 4] / count, corners[index * 7 + 5] / count];
		}

		for (i = 0; i < faces.length; i += 3)
			face(corner(faces[i]), corner(faces[i + 1]), corner(faces[i + 2]), tone(faces[i]).concat(tone(faces[i + 1]), tone(faces[i + 2])));

		/*
		 * A small body: sixteen faces round the box of its shape (as large and turned as the copy), two rings of four between
		 * a point under it and one over it, about as much of the screen as a crown or a roof; of the color of its upper part,
		 * a little darker (Shade): the shade within a crown that a body of one color has not.
		 */
		bodies.forEach(function (body) {
			var box = body.Shape.Box;
			var shade = 0.8;
			var color = [body.Shape.Color[0] * body.Tint[0] * shade, body.Shape.Color[1] * body.Tint[1] * shade, body.Shape.Color[2] * body.Tint[2] * shade];
			var mx = (box[0] + box[3]) / 2;
			var mz = (box[2] + box[5]) / 2;
			var rx = (box[3] - box[0]) / 2;
			var rz = (box[5] - box[2]) / 2;
			var high = box[4] - box[1];

			function point (px, py, pz) {
				var m = body.Matrix;

				return [m[9] + m[0] * px + m[3] * py + m[6] * pz, m[10] + m[1] * px + m[4] * py + m[7] * pz, m[11] + m[2] * px + m[5] * py + m[8] * pz];
			}

			function ring (height) {
				var y = box[1] + high * height;

				return [point(mx + rx, y, mz), point(mx, y, mz + rz), point(mx - rx, y, mz), point(mx, y, mz - rz)];
			}

			var top = point(mx, box[4], mz);
			var bottom = point(mx, box[1] + high * 0.15, mz);
			var up = ring(0.8);
			var low = ring(0.45);
			var k;
			var next;

			for (k = 0; k < 4; k++) {
				next = (k + 1) % 4;

				face(up[next], up[k], top, color);
				face(low[next], low[k], up[k], color);
				face(low[next], up[k], up[next], color);
				face(low[k], low[next], bottom, color);
			}
		});

		return {Positions: positions, Normals: normals, Colors: colors, Triangles: triangles, Copies: 0, Bodies: bodies.length};
	}
});
