/*
 * Pictures in the manner of Suprematism (Malevich, 1915-1920s): flat figures of pure color on a light ground, set
 * along one diagonal, a dominant figure, bars that cross it, small elements in the free space. A picture is made of
 * a seed, always the same for the same seed: covers, placeholders of pictures, avatars, empty states.
 * - Generate({Seed, Width, Height, Palette, Density, Background, Title}): the SVG as text. Width and Height (400) are
 *   its size; Palette 'classic' (red, black, blue, yellow, ochre on the ground of the paper), 'theme' (the colors of
 *   the theme, var(--elemenx-*): for a picture in the page) or a list of CSS colors; Density 0 to 1 (0.5) the number of
 *   figures; Background a color of its own; Title the text of its role img.
 * - DataURL(options): the same picture as a data: URL, for an <img src> or a CSS background.
 * - Figures(options): the figures it is made of, [{Kind (rect, circle, triangle, line, arc), X, Y, Width, Height, R,
 *   Turn, Fill}], to draw them otherwise.
 */
Elemenx.Service('Suprematist', {
	$Meta: {
		Description: 'Pictures in the manner of Suprematism, made of a seed: always the same for the same seed.',
		Methods: ['Generate(options)', 'DataURL(options)', 'Figures(options)']
	},

	Palettes: {
		classic: {Ground: '#f1ebdf', Colors: ['#c8231c', '#141414', '#24408e', '#e8b021', '#8b6a43', '#c8231c', '#141414']},
		theme: {Ground: 'var(--elemenx-surface)', Colors: ['var(--elemenx-accent)', 'var(--elemenx-text)', 'var(--elemenx-danger)', 'var(--elemenx-warning)', 'var(--elemenx-info)', 'var(--elemenx-success)']}
	},

	/* A random number generator of a seed: the same numbers, 0 to 1, for the same text. */
	Random: function (seed) {
		var text = String(seed === undefined || seed === null ? '' : seed);
		var hash = 1779033703 ^ text.length;
		var state;
		var i;

		for (i = 0; i < text.length; i++) {
			hash = Math.imul(hash ^ text.charCodeAt(i), 3432918353);
			hash = (hash << 13) | (hash >>> 19);
		}

		hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
		hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
		state = (hash ^ (hash >>> 16)) >>> 0;

		return function () {
			var value;

			state = (state + 0x6D2B79F5) >>> 0;
			value = state;
			value = Math.imul(value ^ (value >>> 15), value | 1);
			value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
	},

	/* The palette of options: {Ground, Colors}. */
	PaletteOf: function (options) {
		var palette = options.Palette;
		if (Array.isArray(palette) && palette.length)
			return {Ground: options.Background || this.Palettes.classic.Ground, Colors: palette.map(String)};

		palette = this.Palettes[palette] || this.Palettes.classic;

		return {Ground: options.Background || palette.Ground, Colors: palette.Colors};
	},

	Figures: function (options) {
		var settings = options || {};
		var random = this.Random(settings.Seed);
		var width = Number(settings.Width) || 400;
		var height = Number(settings.Height) || 400;
		var size = Math.min(width, height);
		var density = Math.max(0, Math.min(1, settings.Density === undefined ? 0.5 : Number(settings.Density)));
		var colors = this.PaletteOf(settings).Colors;

		/* The second color of the palette is its black (of the lines too); a palette of one color has it for both. */
		var dark = colors[colors.length > 1 ? 1 : 0];
		var figures = [];
		var angle = (random() < 0.5 ? -1 : 1) * (12 + random() * 28);
		var centerX = width * (0.32 + random() * 0.36);
		var centerY = height * (0.32 + random() * 0.36);
		var count;
		var kind;
		var small;
		var x;
		var y;
		var i;

		function pick () {
			return colors[Math.floor(random() * colors.length)];
		}

		function between (low, high) {
			return low + random() * (high - low);
		}

		/* The dominant figure: a large square, a long bar or a circle, red or black. */
		(function () {
			var kind = random();
			var big = size * between(0.28, 0.46);
			var fill = random() < 0.65 ? colors[0] : dark;

			if (kind < 0.4) figures.push({Kind: 'rect', X: centerX - big / 2, Y: centerY - big / 2, Width: big, Height: big, Turn: angle, Fill: fill});
			else if (kind < 0.75) figures.push({Kind: 'rect', X: centerX - big * 0.9, Y: centerY - big * 0.18, Width: big * 1.8, Height: big * 0.36, Turn: angle, Fill: fill});
			else figures.push({Kind: 'circle', X: centerX, Y: centerY, R: big / 2, Turn: 0, Fill: fill});
		})();

		/* The bars along the diagonal, and a few across it. */
		count = 3 + Math.round(density * 6);

		for (i = 0; i < count; i++) {
			figures.push({
				Kind: 'rect',
				X: between(0.08, 0.7) * width,
				Y: between(0.1, 0.85) * height,
				Width: size * between(0.18, 0.62),
				Height: size * between(0.012, 0.07),
				Turn: random() < 0.25 ? angle + 90 : angle + between(-4, 4),
				Fill: pick()
			});
		}

		/* The small elements in the free space: squares, circles, triangles, thin lines, a quarter of a circle. */
		count = 2 + Math.round(density * 8);

		for (i = 0; i < count; i++) {
			kind = random();
			small = size * between(0.03, 0.12);
			x = between(0.06, 0.94) * width;
			y = between(0.06, 0.94) * height;

			if (kind < 0.3) figures.push({Kind: 'rect', X: x, Y: y, Width: small, Height: small, Turn: angle + between(-10, 10), Fill: pick()});
			else if (kind < 0.5) figures.push({Kind: 'circle', X: x, Y: y, R: small / 2, Turn: 0, Fill: pick()});
			else if (kind < 0.7) figures.push({Kind: 'triangle', X: x, Y: y, Width: small * 1.4, Height: small * 1.2, Turn: angle + between(-30, 30), Fill: pick()});
			else if (kind < 0.9) figures.push({Kind: 'line', X: x, Y: y, Width: size * between(0.1, 0.4), Height: Math.max(1, size * 0.006), Turn: angle + (random() < 0.5 ? 90 : 0), Fill: dark});
			else figures.push({Kind: 'arc', X: x, Y: y, R: small, Turn: angle, Fill: pick()});
		}

		return figures;
	},

	Generate: function (options) {
		var settings = options || {};
		var width = Number(settings.Width) || 400;
		var height = Number(settings.Height) || 400;
		var ground = this.PaletteOf(settings).Ground;
		var round = function (value) {
			return Math.round(value * 10) / 10;
		};
		var escape = function (value) {
			return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
		};
		var parts = this.Figures(settings).map(function (figure) {
			var fill = ' fill="' + escape(figure.Fill) + '"';
			var turn = figure.Turn ? ' transform="rotate(' + round(figure.Turn) + ' ' + round(figure.X + (figure.Width || 0) / 2) + ' ' + round(figure.Y + (figure.Height || 0) / 2) + ')"' : '';

			if (figure.Kind === 'circle')
				return '<circle cx="' + round(figure.X) + '" cy="' + round(figure.Y) + '" r="' + round(figure.R) + '"' + fill + '/>';

			if (figure.Kind === 'triangle')
				return '<polygon points="' + round(figure.X) + ',' + round(figure.Y + figure.Height) + ' ' + round(figure.X + figure.Width / 2) + ',' + round(figure.Y) + ' ' + round(figure.X + figure.Width) + ',' + round(figure.Y + figure.Height) + '"' + fill + turn + '/>';

			if (figure.Kind === 'arc')
				return '<path d="M' + round(figure.X) + ' ' + round(figure.Y) + 'h' + round(figure.R) + 'a' + round(figure.R) + ' ' + round(figure.R) + ' 0 0 1 -' + round(figure.R) + ' ' + round(figure.R) + 'z"' + fill + ' transform="rotate(' + round(figure.Turn) + ' ' + round(figure.X) + ' ' + round(figure.Y) + ')"/>';

			return '<rect x="' + round(figure.X) + '" y="' + round(figure.Y) + '" width="' + round(figure.Width) + '" height="' + round(figure.Height) + '"' + fill + turn + '/>';
		});

		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '"' + (settings.Title ? ' role="img" aria-label="' + escape(settings.Title) + '"' : ' aria-hidden="true"') + '><rect width="' + width + '" height="' + height + '" fill="' + escape(ground) + '"/>' + parts.join('') + '</svg>';
	},

	DataURL: function (options) {
		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.Generate(options));
	}
});
