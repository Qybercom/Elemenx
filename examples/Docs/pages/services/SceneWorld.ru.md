<!-- generated -->
# SceneWorld

SceneWorld: мир земли как граф её шагов — единственное место, где задаются земля и всё, что на ней создаётся. Это граф вида world сервиса Blueprints (объявлен в $Provides). Его блоки — шаги с типизированными входами и выходами: земля (тип land, параметры SceneTerrainGenerator.Flat) идёт от шага к шагу, а то, что создаётся на ней (тип things, объекты сцены), собирается своей цепочкой; конечный блок Terrain принимает и то и другое.

- Ground — земля: Size, Height, Water, Seed, Rock, Snow (числа можно подать на входы).
- Relief — холмы: Scale и Ridges, свой граф (Graph, генератор Blueprints: X, Z → Height, Moisture, Temperature; начать с LibraryRelief) или спецификация сервиса Noise (Noise).
- Climate — числа климата: Warmth, Lapse, Spread, Stretch (ClimateOf у SceneTerrainGenerator).
- Biomes — биомы по климату (List: имена SceneBiomes или записи {Biome, Ground, Grass, Climate, Scatter}).
- Sketch — эскиз поверх земли (Sketch: {Layers}, как его рисует SceneEditor).
- Border — контур локации (Points, Sides из ScenePlanet.CellPlace), что за ним (Beyond: far, cliff, void, sea, wall; Edge, Depth — SceneTerrainGenerator.Border) и её проходы (Passages из SceneLocations): из каждого дорога (у вида river — река) от стороны к середине; при wall по контуру стоит стена, открытая у проходов, в проходах вида gate — ворота. Open — стороны, на которых стены и обрыва нет: рядом задана локация.
- Footings — земля подстраивается под здания: ровная площадка под каждым, Margin метров вокруг, на высоте земли там (Mode: mean, low, high), земля подходит к ней в пределах Edge (трейт SceneFootings сцены).
- Settlement — деревня (X, Y, Houses, Radius, Seed, Shapes); Scatter — посев по правилу (Kind, Shapes, Density, Size, MinHeight, MaxHeight, MaxSlope, Cover, Patch, Clumps, Seed, Blocks, Biome и Graph — своё правило-граф, начать с LibraryScatter у SceneSower). Каждый берёт то, что было до него (Under), и отдаёт со своим.

Выключенный блок пропускает то, что к нему пришло. Любой сервис может добавить свои шаги — блоки вида world, объявленные в $Provides: земля на входе и земля на выходе или вещи на входе и вещи на выходе. Блоки генераторов (числа, параметры) тоже доступны.

- Make(graph, parameters) → {Ground (параметры земли; null без графа или без земли), Things (объекты: {ID, Kind, Values}, ID по порядку), Problems (что мешает графу работать)}; для одного графа и параметров считается один раз.
- Library(options) — граф обычного мира из параметров (Size, Height, Water, Seed, Rock, Snow, Scale, Ridges, Noise, Relief, Planet, Climate, Biomes, Sketch, Border; Settlements и Scatters — списки свойств таких блоков): с него начинает редактор или страница.

В сцене земля — `<SceneObject Kind="ground" [world]="World" />`; объекты её графа появляются в сцене с пометкой Generated (ID земли и номер), пересоздаются вместе с графом и не сохраняются. В SceneEditor граф открывается вкладкой «Мир» нижней панели; граф шага Relief или Scatter открывается своей вкладкой, когда этот блок выбран. Работает и в Node.

Шаг Planet — место планеты ScenePlanet (Planet — её параметры; Latitude, Longitude, Turn): земля локации — это земля глобуса в этой точке, точно: берега, высоты (метры, уровень моря 0), климат и биомы (SceneTerrainGenerator.Site — касательная плоскость в точке, X на восток, Z на юг). Соседние локации сходятся на общей границе. В Library — параметр Planet: {Options, Latitude, Longitude, Turn}.

## Методы

- `Make(graph, parameters)`
- `Library(options)`

## Тесты

- [makes the land of its steps: the very ground of the same numbers, the things made on it in their order](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L20) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [lets what comes to a step turned off through, takes numbers from blocks of a generator, and tells what keeps it from running](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L39) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [takes steps of its own of any Service: a land in, a land out, typed so a land never goes where things are taken](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L71) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [cuts its land with steps of its volume: tunnels, caves, overhangs, each one more carve of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L97) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [makes the land of a place of a planet exactly as its globe: its heights and coasts, its lands, its neighbour meeting it at their border, the same in a worker](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js#L107) — `libraries/ElemenxGraphics/services/SceneWorld/SceneWorld.test.js`
- [makes the objects of the World of a ground in the scene, marked in the tree, not saved: they come again of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L734) — `tests/regression/library-scene-editor.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L146) — `tests/regression/library-scene-landing.test.js`
- [walks a hero with the feet of a body: walls stop it at any speed, it slides along them, jumps and falls, and faces the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1778) — `tests/regression/library-scene.test.js`
- [lets go of neither a hero nor the view on Escape, and takes no leap of the pointer](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2824) — `tests/regression/library-scene.test.js`
- [never lets a hero out of the view, and ends a press when the pointer is taken or given back](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2890) — `tests/regression/library-scene.test.js`
- [stands the view of a walker behind it, in its eyes or over its shoulder, and V goes through them with the pointer taken](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3001) — `tests/regression/library-scene.test.js`
- [shows the axes of a view in a corner, and a press on one looks along it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3119) — `tests/regression/library-scene.test.js`

+25 ещё в тех же файлах
