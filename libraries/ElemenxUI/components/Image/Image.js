/*
 * A picture that is easy to place. Src and Alt; Lazy (on by default) loads it when it comes near the viewport. Fit is
 * the fit of the picture in its box (cover, contain, fill, none, scale-down) and Position the point it keeps in view
 * (center, top, '30% 20%'...). Its box: Width and Height (a number of pixels or a length), Ratio ('16/9', '4:3', 1.5)
 * and Stretch, how it follows its container: none (its own size, shrunk to the width of the container), width (as wide
 * as the container), height (as high as it) or both (it fills it). Shape rounded or circle. While it loads a shimmer
 * holds its place (Placeholder); a picture that does not load gives way to Fallback, then to the icon of a picture.
 * Events load and error with {Src}.
 */
Elemenx.Component('Image', {
	$TemplateURL: 'Image.html',
	$StyleURL: 'Image.css',
	$Meta: {
		Group: 'display',
		Icon: 'image',
		Description: 'A picture that is easy to place.',
		Events: {
			load: 'The picture loaded: {Src}.',
			error: 'The picture did not load: {Src}.'
		},
		Props: {
			Src: 'The URL of the picture.',
			Alt: 'The text of the picture for screen readers.',
			Fit: {Options: ['cover', 'contain', 'fill', 'none', 'scale-down'], Description: 'cover, contain, fill, none or scale-down.'},
			Position: 'The point it keeps in view: center, top, 30% 20%...',
			Width: 'The width: pixels or a length.',
			Height: 'The height: pixels or a length.',
			Ratio: 'The shape of the box: 16/9, 4:3, 1.5.',
			Stretch: {Options: ['none', 'width', 'height', 'both'], Description: 'How it follows its container: none, width, height or both.'},
			Shape: {Options: ['', 'rounded', 'circle'], Description: 'rounded or circle.'},
			Lazy: 'Loads it when it comes near the viewport.',
			Placeholder: 'The text shown while it is empty.',
			Fallback: 'The URL of a picture shown when it does not load.'
		},
		Sample: {Alt: 'Mountains', Width: '200', Ratio: '16:9', Shape: 'rounded'}
	},
	Src: '',
	Alt: '',
	Fit: 'cover',
	Position: 'center',
	Width: '',
	Height: '',
	Ratio: '',
	Stretch: 'none',
	Shape: '',
	Lazy: true,
	Placeholder: true,
	Fallback: '',
	Done: '',
	Broken: [],

	$OnCreate: function () {
		/* The picture to show: Src, Fallback when Src does not load, or none when neither does. */
		this.Source = function (src, fallback, broken) {
			if (src && broken.indexOf(src) === -1) return src;
			if (fallback && broken.indexOf(fallback) === -1) return fallback;

			return '';
		};

		this.Length = function (value) {
			if (value === '' || value === null || value === undefined) return null;

			return isFinite(Number(value)) ? Number(value) + 'px' : String(value);
		};

		/* '16/9', '4:3' or a number, as an aspect-ratio. */
		this.RatioOf = function (ratio) {
			var parts = String(ratio || '').split(/[:/]/);

			if (!ratio)
				return null;

			return parts.length === 2 ? Number(parts[0]) + ' / ' + Number(parts[1]) : String(Number(ratio));
		};

		this.FitOf = function (fit) {
			return ['cover', 'contain', 'fill', 'none', 'scale-down'].indexOf(fit) !== -1 ? fit : 'cover';
		};
	},

	Loaded: function (event, node) {
		this.Done = node.getAttribute('src');

		this.$Emit('load', {Src: this.Done});
	},

	Failed: function (event, node) {
		var src = node.getAttribute('src');

		this.Broken = this.Broken.concat([src]);

		this.$Emit('error', {Src: src});
	}
});
