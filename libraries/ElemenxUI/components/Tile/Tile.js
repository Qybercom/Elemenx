/*
 * The declaration of a tile in the template of a TileGrid, inside a TileGroup: <Tile ID="mail" Title="Mail" Icon="mail"
 * Size="wide" />. It takes the props of a tile of TileGrid (ID, Title, Icon, Size, Width, Height, Row, Column, Color, Badge,
 * Text, Class, Locked); markup inside it becomes the custom content of the tile and keeps its bindings. It shows nothing by
 * itself: TileGrid reads it.
 */
Elemenx.Component('Tile', {
	$TemplateURL: 'Tile.html',
	$Meta: {
		Group: 'layout',
		Icon: 'layout',
		Description: 'The declaration of a tile in the template of a TileGrid, inside a TileGroup: <Tile ID="mail" Title="Mail" Icon="mail" Size="wide" />.',
		Container: true,
		Props: {
			ID: 'The ID of the tile.',
			Title: 'The title on the tile.',
			Icon: 'The icon of the tile.',
			Size: {Options: ['small', 'medium', 'wide', 'tall', 'large', 'xlarge'], Description: 'small, medium, wide, tall, large or xlarge.'},
			Width: 'Its width in cells, over Size.',
			Height: 'Its height in cells, over Size.',
			Row: 'Its row in its group, from 0.',
			Column: 'Its column in its group, from 0.',
			Color: 'The color of the tile.',
			Badge: 'A badge in its corner.',
			Text: 'A text on the tile.',
			Class: 'More classes.',
			Locked: 'Keeps the tile in its place.'
		},
		Sample: {ID: 'clock', Title: 'Clock', Color: '#1f2a37'}
	},
	ID: '',
	Title: '',
	Icon: '',
	Size: 'medium',
	Width: null,
	Height: null,
	Row: null,
	Column: null,
	Color: '',
	Badge: null,
	Text: '',
	Class: '',
	Locked: false
});
