/*
 * The list of the posts: all of them on /, the ones of a tag on /tag/:tag (the router gives the tag in $Params).
 * The list loads once; the tag of the route filters it in the template.
 */
Elemenx.Component('PostList', {
	$TemplateURL: 'PostList.html',
	$Title: 'Field notes',
	Posts: [],
	Loading: true,
	Failed: '',

	$OnCreate: function () {
		var self = this;

		/* The posts of a tag, or all of them (a template calls it with the route, so it follows the route). */
		this.Shown = function (posts, params) {
			return posts.filter(function (post) {
				return !params.tag || post.Tags.indexOf(params.tag) !== -1;
			});
		};

		this.$Service('Posts').List(function (error, posts) {
			self.Loading = false;
			self.Failed = error ? error.message : '';
			self.Posts = posts || [];
		});
	}
});
