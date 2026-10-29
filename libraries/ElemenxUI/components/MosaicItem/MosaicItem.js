/*
 * The declaration of an item in the template of a Mosaic: <MosaicItem ID="sea" Title="The sea" Image="sea.jpg"
 * Ratio="1.5" />. It takes the props of an item of Mosaic (ID, Title, Text, Image, Color, Width, Height, Ratio, Span,
 * Value, Row, Column, Class); markup inside it becomes the content of the item and keeps its bindings; MosaicItem
 * inside another one is its child in a treemap. It shows nothing by itself: Mosaic reads it.
 */
Elemenx.Component('MosaicItem', {
	$TemplateURL: 'MosaicItem.html',
	$Meta: {
		Group: 'layout',
		Icon: 'grid',
		Description: 'The declaration of an item in the template of a Mosaic: <MosaicItem ID="sea" Title="The sea" Image="sea.jpg" />.',
		Container: true,
		Props: {
			ID: 'The ID of the item.',
			Title: 'Its title.',
			Text: 'A text under the title.',
			Image: 'The URL of its picture.',
			Color: 'Its color.',
			Width: 'Its width in cells (bento).',
			Height: 'Its height: in cells (bento) or in pixels (masonry).',
			Ratio: 'Its width over its height (masonry, justified): the shape of its picture.',
			Span: 'The columns it takes (masonry).',
			Value: 'Its value: its area in a treemap.',
			Row: 'Its row (bento), from 0.',
			Column: 'Its column (bento), from 0.',
			Class: 'More classes.'
		},
		Sample: {ID: 'sea', Title: 'The sea', Ratio: 1.5}
	},
	ID: '',
	Title: '',
	Text: '',
	Image: '',
	Color: '',
	Width: null,
	Height: null,
	Ratio: null,
	Span: null,
	Value: null,
	Row: null,
	Column: null,
	Class: '',

	$OnCreate: function () {
		/* The item as Mosaic reads it, the empty props left out. */
		this.Declared = function () {
			var names = ['ID', 'Title', 'Text', 'Image', 'Color', 'Width', 'Height', 'Ratio', 'Span', 'Value', 'Row', 'Column', 'Class'];
			var item = {};
			var values = arguments;

			names.forEach(function (name, index) {
				if (values[index] !== null && values[index] !== undefined && values[index] !== '')
					item[name] = values[index];
			});

			return JSON.stringify(item);
		};
	}
});
