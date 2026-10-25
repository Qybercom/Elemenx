/*
 * The widget of the cart, in the header of the page: what is in it and its total, and the checkout, which the page
 * hears as the checkout event of the element of the widget ({Items, Total}).
 */
Elemenx.Component('CartButton', {
	$TemplateURL: 'CartButton.html',
	$StyleURL: 'CartButton.css',
	Currency: 'EUR',
	Count: 0,
	Total: 0,

	$OnCreate: function () {
		var self = this;
		var cart = this.$Service('Cart');

		this.Read = function () {
			self.Count = cart.Count();
			self.Total = cart.Total();
		};

		/* An amount in the currency of the widget (a template calls it). */
		this.Money = function (value) {
			return value.toFixed(2) + ' ' + self.Currency;
		};

		this.Read();

		cart.OnChange(this.Read);
	},

	$OnDestroy: function () {
		this.$Service('Cart').OffChange(this.Read);
	},

	CheckedOut: function () {
		var cart = this.$Service('Cart');

		this.$Emit('checkout', {Items: cart.Items, Total: cart.Total()});

		cart.Clear();
	}
});
