/*
 * The checkout: the order, a form of the address and the card (the fields of a card check the number by Luhn and the
 * date), and the steps of the order once it is placed. A real shop sends the card to its payment provider, never to
 * its own server.
 */
Elemenx.Component('CheckoutPage', {
	$TemplateURL: 'CheckoutPage.html',
	$Title: 'Checkout · Old Town Goods',
	Lines: [],
	Total: 0,
	Placed: '',

	$OnCreate: function () {
		var cart = this.$Service('Cart');

		this.Lines = cart.Lines.slice();
		this.Total = cart.Total();
	},

	Submitted: function (event) {
		this.Placed = 'A-' + String(Date.now()).slice(-6);

		this.$Service('Cart').Clear();
		this.$Service('Toast').Show({Title: 'Thank you, ' + event.Value.name + '!', Message: 'Your order ' + this.Placed + ' is placed.', Variant: 'success'});
	}
});
