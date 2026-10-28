/* The home page: a featured film, the titles begun, and a shelf of each kind with a link to all of them. */
Elemenx.Component('HomePage', {
	$TemplateURL: 'HomePage.html',
	Version: 0,

	$OnCreate: function () {
		var self = this;

		/* A favorite kept elsewhere draws the hearts again. */
		this.Changed = function () {
			self.Version++;
		};

		this.$Service('Library').OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('Library').OffChange(this.Changed);
	},

	Featured: function () {
		return this.$Service('Library').Find('long-light');
	},

	Kept: function (id) {
		return this.Version >= 0 && this.$Service('Library').IsFavorite(id);
	},

	Items: function (kind) {
		var library = this.$Service('Library');

		return this.Version >= 0 && library.All(kind).map(function (title) {
			return library.Item(title);
		});
	},

	/* The titles begun, all on posters of the same shape. */
	Begun: function () {
		var library = this.$Service('Library');

		return library.Begun().map(function (title) {
			var item = library.Item(title);

			item.Ratio = '2:3';
			item.Image = title.Kind === 'film' ? title.Poster : library.Poster(title.Title, title.Hue, 2, 3);

			return item;
		});
	},

	Opened: function (item) {
		this.$Router().Go('/title/' + item.ID);
	},

	PlayFeatured: function () {
		this.$Router().Go('/title/' + this.Featured().ID);
	},

	KeepFeatured: function (value) {
		this.$Service('Library').Favorite(this.Featured().ID, value.Favorite);
	},

	/* See all of a shelf: the page of its kind. */
	Films: function () {
		this.$Router().Go('/browse/films');
	},

	Music: function () {
		this.$Router().Go('/browse/music');
	},

	Games: function () {
		this.$Router().Go('/browse/games');
	}
});
