/* The window of the button: the page of the tab saved in one click, and the list, each page to open or to remove. */
Elemenx.Component('ReadingApp', {
	$TemplateURL: 'ReadingApp.html',
	$StyleURL: 'ReadingApp.css',
	Items: [],
	Saved: '',

	$OnCreate: function () {
		var self = this;
		var list = this.$Service('ReadingList');

		this.Listener = function (items) {
			self.Items = items;
		};

		list.OnChange(this.Listener);
		list.Load();
	},

	$OnDestroy: function () {
		this.$Service('ReadingList').OffChange(this.Listener);
	},

	Host: function (url) {
		try {
			return new URL(url).host || url;
		}
		catch (error) {
			return url;
		}
	},

	Save: function () {
		var self = this;

		this.$Service('ReadingList').Save(function (page) {
			self.Saved = page.Title;
		});
	},

	/* A button of a row: the URL of its page is on the row. */
	Opened: function (event) {
		this.$Service('ReadingList').Open(event.target.closest('[data-url]').getAttribute('data-url'));
	},

	Removed: function (event) {
		this.$Service('ReadingList').Remove(event.target.closest('[data-url]').getAttribute('data-url'));
	}
});
