<!-- generated -->
# Cities

Города мира из GeoNames (все города с населением от тысячи человек, CC BY 4.0: показывайте Attribution там, где видны города): их названия, страны, регионы, координаты и часовые пояса. Данные большие и загружаются один раз, когда впервые нужны: data/cities.txt и data/regions.txt (пакет cities), а также названия на языке страницы, если для него есть пакет (data/cities-ru.txt, пакет cities.ru).

Город — {ID, Name, Country, Region, Latitude, Longitude, TimeZone}: Name и Region на языке страницы (иначе по-английски), Country — код ISO 3166 (Label добавляет его название).

- Load(callback): загружает данные; callback (error, count).
- Search(text, options, callback): города, название или слово названия которых начинается с текста, в любых буквах (без учёта регистра и диакритики; латиница находит кириллическое название: moskva находит Москва), по алфавиту. options: Country (код), Limit (20). callback (error, cities).
- Find(id, callback): город по ID или null. Nearest(latitude, longitude, options, callback): ближайший город (options.Country ограничивает одной страной).
- Clock(город или часовой пояс, date): время там, {Date: 'YYYY-MM-DD', Time: 'HH:mm', Offset: '+03:00', TimeZone} (по умолчанию сейчас). Label(city): 'Название, Регион, Страна' на языке страницы; Place(city): 'Регион, Страна'.

## Методы

- `Load(callback)`
- `Search(text, options, callback)`
- `Find(id, callback)`
- `Nearest(latitude, longitude, options, callback)`
- `Clock(city, date)`
- `Label(city)`
- `Place(city)`

## Пример

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
