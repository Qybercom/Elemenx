/*
 * The showcase of the achievements of the Achievements Service: a card for each, its badge in the color of its rarity, its
 * title, text, points and how far it has come, the locked ones dimmed, a secret one with its title and text kept back, a
 * hidden one only once unlocked. Group shows one group, Filter all, unlocked or locked ones; Summary heads it with how many
 * are unlocked and their points. It follows the Service as it changes.
 */
Elemenx.Component('AchievementList', {
	$TemplateURL: 'AchievementList.html',
	$StyleURL: 'AchievementList.css',
	$Meta: {
		Group: 'data',
		Icon: 'trophy',
		Description: 'The showcase of the achievements of the Achievements Service: badges, titles, points and progress, locked and secret ones too.',
		Props: {
			Group: 'Shows the achievements of one group only; empty: all of them.',
			Filter: {Options: ['all', 'unlocked', 'locked'], Description: 'all, unlocked or locked ones.'},
			Summary: 'Heads it with how many are unlocked and their points.',
			Label: 'The name of it for screen readers.'
		}
	},
	Group: '',
	Filter: 'all',
	Summary: true,
	Label: '',
	Version: 0,

	$OnCreate: function () {
		var self = this;

		this.Changed = this.$Service('Achievements').On('change', function () {
			self.Version++;
		});
	},

	$OnDestroy: function () {
		this.$Service('Achievements').Off('change', this.Changed);
	},

	/* The achievements shown, of the group and filter asked for (version: a change of the Service draws them again). */
	Shown: function (group, filter) {
		return this.$Service('Achievements').List({Group: group || null, Unlocked: filter === 'unlocked' ? true : filter === 'locked' ? false : null}).map(function (one) {
			return Object.assign({}, one, {Percent: Math.round(one.State.Part * 100)});
		});
	},

	/* How many are unlocked of all and their points. */
	Tally: function () {
		var achievements = this.$Service('Achievements');

		return Object.assign({Points: achievements.Points()}, achievements.Count());
	}
});
