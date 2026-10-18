/*
 * The cities of the world from GeoNames (every city of a thousand people or more, CC BY 4.0: show Attribution where
 * the cities are seen): their names, countries, regions, coordinates and time zones. The data is large and loads once,
 * when it is first needed: data/cities.txt and data/regions.txt (the pack cities), and the names in the language of
 * the page where there is a pack of it (data/cities-ru.txt, the pack cities.ru).
 *
 * A city is {ID, Name, Country, Region, Latitude, Longitude, TimeZone}: Name and Region in the language of the page
 * (English otherwise), Country a code of ISO 3166 (Label adds its name).
 * - Load(callback): loads the data; callback (error, count).
 * - Search(text, options, callback): the cities whose name, or a word of it, starts with the text, in any letters
 *   (no case, no diacritics; Latin letters find a Cyrillic name: moskva finds Москва), sorted by name. options:
 *   Country (a code), Limit (20). callback (error, cities).
 * - Find(id, callback): the city of an ID, or null. Nearest(latitude, longitude, options, callback): the closest city
 *   (options.Country keeps one country).
 * - Clock(city or time zone, date): the time there, {Date: 'YYYY-MM-DD', Time: 'HH:mm', Offset: '+03:00', TimeZone}
 *   (now by default). Label(city): 'Name, Region, Country' in the language of the page; Place(city): 'Region, Country'.
 */
Elemenx.Service('Cities', {
	Library: 'ElemenxUI',
	Locale: '',
	Locales: ['ru'],
	Limit: 20,
	Attribution: 'Cities: GeoNames (geonames.org), CC BY 4.0',

	$OnCreate: function () {
		var library = Elemenx.Library(this.Library);

		this.Root = String(library && library.$Root || '').replace(/\/$/, '');
		this.Data = null;
		this.Waiting = null;
	},

	/* The language of the names: Locale, or the language of the page. */
	Language: function () {
		return String(this.Locale || Elemenx.Locale.Language() || 'en').split('-')[0].toLowerCase();
	},

	/* A text for search: lower case, without diacritics, Cyrillic in Latin letters. */
	Fold: function (text) {
		var map = {а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi', є: 'ye', ґ: 'g', ў: 'u'};

		return String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[а-яёіїєґў]/g, function (letter) {
			return map[letter];
		});
	},

	Load: function (callback) {
		var self = this;
		var language = this.Language();
		var files = [this.Root + '/data/cities.txt', this.Root + '/data/regions.txt'];

		callback = callback || function () {};

		if (this.Data) {
			callback(null, this.Data.List.length);

			return;
		}

		if (this.Waiting) {
			this.Waiting.push(callback);

			return;
		}

		this.Waiting = [callback];

		if (this.Locales.indexOf(language) !== -1)
			files.push(this.Root + '/data/cities-' + language + '.txt');

		this.Texts(files, function (error, texts) {
			var waiting = self.Waiting;

			self.Waiting = null;

			if (!error)
				self.Data = self.Parse(texts[0], texts[1], texts[2] || '');

			waiting.forEach(function (item) {
				item(error || null, error ? 0 : self.Data.List.length);
			});
		});
	},

	/* The texts of files, in their order: callback (error, texts). */
	Texts: function (urls, callback) {
		var texts = [];
		var left = urls.length;
		var failed = false;

		urls.forEach(function (url, index) {
			Elemenx.Resource.Load(url, function (error, text) {
				if (failed) return;

				if (error) {
					failed = true;

					callback(error);

					return;
				}

				texts[index] = text;
				left--;

				if (!left)
					callback(null, texts);
			});
		});
	},

	/* The cities of the data: their records, and the folded names that search reads. */
	Parse: function (cities, regions, local) {
		var self = this;
		var lines = String(cities).split('\n');
		var zones = lines[0].split('|');
		var names = {};
		var regionNames = {};
		var list = [];
		var byID = {};
		var order;
		var i = 1;

		String(regions).split('\n').forEach(function (line) {
			var tab = line.indexOf('\t');
			if (tab !== -1)
				regionNames[line.substring(0, tab)] = line.substring(tab + 1);
		});

		String(local).split('\n').forEach(function (line) {
			var tab = line.indexOf('\t');
			if (tab !== -1)
				names[line.substring(0, tab)] = line.substring(tab + 1);
		});

		while (i < lines.length) {
			var field = lines[i].split('\t');
			var region;
			var city;

			if (field.length === 7) {
				region = field[2] + '.' + field[3];
				city = {
					ID: parseInt(field[0], 36),
					Name: names[field[0]] || field[1],
					Country: field[2],
					Region: names[region] || regionNames[region] || '',
					Latitude: Number(field[4]),
					Longitude: Number(field[5]),
					TimeZone: zones[parseInt(field[6], 36)]
				};

				list.push({City: city, Keys: names[field[0]] ? self.Fold(field[1]) + '|' + self.Fold(names[field[0]]) : self.Fold(field[1])});

				byID[city.ID] = city;
			}

			i++;
		}

		/* The data comes sorted by the English names; the names of a language sort again. */
		if (local) {
			order = new Intl.Collator(this.Language()).compare;

			list.sort(function (a, b) {
				return order(a.City.Name, b.City.Name) || (a.City.Country < b.City.Country ? -1 : a.City.Country > b.City.Country ? 1 : 0) || a.City.ID - b.City.ID;
			});
		}

		return {List: list, ByID: byID};
	},

	Search: function (text, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		options = options || {};

		this.Load(function (error) {
			var query = self.Fold(String(text || '').trim());
			var limit = Number(options.Limit) || self.Limit;
			var tiers = [[], []];
			var i = 0;
			var entry;
			var rank;

			if (error) {
				callback(error);

				return;
			}

			if (!query) {
				callback(null, []);

				return;
			}

			/* The names that start with the text come first, then the names with a word that does; each by name. */
			while (i < self.Data.List.length && tiers[0].length < limit) {
				entry = self.Data.List[i];
				rank = entry.Keys.indexOf(query) === -1 || options.Country && entry.City.Country !== options.Country ? -1 : self.Rank(entry.Keys, query);

				if (rank !== -1 && tiers[rank].length < limit)
					tiers[rank].push(entry.City);

				i++;
			}

			callback(null, tiers[0].concat(tiers[1]).slice(0, limit));
		});
	},

	/* How the folded names of a city ('english|local') hold a folded text: 0 a name starts with it, 1 a word does, -1 none. */
	Rank: function (keys, query) {
		var best = -1;
		var at = keys.indexOf(query);
		var before;

		while (at !== -1 && best !== 0) {
			before = at ? keys.charAt(at - 1) : '|';

			if (before === '|') best = 0;
			else if (/[\s\-'’(/]/.test(before)) best = 1;

			at = keys.indexOf(query, at + 1);
		}

		return best;
	},

	Find: function (id, callback) {
		var self = this;

		this.Load(function (error) {
			callback(error || null, error ? null : self.Data.ByID[Number(id)] || null);
		});
	},

	Nearest: function (latitude, longitude, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		options = options || {};

		this.Load(function (error) {
			var best = null;
			var distance = Infinity;
			var cosine = Math.cos(Number(latitude) * Math.PI / 180);

			if (error) {
				callback(error);

				return;
			}

			self.Data.List.forEach(function (entry) {
				var city = entry.City;
				var dx;
				var dy;
				var value;

				if (options.Country && city.Country !== options.Country) return;

				dx = (city.Longitude - Number(longitude)) * cosine;
				dy = city.Latitude - Number(latitude);
				value = dx * dx + dy * dy;

				if (value < distance) {
					distance = value;
					best = city;
				}
			});

			callback(null, best);
		});
	},

	Clock: function (city, date) {
		var zone = typeof city === 'string' ? city : city && city.TimeZone;
		var parts = {};
		var offset;

		date = date || new Date();

		new Intl.DateTimeFormat('en-US', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset'}).formatToParts(date).forEach(function (part) {
			parts[part.type] = part.value;
		});

		offset = String(parts.timeZoneName || '').replace(/^GMT/, '') || '+00:00';

		return {Date: parts.year + '-' + parts.month + '-' + parts.day, Time: parts.hour + ':' + parts.minute, Offset: offset, TimeZone: zone};
	},

	Label: function (city) {
		return [city.Name, this.Place(city)].filter(Boolean).join(', ');
	},

	Place: function (city) {
		var country = city.Country;

		try {
			country = new Intl.DisplayNames([this.Language()], {type: 'region'}).of(city.Country) || city.Country;
		}
		catch (error) {
			country = city.Country;
		}

		return [city.Region && city.Region !== city.Name ? city.Region : '', country].filter(Boolean).join(', ');
	}
});
