/*
 * A shelf of a collection: a row of titles that scrolls across, with its Title, a link to all of them (More, the more
 * event) and arrows that turn it a screen at a time. Items are drawn as MediaCards ([{ID, Title, Subtitle, Image,
 * Kind, Badge, Rating, Progress, Tags, Href}], with the Ratio, Max, Size, Playable and Favorable of the shelf), or the
 * content given goes in its place. The arrow keys go from a card to the next one. Scroll(step) turns it by a screen
 * (1 forward, -1 back). Events: open (an item), play (an item), more.
 */
Elemenx.Component('MediaShelf', {
	$TemplateURL: 'MediaShelf.html',
	$StyleURL: 'MediaShelf.css',
	$Meta: {
		Group: 'media',
		Icon: 'columns',
		Description: 'A shelf of a collection: a row of titles that scrolls across, with its title, a link to all of them and arrows.',
		Container: true,
		Events: {
			open: 'A title was pressed: its item.',
			play: 'The play button of a title: its item.',
			more: 'The link to all of them.'
		},
		Methods: ['Scroll(step)'],
		Props: {
			Title: 'The name of the shelf.',
			Items: 'The titles: [{ID, Title, Subtitle, Image, Kind, Badge, Rating, Progress, Tags, Href}].',
			Ratio: 'The shape of the pictures: 2:3, 1:1, 16:9.',
			Max: 'The highest score of the titles (10).',
			Size: {Options: ['small', 'medium', 'large'], Description: 'The width of the cards.'},
			Playable: 'Shows a play button on each title.',
			Favorable: 'Shows the heart on each title.',
			More: 'The text of the link to all of them; none without.'
		},
		Sample: {Title: 'Continue watching', More: 'See all', Items: [{ID: 'a', Title: 'North', Subtitle: '2023', Progress: 0.4}, {ID: 'b', Title: 'Harbor', Subtitle: '2021', Progress: 0.8}, {ID: 'c', Title: 'Ember', Subtitle: '2024'}]}
	},
	Title: '',
	Items: [],
	Ratio: '2:3',
	Max: 10,
	Size: 'medium',
	Playable: false,
	Favorable: false,
	More: '',
	Start: true,
	End: true,

	$OnCreate: function () {
		var self = this;
		var own = {Observer: null, Scrolled: null};

		this.Own = function () {
			return own;
		};

		own.Scrolled = function () {
			self.Edges();
		};
	},

	$OnReady: function () {
		var own = this.Own();
		var track = this.Track();

		track.addEventListener('scroll', own.Scrolled, {passive: true});

		own.Observer = typeof ResizeObserver === 'function' ? new ResizeObserver(own.Scrolled) : null;

		if (own.Observer)
			own.Observer.observe(track);

		this.Edges();
	},

	$OnProps: function () {
		var self = this;

		window.setTimeout(function () {
			if (self.Track())
				self.Edges();
		}, 0);
	},

	$OnDestroy: function () {
		this.Track().removeEventListener('scroll', this.Own().Scrolled);

		if (this.Own().Observer)
			this.Own().Observer.disconnect();
	},

	Track: function () {
		return this.$Element().querySelector('.elemenx-media-shelf-track');
	},

	/* Whether the row is at its start or at its end: the arrows that cannot turn it are off. */
	Edges: function () {
		var track = this.Track();
		var left = Math.abs(track.scrollLeft);

		this.Start = left <= 1;
		this.End = left + track.clientWidth >= track.scrollWidth - 1;
	},

	Scroll: function (step) {
		var track = this.Track();
		var rtl = getComputedStyle(track).direction === 'rtl';

		track.scrollBy({left: (rtl ? -1 : 1) * (Number(step) || 1) * Math.max(120, track.clientWidth * 0.85), behavior: 'smooth'});

		return this;
	},

	Back: function () {
		this.Scroll(-1);
	},

	Forward: function () {
		this.Scroll(1);
	},

	Find: function (id) {
		return (this.Items || []).filter(function (item) {
			return String(item.ID) === String(id);
		})[0] || null;
	},

	/* A card gives its item back: the one of Items (not a copy of it), found by its ID. */
	Opened: function (item) {
		this.$Emit('open', this.Find(item.ID) || item);
	},

	Played: function (item) {
		this.$Emit('play', this.Find(item.ID) || item);
	},

	Moved: function () {
		this.$Emit('more');
	},

	/* The arrows on a card go to the card beside it, Home and End to the first and the last. */
	Key: function (event) {
		var cards = Array.prototype.slice.call(this.Track().querySelectorAll('.elemenx-media-card'));
		var index = cards.indexOf(event.target);
		var key = Elemenx.Locale.Key(event);
		var next = null;

		if (index === -1) return;

		if (key === 'ArrowRight') next = cards[index + 1];
		else if (key === 'ArrowLeft') next = cards[index - 1];
		else if (key === 'Home') next = cards[0];
		else if (key === 'End') next = cards[cards.length - 1];
		else return;

		event.preventDefault();

		if (next) {
			next.focus();
			next.scrollIntoView({block: 'nearest', inline: 'nearest'});
		}
	}
});
