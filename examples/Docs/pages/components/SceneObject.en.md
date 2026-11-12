<!-- generated -->
# SceneObject

An object of a game, of any kind, declared in a Scene: Kind names its kind (the Kinds Service: what it extends, what it can do, its Traits, and what it is made of, its Parts), and every other attribute is a field of it or of one of its Traits, in any case (Radius, Distance, Speed, Team: whatever its kind has). ID, Name, Team. A SceneObject declared inside another goes round it when its kind moves (an Orbit, a Mover: a moon in its planet), and is a part of it otherwise (a module of a station); Part="dock" changes the part of that name that the kind of its parent gives it, Parent names what it goes round instead of its place. On a map of cells it is a thing on a cell: X and Y, Width and Height (1 by 1), Color, Image, Blocks (no way through it), Opaque (it hides what is behind it), Kind tree (the default there), rock or a name of your own. It shows nothing by itself.

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

## Tests

- [reads the SceneObject inside it: each attribute a field of its kind, nested ones going round their holder or a part of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L334) — `tests/regression/library-scene.test.js`
- [makes only the programs it draws, and a frame of its loop never waits for one the card is still making](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L387) — `tests/regression/library-scene.test.js`
- [draws the star bright, the day side of a body of its baked surface, not its night side, and the same far from the middle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L479) — `tests/regression/library-scene.test.js`
- [drives the clouds of a body by a wind of the clock, never by its days made fast](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L523) — `tests/regression/library-scene.test.js`
- [selects an object by its label and a part by a press when near, flies to it, sends a fleet that arrives](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L547) — `tests/regression/library-scene.test.js`
- [adds, changes, attaches, detaches and removes objects and parts, saves the game and loads it the same](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L609) — `tests/regression/library-scene.test.js`
- [runs the systems of the application for traits of their own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L715) — `tests/regression/library-scene.test.js`
- [lands on the surface of a body and takes off again; a giant of gas has none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L732) — `tests/regression/library-scene.test.js`
- [makes crafts as long as they are and ships as fast as they go in real sizes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L791) — `tests/regression/library-scene.test.js`
- [draws the Sun from a ship near a planet in real sizes, bright](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L840) — `tests/regression/library-scene.test.js`
- [starts a ground behind a veil, its time still, until its squares and what grows round the eye are made](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L896) — `tests/regression/library-scene.test.js`
- [plays the clips of a model: walking on a way by itself, a clip that ends going back, a kind for each model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L938) — `tests/regression/library-scene.test.js`

+156 more in the same files
