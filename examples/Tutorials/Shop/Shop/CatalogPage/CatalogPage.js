/* The catalogue: the products of a category (the tabs), each a ProductTile. */
Elemenx.Component('CatalogPage', {
	$TemplateURL: 'CatalogPage.html',
	$Title: 'Old Town Goods',
	Category: 'all',
	Categories: [{ID: 'all', Label: 'All'}, {ID: 'light', Label: 'Light'}, {ID: 'furniture', Label: 'Furniture'}, {ID: 'kitchen', Label: 'Kitchen'}],
	Products: [],

	$OnCreate: function () {
		this.Products = this.$Service('Catalog').All();

		this.Shown = function (products, category) {
			return products.filter(function (product) {
				return category === 'all' || product.Category === category;
			});
		};
	},

	Switched: function (id) {
		this.Category = id;
	}
});
