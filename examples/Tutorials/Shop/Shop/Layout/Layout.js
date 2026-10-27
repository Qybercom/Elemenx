/* The frame: the name of the shop, the button of the cart with its count, the cart in a drawer, the page of the route. */
Elemenx.Component('Layout', {
	$TemplateURL: 'Layout.html',
	$StyleURL: 'Layout.css',
	Open: false,
	Lines: [],
	Count: 0,
	Total: 0,

	$OnCreate: function () {
		var self = this;
		var cart = this.$Service('Cart');

		this.Read = function () {
			self.Lines = cart.Lines.slice();
			self.Count = cart.Count();
			self.Total = cart.Total();
		};

		this.Money = function (value) {
			return '€' + Number(value).toFixed(2);
		};

		this.Read();

		cart.OnChange(this.Read);
	},

	$OnDestroy: function () {
		this.$Service('Cart').OffChange(this.Read);
	},

	Show: function () {
		this.Open = true;
	},

	Hide: function () {
		this.Open = false;
	},

	Remove: function (event, node) {
		this.$Service('Cart').Remove(node.getAttribute('data-id'), node.getAttribute('data-color'));
	},

	Checkout: function () {
		this.Open = false;

		this.$Router().Go('/checkout');
	}
});
