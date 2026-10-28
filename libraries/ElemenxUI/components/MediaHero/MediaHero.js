/*
 * The head of the page of a title, or of a collection: its backdrop (Image), shaded so that the text reads over it, its
 * Poster beside, Title, Subtitle (an original title, an artist, a studio), Facts (a list: a year, a length, a rating of
 * age), Rating (of Max, 10), Tags (its genres) and Description. The actions: Play (PlayLabel; the play event), the
 * heart (Favorable, Favorite; the favorite event {Favorite}) and the content given (more buttons). Progress (0 to 1)
 * tells how much of it was seen: the play button then says Resume (ResumeLabel). Size compact is a band of a shelf.
 */
Elemenx.Component('MediaHero', {
	$TemplateURL: 'MediaHero.html',
	$StyleURL: 'MediaHero.css',
	$Meta: {
		Group: 'media',
		Icon: 'video',
		Description: 'The head of the page of a title: its backdrop and poster, its name, facts, score, genres and story, and the buttons to play it and to keep it.',
		Container: true,
		Events: {
			play: 'The play button.',
			favorite: 'The heart: {Favorite}.'
		},
		Props: {
			Title: 'The name of the title.',
			Subtitle: 'A line over the name: an original title, an artist, a studio.',
			Image: 'The URL of the backdrop.',
			Poster: 'The URL of the poster beside the text.',
			PosterRatio: 'The shape of the poster (2:3; 1:1 for a cover).',
			Facts: 'The facts: a year, a length, a rating of age.',
			Rating: 'The score, 0 to Max.',
			Max: 'The highest score (10).',
			Tags: 'The genres.',
			Description: 'The story.',
			Playable: 'Shows the play button.',
			PlayLabel: 'The text of the play button.',
			ResumeLabel: 'The text of the play button once some of it was seen.',
			Progress: 'How much of it was seen, 0 to 1.',
			Favorable: 'Shows the heart.',
			Favorite: 'The heart is on.',
			Size: {Options: ['default', 'compact'], Description: 'default, or compact (a band of a shelf).'}
		},
		Sample: {Title: 'The Long Light', Subtitle: 'An Elemenx film', Facts: ['2024', '2 h 10 min', '12+'], Rating: 8.4, Tags: ['Drama', 'Mystery'], Description: 'A keeper of a lighthouse finds that its light reaches further than the sea.', Playable: true, Favorable: true}
	},
	Title: '',
	Subtitle: '',
	Image: '',
	Poster: '',
	PosterRatio: '2:3',
	Facts: [],
	Rating: null,
	Max: 10,
	Tags: [],
	Description: '',
	Playable: true,
	PlayLabel: '',
	ResumeLabel: '',
	Progress: null,
	Favorable: false,
	Favorite: false,
	Size: 'default',

	Seen: function () {
		var part = Number(this.Progress);

		return part > 0 && part < 1;
	},

	Play: function () {
		this.$Emit('play');
	},

	Star: function () {
		this.Favorite = !this.Favorite;

		this.$Emit('favorite', {Favorite: this.Favorite});
	}
});
