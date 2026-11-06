<!-- generated -->
# Noise

Noise: шум пространства любым алгоритмом и всё, что с ним делают, — одно описание для всего, что строится из шума (земля, текстура, поле роста, поток). Одинаково на странице, в воркере, в Node и в шейдере.

- Шум описывается спецификацией: {Type (value, perlin, simplex, worley, white), Seed, Scale (размер деталей в единицах, в которых его читают), Offset, Fractal (none, fbm, ridged, billow), Octaves, Lacunarity, Gain, Shift, Cell ({Distance: euclid, manhattan, chebyshev; Return: f1, f2, edge, cell; Jitter}: у worley), Warp ({Amount, Scale, Octaves}: искажение пространства своим шумом), Tile ([x, y, z]: через сколько деталей повторяется; value, perlin, worley, white), Terrace ({Steps, Sharp}), Power, Invert, Range ([низ, верх])}. Спецификация может быть и смесью: {Combine (add, multiply, min, max, mask), Of, Weights, Mask} с той же обработкой. Value с fbm (6 октав) совпадает с Fbm из Math.Noise до бита.
- Make(spec) — сэмплер: At(x, y, z), Gradient(x, y, z), Curl(x, y, z) (поток без источников и стоков: дым, пыль, вода), Grid({Width, Height, X, Y, Step, Plane, Z}) — Float32Array.
- Types(), Fractals() — допустимые имена.
- GLSLChunk() — функции, нужные шейдеру один раз; GLSL(spec, name) — функция float name(vec3 p); GLSLLines(spec, prefix, point) — то же строками тела шейдера ({Lines, Value}). Числа совпадают с At до точности float.

Где применяется: земля SceneTerrainGenerator.Flat принимает Noise (спецификацию: её холмы из этого шума, в метрах; без неё — прежние холмы Scale и Ridges), блок NoiseSpec есть и в генераторных, и в шейдерных графах Blueprints. Раздел Terrain в UI kit переключает рельеф: классические холмы, дюны Ворли, хребты Перлина, холмы симплекса, террасы с искажением.

## Методы

- `Types()`
- `Fractals()`
- `Source(names)`
- `Make(spec)`
- `Gradient(hash, x, y, z)`
- `GLSLChunk()`
- `GLSL(spec, name)`
- `GLSLLines(spec, prefix, point)`

## Тесты

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
