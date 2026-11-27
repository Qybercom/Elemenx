<!-- generated -->
# WorldEditor

WorldEditor: редактор целого мира, уровень в уровне — галактика (Scene в режиме galaxy, GalaxyData), система звезды (SceneEditor в режиме space, SystemData), планета системы (PlanetEditor), локация планеты (SceneEditor с землёй). Путь сверху ведёт на любой уровень вверх; кнопка «Войти» ведёт вниз в выбранное (звезду, планету). То, что мир использует, правится рядом, каждое в своей вкладке: модели (ModelEditor), растения (FloraEditor), катсцены (CutsceneEditor), материалы (Blueprint типа material). Катсцена принадлежит локации мира (Location — ключ локации в ресурсе катсцены): во вкладке выбирается локация, рядом с редактором катсцены показывается её сцена, в ней катсцена играется, записывается, и из её вида берутся камера и ключи. Катсцена, добавленная, когда открыта локация, сразу принадлежит ей. Графы библиотеки, из которых строятся его земли и планеты (blueprints/planet, sketch и carve в ElemenxGraphics), меняются только для этого мира, каждый в своей вкладке (Blueprint типа generator): при первом изменении это копия библиотечного, «Вернуть библиотечный» убирает её. Планеты мира получают графы planet/ (planet/relief — опция ReliefGraph и т. д.), земли его локаций — графы sketch/ и carve/ (Graphs трейта Terrain); в планетах и локациях мира они не хранятся.

- Value — мир: {Name, Galaxy (опции GalaxyData.Make или её данные), Planets ({'звезда/тело': опции планеты}), Locations ({'звезда/тело/локация': документ SceneEditor}), Resources ({Models, Plants, Cutscenes, Materials}: {ID: {Name, Value}}), Graphs ({'planet/relief', 'sketch/river'...: граф})}.
- Generator — генератор моделей для вкладок моделей (как у ModelEditor).
- События: change (мир после каждой правки), level ({Path: [{Level, ID}]}), error (файл мира не прочитан).
- World(), Load(world), Galaxy(), Path() — мир, его галактика, путь.
- Enter(level, id, callback) — вниз: system (id — звезда), planet (id — тело системы), location (id — локация); Up(index) — вверх по пути (0 — галактика).
- AddResource(kind), OpenResource(kind, id) — ресурс (model, plant, cutscene, material) в своей вкладке.
- GraphNames() — графы библиотеки, которые мир может изменить; OpenGraph(name) — граф мира в его вкладке (при первом открытии — копия библиотечного); ResetGraph(name) — вернуть библиотечный. ShaderGraphs() — графы сцен мира: shader/, planet/envelope (оболочка тел: воздух, облака, свет и земли поверхности, недра гигантов) cloud/ (звёзды неба и ночи, рои скоплений, камни поясов) network/ (network/rivers — реки его планет, опция RiversGraph; network/roads и network/track) и layout/ (планы поселений его локаций — grid, main, road, radial, districts — через Graphs их Terrain; village и формы развязок, а также image/ — кора и листья растений: эти и трасса пока только показываются рядом) — их читает сцена, поэтому при их правке сцена системы или локации пересоздаётся. Вкладка графа — Blueprint его вида; у графа, который строит данные (облако точек, сеть, раскладка, картинка), рядом рисуется то, что он даёт, по мере правки (BlueprintPreview).
- Pack(callback), Open(source, callback) — файл мира (zip): world.json и части галактики в galaxy/ (её записанные системы с ними).

В галактике: выбор звезды, переименование, удаление, «Звезда здесь» и «Тело здесь» (там, куда смотрит вид); у тела вне систем — скорость (св. лет за млн лет), с которой оно движется по ползунку времени.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Label` | `''` |

## События

- `change`
- `level`
- `error`

## Методы

- `Load(world)`
- `World()`
- `Galaxy()`
- `Path()`
- `Up(index)`
- `Enter(level, id, callback)`
- `AddResource(kind)`
- `OpenResource(kind, id)`
- `GraphNames()`
- `OpenGraph(name)`
- `ResetGraph(name)`
- `Pack(callback)`
- `Open(source, callback)`

## Тесты

- [goes from its galaxy into the system of a star and a planet of it, and back up its path](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L53) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [goes into a nebula of its galaxy as into a system, edits its kind and its size there, and keeps them in the world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L107) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [searches its galaxy round where the view looks: a type, a mass, a text; a row chosen flies to it, chosen twice goes into it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L155) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [plays a cutscene of the world in a scene of the location it is of, chosen in its tab](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L217) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [opens what the world uses in tabs of their editors: a model, a plant, a cutscene, a material](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L261) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [changes a graph of the library for the world alone in a tab, gives it to its planets and the grounds of its locations, and gives the library's back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L291) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [changes a shader graph for the world alone: the scenes of its systems and locations drawn with it, made again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L396) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [changes a cloud, a network and a layout graph for the world alone in a Blueprint of its kind, what each gives drawn beside it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L437) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [keeps all of the world in one file: its galaxy and its edits, its planets, its locations and its resources](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L497) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [puts a star and a body of no system where the view looks, and the body goes along the velocity told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L537) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [makes its panel as wide as its edge is dragged and keeps the width for the next time](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L556) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
