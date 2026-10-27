/*
 * A hotel to book. Its phrases come from the dictionaries of locales/ by key ($T), its dates and prices are written by
 * Intl in the language of the page, and the arrow keys of its photos keep their meaning right to left
 * (Elemenx.Locale.Key). The language is chosen in its header, and the page remembers it.
 */
Elemenx.Component('TripCard', {
	$TemplateURL: 'TripCard.html',
	$StyleURL: 'TripCard.css',
	Language: 'en',
	Nights: 3,
	Rate: 84,
	Arrival: '2026-07-14',
	Photo: 0,
	Photos: ['trip.photos.room', 'trip.photos.view', 'trip.photos.pool'],
	Languages: [{Value: 'en', Label: 'English'}, {Value: 'ru', Label: 'Русский'}, {Value: 'ar', Label: 'العربية'}],

	$OnCreate: function () {
		var self = this;

		this.Language = Elemenx.Locale.Language();

		/* What is written in code (the dates, the price) follows the language too: $T alone would not redo them. */
		this.Listener = function () {
			self.Language = Elemenx.Locale.Language();
		};

		Elemenx.Locale.OnChange(this.Listener);
	},

	$OnDestroy: function () {
		Elemenx.Locale.OffChange(this.Listener);
	},

	Switched: function (value) {
		Elemenx.Locale.Language(value, function () {});
	},

	Stayed: function (value) {
		this.Nights = value;
	},

	/* The dates of the stay, in the manner of the language: 14 July, 14 июля, ١٤ يوليو. */
	Dates: function (nights, language) {
		var format = new Intl.DateTimeFormat(language, {day: 'numeric', month: 'long'});
		var from = new Date(this.Arrival + 'T12:00:00');
		var to = new Date(from.getTime() + nights * 86400000);

		return Elemenx.Locale.Text('trip.dates', {from: format.format(from), to: format.format(to)});
	},

	Money: function (amount, language) {
		return new Intl.NumberFormat(language, {style: 'currency', currency: 'EUR'}).format(amount);
	},

	Previous: function () {
		this.Photo = (this.Photo + this.Photos.length - 1) % this.Photos.length;
	},

	Next: function () {
		this.Photo = (this.Photo + 1) % this.Photos.length;
	},

	/* ArrowRight goes forward in the direction of the reading: to the left in Arabic. */
	Stepped: function (event) {
		var key = Elemenx.Locale.Key(event);

		if (key === 'ArrowRight') this.Next();
		else if (key === 'ArrowLeft') this.Previous();
	}
});
