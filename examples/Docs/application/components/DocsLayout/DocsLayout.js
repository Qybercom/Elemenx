/*
 * The frame of the reference: its title, the language of the pages (English or Russian, kept for the next visit),
 * the theme, and the page of the route under them.
 */
Elemenx.Component('DocsLayout', {
	$TemplateURL: 'DocsLayout.html',
	$StyleURL: 'DocsLayout.css',
	Languages: [{Value: 'en', Label: 'EN'}, {Value: 'ru', Label: 'RU'}],
	Language: 'en',

	$OnCreate: function () {
		var saved = null;
		var language;

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
	}
});
