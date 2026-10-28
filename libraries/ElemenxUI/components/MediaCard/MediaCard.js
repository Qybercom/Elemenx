/*
 * The card of a title of a collection: a film, a show, an album, a game, a book. Image is its poster (or cover), Ratio
 * its shape ('2:3' a poster, '1:1' a cover, '16:9' a frame of a game or an episode), Title and Subtitle (a year, an
 * artist, a platform) under it, Kind a word on it (Film, Album, Game), Badge another (New, 4K; BadgeVariant its tone),
 * Rating a score from 0 to Max (10 by default; 5 shows stars), Progress the part seen or played (0 to 1, a bar on the
 * poster), Tags its genres. Playable shows a play button over the poster, Favorable the heart (Favorite). A press
 * opens it, as Href does.
 * Item is what its events give back (the item of a list it shows; {Title} without). Events: open, play (Item), favorite
 * ({Favorite}).
 */
Elemenx.Component('MediaCard', {
	$TemplateURL: 'MediaCard.html',
	$StyleURL: 'MediaCard.css',
	$Meta: {
		Group: 'media',
		Icon: 'image',
		Description: 'The card of a title of a collection: a poster or a cover, its name, its score, how much of it was seen, a play button and the heart.',
		Events: {
			open: 'The card was pressed: Item.',
			play: 'The play button: Item.',
			favorite: 'The heart: {Favorite}.'
		},
		Props: {
			Item: 'What its events give back: the item of a list it shows.',
			Title: 'The name of the title.',
			Subtitle: 'A line under it: a year, an artist, a platform.',
			Image: 'The URL of the poster or the cover.',
			Ratio: 'The shape of the picture: 2:3 a poster, 1:1 a cover, 16:9 a frame.',
			Kind: 'A word on the picture: Film, Album, Game.',
			Badge: 'Another word on the picture: New, 4K.',
			BadgeVariant: {Options: ['accent', 'info', 'success', 'warning', 'danger'], Description: 'The tone of the badge (accent).'},
			Rating: 'The score, 0 to Max.',
			Max: 'The highest score (10; 5 shows stars).',
			Progress: 'The part seen or played, 0 to 1.',
			Tags: 'Its genres.',
			Playable: 'Shows a play button over the picture.',
			Favorable: 'Shows the heart.',
			Favorite: 'The heart is on.',
			Href: 'Makes the card a link.',
			Size: {Options: ['small', 'medium', 'large'], Description: 'Its width: small, medium or large.'}
		},
		Sample: {Title: 'The Long Light', Subtitle: '2024 · 2 h 10 min', Kind: 'Film', Rating: 8.4, Progress: 0.35, Tags: ['Drama', 'Mystery'], Playable: true}
	},
	Item: null,
	Title: '',
	Subtitle: '',
	Image: '',
	Ratio: '2:3',
	Kind: '',
	Badge: '',
	BadgeVariant: 'accent',
	Rating: null,
	Max: 10,
	Progress: null,
	Tags: [],
	Playable: false,
	Favorable: false,
	Favorite: false,
	Href: '',
	Size: 'medium',

	Given: function () {
		return this.Item || {Title: this.Title};
	},

	/* The score as the card shows it: stars out of 5, a number out of more. */
	Stars: function () {
		return Number(this.Max) === 5;
	},

	Score: function () {
		var value = Number(this.Rating);

		return Math.round(value * 10) / 10 + (Number(this.Max) === 100 ? '%' : '');
	},

	/* The tone of a score: high, middle or low, from its part of Max. */
	Tone: function () {
		var part = Number(this.Rating) / (Number(this.Max) || 10);

		return part >= 0.75 ? 'high' : part >= 0.5 ? 'middle' : 'low';
	},

	Part: function () {
		return Math.max(0, Math.min(1, Number(this.Progress) || 0));
	},

	Open: function (event) {
		if (event && event.target && event.target.closest && event.target.closest('.elemenx-media-card-play, .elemenx-media-card-favorite')) return;

		this.$Emit('open', this.Given());
	},

	Key: function (event) {
		if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;

		event.preventDefault();

		this.$Emit('open', this.Given());
	},

	Play: function (event) {
		event.stopPropagation();

		this.$Emit('play', this.Given());
	},

	Star: function (event) {
		event.stopPropagation();

		this.Favorite = !this.Favorite;

		this.$Emit('favorite', {Favorite: this.Favorite});
	}
});
