/*
 * Switches the policy of the Theme Service: system (follows the operating system), light or dark; the choice is
 * remembered. Three buttons (system, light, dark), or with Compact one button that shows the policy and moves to the
 * next one. Size: small (the default) or medium. It follows changes made elsewhere (another switch, the code).
 */
Elemenx.Component('ThemeSwitch', {
	$TemplateURL: 'ThemeSwitch.html',
	$Meta: {
		Group: 'buttons',
		Icon: 'moon',
		Description: 'Switches the policy of the Theme Service: system (follows the operating system), light or dark; the choice is remembered.',
		Props: {
			Size: {Options: ['small', 'medium'], Description: 'small or medium.'},
			Compact: 'One button that moves to the next policy.',
			Policy: {Options: ['system', 'light', 'dark'], Description: 'The policy shown: system, light or dark (it follows the Theme Service).'}
		}
	},
	Size: 'small',
	Compact: false,
	Policy: 'system',

	$OnCreate: function () {
		var self = this;
		var theme = this.$Service('Theme');

		this.Policy = theme.Policy();

		this.Listener = theme.OnChange(function (state) {
			self.Policy = state.Policy;
		});
	},

	$OnDestroy: function () {
		this.$Service('Theme').OffChange(this.Listener);
	},

	System: function () {
		this.$Service('Theme').Policy('system');
	},

	Light: function () {
		this.$Service('Theme').Policy('light');
	},

	Dark: function () {
		this.$Service('Theme').Policy('dark');
	},

	Next: function () {
		this.$Service('Theme').Next();
	}
});