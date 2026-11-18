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
 * - Its numbers are of one source, Kernel (the kernel language of Elemenx.Compilers): Code() its functions as js (made in
 *   the page; a worker makes them of the text it carries, Compiled), IR() the module of the IR (for a graph of noise of
 *   Blueprints.Numeric), Wasm() the wasm of it ({Bytes, Exports}, n_read in batches: Batch('n_read', points, count,
 *   Numbers(Whole(spec)))), the very numbers of its js. Whole(spec) a spec with its defaults, Numbers(whole) the 31
 *   numbers of it n_read takes before its point.
 * The same functions run in Node: they read no page.
 */
Elemenx.Service('Noise', {
	$Meta: {
		Description: 'The noise of space by any algorithm (value, perlin, simplex, worley, white), with fractals, warp, tiling, terraces and blends, the same in a shader.',
		Methods: ['Make(spec)', 'Types()', 'Fractals()', 'GLSLChunk()', 'GLSL(spec, name)', 'GLSLLines(spec, prefix, point)', 'Source(names)', 'Code()', 'IR()', 'Wasm()', 'Numbers(whole)', 'Whole(spec)']
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

	/*
	 * The noise in the kernel language of Elemenx.Compilers: the one source of its numbers, made js here (and in a worker,
	 * of the text it carries) and wasm (Wasm()). Types: 0 value, 1 perlin, 2 simplex, 3 worley, 4 white; fractals: 0 none,
	 * 1 fbm, 2 ridged, 3 billow; distances of worley: 0 euclid, 1 manhattan, 2 chebyshev; what it returns: 0 f1, 1 f2,
	 * 2 edge, 3 cell. A lattice wrapped by a period (tiled) for value, perlin, worley and white.
	 */
	Kernel: [
		/* The hash of a point of the lattice, 0 to 1: that of Math.Noise and of the shaders of Renderer (pcg3). */
		'float n_hash(int x, int y, int z) {',
		'	int a = (x + 65536) * 1664525 + 1013904223;',
		'	int b = (y + 65536) * 1664525 + 1013904223;',
		'	int c = (z + 65536) * 1664525 + 1013904223;',
		'	a += b * c; b += c * a; c += a * b;',
		'	a = a ^ a >>> 16; b = b ^ b >>> 16; c = c ^ c >>> 16;',
		'	a += b * c;',
		'	return float(a & 16777215) / 16777215.0;',
		'}',
		'float n_wrap(float value, float size) { return size > 0.0 ? (value % size + size) % size : value; }',
		'float n_fade(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }',
		/* A point of the lattice by whole numbers, each made once of its float (Regression: the float of each corner made a whole number again, 24 times a point, was most of the time of wasm). */
		'float n_at(int i, int j, int k, bool tiled, float px, float py, float pz) {',
		'	if (tiled) return n_hash(int(n_wrap(float(i), px)), int(n_wrap(float(j), py)), int(n_wrap(float(k), pz)));',
		'	return n_hash(i, j, k);',
		'}',
		'float n_value(float x, float y, float z, bool tiled, float px, float py, float pz) {',
		'	float ix = floor(x), iy = floor(y), iz = floor(z);',
		'	float fx = n_fade(x - ix), fy = n_fade(y - iy), fz = n_fade(z - iz);',
		'	int i = int(ix), j = int(iy), k = int(iz);',
		'	return mix(mix(mix(n_at(i, j, k, tiled, px, py, pz), n_at(i + 1, j, k, tiled, px, py, pz), fx),',
		'		mix(n_at(i, j + 1, k, tiled, px, py, pz), n_at(i + 1, j + 1, k, tiled, px, py, pz), fx), fy),',
		'		mix(mix(n_at(i, j, k + 1, tiled, px, py, pz), n_at(i + 1, j, k + 1, tiled, px, py, pz), fx),',
		'		mix(n_at(i, j + 1, k + 1, tiled, px, py, pz), n_at(i + 1, j + 1, k + 1, tiled, px, py, pz), fx), fy), fz);',
		'}',
		/* One of the twelve gradients of a point of the lattice, by its hash, dotted with where the point is from it. */
		'float n_gradient(float hash, float x, float y, float z) {',
		'	int g = int(floor(hash * 12.0)) % 12;',
		'	float u = g < 8 ? x : y;',
		'	float v = g < 4 ? y : g == 12 || g == 14 ? x : z;',
		'	return ((g & 1) == 0 ? u : -u) + ((g & 2) == 0 ? v : -v);',
		'}',
		'float n_corner_of(int i, int j, int k, int dx, int dy, int dz, bool tiled, float px, float py, float pz, float fx, float fy, float fz) {',
		'	return n_gradient(n_at(i + dx, j + dy, k + dz, tiled, px, py, pz), fx - float(dx), fy - float(dy), fz - float(dz));',
		'}',
		'float n_perlin(float x, float y, float z, bool tiled, float px, float py, float pz) {',
		'	float ix = floor(x), iy = floor(y), iz = floor(z);',
		'	float fx = x - ix, fy = y - iy, fz = z - iz;',
		'	float u = n_fade(fx), v = n_fade(fy), w = n_fade(fz);',
		'	int i = int(ix), j = int(iy), k = int(iz);',
		'	return clamp(mix(mix(mix(n_corner_of(i, j, k, 0, 0, 0, tiled, px, py, pz, fx, fy, fz), n_corner_of(i, j, k, 1, 0, 0, tiled, px, py, pz, fx, fy, fz), u),',
		'		mix(n_corner_of(i, j, k, 0, 1, 0, tiled, px, py, pz, fx, fy, fz), n_corner_of(i, j, k, 1, 1, 0, tiled, px, py, pz, fx, fy, fz), u), v),',
		'		mix(mix(n_corner_of(i, j, k, 0, 0, 1, tiled, px, py, pz, fx, fy, fz), n_corner_of(i, j, k, 1, 0, 1, tiled, px, py, pz, fx, fy, fz), u),',
		'		mix(n_corner_of(i, j, k, 0, 1, 1, tiled, px, py, pz, fx, fy, fz), n_corner_of(i, j, k, 1, 1, 1, tiled, px, py, pz, fx, fy, fz), u), v), w) * 0.5 + 0.5, 0.0, 1.0);',
		'}',
		/* What a corner of the lattice (i, j, k) gives a point dx, dy, dz from it, of simplex noise: none past its reach. */
		'float n_corner(int i, int j, int k, float dx, float dy, float dz) {',
		'	float falloff = 0.6 - dx * dx - dy * dy - dz * dz;',
		'	if (falloff <= 0.0) return 0.0;',
		'	falloff = falloff * falloff;',
		'	return falloff * falloff * n_gradient(n_hash(i, j, k), dx, dy, dz);',
		'}',
		/* Simplex noise of three dimensions: four corners of a tetrahedron each point; the two between by the order of the coordinates. */
		'float n_simplex(float x, float y, float z) {',
		'	float F3 = 1.0 / 3.0; float G3 = 1.0 / 6.0;',
		'	float s = (x + y + z) * F3;',
		'	float fi = floor(x + s), fj = floor(y + s), fk = floor(z + s);',
		'	float t = (fi + fj + fk) * G3;',
		'	float x0 = x - (fi - t), y0 = y - (fj - t), z0 = z - (fk - t);',
		'	int i = int(fi), j = int(fj), k = int(fk);',
		'	int a0 = 0, a1 = 0, a2 = 0, b0 = 0, b1 = 0, b2 = 0;',
		'	if (x0 >= y0) {',
		'		if (y0 >= z0) { a0 = 1; b0 = 1; b1 = 1; }',
		'		else if (x0 >= z0) { a0 = 1; b0 = 1; b2 = 1; }',
		'		else { a2 = 1; b0 = 1; b2 = 1; }',
		'	}',
		'	else {',
		'		if (y0 < z0) { a2 = 1; b1 = 1; b2 = 1; }',
		'		else if (x0 < z0) { a1 = 1; b1 = 1; b2 = 1; }',
		'		else { a1 = 1; b0 = 1; b1 = 1; }',
		'	}',
		'	float total = 0.0;',
		'	total += n_corner(i, j, k, x0, y0, z0);',
		'	total += n_corner(i + a0, j + a1, k + a2, x0 - float(a0) + G3, y0 - float(a1) + G3, z0 - float(a2) + G3);',
		'	total += n_corner(i + b0, j + b1, k + b2, x0 - float(b0) + 2.0 * G3, y0 - float(b1) + 2.0 * G3, z0 - float(b2) + 2.0 * G3);',
		'	total += n_corner(i + 1, j + 1, k + 1, x0 - 1.0 + 3.0 * G3, y0 - 1.0 + 3.0 * G3, z0 - 1.0 + 3.0 * G3);',
		'	return clamp(total * 16.0 + 0.5, 0.0, 1.0);',
		'}',
		/* Worley (cellular): a point in each cell of the lattice; the distance to the nearest, to the next, the edge between them, or a number of its cell. */
		'float n_worley(float x, float y, float z, bool tiled, float px, float py, float pz, float jitter, int distance, int returned) {',
		'	float ix = floor(x), iy = floor(y), iz = floor(z);',
		'	int i = int(ix), j = int(iy), k = int(iz);',
		'	float first = inf, second = inf, cell = 0.0;',
		'	for (int dz = -1; dz <= 1; dz++) {',
		'		for (int dy = -1; dy <= 1; dy++) {',
		'			for (int dx = -1; dx <= 1; dx++) {',
		'				int ci = i + dx, cj = j + dy, ck = k + dz;',
		'				float cx = ix + float(dx), cy = iy + float(dy), cz = iz + float(dz);',
		'				float ax = abs(cx + 0.5 + (n_at(ci, cj, ck, tiled, px, py, pz) - 0.5) * jitter - x);',
		'				float ay = abs(cy + 0.5 + (n_at(ci + 131, cj - 71, ck + 37, tiled, px, py, pz) - 0.5) * jitter - y);',
		'				float az = abs(cz + 0.5 + (n_at(ci - 59, cj + 113, ck - 17, tiled, px, py, pz) - 0.5) * jitter - z);',
		'				float far = distance == 1 ? ax + ay + az : distance == 2 ? max(max(ax, ay), az) : sqrt(ax * ax + ay * ay + az * az);',
		'				if (far < first) { second = first; first = far; cell = n_at(ci + 7, cj + 7, ck + 7, tiled, px, py, pz); }',
		'				else if (far < second) { second = far; }',
		'			}',
		'		}',
		'	}',
		'	if (returned == 3) return cell;',
		'	if (returned == 1) return min(1.0, second);',
		'	if (returned == 2) return min(1.0, second - first);',
		'	return min(1.0, first);',
		'}',
		'float n_base(int type, float x, float y, float z, bool tiled, float px, float py, float pz, float jitter, int distance, int returned) {',
		'	if (type == 1) return n_perlin(x, y, z, tiled, px, py, pz);',
		'	if (type == 2) return n_simplex(x, y, z);',
		'	if (type == 3) return n_worley(x, y, z, tiled, px, py, pz, jitter, distance, returned);',
		'	if (type == 4) return n_at(int(floor(x)), int(floor(y)), int(floor(z)), tiled, px, py, pz);',
		'	return n_value(x, y, z, tiled, px, py, pz);',
		'}',
		/* The octaves of a fractal, each finer and fainter: fbm as it is, ridged the folds of mountains, billow round heaps. */
		'float n_octaves(int type, float x, float y, float z, int count, int fractal, float lacunarity, float gain, float sx, float sy, float sz, bool tiled, float px, float py, float pz, float jitter, int distance, int returned) {',
		'	float total = 0.0, amplitude = 0.5, weight = 0.0;',
		'	for (int octave = 0; octave < count; octave++) {',
		'		float n = n_base(type, x, y, z, tiled, px, py, pz, jitter, distance, returned);',
		'		if (fractal == 2) n = 1.0 - abs(n * 2.0 - 1.0);',
		'		else if (fractal == 3) n = abs(n * 2.0 - 1.0);',
		'		total += n * amplitude;',
		'		weight += amplitude;',
		'		x = x * lacunarity + sx; y = y * lacunarity + sy; z = z * lacunarity + sz;',
		'		amplitude *= gain;',
		'		if (tiled) { px = px * lacunarity; py = py * lacunarity; pz = pz * lacunarity; }',
		'	}',
		'	return weight != 0.0 ? total / weight : 0.0;',
		'}',
		/* What is done to a value after it is read: terraces, a power, the other way round, a range. */
		'float n_finish(float value, float steps, float sharp, float power, bool invert, bool ranged, float low, float high) {',
		'	if (steps > 0.0) {',
		'		float t = value * steps; float step = floor(t);',
		'		value = min(1.0, (step + (sharp >= 1.0 ? 0.0 : pow(t - step, 1.0 + sharp * 15.0))) / steps);',
		'	}',
		'	if (power != 1.0) value = pow(max(0.0, value), power);',
		'	if (invert) value = 1.0 - value;',
		'	return ranged ? low + value * (high - low) : value;',
		'}',
		/* A value of a whole spec at a point: the space warped, the octaves of its fractal, what is done after. */
		'float n_read(int type, int fractal, int octaves, float lacunarity, float gain, float scale, float ox, float oy, float oz, float seed, float sx, float sy, float sz,',
		'	float jitter, int distance, int returned, bool warped, float amount, float wscale, int woctaves, bool tiled, float tx, float ty, float tz,',
		'	float steps, float sharp, float power, bool invert, bool ranged, float low, float high, float x, float y, float z) {',
		'	float px = x / scale + ox + seed, py = y / scale + oy + seed, pz = z / scale + oz + seed;',
		'	if (warped) {',
		'		float qx = n_octaves(type, px * wscale + 0.0, py * wscale + 0.0, pz * wscale + 0.0, woctaves, 1, lacunarity, gain, sx, sy, sz, tiled, tx, ty, tz, jitter, distance, returned);',
		'		float qy = n_octaves(type, px * wscale + 5.2, py * wscale + 1.3, pz * wscale + 2.8, woctaves, 1, lacunarity, gain, sx, sy, sz, tiled, tx, ty, tz, jitter, distance, returned);',
		'		float qz = n_octaves(type, px * wscale + 2.0 * 5.2, py * wscale + 2.0 * 1.3, pz * wscale + 2.0 * 2.8, woctaves, 1, lacunarity, gain, sx, sy, sz, tiled, tx, ty, tz, jitter, distance, returned);',
		'		px = px + (qx * 2.0 - 1.0) * amount; py = py + (qy * 2.0 - 1.0) * amount; pz = pz + (qz * 2.0 - 1.0) * amount;',
		'	}',
		'	return n_finish(n_octaves(type, px, py, pz, fractal == 0 ? 1 : octaves, fractal, lacunarity, gain, sx, sy, sz, tiled, tx, ty, tz, jitter, distance, returned), steps, sharp, power, invert, ranged, low, high);',
		'}'
	].join('\n'),

	/* What a worker carries of this Service besides its methods: the js of its Kernel, made in the page (a worker has no compiler). */
	Carried: ['Compiled'],

	$OnCreate: function () {
		this.Code();
	},

	/* The functions of the Kernel as js: made of the text the page made once (Compiled), the same text in a worker. */
	Code: function () {
		var self = this;

		if (this.Made)
			return this.Made;

		if (!this.Compiled && typeof Elemenx !== 'undefined' && Elemenx.Compilers) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'js', Value: this.Kernel, Entry: 'noise'}, function (error, result) {
				if (error)
					throw error;

				self.Compiled = result.Value;
			});
		}

		this.Made = new Function(this.Compiled)();

		return this.Made;
	},

	/* The Kernel in the IR of Elemenx.Compilers, made once: its functions for a module of another (a graph of blocks of noise, Blueprints.Numeric). */
	IR: function () {
		var self = this;

		if (!this.IRMade) {
			Elemenx.Compilers.Run({From: 'kernel', To: 'ir', Value: this.Kernel}, function (error, result) {
				if (error)
					throw error;

				self.IRMade = result.Value;
			});
		}

		return this.IRMade;
	},

	/*
	 * The Kernel as wasm, made once ({Bytes, Exports}, to Elemenx.Compilers.Instance): the very numbers of its js, n_read in
	 * batches of points of one spec (its first 31 numbers fixed). Null where there is no compiler of wasm.
	 */
	Wasm: function () {
		var self = this;

		if (this.WasmMade !== undefined) return this.WasmMade;

		this.WasmMade = null;

		if (typeof Elemenx !== 'undefined' && Elemenx.Compilers && typeof WebAssembly !== 'undefined') {
			Elemenx.Compilers.Run({From: 'kernel', To: 'wasm', Value: this.Kernel, Entry: 'noise', Options: {Batch: [{Name: 'n_read', Fixed: 31}]}}, function (error, result) {
				if (!error)
					self.WasmMade = result.Value;
			});
		}

		return this.WasmMade;
	},

	/* The numbers of a whole spec, as n_read of the Kernel takes them before its point (31). */
	Numbers: function (whole) {
		var post = whole.Post;
		var tile = whole.Tile || [0, 0, 0];

		return [this.Types().indexOf(whole.Type), ['none', 'fbm', 'ridged', 'billow'].indexOf(whole.Fractal), whole.Octaves, whole.Lacunarity, whole.Gain, whole.Scale,
			whole.Offset[0], whole.Offset[1], whole.Offset[2], whole.Seed, whole.Shift[0], whole.Shift[1], whole.Shift[2],
			whole.Jitter, ['euclid', 'manhattan', 'chebyshev'].indexOf(whole.Distance), ['f1', 'f2', 'edge', 'cell'].indexOf(whole.Return),
			!!whole.Warp, whole.Warp ? whole.Warp.Amount : 0, whole.Warp ? whole.Warp.Scale : 1, whole.Warp ? whole.Warp.Octaves : 1,
			!!whole.Tile, tile[0], tile[1], tile[2],
			post.Steps, post.Sharp, post.Power, post.Invert, !!post.Range, post.Range ? post.Range[0] : 0, post.Range ? post.Range[1] : 1];
	},

	Finish: function (post, value) {
		return this.Code().n_finish(value, post.Steps, post.Sharp, post.Power, post.Invert, !!post.Range, post.Range ? post.Range[0] : 0, post.Range ? post.Range[1] : 1);
	},

	/* The hash of a point of the lattice, 0 to 1: that of Math.Noise and of the shaders of Renderer (pcg3). */
	Hash: function (x, y, z) {
		return this.Code().n_hash(x | 0, y | 0, z | 0);
	},

	/* One of the twelve gradients of a point of the lattice, by its hash, dotted with where the point is from it. */
	Gradient: function (hash, x, y, z) {
		return this.Code().n_gradient(hash, x, y, z);
	},

	Simplex: function (x, y, z) {
		return this.Code().n_simplex(x, y, z);
	},

	/* A value of a whole spec at a point. */
	Read: function (whole, x, y, z) {
		var n = this.Numbers(whole);

		return this.Code().n_read(n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8], n[9], n[10], n[11], n[12], n[13], n[14], n[15], n[16], n[17], n[18], n[19], n[20], n[21], n[22], n[23], n[24], n[25], n[26], n[27], n[28], n[29], n[30], x, y, z);
	},

	Make: function (spec) {
		var self = this;
		var given = spec || {};
		var whole;
		var parts;
		var mask;
		var post;
		var sampler;
		var n;
		var code;

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
		n = this.Numbers(whole);
		code = this.Code();

		/* The numbers of its spec told once; read by the js of the Kernel. */
		return this.Sampler(function (x, y, z) {
			return code.n_read(n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8], n[9], n[10], n[11], n[12], n[13], n[14], n[15], n[16], n[17], n[18], n[19], n[20], n[21], n[22], n[23], n[24], n[25], n[26], n[27], n[28], n[29], n[30], x, y, z);
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
