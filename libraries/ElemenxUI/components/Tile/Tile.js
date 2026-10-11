/*
 * The declaration of a tile in the template of a TileGrid, inside a TileGroup: <Tile ID="mail" Title="Mail" Icon="mail"
 * Size="wide" />. It takes the props of a tile of TileGrid (ID, Title, Icon, Size, Row, Column, Color, Badge, Text,
 * Class, Locked); markup inside it becomes the custom content of the tile and keeps its bindings. It shows nothing by
 * itself: TileGrid reads it.
 */
Elemenx.Component('Tile', {
	$TemplateURL: 'Tile.html',
	ID: '',
	Title: '',
	Icon: '',
	Size: 'medium',
	Row: null,
	Column: null,
	Color: '',
	Badge: null,
	Text: '',
	Class: '',
	Locked: false
});
