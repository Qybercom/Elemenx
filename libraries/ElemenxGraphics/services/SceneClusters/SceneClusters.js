/*
 * SceneClusters: a level of detail of clusters, the way Nanite makes one, for a large model that stands alone (a tower,
 * a large model of a file): its triangles in clusters of Size (128), in the order of a Morton curve; four clusters a
 * group (more higher up), each group made simpler (its corners within a cell made one, half its triangles gone), its border kept as it
 * was so groups beside it meet it with no crack, cut into clusters again, and so on up to one. A cluster is drawn where
 * its error on the screen is under Pixels and that of its parent is not: each part of the model at one level, finer the
 * nearer, all of it one draw (Renderer mesh.Triangles). The same in a page, a worker and Node (it reads no page).
 * - Build(geometry) the clusters of a geometry ({Positions, Normals, Colors, UVs, Indices}; flat faces welded by their
 *   corners): {Positions, Normals, Colors, UVs (Float32Array: the points of all its levels, each face of the simpler ones
 *   of its own points, its UVs the mean of the corners it was made of), Indices (Uint32Array: the triangles of each cluster in turn), Clusters (Float32Array, 14 numbers a
 *   cluster: Start and Count in Indices, Level, Error, its sphere [x, y, z, radius], the Error of its parent and its
 *   sphere; a cluster with no parent Infinity), Levels, Triangles (of the finest)}.
 * - Select(built, matrix, eye, focal, pixels) the triangles to draw now (Uint32Array of indices) for the model standing as
 *   matrix ([x axis, y axis, z axis, place], 12 numbers), seen from eye (in the world), focal (pixels of the height of
 *   the screen over the tangent of half the view), pixels (the error allowed, 1 by default); {Indices, Clusters (how many
 *   drawn), Level (the coarsest drawn)}.
 * - Work(): the pool of its workers, made once.
 */
Elemenx.Service('SceneClusters', {
	$Meta: {
		Description: 'A level of detail of clusters, as Nanite makes one: groups of clusters made simpler level by level, their borders kept, each part drawn as fine as the screen needs.',
		Methods: ['Build(geometry)', 'Select(built, matrix, eye, focal, pixels)', 'Work()']
	},

	/* Triangles a cluster, at most. */
	Size: 128,

	/* What a worker carries of it besides its methods. */
	Carried: ['Size'],

	/* What fits in a word of 10 bits of each axis of a box: the place of a point on a Morton curve of it. */
	Morton: function (x, y, z) {
		function spread (v) {
			v = Math.max(0, Math.min(1023, Math.floor(v * 1023))) >>> 0;
			v = (v | v << 16) & 0x030000FF;
			v = (v | v << 8) & 0x0300F00F;
			v = (v | v << 4) & 0x030C30C3;
			v = (v | v << 2) & 0x09249249;

			return v >>> 0;
		}

		return (spread(x) | spread(y) << 1 | spread(z) << 2) >>> 0;
	},

	Work: function () {
		return this.$Service('Workers').Pool('SceneClusters', {SceneClusters: true}, 1);
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	Build: function (geometry) {
		var self = this;
		var size = this.Size;
		var positions = Array.prototype.slice.call(geometry.Positions);
		var normals = Array.prototype.slice.call(geometry.Normals || new Array(positions.length).fill(0));
		var colors = geometry.Colors && geometry.Colors.length ? Array.prototype.slice.call(geometry.Colors) : new Array(positions.length).fill(1);
		var uvs = geometry.UVs && geometry.UVs.length ? Array.prototype.slice.call(geometry.UVs) : new Array(positions.length / 3 * 2).fill(0);
		var source = geometry.Indices && geometry.Indices.length ? geometry.Indices : null;
		var welds = {};
		var weld = [];
		var box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
		var indices = [];
		var clusters = [];
		var level;
		var current;
		var i;

		/* The weld of a point: points at the same place are one (a flat face has points of its own at each corner). */
		function welded (at) {
			var key = Math.round(positions[at * 3] * 1e4) + ':' + Math.round(positions[at * 3 + 1] * 1e4) + ':' + Math.round(positions[at * 3 + 2] * 1e4);
			if (welds[key] === undefined)
				welds[key] = welded.Count = (welded.Count || 0) + 1;

			weld[at] = welds[key];

			return welds[key];
		}

		for (i = 0; i < positions.length / 3; i++) {
			welded(i);

			box[0] = Math.min(box[0], positions[i * 3]);
			box[1] = Math.min(box[1], positions[i * 3 + 1]);
			box[2] = Math.min(box[2], positions[i * 3 + 2]);
			box[3] = Math.max(box[3], positions[i * 3]);
			box[4] = Math.max(box[4], positions[i * 3 + 1]);
			box[5] = Math.max(box[5], positions[i * 3 + 2]);
		}

		var span = Math.max(box[3] - box[0], box[4] - box[1], box[5] - box[2], 1e-6);

		/* Where on the Morton curve of the box a point is. */
		function curve (x, y, z) {
			return self.Morton((x - box[0]) / span, (y - box[1]) / span, (z - box[2]) / span);
		}

		/* The middle of a triangle (three indices of points). */
		function middle (tri) {
			return [(positions[tri[0] * 3] + positions[tri[1] * 3] + positions[tri[2] * 3]) / 3, (positions[tri[0] * 3 + 1] + positions[tri[1] * 3 + 1] + positions[tri[2] * 3 + 1]) / 3, (positions[tri[0] * 3 + 2] + positions[tri[1] * 3 + 2] + positions[tri[2] * 3 + 2]) / 3];
		}

		/* The sphere round the points of triangles: [x, y, z, radius]. */
		function sphere (tris) {
			var low = [Infinity, Infinity, Infinity];
			var high = [-Infinity, -Infinity, -Infinity];
			var center;
			var radius = 0;

			tris.forEach(function (tri) {
				tri.forEach(function (at) {
					for (var a = 0; a < 3; a++) {
						low[a] = Math.min(low[a], positions[at * 3 + a]);
						high[a] = Math.max(high[a], positions[at * 3 + a]);
					}
				});
			});

			center = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];

			tris.forEach(function (tri) {
				tri.forEach(function (at) {
					radius = Math.max(radius, Math.hypot(positions[at * 3] - center[0], positions[at * 3 + 1] - center[1], positions[at * 3 + 2] - center[2]));
				});
			});

			return center.concat([radius]);
		}

		/* Triangles in clusters of size, in the order of the curve; each {Tris, Level, Error, Sphere, Parent, Up}. */
		function cut (tris, lvl, error, bounds) {
			var made = [];
			var sorted = tris.map(function (tri) {
				var m = middle(tri);

				return {Tri: tri, Key: curve(m[0], m[1], m[2])};
			}).sort(function (a, b) {
				return a.Key - b.Key;
			});
			var k;

			for (k = 0; k < sorted.length; k += size) {
				var part = sorted.slice(k, k + size).map(function (one) {
					return one.Tri;
				});

				made.push({Tris: part, Level: lvl, Error: error, Sphere: bounds || sphere(part), Parent: Infinity, Up: [0, 0, 0, 0]});
			}

			return made;
		}

		/* A new point of a simpler face: at a place, of a color and a place on its pictures (uv), its normal that of its face. */
		function point (place, color, normal, uv) {
			var at = positions.length / 3;

			positions.push(place[0], place[1], place[2]);
			normals.push(normal[0], normal[1], normal[2]);
			colors.push(color[0], color[1], color[2]);
			uvs.push(uv[0], uv[1]);

			welded(at);

			return at;
		}

		/*
		 * A group made simpler: its corners within a cell made one (their mean place and color), those of its border kept;
		 * the faces that lost a corner gone, each the same face once. The cell doubled till half its triangles are gone (or
		 * no more can go). Gives {Tris, Cell}, or null where it would not be much simpler.
		 */
		function simpler (tris, bounds, below) {
			var edges = {};
			var border = {};
			/* From a little more than the error of its clusters, at most four times it (or an eighth of the group): each level a step coarser, never all of it at once. */
			var cell = Math.max(below * 1.5, bounds[3] / 64);
			var most = Math.max(below * 4, bounds[3] / 8);
			var best = null;

			tris.forEach(function (tri) {
				[[0, 1], [1, 2], [2, 0]].forEach(function (pair) {
					var a = weld[tri[pair[0]]];
					var b = weld[tri[pair[1]]];
					var key = a < b ? a + ':' + b : b + ':' + a;

					edges[key] = (edges[key] || 0) + 1;
				});
			});

			Object.keys(edges).forEach(function (key) {
				if (edges[key] !== 1) return;

				key.split(':').forEach(function (one) {
					border[one] = true;
				});
			});

			function at (cellSize) {
				var cells = {};
				var faces = [];
				var seen = {};

				function target (corner) {
					var w = weld[corner];
					var key = border[w] ? 'b' + w : Math.round(positions[corner * 3] / cellSize) + ':' + Math.round(positions[corner * 3 + 1] / cellSize) + ':' + Math.round(positions[corner * 3 + 2] / cellSize);
					var one = cells[key];
					if (!one)
						one = cells[key] = {Sum: [0, 0, 0], Color: [0, 0, 0], UV: [0, 0], Count: 0, Fixed: border[w] ? corner : -1};

					one.Sum[0] += positions[corner * 3];
					one.Sum[1] += positions[corner * 3 + 1];
					one.Sum[2] += positions[corner * 3 + 2];
					one.Color[0] += colors[corner * 3];
					one.Color[1] += colors[corner * 3 + 1];
					one.Color[2] += colors[corner * 3 + 2];
					one.UV[0] += uvs[corner * 2];
					one.UV[1] += uvs[corner * 2 + 1];
					one.Count++;

					return key;
				}

				tris.forEach(function (tri) {
					var a = target(tri[0]);
					var b = target(tri[1]);
					var c = target(tri[2]);
					var key;

					if (a === b || b === c || a === c) return;

					key = [a, b, c].slice().sort().join('|');

					if (seen[key]) return;

					seen[key] = true;

					faces.push([a, b, c]);
				});

				return {Cells: cells, Faces: faces};
			}

			while (cell <= most) {
				best = at(cell);

				if (best.Faces.length <= tris.length * 0.55) break;

				cell *= 1.5;
			}

			if (cell > most)
				cell /= 1.5;

			if (!best || best.Faces.length > tris.length * 0.9) return null;

			/* Its error: how far a corner went to the point its cell made of it (not the cell: a flat part moves nothing). */
			var moved = 0;

			tris.forEach(function (tri) {
				tri.forEach(function (corner) {
					var w = weld[corner];
					var key = border[w] ? null : Math.round(positions[corner * 3] / cell) + ':' + Math.round(positions[corner * 3 + 1] / cell) + ':' + Math.round(positions[corner * 3 + 2] / cell);
					var one = key ? best.Cells[key] : null;
					if (one)
						moved = Math.max(moved, Math.hypot(positions[corner * 3] - one.Sum[0] / one.Count, positions[corner * 3 + 1] - one.Sum[1] / one.Count, positions[corner * 3 + 2] - one.Sum[2] / one.Count));
				});
			});

			/* Each face of points of its own: the place of a cell its mean (a point of the border where it was), its normal that of the face. */
			return {Cell: moved, Tris: best.Faces.map(function (face) {
				var places = face.map(function (key) {
					var one = best.Cells[key];

					return one.Fixed >= 0 ? [positions[one.Fixed * 3], positions[one.Fixed * 3 + 1], positions[one.Fixed * 3 + 2]] : [one.Sum[0] / one.Count, one.Sum[1] / one.Count, one.Sum[2] / one.Count];
				});
				var u = [places[1][0] - places[0][0], places[1][1] - places[0][1], places[1][2] - places[0][2]];
				var v = [places[2][0] - places[0][0], places[2][1] - places[0][1], places[2][2] - places[0][2]];
				var n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
				var length = Math.hypot(n[0], n[1], n[2]) || 1;

				n = [n[0] / length, n[1] / length, n[2] / length];

				return face.map(function (key, k) {
					var one = best.Cells[key];

					return point(places[k], [one.Color[0] / one.Count, one.Color[1] / one.Count, one.Color[2] / one.Count], n, one.Fixed >= 0 ? [uvs[one.Fixed * 2], uvs[one.Fixed * 2 + 1]] : [one.UV[0] / one.Count, one.UV[1] / one.Count]);
				});
			})};
		}

		/* The finest level: the triangles of the geometry. */
		var finest = [];

		for (i = 0; i < (source ? source.length : positions.length / 3); i += 3)
			finest.push(source ? [source[i], source[i + 1], source[i + 2]] : [i, i + 1, i + 2]);

		current = cut(finest, 0, 0, null);
		level = 0;

		while (current.length > 1) {
			var next = [];
			var progress = false;
			var order = current.map(function (one) {
				return {One: one, Key: curve(one.Sphere[0], one.Sphere[1], one.Sphere[2])};
			}).sort(function (a, b) {
				return a.Key - b.Key;
			}).map(function (each) {
				return each.One;
			});
			var g;

			level++;

			/*
			 * Four clusters a group at first, more higher up: its border (kept as it was) is less of a larger group, and a group
			 * of large faces whose corners are nearly all on its border could not be made simpler.
			 */
			var many = Math.min(16, 4 * Math.pow(2, Math.max(0, level - 2)));

			for (g = 0; g < order.length; g += many) {
				var group = order.slice(g, g + many);
				var tris = [].concat.apply([], group.map(function (one) {
					return one.Tris;
				}));
				var bounds = sphere(tris);
				var made = group.length > 1 ? simpler(tris, bounds, Math.max.apply(null, group.map(function (one) {
					return one.Error;
				}))) : null;
				var error;

				/*
				 * Not much simpler (its border, kept as it was, is too much of it): its clusters go up as they are, into a
				 * larger group of the next level, as Nanite does.
				 */
				if (!made) {
					next = next.concat(group);

					continue;
				}

				clusters = clusters.concat(group);
				progress = true;

				error = Math.max(made.Cell, Math.max.apply(null, group.map(function (one) {
					return one.Error;
				})));

				group.forEach(function (one) {
					one.Parent = error;
					one.Up = bounds;
				});

				next = next.concat(cut(made.Tris, level, error, bounds));
			}

			current = next;

			/* Nothing of a level made simpler: what is left stays as it is. */
			if (!progress) break;
		}

		clusters = clusters.concat(current);

		/* The triangles of each cluster in turn, and the numbers of each. */
		var table = new Float32Array(clusters.length * 14);

		clusters.forEach(function (one, k) {
			var start = indices.length;

			one.Tris.forEach(function (tri) {
				indices.push(tri[0], tri[1], tri[2]);
			});

			table.set([start, indices.length - start, one.Level, one.Error].concat(one.Sphere, [one.Parent === Infinity ? 3.4e38 : one.Parent], one.Up, [0]), k * 14);
		});

		return {Positions: new Float32Array(positions), Normals: new Float32Array(normals), Colors: new Float32Array(colors), UVs: new Float32Array(uvs), Indices: new Uint32Array(indices), Clusters: table, Levels: level + 1, Triangles: finest.length};
	},

	Select: function (built, matrix, eye, focal, pixels) {
		var table = built.Clusters;
		var limit = pixels === undefined ? 1 : Number(pixels);
		var m = matrix;
		var scale = Math.max(Math.hypot(m[0], m[1], m[2]), Math.hypot(m[3], m[4], m[5]), Math.hypot(m[6], m[7], m[8]));
		var parts = [];
		var count = 0;
		var coarsest = 0;
		var drawn = 0;
		var k;

		/* The error of a sphere on the screen: as large as it is over how far its nearest point is. */
		function seen (error, x, y, z, r) {
			var wx = m[9] + m[0] * x + m[3] * y + m[6] * z;
			var wy = m[10] + m[1] * x + m[4] * y + m[7] * z;
			var wz = m[11] + m[2] * x + m[5] * y + m[8] * z;
			var far = Math.max(1e-3, Math.hypot(wx - eye[0], wy - eye[1], wz - eye[2]) - r * scale);

			return error * scale * focal / far;
		}

		for (k = 0; k < table.length; k += 14) {
			if (seen(table[k + 3], table[k + 4], table[k + 5], table[k + 6], table[k + 7]) > limit) continue;

			if (table[k + 8] < 3e38 && seen(table[k + 8], table[k + 9], table[k + 10], table[k + 11], table[k + 12]) <= limit) continue;

			parts.push(k);

			count += table[k + 1];
			coarsest = Math.max(coarsest, table[k + 2]);
			drawn++;
		}

		var out = new Uint32Array(count);
		var at = 0;

		parts.forEach(function (k2) {
			out.set(built.Indices.subarray(table[k2], table[k2] + table[k2 + 1]), at);

			at += table[k2 + 1];
		});

		return {Indices: out, Clusters: drawn, Level: coarsest};
	}
});
