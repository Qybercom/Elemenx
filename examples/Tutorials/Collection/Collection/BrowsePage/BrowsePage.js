/*
 * The titles of a kind ($Params.kind, which the template gives its methods: films, music or games) with their facets:
 * the genres, the years, the score, the platforms of the games and the artists of the albums.
 */
Elemenx.Component('BrowsePage', {
	$TemplateURL: 'BrowsePage.html',
	Value: {},
	Left: [],

	Kind: function (kind) {
		var kinds = this.$Service('Library').Kinds;

		return kinds[kind] || kinds.films;
	},

	Titles: function (kind) {
		return this.$Service('Library').All(this.Kind(kind).Kind);
	},

	Item: function (title) {
		return this.$Service('Library').Item(title);
	},

	Facets: function (kind) {
		var facets = [
			{ID: 'genre', Label: 'Genre', Field: 'Genres'},
			{ID: 'year', Label: 'Year', Field: 'Year', Type: 'range', Min: 2000, Max: 2025},
			{ID: 'score', Label: 'Score', Field: 'Score', Type: 'rating', Max: 10}
		];

		if (this.Kind(kind).Kind === 'game')
			facets.splice(1, 0, {ID: 'platform', Label: 'Platform', Field: 'Platforms'});

		if (this.Kind(kind).Kind === 'album')
			facets.splice(1, 0, {ID: 'artist', Label: 'Artist', Field: 'Artist', Type: 'choice'});

		return facets;
	},

	Changed: function (value) {
		this.Value = value;
	},

	Filtered: function (titles) {
		this.Left = titles;
	}
});
