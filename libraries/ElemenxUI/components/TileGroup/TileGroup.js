/*
 * The declaration of a group of tiles in the template of a TileGrid: <TileGroup ID="work" Title="Work"> with <Tile>
 * children. Locked keeps its tiles and takes no others; Columns is its width in cells, Rows its least height. Markup
 * in its slot actions (buttons, a menu) stands in the header of the group, with its bindings. It shows nothing by
 * itself: TileGrid reads it.
 */
Elemenx.Component('TileGroup', {
	$TemplateURL: 'TileGroup.html',
	$Meta: {
		Group: 'layout',
		Icon: 'layout',
		Description: 'The declaration of a group of tiles in the template of a TileGrid: <TileGroup ID="work" Title="Work"> with <Tile> children.',
		Container: true,
		Children: ['Tile'],
		Slots: ['actions'],
		Props: {
			ID: 'The ID of the group.',
			Title: 'The title above the group.',
			Locked: 'Keeps its tiles and takes no others.',
			Columns: 'Its width in cells.',
			Rows: 'Its least height in cells.'
		},
		Sample: {ID: 'pinned', Title: 'Pinned', Locked: true}
	},
	ID: '',
	Title: '',
	Locked: false,
	Columns: null,
	Rows: null
});
