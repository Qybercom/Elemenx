/* The widget of the reviews of a product: their rating, the reviews, and a form to add one (kept in the widget). */
Elemenx.Component('Reviews', {
	$TemplateURL: 'Reviews.html',
	$StyleURL: 'Reviews.css',
	Product: '',
	Items: [{Stars: 5, Text: 'Just what I needed.'}, {Stars: 4, Text: 'Good, came quickly.'}],
	Stars: 5,
	Text: '',

	$OnCreate: function () {
		/* The average of the stars of the reviews (a template calls it). */
		this.Average = function (items) {
			return items.length ? items.reduce(function (sum, item) {
				return sum + item.Stars;
			}, 0) / items.length : 0;
		};
	},

	Rated: function (value) {
		this.Stars = value;
	},

	Typed: function (value) {
		this.Text = value;
	},

	Sent: function (event) {
		event.preventDefault();

		if (!String(this.Text || '').trim()) return;

		this.Items = this.Items.concat([{Stars: this.Stars, Text: String(this.Text).trim()}]);
		this.Text = '';
	}
});
