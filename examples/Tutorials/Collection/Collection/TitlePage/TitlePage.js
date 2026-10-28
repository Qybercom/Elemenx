/*
 * The page of a title ($Params.id, which the template gives its methods): its head, the tracks of an album (one
 * plays, here as a state), the cast of a film or a game, and more of the same genre.
 */
Elemenx.Component('TitlePage', {
	$TemplateURL: 'TitlePage.html',
	Current: null,
	Playing: false,
	Status: '',
	Version: 0,

	$OnCreate: function () {
		var self = this;

		this.Changed = function () {
			self.Version++;
		};

		this.$Service('Library').OnChange(this.Changed);
	},

	$OnReady: function () {
		var title = this.Title(this.$Params.id);
		if (title)
			this.$Title(title.Title + ' · Collection');
	},

	$OnDestroy: function () {
		this.$Service('Library').OffChange(this.Changed);
	},

	Title: function (id) {
		return this.$Service('Library').Find(id);
	},

	Ratio: function (id) {
		var kind = this.Title(id).Kind;

		return kind === 'album' ? '1:1' : kind === 'game' ? '16:9' : '2:3';
	},

	Subtitle: function (id) {
		var title = this.Title(id);

		return title.Kind === 'album' ? title.Artist : title.Kind === 'game' ? 'Game' : 'Film';
	},

	Facts: function (id) {
		var title = this.Title(id);

		return [String(title.Year)].concat(title.Kind === 'film' ? [title.Length] : title.Kind === 'game' ? title.Platforms : [title.Tracks.length + ' tracks']);
	},

	Kept: function (id) {
		return this.Version >= 0 && this.$Service('Library').IsFavorite(id);
	},

	Like: function (id) {
		var library = this.$Service('Library');

		return library.Like(this.Title(id)).map(function (title) {
			return library.Item(title);
		});
	},

	Keep: function (value) {
		this.$Service('Library').Favorite(this.$Params.id, value.Favorite);
	},

	/* The play button: the first track of an album plays; a film or a game says it starts. */
	Started: function () {
		var title = this.Title(this.$Params.id);

		if (title.Tracks) {
			this.Played(title.Tracks[0]);

			return;
		}

		this.Status = (title.Kind === 'game' ? 'Starting ' : 'Playing ') + title.Title;
	},

	Played: function (track) {
		this.Current = track.ID;
		this.Playing = true;
		this.Status = 'Playing ' + track.Title;
	},

	Paused: function (track) {
		this.Playing = false;
		this.Status = 'Paused ' + track.Title;
	},

	Opened: function (item) {
		this.$Router().Go('/title/' + item.ID);
	}
});
