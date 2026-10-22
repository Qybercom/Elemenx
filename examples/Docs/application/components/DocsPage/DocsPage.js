/*
 * A page of the reference: the navigation of all the pages (pages/index.json) beside the page of the route, read
 * from pages/<section>/<page>.<language>.md (the English page when the language has none). The text is shown by
 * Markdown; a block ```example holds a template that runs beside its code (DocsExample).
 */
Elemenx.Component('DocsPage', {
	$TemplateURL: 'DocsPage.html',
	$StyleURL: 'DocsPage.css',
	Index: [],
	Segments: [],
	Fallback: false,
	Missing: false,
	Loaded: '',

	$OnCreate: function () {
		var self = this;

		/* The language of the pages: the language of the page, without its region. */
		this.Lang = function () {
			return /^ru\b/i.test(Elemenx.Locale.Language()) ? 'ru' : 'en';
		};

		/* The page of the route: section/page, the start of the guide by default. */
		this.Current = function (params) {
			return params && params.section && params.page ? params.section + '/' + params.page : 'guide/start';
		};

		this.NavItems = function (index, language) {
			return (index || []).map(function (section) {
				return {
					ID: section.ID,
					Label: section.Title[language] || section.Title.en,
					Items: section.Pages.map(function (page) {
						return {ID: section.ID + '/' + page.ID, Label: page.Title ? page.Title[language] || page.Title.en : page.ID};
					})
				};
			});
		};

		/* The page of a route in a language, loaded when either changes (a hidden element of the template asks for it). */
		this.Load = function (current, language) {
			return {
				Render: function () {
					self.Fetch(current, language);
				}
			};
		};
	},

	$OnReady: function () {
		var self = this;

		Elemenx.Resource.Load('/pages/index.json', function (error, text) {
			if (!error)
				self.Index = JSON.parse(text).Sections;
		});
	},

	Fetch: function (current, language) {
		var self = this;
		var key = current + '.' + language;
		if (this.Loaded === key) return;

		this.Loaded = key;

		/* A server that answers every path with the page of the Application (for its routes) answers a missing page so. */
		function page (error, text) {
			return !error && !/^\s*<!DOCTYPE/i.test(text);
		}

		Elemenx.Resource.Load('/pages/' + current + '.' + language + '.md', function (error, text) {
			if (self.Loaded !== key) return;

			if (page(error, text)) {
				self.Show(text, false);

				return;
			}

			if (language === 'en') {
				self.Show('', false);

				self.Missing = true;

				return;
			}

			Elemenx.Resource.Load('/pages/' + current + '.en.md', function (failure, english) {
				if (self.Loaded !== key) return;

				self.Show(page(failure, english) ? english : '', page(failure, english));

				self.Missing = !page(failure, english);
			});
		});
	},

	/* The text cut into its parts: Markdown, and the blocks ```example between them. */
	Show: function (text, fallback) {
		var segments = [];
		var pattern = /^```example[^\n]*\n([\s\S]*?)^```[ \t]*$/gm;
		var last = 0;
		var match;

		/* The comments of a page (<!-- generated -->) are for its tools, not its readers. */
		text = text.replace(/<!--[\s\S]*?-->\n?/g, '');

		while ((match = pattern.exec(text))) {
			if (match.index > last)
				segments.push({Key: 'text-' + segments.length, Kind: 'text', Text: text.substring(last, match.index)});

			segments.push({Key: 'example-' + segments.length, Kind: 'example', Code: match[1].replace(/\n$/, '')});

			last = match.index + match[0].length;
		}

		if (last < text.length)
			segments.push({Key: 'text-' + segments.length, Kind: 'text', Text: text.substring(last)});

		this.Missing = false;
		this.Fallback = fallback;
		this.Segments = segments;

		window.scrollTo(0, 0);
	},

	Picked: function (item) {
		if (!item.Items)
			this.$Router().Go('/' + item.ID);
	}
});
