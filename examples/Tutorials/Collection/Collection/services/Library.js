/*
 * The titles of the collection: films, albums and games, each {ID, Kind, Title, Year, Genres, Score, Description,
 * Hue, Poster, Backdrop, Progress} and, by its kind, Length, Cast and Tracks. The posters are drawn here as SVG (no files
 * to fetch). Favorites are kept in the browser; OnChange(callback) hears them change.
 */
Elemenx.Service('Library', {
	Kinds: {
		films: {Kind: 'film', Title: 'Films', Ratio: '2:3'},
		music: {Kind: 'album', Title: 'Music', Ratio: '1:1'},
		games: {Kind: 'game', Title: 'Games', Ratio: '16:9'}
	},

	$OnCreate: function () {
		this.Store = this.$Storage.Local.Namespace('collection');
		this.Favorites = this.Store.Get('favorites') || [];
		this.Listeners = [];

		this.Titles = [
			this.Film('long-light', 'The Long Light', 2024, ['Drama', 'Mystery'], 8.4, 130, 210, 0.35, 'A keeper of a lighthouse finds that its light reaches further than the sea, and that someone out there answers it.'),
			this.Film('north', 'North', 2019, ['Adventure', 'Drama'], 7.9, 118, 195, 0.8, 'Three friends cross the ice to bring a letter to a town that is no longer on the maps.'),
			this.Film('harbor', 'Harbor', 2021, ['Drama', 'Romance'], 6.8, 104, 20, null, 'A ferry, a strike and two people who meet on the last boat of the evening.'),
			this.Film('ember', 'Ember', 2023, ['Comedy'], 7.1, 96, 15, 0.1, 'A family bakery has one week to win back the street, and one oven that refuses.'),
			this.Film('quiet-hours', 'Quiet Hours', 2016, ['Mystery', 'Thriller'], 7.6, 112, 260, null, 'A night guard of a museum notices that one painting changes a little each night.'),
			this.Film('atlas', 'Atlas', 2022, ['Adventure', 'Science fiction'], 8.7, 142, 230, null, 'A cartographer of a colony ship draws the last map before the landing.'),
			this.Album('tides', 'Tides', 'Elemenx Quartet', 2022, ['Jazz'], 8.8, 200, ['Morning Tide', 'Lantern', 'Salt and Iron', 'Low Water', 'Harbor Lights', 'Undertow']),
			this.Album('signal', 'Signal', 'Northbound', 2020, ['Electronic'], 7.4, 300, ['Carrier', 'Static Bloom', 'Night Bus', 'Relay']),
			this.Album('driftwood', 'Driftwood', 'Ada & the Engines', 2018, ['Folk', 'Rock'], 8.1, 35, ['Driftwood', 'Paper Boats', 'Long Way Round', 'Gone West', 'Embers']),
			this.Album('meridian', 'Meridian', 'Elemenx Quartet', 2024, ['Jazz', 'Classical'], 9.1, 170, ['Prelude', 'Meridian', 'Clockwork', 'Coda']),
			this.Game('skyforge', 'Skyforge', 2024, ['Action', 'Adventure'], 8.2, ['PC', 'PS5'], 280, 0.6, 'Build an airship from the wrecks of the storm and find the forge above the clouds.'),
			this.Game('tiny-towns', 'Tiny Towns', 2021, ['Strategy', 'Family'], 7.7, ['PC', 'Switch'], 100, null, 'Grow a town of a hundred people on a hill, one street at a time.'),
			this.Game('deep-signal', 'Deep Signal', 2022, ['Puzzle', 'Science fiction'], 8.9, ['PC'], 190, 0.25, 'A radio, a submarine and a message from below the ice.'),
			this.Game('kart-cove', 'Kart Cove', 2019, ['Racing', 'Family'], 6.9, ['Switch', 'PS5', 'Xbox'], 50, null, 'Race the karts of the cove along the beach, the docks and the lighthouse.'),
			this.Game('last-light', 'Last Light', 2023, ['Action', 'Thriller'], 7.3, ['PC', 'Xbox'], 0, null, 'Keep the generators of the station running through the longest night.')
		];
	},

	/* A poster of its own, as an SVG: the hue of the title, its shapes and its name. */
	Poster: function (title, hue, width, height) {
		var w = width * 60;
		var h = height * 60;
		var size = Math.min(w, h);

		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',58%,46%)"/><stop offset="1" stop-color="hsl(' + (hue + 40) + ',65%,16%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="' + w * 0.68 + '" cy="' + h * 0.32 + '" r="' + size * 0.24 + '" fill="hsla(' + (hue + 180) + ',80%,78%,0.35)"/><path d="M0 ' + h * 0.72 + 'Q' + w * 0.3 + ' ' + h * 0.6 + ' ' + w * 0.6 + ' ' + h * 0.7 + 'T' + w + ' ' + h * 0.66 + 'V' + h + 'H0z" fill="hsla(' + hue + ',60%,10%,0.55)"/><text x="50%" y="' + h * 0.86 + '" fill="#fff" font-family="sans-serif" font-weight="700" font-size="' + size * 0.11 + '" text-anchor="middle">' + title.replace(/&/g, '&amp;') + '</text></svg>');
	},

	Film: function (id, title, year, genres, score, minutes, hue, progress, description) {
		return {ID: id, Kind: 'film', Hue: hue, Title: title, Year: year, Genres: genres, Score: score, Length: Math.floor(minutes / 60) + ' h ' + minutes % 60 + ' min', Progress: progress, Description: description, Poster: this.Poster(title, hue, 2, 3), Backdrop: this.Poster('', hue, 16, 6), Cast: this.People(id)};
	},

	Album: function (id, title, artist, year, genres, score, hue, tracks) {
		var seconds = 150;

		return {ID: id, Kind: 'album', Hue: hue, Title: title, Artist: artist, Year: year, Genres: genres, Score: score, Progress: null, Description: tracks.length + ' tracks by ' + artist + '.', Poster: this.Poster(title, hue, 1, 1), Backdrop: this.Poster('', hue, 16, 6), Tracks: tracks.map(function (name, index) {
			seconds = 150 + (seconds * 7 + index * 53) % 190;

			return {ID: id + '-' + (index + 1), Number: index + 1, Title: name, Artist: artist, Duration: seconds, Explicit: index === 2};
		})};
	},

	Game: function (id, title, year, genres, score, platforms, hue, progress, description) {
		return {ID: id, Kind: 'game', Hue: hue, Title: title, Year: year, Genres: genres, Score: score, Platforms: platforms, Progress: progress, Description: description, Poster: this.Poster(title, hue, 16, 9), Backdrop: this.Poster('', hue, 16, 6), Cast: this.People(id).slice(0, 3)};
	},

	/* The people of a title, from a few names, in roles of its own. */
	People: function (id) {
		var names = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Emmy Noether', 'Carl Gauss', 'Hedy Lamarr', 'Nikola Tesla', 'Marie Curie'];
		var roles = ['The keeper', 'Captain', 'Navigator', 'The stranger', 'Director', 'Music'];
		var start = id.length % names.length;

		return roles.map(function (role, index) {
			return {ID: id + '-person-' + index, Name: names[(start + index * 3) % names.length], Role: role};
		});
	},

	All: function (kind) {
		return this.Titles.filter(function (title) {
			return !kind || title.Kind === kind;
		});
	},

	Find: function (id) {
		return this.Titles.filter(function (title) {
			return title.ID === id;
		})[0] || null;
	},

	/* The titles begun and not ended, for the shelf to continue. */
	Begun: function () {
		return this.Titles.filter(function (title) {
			return title.Progress > 0 && title.Progress < 1;
		});
	},

	/* More of a title: the others of its kind that share a genre with it, the best first. */
	Like: function (title) {
		return this.All(title.Kind).filter(function (other) {
			return other.ID !== title.ID && other.Genres.some(function (genre) {
				return title.Genres.indexOf(genre) !== -1;
			});
		}).sort(function (a, b) {
			return b.Score - a.Score;
		});
	},

	/* A title as an item of a shelf or a grid (what a MediaCard shows). */
	Item: function (title) {
		return {ID: title.ID, Title: title.Title, Subtitle: title.Kind === 'album' ? title.Artist : title.Kind === 'game' ? title.Platforms.join(' · ') : title.Year + ' · ' + title.Length, Image: title.Poster, Ratio: title.Kind === 'album' ? '1:1' : title.Kind === 'game' ? '16:9' : '2:3', Rating: title.Score, Progress: title.Progress, Tags: title.Genres, Href: '/title/' + title.ID, Favorite: this.IsFavorite(title.ID)};
	},

	IsFavorite: function (id) {
		return this.Favorites.indexOf(id) !== -1;
	},

	Favorite: function (id, on) {
		this.Favorites = this.Favorites.filter(function (each) {
			return each !== id;
		}).concat(on ? [id] : []);

		this.Store.Set('favorites', this.Favorites);

		this.Listeners.slice().forEach(function (listener) {
			listener();
		});
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (each) {
			return each !== callback;
		});
	}
});
