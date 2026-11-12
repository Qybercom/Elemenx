<!-- generated -->
# SceneProxies

SceneProxies: what stands far away, many things as one simpler shape (a proxy of a tile, the way Voxy for Minecraft draws its far land): the copies of shapes in a square of the world merged into one geometry, each corner snapped to a grid of a cell as large as the square is far (Cell), the corners of a cell made one, the faces that lost a corner gone. A thing too small for its cell would so be gone too (a far forest of nothing): it is a small body of its size and of the color of its upper part (a crown, a roof) instead. The same in a page, a worker and Node (it reads no page).

- Shape(geometry) the data of a shape a proxy is made of, made once ({Positions, Colors, Indices} as Float32Array and Uint32Array; Box [minX, minY, minZ, maxX, maxY, maxZ]; Radius, round its origin; Color, of its upper part).
- Merge(job) the proxy of a tile: job {Shapes ({key: a Shape, or the name a worker keeps it under by Share of Workers}), Lists ([{Shape (its key), Places, Extra (Float32Array, four numbers a copy: x, y, z, size; turn round the up, then the tint r, g, b, as the Scatter of a Scene keeps them), or Matrices (12 a copy: its x, y and z axes and its place, turned any way, as a model of the scene stands) and Tints (3 a copy), Count}]), Origin ([x, y, z]: the positions are relative to it, exact in floats), Cell (the size of the grid)}. It gives {Positions, Normals, Colors (Float32Array, three numbers a vertex, each face of its own vertices: flat), Triangles, Copies, Bodies (the copies made small bodies)}.
- Pack(made) a proxy made small to be kept (SceneCache): {Positions (Int16Array, of the box of the proxy), Box, Colors (Uint8Array, a quarter of a step a unit: colors up to 4, a lit window over 1), Triangles}, a quarter of its size; no normals. Unpack(packed) the proxy again, its normals of its faces (it is flat): what Merge gave, to a centimetre.
- Work(): the pool of its workers, made once.

## Methods

- `Work()`
- `Shape(geometry)`
- `Merge(job)`
- `Pack(made)`
- `Unpack(packed)`

## Tests

- [draws the far tiles as proxies, each one shape of their things, and none with Proxies false](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L53) — `tests/regression/scatter-proxies.test.js`
- [takes the proxies of the same world from the cache of the browser the next time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L98) — `tests/regression/scatter-proxies.test.js`
- [makes its streams again at most each 400 ms while a ground is sown, not in every frame](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L163) — `tests/regression/scatter-proxies.test.js`
- [shows the numbers of a frame in a corner while Levels is on, turned on and off by Ctrl+Shift+L](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L250) — `tests/regression/scatter-proxies.test.js`
- [draws into the voxels only what is sown in the box of their grid](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L294) — `tests/regression/scatter-proxies.test.js`
- [makes the data of a shape: its box, how far it reaches, the color of its upper part](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L32) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
- [merges the copies of a tile into one shape of fewer faces, the small ones as small bodies](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L47) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
- [packs a proxy small to be kept and unpacks it as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L75) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
- [makes the same proxy in a worker, its shapes sent once by Share](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js#L101) — `libraries/ElemenxGraphics/services/SceneProxies/SceneProxies.test.js`
