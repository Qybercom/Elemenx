/* Switches the Theme policy: system, light or dark. Compact shows one button that moves to the next policy. */
Elemenx.Component('ThemeSwitch', {
	$TemplateURL: 'ThemeSwitch.html',
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