/*
 * The comments of a post, kept in the storage of the browser (a real blog sends them to its server): a list, and a
 * field to add one.
 */
Elemenx.Component('Comments', {
	$TemplateURL: 'Comments.html',
	Post: '',
	Items: [],
	Draft: '',

	$OnCreate: function () {
		/* The storage of the component: its keys apart from the others of the page, and it goes with the component. */
		var store = this.$Storage.Local.Namespace('blog-comments');

		this.Store = function () {
			return store;
		};

		this.Items = store.Get(this.Post) || [];
	},

	Typed: function (value) {
		this.Draft = value;
	},

	Add: function () {
		var text = this.Draft.trim();
		if (!text) return;

		this.Items = this.Items.concat([{ID: Date.now(), Author: 'You', Text: text, Time: new Date().toISOString()}]);
		this.Draft = '';

		this.Store().Set(this.Post, this.Items);
	}
});
