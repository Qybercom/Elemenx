<!-- generated -->
# GameUnit

Юнит GameWorld, объявленный в нём: ID, X и Y (клетка, где он стоит), Team (юниты команды игрока — Team мира — выбираются и получают приказы), Type (лучник, рабочий: его вид в игре), Name, Color (по умолчанию — цвет команды), Image (картинка, стоящая на ногах), Health и MaxHealth, Speed (клеток в секунду), Sight (сколько клеток он видит в тумане). Сам по себе ничего не показывает: мир рисует его и двигает.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `X` | `0` |
| `Y` | `0` |
| `Team` | `''` |
| `Type` | `''` |
| `Name` | `''` |
| `Color` | `''` |
| `Image` | `''` |
| `Health` | `null` |
| `MaxHealth` | `null` |
| `Speed` | `2` |
| `Sight` | `5` |

## Пример

```example
<div style="height: 280px;">
	<GameWorld Team="blue" (arrive)="Arrived">
		<GameLayer [rows]="Rows" />
		<GameUnit ID="knight" X="1" Y="2" Team="blue" Type="knight" Name="Sir Ada" Health="70" MaxHealth="100" Speed="3" />
		<GameUnit ID="worker" X="2" Y="3" Team="blue" Type="worker" />
		<GameUnit ID="raider" X="9" Y="1" Team="red" Type="raider" />
	</GameWorld>
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Select a blue unit, then a right click sends it; on a red unit it attacks.',
	Rows: [
		'............',
		'............',
		'.....##.....',
		'.....##.....',
		'............'
	],

	Arrived: function (event) {
		this.Note = event.ID + ' arrived at ' + event.X + ', ' + event.Y;
	}
})
</script>
```
