<!-- generated -->
# TileGroup

The declaration of a group of tiles in the template of a TileGrid: <TileGroup ID="work" Title="Work"> with <Tile> children. Locked keeps its tiles and takes no others; Columns is its width in cells, Rows its least height. Markup in its slot actions (buttons, a menu) stands in the header of the group, with its bindings. It shows nothing by itself: TileGrid reads it.

## Properties

| Property | Default |
| --- | --- |
| `ID` | `''` |
| `Title` | `''` |
| `Locked` | `false` |
| `Columns` | `null` |
| `Rows` | `null` |

## Slots

default, `actions`

## Example

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
