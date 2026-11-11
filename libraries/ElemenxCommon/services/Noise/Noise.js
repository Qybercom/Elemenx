/*
 * Noise: the noise of space by any of its algorithms and with what is done to it, one description for all that is made
 * of noise (a ground, a texture, a field of growth, a flow), the same in the page, in a worker, in Node and in a shader.
 * - A noise is described by a spec: {Type (value, perlin, simplex, worley, white), Seed, Scale (the size of its features,
 *   in the units it is sampled in: 1), Offset ([x, y, z]), Fractal (none, fbm, ridged, billow), Octaves (4), Lacunarity
 *   (how much finer each octave is: 2.03; whole numbers when it tiles), Gain (how much fainter: 0.5), Shift ([x, y, z],
 *   added to each octave: [1.7, 9.2, 3.1]), Cell ({Distance: euclid, manhattan or chebyshev; Return: f1, f2, edge (f2
 *   less f1) or cell (a number of its cell); Jitter, 0 to 1}: of worley), Warp ({Amount (in features), Scale (of the warp
 *   to the noise: 1), Octaves (2)}: the space bent by a noise of its own before it is read), Tile ([x, y, z]: features
 *   along each axis after which it repeats, 0 not; value, perlin, worley and white), Terrace ({Steps, Sharp (0 smooth
 *   to 1 hard steps)}), Power, Invert, Range ([low, high]: what 0 and 1 become)}. A spec may also be {Combine (add,
 *   multiply, min, max, mask), Of ([specs]), Weights (of add), Mask (a spec: mask mixes the first two by it)} and the
 *   same post (Terrace, Power, Invert, Range). Value with fbm (6 octaves) is Fbm of Math.Noise, to the bit.
 * - Make(spec) is its sampler: At(x, y, z) (0 to 1 before Range; z may be left out), Gradient(x, y, z) ([x, y, z]),
 *   Curl(x, y, z) (a flow with no source nor sink: what moves smoke, dust, water), Grid(options) (a Float32Array of
 *   Width by Height values, row by row, from X, Y with a Step, on the Plane xz, the default, or xy; Z the third axis).
 * - Types(), Fractals(): the names they may be.
 * - GLSLChunk(): the functions a shader needs once (enx_hash3, enx_value3, enx_perlin3, enx_simplex3, enx_worley3);
 *   GLSL(spec, name): a function float name(vec3 p) of the spec, after them: the same numbers as At, to the float;
 *   GLSLLines(spec, prefix, point): the same as lines of the body of a shader ({Lines, Value}), with no function of
 *   its own (a block of a graph of shaders).
 * - Source(names) gives its members to a worker of the Workers Service.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Noise', {
	$Meta: {
		Description: 'The noise of space by any algorithm (value, perlin, simplex, worley, white), with fractals, warp, tiling, terraces and blends, the same in a shader.',
		Methods: ['Make(spec)', 'Types()', 'Fractals()', 'GLSLChunk()', 'GLSL(spec, name)', 'GLSLLines(spec, prefix, point)', 'Source(names)']
	},

	Types: function () {
		return ['value', 'perlin', 'simplex', 'worley', 'white'];
	},

	Fractals: function () {
		return ['none', 'fbm', 'ridged', 'billow'];
	},

	Source: function (names) {
		return this.$Service('Workers').Source(this, names);
	},

	/* A spec with what it does not tell: the defaults, the offset of its seed. */
	Whole: function (spec) {
		var given = spec || {};
		var math = this.$Service('Math');
		var tile = given.Tile ? [].concat(given.Tile).concat([0, 0, 0]).slice(0, 3).map(Number) : null;
		var tiled = !!tile && tile.some(function (period) {
			return period > 0;
		});
		var lacunarity = given.Lacunarity === undefined ? tiled ? 2 : 2.03 : Number(given.Lacunarity);

		return {
			Type: this.Types().indexOf(given.Type) === -1 ? 'value' : given.Type,
			Seed: given.Seed === undefined || given.Seed === null || given.Seed === '' ? 0 : math.SeedOffset(given.Seed),
			Scale: Number(given.Scale) || 1,
			Offset: [].concat(given.Offset || []).concat([0, 0, 0]).slice(0, 3).map(Number),
			Fractal: this.Fractals().indexOf(given.Fractal) === -1 ? given.Octaves > 1 ? 'fbm' : 'none' : given.Fractal,
			Octaves: Math.max(1, Math.min(10, Math.round(Number(given.Octaves) || 4))),
			Lacunarity: tiled ? Math.max(1, Math.round(lacunarity)) : lacunarity,
			Gain: given.Gain === undefined ? 0.5 : Number(given.Gain),
			Shift: given.Shift ? [].concat(given.Shift).concat([0, 0, 0]).slice(0, 3).map(Number) : [1.7, 9.2, 3.1],
			Distance: given.Cell && given.Cell.Distance || 'euclid',
			Return: given.Cell && given.Cell.Return || 'f1',
			Jitter: given.Cell && given.Cell.Jitter !== undefined ? Number(given.Cell.Jitter) : 1,
			Warp: given.Warp && Number(given.Warp.Amount) ? {Amount: Number(given.Warp.Amount), Scale: Number(given.Warp.Scale) || 1, Octaves: Math.max(1, Math.round(Number(given.Warp.Octaves) || 2))} : null,
			Tile: tiled ? tile : null,
			Post: this.Post(given)
		};
	},

	/* What is done to a value after it is read: terraces, a power, the other way round, a range. */
	Post: function (given) {
		return {
			Steps: given.Terrace ? Math.max(1, Number(given.Terrace.Steps) || 4) : 0,
			Sharp: given.Terrace ? Math.max(0, Math.min(1, Number(given.Terrace.Sharp === undefined ? 1 : given.Terrace.Sharp))) : 0,
			Power: given.Power === undefined ? 1 : Number(given.Power),
			Invert: !!given.Invert && given.Invert !== 'false',
			Range: given.Range ? [Number(given.Range[0]), Number(given.Range[1])] : null
		};
	},

	Finish: function (post, value) {
		var t;
		var step;

		if (post.Steps) {
			t = value * post.Steps;
			step = Math.floor(t);
			value = Math.min(1, (step + (post.Sharp >= 1 ? 0 : Math.pow(t - step, 1 + post.Sharp * 15))) / post.Steps);
		}

		if (post.Power !== 1)
			value = Math.pow(Math.max(0, value), post.Power);

		if (post.Invert)
			value = 1 - value;

		return post.Range ? post.Range[0] + value * (post.Range[1] - post.Range[0]) : value;
	},

	/* The hash of a point of the lattice, 0 to 1: that of Math.Noise and of the shaders of Renderer (pcg3). */
	Hash: function (x, y, z) {
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
	},

	Make: function (spec) {
		var self = this;
		var given = spec || {};
		var whole;
		var parts;
		var mask;
		var post;
		var sampler;

		/* A blend of noises. */
		if (given.Combine) {
			parts = (given.Of || []).map(function (one) {
				return self.Make(one);
			});
			mask = given.Mask ? this.Make(given.Mask) : null;
			post = this.Post(given);

			sampler = function (x, y, z) {
				var values = parts.map(function (part) {
					return part.At(x, y, z);
				});
				var weights = given.Weights || [];
				var total = 0;
				var sum = 0;
				var value;

				switch (given.Combine) {
					case 'multiply':
						value = values.reduce(function (product, one) {
							return product * one;
						}, 1);

						break;
					case 'min':
						value = Math.min.apply(Math, values);

						break;
					case 'max':
						value = Math.max.apply(Math, values);

						break;
					case 'mask':
						value = (values[0] || 0) + ((values[1] || 0) - (values[0] || 0)) * (mask ? mask.At(x, y, z) : 0.5);

						break;
					default:
						values.forEach(function (one, index) {
							var weight = weights[index] === undefined ? 1 : Number(weights[index]);

							total += one * weight;
							sum += weight;
						});

						value = sum ? total / sum : 0;
				}

				return self.Finish(post, value);
			};

			return this.Sampler(sampler);
		}

		whole = this.Whole(given);

		return this.Sampler(function (x, y, z) {
			return self.Read(whole, x, y, z);
		});
	},

	/* The methods of a sampler of a function of space. */
	Sampler: function (read) {
		function at (x, y, z) {
			return read(Number(x) || 0, Number(y) || 0, Number(z) || 0);
		}

		function gradient (x, y, z) {
			var e = 0.01;

			return [(at(x + e, y, z) - at(x - e, y, z)) / (2 * e), (at(x, y + e, z) - at(x, y - e, z)) / (2 * e), (at(x, y, z + e) - at(x, y, z - e)) / (2 * e)];
		}

		return {
			At: at,
			Gradient: gradient,

			/* The curl of three noises apart (the same one, shifted): a flow that swirls and neither gathers nor spreads. */
			Curl: function (x, y, z) {
				var a = gradient(x, y, z);
				var b = gradient(x + 31.4, y + 17.7, z - 9.3);
				var c = gradient(x - 21.1, y + 41.9, z + 13.6);

				return [c[1] - b[2], a[2] - c[0], b[0] - a[1]];
			},

			Grid: function (options) {
				var given = options || {};
				var width = Math.max(1, Math.round(Number(given.Width) || 64));
				var height = Math.max(1, Math.round(Number(given.Height) || width));
				var step = Number(given.Step) || 1;
				var x0 = Number(given.X) || 0;
				var y0 = Number(given.Y) || 0;
				var depth = Number(given.Z) || 0;
				var flat = given.Plane === 'xy';
				var made = new Float32Array(width * height);
				var i;
				var j;

				for (j = 0; j < height; j++) {
					for (i = 0; i < width; i++)
						made[j * width + i] = flat ? at(x0 + i * step, y0 + j * step, depth) : at(x0 + i * step, depth, y0 + j * step);
				}

				return made;
			}
		};
	},

	/* A value of a whole spec at a point: the space warped, the octaves of its fractal, what is done after. */
	Read: function (whole, x, y, z) {
		var px = x / whole.Scale + whole.Offset[0] + whole.Seed;
		var py = y / whole.Scale + whole.Offset[1] + whole.Seed;
		var pz = z / whole.Scale + whole.Offset[2] + whole.Seed;
		var warp = whole.Warp;
		var qx;
		var qy;
		var qz;

		/* Of no array nor function made at each point (see Simplex). */
		if (warp) {
			qx = this.Octaves(whole, px * warp.Scale + 0 * 5.2, py * warp.Scale + 0 * 1.3, pz * warp.Scale + 0 * 2.8, warp.Octaves, 'fbm');
			qy = this.Octaves(whole, px * warp.Scale + 1 * 5.2, py * warp.Scale + 1 * 1.3, pz * warp.Scale + 1 * 2.8, warp.Octaves, 'fbm');
			qz = this.Octaves(whole, px * warp.Scale + 2 * 5.2, py * warp.Scale + 2 * 1.3, pz * warp.Scale + 2 * 2.8, warp.Octaves, 'fbm');
			px = px + (qx * 2 - 1) * warp.Amount;
			py = py + (qy * 2 - 1) * warp.Amount;
			pz = pz + (qz * 2 - 1) * warp.Amount;
		}

		return this.Finish(whole.Post, this.Octaves(whole, px, py, pz, whole.Fractal === 'none' ? 1 : whole.Octaves, whole.Fractal));
	},

	/* The octaves of a fractal, each finer and fainter: fbm as it is, ridged the folds of mountains, billow round heaps. */
	Octaves: function (whole, x, y, z, count, fractal) {
		var total = 0;
		var amplitude = 0.5;
		var weight = 0;
		var period = whole.Tile ? whole.Tile.slice() : null;
		var octave;
		var n;

		for (octave = 0; octave < count; octave++) {
			n = this.Base(whole, x, y, z, period);

			if (fractal === 'ridged') n = 1 - Math.abs(n * 2 - 1);
			else if (fractal === 'billow') n = Math.abs(n * 2 - 1);

			total += n * amplitude;
			weight += amplitude;
			x = x * whole.Lacunarity + whole.Shift[0];
			y = y * whole.Lacunarity + whole.Shift[1];
			z = z * whole.Lacunarity + whole.Shift[2];
			amplitude *= whole.Gain;

			if (period)
				period = period.map(function (one) {
					return one * whole.Lacunarity;
				});
		}

		return weight ? total / weight : 0;
	},

	/* The noise of its type at a point, 0 to 1; period: the lattice wrapped (a tiled one). */
	Base: function (whole, x, y, z, period) {
		switch (whole.Type) {
			case 'perlin':
				return this.Perlin(x, y, z, period);
			case 'simplex':
				return this.Simplex(x, y, z);
			case 'worley':
				return this.Worley(x, y, z, whole, period);
			case 'white':
				return this.Lattice(Math.floor(x), Math.floor(y), Math.floor(z), period);
			default:
				return this.Value(x, y, z, period);
		}
	},

	/* The hash of a point of a lattice wrapped by a period (0: not). */
	Lattice: function (x, y, z, period) {
		function wrap (value, size) {
			return size > 0 ? (value % size + size) % size : value;
		}

		return period ? this.Hash(wrap(x, period[0]), wrap(y, period[1]), wrap(z, period[2])) : this.Hash(x, y, z);
	},

	Fade: function (t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	},

	Value: function (x, y, z, period) {
		var ix = Math.floor(x);
		var iy = Math.floor(y);
		var iz = Math.floor(z);
		var fx = this.Fade(x - ix);
		var fy = this.Fade(y - iy);
		var fz = this.Fade(z - iz);
		var self = this;

		function h (dx, dy, dz) {
			return self.Lattice(ix + dx, iy + dy, iz + dz, period);
		}

		function mix (a, b, t) {
			return a + (b - a) * t;
		}

		return mix(mix(mix(h(0, 0, 0), h(1, 0, 0), fx), mix(h(0, 1, 0), h(1, 1, 0), fx), fy), mix(mix(h(0, 0, 1), h(1, 0, 1), fx), mix(h(0, 1, 1), h(1, 1, 1), fx), fy), fz);
	},

	/* One of the twelve gradients of a point of the lattice, by its hash, dotted with where the point is from it. */
	Gradient: function (hash, x, y, z) {
		var g = Math.floor(hash * 12) % 12;
		var u = g < 8 ? x : y;
		var v = g < 4 ? y : g === 12 || g === 14 ? x : z;

		return ((g & 1) === 0 ? u : -u) + ((g & 2) === 0 ? v : -v);
	},

	Perlin: function (x, y, z, period) {
		var self = this;
		var ix = Math.floor(x);
		var iy = Math.floor(y);
		var iz = Math.floor(z);
		var fx = x - ix;
		var fy = y - iy;
		var fz = z - iz;
		var u = this.Fade(fx);
		var v = this.Fade(fy);
		var w = this.Fade(fz);

		function g (dx, dy, dz) {
			return self.Gradient(self.Lattice(ix + dx, iy + dy, iz + dz, period), fx - dx, fy - dy, fz - dz);
		}

		function mix (a, b, t) {
			return a + (b - a) * t;
		}

		return Math.max(0, Math.min(1, mix(mix(mix(g(0, 0, 0), g(1, 0, 0), u), mix(g(0, 1, 0), g(1, 1, 0), u), v), mix(mix(g(0, 0, 1), g(1, 0, 1), u), mix(g(0, 1, 1), g(1, 1, 1), u), v), w) * 0.5 + 0.5));
	},

	/* Simplex noise of three dimensions: four corners of a tetrahedron each point, smoother and lighter than perlin. */
	/*
	 * Regression: its corners and their order were arrays and a function made at each call: half the time of a planet's
	 * picture of a square was spent here and in collecting them. The same numbers, to the bit, of none.
	 */
	Simplex: function (x, y, z) {
		var F3 = 1 / 3;
		var G3 = 1 / 6;
		var s = (x + y + z) * F3;
		var i = Math.floor(x + s);
		var j = Math.floor(y + s);
		var k = Math.floor(z + s);
		var t = (i + j + k) * G3;
		var x0 = x - (i - t);
		var y0 = y - (j - t);
		var z0 = z - (k - t);
		var total = 0;
		/* The two corners between the first and the last, by the order of the three coordinates. */
		var order = this.Orders[x0 >= y0 ? y0 >= z0 ? 0 : x0 >= z0 ? 1 : 2 : y0 < z0 ? 3 : x0 < z0 ? 4 : 5];

		total += this.Corner(i, j, k, x0, y0, z0);
		total += this.Corner(i + order[0], j + order[1], k + order[2], x0 - order[0] + G3, y0 - order[1] + G3, z0 - order[2] + G3);
		total += this.Corner(i + order[3], j + order[4], k + order[5], x0 - order[3] + 2 * G3, y0 - order[4] + 2 * G3, z0 - order[5] + 2 * G3);
		total += this.Corner(i + 1, j + 1, k + 1, x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3);

		return Math.max(0, Math.min(1, total * 16 + 0.5));
	},

	/* The second and the third corner of a simplex (of Simplex), by the order of its coordinates: made once. */
	Orders: [[1, 0, 0, 1, 1, 0], [1, 0, 0, 1, 0, 1], [0, 0, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1], [0, 1, 0, 0, 1, 1], [0, 1, 0, 1, 1, 0]],

	/* What a worker carries of this Service besides its methods: its tables. */
	Carried: ['Orders'],

	/* What a corner of the lattice (i, j, k) gives a point dx, dy, dz from it, of simplex noise: none past its reach. */
	Corner: function (i, j, k, dx, dy, dz) {
		var falloff = 0.6 - dx * dx - dy * dy - dz * dz;
		if (falloff <= 0) return 0;

		falloff *= falloff;

		return falloff * falloff * this.Gradient(this.Hash(i, j, k), dx, dy, dz);
	},

	/* Worley (cellular) noise: a point in each cell of the lattice; the distance to the nearest, to the next, the edge between them, or a number of its cell. */
	Worley: function (x, y, z, whole, period) {
		var ix = Math.floor(x);
		var iy = Math.floor(y);
		var iz = Math.floor(z);
		var first = Infinity;
		var second = Infinity;
		var cell = 0;
		var dx;
		var dy;
		var dz;

		for (dz = -1; dz <= 1; dz++) {
			for (dy = -1; dy <= 1; dy++) {
				for (dx = -1; dx <= 1; dx++) {
					var cx = ix + dx;
					var cy = iy + dy;
					var cz = iz + dz;
					var px = cx + 0.5 + (this.Lattice(cx, cy, cz, period) - 0.5) * whole.Jitter;
					var py = cy + 0.5 + (this.Lattice(cx + 131, cy - 71, cz + 37, period) - 0.5) * whole.Jitter;
					var pz = cz + 0.5 + (this.Lattice(cx - 59, cy + 113, cz - 17, period) - 0.5) * whole.Jitter;
					var ax = Math.abs(px - x);
					var ay = Math.abs(py - y);
					var az = Math.abs(pz - z);
					var far = whole.Distance === 'manhattan' ? ax + ay + az : whole.Distance === 'chebyshev' ? Math.max(ax, ay, az) : Math.sqrt(ax * ax + ay * ay + az * az);

					if (far < first) {
						second = first;
						first = far;
						cell = this.Lattice(cx + 7, cy + 7, cz + 7, period);
					}
					else if (far < second) {
						second = far;
					}
				}
			}
		}

		if (whole.Return === 'cell') return cell;

		if (whole.Return === 'f2')
			return Math.min(1, second);

		if (whole.Return === 'edge')
			return Math.min(1, second - first);

		return Math.min(1, first);
	},

	/* The functions a shader needs once, before those of GLSL: the same hash and the same noises as the page. */
	GLSLChunk: function () {
		return [
			'uvec3 enx_pcg(uvec3 v) {',
			'	v = v * 1664525u + 1013904223u;',
			'	v.x += v.y * v.z;',
			'	v.y += v.z * v.x;',
			'	v.z += v.x * v.y;',
			'	v ^= v >> 16u;',
			'	v.x += v.y * v.z;',
			'	return v;',
			'}',
			'float enx_hash3(vec3 p, vec3 period) {',
			'	vec3 q = p;',
			'	if (period.x > 0.0) q.x = mod(q.x, period.x);',
			'	if (period.y > 0.0) q.y = mod(q.y, period.y);',
			'	if (period.z > 0.0) q.z = mod(q.z, period.z);',
			'	uvec3 u = uvec3(ivec3(floor(q + 0.5)) + ivec3(65536));',
			'	return float(enx_pcg(u).x & 16777215u) / 16777215.0;',
			'}',
			'vec3 enx_fade(vec3 t) {',
			'	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);',
			'}',
			'float enx_value3(vec3 x, vec3 period) {',
			'	vec3 i = floor(x);',
			'	vec3 f = enx_fade(x - i);',
			'	return mix(mix(mix(enx_hash3(i, period), enx_hash3(i + vec3(1.0, 0.0, 0.0), period), f.x), mix(enx_hash3(i + vec3(0.0, 1.0, 0.0), period), enx_hash3(i + vec3(1.0, 1.0, 0.0), period), f.x), f.y),',
			'		mix(mix(enx_hash3(i + vec3(0.0, 0.0, 1.0), period), enx_hash3(i + vec3(1.0, 0.0, 1.0), period), f.x), mix(enx_hash3(i + vec3(0.0, 1.0, 1.0), period), enx_hash3(i + vec3(1.0, 1.0, 1.0), period), f.x), f.y), f.z);',
			'}',
			'float enx_grad(float hash, vec3 d) {',
			'	int g = int(floor(hash * 12.0)) % 12;',
			'	float u = g < 8 ? d.x : d.y;',
			'	float v = g < 4 ? d.y : (g == 12 || g == 14 ? d.x : d.z);',
			'	return ((g & 1) == 0 ? u : -u) + ((g & 2) == 0 ? v : -v);',
			'}',
			'float enx_perlin3(vec3 x, vec3 period) {',
			'	vec3 i = floor(x);',
			'	vec3 f = x - i;',
			'	vec3 w = enx_fade(f);',
			'	float a = enx_grad(enx_hash3(i, period), f);',
			'	float b = enx_grad(enx_hash3(i + vec3(1.0, 0.0, 0.0), period), f - vec3(1.0, 0.0, 0.0));',
			'	float c = enx_grad(enx_hash3(i + vec3(0.0, 1.0, 0.0), period), f - vec3(0.0, 1.0, 0.0));',
			'	float d = enx_grad(enx_hash3(i + vec3(1.0, 1.0, 0.0), period), f - vec3(1.0, 1.0, 0.0));',
			'	float e = enx_grad(enx_hash3(i + vec3(0.0, 0.0, 1.0), period), f - vec3(0.0, 0.0, 1.0));',
			'	float g = enx_grad(enx_hash3(i + vec3(1.0, 0.0, 1.0), period), f - vec3(1.0, 0.0, 1.0));',
			'	float h = enx_grad(enx_hash3(i + vec3(0.0, 1.0, 1.0), period), f - vec3(0.0, 1.0, 1.0));',
			'	float k = enx_grad(enx_hash3(i + vec3(1.0, 1.0, 1.0), period), f - vec3(1.0, 1.0, 1.0));',
			'	return clamp(mix(mix(mix(a, b, w.x), mix(c, d, w.x), w.y), mix(mix(e, g, w.x), mix(h, k, w.x), w.y), w.z) * 0.5 + 0.5, 0.0, 1.0);',
			'}',
			'float enx_simplex3(vec3 v) {',
			'	const float F3 = 1.0 / 3.0;',
			'	const float G3 = 1.0 / 6.0;',
			'	vec3 i = floor(v + (v.x + v.y + v.z) * F3);',
			'	vec3 x0 = v - (i - (i.x + i.y + i.z) * G3);',
			'	vec3 i1;',
			'	vec3 i2;',
			'	if (x0.x >= x0.y) {',
			'		if (x0.y >= x0.z) { i1 = vec3(1.0, 0.0, 0.0); i2 = vec3(1.0, 1.0, 0.0); }',
			'		else if (x0.x >= x0.z) { i1 = vec3(1.0, 0.0, 0.0); i2 = vec3(1.0, 0.0, 1.0); }',
			'		else { i1 = vec3(0.0, 0.0, 1.0); i2 = vec3(1.0, 0.0, 1.0); }',
			'	}',
			'	else {',
			'		if (x0.y < x0.z) { i1 = vec3(0.0, 0.0, 1.0); i2 = vec3(0.0, 1.0, 1.0); }',
			'		else if (x0.x < x0.z) { i1 = vec3(0.0, 1.0, 0.0); i2 = vec3(0.0, 1.0, 1.0); }',
			'		else { i1 = vec3(0.0, 1.0, 0.0); i2 = vec3(1.0, 1.0, 0.0); }',
			'	}',
			'	float total = 0.0;',
			'	vec3 corners[4] = vec3[4](vec3(0.0), i1, i2, vec3(1.0));',
			'	for (int n = 0; n < 4; n++) {',
			'		vec3 d = x0 - corners[n] + float(n) * G3;',
			'		float falloff = 0.6 - dot(d, d);',
			'		if (falloff > 0.0) {',
			'			falloff *= falloff;',
			'			total += falloff * falloff * enx_grad(enx_hash3(i + corners[n], vec3(0.0)), d);',
			'		}',
			'	}',
			'	return clamp(total * 16.0 + 0.5, 0.0, 1.0);',
			'}',
			'float enx_worley3(vec3 x, vec3 period, float jitter, int metric, int ret) {',
			'	vec3 i = floor(x);',
			'	float first = 1e9;',
			'	float second = 1e9;',
			'	float cell = 0.0;',
			'	for (int dz = -1; dz <= 1; dz++)',
			'	for (int dy = -1; dy <= 1; dy++)',
			'	for (int dx = -1; dx <= 1; dx++) {',
			'		vec3 c = i + vec3(float(dx), float(dy), float(dz));',
			'		vec3 p = c + 0.5 + (vec3(enx_hash3(c, period), enx_hash3(c + vec3(131.0, -71.0, 37.0), period), enx_hash3(c + vec3(-59.0, 113.0, -17.0), period)) - 0.5) * jitter;',
			'		vec3 a = abs(p - x);',
			'		float far = metric == 1 ? a.x + a.y + a.z : metric == 2 ? max(a.x, max(a.y, a.z)) : length(p - x);',
			'		if (far < first) { second = first; first = far; cell = enx_hash3(c + 7.0, period); }',
			'		else if (far < second) { second = far; }',
			'	}',
			'	if (ret == 3) return cell;',
			'	if (ret == 1) return min(1.0, second);',
			'	if (ret == 2) return min(1.0, second - first);',
			'	return min(1.0, first);',
			'}'
		].join('\n');
	},

	/*
	 * The function of a spec for a shader, float name(vec3 p), after GLSLChunk: its numbers baked in. A blend makes a
	 * function of each of its noises too (name_0, name_1...).
	 */
	GLSL: function (spec, name) {
		var self = this;
		var given = spec || {};
		var made = [];
		var lines;
		var body;

		function number (value) {
			var text = String(Number(value));

			return /[.eE]/.test(text) ? text : text + '.0';
		}

		function finish (post, value) {
			var lines = ['\tfloat value = ' + value + ';'];

			if (post.Steps)
				lines.push('\t{ float t = value * ' + number(post.Steps) + '; float s = floor(t); value = min(1.0, (s + ' + (post.Sharp >= 1 ? '0.0' : 'pow(t - s, ' + number(1 + post.Sharp * 15) + ')') + ') / ' + number(post.Steps) + '); }');

			if (post.Power !== 1)
				lines.push('\tvalue = pow(max(0.0, value), ' + number(post.Power) + ');');

			if (post.Invert)
				lines.push('\tvalue = 1.0 - value;');

			if (post.Range)
				lines.push('\tvalue = ' + number(post.Range[0]) + ' + value * ' + number(post.Range[1] - post.Range[0]) + ';');

			lines.push('\treturn value;');

			return lines.join('\n');
		}

		name = name || 'enx_noise';

		if (given.Combine) {
			(given.Of || []).forEach(function (one, index) {
				made.push(self.GLSL(one, name + '_' + index));
			});

			if (given.Mask)
				made.push(this.GLSL(given.Mask, name + '_mask'));

			body = (function () {
				var count = (given.Of || []).length;
				var weights = given.Weights || [];
				var calls = [];
				var i;

				for (i = 0; i < count; i++)
					calls.push(name + '_' + i + '(p)');

				switch (given.Combine) {
					case 'multiply':
						return calls.join(' * ') || '1.0';
					case 'min':
						return calls.reduce(function (all, one) {
							return 'min(' + all + ', ' + one + ')';
						});
					case 'max':
						return calls.reduce(function (all, one) {
							return 'max(' + all + ', ' + one + ')';
						});
					case 'mask':
						return 'mix(' + (calls[0] || '0.0') + ', ' + (calls[1] || '0.0') + ', ' + (given.Mask ? name + '_mask(p)' : '0.5') + ')';
					default:
						return '(' + calls.map(function (call, index) {
							return call + ' * ' + number(weights[index] === undefined ? 1 : weights[index]);
						}).join(' + ') + ') / ' + number(calls.map(function (call, index) {
							return weights[index] === undefined ? 1 : Number(weights[index]);
						}).reduce(function (sum, one) {
							return sum + one;
						}, 0) || 1);
				}
			})();

			return made.join('\n') + '\nfloat ' + name + '(vec3 p) {\n' + finish(this.Post(given), body) + '\n}';
		}

		lines = this.GLSLLines(given, name, 'p');

		return 'float ' + name + '(vec3 p) {\n\t' + lines.Lines.join('\n\t') + '\n\treturn ' + lines.Value + ';\n}';
	},

	/*
	 * A noise of a spec (not a blend) as lines of GLSL in the body of a shader, after GLSLChunk: Lines (its variables named
	 * after prefix, its loops in scopes of their own) and Value, the variable that holds it, of the point (a vec3).
	 */
	GLSLLines: function (spec, prefix, point) {
		var whole = this.Whole(spec || {});
		var lines = [];
		var q = prefix + '_q';
		var value = prefix + '_value';

		function number (value) {
			var text = String(Number(value));

			return /[.eE]/.test(text) ? text : text + '.0';
		}

		function vector (list) {
			return 'vec3(' + list.map(number).join(', ') + ')';
		}

		function base (at, period) {
			switch (whole.Type) {
				case 'perlin':
					return 'enx_perlin3(' + at + ', ' + period + ')';
				case 'simplex':
					return 'enx_simplex3(' + at + ')';
				case 'worley':
					return 'enx_worley3(' + at + ', ' + period + ', ' + number(whole.Jitter) + ', ' + ['euclid', 'manhattan', 'chebyshev'].indexOf(whole.Distance) + ', ' + ['f1', 'f2', 'edge', 'cell'].indexOf(whole.Return) + ')';
				case 'white':
					return 'enx_hash3(floor(' + at + '), ' + period + ')';
				default:
					return 'enx_value3(' + at + ', ' + period + ')';
			}
		}

		/* The octaves of a fractal into a variable, from a point. */
		function octaves (target, start, count, fractal) {
			var n = fractal === 'ridged' ? '1.0 - abs(n * 2.0 - 1.0)' : fractal === 'billow' ? 'abs(n * 2.0 - 1.0)' : 'n';

			lines.push('float ' + target + ' = 0.0;');
			lines.push('{ vec3 at = ' + start + '; float amplitude = 0.5; float weight = 0.0; vec3 period = ' + vector(whole.Tile || [0, 0, 0]) + ';');
			lines.push('for (int o = 0; o < ' + count + '; o++) { float n = ' + base('at', 'period') + '; n = ' + n + '; ' + target + ' += n * amplitude; weight += amplitude; at = at * ' + number(whole.Lacunarity) + ' + ' + vector(whole.Shift) + '; amplitude *= ' + number(whole.Gain) + '; period *= ' + number(whole.Lacunarity) + '; }');
			lines.push(target + ' /= weight; }');
		}

		lines.push('vec3 ' + q + ' = (' + point + ') / ' + number(whole.Scale) + ' + ' + vector(whole.Offset) + ' + vec3(' + number(whole.Seed) + ');');

		if (whole.Warp) {
			[0, 1, 2].forEach(function (axis) {
				octaves(prefix + '_warp' + axis, q + ' * ' + number(whole.Warp.Scale) + ' + ' + vector([axis * 5.2, axis * 1.3, axis * 2.8]), whole.Warp.Octaves, 'fbm');
			});

			lines.push(q + ' += (vec3(' + prefix + '_warp0, ' + prefix + '_warp1, ' + prefix + '_warp2) * 2.0 - 1.0) * ' + number(whole.Warp.Amount) + ';');
		}

		octaves(value, q, whole.Fractal === 'none' ? 1 : whole.Octaves, whole.Fractal);

		if (whole.Post.Steps)
			lines.push('{ float t = ' + value + ' * ' + number(whole.Post.Steps) + '; float s = floor(t); ' + value + ' = min(1.0, (s + ' + (whole.Post.Sharp >= 1 ? '0.0' : 'pow(t - s, ' + number(1 + whole.Post.Sharp * 15) + ')') + ') / ' + number(whole.Post.Steps) + '); }');

		if (whole.Post.Power !== 1)
			lines.push(value + ' = pow(max(0.0, ' + value + '), ' + number(whole.Post.Power) + ');');

		if (whole.Post.Invert)
			lines.push(value + ' = 1.0 - ' + value + ';');

		if (whole.Post.Range)
			lines.push(value + ' = ' + number(whole.Post.Range[0]) + ' + ' + value + ' * ' + number(whole.Post.Range[1] - whole.Post.Range[0]) + ';');

		return {Lines: lines, Value: value};
	}
});
