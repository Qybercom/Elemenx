/*
 * A bar of a game: health, mana, experience, stamina or any other amount. Value of Max; Kind (health, mana,
 * experience, stamina, or any name: its color is --elemenx-game-<Kind>, or Color); Label and ShowValue; Segments
 * draws that many parts; Size (small, medium, large). A loss leaves a trail that follows a moment later (the damage),
 * a gain fills at once.
 */
Elemenx.Component('GameBar', {
	$TemplateURL: 'GameBar.html',
	$StyleURL: 'GameBar.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'A bar of a game: health, mana, experience, stamina or any other amount.',
		Props: {
			Value: 'The amount.',
			Max: 'The most it holds.',
			Kind: 'health, mana, experience, stamina or a name of its own (its color: --elemenx-game-<Kind>).',
			Label: 'The name shown with the bar.',
			ShowValue: 'Shows the value on the bar.',
			Segments: 'Draws the bar in so many parts (0: one).',
			Size: {Options: ['small', 'medium', 'large'], Description: 'small, medium or large.'},
			Color: 'A color of its own.'
		},
		Sample: {Label: 'Health'}
	},
	Value: 0,
	Max: 100,
	Kind: 'health',
	Label: '',
	ShowValue: true,
	Segments: 0,
	Size: 'medium',
	Color: '',

	$OnCreate: function () {
		var self = this;

		/* The fraction of the bar filled, between 0 and 1. */
		this.Fraction = function (value, max) {
			var total = Number(max) || 0;

			return total > 0 ? Math.max(0, Math.min(1, (Number(value) || 0) / total)) : 0;
		};

		this.Style = function (value, max, kind, color, segments) {
			var fraction = self.Fraction(value, max);

			return '--elemenx-game-bar-value: ' + fraction + '; --elemenx-game-bar-color: ' + (color || 'var(--elemenx-game-' + String(kind || 'health').replace(/[^a-z0-9-]/gi, '') + ', var(--elemenx-accent))') + '; --elemenx-game-bar-segments: ' + Math.max(0, Number(segments) || 0) + ';';
		};
	}
});
