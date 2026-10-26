/*
 * A button. Variant: primary, secondary (default), ghost, danger or link; Size: small, medium, large or giant; Shape round
 * makes it round. Icon and IconRight are icons before and after its Label; without a Label it is an icon only, named by
 * its Title. Loading shows a spinner and disables it, Disabled disables it, Pressed (true or false) makes it a toggle
 * button (aria-pressed), Expanded (true or false) tells it opens something (aria-expanded), AriaLabel is its name for
 * a screen reader when its text does not say it (M for Mute the drums), Block stretches it to the full width. Type is the type of the native button (button, submit,
 * reset). Badge puts a badge over its corner, as *badge does: a count, 'dot', 'busy', a text or {Value, Tone, Max, Label}.
 * Events: click.
 */
Elemenx.Component('Button', {
	$TemplateURL: 'Button.html',
	$StyleURL: 'Button.css',
	$Meta: {
		Group: 'buttons',
		Icon: 'launcher',
		Description: 'A button.',
		Container: true,
		Events: ['click'],
		Props: {
			Label: 'The text of the button; without one it is an icon button named by Title.',
			Variant: {Options: ['primary', 'secondary', 'ghost', 'danger', 'link'], Description: 'Its look: primary, secondary, ghost, danger or link.'},
			Size: {Options: ['small', 'medium', 'large', 'giant'], Description: 'Its size: small, medium or large.'},
			Shape: 'Its shape: default, or round.',
			Icon: 'An icon before the label.',
			IconRight: 'An icon after the label.',
			Type: {Options: ['button', 'submit', 'reset'], Description: 'The type of the native button: button, submit or reset.'},
			Title: 'The tooltip, and the name of an icon button.',
			Disabled: 'Turns it off: it takes no input and looks so.',
			Loading: 'Shows a spinner and disables the button.',
			Block: 'Stretches it to the full width.',
			Pressed: 'true or false makes it a toggle button (aria-pressed); empty for a plain button.',
			Expanded: 'true or false: it opens and closes something (aria-expanded); empty for a plain button.',
			AriaLabel: 'Its name for a screen reader, when its text does not say it (M for Mute the drums).',
			Badge: 'A badge over its corner: a count, dot, busy, a text or {Value, Tone, Max, Label}.'
		},
		Sample: {Label: 'Primary', Variant: 'primary'}
	},
	Label: '',
	Variant: 'secondary',
	Size: 'medium',
	Shape: 'default',
	Icon: '',
	IconRight: '',
	Type: 'button',
	Title: '',
	Disabled: false,
	Loading: false,
	Block: false,
	Pressed: null,
	Expanded: null,
	AriaLabel: '',
	Badge: '',

	$OnCreate: function () {
		var self = this;

		/* The badge over the corner (Badge: a count, 'dot', 'busy', a text or {Value, Tone, Max, Label}; the Badges Service). */
		this.BadgeOf = function (value) {
			return self.$Service('Badges').Describe(value);
		};

		this.BadgeClasses = function (value) {
			return self.$Service('Badges').Classes(value);
		};
	},

	Clicked: function (event) {
		this.$Emit('click', event);
	}
});