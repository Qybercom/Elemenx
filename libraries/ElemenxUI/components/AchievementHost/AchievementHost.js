/*
 * Shows the achievements of the AchievementQueue Service (each one the Achievements Service unlocks), one at a time, over the whole page, as a game console does: a
 * round badge pops up, opens into a band with the title (a light runs over it), and folds back into the badge before
 * it goes. Place one in the layout of the Application. Placement: bottom (the default) or top, at the middle of the
 * viewport. A press on the band dismisses it.
 */
Elemenx.Component('AchievementHost', {
	$TemplateURL: 'AchievementHost.html',
	$StyleURL: 'AchievementHost.css',
	$Meta: {
		Group: 'overlays',
		Icon: 'trophy',
		Description: 'Shows the achievements of the AchievementQueue Service, one at a time, over the whole page, as a game console does: a round badge pops up, opens into a band with the title (a light runs over it), and folds back into the badge before it goes.',
		Props: {
			Placement: 'Where the achievements show: at the bottom or the top of the middle of the viewport.'
		}
	},
	Placement: 'bottom',
	Item: null,

	$OnCreate: function () {
		var self = this;
		var achievements = this.$Service('AchievementQueue');

		this.Item = achievements.Current();

		this.Listener = achievements.OnChange(function (state) {
			self.Item = state.Current;
		});
	},

	$OnDestroy: function () {
		this.$Service('AchievementQueue').OffChange(this.Listener);
	},

	Dismiss: function () {
		if (this.Item)
			this.$Service('AchievementQueue').Dismiss(this.Item.ID);
	}
});
