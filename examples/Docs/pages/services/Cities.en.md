<!-- generated -->
# Cities

The cities of the world from GeoNames (every city of a thousand people or more, CC BY 4.0: show Attribution where the cities are seen): their names, countries, regions, coordinates and time zones. The data is large and loads once, when it is first needed: data/cities.txt and data/regions.txt (the pack cities), and the names in the language of the page where there is a pack of it (data/cities-ru.txt, the pack cities.ru).

A city is {ID, Name, Country, Region, Latitude, Longitude, TimeZone}: Name and Region in the language of the page (English otherwise), Country a code of ISO 3166 (Label adds its name).

- Load(callback): loads the data; callback (error, count).
- Search(text, options, callback): the cities whose name, or a word of it, starts with the text, in any letters (no case, no diacritics; Latin letters find a Cyrillic name: moskva finds Москва), sorted by name. options: Country (a code), Limit (20). callback (error, cities).
- Find(id, callback): the city of an ID, or null. Nearest(latitude, longitude, options, callback): the closest city (options.Country keeps one country).
- Clock(city or time zone, date): the time there, {Date: 'YYYY-MM-DD', Time: 'HH:mm', Offset: '+03:00', TimeZone} (now by default). Label(city): 'Name, Region, Country' in the language of the page; Place(city): 'Region, Country'.

## Methods

- `Load(callback)`
- `Search(text, options, callback)`
- `Find(id, callback)`
- `Nearest(latitude, longitude, options, callback)`
- `Clock(city, date)`
- `Label(city)`
- `Place(city)`

## Example

```example
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Text" placeholder="A city" /></span>
<Button Label="Search" Variant="primary" (click)="Search" />
<ul class="elemenx-ul"><li *for="city of Found" *key="city.ID">{{city.Label}} · {{city.Time}}</li></ul>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Text: 'riga',
	Found: [],
	Note: 'The data (7 MB) loads on the first search. Cities: GeoNames (geonames.org), CC BY 4.0.',

	Search: function () {
		var self = this;
		var cities = this.$Service('Cities');

		this.Note = 'Searching...';

		cities.Search(this.Text, {Limit: 5}, function (error, found) {
			if (error) {
				self.Note = error.message;

				return;
			}

			self.Note = found.length + ' found';
			self.Found = found.map(function (city) {
				return {ID: city.ID, Label: cities.Label(city), Time: cities.Clock(city).Time};
			});
		});
	}
})
</script>
```

## Tests

- [loads the data once for every caller, with the names of the language when it has a pack](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cities.test.js#L130) — `tests/regression/cities.test.js`
- [finds the names that start with the text first, then the words, by name; without diacritics and across alphabets](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cities.test.js#L161) — `tests/regression/cities.test.js`
- [finds a city by ID and the nearest city, and tells the place, the label and the time there](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cities.test.js#L185) — `tests/regression/cities.test.js`
- [calls back the error of a file that does not load](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cities.test.js#L214) — `tests/regression/cities.test.js`
