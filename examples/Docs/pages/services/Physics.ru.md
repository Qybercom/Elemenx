<!-- generated -->
# Physics

Как движутся вещи отдельно от того, что их показывает: шаги одной длины (Steps), смешивание двух шагов для показа (Blend), пружины (Spring), машина на шинах и подвеске (Car) и корабль в космосе (Ship). Сцену не знает: получает состояние и ввод, возвращает новое состояние.

## Методы

- `Steps(clock, elapsed, length, each)`
- `Blend(from, to, part)`
- `Spring(value, speed, target, stiffness, damping, elapsed)`
- `Car(state, input, surface, settings, elapsed)`
- `Hit(state, normal, depth, at, settings)`
- `Bounce(way, normal, depth, bounce)`
- `Ship(state, input, settings, elapsed)`

## Тесты

- [Physics runs steps of one length, whatever the frames are, and blends what shows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2931) — `tests/regression/library-scene.test.js`
- [Physics drives a car: slowed by grass, on its springs, leaning as it goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L2970) — `tests/regression/library-scene.test.js`
- [Physics keeps the wheels on the road: each on a spring of its own, the body riding over them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3055) — `tests/regression/library-scene.test.js`
- [Physics stops and turns a car as it is told: brakes, grip, downforce, steering](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3149) — `tests/regression/library-scene.test.js`
- [Physics turns a car by a table of its own, whatever the speed, and a touch of the key is a little turn](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3196) — `tests/regression/library-scene.test.js`
- [Physics holds a car level in a turn by its bars, and keeps all its wheels down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3358) — `tests/regression/library-scene.test.js`
- [Physics turns a car as sharply as it is told, with no more lean for that](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3393) — `tests/regression/library-scene.test.js`
- [Physics is a simulator or an arcade by its numbers, and lets the tail go when it is asked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3423) — `tests/regression/library-scene.test.js`
- [Physics takes a car off a wall: out of it, its way into it gone, turned round the corner that struck](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3539) — `tests/regression/library-scene.test.js`
- [Physics brings a ship to rest, all of it, and then it stays](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3570) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3594) — `tests/regression/library-scene.test.js`
