/*
 * A post: its Markdown from the Posts Service, shown by the Markdown component, and its comments. The router keeps
 * this component from one post to another, so it loads the post of the route each time a navigation ends.
 */
Elemenx.Component('PostPage', {
	$TemplateURL: 'PostPage.html',
	ID: '',
	Text: '',
	Failed: '',

	$OnReady: function () {
		var self = this;

		this.Open();

		this.$Router().On('NavigationEnd', function () {
			if (self.$Params.id !== self.ID)
				self.Open();
		});
	},

	Open: function () {
		var self = this;
		var id = this.$Params.id;

		this.ID = id;
		this.Text = '';
		this.Failed = '';

		this.$Service('Posts').Text(id, function (error, text) {
			if (id !== self.ID) return;

			if (error) {
				self.Failed = 'This post does not exist.';

				return;
			}

			self.Text = text;

			self.$Title((/^# (.+)$/m.exec(text) || ['', id])[1] + ' · Field notes');
		});
	}
});
