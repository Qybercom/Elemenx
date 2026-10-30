/*
 * The graphics of three dimensions on WebGL2, with no library: the numbers of space (matrices, vectors, a camera, a
 * ray), the shapes made of triangles (geometry) and a renderer that draws them with the shaders given to it.
 *
 * The numbers and the shapes run in Node too (they read no page):
 * - Matrices of 4 by 4 are arrays of 16 numbers, column by column, as WebGL reads them: Identity(), Multiply(a, b),
 *   Invert(m), Translation(x, y, z), Rotation(axis, angle) (radians), Scaling(x, y, z), Compose(position, rotation,
 *   scale) (rotation a matrix, or null), Perspective(fov, aspect, near, far) (fov in degrees), Orthographic(left,
 *   right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m) (the 3 by 3 one of the normals),
 *   Apply(m, point) (a point [x, y, z] moved by it).
 * - Vectors are arrays [x, y, z]: Vectors.Add(a, b), Subtract, Scale(a, k), Dot, Cross, Length, Normalize, Lerp(a,
 *   b, t), Distance.
 * - Camera(options) returns a camera ({Position, Target, Up, Fov, Near, Far}): View(), Projection(aspect),
 *   Matrix(aspect) (both), Orbit(target, yaw, pitch, distance) (it looks at target from round it), Ray(x, y, width,
 *   height) ({Origin, Direction} through a point of the screen), Project(point, width, height) ({X, Y, Depth,
 *   Visible}: where a point of space is on the screen).
 * - Hit(ray, center, radius): how far along the ray it meets a ball (-1: it does not).
 * - Geometry is {Positions, Normals, UVs, Colors, Indices} (flat arrays: 3, 3, 2 and 3 numbers a vertex): Sphere({Radius,
 *   Segments, Rings}), Icosphere({Radius, Detail}), Ring({Inner, Outer, Segments}) (flat, round the axis Y), Box({Width,
 *   Height, Depth}), Cylinder({Radius, Top, Height, Segments, Caps}) (a cone when Top is 0), Torus({Radius, Tube,
 *   Segments, Sides}), Plane({Width, Depth, Segments}), Lathe({Points: [[radius, y]...], Segments}) (a line turned round
 *   the axis Y), Wedge({Width, Height, Depth}) (a roof of two slopes); Transform(geometry, matrix), Merge(parts) (each a
 *   geometry or {Geometry, Matrix, Color}), Displace(geometry, amount) (each vertex moved along its normal by
 *   amount(position, normal)), Normals(geometry) (made again from the faces), Facets(geometry) (each face flat, of
 *   vertices of its own).
 * - Noise(seed) returns a smooth noise of space: Value(x, y, z) (0 to 1), Fbm(x, y, z, octaves) (several of it, each
 *   finer and fainter) and Ridge (the folds of mountains). Without a seed it is the very noise of the shaders,
 *   Chunks.Noise (noise3, fbm3, ridge3), to the float: a heightmap of the CPU matches a surface the GPU baked.
 *   Chunks.Lights is the light of up to 4 points on a surface, with the shadows of up to 4 balls (lighting(position,
 *   normal, view, shine, specular); the global lightShade dims its first light). Chunks.Shadow reads a shadow map
 *   (sunShadow(position, normal): 0 in the shadow, 1 in the light; uniforms uShadowMap, uShadowMatrix, uShadowBias,
 *   uShadowOn).
 *
 * Create(canvas, options) returns a renderer, or null where there is no WebGL2 (options: Alpha, Antialias, Ratio):
 * - Program(vertex, fragment): the shaders compiled (each one once), their uniforms found; an error of GLSL is thrown
 *   with its log. The attributes have fixed places: aPosition, aNormal, aUV, aColor, aInstance (and aInstance2 to
 *   aInstance5, one of each copy of an instanced mesh).
 * - Mesh(geometry) returns a mesh: Update(geometry), Instance(data, count) (data {aInstance: {Size, Data}, ...}: the
 *   copies of the mesh drawn at once), Destroy(); Lines(points, loop) and Points(positions, extra) (extra {aColor:
 *   {Size, Data}}) make meshes of lines and of points.
 * - Texture(source, options) (a canvas, a picture, or {Width, Height, Data}; options Repeat, Nearest) returns a texture
 *   for a uniform sampler2D; Cube(size) a cube of six faces for a samplerCube, which Bake(cube, program, uniforms)
 *   draws once: the program is Shaders.Quad with a fragment shader that takes the direction of each texel from
 *   cubeDirection(uFace, vQuad) (Chunks.Cube): a surface of noise computed once, sampled at every frame.
 * - Shadow(size) returns a shadow map, a depth texture for a uniform sampler2DShadow: between its Begin() and End() the
 *   draws write only its depth, as seen from the light; Destroy().
 * - Draw(mesh, program, uniforms, settings): settings Mode (triangles, lines, line-strip, line-loop, points), Blend
 *   (alpha, add or none), Depth (test, true), DepthWrite (true), Cull (back, front or none), Instances (the copies).
 *   The value of a uniform is a number, an array (of a vector, a matrix or a list of them), true or false, or a texture.
 * - Resize(width, height, ratio), Clear(color) ([r, g, b, a], 0 to 1), Lost (the context was taken by the browser),
 *   Destroy().
 */
Elemenx.Service('Graphics3D', {
	$Meta: {
		Description: 'The graphics of three dimensions on WebGL2: matrices, a camera, shapes of triangles and a renderer of them.',
		Methods: ['Create(canvas, options)', 'Camera(options)', 'Identity()', 'Multiply(a, b)', 'Invert(m)', 'Translation(x, y, z)', 'Rotation(axis, angle)', 'Scaling(x, y, z)', 'Compose(position, rotation, scale)', 'Perspective(fov, aspect, near, far)', 'Orthographic(left, right, bottom, top, near, far)', 'LookAt(eye, target, up)', 'NormalMatrix(m)', 'Apply(m, point)', 'Hit(ray, center, radius)', 'Sphere(options)', 'Icosphere(options)', 'Ring(options)', 'Box(options)', 'Cylinder(options)', 'Torus(options)', 'Plane(options)', 'Lathe(options)', 'Wedge(options)', 'Transform(geometry, matrix)', 'Merge(parts)', 'Displace(geometry, amount)', 'Normals(geometry)', 'Facets(geometry)', 'Noise(seed)']
	},

	/* The places of the attributes, the same in every program: a mesh binds its buffers to them. */
	Locations: {aPosition: 0, aNormal: 1, aUV: 2, aColor: 3, aInstance: 4, aInstance2: 5, aInstance3: 6, aInstance4: 7, aInstance5: 8},

	Vectors: {
		Add: function (a, b) {
			return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
		},

		Subtract: function (a, b) {
			return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
		},

		Scale: function (a, k) {
			return [a[0] * k, a[1] * k, a[2] * k];
		},

		Dot: function (a, b) {
			return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
		},

		Cross: function (a, b) {
			return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
		},

		Length: function (a) {
			return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
		},

		Normalize: function (a) {
			var length = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
			if (!length)
				return [0, 0, 0];

			return [a[0] / length, a[1] / length, a[2] / length];
		},

		Lerp: function (a, b, t) {
			return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
		},

		Distance: function (a, b) {
			var x = a[0] - b[0];
			var y = a[1] - b[1];
			var z = a[2] - b[2];

			return Math.sqrt(x * x + y * y + z * z);
		}
	},

	Identity: function () {
		return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	},

	Multiply: function (a, b) {
		var result = new Array(16);
		var column;
		var row;

		for (column = 0; column < 4; column++) {
			for (row = 0; row < 4; row++)
				result[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
		}

		return result;
	},

	Invert: function (m) {
		var a00 = m[0];
		var a01 = m[1];
		var a02 = m[2];
		var a03 = m[3];
		var a10 = m[4];
		var a11 = m[5];
		var a12 = m[6];
		var a13 = m[7];
		var a20 = m[8];
		var a21 = m[9];
		var a22 = m[10];
		var a23 = m[11];
		var a30 = m[12];
		var a31 = m[13];
		var a32 = m[14];
		var a33 = m[15];
		var b00 = a00 * a11 - a01 * a10;
		var b01 = a00 * a12 - a02 * a10;
		var b02 = a00 * a13 - a03 * a10;
		var b03 = a01 * a12 - a02 * a11;
		var b04 = a01 * a13 - a03 * a11;
		var b05 = a02 * a13 - a03 * a12;
		var b06 = a20 * a31 - a21 * a30;
		var b07 = a20 * a32 - a22 * a30;
		var b08 = a20 * a33 - a23 * a30;
		var b09 = a21 * a32 - a22 * a31;
		var b10 = a21 * a33 - a23 * a31;
		var b11 = a22 * a33 - a23 * a32;
		var determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
		if (!determinant) return null;

		determinant = 1 / determinant;

		return [
			(a11 * b11 - a12 * b10 + a13 * b09) * determinant,
			(a02 * b10 - a01 * b11 - a03 * b09) * determinant,
			(a31 * b05 - a32 * b04 + a33 * b03) * determinant,
			(a22 * b04 - a21 * b05 - a23 * b03) * determinant,
			(a12 * b08 - a10 * b11 - a13 * b07) * determinant,
			(a00 * b11 - a02 * b08 + a03 * b07) * determinant,
			(a32 * b02 - a30 * b05 - a33 * b01) * determinant,
			(a20 * b05 - a22 * b02 + a23 * b01) * determinant,
			(a10 * b10 - a11 * b08 + a13 * b06) * determinant,
			(a01 * b08 - a00 * b10 - a03 * b06) * determinant,
			(a30 * b04 - a31 * b02 + a33 * b00) * determinant,
			(a21 * b02 - a20 * b04 - a23 * b00) * determinant,
			(a11 * b07 - a10 * b09 - a12 * b06) * determinant,
			(a00 * b09 - a01 * b07 + a02 * b06) * determinant,
			(a31 * b01 - a30 * b03 - a32 * b00) * determinant,
			(a20 * b03 - a21 * b01 + a22 * b00) * determinant
		];
	},

	Translation: function (x, y, z) {
		return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
	},

	Rotation: function (axis, angle) {
		var unit = this.Vectors.Normalize(axis);
		var x = unit[0];
		var y = unit[1];
		var z = unit[2];
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		var t = 1 - c;

		return [
			t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
			t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
			t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
			0, 0, 0, 1
		];
	},

	Scaling: function (x, y, z) {
		return [x, 0, 0, 0, 0, y === undefined ? x : y, 0, 0, 0, 0, z === undefined ? x : z, 0, 0, 0, 0, 1];
	},

	/* A matrix that scales, then turns, then moves: the place of a thing in its world. */
	Compose: function (position, rotation, scale) {
		var size = typeof scale === 'number' ? [scale, scale, scale] : scale || [1, 1, 1];
		var matrix = this.Multiply(rotation || this.Identity(), this.Scaling(size[0], size[1], size[2]));

		matrix[12] = position ? position[0] : 0;
		matrix[13] = position ? position[1] : 0;
		matrix[14] = position ? position[2] : 0;

		return matrix;
	},

	Perspective: function (fov, aspect, near, far) {
		var f = 1 / Math.tan(fov * Math.PI / 360);
		var range = 1 / (near - far);

		return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * range, -1, 0, 0, 2 * far * near * range, 0];
	},

	Orthographic: function (left, right, bottom, top, near, far) {
		var width = 1 / (right - left);
		var height = 1 / (top - bottom);
		var depth = 1 / (far - near);

		return [2 * width, 0, 0, 0, 0, 2 * height, 0, 0, 0, 0, -2 * depth, 0, -(right + left) * width, -(top + bottom) * height, -(far + near) * depth, 1];
	},

	LookAt: function (eye, target, up) {
		var vectors = this.Vectors;
		var z = vectors.Normalize(vectors.Subtract(eye, target));
		var x = vectors.Normalize(vectors.Cross(up || [0, 1, 0], z));
		var y;

		/* Looking straight along up: any other side will do. */
		if (!vectors.Length(x))
			x = vectors.Normalize(vectors.Cross([0, 0, 1], z));

		y = vectors.Cross(z, x);

		return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -vectors.Dot(x, eye), -vectors.Dot(y, eye), -vectors.Dot(z, eye), 1];
	},

	/* The matrix of the normals: the inverse of the turn and scale of a matrix, transposed (3 by 3, column by column). */
	NormalMatrix: function (m) {
		var inverse = this.Invert(m) || this.Identity();

		return [inverse[0], inverse[4], inverse[8], inverse[1], inverse[5], inverse[9], inverse[2], inverse[6], inverse[10]];
	},

	Apply: function (m, point) {
		var x = point[0];
		var y = point[1];
		var z = point[2];
		var w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;

		return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
	},

	Camera: function (options) {
		var self = this;
		var settings = options || {};
		var camera = {
			Position: settings.Position || [0, 0, 10],
			Target: settings.Target || [0, 0, 0],
			Up: settings.Up || [0, 1, 0],
			Fov: settings.Fov || 50,
			Near: settings.Near || 0.1,
			Far: settings.Far || 1000
		};

		camera.View = function () {
			return self.LookAt(camera.Position, camera.Target, camera.Up);
		};

		camera.Projection = function (aspect) {
			return self.Perspective(camera.Fov, aspect || 1, camera.Near, camera.Far);
		};

		camera.Matrix = function (aspect) {
			return self.Multiply(camera.Projection(aspect), camera.View());
		};

		/* Round a point: yaw about the axis Y, pitch up from its plane (radians), at a distance. */
		camera.Orbit = function (target, yaw, pitch, distance) {
			var flat = Math.cos(pitch) * distance;

			camera.Target = target.slice();
			camera.Position = [target[0] + Math.sin(yaw) * flat, target[1] + Math.sin(pitch) * distance, target[2] + Math.cos(yaw) * flat];

			return camera;
		};

		camera.Ray = function (x, y, width, height) {
			var inverse = self.Invert(camera.Matrix(width / Math.max(1, height)));
			var nx = x / Math.max(1, width) * 2 - 1;
			var ny = 1 - y / Math.max(1, height) * 2;
			var near = self.Apply(inverse, [nx, ny, -1]);
			var far = self.Apply(inverse, [nx, ny, 1]);

			return {Origin: near, Direction: self.Vectors.Normalize(self.Vectors.Subtract(far, near))};
		};

		camera.Project = function (point, width, height) {
			var m = camera.Matrix(width / Math.max(1, height));
			var x = point[0];
			var y = point[1];
			var z = point[2];
			var w = m[3] * x + m[7] * y + m[11] * z + m[15];
			var cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
			var cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
			var cz = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;

			return {X: (cx + 1) / 2 * width, Y: (1 - cy) / 2 * height, Depth: cz, Visible: w > 0 && cz >= -1 && cz <= 1};
		};

		return camera;
	},

	Hit: function (ray, center, radius) {
		var vectors = this.Vectors;
		var offset = vectors.Subtract(ray.Origin, center);
		var b = vectors.Dot(offset, ray.Direction);
		var c = vectors.Dot(offset, offset) - radius * radius;
		var discriminant = b * b - c;
		var t;

		if (discriminant < 0) return -1;

		t = -b - Math.sqrt(discriminant);

		if (t < 0)
			t = -b + Math.sqrt(discriminant);

		return t < 0 ? -1 : t;
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
		var vectors = this.Vectors;
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
		var normals = this.NormalMatrix(matrix);
		var result = this.Geometry();
		var i;
		var point;
		var x;
		var y;
		var z;
		var length;

		for (i = 0; i < geometry.Positions.length; i += 3) {
			point = this.Apply(matrix, [geometry.Positions[i], geometry.Positions[i + 1], geometry.Positions[i + 2]]);
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
			Array.prototype.push.apply(result.Normals, geometry.Normals);

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
		var result = this.Transform(geometry, this.Identity());
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
		var vectors = this.Vectors;
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
			n = this.Vectors.Cross(e1, e2);

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
	},

	/*
	 * The noise of the shaders (Chunks.Noise), the same numbers in JavaScript: a hash of whole numbers (pcg3d), so the
	 * CPU and the GPU agree to the last bit on the corners and to a float on what is between them. A seed moves the
	 * coordinates (no seed: the very noise of the shaders, a heightmap that matches a baked surface).
	 */
	Noise: function (seed) {
		var offset = seed === undefined || seed === null || seed === '' ? 0 : this.SeedOffset(seed);

		function hash (x, y, z) {
			var a = Math.imul(x + 65536, 1664525) + 1013904223 >>> 0;
			var b = Math.imul(y + 65536, 1664525) + 1013904223 >>> 0;
			var c = Math.imul(z + 65536, 1664525) + 1013904223 >>> 0;

			a = a + Math.imul(b, c) >>> 0;
			b = b + Math.imul(c, a) >>> 0;
			c = c + Math.imul(a, b) >>> 0;
			a = (a ^ a >>> 16) >>> 0;
			b = (b ^ b >>> 16) >>> 0;
			c = (c ^ c >>> 16) >>> 0;
			a = a + Math.imul(b, c) >>> 0;

			return (a & 16777215) / 16777215;
		}

		function smooth (t) {
			return t * t * t * (t * (t * 6 - 15) + 10);
		}

		function mix (a, b, t) {
			return a + (b - a) * t;
		}

		function value (x, y, z) {
			var ix = Math.floor(x);
			var iy = Math.floor(y);
			var iz = Math.floor(z);
			var fx = smooth(x - ix);
			var fy = smooth(y - iy);
			var fz = smooth(z - iz);

			return mix(
				mix(mix(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), mix(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy),
				mix(mix(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), mix(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy),
				fz
			);
		}

		/* Octaves of noise, each finer and fainter; ridged: the folds of mountains. */
		function octaves (x, y, z, count, ridged) {
			var total = 0;
			var amplitude = 0.5;
			var weight = 0;
			var octave;
			var n;

			for (octave = 0; octave < (count || 4); octave++) {
				n = value(x, y, z);
				total += (ridged ? 1 - Math.abs(n * 2 - 1) : n) * amplitude;
				weight += amplitude;
				x = x * 2.03 + 1.7;
				y = y * 2.03 + 9.2;
				z = z * 2.03 + 3.1;
				amplitude *= 0.5;
			}

			return total / weight;
		}

		return {
			Value: function (x, y, z) {
				return value(x + offset, y + offset, z + offset);
			},

			Fbm: function (x, y, z, count) {
				return octaves(x + offset, y + offset, z + offset, count, false);
			},

			Ridge: function (x, y, z, count) {
				return octaves(x + offset, y + offset, z + offset, count, true);
			}
		};
	},

	/* The shift of the coordinates of a seed: a number of hundreds, the same for the same seed. */
	SeedOffset: function (seed) {
		var text = String(seed);
		var state = 2166136261;
		var i;

		for (i = 0; i < text.length; i++)
			state = Math.imul(state ^ text.charCodeAt(i), 16777619) >>> 0;

		return state % 997 + 0.5;
	},

	/* The vertex shader of a quad over the whole target (Bake draws it): vQuad from -1 to 1. */
	Shaders: {
		Quad: [
			'#version 300 es',
			'precision highp float;',
			'in vec3 aPosition;',
			'out vec2 vQuad;',
			'void main() {',
			'	vQuad = aPosition.xy;',
			'	gl_Position = vec4(aPosition.xy, 0.0, 1.0);',
			'}'
		].join('\n')
	},

	/* Parts of shaders: the same noise as Noise, the light of points with the shadows of balls, the directions of a cube. */
	Chunks: {
		Cube: [
			'uniform int uFace;',
			'vec3 cubeDirection(int face, vec2 p) {',
			'	if (face == 0) return normalize(vec3(1.0, -p.y, -p.x));',
			'	if (face == 1) return normalize(vec3(-1.0, -p.y, p.x));',
			'	if (face == 2) return normalize(vec3(p.x, 1.0, p.y));',
			'	if (face == 3) return normalize(vec3(p.x, -1.0, -p.y));',
			'	if (face == 4) return normalize(vec3(p.x, -p.y, 1.0));',
			'	return normalize(vec3(-p.x, -p.y, -1.0));',
			'}'
		].join('\n'),

		Noise: [
			'uvec3 pcg3(uvec3 v) {',
			'	v = v * 1664525u + 1013904223u;',
			'	v.x += v.y * v.z;',
			'	v.y += v.z * v.x;',
			'	v.z += v.x * v.y;',
			'	v ^= v >> 16u;',
			'	v.x += v.y * v.z;',
			'	v.y += v.z * v.x;',
			'	v.z += v.x * v.y;',
			'	return v;',
			'}',
			'float hash3(vec3 p) {',
			'	uvec3 u = uvec3(ivec3(p) + ivec3(65536));',
			'	return float(pcg3(u).x & 16777215u) / 16777215.0;',
			'}',
			'float noise3(vec3 x) {',
			'	vec3 i = floor(x);',
			'	vec3 f = fract(x);',
			'	f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
			'	return mix(mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
			'		mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
			'}',
			'float fbm3(vec3 p, int octaves) {',
			'	float total = 0.0;',
			'	float amplitude = 0.5;',
			'	float weight = 0.0;',
			'	for (int i = 0; i < 8; i++) {',
			'		if (i >= octaves) break;',
			'		total += noise3(p) * amplitude;',
			'		weight += amplitude;',
			'		p = p * 2.03 + vec3(1.7, 9.2, 3.1);',
			'		amplitude *= 0.5;',
			'	}',
			'	return total / weight;',
			'}',
			'float ridge3(vec3 p, int octaves) {',
			'	float total = 0.0;',
			'	float amplitude = 0.5;',
			'	float weight = 0.0;',
			'	for (int i = 0; i < 8; i++) {',
			'		if (i >= octaves) break;',
			'		total += (1.0 - abs(noise3(p) * 2.0 - 1.0)) * amplitude;',
			'		weight += amplitude;',
			'		p = p * 2.03 + vec3(1.7, 9.2, 3.1);',
			'		amplitude *= 0.5;',
			'	}',
			'	return total / weight;',
			'}'
		].join('\n'),

		Lights: [
			'uniform vec3 uLightPositions[4];',
			'uniform vec3 uLightColors[4];',
			'uniform int uLightCount;',
			'uniform vec3 uAmbient;',
			'uniform vec4 uOccluders[4];',
			'uniform int uOccluderCount;',
			'float lightShade = 1.0;',
			'float shadow(vec3 position, vec3 light) {',
			'	float lit = 1.0;',
			'	vec3 way = light - position;',
			'	float far = length(way);',
			'	vec3 direction = way / far;',
			'	for (int i = 0; i < 4; i++) {',
			'		if (i >= uOccluderCount) break;',
			'		vec3 center = uOccluders[i].xyz - position;',
			'		float along = dot(center, direction);',
			'		if (along <= 0.0 || along >= far) continue;',
			'		float miss = length(center - direction * along);',
			'		float radius = uOccluders[i].w;',
			'		lit *= smoothstep(radius * 0.8, radius * 1.15, miss);',
			'	}',
			'	return lit;',
			'}',
			'vec3 lighting(vec3 position, vec3 normal, vec3 view, float shine, float specular) {',
			'	vec3 total = uAmbient;',
			'	for (int i = 0; i < 4; i++) {',
			'		if (i >= uLightCount) break;',
			'		vec3 toLight = normalize(uLightPositions[i] - position);',
			'		float diffuse = max(dot(normal, toLight), 0.0);',
			'		if (diffuse <= 0.0) continue;',
			'		float lit = shadow(position, uLightPositions[i]) * (i == 0 ? lightShade : 1.0);',
			'		vec3 middle = normalize(toLight + view);',
			'		float gloss = pow(max(dot(normal, middle), 0.0), shine) * specular;',
			'		total += uLightColors[i] * (diffuse + gloss) * lit;',
			'	}',
			'	return total;',
			'}'
		].join('\n'),

		Shadow: [
			'uniform highp sampler2DShadow uShadowMap;',
			'uniform mat4 uShadowMatrix;',
			'uniform float uShadowBias;',
			'uniform float uShadowOn;',
			'float sunShadow(vec3 position, vec3 normal) {',
			'	if (uShadowOn < 0.5) return 1.0;',
			'	vec4 at = uShadowMatrix * vec4(position + normal * uShadowBias, 1.0);',
			'	vec3 place = at.xyz * 0.5 + 0.5;',
			'	float edge = max(abs(at.x), abs(at.y));',
			'	if (edge >= 1.0 || place.z >= 1.0) return 1.0;',
			'	float texel = 1.0 / float(textureSize(uShadowMap, 0).x);',
			'	float sum = 0.0;',
			'	for (int x = -1; x <= 1; x++) {',
			'		for (int y = -1; y <= 1; y++) {',
			'			sum += texture(uShadowMap, vec3(place.xy + vec2(float(x), float(y)) * texel * 1.2, place.z));',
			'		}',
			'	}',
			'	return mix(sum / 9.0, 1.0, smoothstep(0.85, 1.0, edge));',
			'}'
		].join('\n')
	},

	Create: function (canvas, options) {
		var self = this;
		var settings = options || {};
		var gl = null;
		var programs = {};
		var shaders = {};
		var meshes = [];
		var textures = [];
		var modes;
		var gpuQuad = null;
		var renderer;

		try {
			gl = canvas.getContext('webgl2', {alpha: !!settings.Alpha, antialias: settings.Antialias !== false, premultipliedAlpha: false, preserveDrawingBuffer: !!settings.Preserve});
		}
		catch (error) {
			gl = null;
		}

		if (!gl)
			return null;

		modes = {'triangles': gl.TRIANGLES, 'lines': gl.LINES, 'line-strip': gl.LINE_STRIP, 'line-loop': gl.LINE_LOOP, 'points': gl.POINTS};

		function compile (type, source) {
			var key = type + ':' + source;
			var shader = shaders[key];
			if (shader)
				return shader;

			shader = gl.createShader(type);

			gl.shaderSource(shader, source);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost())
				throw new Error('Elemenx Graphics3D: the shader does not compile: ' + gl.getShaderInfoLog(shader));

			shaders[key] = shader;

			return shader;
		}

		function buffer (target, data) {
			var handle = gl.createBuffer();

			gl.bindBuffer(target, handle);
			gl.bufferData(target, data, gl.STATIC_DRAW);

			return handle;
		}

		/* An attribute of a mesh: its buffer bound to its place, divisor 1 for the ones of each copy. */
		function attribute (mesh, name, size, data, divisor) {
			var location = self.Locations[name];
			var values = data instanceof Float32Array ? data : new Float32Array(data);
			if (location === undefined || !values.length) return;

			if (mesh.Buffers[name]) {
				gl.bindBuffer(gl.ARRAY_BUFFER, mesh.Buffers[name]);

				if (mesh.Sizes[name] >= values.byteLength) {
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, values);
				}
				else {
					gl.bufferData(gl.ARRAY_BUFFER, values, gl.DYNAMIC_DRAW);

					mesh.Sizes[name] = values.byteLength;
				}
			}
			else {
				mesh.Buffers[name] = buffer(gl.ARRAY_BUFFER, values);
				mesh.Sizes[name] = values.byteLength;
			}

			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
			gl.vertexAttribDivisor(location, divisor || 0);
		}

		function mesh (geometry, mode) {
			var made = {VAO: gl.createVertexArray(), Buffers: {}, Sizes: {}, Count: 0, Indexed: false, Mode: mode || 'triangles', Instances: 0};

			made.Update = function (shape) {
				var count = shape.Positions.length / 3;
				var indices;

				gl.bindVertexArray(made.VAO);

				attribute(made, 'aPosition', 3, shape.Positions);
				attribute(made, 'aNormal', 3, shape.Normals && shape.Normals.length ? shape.Normals : new Float32Array(count * 3));
				attribute(made, 'aUV', 2, shape.UVs && shape.UVs.length ? shape.UVs : new Float32Array(count * 2));

				if (shape.Colors && shape.Colors.length) {
					attribute(made, 'aColor', shape.Colors.length / count, shape.Colors);
				}
				else {
					gl.disableVertexAttribArray(self.Locations.aColor);
					gl.vertexAttrib4f(self.Locations.aColor, 1, 1, 1, 1);
				}

				if (shape.Indices && shape.Indices.length) {
					indices = count > 65535 ? new Uint32Array(shape.Indices) : new Uint16Array(shape.Indices);

					if (made.Index)
						gl.deleteBuffer(made.Index);

					made.Index = buffer(gl.ELEMENT_ARRAY_BUFFER, indices);
					made.IndexType = count > 65535 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
					made.Count = shape.Indices.length;
					made.Indexed = true;
				}
				else {
					made.Count = count;
					made.Indexed = false;
				}

				gl.bindVertexArray(null);

				return made;
			};

			/* The attributes of each copy: {aInstance: {Size, Data}, ...}, count the copies. */
			made.Instance = function (data, count) {
				gl.bindVertexArray(made.VAO);

				Object.keys(data).forEach(function (name) {
					attribute(made, name, data[name].Size, data[name].Data, 1);
				});

				gl.bindVertexArray(null);

				made.Instances = count;

				return made;
			};

			made.Destroy = function () {
				Object.keys(made.Buffers).forEach(function (name) {
					gl.deleteBuffer(made.Buffers[name]);
				});

				if (made.Index)
					gl.deleteBuffer(made.Index);

				gl.deleteVertexArray(made.VAO);

				meshes.splice(meshes.indexOf(made), 1);
			};

			meshes.push(made);

			return made.Update(geometry);
		}

		/* The value of a uniform set by its type, as the program found it. */
		function uniform (info, value, units) {
			var location = info.Location;
			var data = value && value.length !== undefined ? value : null;

			switch (info.Type) {
				case gl.FLOAT:
					if (data) gl.uniform1fv(location, data);
					else gl.uniform1f(location, Number(value) || 0);

					break;
				case gl.FLOAT_VEC2:
					gl.uniform2fv(location, data);

					break;
				case gl.FLOAT_VEC3:
					gl.uniform3fv(location, data);

					break;
				case gl.FLOAT_VEC4:
					gl.uniform4fv(location, data);

					break;
				case gl.INT:
				case gl.BOOL:
					if (data) gl.uniform1iv(location, data);
					else gl.uniform1i(location, value === true ? 1 : Number(value) || 0);

					break;
				case gl.FLOAT_MAT3:
					gl.uniformMatrix3fv(location, false, data);

					break;
				case gl.FLOAT_MAT4:
					gl.uniformMatrix4fv(location, false, data);

					break;
				case gl.SAMPLER_2D:
				case gl.SAMPLER_2D_SHADOW:
					gl.activeTexture(gl.TEXTURE0 + units.Next);
					gl.bindTexture(gl.TEXTURE_2D, value ? value.Handle : null);
					gl.uniform1i(location, units.Next);

					units.Next++;

					break;
				case gl.SAMPLER_CUBE:
					gl.activeTexture(gl.TEXTURE0 + units.Next);
					gl.bindTexture(gl.TEXTURE_CUBE_MAP, value ? value.Handle : null);
					gl.uniform1i(location, units.Next);

					units.Next++;

					break;
				default:
					break;
			}
		}

		renderer = {
			GL: gl,
			Canvas: canvas,
			Width: canvas.width,
			Height: canvas.height,
			Ratio: 1,
			Lost: false,

			Program: function (vertex, fragment) {
				var key = vertex + '\n--\n' + fragment;
				var program = programs[key];
				var handle;
				var count;
				var i;
				var info;

				if (program)
					return program;

				handle = gl.createProgram();

				gl.attachShader(handle, compile(gl.VERTEX_SHADER, vertex));
				gl.attachShader(handle, compile(gl.FRAGMENT_SHADER, fragment));

				Object.keys(self.Locations).forEach(function (name) {
					gl.bindAttribLocation(handle, self.Locations[name], name);
				});

				gl.linkProgram(handle);

				if (!gl.getProgramParameter(handle, gl.LINK_STATUS) && !gl.isContextLost())
					throw new Error('Elemenx Graphics3D: the program does not link: ' + gl.getProgramInfoLog(handle));

				program = {Handle: handle, Uniforms: {}};
				count = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS) || 0;

				for (i = 0; i < count; i++) {
					info = gl.getActiveUniform(handle, i);

					program.Uniforms[info.name.replace(/\[0\]$/, '')] = {Location: gl.getUniformLocation(handle, info.name), Type: info.type, Size: info.size};
				}

				programs[key] = program;

				return program;
			},

			Mesh: function (geometry) {
				return mesh(geometry);
			},

			Lines: function (points, loop) {
				var positions = [];

				points.forEach(function (point) {
					positions.push(point[0], point[1], point[2]);
				});

				return mesh({Positions: positions}, loop ? 'line-loop' : 'line-strip');
			},

			Points: function (positions, extra) {
				var made = mesh({Positions: positions}, 'points');

				if (extra && extra.aColor) {
					gl.bindVertexArray(made.VAO);

					attribute(made, 'aColor', extra.aColor.Size, extra.aColor.Data);

					gl.bindVertexArray(null);
				}

				return made;
			},

			Texture: function (source, options) {
				var settings = options || {};
				var handle = gl.createTexture();
				var texture = {Handle: handle};

				gl.bindTexture(gl.TEXTURE_2D, handle);

				if (source && source.Data) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.Width, source.Height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.Data instanceof Uint8Array ? source.Data : new Uint8Array(source.Data));
				else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, settings.Repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, settings.Repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, settings.Nearest ? gl.NEAREST : gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, settings.Nearest ? gl.NEAREST : gl.LINEAR);

				texture.Destroy = function () {
					gl.deleteTexture(handle);

					textures.splice(textures.indexOf(texture), 1);
				};

				textures.push(texture);

				return texture;
			},

			/* A cube of six square faces, size pixels each, for a uniform samplerCube: empty until Bake draws it. */
			Cube: function (size) {
				var handle = gl.createTexture();
				var side = Math.max(1, Math.round(size || 256));
				var cube = {Handle: handle, Size: side, Cube: true};
				var face;

				gl.bindTexture(gl.TEXTURE_CUBE_MAP, handle);

				for (face = 0; face < 6; face++)
					gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA, side, side, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

				cube.Destroy = function () {
					gl.deleteTexture(handle);

					textures.splice(textures.indexOf(cube), 1);
				};

				textures.push(cube);

				return cube;
			},

			/*
			 * Draws the six faces of a cube once with a program: its fragment shader takes the direction of each texel
			 * from cubeDirection(uFace, vQuad) (Chunks.Cube), so a surface made of noise is computed once, not at every
			 * frame. The vertex shader is Shaders.Quad (aPosition of a quad from -1 to 1, vQuad).
			 */
			Bake: function (cube, program, uniforms) {
				var target = gl.createFramebuffer();
				var face;
				var values;

				if (!gpuQuad)
					gpuQuad = mesh({Positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], Indices: [0, 1, 2, 0, 2, 3]});

				gl.bindFramebuffer(gl.FRAMEBUFFER, target);
				gl.viewport(0, 0, cube.Size, cube.Size);

				for (face = 0; face < 6; face++) {
					gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, cube.Handle, 0);

					values = Object.assign({}, uniforms || {}, {uFace: face});

					renderer.Draw(gpuQuad, program, values, {Depth: false, DepthWrite: false, Cull: 'none'});
				}

				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				gl.deleteFramebuffer(target);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube.Handle);
				gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
				gl.viewport(0, 0, renderer.Width, renderer.Height);

				return cube;
			},

			/* A depth texture seen from a light: what is drawn between Begin() and End() writes only into it. */
			Shadow: function (size) {
				var side = Math.max(1, Math.round(size || 2048));
				var handle = gl.createTexture();
				var target = gl.createFramebuffer();
				var map = {Handle: handle, Size: side};

				gl.bindTexture(gl.TEXTURE_2D, handle);
				gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, side, side);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
				gl.bindTexture(gl.TEXTURE_2D, null);

				gl.bindFramebuffer(gl.FRAMEBUFFER, target);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, handle, 0);
				gl.drawBuffers([gl.NONE]);
				gl.readBuffer(gl.NONE);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);

				map.Begin = function () {
					gl.bindFramebuffer(gl.FRAMEBUFFER, target);
					gl.viewport(0, 0, side, side);
					gl.depthMask(true);
					gl.clear(gl.DEPTH_BUFFER_BIT);
					gl.enable(gl.POLYGON_OFFSET_FILL);
					gl.polygonOffset(1.5, 3);
				};

				map.End = function () {
					gl.disable(gl.POLYGON_OFFSET_FILL);
					gl.bindFramebuffer(gl.FRAMEBUFFER, null);
					gl.viewport(0, 0, renderer.Width, renderer.Height);
				};

				map.Destroy = function () {
					gl.deleteFramebuffer(target);
					gl.deleteTexture(handle);

					textures.splice(textures.indexOf(map), 1);
				};

				textures.push(map);

				return map;
			},

			Resize: function (width, height, ratio) {
				var scale = ratio || settings.Ratio || 1;
				var w = Math.max(1, Math.round(width * scale));
				var h = Math.max(1, Math.round(height * scale));

				if (canvas.width !== w)
					canvas.width = w;

				if (canvas.height !== h)
					canvas.height = h;

				renderer.Width = w;
				renderer.Height = h;
				renderer.Ratio = scale;

				gl.viewport(0, 0, w, h);
			},

			Clear: function (color) {
				var value = color || [0, 0, 0, 1];

				gl.depthMask(true);
				gl.clearColor(value[0], value[1], value[2], value[3] === undefined ? 1 : value[3]);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			},

			Draw: function (made, program, uniforms, options) {
				var draw = options || {};
				var units = {Next: 0};
				var name = draw.Mode || made.Mode;
				var mode = modes.hasOwnProperty(name) ? modes[name] : gl.TRIANGLES;
				var instances = draw.Instances === undefined ? made.Instances : draw.Instances;

				if (renderer.Lost) return;

				gl.useProgram(program.Handle);

				Object.keys(uniforms || {}).forEach(function (name) {
					var info = program.Uniforms[name];
					if (info && uniforms[name] !== undefined && uniforms[name] !== null)
						uniform(info, uniforms[name], units);
				});

				if (draw.Depth === false) gl.disable(gl.DEPTH_TEST);
				else gl.enable(gl.DEPTH_TEST);

				gl.depthMask(draw.DepthWrite !== false);

				if (draw.Blend === 'add') {
					gl.enable(gl.BLEND);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
				}
				else if (draw.Blend === 'alpha') {
					gl.enable(gl.BLEND);
					gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
				}
				else {
					gl.disable(gl.BLEND);
				}

				if (draw.Cull === 'none' || draw.Cull === false) {
					gl.disable(gl.CULL_FACE);
				}
				else {
					gl.enable(gl.CULL_FACE);
					gl.cullFace(draw.Cull === 'front' ? gl.FRONT : gl.BACK);
				}

				gl.bindVertexArray(made.VAO);

				if (made.Indexed && instances) gl.drawElementsInstanced(mode, made.Count, made.IndexType, 0, instances);
				else if (made.Indexed) gl.drawElements(mode, made.Count, made.IndexType, 0);
				else if (instances) gl.drawArraysInstanced(mode, 0, made.Count, instances);
				else gl.drawArrays(mode, 0, made.Count);

				gl.bindVertexArray(null);
			},

			Destroy: function () {
				meshes.slice().forEach(function (each) {
					each.Destroy();
				});

				textures.slice().forEach(function (each) {
					each.Destroy();
				});

				Object.keys(programs).forEach(function (key) {
					gl.deleteProgram(programs[key].Handle);
				});

				Object.keys(shaders).forEach(function (key) {
					gl.deleteShader(shaders[key]);
				});

				programs = {};
				shaders = {};

				canvas.removeEventListener('webglcontextlost', lost);
				canvas.removeEventListener('webglcontextrestored', restored);
			}
		};

		function lost (event) {
			event.preventDefault();

			renderer.Lost = true;
		}

		/* A context given back has none of the old programs nor buffers: the owner makes its own again. */
		function restored () {
			programs = {};
			shaders = {};
			meshes = [];
			textures = [];
			gpuQuad = null;
			renderer.Lost = false;

			if (settings.Restored)
				settings.Restored(renderer);
		}

		canvas.addEventListener('webglcontextlost', lost);
		canvas.addEventListener('webglcontextrestored', restored);

		return renderer;
	}
});
