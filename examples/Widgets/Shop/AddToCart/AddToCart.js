/* The widget of a product: its price and a button that puts it in the one cart of the page (the added event too). */
Elemenx.Component('AddToCart', {
	$TemplateURL: 'AddToCart.html',
	$StyleURL: 'AddToCart.css',
	Product: '',
	Price: 0,
	Currency: 'EUR',
	Taken: 0,

	$OnCreate: function () {
		var self = this;
		var cart = this.$Service('Cart');

		this.Read = function () {
			self.Taken = cart.Items.filter(function (item) {
				return item.Product === self.Product;
			}).length;
		};

		this.Read();

		cart.OnChange(this.Read);
	},

	$OnDestroy: function () {
		this.$Service('Cart').OffChange(this.Read);
	},

	Added: function () {
		this.$Service('Cart').Add(this.Product, this.Price);

		this.$Emit('added', {Product: this.Product});
	}
});
