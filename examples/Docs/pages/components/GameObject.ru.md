<!-- generated -->
# GameObject

Объект игры любого вида, объявленный в GameScene (или в GameWorld): Kind называет его вид (сервис Kinds: что он расширяет, что умеет — его черты, Traits, и из чего состоит — его части, Parts), а любой другой атрибут — поле его самого или одной из его черт в любом регистре (Radius, Distance, Speed, Team — всё, что есть у его вида; имя черты и поля вместе — Surface-Type). ID, Name, Team. GameObject внутри другого обращается вокруг него, если его вид движется (Orbit, Mover: луна в своей планете), и становится его частью иначе (модуль станции); Part="dock" меняет часть с этим именем, которую дал вид родителя; Parent называет, вокруг чего он обращается, вместо места, где он объявлен. Для GameWorld (карта клеток) — вещь на клетке: X и Y, Width и Height (1 на 1), Color, Image, Blocks (сквозь неё не пройти), Opaque (закрывает то, что за ней), Kind tree (по умолчанию там), rock или своё имя. Сам по себе ничего не показывает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Kind` | `''` |
| `Name` | `''` |
| `Part` | `''` |
| `Parent` | `''` |
| `Team` | `''` |
| `X` | `0` |
| `Y` | `0` |
| `Width` | `1` |
| `Height` | `1` |
| `Color` | `''` |
| `Image` | `''` |
| `Blocks` | `false` |
| `Opaque` | `false` |

## Слоты

по умолчанию

## Пример

```example
<div style="height: 320px;">
	<GameScene Speed="0.3" Focus="gateway">
		<GameObject ID="sun" Kind="star">
			<GameObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Distance="1">
				<GameObject ID="gateway" Kind="station" Name="Gateway" Team="blue">
					<GameObject Part="dock" Max="300" />
					<GameObject ID="antenna" Kind="module" Shape="cone" Position="[0, 1.1, 0]" Scale="[0.2, 0.6, 0.2]" Color="#e0a050" />
				</GameObject>
			</GameObject>
		</GameObject>
	</GameScene>
</div>
<p class="elemenx-text small muted">A station of the kinds of space: its parts are its kind's (a ring, a hub, panels, a dock), the dock changed, an antenna added. In a GameWorld a GameObject is a thing on a cell: a tree, a rock.</p>
```

## Тесты

- [reads the GameObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L274) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L321) — `tests/regression/library-scene.test.js`
- [selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L362) — `tests/regression/library-scene.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L424) — `tests/regression/library-scene.test.js`
- [runs the systems of the application for traits of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L486) — `tests/regression/library-scene.test.js`
- [lands on the surface of a body and takes off again; a giant of gas has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L503) — `tests/regression/library-scene.test.js`
- [walks a unit over a ground round the water and what blocks it, sends it by a right press, and saves its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L543) — `tests/regression/library-scene.test.js`
- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
