/* The frame: the name of the collection, the links of its kinds (the current one marked), the page of the route. */
Elemenx.Component('Layout', {
	$TemplateURL: 'Layout.html',
	$StyleURL: 'Layout.css',
	Path: '/',
	Links: [
		{Path: '/', Label: 'Home'},
		{Path: '/browse/films', Label: 'Films'},
		{Path: '/browse/music', Label: 'Music'},
		{Path: '/browse/games', Label: 'Games'}
	],

	$OnReady: function () {
		var self = this;

		this.Path = location.pathname;

		this.$Router().On('NavigationEnd', function (context) {
			self.Path = context.$To.Path;
		});
	},

	Active: function (path) {
		return path === '/' ? this.Path === '/' : this.Path.indexOf(path) === 0;
	}
});
