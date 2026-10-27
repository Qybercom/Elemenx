/*
 * A product of the catalogue: its card, and the cart for it. A component of its own for each product knows the
 * product its card is about, so its cart button needs no lookup.
 */
Elemenx.Component('ProductTile', {
	$TemplateURL: 'ProductTile.html',
	Product: null,

	$OnCreate: function () {
		var catalog = this.$Service('Catalog');

		this.Colors = function (product) {
			return catalog.Colors(product);
		};
	},

	Added: function (detail) {
		this.$Service('Cart').Add(this.Product, detail.Color || this.Product.Colors[0]);
		this.$Service('Toast').Show({Message: this.Product.Title + ' is in the cart.', Variant: 'success', Duration: 2500});
	}
});
