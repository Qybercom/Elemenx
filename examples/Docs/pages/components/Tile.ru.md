<!-- generated -->
# Tile

Объявление плитки в шаблоне TileGrid, внутри TileGroup: <Tile ID="mail" Title="Mail" Icon="mail" Size="wide" />. Принимает свойства плитки TileGrid (ID, Title, Icon, Size, Width, Height, Row, Column, Color, Badge, Text, Class, Locked); разметка внутри становится собственным содержимым плитки и сохраняет свои привязки. Сама по себе ничего не показывает: её читает TileGrid.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Width` | `null` |
| `Height` | `null` |
| `Row` | `null` |
| `Column` | `null` |
| `Color` | `''` |
| `Badge` | `null` |
| `Text` | `''` |
| `Class` | `''` |
| `Locked` | `false` |

## Слоты

по умолчанию

## Пример

```example
<TileGrid Editable="true" GroupPolicy="none" (open)="Opened">
	<TileGroup ID="media" Title="Media">
		<Tile ID="clock" Title="Clock" Size="wide" Color="#1f2a37"><strong style="display: block; padding: 10px 12px; font-size: 28px;">{{Time}}</strong></Tile>
		<Tile ID="music" Title="Music" Icon="play" Color="#c2477f" [badge]="Plays || null" />
		<Tile ID="photos" Title="Photos" Icon="image" Size="medium" Color="#3f6c9e" />
	</TileGroup>
</TileGrid>
<p class="elemenx-text small muted">Opened: {{Last || '—'}}</p>
<script>
({
	Time: new Date().toLocaleTimeString().slice(0, 5),
	Plays: 0,
	Last: '',

	Opened: function (tile) {
		this.Last = tile.Title;

		if (tile.ID === 'music')
			this.Plays++;
	}
})
</script>
```

## Тесты

- [never puts a component into itself, nor into one it holds; renames it where it is held, and keeps one that is held](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L162) — `tests/regression/designer-project.test.js`
- [keeps a history for each document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L187) — `tests/regression/designer-project.test.js`
- [writes the project into the text of a file and reads it back as a project of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/designer-project.test.js#L342) — `tests/regression/designer-project.test.js`
