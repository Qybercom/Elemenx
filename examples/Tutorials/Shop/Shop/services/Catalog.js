/* The products of the shop. A real shop loads them from its server (this.$Network().XHR); here they are a list. */
Elemenx.Service('Catalog', {
	Products: [
		{ID: 'lamp', Title: 'Brass lamp', Category: 'light', Price: 89, OldPrice: 109, Badge: 'Sale', Rating: 4.5, Reviews: 31, Colors: ['brass', 'black'], Text: 'A desk lamp of brass, with a linen shade.'},
		{ID: 'pendant', Title: 'Glass pendant', Category: 'light', Price: 129, Rating: 4, Reviews: 12, Colors: ['clear', 'smoke'], Text: 'A pendant of blown glass for a dining table.'},
		{ID: 'shelf', Title: 'Oak shelf', Category: 'furniture', Price: 54.5, Rating: 5, Reviews: 8, Colors: ['oak', 'walnut'], Text: 'A wall shelf of oiled oak.'},
		{ID: 'stool', Title: 'Pine stool', Category: 'furniture', Price: 39, Badge: 'New', Rating: 4.5, Reviews: 5, Colors: ['pine'], Text: 'A low stool for a kitchen or a hall.'},
		{ID: 'jug', Title: 'Clay jug', Category: 'kitchen', Price: 23, Rating: 4, Reviews: 40, Colors: ['white', 'sand'], Text: 'A jug of glazed clay, a litre.'},
		{ID: 'board', Title: 'Bread board', Category: 'kitchen', Price: 19, Rating: 3.5, Reviews: 3, Colors: ['beech'], Text: 'A board of beech for bread and cheese.'}
	],
	Swatches: {brass: '#b5a642', black: '#222222', clear: '#dfe7ea', smoke: '#6d6d6d', oak: '#c19a6b', walnut: '#5c4033', pine: '#e3c88f', white: '#f4f1ea', sand: '#d8c3a5', beech: '#d9b38c'},

	All: function () {
		return this.Products.slice();
	},

	Find: function (id) {
		return this.Products.filter(function (product) {
			return product.ID === id;
		})[0] || null;
	},

	/* The colors of a product as ProductCard takes them. */
	Colors: function (product) {
		var swatches = this.Swatches;

		return product.Colors.map(function (name) {
			return {Value: name, Color: swatches[name], Label: name};
		});
	}
});
