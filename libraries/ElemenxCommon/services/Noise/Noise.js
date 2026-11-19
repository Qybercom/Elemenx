/*
 * Noise: the noise of space by any of its algorithms and with what is done to it, one description for all that is made
 * of noise (a ground, a texture, a field of growth, a flow), the same in the page, in a worker, in Node and in a shader.
 * - A noise is described by a spec: {Type (value, perlin, simplex, worley, white, gradient: of slopes of any way, its
 *   lattice turned off the axes, no squares seen from far), Seed, Scale (the size of its features,
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
 * - The noise of a shader is of the Kernel too: GLSLKernel() the Kernel as GLSL (f_n_hash, f_n_value... f_n_read),
 *   GLSLPieces() its functions and those of GLSLWrappers by their names, GLSLFaster those a shader makes as vectors (the
 *   very numbers). GLSLChunk(names): what a shader asks of them (enx_hash3, enx_value3, enx_perlin3, enx_simplex3,
 *   enx_worley3, enx_gradient3, enx_value2, enx_fvalue3 (a value noise of n_fhash, only drawn), enx_white, enx_white2, enx_white3: a number of 0 to 1 of any numbers, enx_pcg3, enx_hash4; f_n_...) and
 *   what they call, each once in a shader however many times it comes (ENX_<name>); all with none. Two hashes: n_hash of
 *   whole numbers, the same in the page and in a shader (noise3 and fbm3 of Renderer, a ground of the CPU and of the GPU
 *   alike), and n_fhash of a sine, cheap, for what a shader reads many times a pixel. GLSL(spec, name): a function float name(vec3 p) of the spec, after
 *   them: f_n_read of its numbers (GLSLNumbers(whole)), the same numbers as At, to the float; GLSLLines(spec, prefix,
 *   point): the same as lines of the body of a shader ({Lines, Value}), with no function of its own (a block of a graph
 *   of shaders).
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
		Methods: ['Make(spec)', 'Types()', 'Fractals()', 'GLSLKernel()', 'GLSLPieces()', 'GLSLChunk(names)', 'GLSLNumbers(whole)', 'GLSL(spec, name)', 'GLSLLines(spec, prefix, point)', 'Source(names)', 'Code()', 'IR()', 'Wasm()', 'Numbers(whole)', 'Whole(spec)']
	},

	Types: function () {
		return ['value', 'perlin', 'simplex', 'worley', 'white', 'gradient'];
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
	 * of the text it carries) and wasm (Wasm()). Types: 0 value, 1 perlin, 2 simplex, 3 worley, 4 white, 5 gradient; fractals: 0 none,
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
		/* A whole number of the lattice wrapped at a period (0: none): floor, not two remainders (a shader made it slower to make). */
		'float n_wrap(float value, float size) { return size > 0.0 ? value - size * floor(value / size) : value; }',
		'float n_fade(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }',
		/* A point of the lattice by whole numbers, each made once of its float (Regression: the float of each corner made a whole number again, 24 times a point, was most of the time of wasm). */
		'float n_at(int i, int j, int k, bool tiled, float px, float py, float pz) {',
		/* One hash of it, wrapped or not (two in a shader made each corner twice the code). */
		'	int a = tiled ? int(n_wrap(float(i), px)) : i;',
		'	int b = tiled ? int(n_wrap(float(j), py)) : j;',
		'	int c = tiled ? int(n_wrap(float(k), pz)) : k;',
		'	return n_hash(a, b, c);',
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
		/*
		 * n_value of no period, of the hash of its corners at once: the noise of the shaders that must match the page (noise3,
		 * fbm3 of Renderer: a ground of the CPU and of the GPU alike), of a quarter of the code of a shader of n_value.
		 */
		'float n_value0(float x, float y, float z) {',
		'	float ix = floor(x), iy = floor(y), iz = floor(z);',
		'	float fx = n_fade(x - ix), fy = n_fade(y - iy), fz = n_fade(z - iz);',
		'	int i = int(ix), j = int(iy), k = int(iz);',
		'	return mix(mix(mix(n_hash(i, j, k), n_hash(i + 1, j, k), fx), mix(n_hash(i, j + 1, k), n_hash(i + 1, j + 1, k), fx), fy),',
		'		mix(mix(n_hash(i, j, k + 1), n_hash(i + 1, j, k + 1), fx), mix(n_hash(i, j + 1, k + 1), n_hash(i + 1, j + 1, k + 1), fx), fy), fz);',
		'}',
		/*
		 * A hash of any three numbers of 0 to 1 of a sine (the one of the shaders, here once): what a shader reads many times
		 * a pixel (the face of a cliff, the edges of materials, the tiles of a ground), of an operation or two. A shader of
		 * the whole hash (n_hash, of whole numbers) at each of those was four times as slow to make (50 s the land of a
		 * ground of many materials), one of a hash of floats of no sine half as slow again. n_hash where the page and the
		 * shader must be the very same numbers: a js of a sine is not the sine of a card.
		 */
		'float n_fhash(float x, float y, float z) {',
		'	return fract(sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453);',
		'}',
		/* A point of the lattice of a plane of n_fhash, its layer k, wrapped at a period (0: none). */
		'float n_fat(float i, float j, float k, bool tiled, float px, float py) {',
		'	return n_fhash(tiled ? n_wrap(i, px) : i, tiled ? n_wrap(j, py) : j, k);',
		'}',
		/* The value noise of a plane of n_fhash, of its four corners. */
		'float n_fvalue2(float x, float y, float k, bool tiled, float px, float py) {',
		'	float ix = floor(x), iy = floor(y);',
		'	float fx = n_fade(x - ix), fy = n_fade(y - iy);',
		'	return mix(mix(n_fat(ix, iy, k, tiled, px, py), n_fat(ix + 1.0, iy, k, tiled, px, py), fx),',
		'		mix(n_fat(ix, iy + 1.0, k, tiled, px, py), n_fat(ix + 1.0, iy + 1.0, k, tiled, px, py), fx), fy);',
		'}',
		/*
		 * The value noise of a space of n_fhash: what a shader only draws (the ground of a globe near), as cheap for a card to
		 * make as a noise can be; each corner wrapped at 4096, the sine of numbers a card tells well.
		 */
		'float n_fcorner(float i, float j, float k) {',
		'	return n_fhash(n_wrap(i, 4096.0), n_wrap(j, 4096.0), n_wrap(k, 4096.0));',
		'}',
		'float n_fvalue3(float x, float y, float z) {',
		'	float ix = floor(x), iy = floor(y), iz = floor(z);',
		'	float fx = n_fade(x - ix), fy = n_fade(y - iy), fz = n_fade(z - iz);',
		'	return mix(mix(mix(n_fcorner(ix, iy, iz), n_fcorner(ix + 1.0, iy, iz), fx), mix(n_fcorner(ix, iy + 1.0, iz), n_fcorner(ix + 1.0, iy + 1.0, iz), fx), fy),',
		'		mix(mix(n_fcorner(ix, iy, iz + 1.0), n_fcorner(ix + 1.0, iy, iz + 1.0), fx), mix(n_fcorner(ix, iy + 1.0, iz + 1.0), n_fcorner(ix + 1.0, iy + 1.0, iz + 1.0), fx), fy), fz);',
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
		/*
		 * The slope of a point of the lattice of any way (the three numbers of its hash, as enx_pcg3 has them, each of 1024
		 * steps), dotted with where a point is from it: the corners of n_slopes.
		 */
		'float n_slope(int x, int y, int z, float fx, float fy, float fz) {',
		'	int a = (x + 65536) * 1664525 + 1013904223;',
		'	int b = (y + 65536) * 1664525 + 1013904223;',
		'	int c = (z + 65536) * 1664525 + 1013904223;',
		'	a += b * c; b += c * a; c += a * b;',
		'	a = a ^ a >>> 16; b = b ^ b >>> 16; c = c ^ c >>> 16;',
		'	a += b * c; b += c * a; c += a * b;',
		'	float gx = float(a & 1023) / 511.5 - 1.0 + 0.0001;',
		'	float gy = float(b & 1023) / 511.5 - 1.0 + 0.0001;',
		'	float gz = float(c & 1023) / 511.5 - 1.0 + 0.0001;',
		'	return (gx * fx + gy * fy + gz * fz) / sqrt(gx * gx + gy * gy + gz * gz);',
		'}',
		/*
		 * A noise of gradients of any way, its lattice turned off the axes (gradient): no squares nor rows stand in what is made
		 * of it, seen from far (the clouds of a galaxy). 0 to 1, its mean 0.5.
		 */
		'float n_slopes(float x, float y, float z) {',
		'	float rx = 0.788 * x - 0.369 * y + 0.49 * z;',
		'	float ry = 0.346 * x + 0.928 * y + 0.137 * z;',
		'	float rz = -0.509 * x + 0.051 * y + 0.861 * z;',
		'	float ix = floor(rx), iy = floor(ry), iz = floor(rz);',
		'	float fx = rx - ix, fy = ry - iy, fz = rz - iz;',
		'	float u = n_fade(fx), v = n_fade(fy), w = n_fade(fz);',
		'	int i = int(ix), j = int(iy), k = int(iz);',
		'	return clamp(0.5 + 0.75 * mix(mix(mix(n_slope(i, j, k, fx, fy, fz), n_slope(i + 1, j, k, fx - 1.0, fy, fz), u),',
		'		mix(n_slope(i, j + 1, k, fx, fy - 1.0, fz), n_slope(i + 1, j + 1, k, fx - 1.0, fy - 1.0, fz), u), v),',
		'		mix(mix(n_slope(i, j, k + 1, fx, fy, fz - 1.0), n_slope(i + 1, j, k + 1, fx - 1.0, fy, fz - 1.0), u),',
		'		mix(n_slope(i, j + 1, k + 1, fx, fy - 1.0, fz - 1.0), n_slope(i + 1, j + 1, k + 1, fx - 1.0, fy - 1.0, fz - 1.0), u), v), w), 0.0, 1.0);',
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
		'	if (type == 5) return n_slopes(x, y, z);',
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

	/*
	 * The functions of the Kernel as GLSL (Elemenx.Compilers: kernel to glsl, its names f_n_value...), made once in the page:
	 * the one source of the noise of the page, of a worker, of wasm and of a shader.
	 */
	GLSLKernel: function () {
		var self = this;

		if (this.KernelGLSL === undefined) {
			this.KernelGLSL = null;

			Elemenx.Compilers.Run({From: 'kernel', To: 'glsl', Value: [].concat(this.Kernel).join('\n'), Entry: 'noise'}, function (error, result) {
				if (error)
					throw new Error('Elemenx Noise: its kernel is no GLSL: ' + (error.message || error));

				self.KernelGLSL = result.Value;
			});
		}

		return this.KernelGLSL;
	},

	/*
	 * Functions of the Kernel a shader makes in fewer operations, as vectors (each the very numbers of the Kernel: a contract
	 * holds them to it): its hash, of three whole numbers at once. Regression: made of the Kernel one number at a time, the
	 * shaders of a ground of many materials took half as long again to make (50 s the Showcase, not 39 s).
	 */
	GLSLFaster: {
		f_n_hash: [
			'float f_n_hash(int f_x, int f_y, int f_z) { return float(enx_pcg3(ivec3(f_x, f_y, f_z)).x & 16777215u) / 16777215.0; }'
		].join('\n'),
		/*
		 * n_value0: the hashes of its eight corners four at once (enx_hash4), the very numbers of n_hash. Regression: each corner
		 * of its own (enx_pcg3, three numbers made of which one was read), the Ground of a globe of some forty of them took 7 s
		 * for the card to make, 5 s so.
		 */
		f_n_value0: [
			'float f_n_value0(float f_x, float f_y, float f_z) {',
			'	vec3 x = vec3(f_x, f_y, f_z);',
			'	vec3 i = floor(x);',
			'	vec3 f = x - i;',
			'	f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
			'	ivec3 c = ivec3(i);',
			'	ivec4 cx = c.x + ivec4(0, 1, 0, 1);',
			'	ivec4 cy = c.y + ivec4(0, 0, 1, 1);',
			'	vec4 h = mix(enx_hash4(cx, cy, ivec4(c.z)), enx_hash4(cx, cy, ivec4(c.z + 1)), f.z);',
			'	vec2 g = mix(h.xz, h.yw, f.x);',
			'	return mix(g.x, g.y, f.y);',
			'}'
		].join('\n'),
		/*
		 * n_fvalue3: the value noise of a space of n_fhash (a sine), its corners four at once: what a shader only draws (no
		 * page reads the same), the lattice wrapped at 4096 so the sine is of numbers a card tells well.
		 */
		f_n_fvalue3: [
			'float f_n_fvalue3(float f_x, float f_y, float f_z) {',
			'	vec3 x = vec3(f_x, f_y, f_z);',
			'	vec3 i = floor(x);',
			'	vec3 f = x - i;',
			'	f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
			'	vec4 cx = vec4(i.x, i.x + 1.0, i.x, i.x + 1.0);',
			'	vec4 cy = vec4(i.y, i.y, i.y + 1.0, i.y + 1.0);',
			'	vec2 cz = vec2(i.z, i.z + 1.0);',
			'	cx -= 4096.0 * floor(cx / 4096.0);',
			'	cy -= 4096.0 * floor(cy / 4096.0);',
			'	cz -= 4096.0 * floor(cz / 4096.0);',
			'	vec4 a = cx * 12.9898 + cy * 78.233;',
			'	vec4 h = mix(fract(sin(a + cz.x * 37.719) * 43758.5453), fract(sin(a + cz.y * 37.719) * 43758.5453), f.z);',
			'	vec2 g = mix(h.xz, h.yw, f.x);',
			'	return mix(g.x, g.y, f.y);',
			'}'
		].join('\n'),
		/* n_fvalue2: the hashes of its four corners at once (n_fhash of a vec4), wrapped as n_wrap does. */
		f_n_fvalue2: [
			'float f_n_fvalue2(float f_x, float f_y, float f_k, bool f_tiled, float f_px, float f_py) {',
			'	vec2 p = vec2(f_x, f_y);',
			'	vec2 i = floor(p);',
			'	vec2 w = p - i;',
			'	w = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);',
			'	vec4 cx = i.x + vec4(0.0, 1.0, 0.0, 1.0);',
			'	vec4 cy = i.y + vec4(0.0, 0.0, 1.0, 1.0);',
			'	if (f_tiled && f_px > 0.0) cx = cx - f_px * floor(cx / f_px);',
			'	if (f_tiled && f_py > 0.0) cy = cy - f_py * floor(cy / f_py);',
			'	vec4 h = fract(sin(cx * 12.9898 + cy * 78.233 + f_k * 37.719) * 43758.5453);',
			'	return mix(mix(h.x, h.y, w.x), mix(h.z, h.w, w.x), w.y);',
			'}'
		].join('\n'),
		/* n_slopes: its lattice turned by a matrix, the slopes of its corners of the three numbers of enx_pcg3 at once. */
		f_n_slopes: [
			'float f_n_slopes(float f_x, float f_y, float f_z) {',
			'	vec3 p = mat3(0.788, 0.346, -0.509, -0.369, 0.928, 0.051, 0.49, 0.137, 0.861) * vec3(f_x, f_y, f_z);',
			'	vec3 i = floor(p);',
			'	vec3 f = p - i;',
			'	vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
			'	float a = dot(enx_slope3(i), f);',
			'	float b = dot(enx_slope3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));',
			'	float c = dot(enx_slope3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));',
			'	float d = dot(enx_slope3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));',
			'	float e = dot(enx_slope3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));',
			'	float g = dot(enx_slope3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));',
			'	float h = dot(enx_slope3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));',
			'	float k = dot(enx_slope3(i + vec3(1.0)), f - vec3(1.0));',
			'	return clamp(0.5 + 0.75 * mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z), 0.0, 1.0);',
			'}'
		].join('\n')
	},

	/* The functions of a shader made of the Kernel (enx_...), each of what it calls. */
	GLSLWrappers: [
		/* The hash of n_hash of three whole numbers, each of its three numbers of 32 bits (x: that of n_hash): the slopes of a noise of gradients. */
		/* n_hash of four points of the lattice at once, the very numbers: of the corners of a noise, four by four. */
		'vec4 enx_hash4(ivec4 x, ivec4 y, ivec4 z) { uvec4 a = uvec4(x + 65536) * 1664525u + 1013904223u; uvec4 b = uvec4(y + 65536) * 1664525u + 1013904223u; uvec4 c = uvec4(z + 65536) * 1664525u + 1013904223u; a += b * c; b += c * a; c += a * b; a ^= a >> 16u; b ^= b >> 16u; c ^= c >> 16u; a += b * c; return vec4(a & 16777215u) / 16777215.0; }',
		'uvec3 enx_pcg3(ivec3 c) { uvec3 v = uvec3(c + ivec3(65536)) * 1664525u + 1013904223u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; v ^= v >> 16u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; return v; }',
		/* The slope of a point of the lattice of n_slopes, of the three numbers of its hash. */
		'vec3 enx_slope3(vec3 i) { uvec3 h = enx_pcg3(ivec3(i)); return normalize(vec3(h & uvec3(1023u)) / 511.5 - 1.0 + 1e-4); }',
		'float enx_gradient3(vec3 p) { return f_n_slopes(p.x, p.y, p.z); }',
		'bool enx_tiled(vec3 period) { return period.x > 0.0 || period.y > 0.0 || period.z > 0.0; }',
		'float enx_hash3(vec3 p, vec3 period) { vec3 q = floor(p + 0.5); return f_n_at(int(q.x), int(q.y), int(q.z), enx_tiled(period), period.x, period.y, period.z); }',
		'float enx_value3(vec3 x, vec3 period) { return f_n_value(x.x, x.y, x.z, enx_tiled(period), period.x, period.y, period.z); }',
		'float enx_perlin3(vec3 x, vec3 period) { return f_n_perlin(x.x, x.y, x.z, enx_tiled(period), period.x, period.y, period.z); }',
		'float enx_simplex3(vec3 v) { return f_n_simplex(v.x, v.y, v.z); }',
		'float enx_worley3(vec3 x, vec3 period, float jitter, int metric, int ret) { return f_n_worley(x.x, x.y, x.z, enx_tiled(period), period.x, period.y, period.z, jitter, metric, ret); }',
		'float enx_value2(vec2 p) { return f_n_fvalue2(p.x, p.y, 0.0, false, 0.0, 0.0); }',
		'float enx_fvalue3(vec3 p) { return f_n_fvalue3(p.x, p.y, p.z); }',
		'float enx_white3(vec3 p) { return f_n_fhash(p.x, p.y, p.z); }',
		'float enx_white2(vec2 p) { return f_n_fhash(p.x, p.y, 0.5); }',
		'float enx_white(float x) { return f_n_fhash(x, x + 0.5, 0.25); }'
	],

	/*
	 * The functions of GLSLKernel and GLSLWrappers by their names, each {Text, Calls}, and what comes before them all (the
	 * runtime of glsl): made once.
	 */
	GLSLPieces: function () {
		var pieces = {};
		var head = [];
		var lines;
		var i;
		var name;
		var body;

		if (this.Pieces)
			return this.Pieces;

		function piece (key, text) {
			var calls = [];
			var found;
			var called = /\b((?:f_n|enx)_\w+)\(/g;

			while ((found = called.exec(text)))
				if (found[1] !== key && calls.indexOf(found[1]) === -1)
					calls.push(found[1]);

			pieces[key] = {Text: text, Calls: calls};
		}

		lines = this.GLSLKernel().split('\n');

		for (i = 0; i < lines.length; i++) {
			name = /^\w+ (f_n_\w+)\(.*\) \{$/.exec(lines[i]);

			if (name) {
				body = [lines[i]];

				while (lines[++i] !== '}')
					body.push(lines[i]);

				body.push('}');

				piece(name[1], body.join('\n'));
			}
			else if (!/^\w+ f_n_\w+\(.*\);$/.test(lines[i])) {
				head.push(lines[i]);
			}
		}

		this.GLSLWrappers.forEach(function (text) {
			piece(/^\w+ (enx_\w+)\(/.exec(text)[1], text);
		});

		/* What a shader makes of the Kernel in fewer operations of its own (GLSLFaster), the very numbers. */
		Object.keys(this.GLSLFaster).forEach(function (name) {
			piece(name, this.GLSLFaster[name]);
		}, this);

		this.Pieces = {Head: head.join('\n'), Pieces: pieces};

		return this.Pieces;
	},

	/*
	 * What a shader needs of the noise, before what reads it: names (of GLSLWrappers: enx_hash3, enx_value3, enx_perlin3,
	 * enx_simplex3, enx_worley3, enx_value2 (on a plane), enx_white, enx_white2, enx_white3 (a number of 0 to 1 of any
	 * numbers, the same for the same ones: the hash of the Kernel of their bits); or of the Kernel: f_n_read...; all of
	 * GLSLWrappers by default) and what they call of the Kernel, no more (a whole Kernel in every shader made each three
	 * times slower to make). Each once in a shader however many times it comes (ENX_<name>). Regression: the noise of the
	 * shaders was written again by hand in five places, a hash of a sine (fract(sin(..) * 43758.5453)) in 37.
	 */
	GLSLChunk: function (names) {
		var made = this.GLSLPieces();
		var order = [];
		var lines;

		function visit (name) {
			var one = made.Pieces[name];
			if (!one)
				throw new Error('Elemenx Noise: there is no function ' + name + ' of its GLSL');

			if (order.indexOf(name) !== -1) return;

			one.Calls.forEach(visit);

			order.push(name);
		}

		/* All by default: what GLSL and GLSLLines read (f_n_read, f_n_finish) too. */
		(names || this.GLSLWrappers.map(function (text) {
			return /^\w+ (enx_\w+)\(/.exec(text)[1];
		}).concat(['f_n_read', 'f_n_finish'])).forEach(visit);

		/* Its hash is of whole numbers of 32 bits: of a fragment shader too (mediump by default there). */
		lines = ['precision highp int;', made.Head];

		order.forEach(function (name) {
			lines.push('#ifndef ENX_' + name, '#define ENX_' + name, made.Pieces[name].Text, '#endif');
		});

		return lines.join('\n');
	},

	/* The numbers of a whole spec as the arguments of f_n_read before its point, each of its type in GLSL (Numbers). */
	GLSLNumbers: function (whole) {
		var types = 'iiifffffffffffiibffibffffffbbff';

		return this.Numbers(whole).map(function (value, index) {
			var text;

			if (types.charAt(index) === 'b')
				return value ? 'true' : 'false';

			if (types.charAt(index) === 'i')
				return String(Math.round(Number(value)));

			text = String(Number(value));

			return /[.eE]/.test(text) ? text : text + '.0';
		}).join(', ');
	},

	/*
	 * The function of a spec for a shader, float name(vec3 p), after GLSLChunk: f_n_read of its numbers, the very numbers
	 * of At, to the float. A blend makes a function of each of its noises too (name_0, name_1...).
	 */
	GLSL: function (spec, name) {
		var self = this;
		var given = spec || {};
		var made = [];
		var lines;
		var body;
		var post;

		function number (value) {
			var text = String(Number(value));

			return /[.eE]/.test(text) ? text : text + '.0';
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

			post = this.Post(given);

			/* What is done to the blend: f_n_finish of the Kernel, as Finish does it. */
			return made.join('\n') + '\nfloat ' + name + '(vec3 p) {\n\treturn f_n_finish(' + body + ', ' + number(post.Steps) + ', ' + number(post.Sharp) + ', ' + number(post.Power) + ', ' + (post.Invert ? 'true' : 'false') + ', ' + (post.Range ? 'true' : 'false') + ', ' + number(post.Range ? post.Range[0] : 0) + ', ' + number(post.Range ? post.Range[1] : 1) + ');\n}';
		}

		lines = this.GLSLLines(given, name, 'p');

		return 'float ' + name + '(vec3 p) {\n\t' + lines.Lines.join('\n\t') + '\n\treturn ' + lines.Value + ';\n}';
	},

	/*
	 * A noise of a spec (not a blend) as lines of GLSL in the body of a shader, after GLSLChunk: Lines (its variables named
	 * after prefix) and Value, the variable that holds it, of the point (a vec3): f_n_read of the numbers of the spec.
	 */
	GLSLLines: function (spec, prefix, point) {
		var q = prefix + '_q';
		var value = prefix + '_value';

		return {Lines: ['vec3 ' + q + ' = ' + point + ';', 'float ' + value + ' = f_n_read(' + this.GLSLNumbers(this.Whole(spec || {})) + ', ' + q + '.x, ' + q + '.y, ' + q + '.z);'], Value: value};
	}
});
