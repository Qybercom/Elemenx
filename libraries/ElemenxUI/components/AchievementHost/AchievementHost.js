/*
 * Shows the achievements of the Achievements Service, one at a time, over the whole page, as a game console does: a
 * round badge pops up, opens into a band with the title (a light runs over it), and folds back into the badge before
 * it goes. Place one in the layout of the Application. Placement: bottom (the default) or top, at the middle of the
 * viewport. A press on the band dismisses it.
 */
Elemenx.Component('AchievementHost', {
	$TemplateURL: 'AchievementHost.html',
	$StyleURL: 'AchievementHost.css',
	Placement: 'bottom',
	Item: null,

	$OnCreate: function () {
		var self = this;
		var achievements = this.$Service('Achievements');

		this.Item = achievements.Current();

		this.Listener = achievements.OnChange(function (state) {
			self.Item = state.Current;
		});
	},

	$OnDestroy: function () {
		this.$Service('Achievements').OffChange(this.Listener);
	},

	Dismiss: function () {
		if (this.Item)
			this.$Service('Achievements').Dismiss(this.Item.ID);
	}
});
