/*
 * A placeholder of content that loads: grey shapes that shimmer, in the place and the size of what will come. Shape:
 * text (Lines lines, the last one shorter), rect (a picture, a card) or circle (an avatar); Width and Height in CSS
 * units ('100%', '48px'). Put several together for the skeleton of a card or a row.
 */
Elemenx.Component('Skeleton', {
	$TemplateURL: 'Skeleton.html',
	$Meta: {
		Group: 'display',
		Icon: 'star',
		Description: 'A placeholder of content that loads: grey shapes that shimmer, in the place and the size of what will come.',
		Props: {
			Shape: {Options: ['text', 'rect', 'circle'], Description: 'text, rect or circle.'},
			Lines: 'How many lines of a text shape.',
			Width: 'The width: a CSS length.',
			Height: 'The height: a CSS length.'
		},
		Sample: {Shape: 'circle', Width: '40px', Height: '40px'}
	},
	Shape: 'text',
	Lines: 3,
	Width: '',
	Height: '',

	$OnCreate: function () {
		this.Rows = function (lines) {
			var rows = [];
			var i = 0;

			while (i < Math.max(1, Number(lines) || 1)) {
				rows.push(i);

				i++;
			}

			return rows;
		};
	}
});