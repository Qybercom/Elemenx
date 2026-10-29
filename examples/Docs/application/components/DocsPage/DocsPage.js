/*
 * A page of the reference: the navigation of all the pages (pages/index.json) beside the page of the route, read from
 * pages/<section>/<page>.<language>.md (the English page when the language has none); the components in the navigation
 * by their groups, the group of the page open. The text is shown by Markdown; a block ```example holds a template that
 * runs beside its code (DocsExample), a block ```diagram an SVG drawn in the colors of the theme. The page of a
 * component, a service or a directive ends with its source, read from the Library: a listing for each of its files (its
 * template, its script, its stylesheet), a tab each. Beside the page, on a wide screen, its contents: its headings, the
 * one read now marked as the page scrolls; a press goes to one. An article of a tutorial (data/tutorials.json) offers
 * its finished project under its title: to download (tutorials/<Project>.zip), and, when it runs without a server of
 * its own, as a demo on the page (tutorials/<Project>/, in a frame of a blob: URL) or in a tab of its own.
 */
Elemenx.Component('DocsPage', {
	$TemplateURL: 'DocsPage.html',
	$StyleURL: 'DocsPage.css',
	Index: [],
	Segments: [],
	Fallback: false,
	Missing: false,
	Loaded: '',
	Sources: [],
	Headings: [],
	Active: '',
	Source: '',
	Tutorials: [],
	/* The demo of the tutorial of the page: shown, its page (a blob: URL), or not loaded. */
	DemoOpen: false,
	Demo: '',
	DemoBusy: false,
	DemoFailed: false,
	/* The width of the navigation the reader dragged it to (pixels; 0: its own), remembered. */
	NavWidth: 0,

	$OnCreate: function () {
		var self = this;
		var diagrams = {};

		try {
			this.NavWidth = Number(window.localStorage.getItem('elemenx-docs-nav')) || 0;
		}
		catch (error) {
			/* No storage (a private window): the navigation keeps its own width. */
		}

		/*
		 * A block ```diagram: an SVG of the page itself, put inline so its colors are the tokens of the theme
		 * (var(--elemenx-text)...) and follow the scheme. One element for each text, so a new render moves nothing.
		 */
		this.Diagram = function (code) {
			if (!diagrams[code])
				diagrams[code] = document.importNode(new DOMParser().parseFromString(code, 'image/svg+xml').documentElement, true);

			return diagrams[code];
		};

		/* The language of the pages: the language of the page, without its region. */
		this.Lang = function () {
			return /^ru\b/i.test(Elemenx.Locale.Language()) ? 'ru' : 'en';
		};

		/* The page of the route: section/page, the start of the guide by default. */
		this.Current = function (params) {
			return params && params.section && params.page ? params.section + '/' + params.page : 'guide/start';
		};

		/* The source shown: the file picked, or the first one (its script, for a page of a service or a directive). */
		this.SourceShown = function (sources, source) {
			return sources.some(function (file) {
				return file.ID === source;
			}) ? source : sources.length ? sources[0].ID : '';
		};

		this.SourceFile = function (sources, source) {
			var shown = self.SourceShown(sources, source);

			return sources.filter(function (file) {
				return file.ID === shown;
			})[0] || {Language: 'text', Text: '', Label: ''};
		};

		/* The sections and their pages; a section of groups (the components) has a branch for each group. */
		this.NavItems = function (index, language) {
			return (index || []).map(function (section) {
				function item (page) {
					return {ID: section.ID + '/' + page.ID, Label: page.Title ? page.Title[language] || page.Title.en : page.ID};
				}

				return {
					ID: section.ID,
					Label: section.Title[language] || section.Title.en,
					Items: section.Groups ? section.Groups.map(function (group) {
						return {
							ID: section.ID + ':' + group.ID,
							Label: group.Title[language] || group.Title.en,
							Items: section.Pages.filter(function (page) {
								return page.Group === group.ID;
							}).map(item)
						};
					}) : section.Pages.map(item)
				};
			});
		};

		/* The branches open: the section of the page, and its group in a section of groups. */
		this.Expanded = function (index, current) {
			var parts = current.split('/');
			var section = (index || []).filter(function (entry) {
				return entry.ID === parts[0];
			})[0];
			var page = section ? section.Pages.filter(function (entry) {
				return entry.ID === parts[1];
			})[0] : null;

			return page && page.Group ? [parts[0], parts[0] + ':' + page.Group] : [parts[0]];
		};

		/* The project of the article of a tutorial, or null. */
		this.Tutorial = function (current, tutorials) {
			var parts = String(current).split('/');

			return parts[0] === 'tutorials' ? (tutorials || []).filter(function (entry) {
				return entry.Page === parts[1];
			})[0] || null : null;
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

		/* The heading read now: the last one above the top of the window, under the header. */
		this.OnScroll = function () {
			var active = '';

			self.Headings.forEach(function (heading) {
				var node = document.getElementById(heading.ID);
				if (node && node.getBoundingClientRect().top < 120)
					active = heading.ID;
			});

			if (!active && self.Headings.length)
				active = self.Headings[0].ID;

			if (self.Active !== active)
				self.Active = active;
		};

		window.addEventListener('scroll', this.OnScroll, {passive: true});

		/*
		 * The headings of the page as it is drawn (its Markdown, its source, later than the page itself): the contents
		 * are made again on the frame after a change of the article, once a frame at most.
		 */
		this.Frame = 0;
		this.Watcher = new MutationObserver(function () {
			if (self.Frame) return;

			self.Frame = window.requestAnimationFrame(function () {
				self.Frame = 0;

				self.Outline(self.$Element().querySelector('.docs-article'));
			});
		});

		this.Watcher.observe(this.$Element().querySelector('.docs-article'), {childList: true, subtree: true});

		Elemenx.Resource.Load('/pages/index.json', function (error, text) {
			if (!error)
				self.Index = JSON.parse(text).Sections;
		});

		Elemenx.Resource.Load('/data/tutorials.json', function (error, text) {
			if (!error && !/^\s*<!DOCTYPE/i.test(text))
				self.Tutorials = JSON.parse(text);
		});
	},

	Fetch: function (current, language) {
		var self = this;
		var key = current + '.' + language;
		if (this.Loaded === key) return;

		this.Loaded = key;

		this.Read(current, key);
		this.Shut();

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

	/* A short hash of a text (djb2), for the keys of the examples. */
	Hash: function (text) {
		var hash = 5381;
		var i = 0;

		while (i < text.length) {
			hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;

			i++;
		}

		return hash.toString(36);
	},

	/*
	 * The text cut into its parts: Markdown, the blocks ```example (a live example) and the other fenced blocks of code
	 * (a CodeView of their language, that copies and folds) between them.
	 */
	Show: function (text, fallback) {
		var segments = [];
		var pattern = /^```([\w+#.-]*)[^\n]*\n([\s\S]*?)^```[ \t]*$/gm;
		var last = 0;
		var match;

		/* The comments of a page (<!-- generated -->) are for its tools, not its readers. */
		text = text.replace(/<!--[\s\S]*?-->\n?/g, '');

		while ((match = pattern.exec(text))) {
			if (match.index > last)
				segments.push({Key: 'text-' + segments.length, Kind: 'text', Text: text.substring(last, match.index)});

			/*
			 * A segment of code is keyed by its code too: the example of another page at the same place is another
			 * component, made for its own code (a key by the place alone kept the example of the first page shown).
			 */
			if (match[1] === 'example') segments.push({Key: 'example-' + segments.length + '-' + this.Hash(match[2]), Kind: 'example', Code: match[2].replace(/\n$/, '')});
			else if (match[1] === 'diagram') segments.push({Key: 'diagram-' + segments.length + '-' + this.Hash(match[2]), Kind: 'diagram', Code: match[2]});
			else segments.push({Key: 'code-' + segments.length + '-' + this.Hash(match[2]), Kind: 'code', Language: match[1] || 'text', Code: match[2].replace(/\n$/, '')});

			last = match.index + match[0].length;
		}

		if (last < text.length)
			segments.push({Key: 'text-' + segments.length, Kind: 'text', Text: text.substring(last)});

		this.Missing = false;
		this.Fallback = fallback;
		this.Segments = segments;

		window.scrollTo(0, 0);
	},

	/*
	 * The files of the page of a component (its .html, .js and .css), a service or a directive (its .js), read from the
	 * root of ElemenxUI; a file that is not there (a bundle carries no sources) is left out.
	 */
	Read: function (current, key) {
		var self = this;
		var parts = current.split('/');
		var library = Elemenx.Library('ElemenxUI');
		var root = String(library && library.$Root || '').replace(/\/$/, '');
		var name = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].substring(1) : '';
		var languages = {html: 'html', js: 'js', css: 'css'};
		var files = [];
		var found = [];
		var remaining;

		if (parts[0] === 'components') {
			files = ['html', 'js', 'css'].map(function (extension) {
				return {Name: name + '.' + extension, URL: root + '/components/' + name + '/' + name + '.' + extension, Language: languages[extension]};
			});
		}
		else if (parts[0] === 'services' || parts[0] === 'directives') {
			files = [{Name: name + '.js', URL: root + '/' + parts[0] + '/' + name + '.js', Language: 'js'}];
		}

		this.Sources = [];
		this.Source = '';

		remaining = files.length;

		files.forEach(function (file, index) {
			Elemenx.Resource.Load(file.URL, function (error, text) {
				if (self.Loaded !== key) return;

				if (!error && !/^\s*<!DOCTYPE/i.test(text))
					found[index] = {ID: file.Name, Label: file.Name, Language: file.Language, Text: text.replace(/\r\n/g, '\n').replace(/\s+$/, '')};

				remaining--;

				if (!remaining)
					self.Sources = found.filter(Boolean);
			});
		});
	},

	SourcePicked: function (id) {
		this.Source = id;
	},

	/* The demo of the tutorial shown or hidden: its page loaded once, made a blob: URL (its Router keeps its routes in memory there). */
	DemoToggled: function () {
		var self = this;
		var entry = this.Tutorial(this.Current(this.$Params), this.Tutorials);
		var key = this.Loaded;

		this.DemoOpen = !this.DemoOpen;

		if (!this.DemoOpen || this.Demo || this.DemoBusy || !entry) return;

		this.DemoBusy = true;
		this.DemoFailed = false;

		Elemenx.Resource.Load('/tutorials/' + entry.Project + '/index.html', function (error, text) {
			if (self.Loaded !== key) return;

			self.DemoBusy = false;

			/* A server that answers every path with the page of the reference has no demo there. */
			if (error || !/<script id="elemenx">/.test(text)) {
				self.DemoFailed = true;

				return;
			}

			/* Its files (its dictionaries, its data, its images) are beside its page: the folder is the base of its URLs. */
			text = text.replace(/<head([^>]*)>/i, function (head) {
				return head + '<base href="' + location.origin + '/tutorials/' + entry.Project + '/">';
			});

			self.Demo = URL.createObjectURL(new Blob([text], {type: 'text/html'}));
		});
	},

	DemoTab: function () {
		if (this.Demo)
			window.open(this.Demo, '_blank');
	},

	/* The demo of another page goes: hidden, its page let go. */
	Shut: function () {
		if (this.Demo)
			URL.revokeObjectURL(this.Demo);

		this.Demo = '';
		this.DemoOpen = false;
		this.DemoBusy = false;
		this.DemoFailed = false;
	},

	$OnDestroy: function () {
		this.Shut();

		window.removeEventListener('scroll', this.OnScroll);
		window.cancelAnimationFrame(this.Frame);

		this.Watcher.disconnect();
	},

	/* The headings of an article (h2 and h3 of its text and of its source) with the IDs they are given. */
	Outline: function (article) {
		var used = {};
		var headings = [];

		if (!article) return;

		Array.prototype.forEach.call(article.querySelectorAll('.docs-segment h2, .docs-segment h3, .docs-source > h2'), function (node) {
			if (node.closest('.docs-example')) return;

			var text = node.textContent.trim();
			var id = 'docs-' + (text.toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]+/g, '-').replace(/^-+|-+$/g, '') || 'part');
			var base = id;
			var count = 1;

			while (used[id]) {
				count++;
				id = base + '-' + count;
			}

			used[id] = true;
			node.id = id;

			headings.push({ID: id, Text: text, Level: node.tagName === 'H3' ? 3 : 2});
		});

		if (JSON.stringify(headings) !== JSON.stringify(this.Headings))
			this.Headings = headings;

		if (this.OnScroll)
			this.OnScroll();
	},

	Jumped: function (event, node) {
		var target = document.getElementById(node.getAttribute('data-id'));
		if (target)
			target.scrollIntoView({behavior: 'smooth', block: 'start'});
	},

	/* The navigation dragged wider or narrower: its width from now on. */
	NavResized: function (event) {
		this.NavWidth = event.detail.Width;

		try {
			window.localStorage.setItem('elemenx-docs-nav', String(this.NavWidth));
		}
		catch (error) {
			/* No storage: the width holds for this visit. */
		}
	},

	Picked: function (item) {
		if (!item.Items)
			this.$Router().Go('/' + item.ID);
	}
});
