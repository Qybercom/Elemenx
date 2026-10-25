<!-- generated -->
# TileGroup

Объявление группы плиток в шаблоне TileGrid: <TileGroup ID="work" Title="Work"> с дочерними <Tile>. Locked сохраняет её плитки и не принимает чужие; Columns — её ширина в ячейках, Rows — наименьшая высота, Stack — её колонка в сетке с Direction 'columns' (с 0). Разметка в её слоте actions (кнопки, меню) стоит в шапке группы, со своими привязками. Сама по себе ничего не показывает: её читает TileGrid.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `Locked` | `false` |
| `Columns` | `null` |
| `Rows` | `null` |
| `Stack` | `null` |

## Слоты

по умолчанию, `actions`

## Пример

```example
<TileGrid Editable="true" GroupPolicy="none">
	<TileGroup ID="pinned" Title="Pinned" Locked="true">
		<Tile ID="mail" Title="Mail" Icon="mail" Size="wide" Color="#3f6c9e" />
		<Tile ID="phone" Title="Phone" Icon="phone" Color="#0f8fae" />
	</TileGroup>
	<TileGroup ID="games" Title="Games" Columns="6">
		<Button slot="actions" Icon="add" Title="Add a tile" Variant="ghost" Size="small" (click)="Add" />
		<Tile *for="tile of Extra" *key="tile" [id]="tile" [title]="tile" Icon="games:gamepad" Color="#7a4fb4" />
	</TileGroup>
</TileGrid>
<script>
({
	Extra: ['Chess', 'Puzzle'],

	Add: function () {
		this.Extra = this.Extra.concat(['Game ' + (this.Extra.length + 1)]);
	}
})
</script>
```
