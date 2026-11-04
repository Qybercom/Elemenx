<!-- generated -->
# GameStrategy

A strategy game on the ground of a Scene, declared inside it: <Scene> ... <GameStrategy Team="blue" Fog="true" /> </Scene> (the trait SceneBehaviour). The units of the player are the walkers of its Team: a press selects one (Shift adds or takes it away), a frame drawn with the left button selects all in it, a double press all of its kind on the screen, Ctrl+A all of them, Escape none. A right press orders them: on the ground they go there and spread round it (Spread metres apart), on a unit of another team they attack it; S stops them. A unit with Damage (per second, 10) attacks what is within its Range (3 metres), going to it first, and by itself what comes within half its Sight; a unit with no Health left is gone. Fog hides what the units of the Team do not see (Sight of a unit, 30 metres) and darkens what they have not seen yet or see no more; the units of other teams are hidden there. The right button turns the view, the wheel brings it near. Selected: the units selected from the start, as they come into the scene.

Methods: Selection(), Select(ids), Order(ids, target, kind) (target [x, z], {X, Z} or the ID of a unit; kind move or attack), Stop(ids), Seen(x, z) and Explored(x, z) (of the fog). Events: select ({IDs}), order ({Kind, IDs, X, Z, Target}), death ({ID, By}).

## Properties

| Property | Default |
| --- | --- |
| `Team` | `'blue'` |
| `Fog` | `false` |
| `Spread` | `2.5` |
| `Selected` | `''` |
| `Label` | `''` |

## Events

- `select`: The units selected changed: {IDs}.
- `order`: Units were told to move or attack: {Kind, IDs, X, Z, Target}.
- `death`: A unit has no health left and is gone: {ID, By}.

## Methods

- `Selection()`
- `Select(ids)`
- `Order(ids, target, kind)`
- `Stop(ids)`
- `Seen(x, z)`
- `Explored(x, z)`

## Tests

- [selects the units of its team only, by code, by Ctrl+A and by a frame drawn over them, and none by Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L74) — `tests/regression/library-game-strategy.test.js`
- [sends units to a place, each to its own spot, stops them, and has them attack a foe until it is gone](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L108) — `tests/regression/library-game-strategy.test.js`
- [hides in its fog the units of other teams that its units do not see, and tells what was seen and explored](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L149) — `tests/regression/library-game-strategy.test.js`
- [sets no timer of no function while the scene and its game are made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-strategy.test.js#L176) — `tests/regression/library-game-strategy.test.js`
