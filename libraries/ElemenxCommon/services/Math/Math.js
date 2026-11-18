/*
 * Math: the numbers of space, the same in a page, in a worker and in Node, for what draws (ElemenxGraphics) and what
 * computes (Physics, Astronomy...):
 * - Matrices of 4 by 4 are arrays of 16 numbers, column by column, as WebGL reads them: Identity(), Multiply(a, b),
 *   Invert(m), Translation(x, y, z), Rotation(axis, angle) (radians), Scaling(x, y, z), Compose(position, rotation,
 *   scale) (rotation a matrix, or null), Perspective(fov, aspect, near, far) (fov in degrees), Orthographic(left,
 *   right, bottom, top, near, far), LookAt(eye, target, up), NormalMatrix(m) (the 3 by 3 one of the normals),
 *   Apply(m, point) (a point [x, y, z] moved by it).
 * - Vectors are arrays [x, y, z]: Vectors.Add(a, b), Subtract, Scale(a, k), Dot, Cross, Length, Normalize, Lerp(a,
 *   b, t), Distance.
 * - Hit(ray, center, radius): how far along the ray ({Origin, Direction}) it meets a ball (-1: it does not).
 * - Noise(seed) returns a smooth noise of space: Value(x, y, z) (0 to 1), Fbm(x, y, z, octaves) (several of it, each
 *   finer and fainter) and Ridge (the folds of mountains). Without a seed it is the very noise of the shaders of
 *   Renderer (Chunks.Noise: noise3, fbm3, ridge3), to the float: a heightmap of the CPU matches a surface the GPU
 *   baked. SeedOffset(seed): the shift of the coordinates of a seed.
 * - PlaceRandom(x, z, other): a number of 0 to 1 of a place, the same for the same place (other: a second one of it): what
 *   sows things, lays caves and picks the land of a place. Spiral(index, count, turn): the point index of count spread
 *   evenly over a sphere along a spiral of the golden angle, turned by turn radians. Queue(): a heap that gives back the
 *   least F first (Push(item), Pop(), Size()): the ways and the rivers.
 * - Source(names) gives the source of members (Noise, SeedOffset, Vectors) to a worker of the Workers Service.
 */
Elemenx.Service('Math', {
	$Meta: {
		Description: 'The numbers of space: matrices, vectors, rays and a smooth noise, the same in a page, a worker and Node.',
		Methods: ['Identity()', 'Multiply(a, b)', 'Invert(m)', 'Translation(x, y, z)', 'Rotation(axis, angle)', 'Scaling(x, y, z)', 'Compose(position, rotation, scale)', 'Perspective(fov, aspect, near, far)', 'Orthographic(left, right, bottom, top, near, far)', 'LookAt(eye, target, up)', 'NormalMatrix(m)', 'Apply(m, point)', 'Hit(ray, center, radius)', 'Noise(seed)', 'SeedOffset(seed)', 'Source(names)', 'PlaceRandom(x, z, other)', 'Spiral(index, count, turn)', 'Queue()']
	},

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

	/*
	 * The noise of the shaders (Chunks.Noise), the same numbers in JavaScript: a hash of whole numbers (pcg3d), so the
	 * CPU and the GPU agree to the last bit on the corners and to a float on what is between them. A seed moves the
	 * coordinates (no seed: the very noise of the shaders, a heightmap that matches a baked surface).
	 */
	Noise: function (seed) {
		var offset = seed === undefined || seed === null || seed === '' ? 0 : this.SeedOffset(seed);
		/* The value noise of the Kernel of the Noise Service (one source of its numbers), its octaves of 2.03 and 0.5. */
		var code = this.$Service('Noise').Code();

		function octaves (x, y, z, count, ridged) {
			return code.n_octaves(0, x, y, z, count || 4, ridged ? 2 : 1, 2.03, 0.5, 1.7, 9.2, 3.1, false, 0, 0, 0, 1, 0, 0);
		}

		return {
			Value: function (x, y, z) {
				return code.n_value(x + offset, y + offset, z + offset, false, 0, 0, 0);
			},

			Fbm: function (x, y, z, count) {
				return octaves(x + offset, y + offset, z + offset, count, false);
			},

			Ridge: function (x, y, z, count) {
				return octaves(x + offset, y + offset, z + offset, count, true);
			}
		};
	},

	/* The source of its members, for a worker (Workers): they run there as they do here. */
	/* What a worker carries of this Service besides its methods. */
	Carried: ['Vectors'],

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* The shift of the coordinates of a seed: a number of hundreds, the same for the same seed. */
	/*
	 * A number of 0 to 1 of a place (x, z): the sine hash of 12.9898 and 78.233 (other: of 39.3468 and 11.135, apart from the
	 * first), the same for the same place; what sows things, lays caves and picks the land of a place. Regression: it was
	 * written out again in each of them.
	 */
	/*
	 * The index-th of count points spread evenly over a sphere of radius 1, along a spiral of the golden angle (2.39996),
	 * turned by turn more: [x, y, z], from the top (y 1) down. The plates, the sea and the towns of a planet are laid by it.
	 */
	/*
	 * The cheapest first of what is pushed ({F}: a binary heap): Push(item), Pop() (the one of the least F), Size().
	 * The one heap of the ways of a ground, the highways and the rivers of a planet: the same order for the same pushes.
	 * Regression: a way found by sorting all that was open at each step took minutes where there was none, the page held;
	 * then it was written out again in each of them.
	 */
	Queue: function () {
		var items = [];

		return {
			Size: function () {
				return items.length;
			},

			Push: function (item) {
				var at = items.length;

				items.push(item);

				while (at > 0) {
					var up = (at - 1) >> 1;
					if (items[up].F <= item.F) break;

					items[at] = items[up];
					at = up;
				}

				items[at] = item;
			},

			Pop: function () {
				var first = items[0];
				var last = items.pop();
				var at = 0;

				if (!items.length) return first;

				while (true) {
					var left = at * 2 + 1;
					var right = left + 1;
					var least = right < items.length && items[right].F < items[left].F ? right : left;
					if (left >= items.length || items[least].F >= last.F) break;

					items[at] = items[least];
					at = least;
				}

				items[at] = last;

				return first;
			}
		};
	},

	Spiral: function (index, count, turn) {
		var y = 1 - (index + 0.5) / count * 2;
		var around = Math.sqrt(Math.max(0, 1 - y * y));
		var angle = turn ? index * 2.39996 + turn : index * 2.39996;

		return [Math.cos(angle) * around, y, Math.sin(angle) * around];
	},

	PlaceRandom: function (x, z, other) {
		return other ? Math.abs(Math.sin(x * 39.3468 + z * 11.135) * 24634.6345) % 1 : Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
	},

	SeedOffset: function (seed) {
		var text = String(seed);
		var state = 2166136261;
		var i;

		for (i = 0; i < text.length; i++)
			state = Math.imul(state ^ text.charCodeAt(i), 16777619) >>> 0;

		return state % 997 + 0.5;
	}
});
