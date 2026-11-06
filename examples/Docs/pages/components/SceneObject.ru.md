<!-- generated -->
# SceneObject

Объект игры любого вида, объявленный в Scene (или в Scene): Kind называет его вид (сервис Kinds: что он расширяет, что умеет — его черты, Traits, и из чего состоит — его части, Parts), а любой другой атрибут — поле его самого или одной из его черт в любом регистре (Radius, Distance, Speed, Team — всё, что есть у его вида; имя черты и поля вместе — Surface-Type). ID, Name, Team. SceneObject внутри другого обращается вокруг него, если его вид движется (Orbit, Mover: луна в своей планете), и становится его частью иначе (модуль станции); Part="dock" меняет часть с этим именем, которую дал вид родителя; Parent называет, вокруг чего он обращается, вместо места, где он объявлен. Для Scene (карта клеток) — вещь на клетке: X и Y, Width и Height (1 на 1), Color, Image, Blocks (сквозь неё не пройти), Opaque (закрывает то, что за ней), Kind tree (по умолчанию там), rock или своё имя. Сам по себе ничего не показывает.

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
	<Scene Speed="0.3" Focus="gateway">
		<SceneObject ID="sun" Kind="star">
			<SceneObject ID="earth" Kind="planet" Name="Earth" Surface-Type="terran" Distance="1">
				<SceneObject ID="gateway" Kind="station" Name="Gateway" Team="blue">
					<SceneObject Part="dock" Max="300" />
					<SceneObject ID="antenna" Kind="module" Shape="cone" Position="[0, 1.1, 0]" Scale="[0.2, 0.6, 0.2]" Color="#e0a050" />
				</SceneObject>
			</SceneObject>
		</SceneObject>
	</Scene>
</div>
<p class="elemenx-text small muted">A station of the kinds of space: its parts are its kind's (a ring, a hub, panels, a dock), the dock changed, an antenna added. In a Scene a SceneObject is a thing on a cell: a tree, a rock.</p>
```

## Тесты

- [reads the SceneObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L333) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L380) — `tests/regression/library-scene.test.js`
- [selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L423) — `tests/regression/library-scene.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L485) — `tests/regression/library-scene.test.js`
- [runs the systems of the application for traits of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L591) — `tests/regression/library-scene.test.js`
- [lands on the surface of a body and takes off again; a giant of gas has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L608) — `tests/regression/library-scene.test.js`
- [makes crafts as long as they are and ships as fast as they go in real sizes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L667) — `tests/regression/library-scene.test.js`
- [draws the Sun from a ship near a planet in real sizes, bright](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L716) — `tests/regression/library-scene.test.js`
- [starts a ground behind a veil, its time still, until its squares and what grows round the eye are made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L772) — `tests/regression/library-scene.test.js`
- [plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L814) — `tests/regression/library-scene.test.js`
- [sees a ground in parallel rays: from above a point is where the plan says, at an angle where the rhombus says](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L884) — `tests/regression/library-scene.test.js`
- [brings the resolution back at the 60 frames of a screen, and holds it where a quality was chosen](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L926) — `tests/regression/library-scene.test.js`

+138 ещё в тех же файлах
