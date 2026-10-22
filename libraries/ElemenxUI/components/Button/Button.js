/*
 * A button. Variant: primary, secondary (default), ghost, danger or link; Size: small, medium, large or giant; Shape round
 * makes it round. Icon and IconRight are icons before and after its Label; without a Label it is an icon only, named by
 * its Title. Loading shows a spinner and disables it, Disabled disables it, Pressed (true or false) makes it a toggle
 * button (aria-pressed), Block stretches it to the full width. Type is the type of the native button (button, submit,
 * reset). Badge puts a badge over its corner, as *badge does: a count, 'dot', 'busy', a text or {Value, Tone, Max, Label}.
 * Events: click.
 */
Elemenx.Component('Button', {
	$TemplateURL: 'Button.html',
	$StyleURL: 'Button.css',
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