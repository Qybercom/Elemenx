<!-- generated -->
# GameBuilding

Здание GameWorld, объявленное в нём: ID, X и Y (его первая клетка), Width и Height (клетки, которые оно занимает, по умолчанию 2 на 2; сквозь них пути нет), Team, Type (казарма), Name, Color (стены), Roof (цвет крыши, по умолчанию — цвет команды), Tall (высота стен в высотах клетки), Image (картинка на его месте), Health и MaxHealth, Sight. Само по себе ничего не показывает: его рисует мир.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `X` | `0` |
| `Y` | `0` |
| `Width` | `2` |
| `Height` | `2` |
| `Team` | `''` |
| `Type` | `''` |
| `Name` | `''` |
| `Color` | `''` |
| `Roof` | `''` |
| `Tall` | `1` |
| `Image` | `''` |
| `Health` | `null` |
| `MaxHealth` | `null` |
| `Sight` | `4` |

## Пример

```example
<div style="height: 280px;">
	<GameWorld Team="blue">
		<GameLayer [rows]="Rows" />
		<GameBuilding ID="hall" X="1" Y="1" Width="3" Height="2" Team="blue" Type="hall" Name="Town hall" Tall="2" Health="400" MaxHealth="500" />
		<GameBuilding ID="tower" X="8" Y="2" Team="red" Type="tower" Roof="#3a2e1f" />
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
	]
})
</script>
```
