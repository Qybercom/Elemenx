/*
 * A picture in the manner of Suprematism, made of Seed: always the same for the same seed (the Suprematist Service).
 * Width and Height (400) are its proportions, it fills the width of its place; Palette classic (red, black, blue,
 * yellow on the ground of the paper), theme (the colors of the theme) or a list of CSS colors; Density 0 to 1;
 * Title the text of its role img (none: it is decoration).
 */
Elemenx.Component('Suprematism', {
	$TemplateURL: 'Suprematism.html',
	$StyleURL: 'Suprematism.css',
	$Meta: {
		Group: 'display',
		Icon: 'image',
		Description: 'A picture in the manner of Suprematism, made of a seed: always the same for the same seed.',
		Props: {
			Seed: 'The text the picture is made of (a name, an ID).',
			Width: 'Its width, for its proportions.',
			Height: 'Its height, for its proportions.',
			Palette: {Options: ['classic', 'theme'], Description: 'Its colors: classic, theme, or a list of CSS colors.'},
			Density: 'How many figures, 0 to 1.',
			Title: 'The text of the picture for a screen reader; none: it is decoration.'
		},
		Sample: {Seed: 'Elemenx', Width: 320, Height: 200}
	},
	Seed: '',
	Width: 400,
	Height: 400,
	Palette: 'classic',
	Density: 0.5,
	Title: '',

	$OnCreate: function () {
		var self = this;
		var last = {Key: null, Source: null};

		/* The picture drawn in its place, again only when what it is made of changes (a template calls it). */
		this.Art = function (seed, width, height, palette, density, title) {
			var options = {Seed: seed, Width: width, Height: height, Palette: palette, Density: density, Title: title};
			var key = JSON.stringify(options);
			if (last.Key === key) return last.Source;

			last.Key = key;
			last.Source = function (element) {
				element.innerHTML = self.$Service('Suprematist').Generate(options);
			};

			return last.Source;
		};
	}
});
