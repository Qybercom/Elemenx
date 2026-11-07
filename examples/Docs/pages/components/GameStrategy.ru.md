<!-- generated -->
# GameStrategy

Стратегия на земле Scene, объявленная внутри неё: <Scene> ... <GameStrategy Team="blue" Fog="true" /> </Scene> (трейт SceneBehaviour). Юниты игрока — ходячие юниты его команды Team: нажатие выбирает одного (Shift добавляет или убирает), рамка левой кнопкой — всех в ней, двойное нажатие — всех такого же вида на экране, Ctrl+A — всех, Escape — никого. Правое нажатие отдаёт приказ: на земле они идут туда и встают вокруг точки (на расстоянии Spread метров), по юниту другой команды — атакуют его; S останавливает. Юнит с Damage (в секунду, 10) атакует то, что в пределах Range (3 метра), сначала подходя к цели, а сам — того, кто подошёл ближе половины его Sight; юнит без Health исчезает. Fog скрывает то, чего юниты не видят (Sight юнита, 30 метров), и затемняет то, что они ещё не видели или уже не видят; юниты других команд там скрыты. Правая кнопка поворачивает вид, колесо приближает. Selected — юниты, выбранные с самого начала.

Методы: Selection(), Select(ids), Order(ids, target, kind) (target — [x, z], {X, Z} или ID юнита; kind — move или attack), Stop(ids), Seen(x, z) и Explored(x, z) (туман). События: select ({IDs}), order ({Kind, IDs, X, Z, Target}), death ({ID, By}).
 Дальность обзора юнитов (Sight) — и для нападения, и для тумана войны — сокращается погодой и темнотой (Scene.SightOf).

Юнит с Weapon (оружие сцены: rifle, rocket, mortar…) стреляет с дальности Range (25 м) с разбросом Spread (градусы, 2); его выстрелы попадают во всё, что на пути. Урон идёт через здоровье сцены (Vitals), общее с GameCombat.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Team` | `'blue'` |
| `Fog` | `false` |
| `Spread` | `2.5` |
| `Selected` | `''` |
| `Label` | `''` |

## События

- `select`
- `order`
- `death`

## Методы

- `Selection()`
- `Select(ids)`
- `Order(ids, target, kind)`
- `Stop(ids)`
- `Seen(x, z)`
- `Explored(x, z)`

## Тесты

- [selects the units of its team only, by code, by Ctrl+A and by a frame drawn over them, and none by Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L74) — `tests/regression/library-game-strategy.test.js`
- [sends units to a place, each to its own spot, stops them, and has them attack a foe until it is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L108) — `tests/regression/library-game-strategy.test.js`
- [hides in its fog the units of other teams that its units do not see, and tells what was seen and explored](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L149) — `tests/regression/library-game-strategy.test.js`
- [sees no farther than the weather and the light let it: a fog takes the range of sight of its units](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L177) — `tests/regression/library-game-strategy.test.js`
- [sets no timer of no function while the scene and its game are made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L198) — `tests/regression/library-game-strategy.test.js`
- [has the armed units of a strategy shoot their foe from afar until it is gone](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js#L182) — `libraries/ElemenxGaming/components/GameCombat/GameCombat.test.js`
