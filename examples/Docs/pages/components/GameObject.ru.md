<!-- generated -->
# GameObject

Вещь GameWorld, объявленная в нём: дерево, камень, ресурс, флаг. ID, Kind (tree, rock или своё имя), X и Y, Width и Height (1 на 1), Color, Image (картинка на её клетке), Blocks (сквозь неё пути нет), Opaque (за ней не видно), Name. Сама по себе ничего не показывает: её рисует мир.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Kind` | `'tree'` |
| `X` | `0` |
| `Y` | `0` |
| `Width` | `1` |
| `Height` | `1` |
| `Name` | `''` |
| `Color` | `''` |
| `Image` | `''` |
| `Blocks` | `false` |
| `Opaque` | `false` |

## Пример

```example
<div style="height: 280px;">
	<GameWorld Team="blue">
		<GameLayer [rows]="Rows" />
		<GameObject *for="tree of Trees" Kind="tree" [id]="tree.ID" [x]="tree.X" [y]="tree.Y" Blocks="true" Opaque="true" />
		<GameObject ID="stone" Kind="rock" X="6" Y="3" Blocks="true" />
		<GameObject ID="gold" Kind="gold" X="9" Y="1" Color="#e0b33c" Name="Gold mine" />
		<GameUnit ID="worker" X="0" Y="4" Team="blue" Type="worker" />
	</GameWorld>
</div>
<script>
({
	Rows: [
		'............',
		'............',
		'............',
		'............',
		'............'
	],
	Trees: [{ID: 't1', X: 3, Y: 1}, {ID: 't2', X: 4, Y: 1}, {ID: 't3', X: 3, Y: 2}, {ID: 't4', X: 4, Y: 3}]
})
</script>
```
