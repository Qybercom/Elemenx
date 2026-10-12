/*
 * The declaration of a group of tiles in the template of a TileGrid: <TileGroup ID="work" Title="Work"> with <Tile>
 * children. Locked keeps its tiles and takes no others; Columns is its width in cells. It shows nothing by itself:
 * TileGrid reads it.
 */
Elemenx.Component('TileGroup', {
	$TemplateURL: 'TileGroup.html',
	ID: '',
	Title: '',
	Locked: false,
	Columns: null
});
