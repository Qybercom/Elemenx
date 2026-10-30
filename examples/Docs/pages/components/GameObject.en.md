<!-- generated -->
# GameObject

An object of a game, of any kind, declared in a GameScene (or a GameWorld): Kind names its kind (the Kinds Service: what it extends, what it can do, its Traits, and what it is made of, its Parts), and every other attribute is a field of it or of one of its Traits, in any case (Radius, Distance, Speed, Team: whatever its kind has). ID, Name, Team. A GameObject declared inside another goes round it when its kind moves (an Orbit, a Mover: a moon in its planet), and is a part of it otherwise (a module of a station); Part="dock" changes the part of that name that the kind of its parent gives it, Parent names what it goes round instead of its place. For a GameWorld (the map of cells) it is a thing on a cell: X and Y, Width and Height (1 by 1), Color, Image, Blocks (no way through it), Opaque (it hides what is behind it), Kind tree (the default there), rock or a name of your own. It shows nothing by itself.

## Properties

| Property | Default |
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

## Slots

default

## Example

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

## Tests

- [reads the GameObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L314) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L361) — `tests/regression/library-scene.test.js`
- [selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L402) — `tests/regression/library-scene.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L464) — `tests/regression/library-scene.test.js`
- [runs the systems of the application for traits of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L526) — `tests/regression/library-scene.test.js`
- [lands on the surface of a body and takes off again; a giant of gas has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L543) — `tests/regression/library-scene.test.js`
- [plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L583) — `tests/regression/library-scene.test.js`
- [casts the shadows of what stands on a ground, or none when told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L652) — `tests/regression/library-scene.test.js`
- [walks a unit over a ground round the water and what blocks it, sends it by a right press, and saves its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L705) — `tests/regression/library-scene.test.js`
- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
