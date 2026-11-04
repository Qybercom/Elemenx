/*
 * Meshes: the shapes of three dimensions made of triangles, the same in a page, a worker and Node (they read no
 * page): what Renderer draws, what a model is built of.
 * - Geometry() is an empty one; a geometry is {Positions, Normals, UVs, Colors, Indices} (flat arrays: 3, 3, 2 and 3 numbers a vertex): Sphere({Radius,
 *   Segments, Rings}), Icosphere({Radius, Detail}), Ring({Inner, Outer, Segments}) (flat, round the axis Y), Box({Width,
 *   Height, Depth}), Cylinder({Radius, Top, Height, Segments, Caps}) (a cone when Top is 0), Torus({Radius, Tube,
 *   Segments, Sides}), Plane({Width, Depth, Segments}), Lathe({Points: [[radius, y]...], Segments}) (a line turned round
 *   the axis Y), Wedge({Width, Height, Depth}) (a roof of two slopes); Transform(geometry, matrix), Merge(parts) (each a
 *   geometry or {Geometry, Matrix, Color}), Displace(geometry, amount) (each vertex moved along its normal by
 *   amount(position, normal)), Normals(geometry) (made again from the faces), Facets(geometry) (each face flat, of
 *   vertices of its own), Simplify(geometry, cell) (the corners within a cell of a grid made one, for a simpler level).
 */
Elemenx.Service('Meshes', {
	$Meta: {
		Description: 'The shapes of three dimensions made of triangles: spheres, boxes, cylinders, lathes and the rest, moved, merged and simplified.',
		Methods: ['Geometry()', 'Sphere(options)', 'Icosphere(options)', 'Ring(options)', 'Box(options)', 'Cylinder(options)', 'Torus(options)', 'Plane(options)', 'Lathe(options)', 'Wedge(options)', 'Transform(geometry, matrix)', 'Merge(parts)', 'Displace(geometry, amount)', 'Normals(geometry)', 'Facets(geometry)', 'Simplify(geometry, cell)']
	},

	/* Shapes: flat arrays of the vertices and of the triangles (three indices each, counterclockwise from outside). */
	Geometry: function () {
		return {Positions: [], Normals: [], UVs: [], Colors: [], Indices: []};
	},

	Sphere: function (options) {
		var settings = options || {};
		var radius = settings.Radius || 1;
		var segments = Math.max(3, settings.Segments || 48);
		var rings = Math.max(2, settings.Rings || 32);
		var geometry = this.Geometry();
		var ring;
		var segment;
		var theta;
		var phi;
		var x;
		var y;
		var z;
		var a;
		var b;

		for (ring = 0; ring <= rings; ring++) {
			theta = ring / rings * Math.PI;

			for (segment = 0; segment <= segments; segment++) {
				phi = segment / segments * Math.PI * 2;
				x = -Math.cos(phi) * Math.sin(theta);
				y = Math.cos(theta);
				z = Math.sin(phi) * Math.sin(theta);

				geometry.Positions.push(x * radius, y * radius, z * radius);
				geometry.Normals.push(x, y, z);
				geometry.UVs.push(segment / segments, 1 - ring / rings);
			}
		}

		for (ring = 0; ring < rings; ring++) {
			for (segment = 0; segment < segments; segment++) {
				a = ring * (segments + 1) + segment;
				b = a + segments + 1;

				if (ring !== 0)
					geometry.Indices.push(a, b, a + 1);

				if (ring !== rings - 1)
					geometry.Indices.push(a + 1, b, b + 1);
			}
		}

		return geometry;
	},

	Icosphere: function (options) {
		var settings = options || {};
		var radius = settings.Radius || 1;
		var detail = Math.max(0, Math.min(5, settings.Detail === undefined ? 1 : settings.Detail));
		var t = (1 + Math.sqrt(5)) / 2;
		var points = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
		var faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
		var middles = {};
		var vectors = this.$Service('Math').Vectors;
		var geometry = this.Geometry();
		var level;

		points = points.map(function (point) {
			return vectors.Normalize(point);
		});

		/* The point in the middle of an edge, on the ball, made once for both of its triangles. */
		function middle (a, b) {
			var key = a < b ? a + ':' + b : b + ':' + a;
			if (middles[key] !== undefined) return middles[key];

			points.push(vectors.Normalize(vectors.Scale(vectors.Add(points[a], points[b]), 0.5)));

			middles[key] = points.length - 1;

			return middles[key];
		}

		for (level = 0; level < detail; level++) {
			faces = faces.reduce(function (list, face) {
				var ab = middle(face[0], face[1]);
				var bc = middle(face[1], face[2]);
				var ca = middle(face[2], face[0]);

				list.push([face[0], ab, ca], [face[1], bc, ab], [face[2], ca, bc], [ab, bc, ca]);

				return list;
			}, []);
		}

		points.forEach(function (point) {
			geometry.Positions.push(point[0] * radius, point[1] * radius, point[2] * radius);
			geometry.Normals.push(point[0], point[1], point[2]);
			geometry.UVs.push(0.5 + Math.atan2(point[2], point[0]) / (Math.PI * 2), 0.5 + Math.asin(point[1]) / Math.PI);
		});

		faces.forEach(function (face) {
			geometry.Indices.push(face[0], face[1], face[2]);
		});

		return geometry;
	},

	Ring: function (options) {
		var settings = options || {};
		var inner = settings.Inner === undefined ? 0.5 : settings.Inner;
		var outer = settings.Outer || 1;
		var segments = Math.max(3, settings.Segments || 96);
		var geometry = this.Geometry();
		var segment;
		var angle;
		var a;

		for (segment = 0; segment <= segments; segment++) {
			angle = segment / segments * Math.PI * 2;

			geometry.Positions.push(Math.cos(angle) * inner, 0, -Math.sin(angle) * inner, Math.cos(angle) * outer, 0, -Math.sin(angle) * outer);
			geometry.Normals.push(0, 1, 0, 0, 1, 0);
			geometry.UVs.push(0, segment / segments, 1, segment / segments);
		}

		for (segment = 0; segment < segments; segment++) {
			a = segment * 2;

			geometry.Indices.push(a, a + 1, a + 3, a, a + 3, a + 2);
		}

		return geometry;
	},

	Box: function (options) {
		var settings = options || {};
		var x = (settings.Width || 1) / 2;
		var y = (settings.Height || 1) / 2;
		var z = (settings.Depth || 1) / 2;
		var geometry = this.Geometry();
		var sides = [
			{Normal: [1, 0, 0], Corners: [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]},
			{Normal: [-1, 0, 0], Corners: [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]},
			{Normal: [0, 1, 0], Corners: [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]},
			{Normal: [0, -1, 0], Corners: [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]},
			{Normal: [0, 0, 1], Corners: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]},
			{Normal: [0, 0, -1], Corners: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]}
		];

		sides.forEach(function (side, index) {
			var base = index * 4;

			side.Corners.forEach(function (corner, at) {
				geometry.Positions.push(corner[0], corner[1], corner[2]);
				geometry.Normals.push(side.Normal[0], side.Normal[1], side.Normal[2]);
				geometry.UVs.push(at === 1 || at === 2 ? 1 : 0, at > 1 ? 1 : 0);
			});

			geometry.Indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
		});

		return geometry;
	},

	Cylinder: function (options) {
		var settings = options || {};
		var bottom = settings.Radius === undefined ? 0.5 : settings.Radius;
		var top = settings.Top === undefined ? bottom : settings.Top;
		var height = settings.Height || 1;
		var segments = Math.max(3, settings.Segments || 24);
		var geometry = this.Geometry();
		var slope = (bottom - top) / height;
		var segment;
		var angle;
		var x;
		var z;
		var length;
		var base;

		for (segment = 0; segment <= segments; segment++) {
			angle = segment / segments * Math.PI * 2;
			x = Math.cos(angle);
			z = -Math.sin(angle);
			length = Math.sqrt(1 + slope * slope);

			geometry.Positions.push(x * bottom, -height / 2, z * bottom, x * top, height / 2, z * top);
			geometry.Normals.push(x / length, slope / length, z / length, x / length, slope / length, z / length);
			geometry.UVs.push(segment / segments, 0, segment / segments, 1);
		}

		for (segment = 0; segment < segments; segment++) {
			base = segment * 2;

			geometry.Indices.push(base, base + 2, base + 3, base, base + 3, base + 1);
		}

		/* The caps: a fan round the middle of each end. */
		if (settings.Caps !== false) {
			[{Y: -height / 2, Radius: bottom, Normal: -1}, {Y: height / 2, Radius: top, Normal: 1}].forEach(function (cap) {
				var center = geometry.Positions.length / 3;
				var at;

				if (!cap.Radius) return;

				geometry.Positions.push(0, cap.Y, 0);
				geometry.Normals.push(0, cap.Normal, 0);
				geometry.UVs.push(0.5, 0.5);

				for (at = 0; at <= segments; at++) {
					angle = at / segments * Math.PI * 2;

					geometry.Positions.push(Math.cos(angle) * cap.Radius, cap.Y, -Math.sin(angle) * cap.Radius);
					geometry.Normals.push(0, cap.Normal, 0);
					geometry.UVs.push(0.5 + Math.cos(angle) / 2, 0.5 + Math.sin(angle) / 2);
				}

				for (at = 0; at < segments; at++) {
					if (cap.Normal > 0) geometry.Indices.push(center, center + 1 + at, center + 2 + at);
					else geometry.Indices.push(center, center + 2 + at, center + 1 + at);
				}
			});
		}

		return geometry;
	},

	Torus: function (options) {
		var settings = options || {};
		var radius = settings.Radius || 1;
		var tube = settings.Tube || 0.25;
		var segments = Math.max(3, settings.Segments || 48);
		var sides = Math.max(3, settings.Sides || 12);
		var geometry = this.Geometry();
		var segment;
		var side;
		var u;
		var v;
		var a;
		var b;

		for (segment = 0; segment <= segments; segment++) {
			u = segment / segments * Math.PI * 2;

			for (side = 0; side <= sides; side++) {
				v = side / sides * Math.PI * 2;

				geometry.Positions.push((radius + tube * Math.cos(v)) * Math.cos(u), tube * Math.sin(v), -(radius + tube * Math.cos(v)) * Math.sin(u));
				geometry.Normals.push(Math.cos(v) * Math.cos(u), Math.sin(v), -Math.cos(v) * Math.sin(u));
				geometry.UVs.push(segment / segments, side / sides);
			}
		}

		for (segment = 0; segment < segments; segment++) {
			for (side = 0; side < sides; side++) {
				a = segment * (sides + 1) + side;
				b = a + sides + 1;

				geometry.Indices.push(a, b, a + 1, a + 1, b, b + 1);
			}
		}

		return geometry;
	},

	Plane: function (options) {
		var settings = options || {};
		var width = settings.Width || 1;
		var depth = settings.Depth || width;
		var segments = Math.max(1, settings.Segments || 1);
		var geometry = this.Geometry();
		var row;
		var column;
		var a;

		for (row = 0; row <= segments; row++) {
			for (column = 0; column <= segments; column++) {
				geometry.Positions.push((column / segments - 0.5) * width, 0, (row / segments - 0.5) * depth);
				geometry.Normals.push(0, 1, 0);
				geometry.UVs.push(column / segments, 1 - row / segments);
			}
		}

		for (row = 0; row < segments; row++) {
			for (column = 0; column < segments; column++) {
				a = row * (segments + 1) + column;

				geometry.Indices.push(a, a + segments + 1, a + 1, a + 1, a + segments + 1, a + segments + 2);
			}
		}

		return geometry;
	},

	/* A line of [radius, y] turned round the axis Y: a tower, a dome, a trunk; its normals follow the line. */
	Lathe: function (options) {
		var settings = options || {};
		var points = settings.Points || [[0.5, 0], [0.5, 1]];
		var segments = Math.max(3, settings.Segments || 16);
		var geometry = this.Geometry();
		var count = points.length;
		var row;
		var segment;
		var angle;
		var before;
		var after;
		var slope;
		var length;
		var first;

		for (row = 0; row < count; row++) {
			before = points[Math.max(0, row - 1)];
			after = points[Math.min(count - 1, row + 1)];
			slope = [after[1] - before[1], before[0] - after[0]];
			length = Math.sqrt(slope[0] * slope[0] + slope[1] * slope[1]) || 1;

			for (segment = 0; segment <= segments; segment++) {
				angle = segment / segments * Math.PI * 2;

				geometry.Positions.push(Math.cos(angle) * points[row][0], points[row][1], Math.sin(angle) * points[row][0]);
				geometry.Normals.push(Math.cos(angle) * slope[0] / length, slope[1] / length, Math.sin(angle) * slope[0] / length);
				geometry.UVs.push(segment / segments, row / Math.max(1, count - 1));
			}
		}

		for (row = 0; row < count - 1; row++) {
			for (segment = 0; segment < segments; segment++) {
				first = row * (segments + 1) + segment;

				geometry.Indices.push(first, first + segments + 1, first + 1, first + 1, first + segments + 1, first + segments + 2);
			}
		}

		return geometry;
	},

	/* A roof of two slopes: its ridge along Z at the top, its base from -Height / 2 to its top. */
	Wedge: function (options) {
		var settings = options || {};
		var x = (settings.Width || 1) / 2;
		var y = (settings.Height || 1) / 2;
		var z = (settings.Depth || 1) / 2;
		var geometry = this.Geometry();
		var corners = [[-x, -y, z], [x, -y, z], [0, y, z], [-x, -y, -z], [x, -y, -z], [0, y, -z]];

		[[0, 1, 2], [4, 3, 5], [1, 4, 5, 2], [3, 0, 2, 5], [3, 4, 1, 0]].forEach(function (face) {
			var base = geometry.Positions.length / 3;
			var at;

			face.forEach(function (corner) {
				geometry.Positions.push(corners[corner][0], corners[corner][1], corners[corner][2]);
				geometry.Normals.push(0, 1, 0);
				geometry.UVs.push(0, 0);
			});

			for (at = 1; at < face.length - 1; at++)
				geometry.Indices.push(base, base + at, base + at + 1);
		});

		return this.Facets(geometry);
	},

	Transform: function (geometry, matrix) {
		var normals = this.$Service('Math').NormalMatrix(matrix);
		var result = this.Geometry();
		var i;
		var point;
		var x;
		var y;
		var z;
		var length;

		for (i = 0; i < geometry.Positions.length; i += 3) {
			point = this.$Service('Math').Apply(matrix, [geometry.Positions[i], geometry.Positions[i + 1], geometry.Positions[i + 2]]);
			x = geometry.Normals[i] || 0;
			y = geometry.Normals[i + 1] || 0;
			z = geometry.Normals[i + 2] || 0;

			result.Positions.push(point[0], point[1], point[2]);

			point = [normals[0] * x + normals[3] * y + normals[6] * z, normals[1] * x + normals[4] * y + normals[7] * z, normals[2] * x + normals[5] * y + normals[8] * z];
			length = Math.sqrt(point[0] * point[0] + point[1] * point[1] + point[2] * point[2]) || 1;

			result.Normals.push(point[0] / length, point[1] / length, point[2] / length);
		}

		result.UVs = (geometry.UVs || []).slice();
		result.Colors = (geometry.Colors || []).slice();
		result.Indices = geometry.Indices.slice();

		return result;
	},

	Merge: function (parts) {
		var self = this;
		var result = this.Geometry();
		var colored = parts.some(function (part) {
			return part && (part.Color || part.Geometry && part.Geometry.Colors && part.Geometry.Colors.length || part.Colors && part.Colors.length);
		});

		parts.forEach(function (part) {
			var geometry = part.Positions ? part : part.Geometry;
			var color = part.Positions ? null : part.Color;
			var base = result.Positions.length / 3;
			var count;
			var i;

			if (!geometry) return;

			if (part.Matrix)
				geometry = self.Transform(geometry, part.Matrix);

			count = geometry.Positions.length / 3;

			Array.prototype.push.apply(result.Positions, geometry.Positions);

			for (i = 0; i < geometry.Normals.length; i++)
				result.Normals.push(geometry.Normals[i]);

			for (i = 0; i < count; i++)
				result.UVs.push(geometry.UVs[i * 2] || 0, geometry.UVs[i * 2 + 1] || 0);

			if (colored) {
				for (i = 0; i < count; i++) {
					if (color) result.Colors.push(color[0], color[1], color[2]);
					else if (geometry.Colors && geometry.Colors.length) result.Colors.push(geometry.Colors[i * 3], geometry.Colors[i * 3 + 1], geometry.Colors[i * 3 + 2]);
					else result.Colors.push(1, 1, 1);
				}
			}

			geometry.Indices.forEach(function (index) {
				result.Indices.push(index + base);
			});
		});

		return result;
	},

	Displace: function (geometry, amount) {
		var result = this.Transform(geometry, this.$Service('Math').Identity());
		var i;
		var offset;

		for (i = 0; i < result.Positions.length; i += 3) {
			offset = amount([result.Positions[i], result.Positions[i + 1], result.Positions[i + 2]], [result.Normals[i], result.Normals[i + 1], result.Normals[i + 2]]) || 0;

			result.Positions[i] += result.Normals[i] * offset;
			result.Positions[i + 1] += result.Normals[i + 1] * offset;
			result.Positions[i + 2] += result.Normals[i + 2] * offset;
		}

		return this.Normals(result);
	},

	/* Each face flat: vertices of its own at its corners, their normal the one of the face. */
	Facets: function (geometry) {
		var result = this.Geometry();
		var colors = geometry.Colors && geometry.Colors.length;
		var vectors = this.$Service('Math').Vectors;
		var p = result.Positions;
		var i;
		var normal;

		geometry.Indices.forEach(function (index) {
			result.Positions.push(geometry.Positions[index * 3], geometry.Positions[index * 3 + 1], geometry.Positions[index * 3 + 2]);
			result.Normals.push(0, 1, 0);
			result.UVs.push(0, 0);

			if (colors)
				result.Colors.push(geometry.Colors[index * 3], geometry.Colors[index * 3 + 1], geometry.Colors[index * 3 + 2]);

			result.Indices.push(result.Indices.length);
		});

		for (i = 0; i < result.Positions.length; i += 9) {
			normal = vectors.Normalize(vectors.Cross([p[i + 3] - p[i], p[i + 4] - p[i + 1], p[i + 5] - p[i + 2]], [p[i + 6] - p[i], p[i + 7] - p[i + 1], p[i + 8] - p[i + 2]]));

			result.Normals.splice(i, 9, normal[0], normal[1], normal[2], normal[0], normal[1], normal[2], normal[0], normal[1], normal[2]);
		}

		return result;
	},

	/*
	 * A simpler shape: the corners within one cell of a grid become one, at the middle of them and of their mean color;
	 * a face that lost a corner goes. The faces stay flat. Fast, and good for what is seen from afar.
	 */
	Simplify: function (geometry, cell) {
		var size = Number(cell) || 0.1;
		var result = this.Geometry();
		var cells = {};
		var map = [];
		var p = geometry.Positions;
		var c = geometry.Colors || [];
		var i;
		var key;
		var one;

		for (i = 0; i < p.length; i += 3) {
			key = Math.round(p[i] / size) + ':' + Math.round(p[i + 1] / size) + ':' + Math.round(p[i + 2] / size);
			one = cells[key];

			if (!one) {
				one = cells[key] = {Index: 0, Sum: [0, 0, 0], Color: [0, 0, 0], Count: 0};
			}

			one.Sum[0] += p[i];
			one.Sum[1] += p[i + 1];
			one.Sum[2] += p[i + 2];
			one.Color[0] += c[i] === undefined ? 1 : c[i];
			one.Color[1] += c[i + 1] === undefined ? 1 : c[i + 1];
			one.Color[2] += c[i + 2] === undefined ? 1 : c[i + 2];
			one.Count++;

			map[i / 3] = one;
		}

		Object.keys(cells).forEach(function (name, index) {
			var each = cells[name];

			each.Index = index;

			result.Positions.push(each.Sum[0] / each.Count, each.Sum[1] / each.Count, each.Sum[2] / each.Count);
			result.Colors.push(each.Color[0] / each.Count, each.Color[1] / each.Count, each.Color[2] / each.Count);
			result.Normals.push(0, 1, 0);
			result.UVs.push(0, 0);
		});

		for (i = 0; i < geometry.Indices.length; i += 3) {
			var a = map[geometry.Indices[i]].Index;
			var b = map[geometry.Indices[i + 1]].Index;
			var d = map[geometry.Indices[i + 2]].Index;
			if (a !== b && b !== d && a !== d)
				result.Indices.push(a, b, d);
		}

		return this.Facets(result);
	},

	/* The normals made again: each vertex the mean of the faces round it, weighted by their areas. */
	Normals: function (geometry) {
		var positions = geometry.Positions;
		var indices = geometry.Indices;
		var normals = [];
		var i;
		var a;
		var b;
		var c;
		var e1;
		var e2;
		var n;
		var length;

		for (i = 0; i < positions.length; i++)
			normals.push(0);

		for (i = 0; i < indices.length; i += 3) {
			a = indices[i] * 3;
			b = indices[i + 1] * 3;
			c = indices[i + 2] * 3;
			e1 = [positions[b] - positions[a], positions[b + 1] - positions[a + 1], positions[b + 2] - positions[a + 2]];
			e2 = [positions[c] - positions[a], positions[c + 1] - positions[a + 1], positions[c + 2] - positions[a + 2]];
			n = this.$Service('Math').Vectors.Cross(e1, e2);

			[a, b, c].forEach(function (at) {
				normals[at] += n[0];
				normals[at + 1] += n[1];
				normals[at + 2] += n[2];
			});
		}

		for (i = 0; i < normals.length; i += 3) {
			length = Math.sqrt(normals[i] * normals[i] + normals[i + 1] * normals[i + 1] + normals[i + 2] * normals[i + 2]) || 1;

			normals[i] /= length;
			normals[i + 1] /= length;
			normals[i + 2] /= length;
		}

		geometry.Normals = normals;

		return geometry;
	}
});
