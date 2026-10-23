/*
 * An icon of a sprite: <Icon Name="add" />, or of another icon set: <Icon Name="weather:rain" /> (see the Icons
 * Service). The symbols of a set are copied into the page once (as elemenx-icon-<name>), and every icon draws the
 * shapes of its symbol itself (*glyph), with no <use>: Chrome rebuilds the shadow tree of every <use> on a restyle of
 * the page, and with the developer tools open all the icons stay blank until a theme change is over. data-icon names
 * the icon. Ready is true once the library sprite is copied. Sprite names another sprite file, drawn with <use>.
 * Colored paints the named parts of a set (sun, moon, cloud, rain, snow, bolt, wind, fog, thermometer in the weather
 * set) with the --elemenx-weather-* colors of the theme.
 */
Elemenx.Component('Icon', {
	$TemplateURL: 'Icon.html',
	$StyleURL: 'Icon.css',
	$Meta: {
		Group: 'display',
		Icon: 'star',
		Description: 'An icon of a sprite: <Icon Name="add" />, or of another icon set: <Icon Name="weather:rain" /> (see the Icons Service).',
		Props: {
			Name: 'The name of the icon: add, or a set and a name: weather:rain.',
			Size: 'The size in pixels.',
			Label: 'What a screen reader says of it (without one it is hidden from them).',
			Sprite: 'Another sprite file, drawn with <use>.',
			Colored: 'Paints the named parts of a set in the colors of the theme.',
			Ready: 'True once the library sprite is in the page.',
			Spin: 'Turns it (a loader).'
		},
		Sample: {Name: 'home', Size: 24}
	},
	Name: '',
	Size: 16,
	Label: '',
	Sprite: '',
	Spin: false,
	Colored: false,
	Ready: false,
	Version: 0,

	$OnCreate: function () {
		var self = this;
		var icons;

		if (this.Sprite) {
			this.Href = function (sprite, name) {
				return sprite + '#' + name;
			};

			return;
		}

		icons = this.$Service('Icons');

		this.Ready = icons.Ready('');

		/* A set that loads or an override that changes draws the icons it concerns again. */
		this.Listener = icons.OnChange(function (state) {
			if (state.Override === undefined && state.Set !== icons.Set(self.Name)) return;

			self.Ready = icons.Ready('');
			self.Version++;
		});

		this.Href = function (sprite, name) {
			return icons.Href(name);
		};
	},

	$OnDestroy: function () {
		if (this.Listener)
			this.$Service('Icons').OffChange(this.Listener);
	}
});
