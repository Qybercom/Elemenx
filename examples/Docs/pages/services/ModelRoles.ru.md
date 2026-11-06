<!-- generated -->
# ModelRoles

ModelRoles: что такое части модели — её колёса, руль и педали, двери, фары, дверь дома, рычаг, люк, вентилятор. Роль задаётся на частях модели, выбранных в редакторе (ModelEditor, вкладка «Роли»): на кусках модели (узел, меш, материал файла) и на треугольниках куска, закрашенных кистью. Scene двигает их, как говорит роль, на любом объекте с этой моделью и зажигает её фары.

- Роль — {ID, Kind, Name, Parts: [{Piece (ID куска модели), Vertices ([[from, to]...]: только треугольники, все вершины которых в этих диапазонах; без них — весь кусок)}], Both (стоит с обеих сторон модели, зеркально по x: пара дверей), Motion: {Type (hinge, slide, spin, glow или none), Pivot ([x, y, z] модели, ось петли), Axis, Angle (градусы при 1), Aside и AsideAngle (вторая ось: рычаг передач), Way и Reach (сдвиг), Speed (оборотов в секунду при 1: вращение)}, Drive (что двигает водитель: steer, gas, brake, hand, gear, sequential, paddle, indicator, wipers), Sign, Pace (как быстро доходит, в секундах), Open (где стоит, от 0 до 1), Follow (ID роли, которая её несёт: лепесток на руле, стекло двери), Light ({Kind (head, rear, brake, reverse, indicator; glow — горит настолько, насколько задано), Color, Glow, Power, Radius, Spot, Aim, At}), Corner (у колеса: FL, FR, RL, RR) и Held (у колеса: то, что его держит — поворачивается и ходит с ним, но не крутится)}.
- Kinds() — виды ролей по группам с тем, с чего начинается новая роль; Kind(id) — один вид. Make(kind, props) — новая роль вида.
- Роли модели: Get(model) (сохранённые для неё, иначе Roles её рецепта в SceneModels), Set(model, roles), Remove(model), Models(); хранятся в хранилище браузера (StorageKey). Export() — все роли текстом файла, Import(text) читает его поверх сохранённых.
- Rig(roles) — то, что берёт Scene: {Openings, Lamps, Wheels}, как их называют настройки транспорта.
- Ranges(indices) упаковывает список вершин в диапазоны, Within(ranges, index) проверяет вершину.
- Version() меняется с каждой правкой; OnChange(listener) и OffChange(listener). После правки модель пересобирается (SceneModels.Remake).

На сцене: Parts(id) — роли объекта, Part(id, role) — одна: Get(), Set(value), событие part ({ID, Role, Value}).

Новые группы ролей:
- chassis (шасси машины): arm — рычаг подвески, качается с ходом своего колеса (Drive stroke, Corner, Length — длина в единицах модели); knuckle — поворотный кулак, поворачивается с колесом (wheel-steer); shock — амортизатор, растягивается от точки крепления вдоль Way с ходом колеса (Motion stretch); halfshaft — полуось, крутится с колесом (roll); gauge-speed и gauge-rpm — стрелки скорости и оборотов; exhaust — выхлоп, дымит при газе;
- flight (летательный аппарат): aileron, elevator, rudder — от крена, тангажа и рыскания; flap — закрылки на малом газу; propeller — винт от газа; gear-leg — стойка шасси, убирается в полёте;
- weapons (оружие): turret и barrel — по Aim объекта ({Yaw, Pitch} в градусах); recoil — откат при выстреле (Fired: секунды сцены);
- mechanisms (механизмы): drawer, lid, button, valve; turbine — от ветра; clock-hour и clock-minute — стрелки по времени суток; radar; boom; platform;
- points (точки): socket — точка крепления (Scene.Socket(id, name) → {At, Axis}); emitter — излучатель эффекта (Effect, Rate — выбросов в секунду, Drive); collider — части роли становятся коллайдером по своему контуру.

Rig отдаёт ещё Sockets, Emitters и Colliders, а у Openings появились Stretch, Corner и Length. Приводы, которые ставят часть сразу, без Pace: steer, wipers, stroke, wheel-steer, roll, pitch, yaw, roll-air, aim-yaw, aim-pitch, fire, clock-hour, clock-minute.

## Методы

- `Version()`
- `Kinds()`
- `Kind(id)`
- `Make(kind, props)`
- `Get(model)`
- `Set(model, roles)`
- `Remove(model)`
- `Models()`
- `Export()`
- `Import(text)`
- `Rig(roles)`
- `Ranges(indices)`
- `Within(ranges, index)`
- `OnChange(listener)`
- `OffChange(listener)`

## Тесты

- [edits the roles of another model, kept by ModelRoles, and undoes them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/ModelEditor/ModelEditor.test.js#L185) — `libraries/ElemenxGraphics/components/ModelEditor/ModelEditor.test.js`
- [lists its kinds by group and makes a role of a kind, what the kind starts as under what is given](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L70) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [keeps the roles of a model in the storage of the browser, writes them into a file and reads them back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L85) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [gives a Scene its rig: what moves, what glows and the wheels, each of its parts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L116) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [packs the vertices a brush painted into ranges and finds one in them](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L134) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [cuts what a role names out of a model of a file: a whole piece, or only the painted triangles of one](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L144) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [moves the door of a house as its role says: Part(id, role) sets it, it comes by degrees, the scene tells it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L161) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [drives a shock by its wheel, a clock by the time, a turret by its aim; holds at a socket, emits, and collides](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L222) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
- [lights a lamp of a role as far as it is set, turns a fan while it is on, and remakes the model when the roles change](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js#L292) — `libraries/ElemenxGraphics/services/ModelRoles/ModelRoles.test.js`
