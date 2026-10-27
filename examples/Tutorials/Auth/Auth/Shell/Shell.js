/* The frame of the pages: a header with the user (restored after a reload) and the page of the route. */
Elemenx.Component('Shell', {
	$TemplateURL: 'Shell.html',
	$StyleURL: 'Shell.css',
	User: null,

	$OnCreate: function () {
		var self = this;
		var session = this.$Service('Session');

		this.Listener = function (user) {
			self.User = user;
		};

		session.OnChange(this.Listener);
		session.Restore(function () {});
	},

	$OnDestroy: function () {
		this.$Service('Session').OffChange(this.Listener);
	},

	Out: function () {
		var self = this;

		this.$Service('Session').SignOut(function () {
			self.$Router().Replace('/');
		});
	}
});
