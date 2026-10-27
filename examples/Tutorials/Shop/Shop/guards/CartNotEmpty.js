/* The checkout wants something in the cart: an empty cart goes back to the catalogue. */
Elemenx.Guard('CartNotEmpty', function () {
	return this.$Service('Cart').Count() > 0 ? true : '/';
});
