/*
 * The cart of the shop: one for every widget of the page, as they are widgets of one Application. Add(product,
 * price) puts one in, Clear() empties it, Count() and Total() read it; OnChange(callback) / OffChange(callback) tell
 * the widgets when it changes.
 */
Elemenx.Service('Cart', {
	$OnCreate: function () {
		this.Items = [];
		this.Listeners = [];
	},

	Add: function (product, price) {
		this.Items = this.Items.concat([{Product: String(product), Price: Number(price) || 0}]);

		this.Changed();
	},

	Clear: function () {
		this.Items = [];

		this.Changed();
	},

	Count: function () {
		return this.Items.length;
	},

	Total: function () {
		return this.Items.reduce(function (sum, item) {
			return sum + item.Price;
		}, 0);
	},

	Changed: function () {
		this.Listeners.slice().forEach(function (callback) {
			callback();
		});
	},

	OnChange: function (callback) {
		this.Listeners.push(callback);
	},

	OffChange: function (callback) {
		this.Listeners = this.Listeners.filter(function (item) {
			return item !== callback;
		});
	}
});
