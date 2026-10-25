/*
 * The frame of the reference: its title, the search of the whole reference, the language of the pages (English or
 * Russian, kept for the next visit), the theme, and the page of the route under them. The search reads the text of
 * every page in the language (pages/search.<language>.json, the first time it is used): the pages that hold all the
 * words typed, those that name them in their title first, each with its section and the words around the first one
 * found; the arrows go through them, Enter or a press opens one, Escape closes the list.
 */
Elemenx.Component('DocsLayout', {
	$TemplateURL: 'DocsLayout.html',
	$StyleURL: 'DocsLayout.css',
	Languages: [{Value: 'en', Label: 'EN'}, {Value: 'ru', Label: 'RU'}],
	Language: 'en',
	Query: '',
	Results: [],
	Active: 0,
	Open: false,
	Loading: false,

	$OnCreate: function () {
		var self = this;
		var saved = null;
		var language;
		var texts = {};

		/* The text of the pages of a language, read once: callback(entries). */
		this.Texts = function (code, callback) {
			if (texts[code]) {
				callback(texts[code]);

				return;
			}

			self.Loading = true;

			Elemenx.Resource.Load('/pages/search.' + code + '.json', function (error, text) {
				self.Loading = false;
				texts[code] = error ? [] : JSON.parse(text);

				callback(texts[code]);
			});
		};

		try {
			saved = window.localStorage.getItem('elemenx-docs:language');
		}
		catch (error) {
			saved = null;
		}

		language = saved || (/^ru\b/i.test(navigator.language || '') ? 'ru' : 'en');

		this.Use(language);
	},

	Use: function (language) {
		var self = this;

		Elemenx.Locale.Language(language, function () {
			self.Language = language;
		});

		try {
			window.localStorage.setItem('elemenx-docs:language', language);
		}
		catch (error) {
			return;
		}
	},

	Chosen: function (value) {
		this.Use(value);

		this.Find();
	},

	Searched: function (value) {
		this.Query = value;
		this.Open = true;

		this.Find();
	},

	Opened: function () {
		this.Open = true;
	},

	/* The pages that hold every word of the query, the best first: [{ID, Section, Title, Parts}], 20 at most. */
	Find: function () {
		var self = this;
		var query = this.Query;
		var words = query.toLowerCase().split(/\s+/).filter(Boolean);

		if (!words.length) {
			this.Results = [];

			return;
		}

		this.Texts(this.Language === 'ru' ? 'ru' : 'en', function (entries) {
			var found = [];

			if (self.Query !== query) return;

			entries.forEach(function (entry) {
				var title = entry.Title.toLowerCase();
				var text = entry.Text.toLowerCase();
				var score = 0;

				if (!words.every(function (word) {
					return title.indexOf(word) !== -1 || text.indexOf(word) !== -1;
				})) return;

				words.forEach(function (word) {
					if (title === word) score += 1000;
					else if (title.indexOf(word) === 0) score += 300;
					else if (title.indexOf(word) !== -1) score += 100;

					/*
					 * A word in the first lines (the description of the page) counts more the sooner it comes, more than one said
					 * again and again further on.
					 */
					if (text.indexOf(word) !== -1 && text.indexOf(word) < 300)
						score += Math.round(60 * (1 - text.indexOf(word) / 300));

					score += Math.min(10, text.split(word).length - 1);
				});

				found.push({Entry: entry, Score: score});
			});

			found.sort(function (a, b) {
				return b.Score - a.Score;
			});

			self.Active = 0;
			self.Results = found.slice(0, 20).map(function (item) {
				return {ID: item.Entry.ID, Section: item.Entry.Section, Title: item.Entry.Title, Parts: self.Snippet(item.Entry.Text, words)};
			});
		});
	},

	/* The words around the first word found in a text, the words found marked: [{Text, Hit}]. */
	Snippet: function (text, words) {
		var lower = text.toLowerCase();
		var at = -1;
		var start;
		var piece;
		var parts = [];
		var pattern = new RegExp('(' + words.map(function (word) {
			return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}).join('|') + ')', 'gi');

		words.forEach(function (word) {
			var index = lower.indexOf(word);
			if (index !== -1 && (at === -1 || index < at))
				at = index;
		});

		start = Math.max(0, at - 60);
		piece = (start ? '…' : '') + text.substring(start, start + 180) + (start + 180 < text.length ? '…' : '');

		piece.split(pattern).forEach(function (chunk, index) {
			if (chunk)
				parts.push({Text: chunk, Hit: index % 2 === 1});
		});

		return parts;
	},

	/* The arrows go through the results, Enter opens the one marked, Escape closes them. */
	Keyed: function (event) {
		if (event.key === 'Escape') {
			this.Open = false;

			return;
		}

		if (!this.Open || !this.Results.length) return;

		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();

			this.Active = (this.Active + (event.key === 'ArrowDown' ? 1 : -1) + this.Results.length) % this.Results.length;
		}
		else if (event.key === 'Enter') {
			event.preventDefault();

			this.Go(this.Results[this.Active].ID);
		}
	},

	/* A press on a result keeps the focus in the search, so the list stays until the click opens the page. */
	Held: function (event) {
		event.preventDefault();
	},

	Went: function (event, node) {
		this.Go(node.getAttribute('data-id'));
	},

	/* The focus left the search: the list closes. */
	Blurred: function (event, node) {
		if (!node.contains(event.relatedTarget))
			this.Open = false;
	},

	Go: function (id) {
		this.Open = false;

		this.$Router().Go('/' + id);
	}
});
