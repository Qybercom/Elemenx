<!-- generated -->
# GameTerrain

Вид земли GameWorld, объявленный в нём: Key (символ в строках GameLayer), Name, Color, Cost (цена входа в клетку: по умолчанию 1, Infinity — преграда), Opaque (за ним не видно: лес), Image (картинка клетки). Сам по себе ничего не показывает: его читает мир.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Key` | `''` |
| `Name` | `''` |
| `Color` | `''` |
| `Cost` | `1` |
| `Opaque` | `false` |
| `Image` | `''` |

## Пример

```example
<div style="height: 280px;">
	<GameWorld Team="blue">
		<GameTerrain Key="o" Name="Lava" Color="#d8453c" Cost="Infinity" />
		<GameTerrain Key="m" Name="Mud" Color="#6b4f2a" Cost="4" />
		<GameLayer [rows]="Rows" />
		<GameUnit ID="scout" X="1" Y="1" Team="blue" Type="scout" />
	</GameWorld>
</div>
<p class="elemenx-text small muted">The lava blocks the way, the mud costs four times the grass: send the scout across (a click, then a right click).</p>
<script>
({
	Rows: [
		'..........',
		'...ooo....',
		'...ooo....',
		'..mmmmm...',
		'..mmmmm...',
		'..........'
	]
})
</script>
```

## Тесты

- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
