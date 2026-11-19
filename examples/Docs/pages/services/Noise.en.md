<!-- generated -->
# Noise

Noise: the noise of space by any of its algorithms and with what is done to it, one description for all that is made of noise (a ground, a texture, a field of growth, a flow), the same in the page, in a worker, in Node and in a shader.

- A noise is described by a spec: {Type (value, perlin, simplex, worley, white, gradient: of slopes of any way, its lattice turned off the axes, no squares seen from far), Seed, Scale (the size of its features, in the units it is sampled in: 1), Offset ([x, y, z]), Fractal (none, fbm, ridged, billow), Octaves (4), Lacunarity (how much finer each octave is: 2.03; whole numbers when it tiles), Gain (how much fainter: 0.5), Shift ([x, y, z], added to each octave: [1.7, 9.2, 3.1]), Cell ({Distance: euclid, manhattan or chebyshev; Return: f1, f2, edge (f2 less f1) or cell (a number of its cell); Jitter, 0 to 1}: of worley), Warp ({Amount (in features), Scale (of the warp to the noise: 1), Octaves (2)}: the space bent by a noise of its own before it is read), Tile ([x, y, z]: features along each axis after which it repeats, 0 not; value, perlin, worley and white), Terrace ({Steps, Sharp (0 smooth to 1 hard steps)}), Power, Invert, Range ([low, high]: what 0 and 1 become)}. A spec may also be {Combine (add, multiply, min, max, mask), Of ([specs]), Weights (of add), Mask (a spec: mask mixes the first two by it)} and the same post (Terrace, Power, Invert, Range). Value with fbm (6 octaves) is Fbm of Math.Noise, to the bit.
- Make(spec) is its sampler: At(x, y, z) (0 to 1 before Range; z may be left out), Gradient(x, y, z) ([x, y, z]), Curl(x, y, z) (a flow with no source nor sink: what moves smoke, dust, water), Grid(options) (a Float32Array of Width by Height values, row by row, from X, Y with a Step, on the Plane xz, the default, or xy; Z the third axis).
- Types(), Fractals(): the names they may be.
- The noise of a shader is of the Kernel too: GLSLKernel() the Kernel as GLSL (f_n_hash, f_n_value... f_n_read), GLSLPieces() its functions and those of GLSLWrappers by their names, GLSLFaster those a shader makes as vectors (the very numbers). GLSLChunk(names): what a shader asks of them (enx_hash3, enx_value3, enx_perlin3, enx_simplex3, enx_worley3, enx_gradient3, enx_value2, enx_fvalue3 (a value noise of n_fhash, only drawn), enx_white, enx_white2, enx_white3: a number of 0 to 1 of any numbers, enx_pcg3, enx_hash4; f_n_...) and what they call, each once in a shader however many times it comes (ENX_<name>); all with none. Two hashes: n_hash of whole numbers, the same in the page and in a shader (noise3 and fbm3 of Renderer, a ground of the CPU and of the GPU alike), and n_fhash of a sine, cheap, for what a shader reads many times a pixel. GLSL(spec, name): a function float name(vec3 p) of the spec, after them: f_n_read of its numbers (GLSLNumbers(whole)), the same numbers as At, to the float; GLSLLines(spec, prefix, point): the same as lines of the body of a shader ({Lines, Value}), with no function of its own (a block of a graph of shaders).
- Source(names) gives its members to a worker of the Workers Service.
- Its numbers are of one source, Kernel (the kernel language of Elemenx.Compilers): Code() its functions as js (made in the page; a worker makes them of the text it carries, Compiled), IR() the module of the IR (for a graph of noise of Blueprints.Numeric), Wasm() the wasm of it ({Bytes, Exports}, n_read in batches: Batch('n_read', points, count, Numbers(Whole(spec)))), the very numbers of its js. Whole(spec) a spec with its defaults, Numbers(whole) the 31 numbers of it n_read takes before its point.

The same functions run in Node: they read no page.

## Methods

- `Types()`
- `Fractals()`
- `Source(names)`
- `Whole(spec)`
- `Code()`
- `IR()`
- `Wasm()`
- `Numbers(whole)`
- `Gradient(hash, x, y, z)`
- `Make(spec)`
- `GLSLKernel()`
- `GLSLPieces()`
- `GLSLChunk(names)`
- `GLSLNumbers(whole)`
- `GLSL(spec, name)`
- `GLSLLines(spec, prefix, point)`

## Tests

- [reads a noise of the Noise Service by the spec of its block, in a generator and in a pass, the same numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L665) — `tests/regression/blueprints.test.js`
- [makes the kernel of the Noise Service a library of a shader: its value noise of the page as near as floats hold it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-glsl.test.js#L286) — `tests/regression/compilers-glsl.test.js`
- [wraps whole numbers round as the hash of the Noise Service does](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/compilers-wasm.test.js#L94) — `tests/regression/compilers-wasm.test.js`
- [is Math.Noise to the bit as value noise with fbm or ridged octaves, the same seed giving the same numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L27) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [gives the very numbers of simplex noise it gave before it made no arrays, warped and ridged as well](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L42) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [gives each type within 0 and 1, of its seed, smooth where it should be](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L114) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [tiles: what repeats after Tile features along each axis, octaves and all](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L140) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [reads the cells of worley noise: the nearest point, the next, the edge between them, a number for each cell](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L150) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [does what follows: terraces, a power, the other way round, a range; blends of noises, a grid, a gradient and a curl](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L172) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [writes a spec as a function of a shader that gives the same numbers as the page](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L203) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [gives a shader what it asks of its GLSL and what that calls, once in it, its faster functions the numbers of the Kernel](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L263) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [gives the very numbers of its js in wasm, a batch of points of a spec given once](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L381) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`

+8 more in the same files
