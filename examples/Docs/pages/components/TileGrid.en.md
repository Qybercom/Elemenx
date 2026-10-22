<!-- generated -->
# TileGrid

Groups of tiles on a grid of 48px cells, like a start screen. Groups: [{ID, Title, Tiles, Locked, Actions, Element, Render}]. A group header shows Actions ([{ID, Icon, Label, Title, Run}], buttons that emit groupaction with {Group, Action} and call Run(group)) and custom content: Element (a DOM node) or Render(container, group). A Locked group keeps its tiles and takes no others. A tile is {ID, Title, Icon, Size (small 1x1, medium 2x2, wide 4x2, tall 2x4, large 4x4, xlarge 6x4), Width and Height (any number of cells, over Size), Row, Column, Color, Badge, Text, Class, Locked, Element, Render}. Row and Column place the tile on the cells of its group (from 0); a tile without them takes the first free place. Element or Render(container, tile) replace the icon and the text with custom content, Class adds classes, Locked keeps the tile in its place. Columns is the width of a group in cells; a group may have its own Columns and Rows (its least height), and while Editable the handles on its right edge, its bottom edge and its corner stretch it (pointer or arrow keys, whole cells, from its widest tile up to MaxColumns (0: no limit), from its lowest tile down), reported by change. Fit gives a group no more columns than the grid has room for: on a narrow screen the tiles that do not fit take free places below, and come back as it widens. Direction 'horizontal' puts the groups in one row, as on a start screen; Scroll makes the grid scroll on its own (give it a height), and a tile dragged to its edge scrolls it. On a touch screen a finger scrolls over the tiles, and a press held still takes a tile. Arrangement() returns the places of the tiles and the sizes of the groups ([{ID, Title, Columns, Rows, Tiles: [{ID, Row, Column, Size, Width, Height}]}]); Restore(arrangement) brings them back (tiles and groups it does not name stay as they are); Persist (a key) keeps the arrangement in the storage of the browser and restores it on the next visit. A tile dragged past the right edge of a group widens it by a column after GrowDelay milliseconds there (the edge shows it), again while it stays. Events: open (the tile, on click or Enter). Editable lets the user move tiles by dragging: the tile goes to the cell under the top left corner of its ghost and pushes down the tiles in its way, while it moves, as the grid will look after the drop; places left empty stay empty. GroupPolicy decides where a dragged tile may start a new group: 'end' (beside the last group), 'between' (also between the groups) or 'none'; the new group is named NewGroupTitle and reported by groupcreate ({Group, Tile}). A group left empty by a drag goes away. The change event carries the new Groups, every tile of a changed group with its Row and Column; Escape puts everything back. The groups and tiles may also be declared in the template: <TileGroup ID Title Locked> with <Tile> children that take the props of a tile; the markup inside a <Tile> is its custom content, bound to the page like any markup. Declarations add to Groups (a <Tile> with the ID of a tile of Groups gives it its props and content) and follow the template: a new <Tile> joins its group, a removed one leaves, a changed prop shows; the places of the tiles stay with the grid once they are set.

## Properties

| Property | Default |
| --- | --- |
| `Groups` | `[]` |
| `Editable` | `false` |
| `Columns` | `4` |
| `MaxColumns` | `12` |
| `Fit` | `false` |
| `Direction` | `'wrap'` |
| `Scroll` | `false` |
| `Persist` | `''` |
| `GrowDelay` | `500` |
| `GroupPolicy` | `'end'` |
| `NewGroupTitle` | `''` |

## Events

`open`, `groupaction`, `change`, `groupcreate`

## Slots

default

## Methods

- `Arrangement()`
- `Restore(arrangement)`

## Example

```example
<TileGrid [groups]="Groups" Editable="true" Fit="true" GroupPolicy="between" (open)="Opened" (change)="Changed" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: 'Drag the tiles; drop one between the groups to start a new group.',
	Groups: [
		{ID: 'work', Title: 'Work', Tiles: [
			{ID: 'mail', Title: 'Mail', Icon: 'mail', Size: 'wide', Badge: 4, Color: '#3f6c9e'},
			{ID: 'calendar', Title: 'Calendar', Icon: 'calendar', Size: 'medium', Color: '#b4483f'},
			{ID: 'tasks', Title: 'Tasks', Icon: 'check', Size: 'medium', Color: '#3d7a54'},
			{ID: 'chat', Title: 'Chat', Icon: 'send', Size: 'small', Color: '#c2477f'}
		]},
		{ID: 'tools', Title: 'Tools', Tiles: [
			{ID: 'terminal', Title: 'Terminal', Icon: 'terminal', Size: 'medium'},
			{ID: 'settings', Title: 'Settings', Icon: 'settings', Size: 'small', Color: '#5f5a54', Locked: true},
			{ID: 'cloud', Title: 'Deployments', Icon: 'cloud', Size: 'wide', Text: 'All 12 services are healthy.', Color: '#3f6c9e'}
		]}
	],

	Opened: function (tile) {
		this.Note = 'Opened: ' + tile.Title;
	},

	Changed: function (groups) {
		this.Groups = groups;
		this.Note = 'Arranged: ' + groups.length + ' groups';
	}
})
</script>
```
