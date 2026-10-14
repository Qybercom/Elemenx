/*
 * The emoji of Unicode, drawn by the fonts of the system: their groups, names and keywords for search, skin tones and
 * the emoji used last. The data loads once, when it is first needed: data/emoji.json (the groups of emoji-test.txt of
 * Unicode, with the English names) and the names and keywords of CLDR in English and in the language of the user,
 * data/emoji-<locale>.json (Locales lists the ones there are; Locale, the language of the page by default).
 * Load(callback) calls back (error, groups). A group is {ID, Label, Icon, Emoji: [{Char, Name, Version, Tone, Region}]};
 * Version is the version of Emoji that brought it, Tone is true for an emoji that takes a skin tone, Region is the
 * region of a flag. Name(emoji) is its name in Locale.
 * Search(text, limit) finds emoji by every word of the text: the names and the keywords of the loaded languages
 * (LoadLanguage(locale, callback) adds the keywords of one more language of Locales; Keywords(locale, map) adds any:
 * {'😀': 'words'}).
 * Tone(value) is the skin tone of the user, 0 (none) to 5, remembered; Toned(char, tone) applies it.
 * Recent(limit) lists the emoji used last, Used(char) records one (remembered as well).
 * Supported(char) tells whether the system draws an emoji as one picture: a font without it draws a box or its parts
 * (flags on Windows, the newest emoji on older systems), and the pickers leave such emoji out.
 */
Elemenx.Service('Emoji', {
	Library: 'ElemenxUI',
	StorageKey: 'elemenx-emoji',
	Persist: true,
	Locale: '',
	Locales: ['en', 'ru'],
	Limit: 32,
	Tones: ['', '🏻', '🏼', '🏽', '🏾', '🏿'],

	$OnCreate: function () {
		var library = Elemenx.Library(this.Library);
		var stored = null;

		this.Root = String(library && library.$Root || '').replace(/\/$/, '');
		this.State = 'idle';
		this.Callbacks = [];
		this.Data = null;
		this.Index = {};
		this.Words = {};
		this.Names = {};
		this.Extra = [];
		this.Support = {};
		this.Current = 0;
		this.Last = [];

		try {
			stored = this.Persist ? JSON.parse(window.localStorage.getItem(this.StorageKey) || 'null') : null;
		}
		catch (error) {
			stored = null;
		}

		if (stored) {
			this.Current = Math.max(0, Math.min(5, Number(stored.Tone) || 0));
			this.Last = Array.isArray(stored.Recent) ? stored.Recent.slice(0, this.Limit) : [];
		}
	},

	/* The language of the names: Locale, or the language of the page, when there are names in it; English otherwise. */
	Language: function () {
		var locale = String(this.Locale || (typeof navigator !== 'undefined' && navigator.language) || 'en').toLowerCase().split('-')[0];

		return this.Locales.indexOf(locale) !== -1 ? locale : 'en';
	},

	/* Loads the emoji, and the names and keywords in English and in Language(), once; callback (error, groups). */
	Load: function (callback) {
		var self = this;
		var locales = ['en'].concat(this.Language() === 'en' ? [] : [this.Language()]).concat(this.Extra.filter(function (locale) {
			return locale !== 'en' && locale !== self.Language();
		}));
		var remaining = locales.length + 1;
		var failed = null;
		var data = null;
		var words = {};

		if (this.State === 'ready') {
			if (callback)
				callback(null, this.Data.Groups);

			return;
		}

		if (callback)
			this.Callbacks.push(callback);

		if (this.State === 'loading') return;

		this.State = 'loading';

		function done (error) {
			var callbacks;
			var i = 0;

			failed = failed || error;
			remaining--;

			if (remaining) return;

			if (!failed)
				self.Prepare(data, words);

			self.State = failed ? 'idle' : 'ready';
			callbacks = self.Callbacks;
			self.Callbacks = [];

			while (i < callbacks.length) {
				callbacks[i](failed, failed ? undefined : self.Data.Groups);

				i++;
			}
		}

		this.Fetch(this.Root + '/data/emoji.json', function (error, value) {
			data = value;

			done(error);
		});

		locales.forEach(function (locale) {
			self.Fetch(self.Root + '/data/emoji-' + locale + '.json', function (error, value) {
				words[locale] = value || {};

				done(null);
			});
		});
	},

	/* Reads a data file, carried by a bundle (Elemenx.Resource) or fetched. */
	Fetch: function (url, callback) {
		Elemenx.Resource.Load(url, function (error, text) {
			var value;

			if (error) {
				callback(new Error('Elemenx Emoji data failed to load: ' + url));

				return;
			}

			try {
				value = JSON.parse(text);
			}
			catch (exception) {
				callback(exception);

				return;
			}

			callback(null, value);
		});
	},


	/* Turns the rows of the data into emoji, indexes them by their character without variation selectors, and reads names. */
	Prepare: function (data, words) {
		var language = this.Language();
		var groups = [];
		var group;
		var row;
		var emoji;
		var locale;
		var char;
		var i = 0;
		var j;

		while (i < data.Groups.length) {
			group = {ID: data.Groups[i].ID, Label: data.Groups[i].Label, Icon: data.Groups[i].Icon, Emoji: []};
			j = 0;

			while (j < data.Groups[i].Emoji.length) {
				row = data.Groups[i].Emoji[j];
				emoji = {Char: row[0], Name: row[1], Version: row[2], Tone: row[3] === 1, Region: row[4] || '', Group: group.ID};

				group.Emoji.push(emoji);

				this.Index[this.Plain(emoji.Char)] = emoji;

				j++;
			}

			groups.push(group);

			i++;
		}

		this.Data = {Version: data.Version, Groups: groups};

		for (locale in words) {
			if (!words.hasOwnProperty(locale)) continue;

			for (char in words[locale]) {
				if (!words[locale].hasOwnProperty(char)) continue;

				this.Keywords(locale, this.Pair(char, words[locale][char][0] + '|' + words[locale][char][1]));

				if (locale === language && words[locale][char][0])
					this.Names[this.Plain(char)] = words[locale][char][0];
			}
		}
	},

	/* Adds the keywords of one more language to the search; callback (error). */
	LoadLanguage: function (locale, callback) {
		var self = this;

		if (this.Locales.indexOf(locale) === -1) {
			if (callback)
				callback(new Error('Elemenx Emoji has no keywords in ' + locale));

			return;
		}

		if (this.Extra.indexOf(locale) !== -1 || locale === 'en' || locale === this.Language()) {
			if (callback)
				this.Load(function (error) {
					callback(error || null);
				});

			return;
		}

		this.Extra.push(locale);

		if (this.State !== 'ready') {
			this.Load(callback ? function (error) {
				callback(error || null);
			} : null);

			return;
		}

		this.Fetch(this.Root + '/data/emoji-' + locale + '.json', function (error, value) {
			var char;

			for (char in value || {}) {
				if (value.hasOwnProperty(char))
					self.Keywords(locale, self.Pair(char, value[char][0] + '|' + value[char][1]));
			}

			if (callback)
				callback(error || null);
		});
	},

	Pair: function (key, value) {
		var pair = {};

		pair[key] = value;

		return pair;
	},

	Plain: function (char) {
		return String(char).replace(/️/g, '');
	},

	Groups: function () {
		return this.Data ? this.Data.Groups : [];
	},

	/* The emoji of a character (with or without its variation selector and skin tone), or null. */
	Find: function (char) {
		return this.Index[this.Plain(char).replace(/\uD83C[\uDFFB-\uDFFF]/g, '')] || null;
	},

	/* Adds keywords of a language: {'😀': 'smile happy'}. */
	Keywords: function (locale, map) {
		var char;
		var key;

		for (char in map) {
			if (!map.hasOwnProperty(char)) continue;

			key = this.Plain(char);
			this.Words[key] = (this.Words[key] ? this.Words[key] + ' ' : '') + String(map[char]).toLowerCase();
		}

		return locale;
	},

	/* The name of an emoji in Locale (CLDR), otherwise the name of the region of a flag, otherwise its English name. */
	Name: function (emoji) {
		var regions;

		if (!emoji) return '';

		if (this.Names[this.Plain(emoji.Char)])
			return this.Names[this.Plain(emoji.Char)];

		if (emoji.Region && typeof Intl !== 'undefined' && Intl.DisplayNames) {
			try {
				regions = this.Regions || (this.Regions = new Intl.DisplayNames([this.Locale || navigator.language || 'en'], {type: 'region'}));

				return regions.of(emoji.Region);
			}
			catch (error) {
				return emoji.Name;
			}
		}

		return emoji.Name;
	},

	/*
	 * The emoji whose name, keywords or region name start a word with every word of text (limit: 120), the best first:
	 * the name itself, then a name that starts with the text, then the other names, then the keywords.
	 */
	Search: function (text, limit) {
		var self = this;
		var query = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
		var words = query.split(' ').filter(Boolean);
		var found = [];
		var groups = this.Groups();
		var i = 0;
		var j;

		limit = limit || 120;

		if (!words.length) return found;

		function clean (value) {
			return ' ' + String(value).toLowerCase().replace(/[^\s\wЀ-ӿ]+/g, ' ').replace(/\s+/g, ' ').trim();
		}

		function score (emoji) {
			var name = clean(self.Name(emoji));
			var all = name + clean(emoji.Name) + clean(self.Words[self.Plain(emoji.Char)] || '') + (emoji.Region ? ' ' + emoji.Region.toLowerCase() : '');
			var named = words.every(function (word) {
				return name.indexOf(' ' + word) !== -1;
			});

			if (!words.every(function (word) {
				return all.indexOf(' ' + word) !== -1;
			})) return -1;

			if (name === ' ' + query) return 0;
			if (name.indexOf(' ' + query) === 0) return 1;

			return named ? 2 : 3;
		}

		while (i < groups.length) {
			j = 0;

			while (j < groups[i].Emoji.length) {
				if (score(groups[i].Emoji[j]) !== -1)
					found.push({Emoji: groups[i].Emoji[j], Score: score(groups[i].Emoji[j]), Order: found.length});

				j++;
			}

			i++;
		}

		return found.sort(function (x, y) {
			return x.Score - y.Score || x.Order - y.Order;
		}).slice(0, limit).map(function (entry) {
			return entry.Emoji;
		});
	},

	/* Tone() is the skin tone of the user (0 to 5); Tone(value) sets and remembers it. */
	Tone: function (value) {
		if (value === undefined) return this.Current;

		this.Current = Math.max(0, Math.min(5, Number(value) || 0));

		this.Store();

		return this.Current;
	},

	/* The emoji in a skin tone: the tone after its first character, where the emoji takes one. */
	Toned: function (char, tone) {
		var emoji = this.Find(char);
		var points;
		var first;

		tone = tone === undefined ? this.Current : Number(tone);

		if (!tone || !emoji || !emoji.Tone) return emoji ? emoji.Char : char;

		points = Array.from ? Array.from(emoji.Char) : emoji.Char.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g);
		first = points.shift();

		if (points[0] === '️')
			points.shift();

		return first + this.Tones[tone] + points.join('');
	},

	/* The emoji used last, the newest first. */
	Recent: function (limit) {
		var self = this;

		return this.Last.map(function (char) {
			return self.Find(char);
		}).filter(Boolean).slice(0, limit || this.Limit);
	},

	Used: function (char) {
		var emoji = this.Find(char);
		var index;

		if (!emoji) return;

		index = this.Last.indexOf(emoji.Char);

		if (index !== -1)
			this.Last.splice(index, 1);

		this.Last.unshift(emoji.Char);

		this.Last = this.Last.slice(0, this.Limit);

		this.Store();
	},

	Store: function () {
		try {
			if (this.Persist)
				window.localStorage.setItem(this.StorageKey, JSON.stringify({Tone: this.Current, Recent: this.Last}));
		}
		catch (error) {
			/* Storage may be unavailable (private mode); the choices still hold on this page. */
		}
	},

	/*
	 * Whether the system draws the emoji as one picture. The emoji of the first versions of Unicode are drawn
	 * everywhere; a newer one, a sequence or a flag is drawn on a canvas and compared with the box of a missing
	 * character and with the width of one emoji, and a flag must have color (Windows draws the letters of a flag).
	 */
	Supported: function (char) {
		var emoji = this.Find(char);
		var context;

		if (this.Support.hasOwnProperty(char)) return this.Support[char];

		/* The emoji of Emoji 11 and before are drawn by every system in use. */
		if (emoji && !emoji.Region && emoji.Version <= 11) return true;

		context = this.Context();

		if (!context) return true;

		this.Support[char] = this.Draw(context, char) !== this.Missing && context.measureText(char).width <= this.Width * 1.4 && (!emoji || !emoji.Region || this.Colored(context));

		return this.Support[char];
	},

	Context: function () {
		var canvas;
		var context;

		if (this.Drawing !== undefined) return this.Drawing;

		canvas = document.createElement('canvas');
		context = canvas.getContext && canvas.getContext('2d', {willReadFrequently: true});

		if (!context) {
			this.Drawing = null;

			return null;
		}

		canvas.width = canvas.height = 24;

		context.font = '20px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
		context.textBaseline = 'top';

		this.Drawing = context;
		this.Missing = this.Draw(context, '\uDB7F\uDFFE');
		this.Width = context.measureText('😀').width || 20;

		return context;
	},

	/* Whether the last drawing has color: a flag is drawn in color, the letters of a missing flag are not. */
	Colored: function (context) {
		var pixels = context.getImageData(0, 0, 24, 24).data;
		var count = 0;
		var i = 0;

		while (i < pixels.length) {
			if (pixels[i + 3] > 128 && Math.max(Math.abs(pixels[i] - pixels[i + 1]), Math.abs(pixels[i + 1] - pixels[i + 2]), Math.abs(pixels[i] - pixels[i + 2])) > 48)
				count++;

			i += 4;
		}

		return count > 12;
	},

	/* A fingerprint of the pixels of a character drawn on the canvas. */
	Draw: function (context, char) {
		var pixels;
		var sum = 0;
		var i = 0;

		context.clearRect(0, 0, 24, 24);
		context.fillText(char, 0, 0);

		pixels = context.getImageData(0, 0, 24, 24).data;

		while (i < pixels.length) {
			sum = (sum * 31 + pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7 + pixels[i + 3] * 11) % 2147483647;

			i += 8;
		}

		return sum;
	}
});
