<!-- generated -->
# SceneWeapons

SceneWeapons: выстрелы сцены и то, что они делают там, куда попали. Здоровья сцена не знает: о каждом попадании она сообщает событием hit и хуком Hit своих поведений. Урон из попаданий делает Vitals из ElemenxGaming (компонент GameCombat или GameStrategy).

Оружие — это тип. Weapons({имя: {...}}) добавляет новые типы или меняет существующие. Поля типа:
- Kind:
  - bullet — луч сразу, по нему летит трассер;
  - beam — луч, пока его держат (лазер);
  - rail — луч сразу, после него остаётся спираль света;
  - projectile — летящее тело: Speed, Gravity, Homing (наведение на захваченную цель), Size, Trail (smoke или thin), Stick (стрела оставляет след), Arc: 'high' (навесная траектория к точке).
- Damage — урон за попадание; у луча — урон в секунду.
- Type — тип урона: kinetic, energy, explosive, fire… (для сопротивлений).
- Rate — выстрелов в секунду; Range — метры; Spread — разброс в градусах; Pellets — сколько лучей в одном выстреле.
- Radius — взрыв в конце пути: урон убывает с расстоянием, твёрдые тела отбрасывает (Push). Then — эффект этого взрыва.
- Color и Width — цвет и толщина света; Muzzle — эффект у дула; Recoil — отдача вида героя.
- Magazine и Reload — магазин и время перезарядки в секундах.
- Lock: {Time — секунды удержания прицела до захвата, Cone — градусы, Count — целей сразу}.
- Crosshair — вид прицела.

Встроенные типы: pistol, rifle, shotgun, sniper, laser, railgun, plasma, rocket, artillery, mortar, bow.

Fire(id, {At, Way, Weapon, Spread, From}) стреляет оружием объекта (Values.Weapon или Weapon в настройках):
- At — точка [x, y, z] или ID объекта; снаряд с Arc сам выбирает дугу, чтобы долететь до неё;
- Way — направление, если точки нет.
Пока оружие не готово (темп стрельбы, пустой магазин), Fire возвращает false. Повторный Fire лучом продлевает тот же луч.

Герой с оружием стреляет левой кнопкой, пока указатель захвачен, — в середину вида. При удержании кнопки стреляет очередью. То, что держится под прицелом, он захватывает (Lock оружия): события lock и unlock, Locked() — список ID; самонаводящийся снаряд летит к захваченной цели.

Материал в точке попадания определяется так:
- Values.Material объекта;
- иначе — имя материала части модели;
- иначе по виду объекта: ходячее — flesh, транспорт — metal, растение — wood, здание и камень — stone;
- у земли: water под уровнем моря, snow зимой, stone на дороге, иначе soil.

Правила HitRules({материал | тип | 'тип/материал': {Effect, Decal, Factor}}) задают для попадания эффект, след и множитель урона. По умолчанию:
- металл — искры, вмятина, урон ×0.6;
- дерево — щепки;
- камень — пыль и дыра;
- стекло — блёстки и трещина, урон ×1.5;
- вода — брызги;
- энергия прожигает (scorch), энергия в воду — пар.

Следы попаданий (hole, dent, chip, pit, scorch, crack) рисуются в шейдере, освещаются солнцем и небом. Они держатся MarkSeconds секунд (60) и тают; самые старые уходят, когда их больше MarkCount (200). След на предмете двигается вместе с ним. Marks() возвращает список следов.

Событие hit: {ID, Weapon, Type, Source, Team, Target (null — земля), Part (head — верх ходячего), Point, Normal, Material, Amount, Distance}. Событие fire: {ID, Weapon, From, Way}. Trace(from, way, range) — то, во что попал бы выстрел.

Прицел Crosshair сцены ('' — как скажет оружие, none, dot, cross, circle, chevron) виден, пока у героя есть оружие:
- при движении и стрельбе он расходится;
- при попадании мигает крестом;
- Killed(id) на миг делает его красным (GameCombat вызывает это, когда герой убил цель).

Метки захвата — уголки на цели: сходятся, пока идёт захват, и становятся красными, когда цель захвачена. Если цель вне вида, метка стоит стрелкой у края. Цвета задают токены --elemenx-scene-aim*, --elemenx-scene-lock*.

## Методы

- `Weapons(types)`
- `HitRules(rules)`
- `Fire(id, options)`
- `Locked()`
- `Killed(id)`

## Тесты

- [breaks a thing by the pieces of its model (Pattern parts), and a shot of SceneWeapons hurts it by itself](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js#L199) — `libraries/ElemenxGraphics/traits/SceneFracture/SceneFracture.test.js`
