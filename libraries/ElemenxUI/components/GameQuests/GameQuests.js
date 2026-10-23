/*
 * The quests of a game. Items [{ID, Title, Group, Level, Status ('active', 'done' or 'failed'), Tracked, Text,
 * Objectives [{Label, Value, Max}], Rewards [{Icon, Image, Label, Count, Rarity, Color, Type, Stats, Description, or
 * Item: the item itself}]}]. A reward with more than a name shows its card under the pointer or the focus (*itemcard).
 * - Variant 'log' (the default): the journal, the quests by Group on the left (the arrows, Home and End move), the open
 *   one on the right with its text, objectives and rewards, and a button that tracks it. Value is the ID of the open
 *   quest; change emits the ID of another, track {ID, Tracked}.
 * - Variant 'tracker': the objectives of the tracked active quests, for the screen of the game; a press on a quest
 *   emits change with its ID.
 * Label names the list for screen readers, Empty is the text without quests.
 */
Elemenx.Component('GameQuests', {
	$TemplateURL: 'GameQuests.html',
	$StyleURL: 'GameQuests.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The quests of a game.',
		Events: ['change', 'track'],
		Props: {
			Items: 'The quests: [{ID, Title, Group, Level, Status, Tracked, Text, Objectives, Rewards}].',
			Value: 'The ID of the open quest.',
			Variant: {Options: ['log', 'tracker'], Description: 'log (the journal) or tracker (the objectives of the tracked quests).'},
			Label: 'The name of the list for screen readers.',
			Empty: 'The text without quests.'
		},
		Sample: {Label: 'Quest log'}
	},
	Items: [],
	Value: null,
	Variant: 'log',
	Label: '',
	Empty: '',

	$OnCreate: function () {
		var self = this;

		/* The quests by Group, in the order they come: [{Name, Items: [{Quest, Index}]}]. */
		this.Groups = function (items) {
			var groups = [];
			var byName = {};

			(items || []).forEach(function (quest, index) {
				var name = quest.Group || '';

				if (!byName.hasOwnProperty(name)) {
					byName[name] = {Name: name, Items: []};

					groups.push(byName[name]);
				}

				byName[name].Items.push({Quest: quest, Index: index});
			});

			return groups;
		};

		/* The open quest: the one of Value, or the first. */
		this.Current = function (items, value) {
			var found = (items || []).filter(function (quest) {
				return quest.ID === value;
			})[0];

			return found || (items || [])[0] || null;
		};

		/* Whether a quest is the open one (by ID: the items the template sees are not the ones of Items). */
		this.IsOpen = function (items, value, quest) {
			var current = self.Current(items, value);

			return !!current && current.ID === quest.ID;
		};

		/* The tracked quests that are still active. */
		this.Tracked = function (items) {
			return (items || []).filter(function (quest) {
				return quest.Tracked && (quest.Status || 'active') === 'active';
			});
		};

		/* An objective reached: its Value at Max (an objective without Max is reached at 1). */
		this.Reached = function (objective) {
			return Number(objective.Value) >= Number(objective.Max == null ? 1 : objective.Max);
		};

		/* The count of an objective: '3 / 5', or nothing for one without Max. */
		this.Count = function (objective) {
			return objective.Max == null ? '' : Math.min(Number(objective.Value) || 0, Number(objective.Max)) + ' / ' + objective.Max;
		};

		/* The item of a reward for its card (*itemcard): its Item, or the reward itself; null for a reward with only a name. */
		this.RewardItem = function (reward) {
			var item = reward && (reward.Item || {Name: reward.Name || reward.Label, Rarity: reward.Rarity, Type: reward.Type, Stats: reward.Stats, Description: reward.Description, Class: reward.Class});

			return item && (item.Description || item.Type || item.Stats && item.Stats.length || item.Rarity) ? item : null;
		};

		/* The share of an objective done, for its bar: '60%'. */
		this.Share = function (objective) {
			var max = Number(objective.Max == null ? 1 : objective.Max) || 1;

			return Math.max(0, Math.min(1, (Number(objective.Value) || 0) / max)) * 100 + '%';
		};
	},

	Open: function (index, focus) {
		var quest = (this.Items || [])[index];
		var root = this.$Element();
		var button;

		if (!quest) return;

		if (quest.ID !== this.Value) {
			this.Value = quest.ID;

			this.$Emit('change', quest.ID);
		}

		button = focus && root ? root.querySelector('.elemenx-game-quest[data-index="' + index + '"]') : null;

		if (button)
			button.focus();
	},

	Pressed: function (event, node) {
		this.Open(Number(node.getAttribute('data-index')), false);
	},

	Key: function (event) {
		var items = this.Items || [];
		var current = this.Current(items, this.Value);
		var index = items.map(function (quest) {
			return quest.ID;
		}).indexOf(current ? current.ID : null);

		if (event.key === 'ArrowDown') index = (index + 1) % items.length;
		else if (event.key === 'ArrowUp') index = (index - 1 + items.length) % items.length;
		else if (event.key === 'Home') index = 0;
		else if (event.key === 'End') index = items.length - 1;
		else return;

		event.preventDefault();

		this.Open(index, true);
	},

	Track: function () {
		var quest = this.Current(this.Items, this.Value);
		if (!quest) return;

		this.$Emit('track', {ID: quest.ID, Tracked: !quest.Tracked});
	},

	Followed: function (event, node) {
		this.$Emit('change', node.getAttribute('data-id'));
	}
});
