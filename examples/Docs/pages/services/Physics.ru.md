<!-- generated -->
# Physics

Как движутся вещи отдельно от того, что их показывает: шаги одной длины (Steps), смешивание двух шагов для показа (Blend), пружины (Spring), машина на шинах и подвеске (Car) и корабль в космосе (Ship). Сцену не знает: получает состояние и ввод, возвращает новое состояние.

Призма (Shape: 'prism') — неподвижное тело. Points [[x, z]...] задают выпуклый контур вокруг середины (порядок обхода любой), Height — высоту. Шар, капсула и ящик сталкиваются с ней: шар по ближайшей точке поверхности, ящик углами (а углы призмы — с ящиком). Ray в неё попадает. Друг с другом призмы не сталкиваются.

## Методы

- `Steps(clock, elapsed, length, each)`
- `Blend(from, to, part)`
- `Spring(value, speed, target, stiffness, damping, elapsed)`
- `Car(state, input, surface, settings, elapsed)`
- `Gearbox(state, input, settings, gas, braking, speed, elapsed)`
- `Hit(state, normal, depth, at, settings)`
- `Boat(state, input, sea, bed, settings, elapsed)`
- `Bounce(way, normal, depth, bounce)`
- `Ship(state, input, settings, elapsed)`
- `World(settings)`
- `Cloth(settings)`
- `Rope(settings)`
- `Waves(settings)`
- `Fluid(settings)`

## Тесты

- [Physics runs steps of one length, whatever the frames are, and blends what shows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3557) — `tests/regression/library-scene.test.js`
- [Physics shifts the gears of a car: up near the red line, without drive while it changes, into reverse when stopped and asked back, by hand with a manual](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3596) — `tests/regression/library-scene.test.js`
- [Physics drives a car: slowed by grass, on its springs, leaning as it goes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3681) — `tests/regression/library-scene.test.js`
- [Physics keeps the wheels on the road: each on a spring of its own, the body riding over them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3766) — `tests/regression/library-scene.test.js`
- [Physics stops and turns a car as it is told: brakes, grip, downforce, steering](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3860) — `tests/regression/library-scene.test.js`
- [Physics turns a car by a table of its own, whatever the speed, and a touch of the key is a little turn](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3907) — `tests/regression/library-scene.test.js`
- [Physics holds a car level in a turn by its bars, and keeps all its wheels down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4461) — `tests/regression/library-scene.test.js`
- [Physics turns a car as sharply as it is told, with no more lean for that](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4496) — `tests/regression/library-scene.test.js`
- [Physics is a simulator or an arcade by its numbers, and lets the tail go when it is asked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4526) — `tests/regression/library-scene.test.js`
- [Physics takes a car off a wall: out of it, its way into it gone, turned round the corner that struck](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4642) — `tests/regression/library-scene.test.js`
- [Physics brings a ship to rest, all of it, and then it stays](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4673) — `tests/regression/library-scene.test.js`
- [Physics flies a ship: its speed comes after its throttle, its axes stay square](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4697) — `tests/regression/library-scene.test.js`

+25 ещё в тех же файлах
