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
