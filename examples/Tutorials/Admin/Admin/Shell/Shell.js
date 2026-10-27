/*
 * The frame of the panel: for a signed-in user a sidebar of the pages and a header with the user, the page of the
 * route beside them; for anyone else the page alone (the page to sign in). It follows the Session.
 */
Elemenx.Component('Shell', {
	$TemplateURL: 'Shell.html',
	$StyleURL: 'Shell.css',
	User: null,
	Path: '/',
	Pages: [{ID: '/', Label: 'Dashboard', Icon: 'chart'}, {ID: '/users', Label: 'Users', Icon: 'users'}],
	UserMenu: [{ID: 'out', Label: 'Sign out', Icon: 'logout'}],

	$OnCreate: function () {
		var self = this;
		var session = this.$Service('Session');

		this.Follow = function (user) {
			self.User = user;
		};

		this.Follow(session.User());

		session.OnChange(this.Follow);
	},

	/* The page shown, for the sidebar: the path where each navigation ends. */
	$OnReady: function () {
		var self = this;

		this.Path = location.pathname;

		this.$Router().On('NavigationEnd', function (context) {
			self.Path = context.$To.Path;
		});
	},

	$OnDestroy: function () {
		this.$Service('Session').OffChange(this.Follow);
	},

	/* A page of the sidebar: the router goes there (the current one is the path of the route). */
	Opened: function (item) {
		this.$Router().Go(item.ID);
	},

	Chosen: function () {
		this.$Service('Session').SignOut();
		this.$Router().Go('/login');
	}
});
