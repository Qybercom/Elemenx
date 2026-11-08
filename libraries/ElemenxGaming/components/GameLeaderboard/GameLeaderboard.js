/*
 * The leaderboard of a game. Items [{ID, Name, Score, Rank, Avatar, Icon, Note, Change, Me}]: by Score, the highest
 * first (or by Rank where the items carry it). The first three wear the medals of the theme (gold, silver, bronze);
 * Change shows how many places a player rose (a positive number) or fell; Me marks the player of the page. Limit (10)
 * keeps the top of the list: the player below it shows apart after a gap. ScoreLabel names the score. Selectable rows
 * emit select with their item.
 */
Elemenx.Component('GameLeaderboard', {
	$TemplateURL: 'GameLeaderboard.html',
	$StyleURL: 'GameLeaderboard.css',
	$Meta: {
		Group: 'game',
		Icon: 'trophy',
		Description: 'The leaderboard of a game.',
		Events: {
			select: 'A row was pressed: its item.'
		},
		Props: {
			Items: 'The players: [{ID, Name, Score, Rank, Avatar, Icon, Note, Change, Me}].',
			Limit: 'How many rows of the top show.',
			ScoreLabel: 'The name of the score.',
			Selectable: 'The rows emit select with their item.',
			Label: 'The name of the board for screen readers.'
		},
		Sample: {Limit: 5, ScoreLabel: 'Glory', Selectable: true}
	},
	Items: [],
	Limit: 10,
	ScoreLabel: '',
	Selectable: false,
	Label: '',

	$OnCreate: function () {
		var self = this;

		/* The ranked rows: [{Item, Rank}], highest score first; a Rank of the items wins. */
		this.Ranked = function (items) {
			var rows = (items || []).map(function (item, index) {
				return {Item: item, Index: index};
			});

			rows.sort(function (a, b) {
				if (a.Item.Rank != null && b.Item.Rank != null)
					return Number(a.Item.Rank) - Number(b.Item.Rank);

				return Number(b.Item.Score) - Number(a.Item.Score) || a.Index - b.Index;
			});

			return rows.map(function (row, index) {
				return {Item: row.Item, Index: row.Index, Rank: row.Item.Rank != null ? Number(row.Item.Rank) : index + 1};
			});
		};

		/* The rows shown: the top of Limit, then the player of the page when they are below it. */
		this.Rows = function (items, limit) {
			var ranked = self.Ranked(items);
			var count = Number(limit) || ranked.length;
			var top = ranked.slice(0, count);
			var me = ranked.slice(count).filter(function (row) {
				return row.Item.Me;
			})[0];

			return me ? top.concat([{Gap: true, Rank: -1}, me]) : top;
		};

		/* The medal of a rank. */
		this.Medal = function (rank) {
			return ['', 'gold', 'silver', 'bronze'][rank] || '';
		};

		this.Score = function (value) {
			return typeof value === 'number' ? value.toLocaleString(Elemenx.Locale.Language() || undefined) : String(value == null ? '' : value);
		};
	},

	Pressed: function (event, node) {
		if (!this.Selectable || this.Selectable === 'false') return;

		this.$Emit('select', (this.Items || [])[Number(node.getAttribute('data-index'))]);
	}
});
