<!-- generated -->
# Noise

Noise: the noise of space by any of its algorithms and with what is done to it, one description for all that is made of noise (a ground, a texture, a field of growth, a flow), the same in the page, in a worker, in Node and in a shader.

- A noise is described by a spec: {Type (value, perlin, simplex, worley, white), Seed, Scale (the size of its features, in the units it is sampled in: 1), Offset ([x, y, z]), Fractal (none, fbm, ridged, billow), Octaves (4), Lacunarity (how much finer each octave is: 2.03; whole numbers when it tiles), Gain (how much fainter: 0.5), Shift ([x, y, z], added to each octave: [1.7, 9.2, 3.1]), Cell ({Distance: euclid, manhattan or chebyshev; Return: f1, f2, edge (f2 less f1) or cell (a number of its cell); Jitter, 0 to 1}: of worley), Warp ({Amount (in features), Scale (of the warp to the noise: 1), Octaves (2)}: the space bent by a noise of its own before it is read), Tile ([x, y, z]: features along each axis after which it repeats, 0 not; value, perlin, worley and white), Terrace ({Steps, Sharp (0 smooth to 1 hard steps)}), Power, Invert, Range ([low, high]: what 0 and 1 become)}. A spec may also be {Combine (add, multiply, min, max, mask), Of ([specs]), Weights (of add), Mask (a spec: mask mixes the first two by it)} and the same post (Terrace, Power, Invert, Range). Value with fbm (6 octaves) is Fbm of Math.Noise, to the bit.
- Make(spec) is its sampler: At(x, y, z) (0 to 1 before Range; z may be left out), Gradient(x, y, z) ([x, y, z]), Curl(x, y, z) (a flow with no source nor sink: what moves smoke, dust, water), Grid(options) (a Float32Array of Width by Height values, row by row, from X, Y with a Step, on the Plane xz, the default, or xy; Z the third axis).
- Types(), Fractals(): the names they may be.
- GLSLChunk(): the functions a shader needs once (enx_hash3, enx_value3, enx_perlin3, enx_simplex3, enx_worley3); GLSL(spec, name): a function float name(vec3 p) of the spec, after them: the same numbers as At, to the float; GLSLLines(spec, prefix, point): the same as lines of the body of a shader ({Lines, Value}), with no function of its own (a block of a graph of shaders).
- Source(names) gives its members to a worker of the Workers Service.

The same functions run in Node: they read no page.

## Methods

- `Types()`
- `Fractals()`
- `Source(names)`
- `Make(spec)`
- `Gradient(hash, x, y, z)`
- `GLSLChunk()`
- `GLSL(spec, name)`
- `GLSLLines(spec, prefix, point)`

## Tests

- [reads a noise of the Noise Service by the spec of its block, in a generator and in a pass, the same numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L665) — `tests/regression/blueprints.test.js`
- [is Math.Noise to the bit as value noise with fbm or ridged octaves, the same seed giving the same numbers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L27) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [gives each type within 0 and 1, of its seed, smooth where it should be](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L38) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [tiles: what repeats after Tile features along each axis, octaves and all](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L64) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [reads the cells of worley noise: the nearest point, the next, the edge between them, a number for each cell](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L74) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [does what follows: terraces, a power, the other way round, a range; blends of noises, a grid, a gradient and a curl](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L96) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [writes a spec as a function of a shader that gives the same numbers as the page](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Noise/Noise.test.js#L124) — `libraries/ElemenxCommon/services/Noise/Noise.test.js`
- [makes a vertex graph a function that moves a corner and its normal, of blocks or of GLSL written by hand](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L319) — `tests/regression/blueprints.test.js`
- [makes a material and a pass written by hand of their GLSL, and draws the pass](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L354) — `tests/regression/blueprints.test.js`
- [raises its hills of the noise its options give, the same in a worker, and the same as ever without one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js#L336) — `libraries/ElemenxGraphics/services/SceneTerrainGenerator/SceneTerrainGenerator.test.js`
