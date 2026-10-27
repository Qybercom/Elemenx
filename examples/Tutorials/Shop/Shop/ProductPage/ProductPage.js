/* The page of a product: its text, its price, a choice of its colors and the cart. $Params.id names it. */
Elemenx.Component('ProductPage', {
	$TemplateURL: 'ProductPage.html',
	Color: '',

	$OnCreate: function () {
		var catalog = this.$Service('Catalog');

		this.Product = function (id) {
			return catalog.Find(id);
		};

		this.Options = function (product) {
			return product ? catalog.Colors(product).map(function (color) {
				return {Value: color.Value, Label: color.Label};
			}) : [];
		};
	},

	$OnReady: function () {
		var product = this.$Service('Catalog').Find(this.$Params.id);
		if (product)
			this.$Title(product.Title + ' · Old Town Goods');
	},

	Picked: function (value) {
		this.Color = value;
	},

	Add: function () {
		var product = this.$Service('Catalog').Find(this.$Params.id);

		this.$Service('Cart').Add(product, this.Color || product.Colors[0]);
		this.$Service('Toast').Show({Message: product.Title + ' is in the cart.', Variant: 'success', Duration: 2500});
	}
});
