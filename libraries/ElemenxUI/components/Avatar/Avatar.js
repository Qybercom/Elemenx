/*
 * The picture of a person, a team or a product. Image shows a picture; without one, or when it does not load, the
 * avatar is made of the Name (or of Seed): Generate initials (the first letters of the first two words, or Initials of
 * its own: a logo of letters), pattern (a symmetric figure of five by five cells, as code hosts give their users) or
 * shapes (an abstract composition of circles, squares and triangles), always the same for the same name, in a color of
 * the name; Color sets the color of its own. Shape circle, rounded or square; Size small, medium, large, xlarge or a
 * number of pixels. Status puts the dot of a Presence (online, away, busy, dnd, offline, connecting) on its corner.
 */
Elemenx.Component('Avatar', {
	$TemplateURL: 'Avatar.html',
	$StyleURL: 'Avatar.css',
	$Meta: {
		Group: 'display',
		Icon: 'user',
		Description: 'The picture of a person, a team or a product.',
		Props: {
			Name: 'The name of the person, the team or the product: the initials, the figure and the color come from it.',
			Image: 'The URL of a picture; the generated avatar shows while it loads or when it fails.',
			Initials: 'Letters of its own in place of the initials of Name (a logo of letters).',
			Generate: {Options: ['initials', 'pattern', 'shapes'], Description: 'What the avatar without a picture is made of: initials, pattern (a figure of cells) or shapes.'},
			Seed: 'The text the avatar is made of in place of Name (an ID, an email).',
			Color: 'A CSS color of its own; by default a color of the name.',
			Shape: {Options: ['circle', 'rounded', 'square'], Description: 'Its shape: default, or round.'},
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its size: small, medium or large.'},
			Status: {Options: ['', 'online', 'away', 'busy', 'dnd', 'offline', 'connecting'], Description: 'The presence dot on its corner: online, away, busy, dnd, offline or connecting.'}
		},
		Sample: {Name: 'Ada Lovelace', Size: 'large', Status: 'online'}
	},
	Name: '',
	Image: '',
	Initials: '',
	Generate: 'initials',
	Seed: '',
	Color: '',
	Shape: 'circle',
	Size: 'medium',
	Status: '',
	Broken: '',

	$OnCreate: function () {
		/* FNV-1a: a number of a text, the same in every browser. */
		function hash (text) {
			var value = 2166136261;
			var i = 0;

			text = String(text || '');

			while (i < text.length) {
				value ^= text.charCodeAt(i);
				value = Math.imul(value, 16777619) >>> 0;

				i++;
			}

			return value;
		}

		/* The random numbers of a name (mulberry32): the same sequence for the same seed. */
		function random (seed) {
			var state = hash(seed);

			return function () {
				var value;

				state = (state + 0x6D2B79F5) >>> 0;
				value = Math.imul(state ^ (state >>> 15), state | 1);
				value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

				return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
			};
		}

		this.Kind = function (generate) {
			return generate === 'pattern' || generate === 'shapes' ? generate : 'initials';
		};

		this.InitialsOf = function (name, initials) {
			var words = String(name || '').trim().split(/[\s_-]+/).filter(Boolean);

			if (initials)
				return String(initials).slice(0, 3);

			if (!words.length) return '';

			if (words.length === 1)
				return Array.from(words[0]).slice(0, 1).join('').toUpperCase();

			return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
		};

		this.Hue = function (seed) {
			return hash(seed) % 360;
		};

		/* The background of a made avatar: Color, or the color of the name (a tint of it under a pattern). */
		this.Background = function (seed, generate, color) {
			var hue = hash(seed) % 360;

			if (color)
				return color;

			if (generate === 'pattern')
				return 'hsl(' + hue + ' 40% 92%)';

			if (generate === 'shapes')
				return 'hsl(' + ((hue + 180) % 360) + ' 45% 88%)';

			return 'hsl(' + hue + ' 48% 42%)';
		};

		this.Foreground = function (seed) {
			return 'hsl(' + hash(seed) % 360 + ' 55% 42%)';
		};

		/* The filled cells of five by five, the left half mirrored to the right. */
		this.Cells = function (seed) {
			var next = random(seed);
			var cells = [];
			var x;
			var y = 0;

			while (y < 5) {
				x = 0;

				while (x < 3) {
					if (next() < 0.5) {
						cells.push({Key: x + ':' + y, X: x, Y: y});

						if (x < 2)
							cells.push({Key: (4 - x) + ':' + y, X: 4 - x, Y: y});
					}

					x++;
				}

				y++;
			}

			return cells;
		};

		/* Three shapes over the square of 80: a circle, a square turned and a triangle, in the colors around the name. */
		this.Shapes = function (seed) {
			var next = random(seed);
			var hue = hash(seed) % 360;
			var kinds = ['circle', 'square', 'triangle'];
			var shapes = [];
			var i = 0;
			var size;
			var x;
			var y;

			while (i < 3) {
				size = 24 + Math.round(next() * 32);
				x = Math.round(next() * 80);
				y = Math.round(next() * 80);

				shapes.push({
					Key: i,
					Kind: kinds[Math.floor(next() * 3)],
					X: x,
					Y: y,
					R: size / 2,
					Size: size,
					Turn: Math.round(next() * 90),
					Points: [x + ',' + (y - size / 2), (x + size / 2) + ',' + (y + size / 2), (x - size / 2) + ',' + (y + size / 2)].join(' '),
					Fill: 'hsl(' + ((hue + i * 120 + Math.round(next() * 40)) % 360) + ' 62% ' + (44 + i * 8) + '%)'
				});

				i++;
			}

			return shapes;
		};

		/* A number of pixels makes the avatar that size, the letters four tenths of it. */
		this.Pixels = function (size, part) {
			return isFinite(Number(size)) && Number(size) > 0 ? Math.round(Number(size) * (part || 1)) + 'px' : null;
		};

		this.SizeClass = function (size) {
			return ['small', 'medium', 'large', 'xlarge'].indexOf(size) !== -1 ? size : isFinite(Number(size)) && Number(size) > 0 ? 'custom' : 'medium';
		};
	},

	/* A picture that does not load gives way to the made avatar, until Image changes. */
	Failed: function () {
		this.Broken = this.Image;
	}
});
