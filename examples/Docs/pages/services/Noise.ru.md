<!-- generated -->
# Noise

Noise: шум пространства любым алгоритмом и всё, что с ним делают, — одно описание для всего, что строится из шума (земля, текстура, поле роста, поток). Одинаково на странице, в воркере, в Node и в шейдере.

- Шум описывается спецификацией: {Type (value, perlin, simplex, worley, white, gradient — шум градиентов любого направления с решёткой, повёрнутой от осей: издали в нём не видно квадратов, им сделаны облака галактики), Seed, Scale (размер деталей в единицах, в которых его читают), Offset, Fractal (none, fbm, ridged, billow), Octaves, Lacunarity, Gain, Shift, Cell ({Distance: euclid, manhattan, chebyshev; Return: f1, f2, edge, cell; Jitter}: у worley), Warp ({Amount, Scale, Octaves}: искажение пространства своим шумом), Tile ([x, y, z]: через сколько деталей повторяется; value, perlin, worley, white), Terrace ({Steps, Sharp}), Power, Invert, Range ([низ, верх])}. Спецификация может быть и смесью: {Combine (add, multiply, min, max, mask), Of, Weights, Mask} с той же обработкой. Value с fbm (6 октав) совпадает с Fbm из Math.Noise до бита.
- Make(spec) — сэмплер: At(x, y, z), Gradient(x, y, z), Curl(x, y, z) (поток без источников и стоков: дым, пыль, вода), Grid({Width, Height, X, Y, Step, Plane, Z}) — Float32Array.
- Types(), Fractals() — допустимые имена.
- Шум шейдеров тоже из ядра: GLSLKernel() — ядро на GLSL (f_n_hash, f_n_value… f_n_read), GLSLPieces() — его функции и обёртки GLSLWrappers по именам, GLSLFaster — функции, которые шейдер считает векторами (числа те же). GLSLChunk(names) — то, что шейдер просит (enx_hash3, enx_value3, enx_perlin3, enx_simplex3, enx_worley3, enx_gradient3, enx_value2, enx_white, enx_white2, enx_fvalue3 — шум значений на синусном хэше, только для картинки, enx_white3 — число от 0 до 1 любых чисел, enx_pcg3, enx_hash4 — n_hash четырёх точек сразу; f_n_…), и то, что они вызывают; каждая функция один раз в шейдере, сколько бы раз её ни подключили (ENX_<имя>); без names — всё. Хэша два: n_hash целых чисел — один и тот же в странице и в шейдере (noise3 и fbm3 у Renderer: земля процессора и видеокарты одинакова), и n_fhash синуса — дешёвый, для того, что шейдер читает много раз на пиксель. Раньше шум шейдеров был переписан руками в пяти местах, а синусный хэш — в 37. noise3 считает восемь углов по четыре сразу (те же числа): с хэшем каждого угла отдельно Ground глобуса собирался 7 с, теперь его шумы картинки — enx_fvalue3, и он собирается около 3 с. GLSL(spec, name) — функция float name(vec3 p); GLSLLines(spec, prefix, point) — то же строками тела шейдера ({Lines, Value}). Числа совпадают с At до точности float.
- Kernel — единый источник чисел шума: текст на языке ядра (kernel) Elemenx.Compilers. Code() — его функции на js (делаются на странице; воркер собирает их из переданного текста Compiled), IR() — модуль IR (для графов шума Blueprints.Numeric), Wasm() — тот же модуль в WebAssembly ({Bytes, Exports}; пачками: Elemenx.Compilers.Instance(noise.Wasm()).Batch('n_read', точки, число, noise.Numbers(noise.Whole(spec)))). Числа js и wasm совпадают до бита, в любом браузере.

Где применяется: земля SceneTerrainGenerator.Flat принимает Noise (спецификацию: её холмы из этого шума, в метрах; без неё — прежние холмы Scale и Ridges), блок NoiseSpec есть и в генераторных, и в шейдерных графах Blueprints. Демо Terrain на странице /graphics примера Advanced переключает рельеф: классические холмы, дюны Ворли, хребты Перлина, холмы симплекса, террасы с искажением.

## Методы

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

## Тесты

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

+8 ещё в тех же файлах
