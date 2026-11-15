WorldEditor: редактор целого мира, уровень в уровне — галактика (Scene в режиме galaxy, GalaxyData), система звезды (SceneEditor в режиме space, SystemData), планета системы (PlanetEditor), локация планеты (SceneEditor с землёй). Путь сверху ведёт на любой уровень вверх; кнопка «Войти» ведёт вниз в выбранное (звезду, планету). То, что мир использует, правится рядом, каждое в своей вкладке: модели (ModelEditor), растения (FloraEditor), катсцены (CutsceneEditor), материалы (Blueprint типа material).

- Value — мир: {Name, Galaxy (опции GalaxyData.Make или её данные), Planets ({'звезда/тело': опции планеты}), Locations ({'звезда/тело/локация': документ SceneEditor}), Resources ({Models, Plants, Cutscenes, Materials}: {ID: {Name, Value}})}.
- Generator — генератор моделей для вкладок моделей (как у ModelEditor).
- События: change (мир после каждой правки), level ({Path: [{Level, ID}]}), error (файл мира не прочитан).
- World(), Load(world), Galaxy(), Path() — мир, его галактика, путь.
- Enter(level, id, callback) — вниз: system (id — звезда), planet (id — тело системы), location (id — локация); Up(index) — вверх по пути (0 — галактика).
- AddResource(kind), OpenResource(kind, id) — ресурс (model, plant, cutscene, material) в своей вкладке.
- Pack(callback), Open(source, callback) — файл мира (zip): world.json и части галактики в galaxy/ (её записанные системы с ними).

В галактике: выбор звезды, переименование, удаление, «Звезда здесь» и «Тело здесь» (там, куда смотрит вид); у тела вне систем — скорость (св. лет за млн лет), с которой оно движется по ползунку времени.
